/**
 * Lens.org Patent API Service
 *
 * Wraps backend Lens proxy endpoints with typed requests/responses.
 * Backend routes: /api/research/lens/...
 */

import { ApiClient, ApiResponse } from './apiClient';

const LENS_BASE = '/analytics/api/research/lens';

// ---------------------------------------------------------------------------
// Types — match actual Lens.org response structure
// ---------------------------------------------------------------------------

export interface LensDocumentId {
  jurisdiction?: string;
  doc_number?: string;
  kind?: string;
  date?: string;
}

export interface LensExtractedName {
  value: string;
}

export interface LensApplicant {
  residence?: string;
  sequence?: number;
  extracted_name?: LensExtractedName;
  extracted_address?: string;
}

export interface LensInventor {
  residence?: string;
  sequence?: number;
  orcid?: string;
  extracted_name?: LensExtractedName;
  extracted_address?: string;
}

export interface LensOwner {
  recorded_date?: string;
  execution_date?: string;
  extracted_name?: LensExtractedName;
  extracted_address?: string;
  extracted_country?: string;
}

export interface LensClassification {
  symbol: string;
  classification_value?: string;
  classification_symbol_position?: string;
}

export interface LensCitation {
  patcit?: {
    document_id?: LensDocumentId[];
    lens_id?: string;
  };
  nplcit?: {
    text?: string;
    lens_id?: string;
    external_ids?: string[];
  };
  sequence?: number;
  category?: string[];
  cited_phase?: string;
}

export interface LensFamilyMember {
  document_id?: LensDocumentId;
  lens_id?: string;
}

export interface LensFamily {
  family_id?: number;
  members?: LensFamilyMember[];
  size?: number;
}

export interface LensLegalStatus {
  granted?: boolean;
  grant_date?: string;
  application_expiry_date?: string;
  anticipated_term_date?: string;
  discontinuation_date?: string;
  has_disclaimer?: boolean;
  patent_status?: string;
  has_spc?: boolean;
  calculation_log?: string[];
}

export interface LensTextEntry {
  text: string;
  lang: string;
}

export interface LensClaim {
  claim_text: string[];
}

export interface LensPatent {
  lens_id: string;
  jurisdiction: string;
  doc_number: string;
  kind: string;
  date_published: string;
  doc_key?: string;
  docdb_id?: number;
  publication_type?: string;
  lang?: string;
  biblio: {
    publication_reference?: LensDocumentId;
    application_reference?: LensDocumentId;
    application_number?: string;
    priority_claims?: {
      claims?: LensDocumentId[];
      earliest_claim?: { date: string };
    };
    invention_title?: LensTextEntry[];
    parties?: {
      inventors?: LensInventor[];
      applicants?: LensApplicant[];
      owners_all?: LensOwner[];
      agents?: { sequence?: number; extracted_name?: LensExtractedName }[];
      examiners?: Record<string, any>[];
    };
    classifications_cpc?: { classifications: LensClassification[] };
    classifications_ipcr?: { classifications: LensClassification[] };
    classifications_national?: { classifications: LensClassification[] };
    references_cited?: {
      citations?: LensCitation[];
      npl_resolved_count?: number;
      npl_count?: number;
      patent_count?: number;
    };
    cited_by?: {
      patents?: { document_id?: LensDocumentId; lens_id?: string }[];
    };
  };
  abstract?: LensTextEntry[];
  claims?: { claims: LensClaim[]; lang?: string }[];
  legal_status?: LensLegalStatus;
  families?: {
    simple_family?: LensFamily;
    extended_family?: LensFamily;
  };
}

export interface LensSearchResponse {
  total: number;
  data: LensPatent[];
  results?: number;
  max_score?: number;
}

export interface LensPatentLookupResponse {
  total: number;
  data: LensPatent[];
  patent: LensPatent;
}

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

/** Extract English text (or first available) from a LensTextEntry array. */
export function lensText(entries?: LensTextEntry[]): string {
  if (!entries || entries.length === 0) return '';
  const en = entries.find((e) => e.lang?.toUpperCase() === 'EN');
  return (en || entries[0])?.text || '';
}

/** Get the first applicant name. */
export function lensApplicantName(patent: LensPatent): string {
  const applicants = patent.biblio?.parties?.applicants;
  if (!applicants || applicants.length === 0) return '';
  return applicants[0]?.extracted_name?.value || '';
}

/** Get inventor names. */
export function lensInventorNames(patent: LensPatent): string[] {
  const inventors = patent.biblio?.parties?.inventors;
  if (!inventors) return [];
  return inventors
    .map((i) => i.extracted_name?.value || '')
    .filter(Boolean);
}

/** Build a display publication number. */
export function lensPublicationNumber(patent: LensPatent): string {
  return `${patent.jurisdiction || ''}${patent.doc_number || ''}${patent.kind || ''}`;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

class LensApiService {
  /** Full-text patent search via Lens.org. */
  async searchPatents(
    body: Record<string, any>
  ): Promise<ApiResponse<LensSearchResponse>> {
    return ApiClient.post<LensSearchResponse>(`${LENS_BASE}/search/`, body);
  }

  /** Lookup a single patent by doc_number and optional jurisdiction. */
  async getPatentByDocNumber(
    docNumber: string,
    jurisdiction?: string
  ): Promise<ApiResponse<LensPatentLookupResponse>> {
    const params = new URLSearchParams({ doc_number: docNumber });
    if (jurisdiction) params.set('jurisdiction', jurisdiction);
    return ApiClient.get<LensPatentLookupResponse>(
      `${LENS_BASE}/patent/?${params.toString()}`
    );
  }
}

const lensApi = new LensApiService();
export default lensApi;
