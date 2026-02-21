"""
Dashboard Views
Role-based dashboard data and user-specific project information
"""

from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Count, Q, Avg, F
from django.db import models
from datetime import timedelta

from ..models import Project, ProjectTask, ProjectMember
from ..filters import ProjectPermissionFilter, ProjectDataFilter
from ..serializers import ProjectListSerializer


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_dashboard_data(request):
    """Get dashboard data filtered for the current user"""
    user = request.user
    
    # Get projects accessible to this user
    accessible_projects = ProjectPermissionFilter.filter_projects_for_user(
        Project.objects.all(), user
    )
    
    # Calculate statistics
    total_projects = accessible_projects.count()
    active_projects = accessible_projects.filter(
        status__in=['active', 'under_review', 'filed']
    ).count()
    completed_projects = accessible_projects.filter(status='completed').count()
    
    # Calculate overdue projects
    today = timezone.now().date()
    overdue_projects = accessible_projects.filter(
        target_date__lt=today,
        status__in=['active', 'under_review', 'draft']
    ).count()
    
    # Get recent projects (last 30 days activity)
    recent_projects = accessible_projects.filter(
        updated_at__gte=timezone.now() - timedelta(days=30)
    ).order_by('-updated_at')[:6]
    
    # Serialize recent projects with user-specific field filtering
    recent_projects_data = []
    for project in recent_projects:
        serializer = ProjectListSerializer(project)
        filtered_data = ProjectDataFilter.filter_sensitive_data(
            serializer.data, user, project
        )
        recent_projects_data.append(filtered_data)
    
    # Calculate user performance metrics
    user_projects = accessible_projects.filter(
        Q(lead_attorney=user) | Q(members__user=user)
    ).distinct()
    
    user_completed_projects = user_projects.filter(status='completed').count()
    user_active_projects = user_projects.filter(
        status__in=['active', 'under_review']
    ).count()
    
    # Get user's tasks
    user_tasks = ProjectTask.objects.filter(
        assigned_to=user,
        project__in=accessible_projects
    )
    
    completed_tasks = user_tasks.filter(status='done').count()
    total_tasks = user_tasks.count()
    
    # Calculate average completion time for user's completed projects
    completed_user_projects = user_projects.filter(
        status='completed',
        completed_date__isnull=False,
        start_date__isnull=False
    )
    
    avg_completion_time = 0
    if completed_user_projects.exists():
        completion_times = []
        for project in completed_user_projects:
            if project.start_date and project.completed_date:
                days = (project.completed_date - project.start_date).days
                completion_times.append(days)
        
        if completion_times:
            avg_completion_time = sum(completion_times) / len(completion_times)
    
    # Calculate on-time delivery rate
    on_time_projects = completed_user_projects.filter(
        completed_date__lte=F('target_date')
    ).count()
    
    on_time_rate = 0
    if user_completed_projects > 0:
        on_time_rate = (on_time_projects / user_completed_projects) * 100
    
    # Determine efficiency and trend
    efficiency = 85  # Default efficiency score
    if total_tasks > 0:
        task_completion_rate = (completed_tasks / total_tasks) * 100
        efficiency = min(95, max(50, task_completion_rate))
    
    trend = 'stable'
    if on_time_rate > 80:
        trend = 'up'
    elif on_time_rate < 60:
        trend = 'down'
    
    # Budget utilization (only for users with budget access)
    budget_utilization = {'planned': 0, 'actual': 0, 'variance': 0}
    if user.role in ['admin', 'manager', 'supervisor', 'lead_attorney']:
        budget_projects = accessible_projects.filter(
            budget__isnull=False,
            budget__gt=0
        )
        if budget_projects.exists():
            total_budget = sum(p.budget for p in budget_projects if p.budget)
            total_actual = sum(p.actual_cost for p in budget_projects if p.actual_cost)
            
            budget_utilization = {
                'planned': float(total_budget),
                'actual': float(total_actual),
                'variance': ((total_actual - total_budget) / total_budget * 100) if total_budget > 0 else 0
            }
    
    # Generate quick actions based on user role
    quick_actions = get_quick_actions_for_user(user)
    
    # Generate recent activities (simplified for now)
    recent_activities = get_recent_activities_for_user(user, accessible_projects)
    
    # Generate notifications
    notifications = get_notifications_for_user(user, accessible_projects)
    
    dashboard_data = {
        'statistics': {
            'total_projects': total_projects,
            'active_projects': active_projects,
            'completed_projects': completed_projects,
            'overdue_projects': overdue_projects,
            'total_tasks': total_tasks,
            'completed_tasks': completed_tasks,
            'overdue_tasks': 0,  # Would need to calculate based on task due dates
            'average_completion_time': avg_completion_time,
            'success_rate': (completed_projects / total_projects * 100) if total_projects > 0 else 0,
            'budget_utilization': budget_utilization
        },
        'recent_projects': recent_projects_data,
        'recent_activities': recent_activities,
        'notifications': notifications,
        'quick_actions': quick_actions,
        'performance_metrics': {
            'projects_completed': user_completed_projects,
            'tasks_completed': completed_tasks,
            'average_completion_time': avg_completion_time,
            'on_time_delivery_rate': on_time_rate,
            'efficiency': efficiency,
            'trend': trend
        }
    }
    
    return Response(dashboard_data)


