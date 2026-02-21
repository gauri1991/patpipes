/**
 * Patent Prosecution API Client
 * Handles all API interactions with the prosecution backend
 */

import { PatentApplication, Claim, ProsecutionDocument } from '@/types/prosecution';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// API Error handling
class APIError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'APIError';
  }
}

// Generic API request handler
async function apiRequest<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      // Add auth token if needed
      ...(typeof window !== 'undefined' && localStorage.getItem('access_token') && {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      })
    },
  };

  const config = { ...defaultOptions, ...options };
  
  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new APIError(
        `API request failed: ${response.statusText}`,
        response.status
      );
    }
    
    // Handle empty responses (like 204 No Content)
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return {} as T;
    }
    
    return await response.json();
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Patent Application API methods
export const prosecutionApi = {
  // Get all patent applications
  async getApplications(): Promise<PatentApplication[]> {
    return apiRequest<PatentApplication[]>('/prosecution/applications/');
  },

  // Get a specific patent application
  async getApplication(id: string): Promise<PatentApplication> {
    return apiRequest<PatentApplication>(`/prosecution/applications/${id}/`);
  },

  // Create a new patent application
  async createApplication(data: Partial<PatentApplication>): Promise<PatentApplication> {
    return apiRequest<PatentApplication>('/prosecution/applications/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Update a patent application
  async updateApplication(id: string, data: Partial<PatentApplication>): Promise<PatentApplication> {
    return apiRequest<PatentApplication>(`/prosecution/applications/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // Delete a patent application
  async deleteApplication(id: string): Promise<void> {
    return apiRequest<void>(`/prosecution/applications/${id}/`, {
      method: 'DELETE',
    });
  },

  // Claims API
  async getClaims(applicationId: string): Promise<Claim[]> {
    return apiRequest<Claim[]>(`/prosecution/claims/?application=${applicationId}`);
  },

  async createClaim(data: Partial<Claim>): Promise<Claim> {
    return apiRequest<Claim>('/prosecution/claims/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateClaim(id: string, data: Partial<Claim>): Promise<Claim> {
    return apiRequest<Claim>(`/prosecution/claims/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteClaim(id: string): Promise<void> {
    return apiRequest<void>(`/prosecution/claims/${id}/`, {
      method: 'DELETE',
    });
  },

  // Documents API
  async getDocuments(applicationId: string): Promise<ProsecutionDocument[]> {
    return apiRequest<ProsecutionDocument[]>(`/prosecution/documents/?application=${applicationId}`);
  },

  async uploadDocument(file: File, applicationId: string, documentType: string): Promise<ProsecutionDocument> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('application', applicationId);
    formData.append('document_type', documentType);
    formData.append('title', file.name);

    return apiRequest<ProsecutionDocument>('/prosecution/documents/', {
      method: 'POST',
      body: formData,
      headers: {
        // Remove Content-Type to let browser set boundary for FormData
        ...(typeof window !== 'undefined' && localStorage.getItem('access_token') && {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        })
      },
    });
  },

  // Auto-save helper - debounced update
  async autoSave(id: string, data: Partial<PatentApplication>): Promise<PatentApplication> {
    return this.updateApplication(id, data);
  },

  // Dashboard stats (if needed)
  async getDashboardStats(): Promise<any> {
    return apiRequest<any>('/prosecution/applications/dashboard_stats/');
  },
};

// Export API error for error handling
export { APIError };