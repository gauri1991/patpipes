'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ShieldCheck, MapPin, Building2, ExternalLink, Loader2 } from 'lucide-react';
import usptoOdpApi, { type ODPApplication, type ODPAttorney } from '@/services/usptoOdpApi';
import { attorneyApi } from '@/services/attorneyApi';

interface PatentAttorneyTabProps {
  appId: string;
  appData?: ODPApplication | null;
}

function getAttorneyName(atty: any): string {
  return atty.attorneyNameText
    || [atty.firstName, atty.middleName, atty.lastName].filter(Boolean).join(' ')
    || '---';
}

/**
 * Popover that fetches and displays attorney info from our network
 * when a registration number is clicked.
 */
function RegCodePopover({ regNumber }: { regNumber: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [attorney, setAttorney] = useState<any>(null);
  const [notFound, setNotFound] = useState(false);
  const [fetched, setFetched] = useState(false);

  const fetchAttorney = useCallback(async () => {
    if (fetched) return;
    setLoading(true);
    setNotFound(false);
    try {
      const response = await attorneyApi.getAttorneys({
        search: regNumber,
        limit: 1,
      });
      if (response.success && response.data) {
        const results = Array.isArray(response.data)
          ? response.data
          : (response.data as any).results ?? [];
        // Match exact registration_number
        const match = results.find(
          (a: any) => a.registration_number === regNumber
        );
        if (match) {
          setAttorney(match);
        } else {
          setNotFound(true);
        }
      } else {
        setNotFound(true);
      }
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
      setFetched(true);
    }
  }, [regNumber, fetched]);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && !fetched) {
      fetchAttorney();
    }
  };

  const initials = attorney
    ? `${(attorney.first_name || '')[0] || ''}${(attorney.last_name || '')[0] || ''}`.toUpperCase()
    : '';

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer font-medium"
          aria-label={`View attorney with registration number ${regNumber}`}
        >
          {regNumber}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {!loading && notFound && (
          <div className="p-4 text-center">
            <p className="text-sm text-muted-foreground">
              Reg. No. <span className="font-medium">{regNumber}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">Not found in attorney network</p>
          </div>
        )}

        {!loading && attorney && (
          <div className="p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="text-sm">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm truncate">{attorney.full_name}</p>
                  {attorney.source === 'uspto_roster' && (
                    <ShieldCheck className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" />
                  )}
                </div>
                {attorney.title && (
                  <p className="text-xs text-muted-foreground truncate">{attorney.title}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Reg. No. {attorney.registration_number}
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              {attorney.law_firm_name && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="truncate">{attorney.law_firm_name}</span>
                </div>
              )}
              {(attorney.city || attorney.state || attorney.country) && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>{[attorney.city, attorney.state, attorney.country].filter(Boolean).join(', ')}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {attorney.practitioner_type && (
                <Badge variant="secondary" className="text-xs">
                  {attorney.practitioner_type === 'ATTORNEY' ? 'Patent Attorney' : attorney.practitioner_type === 'AGENT' ? 'Patent Agent' : attorney.practitioner_type}
                </Badge>
              )}
              {attorney.source === 'uspto_roster' && (
                <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-400 text-xs gap-1">
                  <ShieldCheck className="h-3 w-3" /> USPTO Verified
                </Badge>
              )}
            </div>

            <Link
              href={`/dashboard/attorney/${attorney.id}`}
              className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline pt-1"
            >
              View Full Profile <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

function AttorneyTable({ title, attorneys }: { title: string; attorneys: any[] }) {
  if (attorneys.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title} ({attorneys.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Registration Number</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {attorneys.map((atty: any, i: number) => (
              <TableRow key={i}>
                <TableCell className="font-medium">{getAttorneyName(atty)}</TableCell>
                <TableCell>
                  {atty.registrationNumber ? (
                    <RegCodePopover regNumber={atty.registrationNumber} />
                  ) : (
                    '---'
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-xs">
                    {atty.registeredPractitionerCategory === 'AGENT' ? 'Agent' : 'Attorney'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {atty.activeIndicator === 'ACTIVE' || atty.activeIndicator === true ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export function PatentAttorneyTab({ appId, appData }: PatentAttorneyTabProps) {
  const [data, setData] = useState<ODPAttorney | null>(null);
  const [inlineRecord, setInlineRecord] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for inline data first
    const record = (appData as any)?.recordAttorney;
    if (record && (record.attorneyBag?.length || record.powerOfAttorneyBag?.length)) {
      setInlineRecord(record);
      setIsLoading(false);
      return;
    }

    // Fall back to API call
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    usptoOdpApi.getAttorney(appId).then((res) => {
      if (cancelled) return;
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setError(res.error || 'Failed to load attorney data');
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

  // From inline data: separate powerOfAttorneyBag and attorneyBag
  if (inlineRecord) {
    const poa = inlineRecord.powerOfAttorneyBag || [];
    const attorneys = inlineRecord.attorneyBag || [];
    if (poa.length === 0 && attorneys.length === 0) {
      return <p className="text-muted-foreground py-8 text-center">No attorney data available.</p>;
    }
    return (
      <div className="space-y-6">
        <AttorneyTable title="Power of Attorney" attorneys={poa} />
        <AttorneyTable title="Attorney / Agent of Record" attorneys={attorneys} />
      </div>
    );
  }

  // From separate endpoint
  const attorneys = data?.attorneyBag || [];
  if (attorneys.length === 0) {
    return <p className="text-muted-foreground py-8 text-center">No attorney data available.</p>;
  }

  return <AttorneyTable title="Attorney / Agent Information" attorneys={attorneys} />;
}
