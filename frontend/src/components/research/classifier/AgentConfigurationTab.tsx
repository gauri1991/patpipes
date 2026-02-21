/**
 * Agent Configuration Tab - Configure processing agents and parameters
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, Zap, Brain, Network, Layers, BarChart3, 
  Info, Save, Play, AlertCircle, Sparkles
} from 'lucide-react';
import { agenticApi, AgentConfig } from '@/services/agenticApi';

interface AgentConfigurationTabProps {
  selectedDatasetIds: string[];
  onConfigurationComplete: (config: AgentConfig) => void;
}

export function AgentConfigurationTab({ 
  selectedDatasetIds, 
  onConfigurationComplete 
}: AgentConfigurationTabProps) {
  const [processingProfile, setProcessingProfile] = useState<string>('standard');
  const [inputSource, setInputSource] = useState<string>('independent_claims');
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.7);
  const [presets, setPresets] = useState<any>({});
  const [customConfig, setCustomConfig] = useState<Record<string, any>>({
    entity_extraction: {
      min_confidence: 0.7,
      entity_types: ['component', 'process', 'material', 'application', 'system'],
      extraction_methods: ['hybrid'],
      use_context: true
    },
    relationship_extraction: {
      relationship_types: ['comprises', 'includes', 'configured_to', 'operates_with', 'controls'],
      confidence_threshold: 0.7,
      max_depth: 2,
      use_dependency_parsing: true
    },
    normalization: {
      similarity_threshold: 0.85,
      use_embeddings: true,
      use_ontology: true,
      preferred_form: 'technical'
    },
    graph_builder: {
      node_importance_algorithm: 'pagerank',
      edge_weight_calculation: 'confidence',
      min_edge_weight: 0.5
    },
    clustering: {
      num_clusters: 'auto',
      algorithm: 'hierarchical',
      dimensions: ['structural', 'functional', 'application']
    }
  });

  useEffect(() => {
    loadPresets();
  }, []);

  const loadPresets = async () => {
    try {
      const data = await agenticApi.getConfigPresets();
      setPresets(data);
    } catch (error) {
      console.error('Failed to load presets:', error);
    }
  };

  const applyPreset = (presetKey: string) => {
    if (presets[presetKey]) {
      const preset = presets[presetKey];
      setProcessingProfile(preset.processing_profile);
      setInputSource(preset.input_source);
      setConfidenceThreshold(preset.confidence_threshold);
      if (preset.config_params) {
        setCustomConfig(prev => ({ ...prev, ...preset.config_params }));
      }
    }
  };

  const handleStartProcessing = async () => {
    const config: AgentConfig = {
      name: `Config ${new Date().toISOString()}`,
      description: `Processing ${selectedDatasetIds.length} dataset(s)`,
      agent_type: 'entity_extraction',
      input_source: inputSource as any,
      processing_profile: processingProfile as any,
      config_params: customConfig,
      confidence_threshold: confidenceThreshold,
      is_active: true
    };

    onConfigurationComplete(config);
  };

  const updateAgentConfig = (agent: string, key: string, value: any) => {
    setCustomConfig(prev => ({
      ...prev,
      [agent]: {
        ...(prev[agent] || {}),
        [key]: value
      }
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold">Agent Configuration</h3>
        <p className="text-sm text-muted-foreground">
          Configure how the agentic pipeline will process your patents
        </p>
      </div>

      {/* Quick Presets */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Quick Presets
          </CardTitle>
          <CardDescription>
            Choose a preset configuration or customize your own
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <Button
              variant={processingProfile === 'quick' ? 'default' : 'outline'}
              onClick={() => applyPreset('quick')}
              className="h-auto flex-col py-4"
            >
              <Zap className="h-5 w-5 mb-2" />
              <span className="font-medium">Quick Scan</span>
              <span className="text-xs text-muted-foreground">Fast, surface-level</span>
            </Button>
            <Button
              variant={processingProfile === 'deep' ? 'default' : 'outline'}
              onClick={() => applyPreset('deep')}
              className="h-auto flex-col py-4"
            >
              <Brain className="h-5 w-5 mb-2" />
              <span className="font-medium">Deep Analysis</span>
              <span className="text-xs text-muted-foreground">Comprehensive</span>
            </Button>
            <Button
              variant={processingProfile === 'legal' ? 'default' : 'outline'}
              onClick={() => applyPreset('legal')}
              className="h-auto flex-col py-4"
            >
              <Settings className="h-5 w-5 mb-2" />
              <span className="font-medium">Legal Focus</span>
              <span className="text-xs text-muted-foreground">Claims-centric</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Global Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Global Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="input-source">Input Source</Label>
              <Select value={inputSource} onValueChange={setInputSource}>
                <SelectTrigger id="input-source">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="independent_claims">Independent Claims Only</SelectItem>
                  <SelectItem value="all_claims">All Claims Only</SelectItem>
                  <SelectItem value="abstract">Abstract Only</SelectItem>
                  <SelectItem value="independent_claims_abstract">Independent Claims & Abstract</SelectItem>
                  <SelectItem value="all_claims_abstract">All Claims & Abstract</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Which patent sections to analyze
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confidence">
                Confidence Threshold: {confidenceThreshold.toFixed(2)}
              </Label>
              <Slider
                id="confidence"
                min={0.5}
                max={1}
                step={0.05}
                value={[confidenceThreshold]}
                onValueChange={([value]) => setConfidenceThreshold(value)}
              />
              <p className="text-xs text-muted-foreground">
                Minimum confidence for extractions
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agent-Specific Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Agent-Specific Configuration</CardTitle>
          <CardDescription>
            Fine-tune individual agents in the processing pipeline
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="entity" className="space-y-4">
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="entity">Entity</TabsTrigger>
              <TabsTrigger value="relationship">Relations</TabsTrigger>
              <TabsTrigger value="normalization">Normalize</TabsTrigger>
              <TabsTrigger value="graph">Graph</TabsTrigger>
              <TabsTrigger value="clustering">Cluster</TabsTrigger>
            </TabsList>

            <TabsContent value="entity" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label>Entity Types to Extract</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {['component', 'process', 'material', 'application', 'system', 'method'].map(type => (
                      <div key={type} className="flex items-center space-x-2">
                        <Switch
                          checked={customConfig.entity_extraction?.entity_types?.includes(type) || false}
                          onCheckedChange={(checked) => {
                            const currentTypes = customConfig.entity_extraction?.entity_types || [];
                            const types = checked 
                              ? [...currentTypes, type]
                              : currentTypes.filter((t: string) => t !== type);
                            updateAgentConfig('entity_extraction', 'entity_types', types);
                          }}
                        />
                        <Label className="text-sm capitalize">{type}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Extraction Method</Label>
                  <Select 
                    value={customConfig.entity_extraction?.extraction_method || 'both'}
                    onValueChange={(value) => 
                      updateAgentConfig('entity_extraction', 'extraction_method', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="both">Both Methods (NER + Pattern)</SelectItem>
                      <SelectItem value="ner">Named Entity Recognition Only</SelectItem>
                      <SelectItem value="pattern">Pattern Matching Only</SelectItem>
                      <SelectItem value="claude_api">Claude API</SelectItem>
                      <SelectItem value="openai_api">OpenAI API</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Choose the extraction method for entity detection
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={customConfig.entity_extraction?.use_context || false}
                    onCheckedChange={(checked) => 
                      updateAgentConfig('entity_extraction', 'use_context', checked)
                    }
                  />
                  <Label>Use contextual analysis</Label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="relationship" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label>Relationship Types</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {['comprises', 'includes', 'configured_to', 'operates_with', 'controls', 'generates'].map(rel => (
                      <div key={rel} className="flex items-center space-x-2">
                        <Switch
                          checked={customConfig.relationship_extraction?.relationship_types?.includes(rel) || false}
                          onCheckedChange={(checked) => {
                            const currentTypes = customConfig.relationship_extraction?.relationship_types || [];
                            const types = checked 
                              ? [...currentTypes, rel]
                              : currentTypes.filter((r: string) => r !== rel);
                            updateAgentConfig('relationship_extraction', 'relationship_types', types);
                          }}
                        />
                        <Label className="text-sm">{rel.replace('_', ' ')}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Extraction Method</Label>
                  <Select 
                    value={customConfig.relationship_extraction?.extraction_method || 'both'}
                    onValueChange={(value) => 
                      updateAgentConfig('relationship_extraction', 'extraction_method', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="both">Both Methods (Dependency + Pattern)</SelectItem>
                      <SelectItem value="dependency_parsing">Dependency Parsing Only</SelectItem>
                      <SelectItem value="pattern_matching">Pattern Matching Only</SelectItem>
                      <SelectItem value="claude_api">Claude API</SelectItem>
                      <SelectItem value="openai_api">OpenAI API</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Choose the extraction method for relationship analysis
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Max Relationship Depth: {customConfig.relationship_extraction?.max_depth || 2}</Label>
                  <Slider
                    min={1}
                    max={5}
                    step={1}
                    value={[customConfig.relationship_extraction?.max_depth || 2]}
                    onValueChange={([value]) => 
                      updateAgentConfig('relationship_extraction', 'max_depth', value)
                    }
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="normalization" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>
                    Similarity Threshold: {customConfig.normalization?.similarity_threshold || 0.85}
                  </Label>
                  <Slider
                    min={0.7}
                    max={0.95}
                    step={0.05}
                    value={[customConfig.normalization?.similarity_threshold || 0.85]}
                    onValueChange={([value]) => 
                      updateAgentConfig('normalization', 'similarity_threshold', value)
                    }
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={customConfig.normalization?.use_embeddings || false}
                    onCheckedChange={(checked) => 
                      updateAgentConfig('normalization', 'use_embeddings', checked)
                    }
                  />
                  <Label>Use semantic embeddings</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={customConfig.normalization?.use_ontology || false}
                    onCheckedChange={(checked) => 
                      updateAgentConfig('normalization', 'use_ontology', checked)
                    }
                  />
                  <Label>Use domain ontology</Label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="graph" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Node Importance Algorithm</Label>
                  <Select 
                    value={customConfig.graph_builder?.node_importance_algorithm || 'pagerank'}
                    onValueChange={(value) => 
                      updateAgentConfig('graph_builder', 'node_importance_algorithm', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pagerank">PageRank</SelectItem>
                      <SelectItem value="centrality">Centrality</SelectItem>
                      <SelectItem value="degree">Degree</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>
                    Min Edge Weight: {customConfig.graph_builder?.min_edge_weight || 0.5}
                  </Label>
                  <Slider
                    min={0.3}
                    max={0.9}
                    step={0.1}
                    value={[customConfig.graph_builder?.min_edge_weight || 0.5]}
                    onValueChange={([value]) => 
                      updateAgentConfig('graph_builder', 'min_edge_weight', value)
                    }
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="clustering" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Clustering Algorithm</Label>
                  <Select 
                    value={customConfig.clustering?.algorithm || 'hierarchical'}
                    onValueChange={(value) => 
                      updateAgentConfig('clustering', 'algorithm', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hierarchical">Hierarchical</SelectItem>
                      <SelectItem value="kmeans">K-Means</SelectItem>
                      <SelectItem value="dbscan">DBSCAN</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Clustering Dimensions</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {['structural', 'functional', 'application', 'temporal'].map(dim => (
                      <div key={dim} className="flex items-center space-x-2">
                        <Switch
                          checked={customConfig.clustering?.dimensions?.includes(dim) || false}
                          onCheckedChange={(checked) => {
                            const currentDims = customConfig.clustering?.dimensions || [];
                            const dims = checked 
                              ? [...currentDims, dim]
                              : currentDims.filter((d: string) => d !== dim);
                            updateAgentConfig('clustering', 'dimensions', dims);
                          }}
                        />
                        <Label className="text-sm capitalize">{dim}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Configuration Summary */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-base">Configuration Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Processing Profile:</span>
              <Badge>{processingProfile}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Input Source:</span>
              <span className="font-medium">{inputSource}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Confidence Threshold:</span>
              <span className="font-medium">{(confidenceThreshold * 100).toFixed(0)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Datasets to Process:</span>
              <span className="font-medium">{selectedDatasetIds.length}</span>
            </div>
          </div>

          <Button 
            onClick={handleStartProcessing}
            className="w-full mt-6"
            size="lg"
          >
            <Play className="mr-2 h-4 w-4" />
            Start Processing Pipeline
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}