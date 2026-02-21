"""
Account Domain Models
Professional user management with role-based access control
"""

import uuid
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.core.validators import RegexValidator
from django.utils.translation import gettext_lazy as _


class UserManager(BaseUserManager):
    """Custom user manager for email-based authentication"""
    
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, username=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('status', 'active')
        extra_fields.setdefault('role', 'admin')
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        
        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    """
    Extended User model with professional patent management features
    """
    
    class Role(models.TextChoices):
        ADMIN = 'admin', _('Administrator')
        SUPERVISOR = 'supervisor', _('Supervisor')
        ANALYST = 'analyst', _('Patent Analyst')
        ATTORNEY = 'attorney', _('Patent Attorney')
        CLIENT = 'client', _('Client')
        GUEST = 'guest', _('Guest')
    
    class Status(models.TextChoices):
        ACTIVE = 'active', _('Active')
        INACTIVE = 'inactive', _('Inactive')
        PENDING = 'pending', _('Pending Approval')
        SUSPENDED = 'suspended', _('Suspended')

    # Core fields
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(_('email address'), unique=True)
    
    # Extended profile fields
    phone_number = models.CharField(
        max_length=20, 
        blank=True, 
        validators=[RegexValidator(regex=r'^\+?1?\d{9,15}$', message="Phone number must be valid")]
    )
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    title = models.CharField(max_length=100, blank=True)
    department = models.CharField(max_length=100, blank=True)
    
    # Role and status
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.GUEST)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    
    # Organizational relationships
    organization = models.ForeignKey(
        'Organization', 
        on_delete=models.CASCADE, 
        related_name='users',
        null=True, blank=True
    )
    teams = models.ManyToManyField('Team', related_name='members', blank=True)
    
    # Preferences
    theme_preference = models.CharField(max_length=20, default='professional')
    language = models.CharField(max_length=10, default='en')
    timezone = models.CharField(max_length=50, default='UTC')
    
    # Audit fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_login_at = models.DateTimeField(null=True, blank=True)
    
    objects = UserManager()
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']
    
    class Meta:
        db_table = 'users'
        verbose_name = _('User')
        verbose_name_plural = _('Users')
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['role']),
            models.Index(fields=['status']),
            models.Index(fields=['organization']),
        ]
    
    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.email})"
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()
    
    def has_role(self, role):
        """Check if user has specific role"""
        return self.role == role
    
    def is_active_user(self):
        """Check if user is active"""
        return self.status == self.Status.ACTIVE and self.is_active


class Organization(models.Model):
    """
    Organization model for multi-tenant support
    """
    
    class Industry(models.TextChoices):
        TECHNOLOGY = 'tech', _('Technology')
        PHARMACEUTICAL = 'pharma', _('Pharmaceutical')
        MANUFACTURING = 'manufacturing', _('Manufacturing')
        ENERGY = 'energy', _('Energy')
        AEROSPACE = 'aerospace', _('Aerospace')
        AUTOMOTIVE = 'automotive', _('Automotive')
        OTHER = 'other', _('Other')
    
    class Size(models.TextChoices):
        SMALL = 'small', _('1-50 employees')
        MEDIUM = 'medium', _('51-200 employees')
        LARGE = 'large', _('201-1000 employees')
        ENTERPRISE = 'enterprise', _('1000+ employees')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    domain = models.CharField(max_length=100, unique=True)
    logo = models.ImageField(upload_to='organizations/', blank=True, null=True)
    industry = models.CharField(max_length=20, choices=Industry.choices)
    size = models.CharField(max_length=20, choices=Size.choices)
    
    # Settings
    allowed_domains = models.JSONField(default=list, blank=True)
    sso_enabled = models.BooleanField(default=False)
    mfa_required = models.BooleanField(default=False)
    data_retention_days = models.IntegerField(default=2555)  # 7 years
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'organizations'
        verbose_name = _('Organization')
        verbose_name_plural = _('Organizations')
    
    def __str__(self):
        return self.name


