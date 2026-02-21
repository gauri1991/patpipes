'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface HelpBreadcrumbProps {
  items: BreadcrumbItem[];
}

export function HelpBreadcrumb({ items }: HelpBreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-neutral-500">
      <Link href="/dashboard/help" className="hover:text-neutral-900 transition-colors">
        Help
      </Link>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          <ChevronRight className="h-3.5 w-3.5" />
          {item.href ? (
            <Link href={item.href} className="hover:text-neutral-900 transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-neutral-900 font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
