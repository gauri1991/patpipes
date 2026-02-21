/**
 * ImportFromUSPTODialog
 * Search the USPTO Open Data Portal and kick off a background import into a portfolio.
 * Shows a 25-result preview; the actual import runs on the server.
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import { Search, Loader2, Download, ChevronLeft, ChevronDown, ChevronRight, Info, Settings2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { patentsService } from '../services/patents.service';
import { ODPSearchResult } from '../services/patents.service';

interface ImportFromUSPTODialogProps {
  portfolioId: string;
  companyName?: string;
  existingApplicationNumbers?: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported?: () => void;
}

type Step = 'search' | 'results';

interface AssigneeGroup {
  assignee: string;
  patents: ODPSearchResult[];
  selectableCount: number;
}

const PREVIEW_LIMIT = 25;

const IMPORT_FIELD_OPTIONS = [
  { key: 'patent_number', label: 'Patent / Publication Number', default: true },
  { key: 'filing_date', label: 'Filing Date', default: true },
  { key: 'inventors', label: 'Inventors', default: true },
  { key: 'assignees', label: 'Assignees', default: true },
  { key: 'abstract', label: 'Abstract', default: true },
  { key: 'ipc_classes', label: 'IPC Classifications', default: true },
  { key: 'status', label: 'Application Status', default: false },
  { key: 'patent_type', label: 'Application Type', default: false },
] as const;

const DEFAULT_IMPORT_FIELDS = IMPORT_FIELD_OPTIONS.filter(f => f.default).map(f => f.key);

export function ImportFromUSPTODialog({
  portfolioId,
  companyName = '',
  existingApplicationNumbers = [],
  open,
  onOpenChange,
  onImported,
}: ImportFromUSPTODialogProps) {
  // Search form
  const [assignee, setAssignee] = useState(companyName);
  const [keywords, setKeywords] = useState('');
  const [inventor, setInventor] = useState('');
  const [titleFilter, setTitleFilter] = useState('');
  const [applicationNumber, setApplicationNumber] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [appTypeFilter, setAppTypeFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Results
  const [results, setResults] = useState<ODPSearchResult[]>([]);
  const [total, setTotal] = useState(0);

  // Selection
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Collapsed groups
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  // UI state
  const [step, setStep] = useState<Step>('search');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importFields, setImportFields] = useState<Set<string>>(new Set(DEFAULT_IMPORT_FIELDS));
  const [showFieldConfig, setShowFieldConfig] = useState(false);

  const existingSet = new Set(existingApplicationNumbers);

  // Build search params for the backend
  const buildSearchParams = useCallback(() => ({
    assignee: assignee.trim() || undefined,
    keywords: keywords.trim() || undefined,
    inventor: inventor.trim() || undefined,
    title: titleFilter.trim() || undefined,
    application_number: applicationNumber.trim() || undefined,
    status: statusFilter && statusFilter !== 'all' ? statusFilter : undefined,
    app_type: appTypeFilter && appTypeFilter !== 'all' ? appTypeFilter : undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
  }), [assignee, keywords, inventor, titleFilter, applicationNumber, statusFilter, appTypeFilter, dateFrom, dateTo]);

  // Group results by assignee
  const assigneeGroups: AssigneeGroup[] = useMemo(() => {
    const groupMap = new Map<string, ODPSearchResult[]>();
    for (const r of results) {
      const key = (r.assignee || '').trim() || '(No assignee)';
      const list = groupMap.get(key);
      if (list) {
        list.push(r);
      } else {
        groupMap.set(key, [r]);
      }
    }
    return Array.from(groupMap.entries())
      .map(([assigneeName, patents]) => ({
        assignee: assigneeName,
        patents,
        selectableCount: patents.filter(p => !existingSet.has(p.application_number)).length,
      }))
      .sort((a, b) => {
        if (a.assignee === '(No assignee)') return 1;
        if (b.assignee === '(No assignee)') return -1;
        return b.patents.length - a.patents.length;
      });
  }, [results, existingApplicationNumbers]);

  const selectableResults = results.filter(r => !existingSet.has(r.application_number));

  const resetState = useCallback(() => {
    setAssignee(companyName);
    setKeywords('');
    setInventor('');
    setTitleFilter('');
    setApplicationNumber('');
    setStatusFilter('');
    setAppTypeFilter('');
    setDateFrom('');
    setDateTo('');
    setResults([]);
    setTotal(0);
    setSelected(new Set());
    setCollapsedGroups(new Set());
    setStep('search');
    setIsSearching(false);
    setError(null);
    setImportFields(new Set(DEFAULT_IMPORT_FIELDS));
    setShowFieldConfig(false);
  }, [companyName]);

  const handleOpenChange = (open: boolean) => {
    if (!open) resetState();
    onOpenChange(open);
  };

  const doSearch = async () => {
    setError(null);
    setIsSearching(true);
    try {
      const data = await patentsService.searchODP({
        ...buildSearchParams(),
        offset: 0,
        limit: PREVIEW_LIMIT,
      });
      setResults(data.results);
      setTotal(data.total);
      setSelected(new Set());
      setCollapsedGroups(new Set());
      setStep('results');
    } catch (err: any) {
      setError(err.message || 'Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const hasAppNum = applicationNumber.trim();
    if (!hasAppNum && !assignee.trim() && !keywords.trim() && !inventor.trim() && !titleFilter.trim()) {
      setError('Enter at least one search field.');
      return;
    }
    doSearch();
  };

  // Individual patent toggle
  const toggleSelect = (appNum: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(appNum)) next.delete(appNum);
      else next.add(appNum);
      return next;
    });
  };

  // Group-level toggle
  const toggleGroupSelect = (group: AssigneeGroup) => {
    const selectableInGroup = group.patents
      .filter(p => !existingSet.has(p.application_number))
      .map(p => p.application_number);
    const allSelected = selectableInGroup.every(a => selected.has(a));
    setSelected(prev => {
      const next = new Set(prev);
      if (allSelected) selectableInGroup.forEach(a => next.delete(a));
      else selectableInGroup.forEach(a => next.add(a));
      return next;
    });
  };

  const isGroupFullySelected = (group: AssigneeGroup) => {
    const selectable = group.patents.filter(p => !existingSet.has(p.application_number));
    return selectable.length > 0 && selectable.every(p => selected.has(p.application_number));
  };

  const isGroupPartiallySelected = (group: AssigneeGroup) => {
    const selectable = group.patents.filter(p => !existingSet.has(p.application_number));
    const selectedCount = selectable.filter(p => selected.has(p.application_number)).length;
    return selectedCount > 0 && selectedCount < selectable.length;
  };

  const toggleSelectAll = () => {
    if (selected.size === selectableResults.length) setSelected(new Set());
    else setSelected(new Set(selectableResults.map(r => r.application_number)));
  };

  const toggleGroupCollapse = (assigneeName: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(assigneeName)) next.delete(assigneeName);
      else next.add(assigneeName);
      return next;
    });
  };

  // Fire-and-forget import
  const handleStartImport = async (importAll: boolean) => {
    const searchParams = buildSearchParams();
    const selectedData = importAll
      ? []
      : results.filter(r => selected.has(r.application_number));

    try {
      await patentsService.startODPImport({
        portfolio_id: portfolioId,
        search_params: searchParams,
        total: importAll ? total : selectedData.length,
        selected_patents_data: selectedData,
        import_fields: Array.from(importFields),
      });
      handleOpenChange(false);
      // Trigger polling on portfolio card (if PortfolioSelector is mounted)
      if (typeof (window as any).__onODPImportStarted === 'function') {
        (window as any).__onODPImportStarted(portfolioId);
      }
      onImported?.();
    } catch (err: any) {
      setError(err.message || 'Failed to start import');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Search USPTO &amp; Import Patents</DialogTitle>
          <DialogDescription>
            Search the USPTO Open Data Portal and import patents into your portfolio.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Step 1: Search Form */}
        {step === 'search' && (
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="odp-assignee">Assignee / Company Name</Label>
                <Input
                  id="odp-assignee"
                  placeholder="e.g. Apple Inc"
                  value={assignee}
                  onChange={e => setAssignee(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="odp-keywords">Keywords</Label>
                <Input
                  id="odp-keywords"
                  placeholder="e.g. machine learning display"
                  value={keywords}
                  onChange={e => setKeywords(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="odp-inventor">Inventor</Label>
                <Input
                  id="odp-inventor"
                  placeholder="e.g. John Smith"
                  value={inventor}
                  onChange={e => setInventor(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="odp-title">Title Contains</Label>
                <Input
                  id="odp-title"
                  placeholder="e.g. neural network"
                  value={titleFilter}
                  onChange={e => setTitleFilter(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="odp-app-number">Application Number</Label>
                <Input
                  id="odp-app-number"
                  placeholder="e.g. 16123456"
                  value={applicationNumber}
                  onChange={e => setApplicationNumber(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="odp-status">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger id="odp-status">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="patented">Patented</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="abandoned">Abandoned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="odp-type">Application Type</Label>
                <Select value={appTypeFilter} onValueChange={setAppTypeFilter}>
                  <SelectTrigger id="odp-type">
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="regular">Regular (Utility)</SelectItem>
                    <SelectItem value="provisional">Provisional</SelectItem>
                    <SelectItem value="design">Design</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="odp-date-from">Filing Date From</Label>
                <Input
                  id="odp-date-from"
                  type="date"
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="odp-date-to">Filing Date To</Label>
                <Input
                  id="odp-date-to"
                  type="date"
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                />
              </div>
            </div>

            {applicationNumber.trim() && (
              <div className="rounded-md bg-muted/50 border px-3 py-2 text-xs text-muted-foreground">
                Application number takes precedence &mdash; other fields will be ignored.
              </div>
            )}

            <div className="rounded-md bg-muted/50 border px-4 py-3 text-sm space-y-2">
              <button
                type="button"
                className="flex items-center gap-1.5 font-medium text-foreground w-full text-left"
                onClick={() => setShowFieldConfig(!showFieldConfig)}
              >
                <Settings2 className="h-4 w-4" />
                Import Fields
                <span className="text-muted-foreground font-normal ml-1">
                  ({importFields.size} of {IMPORT_FIELD_OPTIONS.length} selected)
                </span>
                {showFieldConfig ? (
                  <ChevronDown className="h-4 w-4 ml-auto text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
                )}
              </button>
              {showFieldConfig ? (
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-1">
                  {IMPORT_FIELD_OPTIONS.map(field => (
                    <label key={field.key} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={importFields.has(field.key)}
                        onCheckedChange={(checked) => {
                          setImportFields(prev => {
                            const next = new Set(prev);
                            if (checked) next.add(field.key);
                            else next.delete(field.key);
                            return next;
                          });
                        }}
                      />
                      <span className="text-sm">{field.label}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-xs">
                  Always imported: <span className="text-foreground">title</span>,{' '}
                  <span className="text-foreground">application number</span>.
                  {' '}Optional: {IMPORT_FIELD_OPTIONS.filter(f => importFields.has(f.key)).map(f => f.label).join(', ') || 'none'}.
                </p>
              )}
            </div>

            <DialogFooter>
              <Button type="submit" disabled={isSearching}>
                {isSearching ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Search USPTO
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}

        {/* Step 2: Results (25-item preview) */}
        {step === 'results' && (
          <>
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={() => setStep('search')}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back to Search
              </Button>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>
                  Showing {results.length} of {total.toLocaleString()} results (preview)
                </span>
                {selected.size > 0 && (
                  <Badge variant="secondary">{selected.size} selected</Badge>
                )}
              </div>
            </div>

            {/* Select all bar */}
            <div className="flex items-center gap-2 px-3 py-2 border rounded-md bg-muted/30">
              <Checkbox
                checked={selectableResults.length > 0 && selected.size === selectableResults.length}
                onCheckedChange={toggleSelectAll}
                aria-label="Select all patents"
              />
              <span className="text-sm text-muted-foreground">
                {selected.size === selectableResults.length && selectableResults.length > 0
                  ? 'Deselect all'
                  : `Select all ${selectableResults.length} loaded patents`}
              </span>
            </div>

            <div className="flex-1 overflow-auto border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead className="w-[140px]">Application #</TableHead>
                    <TableHead className="w-[100px]">Status</TableHead>
                    <TableHead className="w-[110px]">Filing Date</TableHead>
                    <TableHead className="w-[90px]">Inventors</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assigneeGroups.map(group => {
                    const isCollapsed = collapsedGroups.has(group.assignee);
                    const groupSelected = isGroupFullySelected(group);
                    const groupPartial = isGroupPartiallySelected(group);
                    const selectedInGroup = group.patents.filter(
                      p => !existingSet.has(p.application_number) && selected.has(p.application_number)
                    ).length;

                    return (
                      <GroupRows key={group.assignee}>
                        <TableRow className="bg-muted/40 hover:bg-muted/60">
                          <TableCell className="py-2">
                            {group.selectableCount > 0 ? (
                              <Checkbox
                                checked={groupSelected ? true : groupPartial ? 'indeterminate' : false}
                                onCheckedChange={() => toggleGroupSelect(group)}
                                aria-label={`Select all patents from ${group.assignee}`}
                              />
                            ) : null}
                          </TableCell>
                          <TableCell
                            colSpan={4}
                            className="py-2 cursor-pointer select-none"
                            onClick={() => toggleGroupCollapse(group.assignee)}
                          >
                            <div className="flex items-center gap-2">
                              {isCollapsed ? (
                                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                              )}
                              <span className="font-semibold text-sm truncate" title={group.assignee}>
                                {group.assignee}
                              </span>
                              <Badge variant="outline" className="text-xs shrink-0">
                                {group.patents.length} patent{group.patents.length !== 1 ? 's' : ''}
                              </Badge>
                              {selectedInGroup > 0 && (
                                <Badge variant="secondary" className="text-xs shrink-0">
                                  {selectedInGroup} selected
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-2"></TableCell>
                        </TableRow>

                        {!isCollapsed && group.patents.map(r => {
                          const isExisting = existingSet.has(r.application_number);
                          return (
                            <TableRow
                              key={r.application_number}
                              className={isExisting ? 'opacity-50' : 'cursor-pointer'}
                              onClick={() => !isExisting && toggleSelect(r.application_number)}
                            >
                              <TableCell>
                                {isExisting ? (
                                  <Badge variant="outline" className="text-xs">Imported</Badge>
                                ) : (
                                  <Checkbox
                                    checked={selected.has(r.application_number)}
                                    onCheckedChange={() => toggleSelect(r.application_number)}
                                    aria-label={`Select ${r.title}`}
                                  />
                                )}
                              </TableCell>
                              <TableCell className="font-medium max-w-[260px] truncate" title={r.title}>
                                {r.title || 'Untitled'}
                              </TableCell>
                              <TableCell className="font-mono text-xs">{r.application_number}</TableCell>
                              <TableCell className="text-xs text-muted-foreground truncate max-w-[100px]" title={r.application_status}>
                                {r.application_status
                                  ? r.application_status.length > 15
                                    ? r.application_status.slice(0, 14) + '...'
                                    : r.application_status
                                  : '-'}
                              </TableCell>
                              <TableCell className="text-xs">{r.application_date || '-'}</TableCell>
                              <TableCell className="text-xs text-muted-foreground truncate max-w-[90px]" title={r.inventors.join(', ')}>
                                {r.inventors.length > 0 ? r.inventors[0] : '-'}
                                {r.inventors.length > 1 && ` +${r.inventors.length - 1}`}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </GroupRows>
                    );
                  })}
                  {results.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No results found. Try adjusting your search criteria.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Field config (collapsible) */}
            <div className="rounded-md bg-muted/50 border px-3 py-2 text-sm">
              <button
                type="button"
                className="flex items-center gap-1.5 font-medium text-foreground w-full text-left text-xs"
                onClick={() => setShowFieldConfig(!showFieldConfig)}
              >
                <Settings2 className="h-3.5 w-3.5" />
                Import Fields ({importFields.size}/{IMPORT_FIELD_OPTIONS.length})
                {showFieldConfig ? (
                  <ChevronDown className="h-3.5 w-3.5 ml-auto text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 ml-auto text-muted-foreground" />
                )}
              </button>
              {showFieldConfig && (
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 pt-2">
                  {IMPORT_FIELD_OPTIONS.map(field => (
                    <label key={field.key} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={importFields.has(field.key)}
                        onCheckedChange={(checked) => {
                          setImportFields(prev => {
                            const next = new Set(prev);
                            if (checked) next.add(field.key);
                            else next.delete(field.key);
                            return next;
                          });
                        }}
                      />
                      <span className="text-xs">{field.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              {total > 0 && (
                <Button
                  variant="outline"
                  onClick={() => handleStartImport(true)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Import All ({total.toLocaleString()})
                </Button>
              )}
              <Button
                onClick={() => handleStartImport(false)}
                disabled={selected.size === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Import Selected ({selected.size})
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Fragment wrapper so we can return multiple <TableRow>s from a map callback */
function GroupRows({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
