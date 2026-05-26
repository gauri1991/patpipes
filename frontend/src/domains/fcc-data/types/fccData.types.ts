/**
 * FCC Equipment Authorization Data Types
 */

export interface FCCGrantee {
  grantee_code: string;
  grantee_name: string;
  city: string;
  state: string;
  country: string;
  contact_name: string;
}

export type QueryType = 'fcc_id' | 'bulk_fcc_id' | 'grantee_search' | 'whitespace' | 'cbsd' | 'afc';
export type JobStatus = 'pending' | 'running' | 'completed' | 'failed';
export type ExportFormat = 'csv' | 'json' | 'pdf';

export interface FCCQueryJob {
  id: string;
  title: string;
  query_type: QueryType;
  fcc_id: string;
  product_code: string;
  bulk_fcc_ids: string[];
  grantee_search_term: string;
  begin_date: string | null;
  end_date: string | null;
  status: JobStatus;
  results_count: number;
  error_message: string;
  created_by: string | null;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;
  exports_count: number;
}

export interface FCCAuthorization {
  id: string;
  job: string;
  fcc_id: string;
  grantee_name: string;
  application_purpose: string;
  equipment_class: string;
  description: string;
  grant_date: string;
  status: string;
  status_date: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  freq_min: string | null;
  freq_max: string | null;
  power_output: string | null;
  emission_designator: string;
  grant_notes: Array<{ grantNote: string; grantNoteId: string }>;
  created_at: string;
}

export interface FCCExportFile {
  id: string;
  job: string;
  filename: string;
  file_size: number;
  format: ExportFormat;
  record_count: number;
  created_at: string;
  download_url: string | null;
}

export interface JobStats {
  total_records: number;
  unique_grantees: number;
  equipment_class_counts: Record<string, number>;
  status_counts: Record<string, number>;
  purpose_counts: Record<string, number>;
  freq_min: string | null;
  freq_max: string | null;
}

export interface CreateQueryRequest {
  title: string;
  query_type: QueryType;
  fcc_id?: string;
  product_code?: string;
  bulk_fcc_ids?: string[];
  grantee_search_term?: string;
  begin_date?: string;
  end_date?: string;
}

export interface ResultFilters {
  fcc_id?: string;
  grantee_name?: string;
  equipment_class?: string;
  status?: string;
  search?: string;
  ordering?: string;
  limit?: number;
  offset?: number;
  // Advanced filters
  application_purpose?: string;
  emission_designator?: string;
  description?: string;
  freq_min_gte?: string;
  freq_max_lte?: string;
  power_min?: string;
  power_max?: string;
  city?: string;
  state?: string;
}

export type DocumentType =
  | 'test_report' | 'external_photos' | 'internal_photos'
  | 'schematics' | 'block_diagram' | 'user_manual' | 'label'
  | 'sar_report' | 'attestation' | 'cover_letter' | 'other';

export interface FCCDocument {
  id: string;
  job: string;
  fcc_id: string;
  exhibit_name: string;
  description: string;
  document_url: string;
  document_type: DocumentType;
  file_size_bytes: number | null;
  is_downloaded: boolean;
  original_filename: string;
  mime_type: string;
  download_error: string;
  discovered_at: string;
  download_url: string | null;
}

export const DOCUMENT_TYPE_CONFIG: Record<DocumentType, { label: string; icon: string }> = {
  test_report: { label: 'Test Report', icon: 'FileText' },
  external_photos: { label: 'External Photos', icon: 'Camera' },
  internal_photos: { label: 'Internal Photos', icon: 'Camera' },
  schematics: { label: 'Schematics', icon: 'Cpu' },
  block_diagram: { label: 'Block Diagram', icon: 'GitBranch' },
  user_manual: { label: 'User Manual', icon: 'BookOpen' },
  label: { label: 'Label', icon: 'Tag' },
  sar_report: { label: 'SAR/RF Exposure', icon: 'Zap' },
  attestation: { label: 'Attestation', icon: 'Shield' },
  cover_letter: { label: 'Letter', icon: 'Mail' },
  other: { label: 'Other', icon: 'File' },
};

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const QUERY_TYPE_CONFIG: Record<QueryType, { label: string; description: string }> = {
  fcc_id: { label: 'FCC ID Search', description: 'Search by grantee code or FCC ID' },
  bulk_fcc_id: { label: 'Bulk Search', description: 'Search multiple FCC IDs at once' },
  grantee_search: { label: 'Grantee Search', description: 'Find all FCC IDs by company/grantee name' },
  whitespace: { label: 'Whitespace', description: 'White space equipment authorizations by date range' },
  cbsd: { label: 'CBSD', description: 'Citizens Broadband Radio Service Device authorizations' },
  afc: { label: 'AFC', description: 'Automated Frequency Coordination authorizations' },
};

export const FCC_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  GI: { label: 'Grant Issued', color: 'bg-green-500' },
  IP: { label: 'Permissive Change', color: 'bg-blue-500' },
  IM: { label: 'Modification', color: 'bg-amber-500' },
};

export const JOB_STATUS_CONFIG: Record<JobStatus, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-neutral-400' },
  running: { label: 'Running', color: 'bg-cyan-500' },
  completed: { label: 'Completed', color: 'bg-green-500' },
  failed: { label: 'Failed', color: 'bg-red-500' },
};
