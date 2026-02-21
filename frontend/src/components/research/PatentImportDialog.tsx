/**
 * PatentImportDialog Component
 * Professional CSV/Excel import interface with column mapping
 */

'use client';

import { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import {
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  ChevronRight,
  RefreshCw,
  FileText,
  Database,
  X
} from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { patentImportApi } from '@/services/patentImportApi';

interface PatentImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (patents: any[]) => Promise<void>;
  projectId: string;
}

interface ColumnMapping {
  sourceColumn: string;
  targetField: string;
  sampleData: string[];
}

interface ImportStats {
  totalRows: number;
  validRows: number;
  duplicates: number;
  errors: number;
}

const PATENT_FIELDS = [
  { value: 'patent_id', label: 'Patent ID/Number', required: true },
  { value: 'title', label: 'Title', required: true },
  { value: 'abstract', label: 'Abstract', required: false },
  { value: 'publication_date', label: 'Publication Date', required: false },
  { value: 'application_date', label: 'Application Date', required: false },
  { value: 'assignee', label: 'Assignee/Owner', required: false },
  { value: 'inventors', label: 'Inventors', required: false },
  { value: 'ipc_classes', label: 'IPC Classifications', required: false },
  { value: 'cpc_classes', label: 'CPC Classifications', required: false },
  { value: 'jurisdiction', label: 'Jurisdiction/Country', required: false },
  { value: 'publication_number', label: 'Publication Number', required: false },
  { value: 'priority_date', label: 'Priority Date', required: false },
  { value: 'family_id', label: 'Patent Family ID', required: false },
  { value: 'citations', label: 'Citations', required: false },
  { value: 'keywords', label: 'Keywords', required: false },
  { value: 'ignore', label: '-- Ignore Column --', required: false }
];

