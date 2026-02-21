/**
 * Prior Art Projects Component
 * Manages the display and creation of prior art projects
 */

'use client';

import { useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Shield,
  Lightbulb,
  Gavel,
  Map,
  BookOpen,
  Settings,
  Clock,
  CheckCircle2,
  Archive,
  Calendar,
  Users,
  FileText,
  BarChart3
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { CreateProjectDialog } from './CreateProjectDialog';
import { 
  PriorArtProject, 
  PriorArtProjectStatus, 
  PriorArtProjectType,
  PROJECT_TYPE_CONFIG 
} from '@/types/prior-art.types';

interface PriorArtProjectsProps {
  projects: PriorArtProject[];
  onProjectSelect: (project: PriorArtProject) => void;
  onProjectCreate: (project: PriorArtProject) => void;
  onProjectsUpdate: () => void;
  isLoading: boolean;
}

const PROJECT_ICONS = {
  [PriorArtProjectType.FTO]: Shield,
  [PriorArtProjectType.NOVELTY]: Lightbulb,
  [PriorArtProjectType.INVALIDITY]: Gavel,
  [PriorArtProjectType.LANDSCAPE]: Map,
  [PriorArtProjectType.STATE_OF_ART]: BookOpen,
  [PriorArtProjectType.CUSTOM]: Settings,
};

export function PriorArtProjects({
  projects,
  onProjectSelect,
  onProjectCreate,
  onProjectsUpdate,
  isLoading
}: PriorArtProjectsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filter projects based on search and filters
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || project.type === filterType;
    const matchesStatus = filterStatus === 'all' || project.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  // Group projects by status
  const groupedProjects = {
    active: filteredProjects.filter(p => p.status === PriorArtProjectStatus.ACTIVE),
    completed: filteredProjects.filter(p => p.status === PriorArtProjectStatus.COMPLETED),
    archived: filteredProjects.filter(p => p.status === PriorArtProjectStatus.ARCHIVED),
    draft: filteredProjects.filter(p => p.status === PriorArtProjectStatus.DRAFT),
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const ProjectCard = ({ project }: { project: PriorArtProject }) => {
    const Icon = PROJECT_ICONS[project.type];
    const config = PROJECT_TYPE_CONFIG[project.type];
    
    return (
      <Card 
        className="group cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/20"
        onClick={() => onProjectSelect(project)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-${config.color}-100 text-${config.color}-600`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base truncate group-hover:text-primary transition-colors">
                  {project.name}
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  {config.label}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge 
                variant={
                  project.status === 'active' ? 'default' :
                  project.status === 'completed' ? 'secondary' :
                  project.status === 'archived' ? 'outline' : 'destructive'
                }
                className="text-xs"
              >
                {project.status}
              </Badge>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onProjectSelect(project)}>
                    Open Project
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    Edit Details
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    Archive
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive">
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {project.description || 'No description provided'}
          </p>
          
          {/* Target Patent (for invalidity projects) */}
          {project.target_patent && (
            <div className="mb-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-xs font-medium text-muted-foreground mb-1">Target Patent</p>
              <p className="text-sm font-mono">{project.target_patent.patent_number}</p>
              {project.target_patent.title && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                  {project.target_patent.title}
                </p>
              )}
            </div>
          )}
          
          {/* Project Stats */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <p className="text-lg font-semibold">{project.total_results}</p>
              <p className="text-xs text-muted-foreground">Results</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold">{project.analyzed_results}</p>
              <p className="text-xs text-muted-foreground">Analyzed</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold">{project.total_queries}</p>
              <p className="text-xs text-muted-foreground">Searches</p>
            </div>
          </div>
          
          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(project.updated_at)}
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {project.created_by.first_name} {project.created_by.last_name}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header with Search and Filters */}
      <div className="border-b bg-background p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Prior Art Projects</h2>
            <p className="text-sm text-muted-foreground">
              Manage your patent search and analysis projects
            </p>
          </div>
          
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </div>
        
        {/* Search and Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Object.entries(PROJECT_TYPE_CONFIG).map(([type, config]) => (
                <SelectItem key={type} value={type}>
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Projects Content */}
      <div className="flex-1 overflow-auto p-6">
        {filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="rounded-full bg-muted p-6 mb-4">
              <Folder className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">
              {projects.length === 0 ? 'No projects yet' : 'No projects match your filters'}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              {projects.length === 0 
                ? 'Create your first prior art project to start searching for patents and literature.'
                : 'Try adjusting your search terms or filters to find what you\'re looking for.'
              }
            </p>
            {projects.length === 0 && (
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Project
              </Button>
            )}
          </div>
        ) : (
          <Tabs defaultValue="active" className="h-full">
            <TabsList className="mb-6">
              <TabsTrigger value="active" className="gap-2">
                <Clock className="h-4 w-4" />
                Active ({groupedProjects.active.length})
              </TabsTrigger>
              <TabsTrigger value="completed" className="gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Completed ({groupedProjects.completed.length})
              </TabsTrigger>
              <TabsTrigger value="archived" className="gap-2">
                <Archive className="h-4 w-4" />
                Archived ({groupedProjects.archived.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="active">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groupedProjects.active.map(project => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="completed">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groupedProjects.completed.map(project => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="archived">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groupedProjects.archived.map(project => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Create Project Dialog */}
      <CreateProjectDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onProjectCreate={onProjectCreate}
      />
    </div>
  );
}