"""
Projects Domain Models
Comprehensive project management models for patent workflows
"""

import uuid
from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone

User = get_user_model()


class ProjectStatus(models.TextChoices):
    DRAFT = 'draft', 'Draft'
    ACTIVE = 'active', 'Active'
    ON_HOLD = 'on_hold', 'On Hold'
    UNDER_REVIEW = 'under_review', 'Under Review'
    FILED = 'filed', 'Filed'
    APPROVED = 'approved', 'Approved'
    REJECTED = 'rejected', 'Rejected'
    COMPLETED = 'completed', 'Completed'
    ARCHIVED = 'archived', 'Archived'


class ProjectPriority(models.TextChoices):
    LOW = 'low', 'Low'
    MEDIUM = 'medium', 'Medium'
    HIGH = 'high', 'High'
    URGENT = 'urgent', 'Urgent'


class LegacyProjectType(models.TextChoices):
    UTILITY_PATENT = 'utility_patent', 'Utility Patent'
    DESIGN_PATENT = 'design_patent', 'Design Patent'
    PROVISIONAL_PATENT = 'provisional_patent', 'Provisional Patent'
    TRADEMARK = 'trademark', 'Trademark'
    COPYRIGHT = 'copyright', 'Copyright'
    TRADE_SECRET = 'trade_secret', 'Trade Secret'
    LICENSING = 'licensing', 'Licensing'
    IP_AUDIT = 'ip_audit', 'IP Audit'


class Project(models.Model):
    """Main project model for patent management"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    type = models.CharField(max_length=100, help_text="Project type ID - references ProjectType model")
    status = models.CharField(max_length=50, choices=ProjectStatus.choices, default=ProjectStatus.DRAFT)
    priority = models.CharField(max_length=20, choices=ProjectPriority.choices, default=ProjectPriority.MEDIUM)
    
    # Client information
    client_name = models.CharField(max_length=200, blank=True)
    client_email = models.EmailField(blank=True)
    
    # Organization (from accounts domain)
    organization = models.ForeignKey(
        'accounts.Organization', 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        related_name='projects'
    )
    
    # Financial
    budget = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    actual_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    currency = models.CharField(max_length=3, default='USD')
    
    # Timeline
    start_date = models.DateField(null=True, blank=True)
    target_date = models.DateField(null=True, blank=True)
    completed_date = models.DateField(null=True, blank=True)
    
    # Team
    lead_attorney = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='led_projects'
    )
    
    # Progress tracking
    progress_percentage = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    
    # Metadata
    tags = models.JSONField(default=list, blank=True)
    is_template = models.BooleanField(default=False)
    template = models.ForeignKey(
        'ProjectTemplate',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_projects'
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_projects')

    class Meta:
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['status', 'priority']),
            models.Index(fields=['type', 'created_at']),
            models.Index(fields=['organization', 'status']),
        ]

    def __str__(self):
        return f"{self.name} ({self.get_status_display()})"

    @property
    def total_tasks(self):
        return self.tasks.count()

    @property
    def completed_tasks(self):
        return self.tasks.filter(status='done').count()

    def update_progress(self):
        """Automatically update progress based on task completion"""
        total = self.total_tasks
        if total > 0:
            completed = self.completed_tasks
            self.progress_percentage = (completed / total) * 100
            self.save(update_fields=['progress_percentage'])

    def calculate_actual_cost(self):
        """Calculate actual cost from time entries and expenses"""
        # This would integrate with time tracking and expense modules
        # For now, return the current actual_cost
        return self.actual_cost


class ProjectMemberRole(models.TextChoices):
    LEAD_ATTORNEY = 'lead_attorney', 'Lead Attorney'
    ATTORNEY = 'attorney', 'Attorney'
    PARALEGAL = 'paralegal', 'Paralegal'
    ADMIN = 'admin', 'Admin'
    VIEWER = 'viewer', 'Viewer'


class ProjectMember(models.Model):
    """Project team membership"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='members')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='project_memberships')
    role = models.CharField(max_length=50, choices=ProjectMemberRole.choices)
    permissions = models.JSONField(default=list)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['project', 'user']

    def __str__(self):
        return f"{self.user.full_name} - {self.project.name} ({self.get_role_display()})"


