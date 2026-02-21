/**
 * PortfolioSelector Component
 * Displays a list of portfolios for users to select from.
 * Shows import progress on cards when a background ODP import is running.
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  FileText,
  Clock,
  ArrowRight,
  Plus,
  Search,
  Loader2,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { usePortfolio } from '../contexts/PortfolioContext';
import { portfolioService } from '../services/portfolio.service';
import { patentsService, ODPImportJobStatus } from '../services/patents.service';
import { formatCurrency, formatCurrencyCompact } from '@/lib/utils';

const POLL_INTERVAL = 3000;
const COMPLETION_DISPLAY_MS = 5000;

export function PortfolioSelector() {
  const router = useRouter();
  const { portfolios, portfolioCount, isLoading, error, selectPortfolio, refreshPortfolios } = usePortfolio();
  const [searchTerm, setSearchTerm] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newDescription, setNewDescription] = useState('');

  // ODP count overrides (after refresh)
  const [odpCounts, setOdpCounts] = useState<Record<string, number>>({});

  // Import progress tracking
  const [activeImports, setActiveImports] = useState<Record<string, ODPImportJobStatus>>({});
  const [completedImports, setCompletedImports] = useState<Record<string, ODPImportJobStatus>>({});
  const pollingPortfoliosRef = useRef<Set<string>>(new Set());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Poll for import status
  const pollImportStatus = useCallback(async () => {
    const portfolioIds = Array.from(pollingPortfoliosRef.current);
    if (portfolioIds.length === 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    for (const portfolioId of portfolioIds) {
      try {
        const data = await patentsService.getODPImportStatus(portfolioId);
        const activeJob = data.jobs.find(j => j.status === 'running' || j.status === 'pending');

        if (activeJob) {
          setActiveImports(prev => ({ ...prev, [portfolioId]: activeJob }));
        } else {
          // Job finished — check if we had an active one
          setActiveImports(prev => {
            const next = { ...prev };
            const wasActive = next[portfolioId];
            delete next[portfolioId];

            if (wasActive) {
              // Find the completed job
              const completedJob = data.jobs.find(j => j.status === 'completed' || j.status === 'failed');
              if (completedJob) {
                setCompletedImports(p => ({ ...p, [portfolioId]: completedJob }));
                // Auto-clear after delay
                setTimeout(() => {
                  setCompletedImports(p => {
                    const n = { ...p };
                    delete n[portfolioId];
                    return n;
                  });
                }, COMPLETION_DISPLAY_MS);
              }
              refreshPortfolios();
            }

            pollingPortfoliosRef.current.delete(portfolioId);
            return next;
          });
        }
      } catch {
        // Silently ignore poll errors
      }
    }
  }, [refreshPortfolios]);

  // Start polling for a portfolio
  const startPolling = useCallback((portfolioId: string) => {
    pollingPortfoliosRef.current.add(portfolioId);
    if (!intervalRef.current) {
      intervalRef.current = setInterval(pollImportStatus, POLL_INTERVAL);
    }
    // Immediate first poll
    pollImportStatus();
  }, [pollImportStatus]);

  // Check for active imports on mount / when portfolios load
  useEffect(() => {
    if (portfolios.length === 0) return;
    let cancelled = false;
    (async () => {
      for (const p of portfolios) {
        if (cancelled) break;
        try {
          const data = await patentsService.getODPImportStatus(p.id);
          const active = data.jobs.find((j: ODPImportJobStatus) => j.status === 'running' || j.status === 'pending' || j.status === 'paused');
          if (active && !cancelled) {
            startPolling(p.id);
          }
        } catch {
          // ignore
        }
      }
    })();
    return () => {
      cancelled = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [portfolios.length]);

  // Expose startPolling to ImportFromUSPTODialog via a global callback
  // This is set on window so the dialog can call it after kicking off an import
  useEffect(() => {
    (window as any).__onODPImportStarted = (portfolioId: string) => {
      startPolling(portfolioId);
    };
    return () => {
      delete (window as any).__onODPImportStarted;
    };
  }, [startPolling]);

  // Filter portfolios based on search
  const filteredPortfolios = portfolios.filter(portfolio =>
    portfolio.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    portfolio.company_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePortfolioSelect = (portfolio: any) => {
    selectPortfolio(portfolio);
    router.push(`/dashboard/portfolio/${portfolio.id}`);
  };

  const handleCreateNewPortfolio = () => {
    setNewName('');
    setNewCompanyName('');
    setNewDescription('');
    setCreateError(null);
    setCreateDialogOpen(true);
  };

  const handleCreateSubmit = async () => {
    if (!newName.trim() || !newCompanyName.trim()) {
      setCreateError('Name and company name are required.');
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      const created = await portfolioService.createPortfolio({
        name: newName.trim(),
        company_name: newCompanyName.trim(),
        description: newDescription.trim(),
      });
      setCreateDialogOpen(false);
      await refreshPortfolios();
      router.push(`/dashboard/portfolio/${created.id}`);
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create portfolio');
    } finally {
      setCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Patent Portfolios</h1>
          <p className="text-muted-foreground mt-1">
            You have access to {portfolioCount} portfolio{portfolioCount !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-3 min-w-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search portfolios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-48 sm:w-64"
            />
          </div>
          <Button onClick={handleCreateNewPortfolio}>
            <Plus className="h-4 w-4 mr-2" />
            New Portfolio
          </Button>
        </div>
      </div>

      {/* Portfolio Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredPortfolios.map((portfolio) => {
          const activeImport = activeImports[portfolio.id];
          const completedImport = completedImports[portfolio.id];

          return (
            <Card
              key={portfolio.id}
              className="hover:shadow-lg transition-shadow cursor-pointer group overflow-hidden"
              onClick={() => handlePortfolioSelect(portfolio)}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-lg truncate">{portfolio.company_name}</CardTitle>
                      <CardDescription className="truncate">{portfolio.name}</CardDescription>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </CardHeader>
              <CardContent>
                {/* Active import progress */}
                {activeImport && (
                  <div
                    className="mb-4 p-3 rounded-lg bg-primary/5 border border-primary/10 space-y-2"
                    onClick={e => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                      <span className="text-sm font-medium">Importing from USPTO...</span>
                    </div>
                    <Progress
                      value={activeImport.total_expected > 0
                        ? (activeImport.processed / activeImport.total_expected) * 100
                        : 0}
                      className="h-1.5"
                    />
                    <p className="text-xs text-muted-foreground">
                      {activeImport.processed.toLocaleString()} / {activeImport.total_expected.toLocaleString()} processed
                      {activeImport.created_count > 0 && (
                        <> &middot; {activeImport.created_count.toLocaleString()} created</>
                      )}
                    </p>
                  </div>
                )}

                {/* Completed import notification */}
                {completedImport && !activeImport && (
                  <div className="mb-4 p-3 rounded-lg bg-green-500/5 border border-green-500/10 space-y-1">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                      <span className="text-sm font-medium text-green-700">
                        Import complete &mdash; {completedImport.created_count.toLocaleString()} patents created
                      </span>
                    </div>
                  </div>
                )}

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="space-y-1 min-w-0">
                    <p className="text-sm text-muted-foreground">Total Patents</p>
                    <p className="text-2xl font-bold">{portfolio.total_patents}</p>
                  </div>
                  <div className="space-y-1 min-w-0">
                    <p className="text-sm text-muted-foreground">Portfolio Value</p>
                    <p className="text-2xl font-bold" title={formatCurrency(portfolio.total_value)}>
                      {formatCurrencyCompact(portfolio.total_value)}
                    </p>
                  </div>
                </div>

                {/* USPTO ODP estimate */}
                {(odpCounts[portfolio.id] ?? portfolio.estimated_odp_count) != null && (
                  <div className="flex items-center gap-1.5 mb-3 text-xs text-muted-foreground">
                    <span>~{(odpCounts[portfolio.id] ?? portfolio.estimated_odp_count)!.toLocaleString()} on USPTO</span>
                    <button
                      className="p-0.5 rounded hover:bg-muted/80 transition-colors"
                      title="Refresh USPTO count"
                      onClick={async (e) => {
                        e.stopPropagation();
                        const btn = e.currentTarget;
                        btn.classList.add('animate-spin');
                        try {
                          const result = await portfolioService.refreshODPCount(portfolio.id);
                          setOdpCounts(prev => ({ ...prev, [portfolio.id]: result.estimated_odp_count }));
                        } catch {} finally {
                          btn.classList.remove('animate-spin');
                        }
                      }}
                    >
                      <RotateCcw className="h-3 w-3" />
                    </button>
                  </div>
                )}

                {/* Status Badges */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {portfolio.active_patents > 0 && (
                    <Badge variant="default" className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {portfolio.active_patents} Active
                    </Badge>
                  )}
                  {portfolio.pending_patents > 0 && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {portfolio.pending_patents} Pending
                    </Badge>
                  )}
                </div>

                {/* Quick Stats */}
                <div className="pt-3 border-t">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Status</span>
                    {portfolio.is_active ? (
                      <Badge variant="outline" className="text-green-600">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-gray-600">
                        Inactive
                      </Badge>
                    )}
                  </div>
                  {portfolio.owner_name && (
                    <div className="flex justify-between items-center text-sm mt-2">
                      <span className="text-muted-foreground">Manager</span>
                      <span className="font-medium truncate ml-2">{portfolio.owner_name}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredPortfolios.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {searchTerm ? 'No portfolios found' : 'No portfolios yet'}
          </h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm
              ? 'Try adjusting your search terms'
              : 'Create your first portfolio to get started'}
          </p>
          {!searchTerm && (
            <Button onClick={handleCreateNewPortfolio}>
              <Plus className="h-4 w-4 mr-2" />
              Create Portfolio
            </Button>
          )}
        </div>
      )}

      {/* Create Portfolio Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Portfolio</DialogTitle>
            <DialogDescription>
              Add a new patent portfolio to track and manage intellectual property.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="portfolio-name">Portfolio Name *</Label>
              <Input
                id="portfolio-name"
                placeholder="e.g., Core Technology Patents"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="company-name">Company Name *</Label>
              <Input
                id="company-name"
                placeholder="e.g., Acme Corporation"
                value={newCompanyName}
                onChange={(e) => setNewCompanyName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of this portfolio..."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                rows={3}
              />
            </div>
            {createError && (
              <p className="text-sm text-red-600">{createError}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)} disabled={creating}>
              Cancel
            </Button>
            <Button onClick={handleCreateSubmit} disabled={creating}>
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Portfolio'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
