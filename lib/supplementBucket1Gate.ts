// ============================================================
// SUPPLEMENT BUCKET 1 COMPOSITION GATE (REFUSE-TO-EXPORT)
// ------------------------------------------------------------
// Round 11 Phase 1 Step 4 (2026-05-15). Composition surface for
// the 5 harm-critical floor items (Companion Spec §B1–B5) plus
// the §B11 keystone (Customer-COA + identity-test linkage,
// Bucket 1 subset). Mirrors the F&B-side architectural model at
// lib/bucketAGate.ts: a single function that composes individual
// item evaluators into a hard-stop result driving refuse-to-
// export at the supplement-mode export gate.
//
// SCAFFOLD STATE — this commit
// ------------------------------------------------------------
// Returns cleared. The shape and composition registry are in
// place; individual §B item evaluators wire in as their schemas,
// detectors, and enforcement logic land. Wiring sequence per
// the directive + docs/architecture/harm-critical-floor.md:
//
//   §B4 — disclaimer verbatim          : constants + test land
//                                         alongside this scaffold;
//                                         gate integration in a
//                                         follow-up that consumes
//                                         claim-count + rendered
//                                         disclaimer text.
//   §B1 — allergen master list         : pending wiring
//   §B2 — disease-claim hard stop      : pending wiring (detector
//                                         exists; gate-level refusal
//                                         pending)
//   §B3 — identity-test attestation    : pending wiring (schema
//                                         additions required first)
//   §B5 — net quantity unit conversion : pending wiring (helper
//                                         needs to be authored)
//   §B11 — COA + identity-test linkage : pending wiring (Bucket 1
//                                         subset only — allergen
//                                         disclosure + heavy-metal
//                                         preservation + identity-
//                                         test record linkage)
//
// Architectural mirror — see lib/bucketAGate.ts evaluateBucketA()
// for the F&B-side analogue. Return shape uses the HardStop
// primitive at lib/hardStop.ts for consistent narrowing across
// all gates in the codebase (classifyFormulation, evaluateBucketA,
// and this gate).
//
// ============================================================
// === DO NOT WEAKEN THIS GATE ===
// ============================================================
//
// This gate exists to prevent silent shipment of harm-critical
// floor violations to customer-zero's production. Per the
// Companion Spec at docs/regulatory/phase-1-companion-compliance-
// spec.md §B0: "Items where a tool error could slip past a busy
// PA reviewer and cause consumer harm or unrecoverable regulatory
// violation. The code must be tested to 100% correctness on these.
// No exceptions."
//
// Changes that weaken the gate — lowering thresholds, adding
// bypasses, making refusal optional, accepting partially-wired
// item evaluators as cleared — are regulatory-safety regressions
// regardless of intent. Before changing any gate threshold,
// semantic, or output shape: read this docblock end-to-end,
// consult the Companion Spec, and surface the change explicitly
// in the PR description for operator approval.
// ============================================================

import type { HardStop } from './hardStop';

/**
 * Parameters consumed by the gate. Empty at scaffold state — fills
 * in as individual §B item evaluators wire up. Per-item evaluator
 * inputs (rendered disclaimer text, allergen verification status,
 * identity-test records, etc.) land here.
 */
export interface SupplementBucket1GateParams {
  // Empty placeholder. Item evaluators will extend this interface
  // (or supersede it with a more detailed params shape) as they
  // wire in.
}

/**
 * Discriminated result type. Mirrors the F&B-side
 * `BucketAGateResult` shape at lib/bucketAGate.ts.
 *
 *   • `hardStop: true`  — composes HardStop primitive plus source
 *                          marker. Caller renders refuse-to-export
 *                          UI and blocks PDS / PA-review packet
 *                          generation.
 *   • `hardStop: false` — gate cleared. `composedItems` enumerates
 *                          the §B items that were checked, for
 *                          audit-trail visibility in the cleared
 *                          state.
 */
export type SupplementBucket1GateResult =
  | (HardStop & { source: 'supplement-bucket-1' })
  | {
      hardStop: false;
      source: 'supplement-bucket-1';
      /** Identifiers of §B items composed into this gate evaluation. */
      composedItems: readonly string[];
    };

/**
 * §B item composition registry. Updated as each item wires in.
 * Empty at scaffold state.
 */
const COMPOSED_ITEMS: readonly string[] = [
  // No items composed yet. As wiring lands, each item adds its
  // identifier here (e.g., 'b4-disclaimer-verbatim',
  // 'b1-allergen-detection', etc.) and its evaluator below.
];

/**
 * Evaluate the supplement Bucket 1 floor against the supplied
 * params. Returns cleared at scaffold state — as item evaluators
 * wire in, their refusal-state outputs compose into the gate's
 * HardStop result.
 *
 * Pure function — no side effects. Same params input always
 * produces the same gate output. Caller is responsible for
 * re-evaluating when relevant formulation state changes.
 */
export function evaluateSupplementBucket1Gate(
  _params: SupplementBucket1GateParams = {}
): SupplementBucket1GateResult {
  // Scaffold: no items composed; gate clears unconditionally.
  // As §B item evaluators wire in, each contributes a refusal
  // check that can flip the gate to its hard-stop branch.
  return {
    hardStop: false,
    source: 'supplement-bucket-1',
    composedItems: COMPOSED_ITEMS,
  };
}
