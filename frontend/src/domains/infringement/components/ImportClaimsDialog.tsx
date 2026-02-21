'use client';

import { useState } from 'react';
import { Search, RefreshCw, CheckSquare, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { usptoOdpApi, ODPFullText } from '@/services/usptoOdpApi';
import { infringementApi } from '@/services/infringementApi';
import { toast } from 'sonner';

interface ImportClaimsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseId: string;
  patentNumber: string;
  onImported: () => void;
}

export function ImportClaimsDialog({
  open,
  onOpenChange,
  caseId,
  patentNumber,
  onImported,
}: ImportClaimsDialogProps) {
  const [step, setStep] = useState<'search' | 'select'>('search');
  const [searchNumber, setSearchNumber] = useState(patentNumber || '');
  const [loading, setLoading] = useState(false);
  const [claims, setClaims] = useState<string[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [importing, setImporting] = useState(false);

  const handleSearch = async () => {
    if (!searchNumber) return;
    setLoading(true);
    try {
      // Search for the application ID using ODP q syntax
      const cleanNumber = searchNumber.replace(/^US/i, '').replace(/[,\s]/g, '').replace(/[A-Z]\d*$/i, '');
      const searchRes = await usptoOdpApi.searchApplications({
        q: `applicationNumberText:${cleanNumber}`,
        pagination: { offset: 0, limit: 1 },
      });

      if (!searchRes.success || !searchRes.data?.patentFileWrapperDataBag?.length) {
        toast.error('Patent not found in USPTO database');
        setLoading(false);
        return;
      }

      const appId = searchRes.data.patentFileWrapperDataBag[0].applicationNumberText;

      // Fetch full text with claims
      const textRes = await usptoOdpApi.getFullText(appId);
      if (!textRes.success || !textRes.data) {
        toast.error('Could not retrieve patent claims');
        setLoading(false);
        return;
      }

      const fullText = textRes.data;
      const claimsList =
        fullText.grant_text?.claims ||
        fullText.pgpub_text?.claims ||
        [];

      if (claimsList.length === 0) {
        toast.error('No claims found in patent text');
        setLoading(false);
        return;
      }

      setClaims(claimsList);
      setSelected(new Set(claimsList.map((_, i) => i)));
      setStep('select');
    } catch (error) {
      console.error('Error searching USPTO:', error);
      toast.error('Failed to search USPTO');
    } finally {
      setLoading(false);
    }
  };

  const toggleClaim = (index: number) => {
    const next = new Set(selected);
    next.has(index) ? next.delete(index) : next.add(index);
    setSelected(next);
  };

  const toggleAll = () => {
    if (selected.size === claims.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(claims.map((_, i) => i)));
    }
  };

  const handleImport = async () => {
    if (selected.size === 0) return;
    setImporting(true);
    try {
      const selectedClaims = claims.filter((_, i) => selected.has(i));

      const results = await Promise.allSettled(
        selectedClaims.map((claimText, i) =>
          infringementApi.createClaimMapping({
            case: caseId,
            claim_number: String(i + 1),
            claim_text: claimText.trim(),
            claim_type: 'independent',
            product_feature: '',
            product_feature_description: '',
            mapping_type: 'literal',
            match_confidence: 0,
            limitations_met: false,
          })
        )
      );

      // Auto-parse elements for each created claim mapping
      const createdIds = results
        .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
        .map((r) => r.value?.data?.id)
        .filter(Boolean);
      await Promise.allSettled(
        createdIds.map((id: string) => infringementApi.parseClaimElements(id))
      );

      toast.success(`Imported ${createdIds.length} claims with elements`);
      onOpenChange(false);
      setStep('search');
      setClaims([]);
      setSelected(new Set());
      onImported();
    } catch (error) {
      console.error('Error importing claims:', error);
      toast.error('Failed to import claims');
    } finally {
      setImporting(false);
    }
  };

  const handleClose = (openState: boolean) => {
    if (!openState) {
      setStep('search');
      setClaims([]);
      setSelected(new Set());
    }
    onOpenChange(openState);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Claims from USPTO</DialogTitle>
          <DialogDescription>
            Search for a patent and import its claims as claim mappings
          </DialogDescription>
        </DialogHeader>

        {step === 'search' ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Patent Number</Label>
              <div className="flex gap-2">
                <Input
                  value={searchNumber}
                  onChange={(e) => setSearchNumber(e.target.value)}
                  placeholder="e.g., US10123456 or 10123456"
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} disabled={loading || !searchNumber}>
                  {loading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Enter a US patent number to fetch claims from the USPTO Open Data Portal
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                Found {claims.length} claims — {selected.size} selected
              </p>
              <Button variant="outline" size="sm" onClick={toggleAll}>
                {selected.size === claims.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>

            <div className="max-h-[400px] overflow-y-auto space-y-2">
              {claims.map((claim, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selected.has(idx)
                      ? 'bg-blue-50 border-blue-300'
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => toggleClaim(idx)}
                >
                  <div className="flex items-start gap-2">
                    {selected.has(idx) ? (
                      <CheckSquare className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                    ) : (
                      <Square className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    )}
                    <div>
                      <span className="font-mono text-xs text-muted-foreground">
                        Claim {idx + 1}
                      </span>
                      <p className="text-sm mt-1 line-clamp-3">{claim}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep('search')}>
                Back
              </Button>
              <Button onClick={handleImport} disabled={importing || selected.size === 0}>
                {importing ? 'Importing...' : `Import ${selected.size} Claims`}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
