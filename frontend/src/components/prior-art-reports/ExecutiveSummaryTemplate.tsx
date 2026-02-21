/**
 * Executive Summary Template Component
 * Rich template for generating professional executive summaries in prior art reports
 */

'use client';

import { useState } from 'react';
import {
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Star,
  BarChart3,
  Shield,
  Clock,
  Users,
  ArrowRight,
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

interface ExecutiveFinding {
  id: string;
  type: 'strength' | 'risk' | 'opportunity' | 'neutral';
  summary: string;
  impact: 'critical' | 'high' | 'medium' | 'low';
  confidence: number; // 0-100
  supporting_evidence: string[];
  implications: string;
}

interface RiskAssessment {
  overall_risk: 'very_high' | 'high' | 'moderate' | 'low' | 'very_low';
  risk_score: number; // 0-100
  factors: {
    anticipation_risk: number;
    obviousness_risk: number;
    enablement_risk: number;
    validity_risk: number;
  };
  timeline_risk: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
  business_impact: 'critical' | 'significant' | 'moderate' | 'minimal';
}

interface ExecutiveRecommendation {
  id: string;
  priority: 'immediate' | 'high' | 'medium' | 'low';
  category: 'legal' | 'technical' | 'business' | 'strategic';
  title: string;
  description: string;
  estimated_effort: 'low' | 'medium' | 'high';
  estimated_timeline: string;
  dependencies: string[];
  success_metrics: string[];
}

interface ExecutiveSummaryData {
  project_overview: {
    project_type: 'FTO' | 'NOVELTY' | 'INVALIDITY';
    target_patent?: string;
    search_scope: string;
    analysis_date: string;
    analyst: string;
  };
  key_findings: ExecutiveFinding[];
  risk_assessment: RiskAssessment;
  recommendations: ExecutiveRecommendation[];
  next_steps: {
    immediate_actions: string[];
    short_term_goals: string[];
    long_term_strategy: string[];
  };
  executive_metrics: {
    total_references: number;
    high_risk_references: number;
    search_coverage: number;
    analysis_confidence: number;
    estimated_cost_impact?: string;
    timeline_to_resolution?: string;
  };
}

interface ExecutiveSummaryTemplateProps {
  projectType: 'FTO' | 'NOVELTY' | 'INVALIDITY';
  analysisData?: any;
  onContentUpdate?: (content: ExecutiveSummaryData) => void;
}

export function ExecutiveSummaryTemplate({ 
  projectType, 
  analysisData,
  onContentUpdate 
}: ExecutiveSummaryTemplateProps) {
  const [summaryData, setSummaryData] = useState<ExecutiveSummaryData>(() => 
    generateExecutiveSummary(projectType, analysisData)
  );

  function generateExecutiveSummary(type: string, data?: any): ExecutiveSummaryData {
    const baseData: ExecutiveSummaryData = {
      project_overview: {
        project_type: type as 'FTO' | 'NOVELTY' | 'INVALIDITY',
        target_patent: type === 'INVALIDITY' ? 'US10,987,654' : undefined,
        search_scope: 'Comprehensive multi-database search covering 2010-2024',
        analysis_date: new Date().toLocaleDateString(),
        analyst: 'Patent Analytics Platform'
      },
      key_findings: [],
      risk_assessment: {
        overall_risk: 'moderate',
        risk_score: 65,
        factors: {
          anticipation_risk: 72,
          obviousness_risk: 68,
          enablement_risk: 58,
          validity_risk: 62
        },
        timeline_risk: 'short_term',
        business_impact: 'significant'
      },
      recommendations: [],
      next_steps: {
        immediate_actions: [],
        short_term_goals: [],
        long_term_strategy: []
      },
      executive_metrics: {
        total_references: 25,
        high_risk_references: 8,
        search_coverage: 85,
        analysis_confidence: 82
      }
    };

    // Generate project-specific findings
    if (type === 'FTO') {
      baseData.key_findings = [
        {
          id: 'f1',
          type: 'risk',
          summary: 'Identified 3 blocking patents with high infringement risk in core technology area',
          impact: 'critical',
          confidence: 88,
          supporting_evidence: ['US10,123,456 - Direct feature overlap', 'EP3456789 - Similar architecture'],
          implications: 'May prevent commercialization without licensing or design-around'
        },
        {
          id: 'f2',
          type: 'opportunity',
          summary: 'Found clear design-around opportunities in alternative implementation approaches',
          impact: 'high',
          confidence: 75,
          supporting_evidence: ['Gap analysis shows 3 viable alternatives', 'Prior art clustering reveals open spaces'],
          implications: 'Potential path to freedom to operate with modified approach'
        },
        {
          id: 'f3',
          type: 'strength',
          summary: 'Target technology shows novel aspects not disclosed in identified prior art',
          impact: 'medium',
          confidence: 80,
          supporting_evidence: ['Unique optimization algorithm', 'Novel data structure implementation'],
          implications: 'Potential for strong patent protection in uncovered areas'
        }
      ];

      baseData.recommendations = [
        {
          id: 'r1',
          priority: 'immediate',
          category: 'legal',
          title: 'Initiate licensing discussions with key patent holders',
          description: 'Begin negotiations with holders of 3 blocking patents identified in core technology space',
          estimated_effort: 'high',
          estimated_timeline: '3-6 months',
          dependencies: ['Patent valuation analysis', 'Business case development'],
          success_metrics: ['Licensing agreements executed', 'Cost per license below $X threshold']
        },
        {
          id: 'r2',
          priority: 'high',
          category: 'technical',
          title: 'Develop design-around prototypes for identified alternatives',
          description: 'Create working prototypes of 3 alternative approaches to validate technical feasibility',
          estimated_effort: 'medium',
          estimated_timeline: '2-4 months',
          dependencies: ['Technical team allocation', 'R&D budget approval'],
          success_metrics: ['Functional prototypes delivered', 'Performance within 10% of original']
        }
      ];

      baseData.next_steps = {
        immediate_actions: [
          'Schedule licensing strategy meeting with legal counsel',
          'Allocate R&D resources for design-around development',
          'Update product roadmap based on FTO constraints'
        ],
        short_term_goals: [
          'Complete detailed claim mapping for top 5 references',
          'Finalize technical specifications for design-around approaches',
          'Establish monitoring system for new patent filings in this space'
        ],
        long_term_strategy: [
          'Build robust patent portfolio in identified white spaces',
          'Develop cross-licensing relationships with key industry players',
          'Create defensible IP moat around core innovations'
        ]
      };

      baseData.executive_metrics.estimated_cost_impact = '$2-5M in licensing fees or R&D costs';
      baseData.executive_metrics.timeline_to_resolution = '6-12 months';
    } 
    else if (type === 'NOVELTY') {
      baseData.key_findings = [
        {
          id: 'f1',
          type: 'risk',
          summary: 'Identified 2 highly similar prior art references that may impact patentability',
          impact: 'high',
          confidence: 85,
          supporting_evidence: ['US9,876,543 - 80% feature overlap', 'Published application with similar claims'],
          implications: 'May require narrow claiming strategy or continuation applications'
        },
        {
          id: 'f2',
          type: 'strength',
          summary: 'Novel algorithmic approach not disclosed in any identified prior art',
          impact: 'high',
          confidence: 90,
          supporting_evidence: ['Unique optimization technique', 'No comparable implementations found'],
          implications: 'Strong foundation for broad patent claims in core innovation'
        },
        {
          id: 'f3',
          type: 'opportunity',
          summary: 'Identified several related inventions that could strengthen portfolio',
          impact: 'medium',
          confidence: 70,
          supporting_evidence: ['Adjacent technical areas with limited coverage', 'Continuation opportunity analysis'],
          implications: 'Potential for comprehensive IP portfolio development'
        }
      ];

      baseData.recommendations = [
        {
          id: 'r1',
          priority: 'immediate',
          category: 'legal',
          title: 'Refine patent claims to emphasize novel aspects',
          description: 'Work with patent attorney to draft claims highlighting unique algorithmic innovations',
          estimated_effort: 'medium',
          estimated_timeline: '2-4 weeks',
          dependencies: ['Technical disclosure review', 'Prior art analysis completion'],
          success_metrics: ['Claims differentiated from prior art', 'Broad protection achieved']
        }
      ];
    }
    else if (type === 'INVALIDITY') {
      baseData.key_findings = [
        {
          id: 'f1',
          type: 'strength',
          summary: 'Found strong anticipation evidence predating target patent by 2 years',
          impact: 'critical',
          confidence: 92,
          supporting_evidence: ['US10,123,456 published 2019 vs target 2021', 'Clear anticipation of claims 1-3'],
          implications: 'High probability of successful invalidity challenge'
        },
        {
          id: 'f2',
          type: 'strength',
          summary: 'Identified obviousness combination with clear motivation to combine',
          impact: 'high',
          confidence: 87,
          supporting_evidence: ['Two references address same problem', 'Industry standard combination'],
          implications: 'Alternative invalidity argument with strong support'
        },
        {
          id: 'f3',
          type: 'risk',
          summary: 'Target patent has prosecution history that may limit invalidity approaches',
          impact: 'medium',
          confidence: 75,
          supporting_evidence: ['Claim amendments during prosecution', 'Examiner allowance rationale'],
          implications: 'Need to address prosecution history estoppel in invalidity strategy'
        }
      ];

      baseData.recommendations = [
        {
          id: 'r1',
          priority: 'immediate',
          category: 'legal',
          title: 'Prepare comprehensive invalidity contention based on anticipation',
          description: 'Develop detailed claim chart showing anticipation by primary prior art reference',
          estimated_effort: 'high',
          estimated_timeline: '4-6 weeks',
          dependencies: ['Detailed claim construction analysis', 'Expert witness identification'],
          success_metrics: ['Claim chart completed', 'Legal strategy finalized']
        }
      ];

      baseData.executive_metrics.estimated_cost_impact = '$500K-2M in litigation costs avoided';
      baseData.executive_metrics.timeline_to_resolution = '12-18 months (litigation timeline)';
    }

    return baseData;
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'very_high': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'moderate': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      case 'very_low': return 'text-green-700 bg-green-100';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'high': return <TrendingUp className="h-4 w-4 text-orange-600" />;
      case 'medium': return <BarChart3 className="h-4 w-4 text-yellow-600" />;
      case 'low': return <CheckCircle className="h-4 w-4 text-green-600" />;
      default: return <Target className="h-4 w-4 text-gray-600" />;
    }
  };

  const getFindingTypeColor = (type: string) => {
    switch (type) {
      case 'risk': return 'border-red-200 bg-red-50';
      case 'opportunity': return 'border-green-200 bg-green-50';
      case 'strength': return 'border-blue-200 bg-blue-50';
      case 'neutral': return 'border-gray-200 bg-gray-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'immediate': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Project Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Project Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium">Analysis Type</p>
              <Badge variant="default" className="mt-1">
                {summaryData.project_overview.project_type}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium">Analysis Date</p>
              <p className="text-sm text-muted-foreground">{summaryData.project_overview.analysis_date}</p>
            </div>
            {summaryData.project_overview.target_patent && (
              <div>
                <p className="text-sm font-medium">Target Patent</p>
                <p className="text-sm text-muted-foreground">{summaryData.project_overview.target_patent}</p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium">Search Scope</p>
              <p className="text-sm text-muted-foreground">{summaryData.project_overview.search_scope}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Executive Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Key Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{summaryData.executive_metrics.total_references}</div>
              <p className="text-sm text-muted-foreground">Total References</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{summaryData.executive_metrics.high_risk_references}</div>
              <p className="text-sm text-muted-foreground">High Risk References</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{summaryData.executive_metrics.search_coverage}%</div>
              <p className="text-sm text-muted-foreground">Search Coverage</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{summaryData.executive_metrics.analysis_confidence}%</div>
              <p className="text-sm text-muted-foreground">Analysis Confidence</p>
            </div>
          </div>
          
          {(summaryData.executive_metrics.estimated_cost_impact || summaryData.executive_metrics.timeline_to_resolution) && (
            <>
              <Separator className="my-4" />
              <div className="grid gap-4 md:grid-cols-2">
                {summaryData.executive_metrics.estimated_cost_impact && (
                  <div>
                    <p className="text-sm font-medium">Estimated Cost Impact</p>
                    <p className="text-sm text-muted-foreground">{summaryData.executive_metrics.estimated_cost_impact}</p>
                  </div>
                )}
                {summaryData.executive_metrics.timeline_to_resolution && (
                  <div>
                    <p className="text-sm font-medium">Timeline to Resolution</p>
                    <p className="text-sm text-muted-foreground">{summaryData.executive_metrics.timeline_to_resolution}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Risk Assessment */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Risk Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Overall Risk Level</p>
                <Badge className={getRiskColor(summaryData.risk_assessment.overall_risk)}>
                  {summaryData.risk_assessment.overall_risk.replace('_', ' ').toUpperCase()} ({summaryData.risk_assessment.risk_score}%)
                </Badge>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Business Impact</p>
                <p className="font-medium">{summaryData.risk_assessment.business_impact}</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium">Risk Factors</h4>
              <div className="space-y-2">
                {Object.entries(summaryData.risk_assessment.factors).map(([factor, score]) => (
                  <div key={factor} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="capitalize">{factor.replace('_', ' ')}</span>
                      <span>{score}%</span>
                    </div>
                    <Progress value={score} className="h-2" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Findings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Star className="h-4 w-4" />
            Key Findings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {summaryData.key_findings.map((finding) => (
              <div key={finding.id} className={`p-4 border rounded-lg ${getFindingTypeColor(finding.type)}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getImpactIcon(finding.impact)}
                    <Badge variant="outline" className="capitalize">
                      {finding.type}
                    </Badge>
                    <Badge variant="secondary">
                      {finding.confidence}% confidence
                    </Badge>
                  </div>
                  <Badge className={`${finding.impact === 'critical' ? 'bg-red-100 text-red-800' : 
                                   finding.impact === 'high' ? 'bg-orange-100 text-orange-800' :
                                   finding.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                   'bg-green-100 text-green-800'}`}>
                    {finding.impact} impact
                  </Badge>
                </div>
                
                <p className="font-medium mb-2">{finding.summary}</p>
                <p className="text-sm text-muted-foreground mb-3">{finding.implications}</p>
                
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Supporting Evidence:</p>
                  <ul className="text-xs space-y-1">
                    {finding.supporting_evidence.map((evidence, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-muted-foreground">•</span>
                        <span>{evidence}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ArrowRight className="h-4 w-4" />
            Executive Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {summaryData.recommendations.map((rec) => (
              <div key={rec.id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Badge className={getPriorityColor(rec.priority)}>
                      {rec.priority} priority
                    </Badge>
                    <Badge variant="outline">
                      {rec.category}
                    </Badge>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <p>{rec.estimated_timeline}</p>
                    <p>{rec.estimated_effort} effort</p>
                  </div>
                </div>
                
                <h4 className="font-medium mb-2">{rec.title}</h4>
                <p className="text-sm text-muted-foreground mb-3">{rec.description}</p>
                
                {rec.success_metrics.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Success Metrics:</p>
                    <ul className="text-xs space-y-1">
                      {rec.success_metrics.map((metric, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle className="h-3 w-3 text-green-600 mt-0.5" />
                          <span>{metric}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Next Steps
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                Immediate Actions
              </h4>
              <ul className="space-y-2">
                {summaryData.next_steps.immediate_actions.map((action, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <span className="text-red-600 mt-1">•</span>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Target className="h-4 w-4 text-orange-600" />
                Short-term Goals
              </h4>
              <ul className="space-y-2">
                {summaryData.next_steps.short_term_goals.map((goal, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <span className="text-orange-600 mt-1">•</span>
                    <span>{goal}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Star className="h-4 w-4 text-blue-600" />
                Long-term Strategy
              </h4>
              <ul className="space-y-2">
                {summaryData.next_steps.long_term_strategy.map((strategy, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>{strategy}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}