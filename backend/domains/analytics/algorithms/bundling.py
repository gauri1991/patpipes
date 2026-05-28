"""
Patent Portfolio Bundle Analysis Algorithm

Scores patents on 42 technical attributes (Groups A-I) and auto-routes
each patent into one or more of 33 predefined bundle types based on logical rules.
"""
from __future__ import annotations
from typing import Dict, Any, List, Optional
from datetime import date


# ─────────────────────────────────────────────────────────────────────────────
# Entry point
# ─────────────────────────────────────────────────────────────────────────────

def run_bundle_analysis(project_id: str, on_progress=None, **kwargs) -> Dict[str, Any]:
    """
    Run bundle analysis for an analytics project.

    kwargs:
        config_id: str | None       — use a saved BundlingConfiguration
        preset: str                 — fallback preset name
        thresholds: dict            — override individual threshold values
        enabled_bundles: dict       — {bundle_code: bool}
        persist_assignments: bool   — write BundleAssignment rows (default True)

    on_progress: optional callable(current: int, total: int) for progress reporting
    """
    from ..models import AnalyticsProject, DEFAULT_THRESHOLDS, BUNDLE_PRESETS
    from ..patent_data_service import get_project_patents

    try:
        project = AnalyticsProject.objects.get(id=project_id)
    except AnalyticsProject.DoesNotExist:
        return {'error': 'Project not found'}

    patents = get_project_patents(project_id)
    if not patents:
        return {'error': 'No patent data available for this project'}

    persist = kwargs.get('persist_assignments', True)
    thresholds, enabled_bundles, gate_toggles = _resolve_config(project_id, kwargs)

    # Load or create attribute records and derive what we can automatically
    dataset_patents = [p for p in patents if p.record_id]
    total = len(dataset_patents)
    patent_attrs_list: List[Dict] = []
    for i, patent in enumerate(dataset_patents):
        derived = _auto_derive_attributes(patent)
        attrs_obj = _load_or_create_attributes(patent.record_id, derived)
        attrs = _obj_to_dict(attrs_obj)
        patent_attrs_list.append(attrs)
        if on_progress and i % 500 == 0:
            on_progress(i, total)

    # Apply routing rules for each patent
    assignments: Dict[str, List[str]] = {}
    for attrs in patent_attrs_list:
        rec_id = attrs['patent_record_id']
        qualifying = _apply_routing_rules(attrs, thresholds, enabled_bundles)
        assignments[rec_id] = qualifying

    # Persist assignments to DB
    if persist:
        _persist_assignments(project_id, patent_attrs_list, assignments)

    # Build quality scorecard per bundle
    all_bundle_codes = [bt for bt in _BUNDLE_RULES.keys()
                        if enabled_bundles.get(bt, True)]
    scorecard = []
    for code in all_bundle_codes:
        in_bundle = [a for a in patent_attrs_list if code in assignments.get(a['patent_record_id'], [])]
        if in_bundle:
            score = _compute_quality_scores(code, in_bundle, gate_toggles, thresholds)
            scorecard.append(score)

    # Build assignment matrix
    matrix_data = _build_matrix(patent_attrs_list, all_bundle_codes, assignments)

    # Attribute completeness summary
    completeness = _compute_completeness(patent_attrs_list)

    # Per-patent summary
    patent_summary = []
    for attrs in patent_attrs_list:
        rec_id = attrs['patent_record_id']
        bundles = assignments.get(rec_id, [])
        source = _attribute_source(attrs)
        hi_filled = _pct_hi_filled(attrs)
        patent_summary.append({
            'patent_id': attrs.get('patent_id', rec_id),
            'patent_record_id': rec_id,
            'title': attrs.get('title', '')[:80],
            'bundle_count': len(bundles),
            'bundle_codes': bundles,
            'attribute_source': source,
            'pct_filled': hi_filled,
        })

    qualified = [
        {
            'bundle_code': s['bundle_code'],
            'bundle_name': s['bundle_name'],
            'patent_count': s['patent_count'],
            'strategy_hint': s['composition_hint'],
        }
        for s in scorecard if s['patent_count'] > 0
    ]

    return {
        'project_id': project_id,
        'total_patents': len(patents),
        'run_at': date.today().isoformat(),
        'configuration': {
            'preset': kwargs.get('preset', 'all_on'),
            'thresholds': thresholds,
            'enabled_bundles': enabled_bundles,
            'gate_toggles': gate_toggles,
        },
        'attribute_completeness': completeness,
        'assignment_matrix': matrix_data,
        'quality_scorecard': scorecard,
        'qualified_bundles': qualified,
        'patent_attribute_summary': patent_summary,
    }


