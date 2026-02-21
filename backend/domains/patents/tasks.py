"""
Background tasks for ODP patent imports.
Uses Celery when broker is available, falls back to threading.
"""

import logging
import time as _time
import threading
from concurrent.futures import ThreadPoolExecutor, Future
from celery import shared_task
from django.utils import timezone

logger = logging.getLogger(__name__)

DEFAULT_PAGE_SIZE = 100
PAGE_SIZE_FALLBACK = [100, 75, 50, 25]  # try largest first, fall back on 413


def build_odp_query_body(search_params, offset=0, limit=100):
    """
    Build the ODP search request body from stored search_params.
    Shared by search_odp view and the background import task.
    """
    assignee = (search_params.get('assignee') or '').strip()
    keywords = (search_params.get('keywords') or '').strip()
    inventor = (search_params.get('inventor') or '').strip()
    title = (search_params.get('title') or '').strip()
    application_number = (search_params.get('application_number') or '').strip()
    app_status = (search_params.get('status') or '').strip()
    app_type = (search_params.get('app_type') or '').strip()
    date_from = search_params.get('date_from') or ''
    date_to = search_params.get('date_to') or ''

    if application_number:
        q_text = application_number
    else:
        q_parts = []
        # Use field-qualified Solr syntax for assignee
        if assignee:
            q_parts.append(f'applicationMetaData.firstApplicantName:("{assignee}")')
        if keywords:
            q_parts.append(keywords)
        if inventor:
            q_parts.append(f'"{inventor}"')
        if title:
            q_parts.append(f'"{title}"')

        status_map = {
            'patented': 'AND "Patented Case"',
            'pending': 'AND "Docketed"',
            'abandoned': 'AND "Abandoned"',
        }
        if app_status and app_status in status_map:
            q_parts.append(status_map[app_status])

        type_map = {
            'regular': 'AND REGULAR',
            'provisional': 'AND PROVSNL',
            'design': 'AND DESIGN',
        }
        if app_type and app_type in type_map:
            q_parts.append(type_map[app_type])

        q_text = ' '.join(q_parts)

    body: dict = {
        'q': q_text,
        'pagination': {'offset': offset, 'limit': limit},
    }

    if date_from or date_to:
        rf: dict = {'field': 'applicationMetaData.filingDate'}
        if date_from:
            rf['valueFrom'] = date_from
        if date_to:
            rf['valueTo'] = date_to
        body['rangeFilters'] = [rf]

    return body


def _build_patent_obj(patent_data, portfolio, import_fields=None):
    """Build a Patent model instance (unsaved) from patent_data.

    Returns (Patent_instance, app_num) or (None, app_num) if app_num is empty.
    import_fields: list of field keys to import. If empty/None, import all.
    """
    from .models import Patent

    app_num = (patent_data.get('application_number') or '').strip()
    if not app_num:
        return None, ''

    fields = set(import_fields) if import_fields else None

    def include(field):
        return fields is None or field in fields

    filing_date = (patent_data.get('application_date') or patent_data.get('filing_date') or None) if include('filing_date') else None
    inventors = (patent_data.get('inventors') or []) if include('inventors') else []
    assignee_val = (patent_data.get('assignee') or '') if include('assignees') else ''

    status_val = 'pending'
    if include('status'):
        raw_status = (patent_data.get('application_status') or '').lower()
        if 'patented' in raw_status:
            status_val = 'granted'
        elif 'abandoned' in raw_status:
            status_val = 'abandoned'

    type_val = 'utility'
    if include('patent_type'):
        raw_type = (patent_data.get('application_type') or '').upper()
        if 'DESIGN' in raw_type:
            type_val = 'design'
        elif 'PROVSNL' in raw_type or 'PROVISIONAL' in raw_type:
            type_val = 'provisional'
        elif 'PLANT' in raw_type:
            type_val = 'plant'

    obj = Patent(
        portfolio=portfolio,
        title=patent_data.get('title', 'Untitled'),
        application_number=app_num,
        patent_number=(patent_data.get('publication_number') or None) if include('patent_number') else None,
        status=status_val,
        patent_type=type_val,
        filing_date=filing_date,
        inventors=inventors,
        assignees=[assignee_val] if assignee_val else [],
        abstract=patent_data.get('abstract', '') if include('abstract') else '',
        ipc_classifications=(patent_data.get('ipc_classes') or []) if include('ipc_classes') else [],
        technology_area='',
    )
    return obj, app_num


def _import_batch(patent_data_list, portfolio, import_fields=None):
    """Bulk-import a list of patent dicts. Returns (created_count, skipped_count)."""
    from .models import Patent

    # Build objects and collect app numbers
    candidates = []
    for pd in patent_data_list:
        obj, app_num = _build_patent_obj(pd, portfolio, import_fields)
        if obj and app_num:
            candidates.append((obj, app_num))

    if not candidates:
        return 0, len(patent_data_list)

    # Single query: which app numbers already exist?
    app_nums = [app_num for _, app_num in candidates]
    existing = set(
        Patent.objects.filter(application_number__in=app_nums)
        .values_list('application_number', flat=True)
    )

    to_create = [obj for obj, app_num in candidates if app_num not in existing]
    skipped = len(patent_data_list) - len(to_create)

    if to_create:
        Patent.objects.bulk_create(to_create, ignore_conflicts=True)

    return len(to_create), skipped


