/**
 * USPTO Open Data Portal (ODP) API Service
 *
 * Wraps all backend ODP proxy endpoints with typed requests/responses.
 * Backend routes: /api/research/odp/...
 */

import { ApiClient, ApiResponse } from './apiClient';

const ODP_BASE = '/analytics/api/research/odp';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ODPApplication {
  applicationNumberText: string;
  applicationMetaData: Record<string, any>;
  classificationDataBag?: Record<string, any>[];
  [key: string]: any;
}

export interface ODPContinuity {
  parentApplicationBag?: Record<string, any>[];
  childApplicationBag?: Record<string, any>[];
  [key: string]: any;
}

export interface ODPAssignment {
  assignmentBag?: Record<string, any>[];
  [key: string]: any;
}

export interface ODPAttorney {
  attorneyBag?: Record<string, any>[];
  [key: string]: any;
}

export interface ODPDocuments {
  documentBag?: Record<string, any>[];
  [key: string]: any;
}

export interface ODPTransactions {
  eventDataBag?: Record<string, any>[];
  transactionBag?: Record<string, any>[];
  [key: string]: any;
}

export interface ODPForeignPriority {
  foreignPriorityBag?: Record<string, any>[];
  [key: string]: any;
}

export interface ODPTermAdjustment {
  [key: string]: any;
}

export interface ODPSearchResponse {
  count: number;
  patentFileWrapperDataBag: ODPApplicationSummary[];
}

export interface ODPApplicationSummary {
  applicationNumberText: string;
  applicationMetaData: {
    applicationTypeLabelName?: string;
    applicationStatusCode?: number;
    applicationStatusDescriptionText?: string;
    filingDate?: string;
    inventionTitle?: string;
    patentNumber?: string;
    grantDate?: string;
    applicantNameText?: string;
    publicationNumber?: string;
    publicationDate?: string;
    [key: string]: any;
  };
  inventorBag?: { inventorNameText: string }[];
  [key: string]: any;
}

export interface ODPParsedText {
  abstract: string;
  description: string;
  claims: string[];
}

export interface ODPFullText {
  grant_url: string | null;
  pgpub_url: string | null;
  grant_document_id: string | null;
  pgpub_document_id: string | null;
  grant_text?: ODPParsedText | null;
  pgpub_text?: ODPParsedText | null;
}

export interface ODPTrialProceeding {
  trialNumber?: string;
  [key: string]: any;
}

export interface ODPSearchResult<T = any> {
  results?: T[];
  totalCount?: number;
  recordTotalQuantity?: number;
  [key: string]: any;
}

// ---------------------------------------------------------------------------
// Analysis Types
// ---------------------------------------------------------------------------

export type AnalysisModelKey = 'sonnet' | 'opus';

export interface AnalysisKeyword {
  term: string;
  category: string;
  importance: number;
  claim_locations: number[];
  context_quote: string;
}

export interface AnalysisKeywords {
  technical_terms: AnalysisKeyword[];
  key_distinguishing_terms: string[];
  technology_domain: string;
  ipc_suggestion: string;
}

export interface NovelElement {
  claim_number: number;
  element_text: string;
  novelty_reasoning: string;
  spec_support: string;
  spec_location_hint: string;
}

export interface AnalysisNovelElements {
  novel_elements: NovelElement[];
  overall_novelty_assessment: string;
}

export interface ClaimLimitation {
  text: string;
  type: string;
  narrowing_effect: string;
}

export interface ClaimScopeItem {
  claim_number: number;
  broadness_score: number;
  broadness_reasoning: string;
  key_limitations: ClaimLimitation[];
  functional_language: { text: string; type: string }[];
  structural_language: string[];
  overall_assessment: string;
  error?: string;
}

export interface AnalysisClaimScope {
  claims: ClaimScopeItem[];
  total_independent_claims: number;
}

export interface EmbodimentItem {
  number: number;
  title: string;
  summary: string;
  figure_references: string[];
  distinguishing_aspects: string;
}

export interface AnalysisEmbodiments {
  embodiments: EmbodimentItem[];
  total_count: number;
  primary_embodiment: number;
  variation_summary: string;
}

export interface BackgroundDeficiency {
  deficiency: string;
  source_quote: string;
}

export interface AnalysisBackground {
  prior_art_deficiencies: BackgroundDeficiency[];
  problems_identified: { problem: string; source_quote: string }[];
  proposed_solutions: { solution: string; source_quote: string }[];
  technical_field: string;
  summary: string;
}

export interface ClaimTreeNode {
  claim_number: number;
  depends_on?: number;
  text_preview: string;
}

export interface AnalysisClaimTree {
  independent: ClaimTreeNode[];
  dependent: ClaimTreeNode[];
  tree: Record<string, number[]>;
  total_claims: number;
  independent_count: number;
  dependent_count: number;
}

export interface MPFElement {
  claim_number: number;
  element_text: string;
  function_described: string;
  corresponding_structure: string;
  spec_support_quote: string;
  risk_level: string;
  notes: string;
}

export interface AnalysisMPF {
  mpf_elements: MPFElement[];
  has_mpf_elements: boolean;
  total_mpf_count: number;
  recommendation: string;
}

export interface Section112Issue {
  claim_number: number;
  term: string;
  issue_type: string;
  explanation: string;
  severity: string;
}

export interface AnalysisVulnerabilities {
  section_101_risk: {
    risk_level: string;
    reasoning: string;
    abstract_idea_candidates: string[];
    practical_application_arguments: string[];
  };
  section_112_issues: Section112Issue[];
  overall_prosecution_risk: {
    rating: string;
    summary: string;
    recommendations: string[];
  };
}

