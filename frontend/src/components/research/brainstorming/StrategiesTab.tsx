'use client';

import { useState, useEffect } from 'react';
import { useBrainstorming } from '@/hooks/useBrainstorming';
import {
  Target,
  Shield,
  Search,
  TrendingUp,
  Users,
  Zap,
  CheckCircle,
  Clock,
  AlertTriangle,
  Plus,
  Copy,
  Edit2,
  Play,
  Save,
  FileText,
  Calendar
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

interface SearchStrategy {
  id: string;
  name: string;
  type: 'fto' | 'prior_art' | 'invalidity' | 'competitive' | 'white_space' | 'state_of_art';
  description: string;
  steps: StrategyStep[];
  estimatedTime: number;
  complexity: 'low' | 'medium' | 'high';
  coverage: string[];
  created: Date;
  lastUsed?: Date;
  successRate: number;
}

interface StrategyStep {
  id: string;
  title: string;
  description: string;
  type: 'keywords' | 'classifications' | 'search' | 'analysis' | 'review';
  required: boolean;
  estimatedTime: number;
  completed: boolean;
  resources?: string[];
}

interface StrategiesTabProps {
  projectId: string;
  sessionId: string | null;
}

export function StrategiesTab({ projectId, sessionId }: StrategiesTabProps) {
  const {
    strategies: apiStrategies,
    createStrategy,
    loading,
    error
  } = useBrainstorming(projectId);
  const [strategies, setStrategies] = useState<SearchStrategy[]>([]);

  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);
  const [isCreatingStrategy, setIsCreatingStrategy] = useState(false);
  const [newStrategy, setNewStrategy] = useState({
    name: '',
    type: 'fto' as SearchStrategy['type'],
    description: '',
    complexity: 'medium' as SearchStrategy['complexity']
  });

  const strategyTemplates: { type: SearchStrategy['type']; name: string; icon: any; description: string; steps: number; time: string; color: string }[] = [
    {
      type: 'fto',
      name: 'Freedom-to-Operate Analysis',
      icon: Shield,
      description: 'Identify potential patent obstacles for product commercialization',
      steps: 6,
      time: '4-8 hours',
      color: 'bg-blue-100 text-blue-700'
    },
    {
      type: 'prior_art',
      name: 'Prior Art Search',
      icon: Search,
      description: 'Find relevant prior art for patent application or examination',
      steps: 4,
      time: '2-4 hours',
      color: 'bg-green-100 text-green-700'
    },
    {
      type: 'invalidity',
      name: 'Invalidity Search',
      icon: Target,
      description: 'Find prior art to challenge existing patent claims',
      steps: 5,
      time: '6-12 hours',
      color: 'bg-red-100 text-red-700'
    },
    {
      type: 'competitive',
      name: 'Competitive Intelligence',
      icon: Users,
      description: 'Analyze competitor patent portfolios and strategies',
      steps: 7,
      time: '8-16 hours',
      color: 'bg-purple-100 text-purple-700'
    },
    {
      type: 'white_space',
      name: 'White Space Analysis',
      icon: TrendingUp,
      description: 'Identify technology gaps and opportunities',
      steps: 5,
      time: '6-10 hours',
      color: 'bg-orange-100 text-orange-700'
    },
    {
      type: 'state_of_art',
      name: 'State of the Art',
      icon: Zap,
      description: 'Comprehensive technology landscape analysis',
      steps: 8,
      time: '12-20 hours',
      color: 'bg-indigo-100 text-indigo-700'
    }
  ];

  const handleCreateStrategy = (templateType: SearchStrategy['type']) => {
    const template = strategyTemplates.find(t => t.type === templateType);
    if (!template) return;

    setNewStrategy({
      name: template.name,
      type: templateType,
      description: template.description,
      complexity: 'medium'
    });
    setIsCreatingStrategy(true);
  };

  const handleSaveStrategy = async () => {
    if (!newStrategy.name.trim() || !sessionId) return;

    const strategyData = {
      name: newStrategy.name,
      description: newStrategy.description,
      strategy_type: newStrategy.type === 'fto' ? 'freedom_to_operate' : 
                     newStrategy.type === 'state_of_art' ? 'landscape' : newStrategy.type,
      search_domains: ['patents'],
      api_preferences: ['USPTO', 'EPO'],
      geographic_focus: ['US', 'EP'],
      priority_level: newStrategy.complexity === 'low' ? 1 : 
                      newStrategy.complexity === 'medium' ? 3 : 5,
      estimated_time: 240
    };

    const result = await createStrategy(strategyData);
    if (result) {
      // Convert API strategy to local format for display
      const strategy: SearchStrategy = {
        id: result.id,
        name: result.name,
        type: newStrategy.type,
        description: result.description,
        steps: generateTemplateSteps(newStrategy.type),
        estimatedTime: result.estimated_time || 240,
        complexity: newStrategy.complexity,
        coverage: result.geographic_focus || ['US', 'EP'],
        created: new Date(result.created_at),
        successRate: 0
      };

      setStrategies([...strategies, strategy]);
      setIsCreatingStrategy(false);
      setNewStrategy({ name: '', type: 'fto', description: '', complexity: 'medium' });
    }
  };

  const generateTemplateSteps = (type: SearchStrategy['type']): StrategyStep[] => {
    const baseSteps: Record<string, StrategyStep[]> = {
      fto: [
        {
          id: '1',
          title: 'Technology Definition',
          description: 'Define the specific technology features to be analyzed',
          type: 'analysis',
          required: true,
          estimatedTime: 60,
          completed: false
        },
        {
          id: '2',
          title: 'Keyword Development',
          description: 'Create comprehensive keyword sets',
          type: 'keywords',
          required: true,
          estimatedTime: 90,
          completed: false
        },
        {
          id: '3',
          title: 'Classification Research',
          description: 'Identify relevant patent classifications',
          type: 'classifications',
          required: true,
          estimatedTime: 45,
          completed: false
        },
        {
          id: '4',
          title: 'Patent Search Execution',
          description: 'Execute comprehensive patent searches',
          type: 'search',
          required: true,
          estimatedTime: 120,
          completed: false
        },
        {
          id: '5',
          title: 'Results Analysis',
          description: 'Analyze search results for relevance and risk',
          type: 'analysis',
          required: true,
          estimatedTime: 180,
          completed: false
        },
        {
          id: '6',
          title: 'FTO Report Generation',
          description: 'Generate comprehensive FTO assessment report',
          type: 'review',
          required: true,
          estimatedTime: 120,
          completed: false
        }
      ],
      prior_art: [
        {
          id: '1',
          title: 'Claims Analysis',
          description: 'Analyze patent claims to understand scope',
          type: 'analysis',
          required: true,
          estimatedTime: 45,
          completed: false
        },
        {
          id: '2',
          title: 'Search Strategy Development',
          description: 'Develop targeted search strategy',
          type: 'keywords',
          required: true,
          estimatedTime: 60,
          completed: false
        },
        {
          id: '3',
          title: 'Multi-database Search',
          description: 'Search across multiple patent and literature databases',
          type: 'search',
          required: true,
          estimatedTime: 120,
          completed: false
        },
        {
          id: '4',
          title: 'Prior Art Report',
          description: 'Document relevant prior art findings',
          type: 'review',
          required: true,
          estimatedTime: 90,
          completed: false
        }
      ]
    };

    return baseSteps[type] || baseSteps.fto;
  };

  const getStrategyProgress = (strategy: SearchStrategy) => {
    const completedSteps = strategy.steps.filter(s => s.completed).length;
    return Math.round((completedSteps / strategy.steps.length) * 100);
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'low': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'high': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  // Update strategies from API data
  useEffect(() => {
    if (apiStrategies && apiStrategies.length > 0) {
      const formattedStrategies: SearchStrategy[] = apiStrategies.map(apiStrategy => ({
        id: apiStrategy.id,
        name: apiStrategy.name,
        type: 'fto', // Default mapping - could be enhanced based on strategy_type
        description: apiStrategy.description,
        steps: generateTemplateSteps('fto'), // Default steps
        estimatedTime: apiStrategy.estimated_time || 240,
        complexity: apiStrategy.priority_level <= 2 ? 'low' : 
                     apiStrategy.priority_level <= 4 ? 'medium' : 'high',
        coverage: apiStrategy.geographic_focus || ['US', 'EP'],
        created: new Date(apiStrategy.created_at),
        lastUsed: apiStrategy.updated_at ? new Date(apiStrategy.updated_at) : undefined,
        successRate: Math.round(apiStrategy.success_rate * 100) || 0
      }));
      setStrategies(formattedStrategies);
    }
  }, [apiStrategies]);

  if (!sessionId) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Active Session</h3>
          <p className="text-muted-foreground">
            Please select or create a brainstorming session to build research strategies.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <p className="text-red-800 text-sm">Error loading strategies: {error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="templates" className="space-y-4">
        <TabsList>
          <TabsTrigger value="templates">Strategy Templates</TabsTrigger>
          <TabsTrigger value="saved">My Strategies</TabsTrigger>
          <TabsTrigger value="active">Active Workflows</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          {/* Strategy Templates */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {strategyTemplates.map((template) => {
              const Icon = template.icon;
              return (
                <Card key={template.type} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${template.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-sm">{template.name}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {template.steps} steps
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {template.time}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {template.description}
                    </p>
                    <Button 
                      onClick={() => handleCreateStrategy(template.type)}
                      className="w-full"
                      size="sm"
                      disabled={!sessionId}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Use Template
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Custom Strategy Builder */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Create Custom Strategy</CardTitle>
              <CardDescription>
                Build a custom search strategy from scratch
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={() => setIsCreatingStrategy(true)} disabled={!sessionId}>
                <Plus className="h-4 w-4 mr-2" />
                Build Custom Strategy
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="saved" className="space-y-4">
          {/* Saved Strategies */}
          <div className="space-y-4">
            {strategies.map((strategy) => (
              <Card key={strategy.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">{strategy.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={getComplexityColor(strategy.complexity)}>
                          {strategy.complexity} complexity
                        </Badge>
                        <Badge variant="outline">
                          {formatTime(strategy.estimatedTime)}
                        </Badge>
                        <Badge variant="outline">
                          {strategy.coverage.join(', ')}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline">
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button size="sm">
                        <Play className="h-4 w-4 mr-1" />
                        Start
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {strategy.description}
                  </p>

                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Progress</span>
                      <span>{getStrategyProgress(strategy)}% complete</span>
                    </div>
                    <Progress value={getStrategyProgress(strategy)} />
                  </div>

                  {/* Steps Preview */}
                  <div className="space-y-2">
                    <Label className="text-sm">Steps ({strategy.steps.length})</Label>
                    <div className="space-y-1">
                      {strategy.steps.slice(0, 3).map((step) => (
                        <div key={step.id} className="flex items-center gap-2 text-sm">
                          {step.completed ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <Clock className="h-4 w-4 text-gray-400" />
                          )}
                          <span className={step.completed ? 'line-through text-muted-foreground' : ''}>
                            {step.title}
                          </span>
                        </div>
                      ))}
                      {strategy.steps.length > 3 && (
                        <div className="text-sm text-muted-foreground">
                          +{strategy.steps.length - 3} more steps
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 pt-2 border-t text-center">
                    <div>
                      <p className="text-sm font-medium">{strategy.successRate}%</p>
                      <p className="text-xs text-muted-foreground">Success Rate</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {new Date(strategy.created).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-muted-foreground">Created</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {strategy.lastUsed ? new Date(strategy.lastUsed).toLocaleDateString() : 'Never'}
                      </p>
                      <p className="text-xs text-muted-foreground">Last Used</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          {/* Active Workflows */}
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Active Workflows</h3>
              <p className="text-muted-foreground mb-4">
                Start a strategy workflow to track your progress
              </p>
              <Button>
                <Play className="h-4 w-4 mr-2" />
                Start New Workflow
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Strategy Modal */}
      {isCreatingStrategy && (
        <Card className="border-2 border-blue-200">
          <CardHeader>
            <CardTitle className="text-sm">Create New Strategy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Strategy Name</Label>
                <Input
                  placeholder="Enter strategy name..."
                  value={newStrategy.name}
                  onChange={(e) => setNewStrategy({ ...newStrategy, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={newStrategy.type}
                  onValueChange={(value: any) => setNewStrategy({ ...newStrategy, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {strategyTemplates.map((template) => (
                      <SelectItem key={template.type} value={template.type}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Describe the purpose and scope of this strategy..."
                value={newStrategy.description}
                onChange={(e) => setNewStrategy({ ...newStrategy, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Complexity</Label>
              <Select
                value={newStrategy.complexity}
                onValueChange={(value: any) => setNewStrategy({ ...newStrategy, complexity: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low - Simple searches</SelectItem>
                  <SelectItem value="medium">Medium - Standard analysis</SelectItem>
                  <SelectItem value="high">High - Comprehensive study</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreatingStrategy(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveStrategy} disabled={loading || !sessionId}>
                <Save className="h-4 w-4 mr-2" />
                Create Strategy
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}