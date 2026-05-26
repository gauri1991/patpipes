'use client';

import React from 'react';
import { Play, Pause, Square, Download, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CrawlJob, JobStatus } from '../types/docDownload.types';
import { JOB_STATUS_CONFIG } from '../types/docDownload.types';
import { Badge } from '@/components/ui/badge';

interface JobControlBarProps {
  job: CrawlJob;
  onStartCrawl: (resume?: boolean) => void;
  onPause: () => void;
  onStop: () => void;
  onStartDownload: (resume?: boolean) => void;
  selectedCount?: number;
}

export const JobControlBar: React.FC<JobControlBarProps> = ({
  job,
  onStartCrawl,
  onPause,
  onStop,
  onStartDownload,
  selectedCount = 0,
}) => {
  const statusConfig = JOB_STATUS_CONFIG[job.status];

  return (
    <div className="flex items-center justify-between p-4 bg-white border border-neutral-200 rounded-lg">
      <div className="flex items-center gap-3">
        <Badge
          variant="outline"
          className="text-xs font-medium"
        >
          <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${statusConfig.color}`} />
          {statusConfig.label}
        </Badge>
        <span className="text-sm text-neutral-600 truncate max-w-xs">
          {job.target_url}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {/* Start / Resume Crawl */}
        {(job.status === 'pending') && (
          <Button size="sm" onClick={() => onStartCrawl(false)}>
            <Play className="h-4 w-4 mr-1.5" />
            Start Crawl
          </Button>
        )}

        {(job.status === 'paused' || job.status === 'failed') && (
          <Button size="sm" variant="outline" onClick={() => onStartCrawl(true)}>
            <RotateCcw className="h-4 w-4 mr-1.5" />
            Resume Crawl
          </Button>
        )}

        {/* Pause */}
        {job.status === 'crawling' && (
          <Button size="sm" variant="outline" onClick={onPause}>
            <Pause className="h-4 w-4 mr-1.5" />
            Pause
          </Button>
        )}

        {/* Stop */}
        {(job.status === 'crawling' || job.status === 'downloading') && (
          <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700" onClick={onStop}>
            <Square className="h-4 w-4 mr-1.5" />
            Stop
          </Button>
        )}

        {/* Download Selected */}
        {(job.status === 'discovered' || job.status === 'completed' || job.status === 'cancelled') && selectedCount > 0 && (
          <Button size="sm" onClick={() => onStartDownload(false)}>
            <Download className="h-4 w-4 mr-1.5" />
            Download {selectedCount} Selected
          </Button>
        )}
      </div>
    </div>
  );
};
