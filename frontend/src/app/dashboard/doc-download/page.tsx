'use client';

import React, { useState, useCallback } from 'react';
import { Plus, Download, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDocDownloadJobs, useDocDownloadJob } from '@/domains/doc-download/hooks/useDocDownload';
import { useDocDownloadStore } from '@/domains/doc-download/store/docDownload.store';
import { CrawlJobList } from '@/domains/doc-download/components/CrawlJobList';
import { CrawlJobDetail } from '@/domains/doc-download/components/CrawlJobDetail';
import { NewCrawlJobDialog } from '@/domains/doc-download/components/NewCrawlJobDialog';
import type { CreateJobRequest, CrawlJob } from '@/domains/doc-download/types/docDownload.types';

export default function DocDownloadPage() {
  const { jobs, isLoading, createJob, deleteJob, fetchJobs } = useDocDownloadJobs();
  const { currentJob, setCurrentJob } = useDocDownloadStore();
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [jobSearch, setJobSearch] = useState('');

  const { job, stats, startCrawl, pauseJob, stopJob, startDownload } = useDocDownloadJob(
    currentJob?.id ?? null
  );

  const handleCreateJob = useCallback(async (data: CreateJobRequest) => {
    const newJob = await createJob(data);
    if (newJob) {
      setCurrentJob(newJob);
    }
  }, [createJob, setCurrentJob]);

  const handleSelectJob = useCallback((selectedJob: CrawlJob) => {
    setCurrentJob(selectedJob);
  }, [setCurrentJob]);

  const handleDeleteJob = useCallback(async (jobId: string) => {
    await deleteJob(jobId);
  }, [deleteJob]);

  const filteredJobs = jobSearch
    ? jobs.filter(j =>
        j.title.toLowerCase().includes(jobSearch.toLowerCase()) ||
        j.target_url.toLowerCase().includes(jobSearch.toLowerCase())
      )
    : jobs;

  return (
    <div className="h-full flex flex-col">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Doc Download</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Crawl websites and download documents, datasheets, and product information
          </p>
        </div>
        <Button onClick={() => setShowNewDialog(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          New Crawl
        </Button>
      </div>

      {/* Main layout */}
      <div className="flex-1 flex gap-6 min-h-0">
        {/* Left panel — Job list */}
        <div className="w-80 shrink-0 flex flex-col">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <Input
              className="pl-9"
              placeholder="Search jobs..."
              value={jobSearch}
              onChange={e => setJobSearch(e.target.value)}
              aria-label="Search crawl jobs"
            />
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12 text-neutral-400">
                Loading jobs...
              </div>
            ) : (
              <CrawlJobList
                jobs={filteredJobs}
                selectedJobId={currentJob?.id ?? null}
                onSelectJob={handleSelectJob}
                onDeleteJob={handleDeleteJob}
              />
            )}
          </div>
        </div>

        {/* Right panel — Job detail */}
        <div className="flex-1 min-w-0 overflow-y-auto">
          {job ? (
            <CrawlJobDetail
              job={job}
              stats={stats}
              onStartCrawl={startCrawl}
              onPause={pauseJob}
              onStop={stopJob}
              onStartDownload={startDownload}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="rounded-full bg-neutral-100 p-6 mb-4">
                <Download className="h-12 w-12 text-neutral-300" />
              </div>
              <h3 className="text-lg font-medium text-neutral-600">
                {jobs.length === 0 ? 'Create your first crawl job' : 'Select a job'}
              </h3>
              <p className="text-sm text-neutral-400 mt-2 max-w-sm">
                {jobs.length === 0
                  ? 'Enter a website URL to crawl, discover documents, and download product information.'
                  : 'Click a job from the list to view its discovered links and downloaded files.'}
              </p>
              {jobs.length === 0 && (
                <Button className="mt-4" onClick={() => setShowNewDialog(true)}>
                  <Plus className="h-4 w-4 mr-1.5" />
                  New Crawl Job
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* New job dialog */}
      <NewCrawlJobDialog
        open={showNewDialog}
        onOpenChange={setShowNewDialog}
        onSubmit={handleCreateJob}
      />
    </div>
  );
}
