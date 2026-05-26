/**
 * Family Analysis API Service
 *
 * Provides types and API calls for patent family claim analysis.
 */

import { ApiClient, ApiResponse } from './apiClient';

const LENS_BASE = '/analytics/api/research/lens';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FamilyAnalysisRequest {
  lens_id: string;
  family_type: 'simple' | 'extended';
  analysis_mode: 'quick' | 'deep';
  model?: string;
}

export interface ClaimScopeEntry {
  jurisdiction: string;
  doc_number: string;
  lens_id: string;
  independent_claim_count: number;
  dependent_claim_count?: number;
  total_claim_count: number;
  avg_claim_length: number;
  broadness_score: number;
  broadest_claim_preview: string;
  assessment?: string;           // LLM-generated for deep mode
  narrowing_flags?: string[];
}

export interface DistinctionEntry {
  jurisdiction: string;
  doc_number: string;
  unique_elements: string[];
  added_vs_parent: string[];
  removed_vs_parent: string[];
  description?: string;
}

export interface CoverageCell {
  covered: boolean;
  claim_numbers?: number[];
}

export interface ProsecutionFlag {
  jurisdiction: string;
  narrowed_claims: number[];
  amendment_dates?: string[];
  description?: string;
}

export interface FamilyAnalysisResult {
  analysis_mode: 'quick' | 'deep';
  family_size: number;
  claim_scope: ClaimScopeEntry[];
  distinctions: DistinctionEntry[];
  coverage_matrix: {
    elements: string[];
    jurisdictions: string[];
    matrix: CoverageCell[][];
  };
  prosecution_flags?: ProsecutionFlag[];
  strategic_summary?: string;
  model_used?: string;
  processing_time_seconds?: number;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

class FamilyAnalysisApiService {
  async analyze(
    request: FamilyAnalysisRequest
  ): Promise<ApiResponse<FamilyAnalysisResult>> {
    return ApiClient.post<FamilyAnalysisResult>(
      `${LENS_BASE}/family-analysis/`,
      request
    );
  }
}

const familyAnalysisApi = new FamilyAnalysisApiService();
export default familyAnalysisApi;
