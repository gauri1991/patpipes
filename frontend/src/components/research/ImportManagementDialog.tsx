/**
 * ImportManagementDialog Component
 * Manage import history and delete options for imported patents
 */

'use client';

import { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Trash2,
  Eye,
  Calendar,
  User,
  AlertCircle,
  RefreshCw,
  MoreVertical,
  Download
} from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';

import { patentImportApi, ImportBatch } from '@/services/patentImportApi';

interface ImportManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

export function ImportManagementDialog({
  open,
  onOpenChange,
  projectId
}: ImportManagementDialogProps) {
  const [importBatches, setImportBatches] = useState<ImportBatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingBatchId, setDeletingBatchId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadImportHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const batches = await patentImportApi.getImportBatches(projectId);
      setImportBatches(batches);
    } catch (err) {
      setError(`Failed to load import history: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error('Failed to load import history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBatch = async (batchId: string) => {
    setDeletingBatchId(batchId);
    try {
      await patentImportApi.deleteImportBatch(projectId, batchId);
      await loadImportHistory(); // Refresh the list
      setError(null);
    } catch (err) {
      setError(`Failed to delete import batch: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error('Failed to delete import batch:', err);
    } finally {
      setDeletingBatchId(null);
    }
  };

  useEffect(() => {
    if (open) {
      loadImportHistory();
    }
  }, [open, projectId]);

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: 'default',
      processing: 'secondary',
      failed: 'destructive',
      partial: 'outline'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-full max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Import Management
          </DialogTitle>
          <DialogDescription>
            View import history and manage imported patent batches
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{importBatches.length}</div>
                <div className="text-sm text-muted-foreground">Total Imports</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">
                  {importBatches.reduce((sum, batch) => sum + batch.successful_imports, 0)}
                </div>
                <div className="text-sm text-muted-foreground">Patents Imported</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">
                  {importBatches.filter(b => b.status === 'completed').length}
                </div>
                <div className="text-sm text-muted-foreground">Successful</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">
                  {importBatches.filter(b => b.status === 'failed').length}
                </div>
                <div className="text-sm text-muted-foreground">Failed</div>
              </CardContent>
            </Card>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Import History Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Import History</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadImportHistory}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                  <span>Loading import history...</span>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Import Details</TableHead>
                        <TableHead>Source File</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Results</TableHead>
                        <TableHead>Imported By</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {importBatches.map((batch) => (
                        <TableRow key={batch.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {batch.batch_name || 'Unnamed Import'}
                              </div>
                              {batch.batch_description && (
                                <div className="text-sm text-muted-foreground">
                                  {batch.batch_description}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-mono">
                                {batch.source_filename}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(batch.status)}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div className="text-green-600 font-medium">
                                ✓ {batch.successful_imports} successful
                              </div>
                              {batch.failed_imports > 0 && (
                                <div className="text-red-600">
                                  ✗ {batch.failed_imports} failed
                                </div>
                              )}
                              <div className="text-muted-foreground">
                                {batch.total_rows} total rows
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm">{batch.imported_by_name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(batch.imported_at)}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Download className="h-4 w-4 mr-2" />
                                  Export Results
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <DropdownMenuItem
                                      className="text-red-600"
                                      onSelect={(e) => e.preventDefault()}
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete Import
                                    </DropdownMenuItem>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Import Batch</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This will permanently delete this import batch and all {batch.successful_imports} associated patents. 
                                        This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDeleteBatch(batch.id)}
                                        disabled={deletingBatchId === batch.id}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        {deletingBatchId === batch.id ? (
                                          <>
                                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                            Deleting...
                                          </>
                                        ) : (
                                          <>
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete
                                          </>
                                        )}
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  {importBatches.length === 0 && !loading && (
                    <div className="text-center py-8">
                      <FileSpreadsheet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Imports Found</h3>
                      <p className="text-muted-foreground">
                        Import some patents to see them here.
                      </p>
                    </div>
                  )}
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}