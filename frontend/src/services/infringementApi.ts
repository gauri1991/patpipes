/**
 * Infringement Analysis API Service
 * Handles all API interactions for patent infringement analysis
 */

import { ApiClient, ApiResponse } from './apiClient';

// ==================== Type Definitions ====================

export interface PatentBrief {
  id: string;
  title: string;
  patent_number: string | null;
  assignees?: string[];
  portfolio_id: string | null;
  portfolio_name: string | null;
}

export interface InfringementCase {
  id: string;
  case_name: string;
  case_number?: string;
  description: string;
  status: 'draft' | 'active' | 'review' | 'completed' | 'on_hold' | 'closed';
  analysis_type: 'literal' | 'doe' | 'induced' | 'contributory' | 'willful';
  risk_level: 'low' | 'medium' | 'high' | 'critical';

  // Patent FK
  patent?: string | null;
  patent_detail?: PatentBrief | null;
  patent_portfolio_id?: string | null;

  // Patent information
  patent_number: string;
  patent_title: string;
  patent_abstract?: string;
  patent_url?: string;

  // Accused product/service
  accused_product_name: string;
  accused_product_description: string;
  accused_party_name: string;
  accused_party_url?: string;

  // Analysis results
  infringement_likelihood: number;
  confidence_level: number;

  // Dates
  analysis_date?: string;
  discovery_date?: string;

  // Team
  analyst?: User;
  assigned_attorney?: User;

  // Additional
  notes?: string;
  is_confidential: boolean;

  // Case-wide claim term → hex color map (for term highlighting + annotation palette)
  claim_term_colors?: Record<string, string>;

  // Metadata
  created_at: string;
  updated_at: string;
  created_by?: User;

  // Nested relationships
  claim_mappings?: ClaimMapping[];
  evidence?: Evidence[];
  risk_assessments?: RiskAssessment[];
  reports?: InfringementReport[];
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role?: string;
}

export interface EvidenceBrief {
  id: string;
  title: string;
  evidence_type: string;
  url: string;
  has_file: boolean;
}

export interface ClaimElement {
  id: string;
  claim_mapping: string;
  element_order: number;
  element_text: string;
  element_type: 'preamble' | 'body' | 'transition';
  accused_feature: string;
  accused_feature_description: string;
  meets_limitation: boolean | null;
  analysis_notes?: string;
  doe_function?: string;
  doe_way?: string;
  doe_result?: string;
  doe_score?: number;
  evidence_references?: string[];
  linked_evidence?: EvidenceBrief[];
  screenshots?: ScreenshotBrief[];
  is_ai_generated?: boolean;
  review_status?: 'confirmed' | 'ai_draft' | 'edited';
  created_at: string;
  updated_at: string;
  created_by?: User;
}

export interface ClaimMapping {
  id: string;
  case: string;
  claim_number: string;
  claim_text: string;
  claim_type: string;
  product_feature: string;
  product_feature_description: string;
  mapping_type: 'literal' | 'equivalent' | 'similar' | 'no_match';
  match_confidence: number;
  analysis_notes?: string;
  limitations_met: boolean;
  evidence_references: string[];
  linked_evidence?: EvidenceBrief[];
  is_ai_generated?: boolean;
  review_status?: 'confirmed' | 'ai_draft' | 'edited';
  elements?: ClaimElement[];
  created_at: string;
  updated_at: string;
  created_by?: User;
}

export interface ElementSummary {
  claim_mapping_id: string;
  total_elements: number;
  elements_met: number;
  elements_not_met: number;
  elements_unknown: number;
  overall_score: number;
  all_limitations_met: boolean;
}

export interface Evidence {
  id: string;
  case: string;
  title: string;
  description: string;
  evidence_type: 'product_doc' | 'patent_doc' | 'technical_spec' | 'marketing' | 'source_code' | 'screenshot' | 'photo' | 'video' | 'testimony' | 'research' | 'other';
  file?: string;
  url?: string;
  relevance_score: number;
  related_claims: string[];
  source?: string;
  date_obtained?: string;
  created_at: string;
  updated_at: string;
  uploaded_by?: User;
}

