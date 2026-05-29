// ============================================================
// Wizard-generated supplement composition spec (Convention B).
// ------------------------------------------------------------
// Turns a saved supplement formula into a finished-product composition spec:
// the exact mg of each compound per unit (capsule/tablet/…) and per serving.
// Pure + deterministic — the operator never types these numbers; they fall out
// of the recipe (percentages) × the fill-weight dial, exactly as the live
// workspace math does (computePerServingScale → % × fill × units).
//
// The elemental factor comes from resolveElementalFactor — the SAME single
// source the label %DV and the UL gate use — so the spec can never disagree
// with the Supplement Facts panel.
//
// Generation is gated on a defined serving (fill weight + units, or a scoop
// mass for powders/liquids) and a non-empty formula; otherwise returns null
// (matches the operator rule: "spec generated when saved WITH a serving").
// ============================================================

import { deriveServingComposition } from './servingComposition';
import { resolveElementalFactor } from './elementalFactors';
import type {
  SupplementCompositionRow,
  SupplementCompositionSpec,
} from '@/types/masterSpecs';

export interface CompositionFormulaInput {
  /** FG Part #. */
  productId: string;
  productName: string;
  /** capsule / tablet / softgel / gummy / powder / liquid … */
  deliveryForm: string;
  /** Capsules per serving. Pass 1 for a powder/liquid scoop. */
  unitsPerServing: number;
  /**
   * Per-unit fill weight in mg (the driving dial). For powder/liquid, pass the
   * whole serving mass in mg with unitsPerServing = 1.
   */
  perUnitFillMg: number;
  /** Each ingredient's COMPOUND mass in the entered formula (batch), grams. */
  ingredients: Array<{ name: string; grams: number }>;
  /** Rolled-up batch mass across all ingredients, grams. */
  totalBatchGrams: number;
  /** ISO timestamp; defaults to now() at call time. */
  generatedAt?: string;
}

/**
 * Build the composition spec from a saved supplement formula. Returns null when
 * no serving is defined or the formula is empty (nothing to spec yet).
 */
export function buildSupplementCompositionSpec(
  input: CompositionFormulaInput,
): SupplementCompositionSpec | null {
  const {
    productId,
    productName,
    deliveryForm,
    unitsPerServing,
    perUnitFillMg,
    ingredients,
    totalBatchGrams,
  } = input;

  // Need a real serving + a real batch to turn percentages into mg.
  if (
    !(perUnitFillMg > 0) ||
    !(unitsPerServing > 0) ||
    !(totalBatchGrams > 0) ||
    ingredients.length === 0
  ) {
    return null;
  }

  const servingMassMg = perUnitFillMg * unitsPerServing;

  const rows: SupplementCompositionRow[] = ingredients.map((ing) => {
    const pct = (ing.grams / totalBatchGrams) * 100;
    const factor = resolveElementalFactor(ing.name) ?? 1;
    const comp = deriveServingComposition({
      pct,
      capsuleFillMg: perUnitFillMg,
      capsulesPerServing: unitsPerServing,
      assayFraction: factor,
    });
    return {
      name: ing.name,
      pct,
      mgPerUnit: comp.mgPerCapsule,
      mgPerServing: comp.mgPerServing,
      elementalFactor: factor,
      activeMgPerServing: comp.activeMgPerServing,
      hasElementalDistinction: factor < 1,
      factorBasis: 'typical',
    };
  });

  const totalMgPerServing = rows.reduce((sum, r) => sum + r.mgPerServing, 0);

  return {
    product_id: productId,
    product_name: productName,
    convention: 'B',
    generated_at: input.generatedAt ?? new Date().toISOString(),
    serving: { deliveryForm, unitsPerServing, perUnitFillMg, servingMassMg },
    rows,
    totalMgPerServing,
    confidence: 'estimated',
  };
}
