'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { LensPatent } from '@/services/lensApi';

interface LensAssignmentsTabProps {
  data: LensPatent | null;
  isLoading?: boolean;
}

export function LensAssignmentsTab({ data, isLoading }: LensAssignmentsTabProps) {
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

  const owners = data.biblio?.parties?.owners_all || [];

  if (owners.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center">
        No ownership/assignment data available for this patent.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">Ownership History</CardTitle>
            <Badge variant="secondary">{owners.length} record{owners.length !== 1 ? 's' : ''}</Badge>
            <Badge variant="outline" className="text-xs">Source: Lens.org</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-2 pr-4 font-medium text-muted-foreground">Owner</th>
                  <th className="pb-2 pr-4 font-medium text-muted-foreground">Country</th>
                  <th className="pb-2 pr-4 font-medium text-muted-foreground whitespace-nowrap">Recorded Date</th>
                  <th className="pb-2 pr-4 font-medium text-muted-foreground whitespace-nowrap">Execution Date</th>
                  <th className="pb-2 font-medium text-muted-foreground">Address</th>
                </tr>
              </thead>
              <tbody>
                {owners.map((owner, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-2.5 pr-4 font-medium">
                      {owner.extracted_name?.value || '—'}
                    </td>
                    <td className="py-2.5 pr-4">
                      {owner.extracted_country ? (
                        <Badge variant="outline" className="text-xs font-mono">
                          {owner.extracted_country}
                        </Badge>
                      ) : '—'}
                    </td>
                    <td className="py-2.5 pr-4 whitespace-nowrap text-muted-foreground">
                      {owner.recorded_date || '—'}
                    </td>
                    <td className="py-2.5 pr-4 whitespace-nowrap text-muted-foreground">
                      {owner.execution_date || '—'}
                    </td>
                    <td className="py-2.5 text-muted-foreground text-xs">
                      {owner.extracted_address || '—'}
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
