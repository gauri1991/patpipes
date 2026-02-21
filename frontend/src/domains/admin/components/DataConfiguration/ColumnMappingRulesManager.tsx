/**
 * ColumnMappingRulesManager Component
 * CRUD interface for managing column mapping rules
 */

'use client';

import { useState, useEffect } from 'react';
import { 
  Search,
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  Check,
  X,
  AlertCircle,
  Target,
  Hash,
  Activity,
  Settings,
  Eye,
  EyeOff,
  Loader2
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

import { useDataConfiguration, type MappingRule as MappingRuleType } from '../../hooks/useDataConfiguration';

// Use the MappingRule type from the hook
type MappingRule = MappingRuleType;

export function ColumnMappingRulesManager() {
  const { mappingRules } = useDataConfiguration();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedRules, setSelectedRules] = useState<string[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [currentRule, setCurrentRule] = useState<Partial<MappingRule>>({});
  const [loading, setLoading] = useState(false);
  const [rules, setRules] = useState<MappingRule[]>([]);

  // Load rules from API on component mount
  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    setLoading(true);
    try {
      const data = await mappingRules.list({
        status: filterStatus === 'all' ? undefined : filterStatus
      });
      // Handle paginated response format {results: [...]}
      const rulesArray = data?.results || data || [];
      setRules(Array.isArray(rulesArray) ? rulesArray : []);
    } catch (error) {
      console.error('Failed to load mapping rules:', error);
      toast.error('Failed to load mapping rules');
      setRules([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter rules based on search and status
  const filteredRules = (Array.isArray(rules) ? rules : []).filter(rule => {
    const matchesSearch = searchTerm === '' || 
      rule.target_field.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rule.column_patterns.some(p => p.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && rule.is_active) ||
      (filterStatus === 'inactive' && !rule.is_active);
    
    return matchesSearch && matchesStatus;
  });

  // Handlers
  const handleCreateRule = () => {
    setDialogMode('create');
    setCurrentRule({
      target_field: '',
      column_patterns: [],
      field_type: 'CharField',
      confidence_level: 'medium',
      is_core_field: false,
      is_active: true
    });
    setShowDialog(true);
  };

  const handleEditRule = (rule: MappingRule) => {
    setDialogMode('edit');
    setCurrentRule(rule);
    setShowDialog(true);
  };

  const handleDeleteRule = async (id: string) => {
    if (confirm('Are you sure you want to delete this mapping rule?')) {
      try {
        await mappingRules.delete(id);
        toast.success('Mapping rule deleted successfully');
        loadRules();
      } catch (error) {
        toast.error('Failed to delete mapping rule');
      }
    }
  };

  const handleSaveRule = async () => {
    try {
      console.log('Saving rule:', dialogMode, currentRule);
      
      if (dialogMode === 'create') {
        const result = await mappingRules.create(currentRule);
        console.log('Create result:', result);
        toast.success('Mapping rule created successfully');
      } else {
        const result = await mappingRules.update(currentRule.id!, currentRule);
        console.log('Update result:', result);
        toast.success('Mapping rule updated successfully');
      }
      setShowDialog(false);
      loadRules();
    } catch (error) {
      console.error('Save rule error:', error);
      toast.error(`Failed to ${dialogMode} mapping rule`);
    }
  };

  const handleToggleActive = async (rule: MappingRule) => {
    try {
      await mappingRules.update(rule.id, {
        ...rule,
        is_active: !rule.is_active
      });
      toast.success(`Rule ${rule.is_active ? 'deactivated' : 'activated'} successfully`);
      loadRules();
    } catch (error) {
      toast.error('Failed to update rule status');
    }
  };

  const handleBulkActivate = async (activate: boolean) => {
    if (selectedRules.length === 0) {
      toast.error('No rules selected');
      return;
    }
    
    try {
      await mappingRules.bulkActivate(selectedRules, activate);
      toast.success(`${selectedRules.length} rules ${activate ? 'activated' : 'deactivated'}`);
      setSelectedRules([]);
      loadRules();
    } catch (error) {
      toast.error('Failed to update rules');
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Column Mapping Rules</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {(Array.isArray(rules) ? rules : []).filter(r => r.is_active).length} Active
              </Badge>
              <Badge variant="outline">
                {(Array.isArray(rules) ? rules : []).filter(r => !r.is_active).length} Inactive
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
      {/* Search and Filter Bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search rules..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2">
          {selectedRules.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Bulk Actions ({selectedRules.length})
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleBulkActivate(true)}>
                  <Check className="h-4 w-4 mr-2" />
                  Activate
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkActivate(false)}>
                  <X className="h-4 w-4 mr-2" />
                  Deactivate
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Button onClick={handleCreateRule}>
            <Plus className="h-4 w-4 mr-2" />
            Add Rule
          </Button>
        </div>
      </div>

      {/* Rules Table */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <input
                    type="checkbox"
                    checked={selectedRules.length === filteredRules.length && filteredRules.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedRules(filteredRules.map(r => r.id));
                      } else {
                        setSelectedRules([]);
                      }
                    }}
                  />
                </TableHead>
                <TableHead>Target Field</TableHead>
                <TableHead>Column Patterns</TableHead>
                <TableHead>Field Type</TableHead>
                <TableHead>Confidence</TableHead>
                <TableHead>Core</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Success Rate</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedRules.includes(rule.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRules([...selectedRules, rule.id]);
                        } else {
                          setSelectedRules(selectedRules.filter(id => id !== rule.id));
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-muted-foreground" />
                      {rule.target_field}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[200px]">
                      <Badge variant="secondary" className="text-xs">
                        {rule.column_patterns.length} patterns
                      </Badge>
                      <div className="text-xs text-muted-foreground mt-1 truncate">
                        {rule.column_patterns.slice(0, 2).join(', ')}
                        {rule.column_patterns.length > 2 && '...'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{rule.field_type}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        rule.confidence_level === 'high' ? 'default' : 
                        rule.confidence_level === 'medium' ? 'secondary' : 
                        'outline'
                      }
                    >
                      {rule.confidence_level}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {rule.is_core_field && (
                      <Badge variant="default" className="bg-blue-500">Core</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Hash className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">{rule.usage_count}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Activity className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">{rule.success_rate}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={rule.is_active}
                      onCheckedChange={() => handleToggleActive(rule)}
                    />
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditRule(rule)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteRule(rule.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'create' ? 'Create Mapping Rule' : 'Edit Mapping Rule'}
            </DialogTitle>
            <DialogDescription>
              Define how Excel column names should map to patent record fields
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="target">Target Field</Label>
              <Input
                id="target"
                value={currentRule.target_field || ''}
                onChange={(e) => setCurrentRule({
                  ...currentRule, 
                  target_field: e.target.value
                })}
                placeholder="e.g., patent_id, filing_date"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="patterns">Column Patterns (one per line)</Label>
              <Textarea
                id="patterns"
                value={currentRule.column_patterns?.join('\n') || ''}
                onChange={(e) => {
                  // Don't filter on every change - preserve empty lines while typing
                  const lines = e.target.value.split('\n');
                  setCurrentRule({
                    ...currentRule, 
                    column_patterns: lines
                  });
                }}
                onBlur={(e) => {
                  // Filter empty lines only when leaving the field
                  const lines = e.target.value.split('\n').filter(p => p.trim());
                  setCurrentRule({
                    ...currentRule, 
                    column_patterns: lines
                  });
                }}
                onKeyDown={(e) => {
                  // Stop the dialog from intercepting Enter key
                  if (e.key === 'Enter') {
                    e.stopPropagation();
                  }
                }}
                placeholder="Patent Number&#10;Patent ID&#10;Application Number"
                rows={8}
                className="min-h-[120px] max-h-[200px] overflow-y-auto resize-none"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="type">Field Type</Label>
                <Select
                  value={currentRule.field_type || 'CharField'}
                  onValueChange={(value) => setCurrentRule({
                    ...currentRule,
                    field_type: value
                  })}
                >
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CharField">Text Field</SelectItem>
                    <SelectItem value="TextField">Long Text Field</SelectItem>
                    <SelectItem value="DateField">Date Field</SelectItem>
                    <SelectItem value="DateTimeField">DateTime Field</SelectItem>
                    <SelectItem value="IntegerField">Integer Field</SelectItem>
                    <SelectItem value="FloatField">Float Field</SelectItem>
                    <SelectItem value="DecimalField">Decimal Field</SelectItem>
                    <SelectItem value="BooleanField">Boolean Field</SelectItem>
                    <SelectItem value="JSONField">JSON Field</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="confidence">Confidence Level</Label>
                <Select
                  value={currentRule.confidence_level || 'medium'}
                  onValueChange={(value) => setCurrentRule({
                    ...currentRule,
                    confidence_level: value
                  })}
                >
                  <SelectTrigger id="confidence">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High (90-100%)</SelectItem>
                    <SelectItem value="medium">Medium (70-89%)</SelectItem>
                    <SelectItem value="low">Low (50-69%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={currentRule.is_core_field || false}
                  onCheckedChange={(checked) => setCurrentRule({
                    ...currentRule,
                    is_core_field: checked
                  })}
                />
                <Label>Core Patent Field</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  checked={currentRule.is_active !== false}
                  onCheckedChange={(checked) => setCurrentRule({
                    ...currentRule,
                    is_active: checked
                  })}
                />
                <Label>Active</Label>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRule}>
              {dialogMode === 'create' ? 'Create Rule' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}