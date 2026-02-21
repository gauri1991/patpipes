'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import usptoOdpApi, { type ODPApplication, type ODPTermAdjustment } from '@/services/usptoOdpApi';

interface PatentAdjustmentTabProps {
  appId: string;
  appData?: ODPApplication | null;
}

export function PatentAdjustmentTab({ appId, appData }: PatentAdjustmentTabProps) {
  const [data, setData] = useState<ODPTermAdjustment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for inline data first
    const inlinePta = (appData as any)?.patentTermAdjustmentData;
    if (inlinePta) {
      setData(inlinePta);
      setIsLoading(false);
      return;
    }

    // Fall back to API call
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    usptoOdpApi.getTermAdjustment(appId).then((res) => {
      if (cancelled) return;
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setError(res.error || 'Failed to load adjustment data');
      }
      setIsLoading(false);
    });

    return () => { cancelled = true; };
  }, [appId, appData]);

  if (isLoading) {
    return <Skeleton className="h-40 w-full" />;
  }

  if (error) {
    return <p className="text-destructive py-4 text-center text-sm">{error}</p>;
  }

  if (!data) {
    return <p className="text-muted-foreground py-8 text-center">No PTA/PTE data available.</p>;
  }

  const adjustmentData = data.patentTermAdjustmentData || data;
  const aDelay = adjustmentData.aDelayQuantity ?? adjustmentData.categoryADays ?? '---';
  const bDelay = adjustmentData.bDelayQuantity ?? adjustmentData.categoryBDays ?? '---';
  const cDelay = adjustmentData.cDelayQuantity ?? adjustmentData.categoryCDays ?? '---';
  const overlap = adjustmentData.overlappingDayQuantity ?? adjustmentData.overlapQuantity ?? adjustmentData.overlapDays ?? '---';
  const total = adjustmentData.adjustmentTotalQuantity ?? adjustmentData.totalAdjustmentDays ?? adjustmentData.ipOfficeDelayQuantity ?? adjustmentData.totalDays ?? '---';
  const applicantDelay = adjustmentData.applicantDayDelayQuantity;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Patent Term Adjustment (PTA/PTE)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Category A Delay</p>
              <p className="text-2xl font-semibold">{aDelay}<span className="text-sm font-normal text-muted-foreground ml-1">days</span></p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Category B Delay</p>
              <p className="text-2xl font-semibold">{bDelay}<span className="text-sm font-normal text-muted-foreground ml-1">days</span></p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Category C Delay</p>
              <p className="text-2xl font-semibold">{cDelay}<span className="text-sm font-normal text-muted-foreground ml-1">days</span></p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Overlap</p>
              <p className="text-2xl font-semibold">{overlap}<span className="text-sm font-normal text-muted-foreground ml-1">days</span></p>
            </div>
            {applicantDelay != null && (
              <div>
                <p className="text-sm text-muted-foreground">Applicant Delay</p>
                <p className="text-2xl font-semibold">{applicantDelay}<span className="text-sm font-normal text-muted-foreground ml-1">days</span></p>
              </div>
            )}
            <div className="col-span-2 sm:col-span-1">
              <p className="text-sm text-muted-foreground">Total Adjustment</p>
              <p className="text-2xl font-bold text-primary">{total}<span className="text-sm font-normal text-muted-foreground ml-1">days</span></p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
