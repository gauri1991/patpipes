"""
Workflow Role-Based Access Control (RBAC) System
Defines workflow-specific roles, permissions, and access control logic
"""

import logging
from typing import Dict, List, Optional, Set
from enum import Enum
from dataclasses import dataclass
from django.contrib.auth import get_user_model
from django.core.exceptions import PermissionDenied
from django.db import models

from .models import WorkflowInstance, WorkflowStepInstance, WorkflowTemplate

User = get_user_model()
logger = logging.getLogger(__name__)


class WorkflowRole(models.TextChoices):
    """Workflow-specific roles"""
    WORKFLOW_ADMIN = 'workflow_admin', 'Workflow Admin'
    WORKFLOW_MANAGER = 'workflow_manager', 'Workflow Manager'
    STEP_OWNER = 'step_owner', 'Step Owner'
    QUALITY_REVIEWER = 'quality_reviewer', 'Quality Reviewer'
    OBSERVER = 'observer', 'Observer'


class WorkflowPermission(models.TextChoices):
    """Workflow-specific permissions"""
    # Template Management
    CREATE_TEMPLATE = 'create_template', 'Create Template'
    EDIT_TEMPLATE = 'edit_template', 'Edit Template'
    DELETE_TEMPLATE = 'delete_template', 'Delete Template'
    ACTIVATE_TEMPLATE = 'activate_template', 'Activate Template'
    VIEW_TEMPLATE = 'view_template', 'View Template'
    
    # Workflow Instance Management
    CREATE_WORKFLOW = 'create_workflow', 'Create Workflow'
    START_WORKFLOW = 'start_workflow', 'Start Workflow'
    PAUSE_WORKFLOW = 'pause_workflow', 'Pause Workflow'
    RESUME_WORKFLOW = 'resume_workflow', 'Resume Workflow'
    CANCEL_WORKFLOW = 'cancel_workflow', 'Cancel Workflow'
    DELETE_WORKFLOW = 'delete_workflow', 'Delete Workflow'
    VIEW_WORKFLOW = 'view_workflow', 'View Workflow'
    ASSIGN_WORKFLOW = 'assign_workflow', 'Assign Workflow'
    
    # Step Management
    EXECUTE_STEP = 'execute_step', 'Execute Step'
    COMPLETE_STEP = 'complete_step', 'Complete Step'
    SKIP_STEP = 'skip_step', 'Skip Step'
    REASSIGN_STEP = 'reassign_step', 'Reassign Step'
    VIEW_STEP = 'view_step', 'View Step'
    
    # Quality Control
    APPROVE_QUALITY = 'approve_quality', 'Approve Quality'
    REJECT_QUALITY = 'reject_quality', 'Reject Quality'
    OVERRIDE_QUALITY = 'override_quality', 'Override Quality'
    VIEW_QUALITY = 'view_quality', 'View Quality'
    
    # System Administration
    MANAGE_ROLES = 'manage_roles', 'Manage Roles'
    VIEW_ANALYTICS = 'view_analytics', 'View Analytics'
    MANAGE_SYSTEM = 'manage_system', 'Manage System'
    
    # Collaboration
    ADD_COMMENT = 'add_comment', 'Add Comment'
    VIEW_COMMENTS = 'view_comments', 'View Comments'
    MENTION_USERS = 'mention_users', 'Mention Users'


@dataclass
class RoleDefinition:
    """Definition of a workflow role with its permissions"""
    name: str
    display_name: str
    description: str
    permissions: Set[str]
    inherits_from: Optional[str] = None
    is_system_role: bool = False


