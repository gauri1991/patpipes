"""
Research API Serializers
Serializers for patent research functionality
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model

from .models import ResearchQuery, ResearchResult, ResearchSession, AnalyticsProject, PatentAPIConfiguration

User = get_user_model()


class UserBasicSerializer(serializers.ModelSerializer):
    """Basic user info for research objects"""
    
    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'email']


class ResearchQuerySerializer(serializers.ModelSerializer):
    """Serializer for ResearchQuery model"""
    
    created_by = UserBasicSerializer(read_only=True)
    results_count = serializers.SerializerMethodField()
    selected_results_count = serializers.SerializerMethodField()
    
    class Meta:
        model = ResearchQuery
        fields = [
            'id', 'project', 'query_name', 'description', 'api_source',
            'keywords', 'ipc_classes', 'cpc_classes', 'assignees', 'inventors',
            'date_range', 'geographic_scope', 'additional_filters',
            'status', 'total_results', 'processed_results', 'execution_time',
            'error_message', 'retry_count', 'last_executed_at',
            'created_by', 'created_at', 'updated_at',
            'results_count', 'selected_results_count'
        ]
        read_only_fields = [
            'total_results', 'processed_results', 'execution_time',
            'error_message', 'retry_count', 'last_executed_at',
            'created_by', 'created_at', 'updated_at'
        ]
    
    def get_results_count(self, obj):
        return obj.results.count()
    
    def get_selected_results_count(self, obj):
        return obj.results.filter(is_selected=True).count()


class ResearchQueryCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating research queries"""
    
    class Meta:
        model = ResearchQuery
        fields = [
            'project', 'query_name', 'description', 'api_source',
            'keywords', 'ipc_classes', 'cpc_classes', 'assignees', 'inventors',
            'date_range', 'geographic_scope', 'additional_filters'
        ]
    
    def validate(self, data):
        """Validate that at least one search criteria is provided"""
        criteria_fields = ['keywords', 'assignees', 'inventors', 'ipc_classes', 'cpc_classes']
        has_criteria = any(
            data.get(field) for field in criteria_fields
        )
        
        if not has_criteria:
            raise serializers.ValidationError(
                "At least one search criteria must be provided (keywords, assignees, inventors, or classifications)."
            )
        
        return data


class ResearchResultSerializer(serializers.ModelSerializer):
    """Serializer for ResearchResult model"""
    
    class Meta:
        model = ResearchResult
        fields = [
            'id', 'query', 'patent_id', 'publication_number', 'application_number',
            'title', 'abstract', 'assignee', 'inventors',
            'ipc_classes', 'cpc_classes', 'publication_date', 'application_date',
            'priority_date', 'jurisdiction', 'relevance_score', 'manual_relevance',
            'is_selected', 'processed_at'
        ]
        read_only_fields = ['processed_at']


class ResearchResultBulkUpdateSerializer(serializers.Serializer):
    """Serializer for bulk updating research results"""
    
    result_ids = serializers.ListField(
        child=serializers.UUIDField(),
        allow_empty=False
    )
    action = serializers.ChoiceField(
        choices=['select', 'unselect', 'set_relevance'],
        required=True
    )
    relevance = serializers.ChoiceField(
        choices=ResearchResult.RELEVANCE_CHOICES,
        required=False
    )
    
    def validate(self, data):
        if data['action'] == 'set_relevance' and not data.get('relevance'):
            raise serializers.ValidationError(
                "Relevance field is required when action is 'set_relevance'"
            )
        return data


class ResearchSessionSerializer(serializers.ModelSerializer):
    """Serializer for ResearchSession model"""
    
    created_by = UserBasicSerializer(read_only=True)
    queries = ResearchQuerySerializer(many=True, read_only=True, source='research_queries')
    
    class Meta:
        model = ResearchSession
        fields = [
            'id', 'project', 'name', 'description',
            'total_queries', 'total_results', 'unique_patents',
            'session_start', 'session_end', 'created_by', 'queries'
        ]
        read_only_fields = [
            'total_queries', 'total_results', 'unique_patents',
            'session_start', 'session_end', 'created_by'
        ]


