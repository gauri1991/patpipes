"""
Prior Art Models
Professional-grade models for patent prior art search and analysis
Following McKinsey strategic framework and Google technical excellence
"""

import uuid
import json
from decimal import Decimal
from typing import Dict, List, Optional, Any
from enum import Enum

from django.db import models
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator
# Removed PostgreSQL-specific import for SQLite compatibility
# from django.contrib.postgres.fields import ArrayField
from django.db.models import JSONField

User = get_user_model()


class FeatureType(models.TextChoices):
    """
    McKinsey MECE Framework Applied:
    Mutually Exclusive and Collectively Exhaustive categorization
    """
    STRUCTURAL = 'structural', 'Structural Feature'
    FUNCTIONAL = 'functional', 'Functional Feature'
    APPLICATION = 'application', 'Application Feature'


class PriorArtProjectType(models.TextChoices):
    """Strategic prior art search types aligned with legal objectives"""
    FTO = 'freedom_to_operate', 'Freedom to Operate'
    NOVELTY = 'novelty_search', 'Novelty Search'
    INVALIDITY = 'invalidity_search', 'Invalidity Search'
    LANDSCAPE = 'landscape_analysis', 'Landscape Analysis'
    STATE_OF_ART = 'state_of_art', 'State of the Art'
    CUSTOM = 'custom_search', 'Custom Search'


class PriorArtProjectStatus(models.TextChoices):
    """Project lifecycle with professional workflow stages"""
    DRAFT = 'draft', 'Draft'
    PLANNING = 'planning', 'Planning'
    ACTIVE = 'active', 'Active Research'
    ANALYSIS = 'analysis', 'Analysis Phase'
    REVIEW = 'review', 'Review & Validation'
    COMPLETED = 'completed', 'Completed'
    ARCHIVED = 'archived', 'Archived'


