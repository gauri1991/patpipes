"""
Projects Domain Views
Comprehensive project management API views
"""

from django.db.models import Q, Count, Avg, F, Sum
from django.utils import timezone
from rest_framework import status, generics, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from rest_framework.pagination import LimitOffsetPagination
from django_filters.rest_framework import DjangoFilterBackend
from django_filters import FilterSet, CharFilter, DateFilter, ChoiceFilter

from .models import (
    Project, ProjectMember, ProjectTask, TaskComment, ProjectFile,
    TaskAttachment, ProjectMilestone, ProjectTemplate, ProjectStatus,
    ProjectPriority, LegacyProjectType, TaskStatus, ConfigurableProjectType,
    ImportBatch, ImportedPatent
)
from .serializers import (
    ProjectSerializer, ProjectListSerializer, CreateProjectSerializer,
    ProjectTaskSerializer, ProjectFileSerializer, ProjectMilestoneSerializer,
    ProjectTemplateSerializer, ProjectStatisticsSerializer, TimelineItemSerializer,
    ProjectMemberSerializer, TaskCommentSerializer, TaskAttachmentSerializer,
    ProjectTypeSerializer, ImportedPatentSerializer, ImportBatchSerializer,
    CreateImportBatchSerializer, ImportedPatentListSerializer
)


class LargeResultsSetPagination(LimitOffsetPagination):
    """Custom pagination for large result sets like imported patents"""
    default_limit = 20
    limit_query_param = 'page_size'
    max_limit = 1000  # Allow up to 1000 patents per page


class ProjectFilter(FilterSet):
    """Advanced filtering for projects"""
    
    status = ChoiceFilter(choices=ProjectStatus.choices)
    priority = ChoiceFilter(choices=ProjectPriority.choices)
    type = ChoiceFilter(choices=LegacyProjectType.choices)
    client_name = CharFilter(field_name='client_name', lookup_expr='icontains')
    lead_attorney = CharFilter(field_name='lead_attorney__email', lookup_expr='icontains')
    created_after = DateFilter(field_name='created_at', lookup_expr='gte')
    created_before = DateFilter(field_name='created_at', lookup_expr='lte')
    target_date_after = DateFilter(field_name='target_date', lookup_expr='gte')
    target_date_before = DateFilter(field_name='target_date', lookup_expr='lte')
    
    class Meta:
        model = Project
        fields = ['status', 'priority', 'type', 'client_name', 'lead_attorney']


