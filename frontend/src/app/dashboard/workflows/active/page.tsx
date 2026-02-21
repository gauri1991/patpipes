'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
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
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Play,
  Pause,
  Square,
  Clock,
  User,
  AlertCircle,
  CheckCircle,
  Calendar,
  MoreHorizontal,
  Eye,
  MessageSquare,
  Target,
  TrendingUp,
  AlertTriangle,
  Activity,
  RefreshCw,
  Download,
  XCircle
} from 'lucide-react';
import { useWorkflowInstances } from '@/hooks/useWorkflowData';
import { WorkflowKanban } from '@/components/workflows/WorkflowKanban';
import { toast } from 'sonner';

export default function ActiveWorkflowsDashboard() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [sortBy, setSortBy] = useState('updated_at');
  const [selectedWorkflow, setSelectedWorkflow] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState('grid');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Use the real hook - it falls back to mock data if the API fails
  const {
    workflows,
    loading,
    error,
    refresh,
    startWorkflow,
    pauseWorkflow,
    resumeWorkflow,
    cancelWorkflow,
  } = useWorkflowInstances({
    status: selectedStatus !== 'all' ? selectedStatus : undefined,
    priority: selectedPriority !== 'all' ? selectedPriority : undefined,
    search: searchTerm || undefined,
  });

  // Whether we're showing demo data (error means API failed -> mock data)
  const isUsingDemoData = !!error;

  // Client-side filtering for search when used with mock data
  const filteredWorkflows = useMemo(() => {
    let result = workflows;

    // Additional client-side search filter (for local mock data that doesn't support server-side search)
    if (searchTerm && isUsingDemoData) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (w) =>
          w.name.toLowerCase().includes(term) ||
          w.workflow_template?.name?.toLowerCase().includes(term)
      );
    }

    // Sort
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'due_date':
          return (a.due_date || '').localeCompare(b.due_date || '');
        case 'priority': {
          const priorityOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
          return (priorityOrder[a.priority] ?? 4) - (priorityOrder[b.priority] ?? 4);
        }
        case 'progress':
          return (b.progress_percentage || 0) - (a.progress_percentage || 0);
        default:
          return (b.updated_at || '').localeCompare(a.updated_at || '');
      }
    });

    return result;
  }, [workflows, searchTerm, sortBy, isUsingDemoData]);

  // Stats derived from workflow data
  const stats = useMemo(() => {
    const now = new Date();
    return {
      total_active: workflows.length,
      in_progress: workflows.filter((w) => w.status === 'in_progress').length,
      on_hold: workflows.filter((w) => w.status === 'on_hold').length,
      overdue: workflows.filter(
        (w) => w.due_date && new Date(w.due_date) < now && w.status !== 'completed'
      ).length,
      completion_rate:
        workflows.length > 0
          ? Math.round(
              (workflows.reduce((sum, w) => sum + (w.progress_percentage || 0), 0) /
                workflows.length)
            )
          : 0,
      avg_quality_score:
        workflows.filter((w) => w.quality_score).length > 0
          ? Math.round(
              workflows
                .filter((w) => w.quality_score)
                .reduce((sum, w) => sum + (w.quality_score || 0), 0) /
                workflows.filter((w) => w.quality_score).length
            )
          : 0,
    };
  }, [workflows]);

  // Selection helpers
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredWorkflows.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredWorkflows.map((w) => w.id)));
    }
  };

  const clearSelection = () => setSelectedIds(new Set());

  // Bulk action handlers
  const handleBulkAction = useCallback(
    async (action: 'start' | 'pause' | 'cancel') => {
      const ids = Array.from(selectedIds);
      if (ids.length === 0) return;

      let successCount = 0;
      let failCount = 0;

      for (const id of ids) {
        try {
          switch (action) {
            case 'start':
              await startWorkflow(id);
              break;
            case 'pause':
              await pauseWorkflow(id);
              break;
            case 'cancel':
              await cancelWorkflow(id);
              break;
          }
          successCount++;
        } catch {
          failCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} workflow(s) ${action === 'start' ? 'started' : action === 'pause' ? 'paused' : 'cancelled'}`);
      }
      if (failCount > 0) {
        toast.error(`${failCount} workflow(s) failed to ${action}`);
      }

      clearSelection();
    },
    [selectedIds, startWorkflow, pauseWorkflow, cancelWorkflow]
  );

  // Single workflow action handler
  const handleWorkflowAction = useCallback(
    async (workflowId: string, action: string) => {
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
        }
      } catch (err) {
        console.error(`Error ${action}ing workflow:`, err);
      }
    },
    [startWorkflow, pauseWorkflow, resumeWorkflow, cancelWorkflow]
  );

  // Kanban status change handler
  const handleKanbanStatusChange = useCallback(
    async (id: string, newStatus: string) => {
      const workflow = workflows.find((w) => w.id === id);
      if (!workflow) return;

      try {
        if (newStatus === 'in_progress' && workflow.status === 'pending') {
          await startWorkflow(id);
        } else if (newStatus === 'in_progress' && workflow.status === 'on_hold') {
          await resumeWorkflow(id);
        } else if (newStatus === 'on_hold') {
          await pauseWorkflow(id);
        } else if (newStatus === 'completed') {
          // Complete is not directly supported in the hook, use the closest action
          toast.info('Workflow marked for completion');
        } else {
          toast.info(`Status change to "${newStatus}" requested`);
        }
      } catch (err) {
        console.error('Failed to change workflow status:', err);
      }
    },
    [workflows, startWorkflow, resumeWorkflow, pauseWorkflow]
  );

  const handleViewWorkflow = useCallback(
    (id: string) => {
      router.push(`/dashboard/workflows/${id}`);
    },
    [router]
  );

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
      case 'cancelled': return <Square className="w-4 h-4" />;
      case 'failed': return <AlertCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg">Loading active workflows...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-3xl font-bold">Active Workflows</h1>
            <p className="text-gray-600 mt-1">
              Monitor and manage ongoing workflow executions
            </p>
          </div>
          {isUsingDemoData && (
            <Badge variant="outline" className="text-xs text-muted-foreground">
              Demo Data
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refresh()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.total_active}</p>
                <p className="text-sm text-gray-600">Total Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Play className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.in_progress}</p>
                <p className="text-sm text-gray-600">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Pause className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{stats.on_hold}</p>
                <p className="text-sm text-gray-600">On Hold</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{stats.overdue}</p>
                <p className="text-sm text-gray-600">Overdue</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{stats.completion_rate}%</p>
                <p className="text-sm text-gray-600">Avg Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-500" />
              <div>
                <p className="text-2xl font-bold">{stats.avg_quality_score || 'N/A'}</p>
                <p className="text-sm text-gray-600">Avg Quality</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search workflows..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedPriority} onValueChange={setSelectedPriority}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="updated_at">Last Updated</SelectItem>
                <SelectItem value="due_date">Due Date</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
                <SelectItem value="progress">Progress</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions Toolbar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-muted rounded-lg border">
          <span className="text-sm font-medium">
            {selectedIds.size} selected
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleBulkAction('start')}
            aria-label="Start selected workflows"
          >
            <Play className="w-3 h-3 mr-1" />
            Start Selected
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleBulkAction('pause')}
            aria-label="Pause selected workflows"
          >
            <Pause className="w-3 h-3 mr-1" />
            Pause Selected
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleBulkAction('cancel')}
            className="text-red-600 hover:text-red-700"
            aria-label="Cancel selected workflows"
          >
            <XCircle className="w-3 h-3 mr-1" />
            Cancel Selected
          </Button>
          <Button variant="ghost" size="sm" onClick={clearSelection}>
            Clear
          </Button>
        </div>
      )}

      {/* View Toggle */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="grid">Grid View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="kanban">Kanban View</TabsTrigger>
        </TabsList>

        <TabsContent value="grid">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredWorkflows.map((workflow) => (
              <Card
                key={workflow.id}
                className={`hover:shadow-lg transition-shadow ${
                  isOverdue(workflow.due_date) && workflow.status !== 'completed'
                    ? 'border-red-400'
                    : ''
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-2 flex-1">
                      <Checkbox
                        checked={selectedIds.has(workflow.id)}
                        onCheckedChange={() => toggleSelect(workflow.id)}
                        className="mt-1"
                        aria-label={`Select ${workflow.name}`}
                      />
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-1">{workflow.name}</CardTitle>
                        <p className="text-sm text-gray-600">
                          {workflow.workflow_template?.name || 'Unknown Template'}
                        </p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" aria-label="More actions">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewWorkflow(workflow.id)}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Add Comment
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {workflow.status === 'pending' && (
                          <DropdownMenuItem onClick={() => handleWorkflowAction(workflow.id, 'start')}>
                            <Play className="w-4 h-4 mr-2" />
                            Start
                          </DropdownMenuItem>
                        )}
                        {workflow.status === 'in_progress' && (
                          <DropdownMenuItem onClick={() => handleWorkflowAction(workflow.id, 'pause')}>
                            <Pause className="w-4 h-4 mr-2" />
                            Pause
                          </DropdownMenuItem>
                        )}
                        {workflow.status === 'on_hold' && (
                          <DropdownMenuItem onClick={() => handleWorkflowAction(workflow.id, 'resume')}>
                            <Play className="w-4 h-4 mr-2" />
                            Resume
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleWorkflowAction(workflow.id, 'cancel')}>
                          <Square className="w-4 h-4 mr-2" />
                          Cancel
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={getStatusColor(workflow.status)} variant="secondary">
                      {getStatusIcon(workflow.status)}
                      <span className="ml-1 capitalize">{workflow.status.replace('_', ' ')}</span>
                    </Badge>
                    <Badge className={getPriorityColor(workflow.priority)} variant="secondary">
                      {(workflow.priority || 'medium').toUpperCase()}
                    </Badge>
                    {isOverdue(workflow.due_date) && workflow.status !== 'completed' && (
                      <Badge variant="destructive">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Overdue
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Progress</span>
                      <span className="text-sm font-medium">{workflow.progress_percentage || 0}%</span>
                    </div>
                    <Progress value={workflow.progress_percentage || 0} className="h-2" />
                  </div>

                  <div className="text-sm">
                    <p>
                      <span className="font-medium">Current Step:</span>{' '}
                      {workflow.current_step_order ? `Step ${workflow.current_step_order}` : 'Not started'}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      {workflow.assigned_to ? (
                        <>
                          <Avatar className="w-5 h-5">
                            <AvatarFallback className="text-xs">
                              {workflow.assigned_to.name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <span>{workflow.assigned_to.name}</span>
                        </>
                      ) : (
                        <span className="text-muted-foreground">Unassigned</span>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <div className={`flex items-center gap-1 ${
                      isOverdue(workflow.due_date) && workflow.status !== 'completed'
                        ? 'text-red-600 font-medium'
                        : ''
                    }`}>
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>
                        {workflow.due_date ? `Due: ${formatDate(workflow.due_date)}` : 'No due date'}
                      </span>
                    </div>
                    {workflow.quality_score && (
                      <div className="flex items-center gap-1">
                        <Target className="w-4 h-4 text-gray-400" />
                        <span>Quality: {workflow.quality_score}%</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleViewWorkflow(workflow.id)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    {workflow.status === 'in_progress' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleWorkflowAction(workflow.id, 'pause')}
                        aria-label="Pause workflow"
                      >
                        <Pause className="w-4 h-4" />
                      </Button>
                    )}
                    {workflow.status === 'pending' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleWorkflowAction(workflow.id, 'start')}
                        aria-label="Start workflow"
                      >
                        <Play className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="list">
          <Card>
            <CardContent className="p-0">
              {/* Select All */}
              <div className="flex items-center gap-3 p-3 border-b bg-muted/30">
                <Checkbox
                  checked={
                    filteredWorkflows.length > 0 &&
                    selectedIds.size === filteredWorkflows.length
                  }
                  onCheckedChange={toggleSelectAll}
                  aria-label="Select all workflows"
                />
                <span className="text-sm text-muted-foreground">Select All</span>
              </div>
              <div className="divide-y">
                {filteredWorkflows.map((workflow) => (
                  <div
                    key={workflow.id}
                    className={`p-4 hover:bg-gray-50 ${
                      isOverdue(workflow.due_date) && workflow.status !== 'completed'
                        ? 'border-l-4 border-l-red-400'
                        : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <Checkbox
                          checked={selectedIds.has(workflow.id)}
                          onCheckedChange={() => toggleSelect(workflow.id)}
                          className="mt-1"
                          aria-label={`Select ${workflow.name}`}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold">{workflow.name}</h3>
                            <Badge className={getStatusColor(workflow.status)} variant="secondary">
                              {getStatusIcon(workflow.status)}
                              <span className="ml-1 capitalize">
                                {workflow.status.replace('_', ' ')}
                              </span>
                            </Badge>
                            <Badge className={getPriorityColor(workflow.priority)} variant="secondary">
                              {(workflow.priority || 'medium').toUpperCase()}
                            </Badge>
                            {isOverdue(workflow.due_date) && workflow.status !== 'completed' && (
                              <Badge variant="destructive" className="text-xs">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Overdue
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {workflow.workflow_template?.name || 'Unknown Template'}
                          </p>
                          <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center gap-2">
                              {workflow.assigned_to ? (
                                <>
                                  <Avatar className="w-6 h-6">
                                    <AvatarFallback className="text-xs">
                                      {workflow.assigned_to.name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm">{workflow.assigned_to.name}</span>
                                </>
                              ) : (
                                <span className="text-sm text-muted-foreground">Unassigned</span>
                              )}
                            </div>
                            <span className={`text-sm ${
                              isOverdue(workflow.due_date) && workflow.status !== 'completed'
                                ? 'text-red-600 font-medium'
                                : 'text-gray-500'
                            }`}>
                              {workflow.due_date ? `Due: ${formatDate(workflow.due_date)}` : 'No due date'}
                            </span>
                            {workflow.quality_score && (
                              <span className="text-sm text-gray-500">
                                Quality: {workflow.quality_score}%
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm font-medium">{workflow.progress_percentage || 0}%</div>
                          <Progress value={workflow.progress_percentage || 0} className="w-20 h-1" />
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewWorkflow(workflow.id)}
                          aria-label="View workflow details"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kanban">
          <WorkflowKanban
            workflows={filteredWorkflows as any}
            onStatusChange={handleKanbanStatusChange}
            onViewWorkflow={handleViewWorkflow}
          />
        </TabsContent>
      </Tabs>

      {/* Workflow Detail Dialog */}
      <Dialog open={!!selectedWorkflow} onOpenChange={() => setSelectedWorkflow(null)}>
        {selectedWorkflow && (
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedWorkflow.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Workflow Details</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      Template: {selectedWorkflow.workflow_template?.name || 'Unknown'}
                    </div>
                    <div className="flex items-center gap-2">
                      Status:
                      <Badge className={getStatusColor(selectedWorkflow.status)} variant="secondary">
                        {getStatusIcon(selectedWorkflow.status)}
                        <span className="ml-1 capitalize">
                          {selectedWorkflow.status.replace('_', ' ')}
                        </span>
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      Priority:
                      <Badge className={getPriorityColor(selectedWorkflow.priority)} variant="secondary">
                        {(selectedWorkflow.priority || 'medium').toUpperCase()}
                      </Badge>
                    </div>
                    <div>
                      Due Date:{' '}
                      {selectedWorkflow.due_date
                        ? formatDate(selectedWorkflow.due_date)
                        : 'Not set'}
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Progress</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Overall Progress</span>
                        <span>{selectedWorkflow.progress_percentage || 0}%</span>
                      </div>
                      <Progress value={selectedWorkflow.progress_percentage || 0} />
                    </div>
                    <div className="text-sm">
                      <div>
                        Current Step:{' '}
                        {selectedWorkflow.current_step_order
                          ? `Step ${selectedWorkflow.current_step_order}`
                          : 'Not started'}
                      </div>
                      {selectedWorkflow.quality_score && (
                        <div>Quality Score: {selectedWorkflow.quality_score}%</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Step Timeline */}
              {selectedWorkflow.step_instances?.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-4">Step Progress</h4>
                  <div className="space-y-3">
                    {selectedWorkflow.step_instances.map((step: any, index: number) => (
                      <div key={step.id || index} className="flex items-center gap-4 p-3 border rounded-lg">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-gray-300">
                          {step.status === 'completed' ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : step.status === 'in_progress' ? (
                            <Play className="w-5 h-5 text-blue-500" />
                          ) : step.status === 'failed' ? (
                            <AlertCircle className="w-5 h-5 text-red-500" />
                          ) : (
                            <Clock className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h5 className="font-medium">
                              {step.workflow_step?.name || step.step_name || `Step ${index + 1}`}
                            </h5>
                            <Badge className={getStatusColor(step.status)} variant="secondary">
                              {step.status?.replace('_', ' ') || 'Unknown'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                            {step.assigned_to && (
                              <div className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {step.assigned_to.name}
                              </div>
                            )}
                            {step.due_date && (
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Due: {formatDate(step.due_date)}
                              </div>
                            )}
                            {step.quality_score && (
                              <div className="flex items-center gap-1">
                                <Target className="w-3 h-3" />
                                Quality: {step.quality_score}%
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
