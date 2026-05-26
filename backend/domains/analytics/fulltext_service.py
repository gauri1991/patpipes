"""
Patent Full Text Parsing Service (Module 6)

Stateless atomic steps for processing patent full text:
6.1 — Fetch full text (handled by enrichment, text already in Patent.abstract/claims/odp_raw_data)
6.2 — Parse & segment document sections
6.3 — Parse claims into hierarchy (independent vs dependent)
6.4 — Extract claim elements (limitations)
6.5 — Identify claim scope indicators
6.6 — Extract technical entities (uses spaCy if available)
6.7 — Extract novelty statements
"""

import re
import logging
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)


# ═══════════════════════════════════════════════════════════════
# Step 6.2: Parse & Segment Document Sections
# ═══════════════════════════════════════════════════════════════

SECTION_PATTERNS = [
    (r'(?:ABSTRACT|Abstract of the Disclosure)', 'abstract'),
    (r'(?:BACKGROUND(?:\s+OF\s+THE\s+INVENTION)?|FIELD\s+OF\s+(?:THE\s+)?INVENTION|RELATED\s+ART|PRIOR\s+ART)', 'background'),
    (r'(?:SUMMARY(?:\s+OF\s+THE\s+INVENTION)?|BRIEF\s+SUMMARY)', 'summary'),
    (r'(?:BRIEF\s+DESCRIPTION\s+OF\s+(?:THE\s+)?DRAWINGS?|DESCRIPTION\s+OF\s+(?:THE\s+)?FIGURES?)', 'drawings_description'),
    (r'(?:DETAILED\s+DESCRIPTION(?:\s+OF\s+(?:THE\s+)?(?:PREFERRED\s+)?EMBODIMENTS?)?|DESCRIPTION\s+OF\s+(?:THE\s+)?(?:PREFERRED\s+)?EMBODIMENTS?)', 'detailed_description'),
    (r'(?:CLAIMS?|What\s+is\s+claimed\s+is)', 'claims'),
]


def segment_full_text(full_text: str) -> Dict[str, str]:
    """Step 6.2: Split patent full text into canonical sections.

    Args:
        full_text: Raw patent full text string

    Returns:
        Dict mapping section type to text content:
        {abstract, background, summary, drawings_description, detailed_description, claims}
    """
    if not full_text or not full_text.strip():
        return {}

    sections = {}
    text = full_text.strip()

    # Find all section boundaries
    boundaries = []
    for pattern, section_type in SECTION_PATTERNS:
        for match in re.finditer(pattern, text, re.IGNORECASE):
            boundaries.append((match.start(), match.end(), section_type))

    boundaries.sort(key=lambda x: x[0])

    if not boundaries:
        # No section headers found — treat entire text as detailed_description
        return {'detailed_description': text}

    # Extract text between boundaries
    for i, (start, end, section_type) in enumerate(boundaries):
        next_start = boundaries[i + 1][0] if i + 1 < len(boundaries) else len(text)
        section_text = text[end:next_start].strip()
        if section_text:
            sections[section_type] = section_text

    # Text before first section header
    if boundaries[0][0] > 50:
        preamble = text[:boundaries[0][0]].strip()
        if preamble:
            sections.setdefault('preamble', preamble)

    return sections


# ═══════════════════════════════════════════════════════════════
# Step 6.3: Parse Claims into Hierarchy
# ═══════════════════════════════════════════════════════════════

@dataclass
class ParsedClaim:
    claim_number: int
    text: str
    claim_type: str  # 'independent' or 'dependent'
    depends_on: Optional[int] = None
    elements: List[Dict] = field(default_factory=list)
    scope_indicators: List[Dict] = field(default_factory=list)


