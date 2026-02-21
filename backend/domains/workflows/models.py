"""
Workflows Domain Models
Comprehensive workflow management system for patent processes
"""

import uuid
from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType

User = get_user_model()


class WorkflowStatus(models.TextChoices):
    """Workflow template and instance statuses"""
    DRAFT = 'draft', 'Draft'
    ACTIVE = 'active', 'Active'
    INACTIVE = 'inactive', 'Inactive'
    ARCHIVED = 'archived', 'Archived'


class WorkflowInstanceStatus(models.TextChoices):
    """Workflow instance execution statuses"""
    PENDING = 'pending', 'Pending'
    IN_PROGRESS = 'in_progress', 'In Progress'
    ON_HOLD = 'on_hold', 'On Hold'
    COMPLETED = 'completed', 'Completed'
    FAILED = 'failed', 'Failed'
    CANCELLED = 'cancelled', 'Cancelled'


class WorkflowPriority(models.TextChoices):
    """Workflow priority levels - consistent with projects"""
    LOW = 'low', 'Low'
    MEDIUM = 'medium', 'Medium'
    HIGH = 'high', 'High'
    URGENT = 'urgent', 'Urgent'


class WorkflowTemplate(models.Model):
    """Reusable workflow templates for any process"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=100, db_index=True)
    
    # Configuration
    version = models.CharField(max_length=20, default='1.0')
    is_active = models.BooleanField(default=True)
    is_template = models.BooleanField(default=True)
    
    # Process configuration
    estimated_duration = models.IntegerField(
        null=True, 
        blank=True, 
        help_text="Estimated duration in days"
    )
    auto_assign = models.BooleanField(default=False, help_text="Auto-assign steps based on roles")
    require_sequential = models.BooleanField(default=True, help_text="Steps must be completed in order")
    allow_parallel = models.BooleanField(default=False, help_text="Allow parallel step execution")
    
    # Quality settings
    quality_threshold = models.IntegerField(
        default=80,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Minimum quality score required (0-100)"
    )
    require_approval = models.BooleanField(default=False, help_text="Require final approval")
    
    # Permissions and Access - consistent with projects
    permissions = models.JSONField(default=list, help_text="Required permissions for this workflow")
    min_role_level = models.CharField(max_length=20, default='viewer', choices=[
        ('viewer', 'Viewer'),
        ('paralegal', 'Paralegal'),
        ('attorney', 'Attorney'),
        ('lead_attorney', 'Lead Attorney'),
        ('admin', 'Admin'),
    ])
    
    # Usage tracking
    usage_count = models.IntegerField(default=0)
    success_rate = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        default=0.00,
        help_text="Success rate percentage"
    )
    
    # Organization context
    organization = models.ForeignKey(
        'accounts.Organization',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='workflow_templates'
    )
    
    # Metadata - consistent with projects
    tags = models.JSONField(default=list, blank=True)
    color = models.CharField(max_length=7, null=True, blank=True, help_text="Hex color code")
    icon = models.CharField(max_length=50, null=True, blank=True)
    display_order = models.IntegerField(default=0, help_text="Order for displaying in UI")
    
    # Timestamps - consistent pattern
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_workflow_templates')

    class Meta:
        ordering = ['display_order', 'name']
        indexes = [
            models.Index(fields=['category', 'is_active']),
            models.Index(fields=['organization', 'is_active']),
            models.Index(fields=['created_by', 'created_at']),
        ]
        
    def __str__(self):
        return f"{self.name} v{self.version}"

    def increment_usage(self):
        """Increment usage count when template is used"""
        self.usage_count += 1
        self.save(update_fields=['usage_count'])

    def update_success_rate(self):
        """Update success rate based on completed instances"""
        completed_instances = self.instances.filter(status=WorkflowInstanceStatus.COMPLETED)
        total_instances = self.instances.exclude(status=WorkflowInstanceStatus.PENDING)
        
        if total_instances.exists():
            success_count = completed_instances.count()
            total_count = total_instances.count()
            self.success_rate = (success_count / total_count) * 100
            self.save(update_fields=['success_rate'])


class StepType(models.TextChoices):
    """Types of workflow steps"""
    MANUAL = 'manual', 'Manual Task'
    AUTOMATED = 'automated', 'Automated Check'
    APPROVAL = 'approval', 'Approval Required'
    DOCUMENT = 'document', 'Document Upload'
    REVIEW = 'review', 'Review & Feedback'
    QUALITY_GATE = 'quality_gate', 'Quality Control Gate'
    NOTIFICATION = 'notification', 'Send Notification'


class StepStatus(models.TextChoices):
    """Step execution statuses"""
    PENDING = 'pending', 'Pending'
    IN_PROGRESS = 'in_progress', 'In Progress'
    WAITING_APPROVAL = 'waiting_approval', 'Waiting Approval'
    COMPLETED = 'completed', 'Completed'
    FAILED = 'failed', 'Failed'
    SKIPPED = 'skipped', 'Skipped'


class WorkflowStep(models.Model):
    """Individual steps within workflow templates"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workflow_template = models.ForeignKey(
        WorkflowTemplate, 
        on_delete=models.CASCADE, 
        related_name='steps'
    )
    
    # Step identification
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    step_type = models.CharField(max_length=20, choices=StepType.choices, default=StepType.MANUAL)
    
    # Ordering and dependencies
    order = models.IntegerField(default=0)
    depends_on = models.ManyToManyField(
        'self', 
        symmetrical=False, 
        blank=True,
        related_name='dependent_steps'
    )
    
    # Configuration
    is_required = models.BooleanField(default=True)
    is_parallel = models.BooleanField(default=False, help_text="Can execute in parallel with other steps")
    auto_complete = models.BooleanField(default=False, help_text="Auto-complete when conditions met")
    
    # Time estimates - consistent with projects
    estimated_duration = models.IntegerField(
        null=True, 
        blank=True, 
        help_text="Estimated duration in hours"
    )
    estimated_hours = models.DecimalField(
        max_digits=6, 
        decimal_places=2, 
        null=True, 
        blank=True
    )
    
    # Assignment rules
    assigned_role = models.CharField(
        max_length=50,
        blank=True,
        help_text="Role required to execute this step"
    )
    assigned_user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_workflow_steps',
        help_text="Specific user assignment (optional)"
    )
    
    # Quality control
    quality_criteria = models.JSONField(
        default=dict, 
        blank=True,
        help_text="Quality validation criteria for this step"
    )
    required_approvals = models.IntegerField(
        default=0,
        help_text="Number of approvals required"
    )
    approver_roles = models.JSONField(
        default=list,
        blank=True,
        help_text="Roles that can approve this step"
    )
    
    # Step configuration
    configuration = models.JSONField(
        default=dict,
        blank=True,
        help_text="Step-specific configuration options"
    )
    
    # Actions and validations
    actions = models.JSONField(
        default=list,
        blank=True,
        help_text="Actions to be performed in this step"
    )
    validations = models.JSONField(
        default=list,
        blank=True,
        help_text="Validation rules for step completion"
    )
    
    # Metadata - consistent pattern
    tags = models.JSONField(default=list, blank=True)
    priority = models.CharField(
        max_length=20, 
        choices=WorkflowPriority.choices, 
        default=WorkflowPriority.MEDIUM
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_workflow_steps')

    class Meta:
        ordering = ['workflow_template', 'order']
        indexes = [
            models.Index(fields=['workflow_template', 'order']),
            models.Index(fields=['assigned_user', 'step_type']),
        ]
        
    def __str__(self):
        return f"{self.workflow_template.name} - {self.name}"


class WorkflowInstance(models.Model):
    """Active workflow instances attached to specific objects"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workflow_template = models.ForeignKey(
        WorkflowTemplate, 
        on_delete=models.CASCADE, 
        related_name='instances'
    )
    
    # Instance identification
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    status = models.CharField(
        max_length=20, 
        choices=WorkflowInstanceStatus.choices, 
        default=WorkflowInstanceStatus.PENDING
    )
    
    # Generic foreign key to attach to any model (Project, etc.)
    # Made nullable for standalone workflows
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True, blank=True)
    object_id = models.UUIDField(null=True, blank=True)
    content_object = GenericForeignKey('content_type', 'object_id')
    
    # Progress tracking - consistent with projects
    progress_percentage = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    current_step_order = models.IntegerField(default=0)
    
    # Timeline - consistent with projects
    start_date = models.DateTimeField(null=True, blank=True)
    due_date = models.DateTimeField(null=True, blank=True)
    completed_date = models.DateTimeField(null=True, blank=True)
    actual_duration = models.IntegerField(null=True, blank=True, help_text="Actual duration in hours")
    
    # Team and assignments
    assigned_to = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_workflow_instances'
    )
    participants = models.ManyToManyField(
        User,
        blank=True,
        related_name='workflow_participations'
    )
    
    # Quality and approvals
    quality_score = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    final_approver = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_workflows'
    )
    approval_date = models.DateTimeField(null=True, blank=True)
    
    # Configuration overrides
    configuration_overrides = models.JSONField(
        default=dict,
        blank=True,
        help_text="Instance-specific configuration overrides"
    )
    
    # Version tracking
    template_version = models.CharField(
        max_length=20,
        blank=True,
        help_text="Version of template used when instance was created"
    )
    
    # Metadata - consistent pattern
    tags = models.JSONField(default=list, blank=True)
    priority = models.CharField(
        max_length=20, 
        choices=WorkflowPriority.choices, 
        default=WorkflowPriority.MEDIUM
    )
    
    # Organization context
    organization = models.ForeignKey(
        'accounts.Organization',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='workflow_instances'
    )
    
    # Audit trail
    audit_log = models.JSONField(
        default=list,
        blank=True,
        help_text="Audit trail of workflow execution"
    )
    
    # Timestamps - consistent pattern
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_workflow_instances')

    class Meta:
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['status', 'priority']),
            models.Index(fields=['content_type', 'object_id']),
            models.Index(fields=['assigned_to', 'status']),
            models.Index(fields=['organization', 'status']),
            models.Index(fields=['due_date', 'status']),
        ]
        
    def __str__(self):
        return f"{self.name} - {self.get_status_display()}"

    def update_progress(self):
        """Update progress based on completed steps"""
        total_steps = self.step_instances.count()
        if total_steps > 0:
            completed_steps = self.step_instances.filter(status=StepStatus.COMPLETED).count()
            self.progress_percentage = (completed_steps / total_steps) * 100
            self.save(update_fields=['progress_percentage'])

    def add_audit_entry(self, action, user, details=None):
        """Add entry to audit log"""
        entry = {
            'timestamp': timezone.now().isoformat(),
            'action': action,
            'user': user.get_full_name() if user else 'System',
            'user_id': str(user.id) if user else None,
            'details': details or {}
        }
        self.audit_log.append(entry)
        self.save(update_fields=['audit_log'])

    def start(self, user=None):
        """Start workflow execution"""
        self.status = WorkflowInstanceStatus.IN_PROGRESS
        self.start_date = timezone.now()
        self.save()
        self.add_audit_entry('workflow_started', user)

    def complete(self, user=None):
        """Complete workflow execution"""
        self.status = WorkflowInstanceStatus.COMPLETED
        self.completed_date = timezone.now()
        self.progress_percentage = 100
        self.save()
        self.add_audit_entry('workflow_completed', user)
        
        # Update template success rate
        self.workflow_template.update_success_rate()


class WorkflowStepInstance(models.Model):
    """Individual step instances within workflow execution"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workflow_instance = models.ForeignKey(
        WorkflowInstance,
        on_delete=models.CASCADE,
        related_name='step_instances'
    )
    workflow_step = models.ForeignKey(
        WorkflowStep,
        on_delete=models.CASCADE,
        related_name='step_instances'
    )
    
    # Step execution state
    status = models.CharField(
        max_length=20, 
        choices=StepStatus.choices, 
        default=StepStatus.PENDING
    )
    
    # Assignment and execution
    assigned_to = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_step_instances'
    )
    
    # Timeline - consistent with projects
    start_date = models.DateTimeField(null=True, blank=True)
    due_date = models.DateTimeField(null=True, blank=True)
    completed_date = models.DateTimeField(null=True, blank=True)
    actual_hours = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    
    # Quality and results
    quality_score = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    output_data = models.JSONField(
        default=dict,
        blank=True,
        help_text="Step execution results and outputs"
    )
    
    # Comments and feedback
    notes = models.TextField(blank=True)
    feedback = models.TextField(blank=True)
    
    # Configuration
    step_configuration = models.JSONField(
        default=dict,
        blank=True,
        help_text="Step-specific configuration for this instance"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['workflow_instance', 'workflow_step__order']
        indexes = [
            models.Index(fields=['workflow_instance', 'status']),
            models.Index(fields=['assigned_to', 'status']),
            models.Index(fields=['due_date', 'status']),
        ]
        
    def __str__(self):
        return f"{self.workflow_instance.name} - {self.workflow_step.name}"

    def start(self, user=None):
        """Start step execution"""
        self.status = StepStatus.IN_PROGRESS
        self.start_date = timezone.now()
        if user:
            self.assigned_to = user
        self.save()
        
        # Add audit entry to workflow instance
        self.workflow_instance.add_audit_entry(
            'step_started',
            user,
            {'step': self.workflow_step.name}
        )

    def complete(self, user=None, quality_score=None, output_data=None):
        """Complete step execution"""
        self.status = StepStatus.COMPLETED
        self.completed_date = timezone.now()
        
        if quality_score is not None:
            self.quality_score = quality_score
            
        if output_data:
            self.output_data.update(output_data)
            
        self.save()
        
        # Update workflow progress
        self.workflow_instance.update_progress()
        
        # Add audit entry
        self.workflow_instance.add_audit_entry(
            'step_completed',
            user,
            {'step': self.workflow_step.name, 'quality_score': quality_score}
        )


class QualityControlType(models.TextChoices):
    """Types of quality control checks"""
    AUTOMATED = 'automated', 'Automated Check'
    MANUAL = 'manual', 'Manual Review'
    CHECKLIST = 'checklist', 'Checklist Validation'
    PEER_REVIEW = 'peer_review', 'Peer Review'
    EXPERT_REVIEW = 'expert_review', 'Expert Review'
    COMPLIANCE = 'compliance', 'Compliance Check'


class QualityControl(models.Model):
    """Quality control definitions for workflows and steps"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    type = models.CharField(max_length=20, choices=QualityControlType.choices)
    
    # Scope - can be applied to workflows or specific steps
    workflow_template = models.ForeignKey(
        WorkflowTemplate,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='quality_controls'
    )
    workflow_step = models.ForeignKey(
        WorkflowStep,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='quality_controls'
    )
    
    # Quality criteria and validation rules
    criteria = models.JSONField(
        default=dict,
        help_text="Quality criteria and validation rules"
    )
    passing_score = models.IntegerField(
        default=70,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    
    # Actions
    on_pass_actions = models.JSONField(
        default=list,
        blank=True,
        help_text="Actions to execute when quality check passes"
    )
    on_fail_actions = models.JSONField(
        default=list,
        blank=True,
        help_text="Actions to execute when quality check fails"
    )
    
    # Configuration
    is_required = models.BooleanField(default=True)
    is_blocking = models.BooleanField(
        default=True,
        help_text="Block workflow progression if quality check fails"
    )
    auto_remediate = models.BooleanField(
        default=False,
        help_text="Automatically attempt to fix issues"
    )
    
    # Assignment for manual reviews
    reviewer_roles = models.JSONField(
        default=list,
        blank=True,
        help_text="Roles that can perform this quality review"
    )
    required_reviewers = models.IntegerField(default=1)
    
    # Metadata
    tags = models.JSONField(default=list, blank=True)
    weight = models.IntegerField(
        default=1,
        help_text="Weight of this quality control in overall scoring"
    )
    
    # Timestamps - consistent pattern
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_quality_controls')

    class Meta:
        ordering = ['workflow_template', 'workflow_step', 'name']
        
    def __str__(self):
        scope = self.workflow_step.name if self.workflow_step else self.workflow_template.name
        return f"{scope} - {self.name}"


class QualityCheckResult(models.Model):
    """Results of quality control checks execution"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    quality_control = models.ForeignKey(
        QualityControl,
        on_delete=models.CASCADE,
        related_name='check_results'
    )
    step_instance = models.ForeignKey(
        WorkflowStepInstance,
        on_delete=models.CASCADE,
        related_name='quality_results'
    )
    
    # Results
    passed = models.BooleanField()
    score = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    details = models.JSONField(
        default=dict,
        help_text="Detailed results and findings"
    )
    
    # Review information
    reviewer = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='quality_reviews'
    )
    review_notes = models.TextField(blank=True)
    
    # Remediation
    requires_remediation = models.BooleanField(default=False)
    remediation_actions = models.JSONField(default=list, blank=True)
    remediated_at = models.DateTimeField(null=True, blank=True)
    
    # Timestamps
    checked_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-checked_at']
        
    def __str__(self):
        status = "PASS" if self.passed else "FAIL"
        return f"{self.quality_control.name} - {status} ({self.score}%)"


