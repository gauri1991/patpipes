'use client';

import React, { useCallback } from 'react';
import { ExternalLink, Search } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { DataTable, createColumns } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table';
import type { DiscoveredLink, LinkCategory, BulkSelectRequest } from '../types/docDownload.types';
import { LinkCategoryBadge } from './LinkCategoryBadge';
import { CategoryStats } from './CategoryStats';
import type { JobStats } from '../types/docDownload.types';

function formatBytes(bytes: number | null): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface LinkTableProps {
  links: DiscoveredLink[];
  linksTotal: number;
  isLoading: boolean;
  stats: JobStats | null;
  selectedCategory: LinkCategory | 'all';
  linkFilter: 'all' | 'selected' | 'downloaded';
  searchQuery: string;
  onSelectCategory: (category: LinkCategory | 'all') => void;
  onSetLinkFilter: (filter: 'all' | 'selected' | 'downloaded') => void;
  onSearchChange: (query: string) => void;
  onSelectLinks: (data: BulkSelectRequest) => void;
  onLoadMore: () => void;
}

export const LinkTable: React.FC<LinkTableProps> = ({
  links, linksTotal, isLoading, stats,
  selectedCategory, linkFilter, searchQuery,
  onSelectCategory, onSetLinkFilter, onSearchChange,
  onSelectLinks, onLoadMore,
}) => {
  const toggleLink = useCallback((linkId: string, currentlySelected: boolean) => {
    onSelectLinks({ link_ids: [linkId], select: !currentlySelected });
  }, [onSelectLinks]);

  const selectAllVisible = useCallback(() => {
    const unselectedIds = links.filter(l => !l.is_selected).map(l => l.id);
    if (unselectedIds.length > 0) onSelectLinks({ link_ids: unselectedIds, select: true });
  }, [links, onSelectLinks]);

  const allVisibleSelected = links.length > 0 && links.every(l => l.is_selected);
  const someVisibleSelected = links.some(l => l.is_selected);
  const selectedCount = links.filter(l => l.is_selected).length;

  const { column } = createColumns<DiscoveredLink>();

  const columns = [
    // Custom checkbox column — selection is server-persisted, not DataTable-managed
    column({
      id: 'select',
      enableSorting: false,
      enableHiding: false,
      header: () => (
        <Checkbox
          checked={allVisibleSelected}
          onCheckedChange={() => {
            if (allVisibleSelected) {
              onSelectLinks({ link_ids: links.map(l => l.id), select: false });
            } else {
              selectAllVisible();
            }
          }}
          aria-label="Select all visible links"
        />
      ),
      cell: ({ row }) => {
        const link = row.original;
        return (
          <Checkbox
            checked={link.is_selected}
            onCheckedChange={() => toggleLink(link.id, link.is_selected)}
            aria-label={`Select ${link.title || link.url}`}
            onClick={e => e.stopPropagation()}
          />
        );
      },
      size: 40,
    }),

    column({
      id: 'url_title',
      header: ({ column }) => <DataTableColumnHeader column={column} title="URL / Title" />,
      accessorFn: row => row.title || row.url,
      cell: ({ row }) => {
        const link = row.original;
        return (
          <div className="min-w-0 max-w-md">
            <p className="text-sm font-medium text-neutral-900 truncate">
              {link.title || link.url.split('/').pop() || link.url}
            </p>
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-neutral-400 hover:text-cyan-600 truncate flex items-center gap-1"
              onClick={e => e.stopPropagation()}
            >
              {link.url}
              <ExternalLink className="h-3 w-3 shrink-0 opacity-60" />
            </a>
          </div>
        );
      },
    }),

    column({
      accessorKey: 'category',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Category" />,
      cell: ({ getValue }) => <LinkCategoryBadge category={getValue() as LinkCategory} />,
      meta: { filterType: 'select' as const },
    }),

    column({
      accessorKey: 'file_size_bytes',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Size" />,
      cell: ({ getValue }) => <span className="text-xs text-neutral-500">{formatBytes(getValue() as number | null)}</span>,
      meta: { filterType: 'number-range' as const },
    }),

    column({
      accessorKey: 'depth',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Depth" />,
      cell: ({ getValue }) => <span className="text-xs text-neutral-500">{getValue() as number}</span>,
      meta: { filterType: 'number-range' as const },
    }),

    column({
      id: 'status',
      header: 'Status',
      accessorFn: row => row.is_downloaded ? 'downloaded' : row.download_error ? 'error' : 'pending',
      cell: ({ row }) => {
        const link = row.original;
        if (link.is_downloaded) return <span className="text-xs text-green-600 font-medium">Downloaded</span>;
        if (link.download_error) return <span className="text-xs text-red-500" title={link.download_error}>Error</span>;
        return <span className="text-xs text-neutral-400">Pending</span>;
      },
      meta: {
        filterType: 'select' as const,
        filterOptions: [
          { label: 'Downloaded', value: 'downloaded' },
          { label: 'Error', value: 'error' },
          { label: 'Pending', value: 'pending' },
        ],
      },
    }),
  ];

  const toolbar = (
    <div className="w-full space-y-3">
      {/* Category tabs */}
      <CategoryStats stats={stats} selectedCategory={selectedCategory} onSelectCategory={onSelectCategory} />

      {/* Search + filter buttons */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <Input className="pl-9" placeholder="Search links..." value={searchQuery} onChange={e => onSearchChange(e.target.value)} aria-label="Search links" />
        </div>
        <div className="flex items-center gap-1 bg-neutral-100 rounded-lg p-1">
          {(['all', 'selected', 'downloaded'] as const).map(filter => (
            <button key={filter} onClick={() => onSetLinkFilter(filter)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${linkFilter === filter ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-500 hover:text-neutral-700'}`}>
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk select bar */}
      {someVisibleSelected && (
        <div className="flex items-center justify-between bg-neutral-50 border rounded-lg px-4 py-2">
          <span className="text-sm text-neutral-600">{selectedCount} of {links.length} visible links selected</span>
          <div className="flex items-center gap-2">
            <button onClick={selectAllVisible} className="text-xs text-cyan-600 hover:text-cyan-700 font-medium">Select all visible</button>
            <button
              onClick={() => onSelectLinks({ link_ids: links.filter(l => l.is_selected).map(l => l.id), select: false })}
              className="text-xs text-neutral-500 hover:text-neutral-700"
            >
              Clear selection
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-3">
      <DataTable
        data={links}
        columns={columns}
        getRowId={row => row.id}
        isLoading={isLoading && links.length === 0}
        features={{
          enableSorting: true,
          enableFiltering: true,
          enableColumnVisibility: true,
          enableDensityToggle: true,
          enableExport: true,
        }}
        toolbarExtra={toolbar}
        exportConfig={{ filename: 'links' }}
        initialPageSize={50}
        emptyState="No links found"
      />

      {/* Load more */}
      {links.length < linksTotal && (
        <div className="flex justify-center pt-2">
          <button onClick={onLoadMore} className="text-sm text-cyan-600 hover:text-cyan-700 font-medium" disabled={isLoading}>
            Load more ({links.length} of {linksTotal})
          </button>
        </div>
      )}
    </div>
  );
};
