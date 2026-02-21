/**
 * Prior Art Results Library Component
 * Display and manage search results with prior art context
 */

'use client';

import { useState, useEffect } from 'react';
import { 
  Database, 
  Filter, 
  Grid3X3, 
  List, 
  Download, 
  FileText, 
  BarChart3,
  Search,
  CheckSquare,
  Star,
  Flag,
  Calendar,
  Building,
  User,
  Globe,
  Eye,
  MoreHorizontal
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';

import { ResearchTab } from '@/components/research/ResearchTab';
import { PriorArtProject } from '@/types/prior-art.types';
import { researchApi, ResearchQuery, ResearchResult } from '@/services/researchApi';

interface PriorArtResultsLibraryProps {
  project: PriorArtProject;
  onResultsUpdate: () => void;
}

export function PriorArtResultsLibrary({ project, onResultsUpdate }: PriorArtResultsLibraryProps) {
  const [queries, setQueries] = useState<ResearchQuery[]>([]);
  const [results, setResults] = useState<ResearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [selectedQuery, setSelectedQuery] = useState<string>('all');
  const [relevanceFilter, setRelevanceFilter] = useState<string>('all');
  const [selectedResults, setSelectedResults] = useState<string[]>([]);

  // Load project queries and results
  useEffect(() => {
    loadProjectData();
  }, [project.id]);

  const loadProjectData = async () => {
    setIsLoading(true);
    try {
      // Load queries for this project
      const queriesResponse = await researchApi.getQueries(project.id);
      if (queriesResponse.success && queriesResponse.data) {
        setQueries(queriesResponse.data);
      }

      // Load results for this project
      const resultsResponse = await researchApi.getResults({ project_id: project.id });
      if (resultsResponse.success && resultsResponse.data) {
        setResults(resultsResponse.data);
      }
    } catch (error) {
      console.error('Failed to load project data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedResults.length === 0) return;

    try {
      let bulkData;
      switch (action) {
        case 'select':
          bulkData = { result_ids: selectedResults, action: 'select' as const };
          break;
        case 'unselect':
          bulkData = { result_ids: selectedResults, action: 'unselect' as const };
          break;
        case 'high_relevance':
          bulkData = { result_ids: selectedResults, action: 'set_relevance' as const, relevance: 'high' };
          break;
        case 'low_relevance':
          bulkData = { result_ids: selectedResults, action: 'set_relevance' as const, relevance: 'low' };
          break;
        default:
          return;
      }

      const response = await researchApi.bulkUpdateResults(bulkData);
      if (response.success) {
        await loadProjectData();
        onResultsUpdate();
        setSelectedResults([]);
      }
    } catch (error) {
      console.error('Failed to perform bulk action:', error);
    }
  };

  // Filter results based on selected query and relevance
  const filteredResults = results.filter(result => {
    const matchesQuery = selectedQuery === 'all' || result.query === selectedQuery;
    const matchesRelevance = relevanceFilter === 'all' || 
                            (relevanceFilter === 'selected' && result.is_selected) ||
                            result.manual_relevance === relevanceFilter;
    return matchesQuery && matchesRelevance;
  });

  const ResultCard = ({ result }: { result: ResearchResult }) => (
    <Card className="group hover:shadow-md transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <Checkbox
              checked={selectedResults.includes(result.id)}
              onCheckedChange={(checked) => {
                setSelectedResults(prev => 
                  checked 
                    ? [...prev, result.id]
                    : prev.filter(id => id !== result.id)
                );
              }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                  {result.title}
                </h3>
                {result.is_selected && (
                  <Star className="h-4 w-4 text-yellow-500 fill-current flex-shrink-0" />
                )}
              </div>
              
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <span className="font-mono">{result.publication_number}</span>
                {result.relevance_score && (
                  <Badge variant={
                    result.relevance_score >= 0.8 ? 'default' :
                    result.relevance_score >= 0.6 ? 'secondary' : 'outline'
                  } className="text-xs">
                    {Math.round(result.relevance_score * 100)}% match
                  </Badge>
                )}
                {result.manual_relevance && (
                  <Badge variant={
                    result.manual_relevance === 'high' ? 'default' :
                    result.manual_relevance === 'medium' ? 'secondary' : 'outline'
                  } className="text-xs">
                    {result.manual_relevance}
                  </Badge>
                )}
              </div>

              <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                {result.abstract}
              </p>

              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                {result.assignee && (
                  <div className="flex items-center gap-1">
                    <Building className="h-3 w-3" />
                    <span className="truncate max-w-32">{result.assignee}</span>
                  </div>
                )}
                {result.publication_date && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(result.publication_date).getFullYear()}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  <span>{result.jurisdiction}</span>
                </div>
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Star className="mr-2 h-4 w-4" />
                {result.is_selected ? 'Unselect' : 'Select'}
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Flag className="mr-2 h-4 w-4" />
                Set Relevance
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <FileText className="mr-2 h-4 w-4" />
                Add to Analysis
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Download className="mr-2 h-4 w-4" />
                Export
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b bg-background p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Results Library</h2>
            <p className="text-sm text-muted-foreground">
              {filteredResults.length} of {results.length} results • {project.name}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export All
            </Button>
            <Button variant="outline" size="sm">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </Button>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search results..."
                className="pl-10 w-64"
              />
            </div>

            <Select value={selectedQuery} onValueChange={setSelectedQuery}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Queries" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Queries</SelectItem>
                {queries.map((query) => (
                  <SelectItem key={query.id} value={query.id}>
                    {query.query_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={relevanceFilter} onValueChange={setRelevanceFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Relevance" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Results</SelectItem>
                <SelectItem value="selected">Selected Only</SelectItem>
                <SelectItem value="high">High Relevance</SelectItem>
                <SelectItem value="medium">Medium Relevance</SelectItem>
                <SelectItem value="low">Low Relevance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            >
              {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedResults.length > 0 && (
          <div className="flex items-center gap-2 mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <span className="text-sm font-medium text-blue-900">
              {selectedResults.length} selected
            </span>
            <Button size="sm" variant="outline" onClick={() => handleBulkAction('select')}>
              <Star className="h-4 w-4 mr-1" />
              Select All
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleBulkAction('unselect')}>
              Unselect
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleBulkAction('high_relevance')}>
              <Flag className="h-4 w-4 mr-1" />
              Mark High
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleBulkAction('low_relevance')}>
              Mark Low
            </Button>
            <Button size="sm" variant="outline" onClick={() => setSelectedResults([])}>
              Clear Selection
            </Button>
          </div>
        )}
      </div>

      {/* Results Content */}
      <div className="flex-1 overflow-auto p-6">
        {filteredResults.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="rounded-full bg-muted p-6 mb-4">
              <Database className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">
              {results.length === 0 ? 'No results yet' : 'No results match your filters'}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              {results.length === 0 
                ? 'Execute searches to see patent and literature results here.'
                : 'Try adjusting your filters or search terms to find what you\'re looking for.'
              }
            </p>
            {results.length === 0 && (
              <Button>
                <Search className="h-4 w-4 mr-2" />
                Start Searching
              </Button>
            )}
          </div>
        ) : (
          <div className={
            viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              : "space-y-4"
          }>
            {filteredResults.map((result) => (
              <ResultCard key={result.id} result={result} />
            ))}
          </div>
        )}
      </div>

      {/* Results Summary */}
      {results.length > 0 && (
        <div className="border-t bg-muted/30 p-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-6">
              <span>Total: {results.length}</span>
              <span>Selected: {results.filter(r => r.is_selected).length}</span>
              <span>High Relevance: {results.filter(r => r.manual_relevance === 'high').length}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>Showing {filteredResults.length} results</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}