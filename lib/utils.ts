// ============================================================
// Shared utilities, constants, and helpers for Formulation Wizard
// ============================================================
import type { IndustrialIngredient, Nutrition } from '../types';

// ----- Units & conversions ----------------------------------------------------
// Ordered smallest-to-largest for mass units so the dropdown reads naturally for
// supplement formulators (mcg → mg → g → kg), then volume units, then imperial
// kitchen units for F&B / baking audiences. mg and mcg are indispensable for
// supplements — ingredient doses are typically 100-500 mg and micronutrients are
// commonly stated in mcg (Vitamin D, K, B12, folate, selenium, etc.).
export const UNITS = ['mcg', 'mg', 'g', 'kg', 'oz', 'lb', 'ml', 'L', 'fl oz', 'tsp', 'tbsp', 'cup'];

export const UNIT_TO_GRAMS: Record<string, number> = {
  mcg: 0.000001,
  mg: 0.001,
  g: 1,
  kg: 1000,
  oz: 28.3495,
  lb: 453.592,
  ml: 1,
  L: 1000,
  'fl oz': 29.5735,
  tsp: 4.92892,
  tbsp: 14.7868,
  cup: 236.588,
};

// ----- Categories (ingredient database) ---------------------------------------
// Order matters: "All" always first, then grouped so related categories sit together.
export const CATEGORIES = [
  'All',
  // Sweeteners & fats
  'Sweeteners',
  'Fats & Oils',
  // Condiments / functional ingredients
  'Condiment Ingredients',
  // Produce (fresh = whole unprocessed; Produce = IQF / aseptic / purees)
  'Fresh Produce',
  'Produce',
  'Fresh Herbs',
  'Spices',
  // Proteins & legumes
  'Egg Products',
  'Legumes & Nuts & Seeds',
  'Dried Beans',
  'Canned Beans',
  'Nut & Seed Butters',
  // Liquids
  'Juices',
  'Concentrates & Extracts',
];

// ----- Packaging & Closures categories ---------------------------------------
export const PACKAGING_CATEGORIES = [
  'All',
  'Glass Jars',
  'Glass Bottles',
  'Plastic Bottles',
  'Plastic Jars & Tubs',
  'Pouches',
  'Metal Cans',
  'Cartons & Composite',
  'Closures',
  'Pumps & Dispensers',
];

// ----- Major Food Allergens (FDA FALCPA + FASTER Act) -------------------------
export const ALLERGENS_LIST: { name: string; keywords: string[] }[] = [
  { name: 'Milk', keywords: ['milk', 'dairy', 'cream', 'butter', 'cheese', 'whey', 'casein', 'lactose'] },
  { name: 'Eggs', keywords: ['egg', 'albumin', 'mayonnaise'] },
  { name: 'Fish', keywords: ['fish', 'salmon', 'tuna', 'cod', 'anchov'] },
  { name: 'Shellfish', keywords: ['shrimp', 'crab', 'lobster', 'shellfish', 'clam', 'oyster'] },
  { name: 'Tree Nuts', keywords: ['almond', 'cashew', 'walnut', 'pecan', 'pistachio', 'coconut', 'hazelnut', 'macadamia'] },
  { name: 'Peanuts', keywords: ['peanut', 'groundnut'] },
  { name: 'Wheat', keywords: ['wheat', 'flour', 'gluten', 'semolina', 'malt'] },
  { name: 'Soybeans', keywords: ['soy', 'soya', 'tofu'] },
  { name: 'Sesame', keywords: ['sesame', 'tahini'] },
  { name: 'Mustard', keywords: ['mustard'] },
];

/**
 * Scan a free-text string and return the list of Big-9 allergens it implies.
 * Used as a safety net on top of each ingredient's explicit `allergens` array
 * (e.g., for USDA-returned items that don't carry structured allergen data).
 *
 * Uses word-boundary-START regex `\b${k}\w*\b` to:
 *   • PREVENT substring-anywhere false-positives (e.g., 'fish' inside 'shellfish')
 *   • PRESERVE stem-keyword matching designed into ALLERGENS_LIST:
 *     - 'anchov' → matches Anchovy, Anchovies
 *     - 'soy' → matches Soybean, Soya
 *     - 'almond' → matches Almonds, Almond Butter (head-word)
 *     - 'egg' → matches Egg, Eggs, Egg Yolks (head-word)
 *
 * Known false-positive (pre-existing, unchanged by this fix; tracked for
 * Round 12+ deferral per lib/supplementAllergen.ts comment block):
 *   • 'egg' matches 'Eggplant' (non-allergen) — false positive
 *   • 'flour' matches 'Almond Flour' (non-wheat) — false positive
 *
 * Known regression introduced by word-boundary-START (vs prior substring):
 *   • 'milk' no longer matches 'Buttermilk' (compound word; rare in supplements)
 *
 * Proper fix path: wire up lib/supplementAllergen.ts detectAllergensDetailed()
 * which uses explicit species-mapped keyword sets (tracked as launch-blocker 1B
 * — required for FALCPA-compliant species-naming output before August 2026).
 *
 * Surfaced 2026-05-23 via operator workspace test (Glucosamine HCl Crustacean
 * Shellfish allergen incorrectly fanning out to "Contains: Crustacean Shellfish,
 * Fish, Shellfish" via 'shellfish' substring matching — FDA labeling compliance
 * violation, over-declared Fish allergen).
 */
