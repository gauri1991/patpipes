/**
 * Status Badge Component
 * Displays dataset processing status with appropriate colors
 */

import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';

interface StatusBadgeProps {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const statusConfig = {
    pending: {
      label: 'Pending',
      icon: Clock,
      className: 'bg-yellow-100 text-yellow-800 border-yellow-300'
    },
    processing: {
      label: 'Processing',
      icon: Loader2,
      className: 'bg-blue-100 text-blue-800 border-blue-300 animate-pulse'
    },
    completed: {
      label: 'Completed',
      icon: CheckCircle2,
      className: 'bg-green-100 text-green-800 border-green-300'
    },
    failed: {
      label: 'Failed',
      icon: XCircle,
      className: 'bg-red-100 text-red-800 border-red-300'
    }
  };

  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={`${config.className} ${className}`}>
      <Icon className={`h-3 w-3 mr-1 ${status === 'processing' ? 'animate-spin' : ''}`} />
      {config.label}
    </Badge>
  );
}
