/**
 * useUserPermissions Hook
 * Manages user permissions for role-based access control
 */

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

// Import default permissions from PermissionMatrix
const DEFAULT_PERMISSIONS: Record<string, string[]> = {
  admin: ['*'], // Admin has all permissions
  manager: [
    'dashboard_access', 'profile_management', 'notifications',
    'projects_view', 'projects_create', 'projects_edit', 'projects_delete', 'projects_assign',
    'patents_view', 'patents_create', 'patents_edit', 'patents_review',
    'prior_art_search', 'infringement_analysis', 'patent_landscape', 'competitive_analysis',
    'analytics_view', 'reports_generate', 'reports_export', 'data_visualization',
    'team_collaboration', 'document_sharing', 'comments_reviews', 'attorney_network',
    'file_upload', 'file_download', 'bulk_operations', 'data_export',
    'user_management', 'role_management', 'audit_logs',
    'help_manage',
    // Sidebar Navigation
    'sidebar_dashboard', 'sidebar_patent_search', 'sidebar_projects', 'sidebar_workflows', 'sidebar_patents', 'sidebar_prior_art',
    'sidebar_infringement', 'sidebar_analytics', 'sidebar_attorney_network',
    'sidebar_collaboration', 'sidebar_admin_panel', 'sidebar_settings', 'sidebar_help',
    'sidebar_web_search', 'sidebar_fcc_data', 'sidebar_sales_package', 'sidebar_technology_areas', 'sidebar_competitors'
  ],
  supervisor: [
    'dashboard_access', 'profile_management', 'notifications',
    'projects_view', 'projects_create', 'projects_edit', 'projects_assign',
    'patents_view', 'patents_create', 'patents_edit', 'patents_review',
    'prior_art_search', 'infringement_analysis', 'patent_landscape',
    'analytics_view', 'reports_generate', 'reports_export',
    'team_collaboration', 'document_sharing', 'comments_reviews',
    'file_upload', 'file_download', 'data_export',
    // Sidebar Navigation
    'sidebar_dashboard', 'sidebar_patent_search', 'sidebar_projects', 'sidebar_workflows', 'sidebar_patents', 'sidebar_prior_art',
    'sidebar_infringement', 'sidebar_analytics', 'sidebar_collaboration', 'sidebar_settings', 'sidebar_help',
    'sidebar_web_search', 'sidebar_fcc_data', 'sidebar_technology_areas', 'sidebar_competitors'
  ],
  lead_attorney: [
    'dashboard_access', 'profile_management', 'notifications',
    'projects_view', 'projects_create', 'projects_edit',
    'patents_view', 'patents_create', 'patents_edit', 'patents_review', 'patents_file',
    'prior_art_search', 'infringement_analysis', 'patent_landscape',
    'analytics_view', 'reports_generate', 'reports_export',
    'team_collaboration', 'document_sharing', 'comments_reviews', 'attorney_network',
    'file_upload', 'file_download', 'data_export',
    // Sidebar Navigation
    'sidebar_dashboard', 'sidebar_patent_search', 'sidebar_projects', 'sidebar_workflows', 'sidebar_patents', 'sidebar_prior_art',
    'sidebar_infringement', 'sidebar_analytics', 'sidebar_attorney_network',
    'sidebar_collaboration', 'sidebar_settings', 'sidebar_help',
    'sidebar_web_search', 'sidebar_sales_package', 'sidebar_technology_areas'
  ],
  attorney: [
    'dashboard_access', 'profile_management', 'notifications',
    'projects_view', 'projects_create', 'projects_edit',
    'patents_view', 'patents_create', 'patents_edit', 'patents_file',
    'prior_art_search', 'infringement_analysis',
    'analytics_view', 'reports_generate',
    'team_collaboration', 'document_sharing', 'comments_reviews', 'attorney_network',
    'file_upload', 'file_download',
    // Sidebar Navigation
    'sidebar_dashboard', 'sidebar_patent_search', 'sidebar_projects', 'sidebar_workflows', 'sidebar_patents', 'sidebar_prior_art',
    'sidebar_attorney_network', 'sidebar_collaboration', 'sidebar_settings', 'sidebar_help',
    'sidebar_web_search'
  ],
  paralegal: [
    'dashboard_access', 'profile_management', 'notifications',
    'projects_view', 'projects_create', 'projects_edit',
    'patents_view', 'patents_create', 'patents_edit',
    'prior_art_search',
    'analytics_view',
    'team_collaboration', 'document_sharing', 'comments_reviews',
    'file_upload', 'file_download',
    // Sidebar Navigation
    'sidebar_dashboard', 'sidebar_patent_search', 'sidebar_projects', 'sidebar_workflows', 'sidebar_patents', 'sidebar_prior_art',
    'sidebar_collaboration', 'sidebar_settings', 'sidebar_help',
    'sidebar_web_search'
  ],
  analyst: [
    'dashboard_access', 'profile_management', 'notifications',
    'projects_view',
    'patents_view',
    'prior_art_search', 'infringement_analysis', 'patent_landscape', 'competitive_analysis',
    'analytics_view', 'reports_generate', 'reports_export', 'data_visualization',
    'team_collaboration', 'document_sharing', 'comments_reviews',
    'file_upload', 'file_download', 'data_export',
    // Sidebar Navigation
    'sidebar_dashboard', 'sidebar_patent_search', 'sidebar_projects', 'sidebar_workflows', 'sidebar_patents', 'sidebar_prior_art',
    'sidebar_infringement', 'sidebar_analytics', 'sidebar_collaboration', 'sidebar_settings', 'sidebar_help',
    'sidebar_web_search', 'sidebar_fcc_data', 'sidebar_technology_areas', 'sidebar_competitors'
  ],
  client: [
    'dashboard_access', 'profile_management', 'notifications',
    'projects_view',
    'patents_view',
    'analytics_view',
    'team_collaboration', 'document_sharing', 'comments_reviews',
    'file_download',
    // Sidebar Navigation
    'sidebar_dashboard', 'sidebar_patent_search', 'sidebar_projects', 'sidebar_patents', 'sidebar_settings', 'sidebar_help'
  ],
  guest: [
    'dashboard_access', 'profile_management',
    'projects_view',
    'patents_view',
    'analytics_view',
    // Sidebar Navigation
    'sidebar_dashboard', 'sidebar_help'
  ]
};

