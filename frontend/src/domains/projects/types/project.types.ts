/**
 * Projects Domain Types
 * Comprehensive type definitions for patent project management
 */

import { AuthUser } from '@/domains/accounts/types/auth.types';

// Project Status Enum
export enum ProjectStatus {
  DRAFT = 'draft',
  ACTIVE = 'active', 
  ON_HOLD = 'on_hold',
  UNDER_REVIEW = 'under_review',
  FILED = 'filed',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  COMPLETED = 'completed',
  ARCHIVED = 'archived'
}

// Project Priority Enum
export enum ProjectPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

// Project Type Interface (configurable)
export interface ProjectType {
  id: string;
  name: string;
  description: string;
  category: string;
  isActive: boolean;
  requiredFields: string[];
  estimatedDuration?: number;
  color?: string;
  permissions?: ProjectPermission[];
  minRoleLevel?: string;
  displayOrder?: number;
  icon?: string;
}

// Task Status Enum
export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  REVIEW = 'review',
  DONE = 'done',
  BLOCKED = 'blocked'
}

// File Category Enum
export enum FileCategory {
  APPLICATION = 'application',
  PRIOR_ART = 'prior_art',
  CORRESPONDENCE = 'correspondence',
  DRAWINGS = 'drawings',
  CLAIMS = 'claims',
  SPECIFICATION = 'specification',
  CONTRACTS = 'contracts',
  REPORTS = 'reports',
  OTHER = 'other'
}

// Core Project Interface
export interface Project {
  id: string;
  name: string;
  description?: string;
  type: string; // Project type ID
  status: ProjectStatus;
  priority: ProjectPriority;
  clientName?: string;
  clientEmail?: string;
  organizationId?: string;
  
  // Financial
  budget?: number;
  actualCost?: number;
  currency?: string;
  
  // Timeline
  startDate?: Date;
  targetDate?: Date;
  completedDate?: Date;
  
  // Team
  leadAttorneyId?: string;
  assignedMembers: ProjectMember[];
  
  // Progress
  progressPercentage: number;
  totalTasks: number;
  completedTasks: number;
  
  // Metadata
  tags: string[];
  isTemplate: boolean;
  templateId?: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

// Project Member Interface
export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  user: AuthUser;
  role: ProjectMemberRole;
  permissions: ProjectPermission[];
  joinedAt: Date;
}

export enum ProjectMemberRole {
  LEAD_ATTORNEY = 'lead_attorney',
  ATTORNEY = 'attorney',
  PARALEGAL = 'paralegal',
  ADMIN = 'admin',
  VIEWER = 'viewer'
}

export enum ProjectPermission {
  VIEW = 'view',
  EDIT = 'edit',
  DELETE = 'delete',
  MANAGE_TASKS = 'manage_tasks',
  MANAGE_FILES = 'manage_files',
  MANAGE_MEMBERS = 'manage_members',
  MANAGE_TIMELINE = 'manage_timeline'
}

// Project Task Interface
export interface ProjectTask {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: ProjectPriority;
  
  // Assignment
  assignedToId?: string;
  assignedTo?: AuthUser;
  
  // Timeline
  dueDate?: Date;
  startDate?: Date;
  completedDate?: Date;
  estimatedHours?: number;
  actualHours?: number;
  
  // Hierarchy
  parentTaskId?: string;
  subtasks?: ProjectTask[];
  dependencies: string[];
  
  // Metadata
  tags: string[];
  attachments: TaskAttachment[];
  comments: TaskComment[];
  
  // Progress
  progressPercentage: number;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

// Task Attachment Interface
export interface TaskAttachment {
  id: string;
  taskId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  fileUrl: string;
  uploadedBy: string;
  uploadedAt: Date;
}

// Task Comment Interface
export interface TaskComment {
  id: string;
  taskId: string;
  content: string;
  authorId: string;
  author: AuthUser;
  createdAt: Date;
  updatedAt: Date;
}

// Project File Interface
export interface ProjectFile {
  id: string;
  projectId: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  fileType: string;
  mimeType: string;
  fileUrl: string;
  category: FileCategory;
  
  // Versioning
  version: number;
  parentFileId?: string;
  isLatestVersion: boolean;
  
  // Metadata
  tags: string[];
  description?: string;
  
  // Access
  uploadedBy: string;
  uploadedAt: Date;
  lastAccessedAt?: Date;
  accessCount: number;
  
  // Permissions
  isPublic: boolean;
  allowedUsers: string[];
}

// Project Milestone Interface
export interface ProjectMilestone {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  targetDate: Date;
  completedDate?: Date;
  isCompleted: boolean;
  
