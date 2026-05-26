'use client';

import { PieChart, Globe, CalendarRange, Tag, TrendingUp, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AnalyticsProject } from '@/services/analyticsApi';
import {
  ChipList, ScopeRow, StatusStrip, TimelineCard, TeamCard, CoverageCard, DescriptionCard,
} from './shared';

interface MarketOverviewPanelProps {
  project: AnalyticsProject;
  getStatusColor: (status: string) => string;
  getPriorityVariant: (priority: string) => 'default' | 'secondary' | 'destructive' | 'outline';
}

export function MarketOverviewPanel({ project, getStatusColor, getPriorityVariant }: MarketOverviewPanelProps) {
  const scope = project.analysis_scope ?? {};

  const segments: string[]      = Array.isArray(scope.market_segments) ? scope.market_segments : [];
  const techAreas: string[]     = Array.isArray(scope.technology_areas) ? scope.technology_areas : [];
  const jurisdictions: string[] = Array.isArray(scope.jurisdictions) ? scope.jurisdictions : [];
  const dataSources: string[]   = Array.isArray(scope.data_sources) ? scope.data_sources : [];
  const dateStart: string       = scope.date_range_start ?? '';
  const dateEnd: string         = scope.date_range_end ?? '';
  const dateLabel = dateStart || dateEnd ? `${dateStart || '—'} → ${dateEnd || 'Present'}` : 'Not defined';

  // Market KPIs
  const marketSizeB: number        = scope.market_size_b ?? 0;
  const ourSharePct: number        = scope.our_market_share_pct ?? 0;
  const ipStrengthScore: number    = scope.ip_strength_score ?? 0;
  const topSegment: string         = scope.top_segment ?? '';

  // Segment breakdown
  const segmentMap: Record<string, { growth_pct?: number; patent_count?: number }> = scope.segment_summary ?? {};
  const segmentEntries = Object.entries(segmentMap);
  const hasSegments = segmentEntries.length > 0;

  return (
    <div className="space-y-4">
      <StatusStrip project={project} getStatusColor={getStatusColor} getPriorityVariant={getPriorityVariant} />

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Scope — 2/3 */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <PieChart className="h-4 w-4 text-cyan-600" />
              Market Scope
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ScopeRow icon={BarChart3} label="Market Segments">
              <ChipList items={segments} emptyText="No segments defined" color="teal" />
            </ScopeRow>
            <ScopeRow icon={TrendingUp} label="Technology Areas">
              <ChipList items={techAreas} emptyText="All technology areas" color="blue" />
            </ScopeRow>
            <ScopeRow icon={Globe} label="Jurisdictions">
              <ChipList items={jurisdictions} emptyText="All jurisdictions" color="green" />
            </ScopeRow>
            <ScopeRow icon={CalendarRange} label="Date Range">
              <span className="text-xs font-medium">{dateLabel}</span>
            </ScopeRow>
            {dataSources.length > 0 && (
              <ScopeRow icon={Tag} label="Data Sources">
                <ChipList items={dataSources} emptyText="" color="purple" />
              </ScopeRow>
            )}

            {/* KPI strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t">
              {[
                { label: 'Market Size',    value: marketSizeB > 0 ? `$${marketSizeB}B` : '—' },
                { label: 'Our Share',      value: ourSharePct > 0 ? `${ourSharePct}%` : '—' },
                { label: 'IP Strength',    value: ipStrengthScore > 0 ? `${ipStrengthScore}/100` : '—' },
                { label: 'Top Segment',    value: topSegment || '—' },
              ].map(({ label, value }) => (
                <div key={label} className="rounded border px-2 py-1.5 text-center">
                  <p className="text-[10px] text-muted-foreground">{label}</p>
                  <p className="text-sm font-bold mt-0.5 truncate" title={String(value)}>{value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Right: Segment Breakdown + Coverage */}
        <div className="space-y-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Segment Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {hasSegments ? (
                <div className="space-y-2">
                  {segmentEntries.map(([name, data]) => {
                    const growth = data.growth_pct ?? null;
                    const patents = data.patent_count ?? null;
                    return (
                      <div key={name} className="space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium truncate mr-2">{name}</span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {growth !== null && (
                              <span className={`text-[10px] font-medium ${growth >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                {growth >= 0 ? '+' : ''}{growth}%
                              </span>
                            )}
                            {patents !== null && (
                              <span className="text-[10px] text-muted-foreground">{patents} patents</span>
                            )}
                          </div>
                        </div>
                        {growth !== null && (
                          <div className="h-1 bg-muted rounded overflow-hidden">
                            <div
                              className={`h-full rounded ${growth >= 20 ? 'bg-green-400' : growth >= 0 ? 'bg-blue-400' : 'bg-red-400'}`}
                              style={{ width: `${Math.min(Math.abs(growth), 100)}%` }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic text-center py-3">
                  Segment analysis not yet complete
                </p>
              )}
            </CardContent>
          </Card>

          <CoverageCard project={project} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <DescriptionCard description={project.description} />
        <div className="space-y-3">
          <TimelineCard project={project} />
          <TeamCard project={project} />
        </div>
      </div>
    </div>
  );
}
