// ============================================================
// Shared types for Formulation Wizard
// ============================================================

// ----- Confidence Taxonomy (2026-05-07 architectural reframe) ---------------
// Every numeric value rendered to the user carries a Confidence level and a
// tolerance range. The system is positioned as a starting-estimate engine
// with honest uncertainty bounds; the Process Authority is the legal authority
// that converts estimates into verified specs.
//
// Chemistry-in-formulation is inherently hard to fully predict ahead of physical
// test. Real formulations are multi-variable systems — multi-acid buffering,
// ionic strength, protein amphoterism, particulate effects, batch variability,
// processing shifts — where calculated values are estimates by category, not
// approximations approaching truth. The engine's role is best-effort estimate
// with honest uncertainty bounds plus efficient hand-off to the Process
// Authority who verifies via physical test. MEASURED values (supplier COA,
// lab measurement, USP/FCC/USDA citation) are a different epistemic category
// that physical test produces; the engine does not.
//
// Levels (highest to lowest reliability):
//   • measured   — supplier COA, lab measurement, USP/FCC/USDA citation
//   • calculated — derived via sound math/chemistry from MEASURED inputs
//   • estimated  — approximation method (e.g., log-space H+ pH weighting
//                  without buffer modeling); useful but not chemistry-sound
//   • inferred   — category default / template fallback; no entry-specific basis
//   • unknown    — no value available; surfaced as missing rather than synthesized
//
// Per-metric tolerances live in lib/foodScience.ts (RANGE_TABLE). See
// memory/project_honest_estimate_reframe.md for the full architectural reframe.

export type Confidence = 'measured' | 'calculated' | 'estimated' | 'inferred' | 'unknown';

export interface ValueRange {
  low: number;
  high: number;
}

export interface RangedValue {
  /** The point estimate. */
  value: number;
  /** Bounds at the value's confidence level (clamped to the metric's natural domain). */
  range: ValueRange;
  confidence: Confidence;
  /** Citation for MEASURED; calculation method for CALCULATED; estimation method for ESTIMATED; category/template for INFERRED. */
  source?: string;
  /** Optional further detail on derivation. */
  method?: string;
}

/**
 * Full FDA-style per-serving nutrition profile (values in grams/milligrams
 * per 100g of ingredient; scaled by weight during formulation rollup).
 */
export interface Nutrition {
  calories: number;
  totalFat: number;
  saturatedFat: number;
  transFat: number;
  cholesterol: number;
  sodium: number;
  totalCarbs: number;
  dietaryFiber: number;
  totalSugars: number;
  /**
   * Added Sugars — sugars added during processing or packaging, including
   * sugar (sucrose), HFCS, honey, maple syrup, agave, fruit-juice
   * concentrates beyond what would be from whole fruit/vegetable. Excludes
   * naturally-occurring sugars in fruits, vegetables, dairy.
   *
   * Per FDA 21 CFR 101.9(c)(6)(iii) — mandatory declaration on the
   * Nutrition Facts panel since the 2016 NFP overhaul (final rule effective
   * 2020). Renders as "Includes Xg Added Sugars" sub-line under Total
   * Sugars with %DV against the 50g/day Reference Daily Intake.
   *
   * Catalog-data sourcing per [[catalog-must-be-coa-spec-sheet-anchored]]
   * doctrine: must come from supplier spec sheets / COAs / canonical
   * sources, NOT LLM-typed defaults. Pre-foundation catalog entries
   * have addedSugars unset; render layer treats as 0 (FDA-compliant
   * "0g Added Sugars" declaration) until catalog audit pass populates
   * per ingredient.
   */
  addedSugars: number;
  protein: number;
  vitaminD: number;
  calcium: number;
  iron: number;
  potassium: number;
}

/**
 * Shape of the source-data payload attached to a formulation Ingredient.
 * `type` is a discriminator; `data` can be null when a USDA match was
 * loaded at dropdown time but the canonical record wasn't retained.
 */
export type IngredientSourceData =
  | {
      type: 'industrial';
      data: IndustrialIngredient | null;
      subIngredients: string[];
      allergens: string[];
      costPerKg: number;
      supplier: string;
      nutrition: Partial<Nutrition>;
    }
  | {
      type: 'usda';
      data: FoodResult | null;
      subIngredients: string[];
      allergens: string[];
      costPerKg: number;
      supplier: string;
      nutrition: Partial<Nutrition>;
    };

/**
 * An ingredient as it appears inside a formulation (with quantity).
 */
export interface Ingredient {
  name: string;
  qty: number;
  unit: string;
  /**
   * Holder for the ingredient's source data. Flexible shape because the
   * data can come from our internal industrial DB, USDA FoodData Central,
   * or be user-typed without a source match. Null for ingredients with
   * no source data at all.
   */
  foodData: IngredientSourceData | null;
  subIngredients: string[];
  allergens: string[];
  costPerKg: number;
  supplier: string;
  /**
   * Facility-specific raw-material part number — user enters this per
   * ingredient (their internal ERP / warehouse SKU for the raw material).
   * Per operator directive 2026-05-25 — "User will have their own
   * ingredient number, user edits this field"; not derived from the
   * platform catalog. Optional so legacy formulations without part
   * numbers remain valid; appears as first column on Batch Sheet
   * ingredient table for traceability.
   */
  partNumber?: string;
  /**
   * Transient "Converted from {qty} {unit}" note set when bulk paste coerced an
   * unsupported unit into the mode's allowed set (LB #3 Option C — auto-convert
   * + visible badge). Display-only; surfaces a badge on the ingredient row so
   * the transformation is never silent.
   */
  unitConversionNote?: string;
}

// ============================================================
// Product Class (Round 10 Path A — 2026-05-15)
// ------------------------------------------------------------
// Explicit per-formulation regulatory-context selector that drives
// per-context limit applications, prohibitions, denominator basis,
// and substring-precision scoping in checkCompliance. Required at
// formulation creation per Path A's "no default-uncategorized state"
// discipline (UI enforces; the type field stays optional to support
// migration of existing formulations).
//
// v1 enumeration locked 2026-05-15:
//   • acidified-food — pH ≤ 4.6 acidified-process food (21 CFR 114)
//   • supplement     — dietary supplement (21 CFR 111)
//   • beverage       — drinkable formulation (juices, RTDs, sports drinks)
//   • cured-meat     — non-bacon cured meat (sausage, ham, etc. under 9 CFR 424.21)
//   • bacon          — bacon-specific (nitrite subtype routing + nitrate
//                      prohibition since 1974 — categorically distinct
//                      from non-bacon cured meats)
//   • baked-good     — bread / cake / pastry (propionate cap scope)
//   • fresh-produce  — fresh fruit / vegetable products (sulfite prohibition)
//   • general        — catch-all for formulations not in a regulatorily-
//                      distinct category. Substances without
//                      appliesToCategories restriction still enforce;
//                      productClass-scoped limits don't fire.
//
// Cache-key discipline: any future memoization of compliance findings
// MUST include productClass in the cache key. Changing productClass
// triggers re-evaluation (per Path A change-event behavior).
// ============================================================

export type ProductClass =
  | 'acidified-food'
  | 'supplement'
  | 'beverage'
  | 'cured-meat'
  | 'bacon'
  | 'baked-good'
  | 'fresh-produce'
  | 'general';

/**
 * Runtime tuple of all valid `ProductClass` values, in display order.
 * Use this for UI selector population and for runtime validation.
 * Adding a new value here also extends the `ProductClass` type via the
 * `as const` + indexed-access pattern in consuming code if needed.
 */
export const PRODUCT_CLASSES: ReadonlyArray<ProductClass> = [
  'acidified-food',
  'supplement',
  'beverage',
  'cured-meat',
  'bacon',
  'baked-good',
  'fresh-produce',
  'general',
] as const;

/** Human-readable label for a ProductClass (UI display). */
export const PRODUCT_CLASS_LABEL: Record<ProductClass, string> = {
  'acidified-food': 'Acidified Food',
  'supplement': 'Dietary Supplement',
  'beverage': 'Beverage',
  'cured-meat': 'Cured Meat (non-bacon)',
  'bacon': 'Bacon',
  'baked-good': 'Baked Good',
  'fresh-produce': 'Fresh Produce',
  'general': 'General (no special category)',
};

/**
 * A point-in-time immutable snapshot of a formulation. Stored inside
 * `SavedFormulation.versions[]` to support audit-grade versioning.
 * Never mutated once created — creating a new version appends a new snapshot.
 */
export interface FormulationVersion {
  /** Semantic version (e.g. '1.0.0', '1.0.1', '1.1.0'). Auto-incremented. */
  version: string;
  /** ISO timestamp when this version was created. */
  timestamp: string;
  /** Who made the change (user-entered; defaults to 'system' if unknown). */
  author: string;
  /** Free-text reason for change (e.g., 'Reduced sodium 10% per marketing request'). */
  reasonForChange: string;
  /** Complete snapshot of the formula state at this version. */
  ingredients: Ingredient[];
  servingSize: number;
  servingUnit: string;
  packageSize: number;
  packageUnit: string;
  packagingName?: string | null;
  closureName?: string | null;
  productType?: string | null;
  /**
   * Regulatory product class at this version (Round 10 Path A). Optional
   * in the type for migration of pre-Path-A versions; UI layer enforces
   * required-at-creation for new formulations.
   */
  productClass?: ProductClass;
}

/**
 * A saved formulation record. Holds current state plus full version history.
 */
