'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import usptoOdpApi, { type ODPApplication, type ODPContinuity } from '@/services/usptoOdpApi';

interface PatentContinuityTabProps {
  appId: string;
  appData?: ODPApplication | null;
  onNavigate?: (appId: string) => void;
}

/** Normalize inline search continuity data to match the separate endpoint shape. */
function extractInlineContinuity(appData: ODPApplication): { parents: any[]; children: any[] } | null {
  const raw = appData as any;
  const parentBag = raw.parentContinuityBag;
  const childBag = raw.childContinuityBag;
  if (!parentBag && !childBag) return null;

  const parents = (parentBag || []).map((p: any) => ({
    applicationNumberText: p.parentApplicationNumberText,
    filingDate: p.parentApplicationFilingDate,
    continuityTypeText: p.claimParentageTypeCodeDescriptionText || p.claimParentageTypeCode,
    applicationStatusDescriptionText: p.parentApplicationStatusDescriptionText,
    patentNumber: p.parentPatentNumber,
  }));

  const children = (childBag || []).map((c: any) => ({
    applicationNumberText: c.childApplicationNumberText,
    filingDate: c.childApplicationFilingDate,
    continuityTypeText: c.claimParentageTypeCodeDescriptionText || c.claimParentageTypeCode,
    applicationStatusDescriptionText: c.childApplicationStatusDescriptionText,
  }));

  return { parents, children };
}

export function PatentContinuityTab({ appId, appData, onNavigate }: PatentContinuityTabProps) {
  const [data, setData] = useState<ODPContinuity | null>(null);
  const [inlineData, setInlineData] = useState<{ parents: any[]; children: any[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for inline data first
    if (appData) {
      const inline = extractInlineContinuity(appData);
      if (inline && (inline.parents.length > 0 || inline.children.length > 0)) {
        setInlineData(inline);
        setIsLoading(false);
        return;
      }
    }

    // Fall back to API call
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    usptoOdpApi.getContinuity(appId).then((res) => {
      if (cancelled) return;
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setError(res.error || 'Failed to load continuity data');
      }
      setIsLoading(false);
    });

    return () => { cancelled = true; };
  }, [appId, appData]);

  if (isLoading) {
    return <div className="space-y-3"><Skeleton className="h-40 w-full" /><Skeleton className="h-40 w-full" /></div>;
  }

  if (error) {
    return <p className="text-destructive py-4 text-center text-sm">{error}</p>;
  }

  const parents = inlineData?.parents || data?.parentApplicationBag || [];
  const children = inlineData?.children || data?.childApplicationBag || [];

  if (parents.length === 0 && children.length === 0) {
    return <p className="text-muted-foreground py-8 text-center">No continuity data available.</p>;
  }

  const renderTable = (title: string, items: any[]) => (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Application Number</TableHead>
              <TableHead>Filing Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, i) => {
              const appNum = item.applicationNumberText || item.parentApplicationNumberText || item.childApplicationNumberText || '---';
              return (
                <TableRow key={i}>
                  <TableCell>
                    {onNavigate ? (
                      <button
                        className="text-primary hover:underline font-medium"
                        onClick={() => onNavigate(appNum.replace(/[^0-9]/g, ''))}
                      >
                        {appNum}
                      </button>
                    ) : (
                      appNum
                    )}
                  </TableCell>
                  <TableCell>{item.filingDate || '---'}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {item.continuityTypeText || item.claimTypeLabelName || '---'}
                    </Badge>
                  </TableCell>
                  <TableCell>{item.applicationStatusDescriptionText || '---'}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {parents.length > 0 && renderTable('Parent Applications', parents)}
      {children.length > 0 && renderTable('Child Applications', children)}
    </div>
  );
}
