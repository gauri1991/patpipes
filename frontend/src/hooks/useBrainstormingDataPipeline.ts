/**
 * useBrainstormingDataPipeline Hook
 * Manages the data flow between patent search and brainstorming sessions
 */

import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';

interface PipelineData {
  patents: any[];
  insights: any[];
  citations: any[];
  searchContext: {
    query: string;
    filters: any;
    executionId: string;
    timestamp: string;
  };
  brainstormingContext: {
    sessionId: string;
    projectId: string;
    keywords: string[];
    strategies: string[];
  };
}

interface DataPipelineState {
  isProcessing: boolean;
  lastSync: string | null;
  pendingUpdates: number;
  syncStatus: 'idle' | 'syncing' | 'error' | 'completed';
  error: string | null;
}

export function useBrainstormingDataPipeline(sessionId: string, projectId: string) {
  const [pipelineData, setPipelineData] = useState<PipelineData | null>(null);
  const [pipelineState, setPipelineState] = useState<DataPipelineState>({
    isProcessing: false,
    lastSync: null,
    pendingUpdates: 0,
    syncStatus: 'idle',
    error: null
  });

  // Initialize pipeline data
  useEffect(() => {
    if (sessionId && projectId) {
      initializePipeline();
    }
  }, [sessionId, projectId]);

  const initializePipeline = async () => {
    try {
      setPipelineState(prev => ({ ...prev, isProcessing: true, syncStatus: 'syncing' }));
      
      // Load existing pipeline data from storage or API
      const existingData = await loadPipelineData(sessionId, projectId);
      setPipelineData(existingData);
      
      setPipelineState(prev => ({
        ...prev,
        isProcessing: false,
        syncStatus: 'completed',
        lastSync: new Date().toISOString()
      }));
    } catch (error) {
      setPipelineState(prev => ({
        ...prev,
        isProcessing: false,
        syncStatus: 'error',
        error: error instanceof Error ? error.message : 'Failed to initialize pipeline'
      }));
    }
  };

  const loadPipelineData = async (sessionId: string, projectId: string): Promise<PipelineData> => {
    // Mock data loading - in real implementation, this would call the API
    return {
      patents: [],
      insights: [],
      citations: [],
      searchContext: {
        query: '',
        filters: {},
        executionId: '',
        timestamp: new Date().toISOString()
      },
      brainstormingContext: {
        sessionId,
        projectId,
        keywords: [],
        strategies: []
      }
    };
  };

  const addPatentsToPipeline = useCallback(async (patents: any[], searchContext: any) => {
    try {
      setPipelineState(prev => ({ ...prev, pendingUpdates: prev.pendingUpdates + 1 }));
      
      setPipelineData(prev => prev ? {
        ...prev,
        patents: [...prev.patents, ...patents],
        searchContext: {
          ...searchContext,
          timestamp: new Date().toISOString()
        }
      } : null);
      
      // Sync to backend
      await syncPipelineData({
        type: 'patents_added',
        data: patents,
        context: searchContext
      });
      
      setPipelineState(prev => ({
        ...prev,
        pendingUpdates: Math.max(0, prev.pendingUpdates - 1),
        lastSync: new Date().toISOString()
      }));
      
      toast.success(`${patents.length} patents added to brainstorming pipeline`);
    } catch (error) {
      setPipelineState(prev => ({
        ...prev,
        pendingUpdates: Math.max(0, prev.pendingUpdates - 1),
        error: error instanceof Error ? error.message : 'Failed to add patents'
      }));
      toast.error('Failed to add patents to pipeline');
    }
  }, []);

  const addInsightsToPipeline = useCallback(async (insights: any[]) => {
    try {
      setPipelineState(prev => ({ ...prev, pendingUpdates: prev.pendingUpdates + 1 }));
      
      setPipelineData(prev => prev ? {
        ...prev,
        insights: [...prev.insights, ...insights]
      } : null);
      
      await syncPipelineData({
        type: 'insights_added',
        data: insights
      });
      
      setPipelineState(prev => ({
        ...prev,
        pendingUpdates: Math.max(0, prev.pendingUpdates - 1),
        lastSync: new Date().toISOString()
      }));
      
      toast.success(`${insights.length} insights added to brainstorming session`);
    } catch (error) {
      setPipelineState(prev => ({
        ...prev,
        pendingUpdates: Math.max(0, prev.pendingUpdates - 1),
        error: error instanceof Error ? error.message : 'Failed to add insights'
      }));
      toast.error('Failed to add insights to pipeline');
    }
  }, []);

  const addCitationsToPipeline = useCallback(async (citations: any[]) => {
    try {
      setPipelineState(prev => ({ ...prev, pendingUpdates: prev.pendingUpdates + 1 }));
      
      setPipelineData(prev => prev ? {
        ...prev,
        citations: [...prev.citations, ...citations]
      } : null);
      
      await syncPipelineData({
        type: 'citations_added',
        data: citations
      });
      
      setPipelineState(prev => ({
        ...prev,
        pendingUpdates: Math.max(0, prev.pendingUpdates - 1),
        lastSync: new Date().toISOString()
      }));
      
      toast.success(`${citations.length} citations added to brainstorming session`);
    } catch (error) {
      setPipelineState(prev => ({
        ...prev,
        pendingUpdates: Math.max(0, prev.pendingUpdates - 1),
        error: error instanceof Error ? error.message : 'Failed to add citations'
      }));
      toast.error('Failed to add citations to pipeline');
    }
  }, []);

  const updateBrainstormingContext = useCallback(async (context: Partial<PipelineData['brainstormingContext']>) => {
    try {
      setPipelineData(prev => prev ? {
        ...prev,
        brainstormingContext: {
          ...prev.brainstormingContext,
          ...context
        }
      } : null);
      
      await syncPipelineData({
        type: 'context_updated',
        data: context
      });
      
      setPipelineState(prev => ({
        ...prev,
        lastSync: new Date().toISOString()
      }));
    } catch (error) {
      setPipelineState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to update context'
      }));
      toast.error('Failed to update brainstorming context');
    }
  }, []);

  const syncPipelineData = async (update: any) => {
    // Mock API call - in real implementation, this would sync to backend
    console.log('Syncing pipeline data:', update);
    await new Promise(resolve => setTimeout(resolve, 500));
  };

  const exportPipelineData = useCallback(() => {
    if (!pipelineData) return null;
    
    const exportData = {
      ...pipelineData,
      exportTimestamp: new Date().toISOString(),
      statistics: {
        totalPatents: pipelineData.patents.length,
        totalInsights: pipelineData.insights.length,
        totalCitations: pipelineData.citations.length
      }
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `brainstorming-pipeline-${sessionId}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Pipeline data exported successfully');
    return exportData;
  }, [pipelineData, sessionId]);

  const clearPipeline = useCallback(async () => {
    try {
      setPipelineState(prev => ({ ...prev, isProcessing: true }));
      
      await syncPipelineData({
        type: 'pipeline_cleared'
      });
      
      setPipelineData({
        patents: [],
        insights: [],
        citations: [],
        searchContext: {
          query: '',
          filters: {},
          executionId: '',
          timestamp: new Date().toISOString()
        },
        brainstormingContext: {
          sessionId,
          projectId,
          keywords: [],
          strategies: []
        }
      });
      
      setPipelineState(prev => ({
        ...prev,
        isProcessing: false,
        pendingUpdates: 0,
        lastSync: new Date().toISOString()
      }));
      
      toast.success('Pipeline cleared successfully');
    } catch (error) {
      setPipelineState(prev => ({
        ...prev,
        isProcessing: false,
        error: error instanceof Error ? error.message : 'Failed to clear pipeline'
      }));
      toast.error('Failed to clear pipeline');
    }
  }, [sessionId, projectId]);

  const getPipelineStatistics = useCallback(() => {
    if (!pipelineData) return null;
    
    return {
      totalPatents: pipelineData.patents.length,
      totalInsights: pipelineData.insights.length,
      totalCitations: pipelineData.citations.length,
      lastSearchQuery: pipelineData.searchContext.query,
      lastSearchTime: pipelineData.searchContext.timestamp,
      brainstormingKeywords: pipelineData.brainstormingContext.keywords.length,
      syncStatus: pipelineState.syncStatus,
      pendingUpdates: pipelineState.pendingUpdates
    };
  }, [pipelineData, pipelineState]);

  return {
    // Data
    pipelineData,
    pipelineState,
    
    // Actions
    addPatentsToPipeline,
    addInsightsToPipeline,
    addCitationsToPipeline,
    updateBrainstormingContext,
    exportPipelineData,
    clearPipeline,
    
    // Utilities
    getPipelineStatistics,
    isReady: !!pipelineData,
    hasData: !!pipelineData && (
      pipelineData.patents.length > 0 ||
      pipelineData.insights.length > 0 ||
      pipelineData.citations.length > 0
    )
  };
}