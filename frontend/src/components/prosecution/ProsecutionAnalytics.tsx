'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  prosecutionApi,
  PatentApplication,
  OfficeAction,
  ProsecutionDeadline,
  StatusBreakdown,
} from '@/services/prosecutionApi';

// ---- Deadline stats derived client-side from the flat deadlines list ----

interface DeadlineStats {
  overdue: number;
  by_priority: Record<string, number>;
  by_type: Record<string, number>;
}

function computeDeadlineStats(deadlines: ProsecutionDeadline[]): DeadlineStats {
  const now = new Date();
  let overdue = 0;
  const by_priority: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0 };
  const by_type: Record<string, number> = {};

  for (const d of deadlines) {
    if (!d.is_completed && !d.is_cancelled && new Date(d.due_date) < now) {
      overdue += 1;
    }
    if (d.priority in by_priority) {
      by_priority[d.priority] = (by_priority[d.priority] ?? 0) + 1;
    }
    by_type[d.deadline_type] = (by_type[d.deadline_type] ?? 0) + 1;
  }

  return { overdue, by_priority, by_type };
}

// ---- Helpers ----

function avgTimeToGrantMonths(applications: PatentApplication[]): string {
  const granted = applications.filter(
    (a) => a.status === 'granted' && a.filing_date && a.grant_date
  );
  if (granted.length === 0) return 'N/A';
  const totalDays = granted.reduce((sum, a) => {
    const filing = new Date(a.filing_date!).getTime();
    const grant = new Date(a.grant_date!).getTime();
    return sum + (grant - filing) / 86_400_000;
  }, 0);
  const months = totalDays / granted.length / 30.4;
  return `${months.toFixed(1)} mo`;
}

