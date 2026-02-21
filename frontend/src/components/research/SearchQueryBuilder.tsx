/**
 * SearchQueryBuilder Component
 * Interface for building patent search queries with advanced filters
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Minus,
  Calendar,
  Globe,
  Building,
  User,
  Hash,
  FileText,
  HelpCircle,
  X
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { PatentAPI } from '@/services/patentApiConfigService';

interface SearchQueryBuilderProps {
  projectId: string;
  availableAPIs: PatentAPI[];
  onClose: () => void;
  onSubmit: (queryData: any) => Promise<void>;
  onFormChange?: (formData: any) => void;
  inline?: boolean;
  initialData?: {
    query_name?: string;
    description?: string;
    keywords?: string;
    ipc_classes?: string[];
    cpc_classes?: string[];
    assignees?: string[];
    inventors?: string[];
  };
}

export function SearchQueryBuilder({ 
  projectId, 
  availableAPIs, 
  onClose, 
  onSubmit,
  onFormChange,
  inline = false,
  initialData
}: SearchQueryBuilderProps) {
  const [formData, setFormData] = useState({
    query_name: initialData?.query_name || '',
    description: initialData?.description || '',
    api_source: 'uspto',
    keywords: initialData?.keywords || '',
    ipc_classes: initialData?.ipc_classes || [] as string[],
    cpc_classes: initialData?.cpc_classes || [] as string[],
    assignees: initialData?.assignees || [] as string[],
    inventors: initialData?.inventors || [] as string[],
    date_range: {
      from_date: '',
      to_date: ''
    },
    geographic_scope: [] as string[]
  });

  const [newIPC, setNewIPC] = useState('');
  const [newCPC, setNewCPC] = useState('');
  const [newAssignee, setNewAssignee] = useState('');
  const [newInventor, setNewInventor] = useState('');
  const [newCountry, setNewCountry] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-save form data when it changes
  useEffect(() => {
    if (onFormChange) {
      onFormChange(formData);
    }
  }, [formData, onFormChange]);

  // Common IPC classes for suggestions
  const commonIPCs = [
    { code: 'G06F', description: 'Electric digital data processing' },
    { code: 'A61K', description: 'Preparations for medical, dental, or toilet purposes' },
    { code: 'C07D', description: 'Heterocyclic compounds' },
    { code: 'H01L', description: 'Semiconductor devices' },
    { code: 'G01N', description: 'Investigating or analyzing materials' },
    { code: 'B01J', description: 'Chemical or physical processes' },
  ];

  // Geographic regions for suggestions
  const countries = [
    'US', 'EP', 'JP', 'CN', 'KR', 'GB', 'DE', 'FR', 'CA', 'AU'
  ];

  const handleAddItem = (field: string, value: string, setter: (value: string) => void) => {
    if (value.trim()) {
      setFormData(prev => ({
        ...prev,
        [field]: [...(prev[field as keyof typeof prev] as string[]), value.trim()]
      }));
      setter('');
    }
  };

  const handleRemoveItem = (field: string, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field as keyof typeof prev] as string[]).filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.query_name.trim()) {
      return;
    }

    // Validate at least one search criteria
    const hasSearchCriteria = 
      formData.keywords.trim() ||
      formData.assignees.length > 0 ||
      formData.inventors.length > 0 ||
      formData.ipc_classes.length > 0 ||
      formData.cpc_classes.length > 0;

    if (!hasSearchCriteria) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedAPI = availableAPIs.find(api => api.name === formData.api_source);

  // Render inline version (without dialog wrapper)
  if (inline) {
    return (
      <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="query_name">Query Name *</Label>
                  <Input
                    id="query_name"
                    value={formData.query_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, query_name: e.target.value }))}
                    placeholder="e.g., AI Machine Learning Patents"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="api_source">Patent Database *</Label>
                  <Select 
                    value={formData.api_source} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, api_source: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableAPIs.filter(api => api.is_active).map(api => (
                        <SelectItem key={api.id} value={api.name}>
                          <div className="flex items-center justify-between w-full">
                            <span>{api.display_name}</span>
                            {!api.is_configured && (
                              <Badge variant="secondary" className="ml-2 text-xs">
                                Not Configured
                              </Badge>
                            )}
                            {api.source_type === 'admin_configured' && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                Custom
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the purpose and scope of this search..."
                  rows={2}
                />
              </div>

              {selectedAPI && (
                <div className="p-3 bg-blue-50 rounded-lg border">
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-900">{selectedAPI.name}</p>
                      <p className="text-sm text-blue-700">{selectedAPI.description}</p>
                      {selectedAPI.rate_limit && (
                        <p className="text-xs text-blue-600 mt-1">
                          Rate limit: {selectedAPI.rate_limit.requests_per_minute}/min, {selectedAPI.rate_limit.requests_per_day}/day
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Search Criteria */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                Search Criteria
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>At least one search criteria must be provided</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Keywords */}
              <div className="space-y-2">
                <Label htmlFor="keywords" className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Keywords & Phrases
                </Label>
                <Textarea
                  id="keywords"
                  value={formData.keywords}
                  onChange={(e) => setFormData(prev => ({ ...prev, keywords: e.target.value }))}
                  placeholder="e.g., artificial intelligence, machine learning, neural network"
                  rows={2}
                />
                <p className="text-xs text-muted-foreground">
                  Search in patent titles and abstracts. Use quotes for exact phrases.
                </p>
              </div>

              {/* IPC Classifications */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  IPC Classifications
                </Label>
                
                <div className="flex gap-2">
                  <Input
                    value={newIPC}
                    onChange={(e) => setNewIPC(e.target.value)}
                    placeholder="e.g., G06F, A61K"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddItem('ipc_classes', newIPC, setNewIPC))}
                  />
                  <Button 
                    type="button" 
                    size="sm" 
                    onClick={() => handleAddItem('ipc_classes', newIPC, setNewIPC)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {formData.ipc_classes.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.ipc_classes.map((ipc, index) => (
                      <Badge key={index} variant="secondary" className="gap-1">
                        {ipc}
                        <X 
                          className="h-3 w-3 cursor-pointer" 
                          onClick={() => handleRemoveItem('ipc_classes', index)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Common IPC suggestions */}
                <div className="flex flex-wrap gap-2">
                  {commonIPCs.map(({ code, description }) => (
                    <Button
                      key={code}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => {
                        if (!formData.ipc_classes.includes(code)) {
                          handleAddItem('ipc_classes', code, () => {});
                        }
                      }}
                    >
                      {code}
                    </Button>
                  ))}
                </div>
              </div>

              {/* CPC Classifications */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  CPC Classifications
                </Label>
                
                <div className="flex gap-2">
                  <Input
                    value={newCPC}
                    onChange={(e) => setNewCPC(e.target.value)}
                    placeholder="e.g., G06F17/30, A61K31/00"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddItem('cpc_classes', newCPC, setNewCPC))}
                  />
                  <Button 
                    type="button" 
                    size="sm" 
                    onClick={() => handleAddItem('cpc_classes', newCPC, setNewCPC)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {formData.cpc_classes.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.cpc_classes.map((cpc, index) => (
                      <Badge key={index} variant="secondary" className="gap-1">
                        {cpc}
                        <X 
                          className="h-3 w-3 cursor-pointer" 
                          onClick={() => handleRemoveItem('cpc_classes', index)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* Assignees */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Patent Assignees (Companies/Organizations)
                </Label>
                
                <div className="flex gap-2">
                  <Input
                    value={newAssignee}
                    onChange={(e) => setNewAssignee(e.target.value)}
                    placeholder="e.g., Google Inc, Microsoft Corporation"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddItem('assignees', newAssignee, setNewAssignee))}
                  />
                  <Button 
                    type="button" 
                    size="sm" 
                    onClick={() => handleAddItem('assignees', newAssignee, setNewAssignee)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {formData.assignees.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.assignees.map((assignee, index) => (
                      <Badge key={index} variant="outline" className="gap-1">
                        {assignee}
                        <X 
                          className="h-3 w-3 cursor-pointer" 
                          onClick={() => handleRemoveItem('assignees', index)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Inventors */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Patent Inventors
                </Label>
                
                <div className="flex gap-2">
                  <Input
                    value={newInventor}
                    onChange={(e) => setNewInventor(e.target.value)}
                    placeholder="e.g., John Smith, Jane Doe"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddItem('inventors', newInventor, setNewInventor))}
                  />
                  <Button 
                    type="button" 
                    size="sm" 
                    onClick={() => handleAddItem('inventors', newInventor, setNewInventor)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {formData.inventors.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.inventors.map((inventor, index) => (
                      <Badge key={index} variant="outline" className="gap-1">
                        {inventor}
                        <X 
                          className="h-3 w-3 cursor-pointer" 
                          onClick={() => handleRemoveItem('inventors', index)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Additional Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Additional Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Date Range */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Publication Date Range
                </Label>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="from_date" className="text-sm text-muted-foreground">From Date</Label>
                    <Input
                      id="from_date"
                      type="date"
                      value={formData.date_range.from_date}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        date_range: { ...prev.date_range, from_date: e.target.value }
                      }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="to_date" className="text-sm text-muted-foreground">To Date</Label>
                    <Input
                      id="to_date"
                      type="date"
                      value={formData.date_range.to_date}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        date_range: { ...prev.date_range, to_date: e.target.value }
                      }))}
                    />
                  </div>
                </div>
              </div>

              {/* Geographic Scope */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Geographic Scope
                </Label>
                
                <div className="flex gap-2">
                  <Select value={newCountry} onValueChange={setNewCountry}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map(country => (
                        <SelectItem key={country} value={country}>
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    type="button" 
                    size="sm" 
                    onClick={() => {
                      if (newCountry && !formData.geographic_scope.includes(newCountry)) {
                        handleAddItem('geographic_scope', newCountry, setNewCountry);
                      }
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {formData.geographic_scope.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.geographic_scope.map((country, index) => (
                      <Badge key={index} variant="outline" className="gap-1">
                        {country}
                        <X 
                          className="h-3 w-3 cursor-pointer" 
                          onClick={() => handleRemoveItem('geographic_scope', index)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Inline Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button 
              variant="secondary"
              disabled={!formData.query_name.trim()}
              onClick={() => {
                // Save logic here - could save to localStorage or call an API
                console.log('Saving search query:', formData);
                // You can add actual save functionality here
              }}
            >
              <FileText className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Button 
              type="submit"
              disabled={
                isSubmitting || 
                !formData.query_name.trim() ||
                (!formData.keywords.trim() && 
                 formData.assignees.length === 0 && 
                 formData.inventors.length === 0 && 
                 formData.ipc_classes.length === 0 && 
                 formData.cpc_classes.length === 0)
              }
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Search className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Creating Query...' : 'Create Query'}
            </Button>
          </div>
        </form>
      );
    }

  // Render dialog version (existing modal)
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Create Patent Search Query
          </DialogTitle>
          <DialogDescription>
            Build a comprehensive search query to discover relevant patents from patent databases.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="query_name">Query Name *</Label>
                  <Input
                    id="query_name"
                    value={formData.query_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, query_name: e.target.value }))}
                    placeholder="e.g., AI Machine Learning Patents"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="api_source">Patent Database *</Label>
                  <Select 
                    value={formData.api_source} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, api_source: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableAPIs.filter(api => api.is_active).map(api => (
                        <SelectItem key={api.id} value={api.name}>
                          <div className="flex items-center justify-between w-full">
                            <span>{api.display_name}</span>
                            {!api.is_configured && (
                              <Badge variant="secondary" className="ml-2 text-xs">
                                Not Configured
                              </Badge>
                            )}
                            {api.source_type === 'admin_configured' && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                Custom
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the purpose and scope of this search..."
                  rows={2}
                />
              </div>

              {selectedAPI && (
                <div className="p-3 bg-blue-50 rounded-lg border">
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-900">{selectedAPI.name}</p>
                      <p className="text-sm text-blue-700">{selectedAPI.description}</p>
                      {selectedAPI.rate_limit && (
                        <p className="text-xs text-blue-600 mt-1">
                          Rate limit: {selectedAPI.rate_limit.requests_per_minute}/min, {selectedAPI.rate_limit.requests_per_day}/day
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Search Criteria */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                Search Criteria
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>At least one search criteria must be provided</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Keywords */}
              <div className="space-y-2">
                <Label htmlFor="keywords" className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Keywords & Phrases
                </Label>
                <Textarea
                  id="keywords"
                  value={formData.keywords}
                  onChange={(e) => setFormData(prev => ({ ...prev, keywords: e.target.value }))}
                  placeholder="e.g., artificial intelligence, machine learning, neural network"
                  rows={2}
                />
                <p className="text-xs text-muted-foreground">
                  Search in patent titles and abstracts. Use quotes for exact phrases.
                </p>
              </div>

              {/* IPC Classifications */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  IPC Classifications
                </Label>
                
                <div className="flex gap-2">
                  <Input
                    value={newIPC}
                    onChange={(e) => setNewIPC(e.target.value)}
                    placeholder="e.g., G06F, A61K"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddItem('ipc_classes', newIPC, setNewIPC))}
                  />
                  <Button 
                    type="button" 
                    size="sm" 
                    onClick={() => handleAddItem('ipc_classes', newIPC, setNewIPC)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {formData.ipc_classes.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.ipc_classes.map((ipc, index) => (
                      <Badge key={index} variant="secondary" className="gap-1">
                        {ipc}
                        <X 
                          className="h-3 w-3 cursor-pointer" 
                          onClick={() => handleRemoveItem('ipc_classes', index)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Common IPC suggestions */}
                <div className="flex flex-wrap gap-2">
                  {commonIPCs.map(({ code, description }) => (
                    <Button
                      key={code}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => {
                        if (!formData.ipc_classes.includes(code)) {
                          handleAddItem('ipc_classes', code, () => {});
                        }
                      }}
                    >
                      {code}
                    </Button>
                  ))}
                </div>
              </div>

              {/* CPC Classifications */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  CPC Classifications
                </Label>
                
                <div className="flex gap-2">
                  <Input
                    value={newCPC}
                    onChange={(e) => setNewCPC(e.target.value)}
                    placeholder="e.g., G06F17/30, A61K31/00"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddItem('cpc_classes', newCPC, setNewCPC))}
                  />
                  <Button 
                    type="button" 
                    size="sm" 
                    onClick={() => handleAddItem('cpc_classes', newCPC, setNewCPC)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {formData.cpc_classes.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.cpc_classes.map((cpc, index) => (
                      <Badge key={index} variant="secondary" className="gap-1">
                        {cpc}
                        <X 
                          className="h-3 w-3 cursor-pointer" 
                          onClick={() => handleRemoveItem('cpc_classes', index)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* Assignees */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Patent Assignees (Companies/Organizations)
                </Label>
                
                <div className="flex gap-2">
                  <Input
                    value={newAssignee}
                    onChange={(e) => setNewAssignee(e.target.value)}
                    placeholder="e.g., Google Inc, Microsoft Corporation"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddItem('assignees', newAssignee, setNewAssignee))}
                  />
                  <Button 
                    type="button" 
                    size="sm" 
                    onClick={() => handleAddItem('assignees', newAssignee, setNewAssignee)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {formData.assignees.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.assignees.map((assignee, index) => (
                      <Badge key={index} variant="outline" className="gap-1">
                        {assignee}
                        <X 
                          className="h-3 w-3 cursor-pointer" 
                          onClick={() => handleRemoveItem('assignees', index)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Inventors */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Patent Inventors
                </Label>
                
                <div className="flex gap-2">
                  <Input
                    value={newInventor}
                    onChange={(e) => setNewInventor(e.target.value)}
                    placeholder="e.g., John Smith, Jane Doe"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddItem('inventors', newInventor, setNewInventor))}
                  />
                  <Button 
                    type="button" 
                    size="sm" 
                    onClick={() => handleAddItem('inventors', newInventor, setNewInventor)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {formData.inventors.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.inventors.map((inventor, index) => (
                      <Badge key={index} variant="outline" className="gap-1">
                        {inventor}
                        <X 
                          className="h-3 w-3 cursor-pointer" 
                          onClick={() => handleRemoveItem('inventors', index)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Additional Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Additional Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Date Range */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Publication Date Range
                </Label>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="from_date" className="text-sm text-muted-foreground">From Date</Label>
                    <Input
                      id="from_date"
                      type="date"
                      value={formData.date_range.from_date}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        date_range: { ...prev.date_range, from_date: e.target.value }
                      }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="to_date" className="text-sm text-muted-foreground">To Date</Label>
                    <Input
                      id="to_date"
                      type="date"
                      value={formData.date_range.to_date}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        date_range: { ...prev.date_range, to_date: e.target.value }
                      }))}
                    />
                  </div>
                </div>
              </div>

              {/* Geographic Scope */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Geographic Scope
                </Label>
                
                <div className="flex gap-2">
                  <Select value={newCountry} onValueChange={setNewCountry}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map(country => (
                        <SelectItem key={country} value={country}>
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    type="button" 
                    size="sm" 
                    onClick={() => {
                      if (newCountry && !formData.geographic_scope.includes(newCountry)) {
                        handleAddItem('geographic_scope', newCountry, setNewCountry);
                      }
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {formData.geographic_scope.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.geographic_scope.map((country, index) => (
                      <Badge key={index} variant="outline" className="gap-1">
                        {country}
                        <X 
                          className="h-3 w-3 cursor-pointer" 
                          onClick={() => handleRemoveItem('geographic_scope', index)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={
              isSubmitting || 
              !formData.query_name.trim() ||
              (!formData.keywords.trim() && 
               formData.assignees.length === 0 && 
               formData.inventors.length === 0 && 
               formData.ipc_classes.length === 0 && 
               formData.cpc_classes.length === 0)
            }
          >
            {isSubmitting ? 'Creating...' : 'Create Query'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}