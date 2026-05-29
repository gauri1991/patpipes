'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, Pencil, Plus, X, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { infringementApi } from '@/services/infringementApi';
import { toast } from 'sonner';

interface ClaimTermsManagerProps {
  caseId: string;
  termColors: Record<string, string>;
  onChange: (colors: Record<string, string>) => void;
}

/**
 * Collapsible panel to auto-extract and manage the case-wide claim-term → color map.
 * Mirrors the legend/editor in the Evidence Mapper, backed by the same case endpoints
 * (extract / set-term-color / add / remove / rename). Highlights elsewhere read the same
 * map, so edits here propagate via onChange.
 */
export function ClaimTermsManager({ caseId, termColors, onChange }: ClaimTermsManagerProps) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [coloring, setColoring] = useState(false);
  const [newTerm, setNewTerm] = useState('');

  const entries = Object.entries(termColors);

  const autoColor = async () => {
    setColoring(true);
    try {
      const res = await infringementApi.extractClaimTerms(caseId);
      if (res.success) {
        onChange(res.data?.claim_term_colors || {});
        toast.success('Claim terms colored');
      } else {
        toast.error('Failed to color terms');
      }
    } catch {
      toast.error('Failed to color terms');
    } finally {
      setColoring(false);
    }
  };

  const recolor = async (term: string, color: string) => {
    onChange({ ...termColors, [term]: color }); // optimistic
    try { await infringementApi.setClaimTermColor(caseId, term, color); }
    catch { toast.error('Failed to update color'); }
  };

  const remove = async (term: string) => {
    try {
      const res = await infringementApi.removeClaimTerm(caseId, term);
      if (res.success) onChange(res.data?.claim_term_colors || {});
    } catch { toast.error('Failed to remove term'); }
  };

  const rename = async (term: string, next: string) => {
    const v = next.trim().toLowerCase();
    if (!v || v === term) return;
    try {
      const res = await infringementApi.renameClaimTerm(caseId, term, v);
      if (res.success) onChange(res.data?.claim_term_colors || {});
    } catch { toast.error('Failed to rename term'); }
  };

  const add = async () => {
    const v = newTerm.trim();
    if (!v) return;
    try {
      const res = await infringementApi.addClaimTerm(caseId, v);
      if (res.success) { onChange(res.data?.claim_term_colors || {}); setNewTerm(''); }
    } catch { toast.error('Failed to add term'); }
  };

  return (
    <div className="border rounded-md bg-muted/20">
      <div className="flex items-center justify-between px-3 py-2">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1.5 text-sm font-semibold text-neutral-700"
        >
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          Claim terms{entries.length ? ` (${entries.length})` : ''}
        </button>
        <div className="flex items-center gap-1">
          {open && entries.length > 0 && (
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setEditing((v) => !v)}>
              <Pencil className="h-3 w-3 mr-1" />{editing ? 'Done' : 'Edit'}
            </Button>
          )}
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={autoColor} disabled={coloring}>
            {coloring ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Sparkles className="h-3 w-3 mr-1" />}
            Auto-color
          </Button>
        </div>
      </div>

      {open && (
        <div className="px-3 pb-3">
          {entries.length === 0 ? (
            <p className="text-[11px] text-muted-foreground">No terms yet — click Auto-color to detect claim terms.</p>
          ) : editing ? (
            <div className="space-y-1">
              <div className="max-h-48 overflow-y-auto space-y-1">
                {entries.map(([term, color]) => (
                  <div key={term} className="flex items-center gap-1.5">
                    <label className="relative h-4 w-4 rounded-full border cursor-pointer shrink-0" style={{ backgroundColor: color }} title="Recolor">
                      <input type="color" value={color} onChange={(e) => recolor(term, e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
                    </label>
                    <input
                      defaultValue={term}
                      onBlur={(e) => rename(term, e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                      className="flex-1 min-w-0 h-7 rounded border border-input bg-white px-2 text-xs"
                      title="Edit term (rename / merge into an existing term)"
                    />
                    <button type="button" onClick={() => remove(term)} title="Remove term" className="text-neutral-400 hover:text-red-600 shrink-0">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-1 pt-1 border-t">
                <Input
                  value={newTerm}
                  onChange={(e) => setNewTerm(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') add(); }}
                  placeholder="Add a term…"
                  className="h-7 text-xs"
                />
                <Button size="sm" className="h-7 px-2 text-xs" onClick={add} disabled={!newTerm.trim()}>
                  <Plus className="h-3 w-3 mr-1" />Add
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-1">
              {entries.map(([term, color]) => (
                <span key={term} className="inline-flex items-center gap-1 text-[11px] rounded border px-1.5 py-0.5 bg-white">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
                  {term}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