# ─────────────────────────────────────────────────────────────────────────────
# Attribute derivation
# ─────────────────────────────────────────────────────────────────────────────

def _auto_derive_attributes(patent) -> dict:
    """Map PatentRecord fields → attribute dict. Only derives; never overwrites manual values."""
    derived = {}
    today_year = date.today().year

    # A1: IPC section/group
    if patent.ipc_classification:
        derived['a1_primary_domain'] = str(patent.ipc_classification)[:20].strip()

    # C3: claim count
    if patent.claims_count is not None:
        derived['c3_claim_count'] = patent.claims_count

    # H5/H6: citations
    if patent.forward_citations is not None:
        derived['h5_forward_citations'] = patent.forward_citations
    if patent.backward_citations is not None:
        derived['h6_backward_citations'] = patent.backward_citations

    # E2: prosecution status from legal_status
    if patent.legal_status:
        ls = patent.legal_status.lower()
        if 'pending' in ls or 'filed' in ls:
            derived['e2_prosecution_status'] = 'Pending'
        elif 'granted' in ls or 'active' in ls or 'alive' in ls:
            derived['e2_prosecution_status'] = 'Granted'
        elif 'expired' in ls or 'lapsed' in ls:
            derived['e2_prosecution_status'] = 'Expired'
        elif 'abandoned' in ls or 'withdrawn' in ls:
            derived['e2_prosecution_status'] = 'Abandoned'

    # E4: remaining term (20-year rule from grant date)
    if patent.grant_date:
        try:
            expiry_year = patent.grant_date.year + 20
            remaining = max(0.0, float(expiry_year - today_year))
            derived['e4_remaining_term_years'] = min(remaining, 25.0)
        except (ValueError, AttributeError):
            pass

    # F1: jurisdictions from country code
    if patent.country_code:
        derived['f1_jurisdictions'] = [patent.country_code.upper()]

    # F2: trilateral (US + EP or JP or CN)
    jur = derived.get('f1_jurisdictions', [])
    if 'US' in jur and any(c in jur for c in ('EP', 'JP', 'CN', 'KR')):
        derived['f2_trilateral'] = True

    # E3: continuation from raw_data
    raw = getattr(patent, 'raw_data', {}) or {}
    if isinstance(raw, dict) and raw.get('continuation'):
        derived['e3_continuation'] = bool(raw['continuation'])

    return derived


def _load_or_create_attributes(patent_record_id: str, derived: dict):
    """GET or CREATE PatentBundleAttributes. Applies derived fields unless already manually set."""
    from ..models import PatentBundleAttributes

    obj, _ = PatentBundleAttributes.objects.get_or_create(
        patent_record_id=patent_record_id
    )

    protected = set(obj.manually_set_fields or []) | set(obj.ai_extracted_fields or [])
    updated_derived = []

    for field, value in derived.items():
        if field not in protected:
            setattr(obj, field, value)
            updated_derived.append(field)

    obj.derived_fields = list(set((obj.derived_fields or []) + updated_derived))
    obj.save()
    return obj


def _obj_to_dict(obj) -> dict:
    """Serialize a PatentBundleAttributes object to a plain dict for algorithm use."""
    from ..models import PatentBundleAttributes
    ATTR_FIELDS = [
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
        'derived_fields','ai_extracted_fields','manually_set_fields',
    ]
    d = {f: getattr(obj, f) for f in ATTR_FIELDS}
    d['patent_record_id'] = str(obj.patent_record_id)
    # pull title/patent_id from related record
    try:
        pr = obj.patent_record
        d['title'] = pr.title or ''
        d['patent_id'] = pr.patent_id or str(pr.id)
    except Exception:
        d['title'] = ''
        d['patent_id'] = str(obj.patent_record_id)
    return d


