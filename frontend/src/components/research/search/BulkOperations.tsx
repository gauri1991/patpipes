'use client';

import { useState, useEffect } from 'react';
import { CheckSquare, Square, Download, FileText, Mail, Tag, Trash2, Archive } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface BulkOperationsProps {
  patents: any[];
  onSelectionChange?: (selectedIds: string[]) => void;
  onBulkAction?: (action: string, selectedIds: string[]) => void;
}

export function BulkOperations({
  patents,
  onSelectionChange,
  onBulkAction
}: BulkOperationsProps) {
  const [selectedPatents, setSelectedPatents] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [bulkAction, setBulkAction] = useState<string>('');

  useEffect(() => {
    const selectedIds = Array.from(selectedPatents);
    onSelectionChange?.(selectedIds);
  }, [selectedPatents, onSelectionChange]);

  const togglePatentSelection = (patentId: string) => {
    const newSelected = new Set(selectedPatents);
    if (newSelected.has(patentId)) {
      newSelected.delete(patentId);
    } else {
      newSelected.add(patentId);
    }
    setSelectedPatents(newSelected);
    
    // Update selectAll state
    setSelectAll(newSelected.size === patents.length && patents.length > 0);
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedPatents(new Set());
      setSelectAll(false);
    } else {
      setSelectedPatents(new Set(patents.map(p => p.id)));
      setSelectAll(true);
    }
  };

  const handleBulkAction = () => {
    if (bulkAction && selectedPatents.size > 0) {
      onBulkAction?.(bulkAction, Array.from(selectedPatents));
      setBulkAction('');
    }
  };

  const clearSelection = () => {
    setSelectedPatents(new Set());
    setSelectAll(false);
  };

  if (patents.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Selection Controls */}
      <Card className="border-dashed">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="select-all"
                  checked={selectAll}
                  onCheckedChange={toggleSelectAll}
                />
                <label
                  htmlFor="select-all"
                  className="text-sm font-medium cursor-pointer"
                >
                  Select All ({patents.length})
                </label>
              </div>
              
              {selectedPatents.size > 0 && (
                <Badge variant="secondary">
                  {selectedPatents.size} selected
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              {selectedPatents.size > 0 && (
                <>
                  <Select value={bulkAction} onValueChange={setBulkAction}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Bulk actions..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="export_csv">Export CSV</SelectItem>
                      <SelectItem value="export_json">Export JSON</SelectItem>
                      <SelectItem value="export_pdf">Export PDF Report</SelectItem>
                      <SelectItem value="add_to_session">Add to Session</SelectItem>
                      <SelectItem value="create_citation">Create Citations</SelectItem>
                      <SelectItem value="prior_art_analysis">Prior Art Analysis</SelectItem>
                      <SelectItem value="portfolio_analysis">Portfolio Analysis</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button 
                    size="sm"
                    onClick={handleBulkAction}
                    disabled={!bulkAction}
                  >
                    Apply
                  </Button>

                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={clearSelection}
                  >
                    Clear
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Quick Action Buttons */}
          {selectedPatents.size > 0 && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onBulkAction?.('export_csv', Array.from(selectedPatents))}
              >
                <Download className="h-3 w-3 mr-1" />
                CSV
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onBulkAction?.('export_pdf', Array.from(selectedPatents))}
              >
                <FileText className="h-3 w-3 mr-1" />
                PDF
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onBulkAction?.('add_to_session', Array.from(selectedPatents))}
              >
                <Tag className="h-3 w-3 mr-1" />
                Add to Session
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onBulkAction?.('prior_art_analysis', Array.from(selectedPatents))}
              >
                <FileText className="h-3 w-3 mr-1" />
                Prior Art
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Patent List with Selection */}
      <div className="space-y-2">
        {patents.map((patent) => (
          <Card 
            key={patent.id} 
            className={`hover:shadow-sm transition-all cursor-pointer ${
              selectedPatents.has(patent.id) ? 'ring-2 ring-blue-500 bg-blue-50' : ''
            }`}
            onClick={() => togglePatentSelection(patent.id)}
          >
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={selectedPatents.has(patent.id)}
                  onCheckedChange={() => togglePatentSelection(patent.id)}
                  onClick={(e) => e.stopPropagation()}
                />
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-sm font-medium">
                      {patent.patent_number}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {patent.jurisdiction}
                    </Badge>
                    <Badge 
                      variant={patent.status === 'active' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {patent.status}
                    </Badge>
                  </div>
                  
                  <p className="text-sm line-clamp-1 mb-1">{patent.title}</p>
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{patent.assignee}</span>
                    <span>•</span>
                    <span>{new Date(patent.publication_date).toLocaleDateString()}</span>
                    {patent.citation_count && (
                      <>
                        <span>•</span>
                        <span>{patent.citation_count} citations</span>
                      </>
                    )}
                  </div>
                </div>

                {selectedPatents.has(patent.id) && (
                  <CheckSquare className="h-4 w-4 text-blue-600" />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Selection Summary */}
      {selectedPatents.size > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-blue-600" />
                <span>
                  <strong>{selectedPatents.size}</strong> of <strong>{patents.length}</strong> patents selected
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                Ready for bulk operations
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}