"""
Bundle Attribute Service

AI-assisted extraction of technical attribute values for patent bundles.
Covers the 20 AI-scoreable attributes from AI_Prompts_for_Attribute_Scoring.md,
split between Group A (dedicated function) and all others (single extraction call).
"""
from __future__ import annotations
import json
import logging
import re
from typing import Dict, List, Optional, Tuple

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Fields the LLM can score — exactly matching AI_Prompts_for_Attribute_Scoring.md
# Excludes: H2, H3, H7, H8, H9, H10 (DB lookup / hallucination risk)
#           I1 (targeted research / hallucination risk)
#           B2 (requires SSO database verification)
#           C3, H5, H6 (counting from database)
#           E, F groups (database / lifecycle data)
# ---------------------------------------------------------------------------

_LLM_EXTRACTABLE: Dict[str, dict] = {
    # Group B — Standards & Ecosystem (partial)
    'b1_sep_potential':             {'type': 'int',    'min': 0, 'max': 3},
    'b3_interface_role':            {'type': 'int',    'min': 0, 'max': 3},
    # Group C — Claim & Scope
    'c1_claim_type':                {'type': 'choice', 'choices': ['Method', 'Apparatus', 'CRM', 'System', 'Design', '']},
    'c2_breadth':                   {'type': 'int',    'min': 0, 'max': 3},
    'c4_design_around_difficulty':  {'type': 'int',    'min': 0, 'max': 3},
    # Group D — Detectability
    'd1_external_detectability':    {'type': 'int',    'min': 0, 'max': 3},
    'd2_teardown_detectability':    {'type': 'int',    'min': 0, 'max': 3},
    # Group G — Strategic & Thematic
    'g1_convergence_theme':         {'type': 'str'},
    'g2_generation_tag':            {'type': 'choice', 'choices': ['Legacy', 'Current', 'Next-gen', '']},
    'g3_cross_industry_applicability': {'type': 'int', 'min': 0, 'max': 3},
    # Group H — Quality (AI-scoreable subset only)
    'h1_claim_strength':            {'type': 'int',    'min': 0, 'max': 3},
    'h4_divided_infringement_risk': {'type': 'int',    'min': 0, 'max': 3},
    # Group I — Market Signals (AI-scoreable subset)
    'i2_implementation_maturity':   {'type': 'choice', 'choices': ['Concept', 'Prototype', 'Productized', 'Commercial', 'Ubiquitous']},
    'i3_adjacent_market_reread':    {'type': 'int',    'min': 0, 'max': 3},
    'i4_workaround_complexity':     {'type': 'int',    'min': 0, 'max': 3},
    # Group A — stack layer (bonus fill if not already classified)
    'a3_stack_layer':               {'type': 'choice', 'choices': ['Hardware', 'Firmware', 'OS', 'Middleware', 'App', 'Cloud', 'UI', '']},
}


def extract_bundle_attributes_via_llm(
    patent_record_id: str,
    fields_to_extract: Optional[List[str]] = None,
    cpc_cache: Optional[Dict[str, str]] = None,
) -> Dict:
    """
    Use LLM to infer attribute scores from a patent's structured inputs.
    Returns dict of {field_name: value} for successfully extracted fields.
    Updates PatentBundleAttributes, ai_extracted_fields, and ai_confidence_scores.

    cpc_cache: optional pre-loaded dict {cpc_code: title} to avoid per-patent DB queries in bulk runs.
    """
    from .models import PatentRecord, PatentBundleAttributes

    try:
        pr = PatentRecord.objects.get(id=patent_record_id)
    except PatentRecord.DoesNotExist:
        raise ValueError(f'PatentRecord {patent_record_id} not found')

    attrs_obj, _ = PatentBundleAttributes.objects.get_or_create(patent_record_id=patent_record_id)

    target_fields = fields_to_extract or list(_LLM_EXTRACTABLE.keys())
    protected = set(attrs_obj.manually_set_fields or [])
    target_fields = [f for f in target_fields if f not in protected and f in _LLM_EXTRACTABLE]

    if not target_fields:
        return {}

    inputs = _build_patent_inputs(pr, cpc_cache=cpc_cache)
    system_text = _build_system_prompt()
    user_text = _build_user_prompt(inputs, target_fields=target_fields)

    raw_response = _call_llm(system_text, user_text)
    if not raw_response:
        logger.warning('LLM returned no response for patent %s', patent_record_id)
        return {}

    extracted, confidence_map = _parse_and_validate(raw_response, target_fields)

    newly_extracted = []
    for field, value in extracted.items():
        setattr(attrs_obj, field, value)
        newly_extracted.append(field)

    if newly_extracted:
        from django.utils import timezone
        existing_ai = set(attrs_obj.ai_extracted_fields or [])
        attrs_obj.ai_extracted_fields = list(existing_ai | set(newly_extracted))
        attrs_obj.last_ai_extraction = timezone.now()
        existing_conf = dict(attrs_obj.ai_confidence_scores or {})
        existing_conf.update(confidence_map)
        attrs_obj.ai_confidence_scores = existing_conf
        attrs_obj.save()

    return extracted


def update_attributes_manually(
    patent_record_id: str,
    attributes: dict,
) -> Dict:
    """
    Apply manually-supplied attribute values. Marks fields in manually_set_fields.
    Returns the updated attribute dict.
    """
    from .models import PatentBundleAttributes

    attrs_obj, _ = PatentBundleAttributes.objects.get_or_create(patent_record_id=patent_record_id)

    valid_fields = set(_all_attribute_field_names())
    updated = []
    for field, value in attributes.items():
        if field not in valid_fields:
            continue
        setattr(attrs_obj, field, value)
        updated.append(field)

    if updated:
        existing_manual = set(attrs_obj.manually_set_fields or [])
        attrs_obj.manually_set_fields = list(existing_manual | set(updated))
        attrs_obj.save()

    return {f: getattr(attrs_obj, f) for f in updated}


