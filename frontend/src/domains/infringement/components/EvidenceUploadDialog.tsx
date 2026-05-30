'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Loader2, Globe, Upload } from 'lucide-react';
import { infringementApi } from '@/services/infringementApi';
import { apiClient } from '@/services/apiClient';
import { toast } from 'sonner';

interface EvidenceUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseId: string;
  caseName: string;
  onUploaded: () => void;
}

export function EvidenceUploadDialog({
  open,
  onOpenChange,
  caseId,
  caseName,
  onUploaded,
}: EvidenceUploadDialogProps) {
  const [mode, setMode] = useState<'file' | 'webpage'>('file');

  // Shared fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [evidenceType, setEvidenceType] = useState('product_doc');
  const [relevanceScore, setRelevanceScore] = useState(5);
  const [relatedClaims, setRelatedClaims] = useState<Set<string>>(new Set());
  const [claimOptions, setClaimOptions] = useState<Array<{ id: string; claim_number: string }>>([]);

  // File mode
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Web page mode
  const [webUrl, setWebUrl] = useState('');
  const [fetching, setFetching] = useState(false);

  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!open) return;
    infringementApi
      .getClaimMappings({ case: caseId })
      .then((res) => {
        const d: any = res.data;
        const list = Array.isArray(d) ? d : d?.results ?? [];
        setClaimOptions(list.map((m: any) => ({ id: m.id, claim_number: m.claim_number })));
      })
      .catch(() => setClaimOptions([]));
  }, [open, caseId]);

  // Reset form when mode changes
  useEffect(() => {
    setTitle('');
    setDescription('');
    setEvidenceType(mode === 'webpage' ? 'webpage' : 'product_doc');
    setFile(null);
    setFileUrl('');
    setWebUrl('');
    setRelatedClaims(new Set());
  }, [mode]);

  const toggleClaim = (claimNumber: string) => {
    setRelatedClaims((prev) => {
      const next = new Set(prev);
      next.has(claimNumber) ? next.delete(claimNumber) : next.add(claimNumber);
      return next;
    });
  };

  const handleFetchDetails = async () => {
    if (!webUrl) return;
    setFetching(true);
    try {
      const res = await apiClient.get<{ title: string; description: string }>(
        `/infringement/evidence/fetch-url-metadata/?url=${encodeURIComponent(webUrl)}`
      );
      if (res.success && res.data) {
        if (res.data.title && !title) setTitle(res.data.title);
        if (res.data.description && !description) setDescription(res.data.description);
      } else {
        toast.error('Could not fetch page details — fill in manually.');
      }
    } catch {
      toast.error('Could not fetch page details — fill in manually.');
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async () => {
    const urlValue = mode === 'webpage' ? webUrl : fileUrl;
    if (!title || !description) return;
    if (mode === 'file' && !file) return;
    if (mode === 'webpage' && !webUrl) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('evidence_type', evidenceType);
      formData.append('case', caseId);
      formData.append('relevance_score', String(relevanceScore));
      if (mode === 'file') {
        if (file) formData.append('file', file);
        if (fileUrl) formData.append('url', fileUrl);
      } else {
        formData.append('url', webUrl);
      }

      const res = await infringementApi.createEvidence(formData);
      if (res.success && res.data && relatedClaims.size > 0) {
        await infringementApi.updateEvidence(res.data.id, { related_claims: Array.from(relatedClaims) });
      }
      toast.success(mode === 'webpage' ? 'Web page evidence added' : 'Evidence uploaded successfully');
      onOpenChange(false);
      resetForm();
      onUploaded();
    } catch (error) {
      console.error('Error uploading evidence:', error);
      toast.error('Failed to add evidence');
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setMode('file');
    setTitle('');
    setDescription('');
    setEvidenceType('product_doc');
    setFileUrl('');
    setFile(null);
    setWebUrl('');
    setRelevanceScore(5);
    setRelatedClaims(new Set());
  };

  const isSubmitDisabled =
    uploading ||
    !title ||
    !description ||
    (mode === 'file' && !file) ||
    (mode === 'webpage' && !webUrl);

  const sharedFields = (
    <>
      <div className="space-y-2">
        <Label htmlFor="evidence-type">Evidence Type</Label>
        <Select value={evidenceType} onValueChange={setEvidenceType}>
          <SelectTrigger id="evidence-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="product_doc">Product Documentation</SelectItem>
            <SelectItem value="patent_doc">Patent Documentation</SelectItem>
            <SelectItem value="technical_spec">Technical Specifications</SelectItem>
            <SelectItem value="marketing">Marketing Materials</SelectItem>
            <SelectItem value="source_code">Source Code</SelectItem>
            <SelectItem value="screenshot">Screenshot</SelectItem>
            <SelectItem value="photo">Photograph</SelectItem>
            <SelectItem value="video">Video</SelectItem>
            <SelectItem value="testimony">Expert Testimony</SelectItem>
            <SelectItem value="research">Research Paper</SelectItem>
            <SelectItem value="webpage">Web Page</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="evidence-title">Title *</Label>
        <Input
          id="evidence-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter evidence title..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="evidence-description">Description *</Label>
        <Textarea
          id="evidence-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the evidence and its relevance..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="evidence-relevance">Relevance: {relevanceScore}/10</Label>
        <input
          id="evidence-relevance"
          type="range"
          min={0}
          max={10}
          step={1}
          value={relevanceScore}
          onChange={(e) => setRelevanceScore(Number(e.target.value))}
          className="w-full"
        />
      </div>

      {claimOptions.length > 0 && (
        <div className="space-y-2">
          <Label>Related claims</Label>
          <div className="flex flex-wrap gap-2">
            {claimOptions.map((c) => (
              <button
                type="button"
                key={c.id}
                onClick={() => toggleClaim(c.claim_number)}
                className="focus:outline-none"
              >
                <Badge
                  variant={relatedClaims.has(c.claim_number) ? 'default' : 'outline'}
                  className="cursor-pointer"
                >
                  Claim {c.claim_number}
                </Badge>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Evidence</DialogTitle>
          <DialogDescription>Add supporting evidence for {caseName}</DialogDescription>
        </DialogHeader>

        <Tabs value={mode} onValueChange={(v) => setMode(v as 'file' | 'webpage')}>
          <TabsList className="w-full">
            <TabsTrigger value="file" className="flex-1 gap-2">
              <Upload className="h-4 w-4" />
              Upload File
            </TabsTrigger>
            <TabsTrigger value="webpage" className="flex-1 gap-2">
              <Globe className="h-4 w-4" />
              Add Web Page
            </TabsTrigger>
          </TabsList>

          <TabsContent value="file" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="evidence-file">File *</Label>
              <Input
                id="evidence-file"
                type="file"
                ref={fileInputRef}
                onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="evidence-url">Supplementary URL</Label>
              <Input
                id="evidence-url"
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                placeholder="https://example.com/evidence"
              />
            </div>
            {sharedFields}
          </TabsContent>

          <TabsContent value="webpage" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="webpage-url">Web Page URL *</Label>
              <div className="flex gap-2">
                <Input
                  id="webpage-url"
                  value={webUrl}
                  onChange={(e) => setWebUrl(e.target.value)}
                  placeholder="https://example.com/product-page"
                  className="flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && handleFetchDetails()}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleFetchDetails}
                  disabled={!webUrl || fetching}
                >
                  {fetching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Fetch Details'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Paste the URL and click Fetch Details to auto-fill title and description.
              </p>
            </div>
            {sharedFields}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={uploading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitDisabled}>
            {uploading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>
            ) : mode === 'webpage' ? (
              <><Globe className="mr-2 h-4 w-4" />Add Web Page</>
            ) : (
              <><Upload className="mr-2 h-4 w-4" />Upload File</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
