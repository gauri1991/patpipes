'use client';

import { useState, useMemo, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Plus, 
  Eye, 
  Edit, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  MoreVertical,
  Filter,
  Search,
  Calendar,
  FileSpreadsheet,
  File,
  Share,
  Bookmark,
  Settings,
  BarChart3,
  TrendingUp,
  Users,
  Target,
  Globe,
  RefreshCw,
  Copy,
  Trash2
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';

import { useAnalyticsReports } from '@/hooks/useAnalyticsData';
import { AnalyticsReport } from '@/services/analyticsApi';
import { reportService } from '@/services/reportService';
import { toast } from 'sonner';

// Report templates and mock data
const reportTemplates = [
  {
    type: 'landscape_analysis',
    name: 'Patent Landscape Analysis',
    description: 'Comprehensive analysis of patent landscape in specific technology areas',
    sections: [
      'Executive Summary',
      'Technology Overview',
      'Patent Filing Trends',
      'Key Players Analysis',
      'Technology Maturity Assessment',
      'White Space Analysis',
      'Recommendations'
    ],
    estimatedTime: '2-3 hours',
    icon: BarChart3
  },
  {
    type: 'competitive_intelligence',
    name: 'Competitive Intelligence Report',
    description: 'In-depth analysis of competitor patent portfolios and strategies',
    sections: [
      'Executive Summary',
      'Competitive Landscape',
      'Competitor Profiles',
      'Patent Portfolio Analysis',
      'Strategic Positioning',
      'Threat Assessment',
      'Strategic Recommendations'
    ],
    estimatedTime: '1-2 hours',
    icon: Target
  },
  {
    type: 'fto_analysis',
    name: 'Freedom to Operate Analysis',
    description: 'Assessment of patent landscape for product development clearance',
    sections: [
      'Executive Summary',
      'Technology Scope',
      'Relevant Patent Analysis',
      'Risk Assessment',
      'Design-Around Opportunities',
      'Licensing Options',
      'Risk Mitigation Strategy'
    ],
    estimatedTime: '3-4 hours',
    icon: AlertCircle
  },
  {
    type: 'white_space_analysis',
    name: 'White Space Analysis',
    description: 'Identification of innovation opportunities and patent gaps',
    sections: [
      'Executive Summary',
      'Technology Mapping',
      'Patent Gap Analysis',
      'Innovation Opportunities',
      'Market Assessment',
      'Investment Recommendations',
      'Implementation Roadmap'
    ],
    estimatedTime: '2-3 hours',
    icon: TrendingUp
  },
  {
    type: 'portfolio_assessment',
    name: 'Portfolio Assessment',
    description: 'Comprehensive evaluation of existing patent portfolio strength',
    sections: [
      'Executive Summary',
      'Portfolio Overview',
      'Quality Assessment',
      'Coverage Analysis',
      'Competitive Positioning',
      'Monetization Opportunities',
      'Portfolio Optimization'
    ],
    estimatedTime: '1-2 hours',
    icon: FileText
  },
  {
    type: 'technology_trends',
    name: 'Technology Trends Report',
    description: 'Analysis of emerging technologies and future innovation directions',
    sections: [
      'Executive Summary',
      'Technology Evolution',
      'Emerging Trends',
      'Innovation Hotspots',
      'Future Projections',
      'Investment Implications',
      'Strategic Recommendations'
    ],
    estimatedTime: '2-3 hours',
    icon: Globe
  }
];

const mockReports: AnalyticsReport[] = [
  {
    id: '1',
    title: 'AI/ML Patent Landscape Q4 2024',
    report_type: 'landscape_analysis',
    status: 'completed',
    executive_summary: 'Comprehensive analysis of AI/ML patent landscape showing significant growth in neural network architectures and edge computing applications.',
    sections: {
      technology_overview: 'Analysis covers 15,000+ patents across machine learning, deep learning, and AI applications.',
      key_findings: 'Major growth in transformer architectures (45%), computer vision (38%), and federated learning (67%).'
    },
    conclusions: 'The AI/ML patent landscape shows rapid innovation with increasing focus on practical applications and edge deployment.',
    recommendations: [
      'Focus R&D efforts on federated learning architectures',
      'Monitor edge AI optimization patents for licensing opportunities',
      'Consider defensive patent strategy in transformer technologies'
    ],
    include_sections: ['executive_summary', 'technology_overview', 'filing_trends', 'key_players', 'recommendations'],
    template_config: {
      format: 'comprehensive',
      charts_included: true,
      appendix: true
    },
    pdf_file: '/reports/ai_ml_landscape_q4_2024.pdf',
    excel_file: '/reports/ai_ml_landscape_data_q4_2024.xlsx',
    created_by: {
      id: '1',
      firstName: 'Sarah',
      lastName: 'Chen',
      email: 'sarah.chen@company.com',
      role: 'Patent Analyst'
    },
    review_notes: 'Excellent analysis with actionable insights. Approved for client distribution.',
    approved_at: '2024-01-15T14:30:00Z',
    created_at: '2024-01-10T09:00:00Z',
    updated_at: '2024-01-15T14:30:00Z'
  },
  {
    id: '2',
    title: 'Autonomous Vehicle FTO Analysis',
    report_type: 'fto_analysis',
    status: 'review',
    executive_summary: 'Freedom to operate analysis for autonomous vehicle sensor fusion technology, identifying key patent risks and mitigation strategies.',
    sections: {
      technology_scope: 'Analysis covers LIDAR, camera, and radar sensor fusion for autonomous navigation.',
      risk_assessment: 'Medium-high risk identified in several key technology areas.'
    },
    conclusions: 'Several patent thickets identified requiring careful design-around or licensing strategies.',
    recommendations: [
      'Pursue licensing agreement with Waymo for key LIDAR patents',
      'Develop alternative sensor fusion algorithms',
      'File defensive patents in identified white spaces'
    ],
    include_sections: ['executive_summary', 'technology_scope', 'risk_assessment', 'licensing_options'],
    template_config: {
      format: 'detailed',
      risk_matrix: true,
      patent_citations: true
    },
    created_by: {
      id: '2',
      firstName: 'Michael',
      lastName: 'Rodriguez',
      email: 'michael.rodriguez@company.com',
      role: 'Senior Patent Attorney'
    },
    review_notes: '',
    created_at: '2024-01-08T11:15:00Z',
    updated_at: '2024-01-12T16:20:00Z'
  },
  {
    id: '3',
    title: 'Quantum Computing Competitive Intelligence',
    report_type: 'competitive_intelligence',
    status: 'generating',
    executive_summary: 'Analysis of major players in quantum computing patent landscape including IBM, Google, and emerging startups.',
    sections: {},
    conclusions: '',
    recommendations: [],
    include_sections: ['executive_summary', 'competitive_landscape', 'competitor_profiles', 'strategic_recommendations'],
    template_config: {
      format: 'executive',
      competitor_comparison: true,
      market_analysis: true
    },
    created_by: {
      id: '3',
      firstName: 'Dr. Emily',
      lastName: 'Watson',
      email: 'emily.watson@company.com',
      role: 'Research Director'
    },
    review_notes: '',
    created_at: '2024-01-14T08:30:00Z',
    updated_at: '2024-01-14T08:30:00Z'
  },
  {
    id: '4',
    title: 'Green Technology Portfolio Assessment',
    report_type: 'portfolio_assessment',
    status: 'draft',
    executive_summary: 'Comprehensive assessment of our green technology patent portfolio strength and optimization opportunities.',
    sections: {},
    conclusions: '',
    recommendations: [],
    include_sections: ['executive_summary', 'portfolio_overview', 'quality_assessment', 'optimization'],
    template_config: {
      format: 'detailed',
      portfolio_metrics: true,
      benchmarking: true
    },
    created_by: {
      id: '1',
      firstName: 'Sarah',
      lastName: 'Chen',
      email: 'sarah.chen@company.com',
      role: 'Patent Analyst'
    },
    review_notes: '',
    created_at: '2024-01-12T13:45:00Z',
    updated_at: '2024-01-13T10:15:00Z'
  }
];

interface CreateReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Partial<AnalyticsReport>) => void;
}

