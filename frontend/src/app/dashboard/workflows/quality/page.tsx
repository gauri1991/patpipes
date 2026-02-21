'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Target,
  FileCheck,
  Activity,
  AlertCircle,
  Download,
  RefreshCw,
  Eye,
} from 'lucide-react';
import { workflowApi } from '@/services/workflowApi';

interface QualityMetrics {
  total_checks: number;
  passed_checks: number;
  failed_checks: number;
  pass_rate: number;
  average_score: number;
  improvement_trend: number;
  critical_issues: number;
  error_issues: number;
  warning_issues: number;
  info_issues: number;
}

interface QualityTrend {
  date: string;
  pass_rate: number;
  avg_score: number;
  total_checks: number;
}

interface QualityDistribution {
  excellent: number;
  good: number;
  fair: number;
  poor: number;
}

interface TopFailingControl {
  control_name: string;
  control_type: string;
  failure_count: number;
  avg_score: number;
}

interface QualityAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  title: string;
  message: string;
  workflow_name: string;
  timestamp: string;
}

interface ComplianceMetric {
  name: string;
  current_score: number;
  target_score: number;
  trend: 'up' | 'down' | 'stable';
  status: 'good' | 'warning' | 'critical';
}

// Mock data fallbacks
function getMockMetrics(): QualityMetrics {
  return {
    total_checks: 1245,
    passed_checks: 1098,
    failed_checks: 147,
    pass_rate: 88.2,
    average_score: 89.5,
    improvement_trend: 2.3,
    critical_issues: 12,
    error_issues: 35,
    warning_issues: 78,
    info_issues: 22
  };
}

function getMockTrends(): QualityTrend[] {
  return [
    { date: '2024-02-01', pass_rate: 85.2, avg_score: 87.1, total_checks: 45 },
    { date: '2024-02-02', pass_rate: 86.1, avg_score: 87.8, total_checks: 52 },
    { date: '2024-02-03', pass_rate: 88.4, avg_score: 89.2, total_checks: 48 },
    { date: '2024-02-04', pass_rate: 89.1, avg_score: 90.1, total_checks: 55 },
    { date: '2024-02-05', pass_rate: 87.8, avg_score: 88.9, total_checks: 47 },
    { date: '2024-02-06', pass_rate: 90.2, avg_score: 91.3, total_checks: 53 },
    { date: '2024-02-07', pass_rate: 88.7, avg_score: 89.8, total_checks: 49 }
  ];
}

function getMockDistribution(): QualityDistribution {
  return { excellent: 456, good: 342, fair: 178, poor: 69 };
}

function getMockTopFailingControls(): TopFailingControl[] {
  return [
    { control_name: 'Patent Claims Completeness', control_type: 'automated', failure_count: 23, avg_score: 65.2 },
    { control_name: 'Prior Art Citation Format', control_type: 'manual', failure_count: 18, avg_score: 71.8 },
    { control_name: 'Technical Drawing Compliance', control_type: 'checklist', failure_count: 15, avg_score: 69.4 },
    { control_name: 'Abstract Length Validation', control_type: 'automated', failure_count: 12, avg_score: 73.1 },
    { control_name: 'Inventor Declaration Review', control_type: 'manual', failure_count: 10, avg_score: 76.5 }
  ];
}

function getMockAlerts(): QualityAlert[] {
  return [
    {
      id: '1', type: 'error', title: 'Critical Quality Failure',
      message: 'Patent claims validation failed - missing essential elements',
      workflow_name: 'Patent Application - Quantum Computing System',
      timestamp: '2024-02-28T10:30:00Z'
    },
    {
      id: '2', type: 'warning', title: 'Quality Score Below Threshold',
      message: 'Technical drawing review scored 68% (threshold: 75%)',
      workflow_name: 'Trademark Registration - TechFlow Brand',
      timestamp: '2024-02-28T09:45:00Z'
    },
    {
      id: '3', type: 'info', title: 'Quality Improvement',
      message: 'Prior art search quality has improved by 12% this week',
      workflow_name: 'System-wide',
      timestamp: '2024-02-27T16:20:00Z'
    }
  ];
}

