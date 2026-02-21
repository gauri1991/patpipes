/**
 * Attorney Network API Service
 * Handles all API interactions for attorney directory and connections
 */

import { ApiClient, ApiResponse } from './apiClient';

// ==================== Type Definitions ====================

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role?: string;
}

export interface LawFirm {
  id: string;
  name: string;
  display_name?: string;
  normalized_name?: string;
  normalization_confidence?: 'high' | 'needs_review';
  website?: string;
  email?: string;
  phone?: string;

  // Location
  address?: string;
  city: string;
  state?: string;
  country: string;
  postal_code?: string;

  // Organization Details
  firm_size: 'solo' | 'small' | 'medium' | 'large' | 'enterprise';
  established_year?: number;
  description?: string;
  practice_areas: string[];
  technology_focus: string[];

  // Ratings & Reviews
  rating: number;
  review_count: number;

  // Status
  is_verified: boolean;
  is_active: boolean;

  // Metadata
  created_at: string;
  updated_at: string;
  created_by?: User;

  // Additional
  attorney_count?: number;
}

export interface Attorney {
  id: string;
  user?: User;

  // Basic Information
  first_name: string;
  last_name: string;
  middle_initial?: string;
  suffix?: string;
  full_name: string;
  email?: string;
  phone?: string;
  source: 'manual' | 'uspto_roster';
  practitioner_type?: string;
  govt_employee: boolean;
  is_uspto_verified?: boolean;

  // Address (direct, from roster)
  street_address?: string;
  address_line_2?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;

  // Professional Details
  title?: string;
  law_firm?: LawFirm;
  law_firm_name?: string;
  law_firm_id?: string;
  independent: boolean;

  // Credentials
  bar_admissions: string[];
  registration_number?: string;
  admitted_year?: number;

  // Education
  law_school?: string;
  law_school_grad_year?: number;
  undergraduate?: string;
  technical_degree?: string;

  // Professional Background
  experience_level: 'junior' | 'mid_level' | 'senior' | 'partner' | 'unknown';
  years_of_experience: number;

  // Specializations
  specializations: string[];
  technology_areas: string[];
  industries_served: string[];

  // Bio & Profile
  bio?: string;
  linkedin_url?: string;
  profile_photo?: string;

  // Practice Statistics
  cases_handled: number;
  patents_drafted: number;
  patents_granted: number;
  success_rate: number;

  // Languages
  languages: string[];

  // Availability & Rates
  hourly_rate_min?: number;
  hourly_rate_max?: number;
  accepting_new_clients: boolean;
  available_for_consultation: boolean;
  consultation_fee?: number;

  // Ratings & Reviews
  rating: number;
  review_count: number;

  // Status
  is_verified: boolean;
  is_featured: boolean;
  is_active: boolean;

  // Metadata
  created_at: string;
  updated_at: string;
  created_by?: User;
}

export interface AttorneyReview {
  id: string;
  attorney: string;
  attorney_name?: string;
  reviewer?: User;

  // Review Content
  rating: number;
  title: string;
  review_text: string;

  // Review Categories
  communication_rating?: number;
  expertise_rating?: number;
  value_rating?: number;
  responsiveness_rating?: number;

  // Service Details
  service_type?: string;
  service_date?: string;
  would_recommend: boolean;

  // Moderation
  is_verified: boolean;
  is_approved: boolean;
  is_flagged: boolean;

  // Metadata
  created_at: string;
  updated_at: string;
}

export interface AttorneyConnection {
  id: string;
  user: User;
  attorney: Attorney;

  // Connection Details
  status: 'pending' | 'accepted' | 'declined' | 'active' | 'completed';
  connection_type: string;
  message?: string;
  response?: string;

  // Dates
  requested_date: string;
  responded_date?: string;
  engagement_start_date?: string;
  engagement_end_date?: string;

  // Notes
  notes?: string;

  // Metadata
  created_at: string;
  updated_at: string;
}

export interface AttorneySnapshot {
  id: number;
  registration_number: string;
  snapshot_date: string;
  first_name: string;
  last_name: string;
  middle_initial?: string;
  suffix?: string;
  firm_name?: string;
  firm_line_2?: string;
  street_address?: string;
  address_line_2?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  phone?: string;
  practitioner_type?: string;
  govt_employee: boolean;
}

export interface AttorneyFirmHistory {
  firm_name: string;
  city?: string;
  state?: string;
  country?: string;
  start_date: string;
  end_date: string;
}

