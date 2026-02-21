/**
 * Patent Prosecution API Service
 * Handles all API interactions for patent prosecution management
 */

import { ApiClient, ApiResponse } from './apiClient';

// ==================== Type Definitions ====================

export interface PatentApplication {
  id: string;
  title: string;
  application_number?: string;
  patent_number?: string;
  application_type: string;
  jurisdiction: string;
  status: string;
  organization: string;
  attorney?: User;
  inventors: string[];
  assignees: string[];
  priority_date?: string;
  filing_date?: string;
  publication_date?: string;
  grant_date?: string;
  expiry_date?: string;
  abstract: string;
  background: string;
  summary: string;
  detailed_description: string;
  technology_area: string;
  ipc_classes: string[];
  us_classes: string[];
  keywords: string[];
  estimated_value: number;
  costs_to_date: number;
  estimated_total_cost: number;
  is_confidential: boolean;
  priority_level: string;
  created_at: string;
  updated_at: string;
  // Nested relationships
  claims?: Claim[];
  events?: ProsecutionEvent[];
  office_actions?: OfficeAction[];
  deadlines?: ProsecutionDeadline[];
  documents?: ProsecutionDocument[];
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  name?: string;
}

export interface Claim {
  id: string;
  application: string;
  claim_number: number;
  claim_type: 'independent' | 'dependent' | 'multiple_dependent';
  claim_text: string;
  depends_on: string[];
  is_cancelled: boolean;
  is_amended: boolean;
  rejection_history: any[];
  created_at: string;
  updated_at: string;
}

export interface ProsecutionEvent {
  id: string;
  application: string;
  event_type: string;
  event_date: string;
  due_date?: string;
  title: string;
  description: string;
  handled_by?: User;
  documents: string[];
  metadata: Record<string, any>;
  is_completed: boolean;
  is_urgent: boolean;
  created_at: string;
  updated_at: string;
}

export interface OfficeAction {
  id: string;
  application: string;
  action_type: string;
  mailing_date: string;
  response_due_date: string;
  examiner_name: string;
  examiner_phone: string;
  art_unit: string;
  summary: string;
  rejections: any[];
  response_status: 'pending' | 'in_progress' | 'filed' | 'overdue';
  response_strategy: string;
  response_filed_date?: string;
  office_action_document: string;
  response_document: string;
  created_at: string;
  updated_at: string;
}

export interface ProsecutionDeadline {
  id: string;
  application: string | PatentApplication;
  deadline_type: string;
  due_date: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  is_completed: boolean;
  completed_date?: string;
  is_cancelled: boolean;
  reminder_sent: boolean;
  reminder_dates: string[];
  assigned_to?: User;
  created_at: string;
  updated_at: string;
}

export interface ProsecutionDocument {
  id: string;
  application: string;
  document_type: string;
  title: string;
  description: string;
  file_path: string;
  file_size: number;
  file_type: string;
  version: string;
  is_current_version: boolean;
  is_filed: boolean;
  filing_date?: string;
  uploaded_by?: User;
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  total_applications: number;
  active_applications: number;
  draft_applications: number;
  upcoming_deadlines: number;
  office_actions: number;
  recent_activity: ProsecutionEvent[];
}

export interface StatusBreakdown {
  status: string;
  count: number;
}

// ==================== API Service Class ====================

class ProsecutionApiService extends ApiClient {
  private readonly BASE_PATH = '/prosecution';

  // ==================== Patent Applications ====================

  /**
   * Get all patent applications
   */
  async getApplications(params?: {
    status?: string;
    application_type?: string;
    jurisdiction?: string;
    priority_level?: string;
    attorney?: string;
    search?: string;
    page?: number;
    page_size?: number;
  }): Promise<ApiResponse<PatentApplication[]>> {
    return this.get<PatentApplication[]>(`${this.BASE_PATH}/applications/`, { params });
  }

  /**
   * Get a single application by ID
   */
  async getApplication(id: string): Promise<ApiResponse<PatentApplication>> {
    return this.get<PatentApplication>(`${this.BASE_PATH}/applications/${id}/`);
  }

