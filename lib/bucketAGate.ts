// ============================================================
// BUCKET A ENFORCEMENT GATE (REFUSE-TO-EXPORT)
// ------------------------------------------------------------
// Round 10 Section 3d (2026-05-15). Composes the hard-stop primitive
// (lib/hardStop.ts) with the input-confidence threshold (Decision #9)
// over ComplianceFinding[] produced by checkCompliance. Decides whether
// to refuse-to-export (hard-stop) or surface findings as PA-reviewable.
//
// Architectural model: this gate mirrors classifyFormulation's
// refuse-to-classify gate at lib/foodScience.ts:865 — same load-bearing
// comment discipline, same explicit refusal-state return shape, same
// "do not weaken" stewardship. The provenance gate refuses to classify
// when verified mass coverage is insufficient; this gate refuses to
// export when chemical-safety violations have MEASURED or CALCULATED
// input confidence.
//
// Two-tier gate logic per Decision #9:
//
//   (1) MEASURED or CALCULATED inputs + violated → hard-stop
//       Refuse-to-export. Customer-zero must address before proceeding.
//       Surfaces as Bucket A enforcement violation in UI.
//
//   (2) ESTIMATED or INFERRED inputs + violated → PA-reviewable finding
//       No hard-stop. Surface with confidence attribution. Customer-zero
//       sees "over according to estimates — Process Authority should
//       verify" rather than "refuse to ship."
//
//   (3) UNKNOWN inputs → insufficient-data pattern
//       Gate doesn't act. Existing classifyFormulation insufficient-data
//       behavior governs upstream.
//
// Why the threshold matters: most Round 10 catalog entries carry
// ESTIMATED confidence (ai-estimate metadata on fat content, meat flags,
// etc.), so most violations will route to PA-reviewable rather than
// hard-stop. This is the honest-estimate framing operationalized — the
// engine refuses to BLOCK production only when it's MEASURED-confident
// that the cap is exceeded. ESTIMATED-over-cap is a flag for the
// Process Authority to verify with physical test or supplier COA.
//
// ============================================================
// === DO NOT WEAKEN THIS GATE ===
// ============================================================
//
// This gate exists to prevent silent shipment of chemical-safety
// violations to customer-zero's production lines. The pre-Round-10
// state shipped the 18-entry REGULATORY_LIMITS table with COMPUTATION
// but no ENFORCEMENT — findings were rendered but nothing prevented
// export of a formulation with over-cap nitrite, over-cap BHA, sulfite
// on fresh produce, etc. Round 10's Bucket A gate closes that gap.
//
// Changes that weaken the gate — lowering the input-confidence
// threshold (treating ESTIMATED as hard-stop-worthy when it isn't, or
// treating MEASURED + violated as PA-reviewable when it should hard-
// stop), adding bypasses, making refusal optional, expanding the
// "insufficient-data" branch to swallow violations that should fire —
// are regulatory-safety regressions regardless of intent. Before
// changing any gate threshold, semantic, or output shape: read this
// docblock end-to-end, consult an FDA-recognized Process Authority,
// and surface the change explicitly in the PR description for operator
// approval. Do not restore the conditions that pre-Round-10 shipped.
//
// Round 11 will compose this gate with the PA-review state machinery
// (field-level authority + version-locked snapshots + refuse-to-export
// wired into actual export operations). v1 surfaces the gate's
// decision in the workspace UI so customer-zero can see Bucket A vs
// Bucket B classification; explicit export-blocking wires in Round 11.
// ============================================================

import type { HardStop, HardStopEvidence } from './hardStop';
import type { ComplianceFinding } from './regulatoryLimits';
import { formatAmount } from './regulatoryLimits';

/**
 * Result of evaluating the Bucket A enforcement gate over a list of
 * compliance findings.
 *
 * The `hardStop` discriminator narrows the union:
 *   • `hardStop: true` — conforms to the HardStop primitive (source,
 *     reason, evidence) plus `paReviewableFindings` for full disclosure.
 *     Caller renders refuse-to-export UI.
 *   • `hardStop: false` — gate cleared (no MEASURED/CALCULATED + violated
 *     findings). `paReviewableFindings` lists any ESTIMATED/INFERRED +
 *     violated items that the Process Authority should review.
 */
export type BucketAGateResult =
  | (HardStop & {
      source: 'bucket-a-compliance';
      /** ESTIMATED/INFERRED + violated findings surfaced for PA review. */
      paReviewableFindings: ComplianceFinding[];
    })
  | {
      hardStop: false;
      source: 'bucket-a-compliance';
      paReviewableFindings: ComplianceFinding[];
    };

/**
 * Evaluate the Bucket A enforcement gate over `checkCompliance` findings.
 *
 * Partitions findings into three buckets:
 *   • hard-stop (MEASURED/CALCULATED + violated) — drives refuse-to-export
 *   • PA-reviewable (ESTIMATED/INFERRED + violated) — surfaced for PA judgment
 *   • non-fire (not violated, or UNKNOWN input confidence) — ignored by gate
 *
 * When any hard-stop finding exists, returns a HardStop-shaped result.
 * Otherwise, returns the cleared shape with PA-reviewable findings listed.
 *
 * Pure function — no side effects. Same `findings` input always produces
 * the same gate output. Caller is responsible for re-evaluating when
 * findings change (e.g., productClass change, ingredient edits).
 */
export function evaluateBucketA(findings: ComplianceFinding[]): BucketAGateResult {
  const hardStopFindings: ComplianceFinding[] = [];
  const paReviewableFindings: ComplianceFinding[] = [];

  for (const f of findings) {
    if (!f.violated) continue;
    const conf = f.inputConfidence;
    if (conf === 'measured' || conf === 'calculated') {
      hardStopFindings.push(f);
    } else if (conf === 'estimated' || conf === 'inferred') {
      paReviewableFindings.push(f);
    }
    // UNKNOWN inputConfidence: insufficient-data, gate doesn't act
  }

  if (hardStopFindings.length === 0) {
    return {
      hardStop: false,
      source: 'bucket-a-compliance',
      paReviewableFindings,
    };
  }

  const evidence: HardStopEvidence[] = hardStopFindings.map(f => {
    const capPart = f.prohibitedUse
      ? 'prohibited in this productClass'
      : `over cap (${formatAmount(f.currentPercent, f.currentPpm)} vs limit ${
          f.limit.maxPercent !== undefined
            ? `${f.limit.maxPercent}%`
            : `${f.limit.maxPpm} ppm`
        })`;
    return {
      subject: f.ingredientName,
      detail: `${f.limit.shortName} — ${capPart} [${f.inputConfidence} input confidence]`,
      citation: f.limit.citation,
    };
  });

  const reason = hardStopFindings.length === 1
    ? `Refuse-to-export: 1 chemical-safety violation with MEASURED or CALCULATED input confidence. ${hardStopFindings[0].limit.shortName} on ${hardStopFindings[0].ingredientName}.`
    : `Refuse-to-export: ${hardStopFindings.length} chemical-safety violations with MEASURED or CALCULATED input confidence.`;

  return {
    hardStop: true,
    source: 'bucket-a-compliance',
    reason,
    evidence,
    paReviewableFindings,
  };
}
