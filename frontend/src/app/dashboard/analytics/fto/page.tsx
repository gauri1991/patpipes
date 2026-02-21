'use client';

import { useState, useCallback } from 'react';
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Loader2,
  Play,
  FileText,
  Info,
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';

import { useAnalyticsProjects } from '@/hooks/useAnalyticsData';
import { analyticsApi, FtoAnalysis, PatentAssessment } from '@/services/analyticsApi';

type SortField = 'risk_score' | 'title' | 'assignee' | 'filing_date';
type SortDir = 'asc' | 'desc';

export default function FtoAnalysisPage() {
  const { projects, loading: projectsLoading } = useAnalyticsProjects();
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [targetDescription, setTargetDescription] = useState('');
  const [analysisResult, setAnalysisResult] = useState<FtoAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedPatents, setExpandedPatents] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>('risk_score');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const runAnalysis = useCallback(async () => {
    if (!selectedProject) return;
    setLoading(true);
    setError(null);
    try {
      const response = await analyticsApi.runFtoAnalysis(selectedProject, targetDescription);
      if (response.success && response.data) {
        setAnalysisResult(response.data);
      } else {
        setError(response.error || 'Failed to run FTO analysis');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [selectedProject, targetDescription]);

  const togglePatent = (patentId: string) => {
    setExpandedPatents(prev => {
      const next = new Set(prev);
      if (next.has(patentId)) {
        next.delete(patentId);
      } else {
        next.add(patentId);
      }
      return next;
    });
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-green-500';
    }
  };

  const getRiskBadgeVariant = (level: string): 'destructive' | 'default' | 'secondary' | 'outline' => {
    switch (level) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'high': return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'medium': return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'low': return <Info className="h-5 w-5 text-blue-500" />;
      default: return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    }
  };

  const sortedAssessments = analysisResult?.patent_assessments
    ? [...analysisResult.patent_assessments].sort((a, b) => {
        const dir = sortDir === 'asc' ? 1 : -1;
        switch (sortField) {
          case 'risk_score': return (a.risk_score - b.risk_score) * dir;
          case 'title': return a.title.localeCompare(b.title) * dir;
          case 'assignee': return (a.assignee || '').localeCompare(b.assignee || '') * dir;
          case 'filing_date': return ((a.filing_date || '') > (b.filing_date || '') ? 1 : -1) * dir;
          default: return 0;
        }
      })
    : [];

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Freedom-to-Operate Analysis</h1>
        <p className="text-muted-foreground">
          Assess patent infringement risks and identify potential obstacles for your technology
        </p>
      </div>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Analysis Configuration</CardTitle>
          <CardDescription>Select a project and describe your target technology</CardDescription>
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
          <div className="space-y-2">
            <Label htmlFor="target-desc">Target Technology Description</Label>
            <Textarea
              id="target-desc"
              placeholder="Describe your product, technology, or process to analyze against existing patents..."
              value={targetDescription}
              onChange={e => setTargetDescription(e.target.value)}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              A detailed description improves the accuracy of risk scoring and claim coverage analysis.
            </p>
          </div>
          <Button
            onClick={runAnalysis}
            disabled={!selectedProject || loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Run Analysis
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Error State */}
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
          {/* Overall Risk Score */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card className="lg:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Overall Risk</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  {getRiskIcon(analysisResult.overall_risk_level)}
                  <div>
                    <div className="text-2xl font-bold">{analysisResult.overall_risk_score}%</div>
                    <Badge variant={getRiskBadgeVariant(analysisResult.overall_risk_level)}>
                      {analysisResult.overall_risk_level.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  High Risk
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analysisResult.risk_summary.high}</div>
                <p className="text-xs text-muted-foreground">patents</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  Medium Risk
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analysisResult.risk_summary.medium}</div>
                <p className="text-xs text-muted-foreground">patents</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  Low Risk
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analysisResult.risk_summary.low}</div>
                <p className="text-xs text-muted-foreground">patents</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  No Risk
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analysisResult.risk_summary.none}</div>
                <p className="text-xs text-muted-foreground">patents</p>
              </CardContent>
            </Card>
          </div>

          {/* Risk Distribution Bar */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Risk Distribution</CardTitle>
              <CardDescription>
                {analysisResult.total_patents_analyzed} patents analyzed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(() => {
                  const total = analysisResult.total_patents_analyzed || 1;
                  const high = (analysisResult.risk_summary.high / total) * 100;
                  const medium = (analysisResult.risk_summary.medium / total) * 100;
                  const low = (analysisResult.risk_summary.low / total) * 100;
                  const none = (analysisResult.risk_summary.none / total) * 100;
                  return (
                    <>
                      <div className="flex h-4 w-full overflow-hidden rounded-full">
                        {high > 0 && <div className="bg-red-500 transition-all" style={{ width: `${high}%` }} />}
                        {medium > 0 && <div className="bg-yellow-500 transition-all" style={{ width: `${medium}%` }} />}
                        {low > 0 && <div className="bg-blue-500 transition-all" style={{ width: `${low}%` }} />}
                        {none > 0 && <div className="bg-green-500 transition-all" style={{ width: `${none}%` }} />}
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>High: {high.toFixed(1)}%</span>
                        <span>Medium: {medium.toFixed(1)}%</span>
                        <span>Low: {low.toFixed(1)}%</span>
                        <span>None: {none.toFixed(1)}%</span>
                      </div>
                    </>
                  );
                })()}
              </div>
            </CardContent>
          </Card>

          {/* Patent Assessments Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Patent Assessments</CardTitle>
              <CardDescription>
                Click on a row to expand claim coverage analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8" />
                      <TableHead
                        className="cursor-pointer hover:text-foreground"
                        onClick={() => handleSort('risk_score')}
                      >
                        Risk {sortField === 'risk_score' && (sortDir === 'asc' ? '↑' : '↓')}
                      </TableHead>
                      <TableHead>Patent ID</TableHead>
                      <TableHead
                        className="cursor-pointer hover:text-foreground"
                        onClick={() => handleSort('title')}
                      >
                        Title {sortField === 'title' && (sortDir === 'asc' ? '↑' : '↓')}
                      </TableHead>
                      <TableHead
                        className="cursor-pointer hover:text-foreground"
                        onClick={() => handleSort('assignee')}
                      >
                        Assignee {sortField === 'assignee' && (sortDir === 'asc' ? '↑' : '↓')}
                      </TableHead>
                      <TableHead>Claims</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead
                        className="cursor-pointer hover:text-foreground"
                        onClick={() => handleSort('filing_date')}
                      >
                        Filed {sortField === 'filing_date' && (sortDir === 'asc' ? '↑' : '↓')}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedAssessments.map((patent: PatentAssessment) => (
                      <Collapsible
                        key={patent.patent_id}
                        open={expandedPatents.has(patent.patent_id)}
                        onOpenChange={() => togglePatent(patent.patent_id)}
                        asChild
                      >
                        <>
                          <CollapsibleTrigger asChild>
                            <TableRow className="cursor-pointer hover:bg-muted/50">
                              <TableCell>
                                {expandedPatents.has(patent.patent_id) ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${getRiskColor(patent.risk_level)}`} />
                                  <span className="font-mono text-sm">{patent.risk_score}</span>
                                </div>
                              </TableCell>
                              <TableCell className="font-mono text-sm">{patent.patent_id}</TableCell>
                              <TableCell className="max-w-[200px] truncate">{patent.title}</TableCell>
                              <TableCell className="max-w-[150px] truncate">{patent.assignee}</TableCell>
                              <TableCell>
                                <span className="text-xs">
                                  {patent.independent_claims_count}i / {patent.dependent_claims_count}d
                                </span>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs">
                                  {patent.legal_status || 'Unknown'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm">
                                {patent.filing_date || '-'}
                              </TableCell>
                            </TableRow>
                          </CollapsibleTrigger>
                          <CollapsibleContent asChild>
                            <TableRow className="bg-muted/30">
                              <TableCell colSpan={8}>
                                <div className="py-3 space-y-3">
                                  <div className="text-sm font-medium">Claim Coverage Analysis</div>
                                  {patent.claim_analysis.length > 0 ? (
                                    <div className="space-y-2">
                                      {patent.claim_analysis.map((claim, idx) => (
                                        <div key={idx} className="flex items-start gap-3 p-2 rounded bg-background border">
                                          <Badge variant={getRiskBadgeVariant(claim.risk_level)} className="shrink-0 mt-0.5">
                                            Claim {claim.claim_number}
                                          </Badge>
                                          <div className="flex-1 min-w-0">
                                            <p className="text-xs text-muted-foreground line-clamp-2">{claim.text}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                              <span className="text-xs">Coverage:</span>
                                              <Progress value={claim.coverage_score} className="h-1.5 w-24" />
                                              <span className="text-xs font-mono">{claim.coverage_score}%</span>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-sm text-muted-foreground">
                                      No independent claims data available for detailed analysis.
                                    </p>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          </CollapsibleContent>
                        </>
                      </Collapsible>
                    ))}
                    {sortedAssessments.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                          No patent assessments found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          {analysisResult.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {analysisResult.recommendations.map((rec, idx) => (
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

      {/* Empty State */}
      {!analysisResult && !loading && !error && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Analysis Results</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Select a project and describe your target technology, then run the analysis
              to identify potential patent infringement risks.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
