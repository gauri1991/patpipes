import { Skeleton } from '@/components/ui/skeleton';
import type { ReactNode } from 'react';

interface DataTableEmptyProps {
  colSpan: number;
  isLoading?: boolean;
  children?: ReactNode;
}

export function DataTableEmpty({ colSpan, isLoading, children }: DataTableEmptyProps) {
  if (isLoading) {
    return (
      <>
        {Array.from({ length: 5 }).map((_, i) => (
          <tr key={i} className="border-b border-neutral-100">
            <td colSpan={colSpan} className="px-4 py-2">
              <Skeleton className="h-4 w-full rounded" />
            </td>
          </tr>
        ))}
      </>
    );
  }

  return (
    <tr>
      <td colSpan={colSpan} className="text-center py-12 text-neutral-400 text-sm">
        {children ?? 'No results found.'}
      </td>
    </tr>
  );
}
