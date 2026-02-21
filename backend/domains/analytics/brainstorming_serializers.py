"""
Brainstorming API Serializers
Comprehensive serialization for world-class brainstorming functionality
"""

from rest_framework import serializers
from django.contrib.auth.models import User

from .models import (
    BrainstormingSession, BrainstormingParticipant,
    IdeationRecord, KeywordGeneration, ConceptMapping, ConceptRelationship,
    ResearchStrategy, CompetitorAnalysis, AIInteraction,
    AnalyticsProject
)


class UserBasicSerializer(serializers.ModelSerializer):
    """Basic user information for brainstorming contexts"""
    
    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'email']
        read_only_fields = fields


class BrainstormingParticipantSerializer(serializers.ModelSerializer):
    """Serializer for brainstorming session participants"""
    
    user = UserBasicSerializer(read_only=True)
    user_id = serializers.UUIDField(write_only=True)
    
    class Meta:
        model = BrainstormingParticipant
        fields = [
            'id', 'user', 'user_id', 'role', 'joined_at', 
            'contribution_score'
        ]
        read_only_fields = ['id', 'joined_at', 'contribution_score']


class BrainstormingSessionListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for session lists"""
    
    created_by = UserBasicSerializer(read_only=True)
    participants_count = serializers.SerializerMethodField()
    
    class Meta:
        model = BrainstormingSession
        fields = [
            'id', 'name', 'description', 'status', 'research_objective',
            'target_domain', 'completion_percentage', 'total_ideas',
            'total_keywords', 'total_concepts', 'total_strategies',
            'started_at', 'completed_at', 'last_activity',
            'created_by', 'participants_count'
        ]
        read_only_fields = [
            'id', 'completion_percentage', 'total_ideas', 'total_keywords',
            'total_concepts', 'total_strategies', 'started_at', 'completed_at',
            'last_activity'
        ]
    
    def get_participants_count(self, obj):
        # Return 0 for now since participants field is temporarily disabled
        return 0


class BrainstormingSessionSerializer(serializers.ModelSerializer):
    """Comprehensive brainstorming session serializer"""
    
    created_by = UserBasicSerializer(read_only=True)
    # participants = BrainstormingParticipantSerializer(
    #     source='brainstormingparticipant_set',
    #     many=True,
    #     read_only=True
    # )
    participants = serializers.SerializerMethodField()
    
    class Meta:
        model = BrainstormingSession
        fields = [
            'id', 'project', 'name', 'description', 'status',
            'research_objective', 'target_domain', 'research_scope',
            'completion_percentage', 'total_ideas', 'total_keywords',
            'total_concepts', 'total_strategies', 'participants',
            'started_at', 'completed_at', 'last_activity', 'created_by'
        ]
        read_only_fields = [
            'id', 'completion_percentage', 'total_ideas', 'total_keywords',
            'total_concepts', 'total_strategies', 'started_at', 'completed_at',
            'last_activity'
        ]
    
    def get_participants(self, obj):
        # Return empty list for now since participants field is temporarily disabled
        return []


class BrainstormingSessionCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating brainstorming sessions"""
    
    class Meta:
        model = BrainstormingSession
        fields = [
            'project', 'name', 'description', 'research_objective',
            'target_domain', 'research_scope'
        ]
    
    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class IdeationRecordSerializer(serializers.ModelSerializer):
    """Comprehensive ideation record serializer"""
    
    created_by = UserBasicSerializer(read_only=True)
    parent_idea = serializers.PrimaryKeyRelatedField(
        queryset=IdeationRecord.objects.all(),
        required=False,
        allow_null=True
    )
    related_ideas = serializers.PrimaryKeyRelatedField(
        queryset=IdeationRecord.objects.all(),
        many=True,
        required=False
    )
    children_count = serializers.SerializerMethodField()
    
    class Meta:
        model = IdeationRecord
        fields = [
            'id', 'session', 'title', 'description', 'idea_type',
            'priority', 'status', 'tags', 'categories',
            'parent_idea', 'related_ideas', 'is_pinned',
            'votes_up', 'votes_down', 'attachments', 'references',
            'created_by', 'created_at', 'updated_at', 'children_count'
        ]
        read_only_fields = [
            'id', 'votes_up', 'votes_down', 'created_at', 'updated_at'
        ]
    
    def get_children_count(self, obj):
        return obj.ideationrecord_set.count()
    
    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        related_ideas = validated_data.pop('related_ideas', [])
        instance = super().create(validated_data)
        instance.related_ideas.set(related_ideas)
        return instance


