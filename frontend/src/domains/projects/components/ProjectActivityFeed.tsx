/**
 * ProjectActivityFeed Component
 * Real-time activity feed showing project events and changes
 */

'use client';

import { useState, useEffect } from 'react';
import { 
  Activity,
  User,
  FileText,
  Calendar,
  MessageSquare,
  Upload,
  Download,
  Edit,
  Plus,
  Trash,
  Clock,
  CheckCircle,
  AlertCircle,
  GitCommit
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ActivityItem {
  id: string;
  type: 'task' | 'file' | 'comment' | 'milestone' | 'team' | 'workflow' | 'system';
  action: string;
  description: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  timestamp: string;
  metadata?: {
    taskTitle?: string;
    fileName?: string;
    fileSize?: number;
    milestone?: string;
    workflow?: string;
    status?: string;
    priority?: string;
  };
}

interface ProjectActivityFeedProps {
  projectId: string;
  limit?: number;
  showFilters?: boolean;
}

const mockActivityData: ActivityItem[] = [
  {
    id: '1',
    type: 'task',
    action: 'completed',
    description: 'Completed patent research analysis',
    user: { id: '1', firstName: 'John', lastName: 'Doe' },
    timestamp: '2025-08-07T10:30:00Z',
    metadata: { taskTitle: 'Patent Research Analysis', status: 'completed' }
  },
  {
    id: '2',
    type: 'file',
    action: 'uploaded',
    description: 'Uploaded patent application draft',
    user: { id: '2', firstName: 'Sarah', lastName: 'Wilson' },
    timestamp: '2025-08-07T09:45:00Z',
    metadata: { fileName: 'patent_draft_v2.pdf', fileSize: 2048576 }
  },
  {
    id: '3',
    type: 'comment',
    action: 'added',
    description: 'Added review comments on claim structure',
    user: { id: '3', firstName: 'Mike', lastName: 'Chen' },
    timestamp: '2025-08-07T09:20:00Z',
    metadata: { taskTitle: 'Claim Review' }
  },
  {
    id: '4',
    type: 'milestone',
    action: 'achieved',
    description: 'Reached first review milestone',
    user: { id: '1', firstName: 'John', lastName: 'Doe' },
    timestamp: '2025-08-07T08:15:00Z',
    metadata: { milestone: 'First Review Complete' }
  },
  {
    id: '5',
    type: 'workflow',
    action: 'started',
    description: 'Initiated patent filing workflow',
    user: { id: '4', firstName: 'Lisa', lastName: 'Johnson' },
    timestamp: '2025-08-06T16:30:00Z',
    metadata: { workflow: 'Patent Filing Process' }
  },
  {
    id: '6',
    type: 'team',
    action: 'added',
    description: 'Added new team member to project',
    user: { id: '1', firstName: 'John', lastName: 'Doe' },
    timestamp: '2025-08-06T14:20:00Z',
    metadata: { }
  },
  {
    id: '7',
    type: 'task',
    action: 'created',
    description: 'Created new task for prior art search',
    user: { id: '2', firstName: 'Sarah', lastName: 'Wilson' },
    timestamp: '2025-08-06T13:45:00Z',
    metadata: { taskTitle: 'Prior Art Search', status: 'todo', priority: 'high' }
  },
  {
    id: '8',
    type: 'file',
    action: 'downloaded',
    description: 'Downloaded competitor analysis report',
    user: { id: '3', firstName: 'Mike', lastName: 'Chen' },
    timestamp: '2025-08-06T11:30:00Z',
    metadata: { fileName: 'competitor_analysis.xlsx', fileSize: 1024576 }
  },
  {
    id: '9',
    type: 'system',
    action: 'backup',
    description: 'Automated backup completed successfully',
    user: { id: 'system', firstName: 'System', lastName: '' },
    timestamp: '2025-08-06T10:00:00Z',
    metadata: { }
  },
  {
    id: '10',
    type: 'workflow',
    action: 'updated',
    description: 'Updated workflow template configuration',
    user: { id: '4', firstName: 'Lisa', lastName: 'Johnson' },
    timestamp: '2025-08-06T09:15:00Z',
    metadata: { workflow: 'Standard Review Process' }
  }
];

export function ProjectActivityFeed({ 
  projectId, 
  limit = 10, 
  showFilters = true 
}: ProjectActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>(mockActivityData.slice(0, limit));
  const [filteredActivities, setFilteredActivities] = useState<ActivityItem[]>(activities);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (selectedFilter === 'all') {
      setFilteredActivities(activities);
    } else {
      setFilteredActivities(activities.filter(activity => activity.type === selectedFilter));
    }
  }, [activities, selectedFilter]);

  const getActivityIcon = (type: string, action: string) => {
    switch (type) {
      case 'task':
        return action === 'completed' 
          ? <CheckCircle className="h-4 w-4 text-green-500" />
          : action === 'created'
          ? <Plus className="h-4 w-4 text-blue-500" />
          : <Edit className="h-4 w-4 text-orange-500" />;
      case 'file':
        return action === 'uploaded'
          ? <Upload className="h-4 w-4 text-blue-500" />
          : <Download className="h-4 w-4 text-purple-500" />;
      case 'comment':
        return <MessageSquare className="h-4 w-4 text-indigo-500" />;
      case 'milestone':
        return <Calendar className="h-4 w-4 text-green-500" />;
      case 'team':
        return <User className="h-4 w-4 text-cyan-500" />;
      case 'workflow':
        return <GitCommit className="h-4 w-4 text-purple-500" />;
      case 'system':
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const formatFileSize = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${Math.round(size * 100) / 100} ${units[unitIndex]}`;
  };

  const getActivityDetails = (activity: ActivityItem) => {
    const { type, action, metadata } = activity;
    
    switch (type) {
      case 'task':
        return (
          <div className="flex items-center gap-2">
            <span className="font-medium">{metadata?.taskTitle}</span>
            {metadata?.status && (
              <Badge variant="outline" className="text-xs">
                {metadata.status}
              </Badge>
            )}
            {metadata?.priority && (
              <Badge 
                variant={metadata.priority === 'high' ? 'destructive' : 'secondary'}
                className="text-xs"
              >
                {metadata.priority}
              </Badge>
            )}
          </div>
        );
      case 'file':
        return (
          <div className="flex items-center gap-2">
            <FileText className="h-3 w-3" />
            <span className="font-medium">{metadata?.fileName}</span>
            {metadata?.fileSize && (
              <span className="text-xs text-muted-foreground">
                ({formatFileSize(metadata.fileSize)})
              </span>
            )}
          </div>
        );
      case 'milestone':
        return (
          <span className="font-medium">{metadata?.milestone}</span>
        );
      case 'workflow':
        return (
          <span className="font-medium">{metadata?.workflow}</span>
        );
      default:
        return null;
    }
  };

  const activityCounts = activities.reduce((acc, activity) => {
    acc[activity.type] = (acc[activity.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const loadMoreActivities = () => {
    setIsLoading(true);
    // Simulate loading more activities
    setTimeout(() => {
      const additionalActivities = mockActivityData.slice(
        activities.length, 
        activities.length + 5
      );
      setActivities(prev => [...prev, ...additionalActivities]);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Activity Feed
            </CardTitle>
            <CardDescription>
              Recent project activity and updates
            </CardDescription>
          </div>
          
          {showFilters && (
            <Select value={selectedFilter} onValueChange={setSelectedFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Activity</SelectItem>
                <SelectItem value="task">
                  Tasks ({activityCounts.task || 0})
                </SelectItem>
                <SelectItem value="file">
                  Files ({activityCounts.file || 0})
                </SelectItem>
                <SelectItem value="comment">
                  Comments ({activityCounts.comment || 0})
                </SelectItem>
                <SelectItem value="milestone">
                  Milestones ({activityCounts.milestone || 0})
                </SelectItem>
                <SelectItem value="workflow">
                  Workflows ({activityCounts.workflow || 0})
                </SelectItem>
                <SelectItem value="team">
                  Team ({activityCounts.team || 0})
                </SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {filteredActivities.map((activity, index) => (
            <div key={activity.id}>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100">
                    {getActivityIcon(activity.type, activity.action)}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <div className="h-6 w-6 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                          {activity.user.firstName[0]}{activity.user.lastName[0] || ''}
                        </div>
                      </Avatar>
                      <span className="text-sm font-medium">
                        {activity.user.firstName} {activity.user.lastName}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {activity.action}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTimestamp(activity.timestamp)}
                    </span>
                  </div>
                  
                  <div className="mt-1">
                    <p className="text-sm text-gray-600">{activity.description}</p>
                    {getActivityDetails(activity) && (
                      <div className="mt-2">
                        {getActivityDetails(activity)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {index < filteredActivities.length - 1 && (
                <Separator className="my-4" />
              )}
            </div>
          ))}
          
          {filteredActivities.length === 0 && (
            <div className="text-center py-8">
              <Activity className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No activity found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {selectedFilter !== 'all' 
                  ? `No ${selectedFilter} activities to show.`
                  : 'Activity will appear here as the project progresses.'
                }
              </p>
            </div>
          )}
          
          {activities.length < mockActivityData.length && (
            <div className="flex justify-center pt-4">
              <Button 
                variant="outline" 
                onClick={loadMoreActivities}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                {isLoading ? 'Loading...' : 'Load More'}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}