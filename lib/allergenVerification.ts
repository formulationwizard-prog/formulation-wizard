// ============================================================
// ALLERGEN VERIFICATION STATUS (provenance-aware honesty layer)
// ------------------------------------------------------------
// The single source of truth for "is this ingredient's allergen profile
// COA-verified, a catalog default pending verification, or uncovered?"
//
// CRITICAL LAYER BOUNDARY — this does NOT touch the regulated "Contains:"
// statement. That statement (lib/supplementAllergen.ts generateContainsStatement,
// FDA-format per 21 CFR 101.36(b)(1)(i)(B)) stays BYTE-FAITHFUL: if the catalog
// flags Milk, the statement declares "Contains: Milk" conservatively and is never
// downgraded or mutated by verification status. This accessor feeds the SEPARATE
// honesty layers:
//   • workspace chrome — an operator-facing annotation ("catalog default — confirm
//     with supplier COA before label print"), and
//   • the FVR / export packet — a reviewer-facing flag.
//
// TWO DOCTRINES (harm-critical floor, both directions):
//   1. NEVER DROP A WARNING — downgrade certainty only. We report verification
//      status; we never erase the regulated declaration. Under-warning is
//      unrecoverable; over-warning is recoverable.
//   2. NEVER ASSERT "FREE" WITHOUT POSITIVE VERIFICATION — an affirmative
//      "Contains no major allergens" / "Free of X" claim requires COA-confirmed
//      allergen provenance (kind 'coa'). Absence of data is 'unverified', not
//      'allergen-free'. (isCoaVerifiedAllergens gates that claim.)
//
// Today every top-100 provenance entry is kind 'unknown' (auto-gen 2026-06-05,
// pending COA), so 'verified' is correctly UNREACHABLE until a COA moves an entry
// unknown → coa. That is the flywheel: the affirmative free-of claim is EARNED by
// verification, and the corpus of COA-verified entries is the moat.
// ============================================================

import { PROVENANCE_BY_NAME } from './data/supplementProvenance';
import type { Provenance } from '../types';

export type AllergenVerification =
  /** Uncovered entry (the ~300 outside the top-100 provenance run). Inline catalog
   *  allergens are the fallback; honestly flagged as not-yet-covered. */
  | { status: 'no-provenance' }
  /** Provenance exists but kind 'unknown' — the inline allergens are a CATALOG
   *  DEFAULT, pending supplier COA. The regulated declaration still stands; this
   *  drives the "confirm with COA" chrome annotation. */
  | { status: 'unverified'; reason: string }
  /** A real source backs the allergen profile (coa / supplier-spec / label-
   *  declaration / …). `kind: 'coa'` is the gold standard that can gate an
   *  affirmative free-of claim (see isCoaVerifiedAllergens). */
  | { status: 'verified'; kind: Provenance['kind']; source: Provenance };

/** Pure classifier — dependency-injected so every branch is testable even while
 *  all real entries are 'unknown'. */
export function classifyAllergenProvenance(prov: Provenance | undefined): AllergenVerification {
  if (!prov) return { status: 'no-provenance' };
  if (prov.kind === 'unknown') return { status: 'unverified', reason: prov.reason ?? 'pending supplier COA' };
  return { status: 'verified', kind: prov.kind, source: prov };
}

/** Allergen verification status for a catalog ingredient by name. */
export function resolveAllergenVerification(name: string): AllergenVerification {
  return classifyAllergenProvenance(PROVENANCE_BY_NAME[name]?.['allergens']);
}

/** Formula-level: ingredient names that carry an allergen declaration which is NOT
 *  COA-verified (kind 'unknown' catalog-default, or uncovered/no-provenance). This is
 *  the list both the workspace-chrome "confirm with COA" annotation (Unit B) and the
 *  FVR reviewer flag (Unit C) surface — single source so chrome and packet agree.
 *  Never drops a warning: it reports which declarations are unverified, never removes them. */
export function unverifiedAllergenSources(
  ingredients: { name: string; allergens?: readonly string[] }[],
): string[] {
  return ingredients
    .filter(i => (i.allergens?.length ?? 0) > 0 && resolveAllergenVerification(i.name).status !== 'verified')
    .map(i => i.name);
}

/** COA-verified specifically — the gold standard required to gate an affirmative
 *  "Contains no major allergens" / "Free of X" claim. A vendor spec or label
 *  declaration is verified-with-source, but the affirmative FREE-OF claim requires
 *  lot-level COA (kind 'coa') confirming the allergen profile. Currently false for
 *  every entry (all 'unknown'); the free-of claim is unreachable until a COA lands. */
export function isCoaVerifiedAllergens(name: string): boolean {
  return PROVENANCE_BY_NAME[name]?.['allergens']?.kind === 'coa';
}

/**
 * DOCTRINE 2 ENFORCEMENT — may a formula make the affirmative "Contains no major
 * allergens" / allergen-free claim? TRUE only when BOTH hold:
 *   (a) NO FALCPA major allergen is present (the caller passes this — derived from
 *       the combined inline + name-detected allergen statement), AND
 *   (b) EVERY ingredient's allergen profile is COA-verified (kind 'coa') — POSITIVE
 *       confirmation of absence, not mere absence of data.
 *
 * Absence of a Contains: statement is NOT a free-of claim; only positive COA across
 * every ingredient earns it. Returns false for every real formula today (all entries
 * 'unknown' → no ingredient is COA-verified) — the claim is EARNED as COAs land (the
 * flywheel). The affirmative RENDER is deferred until a COA-verified-absent entry
 * exists to test it against; this helper is the gate that render MUST call.
 *
 * @param isVerified injected for testability (default: the real isCoaVerifiedAllergens).
 */
export function canClaimAllergenFree(
  hasPresentMajorAllergen: boolean,
  ingredients: { name: string }[],
  isVerified: (name: string) => boolean = isCoaVerifiedAllergens,
): boolean {
  if (hasPresentMajorAllergen) return false;          // an allergen is present → never free-of
  if (ingredients.length === 0) return false;         // empty formula → nothing to claim
  return ingredients.every(i => isVerified(i.name));  // every ingredient COA-verified → earned
}
