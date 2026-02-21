"""
Workflows API Views
"""

from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from django.db.models import Q, Count, Avg
from django.utils import timezone
from django.contrib.contenttypes.models import ContentType

from .models import (
    WorkflowTemplate, WorkflowStep, WorkflowInstance, WorkflowStepInstance,
    QualityControl, QualityCheckResult, WorkflowInstanceStatus, StepStatus
)
from .serializers import (
    WorkflowTemplateSerializer, WorkflowTemplateCreateSerializer, WorkflowTemplateSummarySerializer,
    WorkflowStepSerializer, WorkflowStepCreateSerializer,
    WorkflowInstanceSerializer, WorkflowInstanceCreateSerializer, 
    WorkflowInstanceUpdateSerializer, WorkflowInstanceSummarySerializer,
    WorkflowStepInstanceSerializer, QualityControlSerializer, QualityCheckResultSerializer
)
from .filters import WorkflowTemplateFilter, WorkflowInstanceFilter
from .services import workflow_engine
from .integrations import (
    ProjectWorkflowIntegration, 
    WorkflowRecommendationEngine,
    get_workflow_progress_for_project
)
from .bulk_operations import (
    bulk_operations_manager,
    BulkOperationType,
    BulkOperationRequest
)
from .versioning import (
    versioning_manager,
    VersionChangeType,
    MigrationStrategy,
    WorkflowTemplateVersion
)


