/**
 * Analytics data hooks
 * React hooks for analytics data management
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { 
  analyticsApi, 
  AnalyticsProject, 
  AnalyticsDashboard, 
  PatentDataset, 
  PatentDatasetCreateData,
  AnalyticsVisualization, 
  AnalyticsReport, 
  AnalyticsInsight,
  TechnologyArea,
  CompetitorProfile
} from '@/services/analyticsApi';

// Hook for analytics dashboard data
export function useAnalyticsDashboard() {
  const [dashboard, setDashboard] = useState<AnalyticsDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await analyticsApi.getDashboard();
      
      if (response.success && response.data) {
        setDashboard(response.data);
      } else {
        setError(response.error || 'Failed to fetch dashboard data');
        setDashboard(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return {
    dashboard,
    loading,
    error,
    refetch: fetchDashboard
  };
}

// Hook for analytics projects
export function useAnalyticsProjects() {
  const [projects, setProjects] = useState<AnalyticsProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await analyticsApi.getProjects();
      
      if (response.success && response.data) {
        // Handle both paginated and direct array responses
        let projectsArray: AnalyticsProject[] = [];
        
        if (Array.isArray(response.data)) {
          // Direct array response
          projectsArray = response.data;
        } else if (response.data && typeof response.data === 'object') {
          // Check for paginated response with results
          const paginatedData = response.data as any;
          if ('results' in paginatedData && Array.isArray(paginatedData.results)) {
            projectsArray = paginatedData.results;
          } else {
            // Fallback: log the unexpected structure and use empty array
            console.warn('Unexpected API response structure:', Object.keys(paginatedData));
            projectsArray = [];
          }
        }
        
        setProjects(projectsArray);
      } else {
        console.warn('Projects API failed:', response.error);
        setProjects([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch projects');
      console.error('Projects fetch error:', err);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const createProject = useCallback(async (data: Partial<AnalyticsProject>) => {
    try {
      const response = await analyticsApi.createProject(data);
      if (response.success && response.data) {
        setProjects(prev => {
          // Ensure prev is always an array
          const prevArray = Array.isArray(prev) ? prev : [];
          return [response.data!, ...prevArray];
        });
        toast.success('Project created successfully');
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to create project');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create project';
      toast.error(errorMsg);
      throw err;
    }
  }, []);

  const updateProject = useCallback(async (id: string, data: Partial<AnalyticsProject>) => {
    try {
      const response = await analyticsApi.updateProject(id, data);
      if (response.success && response.data) {
        setProjects(prev => {
          const prevArray = Array.isArray(prev) ? prev : [];
          return prevArray.map(p => p.id === id ? response.data! : p);
        });
        toast.success('Project updated successfully');
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to update project');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update project';
      toast.error(errorMsg);
      throw err;
    }
  }, []);

  const deleteProject = useCallback(async (id: string) => {
    try {
      const response = await analyticsApi.deleteProject(id);
      if (response.success) {
        setProjects(prev => {
          const prevArray = Array.isArray(prev) ? prev : [];
          return prevArray.filter(p => p.id !== id);
        });
        toast.success('Project deleted successfully');
      } else {
        throw new Error(response.error || 'Failed to delete project');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete project';
      toast.error(errorMsg);
      throw err;
    }
  }, []);

  const startAnalysis = useCallback(async (projectId: string) => {
    try {
      const response = await analyticsApi.startAnalysis(projectId);
      if (response.success) {
        // Update project status
        setProjects(prev => {
          const prevArray = Array.isArray(prev) ? prev : [];
          return prevArray.map(p => 
            p.id === projectId 
              ? { ...p, status: 'data_collection' as const }
              : p
          );
        });
        toast.success('Analysis started successfully');
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to start analysis');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to start analysis';
      toast.error(errorMsg);
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return {
    projects,
    loading,
    error,
    refetch: fetchProjects,
    createProject,
    updateProject,
    deleteProject,
    startAnalysis
  };
}

// Hook for single project data
export function useAnalyticsProject(projectId: string | null) {
  const [project, setProject] = useState<AnalyticsProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProject = useCallback(async () => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await analyticsApi.getProject(projectId);
      
      if (response.success && response.data) {
        setProject(response.data);
      } else {
        setError(response.error || 'Failed to fetch project');
        setProject(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch project');
      console.error('Project fetch error:', err);
      setProject(null);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  return {
    project,
    loading,
    error,
    refetch: fetchProject
  };
}

// Hook for project datasets
export function useAnalyticsDatasets(projectId: string) {
  const [datasets, setDatasets] = useState<PatentDataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDatasets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await analyticsApi.getDatasets(projectId);
      
      if (response.success && response.data) {
        let datasetsArray: PatentDataset[] = [];
        if (Array.isArray(response.data)) {
          datasetsArray = response.data;
        } else if (response.data && typeof response.data === 'object' && 'results' in response.data) {
          const paginatedData = response.data as any;
          datasetsArray = Array.isArray(paginatedData.results) ? paginatedData.results : [];
        }
        setDatasets(datasetsArray);
      } else {
        console.warn('Datasets API failed, using empty array:', response.error);
        setDatasets([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch datasets');
      console.error('Datasets fetch error:', err);
      setDatasets([]);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const createDataset = useCallback(async (data: PatentDatasetCreateData) => {
    try {
      const response = await analyticsApi.createDataset(data);
      if (response.success && response.data) {
        setDatasets(prev => [response.data!, ...prev]);
        toast.success('Dataset created successfully');
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to create dataset');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create dataset';
      toast.error(errorMsg);
      throw err;
    }
  }, []);

  const updateDataset = useCallback(async (datasetId: string, data: Partial<PatentDataset>) => {
    try {
      const response = await analyticsApi.updateDataset(datasetId, data);
      if (response.success && response.data) {
        setDatasets(prev => prev.map(d => d.id === datasetId ? response.data! : d));
        toast.success('Dataset updated successfully');
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to update dataset');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update dataset';
      toast.error(errorMsg);
      throw err;
    }
  }, []);

  const deleteDataset = useCallback(async (datasetId: string) => {
    try {
      const response = await analyticsApi.deleteDataset(datasetId);
      if (response.success) {
        setDatasets(prev => prev.filter(d => d.id !== datasetId));
        toast.success('Dataset deleted successfully');
      } else {
        throw new Error(response.error || 'Failed to delete dataset');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete dataset';
      toast.error(errorMsg);
      throw err;
    }
  }, []);

  const processDataset = useCallback(async (datasetId: string) => {
    try {
      const response = await analyticsApi.processDataset(datasetId);
      if (response.success) {
        // Update dataset status to processing
        setDatasets(prev => prev.map(d => 
          d.id === datasetId 
            ? { ...d, processing_status: 'processing' as const, processing_progress: 0 }
            : d
        ));
        toast.success('Dataset processing started');
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to start processing');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to start processing';
      toast.error(errorMsg);
      throw err;
    }
  }, []);

  useEffect(() => {
    if (projectId) {
      fetchDatasets();
    }
  }, [fetchDatasets, projectId]);

  return {
    datasets,
    loading,
    error,
    refetch: fetchDatasets,
    createDataset,
    updateDataset,
    deleteDataset,
    processDataset
  };
}

// Hook for visualizations
export function useAnalyticsVisualizations(projectId?: string) {
  const [visualizations, setVisualizations] = useState<AnalyticsVisualization[]>([]);
  const [chartTemplates, setChartTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVisualizations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [vizResponse, templatesResponse] = await Promise.all([
        analyticsApi.getVisualizations(projectId),
        analyticsApi.getChartTemplates()
      ]);
      
      if (vizResponse.success && vizResponse.data) {
        // Handle paginated response - extract results array
        let visualizationsArray: AnalyticsVisualization[] = [];
        if (Array.isArray(vizResponse.data)) {
          visualizationsArray = vizResponse.data;
        } else if (vizResponse.data && typeof vizResponse.data === 'object' && 'results' in vizResponse.data) {
          const paginatedData = vizResponse.data as any;
          visualizationsArray = Array.isArray(paginatedData.results) ? paginatedData.results : [];
        }
        setVisualizations(visualizationsArray);
      } else {
        setVisualizations([]);
      }

      if (templatesResponse.success && templatesResponse.data) {
        setChartTemplates(templatesResponse.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch visualizations');
      console.error('Visualizations fetch error:', err);
      setVisualizations([]);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const createVisualization = useCallback(async (data: Partial<AnalyticsVisualization>) => {
    try {
      console.log('Creating visualization with data:', data);
      const response = await analyticsApi.createVisualization(data);
      if (response.success && response.data) {
        setVisualizations(prev => [response.data!, ...prev]);
        toast.success('Visualization created successfully');
        return response.data;
      } else {
        console.error('Visualization creation failed:', response);
        throw new Error(response.error || 'Failed to create visualization');
      }
    } catch (err) {
      console.error('Visualization creation error:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to create visualization';
      toast.error(errorMsg);
      throw err;
    }
  }, []);

  const generateChart = useCallback(async (visualizationId: string) => {
    try {
      const response = await analyticsApi.generateChart(visualizationId);
      if (response.success && response.data) {
        // Update visualization status and chart data
        setVisualizations(prev => prev.map(v =>
          v.id === visualizationId
            ? { ...v, status: 'completed' as const, chart_data: response.data!.chart_data }
            : v
        ));
        toast.success('Chart generated successfully');
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to generate chart');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to generate chart';
      toast.error(errorMsg);
      throw err;
    }
  }, []);

  const deleteVisualization = useCallback(async (visualizationId: string) => {
    try {
      // Delete API call (assuming same pattern as datasets)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/analytics/api/visualizations/${visualizationId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('auth_access_token') : ''}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete visualization');
      }

      setVisualizations(prev => prev.filter(v => v.id !== visualizationId));
      toast.success('Visualization deleted successfully');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete visualization';
      toast.error(errorMsg);
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchVisualizations();
  }, [fetchVisualizations]);

  return {
    visualizations,
    chartTemplates,
    loading,
    error,
    refetch: fetchVisualizations,
    createVisualization,
    generateChart,
    deleteVisualization
  };
}

// Hook for insights
export function useAnalyticsInsights(projectId?: string) {
  const [insights, setInsights] = useState<AnalyticsInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await analyticsApi.getInsights(projectId);
      
      if (response.success && response.data) {
        setInsights(response.data);
      } else {
        setInsights([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch insights');
      console.error('Insights fetch error:', err);
      setInsights([]);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  return {
    insights,
    loading,
    error,
    refetch: fetchInsights
  };
}

// Hook for reports
export function useAnalyticsReports(projectId?: string) {
  const [reports, setReports] = useState<AnalyticsReport[]>([]);
  const [reportTemplates, setReportTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [reportsResponse, templatesResponse] = await Promise.all([
        analyticsApi.getReports(projectId),
        analyticsApi.getReportTemplates()
      ]);
      
      if (reportsResponse.success && reportsResponse.data) {
        // Handle paginated response - extract results array
        let reportsArray: AnalyticsReport[] = [];
        if (Array.isArray(reportsResponse.data)) {
          reportsArray = reportsResponse.data;
        } else if (reportsResponse.data && typeof reportsResponse.data === 'object' && 'results' in reportsResponse.data) {
          const paginatedData = reportsResponse.data as any;
          reportsArray = Array.isArray(paginatedData.results) ? paginatedData.results : [];
        }
        setReports(reportsArray);
      } else {
        setReports([]);
      }

      if (templatesResponse.success && templatesResponse.data) {
        setReportTemplates(templatesResponse.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch reports');
      console.error('Reports fetch error:', err);
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const createReport = useCallback(async (data: Partial<AnalyticsReport>) => {
    try {
      const response = await analyticsApi.createReport(data);
      if (response.success && response.data) {
        setReports(prev => [response.data!, ...prev]);
        toast.success('Report created successfully');
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to create report');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create report';
      toast.error(errorMsg);
      throw err;
    }
  }, []);

  const generateReport = useCallback(async (reportId: string) => {
    try {
      const response = await analyticsApi.generateReport(reportId);
      if (response.success && response.data) {
        // Update report status
        setReports(prev => prev.map(r => 
          r.id === reportId 
            ? { ...r, status: 'completed' as const }
            : r
        ));
        toast.success('Report generated successfully');
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to generate report');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to generate report';
      toast.error(errorMsg);
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return {
    reports,
    reportTemplates,
    loading,
    error,
    refetch: fetchReports,
    createReport,
    generateReport
  };
}