'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface WorkflowUpdate {
  type: 'step_updated' | 'workflow_state' | 'quality_update' | 'notification';
  workflow_id?: string;
  step_id?: string;
  step_name?: string;
  status?: string;
  progress?: number;
  data?: any;
  timestamp?: string;
}

interface WorkflowState {
  id: string;
  name: string;
  status: string;
  priority: string;
  progress_percentage: number;
  current_step_order: number;
  quality_score?: number;
  assigned_to?: {
    id: string;
    name: string;
  };
  start_date?: string;
  due_date?: string;
  completed_date?: string;
  template_name: string;
  steps: WorkflowStep[];
  updated_at: string;
}

interface WorkflowStep {
  id: string;
  name: string;
  status: string;
  order: number;
  assigned_to?: {
    id: string;
    name: string;
  };
  start_date?: string;
  due_date?: string;
  completed_date?: string;
  quality_score?: number;
}

interface UseWorkflowWebSocketOptions {
  workflowId: string;
  onUpdate?: (update: WorkflowUpdate) => void;
  onStateChange?: (state: WorkflowState) => void;
  onStepProgress?: (stepData: any) => void;
  onQualityUpdate?: (qualityData: any) => void;
  onNotification?: (notification: any) => void;
  onError?: (error: Event) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  autoReconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

interface UseWorkflowWebSocketReturn {
  isConnected: boolean;
  workflowState: WorkflowState | null;
  lastUpdate: WorkflowUpdate | null;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  subscribe: (stepId: string) => void;
  requestState: () => void;
  requestStepProgress: (stepId: string) => void;
  sendMessage: (message: any) => void;
  reconnect: () => void;
}

export function useWorkflowWebSocket(options: UseWorkflowWebSocketOptions): UseWorkflowWebSocketReturn {
  const {
    workflowId,
    onUpdate,
    onStateChange,
    onStepProgress,
    onQualityUpdate,
    onNotification,
    onError,
    onConnect,
    onDisconnect,
    autoReconnect = true,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [workflowState, setWorkflowState] = useState<WorkflowState | null>(null);
  const [lastUpdate, setLastUpdate] = useState<WorkflowUpdate | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptRef = useRef(0);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get WebSocket URL (in production, this would come from config)
  const getWebSocketUrl = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}/ws/workflows/${workflowId}/`;
  }, [workflowId]);

  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setConnectionStatus('connecting');
    cleanup();

    try {
      const wsUrl = getWebSocketUrl();
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        setIsConnected(true);
        setConnectionStatus('connected');
        reconnectAttemptRef.current = 0;
        onConnect?.();

        // Start ping interval to keep connection alive
        pingIntervalRef.current = setInterval(() => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000); // Ping every 30 seconds

        // Request initial workflow state
        wsRef.current?.send(JSON.stringify({ type: 'request_workflow_state' }));
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          switch (message.type) {
            case 'workflow_update':
              const update: WorkflowUpdate = {
                type: message.data.type || 'step_updated',
                workflow_id: message.workflow_id,
                step_id: message.data.step_id,
                step_name: message.data.step_name,
                status: message.data.status,
                progress: message.data.progress,
                data: message.data,
                timestamp: message.data.timestamp
              };
              setLastUpdate(update);
              onUpdate?.(update);
              break;

            case 'workflow_state':
              const state: WorkflowState = message.data;
              setWorkflowState(state);
              onStateChange?.(state);
              break;

            case 'step_progress':
              onStepProgress?.(message.data);
              break;

            case 'quality_update':
              onQualityUpdate?.(message.data);
              break;

            case 'notification':
              onNotification?.(message.data);
              break;

            case 'step_update':
              // Update specific step in workflow state
              if (workflowState && message.data.id) {
                const updatedState = {
                  ...workflowState,
                  steps: workflowState.steps.map(step =>
                    step.id === message.data.id
                      ? { ...step, ...message.data }
                      : step
                  ),
                  updated_at: message.data.updated_at || workflowState.updated_at
                };
                setWorkflowState(updatedState);
                onStateChange?.(updatedState);
              }
              break;

            case 'pong':
              // Connection is alive
              break;

            default:
              console.log('Unknown message type:', message.type);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onerror = (event) => {
        setConnectionStatus('error');
        onError?.(event);
      };

      wsRef.current.onclose = (event) => {
        setIsConnected(false);
        setConnectionStatus('disconnected');
        cleanup();
        onDisconnect?.();

        // Auto-reconnect if enabled
        if (autoReconnect && reconnectAttemptRef.current < maxReconnectAttempts) {
          reconnectAttemptRef.current += 1;
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };

    } catch (error) {
      setConnectionStatus('error');
      console.error('Error creating WebSocket connection:', error);
    }
  }, [
    getWebSocketUrl,
    onConnect,
    onUpdate,
    onStateChange,
    onStepProgress,
    onQualityUpdate,
    onNotification,
    onError,
    onDisconnect,
    autoReconnect,
    maxReconnectAttempts,
    reconnectInterval,
    cleanup,
    workflowState
  ]);

  const disconnect = useCallback(() => {
    cleanup();
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    setConnectionStatus('disconnected');
  }, [cleanup]);

  const reconnect = useCallback(() => {
    disconnect();
    reconnectAttemptRef.current = 0;
    connect();
  }, [disconnect, connect]);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  const subscribe = useCallback((stepId: string) => {
    sendMessage({
      type: 'subscribe_to_step',
      step_id: stepId
    });
  }, [sendMessage]);

  const requestState = useCallback(() => {
    sendMessage({
      type: 'request_workflow_state'
    });
  }, [sendMessage]);

  const requestStepProgress = useCallback((stepId: string) => {
    sendMessage({
      type: 'request_step_progress',
      step_id: stepId
    });
  }, [sendMessage]);

  // Connect on mount and disconnect on unmount
  useEffect(() => {
    connect();
    return disconnect;
  }, [workflowId]); // Reconnect if workflowId changes

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    workflowState,
    lastUpdate,
    connectionStatus,
    subscribe,
    requestState,
    requestStepProgress,
    sendMessage,
    reconnect
  };
}

// Hook for workflow analytics WebSocket
interface UseWorkflowAnalyticsWebSocketOptions {
  onAnalyticsUpdate?: (data: any) => void;
  onMetricsUpdate?: (data: any) => void;
  onError?: (error: Event) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

interface UseWorkflowAnalyticsWebSocketReturn {
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  requestAnalytics: () => void;
  requestMetrics: () => void;
}

export function useWorkflowAnalyticsWebSocket(options: UseWorkflowAnalyticsWebSocketOptions): UseWorkflowAnalyticsWebSocketReturn {
  const {
    onAnalyticsUpdate,
    onMetricsUpdate,
    onError,
    onConnect,
    onDisconnect
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  
  const wsRef = useRef<WebSocket | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const getWebSocketUrl = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}/ws/workflows/analytics/`;
  }, []);

  const cleanup = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setConnectionStatus('connecting');
    cleanup();

    try {
      const wsUrl = getWebSocketUrl();
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        setIsConnected(true);
        setConnectionStatus('connected');
        onConnect?.();

        // Start ping interval
        pingIntervalRef.current = setInterval(() => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000);

        // Request initial analytics data
        wsRef.current?.send(JSON.stringify({ type: 'request_analytics' }));
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          switch (message.type) {
            case 'analytics_update':
            case 'analytics_data':
              onAnalyticsUpdate?.(message.data);
              break;

            case 'metrics_update':
            case 'realtime_metrics':
              onMetricsUpdate?.(message.data);
              break;

            case 'pong':
              // Connection is alive
              break;
          }
        } catch (error) {
          console.error('Error parsing analytics WebSocket message:', error);
        }
      };

      wsRef.current.onerror = (event) => {
        setConnectionStatus('error');
        onError?.(event);
      };

      wsRef.current.onclose = () => {
        setIsConnected(false);
        setConnectionStatus('disconnected');
        cleanup();
        onDisconnect?.();
      };

    } catch (error) {
      setConnectionStatus('error');
      console.error('Error creating analytics WebSocket connection:', error);
    }
  }, [getWebSocketUrl, onConnect, onAnalyticsUpdate, onMetricsUpdate, onError, onDisconnect, cleanup]);

  const disconnect = useCallback(() => {
    cleanup();
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    setConnectionStatus('disconnected');
  }, [cleanup]);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  const requestAnalytics = useCallback(() => {
    sendMessage({ type: 'request_analytics' });
  }, [sendMessage]);

  const requestMetrics = useCallback(() => {
    sendMessage({ type: 'request_metrics' });
  }, [sendMessage]);

  useEffect(() => {
    connect();
    return disconnect;
  }, []);

  return {
    isConnected,
    connectionStatus,
    requestAnalytics,
    requestMetrics
  };
}