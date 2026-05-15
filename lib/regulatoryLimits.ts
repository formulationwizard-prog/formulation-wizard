// ============================================================
// REGULATORY LIMITS & COMPLIANCE CHECKER
// ------------------------------------------------------------
// Authoritative US limits for common regulated ingredients:
//   • FDA food additive regs (21 CFR) for preservatives, antioxidants, etc.
//   • USDA FSIS (9 CFR 424.21) for cured meats — nitrites, nitrates,
//     cure accelerators, phosphates, binders.
//
// Values are MAX INGOING / MAX FINISHED-PRODUCT levels. These are
// hard caps under US regulation — exceeding them makes the product
// mis-branded or adulterated (legal / FDA / USDA issue, not advisory).
//
// Sources cited per entry. Always verify against current CFR before
// filing a production formula; regulations are updated periodically.
// ============================================================
import { UNIT_TO_GRAMS } from './utils';

export interface RegulatoryLimit {
  /** Substring patterns (case-insensitive) that identify this ingredient. */
  namePatterns: string[];
  /** Max percentage of finished product by weight (if applicable). */
  maxPercent?: number;
  /** Max ppm (parts per million) of finished product. 1 ppm = 0.0001%. */
  maxPpm?: number;
  /** Regulatory body. */
  authority: 'FDA' | 'USDA-FSIS';
  /** CFR citation. */
  citation: string;
  /** Human display name. */
  shortName: string;
  /** One-sentence plain-English summary of the rule. */
  summary: string;
  /** If this ingredient is a cure mix, the fraction of active nitrite/nitrate it contains. */
  activeFraction?: number;
  /** Name of the active (for labeling on the warning). */
  activeName?: string;
  /** Active ingredient max ppm in finished product (the underlying regulated species). */
  activeMaxPpm?: number;

  // ─── Round 10 Section 3a schema additions (2026-05-14) ────────────────────
  // The following fields support per-context limit application, per-ingredient
  // denominator basis, combined-budget aggregation, and declaration-trigger
  // gates. All are optional and additive — absence means "default behavior"
  // (limit applies universally with total-formulation-mass denominator and
  // no special handling). Field consumption is split across the round:
  //   • Section 3b.1 (this commit): combinedBudgetGroup, declarationTriggerPpm
  //   • Section 3b.2 (after Path A productClass plumbing lands):
  //     denominatorBasis, appliesToCategories, prohibitedInCategories,
  //     contextualLimits
  // The schema lands together to keep RegulatoryLimit's shape stable across
  // the round; data-layer corrections that use these fields lock in their
  // respective sub-sections.

  /**
   * Denominator basis for the per-entry percent/ppm computation. Defaults to
   * 'total' (full formulation mass). 'fat-and-oil' uses summed fat+oil mass
   * across ingredients (BHA/BHT case under 21 CFR 172.110/115). 'meat' uses
   * summed meat-ingredient mass (cured-meat caps under 9 CFR 424.21/319).
   * 'baked-good' anchors to the baked-good-substrate mass for the propionate
   * cap under 21 CFR 184.1784/1221. Consumed by Section 3b.2's denominator-
   * basis fixes once productClass plumbing routes the relevant context.
   */
  denominatorBasis?: 'total' | 'fat-and-oil' | 'meat' | 'baked-good';

  /**
   * productClass keys where this limit is active. When set, the limit only
   * fires for formulations whose productClass is in this list. Absence means
   * "applies to all productClasses." Consumed by Section 3b.2's per-context
   * limit applications (vitamin C scope to cured-meat, propionate scope to
   * baked-good, etc.).
   */
  appliesToCategories?: string[];

  /**
   * productClass keys where this substance is PROHIBITED (any non-zero use is
   * a violation). Consumed by Section 3b.2's per-context prohibitions —
   * sodium nitrate prohibited in bacon since 1974, sulfites prohibited on
   * fresh produce per 21 CFR 182.3862. The prohibition gate runs alongside
   * the cap gate; a substance can be prohibited in one productClass while
   * legally capped in another.
   */
  prohibitedInCategories?: string[];

