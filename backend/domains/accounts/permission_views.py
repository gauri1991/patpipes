"""
Permission Management API Views
Complete API for managing role-based and user-specific permissions
"""

from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db import transaction
import json

from .models import (
    User, Permission, WorkflowUserPermission, DataConfigurationPermission, RolePermission
)
from .permission_serializers import (
    UserBasicSerializer, RolePermissionMatrixSerializer,
    UserPermissionSerializer, BulkRolePermissionUpdateSerializer,
    UserCustomPermissionUpdateSerializer, PermissionOptionsSerializer,
    WorkflowPermissionSerializer, DataConfigPermissionSerializer
)


# Default permissions configuration (matching frontend)
DEFAULT_ROLE_PERMISSIONS = {
    'admin': ['*'],  # All permissions
    'manager': [
        'dashboard_access', 'profile_management', 'notifications',
        'projects_view', 'projects_create', 'projects_edit', 'projects_delete', 'projects_assign',
        'patents_view', 'patents_create', 'patents_edit', 'patents_review',
        'prior_art_search', 'prior_art_create', 'prior_art_execute', 'prior_art_strategies', 'prior_art_similarity',
        'infringement_analysis', 'infringement_create', 'infringement_claim_charts', 'infringement_risk_assessment',
        'patent_landscape', 'competitive_analysis',
        'analytics_view', 'reports_generate', 'reports_export', 'data_visualization',
        'team_collaboration', 'document_sharing', 'comments_reviews', 'attorney_network',
        'file_upload', 'file_download', 'bulk_operations', 'data_export',
        'user_management', 'role_management', 'audit_logs',
        'prosecution_view', 'prosecution_respond', 'prosecution_deadlines',
        'brainstorming_create', 'brainstorming_participate', 'brainstorming_vote',
        'agentic_ai_manage', 'agentic_ai_analysis', 'agentic_ai_insights',
        # Workflow Management
        'can_create_workflows', 'can_edit_templates', 'can_manage_steps', 'can_assign_workflows',
        'can_view_analytics', 'can_approve_workflows', 'can_cancel_workflows', 'can_configure_quality',
        'can_manage_templates', 'can_view_audit_logs',
        # Data Configuration
        'can_view_mapping_rules', 'can_create_mapping_rules', 'can_edit_mapping_rules', 'can_delete_mapping_rules',
        'can_activate_mapping_rules', 'can_import_export_rules', 'can_view_dataset_mappings', 'can_edit_dataset_mappings',
        'can_approve_mappings', 'can_reject_mappings', 'can_bulk_manage_mappings', 'can_view_dynamic_fields',
        'can_create_dynamic_fields', 'can_edit_dynamic_fields', 'can_delete_dynamic_fields', 'can_migrate_fields',
        'can_archive_fields', 'can_manage_field_types', 'can_view_mapping_analytics', 'can_configure_auto_mapping',
        'can_manage_migration_system', 'can_backup_restore_config',
        # Sidebar Navigation
        'sidebar_dashboard', 'sidebar_projects', 'sidebar_workflows', 'sidebar_patents', 'sidebar_prior_art',
        'sidebar_infringement', 'sidebar_analytics', 'sidebar_attorney_network', 'sidebar_prosecution',
        'sidebar_collaboration', 'sidebar_admin_panel', 'sidebar_settings', 'sidebar_brainstorming', 'sidebar_agentic_ai',
        'sidebar_classifications'
    ],
    'supervisor': [
        'dashboard_access', 'profile_management', 'notifications',
        'projects_view', 'projects_create', 'projects_edit', 'projects_assign',
        'patents_view', 'patents_create', 'patents_edit', 'patents_review',
        'prior_art_search', 'prior_art_create', 'prior_art_execute',
        'infringement_analysis', 'infringement_create',
        'patent_landscape',
        'analytics_view', 'reports_generate', 'reports_export',
        'team_collaboration', 'document_sharing', 'comments_reviews',
        'file_upload', 'file_download', 'data_export',
        'prosecution_view', 'prosecution_respond',
        'brainstorming_participate', 'brainstorming_vote',
        # Workflow Management
        'can_create_workflows', 'can_edit_templates', 'can_manage_steps', 'can_assign_workflows',
        'can_view_analytics', 'can_approve_workflows', 'can_cancel_workflows',
        # Data Configuration (Limited)
        'can_view_mapping_rules', 'can_view_dataset_mappings', 'can_approve_mappings', 'can_reject_mappings',
        'can_view_dynamic_fields', 'can_view_mapping_analytics',
        # Sidebar
        'sidebar_dashboard', 'sidebar_projects', 'sidebar_workflows', 'sidebar_patents', 'sidebar_prior_art',
        'sidebar_infringement', 'sidebar_analytics', 'sidebar_prosecution', 'sidebar_collaboration', 'sidebar_settings',
        'sidebar_classifications'
    ],
    'lead_attorney': [
        'dashboard_access', 'profile_management', 'notifications',
        'projects_view', 'projects_create', 'projects_edit',
        'patents_view', 'patents_create', 'patents_edit', 'patents_review', 'patents_file',
        'prior_art_search', 'prior_art_create', 'prior_art_execute',
        'infringement_analysis', 'infringement_create', 'infringement_claim_charts',
        'patent_landscape',
        'analytics_view', 'reports_generate', 'reports_export',
        'team_collaboration', 'document_sharing', 'comments_reviews', 'attorney_network',
        'file_upload', 'file_download', 'data_export',
        'prosecution_view', 'prosecution_respond', 'prosecution_deadlines',
        'brainstorming_create', 'brainstorming_participate',
        # Workflow Management
        'can_create_workflows', 'can_assign_workflows', 'can_view_analytics', 'can_approve_workflows',
        # Sidebar
        'sidebar_dashboard', 'sidebar_projects', 'sidebar_workflows', 'sidebar_patents', 'sidebar_prior_art',
        'sidebar_infringement', 'sidebar_analytics', 'sidebar_attorney_network', 'sidebar_prosecution',
        'sidebar_collaboration', 'sidebar_settings', 'sidebar_brainstorming', 'sidebar_classifications'
    ],
    'attorney': [
        'dashboard_access', 'profile_management', 'notifications',
        'projects_view', 'projects_create', 'projects_edit',
        'patents_view', 'patents_create', 'patents_edit', 'patents_file',
        'prior_art_search', 'prior_art_create',
        'infringement_analysis',
        'analytics_view', 'reports_generate',
        'team_collaboration', 'document_sharing', 'comments_reviews', 'attorney_network',
        'file_upload', 'file_download',
        'prosecution_view', 'prosecution_respond',
        'brainstorming_participate',
        # Workflow Management
        'can_create_workflows', 'can_view_analytics',
        # Sidebar
        'sidebar_dashboard', 'sidebar_projects', 'sidebar_workflows', 'sidebar_patents', 'sidebar_prior_art',
        'sidebar_attorney_network', 'sidebar_prosecution', 'sidebar_collaboration', 'sidebar_settings'
    ],
    'paralegal': [
        'dashboard_access', 'profile_management', 'notifications',
        'projects_view', 'projects_create', 'projects_edit',
        'patents_view', 'patents_create', 'patents_edit',
        'prior_art_search',
        'analytics_view',
        'team_collaboration', 'document_sharing', 'comments_reviews',
        'file_upload', 'file_download',
        'prosecution_view',
        # Workflow Management
        'can_create_workflows', 'can_view_analytics',
        # Sidebar
        'sidebar_dashboard', 'sidebar_projects', 'sidebar_workflows', 'sidebar_patents', 'sidebar_prior_art',
        'sidebar_collaboration', 'sidebar_settings'
    ],
    'analyst': [
        'dashboard_access', 'profile_management', 'notifications',
        'projects_view',
        'patents_view',
        'prior_art_search', 'prior_art_create', 'prior_art_execute', 'prior_art_strategies', 'prior_art_similarity',
        'infringement_analysis', 'infringement_create', 'infringement_risk_assessment',
        'patent_landscape', 'competitive_analysis',
        'analytics_view', 'reports_generate', 'reports_export', 'data_visualization',
        'team_collaboration', 'document_sharing', 'comments_reviews',
        'file_upload', 'file_download', 'data_export',
        'agentic_ai_analysis', 'agentic_ai_insights',
        # Workflow Management
        'can_view_analytics',
        # Data Configuration (View Only)
        'can_view_mapping_rules', 'can_view_dataset_mappings', 'can_view_dynamic_fields', 'can_view_mapping_analytics',
        # Sidebar
        'sidebar_dashboard', 'sidebar_projects', 'sidebar_workflows', 'sidebar_patents', 'sidebar_prior_art',
        'sidebar_infringement', 'sidebar_analytics', 'sidebar_collaboration', 'sidebar_settings', 'sidebar_agentic_ai',
        'sidebar_classifications'
    ],
    'client': [
        'dashboard_access', 'profile_management', 'notifications',
        'projects_view',
        'patents_view',
        'analytics_view',
        'team_collaboration', 'document_sharing', 'comments_reviews',
        'file_download',
        # Sidebar
        'sidebar_dashboard', 'sidebar_projects', 'sidebar_patents', 'sidebar_settings'
    ],
    'guest': [
        'dashboard_access', 'profile_management',
        'projects_view',
        'patents_view',
        'analytics_view',
        # Sidebar
        'sidebar_dashboard'
    ]
}


