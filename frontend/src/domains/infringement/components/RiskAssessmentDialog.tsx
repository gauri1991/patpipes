'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
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

interface RiskAssessmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseId: string;
  caseName: string;
  onSaved: () => void;
}

export function RiskAssessmentDialog({
  open,
  onOpenChange,
  caseId,
  caseName,
  onSaved,
}: RiskAssessmentDialogProps) {
  const [riskFactor, setRiskFactor] = useState<string>('technical');
  const [riskScore, setRiskScore] = useState(5);
  const [description, setDescription] = useState('');
  const [mitigation, setMitigation] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!description) return;

    setSaving(true);
    try {
      await infringementApi.createRiskAssessment({
        case: caseId,
        risk_factor: riskFactor as any,
        risk_score: riskScore,
        description,
        mitigation_strategy: mitigation,
      });

      toast.success('Risk assessment saved');
      onOpenChange(false);
      setDescription('');
      setMitigation('');
      setRiskScore(5);
      onSaved();
    } catch (error) {
      console.error('Error saving risk assessment:', error);
      toast.error('Failed to save risk assessment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Risk Assessment</DialogTitle>
          <DialogDescription>
            Add a new risk factor assessment for {caseName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Risk Factor</Label>
            <Select value={riskFactor} onValueChange={setRiskFactor}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="technical">Technical Merit</SelectItem>
                <SelectItem value="legal">Legal Precedent</SelectItem>
                <SelectItem value="financial">Financial Impact</SelectItem>
                <SelectItem value="strategic">Strategic Importance</SelectItem>
                <SelectItem value="validity">Patent Validity</SelectItem>
                <SelectItem value="enforceability">Patent Enforceability</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Risk Score: {riskScore}/10</Label>
            <input
              type="range"
              min="0"
              max="10"
              value={riskScore}
              onChange={(e) => setRiskScore(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Low Risk (0)</span>
              <span>High Risk (10)</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description *</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the risk and its implications..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Mitigation Strategy</Label>
            <Textarea
              value={mitigation}
              onChange={(e) => setMitigation(e.target.value)}
              placeholder="Suggested actions to mitigate this risk..."
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !description}>
            {saving ? 'Saving...' : 'Save Assessment'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
