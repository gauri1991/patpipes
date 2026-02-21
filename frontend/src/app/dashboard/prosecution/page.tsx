/**
 * Patent Prosecution Main Dashboard
 * Overview of all patent applications in prosecution
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus,
  FileText,
  Clock,
  AlertTriangle,
  Scale,
  Edit,
  Calendar,
  Search,
  Filter,
  MoreHorizontal
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProsecutionApplications, useProsecutionDashboard } from '@/hooks/useProsecutionData';
import { PatentApplication } from '@/services/prosecutionApi';

export default function ProsecutionDashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [statusFilter, setStatusFilter] = useState('');

  // Fetch data from backend
  const { applications, loading: applicationsLoading } = useProsecutionApplications({
    search: searchQuery,
    status: statusFilter || undefined
  });
  const { stats, loading: statsLoading } = useProsecutionDashboard();

  // Filter applications based on search
  const filteredApplications = searchQuery
    ? applications.filter(app =>
        app.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.application_number?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : applications;

  const getStatusColor = (status: string) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      filed: 'bg-blue-100 text-blue-800', 
      pending: 'bg-yellow-100 text-yellow-800',
      under_examination: 'bg-blue-100 text-blue-800',
      office_action: 'bg-red-100 text-red-800',
      allowed: 'bg-green-100 text-green-800',
      granted: 'bg-green-100 text-green-800',
      abandoned: 'bg-gray-100 text-gray-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || colors.pending;
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Patent Prosecution</h1>
          <p className="text-muted-foreground">
            Manage patent applications from drafting to grant
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Deadline Calendar
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Application
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? '...' : stats?.total_applications || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              All applications in system
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Cases</CardTitle>
            <Scale className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {statsLoading ? '...' : stats?.active_applications || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              In prosecution
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft Applications</CardTitle>
            <Edit className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {statsLoading ? '...' : stats?.draft_applications || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Being prepared
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Deadlines</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {statsLoading ? '...' : stats?.upcoming_deadlines || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Next 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Office Actions</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {statsLoading ? '...' : stats?.office_actions || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Requiring response
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="deadlines">Deadlines</TabsTrigger>
          <TabsTrigger value="drafting">Drafting</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest updates in your patent applications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {applicationsLoading ? (
                  <div className="text-center py-8">Loading applications...</div>
                ) : filteredApplications.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No applications found. Create your first patent application to get started.
                  </div>
                ) : (
                  filteredApplications.map((app, index) => (
                    <div key={app.id ?? index} className="flex items-center justify-between border-b pb-4 last:border-b-0">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{app.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {app.application_number} • Filed {app.filing_date ? formatDate(app.filing_date) : 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(app.status ?? 'pending')}>
                          {(app.status ?? 'pending').replace('_', ' ')}
                        </Badge>
                        <Badge className={getPriorityColor(app.priority_level ?? 'medium')}>
                          {app.priority_level ?? 'medium'}
                        </Badge>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="applications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Patent Applications</CardTitle>
              <CardDescription>
                Manage and track your patent application portfolio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search applications..." 
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </div>

              <div className="space-y-3">
                {applicationsLoading ? (
                  <div className="text-center py-8">Loading applications...</div>
                ) : filteredApplications.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No applications found.
                  </div>
                ) : (
                  filteredApplications.map((app, index) => (
                    <div key={app.id ?? index} className="p-4 border rounded-lg hover:bg-accent">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold">{app.title}</h3>
                            <Badge className={getStatusColor(app.status ?? 'pending')}>
                              {(app.status ?? 'pending').replace('_', ' ')}
                            </Badge>
                            <Badge className={getPriorityColor(app.priority_level ?? 'medium')}>
                              {app.priority_level ?? 'medium'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-6 text-sm text-muted-foreground">
                            <span>{app.application_number || 'Draft'}</span>
                            <span>Filed: {app.filing_date ? formatDate(app.filing_date) : 'N/A'}</span>
                            <span>Attorney: {app.attorney?.name || 'Unassigned'}</span>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deadlines" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Deadlines</CardTitle>
              <CardDescription>
                Critical dates and actions required
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Deadline Management</h3>
                <p className="text-muted-foreground mb-4">
                  Comprehensive deadline tracking coming soon
                </p>
                <Button>Set Up Deadline Tracking</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="drafting" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Document Drafting</CardTitle>
              <CardDescription>
                AI-powered patent drafting tools and templates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <Link href="/dashboard/prosecution/claims-builder">
                  <Card className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Edit className="h-5 w-5 text-blue-500" />
                        Claims Builder
                      </CardTitle>
                      <CardDescription>
                        AI-assisted claim generation and optimization
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </Link>

                <Link href="/dashboard/prosecution/drafting">
                  <Card className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <FileText className="h-5 w-5 text-green-500" />
                        Patent Drafting
                      </CardTitle>
                      <CardDescription>
                        Professional patent document creation
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </Link>

                <Link href="/dashboard/prosecution/mpep-checker">
                  <Card className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Scale className="h-5 w-5 text-purple-500" />
                        MPEP Checker
                      </CardTitle>
                      <CardDescription>
                        Compliance validation and suggestions
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}