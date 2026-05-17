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
// COMPOSITION PATTERN
// ------------------------------------------------------------
// Each §B item exposes:
//   • A per-item gate evaluator returning HardStop | cleared
//     (e.g., evaluateDiseaseClaimGate at lib/supplementClaims.ts).
//   • A stable identifier constant (e.g., B2_DISEASE_CLAIM_ITEM_ID).
//   • An optional input on SupplementBucket1GateParams.
//
// The Bucket 1 gate calls each per-item evaluator with the
// corresponding params, aggregates evidence from each firing
// item, and returns a single composed HardStop with
// source: 'supplement-bucket-1'. Caller renders refuse-to-export
// UI from the unified evidence array.
//
// Pre-computed inputs: callers run detectors (analyzeDraftClaim,
// detectAllergens, etc.) upstream and pass the resulting flag
// arrays into the gate. This keeps detector internals decoupled
// from gate composition — same boundary discipline as
// evaluateBucketA(ComplianceFinding[]) on the F&B side.
//
// WIRING STATUS
// ------------------------------------------------------------
//   §B4 — disclaimer verbatim          : constants + frozen-snapshot
//                                         test landed (lib/supplementDisclaimer.ts
//                                         + lib/__tests__/supplement-
//                                         disclaimer.test.ts). Gate-level
//                                         refusal check (rendered-text
//                                         byte-match) wires when the
//                                         rendered-disclaimer string
//                                         becomes available at the
//                                         export-gate boundary.
//   §B2 — disease-claim hard stop      : COMPOSED (Phase 2 Step 4).
//                                         evaluateDiseaseClaimGate
//                                         composes DiseaseClaimFlag[]
//                                         into HardStop | cleared.
//   §B1 — allergen species-naming      : COMPOSED (Phase 2 Step 4).
//                                         evaluateAllergenGate refuses
//                                         when Tree Nuts/Fish/Shellfish
//                                         detected via generic term
//                                         without species name.
//   §B5 — net quantity unit conversion : COMPOSED (Phase 2 Step 4).
//                                         evaluateNetQuantityGate
//                                         refuses on missing declaration,
//                                         missing dual-unit, or ±2%
//                                         tolerance breach per CFR
//                                         101.105.
//   Review.currentState                : COMPOSED (Phase 2 Step 4).
//                                         evaluateReviewStateGate
//                                         refuses export when state
//                                         ∉ {approved, version_locked}.
//   §B3 — identity-test attestation    : pending wiring (schema
//                                         additions required first)
//   §B11 — COA + identity-test linkage : pending wiring (Bucket 1
//                                         subset only)
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
// item evaluators as cleared, demoting any §B item's hard-stop
// tier to advisory — are regulatory-safety regressions regardless
// of intent. Before changing any gate threshold, semantic, or
// output shape: read this docblock end-to-end, consult the
// Companion Spec, and surface the change explicitly in the PR
// description for operator approval.
// ============================================================

import type { HardStop, HardStopEvidence } from './hardStop';
import { B4_DISCLAIMER_ITEM_ID } from './supplementDisclaimer';
import {
  evaluateDiseaseClaimGate,
  B2_DISEASE_CLAIM_ITEM_ID,
  type DiseaseClaimFlag,
} from './supplementClaims';
import {
  evaluateAllergenGate,
  B1_ALLERGEN_ITEM_ID,
  type AllergenMatch,
} from './supplementAllergen';
import {
  evaluateNetQuantityGate,
  B5_NET_QUANTITY_ITEM_ID,
  type NetQuantityInput,
} from './netQuantity';
import {
  evaluateReviewStateGate,
  REVIEW_STATE_GATE_ITEM_ID,
} from './reviewState';
import type { ReviewState } from '../types';

/**
 * Parameters consumed by the gate. Each §B item contributes one
 * optional field carrying its pre-computed input (typically a
 * detector output array). The gate invokes each per-item evaluator
 * with the corresponding field and aggregates the results.
 *
 * Optional fields default to the empty / not-present interpretation:
 * a missing field is treated as "this item has no input to evaluate"
 * (gate clears for that item) rather than "this item failed."
 */
export interface SupplementBucket1GateParams {
  /**
   * Pre-computed disease-claim flags from analyzeDraftClaim() at
   * lib/supplementClaims.ts. Caller runs the detector over each
   * structure/function claim text and concatenates the resulting
   * arrays. §B2.
   *
   * Missing or empty array → §B2 contributes no hard-stop. Caution-
   * tier flags pass through without triggering refusal; only
   * `disease` and `drug-claim` tiers compose into Bucket 1 evidence.
   */
  diseaseClaimFlags?: readonly DiseaseClaimFlag[];

  /**
   * Pre-computed allergen matches from detectAllergensDetailed() at
   * lib/supplementAllergen.ts. Caller runs the detector over each
   * ingredient name (and other free-text allergen-bearing fields)
   * and concatenates the resulting arrays. §B1.
   *
   * Missing or empty array → §B1 contributes no hard-stop. Matches
   * with `requiresSpeciesNaming: true` and `species: undefined`
   * (generic 'tree nuts', 'fish', 'shellfish' terms) trigger refusal
   * per 21 CFR 101.36(b)(1)(i)(B) / FALCPA species-naming rule.
   */
  allergenMatches?: readonly AllergenMatch[];

