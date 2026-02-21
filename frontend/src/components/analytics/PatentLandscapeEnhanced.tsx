'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Loader2,
  RefreshCw,
  Filter,
  Globe,
  AlertTriangle,
  Layers,
  TrendingUp,
} from 'lucide-react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  Legend,
} from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

import { analyticsApi, LandscapeAnalysis, LandscapeCluster } from '@/services/analyticsApi';

const CLUSTER_COLORS = [
  '#00D9FF', '#FF006E', '#FFD60A', '#3A86FF', '#10B981',
  '#8B5CF6', '#F97316', '#EF4444', '#06B6D4', '#84CC16',
];

interface PatentLandscapeEnhancedProps {
  projectId: string;
}

export function PatentLandscapeEnhanced({ projectId }: PatentLandscapeEnhancedProps) {
  const [data, setData] = useState<LandscapeAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [yearRange, setYearRange] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [jurisdictionFilter, setJurisdictionFilter] = useState<string>('all');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await analyticsApi.analyzeLandscape(projectId);
      if (response.success && response.data) {
        setData(response.data);
        // Derive year range from evolution data
        if (response.data.evolution.length > 0) {
          const years = response.data.evolution.map(e => e.year);
          setYearRange([Math.min(...years), Math.max(...years)]);
        }
      } else {
        setError(response.error || 'Failed to load landscape data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load landscape data');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Prepare bubble chart data
  const bubbleData = useMemo(() => {
    if (!data) return [];
    return data.clusters.map((cluster, idx) => ({
      name: cluster.name,
      x: idx + 1,
      y: cluster.density,
      z: cluster.patent_count,
      color: CLUSTER_COLORS[idx % CLUSTER_COLORS.length],
      isGap: cluster.density < data.average_density * 0.5,
    }));
  }, [data]);

  // Geographic distribution data
  const geoData = useMemo(() => {
    if (!data) return [];
    return Object.entries(data.geographic_distribution)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 15)
      .map(([country, count]) => ({ country, count }));
  }, [data]);

  // Filtered evolution data
  const filteredEvolution = useMemo(() => {
    if (!data) return [];
    let evo = data.evolution;
    if (selectedYear) {
      evo = evo.filter(e => e.year <= selectedYear);
    }
    return evo;
  }, [data, selectedYear]);

  // Jurisdictions for filter
  const jurisdictions = useMemo(() => {
    if (!data) return [];
    return Object.keys(data.geographic_distribution).sort();
  }, [data]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="mt-2 text-muted-foreground">Loading landscape analysis...</p>
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
          <Button variant="outline" size="sm" className="mt-3" onClick={fetchData}>
            <RefreshCw className="mr-2 h-3 w-3" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Patent Landscape
          </h3>
          <p className="text-sm text-muted-foreground">
            {data.total_patents} patents across {data.total_technology_areas} technology areas
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Label className="text-xs">Jurisdiction</Label>
            <Select value={jurisdictionFilter} onValueChange={setJurisdictionFilter}>
              <SelectTrigger className="w-24 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {jurisdictions.map(j => (
                  <SelectItem key={j} value={j}>{j}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Cluster Bubble Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Technology Clusters</CardTitle>
          <CardDescription>
            Bubble size represents patent count, Y-axis shows density (%). Red-outlined bubbles are gap areas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {bubbleData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  type="number"
                  dataKey="x"
                  name="Area"
                  tick={{ fontSize: 11 }}
                  label={{ value: 'Technology Area Index', position: 'bottom', fontSize: 12 }}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  name="Density"
                  unit="%"
                  tick={{ fontSize: 11 }}
                  label={{ value: 'Density (%)', angle: -90, position: 'insideLeft', fontSize: 12 }}
                />
                <ZAxis
                  type="number"
                  dataKey="z"
                  range={[100, 2000]}
                  name="Patents"
                />
                <Tooltip
                  content={({ payload }) => {
                    if (!payload || payload.length === 0) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="bg-background border rounded-lg p-3 shadow-lg text-sm">
                        <p className="font-medium">{d.name}</p>
                        <p className="text-muted-foreground">Patents: {d.z}</p>
                        <p className="text-muted-foreground">Density: {d.y.toFixed(1)}%</p>
                        {d.isGap && <Badge variant="destructive" className="mt-1">Gap Area</Badge>}
                      </div>
                    );
                  }}
                />
                <Scatter data={bubbleData}>
                  {bubbleData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      fillOpacity={entry.isGap ? 0.3 : 0.7}
                      stroke={entry.isGap ? '#EF4444' : entry.color}
                      strokeWidth={entry.isGap ? 2 : 1}
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No cluster data available.
            </div>
          )}
          {/* Cluster Legend */}
          <div className="flex flex-wrap gap-3 mt-4">
            {data.clusters.map((cluster, idx) => (
              <div key={cluster.id} className="flex items-center gap-1.5 text-xs">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: CLUSTER_COLORS[idx % CLUSTER_COLORS.length] }}
                />
                <span>{cluster.name} ({cluster.patent_count})</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Evolution Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Patent Filing Evolution
          </CardTitle>
          <CardDescription>
            Historical patent filings over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Year Slider */}
          {yearRange.length === 2 && yearRange[0] !== yearRange[1] && (
            <div className="mb-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{yearRange[0]}</span>
                <span>
                  {selectedYear ? `Showing up to ${selectedYear}` : 'Showing all years'}
                </span>
                <span>{yearRange[1]}</span>
              </div>
              <Slider
                min={yearRange[0]}
                max={yearRange[1]}
                step={1}
                value={[selectedYear || yearRange[1]]}
                onValueChange={([val]) => setSelectedYear(val === yearRange[1] ? null : val)}
              />
            </div>
          )}
          {filteredEvolution.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={filteredEvolution} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                    fontSize: '12px',
                  }}
                />
                <Line type="monotone" dataKey="count" stroke="#3A86FF" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No evolution data available.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Geographic Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Geographic Distribution
          </CardTitle>
          <CardDescription>Patent filings by country/jurisdiction</CardDescription>
        </CardHeader>
        <CardContent>
          {geoData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={geoData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="country" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" fill="#00D9FF" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No geographic data available.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gap Areas */}
      {data.gaps.length > 0 && (
        <Card className="border-orange-200 dark:border-orange-800">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-orange-700 dark:text-orange-400">
              <Filter className="h-4 w-4" />
              Low-Density Areas (Gaps)
            </CardTitle>
            <CardDescription>
              Technology areas with below-average patent density (below {(data.average_density * 0.5).toFixed(1)}%)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {data.gaps.map(gap => (
                <div
                  key={gap.id}
                  className="p-3 rounded-lg border border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/20"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">{gap.name}</h4>
                    <Badge variant="outline" className="text-xs">
                      {gap.density.toFixed(1)}%
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {gap.patent_count} patents | {gap.keywords.length} keywords
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
