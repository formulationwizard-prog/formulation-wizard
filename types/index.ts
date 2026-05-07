// ============================================================
// Shared types for Formulation Wizard
// ============================================================

// ----- Confidence Taxonomy (2026-05-07 architectural reframe) ---------------
// Every numeric value rendered to the user carries a Confidence level and a
// tolerance range. The system is positioned as a starting-estimate engine
// with honest uncertainty bounds; the Process Authority is the legal authority
// that converts estimates into verified specs.
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
}

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
export interface IndustrialIngredient {
  name: string;
  category: string;
  suppliers: string[];
  subIngredients: string[];
  allergens: string[];
  costPerKg: number;
  nutrition: Partial<Nutrition>;
  notes: string;

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
