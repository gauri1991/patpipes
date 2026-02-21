/**
 * Patent Text Analyzer Tab Component
 * Adapted text analyzer specifically for patent documents and technical literature
 */

'use client';

import { useState } from 'react';
import {
  FileText,
  Upload,
  Sparkles,
  Search,
  Filter,
  Download,
  Copy,
  CheckCircle,
  AlertCircle,
  Loader2,
  Brain,
  Tag,
  Key,
  Target,
  Zap,
  TrendingUp,
  ArrowRight,
  BookOpen,
  Layers
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { PriorArtProject } from '@/types/prior-art.types';

interface PatentConcept {
  id: string;
  text: string;
  type: 'technical_feature' | 'problem' | 'solution' | 'advantage' | 'component' | 'method' | 'system' | 'apparatus';
  confidence: number;
  frequency: number;
  selected: boolean;
  claimRelevance: number; // How relevant to the analyzed claims (0-1)
  synonyms?: string[];
  context?: string;
  patentRelevance: 'high' | 'medium' | 'low';
}

interface PatentAnalysisResult {
  concepts: PatentConcept[];
  summary: string;
  technicalField: string;
  keyPhrases: string[];
  suggestedKeywords: string[];
  suggestedClassifications: string[];
  priorArtTerms: string[];
  innovationLevel: 'incremental' | 'moderate' | 'breakthrough';
  searchComplexity: 'simple' | 'moderate' | 'complex';
}

interface PatentTextAnalyzerTabProps {
  project: PriorArtProject;
  claimData?: any;
  onProgressUpdate: (progress: number) => void;
  onDataUpdate: (data: any) => void;
}

export function PatentTextAnalyzerTab({ 
  project, 
  claimData, 
  onProgressUpdate, 
  onDataUpdate 
}: PatentTextAnalyzerTabProps) {
  const [inputText, setInputText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<PatentAnalysisResult | null>(null);
  const [selectedConcepts, setSelectedConcepts] = useState<Set<string>>(new Set());
  const [activeView, setActiveView] = useState<'input' | 'results'>('input');
  const [filterType, setFilterType] = useState<string>('all');
  const [analysisMode, setAnalysisMode] = useState<'patent' | 'literature' | 'hybrid'>('patent');

  const handleAnalyze = async () => {
    if (!inputText.trim()) return;
    
    setIsAnalyzing(true);
    setActiveView('results');
    
    // Simulate patent-focused analysis
    setTimeout(() => {
      const mockResult: PatentAnalysisResult = {
        concepts: [
          {
            id: '1',
            text: 'machine learning algorithm',
            type: 'method',
            confidence: 0.95,
            frequency: 8,
            selected: false,
            claimRelevance: 0.9,
            synonyms: ['ML algorithm', 'learning model', 'AI algorithm'],
            context: 'Core computational method',
            patentRelevance: 'high'
          },
          {
            id: '2',
            text: 'neural network architecture',
            type: 'system',
            confidence: 0.92,
            frequency: 6,
            selected: false,
            claimRelevance: 0.85,
            synonyms: ['NN architecture', 'network topology', 'neural structure'],
            context: 'System architecture for AI processing',
            patentRelevance: 'high'
          },
          {
            id: '3',
            text: 'data preprocessing unit',
            type: 'component',
            confidence: 0.88,
            frequency: 4,
            selected: false,
            claimRelevance: 0.7,
            synonyms: ['preprocessing module', 'data preparation unit'],
            context: 'Data handling component',
            patentRelevance: 'medium'
          },
          {
            id: '4',
            text: 'real-time processing capability',
            type: 'advantage',
            confidence: 0.85,
            frequency: 3,
            selected: false,
            claimRelevance: 0.6,
            synonyms: ['real-time processing', 'live processing'],
            context: 'Performance advantage',
            patentRelevance: 'medium'
          },
          {
            id: '5',
            text: 'training data optimization',
            type: 'problem',
            confidence: 0.82,
            frequency: 5,
            selected: false,
            claimRelevance: 0.75,
            synonyms: ['data optimization', 'training optimization'],
            context: 'Technical problem addressed',
            patentRelevance: 'high'
          }
        ],
        summary: 'The analyzed text describes a machine learning system with neural network architecture for real-time data processing. Key innovations include optimized training methodologies and preprocessing techniques.',
        technicalField: 'Artificial Intelligence / Machine Learning',
        keyPhrases: ['machine learning', 'neural network', 'real-time processing', 'data optimization'],
        suggestedKeywords: ['machine learning', 'neural network', 'AI algorithm', 'deep learning', 'data processing'],
        suggestedClassifications: ['G06N 3/02', 'G06N 20/00', 'G06F 17/00'],
        priorArtTerms: ['artificial intelligence', 'pattern recognition', 'computational learning', 'automated classification'],
        innovationLevel: 'moderate',
        searchComplexity: 'moderate'
      };

      setAnalysisResult(mockResult);
      // Auto-select high-relevance concepts
      const highRelevanceConcepts = mockResult.concepts
        .filter(c => c.patentRelevance === 'high')
        .map(c => c.id);
      setSelectedConcepts(new Set(highRelevanceConcepts));
      
      setIsAnalyzing(false);
      
      // Update progress and data
      onProgressUpdate(80);
      onDataUpdate({
        analysisResult: mockResult,
        selectedConcepts: Array.from(new Set(highRelevanceConcepts)),
        analysisMode
      });
    }, 3000);
  };

  const toggleConceptSelection = (conceptId: string) => {
    setSelectedConcepts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(conceptId)) {
        newSet.delete(conceptId);
      } else {
        newSet.add(conceptId);
      }
      
      // Update progress based on selection
      const progress = Math.min(100, (newSet.size / Math.max(1, analysisResult?.concepts.length || 1)) * 100);
      onProgressUpdate(progress);
      onDataUpdate({
        analysisResult,
        selectedConcepts: Array.from(newSet),
        analysisMode
      });
      
      return newSet;
    });
  };

  const getFilteredConcepts = () => {
    if (!analysisResult) return [];
    
    let concepts = analysisResult.concepts;
    
    if (filterType !== 'all') {
      if (filterType === 'high-relevance') {
        concepts = concepts.filter(c => c.patentRelevance === 'high');
      } else if (filterType === 'selected') {
        concepts = concepts.filter(c => selectedConcepts.has(c.id));
      } else {
        concepts = concepts.filter(c => c.type === filterType);
      }
    }
    
    return concepts.sort((a, b) => b.confidence - a.confidence);
  };

  const getTypeIcon = (type: PatentConcept['type']) => {
    switch (type) {
      case 'technical_feature': return Target;
      case 'method': return Zap;
      case 'system': return Layers;
      case 'component': return Tag;
      case 'problem': return AlertCircle;
      case 'solution': return CheckCircle;
      case 'advantage': return TrendingUp;
      case 'apparatus': return Brain;
      default: return Key;
    }
  };

  if (activeView === 'input') {
    return (
      <div className="h-full flex flex-col space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <FileText className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Patent Text Analyzer</h3>
            <p className="text-sm text-muted-foreground">
              Extract technical concepts and keywords from patent documents and literature
            </p>
          </div>
        </div>

        {/* Claim Context */}
        {claimData?.claims && (
          <Alert>
            <Target className="h-4 w-4" />
            <AlertDescription>
              {claimData.claims.length} claims analyzed. Text analysis will focus on concepts relevant to these claims.
            </AlertDescription>
          </Alert>
        )}

        {/* Analysis Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Analysis Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Analysis Mode</Label>
                <Select value={analysisMode} onValueChange={(value: any) => setAnalysisMode(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="patent">Patent Documents</SelectItem>
                    <SelectItem value="literature">Technical Literature</SelectItem>
                    <SelectItem value="hybrid">Hybrid Analysis</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Focus Area</Label>
                <Select defaultValue="technical">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technical">Technical Features</SelectItem>
                    <SelectItem value="legal">Legal Language</SelectItem>
                    <SelectItem value="commercial">Commercial Applications</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Text Input */}
        <Card className="flex-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Document Text
            </CardTitle>
            <CardDescription>
              Enter patent text, technical documents, or research papers to extract concepts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="patent-text">Document Content</Label>
              <Textarea
                id="patent-text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste patent abstract, description, or technical document here..."
                className="min-h-[300px] font-mono text-sm"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {inputText.length} characters • {inputText.split(/\s+/).filter(w => w).length} words
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload File
                </Button>
                <Button 
                  onClick={handleAnalyze}
                  disabled={!inputText.trim() || isAnalyzing}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Analyze Text
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Header with Results Summary */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Analysis Results</h3>
              <p className="text-sm text-muted-foreground">
                {analysisResult?.concepts.length} concepts • {selectedConcepts.size} selected
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setActiveView('input')}>
              <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
              Back to Input
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Results
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium">{analysisResult?.technicalField}</p>
                  <p className="text-sm text-muted-foreground">Technical Field</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium capitalize">{analysisResult?.innovationLevel}</p>
                  <p className="text-sm text-muted-foreground">Innovation Level</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Search className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="font-medium capitalize">{analysisResult?.searchComplexity}</p>
                  <p className="text-sm text-muted-foreground">Search Complexity</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="font-medium">{selectedConcepts.size}</p>
                  <p className="text-sm text-muted-foreground">Selected Concepts</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs defaultValue="concepts" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="concepts">Extracted Concepts</TabsTrigger>
          <TabsTrigger value="summary">Analysis Summary</TabsTrigger>
          <TabsTrigger value="keywords">Suggested Keywords</TabsTrigger>
        </TabsList>

        <TabsContent value="concepts" className="flex-1 space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <Label>Filter:</Label>
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Concepts</SelectItem>
                <SelectItem value="high-relevance">High Relevance</SelectItem>
                <SelectItem value="selected">Selected Only</SelectItem>
                <Separator />
                <SelectItem value="technical_feature">Technical Features</SelectItem>
                <SelectItem value="method">Methods</SelectItem>
                <SelectItem value="system">Systems</SelectItem>
                <SelectItem value="component">Components</SelectItem>
                <SelectItem value="problem">Problems</SelectItem>
                <SelectItem value="solution">Solutions</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Concepts List */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="space-y-3">
                {getFilteredConcepts().map((concept) => {
                  const TypeIcon = getTypeIcon(concept.type);
                  return (
                    <Card key={concept.id} className={selectedConcepts.has(concept.id) ? 'ring-2 ring-blue-200' : ''}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={selectedConcepts.has(concept.id)}
                            onCheckedChange={() => toggleConceptSelection(concept.id)}
                          />
                          <div className="flex-1 space-y-2">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <TypeIcon className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium">{concept.text}</span>
                                  <Badge variant={concept.patentRelevance === 'high' ? 'default' : 'outline'}>
                                    {concept.patentRelevance}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">{concept.context}</p>
                              </div>
                              <div className="text-right space-y-1">
                                <div className="text-sm font-medium">{Math.round(concept.confidence * 100)}%</div>
                                <div className="text-xs text-muted-foreground">confidence</div>
                              </div>
                            </div>
                            
                            {concept.synonyms && concept.synonyms.length > 0 && (
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1">Synonyms:</p>
                                <div className="flex flex-wrap gap-1">
                                  {concept.synonyms.map((synonym, index) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                      {synonym}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>Frequency: {concept.frequency}</span>
                              <span>Claim Relevance: {Math.round(concept.claimRelevance * 100)}%</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        </TabsContent>

        <TabsContent value="summary" className="flex-1">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Analysis Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="leading-relaxed">{analysisResult?.summary}</p>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Key Phrases</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {analysisResult?.keyPhrases.map((phrase, index) => (
                      <Badge key={index} variant="secondary">
                        {phrase}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Prior Art Terms</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {analysisResult?.priorArtTerms.map((term, index) => (
                      <Badge key={index} variant="outline">
                        {term}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="keywords" className="flex-1">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Suggested Search Keywords</CardTitle>
                <CardDescription>
                  Keywords automatically generated based on the analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {analysisResult?.suggestedKeywords.map((keyword, index) => (
                    <Badge key={index} variant="default" className="cursor-pointer">
                      {keyword}
                      <Copy className="h-3 w-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Suggested Classifications</CardTitle>
                <CardDescription>
                  Patent classification codes (IPC/CPC) relevant to the analyzed content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {analysisResult?.suggestedClassifications.map((classification, index) => (
                    <Badge key={index} variant="outline" className="cursor-pointer">
                      {classification}
                      <Copy className="h-3 w-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}