"""
Infringement Analysis Models
Handles patent infringement analysis, claim mapping, and risk assessment
"""

import uuid
from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator

User = get_user_model()


class InfringementCase(models.Model):
    """
    Represents an infringement analysis case
    """
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('active', 'Active Analysis'),
        ('review', 'Under Review'),
        ('completed', 'Completed'),
        ('on_hold', 'On Hold'),
        ('closed', 'Closed'),
    ]

    ANALYSIS_TYPE_CHOICES = [
        ('literal', 'Literal Infringement'),
        ('doe', 'Doctrine of Equivalents'),
        ('induced', 'Induced Infringement'),
        ('contributory', 'Contributory Infringement'),
        ('willful', 'Willful Infringement'),
    ]

    RISK_LEVEL_CHOICES = [
        ('low', 'Low Risk'),
        ('medium', 'Medium Risk'),
        ('high', 'High Risk'),
        ('critical', 'Critical Risk'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    case_name = models.CharField(max_length=255)
    case_number = models.CharField(max_length=100, unique=True, blank=True, null=True)
    description = models.TextField(blank=True)

    # Status and classification
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    analysis_type = models.CharField(max_length=20, choices=ANALYSIS_TYPE_CHOICES, default='literal')
    risk_level = models.CharField(max_length=20, choices=RISK_LEVEL_CHOICES, default='medium')

    # Link to Patent model (optional - enables cross-feature queries)
    patent = models.ForeignKey(
        'patents.Patent', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='infringement_cases'
    )

    # Patent information
    patent_number = models.CharField(max_length=100)
    patent_title = models.CharField(max_length=500)
    patent_abstract = models.TextField(blank=True)
    patent_url = models.URLField(blank=True)

    # Accused product/service
    accused_product_name = models.CharField(max_length=255)
    accused_product_description = models.TextField(blank=True)
    accused_party_name = models.CharField(max_length=255)
    accused_party_url = models.URLField(blank=True)

    # Analysis results
    infringement_likelihood = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        default=50,
        help_text="Likelihood of infringement (0-100%)"
    )
    confidence_level = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        default=50,
        help_text="Confidence in analysis (0-100%)"
    )

    # Dates
    analysis_date = models.DateField(null=True, blank=True)
    discovery_date = models.DateField(null=True, blank=True)

    # Team
    analyst = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='infringement_cases_analyzed'
    )
    assigned_attorney = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='infringement_cases_assigned'
    )

    # Additional info
    notes = models.TextField(blank=True)
    is_confidential = models.BooleanField(default=True)

    # Case-wide map of normalized claim terms → hex color, for consistent term coloring
    # and to drive the screenshot annotation palette. e.g. {"heating device": "#EF4444"}.
    claim_term_colors = models.JSONField(default=dict, blank=True)
    # Terms the analyst removed — auto-extraction skips these so they don't reappear.
    claim_term_excluded = models.JSONField(default=list, blank=True)

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='infringement_cases_created'
    )

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'risk_level']),
            models.Index(fields=['patent_number']),
            models.Index(fields=['accused_party_name']),
            models.Index(fields=['-created_at']),
        ]

    def __str__(self):
        return f"{self.case_name} - {self.patent_number}"

    def save(self, *args, **kwargs):
        # Auto-generate case number if not provided
        if not self.case_number:
            last_case = InfringementCase.objects.order_by('-case_number').first()
            if last_case and last_case.case_number:
                try:
                    last_number = int(last_case.case_number.split('-')[-1])
                    self.case_number = f"INF-{last_number + 1:05d}"
                except (ValueError, IndexError):
                    self.case_number = f"INF-{InfringementCase.objects.count() + 1:05d}"
            else:
                self.case_number = "INF-00001"
        super().save(*args, **kwargs)


