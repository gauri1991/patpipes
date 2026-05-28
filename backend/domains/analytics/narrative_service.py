"""
AI Narrative Service

Generates executive summaries and strategic narratives from structured
patent analysis data using the configured LLM provider (Claude/OpenAI).
Falls back to template-based summaries when no LLM is configured.
"""

import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)


def generate_narrative(analysis_data: Dict[str, Any], narrative_type: str = 'executive_summary') -> str:
    """Generate an AI-powered narrative from analysis results.

    Args:
        analysis_data: Structured analysis output (from landscape, whitespace, etc.)
        narrative_type: 'executive_summary', 'landscape_summary', 'whitespace_summary', 'strategic_recommendation'

    Returns:
        Generated narrative text string
    """
    # Try LLM first
    llm_narrative = _try_llm_narrative(analysis_data, narrative_type)
    if llm_narrative:
        return llm_narrative

    # Fallback to template-based
    return _template_narrative(analysis_data, narrative_type)


def _try_llm_narrative(data: Dict, narrative_type: str) -> Optional[str]:
    """Attempt LLM-powered narrative generation."""
    try:
        from .models import LLMProviderConfig
        config = LLMProviderConfig.objects.filter(is_active=True).first()
        if not config:
            return None

        from django.core.signing import Signer
        signer = Signer()
        try:
            api_key = signer.unsign(config.api_key)
        except Exception:
            api_key = config.api_key

        prompt = _build_prompt(data, narrative_type)

        model = config.resolved_model
        if config.provider == 'anthropic':
            return _call_anthropic(api_key, prompt, model=model)
        elif config.provider == 'openai':
            return _call_openai(api_key, prompt, model=model)

        return None
    except Exception as e:
        logger.warning('LLM narrative generation failed: %s', e)
        return None


def _build_prompt(data: Dict, narrative_type: str) -> str:
    """Build the LLM prompt from analysis data."""
    total = data.get('total_patents', 0)

    if narrative_type == 'executive_summary':
        # Merge landscape + whitespace data
        landscape = data.get('landscape', data)
        whitespace = data.get('whitespace', {})

        metrics = []
        metrics.append(f"Total patents analyzed: {total}")

        if landscape.get('clusters'):
            metrics.append(f"Technology clusters identified: {len(landscape['clusters'])}")
        if landscape.get('geographic_distribution'):
            top_geo = sorted(landscape['geographic_distribution'].items(), key=lambda x: -x[1])[:3]
            metrics.append(f"Top jurisdictions: {', '.join(f'{k} ({v})' for k, v in top_geo)}")
        if landscape.get('citation_influence'):
            top_cited = landscape['citation_influence'][0]
            metrics.append(f"Most influential patent: {top_cited.get('patent_id')} (score: {top_cited.get('influence_score')})")
        if landscape.get('technology_velocity'):
            emerging = [v for v in landscape['technology_velocity'] if v.get('velocity') == 'emerging']
            if emerging:
                metrics.append(f"Emerging technologies: {', '.join(v['code'] for v in emerging[:3])}")
        if whitespace.get('total_white_spaces'):
            metrics.append(f"White space opportunities: {whitespace['total_white_spaces']}")
        if whitespace.get('opportunities'):
            top_opp = whitespace['opportunities'][0]
            metrics.append(f"Top opportunity: {top_opp.get('cpc_subclass', 'N/A')} (score: {top_opp.get('opportunity_score', 'N/A')})")

        metrics_str = '\n'.join(f'- {m}' for m in metrics)

        return f"""You are a senior patent analyst. Generate a 3-paragraph executive summary for a patent landscape and white space analysis report.

Key metrics:
{metrics_str}

Requirements:
1. Paragraph 1: Overview of the landscape (scope, scale, key players)
2. Paragraph 2: Key findings (technology trends, citation patterns, competitive dynamics)
3. Paragraph 3: White space opportunities and strategic recommendations

Write in professional, concise language suitable for C-suite executives. No bullet points — flowing prose only. Keep it under 300 words."""

    elif narrative_type == 'strategic_recommendation':
        return f"""You are a senior IP strategist. Given this patent analysis data, generate a 2-paragraph strategic recommendation for entering or expanding in this technology space.

Data summary:
- Patents: {total}
- White spaces found: {data.get('total_white_spaces', 0)}
- Market concentration: {data.get('market_concentration', 'unknown')}

Write actionable recommendations. Keep under 200 words."""

    return f"Summarize this patent analysis data in 3 paragraphs: {str(data)[:2000]}"


def _call_anthropic(api_key: str, prompt: str, system_text: str = '', model: str = 'claude-sonnet-4-6') -> Optional[str]:
    """Call Anthropic Claude API with optional cached system prompt and 429 retry."""
    import anthropic, time
    client = anthropic.Anthropic(api_key=api_key)
    kwargs: dict = {
        'model': model,
        'max_tokens': 4096,
        'messages': [{'role': 'user', 'content': prompt}],
    }
    if system_text:
        kwargs['system'] = [{
            'type': 'text',
            'text': system_text,
            'cache_control': {'type': 'ephemeral'},
        }]

    for attempt in range(4):
        try:
            response = client.messages.create(**kwargs)
            return response.content[0].text
        except anthropic.RateLimitError:
            if attempt >= 3:
                logger.error('Anthropic rate limit: retries exhausted')
                return None
            wait = 30 * (2 ** attempt)
            logger.warning('Anthropic rate limit — waiting %d s (attempt %d/3)', wait, attempt + 1)
            time.sleep(wait)
        except Exception as e:
            logger.warning('Anthropic call failed: %s', e)
            return None
    return None


def _call_openai(api_key: str, prompt: str, system_text: str = '', model: str = 'gpt-4o') -> Optional[str]:
    """Call OpenAI API with optional system prompt."""
    try:
        import openai
        client = openai.OpenAI(api_key=api_key)
        messages = []
        if system_text:
            messages.append({'role': 'system', 'content': system_text})
        messages.append({'role': 'user', 'content': prompt})
        response = client.chat.completions.create(
            model=model,
            max_tokens=4096,
            messages=messages,
        )
        return response.choices[0].message.content
    except Exception as e:
        logger.warning('OpenAI API call failed: %s', e)
        return None


def _template_narrative(data: Dict, narrative_type: str) -> str:
    """Generate a template-based narrative when no LLM is available."""
    total = data.get('total_patents', 0)

    if narrative_type in ('executive_summary', 'landscape_summary'):
        landscape = data.get('landscape', data)
        whitespace = data.get('whitespace', {})

        clusters = landscape.get('clusters', [])
        geo = landscape.get('geographic_distribution', {})
        velocity = landscape.get('technology_velocity', [])
        emerging = [v for v in velocity if v.get('velocity') == 'emerging']

        top_geo = sorted(geo.items(), key=lambda x: -x[1])[:3] if geo else []
        geo_str = ', '.join(f'{k} ({v})' for k, v in top_geo) if top_geo else 'multiple jurisdictions'

        para1 = f"This analysis covers {total:,} patents across {len(geo)} jurisdictions, with the highest filing activity in {geo_str}. {len(clusters)} distinct technology clusters were identified."

        emerging_str = ', '.join(v['code'] for v in emerging[:3]) if emerging else 'several areas'
        para2 = f"Technology velocity analysis reveals emerging growth in {emerging_str}. The filing trend data indicates {'accelerating' if any(v.get('growth_pct', 0) > 20 for v in velocity) else 'stable'} innovation activity across the landscape."

        ws_count = whitespace.get('total_white_spaces', 0)
        opp_count = len(whitespace.get('opportunities', []))
        para3 = f"{ws_count} white space zones were identified with {opp_count} ranked opportunities. {'Strategic filing in these areas could establish early-mover advantage.' if ws_count > 0 else 'The landscape appears well-covered with limited white space opportunities.'}"

        return f"{para1}\n\n{para2}\n\n{para3}"

    return f"Analysis of {total:,} patents completed. See detailed results below."


def generate_merged_report(project_id: str) -> Dict[str, Any]:
    """Run landscape + whitespace analyses and merge into a master report with narrative.

    This is Step 4.1 + 4.3 + 4.4 of the pipeline.

    Args:
        project_id: UUID of the AnalyticsProject

    Returns:
        Merged report dict with landscape results, whitespace results, and AI narrative
    """
    from .algorithms import analyze_landscape, identify_white_space

    landscape_result = analyze_landscape(project_id)
    whitespace_result = identify_white_space(project_id)

    # Merge
    merged = {
        'project_id': project_id,
        'total_patents': landscape_result.get('total_patents', 0),
        'landscape': landscape_result,
        'whitespace': whitespace_result,
    }

    # Generate narrative
    narrative = generate_narrative(merged, 'executive_summary')
    merged['executive_summary'] = narrative

    # Store in PatentAnalysisResult
    try:
        from .models import PatentAnalysisResult, AnalyticsProject
        project = AnalyticsProject.objects.get(id=project_id)
        PatentAnalysisResult.objects.create(
            application_id=str(project_id),
            analysis_type='merged_landscape_whitespace',
            extracted_entities=merged,
            metadata={
                'project_name': project.name,
                'narrative_type': 'executive_summary',
                'has_llm_narrative': narrative != _template_narrative(merged, 'executive_summary'),
            },
        )
    except Exception as e:
        logger.warning('Failed to persist merged report: %s', e)