export interface SavedFormulation {
  id: string;
  name: string;
  /** Which vertical this formulation belongs to (F&B, baking, catering, feeds, sausage, supplements). */
  mode?: 'fb' | 'baking' | 'catering' | 'feeds' | 'sausage' | 'supplements';
  /** Product type name from the mode's PRODUCT_TYPES (e.g. 'Hot Sauce', 'Layer Cake'). */
  productType?: string | null;
  ingredients: Ingredient[];
  servingSize: number;
  servingUnit: string;
  packageSize: number;
  packageUnit: string;
  /** Name of selected container from PACKAGING_DB (null/undefined if none chosen). */
  packagingName?: string | null;
  /** Name of selected closure/dispenser from PACKAGING_DB. */
  closureName?: string | null;
  createdAt: string;
  /** Most recent timestamp at which the current state was saved. */
  lastModified?: string;
  /** Current semantic version string (matches the most recent entry in versions[]). */
  currentVersion?: string;
  /** Full version history, oldest → newest. Empty array if no history logged. */
  versions?: FormulationVersion[];
  /** User-assigned tags for filtering (e.g., 'In Pilot', 'Launched', 'On Hold'). */
  tags?: string[];
  /** Optional project/folder grouping for Saved tab organization. */
  project?: string;
  /** Lifecycle status — drives the Formula Status Bar pill. */
  status?: 'draft' | 'in-pilot' | 'launched' | 'on-hold';
  /**
   * Unique part number / finished-good SKU — auto-generated on first save in the
   * format {MODE}-{YY}-{4-DIGIT-SEQ} (e.g., SUP-26-0001), or a user-overridden
   * value. Appears on every artifact (spec sheet, packaging data sheet, batch
   * sheet, Supplement Facts internal docs) for inventory, QA, ERP, and recall
   * traceability. Stable across versions — the version suffix conveys revisions.
   */
  partNumber?: string;
  /**
   * Regulatory product class (Round 10 Path A — 2026-05-15). Drives per-context
   * limit applications, prohibitions, denominator basis, and substring-precision
   * scoping in checkCompliance. Required-at-creation enforced at the UI layer;
   * field stays optional in the type for migration of pre-Path-A formulations.
   * See PRODUCT_CLASSES tuple for the v1 enumeration.
   */
  productClass?: ProductClass;
  /**
   * PA review history (Round 11 Phase 2 — 2026-05-15). Append-only across the
   * formulation's lifecycle — a formulation accumulates Reviews (initial,
   * post-amendment, annual recertification). Reviews bind to specific
   * FormulationVersion snapshots; multiple reviews can coexist against
   * different versions. The "active" review (currentState in 'draft' |
   * 'submitted') is typically the most recent entry; PDS export consults
   * all reviews to determine if the current formulationVersion has an
   * approved or version_locked review. See
   * docs/architecture/pa-review-state-machinery-proposal.md for the full
   * schema + state-machine spec, and lib/reviewState.ts for the validator
   * and transition-log helpers.
   */
  reviews?: Review[];
  /**
   * Per-ingredient identity-test attestations (Round 11 Phase 2 Step 4 —
   * §B3 + §B11 Bucket 1 keystone subset, 2026-05-17). Forward-compatible
   * storage location declared at Round 11; persistence layer wires in
   * Round 12 alongside Reviews. The §B3 gate consumes attestations via
   * `identityTestInput` on SupplementBucket1GateParams, not by reading
   * this field directly. See types/index.ts IdentityTestAttestation for
   * the entity schema and lib/identityTest.ts for the gate evaluator.
   */
  attestations?: IdentityTestAttestation[];
}

// ============================================================
// PA REVIEW STATE MACHINERY (Round 11 Phase 2 — 2026-05-15)
// ------------------------------------------------------------
// 4-state + rejection workflow for Process Authority review of a
// formulation version. Distinct from SavedFormulation.status
// (lifecycle: draft / in-pilot / launched / on-hold) and from
// FormulationVersion (immutable point-in-time snapshot).
//
// See docs/architecture/pa-review-state-machinery-proposal.md for
// the design rationale and state-machine spec.
// See lib/reviewState.ts for validateTransition() and
// appendTransition() — pure helpers that enforce the state machine
// + append-only transition log.
// ============================================================

/**
 * PA-review workflow state. Transitions validated by
 * lib/reviewState.ts validateTransition().
 *
 *   • draft           — operator editing
 *   • submitted       — handed to PA for review
 *   • approved        — PA signed off; formulation review-locked
 *   • rejected        — PA rejected; returns to draft for revision
 *   • version_locked  — final immutable snapshot; PDS export proceeds.
 *                        TERMINAL — no transitions out.
 */
export type ReviewState =
  | 'draft'
  | 'submitted'
  | 'approved'
  | 'rejected'
  | 'version_locked';

/**
 * Append-only log entry capturing a single state transition. Every
 * transition is logged — never overwritten — to preserve the full audit
 * trail of a review's journey. The transition log is the SINGLE source
 * of truth for actor identity at every state change (no separate
 * Review-level reviewerId / reviewerName fields).
 */
export interface ReviewTransition {
  /** ISO timestamp of the transition. */
  timestamp: string;
  /** Identifier of the actor who triggered the transition. User name for
   *  operator/PA; 'system' for auto-transitions. */
  actor: string;
  /** Role of the actor. */
  actorRole: 'operator' | 'pa' | 'system';
  /** State transitioned FROM. */
  fromState: ReviewState;
  /** State transitioned TO. */
  toState: ReviewState;
  /** Optional free-text comment. REQUIRED on rejection (submitted →
   *  rejected) and on invalidation (approved → draft) — see
   *  validateTransition() rules. */
  comment?: string;
  /** Optional FormulationVersion the Review was bound to at the moment
   *  this transition fired. Captured on transitions that change which
   *  version is under review (typically `submitted` and `approved`).
   *  Provides per-transition audit-trail granularity beyond the Review's
   *  top-level `formulationVersion` field, which only reflects the most
   *  recent submit/approve target. */
  formulationVersion?: string;
}

/**
 * PA review entity. Separate from SavedFormulation per Round 11 directive
 * ("Separate review entity, not state-on-formulation. A formulation can
 * have multiple reviews over its lifecycle.").
 *
 * Stored as `reviews?: Review[]` on SavedFormulation (co-located in the
 * storage record but conceptually separate, matching the
 * `versions?: FormulationVersion[]` pattern). Future Supabase migration
 * splits into a dedicated `reviews` table referencing `formulations.id`.
 */
export interface Review {
  /** Stable UUID for this review. Distinct from formulationId. */
  id: string;
  /** References SavedFormulation.id. */
  formulationId: string;
  /**
   * References the FormulationVersion.version this Review is currently
   * bound to. Tracks the most-recently-submitted-or-approved
   * FormulationVersion; updated on each `submitted` and `approved`
   * transition. Initial value is the FormulationVersion present when the
   * Review was created in `draft` state.
   *
   * Why updated on submit/approve: a Review can pass through multiple
   * draft→submitted→rejected→draft cycles before final approval, and the
   * formulation may be edited between cycles (creating new
   * FormulationVersions). The Review's `formulationVersion` field always
   * names the version the PA is currently reviewing or has most recently
   * approved — never a stale earlier version.
   */
  formulationVersion: string;
  /** Current state. Denormalized for convenience —
   *  `transitions[N-1].toState` is the authoritative source of truth. */
  currentState: ReviewState;
  /** Ordered transition log. Append-only. `transitions[0]` is the
   *  creation entry. */
  transitions: ReviewTransition[];
  /** ISO timestamp when the review was created
   *  (== transitions[0].timestamp). */
  createdAt: string;
  /** ISO timestamp of the most recent transition. */
  lastTransitionAt: string;
  /** Free-text reason for the review (e.g., "Initial release",
   *  "Post-amendment per CR-2026-09", "Annual recertification"). */
  reason?: string;
}

// ============================================================
// §B3 + §B11 BUCKET 1 — IDENTITY-TEST ATTESTATION SCHEMA
// (Round 11 Phase 2 Step 4 — 2026-05-17)
// ------------------------------------------------------------
// Companion Spec §B3 (identity-test attestation per dietary
// ingredient, 21 CFR 111.75(a)(1)) requires the Bucket 1 portion
// of §B11 (record-keeping schema + COA-to-identity-test linkage)
// to function. This block defines the §B11 Bucket 1 subset
// schema; lib/identityTest.ts owns the §B3 gate evaluator that
// consumes it.
//
// Round 11 scope: schema + in-memory data model + gate logic.
// Persistence (localStorage / Supabase), operator UI for entry,
// COA file upload, supplier registry, lot tracking, method-
// appropriateness check per ingredient class — all deferred to
// Round 12+ per docs/architecture/harm-critical-floor.md §B3.
// ============================================================

/**
 * Per-ingredient identity-test attestation. Operator declares that a
 * supplier-provided identity test was performed for the dietary
 * ingredient per 21 CFR 111.75(a)(1). The platform records the
 * attestation; PA verifies the substance (supplier appropriateness,
 * method appropriateness, COA accuracy, test-result conformance).
 *
 * Round 11 scope: schema + in-memory data model + gate composition.
 * Round 12: persistence layer + operator UI flow + COA file storage
 * land. Forward-compatible storage location is declared at
 * SavedFormulation.attestations.
 *
 * INTEGRITY MODEL — do not let this drift:
 *   The presence of an attestation record is NOT evidence that the
 *   test was actually performed. Operator can fabricate. PA review
 *   is the integrity check. The §B3 gate at lib/identityTest.ts
 *   enforces existence and structural correctness ONLY:
 *     • Every required dietary ingredient has at least one
 *       attestation record on file
 *     • Required fields are populated and well-formed
 *     • Timestamps are structurally plausible (not in the future,
 *       not implausibly old)
 *   The gate does NOT validate substance:
 *     • Whether the supplier is real and appropriate (PA)
 *     • Whether the supplier provides quality identity testing (PA)
 *     • Whether the method is appropriate for the ingredient class (PA)
 *     • Whether COA content matches ingredient specs (PA, Round 12+)
 *     • Whether the attestation is honest and accurate (PA)
 *   Software detects "missing or malformed"; human authority validates
 *   "appropriate and accurate". Future readers — including AI
 *   assistants — must respect this boundary. See
 *   docs/architecture/harm-critical-floor.md §B3 for the full
 *   automated-vs-PA verification boundary.
 */
