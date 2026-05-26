"""
Investment Analysis Algorithms
Portfolio valuation, risk matrix, key asset identification
"""
from typing import Dict, Any, List
from collections import defaultdict
from datetime import datetime


def run_investment_analysis(project_id: str, **kwargs) -> Dict[str, Any]:
    """
    Analyze the investment value and risk profile of a patent portfolio.

    Configurable kwargs:
        income_value_per_patent: float (default 75000)
        market_value_per_patent: float (default 60000)
        cost_value_per_patent: float (default 45000)
    """
    from ..models import AnalyticsProject
    from ..patent_data_service import get_project_patents

    income_value_per_patent = kwargs.get('income_value_per_patent', 75000)
    market_value_per_patent = kwargs.get('market_value_per_patent', 60000)
    cost_value_per_patent = kwargs.get('cost_value_per_patent', 45000)

    try:
        project = AnalyticsProject.objects.get(id=project_id)
    except AnalyticsProject.DoesNotExist:
        return {'error': 'Project not found'}

    patents = get_project_patents(project_id)[:300]
    total = len(patents)
    if total == 0:
        return {'error': 'No patent data available for this project'}

    quality_data = []
    tier_counts = defaultdict(int)
    expiry_by_year = defaultdict(int)

    current_year = datetime.now().year

    for p in patents:
        score = _patent_value_score(p)
        tier = _tier(score)
        tier_counts[tier] += 1
        fwd = p.forward_citations or 0

        if p.grant_date:
            try:
                expiry_year = p.grant_date.year + 20
                expiry_by_year[expiry_year] += 1
            except (ValueError, TypeError, AttributeError):
                pass

        quality_data.append((p, score, tier, fwd))

    quality_data.sort(key=lambda x: -x[1])

    tier_a_pct = round(tier_counts['tier_a'] / max(total, 1) * 100, 1)
    tier_b_pct = round(tier_counts['tier_b'] / max(total, 1) * 100, 1)
    weighted_score = round(
        (tier_counts['tier_a'] * 100 + tier_counts['tier_b'] * 70 +
         tier_counts['tier_c'] * 40 + tier_counts['tier_d'] * 10)
        / max(total, 1), 1
    )

    # Expiry cliff
    cumulative = 0
    expiry_cliff = []
    for year in sorted(expiry_by_year.keys()):
        if year >= current_year:
            cumulative += expiry_by_year[year]
            value_at_risk = round(expiry_by_year[year] * income_value_per_patent, 0)
            expiry_cliff.append({
                'year': year,
                'expiring': expiry_by_year[year],
                'value_at_risk': value_at_risk,
            })

    # Compute risk matrix from actual patent data
    # Expiry risk: what fraction of patents expire within 5 years
    near_term_expiry_count = sum(v for y, v in expiry_by_year.items() if current_year <= y <= current_year + 5)
    expiry_probability = round(min(near_term_expiry_count / max(total, 1), 1.0), 2)
    expiry_severity = round(min(0.4 + near_term_expiry_count / max(total, 1) * 0.6, 1.0), 2)

    # Litigation risk: based on forward citation density (highly cited = more assertion-attractive)
    high_citation_patents = sum(1 for _, score, _, fwd in quality_data if fwd > 20)
    litigation_probability = round(min(high_citation_patents / max(total, 1) * 2, 1.0), 2)
    litigation_severity = 0.80  # industry constant — litigation outcomes are always severe

    # Invalidity risk: based on claim breadth (broad claims more vulnerable)
    broad_claim_patents = sum(1 for p, _, _, _ in quality_data if (p.claims_count or 0) > 20)
    invalidity_probability = round(min(0.15 + broad_claim_patents / max(total, 1) * 0.5, 1.0), 2)
    invalidity_severity = 0.65

    # Concentration risk: top 5 patents share of total value
    top5_value = sum(q[1] for q in quality_data[:5])
    total_value = sum(q[1] for q in quality_data) or 1
    concentration_risk_pct = round(top5_value / total_value * 100, 1)
    concentration_probability = round(min(concentration_risk_pct / 100, 1.0), 2)

    # Prosecution lapse risk: based on tier D fraction
    tier_d_fraction = tier_counts['tier_d'] / max(total, 1)
    prosecution_probability = round(min(0.1 + tier_d_fraction * 0.5, 1.0), 2)

    risk_matrix = [
        {'risk_type': 'Expiry Cliff', 'probability': expiry_probability, 'severity': expiry_severity, 'description': f'{near_term_expiry_count} patents expire within 5 years — value erosion risk'},
        {'risk_type': 'Litigation Exposure', 'probability': litigation_probability, 'severity': litigation_severity, 'description': f'{high_citation_patents} highly-cited patents attractive to assertion'},
        {'risk_type': 'Obviousness / Invalidity', 'probability': invalidity_probability, 'severity': invalidity_severity, 'description': f'{broad_claim_patents} broad-claim patents with elevated PTAB challenge risk'},
        {'risk_type': 'Market Obsolescence', 'probability': 0.25, 'severity': 0.55, 'description': 'Technology shift may reduce relevance of current claims'},
        {'risk_type': 'Prosecution Lapse', 'probability': prosecution_probability, 'severity': 0.45, 'description': f'{tier_counts["tier_d"]} Tier D patents at risk of maintenance fee non-payment'},
        {'risk_type': 'Concentration Risk', 'probability': concentration_probability, 'severity': 0.60, 'description': f'Top 5 patents represent {concentration_risk_pct}% of portfolio value'},
    ]

    key_assets = [
        {
            'patent_id': q[0].patent_id,
            'title': (q[0].title or '')[:80],
            'value_contribution': round(q[1] / max(total_value, 1) * 100, 2),
            'risk_level': 'low' if q[1] >= 70 else ('medium' if q[1] >= 40 else 'high'),
        }
        for q in quality_data[:10]
    ]

    # Three valuation approaches
    avg_score = weighted_score
    income_val = round(total * income_value_per_patent * (avg_score / 100), 0)
    market_val = round(total * market_value_per_patent * (avg_score / 100), 0)
    cost_val = round(total * cost_value_per_patent, 0)
    recommended_low = round(min(income_val, market_val, cost_val) * 0.85, 0)
    recommended_high = round(max(income_val, market_val, cost_val) * 1.15, 0)

    return {
        'project_id': str(project.id),
        'total_patents': total,
        'portfolio_value_estimate': income_val,
        'quality_scorecard': {
            'tier_a_pct': tier_a_pct,
            'tier_b_pct': tier_b_pct,
            'weighted_score': weighted_score,
        },
        'expiry_cliff': expiry_cliff,
        'risk_matrix': risk_matrix,
        'concentration_risk': concentration_risk_pct,
        'key_assets': key_assets,
        'valuation_methods': {
            'income_approach': income_val,
            'market_approach': market_val,
            'cost_approach': cost_val,
            'recommended_range': [recommended_low, recommended_high],
        },
        'deal_recommendations': _deal_recommendations(weighted_score, total, concentration_risk_pct),
        'red_flags': _red_flags(tier_counts, total, expiry_cliff, current_year),
    }


