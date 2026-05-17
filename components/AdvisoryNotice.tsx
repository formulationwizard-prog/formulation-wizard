'use client';

/**
 * AdvisoryNotice — single-line muted advisory.
 *
 * Default copy: getCopy('advisory.processAuthority', tier).
 * Override with `text` prop. Optional inline link via `linkHref` + `linkLabel`
 * (renders as a button if `onLinkClick` is provided instead).
 *
 * Used inside: Determination Engine card, FindingPopover, anywhere a
 * system-issued determination needs the standard advisory disclaimer.
 */

import { Info } from 'lucide-react';
import { getCopy } from '../lib/copy';
import { useTier } from '../lib/hooks/useTier';

interface AdvisoryNoticeProps {
  text?: string;
  linkHref?: string;
  linkLabel?: string;
  onLinkClick?: () => void;
  /**
   * Workspace mode for mode-aware default copy. When `mode === 'supplements'`,
   * uses the supplement-aware advisory + link-label copy keys ("qualified
   * regulatory reviewer" framing). Omitted or 'fb' → existing F&B-mode copy
   * ("Process Authority" framing). Explicit `text` / `linkLabel` props
   * override the mode-aware defaults.
   *
   * Round 11 Phase 3 Workstream A.5 [2/N] (#25f closure). Callers that
   * render AdvisoryNotice in a mode-specific context (e.g.,
   * DeterminationEngineCard) pass the active mode; callers in mode-
   * agnostic contexts (e.g., FindingPopover today) omit the prop and
   * default to F&B copy. The default-F&B behavior preserves backward
   * compat — no caller changes required beyond the active mode-aware
   * site.
   */
  mode?: 'fb' | 'supplements';
}

export function AdvisoryNotice({ text, linkHref, linkLabel, onLinkClick, mode }: AdvisoryNoticeProps) {
  const tier = useTier();
  const isSupplement = mode === 'supplements';
  const body = text ?? getCopy(isSupplement ? 'advisory.processAuthority.supplements' : 'advisory.processAuthority', tier);
  const defaultLinkLabel = getCopy(isSupplement ? 'advisory.processAuthority.linkLabel.supplements' : 'advisory.processAuthority.linkLabel', tier);
  const resolvedLinkLabel = linkLabel ?? (onLinkClick || linkHref ? defaultLinkLabel : undefined);

  return (
    <div className="flex items-start gap-1.5 text-xs text-gray-600">
      <Info className="h-3.5 w-3.5 text-gray-500 shrink-0 mt-0.5" aria-hidden="true" />
      <p className="leading-relaxed">
        <span>{body}</span>
        {resolvedLinkLabel && (onLinkClick ? (
          <button
            type="button"
            onClick={onLinkClick}
            className="ml-1.5 text-emerald-700 hover:text-emerald-800 hover:underline font-medium"
          >
            {resolvedLinkLabel}
          </button>
        ) : linkHref ? (
          <a
            href={linkHref}
            className="ml-1.5 text-emerald-700 hover:text-emerald-800 hover:underline font-medium"
          >
            {resolvedLinkLabel}
          </a>
        ) : null)}
      </p>
    </div>
  );
}

export default AdvisoryNotice;
