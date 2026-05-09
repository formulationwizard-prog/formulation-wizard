// ============================================================
// Filing Readiness — pathway-aware distance to filing-ready state
// ------------------------------------------------------------
// Round 9 directive (2026-05-09) replaces the prior Phase-1 boolean
// heuristic with a pathway-aware metric. The score reflects how close
// the formulation is to having the documentation set that the customer's
// Process Authority needs to file under the specific regulatory pathway
// the Determination Engine has classified the formulation under.
//
// v1 scope (Path Y, 2026-05-09): only Acidified Foods (21 CFR 114) is
// fully specified. Other pathways (LACF, Acid Food, Shelf-Stable-Dry,
// Dietary Supplement, FSIS Meat, Pending) render as Surface 4
// placeholders with pathway-specific sub-messages. The 16-requirement
// AF framework wires up only the requirements that have an architectural
// home in the codebase today (pH, water activity, HACCP); the remaining
// 13 requirements are forever-UNKNOWN with Round-10-or-later attribution
// surfaced via the blocker diagnostic (Surface 3).
//
// See docs/rounds/round-9-directive.md for the locked spec and
// docs/design/filing-readiness.md for the system specification.
// ============================================================

import type { Confidence } from '@/types';
import type { FormulationSpecs } from './foodScience';
import type { FilingRequirement } from './scheduledProcess';

// ----- Pathway machine ID -----------------------------------------------
// Stable identifier for pathway-equality checks (escalation detection in
// the workspace status bar). Distinct from the human-readable pathwayLabel.
export type FilingReadinessPathway =
  | 'acidified-foods'   // 21 CFR 114 — fully specified in v1
  | 'lacf'              // 21 CFR 113 — placeholder (Round 10)
  | 'acid-food'         // 21 CFR 114.3(b)(1) — placeholder (Round 10 — exemption-confirmed reduced set)
  | 'shelf-stable-dry'  // a_w ≤ 0.85 — placeholder (no filing required)
  | 'dietary-supplement' // 21 CFR 111 — placeholder (Round 11)
  | 'fsis-meat'         // 9 CFR — placeholder (out of v1 scope)
  | 'pending'           // insufficient data — placeholder (classify first)
  | 'unclassified';     // no classification yet — placeholder

// ----- Per-requirement state machine ------------------------------------
export type RequirementStatus =
  | { kind: 'wired'; confidence: Confidence; sourceLabel: string }
  | { kind: 'deferred'; targetRound: string; reason: string };

export interface RequirementResult {
  id: string;
  label: string;
  tier: 'critical' | 'supplementary';
  status: RequirementStatus;
  /** Effective confidence used in score computation (deferred → 'unknown'). */
  effectiveConfidence: Confidence;
  /** Numeric weight contribution per the confidence taxonomy. */
  weight: number;
}

// ----- Top-level computation result -------------------------------------
export interface FilingReadinessResult {
  /** Pathway label for the widget header (e.g., "Acidified Foods (21 CFR 114)"). */
  pathwayLabel: string;
  /** Pathway machine ID for stable comparison (escalation detection). */
  pathway: FilingReadinessPathway;
  /** Computed percentage 0–100, rounded. Null when pathway has no requirement set. */
  percentage: number | null;
  /** Confidence level of the percentage itself (drives ConfidencePill). */
  confidence: Confidence | null;
  /** Per-requirement results (drives Surface 3 blocker diagnostic). */
  requirements: RequirementResult[];
  /** Harm-critical requirements that floored the score. Empty when not floored. */
  flooredBy: RequirementResult[];
  /** True when the score was floored by harm-critical UNKNOWN/sub-CALCULATED items. */
  isFloored: boolean;
  /** True when this pathway has a specified requirement set in v1. */
  isPathwaySpecified: boolean;
}

// ----- Confidence-tier weights (locked, see directive computation spec) -
const WEIGHTS: Record<Confidence, number> = {
  measured:   1.00,
  calculated: 0.80,
  estimated:  0.50,
  inferred:   0.40,
  unknown:    0.00,
};

// ----- Rank for floor logic comparisons (higher = stronger) ------------
const RANK: Record<Confidence, number> = {
  unknown:    0,
  inferred:   1,
  estimated:  2,
  calculated: 3,
  measured:   4,
};

// ----- Floor multipliers (locked, see directive computation spec) -------
const FLOOR_MULT_HARD = 0.30;  // any harm-critical UNKNOWN
const FLOOR_MULT_SOFT = 0.70;  // all harm-critical ≥ INFERRED but any < CALCULATED

