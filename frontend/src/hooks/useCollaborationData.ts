/**
 * Collaboration data hooks
 * React hooks for threads, comments, notifications, activities, and sharing
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  collaborationApi,
  CommentThread,
  Comment,
  CollabNotification,
  Activity,
  SharedResource,
  Mention,
} from '@/services/collaborationApi';

// ==================== Hook for Comment Threads ====================

export function useCommentThreads(contentType: string, objectId: string) {
  const [threads, setThreads] = useState<CommentThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchThreads = useCallback(async () => {
    if (!contentType || !objectId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const response = await collaborationApi.getThreadsForResource(contentType, objectId);
      if (response.success && response.data) {
        const data = response.data;
        if (Array.isArray(data)) {
          setThreads(data);
        } else {
          setThreads(data.results ?? []);
        }
      } else {
        setError(response.error || 'Failed to fetch threads');
        setThreads([]);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch threads';
      setError(message);
      console.error('Threads fetch error:', err);
      setThreads([]);
    } finally {
      setLoading(false);
    }
  }, [contentType, objectId]);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  const createThread = useCallback(async (title?: string) => {
    try {
      const response = await collaborationApi.createThread({
        content_type: contentType,
        object_id: objectId,
        title,
      });
      if (response.success && response.data) {
        setThreads(prev => [response.data!, ...prev]);
        toast.success('Thread created');
        return response.data;
      }
      throw new Error(response.error || 'Failed to create thread');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create thread';
      toast.error(message);
      throw err;
    }
  }, [contentType, objectId]);

  const resolveThread = useCallback(async (id: string) => {
    try {
      const response = await collaborationApi.resolveThread(id);
      if (response.success && response.data) {
        setThreads(prev => prev.map(t => t.id === id ? response.data! : t));
        toast.success('Thread resolved');
        return response.data;
      }
      throw new Error(response.error || 'Failed to resolve thread');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to resolve thread';
      toast.error(message);
      throw err;
    }
  }, []);

  const reopenThread = useCallback(async (id: string) => {
    try {
      const response = await collaborationApi.reopenThread(id);
      if (response.success && response.data) {
        setThreads(prev => prev.map(t => t.id === id ? response.data! : t));
        toast.success('Thread reopened');
        return response.data;
      }
      throw new Error(response.error || 'Failed to reopen thread');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reopen thread';
      toast.error(message);
      throw err;
    }
  }, []);

  return {
    threads,
    loading,
    error,
    refresh: fetchThreads,
    createThread,
    resolveThread,
    reopenThread,
  };
}

// ==================== Hook for Comments ====================

export function useComments(threadId: string) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    if (!threadId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const response = await collaborationApi.getComments({ thread: threadId });
      if (response.success && response.data) {
        const data = response.data;
        if (Array.isArray(data)) {
          setComments(data);
        } else {
          setComments(data.results ?? []);
        }
      } else {
        setError(response.error || 'Failed to fetch comments');
        setComments([]);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch comments';
      setError(message);
      console.error('Comments fetch error:', err);
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [threadId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const createComment = useCallback(async (text: string, parentId?: string, mentionUserIds?: string[]) => {
    try {
      const response = await collaborationApi.createComment({
        thread: threadId,
        text,
        parent: parentId,
        mention_user_ids: mentionUserIds,
      });
      if (response.success && response.data) {
        setComments(prev => [...prev, response.data!]);
        return response.data;
      }
      throw new Error(response.error || 'Failed to create comment');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create comment';
      toast.error(message);
      throw err;
    }
  }, [threadId]);

  const updateComment = useCallback(async (id: string, text: string) => {
    try {
      const response = await collaborationApi.updateComment(id, { text });
      if (response.success && response.data) {
        setComments(prev => prev.map(c => c.id === id ? response.data! : c));
        toast.success('Comment updated');
        return response.data;
      }
      throw new Error(response.error || 'Failed to update comment');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update comment';
      toast.error(message);
      throw err;
    }
  }, []);

  const deleteComment = useCallback(async (id: string) => {
    try {
      const response = await collaborationApi.deleteComment(id);
      if (response.success) {
        setComments(prev => prev.filter(c => c.id !== id));
        toast.success('Comment deleted');
      } else {
        throw new Error(response.error || 'Failed to delete comment');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete comment';
      toast.error(message);
      throw err;
    }
  }, []);

  const reactToComment = useCallback(async (commentId: string, reactionType: string) => {
    try {
      const response = await collaborationApi.reactToComment(commentId, reactionType);
      if (response.success) {
        // Re-fetch comments to get updated reaction data
        await fetchComments();
      } else {
        throw new Error(response.error || 'Failed to react');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to react';
      toast.error(message);
      throw err;
    }
  }, [fetchComments]);

  return {
    comments,
    loading,
    error,
    refresh: fetchComments,
    createComment,
    updateComment,
    deleteComment,
    reactToComment,
  };
}

// ==================== Hook for Notifications ====================

export function useNotifications() {
  const [notifications, setNotifications] = useState<CollabNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [notifResponse, countResponse] = await Promise.all([
        collaborationApi.getNotifications(),
        collaborationApi.getUnreadCount(),
      ]);

      if (notifResponse.success && notifResponse.data) {
        const data = notifResponse.data;
        if (Array.isArray(data)) {
          setNotifications(data);
        } else {
          setNotifications(data.results ?? []);
        }
      } else {
        setNotifications([]);
      }

      if (countResponse.success && countResponse.data) {
        setUnreadCount(countResponse.data.count);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch notifications';
      setError(message);
      console.error('Notifications fetch error:', err);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markRead = useCallback(async (id: string) => {
    try {
      const response = await collaborationApi.markNotificationRead(id);
      if (response.success) {
        setNotifications(prev =>
          prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      const response = await collaborationApi.markAllRead();
      if (response.success) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
        toast.success('All notifications marked as read');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to mark all as read';
      toast.error(message);
    }
  }, []);

  const dismiss = useCallback(async (id: string) => {
    try {
      const response = await collaborationApi.dismissNotification(id);
      if (response.success) {
        const removed = notifications.find(n => n.id === id);
        setNotifications(prev => prev.filter(n => n.id !== id));
        if (removed && !removed.is_read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (err) {
      console.error('Failed to dismiss notification:', err);
    }
  }, [notifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markRead,
    markAllRead,
    dismiss,
    refresh: fetchNotifications,
  };
}

// ==================== Hook for Activity Feed ====================

export function useActivityFeed(scope: 'all' | 'mine' | 'team' = 'all') {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let response;
      switch (scope) {
        case 'mine':
          response = await collaborationApi.getMyActivity();
          break;
        case 'team':
          response = await collaborationApi.getTeamActivity();
          break;
        default:
          response = await collaborationApi.getActivities();
      }

      if (response.success && response.data) {
        const data = response.data;
        if (Array.isArray(data)) {
          setActivities(data);
        } else {
          setActivities(data.results ?? []);
        }
      } else {
        setActivities([]);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch activities';
      setError(message);
      console.error('Activities fetch error:', err);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  }, [scope]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  return {
    activities,
    loading,
    error,
    refresh: fetchActivities,
  };
}

// ==================== Hook for Shared Resources ====================

export function useSharedResources() {
  const [sharedByMe, setSharedByMe] = useState<SharedResource[]>([]);
  const [sharedWithMe, setSharedWithMe] = useState<SharedResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSharedResources = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [byMeResponse, withMeResponse] = await Promise.all([
        collaborationApi.getSharedResources(),
        collaborationApi.getSharedWithMe(),
      ]);

      if (byMeResponse.success && byMeResponse.data) {
        const data = byMeResponse.data;
        if (Array.isArray(data)) {
          setSharedByMe(data);
        } else {
          setSharedByMe(data.results ?? []);
        }
      } else {
        setSharedByMe([]);
      }

      if (withMeResponse.success && withMeResponse.data) {
        const data = withMeResponse.data;
        if (Array.isArray(data)) {
          setSharedWithMe(data);
        } else {
          setSharedWithMe(data.results ?? []);
        }
      } else {
        setSharedWithMe([]);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch shared resources';
      setError(message);
      console.error('Shared resources fetch error:', err);
      setSharedByMe([]);
      setSharedWithMe([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSharedResources();
  }, [fetchSharedResources]);

  const share = useCallback(async (data: {
    content_type: string;
    object_id: string;
    shared_with: string;
    permission_level: string;
    message?: string;
  }) => {
    try {
      const response = await collaborationApi.shareResource(data);
      if (response.success && response.data) {
        setSharedByMe(prev => [response.data!, ...prev]);
        toast.success('Resource shared successfully');
        return response.data;
      }
      throw new Error(response.error || 'Failed to share resource');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to share resource';
      toast.error(message);
      throw err;
    }
  }, []);

  const accept = useCallback(async (id: string) => {
    try {
      const response = await collaborationApi.acceptShare(id);
      if (response.success && response.data) {
        setSharedWithMe(prev =>
          prev.map(s => (s.id === id ? { ...s, status: 'accepted' as const } : s))
        );
        toast.success('Share accepted');
        return response.data;
      }
      throw new Error(response.error || 'Failed to accept share');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to accept share';
      toast.error(message);
      throw err;
    }
  }, []);

  const revoke = useCallback(async (id: string) => {
    try {
      const response = await collaborationApi.revokeShare(id);
      if (response.success) {
        setSharedByMe(prev =>
          prev.map(s => (s.id === id ? { ...s, status: 'revoked' as const } : s))
        );
        toast.success('Share revoked');
      } else {
        throw new Error(response.error || 'Failed to revoke share');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to revoke share';
      toast.error(message);
      throw err;
    }
  }, []);

  return {
    sharedByMe,
    sharedWithMe,
    loading,
    error,
    refresh: fetchSharedResources,
    share,
    accept,
    revoke,
  };
}

// ==================== Hook for Mentions ====================

export function useMentions() {
  const [mentions, setMentions] = useState<Mention[]>([]);
  const [unreadMentions, setUnreadMentions] = useState<Mention[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMentions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [allResponse, unreadResponse] = await Promise.all([
        collaborationApi.getMentions(),
        collaborationApi.getUnreadMentions(),
      ]);

      if (allResponse.success && allResponse.data) {
        const data = allResponse.data;
        if (Array.isArray(data)) {
          setMentions(data);
        } else {
          setMentions(data.results ?? []);
        }
      } else {
        setMentions([]);
      }

      if (unreadResponse.success && unreadResponse.data) {
        const data = unreadResponse.data;
        if (Array.isArray(data)) {
          setUnreadMentions(data);
        } else {
          setUnreadMentions(data.results ?? []);
        }
      } else {
        setUnreadMentions([]);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch mentions';
      setError(message);
      console.error('Mentions fetch error:', err);
      setMentions([]);
      setUnreadMentions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMentions();
  }, [fetchMentions]);

  return {
    mentions,
    unreadMentions,
    loading,
    error,
    refresh: fetchMentions,
  };
}