  /**
   * Net quantity input for §B5 evaluation. Caller derives totalMassG
   * or totalVolumeMl from the workspace cascade and passes the
   * form discriminator + operator-declared net quantity per
   * lib/netQuantity.ts NetQuantityInput. §B5.
   *
   * Undefined → §B5 not evaluated at this composition layer (caller
   * has not yet provided net quantity context; e.g., draft formulation
   * before packaging is selected). Defined → gate enforces declaration
   * mandate, dual-unit requirement, and ±2% cross-validation tolerance
   * per 21 CFR 101.105.
   */
  netQuantityInput?: NetQuantityInput;

  /**
   * Current state of the most-recent PA Review against the
   * formulation version being evaluated. From Review.currentState
   * (types/index.ts). PA-review state machinery integration.
   *
   * Allowed for export: 'approved' | 'version_locked'.
   * Refuse-to-export: 'draft' | 'submitted' | 'rejected'.
   *
   * Undefined → no state context at composition layer; downstream
   * wiring (PDS export gate, Phase 3) handles the explicit
   * "no Review exists for this formulation version" check.
   */
  reviewState?: ReviewState;
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
 * Identifiers appear in the cleared-state `composedItems` array
 * so callers / auditors can verify which items were evaluated.
 */
const COMPOSED_ITEMS: readonly string[] = [
  // §B4 disclaimer — constants + frozen-snapshot test landed at
  // lib/supplementDisclaimer.ts + lib/__tests__/supplement-disclaimer
  // .test.ts. Registry-level integration is in place; the gate-level
  // refusal check (e.g., "rendered disclaimer text byte-matches the
  // selected form when claims present") wires when rendered-disclaimer
  // string becomes available at the export-gate boundary.
  B4_DISCLAIMER_ITEM_ID,
  // §B2 disease-claim hard stop — composed at Phase 2 Step 4.
  // evaluateDiseaseClaimGate consumes diseaseClaimFlags from params.
  B2_DISEASE_CLAIM_ITEM_ID,
  // §B1 allergen species-naming — composed at Phase 2 Step 4.
  // evaluateAllergenGate consumes allergenMatches from params.
  // Refuse-to-export on Tree Nuts/Fish/Shellfish without species name.
  B1_ALLERGEN_ITEM_ID,
  // §B5 net quantity declaration — composed at Phase 2 Step 4.
  // evaluateNetQuantityGate consumes netQuantityInput from params.
  // Refuse-to-export on missing declaration, missing dual-unit, or
  // ±2% tolerance breach per 21 CFR 101.105.
  B5_NET_QUANTITY_ITEM_ID,
  // PA-review state — composed at Phase 2 Step 4.
  // evaluateReviewStateGate consumes reviewState from params.
  // Refuse-to-export when reviewState ∉ {'approved', 'version_locked'}.
  REVIEW_STATE_GATE_ITEM_ID,
  // §B3 identity-test attestation — pending wiring (schema needed)
  // §B11 COA + identity-test linkage — pending wiring (Bucket 1 subset)
];

/**
 * Evaluate the supplement Bucket 1 floor against the supplied
 * params. Aggregates per-§B-item gate results into a single
 * composed result. When any item fires hard-stop, returns a
 * HardStop branch carrying combined evidence from all firing
 * items. When all items clear, returns the cleared branch with
 * the composedItems registry for audit-trail visibility.
 *
 * Pure function — no side effects. Same params input always
 * produces the same gate output. Caller is responsible for
 * re-evaluating when relevant formulation state changes.
 */
export function evaluateSupplementBucket1Gate(
  params: SupplementBucket1GateParams = {}
): SupplementBucket1GateResult {
  const evidence: HardStopEvidence[] = [];

  // §B2 — disease-claim hard-stop composition.
  const b2 = evaluateDiseaseClaimGate(params.diseaseClaimFlags ?? []);
  if (b2.hardStop) {
    evidence.push(...b2.evidence);
  }

  // §B1 — allergen species-naming composition. Refuse when a
  // species-required category (Tree Nuts, Fish, Shellfish) is
  // detected via generic term without species name.
  const b1 = evaluateAllergenGate({
    allergenMatches: params.allergenMatches ?? [],
  });
  if (b1.hardStop) {
    evidence.push(...b1.evidence);
  }

  // §B5 — net quantity declaration composition. Gate only evaluates
  // when netQuantityInput is explicitly provided; absence is treated
  // as "no net quantity context at composition layer" (e.g., draft
  // formulation pre-packaging selection). When present, gate enforces
  // CFR 101.105 declaration mandate + dual-unit + ±2% tolerance.
  if (params.netQuantityInput !== undefined) {
    const b5 = evaluateNetQuantityGate(params.netQuantityInput);
    if (b5.hardStop) {
      evidence.push(...b5.evidence);
    }
  }

  // PA-review state composition — refuse-to-export when reviewState
  // is provided and is not 'approved' or 'version_locked'.
  const reviewGate = evaluateReviewStateGate(params.reviewState);
  if (reviewGate.hardStop) {
    evidence.push(...reviewGate.evidence);
  }

  // Future §B item gates compose here in the same pattern:
  //   const bX = evaluateXxxGate(params.xxxInput ?? <default>);
  //   if (bX.hardStop) evidence.push(...bX.evidence);

  if (evidence.length === 0) {
    return {
      hardStop: false,
      source: 'supplement-bucket-1',
      composedItems: COMPOSED_ITEMS,
    };
  }

  const reason =
    evidence.length === 1
      ? `Refuse-to-export: Bucket 1 harm-critical floor violation detected.`
      : `Refuse-to-export: ${evidence.length} Bucket 1 harm-critical floor violations detected.`;

  return {
    hardStop: true,
    source: 'supplement-bucket-1',
    reason,
    evidence,
  };
}
