'use client';

import { useState, useCallback } from 'react';
import {
  Grid3X3,
  Target,
  Loader2,
  Play,
  Lightbulb,
  AlertTriangle,
  TrendingUp,
  MapPin,
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';

import { useAnalyticsProjects } from '@/hooks/useAnalyticsData';
import { analyticsApi, WhiteSpaceAnalysis } from '@/services/analyticsApi';

function getCellColor(count: number, maxCount: number): string {
  if (count === 0) return 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400';
  const ratio = count / Math.max(maxCount, 1);
  if (ratio < 0.2) return 'bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400';
  if (ratio < 0.5) return 'bg-yellow-100 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-400';
  if (ratio < 0.75) return 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400';
  return 'bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400';
}

export default function WhiteSpaceAnalysisPage() {
  const { projects, loading: projectsLoading } = useAnalyticsProjects();
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<WhiteSpaceAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = useCallback(async () => {
    if (!selectedProject) return;
    setLoading(true);
    setError(null);
    try {
      const response = await analyticsApi.findWhiteSpace(selectedProject);
      if (response.success && response.data) {
        setAnalysisResult(response.data);
      } else {
        setError(response.error || 'Failed to identify white space');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [selectedProject]);

  // Find max count in the matrix for color scaling
  const maxCount = analysisResult?.matrix.reduce((max, row) => {
    const rowMax = Math.max(...Object.values(row.domains).map(Number), 0);
    return Math.max(max, rowMax);
  }, 0) || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">White Space Analysis</h1>
        <p className="text-muted-foreground">
          Identify untapped technology-domain combinations and filing opportunities
        </p>
      </div>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Analysis Configuration</CardTitle>
          <CardDescription>Select a project to analyze for white space opportunities</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="project-select">Analytics Project</Label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger id="project-select">
                  <SelectValue placeholder={projectsLoading ? 'Loading projects...' : 'Select a project'} />
                </SelectTrigger>
                <SelectContent>
                  {projects.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={runAnalysis} disabled={!selectedProject || loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Analyze White Space
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Error */}
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

      {/* Results */}
      {analysisResult && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Patents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analysisResult.total_patents}</div>
                <p className="text-xs text-muted-foreground">in dataset</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Target className="h-4 w-4 text-red-500" />
                  White Spaces
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{analysisResult.total_white_spaces}</div>
                <p className="text-xs text-muted-foreground">zero-patent combinations</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-orange-500" />
                  Low Density
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{analysisResult.total_low_density}</div>
                <p className="text-xs text-muted-foreground">fewer than 3 patents</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-cyan-500" />
                  Opportunities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-cyan-600">{analysisResult.opportunities.length}</div>
                <p className="text-xs text-muted-foreground">identified</p>
              </CardContent>
            </Card>
          </div>

          {/* Gap Matrix */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Grid3X3 className="h-5 w-5" />
                Gap Matrix
              </CardTitle>
              <CardDescription>
                Technology areas (rows) vs. application domains (columns). Color intensity
                reflects patent density. Red cells indicate white space opportunities.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analysisResult.matrix.length > 0 && analysisResult.application_domains.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-semibold min-w-[180px]">Technology Area</TableHead>
                        <TableHead className="text-center">Total</TableHead>
                        {analysisResult.application_domains.map(domain => (
                          <TableHead key={domain} className="text-center min-w-[80px]">
                            <div className="flex items-center justify-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {domain}
                            </div>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analysisResult.matrix.map(row => (
                        <TableRow key={row.technology_area_id}>
                          <TableCell className="font-medium">{row.technology_area}</TableCell>
                          <TableCell className="text-center font-mono text-sm">
                            {row.total_patents}
                          </TableCell>
                          {analysisResult.application_domains.map(domain => {
                            const count = row.domains[domain] ?? 0;
                            return (
                              <TableCell
                                key={domain}
                                className={`text-center font-mono text-sm ${getCellColor(count, maxCount)}`}
                              >
                                {count}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No matrix data available. Ensure your project has technology areas and patent data.
                </p>
              )}

              {/* Color Legend */}
              <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                <span className="font-medium">Legend:</span>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded bg-red-100 dark:bg-red-950/40 border" />
                  <span>0 (White Space)</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded bg-orange-100 dark:bg-orange-950/40 border" />
                  <span>Low</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded bg-yellow-100 dark:bg-yellow-950/40 border" />
                  <span>Medium</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded bg-green-100 dark:bg-green-950/40 border" />
                  <span>High</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Opportunities Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Filing Opportunities
              </CardTitle>
              <CardDescription>
                Ranked by opportunity score. Higher scores indicate more attractive filing targets.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Technology Area</TableHead>
                      <TableHead>Domain</TableHead>
                      <TableHead className="text-center">Patents</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Recommendation</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analysisResult.opportunities.map((opp, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{opp.technology_area}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{opp.application_domain}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={opp.patent_count === 0 ? 'destructive' : 'secondary'}
                          >
                            {opp.patent_count}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={opp.opportunity_score} className="h-2 w-16" />
                            <span className="text-sm font-mono">{opp.opportunity_score}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[300px]">
                          {opp.recommendation}
                        </TableCell>
                      </TableRow>
                    ))}
                    {analysisResult.opportunities.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          No opportunities identified. The patent landscape appears well covered.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty State */}
      {!analysisResult && !loading && !error && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Grid3X3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Analysis Results</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Select a project and run the analysis to identify white space opportunities
              in the patent landscape.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
