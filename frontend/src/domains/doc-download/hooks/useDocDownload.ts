/**
 * Document Download Hooks
 */

import { useEffect, useCallback, useRef } from 'react';
import { useDocDownloadStore } from '../store/docDownload.store';
import type { LinkFilters, FileFilters, LinkCategory } from '../types/docDownload.types';

/**
 * Hook for fetching and managing the crawl jobs list.
 */
export function useDocDownloadJobs() {
  const {
    jobs, isLoading, error, fetchJobs, createJob, deleteJob, clearError,
  } = useDocDownloadStore();

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  return { jobs, isLoading, error, fetchJobs, createJob, deleteJob, clearError };
}

/**
 * Hook for a single crawl job with auto-polling when active.
 */
export function useDocDownloadJob(jobId: string | null) {
  const {
    currentJob, jobStats, error,
    fetchJob, fetchJobStats, setCurrentJob,
    startCrawl, pauseJob, stopJob, startDownload,
    startPolling, stopPolling, clearError,
  } = useDocDownloadStore();

  useEffect(() => {
    if (!jobId) {
      setCurrentJob(null);
      return;
    }
    fetchJob(jobId);
    fetchJobStats(jobId);
  }, [jobId, fetchJob, fetchJobStats, setCurrentJob]);

  // Auto-start polling for active jobs
  useEffect(() => {
    if (!currentJob) return;
    const activeStatuses = ['crawling', 'downloading'];
    if (activeStatuses.includes(currentJob.status)) {
      startPolling(currentJob.id);
    }
    return () => {
      stopPolling();
    };
  }, [currentJob?.id, currentJob?.status, startPolling, stopPolling]);

  return {
    job: currentJob,
    stats: jobStats,
    error,
    startCrawl,
    pauseJob,
    stopJob,
    startDownload,
    clearError,
  };
}

/**
 * Hook for paginated, filtered links within a job.
 */
export function useJobLinks(jobId: string | null) {
  const {
    links, linksTotal, isLoadingLinks,
    selectedCategory, linkFilter, searchQuery,
    fetchLinks, selectLinks,
    setSelectedCategory, setLinkFilter, setSearchQuery,
  } = useDocDownloadStore();

  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const offsetRef = useRef(0);

  const buildFilters = useCallback((): LinkFilters => {
    const filters: LinkFilters = {
      limit: 50,
      offset: offsetRef.current,
    };
    if (selectedCategory !== 'all') {
      filters.category = selectedCategory;
    }
    if (linkFilter === 'selected') {
      filters.is_selected = 'true';
    } else if (linkFilter === 'downloaded') {
      filters.is_downloaded = 'true';
    }
    if (searchQuery) {
      filters.search = searchQuery;
    }
    return filters;
  }, [selectedCategory, linkFilter, searchQuery]);

  const refresh = useCallback(() => {
    if (!jobId) return;
    fetchLinks(jobId, buildFilters());
  }, [jobId, fetchLinks, buildFilters]);

  // Fetch when filters change
  useEffect(() => {
    offsetRef.current = 0;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(refresh, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [selectedCategory, linkFilter, searchQuery, jobId, refresh]);

  const loadMore = useCallback(() => {
    if (!jobId || links.length >= linksTotal) return;
    offsetRef.current += 50;
    fetchLinks(jobId, buildFilters());
  }, [jobId, links.length, linksTotal, fetchLinks, buildFilters]);

  return {
    links,
    linksTotal,
    isLoading: isLoadingLinks,
    selectedCategory,
    linkFilter,
    searchQuery,
    setSelectedCategory,
    setLinkFilter,
    setSearchQuery,
    selectLinks: (data: any) => jobId ? selectLinks(jobId, data) : Promise.resolve(),
    refresh,
    loadMore,
  };
}

/**
 * Hook for browsing downloaded files (cross-job or per-job).
 */
export function useJobFiles(jobId?: string | null) {
  const {
    files, filesTotal, isLoadingFiles, fetchFiles,
  } = useDocDownloadStore();

  const fetchRef = useRef(fetchFiles);
  fetchRef.current = fetchFiles;

  useEffect(() => {
    const filters: FileFilters = { limit: 50, offset: 0 };
    if (jobId) filters.job = jobId;
    fetchRef.current(filters);
  }, [jobId]);

  const loadMore = useCallback((offset: number, filters?: Partial<FileFilters>) => {
    const params: FileFilters = { limit: 50, offset, ...filters };
    if (jobId) params.job = jobId;
    fetchRef.current(params);
  }, [jobId]);

  return {
    files,
    filesTotal,
    isLoading: isLoadingFiles,
    loadMore,
    refresh: () => {
      const filters: FileFilters = { limit: 50, offset: 0 };
      if (jobId) filters.job = jobId;
      fetchRef.current(filters);
    },
  };
}

/**
 * Hook for the cross-job data explorer with search and filters.
 */
export function useFileExplorer() {
  const { files, filesTotal, isLoadingFiles, fetchFiles } = useDocDownloadStore();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const search = useCallback((filters: FileFilters) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchFiles(filters);
    }, 350);
  }, [fetchFiles]);

  useEffect(() => {
    fetchFiles({ limit: 50, offset: 0 });
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [fetchFiles]);

  return { files, filesTotal, isLoading: isLoadingFiles, search, fetchFiles };
}