  // Dependencies
  dependentTasks: string[];
  
  // Metadata
  importance: ProjectPriority;
  color?: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

// Project Template Interface
export interface ProjectTemplate {
  id: string;
  name: string;
  description?: string;
  type: string; // Project type ID
  category: string;
  
  // Template structure
  defaultTasks: TemplateTask[];
  defaultMilestones: TemplateMilestone[];
  defaultFiles: TemplateFile[];
  
  // Settings
  estimatedDuration: number; // in days
  estimatedBudget?: number;
  
  // Usage
  usageCount: number;
  isPublic: boolean;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

// Template Task Interface
export interface TemplateTask {
  title: string;
  description?: string;
  priority: ProjectPriority;
  estimatedHours?: number;
  dayOffset: number; // Days from project start
  dependencies: number[]; // Indices of dependent tasks
  role?: ProjectMemberRole; // Required role for assignment
}

// Template Milestone Interface
export interface TemplateMilestone {
  title: string;
  description?: string;
  dayOffset: number; // Days from project start
  importance: ProjectPriority;
}

// Template File Interface
export interface TemplateFile {
  name: string;
  category: FileCategory;
  description?: string;
  isRequired: boolean;
}

// API Request/Response Types
export interface CreateProjectRequest {
  name: string;
  description?: string;
  type: string; // Project type ID
  priority: ProjectPriority;
  clientName?: string;
  clientEmail?: string;
  budget?: number;
  currency?: string;
  startDate?: Date;
  targetDate?: Date;
  tags: string[];
  templateId?: string;
  assignedMemberIds: string[];
}

export interface UpdateProjectRequest extends Partial<CreateProjectRequest> {
  status?: ProjectStatus;
  progressPercentage?: number;
}

export interface ProjectFilters {
  status?: ProjectStatus[];
  type?: string[]; // Project type IDs
  priority?: ProjectPriority[];
  assignedToMe?: boolean;
  clientName?: string;
  tags?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface ProjectSearchParams {
  query?: string;
  filters?: ProjectFilters;
  sortBy?: 'name' | 'created' | 'updated' | 'priority' | 'status' | 'dueDate';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Timeline View Types
export interface TimelineItem {
  id: string;
  type: 'task' | 'milestone' | 'deadline';
  title: string;
  startDate: Date;
  endDate?: Date;
  status: TaskStatus | 'completed' | 'pending';
  assignee?: AuthUser;
  color?: string;
  dependencies?: string[];
}

// Kanban Board Types
export interface KanbanColumn {
  id: string;
  title: string;
  status: TaskStatus;
  tasks: ProjectTask[];
  color?: string;
  limit?: number;
}

// Statistics and Analytics Types
export interface ProjectStatistics {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  overdueProjects: number;
  
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  
  averageCompletionTime: number; // in days
  successRate: number; // percentage
  
  budgetUtilization: {
    planned: number;
    actual: number;
    variance: number;
  };
}

export interface ProjectPerformanceMetrics {
  projectId: string;
  timeToCompletion?: number;
  budgetVariance: number;
  taskCompletionRate: number;
  clientSatisfactionScore?: number;
  teamEfficiencyScore: number;
}

// Dashboard-specific Types
export interface UserProjectDashboard {
  statistics: ProjectStatistics;
  recentProjects: Project[];
  recentActivities: ProjectActivity[];
  notifications: ProjectNotification[];
  quickActions: QuickAction[];
  performanceMetrics: UserPerformanceMetrics;
}

export interface ProjectActivity {
  id: string;
  type: 'project_created' | 'task_completed' | 'file_uploaded' | 'milestone_reached' | 'comment_added';
  title: string;
  description: string;
  projectId?: string;
  projectName?: string;
  userId: string;
  userName: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface ProjectNotification {
  id: string;
  type: 'deadline_approaching' | 'task_overdue' | 'project_update' | 'team_mention' | 'milestone_due';
  title: string;
  message: string;
  projectId?: string;
  projectName?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  isRead: boolean;
  timestamp: Date;
  actionUrl?: string;
}

export interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  action: string;
  permissions?: ProjectPermission[];
  isEnabled: boolean;
}

export interface UserPerformanceMetrics {
  projectsCompleted: number;
  tasksCompleted: number;
  averageCompletionTime: number;
  onTimeDeliveryRate: number;
  clientSatisfactionScore?: number;
  efficiency: number;
  trend: 'up' | 'down' | 'stable';
}