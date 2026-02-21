'use client';

import Link from 'next/link';
import { Eye, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { HelpArticleSummary } from '@/services/helpApi';

interface HelpArticleCardProps {
  article: HelpArticleSummary;
}

export function HelpArticleCard({ article }: HelpArticleCardProps) {
  const formattedDate = new Date(article.updated_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Link
      href={`/dashboard/help/${article.category_slug}/${article.slug}`}
      className="block rounded-lg border bg-white p-4 hover:border-neutral-300 hover:shadow-sm transition-all"
    >
      <h3 className="text-sm font-semibold text-neutral-900">{article.title}</h3>
      {article.excerpt && (
        <p className="mt-1.5 text-xs text-neutral-500 line-clamp-2">{article.excerpt}</p>
      )}
      <div className="mt-3 flex items-center gap-3 text-xs text-neutral-400">
        <span className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {formattedDate}
        </span>
        <span className="flex items-center gap-1">
          <Eye className="h-3 w-3" />
          {article.view_count}
        </span>
        {article.tags.slice(0, 2).map((tag) => (
          <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
            {tag}
          </Badge>
        ))}
      </div>
    </Link>
  );
}
