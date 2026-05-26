'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { SearchCategory } from '@/domains/web-search/types/webSearch.types';

const categoryStyles: Record<SearchCategory, string> = {
  product_evidence: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  litigation: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  prior_art: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  competitor: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  technical: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  market: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  general: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
};

function formatCategoryLabel(category: SearchCategory): string {
  return category
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

interface QueryCategoryBadgeProps {
  category: SearchCategory;
  className?: string;
}

export function QueryCategoryBadge({ category, className }: QueryCategoryBadgeProps) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        'text-xs font-medium border-0',
        categoryStyles[category],
        className
      )}
    >
      {formatCategoryLabel(category)}
    </Badge>
  );
}