# Keep single-record import for backward compatibility (Import Selected with pause/cancel checks)
def _import_patent_record(patent_data, portfolio, import_fields=None):
    """Import a single patent record, returning ('created' | 'skipped')."""
    created, skipped = _import_batch([patent_data], portfolio, import_fields)
    return 'created' if created else 'skipped'


def _normalize_odp_results(raw_list, api=None):
    """Normalize a list of raw ODP results. Reuses api instance for efficiency."""
    if api is None:
        from domains.analytics.patent_search_service import USPTOOpenDataAPI
        api = USPTOOpenDataAPI()

    normalized = []
    for raw in raw_list:
        r = api._normalize_odp_result(raw)

        for key in ('application_date', 'publication_date', 'priority_date'):
            if r.get(key):
                r[key] = r[key].isoformat()

        raw_data = r.get('raw_data', {})
        meta = raw_data.get('applicationMetaData', {})
        r['application_type'] = meta.get('applicationTypeCategory', '')
        r['application_status'] = meta.get('applicationStatusDescriptionText', '')
        cpc_bag = meta.get('cpcClassificationBag', [])
        if cpc_bag and not r.get('cpc_classes'):
            r['cpc_classes'] = [c if isinstance(c, str) else c.get('cpcClassificationText', '') for c in cpc_bag]
        r.pop('raw_data', None)
        normalized.append(r)

    return normalized


def _normalize_odp_result(raw):
    """Normalize a single raw ODP result (convenience wrapper)."""
    return _normalize_odp_results([raw])[0]


@shared_task(bind=True, ignore_result=True)
def run_odp_import(self, job_id):
    """Execute an ODP import job — either from pre-loaded data or by paging through ODP."""
    import django
    django.setup()

    from .models import ODPImportJob

    try:
        job = ODPImportJob.objects.get(id=job_id)
    except ODPImportJob.DoesNotExist:
        logger.error(f"ODPImportJob {job_id} not found")
        return

    job.status = 'running'
    job.started_at = timezone.now()
    job.save(update_fields=['status', 'started_at'])

    try:
        portfolio = job.portfolio

        if job.selected_patents_data:
            # Import Selected — data already loaded, no ODP fetch needed
            # Process in batches of 25 for efficiency
            BATCH = 25
            patents_to_process = job.selected_patents_data[job.processed:]
            for i in range(0, len(patents_to_process), BATCH):
                # Check for pause/cancel before each batch
                job.refresh_from_db(fields=['status'])
                if job.status == 'cancelled':
                    job.completed_at = timezone.now()
                    job.save(update_fields=['completed_at', 'processed', 'created_count', 'skipped_count'])
                    _update_portfolio_metrics(portfolio)
                    return
                while job.status == 'paused':
                    import time
                    time.sleep(2)
                    job.refresh_from_db(fields=['status'])
                    if job.status == 'cancelled':
                        job.completed_at = timezone.now()
                        job.save(update_fields=['completed_at', 'processed', 'created_count', 'skipped_count'])
                        _update_portfolio_metrics(portfolio)
                        return

                batch = patents_to_process[i:i + BATCH]
                created, skipped = _import_batch(batch, portfolio, job.import_fields)
                job.processed += len(batch)
                job.created_count += created
                job.skipped_count += skipped
                job.save(update_fields=['processed', 'created_count', 'skipped_count'])

        else:
            # Import All — page through ODP with one-slot prefetch
            from domains.analytics.patent_search_service import USPTOOpenDataAPI
            from domains.analytics.uspto_odp_service import USPTOODPError
            api = USPTOOpenDataAPI()

            # Resume from where we left off
            offset = job.processed
            prefetch_executor = ThreadPoolExecutor(max_workers=1)
            pending_future: Future | None = None

            def _fetch_page(fetch_offset, page_size):
                """Fetch a single page from ODP with 413 auto-fallback."""
                body = build_odp_query_body(job.search_params, offset=fetch_offset, limit=page_size)
                try:
                    return api.client.post('/patent/applications/search', body), page_size
                except USPTOODPError as exc:
                    if '413' in str(exc) and page_size > 25:
                        for fallback in PAGE_SIZE_FALLBACK:
                            if fallback < page_size:
                                logger.info(f"413 at page_size={page_size}, falling back to {fallback}")
                                fb_body = build_odp_query_body(job.search_params, offset=fetch_offset, limit=fallback)
                                try:
                                    return api.client.post('/patent/applications/search', fb_body), fallback
                                except USPTOODPError:
                                    continue
                    raise

            try:
                while offset < job.total_expected:
                    # Check for pause/cancel before each page
                    job.refresh_from_db(fields=['status', 'page_size'])
                    if job.status == 'cancelled':
                        if pending_future:
                            pending_future.cancel()
                        job.completed_at = timezone.now()
                        job.save(update_fields=['completed_at', 'processed', 'created_count', 'skipped_count'])
                        _update_portfolio_metrics(portfolio)
                        return
                    while job.status == 'paused':
                        import time
                        time.sleep(2)
                        job.refresh_from_db(fields=['status', 'page_size'])
                        if job.status == 'cancelled':
                            if pending_future:
                                pending_future.cancel()
                            job.completed_at = timezone.now()
                            job.save(update_fields=['completed_at', 'processed', 'created_count', 'skipped_count'])
                            _update_portfolio_metrics(portfolio)
                            return

                    current_page_size = job.page_size or DEFAULT_PAGE_SIZE

                    # Get current page — either from prefetch or fresh fetch
                    fetch_start = _time.monotonic()
                    if pending_future:
                        data, used_page_size = pending_future.result()
                        pending_future = None
                        # Prefetch used an older page_size — that's fine,
                        # just use the data as-is; next fetch will use current_page_size.
                    else:
                        data, used_page_size = _fetch_page(offset, current_page_size)
                        # If fallback reduced the page_size (413 error), persist it
                        if used_page_size < current_page_size:
                            job.page_size = used_page_size
                            job.save(update_fields=['page_size'])
                            current_page_size = used_page_size

                    fetch_elapsed = _time.monotonic() - fetch_start
                    logger.info(f"Fetch offset={offset}: {fetch_elapsed:.2f}s (prefetch={'yes' if fetch_elapsed < 0.1 else 'no'})")

                    if data is None:
                        break

                    raw_results = data.get('patentFileWrapperDataBag', data.get('patentApplications', []))
                    if not raw_results:
                        break

                    # Prefetch next page while we process this one
                    next_offset = offset + len(raw_results)
                    if next_offset < job.total_expected:
                        pending_future = prefetch_executor.submit(
                            _fetch_page, next_offset, current_page_size
                        )

                    # Bulk-process current page
                    t0 = _time.monotonic()
                    normalized_list = _normalize_odp_results(raw_results, api=api)
                    t1 = _time.monotonic()
                    created, skipped = _import_batch(normalized_list, portfolio, job.import_fields)
                    t2 = _time.monotonic()
                    job.processed += len(raw_results)
                    job.created_count += created
                    job.skipped_count += skipped

                    job.save(update_fields=['processed', 'created_count', 'skipped_count'])
                    logger.info(
                        f"Page offset={offset} size={len(raw_results)}: "
                        f"normalize={t1-t0:.2f}s db={t2-t1:.2f}s total_process={t2-t0:.2f}s"
                    )
                    offset = next_offset
            finally:
                prefetch_executor.shutdown(wait=False)

        # Complete
        job.status = 'completed'
        job.completed_at = timezone.now()
        job.save(update_fields=['status', 'completed_at', 'processed', 'created_count', 'skipped_count'])

        # Update portfolio cached metrics
        _update_portfolio_metrics(portfolio)

    except Exception as exc:
        logger.exception(f"ODPImportJob {job_id} failed")
        job.status = 'failed'
        job.error_message = str(exc)[:2000]
        job.completed_at = timezone.now()
        job.save(update_fields=['status', 'error_message', 'completed_at'])


