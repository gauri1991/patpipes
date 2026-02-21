/**
 * QueryResultsViewer Component
 * Interface for viewing and managing patent search results
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Search,
  Eye,
  Check,
  X,
  Star,
  Filter,
  Download,
  Upload,
  MoreVertical,
  Building,
  User,
  Calendar,
  MapPin,
  Hash,
  ExternalLink,
  Tags,
  FileSpreadsheet,
  Send,
  RefreshCw,
  ChevronRight
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

import { ResearchResult } from '@/services/researchApi';
import { useResearch } from '@/hooks/useResearch';
import { PatentImportDialog } from './PatentImportDialog';
import { ImportManagementDialog } from './ImportManagementDialog';
import { patentImportApi, ImportedPatent } from '@/services/patentImportApi';

interface QueryResultsViewerProps {
  projectId: string;
  selectedQueryId: string | null;
  results: ResearchResult[];
  onRefresh: (queryId?: string) => void;
  onSendToClassifier?: (patents: ResearchResult[]) => void;
}

export function QueryResultsViewer({
  projectId,
  selectedQueryId,
  results,
  onRefresh,
  onSendToClassifier
}: QueryResultsViewerProps) {
  const { queries, updateResult, bulkUpdateResults } = useResearch(projectId);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRelevance, setFilterRelevance] = useState('all');
  const [filterSelected, setFilterSelected] = useState('all');
  const [selectedResults, setSelectedResults] = useState<string[]>([]);
  const [viewingPatent, setViewingPatent] = useState<ResearchResult | null>(null);
  const [sortBy, setSortBy] = useState('relevance');
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showManagementDialog, setShowManagementDialog] = useState(false);
  const [allResults, setAllResults] = useState<ResearchResult[]>(results);
  const [importedPatents, setImportedPatents] = useState<ImportedPatent[]>([]);
  const [importBatches, setImportBatches] = useState<any[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null);
  const [loadingImported, setLoadingImported] = useState(false);
  const [importedPatentsPage, setImportedPatentsPage] = useState(1);
  const [importedPatentsPerPage] = useState(50);

  // Load imported patents and batches from backend
  const loadImportedPatents = async () => {
    setLoadingImported(true);
    try {
      // Load import batches first
      const batchesResponse = await patentImportApi.getImportBatches(projectId);
      setImportBatches(batchesResponse);
      
      // Load patents based on selected batch or all
      const patentsResponse = await patentImportApi.getImportedPatents(projectId, {
        ordering: '-created_at',
        page_size: 1000, // Load more patents (will be paginated in UI)
        ...(selectedBatch && { import_batch: selectedBatch })
      });
      setImportedPatents(patentsResponse.results);
    } catch (error) {
      console.error('Failed to load imported patents:', error);
    } finally {
      setLoadingImported(false);
    }
  };

  // Update local results when props change
  useEffect(() => {
    setAllResults(results);
  }, [results]);

  // Load imported patents on component mount
  useEffect(() => {
    if (projectId) {
      loadImportedPatents();
    }
  }, [projectId]);

  // Reload patents when selected batch changes
  useEffect(() => {
    if (projectId) {
      loadImportedPatents();
    }
  }, [selectedBatch]);

  // Filter and sort results
  const filteredResults = allResults
    .filter(result => {
      const matchesSearch = 
        result.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.abstract.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.assignee.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.patent_id.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRelevance = 
        filterRelevance === 'all' || 
        result.manual_relevance === filterRelevance;
      
      const matchesSelected = 
        filterSelected === 'all' ||
        (filterSelected === 'selected' && result.is_selected) ||
        (filterSelected === 'unselected' && !result.is_selected);
      
      return matchesSearch && matchesRelevance && matchesSelected;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'relevance':
          return (b.relevance_score || 0) - (a.relevance_score || 0);
        case 'date':
          return new Date(b.publication_date || 0).getTime() - new Date(a.publication_date || 0).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        case 'assignee':
          return a.assignee.localeCompare(b.assignee);
        default:
          return 0;
      }
    });

  const selectedQuery = Array.isArray(queries) ? queries.find(q => q.id === selectedQueryId) : undefined;

  // Handle result selection
  const handleSelectResult = (resultId: string, selected: boolean) => {
    if (selected) {
      setSelectedResults(prev => [...prev, resultId]);
    } else {
      setSelectedResults(prev => prev.filter(id => id !== resultId));
    }
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedResults(filteredResults.map(r => r.id));
    } else {
      setSelectedResults([]);
    }
  };

  // Handle bulk actions
  const handleBulkAction = async (action: 'select' | 'unselect' | 'set_relevance', relevance?: string) => {
    if (selectedResults.length === 0) return;
    
    await bulkUpdateResults(selectedResults, action, relevance);
    setSelectedResults([]);
    onRefresh(selectedQueryId || undefined);
  };

  // Handle individual result updates
  const handleToggleSelection = async (result: ResearchResult) => {
    await updateResult(result.id, { is_selected: !result.is_selected });
    onRefresh(selectedQueryId || undefined);
  };

  const handleSetRelevance = async (result: ResearchResult, relevance: string) => {
    await updateResult(result.id, { manual_relevance: relevance });
    onRefresh(selectedQueryId || undefined);
  };

  const handleImportPatents = async (importedPatents: any[]) => {
    // Reload imported patents from backend to get the latest data
    await loadImportedPatents();
    
    // Also add to local results for immediate display if needed
    const newResults = importedPatents.map((patent, index) => ({
      // Core fields
      id: `import_${Date.now()}_${index}`,
      query_id: selectedQueryId || 'imported',
      source: 'import',
      is_selected: false,
      manual_relevance: '',
      relevance_score: null,
      
      // Patent data fields (normalized)
      patent_id: patent.patent_id || '',
      title: patent.title || 'Untitled Patent',
      abstract: patent.abstract || '',
      publication_date: patent.publication_date || null,
      application_date: patent.application_date || null,
      publication_number: patent.publication_number || patent.patent_id || '',
      assignee: patent.assignee || '',
      inventors: Array.isArray(patent.inventors) ? patent.inventors : [],
      ipc_classes: Array.isArray(patent.ipc_classes) ? patent.ipc_classes : [],
      cpc_classes: Array.isArray(patent.cpc_classes) ? patent.cpc_classes : [],
      jurisdiction: patent.jurisdiction || '',
      priority_date: patent.priority_date || null,
      family_id: patent.family_id || '',
      citations: Array.isArray(patent.citations) ? patent.citations : [],
      keywords: patent.keywords || ''
    }));
    
    setAllResults(prev => [...prev, ...newResults]);
  };

  const handleSendSelectedToClassifier = () => {
    const selectedPatents = filteredResults.filter(r => selectedResults.includes(r.id));
    if (selectedPatents.length > 0 && onSendToClassifier) {
      onSendToClassifier(selectedPatents);
    }
  };

  const getRelevanceBadge = (relevance: string, score?: number | null) => {
    const variants = {
      high: 'default',
      medium: 'secondary',
      low: 'outline',
      not_relevant: 'destructive'
    } as const;

    if (relevance) {
      return (
        <Badge variant={variants[relevance as keyof typeof variants] || 'outline'}>
          {relevance.replace('_', ' ')}
        </Badge>
      );
    }

    if (score !== null && score !== undefined) {
      const level = score > 0.8 ? 'high' : score > 0.5 ? 'medium' : 'low';
      return (
        <Badge variant={variants[level]} className="gap-1">
          <Star className="h-3 w-3" />
          {Math.round(score * 100)}%
        </Badge>
      );
    }

    return <Badge variant="outline">Unrated</Badge>;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  if (!selectedQueryId) {
    return (
      <div className="space-y-4">
        {/* Import Section - Always Available */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5" />
                  Patent Results
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Import patents or select a query to view results
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowImportDialog(true)}
              >
                <Upload className="h-4 w-4 mr-2" />
                Import Patents
              </Button>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardContent className="py-8 text-center">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Query Selected</h3>
            <p className="text-muted-foreground mb-4">
              Choose a completed research query to view its results, or import patents directly.
            </p>
          </CardContent>
        </Card>

        {/* Show imported patents if any */}
        {/* Import Batches (Result Sets) */}
        {importBatches.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Imported Result Sets ({importBatches.length})</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowManagementDialog(true)}
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Manage Imports
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadImportedPatents}
                    disabled={loadingImported}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${loadingImported ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingImported ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                  <span>Loading imported patents...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Result Set List */}
                  <div className="grid gap-3">
                    {importBatches.map((batch) => (
                      <div
                        key={batch.id}
                        className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                          selectedBatch === batch.id 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => setSelectedBatch(selectedBatch === batch.id ? null : batch.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">
                                {batch.batch_name || batch.source_filename}
                              </span>
                              <Badge variant="secondary">
                                {batch.successful_imports} patents
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              Imported by {batch.imported_by_name} on {formatDate(batch.imported_at)}
                            </div>
                          </div>
                          <ChevronRight className={`h-4 w-4 transition-transform ${
                            selectedBatch === batch.id ? 'rotate-90' : ''
                          }`} />
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Selected Batch Patents */}
                  {selectedBatch && importedPatents.length > 0 && (
                    <div className="mt-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium">
                          Patents in Selected Result Set ({importedPatents.length})
                        </h4>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            Showing {Math.min(importedPatentsPerPage, importedPatents.length)} of {importedPatents.length}
                          </span>
                        </div>
                      </div>
                      
                      <div className="border rounded-lg">
                        <div className="max-h-96 overflow-auto">
                          {importedPatents.slice(0, 50).map((patent) => (
                            <div key={patent.id} className="border-b last:border-b-0 p-4 hover:bg-gray-50">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Checkbox
                                      checked={patent.is_selected}
                                      onCheckedChange={async (checked) => {
                                        try {
                                          await patentImportApi.updateImportedPatent(projectId, patent.id, {
                                            is_selected: checked as boolean
                                          });
                                          await loadImportedPatents();
                                        } catch (error) {
                                          console.error('Failed to update patent selection:', error);
                                        }
                                      }}
                                    />
                                    <div className="font-medium">{patent.title}</div>
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    <div>Patent ID: {patent.patent_id}</div>
                                    <div>Assignee: {patent.assignee || 'N/A'}</div>
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const convertedPatent: ResearchResult = {
                                      id: patent.id,
                                      query_id: 'imported',
                                      source: 'import',
                                      patent_id: patent.patent_id,
                                      title: patent.title,
                                      abstract: patent.abstract,
                                      publication_date: patent.publication_date,
                                      application_date: patent.application_date,
                                      publication_number: patent.patent_id,
                                      assignee: patent.assignee,
                                      inventors: patent.inventors,
                                      ipc_classes: patent.ipc_classes,
                                      cpc_classes: patent.cpc_classes,
                                      jurisdiction: patent.jurisdiction,
                                      is_selected: patent.is_selected,
                                      manual_relevance: patent.manual_relevance,
                                      relevance_score: patent.relevance_score,
                                      priority_date: null,
                                      family_id: '',
                                      citations: [],
                                      keywords: ''
                                    };
                                    setViewingPatent(convertedPatent);
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {importedPatents.filter(p => p.is_selected).length > 0 && (
                        <div className="mt-4 flex justify-center">
                          <Button
                            onClick={() => {
                              const selectedPatents = importedPatents
                                .filter(p => p.is_selected)
                                .map(patent => ({
                                  id: patent.id,
                                  query_id: 'imported',
                                  source: 'import',
                                  patent_id: patent.patent_id,
                                  title: patent.title,
                                  abstract: patent.abstract,
                                  publication_date: patent.publication_date,
                                  application_date: patent.application_date,
                                  publication_number: patent.patent_id,
                                  assignee: patent.assignee,
                                  inventors: patent.inventors,
                                  ipc_classes: patent.ipc_classes,
                                  cpc_classes: patent.cpc_classes,
                                  jurisdiction: patent.jurisdiction,
                                  is_selected: patent.is_selected,
                                  manual_relevance: patent.manual_relevance,
                                  relevance_score: patent.relevance_score,
                                  priority_date: null,
                                  family_id: '',
                                  citations: [],
                                  keywords: ''
                                }));
                              
                              if (selectedPatents.length > 0 && onSendToClassifier) {
                                onSendToClassifier(selectedPatents);
                              }
                            }}
                            className="bg-purple-600 hover:bg-purple-700"
                          >
                            <Tags className="h-4 w-4 mr-2" />
                            Send {importedPatents.filter(p => p.is_selected).length} Patents to Classifier
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Import Dialog */}
        <PatentImportDialog
          open={showImportDialog}
          onOpenChange={setShowImportDialog}
          onImport={handleImportPatents}
          projectId={projectId}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Query Info Header */}
      {selectedQuery && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  {selectedQuery.query_name}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedQuery.description || selectedQuery.keywords}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge>{selectedQuery.api_source.toUpperCase()}</Badge>
                <Badge variant="outline">
                  {selectedQuery.total_results.toLocaleString()} results
                </Badge>
              </div>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Filters and Actions */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative max-w-sm">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search results..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>

              <Select value={filterRelevance} onValueChange={setFilterRelevance}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Relevance</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="not_relevant">Not Relevant</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterSelected} onValueChange={setFilterSelected}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="selected">Selected</SelectItem>
                  <SelectItem value="unselected">Unselected</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Relevance</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="assignee">Assignee</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowImportDialog(true)}
              >
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
              
              {selectedResults.length > 0 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSendSelectedToClassifier}
                    className="bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200"
                  >
                    <Tags className="h-4 w-4 mr-2" />
                    Send to Classifier ({selectedResults.length})
                  </Button>
                  
                  <span className="text-sm text-muted-foreground">
                    {selectedResults.length} selected
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        Bulk Actions
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleBulkAction('select')}>
                        <Check className="h-4 w-4 mr-2" />
                        Mark as Selected
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkAction('unselect')}>
                        <X className="h-4 w-4 mr-2" />
                        Mark as Unselected
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleBulkAction('set_relevance', 'high')}>
                        <Star className="h-4 w-4 mr-2" />
                        Set High Relevance
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkAction('set_relevance', 'medium')}>
                        Set Medium Relevance
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkAction('set_relevance', 'low')}>
                        Set Low Relevance
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkAction('set_relevance', 'not_relevant')}>
                        Set Not Relevant
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Patent Results ({filteredResults.length})</span>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedResults.length === filteredResults.length && filteredResults.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm text-muted-foreground">Select All</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead className="w-[50px]">Selected</TableHead>
                <TableHead>Patent Details</TableHead>
                <TableHead>Assignee</TableHead>
                <TableHead>Classification</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Relevance</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredResults.map((result) => (
                <TableRow key={result.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedResults.includes(result.id)}
                      onCheckedChange={(checked) => handleSelectResult(result.id, checked as boolean)}
                    />
                  </TableCell>
                  
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleSelection(result)}
                    >
                      <Check className={`h-4 w-4 ${result.is_selected ? 'text-green-600' : 'text-gray-300'}`} />
                    </Button>
                  </TableCell>
                  
                  <TableCell>
                    <div className="max-w-md">
                      <div className="flex items-center gap-2 mb-1">
                        <Button
                          variant="link"
                          className="p-0 h-auto font-medium text-left"
                          onClick={() => setViewingPatent(result)}
                        >
                          {result.title}
                        </Button>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <span className="font-mono">{result.patent_id}</span>
                        {result.jurisdiction && (
                          <>
                            <Separator orientation="vertical" className="h-3" />
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {result.jurisdiction}
                            </span>
                          </>
                        )}
                      </div>
                      
                      {result.abstract && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {result.abstract.substring(0, 150)}...
                        </p>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="max-w-xs">
                      {result.assignee ? (
                        <div className="flex items-center gap-1">
                          <Building className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm truncate">{result.assignee}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">N/A</span>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="space-y-1">
                      {result.ipc_classes.slice(0, 2).map((ipc, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          <Hash className="h-3 w-3 mr-1" />
                          {ipc}
                        </Badge>
                      ))}
                      {result.ipc_classes.length > 2 && (
                        <span className="text-xs text-muted-foreground">
                          +{result.ipc_classes.length - 2} more
                        </span>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatDate(result.publication_date)}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    {getRelevanceBadge(result.manual_relevance, result.relevance_score)}
                  </TableCell>
                  
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setViewingPatent(result)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleSetRelevance(result, 'high')}>
                          High Relevance
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSetRelevance(result, 'medium')}>
                          Medium Relevance
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSetRelevance(result, 'low')}>
                          Low Relevance
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSetRelevance(result, 'not_relevant')}>
                          Not Relevant
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredResults.length === 0 && (
            <div className="text-center py-8">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Results Found</h3>
              <p className="text-muted-foreground">
                No patents match your current filter criteria.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Patent Detail Dialog */}
      {viewingPatent && (
        <Dialog open={true} onOpenChange={() => setViewingPatent(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>Patent Details</span>
                <div className="flex items-center gap-2">
                  {getRelevanceBadge(viewingPatent.manual_relevance, viewingPatent.relevance_score)}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleSelection(viewingPatent)}
                  >
                    <Check className={`h-4 w-4 mr-1 ${viewingPatent.is_selected ? 'text-green-600' : 'text-gray-300'}`} />
                    {viewingPatent.is_selected ? 'Selected' : 'Select'}
                  </Button>
                </div>
              </DialogTitle>
            </DialogHeader>
            
            <ScrollArea className="max-h-[70vh]">
              <div className="space-y-6">
                {/* Basic Info */}
                <div>
                  <h3 className="font-semibold mb-2">{viewingPatent.title}</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Patent ID:</span>
                      <span className="ml-2 font-mono">{viewingPatent.patent_id}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Publication Number:</span>
                      <span className="ml-2">{viewingPatent.publication_number || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Publication Date:</span>
                      <span className="ml-2">{formatDate(viewingPatent.publication_date)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Application Date:</span>
                      <span className="ml-2">{formatDate(viewingPatent.application_date)}</span>
                    </div>
                  </div>
                </div>

                {/* Abstract */}
                {viewingPatent.abstract && (
                  <div>
                    <h4 className="font-medium mb-2">Abstract</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {viewingPatent.abstract}
                    </p>
                  </div>
                )}

                {/* Assignee & Inventors */}
                <div className="grid grid-cols-2 gap-4">
                  {viewingPatent.assignee && (
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-1">
                        <Building className="h-4 w-4" />
                        Assignee
                      </h4>
                      <p className="text-sm">{viewingPatent.assignee}</p>
                    </div>
                  )}
                  
                  {viewingPatent.inventors.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-1">
                        <User className="h-4 w-4" />
                        Inventors
                      </h4>
                      <div className="space-y-1">
                        {viewingPatent.inventors.map((inventor, idx) => (
                          <p key={idx} className="text-sm">{inventor}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Classifications */}
                <div className="grid grid-cols-2 gap-4">
                  {viewingPatent.ipc_classes.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">IPC Classifications</h4>
                      <div className="flex flex-wrap gap-1">
                        {viewingPatent.ipc_classes.map((ipc, idx) => (
                          <Badge key={idx} variant="outline">{ipc}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {viewingPatent.cpc_classes.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">CPC Classifications</h4>
                      <div className="flex flex-wrap gap-1">
                        {viewingPatent.cpc_classes.map((cpc, idx) => (
                          <Badge key={idx} variant="outline">{cpc}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}

      {/* Import Dialog */}
      <PatentImportDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onImport={handleImportPatents}
        projectId={projectId}
      />

      {/* Import Management Dialog */}
      <ImportManagementDialog
        open={showManagementDialog}
        onOpenChange={setShowManagementDialog}
        projectId={projectId}
      />
    </div>
  );
}