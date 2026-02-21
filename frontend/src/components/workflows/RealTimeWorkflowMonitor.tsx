'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Play,
  Pause,
  User,
  Calendar,
  Target,
  Activity,
  RefreshCw,
  Wifi,
  WifiOff,
  Bell,
  Eye,
  Settings
} from 'lucide-react';
import { useWorkflowWebSocket } from '@/hooks/useWorkflowWebSocket';
import { toast } from 'sonner';

interface RealTimeWorkflowMonitorProps {
  workflowId: string;
  showHeader?: boolean;
  compact?: boolean;
}

export default function RealTimeWorkflowMonitor({ 
  workflowId, 
  showHeader = true, 
  compact = false 
}: RealTimeWorkflowMonitorProps) {
  const [notifications, setNotifications] = useState<Array<{ id: string; message: string; type: string; timestamp: string }>>([]);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  const {
    isConnected,
    workflowState,
    lastUpdate,
    connectionStatus,
    subscribe,
    requestState,
    requestStepProgress,
    reconnect
  } = useWorkflowWebSocket({
    workflowId,
    onUpdate: (update) => {
      // Show toast notification for important updates
      if (update.type === 'step_updated' && update.status === 'completed') {
        toast.success(`Step "${update.step_name}" completed!`);
      } else if (update.type === 'step_updated' && update.status === 'failed') {
        toast.error(`Step "${update.step_name}" failed!`);
      }

      // Add to notifications list
      const notification = {
        id: Date.now().toString(),
        message: `${update.step_name || 'Workflow'} ${update.status || 'updated'}`,
        type: update.type,
        timestamp: update.timestamp || new Date().toISOString()
      };
      setNotifications(prev => [notification, ...prev.slice(0, 19)]); // Keep last 20
    },
    onStateChange: (state) => {
      console.log('Workflow state updated:', state);
    },
    onStepProgress: (stepData) => {
      console.log('Step progress updated:', stepData);
    },
    onQualityUpdate: (qualityData) => {
      toast.info(`Quality check completed: ${qualityData.score}%`);
    },
    onNotification: (notification) => {
      toast.info(notification.message);
    },
    onError: (error) => {
      console.error('WebSocket error:', error);
      toast.error('Connection error occurred');
    },
    onConnect: () => {
      toast.success('Connected to live updates');
    },
    onDisconnect: () => {
      toast.warning('Disconnected from live updates');
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'skipped': return 'bg-yellow-100 text-yellow-800';
      case 'waiting_approval': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'in_progress': return <Play className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'failed': return <AlertCircle className="w-4 h-4" />;
      case 'waiting_approval': return <Pause className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-500';
      case 'connecting': return 'text-yellow-500';
      case 'error': return 'text-red-500';
      case 'disconnected': return 'text-gray-500';
      default: return 'text-gray-500';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleStepClick = (stepId: string) => {
    setSelectedStepId(stepId);
    subscribe(stepId);
    requestStepProgress(stepId);
  };

  if (!workflowState && connectionStatus !== 'connecting') {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="text-gray-500">
            {connectionStatus === 'error' ? 'Failed to load workflow' : 'Loading workflow...'}
          </div>
          {connectionStatus === 'error' && (
            <Button onClick={reconnect} className="mt-2">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <Card className="border-l-4 border-l-blue-500">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="font-medium text-sm">{workflowState?.name}</div>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={getStatusColor(workflowState?.status || '')} variant="secondary">
                  {workflowState?.status}
                </Badge>
                <div className="text-xs text-gray-500">
                  {workflowState?.steps?.filter(s => s.status === 'completed').length || 0} / {workflowState?.steps?.length || 0} steps
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-xs">
                {isConnected ? (
                  <Wifi className={`w-3 h-3 ${getConnectionStatusColor()}`} />
                ) : (
                  <WifiOff className={`w-3 h-3 ${getConnectionStatusColor()}`} />
                )}
                <span>Live</span>
              </div>
              <Progress 
                value={workflowState?.progress_percentage || 0} 
                className="w-20 h-2 mt-1" 
              />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      {showHeader && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Real-time Workflow Monitor
                </CardTitle>
                <p className="text-gray-600 mt-1">
                  Live updates for {workflowState?.name}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <div className={`flex items-center gap-1 text-sm ${getConnectionStatusColor()}`}>
                        {isConnected ? (
                          <Wifi className="w-4 h-4" />
                        ) : (
                          <WifiOff className="w-4 h-4" />
                        )}
                        <span className="capitalize">{connectionStatus}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      WebSocket connection status
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Button variant="outline" size="sm" onClick={reconnect}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Workflow Overview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Workflow Status Card */}
          <Card>
            <CardHeader>
              <CardTitle>Workflow Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{workflowState?.name}</div>
                  <div className="text-sm text-gray-600">{workflowState?.template_name}</div>
                </div>
                <Badge className={getStatusColor(workflowState?.status || '')} variant="secondary">
                  {getStatusIcon(workflowState?.status || '')}
                  <span className="ml-1 capitalize">{workflowState?.status?.replace('_', ' ')}</span>
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span>Progress</span>
                  <span>{workflowState?.progress_percentage || 0}%</span>
                </div>
                <Progress value={workflowState?.progress_percentage || 0} className="h-3" />
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-600">Assigned To</div>
                  {workflowState?.assigned_to ? (
                    <div className="flex items-center gap-2 mt-1">
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="text-xs">
                          {workflowState.assigned_to.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <span>{workflowState.assigned_to.name}</span>
                    </div>
                  ) : (
                    <span className="text-gray-500">Unassigned</span>
                  )}
                </div>
                <div>
                  <div className="text-gray-600">Due Date</div>
                  <div className="flex items-center gap-1 mt-1">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>{workflowState?.due_date ? formatDate(workflowState.due_date) : 'Not set'}</span>
                  </div>
                </div>
              </div>

              {workflowState?.quality_score && (
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">Quality Score: {workflowState.quality_score}%</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Workflow Steps */}
          <Card>
            <CardHeader>
              <CardTitle>Workflow Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {workflowState?.steps?.map((step, index) => (
                  <div
                    key={step.id}
                    className={`flex items-center gap-4 p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedStepId === step.id ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleStepClick(step.id)}
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-gray-300">
                      {step.status === 'completed' ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : step.status === 'in_progress' ? (
                        <Play className="w-5 h-5 text-blue-500" />
                      ) : step.status === 'failed' ? (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      ) : (
                        <span className="text-xs font-medium">{index + 1}</span>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{step.name}</div>
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

                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Side Panel */}
        <div className="space-y-6">
          {/* Live Updates */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Live Updates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <div key={notification.id} className="text-sm p-2 bg-gray-50 rounded">
                      <div className="font-medium">{notification.message}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {formatTime(notification.timestamp)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500 text-center py-4">
                    No recent updates
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Steps</span>
                <span className="font-medium">{workflowState?.steps?.length || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Completed</span>
                <span className="font-medium text-green-600">
                  {workflowState?.steps?.filter(s => s.status === 'completed').length || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">In Progress</span>
                <span className="font-medium text-blue-600">
                  {workflowState?.steps?.filter(s => s.status === 'in_progress').length || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Pending</span>
                <span className="font-medium text-gray-600">
                  {workflowState?.steps?.filter(s => s.status === 'pending').length || 0}
                </span>
              </div>
              {lastUpdate && (
                <div className="pt-2 border-t">
                  <div className="text-xs text-gray-500">Last Update</div>
                  <div className="text-sm font-medium">
                    {formatTime(lastUpdate.timestamp || new Date().toISOString())}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}