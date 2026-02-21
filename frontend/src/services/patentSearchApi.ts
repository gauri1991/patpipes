/**
 * Patent Search API Service
 * Comprehensive service layer for patent database integration and search execution
 */

import { ApiResponse, apiClient } from './apiClient';

// ===== INTERFACES =====

export interface PatentRecord {
  id: string;
  patent_number: string;
  title: string;
  abstract: string;
  inventors: string[];
  assignee: string;
  publication_date: string;
  filing_date: string;
  priority_date?: string;
  status: 'active' | 'expired' | 'pending' | 'rejected';
  jurisdiction: string;
  classifications: {
    ipc: string[];
    cpc: string[];
    uspc?: string[];
  };
  citation_count: number;
  family_size: number;
  legal_status: string;
  claims_count: number;
  forward_citations: number;
  backward_citations: number;
  relevance_score?: number;
  similarity_score?: number;
}

export interface SearchQuery {
  id?: string;
  name: string;
  description?: string;
  query_string: string;
  query_type: 'boolean' | 'semantic' | 'hybrid' | 'classification';
  keywords: string[];
  classifications: string[];
  date_range?: {
    from: string;
    to: string;
  };
  jurisdictions: string[];
  assignees?: string[];
  inventors?: string[];
  status_filter?: string[];
  language?: string[];
  patent_types?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface SearchExecution {
  id: string;
  query: SearchQuery;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  total_results: number;
  execution_time: number;
  database_sources: string[];
  started_at: string;
  completed_at?: string;
  error_message?: string;
  results_preview: PatentRecord[];
}

export interface SearchFilters {
  date_range?: {
    from: string;
    to: string;
  };
  jurisdictions: string[];
  assignees: string[];
  inventors: string[];
  classifications: string[];
  status: string[];
  patent_types: string[];
  language: string[];
  citation_range?: {
    min: number;
    max: number;
  };
  family_size_range?: {
    min: number;
    max: number;
  };
}

export interface SearchConfiguration {
  id: string;
  name: string;
  description: string;
  databases: DatabaseConfig[];
  default_filters: SearchFilters;
  result_limit: number;
  timeout_minutes: number;
  api_credentials: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface DatabaseConfig {
  id: string;
  name: string;
  type: 'uspto' | 'epo' | 'wipo' | 'jpo' | 'sipo' | 'espacenet' | 'google_patents';
  endpoint: string;
  enabled: boolean;
  priority: number;
  search_capabilities: string[];
  rate_limits: {
    requests_per_minute: number;
    requests_per_day: number;
  };
}

export interface SearchAnalytics {
  total_searches: number;
  successful_searches: number;
  failed_searches: number;
  average_execution_time: number;
  total_results_retrieved: number;
  most_used_databases: string[];
  top_jurisdictions: string[];
  search_trends: {
    date: string;
    count: number;
  }[];
}

// ===== API CLIENT =====

class PatentSearchApiService {
  private basePath = '/api/patents/search';

  // ===== SEARCH EXECUTION =====
  
  async executeSearch(searchData: Partial<SearchQuery>): Promise<ApiResponse<SearchExecution>> {
    return apiClient.post(`${this.basePath}/execute/`, searchData);
  }

  async getSearchExecution(executionId: string): Promise<ApiResponse<SearchExecution>> {
    return apiClient.get(`${this.basePath}/executions/${executionId}/`);
  }

  async cancelSearchExecution(executionId: string): Promise<ApiResponse<{ success: boolean }>> {
    return apiClient.post(`${this.basePath}/executions/${executionId}/cancel/`);
  }

  async getSearchResults(
    executionId: string, 
    params?: {
      page?: number;
      limit?: number;
      sort_by?: string;
      sort_order?: 'asc' | 'desc';
      filters?: Partial<SearchFilters>;
    }
  ): Promise<ApiResponse<{
    results: PatentRecord[];
    total: number;
    page: number;
    pages: number;
  }>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.sort_by) queryParams.set('sort_by', params.sort_by);
    if (params?.sort_order) queryParams.set('sort_order', params.sort_order);
    if (params?.filters) queryParams.set('filters', JSON.stringify(params.filters));

    return apiClient.get(`${this.basePath}/executions/${executionId}/results/?${queryParams}`);
  }

  // ===== QUERY MANAGEMENT =====

  async saveQuery(queryData: Partial<SearchQuery>): Promise<ApiResponse<SearchQuery>> {
    return apiClient.post(`${this.basePath}/queries/`, queryData);
  }

  async getQueries(params?: {
    project_id?: string;
    session_id?: string;
    query_type?: string;
  }): Promise<ApiResponse<SearchQuery[]>> {
    const queryParams = new URLSearchParams();
    if (params?.project_id) queryParams.set('project_id', params.project_id);
    if (params?.session_id) queryParams.set('session_id', params.session_id);
    if (params?.query_type) queryParams.set('query_type', params.query_type);

    return apiClient.get(`${this.basePath}/queries/?${queryParams}`);
  }

