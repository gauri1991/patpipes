'use client';

import { useState, useEffect, useCallback } from 'react';
import { History, Clock, ChevronRight, RefreshCw, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { analyticsApi } from '@/services/analyticsApi';

const ANALYSIS_TYPE_LABELS: Record<string, string> = {
  landscape_analysis: 'Landscape Analysis',
  fto_analysis: 'FTO Analysis',
  white_space_analysis: 'White Space',
  trend_analysis: 'Technology Trends',
  portfolio_assessment: 'Portfolio Assessment',
  market_analysis: 'Market Analysis',
  investment_analysis: 'Investment Analysis',
  litigation_analysis: 'Litigation Analysis',
  licensing_analysis: 'Licensing Analysis',
  valuation_analysis: 'Valuation Analysis',
  family_analysis: 'Family Analysis',
};

const ANALYSIS_TYPE_COLORS: Record<string, string> = {
  landscape_analysis: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  fto_analysis: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  white_space_analysis: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  trend_analysis: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  portfolio_assessment: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  market_analysis: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  investment_analysis: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  litigation_analysis: 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200',
  licensing_analysis: 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200',
  valuation_analysis: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  family_analysis: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
};

interface AnalysisHistoryPanelProps {
  projectId: string;
}

export function AnalysisHistoryPanel({ projectId }: AnalysisHistoryPanelProps) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResult, setSelectedResult] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await analyticsApi.getAnalysisHistory(projectId);
      if (res.success && res.data?.results) {
        setHistory(res.data.results);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [projectId]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const viewDetail = async (resultId: string) => {
    setDetailLoading(true);
    try {
      const res = await analyticsApi.getAnalysisResult(projectId, resultId);
      if (res.success && res.data) {
        setSelectedResult(res.data);
      }
    } catch { /* ignore */ }
    setDetailLoading(false);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (history.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center">
          <History className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">No analysis runs yet. Run an analysis from the Analysis tab to see results here.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <History className="h-4 w-4" />
                Analysis History
              </CardTitle>
              <CardDescription>{history.length} past run{history.length !== 1 ? 's' : ''}</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={fetchHistory} className="h-8 w-8 p-0" aria-label="Refresh history">
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {history.map((item) => (
              <button
                key={item.id}
                onClick={() => viewDetail(item.id)}
                className="w-full flex items-center gap-3 rounded-lg border p-3 text-left hover:bg-muted/50 transition-colors"
              >
                <Badge className={`text-xs shrink-0 ${ANALYSIS_TYPE_COLORS[item.analysis_type] || ''}`} variant="secondary">
                  {ANALYSIS_TYPE_LABELS[item.analysis_type] || item.analysis_type}
                </Badge>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {new Date(item.created_at).toLocaleString()}
                  </div>
                  {item.metadata?.triggered_by && (
                    <p className="text-xs text-muted-foreground truncate">by {item.metadata.triggered_by}</p>
                  )}
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedResult} onOpenChange={(open) => { if (!open) setSelectedResult(null); }}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedResult && (
                <Badge className={ANALYSIS_TYPE_COLORS[selectedResult.analysis_type] || ''} variant="secondary">
                  {ANALYSIS_TYPE_LABELS[selectedResult.analysis_type] || selectedResult.analysis_type}
                </Badge>
              )}
              Analysis Result
            </DialogTitle>
          </DialogHeader>
          {detailLoading ? (
            <div className="py-8 text-center">
              <Loader2 className="h-5 w-5 animate-spin mx-auto" />
            </div>
          ) : selectedResult ? (
            <div className="space-y-4">
              <div className="text-xs text-muted-foreground">
                Run at: {new Date(selectedResult.created_at).toLocaleString()}
                {selectedResult.metadata?.triggered_by && ` by ${selectedResult.metadata.triggered_by}`}
              </div>
              <pre className="rounded-md bg-muted p-4 text-xs overflow-x-auto max-h-[50vh]">
                {JSON.stringify(selectedResult.data, null, 2)}
              </pre>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
