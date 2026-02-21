/**
 * ChartConfigurationDialog Component
 * Comprehensive chart configuration with AI-powered recommendations and advanced features
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Settings,
  X,
  Play,
  Info,
  Calendar,
  Filter,
  Layers,
  Database,
  Brain,
  TrendingUp,
  BarChart3,
  Users,
  Share2,
  Sparkles,
  Target,
  Zap,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Lightbulb,
  Eye,
  Palette,
  Download,
  Globe,
  Clock,
  Activity,
  PieChart,
  MapPin,
  Network,
  LineChart,
  ChevronRight,
  Star,
  Wand2,
  GitBranch,
  RotateCcw,
  Lock
} from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';

import { useVisualizationData } from '@/hooks/useVisualizationData';

interface ChartTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ElementType;
  type: string;
}

interface Visualization {
  id: string;
  title: string;
  description: string;
  visualization_type: string;
  config?: any;
}

interface ChartConfigurationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  template: ChartTemplate | null;
  existingChart?: Visualization | null;
  onGenerate: (config: any) => Promise<void>;
  projectId: string;
}

const USE_CASE_PRESETS = [
  {
    id: 'competitive_analysis',
    name: 'Competitive Analysis',
    description: 'Compare market positioning and patent portfolios',
    icon: TrendingUp,
    recommendedCharts: ['competitive_positioning', 'technology_landscape', 'geographic_distribution'],
    suggestedInsights: ['market_share', 'competitive_gaps', 'geographic_coverage']
  },
  {
    id: 'innovation_opportunities',
    name: 'Innovation Opportunities',
    description: 'Identify white spaces and emerging trends',
    icon: Lightbulb,
    recommendedCharts: ['white_space_analysis', 'technology_landscape', 'patent_timeline'],
    suggestedInsights: ['trend_forecasting', 'gap_analysis', 'emerging_technologies']
  },
  {
    id: 'market_expansion',
    name: 'Market Expansion',
    description: 'Analyze geographic and technology expansion opportunities',
    icon: Globe,
    recommendedCharts: ['geographic_distribution', 'patent_timeline', 'technology_landscape'],
    suggestedInsights: ['regional_trends', 'market_penetration', 'regulatory_analysis']
  },
  {
    id: 'fto_analysis',
    name: 'Freedom to Operate',
    description: 'Assess patent landscape for product development',
    icon: Target,
    recommendedCharts: ['citation_network', 'technology_landscape', 'patent_timeline'],
    suggestedInsights: ['risk_assessment', 'patent_thickets', 'expiration_analysis']
  }
];

const BRAND_THEMES = [
  { id: 'corporate_blue', name: 'Corporate Blue', colors: ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd'] },
  { id: 'professional_green', name: 'Professional Green', colors: ['#059669', '#10b981', '#34d399', '#6ee7b7'] },
  { id: 'executive_purple', name: 'Executive Purple', colors: ['#7c3aed', '#8b5cf6', '#a78bfa', '#c4b5fd'] },
  { id: 'innovation_orange', name: 'Innovation Orange', colors: ['#ea580c', '#fb923c', '#fdba74', '#fed7aa'] },
  { id: 'tech_cyan', name: 'Tech Cyan', colors: ['#0891b2', '#06b6d4', '#67e8f9', '#a5f3fc'] }
];

const EXPORT_FORMATS = [
  { id: 'png_hd', name: 'PNG (High Resolution)', description: 'Best for presentations' },
  { id: 'svg', name: 'SVG (Vector)', description: 'Scalable for any size' },
  { id: 'pdf_report', name: 'PDF Report', description: 'Professional document format' },
  { id: 'html_interactive', name: 'Interactive HTML', description: 'Embeddable in websites' },
  { id: 'powerpoint', name: 'PowerPoint Slides', description: 'Ready for presentations' }
];

export function ChartConfigurationDialog({
  isOpen,
  onClose,
  template,
  existingChart,
  onGenerate,
  projectId
}: ChartConfigurationDialogProps) {
  const {
    datasets,
    selectedDatasets,
    chartRecommendations,
    analyticsCapabilities,
    addDataset,
    removeDataset,
    getCompatibleFields,
    getTotalRecords,
    loading: dataLoading
  } = useVisualizationData(projectId);

  const [activeStep, setActiveStep] = useState(0);
  const [unlockedSteps, setUnlockedSteps] = useState<number[]>([0]); // Only first step unlocked initially
  const [selectedUseCase, setSelectedUseCase] = useState<string>('');
  const [formData, setFormData] = useState({
    // Basic Configuration
    title: existingChart?.title || template?.name || '',
    description: existingChart?.description || '',
    useCase: '',
    
    // Data Configuration
    selectedDatasets: [] as string[],
    dataMapping: {
      xAxis: '',
      yAxis: '',
      colorBy: 'none',
      sizeBy: 'none',
      filterBy: [] as string[]
    },
    
    // Chart Style
    chartVariant: 'standard',
    brandTheme: 'corporate_blue',
    colorScheme: 'default',
    
    // Display Options
    display: {
      showTrend: true,
      showLegend: true,
      interactive: true,
      showInsights: true,
      annotations: true,
      drillDown: false
    },
    
    // Advanced Analytics
    analytics: {
      enableForecasting: false,
      enableClustering: false,
      enableBenchmarking: false,
      enableCorrelation: false,
      insightDepth: 'standard' as 'quick' | 'standard' | 'comprehensive'
    },
    
    // Size and Layout
    size: {
      width: 800,
      height: 500,
      responsive: true
    },
    
    // Collaboration
    sharing: {
      permissions: 'view' as 'view' | 'comment' | 'edit',
      embedEnabled: false,
      exportFormats: [] as string[]
    },
    
    // Time and Filters
    dateRange: {
      from: '',
      to: '',
      granularity: 'monthly' as 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
    },
    
    filters: {
      technology: [] as string[],
      assignees: [] as string[],
      countries: [] as string[],
      customFilters: {} as Record<string, any>
    }
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);

  // Generate real-time preview
  const generatePreview = () => {
    if (!template || selectedDatasets.length === 0) return null;

    // Mock preview data based on configuration
    return {
      chartType: template.type,
      dataPoints: getTotalRecords(),
      estimatedLoadTime: Math.ceil(getTotalRecords() / 1000) + 's',
      insights: Math.min(analyticsCapabilities.filter(c => c.supported).length, 5)
    };
  };

  useEffect(() => {
    setPreviewData(generatePreview());
  }, [template, selectedDatasets, formData]);

  // Smart default configuration based on use case
  const applyUseCasePreset = (useCaseId: string) => {
    const useCase = USE_CASE_PRESETS.find(uc => uc.id === useCaseId);
    if (!useCase) return;

    setFormData(prev => ({
      ...prev,
      useCase: useCaseId,
      analytics: {
        ...prev.analytics,
        enableForecasting: useCase.suggestedInsights.includes('trend_forecasting'),
        enableBenchmarking: useCase.suggestedInsights.includes('competitive_gaps'),
        insightDepth: 'comprehensive'
      },
      display: {
        ...prev.display,
        drillDown: true,
        showInsights: true
      }
    }));
  };

  // Check if a step is complete and unlock next steps
  const checkStepCompletion = (stepIndex: number) => {
    const validation = getStepValidation(stepIndex);
    if (validation.isValid && !unlockedSteps.includes(stepIndex + 1) && stepIndex < 4) {
      setUnlockedSteps(prev => [...prev, stepIndex + 1]);
    }
  };

  // Handle step navigation with progressive unlocking
  const handleStepChange = (newStep: number) => {
    if (unlockedSteps.includes(newStep)) {
      setActiveStep(newStep);
    }
  };

  const handleSubmit = async () => {
    setIsGenerating(true);
    try {
      // Sanitize "none" values to empty strings for processing
      const sanitizedFormData = {
        ...formData,
        dataMapping: {
          ...formData.dataMapping,
          colorBy: formData.dataMapping.colorBy === 'none' ? '' : formData.dataMapping.colorBy,
          sizeBy: formData.dataMapping.sizeBy === 'none' ? '' : formData.dataMapping.sizeBy
        }
      };
      
      await onGenerate({
        ...sanitizedFormData,
        template_id: template?.id,
        visualization_type: template?.id,
        selectedDatasets,
        totalRecords: getTotalRecords(),
        preview: previewData
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getStepValidation = (step: number): { isValid: boolean; issues: string[] } => {
    const issues: string[] = [];
    
    switch (step) {
      case 0: // Use Case & Purpose
        if (!selectedUseCase && !formData.title.trim()) {
          issues.push('Please select a use case or enter a custom title');
        }
        break;
      case 1: // Data Selection
        if (selectedDatasets.length === 0) {
          issues.push('Please select at least one dataset');
        }
        break;
      case 2: // Chart Configuration
        if (!formData.dataMapping.yAxis && template?.type !== 'network') {
          issues.push('Please map a numeric field to Y-axis');
        }
        break;
    }
    
    return { isValid: issues.length === 0, issues };
  };

  // Monitor form changes and unlock steps progressively
  useEffect(() => {
    checkStepCompletion(0); // Check step 0 completion
  }, [selectedUseCase, formData.title]);

  useEffect(() => {
    checkStepCompletion(1); // Check step 1 completion  
  }, [selectedDatasets]);

  useEffect(() => {
    checkStepCompletion(2); // Check step 2 completion
  }, [formData.dataMapping]);

  useEffect(() => {
    checkStepCompletion(3); // Check step 3 completion
  }, [formData.brandTheme, formData.analytics]);

  const steps = [
    { id: 0, title: 'Purpose & Use Case', icon: Target },
    { id: 1, title: 'Data Selection', icon: Database },
    { id: 2, title: 'Chart Configuration', icon: BarChart3 },
    { id: 3, title: 'Style & Analytics', icon: Palette },
    { id: 4, title: 'Collaboration & Export', icon: Share2 }
  ];

  if (!template) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl">
              <template.icon className="h-8 w-8 text-purple-600" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-2xl flex items-center gap-2">
                {existingChart ? 'Edit Chart Configuration' : 'Create Intelligent Chart'}
                <Badge variant="secondary" className="bg-gradient-to-r from-purple-100 to-blue-100">
                  <Brain className="h-3 w-3 mr-1" />
                  AI-Powered
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-base mt-1">
                Configure {template.name} with intelligent recommendations and advanced analytics
              </DialogDescription>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4 mt-4">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = activeStep === index;
              const isCompleted = unlockedSteps.includes(index + 1) && index < 4; // Step is complete if next step is unlocked
              const isUnlocked = unlockedSteps.includes(index);
              const validation = getStepValidation(index);
              
              return (
                <div key={step.id} className="flex items-center">
                  <button
                    onClick={() => handleStepChange(index)}
                    disabled={!isUnlocked}
                    className={`flex items-center gap-2 transition-all ${
                      isUnlocked ? 'cursor-pointer hover:opacity-75' : 'cursor-not-allowed opacity-50'
                    }`}
                  >
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full transition-all ${
                      isCompleted 
                        ? 'bg-green-500 text-white' 
                        : isActive 
                          ? 'bg-purple-600 text-white' 
                          : isUnlocked
                            ? validation.isValid
                              ? 'bg-blue-100 text-blue-600'
                              : 'bg-red-100 text-red-600'
                            : 'bg-gray-300 text-gray-500'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : !isUnlocked ? (
                        <Lock className="h-4 w-4" />
                      ) : (
                        <StepIcon className="h-4 w-4" />
                      )}
                    </div>
                    <div className="hidden md:block">
                      <p className={`text-sm font-medium ${isActive ? 'text-purple-600' : 'text-gray-600'}`}>
                        {step.title}
                      </p>
                    </div>
                  </button>
                  {index < steps.length - 1 && (
                    <ChevronRight className="h-4 w-4 text-gray-400 mx-2" />
                  )}
                </div>
              );
            })}
          </div>
        </DialogHeader>

        <div className="flex gap-6 flex-1 min-h-0">
          {/* Main Configuration Area */}
          <div className="flex-1">
            <ScrollArea className="h-full pr-4">
              {/* Step 0: Purpose & Use Case */}
              {activeStep === 0 && (
                <div className="space-y-6 p-1">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-purple-600" />
                        What story do you want to tell?
                      </CardTitle>
                      <CardDescription>
                        Choose a predefined use case or create a custom analysis
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {USE_CASE_PRESETS.map(useCase => {
                          const UseCaseIcon = useCase.icon;
                          const isSelected = selectedUseCase === useCase.id;
                          
                          return (
                            <Card 
                              key={useCase.id}
                              className={`cursor-pointer transition-all hover:shadow-md ${
                                isSelected ? 'ring-2 ring-purple-500 bg-purple-50' : ''
                              }`}
                              onClick={() => {
                                setSelectedUseCase(useCase.id);
                                applyUseCasePreset(useCase.id);
                              }}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-start gap-3">
                                  <div className={`p-2 rounded-lg ${
                                    isSelected 
                                      ? 'bg-purple-200 text-purple-700' 
                                      : 'bg-gray-100 text-gray-600'
                                  }`}>
                                    <UseCaseIcon className="h-5 w-5" />
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-sm">{useCase.name}</h4>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {useCase.description}
                                    </p>
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      {useCase.recommendedCharts.slice(0, 2).map(chart => (
                                        <Badge key={chart} variant="outline" className="text-xs">
                                          {chart.replace('_', ' ')}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                  {isSelected && (
                                    <CheckCircle className="h-5 w-5 text-purple-600" />
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>

                      <div className="mt-6">
                        <Label htmlFor="custom-title">Or create a custom analysis</Label>
                        <Input
                          id="custom-title"
                          placeholder="Enter your custom chart title..."
                          value={formData.title}
                          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                          className="mt-2"
                        />
                        <Textarea
                          placeholder="Describe what insights you're looking for..."
                          value={formData.description}
                          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                          className="mt-2"
                          rows={2}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Step 1: Data Selection */}
              {activeStep === 1 && (
                <div className="space-y-6 p-1">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Database className="h-5 w-5 text-blue-600" />
                        Smart Data Selection
                      </CardTitle>
                      <CardDescription>
                        Choose datasets and get AI-powered recommendations
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {datasets.length === 0 ? (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            No datasets found. Please create datasets in the Datasets tab first.
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <div className="space-y-3">
                          {datasets.map(dataset => (
                            <Card key={dataset.id} className={`cursor-pointer transition-all hover:shadow-sm ${
                              selectedDatasets.includes(dataset.id) ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                            }`}>
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-start gap-3">
                                    <Checkbox
                                      checked={selectedDatasets.includes(dataset.id)}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          addDataset(dataset.id);
                                        } else {
                                          removeDataset(dataset.id);
                                        }
                                      }}
                                    />
                                    <div className="flex-1">
                                      <h4 className="font-semibold">{dataset.name}</h4>
                                      <p className="text-sm text-muted-foreground">{dataset.description}</p>
                                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                        <span>📊 {dataset.total_patents.toLocaleString()} records</span>
                                        <span>📅 {dataset.dataRange.startDate} - {dataset.dataRange.endDate}</span>
                                        <Badge variant="outline" className="text-xs">
                                          Quality: {dataset.qualityScore}%
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex flex-col items-end">
                                    <Badge variant={dataset.status === 'completed' ? 'secondary' : 'outline'}>
                                      {dataset.status}
                                    </Badge>
                                    {selectedDatasets.includes(dataset.id) && dataset.qualityScore >= 80 && (
                                      <Badge className="bg-green-100 text-green-800 mt-1">
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Recommended
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                      
                      {selectedDatasets.length > 0 && (
                        <div className="mt-4 p-4 bg-green-50 rounded-lg">
                          <div className="flex items-center gap-2 text-green-800">
                            <CheckCircle className="h-4 w-4" />
                            <span className="font-medium">
                              Selected: {getTotalRecords().toLocaleString()} total records
                            </span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* AI Recommendations */}
                  {chartRecommendations.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Brain className="h-5 w-5 text-purple-600" />
                          AI Chart Recommendations
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {chartRecommendations.slice(0, 3).map(rec => (
                          <div key={rec.templateId} className="p-3 border rounded-lg">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium">{rec.templateId.replace('_', ' ')}</h4>
                                  <Badge variant="secondary">
                                    {Math.round(rec.confidence * 100)}% match
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">{rec.reason}</p>
                                <div className="mt-2">
                                  <p className="text-xs font-medium text-green-600">Advantages:</p>
                                  <ul className="text-xs text-muted-foreground list-disc list-inside">
                                    {rec.advantages.slice(0, 2).map((adv, idx) => (
                                      <li key={idx}>{adv}</li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                              <Button size="sm" variant="outline">
                                <Wand2 className="h-3 w-3 mr-1" />
                                Apply
                              </Button>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Step 2: Chart Configuration */}
              {activeStep === 2 && (
                <div className="space-y-6 p-1">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5 text-blue-600" />
                        Data Mapping & Configuration
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>X-Axis (Time/Categories)</Label>
                          <Select 
                            value={formData.dataMapping.xAxis}
                            onValueChange={(value) => setFormData(prev => ({
                              ...prev,
                              dataMapping: { ...prev.dataMapping, xAxis: value }
                            }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select X-axis field..." />
                            </SelectTrigger>
                            <SelectContent>
                              {getCompatibleFields('x_axis').map(field => (
                                <SelectItem key={field.name} value={field.name}>
                                  <div className="flex items-center gap-2">
                                    {field.type === 'date' ? <Calendar className="h-3 w-3" /> : <BarChart3 className="h-3 w-3" />}
                                    {field.name} ({field.completeness * 100}% complete)
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Y-Axis (Values)</Label>
                          <Select 
                            value={formData.dataMapping.yAxis}
                            onValueChange={(value) => setFormData(prev => ({
                              ...prev,
                              dataMapping: { ...prev.dataMapping, yAxis: value }
                            }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select Y-axis field..." />
                            </SelectTrigger>
                            <SelectContent>
                              {getCompatibleFields('y_axis').map(field => (
                                <SelectItem key={field.name} value={field.name}>
                                  <div className="flex items-center gap-2">
                                    <TrendingUp className="h-3 w-3" />
                                    {field.name} ({field.uniqueValues} unique values)
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Color By (Optional)</Label>
                          <Select 
                            value={formData.dataMapping.colorBy}
                            onValueChange={(value) => setFormData(prev => ({
                              ...prev,
                              dataMapping: { ...prev.dataMapping, colorBy: value }
                            }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select color grouping..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              {getCompatibleFields('color').map(field => (
                                <SelectItem key={field.name} value={field.name}>
                                  <div className="flex items-center gap-2">
                                    <Palette className="h-3 w-3" />
                                    {field.name}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Size By (Optional)</Label>
                          <Select 
                            value={formData.dataMapping.sizeBy}
                            onValueChange={(value) => setFormData(prev => ({
                              ...prev,
                              dataMapping: { ...prev.dataMapping, sizeBy: value }
                            }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select size field..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              {getCompatibleFields('size').map(field => (
                                <SelectItem key={field.name} value={field.name}>
                                  <div className="flex items-center gap-2">
                                    <Activity className="h-3 w-3" />
                                    {field.name}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Chart Variant Selection */}
                      <div className="space-y-3 mt-6">
                        <Label>Chart Variant</Label>
                        <div className="grid grid-cols-3 gap-3">
                          {['standard', 'detailed', 'executive'].map(variant => (
                            <Card 
                              key={variant}
                              className={`cursor-pointer transition-all hover:shadow-sm ${
                                formData.chartVariant === variant ? 'ring-2 ring-purple-500' : ''
                              }`}
                              onClick={() => setFormData(prev => ({ ...prev, chartVariant: variant }))}
                            >
                              <CardContent className="p-3 text-center">
                                <h4 className="font-medium text-sm capitalize">{variant}</h4>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {variant === 'standard' ? 'Balanced detail' : 
                                   variant === 'detailed' ? 'Maximum information' : 
                                   'Clean & simple'}
                                </p>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Date Range & Filters */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Time Range & Filters
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>From Date</Label>
                          <Input
                            type="date"
                            value={formData.dateRange.from}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              dateRange: { ...prev.dateRange, from: e.target.value }
                            }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>To Date</Label>
                          <Input
                            type="date"
                            value={formData.dateRange.to}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              dateRange: { ...prev.dateRange, to: e.target.value }
                            }))}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Time Granularity</Label>
                        <Select 
                          value={formData.dateRange.granularity}
                          onValueChange={(value: any) => setFormData(prev => ({
                            ...prev,
                            dateRange: { ...prev.dateRange, granularity: value }
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="quarterly">Quarterly</SelectItem>
                            <SelectItem value="yearly">Yearly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Step 3: Style & Analytics */}
              {activeStep === 3 && (
                <div className="space-y-6 p-1">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Palette className="h-5 w-5 text-purple-600" />
                        Professional Styling
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <Label>Brand Theme</Label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {BRAND_THEMES.map(theme => (
                            <Card 
                              key={theme.id}
                              className={`cursor-pointer transition-all hover:shadow-sm ${
                                formData.brandTheme === theme.id ? 'ring-2 ring-purple-500' : ''
                              }`}
                              onClick={() => setFormData(prev => ({ ...prev, brandTheme: theme.id }))}
                            >
                              <CardContent className="p-3">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="flex gap-1">
                                    {theme.colors.map((color, idx) => (
                                      <div 
                                        key={idx}
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: color }}
                                      />
                                    ))}
                                  </div>
                                </div>
                                <h4 className="font-medium text-sm">{theme.name}</h4>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <Label>Interactive Mode</Label>
                              <p className="text-xs text-muted-foreground">Enable zoom, hover, click</p>
                            </div>
                            <Switch
                              checked={formData.display.interactive}
                              onCheckedChange={(checked) => setFormData(prev => ({ 
                                ...prev, 
                                display: { ...prev.display, interactive: checked }
                              }))}
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <Label>Show Legend</Label>
                              <p className="text-xs text-muted-foreground">Display chart legend</p>
                            </div>
                            <Switch
                              checked={formData.display.showLegend}
                              onCheckedChange={(checked) => setFormData(prev => ({ 
                                ...prev, 
                                display: { ...prev.display, showLegend: checked }
                              }))}
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <Label>Trend Lines</Label>
                              <p className="text-xs text-muted-foreground">Show trend analysis</p>
                            </div>
                            <Switch
                              checked={formData.display.showTrend}
                              onCheckedChange={(checked) => setFormData(prev => ({ 
                                ...prev, 
                                display: { ...prev.display, showTrend: checked }
                              }))}
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <Label>Drill-Down</Label>
                              <p className="text-xs text-muted-foreground">Click to explore details</p>
                            </div>
                            <Switch
                              checked={formData.display.drillDown}
                              onCheckedChange={(checked) => setFormData(prev => ({ 
                                ...prev, 
                                display: { ...prev.display, drillDown: checked }
                              }))}
                            />
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Chart Width (px)</Label>
                            <Input
                              type="number"
                              value={formData.size.width}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                size: { ...prev.size, width: parseInt(e.target.value) || 800 }
                              }))}
                              min="400"
                              max="1600"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Chart Height (px)</Label>
                            <Input
                              type="number"
                              value={formData.size.height}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                size: { ...prev.size, height: parseInt(e.target.value) || 500 }
                              }))}
                              min="300"
                              max="1000"
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <Label>Responsive</Label>
                              <p className="text-xs text-muted-foreground">Auto-scale to container</p>
                            </div>
                            <Switch
                              checked={formData.size.responsive}
                              onCheckedChange={(checked) => setFormData(prev => ({ 
                                ...prev, 
                                size: { ...prev.size, responsive: checked }
                              }))}
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Advanced Analytics */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Brain className="h-5 w-5 text-blue-600" />
                        Advanced Analytics
                      </CardTitle>
                      <CardDescription>
                        Enable AI-powered insights and statistical analysis
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {analyticsCapabilities.map(capability => (
                          <div key={capability.name} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-sm">{capability.name}</h4>
                                {capability.supported ? (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                ) : (
                                  <AlertCircle className="h-4 w-4 text-gray-400" />
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {capability.description}
                              </p>
                              {!capability.supported && (
                                <p className="text-xs text-orange-600 mt-1">
                                  Requires: {capability.requirements.join(', ')}
                                </p>
                              )}
                            </div>
                            <Switch
                              disabled={!capability.supported}
                              checked={
                                (capability.name === 'Forecasting' && formData.analytics.enableForecasting) ||
                                (capability.name === 'Clustering Analysis' && formData.analytics.enableClustering) ||
                                (capability.name === 'Competitive Benchmarking' && formData.analytics.enableBenchmarking) ||
                                (capability.name === 'Correlation Analysis' && formData.analytics.enableCorrelation)
                              }
                              onCheckedChange={(checked) => {
                                const key = capability.name === 'Forecasting' ? 'enableForecasting' :
                                           capability.name === 'Clustering Analysis' ? 'enableClustering' :
                                           capability.name === 'Competitive Benchmarking' ? 'enableBenchmarking' :
                                           'enableCorrelation';
                                setFormData(prev => ({
                                  ...prev,
                                  analytics: { ...prev.analytics, [key]: checked }
                                }));
                              }}
                            />
                          </div>
                        ))}
                      </div>

                      <div className="space-y-2">
                        <Label>Insight Depth</Label>
                        <Select 
                          value={formData.analytics.insightDepth}
                          onValueChange={(value: any) => setFormData(prev => ({
                            ...prev,
                            analytics: { ...prev.analytics, insightDepth: value }
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="quick">Quick Insights (1-2 key findings)</SelectItem>
                            <SelectItem value="standard">Standard Analysis (3-5 insights)</SelectItem>
                            <SelectItem value="comprehensive">Comprehensive Report (5-10 insights)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Step 4: Collaboration & Export */}
              {activeStep === 4 && (
                <div className="space-y-6 p-1">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Share2 className="h-5 w-5 text-green-600" />
                        Collaboration & Sharing
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <Label>Sharing Permissions</Label>
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { value: 'view', label: 'View Only', icon: Eye },
                            { value: 'comment', label: 'Comment', icon: Users },
                            { value: 'edit', label: 'Full Edit', icon: Settings }
                          ].map(permission => {
                            const PermissionIcon = permission.icon;
                            return (
                              <Card 
                                key={permission.value}
                                className={`cursor-pointer transition-all hover:shadow-sm ${
                                  formData.sharing.permissions === permission.value ? 'ring-2 ring-green-500' : ''
                                }`}
                                onClick={() => setFormData(prev => ({
                                  ...prev,
                                  sharing: { ...prev.sharing, permissions: permission.value as any }
                                }))}
                              >
                                <CardContent className="p-3 text-center">
                                  <PermissionIcon className="h-5 w-5 mx-auto mb-2" />
                                  <h4 className="font-medium text-sm">{permission.label}</h4>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Enable Embedding</Label>
                          <p className="text-xs text-muted-foreground">Generate embeddable HTML code</p>
                        </div>
                        <Switch
                          checked={formData.sharing.embedEnabled}
                          onCheckedChange={(checked) => setFormData(prev => ({ 
                            ...prev, 
                            sharing: { ...prev.sharing, embedEnabled: checked }
                          }))}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Download className="h-5 w-5 text-blue-600" />
                        Export Options
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <Label>Available Export Formats</Label>
                        <div className="space-y-2">
                          {EXPORT_FORMATS.map(format => (
                            <div key={format.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={format.id}
                                checked={formData.sharing.exportFormats.includes(format.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setFormData(prev => ({
                                      ...prev,
                                      sharing: {
                                        ...prev.sharing,
                                        exportFormats: [...prev.sharing.exportFormats, format.id]
                                      }
                                    }));
                                  } else {
                                    setFormData(prev => ({
                                      ...prev,
                                      sharing: {
                                        ...prev.sharing,
                                        exportFormats: prev.sharing.exportFormats.filter(f => f !== format.id)
                                      }
                                    }));
                                  }
                                }}
                              />
                              <Label htmlFor={format.id} className="flex-1">
                                <div>
                                  <p className="font-medium">{format.name}</p>
                                  <p className="text-xs text-muted-foreground">{format.description}</p>
                                </div>
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Live Preview Panel */}
          <div className="w-80 border-l bg-gray-50 p-4 flex flex-col">
            <ScrollArea className="h-full">
              <div className="space-y-4 pr-2">
                <div>
                <h3 className="font-semibold flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Live Preview
                </h3>
                <p className="text-xs text-muted-foreground">
                  Real-time chart preview
                </p>
              </div>

              {previewData && (
                <Card>
                  <CardContent className="p-4">
                    <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center mb-3">
                      <div className="text-center">
                        <template.icon className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                        <p className="text-sm font-medium">{template.name}</p>
                        <p className="text-xs text-muted-foreground">Preview</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Data Points:</span>
                        <span className="font-medium">{previewData.dataPoints.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Load Time:</span>
                        <span className="font-medium">{previewData.estimatedLoadTime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Insights:</span>
                        <span className="font-medium">{previewData.insights}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Configuration Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span>Use Case:</span>
                    <span>{selectedUseCase || 'Custom'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Datasets:</span>
                    <span>{selectedDatasets.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Analytics:</span>
                    <span>{analyticsCapabilities.filter(c => c.supported).length} enabled</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Export Formats:</span>
                    <span>{formData.sharing.exportFormats.length}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Validation Summary */}
              <Card>
                <CardContent className="p-3">
                  <div className="space-y-2">
                    {steps.map((step, index) => {
                      const validation = getStepValidation(index);
                      return (
                        <div key={step.id} className="flex items-center gap-2 text-xs">
                          {validation.isValid ? (
                            <CheckCircle className="h-3 w-3 text-green-500" />
                          ) : (
                            <AlertCircle className="h-3 w-3 text-red-500" />
                          )}
                          <span className={validation.isValid ? 'text-green-700' : 'text-red-700'}>
                            {step.title}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
              </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter className="gap-2 pt-4">
          <div className="flex items-center justify-between w-full">
            <div className="flex gap-2">
              {activeStep > 0 && (
                <Button variant="outline" onClick={() => handleStepChange(activeStep - 1)}>
                  <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
                  Previous
                </Button>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              
              {activeStep < steps.length - 1 ? (
                <Button 
                  onClick={() => {
                    const currentStepValid = getStepValidation(activeStep).isValid;
                    if (currentStepValid && !unlockedSteps.includes(activeStep + 1)) {
                      setUnlockedSteps(prev => [...prev, activeStep + 1]);
                    }
                    if (currentStepValid) {
                      setActiveStep(prev => prev + 1);
                    }
                  }}
                  disabled={!getStepValidation(activeStep).isValid}
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button 
                  onClick={handleSubmit} 
                  disabled={isGenerating || !getStepValidation(activeStep).isValid}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Play className="h-4 w-4 mr-2" />
                  {isGenerating ? 'Generating...' : existingChart ? 'Update Chart' : 'Generate Chart'}
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}