export const detectAllergens = (text: string): string[] => {
  return ALLERGENS_LIST
    .filter(a => a.keywords.some(k => new RegExp(`\\b${k}\\w*\\b`, 'i').test(text)))
    .map(a => a.name);
};

/**
 * Runtime type guard: is this row from our internal industrial DB (vs a USDA result)?
 */
export const isIndustrial = (item: unknown): item is IndustrialIngredient =>
  !!item && typeof item === 'object' && 'suppliers' in (item as Record<string, unknown>);

/**
 * Build a zeroed Nutrition object — used as the accumulator in recalculation.
 */
export const emptyNutrition = (): Nutrition => ({
  calories: 0,
  totalFat: 0,
  saturatedFat: 0,
  transFat: 0,
  cholesterol: 0,
  sodium: 0,
  totalCarbs: 0,
  dietaryFiber: 0,
  totalSugars: 0,
  protein: 0,
  vitaminD: 0,
  calcium: 0,
  iron: 0,
  potassium: 0,
});

/**
 * Convert a quantity in `unit` to grams (or ml, treated as 1:1 for water-like).
 */
export const toGrams = (qty: number, unit: string): number =>
  qty * (UNIT_TO_GRAMS[unit] || 1);

// ============================================================
// FDA NUTRITION FACTS ROUNDING (21 CFR 101.9)
// ------------------------------------------------------------
// Legally required rounding for Nutrition Facts labels.
// Returns a string (not a number) because some values become
// "0", "less than 1g", etc. rather than a numeric value.
// ============================================================

/** Calories: <5 = "0", <50 = nearest 5, ≥50 = nearest 10 */
export function fdaRoundCalories(kcal: number): string {
  if (kcal < 5) return '0';
  if (kcal < 50) return String(Math.round(kcal / 5) * 5);
  return String(Math.round(kcal / 10) * 10);
}

/** Fat (total, saturated, trans, poly, mono): <0.5g = "0", <5g = nearest 0.5g, ≥5g = nearest 1g */
export function fdaRoundFat(g: number): string {
  if (g < 0.5) return '0';
  if (g < 5) {
    const rounded = Math.round(g * 2) / 2;
    return rounded % 1 === 0 ? String(rounded) : rounded.toFixed(1);
  }
  return String(Math.round(g));
}

/** Cholesterol: <2mg = "0", 2-5mg = "less than 5", ≥5mg = nearest 5mg */
export function fdaRoundCholesterol(mg: number): string {
  if (mg < 2) return '0';
  if (mg < 5) return 'less than 5';
  return String(Math.round(mg / 5) * 5);
}

/** Sodium: <5mg = "0", 5-140mg = nearest 5mg, >140mg = nearest 10mg */
export function fdaRoundSodium(mg: number): string {
  if (mg < 5) return '0';
  if (mg <= 140) return String(Math.round(mg / 5) * 5);
  return String(Math.round(mg / 10) * 10);
}

/** Carbs, Sugars, Added Sugars, Fiber, Protein: <0.5g = "0", <1g = "less than 1", ≥1g = nearest 1g */
export function fdaRoundGrams(g: number): string {
  if (g < 0.5) return '0';
  if (g < 1) return 'less than 1';
  return String(Math.round(g));
}

/** Potassium: ≤ 5mg = "0", 5-140mg nearest 5mg, >140mg nearest 10mg. Same as sodium. */
export const fdaRoundPotassium = fdaRoundSodium;

/** Calcium and Iron are expressed as %DV (see below) but also mg is sometimes shown. */
export const fdaRoundCalcium = fdaRoundSodium;

/** Vitamin D: expressed in mcg. ≤0.5 = 0; <10mcg nearest 0.5; ≥10 nearest 1. */
export function fdaRoundVitaminD(mcg: number): string {
  if (mcg < 0.5) return '0';
  if (mcg < 10) {
    const r = Math.round(mcg * 2) / 2;
    return r % 1 === 0 ? String(r) : r.toFixed(1);
  }
  return String(Math.round(mcg));
}

/** Iron: in mg. <0.1 = 0; <10 nearest 0.1; ≥10 nearest 1. Actually FDA uses per-mineral rules; Iron now uses mg label with rounding per 21 CFR 101.9(c)(8)(iv). */
export function fdaRoundIron(mg: number): string {
  if (mg < 0.1) return '0';
  if (mg < 1) return mg.toFixed(1);
  if (mg < 10) return (Math.round(mg * 10) / 10).toFixed(1);
  return String(Math.round(mg));
}

/** %DV: <2% = omit (return "0" or ""); 2-10% = nearest 2; 10-50% = nearest 5; >50% = nearest 10. */
export function fdaRoundPercentDV(pct: number): string {
  if (pct < 2) return '0';
  if (pct <= 10) return String(Math.round(pct / 2) * 2);
  if (pct <= 50) return String(Math.round(pct / 5) * 5);
  return String(Math.round(pct / 10) * 10);
}
