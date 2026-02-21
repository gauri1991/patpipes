/**
 * Upload Dialog Component
 * Handles dataset file upload with validation
 */

'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { Upload, X, FileText, AlertCircle } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface UploadDialogProps {
  onUpload: (data: FormData) => Promise<void>;
  projectId?: string;
  trigger?: React.ReactNode;
}

export function UploadDialog({ onUpload, projectId, trigger }: UploadDialogProps) {
  const [open, setOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [dataSource, setDataSource] = useState('manual_upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const ALLOWED_FILE_TYPES = ['.csv', '.xlsx', '.xls'];
  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // Validate file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_FILE_TYPES.includes(fileExtension)) {
      setError(`Invalid file type. Please upload ${ALLOWED_FILE_TYPES.join(', ')} files only.`);
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError(`File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.`);
      return;
    }

    setSelectedFile(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!name.trim()) {
      setError('Please enter a dataset name.');
      return;
    }

    if (!selectedFile) {
      setError('Please select a file to upload.');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);
      setUploadProgress(0);

      // Prepare FormData
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('description', description.trim());
      formData.append('data_source', dataSource);
      formData.append('data_file', selectedFile);

      if (projectId) {
        formData.append('project', projectId);
      }

      // Simulate progress (actual progress would need XMLHttpRequest)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      await onUpload(formData);

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Reset form and close dialog
      setTimeout(() => {
        handleReset();
        setOpen(false);
      }, 500);

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to upload dataset';
      setError(message);
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setName('');
    setDescription('');
    setDataSource('manual_upload');
    setSelectedFile(null);
    setError(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isUploading) {
      setOpen(newOpen);
      if (!newOpen) {
        handleReset();
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Upload className="h-4 w-4 mr-2" />
            Upload Dataset
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Upload Patent Dataset</DialogTitle>
          <DialogDescription>
            Upload a CSV or Excel file containing patent data. Supported formats: {ALLOWED_FILE_TYPES.join(', ')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dataset Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Dataset Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Q4 2024 Patent Portfolio"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isUploading}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description of this dataset..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isUploading}
              rows={3}
            />
          </div>

          {/* Data Source */}
          <div className="space-y-2">
            <Label htmlFor="data-source">Data Source</Label>
            <Select
              value={dataSource}
              onValueChange={setDataSource}
              disabled={isUploading}
            >
              <SelectTrigger id="data-source">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual_upload">Manual Upload</SelectItem>
                <SelectItem value="uspto">USPTO</SelectItem>
                <SelectItem value="epo">EPO</SelectItem>
                <SelectItem value="wipo">WIPO</SelectItem>
                <SelectItem value="google_patents">Google Patents</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label>Patent Data File *</Label>

            {!selectedFile ? (
              <div
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm font-medium mb-1">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-muted-foreground">
                  CSV or Excel file (Max {MAX_FILE_SIZE / 1024 / 1024}MB)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ALLOWED_FILE_TYPES.join(',')}
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={isUploading}
                />
              </div>
            ) : (
              <div className="border rounded-lg p-4 flex items-center justify-between bg-muted/30">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                {!isUploading && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveFile}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Uploading...</span>
                <span className="font-medium">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isUploading || !selectedFile || !name.trim()}>
              {isUploading ? 'Uploading...' : 'Upload Dataset'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
