/**
 * Prior Art Search Component
 * Search interface for prior art projects with context-aware features
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Lightbulb,
  Clock,
  BookOpen,
  Settings,
  Shield,
  Gavel,
  Map,
  Zap,
  FileText,
  Database,
  Globe2
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { SearchQueryBuilder } from '@/components/research/SearchQueryBuilder';
import { 
  PriorArtProject, 
  PriorArtProjectType,
  PROJECT_TYPE_CONFIG 
} from '@/types/prior-art.types';
import { PatentAPI } from '@/services/patentApiConfigService';
import { priorArtApi } from '@/services/priorArtApi';
import { researchApi } from '@/services/researchApi';

interface PriorArtSearchProps {
  project: PriorArtProject;
  onResultsUpdate: () => void;
}

// Search templates based on project type
const SEARCH_TEMPLATES: Record<string, any[]> = {
  [PriorArtProjectType.FTO]: [
    {
      id: 'fto_broad',
      name: 'Broad Technology Search',
      description: 'Wide search across all patent databases for technology area',
      keywords: '',
      suggested_apis: ['uspto', 'epo', 'wipo'],
      geographic_scope: ['US', 'EP', 'CN', 'JP'],
    },
    {
      id: 'fto_competitor',
      name: 'Competitor Patent Analysis',
      description: 'Focus on specific companies and their patent portfolios',
      keywords: '',
      assignees: [],
      suggested_apis: ['uspto', 'epo'],
    },
    {
      id: 'fto_recent',
      name: 'Recent Patent Activity',
      description: 'Search for patents published in the last 2 years',
      keywords: '',
      date_range: {
        from_date: new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        to_date: new Date().toISOString().split('T')[0]
      }
    }
  ],
  [PriorArtProjectType.NOVELTY]: [
    {
      id: 'novelty_comprehensive',
      name: 'Comprehensive Prior Art Search',
      description: 'Exhaustive search across patents and literature',
      keywords: '',
      include_non_patent: true,
      suggested_apis: ['uspto', 'epo', 'google_patents'],
    },
    {
      id: 'novelty_academic',
      name: 'Academic & Research Literature',
      description: 'Focus on scientific publications and research papers',
      keywords: '',
      include_academic: true,
      suggested_apis: ['google_patents'],
    }
  ],
  [PriorArtProjectType.INVALIDITY]: [
    {
      id: 'invalidity_prior_art',
      name: 'Prior Art Search',
      description: 'Find patents and publications that predate target patent',
      keywords: '',
      date_range: {
        to_date: '' // Will be set based on target patent priority date
      },
      suggested_apis: ['uspto', 'epo', 'wipo'],
    },
    {
      id: 'invalidity_citations',
      name: 'Citation Network Analysis',
      description: 'Search patents cited by and citing the target patent',
      keywords: '',
      focus_citations: true,
    }
  ],
  [PriorArtProjectType.LANDSCAPE]: [
    {
      id: 'landscape_technology',
      name: 'Technology Landscape',
      description: 'Map the patent landscape in the technology domain',
      keywords: '',
      include_trends: true,
      suggested_apis: ['uspto', 'epo', 'wipo'],
    },
    {
      id: 'landscape_competitors',
      name: 'Competitive Landscape',
      description: 'Analyze competitor patent strategies and portfolios',
      keywords: '',
      focus_assignees: true,
    }
  ]
};

export function PriorArtSearch({ project, onResultsUpdate }: PriorArtSearchProps) {
  const [availableAPIs, setAvailableAPIs] = useState<PatentAPI[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showQueryBuilder, setShowQueryBuilder] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [lastUsedForm, setLastUsedForm] = useState<any>(null);
  
  // Load available APIs and last used form on component mount
  useEffect(() => {
    loadAvailableAPIs();
    loadLastUsedForm();
  }, [project.id]);

  const loadLastUsedForm = () => {
    try {
      const saved = localStorage.getItem(`search_form_${project.id}`);
      if (saved) {
        const formData = JSON.parse(saved);
        setLastUsedForm(formData);
        setShowQueryBuilder(true); // Auto-show form with last used data
      }
    } catch (error) {
      console.error('Error loading last used form:', error);
    }
  };

  const saveFormData = (formData: any) => {
    try {
      localStorage.setItem(`search_form_${project.id}`, JSON.stringify(formData));
      setLastUsedForm(formData);
    } catch (error) {
      console.error('Error saving form data:', error);
    }
  };

  const loadAvailableAPIs = async () => {
    setIsLoading(true);
    try {
      const response = await researchApi.getAvailableAPIs();
      if (response.success && response.data) {
        setAvailableAPIs(response.data);
      }
    } catch (error) {
      console.error('Failed to load available APIs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSearch = async (queryData: any) => {
    try {
      // Add prior art context to the query
      const priorArtQueryData = {
        ...queryData,
        project: project.id,
        additional_filters: {
          ...queryData.additional_filters,
          context: 'prior_art',
          project_type: project.type,
          target_patent: project.target_patent?.patent_number
        }
      };

      const response = await priorArtApi.createSearch(project.id, priorArtQueryData);
      if (response.success) {
        setShowQueryBuilder(false);
        onResultsUpdate();
      }
    } catch (error) {
      console.error('Failed to create search:', error);
    }
  };

  const handleTemplateSelect = (template: any) => {
    setSelectedTemplate(template);
    setShowQueryBuilder(true);
  };

  const projectConfig = PROJECT_TYPE_CONFIG[project.type];
  const templates = SEARCH_TEMPLATES[project.type] || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading search interface...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Actions - Always Visible */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Button 
              onClick={() => setShowQueryBuilder(true)}
            >
              <Search className="h-4 w-4 mr-2" />
              Create New Search
            </Button>
            <Button 
              variant="outline"
            >
              <Clock className="h-4 w-4 mr-2" />
              Saved Search History
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search Query Builder Panel */}
      {showQueryBuilder && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Search</CardTitle>
            <CardDescription>Build your search query with custom parameters</CardDescription>
          </CardHeader>
          <CardContent>
            <SearchQueryBuilder
              projectId={project.id}
              availableAPIs={availableAPIs}
              onClose={() => {
                setShowQueryBuilder(false);
                setSelectedTemplate(null);
              }}
              onSubmit={handleCreateSearch}
              inline={true}
              initialData={lastUsedForm || {
                query_name: selectedTemplate?.name || '',
                description: selectedTemplate?.description || '',
                keywords: selectedTemplate?.keywords || '',
                ipc_classes: selectedTemplate?.ipc_classes || [],
                cpc_classes: selectedTemplate?.cpc_classes || [],
                assignees: selectedTemplate?.assignees || [],
                inventors: selectedTemplate?.inventors || []
              }}
              onFormChange={saveFormData}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}