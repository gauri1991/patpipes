/**
 * useGlobalTemplates Hook
 * Centralized management of global chart templates across the application
 */

import { useState, useEffect } from 'react';
import { 
  LineChart, 
  Network, 
  TrendingUp, 
  MapPin, 
  Zap, 
  PieChart,
  BarChart3,
  ScatterChart
} from 'lucide-react';

export interface GlobalChartTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ElementType;
  type: string;
  scope: 'personal' | 'team' | 'organization';
  created_by: {
    name: string;
    avatar?: string;
  };
  usage_count: number;
  created_at: string;
  updated_at: string;
  tags: string[];
  preview?: string;
  config?: any;
}

const GLOBAL_CHART_TEMPLATES: GlobalChartTemplate[] = [
  {
    id: 'patent_timeline',
    name: 'Patent Filing Timeline',
    description: 'Track patent filings over time periods with trend analysis',
    category: 'Temporal Analysis',
    icon: LineChart,
    type: 'line',
    scope: 'organization',
    created_by: { name: 'System' },
    usage_count: 156,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-20T14:30:00Z',
    tags: ['patents', 'timeline', 'trends', 'filing'],
    config: {
      chartType: 'line',
      xAxis: 'filing_date',
      yAxis: 'patent_count',
      colorBy: 'technology_area'
    }
  },
  {
    id: 'technology_landscape',
    name: 'Technology Landscape Map',
    description: 'Visualize technology areas and their relationships',
    category: 'Technology Analysis',
    icon: Network,
    type: 'network',
    scope: 'organization',
    created_by: { name: 'System' },
    usage_count: 89,
    created_at: '2024-01-10T09:00:00Z',
    updated_at: '2024-01-18T16:45:00Z',
    tags: ['technology', 'landscape', 'innovation', 'relationships'],
    config: {
      chartType: 'network',
      layout: 'force-directed',
      nodeSize: 'patent_count',
      nodeColor: 'technology_area'
    }
  },
  {
    id: 'competitive_positioning',
    name: 'Competitive Positioning',
    description: 'Compare competitors in technology space',
    category: 'Competitive Intelligence',
    icon: TrendingUp,
    type: 'scatter',
    scope: 'organization',
    created_by: { name: 'System' },
    usage_count: 124,
    created_at: '2024-01-12T11:30:00Z',
    updated_at: '2024-01-22T13:20:00Z',
    tags: ['competition', 'positioning', 'analysis', 'benchmarking'],
    config: {
      chartType: 'scatter',
      xAxis: 'innovation_score',
      yAxis: 'market_position',
      sizeBy: 'patent_count',
      colorBy: 'company'
    }
  },
  {
    id: 'geographic_distribution',
    name: 'Geographic Distribution',
    description: 'Patent activity by geographic region',
    category: 'Geographic Analysis',
    icon: MapPin,
    type: 'choropleth',
    scope: 'team',
    created_by: { name: 'Analytics Team' },
    usage_count: 67,
    created_at: '2024-01-08T14:15:00Z',
    updated_at: '2024-01-19T10:30:00Z',
    tags: ['geography', 'regions', 'distribution', 'global'],
    config: {
      chartType: 'map',
      regions: 'geographic_region',
      valueBy: 'patent_count',
      colorScale: 'blues'
    }
  },
  {
    id: 'white_space_analysis',
    name: 'White Space Analysis',
    description: 'Identify innovation opportunities and gaps',
    category: 'Opportunity Analysis',
    icon: Zap,
    type: 'heatmap',
    scope: 'personal',
    created_by: { name: 'John Smith' },
    usage_count: 34,
    created_at: '2024-01-25T08:45:00Z',
    updated_at: '2024-01-28T15:10:00Z',
    tags: ['opportunities', 'gaps', 'innovation', 'whitespace'],
    config: {
      chartType: 'heatmap',
      xAxis: 'technology_category',
      yAxis: 'application_area',
      valueBy: 'patent_density'
    }
  },
  {
    id: 'patent_portfolio_overview',
    name: 'Patent Portfolio Overview',
    description: 'Comprehensive overview of patent portfolio composition',
    category: 'Portfolio Analysis',
    icon: PieChart,
    type: 'pie',
    scope: 'organization',
    created_by: { name: 'System' },
    usage_count: 98,
    created_at: '2024-01-14T12:00:00Z',
    updated_at: '2024-01-25T09:15:00Z',
    tags: ['portfolio', 'composition', 'overview', 'distribution'],
    config: {
      chartType: 'pie',
      valueBy: 'patent_count',
      groupBy: 'technology_area',
      showPercentages: true
    }
  },
  {
    id: 'innovation_trends',
    name: 'Innovation Trends Analysis',
    description: 'Track innovation patterns and emerging trends',
    category: 'Trend Analysis',
    icon: BarChart3,
    type: 'bar',
    scope: 'organization',
    created_by: { name: 'System' },
    usage_count: 142,
    created_at: '2024-01-16T08:30:00Z',
    updated_at: '2024-01-26T14:20:00Z',
    tags: ['innovation', 'trends', 'emerging', 'patterns'],
    config: {
      chartType: 'bar',
      xAxis: 'time_period',
      yAxis: 'innovation_score',
      groupBy: 'technology_domain'
    }
  }
];

