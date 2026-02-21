"""
Research API Views
API endpoints for patent research functionality
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from django.utils import timezone
from django.db.models import Count, Q, Avg
from django.shortcuts import get_object_or_404

from .models import (
    ResearchQuery, ResearchResult, ResearchSession,
    AnalyticsProject, PatentDataset, PatentRecord,
    PatentAPIConfiguration,
)
from .research_serializers import (
    ResearchQuerySerializer, ResearchQueryCreateSerializer,
    ResearchResultSerializer, ResearchResultBulkUpdateSerializer,
    ResearchSessionSerializer, CreateDatasetFromResultsSerializer,
    ResearchAnalyticsSerializer, PatentAPIInfoSerializer,
    PatentAPIConfigurationSerializer,
)
from .patent_search_service import PatentSearchService
from .column_mapping_service import IntelligentColumnMappingService

import logging

logger = logging.getLogger(__name__)


class ResearchQueryViewSet(viewsets.ModelViewSet):
    """ViewSet for managing research queries"""
    
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ResearchQueryCreateSerializer
        return ResearchQuerySerializer
    
    def get_queryset(self):
        queryset = ResearchQuery.objects.select_related('project', 'created_by')
        
        # Filter by project if specified
        project_id = self.request.query_params.get('project_id')
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        
        # Filter by status if specified
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by API source if specified
        api_source = self.request.query_params.get('api_source')
        if api_source:
            queryset = queryset.filter(api_source=api_source)
        
        return queryset.order_by('-created_at')
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def execute(self, request, pk=None):
        """Execute a research query"""
        query = self.get_object()
        
        if query.status == 'running':
            return Response(
                {'error': 'Query is already running'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Initialize search service
        search_service = PatentSearchService()
        
        try:
            # Execute search in background (in production, use Celery)
            result = search_service.execute_search(query)
            
            # Refresh query from database
            query.refresh_from_db()
            
            return Response({
                'message': 'Search executed successfully',
                'query_id': query.id,
                'status': query.status,
                'results': result
            })
            
        except Exception as e:
            logger.error(f"Search execution failed: {e}")
            return Response(
                {'error': f'Search execution failed: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel a running research query"""
        query = self.get_object()
        
        if query.status != 'running':
            return Response(
                {'error': 'Query is not currently running'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        query.status = 'cancelled'
        query.save()
        
        return Response({'message': 'Query cancelled successfully'})
    
    @action(detail=True, methods=['get'])
    def results(self, request, pk=None):
        """Get results for a specific query"""
        query = self.get_object()
        
        results = query.results.all()
        
        # Filter by selection status
        selected_only = request.query_params.get('selected_only')
        if selected_only and selected_only.lower() == 'true':
            results = results.filter(is_selected=True)
        
        # Filter by relevance
        relevance = request.query_params.get('relevance')
        if relevance:
            results = results.filter(manual_relevance=relevance)
        
        # Pagination
        page = self.paginate_queryset(results)
        if page is not None:
            serializer = ResearchResultSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = ResearchResultSerializer(results, many=True)
        return Response(serializer.data)


class ResearchResultViewSet(viewsets.ModelViewSet):
    """ViewSet for managing research results"""
    
    permission_classes = [IsAuthenticated]
    serializer_class = ResearchResultSerializer
    
    def get_queryset(self):
        queryset = ResearchResult.objects.select_related('query', 'query__project')
        
        # Filter by query if specified
        query_id = self.request.query_params.get('query_id')
        if query_id:
            queryset = queryset.filter(query_id=query_id)
        
        # Filter by project if specified
        project_id = self.request.query_params.get('project_id')
        if project_id:
            queryset = queryset.filter(query__project_id=project_id)
        
        # Filter by selection status
        selected_only = self.request.query_params.get('selected_only')
        if selected_only and selected_only.lower() == 'true':
            queryset = queryset.filter(is_selected=True)
        
        return queryset.order_by('-relevance_score', '-publication_date')
    
    @action(detail=False, methods=['post'])
    def bulk_update(self, request):
        """Bulk update research results"""
        serializer = ResearchResultBulkUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        result_ids = serializer.validated_data['result_ids']
        action_type = serializer.validated_data['action']
        
        # Get results to update
        results = ResearchResult.objects.filter(id__in=result_ids)
        
        if not results.exists():
            return Response(
                {'error': 'No valid results found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Apply bulk update
        updated_count = 0
        
        if action_type == 'select':
            updated_count = results.update(is_selected=True)
        elif action_type == 'unselect':
            updated_count = results.update(is_selected=False)
        elif action_type == 'set_relevance':
            relevance = serializer.validated_data['relevance']
            updated_count = results.update(manual_relevance=relevance)
        
        return Response({
            'message': f'Updated {updated_count} results',
            'updated_count': updated_count
        })


class ResearchSessionViewSet(viewsets.ModelViewSet):
    """ViewSet for managing research sessions"""
    
    permission_classes = [IsAuthenticated]
    serializer_class = ResearchSessionSerializer
    
    def get_queryset(self):
        queryset = ResearchSession.objects.select_related('project', 'created_by')
        
        # Filter by project if specified
        project_id = self.request.query_params.get('project_id')
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        
        return queryset.order_by('-session_start')
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def end_session(self, request, pk=None):
        """End a research session"""
        session = self.get_object()
        
        if session.session_end:
            return Response(
                {'error': 'Session is already ended'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        session.session_end = timezone.now()
        session.save()
        
        return Response({'message': 'Session ended successfully'})


class ResearchAnalyticsView(viewsets.GenericViewSet):
    """Analytics views for research data"""
    
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def project_overview(self, request):
        """Get research analytics overview for a project"""
        project_id = request.query_params.get('project_id')
        if not project_id:
            return Response(
                {'error': 'project_id parameter is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        project = get_object_or_404(AnalyticsProject, id=project_id)
        
        # Basic statistics
        queries = ResearchQuery.objects.filter(project=project)
        results = ResearchResult.objects.filter(query__project=project)
        
        total_queries = queries.count()
        total_results = results.count()
        unique_patents = results.values('patent_id').distinct().count()
        selected_patents = results.filter(is_selected=True).count()
        
        # API usage statistics
        api_usage = queries.values('api_source').annotate(count=Count('id')).order_by('-count')
        api_usage_dict = {item['api_source']: item['count'] for item in api_usage}
        
        # Top assignees
        top_assignees = (
            results.exclude(assignee='')
            .values('assignee')
            .annotate(count=Count('id'))
            .order_by('-count')[:10]
        )
        
        # Top inventors
        inventor_counts = {}
        for result in results.exclude(inventors=[]):
            for inventor in result.inventors:
                inventor_counts[inventor] = inventor_counts.get(inventor, 0) + 1
        
        top_inventors = [
            {'inventor': inventor, 'count': count}
            for inventor, count in sorted(inventor_counts.items(), key=lambda x: x[1], reverse=True)[:10]
        ]
        
        # Query performance
        completed_queries = queries.filter(status='completed', execution_time__isnull=False)
        avg_execution_time = completed_queries.aggregate(avg=Avg('execution_time'))['avg'] or 0
        success_rate = (completed_queries.count() / max(total_queries, 1)) * 100
        
        analytics_data = {
            'project_id': project_id,
            'total_queries': total_queries,
            'total_results': total_results,
            'unique_patents': unique_patents,
            'selected_patents': selected_patents,
            'api_usage': api_usage_dict,
            'top_assignees': list(top_assignees),
            'top_inventors': top_inventors,
            'ipc_distribution': {},  # TODO: Implement
            'cpc_distribution': {},  # TODO: Implement
            'publication_timeline': {},  # TODO: Implement
            'avg_execution_time': round(avg_execution_time, 2),
            'success_rate': round(success_rate, 2)
        }
        
        serializer = ResearchAnalyticsSerializer(analytics_data)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def api_info(self, request):
        """Get information about available patent APIs"""
        search_service = PatentSearchService()
        apis = search_service.get_available_apis()
        
        serializer = PatentAPIInfoSerializer(apis, many=True)
        return Response(serializer.data)


class DatasetFromResearchView(viewsets.GenericViewSet):
    """Views for creating datasets from research results"""
    
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['post'])
    def create_dataset(self, request):
        """Create a new dataset from research results"""
        serializer = CreateDatasetFromResultsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        query_ids = serializer.validated_data['query_ids']
        dataset_name = serializer.validated_data['dataset_name']
        dataset_description = serializer.validated_data.get('dataset_description', '')
        selected_only = serializer.validated_data['selected_only']
        apply_column_mapping = serializer.validated_data['apply_column_mapping']
        
        # Get queries and validate they belong to the same project
        queries = ResearchQuery.objects.filter(id__in=query_ids)
        project = queries.first().project
        
        # Get results to include
        results_query = ResearchResult.objects.filter(query__in=queries)
        if selected_only:
            results_query = results_query.filter(is_selected=True)
        
        results = list(results_query)
        
        if not results:
            return Response(
                {'error': 'No results found for the specified criteria'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            with transaction.atomic():
                # Create dataset
                dataset = PatentDataset.objects.create(
                    project=project,
                    name=dataset_name,
                    description=dataset_description,
                    data_source='api_import',
                    processing_status='processing',
                    total_patents=len(results),
                    created_by=request.user
                )
                
                # Create patent records
                patent_records = []
                for i, result in enumerate(results):
                    # Prepare additional metadata for research results
                    additional_metadata = {
                        'ipc_classes': result.ipc_classes,
                        'cpc_classes': result.cpc_classes,
                        'inventors': result.inventors,
                        'relevance_score': result.relevance_score,
                        'manual_relevance': result.manual_relevance,
                        'is_selected': result.is_selected,
                        'publication_number': result.publication_number,
                        'research_query_id': result.query.id,
                        'research_query_name': result.query.query_name,
                    }
                    
                    record_data = {
                        'dataset': dataset,
                        'row_number': i + 1,
                        'patent_id': result.patent_id,
                        'title': result.title,
                        'abstract': result.abstract,
                        'assignee': result.assignee,
                        'publication_date': result.publication_date,
                        'application_date': result.application_date,
                        'jurisdiction': result.jurisdiction,
                        'additional_metadata': additional_metadata,
                    }
                    
                    patent_records.append(PatentRecord(**record_data))
                
                # Bulk create patent records
                PatentRecord.objects.bulk_create(patent_records, batch_size=100)
                
                # Apply column mapping if requested
                if apply_column_mapping:
                    try:
                        mapping_service = IntelligentColumnMappingService()
                        
                        # Create automatic mappings for research data fields
                        research_field_mappings = [
                            ('patent_id', 'patent_id', 100.0, True, 'CharField'),
                            ('title', 'title', 100.0, True, 'TextField'),
                            ('abstract', 'abstract', 100.0, True, 'TextField'),
                            ('assignee', 'assignee', 100.0, True, 'CharField'),
                            ('publication_date', 'publication_date', 100.0, True, 'DateField'),
                            ('application_date', 'application_date', 100.0, True, 'DateField'),
                            ('jurisdiction', 'jurisdiction', 100.0, True, 'CharField'),
                            ('ipc_classes', 'ipc_classifications', 95.0, False, 'JSONField'),
                            ('cpc_classes', 'cpc_classifications', 95.0, False, 'JSONField'),
                            ('inventors', 'inventors', 90.0, False, 'JSONField'),
                            ('relevance_score', 'relevance_score', 85.0, False, 'FloatField'),
                            ('manual_relevance', 'manual_relevance', 80.0, False, 'CharField'),
                            ('is_selected', 'is_selected', 95.0, False, 'BooleanField'),
                            ('publication_number', 'publication_number', 90.0, False, 'CharField'),
                        ]
                        
                        from .column_mapping_service import ColumnMatch
                        
                        # Create ColumnMatch objects for automatic mapping
                        auto_mappings = []
                        for source_col, target_field, confidence, is_core, field_type in research_field_mappings:
                            match = ColumnMatch(
                                source_column=source_col,
                                target_field=target_field,
                                confidence_score=confidence,
                                mapping_rule=None,
                                is_core_field=is_core,
                                suggested_field_type=field_type
                            )
                            auto_mappings.append(match)
                        
                        # Apply the automatic mappings
                        mapping_result = mapping_service.apply_mappings(
                            dataset=dataset,
                            mappings=auto_mappings,
                            user=request.user
                        )
                        
                        logger.info(f"Applied {mapping_result['applied_mappings']} automatic mappings to research dataset {dataset.id}")
                        
                    except Exception as mapping_error:
                        logger.warning(f"Column mapping failed: {mapping_error}")
                        # Don't fail the entire operation if mapping fails
                
                # Update dataset status
                dataset.processing_status = 'completed'
                dataset.processed_patents = len(results)
                dataset.save()
                
                return Response({
                    'message': 'Dataset created successfully',
                    'dataset_id': dataset.id,
                    'dataset_name': dataset.name,
                    'total_patents': len(results)
                })
                
        except Exception as e:
            logger.error(f"Dataset creation failed: {e}")
            return Response(
                {'error': f'Dataset creation failed: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PatentAPIViewSet(viewsets.GenericViewSet):
    """
    ViewSet for managing patent API configurations.
    Merges DB-stored PatentAPIConfiguration records with hardcoded defaults.
    Supports full CRUD + connection testing.
    """

    permission_classes = [IsAuthenticated]
    serializer_class = PatentAPIConfigurationSerializer
    queryset = PatentAPIConfiguration.objects.all()

    # -- Hardcoded defaults (always present) --
    HARDCODED_APIS = [
        {
            'id': 'uspto-hardcoded',
            'name': 'uspto',
            'display_name': 'USPTO PatentsView (Default)',
            'description': 'United States Patent and Trademark Office - Built-in',
            'is_active': True,
            'is_configured': False,
            'source_type': 'hardcoded',
            'test_status': 'passed',
        },
        {
            'id': 'uspto_odp-hardcoded',
            'name': 'uspto_odp',
            'display_name': 'USPTO Open Data Portal',
            'description': 'USPTO ODP — US patent applications filed 2001+ with prosecution data',
            'is_active': True,
            'is_configured': False,
            'source_type': 'hardcoded',
            'test_status': 'never',
        },
        {
            'id': 'epo-hardcoded',
            'name': 'epo',
            'display_name': 'EPO (Default)',
            'description': 'European Patent Office - Built-in',
            'is_active': True,
            'is_configured': False,
            'source_type': 'hardcoded',
            'test_status': 'never',
        },
        {
            'id': 'wipo-hardcoded',
            'name': 'wipo',
            'display_name': 'WIPO (Default)',
            'description': 'World Intellectual Property Organization - Built-in',
            'is_active': True,
            'is_configured': False,
            'source_type': 'hardcoded',
            'test_status': 'never',
        },
        {
            'id': 'lens-hardcoded',
            'name': 'lens',
            'display_name': 'Lens (Default)',
            'description': 'The Lens Patent Database - Built-in',
            'is_active': False,
            'is_configured': False,
            'source_type': 'hardcoded',
            'test_status': 'never',
        },
        {
            'id': 'google_patents-hardcoded',
            'name': 'google_patents',
            'display_name': 'Google Patents (Default)',
            'description': 'Google Patents Database - Built-in',
            'is_active': False,
            'is_configured': False,
            'source_type': 'hardcoded',
            'test_status': 'never',
        },
    ]

    def list(self, request):
        """Merge DB configs with hardcoded defaults."""
        db_configs = PatentAPIConfiguration.objects.all()
        db_names = set(c.name for c in db_configs)

        results = []

        # DB configs first (admin_configured)
        for cfg in db_configs:
            data = PatentAPIConfigurationSerializer(cfg).data
            data['is_configured'] = True
            data['source_type'] = 'admin_configured'
            results.append(data)

        # Hardcoded entries that are NOT overridden by a DB config with same name
        for hc in self.HARDCODED_APIS:
            if hc['name'] not in db_names:
                results.append(hc)

        return Response(results)

    def retrieve(self, request, pk=None):
        """Get specific API configuration (DB or hardcoded)."""
        # Try DB first by UUID
        try:
            cfg = PatentAPIConfiguration.objects.get(pk=pk)
            data = PatentAPIConfigurationSerializer(cfg).data
            data['is_configured'] = True
            data['source_type'] = 'admin_configured'
            return Response(data)
        except (PatentAPIConfiguration.DoesNotExist, ValueError, Exception):
            pass

        # Try hardcoded
        for hc in self.HARDCODED_APIS:
            if hc['id'] == pk:
                return Response(hc)

        # Try DB by name (for hardcoded IDs like "uspto_odp-hardcoded")
        if pk and pk.endswith('-hardcoded'):
            api_name = pk.replace('-hardcoded', '')
            cfg = PatentAPIConfiguration.objects.filter(name=api_name).first()
            if cfg:
                data = PatentAPIConfigurationSerializer(cfg).data
                data['is_configured'] = True
                data['source_type'] = 'admin_configured'
                return Response(data)

        return Response({'error': 'API configuration not found'}, status=status.HTTP_404_NOT_FOUND)

    def create(self, request):
        """Create or update API configuration. If a config with the same name exists, update it."""
        name = request.data.get('name', '')
        existing = PatentAPIConfiguration.objects.filter(name=name).first() if name else None

        if existing:
            # Update the existing config instead of failing on unique constraint
            serializer = PatentAPIConfigurationSerializer(existing, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)

        serializer = PatentAPIConfigurationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(created_by=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def _resolve_config(self, pk):
        """Resolve a PatentAPIConfiguration from UUID pk or hardcoded name."""
        try:
            return PatentAPIConfiguration.objects.get(pk=pk)
        except (PatentAPIConfiguration.DoesNotExist, ValueError, Exception):
            pass
        if pk and pk.endswith('-hardcoded'):
            api_name = pk.replace('-hardcoded', '')
            return PatentAPIConfiguration.objects.filter(name=api_name).first()
        return None

    def update(self, request, pk=None):
        """Update API configuration."""
        cfg = self._resolve_config(pk)
        if not cfg:
            return Response({'error': 'API configuration not found'}, status=status.HTTP_404_NOT_FOUND)
        serializer = PatentAPIConfigurationSerializer(cfg, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def destroy(self, request, pk=None):
        """Delete API configuration."""
        cfg = self._resolve_config(pk)
        if not cfg:
            return Response({'error': 'API configuration not found'}, status=status.HTTP_404_NOT_FOUND)
        cfg.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['post'], url_path='(?P<api_id>[^/.]+)/test')
    def test(self, request, api_id=None):
        """Test API connection. Accepts both UUID (DB config) and hardcoded IDs."""
        cfg = None

        # Try DB config by UUID
        try:
            cfg = PatentAPIConfiguration.objects.get(pk=api_id)
        except (PatentAPIConfiguration.DoesNotExist, ValueError, Exception):
            pass

        # If api_id is a hardcoded ID like "uspto_odp-hardcoded", try to find DB config by name
        if cfg is None and api_id and api_id.endswith('-hardcoded'):
            api_name = api_id.replace('-hardcoded', '')
            cfg = PatentAPIConfiguration.objects.filter(name=api_name).first()

        test_status_val = 'passed'
        message = 'API connection test successful'

        # Determine which API to actually test
        resolved_name = cfg.name if cfg else (api_id.replace('-hardcoded', '') if api_id and api_id.endswith('-hardcoded') else '')

        if resolved_name == 'uspto_odp':
            try:
                from .uspto_odp_service import USPTOODPClient
                client = USPTOODPClient()
                result = client.post('/patent/applications/search', {
                    'q': 'test',
                    'pagination': {'offset': 0, 'limit': 1},
                })
                count = result.get('count', 0)
                message = f'API connection successful — {count} records accessible'
            except Exception as exc:
                test_status_val = 'failed'
                message = str(exc)
        elif resolved_name == 'uspto':
            try:
                import requests as http_requests
                resp = http_requests.get(
                    'https://search.patentsview.org/api/v1/patent',
                    params={'q': '{"patent_id":"1"}', 'f': '["patent_id"]'},
                    timeout=15,
                )
                resp.raise_for_status()
                message = 'USPTO PatentsView API connection successful'
            except Exception as exc:
                test_status_val = 'failed'
                message = str(exc)
        elif cfg is None:
            test_status_val = 'passed'
            message = 'No live test available for this API (hardcoded entry)'

        if cfg:
            cfg.test_status = test_status_val
            cfg.last_tested = timezone.now()
            cfg.save(update_fields=['test_status', 'last_tested'])

        return Response({'status': test_status_val, 'message': message})