# Review workflow for AI-assisted analysis. AI output is persisted as an editable
# 'ai_draft' that an analyst must confirm/edit before it counts as analysis.
REVIEW_STATUS_CHOICES = [
    ('confirmed', 'Confirmed'),   # analyst-authored or analyst-approved (default)
    ('ai_draft', 'AI Draft'),     # generated by AI, awaiting review
    ('edited', 'Edited'),         # AI draft subsequently edited by an analyst
]


class ClaimMapping(models.Model):
    """
    Maps patent claims to accused product features
    """
    MAPPING_TYPE_CHOICES = [
        ('literal', 'Literal Match'),
        ('equivalent', 'Equivalent'),
        ('similar', 'Similar'),
        ('no_match', 'No Match'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    case = models.ForeignKey(
        InfringementCase,
        on_delete=models.CASCADE,
        related_name='claim_mappings'
    )

    # Claim information
    claim_number = models.CharField(max_length=50)
    claim_text = models.TextField()
    claim_type = models.CharField(max_length=50, default='independent')

    # Product feature mapping
    product_feature = models.CharField(max_length=255)
    product_feature_description = models.TextField()

    # Mapping assessment
    mapping_type = models.CharField(max_length=20, choices=MAPPING_TYPE_CHOICES)
    match_confidence = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        default=50,
        help_text="Confidence in mapping (0-100%)"
    )

    # Analysis
    analysis_notes = models.TextField(blank=True)
    limitations_met = models.BooleanField(default=False)

    # Evidence references
    evidence_references = models.JSONField(default=list, blank=True)

    # AI-assist review workflow
    is_ai_generated = models.BooleanField(default=False)
    review_status = models.CharField(
        max_length=20, choices=REVIEW_STATUS_CHOICES, default='confirmed'
    )

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True
    )

    class Meta:
        ordering = ['claim_number']
        indexes = [
            models.Index(fields=['case', 'claim_number']),
            models.Index(fields=['mapping_type']),
        ]

    def __str__(self):
        return f"{self.case.case_name} - Claim {self.claim_number}"


class Evidence(models.Model):
    """
    Stores evidence for infringement analysis
    """
    EVIDENCE_TYPE_CHOICES = [
        ('product_doc', 'Product Documentation'),
        ('patent_doc', 'Patent Documentation'),
        ('technical_spec', 'Technical Specifications'),
        ('marketing', 'Marketing Materials'),
        ('source_code', 'Source Code'),
        ('screenshot', 'Screenshot'),
        ('photo', 'Photograph'),
        ('video', 'Video'),
        ('testimony', 'Expert Testimony'),
        ('research', 'Research Paper'),
        ('webpage', 'Web Page'),
        ('other', 'Other'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    case = models.ForeignKey(
        InfringementCase,
        on_delete=models.CASCADE,
        related_name='evidence'
    )

    # Evidence details
    title = models.CharField(max_length=255)
    description = models.TextField()
    evidence_type = models.CharField(max_length=20, choices=EVIDENCE_TYPE_CHOICES)

    # File/link
    file = models.FileField(upload_to='infringement/evidence/', blank=True, null=True)
    url = models.URLField(blank=True)

    # Relevance
    relevance_score = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(10)],
        default=5,
        help_text="Relevance score (0-10)"
    )
    related_claims = models.JSONField(default=list, blank=True)

    # Source
    source = models.CharField(max_length=255, blank=True)
    date_obtained = models.DateField(null=True, blank=True)

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    uploaded_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True
    )

    class Meta:
        ordering = ['-relevance_score', '-created_at']
        verbose_name_plural = 'Evidence'
        indexes = [
            models.Index(fields=['case', 'evidence_type']),
            models.Index(fields=['-relevance_score']),
        ]

    def __str__(self):
        return f"{self.case.case_name} - {self.title}"


