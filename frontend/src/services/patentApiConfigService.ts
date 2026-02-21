/**
 * Patent API Configuration Service
 * Manages patent API configurations, field mappings, and query templates
 */

import { ApiResponse, ApiClient } from './apiClient';
import { PatentAPIConfig } from '@/domains/admin/components/PatentAPIPanel';

// Extended PatentAPI interface that includes both hardcoded and admin-configured APIs
export interface PatentAPI {
  id: string;
  name: string;
  display_name: string;
  description: string;
  is_active: boolean;
  is_configured: boolean; // false for hardcoded APIs without admin config
  source_type: 'hardcoded' | 'admin_configured';
  base_url?: string;
  auth_type?: string;
  rate_limit?: {
    requests_per_minute: number;
    requests_per_day: number;
  };
  last_tested?: string | null;
  test_status?: 'never' | 'passed' | 'failed';
}

// Query field mapping interface
export interface QueryFieldMapping {
  standard_field: string;
  api_field: string;
  field_type: 'text' | 'array' | 'date' | 'number';
  is_required: boolean;
  query_template?: string;
}

// Response field mapping interface
export interface ResponseFieldMapping {
  api_field: string;
  standard_field: string;
  field_type: 'text' | 'array' | 'date' | 'number';
  transformation_rule?: string;
}

class PatentApiConfigService {
  // Get all available patent APIs (both hardcoded and admin-configured)
  async getAvailableAPIs(): Promise<ApiResponse<PatentAPI[]>> {
    try {
      const response = await ApiClient.get<PatentAPI[]>('/analytics/api/research/patent-apis/');

      if (response.success && response.data) {
        return response;
      }
      
      // Fallback to hardcoded APIs if backend not available
      return {
        success: true,
        data: this.getHardcodedAPIs(),
      };
    } catch (error) {
      // Return hardcoded APIs as fallback
      return {
        success: true,
        data: this.getHardcodedAPIs(),
      };
    }
  }

  // Get hardcoded APIs (existing functionality preserved)
  private getHardcodedAPIs(): PatentAPI[] {
    return [
      {
        id: 'uspto-hardcoded',
        name: 'uspto',
        display_name: 'USPTO (Default)',
        description: 'United States Patent and Trademark Office - Built-in',
        is_active: true,
        is_configured: false,
        source_type: 'hardcoded',
        test_status: 'passed',
      },
      {
        id: 'uspto_odp-hardcoded',
        name: 'uspto_odp',
        display_name: 'USPTO Open Data Portal',
        description: 'USPTO ODP — US patent applications filed 2001+ with prosecution data',
        is_active: true,
        is_configured: false,
        source_type: 'hardcoded',
        test_status: 'never',
      },
      {
        id: 'epo-hardcoded',
        name: 'epo',
        display_name: 'EPO (Default)',
        description: 'European Patent Office - Built-in',
        is_active: true,
        is_configured: false,
        source_type: 'hardcoded',
        test_status: 'never',
      },
      {
        id: 'wipo-hardcoded',
        name: 'wipo',
        display_name: 'WIPO (Default)',
        description: 'World Intellectual Property Organization - Built-in',
        is_active: true,
        is_configured: false,
        source_type: 'hardcoded',
        test_status: 'never',
      },
      {
        id: 'lens-hardcoded',
        name: 'lens',
        display_name: 'Lens (Default)',
        description: 'The Lens Patent Database - Built-in',
        is_active: false,
        is_configured: false,
        source_type: 'hardcoded',
        test_status: 'never',
      },
      {
        id: 'google_patents-hardcoded',
        name: 'google_patents',
        display_name: 'Google Patents (Default)',
        description: 'Google Patents Database - Built-in',
        is_active: false,
        is_configured: false,
        source_type: 'hardcoded',
        test_status: 'never',
      },
    ];
  }