# ─────────────────────────────────────────────────────────────────────────────
# Patent input preparation
# ─────────────────────────────────────────────────────────────────────────────

def _build_patent_inputs(pr, cpc_cache: Optional[Dict[str, str]] = None) -> dict:
    """
    Build a structured dict of named patent inputs for the LLM prompt.

    cpc_cache: pre-loaded {code: title} dict. If None, a per-patent DB query is made.
    """
    title = pr.title or 'Untitled'
    abstract = (pr.abstract or '')[:2000]

    # Independent vs dependent claims — prefer the pre-parsed claims_structure (reliable),
    # fall back to regex-parsing the raw claims text/list (works but less accurate).
    independent_block, dependent_block = _build_claims_blocks(pr)

    # Background / field of invention — pulled from the patent specification.
    # If the description has a "BACKGROUND" / "FIELD OF THE INVENTION" header,
    # use that section; otherwise use the first 1500 chars as a fallback.
    background = ''
    full_desc = getattr(pr, 'description', '') or ''
    if full_desc:
        m = re.search(
            r'(?i)(?:BACKGROUND(?:\s+OF\s+THE\s+INVENTION)?|FIELD\s+OF\s+(?:THE\s+)?INVENTION)\b',
            full_desc,
        )
        if m:
            # Take from this header through the next major header (SUMMARY, DETAILED, etc.)
            start = m.start()
            tail = re.search(
                r'(?i)\n\s*(?:SUMMARY|DETAILED\s+DESCRIPTION|BRIEF\s+DESCRIPTION\s+OF\s+(?:THE\s+)?DRAWINGS)\b',
                full_desc[start:],
            )
            end = (start + tail.start()) if tail else start + 1500
            background = full_desc[start:end][:1500].strip()
        else:
            background = full_desc[:1500].strip()

    # Classification codes — handle comma, semicolon, and pipe separators
    def _split_codes(raw_value) -> list:
        return [
            c.strip()
            for c in str(raw_value or '').replace(';', ',').replace('|', ',').split(',')
            if c.strip()
        ]

    cpc_parts  = _split_codes(getattr(pr, 'cpc_classification', ''))
    ipc_parts  = _split_codes(getattr(pr, 'ipc_classification', ''))
    uspc_parts = _split_codes(getattr(pr, 'uspc_classification', ''))

    # Resolve CPC + IPC titles from ClassificationDefinition table.
    # USPC codes use the form "726/1" — the parent class title is loaded under the IPC system in our DB.
    all_codes = cpc_parts + ipc_parts
    if all_codes:
        if cpc_cache is not None:
            code_titles = {c: cpc_cache[c] for c in all_codes if c in cpc_cache}
        else:
            try:
                from domains.patents.models import ClassificationDefinition
                code_titles = {
                    d['code']: d['title']
                    for d in ClassificationDefinition.objects.filter(
                        code__in=all_codes
                    ).values('code', 'title')
                }
            except Exception:
                code_titles = {}
    else:
        code_titles = {}

    def _format_with_titles(parts: list) -> str:
        if not parts:
            return 'unknown'
        return '; '.join(
            f"{c} — {code_titles[c]}" if c in code_titles else c
            for c in parts
        )

    cpc_primary      = cpc_parts[0] if cpc_parts else 'unknown'
    cpc_primary_desc = code_titles.get(cpc_primary, '')
    cpc_full         = _format_with_titles(cpc_parts)
    ipc_full         = _format_with_titles(ipc_parts)
    uspc_full        = '; '.join(uspc_parts) if uspc_parts else 'unknown'

    return {
        'title': title,
        'abstract': abstract,
        'independent_claims': independent_block,
        'dependent_claims': dependent_block,
        'background_or_field': background or 'not available',
        # Unified classification keys (with human-readable titles)
        'cpc_full': cpc_full,
        'ipc_full': ipc_full,
        'uspc_full': uspc_full,
    }


def _claim_text(claim) -> str:
    """Extract plain text from a claim that may be a dict, string, or other format."""
    if isinstance(claim, dict):
        text = claim.get('text', '') or claim.get('claim_text', '') or ''
    else:
        text = str(claim)
    # Strip HTML tags
    text = re.sub(r'<[^>]+>', '', text)
    # Strip leading "N. " numbering
    text = re.sub(r'^\s*\d+\.\s*', '', text.strip())
    return text.strip()


# ─────────────────────────────────────────────────────────────────────────────
# Claims structure → prompt blocks
# ─────────────────────────────────────────────────────────────────────────────

# Per-claim character caps to keep total prompt size reasonable
_IND_CLAIM_CAP = 2500     # per independent claim
_DEP_CLAIM_CAP = 800      # per dependent claim
_IND_BLOCK_CAP = 5000     # total cap on independent block
_DEP_BLOCK_CAP = 6000     # total cap on dependent block


def _classify_claim_strict(text: str) -> tuple[str, list[str]]:
    """Detect dependent claims robustly — including source-data typos
    (e.g. 'The system of 1, wherein' missing the word 'claim').
    """
    head = text[:200]
    for pat in (
        r'\bof\s+claim\s+(\d+)\b',
        r'\baccording\s+to\s+claim\s+(\d+)\b',
        r'\bas\s+(?:in|recited\s+in)\s+claim\s+(\d+)\b',
        r'\bclaim\s+(\d+)\b',
        r'^\s*\d+\.\s*The\s+\w+\s+of\s+(\d+)[,\s]',
        r'^\s*\d+\.\s*The\s+\w+\s+according\s+to\s+(\d+)[,\s]',
    ):
        m = re.search(pat, head, re.I | re.M)
        if m:
            refs = re.findall(pat, text, re.I | re.M)
            return 'dependent', list(dict.fromkeys(refs))
    refs = re.findall(r'\bclaim\s+(\d+)\b', text, re.I)
    if refs:
        return 'dependent', list(dict.fromkeys(refs))
    return 'independent', []


