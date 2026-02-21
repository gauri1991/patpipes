'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { helpApi, type HelpArticleSummary } from '@/services/helpApi';
import { cn } from '@/lib/utils';

interface HelpSearchProps {
  variant?: 'hero' | 'sidebar';
}

export function HelpSearch({ variant = 'sidebar' }: HelpSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<HelpArticleSummary[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>(undefined);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const res = await helpApi.searchArticles(query.trim());
      if (res.success && res.data) {
        setResults(res.data);
        setIsOpen(true);
      }
      setLoading(false);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (article: HelpArticleSummary) => {
    setIsOpen(false);
    setQuery('');
    router.push(`/dashboard/help/${article.category_slug}/${article.slug}`);
  };

  const isHero = variant === 'hero';

  return (
    <div ref={containerRef} className={cn('relative', isHero ? 'w-full max-w-2xl mx-auto' : 'w-full')}>
      <div className="relative">
        <Search className={cn(
          'absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400',
          isHero ? 'h-5 w-5' : 'h-4 w-4'
        )} />
        <Input
          placeholder="Search help articles..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (results.length > 0) setIsOpen(true); }}
          className={cn(
            'pl-10 pr-8',
            isHero ? 'h-12 text-base rounded-xl border-neutral-300 shadow-sm' : 'h-9 text-sm'
          )}
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setResults([]); setIsOpen(false); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border bg-white shadow-lg max-h-80 overflow-y-auto">
          {loading ? (
            <div className="px-4 py-3 text-sm text-neutral-500">Searching...</div>
          ) : results.length === 0 ? (
            <div className="px-4 py-3 text-sm text-neutral-500">No results found</div>
          ) : (
            results.map((article) => (
              <button
                key={article.id}
                onClick={() => handleSelect(article)}
                className="w-full text-left px-4 py-3 hover:bg-neutral-50 border-b last:border-b-0 transition-colors"
              >
                <div className="text-sm font-medium text-neutral-900">{article.title}</div>
                <div className="text-xs text-neutral-500 mt-0.5">{article.category_name}</div>
                {article.excerpt && (
                  <div className="text-xs text-neutral-400 mt-1 line-clamp-1">{article.excerpt}</div>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
