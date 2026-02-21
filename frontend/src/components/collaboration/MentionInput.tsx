/**
 * MentionInput Component
 * Textarea with @mention autocomplete support
 */

'use client';

import { useState, useRef, useEffect, useCallback, KeyboardEvent } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { ApiClient } from '@/services/apiClient';
import { ScrollArea } from '@/components/ui/scroll-area';

interface MentionUser {
  id: string;
  full_name: string;
  email: string;
}

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onSubmit?: () => void;
  className?: string;
}

const apiClient = new ApiClient();

export function MentionInput({
  value,
  onChange,
  placeholder = 'Write a comment... (@ to mention, Ctrl+Enter to submit)',
  onSubmit,
  className,
}: MentionInputProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStartPos, setMentionStartPos] = useState<number | null>(null);
  const [users, setUsers] = useState<MentionUser[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch users when mention query changes
  useEffect(() => {
    if (!showDropdown || mentionQuery.length < 1) {
      setUsers([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoadingUsers(true);
      try {
        const response = await apiClient.get<any>('/accounts/users/', {
          params: { search: mentionQuery, limit: '8' },
        });
        if (response.success && response.data) {
          const data = response.data;
          const results = Array.isArray(data) ? data : data.results ?? [];
          setUsers(results.map((u: any) => ({
            id: u.id,
            full_name: u.full_name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email,
            email: u.email,
          })));
        } else {
          setUsers([]);
        }
      } catch {
        setUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [mentionQuery, showDropdown]);

  // Handle text changes — detect @ triggers
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart;
    onChange(newValue);

    // Check for @ mention trigger
    const textBeforeCursor = newValue.slice(0, cursorPos);
    const atMatch = textBeforeCursor.match(/@(\w*)$/);

    if (atMatch) {
      setMentionStartPos(cursorPos - atMatch[0].length);
      setMentionQuery(atMatch[1]);
      setShowDropdown(true);
      setSelectedIndex(0);
    } else {
      setShowDropdown(false);
      setMentionStartPos(null);
      setMentionQuery('');
    }
  }, [onChange]);

  // Insert selected mention
  const insertMention = useCallback((user: MentionUser) => {
    if (mentionStartPos === null) return;

    const before = value.slice(0, mentionStartPos);
    const cursorPos = textareaRef.current?.selectionStart ?? value.length;
    const after = value.slice(cursorPos);
    const mention = `@[${user.full_name}] `;
    const newValue = before + mention + after;

    onChange(newValue);
    setShowDropdown(false);
    setMentionStartPos(null);
    setMentionQuery('');

    // Restore focus
    setTimeout(() => {
      if (textareaRef.current) {
        const newPos = before.length + mention.length;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newPos, newPos);
      }
    }, 0);
  }, [mentionStartPos, value, onChange]);

  // Handle keyboard navigation in dropdown
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (showDropdown && users.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % users.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + users.length) % users.length);
        return;
      }
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        insertMention(users[selectedIndex]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowDropdown(false);
        return;
      }
    }

    // Ctrl+Enter to submit
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      onSubmit?.();
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
      />

      {/* Mention autocomplete dropdown */}
      {showDropdown && (users.length > 0 || loadingUsers) && (
        <div
          ref={dropdownRef}
          className="absolute bottom-full mb-1 left-0 w-64 bg-popover border rounded-md shadow-md z-50"
        >
          <ScrollArea className="max-h-48">
            {loadingUsers && users.length === 0 ? (
              <div className="p-3 text-sm text-muted-foreground text-center">
                Searching users...
              </div>
            ) : (
              <div className="py-1">
                {users.map((user, index) => (
                  <button
                    key={user.id}
                    className={`w-full text-left px-3 py-2 text-sm cursor-pointer transition-colors ${
                      index === selectedIndex
                        ? 'bg-accent text-accent-foreground'
                        : 'hover:bg-muted'
                    }`}
                    onClick={() => insertMention(user)}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <div className="font-medium">{user.full_name}</div>
                    <div className="text-xs text-muted-foreground">{user.email}</div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
