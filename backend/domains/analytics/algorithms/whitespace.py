"""
White Space Identification Algorithms
Cross-reference technology areas x application domains to find gaps
"""
from typing import Dict, Any, List
from collections import defaultdict


def identify_white_space(project_id: str) -> Dict[str, Any]:
    """
    Identify white space opportunities by cross-referencing
    technology areas and application domains.
    """
    from ..models import AnalyticsProject, PatentRecord, TechnologyArea, PatentDataset
    from django.db.models import Q

    try:
        project = AnalyticsProject.objects.get(id=project_id)
    except AnalyticsProject.DoesNotExist:
        return {'error': 'Project not found'}

    datasets = PatentDataset.objects.filter(project=project)
    patents = PatentRecord.objects.filter(dataset__in=datasets)
    tech_areas = TechnologyArea.objects.filter(project=project)

    # Define application domains from patent types and jurisdictions
    application_domains = _extract_application_domains(patents)

    # Build the gap matrix
    matrix = []
    opportunities = []

    for area in tech_areas:
        keywords = area.keywords if isinstance(area.keywords, list) else []
        area_patents = patents.filter(
            Q(title__icontains=area.name) |
            Q(abstract__icontains=area.name)
        ).distinct()

        row = {
            'technology_area': area.name,
            'technology_area_id': str(area.id),
            'total_patents': area_patents.count(),
            'domains': {},
        }

        for domain in application_domains:
            domain_patents = area_patents.filter(
                Q(country_code=domain['code']) if domain['type'] == 'jurisdiction'
                else Q(patent_type__icontains=domain['name'])
            )
            count = domain_patents.count()
            row['domains'][domain['name']] = count

            # Identify white space (low or zero patent count)
            if count == 0:
                opportunity_score = _calculate_opportunity_score(area, domain, patents.count())
                opportunities.append({
                    'technology_area': area.name,
                    'application_domain': domain['name'],
                    'patent_count': count,
                    'opportunity_score': opportunity_score,
                    'recommendation': f'No patents found in {area.name} x {domain["name"]}. Potential filing opportunity.',
                })
            elif count < 3:
                opportunities.append({
                    'technology_area': area.name,
                    'application_domain': domain['name'],
                    'patent_count': count,
                    'opportunity_score': 50,
                    'recommendation': f'Low density in {area.name} x {domain["name"]}. Consider strengthening position.',
                })

        matrix.append(row)

    # Sort opportunities by score
    opportunities.sort(key=lambda x: x['opportunity_score'], reverse=True)

    return {
        'project_id': str(project.id),
        'total_patents': patents.count(),
        'technology_areas': [a.name for a in tech_areas],
        'application_domains': [d['name'] for d in application_domains],
        'matrix': matrix,
        'opportunities': opportunities[:20],
        'total_white_spaces': len([o for o in opportunities if o['patent_count'] == 0]),
        'total_low_density': len([o for o in opportunities if 0 < o['patent_count'] < 3]),
    }


def _extract_application_domains(patents) -> List[Dict[str, str]]:
    """Extract application domains from patent data"""
    domains = []
    # By jurisdiction
    jurisdictions = patents.values_list('country_code', flat=True).distinct()[:10]
    for j in jurisdictions:
        if j:
            domains.append({'name': j, 'code': j, 'type': 'jurisdiction'})

    # If no jurisdictions, provide defaults
    if not domains:
        for code in ['US', 'EP', 'CN', 'JP', 'KR']:
            domains.append({'name': code, 'code': code, 'type': 'jurisdiction'})

    return domains


def _calculate_opportunity_score(area, domain, total_patents: int) -> float:
    """Calculate opportunity score for a white space (0-100)"""
    score = 70.0  # Base score for zero-patent areas
    # Higher score if the area has patents in other domains (proven technology)
    if hasattr(area, 'patent_count') and area.patent_count > 10:
        score += 15
    elif hasattr(area, 'patent_count') and area.patent_count > 5:
        score += 10
    return min(round(score, 1), 100)
