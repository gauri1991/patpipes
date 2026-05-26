'use client';

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Search, ChevronDown, ChevronUp, ArrowUpDown, Filter, X, Trash2 } from 'lucide-react';
import type { FCCAuthorization, ResultFilters } from '../types/fccData.types';
import { FCCStatusBadge } from './FCCStatusBadge';

/**
 * Hidden form that auto-submits a POST request to the FCC GenericSearchResult page,
 * targeting the iframe. This bypasses the need to start from GenericSearch.cfm.
 */
const FCCAutoSearchForm: React.FC<{ fccId: string }> = ({ fccId }) => {
  const formRef = useRef<HTMLFormElement>(null);
  const submitted = useRef(false);

  // Split FCC ID into grantee code and product code
  const parts = fccId.split('-');
  const granteeCode = parts[0] || '';
  const productCode = parts.slice(1).join('-') || '';

  useEffect(() => {
    if (formRef.current && !submitted.current) {
      submitted.current = true;
      formRef.current.submit();
    }
  }, [fccId]);

  return (
    <form
      ref={formRef}
      method="POST"
      action="https://apps.fcc.gov/oetcf/eas/reports/GenericSearchResult.cfm"
      target={`fcc-frame-${fccId}`}
      style={{ display: 'none' }}
    >
      <input type="hidden" name="GenericSearchAction" value="Search" />
      <input type="hidden" name="grantee_code" value={granteeCode} />
      <input type="hidden" name="product_code" value={productCode} />
      <input type="hidden" name="product_code_exact_match" value="on" />
      <input type="hidden" name="applicant_name" value="" />
      <input type="hidden" name="grant_date_from" value="" />
      <input type="hidden" name="grant_date_to" value="" />
      <input type="hidden" name="grant_comments" value="" />
      <input type="hidden" name="application_purpose" value="" />
      <input type="hidden" name="sdr" value="" />
      <input type="hidden" name="fcc_approved_only" value="" />
      <input type="hidden" name="tcb_approved_only" value="" />
      <input type="hidden" name="composite_only" value="" />
      <input type="hidden" name="grant_note_1" value="" />
      <input type="hidden" name="grant_note_2" value="" />
      <input type="hidden" name="grant_note_3" value="" />
      <input type="hidden" name="test_firm" value="" />
      <input type="hidden" name="application_status" value="" />
      <input type="hidden" name="equipment_class" value="" />
      <input type="hidden" name="freq_from" value="" />
      <input type="hidden" name="freq_to" value="" />
      <input type="hidden" name="freq_exact_match" value="" />
      <input type="hidden" name="bandwidth" value="" />
      <input type="hidden" name="emission_designator" value="" />
      <input type="hidden" name="freq_tolerance_from" value="" />
      <input type="hidden" name="freq_tolerance_to" value="" />
      <input type="hidden" name="freq_tolerance_exact_match" value="" />
      <input type="hidden" name="power_from" value="" />
      <input type="hidden" name="power_to" value="" />
      <input type="hidden" name="power_exact_match" value="" />
      <input type="hidden" name="rule_part_1" value="" />
      <input type="hidden" name="rule_part_2" value="" />
      <input type="hidden" name="rule_part_3" value="" />
      <input type="hidden" name="rule_part_exact_match" value="" />
      <input type="hidden" name="product_description" value="" />
      <input type="hidden" name="modular_type" value="" />
      <input type="hidden" name="tcb_name" value="" />
      <input type="hidden" name="tcb_scope" value="" />
      <input type="hidden" name="RequestTimeout" value="500" />
    </form>
  );
};

interface ResultsTableProps {
  results: FCCAuthorization[];
  resultsTotal: number;
  isLoading: boolean;
  onFetchResults: (filters: ResultFilters) => void;
  onRemoveResults?: (data: { result_ids?: string[]; fcc_ids?: string[] }) => void;
  jobId: string;
}

