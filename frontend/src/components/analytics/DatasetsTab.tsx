'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Upload,
  FileText,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Download,
  Play,
  Pause,
  RefreshCw,
  Database,
  AlertCircle,
  CheckCircle2,
  Clock,
  X,
  Tags,
  FolderInput,
  Search,
  Globe
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
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

import { PatentDataset, PatentDatasetCreateData, MappingApplicationResult } from '@/services/analyticsApi';
import { analyticsApi } from '@/services/analyticsApi';
import { DatasetDetailView } from './DatasetDetailView';
import { IntelligentColumnMapping } from './IntelligentColumnMapping';
import { cn } from '@/lib/utils';

interface DatasetsTabProps {
  projectId: string;
  datasets: PatentDataset[];
  onDatasetsChange: () => void;
}

interface PortfolioOption {
  id: string;
  name: string;
  patent_count: number;
}

export function DatasetsTab({ projectId, datasets, onDatasetsChange }: DatasetsTabProps) {
  const router = useRouter();
  const [showCreateDataset, setShowCreateDataset] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState<PatentDataset | null>(null);
  const [showDatasetDetails, setShowDatasetDetails] = useState(false);
  const [showColumnMapping, setShowColumnMapping] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);

  // Portfolio import state
  const [showPortfolioImport, setShowPortfolioImport] = useState(false);
  const [portfolios, setPortfolios] = useState<PortfolioOption[]>([]);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>('');
  const [portfolioImportName, setPortfolioImportName] = useState('');
  const [portfolioImportLoading, setPortfolioImportLoading] = useState(false);
  const [portfoliosLoading, setPortfoliosLoading] = useState(false);

  // ODP import state
  const [showODPImport, setShowODPImport] = useState(false);
  const [odpSearchKeyword, setOdpSearchKeyword] = useState('');
  const [odpSearchAssignee, setOdpSearchAssignee] = useState('');
  const [odpImportName, setOdpImportName] = useState('');
  const [odpImportLoading, setOdpImportLoading] = useState(false);

  // Fetch portfolios when dialog opens
  const fetchPortfolios = async () => {
    setPortfoliosLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/patents/portfolios/?limit=200`,
        { headers: { 'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('patpipes_access_token') : ''}` } }
      );
      if (response.ok) {
        const data = await response.json();
        const results = data.results || data || [];
        setPortfolios(results.map((p: any) => ({ id: p.id, name: p.name, patent_count: p.patent_count ?? p.patents_count ?? 0 })));
      }
    } catch {
      toast.error('Failed to load portfolios');
    } finally {
      setPortfoliosLoading(false);
    }
  };

  const handlePortfolioImport = async () => {
    if (!selectedPortfolioId) {
      toast.error('Please select a portfolio');
      return;
    }
    setPortfolioImportLoading(true);
    try {
      const response = await analyticsApi.importDatasetFromPortfolio(projectId, selectedPortfolioId, portfolioImportName || undefined);
      if (response.success && response.data) {
        toast.success(`Imported ${response.data.total_patents} patents from portfolio`);
        setShowPortfolioImport(false);
        setSelectedPortfolioId('');
        setPortfolioImportName('');
        onDatasetsChange();
      } else {
        toast.error(response.error || 'Failed to import from portfolio');
      }
    } catch {
      toast.error('Failed to import from portfolio');
    } finally {
      setPortfolioImportLoading(false);
    }
  };

  const handleODPImport = async () => {
    if (!odpSearchKeyword && !odpSearchAssignee) {
      toast.error('Please enter at least a keyword or assignee');
      return;
    }
    setOdpImportLoading(true);
    try {
      const searchParams: Record<string, any> = {};
      if (odpSearchKeyword) searchParams.keyword = odpSearchKeyword;
      if (odpSearchAssignee) searchParams.assignee = odpSearchAssignee;

      const response = await analyticsApi.importDatasetFromODP(projectId, odpImportName || 'ODP Import', searchParams);
      if (response.success && response.data) {
        toast.success(`Imported ${response.data.total_patents} patents from USPTO ODP`);
        setShowODPImport(false);
        setOdpSearchKeyword('');
        setOdpSearchAssignee('');
        setOdpImportName('');
        onDatasetsChange();
      } else {
        toast.error(response.error || 'Failed to import from USPTO');
      }
    } catch {
      toast.error('Failed to import from USPTO');
    } finally {
      setOdpImportLoading(false);
    }
  };

  const handleCreateDataset = async (data: Omit<PatentDatasetCreateData, 'project'>) => {
    try {
      setLoading(true);
      setIsUploading(true);
      setUploadProgress(0);

      // If file upload, show progress
      if (data.data_file) {
        toast.info('Uploading dataset file...');

        // Simulate progress (since actual progress tracking requires backend support)
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return prev + 10;
          });
        }, 300);

        try {
          const response = await analyticsApi.createDataset({
            ...data,
            project: projectId
          });

          clearInterval(progressInterval);
          setUploadProgress(100);

          if (response.success) {
            toast.success('Dataset created and uploaded successfully!');
            setShowCreateDataset(false);
            onDatasetsChange();
          } else {
            const errorMsg = response.error || 'Failed to create dataset';
            toast.error(errorMsg);

            // Provide specific error guidance
            if (errorMsg.includes('format')) {
              toast.error('Please check that your file is properly formatted');
            } else if (errorMsg.includes('size')) {
              toast.error('File size exceeds server limits');
            } else if (errorMsg.includes('column')) {
              toast.error('Column mapping issue detected - check file structure');
            }
          }
        } catch (uploadError: any) {
          clearInterval(progressInterval);
          console.error('Upload error:', uploadError);

          // Enhanced error messages
          if (uploadError.message?.includes('Network')) {
            toast.error('Network error - check your connection and try again');
          } else if (uploadError.message?.includes('timeout')) {
            toast.error('Upload timeout - file may be too large');
          } else if (uploadError.message?.includes('401') || uploadError.message?.includes('403')) {
            toast.error('Authentication error - please login again');
          } else {
            toast.error('Failed to upload dataset file');
          }
        }
      } else {
        // No file upload, just create dataset record
        const response = await analyticsApi.createDataset({
          ...data,
          project: projectId
        });

        if (response.success) {
          toast.success('Dataset created successfully');
          setShowCreateDataset(false);
          onDatasetsChange();
        } else {
          toast.error(response.error || 'Failed to create dataset');
        }
      }
    } catch (error: any) {
      console.error('Dataset creation error:', error);
      toast.error(error.message || 'Failed to create dataset');
    } finally {
      setLoading(false);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDeleteDataset = async (datasetId: string) => {
    if (!confirm('Are you sure you want to delete this dataset? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await analyticsApi.deleteDataset(datasetId);
      if (response.success) {
        toast.success('Dataset deleted successfully');
        onDatasetsChange();
      } else {
        toast.error(response.error || 'Failed to delete dataset');
      }
    } catch (error) {
      toast.error('Failed to delete dataset');
    }
  };

  const handleProcessDataset = async (datasetId: string) => {
    try {
      const response = await analyticsApi.processDataset(datasetId);
      if (response.success) {
        toast.success('Dataset processing started');
        onDatasetsChange();
      } else {
        toast.error(response.error || 'Failed to start processing');
      }
    } catch (error) {
      toast.error('Failed to start processing');
    }
  };

  const handleConfigureMapping = (dataset: PatentDataset) => {
    setSelectedDataset(dataset);
    setShowColumnMapping(true);
  };

  const handleMappingComplete = (result: MappingApplicationResult) => {
    toast.success(
      `Column mapping applied! ${result.applied_mappings} mappings configured` +
      (result.dynamic_fields_created > 0 ? `, ${result.dynamic_fields_created} new fields created` : '')
    );
    onDatasetsChange(); // Refresh datasets to show updated status
  };

  const handleSendToClassifier = (dataset: PatentDataset) => {
    // Store the dataset in sessionStorage to pass to classifier
    sessionStorage.setItem('classifierDataset', JSON.stringify({
      datasetId: dataset.id,
      datasetName: dataset.name,
      projectId: projectId,
      records: (dataset as any).records || []
    }));

    // Navigate to classifier tab
    router.push(`/dashboard/analytics/projects/${projectId}?tab=classifier`);

    // Also update the tab in localStorage
    localStorage.setItem(`analytics-project-${projectId}-tab`, 'classifier');

    toast.success(`Sending dataset "${dataset.name}" to Classifier`);
  };

  const handleExportDataset = async (dataset: PatentDataset) => {
    try {
      toast.info('Preparing dataset export...');
      const blob = await analyticsApi.exportDatasetData(dataset.id, 'json');

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `dataset-${dataset.name.replace(/[^a-z0-9]/gi, '_')}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Dataset exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export dataset');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'processing':
        return <Badge variant="secondary"><RefreshCw className="w-3 h-3 mr-1 animate-spin" />Processing</Badge>;
      case 'failed':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      case 'pending':
      default:
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    }
  };

  const formatDataSource = (source: string) => {
    switch (source) {
      case 'manual_upload': return 'Manual Upload';
      case 'api_import': return 'API Import';
      case 'database_query': return 'Database Query';
      case 'web_scraping': return 'Web Scraping';
      case 'portfolio_import': return 'Portfolio Import';
      case 'odp_import': return 'USPTO ODP Import';
      default: return source;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Patent Datasets</h3>
          <p className="text-sm text-muted-foreground">
            Manage patent datasets for analysis ({datasets.length} total)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => { setShowPortfolioImport(true); fetchPortfolios(); }}>
            <FolderInput className="mr-2 h-4 w-4" />
            Import from Portfolio
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowODPImport(true)}>
            <Globe className="mr-2 h-4 w-4" />
            Import from USPTO
          </Button>
          <Dialog open={showCreateDataset} onOpenChange={setShowCreateDataset}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Upload Dataset
              </Button>
            </DialogTrigger>
            <CreateDatasetDialog
              onSubmit={handleCreateDataset}
              loading={loading}
              uploadProgress={uploadProgress}
              isUploading={isUploading}
            />
          </Dialog>
        </div>
      </div>

      {datasets.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Database className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <h4 className="text-lg font-medium mb-2">No datasets added yet</h4>
            <p className="text-muted-foreground mb-4">
              Start by adding a patent dataset to analyze for this project.
            </p>
            <Button onClick={() => setShowCreateDataset(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Dataset
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Datasets ({datasets.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Patents</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {datasets.map((dataset) => (
                  <TableRow key={dataset.id}>
                    <TableCell>
                      <div>
                        <button 
                          className="font-medium text-left hover:text-blue-600 hover:underline transition-colors"
                          onClick={() => {
                            setSelectedDataset(dataset);
                            setShowDatasetDetails(true);
                          }}
                        >
                          {dataset.name}
                        </button>
                        {dataset.description && (
                          <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                            {dataset.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{formatDataSource(dataset.data_source)}</span>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(dataset.processing_status)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{dataset.total_patents?.toLocaleString() || '0'}</div>
                        {dataset.processed_patents !== undefined && (
                          <div className="text-muted-foreground">
                            {dataset.processed_patents} processed
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {dataset.processing_status === 'processing' ? (
                        <div className="space-y-1">
                          <Progress value={dataset.processing_progress || 0} className="h-2" />
                          <span className="text-xs text-muted-foreground">
                            {dataset.processing_progress || 0}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          {dataset.processing_status === 'completed' ? '100%' : '-'}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {new Date(dataset.created_at).toLocaleDateString()}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem 
                            onClick={() => {
                              setSelectedDataset(dataset);
                              setShowDatasetDetails(true);
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          
                          {dataset.processing_status === 'pending' && (
                            <>
                              <DropdownMenuItem onClick={() => handleConfigureMapping(dataset)}>
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Configure Mapping
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleProcessDataset(dataset.id)}>
                                <Play className="mr-2 h-4 w-4" />
                                Start Processing
                              </DropdownMenuItem>
                            </>
                          )}
                          
                          <DropdownMenuItem onClick={() => handleExportDataset(dataset)}>
                            <Download className="mr-2 h-4 w-4" />
                            Export Data
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem 
                            onClick={() => handleSendToClassifier(dataset)}
                            className="text-purple-600 hover:text-purple-700"
                          >
                            <Tags className="mr-2 h-4 w-4" />
                            Send to Classifier
                          </DropdownMenuItem>
                          
                          <DropdownMenuSeparator />
                          
                          <DropdownMenuItem 
                            onClick={() => handleDeleteDataset(dataset.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Dataset Details Modal */}
      {selectedDataset && (
        <DatasetDetailView
          dataset={selectedDataset}
          isOpen={showDatasetDetails}
          onClose={() => setShowDatasetDetails(false)}
          onProcessingStart={() => {
            onDatasetsChange();
            setShowDatasetDetails(false);
          }}
        />
      )}

      {/* Intelligent Column Mapping Modal */}
      {selectedDataset && (
        <IntelligentColumnMapping
          dataset={selectedDataset}
          isOpen={showColumnMapping}
          onClose={() => setShowColumnMapping(false)}
          onMappingComplete={handleMappingComplete}
        />
      )}

      {/* Portfolio Import Dialog */}
      <Dialog open={showPortfolioImport} onOpenChange={setShowPortfolioImport}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderInput className="h-5 w-5" />
              Import from Portfolio
            </DialogTitle>
            <DialogDescription>
              Import patents from an existing portfolio into this analytics project as a dataset.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Portfolio</Label>
              {portfoliosLoading ? (
                <div className="text-sm text-muted-foreground py-2">Loading portfolios...</div>
              ) : portfolios.length === 0 ? (
                <div className="text-sm text-muted-foreground py-2">No portfolios found. Create a portfolio first.</div>
              ) : (
                <Select value={selectedPortfolioId} onValueChange={setSelectedPortfolioId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a portfolio" />
                  </SelectTrigger>
                  <SelectContent>
                    {portfolios.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} ({p.patent_count} patents)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-2">
              <Label>Dataset Name (optional)</Label>
              <Input
                placeholder="Auto-generated from portfolio name"
                value={portfolioImportName}
                onChange={e => setPortfolioImportName(e.target.value)}
              />
            </div>
            {selectedPortfolioId && (
              <div className="rounded-md bg-blue-50 p-3 text-sm">
                <Database className="inline h-4 w-4 mr-1 text-blue-600" />
                {portfolios.find(p => p.id === selectedPortfolioId)?.patent_count || 0} patents will be imported as PatentRecords
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPortfolioImport(false)}>Cancel</Button>
            <Button onClick={handlePortfolioImport} disabled={portfolioImportLoading || !selectedPortfolioId}>
              {portfolioImportLoading ? 'Importing...' : 'Import'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ODP Import Dialog */}
      <Dialog open={showODPImport} onOpenChange={setShowODPImport}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Import from USPTO ODP
            </DialogTitle>
            <DialogDescription>
              Search the USPTO Open Data Portal and import patent records directly into this project.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Dataset Name</Label>
              <Input
                placeholder="e.g., AI Patents 2024"
                value={odpImportName}
                onChange={e => setOdpImportName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Keyword Search</Label>
              <Input
                placeholder="e.g., machine learning, neural network"
                value={odpSearchKeyword}
                onChange={e => setOdpSearchKeyword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Assignee / Applicant</Label>
              <Input
                placeholder="e.g., Google, Microsoft"
                value={odpSearchAssignee}
                onChange={e => setOdpSearchAssignee(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowODPImport(false)}>Cancel</Button>
            <Button onClick={handleODPImport} disabled={odpImportLoading || (!odpSearchKeyword && !odpSearchAssignee)}>
              <Search className="mr-2 h-4 w-4" />
              {odpImportLoading ? 'Searching & Importing...' : 'Search & Import'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Create Dataset Dialog Component
function CreateDatasetDialog({ onSubmit, loading, uploadProgress, isUploading }: {
  onSubmit: (data: Omit<PatentDatasetCreateData, 'project'>) => void;
  loading: boolean;
  uploadProgress: number;
  isUploading: boolean;
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    data_source: 'manual_upload' as const,
    data_file: null as File | null
  });
  const [fileError, setFileError] = useState<string | null>(null);

  // File validation constants
  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  const ALLOWED_TYPES = [
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/json',
    'application/xml',
    'text/xml'
  ];
  const ALLOWED_EXTENSIONS = ['.csv', '.xlsx', '.xls', '.json', '.xml'];

  const handleSubmit = () => {
    if (formData.name.trim() && !fileError) {
      onSubmit({ ...formData, data_file: formData.data_file ?? undefined });
      setFormData({
        name: '',
        description: '',
        data_source: 'manual_upload',
        data_file: null
      });
      setFileError(null);
    }
  };

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / (1024 * 1024)}MB`;
    }

    // Check file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
      return `Invalid file type. Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}`;
    }

    // Additional MIME type check
    if (!ALLOWED_TYPES.includes(file.type) && file.type !== '') {
      return `Invalid file format. Please upload a valid patent data file.`;
    }

    return null;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const error = validateFile(file);
      if (error) {
        setFileError(error);
        toast.error(error);
        setFormData({ ...formData, data_file: null });
      } else {
        setFileError(null);
        setFormData({ ...formData, data_file: file });
        toast.success(`File "${file.name}" ready for upload`);
      }
    }
  };

  return (
    <DialogContent className="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>Add New Dataset</DialogTitle>
        <DialogDescription>
          Upload or configure a new patent dataset for analysis.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="name">Dataset Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter dataset name"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe the dataset and its contents"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="data_source">Data Source</Label>
          <Select
            value={formData.data_source}
            onValueChange={(value: any) => setFormData({ ...formData, data_source: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manual_upload">Manual Upload</SelectItem>
              <SelectItem value="api_import">API Import</SelectItem>
              <SelectItem value="database_query">Database Query</SelectItem>
              <SelectItem value="web_scraping">Web Scraping</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {formData.data_source === 'manual_upload' && (
          <div className="space-y-2">
            <Label htmlFor="file">Upload File</Label>
            <div className={cn(
              "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
              fileError ? "border-red-300 bg-red-50" : "border-gray-300 hover:border-blue-400"
            )}>
              <Input
                id="file"
                type="file"
                onChange={handleFileChange}
                accept=".csv,.xlsx,.xls,.json,.xml"
                className="hidden"
              />
              <Label htmlFor="file" className="cursor-pointer">
                <Upload className={cn(
                  "mx-auto h-8 w-8 mb-2",
                  fileError ? "text-red-400" : "text-muted-foreground"
                )} />
                <div className="text-sm">
                  <span className={cn(
                    "font-medium",
                    fileError ? "text-red-600" : "text-blue-600"
                  )}>Click to upload</span> or drag and drop
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  CSV, Excel, JSON, or XML files (max 50MB)
                </div>
                {formData.data_file && !fileError && (
                  <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-md">
                    <div className="flex items-center justify-center gap-2 text-sm text-green-700">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="font-medium">{formData.data_file.name}</span>
                      <span className="text-xs text-green-600">
                        ({(formData.data_file.size / 1024).toFixed(2)} KB)
                      </span>
                    </div>
                  </div>
                )}
                {fileError && (
                  <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex items-center justify-center gap-2 text-sm text-red-700">
                      <AlertCircle className="h-4 w-4" />
                      <span>{fileError}</span>
                    </div>
                  </div>
                )}
              </Label>
            </div>
          </div>
        )}

        {/* Upload Progress Indicator */}
        {isUploading && uploadProgress > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Uploading...</span>
              <span className="font-medium text-blue-600">{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
            {uploadProgress === 100 && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                <span>Upload complete! Processing dataset...</span>
              </div>
            )}
          </div>
        )}
      </div>
      <DialogFooter>
        <Button
          variant="outline"
          onClick={() => {
            setFormData({
              name: '', description: '', data_source: 'manual_upload', data_file: null
            });
            setFileError(null);
          }}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!formData.name.trim() || loading || (formData.data_source === 'manual_upload' && !formData.data_file) || !!fileError}
        >
          {loading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
          {isUploading ? 'Uploading...' : loading ? 'Creating...' : 'Create Dataset'}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

