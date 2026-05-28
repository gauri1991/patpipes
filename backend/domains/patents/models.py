"""
Patent Portfolio Management Models
Models for managing patent portfolios across multiple companies/organizations
"""

import uuid
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()


class Portfolio(models.Model):
    """
    Patent Portfolio model for managing collections of patents
    Can be associated with one or more organizations/companies
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200, help_text="Portfolio name")
    company_name = models.CharField(max_length=200, help_text="Company/Client name")
    description = models.TextField(blank=True, help_text="Portfolio description")
    
    # Organization link (can be multiple organizations for brokers)
    organization = models.ForeignKey(
        'accounts.Organization',
        on_delete=models.CASCADE,
        related_name='patent_portfolios',
        null=True,
        blank=True
    )
    
    # Portfolio owner/manager
    owner = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='owned_portfolios',
        help_text="Portfolio owner or manager"
    )
    
    # Users with access to this portfolio
    users = models.ManyToManyField(
        User,
        through='PortfolioAccess',
        through_fields=('portfolio', 'user'),
        related_name='accessible_portfolios',
        blank=True
    )
    
    # Portfolio metrics (cached for performance)
    total_patents = models.IntegerField(default=0)
    active_patents = models.IntegerField(default=0)
    pending_patents = models.IntegerField(default=0)
    expired_patents = models.IntegerField(default=0)
    
    # Financial metrics
    total_value = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    annual_maintenance_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Estimated patent count on USPTO ODP (cached)
    estimated_odp_count = models.IntegerField(null=True, blank=True)

    # Portfolio status
    is_active = models.BooleanField(default=True)
    
    # Metadata
    tags = models.JSONField(default=list, blank=True)
    settings = models.JSONField(default=dict, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'patent_portfolios'
        ordering = ['company_name', 'name']
        indexes = [
            models.Index(fields=['organization']),
            models.Index(fields=['owner']),
            models.Index(fields=['is_active']),
        ]
    
    def __str__(self):
        return f"{self.company_name} - {self.name}"
    
    def update_metrics(self):
        """Update cached metrics for the portfolio"""
        # This method would update the cached counts
        # Implementation depends on Patent model structure
        pass


class PortfolioAccess(models.Model):
    """
    Through model for managing user access to portfolios
    Allows fine-grained permission control
    """
    
    ACCESS_LEVELS = [
        ('viewer', 'Viewer'),
        ('editor', 'Editor'),
        ('manager', 'Manager'),
        ('owner', 'Owner'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    portfolio = models.ForeignKey(Portfolio, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    access_level = models.CharField(max_length=20, choices=ACCESS_LEVELS, default='viewer')
    
    # Access control
    can_view = models.BooleanField(default=True)
    can_edit = models.BooleanField(default=False)
    can_delete = models.BooleanField(default=False)
    can_manage_users = models.BooleanField(default=False)
    
    # Timestamps
    granted_at = models.DateTimeField(auto_now_add=True)
    granted_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='portfolio_access_grants'
    )
    
    class Meta:
        db_table = 'portfolio_access'
        unique_together = ['portfolio', 'user']
        indexes = [
            models.Index(fields=['portfolio', 'user']),
            models.Index(fields=['user']),
        ]
    
    def __str__(self):
        return f"{self.user} - {self.portfolio} ({self.access_level})"


class Patent(models.Model):
    """
    Basic Patent model to associate with portfolios
    This is a simplified version - expand as needed
    """
    
    PATENT_STATUS = [
        ('draft', 'Draft'),
        ('filed', 'Filed'),
        ('pending', 'Pending'),
        ('granted', 'Granted'),
        ('expired', 'Expired'),
        ('abandoned', 'Abandoned'),
    ]
    
    PATENT_TYPE = [
        ('utility', 'Utility Patent'),
        ('design', 'Design Patent'),
        ('plant', 'Plant Patent'),
        ('provisional', 'Provisional Patent'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Portfolio association
    portfolio = models.ForeignKey(
        Portfolio,
        on_delete=models.CASCADE,
        related_name='patents',
        null=True,
        blank=True
    )
    
    # Project association (if using project-based workflow)
    project = models.ForeignKey(
        'projects.Project',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='patents'
    )
    
    # Patent details
    title = models.CharField(max_length=500)
    application_number = models.CharField(max_length=100, unique=True, null=True, blank=True)
    patent_number = models.CharField(max_length=100, unique=True, null=True, blank=True)
    
    status = models.CharField(max_length=20, choices=PATENT_STATUS, default='draft')
    patent_type = models.CharField(max_length=20, choices=PATENT_TYPE, default='utility')
    
    # Dates
    filing_date = models.DateField(null=True, blank=True)
    priority_date = models.DateField(null=True, blank=True)
    grant_date = models.DateField(null=True, blank=True)
    expiry_date = models.DateField(null=True, blank=True)
    
    # Inventors and assignees
    inventors = models.JSONField(default=list, blank=True)
    assignees = models.JSONField(default=list, blank=True)
    
    # Classification (3 separate systems — IPC=international, CPC=cooperative, USPC=US legacy)
    technology_area = models.CharField(max_length=200, blank=True)
    ipc_classifications  = models.JSONField(default=list, blank=True)
    cpc_classifications  = models.JSONField(default=list, blank=True)
    uspc_classifications = models.JSONField(default=list, blank=True)

    # Raw ODP API response — preserves all metadata for later extraction
    odp_raw_data = models.JSONField(default=dict, blank=True)

    # Lens.org cross-reference (column already exists in DB from migration 0014)
    lens_id = models.CharField(max_length=50, blank=True, db_index=True, help_text='Lens.org unique identifier')


    # Financial
    estimated_value = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    maintenance_cost = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    
    # Content
    abstract = models.TextField(blank=True)
    claims = models.JSONField(default=list, blank=True)
    # Full specification text — sourced from USPTO ODP grant_text or pgpub_text
    # (parsed XML description section). Can be 50K–500K chars; loaded on demand.
    description = models.TextField(blank=True)
    description_source = models.CharField(
        max_length=20, blank=True, default='',
        help_text="'grant', 'pgpub', or '' if not loaded",
    )
    description_fetched_at = models.DateTimeField(null=True, blank=True)
    
    # Metadata
    tags = models.JSONField(default=list, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'patents'
        ordering = ['-filing_date', 'title']
        indexes = [
            models.Index(fields=['portfolio']),
            models.Index(fields=['status']),
            models.Index(fields=['patent_type']),
            models.Index(fields=['filing_date']),
        ]
    
    def __str__(self):
        return f"{self.title} ({self.patent_number or self.application_number or 'Draft'})"


class ODPImportJob(models.Model):
    """Tracks background USPTO ODP import jobs for a portfolio."""

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('running', 'Running'),
        ('paused', 'Paused'),
        ('cancelled', 'Cancelled'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    portfolio = models.ForeignKey(Portfolio, on_delete=models.CASCADE, related_name='odp_import_jobs')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    search_params = models.JSONField(default=dict)
    selected_patents_data = models.JSONField(default=list)
    total_expected = models.IntegerField(default=0)
    page_size = models.IntegerField(default=100)
    import_fields = models.JSONField(default=list, blank=True)  # which fields to import
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    processed = models.IntegerField(default=0)
    created_count = models.IntegerField(default=0)
    skipped_count = models.IntegerField(default=0)
    error_message = models.TextField(blank=True)
    celery_task_id = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'odp_import_jobs'
        ordering = ['-created_at']
        indexes = [models.Index(fields=['portfolio', 'status'])]

    def __str__(self):
        return f"ODPImportJob {self.id} ({self.status}) for {self.portfolio}"


class ClassificationDefinition(models.Model):
    """
    IPC/CPC classification codes with human-readable titles.
    ~260K CPC entries + ~80K IPC entries.
    """

    SYSTEM_CHOICES = [('IPC', 'IPC'), ('CPC', 'CPC')]
    LEVEL_CHOICES = [
        ('section', 'Section'),
        ('class', 'Class'),
        ('subclass', 'Subclass'),
        ('group', 'Main Group'),
        ('subgroup', 'Subgroup'),
    ]

    code = models.CharField(max_length=30)
    system = models.CharField(max_length=3, choices=SYSTEM_CHOICES)
    level = models.CharField(max_length=10, choices=LEVEL_CHOICES)
    title = models.TextField()
    parent_code = models.CharField(max_length=30, blank=True, db_index=True)
    indent_level = models.SmallIntegerField(default=0)

    class Meta:
        db_table = 'classification_definitions'
        unique_together = [('code', 'system')]
        indexes = [
            models.Index(fields=['system', 'level']),
            models.Index(fields=['code']),
        ]

    def __str__(self):
        return f"{self.system} {self.code}: {self.title[:60]}"