def _build_claims_blocks(pr) -> tuple[str, str]:
    """Return (independent_block, dependent_block) ready to drop into the prompt.

    Format:
      Independent block — each claim prefixed with its number:
        Claim 1: A system, comprising...
        Claim 18: A method, comprising...

      Dependent block — number + parent reference + text:
        Claim 6 (depends on 1): wherein the classifier is a Random Forest model.
        Claim 9 (depends on 8): wherein the certificates are obtained from a certificate log.

    Falls back to the raw text blob if claims_structure is missing.
    """
    structure = getattr(pr, 'claims_structure', None) or []

    # Path 1: structured claims_structure (preferred)
    if structure:
        ind_lines, dep_lines, ind_used, dep_used = [], [], 0, 0
        for c in structure:
            num = str(c.get('number', '?'))
            text = str(c.get('text', '')).strip()
            if not text:
                continue
            ctype = c.get('type') or _classify_claim_strict(text)[0]
            refs = c.get('references') or []
            if ctype == 'independent':
                snippet = text[:_IND_CLAIM_CAP]
                line = f'Claim {num}: {snippet}'
                if ind_used + len(line) > _IND_BLOCK_CAP:
                    break
                ind_lines.append(line)
                ind_used += len(line)
            else:
                snippet = text[:_DEP_CLAIM_CAP]
                refs_str = f' (depends on {", ".join(refs)})' if refs else ''
                line = f'Claim {num}{refs_str}: {snippet}'
                if dep_used + len(line) > _DEP_BLOCK_CAP:
                    continue
                dep_lines.append(line)
                dep_used += len(line)

        ind_block = '\n\n'.join(ind_lines) if ind_lines else 'not available'
        dep_block = '\n\n'.join(dep_lines) if dep_lines else 'none'
        return ind_block, dep_block

    # Path 2: legacy list-of-dicts (older imports)
    raw_claims = pr.claims
    if isinstance(raw_claims, list) and raw_claims:
        ind_lines, dep_lines, ind_used, dep_used = [], [], 0, 0
        for c in raw_claims[:30]:
            text = _claim_text(c)
            num = str(c.get('number', '?')) if isinstance(c, dict) else '?'
            if not text:
                continue
            full = f'{num}. {text}' if not text.startswith(f'{num}.') else text
            ctype, refs = _classify_claim_strict(full)
            if ctype == 'independent':
                line = f'Claim {num}: {text[:_IND_CLAIM_CAP]}'
                if ind_used + len(line) > _IND_BLOCK_CAP:
                    break
                ind_lines.append(line); ind_used += len(line)
            else:
                refs_str = f' (depends on {", ".join(refs)})' if refs else ''
                line = f'Claim {num}{refs_str}: {text[:_DEP_CLAIM_CAP]}'
                if dep_used + len(line) > _DEP_BLOCK_CAP:
                    continue
                dep_lines.append(line); dep_used += len(line)
        return ('\n\n'.join(ind_lines) or 'not available',
                '\n\n'.join(dep_lines) or 'none')

    # Path 3: plain string blob — emit it as a single independent block, no separation possible
    if isinstance(raw_claims, str) and raw_claims.strip():
        return raw_claims[:_IND_BLOCK_CAP], 'none (raw text blob — independent/dependent not separated)'

    return 'not available', 'none'


# ─────────────────────────────────────────────────────────────────────────────
# Prompt building
# ─────────────────────────────────────────────────────────────────────────────

_DEFAULT_EXTRACTION_TEMPLATE = """\
You are scoring a patent on {field_count} attributes. Read the structured inputs and return JSON.

TITLE: {title}
ABSTRACT: {abstract}
INDEPENDENT_CLAIM_1: {independent_claim_1}
INDEPENDENT_CLAIM_OTHERS: {independent_claim_others}
BACKGROUND_OR_FIELD: {background_or_field}
CPC_PRIMARY: {cpc_primary}
CPC_OTHERS: {cpc_others}

ATTRIBUTES TO SCORE:
{fields_prompt}

IMPORTANT RULES:
- Return ONLY valid JSON — no prose around it.
- Each field must be an object with three keys: "value", "confidence" (0-100), "justification" (one sentence).
- If you cannot determine a value from the text, use 0, "", or the first valid choice as appropriate. Set confidence < 50.
- Score conservatively. Confidence < 60 means flag for manual review.

Return ONLY valid JSON. Example format:
{{"h1_claim_strength": {{"value": 2, "confidence": 80, "justification": "Claim language is clear with minor structural ambiguity."}}, "d1_external_detectability": {{"value": 1, "confidence": 65, "justification": "Behavior requires external instrumentation to detect."}}}}"""


