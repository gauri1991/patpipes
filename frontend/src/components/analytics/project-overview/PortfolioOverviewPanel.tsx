'use client';

import { BarChart3, Globe, DollarSign, Star, Layers, Tag, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AnalyticsProject } from '@/services/analyticsApi';
import {
  ChipList, ScopeRow, StatusStrip, TimelineCard, TeamCard, CoverageCard, DescriptionCard,
} from './shared';

interface PortfolioOverviewPanelProps {
  project: AnalyticsProject;
  getStatusColor: (status: string) => string;
  getPriorityVariant: (priority: string) => 'default' | 'secondary' | 'destructive' | 'outline';
}

const TIER_CONFIG = {
  A: { label: 'Tier A — Crown Jewels', bg: 'bg-green-500',  badge: 'bg-green-100 text-green-800' },
  B: { label: 'Tier B — Core Assets',  bg: 'bg-blue-500',   badge: 'bg-blue-100 text-blue-800' },
  C: { label: 'Tier C — Supporting',   bg: 'bg-yellow-400', badge: 'bg-yellow-100 text-yellow-800' },
  D: { label: 'Tier D — Pruning',      bg: 'bg-red-400',    badge: 'bg-red-100 text-red-800' },
};

export function PortfolioOverviewPanel({ project, getStatusColor, getPriorityVariant }: PortfolioOverviewPanelProps) {
  const scope = project.analysis_scope ?? {};

  const portfolioName: string       = scope.portfolio_name ?? scope.portfolio ?? '';
  const criteria: string[]          = Array.isArray(scope.assessment_criteria) ? scope.assessment_criteria : [];
  const jurisdictions: string[]     = Array.isArray(scope.jurisdictions) ? scope.jurisdictions : [];
  const technologyAreas: string[]   = Array.isArray(scope.technology_areas) ? scope.technology_areas : [];

  // Portfolio stats from scope
  const totalPatents: number        = scope.total_patents ?? 0;
  const activePatents: number       = scope.active_patents ?? 0;
  const avgQuality: number          = scope.avg_quality_score ?? 0;
  const annualCostK: number         = scope.annual_maintenance_cost_k ?? 0;

  // Tier breakdown
  const tiers: Record<string, number> = scope.tier_summary ?? { A: 0, B: 0, C: 0, D: 0 };
  const totalTiered = Object.values(tiers).reduce((s, v) => s + v, 0);
  const hasTiers = totalTiered > 0;

  const activeRatio = totalPatents > 0 ? Math.round((activePatents / totalPatents) * 100) : 0;

  return (
    <div className="space-y-4">
      <StatusStrip project={project} getStatusColor={getStatusColor} getPriorityVariant={getPriorityVariant} />

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Scope — 2/3 */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-yellow-600" />
              Portfolio Scope
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {portfolioName && (
              <ScopeRow icon={Layers} label="Portfolio">
                <span className="text-xs font-semibold">{portfolioName}</span>
              </ScopeRow>
            )}
            <ScopeRow icon={Star} label="Assessment Criteria">
              <ChipList items={criteria} emptyText="No criteria defined" color="orange" />
            </ScopeRow>
            <ScopeRow icon={Globe} label="Jurisdictions">
              <ChipList items={jurisdictions} emptyText="All jurisdictions" color="green" />
            </ScopeRow>
            {technologyAreas.length > 0 && (
              <ScopeRow icon={Tag} label="Tech Areas">
                <ChipList items={technologyAreas} emptyText="" color="blue" />
              </ScopeRow>
            )}

            {/* Key metrics inline */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t">
              {[
                { label: 'Total Patents', value: totalPatents > 0 ? totalPatents.toString() : '—' },
                { label: 'Active', value: totalPatents > 0 ? `${activePatents} (${activeRatio}%)` : '—' },
                { label: 'Avg Quality', value: avgQuality > 0 ? `${avgQuality}/100` : '—' },
                { label: 'Annual Cost', value: annualCostK > 0 ? `$${annualCostK}K` : '—' },
              ].map(({ label, value }) => (
                <div key={label} className="rounded border px-2 py-1.5 text-center">
                  <p className="text-[10px] text-muted-foreground">{label}</p>
                  <p className="text-sm font-bold mt-0.5">{value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Right: Tier Breakdown + Coverage */}
        <div className="space-y-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Tier Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {hasTiers ? (
                <div className="space-y-2">
                  {/* Stacked bar */}
                  <div className="h-3 flex rounded overflow-hidden gap-0.5">
                    {(Object.entries(tiers) as [string, number][])
                      .filter(([, v]) => v > 0)
                      .map(([tier, v]) => (
                        <div
                          key={tier}
                          className={TIER_CONFIG[tier as keyof typeof TIER_CONFIG]?.bg ?? 'bg-gray-300'}
                          style={{ width: `${Math.round((v / totalTiered) * 100)}%` }}
                          title={`${TIER_CONFIG[tier as keyof typeof TIER_CONFIG]?.label}: ${v}`}
                        />
                      ))}
                  </div>
                  <div className="space-y-1.5 mt-1">
                    {(Object.entries(tiers) as [string, number][]).map(([tier, count]) => {
                      const cfg = TIER_CONFIG[tier as keyof typeof TIER_CONFIG];
                      if (!cfg) return null;
                      return (
                        <div key={tier} className="flex items-center justify-between">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${cfg.badge}`}>{cfg.label}</span>
                          <span className="text-xs font-semibold">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic text-center py-3">
                  Tier classification not yet complete
                </p>
              )}
            </CardContent>
          </Card>

          <CoverageCard
            project={project}
            extra={[{ icon: Users, label: 'Competitors', value: project.competitors?.length ?? 0 }]}
          />
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
