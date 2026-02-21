'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  CheckCircle, XCircle, AlertTriangle,
  User, Clock, Calendar, Target, MessageSquare
} from 'lucide-react';

interface StepApprovalPanelProps {
  stepInstance: {
    id: string;
    status: string;
    quality_score?: number;
    workflow_step: { id: string; name: string; order: number; description?: string };
    assigned_to?: { id: string; name: string };
    start_date?: string;
    completed_date?: string;
  };
  qualityResults?: Array<{
    id: string;
    check_name: string;
    passed: boolean;
    score: number;
    message?: string;
    checked_at: string;
  }>;
  onApprove: (id: string, score: number, notes: string) => void;
  onReject: (id: string, notes: string) => void;
  onRequestChanges: (id: string, notes: string) => void;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'completed':
      return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
    case 'in_progress':
      return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
    case 'pending':
      return <Badge className="bg-gray-100 text-gray-800">Pending</Badge>;
    case 'failed':
      return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
    case 'skipped':
      return <Badge className="bg-yellow-100 text-yellow-800">Skipped</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export function StepApprovalPanel({
  stepInstance,
  qualityResults = [],
  onApprove,
  onReject,
  onRequestChanges,
}: StepApprovalPanelProps) {
  const [qualityScore, setQualityScore] = useState<number>(
    stepInstance.quality_score ?? 80
  );
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      onApprove(stepInstance.id, qualityScore, notes);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!notes.trim()) {
      return; // Notes are required for rejection
    }
    setIsSubmitting(true);
    try {
      onReject(stepInstance.id, notes);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestChanges = async () => {
    if (!notes.trim()) {
      return; // Notes are required for requesting changes
    }
    setIsSubmitting(true);
    try {
      onRequestChanges(stepInstance.id, notes);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">
              Step {stepInstance.workflow_step.order}: {stepInstance.workflow_step.name}
            </CardTitle>
            {stepInstance.workflow_step.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {stepInstance.workflow_step.description}
              </p>
            )}
          </div>
          {getStatusBadge(stepInstance.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Step Details */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-xs text-muted-foreground">Assigned To</div>
              {stepInstance.assigned_to ? (
                <div className="flex items-center gap-1 mt-0.5">
                  <Avatar className="h-4 w-4">
                    <AvatarFallback className="text-[8px]">
                      {stepInstance.assigned_to.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{stepInstance.assigned_to.name}</span>
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">Unassigned</span>
              )}
            </div>
          </div>

          {stepInstance.start_date && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-xs text-muted-foreground">Started</div>
                <div className="text-sm font-medium">{formatDate(stepInstance.start_date)}</div>
              </div>
            </div>
          )}

          {stepInstance.completed_date && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-xs text-muted-foreground">Completed</div>
                <div className="text-sm font-medium">{formatDate(stepInstance.completed_date)}</div>
              </div>
            </div>
          )}

          {stepInstance.quality_score !== undefined && stepInstance.quality_score !== null && (
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-xs text-muted-foreground">Current Score</div>
                <div className="text-sm font-medium">{stepInstance.quality_score}%</div>
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Quality Check Results */}
        {qualityResults.length > 0 && (
          <>
            <div>
              <h4 className="font-medium mb-3">Quality Check Results</h4>
              <div className="space-y-2">
                {qualityResults.map((result) => (
                  <div
                    key={result.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      result.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {result.passed ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <div>
                        <div className="text-sm font-medium">{result.check_name}</div>
                        {result.message && (
                          <div className="text-xs text-muted-foreground">{result.message}</div>
                        )}
                      </div>
                    </div>
                    <div className="text-sm font-medium">
                      {result.score}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <Separator />
          </>
        )}

        {/* Quality Score Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="quality-score">Quality Score</Label>
            <span className="text-sm font-medium">{qualityScore}%</span>
          </div>
          <Slider
            id="quality-score"
            min={0}
            max={100}
            step={1}
            value={[qualityScore]}
            onValueChange={(value) => setQualityScore(value[0])}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0 - Poor</span>
            <span>50 - Fair</span>
            <span>100 - Excellent</span>
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="approval-notes">
            <div className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              Notes
            </div>
          </Label>
          <Textarea
            id="approval-notes"
            placeholder="Add review notes, feedback, or reasons for your decision..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
          />
          {(!notes.trim()) && (
            <p className="text-xs text-muted-foreground">
              Notes are required for rejection or requesting changes.
            </p>
          )}
        </div>

        <Separator />

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={handleApprove}
            disabled={isSubmitting}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            aria-label="Approve step"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Approve
          </Button>
          <Button
            onClick={handleRequestChanges}
            disabled={isSubmitting || !notes.trim()}
            className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white"
            aria-label="Request changes"
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Request Changes
          </Button>
          <Button
            onClick={handleReject}
            disabled={isSubmitting || !notes.trim()}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            aria-label="Reject step"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Reject
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
