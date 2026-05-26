/**
 * FCC Data Store
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { fccDataApi } from '@/services/fccDataApi';
import type {
  FCCQueryJob,
  FCCAuthorization,
  FCCExportFile,
  FCCDocument,
  JobStats,
  CreateQueryRequest,
  ResultFilters,
  ExportFormat,
} from '../types/fccData.types';

interface FCCDataState {
  // Data
  jobs: FCCQueryJob[];
  currentJob: FCCQueryJob | null;
  results: FCCAuthorization[];
  resultsTotal: number;
  jobStats: JobStats | null;
  exports: FCCExportFile[];

  // Documents
  documents: FCCDocument[];
  documentsTotal: number;
  isFetchingDocs: boolean;
  isDownloadingDocs: boolean;

  // UI
  isLoading: boolean;
  isQuerying: boolean;
  isExporting: boolean;
  isLoadingResults: boolean;
  error: string | null;

  // Polling
  pollingId: ReturnType<typeof setInterval> | null;

  // Actions
  fetchJobs: () => Promise<void>;
  fetchJob: (jobId: string) => Promise<void>;
  createJob: (data: CreateQueryRequest) => Promise<FCCQueryJob | null>;
  deleteJob: (jobId: string) => Promise<void>;
  executeQuery: (jobId: string) => Promise<void>;
  fetchResults: (jobId: string, filters?: ResultFilters) => Promise<void>;
  fetchJobStats: (jobId: string) => Promise<void>;
  fetchExports: (jobId: string) => Promise<void>;
  removeResults: (jobId: string, data: { result_ids?: string[]; fcc_ids?: string[] }) => Promise<void>;
  exportResults: (jobId: string, format: ExportFormat) => Promise<void>;
  // Document actions
  fetchDocumentsForFccId: (jobId: string, fccId: string) => Promise<void>;
  getDocuments: (jobId: string, filters?: { fcc_id?: string; document_type?: string }) => Promise<void>;
  downloadDocuments: (jobId: string, documentIds: string[]) => Promise<void>;
  downloadAllDocuments: (jobId: string, fccId: string) => Promise<void>;

  setCurrentJob: (job: FCCQueryJob | null) => void;
  startPolling: (jobId: string) => void;
  stopPolling: () => void;
  clearError: () => void;
}

export const useFCCDataStore = create<FCCDataState>()(
  devtools(
    (set, get) => ({
      jobs: [],
      currentJob: null,
      results: [],
      resultsTotal: 0,
      jobStats: null,
      exports: [],
      documents: [],
      documentsTotal: 0,
      isFetchingDocs: false,
      isDownloadingDocs: false,
      isLoading: false,
      isQuerying: false,
      isExporting: false,
      isLoadingResults: false,
      error: null,
      pollingId: null,

      fetchJobs: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await fccDataApi.getJobs();
          if (response.success && response.data) {
            const jobs = Array.isArray(response.data)
              ? response.data
              : (response.data as any).results || [];
            set({ jobs, isLoading: false });
          } else {
            set({ error: response.error || 'Failed to fetch jobs', isLoading: false });
          }
        } catch (e: any) {
          set({ error: e.message, isLoading: false });
        }
      },

      fetchJob: async (jobId) => {
        try {
          const response = await fccDataApi.getJob(jobId);
          if (response.success && response.data) {
            set({ currentJob: response.data });
            const jobs = get().jobs.map(j => j.id === jobId ? response.data! : j);
            set({ jobs });
          }
        } catch (e: any) {
          set({ error: e.message });
        }
      },

      createJob: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fccDataApi.createJob(data);
          if (response.success && response.data) {
            set(state => ({
              jobs: [response.data!, ...state.jobs],
              currentJob: response.data!,
              isLoading: false,
            }));
            return response.data;
          }
          set({ error: response.error || 'Failed to create job', isLoading: false });
          return null;
        } catch (e: any) {
          set({ error: e.message, isLoading: false });
          return null;
        }
      },

      deleteJob: async (jobId) => {
        try {
          await fccDataApi.deleteJob(jobId);
          set(state => ({
            jobs: state.jobs.filter(j => j.id !== jobId),
            currentJob: state.currentJob?.id === jobId ? null : state.currentJob,
          }));
        } catch (e: any) {
          set({ error: e.message });
        }
      },

      executeQuery: async (jobId) => {
        set({ isQuerying: true, error: null });
        try {
          const response = await fccDataApi.executeQuery(jobId);
          if (response.success) {
            get().startPolling(jobId);
            await get().fetchJob(jobId);
          } else {
            set({ error: response.error || 'Failed to execute query' });
          }
        } catch (e: any) {
          set({ error: e.message });
        } finally {
          set({ isQuerying: false });
        }
      },

      fetchResults: async (jobId, filters) => {
        set({ isLoadingResults: true });
        try {
          const response = await fccDataApi.getResults(jobId, filters);
          if (response.success && response.data) {
            const isLoadMore = (filters?.offset || 0) > 0;
            set(state => ({
              results: isLoadMore
                ? [...state.results, ...response.data!.results]
                : response.data!.results,
              resultsTotal: response.data!.count,
              isLoadingResults: false,
            }));
          } else {
            set({ isLoadingResults: false });
          }
        } catch (e: any) {
          set({ isLoadingResults: false, error: e.message });
        }
      },

      fetchJobStats: async (jobId) => {
        try {
          const response = await fccDataApi.getJobStats(jobId);
          if (response.success && response.data) {
            set({ jobStats: response.data });
          }
        } catch {
          // Silent
        }
      },

      fetchExports: async (jobId) => {
        try {
          const response = await fccDataApi.getExports(jobId);
          if (response.success && response.data) {
            const exports = Array.isArray(response.data)
              ? response.data
              : (response.data as any).results || [];
            set({ exports });
          }
        } catch {
          // Silent
        }
      },

      removeResults: async (jobId, data) => {
        try {
          const response = await fccDataApi.removeResults(jobId, data);
          if (response.success && response.data) {
            // Remove from local state
            if (data.result_ids) {
              set(state => ({
                results: state.results.filter(r => !data.result_ids!.includes(r.id)),
                resultsTotal: response.data!.remaining,
              }));
            } else if (data.fcc_ids) {
              set(state => ({
                results: state.results.filter(r => !data.fcc_ids!.includes(r.fcc_id)),
                resultsTotal: response.data!.remaining,
              }));
            }
            // Update job results count
            set(state => ({
              currentJob: state.currentJob
                ? { ...state.currentJob, results_count: response.data!.remaining }
                : null,
            }));
            await get().fetchJobStats(jobId);
          } else {
            set({ error: response.error || 'Failed to remove results' });
          }
        } catch (e: any) {
          set({ error: e.message });
        }
      },

      exportResults: async (jobId, format) => {
        set({ isExporting: true, error: null });
        try {
          const response = await fccDataApi.exportResults(jobId, format);
          if (response.success && response.data) {
            set(state => ({ exports: [response.data!, ...state.exports], isExporting: false }));
          } else {
            set({ error: response.error || 'Export failed', isExporting: false });
          }
        } catch (e: any) {
          set({ error: e.message, isExporting: false });
        }
      },

      // --- Documents ---

      fetchDocumentsForFccId: async (jobId, fccId) => {
        set({ isFetchingDocs: true, error: null });
        try {
          const response = await fccDataApi.fetchDocuments(jobId, fccId);
          if (response.success) {
            // Refresh document list
            await get().getDocuments(jobId, { fcc_id: fccId });
          } else {
            set({ error: response.error || 'Failed to fetch documents' });
          }
        } catch (e: any) {
          set({ error: e.message });
        } finally {
          set({ isFetchingDocs: false });
        }
      },

      getDocuments: async (jobId, filters) => {
        try {
          const response = await fccDataApi.getDocuments(jobId, { ...filters, limit: 200 });
          if (response.success && response.data) {
            set({
              documents: response.data.results,
              documentsTotal: response.data.count,
            });
          }
        } catch (e: any) {
          set({ error: e.message });
        }
      },

      downloadDocuments: async (jobId, documentIds) => {
        set({ isDownloadingDocs: true, error: null });
        try {
          const response = await fccDataApi.downloadDocuments(jobId, { document_ids: documentIds });
          if (response.success) {
            // Refresh document list to update is_downloaded status
            await get().getDocuments(jobId);
          } else {
            set({ error: response.error || 'Download failed' });
          }
        } catch (e: any) {
          set({ error: e.message });
        } finally {
          set({ isDownloadingDocs: false });
        }
      },

      downloadAllDocuments: async (jobId, fccId) => {
        set({ isDownloadingDocs: true, error: null });
        try {
          const response = await fccDataApi.downloadDocuments(jobId, { fcc_id: fccId });
          if (response.success) {
            await get().getDocuments(jobId, { fcc_id: fccId });
          } else {
            set({ error: response.error || 'Download failed' });
          }
        } catch (e: any) {
          set({ error: e.message });
        } finally {
          set({ isDownloadingDocs: false });
        }
      },

      setCurrentJob: (job) => set({ currentJob: job }),

      startPolling: (jobId) => {
        get().stopPolling();
        const id = setInterval(async () => {
          const response = await fccDataApi.getJob(jobId);
          if (response.success && response.data) {
            set({ currentJob: response.data });
            const jobs = get().jobs.map(j => j.id === jobId ? response.data! : j);
            set({ jobs });

            if (['completed', 'failed'].includes(response.data.status)) {
              get().stopPolling();
              await get().fetchResults(jobId, { limit: 50, offset: 0 });
              await get().fetchJobStats(jobId);
              await get().fetchExports(jobId);
            }
          }
        }, 2000);
        set({ pollingId: id });
      },

      stopPolling: () => {
        const { pollingId } = get();
        if (pollingId) {
          clearInterval(pollingId);
          set({ pollingId: null });
        }
      },

      clearError: () => set({ error: null }),
    }),
    { name: 'fcc-data-store' }
  )
);
