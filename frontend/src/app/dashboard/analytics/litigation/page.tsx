'use client';

import { useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Gavel,
  AlertTriangle,
  Loader2,
  Play,
  FileText,
  ShieldAlert,
  Eye,
} from 'lucide-react';

import { BarRankingChart } from '@/components/analytics/charts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { DataTable, createColumns } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table';

import { useAnalyticsProjects } from '@/hooks/useAnalyticsData';
import { analyticsApi, LitigationAnalysis } from '@/services/analyticsApi';

function getRiskBadge(level: string): 'destructive' | 'default' | 'secondary' | 'outline' {
  if (level === 'high') return 'destructive';
  if (level === 'medium') return 'default';
  if (level === 'low') return 'secondary';
  return 'outline';
}

function getRiskColor(level: string) {
  if (level === 'high') return 'text-red-600';
  if (level === 'medium') return 'text-yellow-600';
  if (level === 'low') return 'text-blue-600';
  return 'text-green-600';
}

export default function LitigationAnalysisPage() {
  const searchParams = useSearchParams();
  const initialProject = searchParams.get('project') || '';
  const { projects, loading: projectsLoading } = useAnalyticsProjects();
  const [selectedProject, setSelectedProject] = useState(initialProject);
  const [result, setResult] = useState<LitigationAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = useCallback(async () => {
    if (!selectedProject) return;
    setLoading(true);
    setError(null);
    try {
      const res = await analyticsApi.runLitigationAnalysis(selectedProject);
      if (res.success && res.data) {
        setResult(res.data);
      } else {
        setError(res.error || 'Failed to run Litigation Analysis');
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
        <h1 className="text-3xl font-bold tracking-tight">Litigation Analysis</h1>
        <p className="text-muted-foreground">
          Assess litigation risk, assertion patterns, venue distribution, and mitigation strategies
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
                  <ShieldAlert className="h-4 w-4 text-red-500" />Overall Risk
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getRiskColor(result.risk_level)}`}>
                  {result.overall_litigation_risk}
                </div>
                <Badge variant={getRiskBadge(result.risk_level)} className="mt-1">
                  {result.risk_level.toUpperCase()}
                </Badge>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Patents Analyzed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{result.total_patents_analyzed}</div>
                <p className="text-xs text-muted-foreground">total assessed</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Eye className="h-4 w-4 text-yellow-500" />Watch List
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{result.watch_list.length}</div>
                <p className="text-xs text-muted-foreground">patents flagged</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Plaintiff Win Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(result.outcome_benchmarks.plaintiff_win_rate * 100).toFixed(0)}%</div>
                <p className="text-xs text-muted-foreground">industry benchmark</p>
              </CardContent>
            </Card>
          </div>

          {/* Outcome Benchmarks */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Industry Outcome Benchmarks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  { label: 'Plaintiff Win Rate', value: result.outcome_benchmarks.plaintiff_win_rate, color: 'bg-red-500' },
                  { label: 'Settlement Rate', value: result.outcome_benchmarks.settlement_rate, color: 'bg-yellow-500' },
                  { label: 'PTAB Institution Rate', value: result.outcome_benchmarks.ptab_institution_rate, color: 'bg-blue-500' },
                ].map(b => (
                  <div key={b.label} className="space-y-2">
                    <div className="text-sm font-medium">{b.label}</div>
                    <div className="text-2xl font-bold">{(b.value * 100).toFixed(0)}%</div>
                    <Progress value={b.value * 100} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Risk by Patent Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Risk by Patent</CardTitle>
              <CardDescription>Patents sorted by litigation risk score</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {(() => {
                type RiskRow = typeof result.risk_by_patent[number];
                const { column } = createColumns<RiskRow>();
                return (
                  <DataTable
                    data={result.risk_by_patent}
                    columns={[
                      column({ accessorKey: 'patent_id', header: ({ column }) => <DataTableColumnHeader column={column} title="Patent ID" />, cell: ({ getValue }) => <span className="font-mono text-sm">{getValue() as string}</span> }),
                      column({ accessorKey: 'title', header: ({ column }) => <DataTableColumnHeader column={column} title="Title" />, cell: ({ getValue }) => <span className="max-w-[200px] truncate block">{getValue() as string}</span> }),
                      column({ accessorKey: 'assignee', header: ({ column }) => <DataTableColumnHeader column={column} title="Assignee" />, cell: ({ getValue }) => <span className="max-w-[150px] truncate block">{getValue() as string}</span> }),
                      column({ accessorKey: 'litigation_risk_score', header: ({ column }) => <DataTableColumnHeader column={column} title="Risk Score" />, cell: ({ getValue }) => { const v = getValue() as number; return <div className="flex items-center gap-2"><Progress value={v} className="h-1.5 w-16" /><span className="text-sm font-mono">{v}</span></div>; }, meta: { filterType: 'number-range' as const } }),
                      column({ accessorKey: 'risk_level', header: 'Level', cell: ({ getValue }) => { const v = getValue() as string; return <Badge variant={getRiskBadge(v)}>{v}</Badge>; }, meta: { filterType: 'select' as const, filterOptions: [{ label: 'High', value: 'high' }, { label: 'Medium', value: 'medium' }, { label: 'Low', value: 'low' }, { label: 'None', value: 'none' }] } }),
                    ]}
                    getRowId={(_, i) => String(i)}
                    features={{ enableSorting: true, enableFiltering: true, enableColumnVisibility: true, enableExport: true, enableDensityToggle: true }}
                    initialSorting={[{ id: 'litigation_risk_score', desc: true }]}
                    exportConfig={{ filename: 'litigation-risk' }}
                    initialPageSize={25}
                    emptyState="No patent risk data available."
                    className="rounded-none border-0 border-t"
                  />
                );
              })()}
            </CardContent>
          </Card>

          {/* Venue Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Venue Distribution</CardTitle>
              <CardDescription>Estimated litigation venue breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <BarRankingChart
                data={result.venue_distribution.map((v) => ({ name: v.venue, value: v.case_count }))}
                color="#f59e0b"
                layout="vertical"
                barLabel="Cases"
              />
              <div className="space-y-2 mt-6">
                {result.venue_distribution.map((v, i) => {
                  const total = result.venue_distribution.reduce((s, x) => s + x.case_count, 0);
                  const pct = total > 0 ? (v.case_count / total) * 100 : 0;
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-40 text-sm truncate">{v.venue}</div>
                      <div className="flex-1">
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div className="h-full bg-red-400 transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground w-28 text-right">
                        {v.case_count} ({pct.toFixed(1)}%)
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Watch List */}
          {result.watch_list.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Eye className="h-5 w-5 text-yellow-500" />Watch List
                </CardTitle>
                <CardDescription>High-risk patents requiring immediate attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {result.watch_list.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <div className="font-mono text-sm">{item.patent_id}</div>
                        <div className="text-sm truncate max-w-[300px]">{item.title}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-mono">Score: {item.risk_score}</span>
                        <Badge variant="outline">{item.recommended_action}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* NPE Risk Indicators */}
          {result.npe_risk_indicators.length > 0 && (
            <Card className="border-yellow-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />NPE Risk Indicators
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.npe_risk_indicators.map((ind, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <AlertTriangle className="h-4 w-4 mt-0.5 text-yellow-500 shrink-0" />
                      {ind}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Mitigation Strategies */}
          {result.risk_mitigation_strategies.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />Risk Mitigation Strategies
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {result.risk_mitigation_strategies.map((s, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <FileText className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                      <span className="text-sm">{s}</span>
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
            <Gavel className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Analysis Results</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Select a project and run the analysis to assess litigation risk, identify high-risk patents, and develop mitigation strategies.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
