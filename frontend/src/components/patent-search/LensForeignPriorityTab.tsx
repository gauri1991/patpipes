'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { LensPatent } from '@/services/lensApi';

interface LensForeignPriorityTabProps {
  data: LensPatent | null;
  isLoading?: boolean;
}

export function LensForeignPriorityTab({ data, isLoading }: LensForeignPriorityTabProps) {
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

  const priorityClaims = data.biblio?.priority_claims;
  const claims = priorityClaims?.claims || [];
  const earliest = priorityClaims?.earliest_claim?.date;

  if (claims.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center">
        No priority claim data available for this patent.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">Priority Claims</CardTitle>
            <Badge variant="secondary">{claims.length} claim{claims.length !== 1 ? 's' : ''}</Badge>
            {earliest && (
              <Badge variant="outline" className="text-xs">
                Earliest: {earliest}
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">Source: Lens.org</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-2 pr-4 font-medium text-muted-foreground">Jurisdiction</th>
                  <th className="pb-2 pr-4 font-medium text-muted-foreground">Application Number</th>
                  <th className="pb-2 pr-4 font-medium text-muted-foreground">Filing Date</th>
                  <th className="pb-2 font-medium text-muted-foreground">Kind</th>
                </tr>
              </thead>
              <tbody>
                {claims.map((claim, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-2.5 pr-4">
                      <Badge variant="outline" className="text-xs font-mono">
                        {claim.jurisdiction || '—'}
                      </Badge>
                    </td>
                    <td className="py-2.5 pr-4 font-mono text-xs">
                      {claim.doc_number || '—'}
                    </td>
                    <td className="py-2.5 pr-4 whitespace-nowrap text-muted-foreground">
                      {claim.date || '—'}
                    </td>
                    <td className="py-2.5 font-mono text-xs text-muted-foreground">
                      {claim.kind || '—'}
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
