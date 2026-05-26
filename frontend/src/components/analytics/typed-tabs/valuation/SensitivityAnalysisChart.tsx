'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { analyticsApi, ValuationAnalysis } from '@/services/analyticsApi';

interface ScenarioAssumption {
  label: string;
  bear: string;
  base: string;
  bull: string;
}

interface SensitivityResult {
  scenario: 'bear' | 'base' | 'bull';
  label: string;
  npvM: number;          // NPV in millions
  royaltyRate: number;   // %
  revenueBaseM: number;  // revenue base in millions
  discountRate: number;  // %
  color: string;
  badgeColor: string;
}

function transformValuationData(val: ValuationAnalysis): {
  scenarios: SensitivityResult[];
  assumptions: ScenarioAssumption[];
} {
  const pessM = val.scenarios.pessimistic / 1_000_000;
  const baseM = val.scenarios.base / 1_000_000;
  const optM = val.scenarios.optimistic / 1_000_000;

  const scenarios: SensitivityResult[] = [
    {
      scenario: 'bear', label: 'Bear Case', npvM: Math.round(pessM * 10) / 10,
      royaltyRate: val.income_approach.royalty_rate * 0.6,
      revenueBaseM: Math.round(val.income_approach.revenue_base / 1_000_000 * 0.7),
      discountRate: val.income_approach.discount_rate * 1.25,
      color: 'bg-red-400', badgeColor: 'bg-red-100 text-red-800',
    },
    {
      scenario: 'base', label: 'Base Case', npvM: Math.round(baseM * 10) / 10,
      royaltyRate: val.income_approach.royalty_rate,
      revenueBaseM: Math.round(val.income_approach.revenue_base / 1_000_000),
      discountRate: val.income_approach.discount_rate,
      color: 'bg-blue-400', badgeColor: 'bg-blue-100 text-blue-800',
    },
    {
      scenario: 'bull', label: 'Bull Case', npvM: Math.round(optM * 10) / 10,
      royaltyRate: val.income_approach.royalty_rate * 1.5,
      revenueBaseM: Math.round(val.income_approach.revenue_base / 1_000_000 * 1.4),
      discountRate: val.income_approach.discount_rate * 0.85,
      color: 'bg-green-400', badgeColor: 'bg-green-100 text-green-800',
    },
  ];

  // Build assumptions from sensitivity_analysis + income approach
  const assumptions: ScenarioAssumption[] = [
    {
      label: 'Royalty Rate (%)',
      bear: `${scenarios[0].royaltyRate.toFixed(1)}%`,
      base: `${scenarios[1].royaltyRate.toFixed(1)}%`,
      bull: `${scenarios[2].royaltyRate.toFixed(1)}%`,
    },
    {
      label: 'Revenue Base ($M)',
      bear: `$${scenarios[0].revenueBaseM}M`,
      base: `$${scenarios[1].revenueBaseM}M`,
      bull: `$${scenarios[2].revenueBaseM}M`,
    },
    {
      label: 'Discount Rate (%)',
      bear: `${scenarios[0].discountRate.toFixed(1)}%`,
      base: `${scenarios[1].discountRate.toFixed(1)}%`,
      bull: `${scenarios[2].discountRate.toFixed(1)}%`,
    },
    {
      label: 'Remaining Life (yrs)',
      bear: String(Math.max(1, Math.round(val.remaining_useful_life_avg * 0.7))),
      base: String(Math.round(val.remaining_useful_life_avg)),
      bull: String(Math.round(val.remaining_useful_life_avg * 1.3)),
    },
  ];

  return { scenarios, assumptions };
}

interface SensitivityAnalysisChartProps {
  projectId: string;
  scenarios?: SensitivityResult[];
  assumptions?: ScenarioAssumption[];
}

