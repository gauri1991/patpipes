/**
 * QueriesSubTab Component
 * Dedicated interface for managing executed patent search queries
 */

'use client';

import { useState } from 'react';
import {
  Search,
  Plus,
  Play,
  Pause,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Database,
  Eye,
  Filter,
  SortAsc,
  SortDesc,
  Calendar,
  BarChart3
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ResearchQuery } from '@/services/researchApi';

interface QueriesSubTabProps {
  queries: ResearchQuery[];
  onExecuteQuery: (queryId: string) => void;
  onCancelQuery: (queryId: string) => void;
  onViewResults: (queryId: string) => void;
  onCreateNew: () => void;
  loading?: boolean;
}

// Helper functions for query management
const getQueryStatusIcon = (status: string) => {
  switch (status) {
    case 'running': return <Play className="h-4 w-4 text-blue-600" />;
    case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
    case 'failed': return <XCircle className="h-4 w-4 text-red-600" />;
    case 'cancelled': return <XCircle className="h-4 w-4 text-gray-600" />;
    default: return <Clock className="h-4 w-4 text-gray-600" />;
  }
};

const getQueryStatusBadge = (status: string) => {
  switch (status) {
    case 'running': return <Badge className="bg-blue-100 text-blue-800">Running</Badge>;
    case 'completed': return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
    case 'failed': return <Badge variant="destructive">Failed</Badge>;
    case 'cancelled': return <Badge variant="secondary">Cancelled</Badge>;
    default: return <Badge variant="outline">{status}</Badge>;
  }
};

const getQueryStatusColor = (status: string) => {
  switch (status) {
    case 'running': return 'border-l-blue-500';
    case 'completed': return 'border-l-green-500';
    case 'failed': return 'border-l-red-500';
    case 'cancelled': return 'border-l-gray-500';
    default: return 'border-l-gray-300';
  }
};