def parse_claims_hierarchy(claims_data) -> List[Dict]:
    """Step 6.3: Parse claims into independent/dependent hierarchy.

    Args:
        claims_data: Either a string (raw claims text), a list of strings,
                    or a list of dicts with 'text' and optional 'number' keys

    Returns:
        List of claim dicts with: claim_number, text, claim_type, depends_on
    """
    # Normalize input
    claim_texts = []
    if isinstance(claims_data, str):
        # Split numbered claims: "1. A method..." "2. The method of claim 1..."
        parts = re.split(r'\n\s*(\d+)\.\s+', '\n' + claims_data)
        for i in range(1, len(parts) - 1, 2):
            num = int(parts[i])
            text = parts[i + 1].strip()
            claim_texts.append((num, text))
        if not claim_texts:
            # Single claim or unnumbered
            claim_texts.append((1, claims_data.strip()))
    elif isinstance(claims_data, list):
        for i, item in enumerate(claims_data):
            if isinstance(item, dict):
                num = item.get('number', i + 1)
                text = item.get('text', '')
            elif isinstance(item, str):
                num = i + 1
                text = item
            else:
                continue
            if text:
                claim_texts.append((num, text.strip()))

    if not claim_texts:
        return []

    # Determine independent vs dependent
    results = []
    dep_pattern = re.compile(
        r'(?:(?:The|A|An)\s+\w+\s+(?:of|according\s+to|as\s+(?:recited|claimed|defined|set\s+forth)\s+in)\s+claim\s+(\d+))',
        re.IGNORECASE
    )

    for num, text in claim_texts:
        dep_match = dep_pattern.search(text)
        if dep_match:
            depends_on = int(dep_match.group(1))
            claim_type = 'dependent'
        else:
            depends_on = None
            claim_type = 'independent'

        results.append({
            'claim_number': num,
            'text': text,
            'claim_type': claim_type,
            'depends_on': depends_on,
        })

    return results


# ═══════════════════════════════════════════════════════════════
# Step 6.4: Extract Claim Elements (Limitations)
# ═══════════════════════════════════════════════════════════════

ELEMENT_SPLITTERS = [
    r';\s*',
    r'\s+wherein\s+',
    r'\s+comprising\s*:?\s*',
    r'\s+consisting\s+(?:essentially\s+)?of\s*:?\s*',
    r'\s+having\s*:?\s*',
    r'\s+including\s*:?\s*',
]


def extract_claim_elements(claim_text: str) -> List[Dict]:
    """Step 6.4: Split an independent claim into functional elements/limitations.

    Args:
        claim_text: Text of a single claim

    Returns:
        List of element dicts: {element_id, text, is_preamble}
    """
    if not claim_text:
        return []

    # First split by the primary transitional phrase
    preamble = ''
    body = claim_text

    transition_match = re.search(
        r'(comprising|consisting\s+(?:essentially\s+)?of|including|having)\s*:?\s*',
        claim_text, re.IGNORECASE
    )

    if transition_match:
        preamble = claim_text[:transition_match.start()].strip()
        body = claim_text[transition_match.end():].strip()

    # Split body by semicolons and "wherein" clauses
    parts = re.split(r';\s*|\s+wherein\s+', body)

    elements = []
    if preamble:
        elements.append({
            'element_id': 0,
            'text': preamble.strip().rstrip(',;:'),
            'is_preamble': True,
        })

    for i, part in enumerate(parts):
        part = part.strip().rstrip(',;:')
        if part and len(part) > 5:
            elements.append({
                'element_id': len(elements),
                'text': part,
                'is_preamble': False,
            })

    return elements


# ═══════════════════════════════════════════════════════════════
# Step 6.5: Identify Claim Scope Indicators
# ═══════════════════════════════════════════════════════════════

