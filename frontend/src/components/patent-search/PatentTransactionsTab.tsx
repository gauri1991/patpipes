'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ArrowUpDown, List, FolderOpen } from 'lucide-react';
import usptoOdpApi, { type ODPApplication, type ODPTransactions } from '@/services/usptoOdpApi';
import { cn } from '@/lib/utils';

interface PatentTransactionsTabProps {
  appId: string;
  appData?: ODPApplication | null;
}

// ── Functional category mapping ──────────────────────────────────────────────

const CATEGORY_ORDER = [
  'Allowance & Grant',
  'Examination',
  'Applicant Response',
  'IDS & Prior Art',
  'Appeals',
  'Fees & Payments',
  'Application Processing',
  'PCT & International',
  'Correspondence',
  'Other',
] as const;

const CODE_TO_CATEGORY: Record<string, string> = {
  // Allowance & Grant
  'N/=.': 'Allowance & Grant',
  'NOA':  'Allowance & Grant',
  'IFEE': 'Allowance & Grant',
  'N084': 'Allowance & Grant',
  'ISSUE.NTF': 'Allowance & Grant',
  'PGPB': 'Allowance & Grant',
  'PG-PUB': 'Allowance & Grant',
  'PATL': 'Allowance & Grant',
  'NTC.PUB': 'Allowance & Grant',

  // Examination (Office Actions & Examiner Activity)
  'CTNF': 'Examination',
  'CTFR': 'Examination',
  'CTRS': 'Examination',
  'CTEQ': 'Examination',
  'MCTNF': 'Examination',
  'MCTFR': 'Examination',
  'EX.PARTE.QU': 'Examination',
  'RESTR': 'Examination',
  'DOCK': 'Examination',
  'SRFW': 'Examination',
  'SRNT': 'Examination',
  'FWCLM': 'Examination',
  'WCLM': 'Examination',
  'IIFW': 'Examination',
  'CRFE': 'Examination',
  'COMP': 'Examination',

  // Applicant Response (Amendments, Responses, RCE)
  'A...': 'Applicant Response',
  'A.PE': 'Applicant Response',
  'A.NA': 'Applicant Response',
  'A.NE': 'Applicant Response',
  'RESP': 'Applicant Response',
  'REM':  'Applicant Response',
  'RCE':  'Applicant Response',
  'PEFR': 'Applicant Response',

  // IDS & Prior Art
  'M844':  'IDS & Prior Art',
  'EIDS.': 'IDS & Prior Art',
  'IDSC':  'IDS & Prior Art',
  'IDS':   'IDS & Prior Art',
  '1449':  'IDS & Prior Art',
  '892':   'IDS & Prior Art',

  // Appeals
  'AP.B':  'Appeals',
  'AP.PRE': 'Appeals',
  'APEA':  'Appeals',
  'APDA':  'Appeals',
  'APDR':  'Appeals',
  'APDN':  'Appeals',
  'APPEAL.BRIEF': 'Appeals',
  'REPLY.BRIEF':  'Appeals',

  // Fees & Payments
  'N417':       'Fees & Payments',
  'N417.PYMT':  'Fees & Payments',
  'WFEE':       'Fees & Payments',
  'M1551':      'Fees & Payments',
  'M1552':      'Fees & Payments',
  'M1553':      'Fees & Payments',
  'M2551':      'Fees & Payments',
  'M2552':      'Fees & Payments',
  'M2553':      'Fees & Payments',
  'M3551':      'Fees & Payments',
  'M3552':      'Fees & Payments',
  'M3553':      'Fees & Payments',

  // Application Processing (Filing, Docketing, Entity, Admin)
  'FLRCPT.O':    'Application Processing',
  'FLRCPT.E':    'Application Processing',
  'APP.FILE.REC': 'Application Processing',
  'OIPE':        'Application Processing',
  'BIG.':        'Application Processing',
  'SMAL':        'Application Processing',
  'MICRO':       'Application Processing',
  'ADS':         'Application Processing',
  'OATH':        'Application Processing',
  'SPEC':        'Application Processing',
  'CLM':         'Application Processing',
  'ABST':        'Application Processing',
  'DRW':         'Application Processing',
  'BIB':         'Application Processing',
  'PA..':        'Application Processing',
  'SCORE':       'Application Processing',
  'DIST.E.FILE': 'Application Processing',
  'DISQ.E.FILE': 'Application Processing',

  // PCT & International
  '371COMP':  'PCT & International',
  'P210':     'PCT & International',
  'P206':     'PCT & International',
  'IPCP':     'PCT & International',

  // Correspondence
  'C.AD':          'Correspondence',
  'NTC.MISS.PRT':  'Correspondence',
  'LETTER':        'Correspondence',

  // Abandonment (goes under Examination since it's usually the result of non-response)
  'ABN2': 'Examination',
  'ABN8': 'Examination',
  'ABN9': 'Examination',
  'ABANDONMENT': 'Examination',
};

