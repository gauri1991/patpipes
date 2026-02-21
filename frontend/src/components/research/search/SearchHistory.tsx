'use client';

import { useState, useEffect } from 'react';
import { History, Search, Clock, BarChart3, Trash2, RotateCcw, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SearchHistoryItem {
  id: string;
  query: string;
  filters?: any;
  execution_id: string;
  executed_at: string;
  status: 'completed' | 'failed' | 'cancelled';
  results_count?: number;
  execution_time?: number; // in milliseconds
  database_sources?: string[];
}

interface SearchHistoryProps {
  projectId: string;
  sessionId?: string;
  onRerunSearch?: (query: string, filters?: any) => void;
  maxItems?: number;
}

export function SearchHistory({ 
  projectId, 
  sessionId,
  onRerunSearch,
  maxItems = 20
}: SearchHistoryProps) {
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Mock data for demonstration
  useEffect(() => {
    setHistory([
      {
        id: '1',
        query: '"artificial intelligence" AND "patent application"',
        filters: { jurisdictions: ['US', 'EP'], dateFrom: '2024-01-01' },
        execution_id: 'exec_123',
        executed_at: '2024-12-10T14:30:00Z',
        status: 'completed',
        results_count: 1247,
        execution_time: 45000,
        database_sources: ['USPTO', 'EPO']
      },
      {
        id: '2',
        query: '"machine learning" OR "neural network"',
        execution_id: 'exec_122',
        executed_at: '2024-12-10T13:15:00Z',
        status: 'completed',
        results_count: 892,
        execution_time: 32000,
        database_sources: ['USPTO', 'WIPO']
      },
      {
        id: '3',
        query: '"battery technology" AND "lithium ion"',
        execution_id: 'exec_121',
        executed_at: '2024-12-10T11:45:00Z',
        status: 'failed',
        execution_time: 15000,
        database_sources: ['USPTO']
      },
      {
        id: '4',
        query: '"renewable energy" OR "solar panel"',
        execution_id: 'exec_120',
        executed_at: '2024-12-09T16:20:00Z',
        status: 'completed',
        results_count: 2156,
        execution_time: 67000,
        database_sources: ['USPTO', 'EPO', 'JPO']
      },
      {
        id: '5',
        query: '"quantum computing" AND "qubit"',
        execution_id: 'exec_119',
        executed_at: '2024-12-09T14:10:00Z',
        status: 'cancelled',
        execution_time: 8000,
        database_sources: ['USPTO']
      }
    ]);
  }, [projectId, sessionId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'failed': return 'bg-red-100 text-red-700';
      case 'cancelled': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const handleRerunSearch = (item: SearchHistoryItem) => {
    onRerunSearch?.(item.query, item.filters);
  };

  const handleClearHistory = () => {
    setHistory([]);
  };

  const getTotalSearches = () => history.length;
  const getSuccessfulSearches = () => history.filter(h => h.status === 'completed').length;
  const getAverageExecutionTime = () => {
    const completedSearches = history.filter(h => h.status === 'completed' && h.execution_time);
    if (completedSearches.length === 0) return 0;
    const totalTime = completedSearches.reduce((sum, h) => sum + (h.execution_time || 0), 0);
    return Math.round(totalTime / completedSearches.length / 1000); // Convert to seconds
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg">
                <History className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">Search History</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary">{getTotalSearches()} searches</Badge>
                  <Badge variant="outline">{getSuccessfulSearches()} completed</Badge>
                  {getAverageExecutionTime() > 0 && (
                    <Badge variant="outline">{getAverageExecutionTime()}s avg</Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline">
                <BarChart3 className="h-4 w-4 mr-1" />
                Analytics
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleClearHistory}
                disabled={history.length === 0}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Clear
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-4" />
              <p>No search history yet</p>
              <p className="text-sm">Your search queries will appear here</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {history.slice(0, maxItems).map((item) => (
                  <Card key={item.id} className="hover:shadow-sm transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={getStatusColor(item.status)}>
                              {item.status}
                            </Badge>
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {formatTimeAgo(item.executed_at)}
                            </span>
                            {item.execution_time && (
                              <span className="text-xs text-muted-foreground">
                                {Math.round(item.execution_time / 1000)}s
                              </span>
                            )}
                          </div>
                          
                          <div className="bg-muted rounded p-2 mb-2">
                            <code className="text-xs text-muted-foreground">{item.query}</code>
                          </div>
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Search className="h-3 w-3" />
                              ID: {item.execution_id}
                            </span>
                            {item.results_count !== undefined && (
                              <Badge variant="secondary" className="text-xs">
                                {item.results_count.toLocaleString()} results
                              </Badge>
                            )}
                            {item.database_sources && item.database_sources.length > 0 && (
                              <span className="flex items-center gap-1">
                                <BarChart3 className="h-3 w-3" />
                                {item.database_sources.join(', ')}
                              </span>
                            )}
                          </div>
                          
                          {item.filters && Object.keys(item.filters).length > 0 && (
                            <div className="mt-2">
                              <span className="text-xs text-muted-foreground">Filters: </span>
                              {item.filters.jurisdictions && (
                                <Badge variant="outline" className="text-xs mr-1">
                                  {item.filters.jurisdictions.join(', ')}
                                </Badge>
                              )}
                              {item.filters.dateFrom && (
                                <Badge variant="outline" className="text-xs">
                                  From: {item.filters.dateFrom}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1 ml-4">
                          {item.status === 'completed' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRerunSearch(item)}
                              className="h-7 w-7 p-0"
                              title="Rerun this search"
                            >
                              <RotateCcw className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {/* Navigate to results view */}}
                            className="h-7 w-7 p-0"
                            title="View results"
                            disabled={item.status !== 'completed'}
                          >
                            <TrendingUp className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {history.length > maxItems && (
                  <div className="text-center py-2">
                    <Button variant="ghost" size="sm">
                      Show {history.length - maxItems} more searches
                    </Button>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}