class TaskStatus(models.TextChoices):
    TODO = 'todo', 'To Do'
    IN_PROGRESS = 'in_progress', 'In Progress'
    REVIEW = 'review', 'Review'
    DONE = 'done', 'Done'
    BLOCKED = 'blocked', 'Blocked'


class ProjectTask(models.Model):
    """Tasks within projects"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='tasks')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=TaskStatus.choices, default=TaskStatus.TODO)
    priority = models.CharField(max_length=20, choices=ProjectPriority.choices, default=ProjectPriority.MEDIUM)
    
    # Assignment
    assigned_to = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='assigned_tasks'
    )
    
    # Timeline
    due_date = models.DateTimeField(null=True, blank=True)
    start_date = models.DateTimeField(null=True, blank=True)
    completed_date = models.DateTimeField(null=True, blank=True)
    estimated_hours = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    actual_hours = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    
    # Hierarchy
    parent_task = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='subtasks'
    )
    dependencies = models.ManyToManyField('self', symmetrical=False, blank=True)
    
    # Progress
    progress_percentage = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    
    # Metadata
    tags = models.JSONField(default=list, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_tasks')

    class Meta:
        ordering = ['due_date', 'priority', 'created_at']
        indexes = [
            models.Index(fields=['project', 'status']),
            models.Index(fields=['assigned_to', 'status']),
            models.Index(fields=['due_date', 'status']),
        ]

    def __str__(self):
        return f"{self.project.name} - {self.title}"

    def save(self, *args, **kwargs):
        # Auto-set completed_date when status changes to done
        if self.status == TaskStatus.DONE and not self.completed_date:
            self.completed_date = timezone.now()
        elif self.status != TaskStatus.DONE:
            self.completed_date = None
        
        super().save(*args, **kwargs)
        
        # Update project progress
        self.project.update_progress()


class TaskComment(models.Model):
    """Comments on tasks"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    task = models.ForeignKey(ProjectTask, on_delete=models.CASCADE, related_name='comments')
    content = models.TextField()
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='task_comments')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Comment by {self.author.full_name} on {self.task.title}"


class FileCategory(models.TextChoices):
    APPLICATION = 'application', 'Application'
    PRIOR_ART = 'prior_art', 'Prior Art'
    CORRESPONDENCE = 'correspondence', 'Correspondence'
    DRAWINGS = 'drawings', 'Drawings'
    CLAIMS = 'claims', 'Claims'
    SPECIFICATION = 'specification', 'Specification'
    CONTRACTS = 'contracts', 'Contracts'
    REPORTS = 'reports', 'Reports'
    OTHER = 'other', 'Other'


