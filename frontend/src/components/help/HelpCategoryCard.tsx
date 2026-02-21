'use client';

import Link from 'next/link';
import { getIcon } from './iconMap';
import type { HelpCategory } from '@/services/helpApi';

interface HelpCategoryCardProps {
  category: HelpCategory;
}

export function HelpCategoryCard({ category }: HelpCategoryCardProps) {
  const Icon = getIcon(category.icon);

  return (
    <Link
      href={`/dashboard/help/${category.slug}`}
      className="group block rounded-lg border bg-white p-5 hover:border-cyan-300 hover:shadow-md transition-all"
    >
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-neutral-100 p-2.5 group-hover:bg-cyan-50 transition-colors">
          <Icon className="h-5 w-5 text-neutral-600 group-hover:text-cyan-600 transition-colors" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-neutral-900">{category.name}</h3>
          {category.description && (
            <p className="mt-1 text-xs text-neutral-500 line-clamp-2">{category.description}</p>
          )}
          <p className="mt-2 text-xs text-neutral-400">
            {category.article_count} {category.article_count === 1 ? 'article' : 'articles'}
          </p>
        </div>
      </div>
    </Link>
  );
}
