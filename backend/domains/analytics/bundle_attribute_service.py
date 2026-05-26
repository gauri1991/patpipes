"""
Bundle Attribute Service

AI-assisted extraction of technical attribute values (Groups H and I)
from patent abstract and claims text, plus manual update helpers.
"""
from __future__ import annotations
import json
import logging
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)

# Fields the LLM can provide and their validation rules
_LLM_EXTRACTABLE: Dict[str, dict] = {
    'h1_claim_strength':           {'type': 'int', 'min': 0, 'max': 3},
    'h2_prior_art_exposure':       {'type': 'int', 'min': 0, 'max': 3},
    'h3_prosecution_risk':         {'type': 'int', 'min': 0, 'max': 3},
    'h4_divided_infringement_risk':{'type': 'bool'},
    'h7_litigation_history':       {'type': 'choice', 'choices': ['None','Filed','Survived','Lost']},
    'h8_chain_of_title':           {'type': 'choice', 'choices': ['Clean','Issues','Unknown']},
    'h9_eou_availability':         {'type': 'choice', 'choices': ['None','Partial','Full']},
    'h10_encumbrance_status':      {'type': 'choice', 'choices': ['None','FRAND','Exclusive License','Other']},
    'i1_product_mapping_confidence':{'type': 'int', 'min': 0, 'max': 3},
    'i2_implementation_maturity':  {'type': 'choice', 'choices': ['Concept','Prototype','Commercial','Ubiquitous']},
    'i3_adjacent_market_reread':   {'type': 'int', 'min': 0, 'max': 3},
    'i4_workaround_complexity':    {'type': 'int', 'min': 0, 'max': 3},
    # Also try to fill unfilled A-G fields
    'a3_stack_layer':              {'type': 'choice', 'choices': ['App','Middleware','Cloud','Hardware','OS','Protocol','']},
    'b1_sep_potential':            {'type': 'int', 'min': 0, 'max': 3},
    'c1_claim_type':               {'type': 'choice', 'choices': ['Method','Apparatus','CRM','System','Composition','']},
    'c2_breadth':                  {'type': 'int', 'min': 0, 'max': 3},
    'c4_design_around_difficulty': {'type': 'int', 'min': 0, 'max': 3},
    'g3_cross_industry_applicability': {'type': 'int', 'min': 0, 'max': 3},
}


def extract_bundle_attributes_via_llm(
    patent_record_id: str,
    fields_to_extract: Optional[List[str]] = None,
) -> Dict:
    """
    Use LLM to infer attribute scores from a patent's abstract and claims text.
    Returns dict of {field_name: value} for successfully extracted fields.
    Updates PatentBundleAttributes and marks ai_extracted_fields.
    """
    from .models import PatentRecord, PatentBundleAttributes, LLMProviderConfig

    try:
        pr = PatentRecord.objects.get(id=patent_record_id)
    except PatentRecord.DoesNotExist:
        raise ValueError(f'PatentRecord {patent_record_id} not found')

    attrs_obj, _ = PatentBundleAttributes.objects.get_or_create(patent_record_id=patent_record_id)

    target_fields = fields_to_extract or list(_LLM_EXTRACTABLE.keys())
    # Don't overwrite manually-set fields
    protected = set(attrs_obj.manually_set_fields or [])
    target_fields = [f for f in target_fields if f not in protected and f in _LLM_EXTRACTABLE]

    if not target_fields:
        return {}

    # Build prompt
    patent_text = _build_patent_text(pr)
    prompt = _build_extraction_prompt(patent_text, target_fields)

    # Call LLM
    raw_response = _call_llm(prompt)
    if not raw_response:
        logger.warning('LLM returned no response for patent %s', patent_record_id)
        return {}

    # Parse and validate
    extracted = _parse_and_validate(raw_response, target_fields)

    # Apply to model
    newly_extracted = []
    for field, value in extracted.items():
        setattr(attrs_obj, field, value)
        newly_extracted.append(field)

    if newly_extracted:
        from django.utils import timezone
        existing_ai = set(attrs_obj.ai_extracted_fields or [])
        attrs_obj.ai_extracted_fields = list(existing_ai | set(newly_extracted))
        attrs_obj.last_ai_extraction = timezone.now()
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
    from django.utils import timezone

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
# Internals
# ─────────────────────────────────────────────────────────────────────────────