// ----- AF (21 CFR 114) requirement specification ------------------------
// 8 harm-critical floor-contributors + 8 supplementary weighted items.
// Wired vs deferred per Path Y v1 scope decision. See round-9 directive
// for the architectural-home audit driving this split.
function buildAcidifiedFoodsRequirements(
  specs: FormulationSpecs,
  haccpInferred: boolean,
): RequirementResult[] {
  return [
    // ─── Harm-critical (8) ─────────────────────────────────────────────
    reqWired('af.ph',                'Equilibrium pH',                                  'critical', specs.confidence.pH, 'Spec Analysis'),
    reqWired('af.aw',                'Water activity',                                  'critical', specs.confidence.aw, 'Spec Analysis'),
    reqDeferred('af.scheduledProcess', 'Scheduled process establishment (PA-reviewed)', 'critical', 'Round 10', 'PA-review state machinery not yet built'),
    reqDeferred('af.containerIntegrity', 'Container integrity testing',                 'critical', 'Round 10', 'No surface in workspace today'),
    reqWired('af.haccp',             'HACCP plan (acidified foods)',                    'critical', haccpInferred ? 'inferred' : 'unknown', 'HACCP card (template-derived)'),
    reqDeferred('af.fce',            'FCE registration (Form FDA 2541)',                'critical', 'Round 10', 'No surface in workspace today'),
    reqDeferred('af.sid',            'SID submission (Form FDA 2541e)',                 'critical', 'Round 10', 'No surface in workspace today'),
    reqDeferred('af.paSignoff',      'Process Authority sign-off documentation',        'critical', 'Round 10', 'PA-review state machinery not yet built'),

    // ─── Supplementary weighted (8) ────────────────────────────────────
    reqDeferred('af.training',       'Training records',                                'supplementary', 'Round 11+', 'No surface in workspace today'),
    reqDeferred('af.sanitation',     'Pre-operational sanitation logs',                 'supplementary', 'Round 11+', 'No surface in workspace today'),
    reqDeferred('af.batchRecords',   'Production batch records template',               'supplementary', 'Round 11+', 'No surface in workspace today'),
    reqDeferred('af.deviation',      'Deviation handling procedure',                    'supplementary', 'Round 11+', 'No surface in workspace today'),
    reqDeferred('af.recall',         'Recall plan',                                     'supplementary', 'Round 11+', 'No surface in workspace today'),
    reqDeferred('af.supplierVerif',  'Supplier verification (harm-critical ingredients)', 'supplementary', 'Round 11+', 'No surface in workspace today'),
    reqDeferred('af.calibration',    'Equipment calibration records (pH/a_w/thermometer)', 'supplementary', 'Round 11+', 'No surface in workspace today'),
    reqDeferred('af.containerSpec',  'Container supplier specifications',               'supplementary', 'Round 11+', 'No surface in workspace today'),
  ];
}

function reqWired(id: string, label: string, tier: 'critical' | 'supplementary', confidence: Confidence, sourceLabel: string): RequirementResult {
  return {
    id, label, tier,
    status: { kind: 'wired', confidence, sourceLabel },
    effectiveConfidence: confidence,
    weight: WEIGHTS[confidence],
  };
}

function reqDeferred(id: string, label: string, tier: 'critical' | 'supplementary', targetRound: string, reason: string): RequirementResult {
  return {
    id, label, tier,
    status: { kind: 'deferred', targetRound, reason },
    effectiveConfidence: 'unknown',
    weight: 0,
  };
}

// ----- Pathway resolution -----------------------------------------------
// Maps the Determination Engine's classification onto the Filing Readiness
// pathway space. Supplements bypass acidified-foods logic entirely. FSIS
// meat is detected via the FilingRequirement.formName short-circuit.
function pathwayForFiling(
  filing: FilingRequirement,
  classification: FormulationSpecs['productClassification'],
  modeId: string,
): { pathway: FilingReadinessPathway; label: string } {
  if (modeId === 'supplements') {
    return { pathway: 'dietary-supplement', label: 'Dietary Supplement (21 CFR 111)' };
  }
  if (filing.formName === 'FSIS HACCP (no FDA Scheduled Process)') {
    return { pathway: 'fsis-meat', label: 'FSIS Meat (9 CFR)' };
  }
  switch (classification) {
    case 'acidified':
    case 'acidified-in-process':
      return { pathway: 'acidified-foods', label: 'Acidified Foods (21 CFR 114)' };
    case 'lacf':
      return { pathway: 'lacf', label: 'Low-Acid Canned Foods (21 CFR 113)' };
    case 'acid':
      return { pathway: 'acid-food', label: 'Acid Food (21 CFR 114.3(b)(1))' };
    case 'shelf-stable-dry':
      return { pathway: 'shelf-stable-dry', label: 'Shelf-Stable by Low Water Activity' };
    case 'insufficient-data':
      return { pathway: 'pending', label: 'Pending classification' };
    default:
      return { pathway: 'unclassified', label: 'Unclassified' };
  }
}

