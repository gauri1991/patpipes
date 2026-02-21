'use client';

import { useState, useEffect } from 'react';
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
import { ClaimElement, infringementApi } from '@/services/infringementApi';
import { toast } from 'sonner';

interface DoeAnalysisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  element: ClaimElement | null;
  onSaved: () => void;
}

export function DoeAnalysisDialog({
  open,
  onOpenChange,
  element,
  onSaved,
}: DoeAnalysisDialogProps) {
  const [doeFunction, setDoeFunction] = useState('');
  const [doeWay, setDoeWay] = useState('');
  const [doeResult, setDoeResult] = useState('');
  const [doeScore, setDoeScore] = useState(50);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (element) {
      setDoeFunction(element.doe_function || '');
      setDoeWay(element.doe_way || '');
      setDoeResult(element.doe_result || '');
      setDoeScore(element.doe_score || 50);
    }
  }, [element]);

  const handleSave = async () => {
    if (!element) return;

    setSaving(true);
    try {
      await infringementApi.analyzeElementDoE(element.id, {
        doe_function: doeFunction,
        doe_way: doeWay,
        doe_result: doeResult,
        doe_score: doeScore,
      });
      toast.success('DoE analysis saved');
      onOpenChange(false);
      onSaved();
    } catch (error) {
      console.error('Error saving DoE analysis:', error);
      toast.error('Failed to save DoE analysis');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Doctrine of Equivalents Analysis</DialogTitle>
          <DialogDescription>
            Analyze Function-Way-Result for element equivalence
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {element && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">
                Analyzing Element #{element.element_order}:
              </p>
              <p className="text-sm">{element.element_text}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label>Function (What does it do?)</Label>
            <Textarea
              value={doeFunction}
              onChange={(e) => setDoeFunction(e.target.value)}
              placeholder="Describe the function performed..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Way (How does it do it?)</Label>
            <Textarea
              value={doeWay}
              onChange={(e) => setDoeWay(e.target.value)}
              placeholder="Describe the manner/way it operates..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Result (What result does it achieve?)</Label>
            <Textarea
              value={doeResult}
              onChange={(e) => setDoeResult(e.target.value)}
              placeholder="Describe the result achieved..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Equivalence Score: {doeScore}%</Label>
            <input
              type="range"
              min="0"
              max="100"
              value={doeScore}
              onChange={(e) => setDoeScore(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>No Equivalence (0%)</span>
              <span>Perfect Equivalence (100%)</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Analysis'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
