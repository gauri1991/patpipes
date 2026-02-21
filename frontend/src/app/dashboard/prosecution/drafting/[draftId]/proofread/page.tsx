'use client';

import { useState, useEffect, use } from 'react';
import { prosecutionApi } from '@/lib/api/prosecution';
import { PatentApplication } from '@/types/prosecution';
import { PatentProofreadingAnalyzer, AnalysisResult } from '@/lib/patentProofreadingAnalyzer';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft,
  Save,
  FileCheck,
  FileText,
  CheckCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  Check,
  X,
  Filter,
  Target,
  SkipForward,
  SkipBack,
  RefreshCw,
  Zap
} from 'lucide-react';

interface ProofreadPageProps {
  params: Promise<{ draftId: string }>;
}

// Document sections for navigation
const documentSections = [
  { id: 'title', label: 'Title', icon: FileText, key: 'title' },
  { id: 'technical_field', label: 'Technical Field', icon: FileText, key: 'technology_area' },
  { id: 'background', label: 'Background', icon: FileText, key: 'background' },
  { id: 'summary', label: 'Summary', icon: FileText, key: 'summary' },
  { id: 'detailed_description', label: 'Detailed Description', icon: FileText, key: 'detailed_description' },
  { id: 'claims', label: 'Claims', icon: FileCheck, key: 'claims' },
  { id: 'abstract', label: 'Abstract', icon: FileText, key: 'abstract' },
];

