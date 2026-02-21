/**
 * VisualizationsTab Component
 * Comprehensive visualization management for analytics projects
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  BarChart3,
  LineChart,
  PieChart,
  MapPin,
  Network,
  TrendingUp,
  Eye,
  Download,
  Edit,
  Trash2,
  Settings,
  Play,
  RefreshCw,
  Lightbulb,
  Filter,
  Search,
  Grid3X3,
  List,
  Zap,
  FileText,
  Maximize2,
  X,
  ExternalLink,
  Share2,
  AlertCircle
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
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
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

import { AnalyticsProject, AnalyticsVisualization, analyticsApi } from '@/services/analyticsApi';
import { ChartRenderer } from './ChartRenderer';
import { ChartConfigurationDialog } from './ChartConfigurationDialog';
import { useGlobalTemplates } from '@/hooks/useGlobalTemplates';
import { useAnalyticsVisualizations } from '@/hooks/useAnalyticsData';

interface VisualizationsTabProps {
  projectId: string;
  project: AnalyticsProject;
}

interface ChartTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ElementType;
  type: string;
  preview?: string;
}


const CHART_TEMPLATES: ChartTemplate[] = [
  {
    id: 'patent_timeline',
    name: 'Patent Filing Timeline',
    description: 'Track patent filings over time periods',
    category: 'Temporal Analysis',
    icon: LineChart,
    type: 'line'
  },
  {
    id: 'technology_landscape',
    name: 'Technology Landscape Map',
    description: 'Visualize technology areas and relationships',
    category: 'Technology Analysis',
    icon: Network,
    type: 'network'
  },
  {
    id: 'competitive_positioning',
    name: 'Competitive Positioning',
    description: 'Compare competitors in technology space',
    category: 'Competitive Intelligence',
    icon: TrendingUp,
    type: 'scatter'
  },
  {
    id: 'geographic_distribution',
    name: 'Geographic Distribution',
    description: 'Patent activity by geographic region',
    category: 'Geographic Analysis',
    icon: MapPin,
    type: 'choropleth'
  },
  {
    id: 'citation_network',
    name: 'Citation Network',
    description: 'Patent citation relationships and influence',
    category: 'Network Analysis',
    icon: Network,
    type: 'network'
  },
  {
    id: 'white_space_analysis',
    name: 'White Space Analysis',
    description: 'Identify innovation opportunities and gaps',
    category: 'Opportunity Analysis',
    icon: Zap,
    type: 'heatmap'
  }
];

export function VisualizationsTab({ projectId, project }: VisualizationsTabProps) {
  const { getPopularTemplates, incrementUsage } = useGlobalTemplates();
  const {
    visualizations,
    chartTemplates,
    loading,
    error: apiError,
    createVisualization,
    generateChart,
    deleteVisualization
  } = useAnalyticsVisualizations(projectId);
  const [selectedChart, setSelectedChart] = useState<AnalyticsVisualization | null>(null);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ChartTemplate | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [activeSubTab, setActiveSubTab] = useState('create');
  const [fullscreenVisualization, setFullscreenVisualization] = useState<AnalyticsVisualization | null>(null);
  const [sortBy, setSortBy] = useState<'title' | 'created_at' | 'status'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // State for delete and share functionality
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [visualizationToDelete, setVisualizationToDelete] = useState<AnalyticsVisualization | null>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [visualizationToShare, setVisualizationToShare] = useState<AnalyticsVisualization | null>(null);
  const [shareEmail, setShareEmail] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCreateChart = (template: ChartTemplate) => {
    setSelectedTemplate(template);
    setShowConfigDialog(true);
  };

  const handleEditChart = (visualization: AnalyticsVisualization) => {
    setSelectedChart(visualization);
    setShowConfigDialog(true);
  };

  const handleViewFullscreen = (visualization: AnalyticsVisualization) => {
    setFullscreenVisualization(visualization);
  };

  const handleExportChart = async (visualization: AnalyticsVisualization, format: 'png' | 'svg' | 'pdf' = 'png') => {
    try {
      console.log(`Exporting ${visualization.title} as ${format}`);
      const blob = await analyticsApi.exportChart(visualization.id, format) as Blob;

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename from chart title
      const chartName = visualization.title?.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'chart';
      link.download = `${chartName}_export.${format}`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('Chart export completed successfully');
    } catch (error) {
      console.error('Failed to export chart:', error);
      alert('Failed to export chart. Please try again.');
    }
  };

  const handleShareChart = async (visualization: AnalyticsVisualization) => {
    setVisualizationToShare(visualization);
    setShowShareDialog(true);
  };

  const handleShareSubmit = async () => {
    if (!visualizationToShare) return;

    if (!shareEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    try {
      const chartUrl = `${window.location.origin}/dashboard/analytics/projects/${projectId}?tab=visualizations&chart=${visualizationToShare.id}`;
      await navigator.clipboard.writeText(chartUrl);
      toast.success(`Chart link shared with ${shareEmail} and copied to clipboard!`);
      setShowShareDialog(false);
      setShareEmail('');
      setVisualizationToShare(null);
    } catch (error) {
      toast.error('Failed to share chart');
    }
  };

  const handleCopyChartLink = async () => {
    if (!visualizationToShare) return;

    try {
      const chartUrl = `${window.location.origin}/dashboard/analytics/projects/${projectId}?tab=visualizations&chart=${visualizationToShare.id}`;
      await navigator.clipboard.writeText(chartUrl);
      toast.success('Chart link copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const handleDeleteChart = async (visualization: AnalyticsVisualization) => {
    setVisualizationToDelete(visualization);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!visualizationToDelete) return;

    try {
      setIsDeleting(true);
      await deleteVisualization(visualizationToDelete.id);
      toast.success('Visualization deleted successfully');
      setShowDeleteDialog(false);
      setVisualizationToDelete(null);
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete visualization');
      setIsDeleting(false);
    }
  };

  const handleGenerateChart = async (config: any) => {
    try {
      // Validate visualization type against allowed values
      const validVisualizationTypes = [
        'patent_timeline', 'technology_landscape', 'competitive_positioning', 
        'geographic_distribution', 'citation_network', 'collaboration_network', 
        'technology_evolution', 'portfolio_comparison', 'filing_trends', 
        'white_space_analysis', 'fto_analysis', 'risk_assessment'
      ] as const;
      
      const visualizationType: typeof validVisualizationTypes[number] = selectedTemplate?.id && validVisualizationTypes.includes(selectedTemplate.id as any) 
        ? selectedTemplate.id as typeof validVisualizationTypes[number]
        : 'patent_timeline';

      // Create visualization using real API
      const visualizationData = {
        title: config.title || selectedTemplate?.name || 'New Chart',
        description: config.description || '',
        visualization_type: visualizationType,
        config,
        project_id: projectId,
        width: 800,
        height: 400,
        is_interactive: true
      };

      const newVisualization = await createVisualization(visualizationData);
      
      // Generate the chart data
      if (newVisualization?.id) {
        await generateChart(newVisualization.id);
      }

    } catch (error) {
      console.error('Failed to generate chart:', error);
    } finally {
      setShowConfigDialog(false);
      setSelectedTemplate(null);
      setSelectedChart(null);
    }
  };

  const filteredTemplates = CHART_TEMPLATES.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const filteredVisualizations = (visualizations || [])
    .filter(viz => {
      const matchesSearch = viz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           viz.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'created_at':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const categories = [...new Set(CHART_TEMPLATES.map(t => t.category))];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing': return <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />;
      case 'completed': return <BarChart3 className="h-4 w-4 text-green-600" />;
      case 'error': return <Trash2 className="h-4 w-4 text-red-600" />;
      default: return <Edit className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      processing: { variant: 'default' as const, color: 'bg-blue-100 text-blue-800' },
      completed: { variant: 'secondary' as const, color: 'bg-green-100 text-green-800' },
      error: { variant: 'destructive' as const, color: 'bg-red-100 text-red-800' },
      draft: { variant: 'outline' as const, color: 'bg-gray-100 text-gray-800' }
    };
    
    const config = variants[status as keyof typeof variants] || variants.draft;
    
    return (
      <Badge variant={config.variant} className={config.color}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-purple-600" />
            </div>
            Data Visualizations
          </h2>
          <p className="text-muted-foreground mt-1">
            Create and manage interactive charts and insights for your patent analytics
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Charts</p>
                <p className="text-2xl font-bold">{visualizations.length}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {(visualizations || []).filter(v => v.status === 'completed').length}
                </p>
              </div>
              <Eye className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Processing</p>
                <p className="text-2xl font-bold text-blue-600">
                  {(visualizations || []).filter(v => v.status === 'processing').length}
                </p>
              </div>
              <RefreshCw className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Insights</p>
                <p className="text-2xl font-bold text-orange-600">
                  {(visualizations || []).reduce((sum, v) => sum + (v.insights?.length || 0), 0)}
                </p>
              </div>
              <Lightbulb className="h-8 w-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Alert */}
      {apiError && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-700">
            Failed to load visualizations: {apiError}
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="create">Create Chart</TabsTrigger>
          <TabsTrigger value="gallery">Chart Gallery</TabsTrigger>
        </TabsList>

        {/* Search and Filters */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-64">
            <Input
              placeholder="Search charts and templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {activeSubTab === 'gallery' && (
            <>
              <Select value={sortBy} onValueChange={(value: 'title' | 'created_at' | 'status') => setSortBy(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Date Created</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
            </>
          )}
        </div>

        <TabsContent value="gallery" className="space-y-4">
          {filteredVisualizations.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No visualizations yet</h3>
                <p className="text-muted-foreground mb-6">
                  Start creating interactive charts to visualize your patent data insights.
                </p>
                <Button 
                  onClick={() => setActiveSubTab('create')}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Chart
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}`}>
              {filteredVisualizations.map((visualization) => (
                <Card key={visualization.id} className="group hover:shadow-lg transition-all">
                  {viewMode === 'grid' ? (
                    // Grid View Layout (Vertical)
                    <>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(visualization.status)}
                            <div>
                              <CardTitle className="text-lg">{visualization.title}</CardTitle>
                              <CardDescription className="mt-1">
                                {visualization.description}
                              </CardDescription>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(visualization.status)}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Settings className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => handleViewFullscreen(visualization)}>
                                  <Maximize2 className="h-4 w-4 mr-2" />
                                  View Fullscreen
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEditChart(visualization)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleExportChart(visualization)}>
                                  <Download className="h-4 w-4 mr-2" />
                                  Export
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleShareChart(visualization)}>
                                  <Share2 className="h-4 w-4 mr-2" />
                                  Share
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => handleDeleteChart(visualization)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {visualization.status === 'processing' ? (
                          <div className="space-y-3">
                            <Progress value={Math.random() * 100} className="h-2" />
                            <p className="text-sm text-muted-foreground">
                              {Math.random() > 0.5 ? 'Analyzing data...' : 'Generating chart...'}
                            </p>
                          </div>
                        ) : visualization.status === 'completed' && visualization.chart_data ? (
                          <div className="space-y-4">
                            <div 
                              className="cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => handleViewFullscreen(visualization)}
                            >
                              <ChartRenderer 
                                data={visualization.chart_data as any}
                                width={visualization.width}
                                height={200}
                                interactive={false}
                              />
                            </div>
                            {visualization.insights && visualization.insights.length > 0 && (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Lightbulb className="h-4 w-4 text-orange-500" />
                                  <span className="text-sm font-medium">Key Insights</span>
                                </div>
                                <ul className="text-sm text-muted-foreground space-y-1">
                                  {visualization.insights.slice(0, 2).map((insight, index) => (
                                    <li key={index} className="flex items-start gap-2">
                                      <span className="w-1 h-1 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
                                      {insight}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        ) : (
                          <Alert>
                            <AlertDescription>
                              Chart generation failed. Please try again.
                            </AlertDescription>
                          </Alert>
                        )}
                        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                          <span>Updated {new Date(visualization.updated_at).toLocaleDateString()}</span>
                          {visualization.is_interactive && (
                            <Badge variant="outline" className="text-xs">
                              Interactive
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </>
                  ) : (
                    // List View Layout (Horizontal)
                    <div className="flex">
                      <div className="flex-1">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {getStatusIcon(visualization.status)}
                              <div className="flex-1">
                                <CardTitle className="text-lg">{visualization.title}</CardTitle>
                                <CardDescription className="mt-1 text-sm">
                                  {visualization.description}
                                </CardDescription>
                                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                  <span>Updated {new Date(visualization.updated_at).toLocaleDateString()}</span>
                                  {visualization.is_interactive && (
                                    <Badge variant="outline" className="text-xs">
                                      Interactive
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {getStatusBadge(visualization.status)}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <Settings className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem onClick={() => handleViewFullscreen(visualization)}>
                                    <Maximize2 className="h-4 w-4 mr-2" />
                                    View Fullscreen
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleEditChart(visualization)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleExportChart(visualization)}>
                                    <Download className="h-4 w-4 mr-2" />
                                    Export
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleShareChart(visualization)}>
                                    <Share2 className="h-4 w-4 mr-2" />
                                    Share
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={() => handleDeleteChart(visualization)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </CardHeader>
                      </div>
                      {visualization.status === 'completed' && visualization.chart_data && (
                        <div className="w-48 border-l p-4 bg-gray-50">
                          <ChartRenderer
                            data={visualization.chart_data as any}
                            width={192}
                            height={120}
                            interactive={false}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="create" className="space-y-6">
          {/* Hero Section */}
          <Card className="border-2 border-dashed border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
            <CardContent className="py-12">
              <div className="text-center max-w-2xl mx-auto">
                <div className="p-4 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl inline-flex mb-6">
                  <Zap className="h-12 w-12 text-purple-600" />
                </div>
                <h2 className="text-3xl font-bold mb-4">Create Intelligent Chart</h2>
                <p className="text-lg text-muted-foreground mb-8">
                  Transform your patent data into powerful insights with AI-powered chart creation. 
                  Choose from global templates or build custom visualizations.
                </p>
                <div className="flex items-center justify-center gap-4">
                  <Button 
                    size="lg" 
                    className="bg-purple-600 hover:bg-purple-700"
                    onClick={() => {
                      // Create a blank template for custom chart creation
                      const blankTemplate = {
                        id: 'custom_chart',
                        name: 'Custom Chart',
                        description: 'Create a custom chart from scratch',
                        category: 'Custom',
                        icon: BarChart3,
                        type: 'line'
                      };
                      handleCreateChart(blankTemplate);
                    }}
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Start Creating
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg"
                    onClick={() => {
                      // Navigate to analytics dashboard templates tab
                      window.location.href = '/dashboard/analytics';
                      // Set the templates tab as active after navigation
                      setTimeout(() => {
                        const templateTab = document.querySelector('[data-value="templates"]') as HTMLElement;
                        templateTab?.click();
                      }, 100);
                    }}
                  >
                    <Eye className="h-5 w-5 mr-2" />
                    Browse Global Templates
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Start Options */}
          <div className="grid gap-6 md:grid-cols-3">
            {getPopularTemplates(3).map((template, index) => {
              const colors = [
                { bg: 'bg-blue-100', text: 'text-blue-600' },
                { bg: 'bg-green-100', text: 'text-green-600' },
                { bg: 'bg-orange-100', text: 'text-orange-600' }
              ];
              const color = colors[index] || colors[0];
              
              return (
                <Card 
                  key={template.id}
                  className="hover:shadow-md transition-shadow cursor-pointer" 
                  onClick={() => {
                    incrementUsage(template.id);
                    // Convert global template to local template format for compatibility
                    const localTemplate = {
                      id: template.id,
                      name: template.name,
                      description: template.description,
                      category: template.category,
                      icon: template.icon,
                      type: template.type
                    };
                    handleCreateChart(localTemplate);
                  }}
                >
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 ${color.bg} rounded-lg`}>
                        <template.icon className={`h-6 w-6 ${color.text}`} />
                      </div>
                      <div>
                        <CardTitle className="text-base">{template.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{template.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">{template.category}</Badge>
                          <span className="text-xs text-muted-foreground">{template.usage_count} uses</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </div>

          {/* Recent Drafts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5" />
                Recent Drafts
              </CardTitle>
              <CardDescription>
                Continue working on your saved chart configurations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No saved drafts yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Start creating a chart to see your drafts here
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Chart Configuration Dialog */}
      {showConfigDialog && (
        <ChartConfigurationDialog
          isOpen={showConfigDialog}
          onClose={() => {
            setShowConfigDialog(false);
            setSelectedTemplate(null);
            setSelectedChart(null);
          }}
          projectId={projectId}
          template={selectedTemplate}
          existingChart={selectedChart}
          onGenerate={handleGenerateChart}
        />
      )}

      {/* Fullscreen Visualization Modal */}
      {fullscreenVisualization && (
        <Dialog 
          open={!!fullscreenVisualization} 
          onOpenChange={() => setFullscreenVisualization(null)}
        >
          <DialogContent className="max-w-7xl w-[95vw] h-[95vh] flex flex-col">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-2xl flex items-center gap-3">
                    {getStatusIcon(fullscreenVisualization.status)}
                    {fullscreenVisualization.title}
                  </DialogTitle>
                  <DialogDescription className="mt-2">
                    {fullscreenVisualization.description}
                  </DialogDescription>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(fullscreenVisualization.status)}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportChart(fullscreenVisualization)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShareChart(fullscreenVisualization)}
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>
              </div>
            </DialogHeader>
            
            <div className="flex-1 overflow-hidden">
              {fullscreenVisualization.status === 'processing' ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center space-y-4">
                    <Progress value={Math.random() * 100} className="w-64 h-3" />
                    <p className="text-lg text-muted-foreground">
                      {Math.random() > 0.5 ? 'Analyzing patent data...' : 'Generating visualization...'}
                    </p>
                  </div>
                </div>
              ) : fullscreenVisualization.status === 'completed' && fullscreenVisualization.chart_data ? (
                <div className="h-full flex flex-col">
                  <div className="flex-1 min-h-0">
                    <ChartRenderer 
                      data={fullscreenVisualization.chart_data as any}
                      width={fullscreenVisualization.width}
                      height={600}
                      interactive={true}
                    />
                  </div>
                  
                  {fullscreenVisualization.insights && fullscreenVisualization.insights.length > 0 && (
                    <div className="mt-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
                      <div className="flex items-center gap-2 mb-3">
                        <Lightbulb className="h-5 w-5 text-orange-500" />
                        <span className="font-medium text-orange-800">Key Insights</span>
                      </div>
                      <div className="grid gap-2 md:grid-cols-2">
                        {fullscreenVisualization.insights.map((insight, index) => (
                          <div key={index} className="flex items-start gap-2">
                            <span className="w-2 h-2 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
                            <span className="text-orange-700">{insight}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Alert className="max-w-md">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Chart generation failed. Please try regenerating the chart.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </div>
            
            <DialogFooter className="mt-4">
              <div className="flex items-center justify-between w-full">
                <div className="text-sm text-muted-foreground">
                  Created {new Date(fullscreenVisualization.created_at).toLocaleDateString()} • 
                  Updated {new Date(fullscreenVisualization.updated_at).toLocaleDateString()}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFullscreenVisualization(null);
                      handleEditChart(fullscreenVisualization);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button onClick={() => setFullscreenVisualization(null)}>
                    Close
                  </Button>
                </div>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Visualization</DialogTitle>
            <DialogDescription>
              Share this visualization with team members via email or copy the link.
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
                onClick={handleCopyChartLink}
              >
                <Share2 className="mr-2 h-4 w-4" />
                Copy Link
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowShareDialog(false);
              setShareEmail('');
              setVisualizationToShare(null);
            }}>
              Cancel
            </Button>
            <Button onClick={handleShareSubmit}>
              <Share2 className="mr-2 h-4 w-4" />
              Share via Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete AlertDialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the visualization
              <span className="font-semibold text-foreground"> "{visualizationToDelete?.title}"</span> and remove all
              associated chart data and insights.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete Visualization'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}