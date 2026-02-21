/**
 * DatasetMappingsViewer Component
 * Interface for viewing and managing dataset-specific column mappings
 */

'use client';

import { useState, useEffect } from 'react';
import { 
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  FileSpreadsheet,
  FolderOpen,
  User,
  Calendar,
  MessageSquare,
  MoreVertical,
  Eye,
  Edit,
  Check,
  X
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useDataConfiguration, type DatasetMapping as DatasetMappingType } from '../../hooks/useDataConfiguration';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

// Use the DatasetMapping type from the hook
type DatasetMapping = DatasetMappingType;

export function DatasetMappingsViewer() {
  const { datasetMappings } = useDataConfiguration();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterProject, setFilterProject] = useState('all');
  const [selectedMappings, setSelectedMappings] = useState<string[]>([]);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewMode, setReviewMode] = useState<'approve' | 'reject'>('approve');
  const [reviewNotes, setReviewNotes] = useState('');
  const [currentMapping, setCurrentMapping] = useState<DatasetMapping | null>(null);
  const [loading, setLoading] = useState(false);
  const [mappings, setMappings] = useState<DatasetMapping[]>([]);

  // Load mappings from API on component mount and when filters change
  useEffect(() => {
    loadMappings();
  }, [filterStatus, filterProject]);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm !== '') {
        loadMappings();
      }
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const loadMappings = async () => {
    setLoading(true);
    try {
      const data = await datasetMappings.list({
        status: filterStatus === 'all' ? undefined : filterStatus,
        search: searchTerm || undefined
      });
      // Handle paginated response format {results: [...]}
      const mappingsArray = data?.results || data || [];
      setMappings(Array.isArray(mappingsArray) ? mappingsArray : []);
    } catch (error) {
      console.error('Failed to load dataset mappings:', error);
      toast.error('Failed to load dataset mappings');
      setMappings([]);
    } finally {
      setLoading(false);
    }
  };

  // Remove old mock data

  const projects = Array.from(new Set((Array.isArray(mappings) ? mappings : []).map(m => m.dataset_name)));

  const filteredMappings = (Array.isArray(mappings) ? mappings : []).filter(mapping => {
    const matchesSearch = searchTerm === '' ||
      mapping.source_column.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mapping.target_field.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mapping.dataset_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || mapping.status === filterStatus;
    const matchesProject = filterProject === 'all' || mapping.dataset_name === filterProject;
    
    return matchesSearch && matchesStatus && matchesProject;
  });

  const pendingCount = (Array.isArray(mappings) ? mappings : []).filter(m => m.status === 'pending').length;
  const confirmedCount = (Array.isArray(mappings) ? mappings : []).filter(m => m.status === 'confirmed').length;
  const rejectedCount = (Array.isArray(mappings) ? mappings : []).filter(m => m.status === 'rejected').length;

  const handleSelectMapping = (mappingId: string, checked: boolean) => {
    if (checked) {
      setSelectedMappings([...selectedMappings, mappingId]);
    } else {
      setSelectedMappings(selectedMappings.filter(id => id !== mappingId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedMappings(filteredMappings.map(m => m.id));
    } else {
      setSelectedMappings([]);
    }
  };

  const handleReviewMapping = (mapping: DatasetMapping, mode: 'approve' | 'reject') => {
    setCurrentMapping(mapping);
    setReviewMode(mode);
    setReviewNotes('');
    setShowReviewDialog(true);
  };

  const handleBulkReview = async (action: 'approve' | 'reject') => {
    if (selectedMappings.length === 0) return;
    
    try {
      await datasetMappings.bulkManage(selectedMappings, action, `Bulk ${action}d`);
      toast.success(`${selectedMappings.length} mappings ${action}d successfully`);
      setSelectedMappings([]);
      loadMappings();
    } catch (error) {
      console.error('Bulk review error:', error);
      toast.error(`Failed to ${action} mappings`);
    }
  };

  const handleConfirmReview = async () => {
    if (!currentMapping) return;
    
    try {
      if (reviewMode === 'approve') {
        await datasetMappings.approve(currentMapping.id, reviewNotes);
      } else {
        await datasetMappings.reject(currentMapping.id, reviewNotes);
      }
      
      toast.success(`Mapping ${reviewMode}d successfully`);
      setShowReviewDialog(false);
      setCurrentMapping(null);
      setReviewNotes('');
      loadMappings();
    } catch (error) {
      console.error('Review error:', error);
      toast.error(`Failed to ${reviewMode} mapping`);
    }
  };

  const getStatusBadge = (status: DatasetMapping['status']) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Confirmed</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      case 'pending':
        return <Badge variant="outline" className="text-orange-600 border-orange-300"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'auto_applied':
        return <Badge variant="secondary"><CheckCircle className="h-3 w-3 mr-1" />Auto Applied</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Review</p>
                <p className="text-2xl font-bold text-orange-600">{pendingCount}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Confirmed</p>
                <p className="text-2xl font-bold text-green-600">{confirmedCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold text-red-600">{rejectedCount}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Mappings</p>
                <p className="text-2xl font-bold">{mappings.length}</p>
              </div>
              <FileSpreadsheet className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search mappings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="auto_applied">Auto Applied</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={filterProject} onValueChange={setFilterProject}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Datasets</SelectItem>
              {projects.map(dataset => (
                <SelectItem key={dataset} value={dataset}>{dataset}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedMappings.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {selectedMappings.length} selected
            </span>
            <Button 
              size="sm" 
              onClick={() => handleBulkReview('approve')}
              className="bg-green-600 hover:bg-green-700"
            >
              <Check className="h-4 w-4 mr-1" />
              Approve
            </Button>
            <Button 
              size="sm" 
              variant="destructive"
              onClick={() => handleBulkReview('reject')}
            >
              <X className="h-4 w-4 mr-1" />
              Reject
            </Button>
          </div>
        )}
      </div>

      {/* Mappings Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Dataset Column Mappings ({filteredMappings.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={selectedMappings.length === filteredMappings.length && filteredMappings.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Source Column</TableHead>
                <TableHead>Target Field</TableHead>
                <TableHead>Dataset</TableHead>
                <TableHead>Confidence</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sample Values</TableHead>
                <TableHead>Reviewed By</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMappings.map((mapping) => (
                <TableRow key={mapping.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedMappings.includes(mapping.id)}
                      onCheckedChange={(checked) => handleSelectMapping(mapping.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{mapping.source_column}</span>
                  </TableCell>
                  <TableCell>
                    <code className="bg-muted px-2 py-1 rounded text-sm">{mapping.target_field}</code>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{mapping.dataset_name}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`font-medium ${getConfidenceColor(mapping.confidence_score)}`}>
                      {mapping.confidence_score.toFixed(1)}%
                    </span>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(mapping.status)}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {mapping.sample_values.slice(0, 2).map((value, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {value}
                        </Badge>
                      ))}
                      {mapping.sample_values.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{mapping.sample_values.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {mapping.reviewed_by ? (
                      <div className="text-sm">
                        <p className="font-medium">{mapping.reviewed_by.firstName} {mapping.reviewed_by.lastName}</p>
                        <p className="text-muted-foreground">
                          {new Date(mapping.reviewed_at!).toLocaleDateString()}
                        </p>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">Not reviewed</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {mapping.status === 'pending' ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleReviewMapping(mapping, 'approve')}>
                            <Check className="h-4 w-4 mr-2 text-green-600" />
                            Approve
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleReviewMapping(mapping, 'reject')}>
                            <X className="h-4 w-4 mr-2 text-red-600" />
                            Reject
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <Button variant="ghost" size="sm" disabled>
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewMode === 'approve' ? 'Approve Mapping' : 'Reject Mapping'}
            </DialogTitle>
            <DialogDescription>
              {reviewMode === 'approve' 
                ? 'Confirm this column mapping for data processing.'
                : 'Reject this column mapping and provide a reason.'
              }
            </DialogDescription>
          </DialogHeader>
          
          {currentMapping && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">Source Column</Label>
                  <p className="font-medium">{currentMapping.source_column}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Target Field</Label>
                  <p className="font-medium">{currentMapping.target_field}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Confidence Score</Label>
                  <p className={`font-medium ${getConfidenceColor(currentMapping.confidence_score)}`}>
                    {currentMapping.confidence_score.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Dataset</Label>
                  <p className="font-medium">{currentMapping.dataset_name}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-muted-foreground">Sample Values</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {currentMapping.sample_values.map((value, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {value}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="review_notes">
                  {reviewMode === 'approve' ? 'Approval Notes (optional)' : 'Rejection Reason'}
                </Label>
                <Textarea
                  id="review_notes"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder={reviewMode === 'approve' 
                    ? 'Add any notes about this approval...'
                    : 'Explain why this mapping is being rejected...'
                  }
                  rows={3}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReviewDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmReview}
              className={reviewMode === 'approve' ? 'bg-green-600 hover:bg-green-700' : ''}
              variant={reviewMode === 'approve' ? 'default' : 'destructive'}
            >
              {reviewMode === 'approve' ? 'Approve Mapping' : 'Reject Mapping'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}