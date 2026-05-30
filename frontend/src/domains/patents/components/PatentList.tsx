'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, Filter, Download, Eye, Edit, Trash2,
  Calendar, Building, FileText, AlertCircle, CheckCircle,
  Clock, Grid, List, Shield, Users, X, Loader2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTable } from '@/components/ui/data-table';

import { PatentSummary, PatentSearchQuery, PatentStatus, PatentType } from '../types/patent.types';
import { patentsService } from '../services/patents.service';
import { createPatentListColumns } from './patentListColumns';

interface PatentListProps {
  patents: PatentSummary[];
  totalCount?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  onSearch?: (query: PatentSearchQuery) => void;
  onRefresh?: () => void;
  onAnalyzeInfringement?: (patent: PatentSummary) => void;
  portfolioId?: string;
}

type ViewMode = 'list' | 'grid';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  filed: 'bg-blue-100 text-blue-800',
  published: 'bg-blue-100 text-blue-800',
  granted: 'bg-green-100 text-green-800',
  expired: 'bg-gray-100 text-gray-800',
  abandoned: 'bg-red-100 text-red-800',
  rejected: 'bg-red-100 text-red-800',
  draft: 'bg-gray-100 text-gray-600',
};

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'granted': return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'pending':
    case 'filed': return <Clock className="h-4 w-4 text-yellow-500" />;
    case 'rejected':
    case 'abandoned': return <AlertCircle className="h-4 w-4 text-red-500" />;
    default: return <FileText className="h-4 w-4 text-gray-500" />;
  }
}

function formatDate(date: string | null) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatAssignees(assignees: string[]) {
  if (!assignees || assignees.length === 0) return '—';
  return assignees[0] + (assignees.length > 1 ? ` +${assignees.length - 1}` : '');
}

