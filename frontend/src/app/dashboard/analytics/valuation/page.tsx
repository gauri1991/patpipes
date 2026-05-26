'use client';

import { useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Scale,
  AlertTriangle,
  Loader2,
  Play,
  FileText,
  DollarSign,
  Clock,
  BarChart3,
} from 'lucide-react';

import { ValuationComparisonChart, SensitivityTornadoChart } from '@/components/analytics/charts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { useAnalyticsProjects } from '@/hooks/useAnalyticsData';
import { analyticsApi, ValuationAnalysis } from '@/services/analyticsApi';

function formatCurrency(val: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
}

export default function ValuationAnalysisPage() {
  const searchParams = useSearchParams();
  const initialProject = searchParams.get('project') || '';
  const { projects, loading: projectsLoading } = useAnalyticsProjects();
  const [selectedProject, setSelectedProject] = useState(initialProject);
  const [result, setResult] = useState<ValuationAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = useCallback(async () => {
    if (!selectedProject) return;
    setLoading(true);
    setError(null);
    try {
      const res = await analyticsApi.runValuationAnalysis(selectedProject);
      if (res.success && res.data) {
        setResult(res.data);
      } else {
        setError(res.error || 'Failed to run Valuation Analysis');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [selectedProject]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Valuation Analysis</h1>
        <p className="text-muted-foreground">
          Three-method IP valuation with sensitivity analysis and scenario modeling
        </p>
      </div>

      {/* Config */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Analysis Configuration</CardTitle>
          <CardDescription>Select an analytics project to value</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-sm space-y-2">
            <Label htmlFor="project-select">Analytics Project</Label>
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger id="project-select">
                <SelectValue placeholder={projectsLoading ? 'Loading...' : 'Select a project'} />
              </SelectTrigger>
              <SelectContent>
                {projects.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={runAnalysis} disabled={!selectedProject || loading}>
            {loading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analyzing...</>
            ) : (
              <><Play className="mr-2 h-4 w-4" />Run Valuation</>
            )}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="h-5 w-5" />
              <p className="font-medium">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {result && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-emerald-500" />Reconciled Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(result.reconciled_value)}</div>
                <p className="text-xs text-muted-foreground">
                  Range: {formatCurrency(result.value_range[0])} – {formatCurrency(result.value_range[1])}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" />Avg. Remaining Life
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{result.remaining_useful_life_avg} yrs</div>
                <p className="text-xs text-muted-foreground">weighted average</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Patents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{result.total_patents}</div>
                <p className="text-xs text-muted-foreground">as of {result.effective_date}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-yellow-500" />Expiry Cliff
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{result.expiry_cliff_pct}%</div>
                <p className="text-xs text-muted-foreground">expiring in 5 years</p>
              </CardContent>
            </Card>
          </div>

          {/* Three-Method Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Valuation Method Comparison</CardTitle>
              <CardDescription>Income (50%) + Market (30%) + Cost (20%) = Reconciled Value</CardDescription>
            </CardHeader>
            <CardContent>
              <ValuationComparisonChart
                incomeApproach={result.income_approach.relief_from_royalty}
                marketApproach={result.market_approach.value}
                costApproach={result.cost_approach.value}
                recommendedRange={[result.value_range[0], result.value_range[1]]}
              />
              <div className="space-y-4 mt-6">
                {[
                  { label: 'Income Approach (Relief-from-Royalty)', value: result.income_approach.relief_from_royalty, weight: '50%', color: 'bg-emerald-500' },
                  { label: 'Market Approach (Comparables)', value: result.market_approach.value, weight: '30%', color: 'bg-blue-500' },
                  { label: 'Cost Approach (Reproduction)', value: result.cost_approach.value, weight: '20%', color: 'bg-purple-500' },
                ].map(m => {
                  const maxVal = Math.max(result.income_approach.relief_from_royalty, result.market_approach.value, result.cost_approach.value);
                  return (
                    <div key={m.label} className="flex items-center gap-3">
                      <div className="w-60 text-sm font-medium">{m.label}</div>
                      <Badge variant="outline" className="w-12 text-center shrink-0">{m.weight}</Badge>
                      <div className="flex-1">
                        <div className="h-5 rounded bg-muted overflow-hidden">
                          <div
                            className={`h-full ${m.color} transition-all`}
                            style={{ width: `${(m.value / Math.max(maxVal, 1)) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div className="w-36 text-right text-sm font-mono">{formatCurrency(m.value)}</div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Scenarios */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-emerald-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-emerald-600">Optimistic Scenario</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">{formatCurrency(result.scenarios.optimistic)}</div>
                <p className="text-xs text-muted-foreground">favorable market conditions</p>
              </CardContent>
            </Card>
            <Card className="border-blue-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-blue-600">Base Scenario</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{formatCurrency(result.scenarios.base)}</div>
                <p className="text-xs text-muted-foreground">current market assumptions</p>
              </CardContent>
            </Card>
            <Card className="border-red-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-red-600">Pessimistic Scenario</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{formatCurrency(result.scenarios.pessimistic)}</div>
                <p className="text-xs text-muted-foreground">adverse market conditions</p>
              </CardContent>
            </Card>
          </div>

          {/* Sensitivity Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Sensitivity Analysis</CardTitle>
              <CardDescription>Impact of key variable changes on reconciled value</CardDescription>
            </CardHeader>
            <CardContent>
              <SensitivityTornadoChart data={result.sensitivity_analysis} />
              <div className="rounded-md border mt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Variable</TableHead>
                      <TableHead>Low Case</TableHead>
                      <TableHead>Base Case</TableHead>
                      <TableHead>High Case</TableHead>
                      <TableHead>Swing</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.sensitivity_analysis.map((row, i) => {
                      const swing = Math.abs(row.high_case - row.low_case);
                      const maxSwing = Math.max(...result.sensitivity_analysis.map(r => Math.abs(r.high_case - r.low_case)));
                      return (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{row.variable}</TableCell>
                          <TableCell className="text-muted-foreground font-mono text-sm">{formatCurrency(row.low_case)}</TableCell>
                          <TableCell className="font-mono text-sm font-medium">{formatCurrency(row.base_case)}</TableCell>
                          <TableCell className="text-emerald-600 font-mono text-sm">{formatCurrency(row.high_case)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 rounded-full bg-muted overflow-hidden w-24">
                                <div
                                  className="h-full bg-blue-500"
                                  style={{ width: `${(swing / Math.max(maxSwing, 1)) * 100}%` }}
                                />
                              </div>
                              <span className="text-xs font-mono">{formatCurrency(swing)}</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Income Approach Detail */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Income Approach — Key Inputs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: 'Royalty Rate', value: `${(result.income_approach.royalty_rate * 100).toFixed(1)}%` },
                  { label: 'Revenue Base', value: formatCurrency(result.income_approach.revenue_base) },
                  { label: 'Discount Rate', value: `${(result.income_approach.discount_rate * 100).toFixed(0)}%` },
                  { label: 'Comparables Used', value: String(result.market_approach.comparables_count) },
                ].map(item => (
                  <div key={item.label} className="p-3 rounded-lg bg-muted/50">
                    <div className="text-xs text-muted-foreground">{item.label}</div>
                    <div className="text-lg font-bold mt-1">{item.value}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Asset Summary */}
          {result.asset_summary.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Asset Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Patent ID</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Remaining Life</TableHead>
                        <TableHead>Relevance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.asset_summary.slice(0, 20).map((a, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-mono text-sm">{a.patent_id}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{a.title}</TableCell>
                          <TableCell>
                            {a.remaining_life_years != null ? `${a.remaining_life_years} yrs` : 'Unknown'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={a.relevance === 'core' ? 'default' : a.relevance === 'supplemental' ? 'secondary' : 'outline'}>
                              {a.relevance}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Assumptions */}
          {result.assumptions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />Valuation Assumptions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.assumptions.map((a, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-muted-foreground shrink-0">—</span>
                      {a}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {!result && !loading && !error && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Scale className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Valuation Results</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Select a project and run the valuation to receive income, market, and cost approach estimates with sensitivity analysis.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
