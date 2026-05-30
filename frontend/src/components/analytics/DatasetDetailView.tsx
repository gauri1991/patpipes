'use client';

import { useState, useEffect } from 'react';
import {
  X,
  Database,
  FileText,
  Play,
  RefreshCw,
  Calendar,
  Users,
  Building,
  Hash,
  Globe,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowLeft,
  ArrowRight,
  Search,
  Filter,
  Download,
  Eye
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { DataTable, createColumns } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

import { PatentDataset, PatentRecord, analyticsApi } from '@/services/analyticsApi';

interface DatasetDetailViewProps {
  dataset: PatentDataset;
  isOpen: boolean;
  onClose: () => void;
  onProcessingStart?: () => void;
}

export function DatasetDetailView({ dataset, isOpen, onClose, onProcessingStart }: DatasetDetailViewProps) {
  const [records, setRecords] = useState<PatentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedRecord, setSelectedRecord] = useState<PatentRecord | null>(null);
  const [showRecordDetail, setShowRecordDetail] = useState(false);

  const pageSize = 25;
  const isProcessed = dataset.processing_status === 'completed';

  const fetchRecords = async (page: number = 1) => {
    if (!isProcessed) return;

    try {
      setLoading(true);
      const response = await analyticsApi.getDatasetRecords(dataset.id, page, pageSize);
      
      if (response.success && response.data) {
        console.log('Dataset records response:', response.data);
        console.log('First record:', response.data.records[0]);
        setRecords(response.data.records);
        setTotalCount(response.data.total_count);
        setTotalPages(response.data.total_pages);
        setCurrentPage(response.data.page);
      } else {
        toast.error('Failed to load records');
      }
    } catch (error) {
      toast.error('Error loading records');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessDataset = async () => {
    try {
      setProcessing(true);
      const response = await analyticsApi.processDataset(dataset.id);
      
      if (response.success) {
        toast.success('Dataset processing started');
        if (onProcessingStart) {
          onProcessingStart();
        }
        // Close the dialog since dataset will be updated
        onClose();
      } else {
        toast.error('Failed to start processing');
      }
    } catch (error) {
      toast.error('Error starting processing');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'processing':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatDataSource = (source: string) => {
    switch (source) {
      case 'manual_upload': return 'Manual Upload';
      case 'api_import': return 'API Import';
      case 'database_query': return 'Database Query';
      case 'web_scraping': return 'Web Scraping';
      default: return source;
    }
  };

  const { column } = createColumns<PatentRecord>();
  const columns = [
    column({
      id: 'patent_identifier',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Patent ID" />,
      // Search across both patent_id and publication_number
      accessorFn: row => [row.patent_id, row.publication_number].filter(Boolean).join(' '),
      cell: ({ row }) => {
        const r = row.original;
        const primary = r.patent_id || r.publication_number || '—';
        const secondary = r.patent_id && r.publication_number ? r.publication_number : null;
        return (
          <button
            className="text-left hover:bg-muted/50 rounded p-1 -m-1 transition-colors w-full"
            onClick={e => { e.stopPropagation(); setSelectedRecord(r); setShowRecordDetail(true); }}
          >
            <div className="font-medium text-blue-600 hover:text-blue-800">{primary}</div>
            {secondary && <div className="text-xs text-muted-foreground">{secondary}</div>}
          </button>
        );
      },
      enableHiding: false,
    }),
    column({
      accessorKey: 'title',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Title" />,
      cell: ({ getValue }) => (
        <div className="max-w-[250px] truncate" title={getValue() as string}>{(getValue() as string) || 'N/A'}</div>
      ),
    }),
    column({
      id: 'assignee',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Assignee" />,
      accessorFn: row => row.parent_assignee || row.assignee || '',
      cell: ({ getValue }) => {
        const v = getValue() as string;
        return v ? <div className="max-w-[180px] truncate" title={v}>{v}</div> : <span className="text-muted-foreground">N/A</span>;
      },
    }),
    column({
      accessorKey: 'inventor',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Inventor" />,
      cell: ({ getValue }) => {
        const v = getValue() as string;
        return v ? <div className="max-w-[150px] truncate" title={v}>{v}</div> : <span className="text-muted-foreground">N/A</span>;
      },
    }),
    column({
      accessorKey: 'filing_date',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Application Date" />,
      cell: ({ getValue }) => {
        const v = getValue() as string;
        return <span>{v ? new Date(v).toLocaleDateString() : 'N/A'}</span>;
      },
      meta: { filterType: 'date-range' as const },
    }),
    column({
      accessorKey: 'publication_date',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Publication Date" />,
      cell: ({ getValue }) => {
        const v = getValue() as string;
        return <span>{v ? new Date(v).toLocaleDateString() : 'N/A'}</span>;
      },
      meta: { filterType: 'date-range' as const },
    }),
    column({
      accessorKey: 'priority_date',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Priority Date" />,
      cell: ({ getValue }) => {
        const v = getValue() as string;
        return <span>{v ? new Date(v).toLocaleDateString() : 'N/A'}</span>;
      },
      meta: { filterType: 'date-range' as const },
    }),
    column({
      accessorKey: 'country_code',
      header: 'Country',
      cell: ({ getValue }) => <Badge variant="outline">{(getValue() as string) || 'N/A'}</Badge>,
      meta: { filterType: 'text' as const },
    }),
    column({
      accessorKey: 'patent_type',
      header: 'Type',
      cell: ({ getValue }) => {
        const v = getValue() as string;
        return v ? <div className="max-w-[100px] truncate" title={v}>{v}</div> : <span className="text-muted-foreground">N/A</span>;
      },
    }),
    column({
      accessorKey: 'ipc_classification',
      header: 'IPC',
      cell: ({ getValue }) => {
        const v = getValue() as string;
        return v ? <div className="max-w-[150px] truncate font-mono text-xs" title={v}>{v}</div> : <span className="text-muted-foreground">N/A</span>;
      },
    }),
    column({
      accessorKey: 'cpc_classification',
      header: 'CPC',
      cell: ({ getValue }) => {
        const v = getValue() as string;
        return v ? <div className="max-w-[150px] truncate font-mono text-xs" title={v}>{v}</div> : <span className="text-muted-foreground">N/A</span>;
      },
    }),
    column({
      accessorKey: 'claims_count',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Claims" />,
      cell: ({ getValue }) => {
        const v = getValue();
        const n = v != null && v !== '' ? Number(v) : null;
        return <span className="text-center block">{n != null ? n.toLocaleString() : 'N/A'}</span>;
      },
      meta: { filterType: 'number-range' as const },
    }),
    column({
      accessorKey: 'claims',
      header: 'Claims Preview',
      cell: ({ getValue }) => {
        const v = getValue() as string;
        return v
          ? <div className="max-w-[200px] truncate text-xs" title={v}>{v.length > 100 ? `${v.substring(0, 100)}…` : v}</div>
          : <span className="text-muted-foreground text-xs">No claims</span>;
      },
      enableSorting: false,
    }),
  ];

  useEffect(() => {
    if (isOpen && isProcessed) {
      fetchRecords(1);
    } else if (isOpen && !isProcessed) {
      setRecords([]);
      setCurrentPage(1);
      setTotalCount(0);
    }
  }, [isOpen, isProcessed]);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5" />
              <div>
                <DialogTitle>{dataset.name}</DialogTitle>
                <DialogDescription>{dataset.description}</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* Dataset Status Card */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  {getStatusIcon(dataset.processing_status)}
                  Dataset Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Status</div>
                    <div className="font-medium capitalize">{dataset.processing_status}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Source</div>
                    <div className="font-medium">{formatDataSource(dataset.data_source)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Total Patents</div>
                    <div className="font-medium">{dataset.total_patents?.toLocaleString() || '0'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Processed</div>
                    <div className="font-medium">{dataset.processed_patents?.toLocaleString() || '0'}</div>
                  </div>
                </div>

                {dataset.processing_status === 'processing' && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Processing Progress</span>
                      <span>{dataset.processing_progress || 0}%</span>
                    </div>
                    <Progress value={dataset.processing_progress || 0} />
                  </div>
                )}

                <div className="text-sm text-muted-foreground">
                  Created {new Date(dataset.created_at).toLocaleDateString()} by {dataset.created_by?.firstName} {dataset.created_by?.lastName}
                </div>
              </CardContent>
            </Card>

            {/* Main Content */}
            {!isProcessed ? (
              // Not Processed - Show Processing Prompt
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="max-w-md mx-auto space-y-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                      <Play className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-medium">Dataset Not Processed Yet</h3>
                    <p className="text-muted-foreground">
                      This dataset hasn't been processed yet. Click the button below to start extracting and parsing the patent records from your uploaded file.
                    </p>
                    <div className="space-y-2">
                      <Button 
                        onClick={handleProcessDataset}
                        disabled={processing}
                        className="w-full"
                      >
                        {processing ? (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            Starting Processing...
                          </>
                        ) : (
                          <>
                            <Play className="mr-2 h-4 w-4" />
                            Process Dataset
                          </>
                        )}
                      </Button>
                      {dataset.data_file && (
                        <p className="text-xs text-muted-foreground">
                          File: {dataset.data_file.split('/').pop()}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              // Processed - Show Records Table
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Patent Records ({totalCount.toLocaleString()})
                  </CardTitle>
                  <CardDescription>Parsed and extracted patent data from uploaded file</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <DataTable
                    data={records}
                    columns={columns}
                    getRowId={row => row.id}
                    isLoading={loading}
                    features={{
                      enableSorting: true,
                      enableFiltering: true,
                      enableColumnVisibility: true,
                      enableDensityToggle: true,
                      enableExport: true,
                    }}
                    initialVisibility={{
                      priority_date: false,
                      patent_type: false,
                      ipc_classification: false,
                      cpc_classification: false,
                      claims: false,
                    }}
                    serverSide={{
                      manualPagination: true,
                      rowCount: totalCount,
                      onPaginationChange: ({ pageIndex }) => fetchRecords(pageIndex + 1),
                    }}
                    pagination={{ pageIndex: currentPage - 1, pageSize }}
                    onRowClick={row => { setSelectedRecord(row.original); setShowRecordDetail(true); }}
                    exportConfig={{ filename: `dataset-${dataset.name}` }}
                    initialPageSize={pageSize}
                    emptyState="No records found."
                    className="rounded-none border-0 border-t"
                  />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Record Detail Modal — nested inside outer dialog so Radix handles focus trapping correctly */}
          <Dialog open={showRecordDetail} onOpenChange={setShowRecordDetail}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              {selectedRecord && (
                <>
                  <DialogHeader>
                    <DialogTitle>Patent Record Details</DialogTitle>
                    <DialogDescription>
                      {dataset.name}
                    </DialogDescription>
                  </DialogHeader>
                  <RecordDetailView record={selectedRecord} />
                </>
              )}
            </DialogContent>
          </Dialog>
        </DialogContent>
      </Dialog>
    </>
  );
}

function RecordDetailView({ record }: { record: PatentRecord }) {
  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Patent ID</div>
              <div className="font-medium">{record.patent_id || 'N/A'}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Patent Type</div>
              <div className="font-medium">{record.patent_type || 'N/A'}</div>
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Title</div>
            <div className="font-medium">{record.title || 'N/A'}</div>
          </div>
          {record.abstract && (
            <div>
              <div className="text-sm text-muted-foreground">Abstract</div>
              <div className="text-sm">{record.abstract}</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* People & Organization */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5" />
            People & Organization
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="text-sm text-muted-foreground">Assignee</div>
            <div className="font-medium">{record.assignee || 'N/A'}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Inventor(s)</div>
            <div className="font-medium">{record.inventor || 'N/A'}</div>
          </div>
        </CardContent>
      </Card>

      {/* Dates & Geographic */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Important Dates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-sm text-muted-foreground">Filing Date</div>
              <div className="font-medium">
                {record.filing_date ? new Date(record.filing_date).toLocaleDateString() : 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Publication Date</div>
              <div className="font-medium">
                {record.publication_date ? new Date(record.publication_date).toLocaleDateString() : 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Grant Date</div>
              <div className="font-medium">
                {record.grant_date ? new Date(record.grant_date).toLocaleDateString() : 'N/A'}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Geographic & Legal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-sm text-muted-foreground">Country</div>
              <div><Badge variant="outline">{record.country_code || 'N/A'}</Badge></div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Jurisdiction</div>
              <div className="font-medium">{record.jurisdiction || 'N/A'}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Legal Status</div>
              <div className="font-medium">{record.legal_status || 'N/A'}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Classifications & Technical */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Classifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-sm text-muted-foreground">IPC Classification</div>
              <div className="font-mono text-sm">{record.ipc_classification || 'N/A'}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">CPC Classification</div>
              <div className="font-mono text-sm">{record.cpc_classification || 'N/A'}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">USPC Classification</div>
              <div className="font-mono text-sm">{record.uspc_classification || 'N/A'}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Hash className="w-5 h-5" />
              Technical Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-sm text-muted-foreground">Claims Count</div>
              <div className="font-medium">{record.claims_count?.toLocaleString() || 'N/A'}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Forward Citations</div>
              <div className="font-medium">{record.forward_citations?.toLocaleString() || 'N/A'}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Backward Citations</div>
              <div className="font-medium">{record.backward_citations?.toLocaleString() || 'N/A'}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Claims */}
      {record.claims && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Patent Claims
            </CardTitle>
            <CardDescription>
              Full text of patent claims ({record.claims.length.toLocaleString()} characters)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ClaimsParser 
              claimsText={record.claims} 
              claimsStructure={record.claims_structure}
              independentCount={record.independent_claims_count}
              dependentCount={record.dependent_claims_count}
            />
          </CardContent>
        </Card>
      )}

      {/* Raw Data */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Original File Data</CardTitle>
          <CardDescription>
            Raw data as extracted from the uploaded file
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-md max-h-64 overflow-y-auto">
            <pre className="text-sm overflow-x-auto whitespace-pre-wrap">
              {JSON.stringify(record.raw_data, null, 2)}
            </pre>
          </div>
        </CardContent>
      </Card>

      {record.parsing_notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Parsing Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{record.parsing_notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface ClaimsParserProps {
  claimsText: string;
  claimsStructure?: Array<{
    number: string;
    text: string;
    type: 'independent' | 'dependent';
    references: string[];
  }>;
  independentCount?: number;
  dependentCount?: number;
}

function ClaimsParser({ claimsText, claimsStructure, independentCount, dependentCount }: ClaimsParserProps) {
  const [showFullText, setShowFullText] = useState(false);
  
  const parseIndividualClaims = (text: string) => {
    // Remove common prefixes
    let cleanText = text
      .replace(/^We claim:\s*\n?\s*/i, '')
      .replace(/^The invention claimed is:\s*\n?\s*/i, '')
      .replace(/^What is claimed is:\s*\n?\s*/i, '');
    
    // Split by claim numbers (handles various formats)
    const claimPatterns = [
      /\|\s*(\d+)\.\s*/g,  // | 1. format
      /\n\s*(\d+)\.\s*/g,  // newline + number format
      /^\s*(\d+)\.\s*/g    // start of line + number format
    ];
    
    let claims: Array<{ number: string; text: string; type: 'independent' | 'dependent'; references: string[] }> = [];
    
    // Try different splitting patterns
    for (const pattern of claimPatterns) {
      const parts = cleanText.split(pattern);
      if (parts.length > 2) { // Found at least one claim
        claims = [];
        for (let i = 1; i < parts.length; i += 2) {
          const claimNumber = parts[i];
          const claimText = parts[i + 1]?.trim() || '';
          if (claimNumber && claimText) {
            // Analyze claim dependencies
            const dependencies = analyzeClaim(claimText);
            claims.push({
              number: claimNumber,
              text: claimText,
              type: dependencies.isDependent ? 'dependent' : 'independent',
              references: dependencies.references
            });
          }
        }
        break; // Use the first pattern that works
      }
    }
    
    // If no pattern worked, try a simpler approach
    if (claims.length === 0) {
      const lines = cleanText.split('\n');
      let currentClaim = '';
      let currentNumber = '';
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        const claimMatch = trimmedLine.match(/^(\d+)\.\s*(.*)$/);
        
        if (claimMatch) {
          // Save previous claim if exists
          if (currentNumber && currentClaim) {
            const dependencies = analyzeClaim(currentClaim.trim());
            claims.push({ 
              number: currentNumber, 
              text: currentClaim.trim(),
              type: dependencies.isDependent ? 'dependent' : 'independent',
              references: dependencies.references
            });
          }
          // Start new claim
          currentNumber = claimMatch[1];
          currentClaim = claimMatch[2];
        } else if (currentNumber) {
          // Continue current claim
          currentClaim += ' ' + trimmedLine;
        }
      }
      
      // Add the last claim
      if (currentNumber && currentClaim) {
        const dependencies = analyzeClaim(currentClaim.trim());
        claims.push({ 
          number: currentNumber, 
          text: currentClaim.trim(),
          type: dependencies.isDependent ? 'dependent' : 'independent',
          references: dependencies.references
        });
      }
    }
    
    return claims;
  };

  const analyzeClaim = (claimText: string) => {
    // Strong patterns that definitively indicate a dependent claim
    const strongDependencyPatterns = [
      /\bof claim\s+(\d+)/gi,
      /\baccording to claim\s+(\d+)/gi,
      /\bas claimed in claim\s+(\d+)/gi,
      /\bas defined in claim\s+(\d+)/gi,
      /\bof any of claims\s+([\d\s,and-]+)/gi,
      /\bof claims\s+([\d\s,and-]+)/gi,
      /\bof any preceding claim/gi,
      /\bof the preceding claim/gi,
      /\bfurther comprising/gi,
      /\bfurther including/gi
    ];
    
    let isDependent = false;
    let references: string[] = [];
    
    // Check for strong dependency patterns first
    for (const pattern of strongDependencyPatterns) {
      const matches = [...claimText.matchAll(pattern)];
      if (matches.length > 0) {
        isDependent = true;
        matches.forEach(match => {
          if (match[1]) {
            // Extract claim numbers
            const claimRefs = match[1].match(/\d+/g);
            if (claimRefs) {
              references.push(...claimRefs);
            }
          }
        });
      }
    }
    
    // Additional check: if claim starts with method/composition language, likely independent
    const independentIndicators = [
      /^A method/i,
      /^A composition/i,
      /^A device/i,
      /^A system/i,
      /^An apparatus/i,
      /^A compound/i,
      /^A pharmaceutical/i,
      /^A process/i
    ];
    
    const hasIndependentIndicator = independentIndicators.some(pattern => 
      pattern.test(claimText.trim())
    );
    
    // If it has independent indicators and no strong dependencies, mark as independent
    if (hasIndependentIndicator && !isDependent) {
      isDependent = false;
    }
    
    // Remove duplicates from references
    references = [...new Set(references)];
    
    return { isDependent, references };
  };
  
  // Use pre-parsed data if available, otherwise parse on the fly
  const individualClaims = claimsStructure && claimsStructure.length > 0 
    ? claimsStructure 
    : parseIndividualClaims(claimsText);
  
  // Use pre-calculated counts if available
  const independentClaimsCount = independentCount !== undefined 
    ? independentCount 
    : individualClaims.filter(c => c.type === 'independent').length;
  
  const dependentClaimsCount = dependentCount !== undefined 
    ? dependentCount 
    : individualClaims.filter(c => c.type === 'dependent').length;
  
  return (
    <div className="space-y-4">
      {individualClaims.length > 0 ? (
        <>
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {claimsStructure ? 'Pre-analyzed' : 'Parsed'} {individualClaims.length} individual claims
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFullText(!showFullText)}
            >
              {showFullText ? 'Show Parsed Claims' : 'Show Full Text'}
            </Button>
          </div>
          
          {showFullText ? (
            <div className="bg-muted p-4 rounded-md max-h-64 overflow-y-auto">
              <pre className="text-sm whitespace-pre-wrap">
                {claimsText}
              </pre>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {/* Summary */}
              <div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded-lg">
                <div className="text-sm">
                  <div className="font-medium text-green-700">Independent Claims</div>
                  <div className="text-muted-foreground">
                    {independentClaimsCount}
                  </div>
                </div>
                <div className="text-sm">
                  <div className="font-medium text-blue-700">Dependent Claims</div>
                  <div className="text-muted-foreground">
                    {dependentClaimsCount}
                  </div>
                </div>
              </div>

              {individualClaims.map((claim, index) => (
                <div 
                  key={index} 
                  className={`border rounded-lg p-3 ${
                    claim.type === 'independent' 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 space-y-1">
                      <Badge 
                        variant="outline" 
                        className={`font-mono ${
                          claim.type === 'independent' 
                            ? 'border-green-600 text-green-700' 
                            : 'border-blue-600 text-blue-700'
                        }`}
                      >
                        Claim {claim.number}
                      </Badge>
                      <div>
                        <Badge 
                          variant={claim.type === 'independent' ? 'default' : 'secondary'}
                          className={`text-xs ${
                            claim.type === 'independent' 
                              ? 'bg-green-600 text-white' 
                              : 'bg-blue-600 text-white'
                          }`}
                        >
                          {claim.type === 'independent' ? 'Independent' : 'Dependent'}
                        </Badge>
                      </div>
                      {(claim.references?.length ?? 0) > 0 && (
                        <div className="text-xs text-muted-foreground">
                          Refs: {claim.references.join(', ')}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 text-sm leading-relaxed">
                      {claim.text}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="bg-muted p-4 rounded-md max-h-64 overflow-y-auto">
          <div className="text-sm text-muted-foreground mb-2">
            Could not parse individual claims. Showing full text:
          </div>
          <pre className="text-sm whitespace-pre-wrap">
            {claimsText}
          </pre>
        </div>
      )}
    </div>
  );
}