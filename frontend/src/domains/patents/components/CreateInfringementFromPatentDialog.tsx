/**
 * CreateInfringementFromPatentDialog
 * Dialog to create an infringement analysis case pre-filled from a patent
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, FileText } from 'lucide-react';

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
import { Badge } from '@/components/ui/badge';
import { infringementApi } from '@/services/infringementApi';
import { PatentSummary } from '../types/patent.types';

interface CreateInfringementFromPatentDialogProps {
  patent: PatentSummary | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateInfringementFromPatentDialog({
  patent,
  open,
  onOpenChange,
}: CreateInfringementFromPatentDialogProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [accusedProductName, setAccusedProductName] = useState('');
  const [accusedPartyName, setAccusedPartyName] = useState('');
  const [analysisType, setAnalysisType] = useState('literal');
  const [description, setDescription] = useState('');

  const handleSubmit = async () => {
    if (!patent) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await infringementApi.createFromPatent({
        patent_id: patent.id,
        accused_product_name: accusedProductName,
        accused_party_name: accusedPartyName,
        analysis_type: analysisType,
      });

      if (response.success) {
        onOpenChange(false);
        resetForm();
        router.push('/dashboard/infringement');
      } else {
        setError('Failed to create infringement case.');
      }
    } catch (err) {
      console.error('Failed to create infringement case:', err);
      setError('Failed to create infringement case. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setAccusedProductName('');
    setAccusedPartyName('');
    setAnalysisType('literal');
    setDescription('');
    setError(null);
  };

  if (!patent) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) resetForm(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Analyze for Infringement
          </DialogTitle>
          <DialogDescription>
            Create a new infringement analysis case for this patent
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Patent Info (read-only) */}
          <div className="p-4 bg-muted/50 rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Patent</span>
            </div>
            <p className="text-sm font-semibold">{patent.title}</p>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono text-xs">
                {patent.patent_number || patent.application_number || '—'}
              </Badge>
              <Badge variant="secondary" className="text-xs">{patent.status}</Badge>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="accused-product">Accused Product/Service Name</Label>
              <Input
                id="accused-product"
                placeholder="e.g., CompetitorX Product Suite"
                value={accusedProductName}
                onChange={(e) => setAccusedProductName(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="accused-party">Accused Party</Label>
              <Input
                id="accused-party"
                placeholder="e.g., CompetitorX Inc."
                value={accusedPartyName}
                onChange={(e) => setAccusedPartyName(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="analysis-type">Analysis Type</Label>
              <Select value={analysisType} onValueChange={setAnalysisType}>
                <SelectTrigger id="analysis-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="literal">Literal Infringement</SelectItem>
                  <SelectItem value="doe">Doctrine of Equivalents</SelectItem>
                  <SelectItem value="induced">Induced Infringement</SelectItem>
                  <SelectItem value="contributory">Contributory Infringement</SelectItem>
                  <SelectItem value="willful">Willful Infringement</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !accusedProductName}>
            {isSubmitting ? 'Creating...' : 'Create Case'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