def _patent_value_score(patent) -> float:
    score = 0.0
    if patent.legal_status:
        if 'active' in patent.legal_status.lower() or 'granted' in patent.legal_status.lower():
            score += 30
    fwd = patent.forward_citations or 0
    if fwd > 50:
        score += 35
    elif fwd > 20:
        score += 25
    elif fwd > 5:
        score += 15
    claims = patent.claims_count or 0
    if claims > 20:
        score += 20
    elif claims > 10:
        score += 12
    elif claims > 0:
        score += 6
    if patent.country_code not in ('US', None, ''):
        score += 15
    return min(round(score, 1), 100)


def _tier(score: float) -> str:
    if score >= 75:
        return 'tier_a'
    if score >= 50:
        return 'tier_b'
    if score >= 25:
        return 'tier_c'
    return 'tier_d'


def _deal_recommendations(weighted_score: float, total: int, concentration: float) -> List[str]:
    recs = []
    if weighted_score >= 65:
        recs.append('Portfolio quality supports premium valuation in M&A or licensing discussions.')
    else:
        recs.append('Improve portfolio quality before pursuing strategic transactions.')
    if concentration > 60:
        recs.append('High value concentration in top patents — use as anchor assets in licensing negotiations.')
    if total > 50:
        recs.append('Consider portfolio carve-outs to monetize non-core assets and fund prosecution of key patents.')
    recs.append('Engage a patent broker or investment bank for independent third-party valuation.')
    return recs


def _red_flags(tier_counts: dict, total: int, expiry_cliff: list, current_year: int) -> List[str]:
    flags = []
    d_pct = tier_counts['tier_d'] / max(total, 1) * 100
    if d_pct > 40:
        flags.append(f'{d_pct:.0f}% Tier D patents — significant drag on portfolio value.')
    near_term_expiry = sum(e['expiring'] for e in expiry_cliff if e['year'] <= current_year + 4)
    if near_term_expiry > total * 0.3:
        flags.append(f'{near_term_expiry} patents ({near_term_expiry/max(total,1)*100:.0f}%) expire within 5 years — expiry cliff risk.')
    if total < 10:
        flags.append('Small portfolio — limited defensive coverage and negotiation leverage.')
    return flags
