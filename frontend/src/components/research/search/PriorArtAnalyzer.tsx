'use client';

import { useState, useEffect } from 'react';
import { FileSearch, Brain, AlertTriangle, CheckCircle, Clock, TrendingUp, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PriorArtAnalysis {
  id: string;
  patent: {
    id: string;
    patent_number: string;
    title: string;
    assignee: string;
    publication_date: string;
  };
  analysis: {
    novelty_score: number;
    anticipation_risk: 'low' | 'medium' | 'high';
    blocking_patents: Array<{
      patent_number: string;
      title: string;
      similarity_score: number;
      blocking_claims: string[];
    }>;
    freedom_to_operate: {
      risk_level: 'low' | 'medium' | 'high';
      expired_patents: number;
      active_patents: number;
      licensing_required: boolean;
    };
    technical_differences: string[];
    commercial_impact: {
      market_potential: number;
      competitive_advantage: number;
      licensing_value: number;
    };
  };
  recommendations: Array<{
    type: 'design_around' | 'licensing' | 'invalidation' | 'continuation';
    priority: 'low' | 'medium' | 'high';
    description: string;
    estimated_cost: string;
    timeline: string;
  }>;
  status: 'pending' | 'analyzing' | 'completed' | 'requires_review';
  created_at: string;
  updated_at: string;
}

interface PriorArtAnalyzerProps {
  patents: any[];
  projectId: string;
  sessionId?: string;
  onAnalysisComplete?: (analysis: PriorArtAnalysis) => void;
}

export function PriorArtAnalyzer({ 
  patents, 
  projectId, 
  sessionId,
  onAnalysisComplete
}: PriorArtAnalyzerProps) {
  const [analyses, setAnalyses] = useState<PriorArtAnalysis[]>([]);
  const [selectedPatent, setSelectedPatent] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<'queue' | 'results' | 'summary'>('queue');

  useEffect(() => {
    // Load existing analyses
    loadExistingAnalyses();
  }, [projectId, sessionId]);

  const loadExistingAnalyses = () => {
    // Mock existing analyses
    const mockAnalyses: PriorArtAnalysis[] = [
      {
        id: '1',
        patent: {
          id: 'p1',
          patent_number: 'US10123456',
          title: 'Machine Learning Classification System',
          assignee: 'Tech Innovations Inc',
          publication_date: '2020-03-15'
        },
        analysis: {
          novelty_score: 73.5,
          anticipation_risk: 'medium',
          blocking_patents: [
            {
              patent_number: 'US9876543',
              title: 'Automated Classification Method',
              similarity_score: 68.2,
              blocking_claims: ['Claims 1-3: Basic classification algorithm', 'Claim 7: Neural network architecture']
            }
          ],
          freedom_to_operate: {
            risk_level: 'medium',
            expired_patents: 12,
            active_patents: 8,
            licensing_required: true
          },
          technical_differences: [
            'Novel training methodology not disclosed in prior art',
            'Improved accuracy metrics over existing solutions',
            'Real-time processing capabilities unique to invention'
          ],
          commercial_impact: {
            market_potential: 78,
            competitive_advantage: 65,
            licensing_value: 82
          }
        },
        recommendations: [
          {
            type: 'design_around',
            priority: 'medium',
            description: 'Modify core algorithm to avoid blocking patent claims 1-3',
            estimated_cost: '$15,000 - $25,000',
            timeline: '2-3 months'
          },
          {
            type: 'licensing',
            priority: 'high',
            description: 'Negotiate licensing terms with blocking patent holder',
            estimated_cost: '$50,000 - $100,000',
            timeline: '1-2 months'
          }
        ],
        status: 'completed',
        created_at: '2024-12-01T10:00:00Z',
        updated_at: '2024-12-01T14:30:00Z'
      }
    ];
    setAnalyses(mockAnalyses);
  };

  const startPriorArtAnalysis = async (patent: any) => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setSelectedPatent(patent);

    try {
      // Simulate analysis process
      const steps = [
        'Searching patent databases...',
        'Analyzing technical similarities...',
        'Evaluating claim overlap...',
        'Assessing freedom to operate...',
        'Generating recommendations...'
      ];

      for (let i = 0; i < steps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        setAnalysisProgress(((i + 1) / steps.length) * 100);
      }

      // Create new analysis result
      const newAnalysis: PriorArtAnalysis = {
        id: Date.now().toString(),
        patent: {
          id: patent.id,
          patent_number: patent.patent_number,
          title: patent.title,
          assignee: patent.assignee,
          publication_date: patent.publication_date
        },
        analysis: {
          novelty_score: Math.random() * 40 + 60, // 60-100
          anticipation_risk: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as any,
          blocking_patents: generateBlockingPatents(),
          freedom_to_operate: {
            risk_level: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as any,
            expired_patents: Math.floor(Math.random() * 20) + 5,
            active_patents: Math.floor(Math.random() * 15) + 3,
            licensing_required: Math.random() > 0.5
          },
          technical_differences: [
            'Novel approach to data processing not found in prior art',
            'Unique implementation of core algorithm',
            'Improved efficiency metrics over existing solutions'
          ],
          commercial_impact: {
            market_potential: Math.random() * 30 + 70,
            competitive_advantage: Math.random() * 40 + 50,
            licensing_value: Math.random() * 50 + 50
          }
        },
        recommendations: generateRecommendations(),
        status: 'completed',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setAnalyses(prev => [newAnalysis, ...prev]);
      onAnalysisComplete?.(newAnalysis);
      setActiveTab('results');
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgress(0);
      setSelectedPatent(null);
    }
  };

  const generateBlockingPatents = () => {
    const mockBlockingPatents = [
      {
        patent_number: `US${Math.floor(Math.random() * 1000000) + 9000000}`,
        title: 'Related Technology Implementation',
        similarity_score: Math.random() * 30 + 60,
        blocking_claims: ['Claims 1-2: Core methodology', 'Claim 5: System architecture']
      }
    ];
    return mockBlockingPatents.slice(0, Math.floor(Math.random() * 3) + 1);
  };

  const generateRecommendations = () => {
    const recommendations = [
      {
        type: 'design_around' as const,
        priority: 'medium' as const,
        description: 'Modify approach to avoid potential conflicts',
        estimated_cost: '$10,000 - $20,000',
        timeline: '1-2 months'
      },
      {
        type: 'licensing' as const,
        priority: 'high' as const,
        description: 'Consider licensing existing technology',
        estimated_cost: '$25,000 - $50,000',
        timeline: '2-4 weeks'
      }
    ];
    return recommendations.slice(0, Math.floor(Math.random() * 2) + 1);
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-100 text-green-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'high': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'analyzing': return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'requires_review': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-red-500 to-orange-600 rounded-lg">
                <FileSearch className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">Prior Art Analysis</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary">{analyses.length} analyses</Badge>
                  <Badge variant="outline">{patents.length} patents available</Badge>
                </div>
              </div>
            </div>
            <Button 
              onClick={() => patents.length > 0 && startPriorArtAnalysis(patents[0])}
              disabled={isAnalyzing || patents.length === 0}
            >
              <Brain className="h-4 w-4 mr-1" />
              Analyze Patents
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="queue">Analysis Queue</TabsTrigger>
              <TabsTrigger value="results">Results</TabsTrigger>
              <TabsTrigger value="summary">Summary</TabsTrigger>
            </TabsList>

            <TabsContent value="queue" className="mt-4">
              {isAnalyzing ? (
                <div className="space-y-4">
                  <div className="text-center py-4">
                    <Brain className="h-12 w-12 mx-auto mb-4 animate-pulse text-blue-600" />
                    <p className="text-sm font-medium">Analyzing Prior Art</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedPatent?.patent_number} - {selectedPatent?.title}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Analysis Progress</span>
                      <span>{Math.round(analysisProgress)}%</span>
                    </div>
                    <Progress value={analysisProgress} className="h-2" />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {patents.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileSearch className="h-12 w-12 mx-auto mb-4" />
                      <p>No patents available for analysis</p>
                      <p className="text-sm">Search for patents first to begin prior art analysis</p>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground">
                        {patents.length} patents ready for prior art analysis
                      </p>
                      <div className="grid gap-2">
                        {patents.slice(0, 5).map((patent) => (
                          <div 
                            key={patent.id} 
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                          >
                            <div className="flex-1">
                              <p className="text-sm font-medium">{patent.patent_number}</p>
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {patent.title}
                              </p>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => startPriorArtAnalysis(patent)}
                            >
                              Analyze
                            </Button>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="results" className="mt-4">
              {analyses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileSearch className="h-12 w-12 mx-auto mb-4" />
                  <p>No prior art analyses completed yet</p>
                  <p className="text-sm">Start analyzing patents to see results here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {analyses.map((analysis) => (
                    <Card key={analysis.id} className="hover:shadow-sm transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {getStatusIcon(analysis.status)}
                              <span className="font-mono text-sm">{analysis.patent.patent_number}</span>
                              <Badge className={getRiskColor(analysis.analysis.anticipation_risk)}>
                                {analysis.analysis.anticipation_risk} risk
                              </Badge>
                            </div>
                            <h3 className="font-medium text-sm line-clamp-1 mb-2">
                              {analysis.patent.title}
                            </h3>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">
                              {analysis.analysis.novelty_score.toFixed(1)}% novelty
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {analysis.analysis.blocking_patents.length} blocking patents
                            </div>
                          </div>
                        </div>

                        <div className="grid md:grid-cols-3 gap-4 text-xs">
                          <div>
                            <span className="font-medium">Freedom to Operate:</span>
                            <div className="flex items-center gap-1 mt-1">
                              <Badge className={getRiskColor(analysis.analysis.freedom_to_operate.risk_level)} size="sm">
                                {analysis.analysis.freedom_to_operate.risk_level}
                              </Badge>
                              <span className="text-muted-foreground">
                                {analysis.analysis.freedom_to_operate.active_patents} active patents
                              </span>
                            </div>
                          </div>
                          <div>
                            <span className="font-medium">Commercial Impact:</span>
                            <div className="mt-1">
                              <Progress 
                                value={analysis.analysis.commercial_impact.market_potential} 
                                className="h-1 mb-1" 
                              />
                              <span className="text-muted-foreground">
                                {Math.round(analysis.analysis.commercial_impact.market_potential)}% market potential
                              </span>
                            </div>
                          </div>
                          <div>
                            <span className="font-medium">Recommendations:</span>
                            <div className="mt-1">
                              {analysis.recommendations.map((rec, index) => (
                                <Badge key={index} variant="outline" className="text-xs mr-1 mb-1">
                                  {rec.type.replace('_', ' ')}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="summary" className="mt-4">
              {analyses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4" />
                  <p>No analysis summary available</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Risk Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {['low', 'medium', 'high'].map((risk) => {
                          const count = analyses.filter(a => a.analysis.anticipation_risk === risk).length;
                          const percentage = analyses.length > 0 ? (count / analyses.length) * 100 : 0;
                          return (
                            <div key={risk} className="flex items-center justify-between">
                              <Badge className={getRiskColor(risk)}>
                                {risk} risk
                              </Badge>
                              <div className="flex items-center gap-2">
                                <Progress value={percentage} className="w-20 h-1" />
                                <span className="text-sm">{count}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Average Metrics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Novelty Score</span>
                            <span>{(analyses.reduce((sum, a) => sum + a.analysis.novelty_score, 0) / analyses.length).toFixed(1)}%</span>
                          </div>
                          <Progress value={analyses.reduce((sum, a) => sum + a.analysis.novelty_score, 0) / analyses.length} className="h-1" />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Market Potential</span>
                            <span>{(analyses.reduce((sum, a) => sum + a.analysis.commercial_impact.market_potential, 0) / analyses.length).toFixed(1)}%</span>
                          </div>
                          <Progress value={analyses.reduce((sum, a) => sum + a.analysis.commercial_impact.market_potential, 0) / analyses.length} className="h-1" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}