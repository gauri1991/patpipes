'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Dialog,
  DialogContent,
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
import {
  Play,
  Square,
  Circle,
  Diamond,
  ArrowRight,
  Plus,
  Trash2,
  Settings,
  Save,
  Download,
  Upload,
  Copy,
  Undo,
  Redo,
  Grid,
  ZoomIn,
  ZoomOut,
  Move,
  MousePointer,
  CheckSquare,
  FileText,
  Users,
  Clock,
  AlertTriangle,
  Shield,
  Workflow,
  GitBranch,
  Bell,
  Database,
  Link,
  Eye
} from 'lucide-react';

// Types for workflow designer
interface WorkflowNode {
  id: string;
  type: 'start' | 'step' | 'decision' | 'end' | 'parallel' | 'merge';
  label: string;
  description?: string;
  position: { x: number; y: number };
  data: {
    stepType?: 'manual' | 'automated' | 'approval' | 'document' | 'review' | 'quality_gate' | 'notification';
    assignedRole?: string;
    estimatedHours?: number;
    requiresApproval?: boolean;
    qualityCriteria?: string[];
    conditions?: string[];
    actions?: string[];
    parallelBranches?: number;
  };
  connections: string[]; // IDs of connected nodes
}

interface WorkflowConnection {
  id: string;
  source: string;
  target: string;
  label?: string;
  condition?: string;
}

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  version: string;
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  settings: {
    autoAssign: boolean;
    requireSequential: boolean;
    allowParallel: boolean;
    qualityThreshold: number;
    requireApproval: boolean;
  };
}

