'use client';

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Trash2, Filter, X, ChevronDown } from 'lucide-react';
import { DataTable, createColumns } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table';
import type { FCCAuthorization, ResultFilters } from '../types/fccData.types';
import { FCCStatusBadge } from './FCCStatusBadge';

/**
 * Hidden form that auto-submits a POST request to the FCC GenericSearchResult page.
 */
const FCCAutoSearchForm: React.FC<{ fccId: string }> = ({ fccId }) => {
  const formRef = useRef<HTMLFormElement>(null);
  const submitted = useRef(false);
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
    <form ref={formRef} method="POST" action="https://apps.fcc.gov/oetcf/eas/reports/GenericSearchResult.cfm" target={`fcc-frame-${fccId}`} style={{ display: 'none' }}>
      <input type="hidden" name="GenericSearchAction" value="Search" />
      <input type="hidden" name="grantee_code" value={granteeCode} />
      <input type="hidden" name="product_code" value={productCode} />
      <input type="hidden" name="product_code_exact_match" value="on" />
      {['applicant_name','grant_date_from','grant_date_to','grant_comments','application_purpose','sdr','fcc_approved_only','tcb_approved_only','composite_only','grant_note_1','grant_note_2','grant_note_3','test_firm','application_status','equipment_class','freq_from','freq_to','freq_exact_match','bandwidth','emission_designator','freq_tolerance_from','freq_tolerance_to','freq_tolerance_exact_match','power_from','power_to','power_exact_match','rule_part_1','rule_part_2','rule_part_3','rule_part_exact_match','product_description','modular_type','tcb_name','tcb_scope'].map(n => (
        <input key={n} type="hidden" name={n} value="" />
      ))}
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

const { column } = createColumns<FCCAuthorization>();

function buildColumns(onRemove?: (id: string) => void) {
  return [
    column({
      accessorKey: 'fcc_id',
      header: ({ column }) => <DataTableColumnHeader column={column} title="FCC ID" />,
      cell: ({ getValue }) => <span className="font-mono text-xs">{getValue() as string}</span>,
    }),
    column({
      accessorKey: 'grantee_name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Grantee" />,
      cell: ({ getValue }) => <span className="text-sm max-w-[200px] truncate block">{getValue() as string}</span>,
    }),
    column({
      accessorKey: 'equipment_class',
      header: 'Class',
      cell: ({ getValue }) => <span className="text-xs font-mono">{getValue() as string}</span>,
    }),
    column({
      accessorKey: 'description',
      header: 'Description',
      cell: ({ getValue }) => <span className="text-xs text-neutral-500 max-w-[200px] truncate block">{getValue() as string}</span>,
    }),
    column({
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }) => {
        const s = getValue() as string;
        return s ? <FCCStatusBadge status={s} /> : null;
      },
      meta: {
        filterType: 'select' as const,
        filterOptions: [
          { label: 'GI', value: 'GI' },
          { label: 'IP', value: 'IP' },
          { label: 'IM', value: 'IM' },
        ],
      },
    }),
    column({
      accessorKey: 'grant_date',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Grant Date" />,
      cell: ({ getValue }) => <span className="text-xs">{getValue() as string}</span>,
    }),
    column({
      id: 'freq_range',
      header: 'Freq Range',
      accessorFn: row =>
        row.freq_min && row.freq_max
          ? `${Number(row.freq_min).toFixed(0)}-${Number(row.freq_max).toFixed(0)}`
          : '',
      cell: ({ getValue }) => <span className="text-xs text-neutral-500">{(getValue() as string) || '—'}</span>,
    }),
    column({
      accessorKey: 'power_output',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Power (W)" />,
      cell: ({ getValue }) => {
        const v = getValue() as string | null;
        return <span className="text-xs">{v ? Number(v).toFixed(2) : '—'}</span>;
      },
    }),
    ...(onRemove ? [column({
      id: 'remove',
      header: '',
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-neutral-400 hover:text-red-500"
          onClick={e => { e.stopPropagation(); onRemove(row.original.id); }}
          aria-label={`Remove ${row.original.fcc_id}`}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      ),
    })] : []),
  ];
}

