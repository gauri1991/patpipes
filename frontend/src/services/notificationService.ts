/**
 * Notification Service
 * Handles in-app notifications and workflow event alerts
 */

import { toast } from 'sonner';

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  category: 'workflow' | 'system' | 'report' | 'template' | 'general';
  priority: 'low' | 'medium' | 'high';
  relatedId?: string; // ID of related report, template, etc.
}

export interface WorkflowEvent {
  eventType: 'report_submitted' | 'report_approved' | 'report_rejected' | 'changes_requested' | 'comment_added' | 'review_assigned';
  reportId: string;
  reportName: string;
  userId: string;
  userName: string;
  userRole: string;
  message?: string;
  timestamp: string;
}

class NotificationService {
  private notifications: Notification[] = [];
  private subscribers: ((notifications: Notification[]) => void)[] = [];

  constructor() {
    // Initialize with some mock notifications
    this.notifications = [
      {
        id: '1',
        type: 'info',
        title: 'Report Review Assigned',
        message: 'You have been assigned to review "Q4 Patent Analysis"',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        read: false,
        actionUrl: '/dashboard/analytics/projects/123',
        actionLabel: 'Review Report',
        category: 'workflow',
        priority: 'medium',
        relatedId: 'report_1'
      },
      {
        id: '2',
        type: 'success',
        title: 'Template Created',
        message: 'Your new chart template "Competitive Analysis" has been published',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
        read: false,
        actionUrl: '/dashboard/analytics',
        actionLabel: 'View Template',
        category: 'template',
        priority: 'low',
        relatedId: 'template_123'
      },
      {
        id: '3',
        type: 'warning',
        title: 'Changes Requested',
        message: 'Your report "Technology Landscape" needs revisions before approval',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
        read: false,
        actionUrl: '/dashboard/analytics/projects/456',
        actionLabel: 'View Comments',
        category: 'workflow',
        priority: 'high',
        relatedId: 'report_2'
      }
    ];
  }

