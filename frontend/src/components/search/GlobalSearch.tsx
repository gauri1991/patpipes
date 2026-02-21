'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  FolderOpen,
  FileText,
  BarChart3,
  Database,
  Lightbulb,
  Command,
  Loader2,
  X,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { analyticsApi } from '@/services/analyticsApi';

interface SearchResult {
  id: string;
  title: string;
  description: string;
  category: SearchCategory;
  href: string;
}

type SearchCategory = 'projects' | 'reports' | 'datasets' | 'insights';

const CATEGORY_CONFIG: Record<SearchCategory, {
  label: string;
  icon: React.ElementType;
  color: string;
}> = {
  projects: { label: 'Projects', icon: FolderOpen, color: 'text-blue-500' },
  reports: { label: 'Reports', icon: FileText, color: 'text-green-500' },
  datasets: { label: 'Datasets', icon: Database, color: 'text-purple-500' },
  insights: { label: 'Insights', icon: Lightbulb, color: 'text-yellow-500' },
};

const QUICK_LINKS = [
  { title: 'Analytics Dashboard', description: 'Overview and metrics', href: '/dashboard/analytics', icon: BarChart3 },
  { title: 'New Project', description: 'Create an analytics project', href: '/dashboard/analytics', icon: FolderOpen },
  { title: 'Patent Search', description: 'Look up patents by number', href: '/dashboard/patent-search', icon: Search },
  { title: 'Portfolio', description: 'Patent portfolio management', href: '/dashboard/portfolio', icon: FileText },
];

export interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Focus input when dialog opens
  useEffect(() => {
    if (open) {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
      // Delay focus to allow dialog to render
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      try {
        const searchResults: SearchResult[] = [];

        // Search across all categories in parallel
        const [projectsRes, reportsRes, datasetsRes, insightsRes] = await Promise.allSettled([
          analyticsApi.getProjects(),
          analyticsApi.getReports(),
          analyticsApi.getDatasets(),
          analyticsApi.getInsights(),
        ]);

        const lowerQuery = query.toLowerCase();

        // Process projects
        if (projectsRes.status === 'fulfilled' && projectsRes.value.success && projectsRes.value.data) {
          const data = projectsRes.value.data;
          const projectsArray = Array.isArray(data) ? data : ('results' in (data as Record<string, unknown>) ? (data as unknown as { results: typeof data }).results : []);
          projectsArray
            .filter((p) =>
              p.name.toLowerCase().includes(lowerQuery) ||
              (p.description && p.description.toLowerCase().includes(lowerQuery))
            )
            .slice(0, 5)
            .forEach((p) => {
              searchResults.push({
                id: p.id,
                title: p.name,
                description: p.description || `${p.status} - ${p.priority} priority`,
                category: 'projects',
                href: `/dashboard/analytics/projects/${p.id}`,
              });
            });
        }

        // Process reports
        if (reportsRes.status === 'fulfilled' && reportsRes.value.success && reportsRes.value.data) {
          const data = reportsRes.value.data;
          const reportsArray = Array.isArray(data) ? data : ('results' in (data as Record<string, unknown>) ? (data as unknown as { results: typeof data }).results : []);
          reportsArray
            .filter((r) =>
              r.title.toLowerCase().includes(lowerQuery) ||
              (r.executive_summary && r.executive_summary.toLowerCase().includes(lowerQuery))
            )
            .slice(0, 5)
            .forEach((r) => {
              searchResults.push({
                id: r.id,
                title: r.title,
                description: r.executive_summary?.slice(0, 100) || r.report_type.replace(/_/g, ' '),
                category: 'reports',
                href: `/dashboard/analytics/reports/${r.id}`,
              });
            });
        }

        // Process datasets
        if (datasetsRes.status === 'fulfilled' && datasetsRes.value.success && datasetsRes.value.data) {
          const data = datasetsRes.value.data;
          const datasetsArray = Array.isArray(data) ? data : ('results' in (data as Record<string, unknown>) ? (data as unknown as { results: typeof data }).results : []);
          datasetsArray
            .filter((d) =>
              d.name.toLowerCase().includes(lowerQuery) ||
              (d.description && d.description.toLowerCase().includes(lowerQuery))
            )
            .slice(0, 5)
            .forEach((d) => {
              searchResults.push({
                id: d.id,
                title: d.name,
                description: d.description || `${d.total_patents} patents - ${d.processing_status}`,
                category: 'datasets',
                href: `/dashboard/analytics`,
              });
            });
        }

        // Process insights
        if (insightsRes.status === 'fulfilled' && insightsRes.value.success && insightsRes.value.data) {
          const data = insightsRes.value.data;
          const insightsArray = Array.isArray(data) ? data : ('results' in (data as Record<string, unknown>) ? (data as unknown as { results: typeof data }).results : []);
          insightsArray
            .filter((i) =>
              i.title.toLowerCase().includes(lowerQuery) ||
              (i.description && i.description.toLowerCase().includes(lowerQuery))
            )
            .slice(0, 5)
            .forEach((i) => {
              searchResults.push({
                id: i.id,
                title: i.title,
                description: i.description?.slice(0, 100) || 'Analytics insight',
                category: 'insights',
                href: `/dashboard/analytics`,
              });
            });
        }

        setResults(searchResults);
        setSelectedIndex(0);
      } catch {
        // Silently handle errors - user sees empty results
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const handleNavigate = useCallback((href: string) => {
    onOpenChange(false);
    router.push(href);
  }, [router, onOpenChange]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const totalItems = query.trim() ? results.length : QUICK_LINKS.length;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(totalItems, 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + Math.max(totalItems, 1)) % Math.max(totalItems, 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (query.trim() && results[selectedIndex]) {
        handleNavigate(results[selectedIndex].href);
      } else if (!query.trim() && QUICK_LINKS[selectedIndex]) {
        handleNavigate(QUICK_LINKS[selectedIndex].href);
      }
    }
  }, [query, results, selectedIndex, handleNavigate]);

  // Group results by category
  const groupedResults = results.reduce<Record<string, SearchResult[]>>((acc, result) => {
    if (!acc[result.category]) acc[result.category] = [];
    acc[result.category].push(result);
    return acc;
  }, {});

  // Compute a flat index for each result for keyboard nav
  let flatIndex = 0;
  const getFlatIndex = () => flatIndex++;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 gap-0 overflow-hidden">
        <DialogTitle className="sr-only">Global Search</DialogTitle>
        {/* Search Input */}
        <div className="flex items-center border-b px-4">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search projects, reports, datasets..."
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-12 text-base"
            aria-label="Global search"
          />
          {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />}
          {query && !loading && (
            <button
              onClick={() => setQuery('')}
              className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Results Area */}
        <ScrollArea className="max-h-[400px]">
          <div className="p-2">
            {/* No query: Show quick links */}
            {!query.trim() && (
              <div>
                <p className="text-xs font-medium text-muted-foreground px-2 py-1.5">Quick Links</p>
                {QUICK_LINKS.map((link, index) => (
                  <button
                    key={link.href + link.title}
                    onClick={() => handleNavigate(link.href)}
                    className={`w-full flex items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors ${
                      index === selectedIndex ? 'bg-accent' : 'hover:bg-accent/50'
                    }`}
                  >
                    <link.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 text-left">
                      <div className="font-medium">{link.title}</div>
                      <div className="text-xs text-muted-foreground">{link.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Loading state */}
            {query.trim() && loading && results.length === 0 && (
              <div className="text-center py-8 text-sm text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                Searching...
              </div>
            )}

            {/* No results */}
            {query.trim() && !loading && results.length === 0 && (
              <div className="text-center py-8 text-sm text-muted-foreground">
                <Search className="h-5 w-5 mx-auto mb-2 opacity-50" />
                No results found for &ldquo;{query}&rdquo;
              </div>
            )}

            {/* Grouped Results */}
            {query.trim() && results.length > 0 && (
              <div className="space-y-1">
                {(Object.entries(groupedResults) as [SearchCategory, SearchResult[]][]).map(([category, categoryResults]) => {
                  const config = CATEGORY_CONFIG[category];
                  const CategoryIcon = config.icon;
                  return (
                    <div key={category}>
                      <div className="flex items-center gap-2 px-2 py-1.5">
                        <CategoryIcon className={`h-3.5 w-3.5 ${config.color}`} />
                        <p className="text-xs font-medium text-muted-foreground">{config.label}</p>
                      </div>
                      {categoryResults.map((result) => {
                        const idx = getFlatIndex();
                        return (
                          <button
                            key={result.id}
                            onClick={() => handleNavigate(result.href)}
                            className={`w-full flex items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors ${
                              idx === selectedIndex ? 'bg-accent' : 'hover:bg-accent/50'
                            }`}
                          >
                            <CategoryIcon className={`h-4 w-4 shrink-0 ${config.color}`} />
                            <div className="flex-1 text-left min-w-0">
                              <div className="font-medium truncate">{result.title}</div>
                              <div className="text-xs text-muted-foreground truncate">
                                {result.description}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="flex items-center justify-between border-t px-4 py-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                <span className="text-xs">&#8593;&#8595;</span>
              </kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                &#9166;
              </kbd>
              Open
            </span>
            <span className="flex items-center gap-1">
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                Esc
              </kbd>
              Close
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Command className="h-3 w-3" />
            <span>K to search</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
