/**
 * Classifications Tab Component
 * Patent classification analysis and selection for prior art searches
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Tag,
  Search,
  Filter,
  Copy,
  Download,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Layers,
  Globe,
  BookOpen,
  Brain,
  Target,
  Plus,
  X
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { PriorArtProject } from '@/types/prior-art.types';

interface Classification {
  code: string;
  title: string;
  description: string;
  type: 'IPC' | 'CPC' | 'USPC';
  level: 'section' | 'class' | 'subclass' | 'main_group' | 'subgroup';
  selected: boolean;
  relevance: number;
  patentCount?: number;
  children?: Classification[];
}

interface ClassificationSuggestion {
  code: string;
  title: string;
  description: string;
  type: 'IPC' | 'CPC';
  confidence: number;
  source: 'concept' | 'keyword' | 'similar_patents' | 'manual';
  patentCount: number;
  selected: boolean;
}

interface ClassificationsTabProps {
  project: PriorArtProject;
  conceptData?: any;
  onProgressUpdate: (progress: number) => void;
  onDataUpdate: (data: any) => void;
}

export function ClassificationsTab({ 
  project, 
  conceptData, 
  onProgressUpdate, 
  onDataUpdate 
}: ClassificationsTabProps) {
  const [suggestions, setSuggestions] = useState<ClassificationSuggestion[]>([]);
  const [customCode, setCustomCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    generateClassificationSuggestions();
  }, [conceptData]);

  const generateClassificationSuggestions = async () => {
    setIsLoading(true);
    
    // Simulate classification suggestion generation
    setTimeout(() => {
      const mockSuggestions: ClassificationSuggestion[] = [
        {
          code: 'G06N 3/02',
          title: 'Neural networks',
          description: 'Networks for computing devices using interconnected groups of nodes',
          type: 'IPC',
          confidence: 0.95,
          source: 'concept',
          patentCount: 45000,
          selected: true
        },
        {
          code: 'G06N 20/00',
          title: 'Machine learning',
          description: 'Learning devices, learning methods',
          type: 'IPC',
          confidence: 0.92,
          source: 'concept',
          patentCount: 38000,
          selected: true
        },
        {
          code: 'G06F 17/00',
          title: 'Digital computing or data processing equipment',
          description: 'Equipment or methods, specially adapted for specific functions',
          type: 'IPC',
          confidence: 0.88,
          source: 'keyword',
          patentCount: 125000,
          selected: false
        },
        {
          code: 'G06N 3/08',
          title: 'Learning methods',
          description: 'Learning methods for neural networks',
          type: 'CPC',
          confidence: 0.85,
          source: 'concept',
          patentCount: 28000,
          selected: true
        },
        {
          code: 'G06N 7/00',
          title: 'Computing arrangements based on specific mathematical models',
          description: 'Artificial intelligence techniques based on probabilistic models',
          type: 'IPC',
          confidence: 0.82,
          source: 'similar_patents',
          patentCount: 15000,
          selected: false
        },
        {
          code: 'G06K 9/62',
          title: 'Pattern recognition using electronic means',
          description: 'Classification or grouping of patterns',
          type: 'CPC',
          confidence: 0.78,
          source: 'concept',
          patentCount: 32000,
          selected: false
        },
        {
          code: 'G06T 7/00',
          title: 'Image analysis',
          description: 'Image data processing or generation',
          type: 'IPC',
          confidence: 0.75,
          source: 'keyword',
          patentCount: 42000,
          selected: false
        }
      ];

      setSuggestions(mockSuggestions);
      setIsLoading(false);
      
      // Calculate progress
      const selectedCount = mockSuggestions.filter(s => s.selected).length;
      const progress = Math.min(100, (selectedCount / Math.max(1, mockSuggestions.length)) * 100);
      onProgressUpdate(progress);
      onDataUpdate({
        suggestions: mockSuggestions,
        selectedClassifications: mockSuggestions.filter(s => s.selected),
        classificationQuery: generateClassificationQuery(mockSuggestions.filter(s => s.selected))
      });
    }, 1500);
  };

  const generateClassificationQuery = (selected: ClassificationSuggestion[]): string => {
    if (selected.length === 0) return '';
    return selected.map(s => s.code).join(' OR ');
  };

  const toggleSuggestionSelection = (code: string) => {
    const updated = suggestions.map(s => 
      s.code === code ? { ...s, selected: !s.selected } : s
    );
    setSuggestions(updated);
    
    // Update progress and data
    const selectedCount = updated.filter(s => s.selected).length;
    const progress = Math.min(100, (selectedCount / Math.max(1, updated.length)) * 100);
    onProgressUpdate(progress);
    onDataUpdate({
      suggestions: updated,
      selectedClassifications: updated.filter(s => s.selected),
      classificationQuery: generateClassificationQuery(updated.filter(s => s.selected))
    });
  };

  const addCustomClassification = async () => {
    if (!customCode.trim()) return;
    
    // Mock classification lookup
    const newSuggestion: ClassificationSuggestion = {
      code: customCode.trim().toUpperCase(),
      title: 'Custom Classification',
      description: 'Manually added classification code',
      type: customCode.includes('CPC') ? 'CPC' : 'IPC',
      confidence: 0.5,
      source: 'manual',
      patentCount: 0,
      selected: true
    };
    
    const updated = [...suggestions, newSuggestion];
    setSuggestions(updated);
    setCustomCode('');
    onDataUpdate({
      suggestions: updated,
      selectedClassifications: updated.filter(s => s.selected),
      classificationQuery: generateClassificationQuery(updated.filter(s => s.selected))
    });
  };

  const getFilteredSuggestions = () => {
    let filtered = suggestions;
    
    if (filterType !== 'all') {
      filtered = filtered.filter(s => s.type === filterType);
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(s => 
        s.code.toLowerCase().includes(term) ||
        s.title.toLowerCase().includes(term) ||
        s.description.toLowerCase().includes(term)
      );
    }
    
    return filtered.sort((a, b) => b.confidence - a.confidence);
  };

  const getSourceIcon = (source: ClassificationSuggestion['source']) => {
    switch (source) {
      case 'concept': return Brain;
      case 'keyword': return Target;
      case 'similar_patents': return BookOpen;
      case 'manual': return Plus;
      default: return Tag;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-500';
    if (confidence >= 0.6) return 'bg-yellow-500';
    return 'bg-gray-400';
  };

  const getClassificationLevel = (code: string) => {
    const parts = code.split(/[\s\/]/);
    if (parts.length <= 1) return 'section';
    if (parts.length === 2) return 'class';
    if (parts.length === 3) return 'subclass';
    return 'main_group';
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-purple-50 rounded-lg">
          <Tag className="h-5 w-5 text-purple-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Patent Classifications</h3>
          <p className="text-sm text-muted-foreground">
            Identify relevant IPC and CPC codes for comprehensive prior art coverage
          </p>
        </div>
      </div>

      {/* Context Alert */}
      {conceptData?.concepts?.length > 0 && (
        <Alert>
          <Brain className="h-4 w-4" />
          <AlertDescription>
            Classifications suggested based on {conceptData.concepts.length} analyzed concepts from previous steps.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="suggestions" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="suggestions">Classification Suggestions</TabsTrigger>
          <TabsTrigger value="hierarchy">Classification Hierarchy</TabsTrigger>
          <TabsTrigger value="analysis">Coverage Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="suggestions" className="flex-1 space-y-4">
          {/* Search and Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search classifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="IPC">IPC</SelectItem>
                <SelectItem value="CPC">CPC</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Add custom code..."
                value={customCode}
                onChange={(e) => setCustomCode(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addCustomClassification()}
                className="w-40"
              />
              <Button onClick={addCustomClassification} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Tag className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="font-medium">{suggestions.length}</p>
                    <p className="text-sm text-muted-foreground">Total Suggestions</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">{suggestions.filter(s => s.selected).length}</p>
                    <p className="text-sm text-muted-foreground">Selected</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">
                      {Math.round(suggestions.reduce((sum, s) => sum + s.confidence, 0) / suggestions.length * 100)}%
                    </p>
                    <p className="text-sm text-muted-foreground">Avg Confidence</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="font-medium">
                      {suggestions.filter(s => s.selected).reduce((sum, s) => sum + s.patentCount, 0).toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">Patents Covered</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Classifications List */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="space-y-3">
                {getFilteredSuggestions().map((suggestion) => {
                  const SourceIcon = getSourceIcon(suggestion.source);
                  return (
                    <Card key={suggestion.code} className={suggestion.selected ? 'ring-2 ring-purple-200' : ''}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={suggestion.selected}
                            onCheckedChange={() => toggleSuggestionSelection(suggestion.code)}
                          />
                          <div className="flex-1 space-y-2">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <SourceIcon className="h-4 w-4 text-muted-foreground" />
                                  <code className="font-mono font-medium text-sm bg-muted px-2 py-1 rounded">
                                    {suggestion.code}
                                  </code>
                                  <Badge variant="outline" className="text-xs">
                                    {suggestion.type}
                                  </Badge>
                                </div>
                                <h4 className="font-medium">{suggestion.title}</h4>
                                <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                              </div>
                              <div className="text-right space-y-1">
                                <div className="flex items-center gap-2">
                                  <div 
                                    className={`w-3 h-3 rounded-full ${getConfidenceColor(suggestion.confidence)}`}
                                    title={`Confidence: ${Math.round(suggestion.confidence * 100)}%`}
                                  />
                                  <span className="text-sm font-medium">
                                    {Math.round(suggestion.confidence * 100)}%
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {suggestion.patentCount.toLocaleString()} patents
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>Source: {suggestion.source.replace('_', ' ')}</span>
                              <span>Level: {getClassificationLevel(suggestion.code)}</span>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" title="Copy classification">
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        </TabsContent>

        <TabsContent value="hierarchy" className="flex-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Classification Hierarchy</CardTitle>
              <CardDescription>
                Explore the hierarchical structure of selected classifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {suggestions.filter(s => s.selected).map((classification) => (
                  <div key={classification.code} className="border-l-4 border-purple-200 pl-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <code className="font-mono text-sm bg-muted px-2 py-1 rounded">
                          {classification.code}
                        </code>
                        <Badge variant="outline">{classification.type}</Badge>
                      </div>
                      <p className="font-medium">{classification.title}</p>
                      <p className="text-sm text-muted-foreground">{classification.description}</p>
                      <div className="text-xs text-muted-foreground">
                        Level: {getClassificationLevel(classification.code)} • 
                        Patents: {classification.patentCount.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="flex-1 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Coverage Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>IPC Coverage</span>
                      <span>{suggestions.filter(s => s.selected && s.type === 'IPC').length} codes</span>
                    </div>
                    <Progress value={75} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>CPC Coverage</span>
                      <span>{suggestions.filter(s => s.selected && s.type === 'CPC').length} codes</span>
                    </div>
                    <Progress value={60} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Technology Breadth</span>
                      <span>High</span>
                    </div>
                    <Progress value={85} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Search Query Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 bg-muted rounded-lg">
                    <code className="text-sm">
                      {generateClassificationQuery(suggestions.filter(s => s.selected)) || 'No classifications selected'}
                    </code>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Query
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export List
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Good coverage of core technology areas. Consider adding broader classifications for comprehensive search.
                  </AlertDescription>
                </Alert>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Include related classifications from adjacent technical fields to avoid missing relevant prior art.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}