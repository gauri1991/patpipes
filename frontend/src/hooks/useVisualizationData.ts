/**
 * useVisualizationData Hook
 * Comprehensive data management for visualization creation
 */

import { useState, useEffect, useCallback } from 'react';
import { useAnalyticsDatasets } from '@/hooks/useAnalyticsData';
import { PatentDataset } from '@/services/analyticsApi';

interface DatasetInfo {
  id: string;
  name: string;
  description: string;
  total_patents: number;
  data_source: string;
  created_at: string;
  status: string;
  fields: DatasetField[];
  qualityScore: number;
  dataRange: {
    startDate?: string;
    endDate?: string;
  };
  categories: string[];
  geographic_coverage: string[];
  technology_areas: string[];
}

interface DatasetField {
  name: string;
  type: 'text' | 'number' | 'date' | 'category';
  completeness: number;
  uniqueValues?: number;
  sampleValues?: string[];
  suggestedMapping?: 'x_axis' | 'y_axis' | 'color' | 'size' | 'filter';
}

interface ChartRecommendation {
  templateId: string;
  confidence: number;
  reason: string;
  suggestedConfig: any;
  advantages: string[];
  limitations: string[];
}

interface AnalyticsCapability {
  type: 'statistical' | 'predictive' | 'comparative';
  name: string;
  description: string;
  requirements: string[];
  supported: boolean;
}

