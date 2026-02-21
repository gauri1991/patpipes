/**
 * Collaboration Hub Page
 * Central hub for all collaboration features: activity, notifications, shared resources, mentions
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ActivityFeed } from '@/components/collaboration/ActivityFeed';
import {
  useNotifications,
  useSharedResources,
  useMentions,
} from '@/hooks/useCollaborationData';
import {
  Bell,
  CheckCheck,
  X,
  AlertTriangle,
  Info,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Share2,
  AtSign,
  Eye,
  Edit2,
  Search,
  Users,
  Activity,
  Loader2,
} from 'lucide-react';

export default function CollaborationPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Collaboration</h1>
        <p className="text-muted-foreground mt-1">
          Stay up to date with team activity, notifications, and shared resources.
        </p>
      </div>

      <Tabs defaultValue="activity" className="w-full">
        <TabsList>
          <TabsTrigger value="activity" className="gap-1.5">
            <Activity className="h-4 w-4" />
            Activity
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1.5">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="shared" className="gap-1.5">
            <Share2 className="h-4 w-4" />
            Shared with Me
          </TabsTrigger>
          <TabsTrigger value="mentions" className="gap-1.5">
            <AtSign className="h-4 w-4" />
            Mentions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="mt-6">
          <ActivityFeed />
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <NotificationsTab />
        </TabsContent>

        <TabsContent value="shared" className="mt-6">
          <SharedWithMeTab />
        </TabsContent>

        <TabsContent value="mentions" className="mt-6">
          <MentionsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ==================== Notifications Tab ====================

function NotificationsTab() {
  const {
    notifications,
    unreadCount,
    loading,
    markRead,
    markAllRead,
    dismiss,
  } = useNotifications();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread' && n.is_read) return false;
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      return n.title.toLowerCase().includes(s) || n.message.toLowerCase().includes(s);
    }
    return true;
  });

  const getNotificationIcon = (type: string) => {
    if (type.includes('comment')) return MessageSquare;
    if (type.includes('share')) return Share2;
    if (type.includes('mention')) return AtSign;
    if (type.includes('error') || type.includes('fail')) return XCircle;
    if (type.includes('warn')) return AlertTriangle;
    if (type.includes('success') || type.includes('approved')) return CheckCircle2;
    return Info;
  };

  const getNotificationColor = (type: string) => {
    if (type.includes('error') || type.includes('fail')) return 'text-red-600';
    if (type.includes('warn')) return 'text-yellow-600';
    if (type.includes('success') || type.includes('approved')) return 'text-green-600';
    if (type.includes('mention')) return 'text-cyan-600';
    if (type.includes('share')) return 'text-purple-600';
    return 'text-blue-600';
  };

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

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notifications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 text-sm"
          />
        </div>
        <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="unread">Unread ({unreadCount})</SelectItem>
          </SelectContent>
        </Select>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={() => markAllRead()}>
            <CheckCheck className="h-4 w-4 mr-1" />
            Mark all read
          </Button>
        )}
      </div>

      {/* Notification list */}
      {filteredNotifications.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">
            {searchTerm || filter !== 'all'
              ? 'No notifications match your filters'
              : 'No notifications yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredNotifications.map(notification => {
            const Icon = getNotificationIcon(notification.notification_type);
            const iconColor = getNotificationColor(notification.notification_type);

            return (
              <div
                key={notification.id}
                className={`group p-4 rounded-lg border cursor-pointer transition-all hover:shadow-sm ${
                  notification.is_read ? 'bg-muted/30' : 'bg-background border-blue-200'
                }`}
                onClick={async () => {
                  if (!notification.is_read) await markRead(notification.id);
                  if (notification.action_url) router.push(notification.action_url);
                }}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-1.5 rounded ${iconColor}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-start justify-between">
                      <h4
                        className={`text-sm font-medium ${
                          !notification.is_read ? 'text-foreground' : 'text-muted-foreground'
                        }`}
                      >
                        {notification.title}
                      </h4>
                      <div className="flex items-center gap-1">
                        {notification.priority === 'high' && (
                          <Badge variant="destructive" className="text-xs">
                            High
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            dismiss(notification.id);
                          }}
                          aria-label="Dismiss notification"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{notification.message}</p>
                    <span className="text-xs text-muted-foreground">
                      {formatTimeAgo(notification.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ==================== Shared with Me Tab ====================

function SharedWithMeTab() {
  const { sharedWithMe, loading, accept } = useSharedResources();
  const router = useRouter();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const permissionIcons: Record<string, React.ElementType> = {
    view: Eye,
    comment: MessageSquare,
    edit: Edit2,
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    );
  }

  if (sharedWithMe.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Nothing shared with you yet</p>
        <p className="text-xs mt-1">
          Resources shared by your team will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sharedWithMe.map(resource => {
        const PermIcon = permissionIcons[resource.permission_level] || Eye;
        return (
          <div
            key={resource.id}
            className="p-4 border rounded-lg hover:shadow-sm transition-all"
          >
            <div className="flex items-start gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs bg-neutral-100">
                  {getInitials(resource.shared_by.full_name)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">
                    {resource.shared_by.full_name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    shared a {resource.content_type.split('.').pop()}
                  </span>
                </div>

                {resource.message && (
                  <p className="text-sm text-muted-foreground mb-2">
                    &ldquo;{resource.message}&rdquo;
                  </p>
                )}

                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    <PermIcon className="h-3 w-3 mr-1" />
                    {resource.permission_level}
                  </Badge>
                  <Badge
                    variant={resource.status === 'pending' ? 'secondary' : 'default'}
                    className="text-xs"
                  >
                    {resource.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(resource.created_at)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {resource.status === 'pending' && (
                  <Button
                    size="sm"
                    onClick={() => accept(resource.id)}
                    className="h-8"
                  >
                    Accept
                  </Button>
                )}
                {resource.status === 'accepted' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      // Navigate to resource if possible
                      if (resource.content_type && resource.object_id) {
                        router.push(`/dashboard/${resource.content_type.split('.').pop()}/${resource.object_id}`);
                      }
                    }}
                    className="h-8"
                  >
                    <Eye className="h-3.5 w-3.5 mr-1" />
                    View
                  </Button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ==================== Mentions Tab ====================

function MentionsTab() {
  const { mentions, unreadMentions, loading } = useMentions();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

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

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
    );
  }

  if (mentions.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <AtSign className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No mentions yet</p>
        <p className="text-xs mt-1">
          When someone mentions you in a comment, it will show up here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {unreadMentions.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <Badge variant="destructive" className="text-xs">
              {unreadMentions.length}
            </Badge>
            Unread Mentions
          </h3>
          <div className="space-y-2">
            {unreadMentions.map(mention => (
              <div
                key={mention.id}
                className="p-3 border border-cyan-200 rounded-lg bg-cyan-50/30"
              >
                <div className="flex items-center gap-2">
                  <AtSign className="h-4 w-4 text-cyan-600 shrink-0" />
                  <span className="text-sm">
                    <span className="font-medium">{mention.mentioned_user_name}</span>
                  </span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {formatTimeAgo(mention.created_at)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {mentions.length > unreadMentions.length && (
        <>
          {unreadMentions.length > 0 && <Separator className="my-4" />}
          <h3 className="text-sm font-semibold mb-2">All Mentions</h3>
          <div className="space-y-2">
            {mentions
              .filter(m => m.is_read)
              .map(mention => (
                <div
                  key={mention.id}
                  className="p-3 border rounded-lg bg-muted/30"
                >
                  <div className="flex items-center gap-2">
                    <AtSign className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm text-muted-foreground">
                      <span className="font-medium">{mention.mentioned_user_name}</span>
                    </span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {formatTimeAgo(mention.created_at)}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </>
      )}
    </div>
  );
}
