'use client';

import { createContext, useContext, useState, useRef, useCallback } from 'react';

interface LoadingState {
  isLoading: boolean;
  loadingMessage: string;
  startTime: number | null;
  loadingId: string | null;
}

interface LoadingContextType {
  isLoading: boolean;
  setLoading: (loading: boolean, id?: string) => void;
  loadingMessage: string;
  setLoadingMessage: (message: string) => void;
  loadingState: LoadingState;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    loadingMessage: 'Loading...',
    startTime: null,
    loadingId: null,
  });
  
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const setLoading = useCallback((loading: boolean, id?: string) => {
    // Clear any existing debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    if (loading) {
      // Start loading immediately
      setLoadingState(prev => ({
        ...prev,
        isLoading: true,
        startTime: Date.now(),
        loadingId: id || `loading-${Date.now()}`,
      }));
    } else {
      // Debounce hiding to prevent flashing
      debounceRef.current = setTimeout(() => {
        setLoadingState(prev => {
          // Only hide if this matches the current loading session or no specific ID provided
          if (!id || prev.loadingId === id || !prev.loadingId) {
            return {
              ...prev,
              isLoading: false,
              startTime: null,
              loadingId: null,
            };
          }
          return prev;
        });
      }, 50); // Small debounce to prevent rapid flashing
    }
  }, []);

  const setLoadingMessage = useCallback((message: string) => {
    setLoadingState(prev => ({
      ...prev,
      loadingMessage: message,
    }));
  }, []);

  return (
    <LoadingContext.Provider 
      value={{ 
        isLoading: loadingState.isLoading,
        setLoading, 
        loadingMessage: loadingState.loadingMessage,
        setLoadingMessage,
        loadingState,
      }}
    >
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
}