def identify_scope_indicators(claim_text: str) -> List[Dict]:
    """Step 6.5: Flag scope-relevant language in a claim.

    Returns:
        List of indicator dicts: {indicator_type, text_match, position, interpretation}
    """
    indicators = []

    patterns = [
        # Open-ended (broader scope)
        (r'\bcomprising\b', 'open_ended', 'Broad: open-ended, allows additional elements'),
        (r'\bincluding\b', 'open_ended', 'Broad: open-ended transitional phrase'),

        # Closed (narrower scope)
        (r'\bconsisting\s+of\b', 'closed', 'Narrow: closed, limited to listed elements'),
        (r'\bconsisting\s+essentially\s+of\b', 'partially_closed', 'Moderate: allows non-material additions'),

        # Means-plus-function (35 USC 112(f))
        (r'\bmeans\s+for\s+\w+', 'means_plus_function', 'Narrow: limited to specification + equivalents'),
        (r'\bstep\s+for\s+\w+', 'step_plus_function', 'Narrow: step-plus-function limitation'),

        # Markush group
        (r'\bselected\s+from\s+the\s+group\s+consisting\s+of\b', 'markush_group', 'Defined: Markush group of alternatives'),

        # Numeric ranges
        (r'\b(?:at\s+least|no\s+more\s+than|between|from\s+about|approximately)\s+[\d.]+', 'numeric_range', 'Quantified limitation'),

        # Relative language (broader)
        (r'\b(?:substantially|approximately|about|generally|essentially)\b', 'approximate_language', 'Broader: approximate language gives some flexibility'),
    ]

    for pattern, indicator_type, interpretation in patterns:
        for match in re.finditer(pattern, claim_text, re.IGNORECASE):
            indicators.append({
                'indicator_type': indicator_type,
                'text_match': match.group(),
                'position': match.start(),
                'interpretation': interpretation,
            })

    return indicators


# ═══════════════════════════════════════════════════════════════
# Step 6.6: Extract Technical Entities
# ═══════════════════════════════════════════════════════════════

def extract_technical_entities(text: str, use_spacy: bool = True) -> List[Dict]:
    """Step 6.6: Extract technical entities from patent text.

    Uses spaCy NER if available, falls back to regex patterns.

    Args:
        text: Patent text (description, claims, or abstract)
        use_spacy: Whether to try spaCy (default True)

    Returns:
        List of entity dicts: {term, entity_type, frequency, source}
    """
    entities = []
    entity_counter = {}  # (term, type) -> count

    # Regex-based extraction (always runs)
    regex_patterns = [
        # Chemical compounds
        (r'\b[A-Z][a-z]?(?:\d+[A-Z][a-z]?\d*)+\b', 'chemical_compound'),
        # Numeric measurements
        (r'\b\d+(?:\.\d+)?\s*(?:nm|μm|mm|cm|m|kg|g|mg|μg|mL|L|°C|°F|K|Hz|kHz|MHz|GHz|V|mV|A|mA|W|kW|MW|Pa|kPa|MPa|bar|psi)\b', 'measurement'),
        # Technical acronyms (2+ uppercase letters)
        (r'\b[A-Z]{2,6}\b', 'acronym'),
        # Component names (capitalized multi-word)
        (r'\b(?:[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b', 'component'),
    ]

    for pattern, entity_type in regex_patterns:
        for match in re.finditer(pattern, text):
            term = match.group().strip()
            if len(term) < 2:
                continue
            key = (term, entity_type)
            entity_counter[key] = entity_counter.get(key, 0) + 1

    # spaCy NER (if available)
    if use_spacy:
        try:
            import spacy
            nlp = spacy.load('en_core_web_sm')
            # Process first 10K chars to avoid memory issues
            doc = nlp(text[:10000])
            for ent in doc.ents:
                if ent.label_ in ('ORG', 'PRODUCT', 'WORK_OF_ART', 'QUANTITY', 'CARDINAL'):
                    key = (ent.text.strip(), f'spacy_{ent.label_.lower()}')
                    entity_counter[key] = entity_counter.get(key, 0) + 1
        except (ImportError, OSError):
            pass  # spaCy not available

    # Convert to list
    for (term, entity_type), count in sorted(entity_counter.items(), key=lambda x: -x[1]):
        entities.append({
            'term': term,
            'entity_type': entity_type,
            'frequency': count,
            'source': 'spacy' if entity_type.startswith('spacy_') else 'regex',
        })

    return entities[:100]  # cap at 100 entities