# ─────────────────────────────────────────────────────────────────────────────
# Configuration resolution
# ─────────────────────────────────────────────────────────────────────────────

def _resolve_config(project_id: str, kwargs: dict):
    from ..models import BundlingConfiguration, DEFAULT_THRESHOLDS, DEFAULT_GATE_TOGGLES

    thresholds = {**DEFAULT_THRESHOLDS}
    enabled_bundles: dict = {}
    gate_toggles = {**DEFAULT_GATE_TOGGLES}

    # Load saved config if provided
    config_id = kwargs.get('config_id')
    if config_id:
        try:
            cfg = BundlingConfiguration.objects.get(id=config_id, project_id=project_id)
            thresholds.update(cfg.get_effective_thresholds())
            enabled_bundles.update(cfg.get_effective_enabled_bundles())
            gate_toggles.update(cfg.gate_toggles or {})
        except BundlingConfiguration.DoesNotExist:
            pass
    elif kwargs.get('preset'):
        from ..models import BUNDLE_PRESETS
        preset_data = BUNDLE_PRESETS.get(kwargs['preset'], {})
        thresholds.update(preset_data.get('thresholds', {}))
        enabled_bundles.update(preset_data.get('enabled_bundles', {}))
        gate_toggles.update(preset_data.get('gate_toggles', {}))

    # Direct overrides take highest priority
    if kwargs.get('thresholds'):
        thresholds.update(kwargs['thresholds'])
    if kwargs.get('enabled_bundles'):
        enabled_bundles.update(kwargs['enabled_bundles'])
    if kwargs.get('gate_toggles'):
        gate_toggles.update(kwargs['gate_toggles'])

    return thresholds, enabled_bundles, gate_toggles


# ─────────────────────────────────────────────────────────────────────────────
# 33 Routing Rules
# ─────────────────────────────────────────────────────────────────────────────

def _rule_TECH_DOMAIN(a, t):      return bool(a.get('a1_primary_domain'))
def _rule_SEP(a, t):              return (a.get('b1_sep_potential', 0) >= t['sep_b1_cutoff'] and bool(a.get('b2_standard_tagged')))
def _rule_PRODUCT_ARCH(a, t):     return bool(a.get('a4_subsystem'))
def _rule_STACK_LAYER(a, t):      return bool(a.get('a3_stack_layer'))
def _rule_USE_CASE(a, t):         return bool(a.get('a5_use_case'))
def _rule_MANUFACTURING(a, t):
    a1 = (a.get('a1_primary_domain') or '').lower()
    return any(kw in a1 for kw in ('process','fab','manufac')) and a.get('c1_claim_type') == 'Method'
def _rule_MATERIALS_CHEM(a, t):
    a1 = (a.get('a1_primary_domain') or '').lower()
    return any(kw in a1 for kw in ('material','chem','battery','electrolyte','polymer')) and a.get('c1_claim_type') in ('Apparatus','Method')
