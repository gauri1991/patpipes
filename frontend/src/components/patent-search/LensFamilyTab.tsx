'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { LensPatent, LensFamilyMember } from '@/services/lensApi';

interface LensFamilyTabProps {
  data: LensPatent | null;
  isLoading?: boolean;
  /** Called when user clicks a family member to navigate. */
  onNavigate?: (docNumber: string, jurisdiction: string) => void;
}

function FamilyMemberTable({
  members,
  onNavigate,
}: {
  members: LensFamilyMember[];
  onNavigate?: (docNumber: string, jurisdiction: string) => void;
}) {
  if (members.length === 0) {
    return <p className="text-sm text-muted-foreground">No family members found.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="pb-2 pr-4 font-medium text-muted-foreground">Jurisdiction</th>
            <th className="pb-2 pr-4 font-medium text-muted-foreground">Document Number</th>
            <th className="pb-2 pr-4 font-medium text-muted-foreground">Kind</th>
            <th className="pb-2 font-medium text-muted-foreground">Date</th>
          </tr>
        </thead>
        <tbody>
          {members.map((m, i) => {
            const doc = m.document_id;
            const jurisdiction = doc?.jurisdiction || '';
            const docNumber = doc?.doc_number || '';
            const kind = doc?.kind || '';
            const date = doc?.date || '';
            const isClickable = !!onNavigate && !!docNumber && !!jurisdiction;

            return (
              <tr
                key={m.lens_id || i}
                className={`border-b last:border-0 ${isClickable ? 'cursor-pointer hover:bg-muted/50' : ''}`}
                onClick={isClickable ? () => onNavigate!(docNumber, jurisdiction) : undefined}
              >
                <td className="py-2 pr-4">
                  <Badge variant="outline" className="text-xs font-mono">{jurisdiction}</Badge>
                </td>
                <td className="py-2 pr-4 font-mono text-xs">{docNumber}</td>
                <td className="py-2 pr-4 font-mono text-xs">{kind}</td>
                <td className="py-2 text-muted-foreground">{date || '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function LensFamilyTab({ data, isLoading, onNavigate }: LensFamilyTabProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!data) {
    return <p className="text-muted-foreground py-8 text-center">No patent data available.</p>;
  }

  const families = data.families;
  if (!families) {
    return (
      <p className="text-muted-foreground py-8 text-center">
        No patent family data available.
      </p>
    );
  }

  const simple = families.simple_family;
  const extended = families.extended_family;

  return (
    <div className="space-y-6">
      {/* Simple Family */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">Simple Patent Family</CardTitle>
            {simple?.size != null && (
              <Badge variant="secondary">{simple.size} member{simple.size !== 1 ? 's' : ''}</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <FamilyMemberTable
            members={simple?.members || []}
            onNavigate={onNavigate}
          />
        </CardContent>
      </Card>

      {/* Extended Family */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">Extended Patent Family</CardTitle>
            {extended?.size != null && (
              <Badge variant="secondary">{extended.size} member{extended.size !== 1 ? 's' : ''}</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <FamilyMemberTable
            members={extended?.members || []}
            onNavigate={onNavigate}
          />
        </CardContent>
      </Card>
    </div>
  );
}
