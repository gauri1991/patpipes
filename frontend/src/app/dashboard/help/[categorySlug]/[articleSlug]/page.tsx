'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, Calendar, User, ChevronLeft, ChevronRight, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HelpBreadcrumb } from '@/components/help/HelpBreadcrumb';
import { MarkdownRenderer } from '@/components/help/MarkdownRenderer';
import { ArticleEditor } from '@/components/help/ArticleEditor';
import {
  helpApi,
  type HelpArticleDetail,
  type HelpArticleSummary,
  type HelpArticleWrite,
} from '@/services/helpApi';
import { useUserPermissions } from '@/domains/accounts/hooks/useUserPermissions';
import { Skeleton } from '@/components/ui/skeleton';

export default function ArticlePage() {
  const params = useParams();
  const router = useRouter();
  const categorySlug = params.categorySlug as string;
  const articleSlug = params.articleSlug as string;

  const [article, setArticle] = useState<HelpArticleDetail | null>(null);
  const [siblings, setSiblings] = useState<HelpArticleSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const { hasPermission } = useUserPermissions();
  const isAdmin = hasPermission('help_manage');

  useEffect(() => {
    setLoading(true);
    setEditing(false);
    Promise.all([
      helpApi.getArticleBySlug(articleSlug),
      helpApi.getArticles(categorySlug),
    ]).then(([artRes, listRes]) => {
      if (artRes.success && artRes.data) setArticle(artRes.data);
      if (listRes.success && listRes.data) setSiblings(listRes.data);
      setLoading(false);
    });
  }, [categorySlug, articleSlug]);

  const currentIndex = siblings.findIndex((a) => a.slug === articleSlug);
  const prevArticle = currentIndex > 0 ? siblings[currentIndex - 1] : null;
  const nextArticle = currentIndex < siblings.length - 1 ? siblings[currentIndex + 1] : null;

  const handleUpdate = async (data: HelpArticleWrite) => {
    const res = await helpApi.updateArticle(articleSlug, data);
    if (res.success && res.data) {
      setArticle(res.data);
      setEditing(false);
      if (res.data.slug !== articleSlug) {
        router.push(`/dashboard/help/${categorySlug}/${res.data.slug}`);
      }
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this article?')) return;
    const res = await helpApi.deleteArticle(articleSlug);
    if (res.success) {
      router.push(`/dashboard/help/${categorySlug}`);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 max-w-4xl">
        <Skeleton className="h-5 w-64" />
        <Skeleton className="h-8 w-96" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-500">Article not found</p>
      </div>
    );
  }

  const formattedDate = new Date(article.updated_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="max-w-4xl space-y-6">
      <HelpBreadcrumb
        items={[
          { label: article.category_name, href: `/dashboard/help/${categorySlug}` },
          { label: article.title },
        ]}
      />

      {editing ? (
        <div className="rounded-lg border bg-white p-6">
          <h2 className="text-lg font-semibold mb-4">Edit Article</h2>
          <ArticleEditor
            article={article}
            categorySlug={categorySlug}
            onSave={handleUpdate}
            onCancel={() => setEditing(false)}
          />
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">{article.title}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-neutral-500">
                {article.author_name && (
                  <span className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5" />
                    {article.author_name}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {formattedDate}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5" />
                  {article.view_count} views
                </span>
              </div>
              {article.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {article.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            {isAdmin && (
              <div className="flex gap-2 flex-shrink-0">
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                  <Pencil className="h-3.5 w-3.5 mr-1" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" onClick={handleDelete} className="text-red-600 hover:text-red-700">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="rounded-lg border bg-white p-6 lg:p-8">
            <MarkdownRenderer content={article.content} />
          </div>

          {/* Prev/Next navigation */}
          {(prevArticle || nextArticle) && (
            <div className="flex items-center justify-between pt-4 border-t">
              {prevArticle ? (
                <Link
                  href={`/dashboard/help/${categorySlug}/${prevArticle.slug}`}
                  className="flex items-center gap-1.5 text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>{prevArticle.title}</span>
                </Link>
              ) : (
                <div />
              )}
              {nextArticle && (
                <Link
                  href={`/dashboard/help/${categorySlug}/${nextArticle.slug}`}
                  className="flex items-center gap-1.5 text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
                >
                  <span>{nextArticle.title}</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
