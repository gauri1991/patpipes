'use client';

import { useState, useEffect } from 'react';
import { FileText, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ClaimMapping, infringementApi } from '@/services/infringementApi';
import { toast } from 'sonner';

interface ClaimMappingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseId: string;
  caseName: string;
  editMapping?: ClaimMapping | null;
  onSaved: () => void;
}

export function ClaimMappingDialog({
  open,
  onOpenChange,
  caseId,
  caseName,
  editMapping,
  onSaved,
}: ClaimMappingDialogProps) {
  const [claimNumber, setClaimNumber] = useState('');
  const [claimText, setClaimText] = useState('');
  const [claimType, setClaimType] = useState('independent');
  const [productFeature, setProductFeature] = useState('');
  const [productFeatureDesc, setProductFeatureDesc] = useState('');
  const [mappingType, setMappingType] = useState<'literal' | 'equivalent' | 'similar' | 'no_match'>('literal');
  const [matchConfidence, setMatchConfidence] = useState(50);
  const [analysisNotes, setAnalysisNotes] = useState('');
  const [limitationsMet, setLimitationsMet] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editMapping) {
      setClaimNumber(editMapping.claim_number);
      setClaimText(editMapping.claim_text);
      setClaimType(editMapping.claim_type);
      setProductFeature(editMapping.product_feature);
      setProductFeatureDesc(editMapping.product_feature_description);
      setMappingType(editMapping.mapping_type);
      setMatchConfidence(editMapping.match_confidence);
      setAnalysisNotes(editMapping.analysis_notes || '');
      setLimitationsMet(editMapping.limitations_met);
    } else {
      resetForm();
    }
  }, [editMapping, open]);

  const resetForm = () => {
    setClaimNumber('');
    setClaimText('');
    setClaimType('independent');
    setProductFeature('');
    setProductFeatureDesc('');
    setMappingType('literal');
    setMatchConfidence(50);
    setAnalysisNotes('');
    setLimitationsMet(false);
  };

  const handleSave = async () => {
    if (!claimNumber || !claimText || !productFeature) return;

    setSaving(true);
    try {
      const data = {
        case: caseId,
        claim_number: claimNumber,
        claim_text: claimText,
        claim_type: claimType,
        product_feature: productFeature,
        product_feature_description: productFeatureDesc,
        mapping_type: mappingType,
        match_confidence: matchConfidence,
        analysis_notes: analysisNotes,
        limitations_met: limitationsMet,
      };

      if (editMapping) {
        await infringementApi.updateClaimMapping(editMapping.id, data);
        toast.success('Claim mapping updated');
      } else {
        await infringementApi.createClaimMapping(data);
        toast.success('Claim mapping created');
      }

      onOpenChange(false);
      resetForm();
      onSaved();
    } catch (error) {
      console.error('Error saving claim mapping:', error);
      toast.error('Failed to save claim mapping');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editMapping ? 'Edit' : 'Create'} Claim Mapping</DialogTitle>
          <DialogDescription>
            Map patent claim elements to product features for {caseName}
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6 py-4">
          <div className="space-y-4">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Patent Claim Information
            </h3>

            <div className="space-y-2">
              <Label>Claim Number *</Label>
              <Input
                value={claimNumber}
                onChange={(e) => setClaimNumber(e.target.value)}
                placeholder="e.g., 1, 2, 3..."
              />
            </div>

            <div className="space-y-2">
              <Label>Claim Type</Label>
              <Select value={claimType} onValueChange={setClaimType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="independent">Independent Claim</SelectItem>
                  <SelectItem value="dependent">Dependent Claim</SelectItem>
                  <SelectItem value="method">Method Claim</SelectItem>
                  <SelectItem value="apparatus">Apparatus Claim</SelectItem>
                  <SelectItem value="system">System Claim</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Claim Text *</Label>
              <Textarea
                value={claimText}
                onChange={(e) => setClaimText(e.target.value)}
                placeholder="Enter the full claim text or limitation..."
                rows={6}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Scale className="h-4 w-4" />
              Accused Product Feature
            </h3>

            <div className="space-y-2">
              <Label>Feature Name *</Label>
              <Input
                value={productFeature}
                onChange={(e) => setProductFeature(e.target.value)}
                placeholder="e.g., Login Authentication System"
              />
            </div>

            <div className="space-y-2">
              <Label>Feature Description</Label>
              <Textarea
                value={productFeatureDesc}
                onChange={(e) => setProductFeatureDesc(e.target.value)}
                placeholder="Describe how the product feature relates to the claim..."
                rows={6}
              />
            </div>

            <div className="space-y-2">
              <Label>Mapping Type *</Label>
              <Select value={mappingType} onValueChange={(v: any) => setMappingType(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="literal">Literal Match</SelectItem>
                  <SelectItem value="equivalent">Equivalent (DOE)</SelectItem>
                  <SelectItem value="similar">Similar</SelectItem>
                  <SelectItem value="no_match">No Match</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="space-y-4 border-t pt-4">
          <h3 className="font-semibold text-sm">Analysis & Assessment</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Match Confidence: {matchConfidence}%</Label>
              <input
                type="range"
                min="0"
                max="100"
                value={matchConfidence}
                onChange={(e) => setMatchConfidence(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>No Match</span>
                <span>Perfect Match</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="limitations-met"
                checked={limitationsMet}
                onChange={(e) => setLimitationsMet(e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="limitations-met" className="cursor-pointer">
                All claim limitations are met
              </Label>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Analysis Notes (Optional)</Label>
            <Textarea
              value={analysisNotes}
              onChange={(e) => setAnalysisNotes(e.target.value)}
              placeholder="Add detailed analysis, case law references, technical comparisons..."
              rows={4}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !claimNumber || !claimText || !productFeature}
          >
            {saving ? 'Saving...' : editMapping ? 'Update Mapping' : 'Create Mapping'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
