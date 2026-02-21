'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { getIcon } from './iconMap';
import type { HelpCategory } from '@/services/helpApi';

interface HelpCategorySidebarProps {
  categories: HelpCategory[];
}

export function HelpCategorySidebar({ categories }: HelpCategorySidebarProps) {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      <Link
        href="/dashboard/help"
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
          pathname === '/dashboard/help'
            ? 'bg-neutral-100 text-neutral-900'
            : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
        )}
      >
        All Topics
      </Link>
      {categories.map((cat) => {
        const Icon = getIcon(cat.icon);
        const isActive = pathname.startsWith(`/dashboard/help/${cat.slug}`);
        return (
          <Link
            key={cat.id}
            href={`/dashboard/help/${cat.slug}`}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors',
              isActive
                ? 'bg-neutral-100 text-neutral-900 font-medium'
                : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
            )}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{cat.name}</span>
            <span className="ml-auto text-xs text-neutral-400">{cat.article_count}</span>
          </Link>
        );
      })}
    </nav>
  );
}
