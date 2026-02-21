'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreHorizontal, AlertTriangle, CheckCircle,
  Play, Pause, Eye, Calendar
} from 'lucide-react';

interface WorkflowInstance {
  id: string;
  name: string;
  status: string;
  priority: string;
  progress_percentage: number;
  current_step_order: number;
  due_date?: string;
  assigned_to?: { id: string; name: string };
  workflow_template: { id: string; name: string; category: string };
  created_at: string;
  updated_at: string;
}

interface WorkflowKanbanProps {
  workflows: WorkflowInstance[];
  onStatusChange: (id: string, newStatus: string) => void;
  onViewWorkflow: (id: string) => void;
}

const COLUMNS = [
  { key: 'pending', label: 'Pending', color: 'bg-neutral-100 border-neutral-300' },
  { key: 'in_progress', label: 'In Progress', color: 'bg-blue-50 border-blue-300' },
  { key: 'on_hold', label: 'On Hold', color: 'bg-yellow-50 border-yellow-300' },
  { key: 'completed', label: 'Completed', color: 'bg-green-50 border-green-300' },
];

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'urgent': return 'bg-red-100 text-red-800';
    case 'high': return 'bg-orange-100 text-orange-800';
    case 'medium': return 'bg-blue-100 text-blue-800';
    default: return 'bg-neutral-100 text-neutral-800';
  }
};

const isOverdue = (dueDate?: string) => {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
};

export function WorkflowKanban({ workflows, onStatusChange, onViewWorkflow }: WorkflowKanbanProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    if (draggedId) {
      const workflow = workflows.find(w => w.id === draggedId);
      if (workflow && workflow.status !== targetStatus) {
        onStatusChange(draggedId, targetStatus);
      }
    }
    setDraggedId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {COLUMNS.map(column => {
        const columnWorkflows = workflows.filter(w => w.status === column.key);
        return (
          <div
            key={column.key}
            className={`rounded-lg border-2 border-dashed p-3 min-h-[400px] ${column.color}`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.key)}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm">{column.label}</h3>
              <Badge variant="secondary" className="text-xs">
                {columnWorkflows.length}
              </Badge>
            </div>
            <div className="space-y-2">
              {columnWorkflows.map(workflow => (
                <Card
                  key={workflow.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, workflow.id)}
                  onDragEnd={handleDragEnd}
                  className={`cursor-grab active:cursor-grabbing transition-shadow hover:shadow-md ${
                    draggedId === workflow.id ? 'opacity-50' : ''
                  } ${isOverdue(workflow.due_date) && workflow.status !== 'completed' ? 'border-red-400' : ''}`}
                >
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-start justify-between">
                      <h4 className="text-sm font-medium line-clamp-2">{workflow.name}</h4>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" aria-label="Workflow actions">
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onViewWorkflow(workflow.id)}>
                            <Eye className="h-3 w-3 mr-2" /> View Details
                          </DropdownMenuItem>
                          {workflow.status === 'pending' && (
                            <DropdownMenuItem onClick={() => onStatusChange(workflow.id, 'in_progress')}>
                              <Play className="h-3 w-3 mr-2" /> Start
                            </DropdownMenuItem>
                          )}
                          {workflow.status === 'in_progress' && (
                            <DropdownMenuItem onClick={() => onStatusChange(workflow.id, 'on_hold')}>
                              <Pause className="h-3 w-3 mr-2" /> Put on Hold
                            </DropdownMenuItem>
                          )}
                          {workflow.status === 'on_hold' && (
                            <DropdownMenuItem onClick={() => onStatusChange(workflow.id, 'in_progress')}>
                              <Play className="h-3 w-3 mr-2" /> Resume
                            </DropdownMenuItem>
                          )}
                          {workflow.status !== 'completed' && (
                            <DropdownMenuItem onClick={() => onStatusChange(workflow.id, 'completed')}>
                              <CheckCircle className="h-3 w-3 mr-2" /> Complete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-[10px]">
                        {workflow.workflow_template?.name || 'Custom'}
                      </Badge>
                      <Badge className={`text-[10px] ${getPriorityColor(workflow.priority)}`}>
                        {workflow.priority}
                      </Badge>
                    </div>

                    <Progress value={workflow.progress_percentage} className="h-1.5" />

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      {workflow.assigned_to ? (
                        <div className="flex items-center gap-1">
                          <Avatar className="h-4 w-4">
                            <AvatarFallback className="text-[8px]">
                              {workflow.assigned_to.name?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="truncate max-w-[80px]">{workflow.assigned_to.name}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground/50">Unassigned</span>
                      )}
                      {workflow.due_date && (
                        <div className={`flex items-center gap-1 ${isOverdue(workflow.due_date) && workflow.status !== 'completed' ? 'text-red-600' : ''}`}>
                          {isOverdue(workflow.due_date) && workflow.status !== 'completed' ? (
                            <AlertTriangle className="h-3 w-3" />
                          ) : (
                            <Calendar className="h-3 w-3" />
                          )}
                          <span>{new Date(workflow.due_date).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
