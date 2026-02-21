/**
 * ProjectDashboard Component
 * Comprehensive project dashboard with timeline, tasks, files, and analytics
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Calendar, 
  Users, 
  FileText, 
  Activity, 
  DollarSign, 
  Clock, 
  Target,
  Plus,
  MoreHorizontal,
  Edit,
  Archive,
  Share,
  Settings
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { useProjectsStore } from '../store/projects.store';
import { useProjectTasks } from '../hooks/useProjectTasks';
import { useProjectFiles } from '../hooks/useProjectFiles';
import { useProjectMilestones } from '../hooks/useProjectMilestones';
import { Project } from '../types/project.types';
import { ProjectStatusBadge } from './ProjectStatusBadge';
import { ProjectPriorityBadge } from './ProjectPriorityBadge';
import { ProjectTimeline } from './ProjectTimeline';
import { ProjectKanbanBoard } from './ProjectKanbanBoard';
import { ProjectFileManager } from './ProjectFileManager';
import WorkflowIntegration from '@/components/projects/WorkflowIntegration';
import { ProjectAnalytics } from './ProjectAnalytics';
import { ProjectTeamMembers } from './ProjectTeamMembers';
import { ProjectActivityFeed } from './ProjectActivityFeed';

interface ProjectDashboardProps {
  projectId: string;
}

export function ProjectDashboard({ projectId }: ProjectDashboardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  
  const { 
    currentProject,
    isLoading,
    error,
    fetchProject: fetchProjectFromStore,
    updateProject,
    archiveProject,
    deleteProject
  } = useProjectsStore();

  const {
    tasks,
    fetchTasks,
    createTask
  } = useProjectTasks(projectId);

  const {
    files,
    fetchFiles
  } = useProjectFiles(projectId);

  const {
    milestones,
    fetchMilestones
  } = useProjectMilestones(projectId);

  useEffect(() => {
    fetchProjectFromStore(projectId);
    fetchTasks();
    fetchFiles();
    fetchMilestones();
  }, [projectId, fetchProjectFromStore]);

  if (isLoading && !currentProject) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">{error}</p>
            <Button 
              onClick={() => router.push('/dashboard/projects')} 
              className="mt-4"
              variant="outline"
            >
              Back to Projects
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <p>Project not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleProjectAction = async (action: string) => {
    try {
      switch (action) {
        case 'edit':
          router.push(`/dashboard/projects/${projectId}/edit`);
          break;
        case 'archive':
          await archiveProject(projectId);
          break;
        case 'delete':
          if (confirm('Are you sure you want to delete this project?')) {
            await deleteProject(projectId);
            router.push('/dashboard/projects');
          }
          break;
      }
    } catch (error) {
      console.error(`Error performing ${action}:`, error);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const completedTasks = (tasks || []).filter(task => task.status === 'done').length;
  const totalTasks = (tasks || []).length;
  const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const overdueTasks = (tasks || []).filter(task => 
    task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done'
  ).length;

  return (
    <div className="space-y-6">
      {/* Project Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold tracking-tight">{currentProject.name}</h1>
            <ProjectStatusBadge status={currentProject.status} />
            <ProjectPriorityBadge priority={currentProject.priority} />
          </div>
          
          {currentProject.description && (
            <p className="text-muted-foreground">{currentProject.description}</p>
          )}
          
          <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
            {currentProject.clientName && (
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {currentProject.clientName}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Created {formatDate(currentProject.createdAt)}
            </span>
            {currentProject.targetDate && (
              <span className="flex items-center gap-1">
                <Target className="h-4 w-4" />
                Due {formatDate(currentProject.targetDate)}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Quick Add
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleProjectAction('edit')}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Project
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Share className="h-4 w-4 mr-2" />
                Share
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleProjectAction('archive')}>
                <Archive className="h-4 w-4 mr-2" />
                Archive
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleProjectAction('delete')}
                className="text-red-600"
              >
                Delete Project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Project Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progress</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(progressPercentage)}%</div>
            <p className="text-xs text-muted-foreground">
              {completedTasks} of {totalTasks} tasks completed
            </p>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentProject.budget 
                ? formatCurrency(currentProject.budget, currentProject.currency || 'USD')
                : 'Not set'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              {currentProject.actualCost && currentProject.actualCost > 0 
                ? `${formatCurrency(currentProject.actualCost)} spent`
                : 'No expenses yet'
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTasks}</div>
            <p className="text-xs text-muted-foreground">
              {overdueTasks > 0 ? `${overdueTasks} overdue` : 'On track'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Files</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(files || []).length}</div>
            <p className="text-xs text-muted-foreground">
              Documents uploaded
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tags */}
      {currentProject.tags && currentProject.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {currentProject.tags.map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Project Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(tasks || []).slice(0, 5).map((task) => (
                    <div key={task.id} className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${
                        task.status === 'done' ? 'bg-green-500' :
                        task.status === 'in_progress' ? 'bg-blue-500' :
                        'bg-gray-300'
                      }`} />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{task.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {task.assignedTo?.firstName || 'Unassigned'}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {(tasks || []).length === 0 && (
                    <p className="text-sm text-muted-foreground">No tasks yet</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Milestones */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Upcoming Milestones</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(milestones || []).slice(0, 5).map((milestone) => (
                    <div key={milestone.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{milestone.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(milestone.targetDate)}
                        </p>
                      </div>
                      <Badge variant={milestone.isCompleted ? 'default' : 'secondary'}>
                        {milestone.isCompleted ? 'Done' : 'Pending'}
                      </Badge>
                    </div>
                  ))}
                  
                  {(milestones || []).length === 0 && (
                    <p className="text-sm text-muted-foreground">No milestones set</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Project Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Timeline</span>
                      <span className="font-medium">On Track</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '75%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Budget</span>
                      <span className="font-medium">Under Budget</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: '60%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Quality</span>
                      <span className="font-medium">Excellent</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-purple-500 h-2 rounded-full" style={{ width: '92%' }} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Activity Feed */}
          <div className="mt-6">
            <ProjectActivityFeed projectId={projectId} limit={10} />
          </div>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <ProjectKanbanBoard projectId={projectId} />
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <ProjectTimeline projectId={projectId} />
        </TabsContent>

        <TabsContent value="workflows" className="space-y-4">
          <WorkflowIntegration 
            projectId={projectId} 
            projectName={currentProject.name}
            projectType={currentProject.type || 'standard'}
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <ProjectAnalytics projectId={projectId} />
        </TabsContent>

        <TabsContent value="files" className="space-y-4">
          <ProjectFileManager projectId={projectId} />
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          <ProjectTeamMembers projectId={projectId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}