export interface DirectoryStats {
  total_firms?: number;
  verified_firms?: number;
  firms_by_size?: Record<string, number>;
  firms_by_country?: Record<string, number>;
  total_attorneys: number;
  verified_attorneys: number;
  accepting_clients: number;
  by_experience_level: Record<string, number>;
  avg_rating: number;
  avg_years_experience: number;
  uspto_roster_count?: number;
  by_practitioner_type?: Record<string, number>;
}

export interface AttorneySearchParams {
  query?: string;
  specialization?: string[];
  technology_area?: string[];
  bar_admission?: string;
  experience_level?: string;
  min_rating?: number;
  hourly_rate_max?: number;
  accepting_new_clients?: boolean;
  is_verified?: boolean;
  city?: string;
  state?: string;
  country?: string;
}

// ==================== API Service Class ====================

class AttorneyApiService extends ApiClient {
  private readonly BASE_PATH = '/attorney';

  // ==================== Law Firms ====================

  async getLawFirms(params?: {
    firm_size?: string;
    country?: string;
    city?: string;
    is_verified?: boolean;
    is_active?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
    ordering?: string;
  }): Promise<ApiResponse<LawFirm[]>> {
    return this.get<LawFirm[]>(`${this.BASE_PATH}/law-firms/`, { params });
  }

  async getLawFirm(id: string): Promise<ApiResponse<LawFirm>> {
    return this.get<LawFirm>(`${this.BASE_PATH}/law-firms/${id}/`);
  }

  async createLawFirm(data: Partial<LawFirm>): Promise<ApiResponse<LawFirm>> {
    return this.post<LawFirm>(`${this.BASE_PATH}/law-firms/`, data);
  }

  async updateLawFirm(id: string, data: Partial<LawFirm>): Promise<ApiResponse<LawFirm>> {
    return this.patch<LawFirm>(`${this.BASE_PATH}/law-firms/${id}/`, data);
  }

  async deleteLawFirm(id: string): Promise<ApiResponse<void>> {
    return this.delete<void>(`${this.BASE_PATH}/law-firms/${id}/`);
  }

  async getLawFirmAttorneys(firmId: string): Promise<ApiResponse<Attorney[]>> {
    return this.get<Attorney[]>(`${this.BASE_PATH}/law-firms/${firmId}/attorneys/`);
  }

  async getNeedsReviewFirms(params?: { limit?: number; offset?: number }): Promise<ApiResponse<LawFirm[]>> {
    return this.get<LawFirm[]>(`${this.BASE_PATH}/law-firms/needs_review/`, { params });
  }

  async bulkApproveFirms(updates: { id: string; normalized_name: string }[]): Promise<ApiResponse<{ updated: number }>> {
    return this.post<{ updated: number }>(`${this.BASE_PATH}/law-firms/bulk-approve/`, { updates });
  }

  async getLawFirmStats(): Promise<ApiResponse<DirectoryStats>> {
    return this.get<DirectoryStats>(`${this.BASE_PATH}/law-firms/directory_stats/`);
  }

  // ==================== Attorneys ====================

  async getAttorneys(params?: {
    experience_level?: string;
    independent?: boolean;
    is_verified?: boolean;
    is_featured?: boolean;
    is_active?: boolean;
    accepting_new_clients?: boolean;
    source?: string;
    practitioner_type?: string;
    search?: string;
    limit?: number;
    offset?: number;
    ordering?: string;
  }): Promise<ApiResponse<Attorney[]>> {
    return this.get<Attorney[]>(`${this.BASE_PATH}/attorneys/`, { params });
  }

  async getAttorney(id: string): Promise<ApiResponse<Attorney>> {
    return this.get<Attorney>(`${this.BASE_PATH}/attorneys/${id}/`);
  }

  async createAttorney(data: Partial<Attorney>): Promise<ApiResponse<Attorney>> {
    return this.post<Attorney>(`${this.BASE_PATH}/attorneys/`, data);
  }

  async updateAttorney(id: string, data: Partial<Attorney>): Promise<ApiResponse<Attorney>> {
    return this.patch<Attorney>(`${this.BASE_PATH}/attorneys/${id}/`, data);
  }

  async deleteAttorney(id: string): Promise<ApiResponse<void>> {
    return this.delete<void>(`${this.BASE_PATH}/attorneys/${id}/`);
  }

  async searchAttorneys(searchParams: AttorneySearchParams): Promise<ApiResponse<{
    count: number;
    results: Attorney[];
  }>> {
    return this.post<{ count: number; results: Attorney[] }>(
      `${this.BASE_PATH}/attorneys/search/`,
      searchParams
    );
  }

