/**
 * Prior Art Types
 * Core type definitions for prior art search and analysis
 */

export enum PriorArtProjectType {
  FTO = 'freedom_to_operate',
  NOVELTY = 'novelty_search', 
  INVALIDITY = 'invalidity_search',
  LANDSCAPE = 'landscape_analysis',
  STATE_OF_ART = 'state_of_art',
  CUSTOM = 'custom_search'
}

export enum PriorArtProjectStatus {
  DRAFT = 'draft',
  PLANNING = 'planning',
  ACTIVE = 'active',
  ANALYSIS = 'analysis',
  REVIEW = 'review',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed',
  ARCHIVED = 'archived'
}

export interface PriorArtProject {
  id: string;
  name: string;
  description: string;
  type: PriorArtProjectType;
  status: PriorArtProjectStatus;
  analytics_project_id?: string;
  
  // Target information (for invalidity/FTO)
  target_patent?: {
    patent_number: string;
    title: string;
    claims?: string[];
    jurisdiction: string;
  };
  
  // Metrics
  total_queries: number;
  total_results: number;
  analyzed_results: number;
  selected_results: number;
  progress_percentage?: number;
  strong_evidence?: number;
  search_sessions?: number;
  
  // Project management
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  deadline?: string;
  
  // Search scope
  jurisdictions?: string[];
  time_range_start?: string;
  time_range_end?: string;
  classifications?: string[];
  
  // Dates
  created_at: string;
  updated_at: string;
  completed_at?: string;
  
  // User info
  created_by: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  
  // Team collaboration
  team_members?: {
    id: string;
    name?: string;
    first_name?: string;
    last_name?: string;
    role: 'owner' | 'editor' | 'viewer' | 'Lead Researcher' | 'Patent Analyst' | string;
  }[];
  
  // Analysis sessions
  analysis_sessions?: {
    id: string;
    name: string;
    created_at: string;
    results_count: number;
  }[];
  
  // Generated reports
  reports?: {
    id: string;
    type: string;
    created_at: string;
    file_url?: string;
  }[];
}

export interface CreatePriorArtProjectData {
  name: string;
  description?: string;
  type: PriorArtProjectType;
  status?: PriorArtProjectStatus;
  target_patent?: {
    patent_number: string;
    title?: string;
    claims?: string[];
    jurisdiction?: string;
  };
}

export interface PriorArtQuery {
  id: string;
  prior_art_project: string;
  query_name: string;
  description?: string;
  search_purpose: string;
  
  // Search parameters (extending ResearchQuery)
  api_source: string;
  keywords: string;
  ipc_classes: string[];
  cpc_classes: string[];
  assignees: string[];
  inventors: string[];
  date_range: {
    from_date?: string;
    to_date?: string;
  };
  geographic_scope: string[];
  
  // Prior art specific
  target_claims?: string[];
  relevance_threshold?: number;
  
  // Status
  status: 'draft' | 'running' | 'completed' | 'failed';
  total_results: number;
  processed_results: number;
  
  created_at: string;
  updated_at: string;
}

export interface PriorArtAnalysisSession {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  
  // Selected documents for analysis
  selected_results: string[];
  
  // Analysis outputs
  comparison_data?: any;
  claim_mappings?: any;
  relevance_scores?: Record<string, number>;
  
  // Annotations and notes
  annotations?: {
    result_id: string;
    text: string;
    created_by: string;
    created_at: string;
  }[];
  
  created_at: string;
  updated_at: string;
}

// Project type configurations
export const PROJECT_TYPE_CONFIG = {
  [PriorArtProjectType.FTO]: {
    label: 'Freedom to Operate',
    description: 'Assess if you can commercialize without infringing existing patents',
    icon: 'Shield',
    color: 'blue',
    defaultSearchTemplate: {
      keywords: '',
      date_range: { from_date: '', to_date: '' },
      geographic_scope: ['US', 'EP', 'CN']
    }
  },
  [PriorArtProjectType.NOVELTY]: {
    label: 'Novelty Search',
    description: 'Determine if an invention is new and non-obvious',
    icon: 'Lightbulb',
    color: 'green',
    defaultSearchTemplate: {
      keywords: '',
      date_range: { from_date: '', to_date: '' }
    }
  },
  [PriorArtProjectType.INVALIDITY]: {
    label: 'Invalidity Search',
    description: 'Find prior art to challenge patent validity',
    icon: 'Gavel',
    color: 'red',
    defaultSearchTemplate: {
      keywords: '',
      requiresTargetPatent: true
    }
  },
  [PriorArtProjectType.LANDSCAPE]: {
    label: 'Landscape Analysis',
    description: 'Map the patent landscape in a technology area',
    icon: 'Map',
    color: 'purple',
    defaultSearchTemplate: {
      keywords: '',
      includeNonPatent: true
    }
  },
  [PriorArtProjectType.STATE_OF_ART]: {
    label: 'State of the Art',
    description: 'Comprehensive search of existing technology',
    icon: 'BookOpen',
    color: 'orange',
    defaultSearchTemplate: {
      keywords: '',
      includeNonPatent: true,
      includeAcademic: true
    }
  },
  [PriorArtProjectType.CUSTOM]: {
    label: 'Custom Search',
    description: 'Define your own search criteria and objectives',
    icon: 'Settings',
    color: 'gray',
    defaultSearchTemplate: {}
  }
};