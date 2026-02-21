/**
 * ActivityFeed Component
 * Timeline-style vertical activity feed with filtering
 */

'use client';

import { useState } from 'react';
import { useActivityFeed } from '@/hooks/useCollaborationData';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  MessageSquare,
  Share2,
  Edit2,
  Plus,
  Trash2,
  Eye,
  CheckCircle2,
  GitMerge,
  FileText,
  Search,
  Activity,
  Loader2,
} from 'lucide-react';
import type { Activity as ActivityType } from '@/services/collaborationApi';

interface ActivityFeedProps {
  className?: string;
}

// Map activity types to icons
const activityIconMap: Record<string, React.ElementType> = {
  comment: MessageSquare,
  comment_created: MessageSquare,
  share: Share2,
  shared: Share2,
  share_created: Share2,
  edit: Edit2,
  edited: Edit2,
  updated: Edit2,
  create: Plus,
  created: Plus,
  delete: Trash2,
  deleted: Trash2,
  view: Eye,
  viewed: Eye,
  resolve: CheckCircle2,
  resolved: CheckCircle2,
  merge: GitMerge,
  merged: GitMerge,
  document: FileText,
  search: Search,
};

// Map activity types to colors
const activityColorMap: Record<string, string> = {
  comment: 'bg-blue-100 text-blue-600',
  comment_created: 'bg-blue-100 text-blue-600',
  share: 'bg-purple-100 text-purple-600',
  shared: 'bg-purple-100 text-purple-600',
  share_created: 'bg-purple-100 text-purple-600',
  edit: 'bg-amber-100 text-amber-600',
  edited: 'bg-amber-100 text-amber-600',
  updated: 'bg-amber-100 text-amber-600',
  create: 'bg-green-100 text-green-600',
  created: 'bg-green-100 text-green-600',
  delete: 'bg-red-100 text-red-600',
  deleted: 'bg-red-100 text-red-600',
  view: 'bg-neutral-100 text-neutral-600',
  viewed: 'bg-neutral-100 text-neutral-600',
  resolve: 'bg-emerald-100 text-emerald-600',
  resolved: 'bg-emerald-100 text-emerald-600',
};

function getActivityIcon(activityType: string): React.ElementType {
  // Check for exact match first, then partial matches
  if (activityIconMap[activityType]) return activityIconMap[activityType];
  for (const [key, icon] of Object.entries(activityIconMap)) {
    if (activityType.includes(key)) return icon;
  }
  return Activity;
}

function getActivityColor(activityType: string): string {
  if (activityColorMap[activityType]) return activityColorMap[activityType];
  for (const [key, color] of Object.entries(activityColorMap)) {
    if (activityType.includes(key)) return color;
  }
  return 'bg-neutral-100 text-neutral-600';
}

function formatTimeAgo(timestamp: string) {
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
  return time.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function ActivityItem({ activity }: { activity: ActivityType }) {
  const Icon = getActivityIcon(activity.activity_type);
  const colorClass = getActivityColor(activity.activity_type);

  return (
    <div className="flex gap-3 relative">
      {/* Timeline dot and line */}
      <div className="flex flex-col items-center">
        <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${colorClass}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="w-0.5 flex-1 bg-neutral-200 mt-1" />
      </div>

      {/* Content */}
      <div className="pb-6 min-w-0 flex-1">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-sm font-medium text-foreground">
            {activity.user.full_name}
          </span>
          <span className="text-sm text-muted-foreground">
            {activity.description}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-muted-foreground">
            {formatTimeAgo(activity.created_at)}
          </span>
          {activity.content_type && (
            <span className="text-xs text-muted-foreground">
              on {activity.content_type.split('.').pop()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function ActivityFeed({ className }: ActivityFeedProps) {
  const [scope, setScope] = useState<'all' | 'mine' | 'team'>('all');
  const { activities, loading, error } = useActivityFeed(scope);

  return (
    <div className={className}>
      <Tabs value={scope} onValueChange={(v) => setScope(v as 'all' | 'mine' | 'team')}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Activity</TabsTrigger>
          <TabsTrigger value="mine">My Activity</TabsTrigger>
          <TabsTrigger value="team">Team Activity</TabsTrigger>
        </TabsList>

        <TabsContent value={scope} className="mt-0">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              <span className="text-sm">Loading activity...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-sm">Failed to load activity feed</p>
              <p className="text-xs mt-1">{error}</p>
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No activity yet</p>
              <p className="text-xs mt-1">
                Activities will appear here as you and your team collaborate
              </p>
            </div>
          ) : (
            <div className="space-y-0">
              {activities.map(activity => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
