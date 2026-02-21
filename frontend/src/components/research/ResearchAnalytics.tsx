/**
 * ResearchAnalytics Component
 * Analytics and insights for patent research data
 */

'use client';

import {
  BarChart3,
  TrendingUp,
  Clock,
  Target,
  Building,
  User,
  Hash,
  Calendar,
  Database,
  Activity,
  CheckCircle,
  XCircle
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

import { ResearchAnalytics as AnalyticsData, ResearchQuery } from '@/services/researchApi';

interface ResearchAnalyticsProps {
  projectId: string;
  analytics: AnalyticsData | null;
  queries: ResearchQuery[];
}

export function ResearchAnalytics({ projectId, analytics, queries }: ResearchAnalyticsProps) {
  if (!analytics) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="py-8 text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Analytics Data</h3>
            <p className="text-muted-foreground">
              Complete some research queries to see analytics insights.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Process query status distribution
  const queryStatusCounts = Array.isArray(queries) ? queries.reduce((acc, query) => {
    acc[query.status] = (acc[query.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) : {};

  const completedQueries = queryStatusCounts.completed || 0;
  const totalQueries = Array.isArray(queries) ? queries.length : 0;
  const successRate = totalQueries > 0 ? (completedQueries / totalQueries) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold text-green-600">{Math.round(successRate)}%</p>
              </div>
              <Target className="h-8 w-8 text-green-500" />
            </div>
            <div className="mt-2">
              <Progress value={successRate} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Runtime</p>
                <p className="text-2xl font-bold">{analytics.avg_execution_time}s</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Unique Patents</p>
                <p className="text-2xl font-bold">{analytics.unique_patents.toLocaleString()}</p>
              </div>
              <Database className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Selection Rate</p>
                <p className="text-2xl font-bold text-orange-600">
                  {analytics.total_results > 0 
                    ? Math.round((analytics.selected_patents / analytics.total_results) * 100)
                    : 0
                  }%
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Query Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Query Status Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries({
              completed: { icon: CheckCircle, color: 'text-green-600', label: 'Completed' },
              running: { icon: Clock, color: 'text-blue-600', label: 'Running' },
              failed: { icon: XCircle, color: 'text-red-600', label: 'Failed' },
              cancelled: { icon: XCircle, color: 'text-yellow-600', label: 'Cancelled' },
              draft: { icon: Clock, color: 'text-gray-600', label: 'Draft' }
            }).map(([status, config]) => {
              const count = queryStatusCounts[status] || 0;
              const percentage = totalQueries > 0 ? (count / totalQueries) * 100 : 0;
              const IconComponent = config.icon;
              
              return (
                <div key={status} className="text-center">
                  <IconComponent className={`h-8 w-8 mx-auto mb-2 ${config.color}`} />
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-sm text-muted-foreground">{config.label}</p>
                  <div className="mt-1">
                    <Progress value={percentage} className="h-1" />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* API Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            API Usage Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(analytics.api_usage).map(([api, count]) => {
              const percentage = analytics.total_queries > 0 ? (count / analytics.total_queries) * 100 : 0;
              
              return (
                <div key={api} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{api.toUpperCase()}</Badge>
                    <span className="text-sm">{count} queries</span>
                  </div>
                  <div className="flex items-center gap-2 min-w-[100px]">
                    <Progress value={percentage} className="h-2 flex-1" />
                    <span className="text-sm text-muted-foreground w-12 text-right">
                      {Math.round(percentage)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Top Assignees and Inventors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Top Patent Assignees
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.top_assignees.slice(0, 10).map((assignee, index) => {
                const maxCount = Math.max(...analytics.top_assignees.map(a => a.count));
                const percentage = maxCount > 0 ? (assignee.count / maxCount) * 100 : 0;
                
                return (
                  <div key={index} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate max-w-[200px]" title={assignee.assignee}>
                        {assignee.assignee}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {assignee.count} patents
                      </span>
                    </div>
                    <Progress value={percentage} className="h-1" />
                  </div>
                );
              })}
              
              {analytics.top_assignees.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No assignee data available
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Top Patent Inventors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.top_inventors.slice(0, 10).map((inventor, index) => {
                const maxCount = Math.max(...analytics.top_inventors.map(i => i.count));
                const percentage = maxCount > 0 ? (inventor.count / maxCount) * 100 : 0;
                
                return (
                  <div key={index} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {inventor.inventor}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {inventor.count} patents
                      </span>
                    </div>
                    <Progress value={percentage} className="h-1" />
                  </div>
                );
              })}
              
              {analytics.top_inventors.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No inventor data available
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Research Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Research Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground">SEARCH ACTIVITY</h4>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-sm">Total Queries</span>
                  <span className="text-sm font-medium">{analytics.total_queries}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Total Results</span>
                  <span className="text-sm font-medium">{analytics.total_results.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Unique Patents</span>
                  <span className="text-sm font-medium">{analytics.unique_patents.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground">SELECTION METRICS</h4>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-sm">Selected Patents</span>
                  <span className="text-sm font-medium">{analytics.selected_patents.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Selection Rate</span>
                  <span className="text-sm font-medium">
                    {analytics.total_results > 0 
                      ? Math.round((analytics.selected_patents / analytics.total_results) * 100)
                      : 0
                    }%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Avg. per Query</span>
                  <span className="text-sm font-medium">
                    {analytics.total_queries > 0 
                      ? Math.round(analytics.selected_patents / analytics.total_queries)
                      : 0
                    }
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground">PERFORMANCE</h4>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-sm">Success Rate</span>
                  <span className="text-sm font-medium">{Math.round(analytics.success_rate)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Avg. Runtime</span>
                  <span className="text-sm font-medium">{analytics.avg_execution_time}s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Completed Queries</span>
                  <span className="text-sm font-medium">{completedQueries}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}