export interface IdentityTestAttestation {
  /** Stable UUID for this attestation. */
  id: string;
  /**
   * Ingredient name this attestation covers. Linked by name in Round 11
   * (workspace ingredients don't yet carry stable IDs); Round 12+ schema
   * firming may migrate to ingredient UUIDs.
   *
   * Subtle behavior: if the operator renames an ingredient, the linkage
   * here breaks and the §B3 gate refuses on "no attestation for renamed
   * ingredient". This is the CORRECT behavior — a rename is a different
   * ingredient identity from the gate's perspective and forces re-
   * attestation. Document on any rename-handling UI.
   */
  ingredientName: string;
  /** Supplier of the dietary ingredient. Gate validates non-empty + ≥2 chars
   *  (structural); PA validates supplier appropriateness (substance). */
  supplierName: string;
  /** Identity-test method declared per 21 CFR 111.75(a)(1). Free-text in
   *  Round 11; Round 12+ may enforce against a known-method list (FTIR,
   *  HPLC, HPTLC, organoleptic, DNA barcoding, etc.) with per-ingredient-
   *  class appropriateness mapping. Gate validates non-empty (structural);
   *  PA validates method appropriateness (substance). */
  identityTestMethod: string;
  /** ISO timestamp when the operator created the attestation record.
   *  Gate validates structural plausibility (parseable, not in the future
   *  beyond clock-skew grace window, not before 2000-01-01 implausibility
   *  floor); PA validates that the timestamp reflects a real test event. */
  attestedAt: string;
  /** Operator identifier (user name). Gate validates non-empty. */
  attestedBy: string;
  /** Optional ISO timestamp of when the underlying identity test was
   *  performed (typically earlier than attestedAt). When provided, gate
   *  enforces structural ordering: testPerformedAt ≤ attestedAt and not
   *  malformed. */
  testPerformedAt?: string;
  /** Optional COA reference — Round 11 is a string locator (filename,
   *  supplier doc ID, external URL); Round 12+ ties to actual file
   *  storage and content validation. */
  coaReference?: string;
  /** Optional ingredient lot ID this attestation covers. Round 11 has
   *  no lot-tracking schema; this field is declarative documentation of
   *  intent for Round 12+ lot schema work. */
  lotId?: string;
}

/**
 * A USDA FoodData Central search result row.
 */
export interface FoodResult {
  fdcId: number;
  description: string;
  brandName?: string;
  ingredients?: string;
  /**
   * USDA FoodData Central nutrient rows. Shape varies by source database
   * (Branded, SR Legacy, Foundation, Experimental, Survey FNDDS).
   * We only access `nutrientName` and `value` fields.
   */
  foodNutrients: Array<{
    nutrientId?: number;
    nutrientName?: string;
    nutrientNumber?: string;
    unitName?: string;
    value?: number;
    derivationCode?: string;
    derivationDescription?: string;
  }>;
}

/**
 * Third-party sustainability / certification profiles that a supplier or
 * ingredient SKU may hold. Expressed as a union of kebab-case keys.
 */
export type SustainabilityCert =
  // Organic / GMO
  | 'usda-organic'
  | 'eu-organic'
  | 'non-gmo-verified'
  // Sector-specific sustainability
  | 'rspo-segregated'       // palm oil
  | 'rspo-mass-balance'
  | 'msc'                   // wild seafood
  | 'asc'                   // farmed aquaculture
  | 'fair-trade-usa'
  | 'fair-trade-international'
  | 'rainforest-alliance'
  | 'utz'
  | 'bonsucro'              // sugar cane
  | 'proterra'              // non-GMO + sustainable soy
  | 'fsc'                   // paper / wood packaging
  | 'b-corp'                // whole-company
  | 'carbon-neutral'        // Climate Partner / BSI PAS 2060
  // Kosher / halal / dietary
  | 'kosher'
  | 'halal'
  | 'gluten-free'
  | 'vegan'
  // Quality / food safety
  | 'cgmp'
  | 'fssc-22000'
  | 'brc'
  | 'sqf'
  | 'gfsi'
  | 'usp'
  | 'nsf';

/**
 * GMO risk level based on commonly GMO-derived commodity crops.
 * - 'high'   : corn, soy, canola, cotton, sugar beet, alfalfa, papaya, certain apples/potatoes
 *              and their derivatives (HFCS, soy lecithin, canola oil, sugar, etc.)
 * - 'medium' : derivatives where source isn't always specified (dextrose, lecithin, "vegetable oil")
 * - 'low'    : crops rarely or never genetically modified at commercial scale (wheat, rice,
 *              oats, barley, most spices, most fruits)
 * - 'none'   : inorganic / synthetic ingredients that cannot be GMO (salt, minerals, vitamins).
 */
export type GmoRisk = 'high' | 'medium' | 'low' | 'none';

/**
 * Functional / bioactive role(s) an ingredient plays in nutraceutical formulation.
 * One ingredient can carry multiple roles (e.g., turmeric is anti-inflammatory + antioxidant +
 * polyphenol). Drives the Nutraceuticals workspace's "surface by intended benefit" filter.
 * Empty/undefined on an entry means the ingredient is conventional food, not functional.
 */
export type FunctionalRole =
  | 'antioxidant'
  | 'anti-inflammatory'
  | 'prebiotic'
  | 'probiotic'
  | 'postbiotic'
  | 'adaptogen'
  | 'nootropic'
  | 'omega-3'
  | 'omega-6'
  | 'medium-chain-triglyceride'
  | 'electrolyte'
  | 'fiber'
  | 'protein-isolate'
  | 'bioactive-peptide'
  | 'polyphenol'
  | 'flavonoid'
  | 'carotenoid'
  | 'phytosterol'
  | 'beta-glucan'
  | 'enzyme'
  | 'immune-support'
  | 'cardiovascular-support'
  | 'blood-sugar-support'
  | 'cognitive-support'
  | 'joint-support'
  | 'bone-support'
  | 'gut-health'
  | 'liver-support'
  | 'urinary-tract-support'
  | 'prostate-support'
  | 'womens-health'
  | 'skin-hair-nails'
  | 'vision-support'
  | 'sports-performance'
  | 'weight-management'
  | 'hydration'
  | 'low-glycemic-sweetener'
  | 'natural-colorant'
  | 'energy-stimulant'
  | 'sleep-support'
  | 'mood-support';

/**
 * One bioactive compound present in the ingredient at a meaningful, declared level.
 * Used for label substantiation, dose calculation, Supplement Facts panel rendering,
 * and (via isMarkerCompound) identity-test enforcement under Companion Spec §B3.
 */
export interface Bioactive {
  /** Compound name as it would appear on a CoA or pharmacopeial monograph
   *  (e.g., "Curcuminoids", "Withanolides", "EGCG", "Phycocyanin", "Punicalagins"). */
  compound: string;
  /** Declared amount per 100 g of ingredient (or per 100 mL for liquids). */
  amountPer100g: number;
  /** Unit of the declared amount. CFU is for live cultures (probiotics). */
  unit: 'mg' | 'g' | 'mcg' | 'IU' | 'CFU';
  /** Assay method used to obtain this value (e.g., "HPLC-UV", "qPCR", "ICP-MS",
   *  "UV-Vis 415nm"). Optional — whole-food entries often have no specific method. */
  assayMethod?: string;
  /**
   * Whether this is THE standardization marker compound used for identity & potency.
   * Examples: curcuminoids for turmeric extract, withanolides for ashwagandha,
   * EGCG for green tea extract, punicalagins for pomegranate extract.
   *
   * Identity-test enforcement (Companion Spec §B3, harm-critical Bucket 1) tests
   * against marker compounds, NOT secondary bioactives that may also be present.
   * Standardized extracts should have exactly ONE marker; whole-food powders
   * typically have ZERO markers (every bioactive is informational).
   */
  isMarkerCompound: boolean;
}

/**
 * Whether the ingredient retains identity, potency, and sensory profile in a given
 * formulation matrix. Drives ingredient-vs-format compatibility checks during recipe
 * construction (e.g., warns if a heat-labile probiotic is added to a hot-fill beverage).
 */
export type MatrixCompatibility =
  | 'acid-stable'         // OK in pH < 4 beverages (juice, kombucha, vinegar drinks)
  | 'heat-stable'         // OK through HTST/UHT pasteurization or baking
  | 'fat-soluble'         // requires lipid carrier or emulsifier in aqueous matrix
  | 'water-soluble'       // dissolves cleanly in aqueous beverages
  | 'water-dispersible'   // suspends but doesn't dissolve (typically with emulsifier coating)
  | 'oxygen-sensitive'    // requires N2-flush or oxygen-barrier packaging
  | 'light-sensitive'     // requires opaque or amber packaging
  | 'freeze-stable'       // OK in frozen products
  | 'dry-blend-only';     // unstable in any liquid matrix; capsules/powders only

/**
 * Typical formulation usage rate as percent of finished-product weight.
 *   { typicalPct: 0.5, minPct: 0.1, maxPct: 2.0 } → 0.1–2% range, 0.5% typical.
 * Guideline only — does NOT override safety limits enforced by lib/supplementSafetyLimits.ts
 * (UL ceilings). UL is a safety hard-stop; usageRange is a formulation starting point.
 */
export interface UsageRange {
  typicalPct: number;
  minPct: number;
  maxPct: number;
}

/**
 * Regulatory classification under FDA (and select international) frameworks.
 * REQUIRED on every entry for PA review packets and for NDI/ODI enforcement
 * (Companion Spec §B3 identity-test, §B8 NDI classification).
 *
 *  - 'GRAS'                          : FDA-affirmed Generally Recognized As Safe (21 CFR 182, 184)
 *  - 'GRAS-self-affirmed'            : industry-determined GRAS via expert panel, not FDA-reviewed
 *  - 'NDI-notified'                  : New Dietary Ingredient with FDA notification on file
 *  - 'NDI-required-not-notified'     : appears to require NDI notification but none filed — DO-NOT-USE
 *  - 'food-additive'                 : FDA-approved food additive (21 CFR 172, 173)
 *  - 'color-additive'                : FDA-approved color additive (21 CFR 73, 74)
 *  - 'dietary-ingredient-pre-DSHEA'  : marketed in U.S. as dietary ingredient before Oct 15, 1994
 *                                       (DSHEA grandfather; presumed lawful as dietary ingredient)
 *  - 'EU-novel-food-cleared'         : approved under EU Novel Food Regulation 2015/2283
 *  - 'pending'                       : under review — DO-NOT-SHIP until classification confirmed
 */
