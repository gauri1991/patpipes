/**
 * Workflows Service
 * Handles API calls for workflow management
 */

import {
  WorkflowTemplate,
  WorkflowInstance,
  WorkflowStepInstance,
  QualityControl,
  QualityCheckResult,
  WorkflowAnalytics,
  WorkflowActivity,
  CreateWorkflowTemplateRequest,
  CreateWorkflowInstanceRequest,
  UpdateWorkflowInstanceRequest,
  CompleteStepRequest,
  WorkflowFilters,
  WorkflowSortOptions
} from '../types/workflow.types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

class WorkflowsService {
  // Workflow Templates
  async getWorkflowTemplates(): Promise<WorkflowTemplate[]> {
    const response = await fetch(`${API_BASE_URL}/workflows/templates/`, {
      headers: {
        'Authorization': `Bearer ${this.getAuthToken()}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch workflow templates');
    }

    const data = await response.json();
    return data.results || data;
  }

  async getWorkflowTemplate(id: string): Promise<WorkflowTemplate> {
    const response = await fetch(`${API_BASE_URL}/workflows/templates/${id}/`, {
      headers: {
        'Authorization': `Bearer ${this.getAuthToken()}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch workflow template');
    }

    return response.json();
  }

  async createWorkflowTemplate(data: CreateWorkflowTemplateRequest): Promise<WorkflowTemplate> {
    const response = await fetch(`${API_BASE_URL}/workflows/templates/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.getAuthToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to create workflow template');
    }

    return response.json();
  }

  async updateWorkflowTemplate(id: string, data: Partial<CreateWorkflowTemplateRequest>): Promise<WorkflowTemplate> {
    const response = await fetch(`${API_BASE_URL}/workflows/templates/${id}/`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${this.getAuthToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to update workflow template');
    }

    return response.json();
  }

  async deleteWorkflowTemplate(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/workflows/templates/${id}/`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.getAuthToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete workflow template');
    }
  }

  // Workflow Instances
  async getWorkflowInstances(filters?: WorkflowFilters, sort?: WorkflowSortOptions): Promise<{
    results: WorkflowInstance[];
    count: number;
    next: string | null;
    previous: string | null;
  }> {
    const params = new URLSearchParams();
    
    if (filters?.status?.length) {
      params.append('status', filters.status.join(','));
    }
    if (filters?.priority?.length) {
      params.append('priority', filters.priority.join(','));
    }
    if (filters?.assignedToId) {
      params.append('assigned_to', filters.assignedToId);
    }
    if (filters?.templateId) {
      params.append('workflow_template', filters.templateId);
    }
    if (filters?.organizationId) {
      params.append('organization', filters.organizationId);
    }
    if (filters?.dateRange) {
      params.append('created_at__gte', filters.dateRange.from);
      params.append('created_at__lte', filters.dateRange.to);
    }
    if (filters?.tags?.length) {
      params.append('tags', filters.tags.join(','));
    }

    if (sort) {
      params.append('ordering', sort.direction === 'desc' ? `-${sort.field}` : sort.field);
    }

    const response = await fetch(`${API_BASE_URL}/workflows/instances/?${params}`, {
      headers: {
        'Authorization': `Bearer ${this.getAuthToken()}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch workflow instances');
    }

    return response.json();
  }

  async getWorkflowInstance(id: string): Promise<WorkflowInstance> {
    const response = await fetch(`${API_BASE_URL}/workflows/instances/${id}/`, {
      headers: {
        'Authorization': `Bearer ${this.getAuthToken()}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch workflow instance');
    }

    return response.json();
  }

  async createWorkflowInstance(data: CreateWorkflowInstanceRequest): Promise<WorkflowInstance> {
    const response = await fetch(`${API_BASE_URL}/workflows/instances/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.getAuthToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to create workflow instance');
    }

    return response.json();
  }

  async updateWorkflowInstance(id: string, data: UpdateWorkflowInstanceRequest): Promise<WorkflowInstance> {
    const response = await fetch(`${API_BASE_URL}/workflows/instances/${id}/`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${this.getAuthToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to update workflow instance');
    }

    return response.json();
  }

  async startWorkflow(id: string): Promise<WorkflowInstance> {
    const response = await fetch(`${API_BASE_URL}/workflows/instances/${id}/start/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.getAuthToken()}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to start workflow');
    }

    return response.json();
  }

  async pauseWorkflow(id: string): Promise<WorkflowInstance> {
    const response = await fetch(`${API_BASE_URL}/workflows/instances/${id}/pause/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.getAuthToken()}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to pause workflow');
    }

    return response.json();
  }

  async resumeWorkflow(id: string): Promise<WorkflowInstance> {
    const response = await fetch(`${API_BASE_URL}/workflows/instances/${id}/resume/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.getAuthToken()}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to resume workflow');
    }

    return response.json();
  }

  async cancelWorkflow(id: string): Promise<WorkflowInstance> {
    const response = await fetch(`${API_BASE_URL}/workflows/instances/${id}/cancel/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.getAuthToken()}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to cancel workflow');
    }

    return response.json();
  }

  // Workflow Steps
  async getWorkflowSteps(workflowId: string): Promise<WorkflowStepInstance[]> {
    const response = await fetch(`${API_BASE_URL}/workflows/instances/${workflowId}/steps/`, {
      headers: {
        'Authorization': `Bearer ${this.getAuthToken()}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch workflow steps');
    }

    const data = await response.json();
    return data.results || data;
  }

  async getWorkflowStep(workflowId: string, stepId: string): Promise<WorkflowStepInstance> {
    const response = await fetch(`${API_BASE_URL}/workflows/instances/${workflowId}/steps/${stepId}/`, {
      headers: {
        'Authorization': `Bearer ${this.getAuthToken()}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch workflow step');
    }

    return response.json();
  }

  async completeStep(workflowId: string, stepId: string, data: CompleteStepRequest): Promise<WorkflowStepInstance> {
    const response = await fetch(`${API_BASE_URL}/workflows/instances/${workflowId}/steps/${stepId}/complete/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.getAuthToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to complete workflow step');
    }

    return response.json();
  }

  async assignStep(workflowId: string, stepId: string, assigneeId: string): Promise<WorkflowStepInstance> {
    const response = await fetch(`${API_BASE_URL}/workflows/instances/${workflowId}/steps/${stepId}/assign/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.getAuthToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ assigned_to: assigneeId }),
    });

    if (!response.ok) {
      throw new Error('Failed to assign workflow step');
    }

    return response.json();
  }

  // Quality Control
  async getQualityControls(workflowId?: string): Promise<QualityControl[]> {
    const url = workflowId 
      ? `${API_BASE_URL}/workflows/quality-controls/?workflow=${workflowId}`
      : `${API_BASE_URL}/workflows/quality-controls/`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.getAuthToken()}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch quality controls');
    }

    const data = await response.json();
    return data.results || data;
  }

  async getQualityCheckResults(workflowId: string, stepId?: string): Promise<QualityCheckResult[]> {
    const url = stepId
      ? `${API_BASE_URL}/workflows/quality-results/?workflow=${workflowId}&step=${stepId}`
      : `${API_BASE_URL}/workflows/quality-results/?workflow=${workflowId}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.getAuthToken()}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch quality check results');
    }

    const data = await response.json();
    return data.results || data;
  }

  // Analytics
  async getWorkflowAnalytics(dateRange?: { from: string; to: string }): Promise<WorkflowAnalytics> {
    const params = new URLSearchParams();
    if (dateRange) {
      params.append('from_date', dateRange.from);
      params.append('to_date', dateRange.to);
    }

    const response = await fetch(`${API_BASE_URL}/workflows/analytics/?${params}`, {
      headers: {
        'Authorization': `Bearer ${this.getAuthToken()}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch workflow analytics');
    }

    return response.json();
  }

  async getRecentActivity(limit: number = 20): Promise<WorkflowActivity[]> {
    const response = await fetch(`${API_BASE_URL}/workflows/activity/?limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${this.getAuthToken()}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch workflow activity');
    }

    const data = await response.json();
    return data.results || data;
  }

  // Project Integration
  async attachWorkflowToProject(projectId: string, templateIds: string[]): Promise<WorkflowInstance[]> {
    const response = await fetch(`${API_BASE_URL}/workflows/attach-to-project/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.getAuthToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        project_id: projectId,
        template_ids: templateIds,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to attach workflows to project');
    }

    return response.json();
  }

  async getProjectWorkflows(projectId: string): Promise<WorkflowInstance[]> {
    const response = await fetch(`${API_BASE_URL}/workflows/instances/?content_object_id=${projectId}&content_object_type=project`, {
      headers: {
        'Authorization': `Bearer ${this.getAuthToken()}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch project workflows');
    }

    const data = await response.json();
    return data.results || data;
  }

  // Bulk Operations
  async bulkCreateWorkflows(requests: CreateWorkflowInstanceRequest[]): Promise<WorkflowInstance[]> {
    const response = await fetch(`${API_BASE_URL}/workflows/instances/bulk-create/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.getAuthToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ instances: requests }),
    });

    if (!response.ok) {
      throw new Error('Failed to bulk create workflows');
    }

    return response.json();
  }

  async bulkUpdateWorkflows(updates: Array<{ id: string; data: UpdateWorkflowInstanceRequest }>): Promise<WorkflowInstance[]> {
    const response = await fetch(`${API_BASE_URL}/workflows/instances/bulk-update/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.getAuthToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ updates }),
    });

    if (!response.ok) {
      throw new Error('Failed to bulk update workflows');
    }

    return response.json();
  }

  // Helper method to get auth token
  private getAuthToken(): string {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('authToken') || '';
    }
    return '';
  }
}

export const workflowsService = new WorkflowsService();