  /**
   * Per-subtype overrides on the base limit. Each entry names a context
   * (productClass-derived or sub-class label) and the override cap that
   * applies in that context. Consumed by Section 3b.2 for cases like sodium
   * nitrite's four bacon-subtype caps (156 / 120 / 200 / 250 ppm). When the
   * formulation's productClass matches a contextualLimits entry, the override
   * takes precedence over maxPercent / maxPpm.
   */
  contextualLimits?: Array<{ context: string; maxPpm?: number; maxPercent?: number }>;

  /**
   * Group key for combined-budget aggregation. Entries sharing the same group
   * key contribute mass to a single combined check against the shared cap.
   * The combined-budget finding appears alongside the individual per-entry
   * findings, so the UI can render both "each member is under its individual
   * cap" and "but the combined total exceeds the shared cap." Section 3b.1
   * lands this for the meat-binder budget (NFDM + sodium caseinate + soy
   * protein concentrate + soy protein isolate share 3.5% per 9 CFR 319.140).
   */
  combinedBudgetGroup?: string;

  /**
   * Label-declaration-required threshold in ppm, distinct from the cap (which
   * is the legal-use ceiling). When the formulation's concentration of this
   * substance is at or above declarationTriggerPpm, a separate finding fires
   * to surface the labeling requirement — independent of any cap violation.
   * Section 3b.1 lands this for sulfites at 10 ppm per 21 CFR 101.100; the
   * 100 ppm cap from 21 CFR 182.3862 remains the legal ceiling.
   */
  declarationTriggerPpm?: number;
}