# ── Value Proposition Generator ───────────────────────────────────────────────
# Implements Value_Proposition_Framework_v3.md Sections 3, 4, 5, 9, 11, 17–19

# Section 4 archetype data — over-weighted attributes and language registers
ARCHETYPE_DATA = {
    'OC-DEF': {
        'name': 'Operating Co. — Defensive',
        'description': 'established product companies building freedom-to-operate',
        'key_phrases': ['freedom to operate', 'subsystem coverage', 'design-around closure'],
        'over_weights': ['A1', 'A2', 'F2', 'H8', 'H10', 'E4'],
        'deal_killer_pre_empt': 'clean chain of title and no encumbrances',
    },
    'OC-OFF': {
        'name': 'Operating Co. — Offensive',
        'description': 'companies building counter-assertion capability against named competitors',
        'key_phrases': ['reads on identified products', 'counter-assertion', 'competitive overlap'],
        'over_weights': ['D1', 'D3', 'I1', 'H1', 'H9'],
        'deal_killer_pre_empt': 'reads on identified commercial products',
    },
    'OC-EXP': {
        'name': 'Operating Co. — Market Expansion',
        'description': 'companies entering an adjacent market or technology category',
        'key_phrases': ['category entry', 'adjacent-market re-read', 'white-space coverage'],
        'over_weights': ['A2', 'G3', 'G1', 'C2'],
        'deal_killer_pre_empt': 'broad claim scope with cross-industry applicability',
    },
    'NPE-LIC': {
        'name': 'NPE — Licensing',
        'description': 'licensing entities assembling a willing-licensee program',
        'key_phrases': ['licensing-ready', 'EoU charts available', 'willing-licensee program'],
        'over_weights': ['D1', 'D2', 'I1', 'E4', 'H9'],
        'deal_killer_pre_empt': 'claim charts available and products mapped',
    },
    'NPE-LIT': {
        'name': 'NPE — Litigation',
        'description': 'patent assertion entities prepared to file',
        'key_phrases': ['validity-tested', 'PTAB-survived', 'mapped to commercial products'],
        'over_weights': ['D2', 'H7', 'F2', 'H9'],
        'deal_killer_pre_empt': 'validity-tested with strong claim strength',
    },
    'DEF-AGG': {
        'name': 'Defensive Aggregator',
        'description': 'pooled-fund buyers keeping patents out of NPE hands',
        'key_phrases': ['broad applicability', 'clean title', 'low invalidity exposure'],
        'over_weights': ['H1', 'H2', 'H8', 'H10', 'E4', 'G3'],
        'deal_killer_pre_empt': 'low invalidity exposure and clean title',
    },
    'LIT-FIN': {
        'name': 'Litigation Finance',
        'description': 'investors funding enforcement campaigns for ROI',
        'key_phrases': ['remaining enforcement window', 'mapped target products', 'EoU ready'],
        'over_weights': ['E4', 'H9', 'I1', 'D2'],
        'deal_killer_pre_empt': 'remaining term and EoU availability confirmed',
    },
}

# Section 11 attribute-to-copy mapping (T1/T2/T3/T4 tiers)
ATTR_COPY_MAP = {
    'A1':  {'phrase': 'covers {value}', 'tier': 'T1'},
    'A2':  {'phrase': 'with applicability across {value}', 'tier': 'T1'},
    'A21': {'phrase': 'specifically in {value}', 'tier': 'T1'},
    'A22': {'phrase': 'using {value}', 'tier': 'T2'},
    'A3_Hardware': {'phrase': 'implementation-grade hardware coverage', 'tier': 'T2'},
    'A3_App': {'phrase': 'software-deployable across product lines', 'tier': 'T2'},
    'A4': {'phrase': 'spans {value} design', 'tier': 'T2'},
    'A5': {'phrase': 'addresses the problem of {value}', 'tier': 'T2'},
    'B1_3': {'phrase': 'essential to {value}', 'tier': 'T2'},
    'B1_2': {'phrase': 'with strong standard-essentiality potential', 'tier': 'T2'},
    'C1_Apparatus': {'phrase': 'device-level coverage', 'tier': 'T1'},
    'C1_Method': {'phrase': 'process-level coverage, implementation-agnostic', 'tier': 'T2'},
    'C2_3': {'phrase': 'pioneer-class broad claims', 'tier': 'T2'},
    'C2_2': {'phrase': 'broad foundational claims', 'tier': 'T2'},
    'C2_low': {'phrase': 'tightly drafted, hard to invalidate', 'tier': 'T2'},
    'C4_3': {'phrase': 'no commercially viable workaround', 'tier': 'T2'},
    'C4_2': {'phrase': 'difficult to design around', 'tier': 'T2'},
    'D1_3': {'phrase': 'infringement detectable from product spec alone', 'tier': 'T2'},
    'D2_3': {'phrase': 'infringement provable from teardown', 'tier': 'T2'},
    'D3_3': {'phrase': 'reads on identified commercial products', 'tier': 'T2'},
    'E1_large': {'phrase': 'supported by a {value}-member patent family', 'tier': 'T1'},
    'E3_Yes': {'phrase': 'with live continuation flexibility', 'tier': 'T3'},
    'E4_long': {'phrase': 'long remaining term — strategic horizon', 'tier': 'T1'},
    'E4_mid': {'phrase': 'substantial enforcement runway', 'tier': 'T1'},
    'E4_short': {'phrase': 'immediate licensing window', 'tier': 'T1'},
    'F2_Yes': {'phrase': 'US, EU, and Asia coverage', 'tier': 'T1'},
    'G3_3': {'phrase': 'applicable across multiple industries', 'tier': 'T2'},
    'H7_Survived': {'phrase': 'validity-tested', 'tier': 'T3'},
    'H8_Clean': {'phrase': 'clean chain of title', 'tier': 'T3'},
    'H9_Yes': {'phrase': 'claim charts available', 'tier': 'T3'},
    'H10_None': {'phrase': 'unencumbered', 'tier': 'T3'},
}

# Section 18 archetype-pattern incompatibility table
PATTERN_ARCHETYPE_INCOMPATIBLE = {
    'A': {'NPE-LIT', 'LIT-FIN'},
    'B': {'DEF-AGG'},
    'C': {'OC-EXP'},
    'D': {'NPE-LIT', 'NPE-LIC', 'LIT-FIN', 'DEF-AGG'},
}

# Bundles that qualify for Pattern A (high-quality composition)
PATTERN_A_QUALIFYING_BUNDLES = {
    'ANCHOR_HALO', 'BATTLE_TESTED', 'EOU_BACKED', 'FOUNDATIONAL',
    'HIGH_CITATION', 'SEP', 'STRONG_CORE_TAIL',
}

# Block 5 mode by pattern
BLOCK5_MODE = {'A': 'prose', 'B': 'close_tag', 'C': 'omit', 'D': 'omit'}

# Section 12 bundle-type narrative guide (pattern, archetype, buyer hook, block5 mode)
BUNDLE_TYPE_GUIDE = {
    'TECH_DOMAIN':      {'pattern': 'C', 'archetype': 'OC-DEF',  'buyer_hook': 'active in {domain}',               'block5': 'omit'},
    'SEP':              {'pattern': 'A', 'archetype': 'NPE-LIC',  'buyer_hook': 'implementers of {standard}',        'block5': 'prose'},
    'PRODUCT_ARCH':     {'pattern': 'A', 'archetype': 'OC-DEF',  'buyer_hook': 'building {product}',                'block5': 'prose'},
    'DETECTABILITY':    {'pattern': 'A', 'archetype': 'NPE-LIT',  'buyer_hook': 'litigation-ready buyers',           'block5': 'prose'},
    'FOUNDATIONAL':     {'pattern': 'A', 'archetype': 'OC-DEF',  'buyer_hook': 'established players',               'block5': 'prose'},
    'DEFENSIVE':        {'pattern': 'A', 'archetype': 'OC-OFF',  'buyer_hook': 'facing assertion risk',              'block5': 'prose'},
    'ANCHOR_HALO':      {'pattern': 'A', 'archetype': 'OC-DEF',  'buyer_hook': 'strategic acquirers',               'block5': 'prose'},
    'PICKET_FENCE':     {'pattern': 'A', 'archetype': 'OC-DEF',  'buyer_hook': 'operators in the {domain} space',   'block5': 'prose'},
    'CONTINUATION_LIVE':{'pattern': 'B', 'archetype': 'OC-EXP',  'buyer_hook': 'shaping claims to a product',       'block5': 'close_tag'},
    'EOU_BACKED':       {'pattern': 'A', 'archetype': 'NPE-LIC',  'buyer_hook': 'monetization-ready buyers',         'block5': 'prose'},
    'BATTLE_TESTED':    {'pattern': 'A', 'archetype': 'NPE-LIT',  'buyer_hook': 'litigation buyers needing certainty','block5': 'prose'},
    'HIGH_CITATION':    {'pattern': 'A', 'archetype': 'DEF-AGG',  'buyer_hook': 'category-defining acquirers',       'block5': 'prose'},
    'PRE_EXPIRY':       {'pattern': 'C', 'archetype': 'LIT-FIN',  'buyer_hook': 'litigation-finance buyers',         'block5': 'omit'},
    'STRONG_CORE_TAIL': {'pattern': 'A', 'archetype': 'OC-DEF',  'buyer_hook': 'acquirers seeking portfolio depth',  'block5': 'prose'},
}