// A vector callout drawn on a screenshot. Coords are normalized 0-1 to the image.
export interface Annotation {
  id: string;
  type: 'line' | 'arrow' | 'box';
  color: string;
  stroke?: number;                              // thickness in px
  lineStyle?: 'solid' | 'dashed' | 'dotted';    // stroke pattern
  // line / arrow
  x1?: number; y1?: number; x2?: number; y2?: number;
  // box
  x?: number; y?: number; w?: number; h?: number;
}

export interface EvidenceScreenshot {
  id: string;
  case: string;
  evidence: string;
  claim_elements: string[];
  claim_element_labels?: { id: string; label: string }[];
  image: string;
  page_number: number;
  bbox_x: number;
  bbox_y: number;
  bbox_width: number;
  bbox_height: number;
  caption?: string;
  annotations?: Annotation[];
  created_at: string;
  created_by?: User;
}

// Brief shape returned on ClaimElement.screenshots
export interface ScreenshotBrief {
  id: string;
  image: string;
  page_number: number;
  caption?: string;
  evidence_id?: string;
  evidence_title?: string;
  bbox?: { x: number; y: number; width: number; height: number };
  annotations?: Annotation[];
  claim_elements?: string[];
}

export interface RiskAssessment {
  id: string;
  case: string;
  risk_factor: 'technical' | 'legal' | 'financial' | 'strategic' | 'validity' | 'enforceability';
  risk_score: number;
  description: string;
  mitigation_strategy?: string;
  estimated_damages_min?: number;
  estimated_damages_max?: number;
  litigation_cost_estimate?: number;
  assessed_date: string;
  assessed_by?: User;
  created_at: string;
  updated_at: string;
}

export interface InfringementReport {
  id: string;
  case: string;
  title: string;
  report_type: 'preliminary' | 'detailed' | 'claim_chart' | 'risk_assessment' | 'executive_summary';
  status: 'draft' | 'review' | 'final' | 'archived';
  summary?: string;
  findings?: string;
  conclusion?: string;
  recommendations?: string;
  pdf_file?: string;
  reviewed_by?: User;
  reviewed_date?: string;
  review_notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: User;
}

export interface DashboardStats {
  total_cases: number;
  active_cases: number;
  high_risk_cases: number;
  critical_risk_cases: number;
  avg_infringement_likelihood: number;
  cases_by_status: Record<string, number>;
  cases_by_risk: Record<string, number>;
}

export interface RiskFactorData {
  weight: number;
  score: number;
  assessed: boolean;
  description?: string;
  mitigation?: string;
}

export interface DamagesAnalysis {
  id: string;
  case: string;
  damages_theory: 'lost_profits' | 'reasonable_royalty' | 'hybrid';
  market_size?: number;
  accused_product_revenue?: number;
  accused_product_units?: number;
  profit_margin_percent?: number;
  lost_profits_amount?: number;
  but_for_analysis?: string;
  royalty_base?: number;
  royalty_rate_percent?: number;
  comparable_licenses?: Array<{
    licensor: string;
    licensee: string;
    rate: number;
    date: string;
  }>;
  gp_factors?: Record<string, string>;
  is_willful: boolean;
  willfulness_multiplier: number;
  willfulness_justification?: string;
  estimated_damages_low?: number;
  estimated_damages_high?: number;
  analysis_date?: string;
  assumptions?: string;
  calculated_damages?: {
    base_damages: number;
    multiplier: number;
    total_damages: number;
  };
  created_at: string;
  updated_at: string;
  created_by?: User;
}

export interface RiskAnalysisResult {
  case_id: string;
  case_name: string;
  overall_risk_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  risk_factors: Record<string, RiskFactorData>;
  damages_estimate: {
    min: number | null;
    max: number | null;
    litigation_cost: number | null;
  };
  recommendations: Array<{
    factor: string;
    risk_level: string;
    recommendation: string;
    priority: 'urgent' | 'high' | 'medium' | 'low';
  }>;
  infringement_likelihood: number;
  confidence_level: number;
  analysis_complete: boolean;
}

