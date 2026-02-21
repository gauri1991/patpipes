'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  BarChart3,
  TrendingUp,
  Target,
  Activity,
  FileText,
  Download,
  RefreshCw,
  Calendar,
  DollarSign,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Area,
  AreaChart
} from 'recharts';

interface ProjectAnalyticsProps {
  projectId: string;
}

interface AnalyticsData {
  overview: {
    patentsFiled: number;
    patentsGranted: number;
    patentsPending: number;
    totalCitations: number;
    avgProsecutionTime: number;
    successRate: number;
    totalValue: number;
    roiPercentage: number;
  };
  timeline: Array<{ month: string; filed: number; granted: number; citations: number }>;
  performance: Array<{ metric: string; value: number; benchmark: number }>;
  technology: Array<{ name: string; patents: number; value: number }>;
  competitors: Array<{ company: string; patents: number; strength: number }>;
  geographic: Array<{ region: string; filings: number; percentage: number }>;
  citations: Array<{ year: string; forward: number; backward: number }>;
}

export function ProjectAnalytics({ projectId }: ProjectAnalyticsProps) {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);

  // Mock data - replace with real API calls
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    overview: {
      patentsFiled: 12,
      patentsGranted: 8,
      patentsPending: 4,
      totalCitations: 156,
      avgProsecutionTime: 18.5,
      successRate: 66.7,
      totalValue: 2500000,
      roiPercentage: 245
    },
    timeline: [],
    performance: [],
    technology: [],
    competitors: [],
    geographic: [],
    citations: []
  });

  useEffect(() => {
    loadAnalyticsData();
  }, [projectId]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      // Mock data loading
      setTimeout(() => {
        setAnalyticsData({
          overview: {
            patentsFiled: 12,
            patentsGranted: 8,
            patentsPending: 4,
            totalCitations: 156,
            avgProsecutionTime: 18.5,
            successRate: 66.7,
            totalValue: 2500000,
            roiPercentage: 245
          },
          timeline: [
            { month: 'Jan', filed: 2, granted: 1, citations: 12 },
            { month: 'Feb', filed: 1, granted: 2, citations: 18 },
            { month: 'Mar', filed: 3, granted: 1, citations: 25 },
            { month: 'Apr', filed: 2, granted: 0, citations: 15 },
            { month: 'May', filed: 1, granted: 2, citations: 28 },
            { month: 'Jun', filed: 3, granted: 2, citations: 35 }
          ],
          performance: [
            { metric: 'Quality Score', value: 92, benchmark: 85 },
            { metric: 'Filing Speed', value: 88, benchmark: 75 },
            { metric: 'Cost Efficiency', value: 78, benchmark: 70 },
            { metric: 'Innovation Index', value: 95, benchmark: 80 },
            { metric: 'Market Impact', value: 85, benchmark: 75 }
          ],
          technology: [
            { name: 'AI/ML', patents: 5, value: 35 },
            { name: 'Quantum', patents: 3, value: 25 },
            { name: 'Biotech', patents: 2, value: 20 },
            { name: 'Materials', patents: 2, value: 20 }
          ],
          competitors: [
            { company: 'Company A', patents: 45, strength: 85 },
            { company: 'Company B', patents: 38, strength: 78 },
            { company: 'Company C', patents: 32, strength: 72 },
            { company: 'Our Company', patents: 12, strength: 88 }
          ],
          geographic: [
            { region: 'US', filings: 8, percentage: 66.7 },
            { region: 'EU', filings: 3, percentage: 25 },
            { region: 'Asia', filings: 1, percentage: 8.3 }
          ],
          citations: [
            { year: '2020', forward: 12, backward: 8 },
            { year: '2021', forward: 25, backward: 15 },
            { year: '2022', forward: 42, backward: 22 },
            { year: '2023', forward: 55, backward: 28 },
            { year: '2024', forward: 22, backward: 12 }
          ]
        });
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading analytics:', error);
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnalyticsData();
    setRefreshing(false);
  };

  const handleExport = () => {
    console.log('Exporting analytics data...');
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6" />
            Project Analytics
          </h2>
          <p className="text-gray-600 mt-1">
            Comprehensive analytics and insights for your project
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Patents Filed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{analyticsData.overview.patentsFiled}</span>
              <Badge variant="secondary" className="text-xs">
                <ArrowUp className="w-3 h-3 mr-1" />
                20%
              </Badge>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {analyticsData.overview.patentsGranted} granted, {analyticsData.overview.patentsPending} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{analyticsData.overview.successRate}%</span>
              <Badge variant="secondary" className="text-xs">
                Above avg
              </Badge>
            </div>
            <Progress value={analyticsData.overview.successRate} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Citations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{analyticsData.overview.totalCitations}</span>
              <Badge variant="secondary" className="text-xs">
                <TrendingUp className="w-3 h-3 mr-1" />
                45%
              </Badge>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Avg {Math.round(analyticsData.overview.totalCitations / analyticsData.overview.patentsFiled)} per patent
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">
                ${(analyticsData.overview.totalValue / 1000000).toFixed(1)}M
              </span>
              <Badge variant="secondary" className="text-xs">
                ROI {analyticsData.overview.roiPercentage}%
              </Badge>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Estimated market value
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="technology">Technology</TabsTrigger>
          <TabsTrigger value="competitive">Competitive</TabsTrigger>
          <TabsTrigger value="citations">Citations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Radar */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={analyticsData.performance}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="metric" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar name="Current" dataKey="value" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
                    <Radar name="Benchmark" dataKey="benchmark" stroke="#10B981" fill="#10B981" fillOpacity={0.3} />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Technology Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Technology Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analyticsData.technology}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {analyticsData.technology.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Geographic Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Geographic Coverage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.geographic.map((region) => (
                  <div key={region.region} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-sm font-medium">{region.region}</span>
                      </div>
                      <div>
                        <p className="font-medium">{region.filings} filings</p>
                        <p className="text-sm text-gray-600">{region.percentage}% of portfolio</p>
                      </div>
                    </div>
                    <Progress value={region.percentage} className="w-32 h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Filing & Grant Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={analyticsData.timeline}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="filed" stackId="1" stroke="#3B82F6" fill="#3B82F6" />
                  <Area type="monotone" dataKey="granted" stackId="1" stroke="#10B981" fill="#10B981" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="technology" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Technology Areas Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={analyticsData.technology}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="patents" fill="#3B82F6" name="Patent Count" />
                  <Bar dataKey="value" fill="#10B981" name="Portfolio %" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="competitive" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Competitive Landscape</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={analyticsData.competitors} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="company" type="category" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="patents" fill="#3B82F6" name="Patent Count" />
                  <Bar dataKey="strength" fill="#10B981" name="Tech Strength" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="citations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Citation Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={analyticsData.citations}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="forward" stroke="#3B82F6" name="Forward Citations" />
                  <Line type="monotone" dataKey="backward" stroke="#10B981" name="Backward Citations" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}