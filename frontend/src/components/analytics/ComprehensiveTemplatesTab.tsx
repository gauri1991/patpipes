/**
 * ComprehensiveTemplatesTab Component
 * Organization-wide template management for all template types
 */

'use client';

import { useState, useEffect } from 'react';
import { useTemplates } from '@/hooks/useTemplates';
import {
  Template,
  TemplateType,
  TemplateScope,
  ChartTemplate,
  ReportTemplate,
  TemplateFilter
} from '@/types/template.types';

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
  Search,
  Filter,
  Grid3X3,
  List,
  Zap,
  Target,
  Globe,
  Lightbulb,
  Brain,
  Users,
  Building2,
  User,
  FileText,
  Layout,
  Activity,
  BookOpen,
  FileSpreadsheet,
  Copy,
  MoreVertical,
  CheckCircle2,
  Clock,
  Calendar,
  Shield,
  ChevronRight,
  GitBranch
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
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { TemplateCreator } from './TemplateCreator';
import { toast } from 'sonner';

export function ComprehensiveTemplatesTab() {
  const [activeTab, setActiveTab] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [scopeFilter, setScopeFilter] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedTemplateType, setSelectedTemplateType] = useState<TemplateType | null>(null);

  // Use templates hook for all template types
  const {
    templates: allTemplates,
    loading,
    getTemplatesByType,
    getCategories,
    incrementUsage,
    deleteTemplate,
    getTemplateCountByType,
    updateFilter,
    filter,
    createTemplate
  } = useTemplates();

  // Get template counts by type
  const [templateCounts, setTemplateCounts] = useState<Record<TemplateType, number>>({
    [TemplateType.CHART]: 0,
    [TemplateType.REPORT]: 0,
    [TemplateType.DOCUMENT]: 0,
    [TemplateType.DASHBOARD]: 0,
    [TemplateType.WORKFLOW]: 0
  });

  useEffect(() => {
    getTemplateCountByType().then(setTemplateCounts);
  }, [allTemplates]);

  // Filter templates based on active tab and filters
  const getFilteredTemplates = () => {
    let filtered = [...allTemplates];

    // Filter by type based on active tab
    if (activeTab !== 'all') {
      const typeMap: Record<string, TemplateType> = {
        'charts': TemplateType.CHART,
        'reports': TemplateType.REPORT,
        'documents': TemplateType.DOCUMENT
      };

      const targetType = typeMap[activeTab];
      if (targetType) {
        filtered = filtered.filter((t: Template) => t.template_type === targetType);
      }
    }

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(t => 
        t.name.toLowerCase().includes(searchLower) ||
        t.description.toLowerCase().includes(searchLower) ||
        t.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(t => t.category === categoryFilter);
    }

    // Apply scope filter
    if (scopeFilter !== 'all') {
      filtered = filtered.filter(t => t.scope === scopeFilter);
    }

    return filtered;
  };

  const filteredTemplates = getFilteredTemplates();

  // Get icon for template type
  const getTemplateTypeIcon = (template_type: TemplateType) => {
    switch (template_type) {
      case TemplateType.CHART:
        return BarChart3;
      case TemplateType.REPORT:
        return FileText;
      case TemplateType.DOCUMENT:
        return FileSpreadsheet;
      default:
        return Brain;
    }
  };

  // Map icon names to React components
  const getIconComponent = (iconName: string) => {
    const iconMap: Record<string, any> = {
      'LineChart': LineChart,
      'BarChart3': BarChart3,
      'PieChart': PieChart,
      'Network': Network,
      'Target': Target,
      'Layout': Layout,
      'GitBranch': GitBranch,
      'Brain': Brain,
      'FileText': FileText,
      'Activity': Activity,
      'TrendingUp': TrendingUp,
      'Zap': Zap,
      'Globe': Globe,
      'Lightbulb': Lightbulb,
      'Shield': Shield,
      'Users': Users,
      'Building2': Building2,
      'User': User,
      'Search': Search,
      'BookOpen': BookOpen,
      'FileSpreadsheet': FileSpreadsheet
    };
    
    return iconMap[iconName] || Brain; // Default to Brain icon if not found
  };

  // Get type label
  const getTypeLabel = (template_type: TemplateType) => {
    switch (template_type) {
      case TemplateType.CHART:
        return 'Chart';
      case TemplateType.REPORT:
        return 'Report';
      case TemplateType.DOCUMENT:
        return 'Document';
      default:
        return 'Template';
    }
  };

  // Get type color
  const getTypeColor = (template_type: TemplateType) => {
    switch (template_type) {
      case TemplateType.CHART:
        return 'bg-blue-100 text-blue-600';
      case TemplateType.REPORT:
        return 'bg-green-100 text-green-600';
      case TemplateType.DOCUMENT:
        return 'bg-orange-100 text-orange-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  // Get scope icon
  const getScopeIcon = (scope: string) => {
    switch (scope) {
      case 'organization': return <Building2 className="h-3 w-3" />;
      case 'team': return <Users className="h-3 w-3" />;
      case 'personal': return <User className="h-3 w-3" />;
      default: return <Building2 className="h-3 w-3" />;
    }
  };

  // Get scope badge
  const getScopeBadge = (scope: string) => {
    const config = {
      organization: { variant: 'default' as const, label: 'Organization' },
      team: { variant: 'secondary' as const, label: 'Team' },
      personal: { variant: 'outline' as const, label: 'Personal' }
    };
    
    const { variant, label } = config[scope as keyof typeof config] || config.organization;
    
    return (
      <Badge variant={variant} className="text-xs">
        {getScopeIcon(scope)}
        <span className="ml-1">{label}</span>
      </Badge>
    );
  };

  // Handle template use
  const handleUseTemplate = async (template: Template) => {
    await incrementUsage(template.id);
    
    // Navigate back to project or open appropriate dialog
    if (template.template_type === TemplateType.CHART) {
      window.history.back();
    } else if (template.template_type === TemplateType.REPORT) {
      // Could open report creation dialog
      window.history.back();
    } else if (template.template_type === TemplateType.DOCUMENT) {
      toast.info(`Using ${getTypeLabel(template.template_type)} template: ${template.name}`);
    } else {
      toast.info(`Using ${getTypeLabel(template.template_type)} template: ${template.name}`);
    }
  };

  // Handle create template
  const handleCreateTemplate = (type: TemplateType) => {
    setSelectedTemplateType(type);
    setShowCreateDialog(true);
  };

  // Handle template creation from creator
  const handleTemplateCreation = async (templateData: any) => {
    await createTemplate(templateData);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg">
              <Brain className="h-6 w-6 text-blue-600" />
            </div>
            Template Library
          </h2>
          <p className="text-muted-foreground mt-1">
            Analytics templates for charts, reports, and documents
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
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Choose Template Type</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleCreateTemplate(TemplateType.CHART)}>
                <BarChart3 className="h-4 w-4 mr-2" />
                Chart Template
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCreateTemplate(TemplateType.REPORT)}>
                <FileText className="h-4 w-4 mr-2" />
                Report Template
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCreateTemplate(TemplateType.DOCUMENT)}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Document Template
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveTab('charts')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Chart Templates</p>
                <p className="text-2xl font-bold text-blue-600">{templateCounts[TemplateType.CHART]}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveTab('reports')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Report Templates</p>
                <p className="text-2xl font-bold text-green-600">{templateCounts[TemplateType.REPORT]}</p>
              </div>
              <FileText className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveTab('documents')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Documents</p>
                <p className="text-2xl font-bold text-orange-600">{templateCounts[TemplateType.DOCUMENT]}</p>
              </div>
              <FileSpreadsheet className="h-8 w-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Usage</p>
                <p className="text-2xl font-bold text-gray-600">
                  {allTemplates.reduce((sum, t) => sum + t.usage_count, 0)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="all">All Templates</TabsTrigger>
            <TabsTrigger value="charts">Charts</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          {/* Filters */}
          <div className="flex items-center gap-4">
            <Input
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {/* Categories will be dynamic based on templates */}
                <SelectItem value="Strategic Analysis">Strategic Analysis</SelectItem>
                <SelectItem value="Competitive Analysis">Competitive Analysis</SelectItem>
                <SelectItem value="Technology Analysis">Technology Analysis</SelectItem>
                <SelectItem value="Portfolio Analysis">Portfolio Analysis</SelectItem>
              </SelectContent>
            </Select>
            <Select value={scopeFilter} onValueChange={setScopeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Scope" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Scopes</SelectItem>
                <SelectItem value="organization">Organization</SelectItem>
                <SelectItem value="team">Team</SelectItem>
                <SelectItem value="personal">Personal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Template Grid/List */}
        <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}`}>
          {loading ? (
            <div className="col-span-full text-center py-12">
              <Brain className="h-12 w-12 animate-pulse text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Loading templates...</p>
            </div>
          ) : filteredTemplates.length > 0 ? (
            filteredTemplates.map((template) => {
              const TypeIcon = getTemplateTypeIcon(template.template_type);
              const TemplateIcon = getIconComponent(template.icon);
              
              return (
                <Card key={template.id} className="group hover:shadow-lg transition-all">
                  {viewMode === 'grid' ? (
                    // Grid View
                    <>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${getTypeColor(template.template_type)}`}>
                              <TemplateIcon className="h-6 w-6" />
                            </div>
                            <div className="flex-1">
                              <CardTitle className="text-lg">{template.name}</CardTitle>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary" className="text-xs">
                                  {getTypeLabel(template.template_type)}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {template.category}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" />
                                Preview
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Copy className="h-4 w-4 mr-2" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Download className="h-4 w-4 mr-2" />
                                Export
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => deleteTemplate(template.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                          {template.description}
                        </p>
                        
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Usage:</span>
                            <span className="font-medium">{template.usage_count} times</span>
                          </div>
                          
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Created by:</span>
                            <span className="font-medium">{template.created_by.name}</span>
                          </div>
                          
                          <div className="flex flex-wrap gap-1 mt-2">
                            {template.tags.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {template.tags.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{template.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                          
                          <Separator />
                          
                          <div className="flex items-center justify-between">
                            {getScopeBadge(template.scope)}
                            <Button 
                              size="sm" 
                              className="bg-blue-600 hover:bg-blue-700"
                              onClick={() => handleUseTemplate(template)}
                            >
                              Use Template
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </>
                  ) : (
                    // List View
                    <div className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-4 flex-1">
                        <div className={`p-2 rounded-lg ${getTypeColor(template.template_type)}`}>
                          <TemplateIcon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{template.name}</h3>
                            <Badge variant="secondary" className="text-xs">
                              {getTypeLabel(template.template_type)}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {template.category}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>{template.usage_count} uses</span>
                            <span>by {template.created_by.name}</span>
                            <span>Updated {new Date(template.updated_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getScopeBadge(template.scope)}
                        <Button 
                          size="sm" 
                          className="bg-blue-600 hover:bg-blue-700"
                          onClick={() => handleUseTemplate(template)}
                        >
                          Use Template
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              Preview
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="h-4 w-4 mr-2" />
                              Export
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => deleteTemplate(template.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })
          ) : (
            <div className="col-span-full text-center py-12">
              <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Templates Found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || categoryFilter !== 'all' || scopeFilter !== 'all' 
                  ? 'No templates match your current filters'
                  : `No ${activeTab === 'all' ? '' : activeTab} templates available yet`
                }
              </p>
              {(searchTerm || categoryFilter !== 'all' || scopeFilter !== 'all') && (
                <Button 
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setCategoryFilter('all');
                    setScopeFilter('all');
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          )}
        </div>
      </Tabs>

      {/* Template Creator */}
      <TemplateCreator
        open={showCreateDialog}
        onOpenChange={(open) => {
          setShowCreateDialog(open);
          if (!open) {
            setSelectedTemplateType(null);
          }
        }}
        templateType={selectedTemplateType}
        onCreateTemplate={handleTemplateCreation}
      />
    </div>
  );
}