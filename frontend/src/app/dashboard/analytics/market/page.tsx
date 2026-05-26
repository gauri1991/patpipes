'use client';

import { useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  PieChart,
  AlertTriangle,
  Loader2,
  Play,
  FileText,
  TrendingUp,
  Users,
  MapPin,
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
import { analyticsApi, MarketAnalysis } from '@/services/analyticsApi';
import { BarRankingChart } from '@/components/analytics/charts';

const CONCENTRATION_LABELS: Record<string, string> = {
  highly_concentrated: 'Highly Concentrated',
  moderately_concentrated: 'Moderately Concentrated',
  competitive: 'Competitive',
};

const CONCENTRATION_COLORS: Record<string, string> = {
  highly_concentrated: 'text-red-600',
  moderately_concentrated: 'text-yellow-600',
  competitive: 'text-emerald-600',
};

export default function MarketAnalysisPage() {
  const searchParams = useSearchParams();
  const initialProject = searchParams.get('project') || '';
  const { projects, loading: projectsLoading } = useAnalyticsProjects();
  const [selectedProject, setSelectedProject] = useState(initialProject);
  const [result, setResult] = useState<MarketAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = useCallback(async () => {
    if (!selectedProject) return;
    setLoading(true);
    setError(null);
    try {
      const res = await analyticsApi.runMarketAnalysis(selectedProject);
      if (res.success && res.data) {
        setResult(res.data);
      } else {
        setError(res.error || 'Failed to run Market Analysis');
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
        <h1 className="text-3xl font-bold tracking-tight">Market Analysis</h1>
        <p className="text-muted-foreground">
          Analyze market concentration, competitive positioning, new entrants, and IP white spaces
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
                  <PieChart className="h-4 w-4 text-blue-500" />HHI Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{result.hhi_score.toFixed(0)}</div>
                <div className={`text-xs font-medium mt-1 ${CONCENTRATION_COLORS[result.market_concentration]}`}>
                  {CONCENTRATION_LABELS[result.market_concentration]}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4 text-purple-500" />Assignees
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{result.assignee_shares.length}</div>
                <p className="text-xs text-muted-foreground">unique patent holders</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />New Entrants
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{result.new_entrants.length}</div>
                <p className="text-xs text-muted-foreground">since 2020</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-yellow-500" />White Spaces
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{result.ip_white_spaces.length}</div>
                <p className="text-xs text-muted-foreground">IP opportunity segments</p>
              </CardContent>
            </Card>
          </div>

          {/* Assignee Market Share */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Assignee Market Share</CardTitle>
              <CardDescription>Patent distribution across top assignees</CardDescription>
            </CardHeader>
            <CardContent>
              <BarRankingChart
                data={result.assignee_shares.slice(0, 10).map((s: any) => ({ name: s.assignee, value: s.market_share }))}
                color="#3b82f6"
                layout="vertical"
                valueFormatter={(v) => `${v}%`}
                barLabel="Market Share"
                height={Math.max(200, result.assignee_shares.slice(0, 10).length * 35)}
              />
              <div className="space-y-2 mt-6">
                {result.assignee_shares.slice(0, 15).map((a, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-36 text-sm truncate" title={a.assignee}>{a.assignee}</div>
                    <div className="flex-1">
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-blue-500 transition-all"
                          style={{ width: `${Math.min(a.market_share, 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground w-28 text-right">
                      {a.patent_count} ({a.market_share.toFixed(1)}%)
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Competitive Positioning */}
          {result.competitive_positioning.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Competitive Positioning</CardTitle>
                <CardDescription>IP strength vs. estimated market share</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Entity</TableHead>
                        <TableHead>IP Strength</TableHead>
                        <TableHead>Market Share Est.</TableHead>
                        <TableHead>Portfolio Size</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.competitive_positioning.map((c, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{c.entity}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={c.ip_strength} className="h-1.5 w-16" />
                              <span className="text-sm">{c.ip_strength}</span>
                            </div>
                          </TableCell>
                          <TableCell>{c.market_share_est.toFixed(1)}%</TableCell>
                          <TableCell>{c.portfolio_size}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Market Opportunity Matrix */}
          {result.market_opportunity_matrix.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Market Opportunity Matrix</CardTitle>
                <CardDescription>Technology segment growth vs. IP barrier</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Segment</TableHead>
                        <TableHead>Growth Rate (%)</TableHead>
                        <TableHead>IP Barrier</TableHead>
                        <TableHead>Patent Coverage</TableHead>
                        <TableHead>Opportunity</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.market_opportunity_matrix.map((row, i) => {
                        const opportunity = row.growth_rate / Math.max(row.ip_barrier / 20, 1);
                        return (
                          <TableRow key={i}>
                            <TableCell className="font-medium">{row.segment}</TableCell>
                            <TableCell>{row.growth_rate}%</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Progress value={row.ip_barrier} className="h-1.5 w-16" />
                                <span className="text-sm">{row.ip_barrier.toFixed(0)}</span>
                              </div>
                            </TableCell>
                            <TableCell>{row.patent_coverage}</TableCell>
                            <TableCell>
                              <Badge variant={opportunity > 3 ? 'default' : opportunity > 1.5 ? 'secondary' : 'outline'}>
                                {opportunity > 3 ? 'High' : opportunity > 1.5 ? 'Medium' : 'Low'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* New Entrants */}
          {result.new_entrants.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">New Market Entrants</CardTitle>
                <CardDescription>Entities with first filings since 2020</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {result.new_entrants.map((e, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <div className="font-medium text-sm">{e.entity}</div>
                        <div className="text-xs text-muted-foreground">First filing: {e.first_filing_year}</div>
                      </div>
                      <Badge variant="secondary">{e.recent_filings} recent filings</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

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
            <PieChart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Analysis Results</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Select a project and run the analysis to explore market concentration, competitive positioning, and IP opportunities.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
