/**
 * Document Download Types
 */

export type JobStatus =
  | 'pending'
  | 'crawling'
  | 'paused'
  | 'discovered'
  | 'downloading'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type LinkCategory =
  | 'product_page'
  | 'technical_doc'
  | 'datasheet'
  | 'legal_ip'
  | 'marketing'
  | 'image'
  | 'pdf'
  | 'document'
  | 'page'
  | 'other';

export interface CrawlJobProgress {
  pages_crawled: number;
  pages_total: number;
  links_discovered: number;
  files_downloaded: number;
  files_total: number;
  rendered_pages_saved: number;
  total_download_size_bytes: number;
  current_url: string;
  crawl_rate_pages_per_min: number;
  errors_count: number;
  blocked_count: number;
  category_counts: Record<string, number>;
  errors: Array<{ url: string; error: string; timestamp: string }>;
}

export interface CrawlJob {
  id: string;
  title: string;
  target_url: string;
  max_depth: number;
  max_pages: number;
  allowed_domains: string[];
  url_patterns_include: string[];
  url_patterns_exclude: string[];
  crawl_delay: number;
  proxy_url: string;
  save_rendered_pages: boolean;
  status: JobStatus;
  progress: CrawlJobProgress;
  error_message: string;
  started_at: string | null;
  paused_at: string | null;
  completed_at: string | null;
  created_by: string | null;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;
  links_count: number;
  files_count: number;
}

export interface DiscoveredLink {
  id: string;
  job: string;
  url: string;
  title: string;
  link_text: string;
  parent_url: string;
  depth: number;
  category: LinkCategory;
  content_type: string;
  file_extension: string;
  file_size_bytes: number | null;
  is_selected: boolean;
  is_downloaded: boolean;
  download_error: string;
  meta_description: string;
  has_downloadable_doc: boolean;
  discovered_at: string;
}

export interface DownloadedFile {
  id: string;
  job: string;
  job_title: string;
  link_url: string;
  link_title: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  category: LinkCategory;
  is_rendered_page: boolean;
  downloaded_at: string;
  access_count: number;
  // Detail fields (only in detail view)
  checksum_sha256?: string;
  extracted_text?: string;
  last_accessed_at?: string | null;
  download_url?: string | null;
}

export interface JobStats {
  category_counts: Record<string, number>;
  total_links: number;
  selected_count: number;
  downloaded_count: number;
  total_estimated_size: number;
  total_files: number;
  total_download_size: number;
  rendered_pages: number;
  progress: CrawlJobProgress;
}

export interface CreateJobRequest {
  title: string;
  target_url: string;
  max_depth?: number;
  max_pages?: number;
  allowed_domains?: string[];
  url_patterns_include?: string[];
  url_patterns_exclude?: string[];
  crawl_delay?: number;
  proxy_url?: string;
  save_rendered_pages?: boolean;
}

export interface BulkSelectRequest {
  link_ids?: string[];
  categories?: string[];
  select: boolean;
  select_all?: boolean;
}

export interface LinkFilters {
  category?: string;
  is_selected?: string;
  is_downloaded?: string;
  search?: string;
  ordering?: string;
  limit?: number;
  offset?: number;
}

export interface FileFilters {
  job?: string;
  category?: string;
  is_rendered_page?: string;
  search?: string;
  min_size?: number;
  max_size?: number;
  ordering?: string;
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Category display config
export const CATEGORY_CONFIG: Record<LinkCategory, { label: string; color: string; icon: string }> = {
  product_page: { label: 'Product Page', color: 'bg-cyan-500', icon: 'ShoppingBag' },
  technical_doc: { label: 'Technical Doc', color: 'bg-blue-500', icon: 'FileCode' },
  datasheet: { label: 'Datasheet', color: 'bg-purple-500', icon: 'FileSpreadsheet' },
  legal_ip: { label: 'Legal / IP', color: 'bg-amber-500', icon: 'Scale' },
  marketing: { label: 'Marketing', color: 'bg-pink-500', icon: 'Megaphone' },
  image: { label: 'Image', color: 'bg-green-500', icon: 'Image' },
  pdf: { label: 'PDF', color: 'bg-red-500', icon: 'FileText' },
  document: { label: 'Document', color: 'bg-orange-500', icon: 'File' },
  page: { label: 'Web Page', color: 'bg-neutral-500', icon: 'Globe' },
  other: { label: 'Other', color: 'bg-neutral-400', icon: 'HelpCircle' },
};

export const JOB_STATUS_CONFIG: Record<JobStatus, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-neutral-400' },
  crawling: { label: 'Crawling', color: 'bg-cyan-500' },
  paused: { label: 'Paused', color: 'bg-amber-500' },
  discovered: { label: 'Discovered', color: 'bg-blue-500' },
  downloading: { label: 'Downloading', color: 'bg-purple-500' },
  completed: { label: 'Completed', color: 'bg-green-500' },
  failed: { label: 'Failed', color: 'bg-red-500' },
  cancelled: { label: 'Cancelled', color: 'bg-neutral-500' },
};