def _update_portfolio_metrics(portfolio):
    """Refresh cached patent counts on the portfolio."""
    from django.db.models import Sum
    patents = portfolio.patents.all()
    portfolio.total_patents = patents.count()
    portfolio.active_patents = patents.filter(status='granted').count()
    portfolio.pending_patents = patents.filter(status__in=['filed', 'pending']).count()
    portfolio.expired_patents = patents.filter(status='expired').count()
    portfolio.total_value = patents.aggregate(Sum('estimated_value'))['estimated_value__sum'] or 0
    portfolio.annual_maintenance_cost = (
        patents.filter(status='granted').aggregate(Sum('maintenance_cost'))['maintenance_cost__sum'] or 0
    )
    portfolio.save()


def fetch_odp_count(company_name):
    """Fetch the estimated patent count from USPTO ODP for a company name.
    Returns count (int) or None on error."""
    if not company_name:
        return None
    try:
        from domains.analytics.uspto_odp_service import USPTOODPClient
        client = USPTOODPClient()
        q = f'applicationMetaData.firstApplicantName:("{company_name}")'
        data = client.post('/patent/applications/search', {'q': q, 'pagination': {'offset': 0, 'limit': 1}})
        if data:
            return data.get('count', data.get('recordTotalQuantity', 0))
    except Exception as exc:
        logger.warning("Failed to fetch ODP count for %s: %s", company_name, exc)
    return None


def start_import_job(job_id):
    """Dispatch an import job via Celery, falling back to a thread if broker is unavailable."""
    try:
        result = run_odp_import.delay(str(job_id))
        # Store celery task id
        from .models import ODPImportJob
        ODPImportJob.objects.filter(id=job_id).update(celery_task_id=result.id)
    except Exception:
        logger.warning("Celery broker unavailable, falling back to thread for ODPImportJob %s", job_id)
        t = threading.Thread(target=run_odp_import, args=[str(job_id)], daemon=True)
        t.start()
