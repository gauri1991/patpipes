'use client';

import { useState, useCallback } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PatentSearchBarProps {
  onSearch: (appId: string) => void;
  isLoading?: boolean;
  className?: string;
}

/**
 * Detect if the input looks like a patent number (US prefix or kind code)
 * vs an application number (7-8 digits).
 */
function parseSearchInput(raw: string): { type: 'app' | 'patent'; value: string } {
  const cleaned = raw.trim().replace(/[,/\s-]/g, '');
  // Patent number pattern: "US" prefix, digits, optional kind code (A1, B1, B2, etc.)
  const patentMatch = cleaned.match(/^US(\d{6,11})(A\d?|B\d?)?$/i);
  if (patentMatch) {
    // Extract just the digits (patent number without US prefix and kind code)
    return { type: 'patent', value: patentMatch[1] };
  }
  // Plain digits — application number
  return { type: 'app', value: cleaned };
}

export function PatentSearchBar({ onSearch, isLoading, className }: PatentSearchBarProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!query.trim() || isLoading) return;
      onSearch(query.trim());
    },
    [query, isLoading, onSearch]
  );

  return (
    <form
      onSubmit={handleSubmit}
      className={cn('flex items-center gap-3 w-full max-w-2xl', className)}
    >
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Enter application number (e.g. 15060643) or patent number (e.g. US11301943B2)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 h-11"
          disabled={isLoading}
          aria-label="Patent search query"
        />
      </div>
      <Button type="submit" disabled={!query.trim() || isLoading} className="h-11 px-6">
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          'Search'
        )}
      </Button>
    </form>
  );
}

export { parseSearchInput };