class RiskAssessment(models.Model):
    """
    Risk assessment for infringement cases
    """
    RISK_FACTOR_CHOICES = [
        ('technical', 'Technical Merit'),
        ('legal', 'Legal Precedent'),
        ('financial', 'Financial Impact'),
        ('strategic', 'Strategic Importance'),
        ('validity', 'Patent Validity'),
        ('enforceability', 'Patent Enforceability'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    case = models.ForeignKey(
        InfringementCase,
        on_delete=models.CASCADE,
        related_name='risk_assessments'
    )

    # Risk factors
    risk_factor = models.CharField(max_length=20, choices=RISK_FACTOR_CHOICES)
    risk_score = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(10)],
        help_text="Risk score (0-10, where 10 is highest risk)"
    )

    # Assessment details
    description = models.TextField()
    mitigation_strategy = models.TextField(blank=True)

    # Financial estimates
    estimated_damages_min = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        null=True,
        blank=True
    )
    estimated_damages_max = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        null=True,
        blank=True
    )
    litigation_cost_estimate = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        null=True,
        blank=True
    )

    # Metadata
    assessed_date = models.DateField(auto_now_add=True)
    assessed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-risk_score', '-assessed_date']
        indexes = [
            models.Index(fields=['case', 'risk_factor']),
            models.Index(fields=['-risk_score']),
        ]

    def __str__(self):
        return f"{self.case.case_name} - {self.get_risk_factor_display()}"


