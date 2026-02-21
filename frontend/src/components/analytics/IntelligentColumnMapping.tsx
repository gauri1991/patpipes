'use client';

import { useState, useEffect } from 'react';
import { 
  ArrowRight,
  Check,
  X,
  AlertTriangle,
  Brain,
  FileText,
  Settings,
  Sparkles,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Eye,
  Edit3,
  AlertCircle,
  CheckCircle2,
  Clock,
  Zap
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { toast } from 'sonner';

import { 
  PatentDataset, 
  ColumnMapping, 
  ColumnMappingAnalysis, 
  MappingConflict,
  MappingApplicationResult,
  analyticsApi 
} from '@/services/analyticsApi';

interface IntelligentColumnMappingProps {
  dataset: PatentDataset;
  isOpen: boolean;
  onClose: () => void;
  onMappingComplete?: (result: MappingApplicationResult) => void;
}

export function IntelligentColumnMapping({ 
  dataset, 
  isOpen, 
  onClose, 
  onMappingComplete 
}: IntelligentColumnMappingProps) {
  const [analysis, setAnalysis] = useState<ColumnMappingAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [selectedMappings, setSelectedMappings] = useState<ColumnMapping[]>([]);
  const [expandedConflicts, setExpandedConflicts] = useState<Set<string>>(new Set());
  const [editingMapping, setEditingMapping] = useState<string | null>(null);
  const [customMappings, setCustomMappings] = useState<Record<string, Partial<ColumnMapping>>>({});
  const [dynamicConflicts, setDynamicConflicts] = useState<MappingConflict[]>([]);

  useEffect(() => {
    if (isOpen && dataset.id) {
      analyzeColumns();
    }
  }, [isOpen, dataset.id]);

  const analyzeColumns = async () => {
    try {
      setLoading(true);
      const response = await analyticsApi.analyzeDatasetColumns(dataset.id);
      
      if (response.success && response.data) {
        setAnalysis(response.data);
        setSelectedMappings([...response.data.matches]);
        // Initialize dynamic conflicts from the initial analysis
        setDynamicConflicts(response.data.conflicts || []);
        toast.success(`Analyzed ${response.data.total_columns} columns with intelligent mapping`);
      } else {
        toast.error(response.error || 'Failed to analyze columns');
      }
    } catch (error) {
      toast.error('Error analyzing columns');
    } finally {
      setLoading(false);
    }
  };

  const handleMappingChange = (sourceColumn: string, field: keyof ColumnMapping, value: any) => {
    setSelectedMappings(prev => 
      prev.map(mapping => 
        mapping.source_column === sourceColumn 
          ? { ...mapping, [field]: value }
          : mapping
      )
    );
  };

  const handleRemoveMapping = (sourceColumn: string) => {
    setSelectedMappings(prev => 
      prev.filter(mapping => mapping.source_column !== sourceColumn)
    );
  };

  // Dynamic conflict detection - recalculates conflicts when mappings change
  const calculateDynamicConflicts = (mappings: ColumnMapping[]): MappingConflict[] => {
    const targetFieldGroups: Record<string, { columns: string[], scores: number[] }> = {};
    
    // Group mappings by target field
    mappings.forEach(mapping => {
      if (!targetFieldGroups[mapping.target_field]) {
        targetFieldGroups[mapping.target_field] = { columns: [], scores: [] };
      }
      targetFieldGroups[mapping.target_field].columns.push(mapping.source_column);
      targetFieldGroups[mapping.target_field].scores.push(mapping.confidence_score);
    });
    
    // Find conflicts (multiple columns mapping to same target)
    const conflicts: MappingConflict[] = [];
    Object.entries(targetFieldGroups).forEach(([targetField, group]) => {
      if (group.columns.length > 1) {
        conflicts.push({
          target_field: targetField,
          conflicting_columns: group.columns,
          confidence_scores: group.scores,
          suggested_resolution: `Keep the column with highest confidence (${Math.max(...group.scores).toFixed(1)}%)`
        });
      }
    });
    
    return conflicts;
  };

  // Recalculate conflicts whenever selectedMappings changes
  useEffect(() => {
    if (selectedMappings.length > 0) {
      const newConflicts = calculateDynamicConflicts(selectedMappings);
      setDynamicConflicts(newConflicts);
    } else {
      setDynamicConflicts([]);
    }
  }, [selectedMappings]);

  const handleApplyMappings = async () => {
    if (selectedMappings.length === 0) {
      toast.error('No mappings selected to apply');
      return;
    }

    try {
      setApplying(true);
      const response = await analyticsApi.applyColumnMappings(dataset.id, selectedMappings);
      
      if (response.success && response.data) {
        toast.success(
          `Successfully applied ${response.data.applied_mappings} mappings` +
          (response.data.dynamic_fields_created > 0 
            ? ` and created ${response.data.dynamic_fields_created} dynamic fields` 
            : '')
        );
        
        if (onMappingComplete) {
          onMappingComplete(response.data);
        }
        
        onClose();
      } else {
        toast.error(response.error || 'Failed to apply mappings');
      }
    } catch (error) {
      toast.error('Error applying mappings');
    } finally {
      setApplying(false);
    }
  };

  const getConfidenceBadge = (score: number) => {
    if (score >= 90) {
      return <Badge className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" />High ({score.toFixed(1)}%)</Badge>;
    } else if (score >= 70) {
      return <Badge variant="secondary"><AlertCircle className="w-3 h-3 mr-1" />Medium ({score.toFixed(1)}%)</Badge>;
    } else {
      return <Badge variant="destructive"><Clock className="w-3 h-3 mr-1" />Low ({score.toFixed(1)}%)</Badge>;
    }
  };

  const getFieldTypeBadge = (fieldType: string, isCore: boolean) => {
    const color = isCore ? "bg-blue-500" : "bg-purple-500";
    const icon = isCore ? <Settings className="w-3 h-3 mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />;
    return <Badge className={color}>{icon}{fieldType}</Badge>;
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 animate-pulse text-blue-500" />
              Analyzing Column Mappings...
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-8">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mb-4" />
            <p className="text-muted-foreground">
              Using AI to analyze your Excel columns and suggest intelligent mappings...
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!analysis) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-500" />
            Intelligent Column Mapping
          </DialogTitle>
          <DialogDescription>
            AI-powered analysis found {analysis.matches.length} mapping suggestions for {dataset.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Analysis Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                Analysis Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{analysis.high_confidence_count}</div>
                  <div className="text-sm text-muted-foreground">High Confidence</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{analysis.medium_confidence_count}</div>
                  <div className="text-sm text-muted-foreground">Medium Confidence</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{analysis.low_confidence_count}</div>
                  <div className="text-sm text-muted-foreground">Low Confidence</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">{analysis.unmapped_columns.length}</div>
                  <div className="text-sm text-muted-foreground">Unmapped</div>
                </div>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{ width: `${(analysis.high_confidence_count / analysis.total_columns) * 100}%` }}
                />
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {Math.round((analysis.high_confidence_count / analysis.total_columns) * 100)}% high confidence mappings
              </p>
            </CardContent>
          </Card>

          {/* Conflicts Alert - Using dynamic conflicts */}
          {dynamicConflicts.length > 0 ? (
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-orange-700">
                  <AlertTriangle className="w-5 h-5" />
                  Mapping Conflicts Detected
                </CardTitle>
                <CardDescription>
                  {dynamicConflicts.length} conflicts need resolution before applying mappings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {dynamicConflicts.map((conflict, index) => (
                  <Collapsible key={index}>
                    <CollapsibleTrigger 
                      className="flex items-center justify-between w-full p-2 hover:bg-orange-100 rounded"
                      onClick={() => {
                        const newExpanded = new Set(expandedConflicts);
                        if (newExpanded.has(`conflict-${index}`)) {
                          newExpanded.delete(`conflict-${index}`);
                        } else {
                          newExpanded.add(`conflict-${index}`);
                        }
                        setExpandedConflicts(newExpanded);
                      }}
                    >
                      <div className="flex items-center gap-2">
                        {expandedConflicts.has(`conflict-${index}`) ? 
                          <ChevronDown className="w-4 h-4" /> : 
                          <ChevronRight className="w-4 h-4" />
                        }
                        <span className="font-medium">
                          Multiple columns mapping to "{conflict.target_field}"
                        </span>
                      </div>
                      <Badge variant="outline">
                        {conflict.conflicting_columns.length} columns
                      </Badge>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-6 py-2">
                      <div className="space-y-2">
                        {conflict.conflicting_columns.map((column, colIndex) => (
                          <div key={colIndex} className="flex items-center justify-between p-2 bg-white rounded border">
                            <span className="font-medium">{column}</span>
                            <Badge variant="secondary">
                              {conflict.confidence_scores[colIndex]?.toFixed(1)}% confidence
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </CardContent>
            </Card>
          ) : (
            analysis && analysis.conflicts.length > 0 && (
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-green-700">
                    <CheckCircle2 className="w-5 h-5" />
                    All Conflicts Resolved
                  </CardTitle>
                  <CardDescription>
                    Great! All mapping conflicts have been resolved. You can now apply the mappings.
                  </CardDescription>
                </CardHeader>
              </Card>
            )
          )}

          {/* Mapping Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Column Mappings ({selectedMappings.length})
                </div>
                <Button variant="outline" onClick={analyzeColumns} disabled={loading}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Re-analyze
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Source Column</TableHead>
                    <TableHead>Target Field</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Field Type</TableHead>
                    <TableHead>Sample Values</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedMappings.map((mapping, index) => (
                    <TableRow key={mapping.source_column}>
                      <TableCell className="font-medium">
                        {mapping.source_column}
                      </TableCell>
                      <TableCell>
                        {editingMapping === mapping.source_column ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={mapping.target_field}
                              onChange={(e) => handleMappingChange(mapping.source_column, 'target_field', e.target.value)}
                              className="w-40"
                            />
                            <Button 
                              size="sm" 
                              onClick={() => setEditingMapping(null)}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span>{mapping.target_field}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingMapping(mapping.source_column)}
                            >
                              <Edit3 className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {getConfidenceBadge(mapping.confidence_score)}
                      </TableCell>
                      <TableCell>
                        {editingMapping === mapping.source_column ? (
                          <Select
                            value={mapping.suggested_field_type}
                            onValueChange={(value) => handleMappingChange(mapping.source_column, 'suggested_field_type', value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="CharField">Text</SelectItem>
                              <SelectItem value="TextField">Long Text</SelectItem>
                              <SelectItem value="DateField">Date</SelectItem>
                              <SelectItem value="IntegerField">Integer</SelectItem>
                              <SelectItem value="FloatField">Float</SelectItem>
                              <SelectItem value="BooleanField">Boolean</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          getFieldTypeBadge(mapping.suggested_field_type, mapping.is_core_field)
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-48 truncate text-sm text-muted-foreground">
                          {mapping.sample_values.slice(0, 3).join(', ')}
                          {mapping.sample_values.length > 3 && '...'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              // Show sample values in detail
                              toast.info(`Sample values: ${mapping.sample_values.join(', ')}`);
                            }}
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveMapping(mapping.source_column)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {analysis.unmapped_columns.length > 0 && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">Unmapped Columns ({analysis.unmapped_columns.length})</h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis.unmapped_columns.map((column) => (
                      <Badge key={column} variant="outline" className="text-gray-600">
                        {column}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    These columns will be ignored during processing or you can create custom mappings for them.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {selectedMappings.length} mappings ready to apply
              {dynamicConflicts.length > 0 && (
                <span className="text-orange-600 ml-2">
                  • Resolve {dynamicConflicts.length} conflicts first
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleApplyMappings}
                disabled={applying || selectedMappings.length === 0 || dynamicConflicts.length > 0}
              >
                {applying ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Applying Mappings...
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Apply {selectedMappings.length} Mappings
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}