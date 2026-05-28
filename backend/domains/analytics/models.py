"""
Analytics Models
Patent landscape analysis and competitive intelligence models
"""

import uuid
import json
from decimal import Decimal
from django.db import models
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator

User = get_user_model()


class ODPCacheEntry(models.Model):
    """Caches raw USPTO ODP API responses to avoid redundant external calls."""
    application_id = models.CharField(max_length=64, db_index=True)
    endpoint = models.CharField(max_length=50)
    response_data = models.JSONField(default=dict)
    fetched_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'analytics_odp_cache'
        unique_together = ('application_id', 'endpoint')

    def __str__(self):
        return f"ODPCache({self.application_id}, {self.endpoint})"


class AnalyticsProject(models.Model):
    """
    Analytics project for patent landscape analysis
    Adapted from reference but using our role system
    """
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('active', 'Active'),
        ('scope_definition', 'Scope Definition'),
        ('data_collection', 'Data Collection'),
        ('patent_analysis', 'Patent Analysis'),
        ('visualization', 'Visualization'),
        ('report_generation', 'Report Generation'),
        ('completed', 'Completed'),
        ('on_hold', 'On Hold'),
        ('cancelled', 'Cancelled'),
    ]
    
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='draft')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    
    # Our existing role system
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='analytics_projects_created')
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='analytics_projects_assigned')
    
    # Project settings
    start_date = models.DateTimeField(default=timezone.now)
    due_date = models.DateTimeField(null=True, blank=True)
    completed_date = models.DateTimeField(null=True, blank=True)
    
    # Analysis scope
    analysis_scope = models.JSONField(default=dict, help_text="Technology areas, keywords, date ranges, etc.")
    
    # Explicit link to portfolio (direct FK for clean cross-domain queries)
    portfolio = models.ForeignKey(
        'patents.Portfolio',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='analytics_projects',
        help_text="Portfolio being analysed — links this project to real patent data"
    )

    # Generic relation to link with any other object (legacy / flexible)
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True, blank=True)
    object_id = models.UUIDField(null=True, blank=True)
    related_object = GenericForeignKey('content_type', 'object_id')

    # Persisted analysis results and active task tracking
    analysis_results = models.JSONField(default=dict, blank=True,
        help_text="Keyed by analysis_type; stores last completed result + active task_id per type.")

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'analytics_projects'
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['created_by']),
            models.Index(fields=['priority']),
            models.Index(fields=['status', 'created_by']),
            models.Index(fields=['-created_at']),
        ]
    
    def __str__(self):
        return self.name
    
    @property
    def progress_percentage(self):
        """Calculate project progress based on status and completed tasks"""
        status_weights = {
            'draft': 0,
            'scope_definition': 10,
            'data_collection': 25,
            'patent_analysis': 50,
            'visualization': 75,
            'report_generation': 90,
            'completed': 100,
            'on_hold': self._calculate_current_progress(),
            'cancelled': 0,
        }
        return status_weights.get(self.status, 0)
    
    def _calculate_current_progress(self):
        """Calculate progress based on completed sub-tasks.

        Uses pre-annotated counts if available (from ViewSet queryset),
        otherwise falls back to individual queries.
        """
        if hasattr(self, '_dataset_count'):
            total = self._dataset_count + self._viz_count + self._report_count
            done = self._dataset_done + self._viz_done + self._report_done
        else:
            total = (
                self.datasets.count() +
                self.visualizations.count() +
                self.reports.count()
            )
            done = (
                self.datasets.filter(processing_status='completed').count() +
                self.visualizations.filter(status='completed').count() +
                self.reports.filter(status='completed').count()
            )

        if total == 0:
            return 0
        return int((done / total) * 100)


class GlobalTechnologyArea(models.Model):
    """Global technology taxonomy for the entire organization"""
    
    MATURITY_CHOICES = [
        ('emerging', 'Emerging'),
        ('developing', 'Developing'),
        ('mature', 'Mature'),
        ('declining', 'Declining'),
    ]
    
    MARKET_POTENTIAL_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True)
    
    # Classification codes
    ipc_class = models.CharField(max_length=50, blank=True)
    cpc_class = models.CharField(max_length=50, blank=True)
    
    # Categorization
    category = models.CharField(max_length=255, blank=True)
    maturity_level = models.CharField(max_length=20, choices=MATURITY_CHOICES, default='developing')
    
    # Metrics
    patent_count = models.IntegerField(default=0)
    growth_rate_6m = models.FloatField(default=0.0)
    innovation_score = models.FloatField(default=0.0)
    market_potential = models.CharField(max_length=20, choices=MARKET_POTENTIAL_CHOICES, default='medium')
    
    # Relationships
    key_players = models.JSONField(default=list)
    related_technologies = models.JSONField(default=list)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'analytics_global_technology_areas'
        ordering = ['-innovation_score', 'name']
    
    def __str__(self):
        return self.name


class TechnologyArea(models.Model):
    """Project-specific technology areas linked to global taxonomy"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(AnalyticsProject, on_delete=models.CASCADE, related_name='technology_areas')
    global_technology = models.ForeignKey(GlobalTechnologyArea, on_delete=models.PROTECT, related_name='project_links', null=True, blank=True)
    
    
    # Project-specific settings
    project_relevance_score = models.FloatField(default=0.0)
    project_notes = models.TextField(blank=True)
    added_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    added_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'analytics_project_technology_areas'
        unique_together = ['project', 'global_technology']
    
    def __str__(self):
        return f"{self.project.name} - {self.global_technology.name}"
    
    # Delegate properties to global technology
    @property
    def name(self):
        return self.global_technology.name
    
    @property
    def description(self):
        return self.global_technology.description
    
    @property
    def ipc_class(self):
        return self.global_technology.ipc_class
    
    @property
    def cpc_class(self):
        return self.global_technology.cpc_class
    
    @property
    def category(self):
        return self.global_technology.category
    
    @property
    def maturity_level(self):
        return self.global_technology.maturity_level
    
    @property
    def patent_count(self):
        return self.global_technology.patent_count
    
    @property
    def growth_rate_6m(self):
        return self.global_technology.growth_rate_6m
    
    @property
    def innovation_score(self):
        return self.global_technology.innovation_score
    
    @property
    def market_potential(self):
        return self.global_technology.market_potential
    
    @property
    def key_players(self):
        return self.global_technology.key_players
    
    @property
    def related_technologies(self):
        return self.global_technology.related_technologies


class PatentDataset(models.Model):
    """Patent dataset for analysis projects"""
    
    PROCESSING_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]
    
    DATA_SOURCE_CHOICES = [
        ('manual_upload', 'Manual Upload'),
        ('api_import', 'API Import'),
        ('database_query', 'Database Query'),
        ('web_scraping', 'Web Scraping'),
        ('portfolio_import', 'Portfolio Import'),
        ('odp_import', 'ODP API Import'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(AnalyticsProject, on_delete=models.CASCADE, related_name='datasets')
    
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    data_source = models.CharField(max_length=50, choices=DATA_SOURCE_CHOICES, default='manual_upload')
    
    # File storage
    data_file = models.FileField(upload_to='analytics/datasets/', null=True, blank=True)
    raw_data = models.JSONField(default=dict, help_text="Raw patent data")
    processed_data = models.JSONField(default=dict, help_text="Processed and classified patent data")
    
    # Processing status
    processing_status = models.CharField(max_length=20, choices=PROCESSING_STATUS_CHOICES, default='pending')
    processing_progress = models.IntegerField(default=0, help_text="Processing progress percentage")
    processing_log = models.JSONField(default=list, help_text="Processing log entries")
    
    # Statistics
    total_patents = models.IntegerField(default=0)
    processed_patents = models.IntegerField(default=0)
    classification_confidence = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0.0'))
    
    # Analysis results
    technology_distribution = models.JSONField(default=dict, help_text="Distribution across technology areas")
    temporal_distribution = models.JSONField(default=dict, help_text="Filing trends over time")
    geographic_distribution = models.JSONField(default=dict, help_text="Geographic distribution")
    assignee_distribution = models.JSONField(default=dict, help_text="Top assignees")
    
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'analytics_patent_datasets'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['processing_status']),
            models.Index(fields=['project', 'processing_status']),
        ]
    
    def __str__(self):
        return f"{self.project.name} - {self.name}"


class GlobalCompetitorProfile(models.Model):
    """Global competitor profiles for the entire organization"""
    
    STRENGTH_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    ]
    
    MARKET_POTENTIAL_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Company information
    name = models.CharField(max_length=255, unique=True)
    legal_name = models.CharField(max_length=255, blank=True)
    aliases = models.JSONField(default=list, help_text="Alternative names and subsidiaries")
    
    # Business information
    industry = models.CharField(max_length=255, blank=True)
    headquarters = models.CharField(max_length=255, blank=True)
    website = models.URLField(blank=True)
    description = models.TextField(blank=True)
    
    # Patent portfolio metrics
    total_patents = models.IntegerField(default=0)
    active_patents = models.IntegerField(default=0)
    patent_applications_pending = models.IntegerField(default=0)
    
    # Analysis metrics
    key_technology_areas = models.JSONField(default=list)
    top_inventors = models.JSONField(default=list)
    filing_trend_6_months = models.IntegerField(default=0)
    avg_citations_per_patent = models.FloatField(default=0.0)
    patent_quality_score = models.FloatField(default=0.0)
    competitive_strength = models.CharField(max_length=20, choices=STRENGTH_CHOICES, default='medium')
    market_focus = models.JSONField(default=list)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'analytics_global_competitor_profiles'
        ordering = ['-total_patents', 'name']
    
    def __str__(self):
        return self.name


class CompetitorProfile(models.Model):
    """Project-specific competitor profiles linked to global database"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(AnalyticsProject, on_delete=models.CASCADE, related_name='competitors')
    global_competitor = models.ForeignKey(GlobalCompetitorProfile, on_delete=models.PROTECT, related_name='project_links', null=True, blank=True)
    
    
    # Project-specific settings
    project_relevance_score = models.FloatField(default=0.0)
    project_notes = models.TextField(blank=True)
    added_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    added_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        db_table = 'analytics_project_competitor_profiles'
        unique_together = ['project', 'global_competitor']
    
    def __str__(self):
        return f"{self.project.name} - {self.global_competitor.name}"
    
    # Delegate properties to global competitor
    @property
    def name(self):
        return self.global_competitor.name
    
    @property
    def legal_name(self):
        return self.global_competitor.legal_name
    
    @property
    def aliases(self):
        return self.global_competitor.aliases
    
    @property
    def industry(self):
        return self.global_competitor.industry
    
    @property
    def headquarters(self):
        return self.global_competitor.headquarters
    
    @property
    def website(self):
        return self.global_competitor.website
    
    @property
    def description(self):
        return self.global_competitor.description
    
    @property
    def total_patents(self):
        return self.global_competitor.total_patents
    
    @property
    def active_patents(self):
        return self.global_competitor.active_patents
    
    @property
    def patent_applications_pending(self):
        return self.global_competitor.patent_applications_pending
    
    @property
    def key_technology_areas(self):
        return self.global_competitor.key_technology_areas
    
    @property
    def top_inventors(self):
        return self.global_competitor.top_inventors
    
    @property
    def filing_trend_6_months(self):
        return self.global_competitor.filing_trend_6_months
    
    @property
    def avg_citations_per_patent(self):
        return self.global_competitor.avg_citations_per_patent
    
    @property
    def patent_quality_score(self):
        return self.global_competitor.patent_quality_score
    
    @property
    def competitive_strength(self):
        return self.global_competitor.competitive_strength
    
    @property
    def market_focus(self):
        return self.global_competitor.market_focus