def _rule_ALGO_SOFTWARE(a, t):    return a.get('a3_stack_layer') in ('App','Middleware','Cloud') and a.get('c1_claim_type') in ('Method','CRM')
def _rule_INTEROPERABILITY(a, t): return a.get('b3_interface_role', 0) >= t['interface_b3_cutoff']
def _rule_GEN_ROADMAP(a, t):      return bool(a.get('g2_generation_tag'))
def _rule_CLAIM_TYPE(a, t):       return bool(a.get('c1_claim_type'))
def _rule_DETECTABILITY(a, t):    return (a.get('d1_external_detectability', 0) >= t['detect_d1_cutoff'] or a.get('d2_teardown_detectability', 0) >= t['detect_d2_cutoff'])
def _rule_GEOGRAPHIC(a, t):       return bool(a.get('f2_trilateral'))
def _rule_FAMILY_TREE(a, t):      return a.get('e1_family_size', 1) >= t['family_e1_min']
def _rule_LIFECYCLE(a, t):        return (a.get('e4_remaining_term_years') or 0) > 0
def _rule_FOUNDATIONAL(a, t):     return a.get('c2_breadth', 0) == 3 or a.get('c2_breadth', 0) <= 1
def _rule_CROSS_INDUSTRY(a, t):   return a.get('g3_cross_industry_applicability', 0) >= t['cross_industry_g3_cutoff']
def _rule_CONVERGENT_THEME(a, t): return bool(a.get('g1_convergence_theme'))
def _rule_DEFENSIVE(a, t):        return a.get('d3_reads_on_products', 0) >= t['defensive_d3_cutoff']
def _rule_WHITESPACE(a, t):       return a.get('c4_design_around_difficulty', 0) >= t['whitespace_c4_cutoff'] and bool(a.get('a1_primary_domain'))
def _rule_PROSECUTION(a, t):      return a.get('e2_prosecution_status') == 'Pending' or bool(a.get('e3_continuation'))
def _rule_ANCHOR_HALO(a, t):      return a.get('h1_claim_strength', 0) >= t['anchor_h1_cutoff'] and a.get('c2_breadth', 0) >= 1
def _rule_PICKET_FENCE(a, t):     return a.get('c4_design_around_difficulty', 0) >= 1 and (bool(a.get('a1_primary_domain')) or bool(a.get('b2_standard_tagged')))
def _rule_STRONG_CORE_TAIL(a, t): return bool(a.get('a1_primary_domain'))
def _rule_CONTINUATION_LIVE(a, t):return bool(a.get('e3_continuation'))
def _rule_EOU_BACKED(a, t):       return a.get('h9_eou_availability', 'None') in ('Partial','Full')
def _rule_BATTLE_TESTED(a, t):    return a.get('h7_litigation_history', '') == 'Survived'
def _rule_CLEAN_TITLE(a, t):      return a.get('h8_chain_of_title', '') == 'Clean' and a.get('h10_encumbrance_status', '') in ('None', '')
def _rule_HIGH_CITATION(a, t):    return (a.get('h5_forward_citations') or 0) >= t['high_citation_h5_min']
def _rule_ADJACENT_REREAD(a, t):  return a.get('i3_adjacent_market_reread', 0) >= 2 and a.get('g3_cross_industry_applicability', 0) >= 2
def _rule_SALVAGE(a, t):          return (a.get('h1_claim_strength', 0) <= t['salvage_h1_max'] or (a.get('e4_remaining_term_years') or 99) < t['salvage_e4_max'] or a.get('h2_prior_art_exposure', 0) <= t['salvage_h2_max'])
def _rule_PRE_EXPIRY(a, t):       return t['pre_expiry_min_years'] <= (a.get('e4_remaining_term_years') or 0) <= t['pre_expiry_max_years']
def _rule_PROVENANCE(a, t):       return bool(a.get('a1_primary_domain')) and bool(a.get('a4_subsystem'))
def _rule_TECH_NICHE(a, t):       return bool(a.get('a22_tech_niche')) and bool(a.get('a21_tech_detail'))

