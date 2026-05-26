'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { analyticsApi, LandscapeAnalysis } from '@/services/analyticsApi';

interface AssigneeStat {
  name: string;
  count: number;
  share: number; // %
  trend: 'up' | 'stable' | 'down';
}

interface TechAreaStat {
  name: string;
  count: number;
  pct: number;
}

interface YearStat {
  year: string;
  count: number;
}

function transformLandscapeData(landscape: LandscapeAnalysis): {
  filingTrend: YearStat[];
  topAssignees: AssigneeStat[];
  techAreas: TechAreaStat[];
} {
  // Filing trend from evolution data
  const filingTrend: YearStat[] = landscape.evolution.map((e) => ({
    year: String(e.year),
    count: e.count,
  }));

  // Tech areas from clusters
  const totalPatents = landscape.total_patents || 1;
  const techAreas: TechAreaStat[] = landscape.clusters
    .sort((a, b) => b.patent_count - a.patent_count)
    .slice(0, 6)
    .map((c) => ({
      name: c.name,
      count: c.patent_count,
      pct: Math.round((c.patent_count / totalPatents) * 100),
    }));

  // Assignees from geographic_distribution (best available proxy)
  // or derive from clusters if geo data is sparse
  const geoEntries = Object.entries(landscape.geographic_distribution)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6);
  const geoTotal = geoEntries.reduce((s, [, v]) => s + v, 0) || 1;
  const topAssignees: AssigneeStat[] = geoEntries.map(([name, count]) => ({
    name,
    count,
    share: Math.round((count / geoTotal) * 100),
    trend: 'stable' as const,
  }));

  return { filingTrend, topAssignees, techAreas };
}

const TECH_COLORS = ['bg-blue-400', 'bg-green-400', 'bg-purple-400', 'bg-orange-400', 'bg-red-400', 'bg-gray-400'];

interface LandscapeChartSuiteProps {
  projectId: string;
  filingTrend?: YearStat[];
  topAssignees?: AssigneeStat[];
  techAreas?: TechAreaStat[];
}

type ActiveChart = 'trend' | 'assignees' | 'technology';

