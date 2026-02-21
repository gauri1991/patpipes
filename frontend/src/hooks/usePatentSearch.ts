/**
 * usePatentSearch Hook
 * Manages patent search execution and results
 */

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { patentSearchApi, SearchQuery, SearchExecution, PatentRecord } from '@/services/patentSearchApi';

interface SearchState {
  isSearching: boolean;
  currentExecution: SearchExecution | null;
  results: PatentRecord[];
  totalResults: number;
  currentPage: number;
  error: string | null;
}

export function usePatentSearch() {
  const [searchState, setSearchState] = useState<SearchState>({
    isSearching: false,
    currentExecution: null,
    results: [],
    totalResults: 0,
    currentPage: 1,
    error: null
  });

  const executeSearch = useCallback(async (query: SearchQuery) => {
    try {
      setSearchState(prev => ({ 
        ...prev, 
        isSearching: true, 
        error: null,
        results: [],
        totalResults: 0
      }));

      // Start search execution
      const executionResponse = await patentSearchApi.executeSearch(query);
      
      if (executionResponse.success && executionResponse.data) {
        const execution = executionResponse.data;
        
        setSearchState(prev => ({ 
          ...prev, 
          currentExecution: execution 
        }));

        // Poll for results if search is running
        if (execution.status === 'running' || execution.status === 'pending') {
          pollSearchStatus(execution.id);
        } else if (execution.status === 'completed') {
          loadSearchResults(execution.id);
        }
        
        toast.success('Search started successfully');
        return execution;
      } else {
        throw new Error(executionResponse.error || 'Failed to start search');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Search execution failed';
      setSearchState(prev => ({ 
        ...prev, 
        isSearching: false, 
        error: errorMessage 
      }));
      toast.error(errorMessage);
      return null;
    }
  }, []);

  const pollSearchStatus = useCallback(async (executionId: string) => {
    const maxAttempts = 30; // 5 minutes max
    let attempts = 0;

    const poll = async () => {
      try {
        attempts++;
        const response = await patentSearchApi.getSearchExecution(executionId);
        
        if (response.success && response.data) {
          const execution = response.data;
          
          setSearchState(prev => ({ 
            ...prev, 
            currentExecution: execution 
          }));

          if (execution.status === 'completed') {
            setSearchState(prev => ({ 
              ...prev, 
              isSearching: false 
            }));
            await loadSearchResults(executionId);
            toast.success(`Search completed! Found ${execution.total_results} results`);
          } else if (execution.status === 'failed') {
            setSearchState(prev => ({ 
              ...prev, 
              isSearching: false,
              error: execution.error_message || 'Search failed'
            }));
            toast.error('Search failed');
          } else if (attempts < maxAttempts) {
            // Continue polling
            setTimeout(poll, 10000); // Poll every 10 seconds
          } else {
            // Timeout
            setSearchState(prev => ({ 
              ...prev, 
              isSearching: false,
              error: 'Search timeout'
            }));
            toast.error('Search timed out');
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
        if (attempts < maxAttempts) {
          setTimeout(poll, 10000);
        }
      }
    };

    poll();
  }, []);

  const loadSearchResults = useCallback(async (executionId: string, page: number = 1) => {
    try {
      const response = await patentSearchApi.getSearchResults(executionId, { 
        page, 
        limit: 20 
      });
      
      if (response.success && response.data) {
        setSearchState(prev => ({ 
          ...prev, 
          results: response.data!.results,
          totalResults: response.data!.total,
          currentPage: response.data!.page,
          isSearching: false
        }));
      }
    } catch (error) {
      console.error('Failed to load results:', error);
      toast.error('Failed to load search results');
    }
  }, []);

  const cancelSearch = useCallback(async () => {
    if (searchState.currentExecution?.id) {
      try {
        await patentSearchApi.cancelSearchExecution(searchState.currentExecution.id);
        setSearchState(prev => ({ 
          ...prev, 
          isSearching: false,
          currentExecution: null
        }));
        toast.success('Search cancelled');
      } catch (error) {
        toast.error('Failed to cancel search');
      }
    }
  }, [searchState.currentExecution?.id]);

  return {
    // State
    searchState,
    
    // Actions
    executeSearch,
    loadSearchResults,
    cancelSearch,
    
    // Utilities
    isSearching: searchState.isSearching,
    hasResults: searchState.results.length > 0,
    executionId: searchState.currentExecution?.id
  };
}