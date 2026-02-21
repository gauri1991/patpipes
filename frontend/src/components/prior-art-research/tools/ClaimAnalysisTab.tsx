/**
 * Claim Analysis Tab Component
 * Core tool for analyzing target patent claims in prior art research
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Target,
  Upload,
  FileText,
  Sparkles,
  Check,
  AlertCircle,
  Copy,
  Download,
  Edit3,
  Layers,
  Key,
  Zap,
  ChevronRight,
  ChevronDown,
  Plus,
  X
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

import { PriorArtProject } from '@/types/prior-art.types';

interface ClaimElement {
  id: string;
  text: string;
  type: 'preamble' | 'body' | 'transitional' | 'limitation';
  isEssential: boolean;
  searchTerms: string[];
  selected: boolean;
  notes?: string;
}

interface AnalyzedClaim {
  id: string;
  number: string;
  fullText: string;
  elements: ClaimElement[];
  claimType: 'independent' | 'dependent';
  dependsOn?: string;
  technicalField: string;
  keyFeatures: string[];
  searchPriority: 'high' | 'medium' | 'low';
  analysisComplete: boolean;
}

interface ClaimAnalysisTabProps {
  project: PriorArtProject;
  onProgressUpdate?: (progress: number) => void;
  onDataUpdate?: (data: any) => void;
}

export function ClaimAnalysisTab({ project, onProgressUpdate, onDataUpdate }: ClaimAnalysisTabProps) {
  const [patentInput, setPatentInput] = useState('');
  const [analyzedClaims, setAnalyzedClaims] = useState<AnalyzedClaim[]>([]);
  const [selectedClaimIds, setSelectedClaimIds] = useState<Set<string>>(new Set());
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeView, setActiveView] = useState<'input' | 'analysis'>('input');
  const [expandedClaims, setExpandedClaims] = useState<Set<string>>(new Set());

  // Create stable callback references
  const stableProgressUpdate = useCallback((progress: number) => {
    onProgressUpdate?.(progress);
  }, [onProgressUpdate]);

  const stableDataUpdate = useCallback((data: any) => {
    onDataUpdate?.(data);
  }, [onDataUpdate]);

  // Initialize with project target patent if available
  useEffect(() => {
    if (project.target_patent && typeof project.target_patent !== 'string') {
      if (project.target_patent.claims && project.target_patent.claims.length > 0) {
        setPatentInput(project.target_patent.claims.join('\n\n'));
      }
    }
  }, [project]);

  // Calculate progress based on analysis completion
  useEffect(() => {
    const totalClaims = analyzedClaims.length;
    const analyzedCount = analyzedClaims.filter(claim => claim.analysisComplete).length;
    const progress = totalClaims > 0 ? Math.round((analyzedCount / totalClaims) * 100) : 0;
    
    stableProgressUpdate(progress);
    stableDataUpdate({
      claims: analyzedClaims,
      selectedClaims: Array.from(selectedClaimIds),
      targetPatent: project.target_patent
    });
  }, [analyzedClaims, selectedClaimIds, stableProgressUpdate, stableDataUpdate]);

  const handleAnalyzeClaims = async () => {
    if (!patentInput.trim()) return;
    
    setIsAnalyzing(true);
    setActiveView('analysis');

    // Simulate claim analysis
    setTimeout(() => {
      const claimTexts = patentInput.split(/\n\s*\n/).filter(text => text.trim());
      const mockAnalyzedClaims: AnalyzedClaim[] = claimTexts.map((claimText, index) => {
        const claimNumber = (index + 1).toString();
        const isIndependent = !claimText.toLowerCase().includes('claim ');
        
        return {
          id: `claim-${claimNumber}`,
          number: claimNumber,
          fullText: claimText.trim(),
          claimType: isIndependent ? 'independent' : 'dependent',
          dependsOn: isIndependent ? undefined : '1',
          technicalField: 'Software/AI',
          keyFeatures: extractKeyFeatures(claimText),
          elements: parseClaimElements(claimText, claimNumber),
          searchPriority: index < 3 ? 'high' : 'medium',
          analysisComplete: true
        };
      });

      setAnalyzedClaims(mockAnalyzedClaims);
      setSelectedClaimIds(new Set(mockAnalyzedClaims.slice(0, 3).map(c => c.id)));
      setExpandedClaims(new Set(mockAnalyzedClaims.slice(0, 2).map(c => c.id)));
      setIsAnalyzing(false);
    }, 2000);
  };

  const extractKeyFeatures = (claimText: string): string[] => {
    // Mock key feature extraction
    const features = [];
    if (claimText.toLowerCase().includes('neural network')) features.push('neural network');
    if (claimText.toLowerCase().includes('machine learning')) features.push('machine learning');
    if (claimText.toLowerCase().includes('processing')) features.push('data processing');
    if (claimText.toLowerCase().includes('method')) features.push('computational method');
    return features.length > 0 ? features : ['technical feature', 'processing method'];
  };

  const parseClaimElements = (claimText: string, claimNumber: string): ClaimElement[] => {
    // Mock claim element parsing
    const sentences = claimText.split(/[.;]/).filter(s => s.trim());
    return sentences.map((sentence, index) => ({
      id: `${claimNumber}-element-${index}`,
      text: sentence.trim(),
      type: index === 0 ? 'preamble' : 'limitation',
      isEssential: index < 2,
      searchTerms: extractSearchTerms(sentence),
      selected: true,
      notes: ''
    }));
  };

  const extractSearchTerms = (text: string): string[] => {
    // Mock search term extraction
    const terms = [];
    const words = text.toLowerCase().split(/\s+/);
    for (const word of words) {
      if (word.length > 4 && !['method', 'system', 'apparatus', 'device'].includes(word)) {
        terms.push(word);
      }
    }
    return terms.slice(0, 3);
  };

  const toggleClaimSelection = (claimId: string) => {
    setSelectedClaimIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(claimId)) {
        newSet.delete(claimId);
      } else {
        newSet.add(claimId);
      }
      return newSet;
    });
  };

  const toggleClaimExpansion = (claimId: string) => {
    setExpandedClaims(prev => {
      const newSet = new Set(prev);
      if (newSet.has(claimId)) {
        newSet.delete(claimId);
      } else {
        newSet.add(claimId);
      }
      return newSet;
    });
  };

  const updateClaimElement = (claimId: string, elementId: string, updates: Partial<ClaimElement>) => {
    setAnalyzedClaims(prev => prev.map(claim => 
      claim.id === claimId 
        ? {
            ...claim,
            elements: claim.elements.map(element =>
              element.id === elementId ? { ...element, ...updates } : element
            )
          }
        : claim
    ));
  };

  if (activeView === 'input') {
    return (
      <div className="h-full flex flex-col space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-50 rounded-lg">
            <Target className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Claim Analysis</h3>
            <p className="text-sm text-muted-foreground">
              Analyze target patent claims to identify key elements and generate search terms
            </p>
          </div>
        </div>

        {/* Patent Input */}
        <Card className="flex-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Target Patent Claims
            </CardTitle>
            <CardDescription>
              Enter the claims from the target patent you want to search against
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="patent-claims">Patent Claims Text</Label>
              <Textarea
                id="patent-claims"
                value={patentInput}
                onChange={(e) => setPatentInput(e.target.value)}
                placeholder="Paste the patent claims here... Each claim should be separated by a blank line."
                className="min-h-[300px] font-mono text-sm"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {patentInput.split(/\n\s*\n/).filter(text => text.trim()).length} claims detected
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload File
                </Button>
                <Button 
                  onClick={handleAnalyzeClaims}
                  disabled={!patentInput.trim() || isAnalyzing}
                >
                  {isAnalyzing ? (
                    <>
                      <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Analyze Claims
                    </>
                  )}
                </Button>
              </div>
            </div>

            {project.target_patent && (
              <Alert>
                <Target className="h-4 w-4" />
                <AlertDescription>
                  Target Patent: {typeof project.target_patent === 'string' 
                    ? project.target_patent 
                    : `${project.target_patent.patent_number}${project.target_patent.title ? ' - ' + project.target_patent.title : ''}`}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Header with Progress */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-50 rounded-lg">
              <Target className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Claim Analysis Results</h3>
              <p className="text-sm text-muted-foreground">
                {analyzedClaims.length} claims analyzed • {selectedClaimIds.size} selected for search
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={() => setActiveView('input')}>
            <Edit3 className="h-4 w-4 mr-2" />
            Edit Claims
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium">{analyzedClaims.length}</p>
                  <p className="text-sm text-muted-foreground">Total Claims</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Key className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium">
                    {analyzedClaims.reduce((sum, claim) => sum + claim.elements.filter(e => e.isEssential).length, 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">Key Elements</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="font-medium">{selectedClaimIds.size}</p>
                  <p className="text-sm text-muted-foreground">Priority Claims</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Claims List */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="space-y-4">
            {analyzedClaims.map((claim) => (
              <Card key={claim.id} className={selectedClaimIds.has(claim.id) ? 'ring-2 ring-blue-200' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedClaimIds.has(claim.id)}
                        onCheckedChange={() => toggleClaimSelection(claim.id)}
                      />
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base">Claim {claim.number}</CardTitle>
                          <Badge variant={claim.claimType === 'independent' ? 'default' : 'secondary'}>
                            {claim.claimType}
                          </Badge>
                          <Badge variant={claim.searchPriority === 'high' ? 'destructive' : 'outline'}>
                            {claim.searchPriority} priority
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {claim.keyFeatures.map((feature, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <Collapsible>
                      <CollapsibleTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => toggleClaimExpansion(claim.id)}
                        >
                          {expandedClaims.has(claim.id) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                    </Collapsible>
                  </div>
                </CardHeader>
                
                <CollapsibleContent>
                  <CardContent className="pt-0 space-y-4">
                    {/* Full Claim Text */}
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm font-mono leading-relaxed">{claim.fullText}</p>
                    </div>

                    {/* Claim Elements */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Claim Elements</h4>
                      {claim.elements.map((element) => (
                        <div key={element.id} className="border rounded-lg p-3 space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-xs">
                                  {element.type}
                                </Badge>
                                {element.isEssential && (
                                  <Badge variant="secondary" className="text-xs">
                                    Essential
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm">{element.text}</p>
                            </div>
                          </div>
                          
                          {element.searchTerms.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1">Search Terms:</p>
                              <div className="flex flex-wrap gap-1">
                                {element.searchTerms.map((term, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {term}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}