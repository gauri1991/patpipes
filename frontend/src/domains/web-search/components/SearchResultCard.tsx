'use client';

import { useState } from 'react';
import { Flag, Bookmark, Copy, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { SearchResult, SearchCategory } from '@/domains/web-search/types/webSearch.types';
import { QueryCategoryBadge } from './QueryCategoryBadge';

interface SearchResultCardProps {
  result: SearchResult;
  category?: SearchCategory;
  onToggleFlag: (resultId: string, flagged: boolean) => void;
  onToggleSave: (resultId: string, saved: boolean) => void;
  onUpdateNotes: (resultId: string, notes: string) => void;
}

export function SearchResultCard({
  result,
  category,
  onToggleFlag,
  onToggleSave,
  onUpdateNotes,
}: SearchResultCardProps) {
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState(result.relevance_notes);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(result.url);
    } catch {
      // Fallback for clipboard API failure
    }
  };

  const handleNotesBlur = () => {
    if (notes !== result.relevance_notes) {
      onUpdateNotes(result.id, notes);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-start gap-3">
          <span className="flex items-center justify-center h-6 w-6 rounded-full bg-muted text-xs font-semibold text-muted-foreground shrink-0">
            #{result.position}
          </span>
          <div className="flex-1 min-w-0">
            <a
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-foreground hover:text-primary hover:underline line-clamp-2 inline-flex items-start gap-1"
            >
              {result.title}
              <ExternalLink className="h-3 w-3 shrink-0 mt-0.5" />
            </a>
            <p className="text-xs text-muted-foreground/70 mt-0.5 truncate">
              {result.display_link}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-1">
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
          {result.snippet}
        </p>

        {showNotes && (
          <div className="mt-3">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={handleNotesBlur}
              placeholder="Add relevance notes..."
              className="text-xs min-h-[60px] resize-none"
              aria-label="Relevance notes"
            />
          </div>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-0 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{result.source_domain}</span>
          {category && <QueryCategoryBadge category={category} />}
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'h-7 w-7 p-0',
              result.is_flagged && 'text-yellow-500 hover:text-yellow-600'
            )}
            onClick={() => onToggleFlag(result.id, !result.is_flagged)}
            aria-label={result.is_flagged ? 'Remove flag' : 'Flag result'}
          >
            <Flag
              className={cn('h-3.5 w-3.5', result.is_flagged && 'fill-current')}
            />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'h-7 w-7 p-0',
              result.is_saved && 'text-blue-500 hover:text-blue-600'
            )}
            onClick={() => onToggleSave(result.id, !result.is_saved)}
            aria-label={result.is_saved ? 'Remove bookmark' : 'Save result'}
          >
            <Bookmark
              className={cn('h-3.5 w-3.5', result.is_saved && 'fill-current')}
            />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={handleCopyUrl}
            aria-label="Copy URL"
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => setShowNotes(!showNotes)}
            aria-label={showNotes ? 'Hide notes' : 'Add notes'}
          >
            <span className="text-xs font-medium">N</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            asChild
          >
            <a
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open in new tab"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
