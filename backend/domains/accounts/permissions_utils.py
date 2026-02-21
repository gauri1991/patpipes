"""
Permission Utility Functions
Helper functions and decorators for permission checking
"""

from functools import wraps
from rest_framework.exceptions import PermissionDenied
from .models import Permission, WorkflowUserPermission, DataConfigurationPermission


# Import role permissions from views
from .permission_views import DEFAULT_ROLE_PERMISSIONS


def has_permission(user, permission_name):
    """
    Check if a user has a specific permission

    Args:
        user: User instance
        permission_name: String permission identifier (e.g., 'projects_create')

    Returns:
        Boolean indicating if user has the permission
    """
    # Get role-based permissions
    role_permissions = DEFAULT_ROLE_PERMISSIONS.get(user.role, [])

    # Admin has all permissions
    if '*' in role_permissions:
        return True

    # Check custom permissions
    custom_perms = Permission.objects.filter(user=user, resource=permission_name).exists()

    # Check role-based permissions
    has_role_permission = permission_name in role_permissions

    return custom_perms or has_role_permission


def require_permission(permission_name):
    """
    Decorator to require a specific permission for a view

    Usage:
        @require_permission('projects_create')
        def my_view(request):
            # View code here
    """
    def decorator(func):
        @wraps(func)
        def wrapper(request, *args, **kwargs):
            if not has_permission(request.user, permission_name):
                raise PermissionDenied(f'You do not have permission: {permission_name}')
            return func(request, *args, **kwargs)
        return wrapper
    return decorator


def require_any_permission(*permission_names):
    """
    Decorator to require ANY of the specified permissions

    Usage:
        @require_any_permission('projects_create', 'projects_edit')
        def my_view(request):
            # View code here
    """
    def decorator(func):
        @wraps(func)
        def wrapper(request, *args, **kwargs):
            if not any(has_permission(request.user, perm) for perm in permission_names):
                raise PermissionDenied(f'You need one of these permissions: {", ".join(permission_names)}')
            return func(request, *args, **kwargs)
        return wrapper
    return decorator


def require_all_permissions(*permission_names):
    """
    Decorator to require ALL of the specified permissions

    Usage:
        @require_all_permissions('projects_view', 'projects_edit')
        def my_view(request):
            # View code here
    """
    def decorator(func):
        @wraps(func)
        def wrapper(request, *args, **kwargs):
            if not all(has_permission(request.user, perm) for perm in permission_names):
                raise PermissionDenied(f'You need all of these permissions: {", ".join(permission_names)}')
            return func(request, *args, **kwargs)
        return wrapper
    return decorator


def get_user_permissions(user):
    """
    Get all permissions for a user (role-based + custom)

    Args:
        user: User instance

    Returns:
        List of permission strings
    """
    role_permissions = DEFAULT_ROLE_PERMISSIONS.get(user.role, [])

    if '*' in role_permissions:
        # Admin has all permissions - return all available permissions
        all_perms = set()
        for perms in DEFAULT_ROLE_PERMISSIONS.values():
            if perms != ['*']:
                all_perms.update(perms)
        return list(all_perms)

    # Get custom permissions
    custom_perms = list(Permission.objects.filter(user=user).values_list('resource', flat=True))

    # Return custom if exists, otherwise role-based
    return custom_perms if custom_perms else role_permissions


def user_has_workflow_permission(user, workflow_permission):
    """
    Check if user has a specific workflow permission

    Args:
        user: User instance
        workflow_permission: WorkflowPermission enum value or field name (string)

    Returns:
        Boolean
    """
    try:
        workflow_perms = WorkflowUserPermission.objects.get(user=user)
        return getattr(workflow_perms, workflow_permission, False)
    except WorkflowUserPermission.DoesNotExist:
        return False


def user_has_data_config_permission(user, permission_name):
    """
    Check if user has a specific data configuration permission

    Args:
        user: User instance
        permission_name: Permission field name (e.g., 'can_create_mapping_rules')

    Returns:
        Boolean
    """
    try:
        data_perms = DataConfigurationPermission.objects.get(user=user)
        return getattr(data_perms, permission_name, False)
    except DataConfigurationPermission.DoesNotExist:
        return False
