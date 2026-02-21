#!/usr/bin/env python
"""
Sync default role permissions to database
This script populates the RolePermission table with default permissions
"""
import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from domains.accounts.models import RolePermission

# Import default permissions from permission_views
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


def sync_permissions():
    """Sync default permissions to database"""
    print("Syncing role permissions to database...")
    print("-" * 80)

    created_count = 0
    updated_count = 0

    for role, permissions in DEFAULT_ROLE_PERMISSIONS.items():
        # Check if role permission already exists
        role_perm, created = RolePermission.objects.update_or_create(
            role=role,
            defaults={
                'permissions': permissions,
                'updated_by': None  # System update
            }
        )

        if created:
            print(f"✓ Created: {role}")
            created_count += 1
        else:
            print(f"✓ Updated: {role}")
            updated_count += 1

        print(f"  Permissions: {len(permissions)} items")
        print()

    print("-" * 80)
    print(f"Successfully synced role permissions!")
    print(f"Created: {created_count}")
    print(f"Updated: {updated_count}")
    print(f"Total roles: {len(DEFAULT_ROLE_PERMISSIONS)}")
    print()
    print("Permission changes will now persist in the database!")


if __name__ == '__main__':
    sync_permissions()
