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

from .models import ODPCacheEntry
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


def _extract_element_text(element):
    """Recursively extract all text from an XML element and its children."""
    return (ET.tostring(element, encoding='unicode', method='text') or '').strip()


def _fetch_and_parse_xml(url, api_key):
    """Fetch a USPTO XML document and parse it into structured text sections.

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

        # Abstract — may be at different paths depending on grant vs publication
        abstract_el = root.find('.//abstract')
        abstract = _extract_element_text(abstract_el) if abstract_el is not None else ''

        # Description
        desc_el = root.find('.//description')
        description = _extract_element_text(desc_el) if desc_el is not None else ''

        # Claims — individual <claim> elements inside <claims> (or <us-claim-statement>)
        claims = []
        claims_el = root.find('.//claims')
        if claims_el is not None:
            for claim_el in claims_el.findall('.//claim'):
                claim_text = _extract_element_text(claim_el)
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
