import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import type { Table } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
  totalRows?: number;
}

export function DataTablePagination<TData>({ table, totalRows }: DataTablePaginationProps<TData>) {
  const { pageIndex, pageSize } = table.getState().pagination;
  const pageCount = table.getPageCount();
  const rowCount = totalRows ?? table.getFilteredRowModel().rows.length;

  const from = pageIndex * pageSize + 1;
  const to = Math.min((pageIndex + 1) * pageSize, rowCount);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-100">
      <div className="flex items-center gap-3">
        <span className="text-xs text-neutral-500">Rows per page</span>
        <Select
          value={String(pageSize)}
          onValueChange={v => table.setPageSize(Number(v))}
        >
          <SelectTrigger className="h-7 w-16 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent side="top">
            {PAGE_SIZE_OPTIONS.map(size => (
              <SelectItem key={size} value={String(size)} className="text-xs">
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-xs text-neutral-500">
          {rowCount === 0 ? 'No results' : `${from}–${to} of ${rowCount.toLocaleString()}`}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            title="First page"
          >
            <ChevronsLeft className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            title="Previous page"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </Button>
          <span className="text-xs text-neutral-500 px-2">
            Page {pageIndex + 1} of {Math.max(1, pageCount)}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            title="Next page"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => table.setPageIndex(pageCount - 1)}
            disabled={!table.getCanNextPage()}
            title="Last page"
          >
            <ChevronsRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
