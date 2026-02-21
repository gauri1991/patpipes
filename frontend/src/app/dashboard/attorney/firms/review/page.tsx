/**
 * Law Firm Name Review Page
 * Review and approve flagged normalized firm names
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Check, ChevronLeft, ChevronRight, SkipForward, CheckCheck, Building2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import attorneyApi, { LawFirm } from '@/services/attorneyApi';

const PAGE_SIZE = 20;

export default function ReviewFirmNames() {
  const [firms, setFirms] = useState<LawFirm[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editedNames, setEditedNames] = useState<Record<string, string>>({});
  const [skippedIds, setSkippedIds] = useState<Set<string>>(new Set());
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [bulkApproving, setBulkApproving] = useState(false);

  const fetchFirms = useCallback(async () => {
    setLoading(true);
    try {
      const response = await attorneyApi.getNeedsReviewFirms({
        limit: PAGE_SIZE,
        offset: currentPage * PAGE_SIZE,
      });
      if (response.success && response.data) {
        const data = response.data as any;
        if (Array.isArray(data)) {
          setFirms(data);
          setTotalCount(data.length);
        } else {
          setFirms(data.results ?? []);
          setTotalCount(data.count ?? 0);
        }
      }
    } catch {
      toast.error('Failed to load firms for review');
    } finally {
      setLoading(false);
      setEditedNames({});
      setSkippedIds(new Set());
    }
  }, [currentPage]);

  useEffect(() => {
    fetchFirms();
  }, [fetchFirms]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const getEditedName = (firm: LawFirm) => {
    if (firm.id in editedNames) return editedNames[firm.id];
    return firm.normalized_name ?? '';
  };

  const handleNameChange = (firmId: string, value: string) => {
    setEditedNames(prev => ({ ...prev, [firmId]: value }));
  };

  const handleApprove = async (firm: LawFirm) => {
    setApprovingId(firm.id);
    try {
      const normalizedName = getEditedName(firm);
      const response = await attorneyApi.updateLawFirm(firm.id, {
        normalized_name: normalizedName,
        normalization_confidence: 'high',
      });
      if (response.success) {
        setFirms(prev => prev.filter(f => f.id !== firm.id));
        setTotalCount(prev => prev - 1);
        toast.success(`Approved: ${normalizedName}`);
      } else {
        toast.error('Failed to approve firm');
      }
    } catch {
      toast.error('Failed to approve firm');
    } finally {
      setApprovingId(null);
    }
  };

  const handleSkip = (firmId: string) => {
    setSkippedIds(prev => new Set(prev).add(firmId));
  };

  const handleBulkApprove = async () => {
    const visibleFirms = firms.filter(f => !skippedIds.has(f.id));
    if (visibleFirms.length === 0) return;

    setBulkApproving(true);
    try {
      const updates = visibleFirms.map(firm => ({
        id: firm.id,
        normalized_name: getEditedName(firm),
      }));
      const response = await attorneyApi.bulkApproveFirms(updates);
      if (response.success) {
        const count = (response.data as any)?.updated ?? updates.length;
        toast.success(`Approved ${count} firm names`);
        // Refresh — if there are more pages, stay on current; otherwise go back
        if (currentPage > 0 && visibleFirms.length >= firms.length) {
          setCurrentPage(prev => Math.max(0, prev - 1));
        }
        fetchFirms();
      } else {
        toast.error('Bulk approve failed');
      }
    } catch {
      toast.error('Bulk approve failed');
    } finally {
      setBulkApproving(false);
    }
  };

  const visibleFirms = firms.filter(f => !skippedIds.has(f.id));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/attorney/firms">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Directory
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">Review Firm Names</h1>
              <Badge variant="secondary">{totalCount} remaining</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Review and approve automatically normalized law firm names
            </p>
          </div>
        </div>

        {visibleFirms.length > 0 && (
          <Button
            onClick={handleBulkApprove}
            disabled={bulkApproving}
          >
            <CheckCheck className="h-4 w-4 mr-2" />
            {bulkApproving ? 'Approving...' : `Approve All on Page (${visibleFirms.length})`}
          </Button>
        )}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading firms for review...</div>
          ) : visibleFirms.length === 0 && firms.length === 0 ? (
            <div className="text-center py-16 space-y-4">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground/40" />
              <div>
                <p className="text-lg font-medium">All firm names have been reviewed</p>
                <p className="text-sm text-muted-foreground mt-1">
                  No more flagged names to review. Great work!
                </p>
              </div>
              <Link href="/dashboard/attorney/firms">
                <Button variant="outline" className="mt-2">
                  Back to Firms Directory
                </Button>
              </Link>
            </div>
          ) : visibleFirms.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <p className="text-muted-foreground">All firms on this page have been skipped.</p>
              <Button variant="outline" onClick={() => setSkippedIds(new Set())}>
                Show Skipped
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[280px]">Original Name</TableHead>
                  <TableHead className="w-[280px]">Normalized Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Attorneys</TableHead>
                  <TableHead className="text-right w-[180px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleFirms.map((firm) => (
                  <TableRow key={firm.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {firm.name}
                    </TableCell>
                    <TableCell>
                      <Input
                        value={getEditedName(firm)}
                        onChange={(e) => handleNameChange(firm.id, e.target.value)}
                        className="h-8 text-sm"
                      />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {[firm.city, firm.country].filter(Boolean).join(', ') || '—'}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {firm.attorney_count ?? 0}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          className="bg-green-600 hover:bg-green-700 h-8"
                          onClick={() => handleApprove(firm)}
                          disabled={approvingId === firm.id}
                          aria-label={`Approve ${firm.name}`}
                        >
                          <Check className="h-3.5 w-3.5 mr-1" />
                          {approvingId === firm.id ? '...' : 'Approve'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8"
                          onClick={() => handleSkip(firm.id)}
                          aria-label={`Skip ${firm.name}`}
                        >
                          <SkipForward className="h-3.5 w-3.5 mr-1" />
                          Skip
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {currentPage * PAGE_SIZE + 1}–{Math.min((currentPage + 1) * PAGE_SIZE, totalCount)} of {totalCount}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 0}
              onClick={() => setCurrentPage(p => p - 1)}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage + 1} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages - 1}
              onClick={() => setCurrentPage(p => p + 1)}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
