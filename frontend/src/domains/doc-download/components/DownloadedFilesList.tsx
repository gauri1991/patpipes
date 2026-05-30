'use client';

import React from 'react';
import { Download, Eye, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable, createColumns } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table';
import type { DownloadedFile } from '../types/docDownload.types';
import { LinkCategoryBadge } from './LinkCategoryBadge';
import { docDownloadApi } from '@/services/docDownloadApi';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

interface DownloadedFilesListProps {
  files: DownloadedFile[];
  filesTotal: number;
  isLoading: boolean;
  onPreview?: (fileId: string) => void;
  onLoadMore?: () => void;
}

export const DownloadedFilesList: React.FC<DownloadedFilesListProps> = ({
  files, filesTotal, isLoading, onPreview, onLoadMore,
}) => {
  const { column } = createColumns<DownloadedFile>();

  const columns = [
    column({
      accessorKey: 'original_filename',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Filename" />,
      cell: ({ row }) => (
        <div className="flex items-center gap-2 min-w-0 max-w-xs">
          {row.original.is_rendered_page && (
            <Badge variant="outline" className="text-xs shrink-0">
              <Globe className="h-3 w-3 mr-1" />Rendered
            </Badge>
          )}
          <span className="text-sm truncate">{row.original.original_filename}</span>
        </div>
      ),
    }),
    column({
      accessorKey: 'category',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Category" />,
      cell: ({ getValue }) => <LinkCategoryBadge category={getValue() as DownloadedFile['category']} />,
      meta: { filterType: 'select' as const },
    }),
    column({
      accessorKey: 'file_size',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Size" />,
      cell: ({ getValue }) => <span className="text-xs text-neutral-500">{formatBytes(getValue() as number)}</span>,
      meta: { filterType: 'number-range' as const },
    }),
    column({
      id: 'type',
      header: 'Type',
      accessorFn: row => row.mime_type.split('/').pop()?.toUpperCase() || '—',
      cell: ({ getValue }) => <span className="text-xs text-neutral-500">{getValue() as string}</span>,
    }),
    column({
      accessorKey: 'downloaded_at',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Downloaded" />,
      cell: ({ getValue }) => <span className="text-xs text-neutral-500">{formatDate(getValue() as string)}</span>,
      meta: { filterType: 'date-range' as const },
    }),
    column({
      id: 'actions',
      header: '',
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => (
        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
          {onPreview && (
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
              onClick={() => onPreview(row.original.id)}
              aria-label={`Preview ${row.original.original_filename}`}>
              <Eye className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
            onClick={async () => { try { await docDownloadApi.downloadFile(row.original.id); } catch {} }}
            aria-label={`Download ${row.original.original_filename}`}>
            <Download className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    }),
  ];

  return (
    <div className="space-y-3">
      <DataTable
        data={files}
        columns={columns}
        getRowId={row => row.id}
        isLoading={isLoading && files.length === 0}
        features={{
          enableSorting: true,
          enableFiltering: true,
          enableColumnVisibility: true,
          enableDensityToggle: true,
          enableExport: true,
        }}
        exportConfig={{ filename: 'downloaded-files' }}
        initialPageSize={50}
        emptyState={
          <div className="flex flex-col items-center py-8 text-center">
            <p className="text-sm text-neutral-500">No downloaded files yet</p>
            <p className="text-xs text-neutral-400 mt-1">Select links and start downloading</p>
          </div>
        }
      />

      {files.length < filesTotal && onLoadMore && (
        <div className="flex justify-center pt-2">
          <button onClick={onLoadMore} className="text-sm text-cyan-600 hover:text-cyan-700 font-medium">
            Load more ({files.length} of {filesTotal})
          </button>
        </div>
      )}
    </div>
  );
};
