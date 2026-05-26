'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import type { CreateSessionRequest, SourceType } from '@/domains/web-search/types/webSearch.types';

interface NewSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateSessionRequest) => void;
  loading?: boolean;
}

const sourceTypeOptions: { value: SourceType; label: string }[] = [
  { value: 'manual', label: 'Manual' },
  { value: 'infringement', label: 'Infringement' },
  { value: 'prior_art', label: 'Prior Art' },
  { value: 'portfolio', label: 'Portfolio' },
];

export function NewSessionDialog({
  open,
  onOpenChange,
  onSubmit,
  loading,
}: NewSessionDialogProps) {
  const [title, setTitle] = useState('');
  const [sourceType, setSourceType] = useState<SourceType>('manual');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSubmit({
      title: title.trim(),
      source_type: sourceType,
      notes: notes.trim() || undefined,
    });

    // Reset form
    setTitle('');
    setSourceType('manual');
    setNotes('');
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setTitle('');
      setSourceType('manual');
      setNotes('');
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Search Session</DialogTitle>
          <DialogDescription>
            Create a new web search session to organize your research queries and results.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="session-title">Title</Label>
            <Input
              id="session-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Product X infringement evidence"
              required
              aria-required="true"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="source-type">Source Type</Label>
            <Select
              value={sourceType}
              onValueChange={(val) => setSourceType(val as SourceType)}
            >
              <SelectTrigger id="source-type" aria-label="Source type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sourceTypeOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="session-notes">Notes (optional)</Label>
            <Textarea
              id="session-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional context or notes for this session..."
              className="min-h-[80px] resize-none"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim() || loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Session'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
