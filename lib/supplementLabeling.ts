// ============================================================
// SUPPLEMENT FACTS LABEL ENGINE  (21 CFR 101.36)
// ------------------------------------------------------------
// Generates a compliant Supplement Facts panel from a list of
// formulation ingredients. Handles:
//   • Classification: vitamin / mineral / herbal / amino /
//     mushroom / probiotic / specialty / excipient
//   • Reference Daily Intake (RDI / DV) lookup for actives that
//     have an established Daily Value per 21 CFR 101.36 Table 1.
//   • Unit normalization (mg / mcg / IU / CFU) for display.
//   • Proper "Other Ingredients" section — excipients only,
//     listed in descending order by weight (like an ingredient
//     statement).
//   • "†" footnote for actives with no established DV (herbals,
//     mushrooms, amino acids above label-claim levels, etc.).
//
// The engine is deliberately forgiving: ingredients whose name
// matches a known active get a DV; everything else falls through
// to the "other actives" section where it will display with "†".
// Excipients are anything in the 'Excipients' category.
// ============================================================
import type { Ingredient } from '../types';
import type { ModeId } from './modes';
import { UNIT_TO_GRAMS, isCountUnit } from './utils';
import { computePerServingScale } from './supplementMath';
import { perServingAmounts } from './perServingAmounts';
import { keywordMatch } from './keywordMatch';
import { resolveElementalFactor } from './elementalFactors';
import { resolveEquivalenceFactor } from './nutrientEquivalence';
import { SUPPLEMENT_CONVENTION_B_ENABLED } from './supplementMath';
import { combine, real, UNSET, isUnset, valueOf, type MaybeValue } from './servingDoseEngine';

// ============================================================
// REFERENCE DAILY VALUES (21 CFR 101.36 Table 1, adults & kids 4+)
// ------------------------------------------------------------
// Each entry carries:
//   • displayName: the exact name to show on the label
//   • dv: the Daily Value amount (in `unit`)
//   • unit: mg | mcg | IU — label uses this unit
//   • keywords: case-insensitive substrings; first match wins
//   • potencyPerGram: if the ingredient qty represents a carrier-
//     loaded active (e.g. "Vitamin D3 100,000 IU/g"), this is the
//     effective active content per gram of ingredient. Defaults
//     to 1 (ingredient qty is already the active weight).
//   • unitFactor: multiplier from ingredient grams → DV unit.
//     For minerals where the ingredient is a salt (e.g., calcium
//     carbonate = 40% elemental calcium), this can be <1.
//     Defaults to 1.0 (1:1 mg-to-mg).
//   • scientific: optional Latin name for herbals/botanicals.
// ============================================================

/** Equivalence basis a DV is expressed in (per 21 CFR 101.9(c)(8)(iv) footnotes).
 *  The DV VALUE is in `unit`; `basis` drives the label suffix (mcg DFE / mcg RAE /
 *  mg NE / mg α-tocopherol) and tells the engine which source-form conversion to
 *  apply (see lib/nutrientEquivalence.ts). Verified 2026-06-07, see
 *  docs/audits/dv-table-verification-2026-06-07.md. */
export type DVBasis = 'RAE' | 'DFE' | 'NE' | 'alpha-tocopherol';

export interface DVEntry {
  displayName: string;
  dv: number;
  unit: 'mg' | 'mcg' | 'IU' | 'g';
  keywords: string[];
  /** Rough % of ingredient mass that is the active (0-1). Defaults 1.0. */
  elementalFactor?: number;
  /** Equivalence basis (RAE/DFE/NE/α-tocopherol) — drives label suffix + conversion. */
  basis?: DVBasis;
  /** CFR citation OVERRIDE; defaults to the RDI table (c)(8)(iv). DRVs use (c)(9). */
  citation?: string;
  /** Latin / scientific name appended in italics on the label. */
  scientific?: string;
  /** Subcategory for panel ordering. */
  group: 'vitamin' | 'mineral';
}

/** Provenance authority for the DV table — every value verified against the CFR
 *  on 2026-06-07. Most entries are RDIs under (c)(8)(iv); DRVs (Sodium) override. */
export const DV_TABLE_AUTHORITY = {
  authority: 'FDA' as const,
  defaultCitation: '21 CFR 101.9(c)(8)(iv)',
  verifiedOn: '2026-06-07',
} as const;

/** Per-entry provenance (default citation unless the entry overrides). */
export function dvProvenance(e: DVEntry) {
  return {
    authority: DV_TABLE_AUTHORITY.authority,
    citation: e.citation ?? DV_TABLE_AUTHORITY.defaultCitation,
    verifiedOn: DV_TABLE_AUTHORITY.verifiedOn,
  };
}

/** Label suffix for a DV basis (e.g. unit 'mcg' + basis 'DFE' → "mcg DFE"). */
export function basisLabel(basis: DVBasis): string {
  return basis === 'alpha-tocopherol' ? 'α-tocopherol' : basis;
}

