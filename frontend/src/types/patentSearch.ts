/**
 * Patent Search Types & Interfaces
 * Comprehensive type definitions for patent search functionality
 */

// Import types for local use
import type {
  PatentRecord,
  SearchQuery,
  SearchExecution,
  SearchFilters,
  SearchConfiguration,
  DatabaseConfig,
  SearchAnalytics
} from '@/services/patentSearchApi';

// Re-export API types
export type {
  PatentRecord,
  SearchQuery,
  SearchExecution,
  SearchFilters,
  SearchConfiguration,
  DatabaseConfig,
  SearchAnalytics
} from '@/services/patentSearchApi';

// ===== UI COMPONENT TYPES =====

export interface SearchResultsViewProps {
  executionId: string;
  projectId: string;
  sessionId?: string;
  onPatentSelect?: (patent: PatentRecord) => void;
  onExportResults?: () => void;
}

export interface PatentCardProps {
  patent: PatentRecord;
  isSelected?: boolean;
  showRelevanceScore?: boolean;
  onSelect?: (patent: PatentRecord) => void;
  onViewDetails?: (patentId: string) => void;
  onAddToCollection?: (patentId: string) => void;
  compact?: boolean;
}

export interface SearchFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  availableOptions: {
    jurisdictions: string[];
    assignees: string[];
    inventors: string[];
    classifications: string[];
    statuses: string[];
    patentTypes: string[];
    languages: string[];
  };
  totalResults?: number;
  onApplyFilters?: () => void;
  onClearFilters?: () => void;
}

export interface QueryBuilderProps {
  projectId: string;
  sessionId?: string;
  initialData?: {
    keywords?: string[];
    classifications?: string[];
    strategies?: any[];
    competitors?: string[];
  };
  onQueryGenerated?: (query: SearchQuery) => void;
  onExecuteSearch?: (query: SearchQuery) => void;
}

// ===== SEARCH STATE MANAGEMENT =====

export interface SearchState {
  // Current search
  activeExecution: SearchExecution | null;
  searchResults: PatentRecord[];
  totalResults: number;
  currentPage: number;
  resultsPerPage: number;
  
  // UI state
  isLoading: boolean;
  isLoadingResults: boolean;
  error: string | null;
  selectedPatents: Set<string>;
  viewMode: 'grid' | 'table' | 'list';
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  
  // Filters & Query
  currentQuery: SearchQuery | null;
  appliedFilters: SearchFilters;
  savedQueries: SearchQuery[];
  searchHistory: SearchExecution[];
  
  // Configuration
  activeConfiguration: SearchConfiguration | null;
  availableDatabases: DatabaseConfig[];
  searchCapabilities: string[];
}

export interface SearchActions {
  // Search execution
  executeSearch: (query: SearchQuery) => Promise<void>;
  cancelSearch: () => Promise<void>;
  loadMoreResults: () => Promise<void>;
  refreshResults: () => Promise<void>;
  
  // Results management
  selectPatent: (patentId: string) => void;
  selectAllPatents: () => void;
  clearSelection: () => void;
  setViewMode: (mode: 'grid' | 'table' | 'list') => void;
  setSorting: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  
  // Filters & Query
  updateFilters: (filters: Partial<SearchFilters>) => void;
  applyFilters: () => Promise<void>;
  clearFilters: () => void;
  saveQuery: (name: string, description?: string) => Promise<void>;
  loadQuery: (queryId: string) => Promise<void>;
  deleteQuery: (queryId: string) => Promise<void>;
  
  // Configuration
  setConfiguration: (configId: string) => Promise<void>;
  updateConfiguration: (config: Partial<SearchConfiguration>) => Promise<void>;
  
  // Export & Analytics
  exportResults: (format: string, options?: any) => Promise<void>;
  getAnalytics: () => Promise<SearchAnalytics>;
}

// ===== QUERY BUILDING TYPES =====

export interface KeywordGroup {
  id: string;
  name: string;
  keywords: string[];
  operator: 'AND' | 'OR';
  field?: 'title' | 'abstract' | 'claims' | 'full_text';
  weight?: number;
}

export interface ClassificationGroup {
  id: string;
  name: string;
  classifications: string[];
  type: 'ipc' | 'cpc' | 'uspc';
  include_subclasses: boolean;
  weight?: number;
}

export interface QueryComponent {
  type: 'keywords' | 'classifications' | 'assignees' | 'inventors' | 'dates' | 'custom';
  data: any;
  operator: 'AND' | 'OR' | 'NOT';
  required: boolean;
  weight?: number;
}

export interface BooleanQueryBuilder {
  components: QueryComponent[];
  logic: string;
  preview: string;
  valid: boolean;
  errors: string[];
}

// ===== PATENT ANALYSIS TYPES =====

export interface PatentAnalysis {
  patent_id: string;
  relevance_analysis: {
    score: number;
    factors: {
      title_match: number;
      abstract_match: number;
      claims_match: number;
      classification_match: number;
      keyword_match: number;
    };
    explanation: string[];
  };
  competitive_analysis?: {
    assignee_threat_level: number;
    portfolio_strength: number;
    citation_impact: number;
    market_relevance: number;
  };
  freedom_to_operate?: {
    risk_level: 'low' | 'medium' | 'high';
    blocking_claims: string[];
    workaround_potential: number;
    expiry_analysis: {
      expires_at: string;
      years_remaining: number;
    };
  };
  citation_analysis?: {
    forward_citations: PatentCitation[];
    backward_citations: PatentCitation[];
    citation_network_position: number;
    influence_score: number;
  };
}

export interface PatentCitation {
  citing_patent: string;
  cited_patent: string;
  citation_type: 'examiner' | 'applicant' | 'third_party';
  citation_date: string;
  relevance_score?: number;
}

