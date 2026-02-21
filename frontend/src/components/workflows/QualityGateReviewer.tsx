'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle, XCircle, Shield, Target, Send
} from 'lucide-react';

interface Criterion {
  name: string;
  description: string;
  weight: number;
}

interface QualityControl {
  id: string;
  name?: string;
  criteria: Criterion[];
  passing_score: number;
  check_type: string;
}

interface CriterionReview {
  checked: boolean;
  score: number;
}

interface QualityGateReviewerProps {
  qualityControl: QualityControl;
  onSubmitReview: (qualityControlId: string, results: {
    criteria_results: Array<{
      name: string;
      checked: boolean;
      score: number;
      weight: number;
    }>;
    aggregate_score: number;
    passed: boolean;
  }) => void;
}

export function QualityGateReviewer({ qualityControl, onSubmitReview }: QualityGateReviewerProps) {
  const [reviews, setReviews] = useState<Record<number, CriterionReview>>(() => {
    const initial: Record<number, CriterionReview> = {};
    qualityControl.criteria.forEach((_, index) => {
      initial[index] = { checked: false, score: 5 };
    });
    return initial;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateReview = (index: number, update: Partial<CriterionReview>) => {
    setReviews((prev) => ({
      ...prev,
      [index]: { ...prev[index], ...update },
    }));
  };

  const aggregateScore = useMemo(() => {
    const totalWeight = qualityControl.criteria.reduce((sum, c) => sum + c.weight, 0);
    if (totalWeight === 0) return 0;

    const weightedSum = qualityControl.criteria.reduce((sum, criterion, index) => {
      const review = reviews[index];
      if (!review) return sum;
      // Score is 1-10, normalize to 0-100 for the weighted calculation
      const normalizedScore = review.checked ? (review.score / 10) * 100 : 0;
      return sum + normalizedScore * criterion.weight;
    }, 0);

    return Math.round(weightedSum / totalWeight);
  }, [reviews, qualityControl.criteria]);

  const passed = aggregateScore >= qualityControl.passing_score;

  const checkedCount = Object.values(reviews).filter((r) => r.checked).length;
  const totalCriteria = qualityControl.criteria.length;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const criteriaResults = qualityControl.criteria.map((criterion, index) => ({
        name: criterion.name,
        checked: reviews[index].checked,
        score: reviews[index].score,
        weight: criterion.weight,
      }));

      onSubmitReview(qualityControl.id, {
        criteria_results: criteriaResults,
        aggregate_score: aggregateScore,
        passed,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCheckTypeLabel = (checkType: string) => {
    switch (checkType) {
      case 'automated': return 'Automated Check';
      case 'manual': return 'Manual Review';
      case 'checklist': return 'Checklist';
      case 'peer_review': return 'Peer Review';
      default: return checkType;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">
              {qualityControl.name || 'Quality Gate Review'}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{getCheckTypeLabel(qualityControl.check_type)}</Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Target className="h-3 w-3" />
              Passing: {qualityControl.passing_score}%
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Summary */}
        <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                Review Progress: {checkedCount}/{totalCriteria} criteria
              </span>
              <span className="text-sm text-muted-foreground">
                {Math.round((checkedCount / totalCriteria) * 100)}%
              </span>
            </div>
            <Progress value={(checkedCount / totalCriteria) * 100} className="h-2" />
          </div>
        </div>

        {/* Criteria List */}
        <div className="space-y-4">
          {qualityControl.criteria.map((criterion, index) => {
            const review = reviews[index];
            return (
              <div
                key={index}
                className={`p-4 rounded-lg border transition-colors ${
                  review.checked ? 'bg-green-50 border-green-200' : 'bg-background'
                }`}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    id={`criterion-${index}`}
                    checked={review.checked}
                    onCheckedChange={(checked) =>
                      updateReview(index, { checked: checked === true })
                    }
                    className="mt-0.5"
                    aria-label={`Mark "${criterion.name}" as reviewed`}
                  />
                  <div className="flex-1 space-y-3">
                    <div>
                      <Label
                        htmlFor={`criterion-${index}`}
                        className="text-sm font-medium cursor-pointer"
                      >
                        {criterion.name}
                      </Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {criterion.description}
                      </p>
                      <Badge variant="outline" className="text-[10px] mt-1">
                        Weight: {criterion.weight}
                      </Badge>
                    </div>

                    {review.checked && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs text-muted-foreground">
                            Score (1-10)
                          </Label>
                          <span className="text-sm font-medium">{review.score}/10</span>
                        </div>
                        <Slider
                          min={1}
                          max={10}
                          step={1}
                          value={[review.score]}
                          onValueChange={(value) => updateReview(index, { score: value[0] })}
                          className="w-full"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <Separator />

        {/* Aggregate Score & Pass/Fail */}
        <div className="flex items-center justify-between p-4 rounded-lg border-2 border-dashed">
          <div className="flex items-center gap-3">
            {passed ? (
              <CheckCircle className="h-8 w-8 text-green-600" />
            ) : (
              <XCircle className="h-8 w-8 text-red-600" />
            )}
            <div>
              <div className="text-lg font-bold">
                Aggregate Score: {aggregateScore}%
              </div>
              <div className="text-sm text-muted-foreground">
                Passing threshold: {qualityControl.passing_score}%
              </div>
            </div>
          </div>
          <Badge
            className={`text-sm px-3 py-1 ${
              passed
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {passed ? 'PASS' : 'FAIL'}
          </Badge>
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || checkedCount === 0}
          className="w-full"
          aria-label="Submit quality review"
        >
          <Send className="h-4 w-4 mr-2" />
          {isSubmitting ? 'Submitting...' : 'Submit Review'}
        </Button>
      </CardContent>
    </Card>
  );
}
