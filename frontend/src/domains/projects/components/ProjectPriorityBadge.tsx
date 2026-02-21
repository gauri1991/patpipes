/**
 * ProjectPriorityBadge Component
 * Visual priority indicator for projects
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { ProjectPriority } from '../types/project.types';

interface ProjectPriorityBadgeProps {
  priority: ProjectPriority;
}

export function ProjectPriorityBadge({ priority }: ProjectPriorityBadgeProps) {
  const getPriorityConfig = (priority: ProjectPriority) => {
    const configs = {
      [ProjectPriority.LOW]: {
        label: 'Low',
        className: 'bg-green-100 text-green-800 hover:bg-green-200',
      },
      [ProjectPriority.MEDIUM]: {
        label: 'Medium',
        className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
      },
      [ProjectPriority.HIGH]: {
        label: 'High',
        className: 'bg-orange-100 text-orange-800 hover:bg-orange-200',
      },
      [ProjectPriority.URGENT]: {
        label: 'Urgent',
        className: 'bg-red-100 text-red-800 hover:bg-red-200',
      },
    };

    return configs[priority] || configs[ProjectPriority.MEDIUM];
  };

  const config = getPriorityConfig(priority);

  return (
    <Badge variant="secondary" className={config.className}>
      {config.label}
    </Badge>
  );
}