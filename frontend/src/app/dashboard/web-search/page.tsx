/**
 * Web Search Module — Main Page
 * Master-detail layout: session list (left) + session detail (right)
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Globe,
  Search,
  Plus,
  Play,
  Flag,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  Trash2,
  RefreshCw,
  Clock,
  Pencil,
  Check,
  X,
  Save,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

import {
  useWebSearchSessions,
  useWebSearchSession,
  useWebSearchQuota,
  useSearchConfig,
} from '@/hooks/useWebSearchData';
import type {
  SearchSession,
  SearchQuery,
  SearchResult,
  SearchCategory,
  SourceType,
  QuotaInfo,
  CreateSessionRequest,
  AdvancedQueryFilters,
  FileType,
  DateRestrict,
} from '@/domains/web-search/types/webSearch.types';

// ==================== Constants ====================

const DATE_RESTRICT_LABELS: Record<string, string> = {
  d1: 'Past day',
  w1: 'Past week',
  m1: 'Past month',
  m3: 'Past 3 months',
  m6: 'Past 6 months',
  y1: 'Past year',
};

const FILE_TYPE_LABELS: Record<string, string> = {
  pdf: 'PDF',
  doc: 'Word',
  ppt: 'PowerPoint',
  xls: 'Excel',
  txt: 'Plain Text',
};

const EMPTY_ADVANCED: AdvancedQueryFilters = {
  site_filter: '',
  file_type: '' as FileType,
  date_restrict: '' as DateRestrict,
  exact_terms: '',
  exclude_terms: '',
};

const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
  infringement: 'Infringement',
  prior_art: 'Prior Art',
  portfolio: 'Portfolio',
  manual: 'Manual',
};

const SOURCE_TYPE_COLORS: Record<SourceType, string> = {
  infringement: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  prior_art: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  portfolio: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  manual: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300',
};

const CATEGORY_LABELS: Record<SearchCategory, string> = {
  product_evidence: 'Product Evidence',
  litigation: 'Litigation',
  prior_art: 'Prior Art',
  competitor: 'Competitor',
  technical: 'Technical',
  market: 'Market',
  general: 'General',
};

const CATEGORY_COLORS: Record<SearchCategory, string> = {
  product_evidence: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  litigation: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  prior_art: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  competitor: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  technical: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  market: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  general: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300',
};

// ==================== Sub-Components ====================

function QuotaIndicator({ quota, loading }: { quota: QuotaInfo | null; loading: boolean }) {
  if (loading) {
    return <Skeleton className="h-12 w-full" />;
  }
  if (!quota) return null;

  // Client-side mode — no quota applies
  if (quota.unlimited || quota.mode === 'client') {
    return (
      <div className="px-3 py-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Search Mode</span>
          <Badge variant="secondary" className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            Client-Side
          </Badge>
        </div>
      </div>
    );
  }

  const percentage = quota.limit > 0 ? (quota.used / quota.limit) * 100 : 0;
  const isLow = quota.remaining <= 10;

  return (
    <div className="px-3 py-2 space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">API Quota</span>
        <span className={cn('font-medium', isLow ? 'text-red-600' : 'text-muted-foreground')}>
          {quota.remaining} / {quota.limit} remaining
        </span>
      </div>
      <Progress value={percentage} className="h-1.5" />
    </div>
  );
}

function SessionListItem({
  session,
  isSelected,
  onSelect,
}: {
  session: SearchSession;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'w-full text-left px-3 py-2.5 rounded-md transition-colors',
        'hover:bg-muted/50',
        isSelected && 'bg-muted'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{session.title}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <Badge variant="secondary" className={cn('text-[10px] px-1.5 py-0', SOURCE_TYPE_COLORS[session.source_type])}>
              {SOURCE_TYPE_LABELS[session.source_type]}
            </Badge>
          </div>
        </div>
        <div className="text-[10px] text-muted-foreground shrink-0 text-right">
          <div>{new Date(session.created_at).toLocaleDateString()}</div>
          <div className="mt-0.5">
            {session.queries_count ?? 0}q / {session.results_count ?? 0}r
          </div>
        </div>
      </div>
    </button>
  );
}

function SessionListSkeleton() {
  return (
    <div className="space-y-2 px-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="space-y-2 py-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

const SOURCE_TYPE_ORDER: SourceType[] = ['infringement', 'prior_art', 'portfolio', 'manual'];

function SessionGroup({
  sourceType,
  sessions,
  selectedSessionId,
  onSelect,
}: {
  sourceType: SourceType;
  sessions: SearchSession[];
  selectedSessionId: string | null;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded-sm transition-colors"
        aria-expanded={open}
      >
        <span className="flex items-center gap-1.5">
          <span
            className={cn(
              'inline-block h-1.5 w-1.5 rounded-full shrink-0',
              SOURCE_TYPE_COLORS[sourceType].includes('red') ? 'bg-red-500' :
              SOURCE_TYPE_COLORS[sourceType].includes('blue') ? 'bg-blue-500' :
              SOURCE_TYPE_COLORS[sourceType].includes('green') ? 'bg-green-500' :
              'bg-neutral-400'
            )}
          />
          {SOURCE_TYPE_LABELS[sourceType]}
          <span className="text-muted-foreground/60 font-normal normal-case tracking-normal">
            ({sessions.length})
          </span>
        </span>
        <ChevronDown className={cn('h-3 w-3 transition-transform duration-200', !open && '-rotate-90')} />
      </button>

      {open && (
        <div className="space-y-0.5 mb-1">
          {sessions.map(s => (
            <SessionListItem
              key={s.id}
              session={s}
              isSelected={selectedSessionId === s.id}
              onSelect={() => onSelect(s.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function QueryCard({
  query,
  executingQueryId,
  isSelected,
  onExecute,
  onSelect,
  onUpdate,
  onDelete,
}: {
  query: SearchQuery;
  executingQueryId: string | null;
  isSelected: boolean;
  onExecute: (id: string) => void;
  onSelect: (id: string) => void;
  onUpdate: (id: string, data: Partial<Pick<SearchQuery, 'query_text' | 'category' | 'site_filter' | 'file_type' | 'date_restrict' | 'exact_terms' | 'exclude_terms'>>) => void;
  onDelete: (id: string) => void;
}) {
  const isPending = !query.executed_at;
  const isExecuting = executingQueryId === query.id;
  const anyExecuting = executingQueryId !== null;
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(query.query_text);
  const [editCategory, setEditCategory] = useState<SearchCategory>(query.category);
  const [editAdvanced, setEditAdvanced] = useState<AdvancedQueryFilters>({
    site_filter: query.site_filter || '',
    file_type: (query.file_type || '') as FileType,
    date_restrict: (query.date_restrict || '') as DateRestrict,
    exact_terms: query.exact_terms || '',
    exclude_terms: query.exclude_terms || '',
  });

  const handleSaveEdit = () => {
    onUpdate(query.id, {
      query_text: editText.trim() || query.query_text,
      category: editCategory,
      site_filter: editAdvanced.site_filter,
      file_type: editAdvanced.file_type,
      date_restrict: editAdvanced.date_restrict,
      exact_terms: editAdvanced.exact_terms,
      exclude_terms: editAdvanced.exclude_terms,
    });
    setEditing(false);
  };

  const handleCancelEdit = () => {
    setEditText(query.query_text);
    setEditCategory(query.category);
    setEditAdvanced({
      site_filter: query.site_filter || '',
      file_type: (query.file_type || '') as FileType,
      date_restrict: (query.date_restrict || '') as DateRestrict,
      exact_terms: query.exact_terms || '',
      exclude_terms: query.exclude_terms || '',
    });
    setEditing(false);
  };

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg border bg-card group cursor-pointer transition-colors',
        isSelected && !isPending && 'border-primary/50 bg-primary/5 ring-1 ring-primary/20'
      )}
      onClick={() => !editing && !isPending && onSelect(query.id)}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {editing ? (
            <Select value={editCategory} onValueChange={v => setEditCategory(v as SearchCategory)}>
              <SelectTrigger className="h-6 w-auto text-[10px] px-1.5 py-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(CATEGORY_LABELS) as SearchCategory[]).map(cat => (
                  <SelectItem key={cat} value={cat} className="text-xs">
                    {CATEGORY_LABELS[cat]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Badge
              variant="secondary"
              className={cn('text-[10px] px-1.5 py-0', CATEGORY_COLORS[query.category])}
            >
              {CATEGORY_LABELS[query.category]}
            </Badge>
          )}
          {query.is_auto_generated && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              Auto
            </Badge>
          )}
          {isPending ? (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-amber-600 border-amber-300">
              Pending
            </Badge>
          ) : (
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              <Clock className="h-3 w-3" />
              {new Date(query.executed_at!).toLocaleString()}
            </span>
          )}
        </div>
        {editing ? (
          <div className="space-y-2">
            <Input
              value={editText}
              onChange={e => setEditText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Escape') handleCancelEdit();
              }}
              className="text-sm h-8"
              autoFocus
            />
            <AdvancedOptionsPanel value={editAdvanced} onChange={setEditAdvanced} />
          </div>
        ) : (
          <>
            <p className="text-sm">{query.query_text}</p>
            {/* Active filter badges */}
            {(query.site_filter || query.file_type || query.date_restrict || query.exact_terms || query.exclude_terms) && (
              <div className="flex flex-wrap gap-1 mt-1">
                {query.site_filter && (
                  <Badge variant="outline" className="text-[9px] px-1 py-0 font-mono">
                    site:{query.site_filter}
                  </Badge>
                )}
                {query.file_type && (
                  <Badge variant="outline" className="text-[9px] px-1 py-0">
                    .{query.file_type}
                  </Badge>
                )}
                {query.date_restrict && (
                  <Badge variant="outline" className="text-[9px] px-1 py-0">
                    {DATE_RESTRICT_LABELS[query.date_restrict]}
                  </Badge>
                )}
                {query.exact_terms && (
                  <Badge variant="outline" className="text-[9px] px-1 py-0 max-w-[100px] truncate">
                    &ldquo;{query.exact_terms}&rdquo;
                  </Badge>
                )}
                {query.exclude_terms && (
                  <Badge variant="outline" className="text-[9px] px-1 py-0 max-w-[100px] truncate">
                    -{query.exclude_terms}
                  </Badge>
                )}
              </div>
            )}
          </>
        )}
        {!isPending && !editing && (
          <p className="text-xs text-muted-foreground mt-1">
            {query.results_count} result{query.results_count !== 1 ? 's' : ''}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1">
        {editing ? (
          <>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-green-600"
              onClick={handleSaveEdit}
              aria-label="Save edit"
            >
              <Check className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={handleCancelEdit}
              aria-label="Cancel edit"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </>
        ) : (
          <>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => setEditing(true)}
              disabled={anyExecuting}
              aria-label="Edit query"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-600"
              onClick={() => onDelete(query.id)}
              disabled={anyExecuting}
              aria-label="Delete query"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              variant={isPending ? 'default' : 'outline'}
              disabled={anyExecuting}
              onClick={() => onExecute(query.id)}
              aria-label={isPending ? `Execute query: ${query.query_text}` : `Re-run query: ${query.query_text}`}
            >
              {isExecuting ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : isPending ? (
                <Play className="h-3.5 w-3.5" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;

  const words = query
    .trim()
    .split(/\s+/)
    .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .filter(Boolean);

  if (words.length === 0) return <>{text}</>;

  const pattern = new RegExp(`(${words.join('|')})`, 'gi');
  const parts = text.split(pattern);

  return (
    <>
      {parts.map((part, i) =>
        pattern.test(part) ? (
          <mark
            key={i}
            className="rounded-sm bg-yellow-200/70 px-0.5 text-inherit dark:bg-yellow-500/30"
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

function SearchResultCard({
  result,
  queryText,
  onToggleFlag,
  onToggleSave,
}: {
  result: SearchResult;
  queryText: string;
  onToggleFlag: () => void;
  onToggleSave: () => void;
}) {
  return (
    <div className="p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <a
            href={result.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1"
          >
            <span className="truncate"><HighlightText text={result.title} query={queryText} /></span>
            <ExternalLink className="h-3 w-3 shrink-0" />
          </a>
          <p className="text-xs text-green-700 dark:text-green-400 mt-0.5 truncate">
            {result.display_link}
          </p>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            <HighlightText text={result.snippet} query={queryText} />
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            size="icon"
            variant="ghost"
            className={cn('h-7 w-7', result.is_flagged && 'text-red-500')}
            onClick={onToggleFlag}
            aria-label={result.is_flagged ? 'Remove flag' : 'Flag result'}
          >
            <Flag className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            variant={result.is_saved ? 'default' : 'outline'}
            className={cn(
              'h-7 gap-1 text-xs px-2',
              result.is_saved
                ? 'bg-amber-500 hover:bg-amber-600 text-white'
                : 'hover:border-amber-400 hover:text-amber-600'
            )}
            onClick={onToggleSave}
            aria-label={result.is_saved ? 'Remove from saved' : 'Save result'}
          >
            {result.is_saved ? (
              <BookmarkCheck className="h-3.5 w-3.5" />
            ) : (
              <Bookmark className="h-3.5 w-3.5" />
            )}
            {result.is_saved ? 'Saved' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function EmptySessionState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center py-20">
      <Globe className="h-12 w-12 text-muted-foreground/40 mb-4" />
      <h3 className="text-lg font-medium text-muted-foreground">No session selected</h3>
      <p className="text-sm text-muted-foreground/70 mt-1 max-w-sm">
        Select a search session from the list or create a new one to get started.
      </p>
    </div>
  );
}

function SessionDetailSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-4 w-1/4" />
      </div>
      <Separator />
      <div className="space-y-3">
        <Skeleton className="h-5 w-24" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    </div>
  );
}

function NewSessionDialog({
  open,
  onOpenChange,
  onSubmit,
  defaultSourceType,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateSessionRequest) => Promise<void>;
  defaultSourceType?: SourceType;
}) {
  const [title, setTitle] = useState('');
  const [sourceType, setSourceType] = useState<SourceType>(defaultSourceType || 'manual');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    try {
      setSubmitting(true);
      await onSubmit({
        title: title.trim(),
        source_type: sourceType,
        notes: notes.trim(),
      });
      setTitle('');
      setNotes('');
      setSourceType(defaultSourceType || 'manual');
      onOpenChange(false);
    } catch {
      // Error already toasted in hook
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md flex flex-col max-h-[88vh]">
        <DialogHeader className="shrink-0">
          <DialogTitle>New Search Session</DialogTitle>
          <DialogDescription>
            Create a session to organize your web search queries and results.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto space-y-4 py-2 pr-1">
          <div className="space-y-2">
            <label htmlFor="session-title" className="text-sm font-medium">
              Title
            </label>
            <Input
              id="session-title"
              placeholder="e.g., Product evidence for Case #123"
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="session-source" className="text-sm font-medium">
              Source Type
            </label>
            <Select value={sourceType} onValueChange={v => setSourceType(v as SourceType)}>
              <SelectTrigger id="session-source">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="infringement">Infringement</SelectItem>
                <SelectItem value="prior_art">Prior Art</SelectItem>
                <SelectItem value="portfolio">Portfolio</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label htmlFor="session-notes" className="text-sm font-medium">
              Notes (optional)
            </label>
            <Textarea
              id="session-notes"
              placeholder="Additional context for this search session..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter className="shrink-0 pt-2 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !title.trim()}>
            {submitting ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Create Session
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AdvancedOptionsPanel({
  value,
  onChange,
}: {
  value: AdvancedQueryFilters;
  onChange: (v: AdvancedQueryFilters) => void;
}) {
  const [open, setOpen] = useState(false);
  const activeCount = [
    value.site_filter,
    value.file_type,
    value.date_restrict,
    value.exact_terms,
    value.exclude_terms,
  ].filter(Boolean).length;

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        aria-expanded={open}
      >
        <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} />
        Advanced Options
        {activeCount > 0 && (
          <Badge variant="secondary" className="text-[10px] px-1 py-0 bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400">
            {activeCount} active
          </Badge>
        )}
      </button>

      {open && (
        <div className="grid grid-cols-2 gap-3 p-3 rounded-md border bg-muted/30 text-sm">
          <div className="col-span-2 space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Site / Domain</label>
            <Input
              placeholder="e.g. patents.google.com"
              value={value.site_filter}
              onChange={e => onChange({ ...value, site_filter: e.target.value })}
              className="h-7 text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">File Type</label>
            <Select
              value={value.file_type || '__none__'}
              onValueChange={v => onChange({ ...value, file_type: (v === '__none__' ? '' : v) as FileType })}
            >
              <SelectTrigger className="h-7 text-xs">
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Any</SelectItem>
                {Object.entries(FILE_TYPE_LABELS).map(([k, label]) => (
                  <SelectItem key={k} value={k}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Time Period</label>
            <Select
              value={value.date_restrict || '__none__'}
              onValueChange={v => onChange({ ...value, date_restrict: (v === '__none__' ? '' : v) as DateRestrict })}
            >
              <SelectTrigger className="h-7 text-xs">
                <SelectValue placeholder="Any time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Any time</SelectItem>
                {Object.entries(DATE_RESTRICT_LABELS).map(([k, label]) => (
                  <SelectItem key={k} value={k}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-2 space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Exact Phrase (must contain)</label>
            <Input
              placeholder='e.g. machine learning'
              value={value.exact_terms}
              onChange={e => onChange({ ...value, exact_terms: e.target.value })}
              className="h-7 text-xs"
            />
          </div>

          <div className="col-span-2 space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Exclude Terms (space-separated)</label>
            <Input
              placeholder='e.g. provisional abandoned'
              value={value.exclude_terms}
              onChange={e => onChange({ ...value, exclude_terms: e.target.value })}
              className="h-7 text-xs"
            />
          </div>

          {activeCount > 0 && (
            <div className="col-span-2">
              <button
                type="button"
                className="text-xs text-red-500 hover:text-red-600"
                onClick={() => onChange(EMPTY_ADVANCED)}
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AddQueryDialog({
  open,
  onOpenChange,
  sessionId,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  onSubmit: (data: { session: string; query_text: string; category: SearchCategory } & AdvancedQueryFilters) => Promise<any>;
}) {
  const [queryText, setQueryText] = useState('');
  const [category, setCategory] = useState<SearchCategory>('general');
  const [advanced, setAdvanced] = useState<AdvancedQueryFilters>(EMPTY_ADVANCED);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!queryText.trim()) {
      toast.error('Query text is required');
      return;
    }
    try {
      setSubmitting(true);
      await onSubmit({
        session: sessionId,
        query_text: queryText.trim(),
        category,
        ...advanced,
      });
      setQueryText('');
      setCategory('general');
      setAdvanced(EMPTY_ADVANCED);
      onOpenChange(false);
    } catch {
      // Error already toasted in hook
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg flex flex-col max-h-[88vh]">
        <DialogHeader className="shrink-0">
          <DialogTitle>Add Custom Query</DialogTitle>
          <DialogDescription>
            Add a custom search query to this session.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto space-y-4 py-2 pr-1">
          <div className="space-y-2">
            <label htmlFor="query-text" className="text-sm font-medium">
              Search Query
            </label>
            <Input
              id="query-text"
              placeholder='e.g., "CompanyX product feature" patent infringement'
              value={queryText}
              onChange={e => setQueryText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="query-category" className="text-sm font-medium">
              Category
            </label>
            <Select value={category} onValueChange={v => setCategory(v as SearchCategory)}>
              <SelectTrigger id="query-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(CATEGORY_LABELS) as SearchCategory[]).map(cat => (
                  <SelectItem key={cat} value={cat}>
                    {CATEGORY_LABELS[cat]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <AdvancedOptionsPanel value={advanced} onChange={setAdvanced} />
        </div>
        <DialogFooter className="shrink-0 pt-2 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !queryText.trim()}>
            {submitting ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Search className="h-4 w-4 mr-2" />
            )}
            Add Query
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ==================== Main Page ====================

export default function WebSearchPage() {
  const searchParams = useSearchParams();
  const source = searchParams.get('source') as SourceType | null;
  const sourceId = searchParams.get('sourceId');

  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [selectedQueryFilter, setSelectedQueryFilter] = useState<string | null>(null); // null = All
  const [newSessionOpen, setNewSessionOpen] = useState(false);
  const [addQueryOpen, setAddQueryOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [resultsPage, setResultsPage] = useState(1);
  const RESULTS_PER_PAGE = 20;

  const {
    sessions,
    loading: sessionsLoading,
    fetchSessions,
    createSession,
    deleteSession,
  } = useWebSearchSessions();

  const { config: searchConfig } = useSearchConfig();

  const {
    session,
    queries,
    results,
    loading: sessionLoading,
    executing,
    generateQueries,
    executeAllQueries,
    executeQuery,
    createQuery,
    updateQuery,
    deleteQuery,
    updateResult,
    fetchSession,
    executingQueryId,
  } = useWebSearchSession(selectedSessionId, searchConfig);

  const { quota, loading: quotaLoading, fetchQuota } = useWebSearchQuota();

  // Reset query filter when session changes
  useEffect(() => {
    setSelectedQueryFilter(null);
  }, [selectedSessionId]);

  // Auto-create or select session from URL params
  useEffect(() => {
    if (!source || !sourceId || sessionsLoading) return;

    const existing = sessions.find(
      s => s.source_type === source && s.source_id === sourceId
    );
    if (existing) {
      setSelectedSessionId(existing.id);
    } else {
      // Auto-create session for this source
      const titlePrefix = SOURCE_TYPE_LABELS[source] || 'Search';
      createSession({
        title: `${titlePrefix} — ${sourceId}`,
        source_type: source,
        source_id: sourceId,
      }).then(newSession => {
        if (newSession) {
          setSelectedSessionId(newSession.id);
        }
      }).catch(() => {
        // Error already toasted
      });
    }
    // Only run when sessions finish loading or URL params change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, sourceId, sessionsLoading]);

  const handleCreateSession = useCallback(
    async (data: CreateSessionRequest) => {
      const newSession = await createSession(data);
      if (newSession) {
        setSelectedSessionId(newSession.id);
        fetchQuota();
      }
    },
    [createSession, fetchQuota]
  );

  const handleDeleteSession = useCallback(
    async (id: string) => {
      await deleteSession(id);
      if (selectedSessionId === id) {
        setSelectedSessionId(null);
      }
      setDeleteConfirmId(null);
    },
    [deleteSession, selectedSessionId]
  );

  const handleGenerateQueries = useCallback(async () => {
    if (!session) return;
    await generateQueries(session.context_data);
  }, [session, generateQueries]);

  const handleExecuteAll = useCallback(async () => {
    await executeAllQueries();
    fetchQuota();
    fetchSessions(); // Refresh session list counts
  }, [executeAllQueries, fetchQuota, fetchSessions]);

  const handleExecuteQuery = useCallback(
    async (queryId: string) => {
      setSelectedQueryFilter(queryId);
      await executeQuery(queryId);
      fetchQuota();
      fetchSessions(); // Refresh session list counts
    },
    [executeQuery, fetchQuota, fetchSessions]
  );

  const handleToggleFlag = useCallback(
    (result: SearchResult) => {
      updateResult(result.id, { is_flagged: !result.is_flagged });
    },
    [updateResult]
  );

  const handleToggleSave = useCallback(
    (result: SearchResult) => {
      updateResult(result.id, { is_saved: !result.is_saved });
    },
    [updateResult]
  );

  // Reset pagination when query filter changes
  useEffect(() => { setResultsPage(1); }, [selectedQueryFilter]);

  // Filtered results based on selected query
  const filteredResults = selectedQueryFilter
    ? results.filter(r => r.query === selectedQueryFilter)
    : results;
  const paginatedResults = filteredResults.slice(0, resultsPage * RESULTS_PER_PAGE);
  const hasMoreResults = filteredResults.length > paginatedResults.length;

  const handleSaveAll = useCallback(async () => {
    const unsaved = filteredResults.filter(r => !r.is_saved);
    if (unsaved.length === 0) {
      toast.info('All results are already saved.');
      return;
    }
    try {
      await Promise.all(unsaved.map(r => updateResult(r.id, { is_saved: true })));
      toast.success(`Saved ${unsaved.length} results`);
    } catch {
      toast.error('Failed to save some results');
    }
  }, [filteredResults, updateResult]);

  const handleUpdateQuery = useCallback(
    (queryId: string, data: Partial<Pick<SearchQuery, 'query_text' | 'category' | 'site_filter' | 'file_type' | 'date_restrict' | 'exact_terms' | 'exclude_terms'>>) => {
      updateQuery(queryId, data);
    },
    [updateQuery]
  );

  const handleDeleteQuery = useCallback(
    (queryId: string) => {
      deleteQuery(queryId);
    },
    [deleteQuery]
  );

  const pendingQueryCount = queries.filter(q => !q.executed_at).length;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Page Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Globe className="h-6 w-6" />
            Web Search
          </h1>
          <p className="text-sm text-muted-foreground">
            Search the web for patent evidence, prior art, and competitive intelligence
          </p>
        </div>
        <Button onClick={() => setNewSessionOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Session
        </Button>
      </div>

      {/* Master-Detail Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel — Session List */}
        <div className={cn(
          'border-r flex flex-col shrink-0 transition-all duration-300 ease-in-out overflow-hidden',
          sidebarCollapsed ? 'w-10' : 'w-[300px]'
        )}>
          {sidebarCollapsed ? (
            /* ── Collapsed rail ── */
            <div className="flex flex-col items-center py-2 gap-1 flex-1">
              {/* Expand button */}
              <button
                type="button"
                onClick={() => setSidebarCollapsed(false)}
                className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Expand sidebar"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <Separator className="my-1 w-6" />
              {/* Group type dots */}
              {SOURCE_TYPE_ORDER.map(sourceType => {
                const group = sessions.filter(s => s.source_type === sourceType);
                if (group.length === 0) return null;
                const hasSelected = group.some(s => s.id === selectedSessionId);
                return (
                  <button
                    key={sourceType}
                    type="button"
                    onClick={() => setSidebarCollapsed(false)}
                    className={cn(
                      'relative h-7 w-7 flex items-center justify-center rounded-md transition-colors',
                      hasSelected ? 'bg-primary/10' : 'hover:bg-muted/60'
                    )}
                    title={`${SOURCE_TYPE_LABELS[sourceType]} (${group.length})`}
                    aria-label={`${SOURCE_TYPE_LABELS[sourceType]}: ${group.length} session${group.length !== 1 ? 's' : ''}`}
                  >
                    <span className={cn(
                      'h-2 w-2 rounded-full',
                      sourceType === 'infringement' ? 'bg-red-500' :
                      sourceType === 'prior_art' ? 'bg-blue-500' :
                      sourceType === 'portfolio' ? 'bg-green-500' :
                      'bg-neutral-400'
                    )} />
                    <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-muted border text-[8px] font-bold flex items-center justify-center leading-none">
                      {group.length}
                    </span>
                  </button>
                );
              })}
              <div className="flex-1" />
              {/* New session icon */}
              <button
                type="button"
                onClick={() => { setSidebarCollapsed(false); setNewSessionOpen(true); }}
                className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors mb-1"
                aria-label="New session"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          ) : (
            /* ── Expanded sidebar ── */
            <>
              <div className="flex items-center justify-between pr-2">
                <div className="flex-1">
                  <QuotaIndicator quota={quota} loading={quotaLoading} />
                </div>
                <button
                  type="button"
                  onClick={() => setSidebarCollapsed(true)}
                  className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors shrink-0"
                  aria-label="Collapse sidebar"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              </div>
              <Separator />
              <div className="px-3 py-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Sessions ({sessions.length})
                </p>
              </div>
              <ScrollArea className="flex-1">
                {sessionsLoading ? (
                  <SessionListSkeleton />
                ) : sessions.length === 0 ? (
                  <div className="px-3 py-8 text-center">
                    <Search className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No sessions yet</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2"
                      onClick={() => setNewSessionOpen(true)}
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Create One
                    </Button>
                  </div>
                ) : (
                  <div className="px-1.5 pb-4 space-y-1 pt-1">
                    {SOURCE_TYPE_ORDER.map(sourceType => {
                      const group = sessions.filter(s => s.source_type === sourceType);
                      if (group.length === 0) return null;
                      return (
                        <SessionGroup
                          key={sourceType}
                          sourceType={sourceType}
                          sessions={group}
                          selectedSessionId={selectedSessionId}
                          onSelect={setSelectedSessionId}
                        />
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </>
          )}
        </div>

        {/* Right Panel — Session Detail */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {!selectedSessionId ? (
            <EmptySessionState />
          ) : sessionLoading ? (
            <SessionDetailSkeleton />
          ) : !session ? (
            <EmptySessionState />
          ) : (
            <ScrollArea className="flex-1">
              <div className="p-6 space-y-6">
                {/* Session Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">{session.title}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        variant="secondary"
                        className={cn('text-xs', SOURCE_TYPE_COLORS[session.source_type])}
                      >
                        {SOURCE_TYPE_LABELS[session.source_type]}
                      </Badge>
                      <Badge
                        variant={session.status === 'active' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {session.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Created {new Date(session.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {session.notes && (
                      <p className="text-sm text-muted-foreground mt-2">{session.notes}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => fetchSession()}
                      aria-label="Refresh session"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => setDeleteConfirmId(session.id)}
                      aria-label="Delete session"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Queries Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      Queries ({queries.length})
                    </h3>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setAddQueryOpen(true)}
                        disabled={executing}
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Add Query
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleGenerateQueries}
                        disabled={executing}
                      >
                        {executing ? (
                          <RefreshCw className="h-3.5 w-3.5 mr-1 animate-spin" />
                        ) : (
                          <Search className="h-3.5 w-3.5 mr-1" />
                        )}
                        Auto-Generate
                      </Button>
                      {pendingQueryCount > 0 && (
                        <Button
                          size="sm"
                          onClick={handleExecuteAll}
                          disabled={executing}
                        >
                          {executing ? (
                            <RefreshCw className="h-3.5 w-3.5 mr-1 animate-spin" />
                          ) : (
                            <Play className="h-3.5 w-3.5 mr-1" />
                          )}
                          Run All ({pendingQueryCount})
                        </Button>
                      )}
                    </div>
                  </div>

                  {queries.length === 0 ? (
                    <Card>
                      <CardContent className="py-8 text-center">
                        <Search className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">
                          No queries yet. Auto-generate queries from session context or add custom ones.
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-2">
                      {queries.map(q => (
                        <QueryCard
                          key={q.id}
                          query={q}
                          executingQueryId={executingQueryId}
                          isSelected={selectedQueryFilter === q.id}
                          onExecute={handleExecuteQuery}
                          onSelect={(id) => setSelectedQueryFilter(prev => prev === id ? null : id)}
                          onUpdate={handleUpdateQuery}
                          onDelete={handleDeleteQuery}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Results Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      Results ({filteredResults.length}{selectedQueryFilter ? `/${results.length}` : ''})
                    </h3>
                    {filteredResults.length > 0 && (
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Flag className="h-3 w-3 text-red-500" />
                            {filteredResults.filter(r => r.is_flagged).length} flagged
                          </span>
                          <span className="flex items-center gap-1">
                            <BookmarkCheck className="h-3 w-3 text-amber-500" />
                            {filteredResults.filter(r => r.is_saved).length}/{filteredResults.length} saved
                          </span>
                        </div>
                        {filteredResults.some(r => !r.is_saved) && (
                          <Button
                            size="sm"
                            variant="default"
                            className="h-7 gap-1.5 text-xs bg-amber-500 hover:bg-amber-600 text-white"
                            onClick={handleSaveAll}
                          >
                            <Save className="h-3.5 w-3.5" />
                            Save All
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Query filter pills */}
                  {results.length > 0 && queries.filter(q => q.executed_at).length > 1 && (
                    <div className="flex flex-wrap items-center gap-1.5 mb-3">
                      <button
                        onClick={() => setSelectedQueryFilter(null)}
                        className={cn(
                          'px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
                          !selectedQueryFilter
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        )}
                      >
                        All ({results.length})
                      </button>
                      {queries.filter(q => q.executed_at).map(q => {
                        const count = results.filter(r => r.query === q.id).length;
                        return (
                          <button
                            key={q.id}
                            onClick={() => setSelectedQueryFilter(prev => prev === q.id ? null : q.id)}
                            className={cn(
                              'px-2.5 py-1 rounded-full text-xs font-medium transition-colors max-w-[200px] truncate',
                              selectedQueryFilter === q.id
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                            )}
                            title={q.query_text}
                          >
                            {q.query_text} ({count})
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {results.length === 0 ? (
                    <Card>
                      <CardContent className="py-8 text-center">
                        <Globe className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">
                          No results yet. Execute queries to see search results here.
                        </p>
                      </CardContent>
                    </Card>
                  ) : filteredResults.length === 0 ? (
                    <Card>
                      <CardContent className="py-6 text-center">
                        <p className="text-sm text-muted-foreground">
                          No results for this query.
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-2">
                      {paginatedResults.map(r => {
                        const queryObj = queries.find(q => q.id === r.query);
                        return (
                          <SearchResultCard
                            key={r.id}
                            result={r}
                            queryText={queryObj?.query_text || ''}
                            onToggleFlag={() => handleToggleFlag(r)}
                            onToggleSave={() => handleToggleSave(r)}
                          />
                        );
                      })}
                      {hasMoreResults && (
                        <div className="text-center pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setResultsPage(prev => prev + 1)}
                          >
                            Load more ({filteredResults.length - paginatedResults.length} remaining)
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <NewSessionDialog
        open={newSessionOpen}
        onOpenChange={setNewSessionOpen}
        onSubmit={handleCreateSession}
        defaultSourceType={source || undefined}
      />

      {selectedSessionId && (
        <AddQueryDialog
          open={addQueryOpen}
          onOpenChange={setAddQueryOpen}
          sessionId={selectedSessionId}
          onSubmit={createQuery}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent className="sm:max-w-sm flex flex-col max-h-[88vh]">
          <DialogHeader className="shrink-0">
            <DialogTitle>Delete Session</DialogTitle>
            <DialogDescription>
              This will permanently delete the session and all its queries and results. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="shrink-0 pt-2">
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && handleDeleteSession(deleteConfirmId)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
