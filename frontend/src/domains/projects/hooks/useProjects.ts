/**
 * useProjects Hook
 * Custom hook for project management functionality
 */

import { useCallback } from 'react';
import { useProjectsStore } from '../store/projects.store';
import { CreateProjectRequest, UpdateProjectRequest, ProjectSearchParams } from '../types/project.types';

export function useProjects() {
  const store = useProjectsStore();

  const createProject = useCallback(async (data: CreateProjectRequest) => {
    try {
      const project = await store.createProject(data);
      return project;
    } catch (error) {
      throw error;
    }
  }, [store]);

  const updateProject = useCallback(async (id: string, data: UpdateProjectRequest) => {
    try {
      const project = await store.updateProject(id, data);
      return project;
    } catch (error) {
      throw error;
    }
  }, [store]);

  const deleteProject = useCallback(async (id: string) => {
    try {
      await store.deleteProject(id);
    } catch (error) {
      throw error;
    }
  }, [store]);

  const fetchProjects = useCallback(async (params?: ProjectSearchParams) => {
    try {
      await store.fetchProjects(params);
    } catch (error) {
      throw error;
    }
  }, [store]);

  const fetchProject = useCallback(async (id: string) => {
    try {
      await store.fetchProject(id);
    } catch (error) {
      throw error;
    }
  }, [store.fetchProject]);

  return {
    // Data
    projects: store.projects,
    currentProject: store.currentProject,
    statistics: store.statistics,
    templates: store.templates,
    
    // State
    isLoading: store.isLoading,
    isSaving: store.isSaving,
    isDeleting: store.isDeleting,
    error: store.error,
    
    // Filters
    filters: store.filters,
    searchQuery: store.searchQuery,
    selectedProjectIds: store.selectedProjectIds,
    
    // Actions
    createProject,
    updateProject,
    deleteProject,
    fetchProjects,
    fetchProject,
    duplicateProject: store.duplicateProject,
    archiveProject: store.archiveProject,
    restoreProject: store.restoreProject,
    
    // Search and filters
    setFilters: store.setFilters,
    setSearchQuery: store.setSearchQuery,
    clearFilters: store.clearFilters,
    
    // Selection
    toggleProjectSelection: store.toggleProjectSelection,
    clearProjectSelection: store.clearProjectSelection,
    
    // Bulk operations
    bulkUpdateProjects: store.bulkUpdateProjects,
    bulkDeleteProjects: store.bulkDeleteProjects,
    bulkArchiveProjects: store.bulkArchiveProjects,
    
    // Utility
    clearError: store.clearError,
  };
}

export function useProjectTasks(projectId: string) {
  const store = useProjectsStore();

  return {
    tasks: store.projectTasks[projectId] || [],
    isLoading: store.isLoading,
    error: store.error,
    selectedTaskIds: store.selectedTaskIds,
    
    fetchTasks: () => store.fetchProjectTasks(projectId),
    createTask: (task: any) => store.createTask(projectId, task),
    updateTask: (taskId: string, data: any) => store.updateTask(projectId, taskId, data),
    deleteTask: (taskId: string) => store.deleteTask(projectId, taskId),
    updateTaskStatus: (taskId: string, status: any) => store.updateTaskStatus(projectId, taskId, status),
    
    toggleTaskSelection: store.toggleTaskSelection,
    clearTaskSelection: store.clearTaskSelection,
  };
}

export function useProjectFiles(projectId: string) {
  const store = useProjectsStore();

  return {
    files: store.projectFiles[projectId] || [],
    isLoading: store.isLoading,
    isSaving: store.isSaving,
    error: store.error,
    
    fetchFiles: () => store.fetchProjectFiles(projectId),
    uploadFile: (file: File, metadata?: any) => store.uploadFile(projectId, file, metadata),
    deleteFile: (fileId: string) => store.deleteFile(projectId, fileId),
  };
}

export function useProjectMilestones(projectId: string) {
  const store = useProjectsStore();

  return {
    milestones: store.projectMilestones[projectId] || [],
    isLoading: store.isLoading,
    isSaving: store.isSaving,
    error: store.error,
    
    fetchMilestones: () => store.fetchProjectMilestones(projectId),
    createMilestone: (milestone: any) => store.createMilestone(projectId, milestone),
    updateMilestone: (milestoneId: string, data: any) => store.updateMilestone(projectId, milestoneId, data),
    deleteMilestone: (milestoneId: string) => store.deleteMilestone(projectId, milestoneId),
  };
}

export function useProjectTimeline(projectId: string) {
  const store = useProjectsStore();

  return {
    timeline: store.projectTimelines[projectId] || [],
    isLoading: store.isLoading,
    error: store.error,
    
    fetchTimeline: () => store.fetchProjectTimeline(projectId),
  };
}

export function useProjectTemplates() {
  const store = useProjectsStore();

  return {
    templates: store.templates,
    isLoading: store.isLoading,
    error: store.error,
    
    fetchTemplates: store.fetchTemplates,
    createProjectFromTemplate: store.createProjectFromTemplate,
  };
}