export interface PromptUsedInfo {
  source: 'database' | 'default';
  template_id?: string;
  version?: number;
  category?: string;
  rendered_prompt: string;
}

export interface PatentAnalysis {
  application_id: string;
  patent_number: string;
  model_used: string;
  analysis_version: string;
  total_input_tokens: number;
  total_output_tokens: number;
  total_cost_usd: number;
  processing_time_seconds: number;
  section_status: Record<string, string>;
  keywords: AnalysisKeywords;
  novel_elements: AnalysisNovelElements;
  claim_scope: AnalysisClaimScope;
  embodiments: AnalysisEmbodiments;
  background_analysis: AnalysisBackground;
  claim_tree: AnalysisClaimTree;
  means_plus_function: AnalysisMPF;
  vulnerabilities: AnalysisVulnerabilities;
  prompt_category?: string;
  prompts_used?: Record<string, PromptUsedInfo>;
  created_at?: string;
  cached?: boolean;
}

export type AnalysisCategoryKey =
  | 'general'
  | 'hi_tech'
  | 'biomedical'
  | 'life_science'
  | 'mechanical'
  | 'electrical'
  | 'chemical'
  | 'pharma'
  | 'semiconductor';

export interface AnalyzeOptions {
  force_refresh?: boolean;
  check_only?: boolean;
  model?: AnalysisModelKey;
  prompt_category?: AnalysisCategoryKey;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

class UsptoOdpApiService {
  // -- Application endpoints -----------------------------------------------

  async getApplication(appId: string): Promise<ApiResponse<ODPApplication>> {
    return ApiClient.get<ODPApplication>(`${ODP_BASE}/application/${appId}/`);
  }

  async getContinuity(appId: string): Promise<ApiResponse<ODPContinuity>> {
    return ApiClient.get<ODPContinuity>(`${ODP_BASE}/application/${appId}/continuity/`);
  }

  async getAssignment(appId: string): Promise<ApiResponse<ODPAssignment>> {
    return ApiClient.get<ODPAssignment>(`${ODP_BASE}/application/${appId}/assignment/`);
  }

  async getAttorney(appId: string): Promise<ApiResponse<ODPAttorney>> {
    return ApiClient.get<ODPAttorney>(`${ODP_BASE}/application/${appId}/attorney/`);
  }

  async getDocuments(appId: string): Promise<ApiResponse<ODPDocuments>> {
    return ApiClient.get<ODPDocuments>(`${ODP_BASE}/application/${appId}/documents/`);
  }

  /** Download a USPTO document via authenticated proxy, triggering a browser download. */
  async downloadDocument(appId: string, usptoUrl: string, filename?: string): Promise<void> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
    const url = `${apiBase}${ODP_BASE}/application/${appId}/documents/download/?url=${encodeURIComponent(usptoUrl)}`;

    const resp = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!resp.ok) throw new Error(`Download failed: ${resp.status}`);

    const blob = await resp.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename || 'document.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  }

  async getTransactions(appId: string): Promise<ApiResponse<ODPTransactions>> {
    return ApiClient.get<ODPTransactions>(`${ODP_BASE}/application/${appId}/transactions/`);
  }

  async getForeignPriority(appId: string): Promise<ApiResponse<ODPForeignPriority>> {
    return ApiClient.get<ODPForeignPriority>(`${ODP_BASE}/application/${appId}/foreign-priority/`);
  }

  async getTermAdjustment(appId: string): Promise<ApiResponse<ODPTermAdjustment>> {
    return ApiClient.get<ODPTermAdjustment>(`${ODP_BASE}/application/${appId}/adjustment/`);
  }

  // -- Search endpoints -----------------------------------------------------

  async searchApplications(query: Record<string, any>): Promise<ApiResponse<ODPSearchResponse>> {
    return ApiClient.post<ODPSearchResponse>(`${ODP_BASE}/search/`, query);
  }

  async getFullText(appId: string): Promise<ApiResponse<ODPFullText>> {
    return ApiClient.get<ODPFullText>(`${ODP_BASE}/application/${appId}/full-text/`);
  }

  // -- Trial endpoints -----------------------------------------------------

  async searchProceedings(query: Record<string, any>): Promise<ApiResponse<ODPSearchResult<ODPTrialProceeding>>> {
    return ApiClient.post<ODPSearchResult<ODPTrialProceeding>>(`${ODP_BASE}/trials/search/`, query);
  }

  async getProceeding(trialNumber: string): Promise<ApiResponse<ODPTrialProceeding>> {
    return ApiClient.get<ODPTrialProceeding>(`${ODP_BASE}/trials/${trialNumber}/`);
  }

  async searchDecisions(query: Record<string, any>): Promise<ApiResponse<ODPSearchResult>> {
    return ApiClient.post<ODPSearchResult>(`${ODP_BASE}/trials/decisions/search/`, query);
  }

  async searchAppealDecisions(query: Record<string, any>): Promise<ApiResponse<ODPSearchResult>> {
    return ApiClient.post<ODPSearchResult>(`${ODP_BASE}/appeals/decisions/search/`, query);
  }

  // -- Analysis endpoint ----------------------------------------------------

  async analyzePatent(appId: string, options?: AnalyzeOptions): Promise<ApiResponse<PatentAnalysis>> {
    return ApiClient.post<PatentAnalysis>(`${ODP_BASE}/application/${appId}/analyze/`, {
      force_refresh: options?.force_refresh ?? false,
      check_only: options?.check_only ?? false,
      model: options?.model ?? 'sonnet',
      prompt_category: options?.prompt_category ?? 'general',
    });
  }
}

export const usptoOdpApi = new UsptoOdpApiService();
export default usptoOdpApi;
