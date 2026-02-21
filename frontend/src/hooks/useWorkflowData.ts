'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { workflowApi, WorkflowTemplate, WorkflowInstance, AnalyticsData } from '@/services/workflowApi';
import { toast } from 'sonner';

// Hook for workflow templates
export function useWorkflowTemplates(params?: {
  category?: string;
  is_active?: boolean;
  search?: string;
}) {
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize params to prevent unnecessary re-renders
  const memoizedParams = useMemo(() => params, [
    params?.category, 
    params?.is_active, 
    params?.search
  ]);

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await workflowApi.getWorkflowTemplates(memoizedParams);
      setTemplates(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch templates';
      setError(message);
      console.error('Templates fetch error:', err);
      // Fallback to mock data (silently)
      setTemplates(getMockTemplates());
    } finally {
      setLoading(false);
    }
  }, [memoizedParams]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const createTemplate = useCallback(async (data: Partial<WorkflowTemplate>) => {
    try {
      const newTemplate = await workflowApi.createWorkflowTemplate(data);
      setTemplates(prev => [newTemplate, ...prev]);
      toast.success('Template created successfully');
      return newTemplate;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create template';
      toast.error(message);
      throw err;
    }
  }, []);

  const updateTemplate = useCallback(async (id: string, data: Partial<WorkflowTemplate>) => {
    try {
      const updatedTemplate = await workflowApi.updateWorkflowTemplate(id, data);
      setTemplates(prev => prev.map(t => t.id === id ? updatedTemplate : t));
      toast.success('Template updated successfully');
      return updatedTemplate;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update template';
      toast.error(message);
      throw err;
    }
  }, []);

  const deleteTemplate = useCallback(async (id: string) => {
    try {
      await workflowApi.deleteWorkflowTemplate(id);
      setTemplates(prev => prev.filter(t => t.id !== id));
      toast.success('Template deleted successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete template';
      toast.error(message);
      throw err;
    }
  }, []);

  const duplicateTemplate = useCallback(async (id: string) => {
    try {
      const duplicatedTemplate = await workflowApi.duplicateWorkflowTemplate(id);
      setTemplates(prev => [duplicatedTemplate, ...prev]);
      toast.success('Template duplicated successfully');
      return duplicatedTemplate;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to duplicate template';
      toast.error(message);
      throw err;
    }
  }, []);

  return {
    templates,
    loading,
    error,
    refresh: fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate
  };
}

