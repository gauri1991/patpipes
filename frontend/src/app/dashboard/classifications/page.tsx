'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  ChevronRight,
  Tags,
  Layers,
  FolderTree,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { patentsService, ClassificationEntry } from '@/domains/patents/services/patents.service';

type SystemType = 'CPC' | 'IPC';

interface BreadcrumbItem {
  code: string;
  title: string;
}

export default function ClassificationsPage() {
  const [system, setSystem] = useState<SystemType>('CPC');
  const [entries, setEntries] = useState<ClassificationEntry[]>([]);
  const [breadcrumb, setBreadcrumb] = useState<BreadcrumbItem[]>([]);
  const [currentParent, setCurrentParent] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ClassificationEntry[] | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [stats, setStats] = useState<{ cpc: number; ipc: number }>({ cpc: 0, ipc: 0 });

  const fetchEntries = useCallback(async (sys: SystemType, parent: string) => {
    setLoading(true);
    try {
      const data = await patentsService.browseClassifications(sys, parent || undefined);
      setEntries(data.results);
    } catch (err) {
      console.error('Failed to browse classifications:', err);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load initial entries and stats
  useEffect(() => {
    fetchEntries(system, '');
    setBreadcrumb([]);
    setCurrentParent('');
    setSearchResults(null);
    setSearchQuery('');
  }, [system, fetchEntries]);

  // Fetch stats on mount
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [cpcData, ipcData] = await Promise.all([
          patentsService.browseClassifications('CPC'),
          patentsService.browseClassifications('IPC'),
        ]);
        setStats({
          cpc: cpcData.count,
          ipc: ipcData.count,
        });
      } catch {
        // Stats are non-critical
      }
    };
    fetchStats();
  }, []);

  const handleDrillDown = async (entry: ClassificationEntry) => {
    if (entry.child_count === 0) return;
    const newBreadcrumb = [...breadcrumb, { code: entry.code, title: entry.title }];
    setBreadcrumb(newBreadcrumb);
    setCurrentParent(entry.code);
    setSearchResults(null);
    setSearchQuery('');
    await fetchEntries(system, entry.code);
  };

  const handleBreadcrumbClick = async (index: number) => {
    if (index < 0) {
      // Go to root
      setBreadcrumb([]);
      setCurrentParent('');
      await fetchEntries(system, '');
    } else {
      const newBreadcrumb = breadcrumb.slice(0, index + 1);
      const parent = newBreadcrumb[newBreadcrumb.length - 1].code;
      setBreadcrumb(newBreadcrumb);
      setCurrentParent(parent);
      await fetchEntries(system, parent);
    }
    setSearchResults(null);
    setSearchQuery('');
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    setSearchLoading(true);
    try {
      const data = await patentsService.searchClassifications(searchQuery, system);
      setSearchResults(data.results);
    } catch (err) {
      console.error('Failed to search classifications:', err);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults(null);
  };

  const displayEntries = searchResults ?? entries;
  const isSearching = searchResults !== null;

  const levelColors: Record<string, string> = {
    section: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400',
    class: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
    subclass: 'bg-violet-500/10 text-violet-700 dark:text-violet-400',
    group: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
    subgroup: 'bg-neutral-500/10 text-neutral-700 dark:text-neutral-400',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Patent Classifications</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Browse IPC and CPC classification hierarchies
          </p>
        </div>

        {/* System toggle */}
        <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
          <Button
            variant={system === 'CPC' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSystem('CPC')}
            className="px-4"
          >
            CPC
          </Button>
          <Button
            variant={system === 'IPC' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSystem('IPC')}
            className="px-4"
          >
            IPC
          </Button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-lg bg-cyan-500/10 p-2">
              <Tags className="h-4 w-4 text-cyan-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">CPC Sections</p>
              <p className="text-lg font-semibold">{stats.cpc || '-'}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/10 p-2">
              <Layers className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">IPC Sections</p>
              <p className="text-lg font-semibold">{stats.ipc || '-'}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-2">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-lg bg-violet-500/10 p-2">
              <FolderTree className="h-4 w-4 text-violet-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Current System</p>
              <p className="text-lg font-semibold">
                {system === 'CPC' ? 'Cooperative Patent Classification' : 'International Patent Classification'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={`Search ${system} codes or titles...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="pl-10"
          />
        </div>
        <Button onClick={handleSearch} disabled={searchLoading}>
          {searchLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
        </Button>
        {isSearching && (
          <Button variant="outline" onClick={clearSearch}>
            Clear
          </Button>
        )}
      </div>

      {/* Breadcrumb trail */}
      {!isSearching && breadcrumb.length > 0 && (
        <div className="flex items-center gap-1 text-sm flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-muted-foreground hover:text-foreground"
            onClick={() => handleBreadcrumbClick(-1)}
          >
            <ArrowLeft className="mr-1 h-3 w-3" />
            Root
          </Button>
          {breadcrumb.map((item, idx) => (
            <div key={item.code} className="flex items-center gap-1">
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
              <Button
                variant={idx === breadcrumb.length - 1 ? 'secondary' : 'ghost'}
                size="sm"
                className="h-7 px-2"
                onClick={() => handleBreadcrumbClick(idx)}
                disabled={idx === breadcrumb.length - 1}
              >
                <span className="font-mono mr-1">{item.code}</span>
                <span className="max-w-[200px] truncate text-muted-foreground">
                  {item.title}
                </span>
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Main content table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {isSearching
              ? `Search results for "${searchQuery}" (${displayEntries.length})`
              : currentParent
                ? `Children of ${currentParent}`
                : `${system} Top-Level Sections`}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : displayEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Tags className="h-8 w-8 mb-2" />
              <p>No classifications found</p>
              {isSearching && (
                <p className="text-xs mt-1">Try a different search term</p>
              )}
            </div>
          ) : (
            <div className="divide-y">
              <AnimatePresence mode="popLayout">
                {displayEntries.map((entry, idx) => (
                  <motion.div
                    key={`${entry.system}-${entry.code}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15, delay: idx * 0.02 }}
                    className={`flex items-center gap-4 px-4 py-3 ${
                      entry.child_count > 0
                        ? 'cursor-pointer hover:bg-muted/50 transition-colors'
                        : ''
                    }`}
                    onClick={() => entry.child_count > 0 && handleDrillDown(entry)}
                  >
                    {/* Code */}
                    <div className="w-32 shrink-0">
                      <span className="font-mono text-sm font-semibold">{entry.code}</span>
                    </div>

                    {/* Title with indent dots */}
                    <div className="flex-1 min-w-0 flex items-center gap-2">
                      {entry.indent_level > 0 && (
                        <span className="shrink-0 flex items-center gap-1" aria-hidden="true">
                          {Array.from({ length: entry.indent_level }).map((_, i) => (
                            <span
                              key={i}
                              className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60"
                            />
                          ))}
                        </span>
                      )}
                      <p className="text-sm truncate">{entry.title}</p>
                    </div>

                    {/* Level badge */}
                    <Badge
                      variant="secondary"
                      className={`shrink-0 text-xs capitalize ${levelColors[entry.level] || ''}`}
                    >
                      {entry.level}
                    </Badge>

                    {/* Child count + chevron */}
                    <div className="flex items-center gap-2 shrink-0 w-20 justify-end">
                      {entry.child_count > 0 && (
                        <>
                          <span className="text-xs text-muted-foreground">
                            {entry.child_count}
                          </span>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
