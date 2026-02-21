'use client';

import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Target, Users, Clock, Database, Zap, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ProjectSearchMetrics {
  totalSearches: number;
  totalResults: number;
  averageResultsPerSearch: number;
  searchSuccessRate: number;
  averageSearchTime: number;
  topDatabases: Array<{ name: string; searches: number; results: number }>;
  searchTrends: Array<{ date: string; searches: number; results: number }>;
  topKeywords: Array<{ keyword: string; frequency: number; avgResults: number }>;
  patentCategories: Array<{ category: string; count: number; percentage: number }>;
  competitiveAnalysis: {
    topAssignees: Array<{ assignee: string; patents: number; relevance: number }>;
    innovationAreas: Array<{ area: string; growth: number; patents: number }>;
  };
  searchQuality: {
    highRelevanceSearches: number;
    citationRate: number;
    brainstormingIntegration: number;
  };
}

interface ProjectSearchAnalyticsProps {
  projectId: string;
  timeRange?: '7d' | '30d' | '90d' | '1y' | 'all';
  sessionId?: string;
}

export function ProjectSearchAnalytics({ 
  projectId, 
  timeRange = '30d',
  sessionId
}: ProjectSearchAnalyticsProps) {
  const [metrics, setMetrics] = useState<ProjectSearchMetrics | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'overview' | 'trends' | 'quality' | 'competitive'>('overview');

  useEffect(() => {
    loadProjectMetrics();
  }, [projectId, selectedTimeRange, sessionId]);

  const loadProjectMetrics = async () => {
    setLoading(true);
    
    // Mock data - in real implementation, this would fetch from API
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setMetrics({
      totalSearches: 147,
      totalResults: 24680,
      averageResultsPerSearch: 168,
      searchSuccessRate: 94.2,
      averageSearchTime: 23.5,
      topDatabases: [
        { name: 'USPTO', searches: 89, results: 15420 },
        { name: 'EPO', searches: 67, results: 8934 },
        { name: 'WIPO', searches: 45, results: 6789 },
        { name: 'JPO', searches: 23, results: 2145 }
      ],
      searchTrends: [
        { date: '2024-11-10', searches: 12, results: 2156 },
        { date: '2024-11-17', searches: 18, results: 3024 },
        { date: '2024-11-24', searches: 15, results: 2789 },
        { date: '2024-12-01', searches: 22, results: 3567 },
        { date: '2024-12-08', searches: 19, results: 3234 }
      ],
      topKeywords: [
        { keyword: 'artificial intelligence', frequency: 34, avgResults: 456 },
        { keyword: 'machine learning', frequency: 28, avgResults: 389 },
        { keyword: 'neural network', frequency: 22, avgResults: 234 },
        { keyword: 'deep learning', frequency: 19, avgResults: 178 },
        { keyword: 'natural language processing', frequency: 15, avgResults: 145 }
      ],
      patentCategories: [
        { category: 'G06F - Electric Digital Data Processing', count: 8945, percentage: 36.3 },
        { category: 'G06N - Computing Arrangements for AI', count: 5678, percentage: 23.0 },
        { category: 'H04L - Transmission of Digital Information', count: 3456, percentage: 14.0 },
        { category: 'G06Q - Data Processing Systems', count: 2345, percentage: 9.5 },
        { category: 'Other', count: 4256, percentage: 17.2 }
      ],
      competitiveAnalysis: {
        topAssignees: [
          { assignee: 'Google LLC', patents: 234, relevance: 87 },
          { assignee: 'Microsoft Corporation', patents: 189, relevance: 82 },
          { assignee: 'Apple Inc', patents: 156, relevance: 78 },
          { assignee: 'Amazon Technologies', patents: 134, relevance: 75 },
          { assignee: 'IBM Corporation', patents: 123, relevance: 72 }
        ],
        innovationAreas: [
          { area: 'AI/ML Algorithms', growth: 45.2, patents: 1234 },
          { area: 'Natural Language Processing', growth: 38.7, patents: 987 },
          { area: 'Computer Vision', growth: 32.1, patents: 756 },
          { area: 'Robotics & Automation', growth: 28.9, patents: 654 }
        ]
      },
      searchQuality: {
        highRelevanceSearches: 78.5,
        citationRate: 12.3,
        brainstormingIntegration: 65.2
      }
    });
    
    setLoading(false);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatPercentage = (num: number) => {
    return `${num.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading project analytics...</p>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          <BarChart3 className="h-12 w-12 mx-auto mb-4" />
          <p>No analytics data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Project Search Analytics</h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline">Project: {projectId}</Badge>
              {sessionId && <Badge variant="secondary">Session: {sessionId}</Badge>}
              <Badge variant="outline">{selectedTimeRange}</Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedTimeRange} onValueChange={(value: any) => setSelectedTimeRange(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            Export Data
          </Button>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
        <Button
          size="sm"
          variant={activeView === 'overview' ? 'default' : 'ghost'}
          onClick={() => setActiveView('overview')}
        >
          Overview
        </Button>
        <Button
          size="sm"
          variant={activeView === 'trends' ? 'default' : 'ghost'}
          onClick={() => setActiveView('trends')}
        >
          Trends
        </Button>
        <Button
          size="sm"
          variant={activeView === 'quality' ? 'default' : 'ghost'}
          onClick={() => setActiveView('quality')}
        >
          Quality
        </Button>
        <Button
          size="sm"
          variant={activeView === 'competitive' ? 'default' : 'ghost'}
          onClick={() => setActiveView('competitive')}
        >
          Competitive
        </Button>
      </div>

      {/* Overview Tab */}
      {activeView === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Target className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Searches</p>
                    <p className="text-lg font-semibold">{metrics.totalSearches}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Database className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Results</p>
                    <p className="text-lg font-semibold">{formatNumber(metrics.totalResults)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <TrendingUp className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Success Rate</p>
                    <p className="text-lg font-semibold">{formatPercentage(metrics.searchSuccessRate)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Clock className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Avg Search Time</p>
                    <p className="text-lg font-semibold">{metrics.averageSearchTime}s</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Database Usage */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Database Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.topDatabases.map((db, index) => (
                  <div key={db.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{db.name}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {db.searches} searches • {formatNumber(db.results)} results
                        </span>
                      </div>
                      <span className="text-sm font-medium">
                        {Math.round((db.searches / metrics.totalSearches) * 100)}%
                      </span>
                    </div>
                    <Progress 
                      value={(db.searches / metrics.totalSearches) * 100} 
                      className="h-1" 
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Patent Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Patent Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metrics.patentCategories.map((category, index) => (
                  <div key={category.category} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{category.category}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Progress value={category.percentage} className="h-1 flex-1" />
                        <span className="text-xs text-muted-foreground w-12">
                          {formatPercentage(category.percentage)}
                        </span>
                      </div>
                    </div>
                    <Badge variant="secondary" className="ml-3">
                      {formatNumber(category.count)}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Other tabs would be implemented similarly */}
      {activeView !== 'overview' && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-4" />
            <p>{activeView} view coming soon</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}