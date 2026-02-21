'use client';

import { LoadingProvider, useLoading } from '@/contexts/loading.context';
import { LoadingOverlay } from '@/components/ui/loading-overlay';
import { useRouterLoading } from '@/hooks/useRouterLoading';
import { useNavigationLoading } from '@/hooks/useNavigationLoading';

function GlobalLoadingOverlay() {
  const { isLoading, loadingMessage, loadingState } = useLoading();
  
  // Hook into router loading and navigation clicks
  useRouterLoading();
  useNavigationLoading();

  return (
    <LoadingOverlay 
      isVisible={isLoading} 
      message={loadingMessage}
      showProgress={true}
      duration={3000}
      minDisplayTime={800}
    />
  );
}

export function GlobalLoadingProvider({ children }: { children: React.ReactNode }) {
  return (
    <LoadingProvider>
      <GlobalLoadingOverlay />
      {children}
    </LoadingProvider>
  );
}