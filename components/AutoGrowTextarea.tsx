'use client';

import { useEffect, useRef, type ChangeEvent } from 'react';

/**
 * Auto-grow textarea — small initial height, expands line-by-line as
 * the operator types. Never shows an internal scrollbar (the whole page
 * scrolls instead). Removes the "huge fixed box" feel of rows={20}-style
 * textareas — content + viewport stay in sync.
 *
 * Per operator UX directive 2026-05-27 (joy-of-mastery: responsive boxes
 * vs. wasted whitespace). Pattern applies workspace-wide; first wired in
 * the Batch Sheet's Process Instructions textarea; expected reuse in PDS
 * Phase 1.5 operator-input fields.
 */
interface AutoGrowTextareaProps {
  value: string;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  className?: string;
  minRows?: number;
  spellCheck?: boolean;
  /** Print-friendly fallback rows for static printed output. */
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

  // Resize whenever value changes (covers external sets — e.g., localStorage
  // hydration, saved-formula reload, programmatic reset).
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
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
        el.style.height = 'auto';
        el.style.height = `${el.scrollHeight}px`;
      }}
      placeholder={placeholder}
      rows={printRows ?? minRows}
      spellCheck={spellCheck}
      style={{ resize: 'none', overflow: 'hidden' }}
      className={className}
    />
  );
}
