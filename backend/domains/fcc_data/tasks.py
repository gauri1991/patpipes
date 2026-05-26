"""
FCC Data Celery Tasks
"""

import logging
from decimal import Decimal, InvalidOperation

from celery import shared_task
from django.utils import timezone

logger = logging.getLogger(__name__)


def _to_decimal(value):
    """Safely convert a value to Decimal, returning None on failure."""
    if value is None:
        return None
    try:
        return Decimal(str(value))
    except (InvalidOperation, ValueError, TypeError):
        return None


@shared_task(bind=True, name='domains.fcc_data.tasks.execute_fcc_query',
             time_limit=120, soft_time_limit=110)
def execute_fcc_query(self, job_id):
    """
    Execute an FCC API query and store the results.

    Args:
        job_id: UUID of the FCCQueryJob
    """
    from .models import FCCQueryJob, FCCAuthorization
    from .fcc_api_service import FCCApiService, FCCApiError

    try:
        job = FCCQueryJob.objects.get(pk=job_id)
    except FCCQueryJob.DoesNotExist:
        logger.error(f"FCCQueryJob {job_id} not found")
        return

    job.status = 'running'
    job.task_id = self.request.id or ''
    job.error_message = ''
    job.save(update_fields=['status', 'task_id', 'error_message', 'updated_at'])

    service = FCCApiService()

    try:
        # Call appropriate API endpoint
        if job.query_type == 'fcc_id':
            # Combine grantee code + product code into full FCC ID
            # The API expects dash-separated format: {grantee_code}-{product_code}
            grantee = job.fcc_id.strip().rstrip('-')
            product = job.product_code.strip().lstrip('-')
            if product:
                search_id = f"{grantee}-{product}"
            else:
                search_id = grantee
            raw_results = service.get_fcc_id_list(search_id)
            normalized = service.normalize_fcc_id_results(raw_results)
        elif job.query_type == 'grantee_search':
            # Search local grantee database, then query OET API for each matching grantee code
            import time
            from .models import FCCGrantee
            matching_grantees = FCCGrantee.objects.filter(
                grantee_name__icontains=job.grantee_search_term.strip()
            )
            grantee_codes = list(matching_grantees.values_list('grantee_code', flat=True))
            logger.info(f"Grantee search '{job.grantee_search_term}' matched {len(grantee_codes)} grantees")

            raw_results = []
            normalized = []
            for i, code in enumerate(grantee_codes):
                try:
                    results = service.get_fcc_id_list(code)
                    raw_results.extend(results)
                    normalized.extend(service.normalize_fcc_id_results(results))
                    logger.info(f"Grantee search [{i+1}/{len(grantee_codes)}] {code}: {len(results)} results")
                except Exception as e:
                    logger.warning(f"Grantee search failed for {code}: {e}")
                if i < len(grantee_codes) - 1:
                    time.sleep(1)

        elif job.query_type == 'bulk_fcc_id':
            # Bulk search: iterate over each FCC ID, query API, merge results
            import time
            raw_results = []
            normalized = []
            fcc_ids = job.bulk_fcc_ids or []
            for i, fid in enumerate(fcc_ids):
                fid = fid.strip()
                if len(fid) < 3:
                    continue
                try:
                    results = service.get_fcc_id_list(fid)
                    raw_results.extend(results)
                    normalized.extend(service.normalize_fcc_id_results(results))
                    logger.info(f"Bulk search [{i+1}/{len(fcc_ids)}] {fid}: {len(results)} results")
                except Exception as e:
                    logger.warning(f"Bulk search failed for {fid}: {e}")
                # Polite delay between API calls (1 second)
                if i < len(fcc_ids) - 1:
                    time.sleep(1)
        elif job.query_type == 'whitespace':
            raw_results = service.get_whitespace_authorizations(job.begin_date, job.end_date)
            normalized = service.normalize_whitespace_results(raw_results)
        elif job.query_type == 'cbsd':
            raw_results = service.get_cbsd_authorizations(job.begin_date, job.end_date)
            normalized = service.normalize_cbsd_afc_results(raw_results)
        elif job.query_type == 'afc':
            raw_results = service.get_afc_authorizations(job.begin_date, job.end_date)
            normalized = service.normalize_cbsd_afc_results(raw_results)
        else:
            raise FCCApiError(f"Unknown query type: {job.query_type}")

        # Store raw response
        job.raw_response = raw_results

        # Clear old results if re-running
        FCCAuthorization.objects.filter(job=job).delete()

        # Create authorization records
        auth_objects = []
        for record in normalized:
            auth_objects.append(FCCAuthorization(
                job=job,
                fcc_id=record.get('fcc_id', ''),
                grantee_name=record.get('grantee_name', ''),
                application_purpose=record.get('application_purpose', ''),
                equipment_class=record.get('equipment_class', ''),
                description=record.get('description', ''),
                grant_date=record.get('grant_date', ''),
                status=record.get('status', ''),
                status_date=record.get('status_date', ''),
                address=record.get('address', ''),
                city=record.get('city', ''),
                state=record.get('state', ''),
                zip_code=record.get('zip_code', ''),
                country=record.get('country', ''),
                freq_min=_to_decimal(record.get('freq_min')),
                freq_max=_to_decimal(record.get('freq_max')),
                power_output=_to_decimal(record.get('power_output')),
                emission_designator=record.get('emission_designator', ''),
                grant_notes=record.get('grant_notes', []),
                raw_data=record,
            ))

        if auth_objects:
            FCCAuthorization.objects.bulk_create(auth_objects, batch_size=200)

        job.results_count = len(auth_objects)
        job.status = 'completed'
        job.save(update_fields=['status', 'results_count', 'raw_response', 'updated_at'])

        logger.info(f"FCC query {job_id} completed: {len(auth_objects)} records")

        return {
            'status': 'completed',
            'job_id': str(job_id),
            'results_count': len(auth_objects),
        }

    except FCCApiError as e:
        logger.error(f"FCC API error for job {job_id}: {e}")
        job.status = 'failed'
        job.error_message = str(e)
        job.save(update_fields=['status', 'error_message', 'updated_at'])
        return {'status': 'failed', 'error': str(e)}

    except Exception as e:
        logger.exception(f"FCC query failed for job {job_id}: {e}")
        job.status = 'failed'
        job.error_message = str(e)[:2000]
        job.save(update_fields=['status', 'error_message', 'updated_at'])
        raise


