/**
 * PatentDashboard Component
 * Main dashboard for patent portfolio management
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  FileText,
  Upload,
  Search,
  Filter,
  BarChart3,
  TrendingUp,
  Clock,
  AlertTriangle,
  Download,
  Plus,
  Settings,
  Eye,
  Edit,
  Shield,
  Loader2,
  CheckCircle2,
  Pause,
  Play,
  Square,
  RotateCcw
} from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';

import { PatentUpload } from './PatentUpload';
import { PatentList } from './PatentList';
import { PatentAnalytics } from './PatentAnalytics';
import { CreateInfringementFromPatentDialog } from './CreateInfringementFromPatentDialog';
import { NewPatentDialog } from './NewPatentDialog';
import { ImportFromUSPTODialog } from './ImportFromUSPTODialog';
import { portfolioService } from '../services/portfolio.service';
import { patentsService, ODPImportJobStatus } from '../services/patents.service';
import { apiClient } from '@/services/apiClient';
import { Patent, PatentSummary, PaginatedResponse, PatentSearchQuery, PatentPortfolioStats, PatentStatus } from '../types/patent.types';
import { usePortfolio } from '../contexts/PortfolioContext';
import { formatCurrency as formatCurrencyUtil } from '@/lib/utils';

// -- Report helpers --

function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function toCsvRow(fields: string[]): string {
  return fields.map(f => escapeCsvField(f)).join(',');
}

function downloadCsv(filename: string, csvContent: string) {
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function fetchAllPatents(portfolioId: string): Promise<PatentSummary[]> {
  const all: PatentSummary[] = [];
  let offset = 0;
  const limit = 100;
  while (true) {
    const res = await apiClient.get<PaginatedResponse<PatentSummary>>(
      `/patents/patents/?portfolio=${portfolioId}&limit=${limit}&offset=${offset}`
    );
    if (!res.success || !res.data) break;
    const page = res.data;
    all.push(...(page.results || []));
    if (!page.next || all.length >= page.count) break;
    offset += limit;
  }
  return all;
}

interface PatentDashboardProps {
  projectId?: string;
}

export function PatentDashboard({ projectId }: PatentDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [patents, setPatents] = useState<PatentSummary[]>([]);
  const [totalPatentCount, setTotalPatentCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [portfolioMetrics, setPortfolioMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState<PatentSearchQuery>({});
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isNewPatentDialogOpen, setIsNewPatentDialogOpen] = useState(false);
  const [isImportUSPTODialogOpen, setIsImportUSPTODialogOpen] = useState(false);
  const [infringementDialogPatent, setInfringementDialogPatent] = useState<PatentSummary | null>(null);

  // Import progress tracking
  const [activeImport, setActiveImport] = useState<ODPImportJobStatus | null>(null);
  const [completedImport, setCompletedImport] = useState<ODPImportJobStatus | null>(null);
  const [importJobs, setImportJobs] = useState<ODPImportJobStatus[]>([]);
  const importPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { selectedPortfolio } = usePortfolio();

  useEffect(() => {
    if (selectedPortfolio || projectId) {
      fetchPortfolioData();
    }
  }, [selectedPortfolio, projectId]);

  const fetchPortfolioData = async () => {
    setIsLoading(true);
    try {
      const portfolioId = projectId || selectedPortfolio?.id;

      if (!portfolioId) {
        console.warn('No portfolio ID available');
        return;
      }

      // Fetch real metrics from the backend
      const [metrics, patentsResponse] = await Promise.allSettled([
        portfolioService.getPortfolioMetrics(portfolioId),
        apiClient.get<PaginatedResponse<PatentSummary>>(
          `/patents/patents/?portfolio=${portfolioId}&limit=20&offset=0`
        ),
      ]);

      // Process metrics
      if (metrics.status === 'fulfilled') {
        const m = metrics.value;
        const total = m.total_patents || 0;
        const byStatus = (m.by_status || []) as Array<{ status: string; count: number }>;
        const byTech = (m.by_technology || []) as Array<{ technology_area: string; count: number }>;

        const granted = byStatus.find(s => s.status === 'granted')?.count || 0;
        const pending = byStatus.find(s => s.status === 'pending' || s.status === 'filed')?.count || 0;
        const expired = byStatus.find(s => s.status === 'expired')?.count || 0;

        setPortfolioMetrics({
          totalPatents: total,
          activePatents: granted,
          pendingPatents: pending,
          expiredPatents: expired,
          totalValue: m.total_value || 0,
          totalMaintenance: m.total_maintenance || 0,
          recentFilings: m.recent_filings || [],
          expiringSoon: m.expiring_soon || [],
          statusDistribution: byStatus.map(s => ({ status: s.status, count: s.count })),
          topTechnologies: byTech.map(t => ({
            technology: t.technology_area || 'Unclassified',
            count: t.count,
            percentage: total > 0 ? (t.count / total) * 100 : 0,
          })),
          byType: m.by_type || [],
          infringementSummary: m.infringement_summary || null,
        });
      } else {
        // Fallback to cached portfolio counts
        setPortfolioMetrics({
          totalPatents: selectedPortfolio?.total_patents || 0,
          activePatents: selectedPortfolio?.active_patents || 0,
          pendingPatents: selectedPortfolio?.pending_patents || 0,
          expiredPatents: selectedPortfolio?.expired_patents || 0,
          totalValue: selectedPortfolio?.total_value || 0,
          statusDistribution: [],
          topTechnologies: [],
        });
      }

      // Process patent list
      if (patentsResponse.status === 'fulfilled' && patentsResponse.value.success) {
        const data = patentsResponse.value.data as PaginatedResponse<PatentSummary>;
        setPatents(data.results || []);
        setTotalPatentCount(data.count || 0);
      } else {
        setPatents([]);
        setTotalPatentCount(0);
      }

    } catch (error) {
      console.error('Failed to fetch portfolio data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPatentsPage = async (page: number, search?: string, assignee?: string) => {
    const portfolioId = projectId || selectedPortfolio?.id;
    if (!portfolioId) return;

    try {
      const offset = (page - 1) * 20;
      let url = `/patents/patents/?portfolio=${portfolioId}&limit=20&offset=${offset}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (assignee) url += `&assignee=${encodeURIComponent(assignee)}`;
      const response = await apiClient.get<PaginatedResponse<PatentSummary>>(url);
      if (response.success && response.data) {
        const data = response.data as PaginatedResponse<PatentSummary>;
        setPatents(data.results || []);
        setTotalPatentCount(data.count || 0);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('Failed to fetch patents page:', error);
    }
  };

  const handleSearch = async (query: PatentSearchQuery) => {
    setSearchQuery(query);
    try {
      await fetchPatentsPage(1, query.query, query.assignee);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const handleUploadComplete = (patentIds: string[]) => {
    // Refresh the patent list after successful upload
    fetchPortfolioData();
    setIsUploadDialogOpen(false);
  };

  // Import progress polling
  const pollImportStatus = useCallback(async () => {
    const pid = projectId || selectedPortfolio?.id;
    if (!pid) return;
    try {
      const data = await patentsService.getODPImportStatus(pid);
      setImportJobs(data.jobs);
      const active = data.jobs.find(j => j.status === 'running' || j.status === 'pending' || j.status === 'paused');
      if (active) {
        setActiveImport(active);
      } else {
        // Job finished or cancelled
        setActiveImport(prev => {
          if (prev) {
            const done = data.jobs.find(j => j.status === 'completed' || j.status === 'failed' || j.status === 'cancelled');
            if (done) {
              setCompletedImport(done);
              setTimeout(() => setCompletedImport(null), 5000);
            }
            fetchPortfolioData();
          }
          return null;
        });
        // Stop polling
        if (importPollRef.current) {
          clearInterval(importPollRef.current);
          importPollRef.current = null;
        }
      }
    } catch {
      // ignore poll errors
    }
  }, [projectId, selectedPortfolio?.id]);

  const startImportPolling = useCallback(() => {
    if (importPollRef.current) clearInterval(importPollRef.current);
    pollImportStatus();
    importPollRef.current = setInterval(pollImportStatus, 3000);
  }, [pollImportStatus]);

  // Check for active imports on mount / portfolio change
  useEffect(() => {
    const pid = projectId || selectedPortfolio?.id;
    if (!pid) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await patentsService.getODPImportStatus(pid);
        const active = data.jobs.find(j => j.status === 'running' || j.status === 'pending' || j.status === 'paused');
        if (active && !cancelled) {
          setActiveImport(active);
          startImportPolling();
        } else if (!cancelled) {
          // Show most recent failed/cancelled job so user can resume
          const recent = data.jobs.find(j => j.status === 'failed' || j.status === 'cancelled');
          if (recent && recent.processed < recent.total_expected) {
            setCompletedImport(recent);
          }
        }
        // Store all jobs for the jobs tab
        if (!cancelled) setImportJobs(data.jobs);
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
      if (importPollRef.current) clearInterval(importPollRef.current);
    };
  }, [projectId, selectedPortfolio?.id]);

  const handleImportStarted = useCallback(() => {
    fetchPortfolioData();
    startImportPolling();
  }, [startImportPolling]);

  const getStatusColor = (status: PatentStatus) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      published: 'bg-blue-100 text-blue-800',
      granted: 'bg-green-100 text-green-800',
      expired: 'bg-gray-100 text-gray-800',
      abandoned: 'bg-red-100 text-red-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return colors[status] || colors.pending;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // -- Report generation --
  type ReportType = 'summary' | 'technology' | 'competitive' | 'risk';
  const [reportLoading, setReportLoading] = useState<ReportType | null>(null);
  const [reportDone, setReportDone] = useState<ReportType | null>(null);

  const portfolioName = selectedPortfolio?.name || 'Portfolio';
  const dateStamp = new Date().toISOString().slice(0, 10);

  const generatePortfolioSummary = async () => {
    const pid = projectId || selectedPortfolio?.id;
    if (!pid) return;
    setReportLoading('summary');
    try {
      const allPatents = await fetchAllPatents(pid);
      const header = toCsvRow([
        'Patent Number', 'Application Number', 'Title', 'Status', 'Type',
        'Filing Date', 'Grant Date', 'Expiry Date', 'Technology Area',
        'Estimated Value (USD)', 'Assignees', 'Inventors', 'Tags',
      ]);
      const rows = allPatents.map(p => toCsvRow([
        p.patent_number || '',
        p.application_number || '',
        p.title,
        p.status,
        p.patent_type || '',
        p.filing_date || '',
        p.grant_date || '',
        p.expiry_date || '',
        p.technology_area || '',
        p.estimated_value != null ? p.estimated_value.toString() : '',
        (p.assignees || []).join('; '),
        (p.inventors || []).join('; '),
        (p.tags || []).join('; '),
      ]));

      // Add summary section at top
      const summaryLines = [
        toCsvRow(['Patent Portfolio Summary Report']),
        toCsvRow(['Portfolio', portfolioName]),
        toCsvRow(['Company', selectedPortfolio?.company_name || '']),
        toCsvRow(['Generated', new Date().toLocaleString()]),
        toCsvRow(['Total Patents', allPatents.length.toString()]),
        toCsvRow(['Total Value', portfolioMetrics?.totalValue != null ? formatCurrencyUtil(portfolioMetrics.totalValue) : 'N/A']),
        '',
        header,
        ...rows,
      ];
      downloadCsv(`${portfolioName.replace(/\s+/g, '_')}_Summary_${dateStamp}.csv`, summaryLines.join('\n'));
      setReportDone('summary');
      setTimeout(() => setReportDone(null), 2000);
    } finally {
      setReportLoading(null);
    }
  };

  const generateTechnologyLandscape = async () => {
    const pid = projectId || selectedPortfolio?.id;
    if (!pid) return;
    setReportLoading('technology');
    try {
      const allPatents = await fetchAllPatents(pid);
      // Group by technology area
      const techMap = new Map<string, PatentSummary[]>();
      allPatents.forEach(p => {
        const tech = p.technology_area || 'Unclassified';
        if (!techMap.has(tech)) techMap.set(tech, []);
        techMap.get(tech)!.push(p);
      });

      const lines = [
        toCsvRow(['Technology Landscape Report']),
        toCsvRow(['Portfolio', portfolioName]),
        toCsvRow(['Generated', new Date().toLocaleString()]),
        '',
        toCsvRow(['Technology Area', 'Patent Count', '% of Portfolio', 'Avg Value (USD)', 'Granted', 'Pending', 'Earliest Filing', 'Latest Filing']),
      ];

      const sorted = [...techMap.entries()].sort((a, b) => b[1].length - a[1].length);
      for (const [tech, techPatents] of sorted) {
        const granted = techPatents.filter(p => p.status === 'granted').length;
        const pending = techPatents.filter(p => p.status === 'pending' || p.status === 'filed').length;
        const values = techPatents.filter(p => p.estimated_value != null).map(p => p.estimated_value!);
        const avgValue = values.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;
        const filingDates = techPatents.filter(p => p.filing_date).map(p => p.filing_date!).sort();
        lines.push(toCsvRow([
          tech,
          techPatents.length.toString(),
          allPatents.length > 0 ? ((techPatents.length / allPatents.length) * 100).toFixed(1) + '%' : '0%',
          avgValue.toString(),
          granted.toString(),
          pending.toString(),
          filingDates[0] || '',
          filingDates[filingDates.length - 1] || '',
        ]));
      }

      // Detail section
      lines.push('', toCsvRow(['--- Patent Details by Technology ---']), '');
      lines.push(toCsvRow(['Technology Area', 'Patent Number', 'Title', 'Status', 'Filing Date', 'Estimated Value']));
      for (const [tech, techPatents] of sorted) {
        techPatents.forEach(p => {
          lines.push(toCsvRow([
            tech,
            p.patent_number || p.application_number || '',
            p.title,
            p.status,
            p.filing_date || '',
            p.estimated_value != null ? p.estimated_value.toString() : '',
          ]));
        });
      }

      downloadCsv(`${portfolioName.replace(/\s+/g, '_')}_Technology_Landscape_${dateStamp}.csv`, lines.join('\n'));
      setReportDone('technology');
      setTimeout(() => setReportDone(null), 2000);
    } finally {
      setReportLoading(null);
    }
  };

  const generateCompetitiveAnalysis = async () => {
    const pid = projectId || selectedPortfolio?.id;
    if (!pid) return;
    setReportLoading('competitive');
    try {
      const allPatents = await fetchAllPatents(pid);
      // Group by assignee
      const assigneeMap = new Map<string, PatentSummary[]>();
      allPatents.forEach(p => {
        const assignees = p.assignees?.length ? p.assignees : ['Unassigned'];
        assignees.forEach(a => {
          if (!assigneeMap.has(a)) assigneeMap.set(a, []);
          assigneeMap.get(a)!.push(p);
        });
      });

      const lines = [
        toCsvRow(['Competitive Analysis Report']),
        toCsvRow(['Portfolio', portfolioName]),
        toCsvRow(['Generated', new Date().toLocaleString()]),
        '',
        toCsvRow(['Assignee', 'Patent Count', '% of Portfolio', 'Total Value (USD)', 'Top Technology', 'Granted', 'Pending']),
      ];

      const sorted = [...assigneeMap.entries()].sort((a, b) => b[1].length - a[1].length);
      for (const [assignee, assigneePatents] of sorted) {
        const granted = assigneePatents.filter(p => p.status === 'granted').length;
        const pending = assigneePatents.filter(p => p.status === 'pending' || p.status === 'filed').length;
        const totalValue = assigneePatents
          .filter(p => p.estimated_value != null)
          .reduce((sum, p) => sum + p.estimated_value!, 0);
        // Find most common technology
        const techCounts = new Map<string, number>();
        assigneePatents.forEach(p => {
          const t = p.technology_area || 'Unclassified';
          techCounts.set(t, (techCounts.get(t) || 0) + 1);
        });
        const topTech = [...techCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || '';

        lines.push(toCsvRow([
          assignee,
          assigneePatents.length.toString(),
          allPatents.length > 0 ? ((assigneePatents.length / allPatents.length) * 100).toFixed(1) + '%' : '0%',
          totalValue.toString(),
          topTech,
          granted.toString(),
          pending.toString(),
        ]));
      }

      // Inventor analysis
      const inventorMap = new Map<string, number>();
      allPatents.forEach(p => {
        (p.inventors || []).forEach(inv => {
          inventorMap.set(inv, (inventorMap.get(inv) || 0) + 1);
        });
      });
      lines.push('', toCsvRow(['--- Top Inventors ---']), '');
      lines.push(toCsvRow(['Inventor', 'Patent Count']));
      [...inventorMap.entries()].sort((a, b) => b[1] - a[1]).forEach(([inv, count]) => {
        lines.push(toCsvRow([inv, count.toString()]));
      });

      downloadCsv(`${portfolioName.replace(/\s+/g, '_')}_Competitive_Analysis_${dateStamp}.csv`, lines.join('\n'));
      setReportDone('competitive');
      setTimeout(() => setReportDone(null), 2000);
    } finally {
      setReportLoading(null);
    }
  };

  const generateRiskAssessment = async () => {
    const pid = projectId || selectedPortfolio?.id;
    if (!pid) return;
    setReportLoading('risk');
    try {
      const allPatents = await fetchAllPatents(pid);
      const now = new Date();
      const oneYear = new Date(now);
      oneYear.setFullYear(oneYear.getFullYear() + 1);

      const expiringSoon = allPatents.filter(p => {
        if (!p.expiry_date) return false;
        const exp = new Date(p.expiry_date);
        return exp > now && exp <= oneYear;
      });
      const expired = allPatents.filter(p => {
        if (!p.expiry_date) return false;
        return new Date(p.expiry_date) <= now;
      });
      const noExpiry = allPatents.filter(p => !p.expiry_date && p.status === 'granted');

      const lines = [
        toCsvRow(['Risk Assessment Report']),
        toCsvRow(['Portfolio', portfolioName]),
        toCsvRow(['Generated', new Date().toLocaleString()]),
        toCsvRow(['Total Patents', allPatents.length.toString()]),
        '',
        toCsvRow(['Risk Category', 'Count', 'Details']),
        toCsvRow(['Expired', expired.length.toString(), 'Patents past expiry date']),
        toCsvRow(['Expiring Within 1 Year', expiringSoon.length.toString(), 'Require renewal attention']),
        toCsvRow(['Granted - No Expiry Date Set', noExpiry.length.toString(), 'Missing expiry data']),
        toCsvRow(['Pending/Filed', allPatents.filter(p => p.status === 'pending' || p.status === 'filed').length.toString(), 'Awaiting examination']),
        toCsvRow(['Abandoned/Rejected', allPatents.filter(p => p.status === 'abandoned' || p.status === 'rejected').length.toString(), 'No longer active']),
      ];

      if (portfolioMetrics?.infringementSummary) {
        const inf = portfolioMetrics.infringementSummary;
        lines.push('', toCsvRow(['--- Infringement Risk ---']));
        lines.push(toCsvRow(['Total Infringement Cases', inf.total_cases.toString()]));
        lines.push(toCsvRow(['Active Cases', inf.active_cases.toString()]));
        lines.push(toCsvRow(['High Risk Cases', inf.high_risk_cases.toString()]));
      }

      // Expiring soon detail
      if (expiringSoon.length > 0) {
        lines.push('', toCsvRow(['--- Patents Expiring Within 1 Year ---']));
        lines.push(toCsvRow(['Patent Number', 'Title', 'Expiry Date', 'Days Remaining', 'Estimated Value']));
        expiringSoon
          .sort((a, b) => new Date(a.expiry_date!).getTime() - new Date(b.expiry_date!).getTime())
          .forEach(p => {
            const daysLeft = Math.ceil((new Date(p.expiry_date!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            lines.push(toCsvRow([
              p.patent_number || p.application_number || '',
              p.title,
              p.expiry_date!,
              daysLeft.toString(),
              p.estimated_value != null ? p.estimated_value.toString() : '',
            ]));
          });
      }

      // Expired detail
      if (expired.length > 0) {
        lines.push('', toCsvRow(['--- Expired Patents ---']));
        lines.push(toCsvRow(['Patent Number', 'Title', 'Expiry Date', 'Estimated Value']));
        expired.forEach(p => {
          lines.push(toCsvRow([
            p.patent_number || p.application_number || '',
            p.title,
            p.expiry_date!,
            p.estimated_value != null ? p.estimated_value.toString() : '',
          ]));
        });
      }

      // Full risk matrix
      lines.push('', toCsvRow(['--- Full Patent Risk Matrix ---']));
      lines.push(toCsvRow(['Patent Number', 'Title', 'Status', 'Expiry Date', 'Risk Level', 'Estimated Value']));
      allPatents.forEach(p => {
        let risk = 'Low';
        if (p.status === 'expired' || p.status === 'abandoned' || p.status === 'rejected') {
          risk = 'Inactive';
        } else if (p.expiry_date && new Date(p.expiry_date) <= now) {
          risk = 'Critical';
        } else if (p.expiry_date && new Date(p.expiry_date) <= oneYear) {
          risk = 'High';
        } else if (p.status === 'pending' || p.status === 'filed') {
          risk = 'Medium';
        }
        lines.push(toCsvRow([
          p.patent_number || p.application_number || '',
          p.title,
          p.status,
          p.expiry_date || 'N/A',
          risk,
          p.estimated_value != null ? p.estimated_value.toString() : '',
        ]));
      });

      downloadCsv(`${portfolioName.replace(/\s+/g, '_')}_Risk_Assessment_${dateStamp}.csv`, lines.join('\n'));
      setReportDone('risk');
      setTimeout(() => setReportDone(null), 2000);
    } finally {
      setReportLoading(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Import progress banner */}
      {activeImport && (
        <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {activeImport.status === 'paused' ? (
                <Pause className="h-4 w-4 text-amber-500" />
              ) : (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              )}
              <span className="text-sm font-medium">
                {activeImport.status === 'paused'
                  ? 'Import paused'
                  : 'Importing patents from USPTO...'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Select
                value={String(activeImport.page_size || 100)}
                onValueChange={async (val) => {
                  try { await patentsService.setODPImportPageSize(activeImport.id, Number(val)); } catch {}
                }}
              >
                <SelectTrigger className="h-7 w-[80px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25/req</SelectItem>
                  <SelectItem value="50">50/req</SelectItem>
                  <SelectItem value="75">75/req</SelectItem>
                  <SelectItem value="100">100/req</SelectItem>
                </SelectContent>
              </Select>
              {activeImport.status === 'paused' ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={async () => {
                    try { await patentsService.resumeODPImport(activeImport.id); } catch {}
                  }}
                >
                  <Play className="h-3 w-3 mr-1" />
                  Resume
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={async () => {
                    try { await patentsService.pauseODPImport(activeImport.id); } catch {}
                  }}
                >
                  <Pause className="h-3 w-3 mr-1" />
                  Pause
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                onClick={async () => {
                  try { await patentsService.cancelODPImport(activeImport.id); } catch {}
                }}
              >
                <Square className="h-3 w-3 mr-1" />
                Stop
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
                title="Restart import from current position (use if stuck)"
                onClick={async () => {
                  try {
                    await patentsService.restartODPImport(activeImport.id);
                    startImportPolling();
                  } catch {}
                }}
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Restart
              </Button>
            </div>
          </div>
          <Progress
            value={activeImport.total_expected > 0
              ? (activeImport.processed / activeImport.total_expected) * 100
              : 0}
            className="h-2"
          />
          <p className="text-xs text-muted-foreground">
            {activeImport.processed.toLocaleString()} / {activeImport.total_expected.toLocaleString()} processed
            {activeImport.created_count > 0 && (
              <> &middot; {activeImport.created_count.toLocaleString()} created</>
            )}
            {activeImport.skipped_count > 0 && (
              <> &middot; {activeImport.skipped_count.toLocaleString()} skipped</>
            )}
          </p>
        </div>
      )}

      {completedImport && !activeImport && (
        <div className={`p-4 rounded-lg ${
          completedImport.status === 'cancelled'
            ? 'bg-amber-500/5 border border-amber-500/10'
            : completedImport.status === 'failed'
              ? 'bg-destructive/5 border border-destructive/10'
              : 'bg-green-500/5 border border-green-500/10'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className={`h-4 w-4 ${
                completedImport.status === 'cancelled' ? 'text-amber-600'
                  : completedImport.status === 'failed' ? 'text-destructive'
                  : 'text-green-600'
              }`} />
              <span className={`text-sm font-medium ${
                completedImport.status === 'cancelled' ? 'text-amber-700'
                  : completedImport.status === 'failed' ? 'text-destructive'
                  : 'text-green-700'
              }`}>
                {completedImport.status === 'cancelled'
                  ? `Import stopped at ${completedImport.processed.toLocaleString()} / ${completedImport.total_expected.toLocaleString()} — ${completedImport.created_count.toLocaleString()} created`
                  : completedImport.status === 'failed'
                    ? `Import failed at ${completedImport.processed.toLocaleString()} / ${completedImport.total_expected.toLocaleString()} — ${completedImport.error_message || 'Unknown error'}`
                    : <>Import complete &mdash; {completedImport.created_count.toLocaleString()} patents created
                      {completedImport.skipped_count > 0 && (
                        <>, {completedImport.skipped_count.toLocaleString()} skipped</>
                      )}</>
                }
              </span>
            </div>
            {(completedImport.status === 'cancelled' || completedImport.status === 'failed') &&
              completedImport.processed < completedImport.total_expected && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={async () => {
                  try {
                    await patentsService.restartODPImport(completedImport.id);
                    setCompletedImport(null);
                    startImportPolling();
                  } catch {}
                }}
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Resume from {completedImport.processed.toLocaleString()}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Patent Portfolio</h1>
          <p className="text-muted-foreground">
            Manage and analyze your intellectual property portfolio
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Upload Patents
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Upload Patent Documents</DialogTitle>
                <DialogDescription>
                  Upload and process patent documents with AI-powered analysis
                </DialogDescription>
              </DialogHeader>
              <PatentUpload 
                projectId={projectId}
                onUploadComplete={handleUploadComplete}
              />
            </DialogContent>
          </Dialog>
          
          <Button variant="outline" onClick={() => setIsImportUSPTODialogOpen(true)}>
            <Search className="h-4 w-4 mr-2" />
            Search USPTO
          </Button>

          <Button variant="outline" onClick={() => setIsNewPatentDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Patent
          </Button>
        </div>
      </div>

      {/* Portfolio Stats */}
      {portfolioMetrics && (
        <div className={`grid gap-4 md:grid-cols-2 ${portfolioMetrics.infringementSummary ? 'lg:grid-cols-5' : 'lg:grid-cols-4'}`}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Patents</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{portfolioMetrics.totalPatents}</div>
              <p className="text-xs text-muted-foreground">
                Patent portfolio size
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Granted Patents</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {portfolioMetrics.activePatents}
              </div>
              <p className="text-xs text-muted-foreground">
                {portfolioMetrics.totalPatents > 0
                  ? `${((portfolioMetrics.activePatents / portfolioMetrics.totalPatents) * 100).toFixed(1)}% of total`
                  : 'No patents yet'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Applications</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {portfolioMetrics.pendingPatents}
              </div>
              <p className="text-xs text-muted-foreground">
                Applications in review
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {portfolioMetrics.expiredPatents}
              </div>
              <p className="text-xs text-muted-foreground">
                Require attention
              </p>
            </CardContent>
          </Card>

          {portfolioMetrics.infringementSummary && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Infringement Risk</CardTitle>
                <Shield className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {portfolioMetrics.infringementSummary.active_cases}
                </div>
                <p className="text-xs text-muted-foreground">
                  {portfolioMetrics.infringementSummary.high_risk_cases > 0
                    ? `${portfolioMetrics.infringementSummary.high_risk_cases} high risk`
                    : `${portfolioMetrics.infringementSummary.total_cases} total cases`}
                </p>
                <Link
                  href="/dashboard/infringement"
                  className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                >
                  View cases
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Technology Breakdown */}
      {portfolioMetrics && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Top Technologies</CardTitle>
              <CardDescription>
                Distribution of patents by technology area
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(portfolioMetrics.topTechnologies || []).map((tech: { technology: string; count: number; percentage: number }, index: number) => (
                  <div key={tech.technology} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{tech.technology}</span>
                      <span className="text-muted-foreground">
                        {tech.count} patents ({tech.percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <Progress value={tech.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status Breakdown</CardTitle>
              <CardDescription>
                Patents by current status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(portfolioMetrics.statusDistribution || []).map((item: { status: string; count: number }) => (
                  <div key={item.status} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize">{item.status}</Badge>
                      <span className="text-sm font-medium">{item.count} patents</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {portfolioMetrics.totalPatents > 0
                        ? ((item.count / portfolioMetrics.totalPatents) * 100).toFixed(1)
                        : 0}%
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="patents">Patents</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="imports">
            Imports
            {importJobs.some(j => j.status === 'running' || j.status === 'pending') && (
              <span className="ml-1.5 h-2 w-2 rounded-full bg-blue-500 animate-pulse inline-block" />
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Patent Activity</CardTitle>
              <CardDescription>
                Latest updates and milestones in your patent portfolio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {patents.slice(0, 5).map((patent) => (
                  <div key={patent.id} className="flex items-center justify-between border-b pb-4 last:border-b-0">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">{patent.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {patent.patent_number || patent.application_number || '—'} • {patent.filing_date ? `Filed ${new Date(patent.filing_date).toLocaleDateString()}` : 'No filing date'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(patent.status as PatentStatus)}>
                        {patent.status}
                      </Badge>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setIsUploadDialogOpen(true)}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-blue-500" />
                  Upload Patents
                </CardTitle>
                <CardDescription>
                  Upload and analyze new patent documents
                </CardDescription>
              </CardHeader>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setActiveTab('reports')}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-green-500" />
                  Generate Report
                </CardTitle>
                <CardDescription>
                  Create comprehensive portfolio reports
                </CardDescription>
              </CardHeader>
            </Card>

            <Link href="/dashboard/prior-art">
              <Card className="cursor-pointer hover:shadow-md transition-shadow h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5 text-purple-500" />
                    Prior Art Search
                  </CardTitle>
                  <CardDescription>
                    Search for relevant prior art and citations
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </div>
        </TabsContent>

        <TabsContent value="patents" className="space-y-4">
          <PatentList
            patents={patents}
            totalCount={totalPatentCount}
            currentPage={currentPage}
            onPageChange={fetchPatentsPage}
            onSearch={handleSearch}
            onRefresh={fetchPortfolioData}
            onAnalyzeInfringement={(patent) => setInfringementDialogPatent(patent)}
            portfolioId={projectId || selectedPortfolio?.id}
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <PatentAnalytics 
            portfolioStats={portfolioMetrics}
            patents={patents}
          />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Reports</CardTitle>
              <CardDescription>
                Generate comprehensive reports and download as CSV
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Patent Portfolio Summary</CardTitle>
                    <CardDescription className="text-sm">
                      Full patent listing with numbers, dates, status, values, assignees, and inventors
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      className="w-full"
                      onClick={generatePortfolioSummary}
                      disabled={reportLoading !== null}
                    >
                      {reportLoading === 'summary' ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating...</>
                      ) : reportDone === 'summary' ? (
                        <><CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />Downloaded</>
                      ) : (
                        <><Download className="h-4 w-4 mr-2" />Generate Report</>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Technology Landscape</CardTitle>
                    <CardDescription className="text-sm">
                      Patent distribution by technology area with counts, values, and filing trends
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      className="w-full"
                      onClick={generateTechnologyLandscape}
                      disabled={reportLoading !== null}
                    >
                      {reportLoading === 'technology' ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating...</>
                      ) : reportDone === 'technology' ? (
                        <><CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />Downloaded</>
                      ) : (
                        <><Download className="h-4 w-4 mr-2" />Generate Report</>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Competitive Analysis</CardTitle>
                    <CardDescription className="text-sm">
                      Breakdown by assignee and inventor with patent counts and portfolio share
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      className="w-full"
                      onClick={generateCompetitiveAnalysis}
                      disabled={reportLoading !== null}
                    >
                      {reportLoading === 'competitive' ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating...</>
                      ) : reportDone === 'competitive' ? (
                        <><CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />Downloaded</>
                      ) : (
                        <><Download className="h-4 w-4 mr-2" />Generate Report</>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Risk Assessment</CardTitle>
                    <CardDescription className="text-sm">
                      Expiry tracking, risk levels, infringement summary, and patent risk matrix
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      className="w-full"
                      onClick={generateRiskAssessment}
                      disabled={reportLoading !== null}
                    >
                      {reportLoading === 'risk' ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating...</>
                      ) : reportDone === 'risk' ? (
                        <><CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />Downloaded</>
                      ) : (
                        <><Download className="h-4 w-4 mr-2" />Generate Report</>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="imports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>USPTO Import Jobs</CardTitle>
              <CardDescription>
                History of patent imports from the USPTO Open Data Portal
              </CardDescription>
            </CardHeader>
            <CardContent>
              {importJobs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Upload className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No import jobs yet.</p>
                  <p className="text-sm">Use &ldquo;Search USPTO&rdquo; to start importing patents.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {importJobs.map((job) => {
                    const pct = job.total_expected > 0 ? (job.processed / job.total_expected) * 100 : 0;
                    const isActive = job.status === 'running' || job.status === 'pending';
                    const isPaused = job.status === 'paused';
                    const isFailed = job.status === 'failed';
                    const isCancelled = job.status === 'cancelled';
                    const isCompleted = job.status === 'completed';
                    const canResume = (isFailed || isCancelled) && job.processed < job.total_expected;

                    return (
                      <div
                        key={job.id}
                        className={`p-4 rounded-lg border ${
                          isActive ? 'border-blue-200 bg-blue-50/50' :
                          isPaused ? 'border-amber-200 bg-amber-50/50' :
                          isFailed ? 'border-red-200 bg-red-50/50' :
                          isCancelled ? 'border-amber-200 bg-amber-50/30' :
                          'border-green-200 bg-green-50/50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {isActive && <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />}
                            {isPaused && <Pause className="h-3.5 w-3.5 text-amber-600" />}
                            {isCompleted && <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />}
                            {isFailed && <AlertTriangle className="h-3.5 w-3.5 text-red-600" />}
                            {isCancelled && <Square className="h-3.5 w-3.5 text-amber-600" />}
                            <Badge variant="outline" className={`text-xs capitalize ${
                              isActive ? 'border-blue-300 text-blue-700' :
                              isPaused ? 'border-amber-300 text-amber-700' :
                              isFailed ? 'border-red-300 text-red-700' :
                              isCancelled ? 'border-amber-300 text-amber-700' :
                              'border-green-300 text-green-700'
                            }`}>
                              {job.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(job.created_at).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {isActive && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-6 px-2 text-xs"
                                  onClick={async () => {
                                    try { await patentsService.pauseODPImport(job.id); } catch {}
                                  }}
                                >
                                  <Pause className="h-3 w-3 mr-1" />Pause
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-6 px-2 text-xs text-destructive hover:text-destructive"
                                  onClick={async () => {
                                    try { await patentsService.cancelODPImport(job.id); } catch {}
                                  }}
                                >
                                  <Square className="h-3 w-3 mr-1" />Stop
                                </Button>
                              </>
                            )}
                            {isPaused && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 px-2 text-xs"
                                onClick={async () => {
                                  try {
                                    await patentsService.resumeODPImport(job.id);
                                    startImportPolling();
                                  } catch {}
                                }}
                              >
                                <Play className="h-3 w-3 mr-1" />Resume
                              </Button>
                            )}
                            {canResume && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 px-2 text-xs"
                                onClick={async () => {
                                  try {
                                    await patentsService.restartODPImport(job.id);
                                    setCompletedImport(null);
                                    startImportPolling();
                                  } catch {}
                                }}
                              >
                                <RotateCcw className="h-3 w-3 mr-1" />Resume from {job.processed.toLocaleString()}
                              </Button>
                            )}
                          </div>
                        </div>

                        <Progress value={pct} className={`h-1.5 mb-2 ${isCompleted ? '[&>div]:bg-green-500' : ''}`} />

                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>
                            {job.processed.toLocaleString()} / {job.total_expected.toLocaleString()} processed
                            {job.created_count > 0 && <> &middot; {job.created_count.toLocaleString()} created</>}
                            {job.skipped_count > 0 && <> &middot; {job.skipped_count.toLocaleString()} skipped</>}
                          </span>
                          <span>{pct.toFixed(1)}%</span>
                        </div>

                        {isFailed && job.error_message && (
                          <p className="text-xs text-red-600 mt-1">{job.error_message}</p>
                        )}

                        {isCompleted && job.completed_at && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Completed {new Date(job.completed_at).toLocaleString()}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Infringement Dialog */}
      <CreateInfringementFromPatentDialog
        patent={infringementDialogPatent}
        open={!!infringementDialogPatent}
        onOpenChange={(open) => { if (!open) setInfringementDialogPatent(null); }}
      />

      {/* New Patent Dialog */}
      {(projectId || selectedPortfolio?.id) && (
        <NewPatentDialog
          portfolioId={projectId || selectedPortfolio!.id}
          open={isNewPatentDialogOpen}
          onOpenChange={setIsNewPatentDialogOpen}
          onCreated={fetchPortfolioData}
        />
      )}

      {/* Import from USPTO Dialog */}
      {(projectId || selectedPortfolio?.id) && (
        <ImportFromUSPTODialog
          portfolioId={projectId || selectedPortfolio!.id}
          companyName={selectedPortfolio?.company_name}
          existingApplicationNumbers={patents.map(p => p.application_number).filter((v): v is string => !!v)}
          open={isImportUSPTODialogOpen}
          onOpenChange={setIsImportUSPTODialogOpen}
          onImported={handleImportStarted}
        />
      )}
    </div>
  );
}