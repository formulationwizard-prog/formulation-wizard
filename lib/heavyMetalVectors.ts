// ============================================================
// HEAVY-METAL VECTOR CLASSIFIER — Rulebook §I.5a (Amendment 5)
// ------------------------------------------------------------
// Class-level heavy-metal-vector flagging. The catalog FLAGS the vector; it
// does NOT certify content — a finished-product COA to USP <232> is the only
// certification path (the §I.5a operator-facing contract).
//
// WHY A CLASSIFIER (not a per-entry field): vectors cross categories. "All
// botanicals/minerals" is category-level, but "rice-derived → As" and "cocoa →
// Cd" are SOURCE-level (rice protein, cocoa extract live in different
// categories). A category→metals map can't express the source-level ones, so
// this is rule-based — mirroring the centralized `elementalFactor` precedent.
//
// FIRST-PASS — the per-class list is the ratified CATEGORICAL SHAPE; the exact
// per-class metal sets are refined with Nate before catalog implementation
// (§I.5a: "per-class list refined with Nate"). Treat the constants below as the
// starting taxonomy, not the final word.
//
// HONESTY-FIRST: the per-entry override (IndustrialIngredient.heavyMetalsVector-
// Override) wins over the classifier. `'verified-clean'` is a positive COA-
// verified datum (distinct from "no flag"); an explicit array documents a
// vector the classifier missed or refines what it asserts.
// ============================================================
import type { HeavyMetal, IndustrialIngredient } from '../types';

/** Categories whose ingredients carry broad soil/source-uptake metal risk
 *  (Pb/As/Cd — the soil-and-rock trio; Hg is handled by the marine source
 *  signal below, not by category). */
const BROAD_VECTOR_CATEGORIES = new Set<string>([
  'Botanicals',
  'Herbal Extracts',
  'Mushroom Extracts',
  'Minerals',
]);
const BROAD_METALS: HeavyMetal[] = ['Pb', 'As', 'Cd'];

// NATE-REFINEMENT QUEUE (2026-06-17 code-review pickups; NOT blockers — for the
// per-class refinement regroup, all approved as real gaps):
//   • Hg: add `mackerel`, `tuna` — primary higher-Hg fish-oil / supplement sources.
//   • Cd: add `oyster|mussel|clam` — bivalves are notable Cd accumulators (filter
//     seawater); `oyster` currently matches Hg only, missing the Cd pathway.
//   • New vector class for organ/glandular powders (desiccated/bovine liver → Cd
//     from environmental exposure) — Nate's call on adding an 'organ-derived' class
//     (likely not in BROAD_VECTOR_CATEGORIES today).
/** Source-level signals (name + subIngredients), independent of category.
 *  Lowercased substring match against the entry's name + subIngredients. */
const SOURCE_SIGNALS: { metal: HeavyMetal; patterns: RegExp }[] = [
  { metal: 'Hg', patterns: /\b(fish|krill|marine|kelp|algae|algal|seaweed|cod|salmon|sardine|anchovy|shellfish|oyster)\b/i },
  { metal: 'As', patterns: /\b(rice|kelp|seaweed|hijiki)\b/i },
  { metal: 'Cd', patterns: /\b(cocoa|cacao|chocolate|spinach|leafy|sunflower|flax|kelp)\b/i },
];

function add(set: Set<HeavyMetal>, metals: HeavyMetal[]): void {
  for (const m of metals) set.add(m);
}

/**
 * Pure classifier — the class-level default vector set for an entry, IGNORING
 * any per-entry override. Returns [] when the entry matches no vector class.
 */
export function classifyHeavyMetalVectors(ing: Pick<IndustrialIngredient, 'name' | 'category' | 'subIngredients'>): HeavyMetal[] {
  const metals = new Set<HeavyMetal>();
  if (BROAD_VECTOR_CATEGORIES.has(ing.category)) add(metals, BROAD_METALS);

  const haystack = [ing.name, ...(ing.subIngredients ?? [])].join(' ');
  for (const { metal, patterns } of SOURCE_SIGNALS) {
    if (patterns.test(haystack)) metals.add(metal);
  }
  // canonical order Pb, As, Cd, Hg
  const order: HeavyMetal[] = ['Pb', 'As', 'Cd', 'Hg'];
  return order.filter((m) => metals.has(m));
}

export interface HeavyMetalAssessment {
  metals: HeavyMetal[]; // [] = no vector, or COA-verified-clean
  basis: 'override-verified-clean' | 'override' | 'classifier' | 'none';
}

/**
 * The effective heavy-metal assessment for an entry, applying override
 * precedence. `'verified-clean'` → [] with a distinct basis (a positive datum,
 * not absence). An explicit array → that array. Otherwise → classifier default.
 */
export function assessHeavyMetalVectors(ing: IndustrialIngredient): HeavyMetalAssessment {
  const ov = ing.heavyMetalsVectorOverride;
  if (ov === 'verified-clean') return { metals: [], basis: 'override-verified-clean' };
  if (Array.isArray(ov)) return { metals: ov, basis: 'override' };
  const metals = classifyHeavyMetalVectors(ing);
  return { metals, basis: metals.length ? 'classifier' : 'none' };
}