class RolePermissionMatrixView(APIView):
    """
    GET: Retrieve the complete role-based permission matrix
    PUT: Update the role-based permission matrix (admin only)
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """Get the current role permission matrix from database"""
        matrix = []

        # Get all roles from database
        role_permissions = RolePermission.objects.all()

        if role_permissions.exists():
            # Use database values
            for role_perm in role_permissions:
                matrix.append({
                    'role': role_perm.role,
                    'permissions': role_perm.permissions
                })
        else:
            # Fallback to defaults if database is empty
            for role, perms in DEFAULT_ROLE_PERMISSIONS.items():
                matrix.append({
                    'role': role,
                    'permissions': perms
                })

        return Response({
            'matrix': matrix,
            'roles': [item['role'] for item in matrix]
        }, status=status.HTTP_200_OK)

    @transaction.atomic
    def put(self, request):
        """Update role permissions (admin only)"""
        if request.user.role not in ['admin', 'manager']:
            return Response(
                {'error': 'Only administrators can update role permissions'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = BulkRolePermissionUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        updated_permissions = serializer.validated_data['permissions']

        # Save to database and create audit log entries
        for role, perms in updated_permissions.items():
            # Update or create role permission in database
            role_perm, created = RolePermission.objects.update_or_create(
                role=role,
                defaults={
                    'permissions': perms,
                    'updated_by': request.user
                }
            )

            # Create audit log
            create_audit_log(
                request=request,
                action='role_permission_update',
                description=f"{'Created' if created else 'Updated'} permissions for role '{role}'",
                changes={'role': role, 'permissions': perms},
                target_role=role
            )

        return Response({
            'message': 'Role permissions updated successfully',
            'updated_roles': list(updated_permissions.keys())
        }, status=status.HTTP_200_OK)


class UserListView(APIView):
    """Get list of all users for permission management"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """Get all users with basic info"""
        if request.user.role not in ['admin', 'manager', 'supervisor']:
            return Response(
                {'error': 'Insufficient permissions'},
                status=status.HTTP_403_FORBIDDEN
            )

        users = User.objects.filter(
            organization=request.user.organization
        ).select_related('organization').order_by('first_name', 'last_name')

        serializer = UserBasicSerializer(users, many=True)

        return Response({
            'users': serializer.data,
            'total': users.count()
        }, status=status.HTTP_200_OK)


class UserPermissionView(APIView):
    """
    GET: Retrieve specific user's permissions
    PUT: Update specific user's custom permissions
    DELETE: Remove custom permissions (revert to role defaults)
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, user_id):
        """Get complete permissions for a specific user"""
        if request.user.role not in ['admin', 'manager', 'supervisor']:
            if str(request.user.id) != str(user_id):
                return Response(
                    {'error': 'Can only view your own permissions'},
                    status=status.HTTP_403_FORBIDDEN
                )

        user = get_object_or_404(User, id=user_id)

        # Get role-based permissions from database (fallback to defaults)
        try:
            role_perm = RolePermission.objects.get(role=user.role)
            role_permissions = role_perm.permissions
        except RolePermission.DoesNotExist:
            role_permissions = DEFAULT_ROLE_PERMISSIONS.get(user.role, [])

        # Get custom permissions (stored in database)
        custom_perms = list(Permission.objects.filter(user=user).values_list('resource', flat=True))

        # Get workflow permissions
        workflow_perms = None
        try:
            workflow_perm_obj = WorkflowUserPermission.objects.get(user=user)
            workflow_perms = WorkflowPermissionSerializer(workflow_perm_obj).data
        except WorkflowUserPermission.DoesNotExist:
            pass

        # Get data config permissions
        data_config_perms = None
        try:
            data_config_obj = DataConfigurationPermission.objects.get(user=user)
            data_config_perms = DataConfigPermissionSerializer(data_config_obj).data
        except DataConfigurationPermission.DoesNotExist:
            pass

        # Calculate final permissions
        if custom_perms:
            final_permissions = custom_perms
            added = list(set(custom_perms) - set(role_permissions)) if role_permissions != ['*'] else []
            removed = list(set(role_permissions) - set(custom_perms)) if role_permissions != ['*'] else []
        else:
            final_permissions = role_permissions
            added = []
            removed = []

        return Response({
            'user_id': str(user.id),
            'email': user.email,
            'role': user.role,
            'role_permissions': role_permissions,
            'custom_permissions': custom_perms,
            'final_permissions': final_permissions,
            'added_permissions': added,
            'removed_permissions': removed,
            'workflow_permissions': workflow_perms,
            'data_config_permissions': data_config_perms
        }, status=status.HTTP_200_OK)

    @transaction.atomic
    def put(self, request, user_id):
        """Update user's custom permissions"""
        if request.user.role not in ['admin', 'manager']:
            return Response(
                {'error': 'Only administrators can update user permissions'},
                status=status.HTTP_403_FORBIDDEN
            )

        user = get_object_or_404(User, id=user_id)
        serializer = UserCustomPermissionUpdateSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        validated_data = serializer.validated_data

        # Check if this is a new permission assignment (before making changes)
        is_new = not Permission.objects.filter(user=user).exists()

        # Update custom permissions
        if 'permissions' in validated_data:
            # Clear existing custom permissions
            Permission.objects.filter(user=user).delete()

            # Create new custom permissions
            permissions_to_create = []
            for perm in validated_data['permissions']:
                permissions_to_create.append(
                    Permission(
                        user=user,
                        resource=perm,
                        action='access',
                        scope='all'
                    )
                )
            if permissions_to_create:
                Permission.objects.bulk_create(permissions_to_create)

        # Update workflow permissions
        if 'workflow_permissions' in validated_data:
            workflow_perm, created = WorkflowUserPermission.objects.get_or_create(user=user)
            for field, value in validated_data['workflow_permissions'].items():
                setattr(workflow_perm, field, value)
            if 'workflow_role' in validated_data and validated_data['workflow_role']:
                workflow_perm.workflow_role = validated_data['workflow_role']
            workflow_perm.save()

        # Update data config permissions
        if 'data_config_permissions' in validated_data:
            data_config_perm, created = DataConfigurationPermission.objects.get_or_create(user=user)
            for field, value in validated_data['data_config_permissions'].items():
                setattr(data_config_perm, field, value)
            data_config_perm.save()

        # Create audit log
        action = 'user_permission_create' if is_new else 'user_permission_update'
        create_audit_log(
            request=request,
            action=action,
            description=f"{'Created' if is_new else 'Updated'} custom permissions for {user.email}",
            changes=validated_data,
            target_user=user
        )

        # Return updated permissions
        return self.get(request, user_id)

    def delete(self, request, user_id):
        """Remove custom permissions (revert to role defaults)"""
        if request.user.role not in ['admin', 'manager']:
            return Response(
                {'error': 'Only administrators can delete user permissions'},
                status=status.HTTP_403_FORBIDDEN
            )

        user = get_object_or_404(User, id=user_id)

        # Get current permissions before deletion for audit log
        old_permissions = list(Permission.objects.filter(user=user).values_list('resource', flat=True))

        # Delete all custom permissions
        Permission.objects.filter(user=user).delete()

        # Create audit log
        create_audit_log(
            request=request,
            action='user_permission_delete',
            description=f"Removed custom permissions for {user.email}",
            changes={'removed_permissions': old_permissions},
            target_user=user
        )

        return Response({
            'message': f'Custom permissions removed for {user.email}. User now has role-based permissions only.'
        }, status=status.HTTP_200_OK)


