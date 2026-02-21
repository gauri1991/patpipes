/**
 * Cross-Reference Management System
 * Automatic figure/claim/section reference management with validation
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Target,
  Image,
  Scale,
  FileText,
  Plus,
  Edit,
  Trash2,
  Search,
  CheckCircle,
  AlertTriangle,
  Link,
  ExternalLink,
  Hash
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface CrossReference {
  id: string;
  type: 'figure' | 'claim' | 'section' | 'citation';
  number: string | number;
  label: string;
  description?: string;
  usages: Array<{
    sectionId: string;
    sectionName: string;
    lineNumber: number;
    context: string;
  }>;
  status: 'valid' | 'missing' | 'orphaned';
  created: string;
  updated: string;
}

interface CrossReferenceManagerProps {
  documentId: string;
  content: Record<string, string>;
  onReferenceInsert: (reference: string, sectionId: string) => void;
  onReferenceUpdate: (references: CrossReference[]) => void;
}

// Mock data for demonstration
const mockReferences: CrossReference[] = [
  {
    id: '1',
    type: 'figure',
    number: 1,
    label: 'System Architecture Overview',
    description: 'Block diagram showing the overall system architecture with main components',
    usages: [
      {
        sectionId: 'description',
        sectionName: 'Detailed Description',
        lineNumber: 15,
        context: 'As shown in FIG. 1, the system comprises...'
      },
      {
        sectionId: 'claims',
        sectionName: 'Claims',
        lineNumber: 3,
        context: 'The system of FIG. 1 further includes...'
      }
    ],
    status: 'valid',
    created: '2024-01-15',
    updated: '2024-01-15'
  },
  {
    id: '2',
    type: 'claim',
    number: 1,
    label: 'Independent System Claim',
    description: 'Main independent claim defining the invention',
    usages: [
      {
        sectionId: 'claims',
        sectionName: 'Claims',
        lineNumber: 8,
        context: 'The system of claim 1, wherein...'
      },
      {
        sectionId: 'claims',
        sectionName: 'Claims',
        lineNumber: 12,
        context: 'The method of claim 1, further comprising...'
      }
    ],
    status: 'valid',
    created: '2024-01-15',
    updated: '2024-01-15'
  },
  {
    id: '3',
    type: 'figure',
    number: 3,
    label: 'Missing Figure',
    description: 'Referenced but not uploaded',
    usages: [
      {
        sectionId: 'description',
        sectionName: 'Detailed Description',
        lineNumber: 45,
        context: 'Referring to FIG. 3, the process...'
      }
    ],
    status: 'missing',
    created: '2024-01-15',
    updated: '2024-01-15'
  }
];

export default function CrossReferenceManager({
  documentId,
  content,
  onReferenceInsert,
  onReferenceUpdate
}: CrossReferenceManagerProps) {
  const [references, setReferences] = useState<CrossReference[]>(mockReferences);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newReference, setNewReference] = useState<Partial<CrossReference>>({
    type: 'figure',
    number: '',
    label: '',
    description: ''
  });
  const [autoScanEnabled, setAutoScanEnabled] = useState(true);

  // Auto-scan content for references
  const scanContentForReferences = useCallback(() => {
    if (!autoScanEnabled) return;

    const patterns = {
      figure: /(?:FIG\.|FIGURE)\s*(\d+)/gi,
      claim: /claim\s+(\d+)/gi,
      section: /section\s+(\d+(?:\.\d+)*)/gi,
      citation: /\[(\d+)\]/gi
    };

    const foundReferences: Array<{
      type: keyof typeof patterns;
      number: string;
      sectionId: string;
      sectionName: string;
      lineNumber: number;
      context: string;
    }> = [];

    Object.entries(content).forEach(([sectionId, sectionContent]) => {
      const lines = sectionContent.split('\n');
      
      Object.entries(patterns).forEach(([type, pattern]) => {
        lines.forEach((line, index) => {
          let match;
          while ((match = pattern.exec(line)) !== null) {
            foundReferences.push({
              type: type as keyof typeof patterns,
              number: match[1],
              sectionId,
              sectionName: getSectionName(sectionId),
              lineNumber: index + 1,
              context: line.trim()
            });
          }
        });
      });
    });

    // Update references with found usages
    setReferences(prev => {
      const updated = [...prev];
      
      foundReferences.forEach(found => {
        const existingRef = updated.find(ref => 
          ref.type === found.type && ref.number.toString() === found.number
        );
        
        if (existingRef) {
          // Update usages
          const usage = {
            sectionId: found.sectionId,
            sectionName: found.sectionName,
            lineNumber: found.lineNumber,
            context: found.context
          };
          
          const existingUsage = existingRef.usages.find(u => 
            u.sectionId === usage.sectionId && u.lineNumber === usage.lineNumber
          );
          
          if (!existingUsage) {
            existingRef.usages.push(usage);
            existingRef.updated = new Date().toISOString();
          }
        } else {
          // Create new reference
          const newRef: CrossReference = {
            id: Date.now().toString() + Math.random(),
            type: found.type,
            number: found.number,
            label: `${found.type.charAt(0).toUpperCase() + found.type.slice(1)} ${found.number}`,
            usages: [{
              sectionId: found.sectionId,
              sectionName: found.sectionName,
              lineNumber: found.lineNumber,
              context: found.context
            }],
            status: 'valid',
            created: new Date().toISOString(),
            updated: new Date().toISOString()
          };
          updated.push(newRef);
        }
      });
      
      return updated;
    });
  }, [content, autoScanEnabled]);

  useEffect(() => {
    scanContentForReferences();
  }, [scanContentForReferences]);

  const getSectionName = (sectionId: string): string => {
    const sectionNames: Record<string, string> = {
      title: 'Title',
      field: 'Technical Field',
      background: 'Background',
      summary: 'Summary',
      drawings: 'Drawings',
      description: 'Detailed Description',
      claims: 'Claims',
      abstract: 'Abstract'
    };
    return sectionNames[sectionId] || sectionId;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid': return 'bg-green-100 text-green-800';
      case 'missing': return 'bg-red-100 text-red-800';
      case 'orphaned': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'missing': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'orphaned': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default: return null;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'figure': return <Image className="h-4 w-4" />;
      case 'claim': return <Scale className="h-4 w-4" />;
      case 'section': return <FileText className="h-4 w-4" />;
      case 'citation': return <ExternalLink className="h-4 w-4" />;
      default: return <Hash className="h-4 w-4" />;
    }
  };

  const handleAddReference = () => {
    if (!newReference.type || !newReference.number || !newReference.label) return;

    const reference: CrossReference = {
      id: Date.now().toString(),
      type: newReference.type as any,
      number: newReference.number,
      label: newReference.label,
      description: newReference.description,
      usages: [],
      status: 'valid',
      created: new Date().toISOString(),
      updated: new Date().toISOString()
    };

    setReferences(prev => [...prev, reference]);
    setNewReference({
      type: 'figure',
      number: '',
      label: '',
      description: ''
    });
    setShowAddDialog(false);
    onReferenceUpdate([...references, reference]);
  };

  const handleInsertReference = (reference: CrossReference) => {
    let referenceText = '';
    
    switch (reference.type) {
      case 'figure':
        referenceText = `FIG. ${reference.number}`;
        break;
      case 'claim':
        referenceText = `claim ${reference.number}`;
        break;
      case 'section':
        referenceText = `Section ${reference.number}`;
        break;
      case 'citation':
        referenceText = `[${reference.number}]`;
        break;
    }
    
    onReferenceInsert(referenceText, 'current');
  };

  const filteredReferences = references.filter(ref => {
    const matchesType = selectedType === 'all' || ref.type === selectedType;
    const matchesSearch = !searchQuery || 
      ref.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ref.number.toString().includes(searchQuery) ||
      (ref.description && ref.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesType && matchesSearch;
  });

  const validCount = references.filter(r => r.status === 'valid').length;
  const missingCount = references.filter(r => r.status === 'missing').length;
  const orphanedCount = references.filter(r => r.status === 'orphaned').length;

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            <h3 className="font-medium">Cross References</h3>
            <Badge variant="outline">{references.length}</Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoScanEnabled(!autoScanEnabled)}
              className={autoScanEnabled ? 'bg-green-50' : ''}
            >
              {autoScanEnabled ? 'Auto-scan On' : 'Auto-scan Off'}
            </Button>

            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Reference
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Cross Reference</DialogTitle>
                  <DialogDescription>
                    Create a new cross-reference for figures, claims, sections, or citations
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select 
                        value={newReference.type} 
                        onValueChange={(value) => setNewReference(prev => ({ ...prev, type: value as any }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="figure">Figure</SelectItem>
                          <SelectItem value="claim">Claim</SelectItem>
                          <SelectItem value="section">Section</SelectItem>
                          <SelectItem value="citation">Citation</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Number</Label>
                      <Input 
                        value={newReference.number}
                        onChange={(e) => setNewReference(prev => ({ ...prev, number: e.target.value }))}
                        placeholder="1, 2, 3..."
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Label</Label>
                    <Input 
                      value={newReference.label}
                      onChange={(e) => setNewReference(prev => ({ ...prev, label: e.target.value }))}
                      placeholder="Descriptive label for this reference"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Description (Optional)</Label>
                    <Input 
                      value={newReference.description}
                      onChange={(e) => setNewReference(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Additional description..."
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddReference}>
                      Add Reference
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          <Card className="p-3">
            <div className="text-center">
              <div className="text-lg font-semibold text-green-600">{validCount}</div>
              <div className="text-xs text-muted-foreground">Valid</div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="text-center">
              <div className="text-lg font-semibold text-red-600">{missingCount}</div>
              <div className="text-xs text-muted-foreground">Missing</div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="text-center">
              <div className="text-lg font-semibold text-yellow-600">{orphanedCount}</div>
              <div className="text-xs text-muted-foreground">Orphaned</div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="text-center">
              <div className="text-lg font-semibold">{references.reduce((sum, ref) => sum + ref.usages.length, 0)}</div>
              <div className="text-xs text-muted-foreground">Usages</div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search references..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="figure">Figures</SelectItem>
              <SelectItem value="claim">Claims</SelectItem>
              <SelectItem value="section">Sections</SelectItem>
              <SelectItem value="citation">Citations</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* References List */}
        <div className="space-y-2 max-h-96 overflow-auto">
          {filteredReferences.map((reference) => (
            <Card key={reference.id} className="p-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="flex items-center gap-2 mt-1">
                    {getTypeIcon(reference.type)}
                    <span className="font-mono text-sm">{reference.type.toUpperCase()} {reference.number}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium truncate">{reference.label}</span>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(reference.status)}
                        <Badge variant="outline" className={getStatusColor(reference.status)}>
                          {reference.status}
                        </Badge>
                      </div>
                    </div>

                    {reference.description && (
                      <p className="text-xs text-muted-foreground mb-2">{reference.description}</p>
                    )}

                    <div className="text-xs text-muted-foreground">
                      {reference.usages.length} usage{reference.usages.length !== 1 ? 's' : ''} • 
                      Updated {new Date(reference.updated).toLocaleDateString()}
                    </div>

                    {reference.usages.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {reference.usages.slice(0, 2).map((usage, index) => (
                          <div key={index} className="text-xs bg-muted/50 rounded p-2">
                            <div className="font-medium">{usage.sectionName} (Line {usage.lineNumber})</div>
                            <div className="text-muted-foreground truncate">{usage.context}</div>
                          </div>
                        ))}
                        {reference.usages.length > 2 && (
                          <div className="text-xs text-muted-foreground">
                            +{reference.usages.length - 2} more usage{reference.usages.length - 2 !== 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 ml-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => handleInsertReference(reference)}
                      >
                        <Link className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Insert Reference</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Edit className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Edit Reference</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-red-600 hover:text-red-700"
                        onClick={() => setReferences(prev => prev.filter(r => r.id !== reference.id))}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Delete Reference</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </Card>
          ))}

          {filteredReferences.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No cross-references found</p>
              <p className="text-xs">Add references or enable auto-scan to populate this list</p>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}