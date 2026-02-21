/**
 * Research API Service
 * Handles all patent research-related API calls
 */

import { ApiResponse, ApiClient } from './apiClient';
import { PatentAPI } from './patentApiConfigService';

export interface ResearchQuery {
  id: string;
  project: string;
  query_name: string;
  description: string;
  api_source: 'uspto' | 'epo' | 'wipo' | 'lens' | 'google_patents';
  keywords: string;
  ipc_classes: string[];
  cpc_classes: string[];
  assignees: string[];
  inventors: string[];
  date_range: {
    from_date?: string;
    to_date?: string;
  };
  geographic_scope: string[];
  additional_filters: Record<string, any>;
  status: 'draft' | 'running' | 'completed' | 'failed' | 'cancelled';
  total_results: number;
  processed_results: number;
  execution_time: number | null;
  error_message: string;
  retry_count: number;
  last_executed_at: string | null;
  created_by: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  created_at: string;
  updated_at: string;
  results_count: number;
  selected_results_count: number;
}

export interface ResearchResult {
  id: string;
  query: string;
  patent_id: string;
  publication_number: string;
  application_number: string;
  title: string;
  abstract: string;
  assignee: string;
  inventors: string[];
  ipc_classes: string[];
  cpc_classes: string[];
  publication_date: string | null;
  application_date: string | null;
  priority_date: string | null;
  jurisdiction: string;
  relevance_score: number | null;
  manual_relevance: 'high' | 'medium' | 'low' | 'not_relevant' | '';
  is_selected: boolean;
  processed_at: string;
}

export interface ResearchSession {
  id: string;
  project: string;
  name: string;
  description: string;
  total_queries: number;
  total_results: number;
  unique_patents: number;
  session_start: string;
  session_end: string | null;
  created_by: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  queries: ResearchQuery[];
}

export interface CreateQueryData {
  project: string;
  query_name: string;
  description?: string;
  api_source: string;
  keywords: string;
  ipc_classes?: string[];
  cpc_classes?: string[];
  assignees?: string[];
  inventors?: string[];
  date_range?: {
    from_date?: string;
    to_date?: string;
  };
  geographic_scope?: string[];
  additional_filters?: Record<string, any>;
}

export interface ResearchAnalytics {
  project_id: string;
  total_queries: number;
  total_results: number;
  unique_patents: number;
  selected_patents: number;
  api_usage: Record<string, number>;
  top_assignees: Array<{
    assignee: string;
    count: number;
  }>;
  top_inventors: Array<{
    inventor: string;
    count: number;
  }>;
  ipc_distribution: Record<string, number>;
  cpc_distribution: Record<string, number>;
  publication_timeline: Record<string, number>;
  avg_execution_time: number;
  success_rate: number;
}


class ResearchApiService extends ApiClient {
  // Research Queries
  async getQueries(projectId: string): Promise<ApiResponse<ResearchQuery[]>> {
    return this.fetchWithAuth<ResearchQuery[]>(`/analytics/api/research/queries/?project_id=${projectId}`);
  }