def suggest_archetype(bundle_codes: list, patent_attributes: list, scorecard: dict) -> tuple:
    """Return (archetype, reason) using the §4.5 decision tree from the framework.

    Priority rules (evaluated in order):
      1. High D2 + H9 + H7=Survived → NPE-LIT or LIT-FIN
      2. High D3 + named product mapping → OC-OFF or NPE-LIC
      3. Broad A1/A2 + high G3 → OC-EXP
      4. Clean H8/H10 + high H1 + long E4 → DEF-AGG
      5. Integrated A4 subsystem + clean title → OC-DEF
      6. Default → OC-DEF
    """
    if not patent_attributes:
        # Fall back to bundle-type guide
        for code in bundle_codes:
            guide = BUNDLE_TYPE_GUIDE.get(code)
            if guide:
                return guide['archetype'], f'Derived from dominant bundle type {code} (§12 guide)'
        return 'OC-DEF', 'Default archetype — no attributes available'

    high_d2 = any(a.get('d2_teardown_detectability', 0) >= 2 for a in patent_attributes)
    has_h9 = any(a.get('h9_eou_availability') in ('Yes', 'Full', 'Partial') for a in patent_attributes)
    h7_survived = any(a.get('h7_litigation_history') == 'Survived' for a in patent_attributes)
    high_d3 = any(a.get('d3_reads_on_products', 0) >= 2 for a in patent_attributes)
    high_i1 = any(a.get('i1_product_mapping_confidence', 0) >= 2 for a in patent_attributes)
    unique_domains = set(
        a.get('a1_primary_domain', '') for a in patent_attributes if a.get('a1_primary_domain')
    )
    broad_domains = len(unique_domains) >= 2
    high_g3 = any(a.get('g3_cross_industry_applicability', 0) >= 2 for a in patent_attributes)
    clean_h8 = any(a.get('h8_chain_of_title') == 'Clean' for a in patent_attributes)
    no_encumbrance = any(a.get('h10_encumbrance_status') == 'None' for a in patent_attributes)
    high_h1 = any(a.get('h1_claim_strength', 0) >= 2 for a in patent_attributes)
    long_e4 = any((a.get('e4_remaining_term_years') or 0) > 10 for a in patent_attributes)
    has_a4 = any(a.get('a4_subsystem') for a in patent_attributes)

    # A2.2 niche signals — derived from claim language, more precise than A1 domain breadth
    unique_niches = set(
        a.get('a22_tech_niche', '') for a in patent_attributes if a.get('a22_tech_niche')
    )
    tight_niche = len(unique_niches) == 1 and len(patent_attributes) >= 3
    diverse_niches = len(unique_niches) >= 3

    if high_d2 and has_h9 and h7_survived:
        return 'NPE-LIT', 'High teardown detectability (D2≥2) + EoU availability (H9) + PTAB-survived (H7) — §4.5 rule 1'
    if high_d3 and high_i1:
        return 'OC-OFF', 'High reads-on score (D3≥2) + strong product mapping (I1≥2) — §4.5 rule 2'
    if tight_niche:
        return 'NPE-LIC', f'All patents share the same A2.2 niche ({list(unique_niches)[0]}) — tightly scoped portfolio ideal for targeted licensing — §4.5 A2.2 rule'
    if broad_domains and high_g3:
        return 'OC-EXP', f'Broad domain coverage ({len(unique_domains)} domains) + cross-industry applicability (G3≥2) — §4.5 rule 3'
    if diverse_niches:
        return 'OC-DEF', f'{len(unique_niches)} distinct A2.2 niches — broad technical coverage signals defensive moat — §4.5 A2.2 rule'
    if clean_h8 and no_encumbrance and high_h1 and long_e4:
        return 'DEF-AGG', 'Clean title (H8) + unencumbered (H10) + strong claims (H1≥2) + long term (E4>10y) — §4.5 rule 4'
    if has_a4 and clean_h8:
        return 'OC-DEF', 'Integrated subsystem coverage (A4) + clean chain of title (H8) — §4.5 rule 5'
    return 'OC-DEF', 'Default archetype — no specific signals triggered (§4.5 fallback)'


def generate_meta_tags(patent_attributes: list, transaction_type: str, bundle_codes: list) -> dict:
    """Generate Block 7 meta tags per §10: Industries (1–5), Technologies (1–4), Transactions (1–2)."""
    industries: set = set()
    technologies: set = set()

    for a in patent_attributes:
        if a.get('a1_primary_domain'):
            industries.add(a['a1_primary_domain'])
            technologies.add(a['a1_primary_domain'])
        if a.get('a2_tech_subcategory'):
            industries.add(a['a2_tech_subcategory'])
        if a.get('a21_tech_detail'):
            technologies.add(a['a21_tech_detail'])
        if a.get('a22_tech_niche'):
            technologies.add(a['a22_tech_niche'])
        if a.get('a3_stack_layer'):
            technologies.add(a['a3_stack_layer'])
        if a.get('a4_subsystem'):
            technologies.add(a['a4_subsystem'])

    # Bundle-code hints for industries when attributes are sparse
    if not industries:
        for code in bundle_codes:
            guide = BUNDLE_TYPE_GUIDE.get(code)
            if guide:
                industries.add(code.replace('_', ' ').title())

    tx_map = {
        'sale': ['SALE'],
        'license': ['LICENCE', 'SALE'],
        'co_dev': ['CO-DEVELOPMENT'],
        'cross': ['CROSS-LICENCE'],
    }
    transactions = tx_map.get(transaction_type, ['SALE'])

    return {
        'industries': sorted(industries)[:5],
        'technologies': sorted(technologies)[:4],
        'transactions': transactions,
    }


def validate_tier_coverage(tier_report: dict) -> dict:
    """Validate tier coverage against §5.5 targets: 1–2 T1, 3–6 T2, 1–3 T3, 0–1 T4."""
    if not tier_report:
        return {'valid': False, 'issues': ['No tier report available'], 'warnings': [], 'counts': {}, 'targets': {}}

    t1 = tier_report.get('t1', 0)
    t2 = tier_report.get('t2', 0)
    t3 = tier_report.get('t3', 0)
    t4 = tier_report.get('t4', 0)
    issues, warnings = [], []

    if t1 < 1:
        issues.append('No T1 verifiable facts — listing lacks substantiated claims')
    elif t1 > 2:
        warnings.append(f'T1 count ({t1}) above target 1–2 — consider trimming')

    if t2 < 3:
        issues.append(f'T2 count ({t2}) below target 3–6 — not enough scored attribute signals')
    elif t2 > 6:
        warnings.append(f'T2 count ({t2}) above target 3–6 — may feel data-heavy')

    if t3 < 1:
        issues.append('No T3 signals — listing lacks diligence-grade trust signals (add claim charts / validity-tested / clean title)')
    elif t3 > 3:
        warnings.append(f'T3 count ({t3}) above target 1–3 — may read as a diligence dump')

    if t4 > 1:
        issues.append(f'T4 count ({t4}) exceeds target 0–1 — multiple market claims read as marketing puffery')

    return {
        'valid': len(issues) == 0,
        'issues': issues,
        'warnings': warnings,
        'counts': {'t1': t1, 't2': t2, 't3': t3, 't4': t4},
        'targets': {'t1': '1–2', 't2': '3–6', 't3': '1–3', 't4': '0–1'},
    }


