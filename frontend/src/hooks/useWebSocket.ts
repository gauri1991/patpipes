/**
 * WebSocket hook for real-time pipeline updates
 */

import { useEffect, useRef, useState } from 'react';

export interface WebSocketMessage {
  type: string;
  data: any;
}

export interface WebSocketHook {
  socket: WebSocket | null;
  isConnected: boolean;
  lastMessage: WebSocketMessage | null;
  sendMessage: (message: any) => void;
  error: string | null;
}

export function useWebSocket(url: string, shouldConnect: boolean = true): WebSocketHook {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (!shouldConnect || !url) {
      return;
    }

    let ws: WebSocket;

    const connect = () => {
      try {
        // Convert HTTP URL to WebSocket URL
        const wsUrl = url.replace(/^http/, 'ws');
        ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onopen = () => {
          console.log('WebSocket connected:', wsUrl);
          setIsConnected(true);
          setError(null);
          
          // Clear any pending reconnect
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = undefined;
          }
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            setLastMessage(message);
          } catch (err) {
            console.error('Failed to parse WebSocket message:', err);
          }
        };

        ws.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason);
          setIsConnected(false);
          socketRef.current = null;
          
          // Auto-reconnect after delay (unless manually closed)
          if (event.code !== 1000 && shouldConnect) {
            reconnectTimeoutRef.current = setTimeout(() => {
              console.log('Attempting to reconnect WebSocket...');
              connect();
            }, 3000);
          }
        };

        ws.onerror = (event) => {
          console.error('WebSocket error:', event);
          setError('WebSocket connection failed');
        };

      } catch (err) {
        console.error('Failed to create WebSocket:', err);
        setError('Failed to create WebSocket connection');
      }
    };

    connect();

    return () => {
      // Cleanup
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close(1000, 'Component unmounted');
      }
    };
  }, [url, shouldConnect]);

  const sendMessage = (message: any) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      try {
        socketRef.current.send(JSON.stringify(message));
      } catch (err) {
        console.error('Failed to send WebSocket message:', err);
      }
    } else {
      console.warn('WebSocket is not connected');
    }
  };

  return {
    socket: socketRef.current,
    isConnected,
    lastMessage,
    sendMessage,
    error
  };
}

export function usePipelineWebSocket(pipelineId: string, token?: string) {
  const baseUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';
  const url = token 
    ? `${baseUrl}/ws/analytics/pipeline/${pipelineId}/?token=${token}`
    : `${baseUrl}/ws/analytics/pipeline/${pipelineId}/`;
  return useWebSocket(url, !!pipelineId);
}