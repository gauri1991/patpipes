"""
Prior Art Domain Serializers
Professional API serializers for prior art search and analysis
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    PriorArtProject, PriorArtProjectMembership, TargetPatent, PatentClaim,
    ClaimElement, SearchSession, EvidenceItem, ClaimEvidenceMapping,
    PriorArtReport, PriorArtProjectType, PriorArtProjectStatus
)

User = get_user_model()


class PriorArtProjectMembershipSerializer(serializers.ModelSerializer):
    """Serializer for project membership"""

    user_name = serializers.CharField(source='user.full_name', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = PriorArtProjectMembership
        fields = [
            'id', 'user', 'user_name', 'user_email', 'role', 'joined_at'
        ]
        read_only_fields = ['id', 'joined_at']


class ClaimElementSerializer(serializers.ModelSerializer):
    """Serializer for claim elements"""

    feature_type_display = serializers.CharField(
        source='get_primary_feature_type_display', read_only=True
    )
    all_keywords = serializers.ReadOnlyField()

    class Meta:
        model = ClaimElement
        fields = [
            'id', 'element_text', 'element_position', 'primary_feature_type',
            'feature_type_display', 'feature_subcategory',
            'categorization_confidence', 'structural_keywords',
            'functional_keywords', 'application_keywords', 'legal_synonyms',
            'broader_terms', 'narrower_terms', 'analysis_context',
            'all_keywords', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'all_keywords']


class PatentClaimSerializer(serializers.ModelSerializer):
    """Serializer for patent claims"""

    elements = ClaimElementSerializer(many=True, read_only=True)
    claim_type_display = serializers.CharField(
        source='get_claim_type_display', read_only=True
    )
    parent_claim_number = serializers.IntegerField(
        source='depends_on_claim.claim_number', read_only=True
    )

    class Meta:
        model = PatentClaim
        fields = [
            'id', 'claim_number', 'claim_type', 'claim_type_display',
            'depends_on_claim', 'parent_claim_number', 'claim_text',
            'analysis_status', 'elements', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class PatentClaimListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for claim lists"""

    claim_type_display = serializers.CharField(
        source='get_claim_type_display', read_only=True
    )
    element_count = serializers.SerializerMethodField()

    class Meta:
        model = PatentClaim
        fields = [
            'id', 'claim_number', 'claim_type', 'claim_type_display',
            'claim_text', 'analysis_status', 'element_count'
        ]

    def get_element_count(self, obj):
        return obj.elements.count()


