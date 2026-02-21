"""
API Views for Agentic Patent Discovery System
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db.models import Q, Count, Avg
from django.utils import timezone
import json
import time

from .models import (
    AgentConfiguration,
    PatentEntityExtraction,
    PatentTriplet,
    ProcessingPipeline,
    PatentCluster,
    PatentDataset,
    PatentRecord
)

from .agentic_serializers import (
    AgentConfigurationSerializer,
    PatentEntityExtractionSerializer,
    PatentTripletSerializer,
    ProcessingPipelineSerializer,
    PatentClusterSerializer,
    DatasetSelectionSerializer,
    PipelineStartSerializer,
    TripletSearchSerializer
)


class AgentConfigurationViewSet(viewsets.ModelViewSet):
    """ViewSet for managing agent configurations"""
    
    queryset = AgentConfiguration.objects.all()
    serializer_class = AgentConfigurationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter configurations by active status and user"""
        queryset = super().get_queryset()
        
        # Filter by active status
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        # Filter by agent type
        agent_type = self.request.query_params.get('agent_type')
        if agent_type:
            queryset = queryset.filter(agent_type=agent_type)
        
        # Filter by processing profile
        profile = self.request.query_params.get('processing_profile')
        if profile:
            queryset = queryset.filter(processing_profile=profile)
        
        return queryset
    
    def perform_create(self, serializer):
        """Set the created_by field to the current user"""
        serializer.save(created_by=self.request.user)
    
    @action(detail=False, methods=['get'])
    def presets(self, request):
        """Get preset configurations for quick setup"""
        presets = {
            'quick': {
                'name': 'Quick Analysis',
                'description': 'Fast surface-level analysis',
                'processing_profile': 'quick',
                'input_source': 'abstract',
                'confidence_threshold': 0.6,
                'config_params': {
                    'entity_extraction': {
                        'min_confidence': 0.6,
                        'entity_types': ['component', 'process', 'application'],
                        'extraction_methods': ['nlp_spacy', 'dictionary']
                    },
                    'relationship_extraction': {
                        'relationship_types': ['comprises', 'includes', 'configured_to'],
                        'confidence_threshold': 0.6
                    }
                }
            },
            'deep': {
                'name': 'Deep Analysis',
                'description': 'Comprehensive analysis with all agents',
                'processing_profile': 'deep',
                'input_source': 'all',
                'confidence_threshold': 0.8,
                'config_params': {
                    'entity_extraction': {
                        'min_confidence': 0.7,
                        'entity_types': 'all',
                        'extraction_methods': ['hybrid']
                    },
                    'relationship_extraction': {
                        'relationship_types': 'all',
                        'confidence_threshold': 0.7,
                        'max_depth': 3
                    },
                    'normalization': {
                        'similarity_threshold': 0.85,
                        'use_embeddings': True
                    },
                    'clustering': {
                        'num_clusters': 'auto',
                        'algorithm': 'hierarchical'
                    }
                }
            },
            'legal': {
                'name': 'Legal Focus',
                'description': 'Focus on claims and legal aspects',
                'processing_profile': 'legal',
                'input_source': 'claims',
                'confidence_threshold': 0.9,
                'config_params': {
                    'entity_extraction': {
                        'min_confidence': 0.8,
                        'entity_types': ['component', 'system', 'method'],
                        'focus_on_claims': True
                    }
                }
            }
        }
        
        return Response(presets)


class PatentEntityExtractionViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing extracted entities"""
    
    queryset = PatentEntityExtraction.objects.all()
    serializer_class = PatentEntityExtractionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter entities by various parameters"""
        queryset = super().get_queryset()
        
        # Filter by patent record
        patent_id = self.request.query_params.get('patent_id')
        if patent_id:
            queryset = queryset.filter(patent_record__id=patent_id)
        
        # Filter by entity type
        entity_type = self.request.query_params.get('entity_type')
        if entity_type:
            queryset = queryset.filter(entity_type=entity_type)
        
        # Filter by confidence score
        min_confidence = self.request.query_params.get('min_confidence')
        if min_confidence:
            queryset = queryset.filter(confidence_score__gte=float(min_confidence))
        
        # Search by entity text
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(entity_text__icontains=search) |
                Q(normalized_form__icontains=search)
            )
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get entity extraction statistics"""
        dataset_id = request.query_params.get('dataset_id')
        
        if dataset_id:
            entities = PatentEntityExtraction.objects.filter(
                patent_record__dataset_id=dataset_id
            )
        else:
            entities = PatentEntityExtraction.objects.all()
        
        stats = {
            'total_entities': entities.count(),
            'by_type': entities.values('entity_type').annotate(
                count=Count('id'),
                avg_confidence=Avg('confidence_score')
            ),
            'by_source': entities.values('source_field').annotate(
                count=Count('id')
            ),
            'by_method': entities.values('extraction_method').annotate(
                count=Count('id')
            ),
            'confidence_distribution': {
                'high': entities.filter(confidence_score__gte=0.8).count(),
                'medium': entities.filter(
                    confidence_score__gte=0.6,
                    confidence_score__lt=0.8
                ).count(),
                'low': entities.filter(confidence_score__lt=0.6).count()
            }
        }
        
        return Response(stats)


class PatentTripletViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing patent triplets"""
    
    queryset = PatentTriplet.objects.all()
    serializer_class = PatentTripletSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter triplets by various parameters"""
        queryset = super().get_queryset()
        
        # Filter by patent record
        patent_id = self.request.query_params.get('patent_id')
        if patent_id:
            queryset = queryset.filter(patent_record__id=patent_id)
        
        # Filter by predicate
        predicate = self.request.query_params.get('predicate')
        if predicate:
            queryset = queryset.filter(predicate=predicate)
        
        # Filter by confidence score
        min_confidence = self.request.query_params.get('min_confidence')
        if min_confidence:
            queryset = queryset.filter(confidence_score__gte=float(min_confidence))
        
        # Search by entity text
        entity_search = self.request.query_params.get('entity_search')
        if entity_search:
            queryset = queryset.filter(
                Q(subject_entity__entity_text__icontains=entity_search) |
                Q(object_entity__entity_text__icontains=entity_search)
            )
        
        return queryset
    
    @action(detail=False, methods=['post'])
    def search(self, request):
        """Advanced triplet search"""
        serializer = TripletSearchSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        queryset = self.get_queryset()
        
        # Apply filters from serializer
        if serializer.validated_data.get('patent_id'):
            queryset = queryset.filter(
                patent_record__patent_id=serializer.validated_data['patent_id']
            )
        
        if serializer.validated_data.get('entity_text'):
            text = serializer.validated_data['entity_text']
            queryset = queryset.filter(
                Q(subject_entity__entity_text__icontains=text) |
                Q(object_entity__entity_text__icontains=text)
            )
        
        if serializer.validated_data.get('predicate'):
            queryset = queryset.filter(
                predicate=serializer.validated_data['predicate']
            )
        
        queryset = queryset.filter(
            confidence_score__gte=serializer.validated_data['min_confidence']
        )[:serializer.validated_data['limit']]
        
        results = PatentTripletSerializer(queryset, many=True).data
        
        return Response({
            'count': len(results),
            'results': results
        })
    
    @action(detail=False, methods=['get'])
    def graph_data(self, request):
        """Get triplets formatted for graph visualization"""
        dataset_id = request.query_params.get('dataset_id')
        
        if dataset_id:
            triplets = PatentTriplet.objects.filter(
                patent_record__dataset_id=dataset_id
            ).select_related('subject_entity', 'object_entity')[:500]
        else:
            triplets = PatentTriplet.objects.select_related(
                'subject_entity', 'object_entity'
            )[:500]
        
        # Build graph data
        nodes = {}
        edges = []
        
        for triplet in triplets:
            # Add subject node
            subject_id = str(triplet.subject_entity.id)
            if subject_id not in nodes:
                nodes[subject_id] = {
                    'id': subject_id,
                    'label': triplet.subject_entity.entity_text,
                    'type': triplet.subject_entity.entity_type,
                    'confidence': triplet.subject_entity.confidence_score
                }
            
            # Add object node
            object_id = str(triplet.object_entity.id)
            if object_id not in nodes:
                nodes[object_id] = {
                    'id': object_id,
                    'label': triplet.object_entity.entity_text,
                    'type': triplet.object_entity.entity_type,
                    'confidence': triplet.object_entity.confidence_score
                }
            
            # Add edge
            edges.append({
                'id': str(triplet.id),
                'source': subject_id,
                'target': object_id,
                'label': triplet.predicate,
                'confidence': triplet.confidence_score
            })
        
        return Response({
            'nodes': list(nodes.values()),
            'edges': edges
        })


class ProcessingPipelineViewSet(viewsets.ModelViewSet):
    """ViewSet for processing pipeline management"""
    
    queryset = ProcessingPipeline.objects.all()
    serializer_class = ProcessingPipelineSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter pipelines by various parameters"""
        queryset = super().get_queryset()
        
        # Filter by dataset
        dataset_id = self.request.query_params.get('dataset_id')
        if dataset_id:
            queryset = queryset.filter(dataset_id=dataset_id)
        
        # Filter by stage
        stage = self.request.query_params.get('stage')
        if stage:
            queryset = queryset.filter(current_stage=stage)
        
        # Filter by user
        if self.request.query_params.get('my_pipelines') == 'true':
            queryset = queryset.filter(initiated_by=self.request.user)
        
        return queryset
    
    @action(detail=False, methods=['post'])
    def start(self, request):
        """Start a new processing pipeline"""
        serializer = PipelineStartSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Get or create agent configuration
        if serializer.validated_data.get('create_default_config'):
            # Create default config based on profile with unique name
            timestamp = timezone.now().strftime('%Y%m%d_%H%M%S_%f')
            config_name = f"Auto-config {timestamp}"
            
            # Ensure uniqueness
            config, created = AgentConfiguration.objects.get_or_create(
                name=config_name,
                agent_type='entity_extraction',
                defaults={
                    'description': "Auto-generated configuration",
                    'processing_profile': serializer.validated_data['processing_profile'],
                    'input_source': serializer.validated_data['input_source'],
                    'created_by': request.user,
                    'config_params': {
                        'entity_extraction': {
                            'min_confidence': 0.7,
                            'entity_types': 'all'
                        }
                    }
                }
            )
        else:
            config = AgentConfiguration.objects.get(
                id=serializer.validated_data['agent_config_id']
            )
        
        # Create pipelines for each dataset
        pipelines = []
        for dataset_id in serializer.validated_data['dataset_ids']:
            dataset = PatentDataset.objects.get(id=dataset_id)
            
            # Create pipeline
            pipeline = ProcessingPipeline.objects.create(
                dataset=dataset,
                agent_config=config,
                total_patents=dataset.patent_records.count(),
                initiated_by=request.user,
                start_time=timezone.now()
            )
            
            # Start real processing
            from .processing.tasks import process_pipeline_sync
            
            # For development, use sync processing (in production, use Celery)
            try:
                # Start processing in background thread for demo
                import threading
                def start_processing():
                    time.sleep(1)  # Brief delay for UI feedback
                    process_pipeline_sync(str(pipeline.id))
                
                processing_thread = threading.Thread(target=start_processing)
                processing_thread.daemon = True
                processing_thread.start()
                
                pipeline.update_stage('preprocessing', 'processing', 'Starting real patent analysis...')
                
            except Exception as e:
                import traceback
                error_msg = f'Processing setup failed: {str(e)}\n{traceback.format_exc()}'
                pipeline.update_stage('preprocessing', 'failed', error_msg)
                pipeline.error_log = [error_msg]
                pipeline.save()
            
            pipelines.append(pipeline)
        
        # Return created pipelines
        return Response(
            ProcessingPipelineSerializer(pipelines, many=True).data,
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel a running pipeline"""
        pipeline = self.get_object()
        
        if pipeline.current_stage in ['completed', 'failed']:
            return Response(
                {'error': 'Cannot cancel completed or failed pipeline'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        pipeline.current_stage = 'failed'
        pipeline.end_time = timezone.now()
        pipeline.error_log.append({
            'timestamp': timezone.now().isoformat(),
            'error': 'Pipeline cancelled by user',
            'user': request.user.username
        })
        pipeline.save()
        
        return Response({'status': 'Pipeline cancelled'})
    
    @action(detail=True, methods=['get'])
    def results(self, request, pk=None):
        """Get pipeline processing results"""
        pipeline = self.get_object()
        
        # Get entities and triplets for this pipeline's dataset
        entities = PatentEntityExtraction.objects.filter(
            patent_record__dataset=pipeline.dataset
        )
        triplets = PatentTriplet.objects.filter(
            patent_record__dataset=pipeline.dataset
        )
        clusters = PatentCluster.objects.filter(pipeline=pipeline)
        
        results = {
            'pipeline': ProcessingPipelineSerializer(pipeline).data,
            'statistics': {
                'total_entities': entities.count(),
                'unique_entities': entities.values('normalized_form').distinct().count(),
                'total_triplets': triplets.count(),
                'unique_relationships': triplets.values('predicate').distinct().count(),
                'clusters_found': clusters.count()
            },
            'top_entities': list(
                entities.values('entity_text', 'entity_type')
                .annotate(count=Count('id'))
                .order_by('-count')[:10]
            ),
            'top_relationships': list(
                triplets.values('predicate')
                .annotate(count=Count('id'))
                .order_by('-count')[:10]
            ),
            'clusters': PatentClusterSerializer(clusters[:5], many=True).data
        }
        
        return Response(results)
    
    @action(detail=True, methods=['get'])
    def export(self, request, pk=None):
        """Export pipeline results in various formats"""
        pipeline = self.get_object()
        format_type = request.query_params.get('format', 'json')
        
        from .processing.exporters import create_exporter
        
        exporter = create_exporter(str(pipeline.id))
        if not exporter:
            return Response(
                {'error': 'Pipeline not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        try:
            if format_type == 'csv':
                return exporter.export_csv()
            elif format_type == 'excel':
                return exporter.export_excel()
            else:  # default to json
                return exporter.export_json()
                
        except Exception as e:
            return Response(
                {'error': f'Export failed: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PatentClusterViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing patent clusters"""
    
    queryset = PatentCluster.objects.all()
    serializer_class = PatentClusterSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter clusters by pipeline"""
        queryset = super().get_queryset()
        
        pipeline_id = self.request.query_params.get('pipeline_id')
        if pipeline_id:
            queryset = queryset.filter(pipeline_id=pipeline_id)
        
        cluster_type = self.request.query_params.get('cluster_type')
        if cluster_type:
            queryset = queryset.filter(cluster_type=cluster_type)
        
        return queryset


class ClassifierDatasetsViewSet(viewsets.ViewSet):
    """ViewSet for managing datasets in the classifier tab"""
    
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def available(self, request):
        """Get available datasets for classification"""
        project_id = request.query_params.get('project_id')
        
        if project_id:
            datasets = PatentDataset.objects.filter(
                project_id=project_id,
                processing_status='completed'
            )
        else:
            datasets = PatentDataset.objects.filter(
                processing_status='completed'
            )
        
        data = []
        for dataset in datasets:
            data.append({
                'id': dataset.id,
                'name': dataset.name,
                'description': dataset.description,
                'total_patents': dataset.total_patents,
                'created_at': dataset.created_at,
                'has_been_processed': dataset.processing_pipelines.exists(),
                'last_processed': dataset.processing_pipelines.order_by(
                    '-created_at'
                ).first().created_at if dataset.processing_pipelines.exists() else None
            })
        
        return Response(data)
    
    @action(detail=False, methods=['post'])
    def select(self, request):
        """Select datasets for processing"""
        serializer = DatasetSelectionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        datasets = PatentDataset.objects.filter(
            id__in=serializer.validated_data['dataset_ids']
        )
        
        # Mark datasets as selected (convert UUIDs to strings for JSON serialization)
        selected_info = {
            'dataset_ids': [str(id) for id in serializer.validated_data['dataset_ids']],
            'merge': serializer.validated_data['merge_datasets'],
            'total_patents': sum(d.total_patents for d in datasets),
            'datasets': [
                {
                    'id': str(d.id),
                    'name': d.name,
                    'patent_count': d.total_patents
                }
                for d in datasets
            ]
        }
        
        # Store in session for later use (with string UUIDs)
        request.session['selected_datasets'] = selected_info
        
        return Response(selected_info)