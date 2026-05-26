/**
 * Analytics API Service
 * Handles all analytics-related API calls
 */

import { ApiResponse, ApiClient } from './apiClient';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export interface AnalyticsProject {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'active' | 'scope_definition' | 'data_collection' | 'patent_analysis' | 'visualization' | 'report_generation' | 'completed' | 'on_hold' | 'cancelled' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_by: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  assigned_to?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  start_date: string;
  due_date?: string;
  completed_date?: string;
  analysis_scope: Record<string, any>;
  // Portfolio linkage (explicit FK — connects analytics to real patent data)
  portfolio?: string | null;
  portfolio_name?: string | null;
  portfolio_patent_count?: number | null;
  progress_percentage: number;
  technology_areas: TechnologyArea[];
  datasets: PatentDataset[];
  competitors: CompetitorProfile[];
  visualizations: AnalyticsVisualization[];
  reports: AnalyticsReport[];
  presentations: AnalyticsPresentation[];
  insights: AnalyticsInsight[];
  created_at: string;
  updated_at: string;
}

export interface TechnologyArea {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  ipc_classes: string[];
  cpc_classes: string[];
  search_queries: string[];
  confidence_threshold: number;
  patent_count: number;
  last_analysis_date?: string;
  created_at: string;
  updated_at: string;
}

