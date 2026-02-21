/**
 * Job Submissions List - Shows all submitted jobs for the project
 */

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Clock, CheckCircle, XCircle, Loader2, Activity, 
  Eye, Download, Trash2, RefreshCw, Calendar
} from 'lucide-react';
import { JobSubmission, JobTemplatesService } from '@/services/jobTemplates';

interface JobSubmissionRecord {
  id: string;
  submission: JobSubmission;
  submittedAt: Date;
  status: 'pending' | 'running' | 'completed' | 'failed';
  completedAt?: Date;
  resultUrl?: string;
}

interface JobSubmissionsListProps {
  projectId: string;
  newSubmission?: JobSubmission & { jobId: string };
}

export function JobSubmissionsList({ projectId, newSubmission }: JobSubmissionsListProps) {
  const [submissions, setSubmissions] = useState<JobSubmissionRecord[]>([]);
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const processedJobsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Load existing submissions for this project (from localStorage or API)
    const storedSubmissions = localStorage.getItem(`project_${projectId}_submissions`);
    if (storedSubmissions) {
      const parsed = JSON.parse(storedSubmissions);
      // Convert date strings back to Date objects and remove duplicates
      const submissionsMap = new Map<string, any>();
      parsed.forEach((sub: any) => {
        if (!submissionsMap.has(sub.id)) {
          submissionsMap.set(sub.id, {
            ...sub,
            submittedAt: new Date(sub.submittedAt),
            completedAt: sub.completedAt ? new Date(sub.completedAt) : undefined
          });
          processedJobsRef.current.add(sub.id);
        }
      });
      setSubmissions(Array.from(submissionsMap.values()));
    }
  }, [projectId]);

  useEffect(() => {
    // Add new submission if provided
    if (newSubmission && !processedJobsRef.current.has(newSubmission.jobId)) {
      processedJobsRef.current.add(newSubmission.jobId);
      
      const newRecord: JobSubmissionRecord = {
        id: newSubmission.jobId,
        submission: newSubmission,
        submittedAt: new Date(),
        status: 'running'
      };
      
      setSubmissions(prev => {
        // Double-check for duplicates
        const filtered = prev.filter(sub => sub.id !== newSubmission.jobId);
        const updated = [newRecord, ...filtered];
        // Save to localStorage
        localStorage.setItem(`project_${projectId}_submissions`, JSON.stringify(updated));
        return updated;
      });

      // Simulate job completion after random time
      setTimeout(() => {
        setSubmissions(prevSubs => prevSubs.map(sub => 
          sub.id === newSubmission.jobId 
            ? { ...sub, status: 'completed', completedAt: new Date() }
            : sub
        ));
      }, Math.random() * 10000 + 5000);
    }
  }, [newSubmission, projectId]);

  const getStatusIcon = (status: JobSubmissionRecord['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'running':
        return <Activity className="h-4 w-4 animate-pulse" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'failed':
        return <XCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: JobSubmissionRecord['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-gray-100 text-gray-700';
      case 'running':
        return 'bg-blue-100 text-blue-700';
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'failed':
        return 'bg-red-100 text-red-700';
    }
  };

  const formatDuration = (start: Date | string, end?: Date | string) => {
    const startTime = start instanceof Date ? start : new Date(start);
    const endTime = end ? (end instanceof Date ? end : new Date(end)) : new Date();
    const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
    
    if (duration < 60) return `${duration}s`;
    if (duration < 3600) return `${Math.floor(duration / 60)}m ${duration % 60}s`;
    return `${Math.floor(duration / 3600)}h ${Math.floor((duration % 3600) / 60)}m`;
  };

  const handleRefresh = () => {
    // Refresh submissions list
    window.location.reload();
  };

  const handleDelete = (id: string) => {
    setSubmissions(prev => {
      const updated = prev.filter(sub => sub.id !== id);
      localStorage.setItem(`project_${projectId}_submissions`, JSON.stringify(updated));
      return updated;
    });
  };

  if (submissions.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center space-y-3">
            <Activity className="h-12 w-12 text-muted-foreground mx-auto" />
            <h3 className="text-lg font-medium">No Jobs Submitted Yet</h3>
            <p className="text-muted-foreground">
              Submit your first analysis job to see it appear here
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Submitted Jobs</h3>
          <p className="text-sm text-muted-foreground">
            {submissions.length} job{submissions.length !== 1 ? 's' : ''} submitted for this project
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Submissions List */}
      <div className="space-y-3">
        {submissions.map(submission => {
          const template = JobTemplatesService.getTemplateById(submission.submission.templateId);
          return (
            <Card key={submission.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <Badge className={getStatusColor(submission.status)}>
                        {getStatusIcon(submission.status)}
                        <span className="ml-1 capitalize">{submission.status}</span>
                      </Badge>
                      <span className="font-medium">{template?.name || 'Custom Analysis'}</span>
                      <span className="text-sm text-muted-foreground">
                        ID: {submission.id.slice(0, 12)}...
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(submission.submittedAt).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>Duration: {formatDuration(submission.submittedAt, submission.completedAt)}</span>
                      </div>
                      <div>
                        {submission.submission.datasetIds.length} dataset{submission.submission.datasetIds.length !== 1 ? 's' : ''}
                      </div>
                    </div>

                    {/* Job Details */}
                    {selectedJob === submission.id && (
                      <div className="mt-3 pt-3 border-t space-y-2">
                        <div className="text-sm">
                          <strong>Intensity:</strong> {submission.submission.intensity}
                        </div>
                        {submission.submission.customPrompt && (
                          <div className="text-sm">
                            <strong>Custom Instructions:</strong>
                            <p className="text-muted-foreground mt-1">
                              {submission.submission.customPrompt.slice(0, 200)}
                              {submission.submission.customPrompt.length > 200 && '...'}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedJob(selectedJob === submission.id ? null : submission.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    
                    {submission.status === 'completed' && (
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                    
                    {submission.status !== 'running' && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDelete(submission.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}