  /**
   * Create a new patent application
   */
  async createApplication(data: Partial<PatentApplication>): Promise<ApiResponse<PatentApplication>> {
    return this.post<PatentApplication>(`${this.BASE_PATH}/applications/`, data);
  }

  /**
   * Update a patent application
   */
  async updateApplication(id: string, data: Partial<PatentApplication>): Promise<ApiResponse<PatentApplication>> {
    return this.patch<PatentApplication>(`${this.BASE_PATH}/applications/${id}/`, data);
  }

  /**
   * Delete a patent application
   */
  async deleteApplication(id: string): Promise<ApiResponse<void>> {
    return this.delete<void>(`${this.BASE_PATH}/applications/${id}/`);
  }

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    return this.get<DashboardStats>(`${this.BASE_PATH}/applications/dashboard_stats/`);
  }

  /**
   * Get status breakdown
   */
  async getStatusBreakdown(): Promise<ApiResponse<StatusBreakdown[]>> {
    return this.get<StatusBreakdown[]>(`${this.BASE_PATH}/applications/status_breakdown/`);
  }

  /**
   * Add event to an application
   */
  async addEvent(applicationId: string, eventData: Partial<ProsecutionEvent>): Promise<ApiResponse<ProsecutionEvent>> {
    return this.post<ProsecutionEvent>(`${this.BASE_PATH}/applications/${applicationId}/add_event/`, eventData);
  }

  // ==================== Claims ====================

  /**
   * Get claims for an application
   */
  async getClaims(params?: {
    application?: string;
    claim_type?: string;
    is_cancelled?: boolean;
    is_amended?: boolean;
  }): Promise<ApiResponse<Claim[]>> {
    return this.get<Claim[]>(`${this.BASE_PATH}/claims/`, { params });
  }

  /**
   * Create a new claim
   */
  async createClaim(data: Partial<Claim>): Promise<ApiResponse<Claim>> {
    return this.post<Claim>(`${this.BASE_PATH}/claims/`, data);
  }

  /**
   * Update a claim
   */
  async updateClaim(id: string, data: Partial<Claim>): Promise<ApiResponse<Claim>> {
    return this.patch<Claim>(`${this.BASE_PATH}/claims/${id}/`, data);
  }

  /**
   * Delete a claim
   */
  async deleteClaim(id: string): Promise<ApiResponse<void>> {
    return this.delete<void>(`${this.BASE_PATH}/claims/${id}/`);
  }

  // ==================== Events ====================

  /**
   * Get prosecution events
   */
  async getEvents(params?: {
    application?: string;
    event_type?: string;
    is_completed?: boolean;
    is_urgent?: boolean;
    search?: string;
  }): Promise<ApiResponse<ProsecutionEvent[]>> {
    return this.get<ProsecutionEvent[]>(`${this.BASE_PATH}/events/`, { params });
  }

  /**
   * Create a prosecution event
   */
  async createEvent(data: Partial<ProsecutionEvent>): Promise<ApiResponse<ProsecutionEvent>> {
    return this.post<ProsecutionEvent>(`${this.BASE_PATH}/events/`, data);
  }

  /**
   * Update an event
   */
  async updateEvent(id: string, data: Partial<ProsecutionEvent>): Promise<ApiResponse<ProsecutionEvent>> {
    return this.patch<ProsecutionEvent>(`${this.BASE_PATH}/events/${id}/`, data);
  }

  /**
   * Delete an event
   */
  async deleteEvent(id: string): Promise<ApiResponse<void>> {
    return this.delete<void>(`${this.BASE_PATH}/events/${id}/`);
  }

  // ==================== Office Actions ====================

  /**
   * Get office actions
   */
  async getOfficeActions(params?: {
    application?: string;
    action_type?: string;
    response_status?: string;
  }): Promise<ApiResponse<OfficeAction[]>> {
    return this.get<OfficeAction[]>(`${this.BASE_PATH}/office-actions/`, { params });
  }

  /**
   * Get overdue office action responses
   */
  async getOverdueResponses(): Promise<ApiResponse<OfficeAction[]>> {
    return this.get<OfficeAction[]>(`${this.BASE_PATH}/office-actions/overdue_responses/`);
  }

  /**
   * Create an office action
   */
  async createOfficeAction(data: Partial<OfficeAction>): Promise<ApiResponse<OfficeAction>> {
    return this.post<OfficeAction>(`${this.BASE_PATH}/office-actions/`, data);
  }

  /**
   * Update an office action
   */
  async updateOfficeAction(id: string, data: Partial<OfficeAction>): Promise<ApiResponse<OfficeAction>> {
    return this.patch<OfficeAction>(`${this.BASE_PATH}/office-actions/${id}/`, data);
  }

  /**
   * Delete an office action
   */
  async deleteOfficeAction(id: string): Promise<ApiResponse<void>> {
    return this.delete<void>(`${this.BASE_PATH}/office-actions/${id}/`);
  }

  // ==================== Deadlines ====================

  /**
   * Get prosecution deadlines
   */
  async getDeadlines(params?: {
    application?: string;
    deadline_type?: string;
    priority?: string;
    is_completed?: boolean;
    assigned_to?: string;
    search?: string;
  }): Promise<ApiResponse<ProsecutionDeadline[]>> {
    return this.get<ProsecutionDeadline[]>(`${this.BASE_PATH}/deadlines/`, { params });
  }

  /**
   * Get upcoming deadlines
   */
  async getUpcomingDeadlines(days: number = 30): Promise<ApiResponse<ProsecutionDeadline[]>> {
    return this.get<ProsecutionDeadline[]>(`${this.BASE_PATH}/deadlines/upcoming/`, { params: { days } });
  }

  /**
   * Create a deadline
   */
  async createDeadline(data: Partial<ProsecutionDeadline>): Promise<ApiResponse<ProsecutionDeadline>> {
    return this.post<ProsecutionDeadline>(`${this.BASE_PATH}/deadlines/`, data);
  }

  /**
   * Update a deadline
   */
  async updateDeadline(id: string, data: Partial<ProsecutionDeadline>): Promise<ApiResponse<ProsecutionDeadline>> {
    return this.patch<ProsecutionDeadline>(`${this.BASE_PATH}/deadlines/${id}/`, data);
  }

  /**
   * Mark a deadline as completed
   */
  async completeDeadline(id: string): Promise<ApiResponse<ProsecutionDeadline>> {
    return this.post<ProsecutionDeadline>(`${this.BASE_PATH}/deadlines/${id}/complete/`, {});
  }

  /**
   * Delete a deadline
   */
  async deleteDeadline(id: string): Promise<ApiResponse<void>> {
    return this.delete<void>(`${this.BASE_PATH}/deadlines/${id}/`);
  }

  // ==================== Documents ====================

  /**
   * Get prosecution documents
   */
  async getDocuments(params?: {
    application?: string;
    document_type?: string;
    is_filed?: boolean;
    is_current_version?: boolean;
    search?: string;
  }): Promise<ApiResponse<ProsecutionDocument[]>> {
    return this.get<ProsecutionDocument[]>(`${this.BASE_PATH}/documents/`, { params });
  }

  /**
   * Create a document
   */
  async createDocument(data: Partial<ProsecutionDocument>): Promise<ApiResponse<ProsecutionDocument>> {
    return this.post<ProsecutionDocument>(`${this.BASE_PATH}/documents/`, data);
  }

  /**
   * Update a document
   */
  async updateDocument(id: string, data: Partial<ProsecutionDocument>): Promise<ApiResponse<ProsecutionDocument>> {
    return this.patch<ProsecutionDocument>(`${this.BASE_PATH}/documents/${id}/`, data);
  }

  /**
   * Delete a document
   */
  async deleteDocument(id: string): Promise<ApiResponse<void>> {
    return this.delete<void>(`${this.BASE_PATH}/documents/${id}/`);
  }
}

// Export singleton instance
export const prosecutionApi = new ProsecutionApiService();

// Export default
export default prosecutionApi;
