"""
Patent Watch Service

Handles periodic re-runs of saved queries, diff computation against previous results,
and alert triggering when thresholds are crossed.
"""

import logging
from datetime import timedelta
from typing import Dict, Any, List

from django.utils import timezone

logger = logging.getLogger(__name__)


def get_due_watches() -> list:
    """Find all watch queries that are due for re-run based on their cadence.

    Returns:
        List of ResearchQuery objects that need re-running
    """
    from .models import ResearchQuery

    now = timezone.now()
    due = []

    watches = ResearchQuery.objects.filter(is_watch=True, watch_cadence__in=['daily', 'weekly', 'monthly'])

    for watch in watches:
        if not watch.last_watch_run:
            due.append(watch)
            continue

        elapsed = now - watch.last_watch_run
        if watch.watch_cadence == 'daily' and elapsed >= timedelta(days=1):
            due.append(watch)
        elif watch.watch_cadence == 'weekly' and elapsed >= timedelta(weeks=1):
            due.append(watch)
        elif watch.watch_cadence == 'monthly' and elapsed >= timedelta(days=30):
            due.append(watch)

    return due


def run_watch(query) -> Dict[str, Any]:
    """Re-run a watch query, compute diff against previous results, and check alert thresholds.

    Args:
        query: ResearchQuery model instance with is_watch=True

    Returns:
        Dict with: new_results_count, diff, alerts_triggered
    """
    from .models import ResearchResult, PatentAnalysisResult

    # Snapshot current state
    previous_patent_ids = set(
        ResearchResult.objects.filter(query=query)
        .values_list('patent_id', flat=True)
    )
    previous_count = len(previous_patent_ids)
    previous_assignees = set(
        ResearchResult.objects.filter(query=query)
        .exclude(assignee='')
        .values_list('assignee', flat=True)
        .distinct()
    )

    # Re-execute the query (this would call the patent API)
    # For now, we simulate by checking for new patents matching the criteria
    new_results = _fetch_new_results(query, previous_patent_ids)

    # Compute diff
    new_patent_ids = {r.get('patent_id', '') for r in new_results}
    new_assignees_in_results = {r.get('assignee', '') for r in new_results if r.get('assignee')}
    brand_new_assignees = new_assignees_in_results - previous_assignees

    diff = {
        'previous_count': previous_count,
        'new_count': len(new_results),
        'total_after': previous_count + len(new_results),
        'new_patent_ids': list(new_patent_ids)[:100],
        'new_assignees': list(brand_new_assignees),
        'run_at': timezone.now().isoformat(),
    }

    # Check alert thresholds
    thresholds = query.alert_thresholds or {}
    alerts = []

    min_new = thresholds.get('new_patents_min', 0)
    if min_new and len(new_results) >= min_new:
        alerts.append({
            'type': 'new_patents',
            'message': f'{len(new_results)} new patents found (threshold: {min_new})',
            'severity': 'high' if len(new_results) >= min_new * 2 else 'medium',
        })

    if thresholds.get('new_assignee') and brand_new_assignees:
        alerts.append({
            'type': 'new_assignee',
            'message': f'New assignees entered the space: {", ".join(list(brand_new_assignees)[:5])}',
            'severity': 'high',
        })

    # Update watch state
    query.last_watch_run = timezone.now()
    query.watch_diff = diff
    query.save(update_fields=['last_watch_run', 'watch_diff'])

    # Store as analysis result for history
    try:
        PatentAnalysisResult.objects.create(
            application_id=str(query.project_id),
            analysis_type='watch_run',
            extracted_entities=diff,
            metadata={
                'query_id': str(query.id),
                'query_name': query.query_name,
                'alerts_count': len(alerts),
            },
        )
    except Exception as e:
        logger.warning('Failed to persist watch result: %s', e)

    # Fire alerts
    if alerts:
        _fire_alerts(query, alerts)

    return {
        'query_id': str(query.id),
        'new_results_count': len(new_results),
        'diff': diff,
        'alerts': alerts,
    }