_FIELD_DESCRIPTIONS = {
    # Group B
    'b1_sep_potential': (
        'SEP (standard-essential patent) potential — integer 0-3.\n'
        '  3: Claim language directly mirrors a normative spec section of a known standard (3GPP, IEEE 802.x, ITU, USB, Bluetooth).\n'
        '  2: Claim reads on a specific clause of a known standard but the mapping is inferential.\n'
        '  1: Standard-adjacent — claim involves a standardized area but essentiality is debatable.\n'
        '  0: No standard tie evident.'
    ),
    'b3_interface_role': (
        'Interface role — integer 0-3.\n'
        '  3: Claim sits at a mandatory interface between two systems (wire protocol, connector pinout, RPC format, handshake).\n'
        '  2: Claim covers a widely-used interoperability mechanism that is de-facto standard but not technically mandatory.\n'
        '  1: Claim involves an interface but the interface is internal to one product.\n'
        '  0: No interface dimension in the claim.'
    ),
    # Group C
    'c1_claim_type': (
        'Primary claim type — exactly one of: Apparatus, Method, System, CRM, Design.\n'
        '  Apparatus: "an apparatus comprising..."\n'
        '  Method: "a method comprising the steps of..."\n'
        '  System: "a system for X comprising..."\n'
        '  CRM: "a non-transitory computer-readable medium..."\n'
        '  Design: design patents (D-numbered, drawings only)'
    ),
    'c2_breadth': (
        'Claim breadth — integer 0-3.\n'
        '  3 (pioneer/foundational): Few elements, abstract language, broad genus.\n'
        '  2 (broad): Moderate element count, some structural narrowing.\n'
        '  1 (narrow): Many specific constraints, named structural features.\n'
        '  0 (very narrow/picture claim): Tied to one specific implementation.'
    ),
    'c4_design_around_difficulty': (
        'Design-around difficulty — integer 0-3.\n'
        '  3 (hard): Claim covers the natural/efficient approach; alternatives are commercially undesirable.\n'
        '  2: Covers main routes but leaves specific alternatives.\n'
        '  1: Claim is one of several obvious alternatives — modest redesign needed.\n'
        '  0: Trivial workaround exists.'
    ),
    # Group D
    'd1_external_detectability': (
        'External detectability (no teardown) — integer 0-3.\n'
        '  3: Visible in UI, marketed feature, public spec sheet, or measurable from outputs (e.g., protocol behavior on the wire).\n'
        '  2: Detectable from network traffic capture or external instrumentation.\n'
        '  1: Detectable only with significant external testing.\n'
        '  0: Requires teardown or internal access.'
    ),
    'd2_teardown_detectability': (
        'Teardown / reverse-engineering detectability — integer 0-3.\n'
        '  3: Visible in standard teardown (circuit traces, chip die markings, mechanical components).\n'
        '  2: Detectable with electrical probing or chip-level reverse engineering.\n'
        '  1: Detectable only with deep RE (decapping, firmware dump).\n'
        '  0: Process-internal — no teardown reveals it (e.g., a manufacturing process step).\n'
        '  Default: apparatus/chip-layout claims usually 2-3; pure-software-method claims usually 0-1.'
    ),
    # Group G
    'g1_convergence_theme': (
        'Convergence theme — comma-separated tags from this fixed dictionary ONLY '
        '(use ONLY tags from this list; if none fit, return ""):\n'
        '"AI+healthcare", "Edge AI", "AR/VR", "AI+chip-design", "Robotics+CV", "Quantum", '
        '"Sustainability+materials", "AI+industrial", "Web3", "Spatial computing", "AI+security", "AI+finance"\n'
        'Up to 2 tags. Only tag if the patent clearly fits.'
    ),
    'g2_generation_tag': (
        'Technology generation — exactly one of: Legacy, Current, Next-gen, or "" (empty).\n'
        '  Legacy: tied to a superseded generation still in service (e.g., 4G LTE in 2026, USB 2.0).\n'
        '  Current: tied to the dominant deployed generation (5G NR, USB 3.x, Wi-Fi 6).\n'
        '  Next-gen: tied to the emerging or pre-deployment generation (6G, Wi-Fi 8, USB4 v2).\n'
        '  "": for non-generation-tagged tech (materials, basic algorithms, mechanical systems).'
    ),
    'g3_cross_industry_applicability': (
        'Cross-industry applicability — integer 0-3.\n'
        '  Count plausible target industries from: Consumer Electronics, Automotive, Healthcare, '
        'Industrial/Manufacturing, Telecom, Energy, Aerospace, FinTech, AgTech, Defense.\n'
        '  3: 4+ industries; 2: 3 industries; 1: 2 industries; 0: single industry only.'
    ),
    # Group H
    'h1_claim_strength': (
        'Claim strength rating — integer 0-3.\n'
        '  3: Clean, definite language; clear antecedent basis; structurally clean; dependent claims provide layered fallbacks.\n'
        '  2: Minor ambiguity but enforceable. One term might invite claim construction dispute.\n'
        '  1: Vague terms, weak antecedent basis, multiple ambiguous limitations.\n'
        '  0: Ambiguous, indefinite, or internally inconsistent.\n'
        '  Check specifically for: antecedent basis violations, relative terms without baselines, open-ended ranges.'
    ),
    'h4_divided_infringement_risk': (
        'Divided infringement risk — integer 0-3.\n'
        '  3: All claim steps performed by a single actor. Apparatus claims default to 3.\n'
        '  2: Claim steps performed by a single actor with minor user interaction.\n'
        '  1: Claim steps require two parties (e.g., client + server with no clear "single mastermind").\n'
        '  0: Explicit multi-party performance with no joint enterprise — high enforcement risk.'
    ),
    # Group I
    'i2_implementation_maturity': (
        'Implementation maturity — exactly one of: "Concept", "Prototype", "Productized", "Commercial", "Ubiquitous".\n'
        '  Concept:    Specification describes an idea only — no working example, no experimental data.\n'
        '  Prototype:  Specification references a working prototype, lab demo, or research publication.\n'
        '  Productized: Specification names a commercial product, or there is strong evidence one exists.\n'
        '  Commercial: Technology widely deployed commercially (multiple vendors ship it).\n'
        '  Ubiquitous: Technology is universal infrastructure — everyone uses it without thinking about it.'
    ),
    'i3_adjacent_market_reread': (
        'Adjacent-market re-read — integer 0-3.\n'
        '  3: Claim language is industry-agnostic AND clearly reads on 2+ adjacent industries.\n'
        '  2: Re-read plausible in one adjacent industry with no claim contortion.\n'
        '  1: Re-read possible but requires aggressive interpretation.\n'
        '  0: Claim language ties it tightly to one industry.\n'
        '  Horizontal technologies (sensing, networking, AI methods) typically score 2-3.'
    ),
    'i4_workaround_complexity': (
        'Workaround complexity — integer 0-3 (engineering effort for a non-infringing alternative).\n'
        '  3: Deep redesign — claim covers the natural/efficient approach; alternatives are expensive or technically inferior.\n'
        '  2: Significant redesign — alternatives exist but are commercially undesirable.\n'
        '  1: Minor redesign — straightforward alternative available.\n'
        '  0: Trivial workaround — designers can easily substitute.\n'
        '  Note: I4 differs from C4. C4 is about claim language; I4 is about commercial impact.'
    ),
    # Group A (bonus)
    'a3_stack_layer': (
        'Stack layer where the novelty lives — exactly one of: Hardware, Firmware, OS, Middleware, App, Cloud, UI, or "" if not applicable.\n'
        '  Hardware: physical device/circuit/material; Firmware: low-level embedded code; OS: kernel/driver;\n'
        '  Middleware: protocol stacks/libraries; App: end-user application logic; Cloud: server-side service; UI: visual interface.'
    ),
}


