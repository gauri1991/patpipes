/**
 * Evidence Strength Analyzer Component
 * Advanced tool for analyzing and scoring the strength of prior art evidence
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Shield,
  TrendingUp,
  TrendingDown,
  Target,
  Scale,
  AlertTriangle,
  CheckCircle,
  Star,
  Eye,
  FileText,
  Calendar,
  Globe,
  Award,
  BarChart3,
  Filter,
  Download,
  Save,
  RefreshCw
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

interface EvidenceItem {
  id: string;
  title: string;
  publicationNumber: string;
  publicationDate: string;
  applicant: string;
  jurisdiction: string;
  type: 'patent' | 'application' | 'literature' | 'standard';
  
  // Strength scoring factors
  claimCoverage: number; // 0-100
  technicalRelevance: number; // 0-100
  legalRelevance: number; // 0-100
  dateRelevance: number; // 0-100
  credibilityScore: number; // 0-100
  
  overallStrength: number; // 0-100
  strengthCategory: 'weak' | 'moderate' | 'strong' | 'very_strong';
  
  // Analysis details
  coveredClaims: string[];
  keyFeatures: string[];
  similarities: string[];
  differences: string[];
  legalConsiderations: string[];
  
  // Metadata
  citationCount: number;
  familySize: number;
  inventorCount: number;
  
  analyzed: boolean;
  selected: boolean;
  notes?: string;
}

interface EvidenceStrengthAnalyzerProps {
  projectId: string;
  searchResults?: any[];
  onAnalysisUpdate?: (analysis: any) => void;
}

export function EvidenceStrengthAnalyzer({ 
  projectId, 
  searchResults = [], 
  onAnalysisUpdate 
}: EvidenceStrengthAnalyzerProps) {
  const [evidenceItems, setEvidenceItems] = useState<EvidenceItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [sortBy, setSortBy] = useState<string>('strength');
  const [filterBy, setFilterBy] = useState<string>('all');

  useEffect(() => {
    initializeMockData();
  }, []);

  const initializeMockData = () => {
    // Generate mock evidence items with strength analysis
    const mockEvidence: EvidenceItem[] = [
      {
        id: 'ev-1',
        title: 'Neural Network Architecture for Real-Time Processing',
        publicationNumber: 'US10,123,456',
        publicationDate: '2019-03-15',
        applicant: 'TechCorp Inc.',
        jurisdiction: 'US',
        type: 'patent',
        claimCoverage: 85,
        technicalRelevance: 92,
        legalRelevance: 88,
        dateRelevance: 75,
        credibilityScore: 90,
        overallStrength: 86,
        strengthCategory: 'very_strong',
        coveredClaims: ['Claim 1', 'Claim 3', 'Claim 5'],
        keyFeatures: ['neural architecture', 'real-time processing', 'optimization algorithm'],
        similarities: ['Same neural network topology', 'Identical processing approach'],
        differences: ['Different training method', 'Alternative data structure'],
        legalConsiderations: ['Strong claim coverage', 'Clear anticipation', 'Same inventor field'],
        citationCount: 45,
        familySize: 8,
        inventorCount: 3,
        analyzed: true,
        selected: true
      },
      {
        id: 'ev-2',
        title: 'Machine Learning System with Adaptive Preprocessing',
        publicationNumber: 'EP3456789',
        publicationDate: '2018-11-22',
        applicant: 'European AI Ltd.',
        jurisdiction: 'EP',
        type: 'patent',
        claimCoverage: 72,
        technicalRelevance: 78,
        legalRelevance: 82,
        dateRelevance: 85,
        credibilityScore: 75,
        overallStrength: 78,
        strengthCategory: 'strong',
        coveredClaims: ['Claim 1', 'Claim 2'],
        keyFeatures: ['machine learning', 'adaptive preprocessing', 'data optimization'],
        similarities: ['Similar ML approach', 'Comparable preprocessing'],
        differences: ['Different optimization target', 'Alternative architecture'],
        legalConsiderations: ['Good claim coverage', 'Potential anticipation'],
        citationCount: 28,
        familySize: 5,
        inventorCount: 2,
        analyzed: true,
        selected: false
      },
      {
        id: 'ev-3',
        title: 'Deep Learning Architectures in Computer Vision',
        publicationNumber: 'WO2020/123456',
        publicationDate: '2020-06-18',
        applicant: 'Vision Systems Corp.',
        jurisdiction: 'WO',
        type: 'application',
        claimCoverage: 45,
        technicalRelevance: 65,
        legalRelevance: 55,
        dateRelevance: 60,
        credibilityScore: 70,
        overallStrength: 59,
        strengthCategory: 'moderate',
        coveredClaims: ['Claim 4'],
        keyFeatures: ['deep learning', 'computer vision', 'feature extraction'],
        similarities: ['Related technical field', 'Some overlapping concepts'],
        differences: ['Different application domain', 'Distinct implementation'],
        legalConsiderations: ['Limited claim coverage', 'Different scope'],
        citationCount: 12,
        familySize: 3,
        inventorCount: 4,
        analyzed: true,
        selected: false
      }
    ];

    setEvidenceItems(mockEvidence);
    setSelectedItems(new Set(['ev-1']));
  };

  const getStrengthColor = (strength: number) => {
    if (strength >= 80) return 'text-green-600 bg-green-50';
    if (strength >= 60) return 'text-blue-600 bg-blue-50';
    if (strength >= 40) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getStrengthIcon = (category: string) => {
    switch (category) {
      case 'very_strong': return <Award className="h-4 w-4 text-green-600" />;
      case 'strong': return <TrendingUp className="h-4 w-4 text-blue-600" />;
      case 'moderate': return <Scale className="h-4 w-4 text-yellow-600" />;
      case 'weak': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Scale className="h-4 w-4 text-gray-600" />;
    }
  };

  const getSortedEvidence = () => {
    let sorted = [...evidenceItems];
    
    switch (sortBy) {
      case 'strength':
        sorted.sort((a, b) => b.overallStrength - a.overallStrength);
        break;
      case 'date':
        sorted.sort((a, b) => new Date(b.publicationDate).getTime() - new Date(a.publicationDate).getTime());
        break;
      case 'relevance':
        sorted.sort((a, b) => b.technicalRelevance - a.technicalRelevance);
        break;
      case 'coverage':
        sorted.sort((a, b) => b.claimCoverage - a.claimCoverage);
        break;
    }

    if (filterBy !== 'all') {
      if (filterBy === 'selected') {
        sorted = sorted.filter(item => selectedItems.has(item.id));
      } else {
        sorted = sorted.filter(item => item.strengthCategory === filterBy);
      }
    }

    return sorted;
  };

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const analyzeAllEvidence = async () => {
    setIsAnalyzing(true);
    
    // Simulate analysis
    setTimeout(() => {
      setEvidenceItems(prev => prev.map(item => ({ ...item, analyzed: true })));
      setIsAnalyzing(false);
      
      if (onAnalysisUpdate) {
        onAnalysisUpdate({
          totalItems: evidenceItems.length,
          analyzedItems: evidenceItems.length,
          strongEvidence: evidenceItems.filter(e => e.strengthCategory === 'very_strong' || e.strengthCategory === 'strong').length,
          selectedItems: Array.from(selectedItems)
        });
      }
    }, 2000);
  };

  const getOverallStats = () => {
    const analyzed = evidenceItems.filter(e => e.analyzed);
    const avgStrength = analyzed.length > 0 ? analyzed.reduce((sum, e) => sum + e.overallStrength, 0) / analyzed.length : 0;
    const strongCount = analyzed.filter(e => e.strengthCategory === 'very_strong' || e.strengthCategory === 'strong').length;
    
    return {
      totalEvidence: evidenceItems.length,
      analyzedEvidence: analyzed.length,
      averageStrength: Math.round(avgStrength),
      strongEvidence: strongCount,
      selectedEvidence: selectedItems.size
    };
  };

  const stats = getOverallStats();

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-50 rounded-lg">
            <Shield className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Evidence Strength Analysis</h3>
            <p className="text-sm text-muted-foreground">
              Analyze and score the strength of prior art evidence for legal proceedings
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={analyzeAllEvidence} disabled={isAnalyzing}>
            {isAnalyzing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <BarChart3 className="h-4 w-4 mr-2" />
                Re-analyze All
              </>
            )}
          </Button>
          <Button variant="outline">
            <Save className="h-4 w-4 mr-2" />
            Save Analysis
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
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
                <p className="font-medium">{stats.averageStrength}%</p>
                <p className="text-sm text-muted-foreground">Avg Strength</p>
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
              <Target className="h-5 w-5 text-red-600" />
              <div>
                <p className="font-medium">{stats.selectedEvidence}</p>
                <p className="text-sm text-muted-foreground">Selected</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="overview">Evidence Overview</TabsTrigger>
          <TabsTrigger value="detailed">Detailed Analysis</TabsTrigger>
          <TabsTrigger value="comparison">Strength Comparison</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="flex-1 space-y-4">
          {/* Controls */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="strength">Overall Strength</SelectItem>
                  <SelectItem value="date">Publication Date</SelectItem>
                  <SelectItem value="relevance">Technical Relevance</SelectItem>
                  <SelectItem value="coverage">Claim Coverage</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Select value={filterBy} onValueChange={setFilterBy}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Evidence</SelectItem>
                <SelectItem value="selected">Selected Only</SelectItem>
                <SelectItem value="very_strong">Very Strong</SelectItem>
                <SelectItem value="strong">Strong</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="weak">Weak</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Evidence List */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="space-y-4">
                {getSortedEvidence().map((evidence) => (
                  <Card 
                    key={evidence.id} 
                    className={`cursor-pointer transition-all ${selectedItems.has(evidence.id) ? 'ring-2 ring-purple-200 shadow-md' : 'hover:shadow-md'}`}
                    onClick={() => toggleItemSelection(evidence.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-3">
                            {getStrengthIcon(evidence.strengthCategory)}
                            <div>
                              <h4 className="font-medium">{evidence.title}</h4>
                              <p className="text-sm text-muted-foreground">
                                {evidence.publicationNumber} • {evidence.applicant}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <Badge variant="outline" className={getStrengthColor(evidence.overallStrength)}>
                              {evidence.overallStrength}% Strength
                            </Badge>
                            <Badge variant="secondary">
                              {evidence.jurisdiction}
                            </Badge>
                            <Badge variant="outline">
                              {evidence.type}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          <p className="text-sm font-medium">
                            {evidence.coveredClaims.length} Claims Covered
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(evidence.publicationDate).getFullYear()}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-4">
                        {/* Strength Breakdown */}
                        <div className="grid gap-3 md:grid-cols-5">
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span>Claim Coverage</span>
                              <span>{evidence.claimCoverage}%</span>
                            </div>
                            <Progress value={evidence.claimCoverage} className="h-1" />
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span>Technical</span>
                              <span>{evidence.technicalRelevance}%</span>
                            </div>
                            <Progress value={evidence.technicalRelevance} className="h-1" />
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span>Legal</span>
                              <span>{evidence.legalRelevance}%</span>
                            </div>
                            <Progress value={evidence.legalRelevance} className="h-1" />
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span>Date</span>
                              <span>{evidence.dateRelevance}%</span>
                            </div>
                            <Progress value={evidence.dateRelevance} className="h-1" />
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span>Credibility</span>
                              <span>{evidence.credibilityScore}%</span>
                            </div>
                            <Progress value={evidence.credibilityScore} className="h-1" />
                          </div>
                        </div>

                        {/* Key Features */}
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-2">Key Features:</p>
                          <div className="flex flex-wrap gap-1">
                            {evidence.keyFeatures.map((feature, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {feature}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Metadata */}
                        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                          <span>Citations: {evidence.citationCount}</span>
                          <span>Family Size: {evidence.familySize}</span>
                          <span>Inventors: {evidence.inventorCount}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        </TabsContent>

        <TabsContent value="detailed" className="flex-1">
          {selectedItems.size === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Select Evidence for Detailed Analysis</h3>
                <p className="text-sm text-muted-foreground">
                  Click on evidence items in the Overview tab to view detailed analysis
                </p>
              </div>
            </div>
          ) : (
            <ScrollArea className="h-full">
              <div className="space-y-6">
                {Array.from(selectedItems).map(itemId => {
                  const evidence = evidenceItems.find(e => e.id === itemId);
                  if (!evidence) return null;

                  return (
                    <Card key={itemId}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{evidence.title}</CardTitle>
                          <Badge className={getStrengthColor(evidence.overallStrength)}>
                            {evidence.strengthCategory.replace('_', ' ')} ({evidence.overallStrength}%)
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid gap-6 md:grid-cols-2">
                          <div>
                            <h4 className="font-medium mb-3">Similarities</h4>
                            <ul className="space-y-2">
                              {evidence.similarities.map((similarity, index) => (
                                <li key={index} className="flex items-start gap-2 text-sm">
                                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                  {similarity}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h4 className="font-medium mb-3">Differences</h4>
                            <ul className="space-y-2">
                              {evidence.differences.map((difference, index) => (
                                <li key={index} className="flex items-start gap-2 text-sm">
                                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                                  {difference}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium mb-3">Legal Considerations</h4>
                          <ul className="space-y-2">
                            {evidence.legalConsiderations.map((consideration, index) => (
                              <li key={index} className="flex items-start gap-2 text-sm">
                                <Scale className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                {consideration}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h4 className="font-medium mb-3">Covered Claims</h4>
                          <div className="flex flex-wrap gap-2">
                            {evidence.coveredClaims.map((claim, index) => (
                              <Badge key={index} variant="secondary">
                                {claim}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        <TabsContent value="comparison" className="flex-1">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Strength Distribution</CardTitle>
                <CardDescription>
                  Distribution of evidence strength across all analyzed items
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['very_strong', 'strong', 'moderate', 'weak'].map(category => {
                    const count = evidenceItems.filter(e => e.strengthCategory === category).length;
                    const percentage = evidenceItems.length > 0 ? (count / evidenceItems.length) * 100 : 0;
                    
                    return (
                      <div key={category} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="capitalize">{category.replace('_', ' ')}</span>
                          <span>{count} items ({Math.round(percentage)}%)</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Top Evidence by Strength</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {evidenceItems
                      .sort((a, b) => b.overallStrength - a.overallStrength)
                      .slice(0, 5)
                      .map(evidence => (
                        <div key={evidence.id} className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium truncate">{evidence.title}</p>
                            <p className="text-xs text-muted-foreground">{evidence.publicationNumber}</p>
                          </div>
                          <Badge className={getStrengthColor(evidence.overallStrength)}>
                            {evidence.overallStrength}%
                          </Badge>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Analysis Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>{stats.strongEvidence}</strong> items show strong evidence potential
                      </AlertDescription>
                    </Alert>
                    <Alert>
                      <Target className="h-4 w-4" />
                      <AlertDescription>
                        Average strength score is <strong>{stats.averageStrength}%</strong> across all evidence
                      </AlertDescription>
                    </Alert>
                    <Alert>
                      <Star className="h-4 w-4" />
                      <AlertDescription>
                        <strong>{stats.selectedEvidence}</strong> items selected for detailed review
                      </AlertDescription>
                    </Alert>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}