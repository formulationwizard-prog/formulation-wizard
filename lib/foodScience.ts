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
// ============================================================
import type { IndustrialIngredient } from '../types';
import { UNIT_TO_GRAMS } from './utils';

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
   * Regulatory product classification:
   *   • 'acid'       — naturally pH ≤ 4.6, minimal low-acid content (21 CFR 114.3(b)(1))
   *   • 'acidified'  — low-acid base + added acid, final pH ≤ 4.6 (21 CFR 114)
   *   • 'acidified-in-process' — intent is acidified (acidulant present, low-acid base) but
   *     current pH still > 4.6. Needs more acid.
   *   • 'lacf'       — pH > 4.6 and aw > 0.85, no acidification intent (21 CFR 113)
   *   • 'shelf-stable-dry' — aw ≤ 0.85
   *   • '—'          — not enough data
   */
  productClassification: 'acid' | 'acidified' | 'acidified-in-process' | 'lacf' | 'shelf-stable-dry' | '—';
  /** Inferred regulatory class based on pH and aw. */
  regulatoryClass: string;
}

// ----- Category-level defaults -----------------------------------------------
// Used when a specific ingredient override isn't available.
export const CATEGORY_SPECS: Record<string, IngredientSpec> = {
  'Sweeteners':             { brix: 80, moisture: 15, aw: 0.70, pH: 5.5 },
  'Fats & Oils':            { brix: 0,  moisture: 0.1, aw: 0.10, pH: 7.0, viscosityContrib: 'medium' },
  'Condiment Ingredients':  { brix: 12, moisture: 55, aw: 0.88, pH: 4.0 },
  'Fresh Produce':          { brix: 8,  moisture: 88, aw: 0.98, pH: 5.5 },
  'Produce':                { brix: 12, moisture: 85, aw: 0.96, pH: 4.0 },
  'Fresh Herbs':            { brix: 5,  moisture: 88, aw: 0.97, pH: 6.2 },
  'Spices':                 { brix: 0,  moisture: 8,  aw: 0.35, pH: 6.0 },
  'Egg Products':           { brix: 0,  moisture: 5,  aw: 0.25, pH: 7.5 },
  'Legumes & Nuts & Seeds': { brix: 0,  moisture: 5,  aw: 0.40, pH: 6.5, viscosityContrib: 'low' },
  'Dried Beans':            { brix: 0,  moisture: 11, aw: 0.55, pH: 6.5 },
  'Canned Beans':           { brix: 0,  moisture: 75, aw: 0.96, pH: 6.2 },
  'Nut & Seed Butters':     { brix: 0,  moisture: 2,  aw: 0.40, pH: 6.5, viscosityContrib: 'very high' },
  'Juices':                 { brix: 12, moisture: 87, aw: 0.98, pH: 3.6 },
  'Concentrates & Extracts':{ brix: 50, moisture: 40, aw: 0.75, pH: 3.5 },
  // Baking / bakery-centric categories ---------------------------------------
  'Flours & Grains':        { brix: 1,  moisture: 13, aw: 0.55, pH: 6.2 },
  'Leavening':              { brix: 0,  moisture: 8,  aw: 0.40, pH: 7.5 },
  'Dairy':                  { brix: 4,  moisture: 88, aw: 0.99, pH: 6.5 },
  'Chocolate & Cocoa':      { brix: 55, moisture: 1,  aw: 0.40, pH: 6.2 },
  'Nuts & Nut Products':    { brix: 4,  moisture: 4,  aw: 0.50, pH: 6.4 },
  'Seeds':                  { brix: 1,  moisture: 6,  aw: 0.50, pH: 6.4 },
  'Dried Fruit':            { brix: 75, moisture: 22, aw: 0.65, pH: 4.0 },
  'Water & Ice':            { brix: 0,  moisture: 100, aw: 1.0, pH: 7.0 },
  'Seasonings':             { brix: 0,  moisture: 8,  aw: 0.35, pH: 6.0 },
};

