/**
 * Individual Prior Art Project Page
 * Detailed view with tabs for a single prior art project
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft,
  Target,
  Search, 
  Database, 
  BarChart3, 
  Bookmark, 
  FileText,
  Clock,
  Brain,
  History,
  Settings,
  Shield,
  Lightbulb,
  Gavel,
  Map,
  BookOpen
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

import dynamic from 'next/dynamic';

// Loading component for dynamic imports
const LoadingComponent = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
);

// Dynamic imports to reduce initial bundle size
const PriorArtSearch = dynamic(() => 
  import('@/components/prior-art/PriorArtSearch').then(mod => ({ default: mod.PriorArtSearch })),
  { ssr: false, loading: LoadingComponent }
);

const PriorArtResultsLibrary = dynamic(() => 
  import('@/components/prior-art/PriorArtResultsLibrary').then(mod => ({ default: mod.PriorArtResultsLibrary })),
  { ssr: false, loading: LoadingComponent }
);

const PriorArtAnalysis = dynamic(() => 
  import('@/components/prior-art/PriorArtAnalysis').then(mod => ({ default: mod.PriorArtAnalysis })),
  { ssr: false, loading: LoadingComponent }
);

const PriorArtSavedSearches = dynamic(() => 
  import('@/components/prior-art/PriorArtSavedSearches').then(mod => ({ default: mod.PriorArtSavedSearches })),
  { ssr: false, loading: LoadingComponent }
);

const PriorArtReports = dynamic(() => 
  import('@/components/prior-art/PriorArtReports').then(mod => ({ default: mod.PriorArtReports })),
  { ssr: false, loading: LoadingComponent }
);

const PriorArtResearchTab = dynamic(() => 
  import('@/components/prior-art-research/PriorArtResearchTab').then(mod => ({ default: mod.PriorArtResearchTab })),
  { ssr: false, loading: LoadingComponent }
);

import { 
  PriorArtProject,
  PriorArtProjectType,
  PROJECT_TYPE_CONFIG 
} from '@/types/prior-art.types';
import { priorArtApi } from '@/services/priorArtApi';

const PROJECT_ICONS = {
  [PriorArtProjectType.FTO]: Shield,
  [PriorArtProjectType.NOVELTY]: Lightbulb,
  [PriorArtProjectType.INVALIDITY]: Gavel,
  [PriorArtProjectType.LANDSCAPE]: Map,
  [PriorArtProjectType.STATE_OF_ART]: BookOpen,
  [PriorArtProjectType.CUSTOM]: Settings,
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'draft': return 'bg-gray-500';
    case 'planning': return 'bg-blue-500';
    case 'active': return 'bg-green-500';
    case 'analysis': return 'bg-purple-500';
    case 'review': return 'bg-orange-500';
    case 'completed': return 'bg-emerald-500';
    case 'on_hold': return 'bg-yellow-500';
    case 'archived': return 'bg-gray-400';
    default: return 'bg-gray-500';
  }
};

export default function PriorArtProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  
  const [activeTab, setActiveTab] = useState('overview');
  const [project, setProject] = useState<PriorArtProject | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  const loadProject = async () => {
    setIsLoading(true);
    try {
      const response = await priorArtApi.getProject(projectId);
      if (response.success && response.data) {
        setProject(response.data);
        // Auto-navigate to search tab if project is active
        if (response.data.status === 'active' && activeTab === 'overview') {
          setActiveTab('search');
        }
      }
    } catch (error) {
      console.error('Failed to load project:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Project not found</p>
          <Button onClick={() => router.push('/dashboard/prior-art')} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const Icon = PROJECT_ICONS[project.type] || Settings;

  return (
    <div className="flex h-full flex-col">
      {/* Page Header */}
      <div className="bg-background px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/dashboard/prior-art')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-3">
              <Icon className="h-6 w-6 text-muted-foreground" />
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {PROJECT_TYPE_CONFIG[project.type]?.label} • Created {new Date(project.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {project.priority || 'medium'}
              </Badge>
              <div className={`w-2 h-2 rounded-full ${getStatusColor(project.status)}`} />
              <span className="text-sm text-muted-foreground capitalize">
                {project.status.replace('_', ' ')}
              </span>
            </div>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        <Tabs 
          value={activeTab} 
          onValueChange={handleTabChange}
          className="space-y-4"
        >
          <TabsList>
            <TabsTrigger value="overview">
              <Target className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            
            <TabsTrigger value="research">
              <Brain className="h-4 w-4 mr-2" />
              Brainstorming
            </TabsTrigger>
            
            <TabsTrigger value="search">
              <Search className="h-4 w-4 mr-2" />
              Search
            </TabsTrigger>
            
            <TabsTrigger value="results">
              <Database className="h-4 w-4 mr-2" />
              Results Library
              {project.total_results > 0 && (
                <span className="ml-2 text-xs bg-muted px-1.5 py-0.5 rounded">
                  {project.total_results}
                </span>
              )}
            </TabsTrigger>
            
            <TabsTrigger 
              value="analysis"
              disabled={project.total_results === 0}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Evidence Analysis
            </TabsTrigger>
            
            <TabsTrigger value="timeline">
              <History className="h-4 w-4 mr-2" />
              Timeline
            </TabsTrigger>
            
            <TabsTrigger value="reports">
              <FileText className="h-4 w-4 mr-2" />
              Reports
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden">
            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Project Summary Card */}
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Project Summary</CardTitle>
                    <CardDescription>
                      {project.description || PROJECT_TYPE_CONFIG[project.type]?.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Overall Progress</span>
                        <span>{project.progress_percentage || 0}%</span>
                      </div>
                      <Progress value={project.progress_percentage || 0} className="h-2" />
                    </div>
                    
                    {project.target_patent && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Target Patent</h4>
                        <p className="text-sm text-muted-foreground">
                          {typeof project.target_patent === 'string' 
                            ? project.target_patent 
                            : `${project.target_patent.patent_number}${project.target_patent.title ? ' - ' + project.target_patent.title : ''}`}
                        </p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                      <div>
                        <p className="text-sm text-muted-foreground">Start Date</p>
                        <p className="font-medium">{new Date(project.created_at).toLocaleDateString()}</p>
                      </div>
                      {project.deadline && (
                        <div>
                          <p className="text-sm text-muted-foreground">Deadline</p>
                          <p className="font-medium">{new Date(project.deadline).toLocaleDateString()}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Stats Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total References</span>
                      <span className="font-medium">{project.total_results || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Analyzed</span>
                      <span className="font-medium">{project.analyzed_results || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Strong Evidence</span>
                      <span className="font-medium">{project.strong_evidence || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Search Sessions</span>
                      <span className="font-medium">{project.search_sessions || 0}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Search Objectives Card */}
                <Card className="md:col-span-3">
                  <CardHeader>
                    <CardTitle>Search Objectives</CardTitle>
                    <CardDescription>Key goals and parameters for this search</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div>
                        <h4 className="text-sm font-medium mb-2">Jurisdictions</h4>
                        <div className="flex flex-wrap gap-1">
                          {project.jurisdictions?.map((jurisdiction: string) => (
                            <Badge key={jurisdiction} variant="outline" className="text-xs">
                              {jurisdiction}
                            </Badge>
                          )) || <span className="text-sm text-muted-foreground">Not specified</span>}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium mb-2">Time Range</h4>
                        <p className="text-sm text-muted-foreground">
                          {project.time_range_start && project.time_range_end
                            ? `${new Date(project.time_range_start).getFullYear()} - ${new Date(project.time_range_end).getFullYear()}`
                            : 'All dates'}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium mb-2">Classifications</h4>
                        <div className="flex flex-wrap gap-1">
                          {project.classifications?.slice(0, 3).map((classification: string) => (
                            <Badge key={classification} variant="outline" className="text-xs">
                              {classification}
                            </Badge>
                          )) || <span className="text-sm text-muted-foreground">Not specified</span>}
                          {(project.classifications?.length ?? 0) > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{(project.classifications?.length ?? 0) - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Team Card */}
                <Card className="md:col-span-3">
                  <CardHeader>
                    <CardTitle>Team & Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">Last activity</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {new Date(project.updated_at).toLocaleString()}
                        </span>
                      </div>
                      {project.team_members && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Team members</span>
                          <div className="flex -space-x-2">
                            {project.team_members.map((member: any, index: number) => (
                              <div
                                key={index}
                                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center border-2 border-background"
                                title={member.name}
                              >
                                <span className="text-xs font-medium">
                                  {member.name?.split(' ').map((n: string) => n[0]).join('')}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Research Tab */}
            <TabsContent value="research" className="space-y-6">
              <PriorArtResearchTab
                project={project}
                onProceedToSearch={() => setActiveTab('search')}
              />
            </TabsContent>

            {/* Search Tab */}
            <TabsContent value="search" className="space-y-6">
              <PriorArtSearch
                project={project}
                onResultsUpdate={() => loadProject()}
              />
            </TabsContent>

            {/* Results Library Tab */}
            <TabsContent value="results" className="space-y-6">
              <PriorArtResultsLibrary
                project={project}
                onResultsUpdate={() => loadProject()}
              />
            </TabsContent>

            {/* Evidence Analysis Tab */}
            <TabsContent value="analysis" className="space-y-6">
              <PriorArtAnalysis
                project={project}
              />
            </TabsContent>

            {/* Timeline Tab */}
            <TabsContent value="timeline" className="space-y-6">
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Search Timeline</h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Track search progression, decision points, and team collaboration history.
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* Reports Tab */}
            <TabsContent value="reports" className="space-y-6">
              <PriorArtReports
                project={project}
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}