# ═══════════════════════════════════════════════════════════════
# Step 6.7: Extract Novelty Statements
# ═══════════════════════════════════════════════════════════════

NOVELTY_PATTERNS = [
    r'(?:the\s+)?(?:present\s+)?invention\s+(?:provides|relates\s+to|discloses|is\s+directed\s+to)',
    r'(?:novel|new|improved|unique)\s+(?:method|system|apparatus|device|composition|process|technique)',
    r'improvement\s+over\s+(?:the\s+)?(?:prior\s+art|existing|conventional|known)',
    r'unlike\s+(?:the\s+)?(?:prior\s+art|existing|conventional|previous)',
    r'advantage(?:s)?\s+(?:of|over)\s+(?:the\s+)?(?:prior\s+art|existing|conventional)',
    r'problem(?:s)?\s+(?:with|in|of)\s+(?:the\s+)?(?:prior\s+art|existing|conventional)',
    r'(?:overcomes?|solves?|addresses?|eliminates?)\s+(?:the\s+)?(?:problem|limitation|disadvantage|deficiency)',
    r'(?:it\s+is|there\s+is)\s+(?:therefore\s+)?(?:a\s+)?need\s+(?:for|to)',
]


def extract_novelty_statements(text: str) -> List[Dict]:
    """Step 6.7: Extract sentences containing novelty/improvement language.

    Args:
        text: Patent text (preferably Summary or Background section)

    Returns:
        List of dicts: {text, pattern_matched, section_hint}
    """
    if not text:
        return []

    # Split into sentences
    sentences = re.split(r'(?<=[.!?])\s+', text)

    results = []
    seen = set()

    for sentence in sentences:
        sentence = sentence.strip()
        if len(sentence) < 20 or len(sentence) > 500:
            continue

        for pattern in NOVELTY_PATTERNS:
            if re.search(pattern, sentence, re.IGNORECASE):
                key = sentence[:50]
                if key not in seen:
                    seen.add(key)
                    results.append({
                        'text': sentence,
                        'pattern_matched': pattern[:40],
                    })
                break

    return results[:20]  # cap at 20 statements


# ═══════════════════════════════════════════════════════════════
# Orchestrator: Process a single patent's full text
# ═══════════════════════════════════════════════════════════════

def process_patent_fulltext(patent) -> Dict[str, Any]:
    """Process a single patent's full text through all M6 steps.

    Args:
        patent: UnifiedPatent object (or any object with abstract, claims_structure, raw_data)

    Returns:
        Dict with all extracted data: sections, claims_hierarchy, elements, scope, entities, novelty
    """
    result = {'patent_id': getattr(patent, 'patent_id', '')}

    # Step 6.2: Segment sections (from description in raw_data if available)
    description = ''
    raw = getattr(patent, 'raw_data', {}) or {}

    # Try to get full description from ODP
    grant_text = raw.get('grant_text', {}) or {}
    pgpub_text = raw.get('pgpub_text', {}) or {}
    description = grant_text.get('description', '') or pgpub_text.get('description', '') or ''

    if description:
        result['sections'] = segment_full_text(description)
    else:
        # Fallback: construct from available data
        result['sections'] = {}
        if getattr(patent, 'abstract', ''):
            result['sections']['abstract'] = patent.abstract

    # Step 6.3: Parse claims hierarchy
    claims_data = getattr(patent, 'claims_structure', []) or []
    if not claims_data:
        # Try raw claims text
        raw_claims = raw.get('grant_text', {}).get('claims', []) or raw.get('pgpub_text', {}).get('claims', []) or []
        if raw_claims:
            claims_data = raw_claims

    claims_hierarchy = parse_claims_hierarchy(claims_data)
    result['claims_hierarchy'] = claims_hierarchy
    result['independent_claims_count'] = sum(1 for c in claims_hierarchy if c['claim_type'] == 'independent')
    result['dependent_claims_count'] = sum(1 for c in claims_hierarchy if c['claim_type'] == 'dependent')

    # Step 6.4 + 6.5: Extract elements and scope for each independent claim
    claim_analysis = []
    for claim in claims_hierarchy:
        if claim['claim_type'] != 'independent':
            continue
        elements = extract_claim_elements(claim['text'])
        scope = identify_scope_indicators(claim['text'])
        claim_analysis.append({
            'claim_number': claim['claim_number'],
            'elements': elements,
            'element_count': len(elements),
            'scope_indicators': scope,
            'scope_type': _determine_overall_scope(scope),
        })
    result['claim_analysis'] = claim_analysis

    # Step 6.6: Extract entities from abstract + claims
    text_for_entities = (getattr(patent, 'abstract', '') or '') + ' '
    for c in claims_hierarchy[:5]:  # first 5 claims
        text_for_entities += c.get('text', '') + ' '

    result['entities'] = extract_technical_entities(text_for_entities, use_spacy=False)  # regex-only for speed

    # Step 6.7: Novelty statements from summary/background
    novelty_text = result.get('sections', {}).get('summary', '') or result.get('sections', {}).get('background', '') or getattr(patent, 'abstract', '') or ''
    result['novelty_statements'] = extract_novelty_statements(novelty_text)

    return result


