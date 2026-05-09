// ============================================================
// ConfidencePill — shared rendering primitive for the Confidence taxonomy
// ------------------------------------------------------------
// Color language (per 2026-05-07 directive Round 1, updated Round 8 Item 3):
//   • measured   — no pill (absence = trust the number)
//   • calculated — stone pill (math sound, may inherit from less-trusted inputs)
//   • estimated  — amber pill (uncertain, verify before use)
//   • inferred   — amber pill (same color as estimated; pill text differentiates)
//   • unknown    — neutral-gray pill (Round 8 Item 3): explicit "we don't know
//                  this value" treatment so users can distinguish a missing
//                  data point from a surface that simply has no data here.
//                  The pill caller still renders the em-dash (or absent value)
//                  alongside the pill — the pill labels the absence, it does
//                  not replace the value rendering.
//
// Note: Class 1a confidence pills use stone/amber/neutral-gray. Class 3 "we require"
// buyer-requirement pills use SLATE (slate-100/slate-700) — visually distinct from this
// Class 1a vocabulary.
//
// See memory/project_honest_estimate_reframe.md and feedback_three_class_value_taxonomy.md.
// ============================================================

import type { Confidence } from '@/types';

const PILL_STYLES: Record<Confidence, string | null> = {
  measured:   null,
  calculated: 'bg-stone-100 text-stone-700 border-stone-300',
  estimated:  'bg-amber-100 text-amber-800 border-amber-300',
  inferred:   'bg-amber-100 text-amber-800 border-amber-300',
  // Round 8 Item 3: explicit neutral-gray treatment for UNKNOWN. Distinct from
  // measured (no pill) and from amber (estimated/inferred have *some* basis;
  // unknown has none). Distinct from slate Class 3 "we require" pills.
  unknown:    'bg-gray-100 text-gray-600 border-gray-300',
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
