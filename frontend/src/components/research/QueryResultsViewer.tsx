/**
 * QueryResultsViewer Component - Fixed Version
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { PatentImportDialog } from './PatentImportDialog';
import { ImportManagementDialog } from './ImportManagementDialog';
import { PatentCard } from './search/PatentCard';

import { useResearch } from '@/hooks/useResearch';
import { patentImportApi } from '@/services/patentImportApi';

import type { ResearchQuery, ResearchResult } from '@/types/patentSearch';

interface ImportedPatent {
  id: string;
  patent_id: string;
  title: string;
  abstract: string;
  publication_date: string | null;
  application_date: string | null;
  assignee: string;
  inventors: string[];
  ipc_classes: string[];
  cpc_classes: string[];
  jurisdiction: string;
  is_selected: boolean;
  manual_relevance: string;
  relevance_score: number | null;
  user_notes: string;
  created_at: string;
  source_filename: string;
  imported_at: string;
}

interface QueryResultsViewerProps {
  projectId: string;
  selectedQueryId?: string;
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
        page_size: 1000, // Load more patents
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
      const matchesSearch = searchTerm === '' || 
        result.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.patent_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.assignee.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRelevance = filterRelevance === 'all' || 
        result.manual_relevance === filterRelevance ||
        (filterRelevance === 'unrated' && !result.manual_relevance);

      const matchesSelected = filterSelected === 'all' ||
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
        case 'assignee':
          return a.assignee.localeCompare(b.assignee);
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

  const handleSelectResult = (resultId: string, selected: boolean) => {
    setSelectedResults(prev => 
      selected 
        ? [...prev, resultId]
        : prev.filter(id => id !== resultId)
    );
  };

  const handleSelectAll = (selected: boolean) => {
    setSelectedResults(selected ? filteredResults.map(r => r.id) : []);
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
                            Showing all {importedPatents.length} patents
                          </span>
                        </div>
                      </div>
                      
                      <div className="border rounded-lg">
                        <div className="max-h-96 overflow-auto">
                          {importedPatents.map((patent) => (
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
                                          // Update local state instead of reloading all patents
                                          setImportedPatents(prev => 
                                            prev.map(p => 
                                              p.id === patent.id 
                                                ? { ...p, is_selected: checked as boolean }
                                                : p
                                            )
                                          );
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

        {/* Management Dialog */}
        <ImportManagementDialog
          open={showManagementDialog}
          onOpenChange={setShowManagementDialog}
          projectId={projectId}
        />

        {/* Patent Details Modal */}
        <Dialog open={!!viewingPatent} onOpenChange={(open) => !open && setViewingPatent(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Patent Details</DialogTitle>
            </DialogHeader>
            {viewingPatent && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">{viewingPatent.title}</h3>
                    <div className="space-y-2 text-sm">
                      <div><strong>Patent ID:</strong> {viewingPatent.patent_id}</div>
                      <div><strong>Assignee:</strong> {viewingPatent.assignee}</div>
                      <div><strong>Publication Date:</strong> {viewingPatent.publication_date ? new Date(viewingPatent.publication_date).toLocaleDateString() : 'N/A'}</div>
                      <div><strong>Jurisdiction:</strong> {viewingPatent.jurisdiction}</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <strong>Relevance:</strong>
                      <Select
                        value={viewingPatent.manual_relevance || ''}
                        onValueChange={(value) => handleSetRelevance(viewingPatent, value)}
                      >
                        <SelectTrigger className="w-full mt-1">
                          <SelectValue placeholder="Set relevance" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="not_relevant">Not Relevant</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {viewingPatent.relevance_score && (
                      <div><strong>AI Score:</strong> {Math.round(viewingPatent.relevance_score * 100)}%</div>
                    )}
                  </div>
                </div>
                
                {viewingPatent.abstract && (
                  <div>
                    <h4 className="font-medium mb-2">Abstract</h4>
                    <p className="text-sm text-muted-foreground">{viewingPatent.abstract}</p>
                  </div>
                )}

                {viewingPatent.inventors && viewingPatent.inventors.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Inventors</h4>
                    <div className="flex flex-wrap gap-2">
                      {viewingPatent.inventors.map((inventor, idx) => (
                        <Badge key={idx} variant="outline">{inventor}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {(viewingPatent.ipc_classes?.length > 0 || viewingPatent.cpc_classes?.length > 0) && (
                  <div>
                    <h4 className="font-medium mb-2">Classifications</h4>
                    <div className="space-y-2">
                      {viewingPatent.ipc_classes?.length > 0 && (
                        <div>
                          <span className="text-sm font-medium">IPC: </span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {viewingPatent.ipc_classes.map((cls, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">{cls}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {viewingPatent.cpc_classes?.length > 0 && (
                        <div>
                          <span className="text-sm font-medium">CPC: </span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {viewingPatent.cpc_classes.map((cls, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">{cls}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Rest of the component for when a query is selected...
  return (
    <div className="space-y-4">
      {/* Existing query results display logic would go here */}
      <Card>
        <CardContent className="py-8 text-center">
          <h3 className="text-lg font-semibold mb-2">Query Results</h3>
          <p className="text-muted-foreground mb-4">
            Query results display would be implemented here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

