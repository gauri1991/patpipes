/**
 * Web Search API Service
 * Handles all API interactions for web search sessions, queries, and results
 */

import { ApiClient, ApiResponse } from './apiClient';
import {
  SearchSession,
  SearchQuery,
  SearchResult,
  QuotaInfo,
  CreateSessionRequest,
  CreateQueryRequest,
  UpdateResultRequest,
  PaginatedResponse,
  SearchConfigPublic,
  ClientSearchSubmission,
} from '@/domains/web-search/types/webSearch.types';

class WebSearchApiService extends ApiClient {
  private readonly BASE_PATH = '/web-search';

  // ==================== Sessions ====================

  async getSessions(params?: Record<string, any>): Promise<ApiResponse<PaginatedResponse<SearchSession>>> {
    return this.get<PaginatedResponse<SearchSession>>(`${this.BASE_PATH}/sessions/`, { params });
  }

  async getSession(id: string): Promise<ApiResponse<SearchSession>> {
    return this.get<SearchSession>(`${this.BASE_PATH}/sessions/${id}/`);
  }

  async createSession(data: CreateSessionRequest): Promise<ApiResponse<SearchSession>> {
    return this.post<SearchSession>(`${this.BASE_PATH}/sessions/`, data);
  }

  async updateSession(id: string, data: Partial<SearchSession>): Promise<ApiResponse<SearchSession>> {
    return this.patch<SearchSession>(`${this.BASE_PATH}/sessions/${id}/`, data);
  }

  async deleteSession(id: string): Promise<ApiResponse<void>> {
    return this.delete<void>(`${this.BASE_PATH}/sessions/${id}/`);
  }

  // ==================== Query Generation & Execution ====================

  async generateQueries(
    sessionId: string,
    contextData?: Record<string, any>
  ): Promise<ApiResponse<SearchQuery[]>> {
    return this.post<SearchQuery[]>(
      `${this.BASE_PATH}/sessions/${sessionId}/generate_queries/`,
      contextData ? { context_data: contextData } : undefined
    );
  }

  async executeAllQueries(sessionId: string): Promise<ApiResponse<SearchResult[]>> {
    return this.post<SearchResult[]>(`${this.BASE_PATH}/sessions/${sessionId}/execute_all/`);
  }

  async getSessionResults(sessionId: string): Promise<ApiResponse<SearchResult[]>> {
    return this.get<SearchResult[]>(`${this.BASE_PATH}/sessions/${sessionId}/results/`);
  }

  // ==================== Queries ====================

  async getQueries(params?: Record<string, any>): Promise<ApiResponse<PaginatedResponse<SearchQuery>>> {
    return this.get<PaginatedResponse<SearchQuery>>(`${this.BASE_PATH}/queries/`, { params });
  }

  async createQuery(data: CreateQueryRequest): Promise<ApiResponse<SearchQuery>> {
    return this.post<SearchQuery>(`${this.BASE_PATH}/queries/`, data);
  }

  async updateQuery(queryId: string, data: Partial<Pick<SearchQuery, 'query_text' | 'category' | 'site_filter' | 'file_type' | 'date_restrict' | 'exact_terms' | 'exclude_terms'>>): Promise<ApiResponse<SearchQuery>> {
    return this.patch<SearchQuery>(`${this.BASE_PATH}/queries/${queryId}/`, data);
  }

  async deleteQuery(queryId: string): Promise<ApiResponse<void>> {
    return this.delete<void>(`${this.BASE_PATH}/queries/${queryId}/`);
  }

  async executeQuery(queryId: string): Promise<ApiResponse<SearchResult[]>> {
    return this.post<SearchResult[]>(`${this.BASE_PATH}/queries/${queryId}/execute/`);
  }

  // ==================== Results ====================

  async updateResult(resultId: string, data: UpdateResultRequest): Promise<ApiResponse<SearchResult>> {
    return this.patch<SearchResult>(`${this.BASE_PATH}/results/${resultId}/`, data);
  }

  // ==================== Quota ====================

  async getQuota(): Promise<ApiResponse<QuotaInfo>> {
    return this.get<QuotaInfo>(`${this.BASE_PATH}/quota/`);
  }

  // ==================== Config (Admin) ====================

  async getConfig(): Promise<ApiResponse<GoogleSearchConfigResponse>> {
    return this.get<GoogleSearchConfigResponse>(`${this.BASE_PATH}/config/`);
  }

  async updateConfig(data: GoogleSearchConfigUpdate): Promise<ApiResponse<GoogleSearchConfigResponse>> {
    return this.put<GoogleSearchConfigResponse>(`${this.BASE_PATH}/config/`, data);
  }

  async testConnection(): Promise<ApiResponse<{ status: string; message: string; total_results?: string }>> {
    return this.post<{ status: string; message: string; total_results?: string }>(`${this.BASE_PATH}/config/`);
  }

  // ==================== Public Config (for client-side search) ====================

  async getPublicConfig(): Promise<ApiResponse<SearchConfigPublic>> {
    return this.get<SearchConfigPublic>(`${this.BASE_PATH}/config/public/`);
  }

  // ==================== Client-Side Results Submission ====================

  async submitClientResults(data: ClientSearchSubmission): Promise<ApiResponse<{
    query_id: string;
    results_count: number;
    results: SearchResult[];
  }>> {
    return this.post(`${this.BASE_PATH}/client-results/`, data);
  }
}

// Admin config types
export interface GoogleSearchConfigResponse {
  api_key_masked: string;
  search_engine_id_masked: string;
  daily_limit: number;
  is_active: boolean;
  is_configured: boolean;
  search_mode: 'server' | 'client' | 'none';
  updated_at: string;
  updated_by_name: string | null;
}

export interface GoogleSearchConfigUpdate {
  api_key?: string;
  search_engine_id?: string;
  daily_limit?: number;
  is_active?: boolean;
}

// Export singleton instance
export const webSearchApi = new WebSearchApiService();

// Export default
export default webSearchApi;
