/**
 * Prior Art Saved Searches Component
 * Manage saved search queries and templates
 */

'use client';

import { PriorArtProject } from '@/types/prior-art.types';

interface PriorArtSavedSearchesProps {
  project: PriorArtProject;
}

export function PriorArtSavedSearches({ project }: PriorArtSavedSearchesProps) {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center text-muted-foreground">
        <p>Prior Art Saved Searches Component</p>
        <p className="text-sm mt-1">Project: {project.name}</p>
        <p className="text-xs">Search templates, query history, auto-refresh settings</p>
      </div>
    </div>
  );
}