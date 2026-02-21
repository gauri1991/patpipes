/**
 * useSearchConfiguration Hook
 * Manages patent search database configurations and settings
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { 
  patentSearchApi, 
  SearchConfiguration, 
  DatabaseConfig 
} from '@/services/patentSearchApi';

interface SearchConfigurationState {
  configurations: SearchConfiguration[];
  activeConfiguration: SearchConfiguration | null;
  databases: DatabaseConfig[];
  isLoading: boolean;
  error: string | null;
}

interface DatabaseConnectionStatus {
  databaseId: string;
  status: 'connected' | 'failed' | 'testing' | 'unknown';
  responseTime?: number;
  lastTested?: string;
  error?: string;
}

export function useSearchConfiguration() {
  const [state, setState] = useState<SearchConfigurationState>({
    configurations: [],
    activeConfiguration: null,
    databases: [],
    isLoading: false,
    error: null
  });

  const [connectionStatuses, setConnectionStatuses] = useState<Record<string, DatabaseConnectionStatus>>({});

  // Load configurations on mount
  useEffect(() => {
    loadConfigurations();
    loadDatabases();
  }, []);

  const setLoading = (loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading }));
  };

  const setError = (error: string | null) => {
    setState(prev => ({ ...prev, error }));
  };

  // ===== CONFIGURATION MANAGEMENT =====

  const loadConfigurations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await patentSearchApi.getSearchConfigurations();
      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          configurations: response.data!
        }));

        // Set first configuration as active if none selected
        if (response.data.length > 0 && !state.activeConfiguration) {
          setState(prev => ({
            ...prev,
            activeConfiguration: response.data![0]
          }));
        }
      } else {
        setError(response.error || 'Failed to load search configurations');
        toast.error('Failed to load search configurations');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load configurations';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [state.activeConfiguration]);

  const createConfiguration = useCallback(async (configData: {
    name: string;
    description: string;
    databases: string[]; // database IDs
    default_filters: any;
    result_limit: number;
    timeout_minutes: number;
  }) => {
    try {
      setLoading(true);
      setError(null);

      // Map database IDs to full database configs
      const databaseConfigs = state.databases.filter(db => 
        configData.databases.includes(db.id)
      );

      const fullConfigData = {
        ...configData,
        databases: databaseConfigs,
        api_credentials: {} // Would be populated from secure storage
      };

      const response = await patentSearchApi.createSearchConfiguration(fullConfigData);
      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          configurations: [...prev.configurations, response.data!]
        }));
        toast.success('Search configuration created successfully');
        return response.data;
      } else {
        setError(response.error || 'Failed to create configuration');
        toast.error('Failed to create configuration');
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create configuration';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [state.databases]);

  const updateConfiguration = useCallback(async (
    configId: string, 
    updates: Partial<SearchConfiguration>
  ) => {
    try {
      setLoading(true);
      setError(null);

      const response = await patentSearchApi.updateSearchConfiguration(configId, updates);
      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          configurations: prev.configurations.map(config =>
            config.id === configId ? response.data! : config
          ),
          activeConfiguration: prev.activeConfiguration?.id === configId ? 
            response.data! : prev.activeConfiguration
        }));
        toast.success('Configuration updated successfully');
        return response.data;
      } else {
        setError(response.error || 'Failed to update configuration');
        toast.error('Failed to update configuration');
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update configuration';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteConfiguration = useCallback(async (configId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await patentSearchApi.deleteSearchConfiguration(configId);
      if (response.success) {
        setState(prev => ({
          ...prev,
          configurations: prev.configurations.filter(config => config.id !== configId),
          activeConfiguration: prev.activeConfiguration?.id === configId ? 
            (prev.configurations.find(c => c.id !== configId) || null) : prev.activeConfiguration
        }));
        toast.success('Configuration deleted successfully');
        return true;
      } else {
        setError(response.error || 'Failed to delete configuration');
        toast.error('Failed to delete configuration');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete configuration';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const setActiveConfiguration = useCallback((configId: string) => {
    const config = state.configurations.find(c => c.id === configId);
    if (config) {
      setState(prev => ({
        ...prev,
        activeConfiguration: config
      }));
      toast.success(`Switched to configuration: ${config.name}`);
    }
  }, [state.configurations]);

  // ===== DATABASE MANAGEMENT =====

  const loadDatabases = useCallback(async () => {
    try {
      const response = await patentSearchApi.getDatabases();
      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          databases: response.data!
        }));

        // Initialize connection statuses
        const statuses: Record<string, DatabaseConnectionStatus> = {};
        response.data.forEach(db => {
          statuses[db.id] = {
            databaseId: db.id,
            status: 'unknown'
          };
        });
        setConnectionStatuses(statuses);
      }
    } catch (err) {
      console.error('Failed to load databases:', err);
    }
  }, []);

  const testDatabaseConnection = useCallback(async (databaseId: string) => {
    try {
      setConnectionStatuses(prev => ({
        ...prev,
        [databaseId]: {
          ...prev[databaseId],
          status: 'testing'
        }
      }));

      const response = await patentSearchApi.testDatabaseConnection(databaseId);
      if (response.success && response.data) {
        setConnectionStatuses(prev => ({
          ...prev,
          [databaseId]: {
            databaseId,
            status: response.data!.status,
            responseTime: response.data!.response_time,
            lastTested: new Date().toISOString(),
            error: response.data!.error
          }
        }));

        if (response.data.status === 'connected') {
          toast.success(`Database connection successful (${response.data.response_time}ms)`);
        } else {
          toast.error(`Database connection failed: ${response.data.error}`);
        }

        return response.data;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Connection test failed';
      setConnectionStatuses(prev => ({
        ...prev,
        [databaseId]: {
          ...prev[databaseId],
          status: 'failed',
          error: errorMessage,
          lastTested: new Date().toISOString()
        }
      }));
      toast.error(`Connection test failed: ${errorMessage}`);
    }

    return null;
  }, []);

  const testAllDatabases = useCallback(async () => {
    const enabledDatabases = state.databases.filter(db => db.enabled);
    const results = await Promise.allSettled(
      enabledDatabases.map(db => testDatabaseConnection(db.id))
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const total = enabledDatabases.length;

    toast.success(`Database connectivity test complete: ${successful}/${total} databases connected`);
    return { successful, total };
  }, [state.databases, testDatabaseConnection]);

  // ===== CONFIGURATION UTILITIES =====

  const getDefaultConfiguration = useCallback(() => {
    return state.configurations.find(config => config.name.toLowerCase().includes('default')) ||
           state.configurations[0] ||
           null;
  }, [state.configurations]);

  const getConfigurationByType = useCallback((searchType: string) => {
    // Find configuration optimized for specific search types
    const typeMapping: Record<string, string> = {
      'fto': 'freedom-to-operate',
      'prior_art': 'prior-art',
      'competitive': 'competitive-intelligence',
      'landscape': 'technology-landscape'
    };

    const configName = typeMapping[searchType];
    if (configName) {
      return state.configurations.find(config => 
        config.name.toLowerCase().includes(configName)
      );
    }

    return getDefaultConfiguration();
  }, [state.configurations, getDefaultConfiguration]);

  const validateConfiguration = useCallback((config: SearchConfiguration) => {
    const errors: string[] = [];

    if (!config.name?.trim()) {
      errors.push('Configuration name is required');
    }

    if (!config.databases || config.databases.length === 0) {
      errors.push('At least one database must be selected');
    }

    if (config.result_limit && (config.result_limit < 1 || config.result_limit > 10000)) {
      errors.push('Result limit must be between 1 and 10,000');
    }

    if (config.timeout_minutes && (config.timeout_minutes < 1 || config.timeout_minutes > 60)) {
      errors.push('Timeout must be between 1 and 60 minutes');
    }

    // Check for enabled databases
    const enabledDatabases = config.databases.filter(db => db.enabled);
    if (enabledDatabases.length === 0) {
      errors.push('At least one database must be enabled');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }, []);

  const getConfigurationStatistics = useCallback(() => {
    const totalConfigurations = state.configurations.length;
    const enabledDatabases = state.databases.filter(db => db.enabled);
    const connectedDatabases = Object.values(connectionStatuses).filter(
      status => status.status === 'connected'
    ).length;

    const databaseTypes = state.databases.reduce((acc, db) => {
      acc[db.type] = (acc[db.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalConfigurations,
      totalDatabases: state.databases.length,
      enabledDatabases: enabledDatabases.length,
      connectedDatabases,
      databaseTypes,
      activeConfigurationName: state.activeConfiguration?.name || 'None'
    };
  }, [state.configurations, state.databases, state.activeConfiguration, connectionStatuses]);

  // ===== CONFIGURATION TEMPLATES =====

  const createConfigurationFromTemplate = useCallback(async (templateType: 'basic' | 'comprehensive' | 'fto' | 'competitive') => {
    const templates = {
      basic: {
        name: 'Basic Search Configuration',
        description: 'Simple configuration for general patent searches',
        databases: state.databases.filter(db => ['uspto', 'epo'].includes(db.type)).map(db => db.id),
        result_limit: 1000,
        timeout_minutes: 10,
        default_filters: {
          jurisdictions: ['US', 'EP'],
          status: ['active'],
          patent_types: ['utility'],
          language: ['en']
        }
      },
      comprehensive: {
        name: 'Comprehensive Search Configuration',
        description: 'Full-featured configuration for thorough patent analysis',
        databases: state.databases.filter(db => db.enabled).map(db => db.id),
        result_limit: 5000,
        timeout_minutes: 30,
        default_filters: {
          jurisdictions: ['US', 'EP', 'WO', 'JP', 'CN'],
          status: ['active', 'pending'],
          patent_types: ['utility', 'design'],
          language: ['en', 'de', 'fr', 'ja']
        }
      },
      fto: {
        name: 'Freedom-to-Operate Configuration',
        description: 'Optimized for FTO analysis with active patents focus',
        databases: state.databases.filter(db => ['uspto', 'epo', 'wipo'].includes(db.type)).map(db => db.id),
        result_limit: 2000,
        timeout_minutes: 20,
        default_filters: {
          jurisdictions: ['US', 'EP', 'WO'],
          status: ['active'],
          patent_types: ['utility'],
          language: ['en']
        }
      },
      competitive: {
        name: 'Competitive Intelligence Configuration',
        description: 'Configured for competitor patent portfolio analysis',
        databases: state.databases.map(db => db.id),
        result_limit: 3000,
        timeout_minutes: 25,
        default_filters: {
          jurisdictions: ['US', 'EP', 'WO', 'JP', 'CN'],
          status: ['active', 'pending', 'expired'],
          patent_types: ['utility', 'design'],
          language: ['en', 'de', 'fr', 'ja', 'zh']
        }
      }
    };

    const template = templates[templateType];
    return await createConfiguration(template);
  }, [state.databases, createConfiguration]);

  return {
    // State
    configurations: state.configurations,
    activeConfiguration: state.activeConfiguration,
    databases: state.databases,
    connectionStatuses,
    isLoading: state.isLoading,
    error: state.error,

    // Configuration Management
    loadConfigurations,
    createConfiguration,
    updateConfiguration,
    deleteConfiguration,
    setActiveConfiguration,

    // Database Management
    loadDatabases,
    testDatabaseConnection,
    testAllDatabases,

    // Utilities
    getDefaultConfiguration,
    getConfigurationByType,
    validateConfiguration,
    getConfigurationStatistics,
    createConfigurationFromTemplate
  };
}