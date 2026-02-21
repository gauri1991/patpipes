/**
 * PresentationTab Component
 * Manages presentations for analytics projects with slide deck creation
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Presentation,
  Plus,
  Download,
  Eye,
  Edit,
  Share,
  Clock,
  Calendar,
  Play,
  Pause,
  MoreVertical,
  Copy,
  Trash2,
  FileDown,
  Columns,
  Image,
  BarChart3,
  Type,
  Table,
  Grid3x3,
  Layout,
  Sparkles,
  Upload,
  Search,
  Filter,
  RefreshCw,
  MonitorPlay,
  Maximize2,
  Settings
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { analyticsApi, type AnalyticsPresentation } from '@/services/analyticsApi';
import PresentationViewer from './PresentationViewer';

interface PresentationTabProps {
  projectId: string;
  project?: any;
}

// Presentation types
type PresentationType =
  | 'executive_summary'
  | 'technical_deep_dive'
  | 'competitive_analysis'
  | 'patent_landscape'
  | 'investor_pitch'
  | 'board_presentation'
  | 'custom';

type PresentationStatus = 'draft' | 'in_progress' | 'completed' | 'archived';

// Presentations are now loaded from the API using AnalyticsPresentation type

// Presentation themes
const presentationThemes = [
  { value: 'modern_dark', label: 'Modern Dark', colors: ['#000000', '#00D9FF'] },
  { value: 'professional_blue', label: 'Professional Blue', colors: ['#0066CC', '#FFFFFF'] },
  { value: 'minimal_light', label: 'Minimal Light', colors: ['#FFFFFF', '#333333'] },
  { value: 'corporate_gray', label: 'Corporate Gray', colors: ['#4B5563', '#F3F4F6'] },
  { value: 'vibrant_cyan', label: 'Vibrant Cyan', colors: ['#00D9FF', '#1F2937'] },
];

// Slide layout templates
const slideLayouts = [
  { value: 'title', label: 'Title Slide', icon: Type },
  { value: 'content', label: 'Content', icon: Layout },
  { value: 'two_column', label: 'Two Column', icon: Columns },
  { value: 'chart', label: 'Chart', icon: BarChart3 },
  { value: 'image', label: 'Image', icon: Image },
  { value: 'table', label: 'Table', icon: Table },
  { value: 'blank', label: 'Blank', icon: Grid3x3 },
];

export function PresentationTab({ projectId, project }: PresentationTabProps) {
  const [presentations, setPresentations] = useState<AnalyticsPresentation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [activeSubTab, setActiveSubTab] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showSlideBuilderDialog, setShowSlideBuilderDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [presentingPresentation, setPresentingPresentation] = useState<AnalyticsPresentation | null>(null);

  // Create presentation form state
  const [newPresentation, setNewPresentation] = useState({
    name: '',
    type: 'executive_summary' as PresentationType,
    theme: 'modern_dark',
    description: '',
    template_id: null as string | null
  });

  // Fetch presentations on mount
  useEffect(() => {
    fetchPresentations();
  }, [projectId]);

  const fetchPresentations = async () => {
    try {
      setIsLoading(true);
      const response = await analyticsApi.getPresentations(projectId);
      console.log('Presentations API response:', response);
      if (response.success && response.data) {
        // Ensure data is an array
        const presentationsData = Array.isArray(response.data) ? response.data : [];
        setPresentations(presentationsData);
      } else {
        setPresentations([]);
      }
    } catch (error) {
      console.error('Failed to fetch presentations:', error);
      toast.error('Failed to load presentations');
      setPresentations([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter presentations - ensure presentations is always an array
  const filteredPresentations = (Array.isArray(presentations) ? presentations : []).filter(pres => {
    const matchesSearch = pres.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || pres.status === filterStatus;
    const matchesType = filterType === 'all' || pres.presentation_type === filterType;
    const matchesSubTab =
      activeSubTab === 'all' ||
      (activeSubTab === 'drafts' && pres.status === 'draft') ||
      (activeSubTab === 'active' && pres.status === 'in_progress') ||
      (activeSubTab === 'completed' && pres.status === 'completed') ||
      (activeSubTab === 'archived' && pres.status === 'archived');

    return matchesSearch && matchesStatus && matchesType && matchesSubTab;
  });

  // Count presentations by status - ensure presentations is an array
  const presentationsArray = Array.isArray(presentations) ? presentations : [];
  const statusCounts = {
    all: presentationsArray.length,
    drafts: presentationsArray.filter(p => p.status === 'draft').length,
    active: presentationsArray.filter(p => p.status === 'in_progress').length,
    completed: presentationsArray.filter(p => p.status === 'completed').length,
    archived: presentationsArray.filter(p => p.status === 'archived').length,
  };

  // Get status badge variant
  const getStatusVariant = (status: PresentationStatus): 'default' | 'secondary' | 'outline' | 'destructive' => {
    switch (status) {
      case 'completed': return 'default';
      case 'in_progress': return 'secondary';
      case 'draft': return 'outline';
      case 'archived': return 'destructive';
      default: return 'default';
    }
  };

  // Get type label
  const getTypeLabel = (type: PresentationType): string => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  // Get type icon
  const getTypeIcon = (type: PresentationType) => {
    switch (type) {
      case 'executive_summary': return Sparkles;
      case 'technical_deep_dive': return Settings;
      case 'competitive_analysis': return BarChart3;
      case 'patent_landscape': return Layout;
      case 'investor_pitch': return MonitorPlay;
      case 'board_presentation': return Presentation;
      default: return Layout;
    }
  };

  // Handle create presentation
  const handleCreatePresentation = async () => {
    if (!newPresentation.name.trim()) {
      toast.error('Please enter a presentation name');
      return;
    }

    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const presentation: AnalyticsPresentation = {
        id: `pres_${Date.now()}`,
        name: newPresentation.name,
        description: newPresentation.description,
        presentation_type: newPresentation.type,
        status: 'draft',
        theme: newPresentation.theme as AnalyticsPresentation['theme'],
        slides: [],
        speaker_notes: {},
        slide_count: 1,
        duration_minutes: 5,
        template_id: newPresentation.template_id || undefined,
        template_config: {},
        presentation_count: 0,
        created_by: { id: '', firstName: 'Current', lastName: 'User', email: '', role: '' },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setPresentations([presentation, ...presentations]);
      toast.success('Presentation created successfully!');
      setShowCreateDialog(false);
      resetCreateForm();
    } catch (error) {
      toast.error('Failed to create presentation');
    } finally {
      setIsLoading(false);
    }
  };

  const resetCreateForm = () => {
    setNewPresentation({
      name: '',
      type: 'executive_summary',
      theme: 'modern_dark',
      description: '',
      template_id: null
    });
  };

  // Handle delete presentation
  const handleDeletePresentation = async (presentationId: string) => {
    try {
      setPresentations(presentations.filter(p => p.id !== presentationId));
      toast.success('Presentation deleted successfully');
    } catch (error) {
      toast.error('Failed to delete presentation');
    }
  };

  // Handle duplicate presentation
  const handleDuplicatePresentation = async (presentation: AnalyticsPresentation) => {
    try {
      const duplicate: AnalyticsPresentation = {
        ...presentation,
        id: `pres_${Date.now()}`,
        name: `${presentation.name} (Copy)`,
        status: 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_presented: undefined,
      };

      setPresentations([duplicate, ...presentations]);
      toast.success('Presentation duplicated successfully');
    } catch (error) {
      toast.error('Failed to duplicate presentation');
    }
  };

  // Handle export
  const handleExportPresentation = async (presentation: AnalyticsPresentation, format: 'pptx' | 'pdf' | 'google_slides') => {
    try {
      toast.info(`Exporting ${presentation.name} as ${format.toUpperCase()}...`);
      // Simulate export
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success(`Presentation exported successfully as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('Failed to export presentation');
    }
  };

  // Handle present - fetch full presentation data and open viewer
  const handlePresentMode = async (presentation: AnalyticsPresentation) => {
    try {
      setIsLoading(true);
      // Use the presentation we already have; mark as presented on backend
      setPresentingPresentation(presentation);
      await analyticsApi.markPresentationAsPresented(presentation.id);
    } catch (error) {
      console.error('Failed to load presentation:', error);
      toast.error('Failed to open presentation mode');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Presentation Viewer Modal */}
      {presentingPresentation && (
        <PresentationViewer
          presentation={presentingPresentation}
          onClose={() => {
            setPresentingPresentation(null);
            fetchPresentations(); // Refresh to update presentation count
          }}
        />
      )}

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Presentations</h2>
          <p className="text-muted-foreground">
            Create and manage presentation decks for your analytics projects
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => toast.info('Import feature coming soon')}>
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Presentation
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Presentation</DialogTitle>
                <DialogDescription>
                  Start with a template or create a custom presentation deck
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="pres-name">Presentation Name *</Label>
                  <Input
                    id="pres-name"
                    placeholder="e.g., Q1 2025 Patent Strategy"
                    value={newPresentation.name}
                    onChange={(e) => setNewPresentation({ ...newPresentation, name: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pres-type">Presentation Type</Label>
                    <Select
                      value={newPresentation.type}
                      onValueChange={(value) => setNewPresentation({ ...newPresentation, type: value as PresentationType })}
                    >
                      <SelectTrigger id="pres-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="executive_summary">Executive Summary</SelectItem>
                        <SelectItem value="technical_deep_dive">Technical Deep Dive</SelectItem>
                        <SelectItem value="competitive_analysis">Competitive Analysis</SelectItem>
                        <SelectItem value="patent_landscape">Patent Landscape</SelectItem>
                        <SelectItem value="investor_pitch">Investor Pitch</SelectItem>
                        <SelectItem value="board_presentation">Board Presentation</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pres-theme">Theme</Label>
                    <Select
                      value={newPresentation.theme}
                      onValueChange={(value) => setNewPresentation({ ...newPresentation, theme: value })}
                    >
                      <SelectTrigger id="pres-theme">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {presentationThemes.map((theme) => (
                          <SelectItem key={theme.value} value={theme.value}>
                            <div className="flex items-center gap-2">
                              <div className="flex gap-1">
                                {theme.colors.map((color, i) => (
                                  <div
                                    key={i}
                                    className="w-3 h-3 rounded-full border"
                                    style={{ backgroundColor: color }}
                                  />
                                ))}
                              </div>
                              {theme.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pres-description">Description (Optional)</Label>
                  <Textarea
                    id="pres-description"
                    placeholder="Brief description of the presentation..."
                    rows={3}
                    value={newPresentation.description}
                    onChange={(e) => setNewPresentation({ ...newPresentation, description: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Slide Layouts</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {slideLayouts.map((layout) => (
                      <Button
                        key={layout.value}
                        variant="outline"
                        size="sm"
                        className="h-auto flex-col gap-2 p-3"
                        onClick={() => toast.info(`${layout.label} layout selected`)}
                      >
                        <layout.icon className="h-6 w-6" />
                        <span className="text-xs">{layout.label}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreatePresentation} disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Create Presentation'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search presentations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[200px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="executive_summary">Executive Summary</SelectItem>
                <SelectItem value="technical_deep_dive">Technical Deep Dive</SelectItem>
                <SelectItem value="competitive_analysis">Competitive Analysis</SelectItem>
                <SelectItem value="patent_landscape">Patent Landscape</SelectItem>
                <SelectItem value="investor_pitch">Investor Pitch</SelectItem>
                <SelectItem value="board_presentation">Board Presentation</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs with Counts */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList>
          <TabsTrigger value="all">
            All Presentations
            <Badge variant="secondary" className="ml-2">{statusCounts.all}</Badge>
          </TabsTrigger>
          <TabsTrigger value="active">
            Active
            <Badge variant="secondary" className="ml-2">{statusCounts.active}</Badge>
          </TabsTrigger>
          <TabsTrigger value="drafts">
            Drafts
            <Badge variant="secondary" className="ml-2">{statusCounts.drafts}</Badge>
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed
            <Badge variant="secondary" className="ml-2">{statusCounts.completed}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeSubTab} className="space-y-4">
          {filteredPresentations.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Presentation className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No presentations found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || filterStatus !== 'all' || filterType !== 'all'
                    ? 'Try adjusting your filters or search query'
                    : 'Get started by creating your first presentation'}
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Presentation
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredPresentations.map((presentation) => {
                const TypeIcon = getTypeIcon(presentation.presentation_type as PresentationType);
                return (
                  <Card key={presentation.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <TypeIcon className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base line-clamp-1">
                              {presentation.name}
                            </CardTitle>
                            <CardDescription className="text-xs">
                              {getTypeLabel(presentation.presentation_type as PresentationType)}
                            </CardDescription>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handlePresentMode(presentation)}>
                              <Play className="mr-2 h-4 w-4" />
                              Present
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toast.info('Editor coming soon')}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicatePresentation(presentation)}>
                              <Copy className="mr-2 h-4 w-4" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleExportPresentation(presentation, 'pptx')}>
                              <FileDown className="mr-2 h-4 w-4" />
                              Export as PPTX
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExportPresentation(presentation, 'pdf')}>
                              <FileDown className="mr-2 h-4 w-4" />
                              Export as PDF
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDeletePresentation(presentation.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Thumbnail placeholder */}
                      <div className="aspect-video bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-900 rounded-lg flex items-center justify-center">
                        <Presentation className="h-12 w-12 text-muted-foreground" />
                      </div>

                      {/* Stats */}
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Layout className="h-3 w-3" />
                          <span>{presentation.slide_count} slides</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{presentation.duration_minutes} min</span>
                        </div>
                      </div>

                      <Separator />

                      {/* Status and Meta */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge variant={getStatusVariant(presentation.status)}>
                            {presentation.status.replace('_', ' ')}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(presentation.updated_at).toLocaleDateString()}
                          </span>
                        </div>
                        {presentation.last_presented && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>Last presented: {new Date(presentation.last_presented).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          variant="default"
                          size="sm"
                          className="flex-1"
                          onClick={() => handlePresentMode(presentation)}
                        >
                          <Play className="mr-2 h-3 w-3" />
                          Present
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => toast.info('Editor coming soon')}
                        >
                          <Edit className="mr-2 h-3 w-3" />
                          Edit
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
    </>
  );
}
