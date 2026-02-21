/**
 * ResearchTab Component
 * Main interface for patent research within a project
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Database,
  BarChart3,
  Play,
  Pause,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Settings
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

import { useResearch } from '@/hooks/useResearch';
import { BrainstormingSubTab } from './BrainstormingSubTab';
import { PatentSearchPage } from './PatentSearchPage';
import { SearchSubTab } from './SearchSubTab';
import { QueriesSubTab } from './QueriesSubTab';
import { QueryResultsViewer } from './QueryResultsViewer';
import { ResearchAnalytics } from './ResearchAnalytics';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface ResearchTabProps {
  projectId: string;
}

export function ResearchTab({ projectId }: ResearchTabProps) {
  const router = useRouter();
  const {
    queries,
    results,
    analytics,
    availableAPIs,
    loading,
    error,
    createQuery,
    executeQuery,
    cancelQuery,
    createDataset,
    refetchQueries,
    refetchResults
  } = useResearch(projectId);

  const [activeSubTab, setActiveSubTab] = useState('brainstorming');
  const [selectedQueryId, setSelectedQueryId] = useState<string | null>(null);
  const [brainstormData, setBrainstormData] = useState<any>(null);

  // Listen for navigation events from PatentSearchPage
  useEffect(() => {
    const handleNavigateToBrainstorming = (event: any) => {
      setActiveSubTab('brainstorming');
    };

    window.addEventListener('navigateToBrainstorming', handleNavigateToBrainstorming);
    return () => {
      window.removeEventListener('navigateToBrainstorming', handleNavigateToBrainstorming);
    };
  }, []);

  // Statistics for summary cards
  const totalQueries = Array.isArray(queries) ? queries.length : 0;
  const runningQueries = Array.isArray(queries) ? queries.filter(q => q.status === 'running').length : 0;
  const completedQueries = Array.isArray(queries) ? queries.filter(q => q.status === 'completed').length : 0;
  const totalResults = Array.isArray(queries) ? queries.reduce((sum, q) => sum + q.total_results, 0) : 0;
  const selectedResults = Array.isArray(results) ? results.filter(r => r.is_selected).length : 0;

  const handleCreateQuery = async (queryData: any) => {
    const newQuery = await createQuery(queryData);
    if (newQuery) {
      // Query created successfully, refresh data
      refetchQueries();
    }
  };

  const handleExecuteQuery = async (queryId: string) => {
    await executeQuery(queryId);
    refetchQueries();
  };

  const handleCancelQuery = async (queryId: string) => {
    await cancelQuery(queryId);
    refetchQueries();
  };

  const handleCreateDataset = async () => {
    if (!selectedQueryId) return;

    const selectedQueries = selectedQueryId === 'all' 
      ? (Array.isArray(queries) ? queries.filter(q => q.status === 'completed').map(q => q.id) : [])
      : [selectedQueryId];

    if (selectedQueries.length === 0) return;

    await createDataset({
      query_ids: selectedQueries,
      dataset_name: `Research Dataset ${new Date().toISOString().split('T')[0]}`,
      dataset_description: 'Dataset created from patent research results',
      selected_only: true,
      apply_column_mapping: true
    });
  };

  const handleBrainstormToSearch = (data: any) => {
    setBrainstormData(data);
    setActiveSubTab('patent-search');
  };

  const handleSendToClassifier = (selectedResults: any[]) => {
    // Store the research results in sessionStorage to pass to classifier
    sessionStorage.setItem('classifierResearchData', JSON.stringify({
      source: 'research',
      projectId: projectId,
      queryId: selectedQueryId,
      results: selectedResults,
      timestamp: new Date().toISOString()
    }));

    // Navigate to main project page and switch to classifier tab
    router.push(`/dashboard/analytics/projects/${projectId}?tab=classifier`);

    // Update the tab in localStorage
    localStorage.setItem(`analytics-project-${projectId}-tab`, 'classifier');

    toast.success(`Sending ${selectedResults.length} results to Classifier`);
  };

  const getQueryStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'cancelled':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getQueryStatusBadge = (status: string) => {
    const variants = {
      running: 'default',
      completed: 'secondary',
      failed: 'destructive',
      cancelled: 'outline',
      draft: 'outline'
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (error) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Error loading research data: {error}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Queries</p>
                <p className="text-2xl font-bold">{totalQueries}</p>
              </div>
              <Search className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Running</p>
                <p className="text-2xl font-bold text-blue-600">{runningQueries}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-600">{completedQueries}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Results</p>
                <p className="text-2xl font-bold">{totalResults.toLocaleString()}</p>
              </div>
              <Database className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Patent Searches</p>
                <p className="text-2xl font-bold text-orange-600">{brainstormData?.searchCount || 0}</p>
              </div>
              <Search className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="brainstorming">Brainstorming</TabsTrigger>
            <TabsTrigger value="patent-search">Patent Search</TabsTrigger>
            <TabsTrigger value="search">Search</TabsTrigger>
            <TabsTrigger value="queries">Queries</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            {selectedResults > 0 && (
              <Button 
                onClick={handleCreateDataset}
                className="bg-green-600 hover:bg-green-700"
              >
                <Database className="h-4 w-4 mr-2" />
                Create Dataset ({selectedResults})
              </Button>
            )}
          </div>
        </div>

        <TabsContent value="brainstorming" className="space-y-4">
          <BrainstormingSubTab
            projectId={projectId}
            onProceedToSearch={handleBrainstormToSearch}
          />
        </TabsContent>

        <TabsContent value="patent-search" className="space-y-4">
          <PatentSearchPage
            projectId={projectId}
            sessionId={brainstormData?.sessionId}
          />
        </TabsContent>

        <TabsContent value="search" className="space-y-4">
          <SearchSubTab
            projectId={projectId}
            availableAPIs={availableAPIs}
            onQueryCreated={handleCreateQuery}
          />
        </TabsContent>

        <TabsContent value="queries" className="space-y-4">
          <QueriesSubTab
            queries={queries}
            onExecuteQuery={handleExecuteQuery}
            onCancelQuery={handleCancelQuery}
            onViewResults={(queryId) => {
              setSelectedQueryId(queryId);
              setActiveSubTab('results');
            }}
            onCreateNew={() => setActiveSubTab('search')}
            loading={loading}
          />
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <QueryResultsViewer
            projectId={projectId}
            selectedQueryId={selectedQueryId || undefined}
            results={results}
            onRefresh={refetchResults}
            onSendToClassifier={handleSendToClassifier}
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <ResearchAnalytics 
            projectId={projectId}
            analytics={analytics}
            queries={queries}
          />
        </TabsContent>
      </Tabs>

    </div>
  );
}