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
}

export const usptoOdpApi = new UsptoOdpApiService();
export default usptoOdpApi;
