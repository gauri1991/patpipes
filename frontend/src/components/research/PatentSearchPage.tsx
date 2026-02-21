'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, BookmarkIcon, History, BarChart3, Settings, Layout, Brain } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { QueryBuilder } from './search/QueryBuilder';
import { PatentSearchResults } from './search/PatentSearchResults';
import { SearchFilters } from './search/SearchFilters';
import { SavedSearches } from './search/SavedSearches';
import { SearchHistory } from './search/SearchHistory';
import { StrategyTemplates } from './search/StrategyTemplates';
import { SearchWorkflow } from './search/SearchWorkflow';
import { SearchAnalytics } from './search/SearchAnalytics';
import { usePatentSearch } from '@/hooks/usePatentSearch';

interface PatentSearchPageProps {
  projectId: string;
  sessionId?: string;
}

export function PatentSearchPage({ projectId, sessionId }: PatentSearchPageProps) {
  const [activeTab, setActiveTab] = useState<'search' | 'saved' | 'history' | 'templates' | 'workflows' | 'analytics'>('search');
  const [showFilters, setShowFilters] = useState(false);
  const [currentQuery, setCurrentQuery] = useState('');
  const [searchFilters, setSearchFilters] = useState({});
  const [currentExecutionId, setCurrentExecutionId] = useState<string | null>(null);
  const [brainstormingPatents, setBrainstormingPatents] = useState<any[]>([]);
  
  const { executeSearch, searchState } = usePatentSearch();

  const handleExecuteSearch = async (searchData: any) => {
    try {
      const execution = await executeSearch({
        query: searchData.query || searchData,
        filters: searchFilters,
        projectId,
        sessionId
      } as any);
      
      if (execution) {
        setCurrentExecutionId(execution.id);
        setCurrentQuery(searchData.query || searchData);
      }
    } catch (error) {
      console.error('Search execution failed:', error);
    }
  };

  const handleAddToBrainstorming = async (patentData: any) => {
    if (!sessionId) return;
    
    // Add patent to brainstorming session
    setBrainstormingPatents(prev => [...prev, patentData]);
    
    // Here you would typically make an API call to save to the backend
    console.log('Adding patent to brainstorming session:', patentData);
    
    // Optional: Show success notification
    // toast.success(`Patent ${patentData.patent_number} added to brainstorming session`);
  };

  return (
    <div className="flex h-full">
      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col ${showFilters ? 'mr-80' : ''}`}>
        {/* Header */}
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                <Search className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">Patent Search</h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline">Project: {projectId}</Badge>
                  {sessionId && <Badge variant="secondary">Session: {sessionId}</Badge>}
                  {searchState.results && searchState.results.length > 0 && (
                    <Badge variant="default">{searchState.totalResults.toLocaleString()} results</Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {sessionId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Navigate to brainstorming tab in parent ResearchTab
                    window.dispatchEvent(new CustomEvent('navigateToBrainstorming', {
                      detail: { sessionId, projectId }
                    }));
                  }}
                >
                  <Brain className="h-4 w-4 mr-1" />
                  Back to Brainstorming
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-1" />
                Filters
                {showFilters && <Badge variant="secondary" className="ml-1">On</Badge>}
              </Button>
              <Button variant="outline" size="sm">
                <Layout className="h-4 w-4 mr-1" />
                Layout
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-1" />
                Settings
              </Button>
            </div>
          </div>
          
          {/* Tab Navigation */}
          <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="search" className="flex items-center gap-1">
                <Search className="h-3 w-3" />
                Search
              </TabsTrigger>
              <TabsTrigger value="saved" className="flex items-center gap-1">
                <BookmarkIcon className="h-3 w-3" />
                Saved
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-1">
                <History className="h-3 w-3" />
                History
              </TabsTrigger>
              <TabsTrigger value="templates" className="flex items-center gap-1">
                <Layout className="h-3 w-3" />
                Templates
              </TabsTrigger>
              <TabsTrigger value="workflows" className="flex items-center gap-1">
                <Settings className="h-3 w-3" />
                Workflows
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-1">
                <BarChart3 className="h-3 w-3" />
                Analytics
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <Tabs value={activeTab}>
            {/* Search Tab */}
            <TabsContent value="search" className="space-y-4 p-4">
              <QueryBuilder
                projectId={projectId}
                sessionId={sessionId}
                onExecuteSearch={handleExecuteSearch}
                onQueryGenerated={setCurrentQuery}
              />
              
              {currentExecutionId && (
                <PatentSearchResults
                  executionId={currentExecutionId}
                  projectId={projectId}
                  sessionId={sessionId}
                  showBrainstormingActions={!!sessionId}
                  onAddToBrainstorming={handleAddToBrainstorming}
                  brainstormingData={sessionId ? {
                    sessionId,
                    projectId,
                    addedPatents: brainstormingPatents
                  } : undefined}
                />
              )}
              
              {!currentExecutionId && !searchState.isSearching && (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    <Search className="h-12 w-12 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Ready to Search Patents</h3>
                    <p className="text-sm">
                      Build your query above and execute a search to see results here.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Saved Searches Tab */}
            <TabsContent value="saved" className="p-4">
              <SavedSearches
                projectId={projectId}
                sessionId={sessionId}
                onExecuteSearch={handleExecuteSearch}
              />
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="p-4">
              <SearchHistory
                projectId={projectId}
                sessionId={sessionId}
                onRerunSearch={handleExecuteSearch}
              />
            </TabsContent>

            {/* Templates Tab */}
            <TabsContent value="templates" className="p-4">
              <StrategyTemplates
                onApplyTemplate={(keywords, classifications) => {
                  // Auto-populate QueryBuilder and switch to search tab
                  setActiveTab('search');
                  // The template application will be handled by the QueryBuilder component
                }}
                onTemplateSelect={(template) => {
                  // Execute search directly from template
                  const searchData = {
                    query: template.queryPattern,
                    keywords: template.keywords,
                    classifications: template.classifications,
                    filters: template.filters,
                    sessionContext: sessionId ? {
                      sessionId,
                      projectId,
                      templateUsed: template.name
                    } : null
                  };
                  handleExecuteSearch(searchData);
                  setActiveTab('search');
                }}
              />
            </TabsContent>

            {/* Workflows Tab */}
            <TabsContent value="workflows" className="p-4">
              <SearchWorkflow
                projectId={projectId}
                sessionId={sessionId}
                onWorkflowExecute={(workflowId) => {
                  console.log('Executing workflow:', workflowId);
                }}
              />
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="p-4">
              <SearchAnalytics
                projectId={projectId}
                sessionId={sessionId}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Filters Sidebar */}
      {showFilters && (
        <>
          <Separator orientation="vertical" />
          <div className="w-80 border-l bg-muted/10">
            <div className="p-4">
              <SearchFilters
                onFiltersChange={setSearchFilters}
                onApplyFilters={() => {
                  if (currentQuery) {
                    handleExecuteSearch(currentQuery);
                  }
                }}
                onClearFilters={() => {
                  setSearchFilters({});
                }}
                totalResults={searchState.totalResults}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}