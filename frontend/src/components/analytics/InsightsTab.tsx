'use client';

import { useState, useMemo, useEffect } from 'react';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Target, 
  Lightbulb, 
  BarChart3, 
  RefreshCw, 
  Clock, 
  Zap, 
  Eye, 
  Filter,
  ChevronDown,
  ChevronRight,
  Star,
  ThumbsUp,
  ThumbsDown,
  Share,
  Download,
  Bookmark,
  Users,
  Globe,
  Calendar,
  Edit,
  Trash2,
  Settings,
  Sparkles,
  Plus,
  CheckSquare,
  Square,
  MoreHorizontal
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

import { aiInsightsService } from '@/services/insightsService';
import { AnalyticsInsight } from '@/services/analyticsApi';
import { toast } from 'sonner';

// Mock data for AI insights
const mockInsights = {
  trend_analysis: [
    {
      id: '1',
      title: 'AI/ML Patent Filings Surge',
      type: 'trend_analysis' as const,
      description: 'Machine learning and AI-related patent filings have increased by 45% over the past 18 months, with particular growth in computer vision and natural language processing domains.',
      confidence_level: 'high' as const,
      impact_score: 92,
      priority: 'high' as const,
      supporting_data: {
        growth_rate: 45,
        time_period: '18 months',
        key_domains: ['Computer Vision', 'NLP', 'Reinforcement Learning'],
        filing_count: 2847,
        previous_period: 1965
      },
      recommended_actions: [
        'Monitor emerging AI patent clusters',
        'Identify key inventors and assignees in high-growth areas',
        'Assess potential licensing opportunities',
        'Review R&D investment alignment with market trends'
      ],
      created_at: '2024-01-15T10:30:00Z'
    },
    {
      id: '2',
      title: 'Quantum Computing Patent Landscape Shift',
      type: 'technology_emergence' as const,
      description: 'Quantum computing patents show diversification beyond hardware into quantum algorithms and error correction, indicating market maturation.',
      confidence_level: 'medium' as const,
      impact_score: 78,
      priority: 'medium' as const,
      supporting_data: {
        algorithm_patents: 234,
        hardware_patents: 567,
        error_correction_patents: 145,
        total_growth: 28
      },
      recommended_actions: [
        'Track quantum algorithm patent clusters',
        'Monitor Google, IBM, and startup activity',
        'Evaluate quantum software investment opportunities'
      ],
      created_at: '2024-01-14T14:20:00Z'
    }
  ],
  competitive_intelligence: [
    {
      id: '3',
      title: 'Tesla\'s Autonomous Driving Patent Strategy',
      type: 'competitive_gap' as const,
      description: 'Tesla has significantly increased patent filings in sensor fusion and edge computing for autonomous vehicles, creating potential defensive barriers.',
      confidence_level: 'high' as const,
      impact_score: 85,
      priority: 'high' as const,
      supporting_data: {
        tesla_filings: 127,
        sensor_fusion: 45,
        edge_computing: 38,
        defensive_patents: 89
      },
      recommended_actions: [
        'Analyze Tesla\'s patent portfolio for white spaces',
        'Identify potential design-around opportunities',
        'Consider strategic partnerships or cross-licensing'
      ],
      created_at: '2024-01-13T09:15:00Z'
    }
  ],
  market_opportunities: [
    {
      id: '4',
      title: 'Green Technology Patent White Space',
      type: 'opportunity_identification' as const,
      description: 'Significant patent filing gaps identified in carbon capture integration with renewable energy systems, presenting innovation opportunities.',
      confidence_level: 'medium' as const,
      impact_score: 73,
      priority: 'medium' as const,
      supporting_data: {
        total_green_tech: 1234,
        carbon_capture: 89,
        renewable_integration: 156,
        gap_score: 0.73
      },
      recommended_actions: [
        'Investigate R&D feasibility for carbon-renewable integration',
        'File provisional patents in identified white spaces',
        'Monitor competitor activity in related areas'
      ],
      created_at: '2024-01-12T16:45:00Z'
    }
  ],
  risk_assessment: [
    {
      id: '5',
      title: 'Patent Expiration Risk - Core Technologies',
      type: 'patent_expiration' as const,
      description: 'Key patents in the company\'s core technology portfolio are approaching expiration, potentially exposing competitive advantages.',
      confidence_level: 'high' as const,
      impact_score: 94,
      priority: 'urgent' as const,
      supporting_data: {
        expiring_2024: 23,
        expiring_2025: 34,
        expiring_2026: 18,
        core_tech_affected: ['Encryption', 'Data Processing', 'UI/UX']
      },
      recommended_actions: [
        'File continuation patents where possible',
        'Develop next-generation technologies',
        'Consider trade secret protection for some innovations',
        'Evaluate licensing strategies for expiring patents'
      ],
      created_at: '2024-01-11T11:30:00Z'
    }
  ]
};

