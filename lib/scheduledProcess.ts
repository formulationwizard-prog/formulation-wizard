// ============================================================
// SCHEDULED PROCESS FILING HELPERS
// ------------------------------------------------------------
// Supports the FDA Food Canning Establishment (FCE) + Submission
// Identifier (SID) process filing family for shelf-stable
// low-acid and acidified foods. Form numbers per FDA.gov current
// guidance (Forms 2541a and 2541c are obsolete in current
// practice and have been replaced by method-specific forms):
//
//   • Form FDA 2541   — Food Canning Establishment Registration
//                       (one-time, both AF and LACF)
//   • Form FDA 2541d  — LACF Process Filing (retort)
//   • Form FDA 2541e  — Acidified Food Process Filing
//   • Form FDA 2541f  — LACF Process Filing (water activity /
//                       formulation control)
//   • Form FDA 2541g  — LACF Process Filing (aseptic)
//
// This module determines which filing (if any) applies to the
// current formulation and supplies structural metadata, default
// critical factors, and typical finished-product QA tests so the
// UI can pre-populate a draft for the customer's Process Authority.
// ============================================================

import { REGULATORY_DISCLAIMER } from './foodScience';

export type FormName =
  | 'FDA 2541d'
  | 'FDA 2541e'
  | 'FDA 2541f or 2541g (method-dependent)'
  | 'FDA 2541d, 2541f, or 2541g (method-dependent)'
  | 'FSIS HACCP (no FDA Scheduled Process)'
  | 'None — GRAS / GMP only'
  | 'None — 21 CFR 111 cGMP framework'
  | 'Pending verified data — confirm with Process Authority'
  | 'Process Authority review strongly recommended';

export interface FilingRequirement {
  required: boolean;
  formName: FormName;
  citations: string[];
  reason: string;
  processAuthorityRequired: boolean;
  urgency: 'critical' | 'recommended' | 'not-required';
}

export interface QaTest {
  parameter: string;
  target: string;
  method: string;
  frequency: string;
}

// ----- Determine which (if any) filing applies -----------------------------
/**
 * Determine whether a Scheduled Process filing is required.
 *
 * Uses `productClassification` (from the spec estimator) as the primary signal.
 * Output strings are HEDGED ("likely required — confirm with Process Authority")
 * because the underlying ingredient-spec lookup tables contain unverified data;
 * see classifyFormulation() in lib/foodScience.ts for the provenance gate.
 * Every reason string ends with REGULATORY_DISCLAIMER.
 *
 *   • 'acid'                  — 21 CFR 114.3(b)(1) — naturally acid, no filing
 *   • 'acidified'             — 21 CFR 114 — Form FDA 2541e likely required
 *   • 'acidified-in-process'  — intent is acidified, pH not yet ≤ 4.6 → add more acid
 *   • 'lacf'                  — 21 CFR 113 — Form 2541d/f/g (method-dependent)
 *   • 'shelf-stable-dry'      — aw ≤ 0.85, no filing
 *   • 'insufficient-data'     — verified-mass coverage too low to classify
 *
 * HACCP category (FSIS meat) short-circuits to USDA pathway.
 */
