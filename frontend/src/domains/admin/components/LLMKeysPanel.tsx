'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Save,
  Trash2,
  TestTube,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Loader2,
  AlertTriangle,
  KeyRound,
} from 'lucide-react';
import { ApiClient, type ApiResponse } from '@/services/apiClient';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LLMProviderConfig {
  id: string;
  provider: string;
  display_name: string;
  masked_key: string;
  api_base_url: string;
  is_active: boolean;
  test_status: 'never' | 'passed' | 'failed';
  test_error: string;
  last_tested_at: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

type ProviderKey =
  | 'anthropic'
  | 'openai'
  | 'google'
  | 'cohere'
  | 'mistral';

const PROVIDER_OPTIONS: { value: ProviderKey; label: string; description: string }[] = [
  { value: 'anthropic', label: 'Anthropic (Claude)', description: 'Claude Opus, Sonnet, Haiku models' },
  { value: 'openai', label: 'OpenAI (GPT)', description: 'GPT-4o, GPT-4o-mini models' },
  { value: 'google', label: 'Google (Gemini)', description: 'Gemini 2.0 Flash, Pro models' },
  { value: 'cohere', label: 'Cohere', description: 'Command R, Embed models' },
  { value: 'mistral', label: 'Mistral AI', description: 'Mistral Small, Large models' },
];

const LLM_BASE = '/analytics/api/admin/data-configuration/llm-keys';

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function TestStatusBadge({ status, error }: { status: string; error?: string }) {
  if (status === 'passed') {
    return (
      <Badge variant="default" className="bg-green-600 text-[10px] gap-1">
        <CheckCircle className="h-3 w-3" /> Verified
      </Badge>
    );
  }
  if (status === 'failed') {
    return (
      <Badge variant="destructive" className="text-[10px] gap-1" title={error}>
        <XCircle className="h-3 w-3" /> Failed
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="text-[10px] gap-1">
      <AlertTriangle className="h-3 w-3" /> Untested
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Provider Card — displays one configured provider
// ---------------------------------------------------------------------------

function ProviderCard({
  config,
  onUpdate,
  onTest,
  onDelete,
}: {
  config: LLMProviderConfig;
  onUpdate: (provider: string, data: Record<string, unknown>) => Promise<void>;
  onTest: (provider: string) => Promise<void>;
  onDelete: (provider: string) => Promise<void>;
}) {
  const [newKey, setNewKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [baseUrl, setBaseUrl] = useState(config.api_base_url);
  const [notes, setNotes] = useState(config.notes);
  const [isActive, setIsActive] = useState(config.is_active);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [deleteStep, setDeleteStep] = useState(0); // 0=idle, 1=confirm, 2=final
  const [deleting, setDeleting] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Track dirtiness
  useEffect(() => {
    const keyChanged = newKey.length > 0;
    const urlChanged = baseUrl !== config.api_base_url;
    const notesChanged = notes !== config.notes;
    const activeChanged = isActive !== config.is_active;
    setDirty(keyChanged || urlChanged || notesChanged || activeChanged);
  }, [newKey, baseUrl, notes, isActive, config]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const data: Record<string, unknown> = {
        api_base_url: baseUrl,
        notes,
        is_active: isActive,
      };
      if (newKey) data.api_key = newKey;
      await onUpdate(config.provider, data);
      setNewKey('');
      setDirty(false);
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      await onTest(config.provider);
    } finally {
      setTesting(false);
    }
  };

  const handleDeleteStep = async () => {
    if (deleteStep === 0) {
      setDeleteStep(1);
      return;
    }
    if (deleteStep === 1) {
      setDeleteStep(2);
      return;
    }
    // Step 2 — actually delete
    setDeleting(true);
    try {
      await onDelete(config.provider);
    } finally {
      setDeleting(false);
      setDeleteStep(0);
    }
  };

  const cancelDelete = () => setDeleteStep(0);

  const providerInfo = PROVIDER_OPTIONS.find((p) => p.value === config.provider);

  return (
    <Card className={!isActive ? 'opacity-60' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">
              {config.display_name}
            </CardTitle>
            <TestStatusBadge status={config.test_status} error={config.test_error} />
            {!isActive && (
              <Badge variant="outline" className="text-[10px]">Disabled</Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTest}
              disabled={testing}
              title="Test this API key"
            >
              {testing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <TestTube className="h-3.5 w-3.5" />
              )}
              <span className="ml-1.5">{testing ? 'Testing...' : 'Test'}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSave}
              disabled={saving || !dirty}
              title="Save changes"
            >
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              <span className="ml-1.5">Save</span>
            </Button>
          </div>
        </div>
        {providerInfo && (
          <CardDescription className="text-xs">{providerInfo.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Current key (masked) */}
        <div>
          <label className="text-xs font-medium text-muted-foreground">Current API Key</label>
          <div className="flex items-center gap-2 mt-1">
            <code className="text-xs bg-muted px-2 py-1.5 rounded flex-1 font-mono">
              {config.masked_key}
            </code>
          </div>
        </div>

        {/* New key input */}
        <div>
          <label className="text-xs font-medium text-muted-foreground">Replace API Key</label>
          <div className="flex items-center gap-2 mt-1">
            <div className="relative flex-1">
              <Input
                type={showKey ? 'text' : 'password'}
                placeholder="Enter new API key..."
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                className="pr-8 font-mono text-xs"
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowKey(!showKey)}
                aria-label={showKey ? 'Hide key' : 'Show key'}
              >
                {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Base URL (optional) */}
        <div>
          <label className="text-xs font-medium text-muted-foreground">
            API Base URL <span className="text-muted-foreground/60">(optional, for proxies)</span>
          </label>
          <Input
            type="url"
            placeholder="Leave empty for default"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            className="mt-1 text-xs"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="text-xs font-medium text-muted-foreground">Notes</label>
          <Input
            placeholder="e.g. Team shared key, expires Dec 2026"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-1 text-xs"
          />
        </div>

        {/* Active toggle + Delete */}
        <div className="flex items-center justify-between pt-2 border-t">
          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded border-gray-300"
            />
            Active
          </label>

          <div className="flex items-center gap-2">
            {deleteStep > 0 && (
              <Button variant="ghost" size="sm" onClick={cancelDelete} className="text-xs">
                Cancel
              </Button>
            )}
            <Button
              variant={deleteStep >= 1 ? 'destructive' : 'ghost'}
              size="sm"
              onClick={handleDeleteStep}
              disabled={deleting}
              className="text-xs"
            >
              {deleting ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <Trash2 className="h-3 w-3 mr-1" />
              )}
              {deleteStep === 0 && 'Delete'}
              {deleteStep === 1 && 'Are you sure?'}
              {deleteStep === 2 && 'Click to confirm delete'}
            </Button>
          </div>
        </div>

        {/* Test error detail */}
        {config.test_status === 'failed' && config.test_error && (
          <div className="bg-destructive/10 text-destructive text-xs rounded p-2 mt-2">
            {config.test_error}
          </div>
        )}

        {/* Last tested */}
        {config.last_tested_at && (
          <p className="text-[10px] text-muted-foreground">
            Last tested: {new Date(config.last_tested_at).toLocaleString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Add Provider Form
// ---------------------------------------------------------------------------

function AddProviderForm({
  existingProviders,
  onAdd,
}: {
  existingProviders: string[];
  onAdd: (data: { provider: string; api_key: string; display_name: string }) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [provider, setProvider] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);

  const availableProviders = PROVIDER_OPTIONS.filter(
    (p) => !existingProviders.includes(p.value)
  );

  if (!open) {
    return (
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        disabled={availableProviders.length === 0}
        className="w-full border-dashed"
      >
        <Plus className="h-4 w-4 mr-2" />
        {availableProviders.length === 0 ? 'All providers configured' : 'Add LLM Provider'}
      </Button>
    );
  }

  const handleSubmit = async () => {
    if (!provider || !apiKey) return;
    setSaving(true);
    try {
      const info = PROVIDER_OPTIONS.find((p) => p.value === provider);
      await onAdd({
        provider,
        api_key: apiKey,
        display_name: info?.label || provider,
      });
      setProvider('');
      setApiKey('');
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-dashed">
      <CardContent className="pt-6 space-y-3">
        <div>
          <label className="text-xs font-medium">Provider</label>
          <Select value={provider} onValueChange={setProvider}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select a provider..." />
            </SelectTrigger>
            <SelectContent>
              {availableProviders.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-xs font-medium">API Key</label>
          <div className="relative mt-1">
            <Input
              type={showKey ? 'text' : 'password'}
              placeholder="sk-... or similar"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="pr-8 font-mono text-xs"
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setShowKey(!showKey)}
              aria-label={showKey ? 'Hide key' : 'Show key'}
            >
              {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={handleSubmit} disabled={!provider || !apiKey || saving} size="sm">
            {saving ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
            Save
          </Button>
          <Button variant="ghost" size="sm" onClick={() => { setOpen(false); setProvider(''); setApiKey(''); }}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function LLMKeysPanel() {
  const [configs, setConfigs] = useState<LLMProviderConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchConfigs = useCallback(async () => {
    setError('');
    const res = await ApiClient.get<LLMProviderConfig[]>(`${LLM_BASE}/`);
    if (res.success && res.data) {
      setConfigs(res.data);
    } else {
      setError(res.error || 'Failed to load LLM configurations.');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  const handleAdd = async (data: { provider: string; api_key: string; display_name: string }) => {
    const res = await ApiClient.post<LLMProviderConfig>(`${LLM_BASE}/`, data);
    if (res.success) {
      await fetchConfigs();
    } else {
      setError(res.error || 'Failed to add provider.');
    }
  };

  const handleUpdate = async (provider: string, data: Record<string, unknown>) => {
    const res = await ApiClient.put<LLMProviderConfig>(`${LLM_BASE}/${provider}/`, data);
    if (res.success) {
      await fetchConfigs();
    } else {
      setError(res.error || 'Failed to update provider.');
    }
  };

  const handleTest = async (provider: string) => {
    const res = await ApiClient.post<{ success: boolean; message: string }>(
      `${LLM_BASE}/${provider}/test_connection/`
    );
    if (res.success) {
      await fetchConfigs();
    } else {
      setError(res.error || 'Test failed.');
    }
  };

  const handleDelete = async (provider: string) => {
    const res = await ApiClient.delete(`${LLM_BASE}/${provider}/`);
    if (res.success) {
      await fetchConfigs();
    } else {
      setError(res.error || 'Failed to delete provider.');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-muted animate-pulse rounded-lg" />
        <div className="h-32 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-destructive/10 text-destructive text-sm rounded-lg p-3 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto text-xs"
            onClick={() => setError('')}
          >
            Dismiss
          </Button>
        </div>
      )}

      <div className="text-sm text-muted-foreground">
        Configure API keys for LLM providers used by the Patent Analysis engine and other AI features.
        Keys stored in the database take priority over environment variables.
      </div>

      {/* Existing provider cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {configs.map((config) => (
          <ProviderCard
            key={config.id}
            config={config}
            onUpdate={handleUpdate}
            onTest={handleTest}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {/* Add provider button/form */}
      <AddProviderForm
        existingProviders={configs.map((c) => c.provider)}
        onAdd={handleAdd}
      />

      {/* Info box */}
      <div className="bg-muted/50 rounded-lg p-4 text-xs text-muted-foreground space-y-1">
        <p className="font-medium text-foreground flex items-center gap-1.5">
          <KeyRound className="h-3.5 w-3.5" /> How API keys are resolved
        </p>
        <p>
          1. Database configuration (this panel) takes priority.
        </p>
        <p>
          2. If no active key is found here, the system falls back to environment variables
          (ANTHROPIC_API_KEY, OPENAI_API_KEY, etc.).
        </p>
        <p>
          3. Use the <strong>Test</strong> button to verify your key works before saving.
        </p>
      </div>
    </div>
  );
}
