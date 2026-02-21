'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import usptoOdpApi, { type ODPForeignPriority } from '@/services/usptoOdpApi';

interface PatentForeignPriorityTabProps {
  appId: string;
}

export function PatentForeignPriorityTab({ appId }: PatentForeignPriorityTabProps) {
  const [data, setData] = useState<ODPForeignPriority | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    usptoOdpApi.getForeignPriority(appId).then((res) => {
      if (cancelled) return;
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setError(res.error || 'Failed to load foreign priority data');
      }
      setIsLoading(false);
    });

    return () => { cancelled = true; };
  }, [appId]);

  if (isLoading) {
    return <Skeleton className="h-40 w-full" />;
  }

  if (error) {
    return <p className="text-destructive py-4 text-center text-sm">{error}</p>;
  }

  const priorities = data?.foreignPriorityBag || [];

  if (priorities.length === 0) {
    return <p className="text-muted-foreground py-8 text-center">No foreign priority claims.</p>;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Foreign Priority Claims</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Country</TableHead>
              <TableHead>Application Number</TableHead>
              <TableHead>Filing Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {priorities.map((p: any, i: number) => (
              <TableRow key={i}>
                <TableCell>{p.countryCode || p.countryName || '---'}</TableCell>
                <TableCell className="font-mono text-sm">{p.applicationNumberText || '---'}</TableCell>
                <TableCell>{p.filingDate || '---'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