export interface AutoImportClaimsResponse {
  status: 'existing' | 'imported' | 'no_claims' | 'no_patent_number' | 'not_found' | 'error';
  claim_mappings?: ClaimMapping[];
  count?: number;
  message?: string;
}

// ==================== API Service Class ====================

class InfringementApiService extends ApiClient {
  private readonly BASE_PATH = '/infringement';

  // ==================== Cases ====================

  async getCases(params?: {
    status?: string;
    analysis_type?: string;
    risk_level?: string;
    patent_number?: string;
    accused_party_name?: string;
    search?: string;
    page?: number;
    page_size?: number;
  }): Promise<ApiResponse<InfringementCase[]>> {
    return this.get<InfringementCase[]>(`${this.BASE_PATH}/cases/`, { params });
  }

  async getCase(id: string): Promise<ApiResponse<InfringementCase>> {
    return this.get<InfringementCase>(`${this.BASE_PATH}/cases/${id}/`);
  }

  // Extract antecedent-basis claim terms and assign consistent colors (heuristic/spaCy).
  async extractClaimTerms(id: string, strategy = 'antecedent'): Promise<ApiResponse<{ claim_term_colors: Record<string, string>; count: number }>> {
    return this.post(`${this.BASE_PATH}/cases/${id}/extract-claim-terms/`, { strategy });
  }

  // Manually override one term's color.
  async setClaimTermColor(id: string, term: string, color: string): Promise<ApiResponse<{ claim_term_colors: Record<string, string> }>> {
    return this.post(`${this.BASE_PATH}/cases/${id}/set-term-color/`, { term, color });
  }

  // Add a missed term (un-excludes it).
  async addClaimTerm(id: string, term: string, color?: string): Promise<ApiResponse<{ claim_term_colors: Record<string, string>; claim_term_excluded: string[] }>> {
    return this.post(`${this.BASE_PATH}/cases/${id}/add-term/`, { term, ...(color ? { color } : {}) });
  }

  // Remove a term (excludes it so auto-extraction won't re-add it).
  async removeClaimTerm(id: string, term: string): Promise<ApiResponse<{ claim_term_colors: Record<string, string>; claim_term_excluded: string[] }>> {
    return this.post(`${this.BASE_PATH}/cases/${id}/remove-term/`, { term });
  }

  // Rename a term; merges if the new term already exists.
  async renameClaimTerm(id: string, term: string, newTerm: string): Promise<ApiResponse<{ claim_term_colors: Record<string, string>; claim_term_excluded: string[] }>> {
    return this.post(`${this.BASE_PATH}/cases/${id}/rename-term/`, { term, new_term: newTerm });
  }

  async createCase(data: Partial<InfringementCase>): Promise<ApiResponse<InfringementCase>> {
    return this.post<InfringementCase>(`${this.BASE_PATH}/cases/`, data);
  }

  async updateCase(id: string, data: Partial<InfringementCase>): Promise<ApiResponse<InfringementCase>> {
    return this.patch<InfringementCase>(`${this.BASE_PATH}/cases/${id}/`, data);
  }

