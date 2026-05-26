'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  AlertTriangle,
  Send,
  Edit,
  Calendar,
  CheckCircle2,
  Award,
  XCircle,
  GitBranch,
  Scale,
  DollarSign,
  Bell,
  Clock,
  Plus,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { prosecutionApi, ProsecutionEvent } from '@/services/prosecutionApi';

interface ProsecutionTimelineProps {
  applicationId: string;
  applicationNumber?: string;
}

type EventIconConfig = {
  icon: React.ElementType;
  color: string;
  dotColor: string;
};

const EVENT_ICON_MAP: Record<string, EventIconConfig> = {
  application_filed:       { icon: FileText,     color: 'text-blue-500',   dotColor: 'bg-blue-500' },
  office_action_received:  { icon: AlertTriangle, color: 'text-red-500',    dotColor: 'bg-red-500' },
  response_filed:          { icon: Send,          color: 'text-green-500',  dotColor: 'bg-green-500' },
  amendment_filed:         { icon: Edit,          color: 'text-orange-500', dotColor: 'bg-orange-500' },
  interview_scheduled:     { icon: Calendar,      color: 'text-blue-500',   dotColor: 'bg-blue-500' },
  interview_completed:     { icon: CheckCircle2,  color: 'text-green-500',  dotColor: 'bg-green-500' },
  allowance_received:      { icon: CheckCircle2,  color: 'text-green-500',  dotColor: 'bg-green-500' },
  patent_granted:          { icon: Award,         color: 'text-yellow-500', dotColor: 'bg-yellow-500' },
  abandonment:             { icon: XCircle,       color: 'text-gray-400',   dotColor: 'bg-gray-400' },
  continuation_filed:      { icon: GitBranch,     color: 'text-blue-500',   dotColor: 'bg-blue-500' },
  appeal_filed:            { icon: Scale,         color: 'text-purple-500', dotColor: 'bg-purple-500' },
  fee_paid:                { icon: DollarSign,    color: 'text-green-500',  dotColor: 'bg-green-500' },
  deadline_reminder:       { icon: Bell,          color: 'text-orange-500', dotColor: 'bg-orange-500' },
};

const DEFAULT_ICON_CONFIG: EventIconConfig = {
  icon: Clock,
  color: 'text-gray-400',
  dotColor: 'bg-gray-400',
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  application_filed:      'Application Filed',
  office_action_received: 'Office Action Received',
  response_filed:         'Response Filed',
  amendment_filed:        'Amendment Filed',
  interview_scheduled:    'Interview Scheduled',
  interview_completed:    'Interview Completed',
  allowance_received:     'Notice of Allowance',
  patent_granted:         'Patent Granted',
  abandonment:            'Abandonment',
  continuation_filed:     'Continuation Filed',
  appeal_filed:           'Appeal Filed',
  fee_paid:               'Fee Paid',
  deadline_reminder:      'Deadline Reminder',
};

const EVENT_TYPE_OPTIONS = Object.entries(EVENT_TYPE_LABELS);

// ---- Milestone bar config ----

const MILESTONE_EVENT_TYPES = [
  'application_filed',
  'office_action_received',
  'response_filed',
  'amendment_filed',
  'allowance_received',
  'patent_granted',
  'abandonment',
  'appeal_filed',
] as const;

