/**
 * ShareDialog Component
 * Dialog for sharing a resource with other users
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useSharedResources } from '@/hooks/useCollaborationData';
import { collaborationApi, SharedResource } from '@/services/collaborationApi';
import { ApiClient } from '@/services/apiClient';
import {
  Share2,
  Send,
  X,
  UserPlus,
  Eye,
  MessageSquare,
  Edit2,
  Loader2,
  Search,
} from 'lucide-react';

const apiClient = new ApiClient();

interface ShareDialogProps {
  contentType: string;
  objectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SearchUser {
  id: string;
  full_name: string;
  email: string;
}

const permissionIcons: Record<string, React.ElementType> = {
  view: Eye,
  comment: MessageSquare,
  edit: Edit2,
};

const permissionLabels: Record<string, string> = {
  view: 'View',
  comment: 'Comment',
  edit: 'Edit',
};

export function ShareDialog({
  contentType,
  objectId,
  open,
  onOpenChange,
}: ShareDialogProps) {
  const { sharedByMe, share, revoke, refresh } = useSharedResources();
  const [userSearch, setUserSearch] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SearchUser | null>(null);
  const [permissionLevel, setPermissionLevel] = useState<string>('view');
  const [message, setMessage] = useState('');
  const [sharing, setSharing] = useState(false);

  // Filter shares for this specific resource
  const resourceShares = sharedByMe.filter(
    s => s.content_type === contentType && s.object_id === objectId && s.status !== 'revoked'
  );

  // Search users
  useEffect(() => {
    if (userSearch.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const response = await apiClient.get<any>('/accounts/users/', {
          params: { search: userSearch, limit: '6' },
        });
        if (response.success && response.data) {
          const data = response.data;
          const results = Array.isArray(data) ? data : data.results ?? [];
          setSearchResults(
            results.map((u: any) => ({
              id: u.id,
              full_name:
                u.full_name ||
                `${u.first_name || ''} ${u.last_name || ''}`.trim() ||
                u.email,
              email: u.email,
            }))
          );
        }
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [userSearch]);

  const handleSelectUser = (user: SearchUser) => {
    setSelectedUser(user);
    setUserSearch('');
    setSearchResults([]);
  };

  const handleShare = async () => {
    if (!selectedUser) return;
    setSharing(true);
    try {
      await share({
        content_type: contentType,
        object_id: objectId,
        shared_with: selectedUser.id,
        permission_level: permissionLevel,
        message: message || undefined,
      });
      setSelectedUser(null);
      setMessage('');
      setPermissionLevel('view');
      refresh();
    } finally {
      setSharing(false);
    }
  };

  const handleRevoke = async (shareId: string) => {
    await revoke(shareId);
    refresh();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Resource
          </DialogTitle>
          <DialogDescription>
            Share this resource with team members and set their permissions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* User search */}
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="share-user-search">
              Add people
            </label>
            {selectedUser ? (
              <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/30">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs">
                    {getInitials(selectedUser.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{selectedUser.full_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{selectedUser.email}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => setSelectedUser(null)}
                  aria-label="Remove selected user"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="share-user-search"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search by name or email..."
                  className="pl-9 text-sm"
                />
                {/* Search results dropdown */}
                {(searchResults.length > 0 || searching) && (
                  <div className="absolute top-full mt-1 left-0 right-0 bg-popover border rounded-md shadow-md z-50">
                    <ScrollArea className="max-h-40">
                      {searching && searchResults.length === 0 ? (
                        <div className="p-3 text-sm text-muted-foreground text-center">
                          Searching...
                        </div>
                      ) : (
                        <div className="py-1">
                          {searchResults.map(user => (
                            <button
                              key={user.id}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-muted cursor-pointer flex items-center gap-2"
                              onClick={() => handleSelectUser(user)}
                            >
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-xs">
                                  {getInitials(user.full_name)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <div className="font-medium truncate">{user.full_name}</div>
                                <div className="text-xs text-muted-foreground truncate">
                                  {user.email}
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Permission level */}
          {selectedUser && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="share-permission">
                  Permission
                </label>
                <Select value={permissionLevel} onValueChange={setPermissionLevel}>
                  <SelectTrigger id="share-permission">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="view">
                      <div className="flex items-center gap-2">
                        <Eye className="h-3.5 w-3.5" />
                        View only
                      </div>
                    </SelectItem>
                    <SelectItem value="comment">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-3.5 w-3.5" />
                        Can comment
                      </div>
                    </SelectItem>
                    <SelectItem value="edit">
                      <div className="flex items-center gap-2">
                        <Edit2 className="h-3.5 w-3.5" />
                        Can edit
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Optional message */}
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="share-message">
                  Message (optional)
                </label>
                <Textarea
                  id="share-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Add a message..."
                  className="text-sm min-h-[60px]"
                />
              </div>
            </>
          )}

          {/* Current shares */}
          {resourceShares.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Shared with</h4>
                <div className="space-y-2">
                  {resourceShares.map(s => {
                    const PermIcon = permissionIcons[s.permission_level] || Eye;
                    return (
                      <div
                        key={s.id}
                        className="flex items-center gap-2 p-2 rounded-md border"
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {getInitials(s.shared_with.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {s.shared_with.full_name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {s.shared_with.email}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs shrink-0">
                          <PermIcon className="h-3 w-3 mr-1" />
                          {permissionLabels[s.permission_level] || s.permission_level}
                        </Badge>
                        {s.status === 'pending' && (
                          <Badge variant="secondary" className="text-xs shrink-0">
                            Pending
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-red-600"
                          onClick={() => handleRevoke(s.id)}
                          aria-label={`Revoke access for ${s.shared_with.full_name}`}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {selectedUser && (
            <Button onClick={handleShare} disabled={sharing}>
              {sharing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Send className="h-4 w-4 mr-1" />
              )}
              Share
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
