'use client';

import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, createColumns } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table';

export interface PatentRecord {
  id: string;
  patent_id: string;
  title: string;
  abstract?: string;
  assignee?: string;
  filing_date?: string;
  publication_date?: string;
  grant_date?: string;
  inventors?: string[];
  ipc_classes?: string[];
  us_classes?: string[];
  citation_count?: number;
  created_at: string;
}

interface RecordsTableProps {
  records: PatentRecord[];
  totalRecords: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onSearch?: (query: string) => void;
  isLoading?: boolean;
  className?: string;
}

function formatDate(dateString?: string) {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

const { column } = createColumns<PatentRecord>();

const COLUMNS = [
  column({
    accessorKey: 'patent_id',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Patent ID" />,
    cell: ({ getValue }) => <span className="font-mono text-sm">{getValue() as string}</span>,
  }),
  column({
    accessorKey: 'title',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Title" />,
    cell: ({ row }) => (
      <div className="space-y-1">
        <p className="font-medium line-clamp-2">{row.original.title}</p>
        {row.original.abstract && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {row.original.abstract.slice(0, 150)}{row.original.abstract.length > 150 ? '...' : ''}
          </p>
        )}
      </div>
    ),
  }),
  column({
    accessorKey: 'assignee',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Assignee" />,
    cell: ({ row }) => (
      <div className="space-y-1">
        <p className="text-sm">{row.original.assignee || 'N/A'}</p>
        {row.original.inventors && row.original.inventors.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {row.original.inventors.slice(0, 2).join(', ')}
            {row.original.inventors.length > 2 && ` +${row.original.inventors.length - 2}`}
          </p>
        )}
      </div>
    ),
  }),
  column({
    accessorKey: 'filing_date',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Filing Date" />,
    cell: ({ getValue }) => <span className="text-sm">{formatDate(getValue() as string | undefined)}</span>,
    meta: { filterType: 'date-range' as const },
  }),
  column({
    accessorKey: 'grant_date',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Grant Date" />,
    cell: ({ getValue }) => <span className="text-sm">{formatDate(getValue() as string | undefined)}</span>,
  }),
  column({
    accessorKey: 'citation_count',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Citations" />,
    cell: ({ getValue }) => {
      const v = getValue() as number | undefined;
      return v !== undefined
        ? <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">{v}</span>
        : <span className="text-muted-foreground">—</span>;
    },
    meta: { filterType: 'number-range' as const },
  }),
  column({
    id: 'actions',
    header: '',
    enableSorting: false,
    enableHiding: false,
    cell: ({ row }) => (
      <Button variant="ghost" size="sm" asChild>
        <a href={`https://patents.google.com/patent/${row.original.patent_id}`} target="_blank" rel="noopener noreferrer">
          <ExternalLink className="h-4 w-4" />
        </a>
      </Button>
    ),
  }),
];

export function RecordsTable({
  records,
  totalRecords,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onSearch,
  isLoading = false,
  className = '',
}: RecordsTableProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Patent Records</CardTitle>
        <CardDescription>{totalRecords.toLocaleString()} records total</CardDescription>
      </CardHeader>

      <DataTable
        data={records}
        columns={COLUMNS}
        getRowId={row => row.id}
        isLoading={isLoading}
        features={{
          enableSorting: true,
          enableFiltering: !!onSearch,
          enableColumnVisibility: true,
          enableExport: true,
        }}
        serverSide={{
          manualPagination: true,
          manualFiltering: !!onSearch,
          rowCount: totalRecords,
          onPaginationChange: ({ pageIndex, pageSize: ps }) => {
            if (ps !== pageSize) onPageSizeChange(ps);
            else onPageChange(pageIndex + 1);
          },
          onGlobalFilterChange: onSearch,
        }}
        pagination={{ pageIndex: currentPage - 1, pageSize }}
        initialPageSize={pageSize}
        className="rounded-none border-0 border-t"
      />
    </Card>
  );
}
