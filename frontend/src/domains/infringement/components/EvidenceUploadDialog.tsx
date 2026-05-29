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
import { infringementApi } from '@/services/infringementApi';
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
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [evidenceType, setEvidenceType] = useState('product_doc');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [relevanceScore, setRelevanceScore] = useState(5);
  const [relatedClaims, setRelatedClaims] = useState<Set<string>>(new Set());
  const [claimOptions, setClaimOptions] = useState<Array<{ id: string; claim_number: string }>>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load the case's claims so evidence can be linked to specific claim numbers.
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

  const toggleClaim = (claimNumber: string) => {
    setRelatedClaims((prev) => {
      const next = new Set(prev);
      next.has(claimNumber) ? next.delete(claimNumber) : next.add(claimNumber);
      return next;
    });
  };

  const handleUpload = async () => {
    if (!title || !description || (!file && !url)) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('evidence_type', evidenceType);
      formData.append('case', caseId);
      formData.append('relevance_score', String(relevanceScore));
      if (file) formData.append('file', file);
      if (url) formData.append('url', url);

      const res = await infringementApi.createEvidence(formData);
      // related_claims is a JSON field; set it via a follow-up JSON PATCH (multipart
      // can't reliably carry a JSON list).
      if (res.success && res.data && relatedClaims.size > 0) {
        await infringementApi.updateEvidence(res.data.id, { related_claims: Array.from(relatedClaims) });
      }
      toast.success('Evidence uploaded successfully');
      onOpenChange(false);
      resetForm();
      onUploaded();
    } catch (error) {
      console.error('Error uploading evidence:', error);
      toast.error('Failed to upload evidence');
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setEvidenceType('product_doc');
    setUrl('');
    setFile(null);
    setRelevanceScore(5);
    setRelatedClaims(new Set());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload Evidence</DialogTitle>
          <DialogDescription>
            Add supporting evidence for {caseName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="evidence-title">Evidence Title *</Label>
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
              rows={4}
            />
          </div>

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
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="evidence-file">Upload File</Label>
            <Input
              id="evidence-file"
              type="file"
              ref={fileInputRef}
              onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="evidence-url">Or provide URL</Label>
            <Input
              id="evidence-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/evidence"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="evidence-relevance">Relevance score: {relevanceScore}/10</Label>
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
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={uploading}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={uploading || !title || !description || (!file && !url)}
          >
            {uploading ? 'Uploading...' : 'Upload Evidence'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
