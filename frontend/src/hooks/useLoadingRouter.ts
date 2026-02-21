'use client';

import { useRouter } from 'next/navigation';
import { useLoading } from '@/contexts/loading.context';
import { useCallback } from 'react';

export function useLoadingRouter() {
  const router = useRouter();
  const { setLoading, setLoadingMessage } = useLoading();

  const push = useCallback((href: string, loadingMessage?: string) => {
    const message = loadingMessage || getLoadingMessageForRoute(href);
    setLoadingMessage(message);
    setLoading(true);
    router.push(href);
  }, [router, setLoading, setLoadingMessage]);

  const replace = useCallback((href: string, loadingMessage?: string) => {
    const message = loadingMessage || getLoadingMessageForRoute(href);
    setLoadingMessage(message);
    setLoading(true);
    router.replace(href);
  }, [router, setLoading, setLoadingMessage]);

  const back = useCallback((loadingMessage: string = 'Going back...') => {
    setLoadingMessage(loadingMessage);
    setLoading(true);
    router.back();
  }, [router, setLoading, setLoadingMessage]);

  const forward = useCallback((loadingMessage: string = 'Going forward...') => {
    setLoadingMessage(loadingMessage);
    setLoading(true);
    router.forward();
  }, [router, setLoading, setLoadingMessage]);

  return {
    push,
    replace,
    back,
    forward,
    refresh: router.refresh,
    prefetch: router.prefetch,
  };
}

// Helper function to get loading messages based on destination route
function getLoadingMessageForRoute(pathname: string): string {
  if (pathname === '/dashboard') return 'Loading dashboard...';
  
  // Dashboard sub-pages
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