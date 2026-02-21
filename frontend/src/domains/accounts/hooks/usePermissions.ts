/**
 * Permissions Hook
 * Role-based permission checking for UI elements
 */

import { useAuth } from './useAuth';

export interface Permission {
  action: string;
  resource: string;
  conditions?: Record<string, any>;
}

export const ROLES = {
  VIEWER: 'viewer',
  PARALEGAL: 'paralegal',
  ATTORNEY: 'attorney',
  LEAD_ATTORNEY: 'lead_attorney',
  ADMIN: 'admin',
  SUPERVISOR: 'supervisor',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

export const ROLE_HIERARCHY: Record<Role, number> = {
  [ROLES.VIEWER]: 1,
  [ROLES.PARALEGAL]: 2,
  [ROLES.ATTORNEY]: 3,
  [ROLES.LEAD_ATTORNEY]: 4,
  [ROLES.SUPERVISOR]: 5,
  [ROLES.ADMIN]: 6,
};

export const PROJECT_PERMISSIONS = {
  CREATE_PROJECT: 'create_project',
  VIEW_PROJECT: 'view_project',
  EDIT_PROJECT: 'edit_project',
  DELETE_PROJECT: 'delete_project',
  MANAGE_PROJECT_MEMBERS: 'manage_project_members',
  MANAGE_PROJECT_TASKS: 'manage_project_tasks',
  MANAGE_PROJECT_FILES: 'manage_project_files',
  APPROVE_PROJECT: 'approve_project',
  ARCHIVE_PROJECT: 'archive_project',
} as const;

export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  [ROLES.VIEWER]: [
    PROJECT_PERMISSIONS.VIEW_PROJECT,
  ],
  [ROLES.PARALEGAL]: [
    PROJECT_PERMISSIONS.VIEW_PROJECT,
    PROJECT_PERMISSIONS.CREATE_PROJECT,
    PROJECT_PERMISSIONS.EDIT_PROJECT,
    PROJECT_PERMISSIONS.MANAGE_PROJECT_TASKS,
    PROJECT_PERMISSIONS.MANAGE_PROJECT_FILES,
  ],
  [ROLES.ATTORNEY]: [
    PROJECT_PERMISSIONS.VIEW_PROJECT,
    PROJECT_PERMISSIONS.CREATE_PROJECT,
    PROJECT_PERMISSIONS.EDIT_PROJECT,
    PROJECT_PERMISSIONS.DELETE_PROJECT,
    PROJECT_PERMISSIONS.MANAGE_PROJECT_MEMBERS,
    PROJECT_PERMISSIONS.MANAGE_PROJECT_TASKS,
    PROJECT_PERMISSIONS.MANAGE_PROJECT_FILES,
    PROJECT_PERMISSIONS.APPROVE_PROJECT,
  ],
  [ROLES.LEAD_ATTORNEY]: [
    PROJECT_PERMISSIONS.VIEW_PROJECT,
    PROJECT_PERMISSIONS.CREATE_PROJECT,
    PROJECT_PERMISSIONS.EDIT_PROJECT,
    PROJECT_PERMISSIONS.DELETE_PROJECT,
    PROJECT_PERMISSIONS.MANAGE_PROJECT_MEMBERS,
    PROJECT_PERMISSIONS.MANAGE_PROJECT_TASKS,
    PROJECT_PERMISSIONS.MANAGE_PROJECT_FILES,
    PROJECT_PERMISSIONS.APPROVE_PROJECT,
    PROJECT_PERMISSIONS.ARCHIVE_PROJECT,
  ],
  [ROLES.SUPERVISOR]: [
    ...Object.values(PROJECT_PERMISSIONS),
  ],
  [ROLES.ADMIN]: [
    ...Object.values(PROJECT_PERMISSIONS),
  ],
};

export function usePermissions() {
  const { user } = useAuth();

  const hasRole = (role: Role): boolean => {
    if (!user?.role) return false;
    const userRoleLevel = ROLE_HIERARCHY[user.role as Role] || 0;
    const requiredRoleLevel = ROLE_HIERARCHY[role] || 0;
    return userRoleLevel >= requiredRoleLevel;
  };

  const hasPermission = (permission: string): boolean => {
    if (!user?.role) return false;
    const userRole = user.role as Role;
    return ROLE_PERMISSIONS[userRole]?.includes(permission) || false;
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    return permissions.some(permission => hasPermission(permission));
  };

  const hasAllPermissions = (permissions: string[]): boolean => {
    return permissions.every(permission => hasPermission(permission));
  };

  const canCreateProject = (): boolean => {
    return hasPermission(PROJECT_PERMISSIONS.CREATE_PROJECT);
  };

  const canEditProject = (projectOwnerId?: string): boolean => {
    if (!hasPermission(PROJECT_PERMISSIONS.EDIT_PROJECT)) return false;
    
    // If user is admin/supervisor, they can edit any project
    if (hasRole(ROLES.SUPERVISOR)) return true;
    
    // If no owner specified, use basic permission
    if (!projectOwnerId) return true;
    
    // User can edit their own projects or if they're lead attorney
    return user?.id === projectOwnerId || hasRole(ROLES.LEAD_ATTORNEY);
  };

  const canDeleteProject = (projectOwnerId?: string): boolean => {
    if (!hasPermission(PROJECT_PERMISSIONS.DELETE_PROJECT)) return false;
    
    // Only supervisors and admins can delete, or project owners who are attorneys+
    if (hasRole(ROLES.SUPERVISOR)) return true;
    
    return user?.id === projectOwnerId && hasRole(ROLES.ATTORNEY);
  };

  const canManageProjectMembers = (): boolean => {
    return hasPermission(PROJECT_PERMISSIONS.MANAGE_PROJECT_MEMBERS);
  };

  const canApproveProject = (): boolean => {
    return hasPermission(PROJECT_PERMISSIONS.APPROVE_PROJECT);
  };

  const getAccessibleProjectTypes = (projectTypes: any[]): any[] => {
    if (!user?.role) return [];
    
    const userRole = user.role as Role;
    const userRoleLevel = ROLE_HIERARCHY[userRole] || 0;
    
    return projectTypes.filter(type => {
      // Use the transformed field name and make sure it's active
      if (!type.isActive) return false;
      const requiredRoleLevel = ROLE_HIERARCHY[type.minRoleLevel as Role] || 1;
      return userRoleLevel >= requiredRoleLevel;
    });
  };

  return {
    user,
    hasRole,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canCreateProject,
    canEditProject,
    canDeleteProject,
    canManageProjectMembers,
    canApproveProject,
    getAccessibleProjectTypes,
  };
}