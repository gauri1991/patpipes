'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Loader2 } from 'lucide-react';
import { fccDataApi } from '@/services/fccDataApi';
import type { CreateQueryRequest, QueryType, FCCGrantee } from '../types/fccData.types';
import { QUERY_TYPE_CONFIG } from '../types/fccData.types';

interface NewQueryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateQueryRequest) => Promise<void>;
}

export const NewQueryDialog: React.FC<NewQueryDialogProps> = ({ open, onOpenChange, onSubmit }) => {
  const [queryType, setQueryType] = useState<QueryType>('fcc_id');
  const [title, setTitle] = useState('');
  const [granteeCode, setGranteeCode] = useState('');
  const [productCode, setProductCode] = useState('');
  const [bulkFccIds, setBulkFccIds] = useState('');
  const [beginDate, setBeginDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [granteeSearchTerm, setGranteeSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Grantee autocomplete
  const [granteeSearch, setGranteeSearch] = useState('');
  const [granteeResults, setGranteeResults] = useState<FCCGrantee[]>([]);
  const [isSearchingGrantees, setIsSearchingGrantees] = useState(false);
  const [showGranteeDropdown, setShowGranteeDropdown] = useState(false);
  const granteeDebounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (!granteeSearch || granteeSearch.length < 2) {
      setGranteeResults([]);
      setShowGranteeDropdown(false);
      return;
    }
    if (granteeDebounceRef.current) clearTimeout(granteeDebounceRef.current);
    granteeDebounceRef.current = setTimeout(async () => {
      setIsSearchingGrantees(true);
      try {
        const response = await fccDataApi.searchGrantees(granteeSearch, 10);
        if (response.success && response.data) {
          setGranteeResults(response.data.results || []);
          setShowGranteeDropdown(true);
        }
      } catch {
        // silent
      } finally {
        setIsSearchingGrantees(false);
      }
    }, 300);
    return () => { if (granteeDebounceRef.current) clearTimeout(granteeDebounceRef.current); };
  }, [granteeSearch]);

  const selectGrantee = useCallback((g: FCCGrantee) => {
    setGranteeCode(g.grantee_code);
    setGranteeSearch('');
    setShowGranteeDropdown(false);
  }, []);

  const combinedFccId = productCode.trim()
    ? `${granteeCode.trim()}-${productCode.trim()}`
    : granteeCode.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const data: CreateQueryRequest = {
        title: title.trim() || (queryType === 'fcc_id'
          ? `FCC: ${combinedFccId || granteeCode}`
          : queryType === 'grantee_search'
          ? `Grantee: ${granteeSearchTerm}`
          : queryType === 'bulk_fcc_id'
          ? `Bulk: ${bulkFccIds.split('\n').filter(l => l.trim().length >= 3).length} IDs`
          : `${QUERY_TYPE_CONFIG[queryType].label} Query`),
        query_type: queryType,
      };

      if (queryType === 'fcc_id') {
        data.fcc_id = granteeCode.trim();
        data.product_code = productCode.trim();
      } else if (queryType === 'grantee_search') {
        data.grantee_search_term = granteeSearchTerm.trim();
      } else if (queryType === 'bulk_fcc_id') {
        const ids = bulkFccIds
          .split('\n')
          .map(id => id.trim())
          .filter(id => id.length >= 3);
        data.bulk_fcc_ids = ids;
      } else {
        data.begin_date = beginDate;
        data.end_date = endDate;
      }

      await onSubmit(data);
      setTitle('');
      setGranteeCode('');
      setProductCode('');
      setGranteeSearchTerm('');
      setBulkFccIds('');
      setBeginDate('');
      setEndDate('');
      onOpenChange(false);
    } catch {
      // Error handled in store
    } finally {
      setIsSubmitting(false);
    }
  };

  const parsedBulkIds = bulkFccIds.split('\n').map(l => l.trim()).filter(l => l.length >= 3);

  const isValid = queryType === 'fcc_id'
    ? granteeCode.trim().length >= 3
    : queryType === 'grantee_search'
    ? granteeSearchTerm.trim().length >= 2
    : queryType === 'bulk_fcc_id'
    ? parsedBulkIds.length > 0
    : beginDate && endDate;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New FCC Query</DialogTitle>
          <DialogDescription>
            Query the FCC Equipment Authorization System for device certifications.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs value={queryType} onValueChange={(v) => setQueryType(v as QueryType)}>
            <TabsList className="w-full">
              <TabsTrigger value="fcc_id" className="flex-1">FCC ID</TabsTrigger>
              <TabsTrigger value="grantee_search" className="flex-1">Grantee</TabsTrigger>
              <TabsTrigger value="bulk_fcc_id" className="flex-1">Bulk</TabsTrigger>
              <TabsTrigger value="whitespace" className="flex-1">Whitespace</TabsTrigger>
              <TabsTrigger value="cbsd" className="flex-1">CBSD</TabsTrigger>
              <TabsTrigger value="afc" className="flex-1">AFC</TabsTrigger>
            </TabsList>

            <TabsContent value="fcc_id" className="space-y-4 mt-3">
              <p className="text-xs text-neutral-500">
                Search by grantee name or code to find all products, or add a product code for a specific device.
              </p>

              {/* Grantee name autocomplete */}
              <div className="space-y-1.5 relative">
                <Label htmlFor="grantee-search">Search Grantee by Name</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                  <Input
                    id="grantee-search"
                    className="pl-9"
                    placeholder="e.g., Apple, Samsung, Cradlepoint..."
                    value={granteeSearch}
                    onChange={e => setGranteeSearch(e.target.value)}
                    onFocus={() => granteeResults.length > 0 && setShowGranteeDropdown(true)}
                    aria-label="Search grantee by company name"
                  />
                  {isSearchingGrantees && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-neutral-400" />
                  )}
                </div>
                {showGranteeDropdown && granteeResults.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {granteeResults.map(g => (
                      <button
                        key={g.grantee_code}
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-neutral-50 border-b border-neutral-100 last:border-0"
                        onClick={() => selectGrantee(g)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-neutral-900 truncate">{g.grantee_name}</span>
                          <span className="text-xs font-mono text-cyan-600 ml-2 shrink-0">{g.grantee_code}</span>
                        </div>
                        <p className="text-xs text-neutral-400 truncate">
                          {[g.city, g.state, g.country].filter(Boolean).join(', ')}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs text-neutral-400">
                <div className="flex-1 border-t" />
                <span>or enter code directly</span>
                <div className="flex-1 border-t" />
              </div>

              {/* Grantee Code + Product Code — split fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="grantee-code">Grantee Code</Label>
                  <Input
                    id="grantee-code"
                    placeholder="e.g., UXX"
                    value={granteeCode}
                    onChange={e => {
                      const val = e.target.value.toUpperCase();
                      // Auto-split if user pastes full FCC ID with dash (e.g., UXX-S5A950A)
                      if (val.includes('-')) {
                        const parts = val.split('-');
                        setGranteeCode(parts[0]);
                        if (parts[1]) setProductCode(parts.slice(1).join(''));
                      } else {
                        setGranteeCode(val);
                      }
                    }}
                    maxLength={5}
                    aria-label="Grantee code (first 3-5 characters of FCC ID)"
                  />
                  <p className="text-xs text-neutral-400">3-5 chars, required</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="product-code">Product Code</Label>
                  <Input
                    id="product-code"
                    placeholder="e.g., S5A950A"
                    value={productCode}
                    onChange={e => setProductCode(e.target.value)}
                    aria-label="Product code (remaining characters of FCC ID)"
                  />
                  <p className="text-xs text-neutral-400">Optional</p>
                </div>
              </div>

              {/* FCC ID preview */}
              {granteeCode.trim().length >= 3 && (
                <div className="bg-neutral-50 rounded-lg px-3 py-2 border">
                  <span className="text-xs text-neutral-500">FCC ID Preview: </span>
                  <span className="text-sm font-mono font-semibold text-neutral-900">
                    {combinedFccId || granteeCode.trim()}
                  </span>
                  {!productCode.trim() && (
                    <span className="text-xs text-neutral-400 ml-2">
                      (all products for this grantee)
                    </span>
                  )}
                </div>
              )}

              <div className="bg-cyan-50 border border-cyan-200 rounded-lg px-3 py-2">
                <p className="text-xs text-cyan-700">
                  <strong>Tip:</strong> Enter only the grantee code (3-5 chars) to retrieve all
                  products for that manufacturer. Add a product code to search for a specific device.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="grantee_search" className="space-y-4 mt-3">
              <p className="text-xs text-neutral-500">
                Search by company/grantee name. Finds all matching grantee codes and queries the FCC API for each one.
              </p>

              <div className="space-y-1.5">
                <Label htmlFor="grantee-term">Company / Grantee Name</Label>
                <Input
                  id="grantee-term"
                  placeholder="e.g., Ericsson, Apple, Samsung..."
                  value={granteeSearchTerm}
                  onChange={e => setGranteeSearchTerm(e.target.value)}
                  aria-label="Grantee name to search"
                />
                <p className="text-xs text-neutral-400">Min 2 characters. Searches across 74K+ registered FCC grantees.</p>
              </div>

              <div className="bg-cyan-50 border border-cyan-200 rounded-lg px-3 py-2">
                <p className="text-xs text-cyan-700">
                  <strong>How it works:</strong> Finds all grantee codes matching your search term in our local database,
                  then queries the FCC API for each code to get all their equipment authorizations.
                  Large companies (e.g., Samsung with 6,700+ products) may take a moment.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="bulk_fcc_id" className="space-y-4 mt-3">
              <p className="text-xs text-neutral-500">
                Paste multiple FCC IDs or grantee codes, one per line. Each will be queried separately and results combined.
              </p>

              <div className="space-y-1.5">
                <Label htmlFor="bulk-ids">FCC IDs (one per line)</Label>
                <textarea
                  id="bulk-ids"
                  className="flex min-h-[160px] w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm font-mono placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                  placeholder={"UXX-S5A950A\nBCG-E3087A\nA3L-SM-G990U\n2ABCB"}
                  value={bulkFccIds}
                  onChange={e => setBulkFccIds(e.target.value)}
                  aria-label="FCC IDs, one per line"
                />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-neutral-400">Min 3 chars each. Partial grantee codes OK.</p>
                  <p className="text-xs text-neutral-500 font-medium">
                    {parsedBulkIds.length} valid ID{parsedBulkIds.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              <div className="bg-cyan-50 border border-cyan-200 rounded-lg px-3 py-2">
                <p className="text-xs text-cyan-700">
                  <strong>Note:</strong> Each FCC ID is queried with a 1-second delay between requests
                  to avoid rate limiting. Large batches may take a moment.
                </p>
              </div>
            </TabsContent>

            {(['whitespace', 'cbsd', 'afc'] as const).map(qt => (
              <TabsContent key={qt} value={qt} className="space-y-3 mt-3">
                <p className="text-xs text-neutral-500">{QUERY_TYPE_CONFIG[qt].description}</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor={`begin-date-${qt}`}>Begin Date</Label>
                    <Input
                      id={`begin-date-${qt}`}
                      type="date"
                      value={beginDate}
                      onChange={e => setBeginDate(e.target.value)}
                      aria-label="Begin date"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`end-date-${qt}`}>End Date</Label>
                    <Input
                      id={`end-date-${qt}`}
                      type="date"
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                      aria-label="End date"
                    />
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>

          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="query-title">Title (optional)</Label>
            <Input
              id="query-title"
              placeholder="Auto-generated"
              value={title}
              onChange={e => setTitle(e.target.value)}
              aria-label="Query title"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!isValid || isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create & Run Query'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
