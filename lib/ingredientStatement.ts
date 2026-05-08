// ============================================================
// FDA INGREDIENT STATEMENT ASSEMBLY (21 CFR 101.4)
// ------------------------------------------------------------
// Builds the consumer-facing ingredient statement from the
// formulation's per-ingredient catalog name + sub-ingredient list.
//
// 21 CFR 101.4 requires:
//   • Common or usual name of each ingredient
//   • Descending order by predominant weight (caller sorts before
//     calling buildIngredientStatement)
//   • Compound ingredients (those with their own ingredient list)
//     disclose their sub-ingredients in parentheses
//
// The internal catalog name often carries a "(grade qualifier)" suffix
// like "(Industrial Grade)" or "(50 Grain / 5%)" that is not part of the
// consumer-facing name. This module strips the trailing parens-qualifier
// and applies a match-based rule to decide simple vs. compound rendering.
// ============================================================

/**
 * Strip the trailing parens-qualifier from a catalog name.
 *
 * Examples:
 *   "Honey (Industrial Grade)"               → "Honey"
 *   "Pure Lemon Extract (Oil-Based)"         → "Pure Lemon Extract"
 *   "Distilled White Vinegar (50 Grain / 5%)" → "Distilled White Vinegar"
 *   "Vitamin K2 MK-7 (Natto, 0.2% on MCC)"   → "Vitamin K2 MK-7"
 *   "Honey (Industrial Grade) (Pasteurized)" → "Honey (Industrial Grade)"
 *     (only the trailing group is stripped; any earlier groups stay)
 *   "Cucumber"                                → "Cucumber"
 *
 * The regex is non-greedy enough to avoid eating earlier paren groups
 * (`[^)]*` doesn't span a closing paren) and anchored to end-of-string.
 */
export function stripCatalogQualifier(name: string): string {
  return name.replace(/\s*\([^)]*\)\s*$/, '').trim();
}

/**
 * Decide simple vs. compound for one ingredient and return its consumer-facing
 * rendering with sub-ingredient disclosure where required.
 *
 * Rule (match-based — see header comment about the directive's intent):
 *   • subs is empty/undefined         → render stripped catalog name
 *   • subs is a single item that matches the stripped catalog name
 *     (case-insensitive)              → render stripped catalog name
 *   • subs is multi-item, OR a single item that DOESN'T match the
 *     stripped catalog name           → render
 *                                       "<stripped> (<subs joined by ', '>)"
 *
 * The match-based rule (rather than a strict comma-only rule) captures the
 * common case where a catalog grade qualifier ("Industrial Grade", "50 Grain
 * / 5%") shouldn't appear on the label, but the ingredient still needs to
 * disclose differently-named sub-ingredients (e.g., a vinegar SKU whose
 * sub-ingredient catalog entry says "Diluted Acetic Acid" should render as
 * "Distilled White Vinegar (Diluted Acetic Acid)" — chemically honest, even
 * if a future catalog cleanup may collapse it back to "Distilled White
 * Vinegar" by aligning the sub-ingredient statement with the common name).
 */
export function renderIngredientName(catalogName: string, subIngredients: string[] | undefined): string {
  const stripped = stripCatalogQualifier(catalogName);
  const subs = subIngredients ?? [];
  if (subs.length === 0) return stripped;
  if (subs.length === 1 && subs[0].trim().toLowerCase() === stripped.toLowerCase()) {
    return stripped;
  }
  return `${stripped} (${subs.join(', ')})`;
}

/**
 * Build the full ingredient statement string from a list of ingredients
 * pre-sorted in descending order by predominant weight (per 21 CFR 101.4(a)).
 * Each ingredient renders via renderIngredientName, joined by ', '.
 *
 * The caller is responsible for the descending-by-weight sort.
 */
export function buildIngredientStatement(
  ingredients: Array<{ name: string; subIngredients?: string[] }>,
): string {
  return ingredients.map(i => renderIngredientName(i.name, i.subIngredients)).join(', ');
}
