'use client';

import { useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  TrendingUp,
  AlertTriangle,
  Loader2,
  Play,
  FileText,
  DollarSign,
  ShieldAlert,
  Star,
} from 'lucide-react';

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
import { analyticsApi, InvestmentAnalysis } from '@/services/analyticsApi';
import { TierDistributionChart, RiskMatrixScatter, ValuationComparisonChart, BarRankingChart } from '@/components/analytics/charts';

function formatCurrency(val: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
}

function getRiskBadge(level: string): 'destructive' | 'default' | 'secondary' | 'outline' {
  if (level === 'high') return 'destructive';
  if (level === 'medium') return 'default';
  return 'secondary';
}

export default function InvestmentAnalysisPage() {
  const searchParams = useSearchParams();
  const initialProject = searchParams.get('project') || '';
  const { projects, loading: projectsLoading } = useAnalyticsProjects();
  const [selectedProject, setSelectedProject] = useState(initialProject);
  const [result, setResult] = useState<InvestmentAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = useCallback(async () => {
    if (!selectedProject) return;
    setLoading(true);
    setError(null);
    try {
      const res = await analyticsApi.runInvestmentAnalysis(selectedProject);
      if (res.success && res.data) {
        setResult(res.data);
      } else {
        setError(res.error || 'Failed to run Investment Analysis');
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
        <h1 className="text-3xl font-bold tracking-tight">Investment Analysis</h1>
        <p className="text-muted-foreground">
          Evaluate portfolio value, risk exposure, and key assets for investment and M&amp;A decisions
        </p>
      </div>

      {/* Config */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Analysis Configuration</CardTitle>
          <CardDescription>Select an analytics project to analyze</CardDescription>
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
              <><Play className="mr-2 h-4 w-4" />Run Analysis</>
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
                  <DollarSign className="h-4 w-4 text-emerald-500" />Portfolio Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(result.portfolio_value_estimate)}</div>
                <p className="text-xs text-muted-foreground">income approach estimate</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Star className="h-4 w-4 text-blue-500" />Weighted Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{result.quality_scorecard.weighted_score}</div>
                <Progress value={result.quality_scorecard.weighted_score} className="mt-1 h-1.5" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-yellow-500" />Value Concentration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{result.concentration_risk}%</div>
                <p className="text-xs text-muted-foreground">in top 5 patents</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-purple-500" />Tier A Share
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{result.quality_scorecard.tier_a_pct}%</div>
                <p className="text-xs text-muted-foreground">highest quality tier</p>
              </CardContent>
            </Card>
          </div>

          {/* Quality Tier Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quality Tier Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <TierDistributionChart data={[
                { tier: 'Tier A', count: Math.round(result.total_patents * result.quality_scorecard.tier_a_pct / 100), percentage: result.quality_scorecard.tier_a_pct },
                { tier: 'Tier B', count: Math.round(result.total_patents * result.quality_scorecard.tier_b_pct / 100), percentage: result.quality_scorecard.tier_b_pct },
                { tier: 'Tier C', count: Math.round(result.total_patents * (100 - result.quality_scorecard.tier_a_pct - result.quality_scorecard.tier_b_pct) * 0.6 / 100), percentage: Math.round((100 - result.quality_scorecard.tier_a_pct - result.quality_scorecard.tier_b_pct) * 0.6) },
                { tier: 'Tier D', count: Math.round(result.total_patents * (100 - result.quality_scorecard.tier_a_pct - result.quality_scorecard.tier_b_pct) * 0.4 / 100), percentage: Math.round((100 - result.quality_scorecard.tier_a_pct - result.quality_scorecard.tier_b_pct) * 0.4) },
              ]} />
            </CardContent>
          </Card>

          {/* Valuation Methods */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Valuation Methods Comparison</CardTitle>
              <CardDescription>
                Recommended range: {formatCurrency(result.valuation_methods.recommended_range[0])} – {formatCurrency(result.valuation_methods.recommended_range[1])}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ValuationComparisonChart
                incomeApproach={result.valuation_methods.income_approach}
                marketApproach={result.valuation_methods.market_approach}
                costApproach={result.valuation_methods.cost_approach}
                recommendedRange={result.valuation_methods.recommended_range}
              />
            </CardContent>
          </Card>

          {/* Risk Matrix */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Risk Matrix</CardTitle>
              <CardDescription>Probability and severity of key portfolio risks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <RiskMatrixScatter
                data={result.risk_matrix.map(r => ({
                  name: r.risk_type,
                  probability: r.probability,
                  severity: r.severity,
                  description: r.description,
                }))}
              />
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Risk Type</TableHead>
                      <TableHead>Probability</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.risk_matrix.map((risk, i) => {
                      const level = risk.probability * risk.severity;
                      return (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{risk.risk_type}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={risk.probability * 100} className="h-1.5 w-16" />
                              <span className="text-sm">{(risk.probability * 100).toFixed(0)}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={risk.severity * 100} className="h-1.5 w-16" />
                              <span className="text-sm">{(risk.severity * 100).toFixed(0)}%</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-[250px] truncate" title={risk.description}>
                            {risk.description}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Key Assets */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Key Assets</CardTitle>
              <CardDescription>Highest-value patents by contribution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patent ID</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Value Contribution</TableHead>
                      <TableHead>Risk Level</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.key_assets.map((asset, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-mono text-sm">{asset.patent_id}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{asset.title}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={asset.value_contribution} className="h-1.5 w-16" />
                            <span className="text-sm">{asset.value_contribution.toFixed(1)}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getRiskBadge(asset.risk_level)}>{asset.risk_level}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Expiry Cliff */}
          {result.expiry_cliff.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Expiry Cliff & Value at Risk</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <BarRankingChart
                  data={result.expiry_cliff.map(e => ({ name: String(e.year), value: e.value_at_risk }))}
                  color="#f59e0b"
                  layout="horizontal"
                  valueFormatter={(v) => v >= 1000000 ? `$${(v/1000000).toFixed(1)}M` : v >= 1000 ? `$${(v/1000).toFixed(0)}K` : `$${v}`}
                  barLabel="Value at Risk"
                />
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Year</TableHead>
                        <TableHead>Expiring</TableHead>
                        <TableHead>Value at Risk</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.expiry_cliff.map(row => (
                        <TableRow key={row.year}>
                          <TableCell className="font-mono">{row.year}</TableCell>
                          <TableCell>{row.expiring}</TableCell>
                          <TableCell className="font-mono">{formatCurrency(row.value_at_risk)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Red Flags */}
          {result.red_flags.length > 0 && (
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-5 w-5" />Red Flags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.red_flags.map((flag, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-red-700 dark:text-red-400">
                      <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                      {flag}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Deal Recommendations */}
          {result.deal_recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />Deal Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {result.deal_recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <FileText className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                      <span className="text-sm">{rec}</span>
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
            <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Analysis Results</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Select a project and run the analysis to evaluate portfolio investment value, risk matrix, and deal recommendations.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
