/**
 * ReactionPicker Component
 * Popover with emoji grid for reacting to comments
 */

'use client';

import { useState } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { SmilePlus } from 'lucide-react';

const REACTIONS = [
  { type: 'thumbs_up', emoji: '\uD83D\uDC4D', label: 'Thumbs up' },
  { type: 'heart', emoji: '\u2764\uFE0F', label: 'Heart' },
  { type: 'smile', emoji: '\uD83D\uDE04', label: 'Smile' },
  { type: 'party', emoji: '\uD83C\uDF89', label: 'Party' },
  { type: 'eyes', emoji: '\uD83D\uDC40', label: 'Eyes' },
  { type: 'rocket', emoji: '\uD83D\uDE80', label: 'Rocket' },
];

interface ReactionPickerProps {
  onSelect: (reactionType: string) => void;
  existingReactions?: Record<string, number>;
}

export function ReactionPicker({ onSelect, existingReactions }: ReactionPickerProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (type: string) => {
    onSelect(type);
    setOpen(false);
  };

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {/* Show existing reactions as clickable badges */}
      {existingReactions && Object.entries(existingReactions).map(([type, count]) => {
        if (count <= 0) return null;
        const reaction = REACTIONS.find(r => r.type === type);
        if (!reaction) return null;
        return (
          <button
            key={type}
            onClick={() => onSelect(type)}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
            aria-label={`${reaction.label} (${count})`}
          >
            <span>{reaction.emoji}</span>
            <span className="text-muted-foreground">{count}</span>
          </button>
        );
      })}

      {/* Add reaction button */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
            aria-label="Add reaction"
          >
            <SmilePlus className="h-3.5 w-3.5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" align="start" sideOffset={4}>
          <div className="grid grid-cols-6 gap-1">
            {REACTIONS.map((reaction) => (
              <button
                key={reaction.type}
                onClick={() => handleSelect(reaction.type)}
                className="h-8 w-8 flex items-center justify-center rounded hover:bg-muted transition-colors text-lg cursor-pointer"
                aria-label={reaction.label}
                title={reaction.label}
              >
                {reaction.emoji}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
