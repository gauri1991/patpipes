"""
Workflows API Filters
"""

import django_filters
from django.db.models import Q
from django.contrib.contenttypes.models import ContentType
from .models import WorkflowTemplate, WorkflowInstance, WorkflowStep


class WorkflowTemplateFilter(django_filters.FilterSet):
    """Filter for workflow templates"""
    
    name = django_filters.CharFilter(lookup_expr='icontains')
    category = django_filters.CharFilter(lookup_expr='iexact')
    is_active = django_filters.BooleanFilter()
    min_role_level = django_filters.CharFilter(lookup_expr='iexact')
    organization = django_filters.UUIDFilter(field_name='organization__id')
    created_by = django_filters.UUIDFilter(field_name='created_by__id')
    
    # Date filters
    created_after = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    created_before = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')
    updated_after = django_filters.DateTimeFilter(field_name='updated_at', lookup_expr='gte')
    updated_before = django_filters.DateTimeFilter(field_name='updated_at', lookup_expr='lte')
    
    # Numeric filters
    usage_count_min = django_filters.NumberFilter(field_name='usage_count', lookup_expr='gte')
    usage_count_max = django_filters.NumberFilter(field_name='usage_count', lookup_expr='lte')
    success_rate_min = django_filters.NumberFilter(field_name='success_rate', lookup_expr='gte')
    success_rate_max = django_filters.NumberFilter(field_name='success_rate', lookup_expr='lte')
    
    # Tag filtering
    tags = django_filters.CharFilter(method='filter_by_tags')
    
    # Combined search
    search = django_filters.CharFilter(method='filter_search')
    
    class Meta:
        model = WorkflowTemplate
        fields = [
            'name', 'category', 'is_active', 'min_role_level', 'organization',
            'created_by', 'require_approval', 'auto_assign'
        ]
    
    def filter_by_tags(self, queryset, name, value):
        """Filter by tags (comma-separated)"""
        if value:
            tags = [tag.strip() for tag in value.split(',')]
            for tag in tags:
                queryset = queryset.filter(tags__contains=tag)
        return queryset
    
    def filter_search(self, queryset, name, value):
        """Combined search across multiple fields"""
        if value:
            return queryset.filter(
                Q(name__icontains=value) |
                Q(description__icontains=value) |
                Q(category__icontains=value) |
                Q(tags__contains=value)
            )
        return queryset


