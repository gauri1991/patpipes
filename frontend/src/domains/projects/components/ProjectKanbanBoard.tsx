/**
 * ProjectKanbanBoard Component
 * Interactive Kanban board for advanced task and workflow management
 */

'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  MoreHorizontal, 
  Calendar, 
  User, 
  Flag, 
  Clock,
  CheckCircle2,
  AlertTriangle,
  Filter,
  Search,
  ArrowRight,
  Timer,
  Target,
  Users,
  MessageSquare,
  Paperclip,
  Eye
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Avatar } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import { useProjectTasks } from '../hooks/useProjectTasks';
import { ProjectTask, TaskStatus, ProjectPriority } from '../types/project.types';

interface ProjectKanbanBoardProps {
  projectId: string;
}

interface KanbanColumn {
  id: TaskStatus;
  title: string;
  color: string;
  tasks: ProjectTask[];
}

interface TaskFilters {
  search: string;
  assignee: string;
  priority: string;
  dueDate: string;
}

export function ProjectKanbanBoard({ projectId }: ProjectKanbanBoardProps) {
  const {
    tasks,
    isLoading,
    fetchTasks,
    updateTaskStatus,
    createTask,
    deleteTask
  } = useProjectTasks(projectId);

  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [filters, setFilters] = useState<TaskFilters>({
    search: '',
    assignee: 'all',
    priority: 'all',
    dueDate: 'all'
  });
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [newTaskColumn, setNewTaskColumn] = useState<TaskStatus>(TaskStatus.TODO);
  const [selectedTask, setSelectedTask] = useState<ProjectTask | null>(null);
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = !filters.search || 
      task.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(filters.search.toLowerCase()));
    
    const matchesAssignee = filters.assignee === 'all' || 
      task.assignedTo?.id === filters.assignee;
    
    const matchesPriority = filters.priority === 'all' || 
      task.priority === filters.priority;
    
    let matchesDueDate = true;
    if (filters.dueDate !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      switch (filters.dueDate) {
        case 'overdue':
          matchesDueDate = task.dueDate ? new Date(task.dueDate) < today : false;
          break;
        case 'today':
          matchesDueDate = task.dueDate ? 
            new Date(task.dueDate).toDateString() === today.toDateString() : false;
          break;
        case 'week':
          const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
          matchesDueDate = task.dueDate ? 
            new Date(task.dueDate) >= today && new Date(task.dueDate) <= nextWeek : false;
          break;
      }
    }
    
    return matchesSearch && matchesAssignee && matchesPriority && matchesDueDate;
  });

  useEffect(() => {
    const kanbanColumns: KanbanColumn[] = [
      {
        id: TaskStatus.TODO,
        title: 'To Do',
        color: 'border-gray-200 bg-gray-50',
        tasks: filteredTasks.filter(task => task.status === TaskStatus.TODO)
      },
      {
        id: TaskStatus.IN_PROGRESS,
        title: 'In Progress',
        color: 'border-blue-200 bg-blue-50',
        tasks: filteredTasks.filter(task => task.status === TaskStatus.IN_PROGRESS)
      },
      {
        id: TaskStatus.REVIEW,
        title: 'Review',
        color: 'border-yellow-200 bg-yellow-50',
        tasks: filteredTasks.filter(task => task.status === TaskStatus.REVIEW)
      },
      {
        id: TaskStatus.DONE,
        title: 'Done',
        color: 'border-green-200 bg-green-50',
        tasks: filteredTasks.filter(task => task.status === TaskStatus.DONE)
      },
      {
        id: TaskStatus.BLOCKED,
        title: 'Blocked',
        color: 'border-red-200 bg-red-50',
        tasks: filteredTasks.filter(task => task.status === TaskStatus.BLOCKED)
      }
    ];

    setColumns(kanbanColumns);
  }, [filteredTasks]);

  const handleTaskMove = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await updateTaskStatus(taskId, newStatus);
    } catch (error) {
      console.error('Failed to move task:', error);
    }
  };

  const handleCreateTask = async (status: TaskStatus) => {
    try {
      await createTask({
        title: 'New Task',
        description: '',
        status,
        priority: ProjectPriority.MEDIUM,
      });
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTask(taskId);
      } catch (error) {
        console.error('Failed to delete task:', error);
      }
    }
  };

  const getPriorityColor = (priority: ProjectPriority) => {
    const colors = {
      [ProjectPriority.LOW]: 'bg-green-100 text-green-800',
      [ProjectPriority.MEDIUM]: 'bg-yellow-100 text-yellow-800',
      [ProjectPriority.HIGH]: 'bg-orange-100 text-orange-800',
      [ProjectPriority.URGENT]: 'bg-red-100 text-red-800',
    };
    return colors[priority] || colors[ProjectPriority.MEDIUM];
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getDaysUntilDue = (dueDate?: string | Date) => {
    if (!dueDate) return null;
    
    const due = new Date(dueDate);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
    
    const diffTime = dueDay.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getTaskUrgency = (task: ProjectTask) => {
    const daysUntilDue = getDaysUntilDue(task.dueDate);
    
    if (!daysUntilDue) return 'none';
    if (daysUntilDue < 0) return 'overdue';
    if (daysUntilDue === 0) return 'today';
    if (daysUntilDue <= 2) return 'urgent';
    if (daysUntilDue <= 7) return 'soon';
    return 'normal';
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'overdue': return 'border-l-4 border-l-red-500 bg-red-50';
      case 'today': return 'border-l-4 border-l-orange-500 bg-orange-50';
      case 'urgent': return 'border-l-4 border-l-yellow-500 bg-yellow-50';
      case 'soon': return 'border-l-4 border-l-blue-500 bg-blue-50';
      default: return '';
    }
  };

  const uniqueAssignees = Array.from(
    new Set(tasks.map(task => task.assignedTo).filter(Boolean))
  );

  const handleCreateTaskClick = (status: TaskStatus) => {
    setNewTaskColumn(status);
    setIsCreateTaskOpen(true);
  };

  const handleTaskClick = (task: ProjectTask) => {
    setSelectedTask(task);
    setIsTaskDetailOpen(true);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      assignee: 'all',
      priority: 'all',
      dueDate: 'all'
    });
  };

  const activeFiltersCount = Object.values(filters).filter(value => value !== '' && value !== 'all').length;

  if (isLoading && tasks.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Enhanced Header with Filters */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Task Board</h2>
              <p className="text-muted-foreground">
                Manage and track project tasks • {filteredTasks.length} of {tasks.length} tasks shown
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                onClick={() => handleCreateTaskClick(TaskStatus.TODO)} 
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Task
              </Button>
            </div>
          </div>

          {/* Advanced Filters */}
          <Card className="p-4">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search tasks..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="pl-9"
                  />
                </div>
              </div>
              
              <div className="min-w-[140px]">
                <Select
                  value={filters.assignee}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, assignee: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Assignees</SelectItem>
                    {uniqueAssignees.map((assignee) => (
                      <SelectItem key={assignee!.id} value={assignee!.id}>
                        {assignee!.firstName} {assignee!.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="min-w-[120px]">
                <Select
                  value={filters.priority}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value={ProjectPriority.URGENT}>Urgent</SelectItem>
                    <SelectItem value={ProjectPriority.HIGH}>High</SelectItem>
                    <SelectItem value={ProjectPriority.MEDIUM}>Medium</SelectItem>
                    <SelectItem value={ProjectPriority.LOW}>Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="min-w-[120px]">
                <Select
                  value={filters.dueDate}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, dueDate: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Due Date" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Dates</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="today">Due Today</SelectItem>
                    <SelectItem value="week">Due This Week</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {activeFiltersCount > 0 && (
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters ({activeFiltersCount})
                </Button>
              )}
            </div>
          </Card>
        </div>

        {/* Enhanced Kanban Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 min-h-[600px]">
          {columns.map((column) => (
            <div key={column.id} className="space-y-4">
              {/* Enhanced Column Header */}
              <div className={`rounded-lg border p-4 ${column.color}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{column.title}</h3>
                    <Badge variant="outline" className="text-xs">
                      {column.tasks.length}
                    </Badge>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCreateTaskClick(column.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Add task to {column.title}</TooltipContent>
                  </Tooltip>
                </div>
                
                {/* Column Stats */}
                <div className="text-xs text-muted-foreground">
                  {column.tasks.filter(t => getTaskUrgency(t) === 'overdue').length > 0 && (
                    <span className="text-red-600 font-medium">
                      {column.tasks.filter(t => getTaskUrgency(t) === 'overdue').length} overdue
                    </span>
                  )}
                  {column.tasks.filter(t => getTaskUrgency(t) === 'today').length > 0 && (
                    <span className="text-orange-600 font-medium ml-2">
                      {column.tasks.filter(t => getTaskUrgency(t) === 'today').length} due today
                    </span>
                  )}
                </div>
              </div>

              {/* Enhanced Tasks */}
              <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
                {column.tasks.map((task) => {
                  const urgency = getTaskUrgency(task);
                  const urgencyColor = getUrgencyColor(urgency);
                  const daysUntilDue = getDaysUntilDue(task.dueDate);
                  
                  return (
                    <Card 
                      key={task.id} 
                      className={`cursor-pointer hover:shadow-md transition-all ${urgencyColor}`}
                      onClick={() => handleTaskClick(task)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-sm font-medium line-clamp-2 mb-1">
                              {task.title}
                            </CardTitle>
                            
                            {/* Urgency Indicator */}
                            {urgency !== 'none' && urgency !== 'normal' && (
                              <div className="flex items-center gap-1 mb-2">
                                <AlertTriangle className="h-3 w-3 text-orange-500" />
                                <span className="text-xs text-orange-600 font-medium">
                                  {urgency === 'overdue' ? `${Math.abs(daysUntilDue!)} days overdue` :
                                   urgency === 'today' ? 'Due today' :
                                   urgency === 'urgent' ? `Due in ${daysUntilDue} days` :
                                   `Due in ${daysUntilDue} days`}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleTaskClick(task)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Task
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Users className="h-4 w-4 mr-2" />
                                Assign
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Calendar className="h-4 w-4 mr-2" />
                                Set Due Date
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleDeleteTask(task.id)}
                                className="text-red-600"
                              >
                                <Trash className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>

                      <CardContent className="pt-0">
                        {task.description && (
                          <CardDescription className="text-xs line-clamp-2 mb-3">
                            {task.description}
                          </CardDescription>
                        )}

                        <div className="space-y-3">
                          {/* Priority and Status Badges */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge 
                              variant="secondary" 
                              className={`text-xs ${getPriorityColor(task.priority)}`}
                            >
                              <Flag className="h-3 w-3 mr-1" />
                              {task.priority}
                            </Badge>
                            
                            {task.tags && task.tags.slice(0, 2).map(tag => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            
                            {task.tags && task.tags.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{task.tags.length - 2}
                              </Badge>
                            )}
                          </div>

                          {/* Task Meta Information */}
                          <div className="space-y-2 text-xs text-muted-foreground">
                            {task.assignedTo && (
                              <div className="flex items-center gap-2">
                                <Avatar className="h-5 w-5">
                                  <div className="h-5 w-5 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                                    {task.assignedTo.firstName[0]}
                                  </div>
                                </Avatar>
                                <span>{task.assignedTo.firstName} {task.assignedTo.lastName}</span>
                              </div>
                            )}

                            <div className="flex items-center justify-between">
                              {task.estimatedHours && (
                                <div className="flex items-center gap-1">
                                  <Timer className="h-3 w-3" />
                                  <span>{task.estimatedHours}h estimated</span>
                                </div>
                              )}

                              {task.dueDate && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>{formatDate(task.dueDate)}</span>
                                </div>
                              )}
                            </div>

                            {/* Comments and Attachments */}
                            <div className="flex items-center gap-3">
                              {task.commentsCount && task.commentsCount > 0 && (
                                <div className="flex items-center gap-1">
                                  <MessageSquare className="h-3 w-3" />
                                  <span>{task.commentsCount}</span>
                                </div>
                              )}
                              
                              {task.attachmentsCount && task.attachmentsCount > 0 && (
                                <div className="flex items-center gap-1">
                                  <Paperclip className="h-3 w-3" />
                                  <span>{task.attachmentsCount}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Progress Bar */}
                          {task.progressPercentage > 0 && (
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span>Progress</span>
                                <span>{task.progressPercentage}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div
                                  className="bg-blue-500 h-1.5 rounded-full transition-all"
                                  style={{ width: `${task.progressPercentage}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Quick Action Buttons */}
                          <div className="flex flex-wrap gap-1">
                            {columns
                              .filter(col => col.id !== column.id)
                              .slice(0, 2)
                              .map((targetColumn) => (
                                <Tooltip key={targetColumn.id}>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-xs h-6 px-2"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleTaskMove(task.id, targetColumn.id);
                                      }}
                                    >
                                      <ArrowRight className="h-3 w-3 mr-1" />
                                      {targetColumn.title}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Move to {targetColumn.title}</TooltipContent>
                                </Tooltip>
                              ))
                            }
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

                {/* Enhanced Empty State */}
                {column.tasks.length === 0 && (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <div className="mb-3">
                      <CheckCircle2 className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-muted-foreground">
                        No tasks in {column.title.toLowerCase()}
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleCreateTaskClick(column.id)}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Task
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Global Empty State */}
        {tasks.length === 0 && (
          <Card className="text-center py-16">
            <CardContent>
              <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
                <Target className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No tasks yet</h3>
              <p className="text-muted-foreground mb-6">
                Get started by creating your first task for this project. Tasks help you organize and track work progress.
              </p>
              <Button 
                onClick={() => handleCreateTaskClick(TaskStatus.TODO)} 
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Create First Task
              </Button>
            </CardContent>
          </Card>
        )}

        {/* No Filtered Results */}
        {tasks.length > 0 && filteredTasks.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No tasks match your filters</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search criteria or clearing the filters to see more tasks.
              </p>
              <Button variant="outline" onClick={clearFilters}>
                Clear All Filters
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Task Creation Modal */}
        <Dialog open={isCreateTaskOpen} onOpenChange={setIsCreateTaskOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
              <DialogDescription>
                Add a new task to the {newTaskColumn.toLowerCase().replace('_', ' ')} column
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              handleCreateTask(newTaskColumn, {
                title: formData.get('title') as string,
                description: formData.get('description') as string,
                priority: formData.get('priority') as ProjectPriority || ProjectPriority.MEDIUM,
              });
              setIsCreateTaskOpen(false);
            }} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Task Title</label>
                <Input
                  name="title"
                  placeholder="Enter task title..."
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  name="description"
                  placeholder="Task description (optional)..."
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Priority</label>
                <Select name="priority" defaultValue={ProjectPriority.MEDIUM}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ProjectPriority.LOW}>Low</SelectItem>
                    <SelectItem value={ProjectPriority.MEDIUM}>Medium</SelectItem>
                    <SelectItem value={ProjectPriority.HIGH}>High</SelectItem>
                    <SelectItem value={ProjectPriority.URGENT}>Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateTaskOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Create Task
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Task Detail Modal */}
        <Dialog open={isTaskDetailOpen} onOpenChange={setIsTaskDetailOpen}>
          <DialogContent className="max-w-2xl">
            {selectedTask && (
              <>
                <DialogHeader>
                  <div className="flex items-center justify-between">
                    <DialogTitle className="text-xl">{selectedTask.title}</DialogTitle>
                    <Badge 
                      variant="secondary" 
                      className={getPriorityColor(selectedTask.priority)}
                    >
                      {selectedTask.priority}
                    </Badge>
                  </div>
                  <DialogDescription className="text-base">
                    {selectedTask.description || 'No description provided'}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Status</label>
                      <p className="font-medium">{selectedTask.status.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Priority</label>
                      <p className="font-medium">{selectedTask.priority}</p>
                    </div>
                    {selectedTask.assignedTo && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Assigned To</label>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <div className="h-6 w-6 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                              {selectedTask.assignedTo.firstName[0]}
                            </div>
                          </Avatar>
                          <span className="font-medium">
                            {selectedTask.assignedTo.firstName} {selectedTask.assignedTo.lastName}
                          </span>
                        </div>
                      </div>
                    )}
                    {selectedTask.dueDate && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Due Date</label>
                        <p className="font-medium">{formatDate(selectedTask.dueDate)}</p>
                      </div>
                    )}
                  </div>
                  
                  {selectedTask.progressPercentage > 0 && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Progress</label>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all"
                            style={{ width: `${selectedTask.progressPercentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{selectedTask.progressPercentage}%</span>
                      </div>
                    </div>
                  )}
                  
                  {selectedTask.tags && selectedTask.tags.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Tags</label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {selectedTask.tags.map(tag => (
                          <Badge key={tag} variant="outline">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsTaskDetailOpen(false)}>
                    Close
                  </Button>
                  <Button>
                    Edit Task
                  </Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}