/**
 * Prior Art Reports Component
 * Generate and manage reports
 */

'use client';

import { PriorArtProject } from '@/types/prior-art.types';

interface PriorArtReportsProps {
  project: PriorArtProject;
}

export function PriorArtReports({ project }: PriorArtReportsProps) {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center text-muted-foreground">
        <p>Prior Art Reports Component</p>
        <p className="text-sm mt-1">Project: {project.name}</p>
        <p className="text-xs">FTO reports, invalidity charts, landscape analysis</p>
      </div>
    </div>
  );
}