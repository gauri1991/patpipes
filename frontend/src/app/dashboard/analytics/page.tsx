'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  TrendingUp, 
  FileText, 
  Users, 
  Eye,
  Edit,
  Play,
  Pause,
  MoreVertical,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Activity,
  Database,
  PieChart,
  LineChart,
  Map,
  Network,
  Filter,
  Download,
  Search,
  Settings,
  Trash2,
  Copy,
  Archive,
  ArchiveRestore,
  RefreshCw
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

import { useAnalyticsDashboard, useAnalyticsProjects } from '@/hooks/useAnalyticsData';
import { analyticsApi } from '@/services/analyticsApi';
import { ReportsTab } from '@/components/analytics/ReportsTab';
import { ComprehensiveTemplatesTab } from '@/components/analytics/ComprehensiveTemplatesTab';
import { GlobalCompetitorsTab } from '@/components/analytics/GlobalCompetitorsTab';
import { GlobalTechnologyAreasTab } from '@/components/analytics/GlobalTechnologyAreasTab';
import { CreateProjectDialog } from '@/components/analytics/CreateProjectDialog';

export default function AnalyticsPage() {
  const router = useRouter();
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showSettings, setShowSettings] = useState(false);

  // Data hooks
  const { dashboard, loading: dashboardLoading } = useAnalyticsDashboard();
  const { 
    projects, 
    loading: projectsLoading, 
    createProject, 
    updateProject,
    deleteProject,
    startAnalysis 
  } = useAnalyticsProjects();

  const handleCreateProject = async (data: any) => {
    try {
      await createProject(data);
      setShowCreateProject(false);
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  const handleViewProject = (projectId: string) => {
    router.push(`/dashboard/analytics/projects/${projectId}`);
  };

  const handleEditProject = (projectId: string) => {
    router.push(`/dashboard/analytics/projects/${projectId}/edit`);
  };

  const handleExportData = async (projectId: string, format: 'json' | 'csv' | 'excel' = 'json') => {
    try {
      console.log(`Exporting project ${projectId} as ${format}`);
      const blob = await analyticsApi.exportProjectData(projectId, format);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Get project name for filename
      const project = projects.find(p => p.id === projectId);
      const projectName = project?.name?.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'project';
      
      const extension = format === 'excel' ? 'xlsx' : format;
      link.download = `${projectName}_export.${extension}`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('Export completed successfully');
    } catch (error) {
      console.error('Failed to export project data:', error);
      alert('Failed to export project data. Please try again.');
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      try {
        await deleteProject(projectId);
      } catch (error) {
        console.error('Error deleting project:', error);
      }
    }
  };

  const handleDuplicateProject = async (projectId: string) => {
    try {
      console.log('Duplicating project:', projectId);
      const duplicatedProject = await analyticsApi.duplicateProject(projectId);
      
      // Refresh projects list to show the new duplicate
      window.location.reload();
      
      console.log('Project duplicated successfully:', duplicatedProject);
    } catch (error) {
      console.error('Failed to duplicate project:', error);
      alert('Failed to duplicate project. Please try again.');
    }
  };

  const handleArchiveProject = async (projectId: string) => {
    if (confirm('Are you sure you want to archive this project? You can unarchive it later.')) {
      try {
        await analyticsApi.archiveProject(projectId);
        console.log('Project archived successfully');
        // Refresh the projects list
        window.location.reload();
      } catch (error) {
        console.error('Failed to archive project:', error);
        alert('Failed to archive project. Please try again.');
      }
    }
  };

  const handleUnarchiveProject = async (projectId: string) => {
    try {
      await analyticsApi.unarchiveProject(projectId, 'active');
      console.log('Project unarchived successfully');
      // Refresh the projects list
      window.location.reload();
    } catch (error) {
      console.error('Failed to unarchive project:', error);
      alert('Failed to unarchive project. Please try again.');
    }
  };

  const handleUpdateProjectStatus = async (projectId: string, newStatus: string) => {
    try {
      await analyticsApi.updateProjectStatus(projectId, newStatus);
      console.log('Project status updated successfully');
      // Refresh the projects list
      window.location.reload();
    } catch (error) {
      console.error('Failed to update project status:', error);
      alert('Failed to update project status. Please try again.');
    }
  };


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'active': return 'bg-blue-500';
      case 'data_collection': return 'bg-yellow-500';
      case 'patent_analysis': return 'bg-purple-500';
      case 'visualization': return 'bg-orange-500';
      case 'on_hold': return 'bg-gray-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Patent Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive patent landscape analysis and competitive intelligence
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Dialog open={showSettings} onOpenChange={setShowSettings}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
            </DialogTrigger>
            <AnalyticsSettingsDialog />
          </Dialog>
          <Dialog open={showCreateProject} onOpenChange={setShowCreateProject}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Analytics Project
              </Button>
            </DialogTrigger>
            <CreateProjectDialog onSubmit={handleCreateProject} />
          </Dialog>
        </div>
      </div>

      {/* Dashboard Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardLoading ? '...' : dashboard?.total_projects || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Active analytics projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Patents Analyzed</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardLoading ? '...' : dashboard?.total_patents_analyzed?.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all datasets
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visualizations</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardLoading ? '...' : dashboard?.total_visualizations || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Interactive charts & maps
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardLoading ? '...' : dashboard ? `${Math.round((dashboard.completed_projects / dashboard.total_projects) * 100)}%` : '0%'}
            </div>
            <p className="text-xs text-muted-foreground">
              +2% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="projects" className="space-y-4">
        <TabsList>
          <TabsTrigger value="projects">Analytics Projects</TabsTrigger>
          <TabsTrigger value="competitors">Competitors</TabsTrigger>
          <TabsTrigger value="technology">Technology Areas</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        {/* Analytics Projects Tab */}
        <TabsContent value="projects" className="space-y-4">
          {/* Search and Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="data_collection">Data Collection</SelectItem>
                <SelectItem value="patent_analysis">Patent Analysis</SelectItem>
                <SelectItem value="visualization">Visualization</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            {/* Priority Filter */}
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>

            {/* Type Filter */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="landscape_analysis">Landscape Analysis</SelectItem>
                <SelectItem value="competitive_intelligence">Competitive Intelligence</SelectItem>
                <SelectItem value="fto_analysis">FTO Analysis</SelectItem>
                <SelectItem value="white_space_analysis">White Space Analysis</SelectItem>
                <SelectItem value="portfolio_assessment">Portfolio Assessment</SelectItem>
                <SelectItem value="technology_trends">Technology Trends</SelectItem>
                <SelectItem value="market_analysis">Market Analysis</SelectItem>
                <SelectItem value="investment_analysis">Investment Analysis</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Projects Content */}
          {projectsLoading ? (
            <div className="text-center py-8">Loading projects...</div>
          ) : projects.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No analytics projects found. Create your first project to get started.
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {projects
                .filter(project => {
                  // Search term filter
                  const matchesSearch = !searchTerm || 
                    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()));
                  
                  // Status filter
                  const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
                  
                  // Priority filter
                  const matchesPriority = priorityFilter === 'all' || project.priority === priorityFilter;
                  
                  // Type filter (stored in analysis_scope.type)
                  const projectType = project.analysis_scope?.type;
                  const matchesType = typeFilter === 'all' || projectType === typeFilter;
                  
                  return matchesSearch && matchesStatus && matchesPriority && matchesType;
                })
                .map((project, index) => (
                <Card key={project.id || `project-${index}`} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <CardTitle className="text-base">{project.name}</CardTitle>
                        <CardDescription className="line-clamp-3">{project.description}</CardDescription>
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
                            Duplicate Project
                          </DropdownMenuItem>
                          {project.status === 'draft' && (
                            <DropdownMenuItem onClick={() => startAnalysis(project.id)}>
                              <Play className="mr-2 h-4 w-4" />
                              Start Analysis
                            </DropdownMenuItem>
                          )}
                          {project.status === 'on_hold' ? (
                            <DropdownMenuItem onClick={() => handleUnarchiveProject(project.id)}>
                              <ArchiveRestore className="mr-2 h-4 w-4" />
                              Unarchive Project
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => handleArchiveProject(project.id)}>
                              <Archive className="mr-2 h-4 w-4" />
                              Archive Project
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <Download className="mr-2 h-4 w-4" />
                                Export Data
                              </DropdownMenuItem>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent side="left">
                              <DropdownMenuItem onClick={() => handleExportData(project.id, 'json')}>
                                Export as JSON
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleExportData(project.id, 'csv')}>
                                Export as CSV
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleExportData(project.id, 'excel')}>
                                Export as Excel
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeleteProject(project.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Project
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      <Badge variant={getPriorityVariant(project.priority)}>
                        {project.priority}
                      </Badge>
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(project.status)}`} />
                      <span className="text-xs text-muted-foreground capitalize">
                        {project.status.replace('_', ' ')}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Progress</span>
                          <span>{project.progress_percentage}%</span>
                        </div>
                        <Progress value={project.progress_percentage} className="h-2" />
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Datasets</span>
                          <p className="font-medium">{project.datasets?.length || 0}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Visualizations</span>
                          <p className="font-medium">{project.visualizations?.length || 0}</p>
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-2">
                        <span className="text-xs text-muted-foreground">
                          {project.due_date ? `Due ${new Date(project.due_date).toLocaleDateString()}` : 'No due date'}
                        </span>
                        <Button size="sm" onClick={() => handleViewProject(project.id)}>
                          <Eye className="mr-2 h-3 w-3" />
                          Open
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>


        <TabsContent value="reports" className="space-y-4">
          <ReportsTab />
        </TabsContent>

        <TabsContent value="competitors" className="space-y-4">
          <GlobalCompetitorsTab />
        </TabsContent>

        <TabsContent value="technology" className="space-y-4">
          <GlobalTechnologyAreasTab />
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <ComprehensiveTemplatesTab />
        </TabsContent>

      </Tabs>
    </div>
  );
}

// Analytics Settings Dialog Component
function AnalyticsSettingsDialog() {
  const [settings, setSettings] = useState({
    defaultView: 'grid',
    autoRefresh: true,
    refreshInterval: 30,
    showCompletedProjects: true,
    enableNotifications: true,
    exportFormat: 'excel',
    theme: 'system'
  });

  const handleSaveSettings = () => {
    // Save settings to localStorage or API
    localStorage.setItem('analyticsSettings', JSON.stringify(settings));
    console.log('Settings saved:', settings);
  };

  return (
    <DialogContent className="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>Analytics Settings</DialogTitle>
        <DialogDescription>
          Configure your analytics dashboard preferences and default behaviors.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-6 py-4">
        {/* Display Settings */}
        <div className="space-y-4">
          <h4 className="font-medium">Display</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="defaultView">Default Project View</Label>
              <Select
                value={settings.defaultView}
                onValueChange={(value) => setSettings({ ...settings, defaultView: value })}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grid">Grid</SelectItem>
                  <SelectItem value="list">List</SelectItem>
                  <SelectItem value="table">Table</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Show Completed Projects</Label>
                <p className="text-sm text-muted-foreground">Display completed projects in the main view</p>
              </div>
              <input
                type="checkbox"
                checked={settings.showCompletedProjects}
                onChange={(e) => setSettings({ ...settings, showCompletedProjects: e.target.checked })}
                className="rounded"
              />
            </div>
          </div>
        </div>

        {/* Auto-refresh Settings */}
        <div className="space-y-4">
          <h4 className="font-medium">Auto-refresh</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Auto-refresh</Label>
                <p className="text-sm text-muted-foreground">Automatically refresh dashboard data</p>
              </div>
              <input
                type="checkbox"
                checked={settings.autoRefresh}
                onChange={(e) => setSettings({ ...settings, autoRefresh: e.target.checked })}
                className="rounded"
              />
            </div>
            
            {settings.autoRefresh && (
              <div className="flex items-center justify-between">
                <Label htmlFor="refreshInterval">Refresh Interval (seconds)</Label>
                <Select
                  value={settings.refreshInterval.toString()}
                  onValueChange={(value) => setSettings({ ...settings, refreshInterval: parseInt(value) })}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15s</SelectItem>
                    <SelectItem value="30">30s</SelectItem>
                    <SelectItem value="60">60s</SelectItem>
                    <SelectItem value="300">5m</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        {/* Export Settings */}
        <div className="space-y-4">
          <h4 className="font-medium">Export</h4>
          <div className="flex items-center justify-between">
            <Label htmlFor="exportFormat">Default Export Format</Label>
            <Select
              value={settings.exportFormat}
              onValueChange={(value) => setSettings({ ...settings, exportFormat: value })}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="excel">Excel</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Notifications */}
        <div className="space-y-4">
          <h4 className="font-medium">Notifications</h4>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Notifications</Label>
              <p className="text-sm text-muted-foreground">Get notified about project updates</p>
            </div>
            <input
              type="checkbox"
              checked={settings.enableNotifications}
              onChange={(e) => setSettings({ ...settings, enableNotifications: e.target.checked })}
              className="rounded"
            />
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline">
          Reset to Defaults
        </Button>
        <Button onClick={handleSaveSettings}>
          Save Settings
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}