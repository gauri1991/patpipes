'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader2, UploadCloud, Check, AlertCircle, FolderOpen, Database } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { analyticsApi, type AnalyticsProject, type PatentDataset } from '@/services/analyticsApi';
import { apiClient } from '@/services/apiClient';

interface Portfolio {
  id: string;
  name: string;
  total_patents?: number;
  patent_count?: number;
}

interface Props {
  open: boolean;
  projectId: string;
  onOpenChange: (open: boolean) => void;
  onImportComplete: (count: number) => void;
}

type ImportState = 'idle' | 'loading' | 'success' | 'error';

export function ImportPatentsDialog({ open, projectId, onOpenChange, onImportComplete }: Props) {
  const [tab, setTab] = useState('portfolio');

  // Portfolio tab state
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [portfoliosLoading, setPortfoliosLoading] = useState(false);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState('');

  // Dataset tab state
  const [analyticsProjects, setAnalyticsProjects] = useState<AnalyticsProject[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [selectedAnalyticsProjectId, setSelectedAnalyticsProjectId] = useState('');
  const [datasets, setDatasets] = useState<PatentDataset[]>([]);
  const [datasetsLoading, setDatasetsLoading] = useState(false);
  const [selectedDatasetId, setSelectedDatasetId] = useState('');

  // File tab state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Shared import state
  const [importState, setImportState] = useState<ImportState>('idle');
  const [importedCount, setImportedCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  // Load portfolios when dialog opens
  useEffect(() => {
    if (!open) return;
    setPortfoliosLoading(true);
    apiClient.get<{ results?: Portfolio[] } | Portfolio[]>('/patents/portfolios/?limit=100')
      .then(res => {
        const data = (res as any).data ?? res;
        const list: Portfolio[] = Array.isArray(data) ? data : (data as any).results ?? [];
        setPortfolios(list);
      })
      .catch(() => {})
      .finally(() => setPortfoliosLoading(false));
  }, [open]);

  // Load analytics projects when dialog opens
  useEffect(() => {
    if (!open) return;
    setProjectsLoading(true);
    analyticsApi.getProjects(200)
      .then(res => {
        if (res.success && res.data) {
          const list = Array.isArray(res.data) ? res.data : (res.data as any).results ?? [];
          setAnalyticsProjects(list);
        }
      })
      .catch(() => {})
      .finally(() => setProjectsLoading(false));
  }, [open]);

  // Load datasets when analytics project is selected
  useEffect(() => {
    if (!selectedAnalyticsProjectId) { setDatasets([]); return; }
    setDatasetsLoading(true);
    setSelectedDatasetId('');
    analyticsApi.getDatasets(selectedAnalyticsProjectId)
      .then(res => {
        if (res.success && res.data) {
          const list = Array.isArray(res.data) ? res.data : (res.data as any).results ?? [];
          setDatasets(list.filter((d: PatentDataset) => d.processing_status === 'completed'));
        }
      })
      .catch(() => {})
      .finally(() => setDatasetsLoading(false));
  }, [selectedAnalyticsProjectId]);

  const resetState = () => {
    setImportState('idle');
    setImportedCount(0);
    setErrorMessage('');
    setSelectedPortfolioId('');
    setSelectedAnalyticsProjectId('');
    setSelectedDatasetId('');
    setSelectedFile(null);
    setDatasets([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(resetState, 200);
  };

  const handleImport = async () => {
    setImportState('loading');
    setErrorMessage('');
    try {
      let count = 0;

      if (tab === 'portfolio') {
        if (!selectedPortfolioId) { setImportState('error'); setErrorMessage('Select a portfolio.'); return; }
        const res = await analyticsApi.importDatasetFromPortfolio(projectId, selectedPortfolioId);
        if (!res.success) throw new Error(res.error ?? 'Import failed');
        count = (res.data as any)?.total_patents ?? 0;

      } else if (tab === 'dataset') {
        if (!selectedDatasetId) { setImportState('error'); setErrorMessage('Select a dataset.'); return; }
        const res = await analyticsApi.importDatasetFromDataset(projectId, selectedDatasetId);
        if (!res.success) throw new Error(res.error ?? 'Import failed');
        count = (res.data as any)?.total_patents ?? 0;

      } else {
        if (!selectedFile) { setImportState('error'); setErrorMessage('Choose a file to upload.'); return; }
        const res = await analyticsApi.addFileToProject(projectId, selectedFile, selectedFile.name.replace(/\.[^.]+$/, ''));
        if (!res.success) throw new Error(res.error ?? 'Upload failed');
        count = (res.data as any)?.total_patents ?? 0;
      }

      setImportedCount(count);
      setImportState('success');
      onImportComplete(count);
    } catch (e: any) {
      setImportState('error');
      setErrorMessage(e?.message ?? 'Import failed. Please try again.');
    }
  };

  const canImport =
    importState !== 'loading' &&
    importState !== 'success' &&
    ((tab === 'portfolio' && !!selectedPortfolioId) ||
      (tab === 'dataset' && !!selectedDatasetId) ||
      (tab === 'file' && !!selectedFile));

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Import Patents</DialogTitle>
        </DialogHeader>

        {importState === 'success' ? (
          <div className="py-6 flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="w-6 h-6 text-green-600" />
            </div>
            <p className="font-medium text-neutral-900">{importedCount.toLocaleString()} patents imported</p>
            <p className="text-sm text-muted-foreground">Run analysis to score and bundle these patents.</p>
            <Button onClick={handleClose} className="mt-2">Done</Button>
          </div>
        ) : (
          <>
            <Tabs value={tab} onValueChange={t => { setTab(t); setImportState('idle'); setErrorMessage(''); }}>
              <TabsList className="w-full">
                <TabsTrigger value="portfolio" className="flex-1 gap-1.5">
                  <FolderOpen className="w-3.5 h-3.5" />Portfolio
                </TabsTrigger>
                <TabsTrigger value="dataset" className="flex-1 gap-1.5">
                  <Database className="w-3.5 h-3.5" />Analytics Project
                </TabsTrigger>
                <TabsTrigger value="file" className="flex-1 gap-1.5">
                  <UploadCloud className="w-3.5 h-3.5" />File Upload
                </TabsTrigger>
              </TabsList>

              {/* ── Portfolio tab ── */}
              <TabsContent value="portfolio" className="space-y-3 pt-2">
                <p className="text-sm text-muted-foreground">
                  Select an existing portfolio to import all its patents into this project.
                </p>
                <div className="space-y-1.5">
                  <Label>Portfolio</Label>
                  {portfoliosLoading ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Loading portfolios…
                    </div>
                  ) : (
                    <Select value={selectedPortfolioId} onValueChange={setSelectedPortfolioId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a portfolio…" />
                      </SelectTrigger>
                      <SelectContent>
                        {portfolios.map(p => (
                          <SelectItem key={p.id} value={p.id} textValue={p.name}>
                            {`${p.name} (${p.total_patents ?? p.patent_count ?? 0} patents)`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                {selectedPortfolioId && (
                  <div className="text-xs text-muted-foreground">
                    {(() => {
                      const p = portfolios.find(x => x.id === selectedPortfolioId);
                      return p ? `${p.total_patents ?? p.patent_count ?? 0} patents will be imported` : null;
                    })()}
                  </div>
                )}
              </TabsContent>

              {/* ── Analytics Project / Dataset tab ── */}
              <TabsContent value="dataset" className="space-y-3 pt-2">
                <p className="text-sm text-muted-foreground">
                  Copy patents from a dataset in one of your analytics projects.
                </p>
                <div className="space-y-1.5">
                  <Label>Analytics Project</Label>
                  {projectsLoading ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Loading projects…
                    </div>
                  ) : (
                    <Select value={selectedAnalyticsProjectId} onValueChange={setSelectedAnalyticsProjectId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an analytics project…" />
                      </SelectTrigger>
                      <SelectContent>
                        {analyticsProjects.map(p => (
                          <SelectItem key={p.id} value={p.id} textValue={p.name}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {selectedAnalyticsProjectId && (
                  <div className="space-y-1.5">
                    <Label>Dataset</Label>
                    {datasetsLoading ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> Loading datasets…
                      </div>
                    ) : datasets.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-2">No completed datasets in this project.</p>
                    ) : (
                      <Select value={selectedDatasetId} onValueChange={setSelectedDatasetId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a dataset…" />
                        </SelectTrigger>
                        <SelectContent>
                          {datasets.map(d => (
                            <SelectItem key={d.id} value={d.id} textValue={d.name}>
                              {`${d.name} (${d.total_patents ?? 0} patents)`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                )}
              </TabsContent>

              {/* ── File upload tab ── */}
              <TabsContent value="file" className="space-y-3 pt-2">
                <p className="text-sm text-muted-foreground">
                  Upload an Excel or CSV file with patent data (application numbers, titles, claims, etc.).
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={e => setSelectedFile(e.target.files?.[0] ?? null)}
                />
                {selectedFile ? (
                  <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/30">
                    <UploadCloud className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-sm flex-1 truncate">{selectedFile.name}</span>
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs"
                      onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}>
                      Change
                    </Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed rounded-md py-8 flex flex-col items-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                  >
                    <UploadCloud className="w-6 h-6" />
                    <span className="text-sm font-medium">Click to choose a file</span>
                    <span className="text-xs">.xlsx, .xls, .csv</span>
                  </button>
                )}
              </TabsContent>
            </Tabs>

            {/* Error message */}
            {importState === 'error' && errorMessage && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {errorMessage}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={handleClose} disabled={importState === 'loading'}>
                Cancel
              </Button>
              <Button onClick={handleImport} disabled={!canImport}>
                {importState === 'loading' ? (
                  <><Loader2 className="mr-2 w-4 h-4 animate-spin" />Importing…</>
                ) : (
                  'Import Patents'
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
