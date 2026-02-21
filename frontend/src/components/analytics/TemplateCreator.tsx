/**
 * TemplateCreator Component
 * Visual builder for creating different types of templates
 */

'use client';

import { useState } from 'react';
import {
  TemplateType,
  TemplateScope,
  ChartType,
  ReportType,
  TemplateCreationData
} from '@/types/template.types';
import {
  Plus,
  BarChart3,
  LineChart,
  PieChart,
  Network,
  MapPin,
  Zap,
  FileText,
  Layout,
  FileSpreadsheet,
  Activity,
  Building2,
  Users,
  User,
  X,
  ChevronRight,
  ChevronLeft,
  Eye,
  Save,
  Palette,
  Settings2,
  Database,
  Filter,
  Layers,
  Grid,
  Type,
  Image,
  Table,
  BarChart,
  TrendingUp,
  Target,
  Shield,
  Lightbulb,
  Search,
  Brain,
  CheckCircle2,
  AlertTriangle
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
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

interface TemplateCreatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateType: TemplateType | null;
  onCreateTemplate: (template: TemplateCreationData) => Promise<void>;
}

export function TemplateCreator({
  open,
  onOpenChange,
  templateType,
  onCreateTemplate
}: TemplateCreatorProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Partial<TemplateCreationData>>({
    template_type: templateType || TemplateType.CHART,
    scope: TemplateScope.ORGANIZATION,
    tags: []
  });
  const [loading, setLoading] = useState(false);

  // Form validation
  const validateCurrentStep = () => {
    switch (currentStep) {
      case 0: // Basic Info
        return formData.name && formData.description && formData.category;
      case 1: // Configuration
        return true; // Config is optional for some templates
      case 2: // Settings
        return formData.scope;
      default:
        return false;
    }
  };

  const canProceed = validateCurrentStep();

  // Handle form submission
  const handleSubmit = async () => {
    if (!formData.name || !formData.description || !formData.category || !formData.template_type) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await onCreateTemplate({
        name: formData.name,
        description: formData.description,
        template_type: formData.template_type,
        category: formData.category,
        scope: formData.scope || TemplateScope.ORGANIZATION,
        tags: formData.tags || [],
        config: formData.config || {}
      });

      // Reset form
      setFormData({
        template_type: templateType || TemplateType.CHART,
        scope: TemplateScope.ORGANIZATION,
        tags: []
      });
      setCurrentStep(0);
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating template:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get template type info
  const getTemplateTypeInfo = (type: TemplateType) => {
    switch (type) {
      case TemplateType.CHART:
        return { icon: BarChart3, label: 'Chart Template', color: 'text-blue-600' };
      case TemplateType.REPORT:
        return { icon: FileText, label: 'Report Template', color: 'text-green-600' };
      case TemplateType.DASHBOARD:
        return { icon: Layout, label: 'Dashboard Template', color: 'text-purple-600' };
      case TemplateType.DOCUMENT:
        return { icon: FileSpreadsheet, label: 'Document Template', color: 'text-orange-600' };
      case TemplateType.WORKFLOW:
        return { icon: Activity, label: 'Workflow Template', color: 'text-pink-600' };
      default:
        return { icon: Brain, label: 'Template', color: 'text-gray-600' };
    }
  };

  const typeInfo = templateType ? getTemplateTypeInfo(templateType) : null;

  // Steps configuration
  const steps = [
    { id: 0, title: 'Basic Information', icon: Type },
    { id: 1, title: 'Configuration', icon: Settings2 },
    { id: 2, title: 'Settings & Permissions', icon: Shield }
  ];

  // Update form data
  const updateFormData = (updates: Partial<TemplateCreationData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  // Add tag
  const addTag = (tag: string) => {
    if (tag && !formData.tags?.includes(tag)) {
      updateFormData({ tags: [...(formData.tags || []), tag] });
    }
  };

  // Remove tag
  const removeTag = (tagToRemove: string) => {
    updateFormData({ 
      tags: formData.tags?.filter(tag => tag !== tagToRemove) || [] 
    });
  };

  if (!templateType) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            {typeInfo && (
              <div className={`p-2 rounded-lg bg-gradient-to-br from-${typeInfo.color.replace('text-', '').replace('-600', '-100')} to-${typeInfo.color.replace('text-', '').replace('-600', '-200')}`}>
                <typeInfo.icon className={`h-6 w-6 ${typeInfo.color}`} />
              </div>
            )}
            Create {typeInfo?.label}
          </DialogTitle>
          <DialogDescription>
            Build a reusable {typeInfo?.label.toLowerCase()} for your organization
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6">
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            const isAccessible = index <= currentStep;

            return (
              <div key={step.id} className="flex items-center">
                <div 
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all ${
                    isActive 
                      ? 'bg-blue-100 text-blue-600' 
                      : isCompleted 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-gray-100 text-gray-400'
                  } ${isAccessible ? 'hover:shadow-sm' : 'cursor-not-allowed opacity-50'}`}
                  onClick={() => isAccessible && setCurrentStep(index)}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <StepIcon className="h-4 w-4" />
                  )}
                  <span className="text-sm font-medium">{step.title}</span>
                </div>
                
                {index < steps.length - 1 && (
                  <ChevronRight className="h-4 w-4 text-gray-300 mx-2" />
                )}
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <div className="space-y-6">
          {/* Step 0: Basic Information */}
          {currentStep === 0 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Template Details</CardTitle>
                  <CardDescription>
                    Provide basic information about your template
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="template-name">Template Name *</Label>
                      <Input
                        id="template-name"
                        value={formData.name || ''}
                        onChange={(e) => updateFormData({ name: e.target.value })}
                        placeholder="Enter template name..."
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="template-category">Category *</Label>
                      <Select 
                        value={formData.category || ''} 
                        onValueChange={(value) => updateFormData({ category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {templateType === TemplateType.CHART && (
                            <>
                              <SelectItem value="Temporal Analysis">Temporal Analysis</SelectItem>
                              <SelectItem value="Technology Analysis">Technology Analysis</SelectItem>
                              <SelectItem value="Competitive Intelligence">Competitive Intelligence</SelectItem>
                              <SelectItem value="Geographic Analysis">Geographic Analysis</SelectItem>
                              <SelectItem value="Portfolio Analysis">Portfolio Analysis</SelectItem>
                              <SelectItem value="Trend Analysis">Trend Analysis</SelectItem>
                              <SelectItem value="Opportunity Analysis">Opportunity Analysis</SelectItem>
                            </>
                          )}
                          {templateType === TemplateType.REPORT && (
                            <>
                              <SelectItem value="Strategic Analysis">Strategic Analysis</SelectItem>
                              <SelectItem value="Competitive Analysis">Competitive Analysis</SelectItem>
                              <SelectItem value="Legal Analysis">Legal Analysis</SelectItem>
                              <SelectItem value="Technology Analysis">Technology Analysis</SelectItem>
                              <SelectItem value="Market Analysis">Market Analysis</SelectItem>
                              <SelectItem value="Portfolio Analysis">Portfolio Analysis</SelectItem>
                              <SelectItem value="Opportunity Analysis">Opportunity Analysis</SelectItem>
                            </>
                          )}
                          {templateType === TemplateType.DASHBOARD && (
                            <>
                              <SelectItem value="Executive View">Executive View</SelectItem>
                              <SelectItem value="Team View">Team View</SelectItem>
                              <SelectItem value="Operational View">Operational View</SelectItem>
                              <SelectItem value="Analytics View">Analytics View</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="template-description">Description *</Label>
                    <Textarea
                      id="template-description"
                      value={formData.description || ''}
                      onChange={(e) => updateFormData({ description: e.target.value })}
                      placeholder="Describe what this template is used for..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Tags</Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {formData.tags?.map((tag) => (
                        <Badge key={tag} variant="secondary" className="gap-1">
                          {tag}
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => removeTag(tag)}
                          />
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add tags..."
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            addTag(e.currentTarget.value);
                            e.currentTarget.value = '';
                          }
                        }}
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          const input = document.querySelector('input[placeholder="Add tags..."]') as HTMLInputElement;
                          if (input?.value) {
                            addTag(input.value);
                            input.value = '';
                          }
                        }}
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 1: Configuration */}
          {currentStep === 1 && (
            <div className="space-y-6">
              {templateType === TemplateType.CHART && (
                <ChartTemplateConfig 
                  config={formData.config || {}}
                  onConfigChange={(config) => updateFormData({ config })}
                />
              )}
              
              {templateType === TemplateType.REPORT && (
                <ReportTemplateConfig 
                  config={formData.config || {}}
                  onConfigChange={(config) => updateFormData({ config })}
                />
              )}
              
              {templateType === TemplateType.DASHBOARD && (
                <DashboardTemplateConfig 
                  config={formData.config || {}}
                  onConfigChange={(config) => updateFormData({ config })}
                />
              )}
            </div>
          )}

          {/* Step 2: Settings & Permissions */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Permissions & Sharing</CardTitle>
                  <CardDescription>
                    Configure who can access and use this template
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Template Scope *</Label>
                    <Select 
                      value={formData.scope || TemplateScope.ORGANIZATION} 
                      onValueChange={(value: TemplateScope) => updateFormData({ scope: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={TemplateScope.ORGANIZATION}>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            <div>
                              <div className="font-medium">Organization</div>
                              <div className="text-xs text-muted-foreground">Available to everyone</div>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value={TemplateScope.TEAM}>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <div>
                              <div className="font-medium">Team</div>
                              <div className="text-xs text-muted-foreground">Available to your team</div>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value={TemplateScope.PERSONAL}>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <div>
                              <div className="font-medium">Personal</div>
                              <div className="text-xs text-muted-foreground">Only available to you</div>
                            </div>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <Label className="text-base">Template Settings</Label>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium">Active Template</Label>
                        <p className="text-xs text-muted-foreground">
                          Make this template available for use
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium">Allow Modifications</Label>
                        <p className="text-xs text-muted-foreground">
                          Users can modify this template when using it
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium">Featured Template</Label>
                        <p className="text-xs text-muted-foreground">
                          Show this template in featured/popular sections
                        </p>
                      </div>
                      <Switch />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Preview Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Template Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-4 border rounded-lg bg-muted/30">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {typeInfo && (
                          <div className={`p-2 rounded-lg bg-gradient-to-br from-${typeInfo.color.replace('text-', '').replace('-600', '-100')} to-${typeInfo.color.replace('text-', '').replace('-600', '-200')}`}>
                            <typeInfo.icon className={`h-5 w-5 ${typeInfo.color}`} />
                          </div>
                        )}
                        <div>
                          <h4 className="font-semibold">{formData.name || 'Template Name'}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {formData.description || 'Template description...'}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary" className="text-xs">
                              {formData.category || 'Category'}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {formData.scope?.replace('_', ' ') || 'Organization'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <Button size="sm">Use Template</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            
            {currentStep < steps.length - 1 ? (
              <Button
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={!canProceed}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!canProceed || loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Create Template
                  </>
                )}
              </Button>
            )}
          </div>

          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Chart Template Configuration
function ChartTemplateConfig({ config, onConfigChange }: { config: any, onConfigChange: (config: any) => void }) {
  const updateConfig = (updates: any) => {
    onConfigChange({ ...config, ...updates });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Chart Configuration</CardTitle>
        <CardDescription>
          Define the default settings for this chart template
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Chart Type</Label>
            <Select 
              value={config.chart_type || ''} 
              onValueChange={(value) => updateConfig({ chart_type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select chart type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="line">
                  <div className="flex items-center gap-2">
                    <LineChart className="h-4 w-4" />
                    Line Chart
                  </div>
                </SelectItem>
                <SelectItem value="bar">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Bar Chart
                  </div>
                </SelectItem>
                <SelectItem value="pie">
                  <div className="flex items-center gap-2">
                    <PieChart className="h-4 w-4" />
                    Pie Chart
                  </div>
                </SelectItem>
                <SelectItem value="scatter">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Scatter Plot
                  </div>
                </SelectItem>
                <SelectItem value="network">
                  <div className="flex items-center gap-2">
                    <Network className="h-4 w-4" />
                    Network Chart
                  </div>
                </SelectItem>
                <SelectItem value="heatmap">
                  <div className="flex items-center gap-2">
                    <Grid className="h-4 w-4" />
                    Heatmap
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Data Aggregation</Label>
            <Select 
              value={config.aggregation || ''} 
              onValueChange={(value) => updateConfig({ aggregation: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select aggregation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sum">Sum</SelectItem>
                <SelectItem value="average">Average</SelectItem>
                <SelectItem value="count">Count</SelectItem>
                <SelectItem value="min">Minimum</SelectItem>
                <SelectItem value="max">Maximum</SelectItem>
                <SelectItem value="median">Median</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          <Label className="text-base">Axis Configuration</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>X-Axis Field</Label>
              <Input 
                value={config.x_axis || ''} 
                onChange={(e) => updateConfig({ x_axis: e.target.value })}
                placeholder="e.g., filing_date, technology_area"
              />
            </div>
            <div className="space-y-2">
              <Label>Y-Axis Field</Label>
              <Input 
                value={config.y_axis || ''} 
                onChange={(e) => updateConfig({ y_axis: e.target.value })}
                placeholder="e.g., patent_count, innovation_score"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Label className="text-base">Styling Options</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Color Scheme</Label>
              <Select 
                value={config.color_scheme || 'blue'} 
                onValueChange={(value) => updateConfig({ color_scheme: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="blue">Blue</SelectItem>
                  <SelectItem value="purple">Purple</SelectItem>
                  <SelectItem value="green">Green</SelectItem>
                  <SelectItem value="orange">Orange</SelectItem>
                  <SelectItem value="red">Red</SelectItem>
                  <SelectItem value="pastel">Pastel</SelectItem>
                  <SelectItem value="heat">Heat Map</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Legend Position</Label>
              <Select 
                value={config.legend_position || 'bottom'} 
                onValueChange={(value) => updateConfig({ legend_position: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="top">Top</SelectItem>
                  <SelectItem value="bottom">Bottom</SelectItem>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                  <SelectItem value="none">None</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Label className="text-base">Interactive Features</Label>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Enable Animations</Label>
                <p className="text-xs text-muted-foreground">Smooth transitions and loading animations</p>
              </div>
              <Switch 
                checked={config.animations !== false} 
                onCheckedChange={(checked) => updateConfig({ animations: checked })}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Interactive Elements</Label>
                <p className="text-xs text-muted-foreground">Hover effects, click interactions</p>
              </div>
              <Switch 
                checked={config.interactive !== false} 
                onCheckedChange={(checked) => updateConfig({ interactive: checked })}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Show Grid Lines</Label>
                <p className="text-xs text-muted-foreground">Display grid for easier reading</p>
              </div>
              <Switch 
                checked={config.grid !== false} 
                onCheckedChange={(checked) => updateConfig({ grid: checked })}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Report Template Configuration
function ReportTemplateConfig({ config, onConfigChange }: { config: any, onConfigChange: (config: any) => void }) {
  const [sections, setSections] = useState(config.sections || [
    { id: 's1', title: 'Executive Summary', type: 'text', required: true, order: 1 },
    { id: 's2', title: 'Analysis Overview', type: 'mixed', required: true, order: 2 }
  ]);

  const updateConfig = (updates: any) => {
    onConfigChange({ ...config, sections, ...updates });
  };

  const addSection = () => {
    const newSection = {
      id: `s${Date.now()}`,
      title: 'New Section',
      type: 'text',
      required: false,
      order: sections.length + 1
    };
    setSections([...sections, newSection]);
  };

  const updateSection = (index: number, updates: any) => {
    const updatedSections = [...sections];
    updatedSections[index] = { ...updatedSections[index], ...updates };
    setSections(updatedSections);
  };

  const removeSection = (index: number) => {
    setSections(sections.filter((_: any, i: number) => i !== index));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Report Structure</CardTitle>
        <CardDescription>
          Define the sections and content structure for this report template
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Report Type</Label>
            <Select 
              value={config.report_type || ''} 
              onValueChange={(value) => updateConfig({ report_type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select report type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="landscape_analysis">
                  <div className="flex items-center gap-2">
                    <Layout className="h-4 w-4" />
                    Landscape Analysis
                  </div>
                </SelectItem>
                <SelectItem value="competitive_intelligence">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Competitive Intelligence
                  </div>
                </SelectItem>
                <SelectItem value="freedom_to_operate">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Freedom to Operate
                  </div>
                </SelectItem>
                <SelectItem value="white_space_analysis">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" />
                    White Space Analysis
                  </div>
                </SelectItem>
                <SelectItem value="technology_scouting">
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    Technology Scouting
                  </div>
                </SelectItem>
                <SelectItem value="custom">
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    Custom Report
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Estimated Completion Time</Label>
            <Input 
              value={config.estimated_time || ''} 
              onChange={(e) => updateConfig({ estimated_time: e.target.value })}
              placeholder="e.g., 2-3 hours, 1-2 days"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base">Report Sections</Label>
            <Button type="button" variant="outline" size="sm" onClick={addSection}>
              <Plus className="h-4 w-4 mr-2" />
              Add Section
            </Button>
          </div>

          <div className="space-y-3">
            {sections.map((section: any, index: number) => (
              <Card key={section.id} className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="grid grid-cols-2 gap-3 flex-1">
                      <Input
                        value={section.title}
                        onChange={(e) => updateSection(index, { title: e.target.value })}
                        placeholder="Section title"
                      />
                      <Select
                        value={section.type}
                        onValueChange={(value) => updateSection(index, { type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Text Only</SelectItem>
                          <SelectItem value="chart">Chart</SelectItem>
                          <SelectItem value="table">Table</SelectItem>
                          <SelectItem value="image">Image</SelectItem>
                          <SelectItem value="mixed">Mixed Content</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <Switch
                        checked={section.required}
                        onCheckedChange={(checked) => updateSection(index, { required: checked })}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSection(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {section.required ? 'Required section' : 'Optional section'}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <Label className="text-base">Output Settings</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Default Output Formats</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch id="pdf" defaultChecked />
                  <Label htmlFor="pdf">PDF</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="word" />
                  <Label htmlFor="word">Word Document</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="ppt" />
                  <Label htmlFor="ppt">PowerPoint</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="html" />
                  <Label htmlFor="html">HTML</Label>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Auto-Generate Reports</Label>
                  <p className="text-xs text-muted-foreground">Automatically generate content when possible</p>
                </div>
                <Switch />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Include Data Sources</Label>
                  <p className="text-xs text-muted-foreground">Automatically cite data sources used</p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Dashboard Template Configuration
function DashboardTemplateConfig({ config, onConfigChange }: { config: any, onConfigChange: (config: any) => void }) {
  const [widgets, setWidgets] = useState(config.widgets || []);

  const updateConfig = (updates: any) => {
    onConfigChange({ ...config, widgets, ...updates });
  };

  const addWidget = (type: string) => {
    const newWidget = {
      id: `w${Date.now()}`,
      type,
      title: `New ${type}`,
      position: { x: 0, y: widgets.length * 2, w: 6, h: 4 },
      config: {}
    };
    setWidgets([...widgets, newWidget]);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Dashboard Layout</CardTitle>
        <CardDescription>
          Design the layout and widgets for this dashboard template
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Layout Type</Label>
            <Select 
              value={config.layout_type || 'grid'} 
              onValueChange={(value) => updateConfig({ layout_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="grid">Grid Layout</SelectItem>
                <SelectItem value="flex">Flexible Layout</SelectItem>
                <SelectItem value="absolute">Absolute Positioning</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Refresh Interval</Label>
            <Select 
              value={config.refresh_interval || '300000'} 
              onValueChange={(value) => updateConfig({ refresh_interval: parseInt(value) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="60000">1 minute</SelectItem>
                <SelectItem value="300000">5 minutes</SelectItem>
                <SelectItem value="600000">10 minutes</SelectItem>
                <SelectItem value="1800000">30 minutes</SelectItem>
                <SelectItem value="3600000">1 hour</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base">Dashboard Widgets</Label>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => addWidget('metric')}>
                <BarChart className="h-4 w-4 mr-2" />
                Metric
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => addWidget('chart')}>
                <BarChart3 className="h-4 w-4 mr-2" />
                Chart
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => addWidget('table')}>
                <Table className="h-4 w-4 mr-2" />
                Table
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {widgets.map((widget: any, index: number) => (
              <Card key={widget.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`p-2 rounded ${
                      widget.type === 'metric' ? 'bg-blue-100' :
                      widget.type === 'chart' ? 'bg-green-100' :
                      'bg-purple-100'
                    }`}>
                      {widget.type === 'metric' && <BarChart className="h-4 w-4" />}
                      {widget.type === 'chart' && <BarChart3 className="h-4 w-4" />}
                      {widget.type === 'table' && <Table className="h-4 w-4" />}
                    </div>
                    <div className="flex-1">
                      <Input
                        value={widget.title}
                        onChange={(e) => {
                          const updatedWidgets = [...widgets];
                          updatedWidgets[index].title = e.target.value;
                          setWidgets(updatedWidgets);
                        }}
                        placeholder="Widget title"
                        className="text-sm"
                      />
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {widget.type}
                    </Badge>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setWidgets(widgets.filter((_: any, i: number) => i !== index))}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}

            {widgets.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Layers className="h-8 w-8 mx-auto mb-2" />
                <p>No widgets added yet. Add widgets to design your dashboard.</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <Label className="text-base">Dashboard Settings</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Responsive Layout</Label>
                <p className="text-xs text-muted-foreground">Auto-adjust for different screen sizes</p>
              </div>
              <Switch defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Allow Widget Resizing</Label>
                <p className="text-xs text-muted-foreground">Users can resize dashboard widgets</p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}