'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Search, Download, Eye, Filter, ChevronUp,
  Globe, ArrowUpDown,
} from 'lucide-react';
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
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const DataExplorerTab: React.FC = () => {
  const { files, filesTotal, isLoading, search, fetchFiles } = useFileExplorer();

  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<LinkCategory[]>([]);
  const [renderedOnly, setRenderedOnly] = useState<boolean | null>(null);
  const [ordering, setOrdering] = useState('-downloaded_at');
  const [expandedFileId, setExpandedFileId] = useState<string | null>(null);
  const [previewText, setPreviewText] = useState<string | null>(null);
  const offsetRef = useRef(0);

  const buildFilters = useCallback((): FileFilters => {
    const filters: FileFilters = {
      limit: 50,
      offset: offsetRef.current,
      ordering,
    };
    if (searchQuery) filters.search = searchQuery;
    if (selectedCategories.length > 0) filters.category = selectedCategories.join(',');
    if (renderedOnly !== null) filters.is_rendered_page = String(renderedOnly);
    return filters;
  }, [searchQuery, selectedCategories, renderedOnly, ordering]);

  // Debounced search
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    offsetRef.current = 0;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      search(buildFilters());
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery, selectedCategories, renderedOnly, ordering, search, buildFilters]);

  const toggleCategory = (cat: LinkCategory) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const loadMore = () => {
    offsetRef.current += 50;
    fetchFiles(buildFilters());
  };

  const toggleSort = (field: string) => {
    setOrdering(prev => prev === field ? `-${field}` : prev === `-${field}` ? field : `-${field}`);
  };

  const handlePreview = async (fileId: string) => {
    if (expandedFileId === fileId) {
      setExpandedFileId(null);
      setPreviewText(null);
      return;
    }
    setExpandedFileId(fileId);
    try {
      const response = await docDownloadApi.getFile(fileId);
      if (response.success && response.data) {
        setPreviewText(response.data.extracted_text || 'No text content available.');
      }
    } catch {
      setPreviewText('Failed to load preview.');
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <Input
            className="pl-9"
            placeholder="Search across all downloaded files..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            aria-label="Search files"
          />
        </div>
        <Button
          variant={showFilters ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4 mr-1.5" />
          Filters
          {(selectedCategories.length > 0 || renderedOnly !== null) && (
            <span className="ml-1.5 bg-white/20 text-xs rounded-full px-1.5">
              {selectedCategories.length + (renderedOnly !== null ? 1 : 0)}
            </span>
          )}
        </Button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="border rounded-lg p-4 space-y-3 bg-neutral-50">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Filters</h4>
            <button
              onClick={() => {
                setSelectedCategories([]);
                setRenderedOnly(null);
              }}
              className="text-xs text-neutral-500 hover:text-neutral-700"
            >
              Clear all
            </button>
          </div>

          {/* Category multi-select */}
          <div>
            <p className="text-xs text-neutral-500 mb-2">Categories</p>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => toggleCategory(key as LinkCategory)}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                    selectedCategories.includes(key as LinkCategory)
                      ? 'bg-neutral-900 text-white'
                      : 'bg-white border text-neutral-600 hover:border-neutral-300'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${config.color}`} />
                  {config.label}
                </button>
              ))}
            </div>
          </div>

          {/* Rendered vs original */}
          <div>
            <p className="text-xs text-neutral-500 mb-2">Source Type</p>
            <div className="flex gap-2">
              {[
                { label: 'All', value: null },
                { label: 'Original Docs', value: false },
                { label: 'Rendered Pages', value: true },
              ].map(opt => (
                <button
                  key={String(opt.value)}
                  onClick={() => setRenderedOnly(opt.value)}
                  className={`px-3 py-1 rounded text-xs transition-colors ${
                    renderedOnly === opt.value
                      ? 'bg-neutral-900 text-white'
                      : 'bg-white border text-neutral-600 hover:border-neutral-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results count */}
      <p className="text-xs text-neutral-500">
        {filesTotal} file{filesTotal !== 1 ? 's' : ''} found
      </p>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer" onClick={() => toggleSort('original_filename')}>
                <span className="flex items-center gap-1">
                  Filename <ArrowUpDown className="h-3 w-3" />
                </span>
              </TableHead>
              <TableHead>Source URL</TableHead>
              <TableHead>Job</TableHead>
              <TableHead className="w-28">Category</TableHead>
              <TableHead className="w-20 cursor-pointer" onClick={() => toggleSort('file_size')}>
                <span className="flex items-center gap-1">
                  Size <ArrowUpDown className="h-3 w-3" />
                </span>
              </TableHead>
              <TableHead className="w-32 cursor-pointer" onClick={() => toggleSort('downloaded_at')}>
                <span className="flex items-center gap-1">
                  Date <ArrowUpDown className="h-3 w-3" />
                </span>
              </TableHead>
              <TableHead className="w-20">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && files.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-neutral-400">
                  Loading...
                </TableCell>
              </TableRow>
            ) : files.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-neutral-400">
                  No files match your filters
                </TableCell>
              </TableRow>
            ) : (
              files.map(file => (
                <React.Fragment key={file.id}>
                  <TableRow className="group">
                    <TableCell className="max-w-xs">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {file.is_rendered_page && (
                          <Globe className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                        )}
                        <span className="text-sm truncate">{file.original_filename}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <span className="text-xs text-neutral-400 truncate block">
                        {file.link_url}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-neutral-500 truncate block max-w-[120px]">
                        {file.job_title}
                      </span>
                    </TableCell>
                    <TableCell>
                      <LinkCategoryBadge category={file.category} />
                    </TableCell>
                    <TableCell className="text-xs text-neutral-500">
                      {formatBytes(file.file_size)}
                    </TableCell>
                    <TableCell className="text-xs text-neutral-500">
                      {formatDate(file.downloaded_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => handlePreview(file.id)}
                          aria-label={`Preview ${file.original_filename}`}
                        >
                          {expandedFileId === file.id ? (
                            <ChevronUp className="h-3.5 w-3.5" />
                          ) : (
                            <Eye className="h-3.5 w-3.5" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={async () => {
                            try { await docDownloadApi.downloadFile(file.id); } catch {}
                          }}
                          aria-label={`Download ${file.original_filename}`}
                        >
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>

                  {/* Expanded preview row */}
                  {expandedFileId === file.id && previewText && (
                    <TableRow>
                      <TableCell colSpan={7} className="bg-neutral-50">
                        <div className="max-h-64 overflow-auto p-3 text-xs text-neutral-700 whitespace-pre-wrap font-mono">
                          {previewText}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Load more */}
      {files.length < filesTotal && (
        <div className="flex justify-center pt-2">
          <button
            onClick={loadMore}
            className="text-sm text-cyan-600 hover:text-cyan-700 font-medium"
          >
            Load more ({files.length} of {filesTotal})
          </button>
        </div>
      )}
    </div>
  );
};
