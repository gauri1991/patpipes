'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ExternalLink } from 'lucide-react';
import usptoOdpApi, { type ODPApplication, type ODPAssignment } from '@/services/usptoOdpApi';

interface PatentAssignmentTabProps {
  appId: string;
  appData?: ODPApplication | null;
}

export function PatentAssignmentTab({ appId, appData }: PatentAssignmentTabProps) {
  const [data, setData] = useState<ODPAssignment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for inline data first
    const inlineAssignments = (appData as any)?.assignmentBag;
    if (inlineAssignments && inlineAssignments.length > 0) {
      setData({ assignmentBag: inlineAssignments });
      setIsLoading(false);
      return;
    }

    // Fall back to API call
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    usptoOdpApi.getAssignment(appId).then((res) => {
      if (cancelled) return;
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setError(res.error || 'Failed to load assignment data');
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

  const assignments = data?.assignmentBag || [];

  if (assignments.length === 0) {
    return <p className="text-muted-foreground py-8 text-center">No assignment data available.</p>;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Assignment History ({assignments.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Assignor</TableHead>
              <TableHead>Assignee</TableHead>
              <TableHead>Conveyance</TableHead>
              <TableHead>Reel / Frame</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assignments.map((a: any, i: number) => (
              <TableRow key={i}>
                <TableCell className="whitespace-nowrap">{a.assignmentRecordedDate || a.recordedDate || a.executionDate || '---'}</TableCell>
                <TableCell>{a.assignorBag?.map((x: any) => x.assignorNameText || x.assignorName).filter(Boolean).join(', ') || '---'}</TableCell>
                <TableCell>{a.assigneeBag?.map((x: any) => x.assigneeNameText).join(', ') || '---'}</TableCell>
                <TableCell className="text-xs max-w-[200px] truncate" title={a.conveyanceText}>
                  {a.conveyanceText || '---'}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {a.reelAndFrameNumber || (a.reelNumber && a.frameNumber ? `${a.reelNumber}/${a.frameNumber}` : '---')}
                </TableCell>
                <TableCell>
                  {a.assignmentDocumentLocationURI && (
                    <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                      <a href={a.assignmentDocumentLocationURI} target="_blank" rel="noopener noreferrer" aria-label="View assignment document">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
