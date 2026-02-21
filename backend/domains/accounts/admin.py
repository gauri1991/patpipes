"""
Accounts Admin Interface
"""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import (
    User, Organization, Team, UserProfile, UserSettings, 
    AttorneyProfile, Permission
)

from .models import WorkflowUserPermission, DataConfigurationPermission


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = [
        'email', 'first_name', 'last_name', 'role', 'status', 
        'organization', 'is_active', 'date_joined'
    ]
    list_filter = [
        'role', 'status', 'organization', 'is_active', 
        'is_staff', 'is_superuser', 'date_joined'
    ]
    search_fields = ['email', 'first_name', 'last_name', 'title', 'department']
    ordering = ['-date_joined']
    
    fieldsets = (
        (None, {
            'fields': ('email', 'password')
        }),
        ('Personal Info', {
            'fields': ('first_name', 'last_name', 'phone_number', 'avatar', 'title', 'department')
        }),
        ('Role & Status', {
            'fields': ('role', 'status', 'organization')
        }),
        ('Teams', {
            'fields': ('teams',)
        }),
        ('Preferences', {
            'fields': ('theme_preference', 'language', 'timezone'),
            'classes': ('collapse',)
        }),
        ('Permissions', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
            'classes': ('collapse',)
        }),
        ('Important Dates', {
            'fields': ('last_login', 'date_joined', 'last_login_at'),
            'classes': ('collapse',)
        })
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'first_name', 'last_name', 'password1', 'password2', 'role', 'organization'),
        }),
    )
    
    filter_horizontal = ('groups', 'user_permissions', 'teams')


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ['name', 'domain', 'industry', 'size', 'user_count', 'created_at']
    list_filter = ['industry', 'size', 'sso_enabled', 'mfa_required', 'created_at']
    search_fields = ['name', 'domain']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'domain', 'logo', 'industry', 'size')
        }),
        ('Security Settings', {
            'fields': ('allowed_domains', 'sso_enabled', 'mfa_required')
        }),
        ('Data Management', {
            'fields': ('data_retention_days',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    def user_count(self, obj):
        return obj.users.count()
    user_count.short_description = 'Users'


@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = ['name', 'organization', 'leader', 'member_count', 'created_at']
    list_filter = ['organization', 'created_at']
    search_fields = ['name', 'description', 'organization__name']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description', 'organization', 'leader')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    def member_count(self, obj):
        return obj.members.count()
    member_count.short_description = 'Members'


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'get_role', 'years_experience', 'created_at']
    list_filter = ['user__role', 'years_experience', 'created_at']
    search_fields = ['user__email', 'user__first_name', 'user__last_name', 'company_name']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('User', {
            'fields': ('user',)
        }),
        ('Professional Info', {
            'fields': ('years_experience', 'certifications', 'specializations')
        }),
        ('Attorney-specific', {
            'fields': ('bar_number', 'license_states', 'hourly_rate', 'bio'),
            'classes': ('collapse',)
        }),
        ('Analyst-specific', {
            'fields': ('preferred_databases', 'default_search_strategy'),
            'classes': ('collapse',)
        }),
        ('Client-specific', {
            'fields': ('company_name', 'industry'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    def get_role(self, obj):
        return obj.user.get_role_display()
    get_role.short_description = 'Role'


@admin.register(UserSettings)
class UserSettingsAdmin(admin.ModelAdmin):
    list_display = ['user', 'dark_mode', 'email_notifications', 'two_factor_enabled', 'created_at']
    list_filter = [
        'dark_mode', 'email_notifications', 'push_notifications', 
        'two_factor_enabled', 'profile_visibility', 'created_at'
    ]
    search_fields = ['user__email', 'user__first_name', 'user__last_name']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('User', {
            'fields': ('user',)
        }),
        ('General Settings', {
            'fields': ('dark_mode', 'compact_view', 'auto_save', 'keyboard_shortcuts')
        }),
        ('Notifications', {
            'fields': (
                'email_notifications', 'push_notifications', 'sms_notifications',
                'project_updates', 'deadline_alerts', 'team_mentions', 
                'marketing_emails', 'weekly_digest'
            )
        }),
        ('Privacy', {
            'fields': ('profile_visibility', 'activity_tracking', 'data_sharing', 'analytics_opt_in'),
            'classes': ('collapse',)
        }),
        ('Work Preferences', {
            'fields': ('working_hours_start', 'working_hours_end', 'break_reminders', 'focus_mode'),
            'classes': ('collapse',)
        }),
        ('Role-specific Settings', {
            'fields': ('attorney_settings', 'analyst_settings', 'admin_settings', 'client_settings'),
            'classes': ('collapse',)
        }),
        ('Security', {
            'fields': ('two_factor_enabled', 'session_timeout', 'auto_logout', 'login_notifications'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )


@admin.register(Permission)
class PermissionAdmin(admin.ModelAdmin):
    list_display = ['user', 'resource', 'action', 'scope', 'created_at']
    list_filter = ['resource', 'action', 'scope', 'created_at']
    search_fields = ['user__email', 'user__first_name', 'user__last_name', 'resource', 'action']
    readonly_fields = ['created_at']
    
    fieldsets = (
        ('User & Resource', {
            'fields': ('user', 'resource', 'action', 'scope')
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        })
    )


@admin.register(WorkflowUserPermission)
class WorkflowPermissionAdmin(admin.ModelAdmin):
    """
    Admin interface for managing workflow-specific permissions
    """
    list_display = ['user', 'workflow_role', 'can_create_workflows', 'can_view_analytics', 'created_at']
    list_filter = ['workflow_role', 'can_create_workflows', 'can_view_analytics', 'created_at']
    search_fields = ['user__email', 'user__first_name', 'user__last_name']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('User & Role', {
            'fields': ('user', 'workflow_role')
        }),
        ('Template Permissions', {
            'fields': (
                'can_create_templates', 'can_edit_templates', 'can_delete_templates',
                'can_activate_templates', 'can_view_templates'
            )
        }),
        ('Workflow Instance Permissions', {
            'fields': (
                'can_create_workflows', 'can_start_workflows', 'can_pause_workflows',
                'can_resume_workflows', 'can_cancel_workflows', 'can_delete_workflows',
                'can_assign_workflows', 'can_view_workflows'
            )
        }),
        ('Step Management Permissions', {
            'fields': (
                'can_execute_steps', 'can_complete_steps', 'can_skip_steps',
                'can_reassign_steps', 'can_view_steps'
            )
        }),
        ('Quality Control Permissions', {
            'fields': (
                'can_approve_quality', 'can_reject_quality', 'can_override_quality',
                'can_view_quality'
            )
        }),
        ('System Permissions', {
            'fields': (
                'can_manage_roles', 'can_view_analytics', 'can_manage_system'
            )
        }),
        ('Collaboration Permissions', {
            'fields': (
                'can_add_comments', 'can_view_comments', 'can_mention_users'
            )
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )


@admin.register(DataConfigurationPermission)
class DataConfigurationPermissionAdmin(admin.ModelAdmin):
    """
    Admin interface for managing data configuration permissions
    """
    list_display = ['user', 'get_granted_permissions_count', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user__email', 'user__first_name', 'user__last_name']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('User', {
            'fields': ('user',)
        }),
        ('Column Mapping Rules Permissions', {
            'fields': (
                'can_view_mapping_rules', 'can_create_mapping_rules', 'can_edit_mapping_rules',
                'can_delete_mapping_rules', 'can_activate_mapping_rules', 'can_import_export_rules'
            )
        }),
        ('Dataset Mappings Permissions', {
            'fields': (
                'can_view_dataset_mappings', 'can_edit_dataset_mappings', 'can_approve_mappings',
                'can_reject_mappings', 'can_bulk_manage_mappings'
            )
        }),
        ('Dynamic Fields Registry Permissions', {
            'fields': (
                'can_view_dynamic_fields', 'can_create_dynamic_fields', 'can_edit_dynamic_fields',
                'can_delete_dynamic_fields', 'can_migrate_fields', 'can_archive_fields'
            )
        }),
        ('System-level Data Configuration Permissions', {
            'fields': (
                'can_manage_field_types', 'can_view_mapping_analytics', 'can_configure_auto_mapping',
                'can_manage_migration_system', 'can_backup_restore_config'
            )
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    def get_granted_permissions_count(self, obj):
        """Count the number of granted permissions"""
        return len(obj.get_granted_permissions())
    get_granted_permissions_count.short_description = 'Permissions Granted'


# Customize admin site headers
admin.site.site_header = "Patent Analytics Platform - Administration"
admin.site.site_title = "Admin Portal"
admin.site.index_title = "System Administration"