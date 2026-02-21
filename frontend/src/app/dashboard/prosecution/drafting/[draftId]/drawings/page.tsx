/**
 * Patent Drawing Management Interface
 * Professional drawing upload, annotation, and compliance checking
 */

'use client';

import { useState, useCallback, use } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft,
  Upload,
  Image,
  Plus,
  Trash2,
  Eye,
  Download,
  CheckCircle,
  AlertTriangle,
  Edit3,
  Move,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Grid,
  Ruler
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Mock drawing data
const mockDrawings = [
  {
    id: '1',
    figureNumber: 'FIG. 1',
    title: 'System Architecture Overview',
    description: 'Block diagram showing the overall system architecture with main components',
    filename: 'fig1_system_architecture.pdf',
    fileSize: '245KB',
    uploadDate: '2024-01-15',
    status: 'compliant',
    dimensions: '8.5" x 11"',
    resolution: '300 DPI',
    format: 'PDF',
    references: [
      { number: 100, label: 'Processing Unit' },
      { number: 200, label: 'Memory Module' },
      { number: 300, label: 'Network Interface' }
    ]
  },
  {
    id: '2',
    figureNumber: 'FIG. 2',
    title: 'Detailed Component View',
    description: 'Detailed view of the processing unit showing internal components',
    filename: 'fig2_component_detail.pdf',
    fileSize: '189KB',
    uploadDate: '2024-01-15',
    status: 'warning',
    dimensions: '8.5" x 11"',
    resolution: '300 DPI',
    format: 'PDF',
    warnings: ['Line thickness may be too thin for reproduction'],
    references: [
      { number: 110, label: 'CPU Core' },
      { number: 120, label: 'Cache Memory' },
      { number: 130, label: 'Bus Interface' }
    ]
  },
  {
    id: '3',
    figureNumber: 'FIG. 3',
    title: 'Process Flow Diagram',
    description: 'Flowchart showing the machine learning process steps',
    filename: 'fig3_process_flow.pdf',
    fileSize: '156KB',
    uploadDate: '2024-01-14',
    status: 'compliant',
    dimensions: '8.5" x 11"',
    resolution: '300 DPI',
    format: 'PDF',
    references: [
      { number: 400, label: 'Input Data' },
      { number: 500, label: 'ML Algorithm' },
      { number: 600, label: 'Output Results' }
    ]
  }
];

const drawingRequirements = {
  uspto: {
    maxDimensions: '8.5" × 11" or 21.0 cm × 29.7 cm',
    minMargins: 'Top: 2.5cm, Left/Right/Bottom: 2.0cm',
    lineThickness: 'Minimum 0.21mm (equivalent to 0.75 point)',
    resolution: 'Minimum 300 DPI for electronic submission',
    formats: ['PDF', 'TIFF', 'JPEG (for color drawings)']
  }
};

interface Props {
  params: Promise<{
    draftId: string;
  }>;
}

