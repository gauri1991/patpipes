/**
 * Workflow Domain Types
 * Type definitions for workflow management system
 */

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  version: string;
  isActive: boolean;
  requireSequential: boolean;
  autoAssign: boolean;
  estimatedDuration?: number;
  successRate: number;
  usageCount: number;
  tags: string[];
  color?: string;
  icon?: string;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  organization?: {
    id: string;
    name: string;
  };
}

export interface WorkflowStep {
  id: string;
  workflowTemplateId: string;
  name: string;
  description: string;
  stepType: StepType;
  order: number;
  isRequired: boolean;
  isParallel: boolean;
  estimatedDuration?: number;
  assignedUser?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  assignedRole?: string;
  approverRoles: string[];
  dependsOn: string[];
  configuration: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface WorkflowInstance {
  id: string;
  workflowTemplate: WorkflowTemplate;
  name: string;
  status: WorkflowInstanceStatus;
  progress: number;
  priority: WorkflowPriority;
  contentObject: {
    id: string;
    type: string;
    name: string;
  };
  assignedTo?: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  organization?: {
    id: string;
    name: string;
  };
  startDate?: string;
  dueDate?: string;
  completedDate?: string;
  configurationOverrides: Record<string, any>;
  tags: string[];
  notes: string;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface WorkflowStepInstance {
  id: string;
  workflowInstance: WorkflowInstance;
  workflowStep: WorkflowStep;
  status: StepStatus;
  assignedTo?: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  startDate?: string;
  dueDate?: string;
  completedDate?: string;
  actualDuration?: number;
  qualityScore?: number;
  outputData: Record<string, any>;
  stepConfiguration: Record<string, any>;
  notes: string;
  feedback: string;
  skippedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QualityControl {
  id: string;
  name: string;
  description: string;
  type: QualityControlType;
  criteria: Record<string, any>;
  passingScore: number;
  isRequired: boolean;
  isBlocking: boolean;
  autoRemediate: boolean;
  reviewerRoles: string[];
  requiredReviewers: number;
  workflowStep?: WorkflowStep;
  workflowTemplate?: WorkflowTemplate;
  onPassActions: any[];
  onFailActions: any[];
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface QualityCheckResult {
  id: string;
  qualityControl: QualityControl;
  stepInstance: WorkflowStepInstance;
  passed: boolean;
  score: number;
  details: Record<string, any>;
  reviewer: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  checkedAt: string;
  requiresRemediation: boolean;
  remediatedAt?: string;
  remediatedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface WorkflowAnalytics {
  totalActive: number;
  completionRate: number;
  averageDuration: number;
  qualityScore: number;
  trendsData: {
    date: string;
    activeWorkflows: number;
    completedWorkflows: number;
    averageQuality: number;
  }[];
  performanceByTemplate: {
    templateId: string;
    templateName: string;
    completionRate: number;
    averageDuration: number;
    qualityScore: number;
    usageCount: number;
  }[];
}

export interface WorkflowActivity {
  id: string;
  action: WorkflowAction;
  workflowInstance: {
    id: string;
    name: string;
    template: string;
  };
  stepInstance?: {
    id: string;
    name: string;
    status: StepStatus;
  };
  user: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  timestamp: string;
  details: Record<string, any>;
}

// Enums
export enum StepType {
  MANUAL = 'manual',
  AUTOMATED = 'automated',
  APPROVAL = 'approval',
  DOCUMENT = 'document',
  REVIEW = 'review',
  QUALITY_GATE = 'quality_gate',
  NOTIFICATION = 'notification'
}

export enum WorkflowInstanceStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum StepStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  WAITING_APPROVAL = 'waiting_approval',
  COMPLETED = 'completed',
  FAILED = 'failed',
  SKIPPED = 'skipped'
}

export enum WorkflowPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum QualityControlType {
  AUTOMATED = 'automated',
  MANUAL = 'manual',
  CHECKLIST = 'checklist',
  COMPLIANCE = 'compliance',
  DOCUMENT = 'document'
}

export enum WorkflowAction {
  WORKFLOW_CREATED = 'workflow_created',
  WORKFLOW_STARTED = 'workflow_started',
  WORKFLOW_COMPLETED = 'workflow_completed',
  WORKFLOW_PAUSED = 'workflow_paused',
  WORKFLOW_RESUMED = 'workflow_resumed',
  WORKFLOW_CANCELLED = 'workflow_cancelled',
  STEP_STARTED = 'step_started',
  STEP_COMPLETED = 'step_completed',
  STEP_ASSIGNED = 'step_assigned',
  STEP_SKIPPED = 'step_skipped',
  QUALITY_CHECK_PASSED = 'quality_check_passed',
  QUALITY_CHECK_FAILED = 'quality_check_failed',
  REMEDIATION_APPLIED = 'remediation_applied'
}

// Request/Response Types
export interface CreateWorkflowTemplateRequest {
  name: string;
  description: string;
  category: string;
  requireSequential: boolean;
  autoAssign: boolean;
  estimatedDuration?: number;
  tags?: string[];
  color?: string;
  icon?: string;
}

export interface CreateWorkflowInstanceRequest {
  workflowTemplateId: string;
  contentObjectId: string;
  contentObjectType: string;
  name?: string;
  assignedToId?: string;
  organizationId?: string;
  dueDate?: string;
  priority?: WorkflowPriority;
  configurationOverrides?: Record<string, any>;
  tags?: string[];
}

export interface UpdateWorkflowInstanceRequest {
  name?: string;
  status?: WorkflowInstanceStatus;
  assignedToId?: string;
  dueDate?: string;
  priority?: WorkflowPriority;
  notes?: string;
  tags?: string[];
}

export interface CompleteStepRequest {
  outputData?: Record<string, any>;
  qualityScore?: number;
  notes?: string;
}

// Filter and Search Types
export interface WorkflowFilters {
  status?: WorkflowInstanceStatus[];
  priority?: WorkflowPriority[];
  assignedToId?: string;
  templateId?: string;
  organizationId?: string;
  dateRange?: {
    from: string;
    to: string;
  };
  tags?: string[];
}

export interface WorkflowSortOptions {
  field: 'name' | 'status' | 'priority' | 'dueDate' | 'createdAt' | 'progress';
  direction: 'asc' | 'desc';
}

// Dynamic Workflow Types
export interface WorkflowCondition {
  conditionType: 'data_value' | 'user_role' | 'time_based' | 'quality_score' | 'step_outcome';
  fieldName: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'in' | 'not_in';
  expectedValue: any;
  description?: string;
}

export interface WorkflowBranch {
  branchId: string;
  name: string;
  conditions: WorkflowCondition[];
  logicalOperator: 'and' | 'or' | 'not';
  action: 'goto_step' | 'skip_steps' | 'end_workflow' | 'escalate' | 'pause_workflow';
  actionParameters: Record<string, any>;
  priority: number;
  description?: string;
}