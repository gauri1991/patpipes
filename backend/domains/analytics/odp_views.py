"""
USPTO Open Data Portal (ODP) Proxy Views

Exposes ODP application detail, trial, and appeal endpoints as platform API routes.
Registered at: /api/v1/analytics/api/research/odp/...
"""

import hashlib
import json
import logging
import xml.etree.ElementTree as ET
from datetime import timedelta

import requests
from django.http import StreamingHttpResponse
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet

from .models import ODPCacheEntry, PatentAnalysisResult
from .patent_analysis_service import PatentAnalysisService
from .uspto_odp_service import (
    USPTOODPClient,
    USPTOODPDetailService,
    USPTOODPError,
    USPTOODPTrialService,
)

logger = logging.getLogger(__name__)


def _error_response(exc: Exception):
    return Response(
        {'error': str(exc)},
        status=status.HTTP_502_BAD_GATEWAY,
    )


def _all_text(element) -> str:
    """Concatenate all text content from an element and its descendants."""
    return ''.join(element.itertext()).strip()


def _parse_claim_element(claim_el) -> str:
    """
    Convert a <claim> XML element to readable text.

    USPTO publication XML mixes inline formatting tags into the preamble:
      <claim>
        <claim-text>
          <b>1</b>. A system, comprising:           ← preamble (mixed content with <b>)
          <claim-text>one or more processors…</claim-text>   ← each step
          <claim-text>a memory coupled to…</claim-text>
        </claim-text>
      </claim>

    The preamble lives in the text() nodes BEFORE the first nested <claim-text>,
    interleaved with formatting tags like <b>. The original parser only read
    outer.text which is empty in this structure — losing the claim number and
    opening clause. Walk the element tree explicitly to capture mixed content.
    """
    outer = claim_el.find('claim-text')
    if outer is None:
        return _all_text(claim_el)

    nested_steps = outer.findall('claim-text')
    if not nested_steps:
        # Simple single-line claim (most dependent claims) — _all_text handles
        # mixed inline tags (<b>, <i>, etc.) cleanly.
        return _all_text(outer)

    # Capture the preamble: text() and inline (non-claim-text) children
    # that appear BEFORE the first nested <claim-text>.
    preamble_parts: list[str] = []
    if outer.text and outer.text.strip():
        preamble_parts.append(outer.text)
    for child in outer:
        if child.tag == 'claim-text':
            break  # start of step list
        # Inline formatting tag (e.g. <b>1</b>) — include its text + tail
        if child.text:
            preamble_parts.append(child.text)
        if child.tail:
            preamble_parts.append(child.tail)

    preamble = ''.join(preamble_parts).strip()
    # Normalise whitespace runs without destroying line breaks added by the data
    preamble = ' '.join(preamble.split())

    lines = []
    if preamble:
        lines.append(preamble)
    for step in nested_steps:
        step_text = _all_text(step)
        if step_text:
            lines.append(step_text)

    return '\n'.join(lines)


def _fetch_and_parse_xml(url, api_key):
    """Fetch a USPTO XML document and parse it into structured sections.

    Returns {'abstract': str, 'description': str, 'claims': [str, ...]}
    or None if fetch/parse fails.
    """
    try:
        headers = {'Accept': 'application/xml'}
        if api_key:
            headers['x-api-key'] = api_key
        resp = requests.get(url, headers=headers, timeout=60)
        resp.raise_for_status()

        root = ET.fromstring(resp.content)

        # Abstract
        abstract_el = root.find('.//abstract')
        abstract = _all_text(abstract_el) if abstract_el is not None else ''

        # Description
        desc_el = root.find('.//description')
        description = _all_text(desc_el) if desc_el is not None else ''

        # Claims — each <claim> child of <claims> becomes one entry
        claims = []
        claims_el = root.find('.//claims')
        if claims_el is not None:
            for claim_el in claims_el.findall('claim'):
                claim_text = _parse_claim_element(claim_el)
                if claim_text:
                    claims.append(claim_text)

        return {
            'abstract': abstract,
            'description': description,
            'claims': claims,
        }
    except Exception:
        logger.exception('Failed to fetch/parse XML from %s', url)
        return None


