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
import { InfringementCase, infringementApi } from '@/services/infringementApi';
import { toast } from 'sonner';

interface StatusChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseItem: InfringementCase | null;
  onStatusChanged: () => void;
}

export function StatusChangeDialog({
  open,
  onOpenChange,
  caseItem,
  onStatusChanged,
}: StatusChangeDialogProps) {
  const [newStatus, setNewStatus] = useState<string>(caseItem?.status || 'draft');
  const [notes, setNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  const handleStatusChange = async () => {
    if (!caseItem || !newStatus) return;

    setUpdating(true);
    try {
      await infringementApi.updateCase(caseItem.id, {
        status: newStatus as any,
        notes: notes
          ? `${caseItem.notes || ''}\n[Status Change]: ${notes}`
          : caseItem.notes,
      });
      toast.success('Status updated successfully');
      onOpenChange(false);
      setNotes('');
      onStatusChanged();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Case Status</DialogTitle>
          <DialogDescription>
            Change the status of {caseItem?.case_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="new-status">New Status</Label>
            <Select
              value={newStatus}
              onValueChange={setNewStatus}
            >
              <SelectTrigger id="new-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="active">Active Analysis</SelectItem>
                <SelectItem value="review">Under Review</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status-notes">Notes (Optional)</Label>
            <Textarea
              id="status-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this status change..."
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={updating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleStatusChange}
            disabled={updating || !newStatus}
          >
            {updating ? 'Updating...' : 'Update Status'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