class Team(models.Model):
    """
    Team model for grouping users within organizations
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='teams')
    leader = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, blank=True,
        related_name='led_teams'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'teams'
        verbose_name = _('Team')
        verbose_name_plural = _('Teams')
        unique_together = ['organization', 'name']
    
    def __str__(self):
        return f"{self.organization.name} - {self.name}"


class UserProfile(models.Model):
    """
    Extended user profile for role-specific attributes
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    
    # Role-specific fields
    bar_number = models.CharField(max_length=50, blank=True)
    license_states = models.JSONField(default=list, blank=True)
    specializations = models.JSONField(default=list, blank=True)
    years_experience = models.IntegerField(null=True, blank=True)
    certifications = models.JSONField(default=list, blank=True)
    
    # Analyst-specific fields
    preferred_databases = models.JSONField(default=list, blank=True)
    default_search_strategy = models.CharField(max_length=50, blank=True)
    
    # Client-specific fields
    company_name = models.CharField(max_length=200, blank=True)
    industry = models.CharField(max_length=100, blank=True)
    
    # Attorney-specific fields (deprecated, use above fields)
    hourly_rate = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    bio = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'user_profiles'
        verbose_name = _('User Profile')
        verbose_name_plural = _('User Profiles')
    
    def __str__(self):
        return f"{self.user.full_name} Profile"


class UserSettings(models.Model):
    """
    User-specific settings and preferences
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='settings')
    
    # General Settings
    dark_mode = models.BooleanField(default=False)
    compact_view = models.BooleanField(default=False)
    auto_save = models.BooleanField(default=True)
    keyboard_shortcuts = models.BooleanField(default=True)
    
    # Notification Settings
    email_notifications = models.BooleanField(default=True)
    push_notifications = models.BooleanField(default=True)
    sms_notifications = models.BooleanField(default=False)
    project_updates = models.BooleanField(default=True)
    deadline_alerts = models.BooleanField(default=True)
    team_mentions = models.BooleanField(default=True)
    marketing_emails = models.BooleanField(default=False)
    weekly_digest = models.BooleanField(default=True)
    
    # Privacy Settings
    profile_visibility = models.CharField(
        max_length=20,
        choices=[
            ('public', 'Public'),
            ('organization', 'Organization Only'),
            ('private', 'Private')
        ],
        default='organization'
    )
    activity_tracking = models.BooleanField(default=True)
    data_sharing = models.BooleanField(default=False)
    analytics_opt_in = models.BooleanField(default=True)
    
    # Work Preferences
    working_hours_start = models.TimeField(default='09:00')
    working_hours_end = models.TimeField(default='17:00')
    break_reminders = models.BooleanField(default=False)
    focus_mode = models.BooleanField(default=False)
    
    # Role-specific settings (stored as JSON for flexibility)
    attorney_settings = models.JSONField(default=dict, blank=True)
    analyst_settings = models.JSONField(default=dict, blank=True)
    admin_settings = models.JSONField(default=dict, blank=True)
    client_settings = models.JSONField(default=dict, blank=True)
    
    # Security Settings
    two_factor_enabled = models.BooleanField(default=False)
    session_timeout = models.IntegerField(default=480)  # minutes
    auto_logout = models.BooleanField(default=True)
    login_notifications = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'user_settings'
        verbose_name = _('User Settings')
        verbose_name_plural = _('User Settings')
    
    def __str__(self):
        return f"{self.user.full_name} Settings"


class TwoFactorAuth(models.Model):
    """
    Two-Factor Authentication model to store TOTP secrets
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='two_factor_auth')
    secret_key = models.CharField(max_length=32)  # Base32 encoded TOTP secret
    is_verified = models.BooleanField(default=False)  # Confirmed by user entering valid code
    backup_codes = models.JSONField(default=list, blank=True)  # One-time backup codes

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_used_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'two_factor_auth'
        verbose_name = _('Two-Factor Authentication')
        verbose_name_plural = _('Two-Factor Authentications')

    def __str__(self):
        return f"2FA for {self.user.email}"

    def generate_backup_codes(self, count=10):
        """Generate one-time backup codes"""
        import secrets
        codes = [secrets.token_hex(4).upper() for _ in range(count)]
        self.backup_codes = codes
        self.save()
        return codes

    def use_backup_code(self, code):
        """Use a backup code for authentication"""
        if code.upper() in self.backup_codes:
            self.backup_codes.remove(code.upper())
            self.save()
            return True
        return False


