'use client';

import type { Column, Row, Table } from '@tanstack/react-table';
import { rowsToCsv, downloadFile } from '../utils';

function getVisibleHeaders<TData>(table: Table<TData>): { key: string; label: string }[] {
  return table
    .getVisibleLeafColumns()
    .filter(col => col.id !== 'select' && col.id !== 'actions')
    .map(col => ({
      key: col.id,
      label: typeof col.columnDef.header === 'string' ? col.columnDef.header : col.id,
    }));
}

function rowToRecord<TData>(row: Row<TData>, columns: Column<TData>[]): Record<string, unknown> {
  const record: Record<string, unknown> = {};
  for (const col of columns) {
    if (col.id === 'select' || col.id === 'actions') continue;
    const cell = row.getAllCells().find(c => c.column.id === col.id);
    // Prefer the raw value over the rendered value for clean CSV output
    record[col.id] = cell?.getValue() ?? '';
  }
  return record;
}

export function useDataTableExport<TData>(table: Table<TData>, filename = 'export') {
  const visibleColumns = table.getVisibleLeafColumns();
  const headers = getVisibleHeaders(table);

  function exportCurrentPageCsv() {
    const rows = table.getRowModel().rows;
    const records = rows.map(r => rowToRecord(r, visibleColumns));
    const csv = rowsToCsv(records, headers);
    downloadFile(csv, `${filename}.csv`);
  }

  function exportAllRowsCsv() {
    const rows = table.getPrePaginationRowModel().rows;
    const records = rows.map(r => rowToRecord(r, visibleColumns));
    const csv = rowsToCsv(records, headers);
    downloadFile(csv, `${filename}-all.csv`);
  }

  async function exportExcel() {
    const rows = table.getPrePaginationRowModel().rows;
    const records = rows.map(r => rowToRecord(r, visibleColumns));
    const XLSX = await import('xlsx');
    const ws = XLSX.utils.json_to_sheet(records);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data');
    XLSX.writeFile(wb, `${filename}.xlsx`);
  }

  return { exportCurrentPageCsv, exportAllRowsCsv, exportExcel };
}
