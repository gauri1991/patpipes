'use client';

import { useState, useRef, useCallback } from 'react';
import {
  Upload,
  FileText,
  FileArchive,
  Download,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

import { attorneyApi, AttorneyImportResult } from '@/services/attorneyApi';

// ---------------------------------------------------------------------------
// CSV template for custom format
// ---------------------------------------------------------------------------
const CUSTOM_CSV_HEADERS = [
  'first_name',
  'last_name',
  'email',
  'phone',
  'title',
  'firm_name',
  'city',
  'state',
  'country',
  'postal_code',
  'registration_number',
  'practitioner_type',
  'years_of_experience',
  'bio',
  'specializations',
].join(',');

const CUSTOM_CSV_EXAMPLE =
  [
    CUSTOM_CSV_HEADERS,
    'Jane,Smith,jane@iplaw.com,+1-555-0100,Patent Attorney,Smith & Jones LLP,San Francisco,CA,US,94105,67890,ATTORNEY,12,"Specializes in software patents","Patent Prosecution;IP Strategy"',
    'Robert,Chen,,,Patent Agent,Independent,,,,WA,US,98101,45321,AGENT,5,,',
  ].join('\n');

function downloadTemplate() {
  const blob = new Blob([CUSTOM_CSV_EXAMPLE], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'attorney_import_template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface DropZoneProps {
  accept: string;
  label: string;
  hint: string;
  icon: React.ReactNode;
  file: File | null;
  onFile: (f: File) => void;
  onClear: () => void;
}

function DropZone({ accept, label, hint, icon, file, onFile, onClear }: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const dropped = e.dataTransfer.files[0];
      if (dropped) onFile(dropped);
    },
    [onFile],
  );

  if (file) {
    return (
      <div className="flex items-center gap-3 border rounded-lg p-4 bg-muted/30">
        {icon}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{file.name}</p>
          <p className="text-xs text-muted-foreground">
            {(file.size / 1024).toFixed(1)} KB
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClear}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
        dragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
      }`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }}
      />
      <div className="flex justify-center mb-3 text-muted-foreground">{icon}</div>
      <p className="text-sm font-medium mb-1">{label}</p>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function ResultSummary({ result }: { result: AttorneyImportResult }) {
  const totalImported = result.created + result.updated;
  return (
    <div className="space-y-4">
      {result.dry_run && (
        <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Dry run — no data was written to the database.
        </div>
      )}

      <div className="grid grid-cols-4 gap-3">
        <div className="text-center p-3 bg-muted rounded-lg">
          <p className="text-2xl font-bold">{result.total_rows}</p>
          <p className="text-xs text-muted-foreground mt-1">Rows parsed</p>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <p className="text-2xl font-bold text-green-700">{result.created}</p>
          <p className="text-xs text-muted-foreground mt-1">Created</p>
        </div>
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <p className="text-2xl font-bold text-blue-700">{result.updated}</p>
          <p className="text-xs text-muted-foreground mt-1">Updated</p>
        </div>
        <div className="text-center p-3 bg-muted rounded-lg">
          <p className="text-2xl font-bold text-muted-foreground">{result.skipped}</p>
          <p className="text-xs text-muted-foreground mt-1">Skipped</p>
        </div>
      </div>

      {totalImported > 0 && !result.dry_run && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Successfully imported {totalImported} attorney{totalImported !== 1 ? 's' : ''}.
        </div>
      )}

      {result.errors.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-500" />
            <span className="text-sm font-medium">
              {result.errors.length} error{result.errors.length !== 1 ? 's' : ''}
            </span>
          </div>
          <ScrollArea className="h-40 border rounded-md">
            <div className="p-3 space-y-1">
              {result.errors.map((err, i) => (
                <div key={i} className="text-xs text-red-700 flex gap-2">
                  <span className="shrink-0 font-mono text-muted-foreground">Row {err.row}</span>
                  <span>{err.message}</span>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main dialog
// ---------------------------------------------------------------------------

interface AttorneyImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete?: () => void;
}

export function AttorneyImportDialog({
  open,
  onOpenChange,
  onImportComplete,
}: AttorneyImportDialogProps) {
  const [format, setFormat] = useState<'custom' | 'uspto_roster'>('custom');
  const [file, setFile] = useState<File | null>(null);
  const [dryRun, setDryRun] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<AttorneyImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setFile(null);
    setResult(null);
    setError(null);
    setDryRun(false);
  };

  const handleFormatChange = (val: string) => {
    setFormat(val as 'custom' | 'uspto_roster');
    setFile(null);
    setResult(null);
    setError(null);
  };

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    setResult(null);
    setError(null);
    try {
      const response = await attorneyApi.importAttorneys(file, format, dryRun);
      if (response.success && response.data) {
        setResult(response.data);
        if (!dryRun && response.data.created + response.data.updated > 0) {
          onImportComplete?.();
        }
      } else {
        setError(response.error ?? 'Import failed. Please check the file format and try again.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error during import.');
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    if (!importing) {
      reset();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Attorneys
          </DialogTitle>
          <DialogDescription>
            Import attorneys in bulk from a CSV file or USPTO roster ZIP.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <Tabs value={format} onValueChange={handleFormatChange}>
            <TabsList className="w-full">
              <TabsTrigger value="custom" className="flex-1">
                <FileText className="h-4 w-4 mr-2" />
                Custom CSV
              </TabsTrigger>
              <TabsTrigger value="uspto_roster" className="flex-1">
                <FileArchive className="h-4 w-4 mr-2" />
                USPTO Roster ZIP
              </TabsTrigger>
            </TabsList>

            <TabsContent value="custom" className="space-y-4 mt-4">
              <div className="flex items-start justify-between gap-4">
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Upload a CSV with a header row. Required columns: <code className="text-xs bg-muted px-1 py-0.5 rounded">first_name</code>, <code className="text-xs bg-muted px-1 py-0.5 rounded">last_name</code>.</p>
                  <p>Use semicolons to separate multiple specializations in one cell.</p>
                </div>
                <Button variant="outline" size="sm" onClick={downloadTemplate} className="shrink-0">
                  <Download className="h-4 w-4 mr-2" />
                  Template
                </Button>
              </div>
              <DropZone
                accept=".csv,text/csv"
                label="Drop your CSV file here or click to browse"
                hint="Accepts .csv files"
                icon={<FileText className="h-10 w-10" />}
                file={file}
                onFile={setFile}
                onClear={() => setFile(null)}
              />
            </TabsContent>

            <TabsContent value="uspto_roster" className="space-y-4 mt-4">
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Upload the official USPTO practitioner roster ZIP downloaded from <span className="font-medium">oedci.uspto.gov</span>.</p>
                <p>The ZIP must contain <code className="text-xs bg-muted px-1 py-0.5 rounded">WebRoster.txt</code> in the standard 16-column format.</p>
              </div>
              <DropZone
                accept=".zip,application/zip"
                label="Drop the USPTO roster ZIP here or click to browse"
                hint="Accepts .zip files — typically ~5 MB"
                icon={<FileArchive className="h-10 w-10" />}
                file={file}
                onFile={setFile}
                onClear={() => setFile(null)}
              />
            </TabsContent>
          </Tabs>

          {/* Options */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="dry-run"
              checked={dryRun}
              onCheckedChange={(v) => setDryRun(!!v)}
            />
            <Label htmlFor="dry-run" className="text-sm cursor-pointer">
              Dry run — parse and count rows without saving to the database
            </Label>
          </div>

          {/* Error banner */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
              <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {/* Results */}
          {result && (
            <>
              <Separator />
              <div>
                <p className="text-sm font-medium mb-3">Import Results</p>
                <ResultSummary result={result} />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2">
          <div>
            {result && !result.dry_run && (
              <Button variant="ghost" size="sm" onClick={reset}>
                Import another file
              </Button>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleClose} disabled={importing}>
              {result && !result.dry_run ? 'Close' : 'Cancel'}
            </Button>
            <Button
              onClick={handleImport}
              disabled={!file || importing}
            >
              {importing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importing…
                </>
              ) : dryRun ? (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Run Dry Run
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