export type RegulatoryStatus =
  | 'GRAS'
  | 'GRAS-self-affirmed'
  | 'NDI-notified'
  | 'NDI-required-not-notified'
  | 'food-additive'
  | 'color-additive'
  | 'dietary-ingredient-pre-DSHEA'
  | 'EU-novel-food-cleared'
  | 'pending';

/**
 * Authoritative pharmacopeial monograph(s) anchoring this ingredient's identity & spec.
 * PA reviewers treat these as documentation trail for identity-test acceptance criteria.
 *
 * Convention: include the edition/version when applicable, e.g.:
 *   "USP-NF"     "USP-NF 2024"     "FCC 13"     "EP 11.0"     "JP 18"
 *   "AHP"        American Herbal Pharmacopoeia (botanicals)
 *   "WHO"        WHO monographs on selected medicinal plants
 *
 * Single string for one monograph; array for ingredients with multiple authoritative refs.
 * Empty/undefined = no monograph (typical for whole-food powders, proprietary
 * fermentation products, novel ingredients).
 */
export type PharmacopeialReference = string;

/**
 * Variant CoA template applicable to this ingredient — drives the Companion Spec §B11
 * Customer-CoA upload + identity-test linkage build (harm-critical Bucket 1).
 * Each template type defines the required fields, acceptance ranges, and contaminant
 * panel that the CoA parser must validate against.
 *
 *  - 'extract'                : standardized botanical/herbal extract (marker-compound assay)
 *  - 'isolate'                : ≥95% pure single compound (e.g., resveratrol 98%, EGCG 95%)
 *  - 'protein-fraction'       : whey/casein/pea/collagen — proximate, AA profile, PDCAAS/DIAAS,
 *                               dispersibility, foam stability, heavy metals
 *  - 'oil-product'            : fish/krill/MCT/algal/phospholipids — FA profile (GC-FID),
 *                               PV, AV, totox, OSI, marine contaminants (PCBs/dioxins)
 *  - 'probiotic-strain'       : strain ID (qPCR), CFU count, identity at species + strain level
 *  - 'juice-concentrate'      : Brix, titratable acidity, color, polyphenol/anthocyanin assay
 *  - 'whole-food-powder'      : mesh size, moisture, microbial; no marker compound expected
 *  - 'bee-product'            : authenticity (NMR / melissopalynology), HMF, antibiotic residues
 *  - 'fermentation-derivative': producing organism, residual substrate, endotoxin, identity
 *  - 'mineral-salt'           : elemental %, heavy metals, particle size, salt form (chelate/oxide/etc.)
 *  - 'vitamin-form'           : potency (IU or %), carrier identification, oxidation indicators
 */
export type CoaTemplateType =
  | 'extract'
  | 'isolate'
  | 'protein-fraction'
  | 'oil-product'
  | 'probiotic-strain'
  | 'juice-concentrate'
  | 'whole-food-powder'
  | 'bee-product'
  | 'fermentation-derivative'
  | 'mineral-salt'
  | 'vitamin-form';

/**
 * Documented drug-class interaction for an ingredient — surfaced prominently in the
 * workspace as a contraindication warning (not buried in notes). Severity 'major' = hard
 * contraindication; 'moderate' = caution + medical supervision; 'minor' = informational.
 *
 * Used by the Nutraceuticals workspace to render drug-interaction warnings when the
 * ingredient is added to a formulation, and by the §B12 PA-review packet to flag
 * harm-critical interactions for explicit reviewer sign-off. Populate ONLY when a
 * documented interaction exists; absence is not "verified safe" (absence of evidence is
 * not evidence of absence).
 */
export interface DrugInteraction {
  /** Drug class (or specific drug name) the interaction concerns
   *  (e.g., "MAO Inhibitors", "Warfarin", "CYP3A4 substrates"). */
  drugClass: string;
  /** Severity tier driving workspace warning prominence:
   *   'major'    = contraindicated / hard stop / DO-NOT-COMBINE;
   *   'moderate' = use only under medical supervision;
   *   'minor'    = informational / monitor for effects. */
  severity: 'major' | 'moderate' | 'minor';
  /** Mechanism of interaction, if known
   *  (e.g., "L-DOPA + MAOI = hypertensive crisis", "CYP3A4 induction"). Optional. */
  mechanism?: string;
  /** Patient-facing or formulator-facing detail / clinical guidance. */
  notes: string;
}

/**
 * A record from the internal industrial ingredient database —
 * one row per SKU, with top suppliers, sub-ingredients, allergens,
 * approximate cost, and per-100g nutrition.
 *
 * Sustainability fields are all optional and default to conservative values
 * when absent (gmoRisk='low', organicAvailable=false, no certs).
 *
 * Functional/nutraceutical fields (functionalRole, bioactives, matrixCompatibility,
 * usageRange, regulatoryStatus, pharmacopeialReference, coaTemplateType) are optional
 * but are REQUIRED for any ingredient surfaced in the Nutraceuticals workspace.
 */
// ─── World-class catalog schema (2026-06-17 schema-fields directive) ─────────
// Additive + optional — zero breakage. Population is the gated curation phase
// (verified per Rulebook §I.2 / §I.4, never bulk). Ratified 2026-06-17.
// See docs/architecture/catalog-schema-fields-directive-2026-06-17.md.

/** §I.4 — confidence taxonomy (5 levels, increasing certainty). */
export type ConfidenceLevel =
  | 'Verified-Lab'
  | 'Verified-Supplier-COA'
  | 'Estimated'
  | 'Inferred'
  | 'Undocumented';

/** §III.16 — value/premium/specialty tier. The structured home for the data
 *  legacy "Tier-A/B" markers leaked into display names (§II.9). */
export type CatalogTier = 'value' | 'premium' | 'specialty';

/** §I.2 — structured citation. `authority` is free-form ('IOM (NAM)', 'USP',
 *  'FDA'); `tier` is the §I.2 authority tier (1 = US federal reg … 7 = industry
 *  consensus); `source` carries the version inline per §I.2 ('DRI 2001, Table
 *  3-1'); `retrievedAt` anchors per-citation freshness for the §28 review-decay
 *  cadence. */
export interface CatalogCitation {
  authority: string;
  source: string;
  tier: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  retrievedAt?: string; // ISO date
}

/** §I.5a — heavy-metal contaminants flagged at the class level. The catalog
 *  flags the vector; it does NOT certify content (a finished-product COA to
 *  USP <232> is the only certification path). Classifier:
 *  lib/heavyMetalVectors.ts. */
export type HeavyMetal = 'Pb' | 'As' | 'Cd' | 'Hg';

export interface IndustrialIngredient {
  name: string;
  category: string;
  suppliers: string[];
  subIngredients: string[];
  allergens: string[];
  costPerKg: number;
  nutrition: Partial<Nutrition>;
  notes: string;

  /**
   * Alternate consumer-facing names that bulk-paste should resolve to this
   * entry. Established 2026-05-17 (Wave 1.5a) — rulebook §II.8a makes this
   * field mandatory for catalog entries added from Wave 1.5 forward, and
   * §IX.40 checklist item 16 requires ≥ 2 alternate names per new entry.
   *
   * Bulk-paste parser (lib/parseFormula.ts findBestMatchWithTier) consults
   * synonyms after the exact-catalog-name check. Operator input and each
   * synonym are normalized at match time via normalizeIngredientName:
   * lowercased, parenthetical qualifiers stripped, dashes/slashes mapped to
   * whitespace, punctuation removed, whitespace collapsed. This lets a
   * synonym entry "folate" match operator paste "Folate", "FOLATE", "folic
   * acid", "Folic Acid (synthetic)", "folic-acid", etc.
   *
   * Storage convention: lowercase strings as a human would naturally type
   * them. The parser handles variant normalization; the array stays small
   * and readable (e.g., ['folate', 'folic acid', 'vitamin b9', 'b9']).
   * Do NOT enumerate every capitalization variant.
   *
   * Catalog entries authored BEFORE Wave 1.5 do not (yet) carry synonyms;
   * the backfill commit (sub-commit 1.5b) addresses the gap on existing
   * entries the bulk-paste-discovery audit surfaced.
   */
  synonyms?: string[];

  // ─── Sustainability & sourcing metadata (optional) ─────────────────────
  /** Whether a USDA Organic / EU Organic variant is commercially available. */
  organicAvailable?: boolean;
  /** Price premium for the organic variant vs. conventional (e.g. 1.45 = 45% more). */
  organicPricePremium?: number;
  /** Inherent GMO exposure risk based on source crops/derivatives. */
  gmoRisk?: GmoRisk;
  /** Whether a Non-GMO Project Verified variant is commercially available. */
  nonGmoAvailable?: boolean;
  /** Sustainability / sector certifications available for this ingredient category. */
  sustainabilityCerts?: SustainabilityCert[];
  /** Estimated cradle-to-gate carbon footprint (kg CO2e per kg of ingredient). */
  carbonKgCo2ePerKg?: number;
  /** Estimated water footprint (liters per kg of ingredient, blue+green). */
  waterLitersPerKg?: number;
  /** Country of primary origin / growth region (ISO 2-letter or common name). */
  originCountry?: string;

  /**
   * Fraction (0-1) of ingredient mass that is the labeled active — for carrier-
   * loaded supplement SKUs where the ingredient is on a filler matrix.
   *   Examples:
   *     "Vitamin D3 Cholecalciferol (100,000 IU/g on MCC)" → 0.0025
   *       (100,000 IU/g = 2.5 mg/g active = 0.25% of mass)
   *     "Vitamin A Palmitate (500,000 IU/g)"                → 0.15
   *     "Beta-Carotene 20% (Dunaliella / CWS)"              → 0.20
   *     "Vitamin B12 (Cyanocobalamin 1% on Mannitol)"       → 0.01
   *     "Vitamin K2 MK-7 (Natto, 0.2% on MCC)"              → 0.002
   *   Undefined / 1 means 100% active (the ingredient mass IS the active mass).
   *   Used by the Supplement Facts engine and UL safety checker to convert
   *   ingredient mass into active mass before %DV and UL comparisons.
   */
  potencyFactor?: number;

