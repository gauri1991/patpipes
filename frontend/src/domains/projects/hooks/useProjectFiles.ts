/**
 * useProjectFiles Hook
 * Custom hook for project file management functionality
 */

import { useCallback } from 'react';
import { useProjectsStore } from '../store/projects.store';
import { ProjectFile } from '../types/project.types';

export function useProjectFiles(projectId: string) {
  const store = useProjectsStore();
  const files = Array.isArray(store.projectFiles[projectId]) ? store.projectFiles[projectId] : [];

  const fetchFiles = useCallback(async () => {
    if (projectId) {
      try {
        await store.fetchProjectFiles(projectId);
      } catch (error) {
        console.error('Failed to fetch project files:', error);
      }
    }
  }, [projectId, store.fetchProjectFiles]);

  const uploadFile = useCallback(async (file: File, metadata?: any) => {
    if (projectId) {
      try {
        return await store.uploadFile(projectId, file, metadata);
      } catch (error) {
        console.error('Failed to upload file:', error);
        throw error;
      }
    }
  }, [projectId, store.uploadFile]);

  const deleteFile = useCallback(async (fileId: string) => {
    if (projectId) {
      try {
        await store.deleteFile(projectId, fileId);
      } catch (error) {
        console.error('Failed to delete file:', error);
        throw error;
      }
    }
  }, [projectId, store.deleteFile]);

  return {
    files,
    isLoading: store.isLoading,
    isSaving: store.isSaving,
    isDeleting: store.isDeleting,
    error: store.error,
    fetchFiles,
    uploadFile,
    deleteFile,
  };
}