function getEventCategory(code: string): string {
  if (CODE_TO_CATEGORY[code]) return CODE_TO_CATEGORY[code];
  // Prefix matching (e.g., M1551 → M1, FLRCPT.E → FLRCPT)
  const dotPrefix = code.split('.')[0];
  if (CODE_TO_CATEGORY[dotPrefix]) return CODE_TO_CATEGORY[dotPrefix];
  // Fee codes start with M followed by digit
  if (/^M\d/.test(code)) return 'Fees & Payments';
  // Applicant response codes start with A
  if (/^A[.A-Z]/.test(code)) return 'Applicant Response';
  // Appeal codes start with AP
  if (/^AP/.test(code)) return 'Appeals';
  // Abandonment codes start with ABN
  if (/^ABN/.test(code)) return 'Examination';
  // PCT codes start with P followed by digit
  if (/^P\d/.test(code)) return 'PCT & International';
  // N-prefixed notifications
  if (/^N\d/.test(code)) return 'Fees & Payments';
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

function sortByDate(events: any[], asc: boolean): any[] {
  return [...events].sort((a, b) => {
    const dateA = a.eventDate || '';
    const dateB = b.eventDate || '';
    return asc ? dateA.localeCompare(dateB) : dateB.localeCompare(dateA);
  });
}

// ── Event row component ──────────────────────────────────────────────────────

function EventRow({ event }: { event: any }) {
  return (
    <div className="py-2.5 flex items-start gap-4 text-sm">
      <span className="text-muted-foreground whitespace-nowrap min-w-[100px] shrink-0">
        {formatDate(event.eventDate)}
      </span>
      {event.eventCode ? (
        <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0 shrink-0">
          {event.eventCode}
        </Badge>
      ) : (
        <span className="min-w-[50px] shrink-0" />
      )}
      <span className="flex-1">{event.eventDescriptionText || '---'}</span>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export function PatentTransactionsTab({ appId, appData }: PatentTransactionsTabProps) {
  const [data, setData] = useState<ODPTransactions | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState('');
  const [sortAsc, setSortAsc] = useState(false);
  const [viewMode, setViewMode] = useState<'grouped' | 'flat'>('grouped');

  useEffect(() => {
    const inlineEvents = (appData as any)?.eventDataBag;
    if (inlineEvents?.length) {
      setData({ eventDataBag: inlineEvents });
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    usptoOdpApi.getTransactions(appId).then((res) => {
      if (cancelled) return;
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setError(res.error || 'Failed to load transactions');
      }
      setIsLoading(false);
    });

    return () => { cancelled = true; };
  }, [appId, appData]);

  const eventBag = (data as any)?.eventDataBag || data?.transactionBag || [];

  const { grouped, flatSorted, totalFiltered } = useMemo(() => {
    let filtered = [...eventBag];

    if (filter) {
      const lower = filter.toLowerCase();
      filtered = eventBag.filter((t: any) =>
        (t.eventDescriptionText || '').toLowerCase().includes(lower) ||
        (t.eventCode || '').toLowerCase().includes(lower) ||
        (t.eventDate || '').includes(lower)
      );
    }

    const sorted = sortByDate(filtered, sortAsc);

    // Group by functional category
    const groups: Record<string, any[]> = {};
    sorted.forEach((event: any) => {
      const category = getEventCategory(event.eventCode || '');
      if (!groups[category]) groups[category] = [];
      groups[category].push(event);
    });

    // Order groups by CATEGORY_ORDER
    const ordered: Record<string, any[]> = {};
    for (const cat of CATEGORY_ORDER) {
      if (groups[cat]?.length) ordered[cat] = groups[cat];
    }

    return { grouped: ordered, flatSorted: sorted, totalFiltered: filtered.length };
  }, [eventBag, filter, sortAsc]);

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

  const totalEvents = eventBag.length;

  if (totalEvents === 0) {
    return <p className="text-muted-foreground py-8 text-center">No transaction data available.</p>;
  }

  const categories = Object.keys(grouped);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <Input
          placeholder="Filter events..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-xs h-9"
          aria-label="Filter events"
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
          {totalFiltered} of {totalEvents} events
        </p>
      </div>

      {totalFiltered === 0 && filter && (
        <p className="text-muted-foreground py-4 text-center text-sm">No events match your filter.</p>
      )}

      {/* Flat view */}
      {viewMode === 'flat' && flatSorted.length > 0 && (
        <Card>
          <CardContent className="pt-4">
            <div className="divide-y">
              {flatSorted.map((event: any, i: number) => (
                <EventRow key={i} event={event} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grouped view */}
      {viewMode === 'grouped' && categories.map((category) => {
        const events = grouped[category];
        const isOpen = openGroups.has(category);

        return (
          <Collapsible key={category} open={isOpen} onOpenChange={() => toggleGroup(category)}>
            <Card>
              <CollapsibleTrigger className="w-full">
                <CardHeader className="py-3 cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">{category}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">{events.length}</Badge>
                      <ChevronDown className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')} />
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <div className="divide-y">
                    {events.map((event: any, i: number) => (
                      <EventRow key={i} event={event} />
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
