// ============================================================
// Food Science Spec Estimator
// ------------------------------------------------------------
// Estimates formulation-level specs from ingredient composition:
//   • pH (weighted by hydrogen ion concentration — NOT arithmetic)
//   • Brix (% soluble solids, weighted by mass)
//   • Moisture % (weighted by mass)
//   • Water activity a_w (weighted by mass — first approximation)
//   • Acetic acid % (from vinegars / glacial acetic)
//   • Acetic/Moisture ratio (key for 21 CFR 114 acidified foods)
//   • Bostwick consistency (cm flow in 30s) — lower = thicker
//   • Brookfield viscosity (cP estimate) — higher = thicker
//
// All values are ESTIMATES for formulation scoping. Final product
// specs MUST be verified by lab measurement before release.
//
// PROVENANCE GATE (added 2026-04-30): a prior audit confirmed every
// numeric value in INGREDIENT_SPECS / CATEGORY_SPECS was AI-generated
// during scaffolding without provenance. Two confirmed regulatory
// bugs followed (false "Acidified Food" labels on un-acidified raw
// vegetables; false "Shelf-Stable Dry" on high-water raw produce).
// classifyFormulation() now refuses to classify when verified-mass
// coverage is below threshold. See its JSDoc and ARCHITECTURE.md.
// ============================================================
import type { Confidence, IndustrialIngredient, RangedValue } from '../types';
import { UNIT_TO_GRAMS } from './utils';

// ----- Locked regulatory disclaimer -----------------------------------------
// Appended to every regulatory classification output (success OR refusal).
// Do not modify the wording without consulting a Process Authority and
// updating ARCHITECTURE.md.
export const REGULATORY_DISCLAIMER =
  'This information is for general educational purposes and does not constitute a legal or definitive safety process. Always consult an FDA-recognized Process Authority to verify your specific formula.';

// ----- Provenance metadata --------------------------------------------------
export type SpecSource =
  | 'commodity-standard'   // chemical/regulatory definition (e.g., USP, GRAS, FCC monograph)
  | 'cited-reference'      // industry-standard concentration / derived from cited science
  | 'ai-estimate'          // AI-generated during scaffolding; no provenance
  | 'category-default';    // generic per-category fallback in CATEGORY_SPECS

export type SpecConfidence = 'verified' | 'unverified';

// ----- Types -----------------------------------------------------------------

export interface IngredientSpec {
  /** Typical pH of this ingredient (for weighted [H+] calc). */
  pH?: number;
  /** % Soluble solids (sucrose equivalent). */
  brix?: number;
  /** % Water by mass. */
  moisture?: number;
  /** Water activity (0–1 scale). */
  aw?: number;
  /** % Acetic acid (for vinegars, glacial, and natural contributors). */
  aceticAcid?: number;
  /** Qualitative contribution to thickness. */
  viscosityContrib?: 'none' | 'low' | 'medium' | 'high' | 'very high';
  /** Where this entry's numeric values came from. Required. */
  source: SpecSource;
  /** Citation for the values. Required when source is 'commodity-standard' or 'cited-reference'. */
  citation?: string;
  /** Whether the values have been verified against an authoritative source. Required. */
  confidence: SpecConfidence;
  /** ISO date (YYYY-MM-DD) the entry was last verified. Required when confidence === 'verified'. */
  last_verified?: string;
  /** Optional freeform clarifying notes. */
  notes?: string;
}

export interface FormulationSpecs {
  pH: number;
  brix: number;
  moisture: number;
  aw: number;
  aceticAcid: number;
  /** Acetic acid % / moisture %. >= 0.5% = typical acidified threshold. */
  aceticMoistureRatio: number;
  bostwickCmPer30s: number;
  /** Rough classification of Bostwick flow. */
  bostwickClass: 'very thin' | 'thin' | 'medium' | 'thick' | 'very thick' | 'paste';
  /** Rough Brookfield estimate in centipoise (cP). */
  brookfieldCp: number;
  brookfieldClass: 'very low' | 'low' | 'medium' | 'high' | 'very high';
  /** Total formulation mass in grams. */
  totalWeightG: number;
  /** Percentage of mass covered by ingredients with any spec data — helps flag "mostly unknown" formulations. */
  coverage: number;
  /**
   * Percentage of formulation mass made up of low-acid components (ingredient pH > 4.6 naturally).
   * Key signal for 21 CFR 114 acidified-food determination: an otherwise-low-acid product acidified
   * to shelf-stable pH ≤ 4.6 is an "acidified food" and must be filed.
   *   • ≥ 10% low-acid components → filing REQUIRED
   *   • 5–10% → recommended, Process Authority should confirm
   *   • < 5% → naturally acid food, GMP only
   */
  lowAcidComponentPct: number;
  /**
   * True if the formulation contains at least one strong acidulant (ingredient pH < 4.0).
   * Used to distinguish "acidified food" (low-acid base + added acid) from "LACF" (low-acid,
   * no acid added) and from "acid food" (naturally acid).
   */
  hasAcidulant: boolean;
  /**
   * Regulatory product classification. See classifyFormulation() JSDoc for the gate logic.
   *   • 'acid'                — naturally pH ≤ 4.6, minimal low-acid content (21 CFR 114.3(b)(1))
   *   • 'acidified'           — low-acid base + added acid, final pH ≤ 4.6 (21 CFR 114)
   *   • 'acidified-in-process'— intent acidified (acidulant + low-acid base) but pH still > 4.6
   *   • 'lacf'                — pH > 4.6 and aw > 0.85, no acidification intent (21 CFR 113)
   *   • 'shelf-stable-dry'    — aw ≤ 0.85
   *   • 'insufficient-data'   — verified-mass coverage too low to classify safely
   *   • '—'                   — empty formulation / no input
   */
  productClassification:
    | 'acid'
    | 'acidified'
    | 'acidified-in-process'
    | 'lacf'
    | 'shelf-stable-dry'
    | 'insufficient-data'
    | '—';
  /** Hedged human-readable regulatory class with verified-mass-coverage line and disclaimer appended. */
  regulatoryClass: string;
  /** Percentage of total formulation mass attributable to ingredients tagged confidence='verified'. 0–100. */
  verifiedMassPct: number;
  /** All ingredients with confidence='unverified', sorted desc by mass percentage. Always populated. */
  unverifiedIngredients: Array<{ name: string; massPct: number }>;
  /**
   * Per-metric confidence floor for the formulation-level rollup. Floor across
   * ingredients contributing ≥5% mass; if no ingredient is ≥5%, floor across all
   * contributors. Output is capped at CALCULATED (the rollup math is a derivation
   * of inputs, not a direct measurement) and propagates downward from there per
   * the input floor. See feedback memory three_class_value_taxonomy.md.
   */
  confidence: {
    pH: Confidence;
    brix: Confidence;
    moisture: Confidence;
    aw: Confidence;
    aceticAcid: Confidence;
  };
}

// ----- Category-level defaults -----------------------------------------------
// Used when a specific ingredient override isn't available.
// Every CATEGORY_SPECS entry is tagged 'category-default' / 'unverified': the
// numeric values are AI-generated scaffolding without provenance.
export const CATEGORY_SPECS: Record<string, IngredientSpec> = {
  'Sweeteners':             { brix: 80, moisture: 15, aw: 0.70, pH: 5.5, source: 'category-default', confidence: 'unverified' },
  'Fats & Oils':            { brix: 0,  moisture: 0.1, aw: 0.10, pH: 7.0, viscosityContrib: 'medium', source: 'category-default', confidence: 'unverified' },
  'Condiment Ingredients':  { brix: 12, moisture: 55, aw: 0.88, pH: 4.0, source: 'category-default', confidence: 'unverified' },
  'Fresh Produce':          { brix: 8,  moisture: 88, aw: 0.98, pH: 5.5, source: 'category-default', confidence: 'unverified' },
  'Produce':                { brix: 12, moisture: 85, aw: 0.96, pH: 4.0, source: 'category-default', confidence: 'unverified' },
  'Fresh Herbs':            { brix: 5,  moisture: 88, aw: 0.97, pH: 6.2, source: 'category-default', confidence: 'unverified' },
  'Spices':                 { brix: 0,  moisture: 8,  aw: 0.35, pH: 6.0, source: 'category-default', confidence: 'unverified' },
  'Egg Products':           { brix: 0,  moisture: 5,  aw: 0.25, pH: 7.5, source: 'category-default', confidence: 'unverified' },
  'Legumes & Nuts & Seeds': { brix: 0,  moisture: 5,  aw: 0.40, pH: 6.5, viscosityContrib: 'low', source: 'category-default', confidence: 'unverified' },
  'Dried Beans':            { brix: 0,  moisture: 11, aw: 0.55, pH: 6.5, source: 'category-default', confidence: 'unverified' },
  'Canned Beans':           { brix: 0,  moisture: 75, aw: 0.96, pH: 6.2, source: 'category-default', confidence: 'unverified' },
  'Nut & Seed Butters':     { brix: 0,  moisture: 2,  aw: 0.40, pH: 6.5, viscosityContrib: 'very high', source: 'category-default', confidence: 'unverified' },
  'Juices':                 { brix: 12, moisture: 87, aw: 0.98, pH: 3.6, source: 'category-default', confidence: 'unverified' },
  'Concentrates & Extracts':{ brix: 50, moisture: 40, aw: 0.75, pH: 3.5, source: 'category-default', confidence: 'unverified' },
  // Baking / bakery-centric categories ---------------------------------------
  'Flours & Grains':        { brix: 1,  moisture: 13, aw: 0.55, pH: 6.2, source: 'category-default', confidence: 'unverified' },
  'Leavening':              { brix: 0,  moisture: 8,  aw: 0.40, pH: 7.5, source: 'category-default', confidence: 'unverified' },
  'Dairy':                  { brix: 4,  moisture: 88, aw: 0.99, pH: 6.5, source: 'category-default', confidence: 'unverified' },
  'Chocolate & Cocoa':      { brix: 55, moisture: 1,  aw: 0.40, pH: 6.2, source: 'category-default', confidence: 'unverified' },
  'Nuts & Nut Products':    { brix: 4,  moisture: 4,  aw: 0.50, pH: 6.4, source: 'category-default', confidence: 'unverified' },
  'Seeds':                  { brix: 1,  moisture: 6,  aw: 0.50, pH: 6.4, source: 'category-default', confidence: 'unverified' },
  'Dried Fruit':            { brix: 75, moisture: 22, aw: 0.65, pH: 4.0, source: 'category-default', confidence: 'unverified' },
  'Water & Ice':            { brix: 0,  moisture: 100, aw: 1.0, pH: 7.0, source: 'category-default', confidence: 'unverified' },
  'Seasonings':             { brix: 0,  moisture: 8,  aw: 0.35, pH: 6.0, source: 'category-default', confidence: 'unverified' },
};

