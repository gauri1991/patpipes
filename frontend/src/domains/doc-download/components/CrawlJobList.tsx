'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link2, File, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CrawlJob } from '../types/docDownload.types';
import { JOB_STATUS_CONFIG } from '../types/docDownload.types';
import { CrawlProgress } from './CrawlProgress';

interface CrawlJobListProps {
  jobs: CrawlJob[];
  selectedJobId: string | null;
  onSelectJob: (job: CrawlJob) => void;
  onDeleteJob: (jobId: string) => void;
}

export const CrawlJobList: React.FC<CrawlJobListProps> = ({
  jobs,
  selectedJobId,
  onSelectJob,
  onDeleteJob,
}) => {
  if (jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-neutral-100 p-4 mb-4">
          <Link2 className="h-8 w-8 text-neutral-400" />
        </div>
        <p className="text-sm text-neutral-600">No crawl jobs yet</p>
        <p className="text-xs text-neutral-400 mt-1">Create your first job to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {jobs.map((job) => {
        const isSelected = job.id === selectedJobId;
        const statusConfig = JOB_STATUS_CONFIG[job.status];

        return (
          <Card
            key={job.id}
            className={`cursor-pointer transition-colors hover:border-neutral-300 ${
              isSelected ? 'border-neutral-900 bg-neutral-50' : ''
            }`}
            onClick={() => onSelectJob(job)}
          >
            <CardContent className="p-3 space-y-2">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-medium text-neutral-900 truncate">
                    {job.title}
                  </h4>
                  <p className="text-xs text-neutral-500 truncate mt-0.5">
                    {job.target_url}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 ml-2 shrink-0">
                  <Badge variant="outline" className="text-xs">
                    <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${statusConfig.color}`} />
                    {statusConfig.label}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-neutral-400 hover:text-red-500"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteJob(job.id);
                    }}
                    aria-label={`Delete job ${job.title}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Counts */}
              <div className="flex items-center gap-3 text-xs text-neutral-500">
                <span className="flex items-center gap-1">
                  <Link2 className="h-3 w-3" />
                  {job.links_count} links
                </span>
                <span className="flex items-center gap-1">
                  <File className="h-3 w-3" />
                  {job.files_count} files
                </span>
              </div>

              {/* Progress for active jobs */}
              {(job.status === 'crawling' || job.status === 'downloading') && (
                <CrawlProgress job={job} />
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
