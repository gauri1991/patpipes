'use client';

import { useState, useEffect } from 'react';
import { Layers, Plus, Trash2, ChevronRight, ChevronDown, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { analyticsApi, type AnalyticsProject } from '@/services/analyticsApi';
import { toast } from 'sonner';

type Lifecycle = 'emerging' | 'growth' | 'mature' | 'declining';

interface SubDomainEntry {
  name: string;
  ipc_codes: string[];
  lifecycle: Lifecycle;
}

interface DomainEntry {
  name: string;
  sub_domains: SubDomainEntry[];
}

// Local UI state extends the persisted model
interface DomainUI extends DomainEntry {
  expanded: boolean;
}

const LIFECYCLE_CONFIG: Record<Lifecycle, { label: string; badge: string }> = {
  emerging:  { label: 'Emerging',  badge: 'bg-green-100 text-green-800' },
  growth:    { label: 'Growth',    badge: 'bg-blue-100 text-blue-800' },
  mature:    { label: 'Mature',    badge: 'bg-gray-100 text-gray-700' },
  declining: { label: 'Declining', badge: 'bg-red-100 text-red-800' },
};

const LIFECYCLE_ORDER: Lifecycle[] = ['emerging', 'growth', 'mature', 'declining'];

interface LandscapeDomainManagerProps {
  projectId: string;
  project: AnalyticsProject;
}

export function LandscapeDomainManager({ projectId, project }: LandscapeDomainManagerProps) {
  const scope = project.analysis_scope ?? {};

  const [domains, setDomains] = useState<DomainUI[]>([]);
  const [newDomain, setNewDomain] = useState('');
  const [newSub, setNewSub] = useState<Record<number, string>>({});
  const [newIpc, setNewIpc] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  // Initialize from project data
  useEffect(() => {
    const saved: DomainEntry[] = Array.isArray(scope.domain_hierarchy) ? scope.domain_hierarchy : [];
    if (saved.length > 0) {
      setDomains(saved.map((d) => ({ ...d, expanded: true })));
    } else {
      // No data yet — start with one empty domain
      setDomains([{ name: 'Primary Domain', sub_domains: [], expanded: true }]);
    }
    setDirty(false);
  }, [project.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const markDirty = () => setDirty(true);

  const toPersistedForm = (): DomainEntry[] =>
    domains.map(({ expanded, ...rest }) => rest);

  const handleSave = async () => {
    setSaving(true);
    try {
      await analyticsApi.updateProject(projectId, {
        analysis_scope: { ...scope, domain_hierarchy: toPersistedForm() },
      });
      setDirty(false);
      toast.success('Domain hierarchy saved');
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const addDomain = () => {
    if (!newDomain.trim()) return;
    setDomains((prev) => [...prev, { name: newDomain.trim(), sub_domains: [], expanded: true }]);
    setNewDomain('');
    markDirty();
  };

  const toggleExpand = (di: number) => {
    setDomains((prev) => prev.map((d, i) => i === di ? { ...d, expanded: !d.expanded } : d));
  };

  const removeDomain = (di: number) => {
    setDomains((prev) => prev.filter((_, i) => i !== di));
    markDirty();
  };

  const addSubDomain = (di: number) => {
    const val = newSub[di]?.trim();
    if (!val) return;
    setDomains((prev) =>
      prev.map((d, i) =>
        i === di
          ? { ...d, sub_domains: [...d.sub_domains, { name: val, ipc_codes: [], lifecycle: 'emerging' }] }
          : d
      )
    );
    setNewSub((prev) => ({ ...prev, [di]: '' }));
    markDirty();
  };

  const removeSubDomain = (di: number, si: number) => {
    setDomains((prev) =>
      prev.map((d, i) =>
        i === di ? { ...d, sub_domains: d.sub_domains.filter((_, j) => j !== si) } : d
      )
    );
    markDirty();
  };

  const cycleLifecycle = (di: number, si: number) => {
    setDomains((prev) =>
      prev.map((d, i) => {
        if (i !== di) return d;
        return {
          ...d,
          sub_domains: d.sub_domains.map((s, j) => {
            if (j !== si) return s;
            const next = LIFECYCLE_ORDER[(LIFECYCLE_ORDER.indexOf(s.lifecycle) + 1) % LIFECYCLE_ORDER.length];
            return { ...s, lifecycle: next };
          }),
        };
      })
    );
    markDirty();
  };

  const addIpcCode = (di: number, si: number) => {
    const key = `${di}-${si}`;
    const val = newIpc[key]?.trim().toUpperCase();
    if (!val) return;
    setDomains((prev) =>
      prev.map((d, i) => {
        if (i !== di) return d;
        return {
          ...d,
          sub_domains: d.sub_domains.map((s, j) =>
            j === si && !s.ipc_codes.includes(val)
              ? { ...s, ipc_codes: [...s.ipc_codes, val] }
              : s
          ),
        };
      })
    );
    setNewIpc((prev) => ({ ...prev, [key]: '' }));
    markDirty();
  };

  const removeIpc = (di: number, si: number, code: string) => {
    setDomains((prev) =>
      prev.map((d, i) => {
        if (i !== di) return d;
        return {
          ...d,
          sub_domains: d.sub_domains.map((s, j) =>
            j === si ? { ...s, ipc_codes: s.ipc_codes.filter((c) => c !== code) } : s
          ),
        };
      })
    );
    markDirty();
  };

  const totalSubDomains = domains.reduce((s, d) => s + d.sub_domains.length, 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Layers className="h-4 w-4 text-emerald-600" />
            Technology Domain Hierarchy
            <Badge variant="outline" className="text-[10px]">
              {domains.length} domain{domains.length !== 1 ? 's' : ''} · {totalSubDomains} sub-domains
            </Badge>
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
          Define the domain taxonomy that drives classification and visualizations. Sub-domain names are shared with the Classifier tab.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {domains.map((domain, di) => (
          <div key={di} className="rounded border">
            <div className="flex items-center gap-2 px-3 py-2 bg-muted/30">
              <button onClick={() => toggleExpand(di)} className="text-muted-foreground" aria-label="Toggle">
                {domain.expanded
                  ? <ChevronDown className="h-3.5 w-3.5" />
                  : <ChevronRight className="h-3.5 w-3.5" />
                }
              </button>
              <span className="text-xs font-semibold flex-1">{domain.name}</span>
              <span className="text-[10px] text-muted-foreground">{domain.sub_domains.length} sub-domains</span>
              <button
                onClick={() => removeDomain(di)}
                className="text-muted-foreground hover:text-destructive"
                aria-label="Remove domain"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>

            {domain.expanded && (
              <div className="px-3 pb-3 pt-1 space-y-2">
                {domain.sub_domains.map((sub, si) => {
                  const cfg = LIFECYCLE_CONFIG[sub.lifecycle];
                  const ipcKey = `${di}-${si}`;
                  return (
                    <div key={si} className="flex items-start gap-2 pl-4 border-l">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium">{sub.name}</span>
                          <button onClick={() => cycleLifecycle(di, si)} title="Click to cycle stage">
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium cursor-pointer ${cfg.badge}`}>
                              {cfg.label}
                            </span>
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1 items-center">
                          {sub.ipc_codes.map((code) => (
                            <Badge key={code} variant="outline" className="text-[9px] h-4 px-1 gap-0.5">
                              {code}
                              <button
                                onClick={() => removeIpc(di, si, code)}
                                className="text-muted-foreground hover:text-destructive ml-0.5"
                                aria-label={`Remove ${code}`}
                              >×</button>
                            </Badge>
                          ))}
                          <input
                            value={newIpc[ipcKey] ?? ''}
                            onChange={(e) => setNewIpc((prev) => ({ ...prev, [ipcKey]: e.target.value }))}
                            onKeyDown={(e) => e.key === 'Enter' && addIpcCode(di, si)}
                            placeholder="+ IPC"
                            className="h-4 text-[9px] w-12 border rounded px-1 bg-transparent focus:outline-none focus:ring-1 focus:ring-ring"
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => removeSubDomain(di, si)}
                        className="text-muted-foreground hover:text-destructive mt-0.5"
                        aria-label="Remove sub-domain"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })}

                <div className="flex gap-1 pl-4">
                  <Input
                    value={newSub[di] ?? ''}
                    onChange={(e) => setNewSub((prev) => ({ ...prev, [di]: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && addSubDomain(di)}
                    placeholder="Add sub-domain..."
                    className="h-6 text-xs flex-1"
                  />
                  <Button size="sm" variant="outline" className="h-6 text-xs px-2" onClick={() => addSubDomain(di)}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}

        <div className="flex gap-2">
          <Input
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addDomain()}
            placeholder="Add top-level domain..."
            className="h-7 text-sm flex-1"
          />
          <Button size="sm" className="h-7 text-xs shrink-0" onClick={addDomain}>
            <Plus className="mr-1 h-3 w-3" /> Add Domain
          </Button>
        </div>

        <p className="text-[10px] text-muted-foreground">
          Click a lifecycle badge to cycle: Emerging → Growth → Mature → Declining
        </p>
      </CardContent>
    </Card>
  );
}
