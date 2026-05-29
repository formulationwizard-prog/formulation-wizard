// ============================================================
// Elemental mineral fractions — SINGLE SOURCE OF TRUTH.
// ------------------------------------------------------------
// The fraction of a mineral salt/chelate's mass that is the elemental mineral
// (e.g. magnesium glycinate is ~14% elemental Mg; magnesium oxide ~60%). This
// value is FORM-SPECIFIC and is used in two places that MUST agree:
//   • the Supplement Facts %DV math (lib/supplementLabeling.ts)
//   • the Tolerable-Upper-Limit safety check (lib/supplementSafetyLimits.ts)
//
// Before this module they each carried their own copy and DIVERGED: labeling
// used form-specific factors while the UL table used one blended factor per
// mineral (Mg 0.25 vs the correct glycinate 0.14). Result: the label said
// "168 mg Mg" while the UL panel said "300 mg Mg" for the same ingredient —
// a same-compound contradiction that also mis-fired the harm-critical UL gate
// (false "approaching UL" on glycinate; under-warning on oxide). Operator-
// found 2026-05-28. Routing both subsystems through this resolver makes the
// two physically incapable of disagreeing.
//
// Keyword-matched longest-first so a specific form ("magnesium oxide") wins
// over the generic ("magnesium"). Values mirror the form-specific factors in
// the Supplement Facts DV table (the chemically-correct source).
// ============================================================

const FORM_FACTORS: ReadonlyArray<readonly [string, number]> = [
  // Magnesium
  ['magnesium oxide', 0.60],
  ['magnesium bisglycinate', 0.14],
  ['magnesium glycinate', 0.14],
  ['magnesium citrate', 0.16],
  ['magnesium', 0.16],
  // Calcium
  ['calcium carbonate', 0.40],
  ['calcium citrate', 0.21],
  ['calcium', 0.25],
  // Iron
  ['ferrous sulfate', 0.30],
  ['ferrous bisglycinate', 0.20],
  ['iron bisglycinate', 0.20],
  ['ferrochel', 0.20],
  ['ferrous', 0.20],
  ['iron', 0.20],
  // Zinc
  ['zinc picolinate', 0.20],
  ['zinc gluconate', 0.14],
  ['zinc', 0.20],
  // Iodine
  ['potassium iodide', 0.76],
  ['iodine', 0.76],
  ['kelp', 0.76],
  // Selenium
  ['selenomethionine', 0.40],
  ['selenium', 0.40],
  // Copper
  ['copper gluconate', 0.14],
  ['copper', 0.20],
  // Manganese
  ['manganese', 0.32],
  // Chromium
  ['chromium picolinate', 0.12],
  ['chromium', 0.20],
  // Sodium / Potassium
  ['sodium chloride', 0.40],
  ['sodium', 0.40],
  ['potassium chloride', 0.38],
  ['potassium citrate', 0.38],
  ['potassium', 0.38],
];

// Longest keyword first so specific forms win over generic fallbacks.
const SORTED = [...FORM_FACTORS].sort((a, b) => b[0].length - a[0].length);

/**
 * Resolve the elemental-mineral mass fraction for an ingredient by name.
 * Returns undefined for non-minerals (or unmapped forms) so callers can fall
 * back to their own default (1.0 = treat full mass as active).
 */
export function resolveElementalFactor(ingredientName: string): number | undefined {
  const n = ingredientName.toLowerCase();
  for (const [keyword, factor] of SORTED) {
    if (n.includes(keyword)) return factor;
  }
  return undefined;
}