export default function DrawingManager({ params }: Props) {
  const resolvedParams = use(params);
  const [selectedDrawing, setSelectedDrawing] = useState<string | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    // Handle file drop logic here
  }, []);

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b bg-background/95 backdrop-blur px-4">
          <div className="flex items-center gap-4">
            <Link href={`/dashboard/prosecution/drafting/${resolvedParams.draftId}`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Draft
              </Button>
            </Link>
            
            <div className="text-sm font-medium">
              Drawing Management
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export All
            </Button>
            
            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Drawing
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Upload Patent Drawing</DialogTitle>
                  <DialogDescription>
                    Upload drawings that comply with USPTO requirements
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6">
                  {/* File Upload Area */}
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      isDragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <div className="text-lg font-medium mb-2">
                      Drop files here or click to browse
                    </div>
                    <div className="text-sm text-muted-foreground mb-4">
                      Supports PDF, TIFF, PNG, JPG (max 10MB)
                    </div>
                    <Button variant="outline">
                      Browse Files
                    </Button>
                  </div>

                  {/* Drawing Details Form */}
                  <div className="grid gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="figureNumber">Figure Number</Label>
                        <Input id="figureNumber" placeholder="FIG. 1" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input id="title" placeholder="System Overview" />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea 
                        id="description" 
                        placeholder="Brief description of what the figure shows..."
                        className="h-20"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button>
                      Upload Drawing
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="flex h-[calc(100vh-3.5rem)]">
          {/* Left Panel - Drawings List */}
          <div className="w-80 border-r bg-muted/30 overflow-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">Drawings ({mockDrawings.length})</h3>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <Grid className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-3">
                {mockDrawings.map((drawing) => (
                  <Card 
                    key={drawing.id} 
                    className={`cursor-pointer transition-all hover:shadow-sm ${
                      selectedDrawing === drawing.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedDrawing(drawing.id)}
                  >
                    <CardHeader className="p-3 pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">{drawing.figureNumber}</CardTitle>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(drawing.status)}
                          <Badge variant="outline" className={getStatusColor(drawing.status)}>
                            {drawing.status}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <div className="text-xs text-muted-foreground mb-2">
                        {drawing.title}
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{drawing.format}</span>
                        <span>{drawing.fileSize}</span>
                      </div>
                      {drawing.warnings && (
                        <div className="mt-2 text-xs text-yellow-600">
                          {drawing.warnings.length} warning(s)
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content - Drawing Viewer */}
          <div className="flex-1 flex flex-col">
            {selectedDrawing ? (
              <>
                {/* Drawing Toolbar */}
                <div className="flex items-center justify-between p-4 border-b">
                  <div className="flex items-center gap-4">
                    <h3 className="font-medium">
                      {mockDrawings.find(d => d.id === selectedDrawing)?.figureNumber}
                    </h3>
                    <Badge className={getStatusColor(mockDrawings.find(d => d.id === selectedDrawing)?.status || 'compliant')}>
                      {mockDrawings.find(d => d.id === selectedDrawing)?.status}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="icon">
                          <ZoomOut className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Zoom Out</TooltipContent>
                    </Tooltip>

                    <span className="text-sm px-2">100%</span>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="icon">
                          <ZoomIn className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Zoom In</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="icon">
                          <RotateCw className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Rotate</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="icon">
                          <Ruler className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Measure</TooltipContent>
                    </Tooltip>

                    <Button variant="outline" size="sm">
                      <Edit3 className="h-4 w-4 mr-2" />
                      Annotate
                    </Button>
                  </div>
                </div>

                {/* Drawing Viewer */}
                <div className="flex-1 bg-gray-100 flex items-center justify-center p-8">
                  <div className="bg-white shadow-lg border max-w-4xl max-h-full">
                    {/* Placeholder for actual drawing */}
                    <div className="w-96 h-[500px] flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <Image className="h-16 w-16 mx-auto mb-4" />
                        <div className="font-medium">Drawing Preview</div>
                        <div className="text-sm">{mockDrawings.find(d => d.id === selectedDrawing)?.filename}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <Image className="h-16 w-16 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Select a Drawing</h3>
                  <p className="text-sm">Choose a drawing from the list to view and edit</p>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Drawing Details & References */}
          {selectedDrawing && (
            <div className="w-80 border-l bg-muted/30 p-4 overflow-auto">
              <div className="space-y-6">
                {/* Drawing Info */}
                <div>
                  <h4 className="font-medium mb-3">Drawing Information</h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <Label className="text-xs text-muted-foreground">Title</Label>
                      <div>{mockDrawings.find(d => d.id === selectedDrawing)?.title}</div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Description</Label>
                      <div>{mockDrawings.find(d => d.id === selectedDrawing)?.description}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">Format</Label>
                        <div>{mockDrawings.find(d => d.id === selectedDrawing)?.format}</div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Size</Label>
                        <div>{mockDrawings.find(d => d.id === selectedDrawing)?.fileSize}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reference Numbers */}
                <div>
                  <h4 className="font-medium mb-3">Reference Numbers</h4>
                  <div className="space-y-2">
                    {mockDrawings.find(d => d.id === selectedDrawing)?.references.map((ref, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-background rounded border">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">{ref.number}</span>
                          <span className="text-sm">{ref.label}</span>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <Edit3 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Reference
                    </Button>
                  </div>
                </div>

                {/* Compliance Status */}
                <div>
                  <h4 className="font-medium mb-3">USPTO Compliance</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      Dimensions compliant
                    </div>
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      Resolution compliant
                    </div>
                    {mockDrawings.find(d => d.id === selectedDrawing)?.warnings?.map((warning, index) => (
                      <div key={index} className="flex items-start gap-2 text-yellow-600">
                        <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>{warning}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t">
                  <div className="space-y-2">
                    <Button variant="outline" size="sm" className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    <Button variant="outline" size="sm" className="w-full text-red-600 hover:text-red-600">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}