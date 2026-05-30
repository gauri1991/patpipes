'use client';

import { useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Handshake,
  AlertTriangle,
  Loader2,
  Play,
  FileText,
  DollarSign,
  Users,
  TrendingUp,
} from 'lucide-react';

import { RevenueProjectionChart, BarRankingChart } from '@/components/analytics/charts';
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
import { DataTable, createColumns } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table';

import { useAnalyticsProjects } from '@/hooks/useAnalyticsData';
import { analyticsApi, LicensingAnalysis } from '@/services/analyticsApi';

function formatCurrency(val: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
}

function getPriorityBadge(priority: string): 'destructive' | 'default' | 'secondary' | 'outline' {
  if (priority === 'high') return 'destructive';
  if (priority === 'medium') return 'default';
  return 'secondary';
}

export default function LicensingAnalysisPage() {
  const searchParams = useSearchParams();
  const initialProject = searchParams.get('project') || '';
  const { projects, loading: projectsLoading } = useAnalyticsProjects();
  const [selectedProject, setSelectedProject] = useState(initialProject);
  const [result, setResult] = useState<LicensingAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = useCallback(async () => {
    if (!selectedProject) return;
    setLoading(true);
    setError(null);
    try {
      const res = await analyticsApi.runLicensingAnalysis(selectedProject);
      if (res.success && res.data) {
        setResult(res.data);
      } else {
        setError(res.error || 'Failed to run Licensing Analysis');
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
        <h1 className="text-3xl font-bold tracking-tight">Licensing Analysis</h1>
        <p className="text-muted-foreground">
          Identify licensable assets, benchmark royalty rates, and forecast licensing revenue
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
                  <Handshake className="h-4 w-4 text-blue-500" />Licensable Assets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{result.licensable_assets.length}</div>
                <p className="text-xs text-muted-foreground">of {result.total_patents} total patents</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-emerald-500" />Recommended Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{result.royalty_benchmarks.recommended_rate}%</div>
                <p className="text-xs text-muted-foreground">royalty rate</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4 text-purple-500" />Licensing Targets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{result.licensing_footprint.length}</div>
                <p className="text-xs text-muted-foreground">potential licensees</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-yellow-500" />5-Year Base Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {result.revenue_forecast.length > 0
                    ? formatCurrency(result.revenue_forecast[result.revenue_forecast.length - 1].base)
                    : '—'}
                </div>
                <p className="text-xs text-muted-foreground">year 5 base case</p>
              </CardContent>
            </Card>
          </div>

          {/* Royalty Rate Range */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Royalty Rate Benchmarks</CardTitle>
              <CardDescription>Floor, midpoint, and ceiling for this technology area</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative h-8 bg-muted rounded-full overflow-hidden">
                <div
                  className="absolute top-0 h-full bg-emerald-200"
                  style={{
                    left: `${(result.royalty_benchmarks.floor / 10) * 100}%`,
                    width: `${((result.royalty_benchmarks.ceiling - result.royalty_benchmarks.floor) / 10) * 100}%`,
                  }}
                />
                <div
                  className="absolute top-0 h-full w-1 bg-emerald-600"
                  style={{ left: `${(result.royalty_benchmarks.recommended_rate / 10) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>Floor: {result.royalty_benchmarks.floor}%</span>
                <span className="font-medium text-emerald-600">Recommended: {result.royalty_benchmarks.recommended_rate}%</span>
                <span>Ceiling: {result.royalty_benchmarks.ceiling}%</span>
              </div>
            </CardContent>
          </Card>

          {/* Revenue Forecast */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Revenue Forecast</CardTitle>
              <CardDescription>Conservative / Base / Optimistic scenarios</CardDescription>
            </CardHeader>
            <CardContent>
              <RevenueProjectionChart data={result.revenue_forecast} />
              <div className="rounded-md border mt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Year</TableHead>
                      <TableHead>Conservative</TableHead>
                      <TableHead>Base</TableHead>
                      <TableHead>Optimistic</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.revenue_forecast.map(row => (
                      <TableRow key={row.year}>
                        <TableCell className="font-mono">{row.year}</TableCell>
                        <TableCell className="text-muted-foreground">{formatCurrency(row.conservative)}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(row.base)}</TableCell>
                        <TableCell className="text-emerald-600">{formatCurrency(row.optimistic)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Licensing Footprint */}
          {result.licensing_footprint.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Licensing Target Footprint</CardTitle>
                <CardDescription>Potential licensees by relevance and estimated revenue</CardDescription>
              </CardHeader>
              <CardContent>
                <BarRankingChart
                  data={result.licensing_footprint.slice(0, 10).map((t) => ({ name: t.entity, value: t.relevance_score }))}
                  color="#8b5cf6"
                  layout="vertical"
                  valueFormatter={(v) => `${v}%`}
                  barLabel="Relevance"
                />
                <div className="rounded-md border mt-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Entity</TableHead>
                        <TableHead>Relevance</TableHead>
                        <TableHead>Est. Revenue at Risk</TableHead>
                        <TableHead>Priority</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.licensing_footprint.map((item, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{item.entity}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={item.relevance_score} className="h-1.5 w-16" />
                              <span className="text-sm">{item.relevance_score}</span>
                            </div>
                          </TableCell>
                          <TableCell>{formatCurrency(item.est_revenue_at_risk)}</TableCell>
                          <TableCell>
                            <Badge variant={getPriorityBadge(item.priority)}>{item.priority}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Licensable Assets */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top Licensable Assets</CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                type AssetRow = typeof result.licensable_assets[number];
                const { column } = createColumns<AssetRow>();
                return (
                  <DataTable
                    data={result.licensable_assets}
                    columns={[
                      column({ accessorKey: 'patent_id', header: ({ column }) => <DataTableColumnHeader column={column} title="Patent ID" />, cell: ({ getValue }) => <span className="font-mono text-sm">{getValue() as string}</span> }),
                      column({ accessorKey: 'title', header: ({ column }) => <DataTableColumnHeader column={column} title="Title" />, cell: ({ getValue }) => <span className="max-w-[200px] truncate block">{getValue() as string}</span> }),
                      column({ accessorKey: 'coverage', header: 'Coverage', cell: ({ getValue }) => <Badge variant="outline">{getValue() as string}</Badge> }),
                      column({ accessorKey: 'licensing_score', header: ({ column }) => <DataTableColumnHeader column={column} title="Licensing Score" />, cell: ({ getValue }) => { const v = getValue() as number; return <div className="flex items-center gap-2"><Progress value={v} className="h-1.5 w-16" /><span className="text-sm">{v}</span></div>; }, meta: { filterType: 'number-range' as const } }),
                      column({ accessorKey: 'claim_count', header: ({ column }) => <DataTableColumnHeader column={column} title="Claims" />, meta: { filterType: 'number-range' as const } }),
                    ]}
                    getRowId={row => row.patent_id}
                    features={{ enableSorting: true, enableFiltering: true, enableColumnVisibility: true, enableExport: true, enableDensityToggle: true }}
                    initialSorting={[{ id: 'licensing_score', desc: true }]}
                    exportConfig={{ filename: 'licensable-assets' }}
                    initialPageSize={15}
                    emptyState="No licensable assets found."
                    className="rounded-none border-0 border-t"
                  />
                );
              })()}
            </CardContent>
          </Card>

          {/* License Structure Options */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">License Structure Options</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {result.license_structure_recommendations.map((ls, i) => (
                  <div key={i} className="p-4 rounded-lg border space-y-2">
                    <div className="font-semibold text-sm">{ls.type}</div>
                    <p className="text-xs text-muted-foreground">{ls.description}</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="text-xs font-medium text-emerald-600 mb-1">Pros</div>
                        <ul className="space-y-1">
                          {ls.pros.map((pro, j) => (
                            <li key={j} className="text-xs text-muted-foreground">+ {pro}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-red-600 mb-1">Cons</div>
                        <ul className="space-y-1">
                          {ls.cons.map((con, j) => (
                            <li key={j} className="text-xs text-muted-foreground">− {con}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Georgia-Pacific Factors */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Georgia-Pacific Factor Analysis</CardTitle>
              <CardDescription>15-factor reasonable royalty framework</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {result.georgia_pacific_scores.map((gp, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="flex-1 text-xs truncate" title={gp.factor}>{gp.factor}</div>
                    <div className="text-xs text-muted-foreground w-48 truncate hidden md:block">{gp.notes}</div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map(star => (
                          <div
                            key={star}
                            className={`w-2 h-2 rounded-sm ${star <= Math.round(gp.score) ? 'bg-blue-500' : 'bg-muted'}`}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-mono w-8">{gp.score.toFixed(1)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          {result.program_recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />Program Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {result.program_recommendations.map((rec, idx) => (
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
            <Handshake className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Analysis Results</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Select a project and run the analysis to identify licensable assets, benchmark royalty rates, and build a licensing strategy.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