// ----- The limit table ------------------------------------------------------
export const REGULATORY_LIMITS: RegulatoryLimit[] = [
  // ═════════════════ FDA — PRESERVATIVES & ANTIOXIDANTS ═════════════════════
  {
    namePatterns: ['sodium benzoate'],
    maxPercent: 0.1,
    authority: 'FDA',
    citation: '21 CFR 184.1733',
    shortName: 'Sodium Benzoate',
    summary: 'GRAS preservative. Max 0.1% (1,000 ppm) of finished product. Most effective at pH ≤ 4.5.',
  },
  {
    namePatterns: ['potassium sorbate'],
    maxPercent: 0.1,
    authority: 'FDA',
    citation: '21 CFR 182.3225',
    shortName: 'Potassium Sorbate',
    summary: 'GRAS preservative. Max 0.1% (1,000 ppm) of finished product. Broad-spectrum mold/yeast inhibitor.',
  },
  {
    namePatterns: ['sorbic acid'],
    maxPercent: 0.1,
    authority: 'FDA',
    citation: '21 CFR 182.3089',
    shortName: 'Sorbic Acid',
    summary: 'Max 0.1% of finished product.',
  },
  {
    namePatterns: ['sodium propionate'],
    maxPercent: 0.32,
    authority: 'FDA',
    citation: '21 CFR 184.1784',
    shortName: 'Sodium Propionate',
    summary: 'Max 0.32% (3,200 ppm) of finished bread / baked good. Rope / mold inhibitor.',
  },
  {
    namePatterns: ['calcium propionate'],
    maxPercent: 0.32,
    authority: 'FDA',
    citation: '21 CFR 184.1221',
    shortName: 'Calcium Propionate',
    summary: 'Max 0.32% (3,200 ppm) of finished bread / baked good.',
  },
  {
    namePatterns: ['bha ', 'butylated hydroxyanisole'],
    maxPercent: 0.02,
    authority: 'FDA',
    citation: '21 CFR 172.110',
    shortName: 'BHA',
    summary: 'Max 0.02% (200 ppm) of total fat + oil content. Antioxidant.',
  },
  {
    namePatterns: ['bht ', 'butylated hydroxytoluene'],
    maxPercent: 0.02,
    authority: 'FDA',
    citation: '21 CFR 172.115',
    shortName: 'BHT',
    summary: 'Max 0.02% (200 ppm) of total fat + oil content. Antioxidant.',
  },
  {
    // Round 10 Section 3b.1: trailing-space pattern on the bare 'sulfite '
    // catch-all reduces false-positive risk on substring collisions like
    // "sulfite-free" or "no sulfites added" (which would otherwise inadvertently
    // match the cap). Specific-salt patterns retained for direct matches.
    // Same defensive discipline as the existing 'bha ' / 'bht ' patterns.
    namePatterns: ['sulfite ', 'sodium metabisulfite', 'sodium bisulfite', 'potassium metabisulfite'],
    maxPpm: 100,
    // Round 10 Section 3b.1: declaration-trigger gate per 21 CFR 101.100(a)(4).
    // Fires a separate finding when concentration ≥ 10 ppm — labeling required
    // even though use is legal up to the 100 ppm cap.
    declarationTriggerPpm: 10,
    authority: 'FDA',
    citation: '21 CFR 182.3862; declaration threshold 21 CFR 101.100',
    shortName: 'Sulfites',
    summary: 'Max 100 ppm in finished product as total SO₂. Must declare on label if ≥ 10 ppm (21 CFR 101.100). Prohibited on fresh produce. ALLERGEN concern.',
  },

  // ═════════════════ USDA-FSIS — CURED MEATS ════════════════════════════════
  {
    namePatterns: ['sodium nitrite'],
    // Listed as the active species — direct use
    maxPpm: 156,
    authority: 'USDA-FSIS',
    citation: '9 CFR 424.21',
    shortName: 'Sodium Nitrite',
    summary: 'Max 156 ppm ingoing in most cured/comminuted meats. 120 ppm for pumped bacon. 200 ppm (immersion-cured) or 250 ppm (dry-cured) bacon.',
  },
  {
    namePatterns: ['sodium nitrate', 'potassium nitrate'],
    maxPpm: 1718,
    authority: 'USDA-FSIS',
    citation: '9 CFR 424.21',
    shortName: 'Sodium / Potassium Nitrate',
    summary: 'Dry-cured products only. Max 1,718 ppm ingoing. Prohibited in bacon since 1974.',
  },
  {
    namePatterns: ['prague powder #1', 'insta cure #1', 'cure #1', 'pink salt #1', 'prague #1'],
    maxPercent: 0.25, // 2.5 g/kg meat = 156 ppm nitrite (6.25% × 2500 ppm of cure = 156 ppm nitrite)
    activeFraction: 0.0625,
    activeName: 'sodium nitrite',
    activeMaxPpm: 156,
    authority: 'USDA-FSIS',
    citation: '9 CFR 424.21',
    shortName: 'Prague Powder #1',
    summary: 'Cure blend (93.75% salt + 6.25% NaNO₂). Max 2.5 g/kg meat (0.25%) = 156 ppm nitrite. Used for cooked/smoked products.',
  },
  {
    namePatterns: ['prague powder #2', 'insta cure #2', 'cure #2', 'pink salt #2', 'prague #2'],
    maxPercent: 0.25,
    activeFraction: 0.0625,
    activeName: 'sodium nitrite + nitrate',
    activeMaxPpm: 156,
    authority: 'USDA-FSIS',
    citation: '9 CFR 424.21',
    shortName: 'Prague Powder #2',
    summary: 'Dry-cured blend (89.75% salt + 6.25% NaNO₂ + 4% NaNO₃). Max 2.5 g/kg meat (0.25%). For salami, pepperoni, prosciutto.',
  },
  {
    namePatterns: ['morton tender quick'],
    maxPercent: 1.0, // 1 Tbsp per 1 lb meat. Cure + salt combined.
    activeFraction: 0.005,
    activeName: 'sodium nitrite',
    activeMaxPpm: 156,
    authority: 'USDA-FSIS',
    citation: '9 CFR 424.21',
    shortName: 'Morton Tender Quick',
    summary: 'Consumer-grade cure (salt + sugar + 0.5% nitrite + 0.5% nitrate). Max ~1% of meat (1 Tbsp/lb).',
  },
  {
    namePatterns: ['sodium erythorbate', 'sodium ascorbate'],
    maxPpm: 547,
    authority: 'USDA-FSIS',
    citation: '9 CFR 424.21',
    shortName: 'Erythorbate / Ascorbate',
    summary: 'Cure accelerator / color fixative. Max 547 ppm of finished cured meat product.',
  },
  {
    namePatterns: ['ascorbic acid', 'vitamin c'],
    maxPpm: 547,
    authority: 'USDA-FSIS',
    citation: '9 CFR 424.21',
    shortName: 'Ascorbic Acid (in cures)',
    summary: 'Cure accelerator. Max 547 ppm in cured meat products.',
  },
  {
    namePatterns: ['sodium tripolyphosphate', 'stpp', 'sodium phosphate', 'tetra sodium pyrophosphate', 'pyrophosphate'],
    maxPercent: 0.5,
    authority: 'USDA-FSIS',
    citation: '9 CFR 424.21',
    shortName: 'Phosphates (meat)',
    summary: 'Max 0.5% (5,000 ppm) of finished meat product. Water retention / protein solubilization.',
  },
  {
    namePatterns: ['non-fat dry milk', 'nfdm', 'sodium caseinate'],
    maxPercent: 3.5,
    // Round 10 Section 3b.1: combined-budget aggregation. Binders (dairy) and
    // Binders (soy) share the 3.5% combined cap per 9 CFR 319.140; individual
    // members compliant at 2% each still violate at 4% combined. checkCompliance
    // emits a separate combined-budget finding alongside the per-member findings.
    combinedBudgetGroup: 'meat-binder',
    authority: 'USDA-FSIS',
    citation: '9 CFR 319.140',
    shortName: 'Binders (dairy)',
    summary: 'Max 3.5% combined binder/extender in most meat products per FSIS standard of identity. Shares combined-budget group "meat-binder" with Binders (soy).',
  },
  {
    namePatterns: ['soy protein concentrate', 'soy protein isolate'],
    maxPercent: 3.5,
    combinedBudgetGroup: 'meat-binder',
    authority: 'USDA-FSIS',
    citation: '9 CFR 319.140',
    shortName: 'Binders (soy)',
    summary: 'Max 3.5% combined binder/extender. Counted against total binder budget — shares combined-budget group "meat-binder" with Binders (dairy).',
  },
];

