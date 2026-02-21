/**
 * Collaboration WebSocket hooks
 * Real-time updates for notifications and comment threads
 */

'use client';

import { useEffect, useCallback } from 'react';
import { useWebSocket, WebSocketMessage } from './useWebSocket';

// ==================== Notification WebSocket ====================

interface NotificationWSCallbacks {
  onNewNotification?: (data: any) => void;
  onUnreadCountUpdate?: (count: number) => void;
}

export function useNotificationWebSocket(callbacks?: NotificationWSCallbacks) {
  const baseUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';
  const url = `${baseUrl}/ws/notifications/`;
  const { isConnected, lastMessage, error } = useWebSocket(url, true);

  useEffect(() => {
    if (!lastMessage) return;

    switch (lastMessage.type) {
      case 'new_notification':
        callbacks?.onNewNotification?.(lastMessage.data);
        break;
      case 'unread_count':
        callbacks?.onUnreadCountUpdate?.(lastMessage.data?.count ?? 0);
        break;
      default:
        break;
    }
  }, [lastMessage, callbacks]);

  return {
    isConnected,
    error,
  };
}

// ==================== Comment Thread WebSocket ====================

interface CommentThreadWSCallbacks {
  onNewComment?: (data: any) => void;
  onCommentEdited?: (data: any) => void;
  onCommentDeleted?: (data: { comment_id: string }) => void;
  onReaction?: (data: any) => void;
  onThreadResolved?: (data: any) => void;
  onThreadReopened?: (data: any) => void;
}

export function useCommentThreadWebSocket(
  threadId: string,
  callbacks?: CommentThreadWSCallbacks
) {
  const baseUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';
  const url = threadId ? `${baseUrl}/ws/comments/${threadId}/` : '';
  const { isConnected, lastMessage, sendMessage, error } = useWebSocket(
    url,
    !!threadId
  );

  useEffect(() => {
    if (!lastMessage) return;

    switch (lastMessage.type) {
      case 'new_comment':
        callbacks?.onNewComment?.(lastMessage.data);
        break;
      case 'comment_edited':
        callbacks?.onCommentEdited?.(lastMessage.data);
        break;
      case 'comment_deleted':
        callbacks?.onCommentDeleted?.(lastMessage.data);
        break;
      case 'reaction':
        callbacks?.onReaction?.(lastMessage.data);
        break;
      case 'thread_resolved':
        callbacks?.onThreadResolved?.(lastMessage.data);
        break;
      case 'thread_reopened':
        callbacks?.onThreadReopened?.(lastMessage.data);
        break;
      default:
        break;
    }
  }, [lastMessage, callbacks]);

  const sendTyping = useCallback(() => {
    sendMessage({ type: 'typing' });
  }, [sendMessage]);

  return {
    isConnected,
    error,
    sendTyping,
  };
}
