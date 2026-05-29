/**
 * useAuth Hook
 * Custom hook for authentication management
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/auth.store';
import { UserRole } from '../types/user.types';

interface UseAuthOptions {
  redirectTo?: string;
  requiredRole?: UserRole | UserRole[];
}

export function useAuth(options?: UseAuthOptions) {
  const router = useRouter();
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    otpRequired,
    login,
    verifyOtp,
    cancelOtp,
    logout,
    checkAuth,
    clearError,
  } = useAuthStore();

  useEffect(() => {
    // Check authentication on mount
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    // Handle authentication redirects
    if (!isLoading && !isAuthenticated && options?.redirectTo) {
      router.push(options.redirectTo);
    }

    // Handle role-based access
    if (user && options?.requiredRole) {
      const requiredRoles = Array.isArray(options.requiredRole) 
        ? options.requiredRole 
        : [options.requiredRole];
      
      if (!requiredRoles.includes(user.role as UserRole)) {
        router.push('/unauthorized');
      }
    }
  }, [isAuthenticated, isLoading, user, options, router]);

  const hasRole = (role: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    const roles = Array.isArray(role) ? role : [role];
    return roles.includes(user.role as UserRole);
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    return user.permissions.includes(permission);
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    otpRequired,
    login,
    verifyOtp,
    cancelOtp,
    logout,
    hasRole,
    hasPermission,
    clearError,
  };
}

/**
 * Hook for requiring authentication
 */
export function useRequireAuth(redirectTo: string = '/login') {
  return useAuth({ redirectTo });
}

/**
 * Hook for requiring specific role
 */
export function useRequireRole(
  role: UserRole | UserRole[],
  redirectTo: string = '/unauthorized'
) {
  return useAuth({ requiredRole: role, redirectTo });
}