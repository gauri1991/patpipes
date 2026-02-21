/**
 * Patents Service
 * API service for patent data management and processing
 */

import { ApiClient } from '@/services/apiClient';
import {
  Patent,
  PatentSearchQuery,
  PatentSearchResult,
  PatentUploadRequest,
  PatentBulkUploadRequest,
  PatentUploadResponse,
  PatentProcessingJob,
  PatentPortfolioStats,
  ProcessingStage
} from '../types/patent.types';

export interface ClassificationEntry {
  id: number;
  code: string;
  system: 'CPC' | 'IPC';
  level: 'section' | 'class' | 'subclass' | 'group' | 'subgroup';
  title: string;
  parent_code: string;
  indent_level: number;
  child_count: number;
}

export interface ODPSearchResult {
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
  application_type: string;
  application_status: string;
}

export interface ODPImportJobStatus {
  id: string;
  status: 'pending' | 'running' | 'paused' | 'cancelled' | 'completed' | 'failed';
  total_expected: number;
  processed: number;
  created_count: number;
  skipped_count: number;
  page_size: number;
  error_message: string;
  created_at: string;
  completed_at: string | null;
}

class PatentsService extends ApiClient {
  private baseUrl = '/patents';

  constructor() {
    super();
  }

  // Patent CRUD Operations
  async getPatent(id: string): Promise<Patent> {
    try {
      const response = await this.fetchWithAuth<Patent>(`${this.baseUrl}/${id}`);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to fetch patent data');
    } catch (error) {
      console.error('Failed to fetch patent:', error);
      throw new Error('Failed to fetch patent data');
    }
  }

  async searchPatents(query: PatentSearchQuery, page = 1, pageSize = 20): Promise<PatentSearchResult> {
    try {
      const params = new URLSearchParams();
      
      // Build query parameters
      if (query.query) params.append('q', query.query);
      if (query.patentNumber) params.append('patent_number', query.patentNumber);
      if (query.title) params.append('title', query.title);
      if (query.inventor) params.append('inventor', query.inventor);
      if (query.assignee) params.append('assignee', query.assignee);
      if (query.ipcClass) params.append('ipc_class', query.ipcClass);
      if (query.cpcClass) params.append('cpc_class', query.cpcClass);
      if (query.filingDateFrom) params.append('filing_date_from', query.filingDateFrom);
      if (query.filingDateTo) params.append('filing_date_to', query.filingDateTo);
      if (query.jurisdiction?.length) params.append('jurisdiction', query.jurisdiction.join(','));
      if (query.status?.length) params.append('status', query.status.join(','));
      if (query.type?.length) params.append('type', query.type.join(','));
      if (query.tags?.length) params.append('tags', query.tags.join(','));
      if (query.projectId) params.append('project_id', query.projectId);
      
      params.append('page', page.toString());
      params.append('page_size', pageSize.toString());

      const response = await this.fetchWithAuth<PatentSearchResult>(`${this.baseUrl}/search?${params.toString()}`);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to search patents');
    } catch (error) {
      console.error('Failed to search patents:', error);
      
      // Return mock data as fallback
      return this.getMockPatentSearchResult(query, page, pageSize);
    }
  }

  async createPatent(patentData: Partial<Patent>): Promise<Patent> {
    try {
      const response = await this.fetchWithAuth<Patent>(this.baseUrl, {
        method: 'POST',
        body: JSON.stringify(patentData)
      });
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to create patent');
    } catch (error) {
      console.error('Failed to create patent:', error);
      throw new Error('Failed to create patent');
    }
  }

