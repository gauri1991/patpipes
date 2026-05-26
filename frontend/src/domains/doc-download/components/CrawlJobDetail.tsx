'use client';

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link2, FileText, Database } from 'lucide-react';
import type { CrawlJob, JobStats } from '../types/docDownload.types';
import { useDocDownloadStore } from '../store/docDownload.store';
import { useJobLinks, useJobFiles } from '../hooks/useDocDownload';
import { JobControlBar } from './JobControlBar';
import { CrawlProgress } from './CrawlProgress';
import { LiveStatsCard } from './LiveStatsCard';
import { LinkTable } from './LinkTable';
import { DownloadedFilesList } from './DownloadedFilesList';
import { DataExplorerTab } from './DataExplorerTab';

interface CrawlJobDetailProps {
  job: CrawlJob;
  stats: JobStats | null;
  onStartCrawl: (jobId: string, resume?: boolean) => Promise<void>;
  onPause: (jobId: string) => Promise<void>;
  onStop: (jobId: string) => Promise<void>;
  onStartDownload: (jobId: string, resume?: boolean) => Promise<void>;
}

export const CrawlJobDetail: React.FC<CrawlJobDetailProps> = ({
  job,
  stats,
  onStartCrawl,
  onPause,
  onStop,
  onStartDownload,
}) => {
  const { activeTab, setActiveTab } = useDocDownloadStore();
  const {
    links, linksTotal, isLoading: isLoadingLinks,
    selectedCategory, linkFilter, searchQuery,
    setSelectedCategory, setLinkFilter, setSearchQuery,
    selectLinks, refresh: refreshLinks, loadMore: loadMoreLinks,
  } = useJobLinks(job.id);

  const {
    files, filesTotal, isLoading: isLoadingFiles,
    loadMore: loadMoreFiles,
  } = useJobFiles(job.id);

  const selectedCount = stats?.selected_count ?? links.filter(l => l.is_selected).length;

  return (
    <div className="space-y-4">
      {/* Job title */}
      <div>
        <h2 className="text-lg font-semibold text-neutral-900">{job.title}</h2>
        <p className="text-sm text-neutral-500 truncate">{job.target_url}</p>
      </div>

      {/* Progress bar for active jobs */}
      {(job.status === 'crawling' || job.status === 'downloading') && (
        <CrawlProgress job={job} />
      )}

      {/* Control bar */}
      <JobControlBar
        job={job}
        onStartCrawl={(resume) => onStartCrawl(job.id, resume)}
        onPause={() => onPause(job.id)}
        onStop={() => onStop(job.id)}
        onStartDownload={(resume) => onStartDownload(job.id, resume)}
        selectedCount={selectedCount}
      />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList>
          <TabsTrigger value="links" className="flex items-center gap-1.5">
            <Link2 className="h-3.5 w-3.5" />
            Discovered Links
            {linksTotal > 0 && (
              <span className="text-xs bg-neutral-100 px-1.5 py-0.5 rounded">
                {linksTotal}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="files" className="flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            Downloaded Files
            {filesTotal > 0 && (
              <span className="text-xs bg-neutral-100 px-1.5 py-0.5 rounded">
                {filesTotal}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="explorer" className="flex items-center gap-1.5">
            <Database className="h-3.5 w-3.5" />
            Data Explorer
          </TabsTrigger>
        </TabsList>

        <TabsContent value="links" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
            <div className="xl:col-span-3">
              <LinkTable
                links={links}
                linksTotal={linksTotal}
                isLoading={isLoadingLinks}
                stats={stats}
                selectedCategory={selectedCategory}
                linkFilter={linkFilter}
                searchQuery={searchQuery}
                onSelectCategory={setSelectedCategory}
                onSetLinkFilter={setLinkFilter}
                onSearchChange={setSearchQuery}
                onSelectLinks={selectLinks}
                onLoadMore={loadMoreLinks}
              />
            </div>
            <div className="xl:col-span-1">
              <LiveStatsCard job={job} stats={stats} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="files" className="mt-4">
          <DownloadedFilesList
            files={files}
            filesTotal={filesTotal}
            isLoading={isLoadingFiles}
            onLoadMore={() => loadMoreFiles(files.length)}
          />
        </TabsContent>

        <TabsContent value="explorer" className="mt-4">
          <DataExplorerTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};