  // Subscribe to notification updates
  subscribe(callback: (notifications: Notification[]) => void) {
    this.subscribers.push(callback);
    callback(this.notifications); // Send current notifications immediately
    
    // Return unsubscribe function
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  // Notify all subscribers
  private notifySubscribers() {
    this.subscribers.forEach(callback => callback(this.notifications));
  }

  // Create notification from workflow event
  async createWorkflowNotification(event: WorkflowEvent): Promise<void> {
    let notification: Notification;

    switch (event.eventType) {
      case 'report_submitted':
        notification = {
          id: `notif_${Date.now()}`,
          type: 'info',
          title: 'Report Submitted for Review',
          message: `${event.userName} submitted "${event.reportName}" for review`,
          timestamp: event.timestamp,
          read: false,
          actionUrl: `/dashboard/analytics/projects/${event.reportId}`,
          actionLabel: 'Review Report',
          category: 'workflow',
          priority: 'medium',
          relatedId: event.reportId
        };
        break;

      case 'report_approved':
        notification = {
          id: `notif_${Date.now()}`,
          type: 'success',
          title: 'Report Approved',
          message: `Your report "${event.reportName}" has been approved by ${event.userName}`,
          timestamp: event.timestamp,
          read: false,
          actionUrl: `/dashboard/analytics/projects/${event.reportId}`,
          actionLabel: 'View Report',
          category: 'workflow',
          priority: 'medium',
          relatedId: event.reportId
        };
        break;

      case 'report_rejected':
        notification = {
          id: `notif_${Date.now()}`,
          type: 'error',
          title: 'Report Changes Required',
          message: `Your report "${event.reportName}" requires changes before approval`,
          timestamp: event.timestamp,
          read: false,
          actionUrl: `/dashboard/analytics/projects/${event.reportId}`,
          actionLabel: 'View Comments',
          category: 'workflow',
          priority: 'high',
          relatedId: event.reportId
        };
        break;

      case 'changes_requested':
        notification = {
          id: `notif_${Date.now()}`,
          type: 'warning',
          title: 'Changes Requested',
          message: `${event.userName} requested changes to "${event.reportName}"`,
          timestamp: event.timestamp,
          read: false,
          actionUrl: `/dashboard/analytics/projects/${event.reportId}`,
          actionLabel: 'Address Changes',
          category: 'workflow',
          priority: 'high',
          relatedId: event.reportId
        };
        break;

      case 'comment_added':
        notification = {
          id: `notif_${Date.now()}`,
          type: 'info',
          title: 'New Comment Added',
          message: `${event.userName} commented on "${event.reportName}"`,
          timestamp: event.timestamp,
          read: false,
          actionUrl: `/dashboard/analytics/projects/${event.reportId}`,
          actionLabel: 'View Comment',
          category: 'workflow',
          priority: 'low',
          relatedId: event.reportId
        };
        break;

      case 'review_assigned':
        notification = {
          id: `notif_${Date.now()}`,
          type: 'info',
          title: 'Review Assignment',
          message: `You have been assigned to review "${event.reportName}"`,
          timestamp: event.timestamp,
          read: false,
          actionUrl: `/dashboard/analytics/projects/${event.reportId}`,
          actionLabel: 'Start Review',
          category: 'workflow',
          priority: 'medium',
          relatedId: event.reportId
        };
        break;

      default:
        return;
    }

    // Add notification
    this.notifications.unshift(notification);
    
    // Keep only the latest 50 notifications
    if (this.notifications.length > 50) {
      this.notifications = this.notifications.slice(0, 50);
    }

    // Show toast notification for high priority items
    if (notification.priority === 'high') {
      toast.error(notification.title, {
        description: notification.message,
        action: notification.actionUrl ? {
          label: notification.actionLabel || 'View',
          onClick: () => window.location.href = notification.actionUrl!
        } : undefined
      });
    } else if (notification.priority === 'medium') {
      toast.info(notification.title, {
        description: notification.message,
        action: notification.actionUrl ? {
          label: notification.actionLabel || 'View',
          onClick: () => window.location.href = notification.actionUrl!
        } : undefined
      });
    }

    // Notify subscribers
    this.notifySubscribers();

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Get all notifications
  getNotifications(): Notification[] {
    return this.notifications;
  }

  // Get unread notifications
  getUnreadNotifications(): Notification[] {
    return this.notifications.filter(n => !n.read);
  }

  // Get notifications by category
  getNotificationsByCategory(category: Notification['category']): Notification[] {
    return this.notifications.filter(n => n.category === category);
  }

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<void> {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.notifySubscribers();
    }
  }

  // Mark all notifications as read
  async markAllAsRead(): Promise<void> {
    this.notifications.forEach(n => n.read = true);
    this.notifySubscribers();
  }

  // Delete notification
  async deleteNotification(notificationId: string): Promise<void> {
    this.notifications = this.notifications.filter(n => n.id !== notificationId);
    this.notifySubscribers();
  }

  // Clear all notifications
  async clearAll(): Promise<void> {
    this.notifications = [];
    this.notifySubscribers();
  }

  // Send system notification
  async sendSystemNotification(
    title: string,
    message: string,
    type: Notification['type'] = 'info',
    priority: Notification['priority'] = 'low',
    actionUrl?: string,
    actionLabel?: string
  ): Promise<void> {
    const notification: Notification = {
      id: `notif_${Date.now()}`,
      type,
      title,
      message,
      timestamp: new Date().toISOString(),
      read: false,
      actionUrl,
      actionLabel,
      category: 'system',
      priority
    };

    this.notifications.unshift(notification);
    
    // Show toast for important system notifications
    if (priority === 'high') {
      toast.error(title, {
        description: message,
        action: actionUrl ? {
          label: actionLabel || 'View',
          onClick: () => window.location.href = actionUrl
        } : undefined
      });
    } else if (priority === 'medium') {
      toast.info(title, { description: message });
    }

    this.notifySubscribers();
  }

  // Simulate workflow events (for testing)
  async simulateWorkflowEvent(eventType: WorkflowEvent['eventType'], reportName: string = 'Test Report') {
    const event: WorkflowEvent = {
      eventType,
      reportId: `report_${Date.now()}`,
      reportName,
      userId: 'user_123',
      userName: 'John Doe',
      userRole: 'Senior Analyst',
      timestamp: new Date().toISOString()
    };

    await this.createWorkflowNotification(event);
  }
}

// Export singleton instance
export const notificationService = new NotificationService();