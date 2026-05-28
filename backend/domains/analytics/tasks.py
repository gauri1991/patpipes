"""
Celery tasks for the analytics domain.
"""

from celery import shared_task


@shared_task(name='domains.analytics.tasks.run_due_watches')
def run_due_watches():
    """Find and run all patent watch queries that are due for re-execution."""
    from .watch_service import run_due_watches_task
    return run_due_watches_task()


# ── Analysis algorithm tasks — each wraps a synchronous algorithm so the
#    HTTP handler can return immediately with a task_id instead of blocking. ──

@shared_task(bind=True, time_limit=600, soft_time_limit=540,
             name='domains.analytics.tasks.run_landscape_task')
def run_landscape_task(self, project_id: str):
    from .algorithms import analyze_landscape
    result = analyze_landscape(project_id)
    _persist_and_cache(project_id, 'landscape_analysis', result)
    return result


@shared_task(bind=True, time_limit=300, soft_time_limit=270,
             name='domains.analytics.tasks.run_fto_task')
def run_fto_task(self, project_id: str, target_description: str = ''):
    from .algorithms import run_fto_analysis
    result = run_fto_analysis(project_id, target_description)
    _persist_and_cache(project_id, 'fto_analysis', result)
    return result


@shared_task(bind=True, time_limit=300, soft_time_limit=270,
             name='domains.analytics.tasks.run_white_space_task')
def run_white_space_task(self, project_id: str):
    from .algorithms import identify_white_space
    result = identify_white_space(project_id)
    _persist_and_cache(project_id, 'white_space_analysis', result)
    return result


@shared_task(bind=True, time_limit=300, soft_time_limit=270,
             name='domains.analytics.tasks.run_trends_task')
def run_trends_task(self, project_id: str):
    from .algorithms import analyze_trends
    result = analyze_trends(project_id)
    _persist_and_cache(project_id, 'trend_analysis', result)
    return result


@shared_task(bind=True, time_limit=300, soft_time_limit=270,
             name='domains.analytics.tasks.run_portfolio_assessment_task')
def run_portfolio_assessment_task(self, project_id: str, kwargs: dict = None):
    from .algorithms import assess_portfolio
    result = assess_portfolio(project_id, **(kwargs or {}))
    _persist_and_cache(project_id, 'portfolio_assessment', result)
    return result


@shared_task(bind=True, time_limit=300, soft_time_limit=270,
             name='domains.analytics.tasks.run_market_analysis_task')
def run_market_analysis_task(self, project_id: str, kwargs: dict = None):
    from .algorithms import run_market_analysis
    result = run_market_analysis(project_id, **(kwargs or {}))
    _persist_and_cache(project_id, 'market_analysis', result)
    return result


@shared_task(bind=True, time_limit=300, soft_time_limit=270,
             name='domains.analytics.tasks.run_investment_analysis_task')
def run_investment_analysis_task(self, project_id: str, kwargs: dict = None):
    from .algorithms import run_investment_analysis
    result = run_investment_analysis(project_id, **(kwargs or {}))
    _persist_and_cache(project_id, 'investment_analysis', result)
    return result


@shared_task(bind=True, time_limit=300, soft_time_limit=270,
             name='domains.analytics.tasks.run_litigation_analysis_task')
def run_litigation_analysis_task(self, project_id: str, kwargs: dict = None):
    from .algorithms import run_litigation_analysis
    result = run_litigation_analysis(project_id, **(kwargs or {}))
    _persist_and_cache(project_id, 'litigation_analysis', result)
    return result


@shared_task(bind=True, time_limit=300, soft_time_limit=270,
             name='domains.analytics.tasks.run_licensing_analysis_task')
def run_licensing_analysis_task(self, project_id: str, kwargs: dict = None):
    from .algorithms import run_licensing_analysis
    result = run_licensing_analysis(project_id, **(kwargs or {}))
    _persist_and_cache(project_id, 'licensing_analysis', result)
    return result


@shared_task(bind=True, time_limit=300, soft_time_limit=270,
             name='domains.analytics.tasks.run_valuation_analysis_task')
def run_valuation_analysis_task(self, project_id: str, kwargs: dict = None):
    from .algorithms import run_valuation_analysis
    result = run_valuation_analysis(project_id, **(kwargs or {}))
    _persist_and_cache(project_id, 'valuation_analysis', result)
    return result


@shared_task(bind=True, time_limit=600, soft_time_limit=540,
             name='domains.analytics.tasks.run_bundle_analysis_task')