export const ResultsTable: React.FC<ResultsTableProps> = ({
  results, resultsTotal, isLoading, onFetchResults, onRemoveResults, jobId,
}) => {
  const [search, setSearch] = useState('');
  const [ordering, setOrdering] = useState('-created_at');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Advanced filters
  const [equipmentClass, setEquipmentClass] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [applicationPurpose, setApplicationPurpose] = useState('');
  const [freqMinGte, setFreqMinGte] = useState('');
  const [freqMaxLte, setFreqMaxLte] = useState('');
  const [powerMin, setPowerMin] = useState('');
  const [powerMax, setPowerMax] = useState('');
  const [descriptionFilter, setDescriptionFilter] = useState('');
  const [emissionDesignator, setEmissionDesignator] = useState('');

  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const offsetRef = useRef(0);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (equipmentClass) count++;
    if (statusFilter) count++;
    if (applicationPurpose) count++;
    if (freqMinGte || freqMaxLte) count++;
    if (powerMin || powerMax) count++;
    if (descriptionFilter) count++;
    if (emissionDesignator) count++;
    return count;
  }, [equipmentClass, statusFilter, applicationPurpose, freqMinGte, freqMaxLte, powerMin, powerMax, descriptionFilter, emissionDesignator]);

  const buildFilters = useCallback((): ResultFilters => {
    const filters: ResultFilters = { ordering, limit: 50, offset: offsetRef.current };
    if (search) (filters as any).q = search;
    if (equipmentClass) filters.equipment_class = equipmentClass;
    if (statusFilter) filters.status = statusFilter;
    if (applicationPurpose) filters.application_purpose = applicationPurpose;
    if (freqMinGte) filters.freq_min_gte = freqMinGte;
    if (freqMaxLte) filters.freq_max_lte = freqMaxLte;
    if (powerMin) filters.power_min = powerMin;
    if (powerMax) filters.power_max = powerMax;
    if (descriptionFilter) filters.description = descriptionFilter;
    if (emissionDesignator) filters.emission_designator = emissionDesignator;
    return filters;
  }, [search, ordering, equipmentClass, statusFilter, applicationPurpose, freqMinGte, freqMaxLte, powerMin, powerMax, descriptionFilter, emissionDesignator]);

  // Stable ref for the fetch callback
  const onFetchRef = useRef(onFetchResults);
  onFetchRef.current = onFetchResults;

  // Debounced fetch on filter change — resets to page 1
  useEffect(() => {
    offsetRef.current = 0;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const filters: ResultFilters = { ordering, limit: 50, offset: 0 };
      if (search) (filters as any).q = search;
      if (equipmentClass) filters.equipment_class = equipmentClass;
      if (statusFilter) filters.status = statusFilter;
      if (applicationPurpose) filters.application_purpose = applicationPurpose;
      if (freqMinGte) filters.freq_min_gte = freqMinGte;
      if (freqMaxLte) filters.freq_max_lte = freqMaxLte;
      if (powerMin) filters.power_min = powerMin;
      if (powerMax) filters.power_max = powerMax;
      if (descriptionFilter) filters.description = descriptionFilter;
      if (emissionDesignator) filters.emission_designator = emissionDesignator;
      onFetchRef.current(filters);
    }, 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, ordering, equipmentClass, statusFilter, applicationPurpose, freqMinGte, freqMaxLte, powerMin, powerMax, descriptionFilter, emissionDesignator, jobId]);

  const toggleSort = (field: string) => {
    setOrdering(prev => prev === `-${field}` ? field : `-${field}`);
  };

  const loadMore = () => {
    offsetRef.current += 50;
    onFetchRef.current(buildFilters());
  };

  const clearAllFilters = () => {
    setEquipmentClass('');
    setStatusFilter('');
    setApplicationPurpose('');
    setFreqMinGte('');
    setFreqMaxLte('');
    setPowerMin('');
    setPowerMax('');
    setDescriptionFilter('');
    setEmissionDesignator('');
  };

  return (
    <div className="space-y-3">
      {/* Search + Filter toggle */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <Input
            className="pl-9"
            placeholder="Search by FCC ID, grantee, or description..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label="Search results"
          />
        </div>
        <Button
          variant={showFilters ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4 mr-1.5" />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-1.5 bg-white/20 text-xs rounded-full px-1.5 py-0.5">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </div>

      {/* Advanced filter panel */}
      {showFilters && (
        <div className="border rounded-lg p-4 bg-neutral-50 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-neutral-700">Advanced Filters</h4>
            {activeFilterCount > 0 && (
              <button onClick={clearAllFilters} className="text-xs text-neutral-500 hover:text-neutral-700 flex items-center gap-1">
                <X className="h-3 w-3" /> Clear all
              </button>
            )}
          </div>

          {/* Row 1: Equipment Class, Status, Application Purpose */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Equipment Class</Label>
              <Input
                placeholder="e.g., CBD, WGF"
                value={equipmentClass}
                onChange={e => setEquipmentClass(e.target.value)}
                className="h-8 text-sm"
                aria-label="Filter by equipment class"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Status</Label>
              <div className="flex gap-1.5">
                {['GI', 'IP', 'IM'].map(st => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(statusFilter === st ? '' : st)}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      statusFilter === st
                        ? 'bg-neutral-900 text-white'
                        : 'bg-white border text-neutral-600 hover:border-neutral-300'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Application Purpose</Label>
              <Input
                placeholder="e.g., Original Equipment"
                value={applicationPurpose}
                onChange={e => setApplicationPurpose(e.target.value)}
                className="h-8 text-sm"
                aria-label="Filter by application purpose"
              />
            </div>
          </div>

          {/* Row 2: Frequency Range, Power Output */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Frequency Range (MHz)</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={freqMinGte}
                  onChange={e => setFreqMinGte(e.target.value)}
                  className="h-8 text-sm"
                  aria-label="Minimum frequency"
                />
                <span className="text-xs text-neutral-400">to</span>
                <Input
                  type="number"
                  placeholder="Max"
                  value={freqMaxLte}
                  onChange={e => setFreqMaxLte(e.target.value)}
                  className="h-8 text-sm"
                  aria-label="Maximum frequency"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Power Output (Watts)</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={powerMin}
                  onChange={e => setPowerMin(e.target.value)}
                  className="h-8 text-sm"
                  aria-label="Minimum power"
                />
                <span className="text-xs text-neutral-400">to</span>
                <Input
                  type="number"
                  placeholder="Max"
                  value={powerMax}
                  onChange={e => setPowerMax(e.target.value)}
                  className="h-8 text-sm"
                  aria-label="Maximum power"
                />
              </div>
            </div>
          </div>

          {/* Row 3: Description, Emission Designator */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Description</Label>
              <Input
                placeholder="Keyword search..."
                value={descriptionFilter}
                onChange={e => setDescriptionFilter(e.target.value)}
                className="h-8 text-sm"
                aria-label="Filter by description"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Emission Designator</Label>
              <Input
                placeholder="e.g., 15M0F9W"
                value={emissionDesignator}
                onChange={e => setEmissionDesignator(e.target.value)}
                className="h-8 text-sm"
                aria-label="Filter by emission designator"
              />
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer" onClick={() => toggleSort('fcc_id')}>
                <span className="flex items-center gap-1">FCC ID <ArrowUpDown className="h-3 w-3" /></span>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => toggleSort('grantee_name')}>
                <span className="flex items-center gap-1">Grantee <ArrowUpDown className="h-3 w-3" /></span>
              </TableHead>
              <TableHead className="w-20">Class</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-16">Status</TableHead>
              <TableHead className="w-28">Grant Date</TableHead>
              <TableHead className="w-28">Freq Range</TableHead>
              <TableHead className="w-20">Power (W)</TableHead>
              {onRemoveResults && <TableHead className="w-10"></TableHead>}
              <TableHead className="w-8"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && results.length === 0 ? (
              <TableRow>
                <TableCell colSpan={onRemoveResults ? 10 : 9} className="text-center py-8 text-neutral-400">Loading...</TableCell>
              </TableRow>
            ) : results.length === 0 ? (
              <TableRow>
                <TableCell colSpan={onRemoveResults ? 10 : 9} className="text-center py-8 text-neutral-400">No results found</TableCell>
              </TableRow>
            ) : results.map(auth => (
              <React.Fragment key={auth.id}>
                <TableRow className="group">
                  <TableCell className="font-mono text-xs">
                    {auth.fcc_id}
                  </TableCell>
                  <TableCell className="text-sm max-w-[200px] truncate">{auth.grantee_name}</TableCell>
                  <TableCell className="text-xs font-mono">{auth.equipment_class}</TableCell>
                  <TableCell className="text-xs text-neutral-500 max-w-[200px] truncate">
                    {auth.description}
                  </TableCell>
                  <TableCell>{auth.status && <FCCStatusBadge status={auth.status} />}</TableCell>
                  <TableCell className="text-xs">{auth.grant_date}</TableCell>
                  <TableCell className="text-xs text-neutral-500">
                    {auth.freq_min && auth.freq_max
                      ? `${Number(auth.freq_min).toFixed(0)}-${Number(auth.freq_max).toFixed(0)}`
                      : '-'}
                  </TableCell>
                  <TableCell className="text-xs">{auth.power_output ? Number(auth.power_output).toFixed(2) : '-'}</TableCell>
                  {onRemoveResults && (
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-neutral-400 hover:text-red-500"
                        onClick={() => onRemoveResults({ result_ids: [auth.id] })}
                        aria-label={`Remove ${auth.fcc_id}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  )}
                  <TableCell>
                    {(auth.grant_notes?.length > 0 || auth.description) && (
                      <button
                        onClick={() => setExpandedId(expandedId === auth.id ? null : auth.id)}
                        className="text-neutral-400 hover:text-neutral-600"
                        aria-label="Toggle details"
                      >
                        {expandedId === auth.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                    )}
                  </TableCell>
                </TableRow>

                {expandedId === auth.id && (
                  <TableRow>
                    <TableCell colSpan={onRemoveResults ? 10 : 9} className="bg-neutral-50 p-4">
                      <div className="space-y-2 text-xs">
                        {auth.description && (
                          <div>
                            <span className="font-medium text-neutral-700">Description: </span>
                            <span className="text-neutral-600">{auth.description}</span>
                          </div>
                        )}
                        {auth.application_purpose && (
                          <div>
                            <span className="font-medium text-neutral-700">Application: </span>
                            <span className="text-neutral-600">{auth.application_purpose}</span>
                          </div>
                        )}
                        {auth.emission_designator && (
                          <div>
                            <span className="font-medium text-neutral-700">Emission: </span>
                            <span className="text-neutral-600 font-mono">{auth.emission_designator}</span>
                          </div>
                        )}
                        {auth.address && (
                          <div>
                            <span className="font-medium text-neutral-700">Address: </span>
                            <span className="text-neutral-600">
                              {[auth.address, auth.city, auth.state, auth.zip_code, auth.country].filter(Boolean).join(', ')}
                            </span>
                          </div>
                        )}
                        {auth.grant_notes?.length > 0 && (
                          <div>
                            <span className="font-medium text-neutral-700">Grant Notes:</span>
                            <ul className="mt-1 space-y-1 ml-4 list-disc">
                              {auth.grant_notes.map((note, i) => (
                                <li key={i} className="text-neutral-600">
                                  <span className="font-mono text-neutral-400">[{note.grantNoteId}]</span>{' '}
                                  {note.grantNote}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Results count + Load more */}
      <div className="flex items-center justify-between text-xs text-neutral-500">
        <span>{resultsTotal} result{resultsTotal !== 1 ? 's' : ''}</span>
        {results.length < resultsTotal && (
          <button onClick={loadMore} className="text-sm text-cyan-600 hover:text-cyan-700 font-medium">
            Load more ({results.length} of {resultsTotal})
          </button>
        )}
      </div>

    </div>
  );
};
