/**
 * Workflow API Service
 * Handles all API calls for workflow management
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  version: string;
  is_active: boolean;
  estimated_duration?: number;
  auto_assign: boolean;
  require_sequential: boolean;
  allow_parallel: boolean;
  quality_threshold: number;
  require_approval: boolean;
  usage_count: number;
  success_rate: number;
  tags: string[];
  created_at: string;
  updated_at: string;
  created_by: {
    id: string;
    name: string;
    email: string;
  };
  steps: WorkflowStep[];
}

interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  step_type: string;
  order: number;
  estimated_duration?: number;
  assigned_role?: string;
  is_required: boolean;
}

interface WorkflowInstance {
  id: string;
  name: string;
  description: string;
  status: string;
  priority: string;
  progress_percentage: number;
  current_step_order: number;
  start_date?: string;
  due_date?: string;
  completed_date?: string;
  assigned_to?: {
    id: string;
    name: string;
    email: string;
  };
  quality_score?: number;
  workflow_template: {
    id: string;
    name: string;
    category: string;
  };
  step_instances: WorkflowStepInstance[];
  created_at: string;
  updated_at: string;
}

interface WorkflowStepInstance {
  id: string;
  status: string;
  assigned_to?: {
    id: string;
    name: string;
  };
  start_date?: string;
  due_date?: string;
  completed_date?: string;
  quality_score?: number;
  workflow_step: {
    id: string;
    name: string;
    order: number;
  };
}

interface AnalyticsData {
  dashboard_data: {
    active_workflows: number;
    completed_this_month: number;
    avg_completion_time: number;
    quality_pass_rate: number;
    overdue_workflows: number;
    total_templates: number;
    workflow_by_status: Array<{ status: string; count: number; }>;
    completion_trend: Array<{ date: string; completed: number; }>;
    quality_trend: Array<{ date: string; avg_score: number; }>;
    template_usage: Array<{ template_name: string; usage_count: number; success_rate: number; }>;
    recent_activities: Array<{
      id: string;
      action: string;
      workflow_name: string;
      user: string;
      timestamp: string;
    }>;
  };
}

interface CreateWorkflowPayload {
  workflow_template: string;  // Changed from workflow_template_id
  name: string;
  description?: string;
  priority?: string;
  due_date?: string;
  assigned_to?: string;  // Changed from assigned_to_id
}

class WorkflowApiService {
  private async fetchWithAuth(url: string, options: RequestInit = {}) {
    // In a real app, you'd get the token from your auth context/store
    const token = localStorage.getItem('access_token');
    
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = new Error(`API call failed: ${response.status} ${response.statusText}`);
      // Add status code to error for better handling
      (error as any).status = response.status;
      (error as any).response = response;
      throw error;
    }

    return response.json();
  }

  // Workflow Templates
  async getWorkflowTemplates(params?: {
    category?: string;
    is_active?: boolean;
    search?: string;
  }): Promise<WorkflowTemplate[]> {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.append('category', params.category);
    if (params?.is_active !== undefined) searchParams.append('is_active', params.is_active.toString());
    if (params?.search) searchParams.append('search', params.search);

    const queryString = searchParams.toString();
    const url = `/workflows/api/templates/${queryString ? `?${queryString}` : ''}`;
    
    const response = await this.fetchWithAuth(url);
    return response.results || response;
  }

  async getWorkflowTemplate(id: string): Promise<WorkflowTemplate> {
    return this.fetchWithAuth(`/workflows/api/templates/${id}/`);
  }

  async createWorkflowTemplate(data: Partial<WorkflowTemplate>): Promise<WorkflowTemplate> {
    return this.fetchWithAuth('/workflows/api/templates/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateWorkflowTemplate(id: string, data: Partial<WorkflowTemplate>): Promise<WorkflowTemplate> {
    return this.fetchWithAuth(`/workflows/api/templates/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteWorkflowTemplate(id: string): Promise<void> {
    await this.fetchWithAuth(`/workflows/api/templates/${id}/`, {
      method: 'DELETE',
    });
  }

  async duplicateWorkflowTemplate(id: string): Promise<WorkflowTemplate> {
    return this.fetchWithAuth(`/workflows/api/templates/${id}/duplicate/`, {
      method: 'POST',
    });
  }

  // Workflow Instances
  async getWorkflowInstances(params?: {
    status?: string;
    priority?: string;
    assigned_to?: string;
    template?: string;
    search?: string;
    organization?: string;
  }): Promise<WorkflowInstance[]> {
    const searchParams = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value) searchParams.append(key, value);
    });

    const queryString = searchParams.toString();
    const url = `/workflows/api/instances/${queryString ? `?${queryString}` : ''}`;
    
    const response = await this.fetchWithAuth(url);
    return response.results || response;
  }

  async getWorkflowInstance(id: string): Promise<WorkflowInstance> {
    return this.fetchWithAuth(`/workflows/api/instances/${id}/`);
  }

  async createWorkflowInstance(data: CreateWorkflowPayload): Promise<WorkflowInstance> {
    return this.fetchWithAuth('/workflows/api/instances/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateWorkflowInstance(id: string, data: Partial<WorkflowInstance>): Promise<WorkflowInstance> {
    return this.fetchWithAuth(`/workflows/api/instances/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteWorkflowInstance(id: string): Promise<void> {
    await this.fetchWithAuth(`/workflows/api/instances/${id}/`, {
      method: 'DELETE',
    });
  }

  // Workflow Actions
  async startWorkflow(id: string): Promise<WorkflowInstance> {
    return this.fetchWithAuth(`/workflows/api/instances/${id}/start/`, {
      method: 'POST',
    });
  }

  async pauseWorkflow(id: string): Promise<WorkflowInstance> {
    return this.fetchWithAuth(`/workflows/api/instances/${id}/pause/`, {
      method: 'POST',
    });
  }

  async resumeWorkflow(id: string): Promise<WorkflowInstance> {
    return this.fetchWithAuth(`/workflows/api/instances/${id}/resume/`, {
      method: 'POST',
    });
  }

  async cancelWorkflow(id: string): Promise<WorkflowInstance> {
    return this.fetchWithAuth(`/workflows/api/instances/${id}/cancel/`, {
      method: 'POST',
    });
  }

  // Analytics
  async getAnalytics(params?: {
    organization?: string;
    user?: string;
    date_range?: string;
  }): Promise<AnalyticsData> {
    const searchParams = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value) searchParams.append(key, value);
    });

    const queryString = searchParams.toString();
    const url = `/workflows/api/analytics/dashboard/${queryString ? `?${queryString}` : ''}`;
    
    return this.fetchWithAuth(url);
  }

  async getRealTimeMetrics(): Promise<any> {
    return this.fetchWithAuth('/workflows/api/analytics/realtime/');
  }

  async getQualityAnalytics(params?: {
    start_date?: string;
    end_date?: string;
    organization?: string;
  }): Promise<any> {
    const searchParams = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value) searchParams.append(key, value);
    });

    const queryString = searchParams.toString();
    const url = `/workflows/api/analytics/quality/${queryString ? `?${queryString}` : ''}`;
    
    return this.fetchWithAuth(url);
  }

  // Bulk Operations
  async bulkUpdateWorkflows(workflowIds: string[], operation: string, parameters?: any): Promise<any> {
    return this.fetchWithAuth('/workflows/api/bulk-operations/', {
      method: 'POST',
      body: JSON.stringify({
        workflow_ids: workflowIds,
        operation,
        parameters: parameters || {},
      }),
    });
  }

  // Step Management
  async getWorkflowStep(workflowId: string, stepId: string): Promise<WorkflowStepInstance> {
    return this.fetchWithAuth(`/workflows/api/instances/${workflowId}/steps/${stepId}/`);
  }

  async updateWorkflowStep(workflowId: string, stepId: string, data: Partial<WorkflowStepInstance>): Promise<WorkflowStepInstance> {
    return this.fetchWithAuth(`/workflows/api/instances/${workflowId}/steps/${stepId}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async startWorkflowStep(workflowId: string, stepId: string): Promise<WorkflowStepInstance> {
    return this.fetchWithAuth(`/workflows/api/instances/${workflowId}/steps/${stepId}/start/`, {
      method: 'POST',
    });
  }

  async completeWorkflowStep(workflowId: string, stepId: string, data?: {
    quality_score?: number;
    output_data?: any;
    notes?: string;
  }): Promise<WorkflowStepInstance> {
    return this.fetchWithAuth(`/workflows/api/instances/${workflowId}/steps/${stepId}/complete/`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  }

  // Quality Control
  async getQualityCheckResults(workflowId: string): Promise<any[]> {
    return this.fetchWithAuth(`/workflows/api/instances/${workflowId}/quality-checks/`);
  }

  async executeQualityCheck(qualityControlId: string, stepInstanceId: string): Promise<any> {
    return this.fetchWithAuth('/workflows/api/quality-checks/execute/', {
      method: 'POST',
      body: JSON.stringify({
        quality_control_id: qualityControlId,
        step_instance_id: stepInstanceId,
      }),
    });
  }
}

export const workflowApi = new WorkflowApiService();
export type { 
  WorkflowTemplate, 
  WorkflowInstance, 
  WorkflowStep, 
  WorkflowStepInstance, 
  AnalyticsData,
  CreateWorkflowPayload
};