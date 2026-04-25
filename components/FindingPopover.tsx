'use client';

/**
 * FindingPopover — inline severity icon + popover for a single ingredient row.
 *
 * Trigger: a small Lucide icon (chosen by tier) sized h-3.5 w-3.5.
 * Behavior: opens on hover, focus, or click; closes on Escape, blur,
 * mouse-leave, or outside click. Auto-flips above/below the trigger
 * to stay within the viewport.
 *
 * Content: short finding text, optional citation, optional suggested-fix
 * line, and an AdvisoryNotice at the bottom.
 */

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  Ban,
  OctagonX,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { getCopy } from '../lib/copy';
import { useTier } from '../lib/hooks/useTier';
import { AdvisoryNotice } from './AdvisoryNotice';

export type FindingTier = 'banned' | 'critical' | 'warning' | 'caution' | 'ok' | 'unknown';

export interface InlineFinding {
  tier: FindingTier;
  /** Short, single-sentence finding text. */
  text: string;
  /** Authority + section citation, if any. */
  citation?: string;
  /** Optional remediation hint. */
  suggestedFix?: string;
}

const TIER_ICON: Record<FindingTier, { Icon: typeof Ban; color: string; label: string }> = {
  banned:   { Icon: Ban,           color: 'text-rose-700',   label: 'Banned' },
  critical: { Icon: OctagonX,      color: 'text-rose-600',   label: 'Critical' },
  warning:  { Icon: AlertTriangle, color: 'text-amber-600',  label: 'Warning' },
  caution:  { Icon: AlertCircle,   color: 'text-amber-500',  label: 'Caution' },
  unknown:  { Icon: AlertCircle,   color: 'text-amber-500',  label: 'Unknown' },
  ok:       { Icon: CheckCircle2,  color: 'text-emerald-600', label: 'OK' },
};

type Placement = 'top' | 'bottom';

interface FindingPopoverProps {
  finding: InlineFinding;
  /** Optional larger explanation node rendered above suggestedFix. */
  extra?: ReactNode;
}

export function FindingPopover({ finding, extra }: FindingPopoverProps) {
  const tier = useTier();
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

  const { Icon, color, label } = TIER_ICON[finding.tier];

  const panelPositionClass = placement === 'top' ? 'bottom-full mb-2' : 'top-full mt-2';

  const fixLabel = getCopy('findings.label.suggestedFix', tier);
  const citationLabel = getCopy('findings.label.citation', tier);

  return (
    <span className="relative inline-flex items-center align-middle">
      <button
        ref={triggerRef}
        type="button"
        aria-label={`${label}: ${finding.text}`}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="inline-flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1 rounded-full"
      >
        <Icon className={`h-3.5 w-3.5 ${color}`} aria-hidden="true" />
      </button>
      {open && (
        <div
          ref={panelRef}
          id={panelId}
          role="tooltip"
          className={`absolute left-0 ${panelPositionClass} z-50 w-72 max-w-sm bg-white rounded-lg shadow-lg border border-gray-200 p-3 text-xs text-gray-700 leading-relaxed space-y-2`}
        >
          <div className="flex items-start gap-1.5">
            <Icon className={`h-3.5 w-3.5 ${color} shrink-0 mt-0.5`} aria-hidden="true" />
            <p className="font-medium text-gray-800">{finding.text}</p>
          </div>
          {finding.citation && (
            <p className="text-[11px] text-gray-500">
              <span className="font-semibold uppercase tracking-wide">{citationLabel}: </span>
              {finding.citation}
            </p>
          )}
          {extra && <div className="text-[11px] text-gray-600">{extra}</div>}
          {finding.suggestedFix && (
            <p className="text-[11px] italic text-gray-700">
              <span className="font-semibold not-italic uppercase tracking-wide">{fixLabel}: </span>
              {finding.suggestedFix}
            </p>
          )}
          <div className="pt-1.5 border-t border-gray-100">
            <AdvisoryNotice />
          </div>
        </div>
      )}
    </span>
  );
}

export default FindingPopover;