function CreateReportDialog({ open, onOpenChange, onSubmit }: CreateReportDialogProps) {
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    include_sections: [] as string[],
    template_config: {
      format: 'comprehensive',
      charts_included: true,
      appendix: false
    }
  });

  const selectedTemplateData = reportTemplates.find(t => t.type === selectedTemplate);

  const handleSubmit = () => {
    if (formData.title.trim() && selectedTemplate) {
      onSubmit({
        title: formData.title,
        report_type: selectedTemplate as any,
        include_sections: formData.include_sections,
        template_config: formData.template_config,
        status: 'draft'
      });
      onOpenChange(false);
      // Reset form
      setFormData({
        title: '',
        description: '',
        include_sections: [],
        template_config: {
          format: 'comprehensive',
          charts_included: true,
          appendix: false
        }
      });
      setSelectedTemplate('');
    }
  };

  const handleSectionToggle = (section: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        include_sections: [...prev.include_sections, section]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        include_sections: prev.include_sections.filter(s => s !== section)
      }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Report</DialogTitle>
          <DialogDescription>
            Generate a professional patent analysis report using our AI-powered templates.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Template Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Report Template</Label>
            <div className="grid gap-3">
              {reportTemplates.map((template) => {
                const Icon = template.icon;
                return (
                  <Card 
                    key={template.type}
                    className={`cursor-pointer transition-all ${
                      selectedTemplate === template.type 
                        ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                    onClick={() => setSelectedTemplate(template.type)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                          <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{template.name}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {template.description}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>⏱️ {template.estimatedTime}</span>
                            <span>📄 {template.sections.length} sections</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {selectedTemplate && (
            <>
              {/* Report Details */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Report Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder={`e.g., ${selectedTemplateData?.name} - Q4 2024`}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Report Format</Label>
                  <Select
                    value={formData.template_config.format}
                    onValueChange={(value) => setFormData(prev => ({
                      ...prev,
                      template_config: { ...prev.template_config, format: value }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="executive">Executive Summary (5-10 pages)</SelectItem>
                      <SelectItem value="comprehensive">Comprehensive (15-25 pages)</SelectItem>
                      <SelectItem value="detailed">Detailed Analysis (25+ pages)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Section Selection */}
              <div className="space-y-3">
                <Label>Include Sections</Label>
                <div className="grid gap-2">
                  {selectedTemplateData?.sections.map((section) => (
                    <div key={section} className="flex items-center space-x-2">
                      <Checkbox
                        id={section}
                        checked={formData.include_sections.includes(section)}
                        onCheckedChange={(checked) => handleSectionToggle(section, checked as boolean)}
                      />
                      <Label htmlFor={section} className="text-sm">
                        {section}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Additional Options */}
              <div className="space-y-3">
                <Label>Additional Options</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="charts"
                      checked={formData.template_config.charts_included}
                      onCheckedChange={(checked) => setFormData(prev => ({
                        ...prev,
                        template_config: { ...prev.template_config, charts_included: checked as boolean }
                      }))}
                    />
                    <Label htmlFor="charts" className="text-sm">
                      Include charts and visualizations
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="appendix"
                      checked={formData.template_config.appendix}
                      onCheckedChange={(checked) => setFormData(prev => ({
                        ...prev,
                        template_config: { ...prev.template_config, appendix: checked as boolean }
                      }))}
                    />
                    <Label htmlFor="appendix" className="text-sm">
                      Include detailed appendix with raw data
                    </Label>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!formData.title.trim() || !selectedTemplate}
          >
            Create Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface ReportCardProps {
  report: AnalyticsReport;
  onUpdate: (id: string, data: Partial<AnalyticsReport>) => void;
  onDelete: (id: string) => void;
  onGenerate: (id: string) => void;
  onDownload: (id: string, format: 'pdf' | 'excel') => void;
}

function ReportCard({ report, onUpdate, onDelete, onGenerate, onDownload }: ReportCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'approved': return 'bg-blue-500';
      case 'review': return 'bg-yellow-500';
      case 'generating': return 'bg-purple-500';
      case 'draft': return 'bg-gray-500';
      case 'archived': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'approved': return 'default';
      case 'review': return 'secondary';
      case 'generating': return 'secondary';
      case 'draft': return 'outline';
      case 'archived': return 'outline';
      default: return 'outline';
    }
  };

  const templateInfo = reportTemplates.find(t => t.type === report.report_type);
  const Icon = templateInfo?.icon || FileText;

  return (
    <Card className="relative">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
            <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between">
              <CardTitle className="text-base leading-tight">{report.title}</CardTitle>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuItem>
                    <Eye className="mr-2 h-4 w-4" />
                    View Report
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Details
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Copy className="mr-2 h-4 w-4" />
                    Duplicate Report
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {report.status === 'draft' && (
                    <DropdownMenuItem onClick={() => onGenerate(report.id)}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Generate Report
                    </DropdownMenuItem>
                  )}
                  {(report.pdf_file || report.excel_file) && (
                    <>
                      <DropdownMenuItem onClick={() => onDownload(report.id, 'pdf')}>
                        <File className="mr-2 h-4 w-4" />
                        Download PDF
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDownload(report.id, 'excel')}>
                        <FileSpreadsheet className="mr-2 h-4 w-4" />
                        Download Excel
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Share className="mr-2 h-4 w-4" />
                    Share Report
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Report
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <CardDescription>{templateInfo?.description}</CardDescription>
          </div>
        </div>
        
        <div className="flex items-center gap-4 pt-2">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${getStatusColor(report.status)}`} />
            <Badge variant={getStatusVariant(report.status)} className="text-xs">
              {report.status.replace('_', ' ')}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{new Date(report.updated_at).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Users className="h-3 w-3" />
            <span>{report.created_by.firstName} {report.created_by.lastName}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          {report.executive_summary && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {report.executive_summary}
            </p>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>📄 {report.include_sections.length} sections</span>
              <span>🎯 {templateInfo?.name}</span>
            </div>
            
            <div className="flex items-center gap-2">
              {report.status === 'completed' && (
                <>
                  <Button size="sm" variant="outline" onClick={() => onDownload(report.id, 'pdf')}>
                    <File className="mr-1 h-3 w-3" />
                    PDF
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => onDownload(report.id, 'excel')}>
                    <FileSpreadsheet className="mr-1 h-3 w-3" />
                    Excel
                  </Button>
                </>
              )}
              
              {report.status === 'draft' && (
                <Button size="sm" onClick={() => onGenerate(report.id)}>
                  <RefreshCw className="mr-2 h-3 w-3" />
                  Generate
                </Button>
              )}
              
              {report.status !== 'draft' && report.status !== 'generating' && (
                <Button size="sm">
                  <Eye className="mr-2 h-3 w-3" />
                  View
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ReportsTab() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Use real API data via useAnalyticsReports hook
  const { 
    reports: apiReports, 
    loading, 
    createReport, 
    generateReport: apiGenerateReport,
    refetch: refetchReports 
  } = useAnalyticsReports();

  // Filter reports
  const filteredReports = useMemo(() => {
    if (!apiReports || !Array.isArray(apiReports)) return [];
    return apiReports.filter(report => {
      if (statusFilter !== 'all' && report.status !== statusFilter) return false;
      if (typeFilter !== 'all' && report.report_type !== typeFilter) return false;
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          report.title.toLowerCase().includes(searchLower) ||
          (report.executive_summary && report.executive_summary.toLowerCase().includes(searchLower))
        );
      }
      return true;
    });
  }, [apiReports, statusFilter, typeFilter, searchTerm]);

  const handleCreateReport = async (data: Partial<AnalyticsReport>) => {
    try {
      await createReport(data);
      toast.success('Report created successfully', {
        description: 'You can now generate the report content.'
      });
    } catch (error) {
      console.error('Error creating report:', error);
      toast.error('Failed to create report');
    }
  };

  const handleGenerateReport = async (reportId: string) => {
    try {
      const report = apiReports?.find(r => r.id === reportId);
      if (!report) return;

      toast.info('Generating report...', {
        description: 'AI is analyzing data and creating your professional report'
      });

      // Use the API to generate the report
      await apiGenerateReport(reportId);

      toast.success('Report generated successfully!', {
        description: 'Report content has been generated with PDF and Excel exports ready'
      });

      // Refresh the reports list to get updated data
      refetchReports();

    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report', {
        description: 'Please check your data sources and try again'
      });
    }
  };

  const handleDownloadReport = async (reportId: string, format: 'pdf' | 'excel') => {
    try {
      const report = apiReports?.find(r => r.id === reportId);
      if (!report) return;

      const fileUrl = format === 'pdf' ? report.pdf_file : report.excel_file;
      if (!fileUrl) {
        toast.error(`${format.toUpperCase()} file not available`);
        return;
      }

      toast.info(`Preparing ${format.toUpperCase()} download...`);

      // Use the report service to handle the actual download
      const filename = `${report.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      
      await reportService.downloadReport(fileUrl, filename);

      toast.success(`${format.toUpperCase()} report downloaded successfully!`);

    } catch (error) {
      console.error('Download error:', error);
      toast.error(`Failed to download ${format.toUpperCase()} report`, {
        description: 'Please try again or contact support if the issue persists'
      });
    }
  };

  const handleUpdateReport = async (reportId: string, data: Partial<AnalyticsReport>) => {
    try {
      // This would need an updateReport function in the hook
      // For now, just refresh the data
      refetchReports();
      toast.success('Report updated successfully');
    } catch (error) {
      console.error('Error updating report:', error);
      toast.error('Failed to update report');
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    try {
      // This would need a deleteReport function in the hook
      // For now, just show a message
      toast.info('Delete functionality will be implemented soon');
    } catch (error) {
      console.error('Error deleting report:', error);
      toast.error('Failed to delete report');
    }
  };

  // Summary statistics
  const summaryStats = useMemo(() => {
    if (!apiReports || !Array.isArray(apiReports)) {
      return { total: 0, completed: 0, inProgress: 0, drafts: 0 };
    }
    
    const total = apiReports.length;
    const completed = apiReports.filter(r => r.status === 'completed').length;
    const inProgress = apiReports.filter(r => r.status === 'generating' || r.status === 'review').length;
    const drafts = apiReports.filter(r => r.status === 'draft').length;

    return { total, completed, inProgress, drafts };
  }, [apiReports]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Professional Reports</h2>
          <p className="text-muted-foreground">
            Generate comprehensive patent analysis reports with PDF/Excel export
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Report
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.total}</div>
            <p className="text-xs text-muted-foreground">
              Professional analyses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.completed}</div>
            <p className="text-xs text-muted-foreground">
              Ready for download
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.inProgress}</div>
            <p className="text-xs text-muted-foreground">
              Being generated/reviewed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft Reports</CardTitle>
            <Edit className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.drafts}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting generation
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search reports..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="generating">Generating</SelectItem>
            <SelectItem value="review">Under Review</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="landscape_analysis">Landscape Analysis</SelectItem>
            <SelectItem value="competitive_intelligence">Competitive Intelligence</SelectItem>
            <SelectItem value="fto_analysis">FTO Analysis</SelectItem>
            <SelectItem value="white_space_analysis">White Space Analysis</SelectItem>
            <SelectItem value="portfolio_assessment">Portfolio Assessment</SelectItem>
            <SelectItem value="technology_trends">Technology Trends</SelectItem>
          </SelectContent>
        </Select>

        <div className="text-sm text-muted-foreground">
          {filteredReports.length} of {apiReports?.length || 0} reports
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {filteredReports.map((report) => (
          <ReportCard
            key={report.id}
            report={report}
            onUpdate={handleUpdateReport}
            onDelete={handleDeleteReport}
            onGenerate={handleGenerateReport}
            onDownload={handleDownloadReport}
          />
        ))}
      </div>

      {filteredReports.length === 0 && (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">No reports found</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Create your first professional patent analysis report.
          </p>
          <Button className="mt-4" onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Report
          </Button>
        </div>
      )}

      {/* Create Report Dialog */}
      <CreateReportDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSubmit={handleCreateReport}
      />
    </div>
  );
}