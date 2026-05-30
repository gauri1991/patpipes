'use client';

import { useState, useEffect, useRef, useCallback, Fragment } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getExpandedRowModel,
  flexRender,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
  type RowSelectionState,
  type PaginationState,
  type ExpandedState,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';

import type { DataTableProps, TableDensity } from './types';
import { DENSITY_ROW_CLASS, DENSITY_CELL_CLASS } from './utils';
import { DataTableToolbar } from './sub-components/DataTableToolbar';
import { DataTableBulkActionBar } from './sub-components/DataTableBulkActionBar';
import { DataTablePagination } from './sub-components/DataTablePagination';
import { DataTableFilterPanel } from './sub-components/DataTableFilterPanel';
import { DataTableEmpty } from './sub-components/DataTableEmpty';

const VIRTUALIZATION_THRESHOLD = 500;

export function DataTable<TData, TValue = unknown>({
  data,
  columns: columnDefs,
  getRowId,
  features = {},
  serverSide,
  pagination: controlledPagination,
  sorting: controlledSorting,
  columnFilters: controlledColumnFilters,
  globalFilter: controlledGlobalFilter,
  renderSubRow,
  onRowClick,
  bulkActions = [],
  rowActions = [],
  exportConfig,
  urlStateKey,
  toolbarExtra,
  onSelectionChange,
  isLoading,
  emptyState,
  initialPageSize = 20,
  initialDensity = 'default',
  initialVisibility = {},
  initialSorting = [],
  initialPinning,
  initialSizing,
  initialExpanded,
  initialRowSelection = {},
  className,
  tableClassName,
}: DataTableProps<TData, TValue>) {
  const [density, setDensity] = useState<TableDensity>(initialDensity);
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // Uncontrolled state (used when not in server-side mode)
  const [sorting, setSorting] = useState<SortingState>(initialSorting);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(initialVisibility);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>(initialRowSelection);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: initialPageSize,
  });
  const [expanded, setExpanded] = useState<ExpandedState>(initialExpanded ?? {});

  const tableBodyRef = useRef<HTMLTableSectionElement>(null);

  const isServerSide = !!(
    serverSide?.manualPagination ||
    serverSide?.manualFiltering ||
    serverSide?.manualSorting
  );

  const table = useReactTable({
    data,
    columns: columnDefs,
    getRowId,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: features.enablePagination !== false ? getPaginationRowModel() : undefined,
    getExpandedRowModel: features.enableRowExpansion ? getExpandedRowModel() : undefined,
    getSubRows: undefined,
    manualPagination: serverSide?.manualPagination,
    manualFiltering: serverSide?.manualFiltering,
    manualSorting: serverSide?.manualSorting,
    rowCount: serverSide?.rowCount,
    enableMultiSort: features.enableMultiSort ?? false,
    enableSorting: features.enableSorting !== false,
    enableColumnResizing: features.enableColumnResizing ?? false,
    columnResizeMode: 'onChange',
    state: {
      sorting: isServerSide ? (controlledSorting ?? sorting) : sorting,
      columnFilters: isServerSide ? (controlledColumnFilters ?? columnFilters) : columnFilters,
      globalFilter: isServerSide ? (controlledGlobalFilter ?? globalFilter) : globalFilter,
      columnVisibility,
      rowSelection,
      pagination: isServerSide ? (controlledPagination ?? pagination) : pagination,
      expanded,
    },
    onSortingChange: (updater) => {
      const next = typeof updater === 'function' ? updater(sorting) : updater;
      setSorting(next);
      serverSide?.onSortingChange?.(next);
    },
    onColumnFiltersChange: (updater) => {
      const next = typeof updater === 'function' ? updater(columnFilters) : updater;
      setColumnFilters(next);
      serverSide?.onFilteringChange?.(next);
    },
    onGlobalFilterChange: (updater) => {
      const next = typeof updater === 'function' ? updater(globalFilter) : updater;
      setGlobalFilter(next);
      serverSide?.onGlobalFilterChange?.(next);
    },
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: (updater) => {
      const next = typeof updater === 'function' ? updater(pagination) : updater;
      setPagination(next);
      serverSide?.onPaginationChange?.(next);
    },
    onExpandedChange: setExpanded,
    initialState: {
      columnPinning: initialPinning ?? { left: [], right: [] },
      columnSizing: initialSizing ?? {},
    },
  });

  // Notify parent when selection changes
  useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange(table.getSelectedRowModel().rows);
    }
  }, [rowSelection]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset to page 0 when global filter or column filters change
  useEffect(() => {
    if (!isServerSide) {
      table.setPageIndex(0);
    }
  }, [globalFilter, columnFilters]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Virtualization ──────────────────────────────────────────────────────────
  const rows = table.getRowModel().rows;
  const useVirtual =
    features.enableVirtualization && rows.length >= VIRTUALIZATION_THRESHOLD;

  const rowVirtualizer = useVirtualizer({
    count: useVirtual ? rows.length : 0,
    getScrollElement: () => tableBodyRef.current,
    estimateSize: () =>
      density === 'compact' ? 32 : density === 'comfortable' ? 56 : 40,
    overscan: 10,
    enabled: useVirtual,
  });

  const virtualRows = useVirtual ? rowVirtualizer.getVirtualItems() : null;
  const totalSize = useVirtual ? rowVirtualizer.getTotalSize() : 0;
  const paddingTop = virtualRows && virtualRows.length > 0 ? virtualRows[0].start : 0;
  const paddingBottom =
    virtualRows && virtualRows.length > 0
      ? totalSize - virtualRows[virtualRows.length - 1].end
      : 0;

  // ── Keyboard navigation ─────────────────────────────────────────────────────
  const [focusedRowIndex, setFocusedRowIndex] = useState(-1);
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTableElement>) => {
      if (!features.enableKeyboardNav) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedRowIndex(i => Math.min(i + 1, rows.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedRowIndex(i => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && focusedRowIndex >= 0) {
        const row = rows[focusedRowIndex];
        if (row) onRowClick?.(row);
      } else if (e.key === 'Escape') {
        setFocusedRowIndex(-1);
      }
    },
    [features.enableKeyboardNav, rows, focusedRowIndex, onRowClick],
  );

  // ── Render row ──────────────────────────────────────────────────────────────
  const renderRow = (row: typeof rows[number], virtualIndex?: number) => (
    <Fragment key={row.id}>
      <TableRow
        key={row.id}
        data-state={row.getIsSelected() ? 'selected' : undefined}
        data-focused={features.enableKeyboardNav && focusedRowIndex === (virtualIndex ?? rows.indexOf(row)) ? true : undefined}
        onClick={() => {
          if (onRowClick) onRowClick(row);
          if (features.enableKeyboardNav) setFocusedRowIndex(virtualIndex ?? rows.indexOf(row));
        }}
        className={cn(
          DENSITY_ROW_CLASS[density],
          'border-b border-neutral-50 group',
          onRowClick && 'cursor-pointer hover:bg-neutral-50',
          row.getIsSelected() && 'bg-blue-50',
          features.enableKeyboardNav &&
            focusedRowIndex === (virtualIndex ?? rows.indexOf(row)) &&
            'ring-1 ring-inset ring-cyan-400',
        )}
      >
        {row.getVisibleCells().map(cell => (
          <TableCell
            key={cell.id}
            className={cn(DENSITY_CELL_CLASS[density])}
            style={
              features.enableColumnResizing
                ? { width: cell.column.getSize() }
                : undefined
            }
          >
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableCell>
        ))}
        {rowActions.length > 0 && (
          <TableCell className={cn(DENSITY_CELL_CLASS[density], 'text-right')} onClick={e => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100">
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="text-xs">
                {rowActions
                  .filter(a => !a.hidden?.(row))
                  .map((action, i) => (
                    <DropdownMenuItem
                      key={i}
                      className={cn(
                        'text-xs gap-2',
                        action.variant === 'destructive' && 'text-red-600',
                      )}
                      onClick={() => action.onClick(row)}
                    >
                      {action.icon}
                      {action.label}
                    </DropdownMenuItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        )}
      </TableRow>
      {row.getIsExpanded() && renderSubRow && (
        <TableRow key={`${row.id}-expanded`}>
          <TableCell colSpan={row.getVisibleCells().length + (rowActions.length > 0 ? 1 : 0)} className="p-0">
            {renderSubRow(row)}
          </TableCell>
        </TableRow>
      )}
    </Fragment>
  );

  const allColumns = table.getAllLeafColumns();
  const visibleColumnCount =
    table.getVisibleLeafColumns().length + (rowActions.length > 0 ? 1 : 0);

  return (
    <div className={cn('flex flex-col gap-0 rounded-lg border border-neutral-200 overflow-hidden bg-white', className)}>
      {/* ── Toolbar ── */}
      <DataTableToolbar
        table={table}
        features={features}
        exportConfig={exportConfig}
        density={density}
        onDensityChange={setDensity}
        showFilterPanel={showFilterPanel}
        onToggleFilterPanel={() => setShowFilterPanel(v => !v)}
        toolbarExtra={toolbarExtra}
      />

      {/* ── Column filter panel ── */}
      {showFilterPanel && features.enableFiltering && (
        <div className="px-3 pb-2 border-b border-neutral-100">
          <DataTableFilterPanel table={table} onClose={() => setShowFilterPanel(false)} />
        </div>
      )}

      {/* ── Bulk action bar ── */}
      {bulkActions.length > 0 && features.enableSelection && (
        <div className="px-3 py-2">
          <DataTableBulkActionBar table={table} bulkActions={bulkActions} />
        </div>
      )}

      {/* ── Table ── */}
      <div className={cn('overflow-x-auto', useVirtual && 'overflow-y-auto max-h-[600px]')}>
        <Table
          className={cn('w-full text-xs', tableClassName)}
          tabIndex={features.enableKeyboardNav ? 0 : undefined}
          onKeyDown={handleKeyDown}
          style={
            features.enableColumnResizing
              ? { width: table.getCenterTotalSize() }
              : undefined
          }
        >
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id} className="border-b border-neutral-100 bg-neutral-50 hover:bg-neutral-50">
                {headerGroup.headers.map(header => (
                  <TableHead
                    key={header.id}
                    className="px-4 py-2 font-medium text-neutral-500 text-xs"
                    style={
                      features.enableColumnResizing
                        ? { width: header.getSize(), position: 'relative' }
                        : undefined
                    }
                    colSpan={header.colSpan}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                    {features.enableColumnResizing && header.column.getCanResize() && (
                      <div
                        onMouseDown={header.getResizeHandler()}
                        onTouchStart={header.getResizeHandler()}
                        className={cn(
                          'absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none bg-neutral-200 opacity-0 hover:opacity-100',
                          header.column.getIsResizing() && 'bg-cyan-400 opacity-100',
                        )}
                      />
                    )}
                  </TableHead>
                ))}
                {rowActions.length > 0 && (
                  <TableHead className="w-10" />
                )}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody ref={tableBodyRef}>
            {isLoading || rows.length === 0 ? (
              <DataTableEmpty colSpan={visibleColumnCount} isLoading={isLoading}>
                {emptyState}
              </DataTableEmpty>
            ) : useVirtual && virtualRows ? (
              <>
                {paddingTop > 0 && (
                  <tr><td style={{ height: paddingTop }} /></tr>
                )}
                {virtualRows.map(vRow => renderRow(rows[vRow.index], vRow.index))}
                {paddingBottom > 0 && (
                  <tr><td style={{ height: paddingBottom }} /></tr>
                )}
              </>
            ) : (
              rows.map(row => renderRow(row))
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Pagination ── */}
      {features.enablePagination !== false && (
        <DataTablePagination
          table={table}
          totalRows={serverSide?.rowCount}
        />
      )}
    </div>
  );
}
