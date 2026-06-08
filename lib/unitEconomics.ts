// ============================================================
// Unit-economics cost math — count-based supplements vs mass-based F&B.
// ------------------------------------------------------------
// Pure + test-locked. F&B uses a "fraction of a batch" model. Supplements use a
// per-serving model under CONVENTION B (recipe-ratio — LIVE since 2026-06-07,
// SUPPLEMENT_CONVENTION_B_ENABLED = true): the entered ingredient rows are the
// RECIPE (proportions), and one serving delivers (servingMass / formulaMass)× of it.
// So per-serving cost = totalCost × perServingScale, where the caller passes
// perServingScale = computePerServingScale(...) — the SAME factor the SFP doses and
// the UL / dosage checks use. Cost therefore TRACKS the panel: when the SFP shows
// 377 mg at a 660 mg fill, the per-serving cost reflects that 377 mg, not the
// recipe's 200 mg. The per-serving model also avoids the bogus "serving > batch"
// warning that F&B's fraction model tripped on a multi-capsule serving.
//
// Blank-until-real safety net: an UNSET fill → computePerServingScale returns
// identity (1.0) → cost = the entered recipe's cost, never a capsule-capacity-
// inflated value. That capacity-scaling inflation was the ~4× SFP + cost bug
// retired 2026-06-05 — do NOT reintroduce capsule-capacity scaling here.
// ============================================================

/** 1 lb in grams (matches the constant in lib/netQuantity.ts). */
export const LB_TO_G = 453.59237;
const KG_TO_G = 1000;

export type CostModel =
  // Supplement contract (Convention A): each ingredient row is one serving's
  // dose, so the summed ingredient cost IS the per-serving cost (scale 1.0).
  // Package scales by servings.
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
   * Per-serving scale, used only by the 'per-serving' model:
   * per-serving cost = totalCost × this. Under Convention A (August launch) this
   * is 1.0 — the entered formula IS one serving. Retained as the post-launch
   * Convention-B seam (servingMass / batchMass); stays 1.0 while
   * SUPPLEMENT_CONVENTION_B_ENABLED is false. Defaults to 1.0.
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
    // Convention A: totalCost IS the per-serving material cost (each row is one
    // serving's dose), so scale is 1.0. The × scale stays as the post-launch
    // Convention-B seam (one serving = servingMass/batchMass of the recipe).
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