_SYSTEM_PREAMBLE = (
    "You are a senior patent analyst. Score the patent provided by the user on the specified "
    "attributes. Follow the rubrics exactly. Return ONLY valid JSON — no prose, no markdown fences.\n\n"
    "OUTPUT FORMAT: each attribute key maps to an object with three keys:\n"
    '  "value"         — the scored value (integer, string, or choice as specified)\n'
    '  "confidence"    — integer 0-100; your certainty in the score\n'
    '  "justification" — one sentence explaining the score\n\n'
    "RULES:\n"
    "- Score conservatively. Confidence < 60 means flag for manual review.\n"
    "- If you cannot determine a value, use 0, empty string, or the first valid choice. Set confidence < 50.\n"
    "- Do not invent facts not present in the patent text.\n"
)

_USER_DATA_TEMPLATE = """\
TITLE: {title}
ABSTRACT: {abstract}

INDEPENDENT_CLAIMS (primary source for claim-structure attributes — C1, C2, H1, H4):
{independent_claims}

DEPENDENT_CLAIMS (supporting context — use to refine technique/algorithm details when independent claims are abstract):
{dependent_claims}

BACKGROUND_OR_FIELD: {background_or_field}
CPC: {cpc_full}
IPC: {ipc_full}
USPC: {uspc_full}

Score this patent on all attributes specified in your instructions. Return ONLY valid JSON."""


# Module-level cached full system prompt — built once, reused for every call.
# Always includes ALL field rubrics so the prompt is identical regardless of which
# fields are being extracted. This guarantees the prompt exceeds the 1,024-token
# minimum required for caching on Claude Sonnet 4.6 (measured: ~1,800 tokens).
_CACHED_SYSTEM_PROMPT: Optional[str] = None


def _build_system_prompt(target_fields: List[str] = None) -> str:  # noqa: ARG001
    """Return the full static system prompt (all rubrics).

    target_fields is intentionally ignored — including all rubrics keeps the
    system prompt identical across every call, maximising Anthropic prompt cache
    hits. The user message specifies which fields to actually extract.
    """
    global _CACHED_SYSTEM_PROMPT
    if _CACHED_SYSTEM_PROMPT is None:
        all_rubrics = '\n\n'.join(
            f'"{f}":\n{desc}'
            for f, desc in _FIELD_DESCRIPTIONS.items()
        )
        _CACHED_SYSTEM_PROMPT = (
            _SYSTEM_PREAMBLE
            + "ATTRIBUTE RUBRICS (score only the fields listed in the user message):\n\n"
            + all_rubrics
        )
    return _CACHED_SYSTEM_PROMPT


def _build_user_prompt(inputs: dict, target_fields: Optional[List[str]] = None) -> str:
    """Build the per-patent user prompt: patent data + explicit field list to extract."""
    text = _USER_DATA_TEMPLATE.format(**inputs)
    if target_fields:
        text += f"\n\nExtract ONLY these attributes: {', '.join(target_fields)}"
    return text


# ─────────────────────────────────────────────────────────────────────────────
# LLM calls
# ─────────────────────────────────────────────────────────────────────────────

def _call_llm(system_text: str, user_text: str) -> Optional[str]:
    try:
        from .models import LLMProviderConfig
        config = LLMProviderConfig.objects.filter(is_active=True).first()
        if not config:
            return None
        api_key = config.api_key
        if not api_key:
            return None
        model = config.resolved_model
        if config.provider == 'anthropic':
            return _call_anthropic(api_key, system_text, user_text, model=model)
        elif config.provider == 'openai':
            return _call_openai(api_key, system_text, user_text, model=model)
    except Exception as e:
        logger.warning('LLM call failed: %s', e)
    return None