class USPTOODPViewSet(GenericViewSet):
    """
    Proxy viewset that exposes USPTO ODP endpoints to the platform frontend.

    Application endpoints:
        GET  odp/application/{app_id}/
        GET  odp/application/{app_id}/continuity/
        GET  odp/application/{app_id}/assignment/
        GET  odp/application/{app_id}/attorney/
        GET  odp/application/{app_id}/transactions/
        GET  odp/application/{app_id}/documents/
        GET  odp/application/{app_id}/foreign-priority/
        GET  odp/application/{app_id}/adjustment/

    Trial endpoints:
        POST odp/trials/search/
        GET  odp/trials/{trial_number}/
        POST odp/trials/decisions/search/
        POST odp/appeals/decisions/search/
    """

    permission_classes = [IsAuthenticated]

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        client = USPTOODPClient()
        self.detail_svc = USPTOODPDetailService(client)
        self.trial_svc = USPTOODPTrialService(client)

    # ---------------------------------------------------------------
    # Application endpoints
    # ---------------------------------------------------------------

    @action(detail=False, methods=['get'], url_path='application/(?P<app_id>[^/.]+)')
    def application(self, request, app_id=None):
        """Full application data."""
        try:
            return Response(self.detail_svc.get_application(app_id))
        except USPTOODPError as exc:
            return _error_response(exc)

    @action(detail=False, methods=['get'], url_path='application/(?P<app_id>[^/.]+)/continuity')
    def continuity(self, request, app_id=None):
        try:
            return Response(self.detail_svc.get_continuity(app_id))
        except USPTOODPError as exc:
            return _error_response(exc)

    @action(detail=False, methods=['get'], url_path='application/(?P<app_id>[^/.]+)/assignment')
    def assignment(self, request, app_id=None):
        try:
            return Response(self.detail_svc.get_assignment(app_id))
        except USPTOODPError as exc:
            return _error_response(exc)

    @action(detail=False, methods=['get'], url_path='application/(?P<app_id>[^/.]+)/attorney')
    def attorney(self, request, app_id=None):
        try:
            return Response(self.detail_svc.get_attorney(app_id))
        except USPTOODPError as exc:
            return _error_response(exc)

    @action(detail=False, methods=['get'], url_path='application/(?P<app_id>[^/.]+)/transactions')
    def transactions(self, request, app_id=None):
        try:
            return Response(self.detail_svc.get_transactions(app_id))
        except USPTOODPError as exc:
            return _error_response(exc)

    @action(detail=False, methods=['get'], url_path='application/(?P<app_id>[^/.]+)/documents')
    def documents(self, request, app_id=None):
        try:
            return Response(self.detail_svc.get_documents(app_id))
        except USPTOODPError as exc:
            return _error_response(exc)

    @action(detail=False, methods=['get'], url_path='application/(?P<app_id>[^/.]+)/documents/download')
    def document_download(self, request, app_id=None):
        """Proxy a document download from USPTO, adding API key auth."""
        download_url = request.query_params.get('url')
        if not download_url:
            return Response(
                {'error': 'Missing url parameter'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Only allow USPTO API URLs
        if not download_url.startswith('https://api.uspto.gov/'):
            return Response(
                {'error': 'Invalid download URL'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            api_key = self.detail_svc.client.api_key
            headers = {}
            if api_key:
                headers['x-api-key'] = api_key

            resp = requests.get(download_url, headers=headers, stream=True, timeout=60)
            resp.raise_for_status()

            content_type = resp.headers.get('Content-Type', 'application/pdf')
            content_disposition = resp.headers.get(
                'Content-Disposition',
                f'inline; filename="document.pdf"',
            )

            streaming_response = StreamingHttpResponse(
                resp.iter_content(chunk_size=8192),
                content_type=content_type,
            )
            streaming_response['Content-Disposition'] = content_disposition
            if 'Content-Length' in resp.headers:
                streaming_response['Content-Length'] = resp.headers['Content-Length']
            return streaming_response
        except requests.exceptions.RequestException as exc:
            logger.error('Document download failed: %s', exc)
            return Response(
                {'error': f'Download failed: {exc}'},
                status=status.HTTP_502_BAD_GATEWAY,
            )

    @action(detail=False, methods=['get'], url_path='application/(?P<app_id>[^/.]+)/foreign-priority')
    def foreign_priority(self, request, app_id=None):
        try:
            return Response(self.detail_svc.get_foreign_priority(app_id))
        except USPTOODPError as exc:
            return _error_response(exc)

    @action(detail=False, methods=['get'], url_path='application/(?P<app_id>[^/.]+)/adjustment')
    def adjustment(self, request, app_id=None):
        try:
            return Response(self.detail_svc.get_term_adjustment(app_id))
        except USPTOODPError as exc:
            return _error_response(exc)

    # ---------------------------------------------------------------
    # Search endpoint
    # ---------------------------------------------------------------

    SEARCH_CACHE_TTL = timedelta(hours=1)

    @action(detail=False, methods=['post'], url_path='search')
    def search(self, request):
        """Search patent applications via ODP (cached for 1 hour)."""
        try:
            cache_key = hashlib.md5(
                json.dumps(request.data, sort_keys=True).encode()
            ).hexdigest()
            cutoff = timezone.now() - self.SEARCH_CACHE_TTL
            cached = (
                ODPCacheEntry.objects
                .filter(application_id=cache_key, endpoint='search', fetched_at__gte=cutoff)
                .first()
            )
            if cached:
                logger.debug('ODP search cache HIT %s', cache_key)
                return Response(cached.response_data)

            logger.debug('ODP search cache MISS %s', cache_key)
            client = USPTOODPClient()
            result = client.post('/patent/applications/search', request.data)

            if result is not None:
                ODPCacheEntry.objects.update_or_create(
                    application_id=cache_key,
                    endpoint='search',
                    defaults={'response_data': result, 'fetched_at': timezone.now()},
                )
            return Response(result)
        except USPTOODPError as exc:
            return _error_response(exc)

    FULL_TEXT_CACHE_TTL = timedelta(days=7)

    @action(detail=False, methods=['get'], url_path='application/(?P<app_id>[^/.]+)/full-text')
    def full_text(self, request, app_id=None):
        """Fetch grant/publication full text, parsing XML into structured sections."""
        try:
            # Check cache first
            cutoff = timezone.now() - self.FULL_TEXT_CACHE_TTL
            cached = (
                ODPCacheEntry.objects
                .filter(application_id=app_id, endpoint='full-text-parsed', fetched_at__gte=cutoff)
                .first()
            )
            if cached:
                logger.debug('Full text cache HIT for %s', app_id)
                return Response(cached.response_data)

            app_data = self.detail_svc.get_application(app_id)
            if not app_data:
                return Response(
                    {'grant_url': None, 'pgpub_url': None,
                     'grant_document_id': None, 'pgpub_document_id': None,
                     'grant_text': None, 'pgpub_text': None}
                )

            grant_meta = app_data.get('grantDocumentMetaData') or {}
            grant_url = grant_meta.get('fileLocationURI')
            grant_document_id = grant_meta.get('xmlFileName')

            pub_meta = (
                app_data.get('pgpubDocumentMetaData')
                or app_data.get('publicationDocumentMetaData')
                or {}
            )
            pgpub_url = pub_meta.get('fileLocationURI')
            pgpub_document_id = pub_meta.get('xmlFileName')

            api_key = self.detail_svc.client.api_key

            grant_text = None
            if grant_url:
                grant_text = _fetch_and_parse_xml(grant_url, api_key)

            pgpub_text = None
            if pgpub_url:
                pgpub_text = _fetch_and_parse_xml(pgpub_url, api_key)

            result = {
                'grant_url': grant_url,
                'pgpub_url': pgpub_url,
                'grant_document_id': grant_document_id,
                'pgpub_document_id': pgpub_document_id,
                'grant_text': grant_text,
                'pgpub_text': pgpub_text,
            }

            ODPCacheEntry.objects.update_or_create(
                application_id=app_id,
                endpoint='full-text-parsed',
                defaults={'response_data': result, 'fetched_at': timezone.now()},
            )

            return Response(result)
        except USPTOODPError as exc:
            return _error_response(exc)

    # ---------------------------------------------------------------
    # Analysis endpoint
    # ---------------------------------------------------------------

    ANALYSIS_CACHE_TTL = timedelta(days=30)

    @action(detail=False, methods=['post'], url_path='application/(?P<app_id>[^/.]+)/analyze')
    def analyze(self, request, app_id=None):
        """Run deep AI analysis on patent full text.

        POST body: { "force_refresh": false, "model": "sonnet", "prompt_category": "general" }
        Returns structured analysis with 8 sections.
        """
        force_refresh = request.data.get('force_refresh', False)
        check_only = request.data.get('check_only', False)
        model_key = request.data.get('model', 'sonnet')
        prompt_category = request.data.get('prompt_category', 'general')

        if model_key not in ('sonnet', 'opus', 'haiku'):
            return Response(
                {'error': f'Invalid model: {model_key}. Choose sonnet, opus, or haiku.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check for existing analysis result (same model + category)
        if not force_refresh:
            existing = (
                PatentAnalysisResult.objects
                .filter(application_id=app_id)
                .filter(model_used__contains=model_key)
                .filter(prompt_category=prompt_category)
                .order_by('-created_at')
                .first()
            )
            if existing:
                # Skip cached results where all sections failed
                ss = existing.section_status or {}
                if any(s == 'completed' for s in ss.values()):
                    return Response(self._serialize_analysis(existing))

        # check_only: if exact match not found, try any result for this app
        if check_only:
            any_existing = (
                PatentAnalysisResult.objects
                .filter(application_id=app_id)
                .order_by('-created_at')
                .first()
            )
            if any_existing:
                ss = any_existing.section_status or {}
                if any(s == 'completed' for s in ss.values()):
                    return Response(self._serialize_analysis(any_existing))
            return Response(status=status.HTTP_404_NOT_FOUND)

        # Fetch full text (reuse cached if available)
        try:
            full_text_data = self._get_full_text_for_analysis(app_id)
        except Exception as exc:
            logger.exception('Failed to fetch full text for analysis')
            return Response(
                {'error': f'Could not fetch patent text: {exc}'},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        if not full_text_data:
            return Response(
                {'error': 'No full text available for this application.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Run analysis
        try:
            service = PatentAnalysisService()
            patent_number = ''
            try:
                app_data = self.detail_svc.get_application(app_id)
                patent_number = (app_data or {}).get('applicationMetaData', {}).get('patentNumber', '')
            except Exception:
                pass

            result = service.analyze_patent(
                application_id=app_id,
                patent_text=full_text_data,
                model_key=model_key,
                patent_number=patent_number,
                prompt_category=prompt_category,
            )
        except RuntimeError as exc:
            return Response(
                {'error': str(exc)},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        except Exception as exc:
            logger.exception('Patent analysis failed')
            return Response(
                {'error': f'Analysis failed: {exc}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # Only store if at least one section succeeded
        section_statuses = result.get('section_status', {})
        completed_count = sum(1 for s in section_statuses.values() if s == 'completed')
        if completed_count == 0:
            return Response(
                {'error': 'Analysis failed: all sections encountered errors (API overloaded). Please try again.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        # Store result
        try:
            from decimal import Decimal
            analysis = PatentAnalysisResult.objects.create(
                application_id=app_id,
                patent_number=result.get('patent_number', ''),
                model_used=result['model_used'],
                analysis_version=result.get('analysis_version', '1.0'),
                total_input_tokens=result.get('total_input_tokens', 0),
                total_output_tokens=result.get('total_output_tokens', 0),
                total_cost_usd=Decimal(str(result.get('total_cost_usd', 0))),
                processing_time_seconds=result.get('processing_time_seconds', 0),
                keywords=result.get('keywords', {}),
                novel_elements=result.get('novel_elements', {}),
                claim_scope=result.get('claim_scope', {}),
                embodiments=result.get('embodiments', {}),
                background_analysis=result.get('background_analysis', {}),
                claim_tree=result.get('claim_tree', {}),
                means_plus_function=result.get('means_plus_function', {}),
                vulnerabilities=result.get('vulnerabilities', {}),
                section_status=result.get('section_status', {}),
                prompt_category=result.get('prompt_category', 'general'),
                prompts_used=result.get('prompts_used', {}),
                created_by=request.user if request.user.is_authenticated else None,
            )
        except Exception:
            logger.exception('Failed to store analysis result')
            # Still return the result even if storage fails

        return Response(result)

    def _get_full_text_for_analysis(self, app_id):
        """Get parsed full text, preferring cache."""
        cutoff = timezone.now() - self.FULL_TEXT_CACHE_TTL
        cached = (
            ODPCacheEntry.objects
            .filter(application_id=app_id, endpoint='full-text-parsed', fetched_at__gte=cutoff)
            .first()
        )
        if cached and cached.response_data:
            data = cached.response_data
            # Prefer grant text, fall back to pgpub
            text = data.get('grant_text') or data.get('pgpub_text')
            if text:
                return text

        # Fetch fresh
        app_data = self.detail_svc.get_application(app_id)
        if not app_data:
            return None

        api_key = self.detail_svc.client.api_key

        grant_meta = app_data.get('grantDocumentMetaData') or {}
        grant_url = grant_meta.get('fileLocationURI')
        if grant_url:
            text = _fetch_and_parse_xml(grant_url, api_key)
            if text:
                return text

        pub_meta = (
            app_data.get('pgpubDocumentMetaData')
            or app_data.get('publicationDocumentMetaData')
            or {}
        )
        pgpub_url = pub_meta.get('fileLocationURI')
        if pgpub_url:
            text = _fetch_and_parse_xml(pgpub_url, api_key)
            if text:
                return text

        return None

    def _serialize_analysis(self, analysis: PatentAnalysisResult) -> dict:
        """Serialize a stored PatentAnalysisResult to API response dict."""
        return {
            'application_id': analysis.application_id,
            'patent_number': analysis.patent_number,
            'model_used': analysis.model_used,
            'analysis_version': analysis.analysis_version,
            'total_input_tokens': analysis.total_input_tokens,
            'total_output_tokens': analysis.total_output_tokens,
            'total_cost_usd': float(analysis.total_cost_usd),
            'processing_time_seconds': analysis.processing_time_seconds,
            'section_status': analysis.section_status,
            'keywords': analysis.keywords,
            'novel_elements': analysis.novel_elements,
            'claim_scope': analysis.claim_scope,
            'embodiments': analysis.embodiments,
            'background_analysis': analysis.background_analysis,
            'claim_tree': analysis.claim_tree,
            'means_plus_function': analysis.means_plus_function,
            'vulnerabilities': analysis.vulnerabilities,
            'prompt_category': analysis.prompt_category,
            'prompts_used': analysis.prompts_used,
            'created_at': analysis.created_at.isoformat(),
            'cached': True,
        }

    # ---------------------------------------------------------------
    # Trial endpoints
    # ---------------------------------------------------------------

    @action(detail=False, methods=['post'], url_path='trials/search')
    def trials_search(self, request):
        try:
            return Response(self.trial_svc.search_proceedings(request.data))
        except USPTOODPError as exc:
            return _error_response(exc)

    @action(detail=False, methods=['get'], url_path='trials/(?P<trial_number>[^/.]+)')
    def trial_detail(self, request, trial_number=None):
        try:
            return Response(self.trial_svc.get_proceeding(trial_number))
        except USPTOODPError as exc:
            return _error_response(exc)

    @action(detail=False, methods=['post'], url_path='trials/decisions/search')
    def decisions_search(self, request):
        try:
            return Response(self.trial_svc.search_decisions(request.data))
        except USPTOODPError as exc:
            return _error_response(exc)

    @action(detail=False, methods=['post'], url_path='appeals/decisions/search')
    def appeals_search(self, request):
        try:
            return Response(self.trial_svc.search_appeal_decisions(request.data))
        except USPTOODPError as exc:
            return _error_response(exc)
