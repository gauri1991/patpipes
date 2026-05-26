'use client';

import React, { useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { ExternalLink, Search } from 'lucide-react';
import type { DiscoveredLink, LinkCategory, BulkSelectRequest } from '../types/docDownload.types';
import { LinkCategoryBadge } from './LinkCategoryBadge';
import { CategoryStats } from './CategoryStats';
import type { JobStats } from '../types/docDownload.types';

function formatBytes(bytes: number | null): string {
  if (!bytes) return '-';
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
  links,
  linksTotal,
  isLoading,
  stats,
  selectedCategory,
  linkFilter,
  searchQuery,
  onSelectCategory,
  onSetLinkFilter,
  onSearchChange,
  onSelectLinks,
  onLoadMore,
}) => {
  const toggleLink = useCallback((linkId: string, currentlySelected: boolean) => {
    onSelectLinks({
      link_ids: [linkId],
      select: !currentlySelected,
    });
  }, [onSelectLinks]);

  const selectAllVisible = useCallback(() => {
    const unselectedIds = links.filter(l => !l.is_selected).map(l => l.id);
    if (unselectedIds.length > 0) {
      onSelectLinks({ link_ids: unselectedIds, select: true });
    }
  }, [links, onSelectLinks]);

  const allVisibleSelected = links.length > 0 && links.every(l => l.is_selected);
  const someVisibleSelected = links.some(l => l.is_selected);
  const selectedCount = links.filter(l => l.is_selected).length;

  return (
    <div className="space-y-3">
      {/* Category filter tabs */}
      <CategoryStats
        stats={stats}
        selectedCategory={selectedCategory}
        onSelectCategory={onSelectCategory}
      />

      {/* Filter bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <Input
            className="pl-9"
            placeholder="Search links..."
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            aria-label="Search links"
          />
        </div>

        <div className="flex items-center gap-1 bg-neutral-100 rounded-lg p-1">
          {(['all', 'selected', 'downloaded'] as const).map(filter => (
            <button
              key={filter}
              onClick={() => onSetLinkFilter(filter)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                linkFilter === filter
                  ? 'bg-white shadow-sm text-neutral-900'
                  : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk select bar */}
      {someVisibleSelected && (
        <div className="flex items-center justify-between bg-neutral-50 border rounded-lg px-4 py-2">
          <span className="text-sm text-neutral-600">
            {selectedCount} of {links.length} visible links selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={selectAllVisible}
              className="text-xs text-cyan-600 hover:text-cyan-700 font-medium"
            >
              Select all visible
            </button>
            <button
              onClick={() => onSelectLinks({
                link_ids: links.filter(l => l.is_selected).map(l => l.id),
                select: false,
              })}
              className="text-xs text-neutral-500 hover:text-neutral-700"
            >
              Clear selection
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={allVisibleSelected}
                  onCheckedChange={() => {
                    if (allVisibleSelected) {
                      onSelectLinks({
                        link_ids: links.map(l => l.id),
                        select: false,
                      });
                    } else {
                      selectAllVisible();
                    }
                  }}
                  aria-label="Select all visible links"
                />
              </TableHead>
              <TableHead>URL / Title</TableHead>
              <TableHead className="w-28">Category</TableHead>
              <TableHead className="w-20">Size</TableHead>
              <TableHead className="w-16">Depth</TableHead>
              <TableHead className="w-20">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && links.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-neutral-400">
                  Loading links...
                </TableCell>
              </TableRow>
            ) : links.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-neutral-400">
                  No links found
                </TableCell>
              </TableRow>
            ) : (
              links.map(link => (
                <TableRow key={link.id} className="group">
                  <TableCell>
                    <Checkbox
                      checked={link.is_selected}
                      onCheckedChange={() => toggleLink(link.id, link.is_selected)}
                      aria-label={`Select ${link.title || link.url}`}
                    />
                  </TableCell>
                  <TableCell className="max-w-md">
                    <div className="min-w-0">
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
                        <ExternalLink className="h-3 w-3 shrink-0 opacity-0 group-hover:opacity-100" />
                      </a>
                    </div>
                  </TableCell>
                  <TableCell>
                    <LinkCategoryBadge category={link.category} />
                  </TableCell>
                  <TableCell className="text-xs text-neutral-500">
                    {formatBytes(link.file_size_bytes)}
                  </TableCell>
                  <TableCell className="text-xs text-neutral-500">
                    {link.depth}
                  </TableCell>
                  <TableCell>
                    {link.is_downloaded ? (
                      <span className="text-xs text-green-600 font-medium">Downloaded</span>
                    ) : link.download_error ? (
                      <span className="text-xs text-red-500" title={link.download_error}>Error</span>
                    ) : (
                      <span className="text-xs text-neutral-400">Pending</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Load more */}
      {links.length < linksTotal && (
        <div className="flex justify-center pt-2">
          <button
            onClick={onLoadMore}
            className="text-sm text-cyan-600 hover:text-cyan-700 font-medium"
            disabled={isLoading}
          >
            Load more ({links.length} of {linksTotal})
          </button>
        </div>
      )}
    </div>
  );
};
