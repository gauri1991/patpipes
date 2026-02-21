/**
 * Patent Import API Service
 * Handles backend API calls for patent import functionality
 */

interface ImportBatchData {
  batch_name: string;
  batch_description: string;
  source_filename: string;
  import_settings: {
    mappings: any[];
    import_mode: 'append' | 'replace';
    skip_duplicates: boolean;
  };
  patents: any[];
}

interface ImportBatch {
  id: string;
  batch_name: string;
  batch_description: string;
  source_filename: string;
  total_rows: number;
  successful_imports: number;
  failed_imports: number;
  status: 'processing' | 'completed' | 'failed' | 'partial';
  import_settings: any;
  imported_by: string;
  imported_by_name: string;
  imported_at: string;
  completed_at: string | null;
  error_log: any[];
  success_rate: number;
}

interface ImportedPatent {
  id: string;
  patent_id: string;
  title: string;
  abstract: string;
  publication_date: string | null;
  application_date: string | null;
  assignee: string;
  inventors: string[];
  ipc_classes: string[];
  cpc_classes: string[];
  jurisdiction: string;
  is_selected: boolean;
  manual_relevance: string;
  relevance_score: number | null;
  user_notes: string;
  created_at: string;
  source_filename: string;
  imported_at: string;
}

class PatentImportApiService {
  private baseUrl = '/api/v1';
  
  private async getAuthHeaders(): Promise<Record<string, string>> {
    // Use the same token storage as the main auth system
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      // Add auth header if token exists
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Create a new import batch with patents
   */
  async createImportBatch(projectId: string, batchData: ImportBatchData): Promise<ImportBatch> {
    const response = await fetch(`${this.baseUrl}/projects/${projectId}/import-batches`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(batchData)
    });

    return this.handleResponse<ImportBatch>(response);
  }

  /**
   * Get import batches for a project
   */
  async getImportBatches(projectId: string): Promise<ImportBatch[]> {
    const response = await fetch(`${this.baseUrl}/projects/${projectId}/import-batches`, {
      headers: await this.getAuthHeaders()
    });

    const data = await this.handleResponse<{results: ImportBatch[]}>(response);
    return data.results || [];
  }

  /**
   * Get import history for a project
   */
  async getImportHistory(projectId: string): Promise<ImportBatch[]> {
    const response = await fetch(`${this.baseUrl}/projects/${projectId}/import-batches/history`, {
      headers: await this.getAuthHeaders()
    });

    const data = await this.handleResponse<{results: ImportBatch[]}>(response);
    return data.results || [];
  }

  /**
   * Delete an import batch and all its patents
   */
  async deleteImportBatch(projectId: string, batchId: string): Promise<{message: string; deleted_patents: number}> {
    const response = await fetch(`${this.baseUrl}/projects/${projectId}/import-batches/${batchId}/delete_batch`, {
      method: 'DELETE',
      headers: await this.getAuthHeaders()
    });

    return this.handleResponse<{message: string; deleted_patents: number}>(response);
  }

  /**
   * Get imported patents for a project
   */
  async getImportedPatents(projectId: string, options?: {
    search?: string;
    is_selected?: boolean;
    manual_relevance?: string;
    import_batch?: string;
    ordering?: string;
    page?: number;
    page_size?: number;
  }): Promise<{results: ImportedPatent[]; count: number; next: string | null; previous: string | null}> {
    const params = new URLSearchParams();
    
    if (options?.search) params.append('search', options.search);
    if (options?.is_selected !== undefined) params.append('is_selected', String(options.is_selected));
    if (options?.manual_relevance) params.append('manual_relevance', options.manual_relevance);
    if (options?.import_batch) params.append('import_batch', options.import_batch);
    if (options?.ordering) params.append('ordering', options.ordering);
    if (options?.page) params.append('page', String(options.page));
    if (options?.page_size) params.append('page_size', String(options.page_size));

    const queryString = params.toString();
    const baseUrl = `${this.baseUrl}/projects/${projectId}/imported-patents`;
    const url = queryString ? `${baseUrl}?${queryString}` : baseUrl;
    
    const response = await fetch(url, {
      headers: await this.getAuthHeaders()
    });

    return this.handleResponse<{results: ImportedPatent[]; count: number; next: string | null; previous: string | null}>(response);
  }

