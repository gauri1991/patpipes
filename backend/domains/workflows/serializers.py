"""
Workflows API Serializers
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from .models import (
    WorkflowTemplate, WorkflowStep, WorkflowInstance, WorkflowStepInstance,
    QualityControl, QualityCheckResult
)

User = get_user_model()


class UserBasicSerializer(serializers.ModelSerializer):
    """Basic user serializer for workflow references"""
    full_name = serializers.CharField(read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'full_name', 'email']


class WorkflowStepSerializer(serializers.ModelSerializer):
    """Workflow step serializer"""
    assigned_user = UserBasicSerializer(read_only=True)
    created_by = UserBasicSerializer(read_only=True)
    step_type_display = serializers.CharField(source='get_step_type_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    
    class Meta:
        model = WorkflowStep
        fields = [
            'id', 'workflow_template', 'name', 'description', 'step_type', 
            'step_type_display', 'order', 'is_required', 'is_parallel', 
            'auto_complete', 'estimated_duration', 'estimated_hours',
            'assigned_role', 'assigned_user', 'quality_criteria',
            'required_approvals', 'approver_roles', 'configuration',
            'actions', 'validations', 'tags', 'priority', 'priority_display',
            'created_by', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by']


class WorkflowStepCreateSerializer(serializers.ModelSerializer):
    """Create workflow step serializer"""
    
    class Meta:
        model = WorkflowStep
        fields = [
            'workflow_template', 'name', 'description', 'step_type', 'order',
            'is_required', 'is_parallel', 'auto_complete', 'estimated_duration',
            'estimated_hours', 'assigned_role', 'assigned_user', 'quality_criteria',
            'required_approvals', 'approver_roles', 'configuration', 'actions',
            'validations', 'tags', 'priority'
        ]


class QualityControlSerializer(serializers.ModelSerializer):
    """Quality control serializer"""
    created_by = UserBasicSerializer(read_only=True)
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    workflow_template_name = serializers.CharField(source='workflow_template.name', read_only=True)
    workflow_step_name = serializers.CharField(source='workflow_step.name', read_only=True)
    
    class Meta:
        model = QualityControl
        fields = [
            'id', 'name', 'description', 'type', 'type_display',
            'workflow_template', 'workflow_template_name',
            'workflow_step', 'workflow_step_name', 'criteria',
            'passing_score', 'on_pass_actions', 'on_fail_actions',
            'is_required', 'is_blocking', 'auto_remediate',
            'reviewer_roles', 'required_reviewers', 'tags', 'weight',
            'created_by', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by']


class WorkflowTemplateSerializer(serializers.ModelSerializer):
    """Workflow template serializer with related data"""
    steps = WorkflowStepSerializer(many=True, read_only=True)
    quality_controls = QualityControlSerializer(many=True, read_only=True)
    created_by = UserBasicSerializer(read_only=True)
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    min_role_level_display = serializers.CharField(source='get_min_role_level_display', read_only=True)
    
    # Computed fields
    total_steps = serializers.SerializerMethodField()
    total_quality_controls = serializers.SerializerMethodField()
    estimated_total_hours = serializers.SerializerMethodField()
    
    class Meta:
        model = WorkflowTemplate
        fields = [
            'id', 'name', 'description', 'category', 'version', 'is_active',
            'is_template', 'estimated_duration', 'auto_assign', 'require_sequential',
            'allow_parallel', 'quality_threshold', 'require_approval',
            'permissions', 'min_role_level', 'min_role_level_display',
            'usage_count', 'success_rate', 'organization', 'organization_name',
            'tags', 'color', 'icon', 'display_order', 'created_by',
            'created_at', 'updated_at', 'steps', 'quality_controls',
            'total_steps', 'total_quality_controls', 'estimated_total_hours'
        ]
        read_only_fields = [
            'id', 'usage_count', 'success_rate', 'created_at', 'updated_at', 
            'created_by'
        ]
    
    def get_total_steps(self, obj):
        return obj.steps.count()
    
    def get_total_quality_controls(self, obj):
        return obj.quality_controls.count()
    
    def get_estimated_total_hours(self, obj):
        from django.db.models import Sum
        total = obj.steps.aggregate(
            total_hours=Sum('estimated_hours')
        )['total_hours']
        return total or 0


class WorkflowTemplateCreateSerializer(serializers.ModelSerializer):
    """Create workflow template serializer"""
    
    class Meta:
        model = WorkflowTemplate
        fields = [
            'name', 'description', 'category', 'version', 'is_active',
            'estimated_duration', 'auto_assign', 'require_sequential',
            'allow_parallel', 'quality_threshold', 'require_approval',
            'permissions', 'min_role_level', 'organization', 'tags',
            'color', 'icon', 'display_order'
        ]


class WorkflowStepInstanceSerializer(serializers.ModelSerializer):
    """Workflow step instance serializer"""
    workflow_step = WorkflowStepSerializer(read_only=True)
    assigned_to = UserBasicSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = WorkflowStepInstance
        fields = [
            'id', 'workflow_instance', 'workflow_step', 'status', 'status_display',
            'assigned_to', 'start_date', 'due_date', 'completed_date',
            'actual_hours', 'quality_score', 'output_data', 'notes',
            'feedback', 'step_configuration', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class QualityCheckResultSerializer(serializers.ModelSerializer):
    """Quality check result serializer"""
    quality_control = QualityControlSerializer(read_only=True)
    reviewer = UserBasicSerializer(read_only=True)
    
    class Meta:
        model = QualityCheckResult
        fields = [
            'id', 'quality_control', 'step_instance', 'passed', 'score',
            'details', 'reviewer', 'review_notes', 'requires_remediation',
            'remediation_actions', 'remediated_at', 'checked_at'
        ]
        read_only_fields = ['id', 'checked_at']


class WorkflowInstanceSerializer(serializers.ModelSerializer):
    """Workflow instance serializer with related data"""
    workflow_template = WorkflowTemplateSerializer(read_only=True)
    step_instances = WorkflowStepInstanceSerializer(many=True, read_only=True)
    assigned_to = UserBasicSerializer(read_only=True)
    participants = UserBasicSerializer(many=True, read_only=True)
    final_approver = UserBasicSerializer(read_only=True)
    created_by = UserBasicSerializer(read_only=True)
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    content_object_name = serializers.SerializerMethodField()
    
    # Computed fields
    total_steps = serializers.SerializerMethodField()
    completed_steps = serializers.SerializerMethodField()
    current_step = serializers.SerializerMethodField()
    is_overdue = serializers.SerializerMethodField()
    
    class Meta:
        model = WorkflowInstance
        fields = [
            'id', 'workflow_template', 'name', 'description', 'status',
            'status_display', 'content_type', 'object_id', 'content_object_name',
            'progress_percentage', 'current_step_order', 'start_date',
            'due_date', 'completed_date', 'actual_duration', 'assigned_to',
            'participants', 'quality_score', 'final_approver', 'approval_date',
            'configuration_overrides', 'tags', 'priority', 'priority_display',
            'organization', 'organization_name', 'audit_log', 'created_by',
            'created_at', 'updated_at', 'step_instances', 'total_steps',
            'completed_steps', 'current_step', 'is_overdue'
        ]
        read_only_fields = [
            'id', 'progress_percentage', 'created_at', 'updated_at', 'created_by'
        ]
    
    def get_content_object_name(self, obj):
        if obj.content_object:
            return str(obj.content_object)
        return None
    
    def get_total_steps(self, obj):
        return obj.step_instances.count()
    
    def get_completed_steps(self, obj):
        return obj.step_instances.filter(status='completed').count()
    
    def get_current_step(self, obj):
        current = obj.step_instances.filter(
            status__in=['pending', 'in_progress']
        ).order_by('workflow_step__order').first()
        
        if current:
            return WorkflowStepInstanceSerializer(current).data
        return None
    
    def get_is_overdue(self, obj):
        from django.utils import timezone
        return obj.due_date and obj.due_date < timezone.now() and obj.status not in ['completed', 'cancelled']


class WorkflowInstanceCreateSerializer(serializers.ModelSerializer):
    """Create workflow instance serializer"""
    content_type = serializers.IntegerField(required=False)
    object_id = serializers.CharField(required=False)
    
    class Meta:
        model = WorkflowInstance
        fields = [
            'workflow_template', 'name', 'description', 'content_type',
            'object_id', 'assigned_to', 'due_date', 'priority',
            'organization', 'configuration_overrides', 'tags'
        ]
    
    def create(self, validated_data):
        """Create workflow instance and associated step instances"""
        if self.context['request'].user.is_authenticated:
            validated_data['created_by'] = self.context['request'].user
        
        # For standalone workflows, content_type and object_id can be null
        # No need to provide default values since they're now nullable
            
        instance = super().create(validated_data)
        
        # Create step instances based on template steps
        template_steps = instance.workflow_template.steps.all().order_by('order')
        
        for step in template_steps:
            WorkflowStepInstance.objects.create(
                workflow_instance=instance,
                workflow_step=step,
                assigned_to=step.assigned_user,
                step_configuration=step.configuration
            )
        
        return instance


class WorkflowInstanceUpdateSerializer(serializers.ModelSerializer):
    """Update workflow instance serializer"""
    
    class Meta:
        model = WorkflowInstance
        fields = [
            'name', 'description', 'status', 'assigned_to', 'participants',
            'due_date', 'priority', 'configuration_overrides', 'tags'
        ]


# Simplified serializers for lists and dropdowns
class WorkflowTemplateSummarySerializer(serializers.ModelSerializer):
    """Summary serializer for workflow template lists"""
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    total_steps = serializers.SerializerMethodField()
    
    class Meta:
        model = WorkflowTemplate
        fields = [
            'id', 'name', 'category', 'version', 'is_active',
            'estimated_duration', 'usage_count', 'success_rate',
            'color', 'icon', 'created_by_name', 'created_at', 'total_steps'
        ]
    
    def get_total_steps(self, obj):
        return obj.steps.count()


class WorkflowInstanceSummarySerializer(serializers.ModelSerializer):
    """Summary serializer for workflow instance lists"""
    workflow_template_name = serializers.CharField(source='workflow_template.name', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.get_full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    
    class Meta:
        model = WorkflowInstance
        fields = [
            'id', 'name', 'workflow_template_name', 'status', 'status_display',
            'progress_percentage', 'assigned_to_name', 'priority', 
            'priority_display', 'due_date', 'created_at'
        ]