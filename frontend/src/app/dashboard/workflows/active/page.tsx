'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Filter,
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
  Users,
  Target,
  TrendingUp,
  AlertTriangle,
  Activity,
  RefreshCw,
  Download
} from 'lucide-react';

interface WorkflowInstance {
  id: string;
  name: string;
  template_name: string;
  status: 'pending' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled' | 'failed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  progress_percentage: number;
  current_step: string;
  assigned_to: {
    id: string;
    name: string;
    avatar?: string;
  };
  due_date: string;
  created_at: string;
  updated_at: string;
  tags: string[];
  estimated_completion: string;
  quality_score: number;
  step_instances: WorkflowStepInstance[];
}

interface WorkflowStepInstance {
  id: string;
  step_name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
  assigned_to: {
    id: string;
    name: string;
    avatar?: string;
  } | null;
  due_date: string | null;
  completed_date: string | null;
  quality_score: number | null;
  order: number;
}

interface DashboardStats {
  total_active: number;
  in_progress: number;
  on_hold: number;
  overdue: number;
  completion_rate: number;
  avg_quality_score: number;
}

export default function ActiveWorkflowsDashboard() {
  const [workflows, setWorkflows] = useState<WorkflowInstance[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [sortBy, setSortBy] = useState('updated_at');
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowInstance | null>(null);
  const [activeTab, setActiveTab] = useState('grid');

  // Mock data - replace with actual API calls
  useEffect(() => {
    const mockWorkflows: WorkflowInstance[] = [
      {
        id: '1',
        name: 'Patent Application - Quantum Computing System',
        template_name: 'Patent Drafting - Utility Patent',
        status: 'in_progress',
        priority: 'high',
        progress_percentage: 65,
        current_step: 'Claims Drafting',
        assigned_to: {
          id: '1',
          name: 'John Smith',
          avatar: '/avatars/john.jpg'
        },
        due_date: '2024-03-15T00:00:00Z',
        created_at: '2024-02-01T10:00:00Z',
        updated_at: '2024-02-28T14:30:00Z',
        tags: ['quantum', 'computing', 'utility'],
        estimated_completion: '2024-03-12T00:00:00Z',
        quality_score: 92,
        step_instances: [
          {
            id: '1-1',
            step_name: 'Prior Art Search',
            status: 'completed',
            assigned_to: { id: '1', name: 'John Smith' },
            due_date: '2024-02-05T00:00:00Z',
            completed_date: '2024-02-04T16:00:00Z',
            quality_score: 95,
            order: 1
          },
          {
            id: '1-2',
            step_name: 'Technical Review',
            status: 'completed',
            assigned_to: { id: '2', name: 'Sarah Johnson' },
            due_date: '2024-02-10T00:00:00Z',
            completed_date: '2024-02-09T11:30:00Z',
            quality_score: 88,
            order: 2
          },
          {
            id: '1-3',
            step_name: 'Claims Drafting',
            status: 'in_progress',
            assigned_to: { id: '1', name: 'John Smith' },
            due_date: '2024-03-05T00:00:00Z',
            completed_date: null,
            quality_score: null,
            order: 3
          }
        ]
      },
      {
        id: '2',
        name: 'Trademark Registration - TechFlow Brand',
        template_name: 'Trademark Application Review',
        status: 'on_hold',
        priority: 'medium',
        progress_percentage: 40,
        current_step: 'Client Review',
        assigned_to: {
          id: '2',
          name: 'Sarah Johnson',
          avatar: '/avatars/sarah.jpg'
        },
        due_date: '2024-03-20T00:00:00Z',
        created_at: '2024-02-10T09:00:00Z',
        updated_at: '2024-02-25T10:15:00Z',
        tags: ['trademark', 'brand', 'registration'],
        estimated_completion: '2024-03-18T00:00:00Z',
        quality_score: 85,
        step_instances: [
          {
            id: '2-1',
            step_name: 'Trademark Search',
            status: 'completed',
            assigned_to: { id: '2', name: 'Sarah Johnson' },
            due_date: '2024-02-15T00:00:00Z',
            completed_date: '2024-02-14T15:20:00Z',
            quality_score: 90,
            order: 1
          },
          {
            id: '2-2',
            step_name: 'Application Preparation',
            status: 'completed',
            assigned_to: { id: '2', name: 'Sarah Johnson' },
            due_date: '2024-02-20T00:00:00Z',
            completed_date: '2024-02-19T13:45:00Z',
            quality_score: 87,
            order: 2
          },
          {
            id: '2-3',
            step_name: 'Client Review',
            status: 'pending',
            assigned_to: null,
            due_date: '2024-03-01T00:00:00Z',
            completed_date: null,
            quality_score: null,
            order: 3
          }
        ]
      }
    ];

    const mockStats: DashboardStats = {
      total_active: 24,
      in_progress: 18,
      on_hold: 4,
      overdue: 2,
      completion_rate: 87.5,
      avg_quality_score: 89.2
    };

    setTimeout(() => {
      setWorkflows(mockWorkflows);
      setStats(mockStats);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredWorkflows = workflows.filter(workflow => {
    const matchesSearch = workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         workflow.template_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || workflow.status === selectedStatus;
    const matchesPriority = selectedPriority === 'all' || workflow.priority === selectedPriority;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

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

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleWorkflowAction = (workflowId: string, action: string) => {
    console.log(`${action} workflow:`, workflowId);
    // Implementation for workflow actions (pause, resume, cancel, etc.)
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
        <div>
          <h1 className="text-3xl font-bold">Active Workflows</h1>
          <p className="text-gray-600 mt-1">
            Monitor and manage ongoing workflow executions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
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
      {stats && (
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
                  <p className="text-sm text-gray-600">Completion Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.avg_quality_score}</p>
                  <p className="text-sm text-gray-600">Avg Quality</p>
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
              <Card key={workflow.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-1">{workflow.name}</CardTitle>
                      <p className="text-sm text-gray-600">{workflow.template_name}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Add Comment
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleWorkflowAction(workflow.id, 'pause')}>
                          <Pause className="w-4 h-4 mr-2" />
                          Pause
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleWorkflowAction(workflow.id, 'cancel')}>
                          <Square className="w-4 h-4 mr-2" />
                          Cancel
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(workflow.status)} variant="secondary">
                      {getStatusIcon(workflow.status)}
                      <span className="ml-1 capitalize">{workflow.status.replace('_', ' ')}</span>
                    </Badge>
                    <Badge className={getPriorityColor(workflow.priority)} variant="secondary">
                      {workflow.priority.toUpperCase()}
                    </Badge>
                    {isOverdue(workflow.due_date) && (
                      <Badge variant="destructive">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Overdue
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Progress</span>
                      <span className="text-sm font-medium">{workflow.progress_percentage}%</span>
                    </div>
                    <Progress value={workflow.progress_percentage} className="h-2" />
                  </div>

                  <div className="text-sm">
                    <p><span className="font-medium">Current Step:</span> {workflow.current_step}</p>
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <Avatar className="w-5 h-5">
                        <AvatarImage src={workflow.assigned_to.avatar} />
                        <AvatarFallback className="text-xs">
                          {workflow.assigned_to.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <span>{workflow.assigned_to.name}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>Due: {formatDate(workflow.due_date)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Target className="w-4 h-4 text-gray-400" />
                      <span>Quality: {workflow.quality_score}%</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      variant="default" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => setSelectedWorkflow(workflow)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleWorkflowAction(workflow.id, 'pause')}
                    >
                      <Pause className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="list">
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {filteredWorkflows.map((workflow) => (
                  <div key={workflow.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold">{workflow.name}</h3>
                          <Badge className={getStatusColor(workflow.status)} variant="secondary">
                            {getStatusIcon(workflow.status)}
                            <span className="ml-1 capitalize">{workflow.status.replace('_', ' ')}</span>
                          </Badge>
                          <Badge className={getPriorityColor(workflow.priority)} variant="secondary">
                            {workflow.priority.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{workflow.template_name}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <div className="flex items-center gap-2">
                            <Avatar className="w-6 h-6">
                              <AvatarImage src={workflow.assigned_to.avatar} />
                              <AvatarFallback className="text-xs">
                                {workflow.assigned_to.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{workflow.assigned_to.name}</span>
                          </div>
                          <span className="text-sm text-gray-500">Due: {formatDate(workflow.due_date)}</span>
                          <span className="text-sm text-gray-500">Quality: {workflow.quality_score}%</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm font-medium">{workflow.progress_percentage}%</div>
                          <Progress value={workflow.progress_percentage} className="w-20 h-1" />
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setSelectedWorkflow(workflow)}>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {['pending', 'in_progress', 'on_hold', 'completed'].map((status) => (
              <div key={status} className="space-y-4">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold capitalize">{status.replace('_', ' ')}</h3>
                  <Badge variant="secondary">
                    {filteredWorkflows.filter(w => w.status === status).length}
                  </Badge>
                </div>
                <div className="space-y-3">
                  {filteredWorkflows
                    .filter(workflow => workflow.status === status)
                    .map((workflow) => (
                      <Card key={workflow.id} className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardContent className="p-3">
                          <h4 className="font-medium text-sm mb-2">{workflow.name}</h4>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge className={getPriorityColor(workflow.priority)} variant="secondary" className="text-xs">
                                {workflow.priority}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <Avatar className="w-5 h-5">
                                <AvatarImage src={workflow.assigned_to.avatar} />
                                <AvatarFallback className="text-xs">
                                  {workflow.assigned_to.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs text-gray-600">{workflow.assigned_to.name}</span>
                            </div>
                            <Progress value={workflow.progress_percentage} className="h-1" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>
            ))}
          </div>
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
              {/* Workflow Overview */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Workflow Details</h4>
                  <div className="space-y-2 text-sm">
                    <div>Template: {selectedWorkflow.template_name}</div>
                    <div className="flex items-center gap-2">
                      Status: 
                      <Badge className={getStatusColor(selectedWorkflow.status)} variant="secondary">
                        {getStatusIcon(selectedWorkflow.status)}
                        <span className="ml-1 capitalize">{selectedWorkflow.status.replace('_', ' ')}</span>
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      Priority: 
                      <Badge className={getPriorityColor(selectedWorkflow.priority)} variant="secondary">
                        {selectedWorkflow.priority.toUpperCase()}
                      </Badge>
                    </div>
                    <div>Due Date: {formatDate(selectedWorkflow.due_date)}</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Progress</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Overall Progress</span>
                        <span>{selectedWorkflow.progress_percentage}%</span>
                      </div>
                      <Progress value={selectedWorkflow.progress_percentage} />
                    </div>
                    <div className="text-sm">
                      <div>Current Step: {selectedWorkflow.current_step}</div>
                      <div>Quality Score: {selectedWorkflow.quality_score}%</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step Timeline */}
              <div>
                <h4 className="font-semibold mb-4">Step Progress</h4>
                <div className="space-y-3">
                  {selectedWorkflow.step_instances.map((step, index) => (
                    <div key={step.id} className="flex items-center gap-4 p-3 border rounded-lg">
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
                          <h5 className="font-medium">{step.step_name}</h5>
                          <Badge className={getStatusColor(step.status)} variant="secondary">
                            {step.status.replace('_', ' ')}
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
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}