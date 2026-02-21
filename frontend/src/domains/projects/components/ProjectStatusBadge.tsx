/**
 * ProjectStatusBadge Component
 * Visual status indicator for projects
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { ProjectStatus } from '../types/project.types';

interface ProjectStatusBadgeProps {
  status: ProjectStatus;
}

export function ProjectStatusBadge({ status }: ProjectStatusBadgeProps) {
  const getStatusConfig = (status: ProjectStatus) => {
    const configs = {
      [ProjectStatus.DRAFT]: {
        label: 'Draft',
        className: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
      },
      [ProjectStatus.ACTIVE]: {
        label: 'Active',
        className: 'bg-green-100 text-green-800 hover:bg-green-200',
      },
      [ProjectStatus.ON_HOLD]: {
        label: 'On Hold',
        className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
      },
      [ProjectStatus.UNDER_REVIEW]: {
        label: 'Under Review',
        className: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
      },
      [ProjectStatus.FILED]: {
        label: 'Filed',
        className: 'bg-purple-100 text-purple-800 hover:bg-purple-200',
      },
      [ProjectStatus.APPROVED]: {
        label: 'Approved',
        className: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200',
      },
      [ProjectStatus.REJECTED]: {
        label: 'Rejected',
        className: 'bg-red-100 text-red-800 hover:bg-red-200',
      },
      [ProjectStatus.COMPLETED]: {
        label: 'Completed',
        className: 'bg-green-100 text-green-800 hover:bg-green-200',
      },
      [ProjectStatus.ARCHIVED]: {
        label: 'Archived',
        className: 'bg-gray-100 text-gray-600 hover:bg-gray-200',
      },
    };

    return configs[status] || configs[ProjectStatus.DRAFT];
  };

  const config = getStatusConfig(status);

  return (
    <Badge variant="secondary" className={config.className}>
      {config.label}
    </Badge>
  );
}