/**
 * Records Table Component
 * Displays patent records with pagination and search
 */

'use client';

import { useState } from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FileText,
  ExternalLink
} from 'lucide-react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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

export function RecordsTable({
  records,
  totalRecords,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onSearch,
  isLoading = false,
  className = ''
}: RecordsTableProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const totalPages = Math.ceil(totalRecords / pageSize);
  const startRecord = (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, totalRecords);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Patent Records</CardTitle>
            <CardDescription>
              {totalRecords.toLocaleString()} records total
            </CardDescription>
          </div>

          {/* Search */}
          {onSearch && (
            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <div className="relative w-72">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search patents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button type="submit" size="sm">
                Search
              </Button>
            </form>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {/* Table */}
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">Patent ID</TableHead>
                  <TableHead className="min-w-[300px]">Title</TableHead>
                  <TableHead className="min-w-[200px]">Assignee</TableHead>
                  <TableHead className="w-[120px]">Filing Date</TableHead>
                  <TableHead className="w-[120px]">Grant Date</TableHead>
                  <TableHead className="w-[100px]">Citations</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      Loading records...
                    </TableCell>
                  </TableRow>
                ) : records.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No patent records found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  records.map((record) => (
                    <TableRow key={record.id} className="hover:bg-muted/30">
                      <TableCell className="font-mono text-sm">
                        {record.patent_id}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium line-clamp-2">{record.title}</p>
                          {record.abstract && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {truncateText(record.abstract, 150)}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="text-sm">{record.assignee || 'N/A'}</p>
                          {record.inventors && record.inventors.length > 0 && (
                            <p className="text-xs text-muted-foreground">
                              {record.inventors.slice(0, 2).join(', ')}
                              {record.inventors.length > 2 && ` +${record.inventors.length - 2}`}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(record.filing_date)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(record.grant_date)}
                      </TableCell>
                      <TableCell className="text-center">
                        {record.citation_count !== undefined ? (
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                            {record.citation_count}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" asChild>
                          <a
                            href={`https://patents.google.com/patent/${record.patent_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Pagination Controls */}
        {!isLoading && records.length > 0 && (
          <div className="flex items-center justify-between mt-4">
            {/* Page Size Selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Rows per page:</span>
              <Select
                value={pageSize.toString()}
                onValueChange={(value) => onPageSizeChange(Number(value))}
              >
                <SelectTrigger className="w-[80px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Page Info */}
            <div className="text-sm text-muted-foreground">
              Showing {startRecord.toLocaleString()} to {endRecord.toLocaleString()} of{' '}
              {totalRecords.toLocaleString()} records
            </div>

            {/* Page Navigation */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(1)}
                disabled={currentPage === 1}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <span className="text-sm px-2">
                Page {currentPage} of {totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(totalPages)}
                disabled={currentPage === totalPages}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
