'use client';

import { Handshake, Globe, DollarSign, FileText, Tag, Users, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { AnalyticsProject } from '@/services/analyticsApi';
import {
  ChipList, ScopeRow, StatusStrip, TimelineCard, TeamCard, CoverageCard, DescriptionCard,
} from './shared';

interface LicensingOverviewPanelProps {
  project: AnalyticsProject;
  getStatusColor: (status: string) => string;
  getPriorityVariant: (priority: string) => 'default' | 'secondary' | 'destructive' | 'outline';
}

export function LicensingOverviewPanel({ project, getStatusColor, getPriorityVariant }: LicensingOverviewPanelProps) {
  const scope = project.analysis_scope ?? {};

  const licensedPatents: string[]  = Array.isArray(scope.licensed_patents) ? scope.licensed_patents : [];
  const targetLicensees: string[]  = Array.isArray(scope.target_licensees) ? scope.target_licensees : [];
  const territories: string[]      = Array.isArray(scope.territories) ? scope.territories
    : Array.isArray(scope.jurisdictions) ? scope.jurisdictions : [];
  const licenseTypes: string[]     = Array.isArray(scope.license_types) ? scope.license_types : [];
  const techAreas: string[]        = Array.isArray(scope.technology_areas) ? scope.technology_areas : [];

  // KPIs
  const royaltyMin: number         = scope.royalty_rate_min_pct ?? 0;
  const royaltyMax: number         = scope.royalty_rate_max_pct ?? 0;
  const annualRevenueM: number     = scope.annual_revenue_m ?? 0;
  const activeLicenses: number     = scope.active_licenses ?? 0;
  const pipelineTargets: number    = scope.pipeline_targets ?? targetLicensees.length;
  const gpProgress: number         = scope.georgia_pacific_progress ?? 0;

  const royaltyLabel = royaltyMin > 0 || royaltyMax > 0
    ? `${royaltyMin}% – ${royaltyMax}%`
    : '—';

  return (
    <div className="space-y-4">
      <StatusStrip project={project} getStatusColor={getStatusColor} getPriorityVariant={getPriorityVariant} />

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Scope — 2/3 */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Handshake className="h-4 w-4 text-indigo-600" />
              Licensing Scope
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ScopeRow icon={FileText} label="Licensed Patents">
              <ChipList items={licensedPatents} emptyText="No patents specified" color="indigo" />
            </ScopeRow>
            <ScopeRow icon={Users} label="Target Licensees">
              <ChipList items={targetLicensees} emptyText="No targets defined" color="blue" />
            </ScopeRow>
            <ScopeRow icon={Globe} label="Territories">
              <ChipList items={territories} emptyText="All territories" color="green" />
            </ScopeRow>
            <ScopeRow icon={Tag} label="License Types">
              <ChipList items={licenseTypes} emptyText="Not specified" color="purple" />
            </ScopeRow>
            {techAreas.length > 0 && (
              <ScopeRow icon={TrendingUp} label="Tech Areas">
                <ChipList items={techAreas} emptyText="" color="teal" />
              </ScopeRow>
            )}

            {/* KPI strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t">
              {[
                { label: 'Royalty Range',    value: royaltyLabel },
                { label: 'Annual Revenue',   value: annualRevenueM > 0 ? `$${annualRevenueM}M` : '—' },
                { label: 'Active Licenses',  value: activeLicenses > 0 ? activeLicenses : '—' },
                { label: 'Pipeline Targets', value: pipelineTargets > 0 ? pipelineTargets : '—' },
              ].map(({ label, value }) => (
                <div key={label} className="rounded border px-2 py-1.5 text-center">
                  <p className="text-[10px] text-muted-foreground">{label}</p>
                  <p className="text-sm font-bold mt-0.5">{value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Right: Georgia-Pacific + Coverage */}
        <div className="space-y-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <DollarSign className="h-3.5 w-3.5 text-indigo-600" />
                Royalty Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              {/* Royalty rate visual range */}
              {(royaltyMin > 0 || royaltyMax > 0) ? (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Rate Range</span>
                    <span className="font-semibold">{royaltyLabel}</span>
                  </div>
                  <div className="relative h-2 bg-muted rounded overflow-hidden">
                    <div
                      className="absolute h-full bg-indigo-300 rounded"
                      style={{
                        left: `${Math.min(royaltyMin * 5, 90)}%`,
                        width: `${Math.min((royaltyMax - royaltyMin) * 5, 30)}%`,
                      }}
                    />
                    <div
                      className="absolute h-full w-0.5 bg-indigo-600"
                      style={{ left: `${Math.min(((royaltyMin + royaltyMax) / 2) * 5, 90)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-muted-foreground">
                    <span>0%</span><span>10%</span><span>20%</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic text-center">Rate range not yet set</p>
              )}

              {/* Georgia-Pacific progress */}
              <div className="space-y-1 pt-2 border-t">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Georgia-Pacific Factors</span>
                  <span className="font-medium">{gpProgress}%</span>
                </div>
                <Progress value={gpProgress} className="h-1.5" />
                <p className="text-[10px] text-muted-foreground">
                  {gpProgress === 0
                    ? 'Factor assessment not started'
                    : gpProgress === 100
                    ? 'All 15 factors assessed'
                    : `${Math.round(gpProgress * 0.15)} of 15 factors assessed`}
                </p>
              </div>

              {/* Revenue summary */}
              {annualRevenueM > 0 && (
                <div className="pt-2 border-t space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Annual Revenue</span>
                    <span className="font-semibold text-green-600">${annualRevenueM}M</span>
                  </div>
                  {activeLicenses > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Active Licenses</span>
                      <span className="font-medium">{activeLicenses}</span>
                    </div>
                  )}
                </div>
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
