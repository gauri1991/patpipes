'use client';

import { useState, useEffect, useMemo } from 'react';
import { Tag, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { analyticsApi, type AnalyticsProject } from '@/services/analyticsApi';
import { toast } from 'sonner';

type Confidence = 'high' | 'medium' | 'low';

interface ClassificationRow {
  name: string;
  count: number;
  confidence: Confidence;
}

const CONFIDENCE_CONFIG: Record<Confidence, { label: string; badge: string }> = {
  high:   { label: 'High',   badge: 'bg-green-100 text-green-800' },
  medium: { label: 'Medium', badge: 'bg-yellow-100 text-yellow-800' },
  low:    { label: 'Low',    badge: 'bg-red-100 text-red-800' },
};

const CONFIDENCE_ORDER: Confidence[] = ['high', 'medium', 'low'];

interface LandscapeClassifierPanelProps {
  projectId: string;
  project: AnalyticsProject;
  onScopeUpdate?: () => void;
}

export function LandscapeClassifierPanel({ projectId, project, onScopeUpdate }: LandscapeClassifierPanelProps) {
  const scope = project.analysis_scope ?? {};
  const TARGET = 85;

  const [totalPatents, setTotalPatents] = useState(0);
  const [rows, setRows] = useState<ClassificationRow[]>([]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  // Derive sub-domain names from domain_hierarchy (defined on Technology tab)
  const subDomainNames = useMemo(() => {
    const hierarchy: { sub_domains?: { name: string }[] }[] = Array.isArray(scope.domain_hierarchy) ? scope.domain_hierarchy : [];
    return hierarchy.flatMap((d) => (d.sub_domains ?? []).map((s) => s.name));
  }, [scope.domain_hierarchy]);

  // Initialize from saved classification_summary or from domain_hierarchy names
  useEffect(() => {
    const summary = scope.classification_summary ?? {};
    const savedTotal = summary.total_patents ?? 0;
    const perDomain: Record<string, { count: number; confidence: Confidence }> = summary.per_domain ?? {};

    setTotalPatents(savedTotal);

    // Build rows: use domain_hierarchy names as the source of truth, merge saved counts
    if (subDomainNames.length > 0) {
      setRows(
        subDomainNames.map((name) => ({
          name,
          count: perDomain[name]?.count ?? 0,
          confidence: perDomain[name]?.confidence ?? 'medium',
        }))
      );
    } else {
      // No domain hierarchy defined yet — show saved rows or empty
      const savedKeys = Object.keys(perDomain);
      if (savedKeys.length > 0) {
        setRows(savedKeys.map((name) => ({
          name,
          count: perDomain[name]?.count ?? 0,
          confidence: perDomain[name]?.confidence ?? 'medium',
        })));
      } else {
        setRows([]);
      }
    }
    setDirty(false);
  }, [project.id, subDomainNames.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalAssigned = rows.reduce((s, r) => s + r.count, 0);
  const classifiedPct = totalPatents > 0 ? Math.min(Math.round((totalAssigned / totalPatents) * 100), 100) : 0;

  const markDirty = () => setDirty(true);

  const updateCount = (idx: number, val: string) => {
    const n = parseInt(val, 10);
    setRows((prev) => prev.map((r, i) => i === idx ? { ...r, count: isNaN(n) ? 0 : n } : r));
    markDirty();
  };

  const cycleConfidence = (idx: number) => {
    setRows((prev) =>
      prev.map((r, i) => {
        if (i !== idx) return r;
        const next = CONFIDENCE_ORDER[(CONFIDENCE_ORDER.indexOf(r.confidence) + 1) % CONFIDENCE_ORDER.length];
        return { ...r, confidence: next };
      })
    );
    markDirty();
  };

  const handleTotalChange = (val: string) => {
    setTotalPatents(parseInt(val, 10) || 0);
    markDirty();
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const perDomain: Record<string, { count: number; confidence: Confidence }> = {};
      rows.forEach((r) => { perDomain[r.name] = { count: r.count, confidence: r.confidence }; });

      await analyticsApi.updateProject(projectId, {
        analysis_scope: {
          ...scope,
          classification_summary: {
            total_patents: totalPatents,
            per_domain: perDomain,
          },
        },
      });
      setDirty(false);
      toast.success('Classification summary saved');
      onScopeUpdate?.();
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const noHierarchy = subDomainNames.length === 0 && rows.length === 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Tag className="h-4 w-4 text-emerald-600" />
            Sub-Domain Classification Tracking
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
          Track how many patents are classified into each sub-domain.
          {subDomainNames.length > 0
            ? ' Sub-domains are defined on the Technology tab.'
            : ' Define sub-domains on the Technology tab first.'}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {noHierarchy ? (
          <div className="text-center py-6 space-y-2">
            <Tag className="h-8 w-8 text-muted-foreground/30 mx-auto" />
            <p className="text-xs text-muted-foreground">
              No sub-domains defined yet. Go to the <span className="font-semibold">Technology</span> tab and create your domain hierarchy first.
            </p>
          </div>
        ) : (
          <>
            {/* Total patents input + progress */}
            <div className="flex items-center gap-4">
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground">Total patents in dataset</p>
                <Input
                  type="number"
                  value={totalPatents || ''}
                  onChange={(e) => handleTotalChange(e.target.value)}
                  placeholder="e.g. 2400"
                  className="h-7 text-sm w-28"
                />
              </div>
              {totalPatents > 0 && (
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-muted-foreground">Assignment progress</span>
                    <span className={classifiedPct >= TARGET ? 'text-green-600 font-medium' : 'text-yellow-600'}>
                      {totalAssigned} / {totalPatents} ({classifiedPct}%)
                      {classifiedPct >= TARGET ? ' — target met' : ` — target ${TARGET}%`}
                    </span>
                  </div>
                  <Progress value={classifiedPct} className="h-1.5" />
                </div>
              )}
            </div>

            {/* Classification table */}
            <div className="rounded border overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted/50 border-b">
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Sub-Domain</th>
                    <th className="text-center px-2 py-2 font-medium text-muted-foreground w-24">Patent Count</th>
                    <th className="text-center px-2 py-2 font-medium text-muted-foreground w-24">Confidence</th>
                    {totalPatents > 0 && (
                      <th className="text-center px-2 py-2 font-medium text-muted-foreground w-16">Share</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => {
                    const cfg = CONFIDENCE_CONFIG[r.confidence];
                    const pct = totalPatents > 0 ? Math.round((r.count / totalPatents) * 100) : 0;
                    return (
                      <tr key={r.name} className="border-b last:border-0 hover:bg-muted/20">
                        <td className="px-3 py-2 font-medium">{r.name}</td>
                        <td className="px-2 py-1.5 text-center">
                          <Input
                            type="number"
                            value={r.count || ''}
                            onChange={(e) => updateCount(i, e.target.value)}
                            className="h-6 text-xs text-center w-20 mx-auto"
                          />
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          <button onClick={() => cycleConfidence(i)} title="Click to cycle confidence">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium cursor-pointer ${cfg.badge}`}>
                              {cfg.label}
                            </span>
                          </button>
                        </td>
                        {totalPatents > 0 && (
                          <td className="px-2 py-1.5 text-center text-muted-foreground">
                            {pct}%
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Validation banner */}
            {totalPatents > 0 && (
              <div className={`flex items-center gap-2 rounded border px-3 py-2 text-xs ${
                classifiedPct >= TARGET
                  ? 'bg-green-50 dark:bg-green-950/20 border-green-200 text-green-700'
                  : 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 text-yellow-700'
              }`}>
                {classifiedPct >= TARGET
                  ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  : <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                }
                <span>
                  {classifiedPct >= TARGET
                    ? `Classification target met — ${classifiedPct}% of patents assigned`
                    : `${totalAssigned} of ${totalPatents} patents assigned (${classifiedPct}%) — target is ${TARGET}%`
                  }
                </span>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