class WorkflowRoleAssignment(models.Model):
    """
    Assigns workflow-specific roles to users for specific workflows or system-wide
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='workflow_role_assignments'
    )
    role = models.CharField(
        max_length=50,
        choices=[
            ('workflow_admin', 'Workflow Admin'),
            ('workflow_manager', 'Workflow Manager'),
            ('step_owner', 'Step Owner'),
            ('quality_reviewer', 'Quality Reviewer'),
            ('observer', 'Observer'),
        ],
        help_text="Workflow-specific role"
    )
    
    # Optional: Role can be assigned to specific workflow or template
    workflow_instance = models.ForeignKey(
        WorkflowInstance,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='role_assignments',
        help_text="Specific workflow instance (null = system-wide role)"
    )
    workflow_template = models.ForeignKey(
        WorkflowTemplate,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='role_assignments',
        help_text="Specific template (null = system-wide role)"
    )
    
    # Role scope and permissions
    is_active = models.BooleanField(default=True)
    granted_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='granted_workflow_roles'
    )
    granted_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Role expiration date (null = no expiration)"
    )
    
    # Additional context
    notes = models.TextField(
        blank=True,
        help_text="Notes about this role assignment"
    )
    
    class Meta:
        db_table = 'workflow_role_assignments'
        ordering = ['-granted_at']
        unique_together = [
            ('user', 'role', 'workflow_instance'),
            ('user', 'role', 'workflow_template'),
        ]
        indexes = [
            models.Index(fields=['user', 'is_active']),
            models.Index(fields=['role', 'is_active']),
            models.Index(fields=['workflow_instance', 'role']),
            models.Index(fields=['workflow_template', 'role']),
        ]
    
    def __str__(self):
        scope = "system-wide"
        if self.workflow_instance:
            scope = f"workflow: {self.workflow_instance.name}"
        elif self.workflow_template:
            scope = f"template: {self.workflow_template.name}"
        
        return f"{self.user.get_full_name()} - {self.get_role_display()} ({scope})"
    
    def is_valid(self) -> bool:
        """Check if role assignment is currently valid"""
        if not self.is_active:
            return False
        
        if self.expires_at and timezone.now() > self.expires_at:
            return False
        
        return True


class WorkflowCollaborator(models.Model):
    """
    Manages workflow collaboration - users who can view and comment on workflows
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workflow_instance = models.ForeignKey(
        WorkflowInstance,
        on_delete=models.CASCADE,
        related_name='collaborators'
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='workflow_collaborations'
    )
    
    # Collaboration permissions
    can_comment = models.BooleanField(default=True)
    can_view_sensitive = models.BooleanField(
        default=False,
        help_text="Can view sensitive information"
    )
    can_receive_notifications = models.BooleanField(default=True)
    
    # Collaboration metadata
    added_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='added_workflow_collaborators'
    )
    added_at = models.DateTimeField(auto_now_add=True)
    last_activity = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'workflow_collaborators'
        ordering = ['-added_at']
        unique_together = [('workflow_instance', 'user')]
        indexes = [
            models.Index(fields=['workflow_instance', 'can_comment']),
            models.Index(fields=['user', 'can_receive_notifications']),
        ]
    
    def __str__(self):
        return f"{self.workflow_instance.name} - {self.user.get_full_name()}"


