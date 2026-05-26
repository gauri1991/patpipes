'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Radio, Trash2, FileText } from 'lucide-react';
import type { FCCQueryJob } from '../types/fccData.types';
import { JOB_STATUS_CONFIG, QUERY_TYPE_CONFIG } from '../types/fccData.types';

interface QueryJobListProps {
  jobs: FCCQueryJob[];
  selectedJobId: string | null;
  onSelectJob: (job: FCCQueryJob) => void;
  onDeleteJob: (jobId: string) => void;
}

export const QueryJobList: React.FC<QueryJobListProps> = ({
  jobs, selectedJobId, onSelectJob, onDeleteJob,
}) => {
  if (jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-neutral-100 p-4 mb-4">
          <Radio className="h-8 w-8 text-neutral-400" />
        </div>
        <p className="text-sm text-neutral-600">No queries yet</p>
        <p className="text-xs text-neutral-400 mt-1">Create a query to search FCC data</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {jobs.map((job, index) => {
        const isSelected = job.id === selectedJobId;
        const statusCfg = JOB_STATUS_CONFIG[job.status] || { label: job.status, color: 'bg-neutral-400' };
        const typeCfg = QUERY_TYPE_CONFIG[job.query_type] || { label: job.query_type, description: '' };

        return (
          <Card
            key={job.id || index}
            className={`cursor-pointer transition-colors hover:border-neutral-300 ${
              isSelected ? 'border-neutral-900 bg-neutral-50' : ''
            }`}
            onClick={() => onSelectJob(job)}
          >
            <CardContent className="p-3 space-y-2">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-medium text-neutral-900 truncate">{job.title}</h4>
                  <p className="text-xs text-neutral-500 mt-0.5">{typeCfg.label}</p>
                </div>
                <div className="flex items-center gap-1.5 ml-2 shrink-0">
                  <Badge variant="outline" className="text-xs">
                    <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${statusCfg.color}`} />
                    {statusCfg.label}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-neutral-400 hover:text-red-500"
                    onClick={e => { e.stopPropagation(); onDeleteJob(job.id); }}
                    aria-label={`Delete query ${job.title}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs text-neutral-500">
                <span className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {job.results_count} records
                </span>
                {job.exports_count > 0 && (
                  <span>{job.exports_count} export{job.exports_count > 1 ? 's' : ''}</span>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