def lint_listing(listing_text: str, package, tier_report: dict, pattern: str) -> list:
    """Check a listing against the §15 seventeen failure modes.

    Returns a list of {mode, description, severity} dicts.
    severity is 'error' (must fix) or 'warning' (should fix).
    """
    import re
    issues = []
    text_lower = (listing_text or '').lower()
    archetype = package.primary_archetype or 'OC-DEF'
    mcl = package.mcl_entries or []
    t3 = (tier_report or {}).get('t3', 0)
    t4 = (tier_report or {}).get('t4', 0)

    # 1. Wrong pattern — full prose Block 5 on a single-asset narrow (Pattern D)
    if pattern == 'D' and 'enables accelerated' in text_lower:
        issues.append({'mode': 'wrong_pattern', 'severity': 'error',
                       'description': 'Pattern D listing contains full prose Block 5 — reads as overreach for a single-asset narrow listing.'})

    # 2. Wrong archetype register
    if archetype == 'DEF-AGG' and any(p in text_lower for p in ['named competitor', 'counter-assertion', 'reads on identified products']):
        issues.append({'mode': 'wrong_archetype', 'severity': 'error',
                       'description': 'OC-OFF language detected on a DEF-AGG package — archetype register talks past the buyer.'})

    # 3. Patent-by-patent summary
    patent_refs = re.findall(r'\bUS\s*\d{7,8}\b', listing_text or '')
    if len(patent_refs) >= 3:
        issues.append({'mode': 'patent_by_patent', 'severity': 'warning',
                       'description': f'{len(patent_refs)} individual patent numbers cited — a bundle should be a single proposition, not a per-patent inventory.'})

    # 4. Vague buyer profile
    vague = ['technology companies', 'tech companies', 'various companies', 'any company', 'many companies', 'broad range of']
    if any(p in text_lower for p in vague):
        issues.append({'mode': 'vague_buyer', 'severity': 'error',
                       'description': 'Vague buyer profile detected — routes to nobody. Name specific buyer archetypes or sectors.'})

    # 5. Claim-language dump
    claim_terms = ['wherein', 'comprising the steps', 'said element', 'said device', 'at least one of the following', 'the method comprising']
    if sum(1 for t in claim_terms if t in text_lower) >= 2:
        issues.append({'mode': 'claim_language', 'severity': 'error',
                       'description': 'Patent claim language detected — this reads as legal text, not marketing copy. Rephrase into buyer benefits.'})

    # 6. Unsupported T4
    t4_phrases = ['billion market', 'cagr', 'market growing', 'billion opportunity', 'trillion market', 'growing at']
    if any(p in text_lower for p in t4_phrases) and not mcl:
        issues.append({'mode': 'unsupported_t4', 'severity': 'error',
                       'description': "Market-size claim present but no MCL entry supports it — buyer's analyst will flag as unsupported puffery."})

    # 7. Adjective inflation
    banned = ['revolutionary', 'breakthrough', 'innovative', 'cutting-edge', 'best-in-class',
               'paradigm-shifting', 'game-changing', 'world-class', 'unprecedented', 'disruptive']
    found = [w for w in banned if w in text_lower]
    if found:
        issues.append({'mode': 'adjective_inflation', 'severity': 'error',
                       'description': f'Banned adjectives found: {", ".join(found)}. Remove — they burn buyer trust.'})

    # 8. Tier mixing — T2 attribute adjacent to un-cited T4 market claim
    if tier_report and t4 > 0 and tier_report.get('t2', 0) > 0:
        sentences_list = tier_report.get('sentences', [])
        for i, s in enumerate(sentences_list):
            if s.get('tier') == 'T2':
                for j in [i - 1, i + 1]:
                    if 0 <= j < len(sentences_list) and sentences_list[j].get('tier') == 'T4':
                        issues.append({'mode': 'tier_mixing', 'severity': 'warning',
                                       'description': 'T2 scored attribute and T4 market claim appear in adjacent sentences — blurs patent facts vs market claims. Separate with a divider or reorder.'})
                        break

    # 9. Too long for pattern
    word_count = len((listing_text or '').split())
    limits = {'A': 350, 'B': 220, 'C': 200, 'D': 200}
    if pattern in limits and word_count > limits[pattern]:
        issues.append({'mode': 'too_long', 'severity': 'warning',
                       'description': f'Pattern {pattern} listing is {word_count} words — target ≤{limits[pattern]}. Trim for buyer scan speed.'})

    # 10. Missing timing hook when MCL has one
    if mcl and t4 == 0:
        issues.append({'mode': 'missing_timing_hook', 'severity': 'warning',
                       'description': 'MCL entries exist but no market/timing hook (Block 4) present — missed an easy strategic anchor.'})

    # 11. Forced timing hook without MCL
    if not mcl and t4 > 0:
        issues.append({'mode': 'forced_timing_hook', 'severity': 'error',
                       'description': 'Market-context claim present without an MCL entry — weakens overall credibility.'})

    # 12. Mixing transaction modes in prose
    tx_words_found = sum(1 for w in ['for license,', 'for sale,', 'for strategic partnership', 'license, sale'] if w in text_lower)
    if tx_words_found >= 2:
        issues.append({'mode': 'transaction_mixing', 'severity': 'warning',
                       'description': 'Multiple transaction modes mixed in body prose — use meta tags for flexibility; keep prose focused on one positioning.'})

    # 13. Generic close-tag triplet
    generic_markers = ['great for product, defense', 'licensing, defense, and revenue', 'product, defense, and revenue']
    if any(m in text_lower for m in generic_markers):
        issues.append({'mode': 'generic_triplet', 'severity': 'warning',
                       'description': 'Generic buyer-value triplet detected — must name specific sectors or use cases, not generic categories like "product, defense, revenue".'})

    # 14. Missing T3 signals
    if t3 == 0:
        issues.append({'mode': 'missing_t3', 'severity': 'error',
                       'description': 'No T3 signals present — add at minimum one of: claim charts available, validity-tested, clean chain of title, or continuation optionality.'})

    # 15. Buried T3 signals
    buried_markers = ['among other features', 'it is also worth noting', 'additionally, claim charts', 'also available upon']
    if t3 > 0 and any(m in text_lower for m in buried_markers):
        issues.append({'mode': 'buried_t3', 'severity': 'warning',
                       'description': 'T3 signal appears buried inside an addendum clause — T3 deserves a standalone sentence for maximum buyer impact.'})

    return issues


def validate_quality_gates(package, scorecard: dict, tier_report: dict, listing_text: str, pattern: str) -> dict:
    """Run the §17 authoring workflow quality gates.

    Returns {gates, all_passed, passed_count, total}.
    """
    gates = []

    # Gate 1: Does the scorecard show STRONG or MODERATE?
    strength_flags = [
        (scorecard.get(code) or {}).get('strength_flag', 'WEAK')
        for code in (package.bundle_codes or [])
    ]
    has_quality = any(f in ('STRONG', 'MODERATE') for f in strength_flags)
    gates.append({
        'id': 'gate_1', 'step': 1, 'name': 'Bundle Strength',
        'passed': has_quality,
        'message': 'At least one bundle rated STRONG or MODERATE' if has_quality
                   else 'All bundles WEAK — reconsider whether this bundle should be marketed',
    })

    # Gate 5: Five-second test — opener conveys domain + count + buyer
    opener_ok = bool(listing_text) and len(listing_text.split()) >= 60
    gates.append({
        'id': 'gate_5', 'step': 5, 'name': 'Five-Second Test',
        'passed': opener_ok,
        'message': 'Listing has sufficient opening content' if opener_ok
                   else 'Listing too short — Block 1 must convey domain, asset count, and buyer type within 5 seconds of reading',
    })

    # Gate 11: Zero critical failure modes
    lint_results = lint_listing(listing_text, package, tier_report, pattern)
    errors = [r for r in lint_results if r.get('severity') == 'error']
    gates.append({
        'id': 'gate_11', 'step': 11, 'name': 'Failure-Mode Checklist',
        'passed': len(errors) == 0,
        'message': 'No critical failure modes' if len(errors) == 0
                   else f'{len(errors)} critical failure mode(s) — must fix before listing',
    })

    # Gate 12: Tier discipline
    tier_val = validate_tier_coverage(tier_report)
    gates.append({
        'id': 'gate_12', 'step': 12, 'name': 'Tier Discipline',
        'passed': tier_val['valid'],
        'message': 'Tier coverage within targets (1–2 T1, 3–6 T2, 1–3 T3, 0–1 T4)' if tier_val['valid']
                   else '; '.join(tier_val.get('issues', ['Tier coverage out of range'])),
    })

    # Gate 14: Exemplar density proxy (word count + T2 signals)
    wc = len((listing_text or '').split())
    t2 = (tier_report or {}).get('t2', 0)
    density_ok = wc >= 100 and t2 >= 2
    gates.append({
        'id': 'gate_14', 'step': 14, 'name': 'Exemplar Density',
        'passed': density_ok,
        'message': f'Listing meets density requirements ({wc} words, {t2} T2 signals)' if density_ok
                   else f'Under-substantiated — {wc} words, {t2} T2 signals (target: ≥100 words, ≥2 T2)',
    })

    return {
        'gates': gates,
        'all_passed': all(g['passed'] for g in gates),
        'passed_count': sum(1 for g in gates if g['passed']),
        'total': len(gates),
    }


