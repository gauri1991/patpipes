/**
 * Claims Builder - AI-Powered Patent Claim Generation
 * Interactive tool for creating and optimizing patent claims
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { prosecutionApi } from '@/lib/api/prosecution';
import { 
  Plus,
  Wand2,
  FileText,
  Copy,
  Download,
  Save,
  Trash2,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Lightbulb,
  Edit3,
  ArrowLeft,
  GitBranch,
  Network
} from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

// Empty array - no mock claims
interface ClaimItem {
  id: string;
  number: number;
  type: 'independent' | 'dependent' | 'multiple_dependent';
  text: string;
  status: 'draft' | 'review' | 'reviewed' | 'approved' | 'final' | string;
  suggestions: any[];
  dependsOn: (number | string)[];
}

const mockClaims: ClaimItem[] = [];

const claimTemplates = [
  {
    id: 'system',
    name: 'System Claim',
    description: 'Hardware/software system with components',
    template: 'A {invention_name}, comprising: {component_1}; {component_2}; and {component_3}.'
  },
  {
    id: 'method',
    name: 'Method Claim', 
    description: 'Process or method steps',
    template: 'A method of {action}, the method comprising: {step_1}; {step_2}; and {step_3}.'
  },
  {
    id: 'device',
    name: 'Device Claim',
    description: 'Physical device or apparatus',
    template: 'A device for {purpose}, the device comprising: {element_1}; {element_2}; and {element_3}.'
  }
];

export default function ClaimsBuilderPage() {
  const searchParams = useSearchParams();
  const applicationId = searchParams.get('applicationId');
  
  const [claims, setClaims] = useState(mockClaims);
  const [selectedClaim, setSelectedClaim] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('builder');
  const [isGenerating, setIsGenerating] = useState(false);
  const [inventionDescription, setInventionDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [applicationTitle, setApplicationTitle] = useState<string>('');
  const [pastedText, setPastedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectedClaims, setDetectedClaims] = useState<any[]>([]);
  const [showClaimTree, setShowClaimTree] = useState(false);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [showAutoDetectDialog, setShowAutoDetectDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'append' | 'overwrite' | null>(null);
  const [isSavingClaim, setIsSavingClaim] = useState(false);

  // Load claims for the specific application
  useEffect(() => {
    async function loadApplicationClaims() {
      if (!applicationId) {
        // No specific application, use mock data
        return;
      }

      setIsLoading(true);
      try {
        // Load application details for context
        const application = await prosecutionApi.getApplication(applicationId);
        setApplicationTitle(application.title || 'Untitled Patent Application');
        
        // Load claims for this application
        const claimsData = await prosecutionApi.getClaims(applicationId);
        
        // Ensure claimsData is an array and convert API claims to the format expected by the UI
        const claimsArray = Array.isArray(claimsData) ? claimsData : [];
        const formattedClaims = claimsArray.map(claim => ({
          id: claim.id,
          number: claim.claim_number,
          type: claim.claim_type,
          text: claim.claim_text,
          status: 'draft', // Could be enhanced with actual status from API
          suggestions: [], // Could be enhanced with AI suggestions
          dependsOn: Array.isArray(claim.depends_on) ? claim.depends_on : [] // Enhanced with dependency analysis
        }));
        
        setClaims(formattedClaims);
      } catch (error) {
        console.error('Failed to load claims:', error);
        // Set empty array on error
        setClaims([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadApplicationClaims();
  }, [applicationId]);

  // Check for claims text parameter and auto-open detection dialog
  useEffect(() => {
    const claimsTextParam = searchParams.get('claimsText');
    if (claimsTextParam) {
      // Decode the URL parameter and set it as pasted text
      const decodedText = decodeURIComponent(claimsTextParam);
      setPastedText(decodedText);
      setShowAutoDetectDialog(true);
      // Switch to builder tab to show the auto-detect dialog
      setActiveTab('builder');
    }
  }, [searchParams]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const getClaimStatusColor = (status: string) => {
    const colors = {
      draft: 'bg-yellow-100 text-yellow-800',
      reviewed: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      needs_work: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || colors.draft;
  };

  const getClaimTypeColor = (type: string) => {
    const colors = {
      independent: 'bg-purple-100 text-purple-800',
      dependent: 'bg-gray-100 text-gray-800',
      multiple_dependent: 'bg-orange-100 text-orange-800'
    };
    return colors[type as keyof typeof colors] || colors.independent;
  };

  const handleGenerateClaimFromTemplate = () => {
    if (!selectedTemplate || !inventionDescription) return;
    
    setIsGenerating(true);
    // Simulate AI processing
    setTimeout(() => {
      const template = claimTemplates.find(t => t.id === selectedTemplate);
      if (template) {
        const newClaim: ClaimItem = {
          id: String(claims.length + 1),
          number: claims.length + 1,
          type: 'independent' as const,
          text: `Generated claim based on: ${inventionDescription}`,
          status: 'draft' as const,
          suggestions: ['Review generated claim for accuracy', 'Consider adding dependent claims'],
          dependsOn: []
        };
        setClaims([...claims, newClaim]);
      }
      setIsGenerating(false);
    }, 2000);
  };

  const handleAIOptimizeClaim = (claimId: string) => {
    setIsGenerating(true);
    setTimeout(() => {
      setClaims(prevClaims => 
        prevClaims.map(claim => 
          claim.id === claimId 
            ? {
                ...claim,
                text: claim.text + ' [AI OPTIMIZED]',
                status: 'reviewed' as const,
                suggestions: ['Claim has been optimized for clarity and scope']
              }
            : claim
        )
      );
      setIsGenerating(false);
    }, 1500);
  };

  const handleDeleteClaim = async (claimId: string) => {
    if (!applicationId) return;
    
    try {
      await prosecutionApi.deleteClaim(claimId);
      setClaims(prevClaims => prevClaims.filter(claim => claim.id !== claimId));
    } catch (error) {
      console.error('Failed to delete claim:', error);
      // You might want to show an error toast here
    }
  };

  const handleSaveClaim = async (claimId: string, updatedText: string) => {
    if (!applicationId || isSavingClaim) return;
    
    const claim = claims.find(c => c.id === claimId);
    if (!claim) return;
    
    setIsSavingClaim(true);
    try {
      const updatedClaim = await prosecutionApi.updateClaim(claimId, {
        claim_text: updatedText
      });
      
      // Update local state with the response from API
      setClaims(prevClaims => 
        prevClaims.map(c => 
          c.id === claimId 
            ? {
                ...c,
                text: updatedClaim.claim_text,
                // Update other fields if they come back from API
                type: updatedClaim.claim_type || c.type,
                number: updatedClaim.claim_number || c.number
              }
            : c
        )
      );
    } catch (error) {
      console.error('Failed to save claim:', error);
      // You might want to show an error toast here
    } finally {
      setIsSavingClaim(false);
    }
  };

  const handleCreateClaim = async (claimData: any) => {
    if (!applicationId) return null;
    
    try {
      const payload = {
        application: applicationId,
        claim_text: claimData.text,
        claim_type: claimData.type,
        claim_number: claimData.number
      };
      
      console.log('Creating claim with payload:', payload);
      const newClaim = await prosecutionApi.createClaim(payload);
      
      const formattedClaim = {
        id: newClaim.id,
        number: newClaim.claim_number,
        type: newClaim.claim_type,
        text: newClaim.claim_text,
        status: 'draft',
        suggestions: [],
        dependsOn: [] // TODO: Handle dependencies properly
      };
      
      setClaims(prevClaims => [...prevClaims, formattedClaim]);
      return formattedClaim;
    } catch (error) {
      console.error('Failed to create claim:', error);
      return null;
    }
  };

  const handleAddClaim = async (type: 'independent' | 'dependent') => {
    const newClaimNumber = Math.max(...claims.map(c => c.number), 0) + 1;
    const claimData = {
      number: newClaimNumber,
      type,
      text: type === 'independent' 
        ? `A [invention description], comprising: [element 1]; [element 2]; and [element 3].`
        : `The [invention] of claim [claim number], wherein [additional feature].`,
      status: 'draft' as const,
      suggestions: [],
      dependsOn: type === 'dependent' ? [1] : []
    };
    
    const createdClaim = await handleCreateClaim(claimData);
    if (createdClaim) {
      setSelectedClaim(createdClaim.id);
    }
  };

  const parseClaimsFromText = (text: string) => {
    const claims: any[] = [];
    
    // Clean the text and normalize whitespace
    const cleanText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
    
    // Split by claim numbers using a more precise pattern
    // Look for patterns like "1." or "Claim 1:" at the start of lines
    const claimPattern = /(?:^|\n)\s*(?:(?:Claim\s+)?(\d+)\.\s*)/gi;
    
    let match;
    let lastIndex = 0;
    const claimSegments: { number: number; text: string }[] = [];
    
    // Find all claim numbers and their positions
    while ((match = claimPattern.exec(cleanText)) !== null) {
      // If this is not the first match, save the previous claim's text
      if (claimSegments.length > 0) {
        const prevClaim = claimSegments[claimSegments.length - 1];
        prevClaim.text = cleanText.substring(lastIndex, match.index).trim();
      }
      
      // Add new claim segment
      claimSegments.push({
        number: parseInt(match[1]),
        text: '' // Will be filled in next iteration or at the end
      });
      
      lastIndex = match.index + match[0].length;
    }
    
    // Handle the last claim
    if (claimSegments.length > 0) {
      const lastClaim = claimSegments[claimSegments.length - 1];
      lastClaim.text = cleanText.substring(lastIndex).trim();
    }
    
    // Process each claim segment
    claimSegments.forEach(segment => {
      const { number, text: claimContent } = segment;
      
      // Skip empty claims
      if (!claimContent || claimContent.length < 10) return;
      
      // Clean up the claim text - remove any remaining claim number prefixes
      const cleanedContent = claimContent.replace(/^(?:Claim\s+)?\d+\.?\s*/, '').trim();
      
      // Skip if still empty after cleaning
      if (!cleanedContent || cleanedContent.length < 10) return;
      
      // More comprehensive dependency detection patterns
      const dependencyPatterns = [
        /\bof\s+claim\s+(\d+)/gi,
        /\baccording\s+to\s+claim\s+(\d+)/gi,
        /\bin\s+accordance\s+with\s+claim\s+(\d+)/gi,
        /\bas\s+defined\s+in\s+claim\s+(\d+)/gi,
        /\bas\s+claimed\s+in\s+claim\s+(\d+)/gi,
        /\bof\s+any\s+(?:one\s+)?of\s+claims\s+([\d\s,and-]+)/gi,
        /\bof\s+claims\s+([\d\s,and-]+)/gi
      ];
      
      // Extract all dependencies
      const dependsOn: number[] = [];
      let isDependentClaim = false;
      
      dependencyPatterns.forEach(pattern => {
        let match;
        const tempPattern = new RegExp(pattern.source, pattern.flags);
        while ((match = tempPattern.exec(cleanedContent)) !== null) {
          isDependentClaim = true;
          const depText = match[1];
          
          // Handle single numbers
          if (/^\d+$/.test(depText)) {
            const depNum = parseInt(depText);
            if (depNum && depNum !== number && !dependsOn.includes(depNum)) {
              dependsOn.push(depNum);
            }
          } else {
            // Handle ranges and lists like "1, 2, 3" or "1-3"
            const numbers = depText.match(/\d+/g);
            if (numbers) {
              numbers.forEach(numStr => {
                const depNum = parseInt(numStr);
                if (depNum && depNum !== number && !dependsOn.includes(depNum)) {
                  dependsOn.push(depNum);
                }
              });
            }
          }
        }
      });
      
      // Additional check for common dependent claim patterns
      if (!isDependentClaim) {
        const dependentPhrases = [
          /^The\s+.*?\s+of\s+claim\s+\d+/i,
          /^The\s+.*?\s+according\s+to\s+claim\s+\d+/i,
          /^A\s+.*?\s+of\s+claim\s+\d+/i,
          /^An\s+.*?\s+of\s+claim\s+\d+/i
        ];
        
        isDependentClaim = dependentPhrases.some(pattern => pattern.test(cleanedContent));
      }
      
      // Sort dependencies
      dependsOn.sort((a, b) => a - b);
      
      claims.push({
        id: `detected-${number}-${Date.now()}`,
        number,
        type: isDependentClaim && dependsOn.length > 0 ? 'dependent' : 'independent',
        text: cleanedContent,
        status: 'draft',
        suggestions: [],
        dependsOn
      });
    });
    
    // Remove duplicates based on number and similar text
    const uniqueClaims = claims.filter((claim, index, arr) => {
      return arr.findIndex(c => c.number === claim.number && 
        c.text.substring(0, 50) === claim.text.substring(0, 50)) === index;
    });
    
    // Sort claims with dependent claims grouped under their parents
    const sortedClaims: ClaimItem[] = [];
    const independentClaims = uniqueClaims.filter((c: ClaimItem) => c.type === 'independent').sort((a: ClaimItem, b: ClaimItem) => a.number - b.number);
    const dependentClaims = uniqueClaims.filter((c: ClaimItem) => c.type === 'dependent');
    
    // Add each independent claim followed by its dependent claims
    independentClaims.forEach(independentClaim => {
      sortedClaims.push(independentClaim);
      
      // Find all dependent claims that depend on this independent claim
      const directDependents = dependentClaims
        .filter(depClaim => depClaim.dependsOn.includes(independentClaim.number))
        .sort((a, b) => a.number - b.number);
      
      // Add direct dependents
      directDependents.forEach(depClaim => {
        sortedClaims.push(depClaim);
        
        // Find claims that depend on this dependent claim (nested dependencies)
        const nestedDependents = dependentClaims
          .filter(nestedClaim => 
            nestedClaim.dependsOn.includes(depClaim.number) && 
            !sortedClaims.includes(nestedClaim)
          )
          .sort((a, b) => a.number - b.number);
        
        sortedClaims.push(...nestedDependents);
      });
    });
    
    // Add any remaining dependent claims that weren't grouped (orphaned dependents)
    const orphanedDependents = dependentClaims.filter(depClaim => !sortedClaims.includes(depClaim));
    sortedClaims.push(...orphanedDependents.sort((a, b) => a.number - b.number));
    
    return sortedClaims;
  };

  const handleProcessPastedText = () => {
    if (!pastedText.trim()) return;
    
    setIsProcessing(true);
    
    // Simulate processing time
    setTimeout(() => {
      const detected = parseClaimsFromText(pastedText);
      setDetectedClaims(detected);
      setIsProcessing(false);
    }, 1500);
  };

  const handleAppendClaims = () => {
    setConfirmAction('append');
    setShowConfirmDialog(true);
  };

  const handleOverwriteClaims = () => {
    setConfirmAction('overwrite');
    setShowConfirmDialog(true);
  };

  const executeClaimsAction = async () => {
    if (!applicationId) return;
    
    try {
      if (confirmAction === 'overwrite') {
        // Delete all existing claims first
        await Promise.all(claims.map(claim => prosecutionApi.deleteClaim(claim.id)));
      }
      
      // Create new claims in the database
      const createdClaims: ClaimItem[] = [];

      if (confirmAction === 'append') {
        const maxExistingNumber = Math.max(...claims.map(c => c.number), 0);
        
        for (let i = 0; i < detectedClaims.length; i++) {
          const detectedClaim = detectedClaims[i];
          const claimData = {
            application: applicationId,
            claim_text: detectedClaim.text,
            claim_type: detectedClaim.type,
            claim_number: maxExistingNumber + i + 1
          };
          
          const newClaim = await prosecutionApi.createClaim(claimData);
          createdClaims.push({
            id: newClaim.id,
            number: newClaim.claim_number,
            type: newClaim.claim_type,
            text: newClaim.claim_text,
            status: 'draft',
            suggestions: [],
            dependsOn: detectedClaim.dependsOn || []
          });
        }
        
        setClaims(prevClaims => [...prevClaims, ...createdClaims]);
      } else if (confirmAction === 'overwrite') {
        // First, delete all existing claims
        const freshClaims = await prosecutionApi.getClaims(applicationId);

        // Handle paginated response - claims are in the 'results' array
        const claimsArray = Array.isArray(freshClaims) ? freshClaims : ((freshClaims as any)?.results || []);
        
        if (claimsArray.length > 0) {
          // Delete each existing claim
          for (const claim of claimsArray) {
            try {
              await prosecutionApi.deleteClaim(claim.id);
            } catch (deleteError) {
              console.error('Failed to delete claim:', claim.id, deleteError);
              // Continue with other deletions even if one fails
            }
          }
        }
        
        // Small delay to ensure deletions are processed
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Create new claims starting from claim_number 1
        for (let i = 0; i < detectedClaims.length; i++) {
          const detectedClaim = detectedClaims[i];
          const claimData = {
            application: applicationId,
            claim_text: detectedClaim.text,
            claim_type: detectedClaim.type,
            claim_number: i + 1 // Start fresh from 1
          };
          
          const newClaim = await prosecutionApi.createClaim(claimData);
          createdClaims.push({
            id: newClaim.id,
            number: newClaim.claim_number,
            type: newClaim.claim_type,
            text: newClaim.claim_text,
            status: 'draft',
            suggestions: [],
            dependsOn: detectedClaim.dependsOn || []
          });
        }
        
        setClaims(createdClaims);
      }
    } catch (error) {
      console.error('Failed to execute claims action:', error);
      // You might want to show an error toast here
    }
    
    // Clean up
    setDetectedClaims([]);
    setPastedText('');
    setShowAutoDetectDialog(false);
    setShowConfirmDialog(false);
    setConfirmAction(null);
    setActiveTab('editor');
  };

  const handleAddSingleDetectedClaim = async (detectedClaim: any) => {
    const maxExistingNumber = Math.max(...claims.map(c => c.number), 0);
    
    const claimData = {
      ...detectedClaim,
      number: maxExistingNumber + 1
    };
    
    const createdClaim = await handleCreateClaim(claimData);
    if (createdClaim) {
      setSelectedClaim(createdClaim.id);
      setShowAutoDetectDialog(false);
      setActiveTab('editor');
    }
  };

  const handleSuggestDependentClaims = () => {
    const independentClaims = claims.filter(claim => claim.type === 'independent');
    if (independentClaims.length === 0) return;

    setIsGeneratingSuggestions(true);
    
    // Simulate AI processing
    setTimeout(() => {
      const suggestions = independentClaims.flatMap(independentClaim => {
        const baseNumber = Math.max(...claims.map(c => c.number), 0);
        return [
          {
            id: `suggested-${Date.now()}-1`,
            number: baseNumber + 1,
            type: 'dependent' as const,
            text: `The ${independentClaim.text.split(',')[0].toLowerCase()} of claim ${independentClaim.number}, wherein the system further comprises additional processing capabilities.`,
            status: 'draft' as const,
            suggestions: ['AI-generated suggestion - review for accuracy'],
            dependsOn: [independentClaim.number]
          },
          {
            id: `suggested-${Date.now()}-2`,
            number: baseNumber + 2,
            type: 'dependent' as const,
            text: `The ${independentClaim.text.split(',')[0].toLowerCase()} of claim ${independentClaim.number}, further including enhanced security features.`,
            status: 'draft' as const,
            suggestions: ['AI-generated suggestion - review for accuracy'],
            dependsOn: [independentClaim.number]
          }
        ];
      });
      
      // Update claim numbers to be sequential
      const updatedSuggestions = suggestions.map((claim, index) => ({
        ...claim,
        number: Math.max(...claims.map(c => c.number), 0) + index + 1
      }));
      
      setClaims(prevClaims => [...prevClaims, ...updatedSuggestions]);
      setIsGeneratingSuggestions(false);
    }, 2000);
  };

  const buildClaimTree = () => {
    const independentClaims = claims.filter(claim => claim.type === 'independent');
    const dependentClaims = claims.filter(claim => claim.type === 'dependent');
    
    return independentClaims.map(independentClaim => {
      const children = dependentClaims.filter(depClaim => 
        depClaim.dependsOn?.includes(independentClaim.number)
      );
      
      return {
        ...independentClaim,
        children: children.map(child => {
          const grandChildren = dependentClaims.filter(grandChild =>
            grandChild.dependsOn?.includes(child.number) && 
            grandChild.id !== child.id
          );
          return {
            ...child,
            children: grandChildren
          };
        })
      };
    });
  };

  const handleUpdateClaimDependency = (claimId: string, newDependsOn: number[]) => {
    setClaims(prevClaims =>
      prevClaims.map(claim =>
        claim.id === claimId
          ? { ...claim, dependsOn: newDependsOn }
          : claim
      )
    );
  };

  const renderTreeNode = (node: any, level = 0) => {
    const indent = level * 24;
    
    return (
      <div key={node.id} className="space-y-2">
        <div 
          className="flex items-center gap-2 p-2 rounded hover:bg-accent cursor-pointer"
          style={{ marginLeft: `${indent}px` }}
          onClick={() => setSelectedClaim(node.id)}
        >
          <div className={`w-3 h-3 rounded-full ${
            node.type === 'independent' ? 'bg-purple-500' : 'bg-gray-500'
          }`} />
          <span className="font-medium">Claim {node.number}</span>
          <Badge className={getClaimTypeColor(node.type)}>
            {node.type}
          </Badge>
          {node.dependsOn?.length > 0 && (
            <Badge variant="outline">
              → {node.dependsOn.join(', ')}
            </Badge>
          )}
        </div>
        <div className="text-xs text-muted-foreground" style={{ marginLeft: `${indent + 20}px` }}>
          {node.text.substring(0, 100)}...
        </div>
        
        {node.children?.map((child: any) => renderTreeNode(child, level + 1))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with breadcrumb */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {applicationId ? (
            <Link href={`/dashboard/prosecution/drafting/${applicationId}`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Draft
              </Button>
            </Link>
          ) : (
            <Link href="/dashboard/prosecution">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Prosecution
              </Button>
            </Link>
          )}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Claims Builder</h1>
            <p className="text-muted-foreground">
              {applicationId && applicationTitle ? 
                `Editing claims for: ${applicationTitle}` : 
                'AI-powered patent claim generation and optimization'
              }
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Claims
          </Button>
          <Button>
            <Save className="h-4 w-4 mr-2" />
            Save Draft
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="builder">Claim Builder</TabsTrigger>
          <TabsTrigger value="editor">Claim Editor</TabsTrigger>
          <TabsTrigger value="analyzer">AI Analyzer</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="builder" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Input Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wand2 className="h-5 w-5 text-blue-500" />
                  AI Claim Generation
                </CardTitle>
                <CardDescription>
                  Describe your invention to generate patent claims
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="invention">Invention Description</Label>
                  <Textarea
                    id="invention"
                    placeholder="Describe your invention, its key features, components, and how it works..."
                    value={inventionDescription}
                    onChange={(e) => setInventionDescription(e.target.value)}
                    className="min-h-32"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Claim Template</Label>
                  <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a claim template" />
                    </SelectTrigger>
                    <SelectContent>
                      {claimTemplates.map(template => (
                        <SelectItem key={template.id} value={template.id}>
                          <div>
                            <div className="font-medium">{template.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {template.description}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={handleGenerateClaimFromTemplate}
                  disabled={!selectedTemplate || !inventionDescription || isGenerating}
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 mr-2" />
                      Generate Claims
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common claim building tasks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Dialog open={showAutoDetectDialog} onOpenChange={setShowAutoDetectDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <Wand2 className="h-4 w-4 mr-2" />
                      Auto-Detect Claims
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
                    <DialogHeader className="flex-shrink-0">
                      <DialogTitle>Auto-Detect Claims from Text</DialogTitle>
                      <DialogDescription>
                        Paste your text below and we'll automatically identify and extract independent and dependent claims.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-hidden flex flex-col space-y-4">
                      <div className="space-y-2 flex-shrink-0">
                        <Label htmlFor="paste-text">Paste Claims Text</Label>
                        <Textarea
                          id="paste-text"
                          placeholder="Paste your claims text here. The system will analyze and identify claim types, dependencies, and structure..."
                          value={pastedText}
                          onChange={(e) => setPastedText(e.target.value)}
                          className="h-32"
                        />
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <Button 
                          onClick={handleProcessPastedText}
                          disabled={!pastedText.trim() || isProcessing}
                        >
                          {isProcessing ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Wand2 className="h-4 w-4 mr-2" />
                              Process Text
                            </>
                          )}
                        </Button>
                        <Button variant="outline" onClick={() => setPastedText('')}>
                          Clear
                        </Button>
                      </div>
                      
                      {/* Detected Claims Display */}
                      {detectedClaims.length > 0 && (
                        <div className="flex-1 flex flex-col border-t pt-4 min-h-0">
                          <div className="flex items-center justify-between mb-3 flex-shrink-0">
                            <h3 className="text-lg font-semibold">
                              Detected Claims ({detectedClaims.length})
                            </h3>
                            <div className="flex items-center gap-2">
                              <Button onClick={handleAppendClaims} size="sm" variant="outline">
                                Append All
                              </Button>
                              <Button onClick={handleOverwriteClaims} size="sm">
                                Overwrite All
                              </Button>
                            </div>
                          </div>
                          <div className="flex-1 overflow-y-auto border rounded-lg bg-gray-50">
                            <div className="p-3 space-y-3">
                              {detectedClaims.map((detectedClaim, index) => (
                                <Card key={index} className="p-3 bg-white shadow-sm">
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      <Badge className={getClaimTypeColor(detectedClaim.type)}>
                                        {detectedClaim.type}
                                      </Badge>
                                      <span className="text-sm font-medium">
                                        Claim {detectedClaim.number}
                                      </span>
                                      {detectedClaim.dependsOn && detectedClaim.dependsOn.length > 0 && (
                                        <Badge variant="outline" className="text-xs">
                                          Depends on: {detectedClaim.dependsOn.join(', ')}
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="flex-1">
                                        <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">
                                          {detectedClaim.text}
                                        </p>
                                      </div>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleAddSingleDetectedClaim(detectedClaim)}
                                        className="shrink-0"
                                      >
                                        Add
                                      </Button>
                                    </div>
                                  </div>
                                </Card>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Import from Specification
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="editor" className="space-y-4">
          {/* Add Claim Buttons */}
          <div className="flex items-center gap-3 mb-4">
            <Button onClick={() => handleAddClaim('independent')} variant="default">
              <Plus className="h-4 w-4 mr-2" />
              Add Independent Claim
            </Button>
            <Button onClick={() => handleAddClaim('dependent')} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Dependent Claim
            </Button>
            <Button 
              onClick={handleSuggestDependentClaims} 
              variant="outline"
              disabled={isGeneratingSuggestions || claims.filter(c => c.type === 'independent').length === 0}
            >
              {isGeneratingSuggestions ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Suggest Dependent Claims
                </>
              )}
            </Button>
            <Button onClick={() => setShowClaimTree(true)} variant="outline">
              <GitBranch className="h-4 w-4 mr-2" />
              Claim Tree
            </Button>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Claims List */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Claims ({claims.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-1 max-h-80 overflow-y-auto">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-muted-foreground">Loading claims...</div>
                    </div>
                  ) : (
                    claims.map((claim) => {
                      // Calculate dependency indentation level
                      const getIndentLevel = (claimItem: any) => {
                        if (claimItem.type === 'independent') return 0;
                        if (!claimItem.dependsOn || claimItem.dependsOn.length === 0) return 0;
                        
                        // Find the parent claim with the lowest number
                        const parentNumber = Math.min(...claimItem.dependsOn);
                        const parentClaim = claims.find(c => c.number === parentNumber);
                        
                        if (!parentClaim) return 1;
                        return parentClaim.type === 'independent' ? 1 : 2;
                      };
                      
                      const indentLevel = getIndentLevel(claim);
                      const indentClass = indentLevel === 1 ? 'ml-4' : indentLevel === 2 ? 'ml-8' : '';
                      
                      return (
                        <div
                          key={claim.id}
                          className={`p-3 cursor-pointer border-l-4 hover:bg-accent ${indentClass} ${
                            selectedClaim === claim.id 
                              ? 'bg-accent border-l-primary' 
                              : 'border-l-transparent'
                          }`}
                          onClick={() => setSelectedClaim(claim.id)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {/* Dependency indicators */}
                              {claim.type === 'dependent' && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <GitBranch className="h-3 w-3" />
                                  <span>→</span>
                                </div>
                              )}
                              <span className="font-medium">Claim {claim.number}</span>
                              <Badge className={getClaimTypeColor(claim.type)}>
                                {claim.type}
                              </Badge>
                              {/* Show dependency info */}
                              {claim.dependsOn && claim.dependsOn.length > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  depends on: {claim.dependsOn.join(', ')}
                                </Badge>
                              )}
                            </div>
                            <Badge className={getClaimStatusColor(claim.status)}>
                              {claim.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {claim.text}
                          </p>
                          {claim.suggestions.length > 0 && (
                            <div className="flex items-center gap-1 mt-2 text-xs text-orange-600">
                              <AlertCircle className="h-3 w-3" />
                              {claim.suggestions.length} suggestions
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Editor */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {selectedClaim ? `Editing Claim ${claims.find(c => c.id === selectedClaim)?.number}` : 'Select a Claim'}
                  {selectedClaim && (
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleAIOptimizeClaim(selectedClaim)}
                        disabled={isGenerating}
                      >
                        <Wand2 className="h-4 w-4 mr-2" />
                        AI Optimize
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDeleteClaim(selectedClaim)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedClaim ? (
                  <div className="space-y-4">
                    <Textarea
                      ref={textareaRef}
                      value={claims.find(c => c.id === selectedClaim)?.text || ''}
                      onChange={(e) => {
                        // Update local state immediately for responsive UI
                        setClaims(prevClaims =>
                          prevClaims.map(claim =>
                            claim.id === selectedClaim
                              ? { ...claim, text: e.target.value }
                              : claim
                          )
                        );
                      }}
                      onBlur={(e) => {
                        // Save to database when user stops editing
                        if (selectedClaim && e.target.value !== claims.find(c => c.id === selectedClaim)?.text) {
                          handleSaveClaim(selectedClaim, e.target.value);
                        }
                      }}
                      className="min-h-48 text-sm leading-relaxed"
                      placeholder="Enter your claim text here..."
                    />
                    
                    {/* AI Suggestions */}
                    {selectedClaim && claims.find(c => c.id === selectedClaim)?.suggestions.length! > 0 && (
                      <Card className="border-orange-200 bg-orange-50">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Lightbulb className="h-4 w-4 text-orange-500" />
                            AI Suggestions
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <ul className="space-y-2">
                            {claims.find(c => c.id === selectedClaim)?.suggestions.map((suggestion: string, index: number) => (
                              <li key={index} className="text-sm flex items-start gap-2">
                                <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                                {suggestion}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Select a claim from the list to start editing</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analyzer" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Claim Analysis</CardTitle>
              <CardDescription>
                Comprehensive analysis of your patent claims
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Wand2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">AI Analysis Coming Soon</h3>
                <p className="text-muted-foreground mb-4">
                  Advanced claim analysis including prior art check, scope analysis, and optimization recommendations
                </p>
                <Button>Run Analysis</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {claimTemplates.map((template) => (
              <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-base">{template.name}</CardTitle>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted p-3 rounded-md text-sm font-mono mb-3">
                    {template.template}
                  </div>
                  <Button size="sm" className="w-full">
                    Use Template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Claim Tree Dialog */}
      <Dialog open={showClaimTree} onOpenChange={setShowClaimTree}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5" />
              Claim Dependency Tree
            </DialogTitle>
            <DialogDescription>
              Visualize and edit the relationships between your patent claims. Click on any claim to select it for editing.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Tree Legend */}
            <div className="flex items-center gap-6 p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                <span className="text-sm">Independent Claims</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-500" />
                <span className="text-sm">Dependent Claims</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">→ 1, 2</Badge>
                <span className="text-sm">Dependencies</span>
              </div>
            </div>

            {/* Tree Visualization */}
            <div className="border rounded-lg p-4 max-h-96 overflow-y-auto">
              {claims.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <GitBranch className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No claims to display</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {buildClaimTree().map(tree => renderTreeNode(tree))}
                  
                  {/* Orphaned dependent claims */}
                  {claims.filter(claim => 
                    claim.type === 'dependent' && 
                    !buildClaimTree().some(tree => 
                      tree.children?.some((child: any) => child.id === claim.id) ||
                      tree.children?.some((child: any) => 
                        child.children?.some((grandChild: any) => grandChild.id === claim.id)
                      )
                    )
                  ).map(orphan => (
                    <div key={orphan.id} className="border-l-2 border-dashed border-orange-300 pl-4">
                      <div className="flex items-center gap-2 p-2 rounded bg-orange-50">
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                        <span className="font-medium text-orange-700">Orphaned Claim {orphan.number}</span>
                        <Badge className="bg-orange-100 text-orange-800">
                          No valid parent
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {orphan.text.substring(0, 100)}...
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tree Actions */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => setActiveTab('editor')}>
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit Selected
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => setShowClaimTree(false)}>
                  Close
                </Button>
                <Button size="sm" onClick={() => {
                  // Export tree structure
                  const treeData = buildClaimTree();
                  console.log('Claim tree structure:', treeData);
                }}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Tree
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmAction === 'append' ? 'Append Claims' : 'Overwrite Claims'}
            </DialogTitle>
            <DialogDescription>
              {confirmAction === 'append' ? (
                `Are you sure you want to append ${detectedClaims.length} detected claims to your existing ${claims.length} claims? This will add the new claims to the end of your current list.`
              ) : (
                `Are you sure you want to replace all ${claims.length} existing claims with ${detectedClaims.length} detected claims? This action cannot be undone.`
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-end gap-3 mt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowConfirmDialog(false);
                setConfirmAction(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={executeClaimsAction}
              variant={confirmAction === 'overwrite' ? 'destructive' : 'default'}
            >
              {confirmAction === 'append' ? 'Append Claims' : 'Overwrite Claims'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}