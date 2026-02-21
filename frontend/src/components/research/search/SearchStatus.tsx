'use client';

import { SearchExecution } from '@/services/patentSearchApi';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { X, Clock, CheckCircle, AlertTriangle, Search } from 'lucide-react';

interface SearchStatusProps {
  execution: SearchExecution | null;
  onCancel?: () => void;
}

export function SearchStatus({ execution, onCancel }: SearchStatusProps) {
  if (!execution) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'failed': return 'bg-red-100 text-red-700';
      case 'running': return 'bg-blue-100 text-blue-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-3 w-3" />;
      case 'failed': return <AlertTriangle className="h-3 w-3" />;
      case 'running': return <Search className="h-3 w-3 animate-pulse" />;
      case 'pending': return <Clock className="h-3 w-3" />;
      default: return <Search className="h-3 w-3" />;
    }
  };

  return (
    <div className="bg-muted/50 border rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(execution.status)}>
            {getStatusIcon(execution.status)}
            <span className="ml-1 capitalize">{execution.status}</span>
          </Badge>
          <span className="text-sm text-muted-foreground">
            {execution.total_results.toLocaleString()} results found
          </span>
        </div>
        
        {(execution.status === 'running' || execution.status === 'pending') && onCancel && (
          <Button size="sm" variant="outline" onClick={onCancel}>
            <X className="h-3 w-3 mr-1" />
            Cancel
          </Button>
        )}
      </div>
      
      {execution.status === 'running' && (
        <div className="space-y-1">
          <Progress value={execution.progress} className="h-1" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Progress: {execution.progress}%</span>
            <span>
              Elapsed: {Math.round(execution.execution_time / 1000)}s
            </span>
          </div>
        </div>
      )}
      
      {execution.status === 'completed' && (
        <div className="text-xs text-muted-foreground">
          Completed in {Math.round(execution.execution_time / 1000)}s • 
          Searched {execution.database_sources.join(', ')}
        </div>
      )}
      
      {execution.status === 'failed' && execution.error_message && (
        <div className="text-xs text-red-600 mt-1">
          {execution.error_message}
        </div>
      )}
    </div>
  );
}