// ----- Compliance checker ---------------------------------------------------

export interface ComplianceFinding {
  /** Name of the ingredient in the formulation. */
  ingredientName: string;
  /** Mass in grams. */
  ingredientGrams: number;
  /** Percent of total formulation weight. */
  currentPercent: number;
  /** Ppm of total formulation (1 ppm = 0.0001%). */
  currentPpm: number;
  /** The limit that applies. */
  limit: RegulatoryLimit;
  /** Utilization vs the limit (100% = at the cap, >100% = over the cap). */
  utilization: number;
  /** Over the legal max? */
  violated: boolean;
  /** For cure blends, the computed active-species ppm in finished product. */
  activeSpeciesPpm?: number;
  /** Whether the ACTIVE species (not the blend) exceeds its max. */
  activeViolated?: boolean;

  // ─── Round 10 Section 3a additions (2026-05-14) ───────────────────────────

  /**
   * Combined-budget aggregate marker. When set, this finding represents the
   * sum-across-members aggregate for a `combinedBudgetGroup`, not a single
   * ingredient. `ingredientName` is the synthesized group label (e.g.
   * "Combined: Binders (dairy) + Binders (soy)"), `ingredientGrams` /
   * `currentPercent` / `currentPpm` are the aggregate totals, and `limit` is
   * the shared cap (members share the same maxPercent / maxPpm). Individual
   * per-member findings remain in the same return array. UI renders both:
   * "each member under its individual cap" plus "combined total exceeds the
   * shared cap" when both conditions co-occur.
   */
  combinedBudget?: {
    /** Group key from RegulatoryLimit.combinedBudgetGroup. */
    group: string;
    /** Ingredient names contributing to this aggregate, in formulation order. */
    memberIngredientNames: string[];
  };