export const DV_TABLE: DVEntry[] = [
  // ─── VITAMINS ──────────────────────────────────────────────
  { group: 'vitamin', displayName: 'Vitamin A', dv: 900, unit: 'mcg', basis: 'RAE', keywords: ['vitamin a', 'retinyl', 'retinol', 'beta-carotene', 'beta carotene'] },
  { group: 'vitamin', displayName: 'Vitamin C', dv: 90, unit: 'mg', keywords: ['vitamin c', 'ascorbic acid', 'sodium ascorbate', 'calcium ascorbate'] },
  { group: 'vitamin', displayName: 'Vitamin D', dv: 20, unit: 'mcg', keywords: ['vitamin d', 'cholecalciferol', 'ergocalciferol', 'vitamin d3', 'vitamin d2'] },
  { group: 'vitamin', displayName: 'Vitamin E', dv: 15, unit: 'mg', basis: 'alpha-tocopherol', keywords: ['vitamin e', 'tocopher', 'tocotrien'] },
  { group: 'vitamin', displayName: 'Vitamin K', dv: 120, unit: 'mcg', keywords: ['vitamin k', 'phytonadione', 'menaquinone', 'mk-4', 'mk-7', 'menaq'] },
  { group: 'vitamin', displayName: 'Thiamin', dv: 1.2, unit: 'mg', keywords: ['thiamin', 'vitamin b1', 'b-1'] },
  { group: 'vitamin', displayName: 'Riboflavin', dv: 1.3, unit: 'mg', keywords: ['riboflavin', 'vitamin b2', 'b-2'] },
  { group: 'vitamin', displayName: 'Niacin', dv: 16, unit: 'mg', basis: 'NE', keywords: ['niacin', 'niacinamide', 'nicotinamide', 'vitamin b3', 'b-3'] },
  { group: 'vitamin', displayName: 'Vitamin B6', dv: 1.7, unit: 'mg', keywords: ['vitamin b6', 'b-6', 'pyridox', 'p-5-p', 'p5p'] },
  { group: 'vitamin', displayName: 'Folate', dv: 400, unit: 'mcg', basis: 'DFE', keywords: ['folate', 'folic acid', 'methylfolate', '5-mthf', 'vitamin b9'] },
  { group: 'vitamin', displayName: 'Vitamin B12', dv: 2.4, unit: 'mcg', keywords: ['vitamin b12', 'b-12', 'cobalamin', 'cyanocobalamin', 'methylcobalamin'] },
  { group: 'vitamin', displayName: 'Biotin', dv: 30, unit: 'mcg', keywords: ['biotin', 'vitamin b7', 'b-7', 'vitamin h'] },
  { group: 'vitamin', displayName: 'Pantothenic Acid', dv: 5, unit: 'mg', keywords: ['pantothen', 'vitamin b5', 'b-5'] },
  { group: 'vitamin', displayName: 'Choline', dv: 550, unit: 'mg', keywords: ['choline bitartrate', 'choline citrate', 'phosphatidylcholine', 'alpha-gpc', 'choline'] },

  // ─── MINERALS ──────────────────────────────────────────────
  // elementalFactor approximates mass fraction of elemental mineral in the named salt/chelate form.
  { group: 'mineral', displayName: 'Calcium', dv: 1300, unit: 'mg', keywords: ['calcium carbonate'], elementalFactor: 0.40 },
  { group: 'mineral', displayName: 'Calcium', dv: 1300, unit: 'mg', keywords: ['calcium citrate'], elementalFactor: 0.21 },
  { group: 'mineral', displayName: 'Calcium', dv: 1300, unit: 'mg', keywords: ['calcium'], elementalFactor: 0.25 },
  { group: 'mineral', displayName: 'Iron', dv: 18, unit: 'mg', keywords: ['ferrous sulfate'], elementalFactor: 0.30 },
  { group: 'mineral', displayName: 'Iron', dv: 18, unit: 'mg', keywords: ['ferrous bisglycinate', 'ferrochel', 'iron bisglycinate'], elementalFactor: 0.20 },
  { group: 'mineral', displayName: 'Iron', dv: 18, unit: 'mg', keywords: ['iron', 'ferrous'], elementalFactor: 0.20 },
  { group: 'mineral', displayName: 'Phosphorus', dv: 1250, unit: 'mg', keywords: ['phosphorus', 'phosphate'] },
  { group: 'mineral', displayName: 'Iodine', dv: 150, unit: 'mcg', keywords: ['iodine', 'potassium iodide', 'kelp'], elementalFactor: 0.76 },
  { group: 'mineral', displayName: 'Magnesium', dv: 420, unit: 'mg', keywords: ['magnesium oxide'], elementalFactor: 0.60 },
  { group: 'mineral', displayName: 'Magnesium', dv: 420, unit: 'mg', keywords: ['magnesium glycinate', 'magnesium bisglycinate'], elementalFactor: 0.14 },
  { group: 'mineral', displayName: 'Magnesium', dv: 420, unit: 'mg', keywords: ['magnesium citrate'], elementalFactor: 0.16 },
  { group: 'mineral', displayName: 'Magnesium', dv: 420, unit: 'mg', keywords: ['magnesium'], elementalFactor: 0.16 },
  { group: 'mineral', displayName: 'Zinc', dv: 11, unit: 'mg', keywords: ['zinc picolinate'], elementalFactor: 0.20 },
  { group: 'mineral', displayName: 'Zinc', dv: 11, unit: 'mg', keywords: ['zinc gluconate'], elementalFactor: 0.14 },
  { group: 'mineral', displayName: 'Zinc', dv: 11, unit: 'mg', keywords: ['zinc'], elementalFactor: 0.20 },
  { group: 'mineral', displayName: 'Selenium', dv: 55, unit: 'mcg', keywords: ['selenomethionine', 'selenium'], elementalFactor: 0.40 },
  { group: 'mineral', displayName: 'Copper', dv: 0.9, unit: 'mg', keywords: ['copper gluconate'], elementalFactor: 0.14 },
  { group: 'mineral', displayName: 'Copper', dv: 0.9, unit: 'mg', keywords: ['copper'], elementalFactor: 0.20 },
  { group: 'mineral', displayName: 'Manganese', dv: 2.3, unit: 'mg', keywords: ['manganese'], elementalFactor: 0.32 },
  { group: 'mineral', displayName: 'Chromium', dv: 35, unit: 'mcg', keywords: ['chromium picolinate'], elementalFactor: 0.12 },
  { group: 'mineral', displayName: 'Chromium', dv: 35, unit: 'mcg', keywords: ['chromium'], elementalFactor: 0.20 },
  { group: 'mineral', displayName: 'Molybdenum', dv: 45, unit: 'mcg', keywords: ['molybdenum'] },
  { group: 'mineral', displayName: 'Sodium', dv: 2300, unit: 'mg', citation: '21 CFR 101.9(c)(9)', keywords: ['sodium chloride', 'sodium'], elementalFactor: 0.40 },
  { group: 'mineral', displayName: 'Potassium', dv: 4700, unit: 'mg', keywords: ['potassium chloride', 'potassium citrate', 'potassium'], elementalFactor: 0.38 },
  // Chloride MUST follow Sodium/Potassium so 'sodium chloride'/'potassium chloride'
  // match their nutrient-of-interest first (findDVEntry returns first match).
  { group: 'mineral', displayName: 'Chloride', dv: 2300, unit: 'mg', keywords: ['chloride'], elementalFactor: 0.60 },
];