export const ResultsTable: React.FC<ResultsTableProps> = ({
  results, resultsTotal, isLoading, onFetchResults, onRemoveResults, jobId,
}) => {
  const [search, setSearch] = useState('');
  const [ordering, setOrdering] = useState('-created_at');
  const [showFilters, setShowFilters] = useState(false);
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
  const onFetchRef = useRef(onFetchResults);
  onFetchRef.current = onFetchResults;

  const activeFilterCount = useMemo(() => (
    [equipmentClass, statusFilter, applicationPurpose, freqMinGte || freqMaxLte,
      powerMin || powerMax, descriptionFilter, emissionDesignator].filter(Boolean).length
  ), [equipmentClass, statusFilter, applicationPurpose, freqMinGte, freqMaxLte, powerMin, powerMax, descriptionFilter, emissionDesignator]);

  const buildFilters = useCallback((offset = offsetRef.current): ResultFilters => {
    const f: ResultFilters = { ordering, limit: 50, offset };
    if (search) (f as Record<string, unknown>).q = search;
    if (equipmentClass) f.equipment_class = equipmentClass;
    if (statusFilter) f.status = statusFilter;
    if (applicationPurpose) f.application_purpose = applicationPurpose;
    if (freqMinGte) f.freq_min_gte = freqMinGte;
    if (freqMaxLte) f.freq_max_lte = freqMaxLte;
    if (powerMin) f.power_min = powerMin;
    if (powerMax) f.power_max = powerMax;
    if (descriptionFilter) f.description = descriptionFilter;
    if (emissionDesignator) f.emission_designator = emissionDesignator;
    return f;
  }, [search, ordering, equipmentClass, statusFilter, applicationPurpose, freqMinGte, freqMaxLte, powerMin, powerMax, descriptionFilter, emissionDesignator]);

  useEffect(() => {
    offsetRef.current = 0;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onFetchRef.current(buildFilters(0));
    }, 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, ordering, equipmentClass, statusFilter, applicationPurpose, freqMinGte, freqMaxLte, powerMin, powerMax, descriptionFilter, emissionDesignator, jobId]);

  const clearAllFilters = () => {
    setEquipmentClass(''); setStatusFilter(''); setApplicationPurpose('');
    setFreqMinGte(''); setFreqMaxLte(''); setPowerMin(''); setPowerMax('');
    setDescriptionFilter(''); setEmissionDesignator('');
  };

  const loadMore = () => {
    offsetRef.current += 50;
    onFetchRef.current(buildFilters());
  };

  const columns = useMemo(
    () => buildColumns(onRemoveResults ? (id) => onRemoveResults({ result_ids: [id] }) : undefined),
    [onRemoveResults],
  );

  const toolbar = (
    <div className="space-y-3 w-full">
      {/* Search + filter toggle row */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <input
            className="w-full h-8 pl-9 pr-3 text-sm border border-neutral-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
            placeholder="Search by FCC ID, grantee, or description..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label="Search results"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-xs">⌕</span>
        </div>
        <Button
          variant={showFilters || activeFilterCount > 0 ? 'default' : 'outline'}
          size="sm"
          className={showFilters || activeFilterCount > 0 ? 'bg-neutral-900 text-white hover:bg-neutral-800 gap-1' : 'gap-1'}
          onClick={() => setShowFilters(v => !v)}
        >
          <Filter className="h-3 w-3" />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-1 bg-white/20 text-[10px] rounded-full px-1.5 py-0.5">{activeFilterCount}</span>
          )}
        </Button>
      </div>

      {/* Advanced filter panel */}
      {showFilters && (
        <div className="border rounded-lg p-4 bg-neutral-50 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-neutral-700">Advanced Filters</h4>
            <div className="flex items-center gap-2">
              {activeFilterCount > 0 && (
                <button onClick={clearAllFilters} className="text-xs text-neutral-500 hover:text-neutral-700 flex items-center gap-1">
                  <X className="h-3 w-3" /> Clear all
                </button>
              )}
              <button onClick={() => setShowFilters(false)} className="text-neutral-400 hover:text-neutral-600">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Equipment Class</Label>
              <Input placeholder="e.g., CBD, WGF" value={equipmentClass} onChange={e => setEquipmentClass(e.target.value)} className="h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Status</Label>
              <div className="flex gap-1.5">
                {['GI', 'IP', 'IM'].map(st => (
                  <button key={st} onClick={() => setStatusFilter(statusFilter === st ? '' : st)}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${statusFilter === st ? 'bg-neutral-900 text-white' : 'bg-white border text-neutral-600 hover:border-neutral-300'}`}>
                    {st}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Application Purpose</Label>
              <Input placeholder="e.g., Original Equipment" value={applicationPurpose} onChange={e => setApplicationPurpose(e.target.value)} className="h-8 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Frequency Range (MHz)</Label>
              <div className="flex items-center gap-2">
                <Input type="number" placeholder="Min" value={freqMinGte} onChange={e => setFreqMinGte(e.target.value)} className="h-8 text-sm" />
                <span className="text-xs text-neutral-400">to</span>
                <Input type="number" placeholder="Max" value={freqMaxLte} onChange={e => setFreqMaxLte(e.target.value)} className="h-8 text-sm" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Power Output (Watts)</Label>
              <div className="flex items-center gap-2">
                <Input type="number" placeholder="Min" value={powerMin} onChange={e => setPowerMin(e.target.value)} className="h-8 text-sm" />
                <span className="text-xs text-neutral-400">to</span>
                <Input type="number" placeholder="Max" value={powerMax} onChange={e => setPowerMax(e.target.value)} className="h-8 text-sm" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Description</Label>
              <Input placeholder="Keyword search..." value={descriptionFilter} onChange={e => setDescriptionFilter(e.target.value)} className="h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Emission Designator</Label>
              <Input placeholder="e.g., 15M0F9W" value={emissionDesignator} onChange={e => setEmissionDesignator(e.target.value)} className="h-8 text-sm" />
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-3">
      <DataTable
        data={results}
        columns={columns}
        getRowId={row => row.id}
        isLoading={isLoading && results.length === 0}
        features={{
          enableSorting: true,
          enableMultiSort: true,
          enableFiltering: false,     // search handled in toolbarExtra
          enableColumnVisibility: true,
          enableDensityToggle: true,
          enableExport: true,
          enableRowExpansion: true,
        }}
        renderSubRow={row => {
          const auth = row.original;
          return (
            <div className="px-6 py-4 bg-neutral-50 space-y-2 text-xs border-t border-neutral-100">
              {auth.description && <div><span className="font-medium text-neutral-700">Description: </span><span className="text-neutral-600">{auth.description}</span></div>}
              {auth.application_purpose && <div><span className="font-medium text-neutral-700">Application: </span><span className="text-neutral-600">{auth.application_purpose}</span></div>}
              {auth.emission_designator && <div><span className="font-medium text-neutral-700">Emission: </span><span className="text-neutral-600 font-mono">{auth.emission_designator}</span></div>}
              {auth.address && <div><span className="font-medium text-neutral-700">Address: </span><span className="text-neutral-600">{[auth.address, auth.city, auth.state, auth.zip_code, auth.country].filter(Boolean).join(', ')}</span></div>}
              {auth.grant_notes?.length > 0 && (
                <div>
                  <span className="font-medium text-neutral-700">Grant Notes:</span>
                  <ul className="mt-1 space-y-1 ml-4 list-disc">
                    {auth.grant_notes.map((note, i) => (
                      <li key={i} className="text-neutral-600">
                        <span className="font-mono text-neutral-400">[{note.grantNoteId}]</span>{' '}{note.grantNote}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        }}
        toolbarExtra={toolbar}
        exportConfig={{ filename: 'fcc-authorizations' }}
        initialPageSize={50}
        emptyState="No results found"
      />

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
