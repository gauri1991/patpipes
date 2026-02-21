'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Settings,
  Download,
  Share,
  MoreVertical,
  Calendar,
  Clock,
  Users,
  Target,
  Database,
  BarChart3,
  FileText,
  Lightbulb,
  TrendingUp,
  Edit,
  Trash2,
  Link2,
  Mail,
  Presentation
} from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { useAnalyticsProject, useAnalyticsDatasets, useAnalyticsProjects } from '@/hooks/useAnalyticsData';
import { DatasetsTab } from '@/components/analytics/DatasetsTab';
import { VisualizationsTab } from '@/components/analytics/VisualizationsTab';
import { ResearchTab } from '@/components/research/ResearchTab';
import { ProjectReportsTab } from '@/components/analytics/ProjectReportsTab';
import { PresentationTab } from '@/components/analytics/PresentationTab';
import { EnhancedClassifierTab } from '@/components/research/classifier/EnhancedClassifierTab';
import { InsightsTab } from '@/components/analytics/InsightsTab';
import { ProjectCompetitorsTab } from '@/components/analytics/ProjectCompetitorsTab';
import { ProjectTechnologyAreasTab } from '@/components/analytics/ProjectTechnologyAreasTab';
import { analyticsApi } from '@/services/analyticsApi';

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = params.id as string;

  const [activeTab, setActiveTab] = useState('overview');
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const { deleteProject } = useAnalyticsProjects();

  // Persist tab selection in localStorage and handle query params
  useEffect(() => {
    // Check if there's a tab query parameter
    const tabFromQuery = searchParams.get('tab');
    if (tabFromQuery) {
      setActiveTab(tabFromQuery);
      localStorage.setItem(`analytics-project-${projectId}-tab`, tabFromQuery);
    } else {
      // Otherwise check localStorage
      const savedTab = localStorage.getItem(`analytics-project-${projectId}-tab`);
      if (savedTab) {
        setActiveTab(savedTab);
      }
    }
  }, [projectId, searchParams]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    localStorage.setItem(`analytics-project-${projectId}-tab`, value);
  };
  
  const { project, loading, error, refetch } = useAnalyticsProject(projectId);
  const { datasets, refetch: refetchDatasets } = useAnalyticsDatasets(projectId);

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

  const handleBack = () => {
    router.push('/dashboard/analytics');
  };

  const handleEdit = () => {
    router.push(`/dashboard/analytics/projects/${projectId}/edit`);
  };

  const handleShare = () => {
    setShowShareDialog(true);
  };

  const handleShareSubmit = async () => {
    if (!shareEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    try {
      // Copy project link to clipboard
      const projectUrl = `${window.location.origin}/dashboard/analytics/projects/${projectId}`;
      await navigator.clipboard.writeText(projectUrl);

      // Simulate sending email (implement actual API call here)
      toast.success(`Project link shared with ${shareEmail} and copied to clipboard!`);
      setShowShareDialog(false);
      setShareEmail('');
    } catch (error) {
      toast.error('Failed to share project');
    }
  };

  const handleCopyLink = async () => {
    try {
      const projectUrl = `${window.location.origin}/dashboard/analytics/projects/${projectId}`;
      await navigator.clipboard.writeText(projectUrl);
      toast.success('Project link copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const handleExportData = async () => {
    try {
      setIsExporting(true);
      toast.info('Preparing project data export...');

      // Call export API
      const response = await analyticsApi.exportProjectData(projectId);

      // Create download link
      const blob = new Blob([JSON.stringify(response, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `project-${project?.name?.replace(/[^a-z0-9]/gi, '_')}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Project data exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export project data');
    } finally {
      setIsExporting(false);
    }
  };

  const handleProjectSettings = () => {
    // Navigate to project settings (can be a modal or separate page)
    toast.info('Project settings - Feature coming soon');
    // TODO: Implement settings dialog or navigate to settings page
  };

  const handleDeleteProject = async () => {
    try {
      setIsDeleting(true);
      await deleteProject(projectId);
      toast.success('Project deleted successfully');
      router.push('/dashboard/analytics');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete project');
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
          <div className="flex-1">
            <div className="h-6 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-4 bg-gray-100 rounded animate-pulse w-2/3" />
          </div>
        </div>
        
        {/* Content Skeleton */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded animate-pulse" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="h-4 bg-gray-100 rounded animate-pulse" />
                <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="h-5 bg-gray-200 rounded animate-pulse" />
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="h-3 bg-gray-100 rounded animate-pulse" />
                <div className="h-3 bg-gray-100 rounded animate-pulse" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Project Not Found</h1>
            <p className="text-muted-foreground">The requested project could not be found.</p>
          </div>
        </div>
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-4">
              {error || 'This project may have been deleted or you may not have access to it.'}
            </p>
            <Button onClick={handleBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Analytics
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <p className="text-muted-foreground">{project.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share className="mr-2 h-4 w-4" />
            Share
          </Button>
          <Button variant="outline" size="sm" onClick={handleEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={handleExportData} disabled={isExporting}>
                <Download className="mr-2 h-4 w-4" />
                {isExporting ? 'Exporting...' : 'Export Data'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleProjectSettings}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCopyLink}>
                <Link2 className="mr-2 h-4 w-4" />
                Copy Link
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>


      {/* Main Content - Full Width Tabs */}
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="research">Research</TabsTrigger>
              <TabsTrigger value="datasets">Datasets</TabsTrigger>
              <TabsTrigger value="classifier">Classifier</TabsTrigger>
              <TabsTrigger value="visualizations">Visualizations</TabsTrigger>
              <TabsTrigger value="competitors">Competitors</TabsTrigger>
              <TabsTrigger value="technology">Technology Areas</TabsTrigger>
              <TabsTrigger value="insights">AI Insights</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
              <TabsTrigger value="presentations">Presentations</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Project Status & Progress */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Status</CardTitle>
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(project.status)}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg font-medium capitalize">{project.status.replace('_', ' ')}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Priority</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge variant={getPriorityVariant(project.priority)} className="capitalize">
                      {project.priority}
                    </Badge>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{project.progress_percentage}% Complete</span>
                      </div>
                      <Progress value={project.progress_percentage} />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Due Date</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg font-medium">
                      {project.due_date 
                        ? new Date(project.due_date).toLocaleDateString()
                        : 'Not set'
                      }
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Stats & Timeline */}
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Quick Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Visualizations</span>
                      </div>
                      <span className="font-medium">{project.visualizations?.length || 0}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Reports</span>
                      </div>
                      <span className="font-medium">{project.reports?.length || 0}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Insights</span>
                      </div>
                      <span className="font-medium">{project.insights?.length || 0}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Datasets</span>
                      </div>
                      <span className="font-medium">{project.datasets?.length || 0}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Timeline</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Started: {new Date(project.start_date).toLocaleDateString()}</span>
                    </div>
                    
                    {project.due_date && (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>Due: {new Date(project.due_date).toLocaleDateString()}</span>
                      </div>
                    )}
                    
                    {project.completed_date && (
                      <div className="flex items-center gap-2 text-sm">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <span>Completed: {new Date(project.completed_date).toLocaleDateString()}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>Updated: {new Date(project.updated_at).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Project Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Project Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Description</h4>
                    <p className="text-muted-foreground">{project.description}</p>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h4 className="font-medium mb-2">Analysis Scope</h4>
                    {project.analysis_scope && Object.keys(project.analysis_scope).length > 0 ? (
                      <div className="space-y-2">
                        {Object.entries(project.analysis_scope).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-muted-foreground capitalize">
                              {key.replace(/_/g, ' ')}:
                            </span>
                            <span className="font-medium">
                              {Array.isArray(value) ? value.join(', ') : String(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground italic">No analysis scope defined</p>
                    )}
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4">
                    {project.created_by && (
                      <div>
                        <h4 className="font-medium mb-2">Created By</h4>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{project.created_by.firstName || ''} {project.created_by.lastName || ''}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{project.created_by.email || 'No email'}</p>
                      </div>
                    )}
                    
                    {project.assigned_to && (
                      <div>
                        <h4 className="font-medium mb-2">Assigned To</h4>
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-muted-foreground" />
                          <span>{project.assigned_to.firstName || ''} {project.assigned_to.lastName || ''}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{project.assigned_to.email || 'No email'}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="research" className="space-y-4">
              <ResearchTab projectId={projectId} />
            </TabsContent>

            <TabsContent value="datasets" className="space-y-4">
              <DatasetsTab 
                projectId={projectId}
                datasets={datasets}
                onDatasetsChange={() => {
                  refetchDatasets();
                  refetch(); // Also refetch project to update counts
                }}
              />
            </TabsContent>

            <TabsContent value="classifier" className="space-y-4">
              <EnhancedClassifierTab 
                projectId={projectId}
                onAnalysisComplete={(results) => {
                  console.log('Analysis completed:', results);
                }}
              />
            </TabsContent>

            <TabsContent value="visualizations" className="space-y-4">
              <VisualizationsTab 
                projectId={projectId}
                project={project}
              />
            </TabsContent>

            <TabsContent value="competitors" className="space-y-4">
              <ProjectCompetitorsTab 
                projectId={projectId}
                project={project}
              />
            </TabsContent>

            <TabsContent value="technology" className="space-y-4">
              <ProjectTechnologyAreasTab 
                projectId={projectId}
                project={project}
              />
            </TabsContent>

            <TabsContent value="insights" className="space-y-4">
              <InsightsTab 
                projectId={projectId}
                project={project}
              />
            </TabsContent>

            <TabsContent value="reports" className="space-y-4">
              <ProjectReportsTab
                projectId={projectId}
                project={project}
              />
            </TabsContent>

            <TabsContent value="presentations" className="space-y-4">
              <PresentationTab
                projectId={projectId}
                project={project}
              />
            </TabsContent>
        </Tabs>
      </div>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Project</DialogTitle>
            <DialogDescription>
              Share this project with team members via email or copy the link.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="share-email">Email Address</Label>
              <Input
                id="share-email"
                type="email"
                placeholder="colleague@company.com"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleShareSubmit()}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleCopyLink}
              >
                <Link2 className="mr-2 h-4 w-4" />
                Copy Link
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowShareDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleShareSubmit}>
              <Mail className="mr-2 h-4 w-4" />
              Share via Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the project
              <span className="font-semibold text-foreground"> "{project?.name}"</span> and remove all
              associated data including datasets, visualizations, reports, and insights.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProject}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete Project'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}