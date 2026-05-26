/**
 * Document Download API Service
 */

import { ApiClient, ApiResponse } from './apiClient';
import type {
  CrawlJob,
  DiscoveredLink,
  DownloadedFile,
  CreateJobRequest,
  BulkSelectRequest,
  LinkFilters,
  FileFilters,
  JobStats,
  PaginatedResponse,
} from '@/domains/doc-download/types/docDownload.types';

class DocDownloadApiService extends ApiClient {
  private readonly BASE_PATH = '/doc-download';

  // --- Jobs ---

  async getJobs(params?: { status?: string; search?: string; ordering?: string }): Promise<ApiResponse<CrawlJob[]>> {
    return this.get<CrawlJob[]>(`${this.BASE_PATH}/jobs/`, { params });
  }

  async getJob(jobId: string): Promise<ApiResponse<CrawlJob>> {
    return this.get<CrawlJob>(`${this.BASE_PATH}/jobs/${jobId}/`);
  }

  async createJob(data: CreateJobRequest): Promise<ApiResponse<CrawlJob>> {
    return this.post<CrawlJob>(`${this.BASE_PATH}/jobs/`, data);
  }

  async updateJob(jobId: string, data: Partial<CreateJobRequest>): Promise<ApiResponse<CrawlJob>> {
    return this.patch<CrawlJob>(`${this.BASE_PATH}/jobs/${jobId}/`, data);
  }

  async deleteJob(jobId: string): Promise<ApiResponse<void>> {
    return this.delete<void>(`${this.BASE_PATH}/jobs/${jobId}/`);
  }

  // --- Crawl lifecycle ---

  async startCrawl(jobId: string, resume = false): Promise<ApiResponse<{ status: string; task_id: string }>> {
    const endpoint = resume
      ? `${this.BASE_PATH}/jobs/${jobId}/start_crawl/?resume=true`
      : `${this.BASE_PATH}/jobs/${jobId}/start_crawl/`;
    return this.post(endpoint);
  }

  async pauseJob(jobId: string): Promise<ApiResponse<{ status: string }>> {
    return this.post(`${this.BASE_PATH}/jobs/${jobId}/pause/`);
  }

  async stopJob(jobId: string): Promise<ApiResponse<{ status: string }>> {
    return this.post(`${this.BASE_PATH}/jobs/${jobId}/stop/`);
  }

  async startDownload(
    jobId: string,
    resume = false
  ): Promise<ApiResponse<{ status: string; task_id: string; files_to_download: number }>> {
    const endpoint = resume
      ? `${this.BASE_PATH}/jobs/${jobId}/start_download/?resume=true`
      : `${this.BASE_PATH}/jobs/${jobId}/start_download/`;
    return this.post(endpoint);
  }

  // --- Progress & stats ---

  async getJobProgress(jobId: string): Promise<ApiResponse<{
    status: string;
    progress: CrawlJob['progress'];
    started_at: string | null;
    paused_at: string | null;
    completed_at: string | null;
    error_message: string;
  }>> {
    return this.get(`${this.BASE_PATH}/jobs/${jobId}/progress/`);
  }

  async getJobStats(jobId: string): Promise<ApiResponse<JobStats>> {
    return this.get<JobStats>(`${this.BASE_PATH}/jobs/${jobId}/stats/`);
  }

  // --- Links ---

  async getJobLinks(
    jobId: string,
    filters?: LinkFilters
  ): Promise<ApiResponse<PaginatedResponse<DiscoveredLink>>> {
    return this.get<PaginatedResponse<DiscoveredLink>>(
      `${this.BASE_PATH}/jobs/${jobId}/links/`,
      { params: filters as Record<string, any> }
    );
  }

  async selectLinks(
    jobId: string,
    data: BulkSelectRequest
  ): Promise<ApiResponse<{ updated: number; select: boolean; total_selected: number }>> {
    return this.post(`${this.BASE_PATH}/jobs/${jobId}/select_links/`, data);
  }

  // --- Files ---

  async getFiles(filters?: FileFilters): Promise<ApiResponse<PaginatedResponse<DownloadedFile>>> {
    return this.get<PaginatedResponse<DownloadedFile>>(
      `${this.BASE_PATH}/files/`,
      { params: filters as Record<string, any> }
    );
  }

  async getFile(fileId: string): Promise<ApiResponse<DownloadedFile>> {
    return this.get<DownloadedFile>(`${this.BASE_PATH}/files/${fileId}/`);
  }

  async downloadFile(fileId: string): Promise<void> {
    const baseURL = this.baseURL;
    const token = this.getAccessToken();
    const response = await fetch(`${baseURL}${this.BASE_PATH}/files/${fileId}/download/`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) throw new Error('Download failed');

    const blob = await response.blob();
    const contentDisposition = response.headers.get('content-disposition');
    let filename = 'download';
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

  getPreviewUrl(fileId: string): string {
    return `${this.baseURL}${this.BASE_PATH}/files/${fileId}/preview/`;
  }
}

export const docDownloadApi = new DocDownloadApiService();
