'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { analyticsApi, FtoAnalysis } from '@/services/analyticsApi';

interface RiskEntry {
  patentNumber: string;
  title: string;
  assignee: string;
  riskTier: 'High' | 'Medium' | 'Low';
  assertionLikelihood: 'High' | 'Medium' | 'Low';
  feature: string;
  expiry?: string;
}

function mapRiskLevel(level: string): 'High' | 'Medium' | 'Low' {
  if (level === 'high') return 'High';
  if (level === 'medium') return 'Medium';
  return 'Low';
}

function transformFtoToEntries(fto: FtoAnalysis): RiskEntry[] {
  return fto.patent_assessments.map((pa) => {
    // Use the highest-risk claim's text as the "feature" description
    const topClaim = pa.claim_analysis
      .filter((c) => c.risk_level !== 'none')
      .sort((a, b) => b.coverage_score - a.coverage_score)[0];

    return {
      patentNumber: pa.patent_id,
      title: pa.title,
      assignee: pa.assignee,
      riskTier: mapRiskLevel(pa.risk_level),
      assertionLikelihood: mapRiskLevel(
        pa.risk_score > 0.7 ? 'high' : pa.risk_score > 0.4 ? 'medium' : 'low',
      ),
      feature: topClaim?.text?.slice(0, 60) || pa.title,
      expiry: pa.filing_date ? String(new Date(pa.filing_date).getFullYear() + 20) : undefined,
    };
  });
}

interface FTORiskMatrixProps {
  projectId: string;
  entries?: RiskEntry[];
}

const TIER_COLORS: Record<string, string> = {
  High: 'destructive',
  Medium: 'default',
  Low: 'secondary',
};

const CELL_COLOR = (tier: string, likelihood: string): string => {
  if (tier === 'High' && likelihood === 'High') return 'bg-red-100 border-red-300 dark:bg-red-950/30';
  if (tier === 'High' && likelihood === 'Medium') return 'bg-orange-100 border-orange-300 dark:bg-orange-950/30';
  if (tier === 'Medium' && likelihood === 'High') return 'bg-orange-100 border-orange-300 dark:bg-orange-950/30';
  if (tier === 'Low' || likelihood === 'Low') return 'bg-green-50 border-green-200 dark:bg-green-950/20';
  return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20';
};

export function FTORiskMatrix({ projectId, entries: externalEntries }: FTORiskMatrixProps) {
  const [fetchedEntries, setFetchedEntries] = useState<RiskEntry[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAnalysis = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await analyticsApi.runFtoAnalysis(projectId);
      if (response.success && response.data) {
        setFetchedEntries(transformFtoToEntries(response.data));
      } else {
        setError('No FTO analysis data available');
      }
    } catch (err) {
      setError('Failed to load FTO analysis');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (!externalEntries) {
      loadAnalysis();
    }
  }, [externalEntries, loadAnalysis]);

  const entries = externalEntries ?? fetchedEntries ?? [];
  const tiers = ['High', 'Medium', 'Low'] as const;
  const likelihoods = ['High', 'Medium', 'Low'] as const;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm">FTO Risk Matrix</CardTitle>
            <p className="text-xs text-muted-foreground">
              Patent risk tier vs. assertion likelihood. Red = highest priority for design-around.
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={loadAnalysis} disabled={loading} aria-label="Refresh FTO analysis">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
            <RefreshCw className="h-3 w-3 animate-spin" /> Running FTO analysis...
          </div>
        )}
        {error && !loading && entries.length === 0 && (
          <p className="text-xs text-muted-foreground py-2">{error}</p>
        )}
        {/* Matrix grid */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr>
                <th className="text-left p-2 text-muted-foreground font-medium">Risk Tier \ Assertion</th>
                {likelihoods.map((l) => (
                  <th key={l} className="p-2 text-center text-muted-foreground font-medium">{l}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tiers.map((tier) => (
                <tr key={tier}>
                  <td className="p-2 font-medium">{tier}</td>
                  {likelihoods.map((likelihood) => {
                    const cellEntries = entries.filter(
                      (e) => e.riskTier === tier && e.assertionLikelihood === likelihood
                    );
                    return (
                      <td
                        key={likelihood}
                        className={`p-2 border rounded text-center align-top ${CELL_COLOR(tier, likelihood)}`}
                      >
                        {cellEntries.length === 0 ? (
                          <span className="text-muted-foreground">—</span>
                        ) : (
                          <div className="space-y-1">
                            {cellEntries.map((e) => (
                              <div
                                key={e.patentNumber}
                                className="rounded bg-white/60 dark:bg-black/20 px-1.5 py-1 text-left"
                              >
                                <p className="font-medium">{e.patentNumber}</p>
                                <p className="text-muted-foreground truncate max-w-[120px]">{e.feature}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Patent list */}
        {entries.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Identified Patents</p>
            <div className="space-y-1.5">
              {entries.map((entry) => (
                <div
                  key={entry.patentNumber}
                  className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs"
                >
                  <Badge variant={TIER_COLORS[entry.riskTier] as any} className="text-[10px] px-1">
                    {entry.riskTier}
                  </Badge>
                  <span className="font-medium">{entry.patentNumber}</span>
                  <span className="text-muted-foreground flex-1 truncate">{entry.assignee}</span>
                  {entry.expiry && (
                    <span className="text-muted-foreground shrink-0">Exp: {entry.expiry}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {entries.length === 0 && (
          <p className="text-center text-xs text-muted-foreground py-4">
            No patents identified yet. Complete Phase 4 (Patent Retrieval) and Phase 7 (Risk Stratification) to populate this matrix.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
