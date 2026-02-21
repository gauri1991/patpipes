'use client';

import { useCallback, useRef } from 'react';
import { useLoading } from '@/contexts/loading.context';

export function useAsyncLoading() {
  const { setLoading, setLoadingMessage } = useLoading();
  const startTimeRef = useRef<number | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const withLoading = useCallback(async <T>(
    asyncOperation: () => Promise<T>,
    message: string = 'Loading...',
    options?: {
      minDisplayTime?: number;
      maxDisplayTime?: number;
    }
  ): Promise<T> => {
    const { minDisplayTime = 600, maxDisplayTime = 10000 } = options || {};
    
    try {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Start loading
      startTimeRef.current = Date.now();
      setLoadingMessage(message);
      setLoading(true);

      // Execute the operation
      const result = await asyncOperation();
      
      // Calculate minimum display time
      const elapsed = Date.now() - startTimeRef.current;
      const remainingTime = Math.max(0, minDisplayTime - elapsed);
      
      // Hide loading after minimum display time
      timeoutRef.current = setTimeout(() => {
        setLoading(false);
        startTimeRef.current = null;
      }, remainingTime);

      return result;
    } catch (error) {
      // On error, still respect minimum display time
      if (startTimeRef.current) {
        const elapsed = Date.now() - startTimeRef.current;
        const remainingTime = Math.max(0, minDisplayTime - elapsed);
        
        setTimeout(() => {
          setLoading(false);
          startTimeRef.current = null;
        }, remainingTime);
      } else {
        setLoading(false);
      }
      
      throw error;
    }
  }, [setLoading, setLoadingMessage]);

  const showLoading = useCallback((
    message: string = 'Loading...',
    options?: { maxDisplayTime?: number }
  ) => {
    const { maxDisplayTime = 10000 } = options || {};
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    startTimeRef.current = Date.now();
    setLoadingMessage(message);
    setLoading(true);

    // Failsafe: Auto-hide after maximum time
    timeoutRef.current = setTimeout(() => {
      setLoading(false);
      startTimeRef.current = null;
    }, maxDisplayTime);
  }, [setLoading, setLoadingMessage]);

  const hideLoading = useCallback((minDisplayTime: number = 300) => {
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
    } else {
      setLoading(false);
    }
  }, [setLoading]);

  return {
    withLoading,
    showLoading,
    hideLoading,
  };
}