export function PatentImportDialog({
  open,
  onOpenChange,
  onImport,
  projectId
}: PatentImportDialogProps) {
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview' | 'importing' | 'complete'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [fileData, setFileData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [importStats, setImportStats] = useState<ImportStats>({
    totalRows: 0,
    validRows: 0,
    duplicates: 0,
    errors: 0
  });
  const [importProgress, setImportProgress] = useState(0);
  const [importError, setImportError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setImportError(null);

    // Parse file based on type
    const isExcel = uploadedFile.name.endsWith('.xlsx') || uploadedFile.name.endsWith('.xls');
    
    if (isExcel) {
      // Handle Excel files with ArrayBuffer
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Get first sheet
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // Convert to JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          if (jsonData.length === 0) {
            throw new Error('Excel file is empty');
          }
          
          // First row as headers
          const parsedHeaders = (jsonData[0] as any[]).map(h => String(h || '').trim());
          
          // Remaining rows as data
          const parsedData = jsonData.slice(1)
            .filter((row: any) => row && row.some((cell: any) => cell !== null && cell !== undefined && String(cell).trim() !== ''))
            .map((row: any) => {
              const rowData: any = {};
              parsedHeaders.forEach((header, index) => {
                const cellValue = row[index];
                rowData[header] = cellValue !== null && cellValue !== undefined ? String(cellValue).trim() : '';
              });
              return rowData;
            });
          
          processFileData(parsedHeaders, parsedData, uploadedFile.name);
        } catch (error) {
          setImportError(`Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`);
          console.error('Excel parse error:', error);
        }
      };
      reader.readAsArrayBuffer(uploadedFile);
    } else {
      // Handle CSV and JSON files with text reader
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        
        try {
          let parsedData: any[] = [];
          let parsedHeaders: string[] = [];

          if (uploadedFile.name.endsWith('.csv')) {
            // Parse CSV
            const lines = content.split('\n').filter(line => line.trim());
            if (lines.length === 0) {
              throw new Error('CSV file is empty');
            }
            
            parsedHeaders = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
            
            parsedData = lines.slice(1)
              .filter(line => line.trim())
              .map(line => {
                const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
                const row: any = {};
                parsedHeaders.forEach((header, index) => {
                  row[header] = values[index] || '';
                });
                return row;
              });
          } else if (uploadedFile.name.endsWith('.json')) {
            // Parse JSON
            const jsonData = JSON.parse(content);
            parsedData = Array.isArray(jsonData) ? jsonData : [jsonData];
            if (parsedData.length > 0) {
              parsedHeaders = Object.keys(parsedData[0]);
            }
          } else {
            throw new Error('Unsupported file format. Please use CSV, Excel (.xlsx, .xls), or JSON files.');
          }
          
          processFileData(parsedHeaders, parsedData, uploadedFile.name);
        } catch (error) {
          setImportError(`Failed to parse file: ${error instanceof Error ? error.message : 'Unknown error'}`);
          console.error('Parse error:', error);
        }
      };
      reader.readAsText(uploadedFile);
    }
  }, []);

  const processFileData = (parsedHeaders: string[], parsedData: any[], fileName: string) => {
    if (parsedHeaders.length === 0) {
      setImportError('No columns found in the file.');
      return;
    }
    
    if (parsedData.length === 0) {
      setImportError('No data rows found in the file.');
      return;
    }

    setHeaders(parsedHeaders);
    setFileData(parsedData);
    
    // Auto-map columns based on name similarity
    const autoMappings = parsedHeaders.map(header => {
      const lowerHeader = header.toLowerCase();
      let targetField = 'ignore';
      
      // Smart mapping based on common column names
      if (lowerHeader.includes('patent') && (lowerHeader.includes('id') || lowerHeader.includes('number'))) {
        targetField = 'patent_id';
      } else if (lowerHeader.includes('title')) {
        targetField = 'title';
      } else if (lowerHeader.includes('abstract') || lowerHeader.includes('summary')) {
        targetField = 'abstract';
      } else if (lowerHeader.includes('publication') && lowerHeader.includes('date')) {
        targetField = 'publication_date';
      } else if (lowerHeader.includes('application') && lowerHeader.includes('date')) {
        targetField = 'application_date';
      } else if (lowerHeader.includes('assignee') || lowerHeader.includes('owner') || lowerHeader.includes('applicant')) {
        targetField = 'assignee';
      } else if (lowerHeader.includes('inventor')) {
        targetField = 'inventors';
      } else if (lowerHeader.includes('ipc')) {
        targetField = 'ipc_classes';
      } else if (lowerHeader.includes('cpc')) {
        targetField = 'cpc_classes';
      } else if (lowerHeader.includes('country') || lowerHeader.includes('jurisdiction')) {
        targetField = 'jurisdiction';
      }

      return {
        sourceColumn: header,
        targetField,
        sampleData: parsedData.slice(0, 3).map(row => row[header] || '')
      };
    });

    setMappings(autoMappings);
    setImportStats({
      totalRows: parsedData.length,
      validRows: parsedData.length,
      duplicates: 0,
      errors: 0
    });
    
    setStep('mapping');
  };

  const handleMappingChange = (sourceColumn: string, targetField: string) => {
    setMappings(prev => prev.map(m => 
      m.sourceColumn === sourceColumn 
        ? { ...m, targetField }
        : m
    ));
  };

  const validateAndPreview = () => {
    // Check for required fields
    const hasPatentId = mappings.some(m => m.targetField === 'patent_id');
    const hasTitle = mappings.some(m => m.targetField === 'title');

    if (!hasPatentId || !hasTitle) {
      setImportError('Please map at least Patent ID and Title fields');
      return;
    }

    // Transform data based on mappings
    const transformedData = fileData.map((row, index) => {
      const patent: any = {
        _importRowNumber: index + 1,
        is_selected: false,
        manual_relevance: '',
        relevance_score: null
      };

      mappings.forEach(mapping => {
        if (mapping.targetField !== 'ignore') {
          let value = row[mapping.sourceColumn];
          
          // Handle special field transformations
          if (mapping.targetField === 'inventors' && typeof value === 'string') {
            value = value.split(/[;,|]/).map((i: string) => i.trim()).filter(Boolean);
          } else if ((mapping.targetField === 'ipc_classes' || mapping.targetField === 'cpc_classes') && typeof value === 'string') {
            value = value.split(/[;,|]/).map((c: string) => c.trim()).filter(Boolean);
          } else if (mapping.targetField.includes('date') && value) {
            // Try to parse date
            const parsed = new Date(value);
            value = isNaN(parsed.getTime()) ? value : parsed.toISOString().split('T')[0];
          }
          
          patent[mapping.targetField] = value;
        }
      });

      // Ensure arrays for certain fields
      patent.inventors = patent.inventors || [];
      patent.ipc_classes = patent.ipc_classes || [];
      patent.cpc_classes = patent.cpc_classes || [];

      return patent;
    });

    setPreviewData(transformedData.slice(0, 5));
    setStep('preview');
  };

  const handleImport = async () => {
    setStep('importing');
    setImportProgress(0);
    setImportError(null);

    try {
      // Transform all data
      const transformedData = fileData.map((row, index) => {
        const patent: any = {
          is_selected: false,
          manual_relevance: '',
          relevance_score: null
        };

        mappings.forEach(mapping => {
          if (mapping.targetField !== 'ignore') {
            let value = row[mapping.sourceColumn];
            
            if (mapping.targetField === 'inventors' && typeof value === 'string') {
              value = value.split(/[;,|]/).map((i: string) => i.trim()).filter(Boolean);
            } else if ((mapping.targetField === 'ipc_classes' || mapping.targetField === 'cpc_classes') && typeof value === 'string') {
              value = value.split(/[;,|]/).map((c: string) => c.trim()).filter(Boolean);
            } else if (mapping.targetField.includes('date') && value) {
              const parsed = new Date(value);
              value = isNaN(parsed.getTime()) ? value : parsed.toISOString().split('T')[0];
            }
            
            patent[mapping.targetField] = value;
          }
        });

        // Ensure required fields
        patent.inventors = patent.inventors || [];
        patent.ipc_classes = patent.ipc_classes || [];
        patent.cpc_classes = patent.cpc_classes || [];

        // Update progress
        setImportProgress(Math.round(((index + 1) / fileData.length) * 80));

        return patent;
      });

      // Prepare batch data for backend API
      const batchData = {
        batch_name: `Import from ${file?.name || 'file'}`,
        batch_description: `Imported ${transformedData.length} patents from ${file?.name || 'file'}`,
        source_filename: file?.name || 'unknown',
        import_settings: {
          mappings: mappings,
          import_mode: importMode,
          skip_duplicates: skipDuplicates
        },
        patents: transformedData
      };

      // Call backend API to save the import
      const importBatch = await patentImportApi.createImportBatch(projectId, batchData);
      
      setImportProgress(100);
      setImportStats(prev => ({
        ...prev,
        validRows: importBatch.successful_imports,
        errors: importBatch.failed_imports,
        duplicates: importBatch.error_log?.filter((e: any) => e.error.includes('Duplicate')).length || 0
      }));

      // Also call the frontend handler for immediate UI update
      await onImport(transformedData);
      
      setStep('complete');
    } catch (error) {
      setImportError(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('Import error:', error);
      setStep('preview');
    }
  };

  const resetDialog = () => {
    setStep('upload');
    setFile(null);
    setFileData([]);
    setHeaders([]);
    setMappings([]);
    setPreviewData([]);
    setImportProgress(0);
    setImportError(null);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) resetDialog();
      onOpenChange(open);
    }}>
      <DialogContent className="max-w-6xl w-full max-h-[90vh] p-0 overflow-hidden">
        <div className="flex flex-col h-full max-h-[90vh]">
          {/* Fixed Header */}
          <div className="flex-shrink-0 p-6 pb-4 border-b">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Import Patents
              </DialogTitle>
              <DialogDescription>
                Import patents from CSV, Excel, or JSON files with intelligent column mapping
              </DialogDescription>
            </DialogHeader>

            {/* Progress Steps */}
            <div className="flex items-center justify-between mt-6">
              {['upload', 'mapping', 'preview', 'importing', 'complete'].map((s, index) => (
                <div key={s} className="flex items-center">
                  <div className={`
                    flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
                    ${step === s ? 'bg-primary text-primary-foreground' : 
                      ['upload', 'mapping', 'preview', 'importing', 'complete'].indexOf(step) > index 
                        ? 'bg-green-500 text-white' 
                        : 'bg-muted text-muted-foreground'}
                  `}>
                    {['upload', 'mapping', 'preview', 'importing', 'complete'].indexOf(step) > index ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  {index < 4 && (
                    <ChevronRight className="h-4 w-4 mx-2 text-muted-foreground" />
                  )}
                </div>
              ))}
            </div>

            {importError && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{importError}</AlertDescription>
              </Alert>
            )}
          </div>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-auto p-6 min-h-0">
            <div className="space-y-4">

        {/* Step Content */}
        {step === 'upload' && (
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <Label htmlFor="file-upload" className="cursor-pointer">
                    <span className="text-lg font-medium">Drop file here or click to browse</span>
                    <input
                      id="file-upload"
                      type="file"
                      accept=".csv,.xlsx,.xls,.json"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </Label>
                  <p className="text-sm text-muted-foreground mt-2">
                    Supports CSV, Excel (.xlsx, .xls), and JSON files
                  </p>
                </div>

                {file && (
                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span className="font-medium">{file.name}</span>
                        <Badge variant="outline">{(file.size / 1024).toFixed(2)} KB</Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setFile(null);
                          setFileData([]);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h4 className="font-medium mb-3">Import Options</h4>
                <div className="space-y-4">
                  <div>
                    <Label>Import Mode</Label>
                    <RadioGroup value={importMode} onValueChange={(value: any) => setImportMode(value)}>
                      <div className="flex items-center space-x-2 mt-2">
                        <RadioGroupItem value="append" id="append" />
                        <Label htmlFor="append" className="font-normal">
                          Append to existing patents
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 mt-2">
                        <RadioGroupItem value="replace" id="replace" />
                        <Label htmlFor="replace" className="font-normal">
                          Replace existing patents (clear all current data)
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="skip-duplicates"
                      checked={skipDuplicates}
                      onCheckedChange={(checked) => setSkipDuplicates(checked as boolean)}
                    />
                    <Label htmlFor="skip-duplicates" className="font-normal">
                      Skip duplicate patent IDs
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sample CSV Format Guide */}
            <Card>
              <CardContent className="pt-6">
                <h4 className="font-medium mb-3">Sample CSV Format</h4>
                <div className="bg-muted p-4 rounded-lg font-mono text-sm overflow-x-auto">
                  <div>Patent Number,Title,Abstract,Assignee,Publication Date</div>
                  <div>US10123456B2,"AI System for Image Recognition","A method for...",Tech Corp,2023-01-15</div>
                  <div>US10234567B2,"Blockchain Payment System","Distributed ledger...",Finance Inc,2023-02-20</div>
                  <div>US10345678B2,"IoT Device Management","System for managing...",IoT Labs,2023-03-10</div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Supported columns: Patent Number*, Title*, Abstract, Assignee, Publication Date, Application Date, 
                  Inventors, IPC Classifications, CPC Classifications, Jurisdiction, Keywords, Priority Date, Family ID
                </p>
                <p className="text-sm text-muted-foreground">
                  * Required fields
                </p>
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800 font-medium">📊 Excel Files:</p>
                  <p className="text-xs text-blue-700 mt-1">
                    For Excel files (.xlsx/.xls), only the first sheet will be imported. 
                    Ensure your data is in the first sheet with headers in the first row.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Upload Tips */}
            <Card>
              <CardContent className="pt-6">
                <h4 className="font-medium mb-3">Upload Tips</h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div>• Use semicolons (;) or pipes (|) to separate multiple inventors or classifications</div>
                  <div>• Date formats: YYYY-MM-DD, MM/DD/YYYY, or DD-MM-YYYY (Excel dates are auto-converted)</div>
                  <div>• Maximum file size: 50MB (Excel files may be larger due to formatting)</div>
                  <div>• Excel files (.xlsx/.xls): First sheet only, headers in row 1</div>
                  <div>• CSV files: UTF-8 encoding recommended</div>
                  <div>• JSON files: Array of patent objects with consistent structure</div>
                  <div>• Column names are case-insensitive and spaces will be ignored</div>
                  <div>• Missing required fields will be flagged during validation</div>
                  <div>• Duplicate patent numbers will be detected and can be skipped</div>
                  <div>• Excel formulas will be converted to their calculated values</div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {step === 'mapping' && (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Map your file columns to patent fields. Required fields are marked with an asterisk (*).
              </AlertDescription>
            </Alert>

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Source Column</TableHead>
                    <TableHead>Sample Data</TableHead>
                    <TableHead>Map to Field</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mappings.map((mapping) => (
                    <TableRow key={mapping.sourceColumn}>
                      <TableCell className="font-medium">
                        {mapping.sourceColumn}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {mapping.sampleData.slice(0, 2).map((data, idx) => (
                            <div key={idx} className="truncate max-w-xs">
                              {data || '(empty)'}
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={mapping.targetField}
                          onValueChange={(value) => handleMappingChange(mapping.sourceColumn, value)}
                        >
                          <SelectTrigger className="w-[200px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="z-[60]" position="popper" sideOffset={4}>
                            {PATENT_FIELDS.map(field => (
                              <SelectItem key={field.value} value={field.value}>
                                {field.label}
                                {field.required && ' *'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                {importStats.totalRows} rows detected
              </div>
              <Button onClick={validateAndPreview}>
                Continue to Preview
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertDescription>
                Preview of first 5 patents. Review the data before importing.
              </AlertDescription>
            </Alert>

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patent ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Assignee</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Classifications</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.map((patent, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-mono text-sm">
                        {patent.patent_id || '(missing)'}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate">
                          {patent.title || '(missing)'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {patent.assignee || '-'}
                      </TableCell>
                      <TableCell>
                        {patent.publication_date || patent.application_date || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {patent.ipc_classes?.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              IPC: {patent.ipc_classes.length}
                            </Badge>
                          )}
                          {patent.cpc_classes?.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              CPC: {patent.cpc_classes.length}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <Card>
              <CardContent className="pt-4">
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Total Patents:</span>
                    <span className="ml-2 font-medium">{importStats.totalRows}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Valid:</span>
                    <span className="ml-2 font-medium text-green-600">{importStats.validRows}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Duplicates:</span>
                    <span className="ml-2 font-medium text-yellow-600">{importStats.duplicates}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Errors:</span>
                    <span className="ml-2 font-medium text-red-600">{importStats.errors}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {step === 'importing' && (
          <div className="space-y-4 py-8">
            <div className="text-center">
              <RefreshCw className="h-12 w-12 text-primary mx-auto mb-4 animate-spin" />
              <h3 className="text-lg font-medium mb-2">Importing Patents...</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Processing {importStats.totalRows} patents
              </p>
              <Progress value={importProgress} className="w-full mb-2" />
              <span className="text-sm text-muted-foreground">{importProgress}%</span>
            </div>
          </div>
        )}

        {step === 'complete' && (
          <div className="space-y-4 py-8">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Import Complete!</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Successfully imported {importStats.validRows} patents
              </p>
              
              <Card className="max-w-sm mx-auto">
                <CardContent className="pt-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Imported:</span>
                      <span className="font-medium text-green-600">{importStats.validRows}</span>
                    </div>
                    {importStats.duplicates > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Skipped (duplicates):</span>
                        <span className="font-medium text-yellow-600">{importStats.duplicates}</span>
                      </div>
                    )}
                    {importStats.errors > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Failed:</span>
                        <span className="font-medium text-red-600">{importStats.errors}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
            </div>
          </div>

          {/* Fixed Footer */}
          <div className="flex-shrink-0 border-t p-6">
            <div className="flex justify-end gap-2">
              {step === 'upload' && (
                <>
                  <Button variant="outline" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => fileData.length > 0 && setStep('mapping')}
                    disabled={!file || fileData.length === 0}
                  >
                    Next: Map Columns
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </>
              )}
              
              {step === 'mapping' && (
                <>
                  <Button variant="outline" onClick={() => setStep('upload')}>
                    Back
                  </Button>
                  <Button onClick={validateAndPreview}>
                    Next: Preview
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </>
              )}
              
              {step === 'preview' && (
                <>
                  <Button variant="outline" onClick={() => setStep('mapping')}>
                    Back
                  </Button>
                  <Button onClick={handleImport} className="bg-green-600 hover:bg-green-700">
                    <Database className="h-4 w-4 mr-2" />
                    Import {importStats.totalRows} Patents
                  </Button>
                </>
              )}
              
              {step === 'complete' && (
                <Button onClick={() => {
                  resetDialog();
                  onOpenChange(false);
                }}>
                  Close
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}