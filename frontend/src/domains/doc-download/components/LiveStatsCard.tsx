'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Link2, Download, Clock, AlertTriangle, ShieldOff } from 'lucide-react';
import type { CrawlJob, JobStats } from '../types/docDownload.types';
import { CATEGORY_CONFIG } from '../types/docDownload.types';

interface LiveStatsCardProps {
  job: CrawlJob;
  stats: JobStats | null;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export const LiveStatsCard: React.FC<LiveStatsCardProps> = ({ job, stats }) => {
  const { progress } = job;

  const categoryCounts = useMemo(() => {
    const counts = stats?.category_counts || progress.category_counts || {};
    return Object.entries(counts)
      .filter(([, count]) => count > 0)
      .sort(([, a], [, b]) => b - a);
  }, [stats, progress.category_counts]);

  const totalCategoryCount = useMemo(
    () => categoryCounts.reduce((sum, [, count]) => sum + count, 0),
    [categoryCounts]
  );

  const statItems = [
    {
      icon: FileText,
      label: 'Pages Crawled',
      value: progress.pages_crawled,
    },
    {
      icon: Link2,
      label: 'Links Found',
      value: stats?.total_links ?? progress.links_discovered,
    },
    {
      icon: Download,
      label: 'Files Downloaded',
      value: stats?.total_files ?? progress.files_downloaded,
    },
    {
      icon: Clock,
      label: 'Crawl Rate',
      value: `${progress.crawl_rate_pages_per_min}/min`,
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Live Stats</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stat grid */}
        <div className="grid grid-cols-2 gap-3">
          {statItems.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <item.icon className="h-4 w-4 text-neutral-400 shrink-0" />
              <div>
                <p className="text-xs text-neutral-500">{item.label}</p>
                <p className="text-sm font-semibold text-neutral-900">{item.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Download size */}
        <div className="flex items-center justify-between text-sm border-t pt-3">
          <span className="text-neutral-500">Total Size</span>
          <span className="font-medium">
            {formatBytes(stats?.total_download_size ?? progress.total_download_size_bytes)}
          </span>
        </div>

        {/* Errors & blocked */}
        {(progress.errors_count > 0 || progress.blocked_count > 0) && (
          <div className="flex items-center gap-4 text-sm border-t pt-3">
            {progress.errors_count > 0 && (
              <div className="flex items-center gap-1 text-amber-600">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>{progress.errors_count} errors</span>
              </div>
            )}
            {progress.blocked_count > 0 && (
              <div className="flex items-center gap-1 text-red-500">
                <ShieldOff className="h-3.5 w-3.5" />
                <span>{progress.blocked_count} blocked</span>
              </div>
            )}
          </div>
        )}

        {/* Category breakdown - horizontal stacked bar */}
        {categoryCounts.length > 0 && (
          <div className="space-y-2 border-t pt-3">
            <p className="text-xs text-neutral-500 font-medium">Categories</p>
            {/* Stacked bar */}
            <div className="flex h-3 rounded-full overflow-hidden bg-neutral-100">
              {categoryCounts.map(([category, count]) => {
                const config = CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG];
                const width = totalCategoryCount > 0 ? (count / totalCategoryCount) * 100 : 0;
                return (
                  <div
                    key={category}
                    className={`${config?.color || 'bg-neutral-400'} transition-all duration-300`}
                    style={{ width: `${width}%` }}
                    title={`${config?.label || category}: ${count}`}
                  />
                );
              })}
            </div>
            {/* Legend */}
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {categoryCounts.slice(0, 6).map(([category, count]) => {
                const config = CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG];
                return (
                  <div key={category} className="flex items-center gap-1 text-xs">
                    <span className={`w-2 h-2 rounded-full ${config?.color || 'bg-neutral-400'}`} />
                    <span className="text-neutral-600">{config?.label || category}</span>
                    <span className="text-neutral-400">({count})</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Selected / rendered counts */}
        {stats && (
          <div className="flex items-center justify-between text-xs text-neutral-500 border-t pt-3">
            <span>{stats.selected_count} selected</span>
            <span>{stats.rendered_pages} rendered pages</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
