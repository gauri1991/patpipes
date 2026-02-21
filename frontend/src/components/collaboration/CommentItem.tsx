/**
 * CommentItem Component
 * Displays a single comment with author info, reactions, and reply/edit/delete actions
 */

'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ReactionPicker } from './ReactionPicker';
import { Reply, Edit2, Trash2, Check, X } from 'lucide-react';
import type { Comment } from '@/services/collaborationApi';

interface CommentItemProps {
  comment: Comment;
  currentUserId?: string;
  onReply?: (parentId: string) => void;
  onEdit?: (commentId: string, text: string) => void;
  onDelete?: (commentId: string) => void;
  onReact?: (commentId: string, reactionType: string) => void;
  replies?: Comment[];
  depth?: number;
}

export function CommentItem({
  comment,
  currentUserId,
  onReply,
  onEdit,
  onDelete,
  onReact,
  replies = [],
  depth = 0,
}: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.text);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isOwner = currentUserId === comment.author;
  const maxDepth = 3;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return time.toLocaleDateString();
  };

  const handleEditSave = () => {
    if (editText.trim() && editText !== comment.text) {
      onEdit?.(comment.id, editText.trim());
    }
    setIsEditing(false);
  };

  const handleEditCancel = () => {
    setEditText(comment.text);
    setIsEditing(false);
  };

  const handleDelete = () => {
    onDelete?.(comment.id);
    setShowDeleteConfirm(false);
  };

  return (
    <div className={depth > 0 ? 'ml-8 border-l-2 border-neutral-200 pl-4' : ''}>
      <div className="flex items-start gap-3 py-3">
        {/* Author Avatar */}
        <Avatar className="h-8 w-8 shrink-0">
          {comment.author_avatar && (
            <AvatarImage src={comment.author_avatar} alt={comment.author_name} />
          )}
          <AvatarFallback className="text-xs bg-neutral-100 text-neutral-600">
            {getInitials(comment.author_name)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          {/* Author name and timestamp */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-foreground">
              {comment.author_name}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatTimeAgo(comment.created_at)}
            </span>
            {comment.is_edited && (
              <span className="text-xs text-muted-foreground italic">(edited)</span>
            )}
          </div>

          {/* Comment text or edit input */}
          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="text-sm min-h-[60px]"
                autoFocus
              />
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={handleEditSave} className="h-7">
                  <Check className="h-3 w-3 mr-1" />
                  Save
                </Button>
                <Button size="sm" variant="ghost" onClick={handleEditCancel} className="h-7">
                  <X className="h-3 w-3 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-foreground whitespace-pre-wrap break-words">
              {comment.text}
            </p>
          )}

          {/* Reactions */}
          {!isEditing && (
            <div className="mt-2">
              <ReactionPicker
                onSelect={(type) => onReact?.(comment.id, type)}
                existingReactions={comment.reaction_summary}
              />
            </div>
          )}

          {/* Action buttons */}
          {!isEditing && (
            <div className="flex items-center gap-1 mt-2">
              {depth < maxDepth && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => onReply?.(comment.id)}
                  aria-label="Reply to comment"
                >
                  <Reply className="h-3 w-3 mr-1" />
                  Reply
                </Button>
              )}
              {isOwner && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => setIsEditing(true)}
                    aria-label="Edit comment"
                  >
                    <Edit2 className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  {showDeleteConfirm ? (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={handleDelete}
                      >
                        Confirm delete
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-muted-foreground"
                        onClick={() => setShowDeleteConfirm(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-muted-foreground hover:text-red-600"
                      onClick={() => setShowDeleteConfirm(true)}
                      aria-label="Delete comment"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Nested replies */}
      {replies.length > 0 && (
        <div>
          {replies.map(reply => (
            <CommentItem
              key={reply.id}
              comment={reply}
              currentUserId={currentUserId}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              onReact={onReact}
              replies={[]}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
