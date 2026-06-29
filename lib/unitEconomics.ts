// ============================================================
// Unit-economics cost math — count-based supplements vs mass-based F&B.
// ------------------------------------------------------------
// Pure + test-locked. F&B uses a "fraction of a batch" model. Supplements use a
// per-serving model under the F-3 PER-CAPSULE convention (2026-06-28): the entered
// ingredient rows ARE the per-capsule formula, so totalCost is the PER-CAPSULE
// material cost and one serving is `unitsPerServing` capsules.
// So per-serving cost = totalCost × perServingScale, where the caller passes
// perServingScale = unitsPerServing — the SAME basis the F-3 SFP uses (per-capsule
// × units, NO fill-scaling). Cost therefore TRACKS the panel: a 90 mg/capsule active
// at 2 capsules/serving shows 180 mg on the SFP and the per-serving cost reflects two
// capsules' worth. The per-serving model also avoids the bogus "serving > batch"
// warning that F&B's fraction model tripped on a multi-capsule serving.
//
// RETIRED (F-3): the caller previously passed computePerServingScale (the Convention-B
// fill-scale, servingMass/formulaMass) — that inflated per-serving cost by the same
// factor F-3 retired at the SFP. Do NOT reintroduce fill-scaling or capsule-capacity
// scaling here. Blank-until-real: units unset → caller floors to 1 (one capsule's cost).
// ============================================================

/** 1 lb in grams (matches the constant in lib/netQuantity.ts). */
export const LB_TO_G = 453.59237;
const KG_TO_G = 1000;

export type CostModel =
  // Supplement contract (F-3 per-capsule): each ingredient row is one CAPSULE's
  // amount, so the summed ingredient cost is the PER-CAPSULE cost; per-serving =
  // per-capsule × unitsPerServing (caller passes perServingScale = units). Package
  // scales by servings.
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
   * per-serving cost = totalCost × this. Under F-3 the caller passes
   * `unitsPerServing` — totalCost is the per-capsule material cost, so this scales
   * it to the per-serving (per-capsule × units) cost. NO fill-scaling. Floored to 1
   * (one capsule's cost) when units are unset. Defaults to 1.0.
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
    // F-3: totalCost is the PER-CAPSULE material cost; scale = unitsPerServing
    // scales it to per-serving (per-capsule × units). NO fill-scaling.
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
