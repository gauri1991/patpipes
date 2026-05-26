/**
 * GoogleSearchConfigPanel Component
 * Admin panel for configuring Google Custom Search API keys and settings
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Globe,
  Key,
  Save,
  TestTube,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  Loader2,
  RefreshCw,
  Info,
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import webSearchApi, {
  GoogleSearchConfigResponse,
  GoogleSearchConfigUpdate,
} from '@/services/webSearchApi';

export function GoogleSearchConfigPanel() {
  const [config, setConfig] = useState<GoogleSearchConfigResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ status: string; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state — only set when user enters new values
  const [apiKey, setApiKey] = useState('');
  const [searchEngineId, setSearchEngineId] = useState('');
  const [dailyLimit, setDailyLimit] = useState(100);
  const [isActive, setIsActive] = useState(true);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showCseId, setShowCseId] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const response = await webSearchApi.getConfig();
      if (response.success && response.data) {
        setConfig(response.data);
        setDailyLimit(response.data.daily_limit);
        setIsActive(response.data.is_active);
        // Don't populate api_key/search_engine_id — user must enter new values to change
        setApiKey('');
        setSearchEngineId('');
      } else {
        setError(response.error || 'Failed to load configuration');
      }
    } catch (err) {
      setError('Failed to load Google Search configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    setTestResult(null);

    const data: GoogleSearchConfigUpdate = {
      daily_limit: dailyLimit,
      is_active: isActive,
    };
    // Only send keys if user entered new values
    if (apiKey.trim()) {
      data.api_key = apiKey.trim();
    }
    if (searchEngineId.trim()) {
      data.search_engine_id = searchEngineId.trim();
    }

    try {
      const response = await webSearchApi.updateConfig(data);
      if (response.success && response.data) {
        setConfig(response.data);
        setApiKey('');
        setSearchEngineId('');
        setSuccess('Configuration saved successfully');
      } else {
        setError(response.error || 'Failed to save configuration');
      }
    } catch (err) {
      setError('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    setError(null);

    try {
      const response = await webSearchApi.testConnection();
      if (response.success && response.data) {
        setTestResult(response.data);
      } else {
        setTestResult({
          status: 'failed',
          message: response.error || 'Connection test failed',
        });
      }
    } catch (err) {
      setTestResult({
        status: 'failed',
        message: 'Network error — could not reach the server',
      });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading configuration...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
            <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-medium">Google Custom Search</h3>
            <p className="text-sm text-muted-foreground">
              Configure credentials for the Web Search module
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {config?.search_mode === 'server' ? (
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              <CheckCircle className="h-3 w-3 mr-1" />
              Server Mode
            </Badge>
          ) : config?.search_mode === 'client' ? (
            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              <Globe className="h-3 w-3 mr-1" />
              Client Mode
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Not Configured
            </Badge>
          )}
        </div>
      </div>

      {/* Mode Indicator */}
      {config?.search_mode === 'client' && (
        <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 dark:text-blue-200">
            <strong>Client-Side Mode:</strong> Searches run directly in the browser using the CX ID.
            No API key needed. No daily quota limits.
          </AlertDescription>
        </Alert>
      )}
      {config?.search_mode === 'server' && (
        <Alert className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
          <Info className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            <strong>Server-Side Mode:</strong> Searches run on the backend via Google API.
            Daily quota of {config.daily_limit} queries applies.
          </AlertDescription>
        </Alert>
      )}

      {/* Status Alerts */}
      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">{success}</AlertDescription>
        </Alert>
      )}

      {/* API Credentials */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Key className="h-4 w-4" />
            API Credentials
          </CardTitle>
          <CardDescription>
            Get your Search Engine ID from the{' '}
            <a
              href="https://programmablesearchengine.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Google Programmable Search Engine
            </a>
            {' '}console. API key is optional — without it, searches run client-side.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Engine ID (CX) — shown first since it's required */}
          <div className="space-y-2">
            <Label htmlFor="google-cse-id">Search Engine ID (cx) <span className="text-red-500">*</span></Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="google-cse-id"
                  type={showCseId ? 'text' : 'password'}
                  value={searchEngineId}
                  onChange={(e) => setSearchEngineId(e.target.value)}
                  placeholder={config?.search_engine_id_masked || 'Enter Search Engine ID'}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setShowCseId(!showCseId)}
                  aria-label={showCseId ? 'Hide Search Engine ID' : 'Show Search Engine ID'}
                >
                  {showCseId ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            {config?.search_engine_id_masked && (
              <p className="text-xs text-muted-foreground">
                Current: <code className="bg-muted px-1 rounded">{config.search_engine_id_masked}</code>
                {' '}— enter a new value to replace
              </p>
            )}
          </div>

          <Separator />

          {/* API Key — optional */}
          <div className="space-y-2">
            <Label htmlFor="google-api-key">API Key <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="google-api-key"
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={config?.api_key_masked || 'Enter Google API Key (optional)'}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setShowApiKey(!showApiKey)}
                  aria-label={showApiKey ? 'Hide API key' : 'Show API key'}
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {config?.api_key_masked ? (
                <>Current: <code className="bg-muted px-1 rounded">{config.api_key_masked}</code> — enter a new value to replace</>
              ) : (
                <>Without an API key, searches run client-side using only the CX ID (no quota limits).</>
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="daily-limit">Daily Query Limit</Label>
              <p className="text-xs text-muted-foreground">
                {config?.search_mode === 'client'
                  ? 'Not applicable in client-side mode'
                  : 'Google CSE free tier allows 100 queries/day'}
              </p>
            </div>
            <Input
              id="daily-limit"
              type="number"
              min={1}
              max={10000}
              value={dailyLimit}
              onChange={(e) => setDailyLimit(parseInt(e.target.value) || 100)}
              className="w-24 text-right"
              disabled={config?.search_mode === 'client'}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="is-active">Enable Web Search</Label>
              <p className="text-xs text-muted-foreground">
                When disabled, search requests will be blocked
              </p>
            </div>
            <Switch
              id="is-active"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>
        </CardContent>
      </Card>

      {/* Test Connection */}
      {testResult && (
        <Alert className={
          testResult.status === 'connected'
            ? 'border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800'
            : testResult.status === 'client_mode'
              ? 'border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800'
              : 'border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800'
        }>
          {testResult.status === 'connected' ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : testResult.status === 'client_mode' ? (
            <Info className="h-4 w-4 text-blue-600" />
          ) : (
            <XCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription className={
            testResult.status === 'connected'
              ? 'text-green-800 dark:text-green-200'
              : testResult.status === 'client_mode'
                ? 'text-blue-800 dark:text-blue-200'
                : 'text-red-800 dark:text-red-200'
          }>
            {testResult.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Last Updated Info */}
      {config?.updated_at && (
        <p className="text-xs text-muted-foreground">
          Last updated: {new Date(config.updated_at).toLocaleString()}
          {config.updated_by_name && ` by ${config.updated_by_name}`}
        </p>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          {saving ? 'Saving...' : 'Save Configuration'}
        </Button>
        <Button
          variant="outline"
          onClick={handleTest}
          disabled={testing || !config?.is_configured}
        >
          {testing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <TestTube className="h-4 w-4 mr-2" />}
          {testing ? 'Testing...' : 'Test Connection'}
        </Button>
        <Button variant="ghost" onClick={fetchConfig} disabled={loading}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
    </div>
  );
}
