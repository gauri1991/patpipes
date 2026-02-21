/**
 * Auto-save hook for patent applications
 * Provides debounced auto-saving functionality
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { prosecutionApi } from '@/lib/api/prosecution';
import { PatentApplication, AutoSaveStatus, UpdatePatentApplicationData } from '@/types/prosecution';

interface UseAutoSaveOptions {
  debounceMs?: number;
  onSaveSuccess?: (data: PatentApplication) => void;
  onSaveError?: (error: Error) => void;
}

export function useAutoSave(
  applicationId: string, 
  options: UseAutoSaveOptions = {}
) {
  const {
    debounceMs = 2000,
    onSaveSuccess,
    onSaveError
  } = options;

  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pendingDataRef = useRef<UpdatePatentApplicationData>({});
  const isSavingRef = useRef(false);

  // Debounced save function
  const saveData = useCallback(async (data: UpdatePatentApplicationData) => {
    if (isSavingRef.current) return;

    try {
      isSavingRef.current = true;
      setAutoSaveStatus('saving');
      
      const result = await prosecutionApi.updateApplication(applicationId, data);
      
      setAutoSaveStatus('saved');
      setLastSaved(new Date());
      pendingDataRef.current = {};
      
      onSaveSuccess?.(result);
    } catch (error) {
      setAutoSaveStatus('error');
      const err = error instanceof Error ? error : new Error('Save failed');
      onSaveError?.(err);
      console.error('Auto-save failed:', err);
    } finally {
      isSavingRef.current = false;
    }
  }, [applicationId, onSaveSuccess, onSaveError]);

  // Schedule save function
  const scheduleSave = useCallback((data: UpdatePatentApplicationData) => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Merge with pending data
    pendingDataRef.current = {
      ...pendingDataRef.current,
      ...data
    };

    // Set status to indicate changes are pending
    if (autoSaveStatus === 'saved' || autoSaveStatus === 'idle') {
      setAutoSaveStatus('idle');
    }

    // Schedule the save
    timeoutRef.current = setTimeout(() => {
      saveData(pendingDataRef.current);
    }, debounceMs);
  }, [debounceMs, saveData, autoSaveStatus]);

  // Manual save function (for explicit save actions)
  const saveNow = useCallback(async (data?: UpdatePatentApplicationData) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const dataToSave = data || pendingDataRef.current;
    if (Object.keys(dataToSave).length > 0) {
      await saveData(dataToSave);
    }
  }, [saveData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Auto-save on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (Object.keys(pendingDataRef.current).length > 0 && !isSavingRef.current) {
        // For modern browsers, we can use sendBeacon for reliable saving on page unload
        const data = JSON.stringify(pendingDataRef.current);
        navigator.sendBeacon(
          `${process.env.NEXT_PUBLIC_API_URL}/prosecution/applications/${applicationId}/`,
          new Blob([data], { type: 'application/json' })
        );
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [applicationId]);

  return {
    autoSaveStatus,
    lastSaved,
    scheduleSave,
    saveNow,
    isPending: Object.keys(pendingDataRef.current).length > 0,
  };
}

// Utility function to format last saved time
export function formatLastSaved(lastSaved: Date | null): string {
  if (!lastSaved) return 'Never';
  
  const now = new Date();
  const diffMs = now.getTime() - lastSaved.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  
  if (diffMinutes === 0) return 'Just now';
  if (diffMinutes === 1) return '1 minute ago';
  if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
  
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours === 1) return '1 hour ago';
  if (diffHours < 24) return `${diffHours} hours ago`;
  
  return lastSaved.toLocaleDateString();
}