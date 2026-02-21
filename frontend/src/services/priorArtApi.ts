/**
 * Prior Art API Service
 * Handles all prior art search and analysis API calls
 */

import { ApiResponse, ApiClient } from './apiClient';
import { researchApi, ResearchQuery, CreateQueryData } from './researchApi';
import {
  PriorArtProject,
  CreatePriorArtProjectData,
  PriorArtAnalysisSession,
  PriorArtProjectStatus,
  PriorArtProjectType
} from '@/types/prior-art.types';

interface PriorArtProjectListParams {
  status?: PriorArtProjectStatus;
  type?: PriorArtProjectType;
  page_size?: number;
  offset?: number;
  search?: string;
  ordering?: string;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

interface ProjectStatistics {
  total_projects: number;
  active_projects: number;
  completed_projects: number;
  by_type: Record<string, number>;
  by_status: Record<string, number>;
  total_searches: number;
  total_evidence: number;
  total_reports: number;
  average_completion_percentage: number;
}

interface SearchSession {
  id: string;
  name: string;
  description: string;
  search_purpose: string;
  status: string;
  result_count: number;
  created_at: string;
  completed_at?: string;
}

interface EvidenceItem {
  id: string;
  reference_id: string;
  evidence_type: string;
  title: string;
  publication_date?: string;
  relevance_level: string;
  legal_relevance_score?: number;
  is_relevant: boolean;
  is_primary_reference: boolean;
  analysis_status: string;
}

interface PriorArtReport {
  id: string;
  report_type: string;
  title: string;
  status: string;
  generation_progress: number;
  file_format: string;
  created_at: string;
  completed_at?: string;
}

class PriorArtApiService extends ApiClient {
  private readonly basePath = '/prior-art/projects';

  // Projects Management
  async getProjects(params?: PriorArtProjectListParams): Promise<ApiResponse<PriorArtProject[]>> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.type) queryParams.append('project_type', params.type);
    if (params?.page_size) queryParams.append('page_size', params.page_size.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.ordering) queryParams.append('ordering', params.ordering);

    const endpoint = queryParams.toString()
      ? `${this.basePath}?${queryParams}`
      : this.basePath;

    const response = await this.fetchWithAuth<PaginatedResponse<PriorArtProject> | PriorArtProject[]>(endpoint);

    if (response.success && response.data) {
      // Handle both paginated and non-paginated responses
      const projects = Array.isArray(response.data) ? response.data : response.data.results;
      return { success: true, data: projects };
    }