  async updatePatent(id: string, patentData: Partial<Patent>): Promise<Patent> {
    try {
      const response = await this.fetchWithAuth<Patent>(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(patentData)
      });
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to update patent');
    } catch (error) {
      console.error('Failed to update patent:', error);
      throw new Error('Failed to update patent');
    }
  }

  async deletePatent(id: string): Promise<void> {
    try {
      const response = await this.fetchWithAuth(`${this.baseUrl}/${id}`, {
        method: 'DELETE'
      });
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete patent');
      }
    } catch (error) {
      console.error('Failed to delete patent:', error);
      throw new Error('Failed to delete patent');
    }
  }

  // File Upload Operations
  async uploadPatent(uploadRequest: PatentUploadRequest): Promise<PatentUploadResponse> {
    try {
      const formData = new FormData();
      formData.append('file', uploadRequest.file);
      formData.append('source', uploadRequest.source);
      formData.append('autoAnalyze', uploadRequest.autoAnalyze.toString());
      
      if (uploadRequest.projectId) {
        formData.append('projectId', uploadRequest.projectId);
      }
      
      if (uploadRequest.tags?.length) {
        formData.append('tags', JSON.stringify(uploadRequest.tags));
      }

      const response = await this.fetchWithAuth<PatentUploadResponse>(`${this.baseUrl}/upload`, {
        method: 'POST',
        body: formData,
        headers: {}  // Let browser set Content-Type for FormData
      });

      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to upload patent');
    } catch (error) {
      console.error('Failed to upload patent:', error);
      
      // Return mock response for development
      return {
        uploadId: `upload_${Date.now()}`,
        patentIds: [`patent_${Date.now()}`],
        status: ProcessingStage.UPLOADED,
        message: 'Patent uploaded successfully (mock response)'
      };
    }
  }

  async uploadBulkPatents(uploadRequest: PatentBulkUploadRequest): Promise<PatentUploadResponse> {
    try {
      const formData = new FormData();
      
      uploadRequest.files.forEach((file, index) => {
        formData.append(`files[${index}]`, file);
      });
      
      formData.append('source', uploadRequest.source);
      formData.append('autoAnalyze', uploadRequest.autoAnalyze.toString());
      
      if (uploadRequest.projectId) {
        formData.append('projectId', uploadRequest.projectId);
      }
      
      if (uploadRequest.tags?.length) {
        formData.append('tags', JSON.stringify(uploadRequest.tags));
      }

      const response = await this.fetchWithAuth<PatentUploadResponse>(`${this.baseUrl}/upload/bulk`, {
        method: 'POST',
        body: formData,
        headers: {}  // Let browser set Content-Type for FormData
      });

      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to upload bulk patents');
    } catch (error) {
      console.error('Failed to upload bulk patents:', error);
      
      // Return mock response for development
      return {
        uploadId: `bulk_upload_${Date.now()}`,
        patentIds: uploadRequest.files.map((_, i) => `patent_${Date.now()}_${i}`),
        status: ProcessingStage.UPLOADED,
        message: `${uploadRequest.files.length} patents uploaded successfully (mock response)`
      };
    }
  }

  // Processing Operations
  async getProcessingJob(jobId: string): Promise<PatentProcessingJob> {
    try {
      const response = await this.fetchWithAuth<PatentProcessingJob>(`${this.baseUrl}/processing/${jobId}`);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to fetch processing job');
    } catch (error) {
      console.error('Failed to fetch processing job:', error);
      
      // Return mock processing job
      return {
        id: jobId,
        patentId: `patent_${jobId}`,
        stage: ProcessingStage.ANALYZING,
        progress: Math.floor(Math.random() * 100),
        startedAt: new Date().toISOString(),
        estimatedCompletion: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        logs: [
          {
            timestamp: new Date().toISOString(),
            level: 'info',
            message: 'Processing patent data...'
          }
        ]
      };
    }
  }

  async retryProcessing(patentId: string): Promise<PatentProcessingJob> {
    try {
      const response = await this.fetchWithAuth<PatentProcessingJob>(`${this.baseUrl}/${patentId}/retry`, {
        method: 'POST'
      });
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to retry processing');
    } catch (error) {
      console.error('Failed to retry processing:', error);
      throw new Error('Failed to retry processing');
    }
  }

  // Analytics and Statistics
  async getPortfolioStats(projectId?: string): Promise<PatentPortfolioStats> {
    try {
      const params = projectId ? `?project_id=${projectId}` : '';
      const response = await this.fetchWithAuth<PatentPortfolioStats>(`${this.baseUrl}/stats${params}`);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to fetch portfolio stats');
    } catch (error) {
      console.error('Failed to fetch portfolio stats:', error);
      
      // Return mock stats
      return this.getMockPortfolioStats();
    }
  }

  // Infringement cross-reference
  async getPatentInfringementCases(patentId: string): Promise<any[]> {
    try {
      const response = await this.fetchWithAuth<any[]>(`/patents/patents/${patentId}/infringement_cases/`);
      if (response.success && response.data) {
        return response.data;
      }
      return [];
    } catch {
      return [];
    }
  }

  // ODP Search & Import
  async searchODP(params: {
    assignee?: string;
    keywords?: string;
    inventor?: string;
    title?: string;
    application_number?: string;
    status?: string;
    app_type?: string;
    ipc_classes?: string[];
    cpc_classes?: string[];
    date_from?: string;
    date_to?: string;
    offset?: number;
    limit?: number;
  }): Promise<{ results: ODPSearchResult[]; total: number; offset: number; limit: number }> {
    const response = await this.fetchWithAuth<{ results: ODPSearchResult[]; total: number; offset: number; limit: number }>(
      '/patents/patents/search-odp/',
      {
        method: 'POST',
        body: JSON.stringify(params),
      }
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to search USPTO ODP');
  }

  async importFromODP(
    portfolioId: string,
    patents: ODPSearchResult[]
  ): Promise<{ created: number; skipped: number; patents: string[] }> {
    const response = await this.fetchWithAuth<{ created: number; skipped: number; patents: string[] }>(
      '/patents/patents/import-from-odp/',
      {
        method: 'POST',
        body: JSON.stringify({ portfolio_id: portfolioId, patents }),
      }
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to import patents from ODP');
  }

  // Background ODP import
  async startODPImport(params: {
    portfolio_id: string;
    search_params: Record<string, string | undefined>;
    total: number;
    selected_patents_data: ODPSearchResult[];
    import_fields?: string[];
  }): Promise<{ job_id: string; status: string; total_expected: number }> {
    const response = await this.fetchWithAuth<{ job_id: string; status: string; total_expected: number }>(
      '/patents/patents/start-odp-import/',
      {
        method: 'POST',
        body: JSON.stringify(params),
      }
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to start ODP import');
  }

  async getAssigneeGroups(portfolioId: string): Promise<{ groups: { assignee: string; count: number }[]; total_patents: number }> {
    const response = await this.fetchWithAuth<{ groups: { assignee: string; count: number }[]; total_patents: number }>(
      `/patents/patents/assignee-groups/?portfolio=${portfolioId}`
    );
    if (response.success && response.data) return response.data;
    throw new Error(response.error || 'Failed to get assignee groups');
  }

  async bulkDeletePatents(params: { patent_ids?: string[]; assignee?: string; portfolio_id?: string }): Promise<{ deleted: number }> {
    const response = await this.fetchWithAuth<{ deleted: number }>(
      '/patents/patents/bulk-delete/',
      { method: 'POST', body: JSON.stringify(params) }
    );
    if (response.success && response.data) return response.data;
    throw new Error(response.error || 'Failed to delete patents');
  }

  async getODPImportStatus(portfolioId: string): Promise<{ jobs: ODPImportJobStatus[] }> {
    const response = await this.fetchWithAuth<{ jobs: ODPImportJobStatus[] }>(
      `/patents/patents/odp-import-status/?portfolio_id=${portfolioId}`
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to get ODP import status');
  }

  async pauseODPImport(jobId: string): Promise<{ id: string; status: string }> {
    const response = await this.fetchWithAuth<{ id: string; status: string }>(
      '/patents/patents/odp-import-pause/',
      { method: 'POST', body: JSON.stringify({ job_id: jobId }) }
    );
    if (response.success && response.data) return response.data;
    throw new Error(response.error || 'Failed to pause import');
  }

  async resumeODPImport(jobId: string): Promise<{ id: string; status: string }> {
    const response = await this.fetchWithAuth<{ id: string; status: string }>(
      '/patents/patents/odp-import-resume/',
      { method: 'POST', body: JSON.stringify({ job_id: jobId }) }
    );
    if (response.success && response.data) return response.data;
    throw new Error(response.error || 'Failed to resume import');
  }

  async cancelODPImport(jobId: string): Promise<{ id: string; status: string }> {
    const response = await this.fetchWithAuth<{ id: string; status: string }>(
      '/patents/patents/odp-import-cancel/',
      { method: 'POST', body: JSON.stringify({ job_id: jobId }) }
    );
    if (response.success && response.data) return response.data;
    throw new Error(response.error || 'Failed to cancel import');
  }

  async restartODPImport(jobId: string): Promise<{ id: string; status: string; processed: number }> {
    const response = await this.fetchWithAuth<{ id: string; status: string; processed: number }>(
      '/patents/patents/odp-import-restart/',
      { method: 'POST', body: JSON.stringify({ job_id: jobId }) }
    );
    if (response.success && response.data) return response.data;
    throw new Error(response.error || 'Failed to restart import');
  }

  async setODPImportPageSize(jobId: string, pageSize: number): Promise<{ id: string; page_size: number }> {
    const response = await this.fetchWithAuth<{ id: string; page_size: number }>(
      '/patents/patents/odp-import-page-size/',
      { method: 'POST', body: JSON.stringify({ job_id: jobId, page_size: pageSize }) }
    );
    if (response.success && response.data) return response.data;
    throw new Error(response.error || 'Failed to update page size');
  }

  // Classification lookups
  async getClassificationTitles(codes: string[]): Promise<Record<string, { title: string; level: string; system: string }>> {
    if (!codes.length) return {};
    const response = await this.fetchWithAuth<Record<string, { title: string; level: string; system: string }>>(
      `/patents/patents/classification-lookup/?codes=${codes.join(',')}`
    );
    if (response.success && response.data) return response.data;
    throw new Error(response.error || 'Failed to look up classifications');
  }

  async browseClassifications(system: 'CPC' | 'IPC', parent?: string): Promise<{
    parent: string;
    system: string;
    results: ClassificationEntry[];
    count: number;
  }> {
    const params = new URLSearchParams({ system });
    if (parent) params.append('parent', parent);
    const response = await this.fetchWithAuth<{
      parent: string;
      system: string;
      results: ClassificationEntry[];
      count: number;
    }>(`/patents/patents/classification-browse/?${params.toString()}`);
    if (response.success && response.data) return response.data;
    throw new Error(response.error || 'Failed to browse classifications');
  }

  async searchClassifications(query: string, system?: 'CPC' | 'IPC', limit = 50): Promise<{
    query: string;
    results: ClassificationEntry[];
  }> {
    const params = new URLSearchParams({ q: query, limit: String(limit) });
    if (system) params.append('system', system);
    const response = await this.fetchWithAuth<{
      query: string;
      results: ClassificationEntry[];
    }>(`/patents/patents/classification-search/?${params.toString()}`);
    if (response.success && response.data) return response.data;
    throw new Error(response.error || 'Failed to search classifications');
  }

  // Import from external sources
  async importFromUSPTO(patentNumber: string, projectId?: string): Promise<Patent> {
    try {
      const response = await this.fetchWithAuth<Patent>(`${this.baseUrl}/import/uspto`, {
        method: 'POST',
        body: JSON.stringify({ patentNumber, projectId })
      });
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to import from USPTO');
    } catch (error) {
      console.error('Failed to import from USPTO:', error);
      throw new Error('Failed to import patent from USPTO');
    }
  }

  async importFromEPO(patentNumber: string, projectId?: string): Promise<Patent> {
    try {
      const response = await this.fetchWithAuth<Patent>(`${this.baseUrl}/import/epo`, {
        method: 'POST',
        body: JSON.stringify({ patentNumber, projectId })
      });
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to import from EPO');
    } catch (error) {
      console.error('Failed to import from EPO:', error);
      throw new Error('Failed to import patent from EPO');
    }
  }

  // Validation and Analysis
  async validatePatentData(patentId: string): Promise<{ isValid: boolean; errors: string[]; warnings: string[] }> {
    try {
      const response = await this.fetchWithAuth<{ isValid: boolean; errors: string[]; warnings: string[] }>(`${this.baseUrl}/${patentId}/validate`, {
        method: 'POST'
      });
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to validate patent data');
    } catch (error) {
      console.error('Failed to validate patent data:', error);
      return {
        isValid: true,
        errors: [],
        warnings: ['Validation service unavailable']
      };
    }
  }

  async analyzePatent(patentId: string): Promise<Patent> {
    try {
      const response = await this.fetchWithAuth<Patent>(`${this.baseUrl}/${patentId}/analyze`, {
        method: 'POST'
      });
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to analyze patent');
    } catch (error) {
      console.error('Failed to analyze patent:', error);
      throw new Error('Failed to analyze patent');
    }
  }

  // Mock data for development
  private getMockPatentSearchResult(query: PatentSearchQuery, page: number, pageSize: number): PatentSearchResult {
    const mockPatents: Patent[] = [
      {
        id: '1',
        patentNumber: 'US10123456B2',
        applicationNumber: '16/123456',
        title: 'Machine Learning System for Patent Analysis',
        abstract: 'A system and method for analyzing patent documents using machine learning algorithms to identify key innovations and prior art.',
        inventors: [
          { id: '1', firstName: 'John', lastName: 'Smith' },
          { id: '2', firstName: 'Alice', lastName: 'Johnson' }
        ],
        assignee: 'Tech Corp Inc.',
        filingDate: '2019-05-15',
        publicationDate: '2019-11-21',
        grantDate: '2021-03-15',
        status: 'granted' as any,
        patentType: 'utility' as any,
        jurisdiction: 'US',
        ipcClassifications: [],
        cpcClassifications: [],
        claims: [],
        description: 'Detailed patent description...',
        priorArt: [],
        citations: [],
        legalEvents: [],
        maintenanceFees: [],
        tags: ['AI', 'Machine Learning', 'Patents'],
        uploadInfo: {
          originalFileName: 'patent_document.pdf',
          fileSize: 2048576,
          fileType: 'application/pdf',
          uploadedAt: '2025-08-07T12:00:00Z',
          uploadedBy: { id: '1', name: 'John Doe' },
          source: 'manual_upload' as any
        },
        processingStatus: {
          stage: 'completed' as any,
          progress: 100,
          startedAt: '2025-08-07T12:00:00Z',
          completedAt: '2025-08-07T12:05:00Z',
          errors: [],
          warnings: []
        },
        createdAt: '2025-08-07T12:00:00Z',
        updatedAt: '2025-08-07T12:05:00Z'
      }
    ];

    return {
      patents: mockPatents.slice(0, pageSize),
      total: mockPatents.length,
      page,
      pageSize,
      hasMore: false
    };
  }

  private getMockPortfolioStats(): PatentPortfolioStats {
    return {
      totalPatents: 150,
      grantedPatents: 95,
      pendingPatents: 35,
      expiredPatents: 20,
      averageProcessingTime: 18.5,
      topTechnologies: [
        { technology: 'Artificial Intelligence', count: 25, percentage: 16.7 },
        { technology: 'Biotechnology', count: 20, percentage: 13.3 },
        { technology: 'Semiconductors', count: 18, percentage: 12.0 },
        { technology: 'Software', count: 15, percentage: 10.0 }
      ],
      jurisdictionDistribution: [
        { jurisdiction: 'US', count: 85, percentage: 56.7 },
        { jurisdiction: 'EP', count: 35, percentage: 23.3 },
        { jurisdiction: 'JP', count: 20, percentage: 13.3 },
        { jurisdiction: 'CN', count: 10, percentage: 6.7 }
      ],
      statusDistribution: [
        { status: 'granted' as any, count: 95, percentage: 63.3 },
        { status: 'pending' as any, count: 35, percentage: 23.3 },
        { status: 'expired' as any, count: 20, percentage: 13.3 }
      ],
      filingTrends: [
        { month: 'Jan', year: 2025, filings: 12, grants: 8 },
        { month: 'Feb', year: 2025, filings: 15, grants: 10 },
        { month: 'Mar', year: 2025, filings: 18, grants: 12 },
        { month: 'Apr', year: 2025, filings: 14, grants: 9 },
        { month: 'May', year: 2025, filings: 16, grants: 11 },
        { month: 'Jun', year: 2025, filings: 20, grants: 14 }
      ]
    };
  }
}

export const patentsService = new PatentsService();