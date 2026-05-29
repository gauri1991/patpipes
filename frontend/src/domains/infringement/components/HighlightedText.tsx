'use client';

/**
 * Renders text with claim terms highlighted in their assigned colors.
 * `termColors` maps a normalized term (e.g. "heating device") → hex color. Matches are
 * case-insensitive, word-boundary, longest-term-first (so "memory bandwidth credits" wins
 * over "memory"). Highlighted spans get a colored underline + tinted background.
 */

import React, { useMemo } from 'react';
import { stripClaimMarkup } from '@/domains/infringement/lib/claimText';

interface HighlightedTextProps {
  text: string;
  termColors?: Record<string, string>;
  className?: string;
  // When provided, highlighted terms become clickable (e.g. to activate that color).
  onTermClick?: (color: string, term: string) => void;
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Distinct term-colors that actually appear in a text (order: first appearance).
export function colorsInText(text: string, termColors?: Record<string, string>): string[] {
  const terms = Object.keys(termColors || {}).filter(Boolean).sort((a, b) => b.length - a.length);
  if (!text || terms.length === 0) return [];
  const re = new RegExp(`\\b(${terms.map(escapeRegExp).join('|')})\\b`, 'gi');
  const seen: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const c = termColors![m[0].toLowerCase()];
    if (c && !seen.includes(c)) seen.push(c);
    if (m.index === re.lastIndex) re.lastIndex++;
  }
  return seen;
}

// hex (#rrggbb) → rgba string with given alpha, for a light tint background.
function tint(hex: string, alpha: number) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return 'transparent';
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

export function HighlightedText({ text: rawText, termColors, className, onTermClick }: HighlightedTextProps) {
  // Strip any leftover inline markup (e.g. <b>1</b>) from claims imported by older parsers.
  const text = stripClaimMarkup(rawText);
  const parts = useMemo(() => {
    const terms = Object.keys(termColors || {}).filter(Boolean).sort((a, b) => b.length - a.length);
    if (!text || terms.length === 0) return [{ t: text || '', c: null as string | null }];
    const re = new RegExp(`\\b(${terms.map(escapeRegExp).join('|')})\\b`, 'gi');
    const out: { t: string; c: string | null }[] = [];
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      if (m.index > last) out.push({ t: text.slice(last, m.index), c: null });
      const color = termColors![m[0].toLowerCase()] || null;
      out.push({ t: m[0], c: color });
      last = m.index + m[0].length;
      if (m.index === re.lastIndex) re.lastIndex++; // guard against zero-length
    }
    if (last < text.length) out.push({ t: text.slice(last), c: null });
    return out;
  }, [text, termColors]);

  return (
    <span className={className}>
      {parts.map((p, i) =>
        p.c ? (
          <mark
            key={i}
            onClick={onTermClick ? (e) => { e.preventDefault(); e.stopPropagation(); onTermClick(p.c!, p.t); } : undefined}
            title={onTermClick ? 'Use this color' : undefined}
            style={{
              color: 'inherit',
              backgroundColor: tint(p.c, 0.18),
              borderBottom: `2px solid ${p.c}`,
              borderRadius: 2,
              padding: '0 1px',
              cursor: onTermClick ? 'pointer' : undefined,
            }}
          >
            {p.t}
          </mark>
        ) : (
          <React.Fragment key={i}>{p.t}</React.Fragment>
        )
      )}
    </span>
  );
}
