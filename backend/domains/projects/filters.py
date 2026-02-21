"""
Project Filters
Role-based filtering for projects and related data
"""

from django.db.models import Q
from django.contrib.auth import get_user_model
from .models import Project, ProjectMember

User = get_user_model()

class ProjectPermissionFilter:
    """Filter projects based on user role and permissions"""
    
    @staticmethod
    def filter_projects_for_user(queryset, user):
        """Filter projects based on user's role and permissions"""
        if not user or not user.is_authenticated:
            return queryset.none()
        
        # Superusers and admins can see all projects
        if user.is_superuser or user.role in ['admin', 'manager', 'supervisor']:
            return queryset
        
        # Lead attorneys can see projects they lead or are members of
        if user.role == 'lead_attorney':
            return queryset.filter(
                Q(lead_attorney=user) |
                Q(members__user=user)
            ).distinct()
        
        # Attorneys can see projects they are assigned to or lead
        if user.role == 'attorney':
            return queryset.filter(
                Q(lead_attorney=user) |
                Q(members__user=user)
            ).distinct()
        
        # Paralegals and analysts can only see projects they are members of
        if user.role in ['paralegal', 'analyst']:
            return queryset.filter(members__user=user).distinct()
        
        # Viewers can only see projects they are explicitly assigned to
        if user.role == 'viewer':
            return queryset.filter(
                members__user=user,
                members__role__in=['viewer', 'paralegal', 'attorney', 'lead_attorney', 'admin']
            ).distinct()
        
        # Default: no access
        return queryset.none()
    
    @staticmethod
    def can_view_project(user, project):
        """Check if user can view a specific project"""
        if not user or not user.is_authenticated:
            return False
            
        # Superusers and managers can view all projects
        if user.is_superuser or user.role in ['admin', 'manager', 'supervisor']:
            return True
            
        # Project lead can always view
        if project.lead_attorney == user:
            return True
            
        # Check if user is a member of the project
        return ProjectMember.objects.filter(
            project=project,
            user=user
        ).exists()
    
    @staticmethod
    def can_edit_project(user, project):
        """Check if user can edit a specific project"""
        if not user or not user.is_authenticated:
            return False
            
        # Superusers and managers can edit all projects
        if user.is_superuser or user.role in ['admin', 'manager', 'supervisor']:
            return True
            
        # Project lead can edit
        if project.lead_attorney == user:
            return True
            
        # Check member permissions
        try:
            member = ProjectMember.objects.get(project=project, user=user)
            return 'edit' in member.permissions
        except ProjectMember.DoesNotExist:
            return False
    
    @staticmethod
    def can_delete_project(user, project):
        """Check if user can delete a specific project"""
        if not user or not user.is_authenticated:
            return False
            
        # Only superusers, managers, and supervisors can delete projects
        if user.is_superuser or user.role in ['admin', 'manager', 'supervisor']:
            return True
            
        # Project creators who are lead attorneys can delete their own projects
        if project.created_by == user and user.role == 'lead_attorney':
            return True
            
        return False
    
    @staticmethod
    def get_project_fields_for_user(user, project):
        """Get which fields a user can see for a project"""
        if not user or not user.is_authenticated:
            return []
            
        # Base fields everyone with view access can see
        base_fields = [
            'id', 'name', 'description', 'type', 'status', 'priority',
            'start_date', 'target_date', 'progress_percentage', 'tags',
            'created_at', 'updated_at'
        ]
        
        # Additional fields for team members
        member_fields = base_fields + [
            'client_name', 'lead_attorney', 'total_tasks', 'completed_tasks'
        ]
        
        # Full fields for managers and project leads
        full_fields = member_fields + [
            'client_email', 'budget', 'actual_cost', 'currency',
            'completed_date', 'created_by'
        ]
        
        # Determine access level
        if user.is_superuser or user.role in ['admin', 'manager', 'supervisor']:
            return full_fields
            
        if project.lead_attorney == user:
            return full_fields
            
        try:
            member = ProjectMember.objects.get(project=project, user=user)
            if member.role in ['lead_attorney', 'attorney']:
                return full_fields
            elif member.role in ['paralegal']:
                return member_fields
            else:  # viewer
                return base_fields
        except ProjectMember.DoesNotExist:
            return base_fields if ProjectPermissionFilter.can_view_project(user, project) else []


class ProjectDataFilter:
    """Filter project-related data based on permissions"""
    
    @staticmethod
    def filter_sensitive_data(data, user, project):
        """Remove sensitive data based on user permissions"""
        allowed_fields = ProjectPermissionFilter.get_project_fields_for_user(user, project)
        
        # Filter data dictionary
        filtered_data = {}
        for key, value in data.items():
            if key in allowed_fields:
                filtered_data[key] = value
            elif key in ['budget', 'actual_cost', 'client_email'] and user.role in ['viewer', 'analyst']:
                # Hide sensitive financial and client data from viewers/analysts
                continue
            else:
                filtered_data[key] = value
                
        return filtered_data
    
    @staticmethod
    def get_dashboard_data_for_user(user):
        """Get dashboard data filtered for user's access level"""
        projects = ProjectPermissionFilter.filter_projects_for_user(
            Project.objects.all(), user
        )
        
        # Calculate statistics based on accessible projects
        total_projects = projects.count()
        active_projects = projects.filter(status__in=['active', 'under_review']).count()
        completed_projects = projects.filter(status='completed').count()
        overdue_projects = projects.filter(
            target_date__lt=timezone.now().date(),
            status__in=['active', 'under_review']
        ).count()
        
        return {
            'total_projects': total_projects,
            'active_projects': active_projects,
            'completed_projects': completed_projects,
            'overdue_projects': overdue_projects,
            'accessible_projects': projects
        }