def _build_patent_text(pr) -> str:
    title = pr.title or 'Untitled'
    abstract = pr.abstract or ''
    claims = ''
    if pr.claims:
        if isinstance(pr.claims, list):
            claims = '\n'.join(str(c) for c in pr.claims[:5])
        else:
            claims = str(pr.claims)[:1500]
    return f"TITLE: {title}\n\nABSTRACT: {abstract[:1000]}\n\nCLAIMS (first 5):\n{claims[:1500]}"


def _build_extraction_prompt(patent_text: str, target_fields: List[str]) -> str:
    field_descriptions = {
        'h1_claim_strength':           'How strong are the independent claims? (0=very weak, 1=weak, 2=moderate, 3=strong broad claims)',
        'h2_prior_art_exposure':       'How much prior art risk exists? (0=none, 1=low, 2=moderate, 3=high risk)',
        'h3_prosecution_risk':         'Prosecution history risk/estoppel (0=none, 1=low, 2=moderate, 3=high)',
        'h4_divided_infringement_risk':'Does the claim require multiple parties to infringe? (true/false)',
        'h7_litigation_history':       'Litigation/PTAB history: None, Filed, Survived, or Lost',
        'h8_chain_of_title':           'Chain of title status: Clean, Issues, or Unknown',
        'h9_eou_availability':         'Evidence-of-Use chart availability: None, Partial, or Full',
        'h10_encumbrance_status':      'Licensing encumbrances: None, FRAND, Exclusive License, or Other',
        'i1_product_mapping_confidence':'How confidently can claims be mapped to real products? (0-3)',
        'i2_implementation_maturity':  'Technology implementation maturity: Concept, Prototype, Commercial, or Ubiquitous',
        'i3_adjacent_market_reread':   'Can this patent read on adjacent industries? (0=no, 1=possibly, 2=likely, 3=clearly)',
        'i4_workaround_complexity':    'How hard is it to design around this patent? (0=easy, 1=moderate, 2=hard, 3=very hard)',
        'a3_stack_layer':              'Technology stack layer: App, Middleware, Cloud, Hardware, OS, Protocol, or empty string',
        'b1_sep_potential':            'Standard-essential patent potential (0=none, 1=low, 2=moderate, 3=high)',
        'c1_claim_type':               'Primary claim type: Method, Apparatus, CRM, System, Composition, or empty string',
        'c2_breadth':                  'Claim breadth (0=very narrow, 1=narrow, 2=moderate, 3=pioneer/broad)',
        'c4_design_around_difficulty': 'How hard to design around? (0=easy, 3=very hard)',
        'g3_cross_industry_applicability':'Can this apply across multiple industries? (0=no, 3=broad applicability)',
    }

    fields_prompt = '\n'.join(
        f'- "{f}": {field_descriptions.get(f, f)}'
        for f in target_fields
    )

    return f"""You are a patent analyst. Analyze the following patent and score it on the listed attributes.

PATENT:
{patent_text}

TASK: Return a JSON object with ONLY the following fields scored based on the patent text.
Use the descriptions as guidance. If you cannot determine a value from the text, use 0 or "" or "None" as appropriate.

FIELDS TO SCORE:
{fields_prompt}

Return ONLY valid JSON, no explanation. Example format:
{{"h1_claim_strength": 2, "h2_prior_art_exposure": 1, "h7_litigation_history": "None", ...}}"""


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
            max_tokens=1024,
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
            max_tokens=1024,
            messages=[{'role': 'user', 'content': prompt}],
        )
        return response.choices[0].message.content
    except Exception as e:
        logger.warning('OpenAI API call failed: %s', e)
        return None


def _parse_and_validate(raw: str, target_fields: List[str]) -> dict:
    """Extract JSON from LLM response and validate each field."""
    raw = raw.strip()
    # Strip markdown code fences if present
    if raw.startswith('```'):
        lines = raw.split('\n')
        raw = '\n'.join(lines[1:-1] if lines[-1] == '```' else lines[1:])

    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        # Try to find JSON object within text
        import re
        match = re.search(r'\{.*\}', raw, re.DOTALL)
        if not match:
            return {}
        try:
            data = json.loads(match.group())
        except json.JSONDecodeError:
            return {}

    validated = {}
    for field in target_fields:
        if field not in data:
            continue
        spec = _LLM_EXTRACTABLE.get(field, {})
        value = data[field]
        clean = _validate_value(value, spec)
        if clean is not None:
            validated[field] = clean
    return validated


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
        # Case-insensitive fallback
        for c in choices:
            if c.lower() == str(value).lower():
                return c
        return choices[0] if choices else ''
    return value


