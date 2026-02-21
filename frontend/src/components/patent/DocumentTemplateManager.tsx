/**
 * Advanced Document Template System
 * Organization-specific templates with customizable sections and compliance rules
 */

'use client';

import { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Copy,
  Edit,
  Trash2,
  Download,
  Upload,
  Settings,
  Star,
  StarOff,
  Tag,
  Users,
  Globe,
  Building,
  CheckCircle,
  AlertTriangle,
  Clock,
  BookOpen,
  Zap
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface TemplateSection {
  id: string;
  name: string;
  type: 'text' | 'rich_text' | 'claims' | 'drawings';
  required: boolean;
  placeholder: string;
  defaultContent: string;
  wordCountTarget?: number;
  complianceRules: string[];
}

interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  category: 'utility' | 'design' | 'plant' | 'provisional' | 'pct';
  jurisdiction: 'USPTO' | 'EPO' | 'JPO' | 'CNIPA' | 'Multi';
  scope: 'personal' | 'organization' | 'public';
  sections: TemplateSection[];
  metadata: {
    author: string;
    created: string;
    updated: string;
    version: string;
    usageCount: number;
    rating: number;
    tags: string[];
  };
  complianceRules: {
    jurisdiction: string;
    rules: Array<{
      rule: string;
      required: boolean;
      description: string;
    }>;
  }[];
  isStarred: boolean;
  isDefault: boolean;
}

// Mock template data
const mockTemplates: DocumentTemplate[] = [
  {
    id: '1',
    name: 'AI/ML System Patent',
    description: 'Comprehensive template for artificial intelligence and machine learning system patents',
    category: 'utility',
    jurisdiction: 'USPTO',
    scope: 'organization',
    sections: [
      {
        id: 'title',
        name: 'Title',
        type: 'text',
        required: true,
        placeholder: 'Enter a descriptive title for the invention...',
        defaultContent: 'System and Method for...',
        complianceRules: ['Must be 500 characters or less', 'Should be descriptive but not limiting']
      },
      {
        id: 'field',
        name: 'Technical Field',
        type: 'rich_text',
        required: true,
        placeholder: 'Describe the technical field of the invention...',
        defaultContent: 'The present invention relates to artificial intelligence systems, and more particularly to...',
        wordCountTarget: 50,
        complianceRules: ['Should be 1-2 sentences', 'Must identify the technical field']
      },
      {
        id: 'background',
        name: 'Background',
        type: 'rich_text',
        required: true,
        placeholder: 'Describe the background and prior art...',
        defaultContent: 'Machine learning systems have become increasingly important...',
        wordCountTarget: 300,
        complianceRules: ['Should describe prior art problems', 'Must not disparage prior art']
      }
    ],
    metadata: {
      author: 'Patent Team',
      created: '2024-01-10',
      updated: '2024-01-15',
      version: '1.2',
      usageCount: 15,
      rating: 4.8,
      tags: ['AI', 'ML', 'Software', 'System']
    },
    complianceRules: [
      {
        jurisdiction: 'USPTO',
        rules: [
          { rule: 'Written description requirement', required: true, description: 'Must provide adequate written description' },
          { rule: 'Enablement requirement', required: true, description: 'Must enable person skilled in art' },
          { rule: 'Best mode requirement', required: true, description: 'Must disclose best mode if known' }
        ]
      }
    ],
    isStarred: true,
    isDefault: false
  },
  {
    id: '2',
    name: 'Hardware Device Patent',
    description: 'Template for physical devices and apparatus patents',
    category: 'utility',
    jurisdiction: 'USPTO',
    scope: 'organization',
    sections: [
      {
        id: 'title',
        name: 'Title',
        type: 'text',
        required: true,
        placeholder: 'Enter device title...',
        defaultContent: 'Improved [Device Name] with Enhanced...',
        complianceRules: ['Must be 500 characters or less']
      }
    ],
    metadata: {
      author: 'Engineering Team',
      created: '2024-01-08',
      updated: '2024-01-12',
      version: '1.0',
      usageCount: 8,
      rating: 4.5,
      tags: ['Hardware', 'Device', 'Mechanical']
    },
    complianceRules: [],
    isStarred: false,
    isDefault: false
  },
  {
    id: '3',
    name: 'EPO Software Patent',
    description: 'Template compliant with European Patent Office requirements for software patents',
    category: 'utility',
    jurisdiction: 'EPO',
    scope: 'public',
    sections: [
      {
        id: 'title',
        name: 'Title',
        type: 'text',
        required: true,
        placeholder: 'Enter title...',
        defaultContent: 'Computer-implemented method for...',
        complianceRules: ['Must indicate technical character for software patents']
      }
    ],
    metadata: {
      author: 'Community',
      created: '2024-01-05',
      updated: '2024-01-14',
      version: '2.1',
      usageCount: 23,
      rating: 4.7,
      tags: ['EPO', 'Software', 'Computer-implemented']
    },
    complianceRules: [
      {
        jurisdiction: 'EPO',
        rules: [
          { rule: 'Technical character requirement', required: true, description: 'Must solve technical problem' },
          { rule: 'Inventive step requirement', required: true, description: 'Must be non-obvious to skilled person' }
        ]
      }
    ],
    isStarred: true,
    isDefault: true
  }
];

