'use client';

import { Search, Globe, CalendarRange, Building2, Tag, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AnalyticsProject } from '@/services/analyticsApi';
import {
  ChipList,
  ScopeRow,
  StatusStrip,
  TimelineCard,
  TeamCard,
  CoverageCard,
  DescriptionCard,
} from './shared';

interface LandscapeOverviewPanelProps {
  project: AnalyticsProject;
  getStatusColor: (status: string) => string;
  getPriorityVariant: (priority: string) => 'default' | 'secondary' | 'destructive' | 'outline';
}

export function LandscapeOverviewPanel({ project, getStatusColor, getPriorityVariant }: LandscapeOverviewPanelProps) {
  const scope = project.analysis_scope ?? {};

  const keywords: string[]      = Array.isArray(scope.keywords) ? scope.keywords : [];
  const ipcCodes: string[]      = Array.isArray(scope.ipc_codes) ? scope.ipc_codes : Array.isArray(scope.cpc_codes) ? scope.cpc_codes : [];
  const jurisdictions: string[] = Array.isArray(scope.jurisdictions) ? scope.jurisdictions : [];
  const assignees: string[]     = Array.isArray(scope.target_assignees) ? scope.target_assignees : [];
  const techAreas: string[]     = Array.isArray(scope.technology_areas) ? scope.technology_areas : [];

  const dateStart: string = scope.date_range_start ?? scope.start_year ?? '';
  const dateEnd: string   = scope.date_range_end ?? scope.end_year ?? '';
  const dateRangeLabel = dateStart || dateEnd ? `${dateStart || '—'} → ${dateEnd || 'Present'}` : 'Not defined';

  return (
    <div className="space-y-4">
      <StatusStrip project={project} getStatusColor={getStatusColor} getPriorityVariant={getPriorityVariant} />

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Scope — 2/3 */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Search className="h-4 w-4 text-blue-600" />
              Landscape Scope
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ScopeRow icon={Tag} label="Keywords">
              <ChipList items={keywords} emptyText="No keywords defined" color="blue" />
            </ScopeRow>
            <ScopeRow icon={Tag} label="IPC / CPC Codes">
              <ChipList items={ipcCodes} emptyText="No classification codes defined" color="purple" />
            </ScopeRow>
            <ScopeRow icon={Globe} label="Jurisdictions">
              <ChipList items={jurisdictions} emptyText="All jurisdictions" color="green" />
            </ScopeRow>
            <ScopeRow icon={CalendarRange} label="Date Range">
              <span className="text-xs font-medium">{dateRangeLabel}</span>
            </ScopeRow>
            <ScopeRow icon={Building2} label="Target Assignees">
              <ChipList items={assignees} emptyText="No specific assignees" color="orange" />
            </ScopeRow>
            {techAreas.length > 0 && (
              <ScopeRow icon={TrendingUp} label="Tech Areas">
                <ChipList items={techAreas} emptyText="" color="default" />
              </ScopeRow>
            )}
          </CardContent>
        </Card>

        {/* Right: Coverage + Timeline */}
        <div className="space-y-3">
          <CoverageCard
            project={project}
            extra={[{ icon: Building2, label: 'Competitors', value: project.competitors?.length ?? 0 }]}
          />
          <TimelineCard project={project} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <DescriptionCard description={project.description} />
        <TeamCard project={project} />
      </div>
    </div>
  );
}
