'use client';

import { useState } from 'react';
import { ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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
}

export function SearchResultsTable({ 
  results = [],
  totalResults = 0,
  currentPage = 1,
  totalPages = 1
}: SearchResultsTableProps) {
  const [sortField, setSortField] = useState<string>('relevance');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Search Results Table</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-2">
                  <Button variant="ghost" size="sm" className="h-auto p-0 font-medium">
                    Patent Number <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </th>
                <th className="text-left p-2">Title</th>
                <th className="text-left p-2">
                  <Button variant="ghost" size="sm" className="h-auto p-0 font-medium">
                    Assignee <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </th>
                <th className="text-left p-2">
                  <Button variant="ghost" size="sm" className="h-auto p-0 font-medium">
                    Date <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </th>
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">
                  <Button variant="ghost" size="sm" className="h-auto p-0 font-medium">
                    Citations <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </th>
              </tr>
            </thead>
            <tbody>
              {results.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center p-8 text-muted-foreground">
                    No results to display
                  </td>
                </tr>
              ) : (
                results.map((patent) => (
                  <tr key={patent.id} className="border-b hover:bg-muted/25">
                    <td className="p-2 font-mono">{patent.patent_number}</td>
                    <td className="p-2 max-w-xs truncate" title={patent.title}>
                      {patent.title}
                    </td>
                    <td className="p-2">{patent.assignee}</td>
                    <td className="p-2">{new Date(patent.publication_date).toLocaleDateString()}</td>
                    <td className="p-2">
                      <Badge variant={patent.status === 'active' ? 'default' : 'secondary'}>
                        {patent.status}
                      </Badge>
                    </td>
                    <td className="p-2">{patent.citation_count}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground">
            Showing {results.length} of {totalResults} results
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={currentPage === 1}>
              <ChevronLeft className="h-3 w-3 mr-1" />
              Previous
            </Button>
            <div className="flex items-center gap-1">
              <span className="text-sm">Page {currentPage} of {totalPages}</span>
            </div>
            <Button variant="outline" size="sm" disabled={currentPage === totalPages}>
              Next
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}