/**
 * ProjectTimeline Component
 * Visual timeline showing project tasks, milestones, and deadlines
 */

'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, Flag, CheckCircle, Circle, AlertCircle } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { useProjectTasks } from '../hooks/useProjectTasks';
import { useProjectMilestones } from '../hooks/useProjectMilestones';
import { ProjectTask, ProjectMilestone, TaskStatus, ProjectPriority } from '../types/project.types';

interface ProjectTimelineProps {
  projectId: string;
}

interface TimelineItem {
  id: string;
  type: 'task' | 'milestone' | 'deadline';
  title: string;
  description?: string;
  date: Date;
  status: 'completed' | 'in_progress' | 'pending' | 'overdue';
  priority?: ProjectPriority;
  assignee?: string;
  color: string;
}

export function ProjectTimeline({ projectId }: ProjectTimelineProps) {
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [viewMode, setViewMode] = useState<'all' | 'upcoming' | 'completed'>('all');

  const { tasks, fetchTasks } = useProjectTasks(projectId);
  const { milestones, fetchMilestones } = useProjectMilestones(projectId);

  useEffect(() => {
    fetchTasks();
    fetchMilestones();
  }, [fetchTasks, fetchMilestones]);

  useEffect(() => {
    const items: TimelineItem[] = [];
    const now = new Date();

    // Add tasks to timeline
    tasks.forEach(task => {
      if (task.dueDate || task.startDate || task.completedDate) {
        const taskDate = task.completedDate 
          ? new Date(task.completedDate)
          : task.dueDate 
          ? new Date(task.dueDate)
          : task.startDate 
          ? new Date(task.startDate)
          : now;

        let status: TimelineItem['status'];
        let color: string;

        if (task.status === TaskStatus.DONE) {
          status = 'completed';
          color = 'bg-green-500';
        } else if (task.status === TaskStatus.IN_PROGRESS) {
          status = 'in_progress';
          color = 'bg-blue-500';
        } else if (task.dueDate && new Date(task.dueDate) < now) {
          status = 'overdue';
          color = 'bg-red-500';
        } else {
          status = 'pending';
          color = 'bg-gray-400';
        }

        items.push({
          id: `task-${task.id}`,
          type: 'task',
          title: task.title,
          description: task.description,
          date: taskDate,
          status,
          priority: task.priority,
          assignee: task.assignedTo?.firstName,
          color
        });
      }
    });

    // Add milestones to timeline
    milestones.forEach(milestone => {
      const milestoneDate = milestone.completedDate 
        ? new Date(milestone.completedDate)
        : new Date(milestone.targetDate);

      let status: TimelineItem['status'];
      let color: string;

      if (milestone.isCompleted) {
        status = 'completed';
        color = 'bg-green-500';
      } else if (new Date(milestone.targetDate) < now) {
        status = 'overdue';
        color = 'bg-red-500';
      } else {
        status = 'pending';
        color = 'bg-purple-500';
      }

      items.push({
        id: `milestone-${milestone.id}`,
        type: 'milestone',
        title: milestone.title,
        description: milestone.description,
        date: milestoneDate,
        status,
        priority: milestone.importance,
        color
      });
    });

    // Sort by date
    items.sort((a, b) => a.date.getTime() - b.date.getTime());

    setTimelineItems(items);
  }, [tasks, milestones]);

  const filteredItems = timelineItems.filter(item => {
    if (viewMode === 'completed') return item.status === 'completed';
    if (viewMode === 'upcoming') return item.status !== 'completed';
    return true;
  });

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusIcon = (item: TimelineItem) => {
    switch (item.status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-blue-600" />;
      case 'overdue':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Circle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'milestone':
        return <Flag className="h-4 w-4" />;
      case 'deadline':
        return <Calendar className="h-4 w-4" />;
      default:
        return <CheckCircle className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority?: ProjectPriority) => {
    if (!priority) return 'bg-gray-100 text-gray-800';
    
    const colors = {
      [ProjectPriority.LOW]: 'bg-green-100 text-green-800',
      [ProjectPriority.MEDIUM]: 'bg-yellow-100 text-yellow-800',
      [ProjectPriority.HIGH]: 'bg-orange-100 text-orange-800',
      [ProjectPriority.URGENT]: 'bg-red-100 text-red-800',
    };
    return colors[priority];
  };

  const groupItemsByMonth = (items: TimelineItem[]) => {
    const groups: { [key: string]: TimelineItem[] } = {};
    
    items.forEach(item => {
      const monthKey = item.date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long'
      });
      
      if (!groups[monthKey]) {
        groups[monthKey] = [];
      }
      groups[monthKey].push(item);
    });

    return groups;
  };

  const groupedItems = groupItemsByMonth(filteredItems);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Project Timeline</h2>
          <p className="text-muted-foreground">Track tasks, milestones, and deadlines</p>
        </div>
        
        <div className="flex gap-2">
          {(['all', 'upcoming', 'completed'] as const).map((mode) => (
            <Button
              key={mode}
              variant={viewMode === mode ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode(mode)}
              className="capitalize"
            >
              {mode}
            </Button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-6">
        {Object.entries(groupedItems).map(([month, items]) => (
          <div key={month}>
            <h3 className="text-lg font-semibold text-muted-foreground mb-4">{month}</h3>
            
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>
              
              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={item.id} className="relative flex items-start space-x-4">
                    {/* Timeline Dot */}
                    <div className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-4 border-white shadow-sm ${item.color}`}>
                      <div className="text-white">
                        {getTypeIcon(item.type)}
                      </div>
                    </div>

                    {/* Timeline Content */}
                    <div className="flex-1 min-w-0">
                      <Card className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <CardTitle className="text-base">{item.title}</CardTitle>
                                {getStatusIcon(item)}
                              </div>
                              
                              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <span>{formatDate(item.date)}</span>
                                
                                <Badge
                                  variant="secondary"
                                  className={`text-xs capitalize ${item.type === 'milestone' ? 'bg-purple-100 text-purple-800' : ''}`}
                                >
                                  {item.type}
                                </Badge>
                                
                                {item.priority && (
                                  <Badge
                                    variant="secondary"
                                    className={`text-xs ${getPriorityColor(item.priority)}`}
                                  >
                                    {item.priority}
                                  </Badge>
                                )}
                                
                                {item.assignee && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {item.assignee}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardHeader>

                        {item.description && (
                          <CardContent className="pt-0">
                            <CardDescription>{item.description}</CardDescription>
                          </CardContent>
                        )}
                      </Card>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredItems.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
              <Calendar className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              No {viewMode === 'all' ? 'timeline items' : `${viewMode} items`}
            </h3>
            <p className="text-muted-foreground">
              {viewMode === 'all' 
                ? 'Tasks and milestones with dates will appear here'
                : `No ${viewMode} tasks or milestones to show`
              }
            </p>
          </CardContent>
        </Card>
      )}

      {/* Timeline Stats */}
      {timelineItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Timeline Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {timelineItems.filter(item => item.status === 'completed').length}
                </div>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {timelineItems.filter(item => item.status === 'in_progress').length}
                </div>
                <p className="text-sm text-muted-foreground">In Progress</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-600">
                  {timelineItems.filter(item => item.status === 'pending').length}
                </div>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {timelineItems.filter(item => item.status === 'overdue').length}
                </div>
                <p className="text-sm text-muted-foreground">Overdue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}