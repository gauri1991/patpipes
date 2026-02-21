/**
 * Patents Page
 * Main entry point for patent portfolio management
 * Handles routing based on user's portfolio access
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PortfolioProvider, usePortfolio } from '@/domains/patents/contexts/PortfolioContext';
import { PortfolioSelector } from '@/domains/patents/components/PortfolioSelector';
import { PatentDashboard } from '@/domains/patents/components/PatentDashboard';
import { Skeleton } from '@/components/ui/skeleton';

function PatentsPageContent() {
  const router = useRouter();
  const { portfolios, portfolioCount, selectedPortfolio, isLoading } = usePortfolio();

  useEffect(() => {
    // If user has only one portfolio, auto-navigate to it
    if (!isLoading && portfolioCount === 1 && portfolios[0]) {
      router.replace(`/dashboard/portfolio/${portfolios[0].id}`);
    }
  }, [isLoading, portfolioCount, portfolios, router]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  // If user has multiple portfolios, show selector
  if (portfolioCount > 1 || portfolioCount === 0) {
    return <PortfolioSelector />;
  }

  // This case is handled by the useEffect above
  return null;
}

export default function PatentsPage() {
  return (
    <PortfolioProvider>
      <PatentsPageContent />
    </PortfolioProvider>
  );
}