  async deleteCase(id: string): Promise<ApiResponse<void>> {
    return this.delete<void>(`${this.BASE_PATH}/cases/${id}/`);
  }

  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    return this.get<DashboardStats>(`${this.BASE_PATH}/cases/dashboard_stats/`);
  }

  async updateRiskLevel(caseId: string, riskLevel: string): Promise<ApiResponse<InfringementCase>> {
    return this.post<InfringementCase>(`${this.BASE_PATH}/cases/${caseId}/update_risk_level/`, { risk_level: riskLevel });
  }

  async createFromPatent(data: {
    patent_id: string;
    case_name?: string;
    accused_product_name?: string;
    accused_product_description?: string;
    accused_party_name?: string;
    analysis_type?: string;
  }): Promise<ApiResponse<InfringementCase>> {
    return this.post<InfringementCase>(`${this.BASE_PATH}/cases/create_from_patent/`, data);
  }

  // ==================== Claim Mappings ====================

  async getClaimMappings(params?: {
    case?: string;
    mapping_type?: string;
    limitations_met?: boolean;
  }): Promise<ApiResponse<ClaimMapping[]>> {
    return this.get<ClaimMapping[]>(`${this.BASE_PATH}/claim-mappings/`, { params });
  }

  async createClaimMapping(data: Partial<ClaimMapping>): Promise<ApiResponse<ClaimMapping>> {
    return this.post<ClaimMapping>(`${this.BASE_PATH}/claim-mappings/`, data);
  }

  async updateClaimMapping(id: string, data: Partial<ClaimMapping>): Promise<ApiResponse<ClaimMapping>> {
    return this.patch<ClaimMapping>(`${this.BASE_PATH}/claim-mappings/${id}/`, data);
  }

  async deleteClaimMapping(id: string): Promise<ApiResponse<void>> {
    return this.delete<void>(`${this.BASE_PATH}/claim-mappings/${id}/`);
  }

  async getClaimMappingElements(claimMappingId: string): Promise<ApiResponse<ClaimElement[]>> {
    return this.get<ClaimElement[]>(`${this.BASE_PATH}/claim-mappings/${claimMappingId}/elements/`);
  }

  // Draft an element-by-element claim→product mapping for analyst review.
  async generateClaimMapping(claimMappingId: string, useLlm = false, productDescription?: string): Promise<ApiResponse<{ summary: string; elements: ClaimElement[]; count: number; ai_draft: boolean }>> {
    return this.post(`${this.BASE_PATH}/claim-mappings/${claimMappingId}/generate-mapping/`, {
      use_llm: useLlm,
      ...(productDescription ? { product_description: productDescription } : {}),
    });
  }

  async getElementSummary(claimMappingId: string): Promise<ApiResponse<ElementSummary>> {
    return this.get<ElementSummary>(`${this.BASE_PATH}/claim-mappings/${claimMappingId}/element_summary/`);
  }

  // ==================== Claim Elements ====================

  async getClaimElements(params?: {
    claim_mapping?: string;
    element_type?: string;
    meets_limitation?: boolean;
  }): Promise<ApiResponse<ClaimElement[]>> {
    return this.get<ClaimElement[]>(`${this.BASE_PATH}/claim-elements/`, { params });
  }

  async createClaimElement(data: Partial<ClaimElement>): Promise<ApiResponse<ClaimElement>> {
    return this.post<ClaimElement>(`${this.BASE_PATH}/claim-elements/`, data);
  }

  async updateClaimElement(id: string, data: Partial<ClaimElement>): Promise<ApiResponse<ClaimElement>> {
    return this.patch<ClaimElement>(`${this.BASE_PATH}/claim-elements/${id}/`, data);
  }

  async deleteClaimElement(id: string): Promise<ApiResponse<void>> {
    return this.delete<void>(`${this.BASE_PATH}/claim-elements/${id}/`);
  }

  async analyzeElementDoE(id: string, data: {
    doe_function?: string;
    doe_way?: string;
    doe_result?: string;
    doe_score?: number;
  }): Promise<ApiResponse<ClaimElement>> {
    return this.post<ClaimElement>(`${this.BASE_PATH}/claim-elements/${id}/analyze_doe/`, data);
  }

  async bulkCreateElements(claimMappingId: string, elements: Array<Partial<ClaimElement>>): Promise<ApiResponse<ClaimElement[]>> {
    return this.post<ClaimElement[]>(`${this.BASE_PATH}/claim-elements/bulk_create/`, {
      claim_mapping_id: claimMappingId,
      elements
    });
  }

  // ==================== Evidence ====================

  async getEvidence(params?: {
    case?: string;
    evidence_type?: string;
    search?: string;
  }): Promise<ApiResponse<Evidence[]>> {
    return this.get<Evidence[]>(`${this.BASE_PATH}/evidence/`, { params });
  }

  async getEvidenceItem(id: string): Promise<ApiResponse<Evidence>> {
    return this.get<Evidence>(`${this.BASE_PATH}/evidence/${id}/`);
  }

  async createEvidence(data: FormData | Partial<Evidence>): Promise<ApiResponse<Evidence>> {
    if (data instanceof FormData) {
      return this.post<Evidence>(`${this.BASE_PATH}/evidence/`, data);
    }
    return this.post<Evidence>(`${this.BASE_PATH}/evidence/`, data);
  }

  async updateEvidence(id: string, data: Partial<Evidence>): Promise<ApiResponse<Evidence>> {
    return this.patch<Evidence>(`${this.BASE_PATH}/evidence/${id}/`, data);
  }

  // Assisted evidence sourcing: fetch a product URL server-side and return ranked
  // candidate passages (nothing persisted). LLM ranking gated by the backend switch.
  async suggestEvidenceFromUrl(params: {
    url: string;
    claim_mapping_id?: string;
    claim_text?: string;
    use_llm?: boolean;
  }): Promise<ApiResponse<{ source_url: string; title: string; candidates: Array<{ text: string; score: number; reason: string }>; count: number }>> {
    return this.post(`${this.BASE_PATH}/evidence/suggest-from-url/`, params);
  }

  // ==================== Evidence Screenshots (EoU regions) ====================

  async getScreenshots(params?: { case?: string; evidence?: string; claim_elements?: string }): Promise<ApiResponse<EvidenceScreenshot[]>> {
    return this.get<EvidenceScreenshot[]>(`${this.BASE_PATH}/screenshots/`, { params });
  }

  // Create from a FormData (image PNG + evidence + page_number + bbox + repeated claim_elements).
  async createScreenshot(data: FormData): Promise<ApiResponse<EvidenceScreenshot>> {
    return this.post<EvidenceScreenshot>(`${this.BASE_PATH}/screenshots/`, data);
  }

  async updateScreenshot(id: string, data: Partial<EvidenceScreenshot>): Promise<ApiResponse<EvidenceScreenshot>> {
    return this.patch<EvidenceScreenshot>(`${this.BASE_PATH}/screenshots/${id}/`, data);
  }

  async deleteScreenshot(id: string): Promise<ApiResponse<void>> {
    return this.delete<void>(`${this.BASE_PATH}/screenshots/${id}/`);
  }

  async deleteEvidence(id: string): Promise<ApiResponse<void>> {
    return this.delete<void>(`${this.BASE_PATH}/evidence/${id}/`);
  }

  // ==================== Risk Assessments ====================

  async getRiskAssessments(params?: {
    case?: string;
    risk_factor?: string;
  }): Promise<ApiResponse<RiskAssessment[]>> {
    return this.get<RiskAssessment[]>(`${this.BASE_PATH}/risk-assessments/`, { params });
  }

  async createRiskAssessment(data: Partial<RiskAssessment>): Promise<ApiResponse<RiskAssessment>> {
    return this.post<RiskAssessment>(`${this.BASE_PATH}/risk-assessments/`, data);
  }

  async updateRiskAssessment(id: string, data: Partial<RiskAssessment>): Promise<ApiResponse<RiskAssessment>> {
    return this.patch<RiskAssessment>(`${this.BASE_PATH}/risk-assessments/${id}/`, data);
  }

  async deleteRiskAssessment(id: string): Promise<ApiResponse<void>> {
    return this.delete<void>(`${this.BASE_PATH}/risk-assessments/${id}/`);
  }

  // ==================== Reports ====================

  async getReports(params?: {
    case?: string;
    report_type?: string;
    status?: string;
  }): Promise<ApiResponse<InfringementReport[]>> {
    return this.get<InfringementReport[]>(`${this.BASE_PATH}/reports/`, { params });
  }

  async createReport(data: Partial<InfringementReport>): Promise<ApiResponse<InfringementReport>> {
    return this.post<InfringementReport>(`${this.BASE_PATH}/reports/`, data);
  }

  async updateReport(id: string, data: Partial<InfringementReport>): Promise<ApiResponse<InfringementReport>> {
    return this.patch<InfringementReport>(`${this.BASE_PATH}/reports/${id}/`, data);
  }

  async reviewReport(id: string, reviewNotes: string): Promise<ApiResponse<InfringementReport>> {
    return this.post<InfringementReport>(`${this.BASE_PATH}/reports/${id}/review/`, { review_notes: reviewNotes });
  }

  async deleteReport(id: string): Promise<ApiResponse<void>> {
    return this.delete<void>(`${this.BASE_PATH}/reports/${id}/`);
  }

  // ==================== Risk Analysis ====================

  async calculateRiskScore(caseId: string): Promise<ApiResponse<RiskAnalysisResult>> {
    return this.post<RiskAnalysisResult>(`${this.BASE_PATH}/risk-analysis/calculate-risk-score/`, { case_id: caseId });
  }

  async generateRiskReport(caseId: string): Promise<ApiResponse<{ report: InfringementReport; risk_analysis: RiskAnalysisResult }>> {
    return this.post<{ report: InfringementReport; risk_analysis: RiskAnalysisResult }>(`${this.BASE_PATH}/risk-analysis/generate-risk-report/`, { case_id: caseId });
  }

  // ==================== Damages Analysis ====================

  async getDamagesAnalysisList(params?: {
    case?: string;
    damages_theory?: string;
  }): Promise<ApiResponse<DamagesAnalysis[]>> {
    return this.get<DamagesAnalysis[]>(`${this.BASE_PATH}/damages-analysis/`, { params });
  }

  async getDamagesAnalysis(id: string): Promise<ApiResponse<DamagesAnalysis>> {
    return this.get<DamagesAnalysis>(`${this.BASE_PATH}/damages-analysis/${id}/`);
  }

  async getDamagesAnalysisByCase(caseId: string): Promise<ApiResponse<DamagesAnalysis>> {
    return this.get<DamagesAnalysis>(`${this.BASE_PATH}/damages-analysis/by-case/${caseId}/`);
  }

  async getOrCreateDamagesAnalysis(caseId: string): Promise<ApiResponse<{ damages_analysis: DamagesAnalysis; created: boolean }>> {
    return this.post<{ damages_analysis: DamagesAnalysis; created: boolean }>(`${this.BASE_PATH}/damages-analysis/get-or-create/`, { case_id: caseId });
  }

  async createDamagesAnalysis(data: Partial<DamagesAnalysis>): Promise<ApiResponse<DamagesAnalysis>> {
    return this.post<DamagesAnalysis>(`${this.BASE_PATH}/damages-analysis/`, data);
  }

  async updateDamagesAnalysis(id: string, data: Partial<DamagesAnalysis>): Promise<ApiResponse<DamagesAnalysis>> {
    return this.patch<DamagesAnalysis>(`${this.BASE_PATH}/damages-analysis/${id}/`, data);
  }

  async calculateDamages(id: string): Promise<ApiResponse<DamagesAnalysis>> {
    return this.post<DamagesAnalysis>(`${this.BASE_PATH}/damages-analysis/${id}/calculate/`, {});
  }

  async deleteDamagesAnalysis(id: string): Promise<ApiResponse<void>> {
    return this.delete<void>(`${this.BASE_PATH}/damages-analysis/${id}/`);
  }

  // ==================== Auto-Import Claims ====================

  // force=true replaces existing mappings (e.g. when current claims are stale/mismatched).
  async autoImportClaims(caseId: string, force = false): Promise<ApiResponse<AutoImportClaimsResponse>> {
    return this.post<AutoImportClaimsResponse>(`${this.BASE_PATH}/cases/${caseId}/auto-import-claims/`, { force });
  }

  // useLlm opts into the gated LLM parser (dormant until the backend master switch is on).
  async parseClaimElements(claimMappingId: string, useLlm = false): Promise<ApiResponse<{ elements: ClaimElement[]; count: number; ai_draft?: boolean }>> {
    return this.post<{ elements: ClaimElement[]; count: number; ai_draft?: boolean }>(`${this.BASE_PATH}/claim-mappings/${claimMappingId}/parse-elements/`, { use_llm: useLlm });
  }

  // ==================== PTAB ====================

  async getPtabProceedings(caseId: string): Promise<ApiResponse<any>> {
    return this.get<any>(`${this.BASE_PATH}/cases/${caseId}/ptab_proceedings/`);
  }

  async getPtabDecisions(caseId: string): Promise<ApiResponse<any>> {
    return this.get<any>(`${this.BASE_PATH}/cases/${caseId}/ptab_decisions/`);
  }
}

// Export singleton instance
export const infringementApi = new InfringementApiService();

// Export default
export default infringementApi;
