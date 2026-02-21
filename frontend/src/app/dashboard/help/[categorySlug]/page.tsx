'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HelpBreadcrumb } from '@/components/help/HelpBreadcrumb';
import { HelpArticleCard } from '@/components/help/HelpArticleCard';
import { ArticleEditor } from '@/components/help/ArticleEditor';
import { CategoryEditor } from '@/components/help/CategoryEditor';
import { helpApi, type HelpCategoryDetail, type HelpArticleWrite, type HelpCategoryWrite } from '@/services/helpApi';
import { useUserPermissions } from '@/domains/accounts/hooks/useUserPermissions';
import { Skeleton } from '@/components/ui/skeleton';

export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();
  const categorySlug = params.categorySlug as string;
  const [category, setCategory] = useState<HelpCategoryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showArticleEditor, setShowArticleEditor] = useState(false);
  const [showCategoryEditor, setShowCategoryEditor] = useState(false);
  const { hasPermission } = useUserPermissions();
  const isAdmin = hasPermission('help_manage');

  useEffect(() => {
    setLoading(true);
    helpApi.getCategoryBySlug(categorySlug).then((res) => {
      if (res.success && res.data) {
        setCategory(res.data);
      }
      setLoading(false);
    });
  }, [categorySlug]);

  const handleCreateArticle = async (data: HelpArticleWrite) => {
    const res = await helpApi.createArticle(data);
    if (res.success && res.data) {
      router.push(`/dashboard/help/${categorySlug}/${res.data.slug}`);
    }
  };

  const handleUpdateCategory = async (data: HelpCategoryWrite) => {
    if (!category) return;
    const res = await helpApi.updateCategory(category.slug, data);
    if (res.success && res.data) {
      // If slug changed, redirect
      if (res.data.slug !== categorySlug) {
        router.push(`/dashboard/help/${res.data.slug}`);
      } else {
        setCategory((prev) => prev ? { ...prev, ...res.data! } : null);
      }
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
        <div className="space-y-3 mt-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-500">Category not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <HelpBreadcrumb items={[{ label: category.name }]} />

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">{category.name}</h1>
          {category.description && (
            <p className="mt-1 text-sm text-neutral-500">{category.description}</p>
          )}
        </div>
        {isAdmin && (
          <div className="flex gap-2 flex-shrink-0">
            <Button variant="outline" size="sm" onClick={() => setShowCategoryEditor(true)}>
              Edit Category
            </Button>
            <Button size="sm" onClick={() => setShowArticleEditor(true)}>
              <Plus className="h-4 w-4 mr-1" />
              New Article
            </Button>
          </div>
        )}
      </div>

      {showArticleEditor ? (
        <div className="rounded-lg border bg-white p-6">
          <h2 className="text-lg font-semibold mb-4">New Article</h2>
          <ArticleEditor
            categorySlug={categorySlug}
            onSave={handleCreateArticle}
            onCancel={() => setShowArticleEditor(false)}
          />
        </div>
      ) : (
        <div className="space-y-3">
          {category.articles.length === 0 ? (
            <p className="text-sm text-neutral-500 py-8 text-center">No articles in this category yet.</p>
          ) : (
            category.articles.map((article) => (
              <HelpArticleCard key={article.id} article={article} />
            ))
          )}
        </div>
      )}

      {isAdmin && (
        <CategoryEditor
          category={category}
          open={showCategoryEditor}
          onOpenChange={setShowCategoryEditor}
          onSave={handleUpdateCategory}
        />
      )}
    </div>
  );
}
