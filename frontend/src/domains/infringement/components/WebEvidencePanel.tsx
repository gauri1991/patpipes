'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { ExternalLink, Globe, Upload, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WebEvidencePanelProps {
  evidenceUrl: string;
  onScreenshotReady: (blob: Blob, previewUrl: string) => void;
}

export function WebEvidencePanel({ evidenceUrl, onScreenshotReady }: WebEvidencePanelProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [blocked, setBlocked] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setBlocked(false);
    setIframeLoaded(false);
    // After 4s, check if the iframe content is accessible (null = blocked by X-Frame-Options)
    const timer = setTimeout(() => {
      try {
        if (!iframeRef.current?.contentDocument) setBlocked(true);
      } catch {
        // SecurityError thrown when cross-origin — page loaded but sandboxed (not blocked)
        // so we don't treat this as blocked
      }
    }, 4000);
    return () => clearTimeout(timer);
  }, [evidenceUrl]);

  const handleIframeLoad = () => {
    setIframeLoaded(true);
    // Immediately check accessibility; a blocked iframe fires onLoad with empty doc
    try {
      if (!iframeRef.current?.contentDocument) setBlocked(true);
    } catch {
      // cross-origin sandbox — that's fine
    }
  };

  const handleFileInput = useCallback(
    (file: File) => {
      if (!file.type.startsWith('image/')) return;
      const url = URL.createObjectURL(file);
      file.arrayBuffer().then((buf) => {
        onScreenshotReady(new Blob([buf], { type: file.type }), url);
      });
    },
    [onScreenshotReady]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileInput(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileInput(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const displayUrl = evidenceUrl.length > 60 ? evidenceUrl.slice(0, 57) + '…' : evidenceUrl;

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b bg-muted/30 shrink-0">
        <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="text-sm text-muted-foreground font-mono truncate flex-1" title={evidenceUrl}>
          {displayUrl}
        </span>
        <Button variant="ghost" size="sm" asChild>
          <a href={evidenceUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 mr-1" />
            Open
          </a>
        </Button>
      </div>

      {/* Iframe or blocked state */}
      <div className="flex-1 relative min-h-0">
        {!blocked ? (
          <iframe
            ref={iframeRef}
            src={evidenceUrl}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            onLoad={handleIframeLoad}
            className="w-full h-full border-0"
            title="Web page evidence"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center p-6">
            <AlertTriangle className="h-10 w-10 text-yellow-500" />
            <div>
              <p className="font-medium">This site blocks embedding</p>
              <p className="text-sm text-muted-foreground mt-1">
                Open the page in your browser, capture the relevant section, then upload your screenshot below.
              </p>
            </div>
            <Button variant="outline" asChild>
              <a href={evidenceUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in browser
              </a>
            </Button>
          </div>
        )}
      </div>

      {/* Screenshot upload zone */}
      <div className="shrink-0 border-t">
        <div
          ref={dropZoneRef}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="m-3 rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-muted-foreground/60 transition-colors cursor-pointer"
        >
          <label className="flex flex-col items-center gap-1.5 py-4 px-3 cursor-pointer">
            <Upload className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium">Upload screenshot to map</span>
            <span className="text-xs text-muted-foreground text-center">
              Take a screenshot of the page, then drag & drop or click to upload
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleInputChange}
            />
          </label>
        </div>
      </div>
    </div>
  );
}
