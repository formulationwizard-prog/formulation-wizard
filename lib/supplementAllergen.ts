// ============================================================
// §B1 — ALLERGEN SPECIES-NAMING + CONTAINS GENERATOR
// ------------------------------------------------------------
// Round 11 Phase 2 Step 4 (2026-05-17). Species-aware allergen
// detection, FDA-format `Contains:` statement generator, and the
// per-§B-item gate that refuses export when a species-required
// allergen category (Tree Nuts, Fish, Crustacean Shellfish) is
// detected without species-level naming per 21 CFR 101.36(b)(1)(i)(B)
// and FALCPA.
//
// SCOPE — what this module IS
// ------------------------------------------------------------
//   • detectAllergensDetailed(text) → AllergenMatch[]
//     Species-aware detector. Returns structured matches with
//     category + species + requiresSpeciesNaming flag.
//   • generateContainsStatement(matches) → string
//     FDA-format Contains: line per 21 CFR 101.36(b)(1)(i)(B).
//     "Contains: Almonds, Walnuts, and Milk." (Oxford comma).
//   • evaluateAllergenGate(input) → AllergenGateResult
//     Per-item gate evaluator. Refuses when species-required
//     category is detected without species; cleared otherwise.
//   • B1_ALLERGEN_ITEM_ID — composition-registry identifier.
//
// SCOPE — what this module is NOT (yet)
// ------------------------------------------------------------
//   • Ambiguous-ingredient hard flag (natural flavor, lecithin
//     without source, brand-name protein blends without breakdown).
//     Deferred to Round 12+. Logged at
//     docs/architecture/harm-critical-floor.md §B1.
//   • Supplier allergen disclosure registry. Deferred.
//   • Operator dual-confirmation override flow. Deferred (UI work).
//   • Gate-level validation of an operator-supplied rendered
//     Contains: text against detected allergens. Deferred to PDS
//     rendering pipeline boundary (Track C Phase 3).
//   • Replacement of the existing detectAllergens() in lib/utils.ts.
//     That function returns `string[]` and is consumed by the
//     workspace UI as a safety-net populator for Ingredient.allergens[].
//     This module adds a richer sibling detector alongside; existing
//     callers continue to use the simpler shape. Same boundary
//     discipline as §B2 (analyzeDraftClaim untouched; new
//     evaluateDiseaseClaimGate added alongside).
//
// ============================================================
// === DO NOT WEAKEN THIS GATE ===
// ============================================================
//
// FALCPA + FASTER Act + 21 CFR 101.36 require that tree nuts, fish,
// and crustacean shellfish be named at the species level on the
// label. A "Contains: Tree Nuts" statement on a product made with
// almonds is misbranding — the species must be named. Adding
// bypasses, demoting species-naming violations to advisory, or
// relaxing the species-required allowlist are regulatory-safety
// regressions regardless of intent. Read this docblock end-to-end
// and consult an FDA-recognized Process Authority before changing
// the species-required allowlist or the species mappings below.
// ============================================================

import type { HardStop, HardStopEvidence } from './hardStop';

/** Allergen categories tracked by this module. Includes the FALCPA + FASTER
 *  Big-9 (Milk, Eggs, Fish, Shellfish, Tree Nuts, Peanuts, Wheat, Soybeans,
 *  Sesame) plus international-additional categories (currently: Mustard).
 *  See ALLERGEN_REGULATORY_METADATA below for per-category tier + citation. */
export type AllergenCategory =
  | 'Milk'
  | 'Eggs'
  | 'Fish'
  | 'Shellfish'
  | 'Tree Nuts'
  | 'Peanuts'
  | 'Wheat'
  | 'Soybeans'
  | 'Sesame'
  | 'Mustard';

/**
 * Regulatory tier for an allergen category. Drives gate behavior at the
 * supplement Bucket 1 composition layer.
 */
export type AllergenRegulatoryTier =
  /**
   * FALCPA + FASTER Act Big-9. US-required hard-stop tier. Refusal-bearing
   * at Round 11 export gate when species-naming or other §B1 conditions
   * fire on categories of this tier.
   */
  | 'falcpa-faster-big-9'
  /**
   * International-additional categories (Canada, EU, Australia/NZ).
   * Currently: Mustard. Surfaced for awareness but advisory only at
   * Round 11 — does NOT contribute to gate refusal. Jurisdiction-selector
   * that elevates this tier to hard-stop when customer indicates Canada /
   * EU / AUS-NZ market scope is Round 12+ work.
   */
  | 'international-additional';

