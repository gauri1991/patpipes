'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
import { InfringementCase, infringementApi } from '@/services/infringementApi';
import { toast } from 'sonner';

interface EditCaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseItem: InfringementCase | null;
  onSaved: () => void;
}

const STATUS_OPTIONS = [
  ['draft', 'Draft'],
  ['active', 'Active Analysis'],
  ['review', 'Under Review'],
  ['completed', 'Completed'],
  ['on_hold', 'On Hold'],
  ['closed', 'Closed'],
] as const;

const RISK_OPTIONS = [
  ['low', 'Low'],
  ['medium', 'Medium'],
  ['high', 'High'],
  ['critical', 'Critical'],
] as const;

const ANALYSIS_OPTIONS = [
  ['literal', 'Literal'],
  ['doe', 'Doctrine of Equivalents'],
  ['induced', 'Induced'],
  ['contributory', 'Contributory'],
  ['willful', 'Willful'],
] as const;

type FormState = {
  case_name: string;
  status: string;
  risk_level: string;
  analysis_type: string;
  patent_number: string;
  patent_title: string;
  patent_abstract: string;
  patent_url: string;
  accused_product_name: string;
  accused_product_description: string;
  accused_party_name: string;
  accused_party_url: string;
  infringement_likelihood: number;
  confidence_level: number;
  discovery_date: string;
  analysis_date: string;
  notes: string;
  is_confidential: boolean;
};

function fromCase(c: InfringementCase): FormState {
  return {
    case_name: c.case_name || '',
    status: c.status || 'draft',
    risk_level: c.risk_level || 'medium',
    analysis_type: c.analysis_type || 'literal',
    patent_number: c.patent_number || '',
    patent_title: c.patent_title || '',
    patent_abstract: c.patent_abstract || '',
    patent_url: c.patent_url || '',
    accused_product_name: c.accused_product_name || '',
    accused_product_description: c.accused_product_description || '',
    accused_party_name: c.accused_party_name || '',
    accused_party_url: c.accused_party_url || '',
    infringement_likelihood: c.infringement_likelihood ?? 0,
    confidence_level: c.confidence_level ?? 0,
    discovery_date: c.discovery_date || '',
    analysis_date: c.analysis_date || '',
    notes: c.notes || '',
    is_confidential: c.is_confidential ?? true,
  };
}

export function EditCaseDialog({ open, onOpenChange, caseItem, onSaved }: EditCaseDialogProps) {
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && caseItem) setForm(fromCase(caseItem));
  }, [open, caseItem]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));

  const clampPct = (v: string) => Math.max(0, Math.min(100, Number(v) || 0));

  const handleSave = async () => {
    if (!caseItem || !form) return;
    if (!form.case_name.trim()) {
      toast.error('Case name is required');
      return;
    }
    setSaving(true);
    try {
      // Dates: send null (not '') when cleared, so DRF accepts the DateField.
      const payload: Partial<InfringementCase> = {
        ...form,
        discovery_date: form.discovery_date || undefined,
        analysis_date: form.analysis_date || undefined,
      } as Partial<InfringementCase>;
      const res = await infringementApi.updateCase(caseItem.id, payload);
      if (res.success) {
        toast.success('Case updated');
        onOpenChange(false);
        onSaved();
      } else {
        toast.error('Failed to update case');
      }
    } catch (e) {
      console.error('Error updating case:', e);
      toast.error('Failed to update case');
    } finally {
      setSaving(false);
    }
  };

  if (!form) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Case</DialogTitle>
          <DialogDescription>
            Update the details for {caseItem?.case_name}.
            {caseItem?.case_number ? ` (${caseItem.case_number})` : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="case_name">Case name</Label>
            <Input id="case_name" value={form.case_name} onChange={(e) => set('case_name', e.target.value)} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Risk level</Label>
              <Select value={form.risk_level} onValueChange={(v) => set('risk_level', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RISK_OPTIONS.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Analysis type</Label>
              <Select value={form.analysis_type} onValueChange={(v) => set('analysis_type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ANALYSIS_OPTIONS.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="patent_number">Patent number</Label>
              <Input id="patent_number" value={form.patent_number} onChange={(e) => set('patent_number', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="patent_url">Patent URL</Label>
              <Input id="patent_url" value={form.patent_url} onChange={(e) => set('patent_url', e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="patent_title">Patent title</Label>
            <Input id="patent_title" value={form.patent_title} onChange={(e) => set('patent_title', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="patent_abstract">Patent abstract</Label>
            <Textarea id="patent_abstract" rows={3} value={form.patent_abstract} onChange={(e) => set('patent_abstract', e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="accused_product_name">Accused product</Label>
              <Input id="accused_product_name" value={form.accused_product_name} onChange={(e) => set('accused_product_name', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accused_party_name">Accused party</Label>
              <Input id="accused_party_name" value={form.accused_party_name} onChange={(e) => set('accused_party_name', e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="accused_product_description">Accused product description</Label>
            <Textarea id="accused_product_description" rows={2} value={form.accused_product_description} onChange={(e) => set('accused_product_description', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="accused_party_url">Accused party URL</Label>
            <Input id="accused_party_url" value={form.accused_party_url} onChange={(e) => set('accused_party_url', e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="infringement_likelihood">Infringement likelihood (%)</Label>
              <Input id="infringement_likelihood" type="number" min={0} max={100} value={form.infringement_likelihood}
                onChange={(e) => set('infringement_likelihood', clampPct(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confidence_level">Confidence level (%)</Label>
              <Input id="confidence_level" type="number" min={0} max={100} value={form.confidence_level}
                onChange={(e) => set('confidence_level', clampPct(e.target.value))} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="discovery_date">Discovery date</Label>
              <Input id="discovery_date" type="date" value={form.discovery_date} onChange={(e) => set('discovery_date', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="analysis_date">Analysis date</Label>
              <Input id="analysis_date" type="date" value={form.analysis_date} onChange={(e) => set('analysis_date', e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" rows={3} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
          </div>

          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <Label htmlFor="is_confidential">Confidential</Label>
              <p className="text-xs text-muted-foreground">Mark this case as confidential.</p>
            </div>
            <Switch id="is_confidential" checked={form.is_confidential} onCheckedChange={(v) => set('is_confidential', v)} />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !form.case_name.trim()}>
            {saving ? 'Saving…' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
