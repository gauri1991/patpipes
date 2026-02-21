/**
 * Projects Store
 * Global state management for projects using Zustand
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { 
  Project, 
  ProjectTask, 
  ProjectFile, 
  ProjectMilestone,
  ProjectTemplate,
  CreateProjectRequest,
  UpdateProjectRequest,
  ProjectSearchParams,
  ProjectFilters,
  ProjectStatistics,
  TimelineItem,
  TaskStatus,
  ProjectStatus,
  UserProjectDashboard,
  ProjectType
} from '../types/project.types';
import { projectsService } from '../services/projects.service';

interface ProjectsState {
  // Data
  projects: Project[];
  recentProjects: Project[];
  currentProject: Project | null;
  projectTasks: Record<string, ProjectTask[]>;
  projectFiles: Record<string, ProjectFile[]>;
  projectMilestones: Record<string, ProjectMilestone[]>;
  projectTimelines: Record<string, TimelineItem[]>;
  templates: ProjectTemplate[];
  statistics: ProjectStatistics | null;
  dashboardData: UserProjectDashboard | null;
  projectTypes: ProjectType[];
  availableProjectTypes: ProjectType[];

  // UI State
  isLoading: boolean;
  isSaving: boolean;
  isDeleting: boolean;
  error: string | null;
  
  // Filters and Search
  filters: ProjectFilters;
  searchQuery: string;
  sortBy: 'name' | 'created' | 'updated' | 'priority' | 'status' | 'dueDate';
  sortOrder: 'asc' | 'desc';
  currentPage: number;
  totalPages: number;
  totalProjects: number;

  // Selected items
  selectedProjectIds: string[];
  selectedTaskIds: string[];

  // Actions - Projects
  setProjects: (projects: Project[]) => void;
  setCurrentProject: (project: Project | null) => void;
  setLoading: (loading: boolean) => void;
  setSaving: (saving: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;

  // Async Actions - Projects
  fetchProjects: (params?: ProjectSearchParams) => Promise<void>;
  fetchProject: (id: string) => Promise<void>;
  createProject: (data: CreateProjectRequest) => Promise<Project>;
  updateProject: (id: string, data: UpdateProjectRequest) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;
  duplicateProject: (id: string, name?: string) => Promise<Project>;
  archiveProject: (id: string) => Promise<void>;
  restoreProject: (id: string) => Promise<void>;

  // Tasks Actions
  setProjectTasks: (projectId: string, tasks: ProjectTask[]) => void;
  fetchProjectTasks: (projectId: string) => Promise<void>;
  createTask: (projectId: string, task: Partial<ProjectTask>) => Promise<ProjectTask>;
  updateTask: (projectId: string, taskId: string, data: Partial<ProjectTask>) => Promise<ProjectTask>;
  deleteTask: (projectId: string, taskId: string) => Promise<void>;
  updateTaskStatus: (projectId: string, taskId: string, status: TaskStatus) => Promise<void>;

  // Files Actions
  setProjectFiles: (projectId: string, files: ProjectFile[]) => void;
  fetchProjectFiles: (projectId: string) => Promise<void>;
  uploadFile: (projectId: string, file: File, metadata?: any) => Promise<ProjectFile>;
  deleteFile: (projectId: string, fileId: string) => Promise<void>;

  // Milestones Actions
  setProjectMilestones: (projectId: string, milestones: ProjectMilestone[]) => void;
  fetchProjectMilestones: (projectId: string) => Promise<void>;
  createMilestone: (projectId: string, milestone: Partial<ProjectMilestone>) => Promise<ProjectMilestone>;
  updateMilestone: (projectId: string, milestoneId: string, data: Partial<ProjectMilestone>) => Promise<ProjectMilestone>;
  deleteMilestone: (projectId: string, milestoneId: string) => Promise<void>;

  // Timeline Actions
  setProjectTimeline: (projectId: string, timeline: TimelineItem[]) => void;
  fetchProjectTimeline: (projectId: string) => Promise<void>;

  // Templates Actions
  setTemplates: (templates: ProjectTemplate[]) => void;
  fetchTemplates: () => Promise<void>;
  createProjectFromTemplate: (templateId: string, data: CreateProjectRequest) => Promise<Project>;

  // Statistics Actions
  setStatistics: (statistics: ProjectStatistics) => void;
  fetchStatistics: () => Promise<void>;

  // Dashboard Actions
  setDashboardData: (data: UserProjectDashboard) => void;
  fetchDashboardData: () => Promise<void>;

  // Project Types Actions
  setProjectTypes: (types: ProjectType[]) => void;
  fetchProjectTypes: () => Promise<void>;
  getProjectTypeById: (id: string) => ProjectType | undefined;

  // Search and Filter Actions
  setFilters: (filters: Partial<ProjectFilters>) => void;
  setSearchQuery: (query: string) => void;
  setSorting: (sortBy: typeof sortBy, sortOrder: 'asc' | 'desc') => void;
  setPage: (page: number) => void;
  clearFilters: () => void;

  // Selection Actions
  setSelectedProjectIds: (ids: string[]) => void;
  toggleProjectSelection: (id: string) => void;
  clearProjectSelection: () => void;
  setSelectedTaskIds: (ids: string[]) => void;
  toggleTaskSelection: (id: string) => void;
  clearTaskSelection: () => void;

  // Bulk Actions
  bulkUpdateProjects: (updates: Array<{ projectId: string; data: Partial<Project> }>) => Promise<void>;
  bulkDeleteProjects: (projectIds: string[]) => Promise<void>;
  bulkArchiveProjects: (projectIds: string[]) => Promise<void>;
}

export const useProjectsStore = create<ProjectsState>()( 
  devtools(
    persist(
      (set, get) => ({
        // Initial State
        projects: [],
        recentProjects: [],
        currentProject: null,
        projectTasks: {},
        projectFiles: {},
        projectMilestones: {},
        projectTimelines: {},
        templates: [],
        statistics: null,
        dashboardData: null,
        projectTypes: [],
        availableProjectTypes: [],
        
        isLoading: false,
        isSaving: false,
        isDeleting: false,
        error: null,
        
        filters: {},
        searchQuery: '',
        sortBy: 'updated',
        sortOrder: 'desc',
        currentPage: 1,
        totalPages: 1,
        totalProjects: 0,

        selectedProjectIds: [],
        selectedTaskIds: [],

        // Basic Setters
        setProjects: (projects) => set({ projects }),
        setCurrentProject: (project) => set({ currentProject: project }),
        setLoading: (loading) => set({ isLoading: loading }),
        setSaving: (saving) => set({ isSaving: saving }),
        setError: (error) => set({ error }),
        clearError: () => set({ error: null }),

        // Projects Actions
        fetchProjects: async (params) => {
          set({ isLoading: true, error: null });
          try {
            const result = await projectsService.getProjects(params);
            set({
              projects: result.projects,
              totalProjects: result.total,
              currentPage: result.page,
              totalPages: result.totalPages,
              isLoading: false
            });
          } catch (error: any) {
            set({
              error: error.response?.data?.message || 'Failed to fetch projects',
              isLoading: false
            });
          }
        },

        fetchProject: async (id) => {
          set({ isLoading: true, error: null });
          try {
            const project = await projectsService.getProject(id);
            set({ currentProject: project, isLoading: false });
          } catch (error: any) {
            set({
              error: error.response?.data?.message || 'Failed to fetch project',
              isLoading: false
            });
          }
        },

        createProject: async (data) => {
          set({ isSaving: true, error: null });
          try {
            const project = await projectsService.createProject(data);
            set(state => ({
              projects: [project, ...state.projects],
              totalProjects: state.totalProjects + 1,
              isSaving: false
            }));
            return project;
          } catch (error: any) {
            set({
              error: error.response?.data?.message || 'Failed to create project',
              isSaving: false
            });
            throw error;
          }
        },

        updateProject: async (id, data) => {
          set({ isSaving: true, error: null });
          try {
            const updatedProject = await projectsService.updateProject(id, data);
            set(state => ({
              projects: state.projects.map(p => p.id === id ? updatedProject : p),
              currentProject: state.currentProject?.id === id ? updatedProject : state.currentProject,
              isSaving: false
            }));
            return updatedProject;
          } catch (error: any) {
            set({
              error: error.response?.data?.message || 'Failed to update project',
              isSaving: false
            });
            throw error;
          }
        },

        deleteProject: async (id) => {
          set({ isDeleting: true, error: null });
          try {
            await projectsService.deleteProject(id);
            set(state => ({
              projects: state.projects.filter(p => p.id !== id),
              currentProject: state.currentProject?.id === id ? null : state.currentProject,
              totalProjects: state.totalProjects - 1,
              isDeleting: false
            }));
          } catch (error: any) {
            set({
              error: error.response?.data?.message || 'Failed to delete project',
              isDeleting: false
            });
          }
        },

        duplicateProject: async (id, name) => {
          set({ isSaving: true, error: null });
          try {
            const duplicatedProject = await projectsService.duplicateProject(id, name);
            set(state => ({
              projects: [duplicatedProject, ...state.projects],
              totalProjects: state.totalProjects + 1,
              isSaving: false
            }));
            return duplicatedProject;
          } catch (error: any) {
            set({
              error: error.response?.data?.message || 'Failed to duplicate project',
              isSaving: false
            });
            throw error;
          }
        },

        archiveProject: async (id) => {
          set({ isSaving: true, error: null });
          try {
            const archivedProject = await projectsService.archiveProject(id);
            set(state => ({
              projects: state.projects.map(p => p.id === id ? archivedProject : p),
              isSaving: false
            }));
          } catch (error: any) {
            set({
              error: error.response?.data?.message || 'Failed to archive project',
              isSaving: false
            });
          }
        },

        restoreProject: async (id) => {
          set({ isSaving: true, error: null });
          try {
            const restoredProject = await projectsService.restoreProject(id);
            set(state => ({
              projects: state.projects.map(p => p.id === id ? restoredProject : p),
              isSaving: false
            }));
          } catch (error: any) {
            set({
              error: error.response?.data?.message || 'Failed to restore project',
              isSaving: false
            });
          }
        },

        // Tasks Actions
        setProjectTasks: (projectId, tasks) => 
          set(state => ({
            projectTasks: { ...state.projectTasks, [projectId]: tasks }
          })),

        fetchProjectTasks: async (projectId) => {
          set({ isLoading: true, error: null });
          try {
            const tasks = await projectsService.getProjectTasks(projectId);
            get().setProjectTasks(projectId, tasks);
            set({ isLoading: false });
          } catch (error: any) {
            set({
              error: error.response?.data?.message || 'Failed to fetch tasks',
              isLoading: false
            });
          }
        },

        createTask: async (projectId, task) => {
          set({ isSaving: true, error: null });
          try {
            const newTask = await projectsService.createTask(projectId, task);
            const currentTasks = get().projectTasks[projectId] || [];
            get().setProjectTasks(projectId, [...currentTasks, newTask]);
            set({ isSaving: false });
            return newTask;
          } catch (error: any) {
            set({
              error: error.response?.data?.message || 'Failed to create task',
              isSaving: false
            });
            throw error;
          }
        },

        updateTask: async (projectId, taskId, data) => {
          set({ isSaving: true, error: null });
          try {
            const updatedTask = await projectsService.updateTask(projectId, taskId, data);
            const currentTasks = get().projectTasks[projectId] || [];
            get().setProjectTasks(
              projectId, 
              currentTasks.map(t => t.id === taskId ? updatedTask : t)
            );
            set({ isSaving: false });
            return updatedTask;
          } catch (error: any) {
            set({
              error: error.response?.data?.message || 'Failed to update task',
              isSaving: false
            });
            throw error;
          }
        },

        deleteTask: async (projectId, taskId) => {
          set({ isDeleting: true, error: null });
          try {
            await projectsService.deleteTask(projectId, taskId);
            const currentTasks = get().projectTasks[projectId] || [];
            get().setProjectTasks(
              projectId,
              currentTasks.filter(t => t.id !== taskId)
            );
            set({ isDeleting: false });
          } catch (error: any) {
            set({
              error: error.response?.data?.message || 'Failed to delete task',
              isDeleting: false
            });
          }
        },

        updateTaskStatus: async (projectId, taskId, status) => {
          try {
            await get().updateTask(projectId, taskId, { status });
          } catch (error) {
            // Error handled in updateTask
            throw error;
          }
        },

        // Files Actions
        setProjectFiles: (projectId, files) =>
          set(state => ({
            projectFiles: { ...state.projectFiles, [projectId]: files }
          })),

        fetchProjectFiles: async (projectId) => {
          set({ isLoading: true, error: null });
          try {
            const files = await projectsService.getProjectFiles(projectId);
            get().setProjectFiles(projectId, files);
            set({ isLoading: false });
          } catch (error: any) {
            set({
              error: error.response?.data?.message || 'Failed to fetch files',
              isLoading: false
            });
          }
        },

        uploadFile: async (projectId, file, metadata) => {
          set({ isSaving: true, error: null });
          try {
            const uploadedFile = await projectsService.uploadFile(projectId, file, metadata);
            const currentFiles = get().projectFiles[projectId] || [];
            get().setProjectFiles(projectId, [...currentFiles, uploadedFile]);
            set({ isSaving: false });
            return uploadedFile;
          } catch (error: any) {
            set({
              error: error.response?.data?.message || 'Failed to upload file',
              isSaving: false
            });
            throw error;
          }
        },

        deleteFile: async (projectId, fileId) => {
          set({ isDeleting: true, error: null });
          try {
            await projectsService.deleteFile(projectId, fileId);
            const currentFiles = get().projectFiles[projectId] || [];
            get().setProjectFiles(
              projectId,
              currentFiles.filter(f => f.id !== fileId)
            );
            set({ isDeleting: false });
          } catch (error: any) {
            set({
              error: error.response?.data?.message || 'Failed to delete file',
              isDeleting: false
            });
          }
        },

        // Milestones Actions
        setProjectMilestones: (projectId, milestones) =>
          set(state => ({
            projectMilestones: { ...state.projectMilestones, [projectId]: milestones }
          })),

        fetchProjectMilestones: async (projectId) => {
          set({ isLoading: true, error: null });
          try {
            const milestones = await projectsService.getProjectMilestones(projectId);
            get().setProjectMilestones(projectId, milestones);
            set({ isLoading: false });
          } catch (error: any) {
            set({
              error: error.response?.data?.message || 'Failed to fetch milestones',
              isLoading: false
            });
          }
        },

        createMilestone: async (projectId, milestone) => {
          set({ isSaving: true, error: null });
          try {
            const newMilestone = await projectsService.createMilestone(projectId, milestone);
            const currentMilestones = get().projectMilestones[projectId] || [];
            get().setProjectMilestones(projectId, [...currentMilestones, newMilestone]);
            set({ isSaving: false });
            return newMilestone;
          } catch (error: any) {
            set({
              error: error.response?.data?.message || 'Failed to create milestone',
              isSaving: false
            });
            throw error;
          }
        },

        updateMilestone: async (projectId, milestoneId, data) => {
          set({ isSaving: true, error: null });
          try {
            const updatedMilestone = await projectsService.updateMilestone(projectId, milestoneId, data);
            const currentMilestones = get().projectMilestones[projectId] || [];
            get().setProjectMilestones(
              projectId,
              currentMilestones.map(m => m.id === milestoneId ? updatedMilestone : m)
            );
            set({ isSaving: false });
            return updatedMilestone;
          } catch (error: any) {
            set({
              error: error.response?.data?.message || 'Failed to update milestone',
              isSaving: false
            });
            throw error;
          }
        },

        deleteMilestone: async (projectId, milestoneId) => {
          set({ isDeleting: true, error: null });
          try {
            await projectsService.deleteMilestone(projectId, milestoneId);
            const currentMilestones = get().projectMilestones[projectId] || [];
            get().setProjectMilestones(
              projectId,
              currentMilestones.filter(m => m.id !== milestoneId)
            );
            set({ isDeleting: false });
          } catch (error: any) {
            set({
              error: error.response?.data?.message || 'Failed to delete milestone',
              isDeleting: false
            });
          }
        },

        // Timeline Actions
        setProjectTimeline: (projectId, timeline) =>
          set(state => ({
            projectTimelines: { ...state.projectTimelines, [projectId]: timeline }
          })),

        fetchProjectTimeline: async (projectId) => {
          set({ isLoading: true, error: null });
          try {
            const timeline = await projectsService.getProjectTimeline(projectId);
            get().setProjectTimeline(projectId, timeline);
            set({ isLoading: false });
          } catch (error: any) {
            set({
              error: error.response?.data?.message || 'Failed to fetch timeline',
              isLoading: false
            });
          }
        },

        // Templates Actions
        setTemplates: (templates) => set({ templates }),

        fetchTemplates: async () => {
          set({ isLoading: true, error: null });
          try {
            const templates = await projectsService.getProjectTemplates();
            set({ templates, isLoading: false });
          } catch (error: any) {
            set({
              error: error.response?.data?.message || 'Failed to fetch templates',
              isLoading: false
            });
          }
        },

        createProjectFromTemplate: async (templateId, data) => {
          set({ isSaving: true, error: null });
          try {
            const project = await projectsService.createProjectFromTemplate(templateId, data);
            set(state => ({
              projects: [project, ...state.projects],
              totalProjects: state.totalProjects + 1,
              isSaving: false
            }));
            return project;
          } catch (error: any) {
            set({
              error: error.response?.data?.message || 'Failed to create project from template',
              isSaving: false
            });
            throw error;
          }
        },

        // Statistics Actions
        setStatistics: (statistics) => set({ statistics }),

        fetchStatistics: async () => {
          set({ isLoading: true, error: null });
          try {
            const statistics = await projectsService.getProjectStatistics();
            set({ statistics, isLoading: false });
          } catch (error: any) {
            set({
              error: error.response?.data?.message || 'Failed to fetch statistics',
              isLoading: false
            });
          }
        },

        // Dashboard Actions
        setDashboardData: (dashboardData) => set({ dashboardData }),

        fetchDashboardData: async () => {
          set({ isLoading: true, error: null });
          try {
            const dashboardData = await projectsService.getDashboardData();
            const recentProjects = dashboardData.recentProjects || [];
            set({ 
              dashboardData, 
              recentProjects,
              statistics: dashboardData.statistics,
              isLoading: false 
            });
          } catch (error: any) {
            set({
              error: error.response?.data?.message || 'Failed to fetch dashboard data',
              isLoading: false
            });
          }
        },

        // Project Types Actions
        setProjectTypes: (projectTypes) => set({ projectTypes, availableProjectTypes: projectTypes }),

        fetchProjectTypes: async () => {
          try {
            const projectTypes = await projectsService.getProjectTypes();
            set({ 
              projectTypes, 
              availableProjectTypes: projectTypes.filter(type => type.isActive) 
            });
          } catch (error: any) {
            console.error('Failed to fetch project types:', error);
          }
        },

        getProjectTypeById: (id) => {
          const { projectTypes } = get();
          return projectTypes.find(type => type.id === id);
        },

        // Search and Filter Actions
        setFilters: (filters) => 
          set(state => ({ filters: { ...state.filters, ...filters } })),

        setSearchQuery: (searchQuery) => set({ searchQuery }),

        setSorting: (sortBy, sortOrder) => set({ sortBy, sortOrder }),

        setPage: (currentPage) => set({ currentPage }),

        clearFilters: () => set({ filters: {}, searchQuery: '' }),

        // Selection Actions
        setSelectedProjectIds: (selectedProjectIds) => set({ selectedProjectIds }),

        toggleProjectSelection: (id) =>
          set(state => ({
            selectedProjectIds: state.selectedProjectIds.includes(id)
              ? state.selectedProjectIds.filter(selectedId => selectedId !== id)
              : [...state.selectedProjectIds, id]
          })),

        clearProjectSelection: () => set({ selectedProjectIds: [] }),

        setSelectedTaskIds: (selectedTaskIds) => set({ selectedTaskIds }),

        toggleTaskSelection: (id) =>
          set(state => ({
            selectedTaskIds: state.selectedTaskIds.includes(id)
              ? state.selectedTaskIds.filter(selectedId => selectedId !== id)
              : [...state.selectedTaskIds, id]
          })),

        clearTaskSelection: () => set({ selectedTaskIds: [] }),

        // Bulk Actions
        bulkUpdateProjects: async (updates) => {
          set({ isSaving: true, error: null });
          try {
            const updatedProjects = await projectsService.bulkUpdateProjects(updates);
            set(state => {
              const projectMap = new Map(updatedProjects.map(p => [p.id, p]));
              return {
                projects: state.projects.map(p => projectMap.get(p.id) || p),
                isSaving: false
              };
            });
          } catch (error: any) {
            set({
              error: error.response?.data?.message || 'Failed to bulk update projects',
              isSaving: false
            });
          }
        },

        bulkDeleteProjects: async (projectIds) => {
          set({ isDeleting: true, error: null });
          try {
            await projectsService.bulkDeleteProjects(projectIds);
            set(state => ({
              projects: state.projects.filter(p => !projectIds.includes(p.id)),
              totalProjects: state.totalProjects - projectIds.length,
              selectedProjectIds: [],
              isDeleting: false
            }));
          } catch (error: any) {
            set({
              error: error.response?.data?.message || 'Failed to bulk delete projects',
              isDeleting: false
            });
          }
        },

        bulkArchiveProjects: async (projectIds) => {
          set({ isSaving: true, error: null });
          try {
            const archivedProjects = await projectsService.bulkArchiveProjects(projectIds);
            set(state => {
              const projectMap = new Map(archivedProjects.map(p => [p.id, p]));
              return {
                projects: state.projects.map(p => projectMap.get(p.id) || p),
                selectedProjectIds: [],
                isSaving: false
              };
            });
          } catch (error: any) {
            set({
              error: error.response?.data?.message || 'Failed to bulk archive projects',
              isSaving: false
            });
          }
        },
      }),
      {
        name: 'projects-storage',
        partialize: (state) => ({
          filters: state.filters,
          sortBy: state.sortBy,
          sortOrder: state.sortOrder,
        }),
      }
    )
  )
);