class PatentRecord(models.Model):
    """Individual patent record parsed from uploaded datasets"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    dataset = models.ForeignKey(PatentDataset, on_delete=models.CASCADE, related_name='patent_records')
    
    # Core patent fields (standardized names)
    patent_id = models.CharField(max_length=100, blank=True, help_text="Patent/Application number")
    title = models.TextField(blank=True)
    abstract = models.TextField(blank=True)
    assignee = models.TextField(blank=True, help_text="Patent assignee/owner")
    inventor = models.TextField(blank=True, help_text="Inventor names")
    
    # Dates
    filing_date = models.DateField(null=True, blank=True)
    publication_date = models.DateField(null=True, blank=True)
    grant_date = models.DateField(null=True, blank=True)
    
    # Classifications
    ipc_classification = models.TextField(blank=True, help_text="International Patent Classification")
    cpc_classification = models.TextField(blank=True, help_text="Cooperative Patent Classification")
    uspc_classification = models.TextField(blank=True, help_text="US Patent Classification")
    
    # Geographic
    country_code = models.CharField(max_length=50, blank=True)
    jurisdiction = models.CharField(max_length=100, blank=True)
    
    # Status and type
    patent_type = models.CharField(max_length=50, blank=True, help_text="Utility, Design, etc.")
    legal_status = models.TextField(blank=True, null=True, default='')
    
    # Technical fields
    description = models.TextField(blank=True, help_text="Full patent specification / detailed description text")
    claims = models.TextField(blank=True, help_text="Full text of patent claims")
    claims_structure = models.JSONField(
        default=list,
        help_text="Parsed claims with type and dependencies: [{'number': '1', 'text': '...', 'type': 'independent', 'references': []}]"
    )
    independent_claims_count = models.IntegerField(default=0, help_text="Number of independent claims")
    dependent_claims_count = models.IntegerField(default=0, help_text="Number of dependent claims")
    claims_count = models.IntegerField(null=True, blank=True)
    forward_citations = models.IntegerField(null=True, blank=True)
    backward_citations = models.IntegerField(null=True, blank=True)
    
    # Raw data storage - stores original column data as parsed from file
    raw_data = models.JSONField(default=dict, help_text="Original data from uploaded file")
    
    # Processing metadata
    row_number = models.IntegerField(help_text="Original row number in uploaded file")
    parsing_notes = models.TextField(blank=True, help_text="Notes from parsing process")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'analytics_patent_records'
        ordering = ['dataset', 'row_number']
        indexes = [
            models.Index(fields=['dataset', 'patent_id']),
            models.Index(fields=['filing_date']),
            models.Index(fields=['assignee']),
            models.Index(fields=['country_code']),
        ]
    
    def __str__(self):
        return f"{self.patent_id or 'Record'} ({self.dataset.name})"


class AnalyticsVisualization(models.Model):
    """Visualization configurations for analytics projects"""
    
    VISUALIZATION_TYPES = [
        ('patent_timeline', 'Patent Filing Timeline'),
        ('technology_landscape', 'Technology Landscape Map'),
        ('competitive_positioning', 'Competitive Positioning'),
        ('geographic_distribution', 'Geographic Distribution'),
        ('citation_network', 'Citation Network'),
        ('collaboration_network', 'Collaboration Network'),
        ('technology_evolution', 'Technology Evolution'),
        ('portfolio_comparison', 'Portfolio Comparison'),
        ('filing_trends', 'Filing Trends Analysis'),
        ('white_space_analysis', 'White Space Analysis'),
        ('fto_analysis', 'Freedom to Operate Analysis'),
        ('risk_assessment', 'Risk Assessment Matrix'),
    ]
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('error', 'Error'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(AnalyticsProject, on_delete=models.CASCADE, related_name='visualizations')
    
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    visualization_type = models.CharField(max_length=50, choices=VISUALIZATION_TYPES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    
    # Configuration
    config = models.JSONField(default=dict, help_text="Visualization configuration parameters")
    filters = models.JSONField(default=dict, help_text="Applied filters")
    
    # Chart data
    chart_data = models.JSONField(default=dict, help_text="Generated chart data")
    insights = models.JSONField(default=list, help_text="Generated insights")
    
    # Display settings
    width = models.IntegerField(default=800)
    height = models.IntegerField(default=600)
    is_interactive = models.BooleanField(default=True)
    
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'analytics_visualizations'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.project.name} - {self.title}"


class AnalyticsReport(models.Model):
    """Analytics reports with professional sections"""
    
    REPORT_TYPES = [
        ('landscape_analysis', 'Landscape Analysis'),
        ('competitive_intelligence', 'Competitive Intelligence'),
        ('fto_analysis', 'Freedom to Operate Analysis'),
        ('white_space_analysis', 'White Space Analysis'),
        ('portfolio_assessment', 'Portfolio Assessment'),
        ('technology_trends', 'Technology Trends'),
        ('market_analysis', 'Market Analysis'),
        ('investment_analysis', 'Investment Analysis'),
    ]
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('generating', 'Generating'),
        ('review', 'Under Review'),
        ('approved', 'Approved'),
        ('completed', 'Completed'),
        ('archived', 'Archived'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(AnalyticsProject, on_delete=models.CASCADE, related_name='reports')
    
    title = models.CharField(max_length=255)
    report_type = models.CharField(max_length=50, choices=REPORT_TYPES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    
    # Report content
    executive_summary = models.TextField(blank=True)
    sections = models.JSONField(default=dict, help_text="Report sections and content")
    conclusions = models.TextField(blank=True)
    recommendations = models.JSONField(default=list, help_text="Strategic recommendations")
    
    # Generation settings
    include_sections = models.JSONField(default=list, help_text="Sections to include in report")
    template_config = models.JSONField(default=dict, help_text="Template configuration")
    
    # File outputs
    pdf_file = models.FileField(upload_to='analytics/reports/', null=True, blank=True)
    excel_file = models.FileField(upload_to='analytics/reports/', null=True, blank=True)
    
    # Review information
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='analytics_reports_reviewed')
    review_notes = models.TextField(blank=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'analytics_reports'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.project.name} - {self.title}"


class AnalyticsPresentation(models.Model):
    """Presentation decks for analytics projects"""

    PRESENTATION_TYPES = [
        ('executive_summary', 'Executive Summary'),
        ('technical_deep_dive', 'Technical Deep Dive'),
        ('competitive_analysis', 'Competitive Analysis'),
        ('patent_landscape', 'Patent Landscape'),
        ('investor_pitch', 'Investor Pitch'),
        ('board_presentation', 'Board Presentation'),
        ('custom', 'Custom'),
    ]

    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('archived', 'Archived'),
    ]

    THEME_CHOICES = [
        ('modern_dark', 'Modern Dark'),
        ('professional_blue', 'Professional Blue'),
        ('minimal_light', 'Minimal Light'),
        ('corporate_gray', 'Corporate Gray'),
        ('vibrant_cyan', 'Vibrant Cyan'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(AnalyticsProject, on_delete=models.CASCADE, related_name='presentations')

    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    presentation_type = models.CharField(max_length=50, choices=PRESENTATION_TYPES, default='executive_summary')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    theme = models.CharField(max_length=50, choices=THEME_CHOICES, default='modern_dark')

    # Presentation content
    slides = models.JSONField(default=list, help_text="Array of slide objects with content")
    speaker_notes = models.JSONField(default=dict, help_text="Speaker notes per slide")

    # Metadata
    slide_count = models.IntegerField(default=1)
    duration_minutes = models.IntegerField(default=5, help_text="Estimated presentation duration")
    thumbnail = models.ImageField(upload_to='analytics/presentations/thumbnails/', null=True, blank=True)

    # Template and configuration
    template_id = models.UUIDField(null=True, blank=True, help_text="Template used for this presentation")
    template_config = models.JSONField(default=dict, help_text="Template configuration settings")

    # File outputs
    pptx_file = models.FileField(upload_to='analytics/presentations/', null=True, blank=True)
    pdf_file = models.FileField(upload_to='analytics/presentations/', null=True, blank=True)

    # Presentation history
    last_presented = models.DateTimeField(null=True, blank=True)
    presentation_count = models.IntegerField(default=0, help_text="Number of times presented")

    # User tracking
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='presentations_created')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'analytics_presentations'
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.project.name} - {self.name}"

    def update_slide_count(self):
        """Update slide count based on slides array"""
        self.slide_count = len(self.slides) if self.slides else 0
        return self.slide_count


class AnalyticsInsight(models.Model):
    """AI-generated insights and recommendations"""

    INSIGHT_TYPES = [
        ('trend_analysis', 'Trend Analysis'),
        ('opportunity_identification', 'Opportunity Identification'),
        ('risk_assessment', 'Risk Assessment'),
        ('competitive_gap', 'Competitive Gap'),
        ('technology_emergence', 'Technology Emergence'),
        ('market_shift', 'Market Shift'),
        ('collaboration_opportunity', 'Collaboration Opportunity'),
        ('patent_expiration', 'Patent Expiration Alert'),
    ]
    
    CONFIDENCE_LEVELS = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(AnalyticsProject, on_delete=models.CASCADE, related_name='insights')
    
    title = models.CharField(max_length=255)
    insight_type = models.CharField(max_length=50, choices=INSIGHT_TYPES)
    description = models.TextField()
    
    # Analysis details
    supporting_data = models.JSONField(default=dict, help_text="Data supporting this insight")
    confidence_level = models.CharField(max_length=20, choices=CONFIDENCE_LEVELS)
    impact_score = models.DecimalField(max_digits=5, decimal_places=2, help_text="Impact score 0-100")
    
    # Actions and recommendations
    recommended_actions = models.JSONField(default=list, help_text="Recommended actions")
    priority = models.CharField(max_length=20, choices=AnalyticsProject.PRIORITY_CHOICES, default='medium')
    
    # Status tracking
    is_actionable = models.BooleanField(default=True)
    is_reviewed = models.BooleanField(default=False)
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'analytics_insights'
        ordering = ['-impact_score', '-created_at']
    
    def __str__(self):
        return f"{self.project.name} - {self.title}"


class ColumnMappingRule(models.Model):
    """
    Global column mapping rules for intelligent Excel parsing
    Configurable by admins for different column name variations
    """
    
    FIELD_TYPE_CHOICES = [
        ('CharField', 'Text Field'),
        ('TextField', 'Long Text Field'),
        ('DateField', 'Date Field'),
        ('DateTimeField', 'DateTime Field'),
        ('IntegerField', 'Integer Field'),
        ('FloatField', 'Float Field'),
        ('DecimalField', 'Decimal Field'),
        ('BooleanField', 'Boolean Field'),
        ('JSONField', 'JSON Field'),
    ]
    
    CONFIDENCE_LEVELS = [
        ('high', 'High (90-100%)'),
        ('medium', 'Medium (70-89%)'),
        ('low', 'Low (50-69%)'),
        ('manual', 'Manual Review Required'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Target field in PatentRecord model — unique per field name
    target_field = models.CharField(
        max_length=100,
        unique=True,
        help_text="Field name in PatentRecord model"
    )
    
    # Column name patterns to match
    column_patterns = models.JSONField(
        default=list,
        help_text="List of column name patterns/variations (case-insensitive)"
    )
    
    # Field configuration for dynamic fields
    field_type = models.CharField(
        max_length=50, 
        choices=FIELD_TYPE_CHOICES, 
        default='CharField'
    )
    field_params = models.JSONField(
        default=dict,
        help_text="Additional field parameters (max_length, null, blank, etc.)"
    )
    
    # Mapping metadata
    confidence_level = models.CharField(
        max_length=20, 
        choices=CONFIDENCE_LEVELS,
        default='medium'
    )
    is_core_field = models.BooleanField(
        default=False,
        help_text="True for standard PatentRecord fields, False for dynamic fields"
    )
    is_active = models.BooleanField(default=True)
    
    # Usage tracking
    usage_count = models.IntegerField(default=0)
    success_rate = models.FloatField(
        default=0.0,
        validators=[MinValueValidator(0.0), MaxValueValidator(100.0)],
        help_text="Success rate percentage"
    )
    
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'analytics_column_mapping_rules'
        ordering = ['-confidence_level', '-success_rate', 'target_field']
        indexes = [
            models.Index(fields=['target_field']),
            models.Index(fields=['is_active', 'confidence_level']),
            models.Index(fields=['is_core_field']),
        ]
    
    def __str__(self):
        return f"{self.target_field} - {len(self.column_patterns)} patterns"
    
    def add_pattern(self, pattern):
        """Add a new column pattern if it doesn't exist"""
        if pattern.lower() not in [p.lower() for p in self.column_patterns]:
            self.column_patterns.append(pattern)
            self.save()
    
    def remove_pattern(self, pattern):
        """Remove a column pattern"""
        self.column_patterns = [p for p in self.column_patterns 
                              if p.lower() != pattern.lower()]
        self.save()
    
    def update_success_rate(self, successful_mappings, total_attempts):
        """Update success rate based on mapping results"""
        if total_attempts > 0:
            self.success_rate = (successful_mappings / total_attempts) * 100
            self.usage_count += total_attempts
            self.save()


