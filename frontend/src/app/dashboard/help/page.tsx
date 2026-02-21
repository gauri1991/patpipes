'use client';

import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HelpSearch } from '@/components/help/HelpSearch';
import { HelpCategoryCard } from '@/components/help/HelpCategoryCard';
import { HelpArticleCard } from '@/components/help/HelpArticleCard';
import { CategoryEditor } from '@/components/help/CategoryEditor';
import { helpApi, type HelpCategory, type HelpArticleSummary, type HelpCategoryWrite } from '@/services/helpApi';
import { useUserPermissions } from '@/domains/accounts/hooks/useUserPermissions';
import { Skeleton } from '@/components/ui/skeleton';

export default function HelpPage() {
  const [categories, setCategories] = useState<HelpCategory[]>([]);
  const [featured, setFeatured] = useState<HelpArticleSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCategoryEditor, setShowCategoryEditor] = useState(false);
  const { hasPermission } = useUserPermissions();
  const isAdmin = hasPermission('help_manage');

  useEffect(() => {
    Promise.all([
      helpApi.getCategories(),
      helpApi.getFeaturedArticles(),
    ]).then(([catRes, featRes]) => {
      if (catRes.success && catRes.data) setCategories(catRes.data);
      if (featRes.success && featRes.data) setFeatured(featRes.data);
      setLoading(false);
    });
  }, []);

  const handleCreateCategory = async (data: HelpCategoryWrite) => {
    const res = await helpApi.createCategory(data);
    if (res.success && res.data) {
      setCategories((prev) => [...prev, res.data!]);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="text-center space-y-4">
          <Skeleton className="h-8 w-64 mx-auto" />
          <Skeleton className="h-12 w-full max-w-2xl mx-auto" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Hero search */}
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold text-neutral-900">Help Center</h1>
        <p className="text-neutral-500 text-sm">Search our documentation or browse by category</p>
        <HelpSearch variant="hero" />
      </div>

      {/* Featured articles */}
      {featured.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-neutral-900 mb-3">Featured Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {featured.map((article) => (
              <HelpArticleCard key={article.id} article={article} />
            ))}
          </div>
        </section>
      )}

      {/* Categories grid */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-neutral-900">Browse by Category</h2>
          {isAdmin && (
            <Button variant="outline" size="sm" onClick={() => setShowCategoryEditor(true)}>
              <Plus className="h-4 w-4 mr-1" />
              New Category
            </Button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <HelpCategoryCard key={cat.id} category={cat} />
          ))}
        </div>
      </section>

      {isAdmin && (
        <CategoryEditor
          open={showCategoryEditor}
          onOpenChange={setShowCategoryEditor}
          onSave={handleCreateCategory}
        />
      )}
    </div>
  );
}
