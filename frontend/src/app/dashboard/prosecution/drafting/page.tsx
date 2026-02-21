/**
 * Patent Drafting Hub
 * Overview of drafting projects and templates
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Plus,
  FileText,
  Clock,
  Users,
  ChevronRight,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Copy,
  Trash2,
  Loader2,
  ArrowLeft
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { prosecutionApi } from '@/lib/api/prosecution';
import { PatentApplication } from '@/types/prosecution';

// Mock data for development (using real database UUIDs)
const mockDrafts = [
  {
    id: '00000001-0000-0000-0000-000000000000',
    title: 'Advanced Machine Learning Algorithm for Patent Analysis',
    office: 'USPTO',
    status: 'draft',
    progress: 75,
    sections: 8,
    completedSections: 6,
    lastModified: '2024-01-15',
    collaborators: ['John Smith', 'Sarah Johnson'],
    wordCount: 12450
  },
  {
    id: '00000002-0000-0000-0000-000000000000',
    title: 'Improved Battery Management System',
    office: 'EPO',
    status: 'review',
    progress: 90,
    sections: 7,
    completedSections: 7,
    lastModified: '2024-01-14',
    collaborators: ['Mike Wilson'],
    wordCount: 8750
  },
  {
    id: '00000003-0000-0000-0000-000000000000',
    title: 'Novel User Interface Design',
    office: 'USPTO',
    status: 'draft',
    progress: 45,
    sections: 6,
    completedSections: 3,
    lastModified: '2024-01-13',
    collaborators: ['Sarah Johnson', 'Lisa Chen'],
    wordCount: 5240
  }
];

const draftTemplates = [
  {
    id: 'utility-software',
    name: 'Software/AI Patent',
    description: 'Template for software and artificial intelligence inventions',
    office: 'USPTO',
    sections: 8,
    estimatedTime: '4-6 hours'
  },
  {
    id: 'utility-hardware',
    name: 'Hardware Device',
    description: 'Template for physical devices and apparatus',
    office: 'USPTO',
    sections: 9,
    estimatedTime: '6-8 hours'
  },
  {
    id: 'epo-standard',
    name: 'EPO Standard',
    description: 'European Patent Office compliant template',
    office: 'EPO',
    sections: 8,
    estimatedTime: '5-7 hours'
  }
];

// Helper function to calculate word count from all text fields
function calculateTotalWordCount(application: PatentApplication): number {
  const textFields = [
    application.title,
    application.abstract,
    application.background,
    application.summary,
    application.detailed_description,
    application.technology_area
  ];
  
  return textFields.reduce((total, field) => {
    if (!field) return total;
    return total + field.split(' ').filter(word => word.trim()).length;
  }, 0);
}

// Helper function to count claims
function countClaims(application: PatentApplication): number {
  if (!application.claims || !Array.isArray(application.claims)) return 0;
  return application.claims.length;
}

// Helper function to calculate progress
function calculateProgress(application: PatentApplication): number {
  const sections = [
    'title',
    'abstract', 
    'background',
    'summary',
    'detailed_description',
    'technology_area',
    'claims'
  ];
  
  let completedCount = 0;
  
  if (application.title && application.title.trim()) completedCount++;
  if (application.abstract && application.abstract.trim()) completedCount++;
  if (application.background && application.background.trim()) completedCount++;
  if (application.summary && application.summary.trim()) completedCount++;
  if (application.detailed_description && application.detailed_description.trim()) completedCount++;
  if (application.technology_area && application.technology_area.trim()) completedCount++;
  if (application.claims && application.claims.length > 0) completedCount++;
  
  return Math.round((completedCount / sections.length) * 100);
}

export default function DraftingHub() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOffice, setSelectedOffice] = useState('all');
  const [drafts, setDrafts] = useState<PatentApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isDuplicating, setIsDuplicating] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<{ draftId: string; field: 'jurisdiction' | 'status' } | null>(null);
  const [isCreatingDraft, setIsCreatingDraft] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  // Fetch drafts from backend
  useEffect(() => {
    async function fetchDrafts() {
      try {
        setIsLoading(true);
        setError(null);
        const response = await prosecutionApi.getApplications();
        
        // Handle paginated response
        const applications = Array.isArray(response) ? response : (response as any).results || [];
        
        // Debug: Log the first application to see what fields are available
        if (applications.length > 0) {
          console.log('Sample application data:', applications[0]);
        }
        
        // Fetch full details for each application to get all text fields
        const fullApplications = await Promise.all(
          applications.slice(0, 10).map(async (app: PatentApplication) => {
            try {
              const fullData = await prosecutionApi.getApplication(app.id);
              return fullData;
            } catch (error) {
              console.error(`Failed to fetch full data for ${app.id}:`, error);
              return app; // Return partial data if full fetch fails
            }
          })
        );
        
        setDrafts(fullApplications);
      } catch (err) {
        console.error('Failed to fetch drafts:', err);
        setError('Failed to load drafts');
        // Fall back to mock data if backend fails
        setDrafts([]);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchDrafts();
  }, []);

  // Filter drafts based on search and office
  const filteredDrafts = useMemo(() => {
    let filtered = drafts;
    
    if (searchQuery) {
      filtered = filtered.filter(draft => 
        draft.title?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (selectedOffice !== 'all') {
      filtered = filtered.filter(draft => 
        draft.jurisdiction === selectedOffice
      );
    }
    
    return filtered;
  }, [drafts, searchQuery, selectedOffice]);

  // Handle duplicate draft
  const handleDuplicate = async (draftId: string) => {
    try {
      setIsDuplicating(draftId);
      
      // Get the original application data
      const originalApp = await prosecutionApi.getApplication(draftId);
      
      // Create a copy with modified title and reset status
      const duplicateData: Partial<PatentApplication> = {
        ...originalApp,
        title: `${originalApp.title} (Copy)`,
        status: 'draft' as const,
        created_at: undefined,
        updated_at: undefined,
        id: undefined // Let backend assign new ID
      };
      
      // Create the new application
      const newApp = await prosecutionApi.createApplication(duplicateData);
      
      // If the original has claims, duplicate them too
      if (originalApp.claims && originalApp.claims.length > 0) {
        for (const claim of originalApp.claims) {
          await prosecutionApi.createClaim({
            application: newApp.id,
            claim_text: claim.claim_text,
            claim_type: claim.claim_type,
            claim_number: claim.claim_number
          });
        }
      }
      
      // Refresh the drafts list
      const response = await prosecutionApi.getApplications();
      const applications = Array.isArray(response) ? response : (response as any).results || [];
      const fullApplications = await Promise.all(
        applications.slice(0, 10).map(async (app: PatentApplication) => {
          try {
            return await prosecutionApi.getApplication(app.id);
          } catch (error) {
            return app;
          }
        })
      );
      setDrafts(fullApplications);
      
    } catch (error) {
      console.error('Failed to duplicate draft:', error);
      setError('Failed to duplicate draft');
    } finally {
      setIsDuplicating(null);
    }
  };

  // Handle delete draft
  const handleDelete = async (draftId: string) => {
    if (!confirm('Are you sure you want to delete this draft? This action cannot be undone.')) {
      return;
    }
    
    try {
      setIsDeleting(draftId);
      
      // Delete the application
      await prosecutionApi.deleteApplication(draftId);
      
      // Remove from local state
      setDrafts(prev => prev.filter(draft => draft.id !== draftId));
      
    } catch (error) {
      console.error('Failed to delete draft:', error);
      setError('Failed to delete draft');
    } finally {
      setIsDeleting(null);
    }
  };

  // Handle field updates
  const handleFieldUpdate = async (draftId: string, field: 'jurisdiction' | 'status', value: string) => {
    try {
      const updateData = { [field]: value };
      await prosecutionApi.updateApplication(draftId, updateData);
      
      // Update local state
      setDrafts(prev => prev.map(draft => 
        draft.id === draftId ? { ...draft, [field]: value } : draft
      ));
      
      setEditingField(null);
    } catch (error) {
      console.error('Failed to update field:', error);
      setError(`Failed to update ${field}`);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      draft: 'bg-yellow-100 text-yellow-800',
      review: 'bg-blue-100 text-blue-800',
      ready: 'bg-green-100 text-green-800',
      filed: 'bg-gray-100 text-gray-800',
      pending: 'bg-blue-100 text-blue-800',
      under_examination: 'bg-purple-100 text-purple-800',
      office_action: 'bg-orange-100 text-orange-800',
      allowed: 'bg-green-100 text-green-800',
      granted: 'bg-green-100 text-green-800',
      abandoned: 'bg-red-100 text-red-800',
      rejected: 'bg-red-100 text-red-800',
      withdrawn: 'bg-gray-100 text-gray-800'
    };
    return colors[status as keyof typeof colors] || colors.draft;
  };

  const getOfficeColor = (office: string) => {
    const colors = {
      US: 'bg-blue-100 text-blue-800',
      EP: 'bg-purple-100 text-purple-800',
      JP: 'bg-red-100 text-red-800',
      CN: 'bg-yellow-100 text-yellow-800',
      KR: 'bg-green-100 text-green-800',
      CA: 'bg-red-100 text-red-800',
      AU: 'bg-orange-100 text-orange-800',
      IN: 'bg-purple-100 text-purple-800',
      PCT: 'bg-gray-100 text-gray-800'
    };
    return colors[office as keyof typeof colors] || colors.US;
  };

  // Format date helper
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'No date';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  // Handle creating new draft
  const handleCreateNewDraft = async () => {
    try {
      setIsCreatingDraft(true);
      
      const newDraftData: Partial<PatentApplication> = {
        title: 'Untitled Patent Draft',
        application_type: 'utility' as const,
        status: 'draft' as const,
        jurisdiction: 'US' as const,
        organization: '93c91ae7-0f2b-41ff-9b88-6c99763a5273',
        technology_area: '',
        abstract: '',
        background: '',
        summary: '',
        detailed_description: '',
        inventors: [],
        assignees: [],
        ipc_classes: [],
        us_classes: [],
        keywords: [],
        estimated_value: 0,
        costs_to_date: 0,
        estimated_total_cost: 0,
        is_confidential: true,
        priority_level: 'medium' as const
      };
      
      console.log('Creating new draft with data:', newDraftData);
      const newDraft = await prosecutionApi.createApplication(newDraftData);
      console.log('New draft created:', newDraft);
      
      // Use Next.js router for proper navigation
      router.push(`/dashboard/prosecution/drafting/${newDraft.id}`);
      
    } catch (error) {
      console.error('Failed to create new draft:', error);
      setError(`Failed to create new draft: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsCreatingDraft(false);
    }
  };

  // Handle creating draft from template
  const handleCreateFromTemplate = async (templateId: string) => {
    try {
      setIsCreatingDraft(true);
      
      const template = draftTemplates.find(t => t.id === templateId);
      if (!template) return;
      
      let templateData;
      
      // Define template-specific content  
      const baseTemplateData: Partial<PatentApplication> = {
        application_type: 'utility' as const,
        status: 'draft' as const,
        organization: '93c91ae7-0f2b-41ff-9b88-6c99763a5273',
        inventors: [],
        assignees: [],
        ipc_classes: [],
        us_classes: [],
        keywords: [],
        estimated_value: 0,
        costs_to_date: 0,
        estimated_total_cost: 0,
        is_confidential: true,
        priority_level: 'medium' as const
      };

      switch (templateId) {
        case 'utility-software':
          templateData = {
            ...baseTemplateData,
            title: 'Software Patent Application',
            jurisdiction: 'US' as const,
            technology_area: 'Computer software and artificial intelligence systems',
            abstract: 'A software system for processing data using artificial intelligence algorithms...',
            background: 'Software applications have increasingly relied on artificial intelligence and machine learning techniques to process complex data sets...',
            summary: 'According to one embodiment, a software system is provided comprising a processor configured to execute machine learning algorithms...',
            detailed_description: 'The present invention relates to software systems that utilize artificial intelligence for data processing. The system comprises various modules including data input handlers, processing engines, and output generators...'
          };
          break;
          
        case 'utility-hardware':
          templateData = {
            ...baseTemplateData,
            title: 'Hardware Device Patent Application',
            jurisdiction: 'US' as const,
            technology_area: 'Electronic devices and apparatus',
            abstract: 'A hardware device comprising electronic components for performing specialized functions...',
            background: 'Traditional hardware devices have limitations in functionality and efficiency...',
            summary: 'According to one embodiment, a hardware device is provided comprising electronic circuits and components...',
            detailed_description: 'The present invention relates to hardware devices with improved functionality. The device comprises various electronic components including processors, memory modules, and input/output interfaces...'
          };
          break;
          
        case 'epo-standard':
          templateData = {
            ...baseTemplateData,
            title: 'European Patent Application',
            jurisdiction: 'EP' as const,
            technology_area: 'Technical field of the invention',
            abstract: 'The invention relates to a technical solution addressing specific problems...',
            background: 'The prior art shows various approaches to solving technical problems...',
            summary: 'The invention provides a technical solution comprising specific elements...',
            detailed_description: 'The invention will be described in detail with reference to the accompanying drawings. The technical solution comprises...'
          };
          break;
          
        default:
          templateData = {
            ...baseTemplateData,
            title: 'Patent Application from Template',
            jurisdiction: template.office === 'EPO' ? 'EP' as const : 'US' as const,
            technology_area: '',
            abstract: '',
            background: '',
            summary: '',
            detailed_description: ''
          };
      }
      
      const newDraft = await prosecutionApi.createApplication(templateData);
      
      // Use Next.js router for proper navigation
      router.push(`/dashboard/prosecution/drafting/${newDraft.id}`);
      
    } catch (error) {
      console.error('Failed to create draft from template:', error);
      setError(`Failed to create draft from template: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsCreatingDraft(false);
    }
  };

  // Available options for editing
  const jurisdictionOptions = [
    { value: 'US', label: 'US' },
    { value: 'EP', label: 'EP' },
    { value: 'JP', label: 'JP' },
    { value: 'CN', label: 'CN' },
    { value: 'KR', label: 'KR' },
    { value: 'CA', label: 'CA' },
    { value: 'AU', label: 'AU' },
    { value: 'IN', label: 'IN' },
    { value: 'PCT', label: 'PCT' }
  ];

  const statusOptions = [
    { value: 'draft', label: 'Draft' },
    { value: 'review', label: 'Review' },
    { value: 'ready', label: 'Ready' },
    { value: 'filed', label: 'Filed' },
    { value: 'pending', label: 'Pending' },
    { value: 'under_examination', label: 'Under Examination' },
    { value: 'office_action', label: 'Office Action' },
    { value: 'allowed', label: 'Allowed' },
    { value: 'granted', label: 'Granted' },
    { value: 'abandoned', label: 'Abandoned' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'withdrawn', label: 'Withdrawn' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/prosecution">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Prosecution
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Patent Drafting</h1>
            <p className="text-muted-foreground">
              Professional patent document creation and collaboration
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline"
            onClick={() => setShowTemplates(!showTemplates)}
          >
            <FileText className="h-4 w-4 mr-2" />
            Templates
          </Button>
          <Button 
            onClick={handleCreateNewDraft}
            disabled={isCreatingDraft}
          >
            {isCreatingDraft ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            {isCreatingDraft ? 'Creating...' : 'New Draft'}
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Drafts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {drafts.filter(d => d.status === 'draft').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Total drafts in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ready to File</CardTitle>
            <Clock className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {drafts.filter(d => d.status === 'allowed' || d.status === 'granted').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Completed drafts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Under Review</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {drafts.filter(d => d.status === 'under_examination' || d.status === 'office_action').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Pending review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Words</CardTitle>
            <Edit className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {(() => {
                const total = drafts.reduce((sum, draft) => sum + calculateTotalWordCount(draft), 0);
                return total > 1000 ? `${Math.round(total / 1000)}K` : total.toString();
              })()}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all drafts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Your Drafts</CardTitle>
          <CardDescription>
            Manage and collaborate on patent documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search drafts..." 
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>

          {/* Drafts List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading drafts...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">
              {error}
            </div>
          ) : filteredDrafts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No drafts found. Create your first patent draft to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredDrafts.map((draft) => {
                const wordCount = calculateTotalWordCount(draft);
                const claimCount = countClaims(draft);
                const progress = calculateProgress(draft);
                const sectionsTotal = 7; // Total number of sections
                const sectionsCompleted = Math.round((progress / 100) * sectionsTotal);
                
                return (
                  <div key={draft.id} className="p-4 border rounded-lg hover:bg-accent transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Link 
                            href={`/dashboard/prosecution/drafting/${draft.id}`}
                            className="font-semibold hover:text-primary transition-colors"
                          >
                            {draft.title || 'Untitled Draft'}
                          </Link>
                          
                          {/* Editable Jurisdiction Badge */}
                          {editingField?.draftId === draft.id && editingField?.field === 'jurisdiction' ? (
                            <Select 
                              value={draft.jurisdiction || 'US'} 
                              onValueChange={(value) => handleFieldUpdate(draft.id, 'jurisdiction', value)}
                            >
                              <SelectTrigger className="w-20 h-6 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {jurisdictionOptions.map(option => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge 
                              className={`${getOfficeColor(draft.jurisdiction || 'US')} cursor-pointer hover:opacity-80`}
                              onClick={() => setEditingField({ draftId: draft.id, field: 'jurisdiction' })}
                            >
                              {draft.jurisdiction || 'US'}
                            </Badge>
                          )}
                          
                          {/* Editable Status Badge */}
                          {editingField?.draftId === draft.id && editingField?.field === 'status' ? (
                            <Select 
                              value={draft.status} 
                              onValueChange={(value) => handleFieldUpdate(draft.id, 'status', value)}
                            >
                              <SelectTrigger className="w-32 h-6 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {statusOptions.map(option => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge 
                              className={`${getStatusColor(draft.status)} cursor-pointer hover:opacity-80`}
                              onClick={() => setEditingField({ draftId: draft.id, field: 'status' })}
                            >
                              {statusOptions.find(s => s.value === draft.status)?.label || draft.status}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-6 text-sm text-muted-foreground mb-3">
                          <span>Progress: {progress}% ({sectionsCompleted}/{sectionsTotal} sections)</span>
                          <span>Words: {wordCount.toLocaleString()}</span>
                          {claimCount > 0 && <span>Claims: {claimCount}</span>}
                          <span>Modified: {formatDate(draft.updated_at)}</span>
                          {draft.inventors && draft.inventors.length > 0 && (
                            <span>Inventors: {draft.inventors.length}</span>
                          )}
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Link href={`/dashboard/prosecution/drafting/${draft.id}`}>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                        </Link>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => handleDuplicate(draft.id)}
                              disabled={isDuplicating === draft.id}
                            >
                              {isDuplicating === draft.id ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Copy className="mr-2 h-4 w-4" />
                              )}
                              {isDuplicating === draft.id ? 'Duplicating...' : 'Duplicate'}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => handleDelete(draft.id)}
                              disabled={isDeleting === draft.id}
                            >
                              {isDeleting === draft.id ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="mr-2 h-4 w-4" />
                              )}
                              {isDeleting === draft.id ? 'Deleting...' : 'Delete'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Templates Section */}
      {showTemplates && (
        <Card>
          <CardHeader>
            <CardTitle>Draft Templates</CardTitle>
            <CardDescription>
              Start with professionally designed templates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {draftTemplates.map((template) => (
                <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center justify-between">
                      {template.name}
                      <Badge className={getOfficeColor(template.office)}>
                        {template.office}
                      </Badge>
                    </CardTitle>
                    <CardDescription>{template.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2 text-sm text-muted-foreground mb-4">
                      <div>Sections: {template.sections}</div>
                      <div>Est. Time: {template.estimatedTime}</div>
                    </div>
                    <Button 
                      size="sm" 
                      className="w-full"
                      onClick={() => handleCreateFromTemplate(template.id)}
                      disabled={isCreatingDraft}
                    >
                      {isCreatingDraft ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4 mr-2" />
                      )}
                      {isCreatingDraft ? 'Creating...' : 'Use Template'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}