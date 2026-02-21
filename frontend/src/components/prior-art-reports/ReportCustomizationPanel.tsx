/**
 * Report Customization Panel Component
 * Provides comprehensive customization options for prior art reports
 */

'use client';

import { useState } from 'react';
import {
  Settings,
  FileText,
  Palette,
  Layout,
  Filter,
  Download,
  Eye,
  Save,
  RefreshCw,
  Plus,
  Minus,
  Move,
  Edit3,
  Image,
  AlignLeft,
  Type,
  Printer,
  Monitor,
  Smartphone
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface ReportSection {
  id: string;
  title: string;
  type: string;
  enabled: boolean;
  order: number;
  customizable: boolean;
  settings: {
    include_charts: boolean;
    include_tables: boolean;
    detail_level: 'summary' | 'detailed' | 'comprehensive';
    page_break_before: boolean;
    custom_title?: string;
  };
}

interface ReportStyle {
  template: 'professional' | 'academic' | 'executive' | 'technical';
  color_scheme: 'blue' | 'green' | 'gray' | 'purple' | 'custom';
  font_family: 'arial' | 'times' | 'calibri' | 'georgia';
  font_size: number;
  line_spacing: number;
  margin_size: 'narrow' | 'normal' | 'wide';
  header_footer: boolean;
  page_numbers: boolean;
  watermark: boolean;
  watermark_text?: string;
}

interface ExportSettings {
  format: 'pdf' | 'docx' | 'html' | 'xlsx';
  quality: 'draft' | 'standard' | 'high';
  include_metadata: boolean;
  password_protect: boolean;
  password?: string;
  compression: boolean;
  accessibility: boolean;
}

interface ReportMetadata {
  title: string;
  author: string;
  organization: string;
  confidentiality: 'public' | 'internal' | 'confidential' | 'attorney_client';
  version: string;
  date: string;
  custom_fields: Record<string, string>;
}

interface ReportCustomizationOptions {
  sections: ReportSection[];
  style: ReportStyle;
  export_settings: ExportSettings;
  metadata: ReportMetadata;
  preview_settings: {
    preview_mode: 'desktop' | 'tablet' | 'mobile' | 'print';
    show_page_breaks: boolean;
    show_margins: boolean;
    zoom_level: number;
  };
}

interface ReportCustomizationPanelProps {
  initialOptions?: Partial<ReportCustomizationOptions>;
  onOptionsChange?: (options: ReportCustomizationOptions) => void;
  onPreview?: () => void;
  onExport?: (format: string) => void;
}

export function ReportCustomizationPanel({
  initialOptions,
  onOptionsChange,
  onPreview,
  onExport
}: ReportCustomizationPanelProps) {
  const [options, setOptions] = useState<ReportCustomizationOptions>(() => ({
    sections: [
      {
        id: 'executive_summary',
        title: 'Executive Summary',
        type: 'executive_summary',
        enabled: true,
        order: 1,
        customizable: true,
        settings: {
          include_charts: true,
          include_tables: false,
          detail_level: 'summary',
          page_break_before: false,
          custom_title: undefined
        }
      },
      {
        id: 'technical_analysis',
        title: 'Technical Analysis',
        type: 'technical_analysis',
        enabled: true,
        order: 2,
        customizable: true,
        settings: {
          include_charts: true,
          include_tables: true,
          detail_level: 'detailed',
          page_break_before: true,
          custom_title: undefined
        }
      },
      {
        id: 'legal_analysis',
        title: 'Legal Analysis',
        type: 'legal_analysis',
        enabled: true,
        order: 3,
        customizable: true,
        settings: {
          include_charts: false,
          include_tables: true,
          detail_level: 'comprehensive',
          page_break_before: true,
          custom_title: undefined
        }
      },
      {
        id: 'evidence_analysis',
        title: 'Evidence Analysis',
        type: 'evidence_analysis',
        enabled: true,
        order: 4,
        customizable: true,
        settings: {
          include_charts: true,
          include_tables: true,
          detail_level: 'detailed',
          page_break_before: false,
          custom_title: undefined
        }
      },
      {
        id: 'conclusions',
        title: 'Conclusions & Recommendations',
        type: 'conclusions',
        enabled: true,
        order: 5,
        customizable: true,
        settings: {
          include_charts: false,
          include_tables: false,
          detail_level: 'summary',
          page_break_before: true,
          custom_title: undefined
        }
      },
      {
        id: 'appendix',
        title: 'Appendix',
        type: 'appendix',
        enabled: false,
        order: 6,
        customizable: false,
        settings: {
          include_charts: false,
          include_tables: true,
          detail_level: 'comprehensive',
          page_break_before: true,
          custom_title: undefined
        }
      }
    ],
    style: {
      template: 'professional',
      color_scheme: 'blue',
      font_family: 'calibri',
      font_size: 11,
      line_spacing: 1.15,
      margin_size: 'normal',
      header_footer: true,
      page_numbers: true,
      watermark: false,
      watermark_text: 'CONFIDENTIAL'
    },
    export_settings: {
      format: 'pdf',
      quality: 'standard',
      include_metadata: true,
      password_protect: false,
      password: undefined,
      compression: true,
      accessibility: false
    },
    metadata: {
      title: 'Prior Art Analysis Report',
      author: 'Patent Analytics Platform',
      organization: 'Patent Research Team',
      confidentiality: 'confidential',
      version: '1.0',
      date: new Date().toLocaleDateString(),
      custom_fields: {}
    },
    preview_settings: {
      preview_mode: 'desktop',
      show_page_breaks: true,
      show_margins: false,
      zoom_level: 100
    },
    ...initialOptions
  }));

  const updateOptions = (updates: Partial<ReportCustomizationOptions>) => {
    const newOptions = { ...options, ...updates };
    setOptions(newOptions);
    if (onOptionsChange) {
      onOptionsChange(newOptions);
    }
  };

  const updateSection = (sectionId: string, updates: Partial<ReportSection>) => {
    const newSections = options.sections.map(section =>
      section.id === sectionId ? { ...section, ...updates } : section
    );
    updateOptions({ sections: newSections });
  };

  const moveSectionUp = (sectionId: string) => {
    const sections = [...options.sections];
    const index = sections.findIndex(s => s.id === sectionId);
    if (index > 0) {
      [sections[index], sections[index - 1]] = [sections[index - 1], sections[index]];
      sections.forEach((section, idx) => section.order = idx + 1);
      updateOptions({ sections });
    }
  };

  const moveSectionDown = (sectionId: string) => {
    const sections = [...options.sections];
    const index = sections.findIndex(s => s.id === sectionId);
    if (index < sections.length - 1) {
      [sections[index], sections[index + 1]] = [sections[index + 1], sections[index]];
      sections.forEach((section, idx) => section.order = idx + 1);
      updateOptions({ sections });
    }
  };

  const getTemplateDescription = (template: string) => {
    switch (template) {
      case 'professional': return 'Clean, business-focused layout with charts and tables';
      case 'academic': return 'Detailed format suitable for research publications';
      case 'executive': return 'High-level overview optimized for decision makers';
      case 'technical': return 'Comprehensive technical details with extensive data';
      default: return '';
    }
  };

  const getPreviewIcon = (mode: string) => {
    switch (mode) {
      case 'desktop': return <Monitor className="h-4 w-4" />;
      case 'tablet': return <Smartphone className="h-4 w-4 rotate-90" />;
      case 'mobile': return <Smartphone className="h-4 w-4" />;
      case 'print': return <Printer className="h-4 w-4" />;
      default: return <Monitor className="h-4 w-4" />;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Settings className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold">Report Customization</h3>
            <p className="text-sm text-muted-foreground">Configure report layout, style, and export options</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onPreview}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button onClick={() => onExport?.(options.export_settings.format)}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="sections" className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-5 mx-4 mt-4">
            <TabsTrigger value="sections">Sections</TabsTrigger>
            <TabsTrigger value="style">Style</TabsTrigger>
            <TabsTrigger value="metadata">Metadata</TabsTrigger>
            <TabsTrigger value="export">Export</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-auto p-4">
            <TabsContent value="sections" className="space-y-4 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Report Sections</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {options.sections.map((section, index) => (
                      <div key={section.id} className={`p-4 border rounded-lg ${section.enabled ? 'border-blue-200 bg-blue-50' : 'border-gray-200'}`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Switch
                              checked={section.enabled}
                              onCheckedChange={(enabled) => updateSection(section.id, { enabled })}
                            />
                            <div>
                              <h4 className="font-medium">{section.title}</h4>
                              <p className="text-sm text-muted-foreground">Order: {section.order}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => moveSectionUp(section.id)}
                              disabled={index === 0}
                            >
                              <Move className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => moveSectionDown(section.id)}
                              disabled={index === options.sections.length - 1}
                            >
                              <Move className="h-4 w-4 rotate-180" />
                            </Button>
                          </div>
                        </div>

                        {section.enabled && section.customizable && (
                          <div className="space-y-3 pt-3 border-t">
                            <div className="grid gap-4 md:grid-cols-2">
                              <div>
                                <Label className="text-xs">Detail Level</Label>
                                <Select
                                  value={section.settings.detail_level}
                                  onValueChange={(detail_level: 'summary' | 'detailed' | 'comprehensive') =>
                                    updateSection(section.id, {
                                      settings: { ...section.settings, detail_level }
                                    })
                                  }
                                >
                                  <SelectTrigger className="h-8">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="summary">Summary</SelectItem>
                                    <SelectItem value="detailed">Detailed</SelectItem>
                                    <SelectItem value="comprehensive">Comprehensive</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label className="text-xs">Custom Title (Optional)</Label>
                                <Input
                                  className="h-8"
                                  placeholder={section.title}
                                  value={section.settings.custom_title || ''}
                                  onChange={(e) =>
                                    updateSection(section.id, {
                                      settings: { ...section.settings, custom_title: e.target.value || undefined }
                                    })
                                  }
                                />
                              </div>
                            </div>
                            
                            <div className="flex gap-4">
                              <div className="flex items-center space-x-2">
                                <Switch
                                  checked={section.settings.include_charts}
                                  onCheckedChange={(include_charts) =>
                                    updateSection(section.id, {
                                      settings: { ...section.settings, include_charts }
                                    })
                                  }
                                />
                                <Label className="text-xs">Include Charts</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Switch
                                  checked={section.settings.include_tables}
                                  onCheckedChange={(include_tables) =>
                                    updateSection(section.id, {
                                      settings: { ...section.settings, include_tables }
                                    })
                                  }
                                />
                                <Label className="text-xs">Include Tables</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Switch
                                  checked={section.settings.page_break_before}
                                  onCheckedChange={(page_break_before) =>
                                    updateSection(section.id, {
                                      settings: { ...section.settings, page_break_before }
                                    })
                                  }
                                />
                                <Label className="text-xs">Page Break Before</Label>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="style" className="space-y-4 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Report Style & Layout</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label className="text-sm font-medium mb-3 block">Report Template</Label>
                    <div className="grid gap-3 md:grid-cols-2">
                      {(['professional', 'academic', 'executive', 'technical'] as const).map((template) => (
                        <div
                          key={template}
                          className={`p-3 border rounded-lg cursor-pointer transition-all ${
                            options.style.template === template ? 'border-blue-500 bg-blue-50' : 'hover:border-gray-300'
                          }`}
                          onClick={() => updateOptions({ style: { ...options.style, template } })}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Layout className="h-4 w-4" />
                            <span className="font-medium capitalize">{template}</span>
                            {options.style.template === template && (
                              <Badge variant="default" className="text-xs">Selected</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{getTemplateDescription(template)}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <Label className="text-sm font-medium mb-3 block">Typography</Label>
                      <div className="space-y-3">
                        <div>
                          <Label className="text-xs">Font Family</Label>
                          <Select
                            value={options.style.font_family}
                            onValueChange={(font_family: 'arial' | 'times' | 'calibri' | 'georgia') =>
                              updateOptions({ style: { ...options.style, font_family } })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="arial">Arial</SelectItem>
                              <SelectItem value="calibri">Calibri</SelectItem>
                              <SelectItem value="times">Times New Roman</SelectItem>
                              <SelectItem value="georgia">Georgia</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label className="text-xs">Font Size: {options.style.font_size}pt</Label>
                          <Slider
                            value={[options.style.font_size]}
                            onValueChange={([font_size]) =>
                              updateOptions({ style: { ...options.style, font_size } })
                            }
                            min={8}
                            max={16}
                            step={1}
                            className="mt-2"
                          />
                        </div>
                        
                        <div>
                          <Label className="text-xs">Line Spacing: {options.style.line_spacing}</Label>
                          <Slider
                            value={[options.style.line_spacing]}
                            onValueChange={([line_spacing]) =>
                              updateOptions({ style: { ...options.style, line_spacing } })
                            }
                            min={1.0}
                            max={2.0}
                            step={0.05}
                            className="mt-2"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium mb-3 block">Layout Options</Label>
                      <div className="space-y-3">
                        <div>
                          <Label className="text-xs">Color Scheme</Label>
                          <Select
                            value={options.style.color_scheme}
                            onValueChange={(color_scheme: 'blue' | 'green' | 'gray' | 'purple' | 'custom') =>
                              updateOptions({ style: { ...options.style, color_scheme } })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="blue">Blue</SelectItem>
                              <SelectItem value="green">Green</SelectItem>
                              <SelectItem value="gray">Gray</SelectItem>
                              <SelectItem value="purple">Purple</SelectItem>
                              <SelectItem value="custom">Custom</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label className="text-xs">Margin Size</Label>
                          <Select
                            value={options.style.margin_size}
                            onValueChange={(margin_size: 'narrow' | 'normal' | 'wide') =>
                              updateOptions({ style: { ...options.style, margin_size } })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="narrow">Narrow</SelectItem>
                              <SelectItem value="normal">Normal</SelectItem>
                              <SelectItem value="wide">Wide</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs">Header & Footer</Label>
                            <Switch
                              checked={options.style.header_footer}
                              onCheckedChange={(header_footer) =>
                                updateOptions({ style: { ...options.style, header_footer } })
                              }
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label className="text-xs">Page Numbers</Label>
                            <Switch
                              checked={options.style.page_numbers}
                              onCheckedChange={(page_numbers) =>
                                updateOptions({ style: { ...options.style, page_numbers } })
                              }
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label className="text-xs">Watermark</Label>
                            <Switch
                              checked={options.style.watermark}
                              onCheckedChange={(watermark) =>
                                updateOptions({ style: { ...options.style, watermark } })
                              }
                            />
                          </div>
                          {options.style.watermark && (
                            <Input
                              placeholder="Watermark text"
                              value={options.style.watermark_text || ''}
                              onChange={(e) =>
                                updateOptions({
                                  style: { ...options.style, watermark_text: e.target.value }
                                })
                              }
                              className="text-xs"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="metadata" className="space-y-4 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Report Metadata</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label className="text-sm">Report Title</Label>
                      <Input
                        value={options.metadata.title}
                        onChange={(e) =>
                          updateOptions({
                            metadata: { ...options.metadata, title: e.target.value }
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Author</Label>
                      <Input
                        value={options.metadata.author}
                        onChange={(e) =>
                          updateOptions({
                            metadata: { ...options.metadata, author: e.target.value }
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Organization</Label>
                      <Input
                        value={options.metadata.organization}
                        onChange={(e) =>
                          updateOptions({
                            metadata: { ...options.metadata, organization: e.target.value }
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Version</Label>
                      <Input
                        value={options.metadata.version}
                        onChange={(e) =>
                          updateOptions({
                            metadata: { ...options.metadata, version: e.target.value }
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Confidentiality Level</Label>
                      <Select
                        value={options.metadata.confidentiality}
                        onValueChange={(confidentiality: 'public' | 'internal' | 'confidential' | 'attorney_client') =>
                          updateOptions({
                            metadata: { ...options.metadata, confidentiality }
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="public">Public</SelectItem>
                          <SelectItem value="internal">Internal Use</SelectItem>
                          <SelectItem value="confidential">Confidential</SelectItem>
                          <SelectItem value="attorney_client">Attorney-Client Privileged</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm">Date</Label>
                      <Input
                        value={options.metadata.date}
                        onChange={(e) =>
                          updateOptions({
                            metadata: { ...options.metadata, date: e.target.value }
                          })
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="export" className="space-y-4 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Export Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label className="text-sm">Export Format</Label>
                      <Select
                        value={options.export_settings.format}
                        onValueChange={(format: 'pdf' | 'docx' | 'html' | 'xlsx') =>
                          updateOptions({
                            export_settings: { ...options.export_settings, format }
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pdf">PDF Document</SelectItem>
                          <SelectItem value="docx">Word Document</SelectItem>
                          <SelectItem value="html">HTML Web Page</SelectItem>
                          <SelectItem value="xlsx">Excel Spreadsheet</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm">Quality</Label>
                      <Select
                        value={options.export_settings.quality}
                        onValueChange={(quality: 'draft' | 'standard' | 'high') =>
                          updateOptions({
                            export_settings: { ...options.export_settings, quality }
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft (Fast)</SelectItem>
                          <SelectItem value="standard">Standard</SelectItem>
                          <SelectItem value="high">High Quality</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Include Metadata</Label>
                      <Switch
                        checked={options.export_settings.include_metadata}
                        onCheckedChange={(include_metadata) =>
                          updateOptions({
                            export_settings: { ...options.export_settings, include_metadata }
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Password Protection</Label>
                      <Switch
                        checked={options.export_settings.password_protect}
                        onCheckedChange={(password_protect) =>
                          updateOptions({
                            export_settings: { ...options.export_settings, password_protect }
                          })
                        }
                      />
                    </div>
                    {options.export_settings.password_protect && (
                      <Input
                        type="password"
                        placeholder="Enter password"
                        value={options.export_settings.password || ''}
                        onChange={(e) =>
                          updateOptions({
                            export_settings: { ...options.export_settings, password: e.target.value }
                          })
                        }
                      />
                    )}
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Compression</Label>
                      <Switch
                        checked={options.export_settings.compression}
                        onCheckedChange={(compression) =>
                          updateOptions({
                            export_settings: { ...options.export_settings, compression }
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Accessibility Features</Label>
                      <Switch
                        checked={options.export_settings.accessibility}
                        onCheckedChange={(accessibility) =>
                          updateOptions({
                            export_settings: { ...options.export_settings, accessibility }
                          })
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preview" className="space-y-4 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Preview Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium mb-3 block">Preview Mode</Label>
                    <div className="grid gap-2 grid-cols-4">
                      {(['desktop', 'tablet', 'mobile', 'print'] as const).map((mode) => (
                        <Button
                          key={mode}
                          variant={options.preview_settings.preview_mode === mode ? 'default' : 'outline'}
                          className="flex items-center gap-2"
                          onClick={() =>
                            updateOptions({
                              preview_settings: { ...options.preview_settings, preview_mode: mode }
                            })
                          }
                        >
                          {getPreviewIcon(mode)}
                          <span className="capitalize">{mode}</span>
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm">Zoom Level: {options.preview_settings.zoom_level}%</Label>
                    <Slider
                      value={[options.preview_settings.zoom_level]}
                      onValueChange={([zoom_level]) =>
                        updateOptions({
                          preview_settings: { ...options.preview_settings, zoom_level }
                        })
                      }
                      min={25}
                      max={200}
                      step={25}
                      className="mt-2"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Show Page Breaks</Label>
                      <Switch
                        checked={options.preview_settings.show_page_breaks}
                        onCheckedChange={(show_page_breaks) =>
                          updateOptions({
                            preview_settings: { ...options.preview_settings, show_page_breaks }
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Show Margins</Label>
                      <Switch
                        checked={options.preview_settings.show_margins}
                        onCheckedChange={(show_margins) =>
                          updateOptions({
                            preview_settings: { ...options.preview_settings, show_margins }
                          })
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}