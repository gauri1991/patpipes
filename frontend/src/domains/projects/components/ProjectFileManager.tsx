/**
 * ProjectFileManager Component
 * Comprehensive file management for project documents
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Upload, 
  File, 
  FileText, 
  Image, 
  Video, 
  Download, 
  Trash2, 
  Eye, 
  MoreHorizontal,
  Search,
  Filter,
  FolderOpen,
  Grid,
  List
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

import { useProjectFiles } from '../hooks/useProjectFiles';
import { ProjectFile, FileCategory } from '../types/project.types';

interface ProjectFileManagerProps {
  projectId: string;
}

export function ProjectFileManager({ projectId }: ProjectFileManagerProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    files,
    isLoading,
    isSaving,
    fetchFiles,
    uploadFile,
    deleteFile
  } = useProjectFiles(projectId);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         file.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || file.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categoryOptions = [
    { value: 'all', label: 'All Files' },
    { value: FileCategory.APPLICATION, label: 'Applications' },
    { value: FileCategory.PRIOR_ART, label: 'Prior Art' },
    { value: FileCategory.CORRESPONDENCE, label: 'Correspondence' },
    { value: FileCategory.DRAWINGS, label: 'Drawings' },
    { value: FileCategory.CLAIMS, label: 'Claims' },
    { value: FileCategory.SPECIFICATION, label: 'Specifications' },
    { value: FileCategory.CONTRACTS, label: 'Contracts' },
    { value: FileCategory.REPORTS, label: 'Reports' },
    { value: FileCategory.OTHER, label: 'Other' },
  ];

  const handleFileUpload = async (uploadedFiles: FileList) => {
    for (let i = 0; i < uploadedFiles.length; i++) {
      const file = uploadedFiles[i];
      try {
        await uploadFile(file, {
          category: FileCategory.OTHER,
          tags: [],
        });
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    if (e.dataTransfer.files) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileUpload(e.target.files);
    }
  };

  const handleDeleteFile = async (fileId: string, fileName: string) => {
    if (confirm(`Are you sure you want to delete "${fileName}"?`)) {
      try {
        await deleteFile(fileId);
      } catch (error) {
        console.error('Failed to delete file:', error);
      }
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="h-5 w-5" />;
    if (mimeType.startsWith('video/')) return <Video className="h-5 w-5" />;
    if (mimeType.includes('pdf') || mimeType.includes('document')) return <FileText className="h-5 w-5" />;
    return <File className="h-5 w-5" />;
  };

  const formatFileSize = (size: number) => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let fileSize = size;
    let unitIndex = 0;
    
    while (fileSize >= 1024 && unitIndex < units.length - 1) {
      fileSize /= 1024;
      unitIndex++;
    }
    
    return `${fileSize.toFixed(1)} ${units[unitIndex]}`;
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getCategoryColor = (category: FileCategory) => {
    const colors = {
      [FileCategory.APPLICATION]: 'bg-blue-100 text-blue-800',
      [FileCategory.PRIOR_ART]: 'bg-purple-100 text-purple-800',
      [FileCategory.CORRESPONDENCE]: 'bg-green-100 text-green-800',
      [FileCategory.DRAWINGS]: 'bg-pink-100 text-pink-800',
      [FileCategory.CLAIMS]: 'bg-orange-100 text-orange-800',
      [FileCategory.SPECIFICATION]: 'bg-yellow-100 text-yellow-800',
      [FileCategory.CONTRACTS]: 'bg-red-100 text-red-800',
      [FileCategory.REPORTS]: 'bg-indigo-100 text-indigo-800',
      [FileCategory.OTHER]: 'bg-gray-100 text-gray-800',
    };
    return colors[category] || colors[FileCategory.OTHER];
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Project Files</h2>
          <p className="text-muted-foreground">Manage documents and assets</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isSaving}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            {isSaving ? 'Uploading...' : 'Upload Files'}
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categoryOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="h-8 px-3"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="h-8 px-3"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragOver 
            ? 'border-primary bg-primary/5' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <Upload className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-2">
          {dragOver ? 'Drop files here' : 'Drag & drop files here'}
        </h3>
        <p className="text-muted-foreground mb-4">
          Or click to browse and select files
        </p>
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isSaving}
        >
          Choose Files
        </Button>
      </div>

      {/* File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* Files Grid/List */}
      {isLoading && files.length === 0 ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredFiles.map((file) => (
                <Card key={file.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        {getFileIcon(file.mimeType)}
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-sm font-medium truncate">
                            {file.originalName}
                          </CardTitle>
                          <CardDescription className="text-xs">
                            {formatFileSize(file.fileSize)}
                          </CardDescription>
                        </div>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            Preview
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeleteFile(file.id, file.originalName)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <Badge
                        variant="secondary"
                        className={`text-xs ${getCategoryColor(file.category)}`}
                      >
                        {file.category.replace('_', ' ')}
                      </Badge>
                      
                      <p className="text-xs text-muted-foreground">
                        Uploaded {formatDate(file.uploadedAt)}
                      </p>
                      
                      {file.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {file.tags.slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {file.tags.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{file.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {filteredFiles.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-4 hover:bg-muted/50">
                      <div className="flex items-center space-x-4">
                        {getFileIcon(file.mimeType)}
                        <div>
                          <p className="font-medium">{file.originalName}</p>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span>{formatFileSize(file.fileSize)}</span>
                            <span>•</span>
                            <Badge
                              variant="secondary"
                              className={`text-xs ${getCategoryColor(file.category)}`}
                            >
                              {file.category.replace('_', ' ')}
                            </Badge>
                            <span>•</span>
                            <span>Uploaded {formatDate(file.uploadedAt)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            Preview
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeleteFile(file.id, file.originalName)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Empty State */}
      {!isLoading && filteredFiles.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
              <FolderOpen className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {files.length === 0 ? 'No files uploaded' : 'No files match your search'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {files.length === 0 
                ? 'Upload documents to start building your project repository'
                : 'Try adjusting your search terms or filters'
              }
            </p>
            {files.length === 0 && (
              <Button onClick={() => fileInputRef.current?.click()}>
                Upload First File
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* File Stats */}
      {files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Storage Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{files.length}</div>
                <p className="text-sm text-muted-foreground">Total Files</p>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {formatFileSize(files.reduce((sum, file) => sum + file.fileSize, 0))}
                </div>
                <p className="text-sm text-muted-foreground">Total Size</p>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {files.filter(f => f.category === FileCategory.APPLICATION).length}
                </div>
                <p className="text-sm text-muted-foreground">Applications</p>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {files.filter(f => f.category === FileCategory.PRIOR_ART).length}
                </div>
                <p className="text-sm text-muted-foreground">Prior Art</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}