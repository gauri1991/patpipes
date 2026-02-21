/**
 * DynamicFieldsRegistry Component
 * Interface for managing dynamic patent fields and their migration status
 */

'use client';

import { useState, useEffect } from 'react';
import { 
  Search,
  Database,
  Plus,
  Play,
  Pause,
  Archive,
  MoreVertical,
  CheckCircle,
  Clock,
  XCircle,
  Activity,
  Code,
  Calendar,
  Users,
  Hash,
  Zap,
  AlertTriangle,
  Info,
  Edit,
  Trash2
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
  DropdownMenuSeparator,
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
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface DynamicField {
  id: string;
  field_name: string;
  field_type: string;
  field_params: Record<string, any>;
  display_name: string;
  description: string;
  total_records: number;
  is_active: boolean;
  migration_applied: boolean;
  migration_name: string | null;
  created_at: string;
  updated_at: string;
  datasets_using: string[];
  created_by: string;
}

export function DynamicFieldsRegistry() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showMigrateDialog, setShowMigrateDialog] = useState(false);
  const [migrationProgress, setMigrationProgress] = useState(0);
  const [migrationStatus, setMigrationStatus] = useState<'idle' | 'running' | 'completed' | 'error'>('idle');
  const [newField, setNewField] = useState({
    field_name: '',
    field_type: 'CharField',
    display_name: '',
    description: '',
    field_params: {}
  });

  // Mock data - replace with actual API calls
  const [fields, setFields] = useState<DynamicField[]>([
    {
      id: '1',
      field_name: 'technology_score',
      field_type: 'FloatField',
      field_params: { max_digits: 5, decimal_places: 2 },
      display_name: 'Technology Score',
      description: 'Innovation score based on technology assessment',
      total_records: 145,
      is_active: true,
      migration_applied: true,
      migration_name: '0004_add_dynamic_fields_20250201',
      created_at: '2024-02-01T10:30:00Z',
      updated_at: '2024-02-01T10:30:00Z',
      datasets_using: ['AI Patents 2024', 'Tech Innovation Q1'],
      created_by: 'System'
    },
    {
      id: '2',
      field_name: 'market_potential_score',
      field_type: 'FloatField',
      field_params: { max_digits: 5, decimal_places: 2 },
      display_name: 'Market Potential Score',
      description: 'Predicted market potential for the innovation',
      total_records: 89,
      is_active: true,
      migration_applied: false,
      migration_name: null,
      created_at: '2024-02-10T15:22:00Z',
      updated_at: '2024-02-10T15:22:00Z',
      datasets_using: ['Biotech Research Patents'],
      created_by: 'John Admin'
    },
    {
      id: '3',
      field_name: 'development_cost_usd',
      field_type: 'IntegerField',
      field_params: {},
      display_name: 'Development Cost (USD)',
      description: 'Estimated development cost in US dollars',
      total_records: 67,
      is_active: true,
      migration_applied: false,
      migration_name: null,
      created_at: '2024-02-12T09:15:00Z',
      updated_at: '2024-02-12T09:15:00Z',
      datasets_using: ['Energy Patents Q1', 'Manufacturing Innovation'],
      created_by: 'Sarah Admin'
    },
    {
      id: '4',
      field_name: 'legacy_classification',
      field_type: 'CharField',
      field_params: { max_length: 100 },
      display_name: 'Legacy Classification',
      description: 'Old classification system (deprecated)',
      total_records: 23,
      is_active: false,
      migration_applied: true,
      migration_name: '0003_add_legacy_fields_20240115',
      created_at: '2024-01-15T08:45:00Z',
      updated_at: '2024-02-01T14:20:00Z',
      datasets_using: [],
      created_by: 'Migration Script'
    }
  ]);

  const fieldTypes = [
    { value: 'CharField', label: 'Text', color: 'bg-blue-100 text-blue-800' },
    { value: 'IntegerField', label: 'Integer', color: 'bg-green-100 text-green-800' },
    { value: 'FloatField', label: 'Float', color: 'bg-orange-100 text-orange-800' },
    { value: 'DateField', label: 'Date', color: 'bg-purple-100 text-purple-800' },
    { value: 'JSONField', label: 'JSON', color: 'bg-gray-100 text-gray-800' },
  ];

  const filteredFields = fields.filter(field => {
    const matchesSearch = field.field_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      field.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      field.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && field.is_active) ||
      (filterStatus === 'inactive' && !field.is_active) ||
      (filterStatus === 'migrated' && field.migration_applied) ||
      (filterStatus === 'pending' && !field.migration_applied && field.is_active);
    
    const matchesType = filterType === 'all' || field.field_type === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const activeFields = fields.filter(f => f.is_active).length;
  const migratedFields = fields.filter(f => f.migration_applied).length;
  const pendingFields = fields.filter(f => f.is_active && !f.migration_applied).length;
  const totalRecords = fields.reduce((sum, f) => sum + f.total_records, 0);

  const handleMigrateField = async (fieldId: string) => {
    // Simulate migration process
    setMigrationStatus('running');
    setMigrationProgress(0);
    
    const interval = setInterval(() => {
      setMigrationProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setMigrationStatus('completed');
          
          // Update field status
          setFields(fields.map(f => 
            f.id === fieldId 
              ? { ...f, migration_applied: true, migration_name: `migration_${Date.now()}` }
              : f
          ));
          
          setTimeout(() => {
            setMigrationStatus('idle');
            setMigrationProgress(0);
          }, 2000);
          
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const handleBulkMigrate = async () => {
    const pendingFieldIds = fields
      .filter(f => f.is_active && !f.migration_applied)
      .map(f => f.id);
    
    if (pendingFieldIds.length === 0) return;
    
    setShowMigrateDialog(true);
    setMigrationStatus('running');
    setMigrationProgress(0);
    
    const interval = setInterval(() => {
      setMigrationProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setMigrationStatus('completed');
          
          // Update all pending fields
          setFields(fields.map(f => 
            pendingFieldIds.includes(f.id)
              ? { ...f, migration_applied: true, migration_name: `bulk_migration_${Date.now()}` }
              : f
          ));
          
          setTimeout(() => {
            setMigrationStatus('idle');
            setMigrationProgress(0);
            setShowMigrateDialog(false);
          }, 2000);
          
          return 100;
        }
        return prev + 5;
      });
    }, 300);
  };

  const handleArchiveField = (fieldId: string) => {
    if (confirm('Are you sure you want to archive this field? It will be deactivated but data will remain.')) {
      setFields(fields.map(f => 
        f.id === fieldId ? { ...f, is_active: false } : f
      ));
    }
  };

  const handleDeleteField = (fieldId: string) => {
    const field = fields.find(f => f.id === fieldId);
    if (!field) return;
    
    if (field.total_records > 0) {
      alert('Cannot delete field with existing data. Archive it instead.');
      return;
    }
    
    if (confirm('Are you sure you want to permanently delete this field?')) {
      setFields(fields.filter(f => f.id !== fieldId));
    }
  };

  const handleCreateField = () => {
    if (!newField.field_name || !newField.display_name) {
      alert('Field name and display name are required');
      return;
    }
    
    const field: DynamicField = {
      id: Date.now().toString(),
      field_name: newField.field_name.toLowerCase().replace(/\s+/g, '_'),
      field_type: newField.field_type,
      field_params: newField.field_params,
      display_name: newField.display_name,
      description: newField.description,
      total_records: 0,
      is_active: true,
      migration_applied: false,
      migration_name: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      datasets_using: [],
      created_by: 'Current Admin'
    };
    
    setFields([...fields, field]);
    setNewField({
      field_name: '',
      field_type: 'CharField',
      display_name: '',
      description: '',
      field_params: {}
    });
    setShowCreateDialog(false);
  };

  const getStatusBadge = (field: DynamicField) => {
    if (!field.is_active) {
      return <Badge variant="secondary"><Archive className="h-3 w-3 mr-1" />Archived</Badge>;
    }
    if (field.migration_applied) {
      return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Migrated</Badge>;
    }
    return <Badge variant="outline" className="text-orange-600 border-orange-300"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
  };

  const getFieldTypeBadge = (fieldType: string) => {
    const type = fieldTypes.find(t => t.value === fieldType);
    if (!type) return <Badge variant="outline">{fieldType}</Badge>;
    
    return (
      <Badge variant="secondary" className={type.color}>
        <Code className="h-3 w-3 mr-1" />
        {type.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Fields</p>
                <p className="text-2xl font-bold text-blue-600">{activeFields}</p>
              </div>
              <Database className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Migration</p>
                <p className="text-2xl font-bold text-orange-600">{pendingFields}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Migrated</p>
                <p className="text-2xl font-bold text-green-600">{migratedFields}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Records</p>
                <p className="text-2xl font-bold">{totalRecords.toLocaleString()}</p>
              </div>
              <Hash className="h-8 w-8 text-gray-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions and Filters */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search fields..."
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
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Archived</SelectItem>
              <SelectItem value="migrated">Migrated</SelectItem>
              <SelectItem value="pending">Pending Migration</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {fieldTypes.map(type => (
                <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          {pendingFields > 0 && (
            <Button variant="outline" onClick={handleBulkMigrate}>
              <Zap className="h-4 w-4 mr-2" />
              Migrate All ({pendingFields})
            </Button>
          )}
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Field
          </Button>
        </div>
      </div>

      {/* Migration Status Alert */}
      {migrationStatus !== 'idle' && (
        <Alert>
          <Activity className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span>Migrating dynamic fields...</span>
                <span>{migrationProgress}%</span>
              </div>
              <Progress value={migrationProgress} className="w-full" />
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Fields Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Dynamic Fields Registry ({filteredFields.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Field Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Records</TableHead>
                <TableHead>Datasets Using</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFields.map((field) => (
                <TableRow key={field.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{field.display_name}</p>
                      <p className="text-sm text-muted-foreground font-mono">{field.field_name}</p>
                      {field.description && (
                        <p className="text-xs text-muted-foreground mt-1">{field.description}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getFieldTypeBadge(field.field_type)}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(field)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Hash className="h-3 w-3 text-muted-foreground" />
                      <span>{field.total_records.toLocaleString()}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {field.datasets_using.slice(0, 2).map((dataset, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {dataset}
                        </Badge>
                      ))}
                      {field.datasets_using.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{field.datasets_using.length - 2}
                        </Badge>
                      )}
                      {field.datasets_using.length === 0 && (
                        <span className="text-xs text-muted-foreground">None</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>{new Date(field.created_at).toLocaleDateString()}</p>
                      <p className="text-muted-foreground">{field.created_by}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {field.is_active && !field.migration_applied && (
                          <DropdownMenuItem onClick={() => handleMigrateField(field.id)}>
                            <Play className="h-4 w-4 mr-2 text-blue-600" />
                            Migrate Field
                          </DropdownMenuItem>
                        )}
                        
                        {field.is_active && (
                          <DropdownMenuItem onClick={() => handleArchiveField(field.id)}>
                            <Archive className="h-4 w-4 mr-2 text-orange-600" />
                            Archive
                          </DropdownMenuItem>
                        )}
                        
                        <DropdownMenuSeparator />
                        
                        <DropdownMenuItem 
                          onClick={() => handleDeleteField(field.id)}
                          className="text-red-600"
                          disabled={field.total_records > 0}
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
        </CardContent>
      </Card>

      {/* Create Field Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Dynamic Field</DialogTitle>
            <DialogDescription>
              Add a new dynamic field to the PatentRecord model.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="field_name">Field Name</Label>
              <Input
                id="field_name"
                value={newField.field_name}
                onChange={(e) => setNewField({...newField, field_name: e.target.value})}
                placeholder="e.g., innovation_score"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="display_name">Display Name</Label>
              <Input
                id="display_name"
                value={newField.display_name}
                onChange={(e) => setNewField({...newField, display_name: e.target.value})}
                placeholder="e.g., Innovation Score"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="field_type">Field Type</Label>
              <Select
                value={newField.field_type}
                onValueChange={(value) => setNewField({...newField, field_type: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fieldTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newField.description}
                onChange={(e) => setNewField({...newField, description: e.target.value})}
                placeholder="Describe what this field represents..."
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateField}>
              Create Field
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Migration Progress Dialog */}
      <Dialog open={showMigrateDialog} onOpenChange={setShowMigrateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Migrating Dynamic Fields</DialogTitle>
            <DialogDescription>
              Applying database migrations for all pending dynamic fields...
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Migration Progress</span>
              <span>{migrationProgress}%</span>
            </div>
            <Progress value={migrationProgress} className="w-full" />
            
            {migrationStatus === 'completed' && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  All dynamic fields have been successfully migrated!
                </AlertDescription>
              </Alert>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}