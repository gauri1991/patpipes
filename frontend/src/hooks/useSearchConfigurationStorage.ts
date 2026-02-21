/**
 * useSearchConfiguration Hook
 * Manages search configuration persistence and templates
 */

import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';

export interface SearchConfiguration {
  id: string;
  name: string;
  description?: string;
  query: {
    keywords: string[];
    searchOperator: 'AND' | 'OR';
    classifications: string[];
    rawQuery?: string;
  };
  filters: {
    dateFrom?: string;
    dateTo?: string;
    jurisdictions?: string[];
    assignee?: string;
    status?: string[];
    minCitations?: number;
  };
  databases: string[];
  searchSettings: {
    maxResults?: number;
    timeout?: number;
    includeAbstracts?: boolean;
    includeClaims?: boolean;
  };
  metadata: {
    createdAt: string;
    updatedAt: string;
    lastUsed?: string;
    useCount: number;
    projectId: string;
    sessionId?: string;
    tags: string[];
  };
}

export function useSearchConfiguration(projectId: string, sessionId?: string) {
  const [configurations, setConfigurations] = useState<SearchConfiguration[]>([]);
  const [currentConfig, setCurrentConfig] = useState<SearchConfiguration | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load configurations on mount
  useEffect(() => {
    loadConfigurations();
  }, [projectId, sessionId]);

  const loadConfigurations = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // In real implementation, this would fetch from API
      const stored = localStorage.getItem(`search_configs_${projectId}`);
      const configs = stored ? JSON.parse(stored) : [];
      
      // Add some default configurations if none exist
      if (configs.length === 0) {
        const defaultConfigs = [
          createDefaultConfiguration('AI Patents', 'Artificial intelligence and machine learning patents', {
            keywords: ['artificial intelligence', 'machine learning', 'neural network'],
            searchOperator: 'OR' as const,
            classifications: ['G06N', 'G06F'],
          }),
          createDefaultConfiguration('Prior Art Search', 'Comprehensive prior art analysis', {
            keywords: [],
            searchOperator: 'AND' as const,
            classifications: [],
          })
        ];
        configs.push(...defaultConfigs);
        localStorage.setItem(`search_configs_${projectId}`, JSON.stringify(configs));
      }
      
      setConfigurations(configs);
    } catch (err) {
      setError('Failed to load search configurations');
      console.error('Error loading configurations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const createDefaultConfiguration = (
    name: string, 
    description: string, 
    query: Partial<SearchConfiguration['query']>
  ): SearchConfiguration => ({
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    name,
    description,
    query: {
      keywords: [],
      searchOperator: 'AND',
      classifications: [],
      ...query
    },
    filters: {},
    databases: ['USPTO', 'EPO'],
    searchSettings: {
      maxResults: 1000,
      timeout: 300,
      includeAbstracts: true,
      includeClaims: false
    },
    metadata: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      useCount: 0,
      projectId,
      sessionId,
      tags: []
    }
  });

  const saveConfiguration = useCallback(async (config: Omit<SearchConfiguration, 'id' | 'metadata'>) => {
    setIsLoading(true);
    setError(null);

    try {
      const newConfig: SearchConfiguration = {
        ...config,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          useCount: 0,
          projectId,
          sessionId,
          tags: []
        }
      };

      const updatedConfigs = [newConfig, ...configurations];
      setConfigurations(updatedConfigs);
      
      // Save to localStorage (in real implementation, would call API)
      localStorage.setItem(`search_configs_${projectId}`, JSON.stringify(updatedConfigs));
      
      toast.success(`Configuration "${config.name}" saved successfully`);
      return newConfig;
    } catch (err) {
      setError('Failed to save configuration');
      toast.error('Failed to save search configuration');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [configurations, projectId, sessionId]);

  const loadConfiguration = useCallback(async (id: string) => {
    const config = configurations.find(c => c.id === id);
    if (!config) {
      toast.error('Configuration not found');
      return null;
    }

    setCurrentConfig(config);
    toast.success(`Configuration "${config.name}" loaded`);
    return config;
  }, [configurations]);

  const deleteConfiguration = useCallback(async (id: string) => {
    const updatedConfigs = configurations.filter(config => config.id !== id);
    setConfigurations(updatedConfigs);
    localStorage.setItem(`search_configs_${projectId}`, JSON.stringify(updatedConfigs));
    
    if (currentConfig?.id === id) {
      setCurrentConfig(null);
    }
    
    toast.success('Configuration deleted successfully');
  }, [configurations, currentConfig, projectId]);

  return {
    // State
    configurations,
    currentConfig,
    isLoading,
    error,

    // Actions
    saveConfiguration,
    loadConfiguration,
    deleteConfiguration,
    
    // Current config management
    setCurrentConfig,
    clearCurrentConfig: () => setCurrentConfig(null),
    hasConfigurations: configurations.length > 0
  };
}