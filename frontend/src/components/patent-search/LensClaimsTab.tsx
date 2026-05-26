'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { LensPatent } from '@/services/lensApi';

interface LensClaimsTabProps {
  data: LensPatent | null;
  isLoading?: boolean;
}

export function LensClaimsTab({ data, isLoading }: LensClaimsTabProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (!data) {
    return <p className="text-muted-foreground py-8 text-center">No patent data available.</p>;
  }

  const claimSets = data.claims || [];
  if (claimSets.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center">
        No claims data available for this patent.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {claimSets.map((claimSet, setIdx) => {
        const claims = claimSet.claims || [];
        const lang = claimSet.lang?.toUpperCase() || 'EN';

        return (
          <Card key={setIdx}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">
                  Claims
                </CardTitle>
                <Badge variant="secondary">{lang}</Badge>
                <Badge variant="outline">{claims.length} claim{claims.length !== 1 ? 's' : ''}</Badge>
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