// ----- Ingredient-specific overrides -----------------------------------------
// Only the ones where generic category data isn't good enough.
export const INGREDIENT_SPECS: Record<string, IngredientSpec> = {
  // Vinegars
  'Distilled White Vinegar (50 Grain / 5%)':   { pH: 2.8, aceticAcid: 5.0,  brix: 0.1, moisture: 95, aw: 0.99 },
  'Distilled White Vinegar (100 Grain / 10%)': { pH: 2.4, aceticAcid: 10.0, brix: 0.1, moisture: 90, aw: 0.98 },
  'Distilled White Vinegar (200 Grain / 20%)': { pH: 2.2, aceticAcid: 20.0, brix: 0.1, moisture: 80, aw: 0.96 },
  'Apple Cider Vinegar (5%)':                  { pH: 3.1, aceticAcid: 5.0,  brix: 1.0, moisture: 94, aw: 0.99 },
  'Red Wine Vinegar':                          { pH: 3.0, aceticAcid: 6.0,  brix: 1.5, moisture: 93, aw: 0.99 },
  'Balsamic Vinegar (Industrial)':             { pH: 2.7, aceticAcid: 6.0,  brix: 30,  moisture: 65, aw: 0.93 },
  'Rice Wine Vinegar':                         { pH: 3.2, aceticAcid: 4.3,  brix: 0.5, moisture: 95, aw: 0.99 },
  'Malt Vinegar':                              { pH: 3.0, aceticAcid: 5.0,  brix: 1.0, moisture: 94, aw: 0.99 },
  'Acetic Acid (Glacial Food Grade)':          { pH: 2.0, aceticAcid: 99.8, brix: 0,   moisture: 0.2, aw: 0.30 },
  // Acids & preservatives
  'Citric Acid (Anhydrous)':                   { pH: 2.2, moisture: 0.3, brix: 0, aw: 0.20 },
  'Sodium Benzoate (Food Grade)':              { pH: 8.0, moisture: 0.2, brix: 0, aw: 0.20 },
  'Potassium Sorbate (Food Grade)':            { pH: 6.5, moisture: 1.0, brix: 0, aw: 0.25 },
  // Sugars & syrups — higher precision
  'Granulated Sugar (Sucrose)':                { brix: 100, moisture: 0.04, aw: 0.14, pH: 7.0 },
  'Brown Sugar (Light)':                       { brix: 97,  moisture: 2,    aw: 0.60, pH: 5.7 },
  'Brown Sugar (Dark)':                        { brix: 97,  moisture: 2.5,  aw: 0.63, pH: 5.5 },
  'Powdered Sugar (10X Confectioners)':        { brix: 99,  moisture: 0.5,  aw: 0.15, pH: 7.0 },
  'Honey (Industrial Grade)':                  { brix: 81,  moisture: 17,   aw: 0.60, pH: 3.9 },
  'Pure Maple Syrup (Grade A)':                { brix: 66,  moisture: 33,   aw: 0.81, pH: 6.5 },
  'Agave Syrup (Light)':                       { brix: 76,  moisture: 23,   aw: 0.75, pH: 4.5 },
  'Agave Syrup (Dark/Amber)':                  { brix: 76,  moisture: 23,   aw: 0.75, pH: 4.6 },
  'Molasses (Blackstrap)':                     { brix: 76,  moisture: 23,   aw: 0.75, pH: 5.5 },
  'Molasses (Fancy/Light)':                    { brix: 80,  moisture: 19,   aw: 0.72, pH: 5.2 },
  'Corn Syrup (Light)':                        { brix: 78,  moisture: 22,   aw: 0.82, pH: 5.0 },
  'Corn Syrup (Dark)':                         { brix: 78,  moisture: 22,   aw: 0.82, pH: 4.8 },
  'High Fructose Corn Syrup 55 (HFCS-55)':     { brix: 77,  moisture: 23,   aw: 0.77, pH: 4.5 },
  'High Fructose Corn Syrup 42 (HFCS-42)':     { brix: 71,  moisture: 29,   aw: 0.80, pH: 4.5 },
  'Dextrose Monohydrate':                      { brix: 100, moisture: 0.1,  aw: 0.15, pH: 6.0 },
  // Juices & concentrates
  'Lemon Juice (Concentrate)':                 { brix: 48, moisture: 52, aw: 0.88, pH: 2.3 },
  'Lime Juice (Concentrate)':                  { brix: 48, moisture: 52, aw: 0.88, pH: 2.2 },
  'Orange Juice (NFC, Fresh-Squeezed)':        { brix: 12, moisture: 88, aw: 0.98, pH: 3.8 },
  'Apple Juice (NFC, 100%)':                   { brix: 12, moisture: 88, aw: 0.98, pH: 3.5 },
  'Pineapple Juice (NFC)':                     { brix: 13, moisture: 86, aw: 0.98, pH: 3.5 },
  'Cranberry Juice (100%, No Sugar)':          { brix: 7.5, moisture: 92, aw: 0.99, pH: 2.5 },
  'Pomegranate Juice (100%)':                  { brix: 16, moisture: 84, aw: 0.97, pH: 3.1 },
  'Tomato Juice (NFC, Industrial)':            { brix: 6,  moisture: 93, aw: 0.99, pH: 4.2 },
  'Apple Juice Concentrate (70 Brix)':         { brix: 70, moisture: 30, aw: 0.75, pH: 3.3 },
  'Orange Juice Concentrate (65 Brix)':        { brix: 65, moisture: 35, aw: 0.78, pH: 3.8 },
  'Pineapple Juice Concentrate (60 Brix)':     { brix: 60, moisture: 40, aw: 0.80, pH: 3.5 },
  'Cranberry Juice Concentrate (50 Brix)':     { brix: 50, moisture: 50, aw: 0.83, pH: 2.5 },
  'Pomegranate Juice Concentrate (65 Brix)':   { brix: 65, moisture: 35, aw: 0.77, pH: 3.1 },
  // Tomato products
  'Tomato Paste (28-30 Brix)':                 { brix: 29, moisture: 71, aw: 0.96, pH: 4.3, viscosityContrib: 'high' },
  'Tomato Puree (Aseptic)':                    { brix: 11, moisture: 89, aw: 0.99, pH: 4.2, viscosityContrib: 'medium' },
  'Mango Puree (Aseptic)':                     { brix: 15, moisture: 84, aw: 0.98, pH: 4.0, viscosityContrib: 'medium' },
  'Apple Puree (Aseptic)':                     { brix: 11, moisture: 88, aw: 0.98, pH: 3.5 },
  'Red Pepper Puree (Aseptic)':                { brix: 6,  moisture: 93, aw: 0.99, pH: 4.6 },
  'Chipotle Puree':                            { brix: 9,  moisture: 89, aw: 0.97, pH: 3.9 },
  'Pumpkin Puree (Aseptic)':                   { brix: 9,  moisture: 90, aw: 0.98, pH: 5.0 },
  // Sauces & condiments
  'Soy Sauce (Industrial Brewed)':             { brix: 25, moisture: 65, aw: 0.80, pH: 4.6 },
  'Worcestershire Sauce (Industrial)':         { brix: 22, moisture: 73, aw: 0.85, pH: 3.5, aceticAcid: 1.0 },
  'Dijon Mustard (Industrial)':                { brix: 12, moisture: 82, aw: 0.92, pH: 3.7, viscosityContrib: 'high' },
  'Yellow Mustard (Industrial)':               { brix: 8,  moisture: 82, aw: 0.92, pH: 3.4, aceticAcid: 1.0, viscosityContrib: 'high' },
  'Ketchup (Industrial)':                      { brix: 30, moisture: 65, aw: 0.94, pH: 3.8, aceticAcid: 0.5, viscosityContrib: 'high' },
  'Mayonnaise Base (Industrial)':              { brix: 2,  moisture: 18, aw: 0.92, pH: 4.1, viscosityContrib: 'high' },
  // Branded / specialty ketchups
  'Heinz Tomato Ketchup (Foodservice, HFCS)':  { brix: 30, moisture: 65, aw: 0.94, pH: 3.8, aceticAcid: 0.5, viscosityContrib: 'high' },
  'Simply Heinz (Cane Sugar, No HFCS)':        { brix: 31, moisture: 64, aw: 0.93, pH: 3.8, aceticAcid: 0.5, viscosityContrib: 'high' },
  'Red Gold Tomato Ketchup (Foodservice)':     { brix: 29, moisture: 65, aw: 0.94, pH: 3.9, aceticAcid: 0.5, viscosityContrib: 'high' },
  'Sir Kensington\'s Classic Ketchup (Craft)': { brix: 24, moisture: 68, aw: 0.95, pH: 3.7, aceticAcid: 0.6, viscosityContrib: 'high' },
  'Banana Ketchup (Filipino-Style, UFC/Jufran)': { brix: 27, moisture: 68, aw: 0.94, pH: 3.7, aceticAcid: 0.5, viscosityContrib: 'high' },
  // Mustard variants
  'Honey Mustard (Industrial)':                { brix: 28, moisture: 65, aw: 0.93, pH: 3.9, aceticAcid: 0.7, viscosityContrib: 'high' },
  'Whole Grain Mustard (Moutarde à l\'Ancienne)': { brix: 6, moisture: 78, aw: 0.90, pH: 3.5, aceticAcid: 1.3, viscosityContrib: 'high' },
  'Spicy Brown Mustard (Gulden\'s-Style, Industrial)': { brix: 5, moisture: 80, aw: 0.91, pH: 3.7, aceticAcid: 1.1, viscosityContrib: 'high' },
  'Hot English Mustard (Colman\'s-Style)':     { brix: 12, moisture: 73, aw: 0.91, pH: 4.0, aceticAcid: 0.5, viscosityContrib: 'high' },
  'Stone-Ground Mustard (Coarse)':             { brix: 6,  moisture: 78, aw: 0.90, pH: 3.6, aceticAcid: 1.2, viscosityContrib: 'high' },
  'Deli Mustard (Kosher-Style, Brown)':        { brix: 6,  moisture: 80, aw: 0.91, pH: 3.8, aceticAcid: 1.0, viscosityContrib: 'high' },
  'Chinese Hot Mustard (Prepared)':            { brix: 8,  moisture: 75, aw: 0.93, pH: 4.8, aceticAcid: 0.3, viscosityContrib: 'high' },
  'Horseradish Mustard':                       { brix: 7,  moisture: 78, aw: 0.91, pH: 3.8, aceticAcid: 1.0, viscosityContrib: 'high' },
  // Hot sauces (all vinegar-dominant, very acidic)
  'Tabasco Original Red Pepper Sauce':         { brix: 0.5, moisture: 94, aw: 0.97, pH: 3.4, aceticAcid: 2.5 },
  'Frank\'s RedHot Original Cayenne Pepper Sauce': { brix: 1, moisture: 95, aw: 0.98, pH: 3.5, aceticAcid: 2.0 },
  'Crystal Hot Sauce (Baumer Foods, Louisiana-Style)': { brix: 0.5, moisture: 94, aw: 0.97, pH: 3.1, aceticAcid: 3.0 },
  'Louisiana Brand The Original Hot Sauce':    { brix: 0.5, moisture: 94, aw: 0.97, pH: 3.2, aceticAcid: 2.8 },
  'Louisiana Brand Habanero Hot Sauce':        { brix: 1,   moisture: 93, aw: 0.96, pH: 3.5, aceticAcid: 2.2 },
  'Cholula Hot Sauce Original (Mexican)':      { brix: 2,   moisture: 93, aw: 0.96, pH: 3.3, aceticAcid: 2.0 },
  'Texas Pete Original Hot Sauce':             { brix: 0.5, moisture: 95, aw: 0.97, pH: 3.4, aceticAcid: 2.2 },
  'Valentina Salsa Picante (Mexican)':         { brix: 3,   moisture: 90, aw: 0.95, pH: 3.7, aceticAcid: 1.5 },
  'El Yucateco Green Habanero Sauce':          { brix: 3,   moisture: 91, aw: 0.96, pH: 3.6, aceticAcid: 1.5 },
  'Tabasco Green Jalapeño Sauce':              { brix: 2,   moisture: 93, aw: 0.96, pH: 3.8, aceticAcid: 1.5 },
  // Salts & seasonings
  'Salt (Food Grade Fine)':                    { brix: 0, moisture: 0.1, aw: 0.75, pH: 7.0 },
  // ─── Dried aromatic explicit pH overrides ───
  // These prevent silent misclassification when dry aromatics are tagged
  // to broader DB categories. All have pH 5-6 → count as low-acid bases
  // toward the 21 CFR 114 acidified-food 5% threshold.
  'Garlic Powder (Industrial)':                { brix: 0, moisture: 6,  aw: 0.35, pH: 5.3 },
  'Onion Powder (Industrial)':                 { brix: 0, moisture: 5,  aw: 0.35, pH: 5.5 },
  'Garlic Powder (Granulated, California Grown)': { brix: 0, moisture: 6,  aw: 0.35, pH: 5.3 },
  'Onion Powder (Granulated)':                 { brix: 0, moisture: 5,  aw: 0.35, pH: 5.5 },
  'Black Pepper (Ground, Industrial)':         { brix: 0, moisture: 8,  aw: 0.35, pH: 5.8 },
  'Black Pepper, Coarse 16 Mesh (Butcher Grind)': { brix: 0, moisture: 8,  aw: 0.35, pH: 5.8 },
  'Cayenne Pepper (40,000 HU)':                { brix: 0, moisture: 8,  aw: 0.35, pH: 5.1 },
  'Cayenne Pepper (40K SHU)':                  { brix: 0, moisture: 8,  aw: 0.35, pH: 5.1 },
  'Thyme (Dried, Leaves)':                     { brix: 0, moisture: 9,  aw: 0.35, pH: 5.5 },
  'Paprika, Sweet Hungarian':                  { brix: 0, moisture: 9,  aw: 0.35, pH: 5.0 },
  'Smoked Paprika (Sweet, Spanish La Chinata)':{ brix: 0, moisture: 9,  aw: 0.35, pH: 5.0 },
  'Ground Cumin (Fine, Mexican)':              { brix: 0, moisture: 8,  aw: 0.35, pH: 5.5 },
  'Coriander Seed (Whole)':                    { brix: 0, moisture: 8,  aw: 0.35, pH: 5.6 },
  'Ground Allspice (Jamaican)':                { brix: 0, moisture: 8,  aw: 0.35, pH: 5.4 },
  'Whole Allspice (Jamaican)':                 { brix: 0, moisture: 8,  aw: 0.35, pH: 5.4 },
  'Ginger (Ground, Dried)':                    { brix: 0, moisture: 9,  aw: 0.35, pH: 5.8 },
  'Chipotle Powder (Smoked Jalapeño)':         { brix: 0, moisture: 8,  aw: 0.35, pH: 5.0 },
  'Ancho Chili Powder':                        { brix: 0, moisture: 9,  aw: 0.35, pH: 5.1 },
  // Xanthan variant to match the F&B DB mesh-size SKU
  'Xanthan Gum (Food Grade, 200 Mesh)':        { brix: 0, moisture: 10, aw: 0.35, pH: 7.0, viscosityContrib: 'very high' },
  // Mustard Flour — low-acid dry base (pH ~5.5), was silently miscategorized
  'Mustard Flour (Yellow)':                    { brix: 0, moisture: 6,  aw: 0.35, pH: 5.4 },
  'Mustard Powder (Yellow, Hot)':              { brix: 0, moisture: 6,  aw: 0.35, pH: 5.4 },
  'Natural Flavors (Liquid)':                  { brix: 5, moisture: 70, aw: 0.85, pH: 5.0 },
  'Caramel Color (Class III)':                 { brix: 65, moisture: 30, aw: 0.75, pH: 3.5 },
  // Gums / thickeners / emulsifiers
  'Xanthan Gum (Food Grade)':                  { brix: 0, moisture: 10, aw: 0.35, pH: 7.0, viscosityContrib: 'very high' },
  'Modified Food Starch (Waxy Maize)':         { brix: 0, moisture: 11, aw: 0.40, pH: 6.5, viscosityContrib: 'high' },
  'Mono and Diglycerides':                     { brix: 0, moisture: 0.5, aw: 0.20, pH: 6.5, viscosityContrib: 'medium' },
  'Soy Lecithin':                              { brix: 0, moisture: 1,  aw: 0.30, pH: 6.5, viscosityContrib: 'medium' },
  'Sunflower Lecithin':                        { brix: 0, moisture: 1,  aw: 0.30, pH: 6.5, viscosityContrib: 'medium' },
  // Oils (all approximately the same)
  'Soybean Oil (RBD)':                         { brix: 0, moisture: 0.05, aw: 0.05, pH: 7.0, viscosityContrib: 'medium' },
  'Canola Oil (Industrial Grade)':             { brix: 0, moisture: 0.05, aw: 0.05, pH: 7.0, viscosityContrib: 'medium' },
  'Extra Virgin Olive Oil':                    { brix: 0, moisture: 0.05, aw: 0.05, pH: 7.0, viscosityContrib: 'medium' },
  // Water (not in DB but users add via USDA; matches by partial name below)
  'Water':                                     { brix: 0, moisture: 100, aw: 1.0,  pH: 7.0 },
  // Egg products
  'Whole Egg Powder':                          { brix: 0, moisture: 5, aw: 0.25, pH: 7.5 },
  // Baking-specific overrides (Leavening / dairy with unusual moisture / spices)
  'Fresh Yeast (Compressed / Cake)':           { brix: 0,  moisture: 70, aw: 0.98, pH: 5.5 },
  'Active Dry Yeast (ADY)':                    { brix: 0,  moisture: 8,  aw: 0.40, pH: 6.2 },
  'Instant Yeast (SAF Red / Gold)':            { brix: 0,  moisture: 5,  aw: 0.35, pH: 6.2 },
  'Osmotolerant Yeast (SAF Gold / Sweet Dough)': { brix: 0, moisture: 5, aw: 0.35, pH: 6.2 },
  'Sourdough Starter (Dried, Heritage)':       { brix: 0,  moisture: 10, aw: 0.45, pH: 4.3 },
  'Baking Soda (Sodium Bicarbonate)':          { brix: 0,  moisture: 0.1, aw: 0.10, pH: 8.3 },
  'Baking Powder (Double-Acting, Aluminum-Free)': { brix: 0, moisture: 2, aw: 0.30, pH: 6.8 },
  'Cream of Tartar (Potassium Bitartrate)':    { brix: 0,  moisture: 0.1, aw: 0.20, pH: 3.6 },
  // Kosher salts (same chemistry as fine salt, just crystal form)
  'Kosher Salt (Diamond Crystal)':             { brix: 0, moisture: 0.1, aw: 0.75, pH: 7.0 },
  'Kosher Salt (Morton)':                      { brix: 0, moisture: 0.1, aw: 0.75, pH: 7.0 },
  'Fine Sea Salt (Bakery)':                    { brix: 0, moisture: 0.1, aw: 0.75, pH: 7.0 },
  'Flaky Finishing Salt (Maldon-Style)':       { brix: 0, moisture: 0.1, aw: 0.75, pH: 7.0 },
  'Pink Himalayan Salt (Fine)':                { brix: 0, moisture: 0.1, aw: 0.75, pH: 7.0 },
  // Dairy that isn't nearly water (butter)
  'Unsalted Butter (AA Grade, 82% MF)':        { brix: 0, moisture: 16, aw: 0.95, pH: 6.2 },
  'European-Style Butter (84%+ MF, Cultured)': { brix: 0, moisture: 14, aw: 0.94, pH: 5.1 },
  'Heavy Cream (36%+ MF)':                     { brix: 3, moisture: 57, aw: 0.98, pH: 6.5 },
  // Filtered / RO water variants (same core spec; pH may differ slightly)
  'Filtered Water (Carbon-Filtered, Dechlorinated)': { brix: 0, moisture: 100, aw: 1.0, pH: 7.0 },
  'Reverse Osmosis Water (RO, Demineralized)': { brix: 0, moisture: 100, aw: 1.0, pH: 6.8 },
  'Mineral Water (Structured, Moderate Hardness)': { brix: 0, moisture: 100, aw: 1.0, pH: 7.4 },
  'Alkaline Water (pH 9.5)':                   { brix: 0, moisture: 100, aw: 1.0, pH: 9.5 },
  // Vanilla extract has alcohol → behaves differently from spices
  'Vanilla Extract (Pure, Single-Fold)':       { brix: 5, moisture: 55, aw: 0.80, pH: 4.3 },
  'Vanilla Bean Paste (Seeded)':               { brix: 68, moisture: 29, aw: 0.75, pH: 4.5 },
  'Almond Extract (Pure)':                     { brix: 0, moisture: 60, aw: 0.85, pH: 5.5 },
  'Lemon Extract (Pure)':                      { brix: 0, moisture: 20, aw: 0.75, pH: 4.0 },
  'Orange Extract (Pure)':                     { brix: 0, moisture: 20, aw: 0.75, pH: 4.0 },
  'Peppermint Extract (Pure)':                 { brix: 0, moisture: 20, aw: 0.75, pH: 5.0 },
  'Rose Water (Food-Grade)':                   { brix: 0, moisture: 99, aw: 1.0, pH: 6.5 },
  'Orange Blossom Water (Food-Grade)':         { brix: 0, moisture: 99, aw: 1.0, pH: 6.5 },
  'Egg Yolk Powder':                           { brix: 0, moisture: 5, aw: 0.30, pH: 6.4, viscosityContrib: 'high' },
  'Egg White Powder (Albumen)':                { brix: 0, moisture: 7, aw: 0.35, pH: 9.0 },
  // Proteins / nut butters
  'Tahini (Hulled Sesame Paste)':              { brix: 0, moisture: 2, aw: 0.35, pH: 6.3, viscosityContrib: 'very high' },
  'Tahini (Unhulled/Whole Sesame Paste)':      { brix: 0, moisture: 2, aw: 0.35, pH: 6.3, viscosityContrib: 'very high' },
  'Peanut Butter (Industrial/Processed)':      { brix: 0, moisture: 2, aw: 0.35, pH: 6.3, viscosityContrib: 'very high' },
  'Almond Butter (Industrial)':                { brix: 0, moisture: 2, aw: 0.35, pH: 6.5, viscosityContrib: 'very high' },
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
 * 5) Empty spec (all-zero contributions)
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
  return {};
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
  let viscosityScore = 0; // 0 = water-like, 100 = paste-like
  const VISC_MAP: Record<string, number> = { none: 0, low: 10, medium: 25, high: 60, 'very high': 95 };

  for (const ing of ingredients) {
    const g = ing.qty * (UNIT_TO_GRAMS[ing.unit] || 1);
    if (g <= 0) continue;
    totalMass += g;
    const spec = getSpec(ing.name, ing.category);

    const hasAny =
      spec.pH !== undefined || spec.brix !== undefined || spec.moisture !== undefined ||
      spec.aw !== undefined || spec.aceticAcid !== undefined || spec.viscosityContrib !== undefined;
    if (hasAny) massWithSpec += g;

    if (spec.brix !== undefined)       sumBrixMass   += g * spec.brix;
    if (spec.moisture !== undefined)   sumMoistMass  += g * spec.moisture;
    if (spec.aw !== undefined)         sumAwMass     += g * spec.aw;
    if (spec.aceticAcid !== undefined) sumAceticMass += g * spec.aceticAcid;
    if (spec.pH !== undefined) {
      sumHMass  += g * Math.pow(10, -spec.pH);
      massForPH += g;
    }

    // Viscosity — oils have internal thickening; gums/pastes dominate.
    let viscTerm = VISC_MAP[spec.viscosityContrib || 'none'];
    // Also add intrinsic contribution from high Brix / paste-like moisture
    if (spec.brix && spec.brix > 60) viscTerm = Math.max(viscTerm, 40);
    if (spec.moisture !== undefined && spec.moisture < 5 && spec.brix && spec.brix > 50) viscTerm = Math.max(viscTerm, 70);
    viscosityScore += (g / Math.max(totalMass, 1)) * viscTerm;
  }

  if (totalMass <= 0) {
    return {
      pH: 0, brix: 0, moisture: 0, aw: 0, aceticAcid: 0, aceticMoistureRatio: 0,
      bostwickCmPer30s: 0, bostwickClass: 'very thin',
      brookfieldCp: 0, brookfieldClass: 'very low',
      totalWeightG: 0, coverage: 0, lowAcidComponentPct: 0,
      hasAcidulant: false, productClassification: '—',
      regulatoryClass: '—',
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

  // ════════════════════════════════════════════════════════════════
  // PRODUCT CLASSIFICATION — 21 CFR regulatory framework
  // ----------------------------------------------------------------
  // Priority: pH FIRST (primary hazard control), then aw, then LACF.
  //
  // Why pH first: a jam (aw 0.82, pH 3.2) is regulated as an acid
  // food under 21 CFR 114.3(b)(1), not as a dry shelf-stable food.
  // The pH-driven hurdle is the one that matters for C. botulinum
  // control. Checking aw first would misclassify jams, fruit
  // butters, and hot sauces.
  //
  // The four mutually-exclusive outcomes:
  //   acid          → pH ≤ 4.6, LAC < 5%. No filing. 21 CFR 114.3(b)(1).
  //   acidified     → pH ≤ 4.6, LAC ≥ 5%. Filing REQUIRED. 21 CFR 114.
  //   shelf-stable-dry → pH > 4.6, aw ≤ 0.85. No filing. 21 CFR 117.
  //   acidified-in-process → pH > 4.6 but hasAcidulant + LAC ≥ 10%.
  //                   Intent to acidify; add more acid. Filing REQUIRED.
  //   lacf          → pH > 4.6, aw > 0.85, no acidification intent.
  //                   Retort to 12D. Filing REQUIRED. 21 CFR 113.
  // ════════════════════════════════════════════════════════════════
  let productClassification: FormulationSpecs['productClassification'] = '—';
  if (pH > 0 && pH <= 4.6) {
    // Acid-controlled — highest-priority regulatory pathway
    if (lowAcidComponentPct >= 5) {
      productClassification = 'acidified'; // 21 CFR 114 — filing required
    } else {
      productClassification = 'acid';       // 21 CFR 114.3(b)(1) — no filing
    }
  } else if (aw > 0 && aw <= 0.85) {
    // Not acid-controlled but moisture-controlled
    productClassification = 'shelf-stable-dry'; // 21 CFR 117 — no filing
  } else if (pH > 4.6) {
    // Neither acid nor moisture control — genuinely low-acid wet food
    if (hasAcidulant && lowAcidComponentPct >= 10) {
      // Formulator added acid but pH isn't below 4.6 yet — intent is acidified,
      // but finished pH is still above the safety threshold. Add more acid.
      productClassification = 'acidified-in-process';
    } else {
      productClassification = 'lacf';           // 21 CFR 113 — retort required
    }
  }

  // Recompute viscosityScore weighted by mass already done above incrementally, but
  // the incremental calc was using ratio g / cumulative total. Use a cleaner pass:
  let vSum = 0;
  for (const ing of ingredients) {
    const g = ing.qty * (UNIT_TO_GRAMS[ing.unit] || 1);
    if (g <= 0) continue;
    const spec = getSpec(ing.name, ing.category);
    let viscTerm = VISC_MAP[spec.viscosityContrib || 'none'];
    if (spec.brix && spec.brix > 60) viscTerm = Math.max(viscTerm, 40);
    if (spec.moisture !== undefined && spec.moisture < 5 && spec.brix && spec.brix > 50) viscTerm = Math.max(viscTerm, 70);
    vSum += (g / totalMass) * viscTerm;
  }
  viscosityScore = vSum;

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

  // Regulatory classification string — uses the productClassification computed above.
  let regulatoryClass: string;
  switch (productClassification) {
    case 'shelf-stable-dry':
      regulatoryClass = `Shelf-stable by a_w (${aw.toFixed(2)} ≤ 0.85)`;
      break;
    case 'acid':
      regulatoryClass = `Acid food (21 CFR 114.3(b)(1)) — naturally pH ${pH.toFixed(2)}`;
      break;
    case 'acidified':
      regulatoryClass = `Acidified food (21 CFR 114) — pH ${pH.toFixed(2)}, ${lowAcidComponentPct.toFixed(0)}% low-acid base`;
      break;
    case 'acidified-in-process':
      regulatoryClass = `Acidified food intent (21 CFR 114) — pH ${pH.toFixed(2)} NOT yet ≤ 4.6. Add more acid.`;
      break;
    case 'lacf':
      regulatoryClass = `Low-Acid Canned Food / LACF (21 CFR 113) — pH ${pH.toFixed(2)}, a_w ${aw.toFixed(2)}. Retort or refrigerate.`;
      break;
    default:
      regulatoryClass = '—';
  }

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
    coverage: totalMass > 0 ? massWithSpec / totalMass : 0,
    lowAcidComponentPct,
    hasAcidulant,
    productClassification,
    regulatoryClass,
  };
}
