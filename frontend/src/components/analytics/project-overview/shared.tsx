'use client';

import {
  Calendar,
  Clock,
  TrendingUp,
  Database,
  BarChart3,
  FileText,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import type { AnalyticsProject } from '@/services/analyticsApi';

// ─── Chip list ─────────────────────────────────────────────────────────────

type ChipColor = 'default' | 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'teal' | 'indigo';

const CHIP_COLORS: Record<ChipColor, string> = {
  default: 'bg-muted text-muted-foreground',
  blue:    'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  green:   'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  purple:  'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  orange:  'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  red:     'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  teal:    'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
  indigo:  'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
};

export function ChipList({
  items,
  emptyText,
  color = 'default',
}: {
  items: string[];
  emptyText: string;
  color?: ChipColor;
}) {
  if (!items || items.length === 0) {
    return <span className="text-xs text-muted-foreground italic">{emptyText}</span>;
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.slice(0, 8).map((item) => (
        <span key={item} className={`text-xs px-2 py-0.5 rounded-full font-medium ${CHIP_COLORS[color]}`}>
          {item}
        </span>
      ))}
      {items.length > 8 && (
        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
          +{items.length - 8} more
        </span>
      )}
    </div>
  );
}

// ─── Scope row ──────────────────────────────────────────────────────────────

export function ScopeRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b last:border-0">
      <div className="flex items-center gap-2 w-36 shrink-0 pt-0.5">
        <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      </div>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

// ─── Status strip ───────────────────────────────────────────────────────────

export function StatusStrip({
  project,
  getStatusColor,
  getPriorityVariant,
}: {
  project: AnalyticsProject;
  getStatusColor: (s: string) => string;
  getPriorityVariant: (p: string) => 'default' | 'secondary' | 'destructive' | 'outline';
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <Card className="py-3 px-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted-foreground font-medium">Status</span>
          <div className={`w-2 h-2 rounded-full ${getStatusColor(project.status)}`} />
        </div>
        <p className="text-sm font-semibold capitalize">{project.status.replace(/_/g, ' ')}</p>
      </Card>

      <Card className="py-3 px-4">
        <span className="text-xs text-muted-foreground font-medium">Priority</span>
        <div className="mt-1">
          <Badge variant={getPriorityVariant(project.priority)} className="capitalize text-xs">
            {project.priority}
          </Badge>
        </div>
      </Card>

      <Card className="py-3 px-4">
        <span className="text-xs text-muted-foreground font-medium">Progress</span>
        <div className="mt-1.5 space-y-1">
          <Progress value={project.progress_percentage} className="h-1.5" />
          <span className="text-xs font-semibold">{project.progress_percentage}%</span>
        </div>
      </Card>

      <Card className="py-3 px-4">
        <span className="text-xs text-muted-foreground font-medium">Due Date</span>
        <p className="text-sm font-semibold mt-1">
          {project.due_date ? new Date(project.due_date).toLocaleDateString() : 'Not set'}
        </p>
      </Card>
    </div>
  );
}

// ─── Timeline card ──────────────────────────────────────────────────────────

export function TimelineCard({ project }: { project: AnalyticsProject }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Timeline</CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        <div className="flex items-center gap-2 text-xs">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="text-muted-foreground">Started</span>
          <span className="ml-auto font-medium">{new Date(project.start_date).toLocaleDateString()}</span>
        </div>
        {project.due_date && (
          <div className="flex items-center gap-2 text-xs">
            <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground">Due</span>
            <span className="ml-auto font-medium">{new Date(project.due_date).toLocaleDateString()}</span>
          </div>
        )}
        {project.completed_date && (
          <div className="flex items-center gap-2 text-xs">
            <TrendingUp className="h-3.5 w-3.5 text-green-600 shrink-0" />
            <span className="text-muted-foreground">Completed</span>
            <span className="ml-auto font-medium text-green-600">{new Date(project.completed_date).toLocaleDateString()}</span>
          </div>
        )}
        <Separator />
        <div className="flex items-center gap-2 text-xs">
          <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="text-muted-foreground">Updated</span>
          <span className="ml-auto font-medium">{new Date(project.updated_at).toLocaleDateString()}</span>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Team card ──────────────────────────────────────────────────────────────

export function TeamCard({ project }: { project: AnalyticsProject }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Team</CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {project.created_by && (
          <div>
            <p className="text-[10px] text-muted-foreground mb-0.5">Created by</p>
            <PersonRow person={project.created_by} avatarColor="blue" />
          </div>
        )}
        {project.assigned_to && (
          <>
            {project.created_by && <Separator />}
            <div>
              <p className="text-[10px] text-muted-foreground mb-0.5">Assigned to</p>
              <PersonRow person={project.assigned_to} avatarColor="purple" />
            </div>
          </>
        )}
        {!project.created_by && !project.assigned_to && (
          <p className="text-xs text-muted-foreground italic">No team members assigned</p>
        )}
      </CardContent>
    </Card>
  );
}

function PersonRow({
  person,
  avatarColor,
}: {
  person: { firstName?: string; lastName?: string; email?: string };
  avatarColor: 'blue' | 'purple';
}) {
  const initial = (person.firstName?.[0] ?? person.email?.[0] ?? '?').toUpperCase();
  const bg = avatarColor === 'blue'
    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700'
    : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700';
  return (
    <div className="flex items-center gap-2">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${bg}`}>
        {initial}
      </div>
      <div>
        <p className="text-xs font-medium leading-tight">
          {[person.firstName, person.lastName].filter(Boolean).join(' ') || 'Unknown'}
        </p>
        {person.email && <p className="text-[10px] text-muted-foreground">{person.email}</p>}
      </div>
    </div>
  );
}

// ─── Coverage card ──────────────────────────────────────────────────────────

export function CoverageCard({
  project,
  extra,
}: {
  project: AnalyticsProject;
  extra?: { icon: React.ElementType; label: string; value: number }[];
}) {
  const base = [
    { icon: Database,  label: 'Datasets',       value: project.datasets?.length ?? 0 },
    { icon: BarChart3, label: 'Visualizations',  value: project.visualizations?.length ?? 0 },
    { icon: FileText,  label: 'Reports',         value: project.reports?.length ?? 0 },
  ];
  const rows = extra ? [...extra, ...base] : base;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Coverage</CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-2.5">
        {rows.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
            <span className="text-sm font-semibold">{value}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ─── Description card ────────────────────────────────────────────────────────

export function DescriptionCard({ description }: { description?: string }) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Description</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {description || <span className="italic">No description provided.</span>}
        </p>
      </CardContent>
    </Card>
  );
}
