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

// ============================================================
// SUPPRESSION RULE — single-sub-ingredient redundant parentheticals
// (Round 8 Item 7 — supersedes Round 4's exact-match-only rule)
// ------------------------------------------------------------
// The "Pickling Salt (Salt)" case from Round 7 verification surfaced the
// gap. Round 4's rule suppressed parentheticals only when the single sub-
// ingredient string EXACTLY matched the (qualifier-stripped) catalog name,
// case-insensitive. That left noisy-but-redundant cases like:
//
//   "Pickling Salt" + ["Salt"]  →  "Pickling Salt (Salt)"
//   "Sea Salt"      + ["Salt"]  →  "Sea Salt (Salt)"
//
// where the sub-ingredient word IS the head noun of a qualified common name,
// adding no disclosure-relevant information.
//
// Rule (positive — when to SUPPRESS):
//   1. Sub-ingredient list has exactly one entry, AND
//   2. That single sub-ingredient (after trimming, case-insensitive) is
//      EITHER:
//        a) identical to the qualifier-stripped catalog name, OR
//        b) a SINGLE WORD that equals the LAST WORD of a multi-word
//           qualifier-stripped catalog name.
//
// Rule (negative — when to RETAIN parentheticals; conservative-default):
//   • Multi-component sub-ingredient lists (>1 item) — disclosure required
//     because the consumer-facing parens carry compound information.
//   • Sub-ingredient is multi-word AND not identical to the catalog name
//     (e.g., "Vanilla" + ["Vanilla Extract"] — different physical form,
//     disclosure-relevant). Suppression rule (2b) only fires when the
//     SUB-ingredient is single-word.
//   • Sub-ingredient is a different word from the catalog name's head
//     noun (e.g., "Salt" + ["Sodium Chloride"] — chemical-name disclosure
//     may be 21 CFR 101.4-relevant even when chemically the same compound).
//   • When ambiguous, RETAIN parens. 21 CFR 101.4 favors more disclosure,
//     not less.
//
// Test matrix (round-trip in renderIngredientName tests below — comments
// only; run mental verification when changing this rule):
//
//   "Sea Salt"                + ["Salt"]                → "Sea Salt"               (suppress 2b)
//   "Pickling Salt"           + ["Salt"]                → "Pickling Salt"          (suppress 2b)
//   "Smoked Salt"             + ["Salt", "Smoke Flavor"]→ "Smoked Salt (Salt, Smoke Flavor)" (retain — multi)
//   "Salt"                    + ["Sodium Chloride"]     → "Salt (Sodium Chloride)" (retain — different word)
//   "Vanilla"                 + ["Vanilla Extract"]     → "Vanilla (Vanilla Extract)" (retain — sub multi-word)
//   "Cucumber"                + ["Cucumber"]            → "Cucumber"               (suppress 2a)
//   "Honey (Industrial Grade)"+ ["Honey"]               → "Honey"                  (suppress 2a, qualifier stripped first)
//
// 21 CFR 101.4 compliance: § 101.4(a)(1) requires "common or usual name."
// § 101.4(b) provides that compound ingredients must declare sub-components
// in parentheses. Suppressing redundant single-word repeats of the head noun
// is consistent with the regulation — the consumer is not gaining additional
// disclosure from "Pickling Salt (Salt)" vs "Pickling Salt." This aligns
// with how mainstream commercial labels render qualifier-prefixed common
// names. Round 4's compliance posture (compound disclosure when sub-list
// genuinely differs from the common name) is preserved.
//
// Documentation: see also docs/design/ingredients-statement-suppression-rule.md
// for the rule + test matrix in design-doc form.
// ============================================================

/**
 * Decide simple vs. compound for one ingredient and return its consumer-facing
 * rendering with sub-ingredient disclosure where required. See suppression
 * rule comment block above renderIngredientName for the positive/negative
 * formulation, test matrix, and 21 CFR 101.4 compliance rationale.
 *
 *   • subs empty/undefined            → render stripped catalog name
 *   • subs exactly one sub-ingredient AND
 *       (a) exact case-insensitive match to stripped catalog name, OR
 *       (b) single-word sub equal to last word of multi-word stripped name
 *                                     → render stripped catalog name (suppress)
 *   • everything else                 → render
 *                                       "<stripped> (<subs joined by ', '>)"
 */
export function renderIngredientName(catalogName: string, subIngredients: string[] | undefined): string {
  const stripped = stripCatalogQualifier(catalogName);
  const subs = subIngredients ?? [];
  if (subs.length === 0) return stripped;

  if (subs.length === 1) {
    const sub = subs[0].trim();
    const subLower = sub.toLowerCase();
    const strippedLower = stripped.toLowerCase();

    // Rule 2a: exact case-insensitive match (qualifier already stripped).
    if (subLower === strippedLower) return stripped;

    // Rule 2b: sub-ingredient is single-word AND equals last word of
    // a multi-word stripped catalog name. The "single-word sub" guard is
    // essential — without it, "Vanilla" + ["Vanilla Extract"] would
    // erroneously suppress because "Extract" doesn't match "Vanilla"
    // (it wouldn't trigger 2b) but "Vanilla Extract" should always retain
    // parens. We split on whitespace; punctuation-only differences keep
    // parens (conservative default). Stripped-name token split treats
    // hyphenated compound words as a single token (intentional — preserves
    // "Cold-Pressed Olive Oil" → ["Cold-Pressed", "Olive", "Oil"]).
    const subTokens = sub.split(/\s+/);
    const strippedTokens = stripped.split(/\s+/);
    if (
      subTokens.length === 1 &&
      strippedTokens.length > 1 &&
      subLower === strippedTokens[strippedTokens.length - 1].toLowerCase()
    ) {
      return stripped;
    }
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
