'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CaptureMeta } from './PdfRegionViewer';

interface ImageRegionViewerProps {
  imageUrl: string;
  onCapture: (blob: Blob, meta: CaptureMeta) => void;
  fullscreenRef?: React.RefObject<HTMLElement | null>;
}

interface DragRect { x: number; y: number; w: number; h: number }

export function ImageRegionViewer({ imageUrl, onCapture, fullscreenRef }: ImageRegionViewerProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [rect, setRect] = useState<DragRect | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const startRef = useRef<{ x: number; y: number } | null>(null);

  // Fullscreen support (same pattern as PdfRegionViewer)
  useEffect(() => {
    const target = () => fullscreenRef?.current ?? containerRef.current;
    const onChange = () =>
      setIsFullscreen(!!document.fullscreenElement && document.fullscreenElement === target());
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, [fullscreenRef]);

  const toggleFullscreen = () => {
    const target = fullscreenRef?.current ?? containerRef.current;
    if (!document.fullscreenElement) target?.requestFullscreen?.();
    else document.exitFullscreen?.();
  };

  function getRelativePos(e: React.MouseEvent) {
    const bounds = imgRef.current!.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(e.clientX - bounds.left, bounds.width)),
      y: Math.max(0, Math.min(e.clientY - bounds.top, bounds.height)),
    };
  }

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const pos = getRelativePos(e);
    startRef.current = pos;
    setRect({ x: pos.x, y: pos.y, w: 0, h: 0 });
    setDragging(true);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging || !startRef.current) return;
    const pos = getRelativePos(e);
    setRect({
      x: Math.min(pos.x, startRef.current.x),
      y: Math.min(pos.y, startRef.current.y),
      w: Math.abs(pos.x - startRef.current.x),
      h: Math.abs(pos.y - startRef.current.y),
    });
  };

  const cropAndCapture = useCallback(async (rx: number, ry: number, rw: number, rh: number) => {
    const img = imgRef.current!;
    const bounds = img.getBoundingClientRect();
    const scaleX = img.naturalWidth / bounds.width;
    const scaleY = img.naturalHeight / bounds.height;

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(rw * scaleX);
    canvas.height = Math.round(rh * scaleY);
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, rx * scaleX, ry * scaleY, rw * scaleX, rh * scaleY, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (!blob) return;
      onCapture(blob, {
        page: 1,
        bbox: {
          x: rx / bounds.width,
          y: ry / bounds.height,
          width: rw / bounds.width,
          height: rh / bounds.height,
        },
      });
    }, 'image/png');
  }, [onCapture]);

  const onMouseUp = useCallback(async (e: React.MouseEvent) => {
    if (!dragging) return;
    setDragging(false);
    const pos = getRelativePos(e);
    if (!startRef.current) return;
    const rx = Math.min(pos.x, startRef.current.x);
    const ry = Math.min(pos.y, startRef.current.y);
    const rw = Math.abs(pos.x - startRef.current.x);
    const rh = Math.abs(pos.y - startRef.current.y);
    if (rw < 10 || rh < 10) { setRect(null); return; }
    await cropAndCapture(rx, ry, rw, rh);
    setRect(null);
  }, [dragging, cropAndCapture]);

  // Map the entire image without cropping
  const captureFullImage = () => {
    const img = imgRef.current!;
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      onCapture(blob, { page: 1, bbox: { x: 0, y: 0, width: 1, height: 1 } });
    }, 'image/png');
  };

  return (
    <div ref={containerRef} className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b bg-muted/30 shrink-0 text-xs text-muted-foreground">
        <span>Drag to select a region, or map the full image</span>
        <div className="ml-auto flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={captureFullImage}>
            <Maximize2 className="h-3.5 w-3.5 mr-1" />
            Map Full Image
          </Button>
          <Button variant="ghost" size="sm" onClick={toggleFullscreen} title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Image canvas */}
      <div className="flex-1 overflow-auto flex items-start justify-center bg-neutral-100 p-4 min-h-0">
        <div
          className="relative select-none"
          style={{ cursor: 'crosshair' }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={() => { if (dragging) { setDragging(false); setRect(null); } }}
        >
          {/* crossOrigin="anonymous" lets the canvas read pixel data without tainting */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={imageUrl}
            alt="Evidence screenshot"
            crossOrigin="anonymous"
            className="max-w-full block shadow-md"
            draggable={false}
          />

          {/* Selection overlay */}
          {rect && rect.w > 0 && rect.h > 0 && (
            <div
              className="absolute pointer-events-none border-2 border-cyan-500"
              style={{
                left: rect.x,
                top: rect.y,
                width: rect.w,
                height: rect.h,
                background: 'rgba(0,217,255,0.08)',
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.35)',
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