export function useGlobalTemplates() {
  const [templates, setTemplates] = useState<GlobalChartTemplate[]>(GLOBAL_CHART_TEMPLATES);
  const [loading, setLoading] = useState(false);

  // Get templates by category
  const getTemplatesByCategory = (category: string) => {
    return templates.filter(template => template.category === category);
  };

  // Get templates by scope
  const getTemplatesByScope = (scope: 'personal' | 'team' | 'organization') => {
    return templates.filter(template => template.scope === scope);
  };

  // Get most used templates
  const getPopularTemplates = (limit: number = 5) => {
    return [...templates]
      .sort((a, b) => b.usage_count - a.usage_count)
      .slice(0, limit);
  };

  // Search templates
  const searchTemplates = (query: string) => {
    const lowerQuery = query.toLowerCase();
    return templates.filter(template => 
      template.name.toLowerCase().includes(lowerQuery) ||
      template.description.toLowerCase().includes(lowerQuery) ||
      template.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  };

  // Get template by ID
  const getTemplateById = (id: string) => {
    return templates.find(template => template.id === id);
  };

  // Get all categories
  const getCategories = () => {
    return [...new Set(templates.map(template => template.category))];
  };

  // Create new template (mock - would be API call)
  const createTemplate = async (templateData: Partial<GlobalChartTemplate>) => {
    const newTemplate: GlobalChartTemplate = {
      id: `template_${Date.now()}`,
      name: templateData.name || 'New Template',
      description: templateData.description || '',
      category: templateData.category || 'Custom',
      icon: templateData.icon || BarChart3,
      type: templateData.type || 'line',
      scope: templateData.scope || 'personal',
      created_by: templateData.created_by || { name: 'Current User' },
      usage_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tags: templateData.tags || [],
      config: templateData.config || {}
    };

    setTemplates(prev => [...prev, newTemplate]);
    return newTemplate;
  };

  // Update template usage count
  const incrementUsage = (templateId: string) => {
    setTemplates(prev => prev.map(template => 
      template.id === templateId 
        ? { ...template, usage_count: template.usage_count + 1 }
        : template
    ));
  };

  // Delete template
  const deleteTemplate = (templateId: string) => {
    setTemplates(prev => prev.filter(template => template.id !== templateId));
  };

  return {
    templates,
    loading,
    getTemplatesByCategory,
    getTemplatesByScope,
    getPopularTemplates,
    searchTemplates,
    getTemplateById,
    getCategories,
    createTemplate,
    incrementUsage,
    deleteTemplate
  };
}