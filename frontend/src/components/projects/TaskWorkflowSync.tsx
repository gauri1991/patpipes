'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  ArrowRightLeft,
  CheckCircle,
  Clock,
  AlertTriangle,
  Play,
  User,
  Calendar,
  Workflow,
  Target,
  RefreshCw,
  Link2,
  Unlink,
  GitMerge,
  AlertCircle,
  CheckCircle2,
  Eye
} from 'lucide-react';

interface ProjectTask {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'review' | 'done' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to: {
    id: string;
    name: string;
  } | null;
  due_date: string | null;
  completed_date: string | null;
  estimated_hours: number | null;
  actual_hours: number;
  progress_percentage: number;
  workflow_step_id: string | null; // Link to workflow step
  sync_status: 'synced' | 'out_of_sync' | 'not_linked' | 'conflict';
}

interface WorkflowStep {
  id: string;
  step_name: string;
  workflow_name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
  assigned_to: {
    id: string;
    name: string;
  } | null;
  due_date: string | null;
  completed_date: string | null;
  quality_score: number | null;
  estimated_hours: number | null;
  actual_hours: number;
  task_id: string | null; // Link to project task
  sync_status: 'synced' | 'out_of_sync' | 'not_linked' | 'conflict';
}

interface SyncConflict {
  id: string;
  task_id: string;
  step_id: string;
  task_title: string;
  step_name: string;
  conflicts: {
    field: string;
    task_value: any;
    step_value: any;
  }[];
}

interface TaskWorkflowSyncProps {
  projectId: string;
}

