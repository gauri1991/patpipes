/**
 * Advanced Agentic Patent Discovery System
 * Revolutionary approach to patent analysis and insights
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Brain,
  Sparkles,
  Search,
  Lightbulb,
  Network,
  Zap,
  Play,
  Pause,
  Activity,
  BarChart3,
  Eye,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Download,
  Settings
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  agenticPatentDiscovery, 
  transformPatentData,
  createMockPatentData
} from '@/services/agenticProcessor/AgenticPatentDiscovery';
import { 
  PatentAnalysisResult,
  ProcessingStatus,
  AgentStage
} from '@/services/agenticProcessor/types';
import {
  ExtractedEntity,
  EntityType,
  ProcessingStatus as ProcessingStatusType,
  ExtractedRelationship,
  RelationshipType,
  NormalizedTerm,
  KnowledgeGraph,
  GraphNode,
  GraphEdge,
  PatentCluster,
  ClusterType
} from '@/services/agenticProcessor/types';

interface PatentData {
  id: string;
  title: string;
  abstract: string;
  claims: string[];
  description?: string;
  assignee?: string;
  publicationDate?: string;
}

interface AdvancedClassifierTabProps {
  projectId: string;
  patents: PatentData[];
  onAnalysisComplete?: (results: any[]) => void;
}

export function AdvancedClassifierTab({ 
  projectId, 
  patents: initialPatents = [],
  onAnalysisComplete 
}: AdvancedClassifierTabProps) {
  const [patents, setPatents] = useState<PatentData[]>(initialPatents);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processingStatuses, setProcessingStatuses] = useState<ProcessingStatusType[]>([]);
  const [discoveryResults, setDiscoveryResults] = useState<PatentAnalysisResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<PatentAnalysisResult | null>(null);
  const [pipelineStats, setPipelineStats] = useState<any>(null);

  useEffect(() => {
    // Load patents from sessionStorage if available
    const storedDataset = sessionStorage.getItem('classifierDataset');
    if (storedDataset) {
      try {
        const datasetData = JSON.parse(storedDataset);
        if (datasetData.records && datasetData.records.length > 0) {
          const transformedPatents: PatentData[] = datasetData.records.map((record: any) => ({
            id: record.id || `patent_${Date.now()}_${Math.random()}`,
            title: record.title || record.patent_title || 'Untitled',
            abstract: record.abstract || record.patent_abstract || '',
            claims: record.claims || [record.claim_1, record.claim_2].filter(Boolean) || [],
            description: record.description || '',
            assignee: record.assignee || '',
            publicationDate: record.publication_date || ''
          }));
          setPatents(transformedPatents);
          sessionStorage.removeItem('classifierDataset');
        }
      } catch (error) {
        console.error('Error loading dataset:', error);
      }
    }
  }, []);

  // Start discovery process
  const handleStartDiscovery = useCallback(async () => {
    if (patents.length === 0) return;
    
    setProcessing(true);
    setDiscoveryResults([]);
    setProcessingStatuses([]);
    
    try {
      // Initialize the service
      await agenticPatentDiscovery.initialize();
      
      // Process patents and monitor status
      const results = await agenticPatentDiscovery.discoverPatentBatch(patents.slice(0, 3)); // Limit to 3 for demo
      
      setDiscoveryResults(results);
      setSelectedResult(results[0] || null);
      
      // Get final stats
      const stats = agenticPatentDiscovery.getPipelineStats();
      setPipelineStats(stats);
      
      if (onAnalysisComplete) {
        onAnalysisComplete(results);
      }
      
    } catch (error) {
      console.error('Discovery failed:', error);
    } finally {
      setProcessing(false);
    }
  }, [patents, onAnalysisComplete]);
  
  // Refresh processing status during execution
  useEffect(() => {
    if (!processing) return;
    
    const interval = setInterval(() => {
      const statuses = agenticPatentDiscovery.getAllProcessingStatuses();
      setProcessingStatuses(statuses);
    }, 500);
    
    return () => clearInterval(interval);
  }, [processing]);
  
  // Demo with mock data if no patents loaded
  const handleDemoDiscovery = useCallback(async () => {
    const mockPatent = createMockPatentData();
    setPatents([mockPatent]);
    
    // Start discovery with mock data
    setTimeout(() => {
      handleStartDiscovery();
    }, 100);
  }, [handleStartDiscovery]);
  
  // Get entity type color
  const getEntityTypeColor = (type: EntityType): string => {
    const colors = {
      [EntityType.COMPONENT]: 'bg-blue-100 text-blue-800 border-blue-200',
      [EntityType.PROCESS]: 'bg-green-100 text-green-800 border-green-200',
      [EntityType.APPLICATION]: 'bg-purple-100 text-purple-800 border-purple-200',
      [EntityType.MATERIAL]: 'bg-orange-100 text-orange-800 border-orange-200',
      [EntityType.PARAMETER]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      [EntityType.SYSTEM]: 'bg-indigo-100 text-indigo-800 border-indigo-200'
    };
    return colors[type] || 'bg-gray-100 text-gray-800 border-gray-200';
  };
  
  // Get relationship type color
  const getRelationshipTypeColor = (type: RelationshipType): string => {
    const colors = {
      [RelationshipType.STRUCTURAL]: 'bg-blue-100 text-blue-800 border-blue-200',
      [RelationshipType.FUNCTIONAL]: 'bg-green-100 text-green-800 border-green-200',
      [RelationshipType.APPLICATION]: 'bg-purple-100 text-purple-800 border-purple-200',
      [RelationshipType.COMPOSITIONAL]: 'bg-orange-100 text-orange-800 border-orange-200',
      [RelationshipType.CAUSAL]: 'bg-red-100 text-red-800 border-red-200',
      [RelationshipType.DEPENDENCY]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      [RelationshipType.QUANTITATIVE]: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      [RelationshipType.COMPARATIVE]: 'bg-pink-100 text-pink-800 border-pink-200',
      [RelationshipType.TEMPORAL]: 'bg-cyan-100 text-cyan-800 border-cyan-200'
    };
    return colors[type] || 'bg-gray-100 text-gray-800 border-gray-200';
  };
  
  // Get stage progress percentage
  const getStageProgress = (statuses: ProcessingStatusType[]): number => {
    if (statuses.length === 0) return 0;
    const totalProgress = statuses.reduce((sum, status) => sum + status.progress, 0);
    return Math.round(totalProgress / statuses.length);
  };

  return (
    <div className="space-y-6">
      {/* Clean Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-lg">
                <Network className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle>Agentic Patent Discovery System</CardTitle>
                <CardDescription>
                  Revolutionary approach to patent analysis and insights • {patents.length} patents loaded
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                disabled={patents.length === 0 || processing}
                onClick={handleStartDiscovery}
                className="gap-2"
              >
                {processing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                {processing ? 'Processing...' : 'Start Discovery'}
              </Button>
              
              {patents.length === 0 && (
                <Button
                  variant="outline"
                  onClick={handleDemoDiscovery}
                  disabled={processing}
                  className="gap-2"
                >
                  <Play className="w-4 h-4" />
                  Try Demo
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Processing Status */}
      {processing && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              <CardTitle className="text-lg">Processing Pipeline Status</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Progress value={getStageProgress(processingStatuses)} className="flex-1" />
              <span className="text-sm font-medium">{getStageProgress(processingStatuses)}%</span>
            </div>
            
            {processingStatuses.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {processingStatuses.map((status) => (
                  <div key={status.patentId} className="p-3 border rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate">
                        Patent {status.patentId.slice(0, 8)}...
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {status.currentStage}
                      </Badge>
                    </div>
                    <Progress value={status.progress} className="h-2" />
                    {status.errors.length > 0 && (
                      <div className="flex items-center gap-1 text-red-600">
                        <AlertCircle className="w-3 h-3" />
                        <span className="text-xs">{status.errors.length} issues</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Discovery Results */}
      {discoveryResults.length > 0 && (
        <div className="space-y-6">
          {/* Results Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Discovery Results</CardTitle>
                  <CardDescription>
                    Successfully analyzed {discoveryResults.length} patents • {
                      discoveryResults.reduce((sum, r) => sum + (r.entities?.entities?.length || 0), 0)
                    } entities • {
                      discoveryResults.reduce((sum, r) => sum + (r.relationships?.relationships?.length || 0), 0)
                    } relationships • Average confidence: {
                      Math.round((discoveryResults.reduce((sum, r) => sum + r.overallConfidence, 0) / discoveryResults.length) * 100)
                    }%
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="gap-2">
                    <Download className="w-4 h-4" />
                    Export
                  </Button>
                  <Button size="sm" variant="outline" className="gap-2">
                    <Eye className="w-4 h-4" />
                    Visualize
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Detailed Results */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Patent List */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Analyzed Patents</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {discoveryResults.map((result, index) => (
                      <div
                        key={result.patent.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedResult?.patent.id === result.patent.id
                            ? 'bg-blue-50 border-blue-200'
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedResult(result)}
                      >
                        <div className="font-medium text-sm mb-1 truncate">
                          {result.patent.title}
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex gap-2">
                            <span>{result.entities?.entities?.length || 0} entities</span>
                            <span>{result.relationships?.relationships?.length || 0} relationships</span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {Math.round(result.overallConfidence * 100)}%
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Analysis Results */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Discovery Analysis</CardTitle>
                {selectedResult && (
                  <CardDescription>
                    {selectedResult.patent.title}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                {selectedResult?.entities ? (
                  <Tabs defaultValue="entities" className="w-full">
                    <TabsList className="grid w-full grid-cols-7 text-xs">
                      <TabsTrigger value="entities">Entities</TabsTrigger>
                      <TabsTrigger value="relationships">Relations</TabsTrigger>
                      <TabsTrigger value="normalization">Normalization</TabsTrigger>
                      <TabsTrigger value="graph">Graph</TabsTrigger>
                      <TabsTrigger value="clusters">Clusters</TabsTrigger>
                      <TabsTrigger value="types">Types</TabsTrigger>
                      <TabsTrigger value="stats">Stats</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="entities" className="space-y-4">
                      <ScrollArea className="h-64">
                        <div className="space-y-2">
                          {selectedResult.entities.entities
                            .sort((a: ExtractedEntity, b: ExtractedEntity) => b.confidence - a.confidence)
                            .map((entity: ExtractedEntity, index: number) => (
                            <div key={index} className="flex items-center justify-between p-2 rounded border">
                              <div className="flex items-center gap-2">
                                <Badge className={getEntityTypeColor(entity.type)}>
                                  {entity.type}
                                </Badge>
                                <span className="font-medium">{entity.text}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">{entity.source}</span>
                                <Badge variant="outline" className="text-xs">
                                  {Math.round(entity.confidence * 100)}%
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </TabsContent>
                    
                    <TabsContent value="relationships" className="space-y-4">
                      {selectedResult.relationships ? (
                        <ScrollArea className="h-64">
                          <div className="space-y-3">
                            {selectedResult.relationships.relationships
                              .sort((a: ExtractedRelationship, b: ExtractedRelationship) => b.confidence - a.confidence)
                              .map((rel: ExtractedRelationship, index: number) => (
                              <div key={index} className="p-3 border rounded space-y-2">
                                <div className="flex items-center justify-between">
                                  <Badge className={getRelationshipTypeColor(rel.type)}>
                                    {rel.type}
                                  </Badge>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500">{rel.source}</span>
                                    <Badge variant="outline" className="text-xs">
                                      {Math.round(rel.confidence * 100)}%
                                    </Badge>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <Badge variant="outline" className="text-xs">
                                    {rel.subject.text}
                                  </Badge>
                                  <span className="text-gray-500 italic">{rel.predicate}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {rel.object.text}
                                  </Badge>
                                </div>
                                <div className="text-xs text-gray-600 italic">
                                  "{rel.context}"
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          No relationship data available
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="normalization" className="space-y-4">
                      {selectedResult.normalization ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-3 gap-4 text-center">
                            <div className="p-3 bg-blue-50 rounded-lg border">
                              <div className="text-2xl font-bold text-blue-600">
                                {selectedResult.normalization.ontologyMatches}
                              </div>
                              <div className="text-sm text-blue-800">Ontology Matches</div>
                            </div>
                            <div className="p-3 bg-green-50 rounded-lg border">
                              <div className="text-2xl font-bold text-green-600">
                                {selectedResult.normalization.embeddingMatches}
                              </div>
                              <div className="text-sm text-green-800">Embedding Matches</div>
                            </div>
                            <div className="p-3 bg-orange-50 rounded-lg border">
                              <div className="text-2xl font-bold text-orange-600">
                                {selectedResult.normalization.llmTiebreaks}
                              </div>
                              <div className="text-sm text-orange-800">LLM Tiebreaks</div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <h4 className="font-medium text-sm text-gray-700">Entity Normalizations</h4>
                              <ScrollArea className="h-48">
                                <div className="space-y-2">
                                  {selectedResult.normalization.normalizedEntities.map((norm: NormalizedTerm, index: number) => (
                                    <div key={index} className="p-2 border rounded-lg space-y-1">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <span className="font-medium text-sm">{norm.originalTerm}</span>
                                          <span className="text-gray-400">→</span>
                                          <span className="font-medium text-sm text-blue-600">{norm.normalizedTerm}</span>
                                        </div>
                                        <Badge variant="outline" className="text-xs">
                                          {Math.round(norm.confidence * 100)}%
                                        </Badge>
                                      </div>
                                      <div className="flex items-center justify-between text-xs">
                                        <span className="text-gray-500">{norm.source}</span>
                                        {norm.synonyms && norm.synonyms.length > 0 && (
                                          <span className="text-gray-400">
                                            +{norm.synonyms.length} synonyms
                                          </span>
                                        )}
                                      </div>
                                      {norm.hierarchicalParent && (
                                        <div className="text-xs text-purple-600">
                                          Parent: {norm.hierarchicalParent}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </ScrollArea>
                            </div>
                            
                            <div className="space-y-2">
                              <h4 className="font-medium text-sm text-gray-700">Relationship Normalizations</h4>
                              <ScrollArea className="h-48">
                                <div className="space-y-2">
                                  {selectedResult.normalization.normalizedRelationships.map((norm: NormalizedTerm, index: number) => (
                                    <div key={index} className="p-2 border rounded-lg space-y-1">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <span className="font-medium text-sm">{norm.originalTerm}</span>
                                          <span className="text-gray-400">→</span>
                                          <span className="font-medium text-sm text-green-600">{norm.normalizedTerm}</span>
                                        </div>
                                        <Badge variant="outline" className="text-xs">
                                          {Math.round(norm.confidence * 100)}%
                                        </Badge>
                                      </div>
                                      <div className="flex items-center justify-between text-xs">
                                        <span className="text-gray-500">{norm.source}</span>
                                        {norm.synonyms && norm.synonyms.length > 0 && (
                                          <span className="text-gray-400">
                                            +{norm.synonyms.length} synonyms
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </ScrollArea>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          No normalization data available
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="graph" className="space-y-4">
                      {selectedResult.graphBuilder ? (
                        <div className="space-y-4">
                          {/* Graph Statistics Overview */}
                          <div className="grid grid-cols-4 gap-4">
                            <div className="p-3 bg-blue-50 rounded-lg border text-center">
                              <div className="text-2xl font-bold text-blue-600">
                                {selectedResult.graphBuilder.knowledgeGraph.metadata.totalNodes}
                              </div>
                              <div className="text-sm text-blue-800">Nodes</div>
                            </div>
                            <div className="p-3 bg-green-50 rounded-lg border text-center">
                              <div className="text-2xl font-bold text-green-600">
                                {selectedResult.graphBuilder.knowledgeGraph.metadata.totalEdges}
                              </div>
                              <div className="text-sm text-green-800">Edges</div>
                            </div>
                            <div className="p-3 bg-purple-50 rounded-lg border text-center">
                              <div className="text-2xl font-bold text-purple-600">
                                {selectedResult.graphBuilder.constructionStats.connectedComponents}
                              </div>
                              <div className="text-sm text-purple-800">Components</div>
                            </div>
                            <div className="p-3 bg-orange-50 rounded-lg border text-center">
                              <div className="text-2xl font-bold text-orange-600">
                                {Math.round(selectedResult.graphBuilder.knowledgeGraph.metadata.graphDensity * 100)}%
                              </div>
                              <div className="text-sm text-orange-800">Density</div>
                            </div>
                          </div>
                          
                          {/* Graph Structure Details */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <h4 className="font-medium text-sm text-gray-700">Important Nodes</h4>
                              <ScrollArea className="h-48">
                                <div className="space-y-2">
                                  {selectedResult.graphBuilder.nodeImportances.slice(0, 10).map((importance, index) => {
                                    const node = selectedResult.graphBuilder.knowledgeGraph.nodes.find(n => n.id === importance.nodeId);
                                    return (
                                      <div key={index} className="p-2 border rounded-lg space-y-1">
                                        <div className="flex items-center justify-between">
                                          <span className="font-medium text-sm">{node?.label || importance.nodeId}</span>
                                          <Badge variant="outline" className="text-xs">
                                            #{index + 1}
                                          </Badge>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
                                          <div>Degree: {importance.degree}</div>
                                          <div>PageRank: {Math.round(importance.pageRank * 100)}</div>
                                          <div>Score: {Math.round(importance.overallScore * 100)}</div>
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                          <Badge className={getEntityTypeColor(node?.type || EntityType.COMPONENT)}>
                                            {node?.type || 'Unknown'}
                                          </Badge>
                                          {node?.metadata?.mergedNodeCount && node.metadata.mergedNodeCount > 1 && (
                                            <Badge variant="outline" className="text-xs">
                                              Merged: {node.metadata.mergedNodeCount}
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </ScrollArea>
                            </div>
                            
                            <div className="space-y-2">
                              <h4 className="font-medium text-sm text-gray-700">Graph Connections</h4>
                              <ScrollArea className="h-48">
                                <div className="space-y-2">
                                  {selectedResult.graphBuilder.knowledgeGraph.edges.slice(0, 10).map((edge: GraphEdge, index: number) => {
                                    const sourceNode = selectedResult.graphBuilder.knowledgeGraph.nodes.find(n => n.id === edge.sourceId);
                                    const targetNode = selectedResult.graphBuilder.knowledgeGraph.nodes.find(n => n.id === edge.targetId);
                                    return (
                                      <div key={index} className="p-2 border rounded-lg space-y-1">
                                        <div className="flex items-center justify-between">
                                          <Badge className={getRelationshipTypeColor(edge.type)}>
                                            {edge.type}
                                          </Badge>
                                          <Badge variant="outline" className="text-xs">
                                            {Math.round(edge.confidence * 100)}%
                                          </Badge>
                                        </div>
                                        <div className="flex items-center gap-1 text-xs">
                                          <span className="font-medium">{sourceNode?.label}</span>
                                          <span className="text-gray-400">→</span>
                                          <span className="italic text-gray-600">{edge.label}</span>
                                          <span className="text-gray-400">→</span>
                                          <span className="font-medium">{targetNode?.label}</span>
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          Weight: {edge.weight} • Source: {edge.metadata?.source || 'unknown'}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </ScrollArea>
                            </div>
                          </div>
                          
                          {/* Node and Edge Type Distributions */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <h4 className="font-medium text-sm text-gray-700">Node Types</h4>
                              <div className="space-y-1">
                                {Object.entries(selectedResult.graphBuilder.knowledgeGraph.metadata.nodeTypes).map(([type, count]) => (
                                  <div key={type} className="flex justify-between items-center p-2 border rounded">
                                    <span className="text-sm">{type}</span>
                                    <span className="font-bold text-blue-600">{count}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <h4 className="font-medium text-sm text-gray-700">Edge Types</h4>
                              <div className="space-y-1">
                                {Object.entries(selectedResult.graphBuilder.knowledgeGraph.metadata.edgeTypes).map(([type, count]) => (
                                  <div key={type} className="flex justify-between items-center p-2 border rounded">
                                    <span className="text-sm">{type}</span>
                                    <span className="font-bold text-green-600">{count}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          No knowledge graph data available
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="clusters" className="space-y-4">
                      {selectedResult.clustering ? (
                        <div className="space-y-4">
                          {/* Clustering Overview */}
                          <div className="grid grid-cols-4 gap-4">
                            <div className="p-3 bg-blue-50 rounded-lg border text-center">
                              <div className="text-2xl font-bold text-blue-600">
                                {selectedResult.clustering.processingStats.totalClusters}
                              </div>
                              <div className="text-sm text-blue-800">Total Clusters</div>
                            </div>
                            <div className="p-3 bg-green-50 rounded-lg border text-center">
                              <div className="text-2xl font-bold text-green-600">
                                {Math.round(selectedResult.clustering.processingStats.averageClusterSize)}
                              </div>
                              <div className="text-sm text-green-800">Avg Size</div>
                            </div>
                            <div className="p-3 bg-purple-50 rounded-lg border text-center">
                              <div className="text-2xl font-bold text-purple-600">
                                {Math.round(selectedResult.clustering.clusteringMetrics.silhouetteScore * 100)}%
                              </div>
                              <div className="text-sm text-purple-800">Quality Score</div>
                            </div>
                            <div className="p-3 bg-orange-50 rounded-lg border text-center">
                              <div className="text-2xl font-bold text-orange-600">
                                {Math.round(selectedResult.clustering.processingStats.clusterCoverage * 100)}%
                              </div>
                              <div className="text-sm text-orange-800">Coverage</div>
                            </div>
                          </div>
                          
                          {/* Technology Landscape */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <h4 className="font-medium text-sm text-gray-700">Dominant Technology Clusters</h4>
                              <ScrollArea className="h-48">
                                <div className="space-y-2">
                                  {selectedResult.clustering.technologyLandscape.dominantClusters.map((cluster, index) => (
                                    <div key={index} className="p-3 border rounded-lg space-y-2">
                                      <div className="flex items-center justify-between">
                                        <span className="font-medium text-sm">{cluster.name}</span>
                                        <Badge className={`${
                                          cluster.type === ClusterType.STRUCTURAL ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                          cluster.type === ClusterType.FUNCTIONAL ? 'bg-green-100 text-green-800 border-green-200' :
                                          'bg-purple-100 text-purple-800 border-purple-200'
                                        }`}>
                                          {cluster.type}
                                        </Badge>
                                      </div>
                                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                                        <div>Size: {cluster.size} nodes</div>
                                        <div>Coherence: {Math.round(cluster.coherence * 100)}%</div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </ScrollArea>
                            </div>
                            
                            <div className="space-y-2">
                              <h4 className="font-medium text-sm text-gray-700">All Clusters</h4>
                              <ScrollArea className="h-48">
                                <div className="space-y-2">
                                  {selectedResult.clustering.clusters.map((cluster: PatentCluster, index: number) => (
                                    <div key={index} className="p-2 border rounded-lg space-y-1">
                                      <div className="flex items-center justify-between">
                                        <span className="font-medium text-sm">{cluster.name}</span>
                                        <Badge variant="outline" className="text-xs">
                                          {cluster.size} nodes
                                        </Badge>
                                      </div>
                                      <div className="text-xs text-gray-600">
                                        {cluster.description}
                                      </div>
                                      <div className="flex flex-wrap gap-1">
                                        <Badge className={`text-xs ${
                                          cluster.type === ClusterType.STRUCTURAL ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                          cluster.type === ClusterType.FUNCTIONAL ? 'bg-green-100 text-green-700 border-green-200' :
                                          'bg-purple-100 text-purple-700 border-purple-200'
                                        }`}>
                                          {cluster.type}
                                        </Badge>
                                        <Badge variant="outline" className="text-xs">
                                          {Math.round(cluster.coherence * 100)}% coherent
                                        </Badge>
                                      </div>
                                      {cluster.keyProperties.length > 0 && (
                                        <div className="text-xs text-gray-500">
                                          Key: {cluster.keyProperties.slice(0, 3).join(', ')}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </ScrollArea>
                            </div>
                          </div>
                          
                          {/* Technology Domains and Patterns */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <h4 className="font-medium text-sm text-gray-700">Technology Domains</h4>
                              <div className="space-y-1">
                                {Object.entries(selectedResult.clustering.technologyLandscape.technologyDomains).map(([domain, count]) => (
                                  <div key={domain} className="flex justify-between items-center p-2 border rounded">
                                    <span className="text-sm capitalize">{domain}</span>
                                    <span className="font-bold text-blue-600">{count}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <h4 className="font-medium text-sm text-gray-700">Emerging Patterns</h4>
                              <div className="space-y-2">
                                {selectedResult.clustering.technologyLandscape.emergingPatterns.map((pattern, index) => (
                                  <div key={index} className="p-2 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                                    <div className="text-sm text-yellow-800">{pattern}</div>
                                  </div>
                                ))}
                                {selectedResult.clustering.technologyLandscape.emergingPatterns.length === 0 && (
                                  <div className="text-sm text-gray-500 italic">No specific patterns identified</div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          No clustering data available
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="types" className="space-y-4">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm text-gray-700">Entities by Type</h4>
                          <div className="space-y-2">
                            {Object.entries(selectedResult.entities.entityCounts).map(([type, count]) => (
                              <div key={type} className="p-2 border rounded flex justify-between items-center">
                                <div className="text-sm">{type}</div>
                                <div className="font-bold text-blue-600">{count}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                        {selectedResult.relationships && (
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm text-gray-700">Relationships by Type</h4>
                            <div className="space-y-2">
                              {Object.entries(selectedResult.relationships.relationshipCounts).map(([type, count]) => (
                                <div key={type} className="p-2 border rounded flex justify-between items-center">
                                  <div className="text-sm">{type}</div>
                                  <div className="font-bold text-green-600">{count}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="stats" className="space-y-4">
                      {selectedResult.entities.processingStats && (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 border rounded">
                            <div className="text-sm text-gray-600">Dictionary Matches</div>
                            <div className="text-xl font-bold">
                              {selectedResult.entities.processingStats.dictionaryMatches}
                            </div>
                          </div>
                          <div className="p-3 border rounded">
                            <div className="text-sm text-gray-600">POS Tag Matches</div>
                            <div className="text-xl font-bold">
                              {selectedResult.entities.processingStats.posTagMatches}
                            </div>
                          </div>
                          <div className="p-3 border rounded">
                            <div className="text-sm text-gray-600">LLM Extractions</div>
                            <div className="text-xl font-bold">
                              {selectedResult.entities.processingStats.llmExtractions}
                            </div>
                          </div>
                          <div className="p-3 border rounded">
                            <div className="text-sm text-gray-600">Processing Time</div>
                            <div className="text-xl font-bold">
                              {Math.round(selectedResult.processingTime)}ms
                            </div>
                          </div>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Select a patent to view detailed analysis
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Initial State */}
      {!processing && discoveryResults.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="p-4 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full w-24 h-24 mx-auto flex items-center justify-center">
                <Lightbulb className="w-12 h-12 text-purple-600" />
              </div>
              
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-3">
                  Revolutionary Patent Discovery System
                </h2>
                <p className="text-lg text-gray-600 mb-6">
                  Agentic flow system that makes patents truly discoverable through entity-relationship 
                  extraction and knowledge graph construction.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                <div className="p-4 border rounded-lg">
                  <Brain className="w-8 h-8 text-blue-500 mb-3" />
                  <h3 className="font-semibold mb-2">Multi-Agent Pipeline</h3>
                  <p className="text-sm text-gray-600">Preprocessor → Entity Extraction → Relationships → Normalization</p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <Search className="w-8 h-8 text-green-500 mb-3" />
                  <h3 className="font-semibold mb-2">Hybrid NLP+LLM</h3>
                  <p className="text-sm text-gray-600">Classical NLP reliability with LLM intelligence for complex terms</p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <Network className="w-8 h-8 text-purple-500 mb-3" />
                  <h3 className="font-semibold mb-2">Knowledge Graphs</h3>
                  <p className="text-sm text-gray-600">Build semantic networks from patent relationships</p>
                </div>
              </div>

              <div className="pt-4">
                <p className="text-sm text-gray-500">
                  {patents.length > 0 
                    ? `Ready to analyze ${patents.length} patents with revolutionary precision` 
                    : 'Load patents or try the demo to experience the system in action'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}