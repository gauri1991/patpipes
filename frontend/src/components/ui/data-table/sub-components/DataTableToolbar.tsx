import { useState } from 'react';
import { Download, Filter, SlidersHorizontal, Search, ChevronDown } from 'lucide-react';
import type { Table } from '@tanstack/react-table';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import type { DataTableFeatureFlags, ExportConfig, TableDensity } from '../types';
import { useDataTableExport } from '../hooks/useDataTableExport';

const DENSITY_LABELS: Record<TableDensity, string> = {
  compact: 'Compact',
  default: 'Default',
  comfortable: 'Comfortable',
};

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  features: DataTableFeatureFlags;
  exportConfig?: ExportConfig;
  density: TableDensity;
  onDensityChange: (d: TableDensity) => void;
  showFilterPanel: boolean;
  onToggleFilterPanel: () => void;
  toolbarExtra?: React.ReactNode;
}

export function DataTableToolbar<TData>({
  table,
  features,
  exportConfig,
  density,
  onDensityChange,
  showFilterPanel,
  onToggleFilterPanel,
  toolbarExtra,
}: DataTableToolbarProps<TData>) {
  const { exportCurrentPageCsv, exportAllRowsCsv, exportExcel } = useDataTableExport(
    table,
    exportConfig?.filename ?? 'export',
  );

  const globalFilter = table.getState().globalFilter as string ?? '';
  const activeFilterCount = table.getState().columnFilters.length;
  const hidableColumns = table
    .getAllLeafColumns()
    .filter(col => col.getCanHide());

  // Group columns by meta.group for the visibility dropdown
  const groups: Record<string, typeof hidableColumns> = {};
  for (const col of hidableColumns) {
    const g = (col.columnDef.meta as { group?: string } | undefined)?.group ?? '';
    if (!groups[g]) groups[g] = [];
    groups[g].push(col);
  }
  const groupKeys = Object.keys(groups).sort();

  return (
    <div className="flex items-center gap-2 px-4 py-2.5 border-b border-neutral-100 flex-wrap">
      {/* Left: extra slot (page-specific controls) */}
      {toolbarExtra && <div className="flex items-center gap-2">{toolbarExtra}</div>}

      {/* Global search */}
      {features.enableFiltering && (
        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
          <Input
            value={globalFilter}
            onChange={e => table.setGlobalFilter(e.target.value)}
            placeholder="Search…"
            className="pl-8 h-8 text-xs"
          />
        </div>
      )}

      {/* Column filter toggle */}
      {features.enableFiltering && (
        <Button
          variant={showFilterPanel || activeFilterCount > 0 ? 'default' : 'outline'}
          size="sm"
          className={cn(
            'gap-1 h-8',
            (showFilterPanel || activeFilterCount > 0) && 'bg-neutral-900 text-white hover:bg-neutral-800',
          )}
          onClick={onToggleFilterPanel}
        >
          <Filter className="w-3 h-3" />
          Filters
          {activeFilterCount > 0 && (
            <Badge className="h-4 w-4 p-0 flex items-center justify-center bg-cyan-500 text-white text-[9px] rounded-full ml-0.5">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      )}

      {/* Column visibility */}
      {features.enableColumnVisibility && hidableColumns.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1 h-8">
              <SlidersHorizontal className="w-3 h-3" />
              Columns
              <ChevronDown className="w-3 h-3 ml-0.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 max-h-80 overflow-y-auto text-xs">
            {groupKeys.map((g, gi) => (
              <div key={g}>
                {g && (
                  <>
                    {gi > 0 && <DropdownMenuSeparator />}
                    <DropdownMenuLabel className="text-[10px] uppercase tracking-wide text-neutral-400 py-1">
                      {g}
                    </DropdownMenuLabel>
                  </>
                )}
                {groups[g].map(col => (
                  <DropdownMenuCheckboxItem
                    key={col.id}
                    className="text-xs capitalize"
                    checked={col.getIsVisible()}
                    onCheckedChange={v => col.toggleVisibility(v)}
                  >
                    {typeof col.columnDef.header === 'string'
                      ? col.columnDef.header
                      : col.id.replace(/_/g, ' ')}
                  </DropdownMenuCheckboxItem>
                ))}
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Density toggle */}
      {features.enableDensityToggle && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1 h-8 text-xs">
              {DENSITY_LABELS[density]}
              <ChevronDown className="w-3 h-3 ml-0.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="text-xs">
            {(Object.keys(DENSITY_LABELS) as TableDensity[]).map(d => (
              <DropdownMenuItem
                key={d}
                className={cn('text-xs', density === d && 'font-semibold')}
                onClick={() => onDensityChange(d)}
              >
                {DENSITY_LABELS[d]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Export */}
      {features.enableExport && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1 h-8">
              <Download className="w-3 h-3" />
              Export
              <ChevronDown className="w-3 h-3 ml-0.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="text-xs">
            <DropdownMenuItem className="text-xs" onClick={exportCurrentPageCsv}>
              CSV — this page
            </DropdownMenuItem>
            <DropdownMenuItem className="text-xs" onClick={exportAllRowsCsv}>
              CSV — all loaded rows
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-xs" onClick={exportExcel}>
              Excel (.xlsx)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