  async updateQuery(queryId: string, queryData: Partial<SearchQuery>): Promise<ApiResponse<SearchQuery>> {
    return apiClient.put(`${this.basePath}/queries/${queryId}/`, queryData);
  }

  async deleteQuery(queryId: string): Promise<ApiResponse<{ success: boolean }>> {
    return apiClient.delete(`${this.basePath}/queries/${queryId}/`);
  }

  // ===== QUERY BUILDING =====

  async buildQueryFromKeywords(keywords: string[], options?: {
    operator?: 'AND' | 'OR';
    fields?: string[];
    proximity?: number;
  }): Promise<ApiResponse<{ query_string: string }>> {
    return apiClient.post(`${this.basePath}/build/keywords/`, {
      keywords,
      ...options
    });
  }

  async buildQueryFromClassifications(classifications: string[], options?: {
    include_subclasses?: boolean;
    classification_type?: 'ipc' | 'cpc' | 'uspc';
  }): Promise<ApiResponse<{ query_string: string }>> {
    return apiClient.post(`${this.basePath}/build/classifications/`, {
      classifications,
      ...options
    });
  }

  async buildBooleanQuery(components: {
    keywords?: string[];
    classifications?: string[];
    assignees?: string[];
    inventors?: string[];
    logic?: string;
  }): Promise<ApiResponse<{ query_string: string }>> {
    return apiClient.post(`${this.basePath}/build/boolean/`, components);
  }

  // ===== SEARCH CONFIGURATION =====

  async getSearchConfigurations(): Promise<ApiResponse<SearchConfiguration[]>> {
    return apiClient.get(`${this.basePath}/configurations/`);
  }

  async createSearchConfiguration(configData: Partial<SearchConfiguration>): Promise<ApiResponse<SearchConfiguration>> {
    return apiClient.post(`${this.basePath}/configurations/`, configData);
  }

  async updateSearchConfiguration(configId: string, configData: Partial<SearchConfiguration>): Promise<ApiResponse<SearchConfiguration>> {
    return apiClient.put(`${this.basePath}/configurations/${configId}/`, configData);
  }

  async deleteSearchConfiguration(configId: string): Promise<ApiResponse<{ success: boolean }>> {
    return apiClient.delete(`${this.basePath}/configurations/${configId}/`);
  }

  // ===== DATABASE MANAGEMENT =====

  async getDatabases(): Promise<ApiResponse<DatabaseConfig[]>> {
    return apiClient.get(`${this.basePath}/databases/`);
  }

  async testDatabaseConnection(databaseId: string): Promise<ApiResponse<{ 
    status: 'connected' | 'failed';
    response_time: number;
    error?: string;
  }>> {
    return apiClient.post(`${this.basePath}/databases/${databaseId}/test/`);
  }

  // ===== ANALYTICS =====

  async getSearchAnalytics(params?: {
    date_from?: string;
    date_to?: string;
    project_id?: string;
  }): Promise<ApiResponse<SearchAnalytics>> {
    const queryParams = new URLSearchParams();
    if (params?.date_from) queryParams.set('date_from', params.date_from);
    if (params?.date_to) queryParams.set('date_to', params.date_to);
    if (params?.project_id) queryParams.set('project_id', params.project_id);

    return apiClient.get(`${this.basePath}/analytics/?${queryParams}`);
  }

  // ===== EXPORT FUNCTIONS =====

  async exportResults(executionId: string, format: 'csv' | 'excel' | 'json' | 'pdf', options?: {
    include_abstracts?: boolean;
    include_claims?: boolean;
    include_citations?: boolean;
    fields?: string[];
  }): Promise<ApiResponse<{ download_url: string }>> {
    return apiClient.post(`${this.basePath}/executions/${executionId}/export/`, {
      format,
      ...options
    });
  }

  // ===== UTILITY FUNCTIONS =====

  async validateQuery(queryString: string, queryType: string): Promise<ApiResponse<{
    valid: boolean;
    errors?: string[];
    suggestions?: string[];
  }>> {
    return apiClient.post(`${this.basePath}/validate/`, {
      query_string: queryString,
      query_type: queryType
    });
  }

  async getSearchSuggestions(partial: string, type: 'keywords' | 'assignees' | 'inventors' | 'classifications'): Promise<ApiResponse<string[]>> {
    return apiClient.get(`${this.basePath}/suggestions/?q=${encodeURIComponent(partial)}&type=${type}`);
  }
}

// Export singleton instance
export const patentSearchApi = new PatentSearchApiService();

// Types are already exported with their definitions above