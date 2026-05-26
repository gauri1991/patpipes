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
    'i2_implementation_maturity':   {'type': 'choice', 'choices': ['Idea-only', 'Prototyped', 'Productized']},
    'i3_adjacent_market_reread':    {'type': 'int',    'min': 0, 'max': 3},
    'i4_workaround_complexity':     {'type': 'int',    'min': 0, 'max': 3},
    # Group A — stack layer (bonus fill if not already classified)
    'a3_stack_layer':               {'type': 'choice', 'choices': ['Hardware', 'Firmware', 'OS', 'Middleware', 'App', 'Cloud', 'UI', '']},
}


def extract_bundle_attributes_via_llm(
    patent_record_id: str,
    fields_to_extract: Optional[List[str]] = None,
) -> Dict:
    """
    Use LLM to infer attribute scores from a patent's structured inputs.
    Returns dict of {field_name: value} for successfully extracted fields.
    Updates PatentBundleAttributes, ai_extracted_fields, and ai_confidence_scores.
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

    inputs = _build_patent_inputs(pr)
    prompt = _build_extraction_prompt(inputs, target_fields)

    raw_response = _call_llm(prompt)
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

def _build_patent_inputs(pr) -> dict:
    """
    Build a structured dict of named patent inputs for the LLM prompt.
    Extracts structured fields rather than a single text blob.
    """
    title = pr.title or 'Untitled'
    abstract = (pr.abstract or '')[:1000]

    # Parse claims into independent vs. dependent
    ind_claim_1 = ''
    ind_claim_others_parts = []
    raw_claims = pr.claims or []
    if isinstance(raw_claims, list):
        ind_count = 0
        for claim in raw_claims[:20]:
            text = _claim_text(claim)
            if not text:
                continue
            # Dependent claims reference another claim number
            if re.search(r'\bclaim\s+\d', text, re.IGNORECASE):
                continue  # skip dependent claims
            ind_count += 1
            if ind_count == 1:
                ind_claim_1 = text[:800]
            else:
                ind_claim_others_parts.append(text[:400])
    elif isinstance(raw_claims, str) and raw_claims.strip():
        # Fallback: use first 800 chars
        ind_claim_1 = raw_claims[:800]

    ind_claim_others = ('\n'.join(ind_claim_others_parts))[:600] or 'none'

    # Background / field of invention
    background = ''
    for attr in ('description', 'background', 'field_of_invention'):
        val = getattr(pr, attr, None)
        if val:
            background = str(val)[:800]
            break

    # CPC codes
    cpc_raw = getattr(pr, 'cpc_classification', '') or ''
    cpc_parts = [c.strip() for c in str(cpc_raw).replace(';', ',').split(',') if c.strip()]
    cpc_primary = cpc_parts[0] if cpc_parts else 'unknown'
    cpc_others = ', '.join(cpc_parts[1:]) if len(cpc_parts) > 1 else 'unknown'

    return {
        'title': title,
        'abstract': abstract,
        'independent_claim_1': ind_claim_1 or 'not available',
        'independent_claim_others': ind_claim_others,
        'background_or_field': background or 'not available',
        'cpc_primary': cpc_primary,
        'cpc_others': cpc_others,
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
        'Implementation maturity — exactly one of: "Idea-only", "Prototyped", "Productized".\n'
        '  Idea-only: Specification describes a concept with no working example, no experimental data.\n'
        '  Prototyped: Specification references a working prototype, lab demo, or research publication.\n'
        '  Productized: Specification names a commercial product, or there is strong evidence one exists.'
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


def _build_extraction_prompt(inputs: dict, target_fields: List[str]) -> str:
    fields_prompt = '\n\n'.join(
        f'"{f}":\n{_FIELD_DESCRIPTIONS.get(f, f)}'
        for f in target_fields
    )

    try:
        from .models import AnalysisPromptTemplate
        tpl = AnalysisPromptTemplate.get_active('bundle_attribute_extraction')
        template_text = tpl.prompt_text if tpl else _DEFAULT_EXTRACTION_TEMPLATE
    except Exception:
        template_text = _DEFAULT_EXTRACTION_TEMPLATE

    return template_text.format(
        **inputs,
        fields_prompt=fields_prompt,
        field_count=len(target_fields),
    )


# ─────────────────────────────────────────────────────────────────────────────
# LLM calls
# ─────────────────────────────────────────────────────────────────────────────

def _call_llm(prompt: str) -> Optional[str]:
    try:
        from .models import LLMProviderConfig
        config = LLMProviderConfig.objects.filter(is_active=True).first()
        if not config:
            return None
        api_key = config.api_key
        if not api_key:
            return None
        if config.provider == 'anthropic':
            return _call_anthropic(api_key, prompt)
        elif config.provider == 'openai':
            return _call_openai(api_key, prompt)
    except Exception as e:
        logger.warning('LLM call failed: %s', e)
    return None


def _call_anthropic(api_key: str, prompt: str) -> Optional[str]:
    try:
        import anthropic
        client = anthropic.Anthropic(api_key=api_key)
        response = client.messages.create(
            model='claude-sonnet-4-20250514',
            max_tokens=2048,
            messages=[{'role': 'user', 'content': prompt}],
        )
        return response.content[0].text
    except Exception as e:
        logger.warning('Anthropic API call failed: %s', e)
        return None


def _call_openai(api_key: str, prompt: str) -> Optional[str]:
    try:
        import openai
        client = openai.OpenAI(api_key=api_key)
        response = client.chat.completions.create(
            model='gpt-4o',
            max_tokens=2048,
            messages=[{'role': 'user', 'content': prompt}],
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

_GROUP_A_FIELDS = ['a1_primary_domain', 'a2_tech_subcategory', 'a3_stack_layer', 'a4_subsystem', 'a5_use_case']

_A3_CHOICES = ['Hardware', 'Firmware', 'OS', 'Middleware', 'App', 'Cloud', 'UI', '']


def classify_group_a_via_llm(
    patent_record_id: str,
    force: bool = False,
) -> Dict:
    """
    Classify a patent's Group A technology fields using the GlobalTechnologyArea taxonomy as reference.
    Skips if all A fields are already filled unless force=True.
    Returns dict of {field_name: value} for updated fields.
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
        taxonomy_lines = '(no taxonomy defined — use your best judgment)'

    inputs = _build_patent_inputs(pr)
    ipc_codes = getattr(pr, 'ipc_classification', '') or ''

    _default_group_a_template = """\
You are a patent technology analyst. Classify the following patent using the provided taxonomy.

PATENT:
TITLE: {title}
ABSTRACT: {abstract}
INDEPENDENT_CLAIM_1: {independent_claim_1}

IPC Codes: {ipc_codes}
CPC Codes: {cpc_primary}

TAXONOMY (choose a1_primary_domain from these names exactly):
{taxonomy_lines}

TASK: Return a JSON object with these 5 fields:
- "a1_primary_domain": The primary technology domain name — must exactly match a name from the taxonomy list above
- "a2_tech_subcategory": A specific subcategory within that domain (2-4 words, can be free-form)
- "a3_stack_layer": One of: Hardware, Firmware, OS, Middleware, App, Cloud, UI, or "" if not applicable
- "a4_subsystem": The specific subsystem or component this patent targets (2-5 words, free-form)
- "a5_use_case": The primary use case as a customer-facing problem (5-10 words, free-form)

Return ONLY valid JSON, no explanation:
{{"a1_primary_domain": "...", "a2_tech_subcategory": "...", "a3_stack_layer": "...", "a4_subsystem": "...", "a5_use_case": "..."}}"""

    try:
        from .models import AnalysisPromptTemplate
        tpl = AnalysisPromptTemplate.get_active('group_a_classification')
        template_text = tpl.prompt_text if tpl else _default_group_a_template
    except Exception:
        template_text = _default_group_a_template

    prompt = template_text.format(
        **inputs,
        ipc_codes=ipc_codes,
        taxonomy_lines=taxonomy_lines,
    )

    raw_response = _call_llm(prompt)
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
