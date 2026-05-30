'use client';

/**
 * Vector annotation of a screenshot crop for EoU exhibits.
 *  - <AnnotationOverlay/>   read-only SVG render (thumbnails, exhibits)
 *  - <ScreenshotAnnotator/> editor: Line/Arrow (two clicks) + Box (drag), with selectable
 *    color, thickness and line style (solid/dashed/dotted). In Select mode, click a mark to
 *    edit its style. Last-used style persists as the default for new marks.
 *
 * All coordinates are normalized 0-1 to the image, so marks scale crisply at any size.
 */

import { useEffect, useRef, useState } from 'react';
import { MousePointer, Minus, ArrowUpRight, Square, Trash2, Eraser } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Annotation } from '@/services/infringementApi';

const DEFAULT_COLOR = '#ef4444';
const PALETTE = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#000000'];
const THICKNESSES = [1, 2, 3, 4, 6, 8];
type LineStyle = 'solid' | 'dashed' | 'dotted';
const DEFAULTS_KEY = 'eou-annot-defaults';

// --- style helpers --------------------------------------------------------
function dashArray(style: LineStyle | undefined, stroke: number): string | undefined {
  if (style === 'dashed') return `${stroke * 3} ${stroke * 2}`;
  if (style === 'dotted') return `${stroke} ${stroke * 1.6}`;
  return undefined; // solid
}

// --- measure helper -------------------------------------------------------
function useSize() {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, size };
}

// --- shared SVG renderer (pixel space) ------------------------------------
function arrowHead(x2: number, y2: number, angle: number, size: number) {
  const a1 = angle + Math.PI - Math.PI / 7;
  const a2 = angle + Math.PI + Math.PI / 7;
  return `${x2},${y2} ${x2 + size * Math.cos(a1)},${y2 + size * Math.sin(a1)} ${x2 + size * Math.cos(a2)},${y2 + size * Math.sin(a2)}`;
}

function renderAnnotation(a: Annotation, w: number, h: number, opts?: { selected?: boolean; onClick?: () => void }) {
  const stroke = a.color || DEFAULT_COLOR;
  const sw = a.stroke || 3;
  const dash = dashArray(a.lineStyle, sw);
  const cap = a.lineStyle === 'dotted' ? 'round' : 'butt';
  const styleProps = {
    stroke,
    strokeWidth: opts?.selected ? sw + 1.5 : sw,
    strokeDasharray: dash,
    strokeLinecap: cap as 'round' | 'butt',
  };
  // stopPropagation so selecting a mark doesn't bubble to the canvas onClick (which deselects).
  const clickProps = opts?.onClick
    ? { onClick: (e: React.MouseEvent) => { e.stopPropagation(); opts.onClick!(); }, style: { cursor: 'pointer' as const } }
    : {};

  if (a.type === 'box') {
    return (
      <rect
        key={a.id}
        x={(a.x || 0) * w} y={(a.y || 0) * h} width={(a.w || 0) * w} height={(a.h || 0) * h}
        fill="transparent" {...styleProps} {...clickProps}
      />
    );
  }
  const x1 = (a.x1 || 0) * w, y1 = (a.y1 || 0) * h, x2 = (a.x2 || 0) * w, y2 = (a.y2 || 0) * h;
  const angle = Math.atan2(y2 - y1, x2 - x1);
  return (
    <g key={a.id} {...clickProps}>
      {opts?.onClick && <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="transparent" strokeWidth={Math.max(12, sw + 8)} />}
      <line x1={x1} y1={y1} x2={x2} y2={y2} {...styleProps} />
      {a.type === 'arrow' && <polygon points={arrowHead(x2, y2, angle, 8 + sw * 2)} fill={stroke} />}
    </g>
  );
}

// --- read-only overlay ----------------------------------------------------
export function AnnotationOverlay({
  annotations,
  activeColors,
}: {
  annotations?: Annotation[];
  activeColors?: string[];
}) {
  const { ref, size } = useSize();
  const hasFilter = activeColors && activeColors.length > 0;
  return (
    <div ref={ref} className="absolute inset-0 pointer-events-none">
      {!!(annotations && annotations.length && size.w > 0) && (
        <svg width={size.w} height={size.h} className="absolute inset-0">
          {annotations.map((a) => (
            <g key={a.id} opacity={hasFilter && !activeColors!.includes(a.color) ? 0.2 : 1}>
              {renderAnnotation(a, size.w, size.h)}
            </g>
          ))}
        </svg>
      )}
    </div>
  );
}

// --- editor ---------------------------------------------------------------
type Tool = 'select' | 'line' | 'arrow' | 'box';
interface Settings { color: string; stroke: number; lineStyle: LineStyle }

