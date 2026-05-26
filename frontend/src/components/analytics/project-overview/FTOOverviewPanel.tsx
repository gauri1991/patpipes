'use client';

import {
  ShieldCheck, Globe, CalendarRange, Cpu, AlertTriangle, CheckCircle2, List,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AnalyticsProject } from '@/services/analyticsApi';
import {
  ChipList, ScopeRow, StatusStrip, TimelineCard, TeamCard, CoverageCard, DescriptionCard,
} from './shared';

interface FTOOverviewPanelProps {
  project: AnalyticsProject;
  getStatusColor: (status: string) => string;
  getPriorityVariant: (priority: string) => 'default' | 'secondary' | 'destructive' | 'outline';
}

const RISK_CONFIG = {
  high:   { label: 'High Risk',   bg: 'bg-red-500',    badge: 'bg-red-100 text-red-800' },
  medium: { label: 'Medium Risk', bg: 'bg-orange-400', badge: 'bg-orange-100 text-orange-800' },
  low:    { label: 'Low Risk',    bg: 'bg-yellow-400', badge: 'bg-yellow-100 text-yellow-800' },
  clear:  { label: 'Clear',       bg: 'bg-green-500',  badge: 'bg-green-100 text-green-800' },
};

export function FTOOverviewPanel({ project, getStatusColor, getPriorityVariant }: FTOOverviewPanelProps) {
  const scope = project.analysis_scope ?? {};

  const productName: string   = scope.product_name ?? scope.product ?? '';
  const productDesc: string   = scope.product_description ?? '';
  const features: string[]    = Array.isArray(scope.features) ? scope.features : [];
  const jurisdictions: string[] = Array.isArray(scope.jurisdictions) ? scope.jurisdictions : [];
  const watchPatents: string[] = Array.isArray(scope.watch_patents) ? scope.watch_patents
    : Array.isArray(scope.competitor_patents) ? scope.competitor_patents : [];
  const activeOnly: boolean   = scope.active_patents_only ?? true;
  const expiryDate: string    = scope.expiry_cutoff ?? scope.date_cutoff ?? '';
  const riskSummary: Record<string, number> = scope.risk_summary ?? { high: 0, medium: 0, low: 0, clear: 0 };
  const totalRisked = Object.values(riskSummary).reduce((s, v) => s + v, 0);

  return (
    <div className="space-y-4">
      <StatusStrip project={project} getStatusColor={getStatusColor} getPriorityVariant={getPriorityVariant} />

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Scope — 2/3 */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-blue-600" />
              FTO Scope
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {productName && (
              <ScopeRow icon={Cpu} label="Product / Process">
                <span className="text-xs font-semibold">{productName}</span>
                {productDesc && <p className="text-[10px] text-muted-foreground mt-0.5">{productDesc}</p>}
              </ScopeRow>
            )}
            <ScopeRow icon={List} label="Features">
              <ChipList items={features} emptyText="No features defined" color="blue" />
            </ScopeRow>
            <ScopeRow icon={Globe} label="Jurisdictions">
              <ChipList items={jurisdictions} emptyText="All jurisdictions" color="green" />
            </ScopeRow>
            <ScopeRow icon={CalendarRange} label="Expiry Cutoff">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium">
                  {expiryDate ? new Date(expiryDate).toLocaleDateString() : 'Not set'}
                </span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeOnly ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}>
                  {activeOnly ? 'Active patents only' : 'All patents'}
                </span>
              </div>
            </ScopeRow>
            {watchPatents.length > 0 && (
              <ScopeRow icon={AlertTriangle} label="Watch Patents">
                <ChipList items={watchPatents} emptyText="" color="red" />
              </ScopeRow>
            )}
          </CardContent>
        </Card>

        {/* Right: Risk Summary + Coverage */}
        <div className="space-y-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Risk Summary</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {totalRisked > 0 ? (
                <div className="space-y-2">
                  <div className="h-3 flex rounded overflow-hidden gap-0.5">
                    {(Object.entries(riskSummary) as [string, number][])
                      .filter(([, v]) => v > 0)
                      .map(([key, v]) => (
                        <div
                          key={key}
                          className={RISK_CONFIG[key as keyof typeof RISK_CONFIG]?.bg ?? 'bg-gray-300'}
                          style={{ width: `${Math.round((v / totalRisked) * 100)}%` }}
                          title={`${RISK_CONFIG[key as keyof typeof RISK_CONFIG]?.label}: ${v}`}
                        />
                      ))}
                  </div>
                  <div className="space-y-1.5 mt-2">
                    {(Object.entries(riskSummary) as [string, number][]).map(([key, v]) => {
                      const cfg = RISK_CONFIG[key as keyof typeof RISK_CONFIG];
                      if (!cfg) return null;
                      return (
                        <div key={key} className="flex items-center justify-between">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${cfg.badge}`}>{cfg.label}</span>
                          <span className="text-xs font-semibold">{v}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center py-3 gap-1">
                  <CheckCircle2 className="h-8 w-8 text-muted-foreground/40" />
                  <p className="text-xs text-muted-foreground text-center">Risk assessment not yet complete</p>
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
