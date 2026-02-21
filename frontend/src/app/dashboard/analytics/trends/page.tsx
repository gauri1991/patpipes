'use client';

import { useState, useCallback } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Loader2,
  Play,
  AlertTriangle,
  Zap,
  Activity,
  BarChart3,
  ArrowRight,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
} from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

import { useAnalyticsProjects } from '@/hooks/useAnalyticsData';
import { analyticsApi, TrendAnalysis, AreaTrend } from '@/services/analyticsApi';

const MATURITY_COLORS: Record<string, string> = {
  emerging: 'bg-cyan-500',
  growing: 'bg-green-500',
  mature: 'bg-blue-500',
  declining: 'bg-orange-500',
  unknown: 'bg-gray-400',
};

const MATURITY_BADGE_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  emerging: 'default',
  growing: 'secondary',
  mature: 'outline',
  declining: 'destructive',
  unknown: 'outline',
};

const MATURITY_STAGES = ['emerging', 'growing', 'mature', 'declining'];

function MaturityIndicator({ stage }: { stage: string }) {
  const stageIndex = MATURITY_STAGES.indexOf(stage);
  return (
    <div className="flex items-center gap-1">
      {MATURITY_STAGES.map((s, idx) => (
        <div key={s} className="flex items-center">
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium ${
              idx <= stageIndex
                ? `${MATURITY_COLORS[s]} text-white`
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {idx + 1}
          </div>
          {idx < MATURITY_STAGES.length - 1 && (
            <ArrowRight className={`h-3 w-3 mx-0.5 ${idx < stageIndex ? 'text-foreground' : 'text-muted-foreground/30'}`} />
          )}
        </div>
      ))}
      <span className="ml-2 text-xs text-muted-foreground capitalize">{stage}</span>
    </div>
  );
}

export default function TrendForecastingPage() {
  const { projects, loading: projectsLoading } = useAnalyticsProjects();
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<TrendAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = useCallback(async () => {
    if (!selectedProject) return;
    setLoading(true);
    setError(null);
    try {
      const response = await analyticsApi.forecastTrends(selectedProject);
      if (response.success && response.data) {
        setAnalysisResult(response.data);
      } else {
        setError(response.error || 'Failed to analyze trends');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [selectedProject]);

  // Prepare combined chart data for velocity + forecast
  const velocityChartData = analysisResult
    ? [
        ...analysisResult.filing_velocity.map(v => ({
          month: v.month,
          actual: v.count,
          movingAvg: v.moving_avg,
          predicted: null as number | null,
          upperBound: null as number | null,
          lowerBound: null as number | null,
        })),
        ...analysisResult.forecast.map(f => ({
          month: f.month,
          actual: null as number | null,
          movingAvg: null as number | null,
          predicted: f.predicted,
          upperBound: f.upper_bound,
          lowerBound: f.lower_bound,
        })),
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Trend Forecasting</h1>
        <p className="text-muted-foreground">
          Analyze filing velocity, detect emerging technologies, and forecast future trends
        </p>
      </div>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Analysis Configuration</CardTitle>
          <CardDescription>Select a project to analyze technology trends</CardDescription>
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
                Analyze Trends
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
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Technology Areas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analysisResult.area_trends.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Zap className="h-4 w-4 text-cyan-500" />
                  Emerging
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-cyan-600">
                  {analysisResult.emerging_technologies.length}
                </div>
                <p className="text-xs text-muted-foreground">accelerating areas</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Activity className="h-4 w-4 text-blue-500" />
                  Mature
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {analysisResult.mature_technologies.length}
                </div>
                <p className="text-xs text-muted-foreground">stable areas</p>
              </CardContent>
            </Card>
          </div>

          {/* Filing Velocity Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Filing Velocity
              </CardTitle>
              <CardDescription>
                Monthly patent filings with 3-month moving average and 6-month forecast
              </CardDescription>
            </CardHeader>
            <CardContent>
              {velocityChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={velocityChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="month"
                      className="text-xs"
                      tick={{ fontSize: 11 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis className="text-xs" tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px',
                        fontSize: '12px',
                      }}
                    />
                    <Legend />
                    {/* Forecast confidence band */}
                    <Area
                      type="monotone"
                      dataKey="upperBound"
                      stroke="none"
                      fill="#00D9FF"
                      fillOpacity={0.1}
                      name="Forecast Upper"
                      connectNulls={false}
                    />
                    <Area
                      type="monotone"
                      dataKey="lowerBound"
                      stroke="none"
                      fill="#00D9FF"
                      fillOpacity={0.1}
                      name="Forecast Lower"
                      connectNulls={false}
                    />
                    {/* Actual filings */}
                    <Line
                      type="monotone"
                      dataKey="actual"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      dot={{ r: 2 }}
                      name="Actual Filings"
                      connectNulls={false}
                    />
                    {/* Moving average */}
                    <Line
                      type="monotone"
                      dataKey="movingAvg"
                      stroke="#10B981"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                      name="3-Month Avg"
                      connectNulls={false}
                    />
                    {/* Forecast line */}
                    <Line
                      type="monotone"
                      dataKey="predicted"
                      stroke="#00D9FF"
                      strokeWidth={2}
                      strokeDasharray="8 4"
                      dot={{ r: 3 }}
                      name="Forecast"
                      connectNulls={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-muted-foreground py-12">
                  No filing velocity data available. Ensure patent records include filing dates.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Technology Area Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Technology Area Trends
              </CardTitle>
              <CardDescription>
                Growth rates, maturity stages, and filing patterns per technology area
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analysisResult.area_trends.map((area: AreaTrend) => (
                  <div
                    key={area.name}
                    className="p-4 rounded-lg border bg-card space-y-3"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{area.name}</h4>
                          {area.is_emerging && (
                            <Badge className="bg-cyan-500 hover:bg-cyan-600 text-white">
                              <Zap className="h-3 w-3 mr-1" />
                              Emerging
                            </Badge>
                          )}
                          <Badge variant={MATURITY_BADGE_VARIANT[area.maturity_stage] || 'outline'}>
                            {area.maturity_stage}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {area.total_patents} patents total
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          {area.growth_rate >= 0 ? (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-500" />
                          )}
                          <span
                            className={`text-lg font-bold ${
                              area.growth_rate >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {area.growth_rate > 0 ? '+' : ''}{area.growth_rate}%
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">YoY Growth</span>
                      </div>
                    </div>

                    {/* Maturity S-Curve */}
                    <MaturityIndicator stage={area.maturity_stage} />

                    {/* Yearly filing chart */}
                    {area.yearly_data.length > 0 && (
                      <ResponsiveContainer width="100%" height={120}>
                        <BarChart data={area.yearly_data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                          <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                          <YAxis hide />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'hsl(var(--background))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '6px',
                              fontSize: '12px',
                            }}
                          />
                          <Bar
                            dataKey="count"
                            fill={area.is_emerging ? '#00D9FF' : '#3B82F6'}
                            radius={[2, 2, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                ))}

                {analysisResult.area_trends.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    No technology area trends found. Add technology areas to your project.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Emerging Technologies Highlight */}
          {analysisResult.emerging_technologies.length > 0 && (
            <Card className="border-cyan-200 dark:border-cyan-800">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-cyan-700 dark:text-cyan-400">
                  <Zap className="h-5 w-5" />
                  Emerging Technologies
                </CardTitle>
                <CardDescription>
                  Technologies with accelerating filing rates over the last 3 years
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {analysisResult.emerging_technologies.map((tech: AreaTrend) => (
                    <div
                      key={tech.name}
                      className="p-4 rounded-lg border border-cyan-200 dark:border-cyan-800 bg-cyan-50/50 dark:bg-cyan-950/20"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm">{tech.name}</h4>
                        <span className="text-sm font-bold text-cyan-600">
                          +{tech.growth_rate}%
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {tech.total_patents} patents | {tech.yearly_data.length} years of data
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Empty State */}
      {!analysisResult && !loading && !error && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Trend Analysis</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Select a project and run the analysis to visualize filing trends,
              detect emerging technologies, and forecast future activity.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