class WorkflowComment(models.Model):
    """
    Comments and discussions on workflows and steps
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workflow_instance = models.ForeignKey(
        WorkflowInstance,
        on_delete=models.CASCADE,
        related_name='comments'
    )
    step_instance = models.ForeignKey(
        WorkflowStepInstance,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='comments',
        help_text="Optional: Comment on specific step"
    )
    
    # Comment content
    author = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='workflow_comments'
    )
    content = models.TextField()
    is_internal = models.BooleanField(
        default=False,
        help_text="Internal comment (not visible to clients)"
    )
    
    # Threading support
    parent_comment = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='replies'
    )
    thread_level = models.IntegerField(default=0)
    
    # Mentions and notifications
    mentioned_users = models.ManyToManyField(
        User,
        blank=True,
        related_name='workflow_comment_mentions'
    )
    
    # Status and metadata
    is_edited = models.BooleanField(default=False)
    edited_at = models.DateTimeField(null=True, blank=True)
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'workflow_comments'
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['workflow_instance', 'created_at']),
            models.Index(fields=['step_instance', 'created_at']),
            models.Index(fields=['author', 'created_at']),
            models.Index(fields=['is_deleted', 'is_internal']),
        ]
    
    def __str__(self):
        scope = f"Step: {self.step_instance.workflow_step.name}" if self.step_instance else "Workflow"
        return f"{self.author.get_full_name()} - {scope} ({self.created_at.strftime('%Y-%m-%d %H:%M')})"
    
    def get_thread_comments(self):
        """Get all comments in this thread"""
        if self.parent_comment:
            return self.parent_comment.get_thread_comments()
        return WorkflowComment.objects.filter(
            models.Q(id=self.id) | models.Q(parent_comment=self)
        ).order_by('created_at')