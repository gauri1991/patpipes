/**
 * Legal Relevance Scoring System Component
 * Advanced legal analysis tool for evaluating prior art relevance in patent proceedings
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Scale,
  Gavel,
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Calendar,
  Globe,
  Award,
  BookOpen,
  Target,
  TrendingUp,
  TrendingDown,
  Clock,
  Users,
  Building,
  RefreshCw,
  Save,
  Download,
  Filter,
  Eye,
  EyeOff,
  Zap,
  Settings
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface LegalFactor {
  id: string;
  name: string;
  category: 'anticipation' | 'obviousness' | 'enablement' | 'validity' | 'infringement';
  weight: number; // 0-100
  score: number; // 0-100
  confidence: number; // 0-100
  rationale: string;
  supportingEvidence: string[];
  concerns: string[];
  impact: 'critical' | 'high' | 'medium' | 'low';
}

interface JurisdictionAnalysis {
  jurisdiction: string;
  applicability: number; // 0-100
  legalStandard: string;
  precedents: string[];
  considerations: string[];
  risks: string[];
  recommendations: string[];
}

interface LegalEvidence {
  id: string;
  title: string;
  publicationNumber: string;
  publicationDate: string;
  jurisdiction: string;
  type: 'patent' | 'application' | 'literature' | 'standard';
  
  // Legal analysis scores
  anticipationScore: number;
  obviousnessScore: number;
  enablementScore: number;
  validityScore: number;
  
  overallLegalRelevance: number;
  legalStrength: 'very_weak' | 'weak' | 'moderate' | 'strong' | 'very_strong';
  
  // Legal factors
  legalFactors: LegalFactor[];
  jurisdictionAnalysis: JurisdictionAnalysis[];
  
  // Case analysis
  priorArtType: 'primary' | 'secondary' | 'supporting';
  prosecutionHistory?: string;
  litigationHistory?: string;
  examinerComments?: string[];
  
  // Metadata
  analyzed: boolean;
  reviewStatus: 'pending' | 'reviewed' | 'approved' | 'rejected';
  reviewer?: string;
  reviewDate?: string;
  notes?: string;
}

interface LegalRelevanceScorerProps {
  projectId: string;
  projectType?: 'FTO' | 'NOVELTY' | 'INVALIDITY';
  evidence?: any[];
  onScoreUpdate?: (scores: any) => void;
}

export function LegalRelevanceScorer({ 
  projectId, 
  projectType = 'FTO',
  evidence = [], 
  onScoreUpdate 
}: LegalRelevanceScorerProps) {
  const [legalEvidence, setLegalEvidence] = useState<LegalEvidence[]>([]);
  const [selectedEvidence, setSelectedEvidence] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState('scoring');
  const [filterBy, setFilterBy] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('relevance');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  useEffect(() => {
    initializeMockData();
  }, []);

  const initializeMockData = () => {
    const mockLegalEvidence: LegalEvidence[] = [
      {
        id: 'le-1',
        title: 'Neural Network Architecture for Real-Time Processing',
        publicationNumber: 'US10,123,456',
        publicationDate: '2019-03-15',
        jurisdiction: 'US',
        type: 'patent',
        anticipationScore: 88,
        obviousnessScore: 85,
        enablementScore: 92,
        validityScore: 87,
        overallLegalRelevance: 88,
        legalStrength: 'very_strong',
        legalFactors: [
          {
            id: 'f1',
            name: 'Claim Element Coverage',
            category: 'anticipation',
            weight: 90,
            score: 95,
            confidence: 90,
            rationale: 'Patent discloses all claim elements with identical structure and function',
            supportingEvidence: ['Figure 3 shows identical neural network topology', 'Specification describes same training method'],
            concerns: ['Different implementation details in some embodiments'],
            impact: 'critical'
          },
          {
            id: 'f2',
            name: 'Same Inventive Concept',
            category: 'obviousness',
            weight: 85,
            score: 88,
            confidence: 85,
            rationale: 'Identical problem-solution approach with same technical effect',
            supportingEvidence: ['Background section identifies identical problem', 'Solution approach is fundamentally the same'],
            concerns: ['Slight differences in optimization parameters'],
            impact: 'high'
          },
          {
            id: 'f3',
            name: 'Technical Disclosure Quality',
            category: 'enablement',
            weight: 80,
            score: 92,
            confidence: 95,
            rationale: 'Comprehensive technical disclosure with working examples',
            supportingEvidence: ['Detailed implementation examples', 'Performance benchmarks provided'],
            concerns: [],
            impact: 'high'
          }
        ],
        jurisdictionAnalysis: [
          {
            jurisdiction: 'US',
            applicability: 95,
            legalStandard: 'Anticipation under 35 U.S.C. § 102',
            precedents: ['In re Paulsen', 'Titanium Metals Corp. v. Banner'],
            considerations: ['All elements present', 'Enablement requirement satisfied'],
            risks: ['Potential prosecution history estoppel issues'],
            recommendations: ['Strong anticipation rejection likely', 'Consider as primary reference']
          }
        ],
        priorArtType: 'primary',
        prosecutionHistory: 'Patent granted without significant amendments',
        examinerComments: ['Strong technical disclosure', 'Clear enablement'],
        analyzed: true,
        reviewStatus: 'approved',
        reviewer: 'Patent Attorney A',
        reviewDate: '2024-08-01'
      },
      {
        id: 'le-2',
        title: 'Machine Learning System with Adaptive Preprocessing',
        publicationNumber: 'EP3456789',
        publicationDate: '2018-11-22',
        jurisdiction: 'EP',
        type: 'patent',
        anticipationScore: 65,
        obviousnessScore: 78,
        enablementScore: 75,
        validityScore: 82,
        overallLegalRelevance: 75,
        legalStrength: 'strong',
        legalFactors: [
          {
            id: 'f4',
            name: 'Partial Element Coverage',
            category: 'anticipation',
            weight: 85,
            score: 65,
            confidence: 80,
            rationale: 'Covers most but not all claim elements; missing specific processing steps',
            supportingEvidence: ['Similar overall architecture', 'Comparable data processing approach'],
            concerns: ['Missing key limitation about real-time constraints'],
            impact: 'medium'
          },
          {
            id: 'f5',
            name: 'Motivation to Combine',
            category: 'obviousness',
            weight: 80,
            score: 82,
            confidence: 75,
            rationale: 'Strong motivation to combine with other art for obvious solution',
            supportingEvidence: ['Common problem in the field', 'Known benefits of combination'],
            concerns: ['Need secondary references for full coverage'],
            impact: 'high'
          }
        ],
        jurisdictionAnalysis: [
          {
            jurisdiction: 'EP',
            applicability: 85,
            legalStandard: 'Novelty under Article 54 EPC',
            precedents: ['T 0012/81', 'T 0198/84'],
            considerations: ['Partial anticipation possible', 'Strong obviousness case'],
            risks: ['Different legal standards than US'],
            recommendations: ['Use as secondary reference', 'Combine with other art']
          }
        ],
        priorArtType: 'secondary',
        analyzed: true,
        reviewStatus: 'reviewed',
        reviewer: 'Patent Attorney B',
        reviewDate: '2024-08-05'
      },
      {
        id: 'le-3',
        title: 'Deep Learning Survey Paper',
        publicationNumber: 'IEEE-ML-2020-456',
        publicationDate: '2020-06-18',
        jurisdiction: 'US',
        type: 'literature',
        anticipationScore: 25,
        obviousnessScore: 55,
        enablementScore: 40,
        validityScore: 65,
        overallLegalRelevance: 46,
        legalStrength: 'moderate',
        legalFactors: [
          {
            id: 'f6',
            name: 'General Teaching',
            category: 'obviousness',
            weight: 70,
            score: 60,
            confidence: 85,
            rationale: 'Provides general teaching about field but lacks specific implementation details',
            supportingEvidence: ['Surveys known techniques in the field', 'Identifies general approaches'],
            concerns: ['Lacks specific implementation guidance', 'Too general for anticipation'],
            impact: 'medium'
          }
        ],
        jurisdictionAnalysis: [
          {
            jurisdiction: 'US',
            applicability: 60,
            legalStandard: 'Prior art under 35 U.S.C. § 102(a)',
            precedents: ['In re Wertheim', 'In re Donohue'],
            considerations: ['Non-patent literature is prior art', 'General teaching vs specific disclosure'],
            risks: ['May not be enabling for anticipation'],
            recommendations: ['Use for background/context', 'Combine with technical references']
          }
        ],
        priorArtType: 'supporting',
        analyzed: true,
        reviewStatus: 'pending'
      }
    ];

    setLegalEvidence(mockLegalEvidence);
    setSelectedEvidence('le-1');
  };

  const getLegalStrengthColor = (strength: string) => {
    switch (strength) {
      case 'very_strong': return 'bg-green-100 text-green-800 border-green-200';
      case 'strong': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'weak': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'very_weak': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getLegalStrengthIcon = (strength: string) => {
    switch (strength) {
      case 'very_strong': return <Award className="h-4 w-4" />;
      case 'strong': return <CheckCircle className="h-4 w-4" />;
      case 'moderate': return <Scale className="h-4 w-4" />;
      case 'weak': return <AlertTriangle className="h-4 w-4" />;
      case 'very_weak': return <XCircle className="h-4 w-4" />;
      default: return <Scale className="h-4 w-4" />;
    }
  };

  const getFactorImpactColor = (impact: string) => {
    switch (impact) {
      case 'critical': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'anticipation': return <Target className="h-4 w-4" />;
      case 'obviousness': return <TrendingUp className="h-4 w-4" />;
      case 'enablement': return <BookOpen className="h-4 w-4" />;
      case 'validity': return <CheckCircle className="h-4 w-4" />;
      case 'infringement': return <Gavel className="h-4 w-4" />;
      default: return <Scale className="h-4 w-4" />;
    }
  };

  const getSortedEvidence = () => {
    let sorted = [...legalEvidence];
    
    switch (sortBy) {
      case 'relevance':
        sorted.sort((a, b) => b.overallLegalRelevance - a.overallLegalRelevance);
        break;
      case 'anticipation':
        sorted.sort((a, b) => b.anticipationScore - a.anticipationScore);
        break;
      case 'obviousness':
        sorted.sort((a, b) => b.obviousnessScore - a.obviousnessScore);
        break;
      case 'date':
        sorted.sort((a, b) => new Date(b.publicationDate).getTime() - new Date(a.publicationDate).getTime());
        break;
    }

    if (filterBy !== 'all') {
      if (filterBy === 'primary') {
        sorted = sorted.filter(e => e.priorArtType === 'primary');
      } else if (['very_strong', 'strong', 'moderate', 'weak', 'very_weak'].includes(filterBy)) {
        sorted = sorted.filter(e => e.legalStrength === filterBy);
      } else if (['reviewed', 'approved', 'pending', 'rejected'].includes(filterBy)) {
        sorted = sorted.filter(e => e.reviewStatus === filterBy);
      }
    }

    return sorted;
  };

  const runLegalAnalysis = async () => {
    setIsAnalyzing(true);
    
    setTimeout(() => {
      setLegalEvidence(prev => prev.map(evidence => ({ ...evidence, analyzed: true })));
      setIsAnalyzing(false);
      
      if (onScoreUpdate) {
        onScoreUpdate({
          totalEvidence: legalEvidence.length,
          strongEvidence: legalEvidence.filter(e => e.legalStrength === 'very_strong' || e.legalStrength === 'strong').length,
          averageRelevance: Math.round(legalEvidence.reduce((sum, e) => sum + e.overallLegalRelevance, 0) / legalEvidence.length)
        });
      }
    }, 3000);
  };

  const selectedEvidenceData = selectedEvidence ? legalEvidence.find(e => e.id === selectedEvidence) : null;

  const getAnalysisStats = () => {
    const analyzed = legalEvidence.filter(e => e.analyzed);
    const avgRelevance = analyzed.length > 0 ? analyzed.reduce((sum, e) => sum + e.overallLegalRelevance, 0) / analyzed.length : 0;
    const strongCount = analyzed.filter(e => e.legalStrength === 'very_strong' || e.legalStrength === 'strong').length;
    
    return {
      totalEvidence: legalEvidence.length,
      analyzedEvidence: analyzed.length,
      averageRelevance: Math.round(avgRelevance),
      strongEvidence: strongCount,
      pendingReview: legalEvidence.filter(e => e.reviewStatus === 'pending').length
    };
  };

  const stats = getAnalysisStats();

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 rounded-lg">
            <Scale className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Legal Relevance Scoring</h3>
            <p className="text-sm text-muted-foreground">
              Comprehensive legal analysis and scoring for {projectType} proceedings
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={runLegalAnalysis} disabled={isAnalyzing}>
            {isAnalyzing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Analyze All
              </>
            )}
          </Button>
          <Button variant="outline">
            <Save className="h-4 w-4 mr-2" />
            Save Analysis
          </Button>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Configure
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium">{stats.totalEvidence}</p>
                <p className="text-sm text-muted-foreground">Total Evidence</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium">{stats.analyzedEvidence}</p>
                <p className="text-sm text-muted-foreground">Analyzed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <div>
                <p className="font-medium">{stats.averageRelevance}%</p>
                <p className="text-sm text-muted-foreground">Avg Relevance</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-orange-600" />
              <div>
                <p className="font-medium">{stats.strongEvidence}</p>
                <p className="text-sm text-muted-foreground">Strong Evidence</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-red-600" />
              <div>
                <p className="font-medium">{stats.pendingReview}</p>
                <p className="text-sm text-muted-foreground">Pending Review</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="scoring">Legal Scoring</TabsTrigger>
          <TabsTrigger value="factors">Factor Analysis</TabsTrigger>
          <TabsTrigger value="jurisdiction">Jurisdiction Analysis</TabsTrigger>
          <TabsTrigger value="review">Review & Approval</TabsTrigger>
        </TabsList>

        <TabsContent value="scoring" className="flex-1 space-y-4">
          {/* Controls */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Legal Relevance</SelectItem>
                  <SelectItem value="anticipation">Anticipation Score</SelectItem>
                  <SelectItem value="obviousness">Obviousness Score</SelectItem>
                  <SelectItem value="date">Publication Date</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Select value={filterBy} onValueChange={setFilterBy}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Evidence</SelectItem>
                <SelectItem value="primary">Primary References</SelectItem>
                <SelectItem value="very_strong">Very Strong</SelectItem>
                <SelectItem value="strong">Strong</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="reviewed">Reviewed</SelectItem>
                <SelectItem value="pending">Pending Review</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              {showAdvancedFilters ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              Advanced Filters
            </Button>
          </div>

          {/* Evidence List with Legal Scores */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="space-y-4">
                {getSortedEvidence().map((evidence) => (
                  <Card 
                    key={evidence.id}
                    className={`cursor-pointer transition-all ${selectedEvidence === evidence.id ? 'ring-2 ring-indigo-200 shadow-md' : 'hover:shadow-md'}`}
                    onClick={() => setSelectedEvidence(evidence.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-3">
                            {getLegalStrengthIcon(evidence.legalStrength)}
                            <div>
                              <h4 className="font-medium">{evidence.title}</h4>
                              <p className="text-sm text-muted-foreground">
                                {evidence.publicationNumber} • {evidence.jurisdiction}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <Badge className={getLegalStrengthColor(evidence.legalStrength)}>
                              {evidence.legalStrength.replace('_', ' ')} ({evidence.overallLegalRelevance}%)
                            </Badge>
                            <Badge variant="secondary">
                              {evidence.priorArtType}
                            </Badge>
                            <Badge variant={evidence.reviewStatus === 'approved' ? 'default' : evidence.reviewStatus === 'rejected' ? 'destructive' : 'outline'}>
                              {evidence.reviewStatus}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          <p className="text-sm font-medium">
                            {evidence.legalFactors.length} Legal Factors
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(evidence.publicationDate).getFullYear()}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-4">
                        {/* Legal Score Breakdown */}
                        <div className="grid gap-3 md:grid-cols-4">
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span>Anticipation</span>
                              <span>{evidence.anticipationScore}%</span>
                            </div>
                            <Progress value={evidence.anticipationScore} className="h-1" />
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span>Obviousness</span>
                              <span>{evidence.obviousnessScore}%</span>
                            </div>
                            <Progress value={evidence.obviousnessScore} className="h-1" />
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span>Enablement</span>
                              <span>{evidence.enablementScore}%</span>
                            </div>
                            <Progress value={evidence.enablementScore} className="h-1" />
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span>Validity</span>
                              <span>{evidence.validityScore}%</span>
                            </div>
                            <Progress value={evidence.validityScore} className="h-1" />
                          </div>
                        </div>

                        {/* Key Legal Factors */}
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-2">Top Legal Factors:</p>
                          <div className="flex flex-wrap gap-2">
                            {evidence.legalFactors.slice(0, 3).map((factor) => (
                              <div key={factor.id} className="flex items-center gap-1">
                                {getCategoryIcon(factor.category)}
                                <Badge variant="outline" className={`text-xs ${getFactorImpactColor(factor.impact)}`}>
                                  {factor.name} ({factor.score}%)
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Reviewer Info */}
                        {evidence.reviewer && (
                          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                            <span>Reviewed by: {evidence.reviewer}</span>
                            <span>{evidence.reviewDate}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        </TabsContent>

        <TabsContent value="factors" className="flex-1">
          {selectedEvidenceData ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-medium">{selectedEvidenceData.title}</h4>
                <Badge className={getLegalStrengthColor(selectedEvidenceData.legalStrength)}>
                  {selectedEvidenceData.legalStrength.replace('_', ' ')}
                </Badge>
              </div>

              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {selectedEvidenceData.legalFactors.map((factor) => (
                    <Card key={factor.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(factor.category)}
                            <CardTitle className="text-base">{factor.name}</CardTitle>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={getFactorImpactColor(factor.impact)}>
                              {factor.impact} impact
                            </Badge>
                            <Badge variant="secondary">
                              {factor.category}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-3">
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Score:</span>
                              <span className="font-medium">{factor.score}%</span>
                            </div>
                            <Progress value={factor.score} className="h-2" />
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Weight:</span>
                              <span className="font-medium">{factor.weight}%</span>
                            </div>
                            <Progress value={factor.weight} className="h-2" />
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Confidence:</span>
                              <span className="font-medium">{factor.confidence}%</span>
                            </div>
                            <Progress value={factor.confidence} className="h-2" />
                          </div>
                        </div>

                        <div>
                          <p className="text-sm font-medium mb-2">Rationale:</p>
                          <p className="text-sm text-muted-foreground">{factor.rationale}</p>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <p className="text-sm font-medium mb-2">Supporting Evidence:</p>
                            <ul className="space-y-1">
                              {factor.supportingEvidence.map((evidence, index) => (
                                <li key={index} className="flex items-start gap-2 text-sm">
                                  <CheckCircle className="h-3 w-3 text-green-600 mt-1 flex-shrink-0" />
                                  {evidence}
                                </li>
                              ))}
                            </ul>
                          </div>
                          {factor.concerns.length > 0 && (
                            <div>
                              <p className="text-sm font-medium mb-2">Concerns:</p>
                              <ul className="space-y-1">
                                {factor.concerns.map((concern, index) => (
                                  <li key={index} className="flex items-start gap-2 text-sm">
                                    <AlertTriangle className="h-3 w-3 text-yellow-600 mt-1 flex-shrink-0" />
                                    {concern}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Select Evidence for Factor Analysis</h3>
                <p className="text-sm text-muted-foreground">
                  Choose an evidence item from the Legal Scoring tab to view detailed factor analysis
                </p>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="jurisdiction" className="flex-1">
          {selectedEvidenceData ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-medium">Jurisdiction Analysis - {selectedEvidenceData.title}</h4>
                <Badge variant="outline">{selectedEvidenceData.jurisdiction}</Badge>
              </div>

              <ScrollArea className="h-96">
                <div className="space-y-6">
                  {selectedEvidenceData.jurisdictionAnalysis.map((analysis, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            {analysis.jurisdiction}
                          </CardTitle>
                          <Badge variant="secondary">
                            {analysis.applicability}% Applicable
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <p className="text-sm font-medium mb-1">Legal Standard:</p>
                          <p className="text-sm text-muted-foreground">{analysis.legalStandard}</p>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <p className="text-sm font-medium mb-2">Key Precedents:</p>
                            <ul className="space-y-1">
                              {analysis.precedents.map((precedent, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-sm">
                                  <BookOpen className="h-3 w-3 text-blue-600 mt-1 flex-shrink-0" />
                                  {precedent}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="text-sm font-medium mb-2">Legal Considerations:</p>
                            <ul className="space-y-1">
                              {analysis.considerations.map((consideration, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-sm">
                                  <Scale className="h-3 w-3 text-purple-600 mt-1 flex-shrink-0" />
                                  {consideration}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <p className="text-sm font-medium mb-2">Risks:</p>
                            <ul className="space-y-1">
                              {analysis.risks.map((risk, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-sm">
                                  <AlertTriangle className="h-3 w-3 text-red-600 mt-1 flex-shrink-0" />
                                  {risk}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="text-sm font-medium mb-2">Recommendations:</p>
                            <ul className="space-y-1">
                              {analysis.recommendations.map((recommendation, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-sm">
                                  <CheckCircle className="h-3 w-3 text-green-600 mt-1 flex-shrink-0" />
                                  {recommendation}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Select Evidence for Jurisdiction Analysis</h3>
                <p className="text-sm text-muted-foreground">
                  Choose an evidence item to view jurisdiction-specific legal analysis
                </p>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="review" className="flex-1">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-medium">Review & Approval Status</h4>
              <div className="flex gap-2">
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export Review
                </Button>
                <Button>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve Selected
                </Button>
              </div>
            </div>

            <ScrollArea className="h-96">
              <div className="space-y-4">
                {legalEvidence.map((evidence) => (
                  <Card key={evidence.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base">{evidence.title}</CardTitle>
                          <CardDescription>{evidence.publicationNumber}</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={evidence.reviewStatus === 'approved' ? 'default' : 
                                   evidence.reviewStatus === 'rejected' ? 'destructive' : 'outline'}
                          >
                            {evidence.reviewStatus}
                          </Badge>
                          <Badge className={getLegalStrengthColor(evidence.legalStrength)}>
                            {evidence.overallLegalRelevance}%
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <p className="text-sm font-medium mb-2">Legal Scores:</p>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span>Anticipation:</span>
                              <span>{evidence.anticipationScore}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Obviousness:</span>
                              <span>{evidence.obviousnessScore}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Enablement:</span>
                              <span>{evidence.enablementScore}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Validity:</span>
                              <span>{evidence.validityScore}%</span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-2">Review Info:</p>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            {evidence.reviewer && (
                              <p>Reviewer: {evidence.reviewer}</p>
                            )}
                            {evidence.reviewDate && (
                              <p>Date: {evidence.reviewDate}</p>
                            )}
                            <p>Prior Art Type: {evidence.priorArtType}</p>
                            <p>Legal Factors: {evidence.legalFactors.length}</p>
                          </div>
                        </div>
                      </div>
                      {evidence.notes && (
                        <div className="mt-4">
                          <p className="text-sm font-medium mb-1">Review Notes:</p>
                          <p className="text-sm text-muted-foreground">{evidence.notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}