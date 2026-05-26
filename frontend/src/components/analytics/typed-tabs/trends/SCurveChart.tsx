'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { analyticsApi, TrendAnalysis, AreaTrend } from '@/services/analyticsApi';

type Stage = 'embryonic' | 'growth' | 'maturity' | 'decline';

interface SubDomainCurve {
  name: string;
  stage: Stage;
  filings: number[];   // yearly filing history
  cagr: number;        // % growth rate
  peakYear?: number;
}

function mapMaturityStage(stage: string): Stage {
  if (stage === 'emerging') return 'embryonic';
  if (stage === 'growing') return 'growth';
  if (stage === 'mature') return 'maturity';
  if (stage === 'declining') return 'decline';
  // 'unknown' — guess from growth rate
  return 'growth';
}

function transformTrendData(trend: TrendAnalysis): SubDomainCurve[] {
  return trend.area_trends.map((at: AreaTrend) => {
    const sorted = [...at.yearly_data].sort((a, b) => a.year - b.year);
    const filings = sorted.map((d) => d.count);
    const stage = mapMaturityStage(at.maturity_stage);

    // Find peak year for maturity/decline stages
    let peakYear: number | undefined;
    if (stage === 'maturity' || stage === 'decline') {
      const peak = sorted.reduce((m, d) => (d.count > m.count ? d : m), sorted[0]);
      peakYear = peak?.year;
    }

    return {
      name: at.name,
      stage,
      filings,
      cagr: Math.round(at.growth_rate),
      peakYear,
    };
  });
}

const STAGE_CONFIG: Record<Stage, { label: string; color: string; barColor: string }> = {
  embryonic: { label: 'Embryonic', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30', barColor: 'bg-blue-400' },
  growth: { label: 'Growth', color: 'bg-green-100 text-green-800 dark:bg-green-900/30', barColor: 'bg-green-400' },
  maturity: { label: 'Maturity', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30', barColor: 'bg-yellow-400' },
  decline: { label: 'Decline', color: 'bg-red-100 text-red-800 dark:bg-red-900/30', barColor: 'bg-red-400' },
};

interface SCurveChartProps {
  projectId: string;
  subDomains?: SubDomainCurve[];
}

export function SCurveChart({ projectId, subDomains: externalSubDomains }: SCurveChartProps) {
  const [fetchedSubDomains, setFetchedSubDomains] = useState<SubDomainCurve[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAnalysis = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await analyticsApi.forecastTrends(projectId);
      if (response.success && response.data && response.data.area_trends.length > 0) {
        setFetchedSubDomains(transformTrendData(response.data));
      } else {
        setError('No trend analysis data available');
      }
    } catch (err) {
      setError('Failed to load trend analysis');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (!externalSubDomains) {
      loadAnalysis();
    }
  }, [externalSubDomains, loadAnalysis]);

  const subDomains = externalSubDomains ?? fetchedSubDomains ?? [];
  const maxFiling = subDomains.length > 0 ? Math.max(...subDomains.flatMap((s) => s.filings), 1) : 1;

  // Derive year labels from the data (use the longest filings array)
  const longestFilings = subDomains.reduce((m, s) => s.filings.length > m ? s.filings.length : m, 0);
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: longestFilings }, (_, i) => String(currentYear - longestFilings + 1 + i));

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm">Technology S-Curve Chart</CardTitle>
            <p className="text-xs text-muted-foreground">
              Lifecycle stage of each technology sub-domain based on filing trend shape and CAGR.
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={loadAnalysis} disabled={loading} aria-label="Refresh trend analysis">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {loading && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
            <RefreshCw className="h-3 w-3 animate-spin" /> Running trend analysis...
          </div>
        )}
        {error && !loading && subDomains.length === 0 && (
          <p className="text-xs text-muted-foreground py-2">{error}</p>
        )}
        {subDomains.map((domain) => {
          const cfg = STAGE_CONFIG[domain.stage];
          return (
            <div key={domain.name} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium">{domain.name}</span>
                  <Badge className={`text-[10px] px-1.5 py-0 ${cfg.color}`}>{cfg.label}</Badge>
                  {domain.peakYear && (
                    <span className="text-[10px] text-muted-foreground">Peak: {domain.peakYear}</span>
                  )}
                </div>
                <span
                  className={`text-xs font-semibold ${
                    domain.cagr >= 0 ? 'text-green-600' : 'text-red-500'
                  }`}
                >
                  {domain.cagr >= 0 ? '+' : ''}{domain.cagr}% CAGR
                </span>
              </div>

              {/* Mini bar chart */}
              <div className="flex items-end gap-0.5 h-12 bg-muted/20 rounded-md px-1 pt-1">
                {domain.filings.map((v, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end gap-0.5">
                    <div
                      className={`w-full rounded-t ${cfg.barColor} min-h-[2px]`}
                      style={{ height: `${Math.round((v / maxFiling) * 100)}%` }}
                      title={`${years[i] ?? i}: ${v} filings`}
                    />
                  </div>
                ))}
              </div>

              {/* Year labels */}
              <div className="flex justify-between text-[9px] text-muted-foreground px-0.5">
                <span>{years[0] ?? ''}</span>
                <span>{years[Math.floor(years.length / 2)] ?? ''}</span>
                <span>{years[years.length - 1] ?? ''}</span>
              </div>
            </div>
          );
        })}

        {/* Stage legend */}
        <div className="flex flex-wrap gap-2 border-t pt-3">
          {(Object.entries(STAGE_CONFIG) as [Stage, typeof STAGE_CONFIG[Stage]][]).map(([stage, cfg]) => (
            <div key={stage} className="flex items-center gap-1">
              <div className={`w-3 h-3 rounded-sm ${cfg.barColor}`} />
              <span className="text-xs text-muted-foreground">{cfg.label}</span>
            </div>
          ))}
        </div>

        {/* Investment signals */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Investment Signals</p>
          {subDomains
            .filter((d) => d.stage === 'growth' || d.stage === 'embryonic')
            .map((d) => (
              <div key={d.name} className="flex items-center gap-2 text-xs rounded border px-2 py-1">
                <span className="text-green-600">●</span>
                <span className="font-medium">{d.name}</span>
                <span className="text-muted-foreground">— {d.stage} stage, +{d.cagr}% CAGR → invest now</span>
              </div>
            ))}
          {subDomains
            .filter((d) => d.stage === 'decline')
            .map((d) => (
              <div key={d.name} className="flex items-center gap-2 text-xs rounded border px-2 py-1">
                <span className="text-red-500">●</span>
                <span className="font-medium">{d.name}</span>
                <span className="text-muted-foreground">— declining, {d.cagr}% CAGR → review portfolio</span>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