// ============================================================
// CLASSIFICATION
// ============================================================

export type ActiveGroup =
  | 'vitamin'
  | 'mineral'
  | 'amino'
  | 'herbal'
  | 'mushroom'
  | 'probiotic'
  | 'fatty-acid'
  | 'specialty'
  | 'excipient';

/**
 * Classify an ingredient into a label section.
 * Uses the ingredient's `category` field (from the DB) as primary signal.
 */
export function classifyActive(categoryOrName: string | undefined, name: string): ActiveGroup {
  const cat = (categoryOrName || '').toLowerCase();
  const n = name.toLowerCase();
  if (cat.includes('excipient')) return 'excipient';
  if (cat.includes('vitamin')) return 'vitamin';
  if (cat.includes('mineral')) return 'mineral';
  if (cat.includes('amino')) return 'amino';
  if (cat.includes('probiotic')) return 'probiotic';
  if (cat.includes('mushroom')) return 'mushroom';
  if (cat.includes('herb') || cat.includes('botanical')) return 'herbal';
  if (cat.includes('omega') || cat.includes('fatty') || cat.includes('oil')) return 'fatty-acid';
  if (cat.includes('enzyme') || cat.includes('specialty') || cat.includes('compound')) return 'specialty';
  // Fall back to name-based guesses
  if (/vitamin|ascorb|tocopher|thiamin|riboflav|niacin|biotin|folate|cobalamin|pantothen|choline|cholecalcif|phytonad|menaquinone/i.test(n)) return 'vitamin';
  if (/calcium|iron|magnesium|zinc|selen|copper|mangan|chrom|molyb|iodine|potass|sodium|phosphor|ferrous/i.test(n)) return 'mineral';
  if (/(^|\s|-)l-|glycine|taurine|creatine|carnitine|glutamine|tryptophan|arginine|lysine|citrulline|theanine|cysteine|beta-alanine|ornithine/i.test(n)) return 'amino';
  if (/lactobacill|bifido|saccharo|bacillus|cfu/i.test(n)) return 'probiotic';
  if (/mushroom|reishi|lion's mane|cordyc|chaga|turkey tail|maitake|shiitake/i.test(n)) return 'mushroom';
  if (/extract|root|leaf|bark|ashwagandh|rhodiola|ginkgo|ginseng|turmeric|curcumin|milk thistle|saw palmetto|elderberry|echinacea/i.test(n)) return 'herbal';
  if (/omega|fish oil|krill|algae|mct|cla|gla|dha|epa/i.test(n)) return 'fatty-acid';
  return 'specialty';
}

/** True when ingredient is a formulation aid (MCC, magnesium stearate, silica, etc.). */
export function isExcipient(categoryOrName: string | undefined): boolean {
  return (categoryOrName || '').toLowerCase().includes('excipient');
}

// ============================================================
// DV LOOKUP
// ============================================================

/**
 * Find the first DV entry whose keyword matches the ingredient name at
 * a word boundary.
 *
 * Round 11 Phase 3 post-A.5 follow-up (2026-05-17): prior implementation
 * used String.prototype.includes() substring matching, which caused
 * "Vitamin B1" (Thiamin keyword) to substring-match "Vitamin B12 (Cyano-
 * cobalamin 1% on Mannitol)" and steal the B12 row in the SFP. Switched
 * to keywordMatch() (lib/keywordMatch.ts) which requires word-start
 * boundary always + word-end boundary for digit-suffixed or ≤3-char
 * keywords — solves the B1→B12 collision while preserving legitimate
 * prefix matches like "pyridox" → "pyridoxal-5-phosphate".
 *
 * More specific entries should appear earlier in DV_TABLE for cases
 * where a name is ambiguous (e.g., "Vitamin B Complex" — order-
 * dependent fallback).
 */
export function findDVEntry(name: string): DVEntry | null {
  const n = name.toLowerCase();
  for (const e of DV_TABLE) {
    if (e.keywords.some(k => keywordMatch(n, k))) return e;
  }
  return null;
}

// ============================================================
// SUPPLEMENT FACTS COMPUTATION
// ============================================================

/**
 * A single row on the Supplement Facts panel.
 */
export interface SupplementFactRow {
  /** Display name for the row (e.g., "Vitamin C (as Ascorbic Acid)"). */
  displayName: string;
  /** Amount per serving in the display unit. NULL = unset/pending serving → renders "—"
   *  (blank-until-real: no fill entered yet, so there is no defined per-serving dose). */
  amount: number | null;
  /** Display unit: mg / mcg / IU / g. */
  unit: string;
  /** Percent Daily Value (0-9999). Null when no DV established → shows "†". */
  percentDV: number | null;
  /** Group used for section placement. */
  group: ActiveGroup;
  /** Source ingredient (name) — for debugging / tooltips. */
  sourceName: string;
  /** Italicized scientific name for herbals (appended inline). */
  scientific?: string;
  /** Parenthetical sub-declaration, e.g. folate (mcg DFE) line + folic acid (mcg)
   *  in parens per 21 CFR 101.9(c)(8)(vii). Rendered as "(N unit name)" after the row. */
  subDeclaration?: { name: string; amount: number; unit: string };
}

/**
 * Uniform-blend floor (mg of PHYSICAL ingredient per serving). Below this, an
 * active cannot be weighed or blended homogeneously by direct addition — it must
 * be supplied as a carrier-loaded / triturated form, or pre-blended by geometric
 * dilution (USP <905> Uniformity of Dosage Units). 1 mg is the conservative
 * industry threshold for direct addition; the catalog's own process guidance
 * ("Pre-blend potent vitamins with carrier … geometric dilution for dose
 * uniformity") encodes the same rule. This is a manufacturability fact, not a
 * labeling rule, so it is independent of potencyFactor and of whether the active
 * carries a Daily Value.
 */
export const BLEND_FLOOR_MG = 1;

/**
 * A flagged active that needs a second look before the formula is manufacturable
 * or correctly labeled. Two distinct failure modes, discriminated by `reason`:
 *
 *  • 'label-rounds-to-zero' — the LABEL amount rounds to 0 despite a non-zero
 *    entered amount (carrier-loaded SKU entered as an active dose, or a
 *    unit/elemental mismatch). e.g. a Vitamin D3 "100,000 IU/g on MCC" SKU
 *    entered as "8 mcg" shows 0 mcg, because 8 mcg of that PRODUCT is ~0.02 mcg
 *    of active.
 *
 *  • 'below-blend-threshold' — the PHYSICAL ingredient mass per serving is below
 *    BLEND_FLOOR_MG, so the dose cannot be uniformly blended by direct addition
 *    regardless of how the label reads. This is the structural net that catches
 *    a carrier-loaded SKU even when its potencyFactor was never set (e.g. a
 *    lichen-D3 SKU entered as "25 mcg" → 0.025 mg of material), and pure micro-
 *    actives that genuinely need a premix (e.g. neat B12 at 2.4 mcg).
 *
 * Surfaced as a workspace advisory OUTSIDE the regulated panel — never rendered
 * on the panel itself, which must stay byte-faithful per 21 CFR 101.36.
 */
export interface NearZeroActiveWarning {
  /** Source ingredient (full catalog name). */
  ingredientName: string;
  /** Label display name (e.g. "Vitamin D"); falls back to the cleaned ingredient name. */
  displayName: string;
  /** Which failure mode tripped the flag. */
  reason: 'label-rounds-to-zero' | 'below-blend-threshold';
  /** Amount the operator entered. */
  enteredAmount: number;
  /** Unit the operator entered (mg / mcg / g …). */
  enteredUnit: string;
  /** The unit this active is expressed in on the label. */
  labelUnit: string;
  /** Carrier-loading factor (<1 ⇒ carrier-loaded SKU — the dominant cause). */
  potencyFactor: number;
  /** Physical ingredient mass per serving, in mg (drives the blend-floor check). */
  physicalMassMg: number;
}

/**
 * The full structured Supplement Facts label data.
 */
export interface SupplementFactsData {
  servingSize: string;
  servingsPerContainer: number | string;
  /** Calories per serving — only shown if ≥5. Null when negligible. */
  caloriesPerServing: number | null;
  /** Standard macro rows shown under Calories (fat/carbs/protein/sodium etc.). */
  macroRows: SupplementFactRow[];
  /** Vitamin + Mineral rows with established DV. */
  vitaminMineralRows: SupplementFactRow[];
  /** Herbal / amino / mushroom / specialty / fatty-acid rows (no DV). */
  otherActivesRows: SupplementFactRow[];
  /** "Other Ingredients" text — excipients only, by descending weight. */
  otherIngredientsStatement: string;
  /** Whether a "†" footnote is needed (any row has percentDV null). */
  needsDaggerFootnote: boolean;
  /** Actives whose label amount rounds to 0 despite a non-zero entry (silent-zero guard). */
  nearZeroActiveWarnings: NearZeroActiveWarning[];
  /** (b)(2) nutrients omitted from the panel because they fell below the 2%-RDI
   *  declarable threshold (21 CFR 101.36(b)(2)(i)) — surfaced as an operator advisory
   *  so the omission is never silent. */
  belowThresholdSuppressed: { displayName: string; amount: number; unit: string; percentDV: number }[];
}

/**
 * Convert an ingredient's quantity (in its original unit) to grams.
 */
function ingredientGrams(ing: Ingredient): number {
  if (isCountUnit(ing.unit)) return 0; // a count (CFU) is not a weight — never enters formula mass
  return ing.qty * (UNIT_TO_GRAMS[ing.unit] || 1);
}

/**
 * Build structured Supplement Facts from the ingredient list.
 *
 * @param ingredients  Active formulation ingredients.
 * @param servingSizeInGrams  Serving size expressed in grams (or ml).
 * @param totalBatchGrams  Sum of all ingredient grams in the batch.
 * @param servingsPerContainer  What appears on the label.
 * @param servingSizeLabel  Free-text label for the serving (e.g. "2 Capsules", "1 Scoop (30g)").
 * @param caloriesPerServing  Raw calories per serving from nutrition rollup.
 * @param macroPerServing  Raw macro grams per serving (total fat, carbs, protein, sugars, sodium).
 */
export function buildSupplementFacts(params: {
  ingredients: Ingredient[];
  /** Active vertical / mode. Drives per-serving scaling: in 'supplements'
   *  mode, ingredient amounts are entered as per-serving doses and pass
   *  through verbatim (identity scale). In any other mode, amounts are
   *  treated as batch totals and scaled by servingSize/totalBatch. */
  mode?: ModeId;
  servingSizeInGrams: number;
  totalBatchGrams: number;
  /** Convention B (supplements): reliable per-serving fill mass in grams from
   *  the operator's fill weight × units (count) or scoop/volume. When > 0,
   *  per-serving = ingredient's % of this mass. Omitted/0 → identity fallback. */
  supplementServingMassG?: number;
  servingsPerContainer: number | string;
  servingSizeLabel: string;
  caloriesPerServing: number;
  macroPerServing: { totalFat: number; totalCarbs: number; protein: number; sodium: number; totalSugars: number };
  /** REGULATION: 21 CFR 101.36(d) — when true, omit the "(as source)" parens in the SFP
   *  because the manufacturer is declaring sources in a separate ingredient statement
   *  (§101.4(g)) instead. Either/or, never both. Default false (sources in the SFP). */
  omitSourceParens?: boolean;
  /** F-3 (supplements): capsules/units per serving. per-serving = entered
   *  per-capsule × this, via perServingAmounts — NO fill-scaling. Unset/0 →
   *  blank-until-real ("—"). Ignored in non-supplement modes (legacy scale). */
  unitsPerServing?: number;
}): SupplementFactsData {
  const { ingredients, mode, servingSizeInGrams, totalBatchGrams, supplementServingMassG, servingsPerContainer, servingSizeLabel,
          caloriesPerServing, macroPerServing, omitSourceParens = false, unitsPerServing } = params;

  // F-3 single source of truth (supplements only): per-serving PHYSICAL mass =
  // entered per-capsule × unitsPerServing, NO fill-scaling, unit-class-aware
  // (mass / count / unsupported). Built once; the dose + blend-floor both derive
  // from it below, so the SFP can never diverge from the perServingMgByName path
  // (F-11). Null when units are unset (< 1) → blank-until-real ("—"). Other modes
  // keep the legacy fill-scaled MaybeValue path untouched (byte-identical F&B).
  const psMap = (mode === 'supplements' && unitsPerServing && unitsPerServing >= 1)
    ? perServingAmounts(ingredients.map(i => ({ name: i.name, qty: i.qty, unit: i.unit })), unitsPerServing)
    : null;

  // Per-serving scaling — routes through the shared helper so the SFP
  // matches the Safety / Determination / NDI / Claims / Stability surfaces.
  // Round 11 Phase 3 post-A.5 follow-up (2026-05-17): prior implementation
  // applied the F&B ratio `servingSizeInGrams / totalBatchGrams` regardless
  // of mode, contradicting the locked-in supplements contract that entered
  // amounts ARE per-serving doses (see supplementMath.test.ts T1A-01 / T1C-01).
  // The mismatch surfaced when operator-side Formula 1+2 testing produced
  // a ~30× per-serving discrepancy between the Safety card (correct) and
  // SFP (wrong). Defaults to identity scale when mode is omitted — preserves
  // backwards compatibility for callers that don't yet thread mode through.
  const scale = mode
    ? computePerServingScale({ mode, servingSizeInGrams, totalBatchGrams, supplementServingMassG })
    : (totalBatchGrams > 0 ? servingSizeInGrams / totalBatchGrams : 0);
  const vitaminMineralRows: SupplementFactRow[] = [];
  const otherActivesRows: SupplementFactRow[] = [];
  const excipientList: { name: string; grams: number }[] = [];
  const nearZeroActiveWarnings: NearZeroActiveWarning[] = [];
  const belowThresholdSuppressed: SupplementFactsData['belowThresholdSuppressed'] = [];
  // Engine MaybeValue for the SFP amount path (blank-until-real → "—"): in supplements
  // recipe-ratio mode an UNSET serving mass (no fill entered) propagates to UNSET doses
  // ("—"), instead of the identity fallback that would render recipe proportions AS doses.
  const recipeRatioMode = mode === 'supplements' && SUPPLEMENT_CONVENTION_B_ENABLED;
  const formulaMassMaybe: MaybeValue<number> = totalBatchGrams > 0 ? real(totalBatchGrams) : UNSET;
  const servingMassMaybe: MaybeValue<number> = recipeRatioMode
    ? (supplementServingMassG && supplementServingMassG > 0 ? real(supplementServingMassG) : UNSET)
    : real(scale * totalBatchGrams); // non-recipe modes (F&B / supp-A): reproduce the scalar `scale`
  // (b)(2) nutrient aggregation — accumulate by nutrient so multiple sources of one
  // nutrient render as ONE summed row (21 CFR 101.36(d)(2)), not one per source. Sums are
  // MaybeValue so an UNSET serving mass propagates to "—". Emitted, CFR-ordered, after loop.
  type NutrientAccum = { dv: DVEntry; sumActive: MaybeValue<number>; sources: { name: string; grams: number }[]; folicAcid: MaybeValue<number> };
  const nutrientAccum = new Map<string, NutrientAccum>();

  for (const ing of ingredients) {
    const cat = ing.foodData?.type === 'industrial' ? ing.foodData.data?.category : undefined;
    const group = classifyActive(cat, ing.name);

    if (group === 'excipient') {
      excipientList.push({ name: ing.name, grams: ingredientGrams(ing) });
      continue;
    }

    // Count-based actives (CFU / probiotics) — a count is NOT a weight: it never
    // enters formula mass or per-serving scaling. Emit the count exactly as
    // entered, no %DV (21 CFR 101.36 — probiotics are declared by colony-forming
    // units). The mass-scaling path below would corrupt it (10 Billion ≠ a mass).
    if (isCountUnit(ing.unit)) {
      otherActivesRows.push({
        displayName: cleanFormName(ing.name),
        amount: ing.qty,
        unit: ing.unit,
        percentDV: null,
        group,
        sourceName: ing.name,
      });
      continue;
    }

    // Apply potencyFactor for carrier-loaded SKUs (Vit D3 100,000 IU/g on MCC = 0.25%
    // active by mass, etc.). Defaults to 1.0. Without this, the label would show the
    // full ingredient mass as if it were all active, drastically overstating %DV.
    const potency = (ing.foodData?.type === 'industrial' && ing.foodData.data?.potencyFactor)
      ? ing.foodData.data.potencyFactor : 1;

    // F-3 / F-10 (supplements): an UNSUPPORTED unit (IU, typo — anything not in
    // the mass table) has UNKNOWN mass. Render the row honestly with NO amount,
    // never the `|| 1` grams-trap fabrication that ingredientGrams would yield
    // (5000 IU → "5000 g"). The entered unit is preserved so the operator can
    // correct it. This is the no-silent-drop path: surfaced, not dropped.
    const psa = psMap?.get(ing.name);
    if (psa && psa.unitClass === 'unsupported') {
      otherActivesRows.push({
        displayName: cleanFormName(ing.name),
        amount: null, unit: psa.unit, percentDV: null, group, sourceName: ing.name,
      });
      continue;
    }

    // Per-serving PHYSICAL mass (mg) — the single source the dose AND the blend-
    // floor both derive from. Supplements: psa.mg (entered per-capsule × units,
    // NO fill-scaling; UNSET when units are unset → blank-until-real "—"). Other
    // modes: the legacy fill-scaled MaybeValue, byte-identical to before. The
    // physical mass is BEFORE potency — a carrier-loaded SKU is mostly carrier by
    // mass, so this (not the active amount) is what the uniform-blend floor checks.
    const physMgMaybe: MaybeValue<number> = mode === 'supplements'
      ? (psa && psa.mg !== null ? real(psa.mg) : UNSET)
      : combine(combine(combine(real(ingredientGrams(ing)), formulaMassMaybe, (i, t) => i / t), servingMassMaybe, (p, s) => p * s), real(1000), (g, f) => g * f);
    const physicalMassMg = isUnset(physMgMaybe) ? 0 : valueOf(physMgMaybe)!;

    // ACTIVE-existence guard + source-attribution grams. Units-INDEPENDENT in
    // supplements mode so a units-unset ingredient still renders ("—") instead of
    // being skipped here; the blank-until-real lives in physMgMaybe, not the guard.
    const gramsPerServing = mode === 'supplements'
      ? ingredientGrams(ing) * potency
      : ingredientGrams(ing) * scale * potency;
    if (gramsPerServing <= 0) continue;

    const dv = findDVEntry(ing.name);

    // Captured per branch, then funneled into a single advisory check below so
    // each ingredient raises at most one flag with the most actionable framing.
    let warnDisplayName: string;
    let warnLabelUnit: string;
    let labelRoundsToZero: boolean;

    if (dv && (group === 'vitamin' || group === 'mineral')) {
      // Express in DV unit. Apply form-specific elementalFactor for mineral salts
      // via the shared resolver (lib/elementalFactors.ts) so the label and the UL
      // safety check never disagree on elemental mass. Same values as the DV
      // table — the ?? dv.elementalFactor keeps any DV-only form working.
      const elemental = resolveElementalFactor(ing.name) ?? dv.elementalFactor ?? 1;
      // REGULATION: 21 CFR 101.9(c)(8)(iv) fn3-7 — source-form equivalence (β-carotene→RAE,
      // folic acid→DFE, tryptophan→NE, all-rac→α-tocopherol). 1.0 when already in basis.
      const equiv = dv.basis ? resolveEquivalenceFactor(ing.name, dv.basis) : 1;
      const toUnit = (mg: number) => dv.unit === 'mcg' ? mg * 1000 : dv.unit === 'g' ? mg / 1000 : mg;
      // Active mass per serving in the DV basis, as MaybeValue. Derived from the
      // ONE per-serving physical mass (physMgMaybe, already in mg — so NO ×1000
      // here; that bridge was the 1000× misbranding surface). potency/elemental/
      // equiv are CONVERSIONS (the factor boundary), applied on top of the
      // physical mass. UNSET physical (units unset) → UNSET → "—".
      const activeMgMaybe = combine(physMgMaybe, real(potency * elemental * equiv), (mg, f) => mg * f);
      const folicMgMaybe = combine(physMgMaybe, real(potency * elemental), (mg, f) => mg * f); // pre-DFE (folic acid mass)
      // REGULATION: 21 CFR 101.36(d)(2) — accumulate by nutrient (displayName+basis); ONE
      // summed row is emitted after the loop, not one row per source ingredient.
      const key = `${dv.displayName}|${dv.basis ?? ''}`;
      const acc = nutrientAccum.get(key) ?? { dv, sumActive: real(0), sources: [], folicAcid: real(0) };
      acc.sumActive = combine(acc.sumActive, activeMgMaybe, (a, b) => a + b);
      acc.sources.push({ name: ing.name, grams: gramsPerServing });
      // (c)(8)(vii) folate parenthetical: only a converted folic-acid source contributes.
      if (dv.basis === 'DFE' && equiv !== 1) acc.folicAcid = combine(acc.folicAcid, folicMgMaybe, (a, b) => a + b);
      nutrientAccum.set(key, acc);
      warnDisplayName = dv.displayName;
      warnLabelUnit = dv.unit;
      labelRoundsToZero = !isUnset(activeMgMaybe) && formatSupplementAmount(toUnit(valueOf(activeMgMaybe)!), dv.unit) === '0';
    } else {
      // No DV — display in mg (or g if >= 1000 mg) with "†". Derived from the ONE
      // per-serving physical mass (physMgMaybe, already mg — no ×1000). UNSET
      // physical (units unset) → "—", not the entered amount.
      const mgMaybe = combine(physMgMaybe, real(potency), (mg, f) => mg * f);
      const mg = isUnset(mgMaybe) ? null : valueOf(mgMaybe)!;
      const displayAmount: number | null = mg === null ? null : (mg >= 1000 ? mg / 1000 : mg);
      const displayUnit = mg !== null && mg >= 1000 ? 'g' : 'mg';
      otherActivesRows.push({
        displayName: cleanFormName(ing.name),
        amount: displayAmount, unit: displayUnit, percentDV: null, group,
        sourceName: ing.name,
      });
      warnDisplayName = cleanFormName(ing.name);
      warnLabelUnit = displayUnit;
      labelRoundsToZero = mg !== null && formatSupplementAmount(mg, displayUnit) === '0';
    }

    // Manufacturability + silent-zero net (advisory only — never touches the
    // regulated panel). At most one flag per ingredient. The structural blend-
    // floor check comes first: it is the physical truth (you cannot uniformly
    // blend a sub-milligram speck) and it fires even when potencyFactor was
    // never set — the gap that let a lichen-D3 "25 mcg" entry render an absurd
    // 0.025 mg of material. The label-rounds-to-zero signal is the fallback for
    // mismatches whose physical mass is fine but whose active rounds away (e.g.
    // a low-elemental mineral salt).
    if (ing.qty > 0) {
      if (physicalMassMg > 0 && physicalMassMg < BLEND_FLOOR_MG) {
        nearZeroActiveWarnings.push({
          ingredientName: ing.name, displayName: warnDisplayName, reason: 'below-blend-threshold',
          enteredAmount: ing.qty, enteredUnit: ing.unit, labelUnit: warnLabelUnit,
          potencyFactor: potency, physicalMassMg,
        });
      } else if (labelRoundsToZero) {
        nearZeroActiveWarnings.push({
          ingredientName: ing.name, displayName: warnDisplayName, reason: 'label-rounds-to-zero',
          enteredAmount: ing.qty, enteredUnit: ing.unit, labelUnit: warnLabelUnit,
          potencyFactor: potency, physicalMassMg,
        });
      }
    }
  }

  // REGULATION: 21 CFR 101.36 — emit aggregated (b)(2) nutrient rows: one per nutrient,
  // CFR declaration order, sources in parens descending by weight, redundant "(as X)"
  // dropped, %DV on the unrounded summed amount.
  const dvOrder = new Map<string, number>();
  DV_TABLE.forEach((e, i) => { if (!dvOrder.has(e.displayName)) dvOrder.set(e.displayName, i); });
  // REGULATION: 21 CFR 101.36(b)(2)(i)(B) — fixed CFR declaration order.
  const accums = [...nutrientAccum.values()].sort(
    (a, b) => (dvOrder.get(a.dv.displayName) ?? 999) - (dvOrder.get(b.dv.displayName) ?? 999),
  );
  for (const acc of accums) {
    const { dv } = acc;
    const unitF = dv.unit === 'mcg' ? 1000 : dv.unit === 'g' ? 0.001 : 1; // mg → display unit
    const amountMaybe = combine(acc.sumActive, real(unitF), (a, f) => a * f);
    // Blank-until-real: UNSET serving mass → null → renders "—" (not entered-amount).
    const amount: number | null = isUnset(amountMaybe) ? null : valueOf(amountMaybe)!;
    // REGULATION: 21 CFR 101.36(b)(2)(iii)(B) — %DV on the unrounded summed amount (null when serving unset).
    const percentDV = (amount !== null && dv.dv > 0) ? (amount / dv.dv) * 100 : null;
    const rowUnit = dv.basis ? `${dv.unit} ${basisLabel(dv.basis)}` : dv.unit;
    // REGULATION: 21 CFR 101.36(d)(2) — sources in parens descending by weight; (d)
    // exception applied ELEMENT-WISE — clean each source name FIRST, then drop a source
    // only when its cleaned name equals the nutrient (so a plain "Riboflavin" drops but a
    // distinct form like "Riboflavin 5-Phosphate" stays), then dedupe.
    const sourceNames = [...new Set(
      acc.sources
        .sort((a, b) => b.grams - a.grams || a.name.localeCompare(b.name))
        .map(s => cleanFormName(s.name))
        .filter(n => n.toLowerCase() !== dv.displayName.toLowerCase()),
    )];
    // REGULATION: 21 CFR 101.36(d) — source-form parens in the SFP ONLY when sources are
    // declared here (default); omitted when the manufacturer moves sources to the ingredient
    // statement (§101.4(g)). Never both — no duplicate dietary-active declaration.
    const displayName = omitSourceParens
      ? dv.displayName
      : dv.displayName + (sourceNames.length ? ` (as ${sourceNames.join(', ')})` : '');
    // REGULATION: 21 CFR 101.36(b)(2)(i) — a (b)(2) ingredient below the declarable
    // threshold (<2% RDI) SHALL NOT be declared. Suppress the row, but record it so the
    // operator gets an advisory (never a silent disappearance).
    if (percentDV !== null && percentDV < 2) {
      // The blend-floor / rounds-to-zero advisory (raised per-ingredient above) is the
      // priority, actionable signal (it carries the "enter product mass" fix). Don't
      // double-advise the same nutrient — only add the below-threshold notice when no
      // blend-floor advisory already covers it.
      if (!nearZeroActiveWarnings.some(w => w.displayName === dv.displayName)) {
        belowThresholdSuppressed.push({ displayName, amount: amount!, unit: rowUnit, percentDV });
      }
      continue;
    }
    const subDeclaration = (!isUnset(acc.folicAcid) && valueOf(acc.folicAcid)! > 0)
      ? { name: 'folic acid', amount: valueOf(acc.folicAcid)! * unitF, unit: dv.unit }
      : undefined;
    vitaminMineralRows.push({
      displayName, amount, unit: rowUnit, percentDV, group: dv.group, sourceName: acc.sources[0].name,
      ...(subDeclaration ? { subDeclaration } : {}),
    });
  }

  // Excipients ordered by descending weight (ingredient statement)
  excipientList.sort((a, b) => b.grams - a.grams);
  const otherIngredientsStatement = excipientList.map(e => cleanFormName(e.name)).join(', ');

  // Macro rows (Total Fat, Total Carb, Protein, Sodium, Total Sugars) shown when ≥ labeling threshold.
  const macroRows: SupplementFactRow[] = [];
  if (macroPerServing.totalFat >= 0.5) {
    macroRows.push({ displayName: 'Total Fat', amount: macroPerServing.totalFat, unit: 'g', percentDV: (macroPerServing.totalFat / 78) * 100, group: 'specialty', sourceName: 'macro' });
  }
  if (macroPerServing.totalCarbs >= 1) {
    macroRows.push({ displayName: 'Total Carbohydrate', amount: macroPerServing.totalCarbs, unit: 'g', percentDV: (macroPerServing.totalCarbs / 275) * 100, group: 'specialty', sourceName: 'macro' });
  }
  if (macroPerServing.totalSugars >= 0.5) {
    macroRows.push({ displayName: '  Total Sugars', amount: macroPerServing.totalSugars, unit: 'g', percentDV: null, group: 'specialty', sourceName: 'macro' });
  }
  if (macroPerServing.protein >= 1) {
    macroRows.push({ displayName: 'Protein', amount: macroPerServing.protein, unit: 'g', percentDV: (macroPerServing.protein / 50) * 100, group: 'specialty', sourceName: 'macro' });
  }
  if (macroPerServing.sodium >= 5) {
    macroRows.push({ displayName: 'Sodium', amount: macroPerServing.sodium, unit: 'mg', percentDV: (macroPerServing.sodium / 2300) * 100, group: 'specialty', sourceName: 'macro' });
  }

  const needsDaggerFootnote = otherActivesRows.some(r => r.percentDV === null);

  return {
    servingSize: servingSizeLabel,
    servingsPerContainer,
    caloriesPerServing: caloriesPerServing >= 5 ? caloriesPerServing : null,
    macroRows,
    vitaminMineralRows,
    otherActivesRows,
    otherIngredientsStatement,
    needsDaggerFootnote,
    nearZeroActiveWarnings,
    belowThresholdSuppressed,
  };
}

/** Format a small mg mass for advisory prose (e.g. 0.025, 2.4, 0.008). */
function formatBlendMass(mg: number): string {
  if (mg >= 1) return `${Number(mg.toFixed(2))} mg`;
  if (mg >= 0.001) return `${Number(mg.toPrecision(2))} mg`;
  return `${Number((mg * 1000).toPrecision(2))} mcg`;
}

/**
 * Compose the operator-facing advisory string for a flagged active. Plain
 * language, actionable, and branched on the failure mode:
 *
 *  • below-blend-threshold + carrier-loaded SKU → "enter product mass, not active"
 *  • below-blend-threshold + pure active        → "use a carrier/triturated form or premix"
 *  • label-rounds-to-zero  + carrier-loaded SKU → same carrier guidance
 *  • label-rounds-to-zero  + pure active        → "verify the amount and unit"
 */
export function formatNearZeroWarning(w: NearZeroActiveWarning): string {
  const name = w.displayName || w.ingredientName;
  const entered = `${Number(w.enteredAmount.toFixed(4))} ${w.enteredUnit}`;
  const isCarrierLoaded = w.potencyFactor > 0 && w.potencyFactor < 1;

  if (w.reason === 'below-blend-threshold') {
    const base = `${name}: that amount is only ${formatBlendMass(w.physicalMassMg)} of physical material per serving (you entered ${entered}) — below the ~${BLEND_FLOOR_MG} mg that can be blended uniformly by direct addition.`;
    if (isCarrierLoaded) {
      const pctNum = w.potencyFactor * 100;
      const pct = pctNum < 1 ? `${Number(pctNum.toPrecision(2))}%` : `${Math.round(pctNum)}%`;
      return `${base} This SKU is carrier-loaded — only ~${pct} of its mass is the active — so enter the product mass that delivers your target dose, not the active amount.`;
    }
    return `${base} Use a carrier-loaded / triturated form of this active, or pre-blend it with a carrier by geometric dilution (USP <905> dose uniformity).`;
  }

  const base = `${name} rounds to 0 ${w.labelUnit} on the label (you entered ${entered}).`;
  if (isCarrierLoaded) {
    const pctNum = w.potencyFactor * 100;
    const pct = pctNum < 1 ? `${Number(pctNum.toPrecision(2))}%` : `${Math.round(pctNum)}%`;
    return `${base} This SKU is carrier-loaded — only ~${pct} of its mass is the active — so that amount of product delivers just a trace. Enter the product mass that delivers your target dose, not the active amount.`;
  }
  return `${base} Verify the entered amount and unit.`;
}

// ============================================================
// HELPERS
// ============================================================

/**
 * Decide whether to append the source form in parentheses.
 * e.g. "Vitamin C (as Ascorbic Acid)" when source name differs from the generic DV name.
 */
function shouldShowSource(ingredientName: string, dvDisplayName: string): boolean {
  const n = ingredientName.toLowerCase();
  const dv = dvDisplayName.toLowerCase();
  // If the ingredient name is just the DV name with maybe a USP/form suffix, skip the "(as ...)".
  if (n.startsWith(dv)) return false;
  return true;
}

/**
 * Trim trailing parenthetical grade/assay info from the ingredient name so the
 * label reads cleanly: "Vitamin C (Ascorbic Acid USP, Fine)" → "Ascorbic Acid".
 */
function cleanFormName(name: string): string {
  // Strip leading "Vitamin X (" → "X" where the parenthesis explains the form
  const parenMatch = name.match(/^(?:Vitamin\s+[A-Z0-9]+)\s*\(([^)]+)\)/i);
  if (parenMatch) {
    // Take the form but strip grade suffixes like "USP", ", Fine", ", 500,000 IU/g"
    return parenMatch[1].replace(/\s*,?\s*(USP|NF|FCC|Fine|Pharma[- ]?Grade|\d[\d,]*\s*IU\/g|mcg|mg)\b.*$/i, '').trim();
  }
  // Otherwise strip trailing parenthetical grade info
  return name.replace(/\s*\((?:USP|NF|FCC|Fine|Pharma[- ]?Grade|crystalline|powder)[^)]*\)\s*$/i, '').trim();
}

