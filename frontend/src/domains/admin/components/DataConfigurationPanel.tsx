/**
 * DataConfigurationPanel Component
 * Main interface for managing data configuration features including:
 * - Column Mapping Rules
 * - Dataset Mappings
 * - Dynamic Fields Registry
 */

'use client';

import { useState } from 'react';
import { 
  Settings,
  Database,
  Columns,
  FileSpreadsheet,
  ArrowRight,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Activity,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { ColumnMappingRulesManager } from './DataConfiguration/ColumnMappingRulesManager';
import { DatasetMappingsViewer } from './DataConfiguration/DatasetMappingsViewer';
import { DynamicFieldsRegistry } from './DataConfiguration/DynamicFieldsRegistry';

export function DataConfigurationPanel() {
  const [activeTab, setActiveTab] = useState('rules');

  // Mock data for overview cards
  const overviewStats = {
    totalRules: 23,
    activeRules: 18,
    pendingMappings: 12,
    dynamicFields: 8,
    migrationsPending: 3,
    successRate: 94.2
  };

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mapping Rules</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overviewStats.activeRules}</div>
            <p className="text-xs text-muted-foreground">
              of {overviewStats.totalRules} total rules
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Mappings</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{overviewStats.pendingMappings}</div>
            <p className="text-xs text-muted-foreground">
              need review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dynamic Fields</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overviewStats.dynamicFields}</div>
            <p className="text-xs text-muted-foreground">
              {overviewStats.migrationsPending} pending migration
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{overviewStats.successRate}%</div>
            <p className="text-xs text-muted-foreground">
              mapping accuracy
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Configuration Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList className="grid w-fit grid-cols-3">
            <TabsTrigger value="rules" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Mapping Rules
            </TabsTrigger>
            <TabsTrigger value="mappings" className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Dataset Mappings
            </TabsTrigger>
            <TabsTrigger value="fields" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Dynamic Fields
            </TabsTrigger>
          </TabsList>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            {activeTab === 'rules' && (
              <>
                <Button variant="outline" size="sm">
                  <Upload className="h-4 w-4 mr-1" />
                  Import
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </Button>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Rule
                </Button>
              </>
            )}
            
            {activeTab === 'mappings' && (
              <>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-1" />
                  Filter
                </Button>
                <Button size="sm">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Bulk Review
                </Button>
              </>
            )}
            
            {activeTab === 'fields' && (
              <>
                <Button variant="outline" size="sm">
                  <Activity className="h-4 w-4 mr-1" />
                  Migrate All
                </Button>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Field
                </Button>
              </>
            )}
          </div>
        </div>

        <TabsContent value="rules" className="space-y-4">
          <ColumnMappingRulesManager />
        </TabsContent>

        <TabsContent value="mappings" className="space-y-4">
          <DatasetMappingsViewer />
        </TabsContent>

        <TabsContent value="fields" className="space-y-4">
          <DynamicFieldsRegistry />
        </TabsContent>
      </Tabs>
    </div>
  );
}