_BUNDLE_RULES: Dict[str, Any] = {
    'TECH_DOMAIN': _rule_TECH_DOMAIN,
    'SEP': _rule_SEP,
    'PRODUCT_ARCH': _rule_PRODUCT_ARCH,
    'STACK_LAYER': _rule_STACK_LAYER,
    'USE_CASE': _rule_USE_CASE,
    'MANUFACTURING': _rule_MANUFACTURING,
    'MATERIALS_CHEM': _rule_MATERIALS_CHEM,
    'ALGO_SOFTWARE': _rule_ALGO_SOFTWARE,
    'INTEROPERABILITY': _rule_INTEROPERABILITY,
    'GEN_ROADMAP': _rule_GEN_ROADMAP,
    'CLAIM_TYPE': _rule_CLAIM_TYPE,
    'DETECTABILITY': _rule_DETECTABILITY,
    'GEOGRAPHIC': _rule_GEOGRAPHIC,
    'FAMILY_TREE': _rule_FAMILY_TREE,
    'LIFECYCLE': _rule_LIFECYCLE,
    'FOUNDATIONAL': _rule_FOUNDATIONAL,
    'CROSS_INDUSTRY': _rule_CROSS_INDUSTRY,
    'CONVERGENT_THEME': _rule_CONVERGENT_THEME,
    'DEFENSIVE': _rule_DEFENSIVE,
    'WHITESPACE': _rule_WHITESPACE,
    'PROSECUTION': _rule_PROSECUTION,
    'ANCHOR_HALO': _rule_ANCHOR_HALO,
    'PICKET_FENCE': _rule_PICKET_FENCE,
    'STRONG_CORE_TAIL': _rule_STRONG_CORE_TAIL,
    'CONTINUATION_LIVE': _rule_CONTINUATION_LIVE,
    'EOU_BACKED': _rule_EOU_BACKED,
    'BATTLE_TESTED': _rule_BATTLE_TESTED,
    'CLEAN_TITLE': _rule_CLEAN_TITLE,
    'HIGH_CITATION': _rule_HIGH_CITATION,
    'ADJACENT_REREAD': _rule_ADJACENT_REREAD,
    'SALVAGE': _rule_SALVAGE,
    'PRE_EXPIRY': _rule_PRE_EXPIRY,
    'PROVENANCE': _rule_PROVENANCE,
    'TECH_NICHE': _rule_TECH_NICHE,
}

_BUNDLE_NAMES: Dict[str, str] = {
    'TECH_DOMAIN': 'Technology Domain',
    'SEP': 'Standards-Essential Patents',
    'PRODUCT_ARCH': 'Product Architecture',
    'STACK_LAYER': 'Stack Layer',
    'USE_CASE': 'Use-Case',
    'MANUFACTURING': 'Manufacturing / Process',
    'MATERIALS_CHEM': 'Materials & Chemistry',
    'ALGO_SOFTWARE': 'Algorithm / Software',
    'INTEROPERABILITY': 'Interoperability',
    'GEN_ROADMAP': 'Generational Roadmap',
    'CLAIM_TYPE': 'Claim-Type',
    'DETECTABILITY': 'Detectability',
    'GEOGRAPHIC': 'Geographic',
    'FAMILY_TREE': 'Family-Tree',
    'LIFECYCLE': 'Lifecycle / Term',
    'FOUNDATIONAL': 'Foundational + Improvement',
    'CROSS_INDUSTRY': 'Cross-Industry',
    'CONVERGENT_THEME': 'Convergent Theme',
    'DEFENSIVE': 'Defensive / Counter-Assertion',
    'WHITESPACE': 'Whitespace / Design-Around',
    'PROSECUTION': 'Prosecution-Status',
    'ANCHOR_HALO': 'Anchor-and-Halo',
    'PICKET_FENCE': 'Picket-Fence',
    'STRONG_CORE_TAIL': 'Strong-Core + Quality-Diluted Tail',
    'CONTINUATION_LIVE': 'Continuation-Live',
    'EOU_BACKED': 'EoU-Backed / Litigation-Ready',
    'BATTLE_TESTED': 'Survived-Challenge / Battle-Tested',
    'CLEAN_TITLE': 'Clean-Chain-of-Title',
    'HIGH_CITATION': 'High-Citation / Technical-Influence',
    'ADJACENT_REREAD': 'Adjacent-Industry Re-Read',
    'SALVAGE': 'Salvage / Defensive-Volume Lot',
    'PRE_EXPIRY': 'Pre-Expiry / Last-Window',
    'PROVENANCE': 'Provenance-Coherent',
    'TECH_NICHE': 'Technology Niche',
}

