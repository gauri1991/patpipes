"""
Portfolio Assessment Algorithms
Quality scoring, geographic coverage, expiry analysis
"""
from typing import Dict, Any, List
from collections import defaultdict
from datetime import datetime


def assess_portfolio(project_id: str, **kwargs) -> Dict[str, Any]:
    """
    Assess the quality and strength of a patent portfolio.
    Scores patents by tier, analyzes geographic coverage, and forecasts expiry.
    """
    from ..models import AnalyticsProject
    from ..patent_data_service import get_project_patents

    try:
        project = AnalyticsProject.objects.get(id=project_id)
    except AnalyticsProject.DoesNotExist:
        return {'error': 'Project not found'}

    patents = get_project_patents(project_id)[:300]
    total = len(patents)
    if total == 0:
        return {'error': 'No patent data available for this project'}

    quality_scores = []
    tier_counts = {'tier_a': 0, 'tier_b': 0, 'tier_c': 0, 'tier_d': 0}
    geo_counter = defaultdict(int)
    expiry_by_year = defaultdict(int)

    for patent in patents:
        score = _calculate_quality_score(patent)
        tier = _quality_tier(score)
        tier_counts[tier] += 1

        forward_cites = patent.forward_citations or 0
        claim_breadth = _estimate_claim_breadth(patent)
        geo = patent.country_code or 'US'
        geo_counter[geo] += 1

        grant_year = None
        if patent.grant_date:
            try:
                grant_year = patent.grant_date.year
                expiry_year = grant_year + 20
                expiry_by_year[expiry_year] += 1
            except (ValueError, TypeError, AttributeError):
                pass

        quality_scores.append({
            'patent_id': patent.patent_id,
            'title': (patent.title or '')[:100],
            'assignee': patent.assignee or '',
            'quality_score': score,
            'tier': tier,
            'claim_breadth': claim_breadth,
            'citation_score': min(forward_cites * 2, 100),
            'forward_citations': forward_cites,
            'geographic_coverage': geo,
        })

    quality_scores.sort(key=lambda x: x['quality_score'], reverse=True)

    geographic_coverage = [
        {
            'jurisdiction': jur,
            'patent_count': cnt,
            'percentage': round(cnt / max(total, 1) * 100, 1),
        }
        for jur, cnt in sorted(geo_counter.items(), key=lambda x: -x[1])
    ]

    # Build expiry timeline
    current_year = datetime.now().year
    timeline_years = sorted(expiry_by_year.keys())
    cumulative = 0
    expiry_timeline = []
    for year in timeline_years:
        if year >= current_year:
            cumulative += expiry_by_year[year]
            expiry_timeline.append({
                'year': year,
                'expiring_count': expiry_by_year[year],
                'cumulative_percentage': round(cumulative / max(total, 1) * 100, 1),
            })

    # Portfolio strength (weighted average of quality scores)
    strength_score = (
        round(sum(q['quality_score'] for q in quality_scores) / max(len(quality_scores), 1), 1)
        if quality_scores else 0.0
    )

    maintenance_cost = total * 2500  # ~$2,500/patent/year estimate

    return {
        'project_id': str(project.id),
        'total_patents': total,
        'quality_tiers': tier_counts,
        'quality_scores': quality_scores[:50],
        'geographic_coverage': geographic_coverage,
        'portfolio_strength_score': strength_score,
        'expiry_timeline': expiry_timeline,
        'maintenance_cost_estimate': maintenance_cost,
        'recommendations': _portfolio_recommendations(tier_counts, strength_score, total),
    }


def _calculate_quality_score(patent) -> float:
    score = 0.0
    if patent.legal_status:
        if 'active' in patent.legal_status.lower() or 'granted' in patent.legal_status.lower():
            score += 25
        elif 'expired' in patent.legal_status.lower():
            score += 5

    claims = patent.claims_count or 0
    if claims > 20:
        score += 25
    elif claims > 10:
        score += 15
    elif claims > 0:
        score += 8

    fwd = patent.forward_citations or 0
    if fwd > 50:
        score += 30
    elif fwd > 20:
        score += 20
    elif fwd > 5:
        score += 10

    if patent.country_code and patent.country_code not in ('US', ''):
        score += 10  # Multi-jurisdiction bonus
    elif patent.country_code == 'US':
        score += 5

    return min(round(score, 1), 100)


def _quality_tier(score: float) -> str:
    if score >= 75:
        return 'tier_a'
    if score >= 50:
        return 'tier_b'
    if score >= 25:
        return 'tier_c'
    return 'tier_d'


def _estimate_claim_breadth(patent) -> str:
    claims = patent.claims_count or 0
    if claims > 20:
        return 'broad'
    if claims > 10:
        return 'moderate'
    if claims > 0:
        return 'narrow'
    return 'unknown'


def _portfolio_recommendations(tiers: dict, strength: float, total: int) -> List[str]:
    recs = []
    if strength >= 70:
        recs.append('Strong portfolio. Focus on strategic prosecution to maintain Tier A assets.')
    elif strength >= 45:
        recs.append('Moderate portfolio strength. Prioritize prosecution of Tier B patents to elevate quality.')
    else:
        recs.append('Portfolio quality is below benchmark. Consider targeted filing in key technology gaps.')

    d_pct = tiers['tier_d'] / max(total, 1) * 100
    if d_pct > 30:
        recs.append(f'{d_pct:.0f}% of patents are Tier D — evaluate for abandonment to reduce maintenance costs.')

    if tiers['tier_a'] < 5:
        recs.append('Fewer than 5 Tier A patents. Identify high-value assets and strengthen through continuation practice.')

    if total < 20:
        recs.append('Small portfolio size. Consider an accelerated filing program to build defensive depth.')

    recs.append('Conduct annual portfolio pruning to shed low-value patents and reinvest savings in prosecution.')
    return recs
