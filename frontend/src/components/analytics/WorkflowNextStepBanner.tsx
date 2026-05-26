'use client';

import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WorkflowNextStepBannerProps {
  currentTab: string;
  project: any;
  onNavigateTab: (tab: string) => void;
}

export function WorkflowNextStepBanner({ currentTab, project, onNavigateTab }: WorkflowNextStepBannerProps) {
  const datasets = project?.datasets || [];
  const visualizations = project?.visualizations || [];
  const reports = project?.reports || [];
  const hasProcessedDatasets = datasets.some((d: any) => d.processing_status === 'completed');
  const hasCompletedViz = visualizations.some((v: any) => v.status === 'completed');

  let message = '';
  let targetTab = '';

  switch (currentTab) {
    case 'overview':
      if (datasets.length === 0) {
        message = 'Start by importing patent data';
        targetTab = 'datasets';
      }
      break;
    case 'research':
      message = 'Create a dataset from your research results';
      targetTab = 'datasets';
      break;
    case 'datasets':
      if (hasProcessedDatasets) {
        message = 'Classify your patents or run analysis';
        targetTab = 'classifier';
      }
      break;
    case 'classifier':
      message = 'Run advanced analysis on your classified data';
      targetTab = 'analysis';
      break;
    case 'analysis':
      if (datasets.length > 0) {
        message = 'Create visualizations from your analysis results';
        targetTab = 'visualizations';
      }
      break;
    case 'visualizations':
      if (hasCompletedViz) {
        message = 'Generate a professional report';
        targetTab = 'reports';
      }
      break;
  }

  if (!message || !targetTab || targetTab === currentTab) return null;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2.5 mb-4">
      <p className="text-sm flex-1">
        <span className="font-medium">Next step:</span>{' '}
        <span className="text-muted-foreground">{message}</span>
      </p>
      <Button variant="outline" size="sm" className="shrink-0 gap-1.5" onClick={() => onNavigateTab(targetTab)}>
        Go to {targetTab.charAt(0).toUpperCase() + targetTab.slice(1)}
        <ArrowRight className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
