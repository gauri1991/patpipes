'use client';

import { useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  BarChart3,
  AlertTriangle,
  Loader2,
  Play,
  FileText,
  Star,
  Globe,
  DollarSign,
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
import { analyticsApi, PortfolioAssessment } from '@/services/analyticsApi';
import { TierDistributionChart, BarRankingChart, TimeSeriesChart } from '@/components/analytics/charts';

const TIER_COLORS: Record<string, string> = {
  tier_a: 'bg-emerald-500',
  tier_b: 'bg-blue-500',
  tier_c: 'bg-yellow-500',
  tier_d: 'bg-red-400',
};

const TIER_BADGE: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  tier_a: 'default',
  tier_b: 'secondary',
  tier_c: 'outline',
  tier_d: 'destructive',
};

const TIER_LABELS: Record<string, string> = {
  tier_a: 'Tier A',
  tier_b: 'Tier B',
  tier_c: 'Tier C',
  tier_d: 'Tier D',
};

export default function PortfolioAssessmentPage() {
  const searchParams = useSearchParams();
  const initialProject = searchParams.get('project') || '';
  const { projects, loading: projectsLoading } = useAnalyticsProjects();
  const [selectedProject, setSelectedProject] = useState(initialProject);
  const [result, setResult] = useState<PortfolioAssessment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = useCallback(async () => {
    if (!selectedProject) return;
    setLoading(true);
    setError(null);
    try {
      const res = await analyticsApi.assessPortfolio(selectedProject);
      if (res.success && res.data) {
        setResult(res.data);
      } else {
        setError(res.error || 'Failed to run Portfolio Assessment');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [selectedProject]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Portfolio Assessment</h1>
        <p className="text-muted-foreground">
          Evaluate quality tiers, geographic coverage, expiry timelines, and portfolio strength
        </p>
      </div>

      {/* Config */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Analysis Configuration</CardTitle>
          <CardDescription>Select an analytics project to assess</CardDescription>
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
              <><Play className="mr-2 h-4 w-4" />Run Assessment</>
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
                  <BarChart3 className="h-4 w-4 text-blue-500" />Portfolio Strength
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{result.portfolio_strength_score}</div>
                <Progress value={result.portfolio_strength_score} className="mt-2 h-2" />
                <p className="text-xs text-muted-foreground mt-1">out of 100</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Star className="h-4 w-4 text-emerald-500" />Tier A Patents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{result.quality_tiers.tier_a}</div>
                <p className="text-xs text-muted-foreground">highest quality</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Globe className="h-4 w-4 text-purple-500" />Jurisdictions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{result.geographic_coverage.length}</div>
                <p className="text-xs text-muted-foreground">countries covered</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-yellow-500" />Est. Maintenance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(result.maintenance_cost_estimate)}</div>
                <p className="text-xs text-muted-foreground">annual cost estimate</p>
              </CardContent>
            </Card>
          </div>

          {/* Quality Tier Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quality Tier Distribution</CardTitle>
              <CardDescription>{result.total_patents} patents assessed</CardDescription>
            </CardHeader>
            <CardContent>
              <TierDistributionChart data={(['tier_a', 'tier_b', 'tier_c', 'tier_d'] as const).map(tier => {
                const count = result.quality_tiers[tier];
                const pct = result.total_patents > 0 ? (count / result.total_patents) * 100 : 0;
                return { tier: TIER_LABELS[tier], count, percentage: Math.round(pct * 10) / 10 };
              })} />
              <div className="space-y-3 mt-6">
                {(['tier_a', 'tier_b', 'tier_c', 'tier_d'] as const).map(tier => {
                  const count = result.quality_tiers[tier];
                  const pct = result.total_patents > 0 ? (count / result.total_patents) * 100 : 0;
                  return (
                    <div key={tier} className="flex items-center gap-3">
                      <div className="w-16 text-sm font-medium">{TIER_LABELS[tier]}</div>
                      <div className="flex-1">
                        <div className="h-3 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full ${TIER_COLORS[tier]} transition-all`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                      <div className="w-24 text-right text-sm text-muted-foreground">
                        {count} ({pct.toFixed(1)}%)
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Geographic Coverage */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Geographic Coverage</CardTitle>
            </CardHeader>
            <CardContent>
              <BarRankingChart
                data={result.geographic_coverage.map((g: any) => ({ name: g.jurisdiction, value: g.patent_count }))}
                color="#8b5cf6"
                layout="horizontal"
                barLabel="Patents"
              />
              <div className="space-y-2 mt-6">
                {result.geographic_coverage.slice(0, 10).map(geo => (
                  <div key={geo.jurisdiction} className="flex items-center gap-3">
                    <div className="w-10 font-mono text-sm">{geo.jurisdiction}</div>
                    <div className="flex-1">
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-blue-500 transition-all"
                          style={{ width: `${geo.percentage}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground w-28 text-right">
                      {geo.patent_count} ({geo.percentage}%)
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Expiry Timeline */}
          {result.expiry_timeline.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Patent Expiry Timeline</CardTitle>
                <CardDescription>Upcoming patent expirations by year</CardDescription>
              </CardHeader>
              <CardContent>
                <TimeSeriesChart
                data={result.expiry_timeline.map((e: any) => ({ label: String(e.year), expiring: e.expiring_count, cumulative: e.cumulative_pct }))}
                series={[
                  { key: 'expiring', name: 'Expiring Patents', color: '#ef4444' },
                  { key: 'cumulative', name: 'Cumulative %', color: '#f59e0b', dashed: true },
                ]}
              />
              <div className="rounded-md border mt-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Year</TableHead>
                        <TableHead>Expiring Patents</TableHead>
                        <TableHead>Cumulative %</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.expiry_timeline.map(row => (
                        <TableRow key={row.year}>
                          <TableCell className="font-mono">{row.year}</TableCell>
                          <TableCell>{row.expiring_count}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={row.cumulative_percentage} className="h-1.5 w-20" />
                              <span className="text-sm">{row.cumulative_percentage}%</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Top Patent Quality Scores */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top Patent Quality Scores</CardTitle>
              <CardDescription>Highest-scoring patents in the portfolio</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patent ID</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead>Quality Score</TableHead>
                      <TableHead>Claim Breadth</TableHead>
                      <TableHead>Fwd Citations</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.quality_scores.slice(0, 20).map(q => (
                      <TableRow key={q.patent_id}>
                        <TableCell className="font-mono text-sm">{q.patent_id}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{q.title}</TableCell>
                        <TableCell>
                          <Badge variant={TIER_BADGE[q.tier]}>{TIER_LABELS[q.tier]}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={q.quality_score} className="h-1.5 w-16" />
                            <span className="text-sm font-mono">{q.quality_score}</span>
                          </div>
                        </TableCell>
                        <TableCell className="capitalize">{q.claim_breadth}</TableCell>
                        <TableCell>{q.forward_citations}</TableCell>
                      </TableRow>
                    ))}
                    {result.quality_scores.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                          No quality data available.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          {result.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {result.recommendations.map((rec, idx) => (
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
            <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Assessment Results</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Select a project and run the assessment to evaluate portfolio quality, geographic coverage, and expiry risk.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