class KeywordGenerationSerializer(serializers.ModelSerializer):
    """Advanced keyword generation serializer"""
    
    created_by = UserBasicSerializer(read_only=True)
    
    class Meta:
        model = KeywordGeneration
        fields = [
            'id', 'session', 'keyword', 'variations', 'translations',
            'category', 'generation_method', 'frequency_score',
            'relevance_score', 'search_volume', 'keyword_group',
            'group_color', 'is_active', 'is_validated',
            'created_by', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'frequency_score', 'search_volume', 'created_at', 'updated_at'
        ]
    
    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class ConceptRelationshipSerializer(serializers.ModelSerializer):
    """Concept relationship serializer"""
    
    to_concept_name = serializers.CharField(source='to_concept.concept_name', read_only=True)
    
    class Meta:
        model = ConceptRelationship
        fields = [
            'from_concept', 'to_concept', 'to_concept_name',
            'relationship_type', 'strength', 'description'
        ]


class ConceptMappingSerializer(serializers.ModelSerializer):
    """Comprehensive concept mapping serializer"""
    
    created_by = UserBasicSerializer(read_only=True)
    outgoing_relationships = ConceptRelationshipSerializer(many=True, read_only=True)
    incoming_relationships = ConceptRelationshipSerializer(many=True, read_only=True)
    linked_ideas = serializers.PrimaryKeyRelatedField(
        queryset=IdeationRecord.objects.all(),
        many=True,
        required=False
    )
    linked_keywords = serializers.PrimaryKeyRelatedField(
        queryset=KeywordGeneration.objects.all(),
        many=True,
        required=False
    )
    
    class Meta:
        model = ConceptMapping
        fields = [
            'id', 'session', 'concept_name', 'concept_description',
            'linked_ideas', 'linked_keywords', 'position_x', 'position_y',
            'importance_score', 'complexity_level', 'outgoing_relationships',
            'incoming_relationships', 'created_by', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        linked_ideas = validated_data.pop('linked_ideas', [])
        linked_keywords = validated_data.pop('linked_keywords', [])
        
        instance = super().create(validated_data)
        instance.linked_ideas.set(linked_ideas)
        instance.linked_keywords.set(linked_keywords)
        return instance


class ResearchStrategySerializer(serializers.ModelSerializer):
    """Comprehensive research strategy serializer"""
    
    created_by = UserBasicSerializer(read_only=True)
    primary_keywords = KeywordGenerationSerializer(many=True, read_only=True)
    secondary_keywords = KeywordGenerationSerializer(many=True, read_only=True)
    concepts = ConceptMappingSerializer(many=True, read_only=True)
    
    # Write-only fields for creating strategies
    primary_keyword_ids = serializers.PrimaryKeyRelatedField(
        queryset=KeywordGeneration.objects.all(),
        many=True,
        write_only=True,
        required=False
    )
    secondary_keyword_ids = serializers.PrimaryKeyRelatedField(
        queryset=KeywordGeneration.objects.all(),
        many=True,
        write_only=True,
        required=False
    )
    concept_ids = serializers.PrimaryKeyRelatedField(
        queryset=ConceptMapping.objects.all(),
        many=True,
        write_only=True,
        required=False
    )
    
    class Meta:
        model = ResearchStrategy
        fields = [
            'id', 'session', 'name', 'description', 'strategy_type', 'status',
            'search_domains', 'api_preferences', 'geographic_focus', 'temporal_scope',
            'primary_keywords', 'secondary_keywords', 'concepts',
            'primary_keyword_ids', 'secondary_keyword_ids', 'concept_ids',
            'classification_codes', 'assignee_filters', 'inventor_filters', 'legal_status_filters',
            'estimated_results', 'estimated_time', 'priority_level',
            'actual_results', 'execution_time', 'success_rate',
            'created_by', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'actual_results', 'execution_time', 'success_rate',
            'created_at', 'updated_at'
        ]
    
    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        
        # Extract many-to-many relationships
        primary_keywords = validated_data.pop('primary_keyword_ids', [])
        secondary_keywords = validated_data.pop('secondary_keyword_ids', [])
        concepts = validated_data.pop('concept_ids', [])
        
        instance = super().create(validated_data)
        
        # Set many-to-many relationships
        instance.primary_keywords.set(primary_keywords)
        instance.secondary_keywords.set(secondary_keywords)
        instance.concepts.set(concepts)
        
        return instance


class CompetitorAnalysisSerializer(serializers.ModelSerializer):
    """Comprehensive competitor analysis serializer"""
    
    created_by = UserBasicSerializer(read_only=True)
    
    class Meta:
        model = CompetitorAnalysis
        fields = [
            'id', 'session', 'company_name', 'competitor_type',
            'description', 'headquarters', 'website', 'founded_year',
            'employee_count', 'revenue', 'total_patents', 'active_patents',
            'patent_applications', 'key_inventors', 'technology_areas',
            'strengths', 'weaknesses', 'opportunities', 'threats',
            'research_domains', 'patent_strategy', 'market_position',
            'competitive_advantage', 'threat_level', 'analysis_date',
            'last_updated', 'data_sources', 'created_by'
        ]
        read_only_fields = ['id', 'analysis_date', 'last_updated']
    
    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class AIInteractionSerializer(serializers.ModelSerializer):
    """AI interaction serializer"""
    
    created_by = UserBasicSerializer(read_only=True)
    generated_keywords = KeywordGenerationSerializer(many=True, read_only=True)
    generated_ideas = IdeationRecordSerializer(many=True, read_only=True)
    
    class Meta:
        model = AIInteraction
        fields = [
            'id', 'session', 'interaction_type', 'user_prompt', 'ai_response',
            'context_data', 'user_rating', 'is_helpful', 'feedback_notes',
            'processing_time', 'model_used', 'confidence_score',
            'applied_to_research', 'generated_keywords', 'generated_ideas',
            'created_by', 'created_at'
        ]
        read_only_fields = [
            'id', 'ai_response', 'processing_time', 'model_used',
            'confidence_score', 'created_at'
        ]
    
    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class BrainstormingAnalyticsSerializer(serializers.Serializer):
    """Analytics serializer for brainstorming sessions"""
    
    session_id = serializers.UUIDField()
    session_name = serializers.CharField()
    duration_hours = serializers.FloatField()
    
    # Counts
    total_participants = serializers.IntegerField()
    total_ideas = serializers.IntegerField()
    total_keywords = serializers.IntegerField()
    total_concepts = serializers.IntegerField()
    total_strategies = serializers.IntegerField()
    total_competitors = serializers.IntegerField()
    total_ai_interactions = serializers.IntegerField()
    
    # Quality metrics
    average_idea_rating = serializers.FloatField()
    pinned_ideas_count = serializers.IntegerField()
    validated_keywords_percentage = serializers.FloatField()
    strategy_success_rate = serializers.FloatField()
    
    # Activity metrics
    most_active_participant = UserBasicSerializer()
    most_productive_hour = serializers.CharField()
    peak_activity_date = serializers.DateTimeField()
    
    # Insights
    top_categories = serializers.ListField(child=serializers.CharField())
    top_keywords = serializers.ListField(child=serializers.CharField())
    research_focus_areas = serializers.ListField(child=serializers.CharField())


# Export serializers for easy import
__all__ = [
    'BrainstormingSessionListSerializer',
    'BrainstormingSessionSerializer', 
    'BrainstormingSessionCreateSerializer',
    'BrainstormingParticipantSerializer',
    'IdeationRecordSerializer',
    'KeywordGenerationSerializer',
    'ConceptMappingSerializer',
    'ConceptRelationshipSerializer',
    'ResearchStrategySerializer',
    'CompetitorAnalysisSerializer',
    'AIInteractionSerializer',
    'BrainstormingAnalyticsSerializer'
]