def _call_anthropic(api_key: str, system_text: str, user_text: str, model: str = 'claude-sonnet-4-6') -> Optional[str]:
    import anthropic
    import time

    client = anthropic.Anthropic(api_key=api_key)

    # Retry on 429 (rate limit) with exponential back-off.
    # Tier 1 output limit is 8,000 tokens/min — a 30 s pause is enough for
    # the window to reset.  Max 3 retries = up to ~3.5 min total wait.
    max_retries = 3
    for attempt in range(max_retries + 1):
        try:
            response = client.messages.create(
                model=model,
                max_tokens=4096,
                system=[{
                    'type': 'text',
                    'text': system_text,
                    'cache_control': {'type': 'ephemeral'},
                }],
                messages=[{'role': 'user', 'content': user_text}],
            )
            usage = getattr(response, 'usage', None)
            if usage:
                cache_read = getattr(usage, 'cache_read_input_tokens', 0)
                cache_write = getattr(usage, 'cache_creation_input_tokens', 0)
                if cache_read:
                    logger.debug('Cache HIT: %d read, %d written', cache_read, cache_write)
                elif cache_write:
                    logger.debug('Cache WRITE: %d tokens cached', cache_write)
            return response.content[0].text

        except anthropic.RateLimitError:
            if attempt >= max_retries:
                logger.error('Anthropic rate limit: exhausted %d retries', max_retries)
                return None
            wait = 30 * (2 ** attempt)   # 30 s, 60 s, 120 s
            logger.warning('Anthropic rate limit hit (attempt %d/%d) — waiting %d s',
                           attempt + 1, max_retries, wait)
            time.sleep(wait)

        except anthropic.APIStatusError as e:
            if e.status_code == 529:  # API overloaded
                wait = 15 * (2 ** attempt)
                logger.warning('Anthropic overloaded — waiting %d s', wait)
                time.sleep(wait)
            else:
                logger.warning('Anthropic API error %d: %s', e.status_code, str(e)[:200])
                return None

        except Exception as e:
            logger.warning('Anthropic call failed: %s', e)
            return None

    return None


def _call_openai(api_key: str, system_text: str, user_text: str, model: str = 'gpt-4o') -> Optional[str]:
    try:
        import openai
        client = openai.OpenAI(api_key=api_key)
        response = client.chat.completions.create(
            model='gpt-4o',
            max_tokens=4096,
            messages=[
                {'role': 'system', 'content': system_text},
                {'role': 'user', 'content': user_text},
            ],
        )
        return response.choices[0].message.content
    except Exception as e:
        logger.warning('OpenAI API call failed: %s', e)
        return None


# ─────────────────────────────────────────────────────────────────────────────
# Parsing & validation
# ─────────────────────────────────────────────────────────────────────────────

def _parse_and_validate(raw: str, target_fields: List[str]) -> Tuple[dict, dict]:
    """
    Extract JSON from LLM response and validate each field.

    Handles two response shapes:
    - Nested: {"field": {"value": X, "confidence": 80, "justification": "..."}}
    - Flat:   {"field": X}  (backward compat)

    Returns (validated_values, confidence_map).
    confidence_map: {"field": {"confidence": int, "justification": str}}
    """
    raw = raw.strip()
    if raw.startswith('```'):
        lines = raw.split('\n')
        raw = '\n'.join(lines[1:-1] if lines[-1].strip() == '```' else lines[1:])

    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        match = re.search(r'\{.*\}', raw, re.DOTALL)
        if not match:
            return {}, {}
        try:
            data = json.loads(match.group())
        except json.JSONDecodeError:
            return {}, {}

    validated = {}
    confidence_map = {}

    for field in target_fields:
        if field not in data:
            continue
        raw_val = data[field]
        spec = _LLM_EXTRACTABLE.get(field, {})

        # Handle nested format
        if isinstance(raw_val, dict) and 'value' in raw_val:
            score_val = raw_val['value']
            conf = raw_val.get('confidence')
            just = raw_val.get('justification', '')
            if isinstance(conf, (int, float)) and 0 <= conf <= 100:
                confidence_map[field] = {
                    'confidence': int(conf),
                    'justification': str(just)[:300],
                }
        else:
            score_val = raw_val

        clean = _validate_value(score_val, spec)
        if clean is not None:
            validated[field] = clean

    return validated, confidence_map


def _validate_value(value, spec: dict):
    kind = spec.get('type')
    if kind == 'int':
        try:
            v = int(value)
            return max(spec.get('min', 0), min(spec.get('max', 3), v))
        except (TypeError, ValueError):
            return 0
    elif kind == 'bool':
        if isinstance(value, bool):
            return value
        if isinstance(value, str):
            return value.lower() in ('true', 'yes', '1')
        return None
    elif kind == 'choice':
        choices = spec.get('choices', [])
        if value in choices:
            return value
        for c in choices:
            if c.lower() == str(value).lower():
                return c
        return choices[0] if choices else ''
    elif kind == 'str':
        return str(value)[:200] if value else ''
    return value


# ─────────────────────────────────────────────────────────────────────────────
# Group A — Technology Classification (dedicated function, unchanged logic)
# ─────────────────────────────────────────────────────────────────────────────

_GROUP_A_FIELDS = [
    'a1_primary_domain', 'a2_tech_subcategory',
    'a21_tech_detail', 'a22_tech_niche',        # L3 and L4 — claim-derived
    'a3_stack_layer', 'a4_subsystem', 'a5_use_case',
]

_A3_CHOICES = ['Hardware', 'Firmware', 'OS', 'Middleware', 'App', 'Cloud', 'UI', '']

