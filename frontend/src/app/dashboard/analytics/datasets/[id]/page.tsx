/**
 * Dataset Detail Page
 * Displays detailed information about a specific patent dataset
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Play,
  Trash2,
  Download,
  RefreshCw,
  FileText,
  Calendar,
  Database,
  AlertCircle
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { StatusMonitor } from '@/components/analytics/datasets/StatusMonitor';
import { RecordsTable, PatentRecord } from '@/components/analytics/datasets/RecordsTable';
import { StatusBadge } from '@/components/analytics/datasets/StatusBadge';
import { analyticsApi, PatentDataset } from '@/services/analyticsApi';
import { toast } from 'sonner';

export default function DatasetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const datasetId = params.id as string;

  const [dataset, setDataset] = useState<PatentDataset | null>(null);
  const [records, setRecords] = useState<PatentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalRecords, setTotalRecords] = useState(0);

  // Fetch dataset details
  const fetchDataset = useCallback(async () => {
    try {
      const response = await analyticsApi.getDataset(datasetId);

      if (response.success && response.data) {
        setDataset(response.data);
        setError(null);
      } else {
        throw new Error(response.error || 'Failed to fetch dataset');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch dataset';
      setError(message);
      console.error('Dataset fetch error:', err);
      toast.error(message);
    }
  }, [datasetId]);

  // Fetch patent records
  const fetchRecords = useCallback(async () => {
    if (!dataset) return;

    try {
      setRecordsLoading(true);
      const response = await analyticsApi.getDatasetRecords(datasetId, currentPage, pageSize);

      if (response.success && response.data) {
        setRecords(response.data.records as PatentRecord[]);
        setTotalRecords(response.data.total_count);
      } else {
        throw new Error(response.error || 'Failed to fetch records');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch records';
      console.error('Records fetch error:', err);
      toast.error(message);
    } finally {
      setRecordsLoading(false);
    }
  }, [datasetId, currentPage, pageSize, dataset]);

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchDataset();
      setLoading(false);
    };

    loadData();
  }, [fetchDataset]);

  // Fetch records when dataset is loaded or pagination changes
  useEffect(() => {
    if (dataset && dataset.processing_status === 'completed') {
      fetchRecords();
    }
  }, [dataset, fetchRecords]);

  // Handle process dataset
  const handleProcess = async () => {
    if (!dataset) return;

    try {
      const response = await analyticsApi.processDataset(datasetId);

      if (response.success) {
        toast.success('Dataset processing started');
        await fetchDataset();
      } else {
        throw new Error(response.error || 'Failed to start processing');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start processing';
      toast.error(message);
    }
  };

  // Handle delete dataset
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this dataset? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await analyticsApi.deleteDataset(datasetId);

      if (response.success) {
        toast.success('Dataset deleted successfully');
        router.push('/dashboard/analytics/datasets');
      } else {
        throw new Error(response.error || 'Failed to delete dataset');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete dataset';
      toast.error(message);
    }
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle page size change
  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !dataset) {
    return (
      <div className="space-y-6">
        <Link href="/dashboard/analytics/datasets">
          <Button variant="ghost">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Datasets
          </Button>
        </Link>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || 'Dataset not found'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const canProcess = dataset.processing_status === 'pending' || dataset.processing_status === 'failed';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/analytics/datasets">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              {dataset.name}
              <StatusBadge status={dataset.processing_status} />
            </h1>
            <p className="text-muted-foreground">
              {dataset.description || 'No description provided'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={fetchDataset}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          {canProcess && (
            <Button onClick={handleProcess}>
              <Play className="h-4 w-4 mr-2" />
              Process Dataset
            </Button>
          )}
          <Button variant="outline" disabled>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Dataset Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patents</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dataset.total_patents.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processed</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dataset.processed_patents.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {dataset.total_patents > 0
                ? `${Math.round((dataset.processed_patents / dataset.total_patents) * 100)}%`
                : '0%'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Source</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium capitalize">
              {dataset.data_source.replace('_', ' ')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Created</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              {new Date(dataset.created_at).toLocaleDateString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="status" className="space-y-4">
        <TabsList>
          <TabsTrigger value="status">Processing Status</TabsTrigger>
          <TabsTrigger value="records" disabled={dataset.processing_status !== 'completed'}>
            Patent Records
          </TabsTrigger>
          <TabsTrigger value="metadata">Metadata</TabsTrigger>
        </TabsList>

        {/* Status Tab */}
        <TabsContent value="status" className="space-y-4">
          <StatusMonitor
            datasetId={dataset.id}
            status={dataset.processing_status}
            progress={dataset.processing_progress}
            totalRecords={dataset.total_patents}
            processedRecords={dataset.processed_patents}
            onRefresh={fetchDataset}
            logs={dataset.processing_log}
          />
        </TabsContent>

        {/* Records Tab */}
        <TabsContent value="records" className="space-y-4">
          {dataset.processing_status === 'completed' ? (
            <RecordsTable
              records={records}
              totalRecords={totalRecords}
              currentPage={currentPage}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              isLoading={recordsLoading}
            />
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Records Not Available</h3>
                <p className="text-muted-foreground">
                  Dataset must be processed before records can be viewed.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Metadata Tab */}
        <TabsContent value="metadata" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dataset Metadata</CardTitle>
              <CardDescription>
                Detailed information about this dataset
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Dataset ID</p>
                  <p className="text-sm font-mono">{dataset.id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Name</p>
                  <p className="text-sm">{dataset.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Data Source</p>
                  <p className="text-sm capitalize">{dataset.data_source.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Processing Status</p>
                  <StatusBadge status={dataset.processing_status} />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Created At</p>
                  <p className="text-sm">{formatDate(dataset.created_at)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                  <p className="text-sm">{formatDate(dataset.updated_at)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Created By</p>
                  <p className="text-sm">
                    {dataset.created_by.firstName} {dataset.created_by.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Classification Confidence</p>
                  <p className="text-sm">{(dataset.classification_confidence * 100).toFixed(1)}%</p>
                </div>
              </div>

              {dataset.description && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Description</p>
                  <p className="text-sm">{dataset.description}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
