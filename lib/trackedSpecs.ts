// ============================================================
// Tracked Specs — per-formulation spec selection
// ------------------------------------------------------------
// Replaces the old "show every chemistry estimate" pattern with user-controlled
// spec tracking. The formulator picks which specs to track via a checklist UI;
// only tracked specs render on the Spec Analysis panel, Batch Sheet Target Specs,
// and downstream documents. Per-product-type defaults seed the checklist; user
// edits override and persist across product-type changes (with explicit
// "Reset to product-type defaults" affordance).
//
// Confidence taxonomy (Session 1+2+3) decorates only tracked specs. Hidden
// specs aren't rendered at all.
//
// See:
//   memory/project_honest_estimate_reframe.md (architectural reframe)
//   memory/feedback_three_class_value_taxonomy.md (rendering primitives)
//   memory/project_spec_system_multi_product_class.md (future expansion)
// ============================================================

/**
 * The spec metrics the formulator can choose to track. Auto-derived metrics
 * (aceticMoistureRatio, lowAcidComponentPct) are NOT in this list — they
 * surface automatically when their inputs are tracked.
 */
export type TrackedSpec = 'pH' | 'aw' | 'brix' | 'moisture' | 'aceticAcid' | 'bostwick' | 'brookfield';

export interface TrackedSpecDefaults {
  /** Pre-checked at product-type selection time. The formulator can uncheck. */
  tracked: TrackedSpec[];
  /** Visually marked as recommended in the checklist but NOT pre-checked.
   *  Common for professional-judgment specs (Bostwick, Brookfield) that some
   *  formulators track and others don't depending on their downstream brand. */
  suggested: TrackedSpec[];
}

const FALLBACK_DEFAULTS: TrackedSpecDefaults = {
  tracked: ['pH', 'aw', 'brix', 'moisture'],
  suggested: [],
};

// Set A — High-acid pH-driven (sauces, jams, salsa, condiments, baby food)
const SET_A: TrackedSpecDefaults = { tracked: ['pH', 'aw', 'brix'], suggested: ['bostwick'] };

// Set A+ Bostwick — Vinegar-based, Bostwick-typical viscosity
const SET_A_PLUS_BOSTWICK: TrackedSpecDefaults = { tracked: ['pH', 'aw', 'brix', 'aceticAcid'], suggested: ['bostwick'] };

// Set A+ Brookfield — Vinegar-based, Brookfield-typical viscosity (dressings)
const SET_A_PLUS_BROOKFIELD: TrackedSpecDefaults = { tracked: ['pH', 'aw', 'brix', 'aceticAcid'], suggested: ['brookfield'] };

// Set A+ no viscosity — Vinegar-based but viscosity not typically tracked (marinade, pickle brine)
const SET_A_PLUS_NOVISC: TrackedSpecDefaults = { tracked: ['pH', 'aw', 'brix', 'aceticAcid'], suggested: [] };

// Set B — RTD beverages
const SET_B: TrackedSpecDefaults = { tracked: ['pH', 'aw', 'brix'], suggested: ['brookfield'] };

// Set B-thin — Carbonated/alcoholic beverages where aw ≈ 1 not informative
const SET_B_THIN: TrackedSpecDefaults = { tracked: ['pH', 'brix'], suggested: [] };

// Set B-thin+brookfield — Beer/Kombucha (carbonated, fermented, viscosity meaningful for body/mouthfeel)
const SET_B_THIN_BROOKFIELD: TrackedSpecDefaults = { tracked: ['pH', 'brix'], suggested: ['brookfield'] };

// Set C — Low-acid retort/aseptic
const SET_C: TrackedSpecDefaults = { tracked: ['pH', 'aw', 'moisture'], suggested: ['brookfield'] };

// Set D — Refrigerated semi-solid + frozen high-water emulsion (incl. ice cream — frozen
// dessert is a frozen high-water emulsion, not a dry product; Brix is genuinely the primary
// sweetness/formulation spec for frozen desserts)
const SET_D: TrackedSpecDefaults = { tracked: ['pH', 'aw', 'brix', 'moisture'], suggested: ['brookfield'] };

