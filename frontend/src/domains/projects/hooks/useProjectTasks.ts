/**
 * useProjectTasks Hook
 * Custom hook for project task management functionality
 */

import { useCallback, useEffect } from 'react';
import { useProjectsStore } from '../store/projects.store';
import { ProjectTask, TaskStatus } from '../types/project.types';

export function useProjectTasks(projectId: string) {
  const store = useProjectsStore();
  const tasks = Array.isArray(store.projectTasks[projectId]) ? store.projectTasks[projectId] : [];

  const fetchTasks = useCallback(async () => {
    if (projectId) {
      try {
        await store.fetchProjectTasks(projectId);
      } catch (error) {
        console.error('Failed to fetch project tasks:', error);
      }
    }
  }, [projectId, store.fetchProjectTasks]);

  const createTask = useCallback(async (taskData: Partial<ProjectTask>) => {
    if (projectId) {
      try {
        return await store.createTask(projectId, taskData);
      } catch (error) {
        console.error('Failed to create task:', error);
        throw error;
      }
    }
  }, [projectId, store.createTask]);

  const updateTask = useCallback(async (taskId: string, data: Partial<ProjectTask>) => {
    if (projectId) {
      try {
        return await store.updateTask(projectId, taskId, data);
      } catch (error) {
        console.error('Failed to update task:', error);
        throw error;
      }
    }
  }, [projectId, store.updateTask]);

  const deleteTask = useCallback(async (taskId: string) => {
    if (projectId) {
      try {
        await store.deleteTask(projectId, taskId);
      } catch (error) {
        console.error('Failed to delete task:', error);
        throw error;
      }
    }
  }, [projectId, store.deleteTask]);

  const updateTaskStatus = useCallback(async (taskId: string, status: TaskStatus) => {
    if (projectId) {
      try {
        await store.updateTaskStatus(projectId, taskId, status);
      } catch (error) {
        console.error('Failed to update task status:', error);
        throw error;
      }
    }
  }, [projectId, store.updateTaskStatus]);

  return {
    tasks,
    isLoading: store.isLoading,
    isSaving: store.isSaving,
    isDeleting: store.isDeleting,
    error: store.error,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
  };
}