'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Loader2,
  RefreshCw,
  AlertTriangle,
  Shield,
  Target,
  TrendingUp,
  Layers,
  Lightbulb,
  CheckCircle2,
  AlertCircle,
  Zap,
  BarChart3,
} from 'lucide-react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';

import {
  analyticsApi,
  LandscapeAnalysis,
  FtoAnalysis,
  WhiteSpaceAnalysis,
  TrendAnalysis,
} from '@/services/analyticsApi';

interface IPStrategyDashboardProps {
  projectId: string;
}

interface StrategyItem {
  priority: 'high' | 'medium' | 'low';
  category: string;
  title: string;
  description: string;
}

export function IPStrategyDashboard({ projectId }: IPStrategyDashboardProps) {
  const [landscape, setLandscape] = useState<LandscapeAnalysis | null>(null);
  const [fto, setFto] = useState<FtoAnalysis | null>(null);
  const [whiteSpace, setWhiteSpace] = useState<WhiteSpaceAnalysis | null>(null);
  const [trends, setTrends] = useState<TrendAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingStage, setLoadingStage] = useState<string>('');

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setLoadingStage('Analyzing landscape...');
      const landscapeRes = await analyticsApi.analyzeLandscape(projectId);
      if (landscapeRes.success && landscapeRes.data) {
        setLandscape(landscapeRes.data);
      }

      setLoadingStage('Running FTO analysis...');
      const ftoRes = await analyticsApi.runFtoAnalysis(projectId);
      if (ftoRes.success && ftoRes.data) {
        setFto(ftoRes.data);
      }

      setLoadingStage('Identifying white space...');
      const wsRes = await analyticsApi.findWhiteSpace(projectId);
      if (wsRes.success && wsRes.data) {
        setWhiteSpace(wsRes.data);
      }

      setLoadingStage('Forecasting trends...');
      const trendsRes = await analyticsApi.forecastTrends(projectId);
      if (trendsRes.success && trendsRes.data) {
        setTrends(trendsRes.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analysis data');
    } finally {
      setLoading(false);
      setLoadingStage('');
    }
  }, [projectId]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Portfolio Strength radar data
  const radarData = buildRadarData(landscape, fto, whiteSpace, trends);

  // Strategy recommendations
  const strategyItems = buildStrategyItems(landscape, fto, whiteSpace, trends);

  // Competitive positioning summary
  const competitivePosition = buildCompetitivePosition(landscape, fto);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="mt-2 text-muted-foreground">{loadingStage || 'Loading...'}</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertTriangle className="h-5 w-5" />
            <p className="font-medium">{error}</p>
          </div>
          <Button variant="outline" size="sm" className="mt-3" onClick={fetchAllData}>
            <RefreshCw className="mr-2 h-3 w-3" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const hasData = landscape || fto || whiteSpace || trends;

  if (!hasData) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center">
          <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Analysis Data</h3>
          <p className="text-muted-foreground mb-4">
            Run the comprehensive IP strategy analysis for this project.
          </p>
          <Button onClick={fetchAllData}>
            <Zap className="mr-2 h-4 w-4" />
            Run Analysis
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            IP Strategy Dashboard
          </h3>
          <p className="text-sm text-muted-foreground">
            Comprehensive view of patent portfolio strength and strategic opportunities
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAllData}>
          <RefreshCw className="mr-2 h-3 w-3" />
          Refresh
        </Button>
      </div>

      {/* Key Metrics Row */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Layers className="h-4 w-4 text-blue-500" />
              Landscape
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{landscape?.total_patents ?? '-'}</div>
            <p className="text-xs text-muted-foreground">
              {landscape?.total_technology_areas ?? 0} tech areas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4 text-red-500" />
              FTO Risk
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">
                {fto ? `${fto.overall_risk_score}%` : '-'}
              </span>
              {fto && (
                <Badge variant={
                  fto.overall_risk_level === 'high' ? 'destructive' :
                  fto.overall_risk_level === 'medium' ? 'default' : 'secondary'
                }>
                  {fto.overall_risk_level}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-cyan-500" />
              Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-600">
              {whiteSpace?.opportunities.length ?? '-'}
            </div>
            <p className="text-xs text-muted-foreground">
              {whiteSpace?.total_white_spaces ?? 0} white spaces
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              Emerging
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {trends?.emerging_technologies.length ?? '-'}
            </div>
            <p className="text-xs text-muted-foreground">technologies rising</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Portfolio Strength Radar */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Portfolio Strength</CardTitle>
            <CardDescription>
              Multi-dimensional assessment of your IP portfolio
            </CardDescription>
          </CardHeader>
          <CardContent>
            {radarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <RadarChart data={radarData}>
                  <PolarGrid className="stroke-muted" />
                  <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 100]}
                    tick={{ fontSize: 10 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                      fontSize: '12px',
                    }}
                  />
                  <Radar
                    name="Strength"
                    dataKey="value"
                    stroke="#00D9FF"
                    fill="#00D9FF"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                Insufficient data for radar chart.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Competitive Positioning */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Competitive Positioning</CardTitle>
            <CardDescription>Summary of your position in the patent landscape</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {competitivePosition.map((item, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{item.label}</span>
                    <span className="text-sm text-muted-foreground">{item.display}</span>
                  </div>
                  <Progress value={item.value} className="h-2" />
                </div>
              ))}
              {competitivePosition.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  No positioning data available yet.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Strategy Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Strategic Recommendations
          </CardTitle>
          <CardDescription>
            Priority-ranked action items based on the comprehensive analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {strategyItems.map((item, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 rounded-lg border">
                <div className="shrink-0 mt-0.5">
                  {item.priority === 'high' && <AlertTriangle className="h-4 w-4 text-red-500" />}
                  {item.priority === 'medium' && <AlertCircle className="h-4 w-4 text-yellow-500" />}
                  {item.priority === 'low' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge
                      variant={
                        item.priority === 'high' ? 'destructive' :
                        item.priority === 'medium' ? 'default' : 'secondary'
                      }
                      className="text-xs"
                    >
                      {item.priority}
                    </Badge>
                    <Badge variant="outline" className="text-xs">{item.category}</Badge>
                  </div>
                  <h4 className="font-medium text-sm">{item.title}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                </div>
              </div>
            ))}
            {strategyItems.length === 0 && (
              <p className="text-center text-muted-foreground py-4">
                No strategy recommendations available yet.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------- Helper Functions ----------

function buildRadarData(
  landscape: LandscapeAnalysis | null,
  fto: FtoAnalysis | null,
  whiteSpace: WhiteSpaceAnalysis | null,
  trends: TrendAnalysis | null
) {
  const data = [];

  // Coverage breadth: how many tech areas have patents
  if (landscape) {
    const coveredAreas = landscape.clusters.filter(c => c.patent_count > 0).length;
    const coverage = landscape.total_technology_areas > 0
      ? (coveredAreas / landscape.total_technology_areas) * 100
      : 0;
    data.push({ dimension: 'Coverage', value: Math.round(coverage) });
  }

  // FTO Safety: inverse of risk
  if (fto) {
    data.push({ dimension: 'FTO Safety', value: Math.round(100 - fto.overall_risk_score) });
  }

  // Innovation: emerging tech ratio
  if (trends) {
    const emergingRatio = trends.area_trends.length > 0
      ? (trends.emerging_technologies.length / trends.area_trends.length) * 100
      : 0;
    data.push({ dimension: 'Innovation', value: Math.round(emergingRatio) });
  }

  // Geographic reach
  if (landscape) {
    const geoCount = Object.keys(landscape.geographic_distribution).length;
    const geoScore = Math.min(geoCount * 10, 100); // 10 jurisdictions = max
    data.push({ dimension: 'Geo Reach', value: geoScore });
  }

  // Density
  if (landscape) {
    data.push({ dimension: 'Density', value: Math.min(Math.round(landscape.average_density), 100) });
  }

  // Opportunity
  if (whiteSpace) {
    const oppScore = Math.min(whiteSpace.opportunities.length * 5, 100);
    data.push({ dimension: 'Opportunity', value: oppScore });
  }

  return data;
}

function buildStrategyItems(
  landscape: LandscapeAnalysis | null,
  fto: FtoAnalysis | null,
  whiteSpace: WhiteSpaceAnalysis | null,
  trends: TrendAnalysis | null
): StrategyItem[] {
  const items: StrategyItem[] = [];

  // FTO-based recommendations
  if (fto) {
    if (fto.overall_risk_level === 'high') {
      items.push({
        priority: 'high',
        category: 'FTO',
        title: 'Address High Patent Infringement Risk',
        description: `Overall risk score is ${fto.overall_risk_score}%. ${fto.risk_summary.high} high-risk patents require immediate review. Consider design-around strategies or licensing.`,
      });
    }
    if (fto.risk_summary.high > 0) {
      items.push({
        priority: 'high',
        category: 'FTO',
        title: `Review ${fto.risk_summary.high} High-Risk Patents`,
        description: 'Engage patent counsel for detailed claim-by-claim analysis of the highest-risk patents.',
      });
    }
  }

  // White space opportunities
  if (whiteSpace && whiteSpace.total_white_spaces > 0) {
    items.push({
      priority: 'medium',
      category: 'Filing',
      title: `${whiteSpace.total_white_spaces} White Space Filing Opportunities`,
      description: 'Empty technology-jurisdiction combinations identified. Consider strategic patent filings in these areas.',
    });
  }

  // Emerging technology
  if (trends && trends.emerging_technologies.length > 0) {
    items.push({
      priority: 'medium',
      category: 'Innovation',
      title: `Monitor ${trends.emerging_technologies.length} Emerging Technologies`,
      description: `Technologies with accelerating filing rates: ${trends.emerging_technologies.map(t => t.name).join(', ')}. Consider expanding R&D and filing activity.`,
    });
  }

  // Gap areas in landscape
  if (landscape && landscape.gaps.length > 0) {
    items.push({
      priority: 'low',
      category: 'Coverage',
      title: `Strengthen ${landscape.gaps.length} Low-Density Areas`,
      description: `Technology areas below average density. Consider targeted filings to improve portfolio balance.`,
    });
  }

  // Geographic expansion
  if (landscape) {
    const geoCount = Object.keys(landscape.geographic_distribution).length;
    if (geoCount < 5) {
      items.push({
        priority: 'medium',
        category: 'Geographic',
        title: 'Expand Geographic Coverage',
        description: `Portfolio currently covers only ${geoCount} jurisdictions. Consider filings in additional key markets.`,
      });
    }
  }

  // Mature technology monitoring
  if (trends && trends.mature_technologies.length > 0) {
    items.push({
      priority: 'low',
      category: 'Portfolio',
      title: `Review ${trends.mature_technologies.length} Mature Technology Areas`,
      description: 'These areas may benefit from portfolio pruning or continuation filings to maintain protection.',
    });
  }

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  items.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return items;
}

function buildCompetitivePosition(
  landscape: LandscapeAnalysis | null,
  fto: FtoAnalysis | null
): Array<{ label: string; value: number; display: string }> {
  const items = [];

  if (landscape) {
    // Portfolio size relative to landscape
    items.push({
      label: 'Portfolio Size',
      value: Math.min(landscape.total_patents, 100),
      display: `${landscape.total_patents} patents`,
    });

    // Technology diversity
    const coveredAreas = landscape.clusters.filter(c => c.patent_count > 0).length;
    const diversityScore = landscape.total_technology_areas > 0
      ? Math.round((coveredAreas / landscape.total_technology_areas) * 100)
      : 0;
    items.push({
      label: 'Technology Diversity',
      value: diversityScore,
      display: `${coveredAreas}/${landscape.total_technology_areas} areas covered`,
    });

    // Average density
    items.push({
      label: 'Patent Density',
      value: Math.min(Math.round(landscape.average_density), 100),
      display: `${landscape.average_density.toFixed(1)}% average`,
    });

    // Geographic spread
    const geoCount = Object.keys(landscape.geographic_distribution).length;
    items.push({
      label: 'Geographic Spread',
      value: Math.min(geoCount * 10, 100),
      display: `${geoCount} jurisdictions`,
    });
  }

  if (fto) {
    items.push({
      label: 'FTO Safety Score',
      value: Math.round(100 - fto.overall_risk_score),
      display: `${(100 - fto.overall_risk_score).toFixed(1)}%`,
    });
  }

  return items;
}
