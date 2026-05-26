'use client';

import { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TabWorkflowContext } from '@/app/dashboard/analytics/projects/[id]/workflowConfig';

interface WorkflowGuidePanelProps {
  projectId: string;
  tabId: string;
  displayName: string;
  context: TabWorkflowContext;
}

export function WorkflowGuidePanel({ projectId, tabId, displayName, context }: WorkflowGuidePanelProps) {
  const storageKey = `${projectId}-${tabId}-guide-open`;
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored !== null) {
      setIsOpen(stored === 'true');
    }
  }, [storageKey]);

  const toggle = () => {
    const next = !isOpen;
    setIsOpen(next);
    localStorage.setItem(storageKey, String(next));
  };

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50/60 dark:border-blue-800 dark:bg-blue-950/20">
      {/* Header — always visible */}
      <div className="flex items-center justify-between px-4 py-2.5">
        <div className="flex items-center gap-2 text-sm font-medium text-blue-700 dark:text-blue-300">
          <Info className="h-4 w-4 shrink-0" />
          <span>{displayName} — {context.roleInWorkflow}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggle}
          className="h-7 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-100 dark:text-blue-400"
          aria-label={isOpen ? 'Hide guidance' : 'Show guidance'}
        >
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          <span className="ml-1 text-xs">{isOpen ? 'Hide' : 'Show'}</span>
        </Button>
      </div>

      {isOpen && (
        <div className="border-t border-blue-200 dark:border-blue-800 px-4 py-3 space-y-2">
          <p className="text-sm text-blue-800 dark:text-blue-200">{context.guidance}</p>
          {context.tips.length > 0 && (
            <ul className="space-y-1">
              {context.tips.map((tip, i) => (
                <li key={i} className="text-xs text-blue-700 dark:text-blue-300 flex items-start gap-1.5">
                  <span className="mt-0.5 shrink-0 text-blue-400">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
