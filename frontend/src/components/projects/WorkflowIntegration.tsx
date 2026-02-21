'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Workflow,
  Play,
  Pause,
  CheckCircle,
  Clock,
  AlertTriangle,
  User,
  Calendar,
  Target,
  Plus,
  Activity,
  TrendingUp,
  BarChart3,
  Eye,
  Settings
} from 'lucide-react';

interface ProjectWorkflow {
  id: string;
  name: string;
  template_name: string;
  status: 'pending' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled' | 'failed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  progress_percentage: number;
  start_date: string | null;
  due_date: string | null;
  completed_date: string | null;
  assigned_to: {
    id: string;
    name: string;
    email: string;
  } | null;
  quality_score: number | null;
  step_progress: {
    total_steps: number;
    completed_steps: number;
    current_step: string | null;
  };
  created_at: string;
  updated_at: string;
}

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  version: string;
  estimated_duration: number | null;
  step_count: number;
  usage_count: number;
  success_rate: number;
  auto_assign: boolean;
  require_sequential: boolean;
  allow_parallel: boolean;
  quality_threshold: number;
  require_approval: boolean;
}

interface WorkflowMetrics {
  total_workflows: number;
  active_workflows: number;
  completed_workflows: number;
  average_completion_rate: number;
  overdue_workflows: number;
  quality_scores: number[];
  average_quality_score: number | null;
}

interface WorkflowIntegrationProps {
  projectId: string;
  projectName: string;
  projectType: string;
}