class PriorArtProject(models.Model):
    """
    Professional prior art project management
    Enterprise-level project tracking with legal workflow integration
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, db_index=True)
    description = models.TextField(blank=True)
    project_type = models.CharField(
        max_length=50, 
        choices=PriorArtProjectType.choices,
        default=PriorArtProjectType.FTO,
        db_index=True
    )
    status = models.CharField(
        max_length=50, 
        choices=PriorArtProjectStatus.choices, 
        default=PriorArtProjectStatus.DRAFT,
        db_index=True
    )
    
    # Relationship to analytics project for integrated workflow
    analytics_project = models.ForeignKey(
        'analytics.AnalyticsProject',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='prior_art_projects',
        help_text="Link to parent analytics project if applicable"
    )
    
    # Target Patent Information (for invalidity/FTO searches)
    target_patent_number = models.CharField(max_length=100, blank=True, db_index=True)
    target_patent_title = models.CharField(max_length=500, blank=True)
    target_jurisdiction = models.CharField(max_length=10, blank=True)
    target_priority_date = models.DateField(null=True, blank=True)
    target_publication_date = models.DateField(null=True, blank=True)
    
    # Strategic Search Parameters
    search_objectives = JSONField(
        default=dict,
        help_text="Strategic objectives and success criteria"
    )
    geographic_scope = JSONField(
        default=list,
        help_text="Jurisdictions to search (US, EP, JP, CN, etc.) - stored as JSON array"
    )
    time_scope = JSONField(
        default=dict,
        help_text="Date ranges and temporal constraints"
    )
    technology_scope = JSONField(
        default=dict,
        help_text="Technology areas and classification scope"
    )
    
    # Project Management
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_prior_art_projects')
    assigned_to = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='assigned_prior_art_projects'
    )
    team_members = models.ManyToManyField(
        User,
        through='PriorArtProjectMembership',
        related_name='prior_art_projects'
    )
    
    # Progress Tracking
    progress_percentage = models.PositiveSmallIntegerField(
        default=0,
        validators=[MaxValueValidator(100)],
        help_text="Overall project completion percentage"
    )
    
    # Key Metrics (auto-calculated)
    total_searches = models.PositiveIntegerField(default=0)
    total_results = models.PositiveIntegerField(default=0)
    analyzed_results = models.PositiveIntegerField(default=0)
    selected_references = models.PositiveIntegerField(default=0)
    
    # Timeline
    start_date = models.DateField(default=timezone.now)
    target_completion_date = models.DateField(null=True, blank=True)
    actual_completion_date = models.DateField(null=True, blank=True)
    
    # Audit Trail
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True, db_index=True)
    
    class Meta:
        db_table = 'prior_art_projects'
        indexes = [
            models.Index(fields=['project_type', 'status']),
            models.Index(fields=['created_by', 'status']),
            models.Index(fields=['created_at']),
        ]
        
    def __str__(self):
        return f"{self.name} ({self.get_project_type_display()})"
    
    @property
    def is_active(self):
        return self.status in [PriorArtProjectStatus.ACTIVE, PriorArtProjectStatus.ANALYSIS]
    
    def update_metrics(self):
        """Auto-calculate project metrics"""
        self.total_searches = self.search_sessions.count()
        self.total_results = sum(session.result_count for session in self.search_sessions.all())
        self.analyzed_results = self.evidence_items.filter(analysis_status='analyzed').count()
        self.selected_references = self.evidence_items.filter(is_relevant=True).count()
        self.save(update_fields=['total_searches', 'total_results', 'analyzed_results', 'selected_references'])


class PriorArtProjectMembership(models.Model):
    """Team membership with role-based permissions"""
    
    ROLE_CHOICES = [
        ('owner', 'Project Owner'),
        ('lead_researcher', 'Lead Researcher'),  
        ('researcher', 'Researcher'),
        ('analyst', 'Legal Analyst'),
        ('reviewer', 'Reviewer'),
        ('viewer', 'Viewer'),
    ]
    
    project = models.ForeignKey(PriorArtProject, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    joined_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['project', 'user']
        db_table = 'prior_art_project_memberships'


class TargetPatent(models.Model):
    """
    Comprehensive target patent analysis
    Professional-grade claims analysis with AI-powered categorization
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.OneToOneField(
        PriorArtProject, 
        on_delete=models.CASCADE,
        related_name='target_patent_analysis'
    )
    
    # Patent Identification
    patent_number = models.CharField(max_length=100, db_index=True)
    jurisdiction = models.CharField(max_length=10)
    title = models.CharField(max_length=500)
    
    # Patent Metadata
    inventors = JSONField(default=list, help_text="List of inventors - stored as JSON array")
    assignees = JSONField(default=list, help_text="List of assignees - stored as JSON array")
    priority_date = models.DateField(null=True, blank=True)
    filing_date = models.DateField(null=True, blank=True)
    publication_date = models.DateField(null=True, blank=True)
    grant_date = models.DateField(null=True, blank=True)
    
    # Patent Content
    abstract = models.TextField(blank=True)
    specification_text = models.TextField(blank=True, help_text="Full patent specification")
    
    # AI-Enhanced Analysis
    technology_keywords = JSONField(default=list, help_text="Technology keywords - stored as JSON array")
    ipc_classifications = JSONField(default=list, help_text="IPC classifications - stored as JSON array")
    cpc_classifications = JSONField(default=list, help_text="CPC classifications - stored as JSON array")
    
    # Analysis Results
    analysis_status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending Analysis'),
            ('analyzing', 'Analyzing'),
            ('completed', 'Analysis Complete'),
            ('failed', 'Analysis Failed')
        ],
        default='pending'
    )
    analysis_summary = JSONField(
        default=dict,
        help_text="AI-generated patent analysis summary"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'target_patents'
        
    def __str__(self):
        return f"{self.patent_number}: {self.title[:50]}..."


class PatentClaim(models.Model):
    """
    Individual patent claims with AI-powered feature categorization
    Implements our breakthrough structural/functional/application analysis
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    target_patent = models.ForeignKey(
        TargetPatent, 
        on_delete=models.CASCADE,
        related_name='claims'
    )
    
    # Claim Identification
    claim_number = models.PositiveIntegerField()
    claim_type = models.CharField(
        max_length=20,
        choices=[
            ('independent', 'Independent Claim'),
            ('dependent', 'Dependent Claim')
        ]
    )
    depends_on_claim = models.ForeignKey(
        'self', 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        help_text="Parent claim for dependent claims"
    )
    
    # Claim Text
    claim_text = models.TextField(help_text="Complete claim text")
    
    # AI-Powered Analysis (Our Innovation!)
    analysis_status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('analyzing', 'Analyzing'), 
            ('completed', 'Complete'),
            ('failed', 'Failed')
        ],
        default='pending'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'patent_claims'
        unique_together = ['target_patent', 'claim_number']
        indexes = [
            models.Index(fields=['target_patent', 'claim_number']),
        ]
        
    def __str__(self):
        return f"Claim {self.claim_number}: {self.claim_text[:50]}..."


class ClaimElement(models.Model):
    """
    Individual claim elements with breakthrough feature categorization
    THIS IS OUR COMPETITIVE ADVANTAGE - McKinsey + Google Level Innovation!
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    claim = models.ForeignKey(
        PatentClaim,
        on_delete=models.CASCADE,
        related_name='elements'
    )
    
    # Element Text
    element_text = models.TextField(help_text="Raw element text from claim")
    element_position = models.PositiveIntegerField(help_text="Order in claim")
    
    # AI-Powered Feature Categorization (Our Secret Sauce!)
    primary_feature_type = models.CharField(
        max_length=20,
        choices=FeatureType.choices,
        help_text="Primary categorization using MECE framework"
    )
    
    # Detailed Sub-categorization
    feature_subcategory = models.CharField(
        max_length=50,
        blank=True,
        help_text="Detailed subcategory within primary type"
    )
    
    # Confidence Scoring
    categorization_confidence = models.DecimalField(
        max_digits=4, 
        decimal_places=3,
        validators=[MinValueValidator(0), MaxValueValidator(1)],
        help_text="AI confidence score (0.000-1.000)"
    )
    
    # Strategic Keywords (Auto-generated based on category)
    structural_keywords = JSONField(
        default=list,
        help_text="Material, component, dimensional terms - stored as JSON array"
    )
    functional_keywords = JSONField(
        default=list,
        help_text="Process, operation, behavior terms - stored as JSON array"
    )
    application_keywords = JSONField(
        default=list,
        help_text="Use-case, environment, integration terms - stored as JSON array"
    )
    
    # Legal Synonyms and Variations
    legal_synonyms = JSONField(
        default=list,
        help_text="Legal and technical equivalents - stored as JSON array"
    )
    broader_terms = JSONField(
        default=list,
        help_text="Broader conceptual terms - stored as JSON array"
    )
    narrower_terms = JSONField(
        default=list,
        help_text="More specific implementations - stored as JSON array"
    )
    
    # Analysis Metadata
    analysis_context = JSONField(
        default=dict,
        help_text="Additional analysis context and reasoning"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'claim_elements'
        indexes = [
            models.Index(fields=['claim', 'element_position']),
            models.Index(fields=['primary_feature_type']),
        ]
        
    def __str__(self):
        return f"{self.get_primary_feature_type_display()}: {self.element_text[:30]}..."
    
    @property
    def all_keywords(self) -> List[str]:
        """Get all keywords across all categories"""
        return (self.structural_keywords + 
                self.functional_keywords + 
                self.application_keywords + 
                self.legal_synonyms)


class SearchSession(models.Model):
    """
    Professional search session management
    Integrated with research API for comprehensive patent/literature search
    """
    
    SEARCH_PURPOSE_CHOICES = [
        ('initial_landscape', 'Initial Landscape'),
        ('focused_search', 'Focused Search'),
        ('claim_specific', 'Claim-Specific Search'),
        ('gap_analysis', 'Gap Analysis'),
        ('validation', 'Validation Search'),
    ]
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('queued', 'Queued'),
        ('running', 'Running'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(
        PriorArtProject,
        on_delete=models.CASCADE,
        related_name='search_sessions'
    )
    
    # Session Identification
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    search_purpose = models.CharField(max_length=30, choices=SEARCH_PURPOSE_CHOICES)
    
    # Search Strategy (Generated from Claims Analysis)
    search_strategy = JSONField(
        default=dict,
        help_text="Complete search strategy including keywords, classes, etc."
    )
    
    # Integration with Research API
    research_query_ids = JSONField(
        default=list,
        help_text="Linked research query IDs for execution - stored as JSON array"
    )
    
    # Execution Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    result_count = models.PositiveIntegerField(default=0)
    execution_log = JSONField(default=list, help_text="Detailed execution log")
    
    # Performance Metrics
    search_duration = models.DurationField(null=True, blank=True)
    api_calls_made = models.PositiveIntegerField(default=0)
    databases_searched = JSONField(default=list, help_text="Databases searched - stored as JSON array")
    
    # Audit
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'search_sessions'
        indexes = [
            models.Index(fields=['project', 'status']),
            models.Index(fields=['created_at']),
        ]
        
    def __str__(self):
        return f"{self.name} - {self.get_status_display()}"


class EvidenceItem(models.Model):
    """
    Individual prior art evidence with legal relevance analysis
    Professional-grade evidence management for legal proceedings
    """
    
    EVIDENCE_TYPE_CHOICES = [
        ('patent', 'Patent'),
        ('published_application', 'Published Application'),
        ('technical_paper', 'Technical Paper'),
        ('standard', 'Industry Standard'),
        ('product_manual', 'Product Manual'),
        ('website', 'Website/Online Content'),
        ('expert_declaration', 'Expert Declaration'),
        ('prior_use', 'Prior Use Evidence'),
        ('other', 'Other'),
    ]
    
    RELEVANCE_LEVEL_CHOICES = [
        ('high', 'High Relevance'),
        ('medium', 'Medium Relevance'), 
        ('low', 'Low Relevance'),
        ('not_relevant', 'Not Relevant'),
        ('under_review', 'Under Review'),
    ]
    
    ANALYSIS_STATUS_CHOICES = [
        ('pending', 'Pending Analysis'),
        ('analyzing', 'Under Analysis'),
        ('analyzed', 'Analysis Complete'),
        ('requires_expert', 'Requires Expert Review'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(
        PriorArtProject,
        on_delete=models.CASCADE,
        related_name='evidence_items'
    )
    search_session = models.ForeignKey(
        SearchSession,
        on_delete=models.CASCADE,
        related_name='evidence_items'
    )
    
    # Evidence Identification
    reference_id = models.CharField(max_length=100, help_text="External reference ID")
    evidence_type = models.CharField(max_length=30, choices=EVIDENCE_TYPE_CHOICES)
    title = models.CharField(max_length=500)
    authors_inventors = JSONField(default=list, help_text="Authors/inventors - stored as JSON array")
    
    # Publication Details
    publication_date = models.DateField(null=True, blank=True)
    jurisdiction = models.CharField(max_length=10, blank=True)
    source_database = models.CharField(max_length=50, blank=True)
    
    # Content
    abstract_summary = models.TextField(blank=True)
    key_disclosure = models.TextField(blank=True, help_text="Key technical disclosure")
    
    # Legal Analysis
    relevance_level = models.CharField(
        max_length=20, 
        choices=RELEVANCE_LEVEL_CHOICES,
        default='under_review'
    )
    legal_relevance_score = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Legal relevance score (0-100)"
    )
    
    # Claim Mapping
    relevant_claims = models.ManyToManyField(
        PatentClaim,
        through='ClaimEvidenceMapping',
        help_text="Claims this evidence is relevant to"
    )
    
    # Analysis Status
    analysis_status = models.CharField(
        max_length=20,
        choices=ANALYSIS_STATUS_CHOICES,
        default='pending'
    )
    analysis_notes = models.TextField(blank=True)
    
    # Selection for Reports
    is_relevant = models.BooleanField(default=False, help_text="Selected as relevant evidence")
    is_primary_reference = models.BooleanField(default=False, help_text="Primary reference for invalidity")
    
    # Metadata
    metadata = JSONField(
        default=dict,
        help_text="Additional metadata from source database"
    )
    
    # Audit
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    analyzed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text="User who performed the analysis"
    )
    
    class Meta:
        db_table = 'evidence_items'
        indexes = [
            models.Index(fields=['project', 'relevance_level']),
            models.Index(fields=['evidence_type', 'relevance_level']),
            models.Index(fields=['is_relevant', 'is_primary_reference']),
        ]
        
    def __str__(self):
        return f"{self.reference_id}: {self.title[:50]}..."


class ClaimEvidenceMapping(models.Model):
    """
    Professional claim-to-evidence mapping for legal analysis
    Supports invalidity charts and FTO analysis
    """
    
    COVERAGE_TYPE_CHOICES = [
        ('exact', 'Exact Match'),
        ('equivalent', 'Equivalent Disclosure'),
        ('broader', 'Broader Disclosure'),
        ('narrower', 'Narrower Disclosure'),
        ('similar', 'Similar Concept'),
        ('combination', 'Requires Combination'),
    ]
    
    claim = models.ForeignKey(PatentClaim, on_delete=models.CASCADE)
    evidence = models.ForeignKey(EvidenceItem, on_delete=models.CASCADE)
    
    # Mapping Details
    coverage_type = models.CharField(max_length=20, choices=COVERAGE_TYPE_CHOICES)
    coverage_percentage = models.PositiveSmallIntegerField(
        validators=[MaxValueValidator(100)],
        help_text="Estimated coverage percentage"
    )
    
    # Element-Specific Mapping
    covered_elements = models.ManyToManyField(
        ClaimElement,
        help_text="Specific claim elements covered by this evidence"
    )
    
    # Legal Analysis
    legal_analysis = models.TextField(blank=True, help_text="Legal analysis of coverage")
    confidence_level = models.CharField(
        max_length=10,
        choices=[('high', 'High'), ('medium', 'Medium'), ('low', 'Low')],
        default='medium'
    )
    
    # Metadata
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'claim_evidence_mappings'
        unique_together = ['claim', 'evidence']


class PriorArtReport(models.Model):
    """
    Professional report generation and management
    Supports legal deliverables and client presentations
    """
    
    REPORT_TYPE_CHOICES = [
        ('fto_report', 'Freedom to Operate Report'),
        ('novelty_report', 'Novelty Assessment Report'), 
        ('invalidity_report', 'Invalidity Analysis Report'),
        ('landscape_report', 'Technology Landscape Report'),
        ('claim_chart', 'Claim Chart'),
        ('evidence_summary', 'Evidence Summary'),
        ('search_report', 'Search Report'),
        ('executive_summary', 'Executive Summary'),
    ]
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('generating', 'Generating'),
        ('review', 'Under Review'),
        ('completed', 'Completed'),
        ('delivered', 'Delivered'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(
        PriorArtProject,
        on_delete=models.CASCADE,
        related_name='reports'
    )
    
    # Report Details
    report_type = models.CharField(max_length=30, choices=REPORT_TYPE_CHOICES)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    
    # Content Configuration
    included_evidence = models.ManyToManyField(
        EvidenceItem,
        help_text="Evidence items included in this report"
    )
    report_sections = JSONField(
        default=dict,
        help_text="Report structure and content sections"
    )
    
    # Generation Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    generation_progress = models.PositiveSmallIntegerField(
        default=0,
        validators=[MaxValueValidator(100)]
    )
    
    # File Management
    file_path = models.FileField(upload_to='prior_art_reports/', blank=True)
    file_format = models.CharField(
        max_length=10,
        choices=[('pdf', 'PDF'), ('docx', 'Word Document'), ('html', 'HTML')],
        default='pdf'
    )
    
    # Audit
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'prior_art_reports'
        
    def __str__(self):
        return f"{self.get_report_type_display()} - {self.title}"