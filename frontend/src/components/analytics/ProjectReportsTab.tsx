/**
 * ProjectReportsTab Component
 * Manages reports for a specific project with template integration
 */

'use client';

import { useState, useEffect } from 'react';
import { useTemplates } from '@/hooks/useTemplates';
import { 
  Template,
  TemplateType,
  ReportTemplate,
  TemplateScope
} from '@/types/template.types';
import {
  FileText,
  Plus,
  Download,
  Eye,
  Edit,
  Share,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Send,
  Archive,
  Settings,
  Search,
  Filter,
  MoreVertical,
  Upload,
  Copy,
  Trash2,
  RefreshCw,
  FileDown,
  BookOpen,
  Layout,
  Target,
  Shield,
  Lightbulb,
  Brain,
  Users
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ReportEditor } from './ReportEditor';
import { ReviewWorkflowDialog } from './ReviewWorkflowDialog';
import { notificationService } from '@/services/notificationService';
import { toast } from 'sonner';

interface ProjectReportsTabProps {
  projectId: string;
  project?: any;
}

// Mock project reports data
const mockProjectReports = [
  {
    id: 'report_1',
    name: 'Q4 2024 Patent Landscape Analysis',
    type: 'landscape_analysis',
    status: 'completed',
    template_id: 'report_landscape',
    created_at: '2024-12-15T10:00:00Z',
    updated_at: '2024-12-20T14:30:00Z',
    created_by: { name: 'John Smith', avatar: '' },
    progress: 100,
    sections_completed: 7,
    total_sections: 7,
    file_size: '2.3 MB',
    format: 'pdf',
    review_status: null,
    reviewer: null,
    review_comments: null
  },
  {
    id: 'report_2',
    name: 'Competitor Analysis - Tech Corp',
    type: 'competitive_intelligence',
    status: 'in_progress',
    template_id: 'report_competitive',
    created_at: '2025-01-05T09:00:00Z',
    updated_at: '2025-01-08T11:20:00Z',
    created_by: { name: 'Sarah Johnson', avatar: '' },
    progress: 65,
    sections_completed: 5,
    total_sections: 7,
    file_size: null,
    format: null,
    review_status: null,
    reviewer: null,
    review_comments: null
  },
  {
    id: 'report_3',
    name: 'FTO Assessment - New Product Line',
    type: 'freedom_to_operate',
    status: 'draft',
    template_id: 'report_fto',
    created_at: '2025-01-07T14:00:00Z',
    updated_at: '2025-01-07T16:45:00Z',
    created_by: { name: 'Legal Team', avatar: '' },
    progress: 20,
    sections_completed: 2,
    total_sections: 7,
    file_size: null,
    format: null,
    review_status: null,
    reviewer: null,
    review_comments: null
  },
  {
    id: 'report_4',
    name: 'Technology Scouting Report - AI Patents',
    type: 'technology_scouting',
    status: 'under_review',
    template_id: 'report_technology_scout',
    created_at: '2025-01-06T10:00:00Z',
    updated_at: '2025-01-08T14:30:00Z',
    created_by: { name: 'R&D Team', avatar: '' },
    progress: 100,
    sections_completed: 7,
    total_sections: 7,
    file_size: '1.8 MB',
    format: 'pdf',
    review_status: 'pending_approval',
    reviewer: { name: 'Michael Chen', role: 'Senior Manager' },
    review_comments: 'Awaiting final approval from management'
  },
  {
    id: 'report_5',
    name: 'Portfolio Analysis - Q1 2025',
    type: 'portfolio_analysis',
    status: 'under_review',
    template_id: 'report_portfolio',
    created_at: '2025-01-04T09:00:00Z',
    updated_at: '2025-01-08T10:15:00Z',
    created_by: { name: 'Analytics Team', avatar: '' },
    progress: 100,
    sections_completed: 7,
    total_sections: 7,
    file_size: '2.1 MB',
    format: 'pdf',
    review_status: 'changes_requested',
    reviewer: { name: 'Lisa Wong', role: 'VP Analytics' },
    review_comments: 'Please update the market analysis section with latest data'
  },
  {
    id: 'report_6',
    name: 'White Space Analysis - Quantum Computing',
    type: 'white_space_analysis',
    status: 'under_review',
    template_id: 'report_whitespace',
    created_at: '2025-01-03T11:00:00Z',
    updated_at: '2025-01-07T15:45:00Z',
    created_by: { name: 'Innovation Lab', avatar: '' },
    progress: 100,
    sections_completed: 7,
    total_sections: 7,
    file_size: '1.5 MB',
    format: 'pdf',
    review_status: 'approved',
    reviewer: { name: 'David Park', role: 'CTO' },
    review_comments: 'Approved - excellent analysis, ready for distribution'
  }
];

