/**
 * Prior Art Dashboard
 * Main dashboard showing all prior art projects with consistent structure to analytics
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Search,
  Filter,
  MoreVertical,
  Shield,
  Lightbulb,
  Gavel,
  Map,
  BookOpen,
  Settings,
  Clock,
  CheckCircle2,
  Archive,
  Eye,
  Edit,
  Copy,
  Trash2,
  Download,
  Play,
  Target,
  FileText,
  BarChart3,
  TrendingUp,
  Calendar,
  Users
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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

import { CreateProjectDialog } from '@/components/prior-art/CreateProjectDialog';
import { 
  PriorArtProject, 
  PriorArtProjectStatus, 
  PriorArtProjectType,
  PROJECT_TYPE_CONFIG 
} from '@/types/prior-art.types';
import { priorArtApi } from '@/services/priorArtApi';

const PROJECT_ICONS = {
  [PriorArtProjectType.FTO]: Shield,
  [PriorArtProjectType.NOVELTY]: Lightbulb,
  [PriorArtProjectType.INVALIDITY]: Gavel,
  [PriorArtProjectType.LANDSCAPE]: Map,
  [PriorArtProjectType.STATE_OF_ART]: BookOpen,
  [PriorArtProjectType.CUSTOM]: Settings,
};

const getStatusColor = (status: PriorArtProjectStatus | string) => {
  switch (status) {
    case PriorArtProjectStatus.DRAFT:
    case 'draft': return 'bg-gray-500';
    case PriorArtProjectStatus.PLANNING:
    case 'planning': return 'bg-blue-500';
    case PriorArtProjectStatus.ACTIVE:
    case 'active': return 'bg-green-500';
    case PriorArtProjectStatus.ANALYSIS:
    case 'analysis': return 'bg-purple-500';
    case PriorArtProjectStatus.REVIEW:
    case 'review': return 'bg-orange-500';
    case PriorArtProjectStatus.COMPLETED:
    case 'completed': return 'bg-emerald-500';
    case PriorArtProjectStatus.ON_HOLD:
    case 'on_hold': return 'bg-yellow-500';
    case PriorArtProjectStatus.ARCHIVED:
    case 'archived': return 'bg-gray-400';
    default: return 'bg-gray-500';
  }
};

const getPriorityVariant = (priority: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (priority) {
    case 'urgent': return 'destructive';
    case 'high': return 'default';
    case 'medium': return 'secondary';
    case 'low': return 'outline';
    default: return 'secondary';
  }
};

export default function PriorArtDashboard() {
  const router = useRouter();
  const [projects, setProjects] = useState<PriorArtProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  
  // Dashboard metrics
  const [metrics, setMetrics] = useState({
    activeProjects: 0,
    completedSearches: 0,
    referencesFound: 0,
    evidenceIdentified: 0,
    completionRate: 0,
    monthlyGrowth: 0
  });

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    calculateMetrics();
  }, [projects]);

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      const response = await priorArtApi.getProjects();
      if (response.success && response.data) {
        setProjects(response.data);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateMetrics = () => {
    const active = projects.filter(p => p.status === 'active' || p.status === 'analysis').length;
    const completed = projects.filter(p => p.status === 'completed').length;
    const totalRefs = projects.reduce((sum, p) => sum + (p.total_results || 0), 0);
    const totalEvidence = projects.reduce((sum, p) => sum + (p.analyzed_results || 0), 0);
    const avgCompletion = projects.length > 0 
      ? Math.round(projects.reduce((sum, p) => sum + (p.progress_percentage || 0), 0) / projects.length)
      : 0;

    setMetrics({
      activeProjects: active,
      completedSearches: completed,
      referencesFound: totalRefs,
      evidenceIdentified: totalEvidence,
      completionRate: avgCompletion,
      monthlyGrowth: 12 // Mock value for now
    });
  };

  const handleViewProject = (projectId: string) => {
    router.push(`/dashboard/prior-art/projects/${projectId}`);
  };

  const handleEditProject = (projectId: string) => {
    router.push(`/dashboard/prior-art/projects/${projectId}/edit`);
  };

  const handleDuplicateProject = async (projectId: string) => {
    // TODO: Implement duplicate functionality
    console.log('Duplicate project:', projectId);
  };

  const handleDeleteProject = async (projectId: string) => {
    if (confirm('Are you sure you want to delete this project?')) {
      try {
        await priorArtApi.deleteProject(projectId);
        loadProjects();
      } catch (error) {
        console.error('Failed to delete project:', error);
      }
    }
  };

  const handleExportData = (projectId: string) => {
    // TODO: Implement export functionality
    console.log('Export project:', projectId);
  };

  const handleStartSearch = async (projectId: string) => {
    try {
      await priorArtApi.updateProject(projectId, { status: PriorArtProjectStatus.ACTIVE });
      handleViewProject(projectId);
    } catch (error) {
      console.error('Failed to start search:', error);
    }
  };

  const handleProjectCreate = async (project: PriorArtProject) => {
    setProjects(prev => [project, ...prev]);
    setShowCreateDialog(false);
    handleViewProject(project.id);
  };

  // Filter projects based on search and filters
  const filteredProjects = projects.filter(project => {
    const matchesSearch = !searchTerm || 
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || statusFilter === 'all' || project.status === statusFilter;
    const matchesType = !typeFilter || typeFilter === 'all' || project.type === typeFilter;
    const matchesPriority = !priorityFilter || priorityFilter === 'all' || project.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesType && matchesPriority;
  });

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Prior Art Research</h2>
          <p className="text-muted-foreground">
            Systematic patent and non-patent literature search for FTO, novelty, and invalidity analysis
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeProjects}</div>
            <p className="text-xs text-muted-foreground">Currently in progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.completedSearches}</div>
            <p className="text-xs text-muted-foreground">Total searches</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">References</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.referencesFound.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Documents found</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Evidence</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.evidenceIdentified}</div>
            <p className="text-xs text-muted-foreground">Analyzed items</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.completionRate}%</div>
            <p className="text-xs text-muted-foreground">Average progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Activity</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{metrics.monthlyGrowth}%</div>
            <p className="text-xs text-muted-foreground">From last month</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon" onClick={() => setShowFilters(!showFilters)}>
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4 bg-muted rounded-lg">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="planning">Planning</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="analysis">Analysis</SelectItem>
                <SelectItem value="review">Review</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-medium">Type</Label>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value={PriorArtProjectType.FTO}>Freedom to Operate</SelectItem>
                <SelectItem value={PriorArtProjectType.NOVELTY}>Novelty Search</SelectItem>
                <SelectItem value={PriorArtProjectType.INVALIDITY}>Invalidity Search</SelectItem>
                <SelectItem value={PriorArtProjectType.LANDSCAPE}>Landscape Analysis</SelectItem>
                <SelectItem value={PriorArtProjectType.STATE_OF_ART}>State of the Art</SelectItem>
                <SelectItem value={PriorArtProjectType.CUSTOM}>Custom Search</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-medium">Priority</Label>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All priorities</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Actions</Label>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => {
                setStatusFilter('all');
                setTypeFilter('all');
                setPriorityFilter('all');
                setSearchTerm('');
              }}
            >
              Clear Filters
            </Button>
          </div>
        </div>
      )}

      {/* Projects Grid */}
      {isLoading ? (
        <div className="text-center py-8">Loading projects...</div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {projects.length === 0 
            ? "No prior art projects found. Create your first project to get started."
            : "No projects match your filters."}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => {
            const Icon = PROJECT_ICONS[project.type] || Settings;
            return (
              <Card key={project.id} className="relative hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                        <CardTitle className="text-base">{project.name}</CardTitle>
                      </div>
                      <CardDescription className="line-clamp-2">
                        {project.description || PROJECT_TYPE_CONFIG[project.type]?.description}
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleViewProject(project.id)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditProject(project.id)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Project
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicateProject(project.id)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicate
                        </DropdownMenuItem>
                        {(project.status === 'draft' || project.status === 'planning') && (
                          <DropdownMenuItem onClick={() => handleStartSearch(project.id)}>
                            <Play className="mr-2 h-4 w-4" />
                            Start Search
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleExportData(project.id)}>
                          <Download className="mr-2 h-4 w-4" />
                          Export Data
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDeleteProject(project.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <Badge variant={getPriorityVariant(project.priority || 'medium')}>
                      {project.priority || 'medium'}
                    </Badge>
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(project.status)}`} />
                    <span className="text-xs text-muted-foreground capitalize">
                      {project.status.replace('_', ' ')}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="pt-0" onClick={() => handleViewProject(project.id)}>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progress</span>
                        <span>{project.progress_percentage || 0}%</span>
                      </div>
                      <Progress value={project.progress_percentage || 0} className="h-2" />
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">References</p>
                        <p className="font-medium">{project.total_results || 0}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Analyzed</p>
                        <p className="font-medium">{project.analyzed_results || 0}</p>
                      </div>
                    </div>
                    {project.target_patent && (
                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground">Target Patent</p>
                        <p className="text-sm font-medium truncate">
                          {typeof project.target_patent === 'string' 
                            ? project.target_patent 
                            : project.target_patent.patent_number}
                        </p>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>Updated {new Date(project.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Project Dialog */}
      {showCreateDialog && (
        <CreateProjectDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onProjectCreate={handleProjectCreate}
        />
      )}
    </div>
  );
}