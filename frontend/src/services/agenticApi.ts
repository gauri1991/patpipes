/**
 * API Service for Agentic Patent Discovery System
 */

import { apiClient } from './apiClient';

const BASE_URL = '/analytics/api/agentic';

export interface AgentConfig {
  id?: string;
  name: string;
  description?: string;
  agent_type: string;
  input_source: 'claims' | 'abstract' | 'description' | 'claims_abstract' | 'all';
  processing_profile: 'quick' | 'standard' | 'deep' | 'legal' | 'technical' | 'custom';
  config_params: Record<string, any>;
  confidence_threshold: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface DatasetInfo {
  id: string;
  name: string;
  description?: string;
  total_patents: number;
  created_at: string;
  has_been_processed?: boolean;
  last_processed?: string;
  processing_status?: string;
}

export interface Pipeline {
  id: string;
  dataset: string;
  dataset_name: string;
  agent_config?: string;
  config_name?: string;
  current_stage: string;
  stage_status: Record<string, any>;
  total_patents: number;
  processed_patents: number;
  failed_patents: number;
  total_entities: number;
  total_triplets: number;
  unique_relationships: number;
  progress_percentage: number;
  start_time?: string;
  end_time?: string;
  error_log: any[];
  created_at: string;
  updated_at: string;
}

export interface PatentEntity {
  id: string;
  patent_id: string;
  entity_text: string;
  entity_type: string;
  normalized_form?: string;
  source_field: string;
  confidence_score: number;
  extraction_method: string;
  attributes?: Record<string, any>;
}

export interface PatentTriplet {
  id: string;
  patent_id: string;
  subject_text: string;
  subject_type: string;
  predicate: string;
  object_text: string;
  object_type: string;
  source_sentence: string;
  confidence_score: number;
  triplet_display: string;
}

export interface PipelineResults {
  pipeline: Pipeline;
  statistics: {
    total_entities: number;
    unique_entities: number;
    total_triplets: number;
    unique_relationships: number;
    clusters_found: number;
  };
  top_entities: Array<{
    entity_text: string;
    entity_type: string;
    count: number;
  }>;
  top_relationships: Array<{
    predicate: string;
    count: number;
  }>;
  clusters: any[];
}

class AgenticApiService {
  // Agent Configuration APIs
  async getAgentConfigs(params?: {
    is_active?: boolean;
    agent_type?: string;
    processing_profile?: string;
  }) {
    const response = await apiClient.get(`${BASE_URL}/agent-configs/`, { params });
    if (!response.success) {
      throw new Error(response.error || 'Failed to get agent configs');
    }
    return response.data;
  }

  async getAgentConfig(id: string) {
    const response = await apiClient.get(`${BASE_URL}/agent-configs/${id}/`);
    if (!response.success) {
      throw new Error(response.error || 'Failed to get agent config');
    }
    return response.data;
  }

  async createAgentConfig(config: AgentConfig) {
    const response = await apiClient.post(`${BASE_URL}/agent-configs/`, config);
    if (!response.success) {
      throw new Error(response.error || 'Failed to create agent config');
    }
    return response.data;
  }

  async updateAgentConfig(id: string, config: Partial<AgentConfig>) {
    const response = await apiClient.patch(`${BASE_URL}/agent-configs/${id}/`, config);
    if (!response.success) {
      throw new Error(response.error || 'Failed to update agent config');
    }
    return response.data;
  }

  async getConfigPresets() {
    const response = await apiClient.get(`${BASE_URL}/agent-configs/presets/`);
    if (!response.success) {
      throw new Error(response.error || 'Failed to get config presets');
    }
    return response.data;
  }

  // Dataset Management APIs
  async getAvailableDatasets(projectId?: string) {
    const params = projectId ? { project_id: projectId } : {};
    const response = await apiClient.get(`${BASE_URL}/classifier-datasets/available/`, { params });
    if (!response.success) {
      throw new Error(response.error || 'Failed to get available datasets');
    }
    return response.data as DatasetInfo[];
  }

