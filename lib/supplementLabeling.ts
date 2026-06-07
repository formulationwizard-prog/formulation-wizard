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
import { UNIT_TO_GRAMS } from './utils';
import { computePerServingScale } from './supplementMath';
import { keywordMatch } from './keywordMatch';
import { resolveElementalFactor } from './elementalFactors';

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

export interface DVEntry {
  displayName: string;
  dv: number;
  unit: 'mg' | 'mcg' | 'IU' | 'g';
  keywords: string[];
  /** Rough % of ingredient mass that is the active (0-1). Defaults 1.0. */
  elementalFactor?: number;
  /** Latin / scientific name appended in italics on the label. */
  scientific?: string;
  /** Subcategory for panel ordering. */
  group: 'vitamin' | 'mineral';
}

export const DV_TABLE: DVEntry[] = [
  // ─── VITAMINS ──────────────────────────────────────────────
  { group: 'vitamin', displayName: 'Vitamin A', dv: 900, unit: 'mcg', keywords: ['vitamin a', 'retinyl', 'retinol', 'beta-carotene', 'beta carotene'] },
  { group: 'vitamin', displayName: 'Vitamin C', dv: 90, unit: 'mg', keywords: ['vitamin c', 'ascorbic acid', 'sodium ascorbate', 'calcium ascorbate'] },
  { group: 'vitamin', displayName: 'Vitamin D', dv: 20, unit: 'mcg', keywords: ['vitamin d', 'cholecalciferol', 'ergocalciferol', 'vitamin d3', 'vitamin d2'] },
  { group: 'vitamin', displayName: 'Vitamin E', dv: 15, unit: 'mg', keywords: ['vitamin e', 'tocopher', 'tocotrien'] },
  { group: 'vitamin', displayName: 'Vitamin K', dv: 120, unit: 'mcg', keywords: ['vitamin k', 'phytonadione', 'menaquinone', 'mk-4', 'mk-7', 'menaq'] },
  { group: 'vitamin', displayName: 'Thiamin', dv: 1.2, unit: 'mg', keywords: ['thiamin', 'vitamin b1', 'b-1'] },
  { group: 'vitamin', displayName: 'Riboflavin', dv: 1.3, unit: 'mg', keywords: ['riboflavin', 'vitamin b2', 'b-2'] },
  { group: 'vitamin', displayName: 'Niacin', dv: 16, unit: 'mg', keywords: ['niacin', 'niacinamide', 'nicotinamide', 'vitamin b3', 'b-3'] },
  { group: 'vitamin', displayName: 'Vitamin B6', dv: 1.7, unit: 'mg', keywords: ['vitamin b6', 'b-6', 'pyridox', 'p-5-p', 'p5p'] },
  { group: 'vitamin', displayName: 'Folate', dv: 400, unit: 'mcg', keywords: ['folate', 'folic acid', 'methylfolate', '5-mthf', 'vitamin b9'] },
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
  { group: 'mineral', displayName: 'Sodium', dv: 2300, unit: 'mg', keywords: ['sodium chloride', 'sodium'], elementalFactor: 0.40 },
  { group: 'mineral', displayName: 'Potassium', dv: 4700, unit: 'mg', keywords: ['potassium chloride', 'potassium citrate', 'potassium'], elementalFactor: 0.38 },
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
  /** Amount per serving, already converted to the display unit. */
  amount: number;
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
}

/**
 * Convert an ingredient's quantity (in its original unit) to grams.
 */
function ingredientGrams(ing: Ingredient): number {
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
}): SupplementFactsData {
  const { ingredients, mode, servingSizeInGrams, totalBatchGrams, supplementServingMassG, servingsPerContainer, servingSizeLabel,
          caloriesPerServing, macroPerServing } = params;

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

  for (const ing of ingredients) {
    const cat = ing.foodData?.type === 'industrial' ? ing.foodData.data?.category : undefined;
    const group = classifyActive(cat, ing.name);

    if (group === 'excipient') {
      excipientList.push({ name: ing.name, grams: ingredientGrams(ing) });
      continue;
    }

    // Apply potencyFactor for carrier-loaded SKUs (Vit D3 100,000 IU/g on MCC = 0.25%
    // active by mass, etc.). Defaults to 1.0. Without this, the label would show the
    // full ingredient mass as if it were all active, drastically overstating %DV.
    const potency = (ing.foodData?.type === 'industrial' && ing.foodData.data?.potencyFactor)
      ? ing.foodData.data.potencyFactor : 1;

    // PHYSICAL ingredient mass per serving, in mg — computed BEFORE potency.
    // This is the mass actually weighed into the blend (a carrier-loaded SKU is
    // mostly carrier by mass), so it — not the active amount — is what the
    // uniform-blend floor must be measured against.
    const physicalMassMg = ingredientGrams(ing) * scale * 1000;

    // Amount of ACTIVE per serving, in grams (or ml treated as 1:1)
    const gramsPerServing = ingredientGrams(ing) * scale * potency;
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
      const activeMg = gramsPerServing * 1000 * (resolveElementalFactor(ing.name) ?? dv.elementalFactor ?? 1);
      let amount: number;
      if (dv.unit === 'mg') amount = activeMg;
      else if (dv.unit === 'mcg') amount = activeMg * 1000;
      else if (dv.unit === 'g') amount = activeMg / 1000;
      else amount = activeMg; // IU — caller should provide IU-dosed ingredients
      const percentDV = dv.dv > 0 ? (amount / dv.dv) * 100 : null;
      vitaminMineralRows.push({
        displayName: dv.displayName + (shouldShowSource(ing.name, dv.displayName) ? ` (as ${cleanFormName(ing.name)})` : ''),
        amount, unit: dv.unit, percentDV, group,
        sourceName: ing.name,
      });
      warnDisplayName = dv.displayName;
      warnLabelUnit = dv.unit;
      labelRoundsToZero = formatSupplementAmount(amount, dv.unit) === '0';
    } else {
      // No DV — display in mg (or g if >= 1000 mg) with "†"
      const mgPerServing = gramsPerServing * 1000;
      const displayAmount = mgPerServing >= 1000 ? mgPerServing / 1000 : mgPerServing;
      const displayUnit = mgPerServing >= 1000 ? 'g' : 'mg';
      otherActivesRows.push({
        displayName: cleanFormName(ing.name),
        amount: displayAmount, unit: displayUnit, percentDV: null, group,
        sourceName: ing.name,
      });
      warnDisplayName = cleanFormName(ing.name);
      warnLabelUnit = displayUnit;
      labelRoundsToZero = formatSupplementAmount(displayAmount, displayUnit) === '0';
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
export function formatSupplementAmount(amount: number, unit: string): string {
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
export function formatSupplementDV(pct: number | null): string {
  if (pct === null) return '†';
  if (pct < 1) return '<1%';
  if (pct < 2) return '1%';
  if (pct <= 10) return `${Math.round(pct / 2) * 2}%`;
  if (pct <= 50) return `${Math.round(pct / 5) * 5}%`;
  if (pct <= 999) return `${Math.round(pct / 10) * 10}%`;
  return '>999%';
}
