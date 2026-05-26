"""
Licensing Analysis Algorithms
Royalty benchmarking, licensable asset ranking, revenue forecasting
"""
from typing import Dict, Any, List
from collections import defaultdict
from datetime import datetime


def run_licensing_analysis(project_id: str, **kwargs) -> Dict[str, Any]:
    """
    Analyze licensing potential, royalty benchmarks, and revenue forecasts.

    Configurable kwargs:
        revenue_base_per_licensable: float (default 25000)
        georgia_pacific_overrides: dict mapping factor number (1-15) to
            {'score': float, 'notes': str} overrides
    """
    from ..models import AnalyticsProject, CompetitorProfile
    from ..patent_data_service import get_project_patents

    revenue_base_per_licensable = kwargs.get('revenue_base_per_licensable', 25000)
    gp_overrides = kwargs.get('georgia_pacific_overrides', {})

    try:
        project = AnalyticsProject.objects.get(id=project_id)
    except AnalyticsProject.DoesNotExist:
        return {'error': 'Project not found'}

    patents = get_project_patents(project_id)[:300]
    total = len(patents)
    if total == 0:
        return {'error': 'No patent data available for this project'}

    competitors = CompetitorProfile.objects.filter(project=project)

    # Licensable assets — score by citation density and claim count
    licensable_assets = []
    for p in patents:
        score = _licensing_score(p)
        if score >= 30:
            licensable_assets.append({
                'patent_id': p.patent_id,
                'title': (p.title or '')[:80],
                'assignee': p.assignee or '',
                'licensing_score': score,
                'coverage': _claim_coverage_label(p),
                'claim_count': p.claims_count or 0,
            })

    licensable_assets.sort(key=lambda x: -x['licensing_score'])

    # Royalty benchmarks (industry benchmark — technology-independent estimates)
    royalty_benchmarks = {
        'label': 'industry_benchmark',
        'floor': 1.5,
        'midpoint': 3.5,
        'ceiling': 7.0,
        'recommended_rate': 3.5,
    }

    # Licensing footprint — competitors as licensing targets
    licensing_footprint = []
    for comp in competitors[:10]:
        relevance = round(min((comp.total_patents or 1) / max(total, 1) * 100 + 30, 100), 1)
        est_revenue = round(relevance * 50000, 0)
        priority = 'high' if relevance >= 65 else ('medium' if relevance >= 40 else 'low')
        licensing_footprint.append({
            'entity': comp.name,
            'relevance_score': relevance,
            'est_revenue_at_risk': est_revenue,
            'priority': priority,
        })
    licensing_footprint.sort(key=lambda x: -x['relevance_score'])

    # License structure recommendations
    license_structures = [
        {
            'type': 'Exclusive License',
            'description': 'Grant exclusive rights to a single licensee in a defined field of use',
            'pros': ['Highest per-deal revenue', 'Motivated licensee to commercialize'],
            'cons': ['Limits future licensing options', 'Requires careful due diligence'],
        },
        {
            'type': 'Non-Exclusive License',
            'description': 'License to multiple parties simultaneously for broader reach',
            'pros': ['Maximize royalty reach', 'Retain future flexibility'],
            'cons': ['Lower per-licensee rates', 'More administration'],
        },
        {
            'type': 'Cross-License',
            'description': 'Exchange IP rights with competitor for mutual freedom to operate',
            'pros': ['Reduce litigation risk', 'Gain access to complementary IP'],
            'cons': ['May dilute licensing revenue', 'Requires balanced portfolios'],
        },
        {
            'type': 'Portfolio License',
            'description': 'License entire portfolio under a single agreement',
            'pros': ['Simplified negotiations', 'Guaranteed revenue stream'],
            'cons': ['May undervalue individual high-quality patents'],
        },
    ]

    # Revenue forecast (3 scenarios over 5 years)
    current_year = datetime.now().year
    licensable_count = len(licensable_assets)
    revenue_forecast = []
    for i, year in enumerate(range(current_year, current_year + 5)):
        base = licensable_count * revenue_base_per_licensable * (1 + i * 0.08)
        revenue_forecast.append({
            'year': year,
            'conservative': round(base * 0.6, 0),
            'base': round(base, 0),
            'optimistic': round(base * 1.6, 0),
        })

    # Georgia-Pacific factors — defaults with user override support
    gp_defaults = [
        {'factor': '1. Royalties received by licensor', 'score': 3.5, 'notes': 'Comparable technology royalties 2-5%'},
        {'factor': '2. Rates paid by licensee for comparable patents', 'score': 3.0, 'notes': 'Industry benchmark rates apply'},
        {'factor': '3. Nature and scope of license', 'score': 4.0, 'notes': 'Non-exclusive, broad field of use'},
        {'factor': "4. Licensor's established licensing policy", 'score': 3.5, 'notes': 'Portfolio licensing preferred'},
        {'factor': '5. Commercial relationship between parties', 'score': 2.5, 'notes': 'Parties are direct competitors'},
        {'factor': '6. Effect of patent in promoting sales', 'score': 4.0, 'notes': 'Core enabling technology'},
        {'factor': '7. Duration of patent and license term', 'score': 3.5, 'notes': 'Average 8 years remaining life'},
        {'factor': '8. Established profitability of the product', 'score': 4.5, 'notes': 'High-margin product line'},
        {'factor': '9. Utility and advantages over old modes', 'score': 4.0, 'notes': 'Significant technical advantages'},
        {'factor': '10. Nature of the patented invention', 'score': 3.5, 'notes': 'Process and apparatus claims'},
        {'factor': "11. Extent of infringer's use", 'score': 3.0, 'notes': 'Estimated 30% of product revenue'},
        {'factor': '12. Portion of profit customarily allowed', 'score': 3.5, 'notes': '25% rule as starting point'},
        {'factor': '13. Portion of realizable profit', 'score': 3.5, 'notes': 'Based on apportionment analysis'},
        {'factor': '14. Opinion testimony of experts', 'score': 4.0, 'notes': 'Expert analysis recommends 3.5%'},
        {'factor': '15. Result of hypothetical negotiation', 'score': 3.5, 'notes': 'Concluded range: 2.5-4.5%'},
    ]

    # Apply user overrides
    gp_factors = []
    for i, gp in enumerate(gp_defaults):
        factor_num = str(i + 1)
        if factor_num in gp_overrides:
            override = gp_overrides[factor_num]
            gp_factors.append({
                'factor': gp['factor'],
                'score': override.get('score', gp['score']),
                'notes': override.get('notes', gp['notes']),
            })
        else:
            gp_factors.append(gp)

    return {
        'project_id': str(project.id),
        'total_patents': total,
        'licensable_assets': licensable_assets[:30],
        'royalty_benchmarks': royalty_benchmarks,
        'licensing_footprint': licensing_footprint,
        'license_structure_recommendations': license_structures,
        'revenue_forecast': revenue_forecast,
        'georgia_pacific_scores': gp_factors,
        'program_recommendations': _licensing_recommendations(licensable_count, total),
    }


