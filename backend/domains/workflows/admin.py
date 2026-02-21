"""
Workflows Admin Interface
"""

from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import (
    WorkflowTemplate, WorkflowStep, WorkflowInstance, WorkflowStepInstance,
    QualityControl, QualityCheckResult
)


@admin.register(WorkflowTemplate)
class WorkflowTemplateAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'category', 'version', 'is_active', 'usage_count', 
        'success_rate', 'step_count', 'created_by', 'created_at'
    ]
    list_filter = [
        'category', 'is_active', 'min_role_level', 'require_approval', 
        'created_at', 'organization'
    ]
    search_fields = ['name', 'description', 'category', 'tags']
    readonly_fields = [
        'id', 'usage_count', 'success_rate', 'created_at', 'updated_at'
    ]
    filter_horizontal = []
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description', 'category', 'version', 'is_active')
        }),
        ('Configuration', {
            'fields': (
                'estimated_duration', 'auto_assign', 'require_sequential', 
                'allow_parallel', 'quality_threshold', 'require_approval'
            )
        }),
        ('Access Control', {
            'fields': ('permissions', 'min_role_level', 'organization')
        }),
        ('Presentation', {
            'fields': ('color', 'icon', 'display_order', 'tags')
        }),
        ('Statistics', {
            'fields': ('usage_count', 'success_rate'),
            'classes': ('collapse',)
        }),
        ('Audit', {
            'fields': ('id', 'created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    def step_count(self, obj):
        return obj.steps.count()
    step_count.short_description = 'Steps'
    
    def save_model(self, request, obj, form, change):
        if not change:  # If creating new object
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


class WorkflowStepInline(admin.TabularInline):
    model = WorkflowStep
    extra = 1
    fields = [
        'name', 'step_type', 'order', 'is_required', 
        'estimated_hours', 'assigned_role'
    ]
    ordering = ['order']


@admin.register(WorkflowStep)
class WorkflowStepAdmin(admin.ModelAdmin):
    list_display = [
        'workflow_template', 'name', 'step_type', 'order', 
        'is_required', 'assigned_role', 'estimated_hours'
    ]
    list_filter = [
        'workflow_template', 'step_type', 'is_required', 
        'is_parallel', 'assigned_role'
    ]
    search_fields = ['name', 'description', 'workflow_template__name']
    readonly_fields = ['id', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('workflow_template', 'name', 'description', 'step_type', 'order')
        }),
        ('Configuration', {
            'fields': (
                'is_required', 'is_parallel', 'auto_complete', 
                'estimated_duration', 'estimated_hours'
            )
        }),
        ('Assignment', {
            'fields': ('assigned_role', 'assigned_user')
        }),
        ('Quality Control', {
            'fields': ('quality_criteria', 'required_approvals', 'approver_roles')
        }),
        ('Advanced', {
            'fields': ('configuration', 'actions', 'validations', 'tags'),
            'classes': ('collapse',)
        }),
        ('Audit', {
            'fields': ('id', 'created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    def save_model(self, request, obj, form, change):
        if not change:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(WorkflowInstance)
class WorkflowInstanceAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'workflow_template', 'status', 'progress_percentage',
        'assigned_to', 'priority', 'due_date', 'created_at'
    ]
    list_filter = [
        'status', 'priority', 'workflow_template', 'assigned_to',
        'organization', 'created_at'
    ]
    search_fields = ['name', 'description', 'workflow_template__name']
    readonly_fields = [
        'id', 'progress_percentage', 'created_at', 'updated_at',
        'content_type', 'object_id'
    ]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description', 'workflow_template', 'status')
        }),
        ('Assignment', {
            'fields': ('assigned_to', 'participants', 'organization')
        }),
        ('Timeline', {
            'fields': ('start_date', 'due_date', 'completed_date', 'actual_duration')
        }),
        ('Progress', {
            'fields': ('progress_percentage', 'current_step_order')
        }),
        ('Quality & Approval', {
            'fields': ('quality_score', 'final_approver', 'approval_date')
        }),
        ('Content Object', {
            'fields': ('content_type', 'object_id'),
            'classes': ('collapse',)
        }),
        ('Configuration', {
            'fields': ('configuration_overrides', 'tags', 'priority'),
            'classes': ('collapse',)
        }),
        ('Audit', {
            'fields': ('audit_log',),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('id', 'created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    def save_model(self, request, obj, form, change):
        if not change:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


class WorkflowStepInstanceInline(admin.TabularInline):
    model = WorkflowStepInstance
    extra = 0
    fields = [
        'workflow_step', 'status', 'assigned_to', 
        'start_date', 'due_date', 'quality_score'
    ]
    readonly_fields = ['workflow_step']


@admin.register(WorkflowStepInstance)
class WorkflowStepInstanceAdmin(admin.ModelAdmin):
    list_display = [
        'workflow_instance', 'workflow_step', 'status', 
        'assigned_to', 'quality_score', 'due_date'
    ]
    list_filter = [
        'status', 'workflow_step__step_type', 'assigned_to', 'due_date'
    ]
    search_fields = [
        'workflow_instance__name', 'workflow_step__name',
        'assigned_to__first_name', 'assigned_to__last_name'
    ]
    readonly_fields = ['id', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('workflow_instance', 'workflow_step', 'status')
        }),
        ('Assignment', {
            'fields': ('assigned_to',)
        }),
        ('Timeline', {
            'fields': ('start_date', 'due_date', 'completed_date', 'actual_hours')
        }),
        ('Quality & Results', {
            'fields': ('quality_score', 'output_data')
        }),
        ('Feedback', {
            'fields': ('notes', 'feedback')
        }),
        ('Configuration', {
            'fields': ('step_configuration',),
            'classes': ('collapse',)
        }),
        ('Audit', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )


@admin.register(QualityControl)
class QualityControlAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'type', 'get_scope', 'is_required', 
        'is_blocking', 'passing_score', 'created_by'
    ]
    list_filter = [
        'type', 'is_required', 'is_blocking', 'workflow_template', 'created_at'
    ]
    search_fields = ['name', 'description', 'workflow_template__name', 'workflow_step__name']
    readonly_fields = ['id', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description', 'type')
        }),
        ('Scope', {
            'fields': ('workflow_template', 'workflow_step')
        }),
        ('Quality Criteria', {
            'fields': ('criteria', 'passing_score', 'weight')
        }),
        ('Configuration', {
            'fields': (
                'is_required', 'is_blocking', 'auto_remediate',
                'reviewer_roles', 'required_reviewers'
            )
        }),
        ('Actions', {
            'fields': ('on_pass_actions', 'on_fail_actions'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('tags',),
            'classes': ('collapse',)
        }),
        ('Audit', {
            'fields': ('id', 'created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    def get_scope(self, obj):
        if obj.workflow_step:
            return f"Step: {obj.workflow_step.name}"
        elif obj.workflow_template:
            return f"Template: {obj.workflow_template.name}"
        return "Not set"
    get_scope.short_description = 'Scope'
    
    def save_model(self, request, obj, form, change):
        if not change:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(QualityCheckResult)
class QualityCheckResultAdmin(admin.ModelAdmin):
    list_display = [
        'quality_control', 'step_instance', 'passed', 'score', 
        'reviewer', 'checked_at', 'requires_remediation'
    ]
    list_filter = [
        'passed', 'requires_remediation', 'quality_control__type', 
        'reviewer', 'checked_at'
    ]
    search_fields = [
        'quality_control__name', 'step_instance__workflow_step__name',
        'reviewer__first_name', 'reviewer__last_name'
    ]
    readonly_fields = ['id', 'checked_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('quality_control', 'step_instance', 'passed', 'score')
        }),
        ('Review', {
            'fields': ('reviewer', 'review_notes')
        }),
        ('Results', {
            'fields': ('details',)
        }),
        ('Remediation', {
            'fields': (
                'requires_remediation', 'remediation_actions', 'remediated_at'
            )
        }),
        ('Audit', {
            'fields': ('id', 'checked_at'),
            'classes': ('collapse',)
        })
    )


# Customize admin site headers
admin.site.site_header = "Patent Analytics Platform - Workflows"
admin.site.site_title = "Workflows Admin"
admin.site.index_title = "Workflow Management"