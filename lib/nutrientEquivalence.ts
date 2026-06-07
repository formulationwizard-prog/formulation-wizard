// ============================================================
// NUTRIENT EQUIVALENCE FACTORS — source form → DV equivalence basis
// ------------------------------------------------------------
// CFR-CANONICAL conversions from 21 CFR 101.9(c)(8)(iv) footnotes (NOT supplier-
// variable — different risk class from elementalFactors, which are COA-anchored).
// Verified 2026-06-07 against primary eCFR — see docs/audits/dv-table-verification-2026-06-07.md.
//
// WHY THIS EXISTS: a DV is expressed in an equivalence basis (RAE/DFE/NE/
// α-tocopherol). When an operator enters a SOURCE FORM (β-carotene, folic acid,
// tryptophan, all-rac-α-tocopherol), its mass must be converted to that basis or
// the %DV is wrong — e.g. 900 mcg supplemental β-carotene is 450 mcg RAE (50% DV),
// not 900 (100%). Returns the multiplier: active_mass_in_basis = mass × factor.
//
// Footnote ratios (101.9(c)(8)(iv)):
//   fn3 RAE: 1 RAE = 1 retinol = 2 supplemental β-carotene = 12 dietary β-carotene
//            = 24 α-carotene/β-cryptoxanthin  →  supplemental β-carotene ÷2 = ×0.5
//   fn4 α-tocopherol: 1 label = 1 RRR (natural d-) = 2 all-rac (synthetic dl-) → all-rac ×0.5
//   fn5 NE: 1 NE = 1 niacin = 60 tryptophan  →  tryptophan ÷60 = ×0.0166667
//   fn7 DFE: 1 DFE = 0.6 folic acid  →  folic acid ×(1/0.6) = ×1.66667
//
// Default (named active already in the basis, or unrecognized source) → 1.0 (1:1),
// the conservative label assumption.
// ============================================================
import { keywordMatch } from './keywordMatch';
import type { DVBasis } from './supplementLabeling';

interface EquivRule { match: string; factor: number; note: string }

const RULES: Record<DVBasis, EquivRule[]> = {
  RAE: [
    { match: 'beta-carotene', factor: 0.5, note: 'supplemental β-carotene ÷2 (fn3)' },
    { match: 'beta carotene', factor: 0.5, note: 'supplemental β-carotene ÷2 (fn3)' },
    { match: 'alpha-carotene', factor: 1 / 24, note: 'α-carotene ÷24 (fn3)' },
    { match: 'beta-cryptoxanthin', factor: 1 / 24, note: 'β-cryptoxanthin ÷24 (fn3)' },
    // retinol / retinyl palmitate/acetate → 1:1 (handled by default)
  ],
  DFE: [
    { match: 'folic acid', factor: 1 / 0.6, note: 'folic acid ×1.667 → DFE (fn7)' },
    // methylfolate / 5-MTHF / food folate → 1:1 (default)
  ],
  NE: [
    { match: 'tryptophan', factor: 1 / 60, note: 'tryptophan ÷60 → NE (fn5)' },
    // niacin / niacinamide / nicotinamide → 1:1 (default)
  ],
  'alpha-tocopherol': [
    { match: 'all-rac', factor: 0.5, note: 'all-rac (synthetic dl-) ÷2 (fn4)' },
    { match: 'dl-alpha-tocopher', factor: 0.5, note: 'dl-α-tocopherol (synthetic) ÷2 (fn4)' },
    { match: 'dl-alpha tocopher', factor: 0.5, note: 'dl-α-tocopherol (synthetic) ÷2 (fn4)' },
    // d-alpha / RRR / natural → 1:1 (default)
  ],
};

/** Multiplier to convert an entered source-form mass into the DV equivalence basis.
 *  Defaults to 1.0 (active already in basis, or source unrecognized). */
export function resolveEquivalenceFactor(ingredientName: string, basis: DVBasis): number {
  const n = ingredientName.toLowerCase();
  for (const rule of RULES[basis]) {
    if (keywordMatch(n, rule.match)) return rule.factor;
  }
  return 1.0;
}

/** The matched rule's note (for provenance/debugging), or null if default 1:1. */
export function equivalenceNote(ingredientName: string, basis: DVBasis): string | null {
  const n = ingredientName.toLowerCase();
  for (const rule of RULES[basis]) {
    if (keywordMatch(n, rule.match)) return rule.note;
  }
  return null;
}
