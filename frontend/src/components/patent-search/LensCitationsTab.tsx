'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { LensPatent, LensCitation } from '@/services/lensApi';

interface LensCitationsTabProps {
  data: LensPatent | null;
  isLoading?: boolean;
  onNavigate?: (docNumber: string, jurisdiction: string) => void;
}

export function LensCitationsTab({ data, isLoading, onNavigate }: LensCitationsTabProps) {
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

  const refs = data.biblio?.references_cited;
  const citedBy = data.biblio?.cited_by;

  const patentCitations: LensCitation[] = [];
  const nplCitations: LensCitation[] = [];

  for (const c of refs?.citations || []) {
    if (c.patcit) patentCitations.push(c);
    if (c.nplcit) nplCitations.push(c);
  }

  const citedByPatents = citedBy?.patents || [];
  const hasAnyData = patentCitations.length > 0 || nplCitations.length > 0 || citedByPatents.length > 0;

  if (!hasAnyData) {
    return (
      <p className="text-muted-foreground py-8 text-center">
        No citation data available for this patent.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex flex-wrap gap-3">
        <Badge variant="outline" className="text-sm">
          {refs?.patent_count ?? patentCitations.length} Patent Citations
        </Badge>
        <Badge variant="outline" className="text-sm">
          {refs?.npl_count ?? nplCitations.length} NPL Citations
        </Badge>
        {refs?.npl_resolved_count != null && (
          <Badge variant="secondary" className="text-sm">
            {refs.npl_resolved_count} NPL Resolved
          </Badge>
        )}
        <Badge variant="outline" className="text-sm">
          {citedByPatents.length} Cited By
        </Badge>
      </div>

      {/* Patent Citations (backward) */}
      {patentCitations.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">Patent Citations (References Cited)</CardTitle>
              <Badge variant="secondary">{patentCitations.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 pr-4 font-medium text-muted-foreground">#</th>
                    <th className="pb-2 pr-4 font-medium text-muted-foreground">Document</th>
                    <th className="pb-2 pr-4 font-medium text-muted-foreground">Phase</th>
                    <th className="pb-2 font-medium text-muted-foreground">Category</th>
                  </tr>
                </thead>
                <tbody>
                  {patentCitations.map((c, i) => {
                    const doc = c.patcit?.document_id?.[0];
                    const jurisdiction = doc?.jurisdiction || '';
                    const docNumber = doc?.doc_number || '';
                    const kind = doc?.kind || '';
                    const display = `${jurisdiction}${docNumber}${kind}`;
                    const isClickable = !!onNavigate && !!docNumber && !!jurisdiction;

                    return (
                      <tr
                        key={i}
                        className={`border-b last:border-0 ${isClickable ? 'cursor-pointer hover:bg-muted/50' : ''}`}
                        onClick={isClickable ? () => onNavigate!(docNumber, jurisdiction) : undefined}
                      >
                        <td className="py-2 pr-4 text-muted-foreground">{c.sequence || i + 1}</td>
                        <td className="py-2 pr-4 font-mono text-xs">{display || '—'}</td>
                        <td className="py-2 pr-4">
                          {c.cited_phase && <Badge variant="outline" className="text-xs">{c.cited_phase}</Badge>}
                        </td>
                        <td className="py-2">
                          <div className="flex gap-1">
                            {c.category?.map((cat, j) => (
                              <Badge key={j} variant="secondary" className="text-xs">{cat}</Badge>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* NPL Citations */}
      {nplCitations.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">Non-Patent Literature (NPL)</CardTitle>
              <Badge variant="secondary">{nplCitations.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {nplCitations.map((c, i) => (
                <div key={i} className="text-sm border-b last:border-0 pb-2 last:pb-0">
                  <p className="text-muted-foreground">{c.nplcit?.text || '—'}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cited By (forward citations) */}
      {citedByPatents.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">Cited By (Forward Citations)</CardTitle>
              <Badge variant="secondary">{citedByPatents.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 pr-4 font-medium text-muted-foreground">Jurisdiction</th>
                    <th className="pb-2 pr-4 font-medium text-muted-foreground">Document Number</th>
                    <th className="pb-2 font-medium text-muted-foreground">Kind</th>
                  </tr>
                </thead>
                <tbody>
                  {citedByPatents.map((p, i) => {
                    const doc = p.document_id;
                    const jurisdiction = doc?.jurisdiction || '';
                    const docNumber = doc?.doc_number || '';
                    const kind = doc?.kind || '';
                    const isClickable = !!onNavigate && !!docNumber && !!jurisdiction;

                    return (
                      <tr
                        key={p.lens_id || i}
                        className={`border-b last:border-0 ${isClickable ? 'cursor-pointer hover:bg-muted/50' : ''}`}
                        onClick={isClickable ? () => onNavigate!(docNumber, jurisdiction) : undefined}
                      >
                        <td className="py-2 pr-4">
                          <Badge variant="outline" className="text-xs font-mono">{jurisdiction}</Badge>
                        </td>
                        <td className="py-2 pr-4 font-mono text-xs">{docNumber}</td>
                        <td className="py-2 font-mono text-xs">{kind}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
