/**
 * Analytics API Service
 * Handles all analytics-related API calls
 */

import { ApiResponse, ApiClient } from './apiClient';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface AnalyticsProject {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'active' | 'scope_definition' | 'data_collection' | 'patent_analysis' | 'visualization' | 'report_generation' | 'completed' | 'on_hold' | 'cancelled';
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
  processing_log: any[];
  total_patents: number;
  processed_patents: number;
  classification_confidence: number;
  technology_distribution: Record<string, number>;
  temporal_distribution: Record<string, number>;
  geographic_distribution: Record<string, number>;
  assignee_distribution: Record<string, number>;
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
  total_visualizations: number;
  recent_projects: AnalyticsProject[];
  recent_insights: AnalyticsInsight[];
  projects_by_status: Record<string, number>;
  projects_by_type: Record<string, number>;
  technology_areas_distribution: Record<string, number>;
  monthly_project_trends: Array<{month: string, projects: number}>;
  completion_rate_trend: Array<{month: string, rate: number}>;
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

class AnalyticsApiService extends ApiClient {
  // Projects
  async getProjects(): Promise<ApiResponse<AnalyticsProject[]>> {
    return this.fetchWithAuth<AnalyticsProject[]>('/analytics/api/projects/');
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
  async getDatasets(projectId?: string): Promise<ApiResponse<PatentDataset[]>> {
    const params = projectId ? `?project_id=${projectId}` : '';
    return this.fetchWithAuth<PatentDataset[]>(`/analytics/api/datasets/${params}`);
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
  async getTechnologyAreas(projectId?: string): Promise<ApiResponse<TechnologyArea[]>> {
    const params = projectId ? `?project_id=${projectId}` : '';
    return this.fetchWithAuth<TechnologyArea[]>(`/analytics/api/technology-areas/${params}`);
  }

  async createTechnologyArea(data: Partial<TechnologyArea>): Promise<ApiResponse<TechnologyArea>> {
    return this.fetchWithAuth<TechnologyArea>('/analytics/api/technology-areas/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Competitors
  async getCompetitors(projectId?: string): Promise<ApiResponse<CompetitorProfile[]>> {
    const params = projectId ? `?project_id=${projectId}` : '';
    return this.fetchWithAuth<CompetitorProfile[]>(`/analytics/api/competitors/${params}`);
  }

  async createCompetitor(data: Partial<CompetitorProfile>): Promise<ApiResponse<CompetitorProfile>> {
    return this.fetchWithAuth<CompetitorProfile>('/analytics/api/competitors/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Visualizations
  async getVisualizations(projectId?: string): Promise<ApiResponse<AnalyticsVisualization[]>> {
    const params = projectId ? `?project_id=${projectId}` : '';
    return this.fetchWithAuth<AnalyticsVisualization[]>(`/analytics/api/visualizations/${params}`);
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
  async getReports(projectId?: string): Promise<ApiResponse<AnalyticsReport[]>> {
    const params = projectId ? `?project_id=${projectId}` : '';
    return this.fetchWithAuth<AnalyticsReport[]>(`/analytics/api/reports/${params}`);
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

  // Presentations
  async getPresentations(projectId?: string): Promise<ApiResponse<AnalyticsPresentation[]>> {
    const params = projectId ? `?project_id=${projectId}` : '';
    return this.fetchWithAuth<AnalyticsPresentation[]>(`/analytics/api/presentations/${params}`);
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
    const response = await fetch(`${API_BASE_URL}/api/v1/analytics/api/presentations/${presentationId}/export_pptx/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.getToken()}`,
      },
    });
    return response.blob();
  }

  async exportPresentationPDF(presentationId: string): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/api/v1/analytics/api/presentations/${presentationId}/export_pdf/`, {
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
  async getInsights(projectId?: string): Promise<ApiResponse<AnalyticsInsight[]>> {
    const params = projectId ? `?project_id=${projectId}` : '';
    return this.fetchWithAuth<AnalyticsInsight[]>(`/analytics/api/insights/${params}`);
  }

  async createInsight(data: Partial<AnalyticsInsight>): Promise<ApiResponse<AnalyticsInsight>> {
    return this.fetchWithAuth<AnalyticsInsight>('/analytics/api/insights/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
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