  /**
   * Label-declaration trigger marker. When true, this finding fires because
   * the formulation crossed `declarationTriggerPpm` (a labeling-required
   * threshold) — distinct from `violated` which signals a cap exceedance.
   * For sulfites at 15 ppm: `violated: false` (under 100 ppm cap) +
   * `declarationTriggered: true` (over 10 ppm trigger). For 120 ppm:
   * `violated: true` + a separate `declarationTriggered: true` finding.
   * `utilization` on a declaration-triggered finding is computed against the
   * trigger threshold, not the cap.
   */
  declarationTriggered?: boolean;
}

/**
 * Find the tightest regulatory limit (if any) for an ingredient name.
 * Uses case-insensitive substring match against the limit patterns.
 */
export function findLimit(name: string): RegulatoryLimit | null {
  const lower = name.toLowerCase();
  for (const limit of REGULATORY_LIMITS) {
    if (limit.namePatterns.some(p => lower.includes(p.toLowerCase()))) {
      return limit;
    }
  }
  return null;
}

/**
 * Scan the formulation and return a list of compliance findings
 * for every regulated ingredient. Both compliant (ok) and violated
 * entries are returned so the UI can show status.
 *
 * Round 10 Section 3b.1 (2026-05-14): the return array now includes two
 * additional finding types alongside per-entry findings:
 *
 *   • Declaration-trigger findings (declarationTriggered: true) — fire
 *     when a substance's concentration is at or above its
 *     declarationTriggerPpm threshold, signaling labeling required even
 *     when under the legal cap. Independent of cap violation; both can
 *     fire for the same ingredient.
 *
 *   • Combined-budget findings (combinedBudget: {...}) — fire when 2+
 *     ingredients sharing a combinedBudgetGroup aggregate over the shared
 *     cap. Surfaces alongside the per-member findings so customer-zero
 *     sees both "each member is individually compliant" and "the combined
 *     total exceeds the budget."
 */