def get_quick_actions_for_user(user):
    """Get role-specific quick actions"""
    base_actions = [
        {
            'id': 'view_tasks',
            'title': 'View Tasks',
            'description': 'Check pending tasks',
            'icon': 'check-square',
            'action': 'view_tasks',
            'is_enabled': True
        }
    ]
    
    # Add role-specific actions
    if user.role in ['admin', 'manager', 'supervisor', 'lead_attorney', 'attorney']:
        base_actions.insert(0, {
            'id': 'create_project',
            'title': 'New Project',
            'description': 'Start a new patent project',
            'icon': 'plus',
            'action': 'create_project',
            'is_enabled': True
        })
    
    if user.role in ['admin', 'manager', 'supervisor']:
        base_actions.extend([
            {
                'id': 'generate_report',
                'title': 'Generate Report',
                'description': 'Create project reports',
                'icon': 'file-text',
                'action': 'generate_report',
                'is_enabled': True
            },
            {
                'id': 'manage_team',
                'title': 'Manage Team',
                'description': 'Assign team members',
                'icon': 'users',
                'action': 'manage_team',
                'is_enabled': True
            }
        ])
    
    base_actions.append({
        'id': 'upload_documents',
        'title': 'Upload Documents',
        'description': 'Add project files',
        'icon': 'upload',
        'action': 'upload_documents',
        'is_enabled': True
    })
    
    return base_actions


def get_recent_activities_for_user(user, accessible_projects):
    """Get recent activities for the user"""
    # This would typically query an activity log
    # For now, return sample activities based on recent project updates
    activities = []
    
    recent_projects = accessible_projects.order_by('-updated_at')[:5]
    for project in recent_projects:
        activities.append({
            'id': f'project_update_{project.id}',
            'type': 'project_update',
            'title': f'Project Updated: {project.name}',
            'description': f'Progress: {project.progress_percentage}%',
            'project_id': str(project.id),
            'project_name': project.name,
            'user_id': str(user.id),
            'user_name': f'{user.first_name} {user.last_name}',
            'timestamp': project.updated_at.isoformat()
        })
    
    return activities[:10]  # Limit to 10 recent activities


def get_notifications_for_user(user, accessible_projects):
    """Get notifications for the user"""
    notifications = []
    today = timezone.now().date()
    
    # Overdue projects
    overdue_projects = accessible_projects.filter(
        target_date__lt=today,
        status__in=['active', 'under_review']
    )
    
    for project in overdue_projects[:5]:  # Limit to 5
        days_overdue = (today - project.target_date).days
        notifications.append({
            'id': f'overdue_{project.id}',
            'type': 'project_overdue',
            'title': 'Project Overdue',
            'message': f'{project.name} is {days_overdue} days overdue',
            'project_id': str(project.id),
            'project_name': project.name,
            'priority': 'urgent' if days_overdue > 7 else 'high',
            'is_read': False,
            'timestamp': timezone.now().isoformat(),
            'action_url': f'/dashboard/projects/{project.id}'
        })
    
    # Upcoming deadlines (within 7 days)
    upcoming_deadline_projects = accessible_projects.filter(
        target_date__gte=today,
        target_date__lte=today + timedelta(days=7),
        status__in=['active', 'under_review']
    )
    
    for project in upcoming_deadline_projects[:5]:
        days_remaining = (project.target_date - today).days
        notifications.append({
            'id': f'deadline_{project.id}',
            'type': 'deadline_approaching',
            'title': 'Deadline Approaching',
            'message': f'{project.name} due in {days_remaining} days',
            'project_id': str(project.id),
            'project_name': project.name,
            'priority': 'medium',
            'is_read': False,
            'timestamp': timezone.now().isoformat(),
            'action_url': f'/dashboard/projects/{project.id}'
        })
    
    return notifications


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_user_projects(request):
    """Get projects accessible to the current user"""
    user = request.user
    
    # Get filtered projects
    projects = ProjectPermissionFilter.filter_projects_for_user(
        Project.objects.all(), user
    ).order_by('-updated_at')
    
    # Apply additional filters from query parameters
    status_filter = request.GET.get('status')
    if status_filter:
        projects = projects.filter(status=status_filter)
    
    priority_filter = request.GET.get('priority')
    if priority_filter:
        projects = projects.filter(priority=priority_filter)
    
    # Search
    search = request.GET.get('search')
    if search:
        projects = projects.filter(
            Q(name__icontains=search) |
            Q(description__icontains=search) |
            Q(client_name__icontains=search)
        )
    
    # Pagination
    page_size = min(int(request.GET.get('limit', 20)), 100)  # Max 100 items
    page = int(request.GET.get('page', 1))
    offset = (page - 1) * page_size
    
    total = projects.count()
    projects_page = projects[offset:offset + page_size]
    
    # Serialize with user-specific filtering
    projects_data = []
    for project in projects_page:
        serializer = ProjectListSerializer(project)
        filtered_data = ProjectDataFilter.filter_sensitive_data(
            serializer.data, user, project
        )
        projects_data.append(filtered_data)
    
    return Response({
        'projects': projects_data,
        'total': total,
        'page': page,
        'total_pages': (total + page_size - 1) // page_size,
        'has_next': offset + page_size < total,
        'has_previous': page > 1
    })