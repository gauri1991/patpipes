import { X } from 'lucide-react';
import { type Column, type Table } from '@tanstack/react-table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { DataTableColumnMeta } from '../types';

interface DataTableFilterPanelProps<TData> {
  table: Table<TData>;
  onClose: () => void;
}

function ColumnFilter<TData>({ column }: { column: Column<TData> }) {
  const meta = column.columnDef.meta as DataTableColumnMeta | undefined;
  const filterType = meta?.filterType ?? 'text';
  const value = (column.getFilterValue() ?? '') as string;

  if (filterType === 'select' && meta?.filterOptions) {
    return (
      <Select value={value || '_all'} onValueChange={v => column.setFilterValue(v === '_all' ? '' : v)}>
        <SelectTrigger className="h-7 text-xs w-40">
          <SelectValue placeholder="Any" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="_all" className="text-xs">Any</SelectItem>
          {meta.filterOptions.map(opt => (
            <SelectItem key={opt.value} value={opt.value} className="text-xs">
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  if (filterType === 'number-range') {
    const [min, max] = (column.getFilterValue() as [string, string]) ?? ['', ''];
    return (
      <div className="flex items-center gap-1">
        <Input
          placeholder="Min"
          value={min}
          onChange={e => column.setFilterValue((old: [string, string]) => [e.target.value, old?.[1] ?? ''])}
          className="h-7 text-xs w-20"
          type="number"
        />
        <span className="text-neutral-400 text-xs">–</span>
        <Input
          placeholder="Max"
          value={max}
          onChange={e => column.setFilterValue((old: [string, string]) => [old?.[0] ?? '', e.target.value])}
          className="h-7 text-xs w-20"
          type="number"
        />
      </div>
    );
  }

  if (filterType === 'date-range') {
    const [from, to] = (column.getFilterValue() as [string, string]) ?? ['', ''];
    return (
      <div className="flex items-center gap-1">
        <Input
          placeholder="From"
          value={from}
          onChange={e => column.setFilterValue((old: [string, string]) => [e.target.value, old?.[1] ?? ''])}
          className="h-7 text-xs w-28"
          type="date"
        />
        <span className="text-neutral-400 text-xs">–</span>
        <Input
          placeholder="To"
          value={to}
          onChange={e => column.setFilterValue((old: [string, string]) => [old?.[0] ?? '', e.target.value])}
          className="h-7 text-xs w-28"
          type="date"
        />
      </div>
    );
  }

  // Default: text
  return (
    <Input
      placeholder={`Filter…`}
      value={value}
      onChange={e => column.setFilterValue(e.target.value)}
      className="h-7 text-xs w-40"
    />
  );
}

export function DataTableFilterPanel<TData>({ table, onClose }: DataTableFilterPanelProps<TData>) {
  const filterableColumns = table
    .getAllLeafColumns()
    .filter(col => col.getCanFilter() && col.id !== 'select' && col.id !== 'actions');

  const activeCount = table.getState().columnFilters.length;

  return (
    <div className="border border-neutral-200 rounded-lg p-3 bg-neutral-50 text-xs">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="font-medium text-neutral-700">Column filters</span>
          {activeCount > 0 && (
            <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
              {activeCount} active
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {activeCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs text-neutral-500"
              onClick={() => table.resetColumnFilters()}
            >
              Clear all
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-2">
        {filterableColumns.map(col => (
          <div key={col.id} className="flex items-center gap-2">
            <span className="text-neutral-500 shrink-0 w-24 truncate" title={col.id}>
              {typeof col.columnDef.header === 'string' ? col.columnDef.header : col.id}
            </span>
            <ColumnFilter column={col} />
            {col.getFilterValue() !== undefined && col.getFilterValue() !== '' && (
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 text-neutral-400"
                onClick={() => col.setFilterValue(undefined)}
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