class PermissionOptionsView(APIView):
    """Get available permission options for UI"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """Return all available permissions organized by category"""
        categories = [
            {
                'id': 'core',
                'label': 'Core Features',
                'features': [
                    {'id': 'dashboard_access', 'label': 'Dashboard Access', 'description': 'Access to main dashboard'},
                    {'id': 'profile_management', 'label': 'Profile Management', 'description': 'Edit own profile and settings'},
                    {'id': 'notifications', 'label': 'Notifications', 'description': 'Receive system notifications'},
                ]
            },
            {
                'id': 'projects',
                'label': 'Project Management',
                'features': [
                    {'id': 'projects_view', 'label': 'View Projects', 'description': 'View project listings'},
                    {'id': 'projects_create', 'label': 'Create Projects', 'description': 'Create new projects'},
                    {'id': 'projects_edit', 'label': 'Edit Projects', 'description': 'Modify existing projects'},
                    {'id': 'projects_delete', 'label': 'Delete Projects', 'description': 'Delete projects'},
                    {'id': 'projects_assign', 'label': 'Assign Projects', 'description': 'Assign projects to users'},
                ]
            },
            {
                'id': 'patents',
                'label': 'Patent Management',
                'features': [
                    {'id': 'patents_view', 'label': 'View Patents', 'description': 'View patent documents'},
                    {'id': 'patents_create', 'label': 'Create Patents', 'description': 'Create new patent applications'},
                    {'id': 'patents_edit', 'label': 'Edit Patents', 'description': 'Modify patent documents'},
                    {'id': 'patents_delete', 'label': 'Delete Patents', 'description': 'Delete patent documents'},
                    {'id': 'patents_review', 'label': 'Review Patents', 'description': 'Review and approve patents'},
                    {'id': 'patents_file', 'label': 'File Patents', 'description': 'File patent applications'},
                ]
            },
            {
                'id': 'prior_art',
                'label': 'Prior Art Search',
                'features': [
                    {'id': 'prior_art_search', 'label': 'Basic Search', 'description': 'Conduct prior art searches'},
                    {'id': 'prior_art_create', 'label': 'Create Searches', 'description': 'Create new search strategies'},
                    {'id': 'prior_art_execute', 'label': 'Execute Searches', 'description': 'Run advanced search queries'},
                    {'id': 'prior_art_strategies', 'label': 'Manage Strategies', 'description': 'Manage search strategies'},
                    {'id': 'prior_art_similarity', 'label': 'Similarity Analysis', 'description': 'Patent similarity analysis'},
                ]
            },
            {
                'id': 'infringement',
                'label': 'Infringement Analysis',
                'features': [
                    {'id': 'infringement_analysis', 'label': 'Basic Analysis', 'description': 'Perform infringement analysis'},
                    {'id': 'infringement_create', 'label': 'Create Analysis', 'description': 'Create new infringement analysis'},
                    {'id': 'infringement_claim_charts', 'label': 'Claim Charts', 'description': 'Generate claim charts'},
                    {'id': 'infringement_risk_assessment', 'label': 'Risk Assessment', 'description': 'Conduct risk assessment'},
                ]
            },
            {
                'id': 'prosecution',
                'label': 'Prosecution Management',
                'features': [
                    {'id': 'prosecution_view', 'label': 'View Office Actions', 'description': 'View office actions and responses'},
                    {'id': 'prosecution_respond', 'label': 'Respond to Office Actions', 'description': 'Draft and submit responses'},
                    {'id': 'prosecution_deadlines', 'label': 'Manage Deadlines', 'description': 'Track and manage prosecution deadlines'},
                ]
            },
            {
                'id': 'research',
                'label': 'Research & Analysis',
                'features': [
                    {'id': 'patent_landscape', 'label': 'Patent Landscape', 'description': 'Generate landscape reports'},
                    {'id': 'competitive_analysis', 'label': 'Competitive Analysis', 'description': 'Analyze competitor patents'},
                ]
            },
            {
                'id': 'analytics',
                'label': 'Analytics & Reports',
                'features': [
                    {'id': 'analytics_view', 'label': 'View Analytics', 'description': 'Access analytics dashboard'},
                    {'id': 'reports_generate', 'label': 'Generate Reports', 'description': 'Create custom reports'},
                    {'id': 'reports_export', 'label': 'Export Reports', 'description': 'Export reports to various formats'},
                    {'id': 'data_visualization', 'label': 'Data Visualization', 'description': 'Access advanced charts'},
                ]
            },
            {
                'id': 'collaboration',
                'label': 'Collaboration',
                'features': [
                    {'id': 'team_collaboration', 'label': 'Team Collaboration', 'description': 'Collaborate with team members'},
                    {'id': 'document_sharing', 'label': 'Document Sharing', 'description': 'Share documents with others'},
                    {'id': 'comments_reviews', 'label': 'Comments & Reviews', 'description': 'Add comments and reviews'},
                    {'id': 'attorney_network', 'label': 'Attorney Network', 'description': 'Access attorney directory'},
                ]
            },
            {
                'id': 'data',
                'label': 'Data Management',
                'features': [
                    {'id': 'file_upload', 'label': 'File Upload', 'description': 'Upload documents and files'},
                    {'id': 'file_download', 'label': 'File Download', 'description': 'Download files and documents'},
                    {'id': 'bulk_operations', 'label': 'Bulk Operations', 'description': 'Perform bulk data operations'},
                    {'id': 'data_export', 'label': 'Data Export', 'description': 'Export system data'},
                    {'id': 'data_import', 'label': 'Data Import', 'description': 'Import external data'},
                ]
            },
            {
                'id': 'administration',
                'label': 'System Administration',
                'features': [
                    {'id': 'user_management', 'label': 'User Management', 'description': 'Manage user accounts'},
                    {'id': 'role_management', 'label': 'Role Management', 'description': 'Manage user roles'},
                    {'id': 'permission_management', 'label': 'Permission Management', 'description': 'Configure permissions'},
                    {'id': 'system_settings', 'label': 'System Settings', 'description': 'Configure system settings'},
                    {'id': 'audit_logs', 'label': 'Audit Logs', 'description': 'View system audit logs'},
                    {'id': 'backup_restore', 'label': 'Backup & Restore', 'description': 'System backup operations'},
                ]
            },
            {
                'id': 'integration',
                'label': 'Integrations & API',
                'features': [
                    {'id': 'api_access', 'label': 'API Access', 'description': 'Access to REST API'},
                    {'id': 'webhook_management', 'label': 'Webhook Management', 'description': 'Configure webhooks'},
                    {'id': 'third_party_integrations', 'label': 'Third-party Integrations', 'description': 'Manage integrations'},
                    {'id': 'developer_tools', 'label': 'Developer Tools', 'description': 'Access developer features'},
                ]
            },
            {
                'id': 'brainstorming',
                'label': 'Brainstorming',
                'features': [
                    {'id': 'brainstorming_create', 'label': 'Create Sessions', 'description': 'Create brainstorming sessions'},
                    {'id': 'brainstorming_participate', 'label': 'Participate', 'description': 'Join and contribute to sessions'},
                    {'id': 'brainstorming_vote', 'label': 'Vote on Ideas', 'description': 'Vote and rank ideas'},
                ]
            },
            {
                'id': 'agentic_ai',
                'label': 'Agentic AI',
                'features': [
                    {'id': 'agentic_ai_manage', 'label': 'Manage AI Agents', 'description': 'Configure AI agents'},
                    {'id': 'agentic_ai_analysis', 'label': 'AI Analysis', 'description': 'Run AI-powered analysis'},
                    {'id': 'agentic_ai_insights', 'label': 'AI Insights', 'description': 'View AI-generated insights'},
                ]
            },
            {
                'id': 'workflows',
                'label': 'Workflow Management',
                'features': [
                    {'id': 'can_create_workflows', 'label': 'Create Workflows', 'description': 'Create new workflow instances'},
                    {'id': 'can_edit_templates', 'label': 'Edit Templates', 'description': 'Modify workflow templates'},
                    {'id': 'can_manage_steps', 'label': 'Manage Steps', 'description': 'Add, edit, delete workflow steps'},
                    {'id': 'can_assign_workflows', 'label': 'Assign Workflows', 'description': 'Assign workflows to users'},
                    {'id': 'can_view_analytics', 'label': 'View Analytics', 'description': 'Access workflow analytics and reports'},
                    {'id': 'can_approve_workflows', 'label': 'Approve Workflows', 'description': 'Approve workflow completion'},
                    {'id': 'can_cancel_workflows', 'label': 'Cancel Workflows', 'description': 'Cancel running workflows'},
                    {'id': 'can_configure_quality', 'label': 'Configure Quality', 'description': 'Set up quality control rules'},
                    {'id': 'can_manage_templates', 'label': 'Manage Templates', 'description': 'Create and modify workflow templates'},
                    {'id': 'can_view_audit_logs', 'label': 'View Audit Logs', 'description': 'Access workflow audit trails'},
                ]
            },
            {
                'id': 'data_configuration',
                'label': 'Data Configuration',
                'features': [
                    {'id': 'can_view_mapping_rules', 'label': 'View Mapping Rules', 'description': 'View column mapping rules'},
                    {'id': 'can_create_mapping_rules', 'label': 'Create Mapping Rules', 'description': 'Create new column mapping rules'},
                    {'id': 'can_edit_mapping_rules', 'label': 'Edit Mapping Rules', 'description': 'Modify existing mapping rules'},
                    {'id': 'can_delete_mapping_rules', 'label': 'Delete Mapping Rules', 'description': 'Delete mapping rules'},
                    {'id': 'can_activate_mapping_rules', 'label': 'Activate/Deactivate Rules', 'description': 'Change rule activation status'},
                    {'id': 'can_import_export_rules', 'label': 'Import/Export Rules', 'description': 'Import and export mapping rules'},
                    {'id': 'can_view_dataset_mappings', 'label': 'View Dataset Mappings', 'description': 'View dataset column mappings'},
                    {'id': 'can_edit_dataset_mappings', 'label': 'Edit Dataset Mappings', 'description': 'Modify dataset mappings'},
                    {'id': 'can_approve_mappings', 'label': 'Approve Mappings', 'description': 'Approve mapping suggestions'},
                    {'id': 'can_reject_mappings', 'label': 'Reject Mappings', 'description': 'Reject mapping suggestions'},
                    {'id': 'can_bulk_manage_mappings', 'label': 'Bulk Manage Mappings', 'description': 'Perform bulk operations on mappings'},
                    {'id': 'can_view_dynamic_fields', 'label': 'View Dynamic Fields', 'description': 'View dynamic fields registry'},
                    {'id': 'can_create_dynamic_fields', 'label': 'Create Dynamic Fields', 'description': 'Create new dynamic fields'},
                    {'id': 'can_edit_dynamic_fields', 'label': 'Edit Dynamic Fields', 'description': 'Modify dynamic fields'},
                    {'id': 'can_delete_dynamic_fields', 'label': 'Delete Dynamic Fields', 'description': 'Delete dynamic fields'},
                    {'id': 'can_migrate_fields', 'label': 'Migrate Fields', 'description': 'Apply database migrations for fields'},
                    {'id': 'can_archive_fields', 'label': 'Archive Fields', 'description': 'Archive unused dynamic fields'},
                    {'id': 'can_manage_field_types', 'label': 'Manage Field Types', 'description': 'Configure field type settings'},
                    {'id': 'can_view_mapping_analytics', 'label': 'View Mapping Analytics', 'description': 'Access mapping performance analytics'},
                    {'id': 'can_configure_auto_mapping', 'label': 'Configure Auto-mapping', 'description': 'Set up automatic mapping rules'},
                    {'id': 'can_manage_migration_system', 'label': 'Manage Migration System', 'description': 'Control database migration system'},
                    {'id': 'can_backup_restore_config', 'label': 'Backup/Restore Config', 'description': 'Backup and restore configurations'},
                ]
            },
            {
                'id': 'sidebar_navigation',
                'label': 'Sidebar Navigation',
                'features': [
                    {'id': 'sidebar_dashboard', 'label': 'Dashboard', 'description': 'Show Dashboard in sidebar'},
                    {'id': 'sidebar_projects', 'label': 'Projects', 'description': 'Show Projects in sidebar'},
                    {'id': 'sidebar_workflows', 'label': 'Workflows', 'description': 'Show Workflows in sidebar'},
                    {'id': 'sidebar_patents', 'label': 'Patents', 'description': 'Show Patents in sidebar'},
                    {'id': 'sidebar_prior_art', 'label': 'Prior Art Search', 'description': 'Show Prior Art Search in sidebar'},
                    {'id': 'sidebar_infringement', 'label': 'Infringement Analysis', 'description': 'Show Infringement Analysis in sidebar'},
                    {'id': 'sidebar_analytics', 'label': 'Analytics', 'description': 'Show Analytics in sidebar'},
                    {'id': 'sidebar_classifications', 'label': 'Classifications', 'description': 'Show Classifications browser in sidebar'},
                    {'id': 'sidebar_attorney_network', 'label': 'Attorney Network', 'description': 'Show Attorney Network in sidebar'},
                    {'id': 'sidebar_prosecution', 'label': 'Prosecution', 'description': 'Show Prosecution in sidebar'},
                    {'id': 'sidebar_collaboration', 'label': 'Collaboration', 'description': 'Show Collaboration tools in sidebar'},
                    {'id': 'sidebar_admin_panel', 'label': 'Admin Panel', 'description': 'Show Admin Panel in sidebar (admin/manager only)'},
                    {'id': 'sidebar_settings', 'label': 'Settings', 'description': 'Show Settings in sidebar'},
                    {'id': 'sidebar_brainstorming', 'label': 'Brainstorming', 'description': 'Show Brainstorming in sidebar'},
                    {'id': 'sidebar_agentic_ai', 'label': 'Agentic AI', 'description': 'Show Agentic AI in sidebar'},
                ]
            }
        ]

        return Response({
            'categories': categories,
            'total_features': sum(len(cat['features']) for cat in categories)
        }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def check_permission(request, permission_name):
    """Check if current user has a specific permission"""
    user = request.user

    # Get user's role permissions from database (fallback to defaults)
    try:
        role_perm = RolePermission.objects.get(role=user.role)
        role_permissions = role_perm.permissions
    except RolePermission.DoesNotExist:
        role_permissions = DEFAULT_ROLE_PERMISSIONS.get(user.role, [])

    # Check if admin (has all permissions)
    if '*' in role_permissions:
        has_permission = True
    else:
        # Check custom permissions
        custom_perms = list(Permission.objects.filter(user=user).values_list('resource', flat=True))
        all_permissions = custom_perms if custom_perms else role_permissions
        has_permission = permission_name in all_permissions

    return Response({
        'has_permission': has_permission,
        'permission': permission_name,
        'user_role': user.role
    }, status=status.HTTP_200_OK)


# Audit Log Helper Functions

def create_audit_log(request, action, description, changes, target_user=None, target_role=None):
    """Helper function to create audit log entries"""
    from .models import PermissionAuditLog

    # Extract IP and user agent from request
    ip_address = request.META.get('REMOTE_ADDR')
    user_agent = request.META.get('HTTP_USER_AGENT', '')

    PermissionAuditLog.objects.create(
        actor=request.user,
        action=action,
        target_user=target_user,
        target_role=target_role,
        description=description,
        changes=changes,
        ip_address=ip_address,
        user_agent=user_agent
    )


class PermissionAuditLogView(APIView):
    """
    GET: List permission audit logs with filtering
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """Get audit logs with optional filtering"""
        from .models import PermissionAuditLog
        from .permission_serializers import PermissionAuditLogSerializer

        # Only allow admin and manager to view audit logs
        if request.user.role not in ['admin', 'manager']:
            return Response(
                {'error': 'Only administrators can view audit logs'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Get query parameters
        limit = int(request.query_params.get('limit', 100))
        offset = int(request.query_params.get('offset', 0))
        action = request.query_params.get('action')
        target_user_id = request.query_params.get('target_user')
        actor_id = request.query_params.get('actor')

        # Build query
        queryset = PermissionAuditLog.objects.select_related('actor', 'target_user').all()

        if action:
            queryset = queryset.filter(action=action)
        if target_user_id:
            queryset = queryset.filter(target_user_id=target_user_id)
        if actor_id:
            queryset = queryset.filter(actor_id=actor_id)

        # Get total count before pagination
        total_count = queryset.count()

        # Apply pagination
        logs = queryset[offset:offset + limit]

        # Serialize
        serializer = PermissionAuditLogSerializer(logs, many=True)

        return Response({
            'logs': serializer.data,
            'total': total_count,
            'limit': limit,
            'offset': offset,
            'has_more': total_count > (offset + limit)
        }, status=status.HTTP_200_OK)
