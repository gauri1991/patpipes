import React from 'react';
import { Building, Calendar, Eye, Edit, Shield, Trash2, FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader, createColumns } from '@/components/ui/data-table';
import type { PatentSummary } from '../types/patent.types';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  filed: 'bg-blue-100 text-blue-800',
  published: 'bg-blue-100 text-blue-800',
  granted: 'bg-green-100 text-green-800',
  expired: 'bg-gray-100 text-gray-800',
  abandoned: 'bg-red-100 text-red-800',
  rejected: 'bg-red-100 text-red-800',
  draft: 'bg-gray-100 text-gray-600',
};

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'granted': return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'pending':
    case 'filed': return <Clock className="h-4 w-4 text-yellow-500" />;
    case 'rejected':
    case 'abandoned': return <AlertCircle className="h-4 w-4 text-red-500" />;
    default: return <FileText className="h-4 w-4 text-gray-500" />;
  }
}

function formatDate(date: string | null) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatAssignees(assignees: string[]) {
  if (!assignees || assignees.length === 0) return '—';
  return assignees[0] + (assignees.length > 1 ? ` +${assignees.length - 1}` : '');
}

interface ColumnHandlers {
  onView: (patent: PatentSummary) => void;
  onAnalyzeInfringement?: (patent: PatentSummary) => void;
}

export function createPatentListColumns(handlers: ColumnHandlers) {
  const { column } = createColumns<PatentSummary>();

  return [
    // ── Select ──────────────────────────────────────────────────────────────
    column({
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() ? 'indeterminate' : false)}
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

    // ── Title + tags ─────────────────────────────────────────────────────────
    column({
      accessorKey: 'title',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Title" />,
      cell: ({ row }) => {
        const patent = row.original;
        return (
          <div>
            <p className="font-medium line-clamp-1">{patent.title}</p>
            <div className="flex items-center gap-1 mt-1">
              {(patent.tags || []).slice(0, 2).map(tag => (
                <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
              ))}
              {(patent.tags || []).length > 2 && (
                <Badge variant="outline" className="text-xs">+{patent.tags.length - 2}</Badge>
              )}
            </div>
          </div>
        );
      },
      enableHiding: false,
    }),

    // ── Patent Number ─────────────────────────────────────────────────────────
    column({
      id: 'patent_number',
      header: 'Patent Number',
      accessorFn: row => row.patent_number || row.application_number || '',
      cell: ({ row }) => {
        const patent = row.original;
        return (
          <div className="flex items-center gap-2">
            <StatusIcon status={patent.status} />
            <span className="font-mono text-sm">{patent.patent_number || patent.application_number || '—'}</span>
          </div>
        );
      },
    }),

    // ── Status ────────────────────────────────────────────────────────────────
    column({
      accessorKey: 'status',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ getValue }) => {
        const status = getValue() as string;
        return <Badge className={STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-800'}>{status}</Badge>;
      },
      meta: {
        filterType: 'select',
        filterOptions: [
          { label: 'Granted', value: 'granted' },
          { label: 'Pending', value: 'pending' },
          { label: 'Filed', value: 'filed' },
          { label: 'Published', value: 'published' },
          { label: 'Expired', value: 'expired' },
          { label: 'Abandoned', value: 'abandoned' },
          { label: 'Rejected', value: 'rejected' },
        ],
      },
    }),

    // ── Assignee ─────────────────────────────────────────────────────────────
    column({
      id: 'assignee',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Assignee" />,
      accessorFn: row => (row.assignees?.[0] || '').toLowerCase(),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Building className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-sm">{formatAssignees(row.original.assignees)}</span>
        </div>
      ),
    }),

    // ── Filing Date ───────────────────────────────────────────────────────────
    column({
      accessorKey: 'filing_date',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Filing Date" />,
      cell: ({ getValue }) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-sm">{formatDate(getValue() as string | null)}</span>
        </div>
      ),
      meta: { filterType: 'date-range' },
    }),

    // ── Patent Type (hidden by default) ──────────────────────────────────────
    column({
      accessorKey: 'patent_type',
      header: 'Type',
      cell: ({ getValue }) => <span className="text-sm capitalize">{(getValue() as string) || '—'}</span>,
      meta: {
        filterType: 'select',
        filterOptions: [
          { label: 'Utility', value: 'utility' },
          { label: 'Design', value: 'design' },
          { label: 'Plant', value: 'plant' },
          { label: 'Provisional', value: 'provisional' },
        ],
      },
    }),

    // ── Technology Area (hidden by default) ───────────────────────────────────
    column({
      accessorKey: 'technology_area',
      header: 'Technology',
      cell: ({ getValue }) => <span className="text-sm">{(getValue() as string) || '—'}</span>,
    }),

    // ── Actions ───────────────────────────────────────────────────────────────
    column({
      id: 'actions',
      header: '',
      enableSorting: false,
      enableHiding: false,
      // row actions rendered by DataTable's rowActions prop
      cell: () => null,
    }),
  ];
}