# Define role hierarchy and permissions
WORKFLOW_ROLES: Dict[str, RoleDefinition] = {
    WorkflowRole.WORKFLOW_ADMIN: RoleDefinition(
        name=WorkflowRole.WORKFLOW_ADMIN,
        display_name="Workflow Administrator",
        description="Full system access - create/modify templates, manage users, system configuration",
        permissions={
            # All template permissions
            WorkflowPermission.CREATE_TEMPLATE,
            WorkflowPermission.EDIT_TEMPLATE,
            WorkflowPermission.DELETE_TEMPLATE,
            WorkflowPermission.ACTIVATE_TEMPLATE,
            WorkflowPermission.VIEW_TEMPLATE,
            
            # All workflow permissions
            WorkflowPermission.CREATE_WORKFLOW,
            WorkflowPermission.START_WORKFLOW,
            WorkflowPermission.PAUSE_WORKFLOW,
            WorkflowPermission.RESUME_WORKFLOW,
            WorkflowPermission.CANCEL_WORKFLOW,
            WorkflowPermission.DELETE_WORKFLOW,
            WorkflowPermission.VIEW_WORKFLOW,
            WorkflowPermission.ASSIGN_WORKFLOW,
            
            # All step permissions
            WorkflowPermission.EXECUTE_STEP,
            WorkflowPermission.COMPLETE_STEP,
            WorkflowPermission.SKIP_STEP,
            WorkflowPermission.REASSIGN_STEP,
            WorkflowPermission.VIEW_STEP,
            
            # All quality permissions
            WorkflowPermission.APPROVE_QUALITY,
            WorkflowPermission.REJECT_QUALITY,
            WorkflowPermission.OVERRIDE_QUALITY,
            WorkflowPermission.VIEW_QUALITY,
            
            # System permissions
            WorkflowPermission.MANAGE_ROLES,
            WorkflowPermission.VIEW_ANALYTICS,
            WorkflowPermission.MANAGE_SYSTEM,
            
            # Collaboration
            WorkflowPermission.ADD_COMMENT,
            WorkflowPermission.VIEW_COMMENTS,
            WorkflowPermission.MENTION_USERS,
        },
        is_system_role=True
    ),
    
    WorkflowRole.WORKFLOW_MANAGER: RoleDefinition(
        name=WorkflowRole.WORKFLOW_MANAGER,
        display_name="Workflow Manager",
        description="Assign workflows, monitor progress, resolve issues - team leadership role",
        permissions={
            # Template viewing only
            WorkflowPermission.VIEW_TEMPLATE,
            
            # Workflow management
            WorkflowPermission.CREATE_WORKFLOW,
            WorkflowPermission.START_WORKFLOW,
            WorkflowPermission.PAUSE_WORKFLOW,
            WorkflowPermission.RESUME_WORKFLOW,
            WorkflowPermission.CANCEL_WORKFLOW,
            WorkflowPermission.VIEW_WORKFLOW,
            WorkflowPermission.ASSIGN_WORKFLOW,
            
            # Step oversight
            WorkflowPermission.VIEW_STEP,
            WorkflowPermission.REASSIGN_STEP,
            WorkflowPermission.SKIP_STEP,
            
            # Quality oversight
            WorkflowPermission.VIEW_QUALITY,
            WorkflowPermission.OVERRIDE_QUALITY,
            
            # Analytics
            WorkflowPermission.VIEW_ANALYTICS,
            
            # Collaboration
            WorkflowPermission.ADD_COMMENT,
            WorkflowPermission.VIEW_COMMENTS,
            WorkflowPermission.MENTION_USERS,
        }
    ),
    
    WorkflowRole.STEP_OWNER: RoleDefinition(
        name=WorkflowRole.STEP_OWNER,
        display_name="Step Owner",
        description="Execute assigned workflow steps - individual contributor role",
        permissions={
            # Template viewing
            WorkflowPermission.VIEW_TEMPLATE,
            
            # Workflow viewing
            WorkflowPermission.VIEW_WORKFLOW,
            
            # Step execution
            WorkflowPermission.EXECUTE_STEP,
            WorkflowPermission.COMPLETE_STEP,
            WorkflowPermission.VIEW_STEP,
            
            # Quality viewing
            WorkflowPermission.VIEW_QUALITY,
            
            # Collaboration
            WorkflowPermission.ADD_COMMENT,
            WorkflowPermission.VIEW_COMMENTS,
        }
    ),
    
    WorkflowRole.QUALITY_REVIEWER: RoleDefinition(
        name=WorkflowRole.QUALITY_REVIEWER,
        display_name="Quality Reviewer",
        description="Approve quality gates, provide feedback - quality assurance role",
        permissions={
            # Template viewing
            WorkflowPermission.VIEW_TEMPLATE,
            
            # Workflow viewing
            WorkflowPermission.VIEW_WORKFLOW,
            
            # Step viewing
            WorkflowPermission.VIEW_STEP,
            
            # Quality control
            WorkflowPermission.APPROVE_QUALITY,
            WorkflowPermission.REJECT_QUALITY,
            WorkflowPermission.VIEW_QUALITY,
            
            # Collaboration
            WorkflowPermission.ADD_COMMENT,
            WorkflowPermission.VIEW_COMMENTS,
            WorkflowPermission.MENTION_USERS,
        }
    ),
    
    WorkflowRole.OBSERVER: RoleDefinition(
        name=WorkflowRole.OBSERVER,
        display_name="Observer",
        description="View progress, receive notifications - read-only access",
        permissions={
            # Viewing only
            WorkflowPermission.VIEW_TEMPLATE,
            WorkflowPermission.VIEW_WORKFLOW,
            WorkflowPermission.VIEW_STEP,
            WorkflowPermission.VIEW_QUALITY,
            WorkflowPermission.VIEW_COMMENTS,
        }
    )
}