class ProjectViewSet(ModelViewSet):
    """Main project management viewset"""

    queryset = Project.objects.select_related(
        'lead_attorney', 'created_by', 'organization'
    ).prefetch_related(
        'members__user', 'tasks', 'files', 'milestones'
    )
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = ProjectFilter
    search_fields = ['name', 'description', 'client_name', 'tags']
    ordering_fields = ['name', 'created_at', 'updated_at', 'target_date', 'priority', 'status']
    ordering = ['-updated_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return ProjectListSerializer
        elif self.action == 'create':
            return CreateProjectSerializer
        return ProjectSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by user's organization if applicable
        if self.request.user.organization:
            queryset = queryset.filter(organization=self.request.user.organization)
        
        # Filter by assigned projects if requested
        if self.request.query_params.get('assigned_to_me'):
            queryset = queryset.filter(
                Q(lead_attorney=self.request.user) |
                Q(members__user=self.request.user)
            ).distinct()
        
        # Filter by tags
        tags = self.request.query_params.get('tags')
        if tags:
            tag_list = [tag.strip() for tag in tags.split(',')]
            for tag in tag_list:
                queryset = queryset.filter(tags__contains=[tag])
        
        return queryset

    def perform_create(self, serializer):
        serializer.save(
            created_by=self.request.user,
            organization=self.request.user.organization
        )

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        # Return full project data using ProjectSerializer
        project = serializer.instance
        project_serializer = ProjectSerializer(project, context={'request': request})
        headers = self.get_success_headers(serializer.data)
        return Response(project_serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=True, methods=['post'])
    def duplicate(self, request, pk=None):
        """Duplicate a project"""
        project = self.get_object()
        new_name = request.data.get('name', f"{project.name} (Copy)")
        
        # Create duplicate project
        new_project = Project.objects.create(
            name=new_name,
            description=project.description,
            type=project.type,
            priority=project.priority,
            client_name=project.client_name,
            client_email=project.client_email,
            budget=project.budget,
            currency=project.currency,
            tags=project.tags.copy(),
            created_by=request.user,
            organization=project.organization
        )
        
        # Copy members
        for member in project.members.all():
            ProjectMember.objects.create(
                project=new_project,
                user=member.user,
                role=member.role,
                permissions=member.permissions.copy()
            )
        
        # Copy tasks
        task_mapping = {}
        for task in project.tasks.all():
            new_task = ProjectTask.objects.create(
                project=new_project,
                title=task.title,
                description=task.description,
                priority=task.priority,
                estimated_hours=task.estimated_hours,
                tags=task.tags.copy(),
                created_by=request.user
            )
            task_mapping[task.id] = new_task
        
        # Copy task dependencies
        for old_task in project.tasks.all():
            new_task = task_mapping[old_task.id]
            for dependency in old_task.dependencies.all():
                if dependency.id in task_mapping:
                    new_task.dependencies.add(task_mapping[dependency.id])
        
        # Copy milestones
        for milestone in project.milestones.all():
            ProjectMilestone.objects.create(
                project=new_project,
                title=milestone.title,
                description=milestone.description,
                target_date=milestone.target_date,
                importance=milestone.importance,
                color=milestone.color,
                created_by=request.user
            )
        
        serializer = ProjectSerializer(new_project, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        """Archive a project"""
        project = self.get_object()
        project.status = ProjectStatus.ARCHIVED
        project.save()
        
        serializer = self.get_serializer(project)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        """Restore an archived project"""
        project = self.get_object()
        project.status = ProjectStatus.ACTIVE
        project.save()
        
        serializer = self.get_serializer(project)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def timeline(self, request, pk=None):
        """Get project timeline"""
        project = self.get_object()
        timeline_items = []
        
        # Add tasks to timeline
        for task in project.tasks.all():
            timeline_items.append({
                'id': str(task.id),
                'type': 'task',
                'title': task.title,
                'start_date': task.start_date or task.created_at,
                'end_date': task.due_date,
                'status': task.status,
                'assignee': {
                    'id': str(task.assigned_to.id),
                    'name': task.assigned_to.full_name
                } if task.assigned_to else None,
                'color': self._get_status_color(task.status)
            })
        
        # Add milestones to timeline
        for milestone in project.milestones.all():
            timeline_items.append({
                'id': str(milestone.id),
                'type': 'milestone',
                'title': milestone.title,
                'start_date': milestone.target_date,
                'status': 'completed' if milestone.is_completed else 'pending',
                'color': milestone.color or self._get_priority_color(milestone.importance)
            })
        
        # Sort by date
        timeline_items.sort(key=lambda x: x['start_date'])
        
        serializer = TimelineItemSerializer(timeline_items, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def metrics(self, request, pk=None):
        """Get project performance metrics"""
        project = self.get_object()
        
        metrics = {
            'project_id': str(project.id),
            'budget_variance': 0,
            'task_completion_rate': 0,
            'team_efficiency_score': 0,
            'time_to_completion': None
        }
        
        # Calculate budget variance
        if project.budget:
            variance = float(project.actual_cost - project.budget)
            metrics['budget_variance'] = (variance / float(project.budget)) * 100
        
        # Calculate task completion rate
        total_tasks = project.total_tasks
        if total_tasks > 0:
            completed_tasks = project.completed_tasks
            metrics['task_completion_rate'] = (completed_tasks / total_tasks) * 100
        
        # Calculate time to completion
        if project.completed_date and project.start_date:
            metrics['time_to_completion'] = (project.completed_date - project.start_date).days
        
        # Basic team efficiency (tasks completed vs estimated time)
        total_estimated = project.tasks.aggregate(
            total=Sum('estimated_hours')
        )['total'] or 0
        total_actual = project.tasks.aggregate(
            total=Sum('actual_hours')
        )['total'] or 0
        
        if total_estimated > 0:
            metrics['team_efficiency_score'] = min(100, (total_estimated / total_actual) * 100)
        
        return Response(metrics)

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get overall project statistics"""
        queryset = self.get_queryset()
        
        # Basic counts
        total_projects = queryset.count()
        active_projects = queryset.filter(status=ProjectStatus.ACTIVE).count()
        completed_projects = queryset.filter(status=ProjectStatus.COMPLETED).count()
        
        # Overdue projects
        today = timezone.now().date()
        overdue_projects = queryset.filter(
            target_date__lt=today,
            status__in=[ProjectStatus.ACTIVE, ProjectStatus.ON_HOLD]
        ).count()
        
        # Task statistics
        all_tasks = ProjectTask.objects.filter(project__in=queryset)
        total_tasks = all_tasks.count()
        completed_tasks = all_tasks.filter(status=TaskStatus.DONE).count()
        overdue_tasks = all_tasks.filter(
            due_date__lt=timezone.now(),
            status__in=[TaskStatus.TODO, TaskStatus.IN_PROGRESS]
        ).count()
        
        # Calculate average completion time
        completed_projects_qs = queryset.filter(
            status=ProjectStatus.COMPLETED,
            start_date__isnull=False,
            completed_date__isnull=False
        )
        
        avg_completion_time = 0
        if completed_projects_qs.exists():
            completion_times = []
            for project in completed_projects_qs:
                days = (project.completed_date - project.start_date).days
                completion_times.append(days)
            avg_completion_time = sum(completion_times) / len(completion_times)
        
        # Success rate
        success_rate = 0
        if total_projects > 0:
            success_rate = (completed_projects / total_projects) * 100
        
        # Budget utilization
        projects_with_budget = queryset.exclude(budget__isnull=True)
        total_planned = projects_with_budget.aggregate(Sum('budget'))['budget__sum'] or 0
        total_actual = projects_with_budget.aggregate(Sum('actual_cost'))['actual_cost__sum'] or 0
        
        budget_utilization = {
            'planned': float(total_planned),
            'actual': float(total_actual),
            'variance': float(total_actual - total_planned) if total_planned > 0 else 0
        }
        
        statistics = {
            'total_projects': total_projects,
            'active_projects': active_projects,
            'completed_projects': completed_projects,
            'overdue_projects': overdue_projects,
            'total_tasks': total_tasks,
            'completed_tasks': completed_tasks,
            'overdue_tasks': overdue_tasks,
            'average_completion_time': avg_completion_time,
            'success_rate': success_rate,
            'budget_utilization': budget_utilization
        }
        
        serializer = ProjectStatisticsSerializer(statistics)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def bulk_update(self, request):
        """Bulk update multiple projects"""
        updates = request.data.get('updates', [])
        updated_projects = []
        
        for update_data in updates:
            project_id = update_data.get('projectId')
            data = update_data.get('data', {})
            
            try:
                project = self.get_queryset().get(id=project_id)
                serializer = CreateProjectSerializer(project, data=data, partial=True)
                if serializer.is_valid():
                    serializer.save()
                    updated_projects.append(project)
            except Project.DoesNotExist:
                continue
        
        serializer = ProjectListSerializer(updated_projects, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def bulk_delete(self, request):
        """Bulk delete multiple projects"""
        project_ids = request.data.get('projectIds', [])
        deleted_count = self.get_queryset().filter(id__in=project_ids).delete()[0]
        
        return Response({'deleted_count': deleted_count}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'])
    def bulk_archive(self, request):
        """Bulk archive multiple projects"""
        project_ids = request.data.get('projectIds', [])
        projects = self.get_queryset().filter(id__in=project_ids)
        projects.update(status=ProjectStatus.ARCHIVED)

        serializer = ProjectListSerializer(projects, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def search(self, request):
        """Search projects with advanced filtering"""
        queryset = self.get_queryset()

        # Text search across multiple fields
        query = request.query_params.get('q', '')
        if query:
            queryset = queryset.filter(
                Q(name__icontains=query) |
                Q(description__icontains=query) |
                Q(client_name__icontains=query) |
                Q(tags__contains=[query])
            )

        # Date range filters
        created_from = request.query_params.get('created_from')
        created_to = request.query_params.get('created_to')
        if created_from:
            queryset = queryset.filter(created_at__gte=created_from)
        if created_to:
            queryset = queryset.filter(created_at__lte=created_to)

        # Budget range
        budget_min = request.query_params.get('budget_min')
        budget_max = request.query_params.get('budget_max')
        if budget_min:
            queryset = queryset.filter(budget__gte=budget_min)
        if budget_max:
            queryset = queryset.filter(budget__lte=budget_max)

        serializer = ProjectListSerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def tags(self, request):
        """Get all unique tags used across projects"""
        queryset = self.get_queryset()
        all_tags = set()

        for project in queryset.exclude(tags__isnull=True).exclude(tags=[]):
            if project.tags:
                all_tags.update(project.tags)

        # Sort tags alphabetically
        sorted_tags = sorted(list(all_tags))

        return Response({
            'tags': sorted_tags,
            'count': len(sorted_tags)
        })

    @action(detail=True, methods=['get'])
    def analytics(self, request, pk=None):
        """Get comprehensive project analytics"""
        project = self.get_object()

        # Task analytics
        tasks = project.tasks.all()
        task_stats = {
            'total': tasks.count(),
            'completed': tasks.filter(status=TaskStatus.DONE).count(),
            'in_progress': tasks.filter(status=TaskStatus.IN_PROGRESS).count(),
            'blocked': tasks.filter(status=TaskStatus.BLOCKED).count(),
            'overdue': tasks.filter(
                due_date__lt=timezone.now(),
                status__in=[TaskStatus.TODO, TaskStatus.IN_PROGRESS]
            ).count()
        }

        # Time analytics
        total_estimated = tasks.aggregate(total=Sum('estimated_hours'))['total'] or 0
        total_actual = tasks.aggregate(total=Sum('actual_hours'))['total'] or 0

        # Team performance
        team_stats = []
        for member in project.members.all():
            member_tasks = tasks.filter(assigned_to=member.user)
            team_stats.append({
                'user_id': str(member.user.id),
                'user_name': member.user.full_name,
                'tasks_assigned': member_tasks.count(),
                'tasks_completed': member_tasks.filter(status=TaskStatus.DONE).count(),
                'hours_logged': member_tasks.aggregate(total=Sum('actual_hours'))['total'] or 0
            })

        # Milestone progress
        milestones = project.milestones.all()
        milestone_stats = {
            'total': milestones.count(),
            'completed': milestones.filter(is_completed=True).count(),
            'upcoming': milestones.filter(
                is_completed=False,
                target_date__gte=timezone.now().date()
            ).count()
        }

        analytics = {
            'project_id': str(project.id),
            'task_statistics': task_stats,
            'time_tracking': {
                'estimated_hours': total_estimated,
                'actual_hours': total_actual,
                'variance': total_actual - total_estimated if total_estimated else 0
            },
            'budget_tracking': {
                'budget': float(project.budget) if project.budget else 0,
                'actual_cost': float(project.actual_cost),
                'variance': float(project.actual_cost - project.budget) if project.budget else 0,
                'utilization_percentage': (
                    (float(project.actual_cost) / float(project.budget)) * 100
                    if project.budget and project.budget > 0 else 0
                )
            },
            'team_performance': team_stats,
            'milestone_progress': milestone_stats,
            'completion_percentage': project.progress_percentage
        }

        return Response(analytics)

    @action(detail=True, methods=['get'])
    def export(self, request, pk=None):
        """Export project data to various formats"""
        import json
        import csv
        from io import StringIO
        from django.http import HttpResponse

        project = self.get_object()
        export_format = request.query_params.get('format', 'json')

        if export_format == 'json':
            serializer = ProjectSerializer(project, context={'request': request})
            response = HttpResponse(
                json.dumps(serializer.data, indent=2, default=str),
                content_type='application/json'
            )
            response['Content-Disposition'] = f'attachment; filename="{project.name}_export.json"'
            return response

        elif export_format == 'csv':
            output = StringIO()
            writer = csv.writer(output)

            # Write project info
            writer.writerow(['Project Export'])
            writer.writerow(['Name', project.name])
            writer.writerow(['Description', project.description])
            writer.writerow(['Status', project.status])
            writer.writerow(['Priority', project.priority])
            writer.writerow(['Client', project.client_name])
            writer.writerow(['Budget', project.budget])
            writer.writerow(['Progress', f'{project.progress_percentage}%'])
            writer.writerow([])

            # Write tasks
            writer.writerow(['Tasks'])
            writer.writerow(['Title', 'Status', 'Priority', 'Assigned To', 'Due Date'])
            for task in project.tasks.all():
                writer.writerow([
                    task.title,
                    task.status,
                    task.priority,
                    task.assigned_to.full_name if task.assigned_to else '',
                    task.due_date
                ])
            writer.writerow([])

            # Write milestones
            writer.writerow(['Milestones'])
            writer.writerow(['Title', 'Target Date', 'Completed'])
            for milestone in project.milestones.all():
                writer.writerow([
                    milestone.title,
                    milestone.target_date,
                    'Yes' if milestone.is_completed else 'No'
                ])

            response = HttpResponse(output.getvalue(), content_type='text/csv')
            response['Content-Disposition'] = f'attachment; filename="{project.name}_export.csv"'
            return response

        else:
            return Response(
                {'error': f'Unsupported format: {export_format}. Supported formats: json, csv'},
                status=status.HTTP_400_BAD_REQUEST
            )

    def _get_status_color(self, status):
        """Get color for task status"""
        colors = {
            TaskStatus.TODO: '#6b7280',
            TaskStatus.IN_PROGRESS: '#3b82f6', 
            TaskStatus.REVIEW: '#f59e0b',
            TaskStatus.DONE: '#10b981',
            TaskStatus.BLOCKED: '#ef4444'
        }
        return colors.get(status, '#6b7280')

    def _get_priority_color(self, priority):
        """Get color for priority"""
        colors = {
            ProjectPriority.LOW: '#10b981',
            ProjectPriority.MEDIUM: '#f59e0b',
            ProjectPriority.HIGH: '#f97316', 
            ProjectPriority.URGENT: '#ef4444'
        }
        return colors.get(priority, '#6b7280')


class ProjectTaskViewSet(ModelViewSet):
    """Project task management viewset"""

    serializer_class = ProjectTaskSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'priority', 'assigned_to']
    search_fields = ['title', 'description']
    ordering_fields = ['due_date', 'priority', 'created_at', 'updated_at']
    ordering = ['due_date', '-priority']

    def get_queryset(self):
        project_id = self.kwargs.get('project_pk')
        return ProjectTask.objects.filter(
            project_id=project_id
        ).select_related(
            'assigned_to', 'created_by', 'parent_task'
        ).prefetch_related(
            'subtasks', 'dependencies', 'comments__author', 'attachments'
        )

    def perform_create(self, serializer):
        project_id = self.kwargs.get('project_pk')
        serializer.save(
            project_id=project_id,
            created_by=self.request.user
        )

    @action(detail=False, methods=['post'])
    def bulk_update(self, request, project_pk=None):
        """Bulk update multiple tasks"""
        updates = request.data.get('updates', [])
        updated_tasks = []
        
        for update_data in updates:
            task_id = update_data.get('taskId')
            data = update_data.get('data', {})
            
            try:
                task = self.get_queryset().get(id=task_id)
                serializer = ProjectTaskSerializer(task, data=data, partial=True)
                if serializer.is_valid():
                    serializer.save()
                    updated_tasks.append(task)
            except ProjectTask.DoesNotExist:
                continue
        
        serializer = ProjectTaskSerializer(updated_tasks, many=True, context={'request': request})
        return Response(serializer.data)


class ProjectFileViewSet(ModelViewSet):
    """Project file management viewset"""

    serializer_class = ProjectFileSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'is_latest_version']
    search_fields = ['original_name', 'tags', 'description']
    ordering_fields = ['original_name', 'uploaded_at', 'file_size']
    ordering = ['-uploaded_at']

    def get_queryset(self):
        project_id = self.kwargs.get('project_pk')
        return ProjectFile.objects.filter(
            project_id=project_id
        ).select_related('uploaded_by')

    def perform_create(self, serializer):
        project_id = self.kwargs.get('project_pk')
        serializer.save(
            project_id=project_id,
            uploaded_by=self.request.user
        )

    @action(detail=True, methods=['get'])
    def download(self, request, project_pk=None, pk=None):
        """Download file and track access"""
        from django.http import FileResponse, Http404
        import os

        file_obj = self.get_object()
        file_obj.increment_access_count()

        # Check if file exists on disk
        if file_obj.file and hasattr(file_obj.file, 'path'):
            file_path = file_obj.file.path
            if os.path.exists(file_path):
                response = FileResponse(
                    open(file_path, 'rb'),
                    content_type=file_obj.mime_type or 'application/octet-stream'
                )
                response['Content-Disposition'] = f'attachment; filename="{file_obj.original_name}"'
                return response

        # Fallback to URL if file not on local disk (e.g., cloud storage)
        if file_obj.file_url:
            return Response({
                'download_url': file_obj.file_url,
                'filename': file_obj.original_name,
                'mime_type': file_obj.mime_type
            })

        raise Http404("File not found")


class ProjectMilestoneViewSet(ModelViewSet):
    """Project milestone management viewset"""

    serializer_class = ProjectMilestoneSerializer
    permission_classes = [permissions.IsAuthenticated]
    ordering = ['target_date']

    def get_queryset(self):
        project_id = self.kwargs.get('project_pk')
        return ProjectMilestone.objects.filter(
            project_id=project_id
        ).select_related('created_by').prefetch_related('dependent_tasks')

    def perform_create(self, serializer):
        project_id = self.kwargs.get('project_pk')
        serializer.save(
            project_id=project_id,
            created_by=self.request.user
        )

    @action(detail=True, methods=['post'])
    def complete(self, request, project_pk=None, pk=None):
        """Mark milestone as completed"""
        milestone = self.get_object()
        milestone.complete()
        
        serializer = self.get_serializer(milestone)
        return Response(serializer.data)


class ProjectTemplateViewSet(ModelViewSet):
    """Project template management viewset"""

    queryset = ProjectTemplate.objects.prefetch_related(
        'default_tasks', 'default_milestones', 'default_files'
    )
    serializer_class = ProjectTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['type', 'category', 'is_public']
    search_fields = ['name', 'description', 'category']
    ordering_fields = ['name', 'usage_count', 'created_at']
    ordering = ['-usage_count', 'name']

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Show public templates and user's own templates
        return queryset.filter(
            Q(is_public=True) | Q(created_by=self.request.user)
        )

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def create_project(self, request, pk=None):
        """Create a project from template"""
        template = self.get_object()
        template.increment_usage()
        
        # Create project using template data
        project_data = request.data
        project_data['template'] = template.id
        
        serializer = CreateProjectSerializer(data=project_data, context={'request': request})
        if serializer.is_valid():
            project = serializer.save(
                created_by=request.user,
                organization=request.user.organization
            )
            
            # Create tasks from template
            for template_task in template.default_tasks.all():
                start_date = None
                if project.start_date:
                    start_date = project.start_date + timezone.timedelta(days=template_task.day_offset)
                
                ProjectTask.objects.create(
                    project=project,
                    title=template_task.title,
                    description=template_task.description,
                    priority=template_task.priority,
                    estimated_hours=template_task.estimated_hours,
                    start_date=start_date,
                    created_by=request.user
                )
            
            # Create milestones from template
            for template_milestone in template.default_milestones.all():
                target_date = None
                if project.start_date:
                    target_date = project.start_date + timezone.timedelta(days=template_milestone.day_offset)
                
                ProjectMilestone.objects.create(
                    project=project,
                    title=template_milestone.title,
                    description=template_milestone.description,
                    target_date=target_date,
                    importance=template_milestone.importance,
                    created_by=request.user
                )
            
            project_serializer = ProjectSerializer(project, context={'request': request})
            return Response(project_serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProjectTypeViewSet(ModelViewSet):
    """ViewSet for configurable project types"""

    queryset = ConfigurableProjectType.objects.filter(is_active=True).order_by('display_order', 'name')
    serializer_class = ProjectTypeSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description', 'category']
    ordering_fields = ['name', 'category', 'display_order', 'created_at']
    ordering = ['display_order', 'name']
    
    def get_queryset(self):
        """Filter project types based on user role"""
        queryset = super().get_queryset()
        
        # If not admin, only show project types accessible to user's role
        if not self.request.user.is_staff:
            user_role = getattr(self.request.user, 'role', 'viewer')
            # This would need role hierarchy logic, for now show all active types
            pass
            
        return queryset


class ImportBatchViewSet(ModelViewSet):
    """Import batch management viewset"""
    
    serializer_class = ImportBatchSerializer
    permission_classes = [permissions.IsAuthenticated]  # Require authentication for imports
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'source_filename']
    search_fields = ['batch_name', 'batch_description', 'source_filename']
    ordering_fields = ['imported_at', 'total_rows', 'successful_imports', 'status']
    ordering = ['-imported_at']

    def get_queryset(self):
        project_id = self.kwargs.get('project_pk')
        return ImportBatch.objects.filter(
            project_id=project_id
        ).select_related('imported_by').prefetch_related('patents')

    def get_serializer_class(self):
        if self.action == 'create':
            return CreateImportBatchSerializer
        return ImportBatchSerializer

    def perform_create(self, serializer):
        project_id = self.kwargs.get('project_pk')
        try:
            # First try to find it in regular projects
            project = Project.objects.get(id=project_id)
        except Project.DoesNotExist:
            try:
                # If not found, try analytics projects and create a corresponding regular project
                from domains.analytics.models import AnalyticsProject
                analytics_project = AnalyticsProject.objects.get(id=project_id)
                
                # Create a corresponding regular project with the same ID
                project, created = Project.objects.get_or_create(
                    id=analytics_project.id,
                    defaults={
                        'name': analytics_project.name,
                        'description': analytics_project.description or f'Analytics project: {analytics_project.name}',
                        'type': 'analytics',  # Mark it as derived from analytics
                        'status': 'active',
                        'created_by': self.request.user if self.request.user.is_authenticated else analytics_project.created_by,
                    }
                )
                if created:
                    print(f"Created corresponding regular project for analytics project: {analytics_project.name}")
                    
            except AnalyticsProject.DoesNotExist:
                from rest_framework.exceptions import NotFound
                raise NotFound(f"Project with ID '{project_id}' does not exist in either Projects or Analytics Projects.")
        
        # Set the context manually and then save
        serializer.context['project'] = project
        serializer.save()

    @action(detail=True, methods=['delete'])
    def delete_batch(self, request, project_pk=None, pk=None):
        """Delete entire import batch and all its patents"""
        batch = self.get_object()
        patent_count = batch.patents.count()
        batch.delete()
        
        return Response({
            'message': f'Successfully deleted batch and {patent_count} patents',
            'deleted_patents': patent_count
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def history(self, request, project_pk=None):
        """Get import history for the project"""
        queryset = self.get_queryset()
        page = self.paginate_queryset(queryset)
        
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class ImportedPatentViewSet(ModelViewSet):
    """Imported patent management viewset"""
    
    serializer_class = ImportedPatentSerializer
    permission_classes = [permissions.IsAuthenticated]  # Require authentication for imports
    pagination_class = LargeResultsSetPagination  # Allow large page sizes
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_selected', 'manual_relevance', 'import_batch']
    search_fields = ['patent_id', 'title', 'assignee', 'abstract']
    ordering_fields = ['created_at', 'patent_id', 'title', 'publication_date']
    ordering = ['-created_at']

    def get_queryset(self):
        project_id = self.kwargs.get('project_pk')
        return ImportedPatent.active.filter(
            project_id=project_id
        ).select_related('import_batch__imported_by')

    def get_serializer_class(self):
        if self.action == 'list':
            return ImportedPatentListSerializer
        return ImportedPatentSerializer

    @action(detail=True, methods=['post'])
    def soft_delete(self, request, project_pk=None, pk=None):
        """Soft delete a patent"""
        patent = self.get_object()
        reason = request.data.get('reason', 'Deleted by user')
        patent.soft_delete(user=request.user, reason=reason)
        
        return Response({
            'message': 'Patent successfully deleted',
            'deleted_at': patent.deleted_at
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def restore(self, request, project_pk=None, pk=None):
        """Restore a soft deleted patent"""
        try:
            patent = ImportedPatent.objects.get(
                id=pk,
                project_id=project_pk,
                is_deleted=True
            )
            patent.restore()
            
            serializer = self.get_serializer(patent)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except ImportedPatent.DoesNotExist:
            return Response({
                'error': 'Patent not found or not deleted'
            }, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['post'])
    def bulk_update(self, request, project_pk=None):
        """Bulk update multiple patents"""
        updates = request.data.get('updates', [])
        updated_patents = []
        
        for update_data in updates:
            patent_id = update_data.get('patentId')
            data = update_data.get('data', {})
            
            try:
                patent = self.get_queryset().get(id=patent_id)
                serializer = ImportedPatentSerializer(patent, data=data, partial=True)
                if serializer.is_valid():
                    serializer.save()
                    updated_patents.append(patent)
            except ImportedPatent.DoesNotExist:
                continue
        
        serializer = ImportedPatentListSerializer(updated_patents, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def bulk_delete(self, request, project_pk=None):
        """Bulk soft delete multiple patents"""
        patent_ids = request.data.get('patentIds', [])
        reason = request.data.get('reason', 'Bulk deletion')
        
        patents = self.get_queryset().filter(id__in=patent_ids)
        deleted_count = 0
        
        for patent in patents:
            patent.soft_delete(user=request.user, reason=reason)
            deleted_count += 1
        
        return Response({
            'message': f'Successfully deleted {deleted_count} patents',
            'deleted_count': deleted_count
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'])
    def bulk_select(self, request, project_pk=None):
        """Bulk select/unselect patents"""
        patent_ids = request.data.get('patentIds', [])
        selected = request.data.get('selected', True)
        
        updated_count = self.get_queryset().filter(
            id__in=patent_ids
        ).update(is_selected=selected)
        
        return Response({
            'message': f'Updated {updated_count} patents',
            'updated_count': updated_count,
            'selected': selected
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'])
    def bulk_set_relevance(self, request, project_pk=None):
        """Bulk set relevance for patents"""
        patent_ids = request.data.get('patentIds', [])
        relevance = request.data.get('relevance')
        
        if relevance not in ['high', 'medium', 'low', 'not_relevant']:
            return Response({
                'error': 'Invalid relevance value'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        updated_count = self.get_queryset().filter(
            id__in=patent_ids
        ).update(manual_relevance=relevance)
        
        return Response({
            'message': f'Updated {updated_count} patents',
            'updated_count': updated_count,
            'relevance': relevance
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def statistics(self, request, project_pk=None):
        """Get statistics for imported patents"""
        queryset = self.get_queryset()
        
        stats = {
            'total_patents': queryset.count(),
            'selected_patents': queryset.filter(is_selected=True).count(),
            'by_relevance': {
                'high': queryset.filter(manual_relevance='high').count(),
                'medium': queryset.filter(manual_relevance='medium').count(),
                'low': queryset.filter(manual_relevance='low').count(),
                'not_relevant': queryset.filter(manual_relevance='not_relevant').count(),
                'unrated': queryset.filter(manual_relevance='').count(),
            },
            'by_assignee': list(
                queryset.exclude(assignee='')
                .values('assignee')
                .annotate(count=Count('id'))
                .order_by('-count')[:10]
            ),
            'import_batches': ImportBatch.objects.filter(
                project_id=project_pk
            ).count()
        }
        
        return Response(stats)