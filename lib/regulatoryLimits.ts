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
    namePatterns: ['sulfite', 'sodium metabisulfite', 'sodium bisulfite', 'potassium metabisulfite'],
    maxPpm: 100,
    authority: 'FDA',
    citation: '21 CFR 182.3862',
    shortName: 'Sulfites',
    summary: 'Max 100 ppm in finished product as total SO₂. Must declare on label if > 10 ppm. Prohibited on fresh produce. ALLERGEN concern.',
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
    authority: 'USDA-FSIS',
    citation: '9 CFR 319.140',
    shortName: 'Binders (dairy)',
    summary: 'Max 3.5% combined binder/extender in most meat products per FSIS standard of identity.',
  },
  {
    namePatterns: ['soy protein concentrate', 'soy protein isolate'],
    maxPercent: 3.5,
    authority: 'USDA-FSIS',
    citation: '9 CFR 319.140',
    shortName: 'Binders (soy)',
    summary: 'Max 3.5% combined binder/extender. Counted against total binder budget.',
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
  return findings;
}

/** Utility: formatted percentage for display. */
export function formatAmount(percent: number, ppm: number): string {
  if (percent >= 0.1) return `${percent.toFixed(3)}%`;
  return `${Math.round(ppm)} ppm`;
}