  // ─── Cost provenance (2026-05-07 confidence taxonomy) ─────────────────
  /**
   * Source of the costPerKg value. Drives cost-class confidence rendering on
   * the spec-sheet Target Cost row and downstream rollups (formula totals,
   * per-package, per-serving). Undefined defaults to 'industry-typical' for
   * scaffolded ingredients (the vast majority of the database today).
   *   • verified-quote   — explicit supplier quote with a known capture date
   *                        → MEASURED while within costValidUntil, ESTIMATED past
   *   • industry-typical — AI-estimate / commodity-pricing scaffolding → ESTIMATED
   *   • category-default — extrapolated from category mean → INFERRED
   */
  costSource?: 'verified-quote' | 'industry-typical' | 'category-default';
  /**
   * ISO date (YYYY-MM-DD) when a 'verified-quote' costPerKg expires. After this
   * date the value auto-downgrades to ESTIMATED ('stale quote'). Default
   * staleness when ingesting new quotes is 60 days from capture. Has no effect
   * for sources other than 'verified-quote'.
   */
  costValidUntil?: string;

  // ─── Functional / nutraceutical metadata (optional) ────────────────────
  /**
   * One or more functional roles this ingredient serves. Used by the Nutraceuticals
   * workspace to surface ingredients by intended benefit. Empty/undefined = conventional
   * food, not functional. An ingredient may carry several roles.
   */
  functionalRole?: FunctionalRole[];
  /**
   * Declared bioactive compounds present at meaningful levels. Used for label
   * substantiation, dose calculation, Supplement Facts rendering, and (with
   * isMarkerCompound) identity-test enforcement under Companion Spec §B3.
   */
  bioactives?: Bioactive[];
  /**
   * Matrices in which this ingredient retains identity, potency, and sensory
   * profile. Drives ingredient-vs-format compatibility warnings during recipe
   * construction.
   */
  matrixCompatibility?: MatrixCompatibility[];
  /**
   * Typical formulation usage rate as % of finished product. Guideline only —
   * does NOT override UL safety ceilings enforced by lib/supplementSafetyLimits.ts.
   */
  usageRange?: UsageRange;
  /**
   * FDA (and select international) regulatory classification. Required by PA review
   * packets and by NDI/ODI enforcement (Companion Spec §B3, §B8). Values
   * 'NDI-required-not-notified' and 'pending' block use of the ingredient.
   */
  regulatoryStatus?: RegulatoryStatus;
  /**
   * Authoritative pharmacopeial monograph(s) anchoring this ingredient's spec.
   * Single string for one monograph, array for multiple. Used as documentation
   * trail in PA review packets. Empty/undefined = no monograph.
   */
  pharmacopeialReference?: PharmacopeialReference | PharmacopeialReference[];
  /**
   * Which CoA template variant applies to this ingredient. Drives §B11 CoA
   * upload parser field selection and acceptance criteria. Cheap to set now,
   * expensive to retrofit across ~1000 entries later.
   */
  coaTemplateType?: CoaTemplateType;
  /**
   * Documented drug-class interactions for this ingredient. Surfaced prominently in the
   * Nutraceuticals workspace as contraindication warnings (not buried in notes), and
   * flagged in §B12 PA-review packet for explicit reviewer sign-off on major-severity
   * interactions. Populate ONLY when a documented interaction exists; absence is NOT
   * "verified safe."
   */
  drugInteractions?: DrugInteraction[];

  // ─── World-class schema fields (2026-06-17 directive; §II.8 migration Step 1) ──
  // All optional + additive. Absent = UNDOCUMENTED per §I.5 honesty-first, never
  // a fabricated/safe-looking value. Populated only by verified curation, never bulk.
  /** §I.4 confidence level for this entry's load-bearing values. */
  confidenceLevel?: ConfidenceLevel;
  /** §III.16 value/premium/specialty tier (structured home for legacy "Tier-A/B"). */
  tier?: CatalogTier;
  /** §I.2 structured citations (≥ 1 Tier-1–4 is the §I.6 90% bar). */
  citation?: CatalogCitation[];
  /** §14a canonical identifiers — verified, NEVER bulk-inferred (a wrong ID is a
   *  confident lie). Per-substance for UNII (not per-SKU); USP-Latin Nate-gated
   *  for botanicals. Absent = UNDOCUMENTED, never a guess. */
  canonicalIdUnii?: string;
  canonicalIdUspLatin?: string;
  canonicalIdGtin?: string;
  /** §28 + §II.8 Gap #4 — review cadence (covers all harm-critical fields). */
  lastReviewedDate?: string; // ISO date
  reviewedBy?: string;
  /** §I.5 + §II.8 Gap #6 — allergen-investigation flag pair. `allergensInvestigated:
   *  true` + `allergensFound: []` is the ONLY way to render "no major allergens";
   *  empty/absent stays UNDOCUMENTED, never VERIFIED-SAFE. */
  allergensInvestigated?: boolean;
  allergensFound?: string[];
  /** §I.5a — per-entry heavy-metals override. `'verified-clean'` is a positive
   *  COA-verified datum (distinct from absence-of-flag); an array overrides the
   *  classifier's class-level default. Absent = classifier default applies. */
  heavyMetalsVectorOverride?: HeavyMetal[] | 'verified-clean';

  /**
   * FALCPA §203(b)(2) highly-refined-oil exemption status per
   * [[falcpa-highly-refined-oil-exemption]] doctrine 2026-05-25.
   * Three-state taxonomy distinguishing solid exemption / gray-zone
   * operator-decision / no exemption / undocumented:
   *
   *   • 'exempt'             — Solid FALCPA §203(b)(2) exemption (RBD
   *                            soybean oil, RBD peanut oil; decades of
   *                            clinical data, <1 ppm residual protein,
   *                            no clinical reactions documented). The
   *                            recalculate aggregation auto-strips
   *                            allergens for entries with this status —
   *                            no Contains entry rendered.
   *
   *   • 'operator-decision'  — Theoretical exemption per §203(b)(2)
   *                            but conservative industry practice
   *                            declares anyway (RBD coconut oil, RBD
   *                            tree-nut oils). Less robust clinical data;
   *                            documented reactions exist; most US
   *                            manufacturers declare for liability +
   *                            retailer-spec compliance. Catalog allergens
   *                            stay declared by default (conservative);
   *                            operator can override per-formulation when
   *                            UI surfaces the choice.
   *
   *   • 'not-exempt'         — Cold-pressed / expeller-pressed / virgin /
   *                            unrefined variants retain protein and are
   *                            NOT exempt. Catalog allergens stay declared.
   *
   *   • undefined            — Refining grade not yet flagged. Catalog
   *                            allergens stay declared by default
   *                            (conservative). Should be populated during
   *                            catalog audit pass per
   *                            [[catalog-must-be-coa-spec-sheet-anchored]].
   *
   * Per [[regulatory-classification-vs-supplier-data]] doctrine: refining
   * grade is BOTH supplier-variable (different SKUs from same supplier
   * have different grades) AND regulatorily-classifiable (when the SKU
   * name explicitly says "RBD" or "Refined" or "Cold-Pressed", the
   * exemption status is determinable from the catalog name alone).
   */
  falcpaExemptionStatus?: 'exempt' | 'operator-decision' | 'not-exempt';

  /**
   * Provenance metadata per catalog field. Keys = field names from this
   * IndustrialIngredient that have a documented source (spec sheet / COA /
   * USDA FDC ID / operator estimate / etc.); values = Provenance discriminated
   * union. Sub-field provenance can be keyed via dot notation (e.g.,
   * 'nutrition.calories' for per-nutrient provenance under the nutrition
   * record).
   *
   * Required by [[catalog-must-be-coa-spec-sheet-anchored]] doctrine
   * 2026-05-25 — every rendered catalog value must trace to a sourced
   * origin. Pre-foundation legacy entries default to absent (= treated
   * by render layer as `{ kind: 'unknown', reason: 'legacy pre-foundation' }`
   * per harm-critical floor — surfaced explicitly as UNDOCUMENTED).
   *
   * Common keys:
   *   - 'allergens' — supplier spec confirmed allergen status
   *   - 'falcpaExemptionStatus' — supplier spec confirmed refining grade
   *     (drives FALCPA §203(b)(2) exempt vs declare per
   *     [[falcpa-highly-refined-oil-exemption]])
   *   - 'nutrition' — supplier spec / USDA FDC ID / label declaration
   *   - 'nutrition.calories', 'nutrition.sodium', etc. — per-nutrient
   *     provenance when the source differs across nutrients
   *   - 'category', 'subIngredients', 'supplier', 'costPerKg',
   *     'organicAvailable', 'gmoRisk', 'pharmacopeialReference',
   *     'drugInteractions', 'coaTemplateType', etc.
   *
   * Schema-only field at foundation commit — populated as catalog audit
   * pass + spec sheet attachment UI + F3 Tier 1 agentic ingestion (per
   * [[catalog-must-be-coa-spec-sheet-anchored]] MVP foundation) land.
   */
  provenance?: Record<string, Provenance>;
}

/**
 * Supplier tier — used for price modeling and filter UX.
 *  - commodity : huge volume, lowest price, limited specialty certs
 *  - specialty : mid-volume, moderate price, broad cert options
 *  - premium   : named-brand ingredients, higher price, premium certs
 *  - craft     : artisan / small-batch, highest price, often organic
 */
export type SupplierTier = 'commodity' | 'specialty' | 'premium' | 'craft';

/**
 * Typical lead time bucket from order-placed to dock.
 */
export type LeadTimeBucket =
  | 'same-day'
  | '1-3-days'
  | '1-2-weeks'
  | '2-4-weeks'
  | '4-8-weeks'
  | '8-plus-weeks';

/**
 * Minimum order quantity tier — used to flag whether a formulation's projected
 * purchase meets the supplier's threshold.
 *  - pilot     : < 20 kg (sample / pilot)
 *  - small     : 20 – 200 kg (one pallet or less)
 *  - medium    : 200 kg – 2 MT (several pallets)
 *  - bulk      : 2 – 20 MT (sack bulk / FTL)
 *  - truckload : 20 MT+ (full truckload / rail)
 */
