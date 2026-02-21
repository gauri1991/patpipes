/**
 * Dataset Card Component
 * Displays individual dataset information with actions
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  MoreVertical,
  Eye,
  Play,
  Trash2,
  Calendar,
  Database,
  TrendingUp
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { StatusBadge } from './StatusBadge';

export interface Dataset {
  id: string;
  name: string;
  description?: string;
  data_source: string;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  processing_progress: number;
  total_patents: number;
  processed_patents: number;
  created_at: string;
  updated_at: string;
  project?: string;
}

interface DatasetCardProps {
  dataset: Dataset;
  onProcess?: (id: string) => void;
  onDelete?: (id: string) => void;
  className?: string;
}

export function DatasetCard({
  dataset,
  onProcess,
  onDelete,
  className = ''
}: DatasetCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleProcess = () => {
    if (onProcess) {
      onProcess(dataset.id);
    }
  };

  const handleDelete = async () => {
    if (onDelete) {
      setIsDeleting(true);
      try {
        await onDelete(dataset.id);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const canProcess = dataset.processing_status === 'pending' || dataset.processing_status === 'failed';
  const isProcessing = dataset.processing_status === 'processing';

  return (
    <Card className={`hover:shadow-md transition-shadow ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="truncate">{dataset.name}</span>
                <StatusBadge status={dataset.processing_status} />
              </CardTitle>
              {dataset.description && (
                <CardDescription className="mt-1 line-clamp-2">
                  {dataset.description}
                </CardDescription>
              )}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/analytics/datasets/${dataset.id}`}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Link>
              </DropdownMenuItem>
              {canProcess && (
                <DropdownMenuItem onClick={handleProcess}>
                  <Play className="h-4 w-4 mr-2" />
                  Process Dataset
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {isDeleting ? 'Deleting...' : 'Delete'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent>
        {/* Processing Progress */}
        {isProcessing && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Processing Progress</span>
              <span className="font-medium">{dataset.processing_progress}%</span>
            </div>
            <Progress value={dataset.processing_progress} className="h-2" />
          </div>
        )}

        {/* Dataset Statistics */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Total Patents</p>
              <p className="text-sm font-semibold">{dataset.total_patents.toLocaleString()}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Processed</p>
              <p className="text-sm font-semibold">{dataset.processed_patents.toLocaleString()}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Created</p>
              <p className="text-sm font-semibold">{formatDate(dataset.created_at)}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="flex-1">
            <Link href={`/dashboard/analytics/datasets/${dataset.id}`}>
              <Eye className="h-4 w-4 mr-2" />
              View Records
            </Link>
          </Button>
          {canProcess && (
            <Button
              onClick={handleProcess}
              size="sm"
              className="flex-1"
            >
              <Play className="h-4 w-4 mr-2" />
              Process
            </Button>
          )}
        </div>

        {/* Data Source Badge */}
        <div className="mt-3 pt-3 border-t">
          <p className="text-xs text-muted-foreground">
            Source: <span className="font-medium capitalize">{dataset.data_source.replace('_', ' ')}</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
