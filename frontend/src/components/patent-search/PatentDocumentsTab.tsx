'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Check, Download, FileText, ArrowUpDown, List, FolderOpen } from 'lucide-react';
import usptoOdpApi, { type ODPDocuments } from '@/services/usptoOdpApi';
import { cn } from '@/lib/utils';

// ── Download icon with spinner / checkmark states ────────────────────────────

function DownloadIcon({ state }: { state: 'idle' | 'loading' | 'done' }) {
  if (state === 'loading') {
    return (
      <svg className="h-3 w-3 animate-spin" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="2" opacity="0.2" />
        <path d="M14.5 8a6.5 6.5 0 0 0-6.5-6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  if (state === 'done') {
    return <Check className="h-3 w-3 text-green-500" />;
  }
  return <Download className="h-3 w-3" />;
}

interface PatentDocumentsTabProps {
  appId: string;
}

// ── Functional category mapping ──────────────────────────────────────────────

const CATEGORY_ORDER = [
  'Grant & Publication',
  'Office Actions',
  'Applicant Filings',
  'IDS & References',
  'Fees & Receipts',
  'Administrative',
  'Examiner Work',
  'Other',
] as const;

const CODE_TO_CATEGORY: Record<string, string> = {
  'EGRANT.PDF': 'Grant & Publication',
  'EGRANT.NTF': 'Grant & Publication',
  'ISSUE.NTF': 'Grant & Publication',
  'NOA': 'Grant & Publication',
  'NTC.PUB': 'Grant & Publication',

  'CTNF': 'Office Actions',
  'CTFR': 'Office Actions',
  'MCTNF': 'Office Actions',
  'MCTFR': 'Office Actions',
  'EX.PARTE.QU': 'Office Actions',
  'RESTR': 'Office Actions',

  'SPEC': 'Applicant Filings',
  'CLM': 'Applicant Filings',
  'ABST': 'Applicant Filings',
  'A.PE': 'Applicant Filings',
  'A...': 'Applicant Filings',
  'REM': 'Applicant Filings',
  'ADS': 'Applicant Filings',
  'OATH': 'Applicant Filings',
  'SEQ.XML': 'Applicant Filings',
  'DRW.NONBW': 'Applicant Filings',
  'DRW.SUPP': 'Applicant Filings',
  'DRW': 'Applicant Filings',
  'PEFR': 'Applicant Filings',
  'XT/': 'Applicant Filings',
  'DIST.E.FILE': 'Applicant Filings',
  'RESP': 'Applicant Filings',
  'RCE': 'Applicant Filings',
  'APPEAL.BRIEF': 'Applicant Filings',
  'REPLY.BRIEF': 'Applicant Filings',

  'IDS': 'IDS & References',
  '1449': 'IDS & References',
  '892': 'IDS & References',

  'N417': 'Fees & Receipts',
  'N417.PYMT': 'Fees & Receipts',
  'IFEE': 'Fees & Receipts',
  'WFEE': 'Fees & Receipts',

  'APP.FILE.REC': 'Administrative',
  'BIB': 'Administrative',
  'PA..': 'Administrative',
  'C.AD': 'Administrative',
  'NTC.MISS.PRT': 'Administrative',
  'DISQ.E.FILE': 'Administrative',
  'SCORE': 'Administrative',

  'SRFW': 'Examiner Work',
  'SRNT': 'Examiner Work',
  'FWCLM': 'Examiner Work',
  'WCLM': 'Examiner Work',
  'IIFW': 'Examiner Work',
  'CRFE': 'Examiner Work',
};

function getDocumentCategory(code: string): string {
  if (CODE_TO_CATEGORY[code]) return CODE_TO_CATEGORY[code];
  // Try prefix matching for codes with suffixes (e.g. DRW.SOMETHING)
  const prefix = code.split('.')[0];
  if (CODE_TO_CATEGORY[prefix]) return CODE_TO_CATEGORY[prefix];
  return 'Other';
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr?: string): string {
  if (!dateStr) return '---';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function sortByDate(docs: any[], asc: boolean): any[] {
  return [...docs].sort((a, b) => {
    const dateA = a.officialDate || a.mailingDate || '';
    const dateB = b.officialDate || b.mailingDate || '';
    return asc ? dateA.localeCompare(dateB) : dateB.localeCompare(dateA);
  });
}

// ── Document row component ───────────────────────────────────────────────────

function DocumentRow({ doc, appId }: { doc: any; appId: string }) {
  const description = doc.documentCodeDescriptionText || doc.documentDescriptionText || doc.documentCode || 'Document';
  const date = formatDate(doc.officialDate || doc.mailingDate || doc.documentDate);
  const downloadOptions = doc.downloadOptionBag || [];
  const pageCount = downloadOptions[0]?.pageTotalQuantity || doc.pageCount;
  const [btnStates, setBtnStates] = useState<Record<number, 'idle' | 'loading' | 'done'>>({});

  const handleDownload = useCallback(async (opt: any, index: number) => {
    setBtnStates((s) => ({ ...s, [index]: 'loading' }));
    try {
      const ext = (opt.mimeTypeIdentifier || 'pdf').toLowerCase();
      const filename = `${doc.documentCode || 'document'}_${appId}.${ext}`;
      await usptoOdpApi.downloadDocument(appId, opt.downloadUrl, filename);
      setBtnStates((s) => ({ ...s, [index]: 'done' }));
      setTimeout(() => setBtnStates((s) => ({ ...s, [index]: 'idle' })), 1500);
    } catch {
      setBtnStates((s) => ({ ...s, [index]: 'idle' }));
    }
  }, [appId, doc.documentCode]);

  return (
    <div className="py-2.5 flex items-start justify-between gap-4 text-sm">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <p className="font-medium truncate">{description}</p>
        </div>
        <div className="flex items-center gap-3 mt-0.5 pl-[22px]">
          <span className="text-xs text-muted-foreground">{date}</span>
          {doc.documentCode && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">{doc.documentCode}</Badge>
          )}
          {pageCount && (
            <span className="text-xs text-muted-foreground">{pageCount} pg</span>
          )}
        </div>
      </div>
      {downloadOptions.length > 0 && (
        <div className="flex gap-1 shrink-0">
          {downloadOptions.map((opt: any, j: number) => {
            const state = btnStates[j] || 'idle';
            return (
              <Button
                key={j}
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs gap-1"
                disabled={state === 'loading'}
                onClick={() => handleDownload(opt, j)}
                aria-label={`Download ${opt.mimeTypeIdentifier || 'document'}`}
              >
                <DownloadIcon state={state} />
                {opt.mimeTypeIdentifier || 'PDF'}
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export function PatentDocumentsTab({ appId }: PatentDocumentsTabProps) {
  const [data, setData] = useState<ODPDocuments | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState('');
  const [sortAsc, setSortAsc] = useState(false);
  const [viewMode, setViewMode] = useState<'grouped' | 'flat'>('grouped');

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    usptoOdpApi.getDocuments(appId).then((res) => {
      if (cancelled) return;
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setError(res.error || 'Failed to load documents');
      }
      setIsLoading(false);
    });

    return () => { cancelled = true; };
  }, [appId]);

  const { grouped, flatSorted, totalFiltered } = useMemo(() => {
    const docs = data?.documentBag || [];
    let filtered = docs;

    if (filter) {
      const lower = filter.toLowerCase();
      filtered = docs.filter((doc: any) =>
        (doc.documentCodeDescriptionText || '').toLowerCase().includes(lower) ||
        (doc.documentCode || '').toLowerCase().includes(lower) ||
        (doc.officialDate || '').includes(lower)
      );
    }

    const sorted = sortByDate(filtered, sortAsc);

    // Group by functional category
    const groups: Record<string, any[]> = {};
    sorted.forEach((doc: any) => {
      const category = getDocumentCategory(doc.documentCode || '');
      if (!groups[category]) groups[category] = [];
      groups[category].push(doc);
    });

    // Order groups by CATEGORY_ORDER
    const ordered: Record<string, any[]> = {};
    for (const cat of CATEGORY_ORDER) {
      if (groups[cat]?.length) ordered[cat] = groups[cat];
    }

    return { grouped: ordered, flatSorted: sorted, totalFiltered: filtered.length };
  }, [data, filter, sortAsc]);

  const toggleGroup = (key: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  if (isLoading) {
    return <div className="space-y-3"><Skeleton className="h-10 w-full" /><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>;
  }

  if (error) {
    return <p className="text-destructive py-4 text-center text-sm">{error}</p>;
  }

  const totalDocs = data?.documentBag?.length || 0;

  if (totalDocs === 0) {
    return <p className="text-muted-foreground py-8 text-center">No document data available.</p>;
  }

  const categories = Object.keys(grouped);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <Input
          placeholder="Filter documents..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-xs h-9"
          aria-label="Filter documents"
        />
        <Button
          variant="ghost"
          size="sm"
          className="h-9"
          onClick={() => setSortAsc(!sortAsc)}
        >
          <ArrowUpDown className="h-3.5 w-3.5 mr-1" />
          {sortAsc ? 'Oldest first' : 'Newest first'}
        </Button>
        <div className="flex gap-1 p-1 bg-muted rounded-lg">
          <button
            type="button"
            className={cn(
              'px-2 py-1 text-xs rounded-md transition-colors flex items-center gap-1',
              viewMode === 'grouped'
                ? 'bg-background shadow-sm font-medium'
                : 'text-muted-foreground hover:text-foreground',
            )}
            onClick={() => setViewMode('grouped')}
            aria-label="Grouped view"
          >
            <FolderOpen className="h-3 w-3" />
            Grouped
          </button>
          <button
            type="button"
            className={cn(
              'px-2 py-1 text-xs rounded-md transition-colors flex items-center gap-1',
              viewMode === 'flat'
                ? 'bg-background shadow-sm font-medium'
                : 'text-muted-foreground hover:text-foreground',
            )}
            onClick={() => setViewMode('flat')}
            aria-label="List view"
          >
            <List className="h-3 w-3" />
            List
          </button>
        </div>
        <p className="text-xs text-muted-foreground ml-auto">
          {totalFiltered} of {totalDocs} documents
        </p>
      </div>

      {totalFiltered === 0 && filter && (
        <p className="text-muted-foreground py-4 text-center text-sm">No documents match your filter.</p>
      )}

      {/* Flat view */}
      {viewMode === 'flat' && flatSorted.length > 0 && (
        <Card>
          <CardContent className="pt-4">
            <div className="divide-y">
              {flatSorted.map((doc: any, i: number) => (
                <DocumentRow key={i} doc={doc} appId={appId} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grouped view */}
      {viewMode === 'grouped' && categories.map((category) => {
        const docs = grouped[category];
        const isOpen = openGroups.has(category);

        return (
          <Collapsible key={category} open={isOpen} onOpenChange={() => toggleGroup(category)}>
            <Card>
              <CollapsibleTrigger className="w-full">
                <CardHeader className="py-3 cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">{category}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">{docs.length}</Badge>
                      <ChevronDown className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')} />
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <div className="divide-y">
                    {docs.map((doc: any, i: number) => (
                      <DocumentRow key={i} doc={doc} appId={appId} />
                    ))}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        );
      })}
    </div>
  );
}
