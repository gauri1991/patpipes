'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  FileText,
  Download,
  Trash2,
  ExternalLink,
  Search,
  Crop,
  Pencil,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { infringementApi } from '@/services/infringementApi';
import { useEvidence } from '@/hooks/useInfringementData';
import { getEvidenceTypeLabel, formatDate } from '@/domains/infringement/utils';
import { EvidenceUploadDialog } from './EvidenceUploadDialog';
import { SuggestEvidenceDialog } from './SuggestEvidenceDialog';
import { EvidenceEditDialog } from './EvidenceEditDialog';
import { toMediaPath } from '@/domains/infringement/lib/mediaUrl';
import { Evidence } from '@/services/infringementApi';
import { Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface EvidenceTabProps {
  caseId: string;
  caseName: string;
}

export function EvidenceTab({ caseId, caseName }: EvidenceTabProps) {
  const router = useRouter();
  const { evidence, loading, refresh, deleteEvidence } = useEvidence({ case: caseId });
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [suggestDialogOpen, setSuggestDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Evidence | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sort, setSort] = useState('-relevance');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const evidenceTypes = useMemo(
    () => Array.from(new Set(evidence.map((e) => e.evidence_type))),
    [evidence]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = evidence.filter((e) => {
      if (typeFilter !== 'all' && e.evidence_type !== typeFilter) return false;
      if (!q) return true;
      return (
        e.title.toLowerCase().includes(q) ||
        (e.description || '').toLowerCase().includes(q)
      );
    });
    const cmp: Record<string, (a: typeof rows[number], b: typeof rows[number]) => number> = {
      '-relevance': (a, b) => (b.relevance_score ?? 0) - (a.relevance_score ?? 0),
      'relevance': (a, b) => (a.relevance_score ?? 0) - (b.relevance_score ?? 0),
      '-created': (a, b) => (b.created_at || '').localeCompare(a.created_at || ''),
      'created': (a, b) => (a.created_at || '').localeCompare(b.created_at || ''),
      'title': (a, b) => (a.title || '').localeCompare(b.title || ''),
    };
    return [...rows].sort(cmp[sort] || cmp['-relevance']);
  }, [evidence, search, typeFilter, sort]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleDelete = async (evidenceId: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this evidence?');
    if (!confirmed) return;
    await deleteEvidence(evidenceId);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Delete ${selectedIds.size} selected evidence item(s)?`)) return;
    await Promise.allSettled(Array.from(selectedIds).map((id) => infringementApi.deleteEvidence(id)));
    setSelectedIds(new Set());
    refresh();
    toast.success('Evidence deleted');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg">Evidence ({evidence.length})</h3>
          <p className="text-sm text-muted-foreground">
            Supporting evidence for this infringement case
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete ({selectedIds.size})
            </Button>
          )}
          <Button variant="outline" onClick={() => setSuggestDialogOpen(true)}>
            <Sparkles className="h-4 w-4 mr-2" />
            Find from URL
          </Button>
          <Button onClick={() => setUploadDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Upload Evidence
          </Button>
        </div>
      </div>

      {evidence.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search evidence…"
              className="pl-8 h-9"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="all">All types</option>
            {evidenceTypes.map((t) => (
              <option key={t} value={t}>{getEvidenceTypeLabel(t)}</option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            aria-label="Sort evidence"
          >
            <option value="-relevance">Relevance (high→low)</option>
            <option value="relevance">Relevance (low→high)</option>
            <option value="-created">Newest first</option>
            <option value="created">Oldest first</option>
            <option value="title">Title (A→Z)</option>
          </select>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">Loading evidence...</div>
      ) : evidence.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Evidence Yet</h3>
            <p className="text-muted-foreground mb-4">
              Upload documents, screenshots, or links to support your analysis.
            </p>
            <Button onClick={() => setUploadDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Upload First Evidence
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">No evidence matches your filters.</p>
          )}
          {filtered.map((item) => (
            <Card key={item.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <input
                      type="checkbox"
                      className="mt-1 rounded"
                      checked={selectedIds.has(item.id)}
                      onChange={() => toggleSelect(item.id)}
                    />
                    <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{item.title}</span>
                      <Badge variant="outline">
                        {getEvidenceTypeLabel(item.evidence_type)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground ml-6">{item.description}</p>
                    <div className="flex items-center gap-4 ml-6 mt-2">
                      {item.relevance_score > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Relevance:</span>
                          <Progress value={item.relevance_score * 10} className="w-16 h-2" />
                          <span className="text-xs font-medium">{item.relevance_score}/10</span>
                        </div>
                      )}
                      <span className="text-xs text-muted-foreground">
                        Added {formatDate(item.created_at)}
                      </span>
                      {item.related_claims?.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          Claims: {item.related_claims.join(', ')}
                        </span>
                      )}
                    </div>
                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline ml-6 mt-1 inline-flex items-center gap-1"
                      >
                        View Source <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {item.file && item.file.toLowerCase().includes('.pdf') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/dashboard/infringement/${caseId}/evidence/${item.id}/map`)}
                        title="Open the evidence mapper to capture regions"
                      >
                        <Crop className="h-4 w-4 mr-1" />
                        Map
                      </Button>
                    )}
                    {item.file && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={toMediaPath(item.file)} download>
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditing(item)}
                      title="Edit evidence details"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(item.id)}
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

      <EvidenceUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        caseId={caseId}
        caseName={caseName}
        onUploaded={refresh}
      />
      <SuggestEvidenceDialog
        open={suggestDialogOpen}
        onOpenChange={setSuggestDialogOpen}
        caseId={caseId}
        onAdded={refresh}
      />
      <EvidenceEditDialog
        open={!!editing}
        onOpenChange={(o) => { if (!o) setEditing(null); }}
        evidence={editing}
        onSaved={refresh}
      />
    </div>
  );
}
