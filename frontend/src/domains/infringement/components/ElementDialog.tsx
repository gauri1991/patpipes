'use client';

import { useState } from 'react';
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
import { infringementApi } from '@/services/infringementApi';
import { toast } from 'sonner';

interface ElementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mappingId: string;
  nextOrder: number;
  onSaved: () => void;
}

export function ElementDialog({
  open,
  onOpenChange,
  mappingId,
  nextOrder,
  onSaved,
}: ElementDialogProps) {
  const [order, setOrder] = useState(nextOrder);
  const [elementText, setElementText] = useState('');
  const [elementType, setElementType] = useState<'preamble' | 'body' | 'transition'>('body');
  const [accusedFeature, setAccusedFeature] = useState('');
  const [accusedFeatureDesc, setAccusedFeatureDesc] = useState('');
  const [meetsLimitation, setMeetsLimitation] = useState<boolean | null>(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!elementText) return;

    setSaving(true);
    try {
      await infringementApi.createClaimElement({
        claim_mapping: mappingId,
        element_order: order,
        element_text: elementText,
        element_type: elementType,
        accused_feature: accusedFeature,
        accused_feature_description: accusedFeatureDesc,
        meets_limitation: meetsLimitation,
        analysis_notes: notes,
      });

      toast.success('Element added');
      onOpenChange(false);
      resetForm();
      onSaved();
    } catch (error) {
      console.error('Error saving element:', error);
      toast.error('Failed to add element');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setElementText('');
    setElementType('body');
    setAccusedFeature('');
    setAccusedFeatureDesc('');
    setMeetsLimitation(null);
    setNotes('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Claim Element</DialogTitle>
          <DialogDescription>
            Break down the claim into individual elements for detailed analysis
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Element Order</Label>
              <Input
                type="number"
                min="1"
                value={order}
                onChange={(e) => setOrder(parseInt(e.target.value) || 1)}
              />
            </div>
            <div className="space-y-2">
              <Label>Element Type</Label>
              <Select value={elementType} onValueChange={(v: any) => setElementType(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="preamble">Preamble</SelectItem>
                  <SelectItem value="body">Body Element</SelectItem>
                  <SelectItem value="transition">Transition</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Element Text *</Label>
            <Textarea
              value={elementText}
              onChange={(e) => setElementText(e.target.value)}
              placeholder="The specific claim language for this element..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Accused Feature</Label>
            <Input
              value={accusedFeature}
              onChange={(e) => setAccusedFeature(e.target.value)}
              placeholder="The corresponding product feature..."
            />
          </div>

          <div className="space-y-2">
            <Label>Feature Description</Label>
            <Textarea
              value={accusedFeatureDesc}
              onChange={(e) => setAccusedFeatureDesc(e.target.value)}
              placeholder="Describe how the product feature relates to this element..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Meets Limitation?</Label>
            <div className="flex gap-4">
              {[
                { value: true, label: 'Yes' },
                { value: false, label: 'No' },
                { value: null, label: 'Unknown' },
              ].map((opt) => (
                <label key={String(opt.value)} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="meets-limitation"
                    checked={meetsLimitation === opt.value}
                    onChange={() => setMeetsLimitation(opt.value)}
                    className="rounded"
                  />
                  <span className="text-sm">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Analysis Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes for this element..."
              rows={2}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !elementText}>
            {saving ? 'Saving...' : 'Add Element'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
