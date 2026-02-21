/**
 * PatentUpload Component
 * Advanced file upload with drag & drop, validation, and processing
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import { 
  Upload, 
  File, 
  X, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  FileText,
  Database,
  Settings,
  Download,
  Eye,
  Trash2,
  RefreshCw
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { patentsService } from '../services/patents.service';
import { PatentDataSource, ProcessingStage } from '../types/patent.types';

interface UploadedFile {
  id: string;
  file: File;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
  patentId?: string;
  processingStage?: ProcessingStage;
}

interface PatentUploadProps {
  projectId?: string;
  onUploadComplete?: (patentIds: string[]) => void;
}

export function PatentUpload({ projectId, onUploadComplete }: PatentUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [settings, setSettings] = useState({
    source: PatentDataSource.MANUAL_UPLOAD,
    autoAnalyze: true,
    tags: [] as string[],
    newTag: ''
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  }, []);

  const handleFiles = async (files: File[]) => {
    const validFiles = files.filter(file => {
      const validTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'application/xml',
        'text/xml'
      ];
      return validTypes.includes(file.type);
    });

    if (validFiles.length !== files.length) {
      // Show error for invalid files
      console.warn('Some files were rejected due to invalid format');
    }

    const newUploadedFiles: UploadedFile[] = validFiles.map(file => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      progress: 0,
      status: 'uploading' as const
    }));

    setUploadedFiles(prev => [...prev, ...newUploadedFiles]);
    
    // Start uploads
    for (const uploadedFile of newUploadedFiles) {
      await uploadFile(uploadedFile);
    }
  };

  const uploadFile = async (uploadedFile: UploadedFile) => {
    setIsUploading(true);
    
    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadedFiles(prev => prev.map(f => 
          f.id === uploadedFile.id 
            ? { ...f, progress: Math.min(f.progress + 10, 90) }
            : f
        ));
      }, 200);

      const response = await patentsService.uploadPatent({
        file: uploadedFile.file,
        projectId,
        source: settings.source,
        tags: settings.tags,
        autoAnalyze: settings.autoAnalyze
      });

      clearInterval(progressInterval);

      setUploadedFiles(prev => prev.map(f => 
        f.id === uploadedFile.id 
          ? { 
              ...f, 
              progress: 100, 
              status: settings.autoAnalyze ? 'processing' : 'completed',
              patentId: response.patentIds[0],
              processingStage: response.status
            }
          : f
      ));

      if (settings.autoAnalyze) {
        // Monitor processing status
        monitorProcessing(uploadedFile.id, response.uploadId);
      }

    } catch (error) {
      setUploadedFiles(prev => prev.map(f => 
        f.id === uploadedFile.id 
          ? { ...f, status: 'error', error: 'Upload failed' }
          : f
      ));
    } finally {
      setIsUploading(false);
    }
  };

  const monitorProcessing = async (fileId: string, uploadId: string) => {
    const checkInterval = setInterval(async () => {
      try {
        const job = await patentsService.getProcessingJob(uploadId);
        
        setUploadedFiles(prev => prev.map(f => 
          f.id === fileId 
            ? { ...f, progress: job.progress, processingStage: job.stage }
            : f
        ));

        if (job.stage === ProcessingStage.COMPLETED) {
          setUploadedFiles(prev => prev.map(f => 
            f.id === fileId 
              ? { ...f, status: 'completed' }
              : f
          ));
          clearInterval(checkInterval);
          
          if (onUploadComplete) {
            onUploadComplete([job.patentId]);
          }
        } else if (job.stage === ProcessingStage.FAILED) {
          setUploadedFiles(prev => prev.map(f => 
            f.id === fileId 
              ? { ...f, status: 'error', error: 'Processing failed' }
              : f
          ));
          clearInterval(checkInterval);
        }
      } catch (error) {
        clearInterval(checkInterval);
        setUploadedFiles(prev => prev.map(f => 
          f.id === fileId 
            ? { ...f, status: 'error', error: 'Monitoring failed' }
            : f
        ));
      }
    }, 2000);
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const retryUpload = (fileId: string) => {
    const file = uploadedFiles.find(f => f.id === fileId);
    if (file) {
      setUploadedFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { ...f, status: 'uploading', progress: 0, error: undefined }
          : f
      ));
      uploadFile(file);
    }
  };

  const addTag = () => {
    if (settings.newTag.trim() && !settings.tags.includes(settings.newTag.trim())) {
      setSettings(prev => ({
        ...prev,
        tags: [...prev.tags, prev.newTag.trim()],
        newTag: ''
      }));
    }
  };

  const removeTag = (tag: string) => {
    setSettings(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const getStatusIcon = (status: string, processingStage?: ProcessingStage) => {
    switch (status) {
      case 'uploading':
        return <Upload className="h-4 w-4 text-blue-500" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <File className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string, processingStage?: ProcessingStage) => {
    if (status === 'processing' && processingStage) {
      const stageNames = {
        [ProcessingStage.UPLOADED]: 'Uploaded',
        [ProcessingStage.PARSING]: 'Parsing document',
        [ProcessingStage.VALIDATING]: 'Validating data',
        [ProcessingStage.ANALYZING]: 'Analyzing patent',
        [ProcessingStage.COMPLETED]: 'Analysis complete',
        [ProcessingStage.FAILED]: 'Processing failed'
      };
      return stageNames[processingStage] || 'Processing';
    }
    
    switch (status) {
      case 'uploading': return 'Uploading...';
      case 'processing': return 'Processing...';
      case 'completed': return 'Complete';
      case 'error': return 'Error';
      default: return 'Unknown';
    }
  };

  const formatFileSize = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${Math.round(size * 100) / 100} ${units[unitIndex]}`;
  };

  const completedUploads = uploadedFiles.filter(f => f.status === 'completed').length;
  const hasUploads = uploadedFiles.length > 0;

  return (
    <div className="space-y-6">
      {/* Upload Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Upload Settings
          </CardTitle>
          <CardDescription>
            Configure how your patents will be processed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Data Source</label>
              <Select 
                value={settings.source} 
                onValueChange={(value) => setSettings(prev => ({ ...prev, source: value as PatentDataSource }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={PatentDataSource.MANUAL_UPLOAD}>Manual Upload</SelectItem>
                  <SelectItem value={PatentDataSource.USPTO}>USPTO Import</SelectItem>
                  <SelectItem value={PatentDataSource.EPO}>EPO Import</SelectItem>
                  <SelectItem value={PatentDataSource.API_IMPORT}>API Import</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Auto-analyze patents</label>
                <Switch
                  checked={settings.autoAnalyze}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoAnalyze: checked }))}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Automatically run AI analysis on uploaded patents
              </p>
            </div>
          </div>

          {/* Tags */}
          <div className="mt-4 space-y-2">
            <label className="text-sm font-medium">Tags</label>
            <div className="flex gap-2">
              <Input
                placeholder="Add tag..."
                value={settings.newTag}
                onChange={(e) => setSettings(prev => ({ ...prev, newTag: e.target.value }))}
                onKeyPress={(e) => e.key === 'Enter' && addTag()}
              />
              <Button variant="outline" onClick={addTag}>Add</Button>
            </div>
            {settings.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {settings.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => removeTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upload Zone */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Patents
          </CardTitle>
          <CardDescription>
            Drag and drop patent files or click to browse
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging 
                ? 'border-blue-400 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.txt,.xml"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <Upload className="h-8 w-8 text-gray-400" />
              </div>
              
              <div>
                <h3 className="text-lg font-semibold">Drop patent files here</h3>
                <p className="text-muted-foreground">
                  or <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="text-blue-600 hover:underline"
                  >
                    browse files
                  </button>
                </p>
              </div>
              
              <div className="text-sm text-muted-foreground">
                <p>Supported formats: PDF, DOC, DOCX, TXT, XML</p>
                <p>Maximum file size: 10MB per file</p>
              </div>
            </div>
          </div>

          {/* Supported Formats Info */}
          <Alert className="mt-4">
            <Database className="h-4 w-4" />
            <AlertDescription>
              We support patent documents from USPTO, EPO, JPO, and WIPO. 
              Our AI will automatically extract claims, classifications, and metadata.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Upload Progress */}
      {hasUploads && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Upload Progress</CardTitle>
                <CardDescription>
                  {completedUploads} of {uploadedFiles.length} files processed
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUploadedFiles([])}
                disabled={isUploading}
              >
                Clear All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {uploadedFiles.map((uploadedFile) => (
                <div key={uploadedFile.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(uploadedFile.status, uploadedFile.processingStage)}
                      <div>
                        <p className="font-medium truncate max-w-xs">
                          {uploadedFile.file.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatFileSize(uploadedFile.file.size)} • {getStatusText(uploadedFile.status, uploadedFile.processingStage)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {uploadedFile.status === 'completed' && uploadedFile.patentId && (
                        <>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      
                      {uploadedFile.status === 'error' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => retryUpload(uploadedFile.id)}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      )}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeFile(uploadedFile.id)}
                        disabled={uploadedFile.status === 'uploading'}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {uploadedFile.status !== 'completed' && (
                    <div className="space-y-1">
                      <Progress value={uploadedFile.progress} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{uploadedFile.progress}%</span>
                        {uploadedFile.status === 'processing' && (
                          <span>Estimated: 2-3 minutes</span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {uploadedFile.error && (
                    <Alert variant="destructive" className="mt-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{uploadedFile.error}</AlertDescription>
                    </Alert>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}