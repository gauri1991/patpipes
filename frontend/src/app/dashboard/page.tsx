'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  FileText,
  Search,
  Shield,
  BarChart3,
  Clock,
  TrendingUp,
  AlertCircle,
  Calendar,
  Activity,
  Zap,
  Loader2,
  RefreshCw
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/domains/accounts/hooks/useAuth';
import { dashboardService, MainDashboardData, DashboardActivity, DashboardDeadline } from '@/services/dashboardService';

// Quick action configurations (static)
const quickActions = [
  {
    title: 'Draft New Patent',
    description: 'Start a new patent application with AI assistance',
    href: '/dashboard/portfolio/draft',
    icon: FileText,
    color: 'bg-blue-500',
  },
  {
    title: 'Search Prior Art',
    description: 'Find relevant prior art for your invention',
    href: '/dashboard/prior-art/search',
    icon: Search,
    color: 'bg-green-500',
  },
  {
    title: 'Analyze Infringement',
    description: 'Start a new infringement analysis project',
    href: '/dashboard/infringement/new',
    icon: Shield,
    color: 'bg-orange-500',
  },
  {
    title: 'Generate Report',
    description: 'Create landscape or competitive analysis',
    href: '/dashboard/analytics/reports',
    icon: BarChart3,
    color: 'bg-purple-500',
  },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<MainDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchDashboardData = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setIsRefreshing(true);
      }
      setError(null);
      const data = await dashboardService.getDashboardData();
      setDashboardData(data);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRefresh = () => {
    fetchDashboardData(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'in_progress':
      case 'active':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500 bg-red-50';
      case 'medium':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'low':
        return 'border-l-green-500 bg-green-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  const getActivityIcon = (type: DashboardActivity['type']) => {
    switch (type) {
      case 'patent_draft':
        return <FileText className="h-5 w-5 text-blue-600" />;
      case 'prior_art':
        return <Search className="h-5 w-5 text-green-600" />;
      case 'infringement':
        return <Shield className="h-5 w-5 text-orange-600" />;
      case 'analytics':
        return <BarChart3 className="h-5 w-5 text-purple-600" />;
      default:
        return <Activity className="h-5 w-5 text-gray-600" />;
    }
  };

  // Build stats array from data
  const stats = dashboardData ? [
    {
      title: 'Active Patents',
      value: dashboardData.stats.activePatents.toString(),
      change: dashboardData.stats.patentsChange,
      trend: 'up',
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Prior Art Searches',
      value: dashboardData.stats.priorArtSearches.toString(),
      change: dashboardData.stats.searchesChange,
      trend: 'up',
      icon: Search,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Infringement Cases',
      value: dashboardData.stats.infringementCases.toString(),
      change: dashboardData.stats.casesChange,
      trend: 'up',
      icon: Shield,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      title: 'Analytics Reports',
      value: dashboardData.stats.analyticsReports.toString(),
      change: dashboardData.stats.reportsChange,
      trend: 'up',
      icon: BarChart3,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ] : [];

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-lg font-medium mb-2">Failed to load dashboard</p>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => fetchDashboardData()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back{user?.firstName ? `, ${user.firstName}` : ''}!
          </h1>
          <p className="text-muted-foreground mt-2">
            Here's what's happening with your patent portfolio today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Badge variant="secondary" className="gap-1">
            <Activity className="h-3 w-3" />
            All Systems Operational
          </Badge>
        </div>
      </div>

      {/* Error banner (if error but we have data) */}
      {error && dashboardData && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600" />
          <div className="flex-1">
            <p className="text-sm text-yellow-800">{error}</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            Retry
          </Button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={`p-2 rounded-md ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <TrendingUp className="mr-1 h-3 w-3 text-green-600" />
                <span className="text-green-600">{stat.change}</span>
                <span className="ml-1">from last month</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action, index) => (
            <Link key={index} href={action.href}>
              <Card className="cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className={`inline-flex p-3 rounded-lg ${action.color} text-white mb-4`}>
                    <action.icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold mb-2">{action.title}</h3>
                  <p className="text-sm text-muted-foreground">{action.description}</p>
                  <div className="mt-4 flex items-center text-primary text-sm font-medium">
                    Get Started
                    <ArrowUpRight className="ml-1 h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Latest updates from your team and projects
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {dashboardData?.recentActivity && dashboardData.recentActivity.length > 0 ? (
                <>
                  {dashboardData.recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-4 p-3 rounded-lg border bg-card">
                      <div className="flex-shrink-0">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{activity.title}</p>
                        <p className="text-sm text-muted-foreground">{activity.description}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <Badge
                            variant="secondary"
                            className={`text-xs ${getStatusColor(activity.status)}`}
                          >
                            {activity.status.replace('_', ' ')}
                          </Badge>
                          <span className="text-xs text-muted-foreground">by {activity.user}</span>
                          <span className="text-xs text-muted-foreground">• {activity.time}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="text-center pt-4">
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/dashboard/activity">View All Activity</Link>
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No recent activity</p>
                  <p className="text-sm">Start a new project to see activity here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Upcoming Deadlines */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                Upcoming Deadlines
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {dashboardData?.upcomingDeadlines && dashboardData.upcomingDeadlines.length > 0 ? (
                <>
                  {dashboardData.upcomingDeadlines.map((deadline, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-md border-l-4 ${getPriorityColor(deadline.priority)}`}
                    >
                      <h4 className="text-sm font-medium">{deadline.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{deadline.description}</p>
                      <div className="flex items-center mt-2 text-xs">
                        <Calendar className="h-3 w-3 mr-1" />
                        {deadline.date}
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link href="/dashboard/prosecution/deadlines">View All Deadlines</Link>
                  </Button>
                </>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <Calendar className="h-6 w-6 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No upcoming deadlines</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Assistant */}
          <Card className="bg-gradient-to-br from-primary/10 to-purple-500/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                AI Assistant
              </CardTitle>
              <CardDescription>
                Get intelligent suggestions for your work
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {dashboardData?.insights && dashboardData.insights.length > 0 ? (
                <div className="text-sm">
                  <p className="mb-2 font-medium">Latest Insight:</p>
                  <p className="text-muted-foreground">
                    {dashboardData.insights[0].title || dashboardData.insights[0].description}
                  </p>
                </div>
              ) : (
                <div className="text-sm">
                  <p className="mb-2 font-medium">Ready to help</p>
                  <p className="text-muted-foreground">
                    AI-powered insights will appear here as you work on your projects.
                  </p>
                </div>
              )}
              <Button size="sm" className="w-full" asChild>
                <Link href="/dashboard/analytics/insights">View AI Suggestions</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