export interface PatentDataset {
  id: string;
  name: string;
  description: string;
  data_source: 'manual_upload' | 'api_import' | 'database_query' | 'web_scraping' | 'portfolio_import' | 'odp_import';
  data_file?: string;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  processing_progress: number;
  processing_log?: any[];
  total_patents: number;
  processed_patents: number;
  classification_confidence: number;
  technology_distribution?: Record<string, number>;
  temporal_distribution?: Record<string, number>;
  geographic_distribution?: Record<string, number>;
  assignee_distribution?: Record<string, number>;
  records?: PatentRecord[];
  created_by: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface PatentDatasetCreateData {
  name: string;
  description: string;
  data_source: 'manual_upload' | 'api_import' | 'database_query' | 'web_scraping' | 'portfolio_import' | 'odp_import';
  data_file?: File;
  project: string;
}

export interface PatentRecord {
  id: string;
  row_number: number;
  patent_id: string;
  title: string;
  abstract?: string;
  assignee: string;
  parent_assignee?: string;
  publication_number?: string;
  priority_date?: string;
  inventor: string;
  filing_date?: string;
  publication_date?: string;
  grant_date?: string;
  ipc_classification?: string;
  cpc_classification?: string;
  uspc_classification?: string;
  country_code: string;
  jurisdiction?: string;
  patent_type: string;
  legal_status?: string;
  claims?: string;
  claims_structure?: Array<{
    number: string;
    text: string;
    type: 'independent' | 'dependent';
    references: string[];
  }>;
  independent_claims_count?: number;
  dependent_claims_count?: number;
  claims_count?: number;
  forward_citations?: number;
  backward_citations?: number;
  raw_data: Record<string, any>;
  parsing_notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CompetitorProfile {
  id: string;
  name: string;
  legal_name: string;
  aliases: string[];
  industry: string;
  headquarters: string;
  website: string;
  description: string;
  total_patents: number;
  active_patents: number;
  recent_filings: number;
  technology_focus: Record<string, any>;
  filing_trends: Record<string, any>;
  citation_metrics: Record<string, any>;
  collaboration_data: Record<string, any>;
  strengths: string[];
  weaknesses: string[];
  threats: string[];
  opportunities: string[];
  last_analysis_date?: string;
  confidence_score: number;
  created_at: string;
  updated_at: string;
  // Extended properties used by GlobalCompetitorsTab
  patent_applications_pending?: number;
  key_technology_areas?: string[];
  top_inventors?: string[];
  filing_trend_6_months?: number;
  avg_citations_per_patent?: number;
  patent_quality_score?: number;
  competitive_strength?: 'low' | 'medium' | 'high';
  market_focus?: string[];
}

export interface AnalyticsVisualization {
  id: string;
  title: string;
  description: string;
  visualization_type: 'patent_timeline' | 'technology_landscape' | 'competitive_positioning' | 'geographic_distribution' | 'citation_network' | 'collaboration_network' | 'technology_evolution' | 'portfolio_comparison' | 'filing_trends' | 'white_space_analysis' | 'fto_analysis' | 'risk_assessment';
  status: 'draft' | 'processing' | 'completed' | 'error';
  config: Record<string, any>;
  filters: Record<string, any>;
  chart_data: Record<string, any>;
  insights: string[];
  width: number;
  height: number;
  is_interactive: boolean;
  created_by: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  created_at: string;
  updated_at: string;
}

export interface AnalyticsReport {
  id: string;
  title: string;
  report_type: 'landscape_analysis' | 'competitive_intelligence' | 'fto_analysis' | 'white_space_analysis' | 'portfolio_assessment' | 'technology_trends' | 'market_analysis' | 'investment_analysis';
  status: 'draft' | 'generating' | 'review' | 'approved' | 'completed' | 'archived';
  executive_summary: string;
  sections: Record<string, any>;
  conclusions: string;
  recommendations: string[];
  include_sections: string[];
  template_config: Record<string, any>;
  pdf_file?: string;
  excel_file?: string;
  reviewed_by?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  review_notes: string;
  approved_at?: string;
  created_by: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  created_at: string;
  updated_at: string;
}

export interface AnalyticsPresentation {
  id: string;
  name: string;
  description: string;
  presentation_type: 'executive_summary' | 'technical_deep_dive' | 'competitive_analysis' | 'patent_landscape' | 'investor_pitch' | 'board_presentation' | 'custom';
  status: 'draft' | 'in_progress' | 'completed' | 'archived';
  theme: 'modern_dark' | 'professional_blue' | 'minimal_light' | 'corporate_gray' | 'vibrant_cyan';
  slides: any[];
  speaker_notes: Record<string, string>;
  slide_count: number;
  duration_minutes: number;
  thumbnail?: string;
  template_id?: string;
  template_config: Record<string, any>;
  pptx_file?: string;
  pdf_file?: string;
  last_presented?: string;
  presentation_count: number;
  created_by: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  created_at: string;
  updated_at: string;
}

export interface AnalyticsInsight {
  id: string;
  title: string;
  insight_type: 'trend_analysis' | 'opportunity_identification' | 'risk_assessment' | 'competitive_gap' | 'technology_emergence' | 'market_shift' | 'collaboration_opportunity' | 'patent_expiration';
  description: string;
  supporting_data: Record<string, any>;
  confidence_level: 'low' | 'medium' | 'high';
  impact_score: number;
  recommended_actions: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  is_actionable: boolean;
  is_reviewed: boolean;
  reviewed_by?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  created_at: string;
  updated_at: string;
}

export interface AnalyticsDashboard {
  total_projects: number;
  active_projects: number;
  completed_projects: number;
  total_datasets: number;
  total_patents_analyzed: number;
  total_patents_in_portfolios: number;
  patents_with_ai_analysis: number;
  total_visualizations: number;
  recent_projects: AnalyticsProject[];
  recent_insights: AnalyticsInsight[];
  projects_by_status: Record<string, number>;
  projects_by_type: Record<string, number>;
  technology_areas_distribution: Record<string, number>;
  monthly_project_trends: Array<{month: string, projects: number}>;
  completion_rate_trend: Array<{month: string, rate: number}>;
  top_technology_areas?: { code: string; count: number }[];
  top_assignees?: { name: string; count: number }[];
  patent_status_distribution?: Record<string, number>;
  filing_trend?: { year: number; count: number }[];
}

export interface PortfolioDataset {
  portfolio_id: string;
  portfolio_name: string;
  total_patents: number;
  status_distribution: Record<string, number>;
  ipc_distribution: Record<string, number>;
  technology_area_distribution: Record<string, number>;
  filing_trends: Array<{year: string, count: number}>;
  assignee_distribution: Record<string, number>;
  ai_analysis_count: number;
}

export interface ChartTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
}

export interface ChartData {
  type: string;
  data: Record<string, any>;
  [key: string]: any;
}

export interface ReportTemplate {
  type: string;
  name: string;
  description: string;
  sections: string[];
}

// Intelligent Column Mapping Interfaces
export interface ColumnMapping {
  source_column: string;
  target_field: string;
  confidence_score: number;
  is_core_field: boolean;
  suggested_field_type: string;
  sample_values: any[];
  mapping_rule_id?: string;
}

export interface MappingConflict {
  target_field: string;
  conflicting_columns: string[];
  confidence_scores: number[];
  suggested_resolution: string;
}

export interface ColumnMappingAnalysis {
  dataset_id: string;
  total_columns: number;
  matches: ColumnMapping[];
  unmapped_columns: string[];
  conflicts: MappingConflict[];
  high_confidence_count: number;
  medium_confidence_count: number;
  low_confidence_count: number;
}

export interface MappingApplicationResult {
  status: string;
  dataset_id: string;
  applied_mappings: number;
  dynamic_fields_created: number;
  errors: string[];
  created_fields: Array<{
    field_name: string;
    display_name: string;
    field_type: string;
  }>;
}

export interface DatasetMappingStatus {
  dataset_id: string;
  total_mappings: number;
  status_breakdown: {
    pending: number;
    confirmed: number;
    rejected: number;
    auto_applied: number;
  };
  mappings: Array<{
    id: string;
    source_column: string;
    target_field: string;
    confidence_score: number;
    status: string;
    sample_values: any[];
    processing_errors: string[];
    reviewed_by?: string;
    reviewed_at?: string;
    admin_notes: string;
  }>;
  needs_review: boolean;
}

export interface BuiltinPattern {
  field_name: string;
  patterns: string[];
  field_type: string;
  is_core_field: boolean;
}

export interface MappingTestResult {
  column_name: string;
  best_match?: {
    target_field: string;
    confidence_score: number;
    field_type: string;
    is_core_field: boolean;
    matching_patterns: string[];
  };
  message?: string;
}

// Advanced Analytics Response Interfaces

export interface LandscapeCluster {
  id: string;
  name: string;
  patent_count: number;
  keywords: string[];
  ipc_classes: string[];
  density: number;
  filing_trend: Array<{ year: number; count: number }>;
}

export interface LandscapeAnalysis {
  project_id: string;
  total_patents: number;
  total_technology_areas: number;
  clusters: LandscapeCluster[];
  gaps: LandscapeCluster[];
  evolution: Array<{ year: number; count: number }>;
  geographic_distribution: Record<string, number>;
  average_density: number;
}

export interface ClaimAnalysis {
  claim_number: string;
  text: string;
  coverage_score: number;
  risk_level: 'high' | 'medium' | 'low' | 'none';
}

export interface PatentAssessment {
  patent_id: string;
  title: string;
  assignee: string;
  filing_date: string | null;
  risk_score: number;
  risk_level: 'high' | 'medium' | 'low' | 'none';
  independent_claims_count: number;
  dependent_claims_count: number;
  claim_analysis: ClaimAnalysis[];
  country_code: string;
  legal_status: string;
}

export interface FtoAnalysis {
  project_id: string;
  total_patents_analyzed: number;
  target_description: string;
  overall_risk_score: number;
  overall_risk_level: 'high' | 'medium' | 'low' | 'none';
  risk_summary: {
    high: number;
    medium: number;
    low: number;
    none: number;
  };
  patent_assessments: PatentAssessment[];
  recommendations: string[];
}

export interface WhiteSpaceMatrixRow {
  technology_area: string;
  technology_area_id: string;
  total_patents: number;
  domains: Record<string, number>;
}

export interface WhiteSpaceOpportunity {
  technology_area: string;
  application_domain: string;
  patent_count: number;
  opportunity_score: number;
  recommendation: string;
}

export interface WhiteSpaceAnalysis {
  project_id: string;
  total_patents: number;
  technology_areas: string[];
  application_domains: string[];
  matrix: WhiteSpaceMatrixRow[];
  opportunities: WhiteSpaceOpportunity[];
  total_white_spaces: number;
  total_low_density: number;
}

export interface FilingVelocityPoint {
  month: string;
  count: number;
  moving_avg: number;
}

export interface ForecastPoint {
  month: string;
  predicted: number;
  lower_bound: number;
  upper_bound: number;
}

export interface AreaTrend {
  name: string;
  total_patents: number;
  yearly_data: Array<{ year: number; count: number }>;
  is_emerging: boolean;
  maturity_stage: 'emerging' | 'growing' | 'mature' | 'declining' | 'unknown';
  growth_rate: number;
}

export interface TrendAnalysis {
  project_id: string;
  total_patents: number;
  filing_velocity: FilingVelocityPoint[];
  forecast: ForecastPoint[];
  area_trends: AreaTrend[];
  emerging_technologies: AreaTrend[];
  mature_technologies: AreaTrend[];
}

// Portfolio Assessment
export interface QualityScore {
  patent_id: string;
  title: string;
  assignee: string;
  quality_score: number;
  tier: 'tier_a' | 'tier_b' | 'tier_c' | 'tier_d';
  claim_breadth: string;
  citation_score: number;
  forward_citations: number;
  geographic_coverage: string;
}

export interface GeoCoverage {
  jurisdiction: string;
  patent_count: number;
  percentage: number;
}

export interface ExpiryPoint {
  year: number;
  expiring_count: number;
  cumulative_percentage: number;
}

export interface PortfolioAssessment {
  project_id: string;
  total_patents: number;
  quality_tiers: { tier_a: number; tier_b: number; tier_c: number; tier_d: number };
  quality_scores: QualityScore[];
  geographic_coverage: GeoCoverage[];
  portfolio_strength_score: number;
  expiry_timeline: ExpiryPoint[];
  maintenance_cost_estimate: number;
  recommendations: string[];
}

// Market Analysis
export interface AssigneeShare {
  assignee: string;
  patent_count: number;
  market_share: number;
}

export interface CompetitivePositioning {
  entity: string;
  ip_strength: number;
  market_share_est: number;
  portfolio_size: number;
}

export interface NewEntrant {
  entity: string;
  first_filing_year: number;
  recent_filings: number;
}

export interface MarketOpportunity {
  segment: string;
  growth_rate: number;
  ip_barrier: number;
  patent_coverage: number;
}

export interface MarketAnalysis {
  project_id: string;
  total_patents: number;
  hhi_score: number;
  market_concentration: 'highly_concentrated' | 'moderately_concentrated' | 'competitive';
  assignee_shares: AssigneeShare[];
  competitive_positioning: CompetitivePositioning[];
  new_entrants: NewEntrant[];
  ip_white_spaces: Array<{ segment: string; patent_count: number; opportunity_score: number }>;
  market_opportunity_matrix: MarketOpportunity[];
  geographic_market_opportunities: Array<{ jurisdiction: string; patent_count: number; opportunity_score: number }>;
  recommendations: string[];
}

// Investment Analysis
export interface RiskMatrixItem {
  risk_type: string;
  probability: number;
  severity: number;
  description: string;
}

export interface KeyAsset {
  patent_id: string;
  title: string;
  value_contribution: number;
  risk_level: 'low' | 'medium' | 'high';
}

export interface InvestmentAnalysis {
  project_id: string;
  total_patents: number;
  portfolio_value_estimate: number;
  quality_scorecard: { tier_a_pct: number; tier_b_pct: number; weighted_score: number };
  expiry_cliff: Array<{ year: number; expiring: number; value_at_risk: number }>;
  risk_matrix: RiskMatrixItem[];
  concentration_risk: number;
  key_assets: KeyAsset[];
  valuation_methods: {
    income_approach: number;
    market_approach: number;
    cost_approach: number;
    recommended_range: [number, number];
  };
  deal_recommendations: string[];
  red_flags: string[];
}

// Litigation Analysis
export interface LitigationPatentRisk {
  patent_id: string;
  title: string;
  assignee: string;
  litigation_risk_score: number;
  risk_level: 'high' | 'medium' | 'low' | 'none';
  risk_factors: string[];
}

export interface AssertionPattern {
  entity: string;
  assertion_count: number;
  success_rate: number;
  entity_type: string;
}

export interface WatchListItem {
  patent_id: string;
  title: string;
  risk_score: number;
  recommended_action: string;
}

export interface LitigationAnalysis {
  project_id: string;
  total_patents_analyzed: number;
  overall_litigation_risk: number;
  risk_level: 'high' | 'medium' | 'low' | 'none';
  assertion_patterns: AssertionPattern[];
  risk_by_patent: LitigationPatentRisk[];
  venue_distribution: Array<{ venue: string; case_count: number }>;
  outcome_benchmarks: { plaintiff_win_rate: number; settlement_rate: number; ptab_institution_rate: number };
  npe_risk_indicators: string[];
  watch_list: WatchListItem[];
  risk_mitigation_strategies: string[];
}

// Licensing Analysis
export interface LicensableAsset {
  patent_id: string;
  title: string;
  assignee: string;
  licensing_score: number;
  coverage: string;
  claim_count: number;
}

export interface LicensingFootprintItem {
  entity: string;
  relevance_score: number;
  est_revenue_at_risk: number;
  priority: 'high' | 'medium' | 'low';
}

export interface LicenseStructure {
  type: string;
  description: string;
  pros: string[];
  cons: string[];
}

export interface RevenueForecastPoint {
  year: number;
  conservative: number;
  base: number;
  optimistic: number;
}

export interface GeorgiaPacificFactor {
  factor: string;
  score: number;
  notes: string;
}

export interface LicensingAnalysis {
  project_id: string;
  total_patents: number;
  licensable_assets: LicensableAsset[];
  royalty_benchmarks: { floor: number; midpoint: number; ceiling: number; recommended_rate: number };
  licensing_footprint: LicensingFootprintItem[];
  license_structure_recommendations: LicenseStructure[];
  revenue_forecast: RevenueForecastPoint[];
  georgia_pacific_scores: GeorgiaPacificFactor[];
  program_recommendations: string[];
}

// Valuation Analysis
export interface ValuationSensitivity {
  variable: string;
  low_case: number;
  base_case: number;
  high_case: number;
}

export interface ValuationAnalysis {
  project_id: string;
  total_patents: number;
  effective_date: string;
  asset_summary: Array<{ patent_id: string; title: string; remaining_life_years: number | null; relevance: string }>;
  income_approach: {
    relief_from_royalty: number;
    royalty_rate: number;
    revenue_base: number;
    discount_rate: number;
    incremental_income: number;
  };
  market_approach: { value: number; comparables_count: number };
  cost_approach: { value: number; reproduction_cost: number; depreciation_pct: number };
  reconciled_value: number;
  value_range: [number, number];
  sensitivity_analysis: ValuationSensitivity[];
  scenarios: { optimistic: number; base: number; pessimistic: number };
  remaining_useful_life_avg: number;
  expiry_cliff_pct: number;
  assumptions: string[];
}

class AnalyticsApiService extends ApiClient {
  // Projects
  async getProjects(limit = 100, offset = 0): Promise<ApiResponse<AnalyticsProject[]>> {
    return this.fetchWithAuth<AnalyticsProject[]>(`/analytics/api/projects/?limit=${limit}&offset=${offset}`);
  }