def _determine_overall_scope(indicators: List[Dict]) -> str:
    """Determine overall claim scope from indicators."""
    types = {i['indicator_type'] for i in indicators}
    if 'closed' in types:
        return 'narrow'
    if 'means_plus_function' in types or 'step_plus_function' in types:
        return 'narrow'
    if 'partially_closed' in types:
        return 'moderate'
    if 'open_ended' in types:
        return 'broad'
    return 'undetermined'


def process_project_fulltext(project_id: str, max_patents: int = 200) -> Dict[str, Any]:
    """Process full text for all patents in a project.

    Args:
        project_id: UUID of the AnalyticsProject
        max_patents: Cap on patents to process (for performance)

    Returns:
        Aggregated results across all patents
    """
    from .patent_data_service import get_project_patents

    patents = get_project_patents(project_id)
    if not patents:
        return {'error': 'No patent data available', 'total_patents': 0}

    patents_to_process = patents[:max_patents]
    results = []

    for patent in patents_to_process:
        try:
            r = process_patent_fulltext(patent)
            results.append(r)
        except Exception as e:
            logger.warning('Full text processing failed for %s: %s', patent.patent_id, e)

    # Aggregate stats
    total_independent = sum(r.get('independent_claims_count', 0) for r in results)
    total_dependent = sum(r.get('dependent_claims_count', 0) for r in results)

    all_entities = {}
    for r in results:
        for e in r.get('entities', []):
            key = (e['term'], e['entity_type'])
            all_entities[key] = all_entities.get(key, 0) + e['frequency']

    top_entities = sorted(all_entities.items(), key=lambda x: -x[1])[:50]

    scope_dist = {'broad': 0, 'moderate': 0, 'narrow': 0, 'undetermined': 0}
    for r in results:
        for ca in r.get('claim_analysis', []):
            scope_dist[ca.get('scope_type', 'undetermined')] += 1

    all_novelty = []
    for r in results:
        for n in r.get('novelty_statements', []):
            all_novelty.append({**n, 'patent_id': r['patent_id']})

    return {
        'project_id': project_id,
        'total_patents_processed': len(results),
        'total_independent_claims': total_independent,
        'total_dependent_claims': total_dependent,
        'avg_elements_per_claim': round(
            sum(len(ca.get('elements', [])) for r in results for ca in r.get('claim_analysis', []))
            / max(sum(len(r.get('claim_analysis', [])) for r in results), 1), 1
        ),
        'scope_distribution': scope_dist,
        'top_entities': [{'term': t, 'type': tp, 'frequency': c} for (t, tp), c in top_entities],
        'novelty_statements': all_novelty[:30],
        'patent_details': results[:20],  # first 20 individual results
    }
