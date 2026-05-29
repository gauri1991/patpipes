'use client';

import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ListPaginationProps {
  /** total number of items across all pages (DRF `count`) */
  count: number;
  /** zero-based offset of the first item on this page */
  offset: number;
  /** page size */
  limit: number;
  onOffsetChange: (offset: number) => void;
}

/** Limit/offset pager for DRF-paginated lists. Renders nothing when it all fits on one page. */
export function ListPagination({ count, offset, limit, onOffsetChange }: ListPaginationProps) {
  if (count <= limit) return null;

  const page = Math.floor(offset / limit) + 1;
  const pages = Math.max(1, Math.ceil(count / limit));
  const from = count === 0 ? 0 : offset + 1;
  const to = Math.min(offset + limit, count);

  return (
    <div className="flex items-center justify-between pt-4 mt-2 border-t">
      <p className="text-sm text-muted-foreground">
        Showing <span className="font-medium">{from}</span>–<span className="font-medium">{to}</span> of{' '}
        <span className="font-medium">{count}</span>
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={offset <= 0}
          onClick={() => onOffsetChange(Math.max(0, offset - limit))}
        >
          <ChevronLeft className="h-4 w-4 mr-1" /> Prev
        </Button>
        <span className="text-sm text-muted-foreground">
          Page {page} of {pages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={to >= count}
          onClick={() => onOffsetChange(offset + limit)}
        >
          Next <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