// Set E — Dry / shelf-stable low-water (no Brookfield by default)
const SET_E: TrackedSpecDefaults = { tracked: ['aw', 'moisture'], suggested: [] };

// Set E-paste — Dry low-water but viscous paste (nut butter — Brookfield meaningful)
const SET_E_PASTE: TrackedSpecDefaults = { tracked: ['aw', 'moisture'], suggested: ['brookfield'] };

// Set F — Supplements (uniform aw + moisture; nutraceutical-specific specs flagged future)
const SET_F: TrackedSpecDefaults = { tracked: ['aw', 'moisture'], suggested: [] };

// ─── F&B v1 Bucket defaults (Round 2 directive 2026-05-07) ─────────────────
// Each bucket maps to a single TrackedSpecDefaults entry. The 26 legacy F&B
// product-type entries below are preserved so saved formulations referencing
// hidden product types continue to resolve their original defaults; new
// formulations pick a bucket and get bucket defaults.
const SAUCE_BUCKET: TrackedSpecDefaults = {
  tracked: ['pH', 'aw', 'brix'],
  suggested: ['bostwick', 'aceticAcid'],
};
const DRESSING_BUCKET: TrackedSpecDefaults = {
  tracked: ['pH', 'aw', 'brix'],
  suggested: ['brookfield', 'aceticAcid'],
};
const BEVERAGE_BUCKET: TrackedSpecDefaults = {
  tracked: ['pH', 'aw', 'brix'],
  suggested: ['brookfield', 'aceticAcid'],
};
const DIP_SPREAD_BUCKET: TrackedSpecDefaults = {
  tracked: ['pH', 'aw', 'brix'],
  suggested: ['bostwick'],
};
const PICKLE_FERMENTED_BUCKET: TrackedSpecDefaults = {
  tracked: ['pH', 'aw', 'brix'],
  suggested: ['aceticAcid'],
};
const OTHER_BUCKET: TrackedSpecDefaults = {
  tracked: ['pH', 'aw', 'brix', 'moisture'],
  suggested: ['aceticAcid', 'bostwick', 'brookfield'],
};

