/**
 * Claim Mapping Visualizer Component
 * Visual tool for mapping prior art evidence to specific patent claims
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Target,
  Map,
  Link,
  Eye,
  EyeOff,
  Layers,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  MoreHorizontal,
  Filter,
  Download,
  Save,
  Maximize2,
  RefreshCw,
  Settings,
  Zap
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';

interface ClaimElement {
  id: string;
  text: string;
  type: 'preamble' | 'body' | 'transitional' | 'limitation';
  essential: boolean;
  keywords: string[];
}

interface Claim {
  id: string;
  number: string;
  type: 'independent' | 'dependent';
  fullText: string;
  elements: ClaimElement[];
  dependsOn?: string;
  priority: 'high' | 'medium' | 'low';
}

interface EvidenceMapping {
  evidenceId: string;
  evidenceTitle: string;
  publicationNumber: string;
  mappedClaims: {
    claimId: string;
    claimNumber: string;
    coverage: number; // 0-100
    mappedElements: string[];
    relevanceScore: number;
    mappingType: 'exact' | 'similar' | 'partial' | 'conceptual';
    notes?: string;
  }[];
  overallCoverage: number;
  strengthScore: number;
}

interface ClaimMappingVisualizerProps {
  projectId: string;
  claims?: Claim[];
  evidence?: any[];
  onMappingUpdate?: (mapping: any) => void;
}

export function ClaimMappingVisualizer({ 
  projectId, 
  claims = [], 
  evidence = [], 
  onMappingUpdate 
}: ClaimMappingVisualizerProps) {
  const [targetClaims, setTargetClaims] = useState<Claim[]>([]);
  const [evidenceMappings, setEvidenceMappings] = useState<EvidenceMapping[]>([]);
  const [selectedClaim, setSelectedClaim] = useState<string | null>(null);
  const [selectedEvidence, setSelectedEvidence] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'claim-focused' | 'evidence-focused' | 'matrix'>('claim-focused');
  const [showAllElements, setShowAllElements] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    initializeMockData();
  }, []);

  const initializeMockData = () => {
    // Mock claims data
    const mockClaims: Claim[] = [
      {
        id: 'claim-1',
        number: '1',
        type: 'independent',
        fullText: 'A machine learning system comprising: a neural network processor configured to process input data; a training module configured to train the neural network using supervised learning; and an output interface configured to provide processed results.',
        elements: [
          {
            id: 'c1-e1',
            text: 'machine learning system',
            type: 'preamble',
            essential: true,
            keywords: ['machine learning', 'ML system']
          },
          {
            id: 'c1-e2',
            text: 'neural network processor configured to process input data',
            type: 'limitation',
            essential: true,
            keywords: ['neural network', 'processor', 'input data']
          },
          {
            id: 'c1-e3',
            text: 'training module configured to train the neural network using supervised learning',
            type: 'limitation',
            essential: true,
            keywords: ['training', 'supervised learning']
          },
          {
            id: 'c1-e4',
            text: 'output interface configured to provide processed results',
            type: 'limitation',
            essential: false,
            keywords: ['output interface', 'results']
          }
        ],
        priority: 'high'
      },
      {
        id: 'claim-2',
        number: '2',
        type: 'dependent',
        fullText: 'The system of claim 1, wherein the neural network processor includes multiple processing layers with adaptive weights.',
        elements: [
          {
            id: 'c2-e1',
            text: 'multiple processing layers',
            type: 'limitation',
            essential: true,
            keywords: ['layers', 'processing']
          },
          {
            id: 'c2-e2',
            text: 'adaptive weights',
            type: 'limitation',
            essential: true,
            keywords: ['weights', 'adaptive']
          }
        ],
        dependsOn: 'claim-1',
        priority: 'medium'
      },
      {
        id: 'claim-3',
        number: '3',
        type: 'dependent',
        fullText: 'The system of claim 1, wherein the training module implements reinforcement learning algorithms.',
        elements: [
          {
            id: 'c3-e1',
            text: 'reinforcement learning algorithms',
            type: 'limitation',
            essential: true,
            keywords: ['reinforcement learning', 'algorithms']
          }
        ],
        dependsOn: 'claim-1',
        priority: 'low'
      }
    ];

    // Mock evidence mappings
    const mockMappings: EvidenceMapping[] = [
      {
        evidenceId: 'ev-1',
        evidenceTitle: 'Neural Network Architecture for Real-Time Processing',
        publicationNumber: 'US10,123,456',
        mappedClaims: [
          {
            claimId: 'claim-1',
            claimNumber: '1',
            coverage: 85,
            mappedElements: ['c1-e1', 'c1-e2', 'c1-e3'],
            relevanceScore: 92,
            mappingType: 'exact',
            notes: 'Strong anticipation of core claim elements'
          },
          {
            claimId: 'claim-2',
            claimNumber: '2',
            coverage: 75,
            mappedElements: ['c2-e1', 'c2-e2'],
            relevanceScore: 88,
            mappingType: 'similar',
            notes: 'Similar implementation with minor differences'
          }
        ],
        overallCoverage: 80,
        strengthScore: 90
      },
      {
        evidenceId: 'ev-2',
        evidenceTitle: 'Machine Learning System with Adaptive Preprocessing',
        publicationNumber: 'EP3456789',
        mappedClaims: [
          {
            claimId: 'claim-1',
            claimNumber: '1',
            coverage: 65,
            mappedElements: ['c1-e1', 'c1-e3'],
            relevanceScore: 75,
            mappingType: 'partial',
            notes: 'Covers training aspects but different processor architecture'
          },
          {
            claimId: 'claim-3',
            claimNumber: '3',
            coverage: 45,
            mappedElements: ['c3-e1'],
            relevanceScore: 60,
            mappingType: 'conceptual',
            notes: 'Different learning approach but same general concept'
          }
        ],
        overallCoverage: 55,
        strengthScore: 68
      }
    ];

    setTargetClaims(mockClaims);
    setEvidenceMappings(mockMappings);
    setSelectedClaim('claim-1');
  };

  const getMappingTypeColor = (type: string) => {
    switch (type) {
      case 'exact': return 'bg-green-100 text-green-800 border-green-200';
      case 'similar': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'partial': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'conceptual': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getMappingTypeIcon = (type: string) => {
    switch (type) {
      case 'exact': return <CheckCircle className="h-3 w-3" />;
      case 'similar': return <Target className="h-3 w-3" />;
      case 'partial': return <AlertCircle className="h-3 w-3" />;
      case 'conceptual': return <Eye className="h-3 w-3" />;
      default: return <MoreHorizontal className="h-3 w-3" />;
    }
  };

  const getCoverageColor = (coverage: number) => {
    if (coverage >= 80) return 'text-green-600';
    if (coverage >= 60) return 'text-blue-600';
    if (coverage >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getClaimsByEvidence = (evidenceId: string) => {
    const mapping = evidenceMappings.find(m => m.evidenceId === evidenceId);
    return mapping ? mapping.mappedClaims : [];
  };

  const getEvidenceForClaim = (claimId: string) => {
    return evidenceMappings.filter(mapping => 
      mapping.mappedClaims.some(mc => mc.claimId === claimId)
    ).map(mapping => ({
      ...mapping,
      claimMapping: mapping.mappedClaims.find(mc => mc.claimId === claimId)!
    }));
  };

  const runAutoMapping = async () => {
    setIsAnalyzing(true);
    
    // Simulate auto-mapping analysis
    setTimeout(() => {
      setIsAnalyzing(false);
      // Mock: Add additional mappings or update existing ones
      if (onMappingUpdate) {
        onMappingUpdate({
          totalMappings: evidenceMappings.length,
          averageCoverage: evidenceMappings.reduce((sum, m) => sum + m.overallCoverage, 0) / evidenceMappings.length,
          strongMappings: evidenceMappings.filter(m => m.strengthScore >= 80).length
        });
      }
    }, 2000);
  };

  const selectedClaimData = selectedClaim ? targetClaims.find(c => c.id === selectedClaim) : null;
  const selectedEvidenceData = selectedEvidence ? evidenceMappings.find(e => e.evidenceId === selectedEvidence) : null;

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Map className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Claim Mapping Visualizer</h3>
            <p className="text-sm text-muted-foreground">
              Visual mapping of prior art evidence to patent claims and elements
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={runAutoMapping} disabled={isAnalyzing}>
            {isAnalyzing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Auto-Map
              </>
            )}
          </Button>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Configure
          </Button>
        </div>
      </div>

      {/* View Mode Selection */}
      <div className="flex items-center gap-4">
        <Select value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="claim-focused">Claim-Focused View</SelectItem>
            <SelectItem value="evidence-focused">Evidence-Focused View</SelectItem>
            <SelectItem value="matrix">Matrix View</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Checkbox 
            id="show-all"
            checked={showAllElements}
            onCheckedChange={(checked) => setShowAllElements(checked === true)}
          />
          <label htmlFor="show-all" className="text-sm">Show all elements</label>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'claim-focused' && (
          <div className="grid gap-6 md:grid-cols-3 h-full">
            {/* Claims List */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Target Claims</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-96">
                  <div className="p-4 space-y-3">
                    {targetClaims.map((claim) => (
                      <div
                        key={claim.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedClaim === claim.id ? 'border-blue-200 bg-blue-50' : 'hover:bg-muted'
                        }`}
                        onClick={() => setSelectedClaim(claim.id)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">Claim {claim.number}</Badge>
                            <Badge variant={claim.type === 'independent' ? 'default' : 'secondary'}>
                              {claim.type}
                            </Badge>
                          </div>
                          <Badge variant="outline" className={`${claim.priority === 'high' ? 'border-red-200 text-red-700' : claim.priority === 'medium' ? 'border-yellow-200 text-yellow-700' : 'border-gray-200'}`}>
                            {claim.priority}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-3">
                          {claim.fullText}
                        </p>
                        <div className="mt-2 flex items-center justify-between text-xs">
                          <span>{claim.elements.length} elements</span>
                          <span>{getEvidenceForClaim(claim.id).length} evidence items</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Selected Claim Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {selectedClaimData ? `Claim ${selectedClaimData.number} Details` : 'Select a Claim'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedClaimData ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium mb-2">Full Text:</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {selectedClaimData.fullText}
                      </p>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <p className="text-sm font-medium mb-3">Claim Elements:</p>
                      <div className="space-y-2">
                        {selectedClaimData.elements.map((element) => (
                          <div key={element.id} className="p-2 border rounded">
                            <div className="flex items-center justify-between mb-1">
                              <Badge variant="outline" className="text-xs">
                                {element.type}
                              </Badge>
                              {element.essential && (
                                <Badge variant="secondary" className="text-xs">
                                  Essential
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm">{element.text}</p>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {element.keywords.map((keyword, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {keyword}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground">
                    <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p>Select a claim to view its details and mappings</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Evidence Mappings for Selected Claim */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Evidence Mappings</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedClaimData ? (
                  <ScrollArea className="h-96">
                    <div className="space-y-4">
                      {getEvidenceForClaim(selectedClaimData.id).map((evidenceData) => (
                        <div key={evidenceData.evidenceId} className="p-3 border rounded">
                          <div className="space-y-3">
                            <div>
                              <h4 className="font-medium text-sm">{evidenceData.evidenceTitle}</h4>
                              <p className="text-xs text-muted-foreground">{evidenceData.publicationNumber}</p>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {getMappingTypeIcon(evidenceData.claimMapping.mappingType)}
                                <Badge className={`text-xs ${getMappingTypeColor(evidenceData.claimMapping.mappingType)}`}>
                                  {evidenceData.claimMapping.mappingType}
                                </Badge>
                              </div>
                              <span className={`text-sm font-medium ${getCoverageColor(evidenceData.claimMapping.coverage)}`}>
                                {evidenceData.claimMapping.coverage}%
                              </span>
                            </div>
                            
                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span>Element Coverage</span>
                                <span>{evidenceData.claimMapping.mappedElements.length}/{selectedClaimData.elements.length}</span>
                              </div>
                              <Progress value={(evidenceData.claimMapping.mappedElements.length / selectedClaimData.elements.length) * 100} className="h-1" />
                            </div>
                            
                            {evidenceData.claimMapping.notes && (
                              <p className="text-xs text-muted-foreground italic">
                                {evidenceData.claimMapping.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                      
                      {getEvidenceForClaim(selectedClaimData.id).length === 0 && (
                        <div className="text-center text-muted-foreground py-8">
                          <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                          <p className="text-sm">No evidence mapped to this claim</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <Link className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p>Select a claim to view evidence mappings</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {viewMode === 'evidence-focused' && (
          <div className="space-y-6">
            <div className="grid gap-6">
              {evidenceMappings.map((evidence) => (
                <Card key={evidence.evidenceId}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">{evidence.evidenceTitle}</CardTitle>
                        <CardDescription>{evidence.publicationNumber}</CardDescription>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={getCoverageColor(evidence.overallCoverage)}>
                          {evidence.overallCoverage}% Coverage
                        </Badge>
                        <Badge variant="outline">
                          Strength: {evidence.strengthScore}%
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {evidence.mappedClaims.map((claimMapping) => (
                        <div key={claimMapping.claimId} className="p-3 border rounded">
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="outline">Claim {claimMapping.claimNumber}</Badge>
                            <Badge className={`text-xs ${getMappingTypeColor(claimMapping.mappingType)}`}>
                              {claimMapping.mappingType}
                            </Badge>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Coverage:</span>
                              <span className={getCoverageColor(claimMapping.coverage)}>
                                {claimMapping.coverage}%
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Relevance:</span>
                              <span>{claimMapping.relevanceScore}%</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Elements:</span>
                              <span>{claimMapping.mappedElements.length}</span>
                            </div>
                            {claimMapping.notes && (
                              <p className="text-xs text-muted-foreground italic">
                                {claimMapping.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {viewMode === 'matrix' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Claim-Evidence Matrix</CardTitle>
              <CardDescription>
                Comprehensive view of all claim-evidence relationships
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Evidence</th>
                      {targetClaims.map((claim) => (
                        <th key={claim.id} className="text-center p-2 min-w-24">
                          Claim {claim.number}
                        </th>
                      ))}
                      <th className="text-center p-2">Overall</th>
                    </tr>
                  </thead>
                  <tbody>
                    {evidenceMappings.map((evidence) => (
                      <tr key={evidence.evidenceId} className="border-b hover:bg-muted/50">
                        <td className="p-2">
                          <div>
                            <p className="font-medium text-xs">{evidence.evidenceTitle}</p>
                            <p className="text-xs text-muted-foreground">{evidence.publicationNumber}</p>
                          </div>
                        </td>
                        {targetClaims.map((claim) => {
                          const mapping = evidence.mappedClaims.find(mc => mc.claimId === claim.id);
                          return (
                            <td key={claim.id} className="text-center p-2">
                              {mapping ? (
                                <div className="space-y-1">
                                  <Badge className={`text-xs ${getMappingTypeColor(mapping.mappingType)}`}>
                                    {mapping.coverage}%
                                  </Badge>
                                  <div className="text-xs text-muted-foreground">
                                    {mapping.mappingType}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="text-center p-2">
                          <Badge className={getCoverageColor(evidence.overallCoverage)}>
                            {evidence.overallCoverage}%
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}