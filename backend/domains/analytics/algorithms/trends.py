"""
Technology Trend Analysis and Forecasting Algorithms
Filing velocity, maturity curves, emerging technology detection
"""
from typing import Dict, Any, List
from collections import defaultdict
from datetime import datetime
import math


def analyze_trends(project_id: str) -> Dict[str, Any]:
    """
    Analyze technology trends for a project.
    Filing velocity, maturity curves, emerging tech detection.
    """
    from ..models import AnalyticsProject, PatentRecord, TechnologyArea, PatentDataset

    try:
        project = AnalyticsProject.objects.get(id=project_id)
    except AnalyticsProject.DoesNotExist:
        return {'error': 'Project not found'}

    datasets = PatentDataset.objects.filter(project=project)
    patents = PatentRecord.objects.filter(dataset__in=datasets)
    tech_areas = TechnologyArea.objects.filter(project=project)

    # Filing velocity (patents per month)
    monthly_filings = defaultdict(int)
    for patent in patents:
        if patent.filing_date:
            try:
                date = datetime.strptime(str(patent.filing_date), '%Y-%m-%d')
                key = f"{date.year}-{date.month:02d}"
                monthly_filings[key] += 1
            except (ValueError, TypeError):
                pass

    filing_velocity = [
        {'month': k, 'count': v}
        for k, v in sorted(monthly_filings.items())
    ]

    # Moving average (3-month)
    for i, item in enumerate(filing_velocity):
        window = filing_velocity[max(0, i - 2):i + 1]
        item['moving_avg'] = round(sum(w['count'] for w in window) / len(window), 1)

    # Forecast next 6 months (simple linear projection)
    forecast = _simple_forecast(filing_velocity, 6)

    # Technology area trends
    area_trends = []
    for area in tech_areas:
        area_filings = defaultdict(int)
        area_patents = patents.filter(
            title__icontains=area.name
        )

        for patent in area_patents:
            if patent.filing_date:
                try:
                    date = datetime.strptime(str(patent.filing_date), '%Y-%m-%d')
                    year = date.year
                    area_filings[year] += 1
                except (ValueError, TypeError):
                    pass

        yearly_data = [{'year': y, 'count': c} for y, c in sorted(area_filings.items())]

        # Detect if emerging (accelerating filing rate)
        is_emerging = _detect_emerging(yearly_data)

        # Estimate maturity stage
        maturity = _estimate_maturity(yearly_data)

        area_trends.append({
            'name': area.name,
            'total_patents': area_patents.count(),
            'yearly_data': yearly_data,
            'is_emerging': is_emerging,
            'maturity_stage': maturity,
            'growth_rate': _calculate_growth_rate(yearly_data),
        })

    # Sort: emerging technologies first
    area_trends.sort(key=lambda x: (x['is_emerging'], x['growth_rate']), reverse=True)

    return {
        'project_id': str(project.id),
        'total_patents': patents.count(),
        'filing_velocity': filing_velocity,
        'forecast': forecast,
        'area_trends': area_trends,
        'emerging_technologies': [a for a in area_trends if a['is_emerging']],
        'mature_technologies': [a for a in area_trends if a['maturity_stage'] == 'mature'],
    }


def _simple_forecast(velocity: List[Dict], months: int) -> List[Dict]:
    """Simple linear forecast based on recent trend"""
    if len(velocity) < 3:
        return []

    recent = velocity[-6:]  # Use last 6 months
    if len(recent) < 2:
        return []

    # Calculate trend slope
    counts = [r['count'] for r in recent]
    n = len(counts)
    avg_x = (n - 1) / 2
    avg_y = sum(counts) / n
    numerator = sum((i - avg_x) * (counts[i] - avg_y) for i in range(n))
    denominator = sum((i - avg_x) ** 2 for i in range(n))
    slope = numerator / max(denominator, 1)
    intercept = avg_y - slope * avg_x

    forecast = []
    last_month = velocity[-1]['month']
    year, month = int(last_month.split('-')[0]), int(last_month.split('-')[1])

    for i in range(months):
        month += 1
        if month > 12:
            month = 1
            year += 1
        predicted = max(0, round(intercept + slope * (n + i), 1))
        # Add confidence interval
        confidence = max(0, predicted * 0.2 * (i + 1))
        forecast.append({
            'month': f"{year}-{month:02d}",
            'predicted': predicted,
            'lower_bound': max(0, round(predicted - confidence, 1)),
            'upper_bound': round(predicted + confidence, 1),
        })

    return forecast


def _detect_emerging(yearly_data: List[Dict]) -> bool:
    """Detect if technology is emerging (accelerating filing rate)"""
    if len(yearly_data) < 3:
        return False
    recent = yearly_data[-3:]
    # Check if counts are increasing
    return all(recent[i]['count'] <= recent[i + 1]['count'] for i in range(len(recent) - 1))


def _estimate_maturity(yearly_data: List[Dict]) -> str:
    """Estimate technology maturity stage"""
    if not yearly_data:
        return 'unknown'

    counts = [d['count'] for d in yearly_data]
    max_count = max(counts)
    recent_count = counts[-1] if counts else 0

    if len(counts) < 3:
        return 'emerging'

    if recent_count >= max_count * 0.9:
        return 'growing'
    elif recent_count >= max_count * 0.5:
        return 'mature'
    else:
        return 'declining'


def _calculate_growth_rate(yearly_data: List[Dict]) -> float:
    """Calculate year-over-year growth rate"""
    if len(yearly_data) < 2:
        return 0.0
    current = yearly_data[-1]['count']
    previous = yearly_data[-2]['count']
    if previous == 0:
        return 100.0 if current > 0 else 0.0
    return round((current - previous) / previous * 100, 1)