_COMPOSITION_HINTS: Dict[str, str] = {
    'TECH_DOMAIN': 'Group by technical domain; pitch as a complete domain position.',
    'SEP': 'Use anchor-first approach; lead with the strongest SEP.',
    'PRODUCT_ARCH': 'Storyline bundling: map each patent to a product subsystem layer.',
    'STACK_LAYER': 'Tiered structure within the stack layer; include both Method and Apparatus claims.',
    'USE_CASE': 'Buyer-profile bundling: present as "everything you need for X use case."',
    'MANUFACTURING': 'Carve-in: keep process patents together — cherry-picking destroys the fence.',
    'MATERIALS_CHEM': 'Provenance-coherent: patents from same R&D program tell a single story.',
    'ALGO_SOFTWARE': 'Modular: buyers can mix CRM + Method combinations for different deployment models.',
    'INTEROPERABILITY': 'Picket-fence composition: the fence is strong only when the group is intact.',
    'GEN_ROADMAP': 'Conditional/buyer-profile: legacy patents for defensive buyers, next-gen for offensive.',
    'CLAIM_TYPE': 'Anchor-first: lead with the broadest-scope claim type; supplement with narrower ones.',
    'DETECTABILITY': 'Reserve strategy: hold the most detectable patent for individual negotiation.',
    'GEOGRAPHIC': 'Storyline: emphasize trilateral coverage as a "globally enforceable" narrative.',
    'FAMILY_TREE': 'Carve-in: families must be sold intact to preserve continuation options.',
    'LIFECYCLE': 'Tiered: long-life as premium tier, short-life as immediate-licensing lot.',
    'FOUNDATIONAL': 'Anchor-first: pioneer claim is the anchor; improvements are halo patents.',
    'CROSS_INDUSTRY': 'Buyer-profile: customize pitch for each vertical (automotive, healthcare, etc.).',
    'CONVERGENT_THEME': 'Storyline: convergence theme unifies the narrative across diverse patents.',
    'DEFENSIVE': 'Complementary-weakness: pair patents that read on different defendants.',
    'WHITESPACE': 'Modular: whitespace patents can slot into multiple bundles as design-around blockers.',
    'PROSECUTION': 'Continuation-optionality overlay: highlight claim-tailoring value for buyers.',
    'ANCHOR_HALO': 'Anchor-first: identify H1=3 patents as anchors; surround with narrower halos.',
    'PICKET_FENCE': 'Carve-in: the fence only works as a unit — individual sale destroys the value.',
    'STRONG_CORE_TAIL': 'Tiered structure: core patents as premium, tail as defensive-volume supplement.',
    'CONTINUATION_LIVE': 'Continuation-optionality: pitch as "claim-tailorable to your product roadmap."',
    'EOU_BACKED': 'Reserve: EoU-ready anchors are highest value — consider individual sale option.',
    'BATTLE_TESTED': 'Anchor-first: survived patents are the most credible anchors.',
    'CLEAN_TITLE': 'Storyline: clean chain and no encumbrances enable fast, low-friction closing.',
    'HIGH_CITATION': 'Buyer-profile: high-citation patents attract tech-focused buyers and standards bodies.',
    'ADJACENT_REREAD': 'Buyer-profile bundling: prepare separate pitch decks per adjacent industry.',
    'SALVAGE': 'Volume lot: price as a defensive ammunition package, not individual asset value.',
    'PRE_EXPIRY': 'Reserve: last-window patents attract litigation-finance buyers; price accordingly.',
    'PROVENANCE': 'Provenance-coherent: same R&D lineage reduces claim-construction friction for buyers.',
    'TECH_NICHE': 'Vertical slice: patents share the same specific algorithm/approach; pitch as a targeted niche position.',
}


def _apply_routing_rules(attrs: dict, thresholds: dict, enabled_bundles: dict) -> List[str]:
    qualifying = []
    for code, rule_fn in _BUNDLE_RULES.items():
        if not enabled_bundles.get(code, True):
            continue
        try:
            if rule_fn(attrs, thresholds):
                qualifying.append(code)
        except Exception:
            pass
    return qualifying


# ─────────────────────────────────────────────────────────────────────────────
# Quality scoring
# ─────────────────────────────────────────────────────────────────────────────

def _avg(values: list) -> Optional[float]:
    vals = [v for v in values if v is not None]
    return round(sum(vals) / len(vals), 2) if vals else None


