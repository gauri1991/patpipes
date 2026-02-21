'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, Scale, FileText, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { infringementApi } from '@/services/infringementApi';
import { usptoOdpApi } from '@/services/usptoOdpApi';
import { formatDate } from '@/domains/infringement/utils';

interface PtabTabProps {
  caseId: string;
  patentNumber: string;
}

interface Proceeding {
  trialNumber?: string;
  prosecutionStatus?: string;
  filingDate?: string;
  accordedFilingDate?: string;
  institutionDecisionDate?: string;
  petitionerPartyName?: string;
  patentOwnerName?: string;
  inventorName?: string;
  patentNumber?: string;
  applicationNumber?: string;
  proceedingTypeCategory?: string;
  lastModifiedDateTime?: string;
  [key: string]: any;
}

interface Decision {
  trialNumber?: string;
  decisionTypeCategory?: string;
  documentName?: string;
  issueDate?: string;
  subdecisionTypeCategory?: string;
  [key: string]: any;
}

export function PtabTab({ caseId, patentNumber }: PtabTabProps) {
  const [proceedings, setProceedings] = useState<Proceeding[]>([]);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPtab = async () => {
      setLoading(true);
      setError(null);

      try {
        // Try backend endpoints first
        const [procRes, decRes] = await Promise.all([
          infringementApi.getPtabProceedings(caseId).catch(() => null),
          infringementApi.getPtabDecisions(caseId).catch(() => null),
        ]);

        let procData: Proceeding[] = [];
        let decData: Decision[] = [];

        if (procRes?.success && procRes.data) {
          const d = procRes.data as any;
          procData = Array.isArray(d) ? d : d.results || d.proceedings || [];
        }
        if (decRes?.success && decRes.data) {
          const d = decRes.data as any;
          decData = Array.isArray(d) ? d : d.results || d.decisions || [];
        }

        // Fallback: search ODP trials by patent number if backend returned nothing
        if (procData.length === 0 && patentNumber) {
          try {
            const cleanNumber = patentNumber.replace(/^US/i, '').replace(/[,\s]/g, '');
            const odpProc = await usptoOdpApi.searchProceedings({ patentNumber: cleanNumber });
            if (odpProc.success && odpProc.data) {
              procData = odpProc.data.results || [];
            }
          } catch {
            // optional
          }
        }

        if (decData.length === 0 && patentNumber) {
          try {
            const cleanNumber = patentNumber.replace(/^US/i, '').replace(/[,\s]/g, '');
            const odpDec = await usptoOdpApi.searchDecisions({ patentNumber: cleanNumber });
            if (odpDec.success && odpDec.data) {
              decData = odpDec.data.results || [];
            }
          } catch {
            // optional
          }
        }

        setProceedings(procData);
        setDecisions(decData);
      } catch (err) {
        setError('Failed to load PTAB data');
      } finally {
        setLoading(false);
      }
    };

    fetchPtab();
  }, [caseId, patentNumber]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
        <p className="text-muted-foreground mt-2">Loading PTAB data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  const hasNoData = proceedings.length === 0 && decisions.length === 0;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-lg">PTAB Proceedings & Decisions</h3>
        <p className="text-sm text-muted-foreground">
          Patent Trial and Appeal Board activity for {patentNumber || 'this patent'}
        </p>
      </div>

      {hasNoData ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Scale className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No PTAB Activity Found</h3>
            <p className="text-muted-foreground">
              No proceedings or decisions were found for patent {patentNumber || 'N/A'}.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Proceedings */}
          {proceedings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Proceedings ({proceedings.length})</CardTitle>
                <CardDescription>Active and historical PTAB proceedings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="p-3 text-left text-sm font-semibold">Trial Number</th>
                        <th className="p-3 text-left text-sm font-semibold">Type</th>
                        <th className="p-3 text-left text-sm font-semibold">Status</th>
                        <th className="p-3 text-left text-sm font-semibold">Petitioner</th>
                        <th className="p-3 text-left text-sm font-semibold">Patent Owner</th>
                        <th className="p-3 text-left text-sm font-semibold">Filing Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {proceedings.map((proc, idx) => (
                        <tr key={proc.trialNumber || idx} className="border-b hover:bg-muted/30">
                          <td className="p-3">
                            <span className="font-mono text-sm">{proc.trialNumber || 'N/A'}</span>
                          </td>
                          <td className="p-3">
                            <Badge variant="outline">
                              {proc.proceedingTypeCategory || 'N/A'}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <Badge variant="secondary">
                              {proc.prosecutionStatus || 'N/A'}
                            </Badge>
                          </td>
                          <td className="p-3 text-sm">{proc.petitionerPartyName || 'N/A'}</td>
                          <td className="p-3 text-sm">{proc.patentOwnerName || 'N/A'}</td>
                          <td className="p-3 text-sm">{formatDate(proc.filingDate || proc.accordedFilingDate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Decisions */}
          {decisions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Decisions ({decisions.length})</CardTitle>
                <CardDescription>PTAB decisions and outcomes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="p-3 text-left text-sm font-semibold">Trial Number</th>
                        <th className="p-3 text-left text-sm font-semibold">Decision Type</th>
                        <th className="p-3 text-left text-sm font-semibold">Sub-Type</th>
                        <th className="p-3 text-left text-sm font-semibold">Document</th>
                        <th className="p-3 text-left text-sm font-semibold">Issue Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {decisions.map((dec, idx) => (
                        <tr key={`${dec.trialNumber}-${idx}`} className="border-b hover:bg-muted/30">
                          <td className="p-3">
                            <span className="font-mono text-sm">{dec.trialNumber || 'N/A'}</span>
                          </td>
                          <td className="p-3">
                            <Badge variant="outline">{dec.decisionTypeCategory || 'N/A'}</Badge>
                          </td>
                          <td className="p-3 text-sm">{dec.subdecisionTypeCategory || 'N/A'}</td>
                          <td className="p-3 text-sm">{dec.documentName || 'N/A'}</td>
                          <td className="p-3 text-sm">{formatDate(dec.issueDate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
