/**
 * Status Monitor Component
 * Real-time monitoring of dataset processing status
 */

'use client';

import { useEffect, useState } from 'react';
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  Activity
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { StatusBadge } from './StatusBadge';

interface ProcessingLog {
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'success';
  message: string;
}

interface StatusMonitorProps {
  datasetId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  totalRecords: number;
  processedRecords: number;
  onRefresh: () => void;
  logs?: ProcessingLog[];
  errorMessage?: string;
  className?: string;
}

export function StatusMonitor({
  datasetId,
  status,
  progress,
  totalRecords,
  processedRecords,
  onRefresh,
  logs = [],
  errorMessage,
  className = ''
}: StatusMonitorProps) {
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Auto-refresh when processing
  useEffect(() => {
    if (status === 'processing') {
      setAutoRefresh(true);
      const interval = setInterval(() => {
        onRefresh();
      }, 5000); // Poll every 5 seconds

      return () => clearInterval(interval);
    } else {
      setAutoRefresh(false);
    }
  }, [status, onRefresh]);

  const getStatusIcon = () => {
    switch (status) {
      case 'pending':
        return <Clock className="h-6 w-6 text-yellow-500" />;
      case 'processing':
        return <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle2 className="h-6 w-6 text-green-500" />;
      case 'failed':
        return <XCircle className="h-6 w-6 text-red-500" />;
      default:
        return <Activity className="h-6 w-6 text-gray-500" />;
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'pending':
        return 'Dataset is queued for processing. Processing will start soon.';
      case 'processing':
        return `Processing dataset... ${processedRecords.toLocaleString()} of ${totalRecords.toLocaleString()} records completed.`;
      case 'completed':
        return `Successfully processed ${totalRecords.toLocaleString()} patent records.`;
      case 'failed':
        return errorMessage || 'Processing failed. Please check the logs for details.';
      default:
        return 'Status unknown';
    }
  };

  const getLogLevelIcon = (level: ProcessingLog['level']) => {
    switch (level) {
      case 'info':
        return <Activity className="h-4 w-4 text-blue-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <CardTitle className="flex items-center gap-2">
                Processing Status
                <StatusBadge status={status} />
              </CardTitle>
              <CardDescription className="mt-1">
                {getStatusMessage()}
              </CardDescription>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={autoRefresh}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto-refreshing' : 'Refresh'}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Progress Bar - shown for processing and completed */}
        {(status === 'processing' || status === 'completed') && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Progress</span>
              <span className="text-muted-foreground">{progress}%</span>
            </div>
            <Progress value={progress} className="h-3" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{processedRecords.toLocaleString()} processed</span>
              <span>{totalRecords.toLocaleString()} total</span>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {status === 'failed' && errorMessage && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        {/* Processing Statistics */}
        {(status === 'processing' || status === 'completed') && (
          <div className="grid grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Total Records</p>
              <p className="text-2xl font-bold">{totalRecords.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Processed</p>
              <p className="text-2xl font-bold text-blue-600">{processedRecords.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Remaining</p>
              <p className="text-2xl font-bold text-muted-foreground">
                {(totalRecords - processedRecords).toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {/* Processing Logs */}
        {logs.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Processing Logs
            </h4>
            <div className="border rounded-lg max-h-64 overflow-y-auto">
              <div className="divide-y">
                {logs.map((log, index) => (
                  <div key={index} className="p-3 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start gap-3">
                      {getLogLevelIcon(log.level)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">{log.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatTimestamp(log.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Pending State Message */}
        {status === 'pending' && (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              This dataset is in the queue. Processing will begin automatically when resources are available.
            </AlertDescription>
          </Alert>
        )}

        {/* Completed State Summary */}
        {status === 'completed' && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              Dataset processing completed successfully. You can now view and analyze the patent records.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