export function determineFilingRequirement(
  haccpCategoryId: string | null | undefined,
  specs: {
    pH?: number;
    aw?: number;
    lowAcidComponentPct?: number;
    productClassification?: 'acid' | 'acidified' | 'acidified-in-process' | 'lacf' | 'shelf-stable-dry' | 'insufficient-data' | '—';
  },
  /**
   * Workspace mode discriminator. Round 11 Phase 3 Workstream A.5 [2/N]
   * (#25g closure). Supplement-mode branch returns supplement-aware
   * citations (21 CFR 111 cGMP / DSHEA / 21 CFR 101.36 / 101.93) and
   * suppresses F&B Scheduled Process classification — supplements have
   * no equivalent FDA filing under 21 CFR 113 / 114. Omitted or 'fb'
   * preserves pre-Round-11 F&B logic for backward compat.
   */
  mode?: 'fb' | 'supplements',
): FilingRequirement {
  // ═══ DIETARY SUPPLEMENT MODE — Round 11 Phase 3 Workstream A.5 [2/N] ═══
  // Closes Phase 2 implementation-discovery finding #25g. Pre-fix
  // behavior: supplements fell through to the insufficient-data fallback
  // returning 21 CFR 113/114 citations. Post-fix: explicit supplement-
  // mode branch returns 21 CFR 111 + DSHEA framework citations.
  //
  // processAuthorityRequired stays `true` to keep the DeterminationEngineCard
  // advisory firing — the AdvisoryNotice renders supplement-mode copy via
  // a `mode` prop threaded through from DeterminationEngineCard (#25f
  // closure mechanism). Same boolean semantics; mode-aware user-facing text.
  if (mode === 'supplements') {
    return {
      required: false,
      formName: 'None — 21 CFR 111 cGMP framework',
      citations: [
        '21 CFR 111 (Dietary Supplement cGMP)',
        '21 CFR 101.36 (Supplement Facts)',
        '21 CFR 101.93 (DSHEA structure/function claims + disclaimer)',
        'DSHEA §403(r)(6) (30-day FDA notification)',
      ],
      reason: `Dietary supplement product class — manufactured under 21 CFR 111 cGMP, not FDA Scheduled Process filing (21 CFR 113 / 114 LACF + Acidified Foods do not apply). Required regulatory review areas: ingredient identity testing (21 CFR 111.75(a)(1)); structure/function claim substantiation (DSHEA / 21 CFR 101.93); Supplement Facts panel accuracy (21 CFR 101.36); DSHEA §403(r)(6) 30-day FDA notification for structure/function claims; allergen disclosure (FALCPA + FASTER Act). Confirm with a qualified regulatory reviewer (DSHEA-qualified regulatory consultant or 21 CFR 111-trained quality unit) before commercial production.\n\nThis information is for general educational purposes and does not constitute legal or definitive regulatory advice.`,
      processAuthorityRequired: true,
      urgency: 'recommended',
    };
  }

  // USDA FSIS meat products short-circuit FDA logic entirely.
  if (haccpCategoryId === 'rte-cooked-meat' || haccpCategoryId === 'fermented-dry-cured-meat') {
    return {
      required: true,
      formName: 'FSIS HACCP (no FDA Scheduled Process)',
      citations: ['9 CFR 417 (HACCP)', '9 CFR 430 (Listeria)', '9 CFR 424.21 (Cure limits)'],
      reason: `USDA-FSIS inspected meat product. No FDA filing — a validated HACCP plan on file with USDA district office + Grant of Inspection required before production.\n\n${REGULATORY_DISCLAIMER}`,
      processAuthorityRequired: true,
      urgency: 'critical',
    };
  }

  const classification = specs.productClassification;
  const pH = specs.pH;
  const aw = specs.aw;
  const lowAcidPct = specs.lowAcidComponentPct;

  // ═══ INSUFFICIENT DATA — verification gate failed ═══
  if (classification === 'insufficient-data') {
    return {
      required: false,
      formName: 'Pending verified data — confirm with Process Authority',
      citations: ['21 CFR 113', '21 CFR 114'],
      reason: `Insufficient verified data to compute regulatory classification. Add lab-verified or supplier-COA values for the ingredients listed below to receive a classification. Until then, this formulation cannot be classified per 21 CFR 113/114.\n\n${REGULATORY_DISCLAIMER}`,
      processAuthorityRequired: true,
      urgency: 'critical',
    };
  }

  // ═══ LIKELY ACIDIFIED FOOD (21 CFR 114) — final pH ≤ 4.6 WITH low-acid base ═══
  if (classification === 'acidified') {
    return {
      required: true,
      formName: 'FDA 2541e',
      citations: ['21 CFR 114', 'Form FDA 2541 (FCE registration)', 'Form FDA 2541e (Acidified Process Filing)'],
      reason: `LIKELY ACIDIFIED FOOD (assessment based on available data) — 21 CFR 114. Finished pH ${pH?.toFixed(2)} ≤ 4.6 with ${lowAcidPct?.toFixed(1)}% low-acid components — an otherwise-low-acid base acidified to shelf-stable pH. Form FDA 2541e likely required (Process Filing for Acidified Method) — confirm with Process Authority before first commercial batch. Facility must also be registered using Form FDA 2541 (Food Canning Establishment Registration).\n\n${REGULATORY_DISCLAIMER}`,
      processAuthorityRequired: true,
      urgency: 'critical',
    };
  }

  // ═══ LIKELY ACIDIFIED-IN-PROCESS — intent is acidified, pH not there yet ═══
  if (classification === 'acidified-in-process') {
    return {
      required: true,
      formName: 'FDA 2541e',
      citations: ['21 CFR 114', 'Form FDA 2541 (FCE registration)', 'Form FDA 2541e (Acidified Process Filing)'],
      reason: `LIKELY ACIDIFIED FOOD (assessment based on available data) — 21 CFR 114, intent detected (acidulant present + ${lowAcidPct?.toFixed(1)}% low-acid base), but finished pH ${pH?.toFixed(2)} NOT yet ≤ 4.6. Add more acidulant (vinegar, citric acid, lime juice) until equilibrium pH ≤ 4.6 (target ≤ 4.2 for safety margin). Once properly acidified, Form FDA 2541e likely required (Process Filing for Acidified Method) — confirm with Process Authority. Facility must also be registered using Form FDA 2541 (Food Canning Establishment Registration).\n\n${REGULATORY_DISCLAIMER}`,
      processAuthorityRequired: true,
      urgency: 'critical',
    };
  }

  // ═══ LIKELY LACF (21 CFR 113) — genuinely low-acid, no acidification intent ═══
  if (classification === 'lacf') {
    return {
      required: true,
      formName: 'FDA 2541d, 2541f, or 2541g (method-dependent)',
      citations: ['21 CFR 113', 'Form FDA 2541 (FCE registration)', 'Form FDA 2541d (Retort)', 'Form FDA 2541f (Water Activity / Formulation)', 'Form FDA 2541g (Aseptic)'],
      reason: `LIKELY LOW-ACID CANNED FOOD (assessment based on available data) — 21 CFR 113, pH ${pH?.toFixed(2)} > 4.6 and a_w ${aw?.toFixed(2)} > 0.85 with no acidulant present. Highest-risk FDA process category — typically requires thermal processing to commercial sterility (12D Clostridium botulinum inactivation). LACF process filing likely required — Form FDA 2541d (retort), 2541f (water activity/formulation), or 2541g (aseptic) depending on processing method. Confirm appropriate form with Process Authority. Facility must also be registered using Form FDA 2541 (Food Canning Establishment Registration).\n\n${REGULATORY_DISCLAIMER}`,
      processAuthorityRequired: true,
      urgency: 'critical',
    };
  }

  // ═══ LIKELY ACID FOOD (21 CFR 114.3(b)(1)) — naturally acid, GMP only ═══
  if (classification === 'acid') {
    return {
      required: false,
      formName: 'None — GRAS / GMP only',
      citations: ['21 CFR 114.3(b)(1)', '21 CFR 117 (Preventive Controls)'],
      reason: `LIKELY ACID FOOD (assessment based on available data) — 21 CFR 114.3(b)(1), naturally pH ${pH?.toFixed(2)} ≤ 4.6 with only ${lowAcidPct?.toFixed(1)}% low-acid components. No FDA scheduled-process filing appears to apply based on available data — confirm with Process Authority. Acid foods (per 21 CFR 114.3(b)(1)) are not subject to 21 CFR 113 or 114 process filing requirements. Follow 21 CFR 117 Preventive Controls. Typical examples: fruit, tomato products, fermented products.\n\n${REGULATORY_DISCLAIMER}`,
      processAuthorityRequired: false,
      urgency: 'not-required',
    };
  }

  // ═══ LIKELY SHELF-STABLE BY LOW WATER ACTIVITY — a_w ≤ 0.85 ═══
  if (classification === 'shelf-stable-dry') {
    return {
      required: false,
      formName: 'None — GRAS / GMP only',
      citations: ['21 CFR 117'],
      reason: `LIKELY SHELF-STABLE BY LOW WATER ACTIVITY (assessment based on available data) — a_w ${aw?.toFixed(2)} ≤ 0.85. No FDA scheduled-process filing appears to apply based on available data — confirm with Process Authority. Foods with water activity at or below 0.85 are excluded from 21 CFR 113 and 114 (per the regulations' scope). Follow 21 CFR 117 Preventive Controls + low-moisture foods environmental Salmonella program.\n\n${REGULATORY_DISCLAIMER}`,
      processAuthorityRequired: false,
      urgency: 'not-required',
    };
  }

  // Fallback ('—' / empty / unknown) — treat as insufficient data.
  return {
    required: false,
    formName: 'Pending verified data — confirm with Process Authority',
    citations: ['21 CFR 113', '21 CFR 114'],
    reason: `Insufficient verified data to compute regulatory classification. Add lab-verified or supplier-COA values for the ingredients listed below to receive a classification. Until then, this formulation cannot be classified per 21 CFR 113/114.\n\n${REGULATORY_DISCLAIMER}`,
    processAuthorityRequired: true,
    urgency: 'critical',
  };
}