export function checkCompliance(
  ingredients: Array<{ name: string; qty: number; unit: string }>
): ComplianceFinding[] {
  const totalMass = ingredients.reduce(
    (s, i) => s + i.qty * (UNIT_TO_GRAMS[i.unit] || 1),
    0
  );
  if (totalMass <= 0) return [];

  const findings: ComplianceFinding[] = [];
  for (const ing of ingredients) {
    const limit = findLimit(ing.name);
    if (!limit) continue;
    const grams = ing.qty * (UNIT_TO_GRAMS[ing.unit] || 1);
    const currentPercent = (grams / totalMass) * 100;
    const currentPpm = (grams / totalMass) * 1_000_000;

    // Primary limit check
    let utilization = 0;
    let violated = false;
    if (limit.maxPercent !== undefined) {
      utilization = (currentPercent / limit.maxPercent) * 100;
      violated = currentPercent > limit.maxPercent;
    } else if (limit.maxPpm !== undefined) {
      utilization = (currentPpm / limit.maxPpm) * 100;
      violated = currentPpm > limit.maxPpm;
    }

    // Active-species secondary check (e.g., Prague Powder contains 6.25% nitrite)
    let activeSpeciesPpm: number | undefined;
    let activeViolated: boolean | undefined;
    if (limit.activeFraction && limit.activeMaxPpm) {
      activeSpeciesPpm = currentPpm * limit.activeFraction;
      activeViolated = activeSpeciesPpm > limit.activeMaxPpm;
    }

    findings.push({
      ingredientName: ing.name,
      ingredientGrams: grams,
      currentPercent,
      currentPpm,
      limit,
      utilization,
      violated: violated || !!activeViolated,
      activeSpeciesPpm,
      activeViolated,
    });
  }

  // ─── Section 3b.1: declaration-trigger gates ────────────────────────────
  // For limits with declarationTriggerPpm set, emit a separate finding when
  // the per-entry concentration is at or above the trigger threshold. This
  // is distinct from a cap violation — a substance can require labeling
  // (declaration-triggered) without exceeding the legal use cap, and a
  // substance over the cap can also separately trigger declaration. Per-
  // entry findings are unchanged; declaration findings are additive.
  const declarationFindings: ComplianceFinding[] = [];
  for (const f of findings) {
    const trigger = f.limit.declarationTriggerPpm;
    if (trigger === undefined) continue;
    if (f.currentPpm < trigger) continue;
    declarationFindings.push({
      ingredientName: f.ingredientName,
      ingredientGrams: f.ingredientGrams,
      currentPercent: f.currentPercent,
      currentPpm: f.currentPpm,
      limit: f.limit,
      utilization: (f.currentPpm / trigger) * 100,
      violated: false, // labeling-required, not a cap violation
      declarationTriggered: true,
    });
  }

  // ─── Section 3b.1: combined-budget aggregation ──────────────────────────
  // Group per-entry findings by limit.combinedBudgetGroup. When 2+ members
  // are present, emit a synthetic finding representing the aggregate mass
  // checked against the shared cap. Per-entry findings remain unchanged.
  const groupMap = new Map<string, ComplianceFinding[]>();
  for (const f of findings) {
    const group = f.limit.combinedBudgetGroup;
    if (group === undefined) continue;
    if (!groupMap.has(group)) groupMap.set(group, []);
    groupMap.get(group)!.push(f);
  }
  const combinedFindings: ComplianceFinding[] = [];
  for (const [group, members] of groupMap) {
    if (members.length < 2) continue; // single-member groups are covered by the per-entry check
    const aggregateGrams = members.reduce((s, m) => s + m.ingredientGrams, 0);
    const aggregatePercent = (aggregateGrams / totalMass) * 100;
    const aggregatePpm = (aggregateGrams / totalMass) * 1_000_000;
    // Members of a combined-budget group share the same cap (operator
    // discipline: all entries tagged into the same group must carry the
    // same maxPercent / maxPpm). The first member's limit is representative.
    const sharedLimit = members[0].limit;
    let utilization = 0;
    let violated = false;
    if (sharedLimit.maxPercent !== undefined) {
      utilization = (aggregatePercent / sharedLimit.maxPercent) * 100;
      violated = aggregatePercent > sharedLimit.maxPercent;
    } else if (sharedLimit.maxPpm !== undefined) {
      utilization = (aggregatePpm / sharedLimit.maxPpm) * 100;
      violated = aggregatePpm > sharedLimit.maxPpm;
    }
    const distinctShortNames = [...new Set(members.map(m => m.limit.shortName))];
    combinedFindings.push({
      ingredientName: `Combined: ${distinctShortNames.join(' + ')}`,
      ingredientGrams: aggregateGrams,
      currentPercent: aggregatePercent,
      currentPpm: aggregatePpm,
      limit: sharedLimit,
      utilization,
      violated,
      combinedBudget: {
        group,
        memberIngredientNames: members.map(m => m.ingredientName),
      },
    });
  }

  return [...findings, ...declarationFindings, ...combinedFindings];
}

/** Utility: formatted percentage for display. */
export function formatAmount(percent: number, ppm: number): string {
  if (percent >= 0.1) return `${percent.toFixed(3)}%`;
  return `${Math.round(ppm)} ppm`;
}
