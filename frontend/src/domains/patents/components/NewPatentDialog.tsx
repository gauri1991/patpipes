/**
 * NewPatentDialog
 * Dialog to create a new patent within a portfolio
 */

'use client';

import { useState } from 'react';
import { FileText } from 'lucide-react';

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
import { apiClient } from '@/services/apiClient';

interface NewPatentDialogProps {
  portfolioId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

export function NewPatentDialog({
  portfolioId,
  open,
  onOpenChange,
  onCreated,
}: NewPatentDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [patentNumber, setPatentNumber] = useState('');
  const [applicationNumber, setApplicationNumber] = useState('');
  const [status, setStatus] = useState('draft');
  const [patentType, setPatentType] = useState('utility');
  const [filingDate, setFilingDate] = useState('');
  const [technologyArea, setTechnologyArea] = useState('');
  const [estimatedValue, setEstimatedValue] = useState('');
  const [abstract, setAbstract] = useState('');
  const [inventors, setInventors] = useState('');
  const [assignees, setAssignees] = useState('');
  const [tags, setTags] = useState('');

  const handleSubmit = async () => {
    if (!title.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const payload: Record<string, any> = {
        portfolio: portfolioId,
        title: title.trim(),
        status,
        patent_type: patentType,
      };

      if (patentNumber.trim()) payload.patent_number = patentNumber.trim();
      if (applicationNumber.trim()) payload.application_number = applicationNumber.trim();
      if (filingDate) payload.filing_date = filingDate;
      if (technologyArea.trim()) payload.technology_area = technologyArea.trim();
      if (estimatedValue) payload.estimated_value = parseFloat(estimatedValue);
      if (abstract.trim()) payload.abstract = abstract.trim();

      // Parse comma-separated strings into arrays
      if (inventors.trim()) {
        payload.inventors = inventors.split(',').map((s: string) => s.trim()).filter(Boolean);
      }
      if (assignees.trim()) {
        payload.assignees = assignees.split(',').map((s: string) => s.trim()).filter(Boolean);
      }
      if (tags.trim()) {
        payload.tags = tags.split(',').map((s: string) => s.trim()).filter(Boolean);
      }

      const response = await apiClient.post('/patents/patents/', payload);

      if (response.success) {
        onOpenChange(false);
        resetForm();
        onCreated?.();
      } else {
        setError(response.error || 'Failed to create patent.');
      }
    } catch (err) {
      console.error('Failed to create patent:', err);
      setError('Failed to create patent. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setPatentNumber('');
    setApplicationNumber('');
    setStatus('draft');
    setPatentType('utility');
    setFilingDate('');
    setTechnologyArea('');
    setEstimatedValue('');
    setAbstract('');
    setInventors('');
    setAssignees('');
    setTags('');
    setError(null);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) resetForm(); }}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Add New Patent
          </DialogTitle>
          <DialogDescription>
            Add a patent to your portfolio
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Title - full width */}
          <div className="md:col-span-2">
            <Label htmlFor="patent-title">Title *</Label>
            <Input
              id="patent-title"
              placeholder="Patent title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="patent-number">Patent Number</Label>
            <Input
              id="patent-number"
              placeholder="e.g., US10123456"
              value={patentNumber}
              onChange={(e) => setPatentNumber(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="application-number">Application Number</Label>
            <Input
              id="application-number"
              placeholder="e.g., US16/123,456"
              value={applicationNumber}
              onChange={(e) => setApplicationNumber(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="patent-status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="patent-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="filed">Filed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="granted">Granted</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="abandoned">Abandoned</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="patent-type">Patent Type</Label>
            <Select value={patentType} onValueChange={setPatentType}>
              <SelectTrigger id="patent-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="utility">Utility Patent</SelectItem>
                <SelectItem value="design">Design Patent</SelectItem>
                <SelectItem value="plant">Plant Patent</SelectItem>
                <SelectItem value="provisional">Provisional Patent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="filing-date">Filing Date</Label>
            <Input
              id="filing-date"
              type="date"
              value={filingDate}
              onChange={(e) => setFilingDate(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="technology-area">Technology Area</Label>
            <Input
              id="technology-area"
              placeholder="e.g., Machine Learning"
              value={technologyArea}
              onChange={(e) => setTechnologyArea(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="estimated-value">Estimated Value ($)</Label>
            <Input
              id="estimated-value"
              type="number"
              placeholder="e.g., 50000"
              value={estimatedValue}
              onChange={(e) => setEstimatedValue(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="inventors">Inventors</Label>
            <Input
              id="inventors"
              placeholder="Comma-separated names"
              value={inventors}
              onChange={(e) => setInventors(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="assignees">Assignees</Label>
            <Input
              id="assignees"
              placeholder="Comma-separated names"
              value={assignees}
              onChange={(e) => setAssignees(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="patent-tags">Tags</Label>
            <Input
              id="patent-tags"
              placeholder="Comma-separated tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </div>

          {/* Abstract - full width */}
          <div className="md:col-span-2">
            <Label htmlFor="patent-abstract">Abstract</Label>
            <Textarea
              id="patent-abstract"
              placeholder="Patent abstract..."
              value={abstract}
              onChange={(e) => setAbstract(e.target.value)}
              rows={3}
            />
          </div>

          {error && (
            <div className="md:col-span-2">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !title.trim()}>
            {isSubmitting ? 'Creating...' : 'Create Patent'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