  async getProject(id: string): Promise<ApiResponse<AnalyticsProject>> {
    return this.fetchWithAuth<AnalyticsProject>(`/analytics/api/projects/${id}/`);
  }

  async createProject(data: Partial<AnalyticsProject>): Promise<ApiResponse<AnalyticsProject>> {
    return this.fetchWithAuth<AnalyticsProject>('/analytics/api/projects/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProject(id: string, data: Partial<AnalyticsProject>): Promise<ApiResponse<AnalyticsProject>> {
    return this.fetchWithAuth<AnalyticsProject>(`/analytics/api/projects/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteProject(id: string): Promise<ApiResponse<void>> {
    return this.fetchWithAuth<void>(`/analytics/api/projects/${id}/`, {
      method: 'DELETE',
    });
  }

  async getOrCreateProjectFromPortfolio(portfolioId: string): Promise<ApiResponse<{project_id: string; project_name: string; created: boolean}>> {
    return this.fetchWithAuth<{project_id: string; project_name: string; created: boolean}>('/analytics/api/projects/from-portfolio/', {
      method: 'POST',
      body: JSON.stringify({ portfolio_id: portfolioId }),
    });
  }

  async startAnalysis(projectId: string): Promise<ApiResponse<{status: string, project_id: string}>> {
    return this.fetchWithAuth<{status: string, project_id: string}>(`/analytics/api/projects/${projectId}/start_analysis/`, {
      method: 'POST',
    });
  }

  // Dashboard
  async getDashboard(): Promise<ApiResponse<AnalyticsDashboard>> {
    return this.fetchWithAuth<AnalyticsDashboard>('/analytics/api/projects/dashboard/');
  }

  // Datasets
  async getDatasets(projectId?: string, limit = 100, offset = 0): Promise<ApiResponse<PatentDataset[]>> {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    if (projectId) params.set('project_id', projectId);
    return this.fetchWithAuth<PatentDataset[]>(`/analytics/api/datasets/?${params}`);
  }

  async createDataset(data: PatentDatasetCreateData): Promise<ApiResponse<PatentDataset>> {
    // Check if data contains a file
    const hasFile = data && typeof data === 'object' && 'data_file' in data && data.data_file instanceof File;
    
    if (hasFile) {
      // Use FormData for file uploads
      const formData = new FormData();
      
      // Add all non-file fields
      Object.entries(data).forEach(([key, value]) => {
        if (key === 'data_file' && value instanceof File) {
          formData.append(key, value);
        } else if (value !== null && value !== undefined) {
          formData.append(key, String(value));
        }
      });
      
      return this.fetchWithAuth<PatentDataset>('/analytics/api/datasets/', {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header - browser will set it automatically with boundary
      });
    } else {
      // Use JSON for non-file requests
      return this.fetchWithAuth<PatentDataset>('/analytics/api/datasets/', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    }
  }

  async getDataset(datasetId: string): Promise<ApiResponse<PatentDataset>> {
    return this.fetchWithAuth<PatentDataset>(`/analytics/api/datasets/${datasetId}/`);
  }

  async updateDataset(datasetId: string, data: Partial<PatentDataset>): Promise<ApiResponse<PatentDataset>> {
    return this.fetchWithAuth<PatentDataset>(`/analytics/api/datasets/${datasetId}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteDataset(datasetId: string): Promise<ApiResponse<void>> {
    return this.fetchWithAuth<void>(`/analytics/api/datasets/${datasetId}/`, {
      method: 'DELETE',
    });
  }

  async processDataset(datasetId: string): Promise<ApiResponse<{status: string, dataset_id: string}>> {
    return this.fetchWithAuth<{status: string, dataset_id: string}>(`/analytics/api/datasets/${datasetId}/process_data/`, {
      method: 'POST',
    });
  }

  async getDatasetRecords(datasetId: string, page: number = 1, pageSize: number = 50): Promise<ApiResponse<{
    total_count: number;
    page: number;
    page_size: number;
    total_pages: number;
    records: PatentRecord[];
  }>> {
    return this.fetchWithAuth<{
      total_count: number;
      page: number;
      page_size: number;
      total_pages: number;
      records: PatentRecord[];
    }>(`/analytics/api/datasets/${datasetId}/records/?page=${page}&page_size=${pageSize}`);
  }

  // Technology Areas
  async getTechnologyAreas(projectId?: string, limit = 100, offset = 0): Promise<ApiResponse<TechnologyArea[]>> {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    if (projectId) params.set('project_id', projectId);
    return this.fetchWithAuth<TechnologyArea[]>(`/analytics/api/technology-areas/?${params}`);
  }

  async createTechnologyArea(data: Partial<TechnologyArea>): Promise<ApiResponse<TechnologyArea>> {
    return this.fetchWithAuth<TechnologyArea>('/analytics/api/technology-areas/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Competitors
  async getCompetitors(projectId?: string, limit = 100, offset = 0): Promise<ApiResponse<CompetitorProfile[]>> {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    if (projectId) params.set('project_id', projectId);
    return this.fetchWithAuth<CompetitorProfile[]>(`/analytics/api/competitors/?${params}`);
  }

  async createCompetitor(data: Partial<CompetitorProfile>): Promise<ApiResponse<CompetitorProfile>> {
    return this.fetchWithAuth<CompetitorProfile>('/analytics/api/competitors/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Visualizations
  async getVisualizations(projectId?: string, limit = 50, offset = 0): Promise<ApiResponse<AnalyticsVisualization[]>> {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    if (projectId) params.set('project_id', projectId);
    return this.fetchWithAuth<AnalyticsVisualization[]>(`/analytics/api/visualizations/?${params}`);
  }

  async createVisualization(data: Partial<AnalyticsVisualization>): Promise<ApiResponse<AnalyticsVisualization>> {
    return this.fetchWithAuth<AnalyticsVisualization>('/analytics/api/visualizations/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async generateChart(visualizationId: string): Promise<ApiResponse<{status: string, chart_data: any}>> {
    return this.fetchWithAuth<{status: string, chart_data: any}>(`/analytics/api/visualizations/${visualizationId}/generate_chart/`, {
      method: 'POST',
    });
  }

  async getChartTemplates(): Promise<ApiResponse<ChartTemplate[]>> {
    return this.fetchWithAuth<ChartTemplate[]>('/analytics/api/visualizations/chart_templates/');
  }

  // Reports
  async getReports(projectId?: string, limit = 50, offset = 0): Promise<ApiResponse<AnalyticsReport[]>> {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    if (projectId) params.set('project_id', projectId);
    return this.fetchWithAuth<AnalyticsReport[]>(`/analytics/api/reports/?${params}`);
  }

  async createReport(data: Partial<AnalyticsReport>): Promise<ApiResponse<AnalyticsReport>> {
    return this.fetchWithAuth<AnalyticsReport>('/analytics/api/reports/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async generateReport(reportId: string): Promise<ApiResponse<{status: string, report_id: string}>> {
    return this.fetchWithAuth<{status: string, report_id: string}>(`/analytics/api/reports/${reportId}/generate_report/`, {
      method: 'POST',
    });
  }

  async getReportTemplates(): Promise<ApiResponse<ReportTemplate[]>> {
    return this.fetchWithAuth<ReportTemplate[]>('/analytics/api/reports/report_templates/');
  }

  async updateReport(reportId: string, data: Partial<AnalyticsReport>): Promise<ApiResponse<AnalyticsReport>> {
    return this.fetchWithAuth<AnalyticsReport>(`/analytics/api/reports/${reportId}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteReport(reportId: string): Promise<ApiResponse<void>> {
    return this.fetchWithAuth<void>(`/analytics/api/reports/${reportId}/`, {
      method: 'DELETE',
    });
  }

  // Presentations
  async getPresentations(projectId?: string, limit = 50, offset = 0): Promise<ApiResponse<AnalyticsPresentation[]>> {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    if (projectId) params.set('project_id', projectId);
    return this.fetchWithAuth<AnalyticsPresentation[]>(`/analytics/api/presentations/?${params}`);
  }

  async createPresentation(data: Partial<AnalyticsPresentation> & { project: string }): Promise<ApiResponse<AnalyticsPresentation>> {
    return this.fetchWithAuth<AnalyticsPresentation>('/analytics/api/presentations/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePresentation(presentationId: string, data: Partial<AnalyticsPresentation>): Promise<ApiResponse<AnalyticsPresentation>> {
    return this.fetchWithAuth<AnalyticsPresentation>(`/analytics/api/presentations/${presentationId}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deletePresentation(presentationId: string): Promise<ApiResponse<void>> {
    return this.fetchWithAuth<void>(`/analytics/api/presentations/${presentationId}/`, {
      method: 'DELETE',
    });
  }

  async duplicatePresentation(presentationId: string): Promise<ApiResponse<AnalyticsPresentation>> {
    return this.fetchWithAuth<AnalyticsPresentation>(`/analytics/api/presentations/${presentationId}/duplicate/`, {
      method: 'POST',
    });
  }

  async exportPresentationPPTX(presentationId: string): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/analytics/api/presentations/${presentationId}/export_pptx/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.getToken()}`,
      },
    });
    return response.blob();
  }

  async exportPresentationPDF(presentationId: string): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/analytics/api/presentations/${presentationId}/export_pdf/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.getToken()}`,
      },
    });
    return response.blob();
  }

  async markPresentationAsPresented(presentationId: string): Promise<ApiResponse<{status: string, last_presented: string, presentation_count: number}>> {
    return this.fetchWithAuth<{status: string, last_presented: string, presentation_count: number}>(`/analytics/api/presentations/${presentationId}/present/`, {
      method: 'POST',
    });
  }

  // Insights
  async getInsights(projectId?: string, limit = 50, offset = 0): Promise<ApiResponse<AnalyticsInsight[]>> {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    if (projectId) params.set('project_id', projectId);
    return this.fetchWithAuth<AnalyticsInsight[]>(`/analytics/api/insights/?${params}`);
  }

  async createInsight(data: Partial<AnalyticsInsight>): Promise<ApiResponse<AnalyticsInsight>> {
    return this.fetchWithAuth<AnalyticsInsight>('/analytics/api/insights/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteInsight(insightId: string): Promise<ApiResponse<void>> {
    return this.fetchWithAuth<void>(`/analytics/api/insights/${insightId}/`, { method: 'DELETE' });
  }

  async updateInsight(insightId: string, data: Partial<AnalyticsInsight>): Promise<ApiResponse<AnalyticsInsight>> {
    return this.fetchWithAuth<AnalyticsInsight>(`/analytics/api/insights/${insightId}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteCompetitor(competitorId: string): Promise<ApiResponse<void>> {
    return this.fetchWithAuth<void>(`/analytics/api/competitors/${competitorId}/`, { method: 'DELETE' });
  }

  async deleteTechnologyArea(areaId: string): Promise<ApiResponse<void>> {
    return this.fetchWithAuth<void>(`/analytics/api/technology-areas/${areaId}/`, { method: 'DELETE' });
  }

  async getPortfolioAsDataset(portfolioId: string): Promise<ApiResponse<PortfolioDataset>> {
    return this.fetchWithAuth<PortfolioDataset>(`/analytics/api/portfolio/${portfolioId}/as-dataset/`);
  }

  async getInfringementRiskMap(): Promise<ApiResponse<{
    total_cases: number;
    risk_distribution: Record<string, number>;
    accused_party_risk_matrix: Array<{accused_party_name: string, risk_level: string, count: number}>;
    infringement_likelihood_histogram: Array<{range: string, count: number}>;
  }>> {
    return this.fetchWithAuth('/analytics/api/infringement-risk-map/');
  }

  // Intelligent Column Mapping Endpoints
  async analyzeDatasetColumns(datasetId: string): Promise<ApiResponse<ColumnMappingAnalysis>> {
    return this.fetchWithAuth<ColumnMappingAnalysis>(`/analytics/api/datasets/${datasetId}/analyze_columns/`, {
      method: 'POST',
    });
  }

  async applyColumnMappings(datasetId: string, mappings: ColumnMapping[]): Promise<ApiResponse<MappingApplicationResult>> {
    return this.fetchWithAuth<MappingApplicationResult>(`/analytics/api/datasets/${datasetId}/apply_mappings/`, {
      method: 'POST',
      body: JSON.stringify({ mappings }),
    });
  }

  async getDatasetMappingStatus(datasetId: string): Promise<ApiResponse<DatasetMappingStatus>> {
    return this.fetchWithAuth<DatasetMappingStatus>(`/analytics/api/datasets/${datasetId}/mapping_status/`);
  }

  async getBuiltinMappingPatterns(): Promise<ApiResponse<Record<string, BuiltinPattern>>> {
    return this.fetchWithAuth<Record<string, BuiltinPattern>>('/analytics/api/column-mapping-rules/builtin_patterns/');
  }

  async testColumnMapping(columnName: string): Promise<ApiResponse<MappingTestResult>> {
    return this.fetchWithAuth<MappingTestResult>('/analytics/api/column-mapping-rules/test_mapping/', {
      method: 'POST',
      body: JSON.stringify({ column_name: columnName }),
    });
  }

  // Export Functions
  async exportProjectData(projectId: string, format: 'json' | 'csv' | 'excel' = 'json'): Promise<Blob> {
    const response = await fetch(`${this.baseURL}/analytics/api/projects/${projectId}/export_data/?format=${format}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Export failed' }));
      throw new Error(errorData.error || `Export failed with status ${response.status}`);
    }

    return response.blob();
  }

  async exportDatasetData(datasetId: string, format: 'json' | 'csv' | 'excel' = 'json'): Promise<Blob> {
    const response = await fetch(`${this.baseURL}/analytics/api/datasets/${datasetId}/export_data/?format=${format}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Export failed' }));
      throw new Error(errorData.error || `Export failed with status ${response.status}`);
    }

    return response.blob();
  }

  async duplicateProject(projectId: string): Promise<ApiResponse<{status: string, new_project_id: string, new_project_name: string}>> {
    return this.fetchWithAuth<{status: string, new_project_id: string, new_project_name: string}>(`/analytics/api/projects/${projectId}/duplicate/`, {
      method: 'POST',
    });
  }

  async exportChart(visualizationId: string, format: 'json' | 'csv' | 'png' | 'svg' | 'pdf' = 'png'): Promise<Blob | ApiResponse<any>> {
    if (format === 'json' || format === 'csv') {
      // For data formats, return blob directly
      const response = await fetch(`${this.baseURL}/analytics/api/visualizations/${visualizationId}/export_chart/?format=${format}`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Chart export failed' }));
        throw new Error(errorData.error || `Chart export failed with status ${response.status}`);
      }

      return response.blob();
    } else {
      // For image formats, return API response (placeholder for now)
      return this.fetchWithAuth<any>(`/analytics/api/visualizations/${visualizationId}/export_chart/?format=${format}`);
    }
  }

  async archiveProject(projectId: string): Promise<any> {
    const response = await fetch(`${this.baseURL}/analytics/api/projects/${projectId}/archive/`, {
      method: 'POST',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Archive failed' }));
      throw new Error(errorData.error || `Archive failed with status ${response.status}`);
    }

    return response.json();
  }

  async unarchiveProject(projectId: string, newStatus: string = 'active'): Promise<any> {
    const response = await fetch(`${this.baseURL}/analytics/api/projects/${projectId}/unarchive/`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ status: newStatus }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unarchive failed' }));
      throw new Error(errorData.error || `Unarchive failed with status ${response.status}`);
    }

    return response.json();
  }

  async getPhaseRecommendations(
    projectId: string,
    phase: { phase_name: string; description: string; steps: string[] },
  ): Promise<ApiResponse<{ recommendations: string[]; action_items: string[] }>> {
    return this.fetchWithAuth<{ recommendations: string[]; action_items: string[] }>(
      `/analytics/api/projects/${projectId}/phase_recommendations/`,
      {
        method: 'POST',
        body: JSON.stringify(phase),
      },
    );
  }

  async getWorkflowProgress(projectId: string): Promise<ApiResponse<{ project_id: string; project_type: string; workflow_progress: Record<string, any> }>> {
    return this.fetchWithAuth<{ project_id: string; project_type: string; workflow_progress: Record<string, any> }>(`/analytics/api/projects/${projectId}/workflow-progress/`);
  }

  async updateWorkflowProgress(projectId: string, data: { phase_id: string; step_index: number; completed: boolean }): Promise<ApiResponse<any>> {
    return this.fetchWithAuth(`/analytics/api/projects/${projectId}/workflow-progress/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProjectStatus(projectId: string, newStatus: string): Promise<any> {
    const response = await fetch(`${this.baseURL}/analytics/api/projects/${projectId}/update_status/`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ status: newStatus }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Status update failed' }));
      throw new Error(errorData.error || `Status update failed with status ${response.status}`);
    }

    return response.json();
  }


  // Dataset Import Methods
  async importDatasetFromPortfolio(projectId: string, portfolioId: string, name?: string): Promise<ApiResponse<PatentDataset>> {
    return this.fetchWithAuth<PatentDataset>('/analytics/api/datasets/import-from-portfolio/', {
      method: 'POST',
      body: JSON.stringify({ project_id: projectId, portfolio_id: portfolioId, name }),
    });
  }

  async importDatasetFromODP(projectId: string, name: string, searchParams: Record<string, any>, applicationNumbers?: string[]): Promise<ApiResponse<PatentDataset>> {
    return this.fetchWithAuth<PatentDataset>('/analytics/api/datasets/import-from-odp/', {
      method: 'POST',
      body: JSON.stringify({
        project_id: projectId,
        name,
        search_params: searchParams,
        application_numbers: applicationNumbers,
      }),
    });
  }

  // Advanced Analytics
  async analyzeLandscape(projectId: string): Promise<ApiResponse<LandscapeAnalysis>> {
    return this.fetchWithAuth<LandscapeAnalysis>(`/analytics/api/projects/${projectId}/analyze_landscape/`, {
      method: 'POST',
    });
  }

  async runFtoAnalysis(projectId: string, targetDescription?: string): Promise<ApiResponse<FtoAnalysis>> {
    return this.fetchWithAuth<FtoAnalysis>(`/analytics/api/projects/${projectId}/run_fto/`, {
      method: 'POST',
      body: JSON.stringify({ target_description: targetDescription }),
    });
  }

  async findWhiteSpace(projectId: string): Promise<ApiResponse<WhiteSpaceAnalysis>> {
    return this.fetchWithAuth<WhiteSpaceAnalysis>(`/analytics/api/projects/${projectId}/find_white_space/`, {
      method: 'POST',
    });
  }

  async forecastTrends(projectId: string): Promise<ApiResponse<TrendAnalysis>> {
    return this.fetchWithAuth<TrendAnalysis>(`/analytics/api/projects/${projectId}/forecast_trends/`, {
      method: 'POST',
    });
  }

  async assessPortfolio(projectId: string): Promise<ApiResponse<PortfolioAssessment>> {
    return this.fetchWithAuth<PortfolioAssessment>(`/analytics/api/projects/${projectId}/assess_portfolio/`, {
      method: 'POST',
    });
  }

  async runMarketAnalysis(projectId: string): Promise<ApiResponse<MarketAnalysis>> {
    return this.fetchWithAuth<MarketAnalysis>(`/analytics/api/projects/${projectId}/run_market_analysis/`, {
      method: 'POST',
    });
  }

  async runInvestmentAnalysis(projectId: string): Promise<ApiResponse<InvestmentAnalysis>> {
    return this.fetchWithAuth<InvestmentAnalysis>(`/analytics/api/projects/${projectId}/run_investment_analysis/`, {
      method: 'POST',
    });
  }

  async runLitigationAnalysis(projectId: string): Promise<ApiResponse<LitigationAnalysis>> {
    return this.fetchWithAuth<LitigationAnalysis>(`/analytics/api/projects/${projectId}/run_litigation_analysis/`, {
      method: 'POST',
    });
  }

  async runLicensingAnalysis(projectId: string): Promise<ApiResponse<LicensingAnalysis>> {
    return this.fetchWithAuth<LicensingAnalysis>(`/analytics/api/projects/${projectId}/run_licensing_analysis/`, {
      method: 'POST',
    });
  }

  async runValuationAnalysis(projectId: string): Promise<ApiResponse<ValuationAnalysis>> {
    return this.fetchWithAuth<ValuationAnalysis>(`/analytics/api/projects/${projectId}/run_valuation_analysis/`, {
      method: 'POST',
    });
  }

  // Full Report (merged landscape + whitespace + AI narrative)
  async generateFullReport(projectId: string): Promise<ApiResponse<any>> {
    return this.fetchWithAuth(`/analytics/api/projects/${projectId}/generate-report/`, {
      method: 'POST',
    });
  }

  // Family Analysis
  async runFamilyAnalysis(projectId: string, params: {
    lens_id: string;
    family_type?: 'simple' | 'extended';
    analysis_mode?: 'quick' | 'deep';
  }): Promise<ApiResponse<any>> {
    return this.fetchWithAuth(`/analytics/api/projects/${projectId}/family_analysis/`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  // Analysis History
  async getAnalysisHistory(projectId: string, type?: string): Promise<ApiResponse<{ results: any[] }>> {
    const qs = type ? `?type=${type}` : '';
    return this.fetchWithAuth(`/analytics/api/projects/${projectId}/analysis-history/${qs}`);
  }

  async getAnalysisResult(projectId: string, resultId: string): Promise<ApiResponse<any>> {
    return this.fetchWithAuth(`/analytics/api/projects/${projectId}/analysis-history/${resultId}/`);
  }

  // Helper function to download blob as file
  downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  // ── Bundle Analysis ────────────────────────────────────────────────────────

  async getBundleAnalysisResult(projectId: string): Promise<ApiResponse<BundleAnalysisSavedState>> {
    return this.fetchWithAuth<BundleAnalysisSavedState>(
      `/analytics/api/projects/${projectId}/bundle-analysis-result/`
    );
  }

  async runBundleAnalysis(
    projectId: string,
    config?: Partial<BundleConfiguration>
  ): Promise<ApiResponse<BundleAnalysisResult>> {
    return this.fetchWithAuth<BundleAnalysisResult>(
      `/analytics/api/projects/${projectId}/run_bundle_analysis/`,
      { method: 'POST', body: JSON.stringify(config || {}) }
    );
  }

  async extractBundleAttributes(
    projectId: string,
    patentRecordIds?: string[],
    fields?: string[]
  ): Promise<ApiResponse<AttributeExtractionResult>> {
    return this.fetchWithAuth<AttributeExtractionResult>(
      `/analytics/api/projects/${projectId}/extract_bundle_attributes/`,
      { method: 'POST', body: JSON.stringify({ patent_record_ids: patentRecordIds, fields }) }
    );
  }

  async getBundleAttributes(
    projectId: string,
    limit = 50,
    offset = 0
  ): Promise<ApiResponse<{ count: number; results: BundleAttributes[] }>> {
    return this.fetchWithAuth<{ count: number; results: BundleAttributes[] }>(
      `/analytics/api/projects/${projectId}/bundle_attributes/?limit=${limit}&offset=${offset}`
    );
  }

  async updateBundleAttributes(
    projectId: string,
    patentRecordId: string,
    attributes: Partial<BundleAttributes>
  ): Promise<ApiResponse<{ updated: Record<string, unknown> }>> {
    return this.fetchWithAuth(
      `/analytics/api/projects/${projectId}/bundle_attributes/`,
      { method: 'PATCH', body: JSON.stringify({ patent_record_id: patentRecordId, attributes }) }
    );
  }

  // ── Sales Package ──────────────────────────────────────────────────────────

  async getSalesPackages(projectId: string): Promise<ApiResponse<SalesPackage[]>> {
    return this.fetchWithAuth<SalesPackage[]>(
      `/analytics/api/projects/${projectId}/sales-packages/`
    );
  }

  async createSalesPackage(
    projectId: string,
    data: SalesPackageCreateData
  ): Promise<ApiResponse<SalesPackage>> {
    return this.fetchWithAuth<SalesPackage>(
      `/analytics/api/projects/${projectId}/sales-packages/`,
      { method: 'POST', body: JSON.stringify(data) }
    );
  }

  async updateSalesPackage(
    projectId: string,
    packageId: string,
    data: Partial<SalesPackageCreateData>
  ): Promise<ApiResponse<SalesPackage>> {
    return this.fetchWithAuth<SalesPackage>(
      `/analytics/api/projects/${projectId}/sales-packages/${packageId}/`,
      { method: 'PATCH', body: JSON.stringify(data) }
    );
  }

  async deleteSalesPackage(projectId: string, packageId: string): Promise<ApiResponse<void>> {
    return this.fetchWithAuth<void>(
      `/analytics/api/projects/${projectId}/sales-packages/${packageId}/`,
      { method: 'DELETE' }
    );
  }

  async exportSalesPackage(
    projectId: string,
    payload: { bundle_codes: string[]; package_name: string; format: 'excel' | 'json' | 'pdf' }
  ): Promise<Response> {
    const token = this.getAccessToken();
    const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
    return fetch(`${baseURL}/analytics/api/projects/${projectId}/export-sales-package/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });
  }

  async generateListing(
    projectId: string,
    payload: { package_id: string; pattern_override?: SalesPackagePattern | null }
  ): Promise<ApiResponse<{
    teaser: string;
    listing: string;
    tier_report: ListingTierReport;
    suggested_pattern: SalesPackagePattern;
    pattern_used: SalesPackagePattern;
  }>> {
    return this.fetchWithAuth(
      `/analytics/api/projects/${projectId}/generate-listing/`,
      { method: 'POST', body: JSON.stringify(payload) }
    );
  }

  async uploadExcelForBundleAnalysis(
    file: File,
    name?: string
  ): Promise<ApiResponse<{
    project_id: string;
    project_name: string;
    dataset_id: string;
    processing_status: string;
    total_patents: number;
    created: boolean;
  }>> {
    const token = this.getToken();
    const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
    const form = new FormData();
    form.append('file', file);
    if (name) form.append('name', name);
    const resp = await fetch(`${baseURL}/analytics/api/projects/from-excel-upload/`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ error: resp.statusText }));
      return { success: false, error: err.error || 'Upload failed' };
    }
    const data = await resp.json();
    return { success: true, data };
  }
}

// ── Bundle Analysis Types ──────────────────────────────────────────────────

export interface BundleAttributes {
  id: string;
  patent_record_id: string;
  patent_id: string;
  title: string;
  // Group A
  a1_primary_domain: string;
  a2_tech_subcategory: string;
  a3_stack_layer: string;
  a4_subsystem: string;
  a5_use_case: string;
  // Group B
  b1_sep_potential: number;
  b2_standard_tagged: string;
  b3_interface_role: number;
  // Group C
  c1_claim_type: string;
  c2_breadth: number;
  c3_claim_count: number | null;
  c4_design_around_difficulty: number;
  // Group D
  d1_external_detectability: number;
  d2_teardown_detectability: number;
  d3_reads_on_products: number;
  // Group E
  e1_family_size: number;
  e2_prosecution_status: string;
  e3_continuation: boolean | null;
  e4_remaining_term_years: number | null;
  e5_maintenance_status: string;
  // Group F
  f1_jurisdictions: string[];
  f2_trilateral: boolean | null;
  f3_major_market_score: number;
  // Group G
  g1_convergence_theme: string;
  g2_generation_tag: string;
  g3_cross_industry_applicability: number;
  // Group H
  h1_claim_strength: number;
  h2_prior_art_exposure: number;
  h3_prosecution_risk: number;
  h4_divided_infringement_risk: boolean | null;
  h5_forward_citations: number | null;
  h6_backward_citations: number | null;
  h7_litigation_history: string;
  h8_chain_of_title: string;
  h9_eou_availability: string;
  h10_encumbrance_status: string;
  // Group I
  i1_product_mapping_confidence: number;
  i2_implementation_maturity: string;
  i3_adjacent_market_reread: number;
  i4_workaround_complexity: number;
  // Provenance
  derived_fields: string[];
  ai_extracted_fields: string[];
  manually_set_fields: string[];
  last_ai_extraction: string | null;
}

export interface BundleQualityRow {
  bundle_code: string;
  bundle_name: string;
  patent_count: number;
  pioneer_count: number | null;
  strength_flag: 'STRONG' | 'MODERATE' | 'WEAK' | null;
  avg_claim_strength: number | null;
  avg_breadth: number | null;
  pct_trilateral: number | null;
  avg_remaining_term: number | null;
  avg_detectability: number | null;
  avg_forward_citations: number | null;
  pct_sep: number | null;
  pct_continuation_live: number | null;
  gate_weakest_h1: number | null;
  gate_invalidity_exposure_pct: number | null;
  gate_eou_ready_pct: number | null;
  gate_survived_pct: number | null;
  gate_cont_optionality_pct: number | null;
  composition_hint: string;
}

export interface BundleAnalysisSavedState {
  has_result: boolean;
  task_id: string | null;
  task_status: 'queued' | 'running' | 'completed' | 'failed' | 'unknown';
  progress?: { current: number; total: number };
  result: BundleAnalysisResult | null;
}

export interface BundleAnalysisResult {
  project_id: string;
  task_id?: string;
  total_patents: number;
  run_at: string;
  configuration: {
    preset: string;
    thresholds: Record<string, number>;
    enabled_bundles: Record<string, boolean>;
    gate_toggles: Record<string, boolean>;
  };
  attribute_completeness: {
    total: number;
    with_ai_attributes: number;
    with_manual_attributes: number;
    pct_complete: number;
  };
  assignment_matrix: {
    patent_ids: string[];
    patent_titles: string[];
    bundle_codes: string[];
    bundle_names: string[];
    matrix: boolean[][];
    patent_bundle_counts: number[];
    bundle_patent_counts: number[];
  };
  quality_scorecard: BundleQualityRow[];
  qualified_bundles: Array<{
    bundle_code: string;
    bundle_name: string;
    patent_count: number;
    strategy_hint: string;
  }>;
  patent_attribute_summary: Array<{
    patent_id: string;
    patent_record_id: string;
    title: string;
    bundle_count: number;
    bundle_codes: string[];
    attribute_source: 'derived' | 'ai' | 'manual' | 'mixed' | 'none';
    pct_filled: number;
  }>;
}

export interface BundleConfiguration {
  preset: string;
  thresholds: Record<string, number>;
  enabled_bundles: Record<string, boolean>;
  gate_toggles: Record<string, boolean>;
}

export interface AttributeExtractionResult {
  task_id?: string;
  status: 'queued' | 'completed' | 'failed';
  extracted_count?: number;
  failed_count?: number;
  result?: Record<string, unknown>;
}

// Global models interfaces
export interface GlobalCompetitorProfile {
  id: string;
  name: string;
  legal_name: string;
  aliases: string[];
  industry: string;
  headquarters: string;
  website: string;
  description: string;
  total_patents: number;
  active_patents: number;
  patent_applications_pending: number;
  key_technology_areas: string[];
  top_inventors: string[];
  filing_trend_6_months: number;
  avg_citations_per_patent: number;
  patent_quality_score: number;
  competitive_strength: 'low' | 'medium' | 'high';
  market_focus: string[];
  created_at: string;
  updated_at: string;
}

export interface GlobalTechnologyArea {
  id: string;
  name: string;
  description: string;
  ipc_class: string;
  cpc_class: string;
  category: string;
  maturity_level: 'emerging' | 'developing' | 'mature' | 'declining';
  patent_count: number;
  growth_rate_6m: number;
  innovation_score: number;
  market_potential: 'low' | 'medium' | 'high';
  key_players: string[];
  related_technologies: string[];
  created_at: string;
  updated_at: string;
}

// Global API Services
class GlobalAnalyticsApiService extends ApiClient {
  // --- Global Competitors ---
  async getGlobalCompetitors(params?: {
    search?: string;
    industry?: string;
    strength?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<PaginatedResponse<GlobalCompetitorProfile>>> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.set('search', params.search);
    if (params?.industry) queryParams.set('industry', params.industry);
    if (params?.strength) queryParams.set('strength', params.strength);
    const limit = params?.limit || 20;
    const offset = ((params?.page || 1) - 1) * limit;
    queryParams.set('limit', String(limit));
    queryParams.set('offset', String(offset));
    const qs = queryParams.toString();
    return this.fetchWithAuth<PaginatedResponse<GlobalCompetitorProfile>>(
      `/analytics/api/global-competitors/${qs ? '?' + qs : ''}`
    );
  }

  async createGlobalCompetitor(data: Partial<GlobalCompetitorProfile>): Promise<ApiResponse<GlobalCompetitorProfile>> {
    return this.fetchWithAuth<GlobalCompetitorProfile>('/analytics/api/global-competitors/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCompetitorStats(): Promise<ApiResponse<{
    total_competitors: number;
    by_strength: { high: number; medium: number; low: number };
    total_patents: number;
    avg_quality_score: number;
  }>> {
    return this.fetchWithAuth('/analytics/api/global-competitors/stats/');
  }

  async getIndustries(): Promise<ApiResponse<string[]>> {
    return this.fetchWithAuth<string[]>('/analytics/api/global-competitors/industries/');
  }

  // --- Global Technology Areas ---
  async getGlobalTechnologies(params?: {
    search?: string;
    category?: string;
    maturity?: string;
    potential?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<PaginatedResponse<GlobalTechnologyArea>>> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.set('search', params.search);
    if (params?.category) queryParams.set('category', params.category);
    if (params?.maturity) queryParams.set('maturity', params.maturity);
    if (params?.potential) queryParams.set('potential', params.potential);
    const limit = params?.limit || 20;
    const offset = ((params?.page || 1) - 1) * limit;
    queryParams.set('limit', String(limit));
    queryParams.set('offset', String(offset));
    const qs = queryParams.toString();
    return this.fetchWithAuth<PaginatedResponse<GlobalTechnologyArea>>(
      `/analytics/api/global-technology-areas/${qs ? '?' + qs : ''}`
    );
  }

  async createGlobalTechnology(data: Partial<GlobalTechnologyArea>): Promise<ApiResponse<GlobalTechnologyArea>> {
    return this.fetchWithAuth<GlobalTechnologyArea>('/analytics/api/global-technology-areas/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getTechnologyStats(): Promise<ApiResponse<{
    total_technologies: number;
    by_maturity: { emerging: number; developing: number; mature: number; declining: number };
    by_potential: { high: number; medium: number; low: number };
    total_patents: number;
    avg_innovation_score: number;
  }>> {
    return this.fetchWithAuth('/analytics/api/global-technology-areas/stats/');
  }

  async getTechnologyCategories(): Promise<ApiResponse<string[]>> {
    return this.fetchWithAuth<string[]>('/analytics/api/global-technology-areas/categories/');
  }
}

export const analyticsApi = new AnalyticsApiService();
export const globalAnalyticsApi = new GlobalAnalyticsApiService();

// ── Sales Package Types ────────────────────────────────────────────────────

export type SalesPackageTransactionType = 'sale' | 'license' | 'co_dev' | 'cross';
export type SalesPackageStatus = 'draft' | 'ready' | 'sent' | 'closed';
export type SalesPackageArchetype = 'OC-DEF' | 'OC-OFF' | 'OC-EXP' | 'NPE-LIC' | 'NPE-LIT' | 'DEF-AGG' | 'LIT-FIN';
export type SalesPackagePattern = 'A' | 'B' | 'C' | 'D';

export interface MCLEntry {
  id: string;
  domain_tag: string;
  statement: string;
  source: string;
  source_date: string;
}

export interface ListingTierReport {
  t1: number;
  t2: number;
  t3: number;
  t4: number;
  sentences: { text: string; tier: 'T1' | 'T2' | 'T3' | 'T4' }[];
}

export interface SalesPackage {
  id: string;
  project: string;
  name: string;
  description: string;
  bundle_codes: string[];
  transaction_type: SalesPackageTransactionType;
  status: SalesPackageStatus;
  buyer_targets: string;
  notes: string;
  primary_archetype: SalesPackageArchetype | '';
  secondary_archetype: SalesPackageArchetype | '';
  listing_pattern: SalesPackagePattern | '';
  mcl_entries: MCLEntry[];
  generated_teaser: string;
  generated_listing: string;
  listing_tier_report: ListingTierReport | null;
  listing_generated_at: string | null;
  bundle_count: number;
  created_by: string | null;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface SalesPackageCreateData {
  name: string;
  description?: string;
  bundle_codes: string[];
  transaction_type?: SalesPackageTransactionType;
  status?: SalesPackageStatus;
  buyer_targets?: string;
  notes?: string;
  primary_archetype?: SalesPackageArchetype | '';
  secondary_archetype?: SalesPackageArchetype | '';
  listing_pattern?: SalesPackagePattern | '';
  mcl_entries?: MCLEntry[];
}