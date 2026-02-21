/**
 * Permission Caching Layer
 * Improves performance by caching permission data with automatic invalidation
 */

import * as permissionsApi from './permissions';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresIn: number; // milliseconds
}

class PermissionCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Get cached data or fetch from API
   */
  private async getOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = this.DEFAULT_TTL
  ): Promise<T> {
    const cached = this.cache.get(key);

    if (cached && Date.now() - cached.timestamp < cached.expiresIn) {
      return cached.data as T;
    }

    const data = await fetcher();
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresIn: ttl,
    });

    return data;
  }

  /**
   * Invalidate specific cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidate all cache entries
   */
  invalidateAll(): void {
    this.cache.clear();
  }

  /**
   * Invalidate all cache entries matching a pattern
   */
  invalidatePattern(pattern: RegExp): void {
    const keysToDelete: string[] = [];
    this.cache.forEach((_, key) => {
      if (pattern.test(key)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Get role permission matrix (cached)
   */
  async getRolePermissionMatrix(ttl?: number) {
    return this.getOrFetch(
      'role-permission-matrix',
      () => permissionsApi.getRolePermissionMatrix(),
      ttl
    );
  }

  /**
   * Update role permissions and invalidate cache
   */
  async updateRolePermissions(permissions: Record<string, string[]>) {
    const result = await permissionsApi.updateRolePermissions(permissions);
    this.invalidate('role-permission-matrix');
    this.invalidatePattern(/^user-permissions-/); // Invalidate all user permission caches
    return result;
  }

  /**
   * Get users list (cached)
   */
  async getUsersList(ttl?: number) {
    return this.getOrFetch(
      'users-list',
      () => permissionsApi.getUsersList(),
      ttl
    );
  }

  /**
   * Get user permissions (cached)
   */
  async getUserPermissions(userId: string, ttl?: number) {
    return this.getOrFetch(
      `user-permissions-${userId}`,
      () => permissionsApi.getUserPermissions(userId),
      ttl
    );
  }

  /**
   * Update user permissions and invalidate cache
   */
  async updateUserPermissions(
    userId: string,
    permissions: string[],
    workflowPermissions?: Record<string, boolean>,
    dataConfigPermissions?: Record<string, boolean>
  ) {
    const result = await permissionsApi.updateUserPermissions(
      userId,
      permissions,
      workflowPermissions,
      dataConfigPermissions
    );
    this.invalidate(`user-permissions-${userId}`);
    this.invalidate('users-list'); // Refresh users list
    return result;
  }

  /**
   * Delete user permissions and invalidate cache
   */
  async deleteUserPermissions(userId: string) {
    const result = await permissionsApi.deleteUserPermissions(userId);
    this.invalidate(`user-permissions-${userId}`);
    this.invalidate('users-list'); // Refresh users list
    return result;
  }

  /**
   * Get permission options (cached)
   */
  async getPermissionOptions(ttl?: number) {
    return this.getOrFetch(
      'permission-options',
      () => permissionsApi.getPermissionOptions(),
      ttl
    );
  }

  /**
   * Check permission (cached for 1 minute)
   */
  async checkPermission(permissionName: string) {
    return this.getOrFetch(
      `check-permission-${permissionName}`,
      () => permissionsApi.checkPermission(permissionName),
      60 * 1000 // 1 minute TTL for permission checks
    );
  }

  /**
   * Get audit logs (not cached - always fetch fresh data)
   */
  async getAuditLogs(params?: {
    limit?: number;
    offset?: number;
    action?: string;
    target_user?: string;
    actor?: string;
  }) {
    return permissionsApi.getAuditLogs(params);
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    const now = Date.now();
    const stats = {
      totalEntries: this.cache.size,
      validEntries: 0,
      expiredEntries: 0,
      entries: [] as Array<{ key: string; age: number; expired: boolean }>,
    };

    this.cache.forEach((entry, key) => {
      const age = now - entry.timestamp;
      const expired = age >= entry.expiresIn;

      if (expired) {
        stats.expiredEntries++;
      } else {
        stats.validEntries++;
      }

      stats.entries.push({ key, age, expired });
    });

    return stats;
  }

  /**
   * Clean up expired entries
   */
  cleanupExpired(): number {
    const now = Date.now();
    let cleaned = 0;

    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp >= entry.expiresIn) {
        this.cache.delete(key);
        cleaned++;
      }
    });

    return cleaned;
  }
}

// Export singleton instance
export const permissionCache = new PermissionCache();

// Export for direct use
export default permissionCache;
