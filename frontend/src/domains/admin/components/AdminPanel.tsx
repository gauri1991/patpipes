/**
 * AdminPanel Component
 * Administrative interface for system configuration and management
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Settings, 
  Users, 
  Database, 
  Shield, 
  BarChart3, 
  FileText, 
  ArrowLeft,
  Activity,
  Server,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  UserPlus,
  Key,
  Globe,
  HardDrive,
  TableProperties,
  Search
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { useAuth } from '@/domains/accounts/hooks/useAuth';
import { PermissionMatrix } from './PermissionMatrix';
import { DataConfigurationPanel } from './DataConfigurationPanel';
import { PatentAPIPanel } from './PatentAPIPanel';
import { PromptManagementPanel } from './PromptManagementPanel';
import { LLMKeysPanel } from './LLMKeysPanel';

export function AdminPanel() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user has admin access
    if (user && user.role !== 'admin' && user.role !== 'manager') {
      router.push('/dashboard');
      return;
    }
    setLoading(false);
  }, [user, router]);

  const handleBackToDashboard = () => {
    router.push('/dashboard');
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  // Mock data for system overview
  const systemStats = {
    totalUsers: 127,
    activeUsers: 89,
    totalProjects: 45,
    systemHealth: 'Healthy',
    lastBackup: '2 hours ago',
    storageUsed: '2.4 GB',
    apiCalls: '1.2M',
    uptime: '99.9%'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
          <p className="text-muted-foreground">System administration and configuration</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleBackToDashboard}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>

      {/* System Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+12%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+5%</span> from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{systemStats.systemHealth}</div>
            <p className="text-xs text-muted-foreground">
              All services operational
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.storageUsed}</div>
            <p className="text-xs text-muted-foreground">
              of 100 GB allocated
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Admin Sections */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-10">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="data-config">Data Config</TabsTrigger>
          <TabsTrigger value="patent-apis">Patent APIs</TabsTrigger>
          <TabsTrigger value="llm-keys">LLM Keys</TabsTrigger>
          <TabsTrigger value="ai-prompts">AI Prompts</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest system events and user activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <UserPlus className="h-4 w-4 text-green-600" />
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">New user registered</p>
                      <p className="text-xs text-muted-foreground">2 minutes ago</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">Patent document uploaded</p>
                      <p className="text-xs text-muted-foreground">15 minutes ago</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Shield className="h-4 w-4 text-orange-600" />
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">Security scan completed</p>
                      <p className="text-xs text-muted-foreground">1 hour ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
                <CardDescription>Current system performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">API Uptime</span>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      {systemStats.uptime}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Last Backup</span>
                    <span className="text-sm text-muted-foreground">{systemStats.lastBackup}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">API Calls (24h)</span>
                    <span className="text-sm text-muted-foreground">{systemStats.apiCalls}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Active Projects</span>
                    <span className="text-sm text-muted-foreground">{systemStats.totalProjects}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management & Permissions</CardTitle>
              <CardDescription>Manage user accounts, roles, and feature permissions matrix</CardDescription>
            </CardHeader>
            <CardContent>
              <PermissionMatrix />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data-config">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <TableProperties className="h-5 w-5 text-blue-600" />
                <CardTitle>Data Configuration</CardTitle>
              </div>
              <CardDescription>
                Manage intelligent column mapping rules, dataset mappings, and dynamic field registry
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataConfigurationPanel />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patent-apis">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Search className="h-5 w-5 text-green-600" />
                <CardTitle>Patent API Integrations</CardTitle>
              </div>
              <CardDescription>
                Configure patent database APIs with field mappings and query templates for research functionality
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PatentAPIPanel />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="llm-keys">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Key className="h-5 w-5 text-amber-600" />
                <CardTitle>LLM Provider Keys</CardTitle>
              </div>
              <CardDescription>
                Configure API keys for Anthropic, OpenAI, Google, and other LLM providers used by the AI analysis engine
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LLMKeysPanel />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-prompts">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-purple-600" />
                <CardTitle>AI Prompt Templates</CardTitle>
              </div>
              <CardDescription>
                Manage versioned prompt templates used by the patent analysis engine — edit scoring prompts, classification prompts, and more without redeploying
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PromptManagementPanel />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>System Configuration</CardTitle>
              <CardDescription>Configure system settings, integrations, and services</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">System configuration features will be implemented here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security & Access Control</CardTitle>
              <CardDescription>Manage security policies, authentication, and access controls</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Security management features will be implemented here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>System Analytics</CardTitle>
              <CardDescription>View system usage analytics and performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Analytics dashboard will be implemented here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Global Settings</CardTitle>
              <CardDescription>Configure global application settings and preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Global settings will be implemented here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}