function getMockComplianceMetrics(): ComplianceMetric[] {
  return [
    { name: 'USPTO Compliance', current_score: 94.2, target_score: 95.0, trend: 'up', status: 'good' },
    { name: 'Quality Gate Adherence', current_score: 87.8, target_score: 90.0, trend: 'stable', status: 'warning' },
    { name: 'Documentation Standards', current_score: 91.5, target_score: 92.0, trend: 'up', status: 'good' },
    { name: 'Review Process Compliance', current_score: 96.1, target_score: 95.0, trend: 'up', status: 'good' },
    { name: 'Deadline Adherence', current_score: 82.3, target_score: 85.0, trend: 'down', status: 'critical' }
  ];
}

export default function QualityDashboard() {
  const [metrics, setMetrics] = useState<QualityMetrics | null>(null);
  const [trends, setTrends] = useState<QualityTrend[]>([]);
  const [distribution, setDistribution] = useState<QualityDistribution | null>(null);
  const [topFailingControls, setTopFailingControls] = useState<TopFailingControl[]>([]);
  const [alerts, setAlerts] = useState<QualityAlert[]>([]);
  const [complianceMetrics, setComplianceMetrics] = useState<ComplianceMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedTab, setSelectedTab] = useState('overview');
  const [isUsingDemoData, setIsUsingDemoData] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    let usedMock = false;

    // Try to fetch quality analytics from API
    try {
      const qualityData = await workflowApi.getQualityAnalytics({
        start_date: getStartDate(timeRange),
        end_date: new Date().toISOString().split('T')[0],
      });

      // If API returns data, extract what we can
      if (qualityData) {
        if (qualityData.metrics) setMetrics(qualityData.metrics);
        else { setMetrics(getMockMetrics()); usedMock = true; }

        if (qualityData.trends) setTrends(qualityData.trends);
        else { setTrends(getMockTrends()); usedMock = true; }

        if (qualityData.distribution) setDistribution(qualityData.distribution);
        else { setDistribution(getMockDistribution()); usedMock = true; }

        if (qualityData.top_failing_controls) setTopFailingControls(qualityData.top_failing_controls);
        else { setTopFailingControls(getMockTopFailingControls()); usedMock = true; }

        if (qualityData.alerts) setAlerts(qualityData.alerts);
        else { setAlerts(getMockAlerts()); usedMock = true; }

        if (qualityData.compliance_metrics) setComplianceMetrics(qualityData.compliance_metrics);
        else { setComplianceMetrics(getMockComplianceMetrics()); usedMock = true; }
      } else {
        throw new Error('Empty response');
      }
    } catch (err) {
      console.error('Quality analytics API failed, using mock data:', err);
      usedMock = true;
      setMetrics(getMockMetrics());
      setTrends(getMockTrends());
      setDistribution(getMockDistribution());
      setTopFailingControls(getMockTopFailingControls());
      setAlerts(getMockAlerts());
      setComplianceMetrics(getMockComplianceMetrics());
    }

    setIsUsingDemoData(usedMock);
    setLoading(false);
  }, [timeRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const pieColors = ['#10B981', '#F59E0B', '#EF4444', '#6B7280'];

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info': return <CheckCircle className="w-4 h-4 text-blue-500" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getComplianceStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-500" />;
      case 'stable': return <Activity className="w-4 h-4 text-gray-500" />;
      default: return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg">Loading quality dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-3xl font-bold">Quality Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Track quality metrics and compliance across all workflows
            </p>
          </div>
          {isUsingDemoData && (
            <Badge variant="outline" className="text-xs text-muted-foreground">
              Demo Data
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 days</SelectItem>
              <SelectItem value="30d">30 days</SelectItem>
              <SelectItem value="90d">90 days</SelectItem>
              <SelectItem value="1y">1 year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => fetchData()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{metrics.total_checks.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">Total Checks</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{metrics.pass_rate}%</p>
                  <p className="text-sm text-gray-600">Pass Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">{metrics.average_score}</p>
                  <p className="text-sm text-gray-600">Avg Score</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">+{metrics.improvement_trend}%</p>
                  <p className="text-sm text-gray-600">Improvement</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <div>
                  <p className="text-2xl font-bold">{metrics.critical_issues}</p>
                  <p className="text-sm text-gray-600">Critical Issues</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold">{metrics.failed_checks}</p>
                  <p className="text-sm text-gray-600">Failed Checks</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quality Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Quality Score Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {distribution && (
                  <div className="space-y-4">
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Excellent (90-100)', value: distribution.excellent, color: '#10B981' },
                            { name: 'Good (75-89)', value: distribution.good, color: '#F59E0B' },
                            { name: 'Fair (60-74)', value: distribution.fair, color: '#EF4444' },
                            { name: 'Poor (0-59)', value: distribution.poor, color: '#6B7280' }
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={80}
                          dataKey="value"
                        >
                          {Object.values(distribution).map((_, index) => (
                            <Cell key={`cell-${index}`} fill={pieColors[index]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span>Excellent: {distribution.excellent}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                          <span>Good: {distribution.good}</span>
                        </div>
                      </div>
                      <div className="text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          <span>Fair: {distribution.fair}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                          <span>Poor: {distribution.poor}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Issue Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Issue Severity Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                {metrics && (
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                          <span className="text-sm">Critical</span>
                        </div>
                        <span className="font-medium">{metrics.critical_issues}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <XCircle className="w-4 h-4 text-orange-500" />
                          <span className="text-sm">Error</span>
                        </div>
                        <span className="font-medium">{metrics.error_issues}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-yellow-500" />
                          <span className="text-sm">Warning</span>
                        </div>
                        <span className="font-medium">{metrics.warning_issues}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-blue-500" />
                          <span className="text-sm">Info</span>
                        </div>
                        <span className="font-medium">{metrics.info_issues}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Top Failing Quality Controls */}
          <Card>
            <CardHeader>
              <CardTitle>Top Failing Quality Controls</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topFailingControls.map((control, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{control.control_name}</div>
                      <div className="text-sm text-gray-600">
                        Type: {control.control_type} -- {control.failure_count} failures
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{control.avg_score}%</div>
                      <div className="text-sm text-gray-600">Avg Score</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quality Trends Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="pass_rate"
                    stroke="#10B981"
                    strokeWidth={2}
                    name="Pass Rate (%)"
                  />
                  <Line
                    type="monotone"
                    dataKey="avg_score"
                    stroke="#8B5CF6"
                    strokeWidth={2}
                    name="Avg Score"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Daily Quality Check Volume</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="total_checks"
                    stroke="#3B82F6"
                    fill="#3B82F6"
                    fillOpacity={0.3}
                    name="Total Checks"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {complianceMetrics.map((metric, index) => (
              <Card key={index}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span>{metric.name}</span>
                    {getTrendIcon(metric.trend)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Current Score</span>
                      <span className={`text-2xl font-bold ${getComplianceStatusColor(metric.status)}`}>
                        {metric.current_score}%
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span>Progress to Target</span>
                        <span>{metric.target_score}%</span>
                      </div>
                      <Progress
                        value={(metric.current_score / metric.target_score) * 100}
                        className="h-2"
                      />
                    </div>
                    <div className={`text-sm ${getComplianceStatusColor(metric.status)}`}>
                      {metric.status === 'good' && 'Meeting compliance targets'}
                      {metric.status === 'warning' && 'Below target - attention needed'}
                      {metric.status === 'critical' && 'Critical - immediate action required'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Quality Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alerts.map((alert) => (
                  <div key={alert.id} className="flex items-start gap-3 p-4 border rounded-lg">
                    {getAlertIcon(alert.type)}
                    <div className="flex-1">
                      <div className="font-medium">{alert.title}</div>
                      <div className="text-sm text-gray-600 mt-1">{alert.message}</div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>Workflow: {alert.workflow_name}</span>
                        <span>{formatDate(alert.timestamp)}</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" aria-label="View alert details">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/**
 * Calculate start date based on time range string.
 */
function getStartDate(timeRange: string): string {
  const now = new Date();
  switch (timeRange) {
    case '7d':
      now.setDate(now.getDate() - 7);
      break;
    case '30d':
      now.setDate(now.getDate() - 30);
      break;
    case '90d':
      now.setDate(now.getDate() - 90);
      break;
    case '1y':
      now.setFullYear(now.getFullYear() - 1);
      break;
    default:
      now.setDate(now.getDate() - 30);
  }
  return now.toISOString().split('T')[0];
}
