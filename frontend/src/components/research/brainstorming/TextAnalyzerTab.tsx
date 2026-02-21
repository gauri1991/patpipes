'use client';

import { useState } from 'react';
import { useBrainstorming } from '@/hooks/useBrainstorming';
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
  ArrowRight
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ExtractedConcept {
  id: string;
  text: string;
  type: 'technical_term' | 'problem' | 'solution' | 'advantage' | 'component' | 'method';
  confidence: number;
  frequency: number;
  selected: boolean;
  variations?: string[];
  context?: string;
}

interface AnalysisResult {
  concepts: ExtractedConcept[];
  summary: string;
  keyPhrases: string[];
  suggestedKeywords: string[];
  suggestedClassifications: string[];
  technicalDomain: string;
  innovationLevel: 'incremental' | 'moderate' | 'breakthrough';
}

interface TextAnalyzerTabProps {
  projectId: string;
  sessionId: string | null;
}

export function TextAnalyzerTab({ projectId, sessionId }: TextAnalyzerTabProps) {
  const {
    generateKeywordsFromText,
    createKeyword,
    loading,
    error
  } = useBrainstorming(projectId);
  const [inputText, setInputText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [selectedConcepts, setSelectedConcepts] = useState<Set<string>>(new Set());
  const [activeView, setActiveView] = useState<'input' | 'results'>('input');
  const [filterType, setFilterType] = useState<string>('all');

  const handleAnalyze = async () => {
    if (!inputText.trim() || !sessionId) return;
    
    setIsAnalyzing(true);
    
    try {
      // First, extract keywords using the API
      const extractedKeywords = await generateKeywordsFromText(inputText);
      
      // Then simulate additional analysis for concepts
      setTimeout(() => {
      const mockResult: AnalysisResult = {
        concepts: [
          {
            id: '1',
            text: 'neural network',
            type: 'technical_term',
            confidence: 0.95,
            frequency: 5,
            selected: false,
            variations: ['neural networks', 'NN', 'artificial neural network'],
            context: 'deep learning architecture for pattern recognition'
          },
          {
            id: '2',
            text: 'reducing computational complexity',
            type: 'problem',
            confidence: 0.88,
            frequency: 3,
            selected: false,
            context: 'current systems require excessive processing power'
          },
          {
            id: '3',
            text: 'pruning algorithm',
            type: 'solution',
            confidence: 0.92,
            frequency: 4,
            selected: false,
            variations: ['weight pruning', 'network pruning'],
            context: 'removes unnecessary connections to optimize performance'
          },
          {
            id: '4',
            text: '40% faster inference',
            type: 'advantage',
            confidence: 0.85,
            frequency: 2,
            selected: false,
            context: 'compared to traditional approaches'
          },
          {
            id: '5',
            text: 'attention mechanism',
            type: 'component',
            confidence: 0.90,
            frequency: 3,
            selected: false,
            variations: ['self-attention', 'multi-head attention'],
            context: 'focuses on relevant features in the input data'
          },
          {
            id: '6',
            text: 'gradient descent optimization',
            type: 'method',
            confidence: 0.87,
            frequency: 2,
            selected: false,
            variations: ['SGD', 'stochastic gradient descent'],
            context: 'training methodology for the model'
          }
        ],
        summary: 'The document describes an innovative neural network architecture that addresses computational complexity through pruning algorithms and attention mechanisms, achieving 40% faster inference.',
        keyPhrases: [
          'neural network optimization',
          'computational efficiency',
          'pruning algorithm',
          'attention mechanism',
          'inference acceleration'
        ],
        suggestedKeywords: [
          'neural network',
          'pruning',
          'attention mechanism',
          'deep learning',
          'optimization',
          'inference',
          'computational complexity',
          'machine learning',
          'artificial intelligence'
        ],
        suggestedClassifications: [
          'G06N 3/04 - Neural networks',
          'G06N 3/08 - Learning methods',
          'G06F 17/16 - Matrix computations',
          'H04L 25/03 - Adaptive equalisers'
        ],
        technicalDomain: 'Artificial Intelligence / Machine Learning',
        innovationLevel: 'moderate'
      };
      
      setAnalysisResult(mockResult);
      setActiveView('results');
      setIsAnalyzing(false);
      }, 2000);
    } catch (err) {
      setIsAnalyzing(false);
      console.error('Analysis failed:', err);
    }
  };

  const handleSelectConcept = (conceptId: string) => {
    const newSelected = new Set(selectedConcepts);
    if (newSelected.has(conceptId)) {
      newSelected.delete(conceptId);
    } else {
      newSelected.add(conceptId);
    }
    setSelectedConcepts(newSelected);
  };

  const handleSelectAll = () => {
    if (!analysisResult) return;
    
    const filtered = getFilteredConcepts();
    if (selectedConcepts.size === filtered.length) {
      setSelectedConcepts(new Set());
    } else {
      setSelectedConcepts(new Set(filtered.map(c => c.id)));
    }
  };

  const getFilteredConcepts = () => {
    if (!analysisResult) return [];
    if (filterType === 'all') return analysisResult.concepts;
    return analysisResult.concepts.filter(c => c.type === filterType);
  };

  const handleExportSelected = async () => {
    if (!sessionId) return;
    
    const selected = analysisResult?.concepts.filter(c => selectedConcepts.has(c.id)) || [];
    
    // Export selected concepts as keywords to the session
    for (const concept of selected) {
      await createKeyword({
        keyword: concept.text,
        category: concept.type,
        generation_method: 'extracted',
        relevance_score: concept.confidence
      });
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'technical_term': return 'bg-blue-100 text-blue-700';
      case 'problem': return 'bg-red-100 text-red-700';
      case 'solution': return 'bg-green-100 text-green-700';
      case 'advantage': return 'bg-purple-100 text-purple-700';
      case 'component': return 'bg-orange-100 text-orange-700';
      case 'method': return 'bg-indigo-100 text-indigo-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getInnovationColor = (level: string) => {
    switch (level) {
      case 'breakthrough': return 'text-purple-600';
      case 'moderate': return 'text-blue-600';
      case 'incremental': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  if (!sessionId) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Active Session</h3>
          <p className="text-muted-foreground">
            Please select or create a brainstorming session to analyze documents.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <p className="text-red-800 text-sm">Error: {error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {activeView === 'input' && (
        <>
          {/* Input Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Document Analyzer
              </CardTitle>
              <CardDescription>
                Paste or upload technical documents to extract key concepts, problems, and solutions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Input Text</Label>
                <Textarea
                  placeholder="Paste your invention disclosure, technical specification, research paper, or any technical document here..."
                  rows={12}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="font-mono text-sm"
                />
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{inputText.length} characters</span>
                  <span>{inputText.split(/\s+/).filter(w => w).length} words</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Button variant="outline" className="flex-1">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Document
                </Button>
                <Button 
                  className="flex-1"
                  onClick={handleAnalyze}
                  disabled={!inputText.trim() || isAnalyzing || !sessionId}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Brain className="h-4 w-4 mr-2" />
                      Analyze Text
                    </>
                  )}
                </Button>
              </div>

              {/* Sample Templates */}
              <div className="pt-4 border-t">
                <Label className="text-sm">Quick Templates</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setInputText('A method for optimizing neural network inference through dynamic pruning of weights during runtime...')}
                  >
                    AI/ML Invention
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setInputText('A battery management system comprising a voltage monitoring circuit and temperature compensation...')}
                  >
                    Hardware System
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setInputText('A software architecture for distributed computing with fault tolerance and automatic failover...')}
                  >
                    Software Method
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tips Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Analysis Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <span>Include technical details, problems solved, and advantages</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <span>Longer descriptions yield more comprehensive results</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <span>Technical terminology helps identify relevant classifications</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </>
      )}

      {activeView === 'results' && analysisResult && (
        <>
          {/* Results Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => setActiveView('input')}>
                ← Back to Input
              </Button>
              <Badge variant="outline" className="text-sm">
                {analysisResult.concepts.length} concepts extracted
              </Badge>
              <Badge variant="outline" className={`text-sm ${getInnovationColor(analysisResult.innovationLevel)}`}>
                {analysisResult.innovationLevel} innovation
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportSelected}
                disabled={selectedConcepts.size === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Selected ({selectedConcepts.size})
              </Button>
            </div>
          </div>

          {/* Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Analysis Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">Technical Domain</Label>
                <p className="font-medium">{analysisResult.technicalDomain}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Summary</Label>
                <p className="text-sm">{analysisResult.summary}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Key Phrases</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {analysisResult.keyPhrases.map((phrase, idx) => (
                    <Badge key={idx} variant="secondary">
                      {phrase}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Extracted Concepts */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Extracted Concepts</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                  >
                    {selectedConcepts.size === getFilteredConcepts().length ? 'Deselect All' : 'Select All'}
                  </Button>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="technical_term">Technical Terms</SelectItem>
                      <SelectItem value="problem">Problems</SelectItem>
                      <SelectItem value="solution">Solutions</SelectItem>
                      <SelectItem value="advantage">Advantages</SelectItem>
                      <SelectItem value="component">Components</SelectItem>
                      <SelectItem value="method">Methods</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {getFilteredConcepts().map((concept) => (
                    <div
                      key={concept.id}
                      className={`p-3 border rounded-lg ${selectedConcepts.has(concept.id) ? 'border-blue-500 bg-blue-50' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedConcepts.has(concept.id)}
                          onCheckedChange={() => handleSelectConcept(concept.id)}
                        />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{concept.text}</span>
                            <Badge className={`text-xs ${getTypeColor(concept.type)}`}>
                              {concept.type.replace('_', ' ')}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {Math.round(concept.confidence * 100)}% confidence
                            </Badge>
                            {concept.frequency > 1 && (
                              <Badge variant="outline" className="text-xs">
                                {concept.frequency}x
                              </Badge>
                            )}
                          </div>
                          {concept.context && (
                            <p className="text-xs text-muted-foreground">{concept.context}</p>
                          )}
                          {concept.variations && concept.variations.length > 0 && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">Variations:</span>
                              <div className="flex flex-wrap gap-1">
                                {concept.variations.map((v, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {v}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Suggestions */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Suggested Keywords
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {analysisResult.suggestedKeywords.map((keyword, idx) => (
                    <Badge key={idx} variant="secondary" className="cursor-pointer hover:bg-secondary/80">
                      {keyword}
                      <button className="ml-1 text-xs">+</button>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Suggested Classifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analysisResult.suggestedClassifications.map((classification, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <span>{classification}</span>
                      <Button size="sm" variant="ghost">
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Loading State */}
      {isAnalyzing && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <Card className="w-96">
            <CardContent className="py-8">
              <div className="space-y-4">
                <div className="flex justify-center">
                  <Brain className="h-12 w-12 text-blue-500 animate-pulse" />
                </div>
                <div className="space-y-2">
                  <p className="text-center font-medium">Analyzing Document</p>
                  <Progress value={66} className="w-full" />
                  <p className="text-center text-sm text-muted-foreground">
                    Extracting concepts and identifying patterns...
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}