// ----- Ingredient-specific overrides -----------------------------------------
// Most entries are AI-generated scaffolding tagged 'ai-estimate' / 'unverified'.
// 17 keys (12 chemistries × variants where applicable) are tagged 'verified'
// via 'commodity-standard' or 'cited-reference' citations — see
// classifyFormulation() for how this drives the gate.
export const INGREDIENT_SPECS: Record<string, IngredientSpec> = {
  // ─── Vinegars ─────────────────────────────────────────────────────────────
  // VERIFIED — commodity-standard concentrations per FDA CPG Sec. 525.825.
  'Distilled White Vinegar (40 Grain / 4%)':   { pH: 2.7, aceticAcid: 4.0,  brix: 0.1, moisture: 96, aw: 0.99, source: 'commodity-standard', citation: 'FDA CPG Sec. 525.825 (Vinegar, Definitions) — 4% minimum acidity', confidence: 'verified', last_verified: '2026-04-30' },
  'Distilled White Vinegar (50 Grain / 5%)':   { pH: 2.5, aceticAcid: 5.0,  brix: 0.1, moisture: 95, aw: 0.98, source: 'commodity-standard', citation: 'FDA CPG Sec. 525.825 (Vinegar, Definitions); industry standard 5% acidity = 50 grain', confidence: 'verified', last_verified: '2026-04-30', notes: 'Standard retail concentration.' },
  'Distilled White Vinegar (100 Grain / 10%)': { pH: 2.2, aceticAcid: 10.0, brix: 0.1, moisture: 90, aw: 0.95, source: 'cited-reference', citation: 'Industry-standard concentration; pH derived from acetic acid dissociation', confidence: 'verified', last_verified: '2026-04-30' },
  'Distilled White Vinegar (120 Grain / 12%)': { pH: 2.1, aceticAcid: 12.0, brix: 0.1, moisture: 88, aw: 0.94, source: 'cited-reference', citation: 'Industry-standard concentration; pH derived from acetic acid dissociation', confidence: 'verified', last_verified: '2026-04-30' },
  'Distilled White Vinegar (200 Grain / 20%)': { pH: 2.0, aceticAcid: 20.0, brix: 0.1, moisture: 80, aw: 0.90, source: 'cited-reference', citation: 'Industry-standard concentration; pH derived from acetic acid dissociation', confidence: 'verified', last_verified: '2026-04-30' },
  // UNVERIFIED — flavored vinegars; pH/aw are AI estimates.
  'Apple Cider Vinegar (5%)':                  { pH: 3.1, aceticAcid: 5.0,  brix: 1.0, moisture: 94, aw: 0.99, source: 'ai-estimate', confidence: 'unverified' },
  'Red Wine Vinegar':                          { pH: 3.0, aceticAcid: 6.0,  brix: 1.5, moisture: 93, aw: 0.99, source: 'ai-estimate', confidence: 'unverified' },
  'Balsamic Vinegar (Industrial)':             { pH: 2.7, aceticAcid: 6.0,  brix: 30,  moisture: 65, aw: 0.93, source: 'ai-estimate', confidence: 'unverified' },
  'Rice Wine Vinegar':                         { pH: 3.2, aceticAcid: 4.3,  brix: 0.5, moisture: 95, aw: 0.99, source: 'ai-estimate', confidence: 'unverified' },
  'Malt Vinegar':                              { pH: 3.0, aceticAcid: 5.0,  brix: 1.0, moisture: 94, aw: 0.99, source: 'ai-estimate', confidence: 'unverified' },
  // VERIFIED — glacial acetic acid (food grade), GRAS per 21 CFR 184.1005.
  'Acetic Acid (Glacial Food Grade)':          { aceticAcid: 99.5, brix: 0, moisture: 0, aw: 0, source: 'commodity-standard', citation: '21 CFR 184.1005 (Acetic Acid, GRAS); Food Chemicals Codex 3rd ed. p. 8', confidence: 'verified', last_verified: '2026-04-30', notes: 'CAS 64-19-7. IUPAC: ethanoic acid. Industrial assay typically 99.5–100.5%. pH undefined for the neat liquid; in 1% aqueous solution pH ~2.4. Per FDA CPG 562.100, diluted glacial acetic acid is NOT vinegar and cannot substitute for vinegar in standardized foods.' },
  // ─── Acids & preservatives ────────────────────────────────────────────────
  // VERIFIED — citric acid anhydrous & monohydrate, GRAS per 21 CFR 184.1033.
  'Citric Acid (Anhydrous)':                   { brix: 0, moisture: 0, aw: 0, source: 'commodity-standard', citation: '21 CFR 184.1033 (Citric Acid, GRAS); Food Chemicals Codex 3rd ed. pp. 86-87', confidence: 'verified', last_verified: '2026-04-30', notes: 'CAS 77-92-9. IUPAC: 2-hydroxy-1,2,3-propanetricarboxylic acid. pH undefined for crystalline powder; in 1% aqueous solution pH ~2.2.' },
  'Citric Acid (Monohydrate)':                 { brix: 0, moisture: 8.6, aw: 0, source: 'commodity-standard', citation: '21 CFR 184.1033 (Citric Acid, GRAS) — monohydrate form', confidence: 'verified', last_verified: '2026-04-30', notes: 'CAS 5949-29-1. Approximately 9% heavier than anhydrous due to water of hydration.' },
  // UNVERIFIED — preservatives; pH/aw values are AI estimates.
  'Sodium Benzoate (Food Grade)':              { pH: 8.0, moisture: 0.2, brix: 0, aw: 0.20, source: 'ai-estimate', confidence: 'unverified' },
  'Potassium Sorbate (Food Grade)':            { pH: 6.5, moisture: 1.0, brix: 0, aw: 0.25, source: 'ai-estimate', confidence: 'unverified' },
  // ─── Sugars & syrups ──────────────────────────────────────────────────────
  // VERIFIED — pure sucrose (granulated sugar), GRAS per 21 CFR 184.1854.
  'Granulated Sugar (Sucrose)':                { brix: 100, moisture: 0, aw: 0, source: 'commodity-standard', citation: '21 CFR 184.1854 (Sucrose, GRAS)', confidence: 'verified', last_verified: '2026-04-30', notes: 'CAS 57-50-1. IUPAC: β-D-fructofuranosyl-α-D-glucopyranoside. Cane and beet sugar chemically equivalent at >99.9% purity. pH undefined for crystalline powder.' },
  // UNVERIFIED — non-pure sugars and syrups; values are AI estimates.
  'Brown Sugar (Light)':                       { brix: 97,  moisture: 2,    aw: 0.60, pH: 5.7, source: 'ai-estimate', confidence: 'unverified' },
  'Brown Sugar (Dark)':                        { brix: 97,  moisture: 2.5,  aw: 0.63, pH: 5.5, source: 'ai-estimate', confidence: 'unverified' },
  'Powdered Sugar (10X Confectioners)':        { brix: 99,  moisture: 0.5,  aw: 0.15, pH: 7.0, source: 'ai-estimate', confidence: 'unverified' },
  'Honey (Industrial Grade)':                  { brix: 81,  moisture: 17,   aw: 0.60, pH: 3.9, source: 'ai-estimate', confidence: 'unverified' },
  'Pure Maple Syrup (Grade A)':                { brix: 66,  moisture: 33,   aw: 0.81, pH: 6.5, source: 'ai-estimate', confidence: 'unverified' },
  'Agave Syrup (Light)':                       { brix: 76,  moisture: 23,   aw: 0.75, pH: 4.5, source: 'ai-estimate', confidence: 'unverified' },
  'Agave Syrup (Dark/Amber)':                  { brix: 76,  moisture: 23,   aw: 0.75, pH: 4.6, source: 'ai-estimate', confidence: 'unverified' },
  'Molasses (Blackstrap)':                     { brix: 76,  moisture: 23,   aw: 0.75, pH: 5.5, source: 'ai-estimate', confidence: 'unverified' },
  'Molasses (Fancy/Light)':                    { brix: 80,  moisture: 19,   aw: 0.72, pH: 5.2, source: 'ai-estimate', confidence: 'unverified' },
  'Corn Syrup (Light)':                        { brix: 78,  moisture: 22,   aw: 0.82, pH: 5.0, source: 'ai-estimate', confidence: 'unverified' },
  'Corn Syrup (Dark)':                         { brix: 78,  moisture: 22,   aw: 0.82, pH: 4.8, source: 'ai-estimate', confidence: 'unverified' },
  'High Fructose Corn Syrup 55 (HFCS-55)':     { brix: 77,  moisture: 23,   aw: 0.77, pH: 4.5, source: 'ai-estimate', confidence: 'unverified' },
  'High Fructose Corn Syrup 42 (HFCS-42)':     { brix: 71,  moisture: 29,   aw: 0.80, pH: 4.5, source: 'ai-estimate', confidence: 'unverified' },
  'Dextrose Monohydrate':                      { brix: 100, moisture: 0.1,  aw: 0.15, pH: 6.0, source: 'ai-estimate', confidence: 'unverified' },
  // ─── Juices & concentrates ────────────────────────────────────────────────
  'Lemon Juice (Concentrate)':                 { brix: 48, moisture: 52, aw: 0.88, pH: 2.3, source: 'ai-estimate', confidence: 'unverified' },
  'Lime Juice (Concentrate)':                  { brix: 48, moisture: 52, aw: 0.88, pH: 2.2, source: 'ai-estimate', confidence: 'unverified' },
  'Orange Juice (NFC, Fresh-Squeezed)':        { brix: 12, moisture: 88, aw: 0.98, pH: 3.8, source: 'ai-estimate', confidence: 'unverified' },
  'Apple Juice (NFC, 100%)':                   { brix: 12, moisture: 88, aw: 0.98, pH: 3.5, source: 'ai-estimate', confidence: 'unverified' },
  'Pineapple Juice (NFC)':                     { brix: 13, moisture: 86, aw: 0.98, pH: 3.5, source: 'ai-estimate', confidence: 'unverified' },
  'Cranberry Juice (100%, No Sugar)':          { brix: 7.5, moisture: 92, aw: 0.99, pH: 2.5, source: 'ai-estimate', confidence: 'unverified' },
  'Pomegranate Juice (100%)':                  { brix: 16, moisture: 84, aw: 0.97, pH: 3.1, source: 'ai-estimate', confidence: 'unverified' },
  'Tomato Juice (NFC, Industrial)':            { brix: 6,  moisture: 93, aw: 0.99, pH: 4.2, source: 'ai-estimate', confidence: 'unverified' },
  'Apple Juice Concentrate (70 Brix)':         { brix: 70, moisture: 30, aw: 0.75, pH: 3.3, source: 'ai-estimate', confidence: 'unverified' },
  'Orange Juice Concentrate (65 Brix)':        { brix: 65, moisture: 35, aw: 0.78, pH: 3.8, source: 'ai-estimate', confidence: 'unverified' },
  'Pineapple Juice Concentrate (60 Brix)':     { brix: 60, moisture: 40, aw: 0.80, pH: 3.5, source: 'ai-estimate', confidence: 'unverified' },
  'Cranberry Juice Concentrate (50 Brix)':     { brix: 50, moisture: 50, aw: 0.83, pH: 2.5, source: 'ai-estimate', confidence: 'unverified' },
  'Pomegranate Juice Concentrate (65 Brix)':   { brix: 65, moisture: 35, aw: 0.77, pH: 3.1, source: 'ai-estimate', confidence: 'unverified' },
  'White Grape Juice Concentrate (68 Brix)':   { brix: 68, moisture: 32, aw: 0.78, pH: 3.3, source: 'ai-estimate', confidence: 'unverified' },
  'Concord Grape Juice Concentrate (68 Brix)': { brix: 68, moisture: 32, aw: 0.78, pH: 3.0, source: 'ai-estimate', confidence: 'unverified' },
  'Strawberry Puree Concentrate (30 Brix)':    { brix: 30, moisture: 70, aw: 0.92, pH: 3.5, source: 'ai-estimate', confidence: 'unverified' },
  'Blueberry Juice Concentrate (65 Brix)':     { brix: 65, moisture: 35, aw: 0.78, pH: 3.2, source: 'ai-estimate', confidence: 'unverified' },
  'Raspberry Juice Concentrate (65 Brix)':     { brix: 65, moisture: 35, aw: 0.78, pH: 3.0, source: 'ai-estimate', confidence: 'unverified' },
  'Black Cherry Juice Concentrate (68 Brix)':  { brix: 68, moisture: 32, aw: 0.78, pH: 3.5, source: 'ai-estimate', confidence: 'unverified' },
  // ─── Tomato products ──────────────────────────────────────────────────────
  'Tomato Paste (28-30 Brix)':                 { brix: 29, moisture: 71, aw: 0.96, pH: 4.3, viscosityContrib: 'high', source: 'ai-estimate', confidence: 'unverified' },
  'Tomato Puree (Aseptic)':                    { brix: 11, moisture: 89, aw: 0.99, pH: 4.2, viscosityContrib: 'medium', source: 'ai-estimate', confidence: 'unverified' },
  'Mango Puree (Aseptic)':                     { brix: 15, moisture: 84, aw: 0.98, pH: 4.0, viscosityContrib: 'medium', source: 'ai-estimate', confidence: 'unverified' },
  'Apple Puree (Aseptic)':                     { brix: 11, moisture: 88, aw: 0.98, pH: 3.5, source: 'ai-estimate', confidence: 'unverified' },
  'Red Pepper Puree (Aseptic)':                { brix: 6,  moisture: 93, aw: 0.99, pH: 4.6, source: 'ai-estimate', confidence: 'unverified' },
  'Chipotle Puree':                            { brix: 9,  moisture: 89, aw: 0.97, pH: 3.9, source: 'ai-estimate', confidence: 'unverified' },
  'Pumpkin Puree (Aseptic)':                   { brix: 9,  moisture: 90, aw: 0.98, pH: 5.0, source: 'ai-estimate', confidence: 'unverified' },
  // ─── Sauces & condiments ──────────────────────────────────────────────────
  'Soy Sauce (Industrial Brewed)':             { brix: 25, moisture: 65, aw: 0.80, pH: 4.6, source: 'ai-estimate', confidence: 'unverified' },
  'Worcestershire Sauce (Industrial)':         { brix: 22, moisture: 73, aw: 0.85, pH: 3.5, aceticAcid: 1.0, source: 'ai-estimate', confidence: 'unverified' },
  'Dijon Mustard (Industrial)':                { brix: 12, moisture: 82, aw: 0.92, pH: 3.7, viscosityContrib: 'high', source: 'ai-estimate', confidence: 'unverified' },
  'Yellow Mustard (Industrial)':               { brix: 8,  moisture: 82, aw: 0.92, pH: 3.4, aceticAcid: 1.0, viscosityContrib: 'high', source: 'ai-estimate', confidence: 'unverified' },
  'Ketchup (Industrial)':                      { brix: 30, moisture: 65, aw: 0.94, pH: 3.8, aceticAcid: 0.5, viscosityContrib: 'high', source: 'ai-estimate', confidence: 'unverified' },
  'Mayonnaise Base (Industrial)':              { brix: 2,  moisture: 18, aw: 0.92, pH: 4.1, viscosityContrib: 'high', source: 'ai-estimate', confidence: 'unverified' },
  // Branded / specialty ketchups
  'Heinz Tomato Ketchup (Foodservice, HFCS)':  { brix: 30, moisture: 65, aw: 0.94, pH: 3.8, aceticAcid: 0.5, viscosityContrib: 'high', source: 'ai-estimate', confidence: 'unverified' },
  'Simply Heinz (Cane Sugar, No HFCS)':        { brix: 31, moisture: 64, aw: 0.93, pH: 3.8, aceticAcid: 0.5, viscosityContrib: 'high', source: 'ai-estimate', confidence: 'unverified' },
  'Red Gold Tomato Ketchup (Foodservice)':     { brix: 29, moisture: 65, aw: 0.94, pH: 3.9, aceticAcid: 0.5, viscosityContrib: 'high', source: 'ai-estimate', confidence: 'unverified' },
  'Sir Kensington\'s Classic Ketchup (Craft)': { brix: 24, moisture: 68, aw: 0.95, pH: 3.7, aceticAcid: 0.6, viscosityContrib: 'high', source: 'ai-estimate', confidence: 'unverified' },
  'Banana Ketchup (Filipino-Style, UFC/Jufran)': { brix: 27, moisture: 68, aw: 0.94, pH: 3.7, aceticAcid: 0.5, viscosityContrib: 'high', source: 'ai-estimate', confidence: 'unverified' },
  // Mustard variants
  'Honey Mustard (Industrial)':                { brix: 28, moisture: 65, aw: 0.93, pH: 3.9, aceticAcid: 0.7, viscosityContrib: 'high', source: 'ai-estimate', confidence: 'unverified' },
  'Whole Grain Mustard (Moutarde à l\'Ancienne)': { brix: 6, moisture: 78, aw: 0.90, pH: 3.5, aceticAcid: 1.3, viscosityContrib: 'high', source: 'ai-estimate', confidence: 'unverified' },
  'Spicy Brown Mustard (Gulden\'s-Style, Industrial)': { brix: 5, moisture: 80, aw: 0.91, pH: 3.7, aceticAcid: 1.1, viscosityContrib: 'high', source: 'ai-estimate', confidence: 'unverified' },
  'Hot English Mustard (Colman\'s-Style)':     { brix: 12, moisture: 73, aw: 0.91, pH: 4.0, aceticAcid: 0.5, viscosityContrib: 'high', source: 'ai-estimate', confidence: 'unverified' },
  'Stone-Ground Mustard (Coarse)':             { brix: 6,  moisture: 78, aw: 0.90, pH: 3.6, aceticAcid: 1.2, viscosityContrib: 'high', source: 'ai-estimate', confidence: 'unverified' },
  'Deli Mustard (Kosher-Style, Brown)':        { brix: 6,  moisture: 80, aw: 0.91, pH: 3.8, aceticAcid: 1.0, viscosityContrib: 'high', source: 'ai-estimate', confidence: 'unverified' },
  'Chinese Hot Mustard (Prepared)':            { brix: 8,  moisture: 75, aw: 0.93, pH: 4.8, aceticAcid: 0.3, viscosityContrib: 'high', source: 'ai-estimate', confidence: 'unverified' },
  'Horseradish Mustard':                       { brix: 7,  moisture: 78, aw: 0.91, pH: 3.8, aceticAcid: 1.0, viscosityContrib: 'high', source: 'ai-estimate', confidence: 'unverified' },
  // Hot sauces (all vinegar-dominant, very acidic)
  'Tabasco Original Red Pepper Sauce':         { brix: 0.5, moisture: 94, aw: 0.97, pH: 3.4, aceticAcid: 2.5, source: 'ai-estimate', confidence: 'unverified' },
  'Frank\'s RedHot Original Cayenne Pepper Sauce': { brix: 1, moisture: 95, aw: 0.98, pH: 3.5, aceticAcid: 2.0, source: 'ai-estimate', confidence: 'unverified' },
  'Crystal Hot Sauce (Baumer Foods, Louisiana-Style)': { brix: 0.5, moisture: 94, aw: 0.97, pH: 3.1, aceticAcid: 3.0, source: 'ai-estimate', confidence: 'unverified' },
  'Louisiana Brand The Original Hot Sauce':    { brix: 0.5, moisture: 94, aw: 0.97, pH: 3.2, aceticAcid: 2.8, source: 'ai-estimate', confidence: 'unverified' },
  'Louisiana Brand Habanero Hot Sauce':        { brix: 1,   moisture: 93, aw: 0.96, pH: 3.5, aceticAcid: 2.2, source: 'ai-estimate', confidence: 'unverified' },
  'Cholula Hot Sauce Original (Mexican)':      { brix: 2,   moisture: 93, aw: 0.96, pH: 3.3, aceticAcid: 2.0, source: 'ai-estimate', confidence: 'unverified' },
  'Texas Pete Original Hot Sauce':             { brix: 0.5, moisture: 95, aw: 0.97, pH: 3.4, aceticAcid: 2.2, source: 'ai-estimate', confidence: 'unverified' },
  'Valentina Salsa Picante (Mexican)':         { brix: 3,   moisture: 90, aw: 0.95, pH: 3.7, aceticAcid: 1.5, source: 'ai-estimate', confidence: 'unverified' },
  'El Yucateco Green Habanero Sauce':          { brix: 3,   moisture: 91, aw: 0.96, pH: 3.6, aceticAcid: 1.5, source: 'ai-estimate', confidence: 'unverified' },
  'Tabasco Green Jalapeño Sauce':              { brix: 2,   moisture: 93, aw: 0.96, pH: 3.8, aceticAcid: 1.5, source: 'ai-estimate', confidence: 'unverified' },
  // ─── Salts ────────────────────────────────────────────────────────────────
  // VERIFIED — all SKUs are >99% NaCl per Food Chemicals Codex; same citation.
  'Salt (Food Grade Fine)':                    { aw: 0.75, brix: 0, moisture: 0, source: 'commodity-standard', citation: '21 CFR 182 (basic GRAS list); Food Chemicals Codex monograph for sodium chloride', confidence: 'verified', last_verified: '2026-04-30', notes: 'CAS 7647-14-5. pH undefined for crystalline NaCl. Saturated NaCl solution aw=0.75 is a thermodynamic constant used as calibration standard for aw meters; in dry crystalline form aw approaches 0.' },
  'Kosher Salt (Diamond Crystal)':             { aw: 0.75, brix: 0, moisture: 0, source: 'commodity-standard', citation: '21 CFR 182 (basic GRAS list); Food Chemicals Codex monograph for sodium chloride', confidence: 'verified', last_verified: '2026-04-30', notes: 'CAS 7647-14-5. >99% NaCl, hollow-pyramid crystal form. Same chemistry as fine salt.' },
  'Kosher Salt (Morton)':                      { aw: 0.75, brix: 0, moisture: 0, source: 'commodity-standard', citation: '21 CFR 182 (basic GRAS list); Food Chemicals Codex monograph for sodium chloride', confidence: 'verified', last_verified: '2026-04-30', notes: 'CAS 7647-14-5. >99% NaCl, flake form. Same chemistry as fine salt.' },
  'Fine Sea Salt (Bakery)':                    { aw: 0.75, brix: 0, moisture: 0, source: 'commodity-standard', citation: '21 CFR 182 (basic GRAS list); Food Chemicals Codex monograph for sodium chloride', confidence: 'verified', last_verified: '2026-04-30', notes: 'CAS 7647-14-5. >99% NaCl. Same chemistry as fine salt; trace mineral content not regulatorily significant.' },
  'Flaky Finishing Salt (Maldon-Style)':       { aw: 0.75, brix: 0, moisture: 0, source: 'commodity-standard', citation: '21 CFR 182 (basic GRAS list); Food Chemicals Codex monograph for sodium chloride', confidence: 'verified', last_verified: '2026-04-30', notes: 'CAS 7647-14-5. >99% NaCl, flake crystal form.' },
  'Pink Himalayan Salt (Fine)':                { aw: 0.75, brix: 0, moisture: 0, source: 'commodity-standard', citation: '21 CFR 182 (basic GRAS list); Food Chemicals Codex monograph for sodium chloride', confidence: 'verified', last_verified: '2026-04-30', notes: 'CAS 7647-14-5. >99% NaCl. Pink color from trace iron oxide; not regulatorily significant.' },
  // ─── Dried aromatic explicit pH overrides ─────────────────────────────────
  // These prevent silent misclassification when dry aromatics are tagged
  // to broader DB categories. All have pH 5-6 → count as low-acid bases
  // toward the 21 CFR 114 acidified-food 5% threshold.
  // UNVERIFIED — pH/aw values are AI estimates.
  'Garlic Powder (Industrial)':                { brix: 0, moisture: 6,  aw: 0.35, pH: 5.3, source: 'ai-estimate', confidence: 'unverified' },
  'Onion Powder (Industrial)':                 { brix: 0, moisture: 5,  aw: 0.35, pH: 5.5, source: 'ai-estimate', confidence: 'unverified' },
  'Garlic Powder (Granulated, California Grown)': { brix: 0, moisture: 6,  aw: 0.35, pH: 5.3, source: 'ai-estimate', confidence: 'unverified' },
  'Onion Powder (Granulated)':                 { brix: 0, moisture: 5,  aw: 0.35, pH: 5.5, source: 'ai-estimate', confidence: 'unverified' },
  'Black Pepper (Ground, Industrial)':         { brix: 0, moisture: 8,  aw: 0.35, pH: 5.8, source: 'ai-estimate', confidence: 'unverified' },
  'Black Pepper, Coarse 16 Mesh (Butcher Grind)': { brix: 0, moisture: 8,  aw: 0.35, pH: 5.8, source: 'ai-estimate', confidence: 'unverified' },
  'Cayenne Pepper (40,000 HU)':                { brix: 0, moisture: 8,  aw: 0.35, pH: 5.1, source: 'ai-estimate', confidence: 'unverified' },
  'Cayenne Pepper (40K SHU)':                  { brix: 0, moisture: 8,  aw: 0.35, pH: 5.1, source: 'ai-estimate', confidence: 'unverified' },
  'Thyme (Dried, Leaves)':                     { brix: 0, moisture: 9,  aw: 0.35, pH: 5.5, source: 'ai-estimate', confidence: 'unverified' },
  'Paprika, Sweet Hungarian':                  { brix: 0, moisture: 9,  aw: 0.35, pH: 5.0, source: 'ai-estimate', confidence: 'unverified' },
  'Smoked Paprika (Sweet, Spanish La Chinata)':{ brix: 0, moisture: 9,  aw: 0.35, pH: 5.0, source: 'ai-estimate', confidence: 'unverified' },
  'Ground Cumin (Fine, Mexican)':              { brix: 0, moisture: 8,  aw: 0.35, pH: 5.5, source: 'ai-estimate', confidence: 'unverified' },
  'Coriander Seed (Whole)':                    { brix: 0, moisture: 8,  aw: 0.35, pH: 5.6, source: 'ai-estimate', confidence: 'unverified' },
  'Ground Allspice (Jamaican)':                { brix: 0, moisture: 8,  aw: 0.35, pH: 5.4, source: 'ai-estimate', confidence: 'unverified' },
  'Whole Allspice (Jamaican)':                 { brix: 0, moisture: 8,  aw: 0.35, pH: 5.4, source: 'ai-estimate', confidence: 'unverified' },
  'Ginger (Ground, Dried)':                    { brix: 0, moisture: 9,  aw: 0.35, pH: 5.8, source: 'ai-estimate', confidence: 'unverified' },
  'Chipotle Powder (Smoked Jalapeño)':         { brix: 0, moisture: 8,  aw: 0.35, pH: 5.0, source: 'ai-estimate', confidence: 'unverified' },
  'Ancho Chili Powder':                        { brix: 0, moisture: 9,  aw: 0.35, pH: 5.1, source: 'ai-estimate', confidence: 'unverified' },
  // Xanthan variant to match the F&B DB mesh-size SKU
  'Xanthan Gum (Food Grade, 200 Mesh)':        { brix: 0, moisture: 10, aw: 0.35, pH: 7.0, viscosityContrib: 'very high', source: 'ai-estimate', confidence: 'unverified' },
  // Mustard Flour — low-acid dry base (pH ~5.5), was silently miscategorized
  'Mustard Flour (Yellow)':                    { brix: 0, moisture: 6,  aw: 0.35, pH: 5.4, source: 'ai-estimate', confidence: 'unverified' },
  'Mustard Powder (Yellow, Hot)':              { brix: 0, moisture: 6,  aw: 0.35, pH: 5.4, source: 'ai-estimate', confidence: 'unverified' },
  'Natural Flavors (Liquid)':                  { brix: 5, moisture: 70, aw: 0.85, pH: 5.0, source: 'ai-estimate', confidence: 'unverified' },
  'Caramel Color (Class III)':                 { brix: 65, moisture: 30, aw: 0.75, pH: 3.5, source: 'ai-estimate', confidence: 'unverified' },
  // ─── Gums / thickeners / emulsifiers ──────────────────────────────────────
  'Xanthan Gum (Food Grade)':                  { brix: 0, moisture: 10, aw: 0.35, pH: 7.0, viscosityContrib: 'very high', source: 'ai-estimate', confidence: 'unverified' },
  'Modified Food Starch (Waxy Maize)':         { brix: 0, moisture: 11, aw: 0.40, pH: 6.5, viscosityContrib: 'high', source: 'ai-estimate', confidence: 'unverified' },
  'Mono and Diglycerides':                     { brix: 0, moisture: 0.5, aw: 0.20, pH: 6.5, viscosityContrib: 'medium', source: 'ai-estimate', confidence: 'unverified' },
  'Soy Lecithin':                              { brix: 0, moisture: 1,  aw: 0.30, pH: 6.5, viscosityContrib: 'medium', source: 'ai-estimate', confidence: 'unverified' },
  'Sunflower Lecithin':                        { brix: 0, moisture: 1,  aw: 0.30, pH: 6.5, viscosityContrib: 'medium', source: 'ai-estimate', confidence: 'unverified' },
  // ─── Oils ─────────────────────────────────────────────────────────────────
  'Soybean Oil (RBD)':                         { brix: 0, moisture: 0.05, aw: 0.05, pH: 7.0, viscosityContrib: 'medium', source: 'ai-estimate', confidence: 'unverified' },
  'Canola Oil (Industrial Grade)':             { brix: 0, moisture: 0.05, aw: 0.05, pH: 7.0, viscosityContrib: 'medium', source: 'ai-estimate', confidence: 'unverified' },
  'Extra Virgin Olive Oil':                    { brix: 0, moisture: 0.05, aw: 0.05, pH: 7.0, viscosityContrib: 'medium', source: 'ai-estimate', confidence: 'unverified' },
  // ─── Water ────────────────────────────────────────────────────────────────
  // VERIFIED — water is the reference point of the aw scale (1.000 by definition).
  'Water':                                     { brix: 0, moisture: 100, aw: 1.000, pH: 7.0, source: 'commodity-standard', citation: 'USP Purified Water monograph; USP <1231> Water for Pharmaceutical Purposes; 21 CFR 165.110 (Bottled Water)', confidence: 'verified', last_verified: '2026-04-30', notes: 'Water activity 1.000 by chemical definition (reference point of aw scale).' },
  'Filtered Water (Carbon-Filtered, Dechlorinated)': { brix: 0, moisture: 100, aw: 1.000, pH: 7.0, source: 'commodity-standard', citation: 'USP Purified Water monograph; USP <1231> Water for Pharmaceutical Purposes; 21 CFR 165.110 (Bottled Water)', confidence: 'verified', last_verified: '2026-04-30' },
  'Reverse Osmosis Water (RO, Demineralized)': { brix: 0, moisture: 100, aw: 1.000, pH: 6.8, source: 'commodity-standard', citation: 'USP Purified Water monograph; USP <1231> Water for Pharmaceutical Purposes; 21 CFR 165.110 (Bottled Water)', confidence: 'verified', last_verified: '2026-04-30' },
  'Mineral Water (Structured, Moderate Hardness)': { brix: 0, moisture: 100, aw: 1.000, pH: 7.4, source: 'commodity-standard', citation: 'USP Purified Water monograph; USP <1231> Water for Pharmaceutical Purposes; 21 CFR 165.110 (Bottled Water)', confidence: 'verified', last_verified: '2026-04-30' },
  // UNVERIFIED — alkaline water is intentionally non-neutral; pH 9.5 is the
  // reason this entry exists separately. Do NOT roll into the verified water
  // citation; treat as a flavored/specialty beverage.
  'Alkaline Water (pH 9.5)':                   { brix: 0, moisture: 100, aw: 1.0, pH: 9.5, source: 'ai-estimate', confidence: 'unverified' },
  // ─── Egg products ─────────────────────────────────────────────────────────
  'Whole Egg Powder':                          { brix: 0, moisture: 5, aw: 0.25, pH: 7.5, source: 'ai-estimate', confidence: 'unverified' },
  // ─── Baking-specific overrides ────────────────────────────────────────────
  'Fresh Yeast (Compressed / Cake)':           { brix: 0,  moisture: 70, aw: 0.98, pH: 5.5, source: 'ai-estimate', confidence: 'unverified' },
  'Active Dry Yeast (ADY)':                    { brix: 0,  moisture: 8,  aw: 0.40, pH: 6.2, source: 'ai-estimate', confidence: 'unverified' },
  'Instant Yeast (SAF Red / Gold)':            { brix: 0,  moisture: 5,  aw: 0.35, pH: 6.2, source: 'ai-estimate', confidence: 'unverified' },
  'Osmotolerant Yeast (SAF Gold / Sweet Dough)': { brix: 0, moisture: 5, aw: 0.35, pH: 6.2, source: 'ai-estimate', confidence: 'unverified' },
  'Sourdough Starter (Dried, Heritage)':       { brix: 0,  moisture: 10, aw: 0.45, pH: 4.3, source: 'ai-estimate', confidence: 'unverified' },
  // VERIFIED — sodium bicarbonate, GRAS per 21 CFR 184.1736 / 582.1736.
  'Baking Soda (Sodium Bicarbonate)':          { brix: 0, moisture: 0, aw: 0, source: 'commodity-standard', citation: '21 CFR 184.1736 (Sodium Bicarbonate, GRAS); 21 CFR 582.1736; Food Chemicals Codex 3rd ed. p. 278', confidence: 'verified', last_verified: '2026-04-30', notes: 'CAS 144-55-8. pH undefined for the dry powder; in 1% aqueous solution pH ~8.3. NOT to be confused with baking powder, which is a compound ingredient with multiple components.' },
  'Baking Powder (Double-Acting, Aluminum-Free)': { brix: 0, moisture: 2, aw: 0.30, pH: 6.8, source: 'ai-estimate', confidence: 'unverified' },
  'Cream of Tartar (Potassium Bitartrate)':    { brix: 0,  moisture: 0.1, aw: 0.20, pH: 3.6, source: 'ai-estimate', confidence: 'unverified' },
  // ─── Dairy that isn't nearly water (butter) ───────────────────────────────
  'Unsalted Butter (AA Grade, 82% MF)':        { brix: 0, moisture: 16, aw: 0.95, pH: 6.2, source: 'ai-estimate', confidence: 'unverified' },
  'European-Style Butter (84%+ MF, Cultured)': { brix: 0, moisture: 14, aw: 0.94, pH: 5.1, source: 'ai-estimate', confidence: 'unverified' },
  'Heavy Cream (36%+ MF)':                     { brix: 3, moisture: 57, aw: 0.98, pH: 6.5, source: 'ai-estimate', confidence: 'unverified' },
  // ─── Vanilla / extracts / aromatics ───────────────────────────────────────
  'Vanilla Extract (Pure, Single-Fold)':       { brix: 5, moisture: 55, aw: 0.80, pH: 4.3, source: 'ai-estimate', confidence: 'unverified' },
  'Vanilla Bean Paste (Seeded)':               { brix: 68, moisture: 29, aw: 0.75, pH: 4.5, source: 'ai-estimate', confidence: 'unverified' },
  'Almond Extract (Pure)':                     { brix: 0, moisture: 60, aw: 0.85, pH: 5.5, source: 'ai-estimate', confidence: 'unverified' },
  'Lemon Extract (Pure)':                      { brix: 0, moisture: 20, aw: 0.75, pH: 4.0, source: 'ai-estimate', confidence: 'unverified' },
  'Orange Extract (Pure)':                     { brix: 0, moisture: 20, aw: 0.75, pH: 4.0, source: 'ai-estimate', confidence: 'unverified' },
  'Peppermint Extract (Pure)':                 { brix: 0, moisture: 20, aw: 0.75, pH: 5.0, source: 'ai-estimate', confidence: 'unverified' },
  'Rose Water (Food-Grade)':                   { brix: 0, moisture: 99, aw: 1.0, pH: 6.5, source: 'ai-estimate', confidence: 'unverified' },
  'Orange Blossom Water (Food-Grade)':         { brix: 0, moisture: 99, aw: 1.0, pH: 6.5, source: 'ai-estimate', confidence: 'unverified' },
  'Egg Yolk Powder':                           { brix: 0, moisture: 5, aw: 0.30, pH: 6.4, viscosityContrib: 'high', source: 'ai-estimate', confidence: 'unverified' },
  'Egg White Powder (Albumen)':                { brix: 0, moisture: 7, aw: 0.35, pH: 9.0, source: 'ai-estimate', confidence: 'unverified' },
  // ─── Proteins / nut butters ───────────────────────────────────────────────
  'Tahini (Hulled Sesame Paste)':              { brix: 0, moisture: 2, aw: 0.35, pH: 6.3, viscosityContrib: 'very high', source: 'ai-estimate', confidence: 'unverified' },
  'Tahini (Unhulled/Whole Sesame Paste)':      { brix: 0, moisture: 2, aw: 0.35, pH: 6.3, viscosityContrib: 'very high', source: 'ai-estimate', confidence: 'unverified' },
  'Peanut Butter (Industrial/Processed)':      { brix: 0, moisture: 2, aw: 0.35, pH: 6.3, viscosityContrib: 'very high', source: 'ai-estimate', confidence: 'unverified' },
  'Almond Butter (Industrial)':                { brix: 0, moisture: 2, aw: 0.35, pH: 6.5, viscosityContrib: 'very high', source: 'ai-estimate', confidence: 'unverified' },
};

