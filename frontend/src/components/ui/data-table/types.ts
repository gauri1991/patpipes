import type {
  ColumnDef,
  ColumnFiltersState,
  ColumnPinningState,
  ColumnSizingState,
  ExpandedState,
  PaginationState,
  Row,
  RowSelectionState,
  SortingState,
  VisibilityState,
} from '@tanstack/react-table';
import type { ReactNode } from 'react';

// ── Density ────────────────────────────────────────────────────────────────────

export type TableDensity = 'compact' | 'default' | 'comfortable';

// ── Feature flags (all opt-in) ────────────────────────────────────────────────

export interface DataTableFeatureFlags {
  enableSelection?: boolean;
  enableSorting?: boolean;
  enableMultiSort?: boolean;
  enableFiltering?: boolean;
  enableColumnVisibility?: boolean;
  enablePagination?: boolean;
  enableExport?: boolean;
  enableColumnResizing?: boolean;
  enableRowExpansion?: boolean;
  enableColumnPinning?: boolean;
  enableDensityToggle?: boolean;
  enableKeyboardNav?: boolean;
  enableUrlState?: boolean;
  enableVirtualization?: boolean;
}

// ── Server-side ────────────────────────────────────────────────────────────────

export interface DataTableServerSideProps {
  manualPagination?: boolean;
  manualFiltering?: boolean;
  manualSorting?: boolean;
  rowCount?: number;
  onPaginationChange?: (pagination: PaginationState) => void;
  onSortingChange?: (sorting: SortingState) => void;
  onFilteringChange?: (filters: ColumnFiltersState) => void;
  onGlobalFilterChange?: (query: string) => void;
}

// ── Bulk & row actions ─────────────────────────────────────────────────────────

export interface BulkAction<TData> {
  label: string;
  icon?: ReactNode;
  variant?: 'default' | 'destructive' | 'secondary';
  onClick: (selectedRows: Row<TData>[]) => void | Promise<void>;
}

export interface RowAction<TData> {
  label: string;
  icon?: ReactNode;
  variant?: 'default' | 'destructive';
  onClick: (row: Row<TData>) => void | Promise<void>;
  hidden?: (row: Row<TData>) => boolean;
}

// ── Export ─────────────────────────────────────────────────────────────────────

export interface ExportConfig {
  filename?: string;
  fetchAllRows?: () => Promise<unknown[]>;
}

// ── Column meta extension ──────────────────────────────────────────────────────

export interface DataTableColumnMeta {
  filterType?: 'text' | 'select' | 'date-range' | 'number-range';
  filterOptions?: { label: string; value: string }[];
  group?: string;
  editable?: boolean;
}

// ── Main props ─────────────────────────────────────────────────────────────────

export interface DataTableProps<TData, TValue = unknown> {
  data: TData[];
  columns: ColumnDef<TData, TValue>[];
  getRowId?: (row: TData) => string;

  features?: DataTableFeatureFlags;
  serverSide?: DataTableServerSideProps;

  // Controlled state (used in server-side mode)
  pagination?: PaginationState;
  sorting?: SortingState;
  columnFilters?: ColumnFiltersState;
  globalFilter?: string;

  // Row expansion
  renderSubRow?: (row: Row<TData>) => ReactNode;

  // Row click (opens side panel / modal)
  onRowClick?: (row: Row<TData>) => void;

  // Bulk actions (floating bar when rows selected)
  bulkActions?: BulkAction<TData>[];

  // Per-row dropdown actions
  rowActions?: RowAction<TData>[];

  // Export
  exportConfig?: ExportConfig;

  // Namespace for URL state (multiple tables on same page)
  urlStateKey?: string;

  // Slot for page-specific controls rendered left of the toolbar
  toolbarExtra?: ReactNode;

  // Callback when selection changes (optional — bulk actions cover most cases)
  onSelectionChange?: (rows: Row<TData>[]) => void;

  isLoading?: boolean;
  emptyState?: ReactNode;

  initialPageSize?: number;
  initialDensity?: TableDensity;
  initialVisibility?: VisibilityState;
  initialSorting?: SortingState;
  initialPinning?: ColumnPinningState;
  initialSizing?: ColumnSizingState;
  initialExpanded?: ExpandedState;
  initialRowSelection?: RowSelectionState;

  className?: string;
  tableClassName?: string;
}
