'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
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
import { Evidence, infringementApi } from '@/services/infringementApi';
import { toast } from 'sonner';

interface EvidenceEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  evidence: Evidence | null;
  onSaved: () => void;
}

const EVIDENCE_TYPES: [string, string][] = [
  ['product_doc', 'Product Documentation'],
  ['patent_doc', 'Patent Document'],
  ['technical_spec', 'Technical Specification'],
  ['marketing', 'Marketing Material'],
  ['source_code', 'Source Code'],
  ['screenshot', 'Screenshot'],
  ['photo', 'Photo'],
  ['video', 'Video'],
  ['testimony', 'Testimony'],
  ['research', 'Research'],
  ['other', 'Other'],
];

export function EvidenceEditDialog({ open, onOpenChange, evidence, onSaved }: EvidenceEditDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [evidenceType, setEvidenceType] = useState('other');
  const [relevance, setRelevance] = useState(5);
  const [source, setSource] = useState('');
  const [relatedClaims, setRelatedClaims] = useState('');
  const [url, setUrl] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && evidence) {
      setTitle(evidence.title || '');
      setDescription(evidence.description || '');
      setEvidenceType(evidence.evidence_type || 'other');
      setRelevance(evidence.relevance_score ?? 5);
      setSource(evidence.source || '');
      setRelatedClaims((evidence.related_claims || []).join(', '));
      setUrl(evidence.url || '');
    }
  }, [open, evidence]);

  const handleSave = async () => {
    if (!evidence) return;
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    setSaving(true);
    try {
      const res = await infringementApi.updateEvidence(evidence.id, {
        title: title.trim(),
        description,
        evidence_type: evidenceType as Evidence['evidence_type'],
        relevance_score: Math.max(0, Math.min(10, Number(relevance) || 0)),
        source,
        url,
        related_claims: relatedClaims
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      });
      if (res.success) {
        toast.success('Evidence updated');
        onOpenChange(false);
        onSaved();
      } else {
        toast.error('Failed to update evidence');
      }
    } catch {
      toast.error('Failed to update evidence');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Evidence</DialogTitle>
          <DialogDescription>Update the metadata for this evidence item.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="ev-title">Title</Label>
            <Input id="ev-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ev-desc">Description</Label>
            <Textarea id="ev-desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={evidenceType} onValueChange={setEvidenceType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EVIDENCE_TYPES.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ev-rel">Relevance (0–10)</Label>
              <Input id="ev-rel" type="number" min={0} max={10} value={relevance}
                onChange={(e) => setRelevance(Math.max(0, Math.min(10, Number(e.target.value) || 0)))} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ev-claims">Related claims (comma-separated)</Label>
            <Input id="ev-claims" value={relatedClaims} onChange={(e) => setRelatedClaims(e.target.value)} placeholder="1, 3, 5" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ev-source">Source</Label>
            <Input id="ev-source" value={source} onChange={(e) => setSource(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ev-url">URL</Label>
            <Input id="ev-url" value={url} onChange={(e) => setUrl(e.target.value)} />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !title.trim()}>
            {saving ? 'Saving…' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
