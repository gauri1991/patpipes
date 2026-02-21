'use client';

import { useState } from 'react';
import {
  Plus,
  FileText,
  Download,
  Trash2,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { useInfringementReports } from '@/hooks/useInfringementData';
import {
  reportTypeLabels,
  reportStatusLabels,
  reportStatusColor,
  formatDate,
} from '@/domains/infringement/utils';
import { toast } from 'sonner';

interface ReportsTabProps {
  caseId: string;
  caseName: string;
}

export function ReportsTab({ caseId, caseName }: ReportsTabProps) {
  const { reports, loading, refresh, createReport, reviewReport, deleteReport } =
    useInfringementReports({ case: caseId });
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState('');
  const [reportType, setReportType] = useState('preliminary');
  const [reportTitle, setReportTitle] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreateReport = async () => {
    if (!reportTitle) return;
    setCreating(true);
    try {
      await createReport({
        case: caseId,
        title: reportTitle,
        report_type: reportType as any,
        status: 'draft',
      });
      setCreateDialogOpen(false);
      setReportTitle('');
      setReportType('preliminary');
    } catch {
      // error handled by hook
    } finally {
      setCreating(false);
    }
  };

  const handleReview = async () => {
    if (!selectedReportId) return;
    try {
      await reviewReport(selectedReportId, reviewNotes);
      setReviewDialogOpen(false);
      setReviewNotes('');
    } catch {
      // error handled by hook
    }
  };

  const handleDelete = async (reportId: string) => {
    const confirmed = window.confirm('Delete this report?');
    if (!confirmed) return;
    await deleteReport(reportId);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg">Reports ({reports.length})</h3>
          <p className="text-sm text-muted-foreground">
            Generate and manage infringement analysis reports
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Generate Report
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading reports...</div>
      ) : reports.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Reports Yet</h3>
            <p className="text-muted-foreground mb-4">
              Generate your first report to document the analysis findings.
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <Card key={report.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{report.title}</span>
                      <Badge variant="outline">
                        {reportTypeLabels[report.report_type] || report.report_type}
                      </Badge>
                      <Badge className={reportStatusColor(report.status)}>
                        {reportStatusLabels[report.status] || report.status}
                      </Badge>
                    </div>
                    {report.summary && (
                      <p className="text-sm text-muted-foreground ml-6 mt-1">{report.summary}</p>
                    )}
                    <div className="flex items-center gap-4 ml-6 mt-2 text-xs text-muted-foreground">
                      <span>Created {formatDate(report.created_at)}</span>
                      {report.reviewed_date && (
                        <span className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          Reviewed {formatDate(report.reviewed_date)}
                        </span>
                      )}
                      {report.created_by && (
                        <span>
                          By {report.created_by.firstName} {report.created_by.lastName}
                        </span>
                      )}
                    </div>
                    {report.review_notes && (
                      <div className="ml-6 mt-2 p-2 bg-muted/50 rounded text-xs">
                        <span className="font-medium">Review Notes: </span>
                        {report.review_notes}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {report.pdf_file && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={report.pdf_file} target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    {report.status !== 'final' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedReportId(report.id);
                          setReviewNotes('');
                          setReviewDialogOpen(true);
                        }}
                        title="Mark as Reviewed"
                      >
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(report.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Report Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Report</DialogTitle>
            <DialogDescription>
              Create a new report for {caseName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Report Title *</Label>
              <input
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                placeholder="e.g., Preliminary Analysis - Q1 2025"
              />
            </div>
            <div className="space-y-2">
              <Label>Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="preliminary">Preliminary Analysis</SelectItem>
                  <SelectItem value="detailed">Detailed Report</SelectItem>
                  <SelectItem value="claim_chart">Claim Chart Report</SelectItem>
                  <SelectItem value="risk_assessment">Risk Assessment</SelectItem>
                  <SelectItem value="executive_summary">Executive Summary</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)} disabled={creating}>
              Cancel
            </Button>
            <Button onClick={handleCreateReport} disabled={creating || !reportTitle}>
              {creating ? 'Creating...' : 'Create Report'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Report</DialogTitle>
            <DialogDescription>
              Mark this report as reviewed and add notes
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Review Notes</Label>
              <Textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Add review comments..."
                rows={4}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleReview}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark as Reviewed
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
