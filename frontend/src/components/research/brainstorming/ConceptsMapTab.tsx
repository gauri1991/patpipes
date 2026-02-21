'use client';

import { useState, useEffect } from 'react';
import { useBrainstorming } from '@/hooks/useBrainstorming';
import {
  Network,
  Plus,
  Move,
  Trash2,
  Edit2,
  ZoomIn,
  ZoomOut,
  Download,
  Upload,
  Save,
  RotateCcw,
  Circle,
  Square,
  Triangle,
  ArrowRight,
  Link
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ConceptNode {
  id: string;
  label: string;
  type: 'problem' | 'solution' | 'feature' | 'technology' | 'advantage' | 'constraint';
  x: number;
  y: number;
  color: string;
  description?: string;
}

interface ConceptRelation {
  id: string;
  from: string;
  to: string;
  type: 'causes' | 'solves' | 'enables' | 'requires' | 'improves' | 'implements';
  label: string;
  strength: number;
}

interface ConceptsMapTabProps {
  projectId: string;
  sessionId: string | null;
}

export function ConceptsMapTab({ projectId, sessionId }: ConceptsMapTabProps) {
  const {
    concepts,
    createConcept,
    loading,
    error
  } = useBrainstorming(projectId);
  const [nodes, setNodes] = useState<ConceptNode[]>([]);

  const [relations, setRelations] = useState<ConceptRelation[]>([
    {
      id: '1',
      from: '1',
      to: '2',
      type: 'solves',
      label: 'addressed by',
      strength: 0.9
    },
    {
      id: '2',
      from: '2',
      to: '3',
      type: 'enables',
      label: 'results in',
      strength: 0.8
    },
    {
      id: '3',
      from: '4',
      to: '1',
      type: 'causes',
      label: 'suffers from',
      strength: 0.7
    }
  ]);

  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [isAddingNode, setIsAddingNode] = useState(false);
  const [isAddingRelation, setIsAddingRelation] = useState(false);
  const [newNode, setNewNode] = useState({
    label: '',
    type: 'technology' as ConceptNode['type'],
    description: ''
  });
  const [zoom, setZoom] = useState(1);
  const [viewMode, setViewMode] = useState<'canvas' | 'list' | 'matrix'>('canvas');

  const nodeTypes = [
    { value: 'problem', label: 'Problem', color: '#ef4444', icon: Circle },
    { value: 'solution', label: 'Solution', color: '#10b981', icon: Square },
    { value: 'feature', label: 'Feature', color: '#f59e0b', icon: Triangle },
    { value: 'technology', label: 'Technology', color: '#3b82f6', icon: Circle },
    { value: 'advantage', label: 'Advantage', color: '#8b5cf6', icon: Square },
    { value: 'constraint', label: 'Constraint', color: '#6b7280', icon: Triangle }
  ];

  const relationTypes = [
    { value: 'causes', label: 'Causes' },
    { value: 'solves', label: 'Solves' },
    { value: 'enables', label: 'Enables' },
    { value: 'requires', label: 'Requires' },
    { value: 'improves', label: 'Improves' },
    { value: 'implements', label: 'Implements' }
  ];

  const handleAddNode = async () => {
    if (!newNode.label.trim() || !sessionId) return;

    const conceptData = {
      concept_name: newNode.label,
      concept_description: newNode.description,
      position_x: 200 + Math.random() * 300,
      position_y: 100 + Math.random() * 200,
      importance_score: 0.5,
      complexity_level: 1
    };

    const result = await createConcept(conceptData);
    if (result) {
      const node: ConceptNode = {
        id: result.id,
        label: newNode.label,
        type: newNode.type,
        x: result.position_x,
        y: result.position_y,
        color: nodeTypes.find(t => t.value === newNode.type)?.color || '#3b82f6',
        description: newNode.description
      };

      setNodes([...nodes, node]);
      setNewNode({ label: '', type: 'technology', description: '' });
      setIsAddingNode(false);
    }
  };

  const handleDeleteNode = (nodeId: string) => {
    setNodes(nodes.filter(n => n.id !== nodeId));
    setRelations(relations.filter(r => r.from !== nodeId && r.to !== nodeId));
  };

  const handleNodeMove = (nodeId: string, deltaX: number, deltaY: number) => {
    setNodes(nodes.map(node => 
      node.id === nodeId 
        ? { ...node, x: node.x + deltaX, y: node.y + deltaY }
        : node
    ));
  };

  // Update nodes from API data
  useEffect(() => {
    if (concepts && concepts.length > 0) {
      const apiNodes: ConceptNode[] = concepts.map((concept, index) => ({
        id: concept.id,
        label: concept.concept_name,
        type: 'technology', // Default type, could be enhanced based on concept data
        x: concept.position_x || 200 + (index % 3) * 150,
        y: concept.position_y || 100 + Math.floor(index / 3) * 100,
        color: '#3b82f6',
        description: concept.concept_description
      }));
      setNodes(apiNodes);
    }
  }, [concepts]);

  const generateLayout = (layout: 'circular' | 'hierarchical' | 'force') => {
    const updatedNodes = [...nodes];
    
    switch (layout) {
      case 'circular':
        const centerX = 300;
        const centerY = 200;
        const radius = 150;
        updatedNodes.forEach((node, index) => {
          const angle = (index / updatedNodes.length) * 2 * Math.PI;
          node.x = centerX + radius * Math.cos(angle);
          node.y = centerY + radius * Math.sin(angle);
        });
        break;
        
      case 'hierarchical':
        const levels = ['problem', 'solution', 'technology', 'advantage'];
        updatedNodes.forEach(node => {
          const levelIndex = levels.indexOf(node.type);
          node.y = 100 + levelIndex * 80;
          node.x = 100 + Math.random() * 400;
        });
        break;
        
      case 'force':
        // Simple force-directed layout simulation
        updatedNodes.forEach((node, i) => {
          node.x = 150 + (i % 3) * 150;
          node.y = 100 + Math.floor(i / 3) * 100;
        });
        break;
    }
    
    setNodes(updatedNodes);
  };

  const renderCanvas = () => (
    <div className="relative border rounded-lg h-96 bg-gray-50 overflow-hidden">
      <svg 
        width="100%" 
        height="100%" 
        viewBox={`0 0 ${600 / zoom} ${400 / zoom}`}
        className="absolute inset-0"
      >
        {/* Relations */}
        {relations.map(relation => {
          const fromNode = nodes.find(n => n.id === relation.from);
          const toNode = nodes.find(n => n.id === relation.to);
          if (!fromNode || !toNode) return null;

          return (
            <g key={relation.id}>
              <line
                x1={fromNode.x}
                y1={fromNode.y}
                x2={toNode.x}
                y2={toNode.y}
                stroke="#6b7280"
                strokeWidth={relation.strength * 3}
                markerEnd="url(#arrowhead)"
              />
              <text
                x={(fromNode.x + toNode.x) / 2}
                y={(fromNode.y + toNode.y) / 2 - 10}
                fill="#374151"
                fontSize="12"
                textAnchor="middle"
                className="pointer-events-none"
              >
                {relation.label}
              </text>
            </g>
          );
        })}

        {/* Arrow marker definition */}
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="10"
            refY="3.5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3.5, 0 7"
              fill="#6b7280"
            />
          </marker>
        </defs>

        {/* Nodes */}
        {nodes.map(node => (
          <g key={node.id}>
            <circle
              cx={node.x}
              cy={node.y}
              r="30"
              fill={node.color}
              stroke={selectedNode === node.id ? '#000' : '#fff'}
              strokeWidth="2"
              className="cursor-pointer hover:opacity-80"
              onClick={() => setSelectedNode(node.id)}
            />
            <text
              x={node.x}
              y={node.y}
              fill="white"
              fontSize="10"
              textAnchor="middle"
              className="pointer-events-none font-medium"
            >
              {node.label.length > 10 ? `${node.label.substring(0, 10)}...` : node.label}
            </text>
          </g>
        ))}
      </svg>

      {/* Canvas Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <Button size="sm" variant="outline" onClick={() => setZoom(zoom * 1.2)}>
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="outline" onClick={() => setZoom(zoom / 1.2)}>
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="outline" onClick={() => setZoom(1)}>
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  const renderListView = () => (
    <div className="space-y-4">
      {/* Nodes List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Concepts ({nodes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {nodes.map(node => (
              <div key={node.id} className="flex items-center justify-between p-3 border rounded">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: node.color }}
                  />
                  <div>
                    <span className="font-medium">{node.label}</span>
                    <Badge variant="outline" className="ml-2 text-xs">
                      {node.type}
                    </Badge>
                    {node.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {node.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost">
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDeleteNode(node.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Relations List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Relationships ({relations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {relations.map(relation => {
              const fromNode = nodes.find(n => n.id === relation.from);
              const toNode = nodes.find(n => n.id === relation.to);
              
              return (
                <div key={relation.id} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">{fromNode?.label}</span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">{relation.label}</span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <span className="font-medium">{toNode?.label}</span>
                  </div>
                  <Button size="sm" variant="ghost">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (!sessionId) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Network className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Active Session</h3>
          <p className="text-muted-foreground">
            Please select or create a brainstorming session to map concepts and relationships.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <p className="text-red-800 text-sm">Error loading concepts: {error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Select value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="canvas">Canvas</SelectItem>
                  <SelectItem value="list">List View</SelectItem>
                  <SelectItem value="matrix">Matrix</SelectItem>
                </SelectContent>
              </Select>
              
              <Separator orientation="vertical" className="h-6" />
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsAddingNode(true)}
                disabled={!sessionId}
              >
                <Plus className="h-4 w-4 mr-1" />
                Node
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsAddingRelation(true)}
              >
                <Link className="h-4 w-4 mr-1" />
                Relation
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Select onValueChange={(value: any) => generateLayout(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Layout" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="circular">Circular</SelectItem>
                  <SelectItem value="hierarchical">Hierarchical</SelectItem>
                  <SelectItem value="force">Force-Directed</SelectItem>
                </SelectContent>
              </Select>
              
              <Button size="sm" variant="outline">
                <Save className="h-4 w-4 mr-1" />
                Save
              </Button>
              
              <Button size="sm" variant="outline">
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Node Form */}
      {isAddingNode && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Add New Concept</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Concept Name</Label>
                <Input
                  placeholder="Enter concept name..."
                  value={newNode.label}
                  onChange={(e) => setNewNode({ ...newNode, label: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={newNode.type}
                  onValueChange={(value: any) => setNewNode({ ...newNode, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {nodeTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: type.color }}
                          />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                placeholder="Brief description..."
                value={newNode.description}
                onChange={(e) => setNewNode({ ...newNode, description: e.target.value })}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddingNode(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddNode} disabled={loading || !sessionId}>
                Add Concept
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      {viewMode === 'canvas' && renderCanvas()}
      {viewMode === 'list' && renderListView()}
      {viewMode === 'matrix' && (
        <Card>
          <CardContent className="p-8 text-center">
            <Network className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Matrix view coming soon</p>
          </CardContent>
        </Card>
      )}

      {/* Selected Node Details */}
      {selectedNode && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Selected Concept</CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const node = nodes.find(n => n.id === selectedNode);
              if (!node) return null;
              
              return (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: node.color }}
                    />
                    <span className="font-medium">{node.label}</span>
                    <Badge variant="outline">{node.type}</Badge>
                  </div>
                  {node.description && (
                    <p className="text-sm text-muted-foreground">{node.description}</p>
                  )}
                  
                  <div className="pt-2 border-t">
                    <h4 className="text-sm font-medium mb-2">Connections</h4>
                    <div className="space-y-1">
                      {relations
                        .filter(r => r.from === selectedNode || r.to === selectedNode)
                        .map(relation => {
                          const otherNodeId = relation.from === selectedNode ? relation.to : relation.from;
                          const otherNode = nodes.find(n => n.id === otherNodeId);
                          const direction = relation.from === selectedNode ? '→' : '←';
                          
                          return (
                            <div key={relation.id} className="text-sm">
                              {direction} {relation.label} {otherNode?.label}
                            </div>
                          );
                        })
                      }
                    </div>
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}
    </div>
  );
}