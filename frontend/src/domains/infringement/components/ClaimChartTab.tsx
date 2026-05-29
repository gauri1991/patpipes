'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Plus,
  List,
  LayoutGrid,
  Copy,
  Edit,
  Trash2,
  Save,
  Download,
  Layers,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  RefreshCw,
  Zap,
  Scale,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useClaimMappings } from '@/hooks/useInfringementData';
import {
  ClaimMapping,
  ClaimElement,
  ElementSummary,
  infringementApi,
} from '@/services/infringementApi';
import {
  getMappingTypeColor,
  getMeetsLimitationBadge,
  getElementTypeBadge,
} from '@/domains/infringement/utils';
import { ClaimMappingDialog } from './ClaimMappingDialog';
import { ElementDialog } from './ElementDialog';
import { DoeAnalysisDialog } from './DoeAnalysisDialog';
import { LinkEvidenceDialog } from './LinkEvidenceDialog';
import { HighlightedText } from './HighlightedText';
import { ClaimTermsManager } from './ClaimTermsManager';
import { Link2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface ClaimChartTabProps {
  caseId: string;
  caseName: string;
  patentNumber?: string;
  onImportClaims?: () => void;
}

export function ClaimChartTab({ caseId, caseName, patentNumber, onImportClaims }: ClaimChartTabProps) {
  const { claimMappings, loading, refresh, deleteClaimMapping } = useClaimMappings({ case: caseId });
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  // AI-assist (gated) busy state, keyed by mapping id
  const [aiBusyId, setAiBusyId] = useState<string | null>(null);
  // Evidence-citation linking
  const [linkEvidenceElement, setLinkEvidenceElement] = useState<ClaimElement | null>(null);
  const [linkEvidenceOpen, setLinkEvidenceOpen] = useState(false);
  const [reimporting, setReimporting] = useState(false);
  // Case-wide claim-term colors for inline highlighting (read-only here).
  const [termColors, setTermColors] = useState<Record<string, string>>({});
  useEffect(() => {
    infringementApi.getCase(caseId)
      .then((res) => { if (res.success) setTermColors(res.data?.claim_term_colors || {}); })
      .catch(() => {});
  }, [caseId]);

  // Auto-import state
  const [autoImporting, setAutoImporting] = useState(false);
  const [autoImportError, setAutoImportError] = useState<string | null>(null);
  const autoImportAttempted = useRef(false);

  // Auto-import claims from USPTO when tab loads with no existing claims
  useEffect(() => {
    if (loading || autoImportAttempted.current || autoImporting) return;
    if (claimMappings.length > 0 || !patentNumber) return;

    autoImportAttempted.current = true;
    setAutoImporting(true);
    setAutoImportError(null);

    infringementApi.autoImportClaims(caseId).then((res) => {
      if (res.success && res.data) {
        const { status, message } = res.data;
        if (status === 'imported' || status === 'existing') {
          refresh();
        } else if (status === 'no_claims') {
          setAutoImportError('No claims found in USPTO full text for this patent.');
        } else if (status === 'not_found') {
          setAutoImportError(message || 'Patent not found in USPTO ODP.');
        } else if (status === 'error') {
          setAutoImportError(message || 'Failed to fetch claims from USPTO.');
        }
        // 'no_patent_number' shouldn't happen since we check patentNumber
      } else {
        setAutoImportError('Failed to auto-import claims.');
      }
    }).catch(() => {
      setAutoImportError('Network error while fetching claims from USPTO.');
    }).finally(() => {
      setAutoImporting(false);
    });
  }, [loading, claimMappings.length, patentNumber, caseId, autoImporting, refresh]);

  // Dialog states
  const [mappingDialogOpen, setMappingDialogOpen] = useState(false);
  const [editMapping, setEditMapping] = useState<ClaimMapping | null>(null);
  const [elementDialogOpen, setElementDialogOpen] = useState(false);
  const [selectedMappingForElement, setSelectedMappingForElement] = useState<string>('');
  const [doeDialogOpen, setDoeDialogOpen] = useState(false);
  const [selectedElement, setSelectedElement] = useState<ClaimElement | null>(null);

  // Quick add
  const [quickAddMode, setQuickAddMode] = useState(false);
  const [quickClaimNumber, setQuickClaimNumber] = useState('');
  const [quickClaimText, setQuickClaimText] = useState('');
  const [quickProductFeature, setQuickProductFeature] = useState('');

  // Element expansion
  const [expandedMappings, setExpandedMappings] = useState<Set<string>>(new Set());
  const [claimElements, setClaimElements] = useState<Record<string, ClaimElement[]>>({});
  const [elementSummaries, setElementSummaries] = useState<Record<string, ElementSummary>>({});
  const [loadingElements, setLoadingElements] = useState<Set<string>>(new Set());

  // Claim text collapse
  const [expandedClaims, setExpandedClaims] = useState<Set<string>>(new Set());
  const toggleClaimCollapse = (id: string) => {
    const next = new Set(expandedClaims);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpandedClaims(next);
  };

  const toggleRowSelection = (id: string) => {
    const next = new Set(selectedRows);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedRows(next);
  };

  const toggleSelectAll = () => {
    if (selectedRows.size === claimMappings.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(claimMappings.map((m) => m.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRows.size === 0) return;
    const confirmed = window.confirm(`Delete ${selectedRows.size} selected mapping(s)?`);
    if (!confirmed) return;

    const promises = Array.from(selectedRows).map((id) =>
      infringementApi.deleteClaimMapping(id)
    );
    await Promise.allSettled(promises);
    setSelectedRows(new Set());
    refresh();
    toast.success('Mappings deleted');
  };

  const handleDuplicate = async (mapping: ClaimMapping) => {
    try {
      await infringementApi.createClaimMapping({
        case: caseId,
        claim_number: `${mapping.claim_number}-copy`,
        claim_text: mapping.claim_text,
        claim_type: mapping.claim_type,
        product_feature: mapping.product_feature,
        product_feature_description: mapping.product_feature_description,
        mapping_type: mapping.mapping_type,
        match_confidence: mapping.match_confidence,
        analysis_notes: mapping.analysis_notes,
        limitations_met: mapping.limitations_met,
      });
      refresh();
      toast.success('Mapping duplicated');
    } catch {
      toast.error('Failed to duplicate');
    }
  };

  // AI-draft an element-by-element mapping (heuristic until the backend master switch
  // is enabled). Output is flagged 'ai_draft' for analyst review.
  const handleGenerateMapping = async (mapping: ClaimMapping) => {
    if (mapping.elements && mapping.elements.length > 0) {
      const ok = window.confirm('This replaces the existing elements with an AI draft. Continue?');
      if (!ok) return;
    }
    setAiBusyId(mapping.id);
    try {
      const res = await infringementApi.generateClaimMapping(mapping.id, true);
      if (res.success) {
        toast.success(`AI draft created: ${res.data?.count ?? 0} elements — please review`);
        refresh();
      } else {
        toast.error('Failed to generate mapping');
      }
    } catch {
      toast.error('Failed to generate mapping');
    } finally {
      setAiBusyId(null);
    }
  };

  // Analyst confirms an AI draft: flip the mapping and its draft elements to 'confirmed'.
  const handleConfirmDraft = async (mapping: ClaimMapping) => {
    setAiBusyId(mapping.id);
    try {
      await infringementApi.updateClaimMapping(mapping.id, { review_status: 'confirmed' });
      const drafts = (mapping.elements || []).filter((el) => el.review_status === 'ai_draft');
      await Promise.allSettled(
        drafts.map((el) => infringementApi.updateClaimElement(el.id, { review_status: 'confirmed' }))
      );
      toast.success('AI draft confirmed');
      refresh();
    } catch {
      toast.error('Failed to confirm draft');
    } finally {
      setAiBusyId(null);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm('Delete this claim mapping?');
    if (!confirmed) return;
    await deleteClaimMapping(id);
  };

  const handleQuickAdd = async () => {
    if (!quickClaimNumber || !quickClaimText || !quickProductFeature) return;
    try {
      await infringementApi.createClaimMapping({
        case: caseId,
        claim_number: quickClaimNumber,
        claim_text: quickClaimText,
        claim_type: 'independent',
        product_feature: quickProductFeature,
        product_feature_description: '',
        mapping_type: 'literal',
        match_confidence: 50,
        limitations_met: false,
      });
      setQuickClaimNumber('');
      setQuickClaimText('');
      setQuickProductFeature('');
      setQuickAddMode(false);
      refresh();
      toast.success('Mapping added');
    } catch {
      toast.error('Failed to add mapping');
    }
  };

  const toggleMappingExpansion = async (mappingId: string) => {
    const next = new Set(expandedMappings);
    if (next.has(mappingId)) {
      next.delete(mappingId);
    } else {
      next.add(mappingId);
      if (!claimElements[mappingId]) {
        setLoadingElements((prev) => new Set([...prev, mappingId]));
        try {
          const [elemRes, sumRes] = await Promise.all([
            infringementApi.getClaimMappingElements(mappingId),
            infringementApi.getElementSummary(mappingId),
          ]);
          if (elemRes.success && elemRes.data) {
            setClaimElements((prev) => ({ ...prev, [mappingId]: elemRes.data! }));
          }
          if (sumRes.success && sumRes.data) {
            setElementSummaries((prev) => ({ ...prev, [mappingId]: sumRes.data! }));
          }
        } catch {
          // ok
        } finally {
          setLoadingElements((prev) => {
            const s = new Set(prev);
            s.delete(mappingId);
            return s;
          });
        }
      }
    }
    setExpandedMappings(next);
  };

  const refreshElements = async (mappingId: string) => {
    try {
      const [elemRes, sumRes] = await Promise.all([
        infringementApi.getClaimMappingElements(mappingId),
        infringementApi.getElementSummary(mappingId),
      ]);
      if (elemRes.success && elemRes.data) {
        setClaimElements((prev) => ({ ...prev, [mappingId]: elemRes.data! }));
      }
      if (sumRes.success && sumRes.data) {
        setElementSummaries((prev) => ({ ...prev, [mappingId]: sumRes.data! }));
      }
    } catch {
      // ok
    }
  };

  const handleDeleteElement = async (elementId: string, mappingId: string) => {
    const confirmed = window.confirm('Delete this element?');
    if (!confirmed) return;
    try {
      await infringementApi.deleteClaimElement(elementId);
      setClaimElements((prev) => ({
        ...prev,
        [mappingId]: prev[mappingId].filter((e) => e.id !== elementId),
      }));
      refreshElements(mappingId);
      toast.success('Element deleted');
    } catch {
      toast.error('Failed to delete element');
    }
  };

  // Download the detailed element-level claim chart as .xlsx (authenticated blob).
  const handleExportExcel = async () => {
    try {
      const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
      const token = (typeof window !== 'undefined' &&
        (localStorage.getItem('patpipes_access_token') || localStorage.getItem('access_token'))) || '';
      const res = await fetch(`${base}/infringement/cases/${caseId}/export-claim-chart-excel/`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `claim_chart_${caseName.replace(/\s+/g, '_').slice(0, 40)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to export Excel');
    }
  };

  // Replace all current claims with a fresh import from the linked patent (force).
  // Useful when the existing mappings are stale/mismatched to the patent.
  const handleReimport = async () => {
    if (!window.confirm('Replace all current claims with a fresh import from the patent? This deletes existing mappings and their elements.')) return;
    setReimporting(true);
    try {
      const res = await infringementApi.autoImportClaims(caseId, true);
      if (res.success) {
        toast.success(`Re-imported ${res.data?.count ?? 0} claims from the patent`);
        refresh();
      } else {
        toast.error('Re-import failed');
      }
    } catch {
      toast.error('Re-import failed');
    } finally {
      setReimporting(false);
    }
  };

  const handleExportToPDF = () => {
    const content = `
      <!DOCTYPE html><html><head><title>Claim Chart - ${caseName}</title>
      <style>body{font-family:Arial,sans-serif;margin:40px}h1{border-bottom:2px solid #333;padding-bottom:10px}
      table{width:100%;border-collapse:collapse;margin-top:10px}th,td{border:1px solid #ddd;padding:8px;text-align:left}
      th{background:#f5f5f5}</style></head><body>
      <h1>Claim Chart: ${caseName}</h1>
      <table><thead><tr><th>Claim #</th><th>Type</th><th>Claim Text</th><th>Product Feature</th><th>Mapping</th><th>Confidence</th></tr></thead>
      <tbody>${claimMappings.map((m) => `<tr><td>${m.claim_number}</td><td>${m.claim_type}</td><td>${m.claim_text}</td><td>${m.product_feature}</td><td>${m.mapping_type}</td><td>${m.match_confidence}%</td></tr>`).join('')}</tbody>
      </table><p style="font-size:12px;color:#999;margin-top:40px">Generated ${new Date().toLocaleString()} | Patent Analytics Platform</p></body></html>
    `;
    const w = window.open('', '_blank');
    if (w) {
      w.document.write(content);
      w.document.close();
      setTimeout(() => w.print(), 250);
    }
  };

  const formatClaimText = (text: string) => {
    // Strip leading claim number
    const stripped = text.replace(/^\d+\.\s*/, '');
    // Split on transition phrase (comprising:, consisting of:, etc.)
    const transitionMatch = stripped.match(
      /^(.*?\b(?:comprising|consisting\s+(?:essentially\s+)?of|including|wherein|characterized\s+in\s+that)\s*:\s*)([\s\S]*)/i
    );
    if (!transitionMatch) {
      // No transition found — just split on semicolons
      return stripped.split(/;\s*/).map((part, i) => (
        <p key={i} className={i > 0 ? 'pl-4' : ''}>{part.trim()}{i < stripped.split(/;\s*/).length - 1 ? ';' : ''}</p>
      ));
    }
    const preamble = transitionMatch[1].trim();
    const body = transitionMatch[2].trim();
    const limitations = body.split(/;\s*/);
    return (
      <>
        <p className="font-medium text-foreground">{preamble}</p>
        {limitations.map((lim, i) => {
          const trimmed = lim.trim().replace(/\.$/, '');
          if (!trimmed) return null;
          return (
            <p key={i} className="pl-4 border-l-2 border-muted">
              {trimmed}{i < limitations.length - 1 ? ';' : '.'}
            </p>
          );
        })}
      </>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg">Claim Chart ({claimMappings.length})</h3>
          <p className="text-sm text-muted-foreground">
            Element-by-element patent claim to product feature mapping
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedRows.size > 0 && (
            <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete ({selectedRows.size})
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleExportToPDF}>
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportExcel}>
            <Download className="h-4 w-4 mr-2" />
            Excel
          </Button>
          {onImportClaims && (
            <Button variant="outline" size="sm" onClick={onImportClaims}>
              Import from USPTO
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleReimport} disabled={reimporting} title="Replace claims with a fresh import from the patent">
            {reimporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Re-import
          </Button>
          <Button
            variant={viewMode === 'table' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('table')}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'cards' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('cards')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setEditMapping(null);
              setMappingDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Mapping
          </Button>
        </div>
      </div>

      {!loading && !autoImporting && claimMappings.length > 0 && (
        <ClaimTermsManager caseId={caseId} termColors={termColors} onChange={setTermColors} />
      )}

      {loading || autoImporting ? (
        <div className="text-center py-8">
          {autoImporting ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Fetching claims from USPTO...</p>
            </div>
          ) : (
            'Loading claim mappings...'
          )}
        </div>
      ) : claimMappings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Scale className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Claim Mappings Yet</h3>
            {autoImportError ? (
              <div className="flex items-center justify-center gap-2 text-sm text-amber-600 mb-4">
                <AlertCircle className="h-4 w-4" />
                <span>{autoImportError}</span>
              </div>
            ) : (
              <p className="text-muted-foreground mb-4">
                Start mapping patent claims to product features.
              </p>
            )}
            <div className="flex gap-2 justify-center">
              <Button onClick={() => { setEditMapping(null); setMappingDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Mapping
              </Button>
              {onImportClaims && (
                <Button variant="outline" onClick={onImportClaims}>
                  Import from USPTO
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : viewMode === 'table' ? (
        /* Table View */
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-3 text-left w-12">
                      <input
                        type="checkbox"
                        checked={selectedRows.size === claimMappings.length && claimMappings.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded"
                      />
                    </th>
                    <th className="p-3 text-left font-semibold text-sm">Claim #</th>
                    <th className="p-3 text-left font-semibold text-sm">Type</th>
                    <th className="p-3 text-left font-semibold text-sm w-1/4">Claim Text</th>
                    <th className="p-3 text-left font-semibold text-sm w-1/4">Product Feature</th>
                    <th className="p-3 text-left font-semibold text-sm">Mapping</th>
                    <th className="p-3 text-left font-semibold text-sm">Confidence</th>
                    <th className="p-3 text-left font-semibold text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {claimMappings.map((m, idx) => (
                    <tr
                      key={m.id || `mapping-table-${idx}`}
                      className={`border-b hover:bg-muted/30 ${selectedRows.has(m.id) ? 'bg-blue-50' : ''}`}
                    >
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={selectedRows.has(m.id)}
                          onChange={() => toggleRowSelection(m.id)}
                          className="rounded"
                        />
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className="font-mono">{m.claim_number}</Badge>
                      </td>
                      <td className="p-3">
                        <Badge variant="secondary" className="text-xs">{m.claim_type}</Badge>
                      </td>
                      <td className="p-3">
                        <p className="text-sm line-clamp-2">{m.claim_text}</p>
                      </td>
                      <td className="p-3">
                        <p className="text-sm font-medium line-clamp-1">{m.product_feature}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{m.product_feature_description}</p>
                      </td>
                      <td className="p-3">
                        <Badge className={getMappingTypeColor(m.mapping_type || 'literal')}>
                          {(m.mapping_type || 'literal').replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Progress value={m.match_confidence} className="w-16 h-2" />
                          <span className="text-xs font-medium">{m.match_confidence}%</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleDuplicate(m)} title="Duplicate">
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => { setEditMapping(m); setMappingDialogOpen(true); }} title="Edit">
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(m.id)} title="Delete">
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Cards View */
        <div className="space-y-3">
          {claimMappings.map((mapping, idx) => (
            <div
              key={mapping.id || `mapping-card-${idx}`}
              className={`bg-muted/30 p-4 rounded-lg border-2 ${
                selectedRows.has(mapping.id) ? 'border-blue-500 bg-blue-50' : 'border-transparent'
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={selectedRows.has(mapping.id)}
                  onChange={() => toggleRowSelection(mapping.id)}
                  className="rounded mt-1"
                />
                <div className="flex-1">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="font-mono">Claim {mapping.claim_number}</Badge>
                        <Badge variant="secondary" className="text-xs">{mapping.claim_type}</Badge>
                        {mapping.review_status === 'ai_draft' && (
                          <Badge className="text-xs bg-amber-100 text-amber-800 border border-amber-300">
                            <Zap className="h-3 w-3 mr-1" />AI draft — review
                          </Badge>
                        )}
                      </div>
                      <div className="bg-background rounded-md border">
                        <button
                          type="button"
                          className="flex items-center gap-1 w-full p-3 text-left hover:bg-muted/50 transition-colors rounded-md"
                          onClick={() => toggleClaimCollapse(mapping.id)}
                        >
                          {!expandedClaims.has(mapping.id) ? (
                            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          )}
                          <span className="text-sm font-medium">Patent Claim</span>
                        </button>
                        {!!expandedClaims.has(mapping.id) && (
                          <div className="px-3 pb-3 text-sm text-muted-foreground space-y-1">
                            {formatClaimText(mapping.claim_text)}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge className={getMappingTypeColor(mapping.mapping_type || 'literal')}>
                          {(mapping.mapping_type || 'literal').replace('_', ' ')}
                        </Badge>
                        <span className="text-xs text-muted-foreground">Confidence: {mapping.match_confidence}%</span>
                        {mapping.limitations_met && (
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                            Limitations Met
                          </Badge>
                        )}
                      </div>
                      <div className="bg-background p-3 rounded-md border">
                        <p className="text-sm font-medium mb-1">Product Feature:</p>
                        <p className="text-sm font-semibold">{mapping.product_feature}</p>
                        <p className="text-sm text-muted-foreground mt-1">{mapping.product_feature_description}</p>
                      </div>
                    </div>
                  </div>

                  {mapping.analysis_notes && (
                    <div className="mt-3 bg-background p-3 rounded-md border">
                      <p className="text-xs font-medium mb-1">Analysis Notes:</p>
                      <p className="text-xs text-muted-foreground">{mapping.analysis_notes}</p>
                    </div>
                  )}

                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Match Confidence</span>
                      <span className="font-medium">{mapping.match_confidence}%</span>
                    </div>
                    <Progress value={mapping.match_confidence} className="h-2" />
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => toggleMappingExpansion(mapping.id)}>
                      {expandedMappings.has(mapping.id) ? <ChevronUp className="h-3 w-3 mr-2" /> : <ChevronRight className="h-3 w-3 mr-2" />}
                      Elements
                      {elementSummaries[mapping.id] && (
                        <Badge variant="secondary" className="ml-1 text-xs">{elementSummaries[mapping.id].total_elements}</Badge>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleGenerateMapping(mapping)}
                      disabled={aiBusyId === mapping.id}
                      title="Draft an element-by-element mapping for review"
                    >
                      {aiBusyId === mapping.id ? <Loader2 className="h-3 w-3 mr-2 animate-spin" /> : <Zap className="h-3 w-3 mr-2" />}
                      AI map
                    </Button>
                    {mapping.review_status === 'ai_draft' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-green-700 border-green-300 hover:bg-green-50"
                        onClick={() => handleConfirmDraft(mapping)}
                        disabled={aiBusyId === mapping.id}
                      >
                        <Save className="h-3 w-3 mr-2" />Confirm
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => handleDuplicate(mapping)}>
                      <Copy className="h-3 w-3 mr-2" />Duplicate
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => { setEditMapping(mapping); setMappingDialogOpen(true); }}>
                      <Edit className="h-3 w-3 mr-2" />Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(mapping.id)}>
                      <Trash2 className="h-3 w-3 mr-2 text-destructive" />Delete
                    </Button>
                  </div>

                  {/* Element Analysis Panel */}
                  {expandedMappings.has(mapping.id) && (
                    <div className="mt-4 border-t pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Layers className="h-4 w-4" />
                          <h4 className="font-semibold text-sm">Claim Elements</h4>
                          {elementSummaries[mapping.id] && (
                            <div className="flex items-center gap-2 ml-2">
                              <Badge className="bg-green-100 text-green-800 text-xs">{elementSummaries[mapping.id].elements_met} met</Badge>
                              <Badge className="bg-red-100 text-red-800 text-xs">{elementSummaries[mapping.id].elements_not_met} not met</Badge>
                              {elementSummaries[mapping.id].elements_unknown > 0 && (
                                <Badge className="bg-gray-100 text-gray-800 text-xs">{elementSummaries[mapping.id].elements_unknown} unknown</Badge>
                              )}
                            </div>
                          )}
                        </div>
                        <Button variant="outline" size="sm" onClick={() => {
                          setSelectedMappingForElement(mapping.id);
                          setElementDialogOpen(true);
                        }}>
                          <Plus className="h-3 w-3 mr-2" />Add Element
                        </Button>
                      </div>

                      {loadingElements.has(mapping.id) ? (
                        <div className="text-center py-4">
                          <RefreshCw className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                          <p className="text-xs text-muted-foreground mt-1">Loading elements...</p>
                        </div>
                      ) : !claimElements[mapping.id] || claimElements[mapping.id].length === 0 ? (
                        <div className="text-center py-4 bg-muted/30 rounded-md">
                          <p className="text-sm text-muted-foreground">No elements defined. Click &quot;Add Element&quot; to break down this claim.</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {claimElements[mapping.id].map((element, eIdx) => {
                            const badge = getMeetsLimitationBadge(element.meets_limitation);
                            return (
                              <div
                                key={element.id || `element-${eIdx}`}
                                className={`p-3 bg-background rounded-lg border border-l-4 ${
                                  element.meets_limitation === true
                                    ? 'border-l-green-500'
                                    : element.meets_limitation === false
                                    ? 'border-l-red-500'
                                    : 'border-l-amber-400'
                                }`}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">#{element.element_order}</span>
                                      <Badge className={getElementTypeBadge(element.element_type)}>{element.element_type}</Badge>
                                      <Badge className={badge.className}>{badge.label}</Badge>
                                      {element.doe_score != null && (
                                        <Badge variant="outline" className="text-xs">DoE: {element.doe_score}%</Badge>
                                      )}
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-3">
                                      <div>
                                        <p className="text-xs font-medium text-muted-foreground mb-1">Element Text:</p>
                                        <p className="text-sm"><HighlightedText text={element.element_text} termColors={termColors} /></p>
                                      </div>
                                      {element.accused_feature && (
                                        <div>
                                          <p className="text-xs font-medium text-muted-foreground mb-1">Accused Feature:</p>
                                          <p className="text-sm font-medium">{element.accused_feature}</p>
                                          {element.accused_feature_description && (
                                            <p className="text-xs text-muted-foreground mt-1">{element.accused_feature_description}</p>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                    {element.linked_evidence && element.linked_evidence.length > 0 && (
                                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                        <span className="text-xs font-medium text-muted-foreground">Citations:</span>
                                        {element.linked_evidence.map((ev) =>
                                          ev.url ? (
                                            <a
                                              key={ev.id}
                                              href={ev.url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded border bg-blue-50 text-blue-700 hover:bg-blue-100"
                                              title={ev.evidence_type}
                                            >
                                              <ExternalLink className="h-3 w-3" />{ev.title}
                                            </a>
                                          ) : (
                                            <Badge key={ev.id} variant="outline" className="text-xs" title={ev.evidence_type}>
                                              {ev.title}
                                            </Badge>
                                          )
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1 ml-2">
                                    <Button variant="ghost" size="sm" onClick={() => { setLinkEvidenceElement(element); setLinkEvidenceOpen(true); }} title="Link evidence">
                                      <Link2 className="h-3 w-3" />
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => { setSelectedElement(element); setDoeDialogOpen(true); }} title="Analyze DoE">
                                      <Zap className="h-3 w-3" />
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => handleDeleteElement(element.id, mapping.id)} title="Delete">
                                      <Trash2 className="h-3 w-3 text-destructive" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Add */}
      {!quickAddMode && claimMappings.length > 0 && (
        <Button variant="outline" size="sm" onClick={() => setQuickAddMode(true)}>
          <Plus className="h-4 w-4 mr-2" />Quick Add Row
        </Button>
      )}
      {quickAddMode && (
        <div className="p-4 border rounded-lg bg-blue-50">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-sm">Quick Add Claim Mapping</h4>
            <Button variant="ghost" size="sm" onClick={() => setQuickAddMode(false)}>Cancel</Button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input placeholder="Claim #" value={quickClaimNumber} onChange={(e) => setQuickClaimNumber(e.target.value)} />
            <Input placeholder="Claim text..." value={quickClaimText} onChange={(e) => setQuickClaimText(e.target.value)} />
            <Input placeholder="Product feature..." value={quickProductFeature} onChange={(e) => setQuickProductFeature(e.target.value)} />
          </div>
          <div className="mt-3 flex justify-end">
            <Button size="sm" onClick={handleQuickAdd}>
              <Save className="h-4 w-4 mr-2" />Save Mapping
            </Button>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <ClaimMappingDialog
        open={mappingDialogOpen}
        onOpenChange={setMappingDialogOpen}
        caseId={caseId}
        caseName={caseName}
        editMapping={editMapping}
        onSaved={refresh}
      />
      <ElementDialog
        open={elementDialogOpen}
        onOpenChange={setElementDialogOpen}
        mappingId={selectedMappingForElement}
        nextOrder={(claimElements[selectedMappingForElement]?.length || 0) + 1}
        onSaved={() => refreshElements(selectedMappingForElement)}
      />
      <DoeAnalysisDialog
        open={doeDialogOpen}
        onOpenChange={setDoeDialogOpen}
        element={selectedElement}
        onSaved={() => {
          if (selectedElement) refreshElements(selectedElement.claim_mapping);
        }}
      />
      <LinkEvidenceDialog
        open={linkEvidenceOpen}
        onOpenChange={setLinkEvidenceOpen}
        caseId={caseId}
        element={linkEvidenceElement}
        onSaved={() => {
          if (linkEvidenceElement) refreshElements(linkEvidenceElement.claim_mapping);
        }}
      />
    </div>
  );
}
