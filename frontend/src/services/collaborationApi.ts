/**
 * Collaboration API Service
 * Handles all collaboration-related API calls: threads, comments, notifications, activities, sharing, mentions
 */

import { ApiClient, ApiResponse } from './apiClient';

// Types
export interface CommentThread {
  id: string;
  content_type: string;
  object_id: string;
  title: string;
  is_resolved: boolean;
  resolved_by?: { id: string; full_name: string } | null;
  resolved_at?: string | null;
  created_by: { id: string; full_name: string; email: string };
  comment_count: number;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  thread: string;
  parent?: string | null;
  text: string;
  author: string;
  author_name: string;
  author_email: string;
  author_avatar?: string | null;
  is_edited: boolean;
  attachments: any[];
  mentions: Mention[];
  reactions: Reaction[];
  reply_count: number;
  reaction_summary: Record<string, number>;
  created_at: string;
  updated_at: string;
}

export interface Reaction {
  id: string;
  user: string;
  user_name: string;
  reaction_type: string;
  created_at: string;
}

export interface CollabNotification {
  id: string;
  notification_type: string;
  title: string;
  message: string;
  is_read: boolean;
  priority: string;
  action_url?: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface Activity {
  id: string;
  user: { id: string; full_name: string };
  activity_type: string;
  description: string;
  content_type?: string;
  object_id?: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface SharedResource {
  id: string;
  content_type: string;
  object_id: string;
  shared_by: { id: string; full_name: string; email: string };
  shared_with: { id: string; full_name: string; email: string };
  permission_level: 'view' | 'comment' | 'edit';
  status: 'pending' | 'accepted' | 'revoked';
  message: string;
  created_at: string;
}

export interface Mention {
  id: string;
  mentioned_user: string;
  mentioned_user_name: string;
  mentioned_user_email: string;
  is_read: boolean;
  read_at?: string | null;
  created_at: string;
}

// Paginated response
export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

class CollaborationApiService extends ApiClient {
  // Threads
  async getThreads(params?: Record<string, any>): Promise<ApiResponse<Paginated<CommentThread>>> {
    return this.get('/collaboration/threads/', { params });
  }

  async getThread(id: string): Promise<ApiResponse<CommentThread>> {
    return this.get(`/collaboration/threads/${id}/`);
  }

  async createThread(data: { content_type: string; object_id: string; title?: string }): Promise<ApiResponse<CommentThread>> {
    return this.post('/collaboration/threads/', data);
  }

  async resolveThread(id: string): Promise<ApiResponse<CommentThread>> {
    return this.post(`/collaboration/threads/${id}/resolve/`);
  }

  async reopenThread(id: string): Promise<ApiResponse<CommentThread>> {
    return this.post(`/collaboration/threads/${id}/reopen/`);
  }

  async getThreadsForResource(contentType: string, objectId: string): Promise<ApiResponse<Paginated<CommentThread>>> {
    return this.get('/collaboration/threads/', { params: { content_type: contentType, object_id: objectId } });
  }

  // Comments
  async getComments(params?: Record<string, any>): Promise<ApiResponse<Paginated<Comment>>> {
    return this.get('/collaboration/comments/', { params });
  }

  async createComment(data: { thread: string; text: string; parent?: string; mention_user_ids?: string[] }): Promise<ApiResponse<Comment>> {
    return this.post('/collaboration/comments/', data);
  }

  async updateComment(id: string, data: { text: string }): Promise<ApiResponse<Comment>> {
    return this.patch(`/collaboration/comments/${id}/`, data);
  }

  async deleteComment(id: string): Promise<ApiResponse<void>> {
    return this.delete(`/collaboration/comments/${id}/`);
  }

  async reactToComment(commentId: string, reactionType: string): Promise<ApiResponse<Reaction>> {
    return this.post(`/collaboration/comments/${commentId}/react/`, { reaction_type: reactionType });
  }

  // Notifications
  async getNotifications(params?: Record<string, any>): Promise<ApiResponse<Paginated<CollabNotification>>> {
    return this.get('/collaboration/notifications/', { params });
  }

  async getUnreadCount(): Promise<ApiResponse<{ count: number }>> {
    return this.get('/collaboration/notifications/unread_count/');
  }

  async markNotificationRead(id: string): Promise<ApiResponse<void>> {
    return this.post(`/collaboration/notifications/${id}/mark_read/`);
  }

  async markAllRead(): Promise<ApiResponse<void>> {
    return this.post('/collaboration/notifications/mark_all_read/');
  }

  async dismissNotification(id: string): Promise<ApiResponse<void>> {
    return this.post(`/collaboration/notifications/${id}/dismiss/`);
  }

  // Activities
  async getActivities(params?: Record<string, any>): Promise<ApiResponse<Paginated<Activity>>> {
    return this.get('/collaboration/activities/', { params });
  }

  async getMyActivity(): Promise<ApiResponse<Paginated<Activity>>> {
    return this.get('/collaboration/activities/my_activity/');
  }

  async getTeamActivity(): Promise<ApiResponse<Paginated<Activity>>> {
    return this.get('/collaboration/activities/team_activity/');
  }

  // Shared Resources
  async getSharedResources(params?: Record<string, any>): Promise<ApiResponse<Paginated<SharedResource>>> {
    return this.get('/collaboration/shared/', { params });
  }

  async getSharedWithMe(): Promise<ApiResponse<Paginated<SharedResource>>> {
    return this.get('/collaboration/shared/shared_with_me/');
  }

  async shareResource(data: { content_type: string; object_id: string; shared_with: string; permission_level: string; message?: string }): Promise<ApiResponse<SharedResource>> {
    return this.post('/collaboration/shared/', data);
  }

  async acceptShare(id: string): Promise<ApiResponse<SharedResource>> {
    return this.post(`/collaboration/shared/${id}/accept/`);
  }

  async revokeShare(id: string): Promise<ApiResponse<void>> {
    return this.post(`/collaboration/shared/${id}/revoke/`);
  }

  // Mentions
  async getMentions(params?: Record<string, any>): Promise<ApiResponse<Paginated<Mention>>> {
    return this.get('/collaboration/mentions/', { params });
  }

  async getUnreadMentions(): Promise<ApiResponse<Paginated<Mention>>> {
    return this.get('/collaboration/mentions/unread/');
  }
}

export const collaborationApi = new CollaborationApiService();
