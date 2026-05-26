/**
 * useDataConfiguration Hook
 * Custom hook for managing data configuration API calls
 */

import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface ApiResponse<T> {
  data?: T;
  error?: string;
  loading: boolean;
}

export interface MappingRule {
  id: string;
  target_field: string;
  column_patterns: string[];
  field_type: string;
  field_params: Record<string, any>;
  confidence_level: string;
  is_core_field: boolean;
  is_active: boolean;
  usage_count: number;
  success_rate: number;
  created_by: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  created_at: string;
  updated_at: string;
}

export interface DatasetMapping {
  id: string;
  dataset: string;
  dataset_name: string;
  source_column: string;
  target_field: string;
  confidence_score: number;
  status: 'pending' | 'confirmed' | 'rejected' | 'auto_applied';
  sample_values: string[];
  records_processed: number;
  processing_errors: number;
  reviewed_by: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  reviewed_at: string | null;
  admin_notes: string;
  created_at: string;
  updated_at: string;
}

export interface DynamicField {
  id: string;
  field_name: string;
  field_type: string;
  field_params: Record<string, any>;
  display_name: string;
  description: string;
  total_records: number;
  is_active: boolean;
  migration_applied: boolean;
  migration_name: string | null;
  datasets_using: string[];
  created_by: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  created_at: string;
  updated_at: string;
}

