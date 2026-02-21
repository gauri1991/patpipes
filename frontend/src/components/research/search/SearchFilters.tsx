'use client';

import { useState, useEffect } from 'react';
import { Filter, X, Calendar, Globe, Building } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

interface FilterState {
  dateFrom?: string;
  dateTo?: string;
  jurisdictions?: string[];
  assignee?: string;
}

interface SearchFiltersProps {
  onFiltersChange?: (filters: FilterState) => void;
  onApplyFilters?: () => void;
  onClearFilters?: () => void;
  totalResults?: number;
  initialFilters?: FilterState;
}

export function SearchFilters({ 
  onFiltersChange,
  onApplyFilters,
  onClearFilters,
  totalResults = 0,
  initialFilters = {}
}: SearchFiltersProps) {
  const [dateFrom, setDateFrom] = useState(initialFilters.dateFrom || '');
  const [dateTo, setDateTo] = useState(initialFilters.dateTo || '');
  const [selectedJurisdictions, setSelectedJurisdictions] = useState<string[]>(initialFilters.jurisdictions || []);
  const [assigneeFilter, setAssigneeFilter] = useState(initialFilters.assignee || '');

  // Calculate active filters count
  const getActiveFiltersCount = () => {
    let count = 0;
    if (dateFrom || dateTo) count++;
    if (selectedJurisdictions.length > 0) count++;
    if (assigneeFilter.trim()) count++;
    return count;
  };

  // Build current filter state
  const getCurrentFilters = (): FilterState => ({
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    jurisdictions: selectedJurisdictions.length > 0 ? selectedJurisdictions : undefined,
    assignee: assigneeFilter.trim() || undefined
  });

  // Notify parent of filter changes
  useEffect(() => {
    onFiltersChange?.(getCurrentFilters());
  }, [dateFrom, dateTo, selectedJurisdictions, assigneeFilter, onFiltersChange]);

  // Clear all filters
  const handleClearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setSelectedJurisdictions([]);
    setAssigneeFilter('');
    onClearFilters?.();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <CardTitle className="text-base">Search Filters</CardTitle>
            {getActiveFiltersCount() > 0 && (
              <Badge variant="secondary">{getActiveFiltersCount()} active</Badge>
            )}
            {totalResults > 0 && (
              <Badge variant="outline">{totalResults.toLocaleString()} results</Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleClearFilters}
              disabled={getActiveFiltersCount() === 0}
            >
              <X className="h-3 w-3 mr-1" />
              Clear
            </Button>
            <Button size="sm" onClick={onApplyFilters}>
              Apply
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Date Range Filter */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-4 w-4" />
              <Label className="font-medium">Publication Date</Label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">From</Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">To</Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>
          </div>
          
          {/* Jurisdiction Filter */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Globe className="h-4 w-4" />
              <Label className="font-medium">Jurisdictions</Label>
            </div>
            <div className="space-y-2">
              {['US', 'EP', 'WO', 'JP', 'CN', 'KR'].map((jurisdiction) => (
                <div key={jurisdiction} className="flex items-center space-x-2">
                  <Checkbox
                    id={jurisdiction}
                    checked={selectedJurisdictions.includes(jurisdiction)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedJurisdictions([...selectedJurisdictions, jurisdiction]);
                      } else {
                        setSelectedJurisdictions(selectedJurisdictions.filter(j => j !== jurisdiction));
                      }
                    }}
                  />
                  <Label htmlFor={jurisdiction} className="text-sm cursor-pointer">
                    {jurisdiction}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Assignee Filter */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Building className="h-4 w-4" />
              <Label className="font-medium">Assignee</Label>
            </div>
            <Input
              placeholder="Enter company name..."
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="text-sm"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}