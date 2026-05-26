"""
Market Analysis Algorithms
HHI concentration, competitive positioning, market opportunity matrix
"""
from typing import Dict, Any, List
from collections import defaultdict
from datetime import datetime


def run_market_analysis(project_id: str, **kwargs) -> Dict[str, Any]:
    """
    Analyze market concentration, competitive positioning, and IP white spaces.
    """
    from ..models import AnalyticsProject, CompetitorProfile, TechnologyArea
    from ..patent_data_service import get_project_patents

    try:
        project = AnalyticsProject.objects.get(id=project_id)
    except AnalyticsProject.DoesNotExist:
        return {'error': 'Project not found'}

    patents = get_project_patents(project_id)
    total = len(patents)
    if total == 0:
        return {'error': 'No patent data available for this project'}

    competitors = CompetitorProfile.objects.filter(project=project)

    # Assignee share
    assignee_counter = defaultdict(int)
    for p in patents:
        key = (p.parent_assignee or p.assignee or 'Unknown').strip()
        assignee_counter[key] += 1

    assignee_shares = []
    hhi = 0.0
    for assignee, count in sorted(assignee_counter.items(), key=lambda x: -x[1])[:20]:
        share = count / max(total, 1)
        hhi += share ** 2
        assignee_shares.append({
            'assignee': assignee,
            'patent_count': count,
            'market_share': round(share * 100, 2),
        })

    hhi_score = round(hhi * 10000, 1)
    if hhi_score >= 2500:
        concentration = 'highly_concentrated'
    elif hhi_score >= 1500:
        concentration = 'moderately_concentrated'
    else:
        concentration = 'competitive'

    # Competitive positioning
    competitive_positioning = []
    for comp in competitors[:15]:
        ip_strength = min(comp.confidence_score * 100, 100) if comp.confidence_score else 50.0
        share_est = assignee_counter.get(comp.name, 0) / max(total, 1) * 100
        competitive_positioning.append({
            'entity': comp.name,
            'ip_strength': round(ip_strength, 1),
            'market_share_est': round(share_est, 2),
            'portfolio_size': comp.total_patents or 0,
        })

    # New entrants — assignees with first filings in last 5 years
    current_year = datetime.now().year
    new_entrant_threshold = current_year - 5
    new_entrants = []
    entrant_data = defaultdict(lambda: {'first_year': 9999, 'recent': 0})
    for p in patents:
        if p.filing_date:
            try:
                year = p.filing_date.year
                key = (p.parent_assignee or p.assignee or 'Unknown').strip()
                if year < entrant_data[key]['first_year']:
                    entrant_data[key]['first_year'] = year
                if year >= new_entrant_threshold:
                    entrant_data[key]['recent'] += 1
            except (ValueError, TypeError, AttributeError):
                pass

    for entity, data in entrant_data.items():
        if data['first_year'] >= new_entrant_threshold and data['recent'] > 0:
            new_entrants.append({
                'entity': entity,
                'first_filing_year': data['first_year'],
                'recent_filings': data['recent'],
            })
    new_entrants.sort(key=lambda x: -x['recent_filings'])

    # IP white spaces by jurisdiction
    geo_counter = defaultdict(int)
    for p in patents:
        geo_counter[p.country_code or 'US'] += 1

    ip_white_spaces = []
    for jur, count in geo_counter.items():
        opportunity_score = max(0, round(100 - (count / max(total, 1) * 100) * 2, 1))
        ip_white_spaces.append({
            'segment': jur,
            'patent_count': count,
            'opportunity_score': opportunity_score,
        })
    ip_white_spaces.sort(key=lambda x: -x['opportunity_score'])

    # Market opportunity matrix (technology area x growth/barrier)
    # Compute actual growth rates from filing trend data per tech area
    tech_areas = TechnologyArea.objects.filter(project=project)
    opportunity_matrix = []
    for area in tech_areas[:10]:
        patent_count = area.patent_count or 0
        # Compute growth rate from actual filing trend data
        name_lower = area.name.lower()
        area_filings_by_year = defaultdict(int)
        for p in patents:
            if p.filing_date and (name_lower in (p.title or '').lower() or name_lower in (p.abstract or '').lower()):
                area_filings_by_year[p.filing_date.year] += 1
        yearly_counts = sorted(area_filings_by_year.items())
        if len(yearly_counts) >= 2:
            prev_count = yearly_counts[-2][1]
            curr_count = yearly_counts[-1][1]
            if prev_count > 0:
                growth_rate = round((curr_count - prev_count) / prev_count * 100, 1)
            else:
                growth_rate = 100.0 if curr_count > 0 else 0.0
        elif len(yearly_counts) == 1:
            growth_rate = 0.0
        else:
            growth_rate = 0.0

        ip_barrier = round(20 + patent_count * 0.5, 1)
        opportunity_matrix.append({
            'segment': area.name,
            'growth_rate': growth_rate,
            'ip_barrier': min(ip_barrier, 100),
            'patent_coverage': patent_count,
        })

    geo_opportunities = [
        {
            'jurisdiction': item['segment'],
            'patent_count': item['patent_count'],
            'opportunity_score': item['opportunity_score'],
        }
        for item in ip_white_spaces[:10]
    ]

    return {
        'project_id': str(project.id),
        'total_patents': total,
        'hhi_score': hhi_score,
        'market_concentration': concentration,
        'assignee_shares': assignee_shares,
        'competitive_positioning': competitive_positioning,
        'new_entrants': new_entrants[:10],
        'ip_white_spaces': ip_white_spaces[:10],
        'market_opportunity_matrix': opportunity_matrix,
        'geographic_market_opportunities': geo_opportunities,
        'recommendations': _market_recommendations(concentration, hhi_score, new_entrants),
    }


def _market_recommendations(concentration: str, hhi: float, new_entrants: list) -> List[str]:
    recs = []
    if concentration == 'highly_concentrated':
        recs.append('Market is highly concentrated (HHI > 2500). Dominant players control most IP — consider licensing or design-arounds.')
    elif concentration == 'moderately_concentrated':
        recs.append('Moderate market concentration. Targeted filing in under-covered segments can improve competitive position.')
    else:
        recs.append('Competitive market. Differentiated IP strategy required to establish defensible territory.')

    if len(new_entrants) > 5:
        recs.append(f'{len(new_entrants)} new entrants detected since 2020. Monitor their portfolios for potential conflicts.')

    recs.append('Prioritize filings in jurisdictions with low IP barrier and high growth rate.')
    recs.append('Conduct competitive intelligence reviews quarterly to track assignee portfolio changes.')
    return recs