function loadDefaults(): Settings {
  if (typeof window !== 'undefined') {
    try {
      const s = JSON.parse(localStorage.getItem(DEFAULTS_KEY) || 'null');
      if (s && s.color) return { color: s.color, stroke: s.stroke || 3, lineStyle: s.lineStyle || 'solid' };
    } catch { /* ignore */ }
  }
  return { color: DEFAULT_COLOR, stroke: 3, lineStyle: 'solid' };
}

interface ScreenshotAnnotatorProps {
  imageUrl: string;
  value: Annotation[];
  onChange: (annotations: Annotation[]) => void;
  className?: string;
  // Restrict the swatch palette (e.g. to the mapped claim element's term colors).
  allowedColors?: string[];
  // Externally activate a draw color (e.g. clicking a claim term). New object each
  // request so repeated clicks of the same color re-activate.
  activeColor?: { color: string } | null;
}

export function ScreenshotAnnotator({ imageUrl, value, onChange, className, allowedColors, activeColor }: ScreenshotAnnotatorProps) {
  const palette = allowedColors && allowedColors.length > 0 ? allowedColors : PALETTE;
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [tool, setTool] = useState<Tool>('box');
  const [settings, setSettings] = useState<Settings>(loadDefaults);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [lineStart, setLineStart] = useState<{ x: number; y: number } | null>(null);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const [boxDraft, setBoxDraft] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const dragStart = useRef<{ x: number; y: number } | null>(null);

  const measure = () => { const el = wrapRef.current; if (el) setSize({ w: el.clientWidth, h: el.clientHeight }); };
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Update current style; persist as default; apply to the selected mark if any.
  const updateSettings = (patch: Partial<Settings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    try { localStorage.setItem(DEFAULTS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
    if (selectedId) onChange(value.map((a) => (a.id === selectedId ? { ...a, ...patch } : a)));
  };

  const selectMark = (id: string) => {
    setSelectedId(id);
    const a = value.find((x) => x.id === id);
    if (a) setSettings({ color: a.color, stroke: a.stroke || 3, lineStyle: a.lineStyle || 'solid' });
  };

  const norm = (e: React.MouseEvent) => {
    const r = wrapRef.current!.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min((e.clientX - r.left) / r.width, 1)),
      y: Math.max(0, Math.min((e.clientY - r.top) / r.height, 1)),
    };
  };

  const add = (a: Omit<Annotation, 'color' | 'stroke' | 'lineStyle'>) =>
    onChange([...value, { ...a, color: settings.color, stroke: settings.stroke, lineStyle: settings.lineStyle }]);
  const newId = () => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `a${Date.now()}${Math.round(performance.now())}`);

  const onMouseDown = (e: React.MouseEvent) => {
    if (tool !== 'box') return;
    dragStart.current = norm(e);
    setBoxDraft({ ...dragStart.current, w: 0, h: 0 });
  };
  const onMouseMove = (e: React.MouseEvent) => {
    const p = norm(e);
    setCursor(p);
    if (tool === 'box' && dragStart.current) {
      const s = dragStart.current;
      setBoxDraft({ x: Math.min(s.x, p.x), y: Math.min(s.y, p.y), w: Math.abs(p.x - s.x), h: Math.abs(p.y - s.y) });
    }
  };
  const onMouseUp = (e: React.MouseEvent) => {
    if (tool === 'box' && dragStart.current) {
      const s = dragStart.current; const p = norm(e);
      const x = Math.min(s.x, p.x), y = Math.min(s.y, p.y), w = Math.abs(p.x - s.x), h = Math.abs(p.y - s.y);
      dragStart.current = null; setBoxDraft(null);
      if (w > 0.01 && h > 0.01) add({ id: newId(), type: 'box', x, y, w, h });
    }
  };
  const onClick = (e: React.MouseEvent) => {
    if (tool === 'select') { setSelectedId(null); return; }
    if (tool === 'line' || tool === 'arrow') {
      const p = norm(e);
      if (!lineStart) setLineStart(p);
      else { add({ id: newId(), type: tool, x1: lineStart.x, y1: lineStart.y, x2: p.x, y2: p.y }); setLineStart(null); }
    }
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    onChange(value.filter((a) => a.id !== selectedId));
    setSelectedId(null);
  };
  const clearAll = () => { onChange([]); setSelectedId(null); setLineStart(null); };

  const toolBtn = (t: Tool, Icon: typeof Minus, label: string) => (
    <Button
      type="button" variant={tool === t ? 'default' : 'outline'} size="sm"
      onClick={() => { setTool(t); setLineStart(null); if (t !== 'select') setSelectedId(null); }}
      title={label}
    >
      <Icon className="h-3.5 w-3.5" />
    </Button>
  );

  const isCustomColor = !palette.includes(settings.color);

  // When the palette is restricted (claim-term colors) and the current color isn't in it,
  // snap to the first allowed color so new marks use a term color.
  useEffect(() => {
    if (allowedColors && allowedColors.length > 0 && !allowedColors.includes(settings.color)) {
      setSettings((s) => ({ ...s, color: allowedColors[0] }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowedColors]);

  // Adopt an externally-activated color (e.g. a clicked claim term); also apply to the
  // selected mark if one is selected.
  useEffect(() => {
    if (!activeColor?.color) return;
    setSettings((s) => ({ ...s, color: activeColor.color }));
    if (selectedId) onChange(value.map((a) => (a.id === selectedId ? { ...a, color: activeColor.color } : a)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeColor]);

  return (
    <div className={className}>
      {/* tool row */}
      <div className="flex items-center gap-1 mb-2 flex-wrap">
        {toolBtn('select', MousePointer, 'Select')}
        {toolBtn('line', Minus, 'Line (click two points)')}
        {toolBtn('arrow', ArrowUpRight, 'Arrow (click two points)')}
        {toolBtn('box', Square, 'Box (drag)')}

        {/* thickness */}
        <select
          value={settings.stroke}
          onChange={(e) => updateSettings({ stroke: Number(e.target.value) })}
          className="h-8 rounded-md border border-input bg-background px-1.5 text-xs"
          title="Thickness"
        >
          {THICKNESSES.map((t) => <option key={t} value={t}>{t}px</option>)}
        </select>

        {/* line style */}
        <select
          value={settings.lineStyle}
          onChange={(e) => updateSettings({ lineStyle: e.target.value as LineStyle })}
          className="h-8 rounded-md border border-input bg-background px-1.5 text-xs"
          title="Line style"
        >
          <option value="solid">──— Solid</option>
          <option value="dashed">– – Dashed</option>
          <option value="dotted">··· Dotted</option>
        </select>

        {/* color swatches + custom (6th) */}
        <div className="flex items-center gap-1 ml-1">
          {palette.map((c) => (
            <button
              key={c} type="button" onClick={() => updateSettings({ color: c })}
              className={`h-5 w-5 rounded-full border ${settings.color === c ? 'ring-2 ring-offset-1 ring-neutral-500' : ''}`}
              style={{ backgroundColor: c }} aria-label={`color ${c}`}
            />
          ))}
          <label
            className={`relative h-5 w-5 rounded-full border cursor-pointer overflow-hidden ${isCustomColor ? 'ring-2 ring-offset-1 ring-neutral-500' : ''}`}
            title="More colors (RGB / Hex)"
            style={isCustomColor ? { backgroundColor: settings.color } : { background: 'conic-gradient(#ef4444,#f59e0b,#eab308,#22c55e,#06b6d4,#3b82f6,#a855f7,#ef4444)' }}
          >
            <input
              type="color"
              value={settings.color}
              onChange={(e) => updateSettings({ color: e.target.value })}
              className="absolute inset-0 opacity-0 cursor-pointer"
              aria-label="Custom color"
            />
          </label>
        </div>

        <div className="ml-auto flex items-center gap-1">
          <Button type="button" variant="ghost" size="sm" onClick={deleteSelected} disabled={!selectedId} title="Delete selected">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={clearAll} disabled={value.length === 0} title="Clear all">
            <Eraser className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* canvas */}
      <div
        ref={wrapRef}
        className="relative block w-full select-none"
        style={{ cursor: tool === 'select' ? 'default' : 'crosshair' }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onClick={onClick}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt="screenshot" className="block w-full h-auto" onLoad={measure} draggable={false} />
        {size.w > 0 && (
          <svg width={size.w} height={size.h} className="absolute inset-0">
            {value.map((a) =>
              renderAnnotation(a, size.w, size.h, {
                selected: a.id === selectedId,
                onClick: tool === 'select' ? () => selectMark(a.id) : undefined,
              })
            )}
            {boxDraft && (
              <rect
                x={boxDraft.x * size.w} y={boxDraft.y * size.h} width={boxDraft.w * size.w} height={boxDraft.h * size.h}
                fill="transparent" stroke={settings.color} strokeWidth={settings.stroke}
                strokeDasharray={dashArray(settings.lineStyle, settings.stroke) || '4 3'}
              />
            )}
            {lineStart && cursor && (tool === 'line' || tool === 'arrow') && (
              <line
                x1={lineStart.x * size.w} y1={lineStart.y * size.h} x2={cursor.x * size.w} y2={cursor.y * size.h}
                stroke={settings.color} strokeWidth={settings.stroke} strokeDasharray="4 3"
              />
            )}
          </svg>
        )}
      </div>
      <p className="text-[11px] text-muted-foreground mt-1">
        {tool === 'box' ? 'Drag to draw a box.' : tool === 'select' ? 'Click a mark to select & restyle, then delete if needed.' : 'Click two points to draw.'}
      </p>
    </div>
  );
}