interface InsightCardProps {
  insight: AnalyticsInsight;
  onRate: (id: string, rating: 'up' | 'down') => void;
  onEdit: (insight: AnalyticsInsight) => void;
  onDelete: (id: string) => void;
  isSelected?: boolean;
  onSelect?: (id: string, selected: boolean) => void;
}

function InsightCard({ insight, onRate, onEdit, onDelete, isSelected = false, onSelect }: InsightCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'trend_analysis': return TrendingUp;
      case 'technology_emergence': return Zap;
      case 'competitive_gap': return Target;
      case 'opportunity_identification': return Lightbulb;
      case 'patent_expiration': return AlertTriangle;
      case 'risk_assessment': return AlertTriangle;
      default: return Brain;
    }
  };

  const getConfidenceColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const Icon = getInsightIcon(insight.insight_type);

  return (
    <Card className={`relative ${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
      <CardHeader className="pb-3">
        {onSelect && (
          <div className="absolute top-3 right-3 z-10">
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) => onSelect(insight.id, Boolean(checked))}
            />
          </div>
        )}
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
            <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between">
              <CardTitle className="text-base leading-tight">{insight.title}</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant={getPriorityVariant(insight.priority)} className="text-xs">
                  {insight.priority}
                </Badge>
              </div>
            </div>
            <CardDescription className="text-sm">
              {insight.description}
            </CardDescription>
          </div>
        </div>
        
        <div className="flex items-center gap-4 pt-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Confidence:</span>
            <div className={`w-2 h-2 rounded-full ${getConfidenceColor(insight.confidence_level)}`} />
            <span className="text-xs capitalize">{insight.confidence_level}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Impact:</span>
            <span className="text-xs font-medium">{insight.impact_score}/100</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {new Date(insight.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          <Progress value={insight.impact_score} className="h-2" />
          
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-start p-0 h-auto">
                <div className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  View Details & Recommendations
                </div>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4">
              <Separator />
              
              {/* Supporting Data */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Supporting Data</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {Object.entries(insight.supporting_data).map(([key, value]) => (
                    <div key={key}>
                      <span className="text-muted-foreground capitalize">
                        {key.replace(/_/g, ' ')}:
                      </span>
                      <p className="font-medium">
                        {Array.isArray(value) ? value.join(', ') : value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Recommended Actions */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Recommended Actions</h4>
                <ul className="space-y-1 text-sm">
                  {insight.recommended_actions.map((action, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Target className="h-3 w-3 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => onRate(insight.id, 'up')}
                  className="h-8 w-8 p-0"
                >
                  <ThumbsUp className="h-3 w-3" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => onRate(insight.id, 'down')}
                  className="h-8 w-8 p-0"
                >
                  <ThumbsDown className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Bookmark className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Share className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline">
                  <Eye className="mr-2 h-3 w-3" />
                  Details
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(insight)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Insight
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => onDelete(insight.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface InsightsTabProps {
  projectId?: string;
  project?: any;
}

export function InsightsTab({ projectId, project }: InsightsTabProps = {}) {
  const [filterType, setFilterType] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [isGenerating, setIsGenerating] = useState(false);
  const [insights, setInsights] = useState<AnalyticsInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInsights, setSelectedInsights] = useState<Set<string>>(new Set());
  const [editingInsight, setEditingInsight] = useState<AnalyticsInsight | null>(null);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [generateOptions, setGenerateOptions] = useState({
    categories: ['trend_analysis', 'competitive_gap', 'opportunity_identification', 'risk_assessment'],
    priority: 'all',
    count: 5
  });

  // Load initial insights
  useEffect(() => {
    const loadInitialInsights = async () => {
      try {
        setLoading(true);
        // Convert mock data to AnalyticsInsight format
        const mockAsInsights: AnalyticsInsight[] = [
          ...mockInsights.trend_analysis,
          ...mockInsights.competitive_intelligence,
          ...mockInsights.market_opportunities,
          ...mockInsights.risk_assessment
        ].map(mock => ({
          id: mock.id,
          title: mock.title,
          insight_type: mock.type,
          description: mock.description,
          supporting_data: mock.supporting_data,
          confidence_level: mock.confidence_level,
          impact_score: mock.impact_score,
          recommended_actions: mock.recommended_actions,
          priority: mock.priority,
          is_actionable: true,
          is_reviewed: false,
          created_at: mock.created_at,
          updated_at: mock.created_at
        }));
        
        setInsights(mockAsInsights);
      } catch (error) {
        console.error('Error loading insights:', error);
        toast.error('Failed to load insights');
      } finally {
        setLoading(false);
      }
    };

    loadInitialInsights();
  }, []);

  // All insights sorted by date
  const allInsights = useMemo(() => {
    return insights.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [insights]);

  // Filter insights
  const filteredInsights = useMemo(() => {
    return allInsights.filter(insight => {
      if (filterType !== 'all' && insight.insight_type !== filterType) return false;
      if (filterPriority !== 'all' && insight.priority !== filterPriority) return false;
      return true;
    });
  }, [allInsights, filterType, filterPriority]);

  const handleGenerateInsights = async (options = generateOptions) => {
    setIsGenerating(true);
    setShowGenerateDialog(false);
    try {
      toast.info('Generating AI insights...', {
        description: `Analyzing patent data for ${options.categories.length} categories`
      });
      
      // Generate new insights using AI service with options
      const newInsights = await aiInsightsService.generateComprehensiveInsights(
        projectId || 'default-project'
      );
      
      // Add new insights to existing ones
      setInsights(prev => [...newInsights, ...prev]);
      
      toast.success(`Generated ${newInsights.length} new insights`, {
        description: 'AI analysis completed successfully'
      });
    } catch (error) {
      console.error('Error generating insights:', error);
      toast.error('Failed to generate insights', {
        description: 'Please try again later'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEditInsight = (insight: AnalyticsInsight) => {
    setEditingInsight(insight);
  };

  const handleUpdateInsight = async (updatedInsight: AnalyticsInsight) => {
    try {
      setInsights(prev => prev.map(insight => 
        insight.id === updatedInsight.id ? updatedInsight : insight
      ));
      setEditingInsight(null);
      toast.success('Insight updated successfully');
    } catch (error) {
      console.error('Error updating insight:', error);
      toast.error('Failed to update insight');
    }
  };

  const handleDeleteInsight = async (id: string) => {
    try {
      setInsights(prev => prev.filter(insight => insight.id !== id));
      setSelectedInsights(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
      toast.success('Insight deleted successfully');
    } catch (error) {
      console.error('Error deleting insight:', error);
      toast.error('Failed to delete insight');
    }
  };

  const handleSelectInsight = (id: string, selected: boolean) => {
    setSelectedInsights(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  };

  const handleBulkDelete = async () => {
    try {
      setInsights(prev => prev.filter(insight => !selectedInsights.has(insight.id)));
      setSelectedInsights(new Set());
      toast.success(`Deleted ${selectedInsights.size} insights`);
    } catch (error) {
      console.error('Error deleting insights:', error);
      toast.error('Failed to delete insights');
    }
  };

  const selectAllInsights = () => {
    const allIds = new Set(filteredInsights.map(insight => insight.id));
    setSelectedInsights(allIds);
  };

  const deselectAllInsights = () => {
    setSelectedInsights(new Set());
  };

  const handleRateInsight = async (id: string, rating: 'up' | 'down') => {
    try {
      await aiInsightsService.rateInsight(id, rating === 'up' ? 'helpful' : 'not_helpful');
      toast.success('Feedback recorded', {
        description: 'Thanks for helping improve our AI insights'
      });
    } catch (error) {
      console.error('Error rating insight:', error);
      toast.error('Failed to record feedback');
    }
  };

  // Summary statistics
  const summaryStats = useMemo(() => {
    const total = allInsights.length;
    const highPriority = allInsights.filter(i => i.priority === 'urgent' || i.priority === 'high').length;
    const avgImpact = total > 0 ? Math.round(allInsights.reduce((sum, i) => sum + i.impact_score, 0) / total) : 0;
    const byType = allInsights.reduce((acc, insight) => {
      acc[insight.insight_type] = (acc[insight.insight_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { total, highPriority, avgImpact, byType };
  }, [allInsights]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">AI-Powered Insights</h2>
          <p className="text-muted-foreground">
            {project ? 
              `Machine learning insights for ${project.name}` : 
              'Machine learning analysis of patent landscapes, trends, and opportunities'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedInsights.size > 0 && (
            <>
              <Button variant="outline" size="sm" onClick={handleBulkDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete {selectedInsights.size}
              </Button>
              <Button variant="outline" size="sm" onClick={deselectAllInsights}>
                Clear Selection
              </Button>
            </>
          )}
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                disabled={isGenerating}
                size="sm"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Insights
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Quick Generate</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleGenerateInsights()}>
                <Brain className="mr-2 h-4 w-4" />
                All Categories (5 insights)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleGenerateInsights({...generateOptions, categories: ['trend_analysis'], count: 3})}>
                <TrendingUp className="mr-2 h-4 w-4" />
                Trend Analysis Only
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleGenerateInsights({...generateOptions, categories: ['competitive_gap'], count: 3})}>
                <Target className="mr-2 h-4 w-4" />
                Competitive Intelligence
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleGenerateInsights({...generateOptions, categories: ['risk_assessment'], count: 3})}>
                <AlertTriangle className="mr-2 h-4 w-4" />
                Risk Assessment
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowGenerateDialog(true)}>
                <Settings className="mr-2 h-4 w-4" />
                Custom Options...
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Insights</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.total}</div>
            <p className="text-xs text-muted-foreground">
              AI-generated insights
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.highPriority}</div>
            <p className="text-xs text-muted-foreground">
              Require immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Impact Score</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.avgImpact}</div>
            <p className="text-xs text-muted-foreground">
              Out of 100 points
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(summaryStats.byType).length}</div>
            <p className="text-xs text-muted-foreground">
              Insight categories
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Bulk Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="trend_analysis">Trend Analysis</SelectItem>
              <SelectItem value="competitive_gap">Competitive Intelligence</SelectItem>
              <SelectItem value="opportunity_identification">Market Opportunities</SelectItem>
              <SelectItem value="patent_expiration">Risk Assessment</SelectItem>
              <SelectItem value="technology_emergence">Technology Emergence</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter by priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>

          <div className="text-sm text-muted-foreground">
            Showing {filteredInsights.length} of {allInsights.length} insights
          </div>
        </div>

        <div className="flex items-center gap-2">
          {filteredInsights.length > 0 && (
            <>
              <Button variant="outline" size="sm" onClick={selectAllInsights}>
                <CheckSquare className="mr-2 h-4 w-4" />
                Select All
              </Button>
              {selectedInsights.size > 0 && (
                <Button variant="outline" size="sm" onClick={deselectAllInsights}>
                  <Square className="mr-2 h-4 w-4" />
                  Deselect All
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Insights Grid */}
      {loading ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-gray-200 rounded-lg animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 bg-gray-100 rounded animate-pulse w-3/4" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-2 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {filteredInsights.map((insight) => (
            <InsightCard 
              key={insight.id} 
              insight={insight} 
              onRate={handleRateInsight}
              onEdit={handleEditInsight}
              onDelete={handleDeleteInsight}
              isSelected={selectedInsights.has(insight.id)}
              onSelect={handleSelectInsight}
            />
          ))}
        </div>
      )}

      {!loading && filteredInsights.length === 0 && (
        <div className="text-center py-12">
          <Brain className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">No insights found</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Try adjusting your filters or generate new insights from your patent data.
          </p>
        </div>
      )}

      {/* Generate Insights Dialog */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Generate Custom Insights</DialogTitle>
            <DialogDescription>
              Configure the AI insights generation to focus on specific areas of analysis.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="categories">Categories to Analyze</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'trend_analysis', label: 'Trend Analysis', icon: TrendingUp },
                  { id: 'competitive_gap', label: 'Competitive Intel', icon: Target },
                  { id: 'opportunity_identification', label: 'Market Opportunities', icon: Lightbulb },
                  { id: 'risk_assessment', label: 'Risk Assessment', icon: AlertTriangle }
                ].map(({ id, label, icon: Icon }) => (
                  <div key={id} className="flex items-center space-x-2">
                    <Checkbox
                      id={id}
                      checked={generateOptions.categories.includes(id)}
                      onCheckedChange={(checked) => {
                        setGenerateOptions(prev => ({
                          ...prev,
                          categories: checked 
                            ? [...prev.categories, id]
                            : prev.categories.filter(c => c !== id)
                        }));
                      }}
                    />
                    <Label htmlFor={id} className="flex items-center gap-2 text-sm">
                      <Icon className="h-4 w-4" />
                      {label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="count">Number of Insights</Label>
              <Select 
                value={generateOptions.count.toString()} 
                onValueChange={(value) => setGenerateOptions(prev => ({ ...prev, count: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 insights</SelectItem>
                  <SelectItem value="5">5 insights</SelectItem>
                  <SelectItem value="10">10 insights</SelectItem>
                  <SelectItem value="15">15 insights</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="priority">Priority Focus</Label>
              <Select 
                value={generateOptions.priority} 
                onValueChange={(value) => setGenerateOptions(prev => ({ ...prev, priority: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="urgent">Urgent Only</SelectItem>
                  <SelectItem value="high">High Priority</SelectItem>
                  <SelectItem value="medium">Medium Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGenerateDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => handleGenerateInsights(generateOptions)}
              disabled={generateOptions.categories.length === 0 || isGenerating}
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Insights
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Insight Dialog */}
      <Dialog open={!!editingInsight} onOpenChange={() => setEditingInsight(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Insight</DialogTitle>
            <DialogDescription>
              Modify the insight details and recommendations.
            </DialogDescription>
          </DialogHeader>
          {editingInsight && (
            <EditInsightForm 
              insight={editingInsight}
              onSave={handleUpdateInsight}
              onCancel={() => setEditingInsight(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Edit Insight Form Component
interface EditInsightFormProps {
  insight: AnalyticsInsight;
  onSave: (insight: AnalyticsInsight) => void;
  onCancel: () => void;
}

function EditInsightForm({ insight, onSave, onCancel }: EditInsightFormProps) {
  const [formData, setFormData] = useState({
    title: insight.title,
    description: insight.description,
    priority: insight.priority,
    confidence_level: insight.confidence_level,
    impact_score: insight.impact_score,
    recommended_actions: insight.recommended_actions.join('\n')
  });

  const handleSave = () => {
    const updatedInsight: AnalyticsInsight = {
      ...insight,
      title: formData.title,
      description: formData.description,
      priority: formData.priority,
      confidence_level: formData.confidence_level,
      impact_score: formData.impact_score,
      recommended_actions: formData.recommended_actions.split('\n').filter(action => action.trim()),
      updated_at: new Date().toISOString()
    };
    onSave(updatedInsight);
  };

  return (
    <div className="grid gap-4 py-4">
      <div className="grid gap-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          rows={3}
        />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="priority">Priority</Label>
          <Select 
            value={formData.priority} 
            onValueChange={(value: 'urgent' | 'high' | 'medium' | 'low') => setFormData(prev => ({ ...prev, priority: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="confidence">Confidence</Label>
          <Select 
            value={formData.confidence_level} 
            onValueChange={(value: 'high' | 'medium' | 'low') => setFormData(prev => ({ ...prev, confidence_level: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="impact">Impact Score</Label>
          <Input
            id="impact"
            type="number"
            min="0"
            max="100"
            value={formData.impact_score}
            onChange={(e) => setFormData(prev => ({ ...prev, impact_score: parseInt(e.target.value) || 0 }))}
          />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="actions">Recommended Actions (one per line)</Label>
        <Textarea
          id="actions"
          value={formData.recommended_actions}
          onChange={(e) => setFormData(prev => ({ ...prev, recommended_actions: e.target.value }))}
          rows={4}
          placeholder="Enter each recommended action on a new line"
        />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave}>
          <Edit className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      </DialogFooter>
    </div>
  );
}