// ----- Floor logic per directive computation spec -----------------------
function applyFloor(
  rawAvg: number,
  criticalReqs: RequirementResult[],
): { final: number; multiplier: number; flooredBy: RequirementResult[] } {
  const anyUnknown = criticalReqs.filter(r => r.effectiveConfidence === 'unknown');
  if (anyUnknown.length > 0) {
    return { final: rawAvg * FLOOR_MULT_HARD, multiplier: FLOOR_MULT_HARD, flooredBy: anyUnknown };
  }
  const belowCalculated = criticalReqs.filter(r => RANK[r.effectiveConfidence] < RANK['calculated']);
  if (belowCalculated.length > 0) {
    return { final: rawAvg * FLOOR_MULT_SOFT, multiplier: FLOOR_MULT_SOFT, flooredBy: belowCalculated };
  }
  return { final: rawAvg, multiplier: 1.0, flooredBy: [] };
}

// ----- Score-confidence aggregation -------------------------------------
// Floor across harm-critical inputs, capped at CALCULATED (the score is a
// derivation, not a raw measurement — mirrors the Spec Analysis rollup
// pattern from Session 3 / feedback_three_class_value_taxonomy.md).
function aggregateConfidence(criticalReqs: RequirementResult[]): Confidence {
  if (criticalReqs.length === 0) return 'unknown';
  const minRank = Math.min(...criticalReqs.map(r => RANK[r.effectiveConfidence]));
  // Cap MEASURED-input floors at CALCULATED (derivation cannot exceed CALCULATED).
  const cappedRank = Math.min(minRank, RANK['calculated']);
  const inv: Record<number, Confidence> = {
    0: 'unknown', 1: 'inferred', 2: 'estimated', 3: 'calculated',
  };
  return inv[cappedRank] ?? 'unknown';
}

// ----- Public entry point -----------------------------------------------
/**
 * Compute the pathway-aware Filing Readiness for a formulation.
 *
 *  - For Acidified Foods (the only fully-specified pathway in v1), returns
 *    a numeric percentage with confidence treatment, per-requirement
 *    breakdown, and floor-attribution.
 *  - For all other pathways, returns a placeholder result with the
 *    pathway identified but no numeric score (Surface 4 in the workspace).
 */
export function computeFilingReadiness(args: {
  modeId: string;
  specs: FormulationSpecs;
  filing: FilingRequirement;
  /** Whether HACCP guidance is currently active for this formulation
   *  (template-derived per lib/haccp.ts → INFERRED). False → UNKNOWN. */
  haccpInferred: boolean;
}): FilingReadinessResult {
  const { modeId, specs, filing, haccpInferred } = args;
  const { pathway, label } = pathwayForFiling(filing, specs.productClassification, modeId);

  // Pathway not specified in v1 → placeholder result (Surface 4)
  if (pathway !== 'acidified-foods') {
    return {
      pathwayLabel: label,
      pathway,
      percentage: null,
      confidence: null,
      requirements: [],
      flooredBy: [],
      isFloored: false,
      isPathwaySpecified: false,
    };
  }

  // AF pathway specified — compute against the 16-requirement set
  const requirements = buildAcidifiedFoodsRequirements(specs, haccpInferred);
  const criticalReqs = requirements.filter(r => r.tier === 'critical');

  const totalWeight = requirements.reduce((sum, r) => sum + r.weight, 0);
  const rawAvg = (totalWeight / requirements.length) * 100;
  const { final, flooredBy } = applyFloor(rawAvg, criticalReqs);

  return {
    pathwayLabel: label,
    pathway,
    percentage: Math.round(final),
    confidence: aggregateConfidence(criticalReqs),
    requirements,
    flooredBy,
    isFloored: flooredBy.length > 0,
    isPathwaySpecified: true,
  };
}
