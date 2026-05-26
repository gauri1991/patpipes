'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { analyticsApi, WhiteSpaceAnalysis } from '@/services/analyticsApi';

interface HeatmapCell {
  function: string;
  application: string;
  patentCount: number;
  opportunityScore?: number;
}

interface WhiteSpaceHeatmapProps {
  projectId: string;
  cells?: HeatmapCell[];
  functions?: string[];
  applications?: string[];
}

function transformWhiteSpaceData(ws: WhiteSpaceAnalysis): {
  cells: HeatmapCell[];
  functions: string[];
  applications: string[];
} {
  const functions = ws.technology_areas;
  const applications = ws.application_domains;
  const cells: HeatmapCell[] = ws.matrix.flatMap((row) =>
    applications.map((app) => ({
      function: row.technology_area,
      application: app,
      patentCount: row.domains[app] ?? 0,
    })),
  );
  // Enrich with opportunity scores from the opportunities list
  for (const opp of ws.opportunities) {
    const cell = cells.find(
      (c) => c.function === opp.technology_area && c.application === opp.application_domain,
    );
    if (cell) cell.opportunityScore = opp.opportunity_score;
  }
  return { cells, functions, applications };
}

function cellColor(count: number): string {
  if (count === 0) return 'bg-green-200 dark:bg-green-900/60 text-green-800 dark:text-green-200';
  if (count <= 5) return 'bg-yellow-200 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-200';
  if (count <= 20) return 'bg-orange-200 dark:bg-orange-900/40 text-orange-800 dark:text-orange-200';
  return 'bg-red-200 dark:bg-red-900/50 text-red-800 dark:text-red-200';
}

function cellLabel(count: number): string {
  if (count === 0) return 'Empty';
  if (count <= 5) return 'Sparse';
  if (count <= 20) return 'Moderate';
  return 'Dense';
}

export function WhiteSpaceHeatmap({
  projectId,
  cells: externalCells,
  functions: externalFunctions,
  applications: externalApplications,
}: WhiteSpaceHeatmapProps) {
  const [fetchedData, setFetchedData] = useState<{
    cells: HeatmapCell[];
    functions: string[];
    applications: string[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAnalysis = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await analyticsApi.findWhiteSpace(projectId);
      if (response.success && response.data) {
        setFetchedData(transformWhiteSpaceData(response.data));
      } else {
        setError('No white space analysis data available');
      }
    } catch (err) {
      setError('Failed to load white space analysis');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (!externalCells) {
      loadAnalysis();
    }
  }, [externalCells, loadAnalysis]);

  const functions = externalFunctions ?? fetchedData?.functions ?? [];
  const applications = externalApplications ?? fetchedData?.applications ?? [];
  const data = externalCells ?? fetchedData?.cells ?? [];
  const getCell = (fn: string, app: string) =>
    data.find((c) => c.function === fn && c.application === app);

  const emptyCells = data.filter((c) => c.patentCount === 0).length;
  const sparseCells = data.filter((c) => c.patentCount > 0 && c.patentCount <= 5).length;
  const totalOpportunities = emptyCells + sparseCells;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm">White Space Heatmap</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Patent density by function x application. Green = opportunity, Red = saturated.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {totalOpportunities} opportunity cells
            </Badge>
            <Button variant="ghost" size="sm" onClick={loadAnalysis} disabled={loading} aria-label="Refresh white space analysis">
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
            <RefreshCw className="h-3 w-3 animate-spin" /> Running white space analysis...
          </div>
        )}
        {error && !loading && data.length === 0 && (
          <p className="text-xs text-muted-foreground py-2">{error}</p>
        )}
        {/* Heatmap */}
        <div className="overflow-x-auto">
          <table className="text-xs border-collapse w-full">
            <thead>
              <tr>
                <th className="p-2 text-left text-muted-foreground font-medium min-w-[100px]">
                  Function \ Application
                </th>
                {applications.map((app) => (
                  <th key={app} className="p-2 text-center font-medium min-w-[80px]">
                    {app}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {functions.map((fn) => (
                <tr key={fn}>
                  <td className="p-2 font-medium">{fn}</td>
                  {applications.map((app) => {
                    const cell = getCell(fn, app);
                    const count = cell?.patentCount ?? 0;
                    return (
                      <td
                        key={app}
                        className={`p-2 text-center border rounded ${cellColor(count)}`}
                        title={`${fn} × ${app}: ${count} patents (${cellLabel(count)})`}
                      >
                        <div className="font-bold">{count}</div>
                        <div className="text-[10px] opacity-80">{cellLabel(count)}</div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-xs">
          {[
            { label: 'Empty (0)', color: 'bg-green-200' },
            { label: 'Sparse (1–5)', color: 'bg-yellow-200' },
            { label: 'Moderate (6–20)', color: 'bg-orange-200' },
            { label: 'Dense (21+)', color: 'bg-red-200' },
          ].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className={`w-4 h-4 rounded ${color}`} />
              <span className="text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>

        {/* Top opportunities */}
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Top White Space Opportunities</p>
          {data
            .filter((c) => c.patentCount <= 5)
            .sort((a, b) => a.patentCount - b.patentCount)
            .slice(0, 5)
            .map((c) => (
              <div
                key={`${c.function}-${c.application}`}
                className="flex items-center justify-between rounded-md border px-3 py-1.5"
              >
                <span className="text-xs">
                  <span className="font-medium">{c.function}</span> × {c.application}
                </span>
                <Badge
                  variant={c.patentCount === 0 ? 'secondary' : 'outline'}
                  className="text-[10px]"
                >
                  {c.patentCount === 0 ? 'Empty' : `${c.patentCount} patents`}
                </Badge>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