class WorkflowTemplateViewSet(viewsets.ModelViewSet):
    """
    ViewSet for workflow templates CRUD operations
    """
    queryset = WorkflowTemplate.objects.all()
    serializer_class = WorkflowTemplateSerializer
    permission_classes = [permissions.AllowAny]  # Temporary for development
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = WorkflowTemplateFilter
    search_fields = ['name', 'description', 'category']
    ordering_fields = ['name', 'category', 'created_at', 'usage_count', 'success_rate']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return WorkflowTemplateCreateSerializer
        elif self.action == 'list':
            return WorkflowTemplateSummarySerializer
        return WorkflowTemplateSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # For development: allow access to all templates when not authenticated
        user = self.request.user
        if user.is_authenticated:
            # Filter by user permissions and organization
            if not user.is_superuser:
                # Get user's organization safely
                user_org = None
                if hasattr(user, 'profile') and user.profile:
                    user_org = getattr(user.profile, 'organization', None)
                
                queryset = queryset.filter(
                    Q(organization=user_org) |
                    Q(organization__isnull=True)
                )
            
            # Filter by active status for non-admin users
            if self.action == 'list' and not user.is_staff:
                queryset = queryset.filter(is_active=True)
        else:
            # For unauthenticated access, only show active templates
            queryset = queryset.filter(is_active=True)
            
        return queryset.select_related('created_by', 'organization').prefetch_related('steps')
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def duplicate(self, request, pk=None):
        """Duplicate a workflow template"""
        template = self.get_object()
        
        # Create duplicate template
        new_template = WorkflowTemplate.objects.create(
            name=f"{template.name} (Copy)",
            description=template.description,
            category=template.category,
            version="1.0",
            is_active=False,  # Start as inactive
            estimated_duration=template.estimated_duration,
            auto_assign=template.auto_assign,
            require_sequential=template.require_sequential,
            allow_parallel=template.allow_parallel,
            quality_threshold=template.quality_threshold,
            require_approval=template.require_approval,
            permissions=template.permissions,
            min_role_level=template.min_role_level,
            organization=template.organization,
            tags=template.tags.copy(),
            color=template.color,
            icon=template.icon,
            created_by=request.user
        )
        
        # Duplicate steps
        for step in template.steps.all().order_by('order'):
            WorkflowStep.objects.create(
                workflow_template=new_template,
                name=step.name,
                description=step.description,
                step_type=step.step_type,
                order=step.order,
                is_required=step.is_required,
                is_parallel=step.is_parallel,
                auto_complete=step.auto_complete,
                estimated_duration=step.estimated_duration,
                estimated_hours=step.estimated_hours,
                assigned_role=step.assigned_role,
                quality_criteria=step.quality_criteria.copy(),
                required_approvals=step.required_approvals,
                approver_roles=step.approver_roles.copy(),
                configuration=step.configuration.copy(),
                actions=step.actions.copy(),
                validations=step.validations.copy(),
                tags=step.tags.copy(),
                priority=step.priority,
                created_by=request.user
            )
        
        # Duplicate quality controls
        for qc in template.quality_controls.all():
            QualityControl.objects.create(
                name=qc.name,
                description=qc.description,
                type=qc.type,
                workflow_template=new_template,
                criteria=qc.criteria.copy(),
                passing_score=qc.passing_score,
                on_pass_actions=qc.on_pass_actions.copy(),
                on_fail_actions=qc.on_fail_actions.copy(),
                is_required=qc.is_required,
                is_blocking=qc.is_blocking,
                auto_remediate=qc.auto_remediate,
                reviewer_roles=qc.reviewer_roles.copy(),
                required_reviewers=qc.required_reviewers,
                tags=qc.tags.copy(),
                weight=qc.weight,
                created_by=request.user
            )
        
        serializer = self.get_serializer(new_template)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activate/deactivate workflow template"""
        template = self.get_object()
        template.is_active = not template.is_active
        template.save(update_fields=['is_active'])
        
        return Response({
            'status': 'activated' if template.is_active else 'deactivated',
            'is_active': template.is_active
        })
    
    @action(detail=False, methods=['get'])
    def categories(self, request):
        """Get list of workflow categories"""
        categories = WorkflowTemplate.objects.values_list('category', flat=True).distinct()
        return Response(list(categories))
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get workflow template statistics"""
        queryset = self.get_queryset()
        
        stats = {
            'total_templates': queryset.count(),
            'active_templates': queryset.filter(is_active=True).count(),
            'categories_count': queryset.values('category').distinct().count(),
            'avg_success_rate': queryset.aggregate(Avg('success_rate'))['success_rate__avg'] or 0,
            'most_used': queryset.order_by('-usage_count').first(),
        }
        
        if stats['most_used']:
            stats['most_used'] = {
                'id': stats['most_used'].id,
                'name': stats['most_used'].name,
                'usage_count': stats['most_used'].usage_count
            }
        
        return Response(stats)
    
    @action(detail=True, methods=['post'])
    def create_version(self, request, pk=None):
        """Create a new version of the workflow template"""
        
        template = self.get_object()
        
        version_type = request.data.get('version_type', 'minor')  # major, minor, patch
        change_summary = request.data.get('change_summary', '')
        release_notes = request.data.get('release_notes', '')
        migration_strategy = request.data.get('migration_strategy', 'optional')
        
        try:
            change_type = VersionChangeType(version_type)
            migration_strat = MigrationStrategy(migration_strategy)
            
            new_version = versioning_manager.create_new_version(
                template=template,
                version_type=change_type,
                user=request.user,
                change_summary=change_summary,
                release_notes=release_notes,
                migration_strategy=migration_strat
            )
            
            return Response({
                'version': new_version.version_number,
                'change_summary': new_version.change_summary,
                'breaking_changes': new_version.breaking_changes,
                'migration_strategy': new_version.migration_strategy,
                'created_at': new_version.created_at
            })
            
        except ValueError as e:
            return Response(
                {'error': f'Invalid parameter: {e}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': f'Failed to create version: {e}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'])
    def versions(self, request, pk=None):
        """Get version history for the workflow template"""
        
        template = self.get_object()
        versions = versioning_manager.get_version_history(template)
        
        version_data = []
        for v in versions:
            version_data.append({
                'id': v.id,
                'version_number': v.version_number,
                'version_tag': v.version_tag,
                'change_summary': v.change_summary,
                'breaking_changes': v.breaking_changes,
                'is_latest': v.is_latest,
                'is_stable': v.is_stable,
                'instance_count': v.instance_count,
                'migration_count': v.migration_count,
                'created_at': v.created_at,
                'created_by': v.created_by.get_full_name() if v.created_by else None
            })
        
        return Response({
            'template_id': template.id,
            'template_name': template.name,
            'current_version': template.version,
            'versions': version_data
        })
    
    @action(detail=True, methods=['post'])
    def rollback(self, request, pk=None):
        """Rollback template to a previous version"""
        
        template = self.get_object()
        target_version_id = request.data.get('version_id')
        
        if not target_version_id:
            return Response(
                {'error': 'version_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            target_version = WorkflowTemplateVersion.objects.get(
                id=target_version_id,
                workflow_template=template
            )
            
            success = versioning_manager.rollback_version(
                template=template,
                target_version=target_version,
                user=request.user
            )
            
            if success:
                return Response({
                    'message': f'Successfully rolled back to version {target_version.version_number}',
                    'version': target_version.version_number
                })
            else:
                return Response(
                    {'error': 'Rollback failed'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
                
        except WorkflowTemplateVersion.DoesNotExist:
            return Response(
                {'error': 'Version not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['post'])
    def compare_versions(self, request):
        """Compare two versions of a template"""
        
        version1_id = request.data.get('version1_id')
        version2_id = request.data.get('version2_id')
        
        if not version1_id or not version2_id:
            return Response(
                {'error': 'Both version1_id and version2_id are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            version1 = WorkflowTemplateVersion.objects.get(id=version1_id)
            version2 = WorkflowTemplateVersion.objects.get(id=version2_id)
            
            comparison = versioning_manager.compare_versions(version1, version2)
            
            return Response(comparison)
            
        except WorkflowTemplateVersion.DoesNotExist:
            return Response(
                {'error': 'One or both versions not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class WorkflowStepViewSet(viewsets.ModelViewSet):
    """
    ViewSet for workflow steps CRUD operations
    """
    queryset = WorkflowStep.objects.all()
    serializer_class = WorkflowStepSerializer
    permission_classes = [permissions.AllowAny]  # Temporary for development
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['workflow_template', 'step_type', 'is_required', 'assigned_role']
    search_fields = ['name', 'description']
    ordering_fields = ['workflow_template', 'order', 'name', 'created_at']
    ordering = ['workflow_template', 'order']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return WorkflowStepCreateSerializer
        return WorkflowStepSerializer
    
    def get_queryset(self):
        return super().get_queryset().select_related(
            'workflow_template', 'assigned_user', 'created_by'
        )
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def reorder(self, request, pk=None):
        """Reorder workflow steps"""
        step = self.get_object()
        new_order = request.data.get('order')
        
        if new_order is not None:
            step.order = new_order
            step.save(update_fields=['order'])
            
            # Reorder other steps in the same template
            template_steps = WorkflowStep.objects.filter(
                workflow_template=step.workflow_template
            ).exclude(id=step.id).order_by('order')
            
            order = 1
            for other_step in template_steps:
                if order == new_order:
                    order += 1
                other_step.order = order
                other_step.save(update_fields=['order'])
                order += 1
        
        return Response({'status': 'reordered', 'new_order': step.order})


class WorkflowInstanceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for workflow instances CRUD operations
    """
    queryset = WorkflowInstance.objects.all()
    serializer_class = WorkflowInstanceSerializer
    permission_classes = [permissions.AllowAny]  # Temporary for development
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = WorkflowInstanceFilter
    search_fields = ['name', 'description', 'workflow_template__name']
    ordering_fields = ['name', 'status', 'priority', 'due_date', 'created_at', 'progress_percentage']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return WorkflowInstanceCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return WorkflowInstanceUpdateSerializer
        elif self.action == 'list':
            return WorkflowInstanceSummarySerializer
        return WorkflowInstanceSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # For development: allow access to workflow instances when not authenticated
        user = self.request.user
        if user.is_authenticated:
            # Filter by user permissions
            if not user.is_superuser:
                # Get user's organization safely
                user_org = None
                if hasattr(user, 'profile') and user.profile:
                    user_org = getattr(user.profile, 'organization', None)
                
                queryset = queryset.filter(
                    Q(assigned_to=user) |
                    Q(participants=user) |
                    Q(created_by=user) |
                    Q(organization=user_org)
                ).distinct()
        else:
            # For unauthenticated access, show all instances (or apply other filters)
            queryset = queryset.all()
        
        return queryset.select_related(
            'workflow_template', 'assigned_to', 'final_approver', 
            'created_by', 'organization', 'content_type'
        ).prefetch_related('participants', 'step_instances__workflow_step')
    
    def perform_create(self, serializer):
        if self.request.user.is_authenticated:
            serializer.save(created_by=self.request.user)
        else:
            serializer.save()
    
    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        """Start workflow execution"""
        instance = self.get_object()
        
        if instance.status != WorkflowInstanceStatus.PENDING:
            return Response(
                {'error': 'Workflow can only be started from pending status'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        instance.start(user=request.user)
        
        # Start first step(s)
        first_steps = instance.step_instances.filter(
            workflow_step__order=1
        )
        for step_instance in first_steps:
            step_instance.start(user=request.user)
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def pause(self, request, pk=None):
        """Pause workflow execution"""
        instance = self.get_object()
        instance.status = WorkflowInstanceStatus.ON_HOLD
        instance.save(update_fields=['status'])
        instance.add_audit_entry('workflow_paused', request.user)
        
        return Response({'status': 'paused'})
    
    @action(detail=True, methods=['post'])
    def resume(self, request, pk=None):
        """Resume workflow execution"""
        instance = self.get_object()
        instance.status = WorkflowInstanceStatus.IN_PROGRESS
        instance.save(update_fields=['status'])
        instance.add_audit_entry('workflow_resumed', request.user)
        
        return Response({'status': 'resumed'})
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel workflow execution"""
        instance = self.get_object()
        instance.status = WorkflowInstanceStatus.CANCELLED
        instance.save(update_fields=['status'])
        instance.add_audit_entry('workflow_cancelled', request.user, {
            'reason': request.data.get('reason', 'No reason provided')
        })
        
        return Response({'status': 'cancelled'})
    
    @action(detail=True, methods=['get'])
    def progress(self, request, pk=None):
        """Get detailed workflow progress"""
        instance = self.get_object()
        
        progress_data = {
            'workflow_id': instance.id,
            'status': instance.status,
            'progress_percentage': instance.progress_percentage,
            'total_steps': instance.step_instances.count(),
            'completed_steps': instance.step_instances.filter(status=StepStatus.COMPLETED).count(),
            'in_progress_steps': instance.step_instances.filter(status=StepStatus.IN_PROGRESS).count(),
            'pending_steps': instance.step_instances.filter(status=StepStatus.PENDING).count(),
            'failed_steps': instance.step_instances.filter(status=StepStatus.FAILED).count(),
            'steps': []
        }
        
        for step_instance in instance.step_instances.order_by('workflow_step__order'):
            progress_data['steps'].append({
                'id': step_instance.id,
                'name': step_instance.workflow_step.name,
                'order': step_instance.workflow_step.order,
                'status': step_instance.status,
                'assigned_to': step_instance.assigned_to.get_full_name() if step_instance.assigned_to else None,
                'start_date': step_instance.start_date,
                'due_date': step_instance.due_date,
                'completed_date': step_instance.completed_date,
                'quality_score': step_instance.quality_score
            })
        
        return Response(progress_data)
    
    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """Get workflow dashboard data"""
        queryset = self.get_queryset()
        
        dashboard_data = {
            'summary': {
                'total': queryset.count(),
                'pending': queryset.filter(status=WorkflowInstanceStatus.PENDING).count(),
                'in_progress': queryset.filter(status=WorkflowInstanceStatus.IN_PROGRESS).count(),
                'completed': queryset.filter(status=WorkflowInstanceStatus.COMPLETED).count(),
                'failed': queryset.filter(status=WorkflowInstanceStatus.FAILED).count(),
                'overdue': queryset.filter(
                    due_date__lt=timezone.now(),
                    status__in=[WorkflowInstanceStatus.PENDING, WorkflowInstanceStatus.IN_PROGRESS]
                ).count()
            },
            'assigned_to_me': {
                'total': queryset.filter(assigned_to=request.user).count(),
                'pending': queryset.filter(
                    assigned_to=request.user,
                    status=WorkflowInstanceStatus.PENDING
                ).count(),
                'in_progress': queryset.filter(
                    assigned_to=request.user,
                    status=WorkflowInstanceStatus.IN_PROGRESS
                ).count()
            }
        }
        
        return Response(dashboard_data)
    
    @action(detail=False, methods=['post'])
    def create_from_template(self, request):
        """Create workflow instance from template for a target object"""
        
        template_id = request.data.get('template_id')
        content_type_id = request.data.get('content_type')
        object_id = request.data.get('object_id')
        
        if not all([template_id, content_type_id, object_id]):
            return Response(
                {'error': 'template_id, content_type, and object_id are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Get content type and target object
            content_type = ContentType.objects.get(id=content_type_id)
            target_model = content_type.model_class()
            target_object = target_model.objects.get(id=object_id)
            
            # Create workflow instance using engine
            workflow_instance = workflow_engine.create_workflow_instance(
                template_id=template_id,
                target_object=target_object,
                user=request.user,
                name=request.data.get('name'),
                assigned_to_id=request.data.get('assigned_to'),
                due_date=request.data.get('due_date'),
                priority=request.data.get('priority', 'medium'),
                configuration_overrides=request.data.get('configuration_overrides', {}),
                tags=request.data.get('tags', [])
            )
            
            # Auto-start if requested
            if request.data.get('auto_start', False):
                workflow_engine.start_workflow(workflow_instance, request.user)
            
            serializer = self.get_serializer(workflow_instance)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def for_project(self, request):
        """Get workflows for a specific project"""
        
        project_id = request.query_params.get('project_id')
        if not project_id:
            return Response(
                {'error': 'project_id parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from domains.projects.models import Project
            project = Project.objects.get(id=project_id)
            
            # Check permissions
            if not request.user.is_staff:
                # Check if user has access to project
                if project.created_by != request.user and project.lead_attorney != request.user:
                    return Response(
                        {'error': 'Permission denied'},
                        status=status.HTTP_403_FORBIDDEN
                    )
            
            workflows = ProjectWorkflowIntegration.get_project_workflows(project)
            progress_data = get_workflow_progress_for_project(project)
            
            serializer = WorkflowInstanceSummarySerializer(workflows, many=True)
            
            return Response({
                'project_id': project_id,
                'project_name': project.name,
                'workflows': serializer.data,
                'progress_summary': progress_data
            })
            
        except Project.DoesNotExist:
            return Response(
                {'error': 'Project not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['post'])
    def attach_to_project(self, request):
        """Attach workflows to a project"""
        
        project_id = request.data.get('project_id')
        workflow_names = request.data.get('workflow_names', [])
        auto_start = request.data.get('auto_start', False)
        
        if not project_id:
            return Response(
                {'error': 'project_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from domains.projects.models import Project
            project = Project.objects.get(id=project_id)
            
            # Check permissions
            if not request.user.is_staff:
                if project.created_by != request.user and project.lead_attorney != request.user:
                    return Response(
                        {'error': 'Permission denied'},
                        status=status.HTTP_403_FORBIDDEN
                    )
            
            # Attach workflows
            attached_workflows = ProjectWorkflowIntegration.attach_workflows_to_project(
                project=project,
                user=request.user,
                workflow_names=workflow_names if workflow_names else None,
                auto_start=auto_start
            )
            
            serializer = WorkflowInstanceSummarySerializer(attached_workflows, many=True)
            
            return Response({
                'attached_workflows': serializer.data,
                'message': f'Successfully attached {len(attached_workflows)} workflows to project'
            })
            
        except Project.DoesNotExist:
            return Response(
                {'error': 'Project not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['get'])
    def recommendations(self, request):
        """Get workflow recommendations for a project"""
        
        project_id = request.query_params.get('project_id')
        if not project_id:
            return Response(
                {'error': 'project_id parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from domains.projects.models import Project
            project = Project.objects.get(id=project_id)
            
            # Get context from request
            context = {
                'international_filing': request.query_params.get('international_filing', False),
                'expedited': request.query_params.get('expedited', False),
                'client_requirements': request.query_params.get('client_requirements', '')
            }
            
            recommendations = WorkflowRecommendationEngine.recommend_workflows_for_project(
                project, context
            )
            
            # Serialize recommendations
            recommendation_data = []
            for rec in recommendations:
                template = rec['template']
                recommendation_data.append({
                    'template_id': str(template.id),
                    'template_name': template.name,
                    'template_description': template.description,
                    'estimated_duration': template.estimated_duration,
                    'confidence': rec['confidence'],
                    'reason': rec['reason'],
                    'category': rec['category'],
                    'auto_attach': rec['auto_attach']
                })
            
            return Response({
                'project_id': project_id,
                'project_name': project.name,
                'recommendations': recommendation_data
            })
            
        except Project.DoesNotExist:
            return Response(
                {'error': 'Project not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['post'])
    def bulk_create(self, request):
        """Bulk create workflows for multiple projects"""
        
        template_id = request.data.get('template_id')
        project_ids = request.data.get('project_ids', [])
        auto_start = request.data.get('auto_start', False)
        skip_existing = request.data.get('skip_existing', True)
        
        if not template_id:
            return Response(
                {'error': 'template_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not project_ids:
            return Response(
                {'error': 'project_ids list is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            template = WorkflowTemplate.objects.get(id=template_id)
            from domains.projects.models import Project
            projects = Project.objects.filter(id__in=project_ids)
            
            if projects.count() != len(project_ids):
                return Response(
                    {'error': 'Some projects not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Execute bulk operation
            bulk_request = BulkOperationRequest(
                operation_type=BulkOperationType.CREATE_WORKFLOWS,
                target_objects=list(projects),
                workflow_template=template,
                user=request.user,
                parameters=request.data.get('parameters', {}),
                options={
                    'auto_start': auto_start,
                    'skip_existing': skip_existing
                }
            )
            
            result = bulk_operations_manager.execute_bulk_operation(bulk_request)
            
            return Response({
                'status': result.status.value,
                'total_items': result.total_items,
                'successful_items': result.successful_items,
                'failed_items': result.failed_items,
                'results': result.results,
                'errors': result.errors,
                'execution_time': result.execution_time
            })
            
        except WorkflowTemplate.DoesNotExist:
            return Response(
                {'error': 'Workflow template not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['post'])
    def bulk_start(self, request):
        """Bulk start multiple workflows"""
        
        workflow_ids = request.data.get('workflow_ids', [])
        
        if not workflow_ids:
            return Response(
                {'error': 'workflow_ids list is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        workflows = WorkflowInstance.objects.filter(id__in=workflow_ids)
        
        if workflows.count() != len(workflow_ids):
            return Response(
                {'error': 'Some workflows not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Execute bulk operation
        bulk_request = BulkOperationRequest(
            operation_type=BulkOperationType.START_WORKFLOWS,
            target_objects=list(workflows),
            user=request.user
        )
        
        result = bulk_operations_manager.execute_bulk_operation(bulk_request)
        
        return Response({
            'status': result.status.value,
            'total_items': result.total_items,
            'successful_items': result.successful_items,
            'failed_items': result.failed_items,
            'results': result.results,
            'errors': result.errors
        })
    
    @action(detail=False, methods=['post'])
    def bulk_update_assignments(self, request):
        """Bulk update assignments for multiple workflows"""
        
        workflow_ids = request.data.get('workflow_ids', [])
        assignee_id = request.data.get('assignee_id')
        update_unassigned_steps = request.data.get('update_unassigned_steps', True)
        
        if not workflow_ids:
            return Response(
                {'error': 'workflow_ids list is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not assignee_id:
            return Response(
                {'error': 'assignee_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            assignee = User.objects.get(id=assignee_id)
            workflows = WorkflowInstance.objects.filter(id__in=workflow_ids)
            
            if workflows.count() != len(workflow_ids):
                return Response(
                    {'error': 'Some workflows not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Execute bulk operation
            bulk_request = BulkOperationRequest(
                operation_type=BulkOperationType.UPDATE_ASSIGNMENTS,
                target_objects=list(workflows),
                user=request.user,
                parameters={'assignee': assignee},
                options={'update_unassigned_steps': update_unassigned_steps}
            )
            
            result = bulk_operations_manager.execute_bulk_operation(bulk_request)
            
            return Response({
                'status': result.status.value,
                'total_items': result.total_items,
                'successful_items': result.successful_items,
                'failed_items': result.failed_items,
                'results': result.results,
                'errors': result.errors
            })
            
        except User.DoesNotExist:
            return Response(
                {'error': 'Assignee user not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['post'])
    def bulk_update_priorities(self, request):
        """Bulk update priorities for multiple workflows"""
        
        workflow_ids = request.data.get('workflow_ids', [])
        priority = request.data.get('priority')
        
        if not workflow_ids:
            return Response(
                {'error': 'workflow_ids list is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not priority:
            return Response(
                {'error': 'priority is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        workflows = WorkflowInstance.objects.filter(id__in=workflow_ids)
        
        if workflows.count() != len(workflow_ids):
            return Response(
                {'error': 'Some workflows not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Execute bulk operation
        bulk_request = BulkOperationRequest(
            operation_type=BulkOperationType.UPDATE_PRIORITIES,
            target_objects=list(workflows),
            user=request.user,
            parameters={'priority': priority}
        )
        
        result = bulk_operations_manager.execute_bulk_operation(bulk_request)
        
        return Response({
            'status': result.status.value,
            'total_items': result.total_items,
            'successful_items': result.successful_items,
            'failed_items': result.failed_items,
            'results': result.results,
            'errors': result.errors
        })
    
    @action(detail=True, methods=['post'])
    def migrate_version(self, request, pk=None):
        """Migrate a workflow instance to a new template version"""
        
        workflow_instance = self.get_object()
        target_version_id = request.data.get('version_id')
        force = request.data.get('force', False)
        
        if not target_version_id:
            return Response(
                {'error': 'version_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            target_version = WorkflowTemplateVersion.objects.get(
                id=target_version_id,
                workflow_template=workflow_instance.workflow_template
            )
            
            success, messages = versioning_manager.migrate_workflow_instance(
                workflow_instance=workflow_instance,
                target_version=target_version,
                user=request.user,
                force=force
            )
            
            return Response({
                'success': success,
                'messages': messages,
                'current_version': workflow_instance.template_version,
                'target_version': target_version.version_number
            })
            
        except WorkflowTemplateVersion.DoesNotExist:
            return Response(
                {'error': 'Target version not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['post'])
    def bulk_migrate(self, request):
        """Bulk migrate multiple workflow instances to a new version"""
        
        workflow_ids = request.data.get('workflow_ids', [])
        target_version_id = request.data.get('version_id')
        force = request.data.get('force', False)
        
        if not workflow_ids:
            return Response(
                {'error': 'workflow_ids list is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not target_version_id:
            return Response(
                {'error': 'version_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            workflows = WorkflowInstance.objects.filter(id__in=workflow_ids)
            target_version = WorkflowTemplateVersion.objects.get(id=target_version_id)
            
            if workflows.count() != len(workflow_ids):
                return Response(
                    {'error': 'Some workflows not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            results = []
            successful = 0
            failed = 0
            
            for workflow in workflows:
                success, messages = versioning_manager.migrate_workflow_instance(
                    workflow_instance=workflow,
                    target_version=target_version,
                    user=request.user,
                    force=force
                )
                
                results.append({
                    'workflow_id': str(workflow.id),
                    'workflow_name': workflow.name,
                    'success': success,
                    'messages': messages
                })
                
                if success:
                    successful += 1
                else:
                    failed += 1
            
            return Response({
                'total': len(workflow_ids),
                'successful': successful,
                'failed': failed,
                'results': results,
                'target_version': target_version.version_number
            })
            
        except WorkflowTemplateVersion.DoesNotExist:
            return Response(
                {'error': 'Target version not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class WorkflowStepInstanceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for workflow step instances
    """
    queryset = WorkflowStepInstance.objects.all()
    serializer_class = WorkflowStepInstanceSerializer
    permission_classes = [permissions.AllowAny]  # Temporary for development
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['workflow_instance', 'status', 'assigned_to']
    search_fields = ['workflow_step__name', 'notes']
    ordering_fields = ['workflow_step__order', 'status', 'due_date', 'created_at']
    ordering = ['workflow_step__order']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by user permissions
        user = self.request.user
        if user.is_authenticated and not user.is_superuser:
            queryset = queryset.filter(
                Q(assigned_to=user) |
                Q(workflow_instance__assigned_to=user) |
                Q(workflow_instance__participants=user) |
                Q(workflow_instance__created_by=user)
            ).distinct()
        elif not user.is_authenticated:
            # For unauthenticated access, show all step instances (for development)
            queryset = queryset.all()
        
        return queryset.select_related(
            'workflow_instance', 'workflow_step', 'assigned_to'
        )
    
    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        """Start step execution"""
        step_instance = self.get_object()
        
        if step_instance.status != StepStatus.PENDING:
            return Response(
                {'error': 'Step can only be started from pending status'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        step_instance.start(user=request.user)
        serializer = self.get_serializer(step_instance)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Complete step execution"""
        step_instance = self.get_object()
        
        if step_instance.status not in [StepStatus.IN_PROGRESS, StepStatus.WAITING_APPROVAL]:
            return Response(
                {'error': 'Step can only be completed from in_progress or waiting_approval status'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        quality_score = request.data.get('quality_score')
        output_data = request.data.get('output_data', {})
        notes = request.data.get('notes', '')
        
        step_instance.notes = notes
        step_instance.complete(
            user=request.user,
            quality_score=quality_score,
            output_data=output_data
        )
        
        serializer = self.get_serializer(step_instance)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        """Assign step to user"""
        step_instance = self.get_object()
        user_id = request.data.get('user_id')
        
        if user_id:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            try:
                assignee = User.objects.get(id=user_id)
                step_instance.assigned_to = assignee
                step_instance.save(update_fields=['assigned_to'])
                
                step_instance.workflow_instance.add_audit_entry(
                    'step_assigned',
                    request.user,
                    {
                        'step': step_instance.workflow_step.name,
                        'assigned_to': assignee.get_full_name()
                    }
                )
                
                return Response({'status': 'assigned', 'assigned_to': assignee.get_full_name()})
                
            except User.DoesNotExist:
                return Response(
                    {'error': 'User not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        return Response(
            {'error': 'user_id is required'},
            status=status.HTTP_400_BAD_REQUEST
        )


class QualityControlViewSet(viewsets.ModelViewSet):
    """
    ViewSet for quality controls CRUD operations
    """
    queryset = QualityControl.objects.all()
    serializer_class = QualityControlSerializer
    permission_classes = [permissions.AllowAny]  # Temporary for development
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['workflow_template', 'workflow_step', 'type', 'is_required', 'is_blocking']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'type', 'passing_score', 'created_at']
    ordering = ['workflow_template', 'workflow_step', 'name']
    
    def get_queryset(self):
        return super().get_queryset().select_related(
            'workflow_template', 'workflow_step', 'created_by'
        )
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)