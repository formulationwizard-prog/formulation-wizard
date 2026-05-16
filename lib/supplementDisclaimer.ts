// ============================================================
// §B4 — MANDATORY DSHEA DISCLAIMER (LOCKED TEXT)
// ------------------------------------------------------------
// Round 11 Phase 1 Step 4 (2026-05-15). Locked-constant pattern
// for the mandatory DSHEA disclaimer required on every supplement
// label carrying a structure/function claim. Mirrors the F&B-side
// architectural model at lib/foodScience.ts:61 REGULATORY_DISCLAIMER
// + lib/__tests__/section-4-regulatory-disclaimer.test.ts (frozen
// snapshot enforcement) per the Companion Spec §B4 harm-critical
// floor item.
//
// Per the Companion Spec at
// docs/regulatory/phase-1-companion-compliance-spec.md §B4:
//
//   "The mandatory disclaimer must be the EXACT verbatim text.
//    A tool that auto-generates 'almost the right' disclaimer is
//    creating misbranded products. A PA reviewing the label may
//    not catch a single-word difference. Hard 100%."
//
// Two forms are defined per CFR — singular for one claim and
// plural for two or more claims. The selector function picks the
// correct form; zero claims returns the empty string (no
// disclaimer required when no structure/function claim is made).
//
// SCOPE — what this module IS
// ------------------------------------------------------------
//   • Immutable constants holding the CFR-verbatim text.
//   • A claim-count selector returning the correct form.
//   • Frozen-snapshot test at lib/__tests__/supplement-disclaimer
//     .test.ts that fails if the constants drift from CFR text.
//
// SCOPE — what this module is NOT (yet)
// ------------------------------------------------------------
//   • Display-rule validation (type size ≥ 1/16 inch, bold,
//     adjacency to claim, per-panel coverage). These belong in the
//     PDS rendering pipeline (Round 11 Track C, Phase 3 — pending).
//   • Integration with the existing buildDisclaimers() function at
//     lib/supplementClaims.ts:466. That function currently emits
//     the plural form as an inline string regardless of claim count.
//     A follow-up migration replaces the inline string with this
//     module's selectSupplementDisclaimer() and refactors the
//     function's signature to accept claim count.
//   • Full Bucket 1 gate composition at lib/supplementBucket1Gate.ts.
//     The gate registers this module's identifier as a composed item,
//     but the actual refusal check (e.g., "disclaimer rendered text
//     byte-matches the selected form when claims present") wires in
//     when the rendered-disclaimer string becomes available at the
//     export gate boundary.
//
// ============================================================
// === LOCKED TEXT — DO NOT EDIT WITHOUT THE CHANGE-CONTROL PROCESS ===
// ============================================================
//
// The two constants below carry the verbatim CFR text. If the
// frozen-snapshot test at lib/__tests__/supplement-disclaimer.test.ts
// fails, the constant was modified. Two valid responses:
//
//   (a) Revert the constant change. The previous wording is the
//       legal safety net — review commit history for prior author +
//       rationale before deciding the change is intentional.
//
//   (b) If the change is intentional and process-approved, update
//       the snapshot to match in the SAME commit, AND ensure the PR
//       description names:
//         - The FDA-recognized Process Authority who reviewed the
//           new wording (or the CFR amendment justifying it)
//         - The operator approving the change
//         - The rationale (what policy shift or CFR change the new
//           wording reflects)
//       Also update docs/architecture/harm-critical-floor.md §B4
//       and docs/regulatory/phase-1-companion-compliance-spec.md §B4
//       if the change reflects a policy shift, not just typographic
//       correction.
//
// Updating the snapshot WITHOUT the PR-description trail is a
// Bucket 1 discipline violation. Reviewers should reject the PR
// until the trail is present.
// ============================================================

/**
 * Singular form — for labels with exactly ONE structure/function
 * claim. Per 21 CFR 101.93(c)(1) verbatim.
 */
export const SUPPLEMENT_DISCLAIMER_SINGULAR =
  'This statement has not been evaluated by the Food and Drug Administration. This product is not intended to diagnose, treat, cure, or prevent any disease.';

/**
 * Plural form — for labels with TWO OR MORE structure/function
 * claims. Per 21 CFR 101.93(c)(2) verbatim.
 */
export const SUPPLEMENT_DISCLAIMER_PLURAL =
  'These statements have not been evaluated by the Food and Drug Administration. This product is not intended to diagnose, treat, cure, or prevent any disease.';

/**
 * Select the correct DSHEA disclaimer form for the given claim
 * count.
 *
 *   • 0 claims → empty string (no disclaimer required)
 *   • 1 claim  → SUPPLEMENT_DISCLAIMER_SINGULAR
 *   • 2+ claims → SUPPLEMENT_DISCLAIMER_PLURAL
 *
 * The selector enforces the singular-vs-plural choice that CFR
 * mandates. Callers should not concatenate or interpolate the
 * returned string — emit it verbatim onto the label.
 */
export function selectSupplementDisclaimer(claimCount: number): string {
  if (claimCount <= 0) return '';
  if (claimCount === 1) return SUPPLEMENT_DISCLAIMER_SINGULAR;
  return SUPPLEMENT_DISCLAIMER_PLURAL;
}

/**
 * Composition-registry identifier for the §B4 disclaimer item.
 * Imported by lib/supplementBucket1Gate.ts to register this
 * module as a composed item in the gate. Stable string — do not
 * rename without updating the gate's COMPOSED_ITEMS registry.
 */
export const B4_DISCLAIMER_ITEM_ID = 'b4-disclaimer-verbatim' as const;