def _fetch_new_results(query, existing_ids: set) -> List[Dict]:
    """Fetch new patents matching the query criteria that aren't in existing results.

    Uses the Lens API if configured, otherwise checks the local patent store.
    """
    from domains.analytics.lens_service import LensClient, LensAPIError

    new_results = []

    try:
        client = LensClient()

        # Build query from saved search params
        must_clauses = []
        if query.keywords:
            keywords = query.keywords if isinstance(query.keywords, str) else ' '.join(query.keywords)
            if keywords.strip():
                must_clauses.append({'match': {'full_text': keywords}})

        if query.assignees:
            assignees = query.assignees if isinstance(query.assignees, list) else [query.assignees]
            for a in assignees[:5]:
                if a.strip():
                    must_clauses.append({'match': {'applicant.name': a}})

        if not must_clauses:
            return []

        body = {
            'query': {'bool': {'must': must_clauses}} if len(must_clauses) > 1 else must_clauses[0],
            'size': 100,
            'sort': [{'date_published': 'desc'}],
            'include': ['lens_id', 'doc_number', 'title', 'abstract', 'biblio', 'date_published'],
        }

        data = client.post('/patent/search', body)
        if data and data.get('data'):
            for hit in data['data']:
                pid = hit.get('doc_number', '')
                if pid and pid not in existing_ids:
                    applicant = ''
                    parties = hit.get('biblio', {}).get('parties', {})
                    applicants = parties.get('applicants', [])
                    if applicants:
                        applicant = applicants[0].get('extracted_name', {}).get('value', '')

                    new_results.append({
                        'patent_id': pid,
                        'lens_id': hit.get('lens_id', ''),
                        'title': (hit.get('biblio', {}).get('invention_title', [{}])[0].get('text', '') if hit.get('biblio', {}).get('invention_title') else ''),
                        'assignee': applicant,
                        'date_published': hit.get('date_published', ''),
                    })
    except (LensAPIError, Exception) as e:
        logger.warning('Watch re-run Lens fetch failed: %s', e)

    return new_results


def _fire_alerts(query, alerts: List[Dict]):
    """Send alerts via configured channels (for now, store as AnalyticsInsight)."""
    try:
        from .models import AnalyticsInsight

        for alert in alerts:
            AnalyticsInsight.objects.create(
                project=query.project,
                title=f"Watch Alert: {alert['message'][:100]}",
                insight_type='patent_expiration_alert' if alert['type'] == 'new_patents' else 'competitive_gap',
                description=alert['message'],
                confidence_level='high',
                impact_score=80 if alert['severity'] == 'high' else 50,
                priority=alert['severity'],
                is_actionable=True,
                supporting_data={
                    'watch_query_id': str(query.id),
                    'watch_query_name': query.query_name,
                    'alert_type': alert['type'],
                },
                recommended_actions=[
                    f'Review new results in query "{query.query_name}"',
                    'Update landscape analysis with new data',
                ],
            )
    except Exception as e:
        logger.warning('Failed to create alert insight: %s', e)


def diff_analysis_results(current: Dict, previous: Dict) -> Dict[str, Any]:
    """Compare two analysis results and identify changes.

    Works for any analysis type (landscape, whitespace, etc.).

    Args:
        current: Current analysis result dict
        previous: Previous analysis result dict

    Returns:
        Diff dict with changed fields, new entries, removed entries
    """
    diff = {
        'total_patents_change': (current.get('total_patents', 0) - previous.get('total_patents', 0)),
        'changes': [],
    }

    # Compare top-level numeric fields
    for key in ['total_patents', 'total_white_spaces', 'total_technology_areas', 'hhi_score']:
        curr_val = current.get(key)
        prev_val = previous.get(key)
        if curr_val is not None and prev_val is not None and curr_val != prev_val:
            diff['changes'].append({
                'field': key,
                'previous': prev_val,
                'current': curr_val,
                'delta': curr_val - prev_val if isinstance(curr_val, (int, float)) else None,
            })

    # Compare assignee lists
    curr_assignees = {s.get('assignee', '') for s in current.get('assignee_shares', [])}
    prev_assignees = {s.get('assignee', '') for s in previous.get('assignee_shares', [])}
    new_assignees = curr_assignees - prev_assignees
    if new_assignees:
        diff['new_assignees'] = list(new_assignees)

    # Compare white space opportunities
    curr_ws = {(o.get('cpc_subclass', ''), o.get('assignee', '')) for o in current.get('opportunities', [])}
    prev_ws = {(o.get('cpc_subclass', ''), o.get('assignee', '')) for o in previous.get('opportunities', [])}
    new_ws = curr_ws - prev_ws
    closed_ws = prev_ws - curr_ws
    if new_ws:
        diff['new_white_spaces'] = [{'cpc': ws[0], 'assignee': ws[1]} for ws in new_ws]
    if closed_ws:
        diff['closed_white_spaces'] = [{'cpc': ws[0], 'assignee': ws[1]} for ws in closed_ws]

    return diff


# Celery task wrapper (imported by celery beat schedule)
def run_due_watches_task():
    """Celery task: find and run all due patent watches."""
    due = get_due_watches()
    results = []
    for query in due:
        try:
            result = run_watch(query)
            results.append(result)
            logger.info('Watch completed: query=%s new=%d alerts=%d',
                        query.query_name, result['new_results_count'], len(result['alerts']))
        except Exception as e:
            logger.error('Watch failed for query %s: %s', query.id, e)
    return {'watches_run': len(results), 'total_alerts': sum(len(r['alerts']) for r in results)}