def _licensing_score(patent) -> float:
    score = 0.0
    fwd = patent.forward_citations or 0
    if fwd > 50:
        score += 40
    elif fwd > 20:
        score += 28
    elif fwd > 5:
        score += 15

    claims = patent.claims_count or 0
    if claims > 20:
        score += 30
    elif claims > 10:
        score += 20
    elif claims > 0:
        score += 10

    if patent.legal_status and ('active' in patent.legal_status.lower() or 'granted' in patent.legal_status.lower()):
        score += 20

    if patent.country_code == 'US':
        score += 10

    return min(round(score, 1), 100)


def _claim_coverage_label(patent) -> str:
    claims = patent.claims_count or 0
    if claims > 20:
        return 'Broad'
    if claims > 10:
        return 'Moderate'
    if claims > 0:
        return 'Narrow'
    return 'Unknown'


def _licensing_recommendations(licensable_count: int, total: int) -> List[str]:
    recs = []
    pct = licensable_count / max(total, 1) * 100
    if pct >= 50:
        recs.append('Strong licensing portfolio. Launch a formal licensing program targeting top competitors.')
    elif pct >= 25:
        recs.append('Moderate licensing potential. Focus outreach on highest-scoring assets first.')
    else:
        recs.append('Limited licensable assets. Prioritize prosecution to strengthen claim scope before licensing.')

    recs.append('Conduct a Freedom-to-License review to identify any co-ownership or assignment restrictions.')
    recs.append('Develop a licensing pitch deck anchored on top-cited patents and commercial value.')
    recs.append('Explore standard-essential patent (SEP) declarations where applicable.')
    return recs
