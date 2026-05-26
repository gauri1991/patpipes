'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Sparkles, Pause, Play, X, AlertCircle, Loader2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  patentsService,
  type ODPEnrichmentJobStatus,
  type EnrichmentFilters,
} from '@/domains/patents/services/patents.service';

const STATUS_OPTIONS = [
  { value: 'granted', label: 'Granted' },
  { value: 'pending', label: 'Pending' },
  { value: 'filed', label: 'Filed' },
  { value: 'expired', label: 'Expired' },
  { value: 'abandoned', label: 'Abandoned' },
] as const;

const TYPE_OPTIONS = [
  { value: 'utility', label: 'Utility' },
  { value: 'design', label: 'Design' },
  { value: 'plant', label: 'Plant' },
  { value: 'provisional', label: 'Provisional' },
] as const;

interface EnrichmentProgressPanelProps {
  onComplete?: () => void;
  portfolioId?: string;
}

export function EnrichmentProgressPanel({ onComplete, portfolioId }: EnrichmentProgressPanelProps) {
  const [unenrichedCount, setUnenrichedCount] = useState<number | null>(null);
  const [unenrichedByStatus, setUnenrichedByStatus] = useState<Record<string, number>>({});
  const [activeJob, setActiveJob] = useState<ODPEnrichmentJobStatus | null>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevStatusRef = useRef<string | null>(null);

  // Filter state for the dialog
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [enrichmentSource, setEnrichmentSource] = useState<'odp' | 'lens'>('odp');

  const fetchStatus = useCallback(async () => {
    try {
      const res = await patentsService.getEnrichmentStatus(portfolioId, enrichmentSource);
      setUnenrichedCount(res.unenriched_count);
      setUnenrichedByStatus(res.unenriched_by_status || {});

      const running = res.jobs.find(
        (j) => j.status === 'running' || j.status === 'paused' || j.status === 'pending'
      );
      setActiveJob(running || null);

      if (
        prevStatusRef.current &&
        ['running', 'paused', 'pending'].includes(prevStatusRef.current) &&
        !running
      ) {
        onComplete?.();
      }
      prevStatusRef.current = running?.status || null;
    } catch {
      // Silently fail
    }
  }, [onComplete, portfolioId, enrichmentSource]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    if (activeJob && ['running', 'paused', 'pending'].includes(activeJob.status)) {
      pollRef.current = setInterval(fetchStatus, 5000);
    } else if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [activeJob?.status, fetchStatus]);

  // Compute filtered count for the dialog
  const filteredCount = (() => {
    if (selectedStatuses.length === 0) return unenrichedCount || 0;
    let count = 0;
    for (const s of selectedStatuses) {
      count += unenrichedByStatus[s] || 0;
    }
    return count;
  })();

  const handleStart = async () => {
    setStarting(true);
    setError('');
    try {
      const filters: EnrichmentFilters = {};
      if (selectedStatuses.length > 0) filters.status = selectedStatuses;
      if (selectedTypes.length > 0) filters.patent_type = selectedTypes;

      await patentsService.startEnrichment({
        portfolio_id: portfolioId,
        filters: Object.keys(filters).length > 0 ? filters : undefined,
        data_source: enrichmentSource,
      });
      setDialogOpen(false);
      await fetchStatus();
    } catch (err: any) {
      setError(err.message || 'Failed to start enrichment');
    } finally {
      setStarting(false);
    }
  };

  const handlePause = async () => {
    if (!activeJob) return;
    try {
      await patentsService.pauseEnrichment(activeJob.id);
      await fetchStatus();
    } catch { /* ignore */ }
  };

  const handleResume = async () => {
    if (!activeJob) return;
    try {
      await patentsService.resumeEnrichment(activeJob.id);
      await fetchStatus();
    } catch { /* ignore */ }
  };

  const handleCancel = async () => {
    if (!activeJob) return;
    try {
      await patentsService.cancelEnrichment(activeJob.id);
      await fetchStatus();
    } catch { /* ignore */ }
  };

  const toggleStatus = (val: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(val) ? prev.filter((s) => s !== val) : [...prev, val]
    );
  };

  const toggleType = (val: string) => {
    setSelectedTypes((prev) =>
      prev.includes(val) ? prev.filter((s) => s !== val) : [...prev, val]
    );
  };

  if (unenrichedCount === null) return null;
  if (unenrichedCount === 0 && !activeJob) return null;

  const totalForProgress = activeJob
    ? Math.max(activeJob.processed, activeJob.total_expected)
    : 0;
  const progressPct = totalForProgress > 0
    ? Math.round((activeJob!.processed / totalForProgress) * 100)
    : 0;

  const estimatedMinutes = filteredCount
    ? enrichmentSource === 'lens'
      ? Math.ceil((filteredCount * 0.1) / 60)  // Lens: ~50 patents per batch call
      : Math.ceil((filteredCount * 2) / 60)     // ODP: ~1 patent per 2s
    : 0;

  // Build a label for the active job's filters
  const activeFilterLabel = (() => {
    if (!activeJob?.filters) return '';
    const parts: string[] = [];
    if (activeJob.filters.status?.length) parts.push(activeJob.filters.status.join(', '));
    if (activeJob.filters.patent_type?.length) parts.push(activeJob.filters.patent_type.join(', '));
    return parts.length ? `(${parts.join(' / ')})` : '';
  })();

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* No active job — show badge + start button */}
      {!activeJob && unenrichedCount > 0 && (
        <>
          <Badge variant="outline" className="gap-1.5 py-1">
            <Sparkles className="h-3 w-3" />
            {unenrichedCount.toLocaleString()} need enrichment
          </Badge>

          <Button
            size="sm"
            variant="default"
            className="h-7 text-xs gap-1.5"
            disabled={starting}
            onClick={() => {
              setSelectedStatuses([]);
              setSelectedTypes([]);
              setEnrichmentSource('odp');
              setError('');
              setDialogOpen(true);
            }}
          >
            {starting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
            Enrich...
          </Button>

          {/* Enrichment config dialog */}
          <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Start Bulk Enrichment</AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <div className="space-y-4">
                    <p>
                      {enrichmentSource === 'odp'
                        ? 'Fetch full details from the USPTO Open Data Portal for unenriched patents.'
                        : 'Fetch patent details from Lens.org for unenriched patents.'}
                      {' '}You can pause or cancel at any time.
                    </p>

                    {/* Data source selector */}
                    <div>
                      <p className="text-sm font-medium text-foreground mb-2">Data Source</p>
                      <div className="flex gap-3">
                        <label className={`flex-1 flex items-center gap-2 rounded-md border p-3 cursor-pointer transition-colors ${enrichmentSource === 'odp' ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/50'}`}>
                          <input
                            type="radio"
                            name="enrichment-source"
                            value="odp"
                            checked={enrichmentSource === 'odp'}
                            onChange={() => setEnrichmentSource('odp')}
                            className="accent-primary"
                          />
                          <div>
                            <span className="text-sm font-medium">USPTO ODP</span>
                            <p className="text-xs text-muted-foreground">US patent data, full prosecution history</p>
                          </div>
                        </label>
                        <label className={`flex-1 flex items-center gap-2 rounded-md border p-3 cursor-pointer transition-colors ${enrichmentSource === 'lens' ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/50'}`}>
                          <input
                            type="radio"
                            name="enrichment-source"
                            value="lens"
                            checked={enrichmentSource === 'lens'}
                            onChange={() => setEnrichmentSource('lens')}
                            className="accent-primary"
                          />
                          <div>
                            <span className="text-sm font-medium">Lens.org</span>
                            <p className="text-xs text-muted-foreground">Global patent data, family &amp; citations</p>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Status filter */}
                    <div>
                      <p className="text-sm font-medium text-foreground mb-2">Patent Status</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-2">
                        {STATUS_OPTIONS.map((opt) => {
                          const count = unenrichedByStatus[opt.value] || 0;
                          return (
                            <label key={opt.value} className="flex items-center gap-2 text-sm cursor-pointer">
                              <Checkbox
                                checked={selectedStatuses.includes(opt.value)}
                                onCheckedChange={() => toggleStatus(opt.value)}
                                disabled={count === 0}
                              />
                              <span className={count === 0 ? 'text-muted-foreground' : ''}>
                                {opt.label}
                              </span>
                              <span className="text-muted-foreground text-xs">({count.toLocaleString()})</span>
                            </label>
                          );
                        })}
                      </div>
                      {selectedStatuses.length === 0 && (
                        <p className="text-xs text-muted-foreground mt-1">None selected = all statuses</p>
                      )}
                    </div>

                    {/* Type filter */}
                    <div>
                      <p className="text-sm font-medium text-foreground mb-2">Patent Type</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-2">
                        {TYPE_OPTIONS.map((opt) => (
                          <label key={opt.value} className="flex items-center gap-2 text-sm cursor-pointer">
                            <Checkbox
                              checked={selectedTypes.includes(opt.value)}
                              onCheckedChange={() => toggleType(opt.value)}
                            />
                            {opt.label}
                          </label>
                        ))}
                      </div>
                      {selectedTypes.length === 0 && (
                        <p className="text-xs text-muted-foreground mt-1">None selected = all types</p>
                      )}
                    </div>

                    {/* Summary */}
                    <div className="rounded-md bg-muted px-3 py-2 text-sm">
                      <strong>{filteredCount.toLocaleString()}</strong> patents to enrich
                      {estimatedMinutes > 0 && (
                        <> — estimated <strong>~{estimatedMinutes} min</strong></>
                      )}
                    </div>

                    {error && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5" />
                        {error}
                      </p>
                    )}
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <Button onClick={handleStart} disabled={starting || filteredCount === 0}>
                  {starting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Start Enrichment
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}

      {/* Active job progress */}
      {activeJob && (
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {activeJob.status === 'running' && (
            <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
          )}
          {activeJob.status === 'paused' && (
            <Pause className="h-4 w-4 text-yellow-500 shrink-0" />
          )}

          <div className="flex-1 min-w-[120px] max-w-xs">
            <Progress value={progressPct} className="h-2" />
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground whitespace-nowrap">
            <span>
              {activeJob.processed.toLocaleString()}/{totalForProgress.toLocaleString()}
              {activeFilterLabel && <span className="ml-1 opacity-70">{activeFilterLabel}</span>}
            </span>
            {activeJob.data_source === 'lens' && <Badge variant="outline" className="text-xs">Lens</Badge>}
            {activeJob.data_source === 'odp' && <Badge variant="outline" className="text-xs">ODP</Badge>}
            <span className="text-green-600">{activeJob.enriched_count} enriched</span>
            {activeJob.skipped_count > 0 && (
              <span className="text-yellow-600">{activeJob.skipped_count} skipped</span>
            )}
            {activeJob.failed_count > 0 && (
              <span className="text-destructive">{activeJob.failed_count} failed</span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {activeJob.status === 'running' && (
              <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={handlePause} aria-label="Pause enrichment">
                <Pause className="h-3.5 w-3.5" />
              </Button>
            )}
            {activeJob.status === 'paused' && (
              <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={handleResume} aria-label="Resume enrichment">
                <Play className="h-3.5 w-3.5" />
              </Button>
            )}

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="outline" className="h-7 w-7 p-0 text-destructive" aria-label="Cancel enrichment">
                  <X className="h-3.5 w-3.5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel Enrichment</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure? {activeJob.processed} of {activeJob.total_expected} patents have been
                    processed so far. Already enriched patents will keep their data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep Running</AlertDialogCancel>
                  <AlertDialogAction onClick={handleCancel} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Cancel Job
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      )}
    </div>
  );
}