def generate_deck(package, bundle_data: dict, patent_attributes: list, listing_text: str) -> str:
    """Generate a Rung 3 non-confidential offering deck (7-slide markdown outline)."""
    archetype = package.primary_archetype or 'OC-DEF'
    arch_info = ARCHETYPE_DATA.get(archetype, ARCHETYPE_DATA['OC-DEF'])
    domain = _get_domain_from_attributes(patent_attributes)
    asset_count = len(patent_attributes) or len(package.bundle_codes or []) * 5
    scorecard = bundle_data.get('scorecard', {})
    best_signal = _get_best_t3_signal(patent_attributes, scorecard, package.bundle_codes or [])

    # Try LLM
    try:
        from .models import LLMProviderConfig
        from django.core.signing import Signer
        config = LLMProviderConfig.objects.filter(is_active=True).first()
        if config:
            api_key = Signer().unsign(config.api_key) if config.api_key else ''
            prompt = (
                f"Generate a 7-slide non-confidential patent offering deck in markdown for:\n"
                f"Package: {package.name}\nDomain: {domain}\nArchetype: {archetype} — {arch_info['name']}\n"
                f"Transaction: {package.get_transaction_type_display()}\nAssets: {asset_count}\n"
                f"Bundles: {', '.join(package.bundle_codes or [])}\n\n"
                f"Listing excerpt:\n{(listing_text or '')[:600]}\n\n"
                "Slides: 1-Cover, 2-Executive Summary (3 bullets), 3-Feature Highlights (one per bullet from listing), "
                "4-Buyer Fit (3 archetypes), 5-Package Summary (counts/term/jurisdictions), "
                "6-Supporting Materials (claim charts/wrappers/title), 7-Next Steps.\n"
                "Each slide: title + 3–5 bullets + one speaker note. Active voice. No unsupported claims."
            )
            model = config.resolved_model
            raw = None
            if config.provider == 'anthropic':
                raw = _call_anthropic(api_key, prompt, model=model)
            elif config.provider == 'openai':
                raw = _call_openai(api_key, prompt, model=model)
            if raw:
                return raw
    except Exception as e:
        logger.warning('LLM deck generation failed: %s', e)

    # Template fallback
    bullets = _build_vp_bullets(patent_attributes, archetype)
    avg_term = (sum((a.get('e4_remaining_term_years') or 0) for a in patent_attributes) / len(patent_attributes)) if patent_attributes else 0
    trilateral = any(a.get('f2_trilateral') for a in patent_attributes)
    has_eou = any(a.get('h9_eou_availability') in ('Yes', 'Full', 'Partial') for a in patent_attributes)
    clean_title = any(a.get('h8_chain_of_title') == 'Clean' for a in patent_attributes)
    secondary_arch_info = ARCHETYPE_DATA.get(package.secondary_archetype or 'OC-EXP', ARCHETYPE_DATA['OC-EXP'])

    return f"""# {package.name} — Offering Deck
*Rung 3 — Non-Confidential | {package.get_transaction_type_display()}*

---

## Slide 1 — Cover
**{package.name}**
- Transaction: {package.get_transaction_type_display()} on private placement basis
- Domain: {domain or "Core Technology"}
- Further details available under NDA

*Speaker note: Set the stage — exclusive, structured process, NDA-gated diligence.*

---

## Slide 2 — Executive Summary
**{asset_count} asset{"s" if asset_count != 1 else ""} — {domain or "Core Technology"}**
- Positioned for {arch_info.get("description", "qualified buyers")}
- {best_signal or "Strong technical merit across selected bundles"}
- Available for {package.get_transaction_type_display().lower()} — full diligence package under NDA

*Speaker note: Three points — what it is, who it's for, what's available.*

---

## Slide 3 — Feature Highlights
**Technical Strengths**
{"".join(f"- {b}{chr(10)}" for b in bullets)}
*Speaker note: Each bullet maps to a patent attribute — expand with claim detail under NDA.*

---

## Slide 4 — Buyer Fit
**Strategic fit for:**
- **{arch_info.get("name")}** — {arch_info.get("description")}
- **{secondary_arch_info.get("name")}** — {secondary_arch_info.get("description")}
- **Defensive aggregators** — keeping assets out of NPE hands; clean title and broad applicability

*Speaker note: Match named companies to archetypes in the NDA-gated version.*

---

## Slide 5 — Package Summary
- Bundle types: {", ".join(package.bundle_codes or ["N/A"])}
- Total assets: {asset_count}
- Average remaining term: {"~" + str(round(avg_term, 1)) + " years" if avg_term else "pending"}
- Jurisdictions: {"US, EU, Asia (trilateral coverage)" if trilateral else "US; additional jurisdictions available"}

*Speaker note: Source all figures from PatentBundleAttributes before presenting.*

---

## Slide 6 — Supporting Materials
**Available under NDA:**
- Claim charts: {"Yes" if has_eou else "Available upon request"}
- File wrappers: Yes
- Chain of title: {"Clean — confirmed" if clean_title else "Available for review"}
- Prosecution history: Available

*Speaker note: Only commit to what legal has confirmed. Do not over-promise.*

---

## Slide 7 — Process & Next Steps
1. Execute NDA
2. Receive full diligence package
3. Submit indications of interest
4. Bid deadline: [TBD — insert date]
5. Contact: [Broker name / email]

*Speaker note: Keep process crisp — complexity signals weak seller confidence.*
"""