export type MoqTier = 'pilot' | 'small' | 'medium' | 'bulk' | 'truckload';

/**
 * Categories of supplier documentation tracked by QA for annual
 * qualification + audit readiness. Each document has an expiration
 * date; tool watches 60/30/0-day windows and alerts on the Dashboard.
 */
export type SupplierDocType =
  | 'locg'             // Letter of Continuing Guarantee
  | 'allergen'         // Allergen Statement / Letter
  | 'sqf'              // SQF (Safe Quality Food) certification
  | 'brc'              // BRC / BRCGS certification
  | 'fssc22000'        // FSSC 22000 certification
  | 'kosher'           // Kosher certificate (OU, OK, Kof-K, Star-K, etc.)
  | 'halal'            // Halal certificate (IFANCA, IFRC, etc.)
  | 'organic'          // USDA Organic certificate
  | 'non-gmo'          // Non-GMO Project Verified
  | 'haccp-plan'       // HACCP plan on file
  | 'coa-process'      // COA issuance process / sample
  | 'insurance'        // Product liability insurance cert
  | 'bioengineered'    // Bioengineered Food Disclosure status
  | 'fda-reg';         // FDA Facility Registration

/**
 * A single supplier qualification document being tracked.
 */
export interface SupplierQualification {
  id: string;
  supplierName: string;
  docType: SupplierDocType;
  /** ISO timestamp when the document was issued. */
  issuedDate: string;
  /** ISO timestamp when the document expires. */
  expirationDate: string;
  /** Certifier / issuing body (e.g., 'OU', 'Kof-K', 'USDA', 'NSF'). */
  certifier?: string;
  /** Free-text notes for QA team. */
  notes?: string;
  /** Optional file reference or URL. */
  fileRef?: string;
}

/**
 * Structured supplier profile. Referenced by name from the
 * per-ingredient `suppliers: string[]` field. Suppliers absent from the
 * registry fall back to conservative defaults in UI.
 */
export interface SupplierInfo {
  name: string;
  country: string;
  tier: SupplierTier;
  certs: SustainabilityCert[];
  typicalLeadTime: LeadTimeBucket;
  moqTier: MoqTier;
  /** Price modifier vs. ingredient's baseline costPerKg (1.0 = baseline). */
  priceModifier: number;
  /** Optional notes about capabilities, facilities, regional reach. */
  notes?: string;
  /** Website for verification (no auto-fetch — just reference). */
  website?: string;
}

/**
 * Recyclability classification per How2Recycle / FTC Green Guides taxonomy.
 */
export type PackagingRecyclability =
  | 'widely-recyclable'      // curbside in most US municipalities
  | 'check-locally'          // curbside in some areas
  | 'store-drop-off'         // plastic bags, flexible films
  | 'industrial-only'        // specialty stream
  | 'compostable'            // certified compostable
  | 'not-recyclable';        // landfill-bound

/**
 * A record from the packaging & closures database.
 * `costPerUnit` is $/piece at industrial bulk (typically per-truckload pricing).
 * `application` is a list of process fits: 'Hot Fill', 'Cold Fill', 'Retortable',
 * 'Aseptic', 'Frozen', 'Ambient', etc.
 */
export interface PackagingItem {
  name: string;
  category: string;
  material: string;
  capacity?: { value: number; unit: string };
  neckFinish?: string;
  color?: string;
  suppliers: string[];
  costPerUnit: number;
  application?: string[];
  minimumOrder?: string;
  notes: string;

  // ─── Sustainability fields (optional — defaults applied when absent) ───
  /** Post-consumer recycled content, 0–100. */
  pcrContentPct?: number;
  /** Recyclability classification. */
  recyclability?: PackagingRecyclability;
  /** Cradle-to-gate CO₂e (kg) per unit of packaging. Directional estimate. */
  materialCarbonKgCo2e?: number;
  /** Whether the material is FSC-certified (forest products only). */
  fscCertified?: boolean;

  // ─── Case pack & pallet configuration (optional) ───────────────────────
  /**
   * Shipping / distribution case-pack specs. Used by the Packaging Data Sheet
   * and (eventually) by purchasing, truckload, and warehouse cube calculators.
   * Any field may be undefined when the supplier hasn't published it yet.
   */
  casePack?: {
    /** Finished units (bottles, pouches, etc.) per master case. */
    unitsPerCase: number;
    /** Case type — "Master Case", "RSC Box", "Shipper Display", etc. */
    caseType?: string;
    /** Case outer dimensions L × W × H (shipping cube). */
    caseDimensions?: { length: number; width: number; height: number; unit: 'in' | 'cm' };
    /** Gross case weight (loaded). */
    caseWeight?: { value: number; unit: 'lb' | 'kg' };
    /** Cases per layer on the pallet. */
    casesPerLayer?: number;
    /** Layers stacked per pallet. */
    layersPerPallet?: number;
    /** Pallet footprint — "48x40 GMA", "42x48 Beverage", "Euro 48x32", etc. */
    palletType?: string;
    /** Ti-Hi shorthand (e.g., "8×5" = 8 cases/layer × 5 layers). Free-text, auto-generated. */
    tiHi?: string;
  };
}

// ============================================================
// BASE SHEET / BATCH SHEET ARCHITECTURE (Round 12+ — 2026-05-25)
// ------------------------------------------------------------
// Operator-articulated two-document model mapped directly to FDA's
// §111 framework:
//
//   • Base Sheet  ≈ Master Manufacturing Record (21 CFR 111.205)
//   • Batch Sheet ≈ Batch Production Record    (21 CFR 111.255)
//
// SavedFormulation IS the Base Sheet — extended with the fields below
// (finishedProductDensity, catalogSnapshot) per Opus routing 2026-05-25.
// BatchSheet is a NEW entity derived from a Base Sheet at a specific
// version, scaled to a production batch size, with production-specific
// fields. One Base Sheet → many Batch Sheets over time.
//
// Schema-lock-only commit per [[razor-sharp-agentic-building]] — types
// land first; save backend (launch-blocker #4, Supabase per Opus Q5),
// UI restructuring (Build → Build Base Sheet + library tab + Batch Sheet
// selector), and edit-protection workflow follow as separate commits.
//
// See memory/project_base_sheet_batch_sheet_architecture_2026_05_23.md
// for the full architectural rationale + edit-protection options A/B/C.
// ============================================================

/**
 * Reference to the catalog state at the moment a Base Sheet was saved.
 * Required on every SavedFormulation per Opus routing Q2 2026-05-25 —
 * 21 CFR 111.205(b) MMR change-control requires that catalog mutations
 * underneath a saved Base Sheet are controlled, not silent.
 *
 * Discriminated union — current variants enumerate the snapshot
 * strategies the platform supports. New variants land as catalog
 * versioning architecture matures (e.g., 'full-snapshot' for complete
 * data immutability on regulated saves; 'ingredient-version-pins' for
 * per-ingredient version refs).
 */
export type CatalogSnapshotRef =
  | {
      /**
       * No catalog version captured. Applies to:
       *   • Saves made before the Base Sheet schema lock (2026-05-25)
       *   • Saves made AFTER schema lock but BEFORE catalog versioning
       *     infrastructure lands (interim default; will phase out)
       *
       * UI must surface the missing snapshot as "this Base Sheet predates
       * catalog versioning" and offer to refresh against current catalog
       * state when catalog versioning ships.
       */
      kind: 'legacy-pre-schema-lock';
    }
  | {
      /**
       * Pins to a catalog version number. Lightweight — single integer.
       * Catalog versioning infrastructure (lib/data/* version tags +
       * monotonic increment on substantive changes) lands as separate
       * work; this variant is the target shape.
       */
      kind: 'version-pin';
      catalogVersion: number;
      /** ISO timestamp the version was captured. */
      capturedAt: string;
    };

// ============================================================
// BATCH SHEET — 7-section world-class skeleton (2026-05-25)
// ------------------------------------------------------------
// Operator-validated design pressure-tested against three product
// archetypes (Hot Honey / bottled vinegar / hummus-from-scratch).
// Universal skeleton; operator-authored content. Scope-disciplined
// per [[platform-scope-vs-facility-food-safety-plan]] — platform
// owns formulation + labeling + traceability; HACCP / CCP monitoring
// / Preventive Controls stay with the customer's PCQI.
//
// Render skeleton (per docs/architecture/batch-sheet-skeleton.md):
//   1. HEADER                       — auto from Base Sheet + batch metadata
//   2. COMPOSITION                  — auto ingredient table + Lot # capture
//   3. HARM-CRITICAL VERIFICATION   — conditional per harm-critical ingredients
//   4. ALLERGEN WARNING + CLEANING  — conditional per Base Sheet allergens
//   5. EXECUTION RECORD             — operator canvas (inherits batchSheetTemplate)
//   6. QA RESULTS                   — auto from Base Sheet tracked specs
//   7. APPROVAL                     — universal sign-offs
//
// Five interfaces define the structured-capture portions; the EXECUTION
// canvas is plain text (operator's prose conventions for fill-in slots).
// ============================================================

/** Production batch status. Drives Hold/Release workflow + release-to-ship
 *  gating. Failed allergen verification or failed QA spec auto-transitions
 *  to `qa_hold` (UI/workflow enforcement, not type-system). Release requires
 *  Approval section sign-offs. */
export type BatchStatus = 'in_progress' | 'qa_hold' | 'released' | 'rejected';

/** Verification methods for allergen cleaning. Multi-select — operators
 *  routinely combine visual + ATP swab + allergen-specific test kit for
 *  high-risk products. Captures FDA 21 CFR 117.135/117.140 verification
 *  documentation requirement. */
export type VerificationMethod =
  | 'visual'
  | 'atp_swab'
  | 'allergen_test_kit'
  | 'protein_swab'
  | 'microbial_swab'
  | { type: 'other'; label: string };

/** Per-harm-critical-ingredient verified-weight capture at point of
 *  addition. Required for preservatives with regulatory caps (Na benzoate
 *  ≤ 0.1%, K sorbate ≤ 0.1%, etc.), high-potency micronutrients, pH-
 *  critical acidulants, cure ingredients. Two-person verification per
 *  FDA 21 CFR 117.130. */
