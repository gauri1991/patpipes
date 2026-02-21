/**
 * Portfolio Service
 * API service for portfolio management
 */

import { apiClient } from '@/services/apiClient';

interface Portfolio {
  id: string;
  name: string;
  company_name: string;
  description?: string;
  organization?: string;
  owner?: string;
  owner_name?: string;
  total_patents: number;
  active_patents: number;
  pending_patents: number;
  expired_patents: number;
  total_value: number;
  annual_maintenance_cost: number;
  estimated_odp_count: number | null;
  is_active: boolean;
  tags?: string[];
  settings?: Record<string, any>;
  accessible_users_count?: number;
  patents_count?: number;
  created_at: string;
  updated_at: string;
}

interface PortfolioAccess {
  portfolio_count: number;
  portfolios: Portfolio[];
  default_portfolio?: string;
}

interface PortfolioMetrics {
  total_patents: number;
  by_status: Array<{ status: string; count: number }>;
  by_type: Array<{ patent_type: string; count: number }>;
  total_value: number;
  total_maintenance: number;
  by_technology: Array<{ technology_area: string; count: number }>;
  recent_filings: any[];
  expiring_soon: any[];
  infringement_summary?: {
    total_cases: number;
    active_cases: number;
    high_risk_cases: number;
  };
}

class PortfolioService {
  private baseUrl = '/patents/portfolios';

  /**
   * Get user's portfolio access information
   */
  async getUserAccess(): Promise<PortfolioAccess> {
    const response = await apiClient.get<PortfolioAccess>(`${this.baseUrl}/user_access/`);
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch portfolio access');
    }
    return response.data as PortfolioAccess;
  }

  /**
   * Get all portfolios accessible to the user
   */
  async getPortfolios(): Promise<Portfolio[]> {
    const response = await apiClient.get<Portfolio[]>(`${this.baseUrl}/`);
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch portfolios');
    }
    return response.data || [];
  }

  /**
   * Get a specific portfolio by ID
   */
  async getPortfolio(id: string): Promise<Portfolio> {
    const response = await apiClient.get<Portfolio>(`${this.baseUrl}/${id}/`);
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch portfolio');
    }
    return response.data as Portfolio;
  }

  /**
   * Create a new portfolio
   */
  async createPortfolio(data: Partial<Portfolio>): Promise<Portfolio> {
    const response = await apiClient.post<Portfolio>(`${this.baseUrl}/`, data);
    if (!response.success) {
      throw new Error(response.error || 'Failed to create portfolio');
    }
    return response.data as Portfolio;
  }

  /**
   * Update an existing portfolio
   */
  async updatePortfolio(id: string, data: Partial<Portfolio>): Promise<Portfolio> {
    const response = await apiClient.patch<Portfolio>(`${this.baseUrl}/${id}/`, data);
    if (!response.success) {
      throw new Error(response.error || 'Failed to update portfolio');
    }
    return response.data as Portfolio;
  }

  /**
   * Delete a portfolio
   */
  async deletePortfolio(id: string): Promise<void> {
    const response = await apiClient.delete(`${this.baseUrl}/${id}/`);
    if (!response.success) {
      throw new Error(response.error || 'Failed to delete portfolio');
    }
  }

  /**
   * Get portfolio metrics
   */
  async refreshODPCount(id: string): Promise<{ estimated_odp_count: number }> {
    const response = await apiClient.post<{ estimated_odp_count: number }>(`${this.baseUrl}/${id}/refresh-odp-count/`, {});
    if (!response.success) {
      throw new Error(response.error || 'Failed to refresh ODP count');
    }
    return response.data as { estimated_odp_count: number };
  }

  async getPortfolioMetrics(id: string): Promise<PortfolioMetrics> {
    const response = await apiClient.get<PortfolioMetrics>(`${this.baseUrl}/${id}/metrics/`);
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch portfolio metrics');
    }
    return response.data as PortfolioMetrics;
  }

  /**
   * Update portfolio metrics (refresh cache)
   */
  async updatePortfolioMetrics(id: string): Promise<Portfolio> {
    const response = await apiClient.post<Portfolio>(`${this.baseUrl}/${id}/update_metrics/`);
    if (!response.success) {
      throw new Error(response.error || 'Failed to update portfolio metrics');
    }
    return response.data as Portfolio;
  }

  /**
   * Get portfolio access list
   */
  async getPortfolioAccess(id: string): Promise<any[]> {
    const response = await apiClient.get<any[]>(`${this.baseUrl}/${id}/access/`);
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch portfolio access');
    }
    return response.data || [];
  }

  /**
   * Grant user access to portfolio
   */
  async grantPortfolioAccess(
    portfolioId: string, 
    userId: string, 
    accessLevel: 'viewer' | 'editor' | 'manager' | 'owner'
  ): Promise<any> {
    const response = await apiClient.post(`${this.baseUrl}/${portfolioId}/access/`, {
      user_id: userId,
      access_level: accessLevel
    });
    if (!response.success) {
      throw new Error(response.error || 'Failed to grant portfolio access');
    }
    return response.data;
  }
}

export const portfolioService = new PortfolioService();