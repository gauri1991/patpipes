'use client';

import { DollarSign, Building2, CheckSquare, AlertTriangle, ShieldCheck, Tag, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { AnalyticsProject } from '@/services/analyticsApi';
import {
  ChipList, ScopeRow, StatusStrip, TimelineCard, TeamCard, CoverageCard, DescriptionCard,
} from './shared';

interface InvestmentOverviewPanelProps {
  project: AnalyticsProject;
  getStatusColor: (status: string) => string;
  getPriorityVariant: (priority: string) => 'default' | 'secondary' | 'destructive' | 'outline';
}

const RISK_CONFIG = {
  low:    { label: 'Low Risk',    badge: 'bg-green-100 text-green-800',  bar: 'bg-green-500' },
  medium: { label: 'Medium Risk', badge: 'bg-yellow-100 text-yellow-800', bar: 'bg-yellow-400' },
  high:   { label: 'High Risk',   badge: 'bg-red-100 text-red-800',      bar: 'bg-red-500' },
};

export function InvestmentOverviewPanel({ project, getStatusColor, getPriorityVariant }: InvestmentOverviewPanelProps) {
  const scope = project.analysis_scope ?? {};

  const targetCompany: string     = scope.target_company ?? '';
  const targetPortfolio: string   = scope.target_portfolio ?? '';
  const thesis: string            = scope.investment_thesis ?? '';
  const ddAreas: string[]         = Array.isArray(scope.due_diligence_areas) ? scope.due_diligence_areas : [];
  const techAreas: string[]       = Array.isArray(scope.technology_areas) ? scope.technology_areas : [];

  // KPIs
  const portfolioValueM: number   = scope.portfolio_value_m ?? 0;
  const qualityScore: number      = scope.quality_score ?? 0;
  const riskLevel: string         = scope.risk_level ?? '';
  const encumberedPct: number     = scope.encumbered_pct ?? 0;
  const totalPatents: number      = scope.total_patents ?? 0;

  // Due diligence checklist
  const ddChecklist: Record<string, boolean> = scope.dd_checklist ?? {};
  const ddItems = Object.entries(ddChecklist);
  const ddComplete = ddItems.filter(([, v]) => v).length;
  const ddTotal = ddItems.length;
  const ddPct = ddTotal > 0 ? Math.round((ddComplete / ddTotal) * 100) : 0;

  const riskCfg = RISK_CONFIG[riskLevel as keyof typeof RISK_CONFIG];

  return (
    <div className="space-y-4">
      <StatusStrip project={project} getStatusColor={getStatusColor} getPriorityVariant={getPriorityVariant} />

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Scope — 2/3 */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              Investment Scope
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {targetCompany && (
              <ScopeRow icon={Building2} label="Target Company">
                <span className="text-xs font-semibold">{targetCompany}</span>
              </ScopeRow>
            )}
            {targetPortfolio && (
              <ScopeRow icon={Tag} label="Target Portfolio">
                <span className="text-xs font-medium">{targetPortfolio}</span>
              </ScopeRow>
            )}
            {thesis && (
              <ScopeRow icon={TrendingUp} label="Investment Thesis">
                <p className="text-xs text-muted-foreground leading-snug">{thesis}</p>
              </ScopeRow>
            )}
            <ScopeRow icon={CheckSquare} label="DD Areas">
              <ChipList items={ddAreas} emptyText="No due diligence areas defined" color="indigo" />
            </ScopeRow>
            {techAreas.length > 0 && (
              <ScopeRow icon={Tag} label="Tech Areas">
                <ChipList items={techAreas} emptyText="" color="blue" />
              </ScopeRow>
            )}

            {/* KPI strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t">
              {[
                { label: 'Est. Portfolio Value', value: portfolioValueM > 0 ? `$${portfolioValueM}M` : '—' },
                { label: 'Quality Score',        value: qualityScore > 0 ? `${qualityScore}/100` : '—' },
                { label: 'Total Patents',         value: totalPatents > 0 ? totalPatents : '—' },
                { label: 'Encumbered',            value: encumberedPct > 0 ? `${encumberedPct}%` : '—' },
              ].map(({ label, value }) => (
                <div key={label} className="rounded border px-2 py-1.5 text-center">
                  <p className="text-[10px] text-muted-foreground">{label}</p>
                  <p className="text-sm font-bold mt-0.5">{value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Right: DD Progress + Risk + Coverage */}
        <div className="space-y-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-green-600" />
                Due Diligence
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              {/* Risk level */}
              {riskCfg ? (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Risk Level</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${riskCfg.badge}`}>
                    {riskCfg.label}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>Risk not yet assessed</span>
                </div>
              )}

              {/* DD checklist progress */}
              {ddTotal > 0 ? (
                <>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Checklist Progress</span>
                      <span className="font-medium">{ddComplete}/{ddTotal}</span>
                    </div>
                    <Progress value={ddPct} className="h-1.5" />
                  </div>
                  <div className="space-y-1 max-h-28 overflow-y-auto">
                    {ddItems.map(([item, done]) => (
                      <div key={item} className="flex items-center gap-1.5 text-[10px]">
                        <span className={done ? 'text-green-500' : 'text-muted-foreground'}>
                          {done ? '✓' : '○'}
                        </span>
                        <span className={done ? 'text-foreground' : 'text-muted-foreground line-through'}>{item}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-xs text-muted-foreground italic text-center py-2">
                  Checklist not yet defined
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