export function ProjectReportsTab({ projectId, project }: ProjectReportsTabProps) {
  const [activeSubTab, setActiveSubTab] = useState('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [reportName, setReportName] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [projectReports, setProjectReports] = useState(mockProjectReports);
  const [showReportEditor, setShowReportEditor] = useState(false);
  const [editingReportId, setEditingReportId] = useState<string | null>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewingReportId, setReviewingReportId] = useState<string | null>(null);

  // Use templates hook for report templates
  const {
    templates: reportTemplates,
    loading: templatesLoading,
    getPopularTemplates,
    incrementUsage
  } = useTemplates({ type: TemplateType.REPORT });

  // Filter reports
  const filteredReports = projectReports.filter(report => {
    const matchesSearch = report.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || report.status === filterStatus;
    const matchesType = filterType === 'all' || report.type === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  const activeReports = filteredReports.filter(r => r.status === 'in_progress');
  const completedReports = filteredReports.filter(r => r.status === 'completed');
  const draftReports = filteredReports.filter(r => r.status === 'draft');
  const underReviewReports = filteredReports.filter(r => r.status === 'under_review');

  // Get status badge
  const getStatusBadge = (status: string) => {
    const config = {
      completed: { variant: 'default' as const, icon: CheckCircle2, label: 'Completed' },
      in_progress: { variant: 'secondary' as const, icon: Clock, label: 'In Progress' },
      draft: { variant: 'outline' as const, icon: Edit, label: 'Draft' },
      under_review: { variant: 'secondary' as const, icon: Eye, label: 'Under Review' },
      scheduled: { variant: 'outline' as const, icon: Calendar, label: 'Scheduled' }
    };

    const { variant, icon: Icon, label } = config[status as keyof typeof config] || config.draft;

    return (
      <Badge variant={variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  // Get report type icon
  const getReportTypeIcon = (type: string) => {
    const icons: Record<string, any> = {
      landscape_analysis: Layout,
      competitive_intelligence: Target,
      freedom_to_operate: Shield,
      white_space_analysis: Lightbulb,
      technology_scouting: Search,
      portfolio_analysis: Brain,
      custom: FileText
    };
    return icons[type] || FileText;
  };

  // Handle create report
  const handleCreateReport = async () => {
    if (!selectedTemplate || !reportName) {
      toast.error('Please select a template and enter a report name');
      return;
    }

    // Create new report
    const newReport = {
      id: `report_${Date.now()}`,
      name: reportName,
      type: selectedTemplate.report_config.report_type,
      status: 'draft',
      template_id: selectedTemplate.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: { name: 'Current User', avatar: '' },
      progress: 0,
      sections_completed: 0,
      total_sections: selectedTemplate.report_config.sections.length,
      file_size: null as string | null,
      format: null as string | null,
      review_status: null as string | null,
      reviewer: null as { name: string; role: string } | null,
      review_comments: null as string | null,
    };

    setProjectReports(prev => [newReport, ...prev]);
    
    // Increment template usage
    await incrementUsage(selectedTemplate.id);

    // Reset and close dialog
    setShowCreateDialog(false);
    setReportName('');
    setReportDescription('');

    // Open report editor with the template
    setEditingReportId(newReport.id);
    setShowReportEditor(true);

    toast.success('Report created successfully');

    // Send notification for report creation
    await notificationService.createWorkflowNotification({
      eventType: 'report_submitted',
      reportId: newReport.id,
      reportName: newReport.name,
      userId: 'current_user',
      userName: 'Current User',
      userRole: 'Author',
      timestamp: new Date().toISOString()
    });
  };

  // Handle import template
  const handleImportTemplate = async (template: ReportTemplate) => {
    setSelectedTemplate(template);
    setReportName(`${template.name} - ${project?.name || 'Project'}`);
    setReportDescription(template.description);
    setShowImportDialog(false);
    setShowCreateDialog(true);
  };

  // Handle edit report
  const handleEditReport = (reportId: string) => {
    setEditingReportId(reportId);
    setShowReportEditor(true);
  };

  // Handle view report
  const handleViewReport = (reportId: string) => {
    setEditingReportId(reportId);
    setShowReportEditor(true);
  };

  // Handle review workflow
  const handleReviewReport = (reportId: string) => {
    setReviewingReportId(reportId);
    setShowReviewDialog(true);
  };

  // Handle workflow action
  const handleWorkflowAction = async (action: 'approve' | 'request_changes' | 'comment', data: any) => {
    try {
      // Update report status based on action
      setProjectReports(prev => prev.map(report => {
        if (report.id === data.reportId) {
          let newStatus = report.status;
          let newReviewStatus = report.review_status;
          
          if (action === 'approve') {
            newReviewStatus = 'approved';
          } else if (action === 'request_changes') {
            newReviewStatus = 'changes_requested';
          }
          
          return {
            ...report,
            review_status: newReviewStatus,
            updated_at: data.timestamp,
            review_comments: data.comment || report.review_comments
          };
        }
        return report;
      }));

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      throw error;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Project Reports</h3>
          <p className="text-sm text-muted-foreground">
            Create and manage analytical reports for this project
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Import Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Import Report Template</DialogTitle>
                <DialogDescription>
                  Choose a template from your organization's library
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 mt-4">
                {templatesLoading ? (
                  <div className="text-center py-8">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                    <p className="mt-2 text-muted-foreground">Loading templates...</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {(reportTemplates as ReportTemplate[]).map((template) => (
                      <Card 
                        key={template.id} 
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => handleImportTemplate(template)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg">
                                <template.icon className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <CardTitle className="text-base">{template.name}</CardTitle>
                                <CardDescription className="text-xs mt-1">
                                  {template.description}
                                </CardDescription>
                              </div>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {template.usage_count} uses
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{template.report_config?.sections?.length || 0} sections</span>
                            <span>{template.report_config?.estimated_time || 'N/A'}</span>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleImportTemplate(template);
                              }}
                            >
                              Use Template
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                New Report
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Report</DialogTitle>
                <DialogDescription>
                  {selectedTemplate 
                    ? `Using template: ${selectedTemplate.name}`
                    : 'Create a new analytical report for this project'
                  }
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="report-name">Report Name</Label>
                  <Input
                    id="report-name"
                    value={reportName}
                    onChange={(e) => setReportName(e.target.value)}
                    placeholder="Enter report name..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="report-description">Description</Label>
                  <Textarea
                    id="report-description"
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                    placeholder="Enter report description..."
                    rows={3}
                  />
                </div>

                {!selectedTemplate && (
                  <div className="space-y-2">
                    <Label>Select Template</Label>
                    <div className="grid gap-2 max-h-48 overflow-y-auto">
                      {(reportTemplates as ReportTemplate[]).slice(0, 3).map((template) => (
                        <Card 
                          key={template.id}
                          className={`cursor-pointer transition-all ${
                            selectedTemplate?.id === template.id 
                              ? 'ring-2 ring-blue-500' 
                              : 'hover:shadow-sm'
                          }`}
                          onClick={() => setSelectedTemplate(template)}
                        >
                          <CardHeader className="p-3">
                            <div className="flex items-center gap-2">
                              <template.icon className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">{template.name}</span>
                            </div>
                          </CardHeader>
                        </Card>
                      ))}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => setShowImportDialog(true)}
                    >
                      Browse More Templates
                    </Button>
                  </div>
                )}

                {selectedTemplate && (
                  <Card className="bg-muted/50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Template Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Sections:</span>
                        <span>{selectedTemplate.report_config.sections.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Estimated Time:</span>
                        <span>{selectedTemplate.report_config.estimated_time}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Output Formats:</span>
                        <span>{selectedTemplate.report_config.output_formats.join(', ')}</span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateReport}
                  disabled={!reportName || !selectedTemplate}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Create Report
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search reports..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="under_review">Under Review</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Report Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="landscape_analysis">Landscape Analysis</SelectItem>
            <SelectItem value="competitive_intelligence">Competitive Intelligence</SelectItem>
            <SelectItem value="freedom_to_operate">Freedom to Operate</SelectItem>
            <SelectItem value="white_space_analysis">White Space Analysis</SelectItem>
            <SelectItem value="technology_scouting">Technology Scouting</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reports Tabs */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">
            Active ({activeReports.length})
          </TabsTrigger>
          <TabsTrigger value="under_review">
            Under Review ({underReviewReports.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedReports.length})
          </TabsTrigger>
          <TabsTrigger value="drafts">
            Drafts ({draftReports.length})
          </TabsTrigger>
          <TabsTrigger value="all">
            All Reports ({filteredReports.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeReports.length > 0 ? (
            <div className="grid gap-4">
              {activeReports.map((report) => {
                const Icon = getReportTypeIcon(report.type);
                return (
                  <Card key={report.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg">
                            <Icon className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="space-y-1">
                            <CardTitle className="text-base">{report.name}</CardTitle>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>by {report.created_by.name}</span>
                              <span>•</span>
                              <span>Updated {new Date(report.updated_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(report.status)}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewReport(report.id)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Report
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditReport(report.id)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Report
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Download className="h-4 w-4 mr-2" />
                                Export
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Share className="h-4 w-4 mr-2" />
                                Share
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">
                            {report.sections_completed} of {report.total_sections} sections
                          </span>
                        </div>
                        <Progress value={report.progress} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Active Reports</h3>
                <p className="text-muted-foreground mb-4">
                  Create a new report to get started with your analysis
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Report
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="under_review" className="space-y-4">
          {underReviewReports.length > 0 ? (
            <div className="grid gap-4">
              {underReviewReports.map((report) => {
                const Icon = getReportTypeIcon(report.type);
                
                // Get review status color and icon
                const getReviewStatusBadge = (reviewStatus: string) => {
                  const config = {
                    pending_approval: { variant: 'secondary' as const, icon: Clock, label: 'Pending Approval', color: 'text-yellow-600' },
                    changes_requested: { variant: 'destructive' as const, icon: AlertCircle, label: 'Changes Requested', color: 'text-red-600' },
                    approved: { variant: 'default' as const, icon: CheckCircle2, label: 'Approved', color: 'text-green-600' }
                  };
                  
                  const { variant, icon: StatusIcon, label, color } = config[reviewStatus as keyof typeof config] || config.pending_approval;
                  
                  return (
                    <Badge variant={variant} className={`gap-1 ${color}`}>
                      <StatusIcon className="h-3 w-3" />
                      {label}
                    </Badge>
                  );
                };

                return (
                  <Card key={report.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-lg">
                            <Icon className="h-5 w-5 text-yellow-600" />
                          </div>
                          <div className="space-y-1 flex-1">
                            <CardTitle className="text-base">{report.name}</CardTitle>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>by {report.created_by.name}</span>
                              <span>•</span>
                              <span>Submitted {new Date(report.updated_at).toLocaleDateString()}</span>
                              <span>•</span>
                              <span>{report.file_size}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              {getStatusBadge(report.status)}
                              {report.review_status && getReviewStatusBadge(report.review_status)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleReviewReport(report.id)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Review
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" />
                                View Report
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleReviewReport(report.id)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Review & Request Changes
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleWorkflowAction('approve', { reportId: report.id, comment: 'Approved', timestamp: new Date().toISOString() })}>
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Quick Approve
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <Share className="h-4 w-4 mr-2" />
                                Share
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {/* Reviewer Information */}
                        {report.reviewer && (
                          <div className="bg-muted/50 p-3 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">Reviewer</span>
                              </div>
                              <span className="text-sm text-muted-foreground">{report.reviewer.role}</span>
                            </div>
                            <p className="text-sm font-medium">{report.reviewer.name}</p>
                            {report.review_comments && (
                              <div className="mt-2 pt-2 border-t border-border/50">
                                <p className="text-xs text-muted-foreground mb-1">Review Comments:</p>
                                <p className="text-sm">{report.review_comments}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Review Actions Bar */}
                        <div className="flex items-center justify-between pt-2 border-t border-border/50">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>In review since {new Date(report.updated_at).toLocaleDateString()}</span>
                          </div>
                          
                          {report.review_status === 'changes_requested' && (
                            <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                              <Edit className="h-3 w-3 mr-1" />
                              Address Changes
                            </Button>
                          )}
                          
                          {report.review_status === 'approved' && (
                            <Button size="sm" className="bg-green-600 hover:bg-green-700">
                              <Download className="h-3 w-3 mr-1" />
                              Publish
                            </Button>
                          )}
                          
                          {report.review_status === 'pending_approval' && (
                            <div className="flex items-center gap-1">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="text-red-600 border-red-200 hover:bg-red-50"
                                onClick={() => handleWorkflowAction('request_changes', { reportId: report.id, comment: 'Changes requested via quick action', timestamp: new Date().toISOString() })}
                              >
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Request Changes
                              </Button>
                              <Button 
                                size="sm" 
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleWorkflowAction('approve', { reportId: report.id, comment: 'Approved via quick action', timestamp: new Date().toISOString() })}
                              >
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Approve
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Reports Under Review</h3>
                <p className="text-muted-foreground">
                  Reports awaiting review will appear here
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedReports.length > 0 ? (
            <div className="grid gap-4">
              {completedReports.map((report) => {
                const Icon = getReportTypeIcon(report.type);
                return (
                  <Card key={report.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg">
                            <Icon className="h-5 w-5 text-green-600" />
                          </div>
                          <div className="space-y-1">
                            <CardTitle className="text-base">{report.name}</CardTitle>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>by {report.created_by.name}</span>
                              <span>•</span>
                              <span>Completed {new Date(report.updated_at).toLocaleDateString()}</span>
                              <span>•</span>
                              <span>{report.file_size}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(report.status)}
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <CheckCircle2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Completed Reports</h3>
                <p className="text-muted-foreground">
                  Completed reports will appear here
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="drafts" className="space-y-4">
          {draftReports.length > 0 ? (
            <div className="grid gap-4">
              {draftReports.map((report) => {
                const Icon = getReportTypeIcon(report.type);
                return (
                  <Card key={report.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-gradient-to-br from-gray-100 to-slate-100 rounded-lg">
                            <Icon className="h-5 w-5 text-gray-600" />
                          </div>
                          <div className="space-y-1">
                            <CardTitle className="text-base">{report.name}</CardTitle>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>by {report.created_by.name}</span>
                              <span>•</span>
                              <span>Last edited {new Date(report.updated_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(report.status)}
                          <Button variant="outline" size="sm" onClick={() => handleEditReport(report.id)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Continue Editing
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">
                            {report.sections_completed} of {report.total_sections} sections
                          </span>
                        </div>
                        <Progress value={report.progress} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <Edit className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Draft Reports</h3>
                <p className="text-muted-foreground">
                  Draft reports will appear here
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          {filteredReports.length > 0 ? (
            <div className="grid gap-4">
              {filteredReports.map((report) => {
                const Icon = getReportTypeIcon(report.type);
                return (
                  <Card key={report.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg">
                            <Icon className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="space-y-1">
                            <CardTitle className="text-base">{report.name}</CardTitle>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>by {report.created_by.name}</span>
                              <span>•</span>
                              <span>Updated {new Date(report.updated_at).toLocaleDateString()}</span>
                              {report.file_size && (
                                <>
                                  <span>•</span>
                                  <span>{report.file_size}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(report.status)}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewReport(report.id)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Report
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditReport(report.id)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Report
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Download className="h-4 w-4 mr-2" />
                                Export
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Share className="h-4 w-4 mr-2" />
                                Share
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardHeader>
                    {report.status !== 'completed' && (
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-medium">
                              {report.sections_completed} of {report.total_sections} sections
                            </span>
                          </div>
                          <Progress value={report.progress} className="h-2" />
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Reports Found</h3>
                <p className="text-muted-foreground mb-4">
                  No reports match your current filters
                </p>
                <Button variant="outline" onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('all');
                  setFilterType('all');
                }}>
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Report Editor Dialog */}
      <ReportEditor
        open={showReportEditor}
        onOpenChange={(open) => {
          setShowReportEditor(open);
          if (!open) {
            setEditingReportId(null);
            setSelectedTemplate(null);
          }
        }}
        reportId={editingReportId || undefined}
        template={selectedTemplate || undefined}
        initialData={editingReportId ? projectReports.find(r => r.id === editingReportId) : undefined}
      />

      {/* Review Workflow Dialog */}
      {reviewingReportId && (
        <ReviewWorkflowDialog
          open={showReviewDialog}
          onOpenChange={(open) => {
            setShowReviewDialog(open);
            if (!open) {
              setReviewingReportId(null);
            }
          }}
          reportId={reviewingReportId}
          reportName={projectReports.find(r => r.id === reviewingReportId)?.name || 'Report'}
          currentStatus={projectReports.find(r => r.id === reviewingReportId)?.review_status || 'pending_approval'}
          currentReviewer={projectReports.find(r => r.id === reviewingReportId)?.reviewer}
          onWorkflowAction={handleWorkflowAction}
        />
      )}
    </div>
  );
}