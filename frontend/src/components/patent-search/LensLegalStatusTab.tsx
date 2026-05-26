'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react';
import type { LensPatent } from '@/services/lensApi';

interface LensLegalStatusTabProps {
  data: LensPatent | null;
  isLoading?: boolean;
}

function statusIcon(status?: string) {
  if (!status) return <Clock className="h-4 w-4 text-muted-foreground" />;
  const s = status.toLowerCase();
  if (s === 'active' || s === 'patented') return <CheckCircle2 className="h-4 w-4 text-green-500" />;
  if (s === 'pending') return <Clock className="h-4 w-4 text-blue-500" />;
  if (s === 'expired' || s === 'discontinued' || s === 'inactive') return <XCircle className="h-4 w-4 text-red-500" />;
  return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
}

export function LensLegalStatusTab({ data, isLoading }: LensLegalStatusTabProps) {
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

  const legal = data.legal_status;
  if (!legal) {
    return (
      <p className="text-muted-foreground py-8 text-center">
        No legal status data available for this patent.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Legal Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 mb-4">
            {statusIcon(legal.patent_status)}
            <Badge
              variant={legal.patent_status?.toLowerCase() === 'active' ? 'default' : 'outline'}
              className="text-sm"
            >
              {legal.patent_status || 'Unknown'}
            </Badge>
            {legal.granted && <Badge variant="secondary">Granted</Badge>}
            {legal.has_disclaimer && <Badge variant="outline">Has Disclaimer</Badge>}
            {legal.has_spc && <Badge variant="outline">SPC</Badge>}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Grant Date</p>
              <p className="font-medium">{legal.grant_date || '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Application Expiry</p>
              <p className="font-medium">{legal.application_expiry_date || '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Anticipated Term Date</p>
              <p className="font-medium">{legal.anticipated_term_date || '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Discontinuation Date</p>
              <p className="font-medium">{legal.discontinuation_date || '—'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calculation Log */}
      {legal.calculation_log && legal.calculation_log.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Status Calculation Log</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-sm font-mono text-muted-foreground">
              {legal.calculation_log.map((entry, i) => (
                <p key={i}>{entry}</p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