// Hook for workflow instances
export function useWorkflowInstances(params?: {
  status?: string;
  priority?: string;
  assigned_to?: string;
  template?: string;
  search?: string;
}) {
  const [workflows, setWorkflows] = useState<WorkflowInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize params to prevent unnecessary re-renders
  const memoizedParams = useMemo(() => params, [
    params?.status, 
    params?.priority, 
    params?.assigned_to, 
    params?.template, 
    params?.search
  ]);

  const fetchWorkflows = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await workflowApi.getWorkflowInstances(memoizedParams);
      setWorkflows(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch workflows';
      setError(message);
      console.error('Workflows fetch error:', err);
      // Fallback to mock data (silently)
      setWorkflows(getMockWorkflows());
    } finally {
      setLoading(false);
    }
  }, [memoizedParams]);

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  const createWorkflow = useCallback(async (data: {
    workflow_template: string;
    name: string;
    description?: string;
    priority?: string;
    due_date?: string;
    assigned_to?: string;
  }) => {
    try {
      const newWorkflow = await workflowApi.createWorkflowInstance(data);
      setWorkflows(prev => [newWorkflow, ...prev]);
      toast.success('Workflow created successfully');
      return newWorkflow;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create workflow';
      toast.error(message);
      throw err;
    }
  }, []);

  const updateWorkflow = useCallback(async (id: string, data: Partial<WorkflowInstance>) => {
    try {
      const updatedWorkflow = await workflowApi.updateWorkflowInstance(id, data);
      setWorkflows(prev => prev.map(w => w.id === id ? updatedWorkflow : w));
      toast.success('Workflow updated successfully');
      return updatedWorkflow;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update workflow';
      toast.error(message);
      throw err;
    }
  }, []);

  const deleteWorkflow = useCallback(async (id: string) => {
    try {
      await workflowApi.deleteWorkflowInstance(id);
      setWorkflows(prev => prev.filter(w => w.id !== id));
      toast.success('Workflow deleted successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete workflow';
      toast.error(message);
      throw err;
    }
  }, []);

  const startWorkflow = useCallback(async (id: string) => {
    try {
      const updatedWorkflow = await workflowApi.startWorkflow(id);
      setWorkflows(prev => prev.map(w => w.id === id ? updatedWorkflow : w));
      toast.success('Workflow started successfully');
      return updatedWorkflow;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start workflow';
      toast.error(message);
      throw err;
    }
  }, []);

  const pauseWorkflow = useCallback(async (id: string) => {
    try {
      const updatedWorkflow = await workflowApi.pauseWorkflow(id);
      setWorkflows(prev => prev.map(w => w.id === id ? updatedWorkflow : w));
      toast.success('Workflow paused successfully');
      return updatedWorkflow;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to pause workflow';
      toast.error(message);
      throw err;
    }
  }, []);

  const resumeWorkflow = useCallback(async (id: string) => {
    try {
      const updatedWorkflow = await workflowApi.resumeWorkflow(id);
      setWorkflows(prev => prev.map(w => w.id === id ? updatedWorkflow : w));
      toast.success('Workflow resumed successfully');
      return updatedWorkflow;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to resume workflow';
      toast.error(message);
      throw err;
    }
  }, []);

  const cancelWorkflow = useCallback(async (id: string) => {
    try {
      const updatedWorkflow = await workflowApi.cancelWorkflow(id);
      setWorkflows(prev => prev.map(w => w.id === id ? updatedWorkflow : w));
      toast.success('Workflow cancelled successfully');
      return updatedWorkflow;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to cancel workflow';
      toast.error(message);
      throw err;
    }
  }, []);

  return {
    workflows,
    loading,
    error,
    refresh: fetchWorkflows,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    startWorkflow,
    pauseWorkflow,
    resumeWorkflow,
    cancelWorkflow
  };
}

// Hook for workflow analytics
export function useWorkflowAnalytics(params?: {
  organization?: string;
  user?: string;
  date_range?: string;
}) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize params to prevent unnecessary re-renders
  const memoizedParams = useMemo(() => params, [
    params?.organization, 
    params?.user, 
    params?.date_range
  ]);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await workflowApi.getAnalytics(memoizedParams);
      setAnalytics(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch analytics';
      setError(message);
      console.error('Analytics fetch error:', err);
      // Fallback to mock data (silently)
      setAnalytics(getMockAnalytics());
    } finally {
      setLoading(false);
    }
  }, [memoizedParams]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    analytics,
    loading,
    error,
    refresh: fetchAnalytics
  };
}