export function useUserPermissions() {
  const { user } = useAuth();
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPermissions = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Try to fetch user-specific permissions from API
        // Check both possible token keys for compatibility
        const token = typeof window !== 'undefined'
          ? (localStorage.getItem('access_token') || localStorage.getItem('patpipes_access_token'))
          : null;

        if (token) {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/accounts/permissions/users/${user.id}/`,
            {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              }
            }
          );

          if (response.ok) {
            const data = await response.json();
            // Use final_permissions which includes custom permissions or role permissions
            setUserPermissions(data.final_permissions || []);
            setLoading(false);
            return;
          }
        }
      } catch (error) {
        console.warn('Failed to fetch user permissions from API, falling back to defaults');
      }

      // Fallback to default role-based permissions
      const rolePermissions = DEFAULT_PERMISSIONS[user.role] || [];
      setUserPermissions(rolePermissions);
      setLoading(false);
    };

    fetchPermissions();
  }, [user]);

  // Check if user has a specific permission
  const hasPermission = (permission: string): boolean => {
    if (!user || !userPermissions) return false;
    
    // Admin has all permissions
    if (userPermissions.includes('*')) return true;
    
    return userPermissions.includes(permission);
  };

  // Check if user has any of the specified permissions
  const hasAnyPermission = (permissions: string[]): boolean => {
    return permissions.some(permission => hasPermission(permission));
  };

  // Check if user has all of the specified permissions
  const hasAllPermissions = (permissions: string[]): boolean => {
    return permissions.every(permission => hasPermission(permission));
  };

  // Get sidebar permissions
  const getSidebarPermissions = (): string[] => {
    return userPermissions.filter(permission => permission.startsWith('sidebar_'));
  };

  return {
    userPermissions,
    loading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    getSidebarPermissions
  };
}