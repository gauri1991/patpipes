/**
 * Prior Art Report Template Component
 * Professional report generation system for prior art analysis
 */

'use client';

import { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Eye,
  Settings,
  Calendar,
  User,
  Building,
  Scale,
  Target,
  BarChart3,
  Clock,
  CheckCircle,
  AlertTriangle,
  Star,
  Printer,
  Share2,
  Save,
  Edit3,
  Plus,
  Minus,
  RefreshCw
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';

interface ReportSection {
  id: string;
  title: string;
  type: 'executive_summary' | 'technical_analysis' | 'legal_analysis' | 'search_strategy' | 'evidence_analysis' | 'conclusions' | 'appendix';
  content: any;
  included: boolean;
  order: number;
  customizable: boolean;
}

interface ReportMetadata {
  title: string;
  projectId: string;
  projectType: 'FTO' | 'NOVELTY' | 'INVALIDITY';
  author: string;
  organization: string;
  date: string;
  version: string;
  confidentiality: 'public' | 'confidential' | 'attorney_client';
  targetPatent?: {
    number: string;
    title: string;
    applicant: string;
    publicationDate: string;
  };
  searchScope: {
    databases: string[];
    timeRange: string;
    keywords: string[];
    classifications: string[];
  };
}

interface PriorArtReportTemplateProps {
  projectId: string;
  projectType?: 'FTO' | 'NOVELTY' | 'INVALIDITY';
  analysisData?: any;
  onReportGenerate?: (report: any) => void;
}

export function PriorArtReportTemplate({ 
  projectId, 
  projectType = 'FTO',
  analysisData,
  onReportGenerate 
}: PriorArtReportTemplateProps) {
  const [reportSections, setReportSections] = useState<ReportSection[]>([]);
  const [reportMetadata, setReportMetadata] = useState<ReportMetadata | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('comprehensive');
  const [previewMode, setPreviewMode] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [activeSection, setActiveSection] = useState<string>('metadata');

  useEffect(() => {
    initializeReportTemplate();
  }, [projectType]);

  const initializeReportTemplate = () => {
    // Initialize report metadata
    const metadata: ReportMetadata = {
      title: `${projectType} Analysis Report`,
      projectId,
      projectType,
      author: 'Patent Analyst',
      organization: 'Patent Analytics Platform',
      date: new Date().toLocaleDateString(),
      version: '1.0',
      confidentiality: 'confidential',
      targetPatent: projectType === 'INVALIDITY' ? {
        number: 'US10,987,654',
        title: 'Neural Network Architecture for Real-Time Processing',
        applicant: 'TechCorp Inc.',
        publicationDate: '2023-04-20'
      } : undefined,
      searchScope: {
        databases: ['USPTO', 'Google Patents', 'European Patent Office', 'WIPO'],
        timeRange: '2010-2024',
        keywords: ['neural network', 'machine learning', 'real-time processing'],
        classifications: ['G06N 3/02', 'G06N 3/08', 'G06F 17/16']
      }
    };

    setReportMetadata(metadata);

    // Initialize report sections based on project type
    const sections: ReportSection[] = [
      {
        id: 'executive_summary',
        title: 'Executive Summary',
        type: 'executive_summary',
        content: {
          overview: `This report presents the results of a comprehensive ${projectType.toLowerCase()} analysis conducted for patent evaluation purposes.`,
          keyFindings: [
            'Identified 25 relevant prior art references',
            'Found 3 highly relevant patents with strong anticipation potential',
            'Discovered significant clustering in the 2019-2021 timeframe',
            'Legal analysis indicates moderate to high invalidity risk'
          ],
          recommendations: [
            'Proceed with detailed claim-by-claim analysis of top 5 references',
            'Consider design-around strategies for identified risks',
            'Monitor ongoing patent applications in this space',
            'Engage patent counsel for formal legal opinion'
          ],
          riskAssessment: 'MODERATE',
          confidenceLevel: 85
        },
        included: true,
        order: 1,
        customizable: true
      },
      {
        id: 'technical_analysis',
        title: 'Technical Analysis',
        type: 'technical_analysis',
        content: {
          searchStrategy: 'Comprehensive multi-database search using semantic analysis',
          methodologyOverview: 'AI-powered prior art discovery with manual verification',
          keyTechnologies: ['Neural Networks', 'Machine Learning', 'Real-time Processing'],
          technicalScope: 'Focus on architectural similarities and processing methodologies',
          analysisMetrics: {
            totalReferences: 25,
            highRelevance: 8,
            mediumRelevance: 12,
            lowRelevance: 5
          }
        },
        included: true,
        order: 2,
        customizable: true
      },
      {
        id: 'legal_analysis',
        title: 'Legal Analysis',
        type: 'legal_analysis',
        content: {
          anticipationAnalysis: 'Strong anticipation found in 3 primary references',
          obviousnessAnalysis: 'Obviousness rejection likely based on combination of 2 references',
          enablementAssessment: 'Prior art provides sufficient enablement for skilled artisan',
          legalRisks: [
            'High anticipation risk from US10,123,456',
            'Obviousness concerns from EP3456789 + US9,876,543 combination',
            'Potential prosecution history estoppel limitations'
          ],
          strengthByFactor: {
            anticipation: 78,
            obviousness: 82,
            enablement: 85,
            validity: 75
          }
        },
        included: true,
        order: 3,
        customizable: true
      },
      {
        id: 'evidence_analysis',
        title: 'Evidence Analysis',
        type: 'evidence_analysis',
        content: {
          primaryReferences: [
            {
              id: 'US10,123,456',
              title: 'Machine Learning System with Adaptive Preprocessing',
              relevance: 92,
              strength: 'Very Strong',
              anticipationScore: 85,
              keyFeatures: ['Similar architecture', 'Identical processing method']
            },
            {
              id: 'EP3456789',
              title: 'Deep Learning Optimization Methods',
              relevance: 88,
              strength: 'Strong',
              anticipationScore: 70,
              keyFeatures: ['Overlapping optimization', 'Comparable results']
            }
          ],
          citationNetwork: {
            totalNodes: 25,
            clusters: 3,
            keyBridgePatents: 2,
            temporalSpread: '2018-2024'
          },
          strengthDistribution: {
            veryStrong: 3,
            strong: 5,
            moderate: 12,
            weak: 5
          }
        },
        included: true,
        order: 4,
        customizable: true
      },
      {
        id: 'conclusions',
        title: 'Conclusions & Recommendations',
        type: 'conclusions',
        content: {
          overallAssessment: `Based on the comprehensive analysis, this ${projectType.toLowerCase()} evaluation reveals significant prior art risks.`,
          keyConclusions: [
            'Multiple strong prior art references identified',
            'High probability of anticipation or obviousness rejection',
            'Patent landscape shows active development in this area',
            'Design-around opportunities exist but may be limited'
          ],
          actionItems: [
            'Conduct detailed claim-by-claim mapping',
            'Prepare response strategies for likely rejections',
            'Consider alternative patent strategies',
            'Monitor competitive patent filings'
          ],
          nextSteps: [
            'Engage patent counsel for formal opinion',
            'Prepare detailed technical comparison',
            'Consider filing continuation applications',
            'Develop IP strategy alternatives'
          ]
        },
        included: true,
        order: 5,
        customizable: true
      },
      {
        id: 'appendix',
        title: 'Appendix',
        type: 'appendix',
        content: {
          searchQuery: 'Detailed search queries and methodology',
          fullReferenceList: 'Complete list of all identified references',
          technicalDiagrams: 'Supporting technical analysis diagrams',
          legalDocuments: 'Relevant legal precedents and documentation'
        },
        included: true,
        order: 6,
        customizable: false
      }
    ];

    setReportSections(sections);
  };

  const getReportTemplates = () => [
    {
      id: 'comprehensive',
      name: 'Comprehensive Report',
      description: 'Full analysis with all sections',
      sections: reportSections.map(s => s.id)
    },
    {
      id: 'executive',
      name: 'Executive Summary',
      description: 'High-level overview for decision makers',
      sections: ['executive_summary', 'conclusions']
    },
    {
      id: 'technical',
      name: 'Technical Focus',
      description: 'Detailed technical and evidence analysis',
      sections: ['technical_analysis', 'evidence_analysis', 'appendix']
    },
    {
      id: 'legal',
      name: 'Legal Analysis',
      description: 'Legal risks and recommendations focus',
      sections: ['legal_analysis', 'conclusions']
    }
  ];

  const updateSectionInclusion = (sectionId: string, included: boolean) => {
    setReportSections(prev => 
      prev.map(section => 
        section.id === sectionId ? { ...section, included } : section
      )
    );
  };

  const reorderSections = (fromIndex: number, toIndex: number) => {
    setReportSections(prev => {
      const newSections = [...prev];
      const [movedSection] = newSections.splice(fromIndex, 1);
      newSections.splice(toIndex, 0, movedSection);
      return newSections.map((section, index) => ({ ...section, order: index + 1 }));
    });
  };

  const generateReport = async () => {
    setIsGenerating(true);
    
    // Simulate report generation
    setTimeout(() => {
      const report = {
        metadata: reportMetadata,
        sections: reportSections.filter(s => s.included).sort((a, b) => a.order - b.order),
        generatedAt: new Date().toISOString(),
        template: selectedTemplate,
        stats: {
          totalPages: reportSections.filter(s => s.included).length * 2 + 5,
          wordCount: reportSections.filter(s => s.included).length * 500 + 1200,
          figureCount: 8,
          tableCount: 4
        }
      };
      
      setIsGenerating(false);
      
      if (onReportGenerate) {
        onReportGenerate(report);
      }
    }, 3000);
  };

  const getReportStats = () => {
    const includedSections = reportSections.filter(s => s.included);
    return {
      totalSections: includedSections.length,
      estimatedPages: includedSections.length * 2 + 5,
      estimatedWords: includedSections.length * 500 + 1200,
      completeness: Math.round((includedSections.length / reportSections.length) * 100)
    };
  };

  const stats = getReportStats();

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-50 rounded-lg">
            <FileText className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Prior Art Report Generator</h3>
            <p className="text-sm text-muted-foreground">
              Create professional {projectType} analysis reports
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setPreviewMode(!previewMode)}
          >
            <Eye className="h-4 w-4 mr-2" />
            {previewMode ? 'Edit' : 'Preview'}
          </Button>
          <Button 
            onClick={generateReport}
            disabled={isGenerating}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Generate Report
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Report Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium">{stats.totalSections}</p>
                <p className="text-sm text-muted-foreground">Sections</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium">~{stats.estimatedPages}</p>
                <p className="text-sm text-muted-foreground">Pages</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Edit3 className="h-5 w-5 text-purple-600" />
              <div>
                <p className="font-medium">~{stats.estimatedWords.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Words</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-orange-600" />
              <div>
                <p className="font-medium">{stats.completeness}%</p>
                <p className="text-sm text-muted-foreground">Complete</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeSection} onValueChange={setActiveSection} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="metadata">Report Setup</TabsTrigger>
          <TabsTrigger value="sections">Sections</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="metadata" className="flex-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Report Metadata</CardTitle>
              <CardDescription>Basic report information and settings</CardDescription>
            </CardHeader>
            <CardContent>
              {reportMetadata && (
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Report Title</label>
                      <p className="text-sm text-muted-foreground mt-1">{reportMetadata.title}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Project Type</label>
                      <p className="text-sm text-muted-foreground mt-1">{reportMetadata.projectType}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Author</label>
                      <p className="text-sm text-muted-foreground mt-1">{reportMetadata.author}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Organization</label>
                      <p className="text-sm text-muted-foreground mt-1">{reportMetadata.organization}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Date</label>
                      <p className="text-sm text-muted-foreground mt-1">{reportMetadata.date}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Version</label>
                      <p className="text-sm text-muted-foreground mt-1">{reportMetadata.version}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Confidentiality</label>
                      <Badge variant="outline" className="mt-1">
                        {reportMetadata.confidentiality}
                      </Badge>
                    </div>
                    {reportMetadata.targetPatent && (
                      <div>
                        <label className="text-sm font-medium">Target Patent</label>
                        <p className="text-sm text-muted-foreground mt-1">
                          {reportMetadata.targetPatent.number} - {reportMetadata.targetPatent.title}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Search Scope</CardTitle>
              <CardDescription>Analysis parameters and search coverage</CardDescription>
            </CardHeader>
            <CardContent>
              {reportMetadata && (
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Databases Searched</label>
                    <div className="flex flex-wrap gap-2">
                      {reportMetadata.searchScope.databases.map((db, index) => (
                        <Badge key={index} variant="secondary">
                          {db}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Time Range</label>
                    <p className="text-sm text-muted-foreground">{reportMetadata.searchScope.timeRange}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Key Search Terms</label>
                    <div className="flex flex-wrap gap-1">
                      {reportMetadata.searchScope.keywords.map((keyword, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Classifications</label>
                    <div className="flex flex-wrap gap-1">
                      {reportMetadata.searchScope.classifications.map((classification, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {classification}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sections" className="flex-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Report Sections</CardTitle>
              <CardDescription>Configure which sections to include in the report</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {reportSections.map((section, index) => (
                    <div 
                      key={section.id} 
                      className={`p-4 border rounded-lg ${section.included ? 'border-blue-200 bg-blue-50' : 'border-muted'}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={section.included}
                            onChange={(e) => updateSectionInclusion(section.id, e.target.checked)}
                            className="rounded"
                          />
                          <div>
                            <h4 className="font-medium">{section.title}</h4>
                            <p className="text-sm text-muted-foreground">Order: {section.order}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {section.type.replace('_', ' ')}
                          </Badge>
                          {section.customizable && (
                            <Badge variant="secondary" className="text-xs">
                              Customizable
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {section.included && (
                        <div className="text-sm text-muted-foreground">
                          {section.type === 'executive_summary' && (
                            <p>High-level overview with key findings and recommendations</p>
                          )}
                          {section.type === 'technical_analysis' && (
                            <p>Detailed technical methodology and search strategy analysis</p>
                          )}
                          {section.type === 'legal_analysis' && (
                            <p>Legal implications, risks, and strength assessment</p>
                          )}
                          {section.type === 'evidence_analysis' && (
                            <p>Analysis of prior art evidence and citation networks</p>
                          )}
                          {section.type === 'conclusions' && (
                            <p>Final conclusions, recommendations, and action items</p>
                          )}
                          {section.type === 'appendix' && (
                            <p>Supporting documentation and detailed reference lists</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="flex-1">
          <div className="grid gap-4">
            {getReportTemplates().map((template) => (
              <Card 
                key={template.id}
                className={`cursor-pointer transition-all ${selectedTemplate === template.id ? 'ring-2 ring-blue-200 bg-blue-50' : 'hover:shadow-md'}`}
                onClick={() => setSelectedTemplate(template.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{template.name}</CardTitle>
                    <Badge variant={selectedTemplate === template.id ? 'default' : 'outline'}>
                      {template.sections.length} sections
                    </Badge>
                  </div>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {template.sections.map((sectionId) => {
                      const section = reportSections.find(s => s.id === sectionId);
                      return section ? (
                        <Badge key={sectionId} variant="secondary" className="text-xs">
                          {section.title}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="preview" className="flex-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Report Preview</CardTitle>
              <CardDescription>Preview of generated report structure</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center p-8 border-2 border-dashed border-muted rounded-lg">
                  <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h4 className="text-lg font-medium mb-2">
                    {reportMetadata?.title}
                  </h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    {reportMetadata?.author} • {reportMetadata?.organization}
                  </p>
                  <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                    <span>{stats.totalSections} sections</span>
                    <span>~{stats.estimatedPages} pages</span>
                    <span>~{stats.estimatedWords.toLocaleString()} words</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Report Structure:</h4>
                  {reportSections
                    .filter(s => s.included)
                    .sort((a, b) => a.order - b.order)
                    .map((section, index) => (
                      <div key={section.id} className="flex items-center gap-3 p-2 border rounded">
                        <span className="text-sm font-medium text-muted-foreground w-8">
                          {index + 1}.
                        </span>
                        <span className="flex-1">{section.title}</span>
                        <Badge variant="outline" className="text-xs">
                          {section.type.replace('_', ' ')}
                        </Badge>
                      </div>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}