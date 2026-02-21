"""
Permission Management Serializers
Serializers for role-based and user-specific permission management
"""

from rest_framework import serializers
from .models import (
    User, Permission, WorkflowUserPermission, DataConfigurationPermission
)


class UserBasicSerializer(serializers.ModelSerializer):
    """Basic user info for permission management"""

    full_name = serializers.ReadOnlyField()

    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'full_name', 'role', 'status']
        read_only_fields = ['id', 'email', 'full_name']


class WorkflowPermissionSerializer(serializers.ModelSerializer):
    """Serializer for workflow permissions"""

    class Meta:
        model = WorkflowUserPermission
        fields = [
            'workflow_role',
            # Template Permissions
            'can_create_templates', 'can_edit_templates', 'can_delete_templates',
            'can_activate_templates', 'can_view_templates',
            # Workflow Instance Permissions
            'can_create_workflows', 'can_start_workflows', 'can_pause_workflows',
            'can_resume_workflows', 'can_cancel_workflows', 'can_delete_workflows',
            'can_assign_workflows', 'can_view_workflows',
            # Step Management Permissions
            'can_execute_steps', 'can_complete_steps', 'can_skip_steps',
            'can_reassign_steps', 'can_view_steps',
            # Quality Control Permissions
            'can_approve_quality', 'can_reject_quality', 'can_override_quality',
            'can_view_quality',
            # System Permissions
            'can_manage_roles', 'can_view_analytics', 'can_manage_system',
            # Collaboration Permissions
            'can_add_comments', 'can_view_comments', 'can_mention_users'
        ]


class DataConfigPermissionSerializer(serializers.ModelSerializer):
    """Serializer for data configuration permissions"""

    class Meta:
        model = DataConfigurationPermission
        fields = [
            # Column Mapping Rules
            'can_view_mapping_rules', 'can_create_mapping_rules', 'can_edit_mapping_rules',
            'can_delete_mapping_rules', 'can_activate_mapping_rules', 'can_import_export_rules',
            # Dataset Mappings
            'can_view_dataset_mappings', 'can_edit_dataset_mappings', 'can_approve_mappings',
            'can_reject_mappings', 'can_bulk_manage_mappings',
            # Dynamic Fields
            'can_view_dynamic_fields', 'can_create_dynamic_fields', 'can_edit_dynamic_fields',
            'can_delete_dynamic_fields', 'can_migrate_fields', 'can_archive_fields',
            # System-level
            'can_manage_field_types', 'can_view_mapping_analytics', 'can_configure_auto_mapping',
            'can_manage_migration_system', 'can_backup_restore_config'
        ]


class CustomPermissionSerializer(serializers.ModelSerializer):
    """Serializer for custom resource-action-scope permissions"""

    class Meta:
        model = Permission
        fields = ['id', 'resource', 'action', 'scope', 'created_at']
        read_only_fields = ['id', 'created_at']


class RolePermissionMatrixSerializer(serializers.Serializer):
    """Serializer for the complete role-based permission matrix"""

    role = serializers.CharField()
    permissions = serializers.ListField(
        child=serializers.CharField(),
        help_text="List of permission IDs granted to this role"
    )


class UserPermissionSerializer(serializers.Serializer):
    """Serializer for complete user permissions (role-based + custom)"""

    user_id = serializers.UUIDField()
    role = serializers.CharField(read_only=True)
    role_permissions = serializers.ListField(
        child=serializers.CharField(),
        read_only=True,
        help_text="Permissions inherited from role"
    )
    custom_permissions = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        help_text="Custom permissions (added or removed from role defaults)"
    )
    final_permissions = serializers.ListField(
        child=serializers.CharField(),
        read_only=True,
        help_text="Final computed permissions for this user"
    )
    added_permissions = serializers.ListField(
        child=serializers.CharField(),
        read_only=True,
        help_text="Permissions added beyond role defaults"
    )
    removed_permissions = serializers.ListField(
        child=serializers.CharField(),
        read_only=True,
        help_text="Role permissions that were removed"
    )
    workflow_permissions = WorkflowPermissionSerializer(required=False)
    data_config_permissions = DataConfigPermissionSerializer(required=False)


class BulkRolePermissionUpdateSerializer(serializers.Serializer):
    """Serializer for bulk updating role-based permissions"""

    permissions = serializers.DictField(
        child=serializers.ListField(child=serializers.CharField()),
        help_text="Dictionary mapping role names to their permission lists"
    )


class UserCustomPermissionUpdateSerializer(serializers.Serializer):
    """Serializer for updating a specific user's custom permissions"""

    permissions = serializers.ListField(
        child=serializers.CharField(),
        help_text="Complete list of permissions for this user"
    )
    workflow_role = serializers.CharField(required=False, allow_null=True)
    workflow_permissions = serializers.DictField(
        child=serializers.BooleanField(),
        required=False,
        help_text="Workflow-specific permission overrides"
    )
    data_config_permissions = serializers.DictField(
        child=serializers.BooleanField(),
        required=False,
        help_text="Data configuration permission overrides"
    )


class PermissionAuditLogSerializer(serializers.Serializer):
    """Serializer for permission change audit logs"""

    timestamp = serializers.DateTimeField(read_only=True)
    user = UserBasicSerializer(read_only=True)
    target_user = UserBasicSerializer(read_only=True)
    action = serializers.CharField(read_only=True)
    permission = serializers.CharField(read_only=True)
    changes = serializers.JSONField(read_only=True)


class PermissionOptionsSerializer(serializers.Serializer):
    """Serializer for available permission options"""

    category = serializers.CharField()
    category_label = serializers.CharField()
    features = serializers.ListField(
        child=serializers.DictField()
    )


class PermissionAuditLogSerializer(serializers.Serializer):
    """Serializer for permission audit logs"""

    id = serializers.UUIDField(read_only=True)
    actor = UserBasicSerializer(read_only=True)
    action = serializers.CharField(read_only=True)
    target_user = UserBasicSerializer(read_only=True, allow_null=True)
    target_role = serializers.CharField(read_only=True, allow_null=True)
    description = serializers.CharField(read_only=True)
    changes = serializers.JSONField(read_only=True)
    ip_address = serializers.IPAddressField(read_only=True, allow_null=True)
    user_agent = serializers.CharField(read_only=True, allow_null=True)
    created_at = serializers.DateTimeField(read_only=True)
