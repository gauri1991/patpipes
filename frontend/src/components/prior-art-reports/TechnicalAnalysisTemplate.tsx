/**
 * Technical Analysis Template Component
 * Comprehensive technical analysis template for prior art reports
 */

'use client';

import { useState } from 'react';
import {
  Search,
  Database,
  TrendingUp,
  BarChart3,
  Target,
  Layers,
  GitBranch,
  Clock,
  CheckCircle,
  AlertTriangle,
  Info,
  Star,
  Shield,
  Zap,
  Filter,
  Activity,
  Settings,
  FileText,
  Edit3,
  Save,
  RefreshCw
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SearchDatabase {
  name: string;
  coverage: number;
  records_searched: number;
  relevant_results: number;
  search_time: string;
  api_version: string;
  query_syntax: string;
}

interface SearchMetrics {
  total_queries: number;
  total_results: number;
  relevant_results: number;
  precision_rate: number;
  recall_estimate: number;
  search_duration: string;
  coverage_percentage: number;
  false_positive_rate: number;
}

interface TechnicalKeyword {
  term: string;
  frequency: number;
  relevance_score: number;
  semantic_variations: string[];
  classification_codes: string[];
  impact_on_results: number;
}

interface PatentClassification {
  code: string;
  description: string;
  level: 'main' | 'subclass' | 'group' | 'subgroup';
  patent_count: number;
  relevance_score: number;
  related_codes: string[];
}

interface TechnicalScope {
  primary_domains: string[];
  secondary_domains: string[];
  excluded_domains: string[];
  technology_maturity: 'emerging' | 'developing' | 'mature' | 'declining';
  innovation_areas: string[];
  competitive_landscape: string;
}

interface SearchStrategy {
  methodology: 'comprehensive' | 'targeted' | 'iterative' | 'hybrid';
  approach_description: string;
  query_expansion_used: boolean;
  semantic_analysis_enabled: boolean;
  ai_assistance_level: 'none' | 'basic' | 'advanced' | 'full';
  validation_methods: string[];
  quality_checks: string[];
}

interface TechnicalAnalysisData {
  search_overview: {
    strategy: SearchStrategy;
    databases: SearchDatabase[];
    metrics: SearchMetrics;
    timeline: {
      start_date: string;
      end_date: string;
      total_duration: string;
      phases: Array<{
        phase: string;
        duration: string;
        description: string;
      }>;
    };
  };
  technical_scope: TechnicalScope;
  keyword_analysis: {
    primary_keywords: TechnicalKeyword[];
    derived_keywords: TechnicalKeyword[];
    excluded_terms: string[];
    synonym_mapping: Record<string, string[]>;
  };
  classification_analysis: {
    primary_classifications: PatentClassification[];
    related_classifications: PatentClassification[];
    classification_coverage: number;
    cross_classification_patterns: Array<{
      combination: string[];
      frequency: number;
      significance: number;
    }>;
  };
  search_quality: {
    precision_metrics: {
      true_positives: number;
      false_positives: number;
      precision_rate: number;
      confidence_interval: string;
    };
    recall_analysis: {
      estimated_recall: number;
      recall_validation_method: string;
      missed_references_estimate: number;
      coverage_gaps: string[];
    };
    result_distribution: {
      by_relevance: Record<string, number>;
      by_year: Record<string, number>;
      by_database: Record<string, number>;
      by_classification: Record<string, number>;
    };
  };
  methodology_details: {
    search_iterations: Array<{
      iteration: number;
      query_refinement: string;
      results_added: number;
      precision_improvement: number;
      recall_improvement: number;
    }>;
    validation_process: {
      manual_review_percentage: number;
      expert_validation_used: boolean;
      cross_validation_methods: string[];
      quality_assurance_checks: string[];
    };
    limitations: string[];
    assumptions: string[];
    recommendations_for_improvement: string[];
  };
}

interface TechnicalAnalysisTemplateProps {
  projectType: 'FTO' | 'NOVELTY' | 'INVALIDITY';
  searchData?: any;
  onContentUpdate?: (content: TechnicalAnalysisData) => void;
}

export function TechnicalAnalysisTemplate({ 
  projectType, 
  searchData,
  onContentUpdate 
}: TechnicalAnalysisTemplateProps) {
  const [analysisData, setAnalysisData] = useState<TechnicalAnalysisData>(() => 
    generateTechnicalAnalysis(projectType, searchData)
  );

  function generateTechnicalAnalysis(type: string, data?: any): TechnicalAnalysisData {
    const baseData: TechnicalAnalysisData = {
      search_overview: {
        strategy: {
          methodology: 'hybrid',
          approach_description: 'Combined comprehensive database search with targeted semantic analysis and AI-assisted query refinement',
          query_expansion_used: true,
          semantic_analysis_enabled: true,
          ai_assistance_level: 'advanced',
          validation_methods: ['Manual expert review', 'Cross-database validation', 'Citation analysis'],
          quality_checks: ['Relevance scoring', 'Duplicate detection', 'Citation integrity validation']
        },
        databases: [
          {
            name: 'USPTO Patents',
            coverage: 95,
            records_searched: 12500000,
            relevant_results: 18,
            search_time: '45 minutes',
            api_version: 'PatentsView API v1.0',
            query_syntax: 'Boolean + Natural Language'
          },
          {
            name: 'Google Patents',
            coverage: 88,
            records_searched: 45000000,
            relevant_results: 22,
            search_time: '32 minutes',
            api_version: 'Public Search API',
            query_syntax: 'Semantic Search + Keywords'
          },
          {
            name: 'European Patent Office',
            coverage: 82,
            records_searched: 8200000,
            relevant_results: 12,
            search_time: '38 minutes',
            api_version: 'Open Patent Services',
            query_syntax: 'CPC Classification + Keywords'
          },
          {
            name: 'WIPO Global Brand Database',
            coverage: 78,
            records_searched: 3400000,
            relevant_results: 6,
            search_time: '28 minutes',
            api_version: 'WIPO API v2.0',
            query_syntax: 'IPC + Natural Language'
          }
        ],
        metrics: {
          total_queries: 156,
          total_results: 2847,
          relevant_results: 58,
          precision_rate: 0.204,
          recall_estimate: 0.832,
          search_duration: '4 hours 23 minutes',
          coverage_percentage: 85.7,
          false_positive_rate: 0.068
        },
        timeline: {
          start_date: '2024-08-08',
          end_date: '2024-08-10',
          total_duration: '2 days 4 hours',
          phases: [
            {
              phase: 'Initial Search Setup',
              duration: '3 hours',
              description: 'Database configuration, query planning, keyword preparation'
            },
            {
              phase: 'Primary Search Execution',
              duration: '1 day 2 hours',
              description: 'Comprehensive multi-database search with initial filtering'
            },
            {
              phase: 'Result Refinement',
              duration: '8 hours',
              description: 'Relevance analysis, duplicate removal, expert validation'
            },
            {
              phase: 'Quality Assurance',
              duration: '6 hours',
              description: 'Cross-validation, citation analysis, final review'
            }
          ]
        }
      },
      technical_scope: {
        primary_domains: ['Machine Learning', 'Neural Networks', 'Real-time Processing'],
        secondary_domains: ['Computer Vision', 'Signal Processing', 'Optimization Algorithms'],
        excluded_domains: ['Hardware-specific implementations', 'Non-technical business methods'],
        technology_maturity: 'developing',
        innovation_areas: ['Adaptive preprocessing', 'Dynamic architecture optimization', 'Multi-modal processing'],
        competitive_landscape: 'Highly active with major players including Google, Microsoft, NVIDIA, and emerging startups'
      },
      keyword_analysis: {
        primary_keywords: [
          {
            term: 'neural network',
            frequency: 234,
            relevance_score: 0.94,
            semantic_variations: ['artificial neural network', 'deep neural network', 'neural net'],
            classification_codes: ['G06N 3/02', 'G06N 3/08'],
            impact_on_results: 0.85
          },
          {
            term: 'real-time processing',
            frequency: 189,
            relevance_score: 0.88,
            semantic_variations: ['real-time computation', 'live processing', 'streaming processing'],
            classification_codes: ['G06F 9/48', 'G06F 17/16'],
            impact_on_results: 0.76
          },
          {
            term: 'adaptive preprocessing',
            frequency: 67,
            relevance_score: 0.92,
            semantic_variations: ['dynamic preprocessing', 'adaptive filtering', 'intelligent preprocessing'],
            classification_codes: ['G06N 20/00', 'G06F 17/14'],
            impact_on_results: 0.89
          }
        ],
        derived_keywords: [
          {
            term: 'optimization algorithm',
            frequency: 156,
            relevance_score: 0.78,
            semantic_variations: ['optimization method', 'optimization technique', 'optimization process'],
            classification_codes: ['G06N 3/12', 'G06F 17/11'],
            impact_on_results: 0.64
          },
          {
            term: 'architecture adaptation',
            frequency: 43,
            relevance_score: 0.82,
            semantic_variations: ['dynamic architecture', 'adaptive structure', 'flexible architecture'],
            classification_codes: ['G06N 3/04', 'G06N 3/045'],
            impact_on_results: 0.71
          }
        ],
        excluded_terms: ['blockchain', 'cryptocurrency', 'gaming', 'social media'],
        synonym_mapping: {
          'machine learning': ['ML', 'artificial intelligence', 'AI', 'automated learning'],
          'neural network': ['NN', 'artificial neural network', 'ANN', 'deep network'],
          'real-time': ['live', 'streaming', 'concurrent', 'simultaneous']
        }
      },
      classification_analysis: {
        primary_classifications: [
          {
            code: 'G06N 3/02',
            description: 'Neural networks',
            level: 'subgroup',
            patent_count: 1248,
            relevance_score: 0.95,
            related_codes: ['G06N 3/04', 'G06N 3/08', 'G06N 20/00']
          },
          {
            code: 'G06N 3/08',
            description: 'Learning methods',
            level: 'subgroup',
            patent_count: 987,
            relevance_score: 0.89,
            related_codes: ['G06N 3/02', 'G06N 20/00', 'G06F 17/16']
          },
          {
            code: 'G06F 17/16',
            description: 'Digital computing for specific functions',
            level: 'subgroup',
            patent_count: 756,
            relevance_score: 0.76,
            related_codes: ['G06F 9/48', 'G06N 3/02', 'G06F 17/14']
          }
        ],
        related_classifications: [
          {
            code: 'G06N 20/00',
            description: 'Machine learning',
            level: 'group',
            patent_count: 2134,
            relevance_score: 0.82,
            related_codes: ['G06N 3/02', 'G06N 3/08', 'G06F 17/16']
          },
          {
            code: 'G06F 9/48',
            description: 'Program execution scheduling',
            level: 'subgroup',
            patent_count: 445,
            relevance_score: 0.68,
            related_codes: ['G06F 17/16', 'G06N 3/02']
          }
        ],
        classification_coverage: 0.847,
        cross_classification_patterns: [
          {
            combination: ['G06N 3/02', 'G06N 3/08'],
            frequency: 156,
            significance: 0.89
          },
          {
            combination: ['G06N 3/02', 'G06F 17/16'],
            frequency: 98,
            significance: 0.76
          },
          {
            combination: ['G06N 20/00', 'G06N 3/08'],
            frequency: 134,
            significance: 0.82
          }
        ]
      },
      search_quality: {
        precision_metrics: {
          true_positives: 58,
          false_positives: 226,
          precision_rate: 0.204,
          confidence_interval: '0.156 - 0.252 (95% CI)'
        },
        recall_analysis: {
          estimated_recall: 0.832,
          recall_validation_method: 'Cross-database comparison with expert sampling',
          missed_references_estimate: 12,
          coverage_gaps: [
            'Chinese patent databases not fully covered',
            'Very recent publications (last 3 months) may be incomplete',
            'Some industry-specific databases not included'
          ]
        },
        result_distribution: {
          by_relevance: {
            'High (80-100%)': 18,
            'Medium (60-79%)': 23,
            'Low (40-59%)': 17,
            'Minimal (<40%)': 0
          },
          by_year: {
            '2024': 3,
            '2023': 12,
            '2022': 15,
            '2021': 11,
            '2020': 8,
            '2019-2015': 9
          },
          by_database: {
            'USPTO': 18,
            'Google Patents': 22,
            'EPO': 12,
            'WIPO': 6
          },
          by_classification: {
            'G06N 3/02': 24,
            'G06N 3/08': 19,
            'G06F 17/16': 12,
            'Others': 3
          }
        }
      },
      methodology_details: {
        search_iterations: [
          {
            iteration: 1,
            query_refinement: 'Initial broad keyword search',
            results_added: 1247,
            precision_improvement: 0.0,
            recall_improvement: 0.0
          },
          {
            iteration: 2,
            query_refinement: 'Added classification codes and semantic expansion',
            results_added: 834,
            precision_improvement: 0.12,
            recall_improvement: 0.28
          },
          {
            iteration: 3,
            query_refinement: 'Refined with expert domain knowledge',
            results_added: 456,
            precision_improvement: 0.18,
            recall_improvement: 0.34
          },
          {
            iteration: 4,
            query_refinement: 'Final optimization with AI assistance',
            results_added: 310,
            precision_improvement: 0.20,
            recall_improvement: 0.39
          }
        ],
        validation_process: {
          manual_review_percentage: 100,
          expert_validation_used: true,
          cross_validation_methods: [
            'Independent expert review',
            'Cross-database verification',
            'Citation network analysis',
            'Temporal consistency checks'
          ],
          quality_assurance_checks: [
            'Duplicate detection and removal',
            'Relevance scoring consistency',
            'Citation integrity validation',
            'Classification accuracy verification'
          ]
        },
        limitations: [
          'Search limited to English language patents and applications',
          'Some proprietary databases not accessible',
          'Real-time data may have 1-3 month delay in some databases',
          'Semantic analysis accuracy dependent on training data quality'
        ],
        assumptions: [
          'Expert domain knowledge accurately reflects current state of art',
          'Selected databases provide representative coverage of relevant prior art',
          'Classification systems accurately categorize technical innovations',
          'Publication dates reflect actual invention disclosure dates'
        ],
        recommendations_for_improvement: [
          'Include additional Chinese and Japanese patent databases',
          'Expand search to include technical literature and conference papers',
          'Implement continuous monitoring for newly published patents',
          'Enhance semantic analysis with domain-specific models'
        ]
      }
    };

    // Project-specific adjustments
    if (type === 'FTO') {
      baseData.technical_scope.primary_domains.push('Commercial Applications');
      baseData.search_overview.strategy.validation_methods.push('Commercial relevance assessment');
    } else if (type === 'NOVELTY') {
      baseData.technical_scope.primary_domains.push('Academic Research');
      baseData.search_overview.strategy.validation_methods.push('Publication date verification');
    } else if (type === 'INVALIDITY') {
      baseData.technical_scope.primary_domains.push('Legal Precedents');
      baseData.search_overview.strategy.validation_methods.push('Legal relevance scoring');
    }

    return baseData;
  }

  const getRelevanceColor = (score: number) => {
    if (score >= 0.9) return 'text-green-700 bg-green-100';
    if (score >= 0.8) return 'text-green-600 bg-green-50';
    if (score >= 0.7) return 'text-yellow-600 bg-yellow-50';
    if (score >= 0.6) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const getMetricColor = (value: number, threshold: { good: number; fair: number }) => {
    if (value >= threshold.good) return 'text-green-600';
    if (value >= threshold.fair) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Search Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Search className="h-4 w-4" />
            Search Overview & Strategy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h4 className="font-medium mb-3">Search Methodology</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium">Approach</p>
                  <Badge variant="default" className="mt-1">
                    {analysisData.search_overview.strategy.methodology.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium">AI Assistance Level</p>
                  <Badge variant="outline" className="mt-1">
                    {analysisData.search_overview.strategy.ai_assistance_level}
                  </Badge>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm font-medium mb-2">Description</p>
                  <p className="text-sm text-muted-foreground">
                    {analysisData.search_overview.strategy.approach_description}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-medium mb-3">Key Metrics</h4>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {analysisData.search_overview.metrics.total_queries}
                  </div>
                  <p className="text-sm text-muted-foreground">Total Queries</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {analysisData.search_overview.metrics.relevant_results}
                  </div>
                  <p className="text-sm text-muted-foreground">Relevant Results</p>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getMetricColor(analysisData.search_overview.metrics.precision_rate, {good: 0.8, fair: 0.6})}`}>
                    {(analysisData.search_overview.metrics.precision_rate * 100).toFixed(1)}%
                  </div>
                  <p className="text-sm text-muted-foreground">Precision Rate</p>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getMetricColor(analysisData.search_overview.metrics.recall_estimate, {good: 0.8, fair: 0.6})}`}>
                    {(analysisData.search_overview.metrics.recall_estimate * 100).toFixed(1)}%
                  </div>
                  <p className="text-sm text-muted-foreground">Estimated Recall</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Database Coverage */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="h-4 w-4" />
            Database Coverage & Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analysisData.search_overview.databases.map((db, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium">{db.name}</h4>
                    <p className="text-sm text-muted-foreground">{db.api_version}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">{db.relevant_results}</div>
                    <p className="text-sm text-muted-foreground">relevant results</p>
                  </div>
                </div>
                
                <div className="grid gap-3 md:grid-cols-3 mb-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Coverage</p>
                    <div className="flex items-center gap-2">
                      <Progress value={db.coverage} className="h-2 flex-1" />
                      <span className="text-sm font-medium">{db.coverage}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Records Searched</p>
                    <p className="text-sm font-medium">{db.records_searched.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Search Time</p>
                    <p className="text-sm font-medium">{db.search_time}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Query Syntax Used</p>
                  <Badge variant="secondary" className="text-xs">
                    {db.query_syntax}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Technical Scope */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4" />
            Technical Scope & Domain Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h4 className="font-medium mb-3">Primary Technology Domains</h4>
              <div className="space-y-2">
                {analysisData.technical_scope.primary_domains.map((domain, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-blue-600" />
                    <span className="text-sm">{domain}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-3">Secondary Domains</h4>
              <div className="space-y-2">
                {analysisData.technical_scope.secondary_domains.map((domain, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-gray-600" />
                    <span className="text-sm">{domain}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-3">Innovation Areas</h4>
              <div className="flex flex-wrap gap-2">
                {analysisData.technical_scope.innovation_areas.map((area, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {area}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-3">Technology Maturity</h4>
              <Badge className="bg-orange-100 text-orange-800">
                {analysisData.technical_scope.technology_maturity.toUpperCase()}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Keyword Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Search className="h-4 w-4" />
            Keyword Analysis & Search Terms
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="primary" className="w-full">
            <TabsList>
              <TabsTrigger value="primary">Primary Keywords</TabsTrigger>
              <TabsTrigger value="derived">Derived Keywords</TabsTrigger>
              <TabsTrigger value="synonyms">Synonym Mapping</TabsTrigger>
            </TabsList>
            
            <TabsContent value="primary" className="space-y-4">
              {analysisData.keyword_analysis.primary_keywords.map((keyword, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium">{keyword.term}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={getRelevanceColor(keyword.relevance_score)}>
                          {(keyword.relevance_score * 100).toFixed(0)}% relevance
                        </Badge>
                        <Badge variant="outline">
                          {keyword.frequency} occurrences
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Impact</p>
                      <div className="font-bold">{(keyword.impact_on_results * 100).toFixed(0)}%</div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Semantic Variations</p>
                      <div className="flex flex-wrap gap-1">
                        {keyword.semantic_variations.map((variation, vIndex) => (
                          <Badge key={vIndex} variant="secondary" className="text-xs">
                            {variation}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Related Classifications</p>
                      <div className="flex flex-wrap gap-1">
                        {keyword.classification_codes.map((code, cIndex) => (
                          <Badge key={cIndex} variant="outline" className="text-xs">
                            {code}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </TabsContent>
            
            <TabsContent value="derived" className="space-y-4">
              {analysisData.keyword_analysis.derived_keywords.map((keyword, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium">{keyword.term}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={getRelevanceColor(keyword.relevance_score)}>
                          {(keyword.relevance_score * 100).toFixed(0)}% relevance
                        </Badge>
                        <Badge variant="outline">
                          {keyword.frequency} occurrences
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </TabsContent>
            
            <TabsContent value="synonyms" className="space-y-4">
              {Object.entries(analysisData.keyword_analysis.synonym_mapping).map(([term, synonyms], index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">{term}</h4>
                  <div className="flex flex-wrap gap-2">
                    {synonyms.map((synonym, sIndex) => (
                      <Badge key={sIndex} variant="secondary">
                        {synonym}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Classification Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <GitBranch className="h-4 w-4" />
            Patent Classification Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h4 className="font-medium mb-3">Primary Classifications</h4>
              <div className="space-y-3">
                {analysisData.classification_analysis.primary_classifications.map((classification, index) => (
                  <div key={index} className="p-3 border rounded">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="font-medium">{classification.code}</span>
                        <Badge variant="outline" className="ml-2 text-xs">
                          {classification.level}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{classification.patent_count.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">patents</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{classification.description}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Relevance:</span>
                      <Progress value={classification.relevance_score * 100} className="h-2 flex-1" />
                      <span className="text-xs font-medium">{(classification.relevance_score * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-medium mb-3">Cross-Classification Patterns</h4>
              <div className="space-y-3">
                {analysisData.classification_analysis.cross_classification_patterns.map((pattern, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex flex-wrap gap-1">
                        {pattern.combination.map((code, cIndex) => (
                          <Badge key={cIndex} variant="secondary" className="text-xs">
                            {code}
                          </Badge>
                        ))}
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{pattern.frequency}</div>
                        <p className="text-xs text-muted-foreground">combinations</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Significance:</span>
                      <Progress value={pattern.significance * 100} className="h-2 flex-1" />
                      <span className="text-xs font-medium">{(pattern.significance * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search Quality Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Search Quality & Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h4 className="font-medium mb-3">Precision Analysis</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">True Positives</span>
                  <span className="font-medium">{analysisData.search_quality.precision_metrics.true_positives}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">False Positives</span>
                  <span className="font-medium">{analysisData.search_quality.precision_metrics.false_positives}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Precision Rate</span>
                  <span className="font-medium">{(analysisData.search_quality.precision_metrics.precision_rate * 100).toFixed(1)}%</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Confidence Interval: {analysisData.search_quality.precision_metrics.confidence_interval}
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Recall Analysis</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Estimated Recall</span>
                  <span className="font-medium">{(analysisData.search_quality.recall_analysis.estimated_recall * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Missed References (Est.)</span>
                  <span className="font-medium">{analysisData.search_quality.recall_analysis.missed_references_estimate}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Method: {analysisData.search_quality.recall_analysis.recall_validation_method}
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          <div>
            <h4 className="font-medium mb-3">Result Distribution</h4>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium mb-2">By Relevance Level</p>
                <div className="space-y-2">
                  {Object.entries(analysisData.search_quality.result_distribution.by_relevance).map(([level, count]) => (
                    <div key={level} className="flex justify-between text-sm">
                      <span>{level}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium mb-2">By Database</p>
                <div className="space-y-2">
                  {Object.entries(analysisData.search_quality.result_distribution.by_database).map(([db, count]) => (
                    <div key={db} className="flex justify-between text-sm">
                      <span>{db}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Methodology Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Methodology Details & Validation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h4 className="font-medium mb-3">Search Iterations</h4>
              <div className="space-y-3">
                {analysisData.methodology_details.search_iterations.map((iteration, index) => (
                  <div key={index} className="p-3 border rounded">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium">Iteration {iteration.iteration}</h5>
                      <span className="text-sm font-medium">+{iteration.results_added} results</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{iteration.query_refinement}</p>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-muted-foreground">Precision: </span>
                        <span className="font-medium">+{(iteration.precision_improvement * 100).toFixed(1)}%</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Recall: </span>
                        <span className="font-medium">+{(iteration.recall_improvement * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h4 className="font-medium mb-3">Limitations</h4>
                <ul className="space-y-2">
                  {analysisData.methodology_details.limitations.map((limitation, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <span>{limitation}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-3">Recommendations for Improvement</h4>
                <ul className="space-y-2">
                  {analysisData.methodology_details.recommendations_for_improvement.map((rec, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}