class WorkflowPermissionManager:
    """
    Manages workflow permissions and role-based access control
    """
    
    def __init__(self):
        self.roles = WORKFLOW_ROLES
    
    def get_user_workflow_role(self, user: User, workflow_instance: Optional[WorkflowInstance] = None) -> str:
        """Get user's workflow role for a specific workflow or system-wide"""
        
        # Check if user is superuser
        if user.is_superuser:
            return WorkflowRole.WORKFLOW_ADMIN
        
        # Check workflow-specific role assignments
        if workflow_instance:
            # Check if user is assigned to the workflow
            if workflow_instance.assigned_to == user:
                return WorkflowRole.WORKFLOW_MANAGER
            
            # Check if user is assigned to any steps
            assigned_steps = WorkflowStepInstance.objects.filter(
                workflow_instance=workflow_instance,
                assigned_to=user
            )
            if assigned_steps.exists():
                return WorkflowRole.STEP_OWNER
        
        # Check user's general workflow role (from user model or profile)
        if hasattr(user, 'workflow_role'):
            return getattr(user, 'workflow_role', WorkflowRole.OBSERVER)
        
        # Check user's general role and map to workflow role
        user_role = getattr(user, 'role', 'user')
        role_mapping = {
            'admin': WorkflowRole.WORKFLOW_ADMIN,
            'manager': WorkflowRole.WORKFLOW_MANAGER,
            'attorney': WorkflowRole.QUALITY_REVIEWER,
            'analyst': WorkflowRole.STEP_OWNER,
            'user': WorkflowRole.OBSERVER,
        }
        
        return role_mapping.get(user_role, WorkflowRole.OBSERVER)
    
    def get_user_permissions(self, user: User, workflow_instance: Optional[WorkflowInstance] = None) -> Set[str]:
        """Get all permissions for a user in a specific workflow context"""
        
        role = self.get_user_workflow_role(user, workflow_instance)
        role_def = self.roles.get(role)
        
        if not role_def:
            return set()
        
        permissions = role_def.permissions.copy()
        
        # Add inherited permissions
        if role_def.inherits_from:
            parent_role = self.roles.get(role_def.inherits_from)
            if parent_role:
                permissions.update(parent_role.permissions)
        
        return permissions
    
    def has_permission(
        self, 
        user: User, 
        permission: str, 
        workflow_instance: Optional[WorkflowInstance] = None,
        step_instance: Optional[WorkflowStepInstance] = None
    ) -> bool:
        """Check if user has a specific permission"""
        
        if user.is_superuser:
            return True
        
        user_permissions = self.get_user_permissions(user, workflow_instance)
        
        if permission not in user_permissions:
            return False
        
        # Additional context-specific checks
        if step_instance:
            return self._check_step_specific_permission(user, permission, step_instance)
        
        if workflow_instance:
            return self._check_workflow_specific_permission(user, permission, workflow_instance)
        
        return True
    
    def _check_step_specific_permission(
        self, 
        user: User, 
        permission: str, 
        step_instance: WorkflowStepInstance
    ) -> bool:
        """Check step-specific permission rules"""
        
        # Step owners can only work on their assigned steps
        if permission in [WorkflowPermission.EXECUTE_STEP, WorkflowPermission.COMPLETE_STEP]:
            if step_instance.assigned_to and step_instance.assigned_to != user:
                # Check if user is a manager or admin
                user_role = self.get_user_workflow_role(user, step_instance.workflow_instance)
                return user_role in [WorkflowRole.WORKFLOW_ADMIN, WorkflowRole.WORKFLOW_MANAGER]
        
        return True
    
    def _check_workflow_specific_permission(
        self, 
        user: User, 
        permission: str, 
        workflow_instance: WorkflowInstance
    ) -> bool:
        """Check workflow-specific permission rules"""
        
        # Workflow-specific access control can be implemented here
        # For example, check if user has access to the organization
        if hasattr(workflow_instance, 'organization') and workflow_instance.organization:
            if hasattr(user, 'profile') and hasattr(user.profile, 'organization'):
                if user.profile.organization != workflow_instance.organization:
                    return False
        
        return True
    
    def require_permission(
        self, 
        user: User, 
        permission: str, 
        workflow_instance: Optional[WorkflowInstance] = None,
        step_instance: Optional[WorkflowStepInstance] = None
    ):
        """Require a specific permission or raise PermissionDenied"""
        
        if not self.has_permission(user, permission, workflow_instance, step_instance):
            raise PermissionDenied(
                f"User {user.email} does not have permission '{permission}' "
                f"for {'step ' + str(step_instance.id) if step_instance else ''}"
                f"{'workflow ' + str(workflow_instance.id) if workflow_instance else 'system'}"
            )
    
    def get_accessible_workflows(self, user: User) -> models.QuerySet:
        """Get workflows accessible to the user"""
        
        if user.is_superuser:
            return WorkflowInstance.objects.all()
        
        # Build filter conditions based on user's role and assignments
        conditions = models.Q()
        
        # User's created workflows
        conditions |= models.Q(created_by=user)
        
        # User's assigned workflows
        conditions |= models.Q(assigned_to=user)
        
        # Workflows with steps assigned to user
        conditions |= models.Q(step_instances__assigned_to=user)
        
        # Organization-based access
        if hasattr(user, 'profile') and hasattr(user.profile, 'organization'):
            conditions |= models.Q(organization=user.profile.organization)
        
        return WorkflowInstance.objects.filter(conditions).distinct()
    
    def get_accessible_templates(self, user: User) -> models.QuerySet:
        """Get templates accessible to the user"""
        
        if user.is_superuser:
            return WorkflowTemplate.objects.all()
        
        # All active templates are viewable by default
        # Additional filtering can be added based on organization, role, etc.
        queryset = WorkflowTemplate.objects.filter(is_active=True)
        
        # Organization-based filtering if applicable
        if hasattr(user, 'profile') and hasattr(user.profile, 'organization'):
            queryset = queryset.filter(
                models.Q(organization__isnull=True) |  # Public templates
                models.Q(organization=user.profile.organization)  # Org templates
            )
        
        return queryset
    
    def get_role_permissions(self, role: str) -> Set[str]:
        """Get all permissions for a specific role"""
        
        role_def = self.roles.get(role)
        if not role_def:
            return set()
        
        permissions = role_def.permissions.copy()
        
        # Add inherited permissions
        if role_def.inherits_from:
            parent_permissions = self.get_role_permissions(role_def.inherits_from)
            permissions.update(parent_permissions)
        
        return permissions
    
    def assign_workflow_role(
        self, 
        user: User, 
        role: str, 
        workflow_instance: Optional[WorkflowInstance] = None
    ):
        """Assign a workflow role to a user"""
        
        if role not in self.roles:
            raise ValueError(f"Invalid role: {role}")
        
        # Implementation depends on how roles are stored
        # This could be in user profile, separate model, etc.
        if workflow_instance:
            # Workflow-specific role assignment
            # This would require a WorkflowRoleAssignment model
            pass
        else:
            # System-wide role assignment
            if hasattr(user, 'workflow_role'):
                user.workflow_role = role
                user.save()
        
        logger.info(f"Assigned role {role} to user {user.email}")


# Global permission manager instance
workflow_permission_manager = WorkflowPermissionManager()