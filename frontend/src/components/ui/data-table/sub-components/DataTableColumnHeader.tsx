import { ArrowDown, ArrowUp, ArrowUpDown, EyeOff } from 'lucide-react';
import type { Column } from '@tanstack/react-table';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface DataTableColumnHeaderProps<TData, TValue> {
  column: Column<TData, TValue>;
  title: string;
  className?: string;
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <div className={cn('text-xs font-medium text-neutral-500', className)}>{title}</div>;
  }

  const sorted = column.getIsSorted();
  const sortIndex = column.getSortIndex();

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-7 px-2 text-xs font-medium text-neutral-500 hover:text-neutral-900 data-[state=open]:bg-accent gap-1"
          >
            {title}
            {sorted === 'asc' ? (
              <ArrowUp className="w-3 h-3 text-neutral-900" />
            ) : sorted === 'desc' ? (
              <ArrowDown className="w-3 h-3 text-neutral-900" />
            ) : (
              <ArrowUpDown className="w-3 h-3" />
            )}
            {sortIndex >= 0 && (
              <span className="flex h-3.5 w-3.5 items-center justify-center rounded-sm bg-neutral-200 text-[9px] font-bold text-neutral-700">
                {sortIndex + 1}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="text-xs">
          <DropdownMenuItem onClick={() => column.toggleSorting(false)} className="text-xs gap-2">
            <ArrowUp className="w-3 h-3" /> Sort ascending
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => column.toggleSorting(true)} className="text-xs gap-2">
            <ArrowDown className="w-3 h-3" /> Sort descending
          </DropdownMenuItem>
          {sorted && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => column.clearSorting()} className="text-xs gap-2">
                Clear sort
              </DropdownMenuItem>
            </>
          )}
          {column.getCanHide() && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => column.toggleVisibility(false)}
                className="text-xs gap-2 text-neutral-500"
              >
                <EyeOff className="w-3 h-3" /> Hide column
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
