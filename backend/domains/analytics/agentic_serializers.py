"""
Serializers for Agentic Patent Discovery System
"""

from rest_framework import serializers
from .models import (
    AgentConfiguration,
    PatentEntityExtraction,
    PatentTriplet,
    ProcessingPipeline,
    PatentCluster,
    PatentDataset,
    PatentRecord
)


class AgentConfigurationSerializer(serializers.ModelSerializer):
    """Serializer for agent configuration"""
    
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    
    class Meta:
        model = AgentConfiguration
        fields = [
            'id', 'name', 'description', 'agent_type', 'input_source',
            'processing_profile', 'config_params', 'confidence_threshold',
            'is_active', 'created_by', 'created_by_name', 
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate_config_params(self, value):
        """Validate agent-specific configuration parameters"""
        agent_type = self.initial_data.get('agent_type')
        
        # Define required params for each agent type
        required_params = {
            'entity_extraction': ['min_confidence', 'entity_types'],
            'relationship_extraction': ['relationship_types', 'confidence_threshold'],
            'normalization': ['similarity_threshold'],
            'graph_builder': ['node_importance_algorithm'],
            'clustering': ['num_clusters', 'algorithm']
        }
        
        if agent_type in required_params:
            for param in required_params[agent_type]:
                if param not in value:
                    raise serializers.ValidationError(
                        f"Missing required parameter '{param}' for {agent_type}"
                    )
        
        return value


class PatentEntityExtractionSerializer(serializers.ModelSerializer):
    """Serializer for extracted patent entities"""
    
    patent_id = serializers.CharField(source='patent_record.patent_id', read_only=True)
    
    class Meta:
        model = PatentEntityExtraction
        fields = [
            'id', 'patent_record', 'patent_id', 'entity_text', 'entity_type',
            'normalized_form', 'source_field', 'source_text', 'position_start',
            'position_end', 'confidence_score', 'extraction_method',
            'extraction_agent', 'attributes', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class PatentTripletSerializer(serializers.ModelSerializer):
    """Serializer for patent triplets"""
    
    subject_text = serializers.CharField(source='subject_entity.entity_text', read_only=True)
    subject_type = serializers.CharField(source='subject_entity.entity_type', read_only=True)
    object_text = serializers.CharField(source='object_entity.entity_text', read_only=True)
    object_type = serializers.CharField(source='object_entity.entity_type', read_only=True)
    patent_id = serializers.CharField(source='patent_record.patent_id', read_only=True)
    
    class Meta:
        model = PatentTriplet
        fields = [
            'id', 'patent_record', 'patent_id', 'subject_entity', 'subject_text',
            'subject_type', 'predicate', 'object_entity', 'object_text',
            'object_type', 'source_sentence', 'confidence_score',
            'extraction_agent', 'extraction_method', 'context', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
    
    def to_representation(self, instance):
        """Custom representation for frontend display"""
        data = super().to_representation(instance)
        # Add formatted triplet string
        data['triplet_display'] = f"{data['subject_text']} -> {data['predicate']} -> {data['object_text']}"
        return data


class ProcessingPipelineSerializer(serializers.ModelSerializer):
    """Serializer for processing pipeline tracking"""
    
    dataset_name = serializers.CharField(source='dataset.name', read_only=True)
    config_name = serializers.CharField(source='agent_config.name', read_only=True, allow_null=True)
    progress_percentage = serializers.IntegerField(read_only=True)
    initiated_by_name = serializers.CharField(source='initiated_by.username', read_only=True)
    
    class Meta:
        model = ProcessingPipeline
        fields = [
            'id', 'dataset', 'dataset_name', 'agent_config', 'config_name',
            'current_stage', 'stage_status', 'total_patents', 'processed_patents',
            'failed_patents', 'total_entities', 'total_triplets',
            'unique_relationships', 'start_time', 'end_time',
            'processing_time_seconds', 'error_log', 'progress_percentage',
            'initiated_by', 'initiated_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'created_at', 'updated_at', 'progress_percentage',
            'processing_time_seconds'
        ]


class PatentClusterSerializer(serializers.ModelSerializer):
    """Serializer for patent clusters"""
    
    pipeline_id = serializers.UUIDField(source='pipeline.id', read_only=True)
    
    class Meta:
        model = PatentCluster
        fields = [
            'id', 'pipeline', 'pipeline_id', 'cluster_name', 'cluster_type',
            'description', 'patent_count', 'coherence_score', 'key_entities',
            'key_relationships', 'representative_patents', 'centroid',
            'visualization_data', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class DatasetSelectionSerializer(serializers.Serializer):
    """Serializer for dataset selection in classifier"""
    
    dataset_ids = serializers.ListField(
        child=serializers.UUIDField(),
        min_length=1,
        help_text="List of dataset IDs to process"
    )
    merge_datasets = serializers.BooleanField(
        default=False,
        help_text="Whether to merge datasets before processing"
    )
    
    def validate_dataset_ids(self, value):
        """Validate that all dataset IDs exist"""
        existing_ids = set(
            PatentDataset.objects.filter(
                id__in=value
            ).values_list('id', flat=True)
        )
        
        invalid_ids = [str(id) for id in value if id not in existing_ids]
        if invalid_ids:
            raise serializers.ValidationError(
                f"Invalid dataset IDs: {', '.join(invalid_ids)}"
            )
        
        return value


class PipelineStartSerializer(serializers.Serializer):
    """Serializer for starting a processing pipeline"""
    
    dataset_ids = serializers.ListField(
        child=serializers.UUIDField(),
        min_length=1
    )
    agent_config_id = serializers.UUIDField(required=False, allow_null=True)
    processing_profile = serializers.ChoiceField(
        choices=AgentConfiguration.PROCESSING_PROFILES,
        default='standard'
    )
    input_source = serializers.ChoiceField(
        choices=AgentConfiguration.INPUT_SOURCES,
        default='all'
    )
    
    def validate(self, data):
        """Validate pipeline start parameters"""
        if not data.get('agent_config_id'):
            # If no config provided, we'll create a default one
            data['create_default_config'] = True
        else:
            # Validate config exists
            try:
                AgentConfiguration.objects.get(id=data['agent_config_id'])
            except AgentConfiguration.DoesNotExist:
                raise serializers.ValidationError(
                    "Invalid agent configuration ID"
                )
        
        return data


class TripletSearchSerializer(serializers.Serializer):
    """Serializer for searching triplets"""
    
    patent_id = serializers.CharField(required=False)
    entity_text = serializers.CharField(required=False)
    predicate = serializers.CharField(required=False)
    min_confidence = serializers.FloatField(default=0.5, min_value=0, max_value=1)
    limit = serializers.IntegerField(default=100, min_value=1, max_value=1000)


class PipelineStatusSerializer(serializers.Serializer):
    """Serializer for pipeline status updates (WebSocket)"""
    
    pipeline_id = serializers.UUIDField()
    stage = serializers.CharField()
    status = serializers.CharField()
    progress = serializers.IntegerField()
    message = serializers.CharField(allow_blank=True)
    patent_id = serializers.CharField(required=False)
    entities_found = serializers.IntegerField(required=False)
    triplets_found = serializers.IntegerField(required=False)
    timestamp = serializers.DateTimeField()