class ClaimElement(models.Model):
    """
    Individual claim elements for element-by-element analysis
    """
    ELEMENT_TYPE_CHOICES = [
        ('preamble', 'Preamble'),
        ('body', 'Body Element'),
        ('transition', 'Transition'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    claim_mapping = models.ForeignKey(
        ClaimMapping,
        on_delete=models.CASCADE,
        related_name='elements'
    )

    # Element identification
    element_order = models.PositiveIntegerField()
    element_text = models.TextField()
    element_type = models.CharField(max_length=20, choices=ELEMENT_TYPE_CHOICES, default='body')

    # Product comparison
    accused_feature = models.TextField(blank=True)
    accused_feature_description = models.TextField(blank=True)

    # Analysis
    meets_limitation = models.BooleanField(null=True, help_text="True=Met, False=Not Met, Null=Unknown")
    analysis_notes = models.TextField(blank=True)

    # Doctrine of Equivalents Analysis
    doe_function = models.TextField(blank=True, help_text="What function does it perform?")
    doe_way = models.TextField(blank=True, help_text="How does it perform the function?")
    doe_result = models.TextField(blank=True, help_text="What result does it achieve?")
    doe_score = models.PositiveIntegerField(
        null=True,
        blank=True,
        validators=[MaxValueValidator(100)],
        help_text="DoE similarity score (0-100)"
    )

    # Evidence references (per-element citations) — list of Evidence IDs
    evidence_references = models.JSONField(default=list, blank=True)

    # AI-assist review workflow
    is_ai_generated = models.BooleanField(default=False)
    review_status = models.CharField(
        max_length=20, choices=REVIEW_STATUS_CHOICES, default='confirmed'
    )

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True
    )

    class Meta:
        ordering = ['claim_mapping', 'element_order']
        unique_together = ['claim_mapping', 'element_order']
        indexes = [
            models.Index(fields=['claim_mapping', 'element_order']),
            models.Index(fields=['meets_limitation']),
        ]

    def __str__(self):
        return f"{self.claim_mapping} - Element {self.element_order}"


class EvidenceScreenshot(models.Model):
    """A cropped region captured from an evidence PDF, mapped to one or more claim
    elements (evidence-of-use). Stores the cropped PNG plus the source page and a
    normalized bounding box (0-1) so the region can be re-highlighted at any zoom."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    case = models.ForeignKey(
        InfringementCase, on_delete=models.CASCADE, related_name='screenshots'
    )
    evidence = models.ForeignKey(
        Evidence, on_delete=models.CASCADE, related_name='screenshots',
        help_text='Source PDF the region was captured from',
    )
    claim_elements = models.ManyToManyField(
        ClaimElement, related_name='screenshots', blank=True,
        help_text='Claim limitations this screenshot is evidence for',
    )

    image = models.ImageField(upload_to='infringement/screenshots/%Y/%m/')
    page_number = models.PositiveIntegerField(default=1)
    # Normalized region on the page (fractions of page width/height, 0-1).
    bbox_x = models.FloatField(default=0)
    bbox_y = models.FloatField(default=0)
    bbox_width = models.FloatField(default=0)
    bbox_height = models.FloatField(default=0)

    caption = models.CharField(max_length=500, blank=True)
    # Editable vector callouts drawn on the crop. Each item:
    #   {id, type: 'line'|'arrow'|'box', color, stroke, ...coords} with normalized 0-1
    #   coords relative to the image (line/arrow: x1,y1,x2,y2; box: x,y,w,h).
    annotations = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['case']),
            models.Index(fields=['evidence']),
        ]

    def __str__(self):
        return f"Screenshot p{self.page_number} of {self.evidence_id}"


class DamagesAnalysis(models.Model):
    """
    Comprehensive damages calculation for infringement cases
    """
    DAMAGES_THEORY_CHOICES = [
        ('lost_profits', 'Lost Profits'),
        ('reasonable_royalty', 'Reasonable Royalty'),
        ('hybrid', 'Hybrid Approach'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    case = models.OneToOneField(
        InfringementCase,
        on_delete=models.CASCADE,
        related_name='damages_analysis'
    )

    # Theory selection
    damages_theory = models.CharField(max_length=20, choices=DAMAGES_THEORY_CHOICES, default='reasonable_royalty')

    # Market data
    market_size = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    accused_product_revenue = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    accused_product_units = models.PositiveIntegerField(null=True, blank=True)
    profit_margin_percent = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)

    # Lost profits calculation
    lost_profits_amount = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    but_for_analysis = models.TextField(blank=True, help_text="What would have happened without infringement")

    # Reasonable royalty calculation
    royalty_base = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    royalty_rate_percent = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    comparable_licenses = models.JSONField(default=list, blank=True)  # [{licensor, licensee, rate, date}]

    # Georgia-Pacific factors (15 factors for royalty determination)
    gp_factors = models.JSONField(default=dict, blank=True)

    # Willfulness
    is_willful = models.BooleanField(default=False)
    willfulness_multiplier = models.DecimalField(max_digits=3, decimal_places=1, default=1.0)
    willfulness_justification = models.TextField(blank=True)

    # Totals
    estimated_damages_low = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    estimated_damages_high = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)

    # Metadata
    analysis_date = models.DateField(null=True, blank=True)
    assumptions = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True
    )

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['case']),
            models.Index(fields=['damages_theory']),
        ]

    def __str__(self):
        return f"{self.case.case_name} - Damages Analysis"

    def calculate_damages(self):
        """Calculate damages based on selected theory"""
        base_damages = 0

        if self.damages_theory == 'lost_profits':
            if self.lost_profits_amount:
                base_damages = float(self.lost_profits_amount)
        elif self.damages_theory == 'reasonable_royalty':
            if self.royalty_base and self.royalty_rate_percent:
                base_damages = float(self.royalty_base) * (float(self.royalty_rate_percent) / 100)
        elif self.damages_theory == 'hybrid':
            lp = float(self.lost_profits_amount) if self.lost_profits_amount else 0
            rr = 0
            if self.royalty_base and self.royalty_rate_percent:
                rr = float(self.royalty_base) * (float(self.royalty_rate_percent) / 100)
            base_damages = lp + rr

        # Apply willfulness multiplier
        multiplier = float(self.willfulness_multiplier) if self.is_willful else 1.0

        return {
            'base_damages': base_damages,
            'multiplier': multiplier,
            'total_damages': base_damages * multiplier,
        }


class ExpertOpinion(models.Model):
    """
    Expert opinions and declarations for infringement cases
    """
    OPINION_TYPE_CHOICES = [
        ('technical', 'Technical Expert'),
        ('damages', 'Damages Expert'),
        ('industry', 'Industry Expert'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    case = models.ForeignKey(
        InfringementCase,
        on_delete=models.CASCADE,
        related_name='expert_opinions'
    )

    # Expert info
    expert_name = models.CharField(max_length=200)
    expert_title = models.CharField(max_length=200, blank=True)
    expert_organization = models.CharField(max_length=200, blank=True)
    qualifications = models.TextField()

    # Opinion details
    opinion_type = models.CharField(max_length=20, choices=OPINION_TYPE_CHOICES)
    methodology = models.TextField()
    findings = models.TextField()
    conclusion = models.TextField()

    # Linkages
    supports_claims = models.ManyToManyField(
        ClaimMapping,
        blank=True,
        related_name='supporting_opinions'
    )

    # Documents
    declaration_file = models.FileField(
        upload_to='infringement/expert_declarations/',
        null=True,
        blank=True
    )
    cv_file = models.FileField(
        upload_to='infringement/expert_cvs/',
        null=True,
        blank=True
    )

    # Status
    is_under_protective_order = models.BooleanField(default=False)
    opinion_date = models.DateField()

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True
    )

    class Meta:
        ordering = ['-opinion_date']
        indexes = [
            models.Index(fields=['case']),
            models.Index(fields=['opinion_type']),
        ]

    def __str__(self):
        return f"{self.expert_name} - {self.opinion_type} ({self.case.case_name})"


class LitigationStrategy(models.Model):
    """
    Litigation strategy and planning for infringement cases
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    case = models.OneToOneField(
        InfringementCase,
        on_delete=models.CASCADE,
        related_name='litigation_strategy'
    )

    # Claim construction
    claim_construction_position = models.TextField(blank=True)
    key_claim_terms = models.JSONField(default=list, blank=True)  # [{term, proposed_construction}]

    # Defenses
    anticipated_defenses = models.JSONField(default=list, blank=True)
    invalidity_risks = models.TextField(blank=True)

    # SWOT Analysis
    strengths = models.JSONField(default=list, blank=True)
    weaknesses = models.JSONField(default=list, blank=True)
    opportunities = models.JSONField(default=list, blank=True)
    threats = models.JSONField(default=list, blank=True)
    trial_strategy = models.TextField(blank=True)

    # Settlement
    settlement_range_low = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    settlement_range_high = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    settlement_considerations = models.TextField(blank=True)

    # Costs
    estimated_litigation_cost = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True
    )

    class Meta:
        indexes = [
            models.Index(fields=['case']),
        ]

    def __str__(self):
        return f"Litigation Strategy - {self.case.case_name}"


