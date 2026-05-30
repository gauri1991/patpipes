import React from 'react';
import { Check, Globe, Sparkles, Edit2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { DataTableColumnHeader, createColumns } from '@/components/ui/data-table';
import type { BundleAttributes } from '@/services/analyticsApi';

function sourceColor(src: string) {
  if (src === 'ai') return 'bg-purple-100 text-purple-700';
  if (src === 'manual') return 'bg-blue-100 text-blue-700';
  if (src === 'mixed') return 'bg-cyan-100 text-cyan-700';
  if (src === 'derived') return 'bg-neutral-100 text-neutral-600';
  return 'bg-neutral-50 text-neutral-400';
}

interface ColumnHandlers {
  onEnrich: (id: string) => void;
  onClassifyA: (id: string) => void;
  onScoreHI: (id: string) => void;
  onEdit: (attr: BundleAttributes) => void;
}

export function createBundleAttributeColumns(handlers: ColumnHandlers) {
  const { column } = createColumns<BundleAttributes>();

  return [
    // ── Select ────────────────────────────────────────────────────────────────
    column({
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() ? 'indeterminate' : false)
          }
          onCheckedChange={v => table.toggleAllPageRowsSelected(!!v)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={v => row.toggleSelected(!!v)}
          aria-label="Select row"
          onClick={e => e.stopPropagation()}
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 40,
    }),

    // ── Patent ────────────────────────────────────────────────────────────────
    column({
      accessorKey: 'title',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Patent" />,
      cell: ({ row }) => (
        <div>
          <div className="font-medium text-neutral-800 truncate max-w-xs">
            {row.original.title || '—'}
          </div>
          <div className="text-neutral-400 font-mono text-xs">{row.original.patent_id}</div>
        </div>
      ),
      enableHiding: false,
    }),

    // ── Domain (A1) ───────────────────────────────────────────────────────────
    column({
      accessorKey: 'a1_primary_domain',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Domain (A1)" />,
      cell: ({ getValue }) => <span className="text-neutral-600">{(getValue() as string) || '—'}</span>,
      meta: { group: 'Group A' },
    }),

    // ── Term (E4) ─────────────────────────────────────────────────────────────
    column({
      accessorKey: 'e4_remaining_term_years',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Term (E4)" />,
      cell: ({ getValue }) => {
        const v = getValue() as number | null;
        return <span className="text-neutral-600">{v != null ? `${v}y` : '—'}</span>;
      },
      meta: { group: 'Group E', filterType: 'number-range' },
    }),

    // ── Strength (H1) ─────────────────────────────────────────────────────────
    column({
      accessorKey: 'h1_claim_strength',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Strength (H1)" />,
      cell: ({ getValue }) => {
        const v = getValue() as number | null;
        if (v == null) return <span className="text-neutral-300">—</span>;
        return (
          <span
            className={`font-semibold ${v >= 2 ? 'text-green-600' : v === 1 ? 'text-amber-600' : 'text-red-500'}`}
          >
            {v}/3
          </span>
        );
      },
      meta: { group: 'Group H', filterType: 'number-range' },
    }),

    // ── Filled % ─────────────────────────────────────────────────────────────
    column({
      id: 'filled_pct',
      header: 'Filled %',
      accessorFn: (row) => row.last_ai_extraction ? 75 : 15,
      cell: ({ getValue }) => {
        const pct = getValue() as number;
        return (
          <div className="flex items-center gap-1.5">
            <Progress value={pct} className="h-1.5 w-16" />
            <span className="text-neutral-400">~{pct}%</span>
          </div>
        );
      },
      enableSorting: true,
    }),

    // ── Source ────────────────────────────────────────────────────────────────
    column({
      id: 'source',
      header: 'Source',
      accessorFn: (row) =>
        row.ai_extracted_fields?.length ? 'ai' : row.manually_set_fields?.length ? 'manual' : 'derived',
      cell: ({ getValue }) => {
        const src = getValue() as string;
        const label = src === 'ai' ? 'AI' : src === 'manual' ? 'Manual' : 'Derived';
        return (
          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${sourceColor(src)}`}>
            {label}
          </span>
        );
      },
      meta: {
        filterType: 'select',
        filterOptions: [
          { label: 'AI', value: 'ai' },
          { label: 'Manual', value: 'manual' },
          { label: 'Derived', value: 'derived' },
        ],
      },
    }),

    // ── Status (from PatentRecord.legal_status) ───────────────────────────────
    column({
      id: 'record_legal_status',
      accessorKey: 'record_legal_status',
      header: 'Status',
      cell: ({ getValue }) => {
        const v = (getValue() as string) || '';
        if (!v) return <span className="text-neutral-300">—</span>;
        const color =
          v === 'granted' ? 'bg-green-100 text-green-700' :
          v === 'pending' ? 'bg-amber-100 text-amber-700' :
          v === 'expired' ? 'bg-neutral-100 text-neutral-500' :
          v === 'abandoned' ? 'bg-red-100 text-red-600' :
          'bg-neutral-100 text-neutral-500';
        return (
          <span className={`text-xs px-1.5 py-0.5 rounded font-medium capitalize ${color}`}>
            {v}
          </span>
        );
      },
      meta: {
        filterType: 'select',
        filterOptions: [
          { label: 'Granted', value: 'granted' },
          { label: 'Pending', value: 'pending' },
          { label: 'Expired', value: 'expired' },
          { label: 'Abandoned', value: 'abandoned' },
        ],
      },
    }),

    // ── Hidden-by-default: Group A extras ────────────────────────────────────
    column({
      accessorKey: 'a2_tech_subcategory',
      header: 'Tech Subcategory (A2)',
      cell: ({ getValue }) => <span className="text-neutral-600">{(getValue() as string) || '—'}</span>,
      meta: { group: 'Group A' },
    }),
    column({
      accessorKey: 'a3_stack_layer',
      header: 'Stack Layer (A3)',
      cell: ({ getValue }) => <span className="text-neutral-600">{(getValue() as string) || '—'}</span>,
      meta: { group: 'Group A' },
    }),
    column({
      accessorKey: 'a5_use_case',
      header: 'Use Case (A5)',
      cell: ({ getValue }) => <span className="text-neutral-600">{(getValue() as string) || '—'}</span>,
      meta: { group: 'Group A' },
    }),

    // ── Hidden-by-default: Group B ────────────────────────────────────────────
    column({
      accessorKey: 'b1_sep_potential',
      header: 'SEP Potential (B1)',
      cell: ({ getValue }) => <span className="text-neutral-600">{(getValue() as number) ?? '—'}</span>,
      meta: { group: 'Group B', filterType: 'number-range' },
    }),
    column({
      accessorKey: 'b2_standard_tagged',
      header: 'Standard Tagged (B2)',
      cell: ({ getValue }) => <span className="text-neutral-600">{(getValue() as string) || '—'}</span>,
      meta: { group: 'Group B' },
    }),

    // ── Hidden-by-default: Group C ────────────────────────────────────────────
    column({
      accessorKey: 'c1_claim_type',
      header: 'Claim Type (C1)',
      cell: ({ getValue }) => <span className="text-neutral-600">{(getValue() as string) || '—'}</span>,
      meta: { group: 'Group C' },
    }),
    column({
      accessorKey: 'c2_breadth',
      header: 'Breadth (C2)',
      cell: ({ getValue }) => <span className="text-neutral-600">{(getValue() as number) ?? '—'}</span>,
      meta: { group: 'Group C', filterType: 'number-range' },
    }),

    // ── Hidden-by-default: Group D ────────────────────────────────────────────
    column({
      accessorKey: 'd1_external_detectability',
      header: 'Detectability (D1)',
      cell: ({ getValue }) => <span className="text-neutral-600">{(getValue() as number) ?? '—'}</span>,
      meta: { group: 'Group D', filterType: 'number-range' },
    }),

    // ── Hidden-by-default: Group E extras ────────────────────────────────────
    column({
      accessorKey: 'e1_family_size',
      header: 'Family Size (E1)',
      cell: ({ getValue }) => <span className="text-neutral-600">{(getValue() as number) ?? '—'}</span>,
      meta: { group: 'Group E', filterType: 'number-range' },
    }),
    column({
      accessorKey: 'e2_prosecution_status',
      header: 'Prosecution (E2)',
      cell: ({ getValue }) => <span className="text-neutral-600">{(getValue() as string) || '—'}</span>,
      meta: { group: 'Group E' },
    }),

    // ── Hidden-by-default: Group H extras ────────────────────────────────────
    column({
      accessorKey: 'h2_prior_art_exposure',
      header: 'Prior Art Risk (H2)',
      cell: ({ getValue }) => <span className="text-neutral-600">{(getValue() as number) ?? '—'}</span>,
      meta: { group: 'Group H', filterType: 'number-range' },
    }),
    column({
      accessorKey: 'h5_forward_citations',
      header: 'Forward Citations (H5)',
      cell: ({ getValue }) => <span className="text-neutral-600">{(getValue() as number) ?? '—'}</span>,
      meta: { group: 'Group H', filterType: 'number-range' },
    }),
    column({
      accessorKey: 'h7_litigation_history',
      header: 'Litigation (H7)',
      cell: ({ getValue }) => <span className="text-neutral-600">{(getValue() as string) || '—'}</span>,
      meta: { group: 'Group H' },
    }),

    // ── Actions ───────────────────────────────────────────────────────────────
    column({
      id: 'actions',
      header: '',
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => {
        const attr = row.original;
        return (
          <div
            className="flex items-center justify-end gap-1"
            onClick={e => e.stopPropagation()}
          >
            {attr.enriched ? (
              <span title="Enriched from USPTO ODP" className="inline-flex items-center text-green-600 px-1">
                <Check className="w-3.5 h-3.5" />
              </span>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                title="Enrich from USPTO ODP"
                onClick={() => handlers.onEnrich(attr.patent_record_id)}
              >
                <Globe className="w-3 h-3 mr-1" />Enrich
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              title="Classify technology domain (Group A)"
              onClick={() => handlers.onClassifyA(attr.patent_record_id)}
            >
              <Sparkles className="w-3 h-3 mr-1" />A
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-50"
              title="Score quality attributes (Groups H & I)"
              onClick={() => handlers.onScoreHI(attr.patent_record_id)}
            >
              <Sparkles className="w-3 h-3 mr-1" />H&I
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => handlers.onEdit(attr)}
            >
              <Edit2 className="w-3 h-3" />
            </Button>
          </div>
        );
      },
    }),
  ];
}
