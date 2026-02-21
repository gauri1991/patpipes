/**
 * Audit Log Viewer Component
 * Displays permission change history with filtering and pagination
 */

'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import permissionCache from '@/lib/api/permissionCache';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  History,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  User,
  Shield,
  Clock,
  FileText,
} from 'lucide-react';

interface AuditLog {
  id: string;
  actor: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    full_name: string;
    role: string;
  } | null;
  action: string;
  target_user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    full_name: string;
    role: string;
  } | null;
  target_role: string | null;
  description: string;
  changes: Record<string, any>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

interface AuditLogsResponse {
  logs: AuditLog[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

export function AuditLogViewer() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [limit] = useState(50);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  // Filters
  const [actionFilter, setActionFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Load logs
  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const data: AuditLogsResponse = await permissionCache.getAuditLogs({
        limit,
        offset,
        action: actionFilter || undefined,
      });

      setLogs(data.logs);
      setTotal(data.total);
      setHasMore(data.has_more);
    } catch (error: any) {
      toast.error('Failed to load audit logs', {
        description: error.message,
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [offset, actionFilter]);

  // Filter logs by search query (client-side)
  const filteredLogs = logs.filter((log) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      log.description.toLowerCase().includes(query) ||
      log.actor?.email.toLowerCase().includes(query) ||
      log.actor?.full_name.toLowerCase().includes(query) ||
      log.target_user?.email.toLowerCase().includes(query) ||
      log.target_user?.full_name.toLowerCase().includes(query) ||
      log.target_role?.toLowerCase().includes(query)
    );
  });

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  };

  // Get action badge color
  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'role_permission_update':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'user_permission_create':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'user_permission_update':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
      case 'user_permission_delete':
        return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  // Format action label
  const formatActionLabel = (action: string) => {
    return action
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Navigate pagination
  const handlePrevPage = () => {
    if (offset > 0) {
      setOffset(Math.max(0, offset - limit));
    }
  };

  const handleNextPage = () => {
    if (hasMore) {
      setOffset(offset + limit);
    }
  };

  return (
    <Card className="mt-8">
      <CardHeader>
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-muted-foreground" />
          <CardTitle>Permission Audit Log</CardTitle>
        </div>
        <CardDescription>
          Track all permission changes and modifications made by administrators
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by user, description, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Actions</SelectItem>
                <SelectItem value="role_permission_update">
                  Role Permission Update
                </SelectItem>
                <SelectItem value="user_permission_create">
                  User Permission Create
                </SelectItem>
                <SelectItem value="user_permission_update">
                  User Permission Update
                </SelectItem>
                <SelectItem value="user_permission_delete">
                  User Permission Delete
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results count */}
        <div className="mb-4 text-sm text-muted-foreground">
          Showing {offset + 1}-{Math.min(offset + limit, total)} of {total} total logs
          {searchQuery && ` (${filteredLogs.length} filtered)`}
        </div>

        <Separator className="mb-4" />

        {/* Audit logs list */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No audit logs found</p>
            <p className="text-sm text-muted-foreground">
              {searchQuery || actionFilter
                ? 'Try adjusting your filters'
                : 'Permission changes will appear here'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge className={getActionBadgeColor(log.action)}>
                      {formatActionLabel(log.action)}
                    </Badge>
                    {log.target_role && (
                      <Badge variant="outline" className="font-normal">
                        <Shield className="h-3 w-3 mr-1" />
                        {log.target_role}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formatTimestamp(log.created_at)}
                  </div>
                </div>

                <p className="text-sm mb-3">{log.description}</p>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {log.actor && (
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span>
                        By: <span className="font-medium">{log.actor.full_name}</span> (
                        {log.actor.email})
                      </span>
                    </div>
                  )}
                  {log.target_user && (
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span>
                        User: <span className="font-medium">{log.target_user.full_name}</span> (
                        {log.target_user.email})
                      </span>
                    </div>
                  )}
                </div>

                {/* Show change details if available */}
                {Object.keys(log.changes).length > 0 && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-xs text-primary hover:underline">
                      View details
                    </summary>
                    <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-32">
                      {JSON.stringify(log.changes, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && total > limit && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevPage}
              disabled={offset === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>

            <div className="text-sm text-muted-foreground">
              Page {Math.floor(offset / limit) + 1} of {Math.ceil(total / limit)}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={!hasMore}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
