/**
 * Patent Infringement Analysis Dashboard
 * Clean dashboard with stats, charts, and navigable case list
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Shield,
  AlertTriangle,
  Activity,
  TrendingUp,
  FileText,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useInfringementCases, useInfringementDashboard } from '@/hooks/useInfringementData';
import { OverviewTab } from '@/domains/infringement/components';
import { getRiskColor } from '@/domains/infringement/utils';
import { SimplifiedCasesTab } from './SimplifiedCasesTab';

export default function InfringementDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [analysisTypeFilter, setAnalysisTypeFilter] = useState('');

  const { cases, loading: casesLoading, refresh: refetchCases } = useInfringementCases({
    search: searchQuery,
    risk_level: riskFilter || undefined,
    status: statusFilter || undefined,
    analysis_type: analysisTypeFilter || undefined,
  });
  const { stats, loading: statsLoading } = useInfringementDashboard();

  const filteredCases = searchQuery
    ? cases.filter(
        (c) =>
          c.case_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.patent_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.accused_product_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : cases;

  const riskChartData = [
    { name: 'Critical', value: stats?.cases_by_risk?.critical || 0, color: '#ef4444' },
    { name: 'High', value: stats?.cases_by_risk?.high || 0, color: '#f97316' },
    { name: 'Medium', value: stats?.cases_by_risk?.medium || 0, color: '#eab308' },
    { name: 'Low', value: stats?.cases_by_risk?.low || 0, color: '#22c55e' },
  ];

  const statusChartData = [
    { name: 'Draft', value: stats?.cases_by_status?.draft || 0 },
    { name: 'Active', value: stats?.cases_by_status?.active || 0 },
    { name: 'Review', value: stats?.cases_by_status?.review || 0 },
    { name: 'Completed', value: stats?.cases_by_status?.completed || 0 },
    { name: 'On Hold', value: stats?.cases_by_status?.on_hold || 0 },
    { name: 'Closed', value: stats?.cases_by_status?.closed || 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Infringement Analysis</h1>
          <p className="text-muted-foreground">
            Identify and analyze potential patent infringement cases
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard/infringement/new')}>
          <Plus className="h-4 w-4 mr-2" />
          New Case
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cases</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? '...' : stats?.total_cases || 0}
            </div>
            <p className="text-xs text-muted-foreground">All infringement cases</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Analysis</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {statsLoading ? '...' : stats?.active_cases || 0}
            </div>
            <p className="text-xs text-muted-foreground">Currently under review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {statsLoading ? '...' : stats?.high_risk_cases || 0}
            </div>
            <p className="text-xs text-muted-foreground">Elevated risk level</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Risk</CardTitle>
            <Shield className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {statsLoading ? '...' : stats?.critical_risk_cases || 0}
            </div>
            <p className="text-xs text-muted-foreground">Immediate attention needed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Likelihood</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {statsLoading ? '...' : stats?.avg_infringement_likelihood?.toFixed(1) || 0}%
            </div>
            <p className="text-xs text-muted-foreground">Infringement probability</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="cases">All Cases</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <OverviewTab
            cases={filteredCases}
            casesLoading={casesLoading}
            statsLoading={statsLoading}
            stats={stats}
            riskChartData={riskChartData}
            statusChartData={statusChartData}
            getRiskColor={getRiskColor}
          />
        </TabsContent>

        <TabsContent value="cases" className="space-y-4">
          <SimplifiedCasesTab
            cases={filteredCases}
            casesLoading={casesLoading}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            riskFilter={riskFilter}
            setRiskFilter={setRiskFilter}
            analysisTypeFilter={analysisTypeFilter}
            setAnalysisTypeFilter={setAnalysisTypeFilter}
            onRefresh={refetchCases}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
