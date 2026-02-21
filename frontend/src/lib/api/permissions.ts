/**
 * Permissions API Service
 * Handles all permission-related API calls with JWT authentication
 */

import { TOKEN_STORAGE_KEYS } from './config';

const API_BASE = 'http://localhost:8000/api/v1/accounts/permissions';

/**
 * Get authorization headers with JWT token
 */
const getAuthHeaders = (): HeadersInit => {
  // Ensure we're in the browser before accessing localStorage
  // Try both token keys for compatibility
  const token = typeof window !== 'undefined'
    ? (localStorage.getItem('access_token') || localStorage.getItem(TOKEN_STORAGE_KEYS.accessToken))
    : null;

  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

/**
 * Handle API errors
 */
const handleError = (error: any, fallbackMessage: string): never => {
  if (error.response?.data?.error) {
    throw new Error(error.response.data.error);
  }
  if (error.message) {
    throw new Error(error.message);
  }
  throw new Error(fallbackMessage);
};

/**
 * Get role permission matrix
 */
export const getRolePermissionMatrix = async () => {
  try {
    const response = await fetch(`${API_BASE}/roles/matrix/`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to load permissions');
    }

    return await response.json();
  } catch (error) {
    handleError(error, 'Failed to load permissions');
  }
};

/**
 * Update role permissions
 */
export const updateRolePermissions = async (permissions: Record<string, string[]>) => {
  try {
    const response = await fetch(`${API_BASE}/roles/matrix/`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ permissions }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to save permissions');
    }

    return await response.json();
  } catch (error) {
    handleError(error, 'Failed to save permissions');
  }
};

/**
 * Get list of all users
 */
export const getUsersList = async () => {
  try {
    const response = await fetch(`${API_BASE}/users/list/`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to load users');
    }

    return await response.json();
  } catch (error) {
    handleError(error, 'Failed to load users');
  }
};

/**
 * Get user permissions
 */
export const getUserPermissions = async (userId: string) => {
  try {
    const response = await fetch(`${API_BASE}/users/${userId}/`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to load user permissions');
    }

    return await response.json();
  } catch (error) {
    handleError(error, 'Failed to load user permissions');
  }
};

/**
 * Update user permissions
 */
export const updateUserPermissions = async (
  userId: string,
  permissions: string[],
  workflowPermissions?: Record<string, boolean>,
  dataConfigPermissions?: Record<string, boolean>
) => {
  try {
    const response = await fetch(`${API_BASE}/users/${userId}/`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        permissions,
        ...(workflowPermissions && { workflow_permissions: workflowPermissions }),
        ...(dataConfigPermissions && { data_config_permissions: dataConfigPermissions }),
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to save user permissions');
    }

    return await response.json();
  } catch (error) {
    handleError(error, 'Failed to save user permissions');
  }
};

/**
 * Delete user custom permissions
 */
export const deleteUserPermissions = async (userId: string) => {
  try {
    const response = await fetch(`${API_BASE}/users/${userId}/`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to remove user permissions');
    }

    return await response.json();
  } catch (error) {
    handleError(error, 'Failed to remove user permissions');
  }
};

/**
 * Get available permission options
 */
export const getPermissionOptions = async () => {
  try {
    const response = await fetch(`${API_BASE}/options/`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to load permission options');
    }

    return await response.json();
  } catch (error) {
    handleError(error, 'Failed to load permission options');
  }
};

/**
 * Check if user has a specific permission
 */
export const checkPermission = async (permissionName: string) => {
  try {
    const response = await fetch(`${API_BASE}/check/${permissionName}/`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to check permission');
    }

    return await response.json();
  } catch (error) {
    handleError(error, 'Failed to check permission');
  }
};

/**
 * Get permission audit logs
 */
export const getAuditLogs = async (params?: {
  limit?: number;
  offset?: number;
  action?: string;
  target_user?: string;
  actor?: string;
}) => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.offset) queryParams.set('offset', params.offset.toString());
    if (params?.action) queryParams.set('action', params.action);
    if (params?.target_user) queryParams.set('target_user', params.target_user);
    if (params?.actor) queryParams.set('actor', params.actor);

    const url = `${API_BASE}/audit-logs/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to load audit logs');
    }

    return await response.json();
  } catch (error) {
    handleError(error, 'Failed to load audit logs');
  }
};
