/**
 * Live Processing Tab - Real-time pipeline processing with triplet display
 */

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Play, Pause, StopCircle, CheckCircle, XCircle, Clock, 
  Loader2, Activity, GitBranch, Layers, Brain, Network,
  ArrowRight, AlertCircle, Eye, Filter, Download
} from 'lucide-react';
import { agenticApi, Pipeline, PatentTriplet, AgentConfig } from '@/services/agenticApi';
import { usePipelineWebSocket } from '@/hooks/useWebSocket';
import { formatDistanceToNow } from 'date-fns';

interface LiveProcessingTabProps {
  datasetIds: string[];
  agentConfig?: AgentConfig;
  onProcessingComplete?: (pipelineId: string) => void;
}

interface ProcessingStage {
  name: string;
  icon: React.ElementType;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  message?: string;
}

export function LiveProcessingTab({ 
  datasetIds, 
  agentConfig,
  onProcessingComplete 
}: LiveProcessingTabProps) {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [activePipeline, setActivePipeline] = useState<Pipeline | null>(null);
  const [triplets, setTriplets] = useState<PatentTriplet[]>([]);
  const [processingStages, setProcessingStages] = useState<ProcessingStage[]>([
    { name: 'Preprocessing', icon: Activity, status: 'pending', progress: 0 },
    { name: 'Entity Extraction', icon: Brain, status: 'pending', progress: 0 },
    { name: 'Relationship Extraction', icon: GitBranch, status: 'pending', progress: 0 },
    { name: 'Normalization', icon: Layers, status: 'pending', progress: 0 },
    { name: 'Graph Building', icon: Network, status: 'pending', progress: 0 },
    { name: 'Clustering', icon: Layers, status: 'pending', progress: 0 }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPatentId, setSelectedPatentId] = useState<string | null>(null);
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);
  
  // WebSocket integration with authentication
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  const { lastMessage, isConnected, sendMessage, error: wsError } = usePipelineWebSocket(
    activePipeline?.id || '',
    token || undefined
  );

  // Handle WebSocket messages
  useEffect(() => {
    if (lastMessage) {
      handleWebSocketMessage(lastMessage);
    }
  }, [lastMessage]);

  useEffect(() => {
    if (datasetIds.length > 0 && agentConfig) {
      startProcessing();
    }

    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, [datasetIds, agentConfig]);

  const startProcessing = async () => {
    setError(null);
    setIsProcessing(true);

    try {
      const createdPipelines = await agenticApi.startPipeline({
        dataset_ids: datasetIds,
        processing_profile: agentConfig?.processing_profile,
        input_source: agentConfig?.input_source
      });

      setPipelines(createdPipelines);
      if (createdPipelines.length > 0) {
        setActivePipeline(createdPipelines[0]);
        startPolling(createdPipelines[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to start processing pipeline');
      setIsProcessing(false);
    }
  };

  const handleWebSocketMessage = (message: any) => {
    if (message.type === 'pipeline_update') {
      const update = message.data;
      
      // Update pipeline status
      if (activePipeline) {
        const updatedPipeline = {
          ...activePipeline,
          current_stage: update.stage,
          progress_percentage: update.progress
        };
        setActivePipeline(updatedPipeline);
        updateStageStatuses(updatedPipeline);
      }
      
      // Request latest results if processing is ongoing
      if (update.stage !== 'failed' && update.stage !== 'completed') {
        sendMessage({ type: 'get_results' });
      }
    } else if (message.type === 'pipeline_results') {
      // Update triplets from WebSocket
      if (message.data.triplets) {
        setTriplets(message.data.triplets);
      }
    }
  };

  const startPolling = (pipelineId: string) => {
    // Reduced polling frequency when WebSocket is connected
    const pollInterval = isConnected ? 10000 : 2000; // 10s vs 2s
    
    pollingInterval.current = setInterval(async () => {
      try {
        const pipeline = await agenticApi.getPipeline(pipelineId);
        setActivePipeline(pipeline);
        updateStageStatuses(pipeline);

        // Load triplets for current pipeline (if no WebSocket)
        if (!isConnected && pipeline.total_triplets > triplets.length) {
          const newTriplets = await agenticApi.getTriplets({
            patent_id: selectedPatentId || undefined,
            min_confidence: 0.5
          });
          setTriplets(newTriplets);
        }

        // Check if processing is complete
        if (pipeline.current_stage === 'completed' || pipeline.current_stage === 'failed') {
          setIsProcessing(false);
          if (pollingInterval.current) {
            clearInterval(pollingInterval.current);
          }
          if (pipeline.current_stage === 'completed' && onProcessingComplete) {
            onProcessingComplete(pipelineId);
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 2000);
  };

  const updateStageStatuses = (pipeline: Pipeline) => {
    const stageOrder = [
      'preprocessing',
      'entity_extraction',
      'relationship_extraction',
      'normalization',
      'graph_building',
      'clustering'
    ];

    const currentStageIndex = stageOrder.indexOf(pipeline.current_stage);

    setProcessingStages(prev => prev.map((stage, index) => {
      if (index < currentStageIndex) {
        return { ...stage, status: 'completed', progress: 100 };
      } else if (index === currentStageIndex) {
        return { 
          ...stage, 
          status: 'processing', 
          progress: pipeline.progress_percentage || 50,
          message: pipeline.stage_status[pipeline.current_stage]?.message
        };
      } else {
        return { ...stage, status: 'pending', progress: 0 };
      }
    }));
  };

  const cancelProcessing = async () => {
    if (activePipeline) {
      try {
        await agenticApi.cancelPipeline(activePipeline.id);
        setIsProcessing(false);
        if (pollingInterval.current) {
          clearInterval(pollingInterval.current);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to cancel pipeline');
      }
    }
  };

  const handleExport = async (format: 'csv' | 'json' | 'excel') => {
    if (!activePipeline) return;
    
    try {
      await agenticApi.exportResults(activePipeline.id, format);
    } catch (err: any) {
      setError(err.message || `Failed to export ${format.toUpperCase()}`);
    }
  };

  const getStageIcon = (stage: ProcessingStage) => {
    const Icon = stage.icon;
    if (stage.status === 'completed') {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    } else if (stage.status === 'processing') {
      return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
    } else if (stage.status === 'failed') {
      return <XCircle className="h-5 w-5 text-red-500" />;
    }
    return <Icon className="h-5 w-5 text-muted-foreground" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Live Processing Pipeline</h3>
          <p className="text-sm text-muted-foreground">
            Real-time entity and relationship extraction
          </p>
        </div>
        <div className="flex gap-2">
          {activePipeline?.current_stage === 'completed' && (
            <>
              <Button onClick={() => handleExport('json')} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export JSON
              </Button>
              <Button onClick={() => handleExport('excel')} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Excel
              </Button>
            </>
          )}
          {isProcessing ? (
            <Button onClick={cancelProcessing} variant="destructive" size="sm">
              <StopCircle className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          ) : (
            <Button onClick={startProcessing} size="sm">
              <Play className="h-4 w-4 mr-2" />
              Restart
            </Button>
          )}
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-3 gap-6">
        {/* Pipeline Status Panel */}
        <div className="col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pipeline Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {processingStages.map((stage, index) => (
                <div key={stage.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStageIcon(stage)}
                      <span className="text-sm font-medium">{stage.name}</span>
                    </div>
                    {stage.status === 'processing' && (
                      <span className="text-xs text-muted-foreground">
                        {stage.progress}%
                      </span>
                    )}
                  </div>
                  {stage.status === 'processing' && (
                    <Progress value={stage.progress} className="h-1" />
                  )}
                  {stage.message && (
                    <p className="text-xs text-muted-foreground">{stage.message}</p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Statistics Card */}
          {activePipeline && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Processing Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Patents</span>
                  <span className="font-medium">{activePipeline.total_patents}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Processed</span>
                  <span className="font-medium">{activePipeline.processed_patents}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Entities Found</span>
                  <span className="font-medium">{activePipeline.total_entities}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Triplets Extracted</span>
                  <span className="font-medium">{activePipeline.total_triplets}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Unique Relations</span>
                  <span className="font-medium">{activePipeline.unique_relationships}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Triplets Display Panel */}
        <div className="col-span-2">
          <Card className="h-[600px] flex flex-col">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-base">Extracted Triplets</CardTitle>
                  <CardDescription>
                    Entity-Relationship-Entity triplets from patents
                  </CardDescription>
                </div>
                <Badge variant="secondary">
                  {triplets.length} triplets
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Patent ID</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Relation</TableHead>
                      <TableHead>Object</TableHead>
                      <TableHead className="w-[80px]">Confidence</TableHead>
                      <TableHead className="w-[50px]">View</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {triplets.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          {isProcessing 
                            ? 'Waiting for triplet extraction...' 
                            : 'No triplets extracted yet'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      triplets.map((triplet) => (
                        <TableRow key={triplet.id}>
                          <TableCell className="font-mono text-xs">
                            {triplet.patent_id.slice(0, 8)}...
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium text-sm">{triplet.subject_text}</div>
                              <Badge variant="outline" className="text-xs mt-1">
                                {triplet.subject_type}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {triplet.predicate.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium text-sm">{triplet.object_text}</div>
                              <Badge variant="outline" className="text-xs mt-1">
                                {triplet.object_type}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <div className="w-full bg-muted rounded-full h-2">
                                <div 
                                  className="bg-primary rounded-full h-2 transition-all"
                                  style={{ width: `${triplet.confidence_score * 100}%` }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {(triplet.confidence_score * 100).toFixed(0)}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button size="sm" variant="ghost">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Processing Complete Alert */}
      {activePipeline?.current_stage === 'completed' && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>Processing Complete!</strong>
            <div className="mt-2">
              • {activePipeline.processed_patents} patents processed<br/>
              • {activePipeline.total_entities} entities extracted<br/>
              • {activePipeline.total_triplets} triplets identified<br/>
              • {activePipeline.unique_relationships} unique relationships found
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}