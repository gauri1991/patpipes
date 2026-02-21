/**
 * Analytics Service
 * API service for analytics projects, visualizations, reports, and insights
 */

import { ApiClient } from '@/services/apiClient';

// Analytics Types
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
  data_source: 'manual_upload' | 'api_import' | 'database_query' | 'web_scraping';
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  processing_progress: number;
  processing_log: Array<{
    timestamp: string;
    level: string;
    message: string;
    details?: any;
  }>;
  total_patents: number;
  processed_patents: number;
  classification_confidence: number;
  technology_distribution: Record<string, number>;
  temporal_distribution: Record<string, number>;
  geographic_distribution: Record<string, number>;
  assignee_distribution: Record<string, number>;
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
  technology_focus: Record<string, number>;
  filing_trends: Record<string, number>;
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
  monthly_project_trends: Array<{
    month: string;
    projects: number;
  }>;
  completion_rate_trend: Array<{
    month: string;
    rate: number;
  }>;
}

export interface ChartTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
}

export interface ReportTemplate {
  type: string;
  name: string;
  description: string;
  sections: string[];
}

// Request/Response interfaces
export interface CreateAnalyticsProjectRequest {
  name: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to?: string;
  start_date?: string;
  due_date?: string;
  analysis_scope?: Record<string, any>;
}

export interface CreateTechnologyAreaRequest {
  project: string;
  name: string;
  description?: string;
  keywords?: string[];
  ipc_classes?: string[];
  cpc_classes?: string[];
  search_queries?: string[];
  confidence_threshold?: number;
}

export interface CreatePatentDatasetRequest {
  project: string;
  name: string;
  description?: string;
  data_source: 'manual_upload' | 'api_import' | 'database_query' | 'web_scraping';
  data_file?: File;
}

export interface CreateCompetitorProfileRequest {
  project: string;
  name: string;
  legal_name?: string;
  aliases?: string[];
  industry?: string;
  headquarters?: string;
  website?: string;
  description?: string;
}

export interface CreateVisualizationRequest {
  project: string;
  title: string;
  description?: string;
  visualization_type: string;
  config?: Record<string, any>;
  filters?: Record<string, any>;
  width?: number;
  height?: number;
  is_interactive?: boolean;
}

export interface CreateReportRequest {
  project: string;
  title: string;
  report_type: string;
  include_sections?: string[];
  template_config?: Record<string, any>;
}

class AnalyticsService extends ApiClient {
  private baseUrl = '/analytics/api';

  constructor() {
    super();
  }

  // Analytics Projects
  async getDashboard(): Promise<AnalyticsDashboard> {
    try {
      const response = await this.fetchWithAuth<AnalyticsDashboard>(`${this.baseUrl}/projects/dashboard/`);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to fetch dashboard data');
    } catch (error) {
      console.error('Failed to fetch analytics dashboard:', error);
      // Return mock data as fallback
      return this.getMockDashboard();
    }
  }