/**
 * Format a number for label display.
 * Vitamins/minerals: integer mcg/mg where appropriate; no trailing zeros.
 * Returns the string (no unit — caller appends it).
 */
export function formatSupplementAmount(amount: number | null, unit: string): string {
  if (amount === null) return '—'; // unset/pending serving (blank-until-real)
  if (!isFinite(amount) || amount <= 0) return '0';
  if (unit === 'mcg' || unit === 'IU') {
    // Whole numbers for mcg and IU
    return amount >= 10 ? String(Math.round(amount)) : amount.toFixed(1).replace(/\.0$/, '');
  }
  if (unit === 'mg') {
    if (amount >= 100) return String(Math.round(amount));
    if (amount >= 10) return amount.toFixed(0);
    if (amount >= 1) return amount.toFixed(1).replace(/\.0$/, '');
    return amount.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
  }
  if (unit === 'g') {
    if (amount >= 10) return amount.toFixed(0);
    return amount.toFixed(1).replace(/\.0$/, '');
  }
  return String(Math.round(amount * 100) / 100);
}

/**
 * Format %DV for the label per 21 CFR 101.36(b)(3):
 * <2% → show nothing / "<1%" in edge cases; otherwise rounded to whole number
 * for low values; rounded to nearest 2/5/10 as amount grows.
 * We follow the same rounding as the food panel for simplicity.
 */