_GROUP_A_FIELDS = ['a1_primary_domain', 'a2_tech_subcategory', 'a3_stack_layer', 'a4_subsystem', 'a5_use_case']

_A3_CHOICES = ['App', 'Middleware', 'Cloud', 'Hardware', 'OS', 'Protocol', '']


def classify_group_a_via_llm(
    patent_record_id: str,
    force: bool = False,
) -> Dict:
    """
    Classify a patent's Group A technology fields using the GlobalTechnologyArea taxonomy as reference.
    Skips if all A fields are already filled unless force=True.
    Returns dict of {field_name: value} for updated fields.
    """
    from .models import PatentRecord, PatentBundleAttributes, LLMProviderConfig, GlobalTechnologyArea
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

    # Build taxonomy reference
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

    patent_text = _build_patent_text(pr)
    ipc_codes = getattr(pr, 'ipc_classification', '') or ''
    cpc_codes = getattr(pr, 'cpc_classification', '') or ''

    prompt = f"""You are a patent technology analyst. Classify the following patent using the provided taxonomy.

PATENT:
{patent_text}

IPC Codes: {ipc_codes}
CPC Codes: {cpc_codes}

TAXONOMY (choose a1_primary_domain and a2_tech_subcategory from these names exactly):
{taxonomy_lines}

TASK: Return a JSON object with these 5 fields:
- "a1_primary_domain": The primary technology domain name — must exactly match a name from the taxonomy list above
- "a2_tech_subcategory": A specific subcategory within that domain (2-4 words, can be free-form if taxonomy does not cover it)
- "a3_stack_layer": One of: App, Middleware, Cloud, Hardware, OS, Protocol, or "" if not applicable
- "a4_subsystem": The specific subsystem or component this patent targets (2-5 words, free-form)
- "a5_use_case": The primary use case or application (5-10 words, free-form)

Return ONLY valid JSON, no explanation:
{{"a1_primary_domain": "...", "a2_tech_subcategory": "...", "a3_stack_layer": "...", "a4_subsystem": "...", "a5_use_case": "..."}}"""

    raw_response = _call_llm(prompt)
    if not raw_response:
        logger.warning('LLM returned no response for Group A classification of patent %s', patent_record_id)
        return {}

    # Parse and validate
    try:
        start = raw_response.find('{')
        end = raw_response.rfind('}') + 1
        extracted = json.loads(raw_response[start:end]) if start >= 0 else {}
    except (json.JSONDecodeError, ValueError):
        logger.warning('Could not parse LLM Group A response for patent %s', patent_record_id)
        return {}

    # Validate a3_stack_layer choice
    if 'a3_stack_layer' in extracted:
        v = extracted['a3_stack_layer']
        if v not in _A3_CHOICES:
            extracted['a3_stack_layer'] = ''

    # Only write fields we got back
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


def _all_attribute_field_names() -> List[str]:
    return [
        'a1_primary_domain','a2_tech_subcategory','a3_stack_layer','a4_subsystem','a5_use_case',
        'b1_sep_potential','b2_standard_tagged','b3_interface_role',
        'c1_claim_type','c2_breadth','c3_claim_count','c4_design_around_difficulty',
        'd1_external_detectability','d2_teardown_detectability','d3_reads_on_products',
        'e1_family_size','e2_prosecution_status','e3_continuation','e4_remaining_term_years','e5_maintenance_status',
        'f1_jurisdictions','f2_trilateral','f3_major_market_score',
        'g1_convergence_theme','g2_generation_tag','g3_cross_industry_applicability',
        'h1_claim_strength','h2_prior_art_exposure','h3_prosecution_risk','h4_divided_infringement_risk',
        'h5_forward_citations','h6_backward_citations','h7_litigation_history',
        'h8_chain_of_title','h9_eou_availability','h10_encumbrance_status',
        'i1_product_mapping_confidence','i2_implementation_maturity',
        'i3_adjacent_market_reread','i4_workaround_complexity',
    ]
