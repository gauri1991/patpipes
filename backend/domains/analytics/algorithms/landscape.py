"""
Patent Landscape Analysis Algorithms
Cluster patents by technology area, calculate density, identify gaps
"""
from collections import defaultdict
from datetime import datetime
from typing import List, Dict, Any, Optional
from django.db.models import Count, Q


def analyze_landscape(project_id: str) -> Dict[str, Any]:
    """
    Perform patent landscape analysis for a project.
    Clusters patents by technology area, calculates density, identifies gaps.
    """
    from ..models import AnalyticsProject, PatentRecord, TechnologyArea, PatentDataset

    try:
        project = AnalyticsProject.objects.get(id=project_id)
    except AnalyticsProject.DoesNotExist:
        return {'error': 'Project not found'}

    datasets = PatentDataset.objects.filter(project=project)
    patents = PatentRecord.objects.filter(dataset__in=datasets)
    tech_areas = TechnologyArea.objects.filter(project=project)

    # Technology area clustering
    clusters = []
    for area in tech_areas:
        keywords = area.keywords if isinstance(area.keywords, list) else []
        matching_patents = patents.filter(
            Q(title__icontains=area.name) |
            Q(abstract__icontains=area.name) |
            _build_keyword_query(keywords)
        ).distinct()

        cluster = {
            'id': str(area.id),
            'name': area.name,
            'patent_count': matching_patents.count(),
            'keywords': keywords,
            'ipc_classes': area.ipc_classes if isinstance(area.ipc_classes, list) else [],
            'density': matching_patents.count() / max(patents.count(), 1) * 100,
        }

        # Filing trend for this area
        filing_trend = []
        for patent in matching_patents:
            year = None
            if patent.filing_date:
                try:
                    year = datetime.strptime(str(patent.filing_date), '%Y-%m-%d').year
                except (ValueError, TypeError):
                    pass
            if year:
                filing_trend.append(year)

        year_counts = defaultdict(int)
        for y in filing_trend:
            year_counts[y] += 1
        cluster['filing_trend'] = [{'year': y, 'count': c} for y, c in sorted(year_counts.items())]

        clusters.append(cluster)

    # Sort by patent count
    clusters.sort(key=lambda x: x['patent_count'], reverse=True)

    # Identify gaps (areas with low patent density)
    avg_density = sum(c['density'] for c in clusters) / max(len(clusters), 1)
    gaps = [c for c in clusters if c['density'] < avg_density * 0.5]

    # Evolution data: patents by year
    evolution = defaultdict(int)
    for patent in patents:
        if patent.filing_date:
            try:
                year = datetime.strptime(str(patent.filing_date), '%Y-%m-%d').year
                evolution[year] += 1
            except (ValueError, TypeError):
                pass

    evolution_data = [{'year': y, 'count': c} for y, c in sorted(evolution.items())]

    # Geographic distribution
    geo_dist = defaultdict(int)
    for patent in patents:
        if patent.country_code:
            geo_dist[patent.country_code] += 1

    return {
        'project_id': str(project.id),
        'total_patents': patents.count(),
        'total_technology_areas': tech_areas.count(),
        'clusters': clusters,
        'gaps': gaps,
        'evolution': evolution_data,
        'geographic_distribution': dict(geo_dist),
        'average_density': round(avg_density, 2),
    }


def _build_keyword_query(keywords: List[str]) -> Q:
    """Build Q object for keyword matching across title and abstract"""
    q = Q()
    for kw in keywords[:20]:  # Limit to prevent query explosion
        q |= Q(title__icontains=kw) | Q(abstract__icontains=kw)
    return q if keywords else Q(pk__isnull=True)  # Return empty Q if no keywords