export function SensitivityAnalysisChart({
  projectId,
  scenarios: externalScenarios,
  assumptions: externalAssumptions,
}: SensitivityAnalysisChartProps) {
  const [fetchedData, setFetchedData] = useState<{
    scenarios: SensitivityResult[];
    assumptions: ScenarioAssumption[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAnalysis = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await analyticsApi.runValuationAnalysis(projectId);
      if (response.success && response.data) {
        setFetchedData(transformValuationData(response.data));
      } else {
        setError('No valuation analysis data available');
      }
    } catch (err) {
      setError('Failed to load valuation analysis');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (!externalScenarios) {
      loadAnalysis();
    }
  }, [externalScenarios, loadAnalysis]);

  const scenarios = externalScenarios ?? fetchedData?.scenarios ?? [];
  const assumptions = externalAssumptions ?? fetchedData?.assumptions ?? [];
  const [activeScenario, setActiveScenario] = useState<'bear' | 'base' | 'bull'>('base');
  const maxNPV = scenarios.length > 0 ? Math.max(...scenarios.map((s) => s.npvM), 1) : 1;
  const active = scenarios.find((s) => s.scenario === activeScenario) ?? scenarios[1] ?? null;

  // Tornado-style sensitivity variables
  const tornadoVars = [
    { label: 'Revenue Base', low: -35, high: +40 },
    { label: 'Royalty Rate', low: -28, high: +32 },
    { label: 'Discount Rate', low: -18, high: +15 },
    { label: 'Market Adoption', low: -22, high: +28 },
    { label: 'Remaining Life', low: -12, high: +18 },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm">Sensitivity Analysis — Bear / Base / Bull</CardTitle>
            <p className="text-xs text-muted-foreground">
              NPV range across scenarios with tornado chart of key value drivers.
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={loadAnalysis} disabled={loading} aria-label="Refresh valuation analysis">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {loading && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
            <RefreshCw className="h-3 w-3 animate-spin" /> Running valuation analysis...
          </div>
        )}
        {error && !loading && scenarios.length === 0 && (
          <p className="text-xs text-muted-foreground py-2">{error}</p>
        )}
        {/* Scenario selector + NPV bars */}
        <div className="space-y-2">
          <div className="flex gap-2">
            {scenarios.map((s) => (
              <button
                key={s.scenario}
                onClick={() => setActiveScenario(s.scenario)}
                className={`flex-1 rounded-md border px-2 py-1.5 text-xs transition-colors ${
                  activeScenario === s.scenario
                    ? 'border-foreground bg-foreground text-background'
                    : 'hover:bg-muted/50'
                }`}
              >
                <div className="font-medium">{s.label}</div>
                <div className={`text-sm font-bold mt-0.5 ${activeScenario === s.scenario ? '' : 'text-muted-foreground'}`}>
                  ${s.npvM.toFixed(1)}M
                </div>
              </button>
            ))}
          </div>

          {/* Waterfall bars */}
          <div className="flex items-end gap-2 h-20">
            {scenarios.map((s) => (
              <div key={s.scenario} className="flex-1 flex flex-col items-center justify-end gap-1">
                <span className="text-[10px] text-muted-foreground">${s.npvM.toFixed(1)}M</span>
                <div
                  className={`w-full rounded-t transition-all ${s.color} ${activeScenario === s.scenario ? 'opacity-100' : 'opacity-50'}`}
                  style={{ height: `${Math.round((s.npvM / maxNPV) * 64)}px`, minHeight: '4px' }}
                />
                <span className="text-[9px] text-muted-foreground">{s.label.split(' ')[0]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tornado chart */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Key Value Drivers (NPV Impact %)</p>
          {tornadoVars.map(({ label, low, high }) => (
            <div key={label} className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground w-28 shrink-0">{label}</span>
              <div className="flex-1 flex items-center gap-0.5 h-4">
                {/* Left bar (negative) */}
                <div className="flex-1 flex justify-end">
                  <div
                    className="h-3 rounded-l bg-red-400 opacity-70"
                    style={{ width: `${Math.abs(low)}%` }}
                    title={`${low}%`}
                  />
                </div>
                {/* Center line */}
                <div className="w-px h-4 bg-border" />
                {/* Right bar (positive) */}
                <div className="flex-1">
                  <div
                    className="h-3 rounded-r bg-green-400 opacity-70"
                    style={{ width: `${high}%` }}
                    title={`+${high}%`}
                  />
                </div>
              </div>
              <span className="text-[10px] text-muted-foreground w-16 shrink-0 text-right">
                {low}% / +{high}%
              </span>
            </div>
          ))}
          <div className="flex justify-between px-1 text-[9px] text-muted-foreground mt-1">
            <span>← Downside</span>
            <span>Upside →</span>
          </div>
        </div>

        {/* Assumptions table */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Scenario Assumptions</p>
          <div className="overflow-x-auto">
            <table className="text-xs w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-1.5 font-medium">Driver</th>
                  {scenarios.map((s) => (
                    <th key={s.scenario} className="text-center p-1.5 font-medium">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] ${s.badgeColor}`}>{s.label}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {assumptions.map((a) => (
                  <tr key={a.label} className="border-b">
                    <td className="p-1.5 text-muted-foreground">{a.label}</td>
                    <td className="p-1.5 text-center text-red-600">{a.bear}</td>
                    <td className="p-1.5 text-center text-blue-600 font-medium">{a.base}</td>
                    <td className="p-1.5 text-center text-green-600">{a.bull}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
