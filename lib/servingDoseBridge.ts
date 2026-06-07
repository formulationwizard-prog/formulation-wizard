// ============================================================
// SERVING/DOSE ENGINE — Nutraceuticals bridge (M2, 2026-06-07)
// ------------------------------------------------------------
// Maps current workspace state → engine inputs, so display surfaces can migrate
// to the single source of truth (lib/servingDoseEngine.ts) behind parity tests.
// Additive: nothing in the app imports this yet. The SFP / dosage / UL / cost
// surfaces cut over to it one at a time, each behind its A/B/C parity taxonomy,
// then the old per-site scale math is deleted.
//
// The Nutra factor composes the EXISTING factor logic into the engine's Factor:
//   elemental (lib/elementalFactors.ts) × potency (catalog potencyFactor)
//   × unit_conversion (g → display unit). Same numbers the SFP uses today —
//   that is what makes Class-A parity hold.
// ============================================================
import {
  type EngineIngredient, type ServingInputs, type FactorFn,
  real, UNSET, nutraFactor,
} from './servingDoseEngine';
import { resolveElementalFactor } from './elementalFactors';
import { UNIT_TO_GRAMS } from './utils';
import type { Ingredient } from '../types';

/** Workspace ingredient rows → engine ingredients. Mass is unset when the row
 *  has no positive quantity (blank-until-real at the boundary). */
export function toEngineIngredients(ingredients: readonly Ingredient[]): EngineIngredient[] {
  return ingredients.map((i) => ({
    name: i.name,
    mass: i.qty > 0 ? real(i.qty * (UNIT_TO_GRAMS[i.unit] || 1)) : UNSET,
    data: i.foodData?.type === 'industrial' ? i.foodData.data : undefined,
  }));
}

/** Count-form serving inputs (capsule/tablet/softgel): per-unit fill × units.
 *  Both unset until the operator enters them — no capacity default. */
export function toCountServingInputs(perUnitFillMg: number, unitsPerServing: number): ServingInputs {
  return {
    perUnitFillG: perUnitFillMg > 0 ? real(perUnitFillMg / 1000) : UNSET,
    unitsPerServing: unitsPerServing > 0 ? real(unitsPerServing) : UNSET,
  };
}

/** The Nutra factor function — elemental × potency × g→unit, components queryable.
 *  `unit` is the ingredient's display/label unit (mg for most actives; mcg for
 *  D3/B12/K2/etc.). The SFP cutover passes the per-row DV unit; default mg. */
export function makeNutraFactor(unit: 'mg' | 'mcg' | 'g' = 'mg'): FactorFn {
  return (ing) => {
    const data = ing.data as { potencyFactor?: number } | undefined;
    const elemental = resolveElementalFactor(ing.name); // undefined for non-minerals
    return nutraFactor({
      elemental,
      elementalSource: elemental !== undefined ? 'lib/elementalFactors.ts' : undefined,
      potency: data?.potencyFactor,
      potencySource: data?.potencyFactor !== undefined ? 'catalog potencyFactor' : undefined,
      unit,
    });
  };
}
