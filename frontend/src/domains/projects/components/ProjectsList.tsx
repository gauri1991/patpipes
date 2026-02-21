/**
 * ProjectsList Component
 * Comprehensive project management list with advanced filtering and actions
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Filter, MoreHorizontal, Calendar, Users, DollarSign, Clock, Archive, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

import { useProjectsStore } from '../store/projects.store';
import { Project, ProjectStatus, ProjectPriority, ProjectTypeId } from '../types/project.types';
import { ProjectFilters } from './ProjectFilters';
import { ProjectStatusBadge } from './ProjectStatusBadge';
import { ProjectPriorityBadge } from './ProjectPriorityBadge';

export function ProjectsList() {
  const router = useRouter();
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const {
    projects = [], // Default to empty array
    isLoading,
    error,
    filters,
    searchQuery,
    selectedProjectIds,
    fetchProjects,
    setSearchQuery,
    setFilters,
    toggleProjectSelection,
    clearProjectSelection,
    archiveProject,
    deleteProject,
    duplicateProject
  } = useProjectsStore();

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSearchQuery(searchTerm);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, setSearchQuery]);

  const handleCreateProject = () => {
    router.push('/dashboard/projects/new');
  };

  const handleProjectClick = (projectId: string) => {
    router.push(`/dashboard/projects/${projectId}`);
  };

  const handleProjectAction = async (action: string, projectId: string) => {
    try {
      switch (action) {
        case 'view':
          handleProjectClick(projectId);
          break;
        case 'duplicate':
          await duplicateProject(projectId);
          break;
        case 'archive':
          await archiveProject(projectId);
          break;
        case 'delete':
          if (confirm('Are you sure you want to delete this project?')) {
            await deleteProject(projectId);
          }
          break;
      }
    } catch (error) {
      console.error(`Error performing ${action} on project:`, error);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getProjectTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      [ProjectTypeId.UTILITY_PATENT]: 'bg-blue-100 text-blue-800',
      [ProjectTypeId.DESIGN_PATENT]: 'bg-purple-100 text-purple-800',
      [ProjectTypeId.PROVISIONAL_PATENT]: 'bg-green-100 text-green-800',
      [ProjectTypeId.TRADEMARK]: 'bg-orange-100 text-orange-800',
      [ProjectTypeId.COPYRIGHT]: 'bg-pink-100 text-pink-800',
      [ProjectTypeId.TRADE_SECRET]: 'bg-gray-100 text-gray-800',
      [ProjectTypeId.LICENSING]: 'bg-yellow-100 text-yellow-800',
      [ProjectTypeId.IP_AUDIT]: 'bg-indigo-100 text-indigo-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    if (percentage >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  if (isLoading && (!projects || projects.length === 0)) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Manage your patent projects and intellectual property workflows
          </p>
        </div>
        <Button onClick={handleCreateProject} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
          </Button>
          {selectedProjectIds.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {selectedProjectIds.length} selected
              </span>
              <Button variant="outline" size="sm" onClick={clearProjectSelection}>
                Clear
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filter Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <ProjectFilters />
          </CardContent>
        </Card>
      )}

      {/* Error Message */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Projects Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects && projects.length > 0 && projects.map((project) => (
          <Card 
            key={project.id} 
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => handleProjectClick(project.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg line-clamp-1">{project.name}</CardTitle>
                  <CardDescription className="line-clamp-2 mt-1">
                    {project.description || 'No description provided'}
                  </CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleProjectAction('view', project.id)}>
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleProjectAction('duplicate', project.id)}>
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleProjectAction('archive', project.id)}>
                      <Archive className="h-4 w-4 mr-2" />
                      Archive
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleProjectAction('delete', project.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex flex-wrap gap-2 mt-3">
                <Badge className={getProjectTypeColor(project.type)} variant="secondary">
                  {project.type.replace('_', ' ')}
                </Badge>
                <ProjectStatusBadge status={project.status} />
                <ProjectPriorityBadge priority={project.priority} />
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="space-y-3">
                {/* Progress Bar */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">Progress</span>
                    <span className="text-sm text-muted-foreground">
                      {project.progressPercentage}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${getProgressColor(project.progressPercentage)}`}
                      style={{ width: `${project.progressPercentage}%` }}
                    ></div>
                  </div>
                </div>

                {/* Project Stats */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{project.totalTasks || 0} tasks</span>
                  </div>
                  {project.budget && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <DollarSign className="h-4 w-4" />
                      <span>{formatCurrency(project.budget, project.currency)}</span>
                    </div>
                  )}
                  {project.targetDate && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(project.targetDate.toString())}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{formatDate(project.updatedAt.toString())}</span>
                  </div>
                </div>

                {/* Client Info */}
                {project.clientName && (
                  <div className="pt-2 border-t">
                    <p className="text-sm font-medium">Client</p>
                    <p className="text-sm text-muted-foreground">{project.clientName}</p>
                  </div>
                )}

                {/* Tags */}
                {project.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {project.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {project.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{project.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {!isLoading && (!projects || projects.length === 0) && (
        <Card className="text-center py-12">
          <CardContent>
            <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
              <Plus className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
            <p className="text-muted-foreground mb-6">
              Get started by creating your first patent project
            </p>
            <Button onClick={handleCreateProject} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create First Project
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && projects.length > 0 && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
      )}
    </div>
  );
}