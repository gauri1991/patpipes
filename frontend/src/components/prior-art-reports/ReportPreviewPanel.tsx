/**
 * Report Preview Panel Component
 * Real-time preview of report with customization options
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Eye,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  Share2,
  Printer,
  Monitor,
  Smartphone,
  Maximize2,
  Minimize2,
  FileText,
  Settings,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';

// Import report templates
import { ExecutiveSummaryTemplate } from './ExecutiveSummaryTemplate';
import { TechnicalAnalysisTemplate } from './TechnicalAnalysisTemplate';
import { LegalAnalysisTemplate } from './LegalAnalysisTemplate';

interface ReportSection {
  id: string;
  title: string;
  type: string;
  enabled: boolean;
  order: number;
  component: React.ComponentType<any>;
}

interface PreviewSettings {
  zoom: number;
  mode: 'desktop' | 'tablet' | 'mobile' | 'print';
  showPageBreaks: boolean;
  showMargins: boolean;
  fullscreen: boolean;
}

interface ReportPreviewPanelProps {
  projectType: 'FTO' | 'NOVELTY' | 'INVALIDITY';
  reportData?: any;
  customizationOptions?: any;
  onExport?: (format: string) => void;
  onShare?: () => void;
  onEdit?: () => void;
}

export function ReportPreviewPanel({
  projectType,
  reportData,
  customizationOptions,
  onExport,
  onShare,
  onEdit
}: ReportPreviewPanelProps) {
  const [settings, setSettings] = useState<PreviewSettings>({
    zoom: 100,
    mode: 'desktop',
    showPageBreaks: true,
    showMargins: false,
    fullscreen: false
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(8);
  const [isLoading, setIsLoading] = useState(false);

  const previewRef = useRef<HTMLDivElement>(null);

  // Available report sections
  const reportSections: ReportSection[] = [
    {
      id: 'executive_summary',
      title: 'Executive Summary',
      type: 'executive_summary',
      enabled: true,
      order: 1,
      component: ExecutiveSummaryTemplate
    },
    {
      id: 'technical_analysis',
      title: 'Technical Analysis',
      type: 'technical_analysis',
      enabled: true,
      order: 2,
      component: TechnicalAnalysisTemplate
    },
    {
      id: 'legal_analysis',
      title: 'Legal Analysis',
      type: 'legal_analysis',
      enabled: true,
      order: 3,
      component: LegalAnalysisTemplate
    }
  ];

  const updateSettings = (newSettings: Partial<PreviewSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const handleZoomIn = () => {
    updateSettings({ zoom: Math.min(settings.zoom + 25, 200) });
  };

  const handleZoomOut = () => {
    updateSettings({ zoom: Math.max(settings.zoom - 25, 25) });
  };

  const handleZoomReset = () => {
    updateSettings({ zoom: 100 });
  };

  const toggleFullscreen = () => {
    updateSettings({ fullscreen: !settings.fullscreen });
  };

  const getPreviewWidth = () => {
    switch (settings.mode) {
      case 'mobile': return '320px';
      case 'tablet': return '768px';
      case 'desktop': return '1024px';
      case 'print': return '8.5in';
      default: return '100%';
    }
  };

  const getPreviewScale = () => {
    return settings.zoom / 100;
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'desktop': return <Monitor className="h-4 w-4" />;
      case 'tablet': return <Smartphone className="h-4 w-4 rotate-90" />;
      case 'mobile': return <Smartphone className="h-4 w-4" />;
      case 'print': return <Printer className="h-4 w-4" />;
      default: return <Monitor className="h-4 w-4" />;
    }
  };

  const refreshPreview = () => {
    setIsLoading(true);
    // Simulate refresh delay
    setTimeout(() => setIsLoading(false), 1000);
  };

  return (
    <div className={`h-full flex flex-col ${settings.fullscreen ? 'fixed inset-0 z-50 bg-white' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-50 rounded-lg">
            <Eye className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold">Report Preview</h3>
            <p className="text-sm text-muted-foreground">
              {projectType} Analysis Report • Page {currentPage} of {totalPages}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Preview Mode Selector */}
          <div className="flex border rounded-lg">
            {(['desktop', 'tablet', 'mobile', 'print'] as const).map((mode) => (
              <Button
                key={mode}
                variant={settings.mode === mode ? 'default' : 'ghost'}
                size="sm"
                onClick={() => updateSettings({ mode })}
                className="rounded-none first:rounded-l-lg last:rounded-r-lg"
              >
                {getModeIcon(mode)}
              </Button>
            ))}
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Zoom Controls */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleZoomOut} disabled={settings.zoom <= 25}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[60px] text-center">{settings.zoom}%</span>
            <Button variant="outline" size="sm" onClick={handleZoomIn} disabled={settings.zoom >= 200}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleZoomReset}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Actions */}
          <Button variant="outline" size="sm" onClick={refreshPreview} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Settings className="h-4 w-4 mr-2" />
            Edit
          </Button>
          
          <Button variant="outline" size="sm" onClick={toggleFullscreen}>
            {settings.fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>

          <Button onClick={() => onExport?.('pdf')}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Zoom Slider (when not in fullscreen) */}
      {!settings.fullscreen && (
        <div className="px-4 py-2 border-b bg-gray-50">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium min-w-[60px]">Zoom:</span>
            <Slider
              value={[settings.zoom]}
              onValueChange={([zoom]) => updateSettings({ zoom })}
              min={25}
              max={200}
              step={25}
              className="flex-1 max-w-xs"
            />
            <div className="flex items-center gap-2">
              <Button
                variant={settings.showPageBreaks ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateSettings({ showPageBreaks: !settings.showPageBreaks })}
              >
                Page Breaks
              </Button>
              <Button
                variant={settings.showMargins ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateSettings({ showMargins: !settings.showMargins })}
              >
                Margins
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Content */}
      <div className="flex-1 overflow-hidden bg-gray-100">
        <ScrollArea className="h-full">
          <div className="p-8 flex justify-center">
            <div
              ref={previewRef}
              className="bg-white shadow-lg transition-all duration-200"
              style={{
                width: getPreviewWidth(),
                transform: `scale(${getPreviewScale()})`,
                transformOrigin: 'top center',
                minHeight: '297mm', // A4 height
                marginBottom: `${(getPreviewScale() - 1) * 100}%`
              }}
            >
              {/* Report Content */}
              <div className={`${settings.showMargins ? 'border-2 border-dashed border-blue-300' : ''}`}>
                {/* Report Header */}
                <div className="p-8 border-b">
                  <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold mb-2">
                      {projectType} Analysis Report
                    </h1>
                    <p className="text-lg text-muted-foreground">
                      Patent Analytics Platform
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Generated on {new Date().toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-2 text-sm">
                    <div>
                      <p><strong>Project Type:</strong> {projectType}</p>
                      <p><strong>Analysis Date:</strong> {new Date().toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p><strong>Analyst:</strong> Patent Analytics Platform</p>
                      <p><strong>Confidentiality:</strong> Confidential</p>
                    </div>
                  </div>
                </div>

                {/* Page Break Indicator */}
                {settings.showPageBreaks && (
                  <div className="border-t-2 border-dashed border-red-300 my-4">
                    <div className="text-center py-2">
                      <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs">
                        Page Break
                      </span>
                    </div>
                  </div>
                )}

                {/* Report Sections */}
                <div className="p-8 space-y-8">
                  {reportSections
                    .filter(section => section.enabled)
                    .sort((a, b) => a.order - b.order)
                    .map((section, index) => {
                      const Component = section.component;
                      return (
                        <div key={section.id}>
                          {index > 0 && settings.showPageBreaks && (
                            <div className="border-t-2 border-dashed border-red-300 my-8">
                              <div className="text-center py-2">
                                <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs">
                                  Page Break
                                </span>
                              </div>
                            </div>
                          )}
                          
                          <div className="mb-8">
                            <Component
                              projectType={projectType}
                              analysisData={reportData}
                              searchData={reportData}
                              patentData={reportData}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>

                {/* Report Footer */}
                <div className="border-t p-8 mt-8">
                  <div className="text-center text-sm text-muted-foreground">
                    <p>Generated by Patent Analytics Platform</p>
                    <p>© 2024 Patent Analytics Platform. All rights reserved.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Footer Navigation */}
      <div className="flex items-center justify-between p-4 border-t bg-white">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            <FileText className="h-3 w-3 mr-1" />
            {reportSections.filter(s => s.enabled).length} sections
          </Badge>
          <Badge variant="secondary">
            ~{totalPages} pages
          </Badge>
          <Badge variant="secondary">
            ~{(totalPages * 500).toLocaleString()} words
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          
          <span className="text-sm font-medium px-4">
            Page {currentPage} of {totalPages}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
      </div>
    </div>
  );
}