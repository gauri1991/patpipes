'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Info } from 'lucide-react';
import type { LensPatent } from '@/services/lensApi';
import { lensText } from '@/services/lensApi';

interface LensFullTextTabProps {
  data: LensPatent | null;
  isLoading?: boolean;
}

export function LensFullTextTab({ data, isLoading }: LensFullTextTabProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!data) {
    return <p className="text-muted-foreground py-8 text-center">No patent data available.</p>;
  }

  const abstract = lensText(data.abstract);
  const claimSets = data.claims || [];
  const hasAbstract = !!abstract;
  const hasClaims = claimSets.length > 0 && claimSets.some(cs => cs.claims?.length > 0);

  if (!hasAbstract && !hasClaims) {
    return (
      <p className="text-muted-foreground py-8 text-center">
        No full text data available for this patent from Lens.org.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {/* Info notice */}
      <div className="flex items-start gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
        <Info className="h-4 w-4 mt-0.5 shrink-0" />
        <span>
          Lens.org provides abstract and claims text. Patent description/specification
          is not available through this source.
        </span>
      </div>

      {/* Abstract */}
      {hasAbstract && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">Abstract</CardTitle>
              <Badge variant="outline" className="text-xs">Source: Lens.org</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">{abstract}</p>
          </CardContent>
        </Card>
      )}

      {/* Claims */}
      {hasClaims && claimSets.map((claimSet, setIdx) => {
        const claims = claimSet.claims || [];
        const lang = claimSet.lang?.toUpperCase() || 'EN';

        return (
          <Card key={setIdx}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">Claims</CardTitle>
                <Badge variant="secondary">{lang}</Badge>
                <Badge variant="outline">{claims.length} claim{claims.length !== 1 ? 's' : ''}</Badge>
                <Badge variant="outline" className="text-xs">Source: Lens.org</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {claims.map((claim, claimIdx) => {
                  const texts = claim.claim_text || [];
                  const fullText = texts.join(' ');
                  const isIndependent = !fullText.toLowerCase().match(/claim\s+\d+/);

                  return (
                    <div
                      key={claimIdx}
                      className={`text-sm leading-relaxed ${
                        isIndependent
                          ? 'border-l-2 border-primary pl-3'
                          : 'border-l-2 border-muted pl-3 ml-4'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-xs text-muted-foreground">
                          Claim {claimIdx + 1}
                        </span>
                        {isIndependent && (
                          <Badge variant="default" className="text-[10px] h-4">Independent</Badge>
                        )}
                      </div>
                      {texts.map((t, tIdx) => (
                        <p key={tIdx} className="mb-1">{t}</p>
                      ))}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
