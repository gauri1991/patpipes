'use client';

import { useState, useEffect, useMemo } from 'react';
import { Building2, Plus, ArrowUpRight, ArrowDownRight, Minus, TrendingUp, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { analyticsApi, type AnalyticsProject } from '@/services/analyticsApi';
import { toast } from 'sonner';

type Trend = 'up' | 'down' | 'flat';

interface TopFiler {
  name: string;
  total_patents: number;
  recent_patents: number; // last 3 years
  trend: Trend;
  focus_areas: string[];
}

const TREND_ORDER: Trend[] = ['up', 'flat', 'down'];

interface LandscapeTopFilersPanelProps {
  projectId: string;
  project: AnalyticsProject;
}

export function LandscapeTopFilersPanel({ projectId, project }: LandscapeTopFilersPanelProps) {
  const scope = project.analysis_scope ?? {};

  const [filers, setFilers] = useState<TopFiler[]>([]);
  const [newName, setNewName] = useState('');
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  // Initialize from project
  useEffect(() => {
    const saved: TopFiler[] = Array.isArray(scope.top_filers) ? scope.top_filers : [];
    if (saved.length > 0) {
      setFilers(saved);
    } else {
      // Seed from target_assignees if available
      const assignees: string[] = Array.isArray(scope.target_assignees) ? scope.target_assignees : [];
      setFilers(assignees.map((name) => ({ name, total_patents: 0, recent_patents: 0, trend: 'flat' as Trend, focus_areas: [] })));
    }
    setDirty(false);
  }, [project.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sub-domain names from domain_hierarchy for focus area suggestions
  const subDomainNames = useMemo(() => {
    const hierarchy: { sub_domains?: { name: string }[] }[] = Array.isArray(scope.domain_hierarchy) ? scope.domain_hierarchy : [];
    return hierarchy.flatMap((d) => (d.sub_domains ?? []).map((s) => s.name));
  }, [scope.domain_hierarchy]);

  const markDirty = () => setDirty(true);

  const addFiler = () => {
    if (!newName.trim()) return;
    setFilers((prev) => [...prev, { name: newName.trim(), total_patents: 0, recent_patents: 0, trend: 'flat', focus_areas: [] }]);
    setNewName('');
    markDirty();
  };

  const removeFiler = (idx: number) => {
    setFilers((prev) => prev.filter((_, i) => i !== idx));
    markDirty();
  };

  const updateField = (idx: number, field: 'total_patents' | 'recent_patents', val: string) => {
    const n = parseInt(val, 10);
    setFilers((prev) => prev.map((f, i) => i === idx ? { ...f, [field]: isNaN(n) ? 0 : n } : f));
    markDirty();
  };

  const cycleTrend = (idx: number) => {
    setFilers((prev) =>
      prev.map((f, i) => {
        if (i !== idx) return f;
        const next = TREND_ORDER[(TREND_ORDER.indexOf(f.trend) + 1) % TREND_ORDER.length];
        return { ...f, trend: next };
      })
    );
    markDirty();
  };

  const toggleFocus = (idx: number, area: string) => {
    setFilers((prev) =>
      prev.map((f, i) => {
        if (i !== idx) return f;
        const has = f.focus_areas.includes(area);
        return { ...f, focus_areas: has ? f.focus_areas.filter((a) => a !== area) : [...f.focus_areas, area] };
      })
    );
    markDirty();
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await analyticsApi.updateProject(projectId, {
        analysis_scope: { ...scope, top_filers: filers },
      });
      setDirty(false);
      toast.success('Top filers saved');
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const TrendIcon = ({ trend }: { trend: Trend }) => {
    if (trend === 'up') return <ArrowUpRight className="h-3.5 w-3.5 text-green-500" />;
    if (trend === 'down') return <ArrowDownRight className="h-3.5 w-3.5 text-red-500" />;
    return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
  };

  const maxTotal = Math.max(...filers.map((f) => f.total_patents), 1);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Building2 className="h-4 w-4 text-blue-600" />
            Top Filers Analysis
            <Badge variant="outline" className="text-[10px]">{filers.length} tracked</Badge>
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
          Track key patent filers in the landscape. Filing counts, velocity trends, and technology focus areas are saved to the project.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {filers.length === 0 ? (
          <div className="text-center py-6 space-y-2">
            <Building2 className="h-8 w-8 text-muted-foreground/30 mx-auto" />
            <p className="text-xs text-muted-foreground">
              No top filers tracked yet. Add assignees discovered during patent retrieval.
            </p>
          </div>
        ) : (
          <div className="rounded border overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Assignee</th>
                  <th className="text-center px-2 py-2 font-medium text-muted-foreground w-20">Total</th>
                  <th className="text-center px-2 py-2 font-medium text-muted-foreground w-20">Recent</th>
                  <th className="text-center px-2 py-2 font-medium text-muted-foreground w-16">Trend</th>
                  <th className="text-left px-2 py-2 font-medium text-muted-foreground">Relative Size</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {filers.map((f, i) => {
                  const barWidth = f.total_patents > 0 ? Math.round((f.total_patents / maxTotal) * 100) : 0;
                  return (
                    <tr key={i} className="border-b last:border-0 hover:bg-muted/20">
                      <td className="px-3 py-2 font-medium">{f.name}</td>
                      <td className="px-2 py-1.5 text-center">
                        <Input
                          type="number"
                          value={f.total_patents || ''}
                          onChange={(e) => updateField(i, 'total_patents', e.target.value)}
                          className="h-6 text-xs text-center w-16 mx-auto"
                        />
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        <Input
                          type="number"
                          value={f.recent_patents || ''}
                          onChange={(e) => updateField(i, 'recent_patents', e.target.value)}
                          className="h-6 text-xs text-center w-16 mx-auto"
                          title="Last 3 years"
                        />
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        <button onClick={() => cycleTrend(i)} title="Click to cycle trend">
                          <TrendIcon trend={f.trend} />
                        </button>
                      </td>
                      <td className="px-2 py-1.5">
                        <div className="h-2 bg-muted rounded overflow-hidden">
                          <div className="h-full bg-blue-400 rounded" style={{ width: `${barWidth}%` }} />
                        </div>
                      </td>
                      <td className="px-1">
                        <button
                          onClick={() => removeFiler(i)}
                          className="text-muted-foreground hover:text-destructive"
                          aria-label="Remove"
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Focus area tags per filer (if domain hierarchy exists) */}
        {subDomainNames.length > 0 && filers.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> Technology Focus Tags
            </p>
            <div className="space-y-1.5">
              {filers.map((f, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-[10px] text-muted-foreground w-24 shrink-0 pt-0.5 truncate" title={f.name}>{f.name}</span>
                  <div className="flex flex-wrap gap-1">
                    {subDomainNames.map((area) => (
                      <button
                        key={area}
                        onClick={() => toggleFocus(i, area)}
                        className={`text-[9px] px-1.5 py-0.5 rounded-full border transition-colors ${
                          f.focus_areas.includes(area)
                            ? 'bg-blue-100 text-blue-800 border-blue-300'
                            : 'text-muted-foreground border-muted hover:border-blue-300'
                        }`}
                      >
                        {area}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add filer */}
        <div className="flex gap-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addFiler()}
            placeholder="Add assignee / filer name..."
            className="h-7 text-sm flex-1"
          />
          <Button size="sm" className="h-7 text-xs shrink-0" onClick={addFiler}>
            <Plus className="mr-1 h-3 w-3" /> Add Filer
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
