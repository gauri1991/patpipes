"""
Lens.org Patent API Proxy Views

Exposes Lens patent search and single-patent lookup as platform API routes.
Registered at: /api/v1/analytics/api/research/lens/...
"""

import logging

from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet

from .lens_service import LensClient, LensAPIError
from .family_analysis_service import FamilyAnalysisService

logger = logging.getLogger(__name__)

# Fields to include in full patent detail responses
LENS_DETAIL_FIELDS = [
    'lens_id', 'doc_number', 'kind', 'date_published', 'doc_key',
    'jurisdiction', 'publication_type', 'lang',
    'biblio', 'abstract', 'claims', 'legal_status', 'families',
]

# Fields for lightweight search results (no claims/description)
LENS_SEARCH_FIELDS = [
    'lens_id', 'doc_number', 'kind', 'date_published', 'doc_key',
    'jurisdiction', 'publication_type',
    'biblio', 'abstract', 'legal_status', 'families',
]


class LensViewSet(GenericViewSet):
    """Proxy ViewSet for the Lens.org Patent API."""

    permission_classes = [IsAuthenticated]

    def _get_client(self):
        return LensClient()

    @action(detail=False, methods=['post'], url_path='search')
    def search(self, request):
        """Proxy Lens patent search.

        POST body is forwarded to the Lens API with sensible defaults.
        """
        body = request.data.copy() if request.data else {}

        # Ensure defaults
        body.setdefault('size', 20)
        body.setdefault('from', 0)
        if 'include' not in body and 'exclude' not in body:
            body['include'] = LENS_SEARCH_FIELDS

        if 'query' not in body:
            return Response(
                {'error': 'A "query" field is required'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            client = self._get_client()
            result = client.post('/patent/search', body)
            if result is None:
                return Response({'total': 0, 'data': []})
            return Response(result)
        except LensAPIError as exc:
            logger.error('Lens search proxy error: %s', exc)
            return Response(
                {'error': str(exc)},
                status=status.HTTP_502_BAD_GATEWAY,
            )

    @action(detail=False, methods=['get'], url_path='patent')
    def patent(self, request):
        """Lookup a single patent by doc_number and optional jurisdiction.

        GET /lens/patent/?doc_number=11301943&jurisdiction=US
        """
        doc_number = request.query_params.get('doc_number', '').strip()
        jurisdiction = request.query_params.get('jurisdiction', '').strip().upper()

        if not doc_number:
            return Response(
                {'error': 'doc_number query parameter is required'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        must_clauses = [
            {'terms': {'doc_number': [doc_number]}},
        ]
        if jurisdiction:
            must_clauses.append(
                {'term': {'jurisdiction': jurisdiction}}
            )

        body = {
            'query': {'bool': {'must': must_clauses}},
            'size': 5,
            'include': LENS_DETAIL_FIELDS,
            'sort': [{'date_published': 'desc'}],
        }

        try:
            client = self._get_client()
            result = client.post('/patent/search', body)

            if result is None or not result.get('data'):
                return Response(
                    {'error': f'Patent {jurisdiction}{doc_number} not found in Lens'},
                    status=status.HTTP_404_NOT_FOUND,
                )

            return Response({
                'total': result.get('total', 0),
                'data': result['data'],
                'patent': result['data'][0],
            })
        except LensAPIError as exc:
            logger.error('Lens patent lookup error: %s', exc)
            return Response(
                {'error': str(exc)},
                status=status.HTTP_502_BAD_GATEWAY,
            )

    @action(detail=False, methods=['post'], url_path='family-analysis')
    def family_analysis(self, request):
        """Analyze claims across patent family members.

        POST body:
        {
            "lens_id": "xxx-xxx-xxx",
            "family_type": "simple" | "extended",
            "analysis_mode": "quick" | "deep",
            "model": "sonnet" | "opus"  (only for deep mode)
        }
        """
        lens_id = request.data.get('lens_id', '').strip()
        family_type = request.data.get('family_type', 'simple')
        analysis_mode = request.data.get('analysis_mode', 'quick')
        model = request.data.get('model', 'sonnet')

        if not lens_id:
            return Response(
                {'error': 'lens_id is required'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if family_type not in ('simple', 'extended'):
            return Response(
                {'error': 'family_type must be "simple" or "extended"'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            service = FamilyAnalysisService()
            members = service.fetch_family_claims(lens_id, family_type)

            if len(members) < 2:
                return Response({
                    'error': 'Family has fewer than 2 members with data. Nothing to compare.',
                    'family_size': len(members),
                })

            if analysis_mode == 'deep':
                result = service.deep_analysis(members, model)
            else:
                result = service.quick_analysis(members)

            return Response(result)

        except LensAPIError as exc:
            logger.error('Family analysis Lens error: %s', exc)
            return Response(
                {'error': str(exc)},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        except ValueError as exc:
            return Response(
                {'error': str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as exc:
            logger.error('Family analysis error: %s', exc)
            return Response(
                {'error': f'Analysis failed: {str(exc)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
