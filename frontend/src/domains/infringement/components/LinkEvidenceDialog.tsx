'use client';

/**
 * Attach/detach Evidence to a specific ClaimElement (per-element citations).
 * Lists the case's evidence with checkboxes pre-selected from the element's
 * existing evidence_references, and saves the selection.
 */

import { useEffect, useState } from 'react';
import { Loader2, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ClaimElement, Evidence, infringementApi } from '@/services/infringementApi';
import { toast } from 'sonner';

interface LinkEvidenceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseId: string;
  element: ClaimElement | null;
  onSaved?: () => void;
}

export function LinkEvidenceDialog({ open, onOpenChange, caseId, element, onSaved }: LinkEvidenceDialogProps) {
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !element) return;
    setSelected(new Set(element.evidence_references || []));
    setLoading(true);
    infringementApi
      .getEvidence({ case: caseId })
      .then((res) => {
        const d: any = res.data;
        setEvidence(res.success ? (Array.isArray(d) ? d : d?.results ?? []) : []);
      })
      .catch(() => setEvidence([]))
      .finally(() => setLoading(false));
  }, [open, element, caseId]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    if (!element) return;
    setSaving(true);
    try {
      const res = await infringementApi.updateClaimElement(element.id, {
        evidence_references: Array.from(selected),
      });
      if (res.success) {
        toast.success('Evidence citations updated');
        onSaved?.();
        onOpenChange(false);
      } else {
        toast.error('Failed to update citations');
      }
    } catch {
      toast.error('Failed to update citations');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Link evidence to element</DialogTitle>
          <DialogDescription>
            {element ? `Element #${element.element_order}: ${element.element_text.slice(0, 80)}` : ''}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-6">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading evidence…
          </div>
        ) : evidence.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6">
            No evidence in this case yet. Add evidence in the Evidence tab first.
          </p>
        ) : (
          <div className="max-h-72 overflow-y-auto space-y-2 py-2">
            {evidence.map((ev) => (
              <label
                key={ev.id}
                className="flex items-start gap-3 p-2 rounded-md border hover:bg-muted/40 cursor-pointer"
              >
                <input
                  type="checkbox"
                  className="mt-1 rounded"
                  checked={selected.has(ev.id)}
                  onChange={() => toggle(ev.id)}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="text-sm font-medium truncate">{ev.title}</span>
                    <Badge variant="secondary" className="text-xs shrink-0">{ev.evidence_type}</Badge>
                  </div>
                  {ev.description && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{ev.description}</p>
                  )}
                </div>
              </label>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save citations
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