class AttorneyProfile(models.Model):
    """
    Extended profile for patent attorneys (Legacy - use UserProfile instead)
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='attorney_profile')
    bar_number = models.CharField(max_length=50)
    jurisdictions = models.JSONField(default=list)  # List of jurisdictions
    practice_areas = models.JSONField(default=list)  # List of practice areas
    years_of_experience = models.IntegerField(default=0)
    hourly_rate = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    bio = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'attorney_profiles'
        verbose_name = _('Attorney Profile')
        verbose_name_plural = _('Attorney Profiles')
    
    def __str__(self):
        return f"{self.user.full_name} - {self.bar_number}"


class Permission(models.Model):
    """
    Custom permission model for fine-grained access control
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='custom_permissions')
    resource = models.CharField(max_length=100)  # e.g., 'patents', 'projects'
    action = models.CharField(max_length=50)     # e.g., 'read', 'write', 'delete'
    scope = models.CharField(                    # e.g., 'own', 'team', 'organization'
        max_length=20,
        choices=[
            ('own', _('Own Resources')),
            ('team', _('Team Resources')),
            ('organization', _('Organization Resources')),
            ('all', _('All Resources')),
        ],
        default='own'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'permissions'
        verbose_name = _('Permission')
        verbose_name_plural = _('Permissions')
        unique_together = ['user', 'resource', 'action', 'scope']
    
    def __str__(self):
        return f"{self.user.email} - {self.action} {self.resource} ({self.scope})"


class DataConfigurationPermission(models.Model):
    """
    Model for managing data configuration permissions in admin interface
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='data_configuration_permissions')
    
    # Column Mapping Rules Permissions
    can_view_mapping_rules = models.BooleanField(default=False, verbose_name="View Column Mapping Rules")
    can_create_mapping_rules = models.BooleanField(default=False, verbose_name="Create Column Mapping Rules")
    can_edit_mapping_rules = models.BooleanField(default=False, verbose_name="Edit Column Mapping Rules")
    can_delete_mapping_rules = models.BooleanField(default=False, verbose_name="Delete Column Mapping Rules")
    can_activate_mapping_rules = models.BooleanField(default=False, verbose_name="Activate/Deactivate Mapping Rules")
    can_import_export_rules = models.BooleanField(default=False, verbose_name="Import/Export Mapping Rules")
    
    # Dataset Mappings Permissions
    can_view_dataset_mappings = models.BooleanField(default=False, verbose_name="View Dataset Mappings")
    can_edit_dataset_mappings = models.BooleanField(default=False, verbose_name="Edit Dataset Mappings")
    can_approve_mappings = models.BooleanField(default=False, verbose_name="Approve Mapping Suggestions")
    can_reject_mappings = models.BooleanField(default=False, verbose_name="Reject Mapping Suggestions")
    can_bulk_manage_mappings = models.BooleanField(default=False, verbose_name="Bulk Manage Mappings")
    
    # Dynamic Fields Registry Permissions
    can_view_dynamic_fields = models.BooleanField(default=False, verbose_name="View Dynamic Fields Registry")
    can_create_dynamic_fields = models.BooleanField(default=False, verbose_name="Create Dynamic Fields")
    can_edit_dynamic_fields = models.BooleanField(default=False, verbose_name="Edit Dynamic Fields")
    can_delete_dynamic_fields = models.BooleanField(default=False, verbose_name="Delete Dynamic Fields")
    can_migrate_fields = models.BooleanField(default=False, verbose_name="Migrate Dynamic Fields")
    can_archive_fields = models.BooleanField(default=False, verbose_name="Archive Dynamic Fields")
    
    # System-level Data Configuration Permissions
    can_manage_field_types = models.BooleanField(default=False, verbose_name="Manage Field Types")
    can_view_mapping_analytics = models.BooleanField(default=False, verbose_name="View Mapping Analytics")
    can_configure_auto_mapping = models.BooleanField(default=False, verbose_name="Configure Auto-mapping Settings")
    can_manage_migration_system = models.BooleanField(default=False, verbose_name="Manage Migration System")
    can_backup_restore_config = models.BooleanField(default=False, verbose_name="Backup/Restore Configuration")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'data_configuration_permissions'
        verbose_name = _('Data Configuration Permission')
        verbose_name_plural = _('Data Configuration Permissions')
    
    def __str__(self):
        return f"{self.user.full_name} - Data Configuration Permissions"
    
    def has_any_data_config_permission(self):
        """Check if user has any data configuration permission"""
        for field in self._meta.fields:
            if field.name.startswith('can_') and getattr(self, field.name):
                return True
        return False
    
    def get_granted_permissions(self):
        """Get list of granted permissions"""
        permissions = []
        for field in self._meta.fields:
            if field.name.startswith('can_') and getattr(self, field.name):
                permissions.append(field.verbose_name)
        return permissions


class WorkflowUserPermission(models.Model):
    """
    Model for managing workflow permissions in admin interface
    """
    # Import workflow enums
    from domains.workflows.permissions import WorkflowRole
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='workflow_permissions')
    workflow_role = models.CharField(
        max_length=50, 
        choices=[
            ('workflow_admin', 'Workflow Admin'),
            ('workflow_manager', 'Workflow Manager'),
            ('step_owner', 'Step Owner'),
            ('quality_reviewer', 'Quality Reviewer'),
            ('observer', 'Observer'),
        ], 
        default='observer'
    )
    
    # Template Permissions
    can_create_templates = models.BooleanField(default=False, verbose_name="Create Templates")
    can_edit_templates = models.BooleanField(default=False, verbose_name="Edit Templates")
    can_delete_templates = models.BooleanField(default=False, verbose_name="Delete Templates")
    can_activate_templates = models.BooleanField(default=False, verbose_name="Activate Templates")
    can_view_templates = models.BooleanField(default=True, verbose_name="View Templates")
    
    # Workflow Instance Permissions
    can_create_workflows = models.BooleanField(default=False, verbose_name="Create Workflows")
    can_start_workflows = models.BooleanField(default=False, verbose_name="Start Workflows")
    can_pause_workflows = models.BooleanField(default=False, verbose_name="Pause Workflows")
    can_resume_workflows = models.BooleanField(default=False, verbose_name="Resume Workflows")
    can_cancel_workflows = models.BooleanField(default=False, verbose_name="Cancel Workflows")
    can_delete_workflows = models.BooleanField(default=False, verbose_name="Delete Workflows")
    can_assign_workflows = models.BooleanField(default=False, verbose_name="Assign Workflows")
    can_view_workflows = models.BooleanField(default=True, verbose_name="View Workflows")
    
    # Step Management Permissions
    can_execute_steps = models.BooleanField(default=False, verbose_name="Execute Steps")
    can_complete_steps = models.BooleanField(default=False, verbose_name="Complete Steps")
    can_skip_steps = models.BooleanField(default=False, verbose_name="Skip Steps")
    can_reassign_steps = models.BooleanField(default=False, verbose_name="Reassign Steps")
    can_view_steps = models.BooleanField(default=True, verbose_name="View Steps")
    
    # Quality Control Permissions
    can_approve_quality = models.BooleanField(default=False, verbose_name="Approve Quality")
    can_reject_quality = models.BooleanField(default=False, verbose_name="Reject Quality")
    can_override_quality = models.BooleanField(default=False, verbose_name="Override Quality")
    can_view_quality = models.BooleanField(default=True, verbose_name="View Quality")
    
    # System Permissions
    can_manage_roles = models.BooleanField(default=False, verbose_name="Manage Roles")
    can_view_analytics = models.BooleanField(default=False, verbose_name="View Analytics")
    can_manage_system = models.BooleanField(default=False, verbose_name="Manage System")
    
    # Collaboration Permissions
    can_add_comments = models.BooleanField(default=True, verbose_name="Add Comments")
    can_view_comments = models.BooleanField(default=True, verbose_name="View Comments")
    can_mention_users = models.BooleanField(default=True, verbose_name="Mention Users")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'workflow_user_permissions'
        verbose_name = _('Workflow Permission')
        verbose_name_plural = _('Workflow Permissions')
    
    def __str__(self):
        return f"{self.user.full_name} - {self.get_workflow_role_display()}"
    
    def save(self, *args, **kwargs):
        # Auto-set permissions based on role
        if self.workflow_role == 'workflow_admin':
            # Admin gets all permissions
            for field in self._meta.fields:
                if field.name.startswith('can_'):
                    setattr(self, field.name, True)
        elif self.workflow_role == 'workflow_manager':
            # Manager gets most permissions except template management
            self.can_create_workflows = True
            self.can_start_workflows = True
            self.can_pause_workflows = True
            self.can_resume_workflows = True
            self.can_cancel_workflows = True
            self.can_assign_workflows = True
            self.can_view_workflows = True
            self.can_view_steps = True
            self.can_reassign_steps = True
            self.can_skip_steps = True
            self.can_view_quality = True
            self.can_override_quality = True
            self.can_view_analytics = True
            self.can_add_comments = True
            self.can_view_comments = True
            self.can_mention_users = True
        elif self.workflow_role == 'step_owner':
            # Step owner gets execution permissions
            self.can_view_workflows = True
            self.can_execute_steps = True
            self.can_complete_steps = True
            self.can_view_steps = True
            self.can_view_quality = True
            self.can_add_comments = True
            self.can_view_comments = True
        elif self.workflow_role == 'quality_reviewer':
            # Quality reviewer gets review permissions
            self.can_view_workflows = True
            self.can_view_steps = True
            self.can_approve_quality = True
            self.can_reject_quality = True
            self.can_view_quality = True
            self.can_add_comments = True
            self.can_view_comments = True
            self.can_mention_users = True
        elif self.workflow_role == 'observer':
            # Observer gets view-only permissions
            self.can_view_templates = True
            self.can_view_workflows = True
            self.can_view_steps = True
            self.can_view_quality = True
            self.can_view_comments = True

        super().save(*args, **kwargs)


class RolePermission(models.Model):
    """
    Role-based permission matrix
    Stores permissions for each role that can be modified via admin panel
    """

    ROLE_CHOICES = [
        ('admin', 'Administrator'),
        ('manager', 'Manager'),
        ('supervisor', 'Supervisor'),
        ('lead_attorney', 'Lead Attorney'),
        ('attorney', 'Attorney'),
        ('paralegal', 'Paralegal'),
        ('analyst', 'Analyst'),
        ('client', 'Client'),
        ('guest', 'Guest'),
    ]

    role = models.CharField(
        max_length=50,
        unique=True,
        choices=ROLE_CHOICES,
        help_text='Role name (unique)'
    )

    permissions = models.JSONField(
        default=list,
        help_text='List of permission strings for this role'
    )

    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='role_permission_updates',
        help_text='User who last updated these permissions'
    )

    class Meta:
        db_table = 'role_permissions'
        verbose_name = 'Role Permission'
        verbose_name_plural = 'Role Permissions'
        ordering = ['role']

    def __str__(self):
        return f"{self.get_role_display()} - {len(self.permissions)} permissions"


class PermissionAuditLog(models.Model):
    """
    Audit log for permission changes
    Tracks all modifications to user and role permissions
    """

    class Action(models.TextChoices):
        ROLE_PERMISSION_UPDATE = 'role_permission_update', _('Role Permission Update')
        USER_PERMISSION_CREATE = 'user_permission_create', _('User Permission Create')
        USER_PERMISSION_UPDATE = 'user_permission_update', _('User Permission Update')
        USER_PERMISSION_DELETE = 'user_permission_delete', _('User Permission Delete')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Who made the change
    actor = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='permission_changes_made',
        help_text='User who made the permission change'
    )

    # What was changed
    action = models.CharField(
        max_length=50,
        choices=Action.choices,
        help_text='Type of permission change'
    )

    # Target user (if applicable)
    target_user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='permission_changes_received',
        help_text='User whose permissions were modified'
    )

    # Target role (if applicable)
    target_role = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        help_text='Role whose permissions were modified'
    )

    # Change details
    description = models.TextField(
        help_text='Human-readable description of the change'
    )

    # JSON data for detailed change tracking
    changes = models.JSONField(
        default=dict,
        help_text='Detailed change data (added, removed, modified permissions)'
    )

    # IP address and user agent
    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        help_text='IP address of the user who made the change'
    )

    user_agent = models.TextField(
        null=True,
        blank=True,
        help_text='User agent of the browser used'
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Permission Audit Log'
        verbose_name_plural = 'Permission Audit Logs'
        indexes = [
            models.Index(fields=['-created_at']),
            models.Index(fields=['actor']),
            models.Index(fields=['target_user']),
            models.Index(fields=['action']),
        ]

    def __str__(self):
        if self.target_user:
            return f"{self.actor} -> {self.action} for {self.target_user} at {self.created_at}"
        elif self.target_role:
            return f"{self.actor} -> {self.action} for role {self.target_role} at {self.created_at}"
        return f"{self.actor} -> {self.action} at {self.created_at}"