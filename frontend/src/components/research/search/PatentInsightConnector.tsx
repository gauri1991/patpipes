'use client';

import { useState, useEffect } from 'react';
import { Link2, Brain, FileText, ArrowRight, Lightbulb, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface PatentInsight {
  id: string;
  patent_number: string;
  title: string;
  relevance_score: number;
  insights: {
    technology_overlap: string[];
    competitive_threats: string[];
    innovation_gaps: string[];
    licensing_opportunities: string[];
  };
  brainstorming_connections: {
    keywords_matched: string[];
    concepts_triggered: string[];
    strategy_implications: string[];
  };
}

interface PatentInsightConnectorProps {
  patents: any[];
  brainstormingData: {
    sessionId: string;
    projectId: string;
    keywords?: string[];
    strategies?: string[];
    concepts?: string[];
  };
  onInsightGenerated?: (insight: PatentInsight) => void;
}

export function PatentInsightConnector({ 
  patents, 
  brainstormingData,
  onInsightGenerated
}: PatentInsightConnectorProps) {
  const [insights, setInsights] = useState<PatentInsight[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  // Generate insights when patents change
  useEffect(() => {
    if (patents.length > 0 && brainstormingData.keywords) {
      generateInsights();
    }
  }, [patents, brainstormingData]);

  const generateInsights = async () => {
    setIsGenerating(true);
    setProgress(0);

    // Simulate insight generation process
    for (let i = 0; i < patents.length; i++) {
      const patent = patents[i];
      
      // Simulate AI analysis
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const insight: PatentInsight = {
        id: `insight-${patent.id}`,
        patent_number: patent.patent_number,
        title: patent.title,
        relevance_score: Math.random() * 100,
        insights: {
          technology_overlap: generateTechnologyOverlap(patent, brainstormingData),
          competitive_threats: generateCompetitiveThreats(patent),
          innovation_gaps: generateInnovationGaps(patent, brainstormingData),
          licensing_opportunities: generateLicensingOpportunities(patent)
        },
        brainstorming_connections: {
          keywords_matched: findKeywordMatches(patent, brainstormingData.keywords || []),
          concepts_triggered: generateTriggeredConcepts(patent, brainstormingData),
          strategy_implications: generateStrategyImplications(patent, brainstormingData)
        }
      };

      setInsights(prev => [...prev, insight]);
      setProgress(((i + 1) / patents.length) * 100);
      onInsightGenerated?.(insight);
    }

    setIsGenerating(false);
  };

  const generateTechnologyOverlap = (patent: any, brainstormingData: any) => {
    const overlaps = [
      'Core algorithm similarities detected',
      'Shared technical architecture patterns',
      'Common implementation challenges',
      'Similar performance optimization approaches'
    ];
    return overlaps.slice(0, Math.floor(Math.random() * 3) + 1);
  };

  const generateCompetitiveThreats = (patent: any) => {
    const threats = [
      'Blocking patent potential',
      'Market entry barrier',
      'Licensing requirement risk',
      'Design-around necessity'
    ];
    return threats.slice(0, Math.floor(Math.random() * 2) + 1);
  };

  const generateInnovationGaps = (patent: any, brainstormingData: any) => {
    const gaps = [
      'Scalability improvements possible',
      'Energy efficiency optimization gap',
      'User experience enhancement opportunity',
      'Integration complexity reduction potential'
    ];
    return gaps.slice(0, Math.floor(Math.random() * 2) + 1);
  };

  const generateLicensingOpportunities = (patent: any) => {
    const opportunities = [
      'Cross-licensing potential',
      'Technology partnership opportunity',
      'Standards adoption leverage',
      'Market expansion enabler'
    ];
    return opportunities.slice(0, Math.floor(Math.random() * 2) + 1);
  };

  const findKeywordMatches = (patent: any, keywords: string[]) => {
    return keywords.filter(keyword => 
      patent.title.toLowerCase().includes(keyword.toLowerCase()) ||
      patent.abstract?.toLowerCase().includes(keyword.toLowerCase())
    ).slice(0, 3);
  };

  const generateTriggeredConcepts = (patent: any, brainstormingData: any) => {
    const concepts = [
      'Alternative implementation approach',
      'Complementary feature idea',
      'Performance optimization strategy',
      'Market differentiation angle'
    ];
    return concepts.slice(0, Math.floor(Math.random() * 2) + 1);
  };

  const generateStrategyImplications = (patent: any, brainstormingData: any) => {
    const implications = [
      'R&D focus area validation',
      'Competitive positioning insight',
      'IP strategy consideration',
      'Partnership exploration trigger'
    ];
    return implications.slice(0, Math.floor(Math.random() * 2) + 1);
  };

  const getRelevanceColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">Patent-Brainstorming Insights</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary">{patents.length} patents analyzed</Badge>
                  <Badge variant="outline">{insights.length} insights generated</Badge>
                </div>
              </div>
            </div>
            {isGenerating && (
              <div className="flex items-center gap-2">
                <Progress value={progress} className="w-32 h-2" />
                <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isGenerating && insights.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Brain className="h-12 w-12 mx-auto mb-4 animate-pulse" />
              <p>Generating insights from patent analysis...</p>
              <p className="text-sm">Connecting patents to brainstorming concepts</p>
            </div>
          ) : insights.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Link2 className="h-12 w-12 mx-auto mb-4" />
              <p>No insights generated yet</p>
              <p className="text-sm">Search for patents to see brainstorming connections</p>
            </div>
          ) : (
            <div className="space-y-4">
              {insights.map((insight) => (
                <Card key={insight.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <FileText className="h-4 w-4 text-blue-600" />
                          <span className="font-mono text-sm">{insight.patent_number}</span>
                          <div className="flex items-center gap-1">
                            <div className={`w-2 h-2 rounded-full ${getRelevanceColor(insight.relevance_score)}`} />
                            <span className="text-xs text-muted-foreground">
                              {Math.round(insight.relevance_score)}% relevance
                            </span>
                          </div>
                        </div>
                        <h3 className="font-medium text-sm line-clamp-1 mb-2">
                          {insight.title}
                        </h3>
                      </div>
                    </div>

                    {/* Brainstorming Connections */}
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Target className="h-3 w-3 text-green-600" />
                          <span className="text-xs font-medium">Brainstorming Connections</span>
                        </div>
                        <div className="space-y-1">
                          {insight.brainstorming_connections.keywords_matched.length > 0 && (
                            <div>
                              <span className="text-xs text-muted-foreground">Keywords matched:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {insight.brainstorming_connections.keywords_matched.map((keyword, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {keyword}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          {insight.brainstorming_connections.concepts_triggered.length > 0 && (
                            <div className="mt-2">
                              <span className="text-xs text-muted-foreground">Concepts triggered:</span>
                              <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                                {insight.brainstorming_connections.concepts_triggered.map((concept, index) => (
                                  <li key={index} className="flex items-center gap-1">
                                    <Lightbulb className="h-2 w-2" />
                                    {concept}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <ArrowRight className="h-3 w-3 text-blue-600" />
                          <span className="text-xs font-medium">Strategic Insights</span>
                        </div>
                        <div className="space-y-1">
                          {insight.insights.technology_overlap.length > 0 && (
                            <div>
                              <span className="text-xs text-muted-foreground">Tech overlap:</span>
                              <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                                {insight.insights.technology_overlap.slice(0, 2).map((overlap, index) => (
                                  <li key={index}>• {overlap}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {insight.insights.innovation_gaps.length > 0 && (
                            <div className="mt-2">
                              <span className="text-xs text-muted-foreground">Innovation gaps:</span>
                              <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                                {insight.insights.innovation_gaps.slice(0, 1).map((gap, index) => (
                                  <li key={index}>• {gap}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-2 border-t">
                      <Button size="sm" variant="outline" className="text-xs">
                        <Brain className="h-3 w-3 mr-1" />
                        Add to Session
                      </Button>
                      <Button size="sm" variant="ghost" className="text-xs">
                        <FileText className="h-3 w-3 mr-1" />
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}