export function QueriesSubTab({ 
  queries, 
  onExecuteQuery, 
  onCancelQuery, 
  onViewResults, 
  onCreateNew,
  loading 
}: QueriesSubTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [apiFilter, setApiFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filter and sort queries
  const filteredQueries = Array.isArray(queries) 
    ? queries
        .filter(query => {
          const matchesSearch = query.query_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              query.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              query.keywords.toLowerCase().includes(searchTerm.toLowerCase());
          const matchesStatus = statusFilter === 'all' || query.status === statusFilter;
          const matchesAPI = apiFilter === 'all' || query.api_source === apiFilter;
          return matchesSearch && matchesStatus && matchesAPI;
        })
        .sort((a, b) => {
          let aValue: any = a[sortBy as keyof ResearchQuery];
          let bValue: any = b[sortBy as keyof ResearchQuery];
          
          if (sortBy === 'created_at' || sortBy === 'updated_at') {
            aValue = new Date(aValue).getTime();
            bValue = new Date(bValue).getTime();
          }
          
          const result = aValue > bValue ? 1 : -1;
          return sortOrder === 'desc' ? -result : result;
        })
    : [];

  // Get unique API sources for filter
  const apiSources = Array.isArray(queries) 
    ? [...new Set(queries.map(q => q.api_source))]
    : [];

  // Statistics
  const stats = {
    total: queries.length,
    running: Array.isArray(queries) ? queries.filter(q => q.status === 'running').length : 0,
    completed: Array.isArray(queries) ? queries.filter(q => q.status === 'completed').length : 0,
    failed: Array.isArray(queries) ? queries.filter(q => q.status === 'failed').length : 0,
    totalResults: Array.isArray(queries) ? queries.reduce((sum, q) => sum + q.total_results, 0) : 0,
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Database className="h-6 w-6 text-green-600" />
            </div>
            Query Management
          </h2>
          <p className="text-muted-foreground mt-1">
            Manage and monitor your patent search queries
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Queries</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Search className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Running</p>
                <p className="text-2xl font-bold text-blue-600">{stats.running}</p>
              </div>
              <Play className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Failed</p>
                <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Results</p>
                <p className="text-2xl font-bold">{stats.totalResults.toLocaleString()}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-64">
              <Input
                placeholder="Search queries by name, description, or keywords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="running">Running</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={apiFilter} onValueChange={setApiFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="API" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All APIs</SelectItem>
                {apiSources.map(api => (
                  <SelectItem key={api} value={api}>
                    {api.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
              const [field, order] = value.split('-');
              setSortBy(field);
              setSortOrder(order as 'asc' | 'desc');
            }}>
              <SelectTrigger className="w-40">
                {sortOrder === 'desc' ? 
                  <SortDesc className="h-4 w-4 mr-2" /> : 
                  <SortAsc className="h-4 w-4 mr-2" />
                }
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at-desc">Newest First</SelectItem>
                <SelectItem value="created_at-asc">Oldest First</SelectItem>
                <SelectItem value="query_name-asc">Name A-Z</SelectItem>
                <SelectItem value="query_name-desc">Name Z-A</SelectItem>
                <SelectItem value="total_results-desc">Most Results</SelectItem>
                <SelectItem value="total_results-asc">Least Results</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Queries List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Search Queries ({filteredQueries.length})
            </CardTitle>
            {loading && (
              <Badge variant="secondary">
                <Clock className="h-3 w-3 mr-1 animate-spin" />
                Updating...
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {filteredQueries.length === 0 ? (
            <div className="text-center py-12">
              {queries.length === 0 ? (
                <>
                  <Database className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No queries yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Start your patent research journey by creating your first search query.
                  </p>
                  <Button onClick={onCreateNew}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Query
                  </Button>
                </>
              ) : (
                <>
                  <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No matches found</h3>
                  <p className="text-muted-foreground">
                    Try adjusting your search terms or filters.
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredQueries.map((query) => (
                <div
                  key={query.id}
                  className={`p-6 border-l-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-all ${getQueryStatusColor(query.status)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      {/* Query Header */}
                      <div className="flex items-center gap-3 mb-3">
                        {getQueryStatusIcon(query.status)}
                        <h3 className="font-semibold text-lg truncate">{query.query_name}</h3>
                        {getQueryStatusBadge(query.status)}
                        <Badge variant="outline">{query.api_source.toUpperCase()}</Badge>
                      </div>

                      {/* Query Description */}
                      <p className="text-muted-foreground mb-3 overflow-hidden"
                        style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical'
                        }}>
                        {query.description || query.keywords}
                      </p>

                      {/* Query Stats */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Results:</span>
                          <span className="font-medium ml-1">{query.total_results.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Selected:</span>
                          <span className="font-medium ml-1">{query.selected_results_count || 0}</span>
                        </div>
                        {query.execution_time && (
                          <div>
                            <span className="text-muted-foreground">Runtime:</span>
                            <span className="font-medium ml-1">{query.execution_time.toFixed(1)}s</span>
                          </div>
                        )}
                        <div>
                          <span className="text-muted-foreground">Created:</span>
                          <span className="font-medium ml-1">
                            {new Date(query.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar for Running Queries */}
                      {query.status === 'running' && (
                        <div className="mt-4">
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-blue-600 font-medium">Processing...</span>
                            <span>{query.processed_results} / {query.total_results}</span>
                          </div>
                          <Progress 
                            value={query.total_results > 0 ? (query.processed_results / query.total_results) * 100 : 0}
                            className="h-2"
                          />
                        </div>
                      )}

                      {/* Error Message */}
                      {query.error_message && (
                        <Alert className="mt-4">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription className="text-sm">
                            {query.error_message}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 ml-4">
                      {query.status === 'draft' && (
                        <Button
                          onClick={() => onExecuteQuery(query.id)}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Execute
                        </Button>
                      )}
                      
                      {query.status === 'running' && (
                        <Button
                          onClick={() => onCancelQuery(query.id)}
                          variant="outline"
                          size="sm"
                        >
                          <Pause className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewResults(query.id)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Details
                      </Button>

                      {query.status === 'completed' && query.total_results > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewResults(query.id)}
                        >
                          <Database className="h-4 w-4 mr-1" />
                          View Results
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}