  /**
   * Get a specific imported patent
   */
  async getImportedPatent(projectId: string, patentId: string): Promise<ImportedPatent> {
    const response = await fetch(`${this.baseUrl}/projects/${projectId}/imported-patents/${patentId}`, {
      headers: await this.getAuthHeaders()
    });

    return this.handleResponse<ImportedPatent>(response);
  }

  /**
   * Update an imported patent
   */
  async updateImportedPatent(projectId: string, patentId: string, data: Partial<ImportedPatent>): Promise<ImportedPatent> {
    const response = await fetch(`${this.baseUrl}/projects/${projectId}/imported-patents/${patentId}`, {
      method: 'PATCH',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(data)
    });

    return this.handleResponse<ImportedPatent>(response);
  }

  /**
   * Soft delete an imported patent
   */
  async deleteImportedPatent(projectId: string, patentId: string, reason?: string): Promise<{message: string; deleted_at: string}> {
    const response = await fetch(`${this.baseUrl}/projects/${projectId}/imported-patents/${patentId}/soft_delete`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify({ reason: reason || 'Deleted by user' })
    });

    return this.handleResponse<{message: string; deleted_at: string}>(response);
  }

  /**
   * Restore a deleted patent
   */
  async restoreImportedPatent(projectId: string, patentId: string): Promise<ImportedPatent> {
    const response = await fetch(`${this.baseUrl}/projects/${projectId}/imported-patents/${patentId}/restore`, {
      method: 'POST',
      headers: await this.getAuthHeaders()
    });

    return this.handleResponse<ImportedPatent>(response);
  }

  /**
   * Bulk update patents
   */
  async bulkUpdatePatents(projectId: string, updates: {patentId: string; data: Partial<ImportedPatent>}[]): Promise<ImportedPatent[]> {
    const response = await fetch(`${this.baseUrl}/projects/${projectId}/imported-patents/bulk_update`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify({ updates })
    });

    return this.handleResponse<ImportedPatent[]>(response);
  }

  /**
   * Bulk delete patents
   */
  async bulkDeletePatents(projectId: string, patentIds: string[], reason?: string): Promise<{message: string; deleted_count: number}> {
    const response = await fetch(`${this.baseUrl}/projects/${projectId}/imported-patents/bulk_delete`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify({ 
        patentIds, 
        reason: reason || 'Bulk deletion' 
      })
    });

    return this.handleResponse<{message: string; deleted_count: number}>(response);
  }

  /**
   * Bulk select/unselect patents
   */
  async bulkSelectPatents(projectId: string, patentIds: string[], selected: boolean): Promise<{message: string; updated_count: number}> {
    const response = await fetch(`${this.baseUrl}/projects/${projectId}/imported-patents/bulk_select`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify({ patentIds, selected })
    });

    return this.handleResponse<{message: string; updated_count: number}>(response);
  }

  /**
   * Bulk set relevance for patents
   */
  async bulkSetRelevance(projectId: string, patentIds: string[], relevance: 'high' | 'medium' | 'low' | 'not_relevant'): Promise<{message: string; updated_count: number}> {
    const response = await fetch(`${this.baseUrl}/projects/${projectId}/imported-patents/bulk_set_relevance`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify({ patentIds, relevance })
    });

    return this.handleResponse<{message: string; updated_count: number}>(response);
  }

  /**
   * Get statistics for imported patents
   */
  async getImportStatistics(projectId: string): Promise<{
    total_patents: number;
    selected_patents: number;
    by_relevance: Record<string, number>;
    by_assignee: {assignee: string; count: number}[];
    import_batches: number;
  }> {
    const response = await fetch(`${this.baseUrl}/projects/${projectId}/imported-patents/statistics`, {
      headers: await this.getAuthHeaders()
    });

    return this.handleResponse<{
      total_patents: number;
      selected_patents: number;
      by_relevance: Record<string, number>;
      by_assignee: {assignee: string; count: number}[];
      import_batches: number;
    }>(response);
  }
}

// Export singleton instance
export const patentImportApi = new PatentImportApiService();
export type { ImportBatch, ImportedPatent, ImportBatchData };