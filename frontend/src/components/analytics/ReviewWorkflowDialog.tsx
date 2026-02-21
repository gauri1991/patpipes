/**
 * ReviewWorkflowDialog Component
 * Handles report review workflow actions (approve, request changes, etc.)
 */

'use client';

import { useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Send,
  User,
  Calendar,
  Clock,
  FileText,
  X,
  Edit,
  Eye
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { notificationService } from '@/services/notificationService';
import { toast } from 'sonner';

interface ReviewComment {
  id: string;
  author: {
    name: string;
    role: string;
    avatar?: string;
  };
  content: string;
  timestamp: string;
  type: 'comment' | 'approval' | 'change_request' | 'system';
}

interface ReviewWorkflowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportId: string;
  reportName: string;
  currentStatus: string;
  currentReviewer?: {
    name: string;
    role: string;
    avatar?: string;
  };
  onWorkflowAction: (action: 'approve' | 'request_changes' | 'comment', data: any) => Promise<void>;
}

export function ReviewWorkflowDialog({
  open,
  onOpenChange,
  reportId,
  reportName,
  currentStatus,
  currentReviewer,
  onWorkflowAction
}: ReviewWorkflowDialogProps) {
  const [activeAction, setActiveAction] = useState<'approve' | 'request_changes' | 'comment' | null>(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  // Mock review history
  const [reviewHistory] = useState<ReviewComment[]>([
    {
      id: '1',
      author: { name: 'Sarah Johnson', role: 'Author' },
      content: 'Report submitted for review. Please check the competitive analysis section for completeness.',
      timestamp: '2025-01-08T10:00:00Z',
      type: 'system'
    },
    {
      id: '2',
      author: { name: 'Michael Chen', role: 'Reviewer' },
      content: 'The analysis looks comprehensive. However, I think we need more recent data in the market trends section.',
      timestamp: '2025-01-08T14:30:00Z',
      type: 'comment'
    },
    {
      id: '3',
      author: { name: 'Sarah Johnson', role: 'Author' },
      content: 'Updated the market trends section with Q4 2024 data as requested.',
      timestamp: '2025-01-08T16:15:00Z',
      type: 'comment'
    }
  ]);

  const handleWorkflowAction = async () => {
    if (!activeAction) return;

    setLoading(true);
    try {
      await onWorkflowAction(activeAction, {
        comment,
        timestamp: new Date().toISOString(),
        reportId
      });

      setComment('');
      setActiveAction(null);
      onOpenChange(false);
      
      const actionLabels = {
        approve: 'approved',
        request_changes: 'sent back for changes',
        comment: 'comment added'
      };
      
      toast.success(`Report ${actionLabels[activeAction]} successfully`);

      // Send notification for workflow events
      if (activeAction === 'approve') {
        await notificationService.createWorkflowNotification({
          eventType: 'report_approved',
          reportId,
          reportName,
          userId: 'current_user',
          userName: 'Current User',
          userRole: 'Reviewer',
          message: comment,
          timestamp: new Date().toISOString()
        });
      } else if (activeAction === 'request_changes') {
        await notificationService.createWorkflowNotification({
          eventType: 'changes_requested',
          reportId,
          reportName,
          userId: 'current_user',
          userName: 'Current User',
          userRole: 'Reviewer',
          message: comment,
          timestamp: new Date().toISOString()
        });
      } else if (activeAction === 'comment') {
        await notificationService.createWorkflowNotification({
          eventType: 'comment_added',
          reportId,
          reportName,
          userId: 'current_user',
          userName: 'Current User',
          userRole: 'Reviewer',
          message: comment,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      toast.error('Failed to process workflow action');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config = {
      pending_approval: { variant: 'secondary' as const, icon: Clock, label: 'Pending Approval', color: 'text-yellow-600' },
      changes_requested: { variant: 'destructive' as const, icon: AlertCircle, label: 'Changes Requested', color: 'text-red-600' },
      approved: { variant: 'default' as const, icon: CheckCircle2, label: 'Approved', color: 'text-green-600' }
    };

    const { variant, icon: Icon, label, color } = config[status as keyof typeof config] || config.pending_approval;

    return (
      <Badge variant={variant} className={`gap-1 ${color}`}>
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  const getCommentIcon = (type: ReviewComment['type']) => {
    switch (type) {
      case 'approval': return CheckCircle2;
      case 'change_request': return AlertCircle;
      case 'system': return FileText;
      default: return MessageSquare;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl">{reportName}</DialogTitle>
              <DialogDescription className="flex items-center gap-2 mt-2">
                Review Workflow Management
                {getStatusBadge(currentStatus)}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-h-[60vh] overflow-hidden">
          {/* Review History */}
          <div className="lg:col-span-2 space-y-4 overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Review History</Label>
                <span className="text-sm text-muted-foreground">
                  {reviewHistory.length} {reviewHistory.length === 1 ? 'entry' : 'entries'}
                </span>
              </div>

              <div className="space-y-4">
                {reviewHistory.map((entry) => {
                  const Icon = getCommentIcon(entry.type);
                  
                  return (
                    <Card key={entry.id} className="p-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={entry.author.avatar} />
                          <AvatarFallback>
                            {entry.author.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm">{entry.author.name}</p>
                              <p className="text-xs text-muted-foreground">{entry.author.role}</p>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Icon className="h-4 w-4" />
                              {new Date(entry.timestamp).toLocaleString()}
                            </div>
                          </div>
                          
                          <p className="text-sm leading-relaxed">{entry.content}</p>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Add Comment Section */}
            <Card className="p-4">
              <div className="space-y-4">
                <Label className="text-base font-semibold">Add Comment</Label>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add your review comments here..."
                  rows={3}
                />
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setActiveAction('comment');
                      handleWorkflowAction();
                    }}
                    disabled={!comment.trim() || loading}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Add Comment
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Workflow Actions */}
          <div className="space-y-4 overflow-y-auto">
            <div className="space-y-4">
              <Label className="text-base font-semibold">Review Actions</Label>

              {/* Current Status */}
              <Card className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Current Status</Label>
                    {getStatusBadge(currentStatus)}
                  </div>
                  
                  {currentReviewer && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Assigned Reviewer</Label>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={currentReviewer.avatar} />
                          <AvatarFallback className="text-xs">
                            {currentReviewer.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{currentReviewer.name}</p>
                          <p className="text-xs text-muted-foreground">{currentReviewer.role}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {/* Workflow Actions */}
              <div className="space-y-3">
                <Button
                  variant="default"
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    setActiveAction('approve');
                    handleWorkflowAction();
                  }}
                  disabled={currentStatus === 'approved' || loading}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Approve Report
                </Button>

                <Button
                  variant="outline"
                  className="w-full border-red-200 text-red-600 hover:bg-red-50"
                  onClick={() => setActiveAction('request_changes')}
                  disabled={currentStatus === 'approved' || loading}
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Request Changes
                </Button>

                <Separator />

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {/* Open report for viewing */}}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Report
                </Button>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {/* Open report for editing */}}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Report
                </Button>
              </div>

              {/* Request Changes Form */}
              {activeAction === 'request_changes' && (
                <Card className="p-4">
                  <div className="space-y-4">
                    <Label className="text-sm font-medium">Change Request Details</Label>
                    <Textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Specify what changes are needed..."
                      rows={4}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 bg-red-600 hover:bg-red-700"
                        onClick={handleWorkflowAction}
                        disabled={!comment.trim() || loading}
                      >
                        {loading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2" />
                        ) : (
                          <Send className="h-4 w-4 mr-2" />
                        )}
                        Send Request
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setActiveAction(null);
                          setComment('');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}