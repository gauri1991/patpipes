/**
 * Analytics Insights Page
 * AI-powered insights generation, categorization, and recommendations
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Brain,
  Lightbulb,
  Plus,
  Search,
  Filter,
  RefreshCw,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Target,
  Clock,
  Eye,
  Zap,
  Star,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  ThumbsUp,
  ThumbsDown,
  Share,
  Download,
  Bookmark,
  Edit,
  Trash2,
  MoreVertical,
  Sparkles,
  Settings
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { analyticsApi, AnalyticsInsight } from '@/services/analyticsApi';
import { toast } from 'sonner';

interface InsightStats {
  total: number;
  actionable: number;
  reviewed: number;
  highPriority: number;
  mediumPriority: number;
  lowPriority: number;
  byType: Record<string, number>;
}

const insightTypeLabels: Record<string, string> = {
  trend_analysis: 'Trend Analysis',
  opportunity_identification: 'Opportunity',
  risk_assessment: 'Risk Assessment',
  competitive_gap: 'Competitive Gap',
  technology_emergence: 'Tech Emergence',
  market_shift: 'Market Shift',
  collaboration_opportunity: 'Collaboration',
  patent_expiration: 'Patent Expiration',
};

const insightTypeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  trend_analysis: TrendingUp,
  opportunity_identification: Target,
  risk_assessment: AlertTriangle,
  competitive_gap: BarChart3,
  technology_emergence: Zap,
  market_shift: TrendingDown,
  collaboration_opportunity: Star,
  patent_expiration: Clock,
};

export default function InsightsPage() {
  const [insights, setInsights] = useState<AnalyticsInsight[]>([]);
  const [filteredInsights, setFilteredInsights] = useState<AnalyticsInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState<AnalyticsInsight | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    insight_type: 'trend_analysis',
    description: '',
    priority: 'medium',
    is_actionable: true,
    recommended_actions: '',
  });

  // Fetch insights
  const fetchInsights = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await analyticsApi.getInsights();

      if (response.success && response.data) {
        setInsights(response.data);
        setFilteredInsights(response.data);
      } else {
        throw new Error(response.error || 'Failed to fetch insights');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch insights';
      setError(message);
      console.error('Insights fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  // Apply filters
  useEffect(() => {
    let filtered = [...insights];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(insight =>
        insight.title.toLowerCase().includes(query) ||
        insight.description?.toLowerCase().includes(query) ||
        insight.recommended_actions?.some(a => a.toLowerCase().includes(query))
      );
    }

    // Type filter
    if (typeFilter && typeFilter !== 'all') {
      filtered = filtered.filter(insight => insight.insight_type === typeFilter);
    }

    // Priority filter
    if (priorityFilter && priorityFilter !== 'all') {
      filtered = filtered.filter(insight => insight.priority === priorityFilter);
    }

    setFilteredInsights(filtered);
  }, [searchQuery, typeFilter, priorityFilter, insights]);

  // Handle create
  const handleCreate = async () => {
    try {
      const data = {
        title: formData.title,
        insight_type: formData.insight_type as AnalyticsInsight['insight_type'],
        description: formData.description,
        priority: formData.priority as AnalyticsInsight['priority'],
        is_actionable: formData.is_actionable,
        recommended_actions: formData.recommended_actions.split('\n').map(a => a.trim()).filter(a => a),
        confidence_level: 'medium' as const,
        impact_score: 50,
      };

      const response = await analyticsApi.createInsight(data);

      if (response.success) {
        toast.success('Insight created successfully');
        setShowCreateDialog(false);
        resetForm();
        await fetchInsights();
      } else {
        throw new Error(response.error || 'Failed to create insight');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create insight';
      toast.error(message);
    }
  };

  // Simulate AI generation
  const handleGenerateInsights = async () => {
    setIsGenerating(true);
    toast.info('Generating AI insights from your data...');

    // Simulate generation delay
    await new Promise(resolve => setTimeout(resolve, 3000));

    toast.success('AI insights generated! Review and approve them below.');
    setIsGenerating(false);
    await fetchInsights();
  };

  const resetForm = () => {
    setFormData({
      title: '',
      insight_type: 'trend_analysis',
      description: '',
      priority: 'medium',
      is_actionable: true,
      recommended_actions: '',
    });
    setSelectedInsight(null);
  };

  // Calculate statistics
  const stats: InsightStats = {
    total: insights.length,
    actionable: insights.filter(i => i.is_actionable).length,
    reviewed: insights.filter(i => i.is_reviewed).length,
    highPriority: insights.filter(i => i.priority === 'high' || i.priority === 'urgent').length,
    mediumPriority: insights.filter(i => i.priority === 'medium').length,
    lowPriority: insights.filter(i => i.priority === 'low').length,
    byType: insights.reduce((acc, i) => {
      acc[i.insight_type] = (acc[i.insight_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getTypeIcon = (type: string) => {
    const Icon = insightTypeIcons[type] || Lightbulb;
    return Icon;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/analytics">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Analytics
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">AI Insights</h1>
            <p className="text-muted-foreground">
              AI-generated insights, trends, and recommendations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleGenerateInsights}
            disabled={isGenerating}
          >
            <Sparkles className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-pulse' : ''}`} />
            {isGenerating ? 'Generating...' : 'Generate Insights'}
          </Button>
          <Button variant="outline" onClick={fetchInsights} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Insight
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Custom Insight</DialogTitle>
                <DialogDescription>
                  Add a manual insight based on your analysis
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Rising Patent Activity in AI Sector"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="type">Insight Type</Label>
                    <Select
                      value={formData.insight_type}
                      onValueChange={(value) => setFormData({ ...formData, insight_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(insightTypeLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) => setFormData({ ...formData, priority: value })}
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
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Detailed description of the insight"
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="actions">Recommended Actions</Label>
                  <Textarea
                    id="actions"
                    placeholder="One action per line"
                    rows={3}
                    value={formData.recommended_actions}
                    onChange={(e) => setFormData({ ...formData, recommended_actions: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Suggested follow-up actions based on this insight
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={!formData.title.trim()}>
                  Create Insight
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Insights</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actionable</CardTitle>
            <Target className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.actionable}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reviewed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.reviewed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.highPriority}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Medium Priority</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.mediumPriority}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Priority</CardTitle>
            <Lightbulb className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.lowPriority}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Insights Feed</CardTitle>
              <CardDescription>
                {filteredInsights.length} of {insights.length} insights
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search insights..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(insightTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Insights List */}
          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Loading insights...</p>
            </div>
          ) : filteredInsights.length === 0 ? (
            <div className="text-center py-12">
              <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">
                {insights.length === 0 ? 'No insights yet' : 'No insights match your filters'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {insights.length === 0
                  ? 'Generate AI insights from your analytics data or add manual insights'
                  : 'Try adjusting your search or filter criteria'}
              </p>
              {insights.length === 0 && (
                <div className="flex items-center justify-center gap-3">
                  <Button onClick={handleGenerateInsights} disabled={isGenerating}>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate AI Insights
                  </Button>
                  <Button variant="outline" onClick={() => setShowCreateDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Manual Insight
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredInsights.map((insight) => {
                const TypeIcon = getTypeIcon(insight.insight_type);
                return (
                  <Card key={insight.id} className="relative overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <TypeIcon className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-base flex items-center gap-2">
                              {insight.title}
                              {insight.is_actionable && (
                                <Badge variant="outline" className="text-xs">
                                  <Target className="h-3 w-3 mr-1" />
                                  Actionable
                                </Badge>
                              )}
                            </CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {insightTypeLabels[insight.insight_type] || insight.insight_type}
                              </Badge>
                              <Badge className={`text-xs ${getPriorityColor(insight.priority)}`}>
                                {insight.priority.charAt(0).toUpperCase() + insight.priority.slice(1)} Priority
                              </Badge>
                              {insight.confidence_level && (
                                <span className={`text-xs ${getConfidenceColor(insight.confidence_level)}`}>
                                  {insight.confidence_level.charAt(0).toUpperCase() + insight.confidence_level.slice(1)} Confidence
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Bookmark className="h-4 w-4 mr-2" />
                              Bookmark
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Share className="h-4 w-4 mr-2" />
                              Share
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Mark as Reviewed
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        {insight.description}
                      </p>

                      {/* Impact Score */}
                      {insight.impact_score && (
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-muted-foreground">Impact Score</span>
                            <span className="text-xs font-medium">{insight.impact_score}/100</span>
                          </div>
                          <Progress value={insight.impact_score} className="h-2" />
                        </div>
                      )}

                      {/* Recommended Actions */}
                      {insight.recommended_actions && insight.recommended_actions.length > 0 && (
                        <div>
                          <p className="text-xs font-medium mb-2">Recommended Actions:</p>
                          <ul className="space-y-1">
                            {insight.recommended_actions.slice(0, 3).map((action, idx) => (
                              <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                                <Target className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                {action}
                              </li>
                            ))}
                            {insight.recommended_actions.length > 3 && (
                              <li className="text-xs text-primary">
                                +{insight.recommended_actions.length - 3} more actions
                              </li>
                            )}
                          </ul>
                        </div>
                      )}

                      {/* Feedback Actions */}
                      <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                        <Button variant="ghost" size="sm">
                          <ThumbsUp className="h-4 w-4 mr-1" />
                          Helpful
                        </Button>
                        <Button variant="ghost" size="sm">
                          <ThumbsDown className="h-4 w-4 mr-1" />
                          Not Helpful
                        </Button>
                        <div className="flex-1" />
                        <span className="text-xs text-muted-foreground">
                          {new Date(insight.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
