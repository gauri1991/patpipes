'use client';

import React from 'react';
import { Progress } from '@/components/ui/progress';
import type { CrawlJob } from '../types/docDownload.types';

interface CrawlProgressProps {
  job: CrawlJob;
}

export const CrawlProgress: React.FC<CrawlProgressProps> = ({ job }) => {
  const { progress, status } = job;
  const isActive = status === 'crawling' || status === 'downloading';

  const getPercentage = () => {
    if (status === 'completed') return 100;
    if (status === 'crawling') {
      const total = progress.pages_total || job.max_pages;
      return total > 0 ? Math.min((progress.pages_crawled / total) * 100, 99) : 0;
    }
    if (status === 'downloading') {
      return progress.files_total > 0
        ? Math.min((progress.files_downloaded / progress.files_total) * 100, 99)
        : 0;
    }
    return 0;
  };

  const percentage = Math.round(getPercentage());

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-neutral-600">
          {status === 'crawling' && `Crawling: ${progress.pages_crawled} pages`}
          {status === 'downloading' && `Downloading: ${progress.files_downloaded}/${progress.files_total} files`}
          {status === 'completed' && 'Complete'}
          {status === 'paused' && 'Paused'}
          {status === 'pending' && 'Ready to start'}
          {status === 'discovered' && `${progress.links_discovered} links found`}
          {status === 'failed' && 'Failed'}
          {status === 'cancelled' && 'Cancelled'}
        </span>
        <span className="font-medium text-neutral-900">{percentage}%</span>
      </div>

      <div className="relative">
        <Progress value={percentage} className="h-2" />
        {isActive && (
          <div className="absolute inset-0 h-2 rounded-full overflow-hidden">
            <div className="h-full w-1/3 bg-white/30 animate-[shimmer_1.5s_infinite] rounded-full" />
          </div>
        )}
      </div>

      {isActive && progress.current_url && (
        <p className="text-xs text-neutral-500 truncate">
          {progress.current_url}
        </p>
      )}
    </div>
  );
};
