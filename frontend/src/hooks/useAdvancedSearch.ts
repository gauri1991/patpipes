'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

export interface SearchFilter {
  key: string;
  label: string;
  value: string | string[];
  type: 'text' | 'select' | 'date' | 'multiselect';
}

export interface FilterPreset {
  id: string;
  name: string;
  filters: SearchFilter[];
  createdAt: string;
}

export interface UseAdvancedSearchOptions {
  debounceMs?: number;
  storageKey?: string;
  defaultFilters?: SearchFilter[];
}

export interface UseAdvancedSearchReturn {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  debouncedSearchTerm: string;
  filters: SearchFilter[];
  addFilter: (filter: SearchFilter) => void;
  removeFilter: (key: string) => void;
  updateFilter: (key: string, value: string | string[]) => void;
  clearFilters: () => void;
  // Sorting
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  setSorting: (field: string, direction?: 'asc' | 'desc') => void;
  // Presets
  presets: FilterPreset[];
  savePreset: (name: string) => void;
  loadPreset: (id: string) => void;
  deletePreset: (id: string) => void;
  // Query params for API
  getQueryParams: () => Record<string, string>;
}

export function useAdvancedSearch(options: UseAdvancedSearchOptions = {}): UseAdvancedSearchReturn {
  const { debounceMs = 300, storageKey, defaultFilters = [] } = options;

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [filters, setFilters] = useState<SearchFilter[]>(defaultFilters);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [presets, setPresets] = useState<FilterPreset[]>([]);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Load presets from localStorage
  useEffect(() => {
    if (storageKey && typeof window !== 'undefined') {
      const saved = localStorage.getItem(`patent_filter_presets_${storageKey}`);
      if (saved) {
        try {
          setPresets(JSON.parse(saved));
        } catch {
          // Ignore malformed JSON
        }
      }
    }
  }, [storageKey]);

  // Debounce search term
  useEffect(() => {
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, debounceMs);
    return () => clearTimeout(debounceTimer.current);
  }, [searchTerm, debounceMs]);

  const addFilter = useCallback((filter: SearchFilter) => {
    setFilters(prev => {
      const existing = prev.findIndex(f => f.key === filter.key);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = filter;
        return updated;
      }
      return [...prev, filter];
    });
  }, []);

  const removeFilter = useCallback((key: string) => {
    setFilters(prev => prev.filter(f => f.key !== key));
  }, []);

  const updateFilter = useCallback((key: string, value: string | string[]) => {
    setFilters(prev => prev.map(f => f.key === key ? { ...f, value } : f));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(defaultFilters);
    setSearchTerm('');
  }, [defaultFilters]);

  const setSorting = useCallback((field: string, direction?: 'asc' | 'desc') => {
    if (direction) {
      setSortBy(field);
      setSortDirection(direction);
    } else {
      // Toggle direction if same field
      setSortBy(prevSortBy => {
        if (field === prevSortBy) {
          setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
          return field;
        }
        setSortDirection('desc');
        return field;
      });
    }
  }, []);

  const savePresetsToStorage = useCallback((updated: FilterPreset[]) => {
    setPresets(updated);
    if (storageKey && typeof window !== 'undefined') {
      localStorage.setItem(`patent_filter_presets_${storageKey}`, JSON.stringify(updated));
    }
  }, [storageKey]);

  const savePreset = useCallback((name: string) => {
    const preset: FilterPreset = {
      id: Date.now().toString(),
      name,
      filters: [...filters],
      createdAt: new Date().toISOString(),
    };
    savePresetsToStorage([...presets, preset]);
  }, [filters, presets, savePresetsToStorage]);

  const loadPreset = useCallback((id: string) => {
    const preset = presets.find(p => p.id === id);
    if (preset) setFilters(preset.filters);
  }, [presets]);

  const deletePreset = useCallback((id: string) => {
    savePresetsToStorage(presets.filter(p => p.id !== id));
  }, [presets, savePresetsToStorage]);

  const getQueryParams = useCallback((): Record<string, string> => {
    const params: Record<string, string> = {};
    if (debouncedSearchTerm) params.search = debouncedSearchTerm;
    if (sortBy) params.ordering = sortDirection === 'desc' ? `-${sortBy}` : sortBy;

    filters.forEach(f => {
      if (Array.isArray(f.value)) {
        if (f.value.length > 0) params[f.key] = f.value.join(',');
      } else if (f.value) {
        params[f.key] = f.value;
      }
    });

    return params;
  }, [debouncedSearchTerm, sortBy, sortDirection, filters]);

  return {
    searchTerm, setSearchTerm, debouncedSearchTerm,
    filters, addFilter, removeFilter, updateFilter, clearFilters,
    sortBy, sortDirection, setSorting,
    presets, savePreset, loadPreset, deletePreset,
    getQueryParams,
  };
}
