export type SearchCategory = 'product_evidence' | 'litigation' | 'prior_art' | 'competitor' | 'technical' | 'market' | 'general';
export type SessionStatus = 'active' | 'archived';
export type SourceType = 'infringement' | 'prior_art' | 'portfolio' | 'manual';

export interface SearchSession {
  id: string;
  title: string;
  source_type: SourceType;
  source_id: string | null;
  context_data: Record<string, any>;
  status: SessionStatus;
  notes: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  queries_count?: number;
  results_count?: number;
  queries?: SearchQuery[];
}

export type FileType = 'pdf' | 'doc' | 'ppt' | 'xls' | 'txt' | '';
export type DateRestrict = 'd1' | 'w1' | 'm1' | 'm3' | 'm6' | 'y1' | '';

export interface AdvancedQueryFilters {
  site_filter: string;
  file_type: FileType;
  date_restrict: DateRestrict;
  exact_terms: string;
  exclude_terms: string;
}

export interface SearchQuery {
  id: string;
  session: string;
  query_text: string;
  category: SearchCategory;
  is_auto_generated: boolean;
  executed_at: string | null;
  results_count: number;
  created_at: string;
  results?: SearchResult[];
  // Advanced search filters
  site_filter?: string;
  file_type?: string;
  date_restrict?: string;
  exact_terms?: string;
  exclude_terms?: string;
}

export interface SearchResult {
  id: string;
  query: string;
  title: string;
  url: string;
  snippet: string;
  display_link: string;
  source_domain: string;
  thumbnail_url: string | null;
  position: number;
  is_flagged: boolean;
  is_saved: boolean;
  relevance_notes: string;
  created_at: string;
}

export interface QuotaInfo {
  used: number;
  limit: number;
  remaining: number;
  date: string;
  mode?: 'server' | 'client';
  unlimited?: boolean;
}

export interface SearchConfigPublic {
  search_mode: 'server' | 'client' | 'none';
  search_engine_id: string;
  is_active: boolean;
}

export interface ClientSearchResultPayload {
  title: string;
  url: string;
  snippet: string;
  display_link: string;
  visible_url: string;
  thumbnail_url: string | null;
  position: number;
}

export interface ClientSearchSubmission {
  query_id: string;
  results: ClientSearchResultPayload[];
}

export interface CreateSessionRequest {
  title: string;
  source_type?: SourceType;
  source_id?: string | null;
  context_data?: Record<string, any>;
  notes?: string;
}

export interface CreateQueryRequest {
  session: string;
  query_text: string;
  category?: SearchCategory;
  is_auto_generated?: boolean;
  site_filter?: string;
  file_type?: string;
  date_restrict?: string;
  exact_terms?: string;
  exclude_terms?: string;
}

export interface UpdateResultRequest {
  is_flagged?: boolean;
  is_saved?: boolean;
  relevance_notes?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
