'use client';

import { useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { encodeSort, decodeSort } from '../utils';
import type { SortingState, PaginationState, ColumnFiltersState } from '@tanstack/react-table';

export interface DataTableUrlState {
  sorting: SortingState;
  pagination: PaginationState;
  globalFilter: string;
  columnFilters: ColumnFiltersState;
}

export function useDataTableUrlState(key = 'dt') {
  const router = useRouter();
  const searchParams = useSearchParams();

  const readState = useCallback((): Partial<DataTableUrlState> => {
    const sort = searchParams.get(`${key}_sort`);
    const page = searchParams.get(`${key}_page`);
    const size = searchParams.get(`${key}_size`);
    const q = searchParams.get(`${key}_q`);

    return {
      sorting: sort ? decodeSort(sort) : undefined,
      pagination: page || size
        ? { pageIndex: page ? Number(page) - 1 : 0, pageSize: size ? Number(size) : 20 }
        : undefined,
      globalFilter: q ?? undefined,
    };
  }, [searchParams, key]);

  const writeState = useCallback(
    (state: Partial<DataTableUrlState>) => {
      const params = new URLSearchParams(searchParams.toString());

      if (state.sorting !== undefined) {
        const encoded = encodeSort(state.sorting);
        if (encoded) params.set(`${key}_sort`, encoded);
        else params.delete(`${key}_sort`);
      }
      if (state.pagination !== undefined) {
        const { pageIndex, pageSize } = state.pagination;
        if (pageIndex > 0) params.set(`${key}_page`, String(pageIndex + 1));
        else params.delete(`${key}_page`);
        if (pageSize !== 20) params.set(`${key}_size`, String(pageSize));
        else params.delete(`${key}_size`);
      }
      if (state.globalFilter !== undefined) {
        if (state.globalFilter) params.set(`${key}_q`, state.globalFilter);
        else params.delete(`${key}_q`);
      }

      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams, key],
  );

  return { readState, writeState };
}
