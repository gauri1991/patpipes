'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Plus,
  Search,
  Filter,
  Copy,
  Edit,
  Trash2,
  Play,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Star,
  Download,
  Upload,
  Settings,
  Eye,
  MoreHorizontal,
  Workflow,
  Target,
  TrendingUp
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  version: string;
  status: 'active' | 'draft' | 'deprecated';
  steps_count: number;
  avg_completion_time: number;
  success_rate: number;
  usage_count: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  tags: string[];
  require_sequential: boolean;
  auto_assign: boolean;
  min_role_level: string;
}

interface TemplateStats {
  total_templates: number;
  active_templates: number;
  draft_templates: number;
  most_used_template: string;
  avg_success_rate: number;
}

export default function TemplatesLibrary() {
  const router = useRouter();
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [stats, setStats] = useState<TemplateStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortBy, setSortBy] = useState('updated_at');
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  // Mock data - replace with actual API calls
  useEffect(() => {
    const mockTemplates: WorkflowTemplate[] = [
      {
        id: '2b8f026c-fb23-47e6-b284-81b56b21e112',
        name: 'Prior Art Search - Patentability Analysis',
        description: 'Comprehensive workflow for conducting thorough prior art searches, analyzing patentability, and generating detailed reports for patent applications. Includes AI-assisted search strategies, citation analysis, and legal opinion generation.',
        category: 'Prior Art & Patentability',
        version: '3.2.0',
        status: 'active',
        steps_count: 12,
        avg_completion_time: 7,
        success_rate: 96.5,
        usage_count: 342,
        created_by: 'Sarah Johnson',
        created_at: '2024-01-10T09:00:00Z',
        updated_at: '2024-12-15T14:30:00Z',
        tags: ['prior-art', 'patentability', 'search', 'analysis', 'AI-assisted'],
        require_sequential: false,
        auto_assign: true,
        min_role_level: 'patent_analyst'
      },
      {
        id: '1',
        name: 'Patent Drafting - Utility Patent',
        description: 'Complete workflow for drafting utility patents including prior art search, claims drafting, and filing preparation',
        category: 'Patent Drafting',
        version: '2.1.0',
        status: 'active',
        steps_count: 12,
        avg_completion_time: 15.5,
        success_rate: 94.2,
        usage_count: 156,
        created_by: 'John Smith',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-02-20T14:30:00Z',
        tags: ['patent', 'utility', 'drafting', 'USPTO'],
        require_sequential: true,
        auto_assign: true,
        min_role_level: 'analyst'
      },
      {
        id: '2',
        name: 'Trademark Application Review',
        description: 'Comprehensive review workflow for trademark applications including search, analysis, and filing',
        category: 'Trademark',
        version: '1.3.2',
        status: 'active',
        steps_count: 8,
        avg_completion_time: 7.2,
        success_rate: 97.8,
        usage_count: 89,
        created_by: 'Sarah Johnson',
        created_at: '2024-01-20T09:00:00Z',
        updated_at: '2024-02-18T11:45:00Z',
        tags: ['trademark', 'application', 'review', 'USPTO'],
        require_sequential: false,
        auto_assign: true,
        min_role_level: 'attorney'
      },
      {
        id: '3',
        name: 'IP Due Diligence Process',
        description: 'Complete IP due diligence workflow for M&A transactions and investment analysis',
        category: 'Due Diligence',
        version: '1.0.0',
        status: 'draft',
        steps_count: 15,
        avg_completion_time: 0,
        success_rate: 0,
        usage_count: 0,
        created_by: 'Mike Wilson',
        created_at: '2024-02-25T16:00:00Z',
        updated_at: '2024-02-25T16:00:00Z',
        tags: ['due-diligence', 'M&A', 'analysis'],
        require_sequential: true,
        auto_assign: false,
        min_role_level: 'senior_analyst'
      }
    ];

    const mockStats: TemplateStats = {
      total_templates: 12,
      active_templates: 9,
      draft_templates: 3,
      most_used_template: 'Patent Drafting - Utility Patent',
      avg_success_rate: 92.4
    };

    setTimeout(() => {
      setTemplates(mockTemplates);
      setStats(mockStats);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || template.status === selectedStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const sortedTemplates = [...filteredTemplates].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'usage_count':
        return b.usage_count - a.usage_count;
      case 'success_rate':
        return b.success_rate - a.success_rate;
      case 'updated_at':
      default:
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'deprecated': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'draft': return <Edit className="w-4 h-4" />;
      case 'deprecated': return <AlertCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  const handleCreateTemplate = () => {
    setShowCreateDialog(true);
  };

  const navigateToTemplate = (templateId: string) => {
    // Ensure navigation happens in same tab
    router.push(`/dashboard/workflows/templates/${templateId}`);
  };

  const handleEditTemplate = (template: WorkflowTemplate) => {
    router.push(`/dashboard/workflows/templates/${template.id}/edit`);
  };

  const handleDuplicateTemplate = (template: WorkflowTemplate) => {
    // Implementation for duplicating template
    console.log('Duplicating template:', template.id);
  };

  const handleDeleteTemplate = (template: WorkflowTemplate) => {
    // Implementation for deleting template
    console.log('Deleting template:', template.id);
  };

  const handleStartWorkflow = (template: WorkflowTemplate) => {
    // Implementation for starting workflow from template
    console.log('Starting workflow from template:', template.id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg">Loading templates...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Templates Library</h1>
          <p className="text-gray-600 mt-1">
            Browse, create, and manage workflow templates
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          <Button onClick={handleCreateTemplate}>
            <Plus className="w-4 h-4 mr-2" />
            Create Template
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Workflow className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.total_templates}</p>
                  <p className="text-sm text-gray-600">Total Templates</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.active_templates}</p>
                  <p className="text-sm text-gray-600">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.draft_templates}</p>
                  <p className="text-sm text-gray-600">Drafts</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="text-sm font-medium truncate">{stats.most_used_template}</p>
                  <p className="text-sm text-gray-600">Most Used</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.avg_success_rate}%</p>
                  <p className="text-sm text-gray-600">Avg Success Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search templates..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Patent Drafting">Patent Drafting</SelectItem>
                <SelectItem value="Trademark">Trademark</SelectItem>
                <SelectItem value="Due Diligence">Due Diligence</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="deprecated">Deprecated</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="updated_at">Last Updated</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="usage_count">Usage Count</SelectItem>
                <SelectItem value="success_rate">Success Rate</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {sortedTemplates.map((template) => (
          <Card 
            key={template.id} 
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={(e) => {
              // Only navigate if clicking on the card itself, not on buttons
              if ((e.target as HTMLElement).closest('button')) return;
              if ((e.target as HTMLElement).closest('[role="menuitem"]')) return;
              navigateToTemplate(template.id);
            }}
          >
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-1">{template.name}</CardTitle>
                  <Badge className={getStatusColor(template.status)} variant="secondary">
                    {getStatusIcon(template.status)}
                    <span className="ml-1 capitalize">{template.status}</span>
                  </Badge>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      onSelect={(e) => {
                        e.preventDefault();
                        handleStartWorkflow(template);
                      }}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Start Workflow
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onSelect={(e) => {
                        e.preventDefault();
                        navigateToTemplate(template.id);
                      }}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onSelect={(e) => {
                        e.preventDefault();
                        handleEditTemplate(template);
                      }}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Template
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onSelect={(e) => {
                        e.preventDefault();
                        handleDuplicateTemplate(template);
                      }}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onSelect={(e) => {
                        e.preventDefault();
                        handleDeleteTemplate(template);
                      }}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 line-clamp-2">
                {template.description}
              </p>
              
              <div className="flex flex-wrap gap-1">
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

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-gray-400" />
                  <span>{template.steps_count} steps</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span>{template.avg_completion_time}d avg</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span>{template.usage_count} uses</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-gray-400" />
                  <span>{template.success_rate}% success</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="default" 
                  size="sm" 
                  className="flex-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartWorkflow(template);
                  }}
                >
                  <Play className="w-4 h-4 mr-1" />
                  Start
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditTemplate(template);
                  }}
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Template Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="template-name">Template Name</Label>
                <Input id="template-name" placeholder="Enter template name" />
              </div>
              <div>
                <Label htmlFor="template-category">Category</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="patent-drafting">Patent Drafting</SelectItem>
                    <SelectItem value="trademark">Trademark</SelectItem>
                    <SelectItem value="due-diligence">Due Diligence</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="template-description">Description</Label>
              <Textarea 
                id="template-description" 
                placeholder="Describe the purpose and scope of this template"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Switch id="sequential" />
                <Label htmlFor="sequential">Require Sequential Execution</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="auto-assign" />
                <Label htmlFor="auto-assign">Auto-assign Steps</Label>
              </div>
            </div>

            <div>
              <Label>Tags (comma-separated)</Label>
              <Input placeholder="patent, utility, drafting, USPTO" />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={() => setShowCreateDialog(false)}>
                Create Template
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}