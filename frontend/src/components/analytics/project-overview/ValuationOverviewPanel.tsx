'use client';

import { Scale, FileText, Tag, Percent, TrendingUp, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AnalyticsProject } from '@/services/analyticsApi';
import {
  ChipList, ScopeRow, StatusStrip, TimelineCard, TeamCard, CoverageCard, DescriptionCard,
} from './shared';

interface ValuationOverviewPanelProps {
  project: AnalyticsProject;
  getStatusColor: (status: string) => string;
  getPriorityVariant: (priority: string) => 'default' | 'secondary' | 'destructive' | 'outline';
}

export function ValuationOverviewPanel({ project, getStatusColor, getPriorityVariant }: ValuationOverviewPanelProps) {
  const scope = project.analysis_scope ?? {};

  const valuedPatents: string[]      = Array.isArray(scope.valued_patents) ? scope.valued_patents : [];
  const methods: string[]            = Array.isArray(scope.valuation_methods) ? scope.valuation_methods : [];
  const comparables: string[]        = Array.isArray(scope.comparable_transactions) ? scope.comparable_transactions : [];
  const techAreas: string[]          = Array.isArray(scope.technology_areas) ? scope.technology_areas : [];

  // Assumptions
  const royaltyRate: number          = scope.royalty_rate_pct ?? 0;
  const revenueBaseM: number         = scope.revenue_base_m ?? 0;
  const discountRate: number         = scope.discount_rate_pct ?? 0;
  const remainingLife: number        = scope.remaining_life_years ?? 0;

  // Scenario NPVs
  const scenarios: { bear?: number; base?: number; bull?: number } = scope.scenarios ?? {};
  const hasScenarios = scenarios.base !== undefined || scenarios.bear !== undefined || scenarios.bull !== undefined;

  const maxNPV = Math.max(scenarios.bull ?? 0, 1);

  const scenarioConfig = [
    { key: 'bear', label: 'Bear',  value: scenarios.bear, bar: 'bg-red-400',   text: 'text-red-600' },
    { key: 'base', label: 'Base',  value: scenarios.base, bar: 'bg-blue-500',  text: 'text-blue-600' },
    { key: 'bull', label: 'Bull',  value: scenarios.bull, bar: 'bg-green-400', text: 'text-green-600' },
  ] as const;

  return (
    <div className="space-y-4">
      <StatusStrip project={project} getStatusColor={getStatusColor} getPriorityVariant={getPriorityVariant} />

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Scope — 2/3 */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Scale className="h-4 w-4 text-orange-600" />
              Valuation Scope
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ScopeRow icon={FileText} label="Valued Patents">
              <ChipList items={valuedPatents} emptyText="No patents specified" color="orange" />
            </ScopeRow>
            <ScopeRow icon={BarChart3} label="Methodology">
              <ChipList items={methods} emptyText="No method selected" color="purple" />
            </ScopeRow>
            {comparables.length > 0 && (
              <ScopeRow icon={Tag} label="Comparables">
                <ChipList items={comparables} emptyText="" color="blue" />
              </ScopeRow>
            )}
            {techAreas.length > 0 && (
              <ScopeRow icon={TrendingUp} label="Tech Areas">
                <ChipList items={techAreas} emptyText="" color="teal" />
              </ScopeRow>
            )}

            {/* Assumptions KPI strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t">
              {[
                { label: 'Royalty Rate',    value: royaltyRate > 0 ? `${royaltyRate}%` : '—' },
                { label: 'Revenue Base',    value: revenueBaseM > 0 ? `$${revenueBaseM}M` : '—' },
                { label: 'Discount Rate',   value: discountRate > 0 ? `${discountRate}%` : '—' },
                { label: 'Remaining Life',  value: remainingLife > 0 ? `${remainingLife} yrs` : '—' },
              ].map(({ label, value }) => (
                <div key={label} className="rounded border px-2 py-1.5 text-center">
                  <p className="text-[10px] text-muted-foreground">{label}</p>
                  <p className="text-sm font-bold mt-0.5">{value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Right: Scenario NPV + Coverage */}
        <div className="space-y-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Percent className="h-3.5 w-3.5 text-orange-600" />
                NPV Scenarios
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {hasScenarios ? (
                <div className="space-y-3">
                  {/* Bar chart */}
                  <div className="flex items-end gap-2 h-16">
                    {scenarioConfig.map(({ key, label, value, bar, text }) => (
                      <div key={key} className="flex-1 flex flex-col items-center gap-1">
                        {value !== undefined && (
                          <span className={`text-[10px] font-semibold ${text}`}>
                            ${value}M
                          </span>
                        )}
                        <div
                          className={`w-full rounded-t ${bar} min-h-[4px]`}
                          style={{ height: value !== undefined ? `${Math.round((value / maxNPV) * 48)}px` : '4px' }}
                        />
                        <span className="text-[9px] text-muted-foreground">{label}</span>
                      </div>
                    ))}
                  </div>

                  {/* Range callout */}
                  {scenarios.bear !== undefined && scenarios.bull !== undefined && (
                    <div className="rounded border bg-muted/30 px-2 py-1.5 text-center">
                      <p className="text-[10px] text-muted-foreground">NPV Range</p>
                      <p className="text-sm font-bold">
                        <span className="text-red-500">${scenarios.bear}M</span>
                        <span className="text-muted-foreground mx-1">–</span>
                        <span className="text-green-600">${scenarios.bull}M</span>
                      </p>
                      {scenarios.base !== undefined && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          Base: <span className="font-semibold text-blue-600">${scenarios.base}M</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic text-center py-4">
                  Scenarios not yet modelled
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
