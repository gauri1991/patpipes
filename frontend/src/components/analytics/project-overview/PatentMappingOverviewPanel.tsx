'use client';

import { Link2, FileText, Tag, Globe, Layers, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { AnalyticsProject } from '@/services/analyticsApi';
import {
  ChipList, ScopeRow, StatusStrip, TimelineCard, TeamCard, CoverageCard, DescriptionCard,
} from './shared';

interface PatentMappingOverviewPanelProps {
  project: AnalyticsProject;
  getStatusColor: (status: string) => string;
  getPriorityVariant: (priority: string) => 'default' | 'secondary' | 'destructive' | 'outline';
}

const MAPPING_TYPE_CONFIG: Record<string, { label: string; badge: string }> = {
  product:        { label: 'Product Mapping',       badge: 'bg-blue-100 text-blue-800' },
  standard:       { label: 'Standards Mapping',     badge: 'bg-purple-100 text-purple-800' },
  'claim-to-claim': { label: 'Claim-to-Claim',      badge: 'bg-orange-100 text-orange-800' },
  portfolio:      { label: 'Portfolio Mapping',     badge: 'bg-teal-100 text-teal-800' },
};

const COVERAGE_COLORS = [
  { threshold: 75, bar: 'bg-green-500',  label: 'Strong Coverage' },
  { threshold: 40, bar: 'bg-yellow-400', label: 'Partial Coverage' },
  { threshold: 0,  bar: 'bg-red-400',    label: 'Low Coverage' },
];

export function PatentMappingOverviewPanel({ project, getStatusColor, getPriorityVariant }: PatentMappingOverviewPanelProps) {
  const scope = project.analysis_scope ?? {};

  const mappedPatents: string[]   = Array.isArray(scope.mapped_patents) ? scope.mapped_patents : [];
  const targets: string[]         = Array.isArray(scope.mapping_targets) ? scope.mapping_targets : [];
  const techAreas: string[]       = Array.isArray(scope.technology_areas) ? scope.technology_areas : [];
  const jurisdictions: string[]   = Array.isArray(scope.jurisdictions) ? scope.jurisdictions : [];
  const mappingType: string       = scope.mapping_type ?? '';

  // Coverage metrics
  const coveragePct: number       = scope.coverage_pct ?? 0;
  const gapsIdentified: number    = scope.gaps_identified ?? 0;
  const totalClaims: number       = scope.total_claims ?? 0;

  // Mapping summary breakdown
  const summary: { mapped?: number; partial?: number; not_covered?: number } = scope.mapping_summary ?? {};
  const totalMapped = (summary.mapped ?? 0) + (summary.partial ?? 0) + (summary.not_covered ?? 0);
  const hasSummary  = totalMapped > 0;

  const typeCfg = MAPPING_TYPE_CONFIG[mappingType];
  const coverageColor = COVERAGE_COLORS.find((c) => coveragePct >= c.threshold)!;

  return (
    <div className="space-y-4">
      <StatusStrip project={project} getStatusColor={getStatusColor} getPriorityVariant={getPriorityVariant} />

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Scope — 2/3 */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Link2 className="h-4 w-4 text-emerald-600" />
              Mapping Scope
              {typeCfg && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ml-1 ${typeCfg.badge}`}>
                  {typeCfg.label}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ScopeRow icon={FileText} label="Mapped Patents">
              <ChipList items={mappedPatents} emptyText="No patents specified" color="indigo" />
            </ScopeRow>
            <ScopeRow icon={Layers} label="Mapping Targets">
              <ChipList items={targets} emptyText="No targets defined" color="teal" />
            </ScopeRow>
            {techAreas.length > 0 && (
              <ScopeRow icon={Tag} label="Tech Areas">
                <ChipList items={techAreas} emptyText="" color="blue" />
              </ScopeRow>
            )}
            <ScopeRow icon={Globe} label="Jurisdictions">
              <ChipList items={jurisdictions} emptyText="All jurisdictions" color="green" />
            </ScopeRow>

            {/* KPI strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t">
              {[
                { label: 'Patents in Scope', value: mappedPatents.length > 0 ? mappedPatents.length : '—' },
                { label: 'Mapping Targets',  value: targets.length > 0 ? targets.length : '—' },
                { label: 'Total Claims',     value: totalClaims > 0 ? totalClaims : '—' },
                { label: 'Gaps Found',       value: gapsIdentified > 0 ? gapsIdentified : '—' },
              ].map(({ label, value }) => (
                <div key={label} className="rounded border px-2 py-1.5 text-center">
                  <p className="text-[10px] text-muted-foreground">{label}</p>
                  <p className="text-sm font-bold mt-0.5">{value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Right: Coverage Status + Coverage breakdown */}
        <div className="space-y-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Coverage Status</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              {coveragePct > 0 ? (
                <>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Coverage</span>
                      <span className={`font-semibold ${coveragePct >= 75 ? 'text-green-600' : coveragePct >= 40 ? 'text-yellow-600' : 'text-red-500'}`}>
                        {coveragePct}%
                      </span>
                    </div>
                    <Progress value={coveragePct} className="h-2" />
                    <p className="text-[10px] text-muted-foreground">{coverageColor.label}</p>
                  </div>

                  {hasSummary && (
                    <div className="space-y-1.5 pt-2 border-t">
                      {[
                        { label: 'Fully Mapped',  value: summary.mapped ?? 0,       badge: 'bg-green-100 text-green-800',  icon: CheckCircle2 },
                        { label: 'Partial Match', value: summary.partial ?? 0,      badge: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
                        { label: 'Not Covered',   value: summary.not_covered ?? 0,  badge: 'bg-red-100 text-red-800',      icon: AlertCircle },
                      ].map(({ label, value, badge }) => (
                        <div key={label} className="flex items-center justify-between">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${badge}`}>{label}</span>
                          <span className="text-xs font-semibold">{value}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {gapsIdentified > 0 && (
                    <div className="flex items-center gap-1.5 rounded border border-orange-200 bg-orange-50 dark:bg-orange-950/20 px-2 py-1.5">
                      <AlertCircle className="h-3.5 w-3.5 text-orange-600 shrink-0" />
                      <p className="text-[10px] text-orange-700">
                        <span className="font-semibold">{gapsIdentified}</span> coverage gap{gapsIdentified !== 1 ? 's' : ''} identified
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center py-4 gap-1.5">
                  <CheckCircle2 className="h-8 w-8 text-muted-foreground/30" />
                  <p className="text-xs text-muted-foreground italic text-center">
                    Mapping not yet complete
                  </p>
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
