/**
 * Projects Dashboard Component
 * User-focused dashboard with stats, activities, and quick actions
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  FileText,
  Calendar,
  Users,
  Bell,
  MoreHorizontal,
  ArrowUpRight,
  Activity,
  Award,
  Target,
  Zap
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';

import { useProjectsStore } from '../store/projects.store';
import { usePermissions } from '@/domains/accounts/hooks/usePermissions';
import { 
  UserProjectDashboard, 
  Project, 
  ProjectActivity, 
  ProjectNotification,
  QuickAction,
  UserPerformanceMetrics,
  ProjectStatus,
  ProjectPriority 
} from '../types/project.types';
import { ProjectStatusBadge } from './ProjectStatusBadge';
import { ProjectPriorityBadge } from './ProjectPriorityBadge';

export function ProjectsDashboard() {
  const router = useRouter();
  
  const { canCreateProject, canEditProject, canDeleteProject } = usePermissions();
  
  const {
    dashboardData,
    recentProjects = [],
    isLoading,
    error,
    fetchDashboardData,
    createProject
  } = useProjectsStore();

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleCreateProject = () => {
    router.push('/dashboard/projects/new');
  };

  const handleViewProject = (projectId: string) => {
    router.push(`/dashboard/projects/${projectId}`);
  };

  const handleViewAllProjects = () => {
    router.push('/dashboard/projects/all');
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'create_project':
        handleCreateProject();
        break;
      case 'view_tasks':
        router.push('/dashboard/projects/tasks');
        break;
      case 'upload_documents':
        router.push('/dashboard/projects/documents');
        break;
      case 'generate_report':
        router.push('/dashboard/projects/reports');
        break;
      default:
        console.log(`Action ${action} not implemented`);
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'project_created':
        return <Plus className="h-4 w-4" />;
      case 'task_completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'file_uploaded':
        return <FileText className="h-4 w-4" />;
      case 'milestone_reached':
        return <Award className="h-4 w-4" />;
      case 'comment_added':
        return <Users className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'deadline_approaching':
        return <Clock className="h-4 w-4 text-amber-500" />;
      case 'task_overdue':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'project_update':
        return <Activity className="h-4 w-4 text-blue-500" />;
      case 'team_mention':
        return <Users className="h-4 w-4 text-green-500" />;
      case 'milestone_due':
        return <Target className="h-4 w-4 text-purple-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Mock data structure - will be replaced with actual API data
  const mockDashboard: UserProjectDashboard = {
    statistics: {
      totalProjects: 12,
      activeProjects: 8,
      completedProjects: 4,
      overdueProjects: 2,
      totalTasks: 45,
      completedTasks: 32,
      overdueTasks: 5,
      averageCompletionTime: 18.5,
      successRate: 87.5,
      budgetUtilization: {
        planned: 250000,
        actual: 187500,
        variance: 25
      }
    },
    recentProjects: recentProjects.slice(0, 6),
    recentActivities: [],
    notifications: [],
    quickActions: [
      {
        id: '1',
        title: 'New Project',
        description: 'Start a new patent project',
        icon: 'plus',
        action: 'create_project',
        isEnabled: true
      },
      {
        id: '2',
        title: 'View Tasks',
        description: 'Check pending tasks',
        icon: 'check-square',
        action: 'view_tasks',
        isEnabled: true
      },
      {
        id: '3',
        title: 'Upload Documents',
        description: 'Add project files',
        icon: 'upload',
        action: 'upload_documents',
        isEnabled: true
      },
      {
        id: '4',
        title: 'Generate Report',
        description: 'Create project reports',
        icon: 'file-text',
        action: 'generate_report',
        isEnabled: true
      }
    ],
    performanceMetrics: {
      projectsCompleted: 4,
      tasksCompleted: 32,
      averageCompletionTime: 18.5,
      onTimeDeliveryRate: 87.5,
      efficiency: 92,
      trend: 'up'
    }
  };

  const stats = dashboardData?.statistics || mockDashboard.statistics;
  const performance = dashboardData?.performanceMetrics || mockDashboard.performanceMetrics;
  const quickActions = dashboardData?.quickActions || mockDashboard.quickActions;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your patent projects and track progress
          </p>
        </div>
        {canCreateProject() && (
          <Button onClick={handleCreateProject} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        )}
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProjects}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeProjects} active projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.successRate}%</div>
            <div className="flex items-center gap-1">
              {getTrendIcon(performance.trend)}
              <p className="text-xs text-muted-foreground">
                {stats.completedProjects} of {stats.totalProjects} completed
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Completion Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageCompletionTime} days</div>
            <p className="text-xs text-muted-foreground">
              {performance.efficiency}% efficiency
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Utilization</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{100 - stats.budgetUtilization.variance}%</div>
            <Progress 
              value={100 - stats.budgetUtilization.variance} 
              className="mt-2"
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Recent Projects */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Projects</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleViewAllProjects}
                  className="flex items-center gap-2"
                >
                  View All
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription>
                Your latest project activity and status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentProjects.length > 0 ? recentProjects.slice(0, 4).map((project) => (
                <div 
                  key={project.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => handleViewProject(project.id)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium">{project.name}</h4>
                      <ProjectStatusBadge status={project.status} />
                      <ProjectPriorityBadge priority={project.priority} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {project.description || 'No description provided'}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>{project.totalTasks || 0} tasks</span>
                      {project.targetDate && (
                        <span>Due {formatDate(project.targetDate)}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{project.progressPercentage}%</div>
                    <Progress value={project.progressPercentage} className="w-16 h-2" />
                  </div>
                </div>
              )) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium mb-2">No projects yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create your first project to get started
                  </p>
                  <Button onClick={handleCreateProject}>
                    Create Project
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Performance */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common project tasks</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              {quickActions.map((action) => (
                <Button
                  key={action.id}
                  variant="outline"
                  className="h-auto p-3 flex flex-col items-center gap-2"
                  onClick={() => handleQuickAction(action.action)}
                  disabled={!action.isEnabled}
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    {action.icon === 'plus' && <Plus className="h-4 w-4" />}
                    {action.icon === 'check-square' && <CheckCircle className="h-4 w-4" />}
                    {action.icon === 'upload' && <ArrowUpRight className="h-4 w-4" />}
                    {action.icon === 'file-text' && <FileText className="h-4 w-4" />}
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-medium">{action.title}</div>
                  </div>
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Performance Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Performance
              </CardTitle>
              <CardDescription>Your productivity metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Projects Completed</span>
                <span className="font-medium">{performance.projectsCompleted}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm">Tasks Completed</span>
                <span className="font-medium">{performance.tasksCompleted}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm">On-time Delivery</span>
                <span className="font-medium">{performance.onTimeDeliveryRate}%</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm">Efficiency Score</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{performance.efficiency}%</span>
                  {getTrendIcon(performance.trend)}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

    </div>
  );
}