    return response as ApiResponse<PriorArtProject[]>;
  }

  async getProject(id: string): Promise<ApiResponse<PriorArtProject>> {
    return this.fetchWithAuth<PriorArtProject>(`${this.basePath}/${id}`);
  }

  async createProject(data: CreatePriorArtProjectData): Promise<ApiResponse<PriorArtProject>> {
    return this.fetchWithAuth<PriorArtProject>(this.basePath, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProject(id: string, data: Partial<CreatePriorArtProjectData>): Promise<ApiResponse<PriorArtProject>> {
    return this.fetchWithAuth<PriorArtProject>(`${this.basePath}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteProject(id: string): Promise<ApiResponse<void>> {
    return this.fetchWithAuth<void>(`${this.basePath}/${id}`, {
      method: 'DELETE',
    });
  }

  async duplicateProject(id: string, newName?: string): Promise<ApiResponse<PriorArtProject>> {
    return this.fetchWithAuth<PriorArtProject>(`${this.basePath}/${id}/duplicate`, {
      method: 'POST',
      body: JSON.stringify({ name: newName }),
    });
  }

  async archiveProject(id: string): Promise<ApiResponse<PriorArtProject>> {
    return this.fetchWithAuth<PriorArtProject>(`${this.basePath}/${id}/archive`, {
      method: 'POST',
    });
  }

  async restoreProject(id: string): Promise<ApiResponse<PriorArtProject>> {
    return this.fetchWithAuth<PriorArtProject>(`${this.basePath}/${id}/restore`, {
      method: 'POST',
    });
  }

  async updateProjectStatus(id: string, status: PriorArtProjectStatus): Promise<ApiResponse<PriorArtProject>> {
    return this.fetchWithAuth<PriorArtProject>(`${this.basePath}/${id}/update_status`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    });
  }

  // Team Management
  async addTeamMember(projectId: string, userId: string, role: string = 'researcher'): Promise<ApiResponse<any>> {
    return this.fetchWithAuth(`${this.basePath}/${projectId}/add_team_member`, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, role }),
    });
  }

  async removeTeamMember(projectId: string, userId: string): Promise<ApiResponse<any>> {
    return this.fetchWithAuth(`${this.basePath}/${projectId}/remove_team_member`, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId }),
    });
  }

  // Bulk Operations
  async bulkUpdateProjects(updates: { projectId: string; data: Partial<PriorArtProject> }[]): Promise<ApiResponse<PriorArtProject[]>> {
    return this.fetchWithAuth<PriorArtProject[]>(`${this.basePath}/bulk_update`, {
      method: 'POST',
      body: JSON.stringify({ updates }),
    });
  }

  async bulkDeleteProjects(projectIds: string[]): Promise<ApiResponse<{ deleted_count: number }>> {
    return this.fetchWithAuth(`${this.basePath}/bulk_delete`, {
      method: 'POST',
      body: JSON.stringify({ projectIds }),
    });
  }

  async bulkArchiveProjects(projectIds: string[]): Promise<ApiResponse<PriorArtProject[]>> {
    return this.fetchWithAuth<PriorArtProject[]>(`${this.basePath}/bulk_archive`, {
      method: 'POST',
      body: JSON.stringify({ projectIds }),
    });
  }

  // Statistics
  async getStatistics(): Promise<ApiResponse<ProjectStatistics>> {
    return this.fetchWithAuth<ProjectStatistics>(`${this.basePath}/statistics`);
  }

  async getProjectStats(projectId: string): Promise<ApiResponse<{
    total_searches: number;
    total_results: number;
    unique_patents: number;
    analyzed_count: number;
    relevance_distribution: Record<string, number>;
    api_usage: Record<string, number>;
    timeline: Record<string, number>;
  }>> {
    return this.fetchWithAuth(`${this.basePath}/${projectId}/update_metrics`, {
      method: 'POST',
    });
  }

  // Search Sessions
  async getSearchSessions(projectId: string): Promise<ApiResponse<SearchSession[]>> {
    return this.fetchWithAuth<SearchSession[]>(`${this.basePath}/${projectId}/search-sessions`);
  }

  async createSearchSession(projectId: string, data: {
    name: string;
    description?: string;
    search_purpose: string;
    search_strategy?: Record<string, any>;
  }): Promise<ApiResponse<SearchSession>> {
    return this.fetchWithAuth<SearchSession>(`${this.basePath}/${projectId}/search-sessions`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async executeSearchSession(projectId: string, sessionId: string): Promise<ApiResponse<any>> {
    return this.fetchWithAuth(`${this.basePath}/${projectId}/search-sessions/${sessionId}/execute`, {
      method: 'POST',
    });
  }

  async cancelSearchSession(projectId: string, sessionId: string): Promise<ApiResponse<SearchSession>> {
    return this.fetchWithAuth<SearchSession>(`${this.basePath}/${projectId}/search-sessions/${sessionId}/cancel`, {
      method: 'POST',
    });
  }

  // Evidence Items
  async getEvidence(projectId: string, params?: {
    evidence_type?: string;
    relevance_level?: string;
    is_relevant?: boolean;
    page_size?: number;
    offset?: number;
  }): Promise<ApiResponse<EvidenceItem[]>> {
    const queryParams = new URLSearchParams();
    if (params?.evidence_type) queryParams.append('evidence_type', params.evidence_type);
    if (params?.relevance_level) queryParams.append('relevance_level', params.relevance_level);
    if (params?.is_relevant !== undefined) queryParams.append('is_relevant', String(params.is_relevant));
    if (params?.page_size) queryParams.append('page_size', params.page_size.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const endpoint = queryParams.toString()
      ? `${this.basePath}/${projectId}/evidence?${queryParams}`
      : `${this.basePath}/${projectId}/evidence`;

    return this.fetchWithAuth<EvidenceItem[]>(endpoint);
  }

  async markEvidenceRelevant(projectId: string, evidenceId: string, relevanceLevel?: string): Promise<ApiResponse<EvidenceItem>> {
    return this.fetchWithAuth<EvidenceItem>(`${this.basePath}/${projectId}/evidence/${evidenceId}/mark_relevant`, {
      method: 'POST',
      body: JSON.stringify({ relevance_level: relevanceLevel }),
    });
  }

  async markEvidencePrimary(projectId: string, evidenceId: string): Promise<ApiResponse<EvidenceItem>> {
    return this.fetchWithAuth<EvidenceItem>(`${this.basePath}/${projectId}/evidence/${evidenceId}/mark_primary`, {
      method: 'POST',
    });
  }

  async bulkUpdateEvidenceRelevance(projectId: string, evidenceIds: string[], relevanceLevel: string, isRelevant: boolean): Promise<ApiResponse<{ updated_count: number }>> {
    return this.fetchWithAuth(`${this.basePath}/${projectId}/evidence/bulk_update_relevance`, {
      method: 'POST',
      body: JSON.stringify({
        evidenceIds,
        relevanceLevel,
        isRelevant,
      }),
    });
  }

  async getEvidenceStatistics(projectId: string): Promise<ApiResponse<any>> {
    return this.fetchWithAuth(`${this.basePath}/${projectId}/evidence/statistics`);
  }

  // Reports
  async getReports(projectId: string): Promise<ApiResponse<PriorArtReport[]>> {
    return this.fetchWithAuth<PriorArtReport[]>(`${this.basePath}/${projectId}/reports`);
  }

  async createReport(projectId: string, data: {
    report_type: string;
    title: string;
    description?: string;
    file_format?: string;
  }): Promise<ApiResponse<PriorArtReport>> {
    return this.fetchWithAuth<PriorArtReport>(`${this.basePath}/${projectId}/reports`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async generateReport(projectId: string, reportId: string): Promise<ApiResponse<any>> {
    return this.fetchWithAuth(`${this.basePath}/${projectId}/reports/${reportId}/generate`, {
      method: 'POST',
    });
  }

  async downloadReport(projectId: string, reportId: string): Promise<ApiResponse<{ download_url: string }>> {
    return this.fetchWithAuth(`${this.basePath}/${projectId}/reports/${reportId}/download`);
  }

  async addEvidenceToReport(projectId: string, reportId: string, evidenceIds: string[]): Promise<ApiResponse<PriorArtReport>> {
    return this.fetchWithAuth<PriorArtReport>(`${this.basePath}/${projectId}/reports/${reportId}/add_evidence`, {
      method: 'POST',
      body: JSON.stringify({ evidence_ids: evidenceIds }),
    });
  }

  async removeEvidenceFromReport(projectId: string, reportId: string, evidenceIds: string[]): Promise<ApiResponse<PriorArtReport>> {
    return this.fetchWithAuth<PriorArtReport>(`${this.basePath}/${projectId}/reports/${reportId}/remove_evidence`, {
      method: 'POST',
      body: JSON.stringify({ evidence_ids: evidenceIds }),
    });
  }

  // Legacy methods for backward compatibility
  async createSearch(projectId: string, data: CreateQueryData & { target_claims?: string[] }): Promise<ApiResponse<ResearchQuery>> {
    const priorArtQueryData = {
      ...data,
      project: projectId,
      additional_filters: {
        ...data.additional_filters,
        context: 'prior_art',
        target_claims: data.target_claims
      }
    };

    return researchApi.createQuery(priorArtQueryData);
  }

  async getProjectSearches(projectId: string): Promise<ApiResponse<ResearchQuery[]>> {
    return researchApi.getQueries(projectId);
  }

  async executeSearch(queryId: string): Promise<ApiResponse<any>> {
    return researchApi.executeQueryWithConfig(queryId);
  }

  async createAnalysisSession(data: {
    project_id: string;
    name: string;
    description?: string;
    selected_results: string[];
  }): Promise<ApiResponse<PriorArtAnalysisSession>> {
    return this.createSearchSession(data.project_id, {
      name: data.name,
      description: data.description,
      search_purpose: 'validation',
    }) as unknown as ApiResponse<PriorArtAnalysisSession>;
  }

  async getAnalysisSessions(projectId: string): Promise<ApiResponse<PriorArtAnalysisSession[]>> {
    return this.getSearchSessions(projectId) as unknown as ApiResponse<PriorArtAnalysisSession[]>;
  }

  async performClaimMapping(data: {
    project_id: string;
    target_claims: string[];
    prior_art_ids: string[];
  }): Promise<ApiResponse<any>> {
    return this.fetchWithAuth('/prior-art/api/analysis/claim-mapping/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async generateFTOReport(projectId: string): Promise<ApiResponse<{
    report_id: string;
    status: string;
    file_url?: string;
  }>> {
    return this.createReport(projectId, {
      report_type: 'fto_report',
      title: 'Freedom to Operate Report',
    }).then(response => {
      if (response.success && response.data) {
        return {
          success: true,
          data: {
            report_id: response.data.id,
            status: response.data.status,
          }
        };
      }
      return response as any;
    });
  }

  async generateInvalidityChart(data: {
    project_id: string;
    target_patent: string;
    prior_art_ids: string[];
  }): Promise<ApiResponse<{
    chart_id: string;
    file_url?: string;
  }>> {
    return this.createReport(data.project_id, {
      report_type: 'claim_chart',
      title: `Invalidity Chart - ${data.target_patent}`,
    }).then(response => {
      if (response.success && response.data) {
        return {
          success: true,
          data: {
            chart_id: response.data.id,
          }
        };
      }
      return response as any;
    });
  }
}

export const priorArtApi = new PriorArtApiService();