// ----- Lookup ----------------------------------------------------------------

/**
 * Infer an ingredient's category from its name alone, for cases where the
 * caller hasn't explicitly tagged it (e.g., bulk-paste entries that didn't
 * match a specific DB SKU but whose category is obvious from the name).
 *
 * This is a SAFETY-CRITICAL fallback: without category inference, a
 * typed ingredient name like "Black Pepper (Butcher Grind)" that doesn't
 * exact-match the F&B DB entry "Black Pepper (Ground, Industrial)" would
 * have NO pH data → would silently drop out of the low-acid component
 * calculation → would misclassify the formula. This function ensures
 * any reasonably-named spice, sweetener, or vegetable gets a sensible
 * category even when the exact SKU match fails.
 */
export function inferCategoryFromName(name: string): string | undefined {
  const n = name.toLowerCase();
  // Salts — excluded from LAC by separate salt-name check, but give them a category
  if (/\bsalt\b/.test(n)) return 'Spices';
  // Sugars, sweeteners
  if (/\bsugar\b|\bsucrose\b|\bdextrose\b|\bmaltose\b|\bfructose\b|\bhoney\b|\bagave\b|\bmolasses\b|\bmaple syrup\b|\bcorn syrup\b|\bhfcs\b|\ballulose\b|\berythritol\b|\bxylitol\b|\bsorbitol\b|\bmaltitol\b|\bstevia\b|\bmonk fruit\b|\bsucralose\b|\baspartame\b|\bacesulfame\b|\bsaccharin\b/.test(n)) return 'Sweeteners';
  // Fats & oils
  if (/\boil\b|\btallow\b|\blard\b|\bshortening\b|\bbutter\b|\bghee\b|\bmargarine\b|\bcocoa butter\b|\bshea butter\b|\bmct\b/.test(n)) return 'Fats & Oils';
  // Water / ice
  if (/^water\b|\bice\b/.test(n)) return 'Water & Ice';
  // Vinegars, acids, juices — strongly acidic, already caught by direct pH spec match in most cases
  if (/\bvinegar\b|\bacetic acid\b|\bcitric acid\b|\blactic acid\b|\bmalic acid\b/.test(n)) return 'Condiment Ingredients';
  if (/\bjuice\b(?!.*powder)|\bconcentrate\b/.test(n)) return 'Juices';
  // Spices (critical for LAC calculation!)
  if (/\bpepper\b|\bcayenne\b|\bpaprika\b|\bchili powder\b|\bchile powder\b|\bchipotle\b|\bancho\b|\bjalape[nñ]o powder\b|\bhabanero powder\b|\bturmeric\b|\bcinnamon\b|\bnutmeg\b|\bclove\b|\ballspice\b|\bginger powder\b|\bgarlic powder\b|\bgarlic granulated\b|\bonion powder\b|\bonion granulated\b|\bcumin\b|\bcoriander\b|\bfennel\b|\banise\b|\bcardamom\b|\bmustard (seed|powder|flour)\b|\bmustard flour\b|\bsage\b|\bthyme\b|\brosemary\b|\boregano\b|\bbasil\b|\btarragon\b|\bmarjoram\b|\bbay leaf\b|\bbay leaves\b|\bdill\b|\bparsley\b|\bchive\b|\bgaram masala\b|\bcurry powder\b|\bspice blend\b|\bseasoning blend\b|\bmace\b|\bsumac\b|\bfenugreek\b|\bsaffron\b|\bstar anise\b|\bcelery (seed|powder)\b/.test(n)) return 'Spices';
  // Fresh produce
  if (/\bfresh\b.*\b(pepper|onion|garlic|tomato|ginger|lemon|lime|orange|apple|banana|jalape[nñ]o|scallion|shallot|herb|cilantro|parsley|mint|basil|rosemary|thyme)/.test(n)) return 'Fresh Produce';
  // Dairy
  if (/\bmilk\b|\bcream\b(?!.*tartar)|\bcheese\b|\byogurt\b|\bwhey\b|\bcasein\b|\blactose\b|\bkefir\b/.test(n)) return 'Dairy';
  // Eggs
  if (/\begg\b|\bwhole egg\b|\begg white\b|\begg yolk\b|\balbumen\b/.test(n)) return 'Egg Products';
  // Nuts / seeds / legumes
  if (/\balmond\b|\bwalnut\b|\bpecan\b|\bpistachio\b|\bhazelnut\b|\bmacadamia\b|\bcashew\b|\bpeanut\b|\bsesame\b|\bchia\b|\bflax\b|\bsunflower seed\b|\bpumpkin seed\b|\bhemp seed\b/.test(n)) return 'Legumes & Nuts & Seeds';
  // Flours / grains
  if (/\bflour\b|\brice\b|\boat\b|\bquinoa\b|\bbarley\b|\brye\b|\bwheat\b|\bbran\b|\bsemolina\b|\bspelt\b|\bmillet\b|\bteff\b|\bamaranth\b|\bbuckwheat\b|\bsorghum\b|\bcorn meal\b|\bcornmeal\b|\bpolenta\b|\bgrits\b/.test(n)) return 'Flours & Grains';
  return undefined;
}