  async createQuery(data: CreateQueryData): Promise<ApiResponse<ResearchQuery>> {
    return this.fetchWithAuth<ResearchQuery>('/analytics/api/research/queries/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateQuery(id: string, data: Partial<CreateQueryData>): Promise<ApiResponse<ResearchQuery>> {
    return this.fetchWithAuth<ResearchQuery>(`/analytics/api/research/queries/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteQuery(id: string): Promise<ApiResponse<void>> {
    return this.fetchWithAuth<void>(`/analytics/api/research/queries/${id}/`, {
      method: 'DELETE',
    });
  }

  async executeQuery(id: string): Promise<ApiResponse<{
    message: string;
    query_id: string;
    status: string;
    results: {
      success: boolean;
      total_results: number;
      processed_results: number;
      execution_time: number;
      new_patents: number;
      error?: string;
    };
  }>> {
    return this.fetchWithAuth(`/analytics/api/research/queries/${id}/execute/`, {
      method: 'POST',
    });
  }

  async cancelQuery(id: string): Promise<ApiResponse<{ message: string }>> {
    return this.fetchWithAuth(`/analytics/api/research/queries/${id}/cancel/`, {
      method: 'POST',
    });
  }

  // Research Results
  async getQueryResults(queryId: string, params?: {
    selected_only?: boolean;
    relevance?: string;
    page?: number;
  }): Promise<ApiResponse<ResearchResult[]>> {
    const queryParams = new URLSearchParams();
    if (params?.selected_only) queryParams.append('selected_only', 'true');
    if (params?.relevance) queryParams.append('relevance', params.relevance);
    if (params?.page) queryParams.append('page', params.page.toString());
    
    const endpoint = queryParams.toString() 
      ? `/analytics/api/research/queries/${queryId}/results/?${queryParams}`
      : `/analytics/api/research/queries/${queryId}/results/`;
    
    return this.fetchWithAuth<ResearchResult[]>(endpoint);
  }

  async getResults(params?: {
    query_id?: string;
    project_id?: string;
    selected_only?: boolean;
  }): Promise<ApiResponse<ResearchResult[]>> {
    const queryParams = new URLSearchParams();
    if (params?.query_id) queryParams.append('query_id', params.query_id);
    if (params?.project_id) queryParams.append('project_id', params.project_id);
    if (params?.selected_only) queryParams.append('selected_only', 'true');
    
    const endpoint = queryParams.toString() 
      ? `/analytics/api/research/results/?${queryParams}`
      : '/analytics/api/research/results/';
    
    return this.fetchWithAuth<ResearchResult[]>(endpoint);
  }

  async updateResult(id: string, data: {
    manual_relevance?: string;
    is_selected?: boolean;
  }): Promise<ApiResponse<ResearchResult>> {
    return this.fetchWithAuth<ResearchResult>(`/analytics/api/research/results/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async bulkUpdateResults(data: {
    result_ids: string[];
    action: 'select' | 'unselect' | 'set_relevance';
    relevance?: string;
  }): Promise<ApiResponse<{
    message: string;
    updated_count: number;
  }>> {
    return this.fetchWithAuth('/analytics/api/research/results/bulk_update/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Research Sessions
  async getSessions(projectId: string): Promise<ApiResponse<ResearchSession[]>> {
    return this.fetchWithAuth<ResearchSession[]>(`/analytics/api/research/sessions/?project_id=${projectId}`);
  }

  async createSession(data: {
    project: string;
    name: string;
    description?: string;
  }): Promise<ApiResponse<ResearchSession>> {
    return this.fetchWithAuth<ResearchSession>('/analytics/api/research/sessions/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async endSession(id: string): Promise<ApiResponse<{ message: string }>> {
    return this.fetchWithAuth(`/analytics/api/research/sessions/${id}/end_session/`, {
      method: 'POST',
    });
  }

  // Analytics
  async getProjectAnalytics(projectId: string): Promise<ApiResponse<ResearchAnalytics>> {
    return this.fetchWithAuth<ResearchAnalytics>(`/analytics/api/research/analytics/project_overview/?project_id=${projectId}`);
  }

  async getApiInfo(): Promise<ApiResponse<PatentAPI[]>> {
    return this.fetchWithAuth<PatentAPI[]>('/analytics/api/research/analytics/api_info/');
  }

  // Dataset Creation
  async createDatasetFromResults(data: {
    query_ids: string[];
    dataset_name: string;
    dataset_description?: string;
    selected_only?: boolean;
    apply_column_mapping?: boolean;
  }): Promise<ApiResponse<{
    message: string;
    dataset_id: string;
    dataset_name: string;
    total_patents: number;
  }>> {
    return this.fetchWithAuth('/analytics/api/research/datasets/create_dataset/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Patent API Management - Extended functionality
  async getAvailableAPIs(): Promise<ApiResponse<PatentAPI[]>> {
    try {
      // Try to get admin-configured APIs first
      const response = await this.fetchWithAuth<PatentAPI[]>('/analytics/api/research/patent-apis/');
      
      if (response.success && response.data) {
        return response;
      }
      
      // Fallback to hardcoded APIs
      return this.getHardcodedAPIs();
    } catch (error) {
      // If admin endpoint fails, return hardcoded APIs
      return this.getHardcodedAPIs();
    }
  }

  // Preserved existing functionality - hardcoded APIs
  private getHardcodedAPIs(): ApiResponse<PatentAPI[]> {
    const hardcodedAPIs: PatentAPI[] = [
      {
        id: 'uspto-default',
        name: 'uspto',
        display_name: 'USPTO (Built-in)',
        description: 'United States Patent and Trademark Office - Default implementation',
        is_active: true,
        is_configured: false,
        source_type: 'hardcoded',
        test_status: 'passed',
      },
      {
        id: 'epo-default',
        name: 'epo',
        display_name: 'EPO (Built-in)',
        description: 'European Patent Office - Default implementation',
        is_active: true,
        is_configured: false,
        source_type: 'hardcoded',
        test_status: 'never',
      },
      {
        id: 'wipo-default',
        name: 'wipo',
        display_name: 'WIPO (Built-in)',
        description: 'World Intellectual Property Organization - Default implementation',
        is_active: true,
        is_configured: false,
        source_type: 'hardcoded',
        test_status: 'never',
      },
      {
        id: 'lens-default',
        name: 'lens',
        display_name: 'Lens (Built-in)',
        description: 'The Lens Patent Database - Default implementation',
        is_active: false,
        is_configured: false,
        source_type: 'hardcoded',
        test_status: 'never',
      },
      {
        id: 'google_patents-default',
        name: 'google_patents',
        display_name: 'Google Patents (Built-in)',
        description: 'Google Patents Database - Default implementation',
        is_active: false,
        is_configured: false,
        source_type: 'hardcoded',
        test_status: 'never',
      }
    ];

    return {
      success: true,
      data: hardcodedAPIs,
    };
  }

  // Check if API is properly configured
  async checkAPIConfiguration(apiName: string): Promise<ApiResponse<{
    is_configured: boolean;
    message: string;
    requires_configuration?: string[];
  }>> {
    try {
      return await this.fetchWithAuth(`/analytics/api/research/patent-apis/${apiName}/check-config/`);
    } catch (error) {
      // For hardcoded APIs, they are always "configured" in the legacy sense
      const hardcodedApiNames = ['uspto', 'epo', 'wipo', 'lens', 'google_patents'];
      
      if (hardcodedApiNames.includes(apiName)) {
        return {
          success: true,
          data: {
            is_configured: true,
            message: `${apiName.toUpperCase()} is available as a built-in API`,
          }
        };
      }
      
      return {
        success: true,
        data: {
          is_configured: false,
          message: 'API not configured. Please configure it in the admin panel.',
          requires_configuration: ['base_url', 'auth_config', 'field_mappings'],
        }
      };
    }
  }

  // Enhanced query execution with API configuration check
  async executeQueryWithConfig(queryId: string): Promise<ApiResponse<{
    message: string;
    query_id: string;
    status: string;
    results: {
      success: boolean;
      total_results: number;
      processed_results: number;
      execution_time: number;
      new_patents: number;
      error?: string;
      api_configured?: boolean;
    };
  }>> {
    // First check if the API is properly configured
    const query = await this.fetchWithAuth<ResearchQuery>(`/analytics/api/research/queries/${queryId}/`);
    
    if (!query.success || !query.data) {
      return {
        success: false,
        error: 'Query not found',
      };
    }

    const configCheck = await this.checkAPIConfiguration(query.data.api_source);
    
    if (!configCheck.success || !configCheck.data?.is_configured) {
      return {
        success: false,
        error: configCheck.data?.message || 'API not configured properly',
      };
    }

    // If API is configured, proceed with normal execution
    return this.executeQuery(queryId);
  }

  // Get query history for a project (new feature)
  async getQueryHistory(projectId: string, params?: {
    limit?: number;
    offset?: number;
    api_source?: string;
  }): Promise<ApiResponse<{
    results: ResearchQuery[];
    total: number;
    has_more: boolean;
  }>> {
    const queryParams = new URLSearchParams();
    queryParams.append('project_id', projectId);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    if (params?.api_source) queryParams.append('api_source', params.api_source);
    
    return this.fetchWithAuth(`/analytics/api/research/queries/history/?${queryParams}`);
  }
}

export const researchApi = new ResearchApiService();