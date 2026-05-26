'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import type { CreateJobRequest } from '../types/docDownload.types';

interface NewCrawlJobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateJobRequest) => Promise<void>;
}

export const NewCrawlJobDialog: React.FC<NewCrawlJobDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
}) => {
  const [title, setTitle] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [maxDepth, setMaxDepth] = useState(2);
  const [maxPages, setMaxPages] = useState(100);
  const [crawlDelay, setCrawlDelay] = useState(2.0);
  const [proxyUrl, setProxyUrl] = useState('');
  const [excludePatterns, setExcludePatterns] = useState('');
  const [saveRenderedPages, setSaveRenderedPages] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUrl.trim()) return;

    setIsSubmitting(true);
    try {
      const data: CreateJobRequest = {
        title: title.trim() || new URL(targetUrl).hostname,
        target_url: targetUrl.trim(),
        max_depth: maxDepth,
        max_pages: maxPages,
        crawl_delay: crawlDelay,
        save_rendered_pages: saveRenderedPages,
      };

      if (proxyUrl.trim()) {
        data.proxy_url = proxyUrl.trim();
      }

      if (excludePatterns.trim()) {
        data.url_patterns_exclude = excludePatterns
          .split('\n')
          .map(p => p.trim())
          .filter(Boolean);
      }

      await onSubmit(data);
      // Reset form
      setTitle('');
      setTargetUrl('');
      setMaxDepth(2);
      setMaxPages(100);
      setCrawlDelay(2.0);
      setProxyUrl('');
      setExcludePatterns('');
      setSaveRenderedPages(true);
      setShowAdvanced(false);
      onOpenChange(false);
    } catch {
      // Error handled in store
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New Crawl Job</DialogTitle>
          <DialogDescription>
            Enter a website URL to crawl and discover documents.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* URL */}
          <div className="space-y-1.5">
            <Label htmlFor="target-url">Website URL</Label>
            <Input
              id="target-url"
              type="url"
              placeholder="https://example.com/products"
              value={targetUrl}
              onChange={e => setTargetUrl(e.target.value)}
              required
              aria-label="Target website URL"
            />
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="job-title">Job Name (optional)</Label>
            <Input
              id="job-title"
              placeholder="Auto-generated from domain"
              value={title}
              onChange={e => setTitle(e.target.value)}
              aria-label="Job title"
            />
          </div>

          {/* Depth & Pages */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="max-depth">
                Max Depth: <span className="font-semibold">{maxDepth}</span>
              </Label>
              <input
                id="max-depth"
                type="range"
                min={1}
                max={10}
                value={maxDepth}
                onChange={e => setMaxDepth(Number(e.target.value))}
                className="w-full accent-neutral-900"
                aria-label="Maximum crawl depth"
              />
              <div className="flex justify-between text-xs text-neutral-400">
                <span>1</span>
                <span>10</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="max-pages">
                Max Pages: <span className="font-semibold">{maxPages}</span>
              </Label>
              <input
                id="max-pages"
                type="range"
                min={10}
                max={1000}
                step={10}
                value={maxPages}
                onChange={e => setMaxPages(Number(e.target.value))}
                className="w-full accent-neutral-900"
                aria-label="Maximum pages to crawl"
              />
              <div className="flex justify-between text-xs text-neutral-400">
                <span>10</span>
                <span>1000</span>
              </div>
            </div>
          </div>

          {/* Crawl delay */}
          <div className="space-y-1.5">
            <Label htmlFor="crawl-delay">
              Crawl Delay: <span className="font-semibold">{crawlDelay.toFixed(1)}s</span>
            </Label>
            <input
              id="crawl-delay"
              type="range"
              min={1.0}
              max={5.0}
              step={0.5}
              value={crawlDelay}
              onChange={e => setCrawlDelay(Number(e.target.value))}
              className="w-full accent-neutral-900"
              aria-label="Crawl delay between requests"
            />
            <div className="flex justify-between text-xs text-neutral-400">
              <span>1s (faster)</span>
              <span>5s (stealthier)</span>
            </div>
          </div>

          {/* Save rendered pages */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="save-rendered"
              checked={saveRenderedPages}
              onCheckedChange={(checked) => setSaveRenderedPages(checked === true)}
            />
            <Label htmlFor="save-rendered" className="text-sm font-normal cursor-pointer">
              Auto-save rendered pages when no downloadable document found
            </Label>
          </div>

          {/* Advanced toggle */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-neutral-500 hover:text-neutral-700 underline"
          >
            {showAdvanced ? 'Hide' : 'Show'} advanced options
          </button>

          {showAdvanced && (
            <div className="space-y-4 border-t pt-4">
              {/* Proxy */}
              <div className="space-y-1.5">
                <Label htmlFor="proxy-url">Proxy URL (optional)</Label>
                <Input
                  id="proxy-url"
                  type="url"
                  placeholder="http://proxy:8080"
                  value={proxyUrl}
                  onChange={e => setProxyUrl(e.target.value)}
                  aria-label="Proxy URL"
                />
              </div>

              {/* Exclude patterns */}
              <div className="space-y-1.5">
                <Label htmlFor="exclude-patterns">Exclude URL Patterns (one per line)</Label>
                <textarea
                  id="exclude-patterns"
                  className="flex min-h-[80px] w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                  placeholder={"/login\n/cart\n/account"}
                  value={excludePatterns}
                  onChange={e => setExcludePatterns(e.target.value)}
                  aria-label="URL patterns to exclude"
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!targetUrl.trim() || isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Job'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