export interface PatentFamily {
  family_id: string;
  priority_application: string;
  family_members: {
    patent_id: string;
    jurisdiction: string;
    status: string;
    publication_date: string;
  }[];
  geographic_coverage: string[];
  family_size: number;
  legal_status_summary: Record<string, number>;
}

// ===== SEARCH VISUALIZATION TYPES =====

export interface SearchVisualization {
  type: 'timeline' | 'assignee_map' | 'classification_tree' | 'citation_network' | 'geographic_map';
  data: any;
  config: {
    title: string;
    description: string;
    interactive: boolean;
    exportable: boolean;
  };
}

export interface TimelineData {
  patents_by_year: {
    year: number;
    count: number;
    patents: string[];
  }[];
  trends: {
    period: string;
    growth_rate: number;
    notable_patents: string[];
  }[];
}

export interface AssigneeMapData {
  assignees: {
    name: string;
    patent_count: number;
    market_share: number;
    threat_level: number;
    key_patents: string[];
    collaboration_score: number;
  }[];
  relationships: {
    from: string;
    to: string;
    type: 'acquisition' | 'licensing' | 'collaboration';
    strength: number;
  }[];
}

export interface ClassificationTreeData {
  root: string;
  nodes: {
    id: string;
    label: string;
    parent: string | null;
    patent_count: number;
    relevance_score: number;
    children: string[];
    depth: number;
  }[];
  coverage_analysis: {
    total_classes: number;
    covered_classes: number;
    coverage_percentage: number;
    gaps: string[];
  };
}

// ===== SEARCH INTEGRATION TYPES =====

export interface BrainstormingIntegration {
  session_id: string;
  auto_sync: boolean;
  keyword_mapping: {
    brainstorming_keyword_id: string;
    search_keywords: string[];
    weight: number;
  }[];
  strategy_mapping: {
    strategy_id: string;
    query_templates: SearchQuery[];
    execution_plan: string[];
  }[];
  competitor_tracking: {
    competitor_id: string;
    assignee_names: string[];
    watch_criteria: SearchFilters;
    alert_threshold: number;
  }[];
}

export interface SearchWorkflow {
  id: string;
  name: string;
  description: string;
  stages: SearchWorkflowStage[];
  current_stage: number;
  status: 'pending' | 'active' | 'completed' | 'failed';
  automation_level: 'manual' | 'semi_automated' | 'fully_automated';
  created_at: string;
  updated_at: string;
}

export interface SearchWorkflowStage {
  id: string;
  name: string;
  description: string;
  type: 'query_building' | 'search_execution' | 'results_analysis' | 'filtering' | 'export' | 'review';
  status: 'pending' | 'active' | 'completed' | 'skipped' | 'failed';
  config: any;
  results?: any;
  estimated_duration: number;
  actual_duration?: number;
  dependencies: string[];
  automation_possible: boolean;
}

// ===== EXPORT & REPORTING TYPES =====

export interface SearchReport {
  id: string;
  execution_id: string;
  report_type: 'summary' | 'detailed' | 'competitive' | 'fto' | 'landscape';
  title: string;
  description: string;
  sections: SearchReportSection[];
  metadata: {
    generated_at: string;
    generated_by: string;
    parameters: SearchReportParameters;
    statistics: SearchReportStatistics;
  };
  format: 'pdf' | 'html' | 'docx' | 'pptx';
  status: 'generating' | 'completed' | 'failed';
  download_url?: string;
}

export interface SearchReportSection {
  id: string;
  title: string;
  type: 'executive_summary' | 'methodology' | 'results_overview' | 'key_patents' | 'competitive_landscape' | 'recommendations' | 'appendix';
  content: any;
  visualizations: SearchVisualization[];
  order: number;
  included: boolean;
}

export interface SearchReportParameters {
  include_abstracts: boolean;
  include_claims: boolean;
  include_citations: boolean;
  include_legal_status: boolean;
  include_family_data: boolean;
  max_patents_detailed: number;
  visualization_types: string[];
  analysis_depth: 'basic' | 'standard' | 'comprehensive';
}

export interface SearchReportStatistics {
  total_patents: number;
  unique_assignees: number;
  date_range: {
    earliest: string;
    latest: string;
  };
  top_jurisdictions: string[];
  classification_coverage: number;
  execution_time: number;
  data_completeness: number;
}

// ===== UTILITY TYPES =====

export type SearchResultsDisplayMode = 'grid' | 'table' | 'list';
export type SearchSortField = 'relevance' | 'date' | 'citations' | 'assignee' | 'title';
export type SearchSortOrder = 'asc' | 'desc';
export type PatentStatus = 'active' | 'expired' | 'pending' | 'rejected';
export type DatabaseType = 'uspto' | 'epo' | 'wipo' | 'jpo' | 'sipo' | 'espacenet' | 'google_patents';
export type QueryType = 'boolean' | 'semantic' | 'hybrid' | 'classification';
export type ExportFormat = 'csv' | 'excel' | 'json' | 'pdf' | 'xml';

// Compatibility aliases used by QueryResultsViewer
export type ResearchQuery = SearchQuery;
export type ResearchResult = PatentRecord;

// ===== HOOK RETURN TYPES =====

export interface UsePatentSearchReturn {
  // State
  searchState: SearchState;
  
  // Actions
  searchActions: SearchActions;
  
  // Utilities
  utils: {
    formatPatentNumber: (number: string) => string;
    formatDate: (date: string) => string;
    calculateRelevanceScore: (patent: PatentRecord, query: SearchQuery) => number;
    generateQueryPreview: (components: QueryComponent[]) => string;
    validateQuery: (query: string) => { valid: boolean; errors: string[] };
  };
}