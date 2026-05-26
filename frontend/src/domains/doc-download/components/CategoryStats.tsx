'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import type { LinkCategory, JobStats } from '../types/docDownload.types';
import { CATEGORY_CONFIG } from '../types/docDownload.types';
import {
  ShoppingBag, FileCode, FileSpreadsheet, Scale, Megaphone,
  ImageIcon, FileText, File, Globe, HelpCircle,
} from 'lucide-react';

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  ShoppingBag, FileCode, FileSpreadsheet, Scale, Megaphone,
  Image: ImageIcon, FileText, File, Globe, HelpCircle,
};

interface CategoryStatsProps {
  stats: JobStats | null;
  selectedCategory: LinkCategory | 'all';
  onSelectCategory: (category: LinkCategory | 'all') => void;
}

export const CategoryStats: React.FC<CategoryStatsProps> = ({
  stats,
  selectedCategory,
  onSelectCategory,
}) => {
  const categoryCounts = stats?.category_counts || {};

  const categories = Object.entries(CATEGORY_CONFIG)
    .map(([key, config]) => ({
      key: key as LinkCategory,
      ...config,
      count: categoryCounts[key] || 0,
    }))
    .filter(c => c.count > 0);

  const totalLinks = stats?.total_links || 0;

  return (
    <div className="flex flex-wrap gap-2">
      {/* All filter */}
      <button
        onClick={() => onSelectCategory('all')}
        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
          selectedCategory === 'all'
            ? 'bg-neutral-900 text-white'
            : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
        }`}
      >
        All ({totalLinks})
      </button>

      {categories.map((cat) => {
        const IconComponent = CATEGORY_ICONS[cat.icon] || Globe;
        const isActive = selectedCategory === cat.key;

        return (
          <button
            key={cat.key}
            onClick={() => onSelectCategory(cat.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              isActive
                ? 'bg-neutral-900 text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            <IconComponent className="h-3 w-3" />
            {cat.label} ({cat.count})
          </button>
        );
      })}
    </div>
  );
};
