'use client';

import { Target, Globe, TrendingUp, Tag, Eye, Trophy, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AnalyticsProject } from '@/services/analyticsApi';
import {
  ChipList, ScopeRow, StatusStrip, TimelineCard, TeamCard, CoverageCard, DescriptionCard,
} from './shared';

interface CompetitiveOverviewPanelProps {
  project: AnalyticsProject;
  getStatusColor: (status: string) => string;
  getPriorityVariant: (priority: string) => 'default' | 'secondary' | 'destructive' | 'outline';
}

const VELOCITY_CONFIG = {
  accelerating: { label: '↑ Accelerating', badge: 'bg-green-100 text-green-800' },
  stable:       { label: '→ Stable',        badge: 'bg-yellow-100 text-yellow-800' },
  declining:    { label: '↓ Declining',     badge: 'bg-red-100 text-red-800' },
};

export function CompetitiveOverviewPanel({ project, getStatusColor, getPriorityVariant }: CompetitiveOverviewPanelProps) {
  const scope = project.analysis_scope ?? {};

  const trackedCompetitors: string[] = Array.isArray(scope.tracked_competitors) ? scope.tracked_competitors
    : Array.isArray(scope.competitors) ? scope.competitors : [];
  const techAreas: string[]          = Array.isArray(scope.technology_areas) ? scope.technology_areas : [];
  const jurisdictions: string[]      = Array.isArray(scope.jurisdictions) ? scope.jurisdictions : [];
  const monitoringFocus: string[]    = Array.isArray(scope.monitoring_focus) ? scope.monitoring_focus : [];
  const dateStart: string            = scope.date_range_start ?? '';
  const dateEnd: string              = scope.date_range_end ?? '';
  const dateLabel = dateStart || dateEnd ? `${dateStart || '—'} → ${dateEnd || 'Present'}` : 'Not defined';

  // Benchmark summary
  const benchmark: {
    leading?: string;
    our_rank?: number;
    total_tracked?: number;
    our_velocity?: string;
  } = scope.benchmark_summary ?? {};

  const hasRanking = benchmark.our_rank !== undefined && benchmark.total_tracked !== undefined;

  // Velocity breakdown per competitor
  const velocityMap: Record<string, string> = scope.velocity_summary ?? {};
  const velocityEntries = Object.entries(velocityMap);

  return (
    <div className="space-y-4">
      <StatusStrip project={project} getStatusColor={getStatusColor} getPriorityVariant={getPriorityVariant} />

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Scope — 2/3 */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4 text-red-600" />
              Intelligence Scope
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ScopeRow icon={Users} label="Tracked Competitors">
              <ChipList items={trackedCompetitors} emptyText="No competitors defined" color="red" />
            </ScopeRow>
            <ScopeRow icon={TrendingUp} label="Technology Areas">
              <ChipList items={techAreas} emptyText="All technology areas" color="blue" />
            </ScopeRow>
            <ScopeRow icon={Globe} label="Jurisdictions">
              <ChipList items={jurisdictions} emptyText="All jurisdictions" color="green" />
            </ScopeRow>
            <ScopeRow icon={Eye} label="Monitoring Focus">
              <ChipList items={monitoringFocus} emptyText="General monitoring" color="purple" />
            </ScopeRow>
            <ScopeRow icon={Tag} label="Date Range">
              <span className="text-xs font-medium">{dateLabel}</span>
            </ScopeRow>

            {/* Competitor count strip */}
            <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t">
              {[
                { label: 'Tracked', value: trackedCompetitors.length > 0 ? trackedCompetitors.length : project.competitors?.length ?? 0 },
                { label: 'Tech Areas', value: techAreas.length || '—' },
                { label: 'Jurisdictions', value: jurisdictions.length > 0 ? jurisdictions.length : 'All' },
              ].map(({ label, value }) => (
                <div key={label} className="rounded border px-2 py-1.5 text-center">
                  <p className="text-[10px] text-muted-foreground">{label}</p>
                  <p className="text-sm font-bold mt-0.5">{value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Right: Positioning + Coverage */}
        <div className="space-y-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Trophy className="h-3.5 w-3.5 text-yellow-500" />
                Competitive Position
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              {hasRanking ? (
                <>
                  {/* Rank indicator */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Our IP Rank</span>
                    <span className="text-lg font-bold">
                      #{benchmark.our_rank}
                      <span className="text-xs text-muted-foreground font-normal ml-1">
                        of {benchmark.total_tracked}
                      </span>
                    </span>
                  </div>

                  {/* Rank bar */}
                  <div className="h-2 bg-muted rounded overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded"
                      style={{
                        width: `${Math.round(
                          ((benchmark.total_tracked! - benchmark.our_rank! + 1) / benchmark.total_tracked!) * 100,
                        )}%`,
                      }}
                    />
                  </div>

                  {benchmark.leading && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Market Leader</span>
                      <span className="font-medium truncate ml-2">{benchmark.leading}</span>
                    </div>
                  )}

                  {benchmark.our_velocity && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Our Velocity</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${VELOCITY_CONFIG[benchmark.our_velocity as keyof typeof VELOCITY_CONFIG]?.badge ?? 'bg-muted text-muted-foreground'}`}>
                        {VELOCITY_CONFIG[benchmark.our_velocity as keyof typeof VELOCITY_CONFIG]?.label ?? benchmark.our_velocity}
                      </span>
                    </div>
                  )}
                </>
              ) : velocityEntries.length > 0 ? (
                <div className="space-y-1.5">
                  {velocityEntries.slice(0, 4).map(([name, vel]) => {
                    const cfg = VELOCITY_CONFIG[vel as keyof typeof VELOCITY_CONFIG];
                    return (
                      <div key={name} className="flex items-center justify-between">
                        <span className="text-xs truncate mr-2">{name}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${cfg?.badge ?? 'bg-muted text-muted-foreground'}`}>
                          {cfg?.label ?? vel}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic text-center py-3">
                  Benchmarking not yet complete
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
