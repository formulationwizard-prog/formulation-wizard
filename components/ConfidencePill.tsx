// ============================================================
// ConfidencePill — shared rendering primitive for the Confidence taxonomy
// ------------------------------------------------------------
// Color language (per 2026-05-07 directive Round 1):
//   • measured   — no pill (absence = trust the number)
//   • calculated — stone pill (math sound, may inherit from less-trusted inputs)
//   • estimated  — amber pill (uncertain, verify before use)
//   • inferred   — amber pill (same color as estimated; pill text differentiates)
//   • unknown    — no pill (caller renders em-dash for the value itself)
//
// Note: Class 1a confidence pills use stone/amber. Class 3 "we require" buyer-requirement
// pills use SLATE (slate-100/slate-700) — visually distinct from this Class 1a vocabulary.
//
// See memory/project_honest_estimate_reframe.md and feedback_three_class_value_taxonomy.md.
// ============================================================

import type { Confidence } from '@/types';

const PILL_STYLES: Record<Confidence, string | null> = {
  measured:   null,
  calculated: 'bg-stone-100 text-stone-700 border-stone-300',
  estimated:  'bg-amber-100 text-amber-800 border-amber-300',
  inferred:   'bg-amber-100 text-amber-800 border-amber-300',
  unknown:    null,
};

export type ConfidencePillSize = 'xs' | 'sm';

/**
 * Render a Confidence pill, or null if the confidence level is one that doesn't
 * surface a pill (measured / unknown / undefined). Caller controls placement.
 */
export function ConfidencePill({ conf, size = 'sm' }: { conf: Confidence | undefined; size?: ConfidencePillSize }) {
  if (!conf) return null;
  const className = PILL_STYLES[conf];
  if (!className) return null;
  const sizeClass = size === 'xs'
    ? 'text-[8px] px-1 py-0 font-semibold'
    : 'text-[9px] px-1.5 py-0.5 font-semibold';
  return (
    <span className={`inline-block rounded font-sans uppercase tracking-wide border whitespace-nowrap ${sizeClass} ${className}`}>
      {conf}
    </span>
  );
}