/**
 * Look up the best-available spec for an ingredient. Priority:
 * 1) Exact name match in INGREDIENT_SPECS
 * 2) Partial name match (e.g., 'Water' in 'Water (Potable)')
 * 3) Category default (explicitly passed in)
 * 4) Category INFERRED from name heuristics (safety-critical fallback)
 * 5) Empty fallback tagged 'ai-estimate' / 'unverified' so the gate counts
 *    unmatched ingredients toward the unverified-mass tally.
 */
export function getSpec(name: string, category: string | undefined): IngredientSpec {
  if (INGREDIENT_SPECS[name]) return INGREDIENT_SPECS[name];
  // Water matches: "Water", "Water (Potable / Treated)", "Water, tap", "Water tap", "Water (RO)", etc.
  // Excludes compound names like "Coconut Water", "Rose Water", "Watermelon Juice".
  if (/^water(\s|\(|,|$)/i.test(name)) {
    return INGREDIENT_SPECS['Water'];
  }
  // Ice behaves like water for all practical purposes (once melted).
  if (/^ice(\s|\(|,|$)/i.test(name)) {
    return INGREDIENT_SPECS['Water'];
  }
  if (category && CATEGORY_SPECS[category]) return CATEGORY_SPECS[category];
  // Safety-critical fallback: infer category from the name itself so that
  // near-miss ingredients (DB typo, different SKU variant, custom-typed)
  // still get a reasonable pH/aw/moisture default and participate correctly
  // in classification.
  const inferred = inferCategoryFromName(name);
  if (inferred && CATEGORY_SPECS[inferred]) return CATEGORY_SPECS[inferred];
  // No data at all. Return a minimally-typed unverified entry so the gate
  // treats this ingredient as unverified mass.
  return { source: 'ai-estimate', confidence: 'unverified' };
}

// ============================================================
// Confidence Taxonomy (2026-05-07 architectural reframe)
// ------------------------------------------------------------
// Renders every numeric value with a Confidence level + tolerance
// range. False precision is worse than honest estimation; "pH 4.0
// ± 0.3 (estimated)" is more trustworthy than "pH 4.02" without
// context. See memory/project_honest_estimate_reframe.md and
// types/index.ts for the Confidence/RangedValue types.
// ============================================================

/**
 * Numeric properties the system attaches confidence + range to.
 * Some metrics use absolute tolerances (pH is logarithmic; a_w is bounded
 * 0–1; moisture is itself a percentage), others use relative (Brix, acetic
 * acid, calories scale across orders of magnitude).
 */
export type SpecMetric = 'pH' | 'aw' | 'brix' | 'moisture' | 'aceticAcid' | 'nutrition';

interface RangeRule { kind: 'abs' | 'rel'; tolerance: number; }

/**
 * Per-metric tolerance ladder. The MEASURED column is the global default;
 * supplier-COA tolerances may tighten it per-ingredient when ingested
 * (override mechanism not yet implemented — see Session 2+).
 */
export const RANGE_TABLE: Record<SpecMetric, Record<Confidence, RangeRule>> = {
  pH:         { measured: { kind: 'abs', tolerance: 0.1   }, calculated: { kind: 'abs', tolerance: 0.2  }, estimated: { kind: 'abs', tolerance: 0.3  }, inferred: { kind: 'abs', tolerance: 0.5  }, unknown: { kind: 'abs', tolerance: 0 } },
  aw:         { measured: { kind: 'abs', tolerance: 0.005 }, calculated: { kind: 'abs', tolerance: 0.01 }, estimated: { kind: 'abs', tolerance: 0.03 }, inferred: { kind: 'abs', tolerance: 0.10 }, unknown: { kind: 'abs', tolerance: 0 } },
  brix:       { measured: { kind: 'rel', tolerance: 0.02  }, calculated: { kind: 'rel', tolerance: 0.05 }, estimated: { kind: 'rel', tolerance: 0.15 }, inferred: { kind: 'rel', tolerance: 0.30 }, unknown: { kind: 'rel', tolerance: 0 } },
  moisture:   { measured: { kind: 'abs', tolerance: 0.5   }, calculated: { kind: 'abs', tolerance: 1    }, estimated: { kind: 'abs', tolerance: 3    }, inferred: { kind: 'abs', tolerance: 10   }, unknown: { kind: 'abs', tolerance: 0 } },
  aceticAcid: { measured: { kind: 'rel', tolerance: 0.02  }, calculated: { kind: 'rel', tolerance: 0.05 }, estimated: { kind: 'rel', tolerance: 0.15 }, inferred: { kind: 'rel', tolerance: 0.30 }, unknown: { kind: 'rel', tolerance: 0 } },
  nutrition:  { measured: { kind: 'rel', tolerance: 0.02  }, calculated: { kind: 'rel', tolerance: 0.05 }, estimated: { kind: 'rel', tolerance: 0.15 }, inferred: { kind: 'rel', tolerance: 0.30 }, unknown: { kind: 'rel', tolerance: 0 } },
};

/**
 * Build a RangedValue from a metric, value, and confidence level. Bounds are
 * clamped to the metric's natural domain (a_w ∈ [0,1]; everything else ≥ 0).
 */
export function rangedSpec(
  metric: SpecMetric,
  value: number,
  confidence: Confidence,
  source?: string,
  method?: string,
): RangedValue {
  const rule = RANGE_TABLE[metric][confidence];
  const delta = rule.kind === 'abs' ? rule.tolerance : value * rule.tolerance;
  const low = Math.max(0, value - delta);
  const high = metric === 'aw' ? Math.min(1, value + delta) : value + delta;
  return { value, range: { low, high }, confidence, source, method };
}

/**
 * Translate the data-layer's IngredientSpec confidence/source into the
 * user-facing 5-level Confidence taxonomy.
 *
 * Mapping:
 *   • confidence: 'verified' → MEASURED (both 'commodity-standard' and
 *     'cited-reference' carry citations and have been audited; CALCULATED
 *     is reserved for derived values that don't yet flow through this path)
 *   • source: 'category-default' → INFERRED (no entry-specific basis)
 *   • source: 'ai-estimate' → ESTIMATED (entry-specific but unverified)
 */
export function mapSpecToConfidence(spec: IngredientSpec): Confidence {
  if (spec.confidence === 'verified') return 'measured';
  if (spec.source === 'category-default') return 'inferred';
  return 'estimated';
}

// ============================================================
// Cost-class confidence (Class 1a — commercial terms)
// ------------------------------------------------------------
// Cost has wider real-world variance than chemistry: agricultural
// commodity pricing swings ±25% within seasons, ±50% across years.
// Verified supplier quotes age out — a quote captured today is
// MEASURED but auto-downgrades to ESTIMATED after costValidUntil
// passes (default 60 days from capture). See feedback memory:
// three_class_value_taxonomy.md.
// ============================================================

const COST_RANGE_TABLE: Record<Confidence, RangeRule> = {
  measured:   { kind: 'rel', tolerance: 0.05 }, // verified quote within validity
  calculated: { kind: 'rel', tolerance: 0.05 }, // propagated rollup from MEASURED inputs
  estimated:  { kind: 'rel', tolerance: 0.25 }, // industry-typical / stale quote / AI scaffolding
  inferred:   { kind: 'rel', tolerance: 0.50 }, // category default / extrapolation
  unknown:    { kind: 'rel', tolerance: 0    },
};

/**
 * Build a RangedValue for a cost (per-kg, per-formula, per-package, per-serving).
 * Always relative tolerances; bounds clamped to >= 0.
 */
export function costRangedSpec(value: number, confidence: Confidence, source?: string): RangedValue {
  const rule = COST_RANGE_TABLE[confidence];
  const delta = value * rule.tolerance;
  return { value, range: { low: Math.max(0, value - delta), high: value + delta }, confidence, source };
}

/**
 * Translate an IndustrialIngredient's cost-provenance fields into the
 * 5-level Confidence taxonomy. Pass `today` (YYYY-MM-DD) to override the
 * staleness check date for testing; defaults to the current date.
 *
 * Mapping:
 *   • costPerKg falsy → UNKNOWN
 *   • costSource: 'verified-quote' + within costValidUntil → MEASURED
 *   • costSource: 'verified-quote' + past costValidUntil   → ESTIMATED (stale)
 *   • costSource: 'verified-quote' + no validUntil set     → ESTIMATED (treat as stale)
 *   • costSource: 'category-default' → INFERRED
 *   • costSource undefined or 'industry-typical' → ESTIMATED
 */
export function mapCostToConfidence(ing: IndustrialIngredient | null | undefined, today?: string): Confidence {
  if (!ing || !ing.costPerKg || ing.costPerKg <= 0) return 'unknown';
  const source = ing.costSource;
  if (source === 'verified-quote') {
    if (!ing.costValidUntil) return 'estimated';
    const todayStr = today ?? new Date().toISOString().slice(0, 10);
    return ing.costValidUntil >= todayStr ? 'measured' : 'estimated';
  }
  if (source === 'category-default') return 'inferred';
  return 'estimated';
}

/**
 * Empirical moisture → water activity curve.
 * ------------------------------------------------------------
 * Pure mass-weighted a_w averaging is inaccurate for mixed-phase foods: a concentrated
 * solute (e.g., dry brown sugar at a_w 0.60) doesn't retain its "dry" a_w once
 * dispersed into the water phase of a sauce. The water phase dominates.
 *
 * This curve maps % moisture (whole formulation, mass basis) to the a_w that would be
 * observed in a typical solute-water mixture at that moisture level. Values derived
 * from published food-microbiology references (ICMSF, Jay, Fennema).
 *
 * Used alongside mass-weighted a_w — the estimator takes MAX of the two so neither
 * under- nor over-estimates grossly.
 */
function awFromMoisture(moisturePct: number): number {
  if (moisturePct >= 95) return 0.99;
  if (moisturePct >= 85) return 0.97;
  if (moisturePct >= 75) return 0.94;
  if (moisturePct >= 65) return 0.92;
  if (moisturePct >= 55) return 0.88;
  if (moisturePct >= 45) return 0.83;
  if (moisturePct >= 35) return 0.77;
  if (moisturePct >= 25) return 0.68;
  if (moisturePct >= 15) return 0.55;
  if (moisturePct >= 10) return 0.45;
  if (moisturePct >= 5) return 0.35;
  return 0.25;
}

// ----- Estimator -------------------------------------------------------------

export interface SpecInputIngredient {
  name: string;
  qty: number;
  unit: string;
  category?: string;
  /** Optional direct reference (e.g., an IndustrialIngredient from the DB). */
  ref?: IndustrialIngredient | null;
}

// ----- Classification --------------------------------------------------------

export interface ClassificationInput {
  ingredients: SpecInputIngredient[];
  totalMass: number;
  pH: number;
  aw: number;
  lowAcidComponentPct: number;
  hasAcidulant: boolean;
}

export interface ClassificationResult {
  productClassification: FormulationSpecs['productClassification'];
  regulatoryClass: string;
  verifiedMassPct: number;
  unverifiedIngredients: Array<{ name: string; massPct: number }>;
}

/**
 * Classify a formulation per 21 CFR 113 / 114 — with a provenance gate.
 *
 * (a) VERIFIED-MASS COVERAGE
 *   For every ingredient in the formulation, getSpec() resolves an
 *   IngredientSpec whose `confidence` is either 'verified' or 'unverified'.
 *   Verified-mass coverage = (sum of grams of ingredients whose spec is
 *   tagged confidence='verified') / (total formulation grams) × 100.
 *   Verified entries are limited to commodity-standard chemistries (water,
 *   NaCl, sucrose, vinegars, citric acid, sodium bicarbonate, glacial
 *   acetic acid) with regulatory or chemical-definition citations.
 *
 * (b) GATE THRESHOLDS
 *   The classifier proceeds with the existing pH/aw/LAC decision tree only
 *   when BOTH conditions hold:
 *     1. Verified-mass coverage ≥ 80% of total formulation mass.
 *     2. No single unverified ingredient exceeds 10% of total mass.
 *   The 10% cap stops a single "trust me" ingredient from dominating the
 *   safety calc. Failing either condition returns 'insufficient-data'.
 *
 * (c) WHAT 'insufficient-data' MEANS
 *   The formulation cannot be safely classified per 21 CFR 113/114 from
 *   the data on hand. The user must add lab-verified or supplier-COA pH,
 *   aw, and acidity values for the ingredients listed in
 *   `unverifiedIngredients` (sorted desc by mass) before any regulatory
 *   determination is meaningful.
 *
 * (d) WHY THE GATE EXISTS
 *   A 2026-04-30 audit confirmed every numeric value in INGREDIENT_SPECS
 *   and CATEGORY_SPECS was AI-generated during scaffolding without
 *   provenance, citation, or lab verification. Two real regulatory bugs
 *   followed: false "Acidified Food" labels on un-acidified raw vegetables
 *   and false "Shelf-Stable Dry" labels on high-water raw produce. The
 *   gate makes the classifier refuse to render a determination when its
 *   inputs are mostly fabricated, rather than confidently emit the wrong
 *   answer.
 *
 * (e) DO NOT WEAKEN THIS GATE
 *   Lowering the 80% threshold, raising the 10% per-ingredient cap, or
 *   widening the verified-entries set without re-checking provenance is
 *   a regulatory-safety regression. Before changing any threshold, READ
 *   ARCHITECTURE.md and CONSULT AN FDA-RECOGNIZED PROCESS AUTHORITY.
 *   This function exists because mis-classification has already happened
 *   in this codebase; do not restore the conditions that produced those
 *   bugs.
 */
export function classifyFormulation(input: ClassificationInput): ClassificationResult {
  const { ingredients, totalMass, pH, aw, lowAcidComponentPct, hasAcidulant } = input;

  // ─── 1. Compute verified-mass coverage and unverified breakdown ─────────
  let verifiedMass = 0;
  const unverifiedByIng: Array<{ name: string; massG: number }> = [];
  for (const ing of ingredients) {
    const g = ing.qty * (UNIT_TO_GRAMS[ing.unit] || 1);
    if (g <= 0) continue;
    const spec = getSpec(ing.name, ing.category);
    if (spec.confidence === 'verified') {
      verifiedMass += g;
    } else {
      unverifiedByIng.push({ name: ing.name, massG: g });
    }
  }
  const verifiedMassPct = totalMass > 0 ? (verifiedMass / totalMass) * 100 : 0;
  const unverifiedIngredients = unverifiedByIng
    .map(u => ({ name: u.name, massPct: totalMass > 0 ? (u.massG / totalMass) * 100 : 0 }))
    .sort((a, b) => b.massPct - a.massPct);
  const maxSingleUnverifiedPct = unverifiedIngredients.length > 0 ? unverifiedIngredients[0].massPct : 0;

  const coverageLine = `\n\nVerified-mass coverage: ${verifiedMassPct.toFixed(1)}% of formulation mass.`;
  const disclaimerLine = `\n\n${REGULATORY_DISCLAIMER}`;

  // ─── 2. Gate ────────────────────────────────────────────────────────────
  if (totalMass <= 0) {
    return {
      productClassification: '—',
      regulatoryClass: '—',
      verifiedMassPct: 0,
      unverifiedIngredients: [],
    };
  }
  if (verifiedMassPct < 80 || maxSingleUnverifiedPct > 10) {
    return {
      productClassification: 'insufficient-data',
      regulatoryClass:
        'Insufficient verified data to compute regulatory classification. Add lab-verified or supplier-COA values for the ingredients listed below to receive a classification. Until then, this formulation cannot be classified per 21 CFR 113/114.' +
        coverageLine +
        disclaimerLine,
      verifiedMassPct,
      unverifiedIngredients,
    };
  }

  // ─── 3. Existing pH / aw / LAC decision tree (gate-passed only) ─────────
  // Priority: pH FIRST (primary hazard control), then aw, then LACF.
  // See estimateSpecs comments for the regulatory framework rationale.
  let productClassification: FormulationSpecs['productClassification'] = '—';
  if (pH > 0 && pH <= 4.6) {
    productClassification = lowAcidComponentPct >= 5 ? 'acidified' : 'acid';
  } else if (aw > 0 && aw <= 0.85) {
    productClassification = 'shelf-stable-dry';
  } else if (pH > 4.6) {
    productClassification = (hasAcidulant && lowAcidComponentPct >= 10) ? 'acidified-in-process' : 'lacf';
  }

  // ─── 4. Hedged regulatoryClass strings (per 2026-04-30 brief) ───────────
  // Form numbers per FDA.gov authoritative guidance:
  //   • 2541   — Food Canning Establishment Registration (one-time)
  //   • 2541d  — LACF Process Filing (retort)
  //   • 2541e  — Acidified Food Process Filing
  //   • 2541f  — LACF Process Filing (water activity / formulation)
  //   • 2541g  — LACF Process Filing (aseptic)
  // Forms 2541a and 2541c are obsolete in current FDA practice.
  let regulatoryClass: string;
  switch (productClassification) {
    case 'acid':
      regulatoryClass =
        `LIKELY ACID FOOD (assessment based on available data) — 21 CFR 114.3(b)(1), naturally pH ${pH.toFixed(2)} with ${lowAcidComponentPct.toFixed(0)}% low-acid components. ` +
        'No FDA scheduled-process filing appears to apply based on available data — confirm with Process Authority. ' +
        'Acid foods (per 21 CFR 114.3(b)(1)) are not subject to 21 CFR 113 or 114 process filing requirements.';
      break;
    case 'acidified':
      regulatoryClass =
        `LIKELY ACIDIFIED FOOD (assessment based on available data) — 21 CFR 114, pH ${pH.toFixed(2)}, ${lowAcidComponentPct.toFixed(0)}% low-acid base. ` +
        'Form FDA 2541e likely required (Process Filing for Acidified Method) — confirm with Process Authority. ' +
        'Facility must also be registered using Form FDA 2541 (Food Canning Establishment Registration).';
      break;
    case 'acidified-in-process':
      regulatoryClass =
        `LIKELY ACIDIFIED FOOD (assessment based on available data) — intent detected (acidulant + ${lowAcidComponentPct.toFixed(0)}% low-acid base), pH ${pH.toFixed(2)} NOT yet ≤ 4.6. ` +
        'Form FDA 2541e likely required (Process Filing for Acidified Method) — confirm with Process Authority. ' +
        'Facility must also be registered using Form FDA 2541 (Food Canning Establishment Registration).';
      break;
    case 'lacf':
      regulatoryClass =
        `LIKELY LOW-ACID CANNED FOOD (assessment based on available data) — 21 CFR 113, pH ${pH.toFixed(2)}, a_w ${aw.toFixed(2)}. ` +
        'LACF process filing likely required — Form FDA 2541d (retort), 2541f (water activity/formulation), or 2541g (aseptic) depending on processing method. Confirm appropriate form with Process Authority. ' +
        'Facility must also be registered using Form FDA 2541 (Food Canning Establishment Registration).';
      break;
    case 'shelf-stable-dry':
      regulatoryClass =
        `LIKELY SHELF-STABLE BY LOW WATER ACTIVITY (assessment based on available data) — a_w ${aw.toFixed(2)} ≤ 0.85. ` +
        'No FDA scheduled-process filing appears to apply based on available data — confirm with Process Authority. ' +
        'Foods with water activity at or below 0.85 are excluded from 21 CFR 113 and 114 (per the regulations\' scope).';
      break;
    default:
      regulatoryClass = '—';
  }
  regulatoryClass += coverageLine + disclaimerLine;

  return {
    productClassification,
    regulatoryClass,
    verifiedMassPct,
    unverifiedIngredients,
  };
}

// ============================================================
// Confidence floor + cost rollup helpers (Session 3)
// ------------------------------------------------------------
// For mass-weighted aggregations (chemistry rollups, formula cost), output
// confidence cannot exceed the lowest input confidence. Apply Rule 5 (mass
// threshold): only ingredients contributing >=5% of mass trigger downgrade,
// so a 0.1% flavoring with INFERRED data doesn't drag the whole panel down.
// If no ingredient is >=5% (e.g. 25-ingredient flavor compound), fall back
// to floor across all contributors. Output is capped at CALCULATED — the
// rollup math is itself a derivation, not a direct measurement.
// ============================================================

const CONFIDENCE_ORDER: Confidence[] = ['measured', 'calculated', 'estimated', 'inferred', 'unknown'];

interface MassContributor { massG: number; confidence: Confidence; }

/**
 * Return the worst confidence among the inputs (for derived metrics like
 * the acetic/moisture ratio that compose two formulation-level values).
 */
export function worstConfidence(...confs: Confidence[]): Confidence {
  if (confs.length === 0) return 'unknown';
  let worst = confs[0];
  for (const c of confs) {
    if (CONFIDENCE_ORDER.indexOf(c) > CONFIDENCE_ORDER.indexOf(worst)) worst = c;
  }
  return worst;
}

export function floorConfidence(contribs: MassContributor[], totalMass: number): Confidence {
  if (contribs.length === 0 || totalMass <= 0) return 'unknown';
  const significant = contribs.filter(c => (c.massG / totalMass) >= 0.05);
  const pool = significant.length > 0 ? significant : contribs;
  // Start at CALCULATED — the rollup is a derivation, can't exceed CALCULATED.
  let floor: Confidence = 'calculated';
  for (const c of pool) {
    if (CONFIDENCE_ORDER.indexOf(c.confidence) > CONFIDENCE_ORDER.indexOf(floor)) {
      floor = c.confidence;
    }
  }
  return floor;
}

/**
 * Compute formula-level cost confidence by rolling up per-ingredient cost
 * confidences with the >=5% mass threshold rule. Returns 'unknown' for an
 * empty formulation. Each ingredient's cost confidence is supplied directly
 * (typically from mapCostToConfidence on the ingredient's IndustrialIngredient).
 */
export function rollupCostConfidence(
  contributors: Array<{ massG: number; confidence: Confidence }>
): Confidence {
  const totalMass = contributors.reduce((s, c) => s + c.massG, 0);
  return floorConfidence(contributors, totalMass);
}

/**
 * Format a Class 1a numeric value with its tolerance range, returning both
 * the display text and the underlying RangedValue. Handles asymmetric ranges
 * (clamping near aw=1.0 or moisture=100) by displaying the wider half-width
 * so the underlying tolerance is honest rather than understated by the
 * clamped side.
 */
export function formatRangedValue(
  metric: SpecMetric,
  value: number,
  confidence: Confidence,
  decimals: number,
  unit: string = '',
): { text: string; rv: RangedValue } {
  const rv = rangedSpec(metric, value, confidence);
  const delta = Math.max(rv.value - rv.range.low, rv.range.high - rv.value);
  return {
    text: `${value.toFixed(decimals)}${unit} ± ${delta.toFixed(decimals)}${unit}`,
    rv,
  };
}

/**
 * Estimate formulation-level specs from the ingredient list.
 */
export function estimateSpecs(ingredients: SpecInputIngredient[]): FormulationSpecs {
  let totalMass = 0;
  let massWithSpec = 0;

  // Running sums for weighted averages
  let sumBrixMass = 0;
  let sumMoistMass = 0;
  let sumAwMass = 0;
  let sumAceticMass = 0;
  let sumHMass = 0; // weighted H+ for pH
  let massForPH = 0;

  // Viscosity contribution score: weighted sum, where each ingredient's contribution
  // is mapped to a numeric "thickening" coefficient.
  const VISC_MAP: Record<string, number> = { none: 0, low: 10, medium: 25, high: 60, 'very high': 95 };

  // Per-metric confidence contributor lists. Filled during the same loop, then
  // rolled up via floorConfidence with the >=5% mass threshold rule.
  const phContribs: MassContributor[] = [];
  const brixContribs: MassContributor[] = [];
  const moistureContribs: MassContributor[] = [];
  const awContribs: MassContributor[] = [];
  const aceticContribs: MassContributor[] = [];

  for (const ing of ingredients) {
    const g = ing.qty * (UNIT_TO_GRAMS[ing.unit] || 1);
    if (g <= 0) continue;
    totalMass += g;
    const spec = getSpec(ing.name, ing.category);
    const ingConf = mapSpecToConfidence(spec);

    const hasAny =
      spec.pH !== undefined || spec.brix !== undefined || spec.moisture !== undefined ||
      spec.aw !== undefined || spec.aceticAcid !== undefined || spec.viscosityContrib !== undefined;
    if (hasAny) massWithSpec += g;

    if (spec.brix !== undefined)       { sumBrixMass   += g * spec.brix;     brixContribs.push({ massG: g, confidence: ingConf }); }
    if (spec.moisture !== undefined)   { sumMoistMass  += g * spec.moisture; moistureContribs.push({ massG: g, confidence: ingConf }); }
    if (spec.aw !== undefined)         { sumAwMass     += g * spec.aw;       awContribs.push({ massG: g, confidence: ingConf }); }
    if (spec.aceticAcid !== undefined) { sumAceticMass += g * spec.aceticAcid; aceticContribs.push({ massG: g, confidence: ingConf }); }
    if (spec.pH !== undefined) {
      sumHMass  += g * Math.pow(10, -spec.pH);
      massForPH += g;
      phContribs.push({ massG: g, confidence: ingConf });
    }
  }

  if (totalMass <= 0) {
    return {
      pH: 0, brix: 0, moisture: 0, aw: 0, aceticAcid: 0, aceticMoistureRatio: 0,
      bostwickCmPer30s: 0, bostwickClass: 'very thin',
      brookfieldCp: 0, brookfieldClass: 'very low',
      totalWeightG: 0, coverage: 0, lowAcidComponentPct: 0,
      hasAcidulant: false, productClassification: '—',
      regulatoryClass: '—',
      verifiedMassPct: 0,
      unverifiedIngredients: [],
      confidence: { pH: 'unknown', brix: 'unknown', moisture: 'unknown', aw: 'unknown', aceticAcid: 'unknown' },
    };
  }

  // Weighted arithmetic averages — mass weighted
  const brix = sumBrixMass / totalMass;
  const moisture = sumMoistMass / totalMass;
  const massWeightedAw = sumAwMass / totalMass;
  // True a_w is dominated by water-phase solute concentration, not a simple mass-weighted
  // average of ingredient aws. For mixed-phase foods (sauces, beverages), the moisture-based
  // empirical curve is more accurate. Use MAX of both so we don't under- or over-estimate.
  const aw = Math.max(massWeightedAw, awFromMoisture(moisture));
  const aceticAcid = sumAceticMass / totalMass;
  const pH = massForPH > 0 ? -Math.log10(sumHMass / massForPH) : 0;
  const aceticMoistureRatio = moisture > 0 ? (aceticAcid / moisture) * 100 : 0; // as %

  // Compute low-acid component percentage (for 21 CFR 114 acidified food determination).
  //
  // An ingredient counts as a "low-acid BASE" (not just "low-acid") if:
  //   (1) its natural pH is > 4.6, AND
  //   (2) it's a microbial growth substrate (vegetables, meat, dairy, beans, eggs, nut butters, etc.)
  //       — NOT a solute (sugar), diluent (water), fat (oil), or micro-additive (salt, small spices).
  //
  // Per FDA 21 CFR 114 operational framework: sugars, salts, water, and fats/oils do not
  // convert an acid food into a low-acid food requiring acidification. Only low-acid BASES do.
  const NOT_LOW_ACID_BASE_CATEGORIES = new Set([
    'Sweeteners',    // Sugars are solutes, not microbial growth substrates
    'Fats & Oils',   // No water phase for microbial growth
    'Water & Ice',   // Diluent
    'Excipients',    // Supplement carriers (MCC, stearate, silica, etc.)
  ]);

  let lowAcidMass = 0;
  let hasAcidulant = false;
  for (const ing of ingredients) {
    const g = ing.qty * (UNIT_TO_GRAMS[ing.unit] || 1);
    if (g <= 0) continue;
    const spec = getSpec(ing.name, ing.category);
    // ── Effective category resolution (safety-critical for LAC math) ──
    // Name inference is PREFERRED over the explicit DB category when the name
    // clearly identifies the ingredient's functional class. This fixes the bug
    // where "Onion Powder (Industrial)" is tagged "Condiment Ingredients" in
    // the DB — a kitchen-sink category with pH 4.0 default (dominated by
    // vinegars/mustards). The name "Onion Powder" clearly says "Spice" (pH 6.0),
    // so the classifier should treat it as a low-acid base.
    //
    // Priority order:
    //   1. Name inference (most specific signal — matches on exact patterns
    //      like /\bonion powder\b/, /\bgarlic\b/, /\bpepper\b/, etc.)
    //   2. Explicit DB category (catch-all fallback)
    const nameInferredCategory = inferCategoryFromName(ing.name);
    const effectiveCategory = nameInferredCategory || ing.category;
    const phForCheck = spec.pH
      ?? (effectiveCategory ? CATEGORY_SPECS[effectiveCategory]?.pH : undefined);
    if (phForCheck !== undefined && phForCheck > 4.6) {
      const categoryExcluded = effectiveCategory ? NOT_LOW_ACID_BASE_CATEGORIES.has(effectiveCategory) : false;
      const isSalt = /\bsalt\b/i.test(ing.name);
      if (!categoryExcluded && !isSalt) {
        lowAcidMass += g;
      }
    }
    if (phForCheck !== undefined && phForCheck < 4.0) {
      hasAcidulant = true;
    }
  }
  const lowAcidComponentPct = (lowAcidMass / totalMass) * 100;

  // ─── Classification (extracted into classifyFormulation with provenance gate) ───
  const classification = classifyFormulation({
    ingredients, totalMass, pH, aw, lowAcidComponentPct, hasAcidulant,
  });

  // Recompute viscosity score in a clean pass (mass-weighted).
  let viscosityScore = 0;
  for (const ing of ingredients) {
    const g = ing.qty * (UNIT_TO_GRAMS[ing.unit] || 1);
    if (g <= 0) continue;
    const spec = getSpec(ing.name, ing.category);
    let viscTerm = VISC_MAP[spec.viscosityContrib || 'none'];
    if (spec.brix && spec.brix > 60) viscTerm = Math.max(viscTerm, 40);
    if (spec.moisture !== undefined && spec.moisture < 5 && spec.brix && spec.brix > 50) viscTerm = Math.max(viscTerm, 70);
    viscosityScore += (g / totalMass) * viscTerm;
  }

  // Map viscosity score to Bostwick cm/30s. Score 0 (water) → 30 cm, score 100 (paste) → 1 cm.
  const bostwickCmPer30s = Math.max(0.5, Math.min(30, 30 - (viscosityScore / 100) * 29));
  const bostwickClass: FormulationSpecs['bostwickClass'] =
    bostwickCmPer30s >= 22 ? 'very thin'
    : bostwickCmPer30s >= 14 ? 'thin'
    : bostwickCmPer30s >= 8 ? 'medium'
    : bostwickCmPer30s >= 4 ? 'thick'
    : bostwickCmPer30s >= 2 ? 'very thick'
    : 'paste';

  // Map to Brookfield cP (very rough; labs will override).
  // Water ≈ 1, ketchup ≈ 50,000, mayo ≈ 100,000, paste ≈ 500,000
  const brookfieldCp = Math.round(Math.pow(10, viscosityScore / 20));
  const brookfieldClass: FormulationSpecs['brookfieldClass'] =
    brookfieldCp < 50 ? 'very low'
    : brookfieldCp < 1000 ? 'low'
    : brookfieldCp < 20000 ? 'medium'
    : brookfieldCp < 100000 ? 'high'
    : 'very high';

  // Per-metric confidence floor across mass-significant contributors (>=5%).
  const confidence = {
    pH:         floorConfidence(phContribs, totalMass),
    brix:       floorConfidence(brixContribs, totalMass),
    moisture:   floorConfidence(moistureContribs, totalMass),
    aw:         floorConfidence(awContribs, totalMass),
    aceticAcid: floorConfidence(aceticContribs, totalMass),
  };

  return {
    pH,
    brix,
    moisture,
    aw,
    aceticAcid,
    aceticMoistureRatio,
    bostwickCmPer30s,
    bostwickClass,
    brookfieldCp,
    brookfieldClass,
    totalWeightG: totalMass,
    coverage: massWithSpec / totalMass,
    lowAcidComponentPct,
    hasAcidulant,
    productClassification: classification.productClassification,
    regulatoryClass: classification.regulatoryClass,
    verifiedMassPct: classification.verifiedMassPct,
    unverifiedIngredients: classification.unverifiedIngredients,
    confidence,
  };
}
