// ============================================================
// HARD-STOP ARCHITECTURAL PRIMITIVE
// ------------------------------------------------------------
// Refuse-to-act gates across the workspace share a load-bearing
// shape: when input fails the gate, the function's result type
// carries a refusal branch rather than silently emitting a
// plausible-but-wrong determination. Callers MUST narrow on the
// `hardStop` discriminator before consuming the cleared branch.
//
// Prior art (the architectural models every new gate mirrors):
//
//   • classifyFormulation() — lib/foodScience.ts:831 — refuses
//     to classify when verified-mass coverage < 80% or any single
//     unverified ingredient exceeds 10% of total mass. The
//     canonical 5-part stewardship docblock at lib/foodScience.ts
//     :785-829 documents the (a)-(e) gate-philosophy structure
//     that every refusal-state docblock should follow.
//
//   • summarizeFindings() — lib/supplementSafetyLimits.ts:802 —
//     returns `hardStop: boolean` derived from banned/critical/
//     warning finding counts on the supplement-safety side.
//
// Round 10's refuse-to-export gate (Bucket A chemical-safety,
// directive Section 3d) and Round 11's PA-review field-level
// authority gate both extend this pattern. Mirror the closest
// existing implementation's shape; do not invent new shapes.
//
// ============================================================
// === DO NOT WEAKEN ANY HARD-STOP GATE ===
// ============================================================
//
// Hard-stops exist because mis-classification, mis-enforcement,
// or silent emission of wrong determinations has already produced
// real regulatory-safety bugs in this codebase. The 2026-04-30
// audit caught false "Acidified Food" labels on un-acidified raw
// vegetables and false "Shelf-Stable Dry" labels on high-water
// raw produce (full audit citation at lib/foodScience.ts:813-820).
//
// Changes that weaken a hard-stop — lowering thresholds, adding
// bypasses, making refusal optional, or relaxing what the gate
// accepts as "verified" — are regulatory-safety regressions
// regardless of intent. Before changing any gate threshold,
// semantic, or output shape: read the gate's stewardship docblock
// end-to-end, consult an FDA-recognized Process Authority, and
// surface the change explicitly in the PR description for operator
// approval. Do not restore the conditions that produced past bugs.
// ============================================================

/**
 * Refusal-state for hard-stop gates.
 *
 * Gate functions return a result whose union includes a HardStop
 * branch. The `hardStop` field is the load-bearing discriminator;
 * narrow on it (e.g. via `isHardStop`) before treating the result
 * as cleared. Gates compose this shape into their own result type
 * — see Section 3d's Bucket A enforcement gate for the canonical
 * Round 10 example.
 */
export interface HardStop {
  /** Discriminator. Always true on the refusal branch. */
  hardStop: true;
  /** Identifier for which gate fired — e.g. 'classify-formulation', 'bucket-a-compliance', 'pa-field-authority'. */
  source: string;
  /** Plain-English user-facing explanation rendered in the refusal UI. */
  reason: string;
  /** Concrete items that caused the refusal — enables UI to render what failed without re-running the gate. */
  evidence: HardStopEvidence[];
}

/** A single evidence item explaining why a hard-stop gate fired. */
export interface HardStopEvidence {
  /** Stable identifier for the item — ingredient name, field key, etc. */
  subject: string;
  /** Plain-English description of what's wrong with this item. */
  detail: string;
  /** Regulatory or internal citation when applicable. */
  citation?: string;
}

/**
 * Type guard narrowing a discriminated result type to its HardStop branch.
 *
 * Usage:
 *
 *   const result = checkBucketA(formulation);
 *   if (isHardStop(result)) {
 *     return renderRefusal(result);
 *   }
 *   // result is the cleared branch
 */
export function isHardStop<T extends { hardStop: boolean }>(
  result: T
): result is T & { hardStop: true } {
  return result.hardStop === true;
}
