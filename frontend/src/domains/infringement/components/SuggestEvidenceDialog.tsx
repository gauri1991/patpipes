'use client';

/**
 * Assisted evidence sourcing: paste a product URL, fetch it server-side, and review
 * ranked candidate passages. Each candidate can be saved as Evidence on the case.
 * Relevance ranking is heuristic until the backend LLM master switch is enabled.
 */

import { useEffect, useState } from 'react';
import { Loader2, Sparkles, Plus, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { infringementApi } from '@/services/infringementApi';
import { toast } from 'sonner';

interface Candidate {
  text: string;
  score: number;
  reason: string;
}

interface SuggestEvidenceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseId: string;
  onAdded: () => void;
}

export function SuggestEvidenceDialog({ open, onOpenChange, caseId, onAdded }: SuggestEvidenceDialogProps) {
  const [url, setUrl] = useState('');
  const [claimMappingId, setClaimMappingId] = useState('');
  const [claimOptions, setClaimOptions] = useState<Array<{ id: string; claim_number: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [sourceUrl, setSourceUrl] = useState('');
  const [pageTitle, setPageTitle] = useState('');
  const [added, setAdded] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!open) {
      setUrl(''); setCandidates([]); setAdded(new Set()); setClaimMappingId('');
      return;
    }
    infringementApi.getClaimMappings({ case: caseId }).then((res) => {
      const d: any = res.data;
      const list = Array.isArray(d) ? d : d?.results ?? [];
      setClaimOptions(list.map((m: any) => ({ id: m.id, claim_number: m.claim_number })));
    }).catch(() => setClaimOptions([]));
  }, [open, caseId]);

  const handleFind = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setCandidates([]);
    setAdded(new Set());
    try {
      const res = await infringementApi.suggestEvidenceFromUrl({
        url: url.trim(),
        ...(claimMappingId ? { claim_mapping_id: claimMappingId } : {}),
        use_llm: true, // opt-in; dormant until the backend master switch is enabled
      });
      if (res.success && res.data) {
        setCandidates(res.data.candidates || []);
        setSourceUrl(res.data.source_url);
        setPageTitle(res.data.title);
        if ((res.data.candidates || []).length === 0) toast.info('No candidate passages found');
      } else {
        toast.error('Could not fetch that URL');
      }
    } catch {
      toast.error('Could not fetch that URL');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (cand: Candidate, idx: number) => {
    try {
      const res = await infringementApi.createEvidence({
        case: caseId,
        title: `${pageTitle.slice(0, 80)} — passage ${idx + 1}`,
        description: cand.text,
        evidence_type: 'product_doc',
        url: sourceUrl,
        relevance_score: Math.max(1, Math.min(10, Math.round(cand.score / 10))),
      } as any);
      if (res.success) {
        setAdded((prev) => new Set(prev).add(idx));
        toast.success('Saved as evidence');
        onAdded();
      } else {
        toast.error('Failed to save evidence');
      }
    } catch {
      toast.error('Failed to save evidence');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-cyan-600" />
            Find evidence from a product URL
          </DialogTitle>
          <DialogDescription>
            Fetches the page and ranks candidate passages. Review and save the relevant ones as evidence.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="space-y-2">
            <Label htmlFor="suggest-url">Product / documentation URL</Label>
            <div className="flex gap-2">
              <Input
                id="suggest-url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/product"
              />
              <Button onClick={handleFind} disabled={loading || !url.trim()}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Find'}
              </Button>
            </div>
          </div>

          {claimOptions.length > 0 && (
            <div className="space-y-1">
              <Label htmlFor="suggest-claim" className="text-xs text-muted-foreground">
                Rank against claim (optional)
              </Label>
              <select
                id="suggest-claim"
                value={claimMappingId}
                onChange={(e) => setClaimMappingId(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">— No specific claim —</option>
                {claimOptions.map((c) => (
                  <option key={c.id} value={c.id}>Claim {c.claim_number}</option>
                ))}
              </select>
            </div>
          )}

          {candidates.length > 0 && (
            <div className="max-h-80 overflow-y-auto space-y-2 border-t pt-3">
              {candidates.map((cand, idx) => (
                <div key={idx} className="p-3 rounded-md border bg-muted/30">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">Relevance {cand.score}</Badge>
                        <span className="text-xs text-muted-foreground">{cand.reason}</span>
                      </div>
                      <p className="text-sm">{cand.text}</p>
                    </div>
                    {added.has(idx) ? (
                      <Badge className="bg-green-100 text-green-700 shrink-0"><Check className="h-3 w-3 mr-1" />Added</Badge>
                    ) : (
                      <Button variant="outline" size="sm" className="shrink-0" onClick={() => handleAdd(cand, idx)}>
                        <Plus className="h-3 w-3 mr-1" />Add
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