/**
 * Per-category regulatory metadata: tier classification + citation for the
 * underlying authority. Used to:
 *   • populate AllergenMatch.regulatoryTier during detection
 *   • drive gate-level filtering (only falcpa-faster-big-9 contributes to
 *     hard-stop refusal at Round 11)
 *   • surface the regulatory basis in UI advisory rendering
 *
 * Citation strings name the statute or standard, not a specific clause —
 * the per-match section-level citation (e.g., 21 CFR 101.36(b)(1)(i)(B))
 * comes from B1_ALLERGEN_CITATION when the gate fires on a specific
 * species-naming defect.
 */
export const ALLERGEN_REGULATORY_METADATA: Record<
  AllergenCategory,
  { tier: AllergenRegulatoryTier; citation: string }
> = {
  // FALCPA Big-8 (Milk, Eggs, Fish, Shellfish, Tree Nuts, Peanuts, Wheat,
  // Soybeans) + FASTER Act 2021 (Sesame) = US Big-9 statutory tier.
  'Milk':      { tier: 'falcpa-faster-big-9',     citation: 'FALCPA (21 U.S.C. §343(w)); FASTER Act' },
  'Eggs':      { tier: 'falcpa-faster-big-9',     citation: 'FALCPA (21 U.S.C. §343(w)); FASTER Act' },
  'Fish':      { tier: 'falcpa-faster-big-9',     citation: 'FALCPA (21 U.S.C. §343(w)); FASTER Act' },
  'Shellfish': { tier: 'falcpa-faster-big-9',     citation: 'FALCPA (21 U.S.C. §343(w)); FASTER Act' },
  'Tree Nuts': { tier: 'falcpa-faster-big-9',     citation: 'FALCPA (21 U.S.C. §343(w)); FASTER Act' },
  'Peanuts':   { tier: 'falcpa-faster-big-9',     citation: 'FALCPA (21 U.S.C. §343(w)); FASTER Act' },
  'Wheat':     { tier: 'falcpa-faster-big-9',     citation: 'FALCPA (21 U.S.C. §343(w)); FASTER Act' },
  'Soybeans':  { tier: 'falcpa-faster-big-9',     citation: 'FALCPA (21 U.S.C. §343(w)); FASTER Act' },
  'Sesame':    { tier: 'falcpa-faster-big-9',     citation: 'FALCPA (21 U.S.C. §343(w)); FASTER Act (2021)' },
  // International-additional: not US-statutory; required in non-US
  // jurisdictions. Round 11 treats as advisory; jurisdiction selector
  // for hard-stop elevation deferred to Round 12+.
  'Mustard':   { tier: 'international-additional', citation: 'Health Canada Priority Allergens; EU Regulation 1169/2011 Annex II; FSANZ Standard 1.2.3' },
};

/**
 * Structured allergen match returned by detectAllergensDetailed.
 * Richer than the legacy detectAllergens() string[] shape to support
 * gate-level species-naming enforcement.
 */
export interface AllergenMatch {
  /** Allergen category — Big-9 or international-additional. See
   *  ALLERGEN_REGULATORY_METADATA for tier classification. */
  category: AllergenCategory;
  /**
   * Specific species when detected (e.g., 'Almonds' for Tree Nuts;
   * 'Salmon' for Fish; 'Shrimp' for Shellfish). Title-case for direct
   * use in the Contains: statement.
   *
   * `undefined` means a generic term was detected ('tree nuts',
   * 'fish', 'crustacean shellfish') without naming a species. For
   * categories where `requiresSpeciesNaming` is true, an undefined
   * species value is a gate refusal trigger.
   *
   * For categories where `requiresSpeciesNaming` is false (Milk,
   * Eggs, Peanuts, Wheat, Soybeans, Sesame, Mustard), `species` is
   * always undefined (category name is sufficient on the label).
   */
  species?: string;
  /** The source-text keyword that triggered the match. */
  matchedKeyword: string;
  /**
   * True for Tree Nuts, Fish, Shellfish (FALCPA species-naming
   * requirement). False for Milk, Eggs, Peanuts, Wheat, Soybeans,
   * Sesame, Mustard (category name is sufficient).
   */
  requiresSpeciesNaming: boolean;
  /**
   * Regulatory tier sourced from ALLERGEN_REGULATORY_METADATA.
   *
   *   • 'falcpa-faster-big-9'      — US-statutory hard-stop tier.
   *                                   Refusal-bearing at gate.
   *   • 'international-additional' — Advisory only at Round 11.
   *                                   Currently: Mustard (Health
   *                                   Canada / EU / FSANZ).
   */
  regulatoryTier: AllergenRegulatoryTier;
}