interface DocumentTemplateManagerProps {
  onTemplateSelect: (template: DocumentTemplate) => void;
  onTemplateCreate: (template: Partial<DocumentTemplate>) => void;
}

export default function DocumentTemplateManager({
  onTemplateSelect,
  onTemplateCreate
}: DocumentTemplateManagerProps) {
  const [templates, setTemplates] = useState<DocumentTemplate[]>(mockTemplates);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<string>('all');
  const [selectedScope, setSelectedScope] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newTemplate, setNewTemplate] = useState<Partial<DocumentTemplate>>({
    name: '',
    description: '',
    category: 'utility',
    jurisdiction: 'USPTO',
    scope: 'personal',
    sections: []
  });
  const [activeTab, setActiveTab] = useState('browse');

  const getJurisdictionColor = (jurisdiction: string) => {
    const colors: Record<string, string> = {
      USPTO: 'bg-blue-100 text-blue-800',
      EPO: 'bg-purple-100 text-purple-800',
      JPO: 'bg-red-100 text-red-800',
      CNIPA: 'bg-yellow-100 text-yellow-800',
      Multi: 'bg-green-100 text-green-800'
    };
    return colors[jurisdiction] || 'bg-gray-100 text-gray-800';
  };

  const getScopeIcon = (scope: string) => {
    switch (scope) {
      case 'personal': return <Users className="h-3 w-3" />;
      case 'organization': return <Building className="h-3 w-3" />;
      case 'public': return <Globe className="h-3 w-3" />;
      default: return <Users className="h-3 w-3" />;
    }
  };

  const handleStarToggle = (templateId: string) => {
    setTemplates(prev => prev.map(template => 
      template.id === templateId 
        ? { ...template, isStarred: !template.isStarred }
        : template
    ));
  };

  const handleUseTemplate = (template: DocumentTemplate) => {
    // Update usage count
    setTemplates(prev => prev.map(t => 
      t.id === template.id 
        ? { ...t, metadata: { ...t.metadata, usageCount: t.metadata.usageCount + 1 }}
        : t
    ));
    
    onTemplateSelect(template);
  };

  const handleCreateTemplate = () => {
    if (!newTemplate.name || !newTemplate.description) return;

    const template: DocumentTemplate = {
      id: Date.now().toString(),
      name: newTemplate.name,
      description: newTemplate.description,
      category: newTemplate.category || 'utility',
      jurisdiction: newTemplate.jurisdiction || 'USPTO',
      scope: newTemplate.scope || 'personal',
      sections: newTemplate.sections || [],
      metadata: {
        author: 'Current User',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        version: '1.0',
        usageCount: 0,
        rating: 0,
        tags: []
      },
      complianceRules: [],
      isStarred: false,
      isDefault: false
    };

    setTemplates(prev => [...prev, template]);
    setNewTemplate({
      name: '',
      description: '',
      category: 'utility',
      jurisdiction: 'USPTO',
      scope: 'personal',
      sections: []
    });
    setShowCreateDialog(false);
    onTemplateCreate(template);
  };

  const filteredTemplates = templates.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesJurisdiction = selectedJurisdiction === 'all' || template.jurisdiction === selectedJurisdiction;
    const matchesScope = selectedScope === 'all' || template.scope === selectedScope;
    const matchesSearch = !searchQuery || 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.metadata.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesJurisdiction && matchesScope && matchesSearch;
  });

  const starredTemplates = templates.filter(t => t.isStarred);
  const recentTemplates = templates
    .sort((a, b) => new Date(b.metadata.updated).getTime() - new Date(a.metadata.updated).getTime())
    .slice(0, 5);

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Document Templates</h2>
            <p className="text-muted-foreground">
              Professional patent document templates with compliance validation
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>

            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Template
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Template</DialogTitle>
                  <DialogDescription>
                    Create a custom patent document template for your organization
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Template Name</Label>
                      <Input 
                        value={newTemplate.name}
                        onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., AI System Patent Template"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select 
                        value={newTemplate.category} 
                        onValueChange={(value) => setNewTemplate(prev => ({ ...prev, category: value as any }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="utility">Utility Patent</SelectItem>
                          <SelectItem value="design">Design Patent</SelectItem>
                          <SelectItem value="plant">Plant Patent</SelectItem>
                          <SelectItem value="provisional">Provisional Application</SelectItem>
                          <SelectItem value="pct">PCT Application</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Jurisdiction</Label>
                      <Select 
                        value={newTemplate.jurisdiction} 
                        onValueChange={(value) => setNewTemplate(prev => ({ ...prev, jurisdiction: value as any }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USPTO">USPTO</SelectItem>
                          <SelectItem value="EPO">EPO</SelectItem>
                          <SelectItem value="JPO">JPO</SelectItem>
                          <SelectItem value="CNIPA">CNIPA</SelectItem>
                          <SelectItem value="Multi">Multi-jurisdiction</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Scope</Label>
                      <Select 
                        value={newTemplate.scope} 
                        onValueChange={(value) => setNewTemplate(prev => ({ ...prev, scope: value as any }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="personal">Personal</SelectItem>
                          <SelectItem value="organization">Organization</SelectItem>
                          <SelectItem value="public">Public</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea 
                      value={newTemplate.description}
                      onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe what this template is used for and its key features..."
                      className="h-20"
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateTemplate}>
                      Create Template
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="browse">Browse All</TabsTrigger>
            <TabsTrigger value="starred">Starred</TabsTrigger>
            <TabsTrigger value="recent">Recent</TabsTrigger>
            <TabsTrigger value="my-templates">My Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-4">
            {/* Filters */}
            <div className="flex items-center gap-4">
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />

              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="utility">Utility</SelectItem>
                  <SelectItem value="design">Design</SelectItem>
                  <SelectItem value="plant">Plant</SelectItem>
                  <SelectItem value="provisional">Provisional</SelectItem>
                  <SelectItem value="pct">PCT</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedJurisdiction} onValueChange={setSelectedJurisdiction}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Jurisdiction" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="USPTO">USPTO</SelectItem>
                  <SelectItem value="EPO">EPO</SelectItem>
                  <SelectItem value="JPO">JPO</SelectItem>
                  <SelectItem value="CNIPA">CNIPA</SelectItem>
                  <SelectItem value="Multi">Multi</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedScope} onValueChange={setSelectedScope}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Scope" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Scopes</SelectItem>
                  <SelectItem value="personal">Personal</SelectItem>
                  <SelectItem value="organization">Organization</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Templates Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredTemplates.map((template) => (
                <Card key={template.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base truncate">{template.name}</CardTitle>
                        <CardDescription className="line-clamp-2 mt-1">
                          {template.description}
                        </CardDescription>
                      </div>
                      
                      <div className="flex items-center gap-1 ml-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleStarToggle(template.id)}
                        >
                          {template.isStarred ? (
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          ) : (
                            <StarOff className="h-4 w-4" />
                          )}
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Settings className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Template
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Copy className="mr-2 h-4 w-4" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="mr-2 h-4 w-4" />
                              Export
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {template.category}
                        </Badge>
                        <Badge className={`text-xs ${getJurisdictionColor(template.jurisdiction)}`}>
                          {template.jurisdiction}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-1 text-muted-foreground">
                        {getScopeIcon(template.scope)}
                        <span className="text-xs">{template.scope}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-3">
                        <span>Used {template.metadata.usageCount}×</span>
                        <span>★ {template.metadata.rating.toFixed(1)}</span>
                        <span>v{template.metadata.version}</span>
                      </div>
                      
                      {template.isDefault && (
                        <Badge variant="outline" className="text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Default
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {template.metadata.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {template.metadata.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{template.metadata.tags.length - 3}
                        </Badge>
                      )}
                    </div>

                    <Button 
                      className="w-full" 
                      size="sm"
                      onClick={() => handleUseTemplate(template)}
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Use Template
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredTemplates.length === 0 && (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium mb-2">No templates found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your filters or create a new template
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Template
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="starred" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {starredTemplates.map((template) => (
                <Card key={template.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    </div>
                    <CardDescription>{template.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      className="w-full" 
                      size="sm"
                      onClick={() => handleUseTemplate(template)}
                    >
                      Use Template
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="recent" className="space-y-4">
            <div className="space-y-3">
              {recentTemplates.map((template) => (
                <Card key={template.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{template.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Updated {new Date(template.metadata.updated).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    
                    <Button 
                      size="sm"
                      onClick={() => handleUseTemplate(template)}
                    >
                      Use Template
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="my-templates" className="space-y-4">
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Your Templates</h3>
              <p className="mb-4">Templates you've created will appear here</p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Template
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}