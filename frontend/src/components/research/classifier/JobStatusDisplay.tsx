/**
 * Job Status Display - Shows real-time status of submitted analysis jobs
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Clock, CheckCircle, XCircle, Loader2, Activity, 
  RefreshCw, AlertCircle, Download, Eye
} from 'lucide-react';
import { JobSubmission, JobTemplatesService } from '@/services/jobTemplates';

interface JobStatusDisplayProps {
  jobSubmission: JobSubmission;
  jobId: string;
  onComplete?: (results: any) => void;
}

export type JobStatus = 'pending' | 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

interface JobStatusUpdate {
  status: JobStatus;
  progress: number;
  stage: string;
  estimatedTimeRemaining: number; // minutes
  logs: string[];
  results?: any;
}

export function JobStatusDisplay({ 
  jobSubmission, 
  jobId, 
  onComplete 
}: JobStatusDisplayProps) {
  const [jobStatus, setJobStatus] = useState<JobStatusUpdate>({
    status: 'pending',
    progress: 0,
    stage: 'Initializing...',
    estimatedTimeRemaining: 0,
    logs: []
  });

  const [startTime] = useState(new Date());
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const template = JobTemplatesService.getTemplateById(jobSubmission.templateId);

  // Mock job progress simulation (replace with real WebSocket/polling)
  useEffect(() => {
    const simulateJobProgress = () => {
      const stages = [
        { name: 'Initializing job', duration: 2000 },
        { name: 'Loading datasets', duration: 3000 },
        { name: 'Preprocessing data', duration: 5000 },
        { name: 'Running analysis', duration: 15000 },
        { name: 'Generating results', duration: 4000 },
        { name: 'Finalizing outputs', duration: 2000 }
      ];

      let currentStage = 0;
      let totalProgress = 0;

      setJobStatus(prev => ({ ...prev, status: 'queued', stage: 'Job queued...' }));

      const progressInterval = setInterval(() => {
        if (currentStage >= stages.length) {
          setJobStatus(prev => ({
            ...prev,
            status: 'completed',
            progress: 100,
            stage: 'Analysis complete!',
            estimatedTimeRemaining: 0,
            results: {
              outputFiles: template?.outputs || [],
              summary: `Analysis completed for ${jobSubmission.datasetIds.length} datasets`
            }
          }));
          setLastUpdate(new Date());
          clearInterval(progressInterval);
          if (onComplete) {
            onComplete(jobId);
          }
          return;
        }

        const stage = stages[currentStage];
        const progressIncrement = 100 / stages.length;
        totalProgress = Math.min(100, (currentStage + 1) * progressIncrement);

        setJobStatus(prev => ({
          ...prev,
          status: 'running',
          progress: totalProgress,
          stage: stage.name,
          estimatedTimeRemaining: Math.max(0, (stages.length - currentStage) * 2),
          logs: [...prev.logs, `${new Date().toLocaleTimeString()}: ${stage.name}`]
        }));
        setLastUpdate(new Date());

        setTimeout(() => {
          currentStage++;
        }, stage.duration);
      }, 1000);

      return () => clearInterval(progressInterval);
    };

    const timeoutId = setTimeout(simulateJobProgress, 1000);
    return () => clearTimeout(timeoutId);
  }, [jobId, jobSubmission, template, onComplete]);

  const getStatusColor = (status: JobStatus) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'queued': return 'bg-yellow-100 text-yellow-800';
      case 'running': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: JobStatus) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'queued':
        return <Clock className="h-4 w-4" />;
      case 'running':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'failed':
        return <XCircle className="h-4 w-4" />;
      case 'cancelled':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const elapsedTime = Math.floor((lastUpdate.getTime() - startTime.getTime()) / 1000 / 60);

  return (
    <div className="space-y-6">
      {/* Job Header */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg">{template?.name || 'Analysis Job'}</CardTitle>
              <CardDescription>
                Job ID: {jobId} • Started {elapsedTime} minutes ago
              </CardDescription>
            </div>
            <Badge className={getStatusColor(jobStatus.status)}>
              {getStatusIcon(jobStatus.status)}
              <span className="ml-2 capitalize">{jobStatus.status}</span>
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Progress Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{jobStatus.stage}</span>
              <span>{Math.round(jobStatus.progress)}%</span>
            </div>
            <Progress value={jobStatus.progress} className="h-2" />
          </div>

          {jobStatus.estimatedTimeRemaining > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>~{jobStatus.estimatedTimeRemaining} minutes remaining</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <div className="text-sm font-medium">Datasets</div>
              <div className="text-2xl font-bold">{jobSubmission.datasetIds.length}</div>
            </div>
            <div>
              <div className="text-sm font-medium">Intensity</div>
              <div className="text-sm capitalize">{jobSubmission.intensity}</div>
            </div>
          </div>
        </CardContent>
      </Card>


      {/* Results Section */}
      {jobStatus.status === 'completed' && jobStatus.results && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Analysis Complete!
            </CardTitle>
            <CardDescription>
              Your analysis has finished successfully. Results are ready for review.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button size="sm">
                <Eye className="h-4 w-4 mr-2" />
                View Results
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Section */}
      {jobStatus.status === 'failed' && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            The analysis job failed to complete. Please try again or contact support if the problem persists.
          </AlertDescription>
        </Alert>
      )}

      {/* Activity Log */}
      {jobStatus.logs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Activity Log</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-sm">
              {jobStatus.logs.slice(-5).map((log, index) => (
                <div key={index} className="text-muted-foreground">
                  {log}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}