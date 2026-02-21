'use client';

import { useState, useEffect } from 'react';
import { Search, FileText, Filter, Grid, List, Table, Download, RefreshCw, Loader2, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePatentSearch } from '@/hooks/usePatentSearch';
import { SearchStatus } from './SearchStatus';
import { PatentCard } from './PatentCard';
import { SearchResultsTable } from './SearchResultsTable';

interface PatentSearchResultsProps {
  executionId: string;
  projectId: string;
  sessionId?: string;
  showBrainstormingActions?: boolean;
  onAddToBrainstorming?: (patent: any) => void;
  brainstormingData?: {
    sessionId: string;
    projectId: string;
    addedPatents?: any[];
  };
}

export function PatentSearchResults({ 
  executionId, 
  projectId, 
  sessionId,
  showBrainstormingActions = false,
  onAddToBrainstorming,
  brainstormingData
}: PatentSearchResultsProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'table' | 'list'>('grid');
  const { searchState, loadSearchResults, cancelSearch } = usePatentSearch();
  
  // Load results when executionId changes
  useEffect(() => {
    if (executionId) {
      loadSearchResults(executionId);
    }
  }, [executionId, loadSearchResults]);

  return (
    <div className="space-y-4">
      {/* Search Status - show real-time updates */}
      {searchState.currentExecution && (
        <SearchStatus 
          execution={searchState.currentExecution}
          onCancel={cancelSearch}
        />
      )}
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-green-600 rounded-lg">
                <Search className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">Patent Search Results</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary">{searchState.totalResults.toLocaleString()} results</Badge>
                  {searchState.currentExecution && (
                    <Badge variant="outline" className={
                      searchState.currentExecution.status === 'completed' ? 'bg-green-100 text-green-700' :
                      searchState.currentExecution.status === 'running' ? 'bg-blue-100 text-blue-700' :
                      searchState.currentExecution.status === 'failed' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }>
                      {searchState.currentExecution.status}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline">
                <Filter className="h-4 w-4 mr-1" />
                Filters
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => executionId && loadSearchResults(executionId)}
                disabled={searchState.isSearching}
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${searchState.isSearching ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                disabled={!searchState.hasResults}
                onClick={() => {
                  // Export functionality - will be implemented
                  if (searchState.hasResults) {
                    const csvData = searchState.results.map(patent => ({
                      patent_number: patent.patent_number,
                      title: patent.title,
                      assignee: patent.assignee,
                      publication_date: patent.publication_date,
                      status: patent.status,
                      jurisdiction: patent.jurisdiction
                    }));
                    
                    const csv = [
                      Object.keys(csvData[0]).join(','),
                      ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
                    ].join('\n');
                    
                    const blob = new Blob([csv], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `patent-search-results-${executionId}.csv`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }
                }}
              >
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
            </div>
          </div>
          
          {/* View mode controls */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                onClick={() => setViewMode('table')}
              >
                <Table className="h-4 w-4" />
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              View mode: {viewMode}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Loading State */}
          {searchState.isSearching && (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-blue-600" />
              <p className="text-muted-foreground">Loading search results...</p>
              <p className="text-sm text-muted-foreground mt-1">This may take a few moments</p>
            </div>
          )}

          {/* Error State */}
          {searchState.error && !searchState.isSearching && (
            <div className="text-center py-8">
              <AlertTriangle className="h-8 w-8 mx-auto mb-4 text-red-500" />
              <p className="text-red-600 font-medium">Search failed</p>
              <p className="text-sm text-muted-foreground mt-1">{searchState.error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-3"
                onClick={() => executionId && loadSearchResults(executionId)}
              >
                Try Again
              </Button>
            </div>
          )}

          {/* Results Display */}
          {!searchState.isSearching && !searchState.error && searchState.hasResults && (
            <>
              {viewMode === 'grid' && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {searchState.results.map((patent) => (
                    <PatentCard 
                      key={patent.id} 
                      patent={patent}
                      showBrainstormingActions={showBrainstormingActions}
                      onAddToBrainstorming={onAddToBrainstorming}
                      brainstormingData={brainstormingData ? {
                        sessionId: brainstormingData.sessionId,
                        projectId: brainstormingData.projectId
                      } : undefined}
                    />
                  ))}
                </div>
              )}
              
              {viewMode === 'table' && (
                <SearchResultsTable 
                  results={searchState.results}
                  totalResults={searchState.totalResults}
                  currentPage={searchState.currentPage}
                />
              )}
              
              {viewMode === 'list' && (
                <div className="space-y-2">
                  {searchState.results.map((patent) => (
                    <PatentCard 
                      key={patent.id} 
                      patent={patent}
                      variant="compact"
                      showBrainstormingActions={showBrainstormingActions}
                      onAddToBrainstorming={onAddToBrainstorming}
                      brainstormingData={brainstormingData ? {
                        sessionId: brainstormingData.sessionId,
                        projectId: brainstormingData.projectId
                      } : undefined}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Empty State */}
          {!searchState.isSearching && !searchState.error && !searchState.hasResults && (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4" />
              <p>No search results found</p>
              <p className="text-sm">Execution ID: {executionId}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}