/**
 * Portfolio Context
 * Manages the current selected portfolio and user's portfolio access
 */

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/domains/accounts/hooks/useAuth';
import { portfolioService } from '../services/portfolio.service';

interface Portfolio {
  id: string;
  name: string;
  company_name: string;
  owner_name?: string;
  total_patents: number;
  active_patents: number;
  pending_patents: number;
  expired_patents?: number;
  total_value: number;
  estimated_odp_count: number | null;
  is_active: boolean;
}

interface PortfolioContextType {
  portfolios: Portfolio[];
  selectedPortfolio: Portfolio | null;
  portfolioCount: number;
  isLoading: boolean;
  error: string | null;
  selectPortfolio: (portfolio: Portfolio) => void;
  refreshPortfolios: () => Promise<void>;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null);
  const [portfolioCount, setPortfolioCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchUserPortfolios();
    }
  }, [user]);

  const fetchUserPortfolios = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await portfolioService.getUserAccess();
      
      // Handle empty or invalid response
      if (!response) {
        setPortfolios([]);
        setPortfolioCount(0);
        return;
      }
      
      setPortfolios(response.portfolios || []);
      setPortfolioCount(response.portfolio_count || 0);
      
      // Auto-select if only one portfolio
      if (response.portfolio_count === 1 && response.portfolios?.[0]) {
        setSelectedPortfolio(response.portfolios[0]);
      } else if (response.default_portfolio && response.portfolios) {
        // Select default portfolio if set
        const defaultPortfolio = response.portfolios.find(
          p => p.id === response.default_portfolio
        );
        if (defaultPortfolio) {
          setSelectedPortfolio(defaultPortfolio);
        }
      }
    } catch (err) {
      console.error('Failed to fetch portfolios:', err);
      setError('Failed to load portfolios');
      setPortfolios([]);
      setPortfolioCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  const selectPortfolio = (portfolio: Portfolio) => {
    setSelectedPortfolio(portfolio);
    // Optionally save selection to localStorage or user preferences
    localStorage.setItem('selectedPortfolioId', portfolio.id);
  };

  const refreshPortfolios = async () => {
    await fetchUserPortfolios();
  };

  const value = {
    portfolios,
    selectedPortfolio,
    portfolioCount,
    isLoading,
    error,
    selectPortfolio,
    refreshPortfolios,
  };

  return (
    <PortfolioContext.Provider value={value}>
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolio() {
  const context = useContext(PortfolioContext);
  if (context === undefined) {
    throw new Error('usePortfolio must be used within a PortfolioProvider');
  }
  return context;
}