export interface HarmCriticalCheck {
  /** Target weight from pinned Base Sheet (auto-populated for operator reference). */
  targetWeight: number;
  targetUnit: string;
  /** Operator-entered actual weight added to batch. */
  actualWeight: number;
  actualUnit: string;
  /** Optional regulatory limit context (e.g., '≤ 0.1% w/w per 21 CFR 184.1733'). */
  regulatoryLimit?: string;
  /** Person who added the ingredient + measured the weight. */
  addedBy: string;
  addedAt: string;
  /** Second-person verifier (FDA two-person verification standard for safety-critical). */
  verifiedBy: string;
  verifiedAt: string;
  /** Free-text — deviations, recalculation notes, supplier lot quality issues. */
  notes?: string;
}

/** Allergen cleaning verification capture. Auto-rendered on Batch Sheet
 *  when the pinned Base Sheet declares any allergens. Allergen LIST
 *  itself is derived from the pinned Base Sheet (single source of truth);
 *  this record captures the per-batch cleaning + verification + corrective-
 *  action workflow per FDA 21 CFR 117.135 + 117.140. */
export interface AllergenCleaningRecord {
  /** The cleaning method performed (operator-typed; varies by facility/equipment). */
  cleaningMethod: string;
  cleaningPerformedBy: string;
  cleaningPerformedAt: string;
  /** How cleanliness was verified — multi-select; operators routinely combine methods. */
  verificationMethods: VerificationMethod[];
  /** Verification outcome. 'fail' triggers correctiveAction sub-record. */
  verificationResult: 'pass' | 'fail' | 'retest_required';
  /** Free-text — ATP RLU value, test-kit qualitative result, swab area location, etc. */
  verificationReadings?: string;
  verifiedBy: string;
  verifiedAt: string;
  /** Only populated when verificationResult === 'fail'. Captures re-cleaning + re-verification. */
  correctiveAction?: {
    recleaningMethod: string;
    recleanedBy: string;
    recleanedAt: string;
    reverificationMethods: VerificationMethod[];
    reverificationResult: 'pass' | 'fail';
    reverificationReadings?: string;
    reverifiedBy: string;
    reverifiedAt: string;
    /** If re-verification fails: batch should HOLD. Escalation per facility SOP. */
    escalationNotes?: string;
  };
}

/** Per-tracked-spec measurement capture. Auto-rendered from Base Sheet's
 *  selected SPECS TO TRACK (pH, brix, water activity, etc.). Targets
 *  derived from Base Sheet (target spec value + tolerance range);
 *  measured value + initials captured here per batch. */
export interface QAMeasurement {
  /** Actual measured value (numeric typically; string for pass/fail qualitative tests). */
  measured: number | string;
  unit?: string;
  initials?: string;
  measuredAt?: string;
  notes?: string;
}

/** Universal Batch Sheet sign-off. Roles are conventional but operator-
 *  extensible (string type allows facility-specific roles like 'Production
 *  Lead', 'Sanitation Supervisor', 'Plant Manager'). FDA 21 CFR 111.255(b)(4)
 *  initials-of-person-performing-each-step requirement is captured per-step
 *  in the executionRecord canvas; THIS structured record captures the
 *  batch-level final-approval sign-offs. */
export interface BatchSignoff {
  /** Conventional roles: 'batcher' | 'qa' | 'production_mgr'. Free-text allows facility-specific roles. */
  role: string;
  name: string;
  signedAt: string;
  notes?: string;
}

/**
 * A production batch document derived from a Base Sheet at a specific
 * version. Maps to FDA Batch Production Record (21 CFR 111.255). Pinned
 * to a specific Base Sheet version per Opus routing Q3 2026-05-25 —
 * floating would be a §111.255 BPR violation (BPR captures point-in-time
 * MMR state; once produced, the BPR is immutable).
 *
 * Designed minimum-viable per "less is more" doctrine 2026-05-25:
 * platform owns identity + composition + traceability + structured
 * regulatory-critical captures; operator owns procedure/QA/notes content
 * via the executionRecord canvas.
 */
export interface BatchSheet {
  id: string;

  /** Reference to the Base Sheet this batch derives from. */
  baseSheetId: string;

  /**
   * Pinned Base Sheet version string (matches SavedFormulation.currentVersion
   * format — e.g., '1.0.0', '1.0.1'). Once a Batch Sheet is created, the
   * pinned version is the source-of-truth for batch composition. Later
   * Base Sheet edits do NOT retroactively change what was produced.
   */
  baseSheetVersion: string;

  /** ISO timestamp the Batch Sheet was created. Auto-set; serves as
   *  productionDate default when productionDate is unset. */
  createdAt: string;

  /** ISO timestamp of the most recent edit. */
  lastModified?: string;

  /** Unique batch identifier per FDA 21 CFR 111.255(b)(1). Auto-suggested
   *  via partNumber convention; operator can override to match facility ERP. */
  batchId: string;

  /** Scheduled or actual production date (ISO 8601 date). Defaults to
   *  createdAt when unset (matches the common case where Batch Sheet is
   *  created on production day). */
  productionDate?: string;

  /** Production batch size — total mass for this batch in kilograms.
   *  The pinned Base Sheet's ingredient masses scale linearly to this
   *  batch size at derivation time. */
  batchSizeKg: number;

  /** Hold/Release workflow status. Failed allergen verification or failed
   *  QA spec should auto-transition to 'qa_hold' (UI/workflow concern, not
   *  type concern). Release requires Approval section sign-offs. */
  batchStatus: BatchStatus;

  /**
   * Operator-authored EXECUTION canvas — procedures, deviations, mid-batch
   * observations, operator notes. Inherits the pinned Base Sheet's
   * batchSheetTemplate at spawn time; operator edits per-batch for this
   * specific production run. Plain text — operator's own conventions for
   * fill-in slots (underscores), hierarchy (indentation), section headers,
   * etc. Platform does not parse this content.
   */
  executionRecord: string;

  /** Per-ingredient lot tracking. Keys match Ingredient.name from the
   *  pinned Base Sheet version. Captures FDA 21 CFR 111.255(b)(7)
   *  per-component-identifier traceability. */
  ingredientLots?: Record<string, string>;

  /** Per-harm-critical-ingredient verified-weight capture. Auto-rendered
   *  when Base Sheet contains ingredients flagged harm-critical (catalog
   *  flag + product-class-driven defaults). */
  harmCriticalChecks?: Record<string, HarmCriticalCheck>;

  /** Allergen cleaning verification capture. Auto-rendered when Base Sheet
   *  declares any allergens. Allergen LIST derived from pinned Base Sheet. */
  allergenCleaning?: AllergenCleaningRecord;

  /** Per-tracked-spec measurement capture. Keys match the SPECS TO TRACK
   *  selection on the Base Sheet (pH / brix / water activity / etc.). */
  qaResults?: Record<string, QAMeasurement>;

  /** Final-approval sign-offs for the batch. Per-step initials in the
   *  executionRecord canvas (operator prose); batch-level approval here. */
  signoffs?: BatchSignoff[];
}

// ----- Declaration merging — extends SavedFormulation + FormulationVersion --
// Adds Base Sheet fields without rewriting the existing interfaces or
// breaking imports across the codebase. See the original interfaces above
// for the pre-extension shape.

export interface SavedFormulation {
  /**
   * Finished-product density in g/mL. Operator-supplied per
   * [[density-input-servings-calc]]. Optional in the type for migration of
   * pre-schema-lock saves; required-when-servingUnit-is-volume enforced
   * at the UI/render layer per [[serving-size-volume-parens-directive]].
   */
  finishedProductDensity?: number | null;

  /**
   * Reference to catalog state at save time. Required per Opus routing
   * Q2 2026-05-25 — 21 CFR 111.205(b) MMR change-control discipline.
   * Pre-schema-lock saves carry `{ kind: 'legacy-pre-schema-lock' }`;
   * new saves should carry `{ kind: 'version-pin', catalogVersion, capturedAt }`
   * once catalog versioning infrastructure lands.
   */
  catalogSnapshot: CatalogSnapshotRef;

  /**
   * Operator-authored EXECUTION canvas template — procedures + QA layout
   * + signoff conventions for this Base Sheet's product. Authored during
   * R&D bench work; inherited by every Batch Sheet spawned from this
   * Base Sheet version (the Batch Sheet copies this into its own
   * executionRecord at spawn, then operator adjusts per-batch).
   *
   * Plain text — operator's own conventions for fill-in slots
   * (underscores), hierarchy, section headers. Platform does not parse
   * this content. See [[operator-current-base-sheet-format]] for the
   * format conventions operators use natively.
   */
  batchSheetTemplate?: string;

  /**
   * Target batch mass in grams the formula was designed for. The locked
   * composition is the PERCENTAGES (derived: ingredient.qty / baseBatchSizeG
   * — or sum(ingredient.qty) when this field is absent for migration);
   * gram quantities scale proportionally when operator changes batch size
   * or spawns a Batch Sheet at a different scale.
   *
   * Per operator 2026-05-25: "2000 grams or whatever once the percentage
   * is locked" — percentages are THE formula; gram quantities derive from
   * baseBatchSize × percentage. Same workflow operators use in their
   * existing manual Base Sheet format (commonly 1000g normalization basis,
   * per [[operator-current-base-sheet-format]]).
   *
   * Optional for migration of pre-schema-lock saves; defaults at the UI
   * layer to sum(ingredient.qty) when unset.
   */
  baseBatchSizeG?: number;
}

export interface FormulationVersion {
  /**
   * Finished-product density captured at this version (g/mL). Optional
   * for migration of pre-schema-lock versions. New versions should
   * capture density if the formula uses a volume serving unit.
   */
  finishedProductDensity?: number | null;

  /**
   * Catalog snapshot captured at this version. Required per Opus Q2 —
   * each version pins to its own catalog state to support audit-grade
   * reproduction of the version's render output (NFP/SFP, allergen
   * statement, framework determinations) even when catalog later mutates.
   */
  catalogSnapshot: CatalogSnapshotRef;