class ProjectFile(models.Model):
    """File attachments for projects"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='files')
    file = models.FileField(upload_to='projects/%Y/%m/')
    original_name = models.CharField(max_length=255)
    file_size = models.BigIntegerField()
    mime_type = models.CharField(max_length=100)
    category = models.CharField(max_length=50, choices=FileCategory.choices, default=FileCategory.OTHER)
    
    # Versioning
    version = models.IntegerField(default=1)
    parent_file = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='versions'
    )
    is_latest_version = models.BooleanField(default=True)
    
    # Metadata
    tags = models.JSONField(default=list, blank=True)
    description = models.TextField(blank=True)
    
    # Access tracking
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='uploaded_files')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    last_accessed_at = models.DateTimeField(null=True, blank=True)
    access_count = models.IntegerField(default=0)
    
    # Permissions
    is_public = models.BooleanField(default=False)
    allowed_users = models.ManyToManyField(User, blank=True, related_name='accessible_files')

    class Meta:
        ordering = ['-uploaded_at']
        indexes = [
            models.Index(fields=['project', 'category']),
            models.Index(fields=['uploaded_by', 'uploaded_at']),
        ]

    def __str__(self):
        return f"{self.project.name} - {self.original_name}"

    @property
    def file_url(self):
        return self.file.url if self.file else None

    def increment_access_count(self):
        """Increment access count and update last accessed time"""
        self.access_count += 1
        self.last_accessed_at = timezone.now()
        self.save(update_fields=['access_count', 'last_accessed_at'])


class TaskAttachment(models.Model):
    """File attachments for tasks"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    task = models.ForeignKey(ProjectTask, on_delete=models.CASCADE, related_name='attachments')
    file = models.FileField(upload_to='tasks/%Y/%m/')
    file_name = models.CharField(max_length=255)
    file_size = models.BigIntegerField()
    file_type = models.CharField(max_length=100)
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='task_attachments')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-uploaded_at']

    def __str__(self):
        return f"{self.task.title} - {self.file_name}"

    @property
    def file_url(self):
        return self.file.url if self.file else None


