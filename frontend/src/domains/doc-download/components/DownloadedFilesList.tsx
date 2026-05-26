'use client';

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Eye, FileText, Globe } from 'lucide-react';
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
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
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
  files,
  filesTotal,
  isLoading,
  onPreview,
  onLoadMore,
}) => {
  const handleDownload = async (fileId: string) => {
    try {
      await docDownloadApi.downloadFile(fileId);
    } catch {
      // Error handled silently
    }
  };

  if (isLoading && files.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-neutral-400">
        Loading files...
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileText className="h-8 w-8 text-neutral-300 mb-3" />
        <p className="text-sm text-neutral-500">No downloaded files yet</p>
        <p className="text-xs text-neutral-400 mt-1">Select links and start downloading</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Filename</TableHead>
              <TableHead className="w-28">Category</TableHead>
              <TableHead className="w-20">Size</TableHead>
              <TableHead className="w-20">Type</TableHead>
              <TableHead className="w-32">Downloaded</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {files.map(file => (
              <TableRow key={file.id}>
                <TableCell className="max-w-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    {file.is_rendered_page && (
                      <Badge variant="outline" className="text-xs shrink-0">
                        <Globe className="h-3 w-3 mr-1" />
                        Rendered
                      </Badge>
                    )}
                    <span className="text-sm truncate">{file.original_filename}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <LinkCategoryBadge category={file.category} />
                </TableCell>
                <TableCell className="text-xs text-neutral-500">
                  {formatBytes(file.file_size)}
                </TableCell>
                <TableCell className="text-xs text-neutral-500">
                  {file.mime_type.split('/').pop()?.toUpperCase() || '-'}
                </TableCell>
                <TableCell className="text-xs text-neutral-500">
                  {formatDate(file.downloaded_at)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {onPreview && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => onPreview(file.id)}
                        aria-label={`Preview ${file.original_filename}`}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => handleDownload(file.id)}
                      aria-label={`Download ${file.original_filename}`}
                    >
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {files.length < filesTotal && onLoadMore && (
        <div className="flex justify-center pt-2">
          <button
            onClick={onLoadMore}
            className="text-sm text-cyan-600 hover:text-cyan-700 font-medium"
          >
            Load more ({files.length} of {filesTotal})
          </button>
        </div>
      )}
    </div>
  );
};