export default function WorkflowIntegration({ projectId, projectName, projectType }: WorkflowIntegrationProps) {
  const [workflows, setWorkflows] = useState<ProjectWorkflow[]>([]);
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [metrics, setMetrics] = useState<WorkflowMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [assignedUserId, setAssignedUserId] = useState<string>('');
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data - replace with actual API calls
  useEffect(() => {
    // Simulate API calls
    const loadData = async () => {
      try {
        // Mock workflows data
        const mockWorkflows: ProjectWorkflow[] = [
          {
            id: '1',
            name: 'Patent Drafting - Quantum Computing System',
            template_name: 'Patent Drafting - Utility Patent',
            status: 'in_progress',
            priority: 'high',
            progress_percentage: 65,
            start_date: '2024-02-01T10:00:00Z',
            due_date: '2024-03-15T00:00:00Z',
            completed_date: null,
            assigned_to: {
              id: '1',
              name: 'John Smith',
              email: 'john.smith@example.com'
            },
            quality_score: 92,
            step_progress: {
              total_steps: 8,
              completed_steps: 5,
              current_step: 'Claims Drafting'
            },
            created_at: '2024-02-01T10:00:00Z',
            updated_at: '2024-02-28T14:30:00Z'
          },
          {
            id: '2',
            name: 'Prior Art Search - Patentability Analysis',
            template_name: 'Prior Art Search - Comprehensive',
            status: 'completed',
            priority: 'medium',
            progress_percentage: 100,
            start_date: '2024-01-15T09:00:00Z',
            due_date: '2024-01-22T00:00:00Z',
            completed_date: '2024-01-21T16:00:00Z',
            assigned_to: {
              id: '2',
              name: 'Sarah Johnson',
              email: 'sarah.johnson@example.com'
            },
            quality_score: 95,
            step_progress: {
              total_steps: 5,
              completed_steps: 5,
              current_step: null
            },
            created_at: '2024-01-15T09:00:00Z',
            updated_at: '2024-01-21T16:00:00Z'
          }
        ];

        // Mock templates data
        const mockTemplates: WorkflowTemplate[] = [
          {
            id: '1',
            name: 'Patent Drafting - Utility Patent',
            description: 'Complete utility patent application drafting process',
            category: 'Drafting Services',
            version: '2.1',
            estimated_duration: 30,
            step_count: 8,
            usage_count: 145,
            success_rate: 94.2,
            auto_assign: true,
            require_sequential: true,
            allow_parallel: false,
            quality_threshold: 90,
            require_approval: true
          },
          {
            id: '2',
            name: 'Prior Art Search - Comprehensive',
            description: 'Comprehensive prior art search and analysis',
            category: 'Search Services',
            version: '1.8',
            estimated_duration: 7,
            step_count: 5,
            usage_count: 289,
            success_rate: 96.7,
            auto_assign: true,
            require_sequential: true,
            allow_parallel: true,
            quality_threshold: 85,
            require_approval: false
          },
          {
            id: '3',
            name: 'Patent Portfolio Review',
            description: 'Strategic patent portfolio analysis and recommendations',
            category: 'Analytics',
            version: '1.5',
            estimated_duration: 21,
            step_count: 12,
            usage_count: 67,
            success_rate: 91.8,
            auto_assign: false,
            require_sequential: false,
            allow_parallel: true,
            quality_threshold: 88,
            require_approval: true
          }
        ];

        // Mock metrics data
        const mockMetrics: WorkflowMetrics = {
          total_workflows: 2,
          active_workflows: 1,
          completed_workflows: 1,
          average_completion_rate: 82.5,
          overdue_workflows: 0,
          quality_scores: [92, 95],
          average_quality_score: 93.5
        };

        setTimeout(() => {
          setWorkflows(mockWorkflows);
          setTemplates(mockTemplates);
          setMetrics(mockMetrics);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error loading workflow data:', error);
        setLoading(false);
      }
    };

    loadData();
  }, [projectId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'on_hold': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'in_progress': return <Play className="w-4 h-4" />;
      case 'on_hold': return <Pause className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <AlertTriangle className="w-4 h-4" />;
      case 'failed': return <AlertTriangle className="w-4 h-4" />;
      default: return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleCreateWorkflow = async () => {
    if (!selectedTemplate) return;

    try {
      // Mock API call - replace with actual implementation
      console.log('Creating workflow:', {
        projectId,
        templateId: selectedTemplate,
        assignedUserId: assignedUserId || null
      });

      // Close dialog and refresh data
      setShowCreateDialog(false);
      setSelectedTemplate('');
      setAssignedUserId('');
      
      // Refresh workflows (in real implementation, make API call)
    } catch (error) {
      console.error('Error creating workflow:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading workflow integration...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Workflow className="w-6 h-6" />
            Workflow Integration
          </h2>
          <p className="text-gray-600 mt-1">
            Manage workflows for {projectName}
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Workflow
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Workflow</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Workflow Template</Label>
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a workflow template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        <div>
                          <div className="font-medium">{template.name}</div>
                          <div className="text-sm text-gray-500">
                            {template.category} • {template.step_count} steps • 
                            {template.estimated_duration ? ` ${template.estimated_duration} days` : ' Variable duration'}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedTemplate && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  {(() => {
                    const template = templates.find(t => t.id === selectedTemplate);
                    return template ? (
                      <div>
                        <h4 className="font-medium mb-2">{template.name}</h4>
                        <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>Steps: {template.step_count}</div>
                          <div>Success Rate: {template.success_rate}%</div>
                          <div>Duration: {template.estimated_duration || 'Variable'} days</div>
                          <div>Quality Threshold: {template.quality_threshold}%</div>
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>
              )}

              <div>
                <Label>Assign To (Optional)</Label>
                <Input
                  placeholder="User ID or leave empty for auto-assignment"
                  value={assignedUserId}
                  onChange={(e) => setAssignedUserId(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateWorkflow} disabled={!selectedTemplate}>
                  Create Workflow
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{metrics.total_workflows}</p>
                  <p className="text-sm text-gray-600">Total Workflows</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Play className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{metrics.active_workflows}</p>
                  <p className="text-sm text-gray-600">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{metrics.completed_workflows}</p>
                  <p className="text-sm text-gray-600">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">{metrics.average_completion_rate}%</p>
                  <p className="text-sm text-gray-600">Avg Progress</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-500" />
                <div>
                  <p className="text-2xl font-bold">
                    {metrics.average_quality_score ? `${metrics.average_quality_score}%` : 'N/A'}
                  </p>
                  <p className="text-sm text-gray-600">Avg Quality</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="workflows">Active Workflows</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Active Workflows Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Active Workflows</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {workflows.filter(w => w.status === 'in_progress').map((workflow) => (
                    <div key={workflow.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{workflow.name}</div>
                        <div className="text-xs text-gray-600 mt-1">
                          Current: {workflow.step_progress.current_step}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Progress value={workflow.progress_percentage} className="flex-1 h-1" />
                          <span className="text-xs text-gray-500">{workflow.progress_percentage}%</span>
                        </div>
                      </div>
                      <div className="ml-3 text-right">
                        <Badge className={getPriorityColor(workflow.priority)} variant="secondary">
                          {workflow.priority}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {workflows.filter(w => w.status === 'in_progress').length === 0 && (
                    <p className="text-gray-500 text-center py-4">No active workflows</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Completions */}
            <Card>
              <CardHeader>
                <CardTitle>Recently Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {workflows.filter(w => w.status === 'completed').map((workflow) => (
                    <div key={workflow.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{workflow.name}</div>
                        <div className="text-xs text-gray-600 mt-1">
                          Completed: {workflow.completed_date && formatDate(workflow.completed_date)}
                        </div>
                      </div>
                      <div className="ml-3 text-right">
                        <div className="flex items-center gap-1">
                          <Target className="w-3 h-3 text-gray-400" />
                          <span className="text-sm">{workflow.quality_score}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {workflows.filter(w => w.status === 'completed').length === 0 && (
                    <p className="text-gray-500 text-center py-4">No completed workflows</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="workflows">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Workflow</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workflows.map((workflow) => (
                    <TableRow key={workflow.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{workflow.name}</div>
                          <div className="text-sm text-gray-600">{workflow.template_name}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(workflow.status)} variant="secondary">
                          {getStatusIcon(workflow.status)}
                          <span className="ml-1 capitalize">{workflow.status.replace('_', ' ')}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPriorityColor(workflow.priority)} variant="secondary">
                          {workflow.priority.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Progress value={workflow.progress_percentage} className="flex-1 h-2" />
                            <span className="text-sm text-gray-600">{workflow.progress_percentage}%</span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {workflow.step_progress.completed_steps}/{workflow.step_progress.total_steps} steps
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {workflow.assigned_to ? (
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="text-sm">{workflow.assigned_to.name}</span>
                          </div>
                        ) : (
                          <span className="text-gray-500">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {workflow.due_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-sm">{formatDate(workflow.due_date)}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {templates.map((template) => (
              <Card key={template.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <p className="text-sm text-gray-600">{template.description}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Category: {template.category}</div>
                    <div>Version: {template.version}</div>
                    <div>Steps: {template.step_count}</div>
                    <div>Success: {template.success_rate}%</div>
                    {template.estimated_duration && (
                      <div className="col-span-2">Duration: {template.estimated_duration} days</div>
                    )}
                  </div>
                  
                  <div className="flex gap-1 flex-wrap">
                    {template.auto_assign && <Badge variant="secondary">Auto-assign</Badge>}
                    {template.require_sequential && <Badge variant="secondary">Sequential</Badge>}
                    {template.allow_parallel && <Badge variant="secondary">Parallel</Badge>}
                    {template.require_approval && <Badge variant="secondary">Approval</Badge>}
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={() => {
                        setSelectedTemplate(template.id);
                        setShowCreateDialog(true);
                      }}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Use Template
                    </Button>
                    <Button variant="outline" size="sm">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}