def _pct(items: list, predicate) -> Optional[float]:
    if not items:
        return None
    return round(sum(1 for i in items if predicate(i)) / len(items) * 100, 1)


def _compute_quality_scores(code: str, attrs_list: List[dict], gate_toggles: dict, thresholds: dict = None) -> dict:
    if thresholds is None:
        thresholds = {}
    n = len(attrs_list)
    avg_detect = _avg([(a.get('d1_external_detectability', 0) + a.get('d2_teardown_detectability', 0)) / 2 for a in attrs_list])
    avg_term = _avg([a.get('e4_remaining_term_years') for a in attrs_list])
    pioneer_count = sum(1 for a in attrs_list if a.get('c2_breadth', 0) == 3)

    # Strength flag: STRONG if count >= depth_min AND avg_detect >= detect_min AND avg_term >= term_min
    depth_min = thresholds.get('strength_depth_min', 4)
    detect_min = thresholds.get('strength_detect_min', 2)
    term_min = thresholds.get('strength_term_min', 10)
    if n < 2:
        strength_flag = 'WEAK'
    elif n >= depth_min and (avg_detect or 0) >= detect_min and (avg_term or 0) >= term_min:
        strength_flag = 'STRONG'
    else:
        strength_flag = 'MODERATE'

    score = {
        'bundle_code': code,
        'bundle_name': _BUNDLE_NAMES.get(code, code),
        'patent_count': n,
        'pioneer_count': pioneer_count,
        'strength_flag': strength_flag,
        'avg_claim_strength': _avg([a.get('h1_claim_strength') for a in attrs_list]),
        'avg_breadth': _avg([a.get('c2_breadth') for a in attrs_list]),
        'pct_trilateral': _pct(attrs_list, lambda a: bool(a.get('f2_trilateral'))),
        'avg_remaining_term': avg_term,
        'avg_detectability': avg_detect,
        'avg_forward_citations': _avg([a.get('h5_forward_citations') for a in attrs_list]),
        'pct_sep': _pct(attrs_list, lambda a: a.get('b1_sep_potential', 0) >= 2 and bool(a.get('b2_standard_tagged'))),
        'pct_continuation_live': _pct(attrs_list, lambda a: bool(a.get('e3_continuation'))),
        # Gate columns
        'gate_weakest_h1': min((a.get('h1_claim_strength', 0) for a in attrs_list), default=None) if gate_toggles.get('gate_weakest_h1', True) else None,
        'gate_invalidity_exposure_pct': _pct(attrs_list, lambda a: a.get('h2_prior_art_exposure', 0) <= 1) if gate_toggles.get('gate_invalidity_exposure', True) else None,
        'gate_eou_ready_pct': _pct(attrs_list, lambda a: a.get('h9_eou_availability', 'None') in ('Partial','Full')) if gate_toggles.get('gate_eou_ready', True) else None,
        'gate_survived_pct': _pct(attrs_list, lambda a: a.get('h7_litigation_history', '') == 'Survived') if gate_toggles.get('gate_survived', True) else None,
        'gate_cont_optionality_pct': _pct(attrs_list, lambda a: bool(a.get('e3_continuation'))) if gate_toggles.get('gate_cont_optionality', True) else None,
        'composition_hint': _COMPOSITION_HINTS.get(code, ''),
    }
    return score


# ─────────────────────────────────────────────────────────────────────────────
# Assignment matrix
# ─────────────────────────────────────────────────────────────────────────────

def _build_matrix(patent_attrs_list: List[dict], bundle_codes: List[str], assignments: dict) -> dict:
    patent_ids = [a['patent_record_id'] for a in patent_attrs_list]
    patent_titles = [a.get('title', '')[:60] for a in patent_attrs_list]
    matrix = [
        [code in assignments.get(pid, []) for code in bundle_codes]
        for pid in patent_ids
    ]
    patent_bundle_counts = [sum(row) for row in matrix]
    bundle_patent_counts = [sum(row[j] for row in matrix) for j in range(len(bundle_codes))]
    return {
        'patent_ids': patent_ids,
        'patent_titles': patent_titles,
        'bundle_codes': bundle_codes,
        'bundle_names': [_BUNDLE_NAMES.get(c, c) for c in bundle_codes],
        'matrix': matrix,
        'patent_bundle_counts': patent_bundle_counts,
        'bundle_patent_counts': bundle_patent_counts,
    }


