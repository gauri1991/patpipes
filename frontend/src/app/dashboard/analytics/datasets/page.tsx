/**
 * Analytics Datasets List Page
 * Main page for managing patent datasets
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Database,
  Upload,
  RefreshCw,
  Search,
  Filter,
  AlertCircle
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { DatasetCard, Dataset } from '@/components/analytics/datasets/DatasetCard';
import { UploadDialog } from '@/components/analytics/datasets/UploadDialog';
import { analyticsApi, PatentDataset } from '@/services/analyticsApi';
import { toast } from 'sonner';

export default function DatasetsPage() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [filteredDatasets, setFilteredDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Fetch datasets
  const fetchDatasets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await analyticsApi.getDatasets();

      if (response.success && response.data) {
        // Transform API response to match Dataset interface
        const transformedData: Dataset[] = response.data.map((d: PatentDataset) => ({
          id: d.id,
          name: d.name,
          description: d.description,
          data_source: d.data_source,
          processing_status: d.processing_status,
          processing_progress: d.processing_progress,
          total_patents: d.total_patents,
          processed_patents: d.processed_patents,
          created_at: d.created_at,
          updated_at: d.updated_at
        }));

        setDatasets(transformedData);
        setFilteredDatasets(transformedData);
      } else {
        throw new Error(response.error || 'Failed to fetch datasets');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch datasets';
      setError(message);
      console.error('Datasets fetch error:', err);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchDatasets();
  }, [fetchDatasets]);

  // Filter datasets based on search and status
  useEffect(() => {
    let filtered = [...datasets];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(d =>
        d.name.toLowerCase().includes(query) ||
        d.description?.toLowerCase().includes(query) ||
        d.data_source.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(d => d.processing_status === statusFilter);
    }

    setFilteredDatasets(filtered);
  }, [searchQuery, statusFilter, datasets]);

  // Handle dataset upload
  const handleUpload = async (formData: FormData) => {
    try {
      const response = await analyticsApi.createDataset(formData as any);

      if (response.success && response.data) {
        toast.success('Dataset uploaded successfully');
        await fetchDatasets(); // Refresh the list
      } else {
        throw new Error(response.error || 'Failed to upload dataset');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to upload dataset';
      toast.error(message);
      throw err; // Re-throw to let UploadDialog handle it
    }
  };

  // Handle dataset processing
  const handleProcess = async (datasetId: string) => {
    try {
      const response = await analyticsApi.processDataset(datasetId);

      if (response.success) {
        toast.success('Dataset processing started');
        await fetchDatasets(); // Refresh to show updated status
      } else {
        throw new Error(response.error || 'Failed to start processing');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start processing';
      toast.error(message);
    }
  };

  // Handle dataset deletion
  const handleDelete = async (datasetId: string) => {
    if (!confirm('Are you sure you want to delete this dataset? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await analyticsApi.deleteDataset(datasetId);

      if (response.success) {
        toast.success('Dataset deleted successfully');
        await fetchDatasets(); // Refresh the list
      } else {
        throw new Error(response.error || 'Failed to delete dataset');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete dataset';
      toast.error(message);
    }
  };

  // Calculate statistics
  const stats = {
    total: datasets.length,
    pending: datasets.filter(d => d.processing_status === 'pending').length,
    processing: datasets.filter(d => d.processing_status === 'processing').length,
    completed: datasets.filter(d => d.processing_status === 'completed').length,
    failed: datasets.filter(d => d.processing_status === 'failed').length,
    totalPatents: datasets.reduce((sum, d) => sum + d.total_patents, 0)
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Patent Datasets</h1>
          <p className="text-muted-foreground">
            Manage and process patent data for analytics
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={fetchDatasets}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <UploadDialog onUpload={handleUpload} />
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Datasets</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <div className="h-2 w-2 rounded-full bg-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
            <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.processing}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <div className="h-2 w-2 rounded-full bg-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <div className="h-2 w-2 rounded-full bg-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.failed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patents</CardTitle>
            <Database className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPatents.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Datasets</CardTitle>
              <CardDescription>
                {filteredDatasets.length} of {datasets.length} datasets
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search datasets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Datasets Grid */}
          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Loading datasets...</p>
            </div>
          ) : filteredDatasets.length === 0 ? (
            <div className="text-center py-12">
              <Database className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">
                {datasets.length === 0 ? 'No datasets yet' : 'No datasets match your filters'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {datasets.length === 0
                  ? 'Upload your first patent dataset to get started with analytics'
                  : 'Try adjusting your search or filter criteria'}
              </p>
              {datasets.length === 0 && (
                <UploadDialog
                  onUpload={handleUpload}
                  trigger={
                    <Button>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Your First Dataset
                    </Button>
                  }
                />
              )}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredDatasets.map((dataset) => (
                <DatasetCard
                  key={dataset.id}
                  dataset={dataset}
                  onProcess={handleProcess}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
