'use client';

import { useState, useEffect } from 'react';
import { useBrainstorming } from '@/hooks/useBrainstorming';
import {
  CheckCircle,
  Download,
  Share,
  FileText,
  Mail,
  Copy,
  Calendar,
  User,
  Tag,
  Search,
  Target,
  Users,
  ArrowRight,
  AlertTriangle,
  Info,
  Zap,
  Globe
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ValidationItem {
  id: string;
  category: 'keywords' | 'classifications' | 'strategy' | 'competitors' | 'general';
  title: string;
  status: 'complete' | 'incomplete' | 'warning';
  description: string;
  recommendation?: string;
}

interface ExportData {
  keywords: {
    groups: Array<{ name: string; keywords: string[] }>;
    totalCount: number;
  };
  classifications: {
    selected: string[];
    totalCount: number;
  };
  strategies: {
    active: number;
    completed: number;
  };
  competitors: {
    tracked: number;
    highThreat: number;
  };
  brainstormSession: {
    ideas: number;
    concepts: number;
    duration: string;
  };
}

interface ReviewExportTabProps {
  projectId: string;
  sessionId: string | null;
}

export function ReviewExportTab({ projectId, sessionId }: ReviewExportTabProps) {
  const {
    currentSession,
    ideas,
    keywords,
    concepts,
    strategies,
    competitors,
    aiInteractions,
    analytics,
    loadAnalytics,
    loading,
    error
  } = useBrainstorming(projectId);
  const [validationItems] = useState<ValidationItem[]>([
    {
      id: '1',
      category: 'keywords',
      title: 'Keyword Coverage',
      status: 'complete',
      description: '45 keywords across 5 groups',
      recommendation: 'Good coverage of core technology terms'
    },
    {
      id: '2',
      category: 'classifications',
      title: 'Patent Classifications',
      status: 'incomplete',
      description: 'Only 3 IPC classes selected',
      recommendation: 'Consider adding CPC classifications for broader coverage'
    },
    {
      id: '3',
      category: 'strategy',
      title: 'Search Strategy',
      status: 'warning',
      description: 'FTO strategy created but not validated',
      recommendation: 'Run test searches to validate strategy effectiveness'
    },
    {
      id: '4',
      category: 'competitors',
      title: 'Competitor Analysis',
      status: 'complete',
      description: '8 competitors identified with threat assessment',
      recommendation: 'Comprehensive competitor landscape covered'
    },
    {
      id: '5',
      category: 'general',
      title: 'Geographic Coverage',
      status: 'warning',
      description: 'Focus primarily on US and EP',
      recommendation: 'Consider adding Asian jurisdictions (JP, CN, KR)'
    }
  ]);

  // Dynamic export data from API
  const exportData: ExportData = {
    keywords: {
      groups: [
        { 
          name: 'Generated Keywords', 
          keywords: keywords?.map(kw => kw.keyword) || [] 
        }
      ],
      totalCount: keywords?.length || 0
    },
    classifications: {
      selected: [], // Would be populated from selected classifications
      totalCount: 0
    },
    strategies: {
      active: strategies?.filter(s => s.status === 'active').length || 0,
      completed: strategies?.filter(s => s.status === 'completed').length || 0
    },
    competitors: {
      tracked: competitors?.length || 0,
      highThreat: competitors?.filter(c => c.threat_level >= 4).length || 0
    },
    brainstormSession: {
      ideas: ideas?.length || 0,
      concepts: concepts?.length || 0,
      duration: currentSession ? 
        `${Math.floor((new Date().getTime() - new Date(currentSession.started_at).getTime()) / (1000 * 60 * 60))}h ${Math.floor(((new Date().getTime() - new Date(currentSession.started_at).getTime()) % (1000 * 60 * 60)) / (1000 * 60))}m` : 
        '0h 0m'
    }
  };

  const [selectedExportFormat, setSelectedExportFormat] = useState('comprehensive');
  const [exportSections, setExportSections] = useState<Set<string>>(new Set([
    'summary', 'keywords', 'classifications', 'strategies', 'competitors'
  ]));

  const getValidationProgress = () => {
    const completeItems = validationItems.filter(item => item.status === 'complete').length;
    return Math.round((completeItems / validationItems.length) * 100);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'incomplete':
        return <Info className="h-4 w-4 text-blue-600" />;
      default:
        return <Info className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete': return 'border-green-200 bg-green-50';
      case 'warning': return 'border-yellow-200 bg-yellow-50';
      case 'incomplete': return 'border-blue-200 bg-blue-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const handleExportSection = (section: string, checked: boolean) => {
    const newSections = new Set(exportSections);
    if (checked) {
      newSections.add(section);
    } else {
      newSections.delete(section);
    }
    setExportSections(newSections);
  };

  const handleExport = (format: string) => {
    console.log(`Exporting in ${format} format with sections:`, Array.from(exportSections));
    // Export logic would go here
  };

  const handleShareWithTeam = () => {
    console.log('Sharing with team...');
    // Share logic would go here
  };

  const handleProceedToSearch = () => {
    console.log('Proceeding to search with validated data...');
    // Navigation logic would go here
  };

  // Load analytics when component mounts
  useEffect(() => {
    if (currentSession) {
      loadAnalytics();
    }
  }, [currentSession, loadAnalytics]);

  if (!sessionId) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Active Session</h3>
          <p className="text-muted-foreground">
            Please select or create a brainstorming session to review and export your work.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <p className="text-red-800 text-sm">Error loading session data: {error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="validation" className="space-y-4">
        <TabsList>
          <TabsTrigger value="validation">Validation Checklist</TabsTrigger>
          <TabsTrigger value="summary">Session Summary</TabsTrigger>
          <TabsTrigger value="export">Export Options</TabsTrigger>
          <TabsTrigger value="share">Share & Collaborate</TabsTrigger>
        </TabsList>

        <TabsContent value="validation" className="space-y-4">
          {/* Validation Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Validation Progress
              </CardTitle>
              <CardDescription>
                Review your brainstorming session completeness before proceeding
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Overall Progress</span>
                <span className="text-sm">{getValidationProgress()}% Complete</span>
              </div>
              <Progress value={getValidationProgress()} />
            </CardContent>
          </Card>

          {/* Validation Items */}
          <div className="space-y-3">
            {validationItems.map((item) => (
              <Card key={item.id} className={`border ${getStatusColor(item.status)}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {getStatusIcon(item.status)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{item.title}</h4>
                        <Badge variant="outline" className="capitalize text-xs">
                          {item.category}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {item.description}
                      </p>
                      {item.recommendation && (
                        <p className="text-sm text-blue-700 bg-blue-50 p-2 rounded">
                          💡 {item.recommendation}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Action Buttons */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {validationItems.filter(item => item.status === 'incomplete').length > 0 ? (
                    <span className="text-orange-600">
                      ⚠️ Address incomplete items before proceeding
                    </span>
                  ) : (
                    <span className="text-green-600">
                      ✅ Ready to proceed to search phase
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline">
                    Save Progress
                  </Button>
                  <Button 
                    onClick={handleProceedToSearch}
                    disabled={validationItems.filter(item => item.status === 'incomplete').length > 0}
                  >
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Proceed to Search
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary" className="space-y-4">
          {/* Session Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{exportData.brainstormSession.ideas}</div>
                <div className="text-sm text-muted-foreground">Ideas Captured</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{exportData.keywords.totalCount}</div>
                <div className="text-sm text-muted-foreground">Keywords Generated</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{exportData.classifications.totalCount}</div>
                <div className="text-sm text-muted-foreground">Classifications</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">{exportData.competitors.tracked}</div>
                <div className="text-sm text-muted-foreground">Competitors</div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Session Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Keywords Summary */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="h-4 w-4 text-blue-600" />
                  <Label className="font-medium">Keywords ({exportData.keywords.totalCount})</Label>
                </div>
                <div className="space-y-2">
                  {exportData.keywords.groups.map((group, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <span className="font-medium">{group.name}</span>
                      <Badge variant="secondary">{group.keywords.length} terms</Badge>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Classifications Summary */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="h-4 w-4 text-green-600" />
                  <Label className="font-medium">Classifications ({exportData.classifications.totalCount})</Label>
                </div>
                <div className="flex flex-wrap gap-2">
                  {exportData.classifications.selected.map((classification, idx) => (
                    <Badge key={idx} variant="outline" className="font-mono">
                      {classification}
                    </Badge>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Competitors Summary */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Users className="h-4 w-4 text-purple-600" />
                  <Label className="font-medium">Competitive Intelligence</Label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-muted/50 rounded">
                    <div className="text-lg font-bold">{exportData.competitors.tracked}</div>
                    <div className="text-sm text-muted-foreground">Companies Tracked</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded">
                    <div className="text-lg font-bold text-red-600">{exportData.competitors.highThreat}</div>
                    <div className="text-sm text-muted-foreground">High Threat Level</div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Session Stats */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="h-4 w-4 text-orange-600" />
                  <Label className="font-medium">Session Statistics</Label>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Duration:</span>
                    <div className="font-medium">{exportData.brainstormSession.duration}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Created:</span>
                    <div className="font-medium">{new Date().toLocaleDateString()}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <div className="font-medium text-green-600">Complete</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="space-y-4">
          {/* Export Format Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Export Format</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div 
                  className={`p-4 border rounded-lg cursor-pointer ${
                    selectedExportFormat === 'comprehensive' ? 'border-blue-500 bg-blue-50' : ''
                  }`}
                  onClick={() => setSelectedExportFormat('comprehensive')}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4" />
                    <span className="font-medium">Comprehensive Report</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Complete PDF report with all sections and analysis
                  </p>
                </div>
                <div 
                  className={`p-4 border rounded-lg cursor-pointer ${
                    selectedExportFormat === 'excel' ? 'border-blue-500 bg-blue-50' : ''
                  }`}
                  onClick={() => setSelectedExportFormat('excel')}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Download className="h-4 w-4" />
                    <span className="font-medium">Excel Workbook</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Structured data in Excel format for further analysis
                  </p>
                </div>
                <div 
                  className={`p-4 border rounded-lg cursor-pointer ${
                    selectedExportFormat === 'search_ready' ? 'border-blue-500 bg-blue-50' : ''
                  }`}
                  onClick={() => setSelectedExportFormat('search_ready')}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Search className="h-4 w-4" />
                    <span className="font-medium">Search-Ready Format</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Optimized for direct import into search tools
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Export Sections */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Select Sections to Export</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { id: 'summary', label: 'Executive Summary', description: 'High-level overview and key findings' },
                  { id: 'keywords', label: 'Keyword Analysis', description: 'Complete keyword lists and groupings' },
                  { id: 'classifications', label: 'Patent Classifications', description: 'Selected IPC/CPC classifications' },
                  { id: 'strategies', label: 'Search Strategies', description: 'Developed research strategies' },
                  { id: 'competitors', label: 'Competitive Intelligence', description: 'Competitor analysis and insights' },
                  { id: 'concepts', label: 'Concept Maps', description: 'Visual concept relationships' }
                ].map((section) => (
                  <div key={section.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                    <Checkbox
                      id={section.id}
                      checked={exportSections.has(section.id)}
                      onCheckedChange={(checked) => handleExportSection(section.id, !!checked)}
                    />
                    <div className="flex-1">
                      <label htmlFor={section.id} className="font-medium cursor-pointer">
                        {section.label}
                      </label>
                      <p className="text-sm text-muted-foreground">{section.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Export Actions */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {exportSections.size} sections selected • {selectedExportFormat} format
                </div>
                <div className="flex gap-2">
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                  <Button onClick={() => handleExport(selectedExportFormat)}>
                    <Download className="h-4 w-4 mr-2" />
                    Export Now
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="share" className="space-y-4">
          {/* Team Sharing */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Share with Team</CardTitle>
              <CardDescription>
                Collaborate with team members on this brainstorming session
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Button onClick={handleShareWithTeam}>
                  <Share className="h-4 w-4 mr-2" />
                  Share Session
                </Button>
                <Button variant="outline">
                  <Mail className="h-4 w-4 mr-2" />
                  Email Summary
                </Button>
                <Button variant="outline">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Link
                </Button>
              </div>
              
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Team members will be able to view and comment on your brainstorming results.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Integration Options */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Integration Options</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Search className="h-4 w-4" />
                    <span className="font-medium">Patent Databases</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Export search queries directly to patent databases
                  </p>
                  <Button size="sm" variant="outline">
                    Configure Databases
                  </Button>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Globe className="h-4 w-4" />
                    <span className="font-medium">Research Platform</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Sync with external research management tools
                  </p>
                  <Button size="sm" variant="outline">
                    Setup Integration
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}