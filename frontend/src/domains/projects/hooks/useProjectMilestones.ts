/**
 * useProjectMilestones Hook
 * Custom hook for project milestone management functionality
 */

import { useCallback } from 'react';
import { useProjectsStore } from '../store/projects.store';
import { ProjectMilestone } from '../types/project.types';

export function useProjectMilestones(projectId: string) {
  const store = useProjectsStore();
  const milestones = Array.isArray(store.projectMilestones[projectId]) ? store.projectMilestones[projectId] : [];

  const fetchMilestones = useCallback(async () => {
    if (projectId) {
      try {
        await store.fetchProjectMilestones(projectId);
      } catch (error) {
        console.error('Failed to fetch project milestones:', error);
      }
    }
  }, [projectId, store.fetchProjectMilestones]);

  const createMilestone = useCallback(async (milestoneData: Partial<ProjectMilestone>) => {
    if (projectId) {
      try {
        return await store.createMilestone(projectId, milestoneData);
      } catch (error) {
        console.error('Failed to create milestone:', error);
        throw error;
      }
    }
  }, [projectId, store.createMilestone]);

  const updateMilestone = useCallback(async (milestoneId: string, data: Partial<ProjectMilestone>) => {
    if (projectId) {
      try {
        return await store.updateMilestone(projectId, milestoneId, data);
      } catch (error) {
        console.error('Failed to update milestone:', error);
        throw error;
      }
    }
  }, [projectId, store.updateMilestone]);

  const deleteMilestone = useCallback(async (milestoneId: string) => {
    if (projectId) {
      try {
        await store.deleteMilestone(projectId, milestoneId);
      } catch (error) {
        console.error('Failed to delete milestone:', error);
        throw error;
      }
    }
  }, [projectId, store.deleteMilestone]);

  return {
    milestones,
    isLoading: store.isLoading,
    isSaving: store.isSaving,
    isDeleting: store.isDeleting,
    error: store.error,
    fetchMilestones,
    createMilestone,
    updateMilestone,
    deleteMilestone,
  };
}