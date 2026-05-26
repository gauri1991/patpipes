'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText, FileJson, FileSpreadsheet } from 'lucide-react';
import type { FCCExportFile, ExportFormat } from '../types/fccData.types';
import { fccDataApi } from '@/services/fccDataApi';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface ExportBarProps {
  exports: FCCExportFile[];
  isExporting: boolean;
  onExport: (format: ExportFormat) => void;
  hasResults: boolean;
}

const FORMAT_ICONS: Record<string, React.ElementType> = {
  csv: FileSpreadsheet,
  json: FileJson,
  pdf: FileText,
};

export const ExportBar: React.FC<ExportBarProps> = ({
  exports, isExporting, onExport, hasResults,
}) => {
  return (
    <div className="space-y-3">
      {/* Export buttons */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-neutral-600 mr-2">Export as:</span>
        {(['csv', 'json', 'pdf'] as const).map(fmt => {
          const Icon = FORMAT_ICONS[fmt];
          return (
            <Button
              key={fmt}
              variant="outline"
              size="sm"
              onClick={() => onExport(fmt)}
              disabled={isExporting || !hasResults}
            >
              <Icon className="h-4 w-4 mr-1.5" />
              {fmt.toUpperCase()}
            </Button>
          );
        })}
      </div>

      {/* Past exports */}
      {exports.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs text-neutral-500 font-medium">Previous Exports</p>
          {exports.map(exp => (
            <div
              key={exp.id}
              className="flex items-center justify-between bg-neutral-50 rounded px-3 py-2"
            >
              <div className="flex items-center gap-2 text-sm">
                <Download className="h-3.5 w-3.5 text-neutral-400" />
                <span className="text-neutral-700">{exp.filename}</span>
                <span className="text-xs text-neutral-400">
                  {exp.record_count} records, {formatBytes(exp.file_size)}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7"
                onClick={async () => {
                  try { await fccDataApi.downloadExport(exp.id); } catch {}
                }}
                aria-label={`Download ${exp.filename}`}
              >
                <Download className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
