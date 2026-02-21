'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Play,
  Pause,
  Settings,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Users,
  FileText,
  Activity,
  TrendingUp,
  Workflow,
  Eye,
  Edit,
  Trash2,
  Copy
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  DialogFooter,
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
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useWorkflowTemplates, useWorkflowInstances, useWorkflowAnalytics } from '@/hooks/useWorkflowData';
import { WorkflowTemplate, WorkflowInstance } from '@/services/workflowApi';
import { toast } from 'sonner';

// Default values for Create Workflow Dialog
const defaultCreateWorkflowData = {
  workflow_template: '',
  name: '',
  description: '',
  priority: 'medium',
  due_date: '',
  assigned_to: ''
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'bg-green-500';
    case 'in_progress':
      return 'bg-blue-500';
    case 'waiting_approval':
      return 'bg-yellow-500';
    case 'failed':
      return 'bg-red-500';
    case 'on_hold':
      return 'bg-gray-500';
    default:
      return 'bg-gray-500';
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'urgent':
      return 'destructive';
    case 'high':
      return 'destructive';
    case 'medium':
      return 'default';
    case 'low':
      return 'secondary';
    default:
      return 'default';
  }
};

export default function WorkflowsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState('active');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createWorkflowData, setCreateWorkflowData] = useState(defaultCreateWorkflowData);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch data using hooks
  const { 
    templates, 
    loading: templatesLoading, 
    error: templatesError, 
    deleteTemplate, 
    duplicateTemplate 
  } = useWorkflowTemplates({
    search: searchTerm,
    is_active: true,
    category: categoryFilter || undefined
  });

  const { 
    workflows, 
    loading: workflowsLoading, 
    error: workflowsError, 
    createWorkflow,
    startWorkflow,
    pauseWorkflow,
    resumeWorkflow,
    cancelWorkflow,
    deleteWorkflow
  } = useWorkflowInstances({
    search: searchTerm,
    status: statusFilter || undefined,
    priority: priorityFilter || undefined
  });

  const {
    analytics,
    loading: analyticsLoading,
    error: analyticsError
  } = useWorkflowAnalytics();

  // Whether we're showing demo data (any hook errored -> mock fallback)
  const isUsingDemoData = !!(workflowsError || templatesError || analyticsError);

  // Action handlers
  const handleCreateWorkflow = useCallback(async () => {
    try {
      await createWorkflow(createWorkflowData);
      setShowCreateDialog(false);
      setCreateWorkflowData(defaultCreateWorkflowData);
    } catch (error) {
      console.error('Error creating workflow:', error);
    }
  }, [createWorkflow, createWorkflowData]);

  const handleWorkflowAction = useCallback(async (action: string, workflowId: string) => {
    try {
      switch (action) {
        case 'start':
          await startWorkflow(workflowId);
          break;
        case 'pause':
          await pauseWorkflow(workflowId);
          break;
        case 'resume':
          await resumeWorkflow(workflowId);
          break;
        case 'cancel':
          await cancelWorkflow(workflowId);
          break;
        case 'delete':
          if (confirm('Are you sure you want to delete this workflow?')) {
            await deleteWorkflow(workflowId);
          }
          break;
      }
    } catch (error) {
      console.error(`Error ${action}ing workflow:`, error);
    }
  }, [startWorkflow, pauseWorkflow, resumeWorkflow, cancelWorkflow, deleteWorkflow]);

  const handleTemplateAction = useCallback(async (action: string, templateId: string) => {
    try {
      switch (action) {
        case 'duplicate':
          await duplicateTemplate(templateId);
          break;
        case 'delete':
          if (confirm('Are you sure you want to delete this template?')) {
            await deleteTemplate(templateId);
          }
          break;
      }
    } catch (error) {
      console.error(`Error ${action}ing template:`, error);
    }
  }, [duplicateTemplate, deleteTemplate]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Workflows</h1>
            <p className="text-muted-foreground">
              Manage process automation and quality control
            </p>
          </div>
          {isUsingDemoData && (
            <Badge variant="outline" className="text-xs text-muted-foreground">
              Demo Data
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Workflow
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create New Workflow</DialogTitle>
                <DialogDescription>
                  Create a new workflow instance from a template.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="template" className="text-right">
                    Template
                  </Label>
                  <Select
                    value={createWorkflowData.workflow_template}
                    onValueChange={(value) => setCreateWorkflowData({ ...createWorkflowData, workflow_template: value })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select a template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template, index) => (
                        <SelectItem key={template.id || `template-${index}`} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={createWorkflowData.name}
                    onChange={(e) => setCreateWorkflowData({ ...createWorkflowData, name: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={createWorkflowData.description}
                    onChange={(e) => setCreateWorkflowData({ ...createWorkflowData, description: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="priority" className="text-right">
                    Priority
                  </Label>
                  <Select
                    value={createWorkflowData.priority}
                    onValueChange={(value) => setCreateWorkflowData({ ...createWorkflowData, priority: value })}
                  >
                    <SelectTrigger className="col-span-3">
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
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="due_date" className="text-right">
                    Due Date
                  </Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={createWorkflowData.due_date}
                    onChange={(e) => setCreateWorkflowData({ ...createWorkflowData, due_date: e.target.value })}
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button type="button" onClick={handleCreateWorkflow}>
                  Create Workflow
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Workflows
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsLoading ? '...' : analytics?.dashboard_data?.active_workflows || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Active workflow instances
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Completion Rate
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsLoading ? '...' : `${analytics?.dashboard_data?.quality_pass_rate || 0}%`}
            </div>
            <p className="text-xs text-muted-foreground">
              Quality pass rate
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg. Duration
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsLoading ? '...' : `${analytics?.dashboard_data?.avg_completion_time || 0}d`}
            </div>
            <p className="text-xs text-muted-foreground">
              Average completion time
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Completed This Month
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsLoading ? '...' : analytics?.dashboard_data?.completed_this_month || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Workflows completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Active Workflows</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="quality">Quality Control</TabsTrigger>
        </TabsList>

        {/* Search and Filter */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search workflows..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="h-4 w-4" />
            </Button>
          </div>
          
          {showFilters && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Priority</Label>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All priorities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All priorities</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Category</Label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All categories</SelectItem>
                    <SelectItem value="Patent Drafting">Patent Drafting</SelectItem>
                    <SelectItem value="Patent Prosecution">Patent Prosecution</SelectItem>
                    <SelectItem value="FTO Analysis">FTO Analysis</SelectItem>
                    <SelectItem value="Patent Analysis">Patent Analysis</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Actions</Label>
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => {
                    setStatusFilter('');
                    setPriorityFilter('');
                    setCategoryFilter('');
                    setSearchTerm('');
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Active Workflows Tab */}
        <TabsContent value="active" className="space-y-4">
          {workflowsLoading ? (
            <div className="text-center py-8">Loading workflows...</div>
          ) : workflows.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No workflows found</div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {workflows.map((workflow, index) => (
              <Card key={workflow.id || `workflow-${index}`} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-base">{workflow.name}</CardTitle>
                      <CardDescription>
                        {workflow.workflow_template?.name || 'Unknown Template'}
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => window.open(`/dashboard/workflows/${workflow.id}`, '_blank')}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => window.open(`/dashboard/workflows/${workflow.id}/edit`, '_blank')}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {workflow.status === 'in_progress' && (
                          <DropdownMenuItem onClick={() => handleWorkflowAction('pause', workflow.id)}>
                            <Pause className="mr-2 h-4 w-4" />
                            Pause
                          </DropdownMenuItem>
                        )}
                        {workflow.status === 'paused' && (
                          <DropdownMenuItem onClick={() => handleWorkflowAction('resume', workflow.id)}>
                            <Play className="mr-2 h-4 w-4" />
                            Resume
                          </DropdownMenuItem>
                        )}
                        {workflow.status === 'pending' && (
                          <DropdownMenuItem onClick={() => handleWorkflowAction('start', workflow.id)}>
                            <Play className="mr-2 h-4 w-4" />
                            Start
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem className="text-destructive" onClick={() => handleWorkflowAction('cancel', workflow.id)}>
                          <XCircle className="mr-2 h-4 w-4" />
                          Cancel
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <Badge variant={getPriorityColor(workflow.priority || 'medium')}>
                      {workflow.priority || 'medium'}
                    </Badge>
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(workflow.status || 'pending')}`} />
                    <span className="text-xs text-muted-foreground capitalize">
                      {workflow.status?.replace('_', ' ') || 'Unknown'}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progress</span>
                        <span>{workflow.progress_percentage || 0}%</span>
                      </div>
                      <Progress value={workflow.progress_percentage || 0} className="h-2" />
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Current Step</span>
                        <p className="font-medium">
                          {workflow.current_step_order ? `Step ${workflow.current_step_order}` : 'Not started'}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Assignee</span>
                        <p className="font-medium">{workflow.assigned_to?.name || 'Unassigned'}</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-xs text-muted-foreground">
                        {workflow.due_date ? `Due ${new Date(workflow.due_date).toLocaleDateString()}` : 'No due date'}
                      </span>
                      <Button size="sm" onClick={() => window.open(`/dashboard/workflows/${workflow.id}`, '_blank')}>
                        <Eye className="mr-2 h-3 w-3" />
                        View
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          {templatesLoading ? (
            <div className="text-center py-8">Loading templates...</div>
          ) : templates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No templates found</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Template</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Success Rate</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((template, index) => (
                  <TableRow key={template.id || `table-template-${index}`}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{template.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {template.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{template.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <span className="text-sm font-medium">{template.success_rate}%</span>
                        <Progress 
                          value={template.success_rate} 
                          className="w-12 h-2 ml-2" 
                        />
                      </div>
                    </TableCell>
                    <TableCell>{template.usage_count}</TableCell>
                    <TableCell>
                      <Badge variant={template.is_active ? 'default' : 'secondary'}>
                        {template.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem 
                            onSelect={(e) => {
                              e.preventDefault();
                              router.push(`/dashboard/workflows/templates/${template.id}`);
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onSelect={(e) => {
                              e.preventDefault();
                              router.push(`/dashboard/workflows/templates/${template.id}/edit`);
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleTemplateAction('duplicate', template.id)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => handleTemplateAction('delete', template.id)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          {analyticsLoading ? (
            <div className="text-center py-8">Loading analytics...</div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Workflow Performance</CardTitle>
                  <CardDescription>
                    Success rates by template over the last 30 days
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics?.dashboard_data?.template_usage?.map((template, index) => (
                      <div key={template.template_name || `analytics-template-${index}`} className="flex items-center space-x-4">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{template.template_name}</p>
                          <p className="text-sm text-muted-foreground">{template.usage_count} executions</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Progress value={template.success_rate} className="w-20" />
                          <span className="text-sm font-medium w-12 text-right">
                            {template.success_rate}%
                          </span>
                        </div>
                      </div>
                    )) || <div className="text-sm text-muted-foreground">No performance data available</div>}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>
                    Latest workflow actions and status changes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics?.dashboard_data?.recent_activities?.map((activity, index) => (
                      <div key={activity.id || `activity-${index}`} className="flex items-start space-x-4">
                        <div className="w-2 h-2 rounded-full mt-2 bg-blue-500" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">{activity.action}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {activity.workflow_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {activity.user} • {new Date(activity.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )) || <div className="text-sm text-muted-foreground">No recent activity</div>}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Quality Control Tab */}
        <TabsContent value="quality" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Quality Gates</CardTitle>
                <CardDescription>
                  Active quality control checkpoints
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">MPEP Compliance</span>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Claims Quality</span>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Prior Art Review</span>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Document Quality</span>
                    <Badge variant="default">Active</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Quality Metrics</CardTitle>
                <CardDescription>
                  Overall quality performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>Pass Rate</span>
                      <span>94%</span>
                    </div>
                    <Progress value={94} className="h-2 mt-1" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>Avg. Score</span>
                      <span>87/100</span>
                    </div>
                    <Progress value={87} className="h-2 mt-1" />
                  </div>
                  <div className="pt-2 text-xs text-muted-foreground">
                    Based on last 30 days
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Issues & Remediation</CardTitle>
                <CardDescription>
                  Active quality issues
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm">Pending Reviews</span>
                    </div>
                    <Badge variant="secondary">3</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span className="text-sm">Failed Checks</span>
                    </div>
                    <Badge variant="destructive">1</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Auto-fixed</span>
                    </div>
                    <Badge variant="default">12</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}