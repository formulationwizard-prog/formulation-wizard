// ============================================================
// SERVING SIZE INPUT VALIDATION HELPER
// ------------------------------------------------------------
// Round 11 Phase 2 Step 2 (2026-05-15) — Finding #26.
//
// Validates raw string input from the Serving Size <input> control
// at app/workspace/page.tsx (Serving & Package Size section). Returns
// a numeric value clamped to [min, max] with a fallback for
// unparseable input.
//
// EXTRACTED to a pure helper so the validation logic is unit-testable
// (vitest at lib/__tests__/servingSize.test.ts) and so the JSX call
// site stays a one-liner. Prior pre-Round-11 logic lived inline in the
// onChange handler at page.tsx:3555 and lacked an explicit max cap +
// declarative `min`/`max`/`step` attributes on the input element.
//
// FINDING #26 BEHAVIOR REQUIREMENTS (per Phase 2 directive):
//   • Decimal entries accepted (1.5, 2.5, 0.5, etc.)
//   • Sub-1 entries accepted by default (above min)
//   • Maximum cap enforced (default 100; configurable)
//   • Minimum cap enforced (default 0.1; configurable)
//   • Unparseable input falls back to a configurable default (30 by
//     default — matches the pre-Round-11 inline fallback)
//   • Arrow-button increment behavior is governed by the input
//     element's declarative `step` + `max` attributes (set in JSX),
//     not by this helper. Helper handles the parsed-value validation
//     pathway only.
// ============================================================

export interface ServingSizeBounds {
  /** Minimum allowed value (inclusive). Default 0 — Round 11 Phase 3
   *  (2026-05-17): pre-A.5-followup default was 0.1, matching F&B-era
   *  no-zero-allowed assumption. New default allows empty/zero state
   *  (fresh formulation, operator has not yet entered a value). */
  min?: number;
  /** Maximum allowed value (inclusive). Default 100. */
  max?: number;
  /** Value to return when input is unparseable (NaN). Default 0 —
   *  Round 11 Phase 3 (2026-05-17): pre-A.5-followup default was 30
   *  (sensible F&B default). New default returns 0 so unparseable
   *  inputs map to the fresh empty state rather than auto-filling
   *  a guess. Operator enters real value rather than overriding a
   *  number that was never theirs. */
  fallback?: number;
}

/**
 * Validate a raw string input from the Serving Size control.
 *
 * Pipeline:
 *   1. parseFloat → numeric value or NaN
 *   2. NaN → return fallback
 *   3. Otherwise: clamp to [min, max]
 *
 * Pure function — no side effects. Same input always produces the
 * same output. Caller (the onChange handler in page.tsx) consumes
 * the returned number directly via setServingSize.
 */
export function validateServingSizeInput(
  rawInput: string,
  bounds: ServingSizeBounds = {}
): number {
  const min = bounds.min ?? 0;
  const max = bounds.max ?? 100;
  const fallback = bounds.fallback ?? 0;

  const parsed = parseFloat(rawInput);
  if (Number.isNaN(parsed)) return fallback;

  // Clamp to [min, max]. Infinity gets clamped to max via this same step.
  if (parsed < min) return min;
  if (parsed > max) return max;
  return parsed;
}
