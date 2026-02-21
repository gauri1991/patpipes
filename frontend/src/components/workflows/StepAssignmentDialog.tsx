'use client';

import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, User, Calendar, CheckCircle } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
}

interface StepAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stepId: string;
  stepName?: string;
  onAssign: (stepId: string, userId: string, dueDate?: string, notes?: string) => void;
}

// Placeholder team members -- in production this would come from an API
const TEAM_MEMBERS: TeamMember[] = [
  { id: 'u1', name: 'Sarah Johnson', role: 'Patent Attorney', email: 'sarah@example.com' },
  { id: 'u2', name: 'John Smith', role: 'Technical Writer', email: 'john@example.com' },
  { id: 'u3', name: 'Emily Chen', role: 'Patent Examiner', email: 'emily@example.com' },
  { id: 'u4', name: 'Michael Brown', role: 'IP Paralegal', email: 'michael@example.com' },
  { id: 'u5', name: 'Lisa Wang', role: 'Prior Art Analyst', email: 'lisa@example.com' },
  { id: 'u6', name: 'David Martinez', role: 'Quality Reviewer', email: 'david@example.com' },
];

export function StepAssignmentDialog({
  open,
  onOpenChange,
  stepId,
  stepName,
  onAssign,
}: StepAssignmentDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return TEAM_MEMBERS;
    const query = searchQuery.toLowerCase();
    return TEAM_MEMBERS.filter(
      (member) =>
        member.name.toLowerCase().includes(query) ||
        member.role.toLowerCase().includes(query) ||
        member.email.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const selectedUser = TEAM_MEMBERS.find((m) => m.id === selectedUserId);

  const handleAssign = async () => {
    if (!selectedUserId) return;
    setIsSubmitting(true);
    try {
      onAssign(stepId, selectedUserId, dueDate || undefined, notes || undefined);
      handleReset();
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSearchQuery('');
    setSelectedUserId(null);
    setDueDate('');
    setNotes('');
  };

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      handleReset();
    }
    onOpenChange(value);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Assign Step</DialogTitle>
          <DialogDescription>
            {stepName
              ? `Assign "${stepName}" to a team member.`
              : 'Select a team member to assign this step to.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* User Search */}
          <div className="space-y-2">
            <Label htmlFor="user-search">Team Member</Label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="user-search"
                placeholder="Search by name, role, or email..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* User List */}
          <div className="max-h-[200px] overflow-y-auto border rounded-lg divide-y">
            {filteredMembers.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No team members found matching your search.
              </div>
            ) : (
              filteredMembers.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  className={`w-full flex items-center gap-3 p-3 text-left transition-colors hover:bg-accent ${
                    selectedUserId === member.id ? 'bg-accent' : ''
                  }`}
                  onClick={() => setSelectedUserId(member.id)}
                  aria-label={`Select ${member.name}`}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {member.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{member.name}</div>
                    <div className="text-xs text-muted-foreground">{member.role}</div>
                  </div>
                  {selectedUserId === member.id && (
                    <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>

          {/* Selected User Badge */}
          {selectedUser && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Selected:</span>
              <Badge variant="secondary" className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {selectedUser.name}
              </Badge>
            </div>
          )}

          {/* Due Date */}
          <div className="space-y-2">
            <Label htmlFor="due-date">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Due Date (optional)
              </div>
            </Label>
            <Input
              id="due-date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="assignment-notes">Notes (optional)</Label>
            <Textarea
              id="assignment-notes"
              placeholder="Add any instructions or context for the assignee..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleAssign}
            disabled={!selectedUserId || isSubmitting}
          >
            {isSubmitting ? 'Assigning...' : 'Assign'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
