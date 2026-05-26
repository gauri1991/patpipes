"""
Litigation Analysis Algorithms
Risk scoring, assertion pattern analysis, watch list generation
"""
from typing import Dict, Any, List
from collections import defaultdict


def run_litigation_analysis(project_id: str, **kwargs) -> Dict[str, Any]:
    """
    Assess litigation risk profile of patents in the project.
    """
    from ..models import AnalyticsProject, CompetitorProfile
    from ..patent_data_service import get_project_patents

    try:
        project = AnalyticsProject.objects.get(id=project_id)
    except AnalyticsProject.DoesNotExist:
        return {'error': 'Project not found'}

    patents = get_project_patents(project_id)[:300]
    total = len(patents)
    if total == 0:
        return {'error': 'No patent data available for this project'}

    competitors = CompetitorProfile.objects.filter(project=project)

    risk_by_patent = []
    overall_scores = []

    for patent in patents:
        risk_score, risk_factors = _calculate_litigation_risk(patent)
        risk_level = _risk_level(risk_score)
        overall_scores.append(risk_score)

        risk_by_patent.append({
            'patent_id': patent.patent_id,
            'title': (patent.title or '')[:80],
            'assignee': patent.assignee or '',
            'litigation_risk_score': risk_score,
            'risk_level': risk_level,
            'risk_factors': risk_factors,
        })

    risk_by_patent.sort(key=lambda x: -x['litigation_risk_score'])
    overall_risk = round(sum(overall_scores) / max(total, 1), 1)

    # Assertion patterns — use competitor data with actual CompetitorProfile metrics
    assertion_patterns = []
    for comp in competitors[:8]:
        assertion_count = max(1, (comp.total_patents or 1) // 10)
        # Use confidence_score from CompetitorProfile as a proxy for success rate
        # (higher confidence in their portfolio = higher assertion success)
        success_rate = round(min(comp.confidence_score or 0.3, 1.0), 2)
        entity_type = 'NPE' if (comp.total_patents or 0) == 0 else 'operating_company'
        assertion_patterns.append({
            'entity': comp.name,
            'assertion_count': assertion_count,
            'success_rate': success_rate,
            'entity_type': entity_type,
        })

    # Venue distribution — industry benchmark data (from IPLC research)
    # Labeled clearly as benchmark, not project-specific
    venue_distribution = {
        'label': 'industry_benchmark',
        'source': 'IPLC research — patent litigation venue distribution',
        'data': [
            {'venue': 'W.D. Texas', 'share_pct': 28},
            {'venue': 'D. Delaware', 'share_pct': 22},
            {'venue': 'N.D. California', 'share_pct': 18},
            {'venue': 'E.D. Texas', 'share_pct': 12},
            {'venue': 'N.D. Illinois', 'share_pct': 8},
            {'venue': 'Other', 'share_pct': 12},
        ],
    }

    outcome_benchmarks = {
        'label': 'industry_benchmark',
        'plaintiff_win_rate': 0.28,
        'settlement_rate': 0.68,
        'ptab_institution_rate': 0.62,
    }

    npe_risk_indicators = []
    high_citation_count = sum(1 for p in risk_by_patent if p['litigation_risk_score'] >= 70)
    if high_citation_count > 0:
        npe_risk_indicators.append(f'{high_citation_count} high-citation patents attractive to NPE assertion')
    if total > 50:
        npe_risk_indicators.append('Large portfolio size increases visibility and assertion targeting risk')
    npe_risk_indicators.append('Monitor USPTO assignment database for transfers to assertion entities')

    watch_list = []
    for p in risk_by_patent[:10]:
        if p['litigation_risk_score'] >= 40:
            action = 'File IPR defensively' if p['litigation_risk_score'] >= 70 else 'Monitor for status changes'
            watch_list.append({
                'patent_id': p['patent_id'],
                'title': p['title'],
                'risk_score': p['litigation_risk_score'],
                'recommended_action': action,
            })

    return {
        'project_id': str(project.id),
        'total_patents_analyzed': total,
        'overall_litigation_risk': overall_risk,
        'risk_level': _risk_level(overall_risk),
        'assertion_patterns': assertion_patterns,
        'risk_by_patent': risk_by_patent[:50],
        'venue_distribution': venue_distribution,
        'outcome_benchmarks': outcome_benchmarks,
        'npe_risk_indicators': npe_risk_indicators,
        'watch_list': watch_list,
        'risk_mitigation_strategies': _mitigation_strategies(overall_risk, total),
    }


def _calculate_litigation_risk(patent) -> tuple:
    score = 0.0
    factors = []

    if patent.legal_status:
        if 'active' in patent.legal_status.lower() or 'granted' in patent.legal_status.lower():
            score += 20
            factors.append('Active/granted patent status')

    fwd = patent.forward_citations or 0
    if fwd > 50:
        score += 35
        factors.append(f'Very high forward citations ({fwd}) — highly referenced art')
    elif fwd > 20:
        score += 22
        factors.append(f'High forward citations ({fwd})')
    elif fwd > 5:
        score += 10
        factors.append(f'Moderate forward citations ({fwd})')

    claims = patent.claims_count or 0
    if claims > 20:
        score += 20
        factors.append(f'Broad claim set ({claims} claims)')
    elif claims > 10:
        score += 12
        factors.append(f'Moderate claim set ({claims} claims)')

    if patent.country_code == 'US':
        score += 15
        factors.append('US jurisdiction — highest litigation frequency')

    return min(round(score, 1), 100), factors


def _risk_level(score: float) -> str:
    if score >= 70:
        return 'high'
    if score >= 40:
        return 'medium'
    if score >= 10:
        return 'low'
    return 'none'


def _mitigation_strategies(overall_risk: float, total: int) -> List[str]:
    strategies = []
    if overall_risk >= 70:
        strategies.append('Engage litigation counsel immediately for high-risk patent review.')
        strategies.append('Prepare inter partes review (IPR) petitions for most threatening competitor patents.')
    elif overall_risk >= 40:
        strategies.append('Conduct quarterly freedom-to-operate reviews for active product lines.')
        strategies.append('Build prior art database for key technology areas to support IPR defense.')
    else:
        strategies.append('Maintain watch service on competitor patent assignments and litigation activity.')

    strategies.append('Implement litigation hold procedures and document design decisions.')
    strategies.append('Consider patent insurance for top revenue-generating products.')
    if total > 100:
        strategies.append('Large portfolio — develop tiered response strategy based on business priority.')
    return strategies