  async selectDatasets(datasetIds: string[], merge: boolean = false) {
    const response = await apiClient.post(`${BASE_URL}/classifier-datasets/select/`, {
      dataset_ids: datasetIds,
      merge_datasets: merge
    });
    if (!response.success) {
      throw new Error(response.error || 'Failed to select datasets');
    }
    return response.data;
  }

  // Pipeline Management APIs
  async getPipelines(params?: {
    dataset_id?: string;
    stage?: string;
    my_pipelines?: boolean;
  }) {
    const response = await apiClient.get(`${BASE_URL}/pipelines/`, { params });
    if (!response.success) {
      throw new Error(response.error || 'Failed to get pipelines');
    }
    return response.data as Pipeline[];
  }

  async getPipeline(id: string) {
    const response = await apiClient.get(`${BASE_URL}/pipelines/${id}/`);
    if (!response.success) {
      throw new Error(response.error || 'Failed to get pipeline');
    }
    return response.data as Pipeline;
  }

  async startPipeline(params: {
    dataset_ids: string[];
    agent_config_id?: string;
    processing_profile?: string;
    input_source?: string;
  }) {
    const response = await apiClient.post(`${BASE_URL}/pipelines/start/`, params);
    if (!response.success) {
      throw new Error(response.error || 'Failed to start pipeline');
    }
    return response.data as Pipeline[];
  }

  async cancelPipeline(id: string) {
    const response = await apiClient.post(`${BASE_URL}/pipelines/${id}/cancel/`);
    return response.data;
  }

  async getPipelineResults(id: string) {
    const response = await apiClient.get(`${BASE_URL}/pipelines/${id}/results/`);
    if (!response.success) {
      throw new Error(response.error || 'Failed to get pipeline results');
    }
    return response.data as PipelineResults;
  }

  // Entity Extraction APIs
  async getEntities(params?: {
    patent_id?: string;
    entity_type?: string;
    min_confidence?: number;
    search?: string;
  }) {
    const response = await apiClient.get(`${BASE_URL}/entities/`, { params });
    return response.data as PatentEntity[];
  }

  async getEntityStatistics(datasetId?: string) {
    const params = datasetId ? { dataset_id: datasetId } : {};
    const response = await apiClient.get(`${BASE_URL}/entities/statistics/`, { params });
    return response.data;
  }

  // Triplet APIs
  async getTriplets(params?: {
    patent_id?: string;
    predicate?: string;
    min_confidence?: number;
    entity_search?: string;
  }) {
    const response = await apiClient.get(`${BASE_URL}/triplets/`, { params });
    if (!response.success) {
      throw new Error(response.error || 'Failed to get triplets');
    }
    return response.data as PatentTriplet[];
  }

  async searchTriplets(params: {
    patent_id?: string;
    entity_text?: string;
    predicate?: string;
    min_confidence?: number;
    limit?: number;
  }) {
    const response = await apiClient.post(`${BASE_URL}/triplets/search/`, params);
    return response.data;
  }

  async getTripletGraphData(datasetId?: string) {
    const params = datasetId ? { dataset_id: datasetId } : {};
    const response = await apiClient.get(`${BASE_URL}/triplets/graph_data/`, { params });
    return response.data;
  }

  // Cluster APIs
  async getClusters(pipelineId?: string, clusterType?: string) {
    const params: any = {};
    if (pipelineId) params.pipeline_id = pipelineId;
    if (clusterType) params.cluster_type = clusterType;
    
    const response = await apiClient.get(`${BASE_URL}/clusters/`, { params });
    return response.data;
  }

  // Export APIs
  async exportResults(pipelineId: string, format: 'csv' | 'json' | 'excel' = 'json') {
    const response = await fetch(
      `/api/v1${BASE_URL}/pipelines/${pipelineId}/export/?format=${format}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`);
    }

    // Create download
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pipeline_${pipelineId}_results.${format === 'excel' ? 'xlsx' : format}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    return { success: true };
  }
}

export const agenticApi = new AgenticApiService();