def run_bundle_analysis_task(self, project_id: str, kwargs: dict = None):
    from .algorithms import run_bundle_analysis

    def _progress(current, total):
        self.update_state(state='PROGRESS', meta={'current': current, 'total': total})

    result = run_bundle_analysis(project_id, on_progress=_progress, **(kwargs or {}))
    result['task_id'] = self.request.id
    _persist_and_cache(project_id, 'bundle_analysis', result)
    return result


@shared_task(bind=True, time_limit=300, soft_time_limit=270,
             name='domains.analytics.tasks.run_bulk_attribute_extraction_task')
def run_bulk_attribute_extraction_task(self, project_id: str, patent_record_ids: list = None, fields: list = None):
    from .bundle_attribute_service import extract_bundle_attributes_via_llm
    from .models import PatentDataset, PatentRecord

    dataset_ids = list(PatentDataset.objects.filter(project_id=project_id).values_list('id', flat=True))

    if patent_record_ids is None:
        patent_record_ids = [str(i) for i in PatentRecord.objects.filter(dataset_id__in=dataset_ids).values_list('id', flat=True)]

    # Preload CPC definitions once for all patents in this project (avoids N per-patent DB queries)
    cpc_cache = _build_cpc_cache(dataset_ids)

    extracted_count = 0
    failed_count = 0
    for rec_id in patent_record_ids:
        try:
            result = extract_bundle_attributes_via_llm(str(rec_id), fields, cpc_cache=cpc_cache)
            extracted_count += len(result)
        except Exception:
            failed_count += 1

    return {'extracted_count': extracted_count, 'failed_count': failed_count, 'total': len(patent_record_ids)}


@shared_task(bind=True, time_limit=600, soft_time_limit=540,
             name='domains.analytics.tasks.run_technology_classification_task')
def run_technology_classification_task(self, project_id: str, patent_record_ids: list = None, force: bool = False):
    from .bundle_attribute_service import classify_group_a_via_llm
    from .models import PatentDataset, PatentRecord

    dataset_ids = list(PatentDataset.objects.filter(project_id=project_id).values_list('id', flat=True))

    if patent_record_ids is None:
        patent_record_ids = [str(i) for i in PatentRecord.objects.filter(dataset_id__in=dataset_ids).values_list('id', flat=True)]

    # Preload CPC definitions once for all patents in this project
    cpc_cache = _build_cpc_cache(dataset_ids)

    classified_count = 0
    skipped_count = 0
    failed_count = 0
    for rec_id in patent_record_ids:
        try:
            result = classify_group_a_via_llm(str(rec_id), force=force, cpc_cache=cpc_cache)
            if result:
                classified_count += 1
            else:
                skipped_count += 1
        except Exception:
            failed_count += 1

    return {
        'classified_count': classified_count,
        'skipped_count': skipped_count,
        'failed_count': failed_count,
        'total': len(patent_record_ids),
    }


def _build_cpc_cache(dataset_ids: list) -> dict:
    """Preload CPC titles for all unique codes used by patents in the given datasets."""
    try:
        from .models import PatentRecord
        from domains.patents.models import ClassificationDefinition

        all_cpc_raw = PatentRecord.objects.filter(
            dataset_id__in=dataset_ids
        ).values_list('cpc_classification', flat=True)

        unique_codes: set = set()
        for raw in all_cpc_raw:
            for c in str(raw or '').replace(';', ',').replace('|', ',').split(','):
                c = c.strip()
                if c:
                    unique_codes.add(c)

        if not unique_codes:
            return {}

        return {
            d['code']: d['title']
            for d in ClassificationDefinition.objects.filter(
                system='CPC', code__in=unique_codes
            ).values('code', 'title')
        }
    except Exception:
        return {}


def _persist_and_cache(project_id: str, analysis_type: str, result: dict):
    """Save analysis result to DB and invalidate the project's cached result."""
    from django.core.cache import cache
    try:
        from .models import AnalyticsProject
        project = AnalyticsProject.objects.get(id=project_id)
        analysis_results = project.analysis_results or {}
        # Merge so we don't clobber fields written by the view (e.g. task_id)
        existing = analysis_results.get(analysis_type) or {}
        analysis_results[analysis_type] = {**existing, **result, 'task_status': 'completed'}
        project.analysis_results = analysis_results
        project.save(update_fields=['analysis_results'])
    except Exception:
        pass
    cache.delete(f'analysis_{project_id}_{analysis_type}')
