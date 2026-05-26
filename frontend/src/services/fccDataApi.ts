/**
 * FCC Data API Service
 */

import { ApiClient, ApiResponse } from './apiClient';
import type {
  FCCGrantee,
  FCCQueryJob,
  FCCAuthorization,
  FCCExportFile,
  FCCDocument,
  CreateQueryRequest,
  ResultFilters,
  JobStats,
  PaginatedResponse,
  ExportFormat,
} from '@/domains/fcc-data/types/fccData.types';

class FCCDataApiService extends ApiClient {
  private readonly BASE_PATH = '/fcc';

  // --- Grantees ---

  async searchGrantees(search: string, limit = 20): Promise<ApiResponse<PaginatedResponse<FCCGrantee>>> {
    return this.get<PaginatedResponse<FCCGrantee>>(
      `${this.BASE_PATH}/grantees/`,
      { params: { search, limit: String(limit) } }
    );
  }

  // --- Jobs ---

  async getJobs(params?: { query_type?: string; status?: string; search?: string }): Promise<ApiResponse<FCCQueryJob[]>> {
    return this.get<FCCQueryJob[]>(`${this.BASE_PATH}/jobs/`, { params });
  }

  async getJob(jobId: string): Promise<ApiResponse<FCCQueryJob>> {
    return this.get<FCCQueryJob>(`${this.BASE_PATH}/jobs/${jobId}/`);
  }

  async createJob(data: CreateQueryRequest): Promise<ApiResponse<FCCQueryJob>> {
    return this.post<FCCQueryJob>(`${this.BASE_PATH}/jobs/`, data);
  }

  async deleteJob(jobId: string): Promise<ApiResponse<void>> {
    return this.delete<void>(`${this.BASE_PATH}/jobs/${jobId}/`);
  }

  // --- Query execution ---

  async executeQuery(jobId: string): Promise<ApiResponse<{ status: string; task_id: string }>> {
    return this.post(`${this.BASE_PATH}/jobs/${jobId}/execute/`);
  }

  // --- Results ---

  async getResults(jobId: string, filters?: ResultFilters): Promise<ApiResponse<PaginatedResponse<FCCAuthorization>>> {
    return this.get<PaginatedResponse<FCCAuthorization>>(
      `${this.BASE_PATH}/jobs/${jobId}/results/`,
      { params: filters as Record<string, any> }
    );
  }

  async getJobStats(jobId: string): Promise<ApiResponse<JobStats>> {
    return this.get<JobStats>(`${this.BASE_PATH}/jobs/${jobId}/stats/`);
  }

  // --- Remove results ---

  async removeResults(
    jobId: string,
    data: { result_ids?: string[]; fcc_ids?: string[] }
  ): Promise<ApiResponse<{ deleted: number; remaining: number }>> {
    return this.post(`${this.BASE_PATH}/jobs/${jobId}/remove_results/`, data);
  }

  // --- Export ---

  async exportResults(jobId: string, format: ExportFormat): Promise<ApiResponse<FCCExportFile>> {
    return this.post<FCCExportFile>(`${this.BASE_PATH}/jobs/${jobId}/export/`, { format });
  }

  async downloadExport(exportId: string): Promise<void> {
    const baseURL = this.baseURL;
    const token = this.getAccessToken();
    const response = await fetch(`${baseURL}${this.BASE_PATH}/exports/${exportId}/download/`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) throw new Error('Download failed');

    const blob = await response.blob();
    const contentDisposition = response.headers.get('content-disposition');
    let filename = 'fcc_export';
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="(.+)"/);
      if (match) filename = match[1];
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async getExports(jobId?: string): Promise<ApiResponse<FCCExportFile[]>> {
    const params = jobId ? { job: jobId } : undefined;
    return this.get<FCCExportFile[]>(`${this.BASE_PATH}/exports/`, { params });
  }

  // --- Documents ---

  async fetchDocuments(jobId: string, fccId: string): Promise<ApiResponse<{ status: string; documents_found: number }>> {
    return this.post(`${this.BASE_PATH}/jobs/${jobId}/fetch_documents/`, { fcc_id: fccId });
  }

  async getDocuments(
    jobId: string,
    filters?: { fcc_id?: string; document_type?: string; is_downloaded?: string; limit?: number; offset?: number }
  ): Promise<ApiResponse<PaginatedResponse<FCCDocument>>> {
    return this.get<PaginatedResponse<FCCDocument>>(
      `${this.BASE_PATH}/jobs/${jobId}/documents/`,
      { params: filters as Record<string, any> }
    );
  }

  async downloadDocuments(
    jobId: string,
    data: { document_ids?: string[]; fcc_id?: string; all?: boolean }
  ): Promise<ApiResponse<{ status: string; downloaded: number; total: number }>> {
    return this.post(`${this.BASE_PATH}/jobs/${jobId}/download_documents/`, data);
  }

  async downloadDocument(documentId: string): Promise<void> {
    const baseURL = this.baseURL;
    const token = this.getAccessToken();
    const response = await fetch(`${baseURL}${this.BASE_PATH}/documents/${documentId}/download/`, {
      headers: { ...(token && { Authorization: `Bearer ${token}` }) },
    });

    if (!response.ok) throw new Error('Download failed');

    const blob = await response.blob();
    const contentDisposition = response.headers.get('content-disposition');
    let filename = 'fcc_document';
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="(.+)"/);
      if (match) filename = match[1];
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

export const fccDataApi = new FCCDataApiService();