/**
 * Composition-registry identifier for the §B1 allergen item.
 * Imported by lib/supplementBucket1Gate.ts to register this gate
 * as a composed item. Stable string — do not rename without
 * updating the gate's COMPOSED_ITEMS registry.
 */
export const B1_ALLERGEN_ITEM_ID = 'b1-allergen-species-naming' as const;

/**
 * Shared CFR citation applied to all §B1 hard-stop evidence items.
 * 21 CFR 101.36(b)(1)(i)(B) governs Supplement Facts allergen
 * disclosure; FALCPA + FASTER Act are the underlying statutory
 * requirements.
 */
export const B1_ALLERGEN_CITATION =
  '21 CFR 101.36(b)(1)(i)(B); FALCPA + FASTER Act' as const;

// ─── Species mappings (keyword → display species) ──────────────────
// Display species values are Title-Case for direct use in the
// Contains: statement (FDA labeling examples use Title-Case allergen
// names: "Contains: Almonds, Walnuts").

const TREE_NUT_SPECIES: Record<string, string> = {
  almond: 'Almonds',
  cashew: 'Cashews',
  walnut: 'Walnuts',
  pecan: 'Pecans',
  pistachio: 'Pistachios',
  coconut: 'Coconut',
  hazelnut: 'Hazelnuts',
  macadamia: 'Macadamia Nuts',
};

const FISH_SPECIES: Record<string, string> = {
  salmon: 'Salmon',
  tuna: 'Tuna',
  cod: 'Cod',
  anchov: 'Anchovies',
};

const SHELLFISH_SPECIES: Record<string, string> = {
  shrimp: 'Shrimp',
  crab: 'Crab',
  lobster: 'Lobster',
  clam: 'Clams',
  oyster: 'Oysters',
};

// Generic-term patterns: when these match WITHOUT a species match
// for the same category, the gate fires a species-naming violation.
const TREE_NUT_GENERIC = /\b(tree\s*nuts?|nuts?)\b/i;
const FISH_GENERIC = /\bfish\b/i;
const SHELLFISH_GENERIC =
  /\b(shellfish|crustacean(s)?(\s+shellfish)?)\b/i;

// Non-species categories — substring detection per the existing
// ALLERGENS_LIST in lib/utils.ts, replicated here for module isolation
// AND tightened to remove the most harmful false-positive collisions.
//
// 'butter' DROPPED from Milk keywords (vs utils.ts ALLERGENS_LIST):
//   Substring 'butter' falsely matches "peanut butter", "almond butter",
//   "cashew butter", "cocoa butter" — all NON-dairy products that would
//   be misbranded as containing Milk if 'butter' were a Milk keyword.
//   "Dairy butter" alone (rare in supplement ingredient lists) loses
//   detection by this change, but compound names like "buttermilk powder"
//   still match via 'milk'. Net improvement for label correctness.
//
// Other false-positive patterns logged as Round 12+ deferral:
//   • 'flour' in Wheat → "almond flour", "coconut flour", "rice flour"
//     erroneously match Wheat
//   • 'cream' in Milk → "cream of tartar" (chemical, non-dairy)
//   • 'egg' in Eggs → "eggplant" (non-egg)
//   • 'malt' in Wheat → barley-derived malt is not wheat-derived
// Word-boundary or compound-aware detection is the right long-term fix.
const NON_SPECIES_KEYWORDS: ReadonlyArray<{ category: AllergenCategory; keywords: readonly string[] }> = [
  { category: 'Milk', keywords: ['milk', 'dairy', 'cream', 'cheese', 'whey', 'casein', 'lactose'] },
  { category: 'Eggs', keywords: ['egg', 'albumin', 'mayonnaise'] },
  { category: 'Peanuts', keywords: ['peanut', 'groundnut'] },
  { category: 'Wheat', keywords: ['wheat', 'flour', 'gluten', 'semolina', 'malt'] },
  { category: 'Soybeans', keywords: ['soy', 'soya', 'tofu'] },
  { category: 'Sesame', keywords: ['sesame', 'tahini'] },
  { category: 'Mustard', keywords: ['mustard'] },
];

