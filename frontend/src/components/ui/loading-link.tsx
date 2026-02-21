'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLoading } from '@/contexts/loading.context';
import { ComponentPropsWithoutRef, MouseEvent } from 'react';

interface LoadingLinkProps extends ComponentPropsWithoutRef<typeof Link> {
  loadingMessage?: string;
}

export function LoadingLink({ 
  href, 
  loadingMessage, 
  onClick, 
  children, 
  ...props 
}: LoadingLinkProps) {
  const router = useRouter();
  const { setLoading, setLoadingMessage } = useLoading();

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    // Call original onClick if provided
    onClick?.(e);
    
    // Don't intercept if default is prevented or it's modified click
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
      return;
    }

    // Don't intercept external links
    const url = href.toString();
    if (url.startsWith('http') || url.startsWith('mailto:') || url.startsWith('tel:')) {
      return;
    }

    // Start loading immediately on click
    const message = loadingMessage || getLoadingMessageForRoute(url);
    setLoadingMessage(message);
    setLoading(true);

    // Let Next.js handle the navigation naturally
  };

  return (
    <Link href={href} onClick={handleClick} {...props}>
      {children}
    </Link>
  );
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