  async getFeaturedAttorneys(): Promise<ApiResponse<Attorney[]>> {
    return this.get<Attorney[]>(`${this.BASE_PATH}/attorneys/featured/`);
  }

  async getAttorneyStats(): Promise<ApiResponse<DirectoryStats>> {
    return this.get<DirectoryStats>(`${this.BASE_PATH}/attorneys/directory_stats/`);
  }

  async getAttorneyReviews(attorneyId: string): Promise<ApiResponse<AttorneyReview[]>> {
    return this.get<AttorneyReview[]>(`${this.BASE_PATH}/attorneys/${attorneyId}/reviews/`);
  }

  async getAttorneyHistory(attorneyId: string): Promise<ApiResponse<AttorneySnapshot[]>> {
    return this.get<AttorneySnapshot[]>(`${this.BASE_PATH}/attorneys/${attorneyId}/history/`);
  }

  async getAttorneyFirmHistory(attorneyId: string): Promise<ApiResponse<AttorneyFirmHistory[]>> {
    return this.get<AttorneyFirmHistory[]>(`${this.BASE_PATH}/attorneys/${attorneyId}/firm-history/`);
  }

  // ==================== Reviews ====================

  async getReviews(params?: {
    attorney?: string;
    rating?: number;
    is_verified?: boolean;
    is_approved?: boolean;
    would_recommend?: boolean;
  }): Promise<ApiResponse<AttorneyReview[]>> {
    return this.get<AttorneyReview[]>(`${this.BASE_PATH}/reviews/`, { params });
  }

  async createReview(data: Partial<AttorneyReview>): Promise<ApiResponse<AttorneyReview>> {
    return this.post<AttorneyReview>(`${this.BASE_PATH}/reviews/`, data);
  }

  async updateReview(id: string, data: Partial<AttorneyReview>): Promise<ApiResponse<AttorneyReview>> {
    return this.patch<AttorneyReview>(`${this.BASE_PATH}/reviews/${id}/`, data);
  }

  async deleteReview(id: string): Promise<ApiResponse<void>> {
    return this.delete<void>(`${this.BASE_PATH}/reviews/${id}/`);
  }

  async flagReview(id: string): Promise<ApiResponse<{ status: string }>> {
    return this.post<{ status: string }>(`${this.BASE_PATH}/reviews/${id}/flag/`, {});
  }

  async approveReview(id: string): Promise<ApiResponse<{ status: string }>> {
    return this.post<{ status: string }>(`${this.BASE_PATH}/reviews/${id}/approve/`, {});
  }

  // ==================== Connections ====================

  async getConnections(params?: {
    user?: string;
    attorney?: string;
    status?: string;
    connection_type?: string;
  }): Promise<ApiResponse<AttorneyConnection[]>> {
    return this.get<AttorneyConnection[]>(`${this.BASE_PATH}/connections/`, { params });
  }

  async createConnection(data: Partial<AttorneyConnection>): Promise<ApiResponse<AttorneyConnection>> {
    return this.post<AttorneyConnection>(`${this.BASE_PATH}/connections/`, data);
  }

  async updateConnection(id: string, data: Partial<AttorneyConnection>): Promise<ApiResponse<AttorneyConnection>> {
    return this.patch<AttorneyConnection>(`${this.BASE_PATH}/connections/${id}/`, data);
  }

  async deleteConnection(id: string): Promise<ApiResponse<void>> {
    return this.delete<void>(`${this.BASE_PATH}/connections/${id}/`);
  }

  async acceptConnection(id: string, response?: string): Promise<ApiResponse<{
    status: string;
    connection: AttorneyConnection;
  }>> {
    return this.post<{ status: string; connection: AttorneyConnection }>(
      `${this.BASE_PATH}/connections/${id}/accept/`,
      { response }
    );
  }

  async declineConnection(id: string, response?: string): Promise<ApiResponse<{
    status: string;
    connection: AttorneyConnection;
  }>> {
    return this.post<{ status: string; connection: AttorneyConnection }>(
      `${this.BASE_PATH}/connections/${id}/decline/`,
      { response }
    );
  }

  async completeConnection(
    id: string,
    data: { engagement_end_date?: string; notes?: string }
  ): Promise<ApiResponse<{
    status: string;
    connection: AttorneyConnection;
  }>> {
    return this.post<{ status: string; connection: AttorneyConnection }>(
      `${this.BASE_PATH}/connections/${id}/complete/`,
      data
    );
  }
}

// Export singleton instance
export const attorneyApi = new AttorneyApiService();

// Export default
export default attorneyApi;