# ─────────────────────────────────────────────────────────────────────────────
# Persistence
# ─────────────────────────────────────────────────────────────────────────────

def _persist_assignments(project_id: str, patent_attrs_list: List[dict], assignments: dict):
    from ..models import BundleAssignment, BundleType, PatentBundleAttributes

    bundle_map = {bt.code: bt for bt in BundleType.objects.all()}
    # Clear old assignments for this project
    BundleAssignment.objects.filter(project_id=project_id).delete()

    to_create = []
    for attrs in patent_attrs_list:
        rec_id = attrs['patent_record_id']
        try:
            attrs_obj = PatentBundleAttributes.objects.get(patent_record_id=rec_id)
        except PatentBundleAttributes.DoesNotExist:
            continue
        for code, bundle_type in bundle_map.items():
            to_create.append(BundleAssignment(
                patent_attributes=attrs_obj,
                bundle_type=bundle_type,
                project_id=project_id,
                is_assigned=code in assignments.get(rec_id, []),
            ))

    BundleAssignment.objects.bulk_create(to_create, ignore_conflicts=True)


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

_HI_FIELDS = [
    'h1_claim_strength','h2_prior_art_exposure','h3_prosecution_risk',
    'h7_litigation_history','h8_chain_of_title','h9_eou_availability',
    'h10_encumbrance_status','i1_product_mapping_confidence',
    'i2_implementation_maturity','i3_adjacent_market_reread','i4_workaround_complexity',
]

_GROUP_A_FIELDS = [
    'a1_primary_domain', 'a2_tech_subcategory',
    'a21_tech_detail', 'a22_tech_niche',    # L3 and L4 — claim-derived
    'a3_stack_layer', 'a4_subsystem', 'a5_use_case',
]


def _pct_hi_filled(attrs: dict) -> float:
    filled = sum(1 for f in _HI_FIELDS if attrs.get(f) not in (0, '', None))
    return round(filled / len(_HI_FIELDS) * 100, 1)


def _pct_a_filled(attrs: dict) -> float:
    filled = sum(1 for f in _GROUP_A_FIELDS if attrs.get(f) not in (None, ''))
    return round(filled / len(_GROUP_A_FIELDS) * 100, 1)


def _attribute_source(attrs: dict) -> str:
    has_ai = bool(attrs.get('ai_extracted_fields'))
    has_manual = bool(attrs.get('manually_set_fields'))
    has_derived = bool(attrs.get('derived_fields'))
    if has_ai and has_manual:
        return 'mixed'
    if has_manual:
        return 'manual'
    if has_ai:
        return 'ai'
    if has_derived:
        return 'derived'
    return 'none'


def _compute_completeness(patent_attrs_list: List[dict]) -> dict:
    total = len(patent_attrs_list)
    with_ai = sum(1 for a in patent_attrs_list if a.get('ai_extracted_fields'))
    with_manual = sum(1 for a in patent_attrs_list if a.get('manually_set_fields'))
    avg_pct = round(sum(_pct_hi_filled(a) for a in patent_attrs_list) / max(total, 1), 1)
    avg_a_pct = round(sum(_pct_a_filled(a) for a in patent_attrs_list) / max(total, 1), 1)
    # % of patents that have reached depth-4 classification (a22_tech_niche filled)
    taxonomy_depth_pct = round(
        sum(1 for a in patent_attrs_list if a.get('a22_tech_niche')) / max(total, 1) * 100, 1
    )
    return {
        'total': total,
        'with_ai_attributes': with_ai,
        'with_manual_attributes': with_manual,
        'pct_complete': avg_pct,
        'pct_a_complete': avg_a_pct,
        'taxonomy_depth_pct': taxonomy_depth_pct,
    }