const EMPTY_NEW_EVENT = {
  event_type: '',
  title: '',
  event_date: '',
  description: '',
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function ProsecutionTimeline({ applicationId }: ProsecutionTimelineProps) {
  const [events, setEvents] = useState<ProsecutionEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEvent, setNewEvent] = useState(EMPTY_NEW_EVENT);
  const [saving, setSaving] = useState(false);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const response = await prosecutionApi.getEvents({ application: applicationId });
      if (response.success && response.data) {
        const raw = response.data as any;
        const data = Array.isArray(raw) ? raw : (raw.results ?? [raw]);
        const sorted = [...data].sort(
          (a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime()
        );
        setEvents(sorted);
      }
    } catch {
      toast.error('Failed to load prosecution events.');
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleAddEvent = async () => {
    if (!newEvent.event_type || !newEvent.title || !newEvent.event_date) {
      toast.error('Event type, title, and date are required.');
      return;
    }
    setSaving(true);
    try {
      const response = await prosecutionApi.addEvent(applicationId, {
        event_type: newEvent.event_type,
        title: newEvent.title,
        event_date: newEvent.event_date,
        description: newEvent.description,
      });
      if (response.success) {
        toast.success('Event added successfully.');
        setNewEvent(EMPTY_NEW_EVENT);
        setShowAddForm(false);
        await fetchEvents();
      } else {
        toast.error(response.error || 'Failed to add event.');
      }
    } catch {
      toast.error('Failed to add event.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelForm = () => {
    setNewEvent(EMPTY_NEW_EVENT);
    setShowAddForm(false);
  };

  // Derive milestone bar entries (ascending chronological order)
  const ascendingEvents = [...events].reverse();
  const milestoneEntries = MILESTONE_EVENT_TYPES
    .map((type) => ({
      type,
      event: ascendingEvents.find((e) => e.event_type === type),
      config: EVENT_ICON_MAP[type] ?? DEFAULT_ICON_CONFIG,
      label: EVENT_TYPE_LABELS[type] ?? type,
    }))
    .filter((m) => m.event !== undefined);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Prosecution Timeline</h2>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowAddForm((v) => !v)}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Add Event
        </Button>
      </div>

      {/* Milestone bar */}
      {!loading && milestoneEntries.length > 0 && (
        <div className="rounded-md border bg-muted/30 px-4 pt-4 pb-3 overflow-x-auto">
          <p className="text-xs font-medium text-muted-foreground mb-3">Key Milestones</p>
          <div className="flex items-start gap-0 min-w-max">
            {milestoneEntries.map((m, idx) => {
              const Icon = m.config.icon;
              return (
                <React.Fragment key={m.type}>
                  {idx > 0 && (
                    <div className="flex-shrink-0 w-8 mt-4 border-t border-dashed border-muted-foreground/40" />
                  )}
                  <div className="flex flex-col items-center gap-1 px-2 max-w-[80px]">
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${m.config.dotColor}`}
                    >
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-xs font-medium text-center leading-tight line-clamp-2">
                      {m.label}
                    </span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(m.event!.event_date)}
                    </span>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {showAddForm && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">New Event</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select
              value={newEvent.event_type}
              onValueChange={(val) => setNewEvent((e) => ({ ...e, event_type: val }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Event type" />
              </SelectTrigger>
              <SelectContent>
                {EVENT_TYPE_OPTIONS.map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              placeholder="Title"
              value={newEvent.title}
              onChange={(e) => setNewEvent((ev) => ({ ...ev, title: e.target.value }))}
            />

            <Input
              type="date"
              value={newEvent.event_date}
              onChange={(e) => setNewEvent((ev) => ({ ...ev, event_date: e.target.value }))}
            />

            <Textarea
              placeholder="Description (optional)"
              value={newEvent.description}
              rows={3}
              onChange={(e) => setNewEvent((ev) => ({ ...ev, description: e.target.value }))}
            />

            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={handleCancelForm} disabled={saving}>
                <X className="mr-1.5 h-4 w-4" />
                Cancel
              </Button>
              <Button size="sm" onClick={handleAddEvent} disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="space-y-4 pl-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-64" />
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          No prosecution events recorded yet.
        </div>
      ) : (
        <div className="relative border-l-2 border-muted pl-6 space-y-6">
          {events.map((event) => {
            const config = EVENT_ICON_MAP[event.event_type] ?? DEFAULT_ICON_CONFIG;
            const Icon = config.icon;
            const label = EVENT_TYPE_LABELS[event.event_type] ?? event.event_type;

            return (
              <div key={event.id} className="relative">
                <span
                  className={`absolute -left-[1.8125rem] top-1 -ml-px h-3 w-3 rounded-full border-2 border-background ${config.dotColor}`}
                />
                <p className="text-xs text-muted-foreground mb-1">{formatDate(event.event_date)}</p>
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon className={`h-4 w-4 flex-shrink-0 ${config.color}`} />
                  <span className="text-sm font-medium">{label}</span>
                  {event.is_urgent && (
                    <Badge variant="destructive" className="text-xs px-1.5 py-0">
                      Urgent
                    </Badge>
                  )}
                  {event.is_completed && (
                    <Badge variant="outline" className="text-xs px-1.5 py-0 text-muted-foreground">
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Done
                    </Badge>
                  )}
                </div>
                {event.description && (
                  <p className="text-sm text-muted-foreground">{event.description}</p>
                )}
                {event.handled_by && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Handled by{' '}
                    {event.handled_by.name ??
                      `${event.handled_by.firstName} ${event.handled_by.lastName}`.trim()}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ProsecutionTimeline;