class DatasetColumnMapping(models.Model):
    """
    Specific column mappings for individual datasets
    Records actual mappings used and allows for dataset-specific overrides
    """
    
    MAPPING_STATUS_CHOICES = [
        ('pending', 'Pending Review'),
        ('confirmed', 'Confirmed by Admin'),
        ('rejected', 'Rejected'),
        ('auto_applied', 'Auto Applied'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Relationships
    dataset = models.ForeignKey(
        PatentDataset, 
        on_delete=models.CASCADE,
        related_name='column_mappings'
    )
    mapping_rule = models.ForeignKey(
        ColumnMappingRule,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        help_text="Rule used for this mapping (null for manual mappings)"
    )
    
    # Mapping details
    source_column = models.CharField(
        max_length=255,
        help_text="Original column name from uploaded file"
    )
    target_field = models.CharField(
        max_length=100,
        help_text="Target field in PatentRecord model"
    )
    
    # Mapping metadata
    confidence_score = models.FloatField(
        validators=[MinValueValidator(0.0), MaxValueValidator(100.0)],
        help_text="Confidence score for this mapping (0-100)"
    )
    status = models.CharField(
        max_length=20,
        choices=MAPPING_STATUS_CHOICES,
        default='pending'
    )
    
    # Processing results
    records_processed = models.IntegerField(default=0)
    processing_errors = models.JSONField(
        default=list,
        help_text="List of processing errors encountered"
    )
    sample_values = models.JSONField(
        default=list,
        help_text="Sample values from the source column"
    )
    
    # Admin actions
    reviewed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_mappings'
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    admin_notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'analytics_dataset_column_mappings'
        ordering = ['-confidence_score', 'source_column']
        unique_together = ['dataset', 'source_column']
        indexes = [
            models.Index(fields=['dataset', 'status']),
            models.Index(fields=['target_field']),
            models.Index(fields=['confidence_score']),
            models.Index(fields=['status', 'reviewed_at']),
        ]
    
    def __str__(self):
        return f"{self.dataset.name}: {self.source_column} → {self.target_field}"
    
    def mark_confirmed(self, user):
        """Mark mapping as confirmed by admin"""
        self.status = 'confirmed'
        self.reviewed_by = user
        self.reviewed_at = timezone.now()
        self.save()
        
        # Update rule success rate if applicable
        if self.mapping_rule:
            # This would be implemented with proper statistics tracking
            pass
    
    def mark_rejected(self, user, reason=""):
        """Mark mapping as rejected"""
        self.status = 'rejected'
        self.reviewed_by = user
        self.reviewed_at = timezone.now()
        if reason:
            self.admin_notes = reason
        self.save()


class DynamicPatentField(models.Model):
    """
    Tracks dynamically created fields in the PatentRecord model
    Used for managing schema evolution and field metadata
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    field_name = models.CharField(
        max_length=100,
        unique=True,
        help_text="Name of the field in PatentRecord model"
    )
    field_type = models.CharField(
        max_length=50,
        choices=ColumnMappingRule.FIELD_TYPE_CHOICES
    )
    field_params = models.JSONField(
        default=dict,
        help_text="Field parameters used in model definition"
    )
    
    # Metadata
    display_name = models.CharField(
        max_length=200,
        help_text="Human-readable field name"
    )
    description = models.TextField(blank=True)
    
    # Usage tracking
    datasets_using = models.ManyToManyField(
        PatentDataset,
        blank=True,
        related_name='dynamic_fields_used'
    )
    total_records = models.IntegerField(
        default=0,
        help_text="Total number of records with this field populated"
    )
    
    # Management
    is_active = models.BooleanField(default=True)
    migration_applied = models.BooleanField(
        default=False,
        help_text="Whether Django migration has been created and applied"
    )
    migration_name = models.CharField(max_length=255, blank=True)
    
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'analytics_dynamic_patent_fields'
        ordering = ['field_name']
    
    def __str__(self):
        return f"{self.display_name} ({self.field_name})"


class ResearchQuery(models.Model):
    """
    Stores patent research queries and their metadata for a project
    """
    
    API_SOURCES = [
        ('uspto', 'USPTO PatentsView API'),
        ('uspto_odp', 'USPTO Open Data Portal'),
        ('epo', 'European Patent Office API'),
        ('wipo', 'WIPO Global Brand Database'),
        ('lens', 'The Lens Patent Database'),
        ('google_patents', 'Google Patents Public Data'),
    ]
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('running', 'Running'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(
        AnalyticsProject,
        on_delete=models.CASCADE,
        related_name='research_queries'
    )
    
    # Query details
    query_name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    api_source = models.CharField(max_length=50, choices=API_SOURCES)
    
    # Search parameters
    keywords = models.TextField(help_text="Search keywords and phrases")
    ipc_classes = models.JSONField(
        default=list,
        help_text="International Patent Classification codes"
    )
    cpc_classes = models.JSONField(
        default=list,
        help_text="Cooperative Patent Classification codes"
    )
    assignees = models.JSONField(
        default=list,
        help_text="Patent assignee organizations"
    )
    inventors = models.JSONField(
        default=list,
        help_text="Patent inventor names"
    )
    date_range = models.JSONField(
        default=dict,
        help_text="Date range filters (from_date, to_date)"
    )
    geographic_scope = models.JSONField(
        default=list,
        help_text="Country/region filters"
    )
    additional_filters = models.JSONField(
        default=dict,
        help_text="Additional API-specific filters"
    )
    
    # Results tracking
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    total_results = models.IntegerField(default=0)
    processed_results = models.IntegerField(default=0)
    execution_time = models.FloatField(null=True, blank=True, help_text="Query execution time in seconds")
    
    # Error handling
    error_message = models.TextField(blank=True)
    retry_count = models.IntegerField(default=0)
    last_executed_at = models.DateTimeField(null=True, blank=True)
    
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Watch & automation fields
    is_watch = models.BooleanField(default=False, help_text='Whether this query is saved as a watch for periodic re-run')
    watch_cadence = models.CharField(
        max_length=20, blank=True, default='',
        choices=[('', 'Not watched'), ('daily', 'Daily'), ('weekly', 'Weekly'), ('monthly', 'Monthly')],
        help_text='How often to re-run this watch query'
    )
    alert_thresholds = models.JSONField(
        default=dict, blank=True,
        help_text='Alert conditions: {"new_patents_min": 5, "new_assignee": true, "white_space_change": true}'
    )
    last_watch_run = models.DateTimeField(null=True, blank=True, help_text='When the watch was last run')
    watch_diff = models.JSONField(default=dict, blank=True, help_text='Diff from last watch run')

    class Meta:
        db_table = 'analytics_research_queries'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['project', 'status']),
            models.Index(fields=['api_source']),
            models.Index(fields=['created_at']),
            models.Index(fields=['is_watch', 'watch_cadence']),
        ]
    
    def __str__(self):
        return f"{self.project.name}: {self.query_name}"


class ResearchResult(models.Model):
    """
    Stores individual patent results from research queries
    """
    
    RELEVANCE_CHOICES = [
        ('high', 'High Relevance'),
        ('medium', 'Medium Relevance'),
        ('low', 'Low Relevance'),
        ('not_relevant', 'Not Relevant'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    query = models.ForeignKey(
        ResearchQuery,
        on_delete=models.CASCADE,
        related_name='results'
    )
    
    # Patent identifiers
    patent_id = models.CharField(max_length=100, db_index=True)
    publication_number = models.CharField(max_length=100, blank=True)
    application_number = models.CharField(max_length=100, blank=True)
    
    # Patent details
    title = models.TextField()
    abstract = models.TextField(blank=True)
    assignee = models.CharField(max_length=500, blank=True)
    inventors = models.JSONField(default=list)
    
    # Classifications
    ipc_classes = models.JSONField(default=list)
    cpc_classes = models.JSONField(default=list)
    
    # Dates
    publication_date = models.DateField(null=True, blank=True)
    application_date = models.DateField(null=True, blank=True)
    priority_date = models.DateField(null=True, blank=True)
    
    # Geographic info
    jurisdiction = models.CharField(max_length=10, blank=True)
    
    # Relevance and selection
    relevance_score = models.FloatField(
        null=True, 
        blank=True,
        help_text="AI-computed relevance score (0-1)"
    )
    manual_relevance = models.CharField(
        max_length=20,
        choices=RELEVANCE_CHOICES,
        blank=True,
        help_text="Manual relevance rating by user"
    )
    is_selected = models.BooleanField(
        default=False,
        help_text="Selected for dataset creation"
    )
    
    # Raw API data
    raw_data = models.JSONField(
        default=dict,
        help_text="Complete raw response from patent API"
    )
    
    # Processing metadata
    processed_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'analytics_research_results'
        ordering = ['-relevance_score', '-publication_date']
        unique_together = ['query', 'patent_id']
        indexes = [
            models.Index(fields=['query', 'is_selected']),
            models.Index(fields=['patent_id']),
            models.Index(fields=['assignee']),
            models.Index(fields=['publication_date']),
            models.Index(fields=['relevance_score']),
        ]
    
    def __str__(self):
        return f"{self.patent_id}: {self.title[:50]}..."


class ResearchSession(models.Model):
    """
    Groups multiple research queries for analytical purposes
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(
        AnalyticsProject,
        on_delete=models.CASCADE,
        related_name='research_sessions'
    )
    
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    
    # Session analytics
    total_queries = models.IntegerField(default=0)
    total_results = models.IntegerField(default=0)
    unique_patents = models.IntegerField(default=0)
    
    # Time tracking
    session_start = models.DateTimeField(auto_now_add=True)
    session_end = models.DateTimeField(null=True, blank=True)
    
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    
    class Meta:
        db_table = 'analytics_research_sessions'
        ordering = ['-session_start']
    
    def __str__(self):
        return f"{self.project.name}: {self.name}"


# ============================================================================
# PATENT API CONFIGURATION MODEL
# ============================================================================

class PatentAPIConfiguration(models.Model):
    """
    Stores external patent API configurations (base URL, credentials, mappings).
    Auth credentials are signed with Django's Signer before storage.
    """

    AUTH_TYPE_CHOICES = [
        ('none', 'No Authentication'),
        ('api_key', 'API Key'),
        ('bearer', 'Bearer Token'),
        ('basic', 'Basic Auth'),
        ('oauth2', 'OAuth 2.0'),
    ]

    TEST_STATUS_CHOICES = [
        ('never', 'Never Tested'),
        ('passed', 'Passed'),
        ('failed', 'Failed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True, help_text='Unique machine-readable name')
    display_name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    base_url = models.URLField(max_length=500)

    auth_type = models.CharField(max_length=20, choices=AUTH_TYPE_CHOICES, default='none')
    auth_config = models.JSONField(
        default=dict, blank=True,
        help_text='Signed credentials (API keys are stored signed)',
    )

    rate_limit = models.JSONField(
        default=dict, blank=True,
        help_text='{"requests_per_minute": 60, "requests_per_day": 10000}',
    )
    is_active = models.BooleanField(default=True)

    query_mappings = models.JSONField(default=dict, blank=True)
    response_mappings = models.JSONField(default=dict, blank=True)
    query_templates = models.JSONField(default=dict, blank=True)

    test_query = models.TextField(blank=True)
    last_tested = models.DateTimeField(null=True, blank=True)
    test_status = models.CharField(
        max_length=10, choices=TEST_STATUS_CHOICES, default='never',
    )

    created_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'analytics_patent_api_configurations'
        ordering = ['display_name']

    def __str__(self):
        return self.display_name


# ============================================================================
# BRAINSTORMING MODELS - World-Class Research Intelligence System
# ============================================================================

class BrainstormingSession(models.Model):
    """
    Main brainstorming session that coordinates all research activities
    """
    
    SESSION_STATUS_CHOICES = [
        ('active', 'Active'),
        ('paused', 'Paused'),
        ('completed', 'Completed'),
        ('archived', 'Archived'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(
        AnalyticsProject,
        on_delete=models.CASCADE,
        related_name='brainstorming_sessions'
    )
    
    # Session metadata
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=SESSION_STATUS_CHOICES, default='active')
    
    # Research focus
    research_objective = models.TextField(help_text="Primary research objective")
    target_domain = models.CharField(max_length=255, blank=True, help_text="Technology domain")
    research_scope = models.JSONField(
        default=dict,
        help_text="Scope definition: geographic, temporal, technical"
    )
    
    # Session progress tracking
    completion_percentage = models.IntegerField(default=0)
    total_ideas = models.IntegerField(default=0)
    total_keywords = models.IntegerField(default=0)
    total_concepts = models.IntegerField(default=0)
    total_strategies = models.IntegerField(default=0)
    
    # Collaboration
    # participants = models.ManyToManyField(
    #     User, 
    #     through='BrainstormingParticipant',
    #     related_name='brainstorming_participations'
    # )
    
    # Timestamps
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    last_activity = models.DateTimeField(auto_now=True)
    
    created_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True,
        related_name='created_brainstorming_sessions'
    )
    
    class Meta:
        db_table = 'analytics_brainstorming_sessions'
        ordering = ['-started_at']
        indexes = [
            models.Index(fields=['project', 'status']),
            models.Index(fields=['started_at']),
        ]
    
    def __str__(self):
        return f"{self.project.name}: {self.name}"


class BrainstormingParticipant(models.Model):
    """
    Tracks user participation in brainstorming sessions
    """
    
    ROLE_CHOICES = [
        ('facilitator', 'Facilitator'),
        ('researcher', 'Researcher'),
        ('analyst', 'Analyst'),
        ('observer', 'Observer'),
    ]
    
    # session = models.ForeignKey(BrainstormingSession, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='researcher')
    joined_at = models.DateTimeField(auto_now_add=True)
    contribution_score = models.IntegerField(default=0)
    
    class Meta:
        db_table = 'analytics_brainstorming_participants'
        # unique_together = ['session', 'user']


class IdeationRecord(models.Model):
    """
    Captures and organizes research ideas and insights
    """
    
    IDEA_TYPES = [
        ('concept', 'Research Concept'),
        ('problem', 'Problem Statement'),
        ('solution', 'Solution Approach'),
        ('feature', 'Feature/Functionality'),
        ('question', 'Research Question'),
        ('hypothesis', 'Hypothesis'),
        ('insight', 'Key Insight'),
    ]
    
    PRIORITY_LEVELS = [
        ('critical', 'Critical'),
        ('high', 'High'),
        ('medium', 'Medium'),
        ('low', 'Low'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('under_review', 'Under Review'),
        ('approved', 'Approved'),
        ('implemented', 'Implemented'),
        ('archived', 'Archived'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(
        BrainstormingSession,
        on_delete=models.CASCADE,
        related_name='ideas'
    )
    
    # Idea content
    title = models.CharField(max_length=255)
    description = models.TextField()
    idea_type = models.CharField(max_length=20, choices=IDEA_TYPES)
    priority = models.CharField(max_length=20, choices=PRIORITY_LEVELS, default='medium')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    
    # Categorization
    tags = models.JSONField(default=list, help_text="Searchable tags")
    categories = models.JSONField(default=list, help_text="Thematic categories")
    
    # Relationships
    parent_idea = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True)
    related_ideas = models.ManyToManyField('self', blank=True)
    
    # Metadata
    is_pinned = models.BooleanField(default=False)
    votes_up = models.IntegerField(default=0)
    votes_down = models.IntegerField(default=0)
    
    # Attachments and references
    attachments = models.JSONField(default=list, help_text="File attachments")
    references = models.JSONField(default=list, help_text="External references")
    
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_ideation_records')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'analytics_ideation_records'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['session', 'status']),
            models.Index(fields=['idea_type', 'priority']),
        ]
    
    def __str__(self):
        return f"{self.session.name}: {self.title}"


class KeywordGeneration(models.Model):
    """
    Advanced keyword generation and management system
    """
    
    GENERATION_METHODS = [
        ('manual', 'Manual Entry'),
        ('ai_generated', 'AI Generated'),
        ('extracted', 'Text Extracted'),
        ('synonym_expansion', 'Synonym Expansion'),
        ('patent_analysis', 'Patent Analysis'),
    ]
    
    KEYWORD_CATEGORIES = [
        ('primary', 'Primary Keywords'),
        ('secondary', 'Secondary Keywords'),
        ('technical', 'Technical Terms'),
        ('product', 'Product Names'),
        ('company', 'Company Names'),
        ('inventor', 'Inventor Names'),
        ('classification', 'Classification Codes'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(
        BrainstormingSession,
        on_delete=models.CASCADE,
        related_name='keyword_generations'
    )
    
    # Keyword data
    keyword = models.CharField(max_length=255)
    variations = models.JSONField(default=list, help_text="Keyword variations and synonyms")
    translations = models.JSONField(default=dict, help_text="Translations in different languages")
    
    # Classification
    category = models.CharField(max_length=20, choices=KEYWORD_CATEGORIES)
    generation_method = models.CharField(max_length=20, choices=GENERATION_METHODS)
    
    # Metadata
    frequency_score = models.FloatField(default=0.0, help_text="Frequency in patent literature")
    relevance_score = models.FloatField(default=0.0, help_text="Relevance to research objective")
    search_volume = models.IntegerField(default=0, help_text="Estimated search volume")
    
    # Grouping
    keyword_group = models.CharField(max_length=255, blank=True)
    group_color = models.CharField(max_length=7, default='#3B82F6')  # Hex color
    
    # Status
    is_active = models.BooleanField(default=True)
    is_validated = models.BooleanField(default=False)
    
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_keyword_generations')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'analytics_keyword_generations'
        ordering = ['-relevance_score', '-created_at']
        indexes = [
            models.Index(fields=['session', 'category']),
            models.Index(fields=['keyword']),
        ]
        unique_together = ['session', 'keyword']
    
    def __str__(self):
        return f"{self.session.name}: {self.keyword}"


class ConceptMapping(models.Model):
    """
    Maps relationships between research concepts and ideas
    """
    
    RELATIONSHIP_TYPES = [
        ('parent_child', 'Parent-Child'),
        ('sibling', 'Sibling'),
        ('dependency', 'Dependency'),
        ('conflict', 'Conflict'),
        ('complement', 'Complement'),
        ('alternative', 'Alternative'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(
        BrainstormingSession,
        on_delete=models.CASCADE,
        related_name='concept_maps'
    )
    
    # Concept identification
    concept_name = models.CharField(max_length=255)
    concept_description = models.TextField(blank=True)
    
    # Relationships
    related_concepts = models.ManyToManyField('self', through='ConceptRelationship', symmetrical=False)
    linked_ideas = models.ManyToManyField(IdeationRecord, blank=True)
    linked_keywords = models.ManyToManyField(KeywordGeneration, blank=True)
    
    # Positioning (for visualization)
    position_x = models.FloatField(default=0.0)
    position_y = models.FloatField(default=0.0)
    
    # Metadata
    importance_score = models.FloatField(default=0.0)
    complexity_level = models.IntegerField(default=1, help_text="1-10 complexity scale")
    
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_concept_mappings')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'analytics_concept_mappings'
        ordering = ['-importance_score']
        unique_together = ['session', 'concept_name']
    
    def __str__(self):
        return f"{self.session.name}: {self.concept_name}"


class ConceptRelationship(models.Model):
    """
    Defines relationships between concepts
    """
    
    from_concept = models.ForeignKey(
        ConceptMapping, 
        on_delete=models.CASCADE, 
        related_name='outgoing_relationships'
    )
    to_concept = models.ForeignKey(
        ConceptMapping, 
        on_delete=models.CASCADE, 
        related_name='incoming_relationships'
    )
    relationship_type = models.CharField(
        max_length=20, 
        choices=ConceptMapping.RELATIONSHIP_TYPES
    )
    strength = models.FloatField(default=1.0, help_text="Relationship strength 0-1")
    description = models.TextField(blank=True)
    
    class Meta:
        db_table = 'analytics_concept_relationships'
        unique_together = ['from_concept', 'to_concept', 'relationship_type']


class ResearchStrategy(models.Model):
    """
    Comprehensive research strategy definitions and planning
    """
    
    STRATEGY_TYPES = [
        ('comprehensive', 'Comprehensive Search'),
        ('targeted', 'Targeted Search'),
        ('competitive', 'Competitive Analysis'),
        ('landscape', 'Technology Landscape'),
        ('freedom_to_operate', 'Freedom to Operate'),
        ('prior_art', 'Prior Art Search'),
        ('patent_family', 'Patent Family Analysis'),
    ]
    
    STRATEGY_STATUS = [
        ('draft', 'Draft'),
        ('ready', 'Ready'),
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('archived', 'Archived'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(
        BrainstormingSession,
        on_delete=models.CASCADE,
        related_name='research_strategies'
    )
    
    # Strategy definition
    name = models.CharField(max_length=255)
    description = models.TextField()
    strategy_type = models.CharField(max_length=20, choices=STRATEGY_TYPES)
    status = models.CharField(max_length=20, choices=STRATEGY_STATUS, default='draft')
    
    # Strategy components
    search_domains = models.JSONField(default=list, help_text="Technology domains to search")
    api_preferences = models.JSONField(default=list, help_text="Preferred patent databases")
    geographic_focus = models.JSONField(default=list, help_text="Geographic regions")
    temporal_scope = models.JSONField(default=dict, help_text="Time range parameters")
    
    # Search parameters
    primary_keywords = models.ManyToManyField(KeywordGeneration, related_name='primary_strategies')
    secondary_keywords = models.ManyToManyField(KeywordGeneration, related_name='secondary_strategies')
    concepts = models.ManyToManyField(ConceptMapping, blank=True)
    
    # Advanced filters
    classification_codes = models.JSONField(default=list)
    assignee_filters = models.JSONField(default=list)
    inventor_filters = models.JSONField(default=list)
    legal_status_filters = models.JSONField(default=list)
    
    # Execution planning
    estimated_results = models.IntegerField(default=0)
    estimated_time = models.IntegerField(default=0, help_text="Estimated time in minutes")
    priority_level = models.IntegerField(default=3, help_text="1-5 priority scale")
    
    # Results tracking
    actual_results = models.IntegerField(default=0)
    execution_time = models.IntegerField(default=0, help_text="Actual time in minutes")
    success_rate = models.FloatField(default=0.0)
    
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_research_strategies')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'analytics_research_strategies'
        ordering = ['-priority_level', '-created_at']
        indexes = [
            models.Index(fields=['session', 'status']),
            models.Index(fields=['strategy_type']),
        ]
    
    def __str__(self):
        return f"{self.session.name}: {self.name}"


class CompetitorAnalysis(models.Model):
    """
    Comprehensive competitor analysis and intelligence
    """
    
    COMPETITOR_TYPES = [
        ('direct', 'Direct Competitor'),
        ('indirect', 'Indirect Competitor'),
        ('potential', 'Potential Competitor'),
        ('supplier', 'Supplier'),
        ('customer', 'Customer'),
        ('research_institution', 'Research Institution'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(
        BrainstormingSession,
        on_delete=models.CASCADE,
        related_name='competitor_analyses'
    )
    
    # Competitor identification
    company_name = models.CharField(max_length=255)
    competitor_type = models.CharField(max_length=25, choices=COMPETITOR_TYPES)
    
    # Company details
    description = models.TextField(blank=True)
    headquarters = models.CharField(max_length=255, blank=True)
    website = models.URLField(blank=True)
    founded_year = models.IntegerField(null=True, blank=True)
    employee_count = models.CharField(max_length=50, blank=True)
    revenue = models.CharField(max_length=100, blank=True)
    
    # Patent portfolio analysis
    total_patents = models.IntegerField(default=0)
    active_patents = models.IntegerField(default=0)
    patent_applications = models.IntegerField(default=0)
    key_inventors = models.JSONField(default=list)
    technology_areas = models.JSONField(default=list)
    
    # Strategic analysis
    strengths = models.JSONField(default=list)
    weaknesses = models.JSONField(default=list)
    opportunities = models.JSONField(default=list)
    threats = models.JSONField(default=list)
    
    # Research focus areas
    research_domains = models.JSONField(default=list)
    patent_strategy = models.TextField(blank=True)
    
    # Competitive positioning
    market_position = models.CharField(max_length=50, blank=True)
    competitive_advantage = models.TextField(blank=True)
    threat_level = models.IntegerField(default=3, help_text="1-5 threat assessment")
    
    # Analysis metadata
    analysis_date = models.DateTimeField(auto_now_add=True)
    last_updated = models.DateTimeField(auto_now=True)
    data_sources = models.JSONField(default=list)
    
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_competitor_analyses')
    
    class Meta:
        db_table = 'analytics_competitor_analyses'
        ordering = ['-threat_level', '-total_patents']
        indexes = [
            models.Index(fields=['session', 'competitor_type']),
            models.Index(fields=['company_name']),
        ]
        unique_together = ['session', 'company_name']
    
    def __str__(self):
        return f"{self.session.name}: {self.company_name}"


class AIInteraction(models.Model):
    """
    Tracks AI assistant interactions and generated insights
    """
    
    INTERACTION_TYPES = [
        ('keyword_generation', 'Keyword Generation'),
        ('concept_extraction', 'Concept Extraction'),
        ('strategy_suggestion', 'Strategy Suggestion'),
        ('competitor_analysis', 'Competitor Analysis'),
        ('patent_analysis', 'Patent Analysis'),
        ('question_answer', 'Question & Answer'),
        ('idea_evaluation', 'Idea Evaluation'),
    ]
    
    QUALITY_RATINGS = [
        (1, 'Poor'),
        (2, 'Below Average'),
        (3, 'Average'),
        (4, 'Good'),
        (5, 'Excellent'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(
        BrainstormingSession,
        on_delete=models.CASCADE,
        related_name='ai_interactions'
    )
    
    # Interaction details
    interaction_type = models.CharField(max_length=25, choices=INTERACTION_TYPES)
    user_prompt = models.TextField()
    ai_response = models.TextField()
    
    # Context
    context_data = models.JSONField(default=dict, help_text="Contextual data for the interaction")
    
    # Quality assessment
    user_rating = models.IntegerField(
        null=True, 
        blank=True, 
        choices=QUALITY_RATINGS
    )
    is_helpful = models.BooleanField(null=True, blank=True)
    feedback_notes = models.TextField(blank=True)
    
    # Processing metadata
    processing_time = models.FloatField(default=0.0, help_text="AI processing time in seconds")
    model_used = models.CharField(max_length=100, blank=True)
    confidence_score = models.FloatField(default=0.0)
    
    # Result application
    applied_to_research = models.BooleanField(default=False)
    generated_keywords = models.ManyToManyField(KeywordGeneration, blank=True)
    generated_ideas = models.ManyToManyField(IdeationRecord, blank=True)
    
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_ai_interactions')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'analytics_ai_interactions'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['session', 'interaction_type']),
            models.Index(fields=['user_rating']),
        ]
    
    def __str__(self):
        return f"{self.session.name}: {self.interaction_type}"


# ============================================================
# AGENTIC PATENT DISCOVERY MODELS
# ============================================================

class AgentConfiguration(models.Model):
    """
    Configuration for each agent in the patent discovery pipeline
    """
    
    AGENT_TYPES = [
        ('preprocessor', 'Preprocessor Agent'),
        ('entity_extraction', 'Entity Extraction Agent'),
        ('relationship_extraction', 'Relationship Extraction Agent'),
        ('normalization', 'Normalization Agent'),
        ('graph_builder', 'Graph Builder Agent'),
        ('clustering', 'Clustering Agent'),
    ]
    
    INPUT_SOURCES = [
        ('claims', 'Claims Only'),
        ('abstract', 'Abstract Only'),
        ('description', 'Description Only'),
        ('claims_abstract', 'Claims and Abstract'),
        ('all', 'All Fields'),
    ]
    
    PROCESSING_PROFILES = [
        ('quick', 'Quick Scan'),
        ('standard', 'Standard Analysis'),
        ('deep', 'Deep Analysis'),
        ('legal', 'Legal Focus'),
        ('technical', 'Technical Focus'),
        ('custom', 'Custom Configuration'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    
    # Configuration
    agent_type = models.CharField(max_length=50, choices=AGENT_TYPES)
    input_source = models.CharField(max_length=50, choices=INPUT_SOURCES, default='all')
    processing_profile = models.CharField(max_length=50, choices=PROCESSING_PROFILES, default='standard')
    
    # Agent-specific settings (JSON for flexibility)
    config_params = models.JSONField(default=dict, help_text="""
        Entity Agent: min_confidence, entity_types, extraction_methods
        Relationship Agent: relationship_types, max_depth, confidence_threshold
        Normalization Agent: similarity_threshold, ontologies, embedding_model
        Graph Agent: node_importance_algorithm, edge_weight_calculation
        Clustering Agent: num_clusters, clustering_dimensions, algorithm
    """)
    
    # Thresholds
    confidence_threshold = models.FloatField(default=0.7, validators=[MinValueValidator(0.0), MaxValueValidator(1.0)])
    
    # Metadata
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='agent_configs')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'analytics_agent_configurations'
        ordering = ['agent_type', '-created_at']
        unique_together = ['name', 'agent_type']
    
    def __str__(self):
        return f"{self.name} ({self.get_agent_type_display()})"


class PatentEntityExtraction(models.Model):
    """
    Extracted entities from patent documents
    """
    
    ENTITY_TYPES = [
        ('component', 'Component'),
        ('process', 'Process'),
        ('material', 'Material'),
        ('application', 'Application'),
        ('parameter', 'Parameter'),
        ('system', 'System'),
        ('method', 'Method'),
        ('property', 'Property'),
        ('measurement', 'Measurement'),
        ('condition', 'Condition'),
    ]
    
    EXTRACTION_METHODS = [
        ('nlp_spacy', 'SpaCy NLP'),
        ('nlp_nltk', 'NLTK'),
        ('llm_gpt', 'GPT LLM'),
        ('llm_claude', 'Claude LLM'),
        ('regex', 'Regex Pattern'),
        ('dictionary', 'Dictionary Lookup'),
        ('hybrid', 'Hybrid Approach'),
    ]
    
    SOURCE_FIELDS = [
        ('title', 'Title'),
        ('abstract', 'Abstract'),
        ('claims', 'Claims'),
        ('description', 'Description'),
        ('summary', 'Summary'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patent_record = models.ForeignKey(PatentRecord, on_delete=models.CASCADE, related_name='extracted_entities')
    
    # Entity information
    entity_text = models.CharField(max_length=500)
    entity_type = models.CharField(max_length=20, choices=ENTITY_TYPES)
    normalized_form = models.CharField(max_length=500, blank=True, help_text="Normalized/canonical form of entity")
    
    # Extraction metadata
    source_field = models.CharField(max_length=20, choices=SOURCE_FIELDS)
    source_text = models.TextField(help_text="Context where entity was found")
    position_start = models.IntegerField(null=True, blank=True)
    position_end = models.IntegerField(null=True, blank=True)
    
    # Quality metrics
    confidence_score = models.FloatField(validators=[MinValueValidator(0.0), MaxValueValidator(1.0)])
    extraction_method = models.CharField(max_length=20, choices=EXTRACTION_METHODS)
    extraction_agent = models.CharField(max_length=50, blank=True)
    
    # Additional attributes
    attributes = models.JSONField(default=dict, help_text="Additional entity attributes")
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'analytics_patent_entity_extractions'
        ordering = ['-confidence_score', 'entity_type']
        indexes = [
            models.Index(fields=['patent_record', 'entity_type']),
            models.Index(fields=['normalized_form']),
            models.Index(fields=['confidence_score']),
        ]
    
    def __str__(self):
        return f"{self.entity_text} ({self.entity_type}) - {self.patent_record.patent_id}"


class PatentTriplet(models.Model):
    """
    Entity-Relationship-Entity triplets extracted from patents
    """
    
    RELATIONSHIP_TYPES = [
        ('comprises', 'Comprises'),
        ('includes', 'Includes'),
        ('connects_to', 'Connects To'),
        ('operates_with', 'Operates With'),
        ('controls', 'Controls'),
        ('generates', 'Generates'),
        ('measures', 'Measures'),
        ('configured_to', 'Configured To'),
        ('coupled_to', 'Coupled To'),
        ('transforms', 'Transforms'),
        ('improves', 'Improves'),
        ('replaces', 'Replaces'),
        ('enables', 'Enables'),
        ('prevents', 'Prevents'),
        ('optimizes', 'Optimizes'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patent_record = models.ForeignKey(PatentRecord, on_delete=models.CASCADE, related_name='triplets')
    
    # Triplet components
    subject_entity = models.ForeignKey(PatentEntityExtraction, on_delete=models.CASCADE, related_name='subject_triplets')
    predicate = models.CharField(max_length=50, choices=RELATIONSHIP_TYPES)
    object_entity = models.ForeignKey(PatentEntityExtraction, on_delete=models.CASCADE, related_name='object_triplets')
    
    # Original text
    source_sentence = models.TextField(help_text="Original sentence containing the relationship")
    
    # Quality metrics
    confidence_score = models.FloatField(validators=[MinValueValidator(0.0), MaxValueValidator(1.0)])
    extraction_agent = models.CharField(max_length=50)
    extraction_method = models.CharField(max_length=50)
    
    # Additional context
    context = models.JSONField(default=dict, help_text="Additional context and metadata")
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'analytics_patent_triplets'
        ordering = ['-confidence_score']
        indexes = [
            models.Index(fields=['patent_record', 'predicate']),
            models.Index(fields=['subject_entity', 'object_entity']),
            models.Index(fields=['confidence_score']),
        ]
    
    def __str__(self):
        return f"{self.subject_entity.entity_text} -> {self.predicate} -> {self.object_entity.entity_text}"
    
    def to_dict(self):
        """Convert triplet to dictionary for API responses"""
        return {
            'id': str(self.id),
            'subject': self.subject_entity.entity_text,
            'subject_type': self.subject_entity.entity_type,
            'predicate': self.predicate,
            'object': self.object_entity.entity_text,
            'object_type': self.object_entity.entity_type,
            'confidence': self.confidence_score,
            'source': self.source_sentence[:200] + '...' if len(self.source_sentence) > 200 else self.source_sentence
        }


class ProcessingPipeline(models.Model):
    """
    Tracks the processing pipeline for patent analysis
    """
    
    PIPELINE_STAGES = [
        ('queued', 'Queued'),
        ('preprocessing', 'Preprocessing'),
        ('entity_extraction', 'Entity Extraction'),
        ('relationship_extraction', 'Relationship Extraction'),
        ('normalization', 'Normalization'),
        ('graph_building', 'Graph Building'),
        ('clustering', 'Clustering'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    dataset = models.ForeignKey(PatentDataset, on_delete=models.CASCADE, related_name='processing_pipelines')
    agent_config = models.ForeignKey(AgentConfiguration, on_delete=models.SET_NULL, null=True, related_name='pipelines')
    
    # Pipeline status
    current_stage = models.CharField(max_length=50, choices=PIPELINE_STAGES, default='queued')
    stage_status = models.JSONField(default=dict, help_text="Status for each stage")
    
    # Progress tracking
    total_patents = models.IntegerField(default=0)
    processed_patents = models.IntegerField(default=0)
    failed_patents = models.IntegerField(default=0)
    
    # Results summary
    total_entities = models.IntegerField(default=0)
    total_triplets = models.IntegerField(default=0)
    unique_relationships = models.IntegerField(default=0)
    
    # Processing metrics
    start_time = models.DateTimeField(null=True, blank=True)
    end_time = models.DateTimeField(null=True, blank=True)
    processing_time_seconds = models.IntegerField(null=True, blank=True)
    
    # Error tracking
    error_log = models.JSONField(default=list, help_text="List of errors during processing")
    
    # User tracking
    initiated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='initiated_pipelines')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'analytics_processing_pipelines'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['dataset', 'current_stage']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"Pipeline for {self.dataset.name} - {self.current_stage}"
    
    @property
    def progress_percentage(self):
        """Calculate overall progress percentage"""
        if self.total_patents == 0:
            return 0
        return int((self.processed_patents / self.total_patents) * 100)
    
    def update_stage(self, stage, status='processing', message=''):
        """Update pipeline stage status"""
        self.current_stage = stage
        if not self.stage_status:
            self.stage_status = {}
        self.stage_status[stage] = {
            'status': status,
            'message': message,
            'timestamp': timezone.now().isoformat()
        }
        self.save()


class PatentCluster(models.Model):
    """
    Clusters of related patents based on entity/relationship analysis
    """
    
    CLUSTER_TYPES = [
        ('technology', 'Technology Cluster'),
        ('application', 'Application Domain'),
        ('structural', 'Structural Components'),
        ('functional', 'Functional Processes'),
        ('temporal', 'Temporal Evolution'),
        ('assignee', 'Assignee Portfolio'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    pipeline = models.ForeignKey(ProcessingPipeline, on_delete=models.CASCADE, related_name='clusters')
    
    # Cluster information
    cluster_name = models.CharField(max_length=255)
    cluster_type = models.CharField(max_length=20, choices=CLUSTER_TYPES)
    description = models.TextField(blank=True)
    
    # Cluster metrics
    patent_count = models.IntegerField(default=0)
    coherence_score = models.FloatField(null=True, blank=True, validators=[MinValueValidator(0.0), MaxValueValidator(1.0)])
    
    # Key features
    key_entities = models.JSONField(default=list, help_text="Most important entities in cluster")
    key_relationships = models.JSONField(default=list, help_text="Most common relationships")
    representative_patents = models.JSONField(default=list, help_text="Most representative patent IDs")
    
    # Cluster visualization data
    centroid = models.JSONField(default=dict, help_text="Cluster centroid in embedding space")
    visualization_data = models.JSONField(default=dict, help_text="Data for visualization")
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'analytics_patent_clusters'
        ordering = ['-coherence_score', '-patent_count']
        indexes = [
            models.Index(fields=['pipeline', 'cluster_type']),
        ]
    
    def __str__(self):
        return f"{self.cluster_name} ({self.patent_count} patents)"


# ============================================================================
# TEMPLATE MODELS
# ============================================================================

class Template(models.Model):
    """
    Universal template model for charts, reports, dashboards, documents, and workflows
    """
    
    TEMPLATE_TYPES = [
        ('chart', 'Chart Template'),
        ('report', 'Report Template'),
        ('dashboard', 'Dashboard Template'),
        ('document', 'Document Template'),
        ('workflow', 'Workflow Template'),
    ]
    
    TEMPLATE_SCOPES = [
        ('organization', 'Organization'),
        ('team', 'Team'),
        ('personal', 'Personal'),
    ]
    
    CHART_TYPES = [
        ('line', 'Line Chart'),
        ('bar', 'Bar Chart'),
        ('pie', 'Pie Chart'),
        ('scatter', 'Scatter Plot'),
        ('heatmap', 'Heatmap'),
        ('network', 'Network Graph'),
        ('treemap', 'Treemap'),
        ('sankey', 'Sankey Diagram'),
        ('radar', 'Radar Chart'),
        ('bubble', 'Bubble Chart'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Basic information
    name = models.CharField(max_length=255)
    description = models.TextField()
    template_type = models.CharField(max_length=20, choices=TEMPLATE_TYPES)
    category = models.CharField(max_length=100)
    icon = models.CharField(max_length=50, default='Brain')  # Icon name from lucide-react
    
    # Access control
    scope = models.CharField(max_length=20, choices=TEMPLATE_SCOPES, default='personal')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='analytics_templates_created')
    organization = models.CharField(max_length=255, blank=True)  # For organization scope
    team = models.CharField(max_length=255, blank=True)  # For team scope
    
    # Metadata
    tags = models.JSONField(default=list, help_text="Searchable tags")
    version = models.CharField(max_length=20, default='1.0.0')
    is_active = models.BooleanField(default=True)
    is_public = models.BooleanField(default=False, help_text="Available to all users")
    
    # Usage tracking
    usage_count = models.IntegerField(default=0)
    last_used = models.DateTimeField(null=True, blank=True)
    
    # Configuration (JSON for flexibility across different template types)
    config = models.JSONField(default=dict, help_text="""
        For Chart: chart_type, x_axis, y_axis, color_by, aggregation, layout, styling
        For Report: sections, include_sections, formatting, export_options
        For Dashboard: layout, widgets, refresh_interval, filters
        For Document: sections, formatting, export_formats
        For Workflow: steps, conditions, actions, triggers
    """)
    
    # Chart-specific fields (only used when template_type='chart')
    chart_type = models.CharField(max_length=20, choices=CHART_TYPES, blank=True)
    
    # Report-specific fields (only used when template_type='report')
    report_type = models.CharField(max_length=50, blank=True)
    
    # Additional configuration
    filters = models.JSONField(default=dict, help_text="Default filters to apply")
    permissions = models.JSONField(default=dict, help_text="Permission settings")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'analytics_templates'
        ordering = ['-usage_count', '-created_at']
        indexes = [
            models.Index(fields=['template_type', 'scope']),
            models.Index(fields=['created_by', 'is_active']),
            models.Index(fields=['category']),
            models.Index(fields=['name']),
        ]
        unique_together = ['name', 'created_by', 'template_type']
    
    def __str__(self):
        return f"{self.name} ({self.get_template_type_display()})"
    
    def increment_usage(self):
        """Increment usage count and update last used timestamp"""
        self.usage_count += 1
        self.last_used = timezone.now()
        self.save(update_fields=['usage_count', 'last_used'])
    
    def duplicate(self, new_name, user):
        """Create a duplicate of this template"""
        duplicate = Template(
            name=new_name,
            description=self.description,
            template_type=self.template_type,
            category=self.category,
            icon=self.icon,
            scope='personal',  # Duplicates start as personal
            created_by=user,
            tags=self.tags.copy() if self.tags else [],
            version='1.0.0',
            config=self.config.copy() if self.config else {},
            chart_type=self.chart_type,
            report_type=self.report_type,
            filters=self.filters.copy() if self.filters else {},
        )
        duplicate.save()
        return duplicate
    
    def can_edit(self, user):
        """Check if user can edit this template"""
        if self.created_by == user:
            return True
        if self.scope == 'organization' and user.is_staff:
            return True
        return False
    
    def can_view(self, user):
        """Check if user can view this template"""
        if self.is_public:
            return True
        if self.created_by == user:
            return True
        if self.scope == 'organization':
            return True  # All organization members can view
        if self.scope == 'team':
            # Would need team membership check
            return True
        return False


class TemplateUsageLog(models.Model):
    """
    Track template usage for analytics and recommendations
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    template = models.ForeignKey(Template, on_delete=models.CASCADE, related_name='usage_logs')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    project = models.ForeignKey(AnalyticsProject, on_delete=models.CASCADE, null=True, blank=True)
    
    # Usage context
    context = models.JSONField(default=dict, help_text="Context of template usage")
    modifications = models.JSONField(default=dict, help_text="Modifications made to template")
    
    # Timestamps
    used_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'analytics_template_usage_logs'
        ordering = ['-used_at']
        indexes = [
            models.Index(fields=['template', 'user']),
            models.Index(fields=['used_at']),
        ]
    
    def __str__(self):
        return f"{self.template.name} used by {self.user} at {self.used_at}"


class PatentAnalysisResult(models.Model):
    """Stores structured AI analysis results for a patent application."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    application_id = models.CharField(max_length=64, db_index=True)
    patent_number = models.CharField(max_length=32, blank=True, default='')

    # Analysis metadata
    model_used = models.CharField(max_length=50, blank=True, default='')  # e.g., "claude-sonnet-4-6"
    analysis_version = models.CharField(max_length=10, default="1.0")
    total_input_tokens = models.IntegerField(default=0)
    total_output_tokens = models.IntegerField(default=0)
    total_cost_usd = models.DecimalField(max_digits=8, decimal_places=4, default=0)
    processing_time_seconds = models.FloatField(default=0)

    # Section results (each is a JSONField for flexibility)
    keywords = models.JSONField(default=dict)
    novel_elements = models.JSONField(default=dict)
    claim_scope = models.JSONField(default=dict)
    embodiments = models.JSONField(default=dict)
    background_analysis = models.JSONField(default=dict)
    claim_tree = models.JSONField(default=dict)
    means_plus_function = models.JSONField(default=dict)
    vulnerabilities = models.JSONField(default=dict)

    # Section-level status tracking
    section_status = models.JSONField(default=dict)

    # Prompt tracking — stores the exact prompts used and which category
    prompt_category = models.CharField(max_length=30, blank=True, default='general')
    prompts_used = models.JSONField(default=dict)  # {section_name: {prompt_text, template_id, version}}

    # Generic analysis storage — used by algorithm result persistence & family analysis
    analysis_type = models.CharField(max_length=60, blank=True, default='', db_index=True,
                                     help_text="e.g. landscape_analysis, family_analysis, investment_analysis")
    extracted_entities = models.JSONField(default=dict, blank=True,
                                         help_text="Full algorithm/analysis result payload")
    metadata = models.JSONField(default=dict, blank=True,
                                help_text="Contextual info: project name, who triggered, params")

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Link to user who triggered it
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='patent_analyses')

    class Meta:
        db_table = 'analytics_patent_analysis'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['application_id', '-created_at']),
        ]

    def __str__(self):
        return f"Analysis({self.application_id}, {self.model_used}, {self.created_at})"


class LLMProviderConfig(models.Model):
    """Stores API keys and configuration for LLM providers (Anthropic, OpenAI, etc.)."""

    PROVIDER_CHOICES = [
        ('anthropic', 'Anthropic (Claude)'),
        ('openai', 'OpenAI (GPT)'),
        ('google', 'Google (Gemini)'),
        ('cohere', 'Cohere'),
        ('mistral', 'Mistral AI'),
    ]

    # Known models per provider — used in admin help text and validation.
    # Leaving model_name blank uses the default for that provider.
    # Sourced from https://docs.anthropic.com/en/docs/about-claude/models/
    MODELS_BY_PROVIDER = {
        'anthropic': [
            # Current models (Claude 4.x family)
            ('claude-opus-4-8',           'Claude Opus 4.8  — $5/$25 MTok  — best coding & agentic tasks'),
            ('claude-opus-4-7',           'Claude Opus 4.7  — $5/$25 MTok'),
            ('claude-opus-4-6',           'Claude Opus 4.6  — $5/$25 MTok'),
            ('claude-opus-4-5',           'Claude Opus 4.5  — $5/$25 MTok'),
            ('claude-sonnet-4-6',         'Claude Sonnet 4.6 — $3/$15 MTok — recommended balance'),
            ('claude-sonnet-4-5',         'Claude Sonnet 4.5 — $3/$15 MTok'),
            ('claude-haiku-4-5-20251001', 'Claude Haiku 4.5  — $1/$5 MTok  — fastest, cheapest'),
            # Legacy (higher cost)
            ('claude-opus-4-1',           'Claude Opus 4.1  — $15/$75 MTok — legacy'),
        ],
        'openai': [
            ('gpt-4o',       'GPT-4o — flagship multimodal  — $2.50/$10 MTok'),
            ('gpt-4o-mini',  'GPT-4o Mini — fast & cheap    — $0.15/$0.60 MTok'),
            ('o3',           'o3 — advanced reasoning        — $2/$8 MTok'),
            ('o4-mini',      'o4-mini — fast reasoning       — $1.10/$4.40 MTok'),
        ],
        'google': [
            ('gemini-2.5-pro',   'Gemini 2.5 Pro   — most capable'),
            ('gemini-2.5-flash', 'Gemini 2.5 Flash — fast & cheap'),
            ('gemini-2.0-flash', 'Gemini 2.0 Flash — stable'),
        ],
        'mistral': [
            ('mistral-large-latest',  'Mistral Large  — most capable'),
            ('mistral-small-latest',  'Mistral Small  — fast & cheap'),
        ],
        'cohere': [
            ('command-r-plus', 'Command R+ — best quality'),
            ('command-r',      'Command R  — fast'),
        ],
    }

    # Default model used when model_name is blank
    DEFAULT_MODEL = {
        'anthropic': 'claude-sonnet-4-6',
        'openai':    'gpt-4o',
        'google':    'gemini-2.5-flash',
        'mistral':   'mistral-large-latest',
        'cohere':    'command-r-plus',
    }

    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    provider = models.CharField(max_length=30, choices=PROVIDER_CHOICES, unique=True)
    display_name = models.CharField(max_length=100)
    model_name = models.CharField(
        max_length=100,
        blank=True,
        default='',
        help_text='Leave blank to use the provider default. See MODELS_BY_PROVIDER for valid values.',
    )
    api_key = models.CharField(max_length=500)
    api_base_url = models.CharField(max_length=500, blank=True, default='')
    is_active = models.BooleanField(default=True)
    last_tested_at = models.DateTimeField(null=True, blank=True)
    test_status = models.CharField(
        max_length=10,
        choices=[('never', 'Never Tested'), ('passed', 'Passed'), ('failed', 'Failed')],
        default='never',
    )
    test_error = models.TextField(blank=True, default='')
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        db_table = 'analytics_llm_provider_config'
        ordering = ['provider']

    def __str__(self):
        model = self.resolved_model
        return f"{self.display_name} / {model} ({'active' if self.is_active else 'inactive'})"

    @property
    def resolved_model(self) -> str:
        """Return the configured model name, or the provider default if blank."""
        return self.model_name or self.DEFAULT_MODEL.get(self.provider, '')

    @property
    def masked_key(self):
        if not self.api_key or len(self.api_key) < 10:
            return '***'
        return f"{self.api_key[:4]}{'*' * 8}{self.api_key[-4:]}"

    @classmethod
    def get_key(cls, provider: str) -> str | None:
        try:
            config = cls.objects.get(provider=provider, is_active=True)
            return config.api_key
        except cls.DoesNotExist:
            return None


class AnalysisPromptTemplate(models.Model):
    """Versioned, categorized prompt templates for patent analysis sections."""

    SECTION_CHOICES = [
        ('keywords', 'Keyword Extraction'),
        ('novel_elements', 'Novel Element Identification'),
        ('claim_scope', 'Claim Scope & Broadness'),
        ('embodiments', 'Embodiment Analysis'),
        ('background_analysis', 'Background & Problem Analysis'),
        ('means_plus_function', 'Means-Plus-Function Detection'),
        ('vulnerabilities', 'Prosecution Vulnerability Assessment'),
        # Bundle attribute scoring prompts (used by bundle_attribute_service.py)
        ('bundle_attribute_extraction', 'Bundle Attribute Extraction (Groups H & I)'),
        ('group_a_classification', 'Technology Classification (Group A)'),
        # MD-aligned grouped prompts (B2-B7 from AI_Prompts_for_Attribute_Scoring.md)
        ('group_b_standards',      'Standards & Ecosystem (B1-B3)'),
        ('group_c_claim_analysis', 'Claim Analysis (C1-C2-C4)'),
        ('group_d_detectability',  'Detectability (D1-D2)'),
        ('group_g_themes',         'Themes & Generation (G1-G2-G3)'),
        ('group_h_quality',        'Claim Quality (H1-H4)'),
        ('group_i_market',         'Market Signals (I2-I3-I4)'),
    ]

    CATEGORY_CHOICES = [
        ('general', 'General'),
        ('hi_tech', 'Hi-Tech / Software'),
        ('biomedical', 'Biomedical'),
        ('life_science', 'Life Science'),
        ('mechanical', 'Mechanical'),
        ('electrical', 'Electrical'),
        ('chemical', 'Chemical'),
        ('pharma', 'Pharmaceutical'),
        ('semiconductor', 'Semiconductor'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    section = models.CharField(max_length=30, choices=SECTION_CHOICES)
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES, default='general')
    version = models.PositiveIntegerField(default=1)
    prompt_text = models.TextField()
    description = models.CharField(max_length=255, blank=True, default='')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='prompt_templates',
    )

    class Meta:
        db_table = 'analytics_prompt_template'
        ordering = ['section', 'category', '-version']
        unique_together = ('section', 'category', 'version')

    def __str__(self):
        return f"{self.get_section_display()} / {self.get_category_display()} v{self.version}"

    @classmethod
    def get_active(cls, section: str, category: str = 'general') -> 'AnalysisPromptTemplate | None':
        """Get the latest active prompt for a section+category. Falls back to 'general'."""
        prompt = (
            cls.objects
            .filter(section=section, category=category, is_active=True)
            .order_by('-version')
            .first()
        )
        if prompt:
            return prompt
        if category != 'general':
            return (
                cls.objects
                .filter(section=section, category='general', is_active=True)
                .order_by('-version')
                .first()
            )
        return None

    @classmethod
    def get_version_history(cls, section: str, category: str = 'general'):
        """Return all versions for a section+category, newest first."""
        return cls.objects.filter(section=section, category=category).order_by('-version')


# ─────────────────────────────────────────────────────────────────────────────
# Patent Portfolio Bundle Analysis Models
# ─────────────────────────────────────────────────────────────────────────────

User = get_user_model()


class BundleType(models.Model):
    """Seed table: 33 predefined bundle type definitions."""
    id = models.IntegerField(primary_key=True)
    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    routing_rule_summary = models.TextField(blank=True)
    display_order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'analytics_bundle_type'
        ordering = ['display_order', 'id']

    def __str__(self):
        return f"{self.id}. {self.name}"


class PatentBundleAttributes(models.Model):
    """42 technical attribute scores for a PatentRecord, used for bundle routing."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patent_record = models.OneToOneField(
        'PatentRecord', on_delete=models.CASCADE, related_name='bundle_attributes'
    )

    # ── Group A: Technology Classification (4-level hierarchy) ──────────────
    # L1: broad domain (must match GlobalTechnologyArea taxonomy)
    a1_primary_domain = models.CharField(max_length=200, blank=True)
    # L2: subcategory within domain (free-form)
    a2_tech_subcategory = models.CharField(max_length=200, blank=True)
    # L3: specific technique — derived primarily from claim language
    a21_tech_detail = models.CharField(max_length=200, blank=True)
    # L4: most granular approach/algorithm/protocol — derived primarily from claim language
    a22_tech_niche = models.CharField(max_length=200, blank=True)
    a3_stack_layer = models.CharField(
        max_length=50, blank=True,
        choices=[('App','App'),('Middleware','Middleware'),('Cloud','Cloud'),
                 ('Hardware','Hardware'),('OS','OS'),('Protocol','Protocol')]
    )
    a4_subsystem = models.CharField(max_length=200, blank=True)
    a5_use_case = models.CharField(max_length=200, blank=True)

    # ── Group B: Standards & Ecosystem ──────────────────────────────────────
    b1_sep_potential = models.IntegerField(
        default=0, validators=[MinValueValidator(0), MaxValueValidator(3)]
    )
    b2_standard_tagged = models.CharField(max_length=200, blank=True)
    b3_interface_role = models.IntegerField(
        default=0, validators=[MinValueValidator(0), MaxValueValidator(3)]
    )

    # ── Group C: Claim & Scope ───────────────────────────────────────────────
    c1_claim_type = models.CharField(
        max_length=50, blank=True,
        choices=[('Method','Method'),('Apparatus','Apparatus'),('CRM','CRM'),
                 ('System','System'),('Composition','Composition')]
    )
    c2_breadth = models.IntegerField(
        default=0, validators=[MinValueValidator(0), MaxValueValidator(3)]
    )
    c3_claim_count = models.IntegerField(null=True, blank=True)
    c4_design_around_difficulty = models.IntegerField(
        default=0, validators=[MinValueValidator(0), MaxValueValidator(3)]
    )

    # ── Group D: Detectability & Enforcement ────────────────────────────────
    d1_external_detectability = models.IntegerField(
        default=0, validators=[MinValueValidator(0), MaxValueValidator(3)]
    )
    d2_teardown_detectability = models.IntegerField(
        default=0, validators=[MinValueValidator(0), MaxValueValidator(3)]
    )
    d3_reads_on_products = models.IntegerField(
        default=0, validators=[MinValueValidator(0), MaxValueValidator(3)]
    )

    # ── Group E: Family & Lifecycle ──────────────────────────────────────────
    e1_family_size = models.IntegerField(default=1)
    e2_prosecution_status = models.CharField(
        max_length=50, blank=True,
        choices=[('Pending','Pending'),('Granted','Granted'),
                 ('Abandoned','Abandoned'),('Expired','Expired')]
    )
    e3_continuation = models.BooleanField(null=True, blank=True)
    e4_remaining_term_years = models.FloatField(null=True, blank=True)
    e5_maintenance_status = models.CharField(
        max_length=50, blank=True,
        choices=[('Current','Current'),('Lapsed','Lapsed'),('Unknown','Unknown')]
    )

    # ── Group F: Geographic ──────────────────────────────────────────────────
    f1_jurisdictions = models.JSONField(default=list)
    f2_trilateral = models.BooleanField(null=True, blank=True)
    f3_major_market_score = models.IntegerField(
        default=0, validators=[MinValueValidator(0), MaxValueValidator(3)]
    )

    # ── Group G: Strategic & Thematic ───────────────────────────────────────
    g1_convergence_theme = models.CharField(max_length=200, blank=True)
    g2_generation_tag = models.CharField(max_length=100, blank=True)
    g3_cross_industry_applicability = models.IntegerField(
        default=0, validators=[MinValueValidator(0), MaxValueValidator(3)]
    )

    # ── Group H: Patent Quality & Vulnerability ──────────────────────────────
    h1_claim_strength = models.IntegerField(
        default=0, validators=[MinValueValidator(0), MaxValueValidator(3)]
    )
    h2_prior_art_exposure = models.IntegerField(
        default=0, validators=[MinValueValidator(0), MaxValueValidator(3)]
    )
    h3_prosecution_risk = models.IntegerField(
        default=0, validators=[MinValueValidator(0), MaxValueValidator(3)]
    )
    h4_divided_infringement_risk = models.IntegerField(
        default=0, validators=[MinValueValidator(0), MaxValueValidator(3)]
    )
    h5_forward_citations = models.IntegerField(null=True, blank=True)
    h6_backward_citations = models.IntegerField(null=True, blank=True)
    h7_litigation_history = models.CharField(
        max_length=50, blank=True,
        choices=[('None','None'),('Filed','Filed'),('Survived','Survived'),('Lost','Lost')]
    )
    h8_chain_of_title = models.CharField(
        max_length=50, blank=True,
        choices=[('Clean','Clean'),('Issues','Issues'),('Unknown','Unknown')]
    )
    h9_eou_availability = models.CharField(
        max_length=50, blank=True,
        choices=[('None','None'),('Partial','Partial'),('Full','Full')]
    )
    h10_encumbrance_status = models.CharField(
        max_length=50, blank=True,
        choices=[('None','None'),('FRAND','FRAND'),
                 ('Exclusive License','Exclusive License'),('Other','Other')]
    )

    # ── Group I: Market/Buyer Signals ────────────────────────────────────────
    i1_product_mapping_confidence = models.IntegerField(
        default=0, validators=[MinValueValidator(0), MaxValueValidator(3)]
    )
    i2_implementation_maturity = models.CharField(
        max_length=50, blank=True,
        choices=[('Concept','Concept'),('Prototype','Prototype'),('Productized','Productized'),
                 ('Commercial','Commercial'),('Ubiquitous','Ubiquitous')]
    )
    i3_adjacent_market_reread = models.IntegerField(
        default=0, validators=[MinValueValidator(0), MaxValueValidator(3)]
    )
    i4_workaround_complexity = models.IntegerField(
        default=0, validators=[MinValueValidator(0), MaxValueValidator(3)]
    )

    # ── Provenance tracking ──────────────────────────────────────────────────
    derived_fields = models.JSONField(default=list)
    ai_extracted_fields = models.JSONField(default=list)
    manually_set_fields = models.JSONField(default=list)
    last_ai_extraction = models.DateTimeField(null=True, blank=True)
    ai_confidence_scores = models.JSONField(default=dict, blank=True)
    # Format: {"field_name": {"confidence": 75, "justification": "one sentence"}, ...}
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'analytics_patent_bundle_attributes'

    def __str__(self):
        return f"BundleAttrs({self.patent_record_id})"

    def attribute_completeness(self) -> float:
        """Returns fraction of H+I fields that are non-zero/non-empty."""
        hi_fields = [
            'h1_claim_strength','h2_prior_art_exposure','h3_prosecution_risk',
            'h7_litigation_history','h8_chain_of_title','h9_eou_availability',
            'h10_encumbrance_status','i1_product_mapping_confidence',
            'i2_implementation_maturity','i3_adjacent_market_reread','i4_workaround_complexity',
        ]
        filled = sum(1 for f in hi_fields if getattr(self, f) not in (0, '', None))
        return round(filled / len(hi_fields), 2)


DEFAULT_THRESHOLDS = {
    'sep_b1_cutoff': 2,
    'interface_b3_cutoff': 2,
    'detect_d1_cutoff': 2,
    'detect_d2_cutoff': 2,
    'family_e1_min': 2,
    'cross_industry_g3_cutoff': 2,
    'defensive_d3_cutoff': 2,
    'whitespace_c4_cutoff': 2,
    'anchor_h1_cutoff': 2,
    'high_citation_h5_min': 15,
    'pre_expiry_min_years': 1,
    'pre_expiry_max_years': 4,
    'salvage_h1_max': 1,
    'salvage_e4_max': 5,
    'salvage_h2_max': 1,
    'strength_depth_min': 4,
    'strength_detect_min': 2,
    'strength_term_min': 10,
}

DEFAULT_GATE_TOGGLES = {
    'gate_weakest_h1': True,
    'gate_invalidity_exposure': True,
    'gate_eou_ready': True,
    'gate_survived': True,
    'gate_cont_optionality': True,
}

BUNDLE_PRESETS = {
    'all_on': {},
    'npe': {
        'enabled_bundles': {
            'TECH_DOMAIN': False, 'PRODUCT_ARCH': False, 'STACK_LAYER': False,
            'MANUFACTURING': False, 'MATERIALS_CHEM': False, 'ALGO_SOFTWARE': False,
            'GEN_ROADMAP': False, 'FAMILY_TREE': False, 'LIFECYCLE': False,
            'FOUNDATIONAL': False, 'CONVERGENT_THEME': False, 'WHITESPACE': False,
            'PROSECUTION': False, 'PICKET_FENCE': False, 'STRONG_CORE_TAIL': False,
            'CONTINUATION_LIVE': False, 'CLEAN_TITLE': False, 'ADJACENT_REREAD': False,
            'PRE_EXPIRY': False, 'PROVENANCE': False,
        },
        'thresholds': {'high_citation_h5_min': 10},
    },
    'operating_company': {
        'enabled_bundles': {
            'SEP': False, 'GEN_ROADMAP': False, 'CLAIM_TYPE': False, 'DETECTABILITY': False,
            'LIFECYCLE': False, 'CONVERGENT_THEME': False, 'DEFENSIVE': False,
            'PROSECUTION': False, 'PICKET_FENCE': False, 'STRONG_CORE_TAIL': False,
            'EOU_BACKED': False, 'BATTLE_TESTED': False, 'HIGH_CITATION': False,
            'ADJACENT_REREAD': False, 'SALVAGE': False, 'PRE_EXPIRY': False,
        },
        'thresholds': {'family_e1_min': 3},
    },
    'defensive': {
        'enabled_bundles': {
            'SEP': False, 'PRODUCT_ARCH': False, 'USE_CASE': False, 'MANUFACTURING': False,
            'MATERIALS_CHEM': False, 'ALGO_SOFTWARE': False, 'INTEROPERABILITY': False,
            'DETECTABILITY': False, 'FAMILY_TREE': False, 'FOUNDATIONAL': False,
            'CONVERGENT_THEME': False, 'DEFENSIVE': False, 'WHITESPACE': False,
            'ANCHOR_HALO': False, 'PICKET_FENCE': False, 'CONTINUATION_LIVE': False,
            'EOU_BACKED': False, 'BATTLE_TESTED': False, 'HIGH_CITATION': False,
            'ADJACENT_REREAD': False, 'PROVENANCE': False,
        },
        'thresholds': {'salvage_h1_max': 2, 'salvage_e4_max': 8},
        'gate_toggles': {
            'gate_weakest_h1': False, 'gate_eou_ready': False,
            'gate_survived': False, 'gate_cont_optionality': False,
        },
    },
    'standards': {
        'enabled_bundles': {
            'TECH_DOMAIN': False, 'PRODUCT_ARCH': False, 'STACK_LAYER': False,
            'USE_CASE': False, 'MANUFACTURING': False, 'MATERIALS_CHEM': False,
            'ALGO_SOFTWARE': False, 'CLAIM_TYPE': False, 'FAMILY_TREE': False,
            'LIFECYCLE': False, 'FOUNDATIONAL': False, 'CROSS_INDUSTRY': False,
            'CONVERGENT_THEME': False, 'DEFENSIVE': False, 'WHITESPACE': False,
            'PROSECUTION': False, 'PICKET_FENCE': False, 'STRONG_CORE_TAIL': False,
            'CONTINUATION_LIVE': False, 'ADJACENT_REREAD': False, 'SALVAGE': False,
            'PRE_EXPIRY': False, 'PROVENANCE': False,
        },
        'gate_toggles': {'gate_eou_ready': True, 'gate_survived': True},
    },
    'ev_powertrain': {
        'enabled_bundles': {
            'SEP': False, 'ALGO_SOFTWARE': False, 'INTEROPERABILITY': False,
            'CLAIM_TYPE': False, 'DETECTABILITY': False, 'LIFECYCLE': False,
            'CONVERGENT_THEME': False, 'DEFENSIVE': False, 'PROSECUTION': False,
            'PICKET_FENCE': False, 'CONTINUATION_LIVE': False, 'EOU_BACKED': False,
            'BATTLE_TESTED': False, 'HIGH_CITATION': False, 'ADJACENT_REREAD': False,
            'SALVAGE': False, 'PRE_EXPIRY': False,
        },
    },
}


class BundlingConfiguration(models.Model):
    """Per-project bundle analysis configuration (preset + toggles + thresholds)."""
    PRESET_CHOICES = [
        ('all_on', 'All ON'),
        ('npe', 'NPE / Counter-Assertion'),
        ('operating_company', 'Operating Company / FTO'),
        ('defensive', 'Defensive Aggregator'),
        ('standards', 'Standards Licensee'),
        ('ev_powertrain', 'EV Powertrain Sale'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(
        'AnalyticsProject', on_delete=models.CASCADE, related_name='bundling_configurations'
    )
    name = models.CharField(max_length=200, default='Default')
    preset = models.CharField(max_length=50, choices=PRESET_CHOICES, default='all_on')
    enabled_bundles = models.JSONField(default=dict)
    thresholds = models.JSONField(default=dict)
    gate_toggles = models.JSONField(default=dict)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'analytics_bundling_configuration'

    def get_effective_thresholds(self) -> dict:
        merged = {**DEFAULT_THRESHOLDS}
        preset_data = BUNDLE_PRESETS.get(self.preset, {})
        merged.update(preset_data.get('thresholds', {}))
        merged.update(self.thresholds)
        return merged

    def get_effective_enabled_bundles(self) -> dict:
        merged = {}
        preset_data = BUNDLE_PRESETS.get(self.preset, {})
        merged.update(preset_data.get('enabled_bundles', {}))
        merged.update(self.enabled_bundles)
        return merged


class BundleAssignment(models.Model):
    """Computed result: does a patent qualify for a bundle type?"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patent_attributes = models.ForeignKey(
        PatentBundleAttributes, on_delete=models.CASCADE, related_name='bundle_assignments'
    )
    bundle_type = models.ForeignKey(
        BundleType, on_delete=models.CASCADE, related_name='assignments'
    )
    project = models.ForeignKey(
        'AnalyticsProject', on_delete=models.CASCADE, related_name='bundle_assignments'
    )
    is_assigned = models.BooleanField(default=False)
    run_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'analytics_bundle_assignment'
        unique_together = [('patent_attributes', 'bundle_type', 'project')]
        indexes = [
            models.Index(fields=['project', 'bundle_type']),
            models.Index(fields=['project', 'is_assigned']),
        ]


class BundleQualityScore(models.Model):
    """Aggregate quality metrics per bundle per project run."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(
        'AnalyticsProject', on_delete=models.CASCADE, related_name='bundle_quality_scores'
    )
    bundle_type = models.ForeignKey(
        BundleType, on_delete=models.CASCADE, related_name='quality_scores'
    )
    patent_count = models.IntegerField(default=0)

    # 8 primary metrics
    avg_claim_strength = models.FloatField(null=True, blank=True)
    avg_breadth = models.FloatField(null=True, blank=True)
    pct_trilateral = models.FloatField(null=True, blank=True)
    avg_remaining_term = models.FloatField(null=True, blank=True)
    avg_detectability = models.FloatField(null=True, blank=True)
    avg_forward_citations = models.FloatField(null=True, blank=True)
    pct_sep = models.FloatField(null=True, blank=True)
    pct_continuation_live = models.FloatField(null=True, blank=True)

    # 5 quality gate columns
    gate_weakest_h1 = models.IntegerField(null=True, blank=True)
    gate_invalidity_exposure_pct = models.FloatField(null=True, blank=True)
    gate_eou_ready_pct = models.FloatField(null=True, blank=True)
    gate_survived_pct = models.FloatField(null=True, blank=True)
    gate_cont_optionality_pct = models.FloatField(null=True, blank=True)

    pioneer_count = models.IntegerField(null=True, blank=True)
    strength_flag = models.CharField(
        max_length=10, blank=True,
        choices=[('STRONG','STRONG'),('MODERATE','MODERATE'),('WEAK','WEAK')]
    )
    composition_hint = models.TextField(blank=True)
    run_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'analytics_bundle_quality_score'
        unique_together = [('project', 'bundle_type')]


class SalesPackage(models.Model):
    TRANSACTION_TYPES = [
        ('sale', 'Outright Sale'),
        ('license', 'License'),
        ('co_dev', 'Co-development'),
        ('cross', 'Cross-license'),
    ]
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('ready', 'Ready'),
        ('sent', 'Sent'),
        ('closed', 'Closed'),
    ]
    ARCHETYPE_CHOICES = [
        ('OC-DEF', 'Operating Co. — Defensive'),
        ('OC-OFF', 'Operating Co. — Offensive'),
        ('OC-EXP', 'Operating Co. — Market Expansion'),
        ('NPE-LIC', 'NPE — Licensing'),
        ('NPE-LIT', 'NPE — Litigation'),
        ('DEF-AGG', 'Defensive Aggregator'),
        ('LIT-FIN', 'Litigation Finance'),
    ]
    PATTERN_CHOICES = [
        ('A', 'Strategic Flagship'),
        ('B', 'Compressed Strategic'),
        ('C', 'Technical-Spec'),
        ('D', 'Single-Asset Narrow'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(
        AnalyticsProject, on_delete=models.CASCADE, related_name='sales_packages'
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    bundle_codes = models.JSONField(default=list, help_text='List of bundle codes included in this package')
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES, default='sale')
    # Pricing is a future feature — fields reserved but not exposed in UI yet
    asking_price = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    royalty_rate = models.DecimalField(max_digits=6, decimal_places=4, null=True, blank=True)
    buyer_targets = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    # Value Proposition fields
    primary_archetype = models.CharField(max_length=10, blank=True, choices=ARCHETYPE_CHOICES)
    secondary_archetype = models.CharField(max_length=10, blank=True, choices=ARCHETYPE_CHOICES)
    listing_pattern = models.CharField(max_length=1, blank=True, choices=PATTERN_CHOICES)
    mcl_entries = models.JSONField(default=list, help_text='Market Context Library — sourced T4 facts per package')
    generated_teaser = models.TextField(blank=True)
    generated_listing = models.TextField(blank=True)
    listing_tier_report = models.JSONField(null=True, blank=True)
    listing_generated_at = models.DateTimeField(null=True, blank=True)
    # Framework completion fields (v3)
    meta_tags = models.JSONField(null=True, blank=True, help_text='Block 7 meta tags: industries, technologies, transactions')
    lint_results = models.JSONField(null=True, blank=True, help_text='§15 failure-mode lint results')
    quality_gates = models.JSONField(null=True, blank=True, help_text='§17 quality gate results')
    tier_validation = models.JSONField(null=True, blank=True, help_text='§5.5 tier coverage validation')
    suggested_archetype = models.CharField(max_length=10, blank=True, choices=ARCHETYPE_CHOICES, help_text='§4.5 auto-suggested archetype')
    archetype_reason = models.TextField(blank=True, help_text='Reason for suggested archetype')
    generated_deck = models.TextField(blank=True, help_text='Rung 3 non-confidential offering deck (markdown)')
    generated_cim = models.TextField(blank=True, help_text='Rung 4 CIM outline (markdown)')
    created_by = models.ForeignKey(
        get_user_model(), on_delete=models.SET_NULL, null=True, blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'analytics_sales_package'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.name} ({self.get_status_display()})'

    @property
    def bundle_count(self):
        return len(self.bundle_codes or [])