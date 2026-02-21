/**
 * PatentAPIPanel Component
 * Admin interface for configuring patent API integrations
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Settings,
  TestTube,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Globe,
  Key,
  Database,
  ArrowUpDown,
  Save,
  X
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Types for Patent API Configuration
export interface PatentAPIConfig {
  id: string;
  name: string;
  display_name: string;
  description: string;
  base_url: string;
  auth_type: 'none' | 'api_key' | 'bearer' | 'basic' | 'oauth2';
  auth_config: Record<string, any>;
  rate_limit: {
    requests_per_minute: number;
    requests_per_day: number;
  };
  is_active: boolean;
  query_mappings: Record<string, string>; // standard_field -> api_field
  response_mappings: Record<string, string>; // api_field -> standard_field
  query_templates: Record<string, string>; // field_type -> query_syntax
  test_query: string;
  last_tested: string | null;
  test_status: 'never' | 'passed' | 'failed';
  created_at: string;
  updated_at: string;
}

// Standard fields that all APIs should support
const STANDARD_FIELDS = [
  { key: 'title', label: 'Patent Title', type: 'text' },
  { key: 'abstract', label: 'Abstract', type: 'text' },
  { key: 'inventors', label: 'Inventors', type: 'array' },
  { key: 'assignees', label: 'Assignees', type: 'array' },
  { key: 'publication_number', label: 'Publication Number', type: 'text' },
  { key: 'application_number', label: 'Application Number', type: 'text' },
  { key: 'publication_date', label: 'Publication Date', type: 'date' },
  { key: 'application_date', label: 'Application Date', type: 'date' },
  { key: 'priority_date', label: 'Priority Date', type: 'date' },
  { key: 'ipc_classes', label: 'IPC Classifications', type: 'array' },
  { key: 'cpc_classes', label: 'CPC Classifications', type: 'array' },
  { key: 'jurisdiction', label: 'Jurisdiction', type: 'text' },
  { key: 'keywords', label: 'Keywords', type: 'text' },
];

export function PatentAPIPanel() {
  const [apiConfigs, setApiConfigs] = useState<PatentAPIConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingConfig, setEditingConfig] = useState<PatentAPIConfig | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [testingApi, setTestingApi] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConfigs = async () => {
      try {
        const { patentApiConfigService } = await import('@/services/patentApiConfigService');
        const response = await patentApiConfigService.getAvailableAPIs();
        if (response.success && response.data) {
          // Map API list items to PatentAPIConfig shape (fill defaults for hardcoded entries)
          const configs: PatentAPIConfig[] = response.data.map((api: any) => ({
            id: api.id,
            name: api.name,
            display_name: api.display_name,
            description: api.description,
            base_url: api.base_url || '',
            auth_type: api.auth_type || 'none',
            auth_config: api.auth_config || {},
            rate_limit: api.rate_limit || { requests_per_minute: 60, requests_per_day: 10000 },
            is_active: api.is_active,
            query_mappings: api.query_mappings || {},
            response_mappings: api.response_mappings || {},
            query_templates: api.query_templates || {},
            test_query: api.test_query || '',
            last_tested: api.last_tested || null,
            test_status: api.test_status || 'never',
            created_at: api.created_at || new Date().toISOString(),
            updated_at: api.updated_at || new Date().toISOString(),
          }));
          setApiConfigs(configs);
        }
      } catch (error) {
        console.error('Failed to fetch API configurations:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchConfigs();
  }, []);

  const handleAddNew = () => {
    setEditingConfig({
      id: '',
      name: '',
      display_name: '',
      description: '',
      base_url: '',
      auth_type: 'none',
      auth_config: {},
      rate_limit: {
        requests_per_minute: 60,
        requests_per_day: 1000,
      },
      is_active: false,
      query_mappings: {},
      response_mappings: {},
      query_templates: {},
      test_query: '',
      last_tested: null,
      test_status: 'never',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    setShowAddDialog(true);
  };

  const handleEdit = (config: PatentAPIConfig) => {
    // Ensure all fields have proper defaults when editing (especially for hardcoded entries)
    setEditingConfig({
      ...config,
      base_url: config.base_url || '',
      auth_type: config.auth_type || 'none',
      auth_config: config.auth_config || {},
      rate_limit: config.rate_limit || { requests_per_minute: 60, requests_per_day: 10000 },
      query_mappings: config.query_mappings || {},
      response_mappings: config.response_mappings || {},
      query_templates: config.query_templates || {},
      test_query: config.test_query || '',
    });
    setSaveError(null);
    setShowAddDialog(true);
  };

  const handleSave = async () => {
    if (!editingConfig) return;

    // Validate required fields
    if (!editingConfig.name.trim()) {
      setSaveError('API Name is required');
      return;
    }
    if (!editingConfig.display_name.trim()) {
      setSaveError('Display Name is required');
      return;
    }
    if (!editingConfig.base_url.trim()) {
      setSaveError('Base URL is required');
      return;
    }

    setSaving(true);
    setSaveError(null);

    try {
      const { patentApiConfigService } = await import('@/services/patentApiConfigService');
      const isHardcoded = editingConfig.id.endsWith('-hardcoded');
      const isNew = !editingConfig.id || isHardcoded;

      if (!isNew) {
        // Update existing DB config
        const response = await patentApiConfigService.updateAPIConfiguration(editingConfig.id, editingConfig);
        if (response.success && response.data) {
          const updated = {
            ...editingConfig,
            ...response.data,
            is_configured: true,
            source_type: 'admin_configured' as const,
          };
          setApiConfigs(prev => prev.map(api =>
            api.id === editingConfig.id ? updated : api
          ));
          setShowAddDialog(false);
          setEditingConfig(null);
        } else {
          setSaveError(response.error || 'Failed to update configuration');
        }
      } else {
        // Create new DB config (including when "editing" a hardcoded entry to override it)
        const { id: _id, created_at: _ca, updated_at: _ua, ...createData } = editingConfig;
        const response = await patentApiConfigService.createAPIConfiguration(createData as any);
        if (response.success && response.data) {
          const newConfig = {
            ...editingConfig,
            ...response.data,
            is_configured: true,
            source_type: 'admin_configured' as const,
          };
          if (isHardcoded) {
            // Replace the hardcoded entry with the new DB entry
            setApiConfigs(prev => prev.map(api =>
              api.id === editingConfig.id ? newConfig : api
            ));
          } else {
            setApiConfigs(prev => [...prev, newConfig]);
          }
          setShowAddDialog(false);
          setEditingConfig(null);
        } else {
          setSaveError(response.error || 'Failed to save configuration');
        }
      }
    } catch (error) {
      console.error('Failed to save API configuration:', error);
      setSaveError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this API configuration?')) {
      try {
        const { patentApiConfigService } = await import('@/services/patentApiConfigService');
        await patentApiConfigService.deleteAPIConfiguration(id);
        setApiConfigs(prev => prev.filter(api => api.id !== id));
      } catch (error) {
        console.error('Failed to delete API configuration:', error);
      }
    }
  };

  const handleTestAPI = async (id: string) => {
    setTestingApi(id);

    try {
      const { patentApiConfigService } = await import('@/services/patentApiConfigService');
      const response = await patentApiConfigService.testAPIConnection(id);
      const testResult = response.success && response.data ? response.data.status : 'failed';
      setApiConfigs(prev => prev.map(api =>
        api.id === id
          ? { ...api, test_status: testResult as 'passed' | 'failed', last_tested: new Date().toISOString() }
          : api
      ));
    } catch (error) {
      console.error('Failed to test API connection:', error);
      setApiConfigs(prev => prev.map(api =>
        api.id === id ? { ...api, test_status: 'failed' } : api
      ));
    } finally {
      setTestingApi(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'passed': return <Badge className="bg-green-100 text-green-800">Connected</Badge>;
      case 'failed': return <Badge variant="destructive">Failed</Badge>;
      default: return <Badge variant="secondary">Not Tested</Badge>;
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading API configurations...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Patent API Configurations</h3>
          <p className="text-sm text-muted-foreground">
            Manage patent database API integrations with field mappings and query templates
          </p>
        </div>
        <Button onClick={handleAddNew}>
          <Plus className="h-4 w-4 mr-2" />
          Add API
        </Button>
      </div>

      {/* API Configurations List */}
      <div className="grid gap-4">
        {apiConfigs.map((config) => (
          <Card key={config.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-blue-600" />
                  <div>
                    <CardTitle className="text-base">{config.display_name}</CardTitle>
                    <CardDescription className="text-sm">
                      {config.description}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(config.test_status)}
                  <Switch 
                    checked={config.is_active}
                    onCheckedChange={(checked) => {
                      setApiConfigs(prev => prev.map(api => 
                        api.id === config.id ? { ...api, is_active: checked } : api
                      ));
                    }}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Base URL</Label>
                  <p className="text-sm font-mono truncate">{config.base_url}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Auth Type</Label>
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm capitalize">{config.auth_type.replace('_', ' ')}</p>
                    {config.auth_type !== 'none' && config.auth_config && Object.values(config.auth_config).some(v => v === '****' || (typeof v === 'string' && v.length > 0)) && (
                      <Key className="h-3 w-3 text-green-600" />
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Rate Limit</Label>
                  <p className="text-sm">{config.rate_limit.requests_per_minute}/min</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Field Mappings</Label>
                  <p className="text-sm">{Object.keys(config.query_mappings).length} fields</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTestAPI(config.id)}
                  disabled={testingApi === config.id}
                >
                  <TestTube className="h-4 w-4 mr-1" />
                  {testingApi === config.id ? 'Testing...' : 'Test Connection'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(config)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(config.id)}
                  disabled={config.id.endsWith('-hardcoded')} // Prevent deleting hardcoded APIs
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingConfig?.id ? 'Edit API Configuration' : 'Add New API Configuration'}
            </DialogTitle>
            <DialogDescription>
              Configure patent API connection, authentication, and field mappings
            </DialogDescription>
          </DialogHeader>
          
          {editingConfig && (
            <div className="space-y-6">
              {/* Basic Configuration */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">API Name (Internal)</Label>
                  <Input
                    id="name"
                    value={editingConfig.name}
                    onChange={(e) => setEditingConfig(prev => prev ? {...prev, name: e.target.value} : null)}
                    placeholder="uspto, epo, wipo"
                  />
                </div>
                <div>
                  <Label htmlFor="display_name">Display Name</Label>
                  <Input
                    id="display_name"
                    value={editingConfig.display_name}
                    onChange={(e) => setEditingConfig(prev => prev ? {...prev, display_name: e.target.value} : null)}
                    placeholder="USPTO PatentsView"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={editingConfig.description}
                  onChange={(e) => setEditingConfig(prev => prev ? {...prev, description: e.target.value} : null)}
                  placeholder="Brief description of this patent API"
                />
              </div>

              <div>
                <Label htmlFor="base_url">Base URL</Label>
                <Input
                  id="base_url"
                  value={editingConfig.base_url}
                  onChange={(e) => setEditingConfig(prev => prev ? {...prev, base_url: e.target.value} : null)}
                  placeholder="https://api.example.com/v1"
                />
              </div>

              {/* Authentication */}
              <Separator />
              <div>
                <h4 className="text-sm font-medium mb-3">Authentication</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="auth_type">Auth Type</Label>
                    <Select
                      value={editingConfig.auth_type}
                      onValueChange={(value) => setEditingConfig(prev => prev ? {...prev, auth_type: value as any} : null)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="api_key">API Key</SelectItem>
                        <SelectItem value="bearer">Bearer Token</SelectItem>
                        <SelectItem value="basic">Basic Auth</SelectItem>
                        <SelectItem value="oauth2">OAuth2</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* API Key input */}
                  {editingConfig.auth_type === 'api_key' && (
                    <div>
                      <Label htmlFor="api_key">API Key</Label>
                      <Input
                        id="api_key"
                        type="password"
                        value={editingConfig.auth_config?.api_key || ''}
                        onChange={(e) => setEditingConfig(prev => prev ? {
                          ...prev,
                          auth_config: { ...prev.auth_config, api_key: e.target.value }
                        } : null)}
                        placeholder={editingConfig.auth_config?.api_key === '****' ? 'Key saved (enter new to replace)' : 'Enter API key'}
                      />
                      {editingConfig.auth_config?.api_key === '****' && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Key is saved securely. Leave as-is to keep current key.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Bearer Token input */}
                  {editingConfig.auth_type === 'bearer' && (
                    <div>
                      <Label htmlFor="bearer_token">Bearer Token</Label>
                      <Input
                        id="bearer_token"
                        type="password"
                        value={editingConfig.auth_config?.token || ''}
                        onChange={(e) => setEditingConfig(prev => prev ? {
                          ...prev,
                          auth_config: { ...prev.auth_config, token: e.target.value }
                        } : null)}
                        placeholder={editingConfig.auth_config?.token === '****' ? 'Token saved (enter new to replace)' : 'Enter bearer token'}
                      />
                    </div>
                  )}

                  {/* Basic Auth inputs */}
                  {editingConfig.auth_type === 'basic' && (
                    <>
                      <div>
                        <Label htmlFor="basic_username">Username</Label>
                        <Input
                          id="basic_username"
                          value={editingConfig.auth_config?.username || ''}
                          onChange={(e) => setEditingConfig(prev => prev ? {
                            ...prev,
                            auth_config: { ...prev.auth_config, username: e.target.value }
                          } : null)}
                          placeholder="Username"
                        />
                      </div>
                      <div>
                        <Label htmlFor="basic_password">Password</Label>
                        <Input
                          id="basic_password"
                          type="password"
                          value={editingConfig.auth_config?.password || ''}
                          onChange={(e) => setEditingConfig(prev => prev ? {
                            ...prev,
                            auth_config: { ...prev.auth_config, password: e.target.value }
                          } : null)}
                          placeholder={editingConfig.auth_config?.password === '****' ? 'Saved (enter new to replace)' : 'Enter password'}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Rate Limiting */}
              <Separator />
              <div>
                <h4 className="text-sm font-medium mb-3">Rate Limiting</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="rate_minute">Requests per Minute</Label>
                    <Input
                      id="rate_minute"
                      type="number"
                      value={editingConfig.rate_limit.requests_per_minute}
                      onChange={(e) => setEditingConfig(prev => prev ? {
                        ...prev, 
                        rate_limit: {...prev.rate_limit, requests_per_minute: parseInt(e.target.value) || 0}
                      } : null)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="rate_day">Requests per Day</Label>
                    <Input
                      id="rate_day"
                      type="number"
                      value={editingConfig.rate_limit.requests_per_day}
                      onChange={(e) => setEditingConfig(prev => prev ? {
                        ...prev, 
                        rate_limit: {...prev.rate_limit, requests_per_day: parseInt(e.target.value) || 0}
                      } : null)}
                    />
                  </div>
                </div>
              </div>

              {/* Field Mappings Preview */}
              <Separator />
              <div>
                <h4 className="text-sm font-medium mb-3">Field Mappings Summary</h4>
                <Alert>
                  <ArrowUpDown className="h-4 w-4" />
                  <AlertDescription>
                    Field mappings will be configured in the next step after saving basic configuration.
                    Current mappings: {Object.keys(editingConfig.query_mappings).length} query fields, 
                    {Object.keys(editingConfig.response_mappings).length} response fields.
                  </AlertDescription>
                </Alert>
              </div>

              {/* Error Display */}
              {saveError && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{saveError}</AlertDescription>
                </Alert>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => { setShowAddDialog(false); setSaveError(null); }}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Configuration'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}