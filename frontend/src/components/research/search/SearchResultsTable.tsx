'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, createColumns } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table';

interface PatentResult {
  id: string;
  patent_number: string;
  title: string;
  assignee: string;
  publication_date: string;
  status: string;
  jurisdiction: string;
  citation_count: number;
}

interface SearchResultsTableProps {
  results: PatentResult[];
  totalResults?: number;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

const { column } = createColumns<PatentResult>();

const COLUMNS = [
  column({
    accessorKey: 'patent_number',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Patent Number" />,
    cell: ({ getValue }) => <span className="font-mono text-sm">{getValue() as string}</span>,
  }),
  column({
    accessorKey: 'title',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Title" />,
    cell: ({ getValue }) => (
      <span className="max-w-xs truncate block" title={getValue() as string}>{getValue() as string}</span>
    ),
  }),
  column({
    accessorKey: 'assignee',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Assignee" />,
    cell: ({ getValue }) => <span className="text-sm">{getValue() as string}</span>,
  }),
  column({
    accessorKey: 'publication_date',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
    cell: ({ getValue }) => (
      <span className="text-sm">{new Date(getValue() as string).toLocaleDateString()}</span>
    ),
    meta: { filterType: 'date-range' as const },
  }),
  column({
    accessorKey: 'status',
    header: 'Status',
    cell: ({ getValue }) => {
      const s = getValue() as string;
      return <Badge variant={s === 'active' ? 'default' : 'secondary'}>{s}</Badge>;
    },
    meta: {
      filterType: 'select' as const,
      filterOptions: [
        { label: 'Active', value: 'active' },
        { label: 'Expired', value: 'expired' },
        { label: 'Pending', value: 'pending' },
      ],
    },
  }),
  column({
    accessorKey: 'jurisdiction',
    header: 'Jurisdiction',
    cell: ({ getValue }) => <span className="text-sm">{getValue() as string}</span>,
  }),
  column({
    accessorKey: 'citation_count',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Citations" />,
    cell: ({ getValue }) => <span className="text-sm">{getValue() as number}</span>,
    meta: { filterType: 'number-range' as const },
  }),
];

export function SearchResultsTable({
  results = [],
  totalResults = 0,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
}: SearchResultsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Search Results Table</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <DataTable
          data={results}
          columns={COLUMNS}
          getRowId={row => row.id}
          features={{
            enableSorting: true,
            enableMultiSort: true,
            enableFiltering: true,
            enableColumnVisibility: true,
            enableDensityToggle: true,
            enableExport: true,
          }}
          serverSide={onPageChange ? {
            manualPagination: true,
            rowCount: totalResults,
            onPaginationChange: ({ pageIndex }) => onPageChange(pageIndex + 1),
          } : undefined}
          pagination={onPageChange ? { pageIndex: currentPage - 1, pageSize: Math.ceil(totalResults / totalPages) || 20 } : undefined}
          exportConfig={{ filename: 'search-results' }}
          emptyState="No results to display"
          className="rounded-none border-0 border-t"
        />
      </CardContent>
    </Card>
  );
}
