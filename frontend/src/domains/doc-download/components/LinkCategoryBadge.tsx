'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import type { LinkCategory } from '../types/docDownload.types';
import { CATEGORY_CONFIG } from '../types/docDownload.types';

interface LinkCategoryBadgeProps {
  category: LinkCategory;
  className?: string;
}

export const LinkCategoryBadge: React.FC<LinkCategoryBadgeProps> = ({ category, className = '' }) => {
  const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.other;

  return (
    <Badge
      variant="outline"
      className={`text-xs font-medium ${className}`}
    >
      <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${config.color}`} />
      {config.label}
    </Badge>
  );
};