  /**
   * Target batch mass at this version. Per-version pinning supports
   * audit-grade reproduction — knowing what batch basis the formula was
   * designed for at this version. Percentages reproduce identically;
   * gram quantities at version-N can be re-derived from this field
   * when needed.
   */
  baseBatchSizeG?: number;
}

// ============================================================
// CONCENTRATION RATIO — FJC + concentrate vendor-specificity
// ------------------------------------------------------------
// Per [[fjc-concentration-ratios-greenwood]] + [[matt-fjc-vendor-spec-custodian]]
// 2026-05-24. Fruit juice concentrates (FJCs), tomato paste, and other
// concentrated ingredients have vendor-specific dilution ratios that
// drive the implicit water-addition math during formulation.
//
// Lives on the catalog entry (IndustrialIngredient), NOT on the Base
// Sheet — concentration ratio is intrinsic to the catalog SKU, not the
// formula. Concentration logic fires at the bulk-paste / formulation
// boundary, scaling per-ingredient masses to single-strength equivalent
// for nutrition + per-serving math.
//
// MVP scope: ratio + source descriptor + provenance. Post-launch
// expansion: tomato paste TSS (Total Soluble Solids) variant; dried-
// ingredient rehydration inverse; honey moisture variance.
// ============================================================

/**
 * Vendor-specific concentration ratio for FJC + concentrate catalog entries.
 *
 * Interpreted as: when `concentratePart` grams of concentrate are added to
 * a formula, the system implicitly accounts for `waterPart` additional
 * grams of water during nutrition + per-serving math (since the concentrate
 * represents reconstituted single-strength juice).
 *
 * Example — Greenwood lemon juice concentrate at 85/15:
 *   waterPart: 85, concentratePart: 15
 *   →  15g of concentrate represents 100g of equivalent single-strength juice
 *   →  Implicit water added in formula math: 15 × (85/15) = 85g
 */
export interface ConcentrationRatio {
  /** Implicit water mass per concentratePart units. */
  waterPart: number;
  /** Concentrate mass anchor. */
  concentratePart: number;
  /** Free-text notes (e.g., 'Greenwood Spec — 400 g/L citric acid'). */
  notes?: string;
  /** Provenance reference for the ratio value (vendor spec sheet, lab measurement, operator estimate). */
  source?: string;
}

// ============================================================
// PROVENANCE — foundational doctrine schema (2026-05-25)
// ------------------------------------------------------------
// Per [[catalog-must-be-coa-spec-sheet-anchored]] — every catalog value
// rendered in the platform must trace back to a supplier-provided spec
// sheet, supplier-provided COA, canonical regulatory source, or explicit
// operator estimate with documented basis. LLM-typed values shipped as
// if verified are non-compliant with platform doctrine.
//
// Provenance type answers "where did this number come from?" for any
// catalog value. The discriminated union covers the source types the
// platform recognizes — derived from operator's manual workflow patterns
// documented in [[nutritional-calculator-canonical-source]] (USDA FDC
// IDs, supplier specs, label declarations, operator estimates, sibling
// inferences, internal notes) plus the per-batch COA shape (lot-anchored).
//
// Sourced<T> wrapper enables typed values to carry provenance inline
// where ergonomic; parallel Record<string, Provenance> via the
// `provenance` field on IndustrialIngredient enables gradual annotation
// without breaking existing typed values.
//
// Schema-only commit per [[razor-sharp-agentic-building]] — types land;
// per-field annotation + workspace render + agentic ingestion (F3 Tier 1)
// follow as separate commits over the foundation rollout.
// ============================================================

/**
 * Provenance for a catalog value — answers "where did this number come
 * from?" Required by [[catalog-must-be-coa-spec-sheet-anchored]] doctrine
 * to ship FALCPA-compliant + 21 CFR 101 truth-in-labeling output.
 *
 * Discriminated union — each variant captures the metadata appropriate
 * to its source type. capturedAt tracks WHEN the value was recorded;
 * values may need re-capture when supplier issues updated spec / new
 * lot ships / regulatory citation amended / etc.
 */
export type Provenance =
  | {
      /** Supplier spec sheet — vendor's published specification for the
       *  ingredient SKU. Catalog-level (one spec sheet per SKU); not
       *  per-lot (that's 'coa'). Common case for nutrition, allergens,
       *  refining grade, certifications. */
      kind: 'supplier-spec';
      vendor: string;
      /** URL, file path, or internal doc ID for the spec sheet. */
      specSheetRef?: string;
      /** ISO date the spec sheet itself was issued by the supplier. */
      specSheetDate?: string;
      /** ISO timestamp when the platform captured this value from the spec. */
      capturedAt: string;
      notes?: string;
    }
  | {
      /** Certificate of Analysis — supplier's per-lot test results.
       *  Batch/lot-level (one COA per ingredient lot). Higher confidence
       *  than supplier-spec for the specific lot. Lives on BatchSheet
       *  via ingredientLots typically; can also annotate catalog values
       *  when an operator wants to lot-anchor a catalog entry. */
      kind: 'coa';
      vendor: string;
      lotNumber: string;
      coaRef?: string;
      coaDate?: string;
      capturedAt: string;
      notes?: string;
    }
  | {
      /** USDA FoodData Central — canonical US government nutrition data.
       *  Common case for raw commodity ingredients (whole foods,
       *  basic produce). FDC ID enables re-verification + amendment
       *  tracking when USDA updates their data. */
      kind: 'usda-fdc';
      /** FDC numeric identifier per USDA FoodData Central. */
      fdcId: string;
      capturedAt: string;
      notes?: string;
    }
  | {
      /** Operator pulled values from a product label declaration.
       *  Per [[nutritional-calculator-canonical-source]] this is a
       *  common operator-workbook source ("From Label - Worst Case
       *  Rounding" / "From Package Declaration"). Rounding mode tracks
       *  the operator's interpretation strategy (FDA labels are rounded
       *  per 21 CFR 101.9(c) — recovering pre-rounding values requires
       *  a rounding-mode assumption). */
      kind: 'label-declaration';
      /** Source description (e.g., 'Product label, Costco store visit 2026-03-15'). */
      labelSource: string;
      /** Rounding interpretation. 'worst-case' = assume highest pre-rounding value
       *  (operator's conservative discipline per workbook convention); 'best-case'
       *  = assume lowest; 'as-printed' = use printed value directly. */
      rounding?: 'as-printed' | 'worst-case' | 'best-case';
      capturedAt: string;
      notes?: string;
    }
  | {
      /** Operator's own estimate — documented basis required per
       *  [[honest-estimate-reframe]] discipline. Acceptable for values
       *  where no supplier spec / COA / canonical source exists, OR
       *  where operator wants to apply judgment to a non-canonical case. */
      kind: 'operator-estimate';
      /** Identifier of the operator who recorded the estimate. */
      operatorId?: string;
      /** Documented basis (e.g., 'Educated guess from similar SKU production
       *  experience'; 'Calculated assuming standard 8% moisture loss in drying'). */
      basis: string;
      capturedAt: string;
      notes?: string;
    }
  | {
      /** Value computed from formula structure — derived rather than
       *  measured. E.g., pH back-calculated from acid + base composition;
       *  density from weighted average of ingredient densities. Method
       *  field documents the calculation approach for audit. */
      kind: 'computed-from-formula';
      method: string;
      capturedAt: string;
      notes?: string;
    }
  | {
      /** Inferred from a sibling catalog entry. Per
       *  [[nutritional-calculator-canonical-source]] this matches
       *  operator-workbook source "Adapted From Cider Vinegar" pattern —
       *  when a new ingredient's values are estimated by analogy to a
       *  related catalog entry. Lower confidence than direct sourcing. */
      kind: 'sibling-inference';
      /** Name of the sibling catalog entry the value was inferred from. */
      baseEntryName: string;
      /** Adjustments applied (e.g., 'Increased Brix by 5° for sweetened variant'). */
      adjustments?: string;
      capturedAt: string;
      notes?: string;
    }
  | {
      /** Internal team data — values supplied by team members from their
       *  own knowledge / archives that aren't easily attributable to a
       *  specific document. Per [[matt-fjc-vendor-spec-custodian]] +
       *  [[nutritional-calculator-canonical-source]] workbook "Matt's
       *  Number" / "MN data" / "MAT" patterns. sourceCode preserves
       *  the team-internal identifier; consider migrating to a more
       *  specific variant (supplier-spec / operator-estimate) when the
       *  underlying source surfaces. */
      kind: 'internal-source';
      sourceCode: string;
      capturedAt: string;
      notes?: string;
    }
  | {
      /** Value sourced from a published regulatory authority or pharmacopeia —
       *  FDA determinations, USP/NF monographs, 21 CFR citations. The most
       *  defensible NON-supplier source: regulatory CLASSIFICATIONS and
       *  reference values do not vary by supplier or lot (per
       *  [[regulatory_classification_vs_supplier_data]]), so they are
       *  canonically sourceable without a spec sheet. Common for
       *  regulatoryStatus, ndiStatus, DV/RDI basis, and pharmacopeial identity.
       *  Distinct from 'internal-source' (team data) and 'unknown' (no source). */
      kind: 'regulatory-authority';
      /** Issuing authority (e.g., 'FDA', 'USP', 'USDA', 'EFSA'). */
      authority: string;
      /** Specific citation (e.g., '21 CFR 101.36 Table 1', 'USP-NF Ascorbic Acid'). */
      citation: string;
      capturedAt: string;
      notes?: string;
    }
  | {
      /** Unknown provenance — legacy LLM-typed values, or values whose
       *  origin was not recorded at catalog-authoring time. Per
       *  [[harm-critical-floor]] doctrine, the platform must surface
       *  these explicitly to the operator (not silently treat as
       *  verified). All pre-foundation catalog entries default to this
       *  variant during the audit transition. */
      kind: 'unknown';
      reason?: string;
    };

/**
 * Sourced<T> — a typed value carrying its provenance inline. Use when
 * the value + provenance ergonomically travel together (e.g., a single
 * spec measurement with its source). For records of many values where
 * provenance applies per-field, prefer the parallel
 * `Record<string, Provenance>` pattern via the `provenance` field on
 * IndustrialIngredient (added below).
 */
export interface Sourced<T> {
  value: T;
  provenance: Provenance;
}

