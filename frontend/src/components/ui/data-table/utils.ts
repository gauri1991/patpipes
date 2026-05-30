import type { ColumnDef, DisplayColumnDef, GroupColumnDef } from '@tanstack/react-table';
import type { TableDensity } from './types';

// ── Column definition helper ───────────────────────────────────────────────────
// Thin wrapper that gives per-column TypeScript inference without writing
// ColumnDef<MyType, TValue>[] on every call-site.

export function createColumns<TData>() {
  return {
    column: <TValue>(def: ColumnDef<TData, TValue>): ColumnDef<TData, TValue> => def,
    display: (def: DisplayColumnDef<TData>): DisplayColumnDef<TData> => def,
    group: (def: GroupColumnDef<TData>): GroupColumnDef<TData> => def,
  };
}

// ── Density classes ────────────────────────────────────────────────────────────

export const DENSITY_ROW_CLASS: Record<TableDensity, string> = {
  compact: 'h-8',
  default: 'h-10',
  comfortable: 'h-14',
};

export const DENSITY_CELL_CLASS: Record<TableDensity, string> = {
  compact: 'px-3 py-1 text-xs',
  default: 'px-4 py-2 text-sm',
  comfortable: 'px-4 py-3 text-sm',
};

// ── URL state codec ────────────────────────────────────────────────────────────
// Compact human-readable encoding for URL params.
// sort: "title.asc,status.desc"
// page: "2"
// size: "20"
// q: "search term"

export function encodeSort(sorting: { id: string; desc: boolean }[]): string {
  return sorting.map(s => `${s.id}.${s.desc ? 'desc' : 'asc'}`).join(',');
}

export function decodeSort(raw: string): { id: string; desc: boolean }[] {
  if (!raw) return [];
  return raw.split(',').map(part => {
    const lastDot = part.lastIndexOf('.');
    const id = part.slice(0, lastDot);
    const dir = part.slice(lastDot + 1);
    return { id, desc: dir === 'desc' };
  });
}

// ── CSV export ─────────────────────────────────────────────────────────────────

export function rowsToCsv(rows: Record<string, unknown>[], headers: { key: string; label: string }[]): string {
  const escape = (v: unknown) => {
    const s = v == null ? '' : String(v);
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  const head = headers.map(h => escape(h.label)).join(',');
  const body = rows.map(row => headers.map(h => escape(row[h.key])).join(',')).join('\n');
  return `${head}\n${body}`;
}

export function downloadFile(content: string, filename: string, mime = 'text/csv;charset=utf-8;') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
