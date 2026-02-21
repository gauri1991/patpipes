'use client';

import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Clock, Database, Zap, Target, Activity, PieChart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface SearchAnalyticsData {
  totalSearches: number;
  successfulSearches: number;
  averageExecutionTime: number;
  totalResultsFound: number;
  topDatabases: Array<{ name: string; count: number; percentage: number }>;
  searchTrends: Array<{ date: string; searches: number }>;
  performanceMetrics: {
    fastest: number;
    slowest: number;
    median: number;
  };
  popularQueries: Array<{ query: string; count: number; avgResults: number }>;
}

interface SearchAnalyticsProps {
  projectId: string;
  sessionId?: string;
  timeRange?: '7d' | '30d' | '90d' | 'all';
}

export function SearchAnalytics({ 
  projectId, 
  sessionId,
  timeRange = '30d'
}: SearchAnalyticsProps) {
  const [analytics, setAnalytics] = useState<SearchAnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);

  // Mock data for demonstration
  useEffect(() => {
    setAnalytics({
      totalSearches: 47,
      successfulSearches: 42,
      averageExecutionTime: 34.5,
      totalResultsFound: 186420,
      topDatabases: [
        { name: 'USPTO', count: 28, percentage: 59.6 },
        { name: 'EPO', count: 15, percentage: 31.9 },
        { name: 'WIPO', count: 8, percentage: 17.0 },
        { name: 'JPO', count: 4, percentage: 8.5 }
      ],
      searchTrends: [
        { date: '2024-12-04', searches: 3 },
        { date: '2024-12-05', searches: 7 },
        { date: '2024-12-06', searches: 5 },
        { date: '2024-12-07', searches: 9 },
        { date: '2024-12-08', searches: 12 },
        { date: '2024-12-09', searches: 8 },
        { date: '2024-12-10', searches: 3 }
      ],
      performanceMetrics: {
        fastest: 12.3,
        slowest: 89.7,
        median: 31.2
      },
      popularQueries: [
        { query: '"artificial intelligence"', count: 8, avgResults: 2341 },
        { query: '"machine learning"', count: 6, avgResults: 1867 },
        { query: '"neural network"', count: 5, avgResults: 1123 },
        { query: '"battery technology"', count: 4, avgResults: 892 }
      ]
    });
  }, [projectId, sessionId, timeRange]);

  const getSuccessRate = () => {
    if (!analytics) return 0;
    return Math.round((analytics.successfulSearches / analytics.totalSearches) * 100);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  if (!analytics) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          Loading analytics...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Searches</p>
                <p className="text-lg font-semibold">{analytics.totalSearches}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Target className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Success Rate</p>
                <p className="text-lg font-semibold">{getSuccessRate()}%</p>
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
                <p className="text-xs text-muted-foreground">Avg Time</p>
                <p className="text-lg font-semibold">{analytics.averageExecutionTime}s</p>
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
                <p className="text-xs text-muted-foreground">Total Results</p>
                <p className="text-lg font-semibold">{formatNumber(analytics.totalResultsFound)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Database Usage */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            <CardTitle className="text-base">Database Usage</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.topDatabases.map((db, index) => (
              <div key={db.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{db.name}</Badge>
                    <span className="text-sm text-muted-foreground">{db.count} searches</span>
                  </div>
                  <span className="text-sm font-medium">{db.percentage}%</span>
                </div>
                <Progress value={db.percentage} className="h-1" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            <CardTitle className="text-base">Performance Metrics</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-xs text-muted-foreground">Fastest</p>
              <p className="text-lg font-semibold text-green-600">{analytics.performanceMetrics.fastest}s</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-muted-foreground">Median</p>
              <p className="text-lg font-semibold text-blue-600">{analytics.performanceMetrics.median}s</p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
              <p className="text-xs text-muted-foreground">Slowest</p>
              <p className="text-lg font-semibold text-red-600">{analytics.performanceMetrics.slowest}s</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Popular Queries */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <CardTitle className="text-base">Popular Queries</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.popularQueries.map((query, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <code className="text-sm font-mono">{query.query}</code>
                  <p className="text-xs text-muted-foreground mt-1">
                    Avg: {formatNumber(query.avgResults)} results
                  </p>
                </div>
                <Badge variant="secondary">{query.count}x</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Search Trends */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            <CardTitle className="text-base">Search Activity (Last 7 Days)</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-2 h-32">
            {analytics.searchTrends.map((trend, index) => (
              <div key={trend.date} className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full bg-blue-500 rounded-t-sm min-h-[4px]"
                  style={{ 
                    height: `${Math.max((trend.searches / 12) * 100, 5)}%`
                  }}
                />
                <div className="text-xs text-center mt-2 text-muted-foreground">
                  <p>{trend.searches}</p>
                  <p>{new Date(trend.date).getDate()}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}