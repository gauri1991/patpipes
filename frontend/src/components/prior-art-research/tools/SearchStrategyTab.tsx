/**
 * Search Strategy Tab Component
 * Strategic planning for prior art searches based on project type and research data
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Search,
  Target,
  Shield,
  Gavel,
  Lightbulb,
  Map,
  CheckCircle,
  AlertCircle,
  Calendar,
  Globe,
  Database,
  Filter,
  ArrowRight,
  Play,
  Settings,
  Download,
  Save,
  Clock,
  TrendingUp
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';

import { PriorArtProject, PriorArtProjectType } from '@/types/prior-art.types';

interface SearchDatabase {
  id: string;
  name: string;
  description: string;
  coverage: string[];
  priority: 'high' | 'medium' | 'low';
  selected: boolean;
  estimatedResults?: number;
}

interface SearchPhase {
  id: string;
  name: string;
  description: string;
  databases: string[];
  keywords: string[];
  timeframe: string;
  completed: boolean;
}

interface SearchStrategy {
  approach: 'broad' | 'targeted' | 'iterative';
  priority: 'speed' | 'coverage' | 'precision';
  databases: string[];
  phases: SearchPhase[];
  timeEstimate: string;
  budgetEstimate?: string;
}

interface SearchStrategyTabProps {
  project: PriorArtProject;
  researchData: any;
  onProgressUpdate: (progress: number) => void;
  onDataUpdate: (data: any) => void;
  onProceedToSearch: () => void;
}

export function SearchStrategyTab({ 
  project, 
  researchData, 
  onProgressUpdate, 
  onDataUpdate,
  onProceedToSearch
}: SearchStrategyTabProps) {
  const [strategy, setStrategy] = useState<SearchStrategy>({
    approach: 'targeted',
    priority: 'precision',
    databases: [],
    phases: [],
    timeEstimate: '2-3 weeks'
  });
  
  const [databases, setDatabases] = useState<SearchDatabase[]>([
    {
      id: 'patent-db',
      name: 'Patent Databases',
      description: 'USPTO, EPO, WIPO, JPO patent collections',
      coverage: ['US', 'EP', 'WO', 'JP'],
      priority: 'high',
      selected: true,
      estimatedResults: 15000
    },
    {
      id: 'ieee-xplore',
      name: 'IEEE Xplore',
      description: 'Technical literature and conference papers',
      coverage: ['Technical Papers', 'Standards'],
      priority: 'high',
      selected: true,
      estimatedResults: 8000
    },
    {
      id: 'google-scholar',
      name: 'Google Scholar',
      description: 'Academic publications and citations',
      coverage: ['Academic', 'Research'],
      priority: 'medium',
      selected: false,
      estimatedResults: 25000
    },
    {
      id: 'tech-databases',
      name: 'Technical Databases',
      description: 'Industry standards and technical reports',
      coverage: ['Standards', 'Reports'],
      priority: 'medium',
      selected: false,
      estimatedResults: 5000
    }
  ]);

  const [selectedApproach, setSelectedApproach] = useState<'broad' | 'targeted' | 'iterative'>('targeted');
  const [coverageSlider, setCoverageSlider] = useState([75]);
  const [timelineSlider, setTimelineSlider] = useState([60]);

  useEffect(() => {
    // Initial strategy generation only
    if (strategy.phases.length === 0) {
      generateSearchStrategy();
    }
  }, []); // Only run once on mount

  const generateSearchStrategy = () => {
    const phases: SearchPhase[] = [];
    const selectedDbs = databases.filter(db => db.selected).map(db => db.id);

    // Generate phases based on project type and approach
    switch (project.type) {
      case PriorArtProjectType.INVALIDITY:
        phases.push(
          {
            id: 'phase-1',
            name: 'Broadest Claim Search',
            description: 'Search against the broadest independent claims',
            databases: selectedDbs,
            keywords: researchData.keywords?.selectedKeywords?.slice(0, 5) || [],
            timeframe: '3-5 days',
            completed: false
          },
          {
            id: 'phase-2',
            name: 'Specific Elements',
            description: 'Target specific claim elements and combinations',
            databases: selectedDbs.slice(0, 2),
            keywords: researchData.keywords?.selectedKeywords?.slice(5, 10) || [],
            timeframe: '5-7 days',
            completed: false
          },
          {
            id: 'phase-3',
            name: 'Alternative Implementations',
            description: 'Search for different ways to achieve same result',
            databases: ['tech-databases', 'google-scholar'],
            keywords: researchData.textAnalysis?.suggestedKeywords || [],
            timeframe: '2-3 days',
            completed: false
          }
        );
        break;

      case PriorArtProjectType.NOVELTY:
        phases.push(
          {
            id: 'phase-1',
            name: 'Core Technology Search',
            description: 'Search the fundamental technology area',
            databases: selectedDbs,
            keywords: researchData.keywords?.selectedKeywords?.slice(0, 8) || [],
            timeframe: '4-6 days',
            completed: false
          },
          {
            id: 'phase-2',
            name: 'Similar Solutions',
            description: 'Look for solutions to the same problem',
            databases: selectedDbs,
            keywords: researchData.textAnalysis?.priorArtTerms || [],
            timeframe: '3-4 days',
            completed: false
          }
        );
        break;

      case PriorArtProjectType.FTO:
        phases.push(
          {
            id: 'phase-1',
            name: 'Commercial Space Analysis',
            description: 'Search commercial patent landscape',
            databases: ['patent-db'],
            keywords: researchData.keywords?.selectedKeywords || [],
            timeframe: '5-7 days',
            completed: false
          },
          {
            id: 'phase-2',
            name: 'Blocking Patent Identification',
            description: 'Identify potential blocking patents',
            databases: selectedDbs,
            keywords: researchData.textAnalysis?.keyPhrases || [],
            timeframe: '4-5 days',
            completed: false
          }
        );
        break;

      default:
        phases.push({
          id: 'phase-1',
          name: 'Comprehensive Search',
          description: 'Broad search across relevant databases',
          databases: selectedDbs,
          keywords: researchData.keywords?.selectedKeywords || [],
          timeframe: '7-10 days',
          completed: false
        });
    }

    const newStrategy: SearchStrategy = {
      approach: selectedApproach,
      priority: coverageSlider[0] > 70 ? 'coverage' : timelineSlider[0] < 40 ? 'speed' : 'precision',
      databases: selectedDbs,
      phases,
      timeEstimate: calculateTimeEstimate(phases),
      budgetEstimate: calculateBudgetEstimate(phases, selectedDbs)
    };

    setStrategy(newStrategy);
    
    // Update progress based on strategy completeness
    const progress = selectedDbs.length > 0 && phases.length > 0 ? 85 : 50;
    onProgressUpdate(progress);
    
    // Only update parent if strategy has actually changed
    if (JSON.stringify(newStrategy) !== JSON.stringify(strategy)) {
      onDataUpdate({ strategy: newStrategy, approach: selectedApproach });
    }
  };

  const calculateTimeEstimate = (phases: SearchPhase[]): string => {
    const totalDays = phases.reduce((sum, phase) => {
      const days = parseInt(phase.timeframe.split('-')[1]) || 5;
      return sum + days;
    }, 0);
    
    const weeks = Math.ceil(totalDays / 7);
    return weeks === 1 ? '1 week' : `${weeks} weeks`;
  };

  const calculateBudgetEstimate = (phases: SearchPhase[], selectedDbs: string[]): string => {
    const dbCost = selectedDbs.length * 500; // Base cost per database
    const phaseCost = phases.length * 1000; // Cost per search phase
    const total = dbCost + phaseCost;
    return `$${(total / 1000).toFixed(1)}k - $${((total * 1.5) / 1000).toFixed(1)}k`;
  };

  const toggleDatabaseSelection = (dbId: string) => {
    const updated = databases.map(db => 
      db.id === dbId ? { ...db, selected: !db.selected } : db
    );
    setDatabases(updated);
  };

  const getProjectTypeIcon = (type: PriorArtProjectType) => {
    switch (type) {
      case PriorArtProjectType.INVALIDITY: return Gavel;
      case PriorArtProjectType.FTO: return Shield;
      case PriorArtProjectType.NOVELTY: return Lightbulb;
      case PriorArtProjectType.LANDSCAPE: return Map;
      default: return Search;
    }
  };

  const getApproachDescription = (approach: string) => {
    switch (approach) {
      case 'broad':
        return 'Cast a wide net to ensure comprehensive coverage';
      case 'targeted':
        return 'Focus on specific areas for efficient searching';
      case 'iterative':
        return 'Refine search based on initial results';
      default:
        return '';
    }
  };

  const ProjectIcon = getProjectTypeIcon(project.type);

  const isStrategyComplete = strategy.databases.length > 0 && strategy.phases.length > 0;

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-orange-50 rounded-lg">
          <Search className="h-5 w-5 text-orange-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Search Strategy</h3>
          <p className="text-sm text-muted-foreground">
            Plan systematic search approach for {project.type.replace('_', ' ')} analysis
          </p>
        </div>
      </div>

      {/* Strategy Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <ProjectIcon className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-base">
                {project.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Search Strategy
              </CardTitle>
              <CardDescription>
                Tailored approach for {project.name}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <div>
                <p className="font-medium capitalize">{strategy.approach}</p>
                <p className="text-sm text-muted-foreground">Approach</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-green-600" />
              <div>
                <p className="font-medium">{strategy.timeEstimate}</p>
                <p className="text-sm text-muted-foreground">Duration</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-purple-600" />
              <div>
                <p className="font-medium">{strategy.databases.length}</p>
                <p className="text-sm text-muted-foreground">Databases</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="approach" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="approach">Search Approach</TabsTrigger>
          <TabsTrigger value="databases">Databases</TabsTrigger>
          <TabsTrigger value="phases">Search Phases</TabsTrigger>
          <TabsTrigger value="execution">Execution Plan</TabsTrigger>
        </TabsList>

        <TabsContent value="approach" className="flex-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Search Approach</CardTitle>
              <CardDescription>
                Choose the strategic approach for your prior art search
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <RadioGroup value={selectedApproach} onValueChange={(value) => setSelectedApproach(value as 'broad' | 'targeted' | 'iterative')}>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3 p-4 border rounded-lg">
                    <RadioGroupItem value="broad" id="broad" className="mt-1" />
                    <div className="space-y-2">
                      <Label htmlFor="broad" className="text-base font-medium">Broad Search</Label>
                      <p className="text-sm text-muted-foreground">
                        Comprehensive coverage across all relevant databases and keywords. 
                        Best for novelty searches and landscape analysis.
                      </p>
                      <div className="flex gap-2">
                        <Badge variant="outline">High Coverage</Badge>
                        <Badge variant="outline">Longer Duration</Badge>
                        <Badge variant="outline">Higher Cost</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-4 border rounded-lg">
                    <RadioGroupItem value="targeted" id="targeted" className="mt-1" />
                    <div className="space-y-2">
                      <Label htmlFor="targeted" className="text-base font-medium">Targeted Search</Label>
                      <p className="text-sm text-muted-foreground">
                        Focus on specific areas identified in claim analysis. 
                        Best for invalidity searches and FTO analysis.
                      </p>
                      <div className="flex gap-2">
                        <Badge variant="outline">High Precision</Badge>
                        <Badge variant="outline">Efficient</Badge>
                        <Badge variant="outline">Cost Effective</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-4 border rounded-lg">
                    <RadioGroupItem value="iterative" id="iterative" className="mt-1" />
                    <div className="space-y-2">
                      <Label htmlFor="iterative" className="text-base font-medium">Iterative Search</Label>
                      <p className="text-sm text-muted-foreground">
                        Start with targeted search, then expand based on initial findings. 
                        Best when uncertainty exists about the prior art landscape.
                      </p>
                      <div className="flex gap-2">
                        <Badge variant="outline">Adaptive</Badge>
                        <Badge variant="outline">Risk Mitigation</Badge>
                        <Badge variant="outline">Flexible Timeline</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Coverage vs. Speed</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Coverage Priority</span>
                    <span>{coverageSlider[0]}%</span>
                  </div>
                  <Slider
                    value={coverageSlider}
                    onValueChange={setCoverageSlider}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Speed</span>
                    <span>Coverage</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Timeline Flexibility</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Timeline Buffer</span>
                    <span>{timelineSlider[0]}%</span>
                  </div>
                  <Slider
                    value={timelineSlider}
                    onValueChange={setTimelineSlider}
                    max={100}
                    step={10}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Tight</span>
                    <span>Flexible</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="databases" className="flex-1 space-y-4">
          <div className="space-y-4">
            {databases.map((database) => (
              <Card key={database.id} className={database.selected ? 'ring-2 ring-orange-200' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={database.selected}
                      onCheckedChange={() => toggleDatabaseSelection(database.id)}
                    />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{database.name}</h4>
                          <p className="text-sm text-muted-foreground">{database.description}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant={database.priority === 'high' ? 'default' : 'outline'}>
                            {database.priority}
                          </Badge>
                          {database.estimatedResults && (
                            <p className="text-xs text-muted-foreground mt-1">
                              ~{database.estimatedResults.toLocaleString()} results
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {database.coverage.map((item, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="phases" className="flex-1 space-y-4">
          <ScrollArea className="h-full">
            <div className="space-y-4">
              {strategy.phases.map((phase, index) => (
                <Card key={phase.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-orange-600">{index + 1}</span>
                      </div>
                      <div>
                        <CardTitle className="text-base">{phase.name}</CardTitle>
                        <CardDescription>{phase.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-3">
                      <div>
                        <Label className="text-sm font-medium">Databases</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {phase.databases.map((dbId, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {databases.find(db => db.id === dbId)?.name.split(' ')[0] || dbId}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Keywords</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {phase.keywords.slice(0, 3).map((keyword, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {keyword}
                            </Badge>
                          ))}
                          {phase.keywords.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{phase.keywords.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Timeline</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{phase.timeframe}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="execution" className="flex-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Execution Summary</CardTitle>
              <CardDescription>
                Complete strategy overview and next steps
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Phases:</span>
                    <span className="font-medium">{strategy.phases.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Estimated Duration:</span>
                    <span className="font-medium">{strategy.timeEstimate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Budget Estimate:</span>
                    <span className="font-medium">{strategy.budgetEstimate}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Databases:</span>
                    <span className="font-medium">{strategy.databases.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Keywords:</span>
                    <span className="font-medium">
                      {researchData.keywords?.selectedKeywords?.length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Priority:</span>
                    <Badge variant="outline" className="capitalize">
                      {strategy.priority}
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator />

              {isStrategyComplete && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Search strategy is complete and ready for execution. All required elements have been defined.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline"
                  onClick={() => generateSearchStrategy()}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Regenerate Strategy
                </Button>
                <Button variant="outline">
                  <Save className="h-4 w-4 mr-2" />
                  Save Strategy
                </Button>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export Plan
                </Button>
                <Button onClick={onProceedToSearch} disabled={!isStrategyComplete}>
                  <Play className="h-4 w-4 mr-2" />
                  Begin Search
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}