function capitalize(s: string): string {
  return s
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// ---- Status color map ----

const STATUS_BAR_COLORS: Record<string, string> = {
  draft:             'bg-gray-400',
  filed:             'bg-blue-400',
  pending:           'bg-yellow-400',
  under_examination: 'bg-blue-500',
  office_action:     'bg-red-400',
  allowed:           'bg-green-300',
  granted:           'bg-green-500',
  abandoned:         'bg-gray-500',
  rejected:          'bg-red-600',
  withdrawn:         'bg-gray-300',
};

// ---- Priority colors ----

const PRIORITY_BADGE_VARIANTS: Record<string, string> = {
  critical: 'bg-red-100 text-red-700 border-red-200',
  high:     'bg-orange-100 text-orange-700 border-orange-200',
  medium:   'bg-yellow-100 text-yellow-700 border-yellow-200',
  low:      'bg-gray-100 text-gray-600 border-gray-200',
};

// ---- Deadline type labels ----

const DEADLINE_TYPE_LABELS: Record<string, string> = {
  office_action_response: 'OA Response',
  filing_deadline:        'Filing Deadline',
  fee_payment:            'Fee Payment',
  maintenance_fee:        'Maintenance Fee',
  appeal_deadline:        'Appeal Deadline',
  interview_deadline:     'Interview Deadline',
  examination_request:    'Exam Request',
  publication_request:    'Publication Request',
};

function deadlineTypeLabel(type: string): string {
  return DEADLINE_TYPE_LABELS[type] ?? capitalize(type);
}

// ---- Risk item type ----

interface RiskItem {
  application_id: string;
  application_title?: string;
  app_number?: string;
  issue: string;
  due_date: string | null;
  type: 'office_action' | 'abandoned';
}

// ---- Rejection / OA types ----

interface Rejection {
  rejection_type: string
  prior_art?: string
}

const REJECTION_TYPE_LABELS: Record<string, string> = {
  '101':  '§ 101 Eligibility',
  '102':  '§ 102 Anticipation',
  '103':  '§ 103 Obviousness',
  '112a': '§ 112(a) Written Description',
  '112b': '§ 112(b) Indefiniteness',
  dp:     'Double Patenting',
  other:  'Other',
}

const OA_TYPE_LABELS: Record<string, string> = {
  non_final:          'Non-Final OA',
  final:              'Final OA',
  restriction:        'Restriction',
  advisory:           'Advisory Action',
  notice_allowance:   'Notice of Allowance',
  notice_abandonment: 'Notice of Abandonment',
}

// ---- Attorney docket ----

interface AttorneyRow {
  name: string
  total: number
  active: number
  overdueOAs: number
}

// ---- Time-to-grant by jurisdiction ----

function grantByJurisdiction(
  applications: PatentApplication[]
): Array<{ jurisdiction: string; avgMonths: number; count: number }> {
  const map: Record<string, { totalDays: number; count: number }> = {}
  for (const app of applications) {
    if (app.status === 'granted' && app.filing_date && app.grant_date) {
      const days =
        (new Date(app.grant_date).getTime() - new Date(app.filing_date).getTime()) /
        86_400_000
      if (!map[app.jurisdiction]) map[app.jurisdiction] = { totalDays: 0, count: 0 }
      map[app.jurisdiction].totalDays += days
      map[app.jurisdiction].count += 1
    }
  }
  return Object.entries(map)
    .map(([jurisdiction, { totalDays, count }]) => ({
      jurisdiction,
      avgMonths: totalDays / count / 30.4,
      count,
    }))
    .sort((a, b) => b.count - a.count)
}

// ---- Health card skeleton ----

function HealthCardSkeleton() {
  return (
    <Card>
      <CardContent className="pt-6">
        <Skeleton className="h-4 w-32 mb-2" />
        <Skeleton className="h-8 w-16" />
      </CardContent>
    </Card>
  );
}

// ---- Main component ----

export function ProsecutionAnalytics() {
  const [loading, setLoading] = useState(true);
  const [statusBreakdown, setStatusBreakdown] = useState<StatusBreakdown[]>([]);
  const [deadlineStats, setDeadlineStats] = useState<DeadlineStats>({
    overdue: 0,
    by_priority: { critical: 0, high: 0, medium: 0, low: 0 },
    by_type: {},
  });
  const [overdueOAs, setOverdueOAs] = useState<OfficeAction[]>([]);
  const [applications, setApplications] = useState<PatentApplication[]>([]);
  const [allOfficeActions, setAllOfficeActions] = useState<OfficeAction[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const [statusRes, deadlinesRes, oaRes, appsRes, allOAsRes] = await Promise.allSettled([
        prosecutionApi.getStatusBreakdown(),
        prosecutionApi.getDeadlines(),
        prosecutionApi.getOfficeActions({ response_status: 'overdue' }),
        prosecutionApi.getApplications({ page_size: 200 }),
        prosecutionApi.getOfficeActions(),
      ]);

      if (cancelled) return;

      const unwrap = (d: unknown): any[] => {
        if (Array.isArray(d)) return d;
        if (d && typeof d === 'object' && 'results' in d) return (d as any).results;
        return d ? [d] : [];
      };

      if (statusRes.status === 'fulfilled' && statusRes.value.success && statusRes.value.data) {
        setStatusBreakdown(unwrap(statusRes.value.data));
      }

      if (deadlinesRes.status === 'fulfilled' && deadlinesRes.value.success && deadlinesRes.value.data) {
        setDeadlineStats(computeDeadlineStats(unwrap(deadlinesRes.value.data)));
      }

      if (oaRes.status === 'fulfilled' && oaRes.value.success && oaRes.value.data) {
        setOverdueOAs(unwrap(oaRes.value.data));
      }

      if (appsRes.status === 'fulfilled' && appsRes.value.success && appsRes.value.data) {
        setApplications(unwrap(appsRes.value.data));
      }

      if (allOAsRes.status === 'fulfilled' && allOAsRes.value.success && allOAsRes.value.data) {
        setAllOfficeActions(unwrap(allOAsRes.value.data));
      }

      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, []);

  // ---- Derived values ----

  const totalApplications = statusBreakdown.reduce((s, r) => s + r.count, 0);
  const avgGrant = avgTimeToGrantMonths(applications);

  const sortedStatuses = [...statusBreakdown]
    .filter((r) => r.count > 0)
    .sort((a, b) => b.count - a.count);

  const riskItems: RiskItem[] = [
    ...overdueOAs.map<RiskItem>((oa) => ({
      application_id: oa.application,
      issue: 'Overdue Office Action Response',
      due_date: oa.response_due_date,
      type: 'office_action',
    })),
    ...applications
      .filter((a) => a.status === 'abandoned')
      .map<RiskItem>((a) => ({
        application_id: a.id,
        application_title: a.title,
        app_number: a.application_number,
        issue: 'Status: Abandoned',
        due_date: null,
        type: 'abandoned',
      })),
  ];

  // ---- OA intelligence ----
  const oaTypeCounts = allOfficeActions.reduce<Record<string, number>>((acc, oa) => {
    acc[oa.action_type] = (acc[oa.action_type] ?? 0) + 1;
    return acc;
  }, {});

  const allRejections: Rejection[] = allOfficeActions.flatMap((oa) =>
    Array.isArray(oa.rejections) ? (oa.rejections as Rejection[]) : []
  );

  const rejectionCounts = allRejections.reduce<Record<string, number>>((acc, r) => {
    const key = r.rejection_type ?? 'other';
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const priorArtCounts = allRejections.reduce<Record<string, number>>((acc, r) => {
    const ref = r.prior_art?.trim();
    if (ref) acc[ref] = (acc[ref] ?? 0) + 1;
    return acc;
  }, {});

  const topPriorArt = Object.entries(priorArtCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  const totalOAs = allOfficeActions.length;
  const finalOACount = oaTypeCounts['final'] ?? 0;
  const finalOARate = totalOAs > 0 ? ((finalOACount / totalOAs) * 100).toFixed(0) : '0';
  const noaCount = oaTypeCounts['notice_allowance'] ?? 0;
  const noaRate = totalOAs > 0 ? ((noaCount / totalOAs) * 100).toFixed(0) : '0';

  const examinedApps = applications.filter(
    (a) => !['draft', 'withdrawn'].includes(a.status)
  ).length;
  const avgOAsPerApp =
    examinedApps > 0 ? (totalOAs / examinedApps).toFixed(1) : 'N/A';

  const sortedOATypes = Object.entries(oaTypeCounts).sort(([, a], [, b]) => b - a);
  const sortedRejectionTypes = Object.entries(rejectionCounts).sort(([, a], [, b]) => b - a);
  const maxRejectionCount = Math.max(...Object.values(rejectionCounts), 1);
  const maxOACount = Math.max(...Object.values(oaTypeCounts), 1);

  // ---- Attorney docket ----
  const appIdToAttorney: Record<string, string> = {};
  const attorneyMap: Record<string, AttorneyRow> = {};

  for (const app of applications) {
    const name = app.attorney
      ? `${app.attorney.first_name ?? ''} ${app.attorney.last_name ?? ''}`.trim() || app.attorney.email
      : 'Unassigned';
    appIdToAttorney[app.id] = name;
    if (!attorneyMap[name]) attorneyMap[name] = { name, total: 0, active: 0, overdueOAs: 0 };
    attorneyMap[name].total += 1;
    if (!['draft', 'granted', 'abandoned', 'withdrawn', 'rejected'].includes(app.status)) {
      attorneyMap[name].active += 1;
    }
  }
  for (const oa of allOfficeActions) {
    if (oa.response_status === 'overdue') {
      const attName = appIdToAttorney[oa.application];
      if (attName && attorneyMap[attName]) {
        attorneyMap[attName].overdueOAs += 1;
      }
    }
  }
  const attorneyRows = Object.values(attorneyMap).sort((a, b) => b.total - a.total);

  // ---- Time to grant by jurisdiction ----
  const grantByJurisdictionRows = grantByJurisdiction(applications);

  return (
    <div className="space-y-8">
      {/* Section 1: Portfolio Health Cards */}
      <section>
        <h2 className="text-base font-semibold mb-4">Portfolio Health</h2>
        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <HealthCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-1">Total Applications</p>
                <p className="text-3xl font-bold">{totalApplications}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-1">Overdue Office Actions</p>
                <p
                  className={`text-3xl font-bold ${
                    overdueOAs.length > 0 ? 'text-red-600' : ''
                  }`}
                >
                  {overdueOAs.length}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-1">Overdue Deadlines</p>
                <p
                  className={`text-3xl font-bold ${
                    deadlineStats.overdue > 0 ? 'text-red-600' : ''
                  }`}
                >
                  {deadlineStats.overdue}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-1">Avg Time to Grant</p>
                <p className="text-3xl font-bold">{avgGrant}</p>
              </CardContent>
            </Card>
          </div>
        )}
      </section>

      {/* Section 2: Status Distribution */}
      <section>
        <h2 className="text-base font-semibold mb-4">Application Status Distribution</h2>
        <Card>
          <CardContent className="pt-6 space-y-3">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-1">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))
            ) : sortedStatuses.length === 0 ? (
              <p className="text-sm text-muted-foreground">No status data available.</p>
            ) : (
              sortedStatuses.map((row) => {
                const pct = totalApplications > 0 ? (row.count / totalApplications) * 100 : 0;
                const barColor = STATUS_BAR_COLORS[row.status] ?? 'bg-primary';
                return (
                  <div key={row.status}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm">{capitalize(row.status)}</span>
                      <span className="text-sm text-muted-foreground">
                        {row.count} ({pct.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full ${barColor}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </section>

      {/* Section 3: Deadline Health */}
      <section>
        <h2 className="text-base font-semibold mb-4">Deadline Health</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* By Priority */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">By Priority</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-5 w-8" />
                  </div>
                ))
              ) : (
                (['critical', 'high', 'medium', 'low'] as const).map((priority) => {
                  const count = deadlineStats.by_priority[priority] ?? 0;
                  const colorClass = PRIORITY_BADGE_VARIANTS[priority];
                  return (
                    <div key={priority} className="flex items-center justify-between">
                      <span className="text-sm capitalize">{priority}</span>
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${colorClass}`}
                      >
                        {count}
                      </span>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* By Type */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">By Type</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-6" />
                  </div>
                ))
              ) : Object.keys(deadlineStats.by_type).length === 0 ? (
                <p className="text-sm text-muted-foreground">No deadline data.</p>
              ) : (
                Object.entries(deadlineStats.by_type)
                  .sort(([, a], [, b]) => b - a)
                  .map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-sm">{deadlineTypeLabel(type)}</span>
                      <span className="text-sm font-medium tabular-nums">{count}</span>
                    </div>
                  ))
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Section 4: Applications at Risk */}
      <section>
        <h2 className="text-base font-semibold mb-4">Applications at Risk</h2>
        <Card>
          <CardContent className="pt-4">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : riskItems.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No applications at risk.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="pb-2 text-left font-medium">Application</th>
                      <th className="pb-2 text-left font-medium">Issue</th>
                      <th className="pb-2 text-left font-medium">Due Date</th>
                      <th className="pb-2 text-left font-medium">Link</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {riskItems.map((item, idx) => {
                      const appLabel =
                        item.app_number ??
                        item.application_title ??
                        item.application_id;
                      const dueLabel = item.due_date
                        ? new Date(item.due_date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : '—';
                      return (
                        <tr key={`${item.application_id}-${idx}`}>
                          <td className="py-2.5 pr-4 max-w-[200px] truncate" title={appLabel}>
                            {appLabel}
                          </td>
                          <td className="py-2.5 pr-4">
                            <Badge
                              variant="outline"
                              className={
                                item.type === 'office_action'
                                  ? 'border-red-200 text-red-700'
                                  : 'border-gray-200 text-gray-600'
                              }
                            >
                              {item.issue}
                            </Badge>
                          </td>
                          <td className="py-2.5 pr-4 text-muted-foreground">{dueLabel}</td>
                          <td className="py-2.5">
                            <Link
                              href={`/dashboard/prosecution/applications/${item.application_id}`}
                              className="text-primary underline-offset-4 hover:underline"
                            >
                              View &rarr;
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
      {/* Section 5: Office Action Intelligence */}
      <section>
        <h2 className="text-base font-semibold mb-4">Office Action Intelligence</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-1">Avg OAs per Application</p>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-3xl font-bold">{avgOAsPerApp}</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-1">Final OA Rate</p>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className={`text-3xl font-bold ${Number(finalOARate) > 40 ? 'text-orange-600' : ''}`}>
                  {finalOARate}%
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-1">First-Action Allowance Rate</p>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className={`text-3xl font-bold ${Number(noaRate) > 20 ? 'text-green-600' : ''}`}>
                  {noaRate}%
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* OA Type Distribution */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">By Action Type</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-1">
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                ))
              ) : sortedOATypes.length === 0 ? (
                <p className="text-sm text-muted-foreground">No office actions recorded.</p>
              ) : (
                sortedOATypes.map(([type, count]) => (
                  <div key={type}>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs">{OA_TYPE_LABELS[type] ?? capitalize(type)}</span>
                      <span className="text-xs text-muted-foreground">{count}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${(count / maxOACount) * 100}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Rejection Type Distribution */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Rejection Type Distribution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-1">
                    <Skeleton className="h-3 w-36" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                ))
              ) : sortedRejectionTypes.length === 0 ? (
                <p className="text-sm text-muted-foreground">No rejection data recorded.</p>
              ) : (
                sortedRejectionTypes.map(([type, count]) => (
                  <div key={type}>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs">
                        {REJECTION_TYPE_LABELS[type] ?? capitalize(type)}
                      </span>
                      <span className="text-xs text-muted-foreground">{count}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-orange-400"
                        style={{ width: `${(count / maxRejectionCount) * 100}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Section 6: Prior Art Citations */}
      {(loading || topPriorArt.length > 0) && (
        <section>
          <h2 className="text-base font-semibold mb-4">Top Cited Prior Art</h2>
          <Card>
            <CardContent className="pt-4">
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-4 w-8" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {topPriorArt.map(([ref, count], idx) => (
                    <div key={idx} className="flex items-center justify-between gap-3 py-1.5 border-b last:border-0">
                      <span className="text-sm font-mono text-xs truncate max-w-[80%]" title={ref}>
                        {ref}
                      </span>
                      <Badge variant="outline" className="shrink-0 tabular-nums">
                        ×{count}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      )}

      {/* Section 7: Time-to-Grant by Jurisdiction */}
      {(loading || grantByJurisdictionRows.length > 0) && (
        <section>
          <h2 className="text-base font-semibold mb-4">Time-to-Grant by Jurisdiction</h2>
          <Card>
            <CardContent className="pt-4">
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                </div>
              ) : grantByJurisdictionRows.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No granted applications with filing and grant dates.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-muted-foreground text-xs">
                        <th className="pb-2 text-left font-medium">Jurisdiction</th>
                        <th className="pb-2 text-right font-medium">Granted</th>
                        <th className="pb-2 text-right font-medium">Avg Months</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {grantByJurisdictionRows.map((row) => (
                        <tr key={row.jurisdiction}>
                          <td className="py-2 font-medium">{row.jurisdiction}</td>
                          <td className="py-2 text-right text-muted-foreground">{row.count}</td>
                          <td className="py-2 text-right font-semibold tabular-nums">
                            {row.avgMonths.toFixed(1)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      )}

      {/* Section 8: Docket by Attorney */}
      <section>
        <h2 className="text-base font-semibold mb-4">Docket by Attorney</h2>
        <Card>
          <CardContent className="pt-4">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : attorneyRows.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No application data.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground text-xs">
                      <th className="pb-2 text-left font-medium">Attorney</th>
                      <th className="pb-2 text-right font-medium">Total</th>
                      <th className="pb-2 text-right font-medium">Active</th>
                      <th className="pb-2 text-right font-medium">Overdue OAs</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {attorneyRows.map((row) => (
                      <tr key={row.name}>
                        <td className="py-2">{row.name}</td>
                        <td className="py-2 text-right tabular-nums">{row.total}</td>
                        <td className="py-2 text-right tabular-nums text-muted-foreground">
                          {row.active}
                        </td>
                        <td className="py-2 text-right tabular-nums">
                          {row.overdueOAs > 0 ? (
                            <span className="text-red-600 font-semibold">{row.overdueOAs}</span>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

export default ProsecutionAnalytics;
