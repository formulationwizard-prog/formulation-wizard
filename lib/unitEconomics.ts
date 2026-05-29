// ============================================================
// Unit-economics cost math — count-based supplements vs mass-based F&B.
// ------------------------------------------------------------
// Pure + test-locked. F&B uses a "fraction of a batch" model. Supplements use
// a per-serving model: the entered formula is a RECIPE OF PERCENTAGES, and the
// capsule fill weight × units is the dial that turns it into a real serving
// (Convention B — see lib/supplementMath.ts computePerServingScale). So the
// summed ingredient cost is the cost of the ENTERED batch; the cost of one
// serving is that × the per-serving scale (servingMass / batchMass). Callers
// pass that scale in via perServingScale. (Pre-Convention-B, supplement scale
// was identity 1.0, so totalCost WAS the per-serving cost; that remains the
// default when no scale is supplied.) This also avoids the bogus "serving >
// batch" warning F&B's fraction model tripped on a multi-capsule serving.
// ============================================================

/** 1 lb in grams (matches the constant in lib/netQuantity.ts). */
export const LB_TO_G = 453.59237;
const KG_TO_G = 1000;

export type CostModel =
  // Supplement contract: each ingredient row is one serving's dose, so the
  // summed ingredient cost IS the per-serving cost. Package scales by servings.
  | 'per-serving'
  // F&B: ingredient rows are an arbitrary batch; serving/package are recovered
  // as mass fractions of that batch.
  | 'batch-fraction';

export interface UnitEconomicsInput {
  costModel: CostModel;
  /** Total ingredient cost, dollars. In 'per-serving' mode this is the cost of ONE serving's doses. */
  totalCost: number;
  /** Sum of ingredient row masses, kg. */
  totalWeightKg: number;
  /** Sum of ingredient row masses, g (= totalWeightKg × 1000). */
  totalBatchGrams: number;
  /** Physical serving mass, g. */
  servingSizeInGrams: number;
  /** Physical package/container fill mass, g. */
  packageSizeInGrams: number;
  /** Discrete units (capsules/tablets) per serving. */
  unitsPerServing: number;
  /** Servings per container. */
  servingsPerContainer: number;
  /** Packaging (container + closure) cost per finished unit, dollars. */
  packagingCostPerUnit: number;
  /**
   * Convention B per-serving scale (servingMass / batchMass), used only by the
   * 'per-serving' model: per-serving cost = totalCost × this. Defaults to 1.0
   * (the pre-Convention-B identity, where the entered formula WAS one serving).
   */
  perServingScale?: number;
}

export interface UnitEconomicsResult {
  /** Fundamental ingredient cost per kg, dollars. */
  perKg: number;
  /** Cost per discrete unit (capsule/tablet), dollars — null when there is no discrete unit. */
  perUnit: number | null;
  /** Cost per serving, dollars. */
  perServing: number;
  /** Ingredient-only cost per package, dollars (excludes packaging). */
  ingredientCostPerPackage: number;
  /** Cost per finished package, dollars (ingredients + packaging). */
  perPackage: number;
  /** Serving mass > entered batch — a real unit-entry error in batch-fraction mode; always false for per-serving. */
  servingExceedsBatch: boolean;
  /** Package mass > entered batch — a real unit-entry error in batch-fraction mode; always false for per-serving. */
  packageExceedsBatch: boolean;
}

export function computeUnitEconomics(i: UnitEconomicsInput): UnitEconomicsResult {
  const perKg = i.totalWeightKg > 0 ? i.totalCost / i.totalWeightKg : 0;

  if (i.costModel === 'per-serving') {
    // Convention B: totalCost is the ENTERED batch's material cost; one serving
    // delivers (servingMass / batchMass)× that material, so scale to it.
    const scale = i.perServingScale ?? 1;
    const perServing = i.totalCost * scale;
    const perUnit = i.unitsPerServing > 0 ? perServing / i.unitsPerServing : null;
    const ingredientCostPerPackage = perServing * Math.max(0, i.servingsPerContainer);
    const perPackage = ingredientCostPerPackage + i.packagingCostPerUnit;
    // The serving/package mass legitimately exceeds the single-serving dose sum
    // (a serving is 2+ capsules; a bottle is 30+), so the batch guard never applies.
    return {
      perKg, perUnit, perServing, ingredientCostPerPackage, perPackage,
      servingExceedsBatch: false, packageExceedsBatch: false,
    };
  }

  // batch-fraction (F&B): recover serving/package as mass fractions of the batch.
  const perServing = perKg * (i.servingSizeInGrams / KG_TO_G);
  const ingredientCostPerPackage = i.totalBatchGrams > 0
    ? i.totalCost * (i.packageSizeInGrams / i.totalBatchGrams)
    : 0;
  const perPackage = ingredientCostPerPackage + i.packagingCostPerUnit;
  return {
    perKg, perUnit: null, perServing, ingredientCostPerPackage, perPackage,
    servingExceedsBatch: i.totalBatchGrams > 0 && i.servingSizeInGrams > i.totalBatchGrams,
    packageExceedsBatch: i.totalBatchGrams > 0 && i.packageSizeInGrams > i.totalBatchGrams,
  };
}

/** Convert a $/lb cost (F&B input) to $/kg for internal storage. */
export function costPerLbToPerKg(costPerLb: number): number {
  return costPerLb * (KG_TO_G / LB_TO_G);
}

/** Convert internal $/kg to $/lb for display in F&B mode. */
export function costPerKgToPerLb(costPerKg: number): number {
  return costPerKg * (LB_TO_G / KG_TO_G);
}
