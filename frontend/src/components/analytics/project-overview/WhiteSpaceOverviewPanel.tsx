'use client';

import { Map, Rows3, Columns3, Globe, CalendarRange, Tag, Lightbulb } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AnalyticsProject } from '@/services/analyticsApi';
import {
  ChipList, ScopeRow, StatusStrip, TimelineCard, TeamCard, CoverageCard, DescriptionCard,
} from './shared';

interface WhiteSpaceOverviewPanelProps {
  project: AnalyticsProject;
  getStatusColor: (status: string) => string;
  getPriorityVariant: (priority: string) => 'default' | 'secondary' | 'destructive' | 'outline';
}

export function WhiteSpaceOverviewPanel({ project, getStatusColor, getPriorityVariant }: WhiteSpaceOverviewPanelProps) {
  const scope = project.analysis_scope ?? {};

  const domain: string          = scope.technology_domain ?? scope.domain ?? '';
  const functionAxis: string[]  = Array.isArray(scope.function_axis) ? scope.function_axis : [];
  const appAxis: string[]       = Array.isArray(scope.application_axis) ? scope.application_axis : [];
  const ipcCodes: string[]      = Array.isArray(scope.ipc_codes) ? scope.ipc_codes : Array.isArray(scope.cpc_codes) ? scope.cpc_codes : [];
  const jurisdictions: string[] = Array.isArray(scope.jurisdictions) ? scope.jurisdictions : [];
  const dateStart: string       = scope.date_range_start ?? '';
  const dateEnd: string         = scope.date_range_end ?? '';
  const dateLabel = dateStart || dateEnd ? `${dateStart || '—'} → ${dateEnd || 'Present'}` : 'Not defined';

  // Matrix summary from stored analysis results
  const matrix: { empty?: number; sparse?: number; dense?: number } = scope.matrix_summary ?? {};
  const totalCells = (matrix.empty ?? 0) + (matrix.sparse ?? 0) + (matrix.dense ?? 0);
  const hasMatrix = totalCells > 0;

  // Computed matrix dimensions
  const rows = functionAxis.length || (scope.matrix_rows ?? 0);
  const cols = appAxis.length || (scope.matrix_cols ?? 0);
  const matrixSize = rows > 0 && cols > 0 ? `${rows} × ${cols}` : 'Not defined';

  return (
    <div className="space-y-4">
      <StatusStrip project={project} getStatusColor={getStatusColor} getPriorityVariant={getPriorityVariant} />

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Scope — 2/3 */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Map className="h-4 w-4 text-emerald-600" />
              White Space Scope
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {domain && (
              <ScopeRow icon={Tag} label="Technology Domain">
                <span className="text-xs font-semibold">{domain}</span>
              </ScopeRow>
            )}
            <ScopeRow icon={Rows3} label="Function Axis">
              <ChipList items={functionAxis} emptyText="No functions defined" color="blue" />
            </ScopeRow>
            <ScopeRow icon={Columns3} label="Application Axis">
              <ChipList items={appAxis} emptyText="No applications defined" color="teal" />
            </ScopeRow>
            <ScopeRow icon={Tag} label="IPC / CPC Codes">
              <ChipList items={ipcCodes} emptyText="No classification codes" color="purple" />
            </ScopeRow>
            <ScopeRow icon={Globe} label="Jurisdictions">
              <ChipList items={jurisdictions} emptyText="All jurisdictions" color="green" />
            </ScopeRow>
            <ScopeRow icon={CalendarRange} label="Date Range">
              <span className="text-xs font-medium">{dateLabel}</span>
            </ScopeRow>
          </CardContent>
        </Card>

        {/* Right: Matrix Stats + Coverage */}
        <div className="space-y-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Lightbulb className="h-3.5 w-3.5 text-emerald-600" />
                Matrix Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              {/* Matrix size */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Matrix Size</span>
                <span className="text-sm font-semibold">{matrixSize}</span>
              </div>

              {hasMatrix ? (
                <>
                  {/* Density bar */}
                  <div>
                    <div className="h-3 flex rounded overflow-hidden gap-0.5 mb-2">
                      {matrix.empty! > 0 && (
                        <div
                          className="bg-green-400"
                          style={{ width: `${Math.round((matrix.empty! / totalCells) * 100)}%` }}
                          title={`Empty (opportunity): ${matrix.empty}`}
                        />
                      )}
                      {matrix.sparse! > 0 && (
                        <div
                          className="bg-yellow-400"
                          style={{ width: `${Math.round((matrix.sparse! / totalCells) * 100)}%` }}
                          title={`Sparse: ${matrix.sparse}`}
                        />
                      )}
                      {matrix.dense! > 0 && (
                        <div
                          className="bg-red-400"
                          style={{ width: `${Math.round((matrix.dense! / totalCells) * 100)}%` }}
                          title={`Dense (crowded): ${matrix.dense}`}
                        />
                      )}
                    </div>
                    <div className="space-y-1">
                      {[
                        { label: 'Empty — opportunity', value: matrix.empty ?? 0, badge: 'bg-green-100 text-green-800' },
                        { label: 'Sparse', value: matrix.sparse ?? 0, badge: 'bg-yellow-100 text-yellow-800' },
                        { label: 'Dense — crowded', value: matrix.dense ?? 0, badge: 'bg-red-100 text-red-800' },
                      ].map(({ label, value, badge }) => (
                        <div key={label} className="flex items-center justify-between">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${badge}`}>{label}</span>
                          <span className="text-xs font-semibold">{value} cells</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="text-[10px] text-muted-foreground pt-1 border-t">
                    {matrix.empty ?? 0} of {totalCells} cells are filing opportunities
                  </div>
                </>
              ) : (
                <p className="text-xs text-muted-foreground italic text-center py-2">
                  Matrix not yet populated
                </p>
              )}
            </CardContent>
          </Card>

          <CoverageCard project={project} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <DescriptionCard description={project.description} />
        <div className="space-y-3">
          <TimelineCard project={project} />
          <TeamCard project={project} />
        </div>
      </div>
    </div>
  );
}
