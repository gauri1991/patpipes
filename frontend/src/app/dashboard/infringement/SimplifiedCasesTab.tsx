/**
 * SimplifiedCasesTab - Navigation-focused case list for the infringement dashboard.
 * Each case row navigates to /dashboard/infringement/{caseId} instead of expanding inline.
 */

'use client';

import { useRouter } from 'next/navigation';
import {
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { InfringementCase } from '@/services/infringementApi';
import { getStatusColor, getRiskColor, getAnalysisTypeColor } from '@/domains/infringement/utils';
import { useState } from 'react';

interface SimplifiedCasesTabProps {
  cases: InfringementCase[];
  casesLoading: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  statusFilter: string;
  setStatusFilter: (s: string) => void;
  riskFilter: string;
  setRiskFilter: (r: string) => void;
  analysisTypeFilter: string;
  setAnalysisTypeFilter: (t: string) => void;
  onRefresh: () => void;
}

export function SimplifiedCasesTab({
  cases,
  casesLoading,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  riskFilter,
  setRiskFilter,
  analysisTypeFilter,
  setAnalysisTypeFilter,
  onRefresh,
}: SimplifiedCasesTabProps) {
  const router = useRouter();
  const [filterOpen, setFilterOpen] = useState(false);

  const activeFilterCount = [statusFilter, riskFilter, analysisTypeFilter].filter(Boolean).length;

  const handleClearFilters = () => {
    setStatusFilter('');
    setRiskFilter('');
    setAnalysisTypeFilter('');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>All Infringement Cases</CardTitle>
            <CardDescription>
              {cases.length} case{cases.length !== 1 ? 's' : ''} found
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Search & Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search cases..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Popover open={filterOpen} onOpenChange={setFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="relative">
                <Filter className="h-4 w-4 mr-2" />
                Filter
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm">Filter Cases</h4>
                  {activeFilterCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                      Clear all
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All statuses</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active Analysis</SelectItem>
                      <SelectItem value="review">Under Review</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="on_hold">On Hold</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Risk Level</Label>
                  <Select value={riskFilter} onValueChange={setRiskFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All risk levels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All risk levels</SelectItem>
                      <SelectItem value="low">Low Risk</SelectItem>
                      <SelectItem value="medium">Medium Risk</SelectItem>
                      <SelectItem value="high">High Risk</SelectItem>
                      <SelectItem value="critical">Critical Risk</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Analysis Type</Label>
                  <Select value={analysisTypeFilter} onValueChange={setAnalysisTypeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All types</SelectItem>
                      <SelectItem value="literal">Literal Infringement</SelectItem>
                      <SelectItem value="doe">Doctrine of Equivalents</SelectItem>
                      <SelectItem value="induced">Induced Infringement</SelectItem>
                      <SelectItem value="contributory">Contributory Infringement</SelectItem>
                      <SelectItem value="willful">Willful Infringement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  className="w-full"
                  onClick={() => setFilterOpen(false)}
                >
                  Apply Filters
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Case List */}
        <div className="space-y-3">
          {casesLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading cases...</div>
          ) : cases.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No cases found.
            </div>
          ) : (
            cases.map((caseItem) => (
              <div
                key={caseItem.id}
                className="border rounded-lg p-4 hover:bg-accent/50 cursor-pointer transition-colors"
                onClick={() => router.push(`/dashboard/infringement/${caseItem.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold truncate">
                        {caseItem.case_name || 'Untitled Case'}
                      </h3>
                      <Badge className={getStatusColor(caseItem.status || 'draft')}>
                        {(caseItem.status || 'draft').replace('_', ' ')}
                      </Badge>
                      <Badge className={getRiskColor(caseItem.risk_level || 'low')}>
                        {caseItem.risk_level || 'unknown'} risk
                      </Badge>
                      <Badge className={getAnalysisTypeColor(caseItem.analysis_type || 'literal')}>
                        {caseItem.analysis_type || 'unknown'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-muted-foreground mb-2">
                      {caseItem.case_number && (
                        <span className="font-mono text-xs">{caseItem.case_number}</span>
                      )}
                      <span>Patent: {caseItem.patent_number || 'N/A'}</span>
                      <span>vs. {caseItem.accused_product_name || 'N/A'}</span>
                      <span>({caseItem.accused_party_name || 'N/A'})</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Likelihood:</span>
                        <span className="font-medium">{caseItem.infringement_likelihood ?? 0}%</span>
                        <Progress value={caseItem.infringement_likelihood ?? 0} className="w-24 h-2" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Confidence:</span>
                        <span className="font-medium">{caseItem.confidence_level ?? 0}%</span>
                      </div>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0 ml-4" />
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
