'use client';

import { useState, useEffect } from 'react';
import { Workflow, Play, Pause, Settings, Clock, Repeat, Bell, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface WorkflowStep {
  id: string;
  type: 'search' | 'filter' | 'analyze' | 'export' | 'notify';
  name: string;
  config: any;
  status: 'pending' | 'running' | 'completed' | 'failed';
}

interface SearchWorkflowConfig {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  schedule?: {
    type: 'manual' | 'daily' | 'weekly' | 'monthly';
    time?: string;
    days?: string[];
  };
  steps: WorkflowStep[];
  lastRun?: string;
  nextRun?: string;
}

interface SearchWorkflowProps {
  projectId: string;
  sessionId?: string;
  onWorkflowExecute?: (workflowId: string) => void;
}

export function SearchWorkflow({ 
  projectId, 
  sessionId,
  onWorkflowExecute
}: SearchWorkflowProps) {
  const [workflows, setWorkflows] = useState<SearchWorkflowConfig[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);

  // Mock workflow data
  useEffect(() => {
    setWorkflows([
      {
        id: 'competitive-monitoring',
        name: 'Competitive Monitoring',
        description: 'Daily monitoring of competitor patent filings',
        enabled: true,
        schedule: {
          type: 'daily',
          time: '09:00'
        },
        steps: [
          {
            id: 'search-1',
            type: 'search',
            name: 'Search Competitor Patents',
            config: { 
              query: 'assignee:"Apple Inc" OR assignee:"Google LLC"',
              dateRange: 'last_7_days'
            },
            status: 'completed'
          },
          {
            id: 'filter-1',
            type: 'filter',
            name: 'Filter by Technology',
            config: { 
              classifications: ['G06F', 'H04L'],
              minCitations: 5
            },
            status: 'completed'
          },
          {
            id: 'analyze-1',
            type: 'analyze',
            name: 'Technology Trend Analysis',
            config: { 
              analysisType: 'trend',
              timeWindow: '1_year'
            },
            status: 'running'
          },
          {
            id: 'notify-1',
            type: 'notify',
            name: 'Send Alert Email',
            config: { 
              recipients: ['team@company.com'],
              threshold: 10
            },
            status: 'pending'
          }
        ],
        lastRun: '2024-12-10T09:00:00Z',
        nextRun: '2024-12-11T09:00:00Z'
      },
      {
        id: 'portfolio-analysis',
        name: 'Portfolio Analysis',
        description: 'Weekly analysis of patent portfolio strength',
        enabled: false,
        schedule: {
          type: 'weekly',
          time: '10:00',
          days: ['monday']
        },
        steps: [
          {
            id: 'search-2',
            type: 'search',
            name: 'Search Portfolio Patents',
            config: { 
              query: 'assignee:"Our Company"',
              includeExpired: false
            },
            status: 'pending'
          },
          {
            id: 'analyze-2',
            type: 'analyze',
            name: 'Portfolio Gap Analysis',
            config: { 
              analysisType: 'gap_analysis',
              compareWith: ['competitor_portfolios']
            },
            status: 'pending'
          },
          {
            id: 'export-1',
            type: 'export',
            name: 'Generate Report',
            config: { 
              format: 'pdf',
              includeCharts: true
            },
            status: 'pending'
          }
        ],
        lastRun: '2024-12-03T10:00:00Z',
        nextRun: '2024-12-16T10:00:00Z'
      }
    ]);
  }, [projectId, sessionId]);

  const getStepIcon = (type: string) => {
    switch (type) {
      case 'search': return <Play className="h-3 w-3" />;
      case 'filter': return <Settings className="h-3 w-3" />;
      case 'analyze': return <Workflow className="h-3 w-3" />;
      case 'export': return <ChevronRight className="h-3 w-3" />;
      case 'notify': return <Bell className="h-3 w-3" />;
      default: return <Play className="h-3 w-3" />;
    }
  };

  const getStepStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'running': return 'bg-blue-100 text-blue-700';
      case 'failed': return 'bg-red-100 text-red-700';
      case 'pending': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const toggleWorkflow = (workflowId: string) => {
    setWorkflows(prev => 
      prev.map(workflow => 
        workflow.id === workflowId 
          ? { ...workflow, enabled: !workflow.enabled }
          : workflow
      )
    );
  };

  const executeWorkflow = (workflowId: string) => {
    onWorkflowExecute?.(workflowId);
    // Update workflow status to running
    setWorkflows(prev => 
      prev.map(workflow => 
        workflow.id === workflowId 
          ? { 
              ...workflow, 
              steps: workflow.steps.map(step => ({ ...step, status: 'running' })),
              lastRun: new Date().toISOString()
            }
          : workflow
      )
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg">
                <Workflow className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">Search Workflows</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary">{workflows.length} workflows</Badge>
                  <Badge variant="outline">
                    {workflows.filter(w => w.enabled).length} active
                  </Badge>
                </div>
              </div>
            </div>
            <Button size="sm">
              <Settings className="h-4 w-4 mr-1" />
              New Workflow
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {workflows.map((workflow) => (
              <Card key={workflow.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-sm">{workflow.name}</h3>
                        <Badge variant={workflow.enabled ? 'default' : 'secondary'}>
                          {workflow.enabled ? 'Active' : 'Disabled'}
                        </Badge>
                        {workflow.schedule && (
                          <Badge variant="outline" className="text-xs">
                            <Clock className="h-2 w-2 mr-1" />
                            {workflow.schedule.type}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">
                        {workflow.description}
                      </p>
                      
                      {/* Workflow Steps */}
                      <div className="flex items-center gap-2 mb-3">
                        {workflow.steps.map((step, index) => (
                          <div key={step.id} className="flex items-center">
                            <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${getStepStatusColor(step.status)}`}>
                              {getStepIcon(step.type)}
                              {step.name}
                            </div>
                            {index < workflow.steps.length - 1 && (
                              <ChevronRight className="h-3 w-3 text-muted-foreground mx-1" />
                            )}
                          </div>
                        ))}
                      </div>
                      
                      {/* Schedule Info */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {workflow.lastRun && (
                          <span>
                            Last: {new Date(workflow.lastRun).toLocaleDateString()}
                          </span>
                        )}
                        {workflow.nextRun && workflow.enabled && (
                          <span>
                            Next: {new Date(workflow.nextRun).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={workflow.enabled}
                          onCheckedChange={() => toggleWorkflow(workflow.id)}
                          id={`workflow-${workflow.id}`}
                        />
                        <Label htmlFor={`workflow-${workflow.id}`} className="text-xs">
                          Enable
                        </Label>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => executeWorkflow(workflow.id)}
                        disabled={!workflow.enabled}
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Run
                      </Button>
                    </div>
                  </div>
                  
                  {/* Expanded View */}
                  {selectedWorkflow === workflow.id && (
                    <div className="border-t pt-4">
                      <div className="space-y-3">
                        {workflow.steps.map((step) => (
                          <div key={step.id} className="flex items-center gap-3 p-2 bg-muted/50 rounded">
                            <Badge className={getStepStatusColor(step.status)}>
                              {getStepIcon(step.type)}
                              {step.status}
                            </Badge>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{step.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {JSON.stringify(step.config, null, 2).slice(0, 100)}...
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    className="mt-2 w-full"
                    onClick={() => setSelectedWorkflow(
                      selectedWorkflow === workflow.id ? null : workflow.id
                    )}
                  >
                    {selectedWorkflow === workflow.id ? 'Hide Details' : 'Show Details'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}