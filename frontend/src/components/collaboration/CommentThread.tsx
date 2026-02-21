/**
 * CommentThread Component
 * Shows comment threads for a resource with inline comment lists
 */

'use client';

import { useState, useMemo } from 'react';
import { useCommentThreads, useComments } from '@/hooks/useCollaborationData';
import { useAuth } from '@/domains/accounts/hooks/useAuth';
import { CommentItem } from './CommentItem';
import { MentionInput } from './MentionInput';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  MessageSquare,
  Plus,
  CheckCircle2,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  Send,
  Loader2,
} from 'lucide-react';
import type { Comment } from '@/services/collaborationApi';

interface CommentThreadProps {
  contentType: string;
  objectId: string;
}

export function CommentThread({ contentType, objectId }: CommentThreadProps) {
  const { threads, loading, createThread, resolveThread, reopenThread } =
    useCommentThreads(contentType, objectId);
  const { user } = useAuth();
  const [expandedThread, setExpandedThread] = useState<string | null>(null);
  const [showNewThread, setShowNewThread] = useState(false);
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreateThread = async () => {
    if (!newThreadTitle.trim()) return;
    setCreating(true);
    try {
      const thread = await createThread(newThreadTitle.trim());
      setNewThreadTitle('');
      setShowNewThread(false);
      if (thread) {
        setExpandedThread(thread.id);
      }
    } finally {
      setCreating(false);
    }
  };

  const toggleThread = (id: string) => {
    setExpandedThread(prev => (prev === id ? null : id));
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        <span className="text-sm">Loading threads...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold text-sm">
            Discussion ({threads.length})
          </h3>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowNewThread(!showNewThread)}
          className="h-8"
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          New Thread
        </Button>
      </div>

      {/* New thread form */}
      {showNewThread && (
        <div className="p-3 border rounded-lg bg-muted/30 space-y-2">
          <Input
            value={newThreadTitle}
            onChange={(e) => setNewThreadTitle(e.target.value)}
            placeholder="Thread title..."
            className="text-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateThread();
            }}
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setShowNewThread(false);
                setNewThreadTitle('');
              }}
              className="h-7"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleCreateThread}
              disabled={!newThreadTitle.trim() || creating}
              className="h-7"
            >
              {creating ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <Plus className="h-3 w-3 mr-1" />
              )}
              Create
            </Button>
          </div>
        </div>
      )}

      {/* Thread list */}
      {threads.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No discussion threads yet</p>
          <p className="text-xs mt-1">Start a new thread to begin collaborating</p>
        </div>
      ) : (
        <div className="space-y-2">
          {threads.map(thread => (
            <div key={thread.id} className="border rounded-lg">
              {/* Thread header */}
              <div
                className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => toggleThread(thread.id)}
              >
                {expandedThread === thread.id ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">
                      {thread.title || 'Untitled Thread'}
                    </span>
                    {thread.is_resolved && (
                      <Badge variant="secondary" className="text-xs shrink-0">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Resolved
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">
                      {thread.created_by.full_name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(thread.created_at)}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      <MessageSquare className="h-3 w-3 mr-1" />
                      {thread.comment_count}
                    </Badge>
                  </div>
                </div>

                {/* Resolve/Reopen button */}
                <div onClick={(e) => e.stopPropagation()}>
                  {thread.is_resolved ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => reopenThread(thread.id)}
                      aria-label="Reopen thread"
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Reopen
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-green-600 hover:text-green-700"
                      onClick={() => resolveThread(thread.id)}
                      aria-label="Resolve thread"
                    >
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Resolve
                    </Button>
                  )}
                </div>
              </div>

              {/* Expanded thread comments */}
              {expandedThread === thread.id && (
                <>
                  <Separator />
                  <ThreadComments
                    threadId={thread.id}
                    currentUserId={user?.id}
                  />
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ==================== Internal: Thread Comments ====================

interface ThreadCommentsProps {
  threadId: string;
  currentUserId?: string;
}

function ThreadComments({ threadId, currentUserId }: ThreadCommentsProps) {
  const {
    comments,
    loading,
    createComment,
    updateComment,
    deleteComment,
    reactToComment,
  } = useComments(threadId);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Organize comments into tree structure
  const { topLevel, repliesMap } = useMemo(() => {
    const top: Comment[] = [];
    const replies: Record<string, Comment[]> = {};

    for (const comment of comments) {
      if (comment.parent) {
        if (!replies[comment.parent]) {
          replies[comment.parent] = [];
        }
        replies[comment.parent].push(comment);
      } else {
        top.push(comment);
      }
    }

    return { topLevel: top, repliesMap: replies };
  }, [comments]);

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      await createComment(newComment.trim(), replyTo || undefined);
      setNewComment('');
      setReplyTo(null);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = (parentId: string) => {
    setReplyTo(parentId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        <span className="text-sm">Loading comments...</span>
      </div>
    );
  }

  return (
    <div className="p-3">
      {/* Comments list */}
      {topLevel.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground">
          <p className="text-xs">No comments yet. Be the first to comment.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {topLevel.map(comment => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={currentUserId}
              onReply={handleReply}
              onEdit={updateComment}
              onDelete={deleteComment}
              onReact={reactToComment}
              replies={repliesMap[comment.id] || []}
            />
          ))}
        </div>
      )}

      {/* Reply indicator */}
      {replyTo && (
        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground bg-muted/30 p-2 rounded">
          <span>Replying to comment</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-5 text-xs p-1"
            onClick={() => setReplyTo(null)}
          >
            Cancel
          </Button>
        </div>
      )}

      {/* New comment input */}
      <div className="mt-3 flex gap-2">
        <div className="flex-1">
          <MentionInput
            value={newComment}
            onChange={setNewComment}
            onSubmit={handleSubmit}
            placeholder={replyTo ? 'Write a reply...' : 'Write a comment...'}
            className="text-sm min-h-[60px]"
          />
        </div>
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={!newComment.trim() || submitting}
          className="self-end h-8"
          aria-label="Send comment"
        >
          {submitting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Send className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>
    </div>
  );
}
