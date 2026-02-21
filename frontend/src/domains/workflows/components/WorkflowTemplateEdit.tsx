'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Save,
  X,
  Plus,
  Trash2,
  AlertCircle,
  Info,
  ChevronUp,
  ChevronDown,
  Copy,
  Settings,
  Workflow,
  Users,
  Clock,
  Zap,
  Shield,
  FileText,
  Target,
  CheckCircle,
  GitBranch,
  GripVertical,
} from 'lucide-react';
import { WorkflowTemplate, WorkflowStep, StepType } from '../types/workflow.types';

interface WorkflowTemplateEditProps {
  templateId: string;
}

interface StepForm {
  id?: string;
  name: string;
  description: string;
  stepType: StepType;
  order: number;
  isRequired: boolean;
  isParallel: boolean;
  estimatedDuration: number;
  assignedRole: string;
  approverRoles: string[];
  dependsOn: string[];
}

export default function WorkflowTemplateEdit({ templateId }: WorkflowTemplateEditProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [template, setTemplate] = useState<WorkflowTemplate | null>(null);
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [activeTab, setActiveTab] = useState('general');
  const [showAddStepDialog, setShowAddStepDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedStep, setSelectedStep] = useState<WorkflowStep | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    version: '',
    tags: [] as string[],
    requireSequential: true,
    autoAssign: true,
    estimatedDuration: 0,
    isActive: true,
  });

  const [stepForm, setStepForm] = useState<StepForm>({
    name: '',
    description: '',
    stepType: StepType.MANUAL,
    order: 1,
    isRequired: true,
    isParallel: false,
    estimatedDuration: 1,
    assignedRole: '',
    approverRoles: [],
    dependsOn: [],
  });

  // Load template data
  useEffect(() => {
    // Mock data - replace with actual API call
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
        configuration: {},
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
        configuration: {},
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
        configuration: {},
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
        createdBy: {
          id: '1',
          firstName: 'John',
          lastName: 'Smith'
        }
      },
    ];

    setTimeout(() => {
      setTemplate(mockTemplate);
      setSteps(mockSteps);
      setFormData({
        name: mockTemplate.name,
        description: mockTemplate.description,
        category: mockTemplate.category,
        version: mockTemplate.version,
        tags: mockTemplate.tags,
        requireSequential: mockTemplate.requireSequential,
        autoAssign: mockTemplate.autoAssign,
        estimatedDuration: mockTemplate.estimatedDuration || 0,
        isActive: mockTemplate.isActive,
      });
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

  const handleSave = async () => {
    setSaving(true);
    // Simulate API call
    setTimeout(() => {
      setSaving(false);
      setHasChanges(false);
      router.push(`/dashboard/workflows/templates/${templateId}`);
    }, 1000);
  };

  const handleCancel = () => {
    if (hasChanges) {
      // Show confirmation dialog
      if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
        router.push(`/dashboard/workflows/templates/${templateId}`);
      }
    } else {
      router.push(`/dashboard/workflows/templates/${templateId}`);
    }
  };

  const handleAddStep = () => {
    setStepForm({
      name: '',
      description: '',
      stepType: StepType.MANUAL,
      order: steps.length + 1,
      isRequired: true,
      isParallel: false,
      estimatedDuration: 1,
      assignedRole: '',
      approverRoles: [],
      dependsOn: [],
    });
    setShowAddStepDialog(true);
  };

  const handleEditStep = (step: WorkflowStep) => {
    setStepForm({
      id: step.id,
      name: step.name,
      description: step.description,
      stepType: step.stepType,
      order: step.order,
      isRequired: step.isRequired,
      isParallel: step.isParallel,
      estimatedDuration: step.estimatedDuration || 0,
      assignedRole: step.assignedRole || '',
      approverRoles: step.approverRoles,
      dependsOn: step.dependsOn,
    });
    setShowAddStepDialog(true);
  };

  const handleDeleteStep = (step: WorkflowStep) => {
    setSelectedStep(step);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteStep = () => {
    if (selectedStep) {
      setSteps(steps.filter(s => s.id !== selectedStep.id));
      setHasChanges(true);
    }
    setShowDeleteConfirm(false);
    setSelectedStep(null);
  };

  const handleMoveStep = (step: WorkflowStep, direction: 'up' | 'down') => {
    const currentIndex = steps.findIndex(s => s.id === step.id);
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === steps.length - 1)
    ) {
      return;
    }

    const newSteps = [...steps];
    const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    // Swap orders
    const tempOrder = newSteps[currentIndex].order;
    newSteps[currentIndex].order = newSteps[swapIndex].order;
    newSteps[swapIndex].order = tempOrder;
    
    // Swap positions in array
    [newSteps[currentIndex], newSteps[swapIndex]] = [newSteps[swapIndex], newSteps[currentIndex]];
    
    setSteps(newSteps);
    setHasChanges(true);
  };

  const saveStep = () => {
    if (stepForm.id) {
      // Edit existing step
      setSteps(steps.map(s => 
        s.id === stepForm.id 
          ? { ...s, ...stepForm }
          : s
      ));
    } else {
      // Add new step
      const newStep: WorkflowStep = {
        id: Date.now().toString(),
        workflowTemplateId: templateId,
        ...stepForm,
        configuration: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: {
          id: '1',
          firstName: 'Current',
          lastName: 'User'
        }
      };
      setSteps([...steps, newStep]);
    }
    setHasChanges(true);
    setShowAddStepDialog(false);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleTagsChange = (tagsString: string) => {
    const tags = tagsString.split(',').map(tag => tag.trim()).filter(tag => tag);
    setFormData(prev => ({ ...prev, tags }));
    setHasChanges(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg">Loading template...</div>
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
            onClick={handleCancel}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Edit Template</h1>
            <p className="text-gray-600">Modify workflow template configuration</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCancel}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !hasChanges}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {hasChanges && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You have unsaved changes. Remember to save before leaving this page.
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general">General Information</TabsTrigger>
          <TabsTrigger value="steps">Workflow Steps</TabsTrigger>
          <TabsTrigger value="advanced">Advanced Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="name">Template Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter template name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select 
                    value={formData.category}
                    onValueChange={(value) => handleInputChange('category', value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Patent Drafting">Patent Drafting</SelectItem>
                      <SelectItem value="Trademark">Trademark</SelectItem>
                      <SelectItem value="Due Diligence">Due Diligence</SelectItem>
                      <SelectItem value="IP Portfolio">IP Portfolio</SelectItem>
                      <SelectItem value="Litigation">Litigation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe the purpose and scope of this template"
                  rows={4}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="version">Version</Label>
                  <Input
                    id="version"
                    value={formData.version}
                    onChange={(e) => handleInputChange('version', e.target.value)}
                    placeholder="e.g., 1.0.0"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="estimatedDuration">Estimated Duration (days)</Label>
                  <Input
                    id="estimatedDuration"
                    type="number"
                    value={formData.estimatedDuration}
                    onChange={(e) => handleInputChange('estimatedDuration', parseInt(e.target.value) || 0)}
                    placeholder="Enter duration in days"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={formData.tags.join(', ')}
                  onChange={(e) => handleTagsChange(e.target.value)}
                  placeholder="patent, utility, drafting, USPTO"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">Add tags to help users find this template</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="steps" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Workflow Steps</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    Define the steps that make up this workflow template
                  </p>
                </div>
                <Button onClick={handleAddStep}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Step
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {steps.length === 0 ? (
                <div className="text-center py-12">
                  <Workflow className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">No steps defined yet</p>
                  <p className="text-sm text-gray-500 mt-2">Add steps to build your workflow</p>
                  <Button onClick={handleAddStep} className="mt-4">
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Step
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {steps.sort((a, b) => a.order - b.order).map((step, index) => (
                    <div key={step.id} className="relative">
                      {index > 0 && (
                        <div className="absolute left-6 -top-4 w-0.5 h-4 bg-gray-200" />
                      )}
                      <div className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50 group">
                        <div className="flex items-center gap-2">
                          <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                          <div className="flex flex-col gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMoveStep(step, 'up')}
                              disabled={index === 0}
                              className="h-6 w-6 p-0"
                            >
                              <ChevronUp className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMoveStep(step, 'down')}
                              disabled={index === steps.length - 1}
                              className="h-6 w-6 p-0"
                            >
                              <ChevronDown className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100">
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
                                    Depends on: Step {step.dependsOn.join(', ')}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditStep(step)}
                              >
                                <Settings className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteStep(step)}
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Execution Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="sequential">Sequential Execution</Label>
                    <p className="text-sm text-gray-600">
                      Steps must be completed in order
                    </p>
                  </div>
                  <Switch
                    id="sequential"
                    checked={formData.requireSequential}
                    onCheckedChange={(checked) => handleInputChange('requireSequential', checked)}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="autoAssign">Auto-assign Steps</Label>
                    <p className="text-sm text-gray-600">
                      Automatically assign steps to team members based on role
                    </p>
                  </div>
                  <Switch
                    id="autoAssign"
                    checked={formData.autoAssign}
                    onCheckedChange={(checked) => handleInputChange('autoAssign', checked)}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="isActive">Template Active</Label>
                    <p className="text-sm text-gray-600">
                      Active templates can be used to create new workflows
                    </p>
                  </div>
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Permissions & Access</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Permission settings will be available in a future update
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Step Dialog */}
      <Dialog open={showAddStepDialog} onOpenChange={setShowAddStepDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {stepForm.id ? 'Edit Step' : 'Add New Step'}
            </DialogTitle>
            <DialogDescription>
              Configure the workflow step details
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="step-name">Step Name *</Label>
                <Input
                  id="step-name"
                  value={stepForm.name}
                  onChange={(e) => setStepForm({ ...stepForm, name: e.target.value })}
                  placeholder="Enter step name"
                />
              </div>
              <div>
                <Label htmlFor="step-type">Step Type *</Label>
                <Select
                  value={stepForm.stepType}
                  onValueChange={(value) => setStepForm({ ...stepForm, stepType: value as StepType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={StepType.MANUAL}>Manual</SelectItem>
                    <SelectItem value={StepType.AUTOMATED}>Automated</SelectItem>
                    <SelectItem value={StepType.APPROVAL}>Approval</SelectItem>
                    <SelectItem value={StepType.DOCUMENT}>Document</SelectItem>
                    <SelectItem value={StepType.REVIEW}>Review</SelectItem>
                    <SelectItem value={StepType.QUALITY_GATE}>Quality Gate</SelectItem>
                    <SelectItem value={StepType.NOTIFICATION}>Notification</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="step-description">Description</Label>
              <Textarea
                id="step-description"
                value={stepForm.description}
                onChange={(e) => setStepForm({ ...stepForm, description: e.target.value })}
                placeholder="Describe what this step involves"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="step-duration">Estimated Duration (days)</Label>
                <Input
                  id="step-duration"
                  type="number"
                  value={stepForm.estimatedDuration}
                  onChange={(e) => setStepForm({ ...stepForm, estimatedDuration: parseInt(e.target.value) || 0 })}
                  placeholder="1"
                />
              </div>
              <div>
                <Label htmlFor="step-role">Assigned Role</Label>
                <Select
                  value={stepForm.assignedRole}
                  onValueChange={(value) => setStepForm({ ...stepForm, assignedRole: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="attorney">Attorney</SelectItem>
                    <SelectItem value="senior_attorney">Senior Attorney</SelectItem>
                    <SelectItem value="analyst">Analyst</SelectItem>
                    <SelectItem value="paralegal">Paralegal</SelectItem>
                    <SelectItem value="partner">Partner</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="step-required"
                    checked={stepForm.isRequired}
                    onCheckedChange={(checked) => setStepForm({ ...stepForm, isRequired: checked })}
                  />
                  <Label htmlFor="step-required">Required Step</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="step-parallel"
                    checked={stepForm.isParallel}
                    onCheckedChange={(checked) => setStepForm({ ...stepForm, isParallel: checked })}
                  />
                  <Label htmlFor="step-parallel">Can Run in Parallel</Label>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddStepDialog(false)}>
              Cancel
            </Button>
            <Button onClick={saveStep}>
              {stepForm.id ? 'Update Step' : 'Add Step'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Step</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedStep?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteStep}>
              Delete Step
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}