/**
 * Legal Analysis Template Component
 * Comprehensive legal analysis template for prior art reports
 */

'use client';

import { useState } from 'react';
import {
  Scale,
  Shield,
  AlertTriangle,
  CheckCircle,
  Info,
  Gavel,
  FileText,
  Target,
  TrendingUp,
  BarChart3,
  Clock,
  Star,
  User,
  Building,
  Calendar,
  Award,
  Zap,
  Activity,
  Settings,
  Edit3
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface LegalFactor {
  factor: string;
  score: number;
  weight: number;
  confidence: number;
  supporting_evidence: string[];
  legal_precedents: string[];
  risk_level: 'critical' | 'high' | 'medium' | 'low';
  impact_description: string;
}

interface AnticipationAnalysis {
  overall_score: number;
  key_references: Array<{
    patent_id: string;
    title: string;
    publication_date: string;
    anticipation_score: number;
    claim_coverage: Record<string, number>;
    missing_elements: string[];
    strength_assessment: 'very_strong' | 'strong' | 'moderate' | 'weak';
  }>;
  anticipation_type: 'direct' | 'inherent' | 'combination';
  legal_standard: string;
  burden_of_proof: string;
  defenses_available: string[];
}

interface ObviousnessAnalysis {
  overall_score: number;
  primary_reference: {
    patent_id: string;
    title: string;
    relevance_score: number;
  };
  secondary_references: Array<{
    patent_id: string;
    title: string;
    combination_rationale: string;
    motivation_to_combine: number;
  }>;
  graham_factors: {
    scope_of_prior_art: number;
    differences: number;
    skill_level: number;
    secondary_considerations: number;
  };
  motivation_analysis: string;
  teaching_away: boolean;
  objective_evidence: string[];
}

interface EnablementAnalysis {
  enablement_score: number;
  written_description_score: number;
  best_mode_compliance: boolean;
  enablement_factors: {
    amount_of_experimentation: number;
    guidance_provided: number;
    working_examples: number;
    breadth_of_claims: number;
  };
  potential_issues: string[];
  supporting_disclosure: string[];
}

interface ValidityRisks {
  overall_validity_score: number;
  risk_factors: Array<{
    risk_type: 'anticipation' | 'obviousness' | 'enablement' | 'written_description' | 'indefiniteness' | 'claim_scope';
    severity: 'critical' | 'high' | 'medium' | 'low';
    probability: number;
    impact: number;
    description: string;
    mitigation_strategies: string[];
  }>;
  prosecution_history: {
    amendments_made: boolean;
    examiner_rejections: string[];
    applicant_arguments: string[];
    potential_estoppel: string[];
  };
  claim_construction_issues: Array<{
    claim_element: string;
    interpretation_risk: number;
    potential_constructions: string[];
    impact_on_validity: string;
  }>;
}

interface LegalAnalysisData {
  analysis_overview: {
    analysis_type: 'FTO' | 'NOVELTY' | 'INVALIDITY';
    target_patent?: string;
    analysis_date: string;
    jurisdiction: string;
    legal_standard: string;
    analyst: string;
  };
  anticipation_analysis: AnticipationAnalysis;
  obviousness_analysis: ObviousnessAnalysis;
  enablement_analysis: EnablementAnalysis;
  validity_assessment: ValidityRisks;
  legal_factors: LegalFactor[];
  claim_analysis: {
    independent_claims: number;
    dependent_claims: number;
    claim_scope_analysis: Array<{
      claim_number: string;
      scope_rating: 'broad' | 'medium' | 'narrow';
      validity_risk: number;
      key_limitations: string[];
      prior_art_mapping: Record<string, number>;
    }>;
  };
  jurisdiction_specific: {
    applicable_law: string;
    recent_precedents: Array<{
      case_name: string;
      year: number;
      relevance: number;
      key_holding: string;
      impact_on_analysis: string;
    }>;
    procedural_considerations: string[];
    timeline_estimates: {
      examination_timeline?: string;
      litigation_timeline?: string;
      appeal_timeline?: string;
    };
  };
  recommendations: {
    immediate_actions: Array<{
      action: string;
      priority: 'critical' | 'high' | 'medium' | 'low';
      timeline: string;
      resources_required: string;
      expected_outcome: string;
    }>;
    strategic_considerations: string[];
    risk_mitigation: string[];
    alternative_approaches: string[];
  };
}

interface LegalAnalysisTemplateProps {
  projectType: 'FTO' | 'NOVELTY' | 'INVALIDITY';
  patentData?: any;
  onContentUpdate?: (content: LegalAnalysisData) => void;
}

export function LegalAnalysisTemplate({ 
  projectType, 
  patentData,
  onContentUpdate 
}: LegalAnalysisTemplateProps) {
  const [analysisData, setAnalysisData] = useState<LegalAnalysisData>(() => 
    generateLegalAnalysis(projectType, patentData)
  );

  function generateLegalAnalysis(type: string, data?: any): LegalAnalysisData {
    const baseData: LegalAnalysisData = {
      analysis_overview: {
        analysis_type: type as 'FTO' | 'NOVELTY' | 'INVALIDITY',
        target_patent: type === 'INVALIDITY' ? 'US10,987,654' : undefined,
        analysis_date: new Date().toLocaleDateString(),
        jurisdiction: 'United States',
        legal_standard: type === 'INVALIDITY' ? 'Clear and convincing evidence' : 'Preponderance of evidence',
        analyst: 'Patent Legal Analyst'
      },
      anticipation_analysis: {
        overall_score: 78,
        key_references: [
          {
            patent_id: 'US10,123,456',
            title: 'Machine Learning System with Adaptive Preprocessing',
            publication_date: '2019-11-12',
            anticipation_score: 85,
            claim_coverage: {
              'claim_1': 92,
              'claim_2': 78,
              'claim_3': 85,
              'claim_4': 45
            },
            missing_elements: ['Specific optimization threshold', 'Real-time constraint details'],
            strength_assessment: 'very_strong'
          },
          {
            patent_id: 'EP3456789',
            title: 'Deep Learning Optimization Methods',
            publication_date: '2020-03-15',
            anticipation_score: 70,
            claim_coverage: {
              'claim_1': 65,
              'claim_2': 82,
              'claim_3': 58,
              'claim_4': 75
            },
            missing_elements: ['Hardware implementation details', 'Performance benchmarks'],
            strength_assessment: 'strong'
          }
        ],
        anticipation_type: 'direct',
        legal_standard: '35 U.S.C. § 102 - Each element must be disclosed',
        burden_of_proof: 'Clear and convincing evidence for invalidity proceedings',
        defenses_available: [
          'Claim construction arguments',
          'Prior art does not enable',
          'Missing claim elements',
          'Prosecution history estoppel'
        ]
      },
      obviousness_analysis: {
        overall_score: 82,
        primary_reference: {
          patent_id: 'US10,123,456',
          title: 'Machine Learning System with Adaptive Preprocessing',
          relevance_score: 89
        },
        secondary_references: [
          {
            patent_id: 'US9,876,543',
            title: 'Neural Network Architecture Optimization',
            combination_rationale: 'Both references address same technical problem of processing efficiency',
            motivation_to_combine: 87
          },
          {
            patent_id: 'EP3234567',
            title: 'Real-time Data Processing Methods',
            combination_rationale: 'Provides missing real-time implementation details',
            motivation_to_combine: 73
          }
        ],
        graham_factors: {
          scope_of_prior_art: 85,
          differences: 68,
          skill_level: 78,
          secondary_considerations: 45
        },
        motivation_analysis: 'Strong motivation exists as both references address identical technical challenges in neural network optimization. Industry standard to combine these approaches.',
        teaching_away: false,
        objective_evidence: [
          'Commercial success of similar products',
          'Industry acceptance of combined approach',
          'Lack of alternative solutions at priority date'
        ]
      },
      enablement_analysis: {
        enablement_score: 72,
        written_description_score: 78,
        best_mode_compliance: true,
        enablement_factors: {
          amount_of_experimentation: 68,
          guidance_provided: 75,
          working_examples: 82,
          breadth_of_claims: 65
        },
        potential_issues: [
          'Broad claim scope may exceed enablement',
          'Limited guidance for edge cases',
          'Hardware dependency not fully addressed'
        ],
        supporting_disclosure: [
          'Detailed algorithm descriptions',
          'Working code examples',
          'Performance benchmarks',
          'Implementation guidelines'
        ]
      },
      validity_assessment: {
        overall_validity_score: 65,
        risk_factors: [
          {
            risk_type: 'anticipation',
            severity: 'high',
            probability: 0.78,
            impact: 0.85,
            description: 'Strong anticipation by US10,123,456 with direct element-by-element correspondence',
            mitigation_strategies: [
              'Narrow claim construction arguments',
              'Challenge prior art enablement',
              'Emphasize missing claim elements'
            ]
          },
          {
            risk_type: 'obviousness',
            severity: 'high',
            probability: 0.82,
            impact: 0.80,
            description: 'Clear motivation to combine primary and secondary references',
            mitigation_strategies: [
              'Argue teaching away in prior art',
              'Present secondary considerations evidence',
              'Challenge person of ordinary skill level'
            ]
          },
          {
            risk_type: 'enablement',
            severity: 'medium',
            probability: 0.45,
            impact: 0.65,
            description: 'Broad claim scope may not be fully enabled by disclosure',
            mitigation_strategies: [
              'File continuation with narrower claims',
              'Provide additional examples',
              'Clarify implementation requirements'
            ]
          }
        ],
        prosecution_history: {
          amendments_made: true,
          examiner_rejections: [
            '35 U.S.C. § 102 anticipation rejection',
            '35 U.S.C. § 103 obviousness rejection',
            '35 U.S.C. § 112 enablement rejection'
          ],
          applicant_arguments: [
            'Claims require specific optimization thresholds not disclosed in prior art',
            'Unexpected results achieved through novel combination',
            'Prior art teaches away from claimed approach'
          ],
          potential_estoppel: [
            'Amendment narrowing scope to avoid prior art',
            'Arguments distinguishing over specific references'
          ]
        },
        claim_construction_issues: [
          {
            claim_element: 'adaptive preprocessing',
            interpretation_risk: 78,
            potential_constructions: [
              'Dynamic adjustment based on input characteristics',
              'Machine learning-based preprocessing optimization',
              'Real-time parameter modification'
            ],
            impact_on_validity: 'Broader construction increases invalidity risk'
          },
          {
            claim_element: 'real-time processing',
            interpretation_risk: 65,
            potential_constructions: [
              'Processing within specified time constraints',
              'Simultaneous input and output processing',
              'Live data stream processing'
            ],
            impact_on_validity: 'Narrow construction may avoid prior art'
          }
        ]
      },
      legal_factors: [
        {
          factor: 'Claim Construction Risk',
          score: 72,
          weight: 0.85,
          confidence: 88,
          supporting_evidence: [
            'Ambiguous claim language identified',
            'Multiple reasonable interpretations possible',
            'Prosecution history may limit scope'
          ],
          legal_precedents: [
            'Markman v. Westview Instruments (1996)',
            'Phillips v. AWH Corp. (2005)',
            'Teva Pharmaceuticals v. Sandoz (2015)'
          ],
          risk_level: 'high',
          impact_description: 'Claim construction uncertainty significantly impacts validity analysis'
        },
        {
          factor: 'Prior Art Strength',
          score: 85,
          weight: 0.90,
          confidence: 92,
          supporting_evidence: [
            'Highly relevant primary reference identified',
            'Clear motivation to combine exists',
            'Strong element-by-element correspondence'
          ],
          legal_precedents: [
            'KSR v. Teleflex (2007)',
            'Graham v. John Deere (1966)',
            'Ariad Pharmaceuticals v. Eli Lilly (2010)'
          ],
          risk_level: 'critical',
          impact_description: 'Strong prior art creates substantial invalidity risk'
        }
      ],
      claim_analysis: {
        independent_claims: 3,
        dependent_claims: 17,
        claim_scope_analysis: [
          {
            claim_number: '1',
            scope_rating: 'broad',
            validity_risk: 82,
            key_limitations: [
              'Neural network architecture',
              'Adaptive preprocessing',
              'Real-time processing capability'
            ],
            prior_art_mapping: {
              'US10,123,456': 92,
              'EP3456789': 65,
              'US9,876,543': 78
            }
          },
          {
            claim_number: '2',
            scope_rating: 'medium',
            validity_risk: 68,
            key_limitations: [
              'Specific optimization algorithm',
              'Performance threshold requirements',
              'Multi-modal input processing'
            ],
            prior_art_mapping: {
              'US10,123,456': 78,
              'EP3456789': 82,
              'US9,876,543': 45
            }
          }
        ]
      },
      jurisdiction_specific: {
        applicable_law: '35 U.S.C. § 102, 103, 112 - USPTO examination and federal court standards',
        recent_precedents: [
          {
            case_name: 'Ariad Pharmaceuticals v. Eli Lilly',
            year: 2010,
            relevance: 85,
            key_holding: 'Written description requirement is separate from enablement',
            impact_on_analysis: 'Strengthens written description analysis requirements'
          },
          {
            case_name: 'KSR v. Teleflex',
            year: 2007,
            relevance: 92,
            key_holding: 'Obviousness analysis should consider common sense and ordinary innovation',
            impact_on_analysis: 'Lowers bar for obviousness, increases invalidity risk'
          }
        ],
        procedural_considerations: [
          'Patent prosecution timeline considerations',
          'Inter partes review (IPR) availability',
          'Post-grant review (PGR) time limits',
          'Federal court venue considerations'
        ],
        timeline_estimates: {
          examination_timeline: '18-36 months for prosecution',
          litigation_timeline: '2-4 years for district court resolution',
          appeal_timeline: '12-18 months for PTAB or Federal Circuit appeal'
        }
      },
      recommendations: {
        immediate_actions: [
          {
            action: 'Conduct detailed claim construction analysis',
            priority: 'critical',
            timeline: '2-3 weeks',
            resources_required: 'Patent attorney with claim construction expertise',
            expected_outcome: 'Clear understanding of claim scope and vulnerability'
          },
          {
            action: 'Prepare comprehensive prior art invalidity analysis',
            priority: 'critical',
            timeline: '4-6 weeks',
            resources_required: 'Technical expert and patent attorney collaboration',
            expected_outcome: 'Detailed invalidity contentions with claim charts'
          },
          {
            action: 'Evaluate secondary considerations evidence',
            priority: 'high',
            timeline: '3-4 weeks',
            resources_required: 'Market research and industry analysis',
            expected_outcome: 'Objective evidence to counter obviousness'
          }
        ],
        strategic_considerations: [
          'Consider filing continuation applications with narrower claims',
          'Evaluate defensive publication strategy for improvements',
          'Assess licensing opportunities before litigation risk materializes',
          'Monitor competitor patent filings in same technology space'
        ],
        risk_mitigation: [
          'Develop non-infringing design-around alternatives',
          'Build evidence file for secondary considerations',
          'Prepare for potential inter partes review challenges',
          'Consider settlement negotiations if infringement alleged'
        ],
        alternative_approaches: [
          'Focus on continuation applications in uncovered areas',
          'Pursue foreign filing in jurisdictions with different prior art',
          'Consider trade secret protection for implementation details',
          'Develop patent portfolio around peripheral technologies'
        ]
      }
    };

    return baseData;
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-700 bg-red-100 border-red-200';
      case 'high': return 'text-orange-700 bg-orange-100 border-orange-200';
      case 'medium': return 'text-yellow-700 bg-yellow-100 border-yellow-200';
      case 'low': return 'text-green-700 bg-green-100 border-green-200';
      default: return 'text-gray-700 bg-gray-100 border-gray-200';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-red-600';
    if (score >= 60) return 'text-orange-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'high': return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'medium': return <Info className="h-4 w-4 text-yellow-600" />;
      case 'low': return <CheckCircle className="h-4 w-4 text-green-600" />;
      default: return <Info className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Analysis Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Scale className="h-4 w-4" />
            Legal Analysis Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-sm font-medium">Analysis Type</p>
              <Badge variant="default" className="mt-1">
                {analysisData.analysis_overview.analysis_type}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium">Jurisdiction</p>
              <p className="text-sm text-muted-foreground mt-1">{analysisData.analysis_overview.jurisdiction}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Legal Standard</p>
              <p className="text-sm text-muted-foreground mt-1">{analysisData.analysis_overview.legal_standard}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Analysis Date</p>
              <p className="text-sm text-muted-foreground mt-1">{analysisData.analysis_overview.analysis_date}</p>
            </div>
          </div>
          
          {analysisData.analysis_overview.target_patent && (
            <>
              <Separator className="my-4" />
              <div>
                <p className="text-sm font-medium mb-2">Target Patent</p>
                <p className="text-sm text-muted-foreground">{analysisData.analysis_overview.target_patent}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Validity Risk Assessment */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Validity Risk Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Overall Validity Score</h4>
                <p className="text-sm text-muted-foreground">Lower scores indicate higher invalidity risk</p>
              </div>
              <div className="text-center">
                <div className={`text-3xl font-bold ${getScoreColor(analysisData.validity_assessment.overall_validity_score)}`}>
                  {analysisData.validity_assessment.overall_validity_score}%
                </div>
                <p className="text-sm text-muted-foreground">Validity Score</p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Risk Factors</h4>
              {analysisData.validity_assessment.risk_factors.map((risk, index) => (
                <div key={index} className={`p-4 border rounded-lg ${getSeverityColor(risk.severity)}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getRiskIcon(risk.severity)}
                      <div>
                        <h5 className="font-medium capitalize">{risk.risk_type.replace('_', ' ')}</h5>
                        <Badge variant="outline" className="text-xs">
                          {risk.severity} severity
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <div>Probability: {(risk.probability * 100).toFixed(0)}%</div>
                      <div>Impact: {(risk.impact * 100).toFixed(0)}%</div>
                    </div>
                  </div>
                  
                  <p className="text-sm mb-3">{risk.description}</p>
                  
                  <div>
                    <p className="text-xs font-medium mb-1">Mitigation Strategies:</p>
                    <ul className="text-xs space-y-1">
                      {risk.mitigation_strategies.map((strategy, sIndex) => (
                        <li key={sIndex} className="flex items-start gap-2">
                          <span className="text-muted-foreground mt-0.5">•</span>
                          <span>{strategy}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Anticipation Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4" />
            Anticipation Analysis (35 U.S.C. § 102)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Overall Anticipation Score</h4>
                <p className="text-sm text-muted-foreground">{analysisData.anticipation_analysis.legal_standard}</p>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${getScoreColor(analysisData.anticipation_analysis.overall_score)}`}>
                  {analysisData.anticipation_analysis.overall_score}%
                </div>
                <p className="text-sm text-muted-foreground">Risk Score</p>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Key Anticipating References</h4>
              <div className="space-y-4">
                {analysisData.anticipation_analysis.key_references.map((ref, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h5 className="font-medium">{ref.patent_id}</h5>
                        <p className="text-sm text-muted-foreground">{ref.title}</p>
                        <p className="text-xs text-muted-foreground">Published: {ref.publication_date}</p>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-bold ${getScoreColor(ref.anticipation_score)}`}>
                          {ref.anticipation_score}%
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {ref.strength_assessment.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="text-xs font-medium mb-2">Claim Coverage</p>
                        <div className="space-y-1">
                          {Object.entries(ref.claim_coverage).map(([claim, coverage]) => (
                            <div key={claim} className="flex items-center gap-2 text-xs">
                              <span className="w-16">{claim}:</span>
                              <Progress value={coverage} className="h-2 flex-1" />
                              <span className="w-10 text-right">{coverage}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-xs font-medium mb-2">Missing Elements</p>
                        <ul className="text-xs space-y-1">
                          {ref.missing_elements.map((element, eIndex) => (
                            <li key={eIndex} className="flex items-start gap-2">
                              <span className="text-red-500 mt-0.5">•</span>
                              <span>{element}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Available Defenses</h4>
              <div className="grid gap-2 md:grid-cols-2">
                {analysisData.anticipation_analysis.defenses_available.map((defense, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded text-sm">
                    <Shield className="h-4 w-4 text-blue-600" />
                    <span>{defense}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Obviousness Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Obviousness Analysis (35 U.S.C. § 103)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Overall Obviousness Score</h4>
                <p className="text-sm text-muted-foreground">Graham v. John Deere analysis</p>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${getScoreColor(analysisData.obviousness_analysis.overall_score)}`}>
                  {analysisData.obviousness_analysis.overall_score}%
                </div>
                <p className="text-sm text-muted-foreground">Risk Score</p>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Graham Factors Analysis</h4>
              <div className="space-y-3">
                {Object.entries(analysisData.obviousness_analysis.graham_factors).map(([factor, score]) => (
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

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h4 className="font-medium mb-3">Primary Reference</h4>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                  <h5 className="font-medium">{analysisData.obviousness_analysis.primary_reference.patent_id}</h5>
                  <p className="text-sm text-muted-foreground">{analysisData.obviousness_analysis.primary_reference.title}</p>
                  <div className="mt-2">
                    <span className="text-xs text-muted-foreground">Relevance: </span>
                    <span className="text-sm font-medium">{analysisData.obviousness_analysis.primary_reference.relevance_score}%</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">Secondary References</h4>
                <div className="space-y-2">
                  {analysisData.obviousness_analysis.secondary_references.map((ref, index) => (
                    <div key={index} className="p-3 border rounded">
                      <h5 className="font-medium text-sm">{ref.patent_id}</h5>
                      <p className="text-xs text-muted-foreground mb-2">{ref.title}</p>
                      <p className="text-xs">{ref.combination_rationale}</p>
                      <div className="mt-1">
                        <span className="text-xs text-muted-foreground">Motivation: </span>
                        <span className="text-xs font-medium">{ref.motivation_to_combine}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Motivation Analysis</h4>
              <p className="text-sm text-muted-foreground mb-3">{analysisData.obviousness_analysis.motivation_analysis}</p>
              
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Teaching Away:</span>
                  <Badge variant={analysisData.obviousness_analysis.teaching_away ? 'destructive' : 'secondary'}>
                    {analysisData.obviousness_analysis.teaching_away ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Objective Evidence (Secondary Considerations)</h4>
              <ul className="space-y-2">
                {analysisData.obviousness_analysis.objective_evidence.map((evidence, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <span>{evidence}</span>
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