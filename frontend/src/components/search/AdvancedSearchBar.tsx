'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  SlidersHorizontal,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronDown,
} from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

import {
  useAdvancedSearch,
  type SearchFilter,
  type UseAdvancedSearchReturn,
} from '@/hooks/useAdvancedSearch';
import { FilterPresets } from '@/components/search/FilterPresets';

export interface FilterOption {
  key: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'multiselect';
  options?: { value: string; label: string }[];
  placeholder?: string;
}

export interface SortOption {
  value: string;
  label: string;
}

export interface AdvancedSearchBarProps {
  onFilterChange: (params: Record<string, string>) => void;
  storageKey?: string;
  filterOptions?: FilterOption[];
  sortOptions?: SortOption[];
  placeholder?: string;
  className?: string;
}

const DEFAULT_SORT_OPTIONS: SortOption[] = [
  { value: 'created_at', label: 'Date Created' },
  { value: 'updated_at', label: 'Date Updated' },
  { value: 'name', label: 'Name' },
];

export function AdvancedSearchBar({
  onFilterChange,
  storageKey,
  filterOptions = [],
  sortOptions = DEFAULT_SORT_OPTIONS,
  placeholder = 'Search...',
  className = '',
}: AdvancedSearchBarProps) {
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  const search: UseAdvancedSearchReturn = useAdvancedSearch({
    debounceMs: 300,
    storageKey,
  });

  const {
    searchTerm,
    setSearchTerm,
    debouncedSearchTerm,
    filters,
    addFilter,
    removeFilter,
    clearFilters,
    sortBy,
    sortDirection,
    setSorting,
    presets,
    savePreset,
    loadPreset,
    deletePreset,
    getQueryParams,
  } = search;

  // Notify parent of filter changes
  useEffect(() => {
    onFilterChange(getQueryParams());
  }, [debouncedSearchTerm, filters, sortBy, sortDirection, getQueryParams, onFilterChange]);

  const activeFilterCount = filters.filter(f => {
    if (Array.isArray(f.value)) return f.value.length > 0;
    return !!f.value;
  }).length;

  const handleFilterSelect = (option: FilterOption, value: string) => {
    if (!value || value === 'all') {
      removeFilter(option.key);
    } else {
      addFilter({
        key: option.key,
        label: option.label,
        value,
        type: option.type,
      });
    }
  };

  const handleDateChange = (option: FilterOption, value: string) => {
    if (!value) {
      removeFilter(option.key);
    } else {
      addFilter({
        key: option.key,
        label: option.label,
        value,
        type: 'date',
      });
    }
  };

  const getFilterValue = (key: string): string => {
    const filter = filters.find(f => f.key === key);
    if (!filter) return '';
    return Array.isArray(filter.value) ? filter.value.join(',') : filter.value;
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Main Search Row */}
      <div className="flex items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={placeholder}
            className="pl-10 pr-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter Toggle */}
        <Button
          variant={filtersExpanded || activeFilterCount > 0 ? 'default' : 'outline'}
          size="default"
          onClick={() => setFiltersExpanded(!filtersExpanded)}
          className="gap-2"
          aria-label="Toggle filters"
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span className="hidden sm:inline">Filters</span>
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
              {activeFilterCount}
            </Badge>
          )}
        </Button>

        {/* Sort Control */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="default" className="gap-2" aria-label="Sort options">
              {sortDirection === 'asc' ? (
                <ArrowUp className="h-4 w-4" />
              ) : (
                <ArrowDown className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">
                {sortOptions.find(o => o.value === sortBy)?.label || 'Sort'}
              </span>
              <ChevronDown className="h-3 w-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-2" align="end">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground px-2 py-1">Sort by</p>
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSorting(option.value)}
                  className={`w-full flex items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent ${
                    sortBy === option.value ? 'bg-accent font-medium' : ''
                  }`}
                >
                  <span>{option.label}</span>
                  {sortBy === option.value && (
                    <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </button>
              ))}
              <div className="border-t my-1" />
              <p className="text-xs font-medium text-muted-foreground px-2 py-1">Direction</p>
              <button
                onClick={() => setSorting(sortBy, 'asc')}
                className={`w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent ${
                  sortDirection === 'asc' ? 'bg-accent font-medium' : ''
                }`}
              >
                <ArrowUp className="h-3.5 w-3.5" />
                Ascending
              </button>
              <button
                onClick={() => setSorting(sortBy, 'desc')}
                className={`w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent ${
                  sortDirection === 'desc' ? 'bg-accent font-medium' : ''
                }`}
              >
                <ArrowDown className="h-3.5 w-3.5" />
                Descending
              </button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Presets */}
        <FilterPresets
          presets={presets}
          onSave={savePreset}
          onLoad={loadPreset}
          onDelete={deletePreset}
        />
      </div>

      {/* Active Filter Chips */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {filters
            .filter(f => {
              if (Array.isArray(f.value)) return f.value.length > 0;
              return !!f.value;
            })
            .map((filter) => (
              <Badge
                key={filter.key}
                variant="secondary"
                className="gap-1 pr-1 cursor-default"
              >
                <span className="text-muted-foreground">{filter.label}:</span>
                <span>{Array.isArray(filter.value) ? filter.value.join(', ') : filter.value}</span>
                <button
                  onClick={() => removeFilter(filter.key)}
                  className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20 transition-colors"
                  aria-label={`Remove ${filter.label} filter`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-7 text-xs text-muted-foreground hover:text-foreground"
          >
            Clear All
          </Button>
        </div>
      )}

      {/* Expandable Filter Panel */}
      <AnimatePresence>
        {filtersExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="rounded-lg border bg-card p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filterOptions.map((option) => (
                  <div key={option.key} className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">
                      {option.label}
                    </label>
                    {option.type === 'select' && option.options ? (
                      <Select
                        value={getFilterValue(option.key) || 'all'}
                        onValueChange={(value) => handleFilterSelect(option, value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={option.placeholder || `Select ${option.label.toLowerCase()}`} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          {option.options.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : option.type === 'date' ? (
                      <Input
                        type="date"
                        value={getFilterValue(option.key)}
                        onChange={(e) => handleDateChange(option, e.target.value)}
                        className="w-full"
                        aria-label={option.label}
                      />
                    ) : (
                      <Input
                        type="text"
                        placeholder={option.placeholder || `Filter by ${option.label.toLowerCase()}`}
                        value={getFilterValue(option.key)}
                        onChange={(e) => {
                          if (!e.target.value) {
                            removeFilter(option.key);
                          } else {
                            addFilter({
                              key: option.key,
                              label: option.label,
                              value: e.target.value,
                              type: 'text',
                            });
                          }
                        }}
                        aria-label={option.label}
                      />
                    )}
                  </div>
                ))}
              </div>
              {filterOptions.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No filter options configured.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
