'use client';

import { Play, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { QueryCategoryBadge } from './QueryCategoryBadge';
import type { SearchQuery } from '@/domains/web-search/types/webSearch.types';

interface QueryCardProps {
  query: SearchQuery;
  onExecute: (queryId: string) => void;
  executing?: boolean;
}

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

export function QueryCard({ query, onExecute, executing }: QueryCardProps) {
  const isExecuted = query.executed_at !== null;

  return (
    <Card className="p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <QueryCategoryBadge category={query.category} />
            {query.is_auto_generated && (
              <Badge variant="outline" className="text-xs">
                Auto
              </Badge>
            )}
          </div>
          <p className="text-sm text-foreground leading-snug">{query.query_text}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isExecuted ? (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
              <span>{query.results_count} results</span>
              <span className="text-muted-foreground/60">
                {formatRelativeTime(query.executed_at!)}
              </span>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onExecute(query.id)}
              disabled={executing}
              aria-label={`Execute query: ${query.query_text}`}
            >
              {executing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 mr-1" />
                  Run
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
