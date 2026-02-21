/**
 * CasesTab - All Infringement Cases list with search, filters, and evidence
 * Extracted from the infringement page monolith
 */

'use client';

import Link from 'next/link';
import {
  Search,
  Filter,
  MoreHorizontal,
  FileText,
  Scale,
  Upload,
  Download,
  Eye,
  Trash2,
  Edit,
  Archive,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { InfringementCase } from '@/services/infringementApi';

interface CasesTabProps {
  filteredCases: InfringementCase[];
  casesLoading: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filterOpen: boolean;
  setFilterOpen: (open: boolean) => void;
  statusFilter: string;
  setStatusFilter: (s: string) => void;
  riskFilter: string;
  setRiskFilter: (r: string) => void;
  analysisTypeFilter: string;
  setAnalysisTypeFilter: (t: string) => void;
  activeFilterCount: number;
  handleClearFilters: () => void;
  expandedCases: Set<string>;
  toggleCaseExpansion: (id: string) => void;
  deletingEvidence: boolean;
  getStatusColor: (status: string) => string;
  getRiskColor: (risk: string) => string;
  getAnalysisTypeColor: (type: string) => string;
  getEvidenceTypeLabel: (type: string) => string;
  handleOpenStatusDialog: (c: InfringementCase) => void;
  handleOpenUploadDialog: (c: InfringementCase) => void;
  handleOpenClaimChartDialog: (c: InfringementCase) => void;
  handleExportToPDF: (c: InfringementCase) => void;
  handleExportToExcel: (c: InfringementCase) => void;
  handleArchiveCase: (c: InfringementCase) => void;
  handleDeleteCase: (c: InfringementCase) => void;
  handleDeleteEvidence: (id: string) => void;
}

export function CasesTab({
  filteredCases,
  casesLoading,
  searchQuery,
  setSearchQuery,
  filterOpen,
  setFilterOpen,
  statusFilter,
  setStatusFilter,
  riskFilter,
  setRiskFilter,
  analysisTypeFilter,
  setAnalysisTypeFilter,
  activeFilterCount,
  handleClearFilters,
  expandedCases,
  toggleCaseExpansion,
  deletingEvidence,
  getStatusColor,
  getRiskColor,
  getAnalysisTypeColor,
  getEvidenceTypeLabel,
  handleOpenStatusDialog,
  handleOpenUploadDialog,
  handleOpenClaimChartDialog,
  handleExportToPDF,
  handleExportToExcel,
  handleArchiveCase,
  handleDeleteCase,
  handleDeleteEvidence,
}: CasesTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>All Infringement Cases</CardTitle>
        <CardDescription>
          Manage and track patent infringement analysis
        </CardDescription>
      </CardHeader>
      <CardContent>
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

        <div className="space-y-3">
          {casesLoading ? (
            <div className="text-center py-8">Loading cases...</div>
          ) : filteredCases.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No cases found.
            </div>
          ) : (
            filteredCases.map((caseItem, index) => (
              <div key={caseItem.id || `case-list-${index}`} className="border rounded-lg">
                <div className="p-4 hover:bg-accent">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">{caseItem.case_name || 'Untitled Case'}</h3>
                        <Badge
                          className={`${getStatusColor(caseItem.status || 'draft')} cursor-pointer hover:opacity-80`}
                          onClick={() => handleOpenStatusDialog(caseItem)}
                        >
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
                        <span>Patent: {(caseItem as any).patent_detail ? (
                          <Link href={`/dashboard/portfolio/${(caseItem as any).patent_detail.portfolio_id}/patent/${(caseItem as any).patent_detail.id}`} className="text-blue-600 hover:underline">
                            {caseItem.patent_number || 'N/A'}
                          </Link>
                        ) : (
                          caseItem.patent_number || 'N/A'
                        )}</span>
                        <span>Product: {caseItem.accused_product_name || 'N/A'}</span>
                        <span>Party: {caseItem.accused_party_name || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Infringement Likelihood:</span>
                          <span className="font-medium">{caseItem.infringement_likelihood ?? 0}%</span>
                          <Progress value={caseItem.infringement_likelihood ?? 0} className="w-24 h-2" />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Confidence:</span>
                          <span className="font-medium">{caseItem.confidence_level ?? 0}%</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleCaseExpansion(caseItem.id)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        {expandedCases.has(caseItem.id) ? 'Hide' : 'View'} Evidence ({caseItem.evidence?.length || 0})
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenUploadDialog(caseItem)}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleOpenStatusDialog(caseItem)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Status
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleOpenClaimChartDialog(caseItem)}>
                            <Scale className="h-4 w-4 mr-2" />
                            Add Claim Mapping
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleExportToPDF(caseItem)}>
                            <Download className="h-4 w-4 mr-2" />
                            Export PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleExportToExcel(caseItem)}>
                            <FileText className="h-4 w-4 mr-2" />
                            Export Excel
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleArchiveCase(caseItem)}>
                            <Archive className="h-4 w-4 mr-2" />
                            Archive Case
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDeleteCase(caseItem)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Case
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>

                {/* Evidence Section */}
                {expandedCases.has(caseItem.id) && (
                  <div className="border-t bg-muted/30 p-4">
                    <h4 className="font-semibold mb-3 text-sm">Evidence</h4>
                    {!caseItem.evidence || caseItem.evidence.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No evidence uploaded yet. Click &quot;Upload&quot; to add evidence.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {caseItem.evidence.map((evidence, evidenceIndex) => (
                          <div key={evidence.id || `evidence-${evidenceIndex}`} className="bg-background p-3 rounded-md border flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium text-sm">{evidence.title}</span>
                                <Badge variant="outline" className="text-xs">
                                  {getEvidenceTypeLabel(evidence.evidence_type)}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">{evidence.description}</p>
                              {evidence.url && (
                                <a href={evidence.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline mt-1 inline-block">
                                  View Source
                                </a>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm">
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={deletingEvidence}
                                onClick={() => handleDeleteEvidence(evidence.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
