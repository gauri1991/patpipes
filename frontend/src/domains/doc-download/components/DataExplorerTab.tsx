'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Search, Download, Filter, Globe, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DataTable, createColumns } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table';
import type { DownloadedFile, FileFilters, LinkCategory } from '../types/docDownload.types';
import { CATEGORY_CONFIG } from '../types/docDownload.types';
import { LinkCategoryBadge } from './LinkCategoryBadge';
import { docDownloadApi } from '@/services/docDownloadApi';
import { useFileExplorer } from '../hooks/useDocDownload';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export const DataExplorerTab: React.FC = () => {
  const { files, filesTotal, isLoading, search, fetchFiles } = useFileExplorer();

  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<LinkCategory[]>([]);
  const [renderedOnly, setRenderedOnly] = useState<boolean | null>(null);
  const [ordering, setOrdering] = useState('-downloaded_at');

  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const offsetRef = useRef(0);

  const buildFilters = useCallback((): FileFilters => {
    const f: FileFilters = { limit: 50, offset: offsetRef.current, ordering };
    if (searchQuery) f.search = searchQuery;
    if (selectedCategories.length > 0) f.category = selectedCategories.join(',');
    if (renderedOnly !== null) f.is_rendered_page = String(renderedOnly);
    return f;
  }, [searchQuery, selectedCategories, renderedOnly, ordering]);

  useEffect(() => {
    offsetRef.current = 0;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { search(buildFilters()); }, 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, selectedCategories, renderedOnly, ordering]);

  const toggleCategory = (cat: LinkCategory) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const loadMore = () => {
    offsetRef.current += 50;
    fetchFiles(buildFilters());
  };

  const activeFilterCount = selectedCategories.length + (renderedOnly !== null ? 1 : 0);

  const { column } = createColumns<DownloadedFile>();

  const columns = [
    column({
      accessorKey: 'original_filename',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Filename" />,
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 min-w-0 max-w-xs">
          {row.original.is_rendered_page && <Globe className="h-3.5 w-3.5 text-neutral-400 shrink-0" />}
          <span className="text-sm truncate">{row.original.original_filename}</span>
        </div>
      ),
    }),
    column({
      id: 'link_url',
      header: 'Source URL',
      accessorKey: 'link_url',
      cell: ({ getValue }) => (
        <span className="text-xs text-neutral-400 truncate block max-w-xs">{getValue() as string}</span>
      ),
    }),
    column({
      id: 'job',
      header: 'Job',
      accessorKey: 'job_title',
      cell: ({ getValue }) => (
        <span className="text-xs text-neutral-500 truncate block max-w-[120px]">{getValue() as string}</span>
      ),
    }),
    column({
      accessorKey: 'category',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Category" />,
      cell: ({ getValue }) => <LinkCategoryBadge category={getValue() as LinkCategory} />,
      meta: { filterType: 'select' as const },
    }),
    column({
      accessorKey: 'file_size',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Size" />,
      cell: ({ getValue }) => <span className="text-xs text-neutral-500">{formatBytes(getValue() as number)}</span>,
      meta: { filterType: 'number-range' as const },
    }),
    column({
      accessorKey: 'downloaded_at',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
      cell: ({ getValue }) => <span className="text-xs text-neutral-500">{formatDate(getValue() as string)}</span>,
      meta: { filterType: 'date-range' as const },
    }),
    column({
      id: 'actions',
      header: '',
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => (
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
          onClick={async e => { e.stopPropagation(); try { await docDownloadApi.downloadFile(row.original.id); } catch {} }}
          aria-label={`Download ${row.original.original_filename}`}>
          <Download className="h-3.5 w-3.5" />
        </Button>
      ),
    }),
  ];

  const toolbar = (
    <div className="w-full space-y-3">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <Input className="pl-9" placeholder="Search across all downloaded files..." value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)} aria-label="Search files" />
        </div>
        <Button
          variant={showFilters || activeFilterCount > 0 ? 'default' : 'outline'}
          size="sm"
          className={showFilters || activeFilterCount > 0 ? 'bg-neutral-900 text-white hover:bg-neutral-800 gap-1' : 'gap-1'}
          onClick={() => setShowFilters(v => !v)}
        >
          <Filter className="h-3 w-3" />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-1 bg-white/20 text-[10px] rounded-full px-1.5 py-0.5">{activeFilterCount}</span>
          )}
        </Button>
      </div>

      {showFilters && (
        <div className="border rounded-lg p-4 space-y-3 bg-neutral-50">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Filters</h4>
            <div className="flex items-center gap-2">
              {activeFilterCount > 0 && (
                <button onClick={() => { setSelectedCategories([]); setRenderedOnly(null); }}
                  className="text-xs text-neutral-500 hover:text-neutral-700">Clear all</button>
              )}
              <button onClick={() => setShowFilters(false)} className="text-neutral-400 hover:text-neutral-600">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div>
            <p className="text-xs text-neutral-500 mb-2">Categories</p>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                <button key={key} onClick={() => toggleCategory(key as LinkCategory)}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                    selectedCategories.includes(key as LinkCategory)
                      ? 'bg-neutral-900 text-white'
                      : 'bg-white border text-neutral-600 hover:border-neutral-300'
                  }`}>
                  <span className={`w-2 h-2 rounded-full ${config.color}`} />
                  {config.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs text-neutral-500 mb-2">Source Type</p>
            <div className="flex gap-2">
              {([{ label: 'All', value: null }, { label: 'Original Docs', value: false }, { label: 'Rendered Pages', value: true }] as const).map(opt => (
                <button key={String(opt.value)} onClick={() => setRenderedOnly(opt.value)}
                  className={`px-3 py-1 rounded text-xs transition-colors ${
                    renderedOnly === opt.value
                      ? 'bg-neutral-900 text-white'
                      : 'bg-white border text-neutral-600 hover:border-neutral-300'
                  }`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <p className="text-xs text-neutral-500">{filesTotal} file{filesTotal !== 1 ? 's' : ''} found</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <DataTable
        data={files}
        columns={columns}
        getRowId={row => row.id}
        isLoading={isLoading && files.length === 0}
        features={{
          enableSorting: true,
          enableFiltering: false,   // search handled in toolbarExtra
          enableColumnVisibility: true,
          enableDensityToggle: true,
          enableExport: true,
          enableRowExpansion: true,
        }}
        renderSubRow={row => {
          // Text preview is loaded lazily — show a fetch-on-expand pattern
          return <TextPreview fileId={row.original.id} />;
        }}
        toolbarExtra={toolbar}
        exportConfig={{ filename: 'downloaded-files' }}
        initialPageSize={50}
        emptyState="No files match your filters"
      />

      {files.length < filesTotal && (
        <div className="flex justify-center pt-2">
          <button onClick={loadMore} className="text-sm text-cyan-600 hover:text-cyan-700 font-medium">
            Load more ({files.length} of {filesTotal})
          </button>
        </div>
      )}
    </div>
  );
};

// Lazy-loaded text preview for expanded rows
function TextPreview({ fileId }: { fileId: string }) {
  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    docDownloadApi.getFile(fileId)
      .then(res => {
        if (!cancelled) setText(res.success && res.data ? (res.data.extracted_text || 'No text content available.') : 'Failed to load preview.');
      })
      .catch(() => { if (!cancelled) setText('Failed to load preview.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [fileId]);

  if (loading) return <div className="px-6 py-3 text-xs text-neutral-400 bg-neutral-50">Loading preview…</div>;

  return (
    <div className="px-6 py-3 bg-neutral-50 border-t border-neutral-100">
      <div className="max-h-64 overflow-auto text-xs text-neutral-700 whitespace-pre-wrap font-mono">{text}</div>
    </div>
  );
}
