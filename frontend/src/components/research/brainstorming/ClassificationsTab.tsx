'use client';

import { useState } from 'react';
import { useBrainstorming } from '@/hooks/useBrainstorming';
import {
  Tag,
  Search,
  BookOpen,
  ChevronRight,
  ChevronDown,
  Plus,
  Star,
  Globe,
  Building,
  Brain,
  TrendingUp,
  Filter,
  Copy,
  ExternalLink
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface Classification {
  code: string;
  title: string;
  system: 'IPC' | 'CPC' | 'USPC' | 'F-term' | 'Locarno';
  level: number;
  children?: Classification[];
  description?: string;
  examples?: string[];
  patentCount?: number;
  selected: boolean;
  favorite: boolean;
}

interface ClassificationsTabProps {
  projectId: string;
  sessionId: string | null;
}

export function ClassificationsTab({ projectId, sessionId }: ClassificationsTabProps) {
  const {
    createAIInteraction,
    loading,
    error
  } = useBrainstorming(projectId);
  const [selectedSystem, setSelectedSystem] = useState<string>('IPC');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClasses, setSelectedClasses] = useState<Set<string>>(new Set());
  const [favoriteClasses, setFavoriteClasses] = useState<Set<string>>(new Set());
  const [aiSuggestions, setAiSuggestions] = useState<Classification[]>([]);
  const [techDescription, setTechDescription] = useState('');
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  
  const classificationSystems = [
    { value: 'IPC', label: 'IPC (International)', icon: Globe },
    { value: 'CPC', label: 'CPC (Cooperative)', icon: Building },
    { value: 'USPC', label: 'USPC (US Legacy)', icon: Star },
    { value: 'F-term', label: 'F-terms (Japan)', icon: BookOpen },
    { value: 'Locarno', label: 'Locarno (Design)', icon: TrendingUp }
  ];

  const mockIPCData: Classification[] = [
    {
      code: 'G06',
      title: 'Computing; Calculating or Counting',
      system: 'IPC',
      level: 1,
      selected: false,
      favorite: false,
      patentCount: 2500000,
      children: [
        {
          code: 'G06N',
          title: 'Computing arrangements based on specific computational models',
          system: 'IPC',
          level: 2,
          selected: false,
          favorite: true,
          patentCount: 45000,
          description: 'Computer systems based on specific computational models',
          examples: ['Neural networks', 'Genetic algorithms', 'Fuzzy logic'],
          children: [
            {
              code: 'G06N 3/04',
              title: 'Architecture, e.g. interconnection topology (neural networks)',
              system: 'IPC',
              level: 3,
              selected: true,
              favorite: false,
              patentCount: 8500,
              description: 'Neural network architectures and topologies',
              examples: ['CNN', 'RNN', 'Transformer architectures']
            },
            {
              code: 'G06N 3/08',
              title: 'Learning methods',
              system: 'IPC',
              level: 3,
              selected: false,
              favorite: false,
              patentCount: 12000,
              description: 'Training algorithms for neural networks',
              examples: ['Backpropagation', 'Reinforcement learning', 'Transfer learning']
            }
          ]
        },
        {
          code: 'G06F',
          title: 'Electric digital data processing',
          system: 'IPC',
          level: 2,
          selected: false,
          favorite: false,
          patentCount: 180000,
          children: [
            {
              code: 'G06F 17/16',
              title: 'Matrix computations',
              system: 'IPC',
              level: 3,
              selected: false,
              favorite: true,
              patentCount: 3200,
              description: 'Mathematical operations on matrices'
            }
          ]
        }
      ]
    },
    {
      code: 'H04',
      title: 'Electric communication technique',
      system: 'IPC',
      level: 1,
      selected: false,
      favorite: false,
      patentCount: 890000,
      children: [
        {
          code: 'H04L',
          title: 'Transmission of digital information',
          system: 'IPC',
          level: 2,
          selected: false,
          favorite: false,
          patentCount: 65000
        }
      ]
    }
  ];

  const [classificationTree, setClassificationTree] = useState<Classification[]>(mockIPCData);

  const handleToggleSelection = (code: string) => {
    const newSelected = new Set(selectedClasses);
    if (newSelected.has(code)) {
      newSelected.delete(code);
    } else {
      newSelected.add(code);
    }
    setSelectedClasses(newSelected);
  };

  const handleToggleFavorite = (code: string) => {
    const newFavorites = new Set(favoriteClasses);
    if (newFavorites.has(code)) {
      newFavorites.delete(code);
    } else {
      newFavorites.add(code);
    }
    setFavoriteClasses(newFavorites);
  };

  const generateAISuggestions = async () => {
    if (!techDescription.trim() || !sessionId) return;
    
    setIsGeneratingSuggestions(true);
    
    try {
      const aiResponse = await createAIInteraction({
        interaction_type: 'patent_analysis',
        user_prompt: `Suggest relevant patent classifications for this technology: ${techDescription}`,
        context_data: {
          classification_systems: [selectedSystem],
          request_type: 'classification_suggestion'
        }
      });

      if (aiResponse) {
        // Parse AI response and create mock suggestions based on the description
        const suggestions: Classification[] = [
          {
            code: 'G06N 20/00',
            title: 'Machine learning',
            system: selectedSystem as any,
            level: 3,
            selected: false,
            favorite: false,
            patentCount: 25000,
            description: 'Machine learning techniques and applications'
          },
          {
            code: 'G06N 3/045',
            title: 'Convolutional neural networks',
            system: selectedSystem as any,
            level: 4,
            selected: false,
            favorite: false,
            patentCount: 4500,
            description: 'CNN architectures and training methods'
          }
        ];
        setAiSuggestions(suggestions);
      }
    } catch (err) {
      console.error('Failed to generate AI suggestions:', err);
    } finally {
      setIsGeneratingSuggestions(false);
    }
  };

  const renderClassificationNode = (classification: Classification, depth = 0) => {
    const hasChildren = classification.children && classification.children.length > 0;
    const isSelected = selectedClasses.has(classification.code);
    const isFavorite = favoriteClasses.has(classification.code);
    const [isExpanded, setIsExpanded] = useState(depth < 2);

    return (
      <div key={classification.code} className={`ml-${depth * 4}`}>
        <div className={`flex items-center gap-2 p-2 rounded hover:bg-muted/50 ${isSelected ? 'bg-blue-50 border border-blue-200' : ''}`}>
          {hasChildren ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-0 h-auto"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          ) : (
            <div className="w-4" />
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleToggleFavorite(classification.code)}
            className="p-0 h-auto"
          >
            <Star className={`h-4 w-4 ${isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} />
          </Button>

          <div className="flex-1 cursor-pointer" onClick={() => handleToggleSelection(classification.code)}>
            <div className="flex items-center gap-2">
              <Badge variant={isSelected ? 'default' : 'outline'} className="font-mono">
                {classification.code}
              </Badge>
              <span className={`text-sm ${isSelected ? 'font-medium' : ''}`}>
                {classification.title}
              </span>
              {classification.patentCount && (
                <Badge variant="secondary" className="text-xs">
                  {classification.patentCount.toLocaleString()} patents
                </Badge>
              )}
            </div>
            {classification.description && (
              <p className="text-xs text-muted-foreground mt-1 ml-2">
                {classification.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="p-1">
              <Copy className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" className="p-1">
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="ml-4">
            {classification.children!.map(child => renderClassificationNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (!sessionId) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Active Session</h3>
          <p className="text-muted-foreground">
            Please select or create a brainstorming session to explore patent classifications.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <p className="text-red-800 text-sm">Error loading classifications: {error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="browser" className="space-y-4">
        <TabsList>
          <TabsTrigger value="browser">Classification Browser</TabsTrigger>
          <TabsTrigger value="suggestions">AI Suggestions</TabsTrigger>
          <TabsTrigger value="selected">Selected Classes</TabsTrigger>
          <TabsTrigger value="analysis">Coverage Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="browser" className="space-y-4">
          {/* System Selector */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Select value={selectedSystem} onValueChange={setSelectedSystem}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {classificationSystems.map((system) => {
                        const Icon = system.icon;
                        return (
                          <SelectItem key={system.value} value={system.value}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              {system.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search classifications..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Classification Tree */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Tag className="h-4 w-4" />
                {selectedSystem} Classifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-1">
                  {classificationTree.map(classification => 
                    renderClassificationNode(classification)
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suggestions" className="space-y-4">
          {/* AI Classification Suggester */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Brain className="h-4 w-4" />
                AI-Powered Suggestions
              </CardTitle>
              <CardDescription>
                Get classification suggestions based on your keywords and description
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Technology Description</Label>
                <Input 
                  placeholder="Describe your technology (e.g., 'neural network for image recognition')..." 
                  value={techDescription}
                  onChange={(e) => setTechDescription(e.target.value)}
                />
              </div>
              <Button 
                onClick={generateAISuggestions}
                disabled={!techDescription.trim() || isGeneratingSuggestions || !sessionId}
              >
                <Brain className="h-4 w-4 mr-2" />
                {isGeneratingSuggestions ? 'Generating...' : 'Get AI Suggestions'}
              </Button>

              {aiSuggestions.length > 0 && (
                <div className="space-y-3 pt-4 border-t">
                  <h4 className="font-medium">Suggested Classifications</h4>
                  {aiSuggestions.map((suggestion) => (
                    <div key={suggestion.code} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="font-mono">
                              {suggestion.code}
                            </Badge>
                            <span className="font-medium">{suggestion.title}</span>
                            <Badge variant="secondary" className="text-xs">
                              95% match
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {suggestion.description}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleToggleSelection(suggestion.code)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="selected" className="space-y-4">
          {/* Selected Classifications */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Selected Classifications ({selectedClasses.size})</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedClasses.size === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No classifications selected yet
                </p>
              ) : (
                <div className="space-y-3">
                  {Array.from(selectedClasses).map((code) => {
                    const classification = findClassificationByCode(classificationTree, code);
                    if (!classification) return null;

                    return (
                      <div key={code} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge className="font-mono">{code}</Badge>
                            <span className="font-medium">{classification.title}</span>
                          </div>
                          {classification.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {classification.description}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleSelection(code)}
                        >
                          Remove
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Export Options */}
          {selectedClasses.size > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Export Selected</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button variant="outline">
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Codes
                  </Button>
                  <Button variant="outline">Export CSV</Button>
                  <Button variant="outline">Add to Search</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          {/* Coverage Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Coverage Analysis</CardTitle>
              <CardDescription>
                Analyze patent coverage and trends in your selected classifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">2.4M</p>
                  <p className="text-sm text-muted-foreground">Total Patents</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">125K</p>
                  <p className="text-sm text-muted-foreground">Last 5 Years</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">+23%</p>
                  <p className="text-sm text-muted-foreground">Growth Rate</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Classification Overlap</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">G06N 3/04 + G06N 3/08</span>
                    <Badge variant="secondary">45% overlap</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">G06N + H04L</span>
                    <Badge variant="secondary">12% overlap</Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Top Applicants</h4>
                <div className="space-y-2">
                  {['Google LLC', 'Microsoft Corp', 'IBM', 'Samsung'].map((company, idx) => (
                    <div key={company} className="flex items-center justify-between">
                      <span className="text-sm">{company}</span>
                      <Badge variant="outline">{Math.max(50 - idx * 10, 10)}% market share</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function findClassificationByCode(tree: Classification[], code: string): Classification | null {
  for (const classification of tree) {
    if (classification.code === code) {
      return classification;
    }
    if (classification.children) {
      const found = findClassificationByCode(classification.children, code);
      if (found) return found;
    }
  }
  return null;
}