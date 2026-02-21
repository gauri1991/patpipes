'use client';

import { useState } from 'react';
import {
  Plus,
  RefreshCw,
  FileText,
  Target,
  DollarSign,
  Lightbulb,
  AlertTriangle,
  Gauge,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { infringementApi, RiskAnalysisResult } from '@/services/infringementApi';
import {
  getRiskScoreColor,
  getRiskLevelBgColor,
  formatCurrency,
  riskFactorLabels,
} from '@/domains/infringement/utils';
import { RiskAssessmentDialog } from './RiskAssessmentDialog';
import { toast } from 'sonner';

interface RiskAssessmentTabProps {
  caseId: string;
  caseName: string;
}

export function RiskAssessmentTab({ caseId, caseName }: RiskAssessmentTabProps) {
  const [riskResult, setRiskResult] = useState<RiskAnalysisResult | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [assessmentDialogOpen, setAssessmentDialogOpen] = useState(false);

  const handleCalculate = async () => {
    setCalculating(true);
    try {
      const response = await infringementApi.calculateRiskScore(caseId);
      if (response.success && response.data) {
        setRiskResult(response.data);
      }
    } catch (error) {
      console.error('Error calculating risk:', error);
      toast.error('Failed to calculate risk score');
    } finally {
      setCalculating(false);
    }
  };

  const handleGenerateReport = async () => {
    setGeneratingReport(true);
    try {
      const response = await infringementApi.generateRiskReport(caseId);
      if (response.success && response.data) {
        if (response.data.report.pdf_file) {
          window.open(response.data.report.pdf_file, '_blank');
        }
        setRiskResult(response.data.risk_analysis);
        toast.success('Risk report generated');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    } finally {
      setGeneratingReport(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg">Risk Analysis</h3>
          <p className="text-sm text-muted-foreground">
            Assess and calculate risk factors for this case
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleCalculate} disabled={calculating}>
            <RefreshCw className={`h-4 w-4 mr-2 ${calculating ? 'animate-spin' : ''}`} />
            {calculating ? 'Calculating...' : 'Calculate Score'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAssessmentDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Assessment
          </Button>
          <Button
            size="sm"
            onClick={handleGenerateReport}
            disabled={generatingReport}
          >
            <FileText className="h-4 w-4 mr-2" />
            {generatingReport ? 'Generating...' : 'Generate Report'}
          </Button>
        </div>
      </div>

      {!riskResult ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Gauge className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Risk Analysis Yet</h3>
            <p className="text-muted-foreground mb-4">
              Click &quot;Calculate Score&quot; to analyze risk factors for this case.
            </p>
            <Button onClick={handleCalculate} disabled={calculating}>
              {calculating ? 'Calculating...' : 'Calculate Risk Score'}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Overall Scores */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-2">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className={`text-4xl font-bold ${getRiskScoreColor(riskResult.overall_risk_score)}`}>
                    {riskResult.overall_risk_score}%
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Overall Risk Score</p>
                  <Badge className={`mt-2 ${getRiskLevelBgColor(riskResult.risk_level)}`}>
                    {riskResult.risk_level.toUpperCase()} RISK
                  </Badge>
                </div>
              </CardContent>
            </Card>
            <Card className="border-2">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-600">
                    {riskResult.infringement_likelihood}%
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Infringement Likelihood</p>
                  <Progress value={riskResult.infringement_likelihood} className="mt-2" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-2">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-purple-600">
                    {riskResult.confidence_level}%
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Analysis Confidence</p>
                  <div className="flex items-center justify-center mt-2 gap-1">
                    {riskResult.analysis_complete ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-xs text-green-600">Complete</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-4 w-4 text-yellow-500" />
                        <span className="text-xs text-yellow-600">Incomplete</span>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Risk Factor Breakdown */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Risk Factor Breakdown
            </h3>
            <div className="grid gap-3 md:grid-cols-2">
              {Object.entries(riskResult.risk_factors).map(([factor, data]) => (
                <div
                  key={factor}
                  className={`p-4 rounded-lg border ${data.assessed ? 'bg-background' : 'bg-muted/30'}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{riskFactorLabels[factor]}</span>
                    <Badge variant={data.assessed ? 'default' : 'outline'}>
                      {data.assessed ? `${data.score}%` : 'Not assessed'}
                    </Badge>
                  </div>
                  {data.assessed && (
                    <>
                      <Progress value={data.score} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-2">
                        Weight: {(data.weight * 100).toFixed(0)}%
                      </p>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Damages Estimation */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Damages Estimation
            </h3>
            <div className="grid gap-3 md:grid-cols-3">
              <Card>
                <CardContent className="pt-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Minimum Estimate</p>
                    <p className="text-xl font-bold text-green-600">
                      {formatCurrency(riskResult.damages_estimate.min)}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Maximum Estimate</p>
                    <p className="text-xl font-bold text-red-600">
                      {formatCurrency(riskResult.damages_estimate.max)}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Litigation Cost</p>
                    <p className="text-xl font-bold text-orange-600">
                      {formatCurrency(riskResult.damages_estimate.litigation_cost)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Recommendations */}
          {riskResult.recommendations.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Risk Mitigation Recommendations
              </h3>
              <div className="space-y-2">
                {riskResult.recommendations.map((rec, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg border ${
                      rec.priority === 'urgent'
                        ? 'bg-red-50 border-red-200'
                        : rec.priority === 'high'
                        ? 'bg-orange-50 border-orange-200'
                        : 'bg-yellow-50 border-yellow-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <AlertTriangle
                        className={`h-5 w-5 mt-0.5 ${
                          rec.priority === 'urgent'
                            ? 'text-red-500'
                            : rec.priority === 'high'
                            ? 'text-orange-500'
                            : 'text-yellow-500'
                        }`}
                      />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{riskFactorLabels[rec.factor]}</span>
                          <Badge variant="outline" className="text-xs uppercase">
                            {rec.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{rec.recommendation}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <RiskAssessmentDialog
        open={assessmentDialogOpen}
        onOpenChange={setAssessmentDialogOpen}
        caseId={caseId}
        caseName={caseName}
        onSaved={handleCalculate}
      />
    </div>
  );
}