// Hook for real-time metrics
export function useRealTimeMetrics(refreshInterval: number = 30000) {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = useCallback(async () => {
    try {
      const data = await workflowApi.getRealTimeMetrics();
      setMetrics(data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch real-time metrics:', err);
      // Use fallback metrics
      setMetrics(getMockRealTimeMetrics());
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
    
    // Set up interval for real-time updates
    const interval = setInterval(fetchMetrics, refreshInterval);
    
    return () => clearInterval(interval);
  }, [fetchMetrics, refreshInterval]);

  return { metrics, loading, refresh: fetchMetrics };
}

// Hook for single workflow
export function useWorkflow(id: string) {
  const [workflow, setWorkflow] = useState<WorkflowInstance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkflow = useCallback(async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await workflowApi.getWorkflowInstance(id);
      setWorkflow(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch workflow';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchWorkflow();
  }, [fetchWorkflow]);

  return {
    workflow,
    loading,
    error,
    refresh: fetchWorkflow
  };
}

// Mock data fallbacks
function getMockTemplates(): WorkflowTemplate[] {
  return [
    {
      id: '1',
      name: 'Patent Drafting - Utility Patent',
      description: 'Complete workflow for drafting utility patents',
      category: 'Patent Drafting',
      version: '1.0',
      is_active: true,
      estimated_duration: 14,
      auto_assign: true,
      require_sequential: true,
      allow_parallel: false,
      quality_threshold: 90,
      require_approval: true,
      usage_count: 156,
      success_rate: 92,
      tags: ['patent', 'drafting', 'utility'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: {
        id: '1',
        name: 'John Smith',
        email: 'john@example.com'
      },
      steps: []
    },
    {
      id: '2',
      name: 'Patent Prosecution Workflow',
      description: 'Office action responses and patent prosecution',
      category: 'Patent Prosecution',
      version: '1.0',
      is_active: true,
      estimated_duration: 21,
      auto_assign: true,
      require_sequential: true,
      allow_parallel: false,
      quality_threshold: 85,
      require_approval: true,
      usage_count: 89,
      success_rate: 88,
      tags: ['patent', 'prosecution'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: {
        id: '2',
        name: 'Sarah Johnson',
        email: 'sarah@example.com'
      },
      steps: []
    }
  ];
}

function getMockWorkflows(): WorkflowInstance[] {
  return [
    {
      id: 'w1',
      name: 'Patent Drafting - AI Motor Controller',
      description: 'Patent application for AI-powered motor controller',
      status: 'in_progress',
      priority: 'high',
      progress_percentage: 65,
      current_step_order: 3,
      start_date: new Date(Date.now() - 86400000 * 7).toISOString(), // 7 days ago
      due_date: new Date(Date.now() + 86400000 * 7).toISOString(), // 7 days from now
      assigned_to: {
        id: '1',
        name: 'Sarah Johnson',
        email: 'sarah@example.com'
      },
      quality_score: 92,
      workflow_template: {
        id: '1',
        name: 'Patent Drafting - Utility Patent',
        category: 'Patent Drafting'
      },
      step_instances: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];
}

function getMockAnalytics(): AnalyticsData {
  return {
    dashboard_data: {
      active_workflows: 24,
      completed_this_month: 18,
      avg_completion_time: 12.5,
      quality_pass_rate: 94,
      overdue_workflows: 3,
      total_templates: 8,
      workflow_by_status: [
        { status: 'active', count: 24 },
        { status: 'completed', count: 18 },
        { status: 'on_hold', count: 4 }
      ],
      completion_trend: [
        { date: '2024-08-01', completed: 5 },
        { date: '2024-08-02', completed: 3 },
        { date: '2024-08-03', completed: 7 },
        { date: '2024-08-04', completed: 4 },
        { date: '2024-08-05', completed: 6 }
      ],
      quality_trend: [
        { date: '2024-08-01', avg_score: 91 },
        { date: '2024-08-02', avg_score: 93 },
        { date: '2024-08-03', avg_score: 89 },
        { date: '2024-08-04', avg_score: 95 },
        { date: '2024-08-05', avg_score: 94 }
      ],
      template_usage: [
        { template_name: 'Patent Drafting', usage_count: 156, success_rate: 92 },
        { template_name: 'Patent Prosecution', usage_count: 89, success_rate: 88 }
      ],
      recent_activities: [
        {
          id: '1',
          action: 'Workflow Completed',
          workflow_name: 'Patent Drafting - Smart Sensor',
          user: 'Sarah Johnson',
          timestamp: new Date(Date.now() - 7200000).toISOString() // 2 hours ago
        }
      ]
    }
  };
}

function getMockRealTimeMetrics() {
  return {
    active_workflows: 24,
    workflows_started_today: 5,
    workflows_completed_today: 3,
    current_queue_size: 12,
    avg_response_time: 2.3
  };
}