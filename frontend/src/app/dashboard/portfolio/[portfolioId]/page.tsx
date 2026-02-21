/**
 * Individual Portfolio Page
 * Displays the patent dashboard for a specific portfolio
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PatentDashboard } from '@/domains/patents/components/PatentDashboard';
import { PortfolioProvider, usePortfolio } from '@/domains/patents/contexts/PortfolioContext';
import { portfolioService } from '@/domains/patents/services/portfolio.service';
import { Skeleton } from '@/components/ui/skeleton';

function PortfolioPageContent() {
  const params = useParams();
  const router = useRouter();
  const portfolioId = params.portfolioId as string;
  const { selectedPortfolio, selectPortfolio, portfolios, isLoading: contextLoading } = usePortfolio();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPortfolio();
  }, [portfolioId, portfolios, contextLoading]);

  const loadPortfolio = async () => {
    // If context is still loading, wait
    if (contextLoading) {
      setIsLoading(true);
      return;
    }

    setError(null);
    
    try {
      // Check if portfolio is already in the list
      const portfolio = portfolios.find(p => p.id === portfolioId);
      
      if (portfolio) {
        selectPortfolio(portfolio);
        setIsLoading(false);
      } else {
        // Portfolio not found in the list
        setError('Portfolio not found or you do not have access to this portfolio.');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Failed to load portfolio:', err);
      setError('Failed to load portfolio. You may not have access to this portfolio.');
      setIsLoading(false);
    }
  };

  const handleBackToPortfolios = () => {
    router.push('/dashboard/portfolio');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Button 
          variant="ghost" 
          onClick={handleBackToPortfolios}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Portfolios
        </Button>
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => router.push('/dashboard/portfolio')}>
            Go to Portfolios
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with back button and portfolio info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleBackToPortfolios}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          {selectedPortfolio && (
            <div>
              <h1 className="text-2xl font-bold">{selectedPortfolio.company_name}</h1>
              <p className="text-muted-foreground">{selectedPortfolio.name}</p>
            </div>
          )}
        </div>
      </div>

      {/* Patent Dashboard */}
      <PatentDashboard projectId={portfolioId} />
    </div>
  );
}

export default function PortfolioPage() {
  return (
    <PortfolioProvider>
      <PortfolioPageContent />
    </PortfolioProvider>
  );
}