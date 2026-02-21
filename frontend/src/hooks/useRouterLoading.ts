'use client';

import { useEffect, useRef, useCallback } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useLoading } from '@/contexts/loading.context';

export function useRouterLoading() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { setLoading, setLoadingMessage } = useLoading();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const hideLoadingWithMinimumTime = useCallback((minDisplayTime: number = 800) => {
    if (startTimeRef.current) {
      const elapsed = Date.now() - startTimeRef.current;
      const remainingTime = Math.max(0, minDisplayTime - elapsed);
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        setLoading(false);
        startTimeRef.current = null;
      }, remainingTime);
    }
  }, [setLoading]);

  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Start loading immediately
    startTimeRef.current = Date.now();
    setLoading(true);
    
    // Set appropriate loading message based on route
    const message = getLoadingMessageForRoute(pathname);
    setLoadingMessage(message);

    // Determine timing based on route complexity
    const routeComplexity = getRouteComplexity(pathname);
    const minDisplayTime = routeComplexity.minTime;
    const maxDisplayTime = routeComplexity.maxTime;

    // Auto-hide with minimum display time
    hideLoadingWithMinimumTime(minDisplayTime);

    // Failsafe: Always hide after maximum time
    const failsafeTimer = setTimeout(() => {
      setLoading(false);
      startTimeRef.current = null;
    }, maxDisplayTime);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      clearTimeout(failsafeTimer);
    };
  }, [pathname, searchParams, setLoading, setLoadingMessage, hideLoadingWithMinimumTime]);
}

// Helper function to get route complexity and timing
function getRouteComplexity(pathname: string) {
  // Authentication pages - fast
  if (pathname.includes('/login') || pathname.includes('/signup')) {
    return { minTime: 600, maxTime: 3000 };
  }
  
  // Dashboard main page - medium
  if (pathname === '/dashboard') {
    return { minTime: 800, maxTime: 5000 };
  }
  
  // Complex dashboard pages - slower
  if (pathname.includes('/dashboard/analytics') || pathname.includes('/dashboard/infringement')) {
    return { minTime: 1000, maxTime: 7000 };
  }
  
  // Regular dashboard pages - medium
  if (pathname.includes('/dashboard/')) {
    return { minTime: 800, maxTime: 5000 };
  }
  
  // Default timing
  return { minTime: 800, maxTime: 4000 };
}

// Helper function to get appropriate loading messages based on route
function getLoadingMessageForRoute(pathname: string): string {
  if (pathname === '/dashboard') return 'Loading dashboard...';
  
  // Dashboard sub-pages with more descriptive messages
  if (pathname.includes('/dashboard/analytics')) {
    if (pathname.includes('/projects')) return 'Loading analytics projects...';
    if (pathname.includes('/reports')) return 'Loading analytics reports...';
    return 'Loading analytics workspace...';
  }
  
  if (pathname.includes('/dashboard/projects')) return 'Loading your projects...';
  if (pathname.includes('/dashboard/portfolio')) return 'Loading patent portfolio...';
  if (pathname.includes('/dashboard/workflows')) return 'Loading workflow manager...';
  if (pathname.includes('/dashboard/prior-art')) return 'Loading prior art search...';
  if (pathname.includes('/dashboard/infringement')) return 'Loading infringement analysis...';
  if (pathname.includes('/dashboard/profile')) return 'Loading your profile...';
  if (pathname.includes('/dashboard/settings')) return 'Loading settings...';
  
  // Auth pages
  if (pathname.includes('/login')) return 'Preparing sign-in...';
  if (pathname.includes('/signup')) return 'Preparing registration...';
  if (pathname.includes('/forgot-password')) return 'Loading password reset...';
  
  return 'Loading page...';
}