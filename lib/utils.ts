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

// Mass vs volume classification — used to pick the correct conversion target
// when coercing an unsupported unit into a mode's allowed set.
const MASS_UNITS = new Set(['mcg', 'mg', 'g', 'kg', 'oz', 'lb']);
const VOLUME_UNITS = new Set(['ml', 'L', 'fl oz', 'tsp', 'tbsp', 'cup']);

// Volume→ml factors. These mirror the volume entries in UNIT_TO_GRAMS (which
// treat 1 ml ≈ 1 g), but converting volume→volume is density-independent —
// fl oz → ml is exact regardless of the product. (Distinct from the
// volume→mass density question tracked separately.)
const UNIT_TO_ML: Record<string, number> = {
  ml: 1,
  L: 1000,
  'fl oz': 29.5735,
  tsp: 4.92892,
  tbsp: 14.7868,
  cup: 236.588,
};

export interface UnitCoercion {
  qty: number;
  unit: string;
  /** Set only when a conversion happened — drives the visible "Converted from …" badge. */
  note: string | null;
}

// ----- Count units (CFU) — a count is NOT a weight ---------------------------
// Probiotics declare by colony-forming units, not mass. A count must never be
// fed into weight math: the `|| 1` grams fallback would treat "10 Billion CFU"
// as 10 g — a misbranding-grade error. isCountUnit() guards every mass site.
export const isCountUnit = (unit: string): boolean => /\bcfu\b/i.test(unit);

/**
 * Coerce a (qty, unit) pair into a mode's allowed unit set (LB #3 fix, Option C).
 *
 * When bulk paste resolves an ingredient in a unit the current mode's dropdown
 * doesn't offer (e.g., "0.5 lb" in supplements mode, which only lists
 * mcg/mg/g/kg/ml/L), the controlled <select> would silently display the first
 * option (mcg) while state holds 'lb' — a harm-critical mismatch. Instead we
 * auto-convert to a supported unit (mass → g, volume → ml) AND return a note so
 * the transformation is VISIBLE (no silent change). Per operator design call
 * 2026-05-28 (Option C: auto-convert + visible badge).
 *
 * If the unit is already allowed, returns it unchanged with note=null.
 * If no conversion target is available, returns unchanged with note=null
 * (caller keeps the original — fail-open, never silently wrong).
 */
export function coerceUnitToAllowed(
  qty: number,
  unit: string,
  allowedUnits: string[],
): UnitCoercion {
  if (allowedUnits.includes(unit)) return { qty, unit, note: null };
  // Count units (CFU) pass through untouched — not convertible to a mass/volume
  // allowed unit, and coercing them to grams would corrupt the count.
  if (isCountUnit(unit)) return { qty, unit, note: null };

  const round4 = (n: number) => Math.round(n * 1e4) / 1e4;

  if (MASS_UNITS.has(unit) && allowedUnits.includes('g')) {
    const grams = round4(qty * (UNIT_TO_GRAMS[unit] ?? 1));
    return { qty: grams, unit: 'g', note: `Converted from ${qty} ${unit}` };
  }

  if (VOLUME_UNITS.has(unit) && allowedUnits.includes('ml')) {
    const ml = round4(qty * (UNIT_TO_ML[unit] ?? 1));
    return { qty: ml, unit: 'ml', note: `Converted from ${qty} ${unit}` };
  }

  return { qty, unit, note: null };
}

/**
 * Format a weight percentage for display. Shows 2 decimals normally (0.01%
 * resolution, per operator 2026-06-02), but adds precision for sub-0.01%
 * values so a microgram-dosed active in an mg/g formula never falsely renders
 * as "0.00%". Returns "0" for a true zero / non-finite input.
 *
 *   28.571 → "28.57"   0.5 → "0.50"   0.0018 → "0.0018"   0 → "0"
 */