def generate_cim(package, bundle_data: dict, patent_attributes: list) -> str:
    """Generate a Rung 4 Confidential Information Memorandum (CIM) outline.

    Based on §3 Rung 4 structure: 10 sections, 20–40 pages.
    Generated as structured markdown — broker fills in diligence detail.
    """
    archetype = package.primary_archetype or 'OC-DEF'
    arch_info = ARCHETYPE_DATA.get(archetype, ARCHETYPE_DATA['OC-DEF'])
    domain = _get_domain_from_attributes(patent_attributes)
    asset_count = len(patent_attributes) or len(package.bundle_codes or []) * 5
    scorecard = bundle_data.get('scorecard', {})
    mcl = package.mcl_entries or []

    # Try LLM for executive summary section (most value-added)
    exec_summary = ''
    try:
        from .models import LLMProviderConfig
        from django.core.signing import Signer
        config = LLMProviderConfig.objects.filter(is_active=True).first()
        if config:
            api_key = Signer().unsign(config.api_key) if config.api_key else ''
            prompt = (
                f"Write a 1-page (250-350 word) executive summary for a patent CIM.\n"
                f"Package: {package.name}\nDomain: {domain}\nArchetype: {archetype}\n"
                f"Transaction: {package.get_transaction_type_display()}\nAssets: {asset_count}\n"
                f"Listing: {package.generated_listing[:800] if package.generated_listing else 'N/A'}\n\n"
                "Write in banker-formal register. Source every claim to an attribute or market fact. "
                "No unsupported adjectives. Structure: What / Why this portfolio / Who should acquire it / Process."
            )
            model = config.resolved_model
            raw = None
            if config.provider == 'anthropic':
                raw = _call_anthropic(api_key, prompt, model=model)
            elif config.provider == 'openai':
                raw = _call_openai(api_key, prompt, model=model)
            if raw:
                exec_summary = raw
    except Exception as e:
        logger.warning('LLM CIM exec summary failed: %s', e)

    # Derive attribute summaries
    h_attrs = {
        'avg_h1': (sum((a.get('h1_claim_strength') or 0) for a in patent_attributes) / len(patent_attributes)) if patent_attributes else 0,
        'avg_h2': (sum((a.get('h2_prior_art_exposure') or 0) for a in patent_attributes) / len(patent_attributes)) if patent_attributes else 0,
        'eou_pct': round(100 * sum(1 for a in patent_attributes if a.get('h9_eou_availability') in ('Yes', 'Full', 'Partial')) / max(len(patent_attributes), 1)),
        'survived': sum(1 for a in patent_attributes if a.get('h7_litigation_history') == 'Survived'),
        'clean_title': sum(1 for a in patent_attributes if a.get('h8_chain_of_title') == 'Clean'),
        'unencumbered': sum(1 for a in patent_attributes if a.get('h10_encumbrance_status') == 'None'),
    }
    avg_term = (sum((a.get('e4_remaining_term_years') or 0) for a in patent_attributes) / len(patent_attributes)) if patent_attributes else 0
    avg_d1 = (sum((a.get('d1_external_detectability') or 0) for a in patent_attributes) / len(patent_attributes)) if patent_attributes else 0
    avg_i1 = (sum((a.get('i1_product_mapping_confidence') or 0) for a in patent_attributes) / len(patent_attributes)) if patent_attributes else 0
    trilateral = any(a.get('f2_trilateral') for a in patent_attributes)
    jurisdictions = set()
    for a in patent_attributes:
        jlist = a.get('f1_jurisdictions') or []
        if isinstance(jlist, list):
            jurisdictions.update(jlist)
    cont_live = sum(1 for a in patent_attributes if a.get('e3_continuation') or a.get('e3_live_continuation') == 'Yes')

    exec_block = exec_summary if exec_summary else (
        f"This memorandum presents {asset_count} patent asset{'s' if asset_count != 1 else ''} "
        f"covering {domain or 'core technology'} for {package.get_transaction_type_display().lower()} "
        f"on a private, structured basis. The portfolio is positioned for {arch_info.get('description', 'qualified buyers')}. "
        f"{arch_info.get('deal_killer_pre_empt', 'Technical merit and enforceability have been verified').capitalize()}. "
        f"All diligence materials referenced herein are available under the executed NDA."
    )

    market_block = ''
    if mcl:
        market_block = '\n'.join(f"- {e.get('statement', '')} [{e.get('source', '')}]" for e in mcl[:3])
    else:
        market_block = '*No market context entries — add MCL entries to populate this section.*'

    return f"""# {package.name}
## Confidential Information Memorandum
*Rung 4 — Confidential | Released under NDA | {package.get_transaction_type_display()}*

---

## 1. Executive Summary *(1 page)*

{exec_block}

---

## 2. Asset List *(1–3 pages)*

| # | Asset | Status | Family Size | Remaining Term |
|---|-------|--------|-------------|---------------|
{"".join(f"| {i+1} | {a.get('patent_number') or a.get('patent_id') or f'Asset {i+1}'} | {a.get('e2_prosecution_status') or 'Granted'} | {a.get('e1_family_size') or '—'} | {str(round(a.get('e4_remaining_term_years') or 0, 1)) + 'y' if a.get('e4_remaining_term_years') else '—'} |\n" for i, a in enumerate(patent_attributes[:20]))}
*Full bibliography with priority dates and IPC codes available in Appendix A.*

---

## 3. Technical Overview *(3–5 pages)*

**Primary Domain:** {domain or '[Complete from A1 attributes]'}
**Bundle Types:** {', '.join(package.bundle_codes or [])}
**Claim Coverage:**
- Breadth: avg H1 = {round(h_attrs['avg_h1'], 2)} / 3.0
- Scope: {', '.join(set(a.get('a4_subsystem') or '' for a in patent_attributes if a.get('a4_subsystem'))[:4]) or '[derive from A4]'}
- Use cases: {', '.join(set(a.get('a5_use_case') or '' for a in patent_attributes if a.get('a5_use_case'))[:4]) or '[derive from A5]'}

*[Expand with claim-level analysis and diagrams under NDA]*

---

## 4. Claim Landscape *(2–4 pages)*

- Independent claim types: {', '.join(set(a.get('c1_claim_type') or '' for a in patent_attributes if a.get('c1_claim_type'))[:4]) or '[derive from C1]'}
- Claim breadth distribution: avg C2 = {round(sum((a.get('c2_claim_breadth') or 0) for a in patent_attributes) / max(len(patent_attributes), 1), 2)} / 3.0
- Design-around difficulty: avg C4 = {round(sum((a.get('c4_design_around_difficulty') or 0) for a in patent_attributes) / max(len(patent_attributes), 1), 2)} / 3.0

*[Provide claim charts for top assets under NDA]*

---

## 5. Quality & Vulnerability Assessment *(2–4 pages)*

| Metric | Value |
|--------|-------|
| Avg claim strength (H1) | {round(h_attrs['avg_h1'], 2)} / 3.0 |
| Avg prior art exposure (H2) | {round(h_attrs['avg_h2'], 2)} / 3.0 |
| Validity-tested (PTAB survived) | {h_attrs['survived']} of {len(patent_attributes)} assets |
| Clean chain of title (H8) | {h_attrs['clean_title']} of {len(patent_attributes)} assets |
| Unencumbered (H10) | {h_attrs['unencumbered']} of {len(patent_attributes)} assets |
| EoU availability (H9) | {h_attrs['eou_pct']}% of assets |

---

## 6. Detectability & Evidence-of-Use *(2–4 pages)*

| Metric | Score |
|--------|-------|
| External detectability (D1) | {round(avg_d1, 2)} / 3.0 |
| Teardown detectability (D2) | avg {round(sum((a.get('d2_teardown_detectability') or 0) for a in patent_attributes) / max(len(patent_attributes), 1), 2)} / 3.0 |
| Product mapping confidence (I1) | {round(avg_i1, 2)} / 3.0 |
| EoU charts available | {"Yes — available under NDA" if h_attrs['eou_pct'] > 0 else "Not available"} |

*[List named products and D3 reads-on evidence under NDA]*

---

## 7. Geographic Coverage *(1 page)*

- Trilateral coverage (US + EU + Asia): {"Yes" if trilateral else "No"}
- Jurisdictions with active grants: {', '.join(sorted(jurisdictions)[:10]) if jurisdictions else '[derive from F1 attributes]'}
- Major market score: avg {round(sum((a.get('f3_major_market_score') or 0) for a in patent_attributes) / max(len(patent_attributes), 1), 2)} / 3.0

---

## 8. Lifecycle & Continuation Optionality *(1–2 pages)*

- Average remaining term: {round(avg_term, 1)} years
- Live continuation applications: {cont_live} of {len(patent_attributes)} assets
- Maintenance status: {', '.join(set(a.get('e5_maintenance_status') or '' for a in patent_attributes if a.get('e5_maintenance_status'))[:3]) or '[derive from E5]'}

*[List open continuations and prosecution strategy under NDA]*

---

## 9. Market Context & Buyer Fit *(2–4 pages)*

**Primary Buyer Archetype:** {arch_info.get('name')} — {arch_info.get('description')}
**Deal-Killer Pre-empt:** {arch_info.get('deal_killer_pre_empt', 'Verified technical merit')}

**Market Context (MCL):**
{market_block}

**Secondary Archetype:** {ARCHETYPE_DATA.get(package.secondary_archetype or 'OC-EXP', {}).get('name') or 'N/A'}

---

## 10. Process & Next Steps *(1 page)*

1. NDA execution → receive full diligence package
2. Management presentation: [date TBD]
3. Indications of interest deadline: [date TBD]
4. Binding bid deadline: [date TBD]
5. Closing target: [date TBD]
6. Contact: [Broker name and contact details]

*All bids subject to seller's right to reject any or all offers.*

---
*This memorandum is confidential and may not be shared without written consent.*
*Prepared under Value_Proposition_Framework_v3 — Rung 4.*
"""


def suggest_pattern(
    asset_count: int,
    mcl_available: bool,
    bundle_codes: list,
    archetype: str,
) -> tuple:
    """Return (pattern_letter, reason) using the Section 18 decision tree."""
    if asset_count == 1:
        pattern = 'B' if len(ARCHETYPE_DATA) >= 3 else 'D'
        reason = 'Single-asset listing — Pattern B (multiple credible buyer profiles) or D (narrow).'
    elif mcl_available and any(b in PATTERN_A_QUALIFYING_BUNDLES for b in bundle_codes):
        pattern = 'A'
        reason = 'Multi-asset with MCL entry and qualifying bundle composition (Anchor-Halo, Battle-Tested, or EoU-Backed).'
    elif mcl_available:
        pattern = 'C'
        reason = 'Multi-asset with MCL entry but no Anchor-Halo / Battle-Tested / EoU-Backed composition.'
    else:
        pattern = 'C'
        reason = 'Multi-asset without MCL entry — Pattern C (technical-spec).'

    # Compatibility check — fall back if archetype is incompatible
    fallback_order = {'A': 'C', 'B': 'C', 'C': 'A', 'D': 'B'}
    if archetype and pattern in PATTERN_ARCHETYPE_INCOMPATIBLE:
        if archetype in PATTERN_ARCHETYPE_INCOMPATIBLE[pattern]:
            original = pattern
            pattern = fallback_order.get(pattern, 'C')
            reason += f' (fell back from {original} — archetype {archetype} incompatible with {original}.)'

    return pattern, reason


