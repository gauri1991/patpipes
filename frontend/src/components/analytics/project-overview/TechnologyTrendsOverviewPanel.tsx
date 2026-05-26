'use client';

import { TrendingUp, Globe, CalendarRange, Tag, Database, Telescope } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AnalyticsProject } from '@/services/analyticsApi';
import {
  ChipList, ScopeRow, StatusStrip, TimelineCard, TeamCard, CoverageCard, DescriptionCard,
} from './shared';

interface TechnologyTrendsOverviewPanelProps {
  project: AnalyticsProject;
  getStatusColor: (status: string) => string;
  getPriorityVariant: (priority: string) => 'default' | 'secondary' | 'destructive' | 'outline';
}

const STAGE_CONFIG = {
  embryonic: { label: 'Embryonic', badge: 'bg-blue-100 text-blue-800',   dot: 'bg-blue-400' },
  growth:    { label: 'Growth',    badge: 'bg-green-100 text-green-800',  dot: 'bg-green-400' },
  maturity:  { label: 'Maturity',  badge: 'bg-yellow-100 text-yellow-800',dot: 'bg-yellow-400' },
  decline:   { label: 'Decline',   badge: 'bg-red-100 text-red-800',     dot: 'bg-red-400' },
};

export function TechnologyTrendsOverviewPanel({ project, getStatusColor, getPriorityVariant }: TechnologyTrendsOverviewPanelProps) {
  const scope = project.analysis_scope ?? {};

  const domains: string[]     = Array.isArray(scope.technology_domains) ? scope.technology_domains
    : Array.isArray(scope.technology_areas) ? scope.technology_areas : [];
  const subDomains: string[]  = Array.isArray(scope.sub_domains) ? scope.sub_domains : [];
  const jurisdictions: string[] = Array.isArray(scope.jurisdictions) ? scope.jurisdictions : [];
  const dataSources: string[] = Array.isArray(scope.data_sources) ? scope.data_sources : [];
  const dateStart: string     = scope.date_range_start ?? '';
  const dateEnd: string       = scope.date_range_end ?? '';
  const forecastYears: number = scope.forecast_years ?? 0;
  const dateLabel = dateStart || dateEnd ? `${dateStart || '—'} → ${dateEnd || 'Present'}` : 'Not defined';

  // Trend summary — stage per domain
  const stageMap: Record<string, string> = scope.stage_summary ?? {};
  const stageEntries = Object.entries(stageMap);

  // Aggregate signals
  const trendSignals: { growing?: string[]; declining?: string[]; emerging?: string[] } = scope.trend_summary ?? {};
  const hasSignals = (trendSignals.growing?.length ?? 0) + (trendSignals.declining?.length ?? 0) + (trendSignals.emerging?.length ?? 0) > 0;

  return (
    <div className="space-y-4">
      <StatusStrip project={project} getStatusColor={getStatusColor} getPriorityVariant={getPriorityVariant} />

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Scope — 2/3 */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              Trend Scope
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ScopeRow icon={Tag} label="Technology Domains">
              <ChipList items={domains} emptyText="No domains defined" color="purple" />
            </ScopeRow>
            {subDomains.length > 0 && (
              <ScopeRow icon={Tag} label="Sub-Domains">
                <ChipList items={subDomains} emptyText="" color="indigo" />
              </ScopeRow>
            )}
            <ScopeRow icon={Globe} label="Jurisdictions">
              <ChipList items={jurisdictions} emptyText="All jurisdictions" color="green" />
            </ScopeRow>
            <ScopeRow icon={CalendarRange} label="Date Range">
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium">{dateLabel}</span>
                {forecastYears > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">
                    +{forecastYears}yr forecast
                  </span>
                )}
              </div>
            </ScopeRow>
            {dataSources.length > 0 && (
              <ScopeRow icon={Database} label="Data Sources">
                <ChipList items={dataSources} emptyText="" color="blue" />
              </ScopeRow>
            )}

            {/* Domain count strip */}
            <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t">
              {[
                { label: 'Domains', value: domains.length || '—' },
                { label: 'Sub-Domains', value: subDomains.length || '—' },
                { label: 'Forecast', value: forecastYears > 0 ? `${forecastYears} yrs` : '—' },
              ].map(({ label, value }) => (
                <div key={label} className="rounded border px-2 py-1.5 text-center">
                  <p className="text-[10px] text-muted-foreground">{label}</p>
                  <p className="text-sm font-bold mt-0.5">{value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Right: Lifecycle Stages + Coverage */}
        <div className="space-y-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Telescope className="h-3.5 w-3.5 text-purple-600" />
                Lifecycle Signals
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {stageEntries.length > 0 ? (
                <div className="space-y-1.5">
                  {stageEntries.map(([domain, stage]) => {
                    const cfg = STAGE_CONFIG[stage as keyof typeof STAGE_CONFIG];
                    return (
                      <div key={domain} className="flex items-center justify-between gap-2">
                        <span className="text-xs truncate">{domain}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${cfg?.badge ?? 'bg-muted text-muted-foreground'}`}>
                          {cfg?.label ?? stage}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : hasSignals ? (
                <div className="space-y-2">
                  {trendSignals.emerging && trendSignals.emerging.length > 0 && (
                    <div>
                      <p className="text-[10px] text-muted-foreground mb-1">Emerging</p>
                      <ChipList items={trendSignals.emerging} emptyText="" color="blue" />
                    </div>
                  )}
                  {trendSignals.growing && trendSignals.growing.length > 0 && (
                    <div>
                      <p className="text-[10px] text-muted-foreground mb-1">Growing</p>
                      <ChipList items={trendSignals.growing} emptyText="" color="green" />
                    </div>
                  )}
                  {trendSignals.declining && trendSignals.declining.length > 0 && (
                    <div>
                      <p className="text-[10px] text-muted-foreground mb-1">Declining</p>
                      <ChipList items={trendSignals.declining} emptyText="" color="red" />
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic text-center py-3">
                  Trend analysis not yet complete
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
