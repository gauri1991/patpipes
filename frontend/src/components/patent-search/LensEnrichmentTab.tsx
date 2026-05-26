'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Globe, AlertCircle, Loader2, Sparkles, CheckCircle2, XCircle } from 'lucide-react';
import lensApi from '@/services/lensApi';
import type { LensPatent, LensFamilyMember } from '@/services/lensApi';
import { lensText, lensPublicationNumber } from '@/services/lensApi';
import familyAnalysisApi from '@/services/familyAnalysisApi';
import type { FamilyAnalysisResult } from '@/services/familyAnalysisApi';

interface LensEnrichmentTabProps {
  /** US patent number from ODP (e.g. "11301943") */
  patentNumber: string;
  /** Called when user clicks a family member or citation to navigate. */
  onNavigate?: (query: string) => void;
  /** Pre-fetched Lens data from shared enrichment state (avoids duplicate API call). */
  prefetchedData?: LensPatent | null;
  /** Whether the shared enrichment fetch is still loading. */
  prefetchedLoading?: boolean;
}

function FamilyMiniTable({
  members,
  onNavigate,
}: {
  members: LensFamilyMember[];
  onNavigate?: (query: string) => void;
}) {
  if (members.length === 0) {
    return <p className="text-sm text-muted-foreground">No members found.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="pb-2 pr-4 font-medium text-muted-foreground">Jurisdiction</th>
            <th className="pb-2 pr-4 font-medium text-muted-foreground">Doc Number</th>
            <th className="pb-2 pr-4 font-medium text-muted-foreground">Kind</th>
            <th className="pb-2 font-medium text-muted-foreground">Date</th>
          </tr>
        </thead>
        <tbody>
          {members.map((m, i) => {
            const doc = m.document_id;
            const jur = doc?.jurisdiction || '';
            const num = doc?.doc_number || '';
            const kind = doc?.kind || '';
            const clickable = !!onNavigate && !!jur && !!num;

            return (
              <tr
                key={m.lens_id || i}
                className={`border-b last:border-0 ${clickable ? 'cursor-pointer hover:bg-muted/50' : ''}`}
                onClick={clickable ? () => onNavigate!(`${jur}${num}${kind}`) : undefined}
              >
                <td className="py-1.5 pr-4">
                  <Badge variant="outline" className="text-xs font-mono">{jur}</Badge>
                </td>
                <td className="py-1.5 pr-4 font-mono text-xs">{num}</td>
                <td className="py-1.5 pr-4 font-mono text-xs">{kind}</td>
                <td className="py-1.5 text-muted-foreground text-xs">{doc?.date || '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function LensEnrichmentTab({ patentNumber, onNavigate, prefetchedData, prefetchedLoading }: LensEnrichmentTabProps) {
  const [lensData, setLensData] = useState<LensPatent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Use prefetched data if available
    if (prefetchedData !== undefined) {
      if (prefetchedData) {
        setLensData(prefetchedData);
        setIsLoading(false);
        setError(null);
      } else if (!prefetchedLoading) {
        setIsLoading(false);
        setError('Patent not found in Lens.org database.');
      } else {
        setIsLoading(true);
      }
      return;
    }

    // Fallback: fetch own data
    if (!patentNumber) return;

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    lensApi
      .getPatentByDocNumber(patentNumber, 'US')
      .then((res) => {
        if (cancelled) return;
        if (res.success && res.data?.patent) {
          setLensData(res.data.patent);
        } else {
          setError('Patent not found in Lens.org database.');
        }
      })
      .catch(() => {
        if (!cancelled) setError('Failed to fetch Lens.org data.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [patentNumber, prefetchedData, prefetchedLoading]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Globe className="h-4 w-4 animate-pulse" />
          Fetching global patent data from Lens.org...
        </div>
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (error || !lensData) {
    return (
      <div className="flex items-center gap-2 py-8 justify-center text-muted-foreground">
        <AlertCircle className="h-4 w-4" />
        <span>{error || 'No Lens.org data available for this patent.'}</span>
      </div>
    );
  }

  const families = lensData.families;
  const simple = families?.simple_family;
  const extended = families?.extended_family;
  const refs = lensData.biblio?.references_cited;
  const citedBy = lensData.biblio?.cited_by;
  const legal = lensData.legal_status;

  const patentCitationCount = refs?.patent_count ?? 0;
  const nplCount = refs?.npl_count ?? 0;
  const citedByCount = citedBy?.patents?.length ?? 0;

  return (
    <div className="space-y-6">
      {/* Source badge */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Globe className="h-4 w-4" />
        <span>Global data from Lens.org</span>
        <Badge variant="outline" className="font-mono text-xs">{lensData.lens_id}</Badge>
      </div>

      {/* Patent Family */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">Patent Family</CardTitle>
            {simple?.size != null && (
              <Badge variant="secondary">Simple: {simple.size}</Badge>
            )}
            {extended?.size != null && (
              <Badge variant="secondary">Extended: {extended.size}</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {simple && simple.members && simple.members.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Simple Family</p>
              <FamilyMiniTable members={simple.members} onNavigate={onNavigate} />
            </div>
          )}
          {extended && extended.members && extended.members.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Extended Family</p>
              <FamilyMiniTable members={extended.members} onNavigate={onNavigate} />
            </div>
          )}
          {(!simple?.members?.length && !extended?.members?.length) && (
            <p className="text-sm text-muted-foreground">No family data available.</p>
          )}
        </CardContent>
      </Card>

      {/* Global Legal Status */}
      {legal && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Global Legal Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Status</p>
                <Badge variant={legal.patent_status?.toLowerCase() === 'active' ? 'default' : 'outline'}>
                  {legal.patent_status || 'Unknown'}
                </Badge>
              </div>
              <div>
                <p className="text-muted-foreground">Grant Date</p>
                <p className="font-medium">{legal.grant_date || '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Expiry</p>
                <p className="font-medium">{legal.application_expiry_date || '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Discontinuation</p>
                <p className="font-medium">{legal.discontinuation_date || '—'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Citations Summary */}
      {(patentCitationCount > 0 || nplCount > 0 || citedByCount > 0) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Citations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3 mb-4">
              <Badge variant="outline">{patentCitationCount} Patent References</Badge>
              <Badge variant="outline">{nplCount} NPL References</Badge>
              <Badge variant="outline">{citedByCount} Cited By</Badge>
            </div>

            {/* Top cited-by patents */}
            {citedBy?.patents && citedBy.patents.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Cited By (top {Math.min(citedBy.patents.length, 10)})</p>
                <div className="flex flex-wrap gap-1.5">
                  {citedBy.patents.slice(0, 10).map((p, i) => {
                    const doc = p.document_id;
                    const display = `${doc?.jurisdiction || ''}${doc?.doc_number || ''}${doc?.kind || ''}`;
                    const clickable = !!onNavigate && !!doc?.doc_number && !!doc?.jurisdiction;
                    return (
                      <Badge
                        key={p.lens_id || i}
                        variant="secondary"
                        className={`font-mono text-xs ${clickable ? 'cursor-pointer hover:bg-primary/20' : ''}`}
                        onClick={clickable ? () => onNavigate!(display) : undefined}
                      >
                        {display}
                      </Badge>
                    );
                  })}
                  {citedBy.patents.length > 10 && (
                    <Badge variant="outline" className="text-xs">
                      +{citedBy.patents.length - 10} more
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Family Analysis ── */}
      {((simple?.size ?? 0) >= 2 || (extended?.size ?? 0) >= 2) && (
        <FamilyAnalysisSection lensId={lensData.lens_id} familySize={simple?.size ?? extended?.size ?? 0} />
      )}
    </div>
  );
}

// ── Family Analysis Sub-Component ──

function FamilyAnalysisSection({ lensId, familySize }: { lensId: string; familySize: number }) {
  const [result, setResult] = useState<FamilyAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [deepLoading, setDeepLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runQuickAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await familyAnalysisApi.analyze({
        lens_id: lensId,
        family_type: 'simple',
        analysis_mode: 'quick',
      });
      if (res.success && res.data) {
        setResult(res.data);
      } else {
        setError(res.error || 'Analysis failed');
      }
    } catch {
      setError('Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const runDeepAnalysis = async () => {
    setDeepLoading(true);
    setError(null);
    try {
      const res = await familyAnalysisApi.analyze({
        lens_id: lensId,
        family_type: 'simple',
        analysis_mode: 'deep',
        model: 'sonnet',
      });
      if (res.success && res.data) {
        setResult(res.data);
      } else {
        setError(res.error || 'Deep analysis failed');
      }
    } catch {
      setError('Deep analysis failed. Check your LLM API key configuration.');
    } finally {
      setDeepLoading(false);
    }
  };

  if (!result && !loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">Family Claim Analysis</CardTitle>
            <Badge variant="secondary">{familySize} members</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Compare claims across family members to identify scope differences, unique elements, and coverage gaps.
          </p>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button onClick={runQuickAnalysis} disabled={loading} size="sm">
            <Sparkles className="h-4 w-4 mr-2" />
            Analyze Family Claims
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Fetching and analyzing family claims...</p>
        </CardContent>
      </Card>
    );
  }

  if (!result) return null;

  return (
    <div className="space-y-4">
      {/* Analysis Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">Family Claim Analysis</CardTitle>
              <Badge variant={result.analysis_mode === 'deep' ? 'default' : 'secondary'}>
                {result.analysis_mode === 'deep' ? 'Deep (LLM)' : 'Quick'}
              </Badge>
              <Badge variant="outline">{result.family_size} members</Badge>
              {result.processing_time_seconds != null && (
                <span className="text-xs text-muted-foreground">{result.processing_time_seconds}s</span>
              )}
            </div>
            {result.analysis_mode === 'quick' && (
              <Button onClick={runDeepAnalysis} disabled={deepLoading} size="sm" variant="outline" className="gap-1.5">
                {deepLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                Run Deep Analysis
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Strategic Summary (deep mode) */}
      {result.strategic_summary && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Strategic Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">{result.strategic_summary}</p>
          </CardContent>
        </Card>
      )}

      {/* Claim Scope Comparison */}
      {result.claim_scope.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Claim Scope Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 pr-4 font-medium text-muted-foreground">Jurisdiction</th>
                    <th className="pb-2 pr-4 font-medium text-muted-foreground">Doc #</th>
                    <th className="pb-2 pr-4 font-medium text-muted-foreground text-center">Indep.</th>
                    <th className="pb-2 pr-4 font-medium text-muted-foreground text-center">Total</th>
                    <th className="pb-2 pr-4 font-medium text-muted-foreground text-center">Avg Length</th>
                    <th className="pb-2 pr-4 font-medium text-muted-foreground">Broadness</th>
                    <th className="pb-2 font-medium text-muted-foreground">Broadest Claim</th>
                  </tr>
                </thead>
                <tbody>
                  {result.claim_scope.map((entry, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2 pr-4">
                        <Badge variant="outline" className="font-mono text-xs">{entry.jurisdiction}</Badge>
                      </td>
                      <td className="py-2 pr-4 font-mono text-xs">{entry.doc_number}</td>
                      <td className="py-2 pr-4 text-center">{entry.independent_claim_count}</td>
                      <td className="py-2 pr-4 text-center">{entry.total_claim_count}</td>
                      <td className="py-2 pr-4 text-center text-muted-foreground">{entry.avg_claim_length} words</td>
                      <td className="py-2 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                entry.broadness_score >= 70 ? 'bg-green-500' :
                                entry.broadness_score >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${entry.broadness_score}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">{entry.broadness_score}</span>
                        </div>
                      </td>
                      <td className="py-2 text-xs text-muted-foreground max-w-xs truncate">
                        {entry.broadest_claim_preview?.slice(0, 100)}...
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {result.claim_scope.length > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                Higher broadness score = broader claim scope (fewer limitations).
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Distinction Mapping */}
      {result.distinctions.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Distinction Mapping</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {result.distinctions.map((d, i) => (
                <div key={i} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-xs">{d.jurisdiction}</Badge>
                    <span className="text-xs font-mono text-muted-foreground">{d.doc_number}</span>
                  </div>
                  {d.description && <p className="text-sm">{d.description}</p>}
                  {d.unique_elements.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Unique elements:</p>
                      <div className="flex flex-wrap gap-1">
                        {d.unique_elements.slice(0, 8).map((el, j) => (
                          <Badge key={j} variant="secondary" className="text-[10px]">{el}</Badge>
                        ))}
                        {d.unique_elements.length > 8 && (
                          <Badge variant="outline" className="text-[10px]">+{d.unique_elements.length - 8}</Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Coverage Matrix */}
      {result.coverage_matrix.elements.length > 0 && result.coverage_matrix.jurisdictions.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Coverage Matrix</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="pb-2 pr-3 text-left font-medium text-muted-foreground">Element</th>
                    {result.coverage_matrix.jurisdictions.map((jur) => (
                      <th key={jur} className="pb-2 px-2 text-center font-medium text-muted-foreground">
                        {jur}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.coverage_matrix.elements.map((el, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-1.5 pr-3 text-muted-foreground max-w-[200px] truncate" title={el}>
                        {el}
                      </td>
                      {result.coverage_matrix.matrix[i]?.map((cell, j) => (
                        <td key={j} className="py-1.5 px-2 text-center">
                          {cell.covered
                            ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500 mx-auto" />
                            : <XCircle className="h-3.5 w-3.5 text-red-300 mx-auto" />
                          }
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Prosecution Flags */}
      {result.prosecution_flags && result.prosecution_flags.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Prosecution Narrowing Flags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {result.prosecution_flags.map((flag, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <Badge variant="outline" className="font-mono text-xs shrink-0">{flag.jurisdiction}</Badge>
                  <span>
                    Claims {flag.narrowed_claims.join(', ')} appear narrowed.
                    {flag.description && ` ${flag.description}`}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {error && <p className="text-sm text-destructive text-center">{error}</p>}
    </div>
  );
}
