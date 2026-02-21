/**
 * useResearch Hook
 * Custom hook for managing patent research functionality
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { researchApi, ResearchQuery, ResearchResult, ResearchAnalytics } from '@/services/researchApi';
import { PatentAPI } from '@/services/patentApiConfigService';

export function useResearch(projectId: string) {
  const [queries, setQueries] = useState<ResearchQuery[]>([]);
  const [results, setResults] = useState<ResearchResult[]>([]);
  const [analytics, setAnalytics] = useState<ResearchAnalytics | null>(null);
  const [availableAPIs, setAvailableAPIs] = useState<PatentAPI[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch queries for the project
  const fetchQueries = useCallback(async () => {
    if (!projectId) return;
    
    try {
      setLoading(true);
      const response = await researchApi.getQueries(projectId);
      if (response.success && response.data) {
        setQueries(response.data);
      } else {
        setError(response.error || 'Failed to fetch queries');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch queries');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Fetch results for the project
  const fetchResults = useCallback(async (queryId?: string) => {
    if (!projectId) return;
    
    try {
      setLoading(true);
      const response = await researchApi.getResults({
        project_id: projectId,
        query_id: queryId
      });
      if (response.success && response.data) {
        setResults(response.data);
      } else {
        setError(response.error || 'Failed to fetch results');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch results');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Fetch analytics for the project
  const fetchAnalytics = useCallback(async () => {
    if (!projectId) return;
    
    try {
      const response = await researchApi.getProjectAnalytics(projectId);
      if (response.success && response.data) {
        setAnalytics(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    }
  }, [projectId]);

  // Fetch available APIs (enhanced with admin-configured APIs)
  const fetchAvailableAPIs = useCallback(async () => {
    try {
      // Use the new enhanced method that supports both hardcoded and admin-configured APIs
      const response = await researchApi.getAvailableAPIs();
      if (response.success && response.data) {
        setAvailableAPIs(response.data);
      } else {
        // Fallback: show error but still try to get basic API info
        console.error('Failed to fetch available APIs:', response.error);
        const fallbackResponse = await researchApi.getApiInfo();
        if (fallbackResponse.success && fallbackResponse.data) {
          // Convert old format to new format for backward compatibility
          const convertedAPIs: PatentAPI[] = fallbackResponse.data.map((api: any) => ({
            id: `${api.key || api.name}-legacy`,
            name: api.key || api.name,
            display_name: api.name || api.display_name,
            description: api.description,
            is_active: api.is_available || true,
            is_configured: true, // Legacy APIs are considered configured
            source_type: 'hardcoded' as const,
            test_status: 'passed' as const,
          }));
          setAvailableAPIs(convertedAPIs);
        }
      }
    } catch (err) {
      console.error('Failed to fetch API info:', err);
      // Set empty array to avoid undefined issues
      setAvailableAPIs([]);
    }
  }, []);

  // Create a new query
  const createQuery = async (queryData: {
    query_name: string;
    description?: string;
    api_source: string;
    keywords: string;
    ipc_classes?: string[];
    cpc_classes?: string[];
    assignees?: string[];
    inventors?: string[];
    date_range?: {
      from_date?: string;
      to_date?: string;
    };
    geographic_scope?: string[];
  }) => {
    try {
      setLoading(true);
      const response = await researchApi.createQuery({
        ...queryData,
        project: projectId
      });
      
      if (response.success && response.data) {
        setQueries(prev => [response.data!, ...prev]);
        toast.success('Query created successfully');
        return response.data;
      } else {
        toast.error(response.error || 'Failed to create query');
        return null;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create query');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Execute a query with API configuration check
  const executeQuery = async (queryId: string) => {
    try {
      setLoading(true);
      
      // Use enhanced execution method that checks API configuration
      const response = await researchApi.executeQueryWithConfig(queryId);
      
      if (response.success && response.data) {
        toast.success(response.data.message);
        
        // Update query status
        setQueries(prev => prev.map(query => 
          query.id === queryId 
            ? { ...query, status: 'running' as const }
            : query
        ));
        
        // Start polling for results
        pollQueryStatus(queryId);
        
        return response.data;
      } else {
        toast.error(response.error || 'Failed to execute query');
        return null;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to execute query');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Poll query status (for running queries)
  const pollQueryStatus = (queryId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await researchApi.getQueries(projectId);
        if (response.success && response.data) {
          const query = response.data.find(q => q.id === queryId);
          if (query) {
            setQueries(prev => prev.map(q => 
              q.id === queryId ? query : q
            ));
            
            // Stop polling if query is completed or failed
            if (query.status === 'completed' || query.status === 'failed') {
              clearInterval(interval);
              if (query.status === 'completed') {
                toast.success(`Query "${query.query_name}" completed with ${query.total_results} results`);
                fetchResults(); // Refresh results
                fetchAnalytics(); // Refresh analytics
              } else if (query.status === 'failed') {
                toast.error(`Query "${query.query_name}" failed: ${query.error_message}`);
              }
            }
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 3000); // Poll every 3 seconds

    // Stop polling after 5 minutes
    setTimeout(() => clearInterval(interval), 300000);
  };

  // Cancel a query
  const cancelQuery = async (queryId: string) => {
    try {
      const response = await researchApi.cancelQuery(queryId);
      if (response.success) {
        toast.success('Query cancelled');
        setQueries(prev => prev.map(query => 
          query.id === queryId 
            ? { ...query, status: 'cancelled' as const }
            : query
        ));
      } else {
        toast.error(response.error || 'Failed to cancel query');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to cancel query');
    }
  };

  // Update result selection/relevance
  const updateResult = async (resultId: string, updates: {
    manual_relevance?: string;
    is_selected?: boolean;
  }) => {
    try {
      const response = await researchApi.updateResult(resultId, updates);
      if (response.success && response.data) {
        setResults(prev => prev.map(result => 
          result.id === resultId ? response.data! : result
        ));
      } else {
        toast.error(response.error || 'Failed to update result');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update result');
    }
  };

  // Bulk update results
  const bulkUpdateResults = async (resultIds: string[], action: 'select' | 'unselect' | 'set_relevance', relevance?: string) => {
    try {
      const response = await researchApi.bulkUpdateResults({
        result_ids: resultIds,
        action,
        relevance
      });
      
      if (response.success && response.data) {
        toast.success(response.data.message);
        fetchResults(); // Refresh results
      } else {
        toast.error(response.error || 'Failed to update results');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update results');
    }
  };

  // Create dataset from selected results
  const createDataset = async (data: {
    query_ids: string[];
    dataset_name: string;
    dataset_description?: string;
    selected_only?: boolean;
    apply_column_mapping?: boolean;
  }) => {
    try {
      setLoading(true);
      const response = await researchApi.createDatasetFromResults(data);
      
      if (response.success && response.data) {
        toast.success(`Dataset "${response.data.dataset_name}" created with ${response.data.total_patents} patents`);
        return response.data;
      } else {
        toast.error(response.error || 'Failed to create dataset');
        return null;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create dataset');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  // Check API configuration status
  const checkAPIConfiguration = async (apiName: string) => {
    try {
      const response = await researchApi.checkAPIConfiguration(apiName);
      return response;
    } catch (err) {
      console.error('Failed to check API configuration:', err);
      return {
        success: false,
        error: 'Failed to check API configuration',
      };
    }
  };

  // Get query history for the project
  const getQueryHistory = async (params?: {
    limit?: number;
    offset?: number;
    api_source?: string;
  }) => {
    try {
      const response = await researchApi.getQueryHistory(projectId, params);
      return response;
    } catch (err) {
      console.error('Failed to fetch query history:', err);
      return {
        success: false,
        error: 'Failed to fetch query history',
      };
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchQueries();
      fetchAnalytics();
      fetchAvailableAPIs();
    }
  }, [projectId, fetchQueries, fetchAnalytics, fetchAvailableAPIs]);

  return {
    queries,
    results,
    analytics,
    availableAPIs,
    loading,
    error,
    
    // Actions
    createQuery,
    executeQuery,
    cancelQuery,
    updateResult,
    bulkUpdateResults,
    createDataset,
    
    // New enhanced functions
    checkAPIConfiguration,
    getQueryHistory,
    
    // Refresh functions
    refetchQueries: fetchQueries,
    refetchResults: fetchResults,
    refetchAnalytics: fetchAnalytics,
    refetchAvailableAPIs: fetchAvailableAPIs,
  };
}