  // Get specific API configuration
  async getAPIConfiguration(apiId: string): Promise<ApiResponse<PatentAPIConfig>> {
    try {
      const response = await ApiClient.get<PatentAPIConfig>(`/analytics/api/research/patent-apis/${apiId}/`);
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch API configuration',
      };
    }
  }

  // Create new API configuration
  async createAPIConfiguration(config: Omit<PatentAPIConfig, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<PatentAPIConfig>> {
    try {
      const response = await ApiClient.post<PatentAPIConfig>('/analytics/api/research/patent-apis/', config);
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create API configuration',
      };
    }
  }

  // Update API configuration
  async updateAPIConfiguration(apiId: string, config: Partial<PatentAPIConfig>): Promise<ApiResponse<PatentAPIConfig>> {
    try {
      const response = await ApiClient.put<PatentAPIConfig>(`/analytics/api/research/patent-apis/${apiId}/`, config);
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update API configuration',
      };
    }
  }

  // Delete API configuration
  async deleteAPIConfiguration(apiId: string): Promise<ApiResponse<void>> {
    try {
      const response = await ApiClient.delete<void>(`/analytics/api/research/patent-apis/${apiId}/`);
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete API configuration',
      };
    }
  }

  // Test API connection
  async testAPIConnection(apiId: string): Promise<ApiResponse<{ status: 'passed' | 'failed'; message: string }>> {
    try {
      const response = await ApiClient.post<{ status: 'passed' | 'failed'; message: string }>(`/analytics/api/research/patent-apis/${apiId}/test/`);
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to test API connection',
      };
    }
  }

  // Get query field mappings for an API
  async getQueryFieldMappings(apiId: string): Promise<ApiResponse<QueryFieldMapping[]>> {
    try {
      const response = await ApiClient.get<QueryFieldMapping[]>(`/analytics/api/research/patent-apis/${apiId}/query-mappings/`);
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch query field mappings',
      };
    }
  }

  // Update query field mappings
  async updateQueryFieldMappings(apiId: string, mappings: QueryFieldMapping[]): Promise<ApiResponse<QueryFieldMapping[]>> {
    try {
      const response = await ApiClient.put<QueryFieldMapping[]>(`/analytics/api/research/patent-apis/${apiId}/query-mappings/`, { mappings });
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update query field mappings',
      };
    }
  }

  // Get response field mappings for an API
  async getResponseFieldMappings(apiId: string): Promise<ApiResponse<ResponseFieldMapping[]>> {
    try {
      const response = await ApiClient.get<ResponseFieldMapping[]>(`/analytics/api/research/patent-apis/${apiId}/response-mappings/`);
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch response field mappings',
      };
    }
  }

  // Update response field mappings
  async updateResponseFieldMappings(apiId: string, mappings: ResponseFieldMapping[]): Promise<ApiResponse<ResponseFieldMapping[]>> {
    try {
      const response = await ApiClient.put<ResponseFieldMapping[]>(`/analytics/api/research/patent-apis/${apiId}/response-mappings/`, { mappings });
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update response field mappings',
      };
    }
  }

  // Validate API configuration
  async validateConfiguration(config: PatentAPIConfig): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    if (!config.name || config.name.trim().length === 0) {
      errors.push('API name is required');
    }

    if (!config.display_name || config.display_name.trim().length === 0) {
      errors.push('Display name is required');
    }

    if (!config.base_url || config.base_url.trim().length === 0) {
      errors.push('Base URL is required');
    } else {
      try {
        new URL(config.base_url);
      } catch {
        errors.push('Base URL must be a valid URL');
      }
    }

    if (config.rate_limit.requests_per_minute <= 0) {
      errors.push('Requests per minute must be greater than 0');
    }

    if (config.rate_limit.requests_per_day <= 0) {
      errors.push('Requests per day must be greater than 0');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Get standard fields that should be supported by all APIs
  getStandardFields() {
    return [
      { key: 'title', label: 'Patent Title', type: 'text' as const, required: true },
      { key: 'abstract', label: 'Abstract', type: 'text' as const, required: false },
      { key: 'inventors', label: 'Inventors', type: 'array' as const, required: false },
      { key: 'assignees', label: 'Assignees', type: 'array' as const, required: false },
      { key: 'publication_number', label: 'Publication Number', type: 'text' as const, required: true },
      { key: 'application_number', label: 'Application Number', type: 'text' as const, required: false },
      { key: 'publication_date', label: 'Publication Date', type: 'date' as const, required: false },
      { key: 'application_date', label: 'Application Date', type: 'date' as const, required: false },
      { key: 'priority_date', label: 'Priority Date', type: 'date' as const, required: false },
      { key: 'ipc_classes', label: 'IPC Classifications', type: 'array' as const, required: false },
      { key: 'cpc_classes', label: 'CPC Classifications', type: 'array' as const, required: false },
      { key: 'jurisdiction', label: 'Jurisdiction', type: 'text' as const, required: false },
      { key: 'keywords', label: 'Keywords', type: 'text' as const, required: false },
    ];
  }
}

export const patentApiConfigService = new PatentApiConfigService();
export default patentApiConfigService;