class WorkflowInstanceFilter(django_filters.FilterSet):
    """Filter for workflow instances"""
    
    name = django_filters.CharFilter(lookup_expr='icontains')
    status = django_filters.CharFilter(lookup_expr='iexact')
    priority = django_filters.CharFilter(lookup_expr='iexact')
    workflow_template = django_filters.UUIDFilter(field_name='workflow_template__id')
    assigned_to = django_filters.UUIDFilter(field_name='assigned_to__id')
    created_by = django_filters.UUIDFilter(field_name='created_by__id')
    organization = django_filters.UUIDFilter(field_name='organization__id')
    
    # Date filters
    created_after = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    created_before = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')
    due_after = django_filters.DateTimeFilter(field_name='due_date', lookup_expr='gte')
    due_before = django_filters.DateTimeFilter(field_name='due_date', lookup_expr='lte')
    started_after = django_filters.DateTimeFilter(field_name='start_date', lookup_expr='gte')
    started_before = django_filters.DateTimeFilter(field_name='start_date', lookup_expr='lte')
    completed_after = django_filters.DateTimeFilter(field_name='completed_date', lookup_expr='gte')
    completed_before = django_filters.DateTimeFilter(field_name='completed_date', lookup_expr='lte')
    
    # Progress filters
    progress_min = django_filters.NumberFilter(field_name='progress_percentage', lookup_expr='gte')
    progress_max = django_filters.NumberFilter(field_name='progress_percentage', lookup_expr='lte')
    quality_score_min = django_filters.NumberFilter(field_name='quality_score', lookup_expr='gte')
    quality_score_max = django_filters.NumberFilter(field_name='quality_score', lookup_expr='lte')
    
    # Special filters
    overdue = django_filters.BooleanFilter(method='filter_overdue')
    my_workflows = django_filters.BooleanFilter(method='filter_my_workflows')
    participating = django_filters.BooleanFilter(method='filter_participating')
    
    # Tag filtering
    tags = django_filters.CharFilter(method='filter_by_tags')
    
    # Content object filtering
    content_type = django_filters.ModelChoiceFilter(queryset=ContentType.objects.all())
    content_object_id = django_filters.UUIDFilter(field_name='object_id')
    
    # Combined search
    search = django_filters.CharFilter(method='filter_search')
    
    class Meta:
        model = WorkflowInstance
        fields = [
            'name', 'status', 'priority', 'workflow_template', 'assigned_to',
            'created_by', 'organization', 'content_type'
        ]
    
    def filter_overdue(self, queryset, name, value):
        """Filter overdue workflows"""
        if value:
            from django.utils import timezone
            return queryset.filter(
                due_date__lt=timezone.now(),
                status__in=['pending', 'in_progress']
            )
        return queryset
    
    def filter_my_workflows(self, queryset, name, value):
        """Filter workflows assigned to current user"""
        if value and self.request.user.is_authenticated:
            return queryset.filter(assigned_to=self.request.user)
        return queryset
    
    def filter_participating(self, queryset, name, value):
        """Filter workflows where user is participating"""
        if value and self.request.user.is_authenticated:
            return queryset.filter(participants=self.request.user)
        return queryset
    
    def filter_by_tags(self, queryset, name, value):
        """Filter by tags (comma-separated)"""
        if value:
            tags = [tag.strip() for tag in value.split(',')]
            for tag in tags:
                queryset = queryset.filter(tags__contains=tag)
        return queryset
    
    def filter_search(self, queryset, name, value):
        """Combined search across multiple fields"""
        if value:
            return queryset.filter(
                Q(name__icontains=value) |
                Q(description__icontains=value) |
                Q(workflow_template__name__icontains=value) |
                Q(tags__contains=value)
            )
        return queryset


class WorkflowStepFilter(django_filters.FilterSet):
    """Filter for workflow steps"""
    
    name = django_filters.CharFilter(lookup_expr='icontains')
    step_type = django_filters.CharFilter(lookup_expr='iexact')
    workflow_template = django_filters.UUIDFilter(field_name='workflow_template__id')
    assigned_role = django_filters.CharFilter(lookup_expr='iexact')
    assigned_user = django_filters.UUIDFilter(field_name='assigned_user__id')
    is_required = django_filters.BooleanFilter()
    is_parallel = django_filters.BooleanFilter()
    priority = django_filters.CharFilter(lookup_expr='iexact')
    
    # Order filters
    order_min = django_filters.NumberFilter(field_name='order', lookup_expr='gte')
    order_max = django_filters.NumberFilter(field_name='order', lookup_expr='lte')
    
    # Duration filters  
    estimated_hours_min = django_filters.NumberFilter(field_name='estimated_hours', lookup_expr='gte')
    estimated_hours_max = django_filters.NumberFilter(field_name='estimated_hours', lookup_expr='lte')
    
    # Tag filtering
    tags = django_filters.CharFilter(method='filter_by_tags')
    
    # Combined search
    search = django_filters.CharFilter(method='filter_search')
    
    class Meta:
        model = WorkflowStep
        fields = [
            'name', 'step_type', 'workflow_template', 'assigned_role',
            'assigned_user', 'is_required', 'is_parallel', 'priority'
        ]
    
    def filter_by_tags(self, queryset, name, value):
        """Filter by tags (comma-separated)"""
        if value:
            tags = [tag.strip() for tag in value.split(',')]
            for tag in tags:
                queryset = queryset.filter(tags__contains=tag)
        return queryset
    
    def filter_search(self, queryset, name, value):
        """Combined search across multiple fields"""
        if value:
            return queryset.filter(
                Q(name__icontains=value) |
                Q(description__icontains=value) |
                Q(workflow_template__name__icontains=value) |
                Q(tags__contains=value)
            )
        return queryset