const PRODUCT_TYPE_DEFAULTS: Record<string, TrackedSpecDefaults> = {
  // ─── F&B v1 buckets (Round 2 — current dropdown options) ────────────
  'Sauce':              SAUCE_BUCKET,
  'Dressing':           DRESSING_BUCKET,
  'Beverage':           BEVERAGE_BUCKET,
  'Dip/Spread':         DIP_SPREAD_BUCKET,
  'Pickle/Fermented':   PICKLE_FERMENTED_BUCKET,
  'Other':              OTHER_BUCKET,
  // ─── F&B legacy product-type fallbacks (preserved for saved formulations
  //     referencing hidden product types after Round 2's bucket narrowing) ──
  // ─── F&B: Set A (high-acid pH-driven, no acetic acid by formulation) ──
  'Sauce (Pasta / Cooking / Simmer)':                SET_A,
  'BBQ / Steak / Finishing Sauce':                   SET_A,
  'Condiment (Ketchup / Mustard / Mayo)':            SET_A,
  'Jam / Jelly / Preserve / Fruit Spread':           SET_A,
  'Salsa / Chunky Sauce':                            SET_A,
  'Baby Food / Puree':                               SET_A,
  // ─── F&B: Set A+ (vinegar-based) ──────────────────────────────────────
  'Hot Sauce':                                       SET_A_PLUS_BOSTWICK,
  'Salad Dressing / Vinaigrette':                    SET_A_PLUS_BROOKFIELD,
  'Marinade':                                        SET_A_PLUS_NOVISC,
  'Pickle / Fermented Vegetable / Relish':           SET_A_PLUS_NOVISC,
  // ─── F&B: Set B (RTD beverages with informative aw) ──────────────────
  'Beverage — Still Juice (100% / Juice Drink)':     SET_B,
  'Beverage — RTD Tea / Coffee':                     SET_B,
  'Beverage — Functional / Sports / Energy':         SET_B,
  // ─── F&B: Set B-thin (carbonated / alcoholic — aw ≈ 1 uninformative) ──
  'Beverage — Carbonated (CSD / Seltzer)':           SET_B_THIN,
  'Wine / Spirit / Liqueur':                         SET_B_THIN,
  // alcoholPct is the primary spec for Wine/Spirit/Liqueur but doesn't yet
  // exist in the system — flagged in project_spec_system_multi_product_class.md
  'Extract / Flavor / Tincture':                     SET_B_THIN,
  // Beer/Kombucha — Brookfield meaningful for body/mouthfeel
  'Beer / Kombucha / Malt Beverage':                 SET_B_THIN_BROOKFIELD,
  // ─── F&B: Set C (low-acid retort/aseptic) ─────────────────────────────
  'Soup / Broth / Stock (Shelf-Stable)':             SET_C,
  'Shelf-Stable Meal (Retort / Canned)':             SET_C,
  // ─── F&B: Set D (refrigerated semi-solid + frozen emulsion) ────────────
  'Yogurt / Cultured Dairy':                         SET_D,
  'Hummus / Dip / Spread':                           SET_D,
  'Frozen Meal / Entrée':                            SET_D,
  'Ice Cream / Frozen Dessert':                      SET_D,
  // ─── F&B: Set E (dry / low-water) ─────────────────────────────────────
  'Dry Snack (Nuts / Trail Mix / Chips)':            SET_E,
  'Cereal / Granola / Muesli':                       SET_E,
  'Bar (Protein / Granola / Energy)':                SET_E,
  // Set E-paste — viscous paste
  'Nut / Seed Butter':                               SET_E_PASTE,
  // ─── Supplements: Set F (uniform aw + moisture; future-work for tablet/softgel specs) ──
  'Multivitamin (Adult, Daily)':                                 SET_F,
  'Immune Support Stack (Vit C / D / Zn / Elderberry)':          SET_F,
  'Sleep / Relaxation (Melatonin / Mg / Theanine)':              SET_F,
  'Pre-Workout (Caffeine / Citrulline / Beta-Alanine)':          SET_F,
  'Protein Blend (Whey / Casein / Plant)':                       SET_F,
  'Joint Health (Glucosamine / Chondroitin / MSM)':              SET_F,
  "Cognitive / Nootropic (Lion's Mane / L-Theanine / Bacopa)":   SET_F,
  'Gut Health / Probiotic':                                      SET_F,
  'Omega-3 Softgel (Fish / Krill / Algae)':                      SET_F,
  'Collagen Peptides (Unflavored Powder)':                       SET_F,
};

/**
 * Look up tracked-specs defaults for a product type. Returns the system-wide
 * fallback (pH/aw/brix/moisture, no suggestions) when productType is undefined
 * or not in the table.
 */
export function getTrackedSpecDefaults(productType: string | undefined): TrackedSpecDefaults {
  if (!productType) return FALLBACK_DEFAULTS;
  return PRODUCT_TYPE_DEFAULTS[productType] || FALLBACK_DEFAULTS;
}

/** Display label for a TrackedSpec — used in the checklist UI and Spec Analysis panel. */
export const TRACKED_SPEC_LABELS: Record<TrackedSpec, string> = {
  pH:         'pH',
  aw:         'Water Activity (a_w)',
  brix:       'Brix',
  moisture:   'Moisture %',
  aceticAcid: 'Acetic Acid %',
  bostwick:   'Bostwick (cm/30s)',
  brookfield: 'Brookfield (cP est.)',
};

/** Stable display order for the checklist UI — matches typical spec-sheet
 *  ordering (chemistry first, viscosity last). */
export const TRACKED_SPEC_ORDER: TrackedSpec[] = [
  'pH', 'aw', 'brix', 'moisture', 'aceticAcid', 'bostwick', 'brookfield',
];