export default function TaskWorkflowSync({ projectId }: TaskWorkflowSyncProps) {
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([]);
  const [syncConflicts, setSyncConflicts] = useState<SyncConflict[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [selectedStep, setSelectedStep] = useState<string | null>(null);
  const [showLinkDialog, setShowLinkDialog] = useState(false);

  // Mock data - replace with actual API calls
  useEffect(() => {
    const loadData = async () => {
      try {
        // Mock tasks data
        const mockTasks: ProjectTask[] = [
          {
            id: '1',
            title: 'Conduct Prior Art Search',
            description: 'Comprehensive prior art search for quantum computing patent',
            status: 'done',
            priority: 'high',
            assigned_to: { id: '1', name: 'John Smith' },
            due_date: '2024-02-15T00:00:00Z',
            completed_date: '2024-02-14T16:00:00Z',
            estimated_hours: 16,
            actual_hours: 18,
            progress_percentage: 100,
            workflow_step_id: 'step-1',
            sync_status: 'synced'
          },
          {
            id: '2',
            title: 'Draft Patent Claims',
            description: 'Write independent and dependent claims',
            status: 'in_progress',
            priority: 'high',
            assigned_to: { id: '2', name: 'Sarah Johnson' },
            due_date: '2024-03-05T00:00:00Z',
            completed_date: null,
            estimated_hours: 24,
            actual_hours: 12,
            progress_percentage: 50,
            workflow_step_id: 'step-2',
            sync_status: 'out_of_sync'
          },
          {
            id: '3',
            title: 'Prepare Technical Drawings',
            description: 'Create patent drawings and figures',
            status: 'todo',
            priority: 'medium',
            assigned_to: { id: '3', name: 'Mike Chen' },
            due_date: '2024-03-10T00:00:00Z',
            completed_date: null,
            estimated_hours: 12,
            actual_hours: 0,
            progress_percentage: 0,
            workflow_step_id: null,
            sync_status: 'not_linked'
          },
          {
            id: '4',
            title: 'Quality Review',
            description: 'Final quality review of patent application',
            status: 'review',
            priority: 'high',
            assigned_to: { id: '4', name: 'Lisa Wong' },
            due_date: '2024-03-15T00:00:00Z',
            completed_date: null,
            estimated_hours: 8,
            actual_hours: 2,
            progress_percentage: 25,
            workflow_step_id: 'step-3',
            sync_status: 'conflict'
          }
        ];

        // Mock workflow steps data
        const mockWorkflowSteps: WorkflowStep[] = [
          {
            id: 'step-1',
            step_name: 'Prior Art Search',
            workflow_name: 'Patent Drafting - Quantum Computing System',
            status: 'completed',
            assigned_to: { id: '1', name: 'John Smith' },
            due_date: '2024-02-15T00:00:00Z',
            completed_date: '2024-02-14T16:00:00Z',
            quality_score: 95,
            estimated_hours: 16,
            actual_hours: 18,
            task_id: '1',
            sync_status: 'synced'
          },
          {
            id: 'step-2',
            step_name: 'Claims Drafting',
            workflow_name: 'Patent Drafting - Quantum Computing System',
            status: 'in_progress',
            assigned_to: { id: '2', name: 'Sarah Johnson' },
            due_date: '2024-03-05T00:00:00Z',
            completed_date: null,
            quality_score: null,
            estimated_hours: 24,
            actual_hours: 15,
            task_id: '2',
            sync_status: 'out_of_sync'
          },
          {
            id: 'step-3',
            step_name: 'Quality Gate Review',
            workflow_name: 'Patent Drafting - Quantum Computing System',
            status: 'pending',
            assigned_to: { id: '5', name: 'David Brown' },
            due_date: '2024-03-15T00:00:00Z',
            completed_date: null,
            quality_score: null,
            estimated_hours: 8,
            actual_hours: 0,
            task_id: '4',
            sync_status: 'conflict'
          },
          {
            id: 'step-4',
            step_name: 'Technical Drawing Review',
            workflow_name: 'Patent Drafting - Quantum Computing System',
            status: 'pending',
            assigned_to: null,
            due_date: '2024-03-12T00:00:00Z',
            completed_date: null,
            quality_score: null,
            estimated_hours: 4,
            actual_hours: 0,
            task_id: null,
            sync_status: 'not_linked'
          }
        ];

        // Mock sync conflicts
        const mockSyncConflicts: SyncConflict[] = [
          {
            id: 'conflict-1',
            task_id: '2',
            step_id: 'step-2',
            task_title: 'Draft Patent Claims',
            step_name: 'Claims Drafting',
            conflicts: [
              {
                field: 'actual_hours',
                task_value: 12,
                step_value: 15
              }
            ]
          },
          {
            id: 'conflict-2',
            task_id: '4',
            step_id: 'step-3',
            task_title: 'Quality Review',
            step_name: 'Quality Gate Review',
            conflicts: [
              {
                field: 'assigned_to',
                task_value: 'Lisa Wong',
                step_value: 'David Brown'
              },
              {
                field: 'status',
                task_value: 'review',
                step_value: 'pending'
              }
            ]
          }
        ];

        setTimeout(() => {
          setTasks(mockTasks);
          setWorkflowSteps(mockWorkflowSteps);
          setSyncConflicts(mockSyncConflicts);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error loading sync data:', error);
        setLoading(false);
      }
    };

    loadData();
  }, [projectId]);

  const getSyncStatusColor = (status: string) => {
    switch (status) {
      case 'synced': return 'bg-green-100 text-green-800';
      case 'out_of_sync': return 'bg-yellow-100 text-yellow-800';
      case 'not_linked': return 'bg-gray-100 text-gray-800';
      case 'conflict': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSyncStatusIcon = (status: string) => {
    switch (status) {
      case 'synced': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'out_of_sync': return <RefreshCw className="w-4 h-4 text-yellow-500" />;
      case 'not_linked': return <Unlink className="w-4 h-4 text-gray-500" />;
      case 'conflict': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo': return 'bg-gray-100 text-gray-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'review': return 'bg-purple-100 text-purple-800';
      case 'done': return 'bg-green-100 text-green-800';
      case 'blocked': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'skipped': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleSync = async (taskId: string, stepId: string) => {
    try {
      console.log('Syncing task and step:', { taskId, stepId });
      // Implement sync logic
    } catch (error) {
      console.error('Error syncing:', error);
    }
  };

  const handleLinkTaskToStep = async () => {
    if (!selectedTask || !selectedStep) return;

    try {
      console.log('Linking task to step:', { 
        taskId: selectedTask, 
        stepId: selectedStep 
      });
      // Implement linking logic
      setShowLinkDialog(false);
      setSelectedTask(null);
      setSelectedStep(null);
    } catch (error) {
      console.error('Error linking:', error);
    }
  };

  const handleResolveConflict = async (conflictId: string, resolution: any) => {
    try {
      console.log('Resolving conflict:', { conflictId, resolution });
      // Implement conflict resolution logic
    } catch (error) {
      console.error('Error resolving conflict:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading task-workflow synchronization...</div>
      </div>
    );
  }

  const syncStats = {
    total_items: tasks.length + workflowSteps.length,
    synced: tasks.filter(t => t.sync_status === 'synced').length + 
            workflowSteps.filter(s => s.sync_status === 'synced').length,
    out_of_sync: tasks.filter(t => t.sync_status === 'out_of_sync').length + 
                 workflowSteps.filter(s => s.sync_status === 'out_of_sync').length,
    conflicts: syncConflicts.length,
    not_linked: tasks.filter(t => t.sync_status === 'not_linked').length + 
                workflowSteps.filter(s => s.sync_status === 'not_linked').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ArrowRightLeft className="w-6 h-6" />
            Task-Workflow Synchronization
          </h2>
          <p className="text-gray-600 mt-1">
            Keep project tasks and workflow steps in sync
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Sync All
          </Button>
          <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
            <DialogTrigger asChild>
              <Button>
                <Link2 className="w-4 h-4 mr-2" />
                Link Items
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Link Task to Workflow Step</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Select Task</label>
                  <select 
                    value={selectedTask || ''} 
                    onChange={(e) => setSelectedTask(e.target.value)}
                    className="w-full mt-1 p-2 border rounded"
                  >
                    <option value="">Select a task...</option>
                    {tasks.filter(t => t.sync_status === 'not_linked').map(task => (
                      <option key={task.id} value={task.id}>{task.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Select Workflow Step</label>
                  <select 
                    value={selectedStep || ''} 
                    onChange={(e) => setSelectedStep(e.target.value)}
                    className="w-full mt-1 p-2 border rounded"
                  >
                    <option value="">Select a step...</option>
                    {workflowSteps.filter(s => s.sync_status === 'not_linked').map(step => (
                      <option key={step.id} value={step.id}>
                        {step.workflow_name} - {step.step_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setShowLinkDialog(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleLinkTaskToStep} 
                    disabled={!selectedTask || !selectedStep}
                  >
                    Link Items
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <GitMerge className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{syncStats.total_items}</p>
                <p className="text-sm text-gray-600">Total Items</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{syncStats.synced}</p>
                <p className="text-sm text-gray-600">Synced</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{syncStats.out_of_sync}</p>
                <p className="text-sm text-gray-600">Out of Sync</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{syncStats.conflicts}</p>
                <p className="text-sm text-gray-600">Conflicts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Unlink className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-2xl font-bold">{syncStats.not_linked}</p>
                <p className="text-sm text-gray-600">Not Linked</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">Project Tasks</TabsTrigger>
          <TabsTrigger value="workflows">Workflow Steps</TabsTrigger>
          <TabsTrigger value="conflicts">Conflicts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sync Status Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Synchronization Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span>Synced Items</span>
                    </div>
                    <span className="font-medium">{syncStats.synced}</span>
                  </div>
                  <Progress value={(syncStats.synced / syncStats.total_items) * 100} className="h-2" />
                  
                  <div className="grid grid-cols-3 gap-2 text-sm pt-2">
                    <div className="text-center">
                      <div className="text-yellow-600 font-medium">{syncStats.out_of_sync}</div>
                      <div className="text-gray-600">Out of Sync</div>
                    </div>
                    <div className="text-center">
                      <div className="text-red-600 font-medium">{syncStats.conflicts}</div>
                      <div className="text-gray-600">Conflicts</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-600 font-medium">{syncStats.not_linked}</div>
                      <div className="text-gray-600">Not Linked</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Sync Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-2 bg-green-50 rounded">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <div className="flex-1 text-sm">
                      <div>Prior Art Search task synced successfully</div>
                      <div className="text-gray-500">2 hours ago</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-2 bg-yellow-50 rounded">
                    <RefreshCw className="w-4 h-4 text-yellow-500" />
                    <div className="flex-1 text-sm">
                      <div>Claims Drafting hours mismatch detected</div>
                      <div className="text-gray-500">4 hours ago</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-2 bg-red-50 rounded">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <div className="flex-1 text-sm">
                      <div>Quality Review assignment conflict</div>
                      <div className="text-gray-500">6 hours ago</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tasks">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Sync Status</TableHead>
                    <TableHead>Linked Step</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{task.title}</div>
                          <div className="text-sm text-gray-600">{task.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(task.status)} variant="secondary">
                          {task.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {task.assigned_to ? (
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span>{task.assigned_to.name}</span>
                          </div>
                        ) : (
                          <span className="text-gray-500">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Progress value={task.progress_percentage} className="w-16 h-2" />
                          <div className="text-xs text-gray-500">{task.progress_percentage}%</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getSyncStatusColor(task.sync_status)} variant="secondary">
                          {getSyncStatusIcon(task.sync_status)}
                          <span className="ml-1">{task.sync_status.replace('_', ' ')}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {task.workflow_step_id ? (
                          <span className="text-sm">Linked</span>
                        ) : (
                          <span className="text-gray-500 text-sm">Not linked</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {task.sync_status === 'out_of_sync' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSync(task.id, task.workflow_step_id!)}
                            >
                              <RefreshCw className="w-4 h-4" />
                            </Button>
                          )}
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workflows">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Workflow Step</TableHead>
                    <TableHead>Workflow</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Quality Score</TableHead>
                    <TableHead>Sync Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workflowSteps.map((step) => (
                    <TableRow key={step.id}>
                      <TableCell>
                        <div className="font-medium">{step.step_name}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{step.workflow_name}</div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(step.status)} variant="secondary">
                          {step.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {step.assigned_to ? (
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span>{step.assigned_to.name}</span>
                          </div>
                        ) : (
                          <span className="text-gray-500">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {step.quality_score ? (
                          <div className="flex items-center gap-1">
                            <Target className="w-4 h-4 text-gray-400" />
                            <span>{step.quality_score}%</span>
                          </div>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={getSyncStatusColor(step.sync_status)} variant="secondary">
                          {getSyncStatusIcon(step.sync_status)}
                          <span className="ml-1">{step.sync_status.replace('_', ' ')}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {step.sync_status === 'out_of_sync' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSync(step.task_id!, step.id)}
                            >
                              <RefreshCw className="w-4 h-4" />
                            </Button>
                          )}
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conflicts">
          <div className="space-y-4">
            {syncConflicts.map((conflict) => (
              <Card key={conflict.id} className="border-red-200">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    Sync Conflict
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="font-medium">Task: {conflict.task_title}</div>
                    <div className="text-sm text-gray-600">Workflow Step: {conflict.step_name}</div>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-medium">Conflicts:</h4>
                    {conflict.conflicts.map((conf, index) => (
                      <div key={index} className="border rounded-lg p-3">
                        <div className="font-medium capitalize mb-2">{conf.field.replace('_', ' ')}</div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-gray-600">Task Value:</div>
                            <div className="font-medium">{conf.task_value}</div>
                          </div>
                          <div>
                            <div className="text-gray-600">Workflow Value:</div>
                            <div className="font-medium">{conf.step_value}</div>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleResolveConflict(conflict.id, { 
                              field: conf.field, 
                              use: 'task' 
                            })}
                          >
                            Use Task Value
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleResolveConflict(conflict.id, { 
                              field: conf.field, 
                              use: 'step' 
                            })}
                          >
                            Use Workflow Value
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {syncConflicts.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Conflicts</h3>
                  <p className="text-gray-600">All tasks and workflow steps are in sync!</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}