'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { ODPApplication } from '@/services/usptoOdpApi';

interface PatentOverviewTabProps {
  data: ODPApplication | null;
  isLoading?: boolean;
}

function getStatusColor(statusDesc?: string): string {
  if (!statusDesc) return 'bg-neutral-500';
  const lower = statusDesc.toLowerCase();
  if (lower.includes('patent') || lower.includes('granted')) return 'bg-green-500';
  if (lower.includes('pending') || lower.includes('docketed')) return 'bg-blue-500';
  if (lower.includes('abandoned')) return 'bg-yellow-500';
  if (lower.includes('expired')) return 'bg-red-500';
  return 'bg-neutral-500';
}

export function PatentOverviewTab({ data, isLoading }: PatentOverviewTabProps) {
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
    return <p className="text-muted-foreground py-8 text-center">No application data available.</p>;
  }

  const meta = data.applicationMetaData || {};
  const statusDesc = meta.applicationStatusDescriptionText || 'Unknown';
  // Inventors may be at top-level or inside applicationMetaData depending on endpoint
  const inventors = (data.inventorBag?.length ? data.inventorBag : meta.inventorBag) || [];
  // Classifications: top-level classificationDataBag, or fall back to meta CPC/USPC
  let classifications = data.classificationDataBag || [];
  if (classifications.length === 0 && (meta.cpcClassificationBag || meta.uspcSymbolText)) {
    const cpcItems = (meta.cpcClassificationBag || []).map((sym: string) => ({
      classificationSymbolText: sym.trim(),
      _type: 'CPC',
    }));
    if (meta.uspcSymbolText) {
      cpcItems.push({ classificationSymbolText: meta.uspcSymbolText, _type: 'USPC' });
    }
    classifications = cpcItems;
  }

  const applicantName = meta.firstApplicantName || meta.applicantNameText;
  const applicants = meta.applicantBag || [];
  const entityStatus = meta.entityStatusData?.businessEntityStatusCategory;
  const correspondenceAddr = (data as any).correspondenceAddressBag?.[0];

  return (
    <div className="space-y-6">
      {/* Status & Key Dates */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Status & Key Dates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <span className={`h-2.5 w-2.5 rounded-full ${getStatusColor(statusDesc)}`} />
            <Badge variant="outline">{statusDesc}</Badge>
            {meta.applicationTypeLabelName && (
              <Badge variant="secondary">{meta.applicationTypeLabelName}</Badge>
            )}
            {entityStatus && (
              <Badge variant="secondary">{entityStatus}</Badge>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Filing Date</p>
              <p className="font-medium">{meta.filingDate || '---'}</p>
            </div>
            {meta.effectiveFilingDate && meta.effectiveFilingDate !== meta.filingDate && (
              <div>
                <p className="text-muted-foreground">Effective Filing Date</p>
                <p className="font-medium">{meta.effectiveFilingDate}</p>
              </div>
            )}
            <div>
              <p className="text-muted-foreground">Publication Date</p>
              <p className="font-medium">{meta.publicationDate || meta.earliestPublicationDate || '---'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Grant Date</p>
              <p className="font-medium">{meta.grantDate || '---'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Application Details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Application Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            {meta.earliestPublicationNumber && (
              <div>
                <p className="text-muted-foreground">Publication Number</p>
                <p className="font-medium font-mono">{meta.earliestPublicationNumber}</p>
              </div>
            )}
            {meta.examinerNameText && (
              <div>
                <p className="text-muted-foreground">Examiner</p>
                <p className="font-medium">{meta.examinerNameText}</p>
              </div>
            )}
            {meta.groupArtUnitNumber && (
              <div>
                <p className="text-muted-foreground">Art Unit</p>
                <p className="font-medium">{meta.groupArtUnitNumber}</p>
              </div>
            )}
            {meta.docketNumber && (
              <div>
                <p className="text-muted-foreground">Docket Number</p>
                <p className="font-medium font-mono">{meta.docketNumber}</p>
              </div>
            )}
            {meta.applicationConfirmationNumber && (
              <div>
                <p className="text-muted-foreground">Confirmation Number</p>
                <p className="font-medium">{meta.applicationConfirmationNumber}</p>
              </div>
            )}
            {meta.customerNumber && (
              <div>
                <p className="text-muted-foreground">Customer Number</p>
                <p className="font-medium">{meta.customerNumber}</p>
              </div>
            )}
            {meta.firstInventorToFileIndicator && (
              <div>
                <p className="text-muted-foreground">First Inventor to File</p>
                <p className="font-medium">{meta.firstInventorToFileIndicator === 'Y' || meta.firstInventorToFileIndicator === true ? 'Yes' : 'No'}</p>
              </div>
            )}
            {meta.nationalStageIndicator === true && (
              <div>
                <p className="text-muted-foreground">National Stage</p>
                <p className="font-medium">Yes</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Inventors */}
      {inventors.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Inventors ({inventors.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              {inventors.map((inv: any, i: number) => {
                const name = inv.inventorNameText || [inv.firstName, inv.middleName, inv.lastName].filter(Boolean).join(' ') || 'Unknown';
                const location = inv.correspondenceAddressBag?.[0];
                const city = location?.cityName;
                const region = location?.geographicRegionCode || location?.geographicRegionName;
                const country = location?.countryCode;
                const loc = [city, region, country].filter(Boolean).join(', ');
                return (
                  <div key={i} className="min-w-[200px]">
                    <p className="font-medium">{name}</p>
                    {loc && <p className="text-xs text-muted-foreground">{loc}</p>}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Applicant */}
      {(applicantName || applicants.length > 0) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Applicant</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {applicants.length > 0 ? (
              applicants.map((app: any, i: number) => {
                const addr = app.correspondenceAddressBag?.[0];
                const loc = addr ? [addr.cityName, addr.geographicRegionCode, addr.countryCode].filter(Boolean).join(', ') : '';
                return (
                  <div key={i} className="text-sm">
                    <p className="font-medium">{app.applicantNameText}</p>
                    {loc && <p className="text-xs text-muted-foreground">{loc}</p>}
                  </div>
                );
              })
            ) : (
              <p className="text-sm">{applicantName}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Classifications */}
      {classifications.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Classifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {classifications.map((cls: any, i: number) => {
                const symbol = cls.classificationSymbolText || cls.cpcClassificationSymbolText || cls.uspcClassificationSymbolText || JSON.stringify(cls);
                return (
                  <Badge key={i} variant="outline" className="text-xs">
                    {typeof symbol === 'string' ? symbol : JSON.stringify(symbol)}
                  </Badge>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invention Title */}
      {meta.inventionTitle && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Invention Title</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{meta.inventionTitle}</p>
          </CardContent>
        </Card>
      )}

      {/* Correspondence Address */}
      {correspondenceAddr && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Correspondence Address</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              {correspondenceAddr.nameLineOneText && <p className="font-medium">{correspondenceAddr.nameLineOneText}</p>}
              {correspondenceAddr.nameLineTwoText && <p>{correspondenceAddr.nameLineTwoText}</p>}
              {correspondenceAddr.addressLineOneText && <p>{correspondenceAddr.addressLineOneText}</p>}
              {correspondenceAddr.addressLineTwoText && <p>{correspondenceAddr.addressLineTwoText}</p>}
              <p>
                {[correspondenceAddr.cityName, correspondenceAddr.geographicRegionCode, correspondenceAddr.postalCode, correspondenceAddr.countryName].filter(Boolean).join(', ')}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lifecycle Events */}
      {(data as any).eventDataBag?.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Lifecycle Events ({(data as any).eventDataBag.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-[300px] overflow-auto space-y-2">
              {(data as any).eventDataBag
                .sort((a: any, b: any) => (b.eventDate || '').localeCompare(a.eventDate || ''))
                .map((evt: any, i: number) => (
                  <div key={i} className="flex items-start gap-3 text-sm">
                    <span className="text-muted-foreground whitespace-nowrap min-w-[90px]">{evt.eventDate || '---'}</span>
                    {evt.eventCode && <Badge variant="outline" className="text-xs shrink-0">{evt.eventCode}</Badge>}
                    <span>{evt.eventDescriptionText || '---'}</span>
                  </div>
                ))
              }
            </div>
          </CardContent>
        </Card>
      )}

      {/* Last Updated */}
      {(data as any).lastIngestionDateTime && (
        <p className="text-xs text-muted-foreground text-right">
          USPTO data last updated: {new Date((data as any).lastIngestionDateTime).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}