// ----- Default QA tests by HACCP category -----------------------------------
export function defaultQaTestsForCategory(haccpCategoryId: string | null | undefined): QaTest[] {
  switch (haccpCategoryId) {
    case 'high-acid-hot-filled':
    case 'acidified-foods':
      return [
        { parameter: 'Equilibrium pH', target: '≤ 4.6 (target ≤ 4.2)', method: 'pH meter, calibrated 2-point daily', frequency: 'Every batch + 3 units at day 10' },
        { parameter: 'Fill Temperature', target: '≥ 180°F at closure', method: 'In-line + handheld thermometer', frequency: 'Continuous + every 30 min' },
        { parameter: 'Vacuum / Closure', target: 'Button inverted OR ≥ 10 in Hg vacuum', method: 'Visual + vacuum gauge', frequency: '100% visual + 10 units/hr vacuum' },
        { parameter: 'Brix (soluble solids)', target: 'Per formula ± 1°', method: 'Digital refractometer', frequency: 'Every batch' },
        { parameter: 'Net Weight', target: 'Per label ± 2g', method: 'Calibrated scale', frequency: 'Sampling plan per shift' },
      ];
    case 'lacf-retort':
      return [
        { parameter: 'F₀ (Lethality)', target: 'Per Scheduled Process (typical ≥ 6.0 min)', method: 'Retort chart + thermocouple validation', frequency: 'Continuous per lot' },
        { parameter: 'Vent + Come-Up Time', target: 'Per SID', method: 'Retort record', frequency: 'Every cycle' },
        { parameter: 'Seam Integrity', target: 'Per SID dimensions', method: 'Seam teardown + micrometer', frequency: 'Startup + 2x/shift each head' },
        { parameter: 'Can Vacuum', target: 'Per SID', method: 'Vacuum gauge', frequency: 'Hourly' },
        { parameter: 'Cooling Water Chlorine', target: '≥ 1 ppm free residual', method: 'DPD test kit', frequency: 'Every 4 hrs' },
        { parameter: 'Incubation Hold (mesophile)', target: 'Negative at 35°C × 14 d', method: 'Incubator + pH / visual', frequency: 'Retention samples per lot' },
      ];
    case 'rte-cooked-meat':
      return [
        { parameter: 'Internal Cook Temperature', target: '≥ 160°F × 15 sec (per FSIS Appendix A)', method: 'Thermocouple in coldest spot', frequency: 'Every batch' },
        { parameter: 'Cooling Rate', target: '120°F → 80°F in 90 min; 80°F → 40°F in 5 hrs (Appendix B Option 1)', method: 'Data logger', frequency: 'Every batch' },
        { parameter: 'Ingoing Nitrite', target: '≤ 156 ppm (120 ppm pumped bacon)', method: 'Cure pre-weigh + batch record', frequency: 'Every batch' },
        { parameter: 'Finished Listeria monocytogenes', target: 'Negative per 9 CFR 430 alternative', method: 'Environmental + product testing', frequency: 'Per program' },
      ];
    case 'fermented-dry-cured-meat':
      return [
        { parameter: 'Fermentation pH', target: '≤ 5.3 within degree-hour limits (FSIS)', method: 'pH meter + temp log', frequency: 'Every 2 hrs during ferment' },
        { parameter: 'Finished a_w', target: '≤ 0.91 (or ≤ 0.92 if pH ≤ 5.0)', method: 'a_w meter', frequency: 'At release per lot' },
        { parameter: 'Weight Loss', target: '30–40% of green weight', method: 'Gravimetric', frequency: 'Weekly during drying' },
        { parameter: 'Trichinella Treatment (pork)', target: 'Per 9 CFR 318.10 Table 1', method: 'Freezer log OR validated process', frequency: 'Every lot' },
        { parameter: 'Ingoing Nitrite + Nitrate', target: '≤ 156 ppm NO₂; ≤ 1,718 ppm NO₃', method: 'Batch record', frequency: 'Every batch' },
      ];
    default:
      return [
        { parameter: 'pH', target: 'Per specification', method: 'pH meter', frequency: 'Every batch' },
        { parameter: 'Net Weight', target: 'Per label', method: 'Scale', frequency: 'Sampling plan' },
      ];
  }
}

// ----- Process-method options for the wizard --------------------------------
export const PROCESS_METHODS = [
  { id: 'hot-fill', label: 'Hot-Fill & Hold', notes: 'Fill at ≥ 180°F, invert to sanitize closure, cool' },
  { id: 'cold-fill-acidified', label: 'Cold-Fill (Acidified)', notes: 'Acidified brine + 10-day equilibrium pH check' },
  { id: 'still-retort', label: 'Still Retort (saturated steam)', notes: 'Batch retort, no agitation' },
  { id: 'rotary-retort', label: 'Rotary / Agitating Retort', notes: 'Continuous or batch with product rotation' },
  { id: 'hydrostat', label: 'Hydrostatic Retort', notes: 'Continuous pressure-balanced tower' },
  { id: 'water-bath', label: 'Water-Bath Pasteurization', notes: 'Low-acid pasteurization (pickling)' },
  { id: 'aseptic', label: 'Aseptic (UHT + aseptic fill)', notes: 'Sterilize product + container separately, combine in sterile zone' },
  { id: 'open-kettle', label: 'Open Kettle / Atmospheric Cook', notes: 'Cook at atmospheric pressure; typical for acid foods' },
];