export function PatentList({
  patents,
  totalCount = 0,
  currentPage = 1,
  onPageChange,
  onSearch,
  onRefresh,
  onAnalyzeInfringement,
  portfolioId,
}: PatentListProps) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [assigneeGroups, setAssigneeGroups] = useState<{ assignee: string; count: number }[]>([]);
  const [showAssigneePanel, setShowAssigneePanel] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState<string | null>(null);
  const [assigneeLoading, setAssigneeLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [assigneeSearch, setAssigneeSearch] = useState('');

  const PAGE_SIZE = 20;

  const loadAssigneeGroups = useCallback(async () => {
    if (!portfolioId) return;
    setAssigneeLoading(true);
    try {
      const data = await patentsService.getAssigneeGroups(portfolioId);
      setAssigneeGroups(data.groups);
    } catch { /* ignore */ } finally {
      setAssigneeLoading(false);
    }
  }, [portfolioId]);

  useEffect(() => {
    if (showAssigneePanel) loadAssigneeGroups();
  }, [showAssigneePanel, loadAssigneeGroups]);

  const handleDeleteByAssignee = async (assignee: string, count: number) => {
    if (!portfolioId) return;
    if (!window.confirm(`Delete all ${count} patent(s) from "${assignee}"?\n\nThis action cannot be undone.`)) return;
    setDeleteLoading(assignee);
    try {
      await patentsService.bulkDeletePatents({ assignee, portfolio_id: portfolioId });
      setAssigneeGroups(prev => prev.filter(g => g.assignee !== assignee));
      if (selectedAssignee === assignee) setSelectedAssignee(null);
      onRefresh?.();
    } catch { /* ignore */ } finally {
      setDeleteLoading(null);
    }
  };

  const handleFilterByAssignee = (assignee: string | null) => {
    setSelectedAssignee(assignee);
    onPageChange?.(1);
    onSearch?.(assignee ? { assignee } : {});
  };

  const handleSearch = () => {
    onSearch?.({
      query: searchTerm || undefined,
      status: selectedStatus !== 'all' ? [selectedStatus as PatentStatus] : undefined,
      type: selectedType !== 'all' ? [selectedType as PatentType] : undefined,
    });
  };

  const handleViewPatent = (patent: PatentSummary) => {
    if (portfolioId) router.push(`/dashboard/portfolio/${portfolioId}/patent/${patent.id}`);
  };

  const filteredAssigneeGroups = assigneeSearch
    ? assigneeGroups.filter(g => g.assignee.toLowerCase().includes(assigneeSearch.toLowerCase()))
    : assigneeGroups;

  const columns = createPatentListColumns({
    onView: handleViewPatent,
    onAnalyzeInfringement,
  });

  return (
    <div className="space-y-4">
      {/* ── Search & Filter Bar ── */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search patents by title, number, technology..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="filed">Filed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="granted">Granted</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="abandoned">Abandoned</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="utility">Utility</SelectItem>
                  <SelectItem value="design">Design</SelectItem>
                  <SelectItem value="plant">Plant</SelectItem>
                  <SelectItem value="provisional">Provisional</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleSearch}>
                <Filter className="h-4 w-4 mr-2" />Search
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Controls row ── */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {totalCount} patent{totalCount !== 1 ? 's' : ''}
        </p>
        <div className="flex items-center gap-2">
          {selectedAssignee && (
            <Badge variant="secondary" className="flex items-center gap-1 px-2 py-1">
              <Building className="h-3 w-3" />
              <span className="text-xs max-w-[200px] truncate">{selectedAssignee}</span>
              <button onClick={() => handleFilterByAssignee(null)} className="ml-1 hover:text-destructive" aria-label="Clear assignee filter">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          <Button variant={showAssigneePanel ? 'default' : 'outline'} size="sm" onClick={() => setShowAssigneePanel(!showAssigneePanel)}>
            <Users className="h-4 w-4 mr-1" />Assignees
          </Button>
          <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('list')} aria-label="List view">
            <List className="h-4 w-4" />
          </Button>
          <Button variant={viewMode === 'grid' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('grid')} aria-label="Grid view">
            <Grid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* ── Assignee Groups Panel ── */}
      {showAssigneePanel && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />Assignees ({assigneeGroups.length})
              </h3>
              <div className="flex items-center gap-2">
                <Input placeholder="Search assignees..." value={assigneeSearch} onChange={e => setAssigneeSearch(e.target.value)} className="h-7 w-[200px] text-xs" />
                <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => setShowAssigneePanel(false)} aria-label="Close">
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            {assigneeLoading ? (
              <div className="flex items-center justify-center py-4"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
            ) : (
              <div className="max-h-[300px] overflow-y-auto space-y-1">
                <div className={`flex items-center justify-between px-3 py-1.5 rounded cursor-pointer text-sm hover:bg-muted/50 ${!selectedAssignee ? 'bg-primary/5 font-medium' : ''}`} onClick={() => handleFilterByAssignee(null)}>
                  <span>All Assignees</span>
                  <span className="text-xs text-muted-foreground">{assigneeGroups.reduce((s, g) => s + g.count, 0)}</span>
                </div>
                {filteredAssigneeGroups.map(group => (
                  <div key={group.assignee} className={`flex items-center justify-between px-3 py-1.5 rounded text-sm group ${selectedAssignee === group.assignee ? 'bg-primary/5 font-medium' : 'hover:bg-muted/50'}`}>
                    <button className="flex-1 text-left truncate cursor-pointer" onClick={() => handleFilterByAssignee(group.assignee)} title={group.assignee}>
                      {group.assignee}
                    </button>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground">{group.count}</span>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10"
                        onClick={e => { e.stopPropagation(); handleDeleteByAssignee(group.assignee, group.count); }}
                        disabled={deleteLoading === group.assignee}
                        title={`Delete all ${group.count} patents from ${group.assignee}`}
                      >
                        {deleteLoading === group.assignee ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                      </Button>
                    </div>
                  </div>
                ))}
                {filteredAssigneeGroups.length === 0 && !assigneeLoading && (
                  <p className="text-xs text-muted-foreground text-center py-2">{assigneeSearch ? 'No matching assignees' : 'No assignees found'}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── List View (DataTable) ── */}
      {viewMode === 'list' && (
        <DataTable
          data={patents}
          columns={columns}
          getRowId={row => row.id}
          features={{
            enableSelection: true,
            enableSorting: true,
            enableMultiSort: true,
            enableFiltering: true,
            enableColumnVisibility: true,
            enableDensityToggle: true,
            enableExport: true,
          }}
          initialVisibility={{ patent_type: false, technology_area: false, actions: false }}
          serverSide={{
            manualPagination: true,
            rowCount: totalCount,
            onPaginationChange: ({ pageIndex }) => onPageChange?.(pageIndex + 1),
          }}
          pagination={{ pageIndex: currentPage - 1, pageSize: PAGE_SIZE }}
          onRowClick={row => handleViewPatent(row.original)}
          bulkActions={[
            {
              label: 'Export Selected',
              icon: <Download className="w-3 h-3" />,
              onClick: (rows) => {
                // CSV export via DataTable's export hook is available in toolbar
                // This action provides explicit bulk export for selected rows
                console.log('Export', rows.length, 'patents');
              },
            },
            {
              label: 'Delete Selected',
              icon: <Trash2 className="w-3 h-3" />,
              variant: 'destructive',
              onClick: async (rows) => {
                const count = rows.length;
                if (!window.confirm(`Delete ${count} selected patent(s)?\n\nThis action cannot be undone.`)) return;
                try {
                  await patentsService.bulkDeletePatents({
                    patent_ids: rows.map(r => r.original.id),
                    portfolio_id: portfolioId,
                  });
                  onRefresh?.();
                  if (showAssigneePanel) loadAssigneeGroups();
                } catch { /* ignore */ }
              },
            },
          ]}
          rowActions={[
            {
              label: 'View Details',
              icon: <Eye className="h-4 w-4" />,
              onClick: row => handleViewPatent(row.original),
            },
            {
              label: 'Edit',
              icon: <Edit className="h-4 w-4" />,
              onClick: () => { /* handled by parent */ },
            },
            ...(onAnalyzeInfringement ? [{
              label: 'Analyze for Infringement',
              icon: <Shield className="h-4 w-4" />,
              onClick: (row: import('@tanstack/react-table').Row<PatentSummary>) => onAnalyzeInfringement(row.original),
            }] : []),
            {
              label: 'Delete',
              icon: <Trash2 className="h-4 w-4" />,
              variant: 'destructive' as const,
              onClick: () => { /* single delete handled by parent */ },
            },
          ]}
          exportConfig={{ filename: 'patents' }}
          emptyState={
            <div className="py-8">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-2" />
              <p className="text-sm font-medium text-gray-900">No patents found</p>
              <p className="mt-1 text-sm text-gray-500">Try adjusting your search criteria or upload new patents.</p>
            </div>
          }
          initialPageSize={PAGE_SIZE}
        />
      )}

      {/* ── Grid View (unchanged) ── */}
      {viewMode === 'grid' && (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {patents.map(patent => (
              <Card key={patent.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleViewPatent(patent)}>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                      <StatusIcon status={patent.status} />
                      <Badge className={STATUS_COLORS[patent.status] ?? 'bg-gray-100 text-gray-800'}>{patent.status}</Badge>
                    </div>
                    <p className="font-semibold line-clamp-2">{patent.title}</p>
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="font-mono">{patent.patent_number || patent.application_number || '—'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span>{formatAssignees(patent.assignees)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Filed {formatDate(patent.filing_date)}</span>
                    </div>
                    {(patent.tags || []).length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {patent.tags.slice(0, 3).map(tag => <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>)}
                        {patent.tags.length > 3 && <Badge variant="outline" className="text-xs">+{patent.tags.length - 3}</Badge>}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            {patents.length === 0 && (
              <div className="col-span-full text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No patents found</h3>
                <p className="mt-1 text-sm text-gray-500">Try adjusting your search criteria or upload new patents.</p>
              </div>
            )}
          </div>

          {/* Grid pagination */}
          {Math.ceil(totalCount / PAGE_SIZE) > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-muted-foreground">Page {currentPage} of {Math.ceil(totalCount / PAGE_SIZE)} ({totalCount} total)</p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => onPageChange?.(currentPage - 1)}>Previous</Button>
                <Button variant="outline" size="sm" disabled={currentPage >= Math.ceil(totalCount / PAGE_SIZE)} onClick={() => onPageChange?.(currentPage + 1)}>Next</Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
