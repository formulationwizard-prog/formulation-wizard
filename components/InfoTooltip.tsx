'use client';

/**
 * InfoTooltip — a small, accessible explainer popover.
 *
 * Usage:
 *   <InfoTooltip>Plain-English explanation of the jargon term.</InfoTooltip>
 *   <InfoTooltip label="What is a_w?">Plain-English explanation.</InfoTooltip>
 *
 * Behavior:
 *   - Tiny HelpCircle icon (lucide-react) trigger
 *   - Opens on hover, focus, or tap
 *   - Closes on blur, mouse leave, Escape, or outside click
 *   - Floating panel positioned above the trigger; flips below if it would clip the top of the viewport
 *   - Tailwind only, no positioning library
 */

import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { HelpCircle } from 'lucide-react';

type Placement = 'top' | 'bottom';

interface InfoTooltipProps {
  children: ReactNode;
  label?: string;
}

export function InfoTooltip({ children, label = 'More information' }: InfoTooltipProps) {
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState<Placement>('top');
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useLayoutEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    const panel = panelRef.current;
    if (!trigger || !panel) return;

    const triggerRect = trigger.getBoundingClientRect();
    const panelHeight = panel.offsetHeight;
    const gap = 8;
    const wouldClipTop = triggerRect.top - panelHeight - gap < 8;
    setPlacement(wouldClipTop ? 'bottom' : 'top');
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };

    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [open]);

  const panelPositionClass =
    placement === 'top'
      ? 'bottom-full mb-2'
      : 'top-full mt-2';

  return (
    <span className="relative inline-flex items-center align-middle">
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center justify-center text-gray-400 hover:text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1 rounded-full"
      >
        <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      {open && (
        <div
          ref={panelRef}
          id={panelId}
          role="tooltip"
          className={`absolute left-1/2 -translate-x-1/2 ${panelPositionClass} z-50 w-max max-w-xs bg-white rounded-lg shadow-lg border border-gray-200 p-3 text-xs text-gray-700 leading-relaxed`}
        >
          {children}
        </div>
      )}
    </span>
  );
}

export default InfoTooltip;
