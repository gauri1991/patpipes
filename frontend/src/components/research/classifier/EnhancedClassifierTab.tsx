/**
 * Enhanced Job-Based Classifier System
 * Dataset Selection → Job Selection → Live Processing → Results
 */

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Database, Settings, Activity, BarChart3, 
  CheckCircle, ArrowRight, AlertCircle
} from 'lucide-react';

// Import our new tab components
import { DatasetManagerTab } from './DatasetManagerTab';
import { JobSelectionTab } from './JobSelectionTab';
import { JobSubmissionsList } from './JobSubmissionsList';
import { agenticApi } from '@/services/agenticApi';
import { JobSubmission, JobTemplatesService } from '@/services/jobTemplates';

interface EnhancedClassifierTabProps {
  projectId: string;
  onAnalysisComplete?: (results: any) => void;
}

type WorkflowStep = 'dataset-selection' | 'job-selection' | 'submissions' | 'results';

interface WorkflowState {
  step: WorkflowStep;
  selectedDatasetIds: string[];
  mergeDatasets: boolean;
  jobSubmission: JobSubmission | null;
  pipelineId: string | null;
}

export function EnhancedClassifierTab({ 
  projectId, 
  onAnalysisComplete 
}: EnhancedClassifierTabProps) {
  const [workflow, setWorkflow] = useState<WorkflowState>({
    step: 'dataset-selection',
    selectedDatasetIds: [],
    mergeDatasets: false,
    jobSubmission: null,
    pipelineId: null
  });
  const [activeTab, setActiveTab] = useState('datasets');

  const handleDatasetsSelected = (datasetIds: string[], merge: boolean) => {
    setWorkflow(prev => ({
      ...prev,
      selectedDatasetIds: datasetIds,
      mergeDatasets: merge,
      step: 'job-selection'
    }));
    setActiveTab('job-selection');
  };

  const handleJobSelected = async (submission: JobSubmission) => {
    // Submit job to AIMLOps (mock for now)
    try {
      const result = await JobTemplatesService.submitJob(submission);
      setWorkflow(prev => ({
        ...prev,
        jobSubmission: { ...submission, jobId: result.jobId },
        pipelineId: result.jobId,
        step: 'submissions'
      }));
      setActiveTab('submissions');
    } catch (error) {
      console.error('Failed to submit job:', error);
    }
  };


  const getTabStatus = (tab: string) => {
    switch (tab) {
      case 'datasets':
        return workflow.selectedDatasetIds.length > 0 ? 'completed' : 
               workflow.step === 'dataset-selection' ? 'active' : 'pending';
      case 'job-selection':
        return workflow.jobSubmission ? 'completed' :
               workflow.step === 'job-selection' ? 'active' : 
               workflow.selectedDatasetIds.length > 0 ? 'pending' : 'disabled';
      case 'submissions':
        return workflow.step === 'submissions' ? 'active' :
               workflow.jobSubmission ? 'pending' : 'disabled';
      case 'results':
        return workflow.step === 'results' ? 'active' :
               workflow.pipelineId ? 'pending' : 'disabled';
      default:
        return 'disabled';
    }
  };

  const getTabIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'active':
        return <Activity className="h-4 w-4 text-blue-500" />;
      case 'pending':
        return <ArrowRight className="h-4 w-4 text-orange-500" />;
      default:
        return null;
    }
  };

  const canNavigateToTab = (tab: string) => {
    const status = getTabStatus(tab);
    return status !== 'disabled';
  };

  return (
    <div className="space-y-6">
      {/* Workflow Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">AI-Powered Patent Analysis</h2>
        <p className="text-muted-foreground">
          Select datasets, choose analysis jobs, and get comprehensive patent insights
        </p>
      </div>

      {/* Workflow Progress */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            {[
              { key: 'datasets', label: 'Select Datasets', icon: Database },
              { key: 'job-selection', label: 'Choose Analysis', icon: Settings },
              { key: 'submissions', label: 'Submissions', icon: Activity },
              { key: 'results', label: 'View Results', icon: BarChart3 }
            ].map((step, index) => {
              const status = getTabStatus(step.key);
              const Icon = step.icon;
              
              return (
                <div key={step.key} className="flex items-center">
                  <div className={`
                    flex flex-col items-center space-y-2 p-3 rounded-lg transition-all
                    ${status === 'active' ? 'bg-blue-100 border border-blue-300' : ''}
                    ${status === 'completed' ? 'bg-green-50' : ''}
                  `}>
                    <div className="flex items-center gap-2">
                      <Icon className={`h-5 w-5 ${
                        status === 'completed' ? 'text-green-600' :
                        status === 'active' ? 'text-blue-600' :
                        status === 'pending' ? 'text-orange-500' :
                        'text-muted-foreground'
                      }`} />
                      {getTabIcon(status)}
                    </div>
                    <span className={`text-sm font-medium ${
                      status === 'disabled' ? 'text-muted-foreground' : ''
                    }`}>
                      {step.label}
                    </span>
                  </div>
                  
                  {index < 3 && (
                    <ArrowRight className="h-4 w-4 text-muted-foreground mx-2" />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger 
            value="datasets"
            disabled={!canNavigateToTab('datasets')}
          >
            <Database className="h-4 w-4 mr-2" />
            Datasets
            {workflow.selectedDatasetIds.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {workflow.selectedDatasetIds.length}
              </Badge>
            )}
          </TabsTrigger>
          
          <TabsTrigger 
            value="job-selection"
            disabled={!canNavigateToTab('job-selection')}
          >
            <Settings className="h-4 w-4 mr-2" />
            Analysis Job
            {workflow.jobSubmission && (
              <CheckCircle className="h-3 w-3 ml-2 text-green-500" />
            )}
          </TabsTrigger>
          
          <TabsTrigger 
            value="submissions"
            disabled={!canNavigateToTab('submissions')}
          >
            <Activity className="h-4 w-4 mr-2" />
            Submissions
          </TabsTrigger>
          
          <TabsTrigger 
            value="results"
            disabled={!canNavigateToTab('results')}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Results
          </TabsTrigger>
        </TabsList>

        <TabsContent value="datasets" className="space-y-4">
          <DatasetManagerTab
            projectId={projectId}
            onDatasetsSelected={handleDatasetsSelected}
          />
        </TabsContent>

        <TabsContent value="job-selection" className="space-y-4">
          {workflow.selectedDatasetIds.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please select datasets first before choosing an analysis job.
              </AlertDescription>
            </Alert>
          ) : (
            <JobSelectionTab
              selectedDatasetIds={workflow.selectedDatasetIds}
              onJobSelected={handleJobSelected}
            />
          )}
        </TabsContent>

        <TabsContent value="submissions" className="space-y-4">
          <JobSubmissionsList
            projectId={projectId}
            newSubmission={workflow.jobSubmission && workflow.pipelineId ? 
              { ...workflow.jobSubmission, jobId: workflow.pipelineId } : undefined}
          />
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          {!workflow.pipelineId ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Processing results will appear here after pipeline completion.
              </AlertDescription>
            </Alert>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Analysis Results</CardTitle>
                <CardDescription>
                  {workflow.jobSubmission ? 
                    `${JobTemplatesService.getTemplateById(workflow.jobSubmission.templateId)?.name} completed successfully` :
                    `Job ${workflow.pipelineId} completed successfully`
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-muted-foreground">Analysis complete! Your results are ready for review.</p>
                  {workflow.jobSubmission && (
                    <div>
                      <h4 className="font-medium mb-2">Generated Outputs:</h4>
                      <ul className="space-y-1">
                        {JobTemplatesService.getTemplateById(workflow.jobSubmission.templateId)?.outputs.map((output, index) => (
                          <li key={index} className="flex items-center gap-2 text-sm">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                            {output}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}