export function useVisualizationData(projectId: string) {
  const { datasets: rawDatasets, loading: datasetsLoading } = useAnalyticsDatasets(projectId);
  
  const [enhancedDatasets, setEnhancedDatasets] = useState<DatasetInfo[]>([]);
  const [selectedDatasets, setSelectedDatasets] = useState<string[]>([]);
  const [fieldMappings, setFieldMappings] = useState<Record<string, DatasetField>>({});
  const [chartRecommendations, setChartRecommendations] = useState<ChartRecommendation[]>([]);
  const [analyticsCapabilities, setAnalyticsCapabilities] = useState<AnalyticsCapability[]>([]);
  const [loading, setLoading] = useState(false);

  // Enhanced dataset analysis
  const analyzeDataset = useCallback(async (dataset: PatentDataset): Promise<DatasetInfo> => {
    // Mock enhanced dataset analysis - replace with actual API call
    const mockFields: DatasetField[] = [
      {
        name: 'filing_date',
        type: 'date',
        completeness: 0.95,
        suggestedMapping: 'x_axis',
        sampleValues: ['2024-01-15', '2024-02-03', '2024-01-28']
      },
      {
        name: 'patent_count',
        type: 'number',
        completeness: 1.0,
        uniqueValues: 847,
        suggestedMapping: 'y_axis'
      },
      {
        name: 'assignee',
        type: 'category',
        completeness: 0.87,
        uniqueValues: 156,
        suggestedMapping: 'color',
        sampleValues: ['Apple Inc.', 'Google LLC', 'Microsoft Corp.']
      },
      {
        name: 'technology_area',
        type: 'category',
        completeness: 0.92,
        uniqueValues: 23,
        suggestedMapping: 'filter',
        sampleValues: ['AI/ML', 'IoT', 'Blockchain', 'Quantum Computing']
      },
      {
        name: 'geographic_region',
        type: 'category',
        completeness: 0.89,
        uniqueValues: 45,
        suggestedMapping: 'filter',
        sampleValues: ['US', 'EP', 'JP', 'CN', 'KR']
      }
    ];

    const mockTechAreas = ['Artificial Intelligence', 'Machine Learning', 'Internet of Things', 'Blockchain', 'Quantum Computing'];
    const mockGeoCoverage = ['United States', 'Europe', 'Asia-Pacific', 'Americas', 'Middle East & Africa'];

    return {
      id: dataset.id,
      name: dataset.name,
      description: dataset.description,
      total_patents: dataset.total_patents,
      data_source: dataset.data_source,
      created_at: dataset.created_at,
      status: dataset.processing_status,
      fields: mockFields,
      qualityScore: Math.round((mockFields.reduce((sum, f) => sum + f.completeness, 0) / mockFields.length) * 100),
      dataRange: {
        startDate: '2020-01-01',
        endDate: '2024-12-31'
      },
      categories: mockTechAreas,
      geographic_coverage: mockGeoCoverage,
      technology_areas: mockTechAreas
    };
  }, []);

  // Generate chart recommendations based on selected datasets
  const generateRecommendations = useCallback(async (datasetIds: string[]): Promise<ChartRecommendation[]> => {
    if (datasetIds.length === 0) return [];

    const selectedDatasetInfos = enhancedDatasets.filter(d => datasetIds.includes(d.id));
    
    // Mock AI-powered recommendations
    const recommendations: ChartRecommendation[] = [
      {
        templateId: 'patent_timeline',
        confidence: 0.92,
        reason: 'High-quality date fields with excellent completeness (95%)',
        suggestedConfig: {
          xAxis: 'filing_date',
          yAxis: 'patent_count',
          groupBy: 'technology_area',
          dateGranularity: 'monthly'
        },
        advantages: [
          'Perfect for showing filing trends over time',
          'Can overlay multiple technology areas',
          'Excellent data quality ensures accurate trends'
        ],
        limitations: [
          'May require aggregation for large datasets',
          'Time-based analysis only'
        ]
      },
      {
        templateId: 'technology_landscape',
        confidence: 0.88,
        reason: 'Rich technology categorization with geographic diversity',
        suggestedConfig: {
          xAxis: 'innovation_score',
          yAxis: 'market_maturity',
          sizeBy: 'patent_count',
          colorBy: 'growth_rate',
          categories: 'technology_area'
        },
        advantages: [
          'Reveals innovation opportunities',
          'Multi-dimensional analysis capability',
          'Interactive exploration of tech domains'
        ],
        limitations: [
          'Requires calculated fields for positioning',
          'Best with 10-50 technology categories'
        ]
      },
      {
        templateId: 'geographic_distribution',
        confidence: 0.85,
        reason: 'Strong geographic coverage across 45+ regions',
        suggestedConfig: {
          regions: 'geographic_region',
          valueBy: 'patent_count',
          colorBy: 'filing_density',
          drillDown: 'technology_area'
        },
        advantages: [
          'Global market insights',
          'Identifies expansion opportunities',
          'Regulatory landscape analysis'
        ],
        limitations: [
          'Requires geographic normalization',
          'May need population-based adjustments'
        ]
      }
    ];

    return recommendations;
  }, [enhancedDatasets]);

  // Analyze analytics capabilities based on data
  const analyzeCapabilities = useCallback(async (datasetIds: string[]): Promise<AnalyticsCapability[]> => {
    const selectedDatasetInfos = enhancedDatasets.filter(d => datasetIds.includes(d.id));
    
    const capabilities: AnalyticsCapability[] = [
      {
        type: 'statistical',
        name: 'Trend Analysis',
        description: 'Identify growth patterns and cyclical trends',
        requirements: ['Date fields', 'Numeric values'],
        supported: selectedDatasetInfos.some(d => 
          d.fields.some(f => f.type === 'date') && 
          d.fields.some(f => f.type === 'number')
        )
      },
      {
        type: 'statistical',
        name: 'Correlation Analysis',
        description: 'Find relationships between different metrics',
        requirements: ['Multiple numeric fields'],
        supported: selectedDatasetInfos.some(d => 
          d.fields.filter(f => f.type === 'number').length >= 2
        )
      },
      {
        type: 'predictive',
        name: 'Forecasting',
        description: 'Project future trends based on historical data',
        requirements: ['Time series data', '2+ years of history'],
        supported: selectedDatasetInfos.some(d => {
          const hasDateField = d.fields.some(f => f.type === 'date');
          const hasHistoricalData = d.dataRange.startDate && 
            new Date(d.dataRange.endDate || '').getFullYear() - 
            new Date(d.dataRange.startDate).getFullYear() >= 2;
          return hasDateField && hasHistoricalData;
        })
      },
      {
        type: 'comparative',
        name: 'Competitive Benchmarking',
        description: 'Compare against industry standards and competitors',
        requirements: ['Company/assignee data', 'Industry classifications'],
        supported: selectedDatasetInfos.some(d => 
          d.fields.some(f => f.name.includes('assignee') || f.name.includes('company'))
        )
      },
      {
        type: 'statistical',
        name: 'Clustering Analysis',
        description: 'Group similar patents or technologies',
        requirements: ['Multiple categorical fields', '100+ records'],
        supported: selectedDatasetInfos.some(d => 
          d.fields.filter(f => f.type === 'category').length >= 2 && 
          d.total_patents >= 100
        )
      },
      {
        type: 'comparative',
        name: 'White Space Detection',
        description: 'Identify under-explored innovation areas',
        requirements: ['Technology classifications', 'Patent density data'],
        supported: selectedDatasetInfos.some(d => 
          d.technology_areas.length > 0 && d.total_patents >= 200
        )
      }
    ];

    return capabilities;
  }, [enhancedDatasets]);

  // Load and enhance datasets
  useEffect(() => {
    const processDatasets = async () => {
      if (!rawDatasets || rawDatasets.length === 0) return;
      
      setLoading(true);
      try {
        const enhanced = await Promise.all(
          rawDatasets.map(dataset => analyzeDataset(dataset))
        );
        setEnhancedDatasets(enhanced);
      } catch (error) {
        console.error('Failed to analyze datasets:', error);
      } finally {
        setLoading(false);
      }
    };

    processDatasets();
  }, [rawDatasets, analyzeDataset]);

  // Update recommendations when dataset selection changes
  useEffect(() => {
    const updateRecommendations = async () => {
      if (selectedDatasets.length > 0) {
        const recommendations = await generateRecommendations(selectedDatasets);
        setChartRecommendations(recommendations);
        
        const capabilities = await analyzeCapabilities(selectedDatasets);
        setAnalyticsCapabilities(capabilities);
      } else {
        setChartRecommendations([]);
        setAnalyticsCapabilities([]);
      }
    };

    updateRecommendations();
  }, [selectedDatasets, generateRecommendations, analyzeCapabilities]);

  const addDataset = useCallback((datasetId: string) => {
    setSelectedDatasets(prev => 
      prev.includes(datasetId) ? prev : [...prev, datasetId]
    );
  }, []);

  const removeDataset = useCallback((datasetId: string) => {
    setSelectedDatasets(prev => prev.filter(id => id !== datasetId));
  }, []);

  const updateFieldMapping = useCallback((fieldName: string, mapping: DatasetField) => {
    setFieldMappings(prev => ({
      ...prev,
      [fieldName]: mapping
    }));
  }, []);

  const getCompatibleFields = useCallback((mappingType: 'x_axis' | 'y_axis' | 'color' | 'size' | 'filter') => {
    const allFields = enhancedDatasets
      .filter(d => selectedDatasets.includes(d.id))
      .flatMap(d => d.fields);
      
    return allFields.filter(field => {
      switch (mappingType) {
        case 'x_axis':
          return field.type === 'date' || field.type === 'category';
        case 'y_axis':
          return field.type === 'number';
        case 'color':
        case 'filter':
          return field.type === 'category';
        case 'size':
          return field.type === 'number';
        default:
          return false;
      }
    });
  }, [enhancedDatasets, selectedDatasets]);

  return {
    // Data
    datasets: enhancedDatasets,
    selectedDatasets,
    fieldMappings,
    chartRecommendations,
    analyticsCapabilities,
    loading: loading || datasetsLoading,
    
    // Actions
    addDataset,
    removeDataset,
    updateFieldMapping,
    getCompatibleFields,
    
    // Utils
    getSelectedDatasetInfo: () => enhancedDatasets.filter(d => selectedDatasets.includes(d.id)),
    getTotalRecords: () => enhancedDatasets
      .filter(d => selectedDatasets.includes(d.id))
      .reduce((sum, d) => sum + d.total_patents, 0),
    getDateRange: () => {
      const selected = enhancedDatasets.filter(d => selectedDatasets.includes(d.id));
      if (selected.length === 0) return null;
      
      const startDates = selected.map(d => d.dataRange.startDate).filter(Boolean);
      const endDates = selected.map(d => d.dataRange.endDate).filter(Boolean);
      
      return {
        start: startDates.length > 0 ? Math.min(...startDates.map(d => new Date(d!).getTime())) : null,
        end: endDates.length > 0 ? Math.max(...endDates.map(d => new Date(d!).getTime())) : null
      };
    }
  };
}