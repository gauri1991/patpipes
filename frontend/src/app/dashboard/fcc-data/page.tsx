'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Radio, Search, Play, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useFCCDataStore } from '@/domains/fcc-data/store/fccData.store';
import { QueryJobList } from '@/domains/fcc-data/components/QueryJobList';
import { NewQueryDialog } from '@/domains/fcc-data/components/NewQueryDialog';
import { ResultsTable } from '@/domains/fcc-data/components/ResultsTable';
import { QueryStats } from '@/domains/fcc-data/components/QueryStats';
import { ExportBar } from '@/domains/fcc-data/components/ExportBar';
import type { CreateQueryRequest, FCCQueryJob } from '@/domains/fcc-data/types/fccData.types';

export default function FCCDataPage() {
  const {
    jobs, currentJob, results, resultsTotal, jobStats, exports,
    isLoading, isQuerying, isExporting, isLoadingResults, error,
    fetchJobs, fetchJob, createJob, deleteJob, executeQuery,
    fetchResults, fetchJobStats, fetchExports, removeResults, exportResults,
    setCurrentJob, clearError,
  } = useFCCDataStore();

  const [showNewDialog, setShowNewDialog] = useState(false);
  const [jobSearch, setJobSearch] = useState('');

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Load job data when selected
  useEffect(() => {
    if (currentJob && currentJob.status === 'completed') {
      fetchResults(currentJob.id, { limit: 50, offset: 0 });
      fetchJobStats(currentJob.id);
      fetchExports(currentJob.id);
    }
  }, [currentJob?.id, currentJob?.status, fetchResults, fetchJobStats, fetchExports]);

  const handleCreateJob = useCallback(async (data: CreateQueryRequest) => {
    const newJob = await createJob(data);
    if (newJob) {
      // Auto-execute the query
      await executeQuery(newJob.id);
    }
  }, [createJob, executeQuery]);

  const handleSelectJob = useCallback((job: FCCQueryJob) => {
    setCurrentJob(job);
  }, [setCurrentJob]);

  const filteredJobs = jobSearch
    ? jobs.filter(j =>
        j.title.toLowerCase().includes(jobSearch.toLowerCase()) ||
        j.fcc_id.toLowerCase().includes(jobSearch.toLowerCase())
      )
    : jobs;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">FCC Equipment Data</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Query FCC equipment authorization records via the OET Lab Services API
          </p>
        </div>
        <Button onClick={() => setShowNewDialog(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          New Query
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex justify-between">
          <span>{error}</span>
          <button onClick={clearError} className="text-red-500 hover:text-red-700 font-medium">Dismiss</button>
        </div>
      )}

      {/* Main layout */}
      <div className="flex-1 flex gap-6 min-h-0">
        {/* Left panel */}
        <div className="w-80 shrink-0 flex flex-col">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <Input
              className="pl-9"
              placeholder="Search queries..."
              value={jobSearch}
              onChange={e => setJobSearch(e.target.value)}
              aria-label="Search FCC queries"
            />
          </div>
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12 text-neutral-400">Loading...</div>
            ) : (
              <QueryJobList
                jobs={filteredJobs}
                selectedJobId={currentJob?.id ?? null}
                onSelectJob={handleSelectJob}
                onDeleteJob={deleteJob}
              />
            )}
          </div>
        </div>

        {/* Right panel */}
        <div className="flex-1 min-w-0 overflow-y-auto">
          {currentJob ? (
            <div className="space-y-6">
              {/* Job header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900">{currentJob.title}</h2>
                  <p className="text-sm text-neutral-500">
                    {currentJob.query_type === 'fcc_id'
                      ? `FCC ID: ${currentJob.fcc_id}${currentJob.product_code ? '-' + currentJob.product_code : ''}`
                      : currentJob.query_type === 'grantee_search'
                      ? `Grantee: "${currentJob.grantee_search_term}"`
                      : currentJob.query_type === 'bulk_fcc_id'
                      ? `Bulk: ${currentJob.bulk_fcc_ids?.length || 0} FCC IDs`
                      : `${currentJob.begin_date} to ${currentJob.end_date}`}
                  </p>
                </div>
                {currentJob.status === 'pending' && (
                  <Button onClick={() => executeQuery(currentJob.id)} disabled={isQuerying}>
                    <Play className="h-4 w-4 mr-1.5" />
                    Run Query
                  </Button>
                )}
                {currentJob.status === 'running' && (
                  <div className="flex items-center gap-2 text-sm text-cyan-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Querying FCC API...
                  </div>
                )}
                {currentJob.status === 'failed' && (
                  <div className="space-y-1 text-right">
                    <p className="text-sm text-red-500">Query failed</p>
                    <Button size="sm" variant="outline" onClick={() => executeQuery(currentJob.id)}>
                      Retry
                    </Button>
                  </div>
                )}
              </div>

              {currentJob.error_message && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  {currentJob.error_message}
                </div>
              )}

              {/* Stats */}
              {jobStats && currentJob.status === 'completed' && (
                <QueryStats stats={jobStats} />
              )}

              {/* Results table */}
              {currentJob.status === 'completed' && (
                <div className="space-y-4">
                  <ResultsTable
                    results={results}
                    resultsTotal={resultsTotal}
                    isLoading={isLoadingResults}
                    onFetchResults={(filters) => fetchResults(currentJob.id, filters)}
                    onRemoveResults={(data) => removeResults(currentJob.id, data)}
                    jobId={currentJob.id}
                  />

                  {/* Export bar */}
                  <ExportBar
                    exports={exports}
                    isExporting={isExporting}
                    onExport={(fmt) => exportResults(currentJob.id, fmt)}
                    hasResults={resultsTotal > 0}
                  />

                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="rounded-full bg-neutral-100 p-6 mb-4">
                <Radio className="h-12 w-12 text-neutral-300" />
              </div>
              <h3 className="text-lg font-medium text-neutral-600">
                {jobs.length === 0 ? 'Query FCC Equipment Data' : 'Select a query'}
              </h3>
              <p className="text-sm text-neutral-400 mt-2 max-w-sm">
                {jobs.length === 0
                  ? 'Search FCC equipment authorizations by FCC ID or browse Whitespace, CBSD, and AFC certifications by date range.'
                  : 'Click a query from the list to view its results.'}
              </p>
              {jobs.length === 0 && (
                <Button className="mt-4" onClick={() => setShowNewDialog(true)}>
                  <Plus className="h-4 w-4 mr-1.5" />
                  New Query
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      <NewQueryDialog
        open={showNewDialog}
        onOpenChange={setShowNewDialog}
        onSubmit={handleCreateJob}
      />
    </div>
  );
}