@shared_task(bind=True, name='domains.fcc_data.tasks.fetch_fcc_documents',
             time_limit=300, soft_time_limit=290)
def fetch_fcc_documents(self, job_id, fcc_id):
    """
    Discover all exhibit documents for an FCC ID from fccid.io.
    Creates FCCDocument records but does NOT download the files.
    """
    from .models import FCCQueryJob, FCCDocument
    from .fcc_document_scraper import FCCDocumentScraper

    try:
        job = FCCQueryJob.objects.get(pk=job_id)
    except FCCQueryJob.DoesNotExist:
        return

    scraper = FCCDocumentScraper()

    try:
        # Clear existing documents for this FCC ID in this job
        FCCDocument.objects.filter(job=job, fcc_id=fcc_id).delete()

        documents = scraper.discover_documents(fcc_id)

        doc_objects = [
            FCCDocument(
                job=job,
                fcc_id=fcc_id,
                exhibit_name=doc['exhibit_name'],
                document_url=doc['document_url'],
                document_type=doc['document_type'],
            )
            for doc in documents
        ]

        if doc_objects:
            FCCDocument.objects.bulk_create(doc_objects, batch_size=100)

        logger.info(f"Discovered {len(doc_objects)} documents for {fcc_id} in job {job_id}")

        return {
            'status': 'completed',
            'fcc_id': fcc_id,
            'documents_found': len(doc_objects),
        }

    except Exception as e:
        logger.error(f"Document discovery failed for {fcc_id}: {e}")
        return {
            'status': 'failed',
            'fcc_id': fcc_id,
            'error': str(e)[:500],
        }


@shared_task(bind=True, name='domains.fcc_data.tasks.download_fcc_documents',
             time_limit=600, soft_time_limit=590)
def download_fcc_documents(self, job_id, document_ids=None):
    """
    Download selected FCC documents.
    If document_ids is None, downloads all undiscovered docs for the job.
    """
    from .models import FCCQueryJob, FCCDocument
    from .fcc_document_scraper import FCCDocumentScraper
    from django.core.files.base import ContentFile

    try:
        job = FCCQueryJob.objects.get(pk=job_id)
    except FCCQueryJob.DoesNotExist:
        return

    queryset = FCCDocument.objects.filter(job=job, is_downloaded=False)
    if document_ids:
        queryset = queryset.filter(id__in=document_ids)

    docs_to_download = list(queryset)
    if not docs_to_download:
        return {'status': 'completed', 'downloaded': 0}

    scraper = FCCDocumentScraper()
    downloaded = 0

    for doc in docs_to_download:
        try:
            content, filename, mime_type = scraper.download_document(doc.document_url)

            doc.file.save(filename, ContentFile(content), save=False)
            doc.original_filename = filename
            doc.mime_type = mime_type
            doc.file_size_bytes = len(content)
            doc.is_downloaded = True
            doc.download_error = ''
            doc.save(update_fields=[
                'file', 'original_filename', 'mime_type',
                'file_size_bytes', 'is_downloaded', 'download_error',
            ])
            downloaded += 1

        except Exception as e:
            logger.error(f"Failed to download document {doc.id}: {e}")
            doc.download_error = str(e)[:1000]
            doc.save(update_fields=['download_error'])

    logger.info(f"Downloaded {downloaded}/{len(docs_to_download)} documents for job {job_id}")

    return {
        'status': 'completed',
        'downloaded': downloaded,
        'total': len(docs_to_download),
    }