class ProjectMilestone(models.Model):
    """Project milestones and deadlines"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='milestones')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    target_date = models.DateField()
    completed_date = models.DateField(null=True, blank=True)
    is_completed = models.BooleanField(default=False)
    
    # Dependencies
    dependent_tasks = models.ManyToManyField(ProjectTask, blank=True, related_name='milestone_dependencies')
    
    # Metadata
    importance = models.CharField(max_length=20, choices=ProjectPriority.choices, default=ProjectPriority.MEDIUM)
    color = models.CharField(max_length=7, blank=True)  # Hex color code
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_milestones')

    class Meta:
        ordering = ['target_date']

    def __str__(self):
        return f"{self.project.name} - {self.title}"

    def complete(self):
        """Mark milestone as completed"""
        self.is_completed = True
        self.completed_date = timezone.now().date()
        self.save()


class ProjectTemplate(models.Model):
    """Reusable project templates"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    type = models.CharField(max_length=50, choices=LegacyProjectType.choices)
    category = models.CharField(max_length=100)
    
    # Settings
    estimated_duration = models.IntegerField(help_text="Estimated duration in days")
    estimated_budget = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    # Usage tracking
    usage_count = models.IntegerField(default=0)
    is_public = models.BooleanField(default=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_templates')

    class Meta:
        ordering = ['-usage_count', 'name']

    def __str__(self):
        return f"{self.name} ({self.get_type_display()})"

    def increment_usage(self):
        """Increment usage count when template is used"""
        self.usage_count += 1
        self.save(update_fields=['usage_count'])


class TemplateTask(models.Model):
    """Tasks defined in project templates"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    template = models.ForeignKey(ProjectTemplate, on_delete=models.CASCADE, related_name='default_tasks')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    priority = models.CharField(max_length=20, choices=ProjectPriority.choices, default=ProjectPriority.MEDIUM)
    estimated_hours = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    day_offset = models.IntegerField(help_text="Days from project start")
    required_role = models.CharField(
        max_length=50, 
        choices=ProjectMemberRole.choices, 
        blank=True,
        help_text="Required role for task assignment"
    )
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order', 'day_offset']

    def __str__(self):
        return f"{self.template.name} - {self.title}"


class TemplateMilestone(models.Model):
    """Milestones defined in project templates"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    template = models.ForeignKey(ProjectTemplate, on_delete=models.CASCADE, related_name='default_milestones')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    day_offset = models.IntegerField(help_text="Days from project start")
    importance = models.CharField(max_length=20, choices=ProjectPriority.choices, default=ProjectPriority.MEDIUM)
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order', 'day_offset']

    def __str__(self):
        return f"{self.template.name} - {self.title}"


class TemplateFile(models.Model):
    """File placeholders defined in project templates"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    template = models.ForeignKey(ProjectTemplate, on_delete=models.CASCADE, related_name='default_files')
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=50, choices=FileCategory.choices)
    description = models.TextField(blank=True)
    is_required = models.BooleanField(default=False)
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order', 'name']

    def __str__(self):
        return f"{self.template.name} - {self.name}"


# Configurable Project Types Model
class ConfigurableProjectType(models.Model):
    """Configurable project types for the patent platform"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField()
    category = models.CharField(max_length=50, db_index=True)
    
    # Configuration
    is_active = models.BooleanField(default=True)
    required_fields = models.JSONField(default=list, help_text="List of required fields for this project type")
    estimated_duration = models.IntegerField(null=True, blank=True, help_text="Estimated duration in days")
    color = models.CharField(max_length=7, null=True, blank=True, help_text="Hex color code")
    
    # Permissions and Access
    permissions = models.JSONField(default=list, help_text="Required permissions for this project type")
    min_role_level = models.CharField(max_length=20, default='viewer', choices=[
        ('viewer', 'Viewer'),
        ('paralegal', 'Paralegal'),
        ('attorney', 'Attorney'),
        ('lead_attorney', 'Lead Attorney'),
        ('admin', 'Admin'),
    ])
    
    # Metadata
    display_order = models.IntegerField(default=0, help_text="Order for displaying in UI")
    icon = models.CharField(max_length=50, null=True, blank=True)
    
    # Audit
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    
    class Meta:
        ordering = ['display_order', 'name']
        verbose_name = "Configurable Project Type"
        verbose_name_plural = "Configurable Project Types"
        
    def __str__(self):
        return self.name


# Default project types data
DEFAULT_PROJECT_TYPES = [
    {
        'name': 'Prior Art Search - Patentability',
        'description': 'Comprehensive prior art search to assess patentability of an invention',
        'category': 'Search Services',
        'required_fields': ['invention_description', 'technical_field', 'search_scope'],
        'estimated_duration': 5,
        'color': '#3B82F6',
        'min_role_level': 'paralegal',
    },
    {
        'name': 'Prior Art Search - Validity',
        'description': 'Search to validate or challenge existing patent claims',
        'category': 'Search Services', 
        'required_fields': ['patent_number', 'claims_to_analyze', 'search_scope'],
        'estimated_duration': 7,
        'color': '#10B981',
        'min_role_level': 'attorney',
    },
    {
        'name': 'Prior Art Search - Invalidity',
        'description': 'Search for prior art to invalidate competitor patents',
        'category': 'Search Services',
        'required_fields': ['target_patent', 'claims_to_challenge', 'search_strategy'],
        'estimated_duration': 10,
        'color': '#F59E0B',
        'min_role_level': 'attorney',
    },
    {
        'name': 'Freedom to Operate Search',
        'description': 'FTO analysis to assess freedom to commercialize a product',
        'category': 'Search Services',
        'required_fields': ['product_description', 'market_regions', 'commercialization_date'],
        'estimated_duration': 14,
        'color': '#EF4444',
        'min_role_level': 'attorney',
    },
    {
        'name': 'Infringement Search',
        'description': 'Search for potential patent infringement issues',
        'category': 'Search Services',
        'required_fields': ['product_specifications', 'patent_portfolio', 'jurisdiction'],
        'estimated_duration': 8,
        'color': '#8B5CF6',
        'min_role_level': 'attorney',
    },
    {
        'name': 'State of Art Search',
        'description': 'Comprehensive technology landscape analysis',
        'category': 'Search Services',
        'required_fields': ['technology_domain', 'time_period', 'geographic_scope'],
        'estimated_duration': 12,
        'color': '#06B6D4',
        'min_role_level': 'paralegal',
    },
    {
        'name': 'Patent Portfolio Analysis',
        'description': 'Strategic analysis of patent portfolios',
        'category': 'Analytics',
        'required_fields': ['portfolio_scope', 'analysis_objectives', 'competitive_landscape'],
        'estimated_duration': 21,
        'color': '#84CC16',
        'min_role_level': 'attorney',
    },
    {
        'name': 'Patent Drafting - Utility',
        'description': 'Professional utility patent application drafting',
        'category': 'Drafting Services',
        'required_fields': ['invention_disclosure', 'inventor_information', 'filing_jurisdiction'],
        'estimated_duration': 30,
        'color': '#F97316',
        'min_role_level': 'attorney',
    },
    {
        'name': 'Patent Drafting - Provisional',
        'description': 'Provisional patent application preparation',
        'category': 'Drafting Services',
        'required_fields': ['invention_summary', 'priority_claims', 'filing_strategy'],
        'estimated_duration': 14,
        'color': '#EC4899',
        'min_role_level': 'attorney',
    },
    {
        'name': 'Patent Illustration',
        'description': 'Professional patent drawing and illustration services',
        'category': 'Support Services',
        'required_fields': ['specification_document', 'drawing_requirements', 'filing_jurisdiction'],
        'estimated_duration': 7,
        'color': '#6366F1',
        'min_role_level': 'paralegal',
    },
    {
        'name': 'Patent Proofreading',
        'description': 'Professional proofreading and quality assurance',
        'category': 'Support Services',
        'required_fields': ['document_type', 'deadline', 'quality_requirements'],
        'estimated_duration': 3,
        'color': '#14B8A6',
        'min_role_level': 'paralegal',
    },
]


# Custom Manager for Imported Patents
class ActiveImportedPatentManager(models.Manager):
    """Manager to get only non-deleted imported patents"""
    def get_queryset(self):
        return super().get_queryset().filter(is_deleted=False)


class ImportBatchStatus(models.TextChoices):
    """Status choices for import batches"""
    PROCESSING = 'processing', 'Processing'
    COMPLETED = 'completed', 'Completed'
    FAILED = 'failed', 'Failed'
    PARTIAL = 'partial', 'Partially Completed'


class ImportBatch(models.Model):
    """Import batch to group patents from the same upload"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='import_batches')
    
    # Batch metadata
    batch_name = models.CharField(max_length=200, blank=True)
    batch_description = models.TextField(blank=True)
    source_filename = models.CharField(max_length=255)
    total_rows = models.IntegerField(default=0)
    successful_imports = models.IntegerField(default=0)
    failed_imports = models.IntegerField(default=0)
    status = models.CharField(max_length=20, choices=ImportBatchStatus.choices, default=ImportBatchStatus.PROCESSING)
    
    # Import settings
    import_settings = models.JSONField(default=dict, help_text="Column mappings and import configuration")
    
    # Audit trail
    imported_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='patent_import_batches')
    imported_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Error tracking
    error_log = models.JSONField(default=list, help_text="List of errors encountered during import")
    
    class Meta:
        ordering = ['-imported_at']
        indexes = [
            models.Index(fields=['project', 'status']),
            models.Index(fields=['imported_by', 'imported_at']),
        ]
    
    def __str__(self):
        return f"{self.project.name} - {self.source_filename} ({self.imported_at.strftime('%Y-%m-%d')})"
    
    @property
    def success_rate(self):
        """Calculate success rate percentage"""
        if self.total_rows == 0:
            return 0
        return (self.successful_imports / self.total_rows) * 100
    
    def mark_completed(self):
        """Mark batch as completed"""
        self.status = ImportBatchStatus.COMPLETED
        self.completed_at = timezone.now()
        self.save(update_fields=['status', 'completed_at'])


class ImportedPatent(models.Model):
    """Individual imported patent records"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Association
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='imported_patents')
    import_batch = models.ForeignKey(ImportBatch, on_delete=models.CASCADE, related_name='patents')
    
    # Core patent data
    patent_id = models.CharField(max_length=100, db_index=True)
    title = models.TextField()
    abstract = models.TextField(blank=True)
    
    # Dates
    publication_date = models.DateField(null=True, blank=True)
    application_date = models.DateField(null=True, blank=True)
    priority_date = models.DateField(null=True, blank=True)
    
    # Identifiers
    publication_number = models.CharField(max_length=100, blank=True)
    application_number = models.CharField(max_length=100, blank=True)
    family_id = models.CharField(max_length=100, blank=True)
    
    # Parties
    assignee = models.TextField(blank=True)
    inventors = models.JSONField(default=list, help_text="List of inventor names")
    
    # Classifications
    ipc_classes = models.JSONField(default=list, help_text="IPC classification codes")
    cpc_classes = models.JSONField(default=list, help_text="CPC classification codes")
    
    # Geographic and legal data
    jurisdiction = models.CharField(max_length=50, blank=True)
    legal_status = models.CharField(max_length=100, blank=True)
    
    # Additional data
    keywords = models.TextField(blank=True)
    citations = models.JSONField(default=list, help_text="List of cited patents")
    
    # Relevance and selection
    is_selected = models.BooleanField(default=False)
    manual_relevance = models.CharField(
        max_length=20, 
        choices=[
            ('high', 'High'),
            ('medium', 'Medium'), 
            ('low', 'Low'),
            ('not_relevant', 'Not Relevant')
        ],
        blank=True
    )
    relevance_score = models.DecimalField(max_digits=5, decimal_places=4, null=True, blank=True)
    user_notes = models.TextField(blank=True)
    
    # Import metadata
    source_row_number = models.IntegerField(null=True, blank=True, help_text="Row number in source file")
    import_errors = models.JSONField(default=list, help_text="Validation errors during import")
    
    # Soft delete functionality
    is_deleted = models.BooleanField(default=False, db_index=True)
    deleted_at = models.DateTimeField(null=True, blank=True)
    deleted_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='deleted_imported_patents'
    )
    deletion_reason = models.CharField(max_length=255, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Managers
    objects = models.Manager()  # Default manager (includes deleted)
    active = ActiveImportedPatentManager()  # Only non-deleted patents
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['project', 'is_deleted']),
            models.Index(fields=['import_batch', 'is_deleted']),
            models.Index(fields=['patent_id', 'project']),
            models.Index(fields=['is_selected', 'project']),
            models.Index(fields=['manual_relevance', 'project']),
        ]
        # Prevent duplicate patents within the same project
        unique_together = ['project', 'patent_id', 'is_deleted']
    
    def __str__(self):
        return f"{self.patent_id} - {self.title[:50]}..."
    
    def soft_delete(self, user=None, reason=""):
        """Soft delete the patent"""
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.deleted_by = user
        self.deletion_reason = reason
        self.save(update_fields=['is_deleted', 'deleted_at', 'deleted_by', 'deletion_reason'])
    
    def restore(self):
        """Restore a soft-deleted patent"""
        self.is_deleted = False
        self.deleted_at = None
        self.deleted_by = None
        self.deletion_reason = ""
        self.save(update_fields=['is_deleted', 'deleted_at', 'deleted_by', 'deletion_reason'])
    
    @property
    def display_inventors(self):
        """Get inventors as a formatted string"""
        if not self.inventors:
            return ""
        return "; ".join(self.inventors)
    
    @property 
    def display_classifications(self):
        """Get all classifications as a formatted string"""
        all_classes = []
        if self.ipc_classes:
            all_classes.extend([f"IPC: {c}" for c in self.ipc_classes])
        if self.cpc_classes:
            all_classes.extend([f"CPC: {c}" for c in self.cpc_classes])
        return "; ".join(all_classes)
    
    @property
    def source_info(self):
        """Get source information for tracking"""
        return {
            'batch_id': str(self.import_batch.id),
            'filename': self.import_batch.source_filename,
            'imported_by': self.import_batch.imported_by.get_full_name(),
            'imported_at': self.import_batch.imported_at,
            'row_number': self.source_row_number
        }