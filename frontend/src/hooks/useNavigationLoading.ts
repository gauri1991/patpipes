'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLoading } from '@/contexts/loading.context';

export function useNavigationLoading() {
  const { setLoading, setLoadingMessage } = useLoading();

  useEffect(() => {
    // Intercept all navigation link clicks
    const handleLinkClick = (e: Event) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a[href]') as HTMLAnchorElement;
      
      if (!link) return;

      const href = link.getAttribute('href');
      if (!href) return;

      // Skip external links and special protocols
      if (href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('#')) {
        return;
      }

      // Skip if it's a modified click
      const mouseEvent = e as MouseEvent;
      if (mouseEvent.metaKey || mouseEvent.ctrlKey || mouseEvent.shiftKey || mouseEvent.altKey) {
        return;
      }

      // Start loading immediately
      const message = getLoadingMessageForRoute(href);
      setLoadingMessage(message);
      setLoading(true);
    };

    // Add click listener to document to catch all navigation
    document.addEventListener('click', handleLinkClick, { capture: true });

    return () => {
      document.removeEventListener('click', handleLinkClick, { capture: true });
    };
  }, [setLoading, setLoadingMessage]);
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