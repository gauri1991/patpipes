/**
 * PatentList Component
 * Advanced patent list with search, filtering, and management
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  Calendar,
  Building,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  SortAsc,
  SortDesc,
  Grid,
  List,
  Shield,
  ChevronLeft,
  ChevronRight,
  Users,
  X,
  Loader2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';

import { PatentSummary, PatentSearchQuery, PatentStatus, PatentType } from '../types/patent.types';
import { patentsService } from '../services/patents.service';

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
type SortField = 'title' | 'filing_date' | 'status' | 'assignees';
type SortDirection = 'asc' | 'desc';

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
  const [selectedPatents, setSelectedPatents] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>('filing_date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [assigneeGroups, setAssigneeGroups] = useState<{ assignee: string; count: number }[]>([]);
  const [showAssigneePanel, setShowAssigneePanel] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState<string | null>(null);
  const [assigneeLoading, setAssigneeLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [assigneeSearch, setAssigneeSearch] = useState('');

  const loadAssigneeGroups = useCallback(async () => {
    if (!portfolioId) return;
    setAssigneeLoading(true);
    try {
      const data = await patentsService.getAssigneeGroups(portfolioId);
      setAssigneeGroups(data.groups);
    } catch {
      // ignore
    } finally {
      setAssigneeLoading(false);
    }
  }, [portfolioId]);

  useEffect(() => {
    if (showAssigneePanel) {
      loadAssigneeGroups();
    }
  }, [showAssigneePanel, loadAssigneeGroups]);

  const handleDeleteByAssignee = async (assignee: string, count: number) => {
    if (!portfolioId) return;
    const confirmed = window.confirm(
      `Delete all ${count} patent(s) from "${assignee}"?\n\nThis action cannot be undone.`
    );
    if (!confirmed) return;

    setDeleteLoading(assignee);
    try {
      await patentsService.bulkDeletePatents({ assignee, portfolio_id: portfolioId });
      setAssigneeGroups(prev => prev.filter(g => g.assignee !== assignee));
      if (selectedAssignee === assignee) {
        setSelectedAssignee(null);
      }
      onRefresh?.();
    } catch {
      // ignore
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleBulkDeleteSelected = async () => {
    if (selectedPatents.size === 0) return;
    const confirmed = window.confirm(
      `Delete ${selectedPatents.size} selected patent(s)?\n\nThis action cannot be undone.`
    );
    if (!confirmed) return;
    try {
      await patentsService.bulkDeletePatents({
        patent_ids: Array.from(selectedPatents),
        portfolio_id: portfolioId,
      });
      setSelectedPatents(new Set());
      onRefresh?.();
      if (showAssigneePanel) loadAssigneeGroups();
    } catch {
      // ignore
    }
  };

  const handleFilterByAssignee = (assignee: string | null) => {
    setSelectedAssignee(assignee);
    if (assignee) {
      onPageChange?.(1);
      onSearch?.({ assignee });
    } else {
      onPageChange?.(1);
      onSearch?.({});
    }
  };

  const filteredAssigneeGroups = assigneeSearch
    ? assigneeGroups.filter(g => g.assignee.toLowerCase().includes(assigneeSearch.toLowerCase()))
    : assigneeGroups;

  const pageSize = 20;
  const totalPages = Math.ceil(totalCount / pageSize);

  const handleSearch = () => {
    const query: PatentSearchQuery = {
      query: searchTerm || undefined,
      status: selectedStatus !== 'all' ? [selectedStatus as PatentStatus] : undefined,
      type: selectedType !== 'all' ? [selectedType as PatentType] : undefined,
    };
    onSearch?.(query);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSelectPatent = (patentId: string) => {
    const newSelected = new Set(selectedPatents);
    if (newSelected.has(patentId)) {
      newSelected.delete(patentId);
    } else {
      newSelected.add(patentId);
    }
    setSelectedPatents(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedPatents.size === patents.length) {
      setSelectedPatents(new Set());
    } else {
      setSelectedPatents(new Set(patents.map(p => p.id)));
    }
  };

  const handleViewPatent = (patent: PatentSummary) => {
    if (portfolioId) {
      router.push(`/dashboard/portfolio/${portfolioId}/patent/${patent.id}`);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'granted':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
      case 'filed':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'rejected':
      case 'abandoned':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      filed: 'bg-blue-100 text-blue-800',
      published: 'bg-blue-100 text-blue-800',
      granted: 'bg-green-100 text-green-800',
      expired: 'bg-gray-100 text-gray-800',
      abandoned: 'bg-red-100 text-red-800',
      rejected: 'bg-red-100 text-red-800',
      draft: 'bg-gray-100 text-gray-600',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (date: string | null) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatAssignees = (assignees: string[]) => {
    if (!assignees || assignees.length === 0) return '—';
    return assignees[0] + (assignees.length > 1 ? ` +${assignees.length - 1}` : '');
  };

  const sortedPatents = [...patents].sort((a, b) => {
    let aValue: string | number | null;
    let bValue: string | number | null;

    switch (sortField) {
      case 'title':
        aValue = a.title.toLowerCase();
        bValue = b.title.toLowerCase();
        break;
      case 'filing_date':
        aValue = a.filing_date || '';
        bValue = b.filing_date || '';
        break;
      case 'status':
        aValue = a.status;
        bValue = b.status;
        break;
      case 'assignees':
        aValue = (a.assignees?.[0] || '').toLowerCase();
        bValue = (b.assignees?.[0] || '').toLowerCase();
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ?
      <SortAsc className="h-4 w-4" /> :
      <SortDesc className="h-4 w-4" />;
  };

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search patents by title, number, technology..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
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
                <Filter className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* List Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <p className="text-sm text-muted-foreground">
            {totalCount} patent{totalCount !== 1 ? 's' : ''}
            {selectedPatents.size > 0 && (
              <span>, {selectedPatents.size} selected</span>
            )}
          </p>

          {selectedPatents.size > 0 && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Selected
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={handleBulkDeleteSelected}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {selectedAssignee && (
            <Badge variant="secondary" className="flex items-center gap-1 px-2 py-1">
              <Building className="h-3 w-3" />
              <span className="text-xs max-w-[200px] truncate">{selectedAssignee}</span>
              <button
                onClick={() => handleFilterByAssignee(null)}
                className="ml-1 hover:text-destructive"
                aria-label="Clear assignee filter"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          <Button
            variant={showAssigneePanel ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowAssigneePanel(!showAssigneePanel)}
            aria-label="Group by assignee"
          >
            <Users className="h-4 w-4 mr-1" />
            Assignees
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
            aria-label="List view"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
            aria-label="Grid view"
          >
            <Grid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Assignee Groups Panel */}
      {showAssigneePanel && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Assignees ({assigneeGroups.length})
              </h3>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Search assignees..."
                  value={assigneeSearch}
                  onChange={(e) => setAssigneeSearch(e.target.value)}
                  className="h-7 w-[200px] text-xs"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => setShowAssigneePanel(false)}
                  aria-label="Close assignee panel"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            {assigneeLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="max-h-[300px] overflow-y-auto space-y-1">
                {/* Show All option */}
                <div
                  className={`flex items-center justify-between px-3 py-1.5 rounded cursor-pointer text-sm hover:bg-muted/50 ${
                    !selectedAssignee ? 'bg-primary/5 font-medium' : ''
                  }`}
                  onClick={() => handleFilterByAssignee(null)}
                >
                  <span>All Assignees</span>
                  <span className="text-xs text-muted-foreground">
                    {assigneeGroups.reduce((sum, g) => sum + g.count, 0)}
                  </span>
                </div>
                {filteredAssigneeGroups.map((group) => (
                  <div
                    key={group.assignee}
                    className={`flex items-center justify-between px-3 py-1.5 rounded text-sm group ${
                      selectedAssignee === group.assignee
                        ? 'bg-primary/5 font-medium'
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    <button
                      className="flex-1 text-left truncate cursor-pointer"
                      onClick={() => handleFilterByAssignee(group.assignee)}
                      title={group.assignee}
                    >
                      {group.assignee}
                    </button>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground">{group.count}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteByAssignee(group.assignee, group.count);
                        }}
                        disabled={deleteLoading === group.assignee}
                        title={`Delete all ${group.count} patents from ${group.assignee}`}
                      >
                        {deleteLoading === group.assignee ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
                {filteredAssigneeGroups.length === 0 && !assigneeLoading && (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    {assigneeSearch ? 'No matching assignees' : 'No assignees found'}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Patent List/Grid */}
      {viewMode === 'list' ? (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedPatents.size === patents.length && patents.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('title')}>
                  <div className="flex items-center gap-2">
                    Title
                    {getSortIcon('title')}
                  </div>
                </TableHead>
                <TableHead>Patent Number</TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('status')}>
                  <div className="flex items-center gap-2">
                    Status
                    {getSortIcon('status')}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('assignees')}>
                  <div className="flex items-center gap-2">
                    Assignee
                    {getSortIcon('assignees')}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('filing_date')}>
                  <div className="flex items-center gap-2">
                    Filing Date
                    {getSortIcon('filing_date')}
                  </div>
                </TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedPatents.map((patent) => (
                <TableRow key={patent.id} className="cursor-pointer" onClick={() => handleViewPatent(patent)}>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedPatents.has(patent.id)}
                      onCheckedChange={() => handleSelectPatent(patent.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium line-clamp-1">{patent.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {(patent.tags || []).slice(0, 2).map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {(patent.tags || []).length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{patent.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(patent.status)}
                      <span className="font-mono text-sm">{patent.patent_number || patent.application_number || '—'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(patent.status)}>
                      {patent.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{formatAssignees(patent.assignees)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{formatDate(patent.filing_date)}</span>
                    </div>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewPatent(patent)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        {onAnalyzeInfringement && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onAnalyzeInfringement(patent)}>
                              <Shield className="h-4 w-4 mr-2" />
                              Analyze for Infringement
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {patents.length === 0 && (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No patents found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search criteria or upload new patents.
              </p>
            </div>
          )}
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sortedPatents.map((patent) => (
            <Card
              key={patent.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleViewPatent(patent)}
            >
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusIcon(patent.status)}
                    <Badge className={getStatusColor(patent.status)}>
                      {patent.status}
                    </Badge>
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
                      {patent.tags.slice(0, 3).map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {patent.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{patent.tags.length - 3}
                        </Badge>
                      )}
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
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search criteria or upload new patents.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages} ({totalCount} total)
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => onPageChange?.(currentPage - 1)}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => onPageChange?.(currentPage + 1)}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
