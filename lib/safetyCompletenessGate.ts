// ============================================================
// SAFETY-COMPLETENESS GATE (REFUSE-TO-EXPORT)
// ------------------------------------------------------------
// Sibling to lib/supplementBucket1Gate.ts at the single export
// chokepoint (gateBeforeExport in app/workspace/page.tsx).
//
// DISTINCT SEMANTIC — do not conflate with Bucket 1:
//   • Bucket 1 (supplementBucket1Gate.ts) = the Companion-Spec §B
//     harm-critical LABELING FLOOR (CFR-anchored: 21 CFR 101.36
//     species-naming, disease-claim, identity-test, disclaimer,
//     net-quantity, review-state).
//   • THIS gate = analysis-COMPLETENESS PRECONDITIONS. Not CFR
//     labeling-floor violations — preconditions the engine needs
//     before its safety analysis can run honestly. Platform-defined,
//     not regulation-cited. (Citing a CFR section for a platform
//     precondition would be confabulation — see the retired §II.11
//     miscitation, F-3 propagation.)
//
// gateBeforeExport composes BOTH gates; export refuses if EITHER
// fires. This sibling-gate pattern extends: future completeness
// preconditions (spec-sheet attachment, COA verification pending,
// harm-critical provenance unverified for an asserted allergen)
// each become a sibling gate composed at the same chokepoint, each
// with a clean single-concept semantic.
//
// FIRST PRECONDITION — units per serving (F-3):
//   For COUNT-based forms (capsule/tablet/softgel/gummy/lozenge/
//   chewable), per-serving = entered per-capsule × unitsPerServing.
//   With units unset, the per-serving safety (UL) analysis and the
//   Supplement Facts amounts CANNOT be computed — the safety map
//   floors to per-capsule, so a per-serving UL violation on a multi-
//   capsule serving can register below its true value and miss the
//   Bucket-1 critical threshold. This gate closes that window: no
//   export of a label backed by incomplete safety analysis.
//   Mass/volume forms (powder/liquid) use serving size directly —
//   units N/A; the gate clears for them.
//
// ============================================================
// === DO NOT WEAKEN THIS GATE ===
// ============================================================
//
// This gate fires for exports that RENDER or DEPEND ON per-serving
// computation (SFP, FVR). Other doc types (Batch Sheet, Raw Material
// Spec, PDS) do not depend on units-per-serving and are out of scope.
//
// WEAKENING = removing the units-unset check, expanding the override
// path, accepting units-unset as complete, scoping it away from
// count-based forms, or REMOVING a per-serving doc type from
// PER_SERVING_DOC_TYPES (re-opening the bypass window for that doc).
// ADDING doc-type scope is NOT weakening — it correctly bounds the
// gate to artifacts that depend on the precondition; firing on
// irrelevant artifacts degrades the chokepoint's signal (routine
// override) and makes the refusal copy dishonest for that doc.
//
// SYMMETRIC ERROR when a NEW ExportDocType is introduced: verify
// whether it renders or depends on per-serving values. If it does, it
// MUST be added to PER_SERVING_DOC_TYPES — omitting it leaves that
// artifact SILENTLY UNPROTECTED (the inverse of removing a doc type).
// Misclassify in both directions with care: a non-per-serving doc left
// out is correct; a per-serving doc left out is a silent bypass.
//
// Before changing any threshold, semantic, or the PER_SERVING_DOC_TYPES
// set: read this docblock end-to-end and surface the change explicitly
// for operator approval. Same discipline as supplementBucket1Gate.ts.
// ============================================================

import type { HardStop, HardStopEvidence } from './hardStop';
import { categorizeDeliveryForm, type SupplementDeliveryForm } from './servingModel';

/** Stable identifier for the units-per-serving completeness precondition. */
export const COMPLETENESS_UNITS_PER_SERVING_ITEM_ID = 'completeness-units-per-serving';

/** Supplement export artifacts that route through the chokepoint. */
export type ExportDocType =
  | 'sfp-label'          // Supplement Facts label
  | 'fvr-packet'         // Formulation Verification Report (RA review packet)
  | 'pds'                // Packaging Data Sheet
  | 'raw-material-spec'  // Raw Material Spec Sheet
  | 'batch-sheet';       // Batch Sheet (BPR)

/**
 * Doc types that RENDER or DEPEND ON per-serving computation. The units-per-
 * serving precondition applies ONLY to these. Manufacturing / ingredient docs
 * (PDS, Raw Material Spec, Batch Sheet) do not declare per-serving values, so
 * the precondition is irrelevant to them and the gate does not fire — firing on
 * irrelevant artifacts would degrade the chokepoint's signal (alert fatigue →
 * routine override) and the refusal copy would be dishonest for that doc.
 */
const PER_SERVING_DOC_TYPES: ReadonlySet<ExportDocType> = new Set<ExportDocType>(['sfp-label', 'fvr-packet']);

export interface SafetyCompletenessGateParams {
  /** The export artifact being gated — scopes per-serving preconditions. */
  docType: ExportDocType;
  /** Active delivery form — count-based forms require units per serving;
   *  mass/volume forms (powder/liquid) use serving size directly. */
  deliveryForm: SupplementDeliveryForm;
  /** Capsules/units per serving. < 1 (unset) on a count-based form → hard-stop. */
  unitsPerServing: number;
}

export type SafetyCompletenessGateResult =
  | (HardStop & { source: 'safety-completeness' })
  | {
      hardStop: false;
      source: 'safety-completeness';
      /** Preconditions checked (audit-trail visibility in the cleared state). */
      composedItems: readonly string[];
    };

/**
 * Evaluate analysis-completeness preconditions. Pure function. Returns a
 * HardStop branch when a precondition is unmet (export must refuse), else the
 * cleared branch. Composed into gateBeforeExport alongside the Bucket 1 gate.
 */
export function evaluateSafetyCompletenessGate(
  params: SafetyCompletenessGateParams,
): SafetyCompletenessGateResult {
  const evidence: HardStopEvidence[] = [];

  // Units-per-serving precondition: applies ONLY to per-serving-rendering doc
  // types (SFP / FVR) AND count-based forms. A manufacturing/ingredient doc
  // (PDS / Batch / Spec) doesn't depend on it → gate clears (no irrelevant
  // refusal). Mass/volume forms use serving size directly → units N/A → clears.
  if (
    PER_SERVING_DOC_TYPES.has(params.docType) &&
    categorizeDeliveryForm(params.deliveryForm) === 'count' &&
    !(params.unitsPerServing >= 1)
  ) {
    evidence.push({
      subject: 'Units per serving',
      detail:
        'Set units per serving in the Serving & Package Size section before export — ' +
        'the per-serving safety (UL) analysis and the Supplement Facts amounts cannot be ' +
        'computed without it.',
      // No citation: platform-defined completeness precondition, not a CFR floor.
    });
  }

  if (evidence.length === 0) {
    return {
      hardStop: false,
      source: 'safety-completeness',
      composedItems: [COMPLETENESS_UNITS_PER_SERVING_ITEM_ID],
    };
  }

  return {
    hardStop: true,
    source: 'safety-completeness',
    reason:
      evidence.length === 1
        ? 'Refuse-to-export: safety analysis is incomplete.'
        : `Refuse-to-export: ${evidence.length} analysis-completeness preconditions unmet.`,
    evidence,
  };
}
