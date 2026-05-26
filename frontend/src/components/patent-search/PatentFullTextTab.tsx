'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ExternalLink, ChevronDown, ChevronRight } from 'lucide-react';
import usptoOdpApi, { type ODPFullText, type ODPParsedText } from '@/services/usptoOdpApi';

interface PatentFullTextTabProps {
  appId: string;
}

function CollapsibleSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border rounded-lg">
      <button
        type="button"
        className="flex items-center gap-2 w-full px-4 py-3 text-left font-semibold text-sm hover:bg-muted/50 transition-colors"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        {open ? (
          <ChevronDown className="h-4 w-4 shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0" />
        )}
        {title}
      </button>
      {open && (
        <div className="px-4 pb-4 text-sm leading-relaxed border-t">
          {children}
        </div>
      )}
    </div>
  );
}

function isDependent(claimText: string): boolean {
  return /\bclaim\s+\d/i.test(claimText);
}

function ClaimBlock({ claim, index }: { claim: string; index: number }) {
  const dependent = isDependent(claim);
  return (
    <div
      className={`rounded-md border p-3 text-sm leading-relaxed whitespace-pre-wrap font-mono ${
        dependent
          ? 'border-border bg-muted/30 text-muted-foreground'
          : 'border-primary/40 bg-primary/5'
      }`}
    >
      {claim}
    </div>
  );
}

function ParsedTextView({ text }: { text: ODPParsedText }) {
  return (
    <div className="space-y-3">
      {text.abstract && (
        <CollapsibleSection title="Abstract" defaultOpen>
          <p className="pt-3 leading-relaxed">{text.abstract}</p>
        </CollapsibleSection>
      )}
      {text.description && (
        <CollapsibleSection title="Description">
          <div className="pt-3 whitespace-pre-wrap leading-relaxed">{text.description}</div>
        </CollapsibleSection>
      )}
      {text.claims.length > 0 && (
        <CollapsibleSection title={`Claims (${text.claims.length})`} defaultOpen>
          <div className="pt-3 space-y-2">
            {text.claims.map((claim, i) => (
              <ClaimBlock key={i} claim={claim} index={i} />
            ))}
          </div>
        </CollapsibleSection>
      )}
    </div>
  );
}

export function PatentFullTextTab({ appId }: PatentFullTextTabProps) {
  const [data, setData] = useState<ODPFullText | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSource, setActiveSource] = useState<'grant' | 'pgpub'>('grant');

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    usptoOdpApi.getFullText(appId).then((res) => {
      if (cancelled) return;
      if (res.success && res.data) {
        setData(res.data);
        // Default to whichever source has text
        if (!res.data.grant_text && res.data.pgpub_text) {
          setActiveSource('pgpub');
        }
      } else {
        setError(res.error || 'Failed to load full text data');
      }
      setIsLoading(false);
    });

    return () => { cancelled = true; };
  }, [appId]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return <p className="text-destructive py-4 text-center text-sm">{error}</p>;
  }

  if (!data || (!data.grant_url && !data.pgpub_url)) {
    return <p className="text-muted-foreground py-8 text-center">No full text documents available.</p>;
  }

  const hasGrantText = !!data.grant_text;
  const hasPgpubText = !!data.pgpub_text;
  const hasBothSources = hasGrantText && hasPgpubText;
  const activeText = activeSource === 'grant' ? data.grant_text : data.pgpub_text;

  return (
    <div className="space-y-4">
      {/* XML download links */}
      <div className="flex flex-wrap gap-2">
        {data.grant_url && (
          <Button variant="outline" size="sm" asChild>
            <a href={data.grant_url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Download Grant XML
            </a>
          </Button>
        )}
        {data.pgpub_url && (
          <Button variant="outline" size="sm" asChild>
            <a href={data.pgpub_url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Download Publication XML
            </a>
          </Button>
        )}
      </div>

      {/* Source toggle when both grant and publication text exist */}
      {hasBothSources && (
        <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
          <button
            type="button"
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              activeSource === 'grant'
                ? 'bg-background shadow-sm font-medium'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveSource('grant')}
          >
            Grant
          </button>
          <button
            type="button"
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              activeSource === 'pgpub'
                ? 'bg-background shadow-sm font-medium'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveSource('pgpub')}
          >
            Publication
          </button>
        </div>
      )}

      {/* Full text content */}
      {activeText ? (
        <ParsedTextView text={activeText} />
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Full Text Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Full text parsing is not available for this document. Use the download links above to view the raw XML.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
