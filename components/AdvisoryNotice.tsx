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
}

export function AdvisoryNotice({ text, linkHref, linkLabel, onLinkClick }: AdvisoryNoticeProps) {
  const tier = useTier();
  const body = text ?? getCopy('advisory.processAuthority', tier);
  const defaultLinkLabel = getCopy('advisory.processAuthority.linkLabel', tier);
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
