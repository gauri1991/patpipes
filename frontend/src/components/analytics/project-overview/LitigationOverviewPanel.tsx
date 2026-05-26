'use client';

import { Gavel, Building2, Globe, AlertTriangle, Calendar, Tag, Scale, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AnalyticsProject } from '@/services/analyticsApi';
import {
  ChipList, ScopeRow, StatusStrip, TimelineCard, TeamCard, CoverageCard, DescriptionCard,
} from './shared';

interface LitigationOverviewPanelProps {
  project: AnalyticsProject;
  getStatusColor: (status: string) => string;
  getPriorityVariant: (priority: string) => 'default' | 'secondary' | 'destructive' | 'outline';
}

const RISK_CONFIG = {
  high:   { label: 'High',   badge: 'bg-red-100 text-red-800',      dot: 'bg-red-500' },
  medium: { label: 'Medium', badge: 'bg-orange-100 text-orange-800', dot: 'bg-orange-400' },
  low:    { label: 'Low',    badge: 'bg-green-100 text-green-800',   dot: 'bg-green-500' },
};

const CASE_TYPE_CONFIG = {
  offensive:  { label: 'Offensive',  badge: 'bg-red-100 text-red-800' },
  defensive:  { label: 'Defensive',  badge: 'bg-blue-100 text-blue-800' },
  monitoring: { label: 'Monitoring', badge: 'bg-gray-100 text-gray-700' },
};

export function LitigationOverviewPanel({ project, getStatusColor, getPriorityVariant }: LitigationOverviewPanelProps) {
  const scope = project.analysis_scope ?? {};

  const assertedPatents: string[] = Array.isArray(scope.asserted_patents) ? scope.asserted_patents : [];
  const plaintiff: string         = scope.plaintiff ?? '';
  const defendant: string         = scope.defendant ?? '';
  const venue: string             = scope.venue ?? '';
  const caseType: string          = scope.case_type ?? '';
  const jurisdictions: string[]   = Array.isArray(scope.jurisdictions) ? scope.jurisdictions : [];
  const caseStatus: string        = scope.case_status ?? '';
  const damagesM: number          = scope.damages_estimate_m ?? 0;

  // Risk summary
  const riskSummary: { overall?: string; categories?: Record<string, string> } = scope.risk_summary ?? {};
  const overallRisk = riskSummary.overall ?? '';
  const riskCategories = Object.entries(riskSummary.categories ?? {});

  // Key dates
  const keyDates: Record<string, string> = scope.key_dates ?? {};
  const dateEntries = Object.entries(keyDates).filter(([, v]) => v);

  const overallRiskCfg = RISK_CONFIG[overallRisk as keyof typeof RISK_CONFIG];
  const caseTypeCfg = CASE_TYPE_CONFIG[caseType as keyof typeof CASE_TYPE_CONFIG];

  return (
    <div className="space-y-4">
      <StatusStrip project={project} getStatusColor={getStatusColor} getPriorityVariant={getPriorityVariant} />

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Scope — 2/3 */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Gavel className="h-4 w-4 text-red-600" />
              Case Scope
              {caseTypeCfg && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ml-1 ${caseTypeCfg.badge}`}>
                  {caseTypeCfg.label}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ScopeRow icon={FileText} label="Asserted Patents">
              <ChipList items={assertedPatents} emptyText="No patents specified" color="red" />
            </ScopeRow>
            {(plaintiff || defendant) && (
              <ScopeRow icon={Building2} label="Parties">
                <div className="flex flex-wrap gap-2 text-xs">
                  {plaintiff && (
                    <span>
                      <span className="text-muted-foreground">Plaintiff:</span>{' '}
                      <span className="font-medium">{plaintiff}</span>
                    </span>
                  )}
                  {defendant && (
                    <span>
                      <span className="text-muted-foreground">Defendant:</span>{' '}
                      <span className="font-medium">{defendant}</span>
                    </span>
                  )}
                </div>
              </ScopeRow>
            )}
            {venue && (
              <ScopeRow icon={Scale} label="Venue">
                <span className="text-xs font-medium">{venue}</span>
              </ScopeRow>
            )}
            <ScopeRow icon={Globe} label="Jurisdictions">
              <ChipList items={jurisdictions} emptyText="Not specified" color="purple" />
            </ScopeRow>

            {/* KPI strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t">
              {[
                { label: 'Asserted Patents', value: assertedPatents.length > 0 ? assertedPatents.length : '—' },
                { label: 'Est. Damages',     value: damagesM > 0 ? `$${damagesM}M` : '—' },
                { label: 'Case Status',      value: caseStatus ? caseStatus.replace(/_/g, ' ') : '—' },
                { label: 'Overall Risk',     value: overallRiskCfg?.label ?? '—' },
              ].map(({ label, value }) => (
                <div key={label} className="rounded border px-2 py-1.5 text-center">
                  <p className="text-[10px] text-muted-foreground">{label}</p>
                  <p className="text-sm font-bold mt-0.5 capitalize truncate" title={String(value)}>{value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Right: Risk + Key Dates + Coverage */}
        <div className="space-y-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
                Risk Exposure
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              {overallRiskCfg ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Overall Risk</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${overallRiskCfg.badge}`}>
                      {overallRiskCfg.label}
                    </span>
                  </div>
                  {riskCategories.length > 0 && (
                    <div className="space-y-1.5 pt-1 border-t">
                      {riskCategories.map(([cat, level]) => {
                        const cfg = RISK_CONFIG[level as keyof typeof RISK_CONFIG];
                        return (
                          <div key={cat} className="flex items-center justify-between">
                            <span className="text-xs capitalize">{cat.replace(/_/g, ' ')}</span>
                            <div className="flex items-center gap-1">
                              <span className={`w-1.5 h-1.5 rounded-full ${cfg?.dot ?? 'bg-gray-400'}`} />
                              <span className="text-[10px] text-muted-foreground">{cfg?.label ?? level}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-xs text-muted-foreground italic text-center py-2">
                  Risk assessment not yet complete
                </p>
              )}
            </CardContent>
          </Card>

          {dateEntries.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  Key Dates
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-1.5">
                {dateEntries.map(([key, date]) => (
                  <div key={key} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</span>
                    <span className="font-medium">{new Date(date).toLocaleDateString()}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

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