def generate_teaser(
    portfolio_name: str,
    asset_count: int,
    domain: str,
    archetype: str,
    best_signal: str,
) -> str:
    """Generate a 50-80 word Rung 1 teaser (Section 3.1 template)."""
    archetype_info = ARCHETYPE_DATA.get(archetype, {})
    buyer_desc = archetype_info.get('description', 'qualified buyers')
    # Strip trailing punctuation from signal to avoid double periods
    signal = best_signal.rstrip('.')
    signal_clause = f' {signal}.' if signal else ''

    domain_clause = f'in {domain}' if domain else 'across multiple technology domains'
    portfolio_clause = f'The {portfolio_name} portfolio' if portfolio_name else 'This portfolio'

    teaser = (
        f"This offering represents {asset_count} patent asset{'s' if asset_count != 1 else ''} "
        f"{domain_clause}. {portfolio_clause} is positioned for {buyer_desc}.{signal_clause} "
        f"Available for sale or license; further details available under NDA."
    )
    return teaser.strip()


def _get_best_t3_signal(patent_attributes: list, scorecard: dict, bundle_codes: list) -> str:
    """Return the single strongest T3 signal from attributes or scorecard."""
    # Check scorecard for EoU, validity-tested, clean title
    for code in bundle_codes:
        row = scorecard.get(code, {})
        if row.get('eou_ready_pct', 0) > 50:
            return 'Claim charts available.'
        if row.get('survived_pct', 0) > 50:
            return 'Validity-tested.'

    # Check patent attributes
    for attr in patent_attributes:
        if attr.get('h9_eou_available') == 'Yes':
            return 'Claim charts available.'
        if attr.get('h7_litigation_history') == 'Survived':
            return 'Validity-tested.'
        if attr.get('h8_chain_of_title') == 'Clean':
            return 'Clean chain of title.'

    return ''