export function formatWeightPercent(pct: number): string {
  if (!Number.isFinite(pct) || pct <= 0) return '0';
  if (pct >= 0.01) return pct.toFixed(2);
  // sub-0.01% (mcg actives) — adaptive decimals to keep ~2 significant figures
  const decimals = Math.min(8, Math.ceil(-Math.log10(pct)) + 1);
  return pct.toFixed(decimals);
}

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
  // 'Crustacean Shellfish' is the FALCPA-correct term (replaces legacy 'Shellfish').
  // Mollusks (clam, oyster, mussel, scallop) are NOT federal Big-9 — only some state regs require.
  // Mollusk handling deferred to launch-blocker 1B (FALCPA wire-up via lib/supplementAllergen.ts).
  // Catalog entries with mollusk-only ingredients (e.g., Oyster Sauce) preserve explicit allergens: ['Shellfish']
  // as informational disclosure until 1B introduces a Mollusks category.
  { name: 'Crustacean Shellfish', keywords: ['shrimp', 'crab', 'lobster', 'shellfish'] },
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
  addedSugars: 0,
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
  isCountUnit(unit) ? 0 : qty * (UNIT_TO_GRAMS[unit] || 1);

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

/**
 * Vitamins/minerals with RDI ≥ 500 mg or mcg — Calcium, Potassium, Vitamin A,
 * Phosphorous, Chloride, Choline. Per FDA 21 CFR 101.9(c)(8)(iv): nearest 10 mg/mcg.
 */
function fdaRoundHighRdiMicro(amt: number): string {
  if (amt <= 0) return '0';
  return String(Math.round(amt / 10) * 10);
}

/**
 * Vitamins/minerals with RDI < 25 mg or mcg — Iron, Vitamin D, Vitamin E,
 * Thiamin, Riboflavin, Niacin, Vitamin B6, B12, Pantothenic Acid, Zinc, Copper,
 * Manganese, Selenium. Per FDA 21 CFR 101.9(c)(8)(iv): nearest 0.1 mg/mcg.
 */
function fdaRoundLowRdiMicro(amt: number): string {
  if (amt <= 0) return '0';
  return (Math.round(amt * 10) / 10).toFixed(1);
}

/** Calcium — nearest 10 mg per 21 CFR 101.9(c)(8)(iv). */
export const fdaRoundCalcium = fdaRoundHighRdiMicro;

/** Potassium — nearest 10 mg per 21 CFR 101.9(c)(8)(iv). */
export const fdaRoundPotassium = fdaRoundHighRdiMicro;

/** Vitamin D — nearest 0.1 mcg per 21 CFR 101.9(c)(8)(iv). */
export const fdaRoundVitaminD = fdaRoundLowRdiMicro;

/** Iron — nearest 0.1 mg per 21 CFR 101.9(c)(8)(iv). */
export const fdaRoundIron = fdaRoundLowRdiMicro;

/**
 * %DV for MACRONUTRIENTS — Fat, Saturated Fat, Trans Fat, Cholesterol, Sodium,
 * Total Carbohydrate, Dietary Fiber, Total Sugars, Added Sugars, Protein.
 * Per FDA 21 CFR 101.9(d)(7)(ii): nearest whole percent.
 */
export function fdaRoundPercentDVMacros(pct: number): string {
  return String(Math.max(0, Math.round(pct)));
}

/**
 * %DV for VITAMINS AND MINERALS — Vitamin D, Calcium, Iron, Potassium, and other vits/mins.
 * Per FDA 21 CFR 101.9(d)(7)(ii): nearest 2% from 0-10%, nearest 5% from 10-50%, nearest 10% above 50%.
 * Render layer should additionally enforce "Do Not Declare if <2%" per 21 CFR 101.9(c)(8)(iii)
 * by suppressing the entire row, not by rendering "0%".
 */
export function fdaRoundPercentDVMicros(pct: number): string {
  if (pct < 2) return '0';
  if (pct <= 10) return String(Math.round(pct / 2) * 2);
  if (pct <= 50) return String(Math.round(pct / 5) * 5);
  return String(Math.round(pct / 10) * 10);
}
