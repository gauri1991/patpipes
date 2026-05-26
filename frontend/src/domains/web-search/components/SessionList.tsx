'use client';

import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { SearchSession, SourceType } from '@/domains/web-search/types/webSearch.types';

interface SessionListProps {
  sessions: SearchSession[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  loading?: boolean;
}

const sourceTypeLabels: Record<SourceType, string> = {
  infringement: 'Infringement',
  prior_art: 'Prior Art',
  portfolio: 'Portfolio',
  manual: 'Manual',
};

const sourceTypeColors: Record<SourceType, string> = {
  infringement: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  prior_art: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  portfolio: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  manual: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
};

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffDay > 0) return `${diffDay}d ago`;
  if (diffHr > 0) return `${diffHr}h ago`;
  if (diffMin > 0) return `${diffMin}m ago`;
  return 'Just now';
}

export function SessionList({
  sessions,
  selectedId,
  onSelect,
  onDelete,
  loading,
}: SessionListProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-3 rounded-lg border space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-3 w-12" />
            </div>
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-sm">No search sessions yet.</p>
        <p className="text-xs mt-1">Create one to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {sessions.map((session) => (
        <div
          key={session.id}
          role="button"
          tabIndex={0}
          className={cn(
            'group relative p-3 rounded-lg border cursor-pointer transition-colors',
            selectedId === session.id
              ? 'bg-primary/10 border-primary/20'
              : 'hover:bg-muted/50 border-transparent'
          )}
          onClick={() => onSelect(session.id)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onSelect(session.id);
            }
          }}
          aria-label={`Select session: ${session.title}`}
          aria-selected={selectedId === session.id}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground truncate">
                {session.title}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  variant="secondary"
                  className={cn(
                    'text-xs border-0',
                    sourceTypeColors[session.source_type]
                  )}
                >
                  {sourceTypeLabels[session.source_type]}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatRelativeTime(session.created_at)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {session.queries_count ?? 0} queries, {session.results_count ?? 0} results
              </p>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(session.id);
              }}
              aria-label={`Delete session: ${session.title}`}
            >
              <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