export interface DataConfigOverview {
  mapping_rules: {
    total: number;
    active: number;
    inactive: number;
  };
  dataset_mappings: {
    total: number;
    confirmed: number;
    pending: number;
    rejected: number;
  };
  dynamic_fields: {
    total: number;
    migrated: number;
    pending_migration: number;
  };
  recent_activity: {
    new_mappings: number;
    new_fields: number;
  };
}

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/analytics/api/admin/data-configuration`;

export function useDataConfiguration() {
  // API Base URL
  const apiUrl = (endpoint: string) => `${API_BASE}${endpoint}`;

  // Generic API call function
  const apiCall = async <T>(endpoint: string, options?: RequestInit): Promise<T> => {
    try {
      // Get access token from localStorage (same as auth service)
      const accessToken = localStorage.getItem('access_token');
      const fullUrl = apiUrl(endpoint);
      
      console.log('API call:', options?.method || 'GET', fullUrl);
      
      const response = await fetch(fullUrl, {
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
          ...options?.headers,
        },
        ...options,
      });

      if (!response.ok) {
        console.error(`API Error for ${fullUrl}:`, response.status, response.statusText);
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      // Handle empty responses (like DELETE operations)
      const text = await response.text();
      if (!text) {
        return {} as T;
      }
      
      return JSON.parse(text);
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  };

  // Mapping Rules API
  const mappingRules = {
    list: async (params?: { 
      search?: string; 
      status?: string; 
      field_type?: string; 
    }): Promise<MappingRule[]> => {
      const queryParams = new URLSearchParams();
      if (params?.search) queryParams.append('search', params.search);
      if (params?.status) queryParams.append('status', params.status);
      if (params?.field_type) queryParams.append('field_type', params.field_type);
      
      const endpoint = queryParams.toString() ? `/mapping-rules/?${queryParams}` : '/mapping-rules/';
      return apiCall<MappingRule[]>(endpoint);
    },

    create: async (data: Partial<MappingRule>): Promise<MappingRule> => {
      return apiCall<MappingRule>('/mapping-rules/', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    update: async (id: string, data: Partial<MappingRule>): Promise<MappingRule> => {
      return apiCall<MappingRule>(`/mapping-rules/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },

    delete: async (id: string): Promise<void> => {
      return apiCall<void>(`/mapping-rules/${id}/`, {
        method: 'DELETE',
      });
    },

    bulkActivate: async (ruleIds: string[], activate: boolean): Promise<{ success: boolean; updated_count: number }> => {
      return apiCall<{ success: boolean; updated_count: number }>('/mapping-rules/bulk_activate/', {
        method: 'POST',
        body: JSON.stringify({
          rule_ids: ruleIds,
          activate: activate,
        }),
      });
    },

    analytics: async (): Promise<{
      total_rules: number;
      active_rules: number;
      average_success_rate: number;
      field_type_distribution: Array<{ field_type: string; count: number }>;
      core_vs_non_core: { core_fields: number; non_core_fields: number };
    }> => {
      return apiCall('/mapping-rules/analytics/');
    },
  };

  // Dataset Mappings API
  const datasetMappings = {
    list: async (params?: {
      search?: string;
      status?: string;
      dataset_id?: string;
      project_id?: string;
      min_confidence?: number;
    }): Promise<DatasetMapping[]> => {
      const queryParams = new URLSearchParams();
      if (params?.search) queryParams.append('search', params.search);
      if (params?.status) queryParams.append('status', params.status);
      if (params?.dataset_id) queryParams.append('dataset_id', params.dataset_id);
      if (params?.project_id) queryParams.append('project_id', params.project_id);
      if (params?.min_confidence) queryParams.append('min_confidence', params.min_confidence.toString());
      
      const endpoint = queryParams.toString() ? `/dataset-mappings/?${queryParams}` : '/dataset-mappings/';
      return apiCall<DatasetMapping[]>(endpoint);
    },

    approve: async (id: string, notes?: string): Promise<{ success: boolean; message: string }> => {
      return apiCall<{ success: boolean; message: string }>(`/dataset-mappings/${id}/approve_mapping/`, {
        method: 'POST',
        body: JSON.stringify({ notes: notes || '' }),
      });
    },

    reject: async (id: string, notes?: string): Promise<{ success: boolean; message: string }> => {
      return apiCall<{ success: boolean; message: string }>(`/dataset-mappings/${id}/reject_mapping/`, {
        method: 'POST',
        body: JSON.stringify({ notes: notes || '' }),
      });
    },

    bulkManage: async (mappingIds: string[], action: 'approve' | 'reject', notes?: string): Promise<{
      success: boolean;
      updated_count: number;
    }> => {
      return apiCall<{ success: boolean; updated_count: number }>('/dataset-mappings/bulk_manage/', {
        method: 'POST',
        body: JSON.stringify({
          mapping_ids: mappingIds,
          action: action,
          notes: notes || '',
        }),
      });
    },

    pendingReview: async (): Promise<{
      total_pending: number;
      by_confidence: {
        high: number;
        medium: number;
        low: number;
      };
    }> => {
      return apiCall('/dataset-mappings/pending_review/');
    },
  };

  // Dynamic Fields API
  const dynamicFields = {
    list: async (params?: {
      search?: string;
      status?: string;
      field_type?: string;
    }): Promise<DynamicField[]> => {
      const queryParams = new URLSearchParams();
      if (params?.search) queryParams.append('search', params.search);
      if (params?.status) queryParams.append('status', params.status);
      if (params?.field_type) queryParams.append('field_type', params.field_type);
      
      const endpoint = queryParams.toString() ? `/dynamic-fields/?${queryParams}` : '/dynamic-fields/';
      return apiCall<DynamicField[]>(endpoint);
    },

    create: async (data: Partial<DynamicField>): Promise<DynamicField> => {
      return apiCall<DynamicField>('/dynamic-fields/', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    update: async (id: string, data: Partial<DynamicField>): Promise<DynamicField> => {
      return apiCall<DynamicField>(`/dynamic-fields/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },

    delete: async (id: string): Promise<void> => {
      return apiCall<void>(`/dynamic-fields/${id}/`, {
        method: 'DELETE',
      });
    },

    migrate: async (id: string): Promise<{ success: boolean; message: string; migration_name?: string }> => {
      return apiCall<{ success: boolean; message: string; migration_name?: string }>(
        `/dynamic-fields/${id}/migrate_field/`,
        { method: 'POST' }
      );
    },

    archive: async (id: string): Promise<{ success: boolean; message: string }> => {
      return apiCall<{ success: boolean; message: string }>(
        `/dynamic-fields/${id}/archive_field/`,
        { method: 'POST' }
      );
    },

    bulkMigrate: async (): Promise<{
      success: boolean;
      message: string;
      fields_migrated: number;
      migration_name?: string;
    }> => {
      return apiCall<{
        success: boolean;
        message: string;
        fields_migrated: number;
        migration_name?: string;
      }>('/dynamic-fields/bulk_migrate/', {
        method: 'POST',
      });
    },

    migrationStatus: async (): Promise<{
      total_fields: number;
      migrated_fields: number;
      pending_fields: number;
      migration_complete: boolean;
    }> => {
      return apiCall('/dynamic-fields/migration_status/');
    },
  };

  // Analytics API
  const analytics = {
    overview: async (): Promise<DataConfigOverview> => {
      return apiCall<DataConfigOverview>('/analytics/overview/');
    },
  };

  // Error handling wrapper
  const withErrorHandling = <T extends (...args: any[]) => Promise<any>>(fn: T): T => {
    return (async (...args: any[]) => {
      try {
        return await fn(...args);
      } catch (error) {
        console.error('Data configuration API error:', error);
        toast.error('Operation failed. Please try again.');
        throw error;
      }
    }) as T;
  };

  return {
    mappingRules: {
      list: withErrorHandling(mappingRules.list),
      create: withErrorHandling(mappingRules.create),
      update: withErrorHandling(mappingRules.update),
      delete: withErrorHandling(mappingRules.delete),
      bulkActivate: withErrorHandling(mappingRules.bulkActivate),
      analytics: withErrorHandling(mappingRules.analytics),
    },
    datasetMappings: {
      list: withErrorHandling(datasetMappings.list),
      approve: withErrorHandling(datasetMappings.approve),
      reject: withErrorHandling(datasetMappings.reject),
      bulkManage: withErrorHandling(datasetMappings.bulkManage),
      pendingReview: withErrorHandling(datasetMappings.pendingReview),
    },
    dynamicFields: {
      list: withErrorHandling(dynamicFields.list),
      create: withErrorHandling(dynamicFields.create),
      update: withErrorHandling(dynamicFields.update),
      delete: withErrorHandling(dynamicFields.delete),
      migrate: withErrorHandling(dynamicFields.migrate),
      archive: withErrorHandling(dynamicFields.archive),
      bulkMigrate: withErrorHandling(dynamicFields.bulkMigrate),
      migrationStatus: withErrorHandling(dynamicFields.migrationStatus),
    },
    analytics: {
      overview: withErrorHandling(analytics.overview),
    },
  };
}

// Hook for using data configuration with state management
export function useDataConfigurationState() {
  const api = useDataConfiguration();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const withLoading = async <T>(operation: () => Promise<T>): Promise<T | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await operation();
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    api,
    loading,
    error,
    withLoading,
  };
}