class CreateDatasetFromResultsSerializer(serializers.Serializer):
    """Serializer for creating datasets from research results"""
    
    query_ids = serializers.ListField(
        child=serializers.UUIDField(),
        allow_empty=False,
        help_text="List of research query IDs to include"
    )
    dataset_name = serializers.CharField(
        max_length=255,
        help_text="Name for the new dataset"
    )
    dataset_description = serializers.CharField(
        required=False,
        allow_blank=True,
        help_text="Description for the new dataset"
    )
    selected_only = serializers.BooleanField(
        default=True,
        help_text="Include only selected results (True) or all results (False)"
    )
    apply_column_mapping = serializers.BooleanField(
        default=True,
        help_text="Apply intelligent column mapping rules to the dataset"
    )
    
    def validate_query_ids(self, value):
        """Validate that all query IDs exist and belong to the same project"""
        queries = ResearchQuery.objects.filter(id__in=value)
        
        if queries.count() != len(value):
            raise serializers.ValidationError("One or more query IDs are invalid")
        
        projects = set(query.project_id for query in queries)
        if len(projects) > 1:
            raise serializers.ValidationError("All queries must belong to the same project")
        
        return value


class ResearchAnalyticsSerializer(serializers.Serializer):
    """Serializer for research analytics data"""
    
    project_id = serializers.UUIDField()
    total_queries = serializers.IntegerField()
    total_results = serializers.IntegerField()
    unique_patents = serializers.IntegerField()
    selected_patents = serializers.IntegerField()
    
    # API usage statistics
    api_usage = serializers.DictField()
    
    # Top assignees and inventors
    top_assignees = serializers.ListField()
    top_inventors = serializers.ListField()
    
    # Classification distribution
    ipc_distribution = serializers.DictField()
    cpc_distribution = serializers.DictField()
    
    # Temporal distribution
    publication_timeline = serializers.DictField()
    
    # Query performance
    avg_execution_time = serializers.FloatField()
    success_rate = serializers.FloatField()


class PatentAPIInfoSerializer(serializers.Serializer):
    """Serializer for patent API information"""

    key = serializers.CharField()
    name = serializers.CharField()
    description = serializers.CharField()
    is_available = serializers.BooleanField(default=True)
    rate_limit = serializers.CharField(required=False)
    max_results = serializers.IntegerField(required=False)


class PatentAPIConfigurationSerializer(serializers.ModelSerializer):
    """
    Serializer for PatentAPIConfiguration model.
    - Masks auth_config API keys in GET (returns '****')
    - Accepts plaintext keys on write and signs them before save
    """

    class Meta:
        model = PatentAPIConfiguration
        fields = [
            'id', 'name', 'display_name', 'description', 'base_url',
            'auth_type', 'auth_config', 'rate_limit', 'is_active',
            'query_mappings', 'response_mappings', 'query_templates',
            'test_query', 'last_tested', 'test_status',
            'created_by', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'last_tested', 'test_status', 'created_by', 'created_at', 'updated_at']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Mask sensitive keys in auth_config
        auth = data.get('auth_config') or {}
        masked = {}
        for k, v in auth.items():
            if k in ('api_key', 'token', 'password', 'secret'):
                masked[k] = '****' if v else ''
            else:
                masked[k] = v
        data['auth_config'] = masked
        return data

    def create(self, validated_data):
        self._sign_auth_config(validated_data)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        self._sign_auth_config(validated_data, instance)
        return super().update(instance, validated_data)

    @staticmethod
    def _sign_auth_config(validated_data, instance=None):
        """Sign sensitive fields in auth_config before persisting."""
        auth = validated_data.get('auth_config')
        if auth is None:
            return
        from django.core.signing import Signer
        signer = Signer()
        sensitive_keys = ('api_key', 'token', 'password', 'secret')
        for key in sensitive_keys:
            value = auth.get(key, '')
            if value and value != '****':
                auth[key] = signer.sign(value)
            elif value == '****' and instance:
                # Keep existing signed value
                existing = (instance.auth_config or {}).get(key, '')
                if existing:
                    auth[key] = existing
        validated_data['auth_config'] = auth