'use client';

import { useEffect, useRef, type ChangeEvent } from 'react';

/**
 * Auto-grow textarea — small initial height (minRows), expands line-by-line
 * as the operator types. Never shows an internal scrollbar (page scrolls
 * instead). Removes the "huge fixed box" feel of rows={20}-style textareas.
 *
 * Per operator UX directive 2026-05-27 (joy-of-mastery: responsive boxes
 * vs. wasted whitespace).
 *
 * Empty-state nuance — when value is empty, we let the `rows` attribute
 * control the height (so the textarea stays compact at minRows). When the
 * user types, we measure scrollHeight and grow. Without this guard, a
 * multi-line placeholder pushes scrollHeight up on first mount, leaving
 * the textarea visually large even though no content exists. Bug surfaced
 * by operator 2026-05-27 — initial implementation used printRows for the
 * `rows` attribute, making the screen render 20 rows tall before any input.
 *
 * Print: screen-set inline height carries into print. printRows is a
 * CSS-only hint (via CSS custom property + @media print rule in
 * app/globals.css) — if you want a printed BPR with handwritten fill-in
 * space regardless of typed content, use the .auto-grow-print-rows class
 * and set --print-rows via inline style.
 */
interface AutoGrowTextareaProps {
  value: string;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  className?: string;
  minRows?: number;
  spellCheck?: boolean;
  /** Optional print-only minimum rows (handwritten fill-in space on printed BPR). */
  printRows?: number;
}

export function AutoGrowTextarea({
  value,
  onChange,
  placeholder,
  className,
  minRows = 3,
  spellCheck = true,
  printRows,
}: AutoGrowTextareaProps) {
  const ref = useRef<HTMLTextAreaElement | null>(null);

  // Resize whenever value changes — but ONLY when there is content.
  // Empty value → let rows attribute control (stay compact at minRows).
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!value) {
      el.style.height = '';
      return;
    }
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={onChange}
      onInput={(e) => {
        const el = e.currentTarget;
        if (!el.value) {
          el.style.height = '';
          return;
        }
        el.style.height = 'auto';
        el.style.height = `${el.scrollHeight}px`;
      }}
      placeholder={placeholder}
      rows={minRows}
      spellCheck={spellCheck}
      data-print-rows={printRows ?? undefined}
      style={
        printRows
          ? ({ resize: 'none', overflow: 'hidden', '--print-rows': printRows } as React.CSSProperties)
          : { resize: 'none', overflow: 'hidden' }
      }
      className={`${className ?? ''} ${printRows ? 'auto-grow-print-rows' : ''}`.trim()}
    />
  );
}
