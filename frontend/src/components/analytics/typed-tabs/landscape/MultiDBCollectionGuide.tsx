'use client';

import { useState, useEffect } from 'react';
import { Database, CheckCircle2, Circle, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { analyticsApi, type AnalyticsProject } from '@/services/analyticsApi';
import { toast } from 'sonner';

interface DBEntry {
  name: string;
  abbr: string;
  coverage: string;
  notes: string;
  badge: string;
  priority: 'essential' | 'recommended' | 'optional';
}

const DATABASES: DBEntry[] = [
  {
    name: 'United States Patent and Trademark Office',
    abbr: 'USPTO',
    coverage: 'US patents & applications (1790–present)',
    notes: 'Full text search; use PatentsView or Open Data Portal API for bulk data.',
    badge: 'bg-blue-100 text-blue-800',
    priority: 'essential',
  },
  {
    name: 'European Patent Office',
    abbr: 'EPO',
    coverage: 'EP + 100+ member states; DOCDB family data',
    notes: 'Use OPS API for programmatic access; covers EP, WO, and national phase entries.',
    badge: 'bg-yellow-100 text-yellow-800',
    priority: 'essential',
  },
  {
    name: 'World Intellectual Property Organization',
    abbr: 'WIPO',
    coverage: 'PCT applications (WO); international phase only',
    notes: 'Use WIPO CASE for national phase tracking. Essential for global scope analysis.',
    badge: 'bg-green-100 text-green-800',
    priority: 'essential',
  },
  {
    name: 'Japan Patent Office',
    abbr: 'JPO',
    coverage: 'Japanese patents (JP); machine translation available',
    notes: 'Critical for automotive, robotics, and electronics landscapes. Use FI/F-term classification.',
    badge: 'bg-red-100 text-red-800',
    priority: 'recommended',
  },
  {
    name: 'China National Intellectual Property Administration',
    abbr: 'CNIPA',
    coverage: 'Chinese patents (CN); growing since 2010',
    notes: 'Use SooPAT or IncoPat for better Chinese language search. Mandatory for tech landscapes.',
    badge: 'bg-orange-100 text-orange-800',
    priority: 'recommended',
  },
  {
    name: 'Korean Intellectual Property Office',
    abbr: 'KIPO',
    coverage: 'Korean patents (KR); key in semiconductors and displays',
    notes: 'Machine translation available. Important for Samsung, LG, SK Hynix competitive landscape.',
    badge: 'bg-purple-100 text-purple-800',
    priority: 'optional',
  },
  {
    name: 'Derwent Innovation / Lens.org',
    abbr: 'Derwent/Lens',
    coverage: 'Aggregated global — all major offices',
    notes: 'Derwent: enhanced abstracts, family deduplication. Lens.org: free, open access alternative.',
    badge: 'bg-gray-100 text-gray-700',
    priority: 'recommended',
  },
];

const PRIORITY_ORDER = { essential: 0, recommended: 1, optional: 2 };

interface MultiDBCollectionGuideProps {
  projectId: string;
  project: AnalyticsProject;
  onScopeUpdate?: () => void;
}

export function MultiDBCollectionGuide({ projectId, project, onScopeUpdate }: MultiDBCollectionGuideProps) {
  const scope = project.analysis_scope ?? {};

  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  // Initialize from project data
  useEffect(() => {
    const saved = Array.isArray(scope.collected_databases) ? scope.collected_databases : [];
    setChecked(new Set(saved));
  }, [project.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = async (abbr: string) => {
    const next = new Set(checked);
    if (next.has(abbr)) next.delete(abbr);
    else next.add(abbr);
    setChecked(next);

    // Save immediately on toggle
    setSaving(true);
    try {
      await analyticsApi.updateProject(projectId, {
        analysis_scope: { ...scope, collected_databases: Array.from(next) },
      });
      onScopeUpdate?.();
    } catch {
      toast.error('Failed to save database status');
      // Revert
      setChecked(checked);
    } finally {
      setSaving(false);
    }
  };

  const sorted = [...DATABASES].sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
  const completedCount = sorted.filter((d) => checked.has(d.abbr)).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Database className="h-4 w-4 text-emerald-600" />
          Database Collection Tracker
          <Badge variant="outline" className="ml-auto text-[10px]">
            {completedCount}/{DATABASES.length} collected
            {saving && <span className="ml-1 animate-pulse">saving...</span>}
          </Badge>
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Mark databases as you collect data. Progress is saved to the project automatically.
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {sorted.map((db) => {
          const isChecked = checked.has(db.abbr);
          return (
            <button
              key={db.abbr}
              className={`w-full text-left rounded border px-3 py-2.5 flex items-start gap-3 transition-colors ${
                isChecked ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200' : 'hover:bg-muted/40'
              }`}
              onClick={() => toggle(db.abbr)}
              disabled={saving}
            >
              {isChecked
                ? <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                : <Circle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              }
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold">{db.abbr}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${db.badge}`}>
                    {db.priority}
                  </span>
                  <ExternalLink className="h-2.5 w-2.5 text-muted-foreground" />
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">{db.coverage}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 italic">{db.notes}</p>
              </div>
            </button>
          );
        })}

        <div className="flex items-center justify-between rounded border bg-emerald-50 dark:bg-emerald-950/20 px-3 py-2 mt-1">
          <p className="text-xs text-emerald-700 dark:text-emerald-300">
            <span className="font-semibold">{completedCount}</span> of {DATABASES.length} databases collected
          </p>
          <Badge
            variant="outline"
            className={`text-[10px] ${completedCount >= 3 ? 'border-emerald-300 text-emerald-700' : ''}`}
          >
            {completedCount >= 5 ? 'Comprehensive' : completedCount >= 3 ? 'Good coverage' : 'Incomplete'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
