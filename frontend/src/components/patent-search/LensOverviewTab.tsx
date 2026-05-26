'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { LensPatent } from '@/services/lensApi';
import { lensText, lensApplicantName, lensInventorNames, lensPublicationNumber } from '@/services/lensApi';

interface LensOverviewTabProps {
  data: LensPatent | null;
  isLoading?: boolean;
}

function getStatusColor(status?: string): string {
  if (!status) return 'bg-neutral-500';
  const lower = status.toLowerCase();
  if (lower === 'active' || lower === 'patented') return 'bg-green-500';
  if (lower === 'pending') return 'bg-blue-500';
  if (lower === 'discontinued' || lower === 'inactive') return 'bg-yellow-500';
  if (lower === 'expired') return 'bg-red-500';
  return 'bg-neutral-500';
}

export function LensOverviewTab({ data, isLoading }: LensOverviewTabProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (!data) {
    return <p className="text-muted-foreground py-8 text-center">No patent data available.</p>;
  }

  const biblio = data.biblio || {};
  const parties = biblio.parties || {};
  const legal = data.legal_status || {};
  const title = lensText(biblio.invention_title);
  const abstract = lensText(data.abstract);
  const applicant = lensApplicantName(data);
  const inventors = lensInventorNames(data);
  const pubNumber = lensPublicationNumber(data);
  const patentStatus = legal.patent_status || 'Unknown';

  const ipcClassifications = biblio.classifications_ipcr?.classifications || [];
  const cpcClassifications = biblio.classifications_cpc?.classifications || [];

  const appRef = biblio.application_reference;
  const earliestPriority = biblio.priority_claims?.earliest_claim?.date;

  return (
    <div className="space-y-6">
      {/* Status & Key Dates */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Status & Key Dates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <span className={`h-2.5 w-2.5 rounded-full ${getStatusColor(patentStatus)}`} />
            <Badge variant="outline">{patentStatus}</Badge>
            {data.publication_type && (
              <Badge variant="secondary">{data.publication_type.replace(/_/g, ' ')}</Badge>
            )}
            <Badge variant="secondary">{data.jurisdiction}</Badge>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Publication Date</p>
              <p className="font-medium">{data.date_published || '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Filing Date</p>
              <p className="font-medium">{appRef?.date || '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Grant Date</p>
              <p className="font-medium">{legal.grant_date || '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Priority Date</p>
              <p className="font-medium">{earliestPriority || '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Publication Number</p>
              <p className="font-mono text-xs font-medium">{pubNumber || '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Application Number</p>
              <p className="font-mono text-xs font-medium">{biblio.application_number || appRef?.doc_number || '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Lens ID</p>
              <p className="font-mono text-xs font-medium">{data.lens_id || '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Language</p>
              <p className="font-medium">{data.lang?.toUpperCase() || '—'}</p>
            </div>
          </div>
          {legal.application_expiry_date && (
            <div className="mt-3 text-sm">
              <span className="text-muted-foreground">Expected Expiry: </span>
              <span className="font-medium">{legal.application_expiry_date}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Title & Abstract */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Title & Abstract</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {title && <h3 className="font-semibold">{title}</h3>}
          {abstract ? (
            <p className="text-sm text-muted-foreground leading-relaxed">{abstract}</p>
          ) : (
            <p className="text-sm text-muted-foreground italic">No abstract available.</p>
          )}
        </CardContent>
      </Card>

      {/* Applicants & Inventors */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Parties</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Applicants */}
          <div>
            <p className="text-sm font-medium mb-1">Applicants</p>
            {(parties.applicants?.length ?? 0) > 0 ? (
              <div className="space-y-1">
                {parties.applicants!.map((a, i) => (
                  <div key={i} className="text-sm flex items-center gap-2">
                    <span>{a.extracted_name?.value || '—'}</span>
                    {a.residence && (
                      <Badge variant="outline" className="text-xs">{a.residence}</Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">—</p>
            )}
          </div>

          {/* Inventors */}
          <div>
            <p className="text-sm font-medium mb-1">Inventors</p>
            {inventors.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {inventors.map((name, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">{name}</Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">—</p>
            )}
          </div>

          {/* Owners */}
          {(parties.owners_all?.length ?? 0) > 0 && (
            <div>
              <p className="text-sm font-medium mb-1">Current Owners</p>
              <div className="space-y-1">
                {parties.owners_all!.map((o, i) => (
                  <div key={i} className="text-sm flex items-center gap-2">
                    <span>{o.extracted_name?.value || '—'}</span>
                    {o.extracted_country && (
                      <Badge variant="outline" className="text-xs">{o.extracted_country}</Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Classifications */}
      {(ipcClassifications.length > 0 || cpcClassifications.length > 0) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Classifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {ipcClassifications.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-1">IPC</p>
                <div className="flex flex-wrap gap-1.5">
                  {ipcClassifications.map((c, i) => (
                    <Badge key={i} variant="outline" className="font-mono text-xs">
                      {c.symbol}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {cpcClassifications.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-1">CPC</p>
                <div className="flex flex-wrap gap-1.5">
                  {cpcClassifications.map((c, i) => (
                    <Badge key={i} variant="outline" className="font-mono text-xs">
                      {c.symbol}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