# Fallback taxonomy when GlobalTechnologyArea DB table is empty.
# Used both as a classification reference AND to push the Group A system prompt
# past the 1,024-token minimum required for Anthropic prompt caching on Sonnet 4.6.
_FALLBACK_TAXONOMY_LINES = """- Artificial Intelligence & Machine Learning (category: Software, IPC: G06N, CPC: G06N)
- Cybersecurity & Network Security (category: Software, IPC: H04L, CPC: H04L63)
- Cloud Computing & Infrastructure (category: Software, IPC: G06F, CPC: G06F9/50)
- Semiconductors & Integrated Circuits (category: Hardware, IPC: H01L, CPC: H01L)
- Wireless Communications 5G/6G (category: Telecom, IPC: H04W, CPC: H04W)
- Internet of Things (category: Software, IPC: H04L, CPC: H04W4/70)
- Autonomous Vehicles & ADAS (category: Automotive, IPC: B60W, CPC: B60W)
- Medical Devices & Diagnostics (category: Healthcare, IPC: A61B, CPC: A61B)
- Biotechnology & Genomics (category: Life Sciences, IPC: C12N, CPC: C12N)
- Energy Storage & Batteries (category: Energy, IPC: H01M, CPC: H01M)
- Quantum Computing (category: Computing, IPC: G06N10, CPC: G06N10)
- Augmented Reality & Virtual Reality (category: Software, IPC: G02B, CPC: G02B27/01)
- Blockchain & Distributed Ledger (category: Software, IPC: G06F, CPC: G06F21/64)
- Robotics & Automation (category: Manufacturing, IPC: B25J, CPC: B25J)
- Natural Language Processing (category: Software, IPC: G06F40, CPC: G06F40)
- Computer Vision & Image Processing (category: Software, IPC: G06V, CPC: G06V)
- Data Analytics & Business Intelligence (category: Software, IPC: G06F17, CPC: G06F16)
- Networking & Telecommunications (category: Telecom, IPC: H04L, CPC: H04L)
- Consumer Electronics (category: Hardware, IPC: H04N, CPC: H04N)
- Industrial Manufacturing & Process Control (category: Manufacturing, IPC: G05B, CPC: G05B)
- Financial Technology (category: Software, IPC: G06Q20, CPC: G06Q20)
- Healthcare IT & Digital Health (category: Healthcare, IPC: G16H, CPC: G16H)
- Environmental & Clean Technology (category: Energy, IPC: F03D, CPC: Y02E)
- Aerospace & Defense Systems (category: Defense, IPC: B64C, CPC: B64C)
- Display Technology (category: Hardware, IPC: G09G, CPC: G09G)
- Audio & Speech Processing (category: Software, IPC: G10L, CPC: G10L)
- Optical & Photonics (category: Hardware, IPC: G02, CPC: G02)
- Power Electronics & Energy Conversion (category: Energy, IPC: H02M, CPC: H02M)
- Software Development Tools & Platforms (category: Software, IPC: G06F8, CPC: G06F8)
- E-Commerce & Digital Platforms (category: Software, IPC: G06Q30, CPC: G06Q30)
- Wearables & Body-Area Networks (category: Hardware, IPC: A61B5, CPC: A61B5)
- Smart Grid & Power Management (category: Energy, IPC: H02J, CPC: H02J)
- Sensor Technology & MEMS (category: Hardware, IPC: G01, CPC: G01)
- Human-Computer Interaction (category: Software, IPC: G06F3, CPC: G06F3)
- Supply Chain & Logistics (category: Software, IPC: G06Q10, CPC: G06Q10)
- Additive Manufacturing & 3D Printing (category: Manufacturing, IPC: B29C64, CPC: B29C64)
- Haptics & Tactile Interfaces (category: Hardware, IPC: G06F3/01, CPC: G06F3/01)
- Geolocation & Mapping Systems (category: Software, IPC: G01C, CPC: G01C)
- Content Delivery & Streaming (category: Software, IPC: H04N21, CPC: H04N21)"""


