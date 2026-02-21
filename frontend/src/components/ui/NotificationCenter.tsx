/**
 * NotificationCenter Component
 * Displays and manages user notifications using the collaboration API
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useNotifications } from '@/hooks/useCollaborationData';
import {
  Bell,
  BellRing,
  CheckCheck,
  X,
  AlertTriangle,
  Info,
  CheckCircle2,
  XCircle,
  Settings,
  MessageSquare,
  Share2,
  AtSign,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';

interface NotificationCenterProps {
  className?: string;
}

export function NotificationCenter({ className }: NotificationCenterProps) {
  const {
    notifications,
    unreadCount,
    loading,
    markRead,
    markAllRead,
    dismiss,
  } = useNotifications();
  const [filter, setFilter] = useState<'all' | 'unread' | 'comment' | 'share' | 'mention'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    // Apply category filter
    if (filter === 'unread' && notification.is_read) return false;
    if (filter === 'comment' && !notification.notification_type.includes('comment')) return false;
    if (filter === 'share' && !notification.notification_type.includes('share')) return false;
    if (filter === 'mention' && !notification.notification_type.includes('mention')) return false;

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        notification.title.toLowerCase().includes(searchLower) ||
        notification.message.toLowerCase().includes(searchLower)
      );
    }

    return true;
  });

  // Get notification icon based on type
  const getNotificationIcon = (notificationType: string) => {
    if (notificationType.includes('comment')) return MessageSquare;
    if (notificationType.includes('share')) return Share2;
    if (notificationType.includes('mention')) return AtSign;
    if (notificationType.includes('error') || notificationType.includes('fail')) return XCircle;
    if (notificationType.includes('warn')) return AlertTriangle;
    if (notificationType.includes('success') || notificationType.includes('approved')) return CheckCircle2;
    return Info;
  };

  // Get notification icon color
  const getNotificationColor = (notificationType: string) => {
    if (notificationType.includes('error') || notificationType.includes('fail')) return 'text-red-600';
    if (notificationType.includes('warn')) return 'text-yellow-600';
    if (notificationType.includes('success') || notificationType.includes('approved')) return 'text-green-600';
    if (notificationType.includes('mention')) return 'text-cyan-600';
    if (notificationType.includes('share')) return 'text-purple-600';
    return 'text-blue-600';
  };

  // Get priority badge
  const getPriorityBadge = (priority: string) => {
    const config: Record<string, { variant: 'destructive' | 'default' | 'secondary'; label: string }> = {
      high: { variant: 'destructive', label: 'High' },
      medium: { variant: 'default', label: 'Medium' },
      low: { variant: 'secondary', label: 'Low' },
    };
    const p = config[priority] || config.low;
    return <Badge variant={p.variant} className="text-xs">{p.label}</Badge>;
  };

  // Format time ago
  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return time.toLocaleDateString();
  };

  // Handle notification click
  const handleNotificationClick = async (notification: typeof notifications[0]) => {
    if (!notification.is_read) {
      await markRead(notification.id);
    }
    if (notification.action_url) {
      router.push(notification.action_url);
      setIsOpen(false);
    }
  };

  // Handle dismiss
  const handleDismiss = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await dismiss(id);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`relative ${className}`}
          aria-label="Notifications"
        >
          {unreadCount > 0 ? (
            <BellRing className="h-5 w-5" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllRead()}
                className="text-xs"
              >
                <CheckCheck className="h-4 w-4 mr-1" />
                Mark all read
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                router.push('/dashboard/collaboration');
                setIsOpen(false);
              }}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 space-y-3 border-b">
          <div className="flex gap-2">
            <Input
              placeholder="Search notifications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-sm"
            />
            <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="comment">Comments</SelectItem>
                <SelectItem value="share">Shares</SelectItem>
                <SelectItem value="mention">Mentions</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Notifications List */}
        <ScrollArea className="max-h-96">
          <div className="p-2">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">Loading notifications...</p>
              </div>
            ) : filteredNotifications.length > 0 ? (
              <div className="space-y-2">
                {filteredNotifications.map((notification) => {
                  const Icon = getNotificationIcon(notification.notification_type);
                  const iconColor = getNotificationColor(notification.notification_type);

                  return (
                    <div
                      key={notification.id}
                      className={`group p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm ${
                        notification.is_read ? 'bg-muted/30' : 'bg-background border-blue-200'
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-1 rounded ${iconColor}`}>
                          <Icon className="h-4 w-4" />
                        </div>

                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-start justify-between">
                            <h4 className={`text-sm font-medium ${!notification.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
                              {notification.title}
                            </h4>
                            <div className="flex items-center gap-1">
                              {notification.priority === 'high' && getPriorityBadge(notification.priority)}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                                onClick={(e) => handleDismiss(notification.id, e)}
                                aria-label="Dismiss notification"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>

                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {notification.message}
                          </p>

                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              {formatTimeAgo(notification.created_at)}
                            </span>
                            {notification.action_url && (
                              <Badge variant="outline" className="text-xs">
                                View
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">
                  {searchTerm || filter !== 'all'
                    ? 'No notifications match your filters'
                    : 'No notifications yet'
                  }
                </p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-4 border-t">
            <Button
              variant="outline"
              className="w-full text-sm"
              onClick={() => {
                router.push('/dashboard/collaboration');
                setIsOpen(false);
              }}
            >
              View All Notifications
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
