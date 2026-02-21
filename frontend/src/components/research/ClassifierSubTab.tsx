/**
 * ClassifierSubTab Component
 * Patent classification and grouping functionality
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Tags,
  FolderOpen,
  Brain,
  Filter,
  Download,
  Upload,
  BarChart3,
  Settings,
  Save,
  RefreshCw,
  ChevronRight,
  Hash,
  FileText,
  Layers,
  Sparkles
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';

interface ClassifierSubTabProps {
  projectId: string;
  queries?: any[];
  results?: any[];
  importedPatents?: any[];
}

export function ClassifierSubTab({ projectId, queries = [], results = [], importedPatents = [] }: ClassifierSubTabProps) {
  const [selectedPatents, setSelectedPatents] = useState<string[]>([]);
  const [classificationMethod, setClassificationMethod] = useState<'manual' | 'auto' | 'hybrid'>('auto');
  const [categories, setCategories] = useState<any[]>([]);
  const [newCategory, setNewCategory] = useState({ name: '', description: '', color: '#3B82F6' });
  const [loading, setLoading] = useState(false);
  const [classificationResults, setClassificationResults] = useState<any>(null);
  const [activeView, setActiveView] = useState<'setup' | 'results'>('setup');
  const [patents, setPatents] = useState<any[]>([]);

  // Use imported patents if available, otherwise use results or mock data
  useEffect(() => {
    // Check sessionStorage for dataset from Datasets tab
    const storedDataset = sessionStorage.getItem('classifierDataset');
    if (storedDataset) {
      try {
        const datasetData = JSON.parse(storedDataset);
        if (datasetData.records && datasetData.records.length > 0) {
          // Transform dataset records to classifier format
          const transformedRecords = datasetData.records.map((record: any, index: number) => ({
            id: record.id || `dataset_record_${index}`,
            title: record.title || record.patent_title || 'Untitled Patent',
            number: record.patent_number || record.publication_number || `UNKNOWN_${index}`,
            date: record.publication_date || record.filing_date || new Date().toISOString(),
            status: 'unclassified',
            abstract: record.abstract || record.patent_abstract || '',
            assignee: record.assignee || record.applicant || '',
            inventors: record.inventors || [],
            ipc_classes: record.ipc_classes || record.ipc_classification?.split(',') || [],
            cpc_classes: record.cpc_classes || [],
            dataset_name: datasetData.datasetName,
            from_dataset: true
          }));
          setPatents(transformedRecords);
          // Auto-select all dataset records
          setSelectedPatents(transformedRecords.map(p => p.id));
          // Clear sessionStorage after loading
          sessionStorage.removeItem('classifierDataset');
          return; // Exit early if dataset data was found
        }
      } catch (error) {
        console.error('Error parsing classifier dataset from sessionStorage:', error);
      }
    }
    
    if (importedPatents && importedPatents.length > 0) {
      // Transform imported patents to classifier format
      const transformedPatents = importedPatents.map((patent, index) => ({
        id: patent.id || `patent_${index}`,
        title: patent.title || 'Untitled Patent',
        number: patent.patent_id || patent.publication_number || `UNKNOWN_${index}`,
        date: patent.publication_date || patent.application_date || new Date().toISOString(),
        status: 'unclassified',
        abstract: patent.abstract || '',
        assignee: patent.assignee || '',
        inventors: patent.inventors || [],
        ipc_classes: patent.ipc_classes || [],
        cpc_classes: patent.cpc_classes || [],
        relevance_score: patent.relevance_score,
        manual_relevance: patent.manual_relevance
      }));
      setPatents(transformedPatents);
      // Auto-select all imported patents
      setSelectedPatents(transformedPatents.map(p => p.id));
    } else if (results && results.length > 0) {
      // Use results from queries
      const transformedResults = results.map((result: any, index) => ({
        id: result.id || `result_${index}`,
        title: result.title || 'Untitled',
        number: result.patent_id || `UNKNOWN_${index}`,
        date: result.publication_date || new Date().toISOString(),
        status: 'unclassified',
        abstract: result.abstract || '',
        assignee: result.assignee || '',
        inventors: result.inventors || [],
        ipc_classes: result.ipc_classes || [],
        cpc_classes: result.cpc_classes || []
      }));
      setPatents(transformedResults);
    } else {
      // Fall back to mock data
      const mockPatents = [
        { id: '1', title: 'Machine Learning Algorithm for Image Recognition', number: 'US10123456B2', date: '2023-01-15', status: 'unclassified', abstract: '', assignee: 'Tech Corp', inventors: [], ipc_classes: [], cpc_classes: [] },
        { id: '2', title: 'Neural Network Architecture for NLP', number: 'US10234567B2', date: '2023-02-20', status: 'unclassified', abstract: '', assignee: 'AI Labs', inventors: [], ipc_classes: [], cpc_classes: [] },
        { id: '3', title: 'Computer Vision System for Object Detection', number: 'US10345678B2', date: '2023-03-10', status: 'unclassified', abstract: '', assignee: 'Vision Tech', inventors: [], ipc_classes: [], cpc_classes: [] },
        { id: '4', title: 'Deep Learning Framework for Predictive Analytics', number: 'US10456789B2', date: '2023-04-05', status: 'unclassified', abstract: '', assignee: 'Data Systems', inventors: [], ipc_classes: [], cpc_classes: [] },
        { id: '5', title: 'Reinforcement Learning for Robotics Control', number: 'US10567890B2', date: '2023-05-12', status: 'unclassified', abstract: '', assignee: 'Robotics Inc', inventors: [], ipc_classes: [], cpc_classes: [] }
      ];
      setPatents(mockPatents);
    }
  }, [importedPatents, results]);

  const predefinedCategories = [
    { id: '1', name: 'AI/Machine Learning', description: 'Artificial intelligence and ML technologies', color: '#8B5CF6', count: 0 },
    { id: '2', name: 'Hardware', description: 'Physical components and devices', color: '#10B981', count: 0 },
    { id: '3', name: 'Software Methods', description: 'Software processes and algorithms', color: '#3B82F6', count: 0 },
    { id: '4', name: 'Data Processing', description: 'Data handling and processing techniques', color: '#F59E0B', count: 0 },
    { id: '5', name: 'Networking', description: 'Network and communication technologies', color: '#EF4444', count: 0 }
  ];

  useEffect(() => {
    // Initialize with predefined categories
    setCategories(predefinedCategories);
  }, []);

  const handleAddCategory = () => {
    if (newCategory.name) {
      const category = {
        id: Date.now().toString(),
        ...newCategory,
        count: 0
      };
      setCategories([...categories, category]);
      setNewCategory({ name: '', description: '', color: '#3B82F6' });
    }
  };

  const handleDeleteCategory = (categoryId: string) => {
    setCategories(categories.filter(cat => cat.id !== categoryId));
  };

  const handleSelectAll = () => {
    if (selectedPatents.length === patents.length) {
      setSelectedPatents([]);
    } else {
      setSelectedPatents(patents.map(p => p.id));
    }
  };

  const handleRunClassification = async () => {
    setLoading(true);
    
    // Simulate classification process
    setTimeout(() => {
      const results = {
        totalClassified: selectedPatents.length || patents.length,
        byCategory: [
          { category: 'AI/Machine Learning', count: 2, percentage: 40 },
          { category: 'Software Methods', count: 2, percentage: 40 },
          { category: 'Data Processing', count: 1, percentage: 20 }
        ],
        confidence: 0.87,
        timestamp: new Date().toISOString()
      };
      
      setClassificationResults(results);
      setActiveView('results');
      setLoading(false);
    }, 2000);
  };

  const handleExportResults = () => {
    // Implement export functionality
    console.log('Exporting classification results...');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Tags className="h-5 w-5" />
                Patent Classifier
                {importedPatents.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {importedPatents.length} patents from Results
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Organize and categorize patents using AI-powered classification
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={() => setActiveView(activeView === 'setup' ? 'results' : 'setup')}
                disabled={!classificationResults && activeView === 'setup'}
              >
                {activeView === 'setup' ? 'View Results' : 'Setup'}
              </Button>
              <Button 
                onClick={handleRunClassification}
                disabled={loading || (selectedPatents.length === 0 && classificationMethod === 'manual')}
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Classifying...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Run Classification
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {activeView === 'setup' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Patent Selection */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Patent Selection</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {selectedPatents.length} / {patents.length} selected
                    </Badge>
                    <Button size="sm" variant="outline" onClick={handleSelectAll}>
                      {selectedPatents.length === patents.length ? 'Deselect All' : 'Select All'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-2">
                    {patents.map((patent) => (
                      <div 
                        key={patent.id}
                        className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent transition-colors"
                      >
                        <Checkbox
                          checked={selectedPatents.includes(patent.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedPatents([...selectedPatents, patent.id]);
                            } else {
                              setSelectedPatents(selectedPatents.filter(id => id !== patent.id));
                            }
                          }}
                        />
                        <div className="flex-1">
                          <div className="font-medium">{patent.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {patent.number} • {patent.date}
                          </div>
                        </div>
                        <Badge variant="outline">{patent.status}</Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Classification Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Classification Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Classification Method</Label>
                  <Select value={classificationMethod} onValueChange={(value: any) => setClassificationMethod(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">
                        <div className="flex items-center gap-2">
                          <Brain className="h-4 w-4" />
                          <span>Automatic (AI-powered)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="manual">
                        <div className="flex items-center gap-2">
                          <Tags className="h-4 w-4" />
                          <span>Manual Categories</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="hybrid">
                        <div className="flex items-center gap-2">
                          <Layers className="h-4 w-4" />
                          <span>Hybrid (AI + Manual)</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Confidence Threshold</Label>
                    <Input type="number" placeholder="0.75" defaultValue="0.75" min="0" max="1" step="0.05" />
                  </div>
                  <div>
                    <Label>Max Categories per Patent</Label>
                    <Input type="number" placeholder="3" defaultValue="3" min="1" max="10" />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox id="hierarchical" />
                  <Label htmlFor="hierarchical">Enable hierarchical classification</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox id="similarity" />
                  <Label htmlFor="similarity">Group by similarity threshold</Label>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Categories */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Categories</CardTitle>
                <CardDescription>Define classification categories</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Add New Category</Label>
                    <Input
                      placeholder="Category name"
                      value={newCategory.name}
                      onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                    />
                    <Textarea
                      placeholder="Description (optional)"
                      value={newCategory.description}
                      onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                      rows={2}
                    />
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={newCategory.color}
                        onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                        className="w-20"
                      />
                      <Button onClick={handleAddCategory} size="sm" className="flex-1">
                        Add Category
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <ScrollArea className="h-[300px]">
                    <div className="space-y-2">
                      {categories.map((category) => (
                        <div
                          key={category.id}
                          className="flex items-center justify-between p-2 rounded-lg border"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: category.color }}
                            />
                            <div>
                              <div className="font-medium text-sm">{category.name}</div>
                              {category.description && (
                                <div className="text-xs text-muted-foreground">{category.description}</div>
                              )}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteCategory(category.id)}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Patents</span>
                    <span className="font-semibold">{patents.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Categories</span>
                    <span className="font-semibold">{categories.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Unclassified</span>
                    <span className="font-semibold">{patents.filter(p => p.status === 'unclassified').length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Last Run</span>
                    <span className="text-sm">{classificationResults ? new Date(classificationResults.timestamp).toLocaleDateString() : 'Never'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        /* Results View */
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Classification Results</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleExportResults}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  <Button variant="outline" onClick={() => window.print()}>
                    <FileText className="h-4 w-4 mr-2" />
                    Report
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {classificationResults && (
                <div className="space-y-6">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold">{classificationResults.totalClassified}</div>
                        <div className="text-sm text-muted-foreground">Patents Classified</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold">{classificationResults.byCategory.length}</div>
                        <div className="text-sm text-muted-foreground">Categories Used</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold">{(classificationResults.confidence * 100).toFixed(0)}%</div>
                        <div className="text-sm text-muted-foreground">Avg Confidence</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold">100%</div>
                        <div className="text-sm text-muted-foreground">Coverage</div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Category Distribution */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Category Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {classificationResults.byCategory.map((cat: any, index: number) => (
                          <div key={index} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">{cat.category}</span>
                              <span className="text-sm text-muted-foreground">{cat.count} patents ({cat.percentage}%)</span>
                            </div>
                            <Progress value={cat.percentage} className="h-2" />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Detailed Results Table */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Detailed Classification</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Patent</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Confidence</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {patents.slice(0, 5).map((patent) => (
                            <TableRow key={patent.id}>
                              <TableCell>
                                <div>
                                  <div className="font-medium">{patent.title}</div>
                                  <div className="text-sm text-muted-foreground">{patent.number}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge>AI/Machine Learning</Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Progress value={87} className="w-20 h-2" />
                                  <span className="text-sm">87%</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Button size="sm" variant="ghost">Review</Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}