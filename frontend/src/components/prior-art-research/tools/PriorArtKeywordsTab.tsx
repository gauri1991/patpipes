/**
 * Prior Art Keywords Tab Component
 * Specialized keyword generation and management for prior art searches
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Key,
  Plus,
  Search,
  Target,
  Brain,
  Sparkles,
  Copy,
  Download,
  Filter,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Layers,
  TrendingUp,
  Shuffle,
  Save
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { PriorArtProject } from '@/types/prior-art.types';

interface KeywordGroup {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  searchOperator: 'AND' | 'OR';
  weight: number;
  selected: boolean;
}

interface KeywordSuggestion {
  keyword: string;
  relevance: number;
  source: 'claim' | 'text_analysis' | 'synonym' | 'classification' | 'manual';
  context?: string;
  selected: boolean;
}

interface PriorArtKeywordsTabProps {
  project: PriorArtProject;
  claimData?: any;
  textData?: any;
  onProgressUpdate: (progress: number) => void;
  onDataUpdate: (data: any) => void;
}

export function PriorArtKeywordsTab({ 
  project, 
  claimData, 
  textData, 
  onProgressUpdate, 
  onDataUpdate 
}: PriorArtKeywordsTabProps) {
  const [keywordGroups, setKeywordGroups] = useState<KeywordGroup[]>([]);
  const [suggestions, setSuggestions] = useState<KeywordSuggestion[]>([]);
  const [customKeyword, setCustomKeyword] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('suggestions');
  const [filterSource, setFilterSource] = useState<string>('all');

  // Initialize with data from previous steps
  useEffect(() => {
    generateInitialKeywords();
  }, [claimData, textData]);

  const generateInitialKeywords = async () => {
    setIsGenerating(true);
    
    // Simulate keyword generation based on previous analysis
    setTimeout(() => {
      const mockSuggestions: KeywordSuggestion[] = [
        { keyword: 'machine learning', relevance: 0.95, source: 'claim', context: 'Core claim element', selected: true },
        { keyword: 'neural network', relevance: 0.92, source: 'claim', context: 'System architecture', selected: true },
        { keyword: 'deep learning', relevance: 0.88, source: 'synonym', context: 'Synonym for ML', selected: true },
        { keyword: 'artificial intelligence', relevance: 0.85, source: 'text_analysis', context: 'Broader technical field', selected: false },
        { keyword: 'pattern recognition', relevance: 0.82, source: 'classification', context: 'G06K classification', selected: false },
        { keyword: 'data processing', relevance: 0.78, source: 'claim', context: 'Functional element', selected: true },
        { keyword: 'algorithm optimization', relevance: 0.75, source: 'text_analysis', context: 'Technical improvement', selected: false },
        { keyword: 'real-time processing', relevance: 0.72, source: 'text_analysis', context: 'Performance feature', selected: false },
        { keyword: 'training data', relevance: 0.70, source: 'claim', context: 'Input data element', selected: false },
        { keyword: 'computational learning', relevance: 0.68, source: 'synonym', context: 'Alternative term', selected: false }
      ];

      const mockGroups: KeywordGroup[] = [
        {
          id: 'core-technology',
          name: 'Core Technology',
          description: 'Essential technical elements from claims',
          keywords: ['machine learning', 'neural network', 'deep learning'],
          searchOperator: 'OR',
          weight: 1.0,
          selected: true
        },
        {
          id: 'functional-aspects',
          name: 'Functional Aspects',
          description: 'Functional elements and processes',
          keywords: ['data processing', 'pattern recognition', 'algorithm optimization'],
          searchOperator: 'OR',
          weight: 0.8,
          selected: true
        },
        {
          id: 'technical-field',
          name: 'Technical Field',
          description: 'Broader technical domain terms',
          keywords: ['artificial intelligence', 'computational learning'],
          searchOperator: 'OR',
          weight: 0.6,
          selected: false
        }
      ];

      setSuggestions(mockSuggestions);
      setKeywordGroups(mockGroups);
      setIsGenerating(false);

      // Calculate initial progress
      const selectedCount = mockSuggestions.filter(s => s.selected).length;
      const progress = Math.min(100, (selectedCount / Math.max(1, mockSuggestions.length)) * 100);
      onProgressUpdate(progress);
      updateData(mockSuggestions, mockGroups);
    }, 2000);
  };

  const updateData = (currentSuggestions: KeywordSuggestion[], currentGroups: KeywordGroup[]) => {
    onDataUpdate({
      suggestions: currentSuggestions,
      keywordGroups: currentGroups,
      selectedKeywords: currentSuggestions.filter(s => s.selected).map(s => s.keyword),
      searchQuery: generateSearchQuery(currentGroups.filter(g => g.selected))
    });
  };

  const generateSearchQuery = (selectedGroups: KeywordGroup[]): string => {
    return selectedGroups
      .map(group => `(${group.keywords.join(` ${group.searchOperator} `)})`)
      .join(' AND ');
  };

  const toggleSuggestionSelection = (keyword: string) => {
    const updated = suggestions.map(s => 
      s.keyword === keyword ? { ...s, selected: !s.selected } : s
    );
    setSuggestions(updated);
    
    // Update progress
    const selectedCount = updated.filter(s => s.selected).length;
    const progress = Math.min(100, (selectedCount / Math.max(1, updated.length)) * 100);
    onProgressUpdate(progress);
    updateData(updated, keywordGroups);
  };

  const toggleGroupSelection = (groupId: string) => {
    const updated = keywordGroups.map(g => 
      g.id === groupId ? { ...g, selected: !g.selected } : g
    );
    setKeywordGroups(updated);
    updateData(suggestions, updated);
  };

  const addCustomKeyword = () => {
    if (!customKeyword.trim()) return;
    
    const newSuggestion: KeywordSuggestion = {
      keyword: customKeyword.trim(),
      relevance: 0.5,
      source: 'manual',
      context: 'Manually added',
      selected: true
    };
    
    const updated = [...suggestions, newSuggestion];
    setSuggestions(updated);
    setCustomKeyword('');
    updateData(updated, keywordGroups);
  };

  const createKeywordGroup = () => {
    const selectedKeywords = suggestions.filter(s => s.selected && !keywordGroups.some(g => g.keywords.includes(s.keyword)));
    
    if (selectedKeywords.length === 0) return;
    
    const newGroup: KeywordGroup = {
      id: `group-${Date.now()}`,
      name: 'Custom Group',
      description: 'User-defined keyword group',
      keywords: selectedKeywords.map(s => s.keyword),
      searchOperator: 'OR',
      weight: 0.7,
      selected: true
    };
    
    const updated = [...keywordGroups, newGroup];
    setKeywordGroups(updated);
    updateData(suggestions, updated);
  };

  const getFilteredSuggestions = () => {
    if (filterSource === 'all') return suggestions;
    return suggestions.filter(s => s.source === filterSource);
  };

  const getSourceIcon = (source: KeywordSuggestion['source']) => {
    switch (source) {
      case 'claim': return Target;
      case 'text_analysis': return Brain;
      case 'synonym': return Shuffle;
      case 'classification': return Layers;
      case 'manual': return Plus;
      default: return Key;
    }
  };

  const getRelevanceColor = (relevance: number) => {
    if (relevance >= 0.8) return 'bg-green-500';
    if (relevance >= 0.6) return 'bg-yellow-500';
    return 'bg-gray-400';
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-green-50 rounded-lg">
          <Key className="h-5 w-5 text-green-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Keyword Strategy</h3>
          <p className="text-sm text-muted-foreground">
            Generate and organize search keywords for systematic prior art research
          </p>
        </div>
      </div>

      {/* Context Alert */}
      {(claimData?.claims?.length > 0 || textData?.concepts?.length > 0) && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Keywords generated from {claimData?.claims?.length || 0} analyzed claims and {textData?.concepts?.length || 0} extracted concepts.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="suggestions">Keyword Suggestions</TabsTrigger>
          <TabsTrigger value="groups">Keyword Groups</TabsTrigger>
          <TabsTrigger value="query">Search Query</TabsTrigger>
        </TabsList>

        <TabsContent value="suggestions" className="flex-1 space-y-4">
          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <Label>Source:</Label>
              </div>
              <Select value={filterSource} onValueChange={setFilterSource}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="claim">From Claims</SelectItem>
                  <SelectItem value="text_analysis">Text Analysis</SelectItem>
                  <SelectItem value="synonym">Synonyms</SelectItem>
                  <SelectItem value="classification">Classifications</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Add custom keyword..."
                value={customKeyword}
                onChange={(e) => setCustomKeyword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addCustomKeyword()}
                className="w-48"
              />
              <Button onClick={addCustomKeyword} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Suggestions List */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="space-y-3">
                {getFilteredSuggestions().map((suggestion, index) => {
                  const SourceIcon = getSourceIcon(suggestion.source);
                  return (
                    <Card key={index} className={suggestion.selected ? 'ring-2 ring-green-200' : ''}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={suggestion.selected}
                            onCheckedChange={() => toggleSuggestionSelection(suggestion.keyword)}
                          />
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <SourceIcon className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{suggestion.keyword}</span>
                                <Badge variant="outline" className="text-xs">
                                  {suggestion.source.replace('_', ' ')}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                <div 
                                  className={`w-3 h-3 rounded-full ${getRelevanceColor(suggestion.relevance)}`}
                                  title={`Relevance: ${Math.round(suggestion.relevance * 100)}%`}
                                />
                                <span className="text-sm text-muted-foreground">
                                  {Math.round(suggestion.relevance * 100)}%
                                </span>
                              </div>
                            </div>
                            {suggestion.context && (
                              <p className="text-sm text-muted-foreground">{suggestion.context}</p>
                            )}
                          </div>
                          <Button variant="ghost" size="sm" title="Copy keyword">
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

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={createKeywordGroup}>
              Create Group from Selected
            </Button>
            <Button onClick={() => setActiveTab('groups')}>
              <ArrowRight className="h-4 w-4 mr-2" />
              Organize Groups
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="groups" className="flex-1 space-y-4">
          <div className="space-y-4">
            {keywordGroups.map((group) => (
              <Card key={group.id} className={group.selected ? 'ring-2 ring-green-200' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={group.selected}
                        onCheckedChange={() => toggleGroupSelection(group.id)}
                      />
                      <div>
                        <CardTitle className="text-base">{group.name}</CardTitle>
                        <CardDescription>{group.description}</CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline">
                      Weight: {group.weight}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm">Operator:</Label>
                      <Badge variant={group.searchOperator === 'AND' ? 'default' : 'secondary'}>
                        {group.searchOperator}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-sm">Keywords ({group.keywords.length}):</Label>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {group.keywords.map((keyword, index) => (
                          <Badge key={index} variant="outline">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setActiveTab('query')}>
              <ArrowRight className="h-4 w-4 mr-2" />
              Preview Query
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="query" className="flex-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Generated Search Query</CardTitle>
              <CardDescription>
                Boolean search query based on selected keyword groups
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <code className="text-sm font-mono">
                    {generateSearchQuery(keywordGroups.filter(g => g.selected)) || 'No keywords selected'}
                  </code>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline">
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Query
                  </Button>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export Keywords
                  </Button>
                  <Button variant="outline">
                    <Save className="h-4 w-4 mr-2" />
                    Save Strategy
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Query Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Selected Groups:</span>
                    <span className="font-medium">{keywordGroups.filter(g => g.selected).length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Keywords:</span>
                    <span className="font-medium">
                      {keywordGroups.filter(g => g.selected).reduce((sum, g) => sum + g.keywords.length, 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Query Complexity:</span>
                    <Badge variant="outline">
                      {keywordGroups.filter(g => g.selected).length > 3 ? 'Complex' : 'Moderate'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Search Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Alert>
                    <TrendingUp className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      Consider using proximity operators for better precision
                    </AlertDescription>
                  </Alert>
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      Test query with different databases for comprehensive coverage
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}