  async getAnalyticsProjects(params?: {
    search?: string;
    status?: string;
    priority?: string;
    page?: number;
    page_size?: number;
  }): Promise<{ results: AnalyticsProject[]; count: number }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.search) queryParams.append('search', params.search);
      if (params?.status) queryParams.append('status', params.status);
      if (params?.priority) queryParams.append('priority', params.priority);
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.page_size) queryParams.append('page_size', params.page_size.toString());

      const url = `${this.baseUrl}/projects/${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await this.fetchWithAuth<{ results: AnalyticsProject[]; count: number }>(url);
      
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to fetch analytics projects');
    } catch (error) {
      console.error('Failed to fetch analytics projects:', error);
      // Return mock data as fallback
      return this.getMockProjects();
    }
  }

  async getAnalyticsProject(id: string): Promise<AnalyticsProject> {
    try {
      const response = await this.fetchWithAuth<AnalyticsProject>(`${this.baseUrl}/projects/${id}/`);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to fetch analytics project');
    } catch (error) {
      console.error('Failed to fetch analytics project:', error);
      throw new Error('Failed to fetch analytics project');
    }
  }

  async createAnalyticsProject(data: CreateAnalyticsProjectRequest): Promise<AnalyticsProject> {
    try {
      const response = await this.fetchWithAuth<AnalyticsProject>(`${this.baseUrl}/projects/`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to create analytics project');
    } catch (error) {
      console.error('Failed to create analytics project:', error);
      throw new Error('Failed to create analytics project');
    }
  }

  async updateAnalyticsProject(id: string, data: Partial<CreateAnalyticsProjectRequest>): Promise<AnalyticsProject> {
    try {
      const response = await this.fetchWithAuth<AnalyticsProject>(`${this.baseUrl}/projects/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(data)
      });
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to update analytics project');
    } catch (error) {
      console.error('Failed to update analytics project:', error);
      throw new Error('Failed to update analytics project');
    }
  }

  async deleteAnalyticsProject(id: string): Promise<void> {
    try {
      const response = await this.fetchWithAuth(`${this.baseUrl}/projects/${id}/`, {
        method: 'DELETE'
      });
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete analytics project');
      }
    } catch (error) {
      console.error('Failed to delete analytics project:', error);
      throw new Error('Failed to delete analytics project');
    }
  }

  async startAnalysis(id: string): Promise<{ status: string; project_id: string }> {
    try {
      const response = await this.fetchWithAuth<{ status: string; project_id: string }>(`${this.baseUrl}/projects/${id}/start_analysis/`, {
        method: 'POST'
      });
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to start analysis');
    } catch (error) {
      console.error('Failed to start analysis:', error);
      throw new Error('Failed to start analysis');
    }
  }

  // Technology Areas
  async getTechnologyAreas(projectId: string): Promise<TechnologyArea[]> {
    try {
      const response = await this.fetchWithAuth<{ results: TechnologyArea[] }>(`${this.baseUrl}/technology-areas/?project_id=${projectId}`);
      if (response.success && response.data) {
        return response.data.results || [];
      }
      throw new Error(response.error || 'Failed to fetch technology areas');
    } catch (error) {
      console.error('Failed to fetch technology areas:', error);
      return [];
    }
  }

  async createTechnologyArea(data: CreateTechnologyAreaRequest): Promise<TechnologyArea> {
    try {
      const response = await this.fetchWithAuth<TechnologyArea>(`${this.baseUrl}/technology-areas/`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to create technology area');
    } catch (error) {
      console.error('Failed to create technology area:', error);
      throw new Error('Failed to create technology area');
    }
  }

  // Patent Datasets
  async getPatentDatasets(projectId: string): Promise<PatentDataset[]> {
    try {
      const response = await this.fetchWithAuth<{ results: PatentDataset[] }>(`${this.baseUrl}/datasets/?project_id=${projectId}`);
      if (response.success && response.data) {
        return response.data.results || [];
      }
      throw new Error(response.error || 'Failed to fetch patent datasets');
    } catch (error) {
      console.error('Failed to fetch patent datasets:', error);
      return [];
    }
  }

  async createPatentDataset(data: CreatePatentDatasetRequest): Promise<PatentDataset> {
    try {
      const formData = new FormData();
      formData.append('project', data.project);
      formData.append('name', data.name);
      if (data.description) formData.append('description', data.description);
      formData.append('data_source', data.data_source);
      if (data.data_file) formData.append('data_file', data.data_file);

      const response = await this.fetchWithAuth<PatentDataset>(`${this.baseUrl}/datasets/`, {
        method: 'POST',
        body: formData,
        headers: {} // Let browser set Content-Type for FormData
      });
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to create patent dataset');
    } catch (error) {
      console.error('Failed to create patent dataset:', error);
      throw new Error('Failed to create patent dataset');
    }
  }

  async processDataset(id: string): Promise<{ status: string; dataset_id: string }> {
    try {
      const response = await this.fetchWithAuth<{ status: string; dataset_id: string }>(`${this.baseUrl}/datasets/${id}/process_data/`, {
        method: 'POST'
      });
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to start dataset processing');
    } catch (error) {
      console.error('Failed to start dataset processing:', error);
      throw new Error('Failed to start dataset processing');
    }
  }

  // Competitor Profiles
  async getCompetitorProfiles(projectId: string): Promise<CompetitorProfile[]> {
    try {
      const response = await this.fetchWithAuth<{ results: CompetitorProfile[] }>(`${this.baseUrl}/competitors/?project_id=${projectId}`);
      if (response.success && response.data) {
        return response.data.results || [];
      }
      throw new Error(response.error || 'Failed to fetch competitor profiles');
    } catch (error) {
      console.error('Failed to fetch competitor profiles:', error);
      return [];
    }
  }

  async createCompetitorProfile(data: CreateCompetitorProfileRequest): Promise<CompetitorProfile> {
    try {
      const response = await this.fetchWithAuth<CompetitorProfile>(`${this.baseUrl}/competitors/`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to create competitor profile');
    } catch (error) {
      console.error('Failed to create competitor profile:', error);
      throw new Error('Failed to create competitor profile');
    }
  }

  // Visualizations
  async getVisualizations(projectId?: string): Promise<AnalyticsVisualization[]> {
    try {
      const url = projectId 
        ? `${this.baseUrl}/visualizations/?project_id=${projectId}`
        : `${this.baseUrl}/visualizations/`;
      const response = await this.fetchWithAuth<{ results: AnalyticsVisualization[] }>(url);
      if (response.success && response.data) {
        return response.data.results || [];
      }
      throw new Error(response.error || 'Failed to fetch visualizations');
    } catch (error) {
      console.error('Failed to fetch visualizations:', error);
      return [];
    }
  }

  async createVisualization(data: CreateVisualizationRequest): Promise<AnalyticsVisualization> {
    try {
      const response = await this.fetchWithAuth<AnalyticsVisualization>(`${this.baseUrl}/visualizations/`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to create visualization');
    } catch (error) {
      console.error('Failed to create visualization:', error);
      throw new Error('Failed to create visualization');
    }
  }

  async generateChart(id: string): Promise<{ status: string; chart_data: any }> {
    try {
      const response = await this.fetchWithAuth<{ status: string; chart_data: any }>(`${this.baseUrl}/visualizations/${id}/generate_chart/`, {
        method: 'POST'
      });
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to generate chart');
    } catch (error) {
      console.error('Failed to generate chart:', error);
      throw new Error('Failed to generate chart');
    }
  }

  async getChartTemplates(): Promise<ChartTemplate[]> {
    try {
      const response = await this.fetchWithAuth<ChartTemplate[]>(`${this.baseUrl}/visualizations/chart_templates/`);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to fetch chart templates');
    } catch (error) {
      console.error('Failed to fetch chart templates:', error);
      return [];
    }
  }

  // Reports
  async getReports(projectId?: string): Promise<AnalyticsReport[]> {
    try {
      const url = projectId 
        ? `${this.baseUrl}/reports/?project_id=${projectId}`
        : `${this.baseUrl}/reports/`;
      const response = await this.fetchWithAuth<{ results: AnalyticsReport[] }>(url);
      if (response.success && response.data) {
        return response.data.results || [];
      }
      throw new Error(response.error || 'Failed to fetch reports');
    } catch (error) {
      console.error('Failed to fetch reports:', error);
      return [];
    }
  }

  async createReport(data: CreateReportRequest): Promise<AnalyticsReport> {
    try {
      const response = await this.fetchWithAuth<AnalyticsReport>(`${this.baseUrl}/reports/`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to create report');
    } catch (error) {
      console.error('Failed to create report:', error);
      throw new Error('Failed to create report');
    }
  }

  async generateReport(id: string): Promise<{ status: string; report_id: string }> {
    try {
      const response = await this.fetchWithAuth<{ status: string; report_id: string }>(`${this.baseUrl}/reports/${id}/generate_report/`, {
        method: 'POST'
      });
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to generate report');
    } catch (error) {
      console.error('Failed to generate report:', error);
      throw new Error('Failed to generate report');
    }
  }

  async getReportTemplates(): Promise<ReportTemplate[]> {
    try {
      const response = await this.fetchWithAuth<ReportTemplate[]>(`${this.baseUrl}/reports/report_templates/`);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to fetch report templates');
    } catch (error) {
      console.error('Failed to fetch report templates:', error);
      return [];
    }
  }

  // Insights
  async getInsights(projectId?: string): Promise<AnalyticsInsight[]> {
    try {
      const url = projectId 
        ? `${this.baseUrl}/insights/?project_id=${projectId}`
        : `${this.baseUrl}/insights/`;
      const response = await this.fetchWithAuth<{ results: AnalyticsInsight[] }>(url);
      if (response.success && response.data) {
        return response.data.results || [];
      }
      throw new Error(response.error || 'Failed to fetch insights');
    } catch (error) {
      console.error('Failed to fetch insights:', error);
      return [];
    }
  }

  // Mock data methods (for fallback during development)
  private getMockDashboard(): AnalyticsDashboard {
    return {
      total_projects: 12,
      active_projects: 8,
      completed_projects: 4,
      total_datasets: 25,
      total_patents_analyzed: 15420,
      total_visualizations: 34,
      recent_projects: [],
      recent_insights: [],
      projects_by_status: {
        'active': 5,
        'completed': 4,
        'data_collection': 2,
        'visualization': 1
      },
      projects_by_type: {
        'landscape_analysis': 6,
        'competitive_intelligence': 4,
        'fto_analysis': 2
      },
      technology_areas_distribution: {
        'AI/Machine Learning': 25,
        'Biotechnology': 20,
        'Electronics': 18,
        'Software': 15,
        'Energy': 12,
        'Materials': 10
      },
      monthly_project_trends: [
        { month: '2024-01', projects: 5 },
        { month: '2024-02', projects: 8 },
        { month: '2024-03', projects: 12 },
        { month: '2024-04', projects: 15 },
        { month: '2024-05', projects: 18 },
        { month: '2024-06', projects: 22 }
      ],
      completion_rate_trend: [
        { month: '2024-01', rate: 75 },
        { month: '2024-02', rate: 82 },
        { month: '2024-03', rate: 78 },
        { month: '2024-04', rate: 85 },
        { month: '2024-05', rate: 90 },
        { month: '2024-06', rate: 88 }
      ]
    };
  }

  private getMockProjects(): { results: AnalyticsProject[]; count: number } {
    const projects: AnalyticsProject[] = [
      {
        id: '1',
        name: 'AI Patent Landscape Analysis',
        description: 'Comprehensive analysis of AI patent landscape focusing on machine learning and neural networks',
        status: 'active',
        priority: 'high',
        created_by: {
          id: '1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@company.com',
          role: 'analyst'
        },
        start_date: '2024-06-01',
        due_date: '2024-08-15',
        analysis_scope: {
          technology_areas: ['Machine Learning', 'Neural Networks', 'Deep Learning'],
          date_range: { start: '2020-01-01', end: '2024-06-30' },
          jurisdictions: ['US', 'EP', 'CN']
        },
        progress_percentage: 65,
        technology_areas: [],
        datasets: [],
        competitors: [],
        visualizations: [],
        reports: [],
        insights: [],
        created_at: '2024-06-01T10:00:00Z',
        updated_at: '2024-06-15T14:30:00Z'
      },
      {
        id: '2',
        name: 'Biotech Competitive Intelligence',
        description: 'Competitor analysis in biotechnology and pharmaceutical patents',
        status: 'data_collection',
        priority: 'medium',
        created_by: {
          id: '2',
          firstName: 'Sarah',
          lastName: 'Wilson',
          email: 'sarah.wilson@company.com',
          role: 'analyst'
        },
        start_date: '2024-06-15',
        due_date: '2024-09-01',
        analysis_scope: {
          technology_areas: ['Biotechnology', 'Pharmaceuticals', 'Gene Therapy'],
          competitors: ['Pfizer', 'Novartis', 'Roche', 'Johnson & Johnson']
        },
        progress_percentage: 35,
        technology_areas: [],
        datasets: [],
        competitors: [],
        visualizations: [],
        reports: [],
        insights: [],
        created_at: '2024-06-15T09:00:00Z',
        updated_at: '2024-06-20T11:15:00Z'
      }
    ];

    return { results: projects, count: projects.length };
  }
}

export const analyticsService = new AnalyticsService();