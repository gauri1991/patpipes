/**
 * Dataset Manager Tab - Select and manage datasets for classification
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Database, Check, AlertCircle, ArrowRight, RefreshCw } from 'lucide-react';
import { agenticApi, DatasetInfo } from '@/services/agenticApi';
import { formatDistanceToNow } from 'date-fns';

interface DatasetManagerTabProps {
  projectId?: string;
  onDatasetsSelected: (datasetIds: string[], merge: boolean) => void;
}

export function DatasetManagerTab({ projectId, onDatasetsSelected }: DatasetManagerTabProps) {
  const [datasets, setDatasets] = useState<DatasetInfo[]>([]);
  const [selectedDatasetIds, setSelectedDatasetIds] = useState<Set<string>>(new Set());
  const [mergeDatasets, setMergeDatasets] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectionInfo, setSelectionInfo] = useState<any>(null);

  useEffect(() => {
    loadDatasets();
  }, [projectId]);

  const loadDatasets = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await agenticApi.getAvailableDatasets(projectId);
      setDatasets(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load datasets');
    } finally {
      setLoading(false);
    }
  };

  const toggleDatasetSelection = (datasetId: string) => {
    const newSelection = new Set(selectedDatasetIds);
    if (newSelection.has(datasetId)) {
      newSelection.delete(datasetId);
    } else {
      newSelection.add(datasetId);
    }
    setSelectedDatasetIds(newSelection);
  };

  const handleProceedWithSelection = async () => {
    if (selectedDatasetIds.size === 0) {
      setError('Please select at least one dataset');
      return;
    }

    try {
      const datasetIdsArray = Array.from(selectedDatasetIds);
      const result = await agenticApi.selectDatasets(datasetIdsArray, mergeDatasets);
      setSelectionInfo(result);
      onDatasetsSelected(datasetIdsArray, mergeDatasets);
    } catch (err: any) {
      setError(err.message || 'Failed to process dataset selection');
    }
  };

  const getTotalPatentCount = () => {
    return datasets
      .filter(d => selectedDatasetIds.has(d.id))
      .reduce((sum, d) => sum + d.total_patents, 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading available datasets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Dataset Manager</h3>
          <p className="text-sm text-muted-foreground">
            Select datasets to process through the agentic discovery pipeline
          </p>
        </div>
        <Button onClick={loadDatasets} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Dataset List */}
      {datasets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <Database className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No datasets available</p>
            <p className="text-sm text-muted-foreground text-center">
              Upload datasets from the Datasets tab first, then come back here to process them
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {datasets.map(dataset => (
            <Card 
              key={dataset.id}
              className={`transition-all cursor-pointer ${
                selectedDatasetIds.has(dataset.id) 
                  ? 'ring-2 ring-primary border-primary' 
                  : 'hover:shadow-md'
              }`}
              onClick={() => toggleDatasetSelection(dataset.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      checked={selectedDatasetIds.has(dataset.id)}
                      onCheckedChange={() => toggleDatasetSelection(dataset.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="space-y-1">
                      <CardTitle className="text-base">{dataset.name}</CardTitle>
                      {dataset.description && (
                        <CardDescription>{dataset.description}</CardDescription>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {dataset.has_been_processed && (
                      <Badge variant="secondary">
                        <Check className="h-3 w-3 mr-1" />
                        Processed
                      </Badge>
                    )}
                    <Badge variant="outline">
                      {dataset.total_patents} patents
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>
                    Created {formatDistanceToNow(new Date(dataset.created_at), { addSuffix: true })}
                  </span>
                  {dataset.last_processed && (
                    <span>
                      Last processed {formatDistanceToNow(new Date(dataset.last_processed), { addSuffix: true })}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Selection Summary */}
      {selectedDatasetIds.size > 0 && (
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-base">Selection Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Selected Datasets</p>
                <p className="text-2xl font-bold">{selectedDatasetIds.size}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total Patents</p>
                <p className="text-2xl font-bold">{getTotalPatentCount()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Processing Mode</p>
                <p className="text-lg font-medium">
                  {mergeDatasets ? 'Merged Analysis' : 'Individual Analysis'}
                </p>
              </div>
            </div>

            {selectedDatasetIds.size > 1 && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="merge"
                  checked={mergeDatasets}
                  onCheckedChange={(checked) => setMergeDatasets(checked as boolean)}
                />
                <label
                  htmlFor="merge"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Merge datasets for combined analysis
                </label>
              </div>
            )}

            <Button 
              onClick={handleProceedWithSelection}
              className="w-full"
              size="lg"
            >
              Proceed to Configuration
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Selection Result */}
      {selectionInfo && (
        <Alert>
          <Check className="h-4 w-4" />
          <AlertDescription>
            <strong>Datasets selected successfully!</strong>
            <div className="mt-2 text-sm">
              <p>• {selectionInfo.datasets.length} dataset(s) selected</p>
              <p>• {selectionInfo.total_patents} total patents to process</p>
              <p>• Mode: {selectionInfo.merge ? 'Merged' : 'Individual'}</p>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}