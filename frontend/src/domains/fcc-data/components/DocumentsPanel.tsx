'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  FileText, Download, Search as SearchIcon, Loader2,
  Camera, Cpu, BookOpen, Tag, Zap, Shield, Mail, File, GitBranch,
  CheckCircle2, AlertCircle, ExternalLink,
} from 'lucide-react';
import { useFCCDataStore } from '../store/fccData.store';
import type { FCCDocument, DocumentType } from '../types/fccData.types';
import { DOCUMENT_TYPE_CONFIG } from '../types/fccData.types';
import { fccDataApi } from '@/services/fccDataApi';

const DOC_TYPE_ICONS: Record<string, React.ElementType> = {
  FileText, Camera, Cpu, BookOpen, Tag, Zap, Shield, Mail, File, GitBranch,
};

function formatBytes(bytes: number | null): string {
  if (!bytes) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface DocumentsPanelProps {
  jobId: string;
  fccId: string;
}

export const DocumentsPanel: React.FC<DocumentsPanelProps> = ({ jobId, fccId }) => {
  const {
    documents, documentsTotal, isFetchingDocs, isDownloadingDocs,
    fetchDocumentsForFccId, getDocuments, downloadDocuments,
  } = useFCCDataStore();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filterType, setFilterType] = useState<DocumentType | 'all'>('all');

  // Load documents for this FCC ID
  useEffect(() => {
    getDocuments(jobId, { fcc_id: fccId });
  }, [jobId, fccId, getDocuments]);

  const filteredDocs = filterType === 'all'
    ? documents
    : documents.filter(d => d.document_type === filterType);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    const undownloaded = filteredDocs.filter(d => !d.is_downloaded);
    setSelectedIds(new Set(undownloaded.map(d => d.id)));
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleFetchDocs = useCallback(async () => {
    await fetchDocumentsForFccId(jobId, fccId);
  }, [fetchDocumentsForFccId, jobId, fccId]);

  const handleDownloadSelected = useCallback(async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    await downloadDocuments(jobId, ids);
    setSelectedIds(new Set());
  }, [downloadDocuments, jobId, selectedIds]);

  const handleDownloadSingle = async (documentId: string) => {
    try {
      await fccDataApi.downloadDocument(documentId);
    } catch {
      // Silent
    }
  };

  // Get unique document types for filter
  const docTypes = [...new Set(documents.map(d => d.document_type))];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-neutral-900">
            Documents for <span className="font-mono">{fccId}</span>
          </h3>
          <p className="text-xs text-neutral-500 mt-0.5">
            {documentsTotal} exhibit{documentsTotal !== 1 ? 's' : ''} found
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleFetchDocs}
            disabled={isFetchingDocs}
          >
            {isFetchingDocs ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <SearchIcon className="h-4 w-4 mr-1.5" />
            )}
            {documents.length > 0 ? 'Refresh' : 'Fetch Documents'}
          </Button>
          {selectedIds.size > 0 && (
            <Button
              size="sm"
              onClick={handleDownloadSelected}
              disabled={isDownloadingDocs}
            >
              {isDownloadingDocs ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-1.5" />
              )}
              Download {selectedIds.size} Selected
            </Button>
          )}
        </div>
      </div>

      {/* Document type filter */}
      {docTypes.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setFilterType('all')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              filterType === 'all'
                ? 'bg-neutral-900 text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            All ({documents.length})
          </button>
          {docTypes.map(type => {
            const config = DOCUMENT_TYPE_CONFIG[type];
            const count = documents.filter(d => d.document_type === type).length;
            return (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  filterType === type
                    ? 'bg-neutral-900 text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {config.label} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Bulk select bar */}
      {documents.length > 0 && (
        <div className="flex items-center gap-3 text-xs text-neutral-500">
          <button onClick={selectAll} className="text-cyan-600 hover:text-cyan-700 font-medium">
            Select all undownloaded
          </button>
          {selectedIds.size > 0 && (
            <button onClick={clearSelection} className="hover:text-neutral-700">
              Clear selection
            </button>
          )}
        </div>
      )}

      {/* Document list */}
      {documents.length === 0 && !isFetchingDocs ? (
        <div className="text-center py-8">
          <FileText className="h-8 w-8 text-neutral-300 mx-auto mb-3" />
          <p className="text-sm text-neutral-500">No documents discovered yet</p>
          <p className="text-xs text-neutral-400 mt-1">
            Click "Fetch Documents" to discover exhibits from FCC
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {filteredDocs.map(doc => {
            const config = DOCUMENT_TYPE_CONFIG[doc.document_type];
            const isSelected = selectedIds.has(doc.id);

            return (
              <div
                key={doc.id}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  isSelected ? 'border-cyan-300 bg-cyan-50/50' : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                {/* Checkbox */}
                {!doc.is_downloaded && (
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleSelect(doc.id)}
                    aria-label={`Select ${doc.exhibit_name}`}
                  />
                )}

                {/* Document info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs shrink-0">
                      {config.label}
                    </Badge>
                    <span className="text-sm font-medium text-neutral-900 truncate">
                      {doc.exhibit_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-neutral-400">
                    {doc.file_size_bytes && (
                      <span>{formatBytes(doc.file_size_bytes)}</span>
                    )}
                    {doc.mime_type && (
                      <span>{doc.mime_type.split('/').pop()?.toUpperCase()}</span>
                    )}
                  </div>
                </div>

                {/* Status + actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {doc.is_downloaded ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7"
                        onClick={() => handleDownloadSingle(doc.id)}
                        aria-label={`Download ${doc.exhibit_name}`}
                      >
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  ) : doc.download_error ? (
                    <span className="text-xs text-red-500 flex items-center gap-1" title={doc.download_error}>
                      <AlertCircle className="h-3.5 w-3.5" /> Error
                    </span>
                  ) : (
                    <span className="text-xs text-neutral-400">Pending</span>
                  )}
                  <a
                    href={doc.document_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neutral-400 hover:text-cyan-600"
                    aria-label="View on fccid.io"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
