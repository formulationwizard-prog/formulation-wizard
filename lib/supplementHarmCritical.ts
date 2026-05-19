// ============================================================
// HARM-CRITICAL DIFFERENCE PREDICATE
// ------------------------------------------------------------
// Wave 1.5e (2026-05-18) — pure predicates used by the bulk-paste
// parser's cross-entry semantic-equivalence check to decide whether
// two catalog entries differ in harm-critical attributes that the
// operator MUST disambiguate (not silently first-match-win).
//
// Predicate composition mirrors the Wizard's three-category structure
// at directive sign-off:
//
//   1. Allergen profile differential — any FALCPA Big 9 allergen
//      present in one variant but not the other. Drives the PC and
//      Lecithin Wave 1.5e launch-blocking cases (silent allergen
//      substitution = undeclared Big-9 allergen = recall-class
//      regulatory exposure).
//
//   2. Identity-test attestation differential — Wave 2+ scope. When
//      catalog entries grow per-ingredient identity-test-method
//      requirements (botanical adulteration class, mineral-isotope
//      class, etc.), differing requirements mean operator must verify
//      they have the right COA discipline for the variant they
//      selected. Wired in as a forward-compatibility hook; returns
//      false until catalog data lands.
//
//   3. Regulatory-status differential — NDI / GRAS / pre-DSHEA /
//      pending status differs. E.g., Cognizin (NDI-notified) vs.
//      generic citicoline (status unknown) — affects whether the
//      operator must file an NDI notification before shipping.
//
// Discipline note (two-state Wave 1.5d):
//   regulatoryStatusDiffers fires only when BOTH entries have
//   explicit values that differ. One explicit + one undefined is NOT
//   a regulatory difference (it's a data-completeness gap that the
//   harm-critical-floor handles separately via the verbose
//   UNDOCUMENTED advisory in supplementNDI.ts). Same epistemic lens
//   as the NDI two-state discipline: DOCUMENTED-vs-UNDOCUMENTED gap
//   ≠ documented status differential.
// ============================================================

import type { IndustrialIngredient } from '../types';

/**
 * Does the allergen profile differ between two entries? Set comparison
 * after lowercasing — order-insensitive. Returns true when either entry
 * declares an allergen the other does not.
 */
export function allergenProfileDiffers(
  a: IndustrialIngredient,
  b: IndustrialIngredient,
): boolean {
  const setA = new Set((a.allergens ?? []).map(s => s.toLowerCase()));
  const setB = new Set((b.allergens ?? []).map(s => s.toLowerCase()));
  if (setA.size !== setB.size) return true;
  for (const allergen of setA) {
    if (!setB.has(allergen)) return true;
  }
  return false;
}

/**
 * Does identity-test attestation requirement differ between two entries?
 * Forward-compatibility hook for Wave 2+ when catalog entries grow
 * per-ingredient identity-test-method specificity. Currently the catalog
 * has no field that tracks this; returns false until data lands.
 *
 * When the schema extends (likely a structured field like
 * `identityTestRequired: { method: 'HPTLC' | 'DNA-barcoding' | ... }`),
 * this predicate updates to compare those fields. Two entries with
 * different identity-test methods would surface as harm-critical
 * differential (operator picks wrong variant → wrong COA discipline →
 * §B3 attestation gate refuses at export time).
 */
export function identityTestRequirementDiffers(
  // Args intentionally unused — forward-compatibility hook
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _a: IndustrialIngredient,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _b: IndustrialIngredient,
): boolean {
  return false;
}

/**
 * Does the regulatory-status field differ between two entries? Fires
 * only when BOTH entries have explicit values that differ. One explicit
 * + one undefined returns FALSE (data-completeness gap, not regulatory
 * differential — handled by NDI two-state discipline elsewhere).
 *
 * Two undefined returns FALSE (no comparable claim).
 */
export function regulatoryStatusDiffers(
  a: IndustrialIngredient,
  b: IndustrialIngredient,
): boolean {
  if (a.regulatoryStatus === undefined || b.regulatoryStatus === undefined) {
    return false;
  }
  return a.regulatoryStatus !== b.regulatoryStatus;
}

/**
 * Composed predicate: do two entries differ in any harm-critical
 * attribute? Returns true if ANY of the three sub-predicates fires.
 *
 * Use in the bulk-paste parser's cross-entry semantic check. When the
 * parser would otherwise return a confident match (Tier 1 synonym or
 * Tier 2 stripped-name single-match), if a harm-critically-different
 * sibling variant exists in the catalog that the operator paste could
 * also legitimately satisfy, escalate to Tier 3 disambiguation.
 *
 * The point: silent first-match-wins is unsafe when sibling variants
 * differ in allergen profile, regulatory status, or (forward-compat)
 * identity-test requirement. Surface the choice to the operator.
 */
export function harmCriticalDifferenceExists(
  a: IndustrialIngredient,
  b: IndustrialIngredient,
): boolean {
  return (
    allergenProfileDiffers(a, b) ||
    identityTestRequirementDiffers(a, b) ||
    regulatoryStatusDiffers(a, b)
  );
}
