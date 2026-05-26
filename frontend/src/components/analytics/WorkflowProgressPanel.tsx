'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { analyticsApi } from '@/services/analyticsApi';
import { toast } from 'sonner';
import {
  ProjectWorkflowConfig,
  PhaseProgress,
  WorkflowPhase,
  computePhaseProgress,
  getStatusForPhaseCount,
} from '@/app/dashboard/analytics/projects/[id]/workflowConfig';
import { TabId } from '@/app/dashboard/analytics/projects/[id]/tabConfig';

interface AIRecommendations {
  recommendations: string[];
  action_items: string[];
}

interface WorkflowProgressPanelProps {
  projectId: string;
  config: ProjectWorkflowConfig;
  phaseProgress: PhaseProgress;
  onPhaseProgressChange: (updated: PhaseProgress) => void;
  onNavigateToTab: (tabId: TabId) => void;
  currentAnalysisScope: Record<string, unknown>;
}

function PhaseRow({
  phase,
  index,
  isActive,
  isComplete,
  progress,
  projectId,
  config,
  currentAnalysisScope,
  onStepToggle,
  onNavigate,
}: {
  phase: WorkflowPhase;
  index: number;
  isActive: boolean;
  isComplete: boolean;
  progress: { completed_steps: number[]; completed_at: string | null };
  projectId: string;
  config: ProjectWorkflowConfig;
  currentAnalysisScope: Record<string, unknown>;
  onStepToggle: (phaseId: string, stepIndex: number) => void;
  onNavigate: (tabId: TabId) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(isActive);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AIRecommendations | null>(null);

  const completedSteps = progress.completed_steps ?? [];
  const stepsTotal = phase.steps.length;
  const stepsDone = completedSteps.length;

  const handleAiRecommendations = async () => {
    setAiLoading(true);
    try {
      const result = await analyticsApi.getPhaseRecommendations(projectId, {
        phase_name: phase.name,
        description: phase.description,
        steps: phase.steps,
      });
      if (result.success && result.data) {
        setAiResult(result.data);
      } else {
        toast.error('Could not generate recommendations');
      }
    } catch {
      toast.error('Failed to get AI recommendations');
    } finally {
      setAiLoading(false);
    }
  };

  const statusIcon = isComplete ? (
    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
  ) : isActive ? (
    <div className="h-5 w-5 rounded-full border-2 border-blue-500 flex items-center justify-center shrink-0">
      <div className="h-2 w-2 rounded-full bg-blue-500" />
    </div>
  ) : (
    <Circle className="h-5 w-5 text-muted-foreground/40 shrink-0" />
  );

  return (
    <div
      className={`rounded-lg border transition-colors ${
        isActive
          ? 'border-blue-300 bg-blue-50/50 dark:border-blue-700 dark:bg-blue-950/20'
          : isComplete
          ? 'border-green-200 bg-green-50/30 dark:border-green-800 dark:bg-green-950/10'
          : 'border-border bg-background'
      }`}
    >
      {/* Phase header */}
      <button
        onClick={() => setIsExpanded((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
        aria-expanded={isExpanded}
      >
        {statusIcon}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium">
              Phase {index + 1}
            </span>
            {isActive && (
              <Badge variant="outline" className="text-[10px] px-1 py-0 border-blue-400 text-blue-600">
                ACTIVE
              </Badge>
            )}
          </div>
          <p className="font-medium text-sm truncate">{phase.name}</p>
          {!isExpanded && (
            <p className="text-xs text-muted-foreground">
              {stepsDone}/{stepsTotal} steps
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground">[{phase.primaryTab}]</span>
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t border-inherit px-4 pb-4 pt-3 space-y-3">
          <p className="text-xs text-muted-foreground">{phase.description}</p>

          {/* Steps checklist */}
          <div className="space-y-2">
            {phase.steps.map((step, stepIdx) => {
              const checked = completedSteps.includes(stepIdx);
              return (
                <div key={stepIdx} className="flex items-start gap-2">
                  <Checkbox
                    id={`${phase.id}-step-${stepIdx}`}
                    checked={checked}
                    onCheckedChange={() => onStepToggle(phase.id, stepIdx)}
                    className="mt-0.5"
                  />
                  <label
                    htmlFor={`${phase.id}-step-${stepIdx}`}
                    className={`text-sm cursor-pointer leading-snug ${
                      checked ? 'line-through text-muted-foreground' : ''
                    }`}
                  >
                    {step}
                  </label>
                </div>
              );
            })}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 pt-1">
            {(isActive || isComplete) && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleAiRecommendations}
                disabled={aiLoading}
                className="text-xs h-7"
              >
                {aiLoading ? (
                  <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                ) : (
                  <Sparkles className="mr-1.5 h-3 w-3" />
                )}
                {aiLoading ? 'Thinking...' : 'AI Recommendations'}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate(phase.primaryTab as TabId)}
              className="text-xs h-7"
            >
              <ArrowRight className="mr-1.5 h-3 w-3" />
              Open {phase.primaryTab} tab
            </Button>
          </div>

          {/* AI recommendations card */}
          {aiResult && (
            <div className="rounded-md border border-purple-200 bg-purple-50/50 dark:border-purple-800 dark:bg-purple-950/20 p-3 space-y-2">
              <p className="text-xs font-semibold text-purple-700 dark:text-purple-300 flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> AI Suggestions
              </p>
              {aiResult.recommendations.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Recommendations</p>
                  <ul className="space-y-1">
                    {aiResult.recommendations.map((rec, i) => (
                      <li key={i} className="text-xs flex items-start gap-1.5">
                        <span className="text-purple-400 shrink-0 mt-0.5">•</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {aiResult.action_items.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Next Actions</p>
                  <ul className="space-y-1">
                    {aiResult.action_items.map((item, i) => (
                      <li key={i} className="text-xs flex items-start gap-1.5">
                        <span className="text-blue-400 shrink-0 mt-0.5">→</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function WorkflowProgressPanel({
  projectId,
  config,
  phaseProgress,
  onPhaseProgressChange,
  onNavigateToTab,
  currentAnalysisScope,
}: WorkflowProgressPanelProps) {
  const hasFetchedRef = useRef(false);
  const { completedPhases, totalStepsCompleted, totalSteps, overallPct } = computePhaseProgress(
    config.phases,
    phaseProgress,
  );

  // Fetch persisted workflow progress from backend on mount
  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    (async () => {
      try {
        const result = await analyticsApi.getWorkflowProgress(projectId);
        if (result.success && result.data?.workflow_progress) {
          const backendProgress = result.data.workflow_progress as PhaseProgress;
          // Only update if the backend has data (merge wins over empty local state)
          if (Object.keys(backendProgress).length > 0) {
            onPhaseProgressChange(backendProgress);
          }
        }
      } catch {
        // Fallback: keep whatever was loaded from localStorage / parent state
      }
    })();
  }, [projectId, onPhaseProgressChange]);

  const handleStepToggle = useCallback(
    async (phaseId: string, stepIndex: number) => {
      const existing = phaseProgress[phaseId] ?? {
        completed_steps: [],
        started_at: null,
        completed_at: null,
      };
      const isChecked = existing.completed_steps.includes(stepIndex);
      const newSteps = isChecked
        ? existing.completed_steps.filter((s) => s !== stepIndex)
        : [...existing.completed_steps, stepIndex];

      const phase = config.phases.find((p) => p.id === phaseId)!;
      const allComplete = newSteps.length === phase.steps.length;

      const updatedEntry = {
        ...existing,
        completed_steps: newSteps,
        started_at: existing.started_at ?? new Date().toISOString(),
        completed_at: allComplete ? new Date().toISOString() : null,
      };

      const updated: PhaseProgress = { ...phaseProgress, [phaseId]: updatedEntry };
      onPhaseProgressChange(updated);

      // Persist to backend via dedicated workflow-progress endpoint
      try {
        await analyticsApi.updateWorkflowProgress(projectId, {
          phase_id: phaseId,
          step_index: stepIndex,
          completed: !isChecked,
        });
      } catch {
        toast.error('Failed to save progress');
      }

      // Auto-advance status
      if (allComplete) {
        const newCompletedPhases = config.phases.filter((p) => {
          const prog = updated[p.id];
          return (prog?.completed_steps?.length ?? 0) === p.steps.length && p.steps.length > 0;
        }).length;
        const newStatus = getStatusForPhaseCount(config.statusProgressMap, newCompletedPhases);
        try {
          await analyticsApi.updateProjectStatus(projectId, newStatus);
        } catch {
          // Non-critical — don't block the user
        }
      }
    },
    [phaseProgress, config, projectId, onPhaseProgressChange],
  );

  // Determine active phase: first incomplete phase
  const activePhaseIndex = config.phases.findIndex((phase) => {
    const prog = phaseProgress[phase.id];
    return (prog?.completed_steps?.length ?? 0) < phase.steps.length;
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">
            Workflow Progress &mdash; {config.displayName}
          </CardTitle>
          <span className="text-xs text-muted-foreground">
            Phase {Math.min(activePhaseIndex + 1, config.phases.length)} of {config.phases.length}
          </span>
        </div>
        <div className="space-y-1 mt-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{totalStepsCompleted} / {totalSteps} steps complete</span>
            <span>{overallPct}%</span>
          </div>
          <Progress value={overallPct} className="h-2" />
        </div>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        {config.phases.map((phase, index) => {
          const prog = phaseProgress[phase.id] ?? { completed_steps: [], started_at: null, completed_at: null };
          const isComplete = prog.completed_steps.length === phase.steps.length && phase.steps.length > 0;
          const isActive = index === activePhaseIndex;

          return (
            <PhaseRow
              key={phase.id}
              phase={phase}
              index={index}
              isActive={isActive}
              isComplete={isComplete}
              progress={prog}
              projectId={projectId}
              config={config}
              currentAnalysisScope={currentAnalysisScope}
              onStepToggle={handleStepToggle}
              onNavigate={onNavigateToTab}
            />
          );
        })}
      </CardContent>
    </Card>
  );
}
