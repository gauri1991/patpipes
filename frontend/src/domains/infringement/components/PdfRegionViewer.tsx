'use client';

/**
 * Renders a PDF with pdf.js to a canvas (page nav + zoom) and lets the user drag a
 * rectangle to capture that region as a PNG. The crop is taken from the rendered canvas
 * (no cross-origin <img>, so the canvas is never tainted). Reports the PNG blob plus the
 * page number and a normalized bbox (0-1) via onCapture.
 *
 * Must be used client-side only (dynamic import with ssr:false) — pdf.js touches window.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ChevronDown, ZoomIn, ZoomOut, Loader2, AlertCircle, Maximize2, Minimize2 } from 'lucide-react';

export interface CaptureMeta {
  page: number;
  bbox: { x: number; y: number; width: number; height: number }; // normalized 0-1
}

export interface RegionHighlight {
  page: number;
  bbox: { x: number; y: number; width: number; height: number };
}

interface PdfRegionViewerProps {
  fileUrl: string;
  onCapture: (blob: Blob, meta: CaptureMeta) => void;
  highlight?: RegionHighlight | null;
  // Optional element to fullscreen instead of just the viewer (e.g. the whole workbench).
  fullscreenRef?: React.RefObject<HTMLElement | null>;
}

type Rect = { x: number; y: number; w: number; h: number };

export function PdfRegionViewer({ fileUrl, onCapture, highlight, fullscreenRef }: PdfRegionViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pdfRef = useRef<any>(null);
  const renderTaskRef = useRef<any>(null);
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const baseSize = useRef<{ w: number; h: number }>({ w: 0, h: 0 }); // page dims at scale=1

  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(1);
  const [scale, setScale] = useState(1.3);
  const [fitMode, setFitMode] = useState<'width' | 'page' | null>(null);
  const [zoomText, setZoomText] = useState('130%');
  const [zoomOpen, setZoomOpen] = useState(false);
  const zoomBoxRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sel, setSel] = useState<Rect | null>(null);
  const [canvasSize, setCanvasSize] = useState({ w: 0, h: 0 });

  const ZOOM_PRESETS = ['Fit Width', 'Fit Page', '50%', '75%', '100%', '125%', '150%', '200%', '300%'];

  // Load the PDF document.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const pdfjs: any = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
        const res = await fetch(fileUrl);
        if (!res.ok) throw new Error(`Could not load PDF (${res.status})`);
        const buf = await res.arrayBuffer();
        if (cancelled) return;
        const doc = await pdfjs.getDocument({ data: buf }).promise;
        if (cancelled) return;
        pdfRef.current = doc;
        setNumPages(doc.numPages);
        setPage(1);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load PDF');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [fileUrl]);

  // Render the current page to the canvas.
  const renderPage = useCallback(async () => {
    const doc = pdfRef.current;
    const canvas = canvasRef.current;
    if (!doc || !canvas) return;
    try {
      if (renderTaskRef.current) {
        try { renderTaskRef.current.cancel(); } catch { /* noop */ }
      }
      const pdfPage = await doc.getPage(page);
      const base = pdfPage.getViewport({ scale: 1 });
      baseSize.current = { w: base.width, h: base.height };
      const dpr = window.devicePixelRatio || 1;
      const viewport = pdfPage.getViewport({ scale });
      const cssW = Math.floor(viewport.width);
      const cssH = Math.floor(viewport.height);
      canvas.width = Math.floor(viewport.width * dpr);
      canvas.height = Math.floor(viewport.height * dpr);
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      const ctx = canvas.getContext('2d')!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const task = pdfPage.render({ canvasContext: ctx, viewport });
      renderTaskRef.current = task;
      await task.promise;
      setCanvasSize({ w: cssW, h: cssH });
      setSel(null);
    } catch (e: any) {
      if (e?.name !== 'RenderingCancelledException') {
        setError(e?.message || 'Failed to render page');
      }
    }
  }, [page, scale]);

  useEffect(() => { renderPage(); }, [renderPage, numPages]);

  // Jump to a highlighted region's page when requested.
  useEffect(() => {
    if (highlight && highlight.page && highlight.page !== page) setPage(highlight.page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlight]);

  // Compute the scale for a fit mode from the page's base size and the scroll area.
  const computeFitScale = useCallback((mode: 'width' | 'page') => {
    const el = scrollRef.current;
    const { w, h } = baseSize.current;
    if (!el || !w || !h) return null;
    const pad = 32; // p-4 on each side
    const availW = el.clientWidth - pad;
    const availH = el.clientHeight - pad;
    const widthScale = availW / w;
    return mode === 'width' ? widthScale : Math.min(widthScale, availH / h);
  }, []);

  // Re-apply fit when fit mode is active and the container resizes.
  useEffect(() => {
    if (!fitMode) return;
    const apply = () => {
      const s = computeFitScale(fitMode);
      if (s && Math.abs(s - scale) > 0.005) setScale(+s.toFixed(3));
    };
    apply();
    const el = scrollRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, [fitMode, computeFitScale, scale, canvasSize.w]);

  // Keep the zoom box label in sync with the actual zoom.
  useEffect(() => {
    setZoomText(fitMode === 'width' ? 'Fit Width' : fitMode === 'page' ? 'Fit Page' : `${Math.round(scale * 100)}%`);
  }, [scale, fitMode]);

  const setZoomPercent = (pct: number) => {
    setFitMode(null);
    setScale(Math.max(0.25, Math.min(4, +(pct / 100).toFixed(3))));
  };

  // Parse a typed/selected zoom value: "fit width", "fit page", "125%", "125".
  const applyZoomText = (raw: string) => {
    const v = raw.trim().toLowerCase();
    if (v.startsWith('fit w')) { setFitMode('width'); return; }
    if (v.startsWith('fit p')) { setFitMode('page'); return; }
    const num = parseFloat(v.replace('%', ''));
    if (!isNaN(num) && num > 0) setZoomPercent(num);
    else setZoomText(fitMode ? (fitMode === 'width' ? 'Fit Width' : 'Fit Page') : `${Math.round(scale * 100)}%`);
  };

  const bumpZoom = (delta: number) => setZoomPercent(Math.round(scale * 100) + delta);

  // Close the zoom dropdown on outside click.
  useEffect(() => {
    if (!zoomOpen) return;
    const onDown = (e: MouseEvent) => {
      if (zoomBoxRef.current && !zoomBoxRef.current.contains(e.target as Node)) setZoomOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [zoomOpen]);

  // Fullscreen the whole workbench when a fullscreenRef is provided, else just the viewer.
  useEffect(() => {
    const target = () => fullscreenRef?.current ?? containerRef.current;
    const onChange = () => setIsFullscreen(!!document.fullscreenElement && document.fullscreenElement === target());
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, [fullscreenRef]);

  const toggleFullscreen = () => {
    const target = fullscreenRef?.current ?? containerRef.current;
    if (!document.fullscreenElement) {
      target?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  const posInCanvas = (e: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(e.clientX - rect.left, rect.width)),
      y: Math.max(0, Math.min(e.clientY - rect.top, rect.height)),
    };
  };

  const onMouseDown = (e: React.MouseEvent) => {
    const p = posInCanvas(e);
    dragStart.current = p;
    setSel({ x: p.x, y: p.y, w: 0, h: 0 });
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragStart.current) return;
    const p = posInCanvas(e);
    const s = dragStart.current;
    setSel({ x: Math.min(s.x, p.x), y: Math.min(s.y, p.y), w: Math.abs(p.x - s.x), h: Math.abs(p.y - s.y) });
  };
  const onMouseUp = () => {
    const s = sel;
    dragStart.current = null;
    if (!s || s.w < 8 || s.h < 8) { setSel(null); return; }
    captureRegion(s);
  };

  // Capture the selected region at HIGH resolution: re-render the page at a large scale
  // (independent of the on-screen zoom) and crop from that, so the saved PNG stays crisp
  // when resized/enlarged later in EoU claim charts.
  const CAPTURE_SCALE = 4; // ~4x PDF points → sharp crops
  const captureRegion = async (s: Rect) => {
    const canvas = canvasRef.current;
    const doc = pdfRef.current;
    if (!canvas || !doc) return;

    // Normalized region from the displayed canvas (zoom-independent).
    const bbox = {
      x: s.x / canvas.clientWidth,
      y: s.y / canvas.clientHeight,
      width: s.w / canvas.clientWidth,
      height: s.h / canvas.clientHeight,
    };
    setSel(null);

    try {
      const pdfPage = await doc.getPage(page);
      const vp = pdfPage.getViewport({ scale: CAPTURE_SCALE });
      const hq = document.createElement('canvas');
      hq.width = Math.ceil(vp.width);
      hq.height = Math.ceil(vp.height);
      await pdfPage.render({ canvasContext: hq.getContext('2d')!, viewport: vp }).promise;

      const sx = bbox.x * hq.width;
      const sy = bbox.y * hq.height;
      const sw = bbox.width * hq.width;
      const sh = bbox.height * hq.height;
      const off = document.createElement('canvas');
      off.width = Math.max(1, Math.round(sw));
      off.height = Math.max(1, Math.round(sh));
      off.getContext('2d')!.drawImage(hq, sx, sy, sw, sh, 0, 0, off.width, off.height);
      off.toBlob((blob) => {
        if (blob) onCapture(blob, { page, bbox });
      }, 'image/png');
    } catch {
      // best-effort; selection already cleared
    }
  };

  const showHighlight = highlight && highlight.page === page;

  return (
    <div ref={containerRef} className="flex flex-col h-full bg-white">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b bg-muted/40">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs tabular-nums w-20 text-center">
            {numPages ? `${page} / ${numPages}` : '—'}
          </span>
          <Button variant="ghost" size="sm" disabled={page >= numPages} onClick={() => setPage((p) => Math.min(numPages, p + 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <span className="text-xs text-muted-foreground">Drag on the page to capture a region</span>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => bumpZoom(-10)} title="Zoom out">
            <ZoomOut className="h-4 w-4" />
          </Button>
          {/* Editable zoom combo box with presets (Fit Width / Fit Page / %). */}
          <div ref={zoomBoxRef} className="relative">
            <div className="flex items-center h-7 rounded border border-input bg-background">
              <input
                value={zoomText}
                onChange={(e) => setZoomText(e.target.value)}
                onFocus={() => setZoomOpen(true)}
                onBlur={(e) => applyZoomText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { applyZoomText((e.target as HTMLInputElement).value); setZoomOpen(false); (e.target as HTMLInputElement).blur(); }
                  if (e.key === 'Escape') setZoomOpen(false);
                }}
                className="h-full w-16 bg-transparent px-2 text-xs text-center focus:outline-none"
                aria-label="Zoom"
              />
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); setZoomOpen((o) => !o); }}
                className="px-1 text-muted-foreground hover:text-foreground"
                aria-label="Zoom presets"
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </div>
            {zoomOpen && (
              <div className="absolute right-0 z-50 mt-1 w-32 rounded-md border bg-white shadow-lg py-1">
                {ZOOM_PRESETS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); applyZoomText(p); setZoomOpen(false); }}
                    className="block w-full text-left px-3 py-1 text-xs hover:bg-muted"
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={() => bumpZoom(10)} title="Zoom in">
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={toggleFullscreen} title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Canvas area */}
      <div ref={scrollRef} className="flex-1 overflow-auto bg-neutral-100 flex justify-center p-4">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground self-center">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading PDF…
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 text-sm text-red-600 self-center">
            <AlertCircle className="h-4 w-4" /> {error}
          </div>
        ) : (
          <div
            className="relative inline-block shadow-md select-none"
            style={{ width: canvasSize.w || undefined, height: canvasSize.h || undefined }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={() => { if (dragStart.current) onMouseUp(); }}
          >
            <canvas ref={canvasRef} className="block cursor-crosshair" />
            {/* live selection rectangle */}
            {sel && (
              <div
                className="absolute border-2 border-cyan-500 bg-cyan-500/15 pointer-events-none"
                style={{ left: sel.x, top: sel.y, width: sel.w, height: sel.h }}
              />
            )}
            {/* persistent highlight (e.g. when jumping to a saved screenshot) */}
            {showHighlight && (
              <div
                className="absolute border-2 border-amber-500 bg-amber-400/20 pointer-events-none animate-pulse"
                style={{
                  left: highlight!.bbox.x * canvasSize.w,
                  top: highlight!.bbox.y * canvasSize.h,
                  width: highlight!.bbox.width * canvasSize.w,
                  height: highlight!.bbox.height * canvasSize.h,
                }}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