class InfringementReport(models.Model):
    """
    Generated infringement analysis reports
    """
    REPORT_TYPE_CHOICES = [
        ('preliminary', 'Preliminary Analysis'),
        ('detailed', 'Detailed Analysis'),
        ('claim_chart', 'Claim Chart'),
        ('risk_assessment', 'Risk Assessment'),
        ('executive_summary', 'Executive Summary'),
    ]

    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('review', 'Under Review'),
        ('final', 'Final'),
        ('archived', 'Archived'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    case = models.ForeignKey(
        InfringementCase,
        on_delete=models.CASCADE,
        related_name='reports'
    )

    # Report details
    title = models.CharField(max_length=255)
    report_type = models.CharField(max_length=20, choices=REPORT_TYPE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')

    # Content
    summary = models.TextField(blank=True)
    findings = models.TextField(blank=True)
    conclusion = models.TextField(blank=True)
    recommendations = models.TextField(blank=True)

    # Files
    pdf_file = models.FileField(upload_to='infringement/reports/', blank=True, null=True)

    # Review
    reviewed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reports_reviewed'
    )
    reviewed_date = models.DateTimeField(null=True, blank=True)
    review_notes = models.TextField(blank=True)

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='reports_created'
    )

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['case', 'report_type']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f"{self.case.case_name} - {self.title}"
