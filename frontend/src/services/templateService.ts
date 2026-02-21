/**
 * Template Service
 * Centralized service for managing all types of templates across the platform
 */

import { 
  Template,
  TemplateType,
  TemplateScope,
  ChartTemplate,
  ReportTemplate,
  DashboardTemplate,
  TemplateFilter,
  TemplateCreationData,
  TemplateUsageStats
} from '@/types/template.types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
const API_ENDPOINT = `${API_BASE_URL}/analytics/api/templates`;

class TemplateService {
  private getHeaders() {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    // Add auth token if available
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    
    return headers;
  }

  private buildQueryParams(params: Record<string, any>): string {
    const queryParams = new URLSearchParams();
    
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        if (Array.isArray(params[key])) {
          params[key].forEach((value: any) => {
            queryParams.append(key, value);
          });
        } else {
          queryParams.append(key, params[key].toString());
        }
      }
    });
    
    return queryParams.toString();
  }

  // Get all templates with optional filtering (analytics only: charts, reports, documents)
  async getTemplates(filter?: TemplateFilter): Promise<Template[]> {
    try {
      const queryParams = filter ? this.buildQueryParams({
        type: filter.type?.[0], // API expects single type
        category: filter.category?.[0],
        scope: filter.scope?.[0],
        search: filter.search_term,
        is_active: filter.is_active,
      }) : '';
      
      const url = queryParams ? `${API_ENDPOINT}/?${queryParams}` : `${API_ENDPOINT}/`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      let templates = Array.isArray(data) ? data : data.results || [];
      
      // Filter out dashboard and workflow templates for analytics interface
      templates = templates.filter((template: any) => 
        template.template_type === 'chart' || 
        template.template_type === 'report' || 
        template.template_type === 'document'
      );
      
      return templates;
    } catch (error) {
      console.error('Failed to fetch templates:', error);
      // Return empty array on error
      return [];
    }
  }

  // Get template by ID
  async getTemplateById(id: string): Promise<Template | null> {
    try {
      const response = await fetch(`${API_ENDPOINT}/${id}/`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Failed to fetch template ${id}:`, error);
      return null;
    }
  }

  // Get popular templates
  async getPopularTemplates(limit: number = 10, type?: TemplateType): Promise<Template[]> {
    try {
      const queryParams = this.buildQueryParams({
        limit,
        type: type,
      });
      
      const response = await fetch(`${API_ENDPOINT}/popular/?${queryParams}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch popular templates:', error);
      return [];
    }
  }

  // Get recent templates
  async getRecentTemplates(limit: number = 10, type?: TemplateType): Promise<Template[]> {
    try {
      const queryParams = this.buildQueryParams({
        limit,
        type: type,
      });
      
      const response = await fetch(`${API_ENDPOINT}/recent/?${queryParams}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch recent templates:', error);
      return [];
    }
  }

  // Create a new template
  async createTemplate(data: TemplateCreationData): Promise<Template | null> {
    try {
      const response = await fetch(`${API_ENDPOINT}/`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to create template:', error);
      throw error;
    }
  }

  // Update a template
  async updateTemplate(id: string, updates: Partial<Template>): Promise<Template | null> {
    try {
      const response = await fetch(`${API_ENDPOINT}/${id}/`, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Failed to update template ${id}:`, error);
      throw error;
    }
  }

  // Delete a template
  async deleteTemplate(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_ENDPOINT}/${id}/`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });
      
      if (!response.ok && response.status !== 204) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return true;
    } catch (error) {
      console.error(`Failed to delete template ${id}:`, error);
      return false;
    }
  }

  // Duplicate a template
  async duplicateTemplate(id: string, newName: string): Promise<Template | null> {
    try {
      const response = await fetch(`${API_ENDPOINT}/${id}/duplicate/`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ name: newName }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Failed to duplicate template ${id}:`, error);
      throw error;
    }
  }

  // Increment usage count
  async incrementUsage(id: string): Promise<void> {
    try {
      const response = await fetch(`${API_ENDPOINT}/${id}/increment_usage/`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({}),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error(`Failed to increment usage for template ${id}:`, error);
    }
  }

  // Get usage statistics
  async getUsageStats(id: string): Promise<TemplateUsageStats | null> {
    try {
      // This endpoint might not exist yet, so return mock data for now
      const response = await fetch(`${API_ENDPOINT}/${id}/stats/`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      
      if (!response.ok) {
        // Return mock stats if endpoint doesn't exist
        return {
          total_uses: 0,
          unique_users: 0,
          last_used: new Date().toISOString(),
          average_rating: 0,
          usage_by_day: {},
          usage_by_user: {},
          modifications_frequency: {}
        };
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Failed to get usage stats for template ${id}:`, error);
      return null;
    }
  }

  // Search templates
  async searchTemplates(query: string, type?: TemplateType): Promise<Template[]> {
    try {
      const queryParams = this.buildQueryParams({
        search: query,
        type: type,
      });
      
      const response = await fetch(`${API_ENDPOINT}/?${queryParams}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return Array.isArray(data) ? data : data.results || [];
    } catch (error) {
      console.error('Failed to search templates:', error);
      return [];
    }
  }

  // Get all unique categories
  async getCategories(type?: TemplateType): Promise<string[]> {
    try {
      const queryParams = type ? this.buildQueryParams({ type }) : '';
      const url = queryParams ? `${API_ENDPOINT}/categories/?${queryParams}` : `${API_ENDPOINT}/categories/`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      return [];
    }
  }

  // Get all unique tags
  async getTags(type?: TemplateType): Promise<string[]> {
    try {
      const queryParams = type ? this.buildQueryParams({ type }) : '';
      const url = queryParams ? `${API_ENDPOINT}/tags/?${queryParams}` : `${API_ENDPOINT}/tags/`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch tags:', error);
      return [];
    }
  }

  // Get template count by type (analytics only: charts, reports, documents)
  async getTemplateCountByType(): Promise<Record<TemplateType, number>> {
    try {
      // Get all templates and count them ourselves to filter out dashboard/workflow
      const templates = await this.getTemplates();
      
      const counts = {
        [TemplateType.CHART]: 0,
        [TemplateType.REPORT]: 0,
        [TemplateType.DOCUMENT]: 0
      } as Record<TemplateType, number>;
      
      templates.forEach(template => {
        if (template.template_type in counts) {
          counts[template.template_type]++;
        }
      });
      
      return counts;
    } catch (error) {
      console.error('Failed to fetch template counts:', error);
      return {
        [TemplateType.CHART]: 0,
        [TemplateType.REPORT]: 0,
        [TemplateType.DOCUMENT]: 0
      } as Record<TemplateType, number>;
    }
  }
}

export const templateService = new TemplateService();