"""
Web Search Views
"""

import logging
from datetime import date

from rest_framework import viewsets, filters, status, mixins
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone

from rest_framework.permissions import IsAdminUser

from .models import SearchSession, SearchQuery, SearchResult, GoogleSearchConfig
from .serializers import (
    SearchSessionSerializer,
    SearchSessionListSerializer,
    SearchQuerySerializer,
    SearchResultSerializer,
    QuotaSerializer,
    GoogleSearchConfigSerializer,
    ClientSearchSubmissionSerializer,
)
from .services import GoogleSearchService, GoogleSearchError
from .query_templates import generate_queries_for_source

logger = logging.getLogger(__name__)


class SearchSessionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Search Sessions
    """
    queryset = SearchSession.objects.all().prefetch_related('queries', 'queries__results')
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['source_type', 'status']
    search_fields = ['title', 'notes']
    ordering_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return SearchSessionListSerializer
        return SearchSessionSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def generate_queries(self, request, pk=None):
        """
        Auto-generate search queries based on the session's source_type and context_data.
        """
        session = self.get_object()

        query_defs = generate_queries_for_source(session.source_type, session.context_data)

        if not query_defs:
            return Response(
                {'message': 'No queries generated for this source type. Add queries manually.'},
                status=status.HTTP_200_OK,
            )

        created_queries = []
        for qdef in query_defs:
            query = SearchQuery.objects.create(
                session=session,
                query_text=qdef['query_text'],
                category=qdef['category'],
                is_auto_generated=qdef.get('is_auto_generated', True),
            )
            created_queries.append(query)

        serializer = SearchQuerySerializer(created_queries, many=True)
        return Response({
            'count': len(created_queries),
            'queries': serializer.data,
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def execute_all(self, request, pk=None):
        """
        Execute all unexecuted queries in the session via Google Custom Search.
        """
        session = self.get_object()
        unexecuted = session.queries.filter(executed_at__isnull=True)

        if not unexecuted.exists():
            return Response(
                {'message': 'All queries have already been executed.'},
                status=status.HTTP_200_OK,
            )

        service = GoogleSearchService()
        executed = []
        errors = []

        for query in unexecuted:
            try:
                results = service.execute_query(query)
                executed.append({
                    'query_id': str(query.id),
                    'query_text': query.query_text,
                    'results_count': len(results),
                })
            except GoogleSearchError as exc:
                logger.warning("Failed to execute query %s: %s", query.id, exc)
                errors.append({
                    'query_id': str(query.id),
                    'query_text': query.query_text,
                    'error': str(exc),
                })
                # If quota exceeded, stop processing remaining queries
                if 'quota' in str(exc).lower():
                    break

        return Response({
            'executed': executed,
            'errors': errors,
            'total_executed': len(executed),
            'total_errors': len(errors),
        })

    @action(detail=True, methods=['get'])
    def results(self, request, pk=None):
        """
        Return all SearchResults for the session, across all queries.
        """
        session = self.get_object()
        all_results = SearchResult.objects.filter(
            query__session=session
        ).select_related('query').order_by('query__category', 'position')

        # Optional filtering
        is_flagged = request.query_params.get('is_flagged')
        is_saved = request.query_params.get('is_saved')
        category = request.query_params.get('category')

        if is_flagged is not None:
            all_results = all_results.filter(is_flagged=is_flagged.lower() == 'true')
        if is_saved is not None:
            all_results = all_results.filter(is_saved=is_saved.lower() == 'true')
        if category:
            all_results = all_results.filter(query__category=category)

        serializer = SearchResultSerializer(all_results, many=True)
        return Response(serializer.data)


class SearchQueryViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Search Queries
    """
    queryset = SearchQuery.objects.all().select_related('session').prefetch_related('results')
    serializer_class = SearchQuerySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['session', 'category', 'is_auto_generated']
    ordering_fields = ['created_at', 'executed_at', 'results_count']
    ordering = ['category', 'created_at']

    @action(detail=True, methods=['post'])
    def execute(self, request, pk=None):
        """
        Execute a single query via Google Custom Search.
        """
        query = self.get_object()

        # Clear previous results to allow re-execution (e.g. after changing filters)
        if query.executed_at is not None:
            query.results.all().delete()
            query.executed_at = None
            query.results_count = 0
            query.save(update_fields=['executed_at', 'results_count'])

        service = GoogleSearchService()
        try:
            results = service.execute_query(query)
        except GoogleSearchError as exc:
            return Response(
                {'error': str(exc)},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        serializer = SearchResultSerializer(results, many=True)
        return Response({
            'query_id': str(query.id),
            'results_count': len(results),
            'results': serializer.data,
        })


class SearchResultViewSet(
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    mixins.ListModelMixin,
    viewsets.GenericViewSet,
):
    """
    ViewSet for Search Results.
    Supports retrieve, partial_update (for flagging/saving/annotating), and list.
    No create or delete by user.
    """
    queryset = SearchResult.objects.all().select_related('query', 'query__session')
    serializer_class = SearchResultSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['query', 'is_flagged', 'is_saved', 'source_domain']
    search_fields = ['title', 'snippet', 'url']
    ordering_fields = ['position', 'created_at']
    ordering = ['position']


class QuotaView(APIView):
    """
    GET returns today's Google Custom Search API quota info.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        config = GoogleSearchConfig.load()
        if config.search_mode == 'client':
            return Response({
                'used': 0,
                'limit': 0,
                'remaining': 0,
                'date': date.today().isoformat(),
                'mode': 'client',
                'unlimited': True,
            })

        service = GoogleSearchService()
        quota = service.get_quota_remaining()
        quota['mode'] = 'server'
        quota['unlimited'] = False
        serializer = QuotaSerializer(quota)
        return Response(serializer.data)


class GoogleSearchConfigView(APIView):
    """
    GET / PUT for the Google Custom Search API configuration.
    Admin-only: allows configuring API keys from the frontend admin panel.
    """
    permission_classes = [IsAuthenticated]

    def _is_admin(self, user):
        return user.is_staff or getattr(user, 'role', '') in ('admin', 'manager')

    def get(self, request):
        if not self._is_admin(request.user):
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)

        config_obj = GoogleSearchConfig.load()
        serializer = GoogleSearchConfigSerializer(config_obj)
        return Response(serializer.data)

    def put(self, request):
        if not self._is_admin(request.user):
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)

        config_obj = GoogleSearchConfig.load()
        serializer = GoogleSearchConfigSerializer(config_obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save(updated_by=request.user)

        return Response(serializer.data)

    def post(self, request):
        """Test the Google CSE connection with current config."""
        if not self._is_admin(request.user):
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)

        config_obj = GoogleSearchConfig.load()

        if config_obj.search_mode == 'client':
            return Response({
                'status': 'client_mode',
                'message': 'Client-side mode active. CX ID is configured. '
                           'Test by running a search from the Web Search page.',
            })

        service = GoogleSearchService()
        try:
            service._ensure_configured()
            result = service.search('patent analytics test', num=1)
            total_results = result.get('searchInformation', {}).get('totalResults', '0')
            return Response({
                'status': 'connected',
                'message': f'Connection successful. Found {total_results} results for test query.',
                'total_results': total_results,
            })
        except Exception as exc:
            return Response({
                'status': 'failed',
                'message': str(exc),
            }, status=status.HTTP_400_BAD_REQUEST)


# ==================== Public Config View (for client-side search) ====================

class SearchConfigPublicView(APIView):
    """
    GET: Return the search mode and CX ID for authenticated users.
    Any authenticated user needs the CX ID to execute client-side searches.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        config = GoogleSearchConfig.load()
        if not config.is_active:
            return Response({
                'search_mode': 'none',
                'search_engine_id': '',
                'is_active': False,
            })
        return Response({
            'search_mode': config.search_mode,
            'search_engine_id': config.search_engine_id if config.search_mode in ('client', 'server') else '',
            'is_active': config.is_active,
        })


# ==================== Client-Side Search Results Submission ====================

class ClientSearchResultsView(APIView):
    """
    POST: Accept search results obtained via client-side CSE JSONP
    and persist them as SearchResult objects.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ClientSearchSubmissionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        query_id = serializer.validated_data['query_id']
        results_data = serializer.validated_data['results']

        try:
            query_obj = SearchQuery.objects.select_related('session').get(pk=query_id)
        except SearchQuery.DoesNotExist:
            return Response(
                {'error': f'Query {query_id} not found'},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Verify user owns the session
        if query_obj.session.created_by != request.user:
            return Response(
                {'error': 'You do not have permission to add results to this query'},
                status=status.HTTP_403_FORBIDDEN,
            )

        # If already executed, clear old results so we can re-run
        if query_obj.executed_at is not None:
            query_obj.results.all().delete()

        created_results = []
        for item in results_data:
            result = SearchResult.objects.create(
                query=query_obj,
                title=item['title'][:1000],
                url=item['url'][:2000],
                snippet=item.get('snippet', ''),
                display_link=item.get('display_link', '') or item.get('visible_url', ''),
                source_domain=item.get('visible_url', '') or item.get('display_link', ''),
                thumbnail_url=item.get('thumbnail_url'),
                position=item['position'],
            )
            created_results.append(result)

        # Update query metadata
        query_obj.executed_at = timezone.now()
        query_obj.results_count = len(created_results)
        query_obj.save(update_fields=['executed_at', 'results_count'])

        result_serializer = SearchResultSerializer(created_results, many=True)
        return Response({
            'query_id': str(query_obj.id),
            'results_count': len(created_results),
            'results': result_serializer.data,
        }, status=status.HTTP_201_CREATED)