/**
 * Species-aware allergen detection. Returns structured AllergenMatch[]
 * with category, species (when applicable), matched keyword, and the
 * species-naming-required flag.
 *
 * For species-required categories (Tree Nuts, Fish, Shellfish):
 *   • Species keyword match → AllergenMatch with species set.
 *   • Generic-term match (e.g., "tree nuts", "fish", "shellfish")
 *     WITHOUT a species match for the same category → AllergenMatch
 *     with species: undefined (gate refusal trigger).
 *   • Both species and generic term present → only species match
 *     is returned (species naming satisfies the requirement).
 *
 * For non-species categories (Milk, Eggs, etc.): single match per
 * category, no species, requiresSpeciesNaming: false.
 *
 * Pure function — no side effects.
 */
export function detectAllergensDetailed(text: string): AllergenMatch[] {
  if (!text || !text.trim()) return [];

  const lower = text.toLowerCase();
  const matches: AllergenMatch[] = [];

  // ─── Tree Nuts ────────────────────────────────────────────
  let treeNutSpeciesFound = false;
  for (const [keyword, species] of Object.entries(TREE_NUT_SPECIES)) {
    if (lower.includes(keyword)) {
      matches.push({
        category: 'Tree Nuts',
        species,
        matchedKeyword: keyword,
        requiresSpeciesNaming: true,
        regulatoryTier: ALLERGEN_REGULATORY_METADATA['Tree Nuts'].tier,
      });
      treeNutSpeciesFound = true;
    }
  }
  if (!treeNutSpeciesFound) {
    const generic = text.match(TREE_NUT_GENERIC);
    if (generic) {
      matches.push({
        category: 'Tree Nuts',
        species: undefined,
        matchedKeyword: generic[0],
        requiresSpeciesNaming: true,
        regulatoryTier: ALLERGEN_REGULATORY_METADATA['Tree Nuts'].tier,
      });
    }
  }

  // ─── Fish ──────────────────────────────────────────────────
  let fishSpeciesFound = false;
  for (const [keyword, species] of Object.entries(FISH_SPECIES)) {
    if (lower.includes(keyword)) {
      matches.push({
        category: 'Fish',
        species,
        matchedKeyword: keyword,
        requiresSpeciesNaming: true,
        regulatoryTier: ALLERGEN_REGULATORY_METADATA['Fish'].tier,
      });
      fishSpeciesFound = true;
    }
  }
  if (!fishSpeciesFound) {
    const generic = text.match(FISH_GENERIC);
    if (generic) {
      matches.push({
        category: 'Fish',
        species: undefined,
        matchedKeyword: generic[0],
        requiresSpeciesNaming: true,
        regulatoryTier: ALLERGEN_REGULATORY_METADATA['Fish'].tier,
      });
    }
  }

  // ─── Shellfish ─────────────────────────────────────────────
  let shellfishSpeciesFound = false;
  for (const [keyword, species] of Object.entries(SHELLFISH_SPECIES)) {
    if (lower.includes(keyword)) {
      matches.push({
        category: 'Shellfish',
        species,
        matchedKeyword: keyword,
        requiresSpeciesNaming: true,
        regulatoryTier: ALLERGEN_REGULATORY_METADATA['Shellfish'].tier,
      });
      shellfishSpeciesFound = true;
    }
  }
  if (!shellfishSpeciesFound) {
    const generic = text.match(SHELLFISH_GENERIC);
    if (generic) {
      matches.push({
        category: 'Shellfish',
        species: undefined,
        matchedKeyword: generic[0],
        requiresSpeciesNaming: true,
        regulatoryTier: ALLERGEN_REGULATORY_METADATA['Shellfish'].tier,
      });
    }
  }

  // ─── Non-species categories ────────────────────────────────
  for (const { category, keywords } of NON_SPECIES_KEYWORDS) {
    const matched = keywords.find(k => lower.includes(k));
    if (matched) {
      matches.push({
        category,
        matchedKeyword: matched,
        requiresSpeciesNaming: false,
        regulatoryTier: ALLERGEN_REGULATORY_METADATA[category].tier,
      });
    }
  }

  return matches;
}

