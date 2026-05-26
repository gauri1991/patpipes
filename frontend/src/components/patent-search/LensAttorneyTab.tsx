'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { LensPatent } from '@/services/lensApi';

interface LensAttorneyTabProps {
  data: LensPatent | null;
  isLoading?: boolean;
}

export function LensAttorneyTab({ data, isLoading }: LensAttorneyTabProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!data) {
    return <p className="text-muted-foreground py-8 text-center">No patent data available.</p>;
  }

  const agents = data.biblio?.parties?.agents || [];

  if (agents.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center">
        No attorney/agent data available for this patent.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">Agents / Representatives</CardTitle>
            <Badge variant="secondary">{agents.length} agent{agents.length !== 1 ? 's' : ''}</Badge>
            <Badge variant="outline" className="text-xs">Source: Lens.org</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-2 pr-4 font-medium text-muted-foreground w-12">#</th>
                  <th className="pb-2 font-medium text-muted-foreground">Name</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((agent, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-2.5 pr-4 text-muted-foreground">
                      {agent.sequence ?? i + 1}
                    </td>
                    <td className="py-2.5 font-medium">
                      {agent.extracted_name?.value || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
