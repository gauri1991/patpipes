'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Play,
  Edit,
  Copy,
  Trash2,
  Download,
  Settings,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  GitBranch,
  Workflow,
  Target,
  Info,
  Plus,
  Zap,
  Shield,
  FileText,
  ChevronRight,
  MoreVertical,
  Star,
  History,
  Lock,
  Unlock,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { WorkflowTemplate, WorkflowStep, StepType } from '../types/workflow.types';
import { completepriorArtSearchWorkflow } from '../data/priorArtSearchTemplate';

interface WorkflowTemplateDetailProps {
  templateId: string;
}

export default function WorkflowTemplateDetail({ templateId }: WorkflowTemplateDetailProps) {
  const router = useRouter();
  const [template, setTemplate] = useState<WorkflowTemplate | null>(null);
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data - replace with actual API call
  useEffect(() => {
    // Check if this is the prior art search template
    if (templateId === 'prior-art-search-001' || templateId === '2b8f026c-fb23-47e6-b284-81b56b21e112') {
      setTimeout(() => {
        setTemplate(completepriorArtSearchWorkflow.template);
        setSteps(completepriorArtSearchWorkflow.steps);
        setLoading(false);
      }, 500);
      return;
    }

    const mockTemplate: WorkflowTemplate = {
      id: templateId,
      name: 'Patent Drafting - Utility Patent',
      description: 'Complete workflow for drafting utility patents including prior art search, claims drafting, and filing preparation. This template ensures comprehensive patent application preparation while maintaining high quality standards.',
      category: 'Patent Drafting',
      version: '2.1.0',
      isActive: true,
      requireSequential: true,
      autoAssign: true,
      estimatedDuration: 15,
      successRate: 94.2,
      usageCount: 156,
      tags: ['patent', 'utility', 'drafting', 'USPTO', 'claims'],
      color: '#3B82F6',
      icon: 'FileText',
      displayOrder: 1,
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-02-20T14:30:00Z',
      createdBy: {
        id: '1',
        firstName: 'John',
        lastName: 'Smith',
        role: 'admin'
      },
      organization: {
        id: '1',
        name: 'Patent Pro LLC'
      }
    };

    const mockSteps: WorkflowStep[] = [
      {
        id: '1',
        workflowTemplateId: templateId,
        name: 'Initial Client Consultation',
        description: 'Gather invention details and client requirements',
        stepType: StepType.MANUAL,
        order: 1,
        isRequired: true,
        isParallel: false,
        estimatedDuration: 2,
        assignedRole: 'attorney',
        approverRoles: ['senior_attorney'],
        dependsOn: [],
        configuration: {
          checklistItems: [
            'Invention disclosure form completed',
            'Prior art discussion',
            'Commercial objectives defined',
            'Budget and timeline agreed'
          ]
        },
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
        createdBy: {
          id: '1',
          firstName: 'John',
          lastName: 'Smith'
        }
      },
      {
        id: '2',
        workflowTemplateId: templateId,
        name: 'Prior Art Search',
        description: 'Conduct comprehensive prior art search across patent databases',
        stepType: StepType.AUTOMATED,
        order: 2,
        isRequired: true,
        isParallel: false,
        estimatedDuration: 1,
        assignedRole: 'analyst',
        approverRoles: ['attorney'],
        dependsOn: ['1'],
        configuration: {
          databases: ['USPTO', 'EPO', 'WIPO', 'Google Patents'],
          searchDepth: 'comprehensive',
          includeNonPatentLiterature: true
        },
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
        createdBy: {
          id: '1',
          firstName: 'John',
          lastName: 'Smith'
        }
      },
      {
        id: '3',
        workflowTemplateId: templateId,
        name: 'Patentability Analysis',
        description: 'Analyze search results and assess patentability',
        stepType: StepType.REVIEW,
        order: 3,
        isRequired: true,
        isParallel: false,
        estimatedDuration: 2,
        assignedRole: 'attorney',
        approverRoles: ['senior_attorney'],
        dependsOn: ['2'],
        configuration: {
          analysisType: 'detailed',
          includeOpinion: true,
          generateReport: true
        },
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
        createdBy: {
          id: '1',
          firstName: 'John',
          lastName: 'Smith'
        }
      },
      {
        id: '4',
        workflowTemplateId: templateId,
        name: 'Claims Drafting',
        description: 'Draft patent claims based on invention disclosure',
        stepType: StepType.DOCUMENT,
        order: 4,
        isRequired: true,
        isParallel: false,
        estimatedDuration: 3,
        assignedRole: 'attorney',
        approverRoles: ['senior_attorney'],
        dependsOn: ['3'],
        configuration: {
          claimTypes: ['independent', 'dependent', 'method', 'system'],
          minIndependentClaims: 3,
          maxTotalClaims: 20
        },
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
        createdBy: {
          id: '1',
          firstName: 'John',
          lastName: 'Smith'
        }
      },
      {
        id: '5',
        workflowTemplateId: templateId,
        name: 'Quality Review',
        description: 'Quality assurance and compliance check',
        stepType: StepType.QUALITY_GATE,
        order: 5,
        isRequired: true,
        isParallel: false,
        estimatedDuration: 1,
        assignedRole: 'senior_attorney',
        approverRoles: ['partner'],
        dependsOn: ['4'],
        configuration: {
          checklistItems: [
            'Claims properly formatted',
            'Specification complete',
            'Drawings reviewed',
            'USPTO requirements met'
          ],
          passingScore: 90
        },
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
        createdBy: {
          id: '1',
          firstName: 'John',
          lastName: 'Smith'
        }
      }
    ];

    setTimeout(() => {
      setTemplate(mockTemplate);
      setSteps(mockSteps);
      setLoading(false);
    }, 500);
  }, [templateId]);

  const getStepTypeIcon = (type: StepType) => {
    switch (type) {
      case StepType.MANUAL:
        return <Users className="w-4 h-4" />;
      case StepType.AUTOMATED:
        return <Zap className="w-4 h-4" />;
      case StepType.APPROVAL:
        return <CheckCircle className="w-4 h-4" />;
      case StepType.DOCUMENT:
        return <FileText className="w-4 h-4" />;
      case StepType.REVIEW:
        return <Target className="w-4 h-4" />;
      case StepType.QUALITY_GATE:
        return <Shield className="w-4 h-4" />;
      case StepType.NOTIFICATION:
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Workflow className="w-4 h-4" />;
    }
  };

  const getStepTypeColor = (type: StepType) => {
    switch (type) {
      case StepType.MANUAL:
        return 'bg-blue-100 text-blue-800';
      case StepType.AUTOMATED:
        return 'bg-purple-100 text-purple-800';
      case StepType.APPROVAL:
        return 'bg-green-100 text-green-800';
      case StepType.DOCUMENT:
        return 'bg-orange-100 text-orange-800';
      case StepType.REVIEW:
        return 'bg-indigo-100 text-indigo-800';
      case StepType.QUALITY_GATE:
        return 'bg-red-100 text-red-800';
      case StepType.NOTIFICATION:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleStartWorkflow = () => {
    setShowStartDialog(true);
  };

  const handleEditTemplate = () => {
    router.push(`/dashboard/workflows/templates/${templateId}/edit`);
  };

  const handleDeleteTemplate = () => {
    setShowDeleteDialog(true);
  };

  const handleDuplicateTemplate = () => {
    console.log('Duplicating template:', templateId);
  };

  const handleExportTemplate = () => {
    console.log('Exporting template:', templateId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg">Loading template details...</div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold">Template not found</h3>
        <p className="text-gray-600 mt-2">The requested workflow template could not be found.</p>
        <Button onClick={() => router.back()} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard/workflows/templates')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Templates
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportTemplate}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={handleDuplicateTemplate}>
            <Copy className="w-4 h-4 mr-2" />
            Duplicate
          </Button>
          <Button onClick={handleStartWorkflow}>
            <Play className="w-4 h-4 mr-2" />
            Start Workflow
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleEditTemplate}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Template
              </DropdownMenuItem>
              <DropdownMenuItem>
                <History className="w-4 h-4 mr-2" />
                View History
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="w-4 h-4 mr-2" />
                Configure
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDeleteTemplate} className="text-red-600">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Template
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Template Info */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <CardTitle className="text-2xl">{template.name}</CardTitle>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Active
                </Badge>
                <Badge variant="outline">v{template.version}</Badge>
              </div>
              <p className="text-gray-600 max-w-3xl">{template.description}</p>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>Created by {template.createdBy.firstName} {template.createdBy.lastName}</span>
                <span>•</span>
                <span>Last updated {new Date(template.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-sm">Est. Duration</span>
              </div>
              <p className="text-2xl font-semibold">{template.estimatedDuration}d</p>
            </div>
            <div>
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm">Success Rate</span>
              </div>
              <p className="text-2xl font-semibold">{template.successRate}%</p>
            </div>
            <div>
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <Users className="w-4 h-4" />
                <span className="text-sm">Times Used</span>
              </div>
              <p className="text-2xl font-semibold">{template.usageCount}</p>
            </div>
            <div>
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <Target className="w-4 h-4" />
                <span className="text-sm">Total Steps</span>
              </div>
              <p className="text-2xl font-semibold">{steps.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="steps">Workflow Steps</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Template Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Category</Label>
                  <p className="text-sm text-gray-600 mt-1">{template.category}</p>
                </div>
                <div>
                  <Label>Tags</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {template.tags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Organization</Label>
                  <p className="text-sm text-gray-600 mt-1">{template.organization?.name || 'Global'}</p>
                </div>
                <div>
                  <Label>Configuration</Label>
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center gap-2">
                      {template.requireSequential ? (
                        <Lock className="w-4 h-4 text-blue-500" />
                      ) : (
                        <Unlock className="w-4 h-4 text-gray-400" />
                      )}
                      <span className="text-sm">
                        {template.requireSequential ? 'Sequential execution required' : 'Parallel execution allowed'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {template.autoAssign ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-gray-400" />
                      )}
                      <span className="text-sm">
                        {template.autoAssign ? 'Auto-assignment enabled' : 'Manual assignment required'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <Play className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Workflow started</p>
                      <p className="text-xs text-gray-500">By Sarah Johnson • 2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Workflow completed</p>
                      <p className="text-xs text-gray-500">By Mike Wilson • 5 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                      <Edit className="w-4 h-4 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Template updated</p>
                      <p className="text-xs text-gray-500">By John Smith • Yesterday</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="steps" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Workflow Steps</CardTitle>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Step
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {steps.map((step, index) => (
                  <div key={step.id} className="relative">
                    {index > 0 && (
                      <div className="absolute left-6 -top-4 w-0.5 h-4 bg-gray-200" />
                    )}
                    <div className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-100">
                        <span className="text-sm font-semibold">{step.order}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">{step.name}</h4>
                              <Badge className={getStepTypeColor(step.stepType)} variant="secondary">
                                {getStepTypeIcon(step.stepType)}
                                <span className="ml-1 capitalize">{step.stepType.replace('_', ' ')}</span>
                              </Badge>
                              {step.isRequired && (
                                <Badge variant="outline" className="text-xs">
                                  Required
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{step.description}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {step.estimatedDuration}d
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {step.assignedRole}
                              </span>
                              {step.dependsOn.length > 0 && (
                                <span className="flex items-center gap-1">
                                  <GitBranch className="w-3 h-3" />
                                  Depends on: {step.dependsOn.join(', ')}
                                </span>
                              )}
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Step
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Copy className="w-4 h-4 mr-2" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Template Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="template-name">Template Name</Label>
                  <Input id="template-name" value={template.name} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="template-category">Category</Label>
                  <Select defaultValue={template.category}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Patent Drafting">Patent Drafting</SelectItem>
                      <SelectItem value="Trademark">Trademark</SelectItem>
                      <SelectItem value="Due Diligence">Due Diligence</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="template-description">Description</Label>
                <Textarea
                  id="template-description"
                  value={template.description}
                  rows={3}
                  className="mt-1"
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-medium">Execution Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="sequential">Sequential Execution</Label>
                      <p className="text-sm text-gray-600">Steps must be completed in order</p>
                    </div>
                    <Switch id="sequential" checked={template.requireSequential} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="auto-assign">Auto-assign Steps</Label>
                      <p className="text-sm text-gray-600">Automatically assign steps to team members</p>
                    </div>
                    <Switch id="auto-assign" checked={template.autoAssign} />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline">Cancel</Button>
                <Button>Save Changes</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Avg. Completion Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{template.estimatedDuration} days</div>
                <p className="text-xs text-gray-500 mt-1">-2 days vs last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{template.successRate}%</div>
                <p className="text-xs text-green-600 mt-1">+3.2% vs last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Active Instances</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12</div>
                <p className="text-xs text-gray-500 mt-1">8 on track, 4 delayed</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-gray-400">
                Chart placeholder - Performance trends over time
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Start Workflow Dialog */}
      <Dialog open={showStartDialog} onOpenChange={setShowStartDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Start New Workflow</DialogTitle>
            <DialogDescription>
              Configure and start a new workflow instance from this template
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="workflow-name">Workflow Name</Label>
              <Input
                id="workflow-name"
                placeholder="Enter workflow name"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="project">Associated Project</Label>
              <Select>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="proj-1">Patent Application #12345</SelectItem>
                  <SelectItem value="proj-2">Trademark Registration #67890</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select defaultValue="medium">
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStartDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              setShowStartDialog(false);
              router.push('/dashboard/workflows/active');
            }}>
              Start Workflow
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Template</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this template? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => {
              setShowDeleteDialog(false);
              router.push('/dashboard/workflows/templates');
            }}>
              Delete Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}