'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MarkdownRenderer } from './MarkdownRenderer';
import { cn } from '@/lib/utils';
import type { HelpArticleDetail, HelpArticleWrite } from '@/services/helpApi';

interface ArticleEditorProps {
  article?: HelpArticleDetail;
  categorySlug: string;
  onSave: (data: HelpArticleWrite) => Promise<void>;
  onCancel: () => void;
}

export function ArticleEditor({ article, categorySlug, onSave, onCancel }: ArticleEditorProps) {
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<HelpArticleWrite>({
    title: article?.title || '',
    slug: article?.slug || '',
    category_slug: categorySlug,
    content: article?.content || '',
    excerpt: article?.excerpt || '',
    order: article?.order || 0,
    is_published: article?.is_published ?? true,
    is_featured: article?.is_featured ?? false,
    tags: article?.tags || [],
  });
  const [tagsInput, setTagsInput] = useState((article?.tags || []).join(', '));

  const handleSlugify = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      await onSave({ ...form, tags });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={form.title}
            onChange={(e) => {
              const title = e.target.value;
              setForm((f) => ({
                ...f,
                title,
                slug: article ? f.slug : handleSlugify(title),
              }));
            }}
            required
          />
        </div>
        <div>
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            value={form.slug}
            onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="excerpt">Excerpt</Label>
        <Textarea
          id="excerpt"
          value={form.excerpt}
          onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
          rows={2}
          maxLength={500}
        />
      </div>

      <div>
        <Label htmlFor="tags">Tags (comma-separated)</Label>
        <Input
          id="tags"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="e.g. api, authentication, setup"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="order">Order</Label>
          <Input
            id="order"
            type="number"
            value={form.order}
            onChange={(e) => setForm((f) => ({ ...f, order: Number(e.target.value) }))}
          />
        </div>
        <div className="flex items-end gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_published}
              onChange={(e) => setForm((f) => ({ ...f, is_published: e.target.checked }))}
              className="rounded border-neutral-300"
            />
            Published
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_featured}
              onChange={(e) => setForm((f) => ({ ...f, is_featured: e.target.checked }))}
              className="rounded border-neutral-300"
            />
            Featured
          </label>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-2">
          <Label>Content (Markdown)</Label>
          <div className="ml-auto flex rounded-md border text-xs overflow-hidden">
            <button
              type="button"
              onClick={() => setActiveTab('write')}
              className={cn(
                'px-3 py-1 transition-colors',
                activeTab === 'write' ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-600 hover:bg-neutral-50'
              )}
            >
              Write
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={cn(
                'px-3 py-1 transition-colors',
                activeTab === 'preview' ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-600 hover:bg-neutral-50'
              )}
            >
              Preview
            </button>
          </div>
        </div>
        {activeTab === 'write' ? (
          <Textarea
            value={form.content}
            onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
            rows={16}
            className="font-mono text-sm"
            placeholder="Write your article in Markdown..."
          />
        ) : (
          <div className="min-h-[300px] rounded-md border p-4 overflow-y-auto">
            {form.content ? (
              <MarkdownRenderer content={form.content} />
            ) : (
              <p className="text-sm text-neutral-400">Nothing to preview</p>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 pt-2">
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving...' : article ? 'Update Article' : 'Create Article'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