export default function WorkflowDesigner() {
  const [template, setTemplate] = useState<WorkflowTemplate | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<'select' | 'move' | 'connect'>('select');
  const [zoom, setZoom] = useState(100);
  const [showGrid, setShowGrid] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [connectionStart, setConnectionStart] = useState<string | null>(null);
  const [showNodeDialog, setShowNodeDialog] = useState(false);
  const [editingNode, setEditingNode] = useState<WorkflowNode | null>(null);
  const [history, setHistory] = useState<WorkflowTemplate[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const canvasRef = useRef<HTMLDivElement>(null);

  // Initialize with a default template
  useEffect(() => {
    const defaultTemplate: WorkflowTemplate = {
      id: 'new-template',
      name: 'New Workflow Template',
      description: 'Drag and drop to build your workflow',
      category: 'Custom',
      version: '1.0',
      nodes: [
        {
          id: 'start-1',
          type: 'start',
          label: 'Start',
          position: { x: 100, y: 200 },
          data: {},
          connections: []
        },
        {
          id: 'end-1',
          type: 'end',
          label: 'End',
          position: { x: 700, y: 200 },
          data: {},
          connections: []
        }
      ],
      connections: [],
      settings: {
        autoAssign: false,
        requireSequential: true,
        allowParallel: false,
        qualityThreshold: 80,
        requireApproval: false
      }
    };
    
    setTemplate(defaultTemplate);
    setHistory([defaultTemplate]);
    setHistoryIndex(0);
  }, []);

  // Node type configurations
  const nodeTypes = {
    start: { icon: Play, color: 'bg-green-500', shape: 'circle' },
    step: { icon: Square, color: 'bg-blue-500', shape: 'rectangle' },
    decision: { icon: Diamond, color: 'bg-yellow-500', shape: 'diamond' },
    end: { icon: Square, color: 'bg-red-500', shape: 'circle' },
    parallel: { icon: GitBranch, color: 'bg-purple-500', shape: 'rectangle' },
    merge: { icon: GitBranch, color: 'bg-indigo-500', shape: 'rectangle' }
  };

  const stepTypes = [
    { value: 'manual', label: 'Manual Task', icon: Users, description: 'Human-performed task' },
    { value: 'automated', label: 'Automated Check', icon: Settings, description: 'System-automated step' },
    { value: 'approval', label: 'Approval Required', icon: CheckSquare, description: 'Requires approval' },
    { value: 'document', label: 'Document Upload', icon: FileText, description: 'Document handling' },
    { value: 'review', label: 'Review & Feedback', icon: Eye, description: 'Review process' },
    { value: 'quality_gate', label: 'Quality Control', icon: Shield, description: 'Quality checkpoint' },
    { value: 'notification', label: 'Notification', icon: Bell, description: 'Send notification' }
  ];

  // Handle node dragging
  const handleMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    if (selectedTool === 'move' || selectedTool === 'select') {
      setIsDragging(true);
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect && template) {
        const node = template.nodes.find(n => n.id === nodeId);
        if (node) {
          setDragOffset({
            x: e.clientX - rect.left - node.position.x,
            y: e.clientY - rect.top - node.position.y
          });
        }
      }
    }
    setSelectedNode(nodeId);
  }, [selectedTool, template]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging && selectedNode && template) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const newTemplate = { ...template };
        const nodeIndex = newTemplate.nodes.findIndex(n => n.id === selectedNode);
        if (nodeIndex >= 0) {
          newTemplate.nodes[nodeIndex].position = {
            x: e.clientX - rect.left - dragOffset.x,
            y: e.clientY - rect.top - dragOffset.y
          };
          setTemplate(newTemplate);
        }
      }
    }
  }, [isDragging, selectedNode, template, dragOffset]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setConnectionStart(null);
  }, []);

  // Add new node
  const addNode = (type: WorkflowNode['type']) => {
    if (!template) return;

    const newNode: WorkflowNode = {
      id: `${type}-${Date.now()}`,
      type,
      label: type === 'step' ? 'New Step' : type.charAt(0).toUpperCase() + type.slice(1),
      position: { x: 300, y: 200 },
      data: type === 'step' ? { stepType: 'manual' } : {},
      connections: []
    };

    const newTemplate = {
      ...template,
      nodes: [...template.nodes, newNode]
    };
    
    setTemplate(newTemplate);
    saveToHistory(newTemplate);
  };

  // Delete node
  const deleteNode = (nodeId: string) => {
    if (!template) return;

    const newTemplate = {
      ...template,
      nodes: template.nodes.filter(n => n.id !== nodeId),
      connections: template.connections.filter(c => c.source !== nodeId && c.target !== nodeId)
    };
    
    setTemplate(newTemplate);
    saveToHistory(newTemplate);
    setSelectedNode(null);
  };

  // Connect nodes
  const connectNodes = (sourceId: string, targetId: string) => {
    if (!template || sourceId === targetId) return;

    const connectionExists = template.connections.find(
      c => c.source === sourceId && c.target === targetId
    );
    
    if (connectionExists) return;

    const newConnection: WorkflowConnection = {
      id: `${sourceId}-${targetId}`,
      source: sourceId,
      target: targetId
    };

    const newTemplate = {
      ...template,
      connections: [...template.connections, newConnection]
    };
    
    setTemplate(newTemplate);
    saveToHistory(newTemplate);
  };

  // Save to history for undo/redo
  const saveToHistory = (newTemplate: WorkflowTemplate) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newTemplate);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // Undo/Redo
  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setTemplate(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setTemplate(history[historyIndex + 1]);
    }
  };

  // Update node properties
  const updateNode = (nodeId: string, updates: Partial<WorkflowNode>) => {
    if (!template) return;

    const newTemplate = { ...template };
    const nodeIndex = newTemplate.nodes.findIndex(n => n.id === nodeId);
    if (nodeIndex >= 0) {
      newTemplate.nodes[nodeIndex] = { ...newTemplate.nodes[nodeIndex], ...updates };
      setTemplate(newTemplate);
      saveToHistory(newTemplate);
    }
  };

  // Node component
  const NodeComponent = ({ node }: { node: WorkflowNode }) => {
    const nodeType = nodeTypes[node.type];
    const Icon = nodeType.icon;
    
    return (
      <div
        className={`absolute cursor-pointer border-2 ${
          selectedNode === node.id ? 'border-blue-500' : 'border-gray-300'
        } rounded-lg bg-white shadow-md hover:shadow-lg transition-all`}
        style={{ 
          left: node.position.x, 
          top: node.position.y,
          transform: `scale(${zoom / 100})`
        }}
        onMouseDown={(e) => handleMouseDown(e, node.id)}
        onDoubleClick={() => {
          setEditingNode(node);
          setShowNodeDialog(true);
        }}
      >
        <div className="p-3">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 ${nodeType.color} rounded-full flex items-center justify-center text-white`}>
              <Icon size={16} />
            </div>
            <div>
              <div className="font-medium text-sm">{node.label}</div>
              {node.data.stepType && (
                <div className="text-xs text-gray-500">
                  {stepTypes.find(t => t.value === node.data.stepType)?.label}
                </div>
              )}
            </div>
          </div>
          {node.description && (
            <div className="text-xs text-gray-600 mt-1 max-w-32 truncate">
              {node.description}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!template) {
    return <div className="flex items-center justify-center h-96">Loading designer...</div>;
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b p-4 bg-white">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Workflow Designer</h1>
            <p className="text-gray-600">{template.name}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={undo} disabled={historyIndex <= 0}>
              <Undo className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={redo} disabled={historyIndex >= history.length - 1}>
              <Redo className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm">
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button size="sm">
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Left Sidebar - Toolbox */}
        <div className="w-64 border-r bg-gray-50 p-4 space-y-4">
          {/* Tools */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Tools</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={selectedTool === 'select' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedTool('select')}
                      >
                        <MousePointer className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Select</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={selectedTool === 'move' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedTool('move')}
                      >
                        <Move className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Move</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={selectedTool === 'connect' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedTool('connect')}
                      >
                        <Link className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Connect</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </CardContent>
          </Card>

          {/* Node Types */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Add Nodes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => addNode('step')}
              >
                <Square className="w-4 h-4 mr-2" />
                Add Step
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => addNode('decision')}
              >
                <Diamond className="w-4 h-4 mr-2" />
                Add Decision
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => addNode('parallel')}
              >
                <GitBranch className="w-4 h-4 mr-2" />
                Parallel Split
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => addNode('merge')}
              >
                <GitBranch className="w-4 h-4 mr-2" />
                Parallel Merge
              </Button>
            </CardContent>
          </Card>

          {/* View Controls */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">View</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Zoom</Label>
                <span className="text-sm">{zoom}%</span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setZoom(Math.max(25, zoom - 25))}
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setZoom(Math.min(200, zoom + 25))}
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={showGrid}
                  onCheckedChange={setShowGrid}
                />
                <Label className="text-sm">Show Grid</Label>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 relative overflow-hidden">
          <div
            ref={canvasRef}
            className={`w-full h-full relative ${showGrid ? 'bg-grid-pattern' : 'bg-gray-50'}`}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            style={{
              backgroundSize: showGrid ? '20px 20px' : 'none',
              backgroundImage: showGrid ? 
                'linear-gradient(to right, #e5e7eb 1px, transparent 1px), linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)' : 
                'none'
            }}
          >
            {/* Render connections */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {template.connections.map((connection) => {
                const sourceNode = template.nodes.find(n => n.id === connection.source);
                const targetNode = template.nodes.find(n => n.id === connection.target);
                if (!sourceNode || !targetNode) return null;

                const startX = sourceNode.position.x + 50;
                const startY = sourceNode.position.y + 25;
                const endX = targetNode.position.x + 50;
                const endY = targetNode.position.y + 25;

                return (
                  <g key={connection.id}>
                    <line
                      x1={startX}
                      y1={startY}
                      x2={endX}
                      y2={endY}
                      stroke="#6B7280"
                      strokeWidth="2"
                      markerEnd="url(#arrowhead)"
                    />
                    {connection.label && (
                      <text
                        x={(startX + endX) / 2}
                        y={(startY + endY) / 2}
                        textAnchor="middle"
                        className="text-xs fill-gray-600"
                      >
                        {connection.label}
                      </text>
                    )}
                  </g>
                );
              })}
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="7"
                  refX="9"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3.5, 0 7" fill="#6B7280" />
                </marker>
              </defs>
            </svg>

            {/* Render nodes */}
            {template.nodes.map((node) => (
              <NodeComponent key={node.id} node={node} />
            ))}
          </div>
        </div>

        {/* Right Sidebar - Properties */}
        {selectedNode && (
          <div className="w-80 border-l bg-white p-4 space-y-4">
            <div>
              <h3 className="font-semibold mb-4">Node Properties</h3>
              {(() => {
                const node = template.nodes.find(n => n.id === selectedNode);
                if (!node) return null;

                return (
                  <div className="space-y-4">
                    <div>
                      <Label>Label</Label>
                      <Input
                        value={node.label}
                        onChange={(e) => updateNode(selectedNode, { label: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={node.description || ''}
                        onChange={(e) => updateNode(selectedNode, { description: e.target.value })}
                        rows={2}
                      />
                    </div>
                    
                    {node.type === 'step' && (
                      <>
                        <div>
                          <Label>Step Type</Label>
                          <Select
                            value={node.data.stepType || 'manual'}
                            onValueChange={(value) => updateNode(selectedNode, {
                              data: { ...node.data, stepType: value as any }
                            })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {stepTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Assigned Role</Label>
                          <Select
                            value={node.data.assignedRole || ''}
                            onValueChange={(value) => updateNode(selectedNode, {
                              data: { ...node.data, assignedRole: value }
                            })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="attorney">Attorney</SelectItem>
                              <SelectItem value="paralegal">Paralegal</SelectItem>
                              <SelectItem value="analyst">Analyst</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Estimated Hours</Label>
                          <Input
                            type="number"
                            value={node.data.estimatedHours || 0}
                            onChange={(e) => updateNode(selectedNode, {
                              data: { ...node.data, estimatedHours: parseFloat(e.target.value) }
                            })}
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={node.data.requiresApproval || false}
                            onCheckedChange={(checked) => updateNode(selectedNode, {
                              data: { ...node.data, requiresApproval: checked }
                            })}
                          />
                          <Label>Requires Approval</Label>
                        </div>
                      </>
                    )}
                    
                    <div className="pt-2 border-t">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteNode(selectedNode)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Node
                      </Button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>

      {/* Node Edit Dialog */}
      <Dialog open={showNodeDialog} onOpenChange={setShowNodeDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Node: {editingNode?.label}</DialogTitle>
          </DialogHeader>
          {editingNode && (
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
                <TabsTrigger value="quality">Quality</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4">
                <div>
                  <Label>Node Label</Label>
                  <Input
                    value={editingNode.label}
                    onChange={(e) => setEditingNode({
                      ...editingNode,
                      label: e.target.value
                    })}
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={editingNode.description || ''}
                    onChange={(e) => setEditingNode({
                      ...editingNode,
                      description: e.target.value
                    })}
                  />
                </div>
                {editingNode.type === 'step' && (
                  <div>
                    <Label>Step Type</Label>
                    <Select
                      value={editingNode.data.stepType || 'manual'}
                      onValueChange={(value) => setEditingNode({
                        ...editingNode,
                        data: { ...editingNode.data, stepType: value as any }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {stepTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <type.icon className="w-4 h-4" />
                              <div>
                                <div>{type.label}</div>
                                <div className="text-xs text-gray-500">{type.description}</div>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="advanced" className="space-y-4">
                <div>
                  <Label>Assigned Role</Label>
                  <Select
                    value={editingNode.data.assignedRole || ''}
                    onValueChange={(value) => setEditingNode({
                      ...editingNode,
                      data: { ...editingNode.data, assignedRole: value }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="attorney">Attorney</SelectItem>
                      <SelectItem value="paralegal">Paralegal</SelectItem>
                      <SelectItem value="analyst">Analyst</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Estimated Hours</Label>
                  <Input
                    type="number"
                    value={editingNode.data.estimatedHours || 0}
                    onChange={(e) => setEditingNode({
                      ...editingNode,
                      data: { ...editingNode.data, estimatedHours: parseFloat(e.target.value) }
                    })}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={editingNode.data.requiresApproval || false}
                    onCheckedChange={(checked) => setEditingNode({
                      ...editingNode,
                      data: { ...editingNode.data, requiresApproval: checked }
                    })}
                  />
                  <Label>Requires Approval</Label>
                </div>
              </TabsContent>
              
              <TabsContent value="quality" className="space-y-4">
                <div>
                  <Label>Quality Criteria</Label>
                  <Textarea
                    placeholder="Enter quality criteria (one per line)"
                    value={editingNode.data.qualityCriteria?.join('\n') || ''}
                    onChange={(e) => setEditingNode({
                      ...editingNode,
                      data: {
                        ...editingNode.data,
                        qualityCriteria: e.target.value.split('\n').filter(line => line.trim())
                      }
                    })}
                  />
                </div>
              </TabsContent>
            </Tabs>
          )}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowNodeDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              if (editingNode) {
                updateNode(editingNode.id, editingNode);
              }
              setShowNodeDialog(false);
              setEditingNode(null);
            }}>
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}