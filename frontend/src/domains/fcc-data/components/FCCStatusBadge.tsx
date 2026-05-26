'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { FCC_STATUS_CONFIG } from '../types/fccData.types';

interface FCCStatusBadgeProps {
  status: string;
}

export const FCCStatusBadge: React.FC<FCCStatusBadgeProps> = ({ status }) => {
  const config = FCC_STATUS_CONFIG[status] || { label: status, color: 'bg-neutral-400' };

  return (
    <Badge variant="outline" className="text-xs font-medium">
      <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${config.color}`} />
      {config.label}
    </Badge>
  );
};