def classify_group_a_via_llm(
    patent_record_id: str,
    force: bool = False,
    cpc_cache: Optional[Dict[str, str]] = None,
) -> Dict:
    """
    Classify a patent's Group A technology fields using the GlobalTechnologyArea taxonomy as reference.
    Skips if all A fields are already filled unless force=True.
    Returns dict of {field_name: value} for updated fields.

    cpc_cache: optional pre-loaded {cpc_code: title} dict for bulk runs.
    """
    from .models import PatentRecord, PatentBundleAttributes, GlobalTechnologyArea
    from django.utils import timezone

    try:
        pr = PatentRecord.objects.get(id=patent_record_id)
    except PatentRecord.DoesNotExist:
        raise ValueError(f'PatentRecord {patent_record_id} not found')

    attrs_obj, _ = PatentBundleAttributes.objects.get_or_create(patent_record_id=patent_record_id)

    if not force:
        already_filled = all(
            getattr(attrs_obj, f, None) not in (None, '')
            for f in _GROUP_A_FIELDS
        )
        if already_filled:
            return {}

    taxonomy = list(
        GlobalTechnologyArea.objects.values('name', 'ipc_class', 'cpc_class', 'category')
    )
    if taxonomy:
        taxonomy_lines = '\n'.join(
            f"- {t['name']} (category: {t['category']}, IPC: {t['ipc_class']}, CPC: {t['cpc_class']})"
            for t in taxonomy
        )
    else:
        # Use built-in fallback so the LLM always has concrete domain names to choose from
        taxonomy_lines = _FALLBACK_TAXONOMY_LINES

    inputs = _build_patent_inputs(pr, cpc_cache=cpc_cache)

    # Static system instructions — taxonomy included so prompt is identical across
    # patents in one bulk run, enabling Anthropic prompt cache hits.
    group_a_system = (
        "You are a patent technology analyst. Classify patents using the structured 4-level taxonomy below.\n\n"
        "OUTPUT: Return ONLY valid JSON with exactly 7 keys:\n"
        '  "a1_primary_domain"  — Level 1: must exactly match a name from the TAXONOMY list\n'
        '  "a2_tech_subcategory"— Level 2: subcategory within domain (2-4 words, free-form)\n'
        '  "a21_tech_detail"    — Level 3: specific technique or method, derived primarily from the CLAIM language\n'
        '                          (2-5 words, free-form; must be a child of a2_tech_subcategory)\n'
        '  "a22_tech_niche"     — Level 4: most granular approach, algorithm, or protocol,\n'
        '                          derived primarily from the CLAIM language (2-6 words, free-form;\n'
        '                          must be a child of a21_tech_detail)\n'
        '  "a3_stack_layer"     — exactly one of: Hardware, Firmware, OS, Middleware, App, Cloud, UI, or ""\n'
        '    Hardware=physical device/circuit/material; Firmware=low-level embedded code; OS=kernel/driver;\n'
        '    Middleware=protocol stacks/libraries; App=end-user application logic;\n'
        '    Cloud=server-side service/infrastructure; UI=visual/voice interface.\n'
        '  "a4_subsystem"       — specific subsystem or component (2-5 words, free-form)\n'
        '  "a5_use_case"        — primary customer-facing problem statement (5-10 words, free-form)\n\n'
        "HIERARCHY: a1 → a2 → a21 → a22  (each level is more specific than its parent)\n"
        'EXAMPLE: "Cybersecurity & Network Security" → "Malicious Domain Detection" '
        '→ "DNS pre-registration monitoring" → "Random Forest stockpile-ratio classifier"\n\n'
        "RULES:\n"
        "- a1_primary_domain MUST exactly match one of the TAXONOMY names below.\n"
        "- Derive a1, a2, and a21 from the INDEPENDENT CLAIMS — that defines what the invention IS.\n"
        "- For a22 (most granular), prefer the DEPENDENT CLAIMS — they typically name the specific\n"
        "  algorithm, protocol, or processing technique (e.g. 'Random Forest', 'certificate-log analysis',\n"
        "  'passive DNS lookup'). The independent claim names the structure; dependents name the techniques.\n"
        "- Use abstract and background only to confirm/disambiguate your claim-based interpretation.\n"
        "- If a21/a22 cannot be determined with confidence from the claim language, return an empty string\n"
        "  — do not guess from the abstract alone.\n"
        "- If the patent spans multiple domains, pick the one most central to the inventive concept.\n\n"
        f"TAXONOMY:\n{taxonomy_lines}"
    )

    # Dynamic per-patent data — independent claims are the PRIMARY source for A1/A2;
    # dependent claims are supporting context that names specific algorithms/techniques (A2.1/A2.2).
    # CPC/IPC/USPC come with human-readable titles to anchor A1 domain matching.
    group_a_user = (
        f"TITLE: {inputs['title']}\n\n"
        f"INDEPENDENT_CLAIMS (primary source for A1, A2, A2.1 — defines the invention):\n"
        f"{inputs['independent_claims']}\n\n"
        f"DEPENDENT_CLAIMS (supporting context — use to refine A2.1 and A2.2 when they name specific algorithms, protocols, or processing steps):\n"
        f"{inputs['dependent_claims']}\n\n"
        f"ABSTRACT: {inputs['abstract']}\n"
        f"BACKGROUND_OR_FIELD: {inputs['background_or_field']}\n"
        f"CPC: {inputs['cpc_full']}\n"
        f"IPC: {inputs['ipc_full']}\n"
        f"USPC: {inputs['uspc_full']}\n"
    )

    raw_response = _call_llm(group_a_system, group_a_user)
    if not raw_response:
        logger.warning('LLM returned no response for Group A classification of patent %s', patent_record_id)
        return {}

    try:
        start = raw_response.find('{')
        end = raw_response.rfind('}') + 1
        extracted = json.loads(raw_response[start:end]) if start >= 0 else {}
    except (json.JSONDecodeError, ValueError):
        logger.warning('Could not parse LLM Group A response for patent %s', patent_record_id)
        return {}

    if 'a3_stack_layer' in extracted:
        v = extracted['a3_stack_layer']
        if v not in _A3_CHOICES:
            extracted['a3_stack_layer'] = ''

    protected = set(attrs_obj.manually_set_fields or [])
    newly_extracted = []
    for field in _GROUP_A_FIELDS:
        if field in extracted and field not in protected:
            setattr(attrs_obj, field, str(extracted[field])[:255] if extracted[field] else '')
            newly_extracted.append(field)

    if newly_extracted:
        existing_ai = set(attrs_obj.ai_extracted_fields or [])
        attrs_obj.ai_extracted_fields = list(existing_ai | set(newly_extracted))
        attrs_obj.last_ai_extraction = timezone.now()
        attrs_obj.save()

    return {f: extracted[f] for f in newly_extracted if f in extracted}


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _all_attribute_field_names() -> List[str]:
    return [
        'a1_primary_domain', 'a2_tech_subcategory', 'a3_stack_layer', 'a4_subsystem', 'a5_use_case',
        'b1_sep_potential', 'b2_standard_tagged', 'b3_interface_role',
        'c1_claim_type', 'c2_breadth', 'c3_claim_count', 'c4_design_around_difficulty',
        'd1_external_detectability', 'd2_teardown_detectability', 'd3_reads_on_products',
        'e1_family_size', 'e2_prosecution_status', 'e3_continuation', 'e4_remaining_term_years', 'e5_maintenance_status',
        'f1_jurisdictions', 'f2_trilateral', 'f3_major_market_score',
        'g1_convergence_theme', 'g2_generation_tag', 'g3_cross_industry_applicability',
        'h1_claim_strength', 'h2_prior_art_exposure', 'h3_prosecution_risk', 'h4_divided_infringement_risk',
        'h5_forward_citations', 'h6_backward_citations', 'h7_litigation_history', 'h8_chain_of_title',
        'h9_eou_availability', 'h10_encumbrance_status',
        'i1_product_mapping_confidence', 'i2_implementation_maturity', 'i3_adjacent_market_reread', 'i4_workaround_complexity',
    ]
