'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Trash2, Globe, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { analyticsApi, type AnalyticsProject } from '@/services/analyticsApi';
import { toast } from 'sonner';

const JURISDICTIONS = ['US', 'EP', 'WO', 'JP', 'CN', 'KR', 'DE', 'GB', 'FR', 'CA'];

interface DomainScopeBuilderProps {
  projectId: string;
  project: AnalyticsProject;
  onScopeUpdate?: () => void;
}

export function DomainScopeBuilder({ projectId, project, onScopeUpdate }: DomainScopeBuilderProps) {
  const scope = project.analysis_scope ?? {};

  const [ipcCodes, setIpcCodes] = useState<string[]>([]);
  const [selectedJurisdictions, setSelectedJurisdictions] = useState<Set<string>>(new Set());
  const [keyAssignees, setKeyAssignees] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [newIpc, setNewIpc] = useState('');
  const [newAssignee, setNewAssignee] = useState('');
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  // Initialize from project data
  useEffect(() => {
    setIpcCodes(Array.isArray(scope.ipc_codes) ? scope.ipc_codes : Array.isArray(scope.cpc_codes) ? scope.cpc_codes : []);
    setSelectedJurisdictions(new Set(Array.isArray(scope.jurisdictions) ? scope.jurisdictions : []));
    setKeyAssignees(Array.isArray(scope.target_assignees) ? scope.target_assignees : []);
    setDateFrom(scope.date_range_start ?? scope.start_year ?? '');
    setDateTo(scope.date_range_end ?? scope.end_year ?? '');
    setDirty(false);
  }, [project.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const markDirty = () => setDirty(true);

  const addIpc = () => {
    const code = newIpc.trim().toUpperCase();
    if (!code || ipcCodes.includes(code)) return;
    setIpcCodes((prev) => [...prev, code]);
    setNewIpc('');
    markDirty();
  };

  const removeIpc = (code: string) => {
    setIpcCodes((prev) => prev.filter((c) => c !== code));
    markDirty();
  };

  const addAssignee = () => {
    const name = newAssignee.trim();
    if (!name || keyAssignees.includes(name)) return;
    setKeyAssignees((prev) => [...prev, name]);
    setNewAssignee('');
    markDirty();
  };

  const removeAssignee = (name: string) => {
    setKeyAssignees((prev) => prev.filter((a) => a !== name));
    markDirty();
  };

  const toggleJurisdiction = (j: string) => {
    setSelectedJurisdictions((prev) => {
      const next = new Set(prev);
      if (next.has(j)) next.delete(j);
      else next.add(j);
      return next;
    });
    markDirty();
  };

  const handleDateChange = (field: 'from' | 'to', val: string) => {
    if (field === 'from') setDateFrom(val);
    else setDateTo(val);
    markDirty();
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updatedScope = {
        ...scope,
        ipc_codes: ipcCodes,
        jurisdictions: Array.from(selectedJurisdictions),
        target_assignees: keyAssignees,
        date_range_start: dateFrom,
        date_range_end: dateTo,
      };
      await analyticsApi.updateProject(projectId, { analysis_scope: updatedScope });
      setDirty(false);
      toast.success('Search scope saved');
      onScopeUpdate?.();
    } catch {
      toast.error('Failed to save scope');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Search Scope
          </CardTitle>
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={handleSave}
            disabled={!dirty || saving}
          >
            <Save className="mr-1 h-3 w-3" />
            {saving ? 'Saving...' : dirty ? 'Save Changes' : 'Saved'}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Define IPC/CPC codes, jurisdictions, date range, and key assignees. Changes are saved to the project.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* IPC/CPC Codes */}
        <div className="space-y-2">
          <p className="text-xs font-medium">IPC / CPC Classification Codes</p>
          <div className="flex flex-wrap gap-1.5">
            {ipcCodes.map((code) => (
              <Badge key={code} variant="outline" className="text-xs gap-1">
                {code}
                <button
                  onClick={() => removeIpc(code)}
                  className="text-muted-foreground hover:text-destructive ml-1"
                  aria-label={`Remove ${code}`}
                >
                  ×
                </button>
              </Badge>
            ))}
            {ipcCodes.length === 0 && (
              <span className="text-xs text-muted-foreground italic">No IPC/CPC codes defined yet</span>
            )}
          </div>
          <div className="flex gap-2">
            <Input
              value={newIpc}
              onChange={(e) => setNewIpc(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addIpc()}
              placeholder="e.g. H04L 9"
              className="h-7 text-sm w-36"
            />
            <Button size="sm" className="h-7 text-xs" onClick={addIpc}>
              <Plus className="mr-1 h-3 w-3" /> Add Code
            </Button>
          </div>
        </div>

        {/* Date Range */}
        <div className="space-y-2">
          <p className="text-xs font-medium">Filing Date Range</p>
          <div className="flex items-center gap-2">
            <Input
              value={dateFrom}
              onChange={(e) => handleDateChange('from', e.target.value)}
              placeholder="From year"
              className="h-7 text-sm w-24"
            />
            <span className="text-xs text-muted-foreground">to</span>
            <Input
              value={dateTo}
              onChange={(e) => handleDateChange('to', e.target.value)}
              placeholder="To year"
              className="h-7 text-sm w-24"
            />
          </div>
        </div>

        {/* Jurisdictions */}
        <div className="space-y-2">
          <p className="text-xs font-medium">Target Jurisdictions</p>
          <div className="flex flex-wrap gap-2">
            {JURISDICTIONS.map((j) => (
              <div key={j} className="flex items-center gap-1.5">
                <Checkbox
                  id={`scope-j-${j}`}
                  checked={selectedJurisdictions.has(j)}
                  onCheckedChange={() => toggleJurisdiction(j)}
                />
                <label htmlFor={`scope-j-${j}`} className="text-xs cursor-pointer">
                  {j}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Key Assignees */}
        <div className="space-y-2">
          <p className="text-xs font-medium">Key Assignees to Track</p>
          <div className="flex flex-wrap gap-1.5">
            {keyAssignees.map((a) => (
              <Badge key={a} variant="secondary" className="text-xs gap-1">
                {a}
                <button
                  onClick={() => removeAssignee(a)}
                  className="text-muted-foreground hover:text-destructive ml-1"
                  aria-label={`Remove ${a}`}
                >
                  ×
                </button>
              </Badge>
            ))}
            {keyAssignees.length === 0 && (
              <span className="text-xs text-muted-foreground italic">No assignees specified</span>
            )}
          </div>
          <div className="flex gap-2">
            <Input
              value={newAssignee}
              onChange={(e) => setNewAssignee(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addAssignee()}
              placeholder="Company name..."
              className="h-7 text-sm flex-1"
            />
            <Button size="sm" className="h-7 text-xs shrink-0" onClick={addAssignee}>
              <Plus className="mr-1 h-3 w-3" /> Add
            </Button>
          </div>
        </div>

        {/* Summary */}
        <div className="text-xs text-muted-foreground bg-muted/30 rounded-md p-2">
          Scope: <span className="font-medium">{ipcCodes.length > 0 ? ipcCodes.join(', ') : 'No codes'}</span> ·{' '}
          <span className="font-medium">{dateFrom || '—'}–{dateTo || '—'}</span> ·{' '}
          <span className="font-medium">{selectedJurisdictions.size} jurisdictions</span> ·{' '}
          <span className="font-medium">{keyAssignees.length} assignees</span>
        </div>
      </CardContent>
    </Card>
  );
}
