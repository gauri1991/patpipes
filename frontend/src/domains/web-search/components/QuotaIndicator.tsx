'use client';

import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { QuotaInfo } from '@/domains/web-search/types/webSearch.types';

interface QuotaIndicatorProps {
  quota: QuotaInfo | null;
  className?: string;
}

export function QuotaIndicator({ quota, className }: QuotaIndicatorProps) {
  if (!quota) {
    return null;
  }

  const percentage = quota.limit > 0 ? (quota.used / quota.limit) * 100 : 0;

  const getColorClass = () => {
    if (percentage > 80) return 'text-red-600 dark:text-red-400';
    if (percentage > 50) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  const getProgressColor = () => {
    if (percentage > 80) return '[&>div]:bg-red-500';
    if (percentage > 50) return '[&>div]:bg-yellow-500';
    return '[&>div]:bg-green-500';
  };

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">Daily Quota</span>
        <span className={cn('text-xs font-semibold', getColorClass())}>
          {quota.used}/{quota.limit}
        </span>
      </div>
      <Progress
        value={percentage}
        className={cn('h-2', getProgressColor())}
        aria-label={`Search quota: ${quota.used} of ${quota.limit} used`}
      />
    </div>
  );
}
