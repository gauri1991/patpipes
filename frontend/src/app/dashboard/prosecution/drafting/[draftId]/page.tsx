'use client';

import { useState, useRef, useEffect, use, useMemo } from 'react';
import { prosecutionApi } from '@/lib/api/prosecution';
import { useAutoSave, formatLastSaved } from '@/hooks/useAutoSave';
import { useClaims } from '@/hooks/useClaims';
import { PatentApplication, AutoSaveStatus, Claim, UpdatePatentApplicationData } from '@/types/prosecution';
import Link from 'next/link';
import { PatentProofreadingAnalyzer, ProofreadingIssue, AnalysisResult } from '@/lib/patentProofreadingAnalyzer';
import { 
  ArrowLeft,
  Save,
  Download,
  ChevronLeft,
  ChevronRight,
  FileText,
  FileCheck,
  Image,
  Scale,
  CheckCircle,
  Circle,
  AlertTriangle,
  Settings,
  Maximize,
  Minimize,
  SplitSquareHorizontal,
  Focus,
  List,
  GitBranch,
  Lightbulb,
  BookOpen,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Eye,
  EyeOff,
  Check,
  X,
  RefreshCw,
  Filter,
  Target,
  Zap
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Document structure and mock data
const documentSections = [
  {
    id: 'title',
    name: 'Title',
    icon: FileText,
    status: 'complete',
    wordCount: 8,
    required: true,
    content: 'Advanced Machine Learning Algorithm for Patent Analysis'
  },
  {
    id: 'field',
    name: 'Technical Field',
    icon: FileText,
    status: 'complete',
    wordCount: 45,
    required: true,
    content: 'The present invention relates to machine learning systems for patent analysis and automated document processing using advanced algorithmic techniques.'
  },
  {
    id: 'background',
    name: 'Background',
    icon: FileText,
    status: 'complete',
    wordCount: 850,
    required: true,
    content: 'Patent analysis has traditionally relied on manual review processes that are time-consuming and prone to human error. With the increasing volume of patent applications and the complexity of modern technological innovations, there is a critical need for automated systems that can efficiently analyze, categorize, and process patent documents. Current solutions lack the sophistication required to handle the nuanced language and technical specifications found in patent documentation.'
  },
  {
    id: 'summary',
    name: 'Summary',
    icon: FileText,
    status: 'partial',
    wordCount: 320,
    required: true,
    content: 'According to one embodiment of the present invention, a machine learning system is provided that comprises a document processing engine configured to analyze patent documents and extract key technical features. The system further comprises a classification module that categorizes patents based on their technical content and a recommendation engine that suggests relevant prior art and similar patents.'
  },
  {
    id: 'detailed_description',
    name: 'Detailed Description',
    icon: FileText,
    status: 'incomplete',
    wordCount: 0,
    required: true,
    content: 'The following detailed description of exemplary embodiments refers to the accompanying drawings. The same reference numbers in different drawings may identify the same or similar elements.\n\nReferring to Figure 1, the machine learning system 100 comprises several interconnected components designed to analyze patent documents with high accuracy and efficiency. The document processing engine 110 serves as the primary interface for receiving patent documents in various formats including PDF, XML, and plain text.\n\nThe feature extraction module 120 utilizes advanced natural language processing techniques to identify and categorize technical elements within the patent documents. This module employs machine learning algorithms trained on a comprehensive corpus of patent literature to recognize patterns and extract meaningful technical features.\n\nThe classification system 130 processes the extracted features to categorize patents according to established classification schemes such as the International Patent Classification (IPC) and Cooperative Patent Classification (CPC) systems. The system maintains high accuracy through continuous learning and adaptation to new patent domains and technologies.'
  },
  {
    id: 'claims',
    name: 'Claims',
    icon: Scale,
    status: 'incomplete',
    wordCount: 280,
    required: true,
    content: '1. A machine learning system for patent analysis, comprising:\n   a) a document processing engine configured to receive and analyze patent documents;\n   b) a feature extraction module configured to identify technical elements within the documents;\n   c) a classification system configured to categorize patents based on extracted features.',
    claimCount: 15
  },
  {
    id: 'abstract',
    name: 'Abstract',
    icon: FileText,
    status: 'complete',
    wordCount: 140,
    required: true,
    content: 'A machine learning system analyzes patent documents using advanced natural language processing techniques. The system automatically extracts technical features, classifies patent content, and provides recommendations for related prior art. The invention improves efficiency in patent analysis workflows and reduces manual review time while maintaining accuracy in document processing.'
  }
];

const patentOffices = [
  { id: 'uspto', name: 'USPTO', country: 'United States' },
  { id: 'epo', name: 'EPO', country: 'European Union' },
  { id: 'jpo', name: 'JPO', country: 'Japan' },
  { id: 'cnipa', name: 'CNIPA', country: 'China' }
];

interface Props {
  params: Promise<{
    draftId: string;
  }>;
}

export default function EnhancedDraftingInterface({ params }: Props) {
  const resolvedParams = use(params);
  const [activeSection, setActiveSection] = useState('title');
  const [selectedOffice, setSelectedOffice] = useState('uspto');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sectionContent, setSectionContent] = useState<Record<string, string>>({});
  
  // Backend data state
  const [applicationData, setApplicationData] = useState<PatentApplication | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  // Auto-save hook integration
  const { autoSaveStatus, lastSaved, scheduleSave, saveNow } = useAutoSave(
    resolvedParams.draftId,
    {
      onSaveSuccess: (data) => {
        setApplicationData(data);
      },
      onSaveError: (error) => {
        console.error('Auto-save failed:', error);
        setLoadError(error.message);
      }
    }
  );
  
  // Claims management hook
  const { 
    claims, 
    isLoading: claimsLoading, 
    isSaving: claimsSaving,
    loadClaims,
    updateClaimsFromText,
    getClaimsText
  } = useClaims({
    applicationId: resolvedParams.draftId,
    onClaimsChange: (updatedClaims) => {
      // Update the claims section content when claims change
      if (!Array.isArray(updatedClaims)) {
        console.warn('updatedClaims is not an array:', updatedClaims);
        return;
      }
      
      const claimsText = updatedClaims
        .sort((a, b) => a.claim_number - b.claim_number)
        .map(claim => {
          // Add indentation for dependent claims
          const isDependent = claim.claim_type === 'dependent' || 
                             claim.claim_text.toLowerCase().includes('claim ') ||
                             claim.claim_text.toLowerCase().includes('according to');
          const indent = isDependent ? '    ' : ''; // 4 spaces for dependent claims
          return `${indent}${claim.claim_number}. ${claim.claim_text}`;
        })
        .join('\n\n');
      
      setSectionContent(prev => ({
        ...prev,
        claims: claimsText
      }));
    },
    onError: (error) => {
      console.error('Claims error:', error);
      setLoadError(error.message);
    }
  });
  
  // Enhanced features state
  const [splitScreenMode, setSplitScreenMode] = useState(false);
  const [distractionFreeMode, setDistractionFreeMode] = useState(false);
  const [outlineViewOpen, setOutlineViewOpen] = useState(false);
  const [trackChangesEnabled, setTrackChangesEnabled] = useState(false);
  const [splitScreenSection, setSplitScreenSection] = useState<string | null>(null);

  // New advanced features
  const [proofreadingEnabled, setProofreadingEnabled] = useState(false);
  const [boilerplateLibraryOpen, setBoilerplateLibraryOpen] = useState(false);
  
  // Proofreading control states
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
  
  // Patent proofreading analyzer
  const [patentAnalyzer] = useState(() => new PatentProofreadingAnalyzer());
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Patent-specific vocabulary and suggestions
  const patentVocabulary = {
    title: ['system', 'method', 'apparatus', 'device', 'process'],
    abstract: ['comprising', 'wherein', 'embodiment', 'invention'],
    claims: ['comprising', 'wherein', 'further comprising', 'characterized by'],
    field: ['relates to', 'pertains to', 'concerns', 'invention'],
    background: ['prior art', 'conventional', 'traditional', 'existing'],
    summary: ['embodiment', 'implementation', 'configuration', 'arrangement']
  };
  

  // Load application data from backend
  useEffect(() => {
    async function loadApplication() {
      try {
        setIsLoading(true);
        setLoadError(null);
        
        const data = await prosecutionApi.getApplication(resolvedParams.draftId);
        setApplicationData(data);
        
        // Initialize section content from backend data
        const initialContent: Record<string, string> = {
          title: data.title || '',
          abstract: data.abstract || '',
          background: data.background || '',
          summary: data.summary || '',
          detailed_description: data.detailed_description || '',
          // Map other sections from the document structure
          field: data.technology_area || '',
          claims: data.claims?.map((claim) => {
            // Add indentation for dependent claims
            const isDependent = claim.claim_type === 'dependent' || 
                               claim.claim_text.toLowerCase().includes('claim ') ||
                               claim.claim_text.toLowerCase().includes('according to');
            const indent = isDependent ? '    ' : ''; // 4 spaces for dependent claims
            return `${indent}${claim.claim_number}. ${claim.claim_text}`;
          }).join('\n\n') || '',
        };
        
        // Fill in any missing sections with default content
        documentSections.forEach(section => {
          if (!(section.id in initialContent)) {
            initialContent[section.id] = section.content || '';
          }
        });
        
        setSectionContent(initialContent);
        
        // Load claims separately for detailed management
        loadClaims();
      } catch (error) {
        console.error('Failed to load application:', error);
        setLoadError(error instanceof Error ? error.message : 'Failed to load application');
        
        // Fall back to mock data if backend fails
        const fallbackContent: Record<string, string> = {};
        documentSections.forEach(section => {
          fallbackContent[section.id] = section.content || '';
        });
        setSectionContent(fallbackContent);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadApplication();
  }, [resolvedParams.draftId]); // Remove loadClaims from dependencies to prevent infinite loop

  // Auto-select split screen section when split mode is enabled
  useEffect(() => {
    if (splitScreenMode && !splitScreenSection) {
      const currentIndex = documentSections.findIndex(s => s.id === activeSection);
      const nextSection = currentIndex < documentSections.length - 1 
        ? documentSections[currentIndex + 1].id 
        : documentSections[0].id;
      setSplitScreenSection(nextSection);
    }
  }, [splitScreenMode, splitScreenSection, activeSection]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'partial':
        return <AlertTriangle className="h-3 w-3 text-yellow-500" />;
      case 'incomplete':
        return <Circle className="h-3 w-3 text-gray-400" />;
      default:
        return <Circle className="h-3 w-3 text-gray-400" />;
    }
  };

  const handleContentChange = (value: string) => {
    setSectionContent(prev => ({
      ...prev,
      [activeSection]: value
    }));
    
    // Trigger patent analysis
    analyzeContent(value, activeSection);
    
    // Prepare data for auto-save based on active section
    const updateData: UpdatePatentApplicationData = {};
    
    switch (activeSection) {
      case 'title':
        updateData.title = value;
        break;
      case 'abstract':
        updateData.abstract = value;
        break;
      case 'background':
        updateData.background = value;
        break;
      case 'summary':
        updateData.summary = value;
        break;
      case 'detailed_description':
        updateData.detailed_description = value;
        break;
      case 'field':
        updateData.technology_area = value;
        break;
      case 'claims':
        // Handle claims separately with the claims hook
        // Debounce the claims update to avoid too many API calls
        setTimeout(() => {
          updateClaimsFromText(value).catch(error => {
            console.error('Failed to update claims:', error);
          });
        }, 1000);
        return; // Don't auto-save application data for claims
      default:
        // Store in a generic way for now
        break;
    }
    
    // Schedule auto-save if we have valid data
    if (Object.keys(updateData).length > 0) {
      scheduleSave(updateData);
    }
  };

  // Memoized values to prevent infinite re-renders
  const selectedPatentOffice = useMemo(() => 
    patentOffices.find(o => o.id === selectedOffice), 
    [selectedOffice]
  );

  const currentSection = useMemo(() => {
    return documentSections.find(s => s.id === activeSection);
  }, [activeSection]);

  const totalWordCount = useMemo(() => {
    return Object.values(sectionContent).reduce((total, content) => {
      return total + (content?.split(' ').filter(word => word.trim()).length || 0);
    }, 0);
  }, [sectionContent]);

  // Calculate dynamic word counts for each section
  const sectionWordCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.keys(sectionContent).forEach(sectionId => {
      const content = sectionContent[sectionId] || '';
      counts[sectionId] = content.split(' ').filter(word => word.trim()).length;
    });
    return counts;
  }, [sectionContent]);

  // Calculate claim count dynamically
  const claimCount = useMemo(() => {
    const claimsText = sectionContent.claims || '';
    // Count lines that start with a number followed by a period
    const claimMatches = claimsText.match(/^\d+\./gm);
    return claimMatches ? claimMatches.length : 0;
  }, [sectionContent.claims]);

  const completedSections = useMemo(() => {
    return documentSections.filter(s => s.status === 'complete').length;
  }, []);

  const currentSectionIndex = useMemo(() => {
    return documentSections.findIndex(s => s.id === activeSection);
  }, [activeSection]);

  const progressPercentage = useMemo(() => {
    return Math.round((completedSections / documentSections.length) * 100);
  }, [completedSections]);

  // Run patent analysis
  const analyzeContent = useMemo(() => {
    return debounce(async (content: string, section: string) => {
      if (!proofreadingEnabled || !content.trim()) return;
      
      setIsAnalyzing(true);
      try {
        const sectionType = section === 'claims' ? 'claims' : 
                           section === 'abstract' ? 'abstract' : 'specification';
        
        const result = patentAnalyzer.analyzeDocument(content, {
          section: sectionType,
          specification: sectionContent.background + ' ' + sectionContent.summary + ' ' + sectionContent.detailed_description,
          office: selectedOffice === 'epo' ? 'EPO' : 'USPTO'
        });
        
        setAnalysisResult(result);
      } catch (error) {
        console.error('Analysis failed:', error);
      } finally {
        setIsAnalyzing(false);
      }
    }, 1500);
  }, [patentAnalyzer, proofreadingEnabled, sectionContent, selectedOffice]);

  // Interactive proofreading functions
  const toggleCheckType = (checkType: keyof typeof enabledChecks) => {
    setEnabledChecks(prev => ({
      ...prev,
      [checkType]: !prev[checkType]
    }));
    
    // Re-run analysis if auto mode is enabled
    if (proofreadingMode === 'auto' && proofreadingEnabled) {
      const currentContent = sectionContent[activeSection] || '';
      analyzeContent(currentContent, activeSection);
    }
  };

  const runManualAnalysis = () => {
    const currentContent = sectionContent[activeSection] || '';
    analyzeContent(currentContent, activeSection);
  };

  const getFilteredIssues = () => {
    if (!analysisResult) return [];
    
    let filtered = analysisResult.issues;
    
    // Filter by severity
    if (severityFilter !== 'all') {
      filtered = filtered.filter(issue => issue.severity === severityFilter);
    }
    
    return filtered;
  };

  const navigateToIssue = (index: number) => {
    const issues = getFilteredIssues();
    if (index >= 0 && index < issues.length) {
      setCurrentIssueIndex(index);
      // TODO: Scroll to issue in text
    }
  };

  const acceptSuggestion = (issueIndex: number) => {
    const issues = getFilteredIssues();
    const issue = issues[issueIndex];
    
    if (issue && issue.suggestion) {
      // TODO: Apply suggestion to text
      console.log('Accepting suggestion for:', issue.message);
    }
  };

  const dismissIssue = (issueIndex: number) => {
    // TODO: Mark issue as dismissed
    console.log('Dismissing issue:', issueIndex);
  };

  const getQualityScore = () => {
    if (!analysisResult) return 0;
    return analysisResult.statistics.overallScore;
  };

  const getCheckTypeIcon = (checkType: string) => {
    switch (checkType) {
      case 'grammar': return '📝';
      case 'patentStyle': return '⚖️';
      case 'antecedent': return '🔗';
      case 'format': return '📐';
      case 'clarity': return '🔍';
      case 'consistency': return '📊';
      case 'legal': return '⚖️';
      default: return '✅';
    }
  };

  // Debounce utility
  function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading patent application...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (loadError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Failed to Load Application</h2>
          <p className="text-muted-foreground mb-4">{loadError}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className={`min-h-screen bg-background ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
        {/* Top Bar with Enhanced Toolbar */}
        <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b bg-background/95 backdrop-blur px-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/prosecution/drafting">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            
            <div className="text-sm font-medium">
              Enhanced Patent Drafting
            </div>
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className={`h-2 w-2 rounded-full ${
                autoSaveStatus === 'saved' ? 'bg-green-500' : 
                autoSaveStatus === 'saving' ? 'bg-yellow-500' : 'bg-red-500'
              }`} />
              <span>
                {autoSaveStatus === 'saved' ? `Saved - ${formatLastSaved(lastSaved)}` : 
                 autoSaveStatus === 'saving' ? 'Saving...' : 
                 autoSaveStatus === 'error' ? 'Error saving' : 'Not saved'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Enhanced Editing Tools */}
            <div className="flex items-center gap-1 border-r pr-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant={splitScreenMode ? "default" : "ghost"} 
                    size="sm"
                    onClick={() => setSplitScreenMode(!splitScreenMode)}
                  >
                    <SplitSquareHorizontal className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Split Screen Mode</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant={distractionFreeMode ? "default" : "ghost"} 
                    size="sm"
                    onClick={() => setDistractionFreeMode(!distractionFreeMode)}
                  >
                    <Focus className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Distraction-Free Mode</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant={outlineViewOpen ? "default" : "ghost"} 
                    size="sm"
                    onClick={() => setOutlineViewOpen(!outlineViewOpen)}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Outline View</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant={trackChangesEnabled ? "default" : "ghost"} 
                    size="sm"
                    onClick={() => setTrackChangesEnabled(!trackChangesEnabled)}
                  >
                    <GitBranch className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Track Changes</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant={proofreadingEnabled ? "default" : "ghost"} 
                    size="sm"
                    onClick={() => setProofreadingEnabled(!proofreadingEnabled)}
                  >
                    <Lightbulb className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Proofreading Assistant</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant={boilerplateLibraryOpen ? "default" : "ghost"} 
                    size="sm"
                    onClick={() => setBoilerplateLibraryOpen(!boilerplateLibraryOpen)}
                  >
                    <BookOpen className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Boilerplate Library</TooltipContent>
              </Tooltip>
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                >
                  {isFullscreen ? (
                    <Minimize className="h-4 w-4" />
                  ) : (
                    <Maximize className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}</TooltipContent>
            </Tooltip>

            <Select value={selectedOffice} onValueChange={setSelectedOffice}>
              <SelectTrigger className="w-32 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {patentOffices.map(office => (
                  <SelectItem key={office.id} value={office.id}>
                    {office.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              size="sm" 
              onClick={() => saveNow()}
              disabled={autoSaveStatus === 'saving'}
            >
              <Save className="h-4 w-4 mr-2" />
              {autoSaveStatus === 'saving' ? 'Saving...' : 'Save Now'}
            </Button>

            <Link 
              href={`/dashboard/prosecution/claims-builder?applicationId=${resolvedParams.draftId}${
                sectionContent.claims ? `&claimsText=${encodeURIComponent(sectionContent.claims)}` : ''
              }`}
            >
              <Button 
                size="sm" 
                variant="outline"
              >
                <FileText className="h-4 w-4 mr-2" />
                Edit Claims
              </Button>
            </Link>

            <Link href={`/dashboard/prosecution/drafting/${resolvedParams.draftId}/proofread`}>
              <Button 
                size="sm" 
                variant="outline"
              >
                <FileCheck className="h-4 w-4 mr-2" />
                Proofread
              </Button>
            </Link>
          </div>
        </div>

        <div className="flex h-[calc(100vh-3.5rem)]">
          {/* Left Sidebar - Document Navigator */}
          {!distractionFreeMode && (
            <div className={`border-r bg-muted/30 transition-all duration-300 ${
              sidebarCollapsed ? 'w-12' : 'w-64'
            }`}>
              <div className="flex items-center justify-between p-3 border-b">
                {!sidebarCollapsed && (
                  <div className="text-sm font-medium">Document Structure</div>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                >
                  {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                </Button>
              </div>

              <div className="py-2">
                {documentSections.map((section) => (
                  <Tooltip key={section.id}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setActiveSection(section.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-accent transition-colors ${
                          activeSection === section.id ? 'bg-accent border-r-2 border-r-primary' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          {getStatusIcon(section.status)}
                          <section.icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          {!sidebarCollapsed && (
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium truncate">{section.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {sectionWordCounts[section.id] || 0} words
                                {section.id === 'claims' && claimCount > 0 && ` • ${claimCount} claims`}
                              </div>
                            </div>
                          )}
                        </div>
                      </button>
                    </TooltipTrigger>
                    {sidebarCollapsed && (
                      <TooltipContent side="right">
                        <p>{section.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {sectionWordCounts[section.id] || 0} words
                          {section.id === 'claims' && claimCount > 0 && ` • ${claimCount} claims`}
                        </p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                ))}
              </div>
            </div>
          )}

          {/* Outline View Sidebar */}
          {outlineViewOpen && (
            <div className="w-64 border-r bg-muted/30 p-4">
              <h3 className="text-sm font-medium mb-3">Document Outline</h3>
              <div className="space-y-2 text-sm">
                {documentSections.map((section) => (
                  <div 
                    key={section.id}
                    className={`p-2 rounded hover:bg-accent cursor-pointer capitalize ${
                      activeSection === section.id ? 'font-medium text-primary bg-accent' : ''
                    }`}
                    onClick={() => setActiveSection(section.id)}
                  >
                    {section.name}
                  </div>
                ))}
              </div>
            </div>
          )}


          {/* Main Editing Canvas */}
          <div className="flex-1 flex flex-col">
            {/* Split Screen Header */}
            {splitScreenMode && splitScreenSection && (
              <div className="border-b bg-muted/50 px-4 py-2 flex items-center justify-between">
                <div className="text-sm font-medium">
                  Split Screen: {currentSection?.name} & {documentSections.find(s => s.id === splitScreenSection)?.name}
                </div>
                <div className="flex items-center gap-2">
                  <Select value={splitScreenSection} onValueChange={setSplitScreenSection}>
                    <SelectTrigger className="w-48 h-7 text-xs">
                      <SelectValue placeholder="Select section to compare" />
                    </SelectTrigger>
                    <SelectContent>
                      {documentSections.filter(s => s.id !== activeSection).map(section => (
                        <SelectItem key={section.id} value={section.id}>
                          {section.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="sm" onClick={() => setSplitScreenSection(null)}>
                    ×
                  </Button>
                </div>
              </div>
            )}
            
            <div className={`flex-1 overflow-auto ${splitScreenMode && splitScreenSection ? 'flex' : ''}`}>
              {/* Primary Editor Pane */}
              <div className={`${splitScreenMode && splitScreenSection ? 'w-1/2 border-r' : 'w-full'}`}>
                <div className={`${distractionFreeMode ? 'max-w-none p-4' : 'max-w-4xl mx-auto p-8'}`}>
                  <div className="bg-white shadow-sm border rounded-lg min-h-full">
                    <div className="p-12" style={{ fontFamily: 'Times, serif', lineHeight: '1.6' }}>
                      {/* Section Header */}
                      <div className="mb-8 border-b pb-4">
                        <h2 className="text-xl font-semibold mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                          {currentSection?.name}
                        </h2>
                        <div className="text-sm text-muted-foreground">
                          Section {documentSections.findIndex(s => s.id === activeSection) + 1} of {documentSections.length}
                        </div>
                      </div>

                      {/* Content Editor */}
                      <div className="space-y-4">
                        {activeSection === 'title' ? (
                          <Input
                            value={sectionContent[activeSection] || ''}
                            onChange={(e) => handleContentChange(e.target.value)}
                            className="text-lg font-medium border-0 p-0 shadow-none focus-visible:ring-0"
                            style={{ fontFamily: 'Times, serif' }}
                            placeholder="Enter patent title..."
                          />
                        ) : (
                          <div className="relative border border-gray-200 rounded-md">
                            <Textarea
                              value={sectionContent[activeSection] || ''}
                              onChange={(e) => handleContentChange(e.target.value)}
                              className="h-96 border-0 p-3 shadow-none focus-visible:ring-0 resize-none text-base w-full custom-scrollbar uspto-formatting"
                              style={{ 
                                fontFamily: 'Times New Roman, Times, serif', 
                                fontSize: '12pt',
                                lineHeight: '1.5',
                                letterSpacing: '0.01em'
                              }}
                              placeholder={`Enter ${currentSection?.name?.toLowerCase()} content...`}
                            />
                          </div>
                        )}
                      </div>

                      {/* Track Changes */}
                      {trackChangesEnabled && (
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
                          <strong>Track Changes:</strong> All modifications are being tracked
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Secondary Editor Pane (Split Screen) */}
              {splitScreenMode && splitScreenSection && (
                <div className="w-1/2">
                  <div className={`${distractionFreeMode ? 'max-w-none p-4' : 'max-w-4xl mx-auto p-8'}`}>
                    <div className="bg-white shadow-sm border rounded-lg min-h-full">
                      <div className="p-12" style={{ fontFamily: 'Times, serif', lineHeight: '1.6' }}>
                        <div className="mb-8 border-b pb-4">
                          <h2 className="text-xl font-semibold mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                            {documentSections.find(s => s.id === splitScreenSection)?.name}
                          </h2>
                          <div className="text-sm text-muted-foreground">
                            Section {documentSections.findIndex(s => s.id === splitScreenSection) + 1} of {documentSections.length}
                          </div>
                        </div>

                        <div 
                          className="min-h-96 p-4 bg-gray-50 rounded border text-base"
                          style={{ fontFamily: 'Times, serif', fontSize: '12pt' }}
                        >
                          {sectionContent[splitScreenSection] || `No content yet for ${documentSections.find(s => s.id === splitScreenSection)?.name?.toLowerCase()}...`}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Advanced Context Tools */}
          {rightPanelOpen && !distractionFreeMode && (
            <div className="w-96 border-l bg-muted/30 flex flex-col">
              <div className="flex items-center justify-between p-4 border-b">
                <div className="text-sm font-medium">Advanced Tools</div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setRightPanelOpen(false)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex-1 overflow-auto p-4">
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm font-medium mb-2">Enhanced Features Active</div>
                    <div className="space-y-2 text-xs">
                      <div>Split Screen: {splitScreenMode ? 'On' : 'Off'}</div>
                      <div>Distraction-Free: {distractionFreeMode ? 'On' : 'Off'}</div>
                      <div>Track Changes: {trackChangesEnabled ? 'On' : 'Off'}</div>
                      <div>Proofreading: {proofreadingEnabled ? 'On' : 'Off'}</div>
                      <div>Boilerplate Library: {boilerplateLibraryOpen ? 'On' : 'Off'}</div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="text-sm font-medium mb-2">Document Statistics</div>
                    <div className="space-y-2 text-xs">
                      <div>Total Words: {totalWordCount.toLocaleString()}</div>
                      <div>Completed Sections: {completedSections}/{documentSections.length}</div>
                      <div>Progress: {progressPercentage}%</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Interactive Patent Proofreading Assistant */}
          {proofreadingEnabled && (
            <div className="w-96 border-l bg-muted/30 flex flex-col h-full">
              {/* Header with Controls */}
              <div className="p-4 border-b bg-white">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium">Patent Proofreading</h3>
                  <div className="flex items-center gap-2">
                    {/* Mode Toggle */}
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
                  </div>
                </div>

                {/* Check Type Buttons */}
                <div className="space-y-2 mb-4">
                  <div className="text-xs text-muted-foreground">Active Checks:</div>
                  <div className="grid grid-cols-2 gap-1">
                    {Object.entries(enabledChecks).map(([checkType, enabled]) => (
                      <Button
                        key={checkType}
                        variant={enabled ? 'default' : 'outline'}
                        size="sm"
                        className="text-xs h-8"
                        onClick={() => toggleCheckType(checkType as keyof typeof enabledChecks)}
                      >
                        <span className="mr-1">{getCheckTypeIcon(checkType)}</span>
                        {checkType.charAt(0).toUpperCase() + checkType.slice(1).replace(/([A-Z])/g, ' $1')}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Manual Analysis Button */}
                {proofreadingMode === 'manual' && (
                  <Button 
                    onClick={runManualAnalysis}
                    className="w-full mb-3"
                    size="sm"
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing ? (
                      <>
                        <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Zap className="h-3 w-3 mr-2" />
                        Run Analysis
                      </>
                    )}
                  </Button>
                )}

                {/* Quality Score Dashboard */}
                {analysisResult && (
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-3 rounded-lg mb-3">
                    <div className="text-center mb-2">
                      <div className="text-2xl font-bold text-primary">{getQualityScore()}%</div>
                      <div className="text-xs text-muted-foreground">Overall Quality Score</div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="text-center p-1">
                        <div className="font-semibold text-blue-600">{analysisResult.statistics.antecedentScore}%</div>
                        <div className="text-muted-foreground">Antecedent</div>
                      </div>
                      <div className="text-center p-1">
                        <div className="font-semibold text-green-600">{analysisResult.statistics.clarityScore}%</div>
                        <div className="text-muted-foreground">Clarity</div>
                      </div>
                      <div className="text-center p-1">
                        <div className="font-semibold text-purple-600">{analysisResult.statistics.formatScore}%</div>
                        <div className="text-muted-foreground">Format</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Severity Filter */}
                {analysisResult && (
                  <div className="flex items-center gap-2 mb-3">
                    <Filter className="h-3 w-3 text-muted-foreground" />
                    <div className="flex gap-1">
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
                )}
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                {/* Issue Navigation */}
                {analysisResult && analysisResult.issues.length > 0 && (
                  <div className="flex items-center justify-between p-2 bg-blue-50 rounded border">
                    <div className="text-xs text-blue-700">
                      Issue {currentIssueIndex + 1} of {analysisResult.issues.length}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-blue-600 hover:bg-blue-100"
                        onClick={() => setCurrentIssueIndex(Math.max(0, currentIssueIndex - 1))}
                        disabled={currentIssueIndex === 0}
                      >
                        <SkipBack className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-blue-600 hover:bg-blue-100"
                        onClick={() => setCurrentIssueIndex(Math.min(analysisResult.issues.length - 1, currentIssueIndex + 1))}
                        disabled={currentIssueIndex === analysisResult.issues.length - 1}
                      >
                        <SkipForward className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-xs px-2 text-blue-600 hover:bg-blue-100"
                        onClick={() => setReviewMode(!reviewMode)}
                      >
                        {reviewMode ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
                        {reviewMode ? 'Exit Review' : 'Review Mode'}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Review Mode - All Issues in Compact Format */}
                {reviewMode && analysisResult && analysisResult.issues.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded p-3">
                    <h4 className="text-xs font-medium text-blue-800 mb-3 flex items-center">
                      <Eye className="h-3 w-3 mr-1" />
                      REVIEW MODE - ALL ISSUES ({analysisResult.issues.length})
                    </h4>
                    <div className="space-y-2 max-h-96 overflow-auto">
                      {analysisResult.issues.map((issue, index) => (
                        <div 
                          key={index} 
                          className={`p-2 rounded text-xs border cursor-pointer transition-colors ${
                            currentIssueIndex === index 
                              ? 'bg-blue-200 border-blue-400' 
                              : 'bg-white border-gray-200 hover:bg-blue-100'
                          }`}
                          onClick={() => setCurrentIssueIndex(index)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <div className={`h-1.5 w-1.5 rounded-full ${
                                  issue.severity === 'error' ? 'bg-red-500' : 'bg-yellow-500'
                                }`} />
                                <span className="font-medium text-gray-700">
                                  {issue.type.replace('_', ' ').toUpperCase()}
                                </span>
                                <span className="text-gray-500">Line {issue.line || '?'}</span>
                              </div>
                              <div className="text-gray-600 truncate">{issue.message}</div>
                              {issue.suggestion && (
                                <div className="text-blue-600 text-xs mt-1 truncate">
                                  → {issue.suggestion}
                                </div>
                              )}
                            </div>
                            <div className="flex gap-1">
                              {issue.suggestion && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-4 w-4 p-0 text-green-600 hover:bg-green-100"
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
                                  <Check className="h-2.5 w-2.5" />
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-4 w-4 p-0 text-red-600 hover:bg-red-100"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  console.log('Dismissed issue:', issue);
                                }}
                                title="Dismiss"
                              >
                                <X className="h-2.5 w-2.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Critical Issues */}
                {!reviewMode && analysisResult && analysisResult.issues.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center">
                      CRITICAL ISSUES
                      <span className="ml-2 px-1.5 py-0.5 bg-red-100 text-red-800 rounded text-xs">
                        {analysisResult.issues.filter(i => i.severity === 'error').length}
                      </span>
                    </h4>
                    <div className="space-y-2 max-h-64 overflow-auto">
                      {analysisResult.issues
                        .filter(issue => issue.severity === 'error')
                        .slice(0, 10)
                        .map((issue, index) => (
                        <div key={index} className={`p-3 rounded text-sm border-l-4 relative ${
                          issue.type === 'antecedent' ? 'bg-red-50 border-red-400' :
                          issue.type === 'indefinite' ? 'bg-orange-50 border-orange-400' :
                          issue.type === 'support' ? 'bg-purple-50 border-purple-400' :
                          issue.type === 'format' ? 'bg-blue-50 border-blue-400' :
                          'bg-yellow-50 border-yellow-400'
                        } ${currentIssueIndex === index ? 'ring-2 ring-blue-500' : ''}`}>
                          <div className="flex items-start gap-2">
                            <div className={`h-2 w-2 rounded-full mt-1.5 ${
                              issue.type === 'antecedent' ? 'bg-red-500' :
                              issue.type === 'indefinite' ? 'bg-orange-500' :
                              issue.type === 'support' ? 'bg-purple-500' :
                              issue.type === 'format' ? 'bg-blue-500' :
                              'bg-yellow-500'
                            }`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <div className="font-medium text-xs uppercase tracking-wide text-gray-600">
                                  {issue.type.replace('_', ' ')} ERROR
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-5 w-5 p-0 text-green-600 hover:bg-green-100"
                                    onClick={() => {
                                      // Accept suggestion and apply fix
                                      if (issue.suggestion) {
                                        const currentContent = sectionContent[activeSection] || '';
                                        const problemText = issue.message.match(/"([^"]+)"/)?.[1];
                                        if (problemText) {
                                          handleContentChange(currentContent.replace(problemText, issue.suggestion));
                                        }
                                      }
                                    }}
                                    title="Accept suggestion"
                                  >
                                    <Check className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-5 w-5 p-0 text-red-600 hover:bg-red-100"
                                    onClick={() => {
                                      // Dismiss issue (would update analysis state in real app)
                                      console.log('Dismissed issue:', issue);
                                    }}
                                    title="Dismiss issue"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                              <div className="text-gray-800 mb-2">{issue.message}</div>
                              {issue.suggestion && (
                                <div className="text-xs text-gray-600 bg-white p-2 rounded border mb-2">
                                  <strong>Fix:</strong> {issue.suggestion}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="ml-2 h-5 text-xs px-2"
                                    onClick={() => {
                                      const currentContent = sectionContent[activeSection] || '';
                                      const problemText = issue.message.match(/"([^"]+)"/)?.[1];
                                      if (problemText && issue.suggestion) {
                                        handleContentChange(currentContent.replace(problemText, issue.suggestion));
                                      }
                                    }}
                                  >
                                    Apply Fix
                                  </Button>
                                </div>
                              )}
                              <div className="flex items-center justify-between mt-2">
                                <div className="flex items-center gap-2">
                                  {issue.line && (
                                    <span className="text-xs text-muted-foreground">Line {issue.line}</span>
                                  )}
                                  {issue.ruleId && (
                                    <span className="text-xs text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">
                                      {issue.ruleId}
                                    </span>
                                  )}
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-5 text-xs px-2 text-blue-600 hover:bg-blue-100"
                                  onClick={() => setCurrentIssueIndex(index)}
                                >
                                  <Target className="h-3 w-3 mr-1" />
                                  Focus
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Warnings */}
                {!reviewMode && analysisResult && analysisResult.issues.filter(i => i.severity === 'warning').length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center">
                      WARNINGS
                      <span className="ml-2 px-1.5 py-0.5 bg-yellow-100 text-yellow-800 rounded text-xs">
                        {analysisResult.issues.filter(i => i.severity === 'warning').length}
                      </span>
                    </h4>
                    <div className="space-y-2 max-h-48 overflow-auto">
                      {analysisResult.issues
                        .filter(issue => issue.severity === 'warning')
                        .slice(0, 8)
                        .map((issue, index) => (
                        <div key={index} className="p-2.5 bg-yellow-50 border border-yellow-200 rounded text-sm">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <div className="text-yellow-800">{issue.message}</div>
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-5 w-5 p-0 text-green-600 hover:bg-green-100"
                                    onClick={() => {
                                      if (issue.suggestion) {
                                        const currentContent = sectionContent[activeSection] || '';
                                        const problemText = issue.message.match(/"([^"]+)"/)?.[1];
                                        if (problemText) {
                                          handleContentChange(currentContent.replace(problemText, issue.suggestion));
                                        }
                                      }
                                    }}
                                    title="Accept suggestion"
                                  >
                                    <Check className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-5 w-5 p-0 text-red-600 hover:bg-red-100"
                                    onClick={() => {
                                      console.log('Dismissed warning:', issue);
                                    }}
                                    title="Dismiss warning"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                              {issue.suggestion && (
                                <div className="text-xs text-yellow-700 bg-yellow-100 p-1.5 rounded mb-1">
                                  <strong>Suggestion:</strong> {issue.suggestion}
                                </div>
                              )}
                              {issue.line && (
                                <div className="text-xs text-muted-foreground mt-1">Line {issue.line}</div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Boilerplate Library Sidebar */}
          {boilerplateLibraryOpen && (
            <div className="w-80 border-l bg-muted/30 p-4">
              <h3 className="text-sm font-medium mb-3">Boilerplate Library</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground mb-2">CLAIM TEMPLATES</h4>
                  <div className="space-y-2">
                    <button 
                      className="w-full p-2 text-left text-xs bg-white border rounded hover:bg-accent"
                      onClick={() => {
                        const template = "A system comprising: a processor configured to...";
                        const currentValue = sectionContent[activeSection] || '';
                        setSectionContent(prev => ({
                          ...prev,
                          [activeSection]: currentValue + (currentValue ? '\n\n' : '') + template
                        }));
                      }}
                    >
                      System comprising...
                    </button>
                    <button 
                      className="w-full p-2 text-left text-xs bg-white border rounded hover:bg-accent"
                      onClick={() => {
                        const template = "A method for processing data, the method comprising:";
                        const currentValue = sectionContent[activeSection] || '';
                        setSectionContent(prev => ({
                          ...prev,
                          [activeSection]: currentValue + (currentValue ? '\n\n' : '') + template
                        }));
                      }}
                    >
                      Method for...
                    </button>
                    <button 
                      className="w-full p-2 text-left text-xs bg-white border rounded hover:bg-accent"
                      onClick={() => {
                        const template = "An apparatus configured to perform operations comprising:";
                        const currentValue = sectionContent[activeSection] || '';
                        setSectionContent(prev => ({
                          ...prev,
                          [activeSection]: currentValue + (currentValue ? '\n\n' : '') + template
                        }));
                      }}
                    >
                      Apparatus configured to...
                    </button>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground mb-2">COMMON PHRASES</h4>
                  <div className="space-y-2">
                    {[
                      'in accordance with',
                      'further comprising',
                      'wherein said',
                      'characterized by',
                      'operatively connected',
                      'configured to'
                    ].map((phrase, index) => (
                      <button
                        key={index}
                        className="w-full p-2 text-left text-xs bg-white border rounded hover:bg-accent"
                        onClick={() => {
                          const currentValue = sectionContent[activeSection] || '';
                          setSectionContent(prev => ({
                            ...prev,
                            [activeSection]: currentValue + (currentValue ? ' ' : '') + phrase
                          }));
                        }}
                      >
                        {phrase}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground mb-2">CROSS-REFERENCES</h4>
                  <div className="space-y-2">
                    <button 
                      className="w-full p-2 text-left text-xs bg-white border rounded hover:bg-accent"
                      onClick={() => {
                        const ref = "Figure 1 shows...";
                        const currentValue = sectionContent[activeSection] || '';
                        setSectionContent(prev => ({
                          ...prev,
                          [activeSection]: currentValue + (currentValue ? ' ' : '') + ref
                        }));
                      }}
                    >
                      Figure 1 shows...
                    </button>
                    <button 
                      className="w-full p-2 text-left text-xs bg-white border rounded hover:bg-accent"
                      onClick={() => {
                        const ref = "As described in claim 1...";
                        const currentValue = sectionContent[activeSection] || '';
                        setSectionContent(prev => ({
                          ...prev,
                          [activeSection]: currentValue + (currentValue ? ' ' : '') + ref
                        }));
                      }}
                    >
                      As described in claim 1...
                    </button>
                    <button 
                      className="w-full p-2 text-left text-xs bg-white border rounded hover:bg-accent"
                      onClick={() => {
                        const ref = "Referring to the drawings...";
                        const currentValue = sectionContent[activeSection] || '';
                        setSectionContent(prev => ({
                          ...prev,
                          [activeSection]: currentValue + (currentValue ? ' ' : '') + ref
                        }));
                      }}
                    >
                      Referring to the drawings...
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Status Bar */}
        {!distractionFreeMode && (
          <div className="flex items-center justify-between px-4 py-2 border-t bg-muted/50 text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>Section {currentSectionIndex + 1} of {documentSections.length}</span>
              <span>{currentSection?.name}</span>
              <span>{sectionContent[activeSection]?.split(' ').length || 0} words</span>
            </div>
            
            <div className="flex items-center gap-4">
              <span>Progress: {progressPercentage}%</span>
              <span>{selectedPatentOffice?.name} Compliant</span>
              <span>Total: {totalWordCount.toLocaleString()} words</span>
              
              {!rightPanelOpen && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setRightPanelOpen(true)}
                >
                  <Settings className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}