'use client';

import { useState } from 'react';
import { Play, Plus, RefreshCw, Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { QueryCard } from './QueryCard';
import { SearchResultCard } from './SearchResultCard';
import type {
  SearchSession,
  SearchQuery,
  SearchResult,
  SearchCategory,
  CreateQueryRequest,
  UpdateResultRequest,
} from '@/domains/web-search/types/webSearch.types';

interface SessionDetailProps {
  session: SearchSession | null;
  queries: SearchQuery[];
  results: SearchResult[];
  loading?: boolean;
  executing?: boolean;
  onGenerateQueries: () => void;
  onExecuteAll: () => void;
  onExecuteQuery: (queryId: string) => void;
  onAddQuery: (data: CreateQueryRequest) => void;
  onUpdateResult: (resultId: string, data: UpdateResultRequest) => void;
}

const categoryOptions: { value: SearchCategory; label: string }[] = [
  { value: 'product_evidence', label: 'Product Evidence' },
  { value: 'litigation', label: 'Litigation' },
  { value: 'prior_art', label: 'Prior Art' },
  { value: 'competitor', label: 'Competitor' },
  { value: 'technical', label: 'Technical' },
  { value: 'market', label: 'Market' },
  { value: 'general', label: 'General' },
];

const sourceTypeLabels: Record<string, string> = {
  infringement: 'Infringement',
  prior_art: 'Prior Art',
  portfolio: 'Portfolio',
  manual: 'Manual',
};

export function SessionDetail({
  session,
  queries,
  results,
  loading,
  executing,
  onGenerateQueries,
  onExecuteAll,
  onExecuteQuery,
  onAddQuery,
  onUpdateResult,
}: SessionDetailProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newQueryText, setNewQueryText] = useState('');
  const [newQueryCategory, setNewQueryCategory] = useState<SearchCategory>('general');

  if (!session) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px] text-muted-foreground">
        <div className="text-center">
          <Search className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-sm">Select a session to view details</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6 p-1">
        <div className="space-y-2">
          <Skeleton className="h-6 w-2/3" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-16" />
          </div>
          <Skeleton className="h-4 w-full" />
        </div>
        <Separator />
        <div className="space-y-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    );
  }

  const handleAddQuery = () => {
    if (!newQueryText.trim()) return;
    onAddQuery({
      session: session.id,
      query_text: newQueryText.trim(),
      category: newQueryCategory,
      is_auto_generated: false,
    });
    setNewQueryText('');
    setNewQueryCategory('general');
    setShowAddForm(false);
  };

  const pendingQueries = queries.filter((q) => q.executed_at === null);

  // Build a map from query id to its category for result cards
  const queryCategoryMap = new Map<string, SearchCategory>();
  queries.forEach((q) => {
    queryCategoryMap.set(q.id, q.category);
  });

  return (
    <div className="space-y-6 p-1">
      {/* Session Header */}
      <div>
        <h2 className="text-lg font-semibold text-foreground">{session.title}</h2>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <Badge variant="secondary" className="text-xs">
            {sourceTypeLabels[session.source_type] || session.source_type}
          </Badge>
          <Badge
            variant={session.status === 'active' ? 'default' : 'secondary'}
            className="text-xs capitalize"
          >
            {session.status}
          </Badge>
        </div>
        {session.notes && (
          <p className="text-sm text-muted-foreground mt-2">{session.notes}</p>
        )}
      </div>

      <Separator />

      {/* Queries Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">
            Queries ({queries.length})
          </h3>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onGenerateQueries}
              disabled={executing}
              aria-label="Generate queries"
            >
              <RefreshCw className={cn('h-3.5 w-3.5 mr-1.5', executing && 'animate-spin')} />
              Generate
            </Button>
            {pendingQueries.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={onExecuteAll}
                disabled={executing}
                aria-label="Run all pending queries"
              >
                {executing ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Play className="h-3.5 w-3.5 mr-1.5" />
                )}
                Run All
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddForm(!showAddForm)}
              aria-label="Add custom query"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Add Custom
            </Button>
          </div>
        </div>

        {/* Add Custom Query Form */}
        {showAddForm && (
          <div className="mb-3 p-3 rounded-lg border bg-muted/30 space-y-2">
            <Input
              value={newQueryText}
              onChange={(e) => setNewQueryText(e.target.value)}
              placeholder="Enter search query..."
              className="text-sm"
              aria-label="Query text"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddQuery();
                }
              }}
            />
            <div className="flex items-center gap-2">
              <Select
                value={newQueryCategory}
                onValueChange={(val) => setNewQueryCategory(val as SearchCategory)}
              >
                <SelectTrigger className="w-40 h-8 text-xs" aria-label="Query category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                onClick={handleAddQuery}
                disabled={!newQueryText.trim()}
                aria-label="Submit query"
              >
                Add
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowAddForm(false);
                  setNewQueryText('');
                }}
                aria-label="Cancel adding query"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Queries List */}
        {queries.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <p className="text-sm">No queries yet.</p>
            <p className="text-xs mt-1">Generate queries or add a custom one.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {queries.map((query) => (
              <QueryCard
                key={query.id}
                query={query}
                onExecute={onExecuteQuery}
                executing={executing}
              />
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* Results Section */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">
          Results ({results.length})
        </h3>

        {results.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <p className="text-sm">Execute queries to see results</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {results.map((result) => (
              <SearchResultCard
                key={result.id}
                result={result}
                category={queryCategoryMap.get(result.query)}
                onToggleFlag={(id, flagged) =>
                  onUpdateResult(id, { is_flagged: flagged })
                }
                onToggleSave={(id, saved) =>
                  onUpdateResult(id, { is_saved: saved })
                }
                onUpdateNotes={(id, notes) =>
                  onUpdateResult(id, { relevance_notes: notes })
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
