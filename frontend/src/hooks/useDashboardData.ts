'use client';

import { useQuery } from '@tanstack/react-query';
import { dashboardService, MainDashboardData } from '@/services/dashboardService';

/**
 * React Query hook for dashboard data.
 * - Caches for 30s (staleTime from QueryClient defaults)
 * - Deduplicates concurrent requests
 * - Background refetch on window focus
 */
export function useDashboardData() {
  return useQuery<MainDashboardData>({
    queryKey: ['dashboard'],
    queryFn: () => dashboardService.getDashboardData(),
    staleTime: 60_000, // Dashboard data fresh for 60s
  });
}
