"""
Analytics serializers
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model

from .models import (
    AnalyticsProject, TechnologyArea, PatentDataset, CompetitorProfile,
    GlobalCompetitorProfile, GlobalTechnologyArea,
    AnalyticsVisualization, AnalyticsReport, AnalyticsPresentation, AnalyticsInsight,
    ColumnMappingRule, DatasetColumnMapping, DynamicPatentField, Template
)

User = get_user_model()


class UserBasicSerializer(serializers.ModelSerializer):
    """Basic user serializer for analytics"""
    firstName = serializers.CharField(source='first_name', read_only=True)
    lastName = serializers.CharField(source='last_name', read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'firstName', 'lastName', 'email', 'role']


class GlobalTechnologyAreaSerializer(serializers.ModelSerializer):
    """Global technology area serializer"""
    
    class Meta:
        model = GlobalTechnologyArea
        fields = [
            'id', 'name', 'description', 'ipc_class', 'cpc_class', 'category',
            'maturity_level', 'patent_count', 'growth_rate_6m', 'innovation_score',
            'market_potential', 'key_players', 'related_technologies',
            'created_at', 'updated_at'
        ]


class TechnologyAreaSerializer(serializers.ModelSerializer):
    """Project-specific technology area serializer"""
    global_technology = GlobalTechnologyAreaSerializer(read_only=True)
    
    # Delegate fields from global technology
    name = serializers.CharField(source='global_technology.name', read_only=True)
    description = serializers.CharField(source='global_technology.description', read_only=True)
    ipc_class = serializers.CharField(source='global_technology.ipc_class', read_only=True)
    cpc_class = serializers.CharField(source='global_technology.cpc_class', read_only=True)
    category = serializers.CharField(source='global_technology.category', read_only=True)
    maturity_level = serializers.CharField(source='global_technology.maturity_level', read_only=True)
    patent_count = serializers.IntegerField(source='global_technology.patent_count', read_only=True)
    growth_rate_6m = serializers.FloatField(source='global_technology.growth_rate_6m', read_only=True)
    innovation_score = serializers.FloatField(source='global_technology.innovation_score', read_only=True)
    market_potential = serializers.CharField(source='global_technology.market_potential', read_only=True)
    key_players = serializers.ListField(source='global_technology.key_players', read_only=True)
    related_technologies = serializers.ListField(source='global_technology.related_technologies', read_only=True)
    
    class Meta:
        model = TechnologyArea
        fields = [
            'id', 'global_technology', 'project_relevance_score', 'project_notes',
            'added_by', 'added_at',
            # Delegated fields
            'name', 'description', 'ipc_class', 'cpc_class', 'category',
            'maturity_level', 'patent_count', 'growth_rate_6m', 'innovation_score',
            'market_potential', 'key_players', 'related_technologies'
        ]


class PatentDatasetSerializer(serializers.ModelSerializer):
    """Patent dataset serializer — full detail, includes large JSON fields."""
    created_by = UserBasicSerializer(read_only=True)

    class Meta:
        model = PatentDataset
        fields = [
            'id', 'project', 'name', 'description', 'data_source', 'data_file',
            'processing_status', 'processing_progress', 'processing_log',
            'total_patents', 'processed_patents', 'classification_confidence',
            'technology_distribution', 'temporal_distribution',
            'geographic_distribution', 'assignee_distribution',
            'created_by', 'created_at', 'updated_at'
        ]
        read_only_fields = ['processing_progress', 'processing_log', 'total_patents', 'processed_patents']


class PatentDatasetListSerializer(serializers.ModelSerializer):
    """Lightweight dataset serializer for list views — excludes large JSON blobs."""
    created_by = UserBasicSerializer(read_only=True)

    class Meta:
        model = PatentDataset
        fields = [
            'id', 'project', 'name', 'description', 'data_source', 'data_file',
            'processing_status', 'processing_progress',
            'total_patents', 'processed_patents', 'classification_confidence',
            'created_by', 'created_at', 'updated_at'
        ]
        read_only_fields = ['processing_progress', 'total_patents', 'processed_patents']


class GlobalCompetitorProfileSerializer(serializers.ModelSerializer):
    """Global competitor profile serializer"""
    
    class Meta:
        model = GlobalCompetitorProfile
        fields = [
            'id', 'name', 'legal_name', 'aliases', 'industry', 'headquarters',
            'website', 'description', 'total_patents', 'active_patents',
            'patent_applications_pending', 'key_technology_areas', 'top_inventors',
            'filing_trend_6_months', 'avg_citations_per_patent', 'patent_quality_score',
            'competitive_strength', 'market_focus', 'created_at', 'updated_at'
        ]


class CompetitorProfileSerializer(serializers.ModelSerializer):
    """Project-specific competitor profile serializer"""
    global_competitor = GlobalCompetitorProfileSerializer(read_only=True)
    
    # Delegate fields from global competitor
    name = serializers.CharField(source='global_competitor.name', read_only=True)
    legal_name = serializers.CharField(source='global_competitor.legal_name', read_only=True)
    aliases = serializers.ListField(source='global_competitor.aliases', read_only=True)
    industry = serializers.CharField(source='global_competitor.industry', read_only=True)
    headquarters = serializers.CharField(source='global_competitor.headquarters', read_only=True)
    website = serializers.URLField(source='global_competitor.website', read_only=True)
    description = serializers.CharField(source='global_competitor.description', read_only=True)
    total_patents = serializers.IntegerField(source='global_competitor.total_patents', read_only=True)
    active_patents = serializers.IntegerField(source='global_competitor.active_patents', read_only=True)
    patent_applications_pending = serializers.IntegerField(source='global_competitor.patent_applications_pending', read_only=True)
    key_technology_areas = serializers.ListField(source='global_competitor.key_technology_areas', read_only=True)
    top_inventors = serializers.ListField(source='global_competitor.top_inventors', read_only=True)
    filing_trend_6_months = serializers.IntegerField(source='global_competitor.filing_trend_6_months', read_only=True)
    avg_citations_per_patent = serializers.FloatField(source='global_competitor.avg_citations_per_patent', read_only=True)
    patent_quality_score = serializers.FloatField(source='global_competitor.patent_quality_score', read_only=True)
    competitive_strength = serializers.CharField(source='global_competitor.competitive_strength', read_only=True)
    market_focus = serializers.ListField(source='global_competitor.market_focus', read_only=True)
    
    class Meta:
        model = CompetitorProfile
        fields = [
            'id', 'global_competitor', 'project_relevance_score', 'project_notes',
            'added_by', 'added_at',
            # Delegated fields
            'name', 'legal_name', 'aliases', 'industry', 'headquarters',
            'website', 'description', 'total_patents', 'active_patents',
            'patent_applications_pending', 'key_technology_areas', 'top_inventors',
            'filing_trend_6_months', 'avg_citations_per_patent', 'patent_quality_score',
            'competitive_strength', 'market_focus'
        ]


class AnalyticsVisualizationSerializer(serializers.ModelSerializer):
    """Analytics visualization serializer"""
    created_by = UserBasicSerializer(read_only=True)
    
    class Meta:
        model = AnalyticsVisualization
        fields = [
            'id', 'title', 'description', 'visualization_type', 'status',
            'config', 'filters', 'chart_data', 'insights', 'width', 'height',
            'is_interactive', 'created_by', 'created_at', 'updated_at'
        ]
        read_only_fields = ['chart_data', 'insights']


class AnalyticsReportSerializer(serializers.ModelSerializer):
    """Analytics report serializer"""
    created_by = UserBasicSerializer(read_only=True)
    reviewed_by = UserBasicSerializer(read_only=True)
    
    class Meta:
        model = AnalyticsReport
        fields = [
            'id', 'title', 'report_type', 'status', 'executive_summary',
            'sections', 'conclusions', 'recommendations', 'include_sections',
            'template_config', 'pdf_file', 'excel_file', 'reviewed_by',
            'review_notes', 'approved_at', 'created_by', 'created_at', 'updated_at'
        ]


class AnalyticsPresentationSerializer(serializers.ModelSerializer):
    """Analytics presentation serializer"""
    created_by = UserBasicSerializer(read_only=True)

    class Meta:
        model = AnalyticsPresentation
        fields = [
            'id', 'name', 'description', 'presentation_type', 'status', 'theme',
            'slides', 'speaker_notes', 'slide_count', 'duration_minutes',
            'thumbnail', 'template_id', 'template_config', 'pptx_file', 'pdf_file',
            'last_presented', 'presentation_count', 'created_by',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['slide_count', 'presentation_count']


class AnalyticsInsightSerializer(serializers.ModelSerializer):
    """Analytics insight serializer"""
    reviewed_by = UserBasicSerializer(read_only=True)

    class Meta:
        model = AnalyticsInsight
        fields = [
            'id', 'title', 'insight_type', 'description', 'supporting_data',
            'confidence_level', 'impact_score', 'recommended_actions',
            'priority', 'is_actionable', 'is_reviewed', 'reviewed_by',
            'created_at', 'updated_at'
        ]


class AnalyticsProjectSerializer(serializers.ModelSerializer):
    """Analytics project serializer"""
    created_by = UserBasicSerializer(read_only=True)
    assigned_to = UserBasicSerializer(read_only=True)
    technology_areas = TechnologyAreaSerializer(many=True, read_only=True)
    datasets = PatentDatasetSerializer(many=True, read_only=True)
    competitors = CompetitorProfileSerializer(many=True, read_only=True)
    visualizations = AnalyticsVisualizationSerializer(many=True, read_only=True)
    reports = AnalyticsReportSerializer(many=True, read_only=True)
    presentations = AnalyticsPresentationSerializer(many=True, read_only=True)
    insights = AnalyticsInsightSerializer(many=True, read_only=True)
    progress_percentage = serializers.ReadOnlyField()

    portfolio_name = serializers.SerializerMethodField()
    portfolio_patent_count = serializers.SerializerMethodField()

    def get_portfolio_name(self, obj):
        return obj.portfolio.name if obj.portfolio else None

    def get_portfolio_patent_count(self, obj):
        # Use cached field — avoids N+1 query (kept fresh by PortfolioViewSet.update_metrics)
        return obj.portfolio.total_patents if obj.portfolio else None

    class Meta:
        model = AnalyticsProject
        fields = [
            'id', 'name', 'description', 'status', 'priority', 'created_by',
            'assigned_to', 'start_date', 'due_date', 'completed_date',
            'analysis_scope', 'portfolio', 'portfolio_name', 'portfolio_patent_count',
            'content_type', 'object_id', 'progress_percentage',
            'technology_areas', 'datasets', 'competitors', 'visualizations',
            'reports', 'presentations', 'insights', 'created_at', 'updated_at'
        ]


class AnalyticsProjectCreateSerializer(serializers.ModelSerializer):
    """Analytics project creation serializer"""

    class Meta:
        model = AnalyticsProject
        fields = [
            'name', 'description', 'status', 'priority', 'assigned_to',
            'start_date', 'due_date', 'analysis_scope', 'portfolio',
            'content_type', 'object_id'
        ]
    
    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class AnalyticsDashboardSerializer(serializers.Serializer):
    """Analytics dashboard data serializer"""
    
    # Overview metrics
    total_projects = serializers.IntegerField()
    active_projects = serializers.IntegerField()
    completed_projects = serializers.IntegerField()
    total_datasets = serializers.IntegerField()
    total_patents_analyzed = serializers.IntegerField()
    total_patents_in_portfolios = serializers.IntegerField(default=0)
    patents_with_ai_analysis = serializers.IntegerField()
    total_visualizations = serializers.IntegerField()
    
    # Recent activity  
    recent_projects = serializers.SerializerMethodField()
    recent_insights = serializers.SerializerMethodField()
    
    # Statistics
    projects_by_status = serializers.DictField()
    projects_by_type = serializers.DictField()
    technology_areas_distribution = serializers.DictField()
    
    # Trends
    monthly_project_trends = serializers.ListField()
    completion_rate_trend = serializers.ListField()

    # Patent-level KPIs
    top_technology_areas = serializers.ListField(child=serializers.DictField(), required=False, default=list)
    top_assignees = serializers.ListField(child=serializers.DictField(), required=False, default=list)
    patent_status_distribution = serializers.DictField(required=False, default=dict)
    filing_trend = serializers.ListField(child=serializers.DictField(), required=False, default=list)
    
    def get_recent_projects(self, obj):
        """Serialize recent projects with simple data"""
        from .serializers_simple import SimpleAnalyticsProjectSerializer
        return SimpleAnalyticsProjectSerializer(obj['recent_projects'], many=True).data
    
    def get_recent_insights(self, obj):
        """Serialize recent insights"""
        insights = obj.get('recent_insights', [])
        return [
            {
                'id': str(i.id),
                'title': i.title,
                'insight_type': i.insight_type,
                'description': i.description,
                'confidence_level': i.confidence_level,
                'impact_score': i.impact_score,
                'created_at': i.created_at.isoformat(),
            }
            for i in insights
        ]


class ColumnMappingRuleSerializer(serializers.ModelSerializer):
    """Serializer for column mapping rules"""
    
    created_by = UserBasicSerializer(read_only=True)
    pattern_count = serializers.SerializerMethodField()
    
    class Meta:
        model = ColumnMappingRule
        fields = [
            'id', 'target_field', 'column_patterns', 'field_type', 'field_params',
            'confidence_level', 'is_core_field', 'is_active', 'usage_count', 
            'success_rate', 'created_by', 'created_at', 'updated_at', 'pattern_count'
        ]
        read_only_fields = ['id', 'usage_count', 'success_rate', 'created_at', 'updated_at']
    
    def get_pattern_count(self, obj):
        return len(obj.column_patterns) if obj.column_patterns else 0
    
    def validate_target_field(self, value):
        """Validate target field name"""
        if not value or not value.replace('_', '').isalnum():
            raise serializers.ValidationError("Target field must be a valid field name")
        return value
    
    def validate_column_patterns(self, value):
        """Validate column patterns"""
        if not isinstance(value, list) or len(value) == 0:
            raise serializers.ValidationError("Column patterns must be a non-empty list")
        return value


class DatasetColumnMappingSerializer(serializers.ModelSerializer):
    """Serializer for dataset-specific column mappings"""
    
    dataset_name = serializers.CharField(source='dataset.name', read_only=True)
    mapping_rule_name = serializers.CharField(source='mapping_rule.target_field', read_only=True)
    reviewed_by = UserBasicSerializer(read_only=True)
    
    class Meta:
        model = DatasetColumnMapping
        fields = [
            'id', 'dataset', 'dataset_name', 'mapping_rule', 'mapping_rule_name',
            'source_column', 'target_field', 'confidence_score', 'status',
            'records_processed', 'processing_errors', 'sample_values',
            'reviewed_by', 'reviewed_at', 'admin_notes', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'records_processed', 'processing_errors', 'reviewed_at', 
            'created_at', 'updated_at'
        ]
    
    def validate_confidence_score(self, value):
        """Validate confidence score"""
        if not 0 <= value <= 100:
            raise serializers.ValidationError("Confidence score must be between 0 and 100")
        return value


class DynamicPatentFieldSerializer(serializers.ModelSerializer):
    """Serializer for dynamic patent fields"""
    
    created_by = UserBasicSerializer(read_only=True)
    datasets_using = serializers.StringRelatedField(many=True, read_only=True)
    usage_datasets_count = serializers.SerializerMethodField()
    
    class Meta:
        model = DynamicPatentField
        fields = [
            'id', 'field_name', 'field_type', 'field_params', 'display_name',
            'description', 'datasets_using', 'total_records', 'is_active',
            'migration_applied', 'migration_name', 'created_by', 'created_at',
            'updated_at', 'usage_datasets_count'
        ]
        read_only_fields = [
            'id', 'total_records', 'migration_applied', 'migration_name',
            'created_at', 'updated_at'
        ]
    
    def get_usage_datasets_count(self, obj):
        return obj.datasets_using.count()
    
    def validate_field_name(self, value):
        """Validate field name"""
        if not value or not value.replace('_', '').isalnum():
            raise serializers.ValidationError("Field name must be a valid Python identifier")
        
        # Check against core fields
        from .column_mapping_service import IntelligentColumnMappingService
        service = IntelligentColumnMappingService()
        if value in service.CORE_PATENT_FIELDS:
            raise serializers.ValidationError("Cannot use core PatentRecord field names")
        
        return value


class ColumnMappingAnalysisSerializer(serializers.Serializer):
    """Serializer for column mapping analysis results"""
    
    source_column = serializers.CharField()
    target_field = serializers.CharField()
    confidence_score = serializers.FloatField()
    is_core_field = serializers.BooleanField()
    suggested_field_type = serializers.CharField()
    sample_values = serializers.ListField()
    mapping_rule_id = serializers.UUIDField(allow_null=True)


class MappingApplicationSerializer(serializers.Serializer):
    """Serializer for applying column mappings"""
    
    mappings = ColumnMappingAnalysisSerializer(many=True)
    
    def validate_mappings(self, value):
        """Validate mapping data"""
        if not value:
            raise serializers.ValidationError("At least one mapping is required")
        
        # Check for duplicate target fields
        target_fields = [mapping['target_field'] for mapping in value]
        if len(target_fields) != len(set(target_fields)):
            raise serializers.ValidationError("Duplicate target fields detected")
        
        return value

class TemplateSerializer(serializers.ModelSerializer):
    """Serializer for Template model"""
    
    created_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Template
        fields = [
            'id', 'name', 'description', 'template_type', 'category', 'icon',
            'scope', 'created_by', 'created_by_name', 'organization', 'team',
            'tags', 'version', 'is_active', 'is_public', 'usage_count', 'last_used',
            'config', 'chart_type', 'report_type', 'filters', 'permissions',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_by_name', 'usage_count', 'last_used', 'created_at', 'updated_at']
    
    def get_created_by_name(self, obj):
        """Get the name of the template creator"""
        if obj.created_by:
            return obj.created_by.get_full_name() or obj.created_by.username
        return 'System'
    
    def validate(self, attrs):
        """Validate template data"""
        template_type = attrs.get('template_type')
        
        # Validate chart-specific fields
        if template_type == 'chart':
            if not attrs.get('chart_type'):
                raise serializers.ValidationError('chart_type is required for chart templates')
        
        # Validate report-specific fields
        if template_type == 'report':
            if not attrs.get('report_type'):
                raise serializers.ValidationError('report_type is required for report templates')
        
        return attrs


# ─────────────────────────────────────────────────────────────────────────────
# Bundle Analysis Serializers
# ─────────────────────────────────────────────────────────────────────────────

class PatentBundleAttributesSerializer(serializers.ModelSerializer):
    patent_id = serializers.SerializerMethodField()
    title = serializers.SerializerMethodField()

    class Meta:
        from .models import PatentBundleAttributes
        model = PatentBundleAttributes
        fields = [
            'id', 'patent_record_id', 'patent_id', 'title',
            # Group A
            'a1_primary_domain', 'a2_tech_subcategory', 'a3_stack_layer', 'a4_subsystem', 'a5_use_case',
            # Group B
            'b1_sep_potential', 'b2_standard_tagged', 'b3_interface_role',
            # Group C
            'c1_claim_type', 'c2_breadth', 'c3_claim_count', 'c4_design_around_difficulty',
            # Group D
            'd1_external_detectability', 'd2_teardown_detectability', 'd3_reads_on_products',
            # Group E
            'e1_family_size', 'e2_prosecution_status', 'e3_continuation', 'e4_remaining_term_years', 'e5_maintenance_status',
            # Group F
            'f1_jurisdictions', 'f2_trilateral', 'f3_major_market_score',
            # Group G
            'g1_convergence_theme', 'g2_generation_tag', 'g3_cross_industry_applicability',
            # Group H
            'h1_claim_strength', 'h2_prior_art_exposure', 'h3_prosecution_risk', 'h4_divided_infringement_risk',
            'h5_forward_citations', 'h6_backward_citations', 'h7_litigation_history',
            'h8_chain_of_title', 'h9_eou_availability', 'h10_encumbrance_status',
            # Group I
            'i1_product_mapping_confidence', 'i2_implementation_maturity', 'i3_adjacent_market_reread', 'i4_workaround_complexity',
            # Provenance
            'derived_fields', 'ai_extracted_fields', 'manually_set_fields', 'last_ai_extraction',
            'created_at', 'updated_at',
        ]

    def get_patent_id(self, obj):
        try:
            return obj.patent_record.patent_id or str(obj.patent_record_id)
        except Exception:
            return str(obj.patent_record_id)

    def get_title(self, obj):
        try:
            return obj.patent_record.title or ''
        except Exception:
            return ''


class BundlingConfigurationSerializer(serializers.ModelSerializer):
    class Meta:
        from .models import BundlingConfiguration
        model = BundlingConfiguration
        fields = ['id', 'project', 'name', 'preset', 'enabled_bundles', 'thresholds', 'gate_toggles', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class SalesPackageSerializer(serializers.ModelSerializer):
    from .models import SalesPackage
    bundle_count = serializers.IntegerField(read_only=True)
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        from .models import SalesPackage
        model = SalesPackage
        fields = [
            'id', 'project', 'name', 'description', 'bundle_codes',
            'transaction_type', 'status',
            'buyer_targets', 'notes',
            'primary_archetype', 'secondary_archetype', 'listing_pattern',
            'mcl_entries',
            'generated_teaser', 'generated_listing',
            'listing_tier_report', 'listing_generated_at',
            'meta_tags', 'lint_results', 'quality_gates', 'tier_validation',
            'suggested_archetype', 'archetype_reason',
            'generated_deck', 'generated_cim',
            'bundle_count', 'created_by', 'created_by_name',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'bundle_count', 'created_by', 'created_at', 'updated_at',
            'generated_teaser', 'generated_listing', 'listing_tier_report', 'listing_generated_at',
            'meta_tags', 'lint_results', 'quality_gates', 'tier_validation',
            'suggested_archetype', 'archetype_reason',
            'generated_deck', 'generated_cim',
        ]

    def get_created_by_name(self, obj):
        if obj.created_by:
            return obj.created_by.get_full_name() or obj.created_by.email
        return None