def _get_domain_from_attributes(patent_attributes: list) -> str:
    """Extract the most specific available domain label from patent attributes.

    Prefers A2.1 (specific technique) when consistently filled — produces a
    tighter, buyer-specific teaser. Falls back to A1 (broad domain).
    """
    from collections import Counter
    # Try A2.1 first — if ≥50% of patents have it and it's consistent, use it
    a21_values = [a.get('a21_tech_detail', '') for a in patent_attributes if a.get('a21_tech_detail')]
    if a21_values and len(a21_values) >= max(1, len(patent_attributes) // 2):
        most_common_a21, count = Counter(a21_values).most_common(1)[0]
        if count >= max(1, len(a21_values) // 2):
            return most_common_a21
    # Fall back to A1
    domains = [a.get('a1_primary_domain', '') for a in patent_attributes if a.get('a1_primary_domain')]
    if not domains:
        return ''
    return Counter(domains).most_common(1)[0][0]


def _build_vp_bullets(patent_attributes: list, archetype: str) -> list:
    """Build 3 capability bullets using Section 11 attribute-to-copy mapping."""
    if not patent_attributes:
        return ['Core technical claims covering the primary domain.']

    # Sort by H1 strength
    sorted_attrs = sorted(patent_attributes, key=lambda a: a.get('h1_claim_strength', 0), reverse=True)

    bullets = []

    # Bullet 1: Detectability + strength (highest H1 + D2)
    top = sorted_attrs[0]
    pid = top.get('patent_number', '')
    h1 = top.get('h1_claim_strength', 0)
    d2 = top.get('d2_teardown_detectability', 0)
    c2 = top.get('c2_claim_breadth', 0)

    strength_phrase = ATTR_COPY_MAP.get(f'C2_{c2}', ATTR_COPY_MAP.get('C2_2', {})).get('phrase', 'broad claims')
    detect_phrase = ATTR_COPY_MAP.get(f'D2_{d2}', {}).get('phrase', 'detectable infringement')
    domain = top.get('a4_subsystem', top.get('a5_use_case', 'core technology'))
    bullets.append(f'{domain.title()} — {strength_phrase}, {detect_phrase}.')

    # Bullet 2: Defensibility (C2/C4)
    if len(sorted_attrs) > 1:
        p2 = sorted_attrs[1]
        c4 = p2.get('c4_design_around', 0)
        c4_phrase = ATTR_COPY_MAP.get(f'C4_{c4}', {}).get('phrase', 'defensible claim structure')
        domain2 = p2.get('a4_subsystem', p2.get('a1_primary_domain', 'secondary application'))
        bullets.append(f'{domain2.title()} — {c4_phrase}, supporting defensive IP positioning.')
    else:
        bullets.append('Defensible claim structure — carefully drafted to minimize design-around risk.')

    # Bullet 3: Future optionality (E3, E4)
    p3 = sorted_attrs[-1] if len(sorted_attrs) > 2 else sorted_attrs[0]
    e4 = p3.get('e4_remaining_term', 0)
    e3 = p3.get('e3_live_continuation', '')
    if e3 == 'Yes':
        bullets.append(ATTR_COPY_MAP['E3_Yes']['phrase'].capitalize() + ' — pending applications enable claim tailoring to emerging products.')
    elif e4 > 12:
        bullets.append(ATTR_COPY_MAP['E4_long']['phrase'].capitalize() + ' — the portfolio anchors a long strategic horizon.')
    elif e4 > 5:
        bullets.append(ATTR_COPY_MAP['E4_mid']['phrase'].capitalize() + f' — {e4:.0f} years of remaining term.' if e4 else 'Substantial enforcement runway with active commercial relevance.')
    else:
        bullets.append('Immediate enforcement window — assets positioned for near-term monetization.')

    return bullets


def _template_listing_fallback(
    package,
    bundle_data: dict,
    patent_attributes: list,
    pattern: str,
) -> tuple:
    """
    Build a structured listing using Section 11 attribute-to-copy mapping.
    Returns (listing_text, tier_report_dict).
    """
    archetype = package.primary_archetype or 'OC-DEF'
    arch_info = ARCHETYPE_DATA.get(archetype, ARCHETYPE_DATA['OC-DEF'])
    asset_count = len(package.bundle_codes) * 10  # rough estimate
    scorecard = bundle_data.get('scorecard', {})
    mcl = package.mcl_entries or []

    domain = _get_domain_from_attributes(patent_attributes)
    best_signal = _get_best_t3_signal(patent_attributes, scorecard, package.bundle_codes)

    lines = []
    tier_sentences = []

    def add(text, tier):
        lines.append(text)
        tier_sentences.append({'text': text, 'tier': tier})

    # Block H — Header
    n_assets = len(patent_attributes) or len(package.bundle_codes)
    add(f"## {package.name} — {n_assets} asset{'s' if n_assets != 1 else ''}", 'T1')
    add(f"*Transaction: {package.get_transaction_type_display()}*", 'T1')
    add('', 'T1')

    # Block 1 — Opener
    add(f"This offering presents the {package.name} IP for {package.get_transaction_type_display().lower()} on a private placement basis.", 'T1')

    # Block 1b — Buyer-profile triplet (Patterns A, B)
    if pattern in ('A', 'B') and arch_info:
        phrases = arch_info.get('key_phrases', [])
        p1 = arch_info.get('description', 'companies in this sector').replace('companies ', '')
        add(f"This is a strategic asset for {arch_info['description']}.", 'T2')

    # Block 2 — Technical core (Pattern A, D)
    if pattern in ('A', 'D') and domain:
        add(f"\nThis portfolio covers technology in {domain}, with {arch_info.get('deal_killer_pre_empt', 'established technical merit')}.", 'T2')

    # Block 3 — Feature bullets
    add('\n**Technical highlights:**', 'T2')
    bullets = _build_vp_bullets(patent_attributes, archetype)
    for b in bullets:
        add(f'- {b}', 'T2')

    # T3 signals
    if best_signal:
        add(f'\n{best_signal}', 'T3')

    # Block 4 — Market/timing hook (only if MCL entries exist)
    if mcl:
        entry = mcl[0]
        add(f'\n{entry.get("statement", "")} [{entry.get("source", "")}]', 'T4')

    # Block 5 — Buyer-value close
    mode = BLOCK5_MODE.get(pattern, 'omit')
    if mode == 'prose':
        add(
            f'\nAcquiring this IP positions your organization with {arch_info.get("deal_killer_pre_empt", "protected technology")}, '
            f'enabling accelerated product development, a strengthened defensive IP position, and new revenue opportunities.',
            'T2',
        )
    elif mode == 'close_tag':
        add(
            f'\nA strategic asset for licensing, defensive positioning, or market expansion in the {domain or "technology"} sector.',
            'T2',
        )

    # Block 6 — CTA
    add('\n---\n*More information available upon request.*', 'T1')

    # Block 7 — Meta tags (always present)
    meta = generate_meta_tags(patent_attributes, package.transaction_type, package.bundle_codes or [])
    tags_line = (
        f"\n**Industries:** {' | '.join(meta['industries']) if meta['industries'] else 'N/A'}  \n"
        f"**Technologies:** {' | '.join(meta['technologies']) if meta['technologies'] else 'N/A'}  \n"
        f"**Transactions:** {' | '.join(meta['transactions'])}"
    )
    add(tags_line, 'T1')

    listing_text = '\n'.join(lines)

    # Tier report
    tier_counts = {'t1': 0, 't2': 0, 't3': 0, 't4': 0}
    for s in tier_sentences:
        key = s['tier'].lower()
        if key in tier_counts:
            tier_counts[key] += 1

    tier_report = {**tier_counts, 'sentences': tier_sentences}
    return listing_text, tier_report


def _parse_tier_report_from_llm(listing_text: str) -> dict:
    """Parse tier counts from an LLM-generated listing that includes a TIER REPORT section."""
    import re
    tier_counts = {'t1': 0, 't2': 0, 't3': 0, 't4': 0}
    sentences = []

    # Look for TIER REPORT section
    report_match = re.search(r'TIER REPORT\s*\n(.*?)(?:\Z)', listing_text, re.DOTALL | re.IGNORECASE)
    if report_match:
        report_block = report_match.group(1)
        for line in report_block.strip().split('\n'):
            for tier in ('T1', 'T2', 'T3', 'T4'):
                if tier in line:
                    tier_counts[tier.lower()] += 1
                    sentences.append({'text': line.strip(), 'tier': tier})
                    break
    else:
        # Fallback: count lines that contain T1/T2/T3/T4 markers
        for line in listing_text.split('\n'):
            for tier in ('T1', 'T2', 'T3', 'T4'):
                if f'[{tier}]' in line or f'({tier})' in line:
                    tier_counts[tier.lower()] += 1

    return {**tier_counts, 'sentences': sentences}


def _build_llm_prompt(package, bundle_data: dict, patent_attributes: list, pattern: str) -> str:
    """Build the Section 19 AI prompt for LLM listing generation."""
    import json
    archetype = package.primary_archetype or 'OC-DEF'
    scorecard = bundle_data.get('scorecard', {})

    # Build scorecard row from selected bundles
    scorecard_rows = []
    for code in (package.bundle_codes or [])[:5]:
        row = scorecard.get(code, {})
        if row:
            scorecard_rows.append({
                'bundle': code,
                'strength_flag': row.get('strength_flag', 'MODERATE'),
                'eou_ready_pct': row.get('eou_ready_pct', 0),
                'survived_pct': row.get('survived_pct', 0),
                'cont_optionality_pct': row.get('cont_optionality_pct', 0),
            })

    # Find dominant bundle (highest quality)
    dominant = (package.bundle_codes or ['UNKNOWN'])[0]
    for code in (package.bundle_codes or []):
        row = scorecard.get(code, {})
        if row.get('strength_flag') == 'STRONG':
            dominant = code
            break

    # Top attributes (by H1)
    top_attrs = sorted(patent_attributes, key=lambda a: a.get('h1_claim_strength', 0), reverse=True)[:8]

    payload = {
        'listing_id': f'PKG-{str(package.id)[:8].upper()}',
        'portfolio_name': package.name,
        'patent_numbers': [a.get('patent_number', '') for a in top_attrs],
        'transaction_types': [package.transaction_type.upper()],
        'dominant_bundle_type': dominant,
        'primary_archetype': archetype,
        'secondary_archetype': package.secondary_archetype or '',
        'scorecard_rows': scorecard_rows,
        'patent_attributes': [
            {k: v for k, v in a.items() if not k.startswith('_') and k != 'id'}
            for a in top_attrs
        ],
        'market_context': package.mcl_entries or [],
    }

    # Static system instructions (same for every package — cacheable by Anthropic)
    system_text = (
        "You are a patent broker's copywriter. Produce sales-package value propositions "
        "following the Value_Proposition_Framework_v3 style.\n\n"
        "INSTRUCTIONS:\n"
        "1. Generate a listing following the PATTERN specified in the user message.\n"
        "   Patterns: A=Strategic Flagship (250-350 words), B=Compressed Strategic (180-220 words), "
        "C=Technical-Spec (120-200 words), D=Single-Asset Narrow (150-200 words).\n"
        "2. Use the archetype register from Section 13 for the ARCHETYPE specified.\n"
        "3. Always include: Header, Block 1 (opener), Block 3 (3-4 bullets), Block 6 (CTA).\n"
        "4. Conditional blocks by pattern:\n"
        "   - A: + Block 1b triplet, Block 2, Block 4 if market_context non-empty, Block 5 full prose\n"
        "   - B: + Block 1b triplet, Block 3 close-tag as 4th bullet, no Block 5\n"
        "   - C: mechanism bullets, optional Block 1b, no Block 5\n"
        "   - D: Block 2 required, no Block 1b, no Block 5\n"
        "5. STYLE RULES (strict):\n"
        "   - Active voice, third-person, broker-as-narrator\n"
        "   - Banned: innovative, cutting-edge, revolutionary, best-in-class, paradigm-shifting\n"
        "   - No pricing, no valuation figures\n"
        "   - T4 statements only if market_context is non-empty\n"
        "   - Em dashes inside bullets only\n"
        "6. After the listing, add a TIER REPORT section: each sentence followed by its tier (T1/T2/T3/T4).\n\n"
        "OUTPUT FORMAT:\n"
        "PATTERN: <letter> — <pattern name>\n"
        "ARCHETYPE: <code>\n\n"
        "[listing markdown]\n\n"
        "TIER REPORT\n"
        "[sentence] [T1/T2/T3/T4]\n"
        "..."
    )

    # Dynamic user data (package-specific)
    user_text = (
        f"PATTERN SELECTED: {pattern}\nARCHETYPE: {archetype}\n\nINPUTS:\n"
        + json.dumps(payload, indent=2, default=str)
    )

    return system_text, user_text


def generate_value_proposition(package, bundle_data: dict, patent_attributes: list) -> dict:
    """
    Full Rung 1+2 pipeline: Teaser + Listing + all validation layers.

    Returns:
        teaser, listing, tier_report, suggested_pattern, pattern_used,
        meta_tags, suggested_archetype, lint_results, quality_gates, tier_validation
    """
    bundle_codes = package.bundle_codes or []
    scorecard = bundle_data.get('scorecard', {})
    mcl_available = bool(package.mcl_entries)
    asset_count = len(patent_attributes) or len(bundle_codes) * 5

    # §4.5 — Auto-suggest archetype if not user-set
    suggested_archetype, archetype_reason = suggest_archetype(bundle_codes, patent_attributes, scorecard)
    archetype = package.primary_archetype or suggested_archetype

    # §18 — Suggest pattern
    suggested, _reason = suggest_pattern(asset_count, mcl_available, bundle_codes, archetype)
    pattern = package.listing_pattern or suggested

    # Build domain + T3 signal for teaser
    domain = _get_domain_from_attributes(patent_attributes)
    best_signal = _get_best_t3_signal(patent_attributes, scorecard, bundle_codes)

    # Rung 1 — Teaser
    teaser = generate_teaser(package.name, asset_count, domain, archetype, best_signal)

    # Rung 2 — Listing (LLM → template fallback)
    listing_text = None
    tier_report = None
    try:
        from .models import LLMProviderConfig
        from django.core.signing import Signer
        config = LLMProviderConfig.objects.filter(is_active=True).first()
        if config:
            try:
                api_key = Signer().unsign(config.api_key)
            except Exception:
                api_key = config.api_key
            system_text, user_text = _build_llm_prompt(package, bundle_data, patent_attributes, pattern)
            model = config.resolved_model
            raw = None
            if config.provider == 'anthropic':
                raw = _call_anthropic(api_key, user_text, system_text=system_text, model=model)
            elif config.provider == 'openai':
                raw = _call_openai(api_key, user_text, system_text=system_text, model=model)
            if raw:
                listing_text = raw
                tier_report = _parse_tier_report_from_llm(raw)
    except Exception as e:
        logger.warning('LLM listing generation failed, using template fallback: %s', e)

    if not listing_text:
        listing_text, tier_report = _template_listing_fallback(package, bundle_data, patent_attributes, pattern)

    # §10 Block 7 — Meta tags
    meta_tags = generate_meta_tags(patent_attributes, package.transaction_type, bundle_codes)

    # §15 — Failure-mode lint
    lint_results = lint_listing(listing_text, package, tier_report, pattern)

    # §17 — Quality gates
    quality_gates = validate_quality_gates(package, scorecard, tier_report, listing_text, pattern)

    # §5.5 — Tier coverage validation
    tier_validation = validate_tier_coverage(tier_report)

    return {
        'teaser': teaser,
        'listing': listing_text,
        'tier_report': tier_report,
        'suggested_pattern': suggested,
        'pattern_used': pattern,
        'meta_tags': meta_tags,
        'suggested_archetype': suggested_archetype,
        'archetype_reason': archetype_reason,
        'lint_results': lint_results,
        'quality_gates': quality_gates,
        'tier_validation': tier_validation,
    }
