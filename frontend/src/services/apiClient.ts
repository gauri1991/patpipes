/**
 * Generic API Client
 * Base API client with authentication and error handling
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export class ApiClient {
  protected baseURL: string;

  constructor(baseURL?: string) {
    this.baseURL = baseURL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
  }

  /**
   * Make authenticated fetch request
   */
  protected async fetchWithAuth<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const token = this.getAccessToken();

      const headers: Record<string, string> = {
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(options.headers || {}),
      };

      // Only set Content-Type if not FormData (browser will set it automatically for FormData)
      if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
      }

      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        // Handle 401 Unauthorized
        if (response.status === 401) {
          try {
            // Attempt token refresh
            await this.refreshToken();
            // Retry original request with new token
            const newToken = this.getAccessToken();
            const retryResponse = await fetch(url, {
              ...options,
              headers: {
                ...headers,
                ...(newToken && { Authorization: `Bearer ${newToken}` }),
              },
            });

            if (retryResponse.ok) {
              // Check if response has content before parsing JSON
              const text = await retryResponse.text();
              const data = text ? JSON.parse(text) : null;
              return { success: true, data };
            }
          } catch (refreshError) {
            // Refresh failed — retry without auth token in case the
            // endpoint allows anonymous access (IsAuthenticatedOrReadOnly).
            try {
              const anonHeaders = { ...headers };
              delete anonHeaders['Authorization'];
              const anonResponse = await fetch(url, {
                ...options,
                headers: anonHeaders,
              });
              if (anonResponse.ok) {
                const text = await anonResponse.text();
                const data = text ? JSON.parse(text) : null;
                return { success: true, data };
              }
            } catch {
              // Anonymous retry also failed
            }

            // Truly requires auth — redirect to login
            this.handleAuthError();
            return {
              success: false,
              error: 'Authentication failed. Please log in again.',
            };
          }
        }

        // Handle other HTTP errors
        const errorData = await response.json().catch(() => ({}));
        // DRF returns field-level errors as { field: ["message"] }
        let errorMessage = errorData.message || errorData.error || errorData.detail;
        if (!errorMessage && typeof errorData === 'object') {
          const fieldErrors = Object.entries(errorData)
            .filter(([, v]) => Array.isArray(v))
            .map(([k, v]) => `${k}: ${(v as string[]).join(', ')}`)
            .join('; ');
          if (fieldErrors) errorMessage = fieldErrors;
        }
        return {
          success: false,
          error: errorMessage || `HTTP Error: ${response.status}`,
        };
      }

      // Check if response has content before parsing JSON
      const text = await response.text();
      const data = text ? JSON.parse(text) : null;
      return { success: true, data };
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred',
      };
    }
  }

  /**
   * Make public fetch request (no auth required)
   */
  protected async fetchPublic<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseURL}${endpoint}`;
      
      const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      };

      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.message || errorData.error || `HTTP Error: ${response.status}`,
        };
      }

      // Check if response has content before parsing JSON
      const text = await response.text();
      const data = text ? JSON.parse(text) : null;
      return { success: true, data };
    } catch (error) {
      console.error('Public API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred',
      };
    }
  }

  /**
   * Get access token from localStorage
   */
  protected getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('patpipes_access_token') || localStorage.getItem('access_token');
  }

  /**
   * Alias for getAccessToken for compatibility
   */
  protected getToken(): string | null {
    return this.getAccessToken();
  }

  /**
   * Get headers for authenticated requests
   */
  protected getHeaders(): Record<string, string> {
    const token = this.getAccessToken();
    return {
      ...(token && { Authorization: `Bearer ${token}` }),
      'Content-Type': 'application/json',
    };
  }

  /**
   * Get refresh token from localStorage
   */
  private getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('patpipes_refresh_token') || localStorage.getItem('refresh_token');
  }

  /**
   * Refresh access token
   */
  private async refreshToken(): Promise<void> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${this.baseURL}/accounts/auth/refresh/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    
    // Save new tokens (use patpipes_ keys to match auth system)
    if (typeof window !== 'undefined') {
      localStorage.setItem('patpipes_access_token', data.access);
      localStorage.setItem('access_token', data.access);
      if (data.refresh) {
        localStorage.setItem('patpipes_refresh_token', data.refresh);
        localStorage.setItem('refresh_token', data.refresh);
      }
    }
  }

  /**
   * Handle authentication errors
   */
  private handleAuthError(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('auth_session');
      localStorage.removeItem('patpipes_access_token');
      localStorage.removeItem('patpipes_refresh_token');
      localStorage.removeItem('patpipes_user');

      // Don't hard-redirect here — let the Zustand auth store and
      // dashboard layout handle the redirect. Hard redirects here
      // cause race conditions with other auth checks.
    }
  }

  // HTTP Methods
  async get<T>(endpoint: string, options?: { params?: Record<string, any> }): Promise<ApiResponse<T>> {
    let url = endpoint;
    if (options?.params) {
      // Filter out undefined and null values to prevent sending "undefined" strings
      const cleanParams = Object.fromEntries(
        Object.entries(options.params).filter(([, value]) => value !== undefined && value !== null)
      );
      if (Object.keys(cleanParams).length > 0) {
        url = `${endpoint}?${new URLSearchParams(cleanParams).toString()}`;
      }
    }
    return this.fetchWithAuth<T>(url, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.fetchWithAuth<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.fetchWithAuth<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.fetchWithAuth<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.fetchWithAuth<T>(endpoint, { method: 'DELETE' });
  }

  // Static methods for convenience
  static async get<T>(endpoint: string, options?: { params?: Record<string, any> }): Promise<ApiResponse<T>> {
    return apiClient.get<T>(endpoint, options);
  }

  static async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return apiClient.post<T>(endpoint, data);
  }

  static async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return apiClient.put<T>(endpoint, data);
  }

  static async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return apiClient.patch<T>(endpoint, data);
  }

  static async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return apiClient.delete<T>(endpoint);
  }
}

// Create and export singleton instance
export const apiClient = new ApiClient();