// %DV rounding is SECTOR-SPECIFIC (the rule conflation that caused the 100%-vs-99%
// bug, surfaced 2026-06-07):
//   • Dietary supplements (SFP) — 21 CFR 101.36(b)(2)(iii)(C): NEAREST WHOLE PERCENT.
//   • Food (NFP)               — 21 CFR 101.9(c)(8)(iii): increment rounding
//                                (nearest 2% ≤10, 5% ≤50, 10% >50).
// Default is 'supplements' because this function only feeds the Supplement Facts
// panel today; the increment branch preserves the correct behavior for any future
// food caller.
export function formatSupplementDV(pct: number | null, mode: ModeId = 'supplements'): string {
  if (pct === null) return '†';
  if (mode === 'supplements') {
    // REGULATION: 21 CFR 101.36(b)(2)(iii)(C) — SFP %DV nearest whole percent
    if (pct < 1) return '<1%'; // FLAG: confirm SFP sub-1% presentation vs primary source
    return `${Math.round(pct)}%`;
  }
  // REGULATION: 21 CFR 101.9(c)(8)(iii) — food NFP %DV increment rounding (2/5/10)
  if (pct < 1) return '<1%';
  if (pct < 2) return '1%';
  if (pct <= 10) return `${Math.round(pct / 2) * 2}%`;
  if (pct <= 50) return `${Math.round(pct / 5) * 5}%`;
  if (pct <= 999) return `${Math.round(pct / 10) * 10}%`;
  return '>999%';
}