class TargetPatentSerializer(serializers.ModelSerializer):
    """Serializer for target patents"""

    claims = PatentClaimSerializer(many=True, read_only=True)
    analysis_status_display = serializers.CharField(
        source='get_analysis_status_display', read_only=True
    )

    class Meta:
        model = TargetPatent
        fields = [
            'id', 'patent_number', 'jurisdiction', 'title', 'inventors',
            'assignees', 'priority_date', 'filing_date', 'publication_date',
            'grant_date', 'abstract', 'specification_text',
            'technology_keywords', 'ipc_classifications', 'cpc_classifications',
            'analysis_status', 'analysis_status_display', 'analysis_summary',
            'claims', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class TargetPatentListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for target patent lists"""

    claim_count = serializers.SerializerMethodField()

    class Meta:
        model = TargetPatent
        fields = [
            'id', 'patent_number', 'jurisdiction', 'title',
            'priority_date', 'analysis_status', 'claim_count'
        ]

    def get_claim_count(self, obj):
        return obj.claims.count()


class ClaimEvidenceMappingSerializer(serializers.ModelSerializer):
    """Serializer for claim-evidence mappings"""

    claim_number = serializers.IntegerField(source='claim.claim_number', read_only=True)
    evidence_title = serializers.CharField(source='evidence.title', read_only=True)
    evidence_reference_id = serializers.CharField(
        source='evidence.reference_id', read_only=True
    )
    covered_element_ids = serializers.SerializerMethodField()
    created_by_name = serializers.CharField(
        source='created_by.full_name', read_only=True
    )

    class Meta:
        model = ClaimEvidenceMapping
        fields = [
            'id', 'claim', 'claim_number', 'evidence', 'evidence_title',
            'evidence_reference_id', 'coverage_type', 'coverage_percentage',
            'covered_elements', 'covered_element_ids', 'legal_analysis',
            'confidence_level', 'created_by', 'created_by_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_covered_element_ids(self, obj):
        return list(obj.covered_elements.values_list('id', flat=True))


class EvidenceItemSerializer(serializers.ModelSerializer):
    """Serializer for evidence items"""

    claim_mappings = ClaimEvidenceMappingSerializer(
        source='claimevidencemapping_set', many=True, read_only=True
    )
    evidence_type_display = serializers.CharField(
        source='get_evidence_type_display', read_only=True
    )
    relevance_level_display = serializers.CharField(
        source='get_relevance_level_display', read_only=True
    )
    analysis_status_display = serializers.CharField(
        source='get_analysis_status_display', read_only=True
    )
    analyzed_by_name = serializers.CharField(
        source='analyzed_by.full_name', read_only=True
    )

    class Meta:
        model = EvidenceItem
        fields = [
            'id', 'reference_id', 'evidence_type', 'evidence_type_display',
            'title', 'authors_inventors', 'publication_date', 'jurisdiction',
            'source_database', 'abstract_summary', 'key_disclosure',
            'relevance_level', 'relevance_level_display',
            'legal_relevance_score', 'analysis_status',
            'analysis_status_display', 'analysis_notes', 'is_relevant',
            'is_primary_reference', 'metadata', 'claim_mappings',
            'analyzed_by', 'analyzed_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class EvidenceItemListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for evidence lists"""

    evidence_type_display = serializers.CharField(
        source='get_evidence_type_display', read_only=True
    )
    relevance_level_display = serializers.CharField(
        source='get_relevance_level_display', read_only=True
    )
    mapped_claims_count = serializers.SerializerMethodField()

    class Meta:
        model = EvidenceItem
        fields = [
            'id', 'reference_id', 'evidence_type', 'evidence_type_display',
            'title', 'publication_date', 'relevance_level',
            'relevance_level_display', 'legal_relevance_score',
            'is_relevant', 'is_primary_reference', 'analysis_status',
            'mapped_claims_count'
        ]

    def get_mapped_claims_count(self, obj):
        return obj.relevant_claims.count()


class SearchSessionSerializer(serializers.ModelSerializer):
    """Serializer for search sessions"""

    evidence_items = EvidenceItemListSerializer(many=True, read_only=True)
    search_purpose_display = serializers.CharField(
        source='get_search_purpose_display', read_only=True
    )
    status_display = serializers.CharField(
        source='get_status_display', read_only=True
    )
    created_by_name = serializers.CharField(
        source='created_by.full_name', read_only=True
    )

    class Meta:
        model = SearchSession
        fields = [
            'id', 'name', 'description', 'search_purpose',
            'search_purpose_display', 'search_strategy', 'research_query_ids',
            'status', 'status_display', 'result_count', 'execution_log',
            'search_duration', 'api_calls_made', 'databases_searched',
            'evidence_items', 'created_by', 'created_by_name',
            'created_at', 'updated_at', 'completed_at'
        ]
        read_only_fields = [
            'id', 'result_count', 'search_duration', 'api_calls_made',
            'created_at', 'updated_at', 'completed_at'
        ]


class SearchSessionListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for search session lists"""

    search_purpose_display = serializers.CharField(
        source='get_search_purpose_display', read_only=True
    )
    status_display = serializers.CharField(
        source='get_status_display', read_only=True
    )
    evidence_count = serializers.SerializerMethodField()

    class Meta:
        model = SearchSession
        fields = [
            'id', 'name', 'search_purpose', 'search_purpose_display',
            'status', 'status_display', 'result_count', 'evidence_count',
            'created_at', 'completed_at'
        ]

    def get_evidence_count(self, obj):
        return obj.evidence_items.count()


class PriorArtReportSerializer(serializers.ModelSerializer):
    """Serializer for prior art reports"""

    report_type_display = serializers.CharField(
        source='get_report_type_display', read_only=True
    )
    status_display = serializers.CharField(
        source='get_status_display', read_only=True
    )
    created_by_name = serializers.CharField(
        source='created_by.full_name', read_only=True
    )
    included_evidence_count = serializers.SerializerMethodField()

    class Meta:
        model = PriorArtReport
        fields = [
            'id', 'report_type', 'report_type_display', 'title',
            'description', 'included_evidence', 'included_evidence_count',
            'report_sections', 'status', 'status_display',
            'generation_progress', 'file_path', 'file_format',
            'created_by', 'created_by_name', 'created_at', 'updated_at',
            'completed_at'
        ]
        read_only_fields = [
            'id', 'file_path', 'created_at', 'updated_at', 'completed_at'
        ]

    def get_included_evidence_count(self, obj):
        return obj.included_evidence.count()


class PriorArtReportListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for report lists"""

    report_type_display = serializers.CharField(
        source='get_report_type_display', read_only=True
    )
    status_display = serializers.CharField(
        source='get_status_display', read_only=True
    )

    class Meta:
        model = PriorArtReport
        fields = [
            'id', 'report_type', 'report_type_display', 'title',
            'status', 'status_display', 'generation_progress',
            'file_format', 'created_at', 'completed_at'
        ]


class PriorArtProjectSerializer(serializers.ModelSerializer):
    """Main serializer for prior art projects"""

    project_type_display = serializers.CharField(
        source='get_project_type_display', read_only=True
    )
    status_display = serializers.CharField(
        source='get_status_display', read_only=True
    )
    created_by_name = serializers.CharField(
        source='created_by.full_name', read_only=True
    )
    assigned_to_name = serializers.CharField(
        source='assigned_to.full_name', read_only=True
    )
    team_members_data = PriorArtProjectMembershipSerializer(
        source='priorartprojectmembership_set', many=True, read_only=True
    )
    target_patent_analysis = TargetPatentSerializer(read_only=True)
    search_sessions = SearchSessionListSerializer(many=True, read_only=True)
    reports = PriorArtReportListSerializer(many=True, read_only=True)
    is_active = serializers.ReadOnlyField()

    class Meta:
        model = PriorArtProject
        fields = [
            'id', 'name', 'description', 'project_type', 'project_type_display',
            'status', 'status_display', 'analytics_project',
            'target_patent_number', 'target_patent_title',
            'target_jurisdiction', 'target_priority_date',
            'target_publication_date', 'search_objectives', 'geographic_scope',
            'time_scope', 'technology_scope', 'created_by', 'created_by_name',
            'assigned_to', 'assigned_to_name', 'team_members_data',
            'progress_percentage', 'total_searches', 'total_results',
            'analyzed_results', 'selected_references', 'start_date',
            'target_completion_date', 'actual_completion_date',
            'target_patent_analysis', 'search_sessions', 'reports',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'total_searches', 'total_results', 'analyzed_results',
            'selected_references', 'actual_completion_date',
            'created_at', 'updated_at', 'is_active'
        ]


class PriorArtProjectListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for project lists"""

    project_type_display = serializers.CharField(
        source='get_project_type_display', read_only=True
    )
    status_display = serializers.CharField(
        source='get_status_display', read_only=True
    )
    created_by_name = serializers.CharField(
        source='created_by.full_name', read_only=True
    )
    assigned_to_name = serializers.CharField(
        source='assigned_to.full_name', read_only=True
    )
    team_members_count = serializers.SerializerMethodField()
    search_sessions_count = serializers.SerializerMethodField()
    reports_count = serializers.SerializerMethodField()
    days_remaining = serializers.SerializerMethodField()

    class Meta:
        model = PriorArtProject
        fields = [
            'id', 'name', 'description', 'project_type', 'project_type_display',
            'status', 'status_display', 'target_patent_number',
            'progress_percentage', 'total_searches', 'total_results',
            'selected_references', 'start_date', 'target_completion_date',
            'created_by_name', 'assigned_to_name', 'team_members_count',
            'search_sessions_count', 'reports_count', 'days_remaining',
            'created_at', 'updated_at'
        ]

    def get_team_members_count(self, obj):
        return obj.team_members.count()

    def get_search_sessions_count(self, obj):
        return obj.search_sessions.count()

    def get_reports_count(self, obj):
        return obj.reports.count()

    def get_days_remaining(self, obj):
        if obj.target_completion_date:
            from django.utils import timezone
            today = timezone.now().date()
            return (obj.target_completion_date - today).days
        return None


class CreatePriorArtProjectSerializer(serializers.ModelSerializer):
    """Serializer for creating prior art projects"""

    assigned_member_ids = serializers.ListField(
        child=serializers.UUIDField(),
        write_only=True,
        required=False
    )

    class Meta:
        model = PriorArtProject
        fields = [
            'name', 'description', 'project_type', 'analytics_project',
            'target_patent_number', 'target_patent_title',
            'target_jurisdiction', 'target_priority_date',
            'target_publication_date', 'search_objectives', 'geographic_scope',
            'time_scope', 'technology_scope', 'assigned_to',
            'start_date', 'target_completion_date', 'assigned_member_ids'
        ]

    def create(self, validated_data):
        assigned_member_ids = validated_data.pop('assigned_member_ids', [])
        project = super().create(validated_data)

        # Add project members
        for user_id in assigned_member_ids:
            try:
                user = User.objects.get(id=user_id)
                PriorArtProjectMembership.objects.create(
                    project=project,
                    user=user,
                    role='researcher'
                )
            except User.DoesNotExist:
                continue

        return project


class PriorArtProjectStatisticsSerializer(serializers.Serializer):
    """Serializer for project statistics"""

    total_projects = serializers.IntegerField()
    active_projects = serializers.IntegerField()
    completed_projects = serializers.IntegerField()
    by_type = serializers.DictField()
    by_status = serializers.DictField()
    total_searches = serializers.IntegerField()
    total_evidence = serializers.IntegerField()
    total_reports = serializers.IntegerField()
    average_completion_percentage = serializers.FloatField()