export default function ProofreadPage({ params }: ProofreadPageProps) {
  const resolvedParams = use(params);
  const [application, setApplication] = useState<PatentApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('title');
  const [sectionContent, setSectionContent] = useState<Record<string, string>>({});
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  
  // Proofreading state
  const [proofreadingMode, setProofreadingMode] = useState<'auto' | 'manual'>('auto');
  const [enabledChecks, setEnabledChecks] = useState({
    grammar: true,
    patentStyle: true,
    antecedent: true,
    format: true,
    clarity: true,
    consistency: true,
    legal: true
  });
  const [severityFilter, setSeverityFilter] = useState<'all' | 'error' | 'warning' | 'info'>('all');
  const [currentIssueIndex, setCurrentIssueIndex] = useState(0);
  const [reviewMode, setReviewMode] = useState(false);
  const [claimsCount, setClaimsCount] = useState(0);
  
  const patentAnalyzer = new PatentProofreadingAnalyzer();

  // Helper function to count claims
  const countClaims = (claimsText: string): number => {
    if (!claimsText.trim()) return 0;
    const claimMatches = claimsText.match(/^\s*\d+\./gm);
    return claimMatches ? claimMatches.length : 0;
  };

  // Helper function to get word count
  const getWordCount = (text: string): number => {
    if (!text || !text.trim()) return 0;
    return text.trim().split(/\s+/).length;
  };

  // Load application data
  useEffect(() => {
    const loadApplication = async () => {
      try {
        setLoading(true);
        const data = await prosecutionApi.getApplication(resolvedParams.draftId);
        setApplication(data);
        
        // Initialize section content
        const content = {
          title: data.title || '',
          technical_field: data.technology_area || '',
          background: data.background || '',
          summary: data.summary || '',
          detailed_description: data.detailed_description || '',
          claims: '', // Will be loaded separately if needed
          abstract: data.abstract || '',
        };
        setSectionContent(content);
        
        // Initialize claims count
        if (content.claims) {
          setClaimsCount(countClaims(content.claims));
        }
        
        // Run initial analysis on first available content
        if (content.title) {
          analyzeContent(content.title, 'title');
        } else if (content.abstract) {
          analyzeContent(content.abstract, 'abstract');
        }
      } catch (error) {
        console.error('Failed to load application:', error);
      } finally {
        setLoading(false);
      }
    };

    loadApplication();
  }, [resolvedParams.draftId]);

  // Analyze content function
  const analyzeContent = (content: string, section: string) => {
    if (!content.trim()) {
      setAnalysisResult(null);
      return;
    }

    const contextType = section === 'claims' ? 'claims' : section === 'abstract' ? 'abstract' : 'specification';
    const result = patentAnalyzer.analyzeDocument(content, { 
      section: contextType, 
      office: 'USPTO' 
    });
    setAnalysisResult(result);
  };

  // Auto-analyze when content or section changes
  useEffect(() => {
    if (proofreadingMode === 'auto' && sectionContent[activeSection]) {
      analyzeContent(sectionContent[activeSection], activeSection);
    }
  }, [activeSection, sectionContent, proofreadingMode]);

  // Handle content change
  const handleContentChange = (newContent: string) => {
    setSectionContent(prev => ({
      ...prev,
      [activeSection]: newContent
    }));
    
    // Update claims count if we're editing claims
    if (activeSection === 'claims') {
      setClaimsCount(countClaims(newContent));
    }
    
    if (proofreadingMode === 'auto') {
      analyzeContent(newContent, activeSection);
    }
  };

  // Filter issues based on severity
  const filteredIssues = analysisResult?.issues.filter(issue => {
    if (severityFilter === 'all') return true;
    return issue.severity === severityFilter;
  }) || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading proofreading interface...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b bg-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/dashboard/prosecution/drafting/${resolvedParams.draftId}`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Draft
              </Button>
            </Link>
            <div>
              <h1 className="text-lg font-semibold">Patent Proofreading</h1>
              <p className="text-sm text-muted-foreground">{application?.title}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Save className="h-4 w-4 mr-2" />
              Save Progress
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Section Navigation */}
        <div className="w-80 border-r bg-muted/30 p-4">
          <h3 className="text-sm font-medium mb-3">Document Structure</h3>
          <div className="space-y-1">
            {documentSections.map((section) => {
              const content = sectionContent[section.id] || '';
              const wordCount = getWordCount(content);
              const showClaimsInfo = section.id === 'claims' && content;
              const currentClaimsCount = section.id === 'claims' ? countClaims(content) : 0;
              
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center justify-between p-3 rounded text-sm transition-colors border ${
                    activeSection === section.id 
                      ? 'bg-primary text-primary-foreground border-primary' 
                      : 'hover:bg-accent border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <section.icon className="h-4 w-4 flex-shrink-0" />
                    <span className="font-medium">{section.label}</span>
                  </div>
                  <div className="text-xs opacity-75 text-right">
                    {wordCount > 0 ? (
                      <div>
                        <div>{wordCount} word{wordCount !== 1 ? 's' : ''}</div>
                        {showClaimsInfo && currentClaimsCount > 0 && (
                          <div className="text-xs mt-0.5">
                            {currentClaimsCount} claim{currentClaimsCount !== 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-muted-foreground">0 words</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          
          {/* Document Summary */}
          <div className="mt-6 p-3 bg-white rounded border">
            <h4 className="text-xs font-medium text-muted-foreground mb-2">DOCUMENT SUMMARY</h4>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span>Total Words:</span>
                <span className="font-medium">
                  {Object.values(sectionContent).reduce((total, content) => total + getWordCount(content), 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Sections:</span>
                <span className="font-medium">
                  {documentSections.filter(section => getWordCount(sectionContent[section.id] || '') > 0).length}/{documentSections.length}
                </span>
              </div>
              {sectionContent.claims && (
                <div className="flex justify-between">
                  <span>Claims:</span>
                  <span className="font-medium">{countClaims(sectionContent.claims)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col">
          {/* Controls Panel */}
          <div className="border-b bg-white p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Button 
                  variant={proofreadingMode === 'auto' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setProofreadingMode('auto')}
                >
                  Auto
                </Button>
                <Button 
                  variant={proofreadingMode === 'manual' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setProofreadingMode('manual')}
                >
                  Manual
                </Button>
                {proofreadingMode === 'manual' && (
                  <Button 
                    size="sm"
                    onClick={() => analyzeContent(sectionContent[activeSection] || '', activeSection)}
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Analyze
                  </Button>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant={reviewMode ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setReviewMode(!reviewMode)}
                >
                  {reviewMode ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                  {reviewMode ? 'Exit Review' : 'Review Mode'}
                </Button>
              </div>
            </div>
            
            {/* Quality Score Dashboard */}
            {analysisResult && (
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span>Overall Quality:</span>
                  <span className={`font-medium ${
                    analysisResult.statistics.overallScore >= 80 ? 'text-green-600' :
                    analysisResult.statistics.overallScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {analysisResult.statistics.overallScore}%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span>Issues:</span>
                  <span className="font-medium">{analysisResult.issues.length}</span>
                </div>
                {analysisResult.issues.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={() => setCurrentIssueIndex(Math.max(0, currentIssueIndex - 1))}
                      disabled={currentIssueIndex === 0}
                    >
                      <SkipBack className="h-3 w-3" />
                    </Button>
                    <span className="text-xs">
                      {currentIssueIndex + 1} of {analysisResult.issues.length}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={() => setCurrentIssueIndex(Math.min(analysisResult.issues.length - 1, currentIssueIndex + 1))}
                      disabled={currentIssueIndex === analysisResult.issues.length - 1}
                    >
                      <SkipForward className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Split Content Area */}
          <div className="flex-1 flex overflow-hidden">
            {/* Content Editor */}
            <div className="flex-1 p-4">
              <div className="h-full border rounded-lg p-4 bg-white">
                <textarea
                  value={sectionContent[activeSection] || ''}
                  onChange={(e) => handleContentChange(e.target.value)}
                  placeholder={`Enter ${documentSections.find(s => s.id === activeSection)?.label.toLowerCase()} content...`}
                  className="w-full h-full resize-none border-0 outline-none text-sm leading-relaxed"
                  style={{ lineHeight: '1.8' }}
                />
              </div>
            </div>

            {/* Issues Sidebar */}
            <div className="w-80 border-l bg-muted/30 flex flex-col overflow-hidden">
              <div className="p-4 border-b bg-white">
                <h3 className="text-sm font-medium mb-3">Proofreading Issues</h3>
                
                {/* Severity Filter */}
                <div className="flex items-center gap-1">
                  {['all', 'critical', 'high', 'medium', 'low'].map((severity) => (
                    <Button
                      key={severity}
                      variant={severityFilter === severity ? 'default' : 'outline'}
                      size="sm"
                      className="text-xs h-6 px-2"
                      onClick={() => setSeverityFilter(severity as any)}
                    >
                      {severity}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {!analysisResult ? (
                  <div className="text-center text-muted-foreground text-sm">
                    No analysis results yet. Add content and run analysis.
                  </div>
                ) : filteredIssues.length === 0 ? (
                  <div className="text-center text-muted-foreground text-sm">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                    No issues found! Your content looks good.
                  </div>
                ) : (
                  filteredIssues.map((issue, index) => (
                    <div 
                      key={index} 
                      className={`p-3 rounded border cursor-pointer transition-colors ${
                        currentIssueIndex === index 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 bg-white hover:bg-gray-50'
                      }`}
                      onClick={() => setCurrentIssueIndex(index)}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${
                            issue.severity === 'error' ? 'bg-red-500' : 'bg-yellow-500'
                          }`} />
                          <span className="font-medium text-xs uppercase text-gray-600">
                            {issue.type.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          {issue.suggestion && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-5 w-5 p-0 text-green-600 hover:bg-green-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                const currentContent = sectionContent[activeSection] || '';
                                const problemText = issue.message.match(/"([^"]+)"/)?.[1];
                                if (problemText && issue.suggestion) {
                                  handleContentChange(currentContent.replace(problemText, issue.suggestion));
                                }
                              }}
                              title="Apply fix"
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-5 w-5 p-0 text-red-600 hover:bg-red-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('Dismissed issue:', issue);
                            }}
                            title="Dismiss"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-800 mb-2">{issue.message}</div>
                      
                      {issue.suggestion && (
                        <div className="text-xs text-green-700 bg-green-50 p-2 rounded">
                          <strong>Suggestion:</strong> {issue.suggestion}
                        </div>
                      )}
                      
                      {issue.line && (
                        <div className="text-xs text-muted-foreground mt-2">
                          Line {issue.line}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}