export function LandscapeChartSuite({
  projectId,
  filingTrend: externalFilingTrend,
  topAssignees: externalTopAssignees,
  techAreas: externalTechAreas,
}: LandscapeChartSuiteProps) {
  const [fetchedData, setFetchedData] = useState<{
    filingTrend: YearStat[];
    topAssignees: AssigneeStat[];
    techAreas: TechAreaStat[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAnalysis = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await analyticsApi.analyzeLandscape(projectId);
      if (response.success && response.data) {
        setFetchedData(transformLandscapeData(response.data));
      } else {
        setError('No landscape analysis data available');
      }
    } catch (err) {
      setError('Failed to load landscape analysis');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (!externalFilingTrend && !externalTopAssignees && !externalTechAreas) {
      loadAnalysis();
    }
  }, [externalFilingTrend, externalTopAssignees, externalTechAreas, loadAnalysis]);

  const filingTrend = externalFilingTrend ?? fetchedData?.filingTrend ?? [];
  const topAssignees = externalTopAssignees ?? fetchedData?.topAssignees ?? [];
  const techAreas = externalTechAreas ?? fetchedData?.techAreas ?? [];
  const [active, setActive] = useState<ActiveChart>('trend');

  const maxCount = filingTrend.length > 0 ? Math.max(...filingTrend.map((y) => y.count), 1) : 1;
  const maxAssigneeCount = topAssignees.length > 0 ? Math.max(...topAssignees.map((a) => a.count), 1) : 1;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm">Landscape Chart Suite</CardTitle>
            <p className="text-xs text-muted-foreground">
              Filing trend, top assignees, and technology area distribution for the analyzed landscape.
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={loadAnalysis} disabled={loading} aria-label="Refresh landscape analysis">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
            <RefreshCw className="h-3 w-3 animate-spin" /> Running landscape analysis...
          </div>
        )}
        {error && !loading && filingTrend.length === 0 && (
          <p className="text-xs text-muted-foreground py-2">{error}</p>
        )}
        {/* Chart selector */}
        <div className="flex gap-1">
          {(['trend', 'assignees', 'technology'] as ActiveChart[]).map((c) => (
            <button
              key={c}
              onClick={() => setActive(c)}
              className={`flex-1 rounded-md px-2 py-1 text-xs border transition-colors ${
                active === c ? 'bg-foreground text-background border-foreground' : 'hover:bg-muted/50'
              }`}
            >
              {c === 'trend' ? 'Filing Trend' : c === 'assignees' ? 'Top Assignees' : 'Tech Areas'}
            </button>
          ))}
        </div>

        {/* Filing Trend */}
        {active === 'trend' && (
          <div className="space-y-2">
            <div className="flex items-end gap-0.5 h-28 bg-muted/10 rounded-md px-2 pt-2 pb-1">
              {filingTrend.map(({ year, count }) => (
                <div key={year} className="flex-1 flex flex-col items-center justify-end gap-0.5">
                  <div
                    className="w-full rounded-t bg-blue-400 opacity-80 min-h-[2px]"
                    style={{ height: `${Math.round((count / maxCount) * 100)}%` }}
                    title={`${year}: ${count} filings`}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between px-2">
              {filingTrend.filter((_, i) => i % 2 === 0).map(({ year }) => (
                <span key={year} className="text-[9px] text-muted-foreground">{year}</span>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Total Patents', value: filingTrend.reduce((s, y) => s + y.count, 0).toLocaleString() },
                { label: 'Peak Year', value: filingTrend.length > 0 ? filingTrend.reduce((m, y) => y.count > m.count ? y : m).year : '—' },
                { label: 'CAGR (5yr)', value: (() => { if (filingTrend.length < 2) return '—'; const last = filingTrend[filingTrend.length - 1].count; const prev5 = filingTrend[Math.max(0, filingTrend.length - 6)]?.count ?? 1; return `+${Math.round((Math.pow(last / (prev5 || 1), 0.2) - 1) * 100)}%`; })() },
              ].map(({ label, value }) => (
                <div key={label} className="rounded border px-2 py-1.5 text-center">
                  <p className="text-[10px] text-muted-foreground">{label}</p>
                  <p className="text-sm font-bold">{value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Assignees */}
        {active === 'assignees' && (
          <div className="space-y-1.5">
            {topAssignees.map((a) => (
              <div key={a.name} className="flex items-center gap-2">
                <span className="text-xs font-medium w-32 shrink-0 truncate" title={a.name}>{a.name}</span>
                <div className="flex-1 h-3 bg-muted rounded overflow-hidden">
                  <div
                    className="h-full bg-blue-400 rounded"
                    style={{ width: `${Math.round((a.count / maxAssigneeCount) * 100)}%` }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground w-16 shrink-0 text-right">
                  {a.count} ({a.share}%)
                </span>
                <span className={`text-[10px] ${a.trend === 'up' ? 'text-green-600' : a.trend === 'down' ? 'text-red-500' : 'text-yellow-600'}`}>
                  {a.trend === 'up' ? '↑' : a.trend === 'down' ? '↓' : '→'}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Technology Areas */}
        {active === 'technology' && (
          <div className="space-y-3">
            {/* Stacked bar */}
            <div className="h-6 flex rounded overflow-hidden gap-0.5">
              {techAreas.map((t, i) => (
                <div
                  key={t.name}
                  className={`${TECH_COLORS[i % TECH_COLORS.length]} opacity-80`}
                  style={{ width: `${t.pct}%` }}
                  title={`${t.name}: ${t.pct}%`}
                />
              ))}
            </div>

            {/* Legend + breakdown */}
            <div className="space-y-1">
              {techAreas.map((t, i) => (
                <div key={t.name} className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-sm shrink-0 ${TECH_COLORS[i % TECH_COLORS.length]} opacity-80`} />
                  <span className="text-xs flex-1">{t.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 bg-muted rounded overflow-hidden">
                      <div className={`h-full rounded ${TECH_COLORS[i % TECH_COLORS.length]}`} style={{ width: `${t.pct}%` }} />
                    </div>
                    <span className="text-[10px] text-muted-foreground w-16 text-right">{t.count} · {t.pct}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
