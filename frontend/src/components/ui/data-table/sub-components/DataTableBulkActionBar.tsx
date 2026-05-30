import { X } from 'lucide-react';
import type { Row, Table } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import type { BulkAction } from '../types';

interface DataTableBulkActionBarProps<TData> {
  table: Table<TData>;
  bulkActions: BulkAction<TData>[];
}

export function DataTableBulkActionBar<TData>({
  table,
  bulkActions,
}: DataTableBulkActionBarProps<TData>) {
  const selectedRows = table.getSelectedRowModel().rows;
  if (selectedRows.length === 0) return null;

  return (
    <div className="flex items-center gap-3 bg-neutral-900 text-white rounded-lg px-4 py-3 animate-in slide-in-from-bottom-2 duration-150">
      <span className="text-sm font-medium shrink-0">
        {selectedRows.length} {selectedRows.length === 1 ? 'patent' : 'patents'} selected
      </span>

      <div className="flex gap-2 ml-auto">
        {bulkActions.map((action, i) => (
          <Button
            key={i}
            size="sm"
            variant={action.variant === 'destructive' ? 'destructive' : 'secondary'}
            className="gap-1"
            onClick={() => action.onClick(selectedRows)}
          >
            {action.icon}
            {action.label}
          </Button>
        ))}
        <Button
          size="sm"
          variant="ghost"
          className="text-neutral-400 hover:text-white hover:bg-neutral-700 h-8 w-8 p-0"
          onClick={() => table.resetRowSelection()}
          title="Clear selection"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