/**
 * Generate the FDA-format `Contains:` statement per 21 CFR
 * 101.36(b)(1)(i)(B). Returns the empty string when no matches.
 *
 * Format:
 *   • 0 entries → "" (no statement)
 *   • 1 entry  → "Contains: X."
 *   • 2 entries → "Contains: X and Y."
 *   • 3+ entries → "Contains: X, Y, and Z." (Oxford comma)
 *
 * Each entry uses the species name when present; falls back to the
 * category name when species is undefined for a species-required
 * category. The gate independently catches species-naming
 * violations — this generator emits a best-effort statement
 * regardless, so operators see both the imperfect statement and
 * the gate refusal.
 *
 * Dedupes identical entries (same category + species). Multiple
 * tree-nut species are listed separately (e.g., "Almonds and Walnuts").
 *
 * Pure function — no side effects.
 */
export function generateContainsStatement(
  matches: readonly AllergenMatch[],
): string {
  if (matches.length === 0) return '';

  const entries = matches
    .map(m => m.species ?? m.category)
    .filter((entry, index, arr) => arr.indexOf(entry) === index);

  if (entries.length === 0) return '';

  let listed: string;
  if (entries.length === 1) {
    listed = entries[0];
  } else if (entries.length === 2) {
    listed = `${entries[0]} and ${entries[1]}`;
  } else {
    const head = entries.slice(0, -1).join(', ');
    const tail = entries[entries.length - 1];
    listed = `${head}, and ${tail}`;
  }

  return `Contains: ${listed}.`;
}

/**
 * Result of evaluating the §B1 allergen gate.
 *
 *   • `hardStop: true`  — at least one species-required category
 *                          detected without species naming.
 *   • `hardStop: false` — all matches either name species or are
 *                          for categories where species naming is
 *                          not required.
 */
export type AllergenGateResult =
  | (HardStop & { source: 'supplement-allergen' })
  | {
      hardStop: false;
      source: 'supplement-allergen';
    };

/** Input to evaluateAllergenGate. Caller pre-computes matches via
 *  detectAllergensDetailed over each ingredient and concatenates. */
export interface AllergenGateInput {
  allergenMatches: readonly AllergenMatch[];
}

/**
 * Evaluate the §B1 allergen gate.
 *
 * Pure function — no side effects. Refuses when any match has
 * `requiresSpeciesNaming: true` AND `species` is undefined (a
 * species-required category was detected via a generic term
 * without naming a species per 21 CFR 101.36(b)(1)(i)(B)) AND
 * the match's regulatory tier is the US-statutory hard-stop tier
 * (`falcpa-faster-big-9`).
 *
 * International-additional tier matches (currently Mustard from
 * Health Canada / EU / FSANZ jurisdictions) are advisory only at
 * Round 11 and do NOT contribute to gate refusal — even if a
 * future species-naming requirement were added for a category at
 * that tier. Jurisdiction-selector elevation to hard-stop is
 * Round 12+ work (logged at docs/architecture/harm-critical-floor.md
 * §B1).
 *
 * Compliant matches (species named, or category does not require
 * species, or category is not US-statutory) pass through. Non-
 * compliant matches contribute one evidence entry each.
 */
export function evaluateAllergenGate(
  input: AllergenGateInput,
): AllergenGateResult {
  const violations = input.allergenMatches.filter(
    m =>
      m.requiresSpeciesNaming &&
      m.species === undefined &&
      m.regulatoryTier === 'falcpa-faster-big-9',
  );

  if (violations.length === 0) {
    return { hardStop: false, source: 'supplement-allergen' };
  }

  const evidence: HardStopEvidence[] = violations.map(v => ({
    subject: `${v.category} (generic term)`,
    detail: `${v.category} detected via generic term "${v.matchedKeyword}"; FALCPA requires species-level naming.`,
    citation: B1_ALLERGEN_CITATION,
  }));

  const reason =
    violations.length === 1
      ? `Refuse-to-export: allergen species-naming violation — ${violations[0].category} detected via generic term "${violations[0].matchedKeyword}" without species name.`
      : `Refuse-to-export: ${violations.length} allergen species-naming violations. Tree nuts, fish, and crustacean shellfish require species-level naming per FALCPA.`;

  return {
    hardStop: true,
    source: 'supplement-allergen',
    reason,
    evidence,
  };
}
