'use client';

import { useState, useEffect } from 'react';
import { Shield, TrendingUp, AlertCircle, CheckCircle, Target, Users, Calendar, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PortfolioPatent {
  id: string;
  patent_number: string;
  title: string;
  status: 'active' | 'pending' | 'expired' | 'abandoned';
  filing_date: string;
  expiry_date: string;
  inventors: string[];
  technology_area: string;
  strategic_value: number;
  market_coverage: string[];
}

interface SearchPatentComparison {
  search_patent_id: string;
  portfolio_patent_id: string;
  similarity_score: number;
  relationship_type: 'complementary' | 'overlapping' | 'competitive' | 'supporting';
  strategic_implications: string[];
  recommendation: {
    action: 'acquire' | 'monitor' | 'challenge' | 'license' | 'ignore';
    priority: 'high' | 'medium' | 'low';
    reasoning: string;
  };
}

interface PortfolioGap {
  technology_area: string;
  gap_type: 'coverage' | 'quality' | 'timing' | 'geography';
  severity: 'critical' | 'moderate' | 'minor';
  search_patents_addressing: string[];
  recommendation: string;
}

interface PortfolioIntegrationProps {
  searchPatents: any[];
  projectId: string;
  sessionId?: string;
  onPortfolioAction?: (action: string, patentId: string) => void;
}

export function PortfolioIntegration({ 
  searchPatents, 
  projectId, 
  sessionId,
  onPortfolioAction
}: PortfolioIntegrationProps) {
  const [portfolioPatents, setPortfolioPatents] = useState<PortfolioPatent[]>([]);
  const [comparisons, setComparisons] = useState<SearchPatentComparison[]>([]);
  const [portfolioGaps, setPortfolioGaps] = useState<PortfolioGap[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'comparisons' | 'gaps' | 'recommendations'>('overview');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    loadPortfolioData();
    if (searchPatents.length > 0) {
      analyzePortfolioIntegration();
    }
  }, [searchPatents, projectId]);

  const loadPortfolioData = () => {
    // Mock portfolio data
    const mockPortfolio: PortfolioPatent[] = [
      {
        id: 'p1',
        patent_number: 'US10987654',
        title: 'Advanced Machine Learning System Architecture',
        status: 'active',
        filing_date: '2019-03-15',
        expiry_date: '2039-03-15',
        inventors: ['John Smith', 'Jane Doe'],
        technology_area: 'Artificial Intelligence',
        strategic_value: 92,
        market_coverage: ['US', 'EU', 'JP']
      },
      {
        id: 'p2',
        patent_number: 'US10876543',
        title: 'Data Processing Optimization Method',
        status: 'active',
        filing_date: '2020-07-22',
        expiry_date: '2040-07-22',
        inventors: ['Alice Johnson', 'Bob Wilson'],
        technology_area: 'Data Processing',
        strategic_value: 78,
        market_coverage: ['US', 'CA']
      },
      {
        id: 'p3',
        patent_number: 'US10765432',
        title: 'Neural Network Training Algorithm',
        status: 'pending',
        filing_date: '2022-11-10',
        expiry_date: '2042-11-10',
        inventors: ['Carol Brown'],
        technology_area: 'Machine Learning',
        strategic_value: 85,
        market_coverage: ['US', 'EU', 'CN']
      }
    ];
    setPortfolioPatents(mockPortfolio);
  };

  const analyzePortfolioIntegration = async () => {
    setIsAnalyzing(true);
    
    // Simulate analysis
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate comparisons
    const mockComparisons: SearchPatentComparison[] = searchPatents.slice(0, 3).map((searchPatent, index) => ({
      search_patent_id: searchPatent.id,
      portfolio_patent_id: portfolioPatents[index]?.id || 'p1',
      similarity_score: Math.random() * 40 + 40, // 40-80
      relationship_type: ['complementary', 'overlapping', 'competitive', 'supporting'][Math.floor(Math.random() * 4)] as any,
      strategic_implications: [
        'Strengthens existing patent protection',
        'Fills identified technology gap',
        'Provides competitive advantage'
      ].slice(0, Math.floor(Math.random() * 2) + 1),
      recommendation: {
        action: ['acquire', 'monitor', 'challenge', 'license'][Math.floor(Math.random() * 4)] as any,
        priority: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)] as any,
        reasoning: 'Strategic value assessment based on portfolio analysis'
      }
    }));
    setComparisons(mockComparisons);

    // Generate portfolio gaps
    const mockGaps: PortfolioGap[] = [
      {
        technology_area: 'Real-time Processing',
        gap_type: 'coverage',
        severity: 'critical',
        search_patents_addressing: searchPatents.slice(0, 2).map(p => p.id),
        recommendation: 'Consider acquiring patents in this area to strengthen portfolio coverage'
      },
      {
        technology_area: 'Mobile Applications',
        gap_type: 'geography',
        severity: 'moderate',
        search_patents_addressing: searchPatents.slice(1, 3).map(p => p.id),
        recommendation: 'Evaluate geographic expansion opportunities'
      }
    ];
    setPortfolioGaps(mockGaps);
    
    setIsAnalyzing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'expired': return 'bg-red-100 text-red-700';
      case 'abandoned': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getRelationshipColor = (type: string) => {
    switch (type) {
      case 'complementary': return 'bg-blue-100 text-blue-700';
      case 'overlapping': return 'bg-yellow-100 text-yellow-700';
      case 'competitive': return 'bg-red-100 text-red-700';
      case 'supporting': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'acquire': return 'bg-green-100 text-green-700';
      case 'monitor': return 'bg-blue-100 text-blue-700';
      case 'challenge': return 'bg-red-100 text-red-700';
      case 'license': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getGapSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-700';
      case 'moderate': return 'bg-yellow-100 text-yellow-700';
      case 'minor': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">Portfolio Integration</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary">{portfolioPatents.length} portfolio patents</Badge>
                  <Badge variant="outline">{searchPatents.length} search results</Badge>
                  <Badge variant="outline">{comparisons.length} comparisons</Badge>
                </div>
              </div>
            </div>
            {isAnalyzing && (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm text-muted-foreground">Analyzing...</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="comparisons">Comparisons</TabsTrigger>
              <TabsTrigger value="gaps">Portfolio Gaps</TabsTrigger>
              <TabsTrigger value="recommendations">Actions</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4">
              <div className="grid md:grid-cols-2 gap-4">
                {/* Portfolio Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Current Portfolio
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Active Patents</span>
                        <Badge variant="secondary">
                          {portfolioPatents.filter(p => p.status === 'active').length}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Pending Applications</span>
                        <Badge variant="outline">
                          {portfolioPatents.filter(p => p.status === 'pending').length}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Avg Strategic Value</span>
                        <span className="text-sm font-medium">
                          {Math.round(portfolioPatents.reduce((sum, p) => sum + p.strategic_value, 0) / portfolioPatents.length)}%
                        </span>
                      </div>
                      <div className="pt-2 border-t">
                        <span className="text-sm font-medium">Technology Areas:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {[...new Set(portfolioPatents.map(p => p.technology_area))].map(area => (
                            <Badge key={area} variant="outline" className="text-xs">
                              {area}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Integration Insights */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Integration Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Portfolio Strength</span>
                          <span>78%</span>
                        </div>
                        <Progress value={78} className="h-1" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Coverage Completeness</span>
                          <span>65%</span>
                        </div>
                        <Progress value={65} className="h-1" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Competitive Position</span>
                          <span>82%</span>
                        </div>
                        <Progress value={82} className="h-1" />
                      </div>
                      <div className="pt-2 border-t">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">High Priority Actions</span>
                          <Badge variant="secondary">
                            {comparisons.filter(c => c.recommendation.priority === 'high').length}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="comparisons" className="mt-4">
              {comparisons.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-4" />
                  <p>No patent comparisons available</p>
                  <p className="text-sm">Search for patents to see portfolio integration analysis</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {comparisons.map((comparison, index) => {
                    const searchPatent = searchPatents.find(p => p.id === comparison.search_patent_id);
                    const portfolioPatent = portfolioPatents.find(p => p.id === comparison.portfolio_patent_id);
                    
                    return (
                      <Card key={index} className="hover:shadow-sm transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge className={getRelationshipColor(comparison.relationship_type)}>
                                  {comparison.relationship_type}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  {comparison.similarity_score.toFixed(1)}% similarity
                                </span>
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm font-medium">
                                  Search: {searchPatent?.patent_number} - {searchPatent?.title}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Portfolio: {portfolioPatent?.patent_number} - {portfolioPatent?.title}
                                </p>
                              </div>
                            </div>
                            <Badge className={getActionColor(comparison.recommendation.action)}>
                              {comparison.recommendation.action}
                            </Badge>
                          </div>
                          
                          <div className="text-xs text-muted-foreground">
                            <p className="mb-2">{comparison.recommendation.reasoning}</p>
                            <div>
                              <span className="font-medium">Strategic implications:</span>
                              <ul className="list-disc list-inside mt-1 space-y-1">
                                {comparison.strategic_implications.map((implication, idx) => (
                                  <li key={idx}>{implication}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 pt-3 border-t mt-3">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => onPortfolioAction?.(comparison.recommendation.action, searchPatent?.id)}
                            >
                              {comparison.recommendation.action}
                            </Button>
                            <Badge variant="outline" className={`text-xs ${
                              comparison.recommendation.priority === 'high' ? 'border-red-300 text-red-700' :
                              comparison.recommendation.priority === 'medium' ? 'border-yellow-300 text-yellow-700' :
                              'border-green-300 text-green-700'
                            }`}>
                              {comparison.recommendation.priority} priority
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="gaps" className="mt-4">
              {portfolioGaps.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4" />
                  <p>No portfolio gaps identified</p>
                  <p className="text-sm">Complete analysis will show potential coverage gaps</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {portfolioGaps.map((gap, index) => (
                    <Card key={index} className="hover:shadow-sm transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-sm font-medium">{gap.technology_area}</h3>
                              <Badge className={getGapSeverityColor(gap.severity)}>
                                {gap.severity}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mb-2">
                              Gap type: {gap.gap_type}
                            </p>
                          </div>
                        </div>
                        
                        <p className="text-sm mb-3">{gap.recommendation}</p>
                        
                        <div className="text-xs">
                          <span className="font-medium">Relevant search patents:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {gap.search_patents_addressing.map(patentId => {
                              const patent = searchPatents.find(p => p.id === patentId);
                              return patent ? (
                                <Badge key={patentId} variant="outline" className="text-xs">
                                  {patent.patent_number}
                                </Badge>
                              ) : null;
                            })}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="recommendations" className="mt-4">
              <div className="space-y-4">
                {['acquire', 'monitor', 'license', 'challenge'].map(action => {
                  const actionComparisons = comparisons.filter(c => c.recommendation.action === action);
                  if (actionComparisons.length === 0) return null;
                  
                  return (
                    <Card key={action}>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Badge className={getActionColor(action)}>
                            {actionComparisons.length}
                          </Badge>
                          {action.charAt(0).toUpperCase() + action.slice(1)} Actions
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-2">
                          {actionComparisons.map((comparison, index) => {
                            const searchPatent = searchPatents.find(p => p.id === comparison.search_patent_id);
                            return (
                              <div key={index} className="flex items-center justify-between p-2 border rounded">
                                <div className="flex-1">
                                  <p className="text-sm font-medium">{searchPatent?.patent_number}</p>
                                  <p className="text-xs text-muted-foreground line-clamp-1">
                                    {searchPatent?.title}
                                  </p>
                                </div>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => onPortfolioAction?.(action, searchPatent?.id)}
                                >
                                  {action}
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}