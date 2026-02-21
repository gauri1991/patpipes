/**
 * ReportEditor Component
 * Visual drag-drop report builder with template-based scaffolding
 */

'use client';

import { useState, useRef } from 'react';
import { ReportTemplate } from '@/types/template.types';
import {
  FileText,
  Plus,
  Save,
  Eye,
  Download,
  Share,
  Settings,
  Type,
  Image,
  BarChart3,
  Table,
  Layers,
  Move,
  Copy,
  Trash2,
  Edit,
  Bold,
  Italic,
  Underline,
  List,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link,
  Upload,
  X,
  ChevronUp,
  ChevronDown,
  GripVertical,
  Palette,
  Code,
  Monitor,
  Smartphone,
  Tablet,
  Undo,
  Redo,
  Search,
  Replace,
  Zap
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface ReportSection {
  id: string;
  type: 'text' | 'chart' | 'table' | 'image' | 'mixed';
  title: string;
  content: any;
  order: number;
  required: boolean;
  isEditing?: boolean;
}

interface ReportEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportId?: string;
  template?: ReportTemplate;
  initialData?: any;
}

export function ReportEditor({
  open,
  onOpenChange,
  reportId,
  template,
  initialData
}: ReportEditorProps) {
  const [reportTitle, setReportTitle] = useState(initialData?.name || template?.name || 'New Report');
  const [sections, setSections] = useState<ReportSection[]>(
    template?.report_config.sections.map((section, index) => ({
      id: section.id,
      type: section.type as any,
      title: section.title,
      content: '',
      order: section.order,
      required: section.required,
      isEditing: false
    })) || []
  );
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [showingAI, setShowingAI] = useState(false);

  // Drag and drop state
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  // Handle drag start
  const handleDragStart = (index: number) => {
    dragItem.current = index;
  };

  // Handle drag enter
  const handleDragEnter = (index: number) => {
    dragOverItem.current = index;
  };

  // Handle drag end
  const handleDragEnd = () => {
    if (dragItem.current !== null && dragOverItem.current !== null) {
      const draggedSection = sections[dragItem.current];
      const remainingSections = sections.filter((_, index) => index !== dragItem.current);
      
      // Insert at new position
      const reorderedSections = [
        ...remainingSections.slice(0, dragOverItem.current),
        draggedSection,
        ...remainingSections.slice(dragOverItem.current)
      ];

      // Update order numbers
      const updatedSections = reorderedSections.map((section, index) => ({
        ...section,
        order: index + 1
      }));

      setSections(updatedSections);
    }

    dragItem.current = null;
    dragOverItem.current = null;
  };

  // Add new section
  const addSection = (type: ReportSection['type']) => {
    const newSection: ReportSection = {
      id: `section_${Date.now()}`,
      type,
      title: `New ${type.charAt(0).toUpperCase() + type.slice(1)} Section`,
      content: type === 'text' ? '' : {},
      order: sections.length + 1,
      required: false,
      isEditing: true
    };

    setSections([...sections, newSection]);
    setActiveSection(newSection.id);
  };

  // Update section
  const updateSection = (sectionId: string, updates: Partial<ReportSection>) => {
    setSections(sections.map(section => 
      section.id === sectionId ? { ...section, ...updates } : section
    ));
  };

  // Delete section
  const deleteSection = (sectionId: string) => {
    const sectionToDelete = sections.find(s => s.id === sectionId);
    if (sectionToDelete?.required) {
      toast.error('Cannot delete required sections');
      return;
    }

    setSections(sections.filter(section => section.id !== sectionId));
    if (activeSection === sectionId) {
      setActiveSection(null);
    }
  };

  // Duplicate section
  const duplicateSection = (sectionId: string) => {
    const sectionToDuplicate = sections.find(s => s.id === sectionId);
    if (!sectionToDuplicate) return;

    const duplicatedSection: ReportSection = {
      ...sectionToDuplicate,
      id: `section_${Date.now()}`,
      title: `${sectionToDuplicate.title} (Copy)`,
      order: sections.length + 1,
      required: false
    };

    setSections([...sections, duplicatedSection]);
  };

  // Save report
  const saveReport = async () => {
    setSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success('Report saved successfully');
    } catch (error) {
      toast.error('Failed to save report');
    } finally {
      setSaving(false);
    }
  };

  // Generate AI content
  const generateAIContent = async (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;

    setShowingAI(true);
    try {
      // Simulate AI generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      let aiContent = '';
      switch (section.type) {
        case 'text':
          aiContent = `This section provides comprehensive analysis of ${section.title.toLowerCase()}. Based on the available data and research findings, we can identify several key trends and patterns that are shaping the current landscape.\n\nThe analysis reveals significant insights that warrant further investigation and strategic consideration for future planning and decision-making processes.`;
          break;
        case 'mixed':
          aiContent = `# ${section.title}\n\nThis analysis combines multiple data sources and visualization techniques to provide a comprehensive overview.\n\n## Key Findings\n- Trend analysis shows consistent growth patterns\n- Market indicators suggest emerging opportunities\n- Competitive landscape remains dynamic\n\n## Recommendations\nBased on the analysis, we recommend continued monitoring and strategic positioning.`;
          break;
        default:
          aiContent = 'AI-generated content for this section type is not yet available.';
      }

      updateSection(sectionId, { content: aiContent });
      toast.success('AI content generated successfully');
    } catch (error) {
      toast.error('Failed to generate AI content');
    } finally {
      setShowingAI(false);
    }
  };

  // Get section icon
  const getSectionIcon = (type: ReportSection['type']) => {
    switch (type) {
      case 'text': return Type;
      case 'chart': return BarChart3;
      case 'table': return Table;
      case 'image': return Image;
      case 'mixed': return Layers;
      default: return FileText;
    }
  };

  // Get view mode icon
  const getViewModeIcon = (mode: string) => {
    switch (mode) {
      case 'desktop': return Monitor;
      case 'tablet': return Tablet;
      case 'mobile': return Smartphone;
      default: return Monitor;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl w-full h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>{reportTitle}</DialogTitle>
          <DialogDescription>
            {template ? `Report editor based on ${template.name}` : 'Visual report editor'}
          </DialogDescription>
        </DialogHeader>
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">{reportTitle}</h2>
              <p className="text-sm text-muted-foreground">
                {template ? `Based on ${template.name}` : 'Custom Report'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center border rounded-lg p-1">
              {(['desktop', 'tablet', 'mobile'] as const).map((mode) => {
                const Icon = getViewModeIcon(mode);
                return (
                  <Button
                    key={mode}
                    variant={viewMode === mode ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode(mode)}
                    className="h-8 w-8 p-0"
                  >
                    <Icon className="h-4 w-4" />
                  </Button>
                );
              })}
            </div>

            <Separator orientation="vertical" className="h-6" />

            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreviewMode(!previewMode)}
            >
              <Eye className="h-4 w-4 mr-2" />
              {previewMode ? 'Edit' : 'Preview'}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={saveReport}
              disabled={saving}
            >
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Download className="h-4 w-4 mr-2" />
                  Export as PDF
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Share className="h-4 w-4 mr-2" />
                  Share Report
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Copy className="h-4 w-4 mr-2" />
                  Save as Template
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="flex h-full overflow-hidden">
          {!previewMode && (
            /* Sidebar - Tools Panel */
            <div className="w-80 border-r bg-muted/30 p-4 space-y-4 overflow-y-auto">
              <div>
                <Label className="text-sm font-medium mb-3 block">Report Details</Label>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="report-title" className="text-xs">Title</Label>
                    <Input
                      id="report-title"
                      value={reportTitle}
                      onChange={(e) => setReportTitle(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {sections.length} sections
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Progress: {Math.round((sections.filter(s => s.content).length / sections.length) * 100)}%
                    </span>
                  </div>
                  <Progress value={Math.round((sections.filter(s => s.content).length / sections.length) * 100)} className="h-2" />
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-sm font-medium mb-3 block">Add Content</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addSection('text')}
                    className="justify-start"
                  >
                    <Type className="h-4 w-4 mr-2" />
                    Text
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addSection('chart')}
                    className="justify-start"
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Chart
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addSection('table')}
                    className="justify-start"
                  >
                    <Table className="h-4 w-4 mr-2" />
                    Table
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addSection('image')}
                    className="justify-start"
                  >
                    <Image className="h-4 w-4 mr-2" />
                    Image
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Section List */}
              <div>
                <Label className="text-sm font-medium mb-3 block">Report Sections</Label>
                <div className="space-y-2">
                  {sections.map((section, index) => {
                    const Icon = getSectionIcon(section.type);
                    const isActive = activeSection === section.id;

                    return (
                      <div
                        key={section.id}
                        className={`group p-3 rounded-lg border cursor-pointer transition-all ${
                          isActive ? 'border-blue-500 bg-blue-50' : 'border-border hover:border-border/80'
                        }`}
                        onClick={() => setActiveSection(section.id)}
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragEnter={() => handleDragEnter(index)}
                        onDragEnd={handleDragEnd}
                        onDragOver={(e) => e.preventDefault()}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            <Icon className="h-4 w-4 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{section.title}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {section.type}
                                </Badge>
                                {section.required && (
                                  <Badge variant="destructive" className="text-xs">
                                    Required
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100">
                                <Settings className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => updateSection(section.id, { isEditing: true })}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => duplicateSection(section.id)}>
                                <Copy className="h-4 w-4 mr-2" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => generateAIContent(section.id)} disabled={showingAI}>
                                <Zap className="h-4 w-4 mr-2" />
                                AI Generate
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => deleteSection(section.id)}
                                disabled={section.required}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* Progress indicator */}
                        <div className="mt-2">
                          <div className="h-1 bg-muted rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all ${
                                section.content && String(section.content).trim() 
                                  ? 'bg-green-500 w-full' 
                                  : 'bg-yellow-500 w-1/3'
                              }`} 
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {sections.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm">No sections yet</p>
                      <p className="text-xs">Add content blocks to build your report</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Main Editor Area */}
          <div className="flex-1 overflow-y-auto">
            <div className={`p-8 max-w-none ${
              viewMode === 'mobile' ? 'max-w-sm mx-auto' :
              viewMode === 'tablet' ? 'max-w-2xl mx-auto' :
              'max-w-4xl mx-auto'
            }`}>
              {/* Report Header */}
              <div className="mb-8">
                <div className="text-center space-y-2">
                  <h1 className="text-3xl font-bold">{reportTitle}</h1>
                  <p className="text-muted-foreground">
                    Generated on {new Date().toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Report Sections */}
              <div className="space-y-8">
                {sections
                  .sort((a, b) => a.order - b.order)
                  .map((section) => {
                    const Icon = getSectionIcon(section.type);
                    const isActive = activeSection === section.id && !previewMode;

                    return (
                      <div
                        key={section.id}
                        className={`relative group ${
                          isActive ? 'ring-2 ring-blue-500 ring-offset-4 rounded-lg' : ''
                        }`}
                        onClick={() => !previewMode && setActiveSection(section.id)}
                      >
                        {/* Section Header */}
                        {!previewMode && (
                          <div className="flex items-center justify-between mb-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="flex items-center gap-2">
                              <Icon className="h-5 w-5 text-muted-foreground" />
                              <Badge variant="outline">{section.type}</Badge>
                              {section.required && (
                                <Badge variant="destructive" className="text-xs">Required</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => generateAIContent(section.id)}
                                disabled={showingAI}
                              >
                                <Zap className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Settings className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Section Content */}
                        <div className="space-y-4">
                          {/* Section Title */}
                          {section.isEditing && !previewMode ? (
                            <Input
                              value={section.title}
                              onChange={(e) => updateSection(section.id, { title: e.target.value })}
                              onBlur={() => updateSection(section.id, { isEditing: false })}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  updateSection(section.id, { isEditing: false });
                                }
                              }}
                              className="text-2xl font-semibold border-none p-0 shadow-none focus-visible:ring-0"
                              autoFocus
                            />
                          ) : (
                            <h2 
                              className="text-2xl font-semibold cursor-pointer hover:text-blue-600 transition-colors"
                              onClick={() => !previewMode && updateSection(section.id, { isEditing: true })}
                            >
                              {section.title}
                            </h2>
                          )}

                          {/* Section Body */}
                          {section.type === 'text' && (
                            <div className="space-y-4">
                              {activeSection === section.id && !previewMode ? (
                                <Textarea
                                  value={section.content || ''}
                                  onChange={(e) => updateSection(section.id, { content: e.target.value })}
                                  placeholder="Start typing your content..."
                                  className="min-h-[200px] text-base leading-relaxed"
                                />
                              ) : (
                                <div 
                                  className="prose max-w-none cursor-pointer p-4 rounded border border-transparent hover:border-border transition-colors min-h-[100px]"
                                  onClick={() => !previewMode && setActiveSection(section.id)}
                                >
                                  {section.content ? (
                                    <div className="whitespace-pre-wrap text-base leading-relaxed">
                                      {section.content}
                                    </div>
                                  ) : (
                                    <div className="text-muted-foreground italic">
                                      Click to add content...
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {section.type === 'chart' && (
                            <div className="space-y-4">
                              <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center">
                                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground mb-2">Chart Placeholder</p>
                                <p className="text-sm text-muted-foreground">
                                  Select data source and chart type to display visualization
                                </p>
                                {!previewMode && (
                                  <Button variant="outline" className="mt-4">
                                    Configure Chart
                                  </Button>
                                )}
                              </div>
                            </div>
                          )}

                          {section.type === 'table' && (
                            <div className="space-y-4">
                              <div className="border rounded-lg overflow-hidden">
                                <div className="bg-muted p-4 text-center">
                                  <Table className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                                  <p className="text-sm text-muted-foreground">Table Placeholder</p>
                                  {!previewMode && (
                                    <Button variant="outline" size="sm" className="mt-2">
                                      Configure Table
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {section.type === 'image' && (
                            <div className="space-y-4">
                              <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center">
                                <Image className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground mb-2">Image Placeholder</p>
                                <p className="text-sm text-muted-foreground">
                                  Upload an image or select from gallery
                                </p>
                                {!previewMode && (
                                  <Button variant="outline" className="mt-4">
                                    <Upload className="h-4 w-4 mr-2" />
                                    Upload Image
                                  </Button>
                                )}
                              </div>
                            </div>
                          )}

                          {section.type === 'mixed' && (
                            <div className="space-y-4">
                              {activeSection === section.id && !previewMode ? (
                                <Textarea
                                  value={section.content || ''}
                                  onChange={(e) => updateSection(section.id, { content: e.target.value })}
                                  placeholder="Add mixed content (text, data, analysis)..."
                                  className="min-h-[200px] text-base leading-relaxed"
                                />
                              ) : (
                                <div 
                                  className="prose max-w-none cursor-pointer p-4 rounded border border-transparent hover:border-border transition-colors min-h-[100px]"
                                  onClick={() => !previewMode && setActiveSection(section.id)}
                                >
                                  {section.content ? (
                                    <div className="whitespace-pre-wrap text-base leading-relaxed">
                                      {section.content}
                                    </div>
                                  ) : (
                                    <div className="text-muted-foreground italic">
                                      Click to add mixed content...
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                {sections.length === 0 && (
                  <div className="text-center py-16">
                    <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Start Building Your Report</h3>
                    <p className="text-muted-foreground mb-6">
                      Add sections from the sidebar to begin creating your report
                    </p>
                    <Button onClick={() => addSection('text')}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Section
                    </Button>
                  </div>
                )}
              </div>

              {/* Report Footer */}
              {sections.length > 0 && (
                <div className="mt-16 pt-8 border-t text-center text-sm text-muted-foreground">
                  <p>Report generated by Patent Analytics Platform</p>
                  <p>Last updated: {new Date().toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}