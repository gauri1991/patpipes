/**
 * Document Download Store
 * Global state management for doc download feature using Zustand
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { docDownloadApi } from '@/services/docDownloadApi';
import type {
  CrawlJob,
  DiscoveredLink,
  DownloadedFile,
  JobStats,
  CrawlJobProgress,
  CreateJobRequest,
  BulkSelectRequest,
  LinkFilters,
  FileFilters,
  LinkCategory,
} from '../types/docDownload.types';

interface DocDownloadState {
  // Data
  jobs: CrawlJob[];
  currentJob: CrawlJob | null;
  links: DiscoveredLink[];
  linksTotal: number;
  files: DownloadedFile[];
  filesTotal: number;
  jobStats: JobStats | null;

  // UI state
  isLoading: boolean;
  isLoadingLinks: boolean;
  isLoadingFiles: boolean;
  error: string | null;
  selectedCategory: LinkCategory | 'all';
  linkFilter: 'all' | 'selected' | 'downloaded';
  searchQuery: string;
  activeTab: 'links' | 'files' | 'explorer';

  // Polling
  pollingIntervalId: ReturnType<typeof setInterval> | null;
  pollingDelay: number;

  // Actions — Jobs
  fetchJobs: (params?: { status?: string; search?: string }) => Promise<void>;
  fetchJob: (jobId: string) => Promise<void>;
  createJob: (data: CreateJobRequest) => Promise<CrawlJob | null>;
  deleteJob: (jobId: string) => Promise<void>;

  // Actions — Lifecycle
  startCrawl: (jobId: string, resume?: boolean) => Promise<void>;
  pauseJob: (jobId: string) => Promise<void>;
  stopJob: (jobId: string) => Promise<void>;
  startDownload: (jobId: string, resume?: boolean) => Promise<void>;

  // Actions — Links & Selection
  fetchLinks: (jobId: string, filters?: LinkFilters) => Promise<void>;
  selectLinks: (jobId: string, data: BulkSelectRequest) => Promise<void>;

  // Actions — Files
  fetchFiles: (filters?: FileFilters) => Promise<void>;
  fetchJobStats: (jobId: string) => Promise<void>;

  // Actions — Polling
  startPolling: (jobId: string) => void;
  stopPolling: () => void;

  // Actions — UI
  setSelectedCategory: (category: LinkCategory | 'all') => void;
  setLinkFilter: (filter: 'all' | 'selected' | 'downloaded') => void;
  setSearchQuery: (query: string) => void;
  setActiveTab: (tab: 'links' | 'files' | 'explorer') => void;
  setCurrentJob: (job: CrawlJob | null) => void;
  clearError: () => void;
}

export const useDocDownloadStore = create<DocDownloadState>()(
  devtools(
    (set, get) => ({
      // Initial state
      jobs: [],
      currentJob: null,
      links: [],
      linksTotal: 0,
      files: [],
      filesTotal: 0,
      jobStats: null,
      isLoading: false,
      isLoadingLinks: false,
      isLoadingFiles: false,
      error: null,
      selectedCategory: 'all',
      linkFilter: 'all',
      searchQuery: '',
      activeTab: 'links',
      pollingIntervalId: null,
      pollingDelay: 2000,

      // --- Jobs ---

      fetchJobs: async (params) => {
        set({ isLoading: true, error: null });
        try {
          const response = await docDownloadApi.getJobs(params);
          if (response.success && response.data) {
            // Handle both paginated and non-paginated responses
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
          const response = await docDownloadApi.getJob(jobId);
          if (response.success && response.data) {
            set({ currentJob: response.data });
            // Update in jobs list too
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
          const response = await docDownloadApi.createJob(data);
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
          await docDownloadApi.deleteJob(jobId);
          set(state => ({
            jobs: state.jobs.filter(j => j.id !== jobId),
            currentJob: state.currentJob?.id === jobId ? null : state.currentJob,
          }));
        } catch (e: any) {
          set({ error: e.message });
        }
      },

      // --- Lifecycle ---

      startCrawl: async (jobId, resume = false) => {
        try {
          const response = await docDownloadApi.startCrawl(jobId, resume);
          if (response.success) {
            await get().fetchJob(jobId);
            get().startPolling(jobId);
          } else {
            set({ error: response.error || 'Failed to start crawl' });
          }
        } catch (e: any) {
          set({ error: e.message });
        }
      },

      pauseJob: async (jobId) => {
        try {
          const response = await docDownloadApi.pauseJob(jobId);
          if (response.success) {
            get().stopPolling();
            await get().fetchJob(jobId);
          }
        } catch (e: any) {
          set({ error: e.message });
        }
      },

      stopJob: async (jobId) => {
        try {
          const response = await docDownloadApi.stopJob(jobId);
          if (response.success) {
            get().stopPolling();
            await get().fetchJob(jobId);
          }
        } catch (e: any) {
          set({ error: e.message });
        }
      },

      startDownload: async (jobId, resume = false) => {
        try {
          const response = await docDownloadApi.startDownload(jobId, resume);
          if (response.success) {
            await get().fetchJob(jobId);
            get().startPolling(jobId);
          } else {
            set({ error: response.error || 'Failed to start download' });
          }
        } catch (e: any) {
          set({ error: e.message });
        }
      },

      // --- Links ---

      fetchLinks: async (jobId, filters) => {
        set({ isLoadingLinks: true });
        try {
          const response = await docDownloadApi.getJobLinks(jobId, filters);
          if (response.success && response.data) {
            set({
              links: response.data.results,
              linksTotal: response.data.count,
              isLoadingLinks: false,
            });
          } else {
            set({ isLoadingLinks: false });
          }
        } catch (e: any) {
          set({ isLoadingLinks: false, error: e.message });
        }
      },

      selectLinks: async (jobId, data) => {
        try {
          // Optimistic update
          if (data.link_ids && data.link_ids.length > 0) {
            set(state => ({
              links: state.links.map(link =>
                data.link_ids!.includes(link.id)
                  ? { ...link, is_selected: data.select }
                  : link
              ),
            }));
          }

          const response = await docDownloadApi.selectLinks(jobId, data);
          if (response.success) {
            // Refresh stats
            await get().fetchJobStats(jobId);
          }
        } catch (e: any) {
          set({ error: e.message });
          // Revert optimistic update
          await get().fetchLinks(jobId);
        }
      },

      // --- Files ---

      fetchFiles: async (filters) => {
        set({ isLoadingFiles: true });
        try {
          const response = await docDownloadApi.getFiles(filters);
          if (response.success && response.data) {
            set({
              files: response.data.results,
              filesTotal: response.data.count,
              isLoadingFiles: false,
            });
          } else {
            set({ isLoadingFiles: false });
          }
        } catch (e: any) {
          set({ isLoadingFiles: false, error: e.message });
        }
      },

      fetchJobStats: async (jobId) => {
        try {
          const response = await docDownloadApi.getJobStats(jobId);
          if (response.success && response.data) {
            set({ jobStats: response.data });
          }
        } catch (e: any) {
          // Silent — stats are supplementary
        }
      },

      // --- Polling ---

      startPolling: (jobId) => {
        const { pollingIntervalId } = get();
        if (pollingIntervalId) clearInterval(pollingIntervalId);

        let delay = 2000;
        const poll = async () => {
          try {
            const response = await docDownloadApi.getJobProgress(jobId);
            if (response.success && response.data) {
              const progressData = response.data;
              set(state => ({
                currentJob: state.currentJob
                  ? {
                      ...state.currentJob,
                      status: progressData.status as any,
                      progress: progressData.progress,
                      started_at: progressData.started_at,
                      paused_at: progressData.paused_at,
                      completed_at: progressData.completed_at,
                      error_message: progressData.error_message,
                    }
                  : null,
              }));

              // Stop polling when job is done
              const doneStatuses = ['discovered', 'completed', 'failed', 'cancelled', 'paused'];
              if (doneStatuses.includes(progressData.status)) {
                get().stopPolling();
                await get().fetchJob(jobId);
                await get().fetchJobStats(jobId);
              }

              // Adaptive backoff: slow down when crawl rate drops
              const rate = progressData.progress?.crawl_rate_pages_per_min || 0;
              if (rate < 5) {
                delay = Math.min(delay + 1000, 10000);
              }
            }
          } catch {
            // Silent — polling is best-effort
          }
        };

        const id = setInterval(poll, delay);
        set({ pollingIntervalId: id, pollingDelay: delay });

        // Immediate first poll
        poll();
      },

      stopPolling: () => {
        const { pollingIntervalId } = get();
        if (pollingIntervalId) {
          clearInterval(pollingIntervalId);
          set({ pollingIntervalId: null });
        }
      },

      // --- UI ---

      setSelectedCategory: (category) => set({ selectedCategory: category }),
      setLinkFilter: (filter) => set({ linkFilter: filter }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setActiveTab: (tab) => set({ activeTab: tab }),
      setCurrentJob: (job) => set({ currentJob: job }),
      clearError: () => set({ error: null }),
    }),
    { name: 'doc-download-store' }
  )
);
