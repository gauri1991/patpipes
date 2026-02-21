/**
 * Prior Art Analysis Component
 * Analysis workspace for prior art results
 */

'use client';

import { PriorArtProject } from '@/types/prior-art.types';

interface PriorArtAnalysisProps {
  project: PriorArtProject;
}

export function PriorArtAnalysis({ project }: PriorArtAnalysisProps) {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center text-muted-foreground">
        <p>Prior Art Analysis Workspace Component</p>
        <p className="text-sm mt-1">Project: {project.name}</p>
        <p className="text-xs">Split-screen analysis with claim mapping, comparison tools</p>
      </div>
    </div>
  );
}