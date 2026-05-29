'use client';

/**
 * Evidence-of-Use Mapper workbench (full-page split view).
 * Left: the case's claim elements (grouped Claim N → N.1, N.2…), multi-selectable, each
 * showing its mapped screenshot thumbnails. Right: the evidence PDF (PdfRegionViewer).
 * Drag a region on the PDF → preview the crop → save it mapped to the selected elements.
 */

import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Save, X, ImageIcon, Pencil, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ClaimMapping, ClaimElement, Annotation, ScreenshotBrief, infringementApi } from '@/services/infringementApi';
import { PdfRegionViewer, CaptureMeta } from './PdfRegionViewer';
import { ScreenshotAnnotator, AnnotationOverlay } from './ScreenshotAnnotator';
import { HighlightedText, colorsInText } from './HighlightedText';
import { toMediaUrl } from '@/domains/infringement/lib/mediaUrl';
import { Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface EvidenceMapperProps {
  caseId: string;
  evidenceId: string;
}

interface PendingCapture {
  blob: Blob;
  previewUrl: string;
  meta: CaptureMeta;
}

function unwrap<T>(data: any): T[] {
  return Array.isArray(data) ? data : (data?.results ?? []);
}

export function EvidenceMapper({ caseId, evidenceId }: EvidenceMapperProps) {
  const router = useRouter();
  const workbenchRef = useRef<HTMLDivElement>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [evidenceTitle, setEvidenceTitle] = useState('');
  const [mappings, setMappings] = useState<ClaimMapping[]>([]);
  // Claim numbers this evidence was tagged with (Evidence.related_claims); the claims pane
  // is scoped to these so the analyst only maps regions to the relevant claims.
  const [relatedClaims, setRelatedClaims] = useState<string[]>([]);
  const [showAllClaims, setShowAllClaims] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [termColors, setTermColors] = useState<Record<string, string>>({});
  const [coloring, setColoring] = useState(false);
  const [editingTerms, setEditingTerms] = useState(false);
  const [newTerm, setNewTerm] = useState('');
  // Externally-activated draw color for the annotator (set by clicking a claim term).
  const [activeColor, setActiveColor] = useState<{ color: string } | null>(null);
  const [selectedElements, setSelectedElements] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState<PendingCapture | null>(null);
  const [pendingAnnotations, setPendingAnnotations] = useState<Annotation[]>([]);
  const [caption, setCaption] = useState('');
  const [saving, setSaving] = useState(false);
  // Re-open a saved screenshot to edit its annotations.
  const [editShot, setEditShot] = useState<ScreenshotBrief | null>(null);
  const [editAnnotations, setEditAnnotations] = useState<Annotation[]>([]);
  const [editSaving, setEditSaving] = useState(false);

  const loadMappings = useCallback(async () => {
    const res = await infringementApi.getClaimMappings({ case: caseId });
    if (res.success) setMappings(unwrap<ClaimMapping>(res.data));
  }, [caseId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      const evRes = await infringementApi.getEvidenceItem(evidenceId);
      if (cancelled) return;
      if (!evRes.success || !evRes.data?.file) {
        setError('This evidence has no uploaded file to view.');
        setLoading(false);
        return;
      }
      setFileUrl(toMediaUrl(evRes.data.file));
      setEvidenceTitle(evRes.data.title);
      setRelatedClaims((evRes.data.related_claims || []).map((c: any) => String(c)));
      await loadMappings();
      // Load case-wide claim-term colors (auto-extract once if none yet).
      const caseRes = await infringementApi.getCase(caseId);
      if (!cancelled && caseRes.success) {
        const tc = caseRes.data?.claim_term_colors || {};
        if (Object.keys(tc).length === 0) {
          const ex = await infringementApi.extractClaimTerms(caseId);
          if (!cancelled && ex.success) setTermColors(ex.data?.claim_term_colors || {});
        } else {
          setTermColors(tc);
        }
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [evidenceId, caseId, loadMappings]);

  // element id → element (for resolving a screenshot's mapped elements to term colors)
  const elementsById = useMemo(() => {
    const m = new Map<string, ClaimElement>();
    mappings.forEach((mp) => (mp.elements || []).forEach((el) => m.set(el.id, el)));
    return m;
  }, [mappings]);

  // Union of term-colors appearing in the given elements' text (drives the annotator palette).
  const colorsForElements = useCallback((ids: string[]): string[] => {
    const out: string[] = [];
    ids.forEach((id) => {
      const el = elementsById.get(id);
      if (!el) return;
      colorsInText(el.element_text || '', termColors).forEach((c) => { if (!out.includes(c)) out.push(c); });
    });
    return out;
  }, [elementsById, termColors]);

  const recolorTerms = async () => {
    setColoring(true);
    try {
      const ex = await infringementApi.extractClaimTerms(caseId);
      if (ex.success) { setTermColors(ex.data?.claim_term_colors || {}); toast.success('Claim terms colored'); }
      else toast.error('Failed to color terms');
    } catch { toast.error('Failed to color terms'); }
    finally { setColoring(false); }
  };

  const overrideTermColor = async (term: string, color: string) => {
    setTermColors((prev) => ({ ...prev, [term]: color })); // optimistic
    try { await infringementApi.setClaimTermColor(caseId, term, color); }
    catch { toast.error('Failed to update color'); }
  };

  const removeTerm = async (term: string) => {
    try {
      const res = await infringementApi.removeClaimTerm(caseId, term);
      if (res.success) setTermColors(res.data?.claim_term_colors || {});
    } catch { toast.error('Failed to remove term'); }
  };

  const renameTerm = async (term: string, next: string) => {
    const v = next.trim().toLowerCase();
    if (!v || v === term) return;
    try {
      const res = await infringementApi.renameClaimTerm(caseId, term, v);
      if (res.success) setTermColors(res.data?.claim_term_colors || {});
    } catch { toast.error('Failed to rename term'); }
  };

  const addTerm = async () => {
    const v = newTerm.trim();
    if (!v) return;
    try {
      const res = await infringementApi.addClaimTerm(caseId, v);
      if (res.success) { setTermColors(res.data?.claim_term_colors || {}); setNewTerm(''); }
    } catch { toast.error('Failed to add term'); }
  };

  const toggleElement = (id: string) => {
    setSelectedElements((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleCapture = useCallback((blob: Blob, meta: CaptureMeta) => {
    setPending((prev) => {
      if (prev) URL.revokeObjectURL(prev.previewUrl);
      return { blob, previewUrl: URL.createObjectURL(blob), meta };
    });
    // Pre-fill provenance (source PDF + page); analyst can edit before saving.
    setCaption(`${evidenceTitle} — p.${meta.page}`);
    setPendingAnnotations([]);
    setActiveColor(null);
  }, [evidenceTitle]);

  const discardPending = () => {
    if (pending) URL.revokeObjectURL(pending.previewUrl);
    setPending(null);
    setCaption('');
    setPendingAnnotations([]);
  };

  // Remove a screenshot from a single element: unmap it; if it then maps to nothing,
  // delete the screenshot entirely.
  const removeScreenshotFromElement = async (
    screenshot: { id: string; claim_elements?: string[] },
    elementId: string,
  ) => {
    const remaining = (screenshot.claim_elements || []).filter((id) => id !== elementId);
    try {
      if (remaining.length === 0) {
        await infringementApi.deleteScreenshot(screenshot.id);
      } else {
        await infringementApi.updateScreenshot(screenshot.id, { claim_elements: remaining });
      }
      toast.success('Screenshot removed');
      await loadMappings();
    } catch {
      toast.error('Failed to remove screenshot');
    }
  };

  const saveCapture = async () => {
    if (!pending || selectedElements.size === 0) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('image', pending.blob, `screenshot-p${pending.meta.page}.png`);
      fd.append('evidence', evidenceId);
      fd.append('page_number', String(pending.meta.page));
      fd.append('bbox_x', String(pending.meta.bbox.x));
      fd.append('bbox_y', String(pending.meta.bbox.y));
      fd.append('bbox_width', String(pending.meta.bbox.width));
      fd.append('bbox_height', String(pending.meta.bbox.height));
      if (caption.trim()) fd.append('caption', caption.trim());
      selectedElements.forEach((id) => fd.append('claim_elements', id));

      const res = await infringementApi.createScreenshot(fd);
      if (res.success) {
        // Annotations are a JSON list — set them via a follow-up PATCH (multipart can't
        // reliably carry the nested array).
        if (res.data?.id && pendingAnnotations.length > 0) {
          await infringementApi.updateScreenshot(res.data.id, { annotations: pendingAnnotations });
        }
        toast.success(`Screenshot saved to ${selectedElements.size} element(s)`);
        discardPending();
        await loadMappings(); // refresh thumbnails
      } else {
        toast.error('Failed to save screenshot');
      }
    } catch {
      toast.error('Failed to save screenshot');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (s: ScreenshotBrief) => {
    setEditShot(s);
    setEditAnnotations(s.annotations || []);
    setActiveColor(null);
  };
  const saveEdit = async () => {
    if (!editShot) return;
    setEditSaving(true);
    try {
      const res = await infringementApi.updateScreenshot(editShot.id, { annotations: editAnnotations });
      if (res.success) {
        toast.success('Annotations saved');
        setEditShot(null);
        await loadMappings();
      } else {
        toast.error('Failed to save annotations');
      }
    } catch {
      toast.error('Failed to save annotations');
    } finally {
      setEditSaving(false);
    }
  };

  const selectedCount = selectedElements.size;
  // Scope the claims pane to this evidence's related claims (unless the analyst opts to
  // show all, or the evidence has none tagged / none of them match the case's mappings).
  const visibleMappings = useMemo(() => {
    if (showAllClaims || relatedClaims.length === 0) return mappings;
    const set = new Set(relatedClaims.map(String));
    const filtered = mappings.filter((m) => set.has(String(m.claim_number)));
    return filtered.length ? filtered : mappings;
  }, [mappings, relatedClaims, showAllClaims]);
  const isScoped = visibleMappings.length !== mappings.length;
  const totalElements = useMemo(
    () => visibleMappings.reduce((n, m) => n + (m.elements?.length || 0), 0),
    [visibleMappings]
  );

  return (
    <div ref={workbenchRef} className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2 border-b shrink-0">
        <Button variant="ghost" size="sm" onClick={() => router.push(`/dashboard/infringement/${caseId}`)}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold truncate">Evidence Mapper — {evidenceTitle}</h1>
          <p className="text-xs text-muted-foreground">
            Select claim element(s) on the left, then drag a region on the PDF to capture it.
          </p>
        </div>
        {selectedCount > 0 && (
          <Badge variant="secondary">{selectedCount} element{selectedCount === 1 ? '' : 's'} selected</Badge>
        )}
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading…
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center text-sm text-red-600">{error}</div>
      ) : (
        <div className="flex-1 flex min-h-0">
          {/* Left: claim elements */}
          <div className="w-96 border-r p-3 flex flex-col shrink-0 min-h-0">
            {/* Claim-term color legend + recolor (pinned at top) */}
            <div className="border rounded-md p-2 bg-muted/20">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-neutral-700">Claim terms</span>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setEditingTerms((v) => !v)}>
                    <Pencil className="h-3 w-3 mr-1" />{editingTerms ? 'Done' : 'Edit'}
                  </Button>
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={recolorTerms} disabled={coloring}>
                    {coloring ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Sparkles className="h-3 w-3 mr-1" />}
                    Auto-color
                  </Button>
                </div>
              </div>

              {editingTerms ? (
                <div className="space-y-1">
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {Object.entries(termColors).map(([term, color]) => (
                      <div key={term} className="flex items-center gap-1.5">
                        <label className="relative h-4 w-4 rounded-full border cursor-pointer shrink-0" style={{ backgroundColor: color }} title="Recolor">
                          <input type="color" value={color} onChange={(e) => overrideTermColor(term, e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
                        </label>
                        <input
                          defaultValue={term}
                          onBlur={(e) => renameTerm(term, e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                          className="flex-1 min-w-0 h-6 rounded border border-input bg-white px-1.5 text-xs"
                          title="Edit term (rename / merge into an existing term)"
                        />
                        <button type="button" onClick={() => removeTerm(term)} title="Remove term" className="text-neutral-400 hover:text-red-600 shrink-0">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-1 pt-1 border-t">
                    <Input
                      value={newTerm}
                      onChange={(e) => setNewTerm(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') addTerm(); }}
                      placeholder="Add a term…"
                      className="h-6 text-xs"
                    />
                    <Button size="sm" className="h-6 px-2 text-xs" onClick={addTerm} disabled={!newTerm.trim()}>
                      <Plus className="h-3 w-3 mr-1" />Add
                    </Button>
                  </div>
                </div>
              ) : Object.keys(termColors).length === 0 ? (
                <p className="text-[11px] text-muted-foreground">No terms yet — click Auto-color.</p>
              ) : (
                <div className="max-h-28 overflow-y-auto flex flex-wrap gap-1">
                  {Object.entries(termColors).map(([term, color]) => (
                    <span key={term} className="inline-flex items-center gap-1 text-[11px] rounded border px-1 py-0.5 bg-white">
                      <label className="relative h-3 w-3 rounded-full cursor-pointer" style={{ backgroundColor: color }} title="Recolor">
                        <input
                          type="color"
                          value={color}
                          onChange={(e) => overrideTermColor(term, e.target.value)}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </label>
                      {term}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Related-claims scope notice + toggle */}
            {relatedClaims.length > 0 && (
              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {isScoped
                    ? `Showing ${visibleMappings.length} claim${visibleMappings.length === 1 ? '' : 's'} related to this evidence`
                    : 'Showing all claims'}
                </span>
                <button
                  type="button"
                  onClick={() => setShowAllClaims((v) => !v)}
                  className="text-cyan-600 hover:underline"
                >
                  {showAllClaims ? 'Show related only' : 'Show all claims'}
                </button>
              </div>
            )}

            {/* Claims list — own scroll area so the terms box stays pinned above */}
            <div className="flex-1 min-h-0 overflow-y-auto space-y-4 mt-3">
            {totalElements === 0 && (
              <p className="text-sm text-muted-foreground">
                No claim elements yet. Parse/import claims in the Claim Chart tab first.
              </p>
            )}
            {visibleMappings.map((m) => (
              <div key={m.id}>
                <div className="text-xs font-semibold text-muted-foreground mb-1">Claim {m.claim_number}</div>
                <div className="space-y-1">
                  {(m.elements || []).map((el) => {
                    const label = `${m.claim_number}.${el.element_order}`;
                    const checked = selectedElements.has(el.id);
                    return (
                      <div
                        key={el.id}
                        className={`rounded-md border p-2 ${checked ? 'border-cyan-500 bg-cyan-50' : 'border-neutral-200'}`}
                      >
                        <label className="flex items-start gap-2 cursor-pointer">
                          <input type="checkbox" className="mt-1 rounded" checked={checked} onChange={() => toggleElement(el.id)} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="font-mono text-xs">{label}</Badge>
                              {el.screenshots && el.screenshots.length > 0 && (
                                <span className="text-xs text-muted-foreground inline-flex items-center gap-0.5">
                                  <ImageIcon className="h-3 w-3" />{el.screenshots.length}
                                </span>
                              )}
                            </div>
                            <p className="text-xs mt-1 line-clamp-3">
                              <HighlightedText text={el.element_text} termColors={termColors} />
                            </p>
                          </div>
                        </label>
                        {el.screenshots && el.screenshots.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2 pl-6">
                            {el.screenshots.map((s) => (
                              <div key={s.id} className="relative group/thumb">
                                <button
                                  type="button"
                                  onClick={() => openEdit(s)}
                                  title={`${s.caption || s.evidence_title || 'Screenshot'} · p.${s.page_number} — click to annotate`}
                                  className="block relative"
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={toMediaUrl(s.image)} alt="evidence" className="h-12 w-auto rounded border hover:ring-2 ring-cyan-400" />
                                  <AnnotationOverlay annotations={s.annotations} />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeScreenshotFromElement(s, el.id); }}
                                  title="Remove this screenshot from this element"
                                  className="absolute -top-1.5 -right-1.5 hidden group-hover/thumb:flex items-center justify-center h-4 w-4 rounded-full bg-red-600 text-white shadow z-10"
                                >
                                  <X className="h-2.5 w-2.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            </div>
          </div>

          {/* Right: PDF viewer */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex-1 min-h-0">
              {fileUrl && <PdfRegionViewer fileUrl={fileUrl} onCapture={handleCapture} fullscreenRef={workbenchRef} />}
            </div>
          </div>
        </div>
      )}

      {/* Centered capture-confirm overlay */}
      {pending && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onMouseDown={discardPending}
        >
          <div
            className="w-[64rem] max-w-[95vw] max-h-[92vh] overflow-y-auto rounded-lg border bg-white shadow-xl p-3"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-2">
              <span className="text-xs font-semibold text-neutral-700">Captured region · page {pending.meta.page} — mark it up below</span>
              <button className="text-neutral-400 hover:text-neutral-700" onClick={discardPending} disabled={saving}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <ScreenshotAnnotator
              imageUrl={pending.previewUrl}
              value={pendingAnnotations}
              onChange={setPendingAnnotations}
              allowedColors={colorsForElements(Array.from(selectedElements))}
              activeColor={activeColor}
              className="mb-2"
            />
            <Input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Caption (optional)"
              className="h-8 mb-2"
            />

            {/* Map to claim element(s) — picker lives in the overlay so it works even
                though the modal covers the left panel. */}
            <p className="text-xs font-medium text-neutral-700 mb-1">Map to claim element(s):</p>
            {totalElements === 0 ? (
              <p className="text-xs text-muted-foreground mb-2">No claim elements yet — add them in the Claim Chart tab.</p>
            ) : (
              <div className="max-h-40 overflow-y-auto border rounded-md p-1.5 mb-2 space-y-0.5">
                {visibleMappings.map((m) =>
                  (m.elements || []).map((el) => {
                    const label = `${m.claim_number}.${el.element_order}`;
                    return (
                      <div key={el.id} className="flex items-start gap-2 px-1 py-0.5 rounded hover:bg-muted/60">
                        <input
                          type="checkbox"
                          className="mt-0.5 rounded cursor-pointer"
                          checked={selectedElements.has(el.id)}
                          onChange={() => toggleElement(el.id)}
                        />
                        <button type="button" onClick={() => toggleElement(el.id)} className="shrink-0">
                          <Badge variant="outline" className="font-mono text-[10px] cursor-pointer">{label}</Badge>
                        </button>
                        <span className="text-xs">
                          <HighlightedText
                            text={el.element_text}
                            termColors={termColors}
                            onTermClick={(c) => setActiveColor({ color: c })}
                          />
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            )}
            <p className="text-xs text-muted-foreground mb-2">
              {selectedCount === 0 ? 'Select at least one element above.' : `Maps to ${selectedCount} element(s) · page ${pending.meta.page}`}
            </p>

            <div className="flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={discardPending} disabled={saving}>Discard</Button>
              <Button size="sm" onClick={saveCapture} disabled={saving || selectedCount === 0}>
                {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                Save
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit annotations on an existing screenshot */}
      {editShot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onMouseDown={() => setEditShot(null)}>
          <div className="w-[64rem] max-w-[95vw] max-h-[92vh] overflow-y-auto rounded-lg border bg-white shadow-xl p-3" onMouseDown={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-2">
              <span className="text-xs font-semibold text-neutral-700">
                Annotate · {editShot.caption || editShot.evidence_title || 'Screenshot'} · p.{editShot.page_number}
              </span>
              <button className="text-neutral-400 hover:text-neutral-700" onClick={() => setEditShot(null)} disabled={editSaving}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <ScreenshotAnnotator
              imageUrl={toMediaUrl(editShot.image)}
              value={editAnnotations}
              onChange={setEditAnnotations}
              allowedColors={colorsForElements(editShot.claim_elements || [])}
              activeColor={activeColor}
              className="mb-2"
            />
            {/* Mapped claim element(s) — click a colored term to draw in its color. */}
            {(editShot.claim_elements || []).length > 0 && (
              <div className="border rounded-md p-2 mb-2 max-h-32 overflow-y-auto space-y-1">
                <p className="text-[11px] font-medium text-neutral-600">Mapped claim element(s) — click a term to use its color:</p>
                {(editShot.claim_elements || []).map((id) => {
                  const el = elementsById.get(id);
                  if (!el) return null;
                  return (
                    <p key={id} className="text-xs">
                      <HighlightedText
                        text={el.element_text}
                        termColors={termColors}
                        onTermClick={(c) => setActiveColor({ color: c })}
                      />
                    </p>
                  );
                })}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={() => setEditShot(null)} disabled={editSaving}>Cancel</Button>
              <Button size="sm" onClick={saveEdit} disabled={editSaving}>
                {editSaving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
