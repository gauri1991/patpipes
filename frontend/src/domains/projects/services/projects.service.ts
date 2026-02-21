/**
 * Projects Service
 * Handles all project-related API calls and data management
 */

import axios, { AxiosInstance } from 'axios';
import { 
  Project, 
  ProjectTask, 
  ProjectFile, 
  ProjectMilestone,
  ProjectTemplate,
  CreateProjectRequest,
  UpdateProjectRequest,
  ProjectSearchParams,
  ProjectStatistics,
  ProjectPerformanceMetrics,
  TimelineItem,
  TaskStatus,
  ProjectStatus,
  UserProjectDashboard,
  ProjectType
} from '../types/project.types';

class ProjectsService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1/projects',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth token to requests
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
  }

  // Project CRUD Operations
  async getProjects(params?: ProjectSearchParams): Promise<{
    projects: Project[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const response = await this.api.get('/projects/', { params });
    
    // Handle Django REST Framework paginated response
    if (response.data.results) {
      return {
        projects: response.data.results,
        total: response.data.count,
        page: params?.page || 1,
        totalPages: Math.ceil(response.data.count / (params?.limit || 20))
      };
    }
    
    // Fallback for non-paginated response
    return {
      projects: response.data,
      total: response.data.length,
      page: 1,
      totalPages: 1
    };
  }

  async getProject(id: string): Promise<Project> {
    const response = await this.api.get(`/projects/${id}/`);
    return response.data;
  }

  async createProject(data: CreateProjectRequest): Promise<Project> {
    const response = await this.api.post('/projects/', data);
    return response.data;
  }

  async updateProject(id: string, data: UpdateProjectRequest): Promise<Project> {
    const response = await this.api.patch(`/projects/${id}/`, data);
    return response.data;
  }

  async deleteProject(id: string): Promise<void> {
    await this.api.delete(`/projects/${id}/`);
  }

  async duplicateProject(id: string, name?: string): Promise<Project> {
    const response = await this.api.post(`/projects/${id}/duplicate/`, { name });
    return response.data;
  }

  async archiveProject(id: string): Promise<Project> {
    const response = await this.api.post(`/projects/${id}/archive/`);
    return response.data;
  }

  async restoreProject(id: string): Promise<Project> {
    const response = await this.api.post(`/projects/${id}/restore/`);
    return response.data;
  }

  // Task Management
  async getProjectTasks(projectId: string): Promise<ProjectTask[]> {
    const response = await this.api.get(`/projects/${projectId}/tasks/`);
    return response.data.results || response.data;
  }

  async createTask(projectId: string, task: Partial<ProjectTask>): Promise<ProjectTask> {
    const response = await this.api.post(`/projects/${projectId}/tasks/`, task);
    return response.data;
  }

  async updateTask(projectId: string, taskId: string, data: Partial<ProjectTask>): Promise<ProjectTask> {
    const response = await this.api.patch(`/projects/${projectId}/tasks/${taskId}/`, data);
    return response.data;
  }

  async deleteTask(projectId: string, taskId: string): Promise<void> {
    await this.api.delete(`/projects/${projectId}/tasks/${taskId}/`);
  }

  async updateTaskStatus(projectId: string, taskId: string, status: TaskStatus): Promise<ProjectTask> {
    const response = await this.api.patch(`/projects/${projectId}/tasks/${taskId}/`, { status });
    return response.data;
  }

  async bulkUpdateTasks(projectId: string, updates: Array<{
    taskId: string;
    data: Partial<ProjectTask>;
  }>): Promise<ProjectTask[]> {
    const response = await this.api.post(`/projects/${projectId}/tasks/bulk-update/`, { updates });
    return response.data;
  }

  // File Management
  async getProjectFiles(projectId: string): Promise<ProjectFile[]> {
    const response = await this.api.get(`/projects/${projectId}/files/`);
    return response.data.results || response.data;
  }

  async uploadFile(projectId: string, file: File, metadata?: {
    category?: string;
    description?: string;
    tags?: string[];
  }): Promise<ProjectFile> {
    const formData = new FormData();
    formData.append('file', file);
    if (metadata) {
      Object.entries(metadata).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach(item => formData.append(`${key}[]`, item));
        } else if (value !== undefined) {
          formData.append(key, value);
        }
      });
    }

    const response = await this.api.post(
      `/projects/${projectId}/files/`, 
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  }

  async deleteFile(projectId: string, fileId: string): Promise<void> {
    await this.api.delete(`/projects/${projectId}/files/${fileId}/`);
  }

  async downloadFile(projectId: string, fileId: string): Promise<Blob> {
    const response = await this.api.get(`/projects/${projectId}/files/${fileId}/download/`, {
      responseType: 'blob',
    });
    return response.data;
  }

  async updateFileMetadata(
    projectId: string, 
    fileId: string, 
    metadata: Partial<ProjectFile>
  ): Promise<ProjectFile> {
    const response = await this.api.patch(`/projects/${projectId}/files/${fileId}/`, metadata);
    return response.data;
  }

  // Milestone Management
  async getProjectMilestones(projectId: string): Promise<ProjectMilestone[]> {
    const response = await this.api.get(`/projects/${projectId}/milestones/`);
    return response.data.results || response.data;
  }

  async createMilestone(projectId: string, milestone: Partial<ProjectMilestone>): Promise<ProjectMilestone> {
    const response = await this.api.post(`/projects/${projectId}/milestones/`, milestone);
    return response.data;
  }

  async updateMilestone(
    projectId: string, 
    milestoneId: string, 
    data: Partial<ProjectMilestone>
  ): Promise<ProjectMilestone> {
    const response = await this.api.patch(`/projects/${projectId}/milestones/${milestoneId}/`, data);
    return response.data;
  }

  async deleteMilestone(projectId: string, milestoneId: string): Promise<void> {
    await this.api.delete(`/projects/${projectId}/milestones/${milestoneId}/`);
  }

  async completeMilestone(projectId: string, milestoneId: string): Promise<ProjectMilestone> {
    const response = await this.api.post(`/projects/${projectId}/milestones/${milestoneId}/complete/`);
    return response.data;
  }

  // Timeline and Calendar
  async getProjectTimeline(projectId: string): Promise<TimelineItem[]> {
    const response = await this.api.get(`/projects/${projectId}/timeline/`);
    return response.data;
  }

  async updateTimelineItem(
    projectId: string, 
    itemId: string, 
    data: Partial<TimelineItem>
  ): Promise<TimelineItem> {
    const response = await this.api.patch(`/projects/${projectId}/timeline/${itemId}/`, data);
    return response.data;
  }

  // Templates
  async getProjectTemplates(): Promise<ProjectTemplate[]> {
    const response = await this.api.get('/templates/');
    return response.data;
  }

  async getProjectTemplate(id: string): Promise<ProjectTemplate> {
    const response = await this.api.get(`/templates/${id}/`);
    return response.data;
  }

  async createProjectFromTemplate(templateId: string, data: CreateProjectRequest): Promise<Project> {
    const response = await this.api.post(`/templates/${templateId}/create-project/`, data);
    return response.data;
  }

  async saveProjectAsTemplate(projectId: string, templateData: {
    name: string;
    description?: string;
    isPublic: boolean;
  }): Promise<ProjectTemplate> {
    const response = await this.api.post(`/projects/${projectId}/save-as-template/`, templateData);
    return response.data;
  }

  // Team and Members
  async getProjectMembers(projectId: string) {
    const response = await this.api.get(`/projects/${projectId}/members/`);
    return response.data;
  }

  async addProjectMember(projectId: string, userId: string, role: string) {
    const response = await this.api.post(`/projects/${projectId}/members/`, {
      userId,
      role
    });
    return response.data;
  }

  async removeProjectMember(projectId: string, memberId: string): Promise<void> {
    await this.api.delete(`/projects/${projectId}/members/${memberId}/`);
  }

  async updateMemberRole(projectId: string, memberId: string, role: string) {
    const response = await this.api.patch(`/projects/${projectId}/members/${memberId}/`, {
      role
    });
    return response.data;
  }

  // Dashboard and Analytics
  async getDashboardData(): Promise<UserProjectDashboard> {
    const response = await this.api.get('/dashboard/');
    return response.data;
  }

  async getProjectStatistics(): Promise<ProjectStatistics> {
    const response = await this.api.get('/analytics/statistics/');
    return response.data;
  }

  // Project Types Management
  async getProjectTypes(): Promise<ProjectType[]> {
    const response = await this.api.get('/project-types/');
    // Handle paginated response - extract the results array
    const rawData = response.data.results || response.data;
    
    // Transform API response to match frontend interface
    return rawData.map((type: any) => ({
      id: type.id,
      name: type.name,
      description: type.description,
      category: type.category,
      isActive: type.is_active,
      requiredFields: type.required_fields || [],
      estimatedDuration: type.estimated_duration,
      color: type.color,
      permissions: type.permissions || [],
      minRoleLevel: type.min_role_level,
      displayOrder: type.display_order,
      icon: type.icon,
    }));
  }

  async createProjectType(data: Omit<ProjectType, 'id'>): Promise<ProjectType> {
    const response = await this.api.post('/project-types/', data);
    return response.data;
  }

  async updateProjectType(id: string, data: Partial<ProjectType>): Promise<ProjectType> {
    const response = await this.api.patch(`/project-types/${id}/`, data);
    return response.data;
  }

  async getProjectPerformanceMetrics(projectId: string): Promise<ProjectPerformanceMetrics> {
    const response = await this.api.get(`/projects/${projectId}/metrics/`);
    return response.data;
  }

  async getProjectAnalytics(projectId: string, timeRange?: {
    start: Date;
    end: Date;
  }) {
    const response = await this.api.get(`/projects/${projectId}/analytics/`, {
      params: timeRange
    });
    return response.data;
  }

  // Search and Filters
  async searchProjects(query: string): Promise<Project[]> {
    const response = await this.api.get('/projects/search/', {
      params: { q: query }
    });
    return response.data;
  }

  async getProjectTags(): Promise<string[]> {
    const response = await this.api.get('/projects/tags/');
    return response.data;
  }

  // Bulk Operations
  async bulkUpdateProjects(updates: Array<{
    projectId: string;
    data: Partial<Project>;
  }>): Promise<Project[]> {
    const response = await this.api.post('/projects/bulk-update/', { updates });
    return response.data;
  }

  async bulkDeleteProjects(projectIds: string[]): Promise<void> {
    await this.api.post('/projects/bulk-delete/', { projectIds });
  }

  async bulkArchiveProjects(projectIds: string[]): Promise<Project[]> {
    const response = await this.api.post('/projects/bulk-archive/', { projectIds });
    return response.data;
  }

  // Export and Import
  async exportProject(projectId: string, format: 'json' | 'csv' | 'pdf'): Promise<Blob> {
    const response = await this.api.get(`/projects/${projectId}/export/`, {
      params: { format },
      responseType: 'blob'
    });
    return response.data;
  }

  async importProjects(file: File): Promise<{
    imported: number;
    errors: string[];
  }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.api.post('/projects/import/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
}

export const projectsService = new ProjectsService();