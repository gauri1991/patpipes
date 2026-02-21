/**
 * Document management hook for patent applications
 * Handles file uploads and document operations
 */

import { useState, useCallback } from 'react';
import { prosecutionApi } from '@/lib/api/prosecution';
import { ProsecutionDocument } from '@/types/prosecution';

interface UseDocumentsOptions {
  applicationId: string;
  onDocumentsChange?: (documents: ProsecutionDocument[]) => void;
  onError?: (error: Error) => void;
}

export function useDocuments({ applicationId, onDocumentsChange, onError }: UseDocumentsOptions) {
  const [documents, setDocuments] = useState<ProsecutionDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  // Load documents from backend
  const loadDocuments = useCallback(async () => {
    try {
      setIsLoading(true);
      const documentsData = await prosecutionApi.getDocuments(applicationId);
      setDocuments(documentsData);
      onDocumentsChange?.(documentsData);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to load documents');
      onError?.(err);
      console.error('Failed to load documents:', err);
    } finally {
      setIsLoading(false);
    }
  }, [applicationId, onDocumentsChange, onError]);

  // Upload a single file
  const uploadFile = useCallback(async (
    file: File, 
    documentType: ProsecutionDocument['document_type'],
    options?: {
      title?: string;
      description?: string;
      onProgress?: (progress: number) => void;
    }
  ) => {
    try {
      setIsUploading(true);
      const fileId = `${file.name}-${Date.now()}`;
      
      // Initialize progress tracking
      setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));
      
      // Create a promise that resolves when upload is complete
      const uploadPromise = new Promise<ProsecutionDocument>((resolve, reject) => {
        // Simulate progress for demo (replace with real upload progress)
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            const currentProgress = prev[fileId] || 0;
            const newProgress = Math.min(currentProgress + Math.random() * 30, 95);
            options?.onProgress?.(newProgress);
            return { ...prev, [fileId]: newProgress };
          });
        }, 200);

        // Perform the actual upload
        prosecutionApi.uploadDocument(file, applicationId, documentType)
          .then(uploadedDoc => {
            clearInterval(progressInterval);
            setUploadProgress(prev => {
              const updated = { ...prev };
              delete updated[fileId];
              return updated;
            });
            options?.onProgress?.(100);
            resolve(uploadedDoc);
          })
          .catch(error => {
            clearInterval(progressInterval);
            setUploadProgress(prev => {
              const updated = { ...prev };
              delete updated[fileId];
              return updated;
            });
            reject(error);
          });
      });

      const uploadedDocument = await uploadPromise;
      
      // Update documents list
      const updatedDocuments = [...documents, uploadedDocument];
      setDocuments(updatedDocuments);
      onDocumentsChange?.(updatedDocuments);
      
      return uploadedDocument;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to upload file');
      onError?.(err);
      throw err;
    } finally {
      setIsUploading(false);
    }
  }, [applicationId, documents, onDocumentsChange, onError]);

  // Upload multiple files
  const uploadFiles = useCallback(async (
    files: File[],
    documentType: ProsecutionDocument['document_type'],
    options?: {
      onProgress?: (progress: number, fileName: string) => void;
      onComplete?: (uploadedDocs: ProsecutionDocument[]) => void;
    }
  ) => {
    try {
      setIsUploading(true);
      const uploadPromises = files.map(file => 
        uploadFile(file, documentType, {
          onProgress: (progress) => options?.onProgress?.(progress, file.name)
        })
      );

      const uploadedDocuments = await Promise.all(uploadPromises);
      options?.onComplete?.(uploadedDocuments);
      
      return uploadedDocuments;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to upload files');
      onError?.(err);
      throw err;
    } finally {
      setIsUploading(false);
    }
  }, [uploadFile, onError]);

  // Delete a document
  const deleteDocument = useCallback(async (documentId: string) => {
    try {
      // Note: This would need to be implemented in the API
      // await prosecutionApi.deleteDocument(documentId);
      
      const updatedDocuments = documents.filter(doc => doc.id !== documentId);
      setDocuments(updatedDocuments);
      onDocumentsChange?.(updatedDocuments);
      
      return true;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to delete document');
      onError?.(err);
      throw err;
    }
  }, [documents, onDocumentsChange, onError]);

  // Get documents by type
  const getDocumentsByType = useCallback((type: ProsecutionDocument['document_type']) => {
    return documents.filter(doc => doc.document_type === type);
  }, [documents]);

  // Get current version of a document type
  const getCurrentDocument = useCallback((type: ProsecutionDocument['document_type']) => {
    return documents.find(doc => 
      doc.document_type === type && 
      doc.is_current_version
    );
  }, [documents]);

  // Check if file type is supported
  const isSupportedFileType = useCallback((file: File) => {
    const supportedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/gif'
    ];
    
    return supportedTypes.includes(file.type);
  }, []);

  // Validate file size
  const isValidFileSize = useCallback((file: File, maxSizeMB: number = 10) => {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return file.size <= maxSizeBytes;
  }, []);

  // Get total storage used
  const getTotalStorageUsed = useCallback(() => {
    return documents.reduce((total, doc) => total + doc.file_size, 0);
  }, [documents]);

  return {
    documents,
    isLoading,
    isUploading,
    uploadProgress,
    loadDocuments,
    uploadFile,
    uploadFiles,
    deleteDocument,
    getDocumentsByType,
    getCurrentDocument,
    isSupportedFileType,
    isValidFileSize,
    getTotalStorageUsed
  };
}