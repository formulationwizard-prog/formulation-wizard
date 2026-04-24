// ============================================================
// SUPPLEMENT STABILITY / OVERAGE CALCULATOR
// ------------------------------------------------------------
// Computes label-claim-through-expiry overages for dietary
// supplement ingredients. Label claims must remain true at end
// of shelf life — 21 CFR 101.36(b)(3)(iv) — so the amount
// formulated at time=0 must exceed the label claim by the
// predicted degradation loss over the shelf-life period.
//
// Modelled as simple proportional degradation:
//
//   lossPct    = baseAnnualLoss × years × Π(condition modifiers)
//   requiredAt = labelClaim / (1 - lossPct / 100)
//   overagePct = (requiredAt - labelClaim) / labelClaim × 100
//
// Degradation constants are rounded-up industry conservative
// values sourced from USP stability literature, IFOS fish-oil
// reports, probiotic log-linear die-off studies, and CRN
// technical bulletins. They are intentionally cautious — real
// stability data should always override these estimates once
// a brand has accelerated + real-time data of their own.
// ============================================================
import type { Ingredient } from '../types';

// ============================================================
// STABILITY CATEGORIES
// ============================================================

export type StabilityCategory =
  | 'vit-c'                  // Ascorbic acid, ascorbates — heat/moisture/oxygen sensitive
  | 'vit-water-soluble'      // B-vitamins (thiamine, riboflavin, niacin, B6, B12, etc.)
  | 'vit-folate'             // Folic acid and folates — heat + light sensitive
  | 'vit-fat-soluble-stable' // Vitamins D, K — relatively stable
  | 'vit-retinol'            // Preformed vitamin A (palmitate / acetate) — highly light/oxidation sensitive
  | 'vit-carotenoid'         // Beta-carotene, lutein, lycopene — light/oxidation sensitive
  | 'vit-tocopherol'         // Vitamin E — mildly oxidation sensitive
  | 'mineral-stable'         // Inorganic salts, oxides, carbonates, sulfates — essentially stable
  | 'mineral-chelate'        // Glycinates, bisglycinates, picolinates — minor loss
  | 'mineral-organic'        // Citrates, ascorbates, gluconates — small loss
  | 'omega-fatty-acid'       // EPA, DHA, omega-3 oils — oxidation dominated
  | 'probiotic'              // Live organisms — log-linear die-off
  | 'botanical'              // Plant extracts — variable, marker compound sensitive
  | 'mushroom'               // Mushroom extracts — polysaccharide generally stable
  | 'amino-acid'             // Free aminos + creatine — very stable
  | 'enzyme'                 // Catalytic proteins — activity loss over time
  | 'coenzyme'               // CoQ10, PQQ — oxidation sensitive but slow
  | 'fiber-prebiotic'        // Inulin, psyllium, etc. — essentially stable
  | 'other';                 // Fallback category

export interface StabilityProfile {
  /** Baseline annual loss (% of label claim) at ambient, unshielded packaging. */
  baseAnnualLossPct: number;
  lightSensitive: boolean;
  moistureSensitive: boolean;
  oxidationSensitive: boolean;
  /** Human-readable note for UI tooltips / advice. */
  note: string;
}

/**
 * Baseline degradation rates (% per year) for each stability category under
 * ambient storage, unshielded packaging, no nitrogen flush. Condition
 * modifiers are applied on top.
 */
export const STABILITY_PROFILES: Record<StabilityCategory, StabilityProfile> = {
  'vit-c':                  { baseAnnualLossPct: 10, lightSensitive: true,  moistureSensitive: true,  oxidationSensitive: true,  note: 'Ascorbic acid is one of the most labile supplement actives. Moisture, oxygen, and heat all drive loss.' },
  'vit-water-soluble':      { baseAnnualLossPct: 8,  lightSensitive: true,  moistureSensitive: true,  oxidationSensitive: false, note: 'Thiamine (B1) is the most moisture-labile of the B-vitamins; riboflavin (B2) and B12 are light-sensitive. Plan for moderate loss.' },
  'vit-folate':             { baseAnnualLossPct: 8,  lightSensitive: true,  moistureSensitive: true,  oxidationSensitive: true,  note: 'Folic acid is sensitive to heat, light, and oxidation. Methylfolate is even more labile.' },
  'vit-fat-soluble-stable': { baseAnnualLossPct: 5,  lightSensitive: true,  moistureSensitive: false, oxidationSensitive: true,  note: 'D3 and K2 are relatively stable when protected from light and oxygen.' },
  'vit-retinol':            { baseAnnualLossPct: 20, lightSensitive: true,  moistureSensitive: false, oxidationSensitive: true,  note: 'Preformed retinol degrades quickly without antioxidants and amber packaging. Consider beta-carotene for bulk vitamin A activity.' },
  'vit-carotenoid':         { baseAnnualLossPct: 12, lightSensitive: true,  moistureSensitive: false, oxidationSensitive: true,  note: 'Beta-carotene, lutein, lycopene are all light- and oxygen-sensitive. Beadlet forms with antioxidants extend stability.' },
  'vit-tocopherol':         { baseAnnualLossPct: 5,  lightSensitive: false, moistureSensitive: false, oxidationSensitive: true,  note: 'Vitamin E is an antioxidant, but it oxidizes to tocopherylquinone slowly. Mild loss.' },
  'mineral-stable':         { baseAnnualLossPct: 1,  lightSensitive: false, moistureSensitive: false, oxidationSensitive: false, note: 'Inorganic mineral forms (carbonates, oxides, sulfates) are essentially stable through shelf life.' },
  'mineral-chelate':        { baseAnnualLossPct: 3,  lightSensitive: false, moistureSensitive: true,  oxidationSensitive: false, note: 'Amino-acid chelates are slightly hygroscopic and can release free metal over time. Minor loss.' },
  'mineral-organic':        { baseAnnualLossPct: 4,  lightSensitive: false, moistureSensitive: true,  oxidationSensitive: false, note: 'Citrates, gluconates, and organic mineral salts have slightly higher moisture pickup than inorganic forms.' },
  'omega-fatty-acid':       { baseAnnualLossPct: 15, lightSensitive: true,  moistureSensitive: false, oxidationSensitive: true,  note: 'Fish, krill, and algae oils oxidize rapidly. Amber packaging + nitrogen flush + tocopherol antioxidants are essential.' },
  'probiotic':              { baseAnnualLossPct: 40, lightSensitive: false, moistureSensitive: true,  oxidationSensitive: true,  note: 'Live organisms die off log-linearly. Plan for ~50% CFU loss per year ambient; much less with refrigeration.' },
  'botanical':              { baseAnnualLossPct: 8,  lightSensitive: true,  moistureSensitive: true,  oxidationSensitive: true,  note: 'Marker compound loss varies by extract. Standardized extracts lose less than whole-herb powders.' },
  'mushroom':               { baseAnnualLossPct: 6,  lightSensitive: false, moistureSensitive: true,  oxidationSensitive: false, note: 'Beta-glucan content is generally stable; moisture uptake is the main risk.' },
  'amino-acid':             { baseAnnualLossPct: 2,  lightSensitive: false, moistureSensitive: true,  oxidationSensitive: false, note: 'Free amino acids and creatine monohydrate are very stable. Hygroscopy is the main concern.' },
  'enzyme':                 { baseAnnualLossPct: 15, lightSensitive: false, moistureSensitive: true,  oxidationSensitive: false, note: 'Proteolytic and digestive enzymes lose catalytic activity over time. Label as activity units, not mass.' },
  'coenzyme':               { baseAnnualLossPct: 8,  lightSensitive: true,  moistureSensitive: false, oxidationSensitive: true,  note: 'CoQ10 (ubiquinone and ubiquinol) oxidize slowly. Softgel-encapsulated with tocopherol is most stable.' },
  'fiber-prebiotic':        { baseAnnualLossPct: 2,  lightSensitive: false, moistureSensitive: true,  oxidationSensitive: false, note: 'Inulin, psyllium, and soluble fibers are stable; moisture uptake is the risk.' },
  'other':                  { baseAnnualLossPct: 5,  lightSensitive: false, moistureSensitive: false, oxidationSensitive: false, note: 'Unknown stability profile — real stability data should replace this estimate.' },
};

// ============================================================
// CONDITION MODIFIERS
// ============================================================

export type StorageCondition = 'ambient' | 'refrigerated' | 'frozen';

export interface StabilityConditions {
  shelfLifeMonths: number;       // 12, 18, 24, 36, 60 typical
  storage: StorageCondition;
  amberPackaging: boolean;       // amber bottle or opaque pouch
  desiccant: boolean;            // silica gel or molecular sieve included
  nitrogenFlush: boolean;        // headspace displacement with N₂
  tocopherolAntioxidant: boolean; // mixed tocopherols or rosemary extract added
}

/**
 * Multiplicative modifier on base annual loss rate, per condition combination.
 * All modifiers multiply together. A value of 1.0 is a no-op.
 */
function conditionMultiplier(profile: StabilityProfile, cond: StabilityConditions): number {
  let m = 1.0;

  // Storage
  if (cond.storage === 'refrigerated') m *= 0.5;
  if (cond.storage === 'frozen') m *= 0.25;

  // Amber / opaque packaging — protects light-sensitive ingredients
  if (cond.amberPackaging && profile.lightSensitive) m *= 0.7;

  // Desiccant — protects moisture-sensitive ingredients
  if (cond.desiccant && profile.moistureSensitive) m *= 0.8;

  // Nitrogen flush — protects oxidation-sensitive ingredients
  if (cond.nitrogenFlush && profile.oxidationSensitive) m *= 0.6;

  // Added tocopherol antioxidant — additional protection for oxidation-sensitive
  if (cond.tocopherolAntioxidant && profile.oxidationSensitive) m *= 0.8;

  return m;
}

// ============================================================
// CLASSIFICATION
// ============================================================

/**
 * Classify an ingredient into a stability category, using the name + category.
 * Longer / more specific keywords are checked first so "magnesium glycinate"
 * hits mineral-chelate rather than falling through to mineral-stable.
 */
export function classifyStability(ingredientName: string, dbCategory: string | undefined): StabilityCategory {
  const n = ingredientName.toLowerCase();
  const c = (dbCategory || '').toLowerCase();

  // Excipients (fillers, etc.) — skip entirely
  if (c.includes('excipient')) return 'other';

  // ─── Vitamin-specific (check specific forms first) ─────────────────────
  if (/ascorbic acid|sodium ascorbate|calcium ascorbate|vitamin c\b/.test(n)) return 'vit-c';
  if (/(vitamin a|retinyl|retinol)/.test(n)) return 'vit-retinol';
  if (/(beta-carotene|beta carotene|carotenoid|lutein|lycopene|zeaxanthin)/.test(n)) return 'vit-carotenoid';
  if (/(tocopher|vitamin e\b|tocotrien)/.test(n)) return 'vit-tocopherol';
  if (/(cholecalciferol|ergocalciferol|vitamin d)/.test(n)) return 'vit-fat-soluble-stable';
  if (/(menaquinone|vitamin k|phytonadione|mk-7|mk-4)/.test(n)) return 'vit-fat-soluble-stable';
  if (/(folic acid|methylfolate|5-mthf|folate)/.test(n)) return 'vit-folate';
  if (/(thiamin|riboflavin|niacin|pantothenic|biotin|cobalamin|pyridox|p-5-p|p5p|vitamin b|choline)/.test(n)) return 'vit-water-soluble';

  // ─── Minerals ──────────────────────────────────────────────────────────
  if (/(glycinate|bisglycinate|picolinate|chelate|ferrochel|taacs)/.test(n)) return 'mineral-chelate';
  if (/(citrate|gluconate|ascorbate|lactate|malate|fumarate)/.test(n) &&
      /(calcium|iron|magnesium|zinc|selen|copper|chrom|potassium|sodium|manganese)/.test(n)) {
    return 'mineral-organic';
  }
  if (c.includes('mineral') || /(calcium|iron|magnesium|zinc|selen|copper|chrom|molyb|iodine|potassium|boron|fluoride|manganese)/.test(n)) {
    return 'mineral-stable';
  }

  // ─── Omega / fatty acids ───────────────────────────────────────────────
  if (/(fish oil|krill oil|algae oil|omega-3|omega 3|epa|dha|mct|flax|evening primrose|hemp seed oil|borage)/.test(n)) return 'omega-fatty-acid';

  // ─── Probiotics ────────────────────────────────────────────────────────
  if (c.includes('probiotic') || /(lactobacill|bifido|saccharo|bacillus|streptococcus|enterococcus|cfu)/.test(n)) return 'probiotic';

  // ─── Mushrooms ─────────────────────────────────────────────────────────
  if (c.includes('mushroom') || /(reishi|lion's mane|lions mane|cordyc|chaga|turkey tail|maitake|shiitake|ganoderma|hericium|inonotus)/.test(n)) return 'mushroom';

  // ─── Aminos / creatine ─────────────────────────────────────────────────
  if (c.includes('amino') || /(creatine|taurine|carnitine|glutamine|tryptophan|arginine|lysine|citrulline|theanine|cysteine|beta-alanine|ornithine|glycine|pea protein|whey|casein|collagen)/.test(n)) return 'amino-acid';

  // ─── Coenzymes ─────────────────────────────────────────────────────────
  if (/(coenzyme q10|coq10|ubiquinone|ubiquinol|pqq|nadh)/.test(n)) return 'coenzyme';

  // ─── Enzymes ───────────────────────────────────────────────────────────
  if (c.includes('enzyme') || /(bromelain|papain|lipase|protease|amylase|cellulase|lactase)/.test(n)) return 'enzyme';

  // ─── Fiber / prebiotics ────────────────────────────────────────────────
  if (/(inulin|psyllium|fiber|prebiotic|fos|gos)/.test(n)) return 'fiber-prebiotic';

  // ─── Botanicals / herbals ──────────────────────────────────────────────
  if (c.includes('botanical') || c.includes('herb') || /(extract|root|leaf|bark|fruit|rhizome|ashwagandh|rhodiola|ginkgo|ginseng|turmeric|curcumin|milk thistle|saw palmetto|elderberry|echinacea|ginger|green tea|holy basil|maca|spirulina|chlorella)/.test(n)) return 'botanical';

  return 'other';
}

// ============================================================
// OVERAGE CALCULATION
// ============================================================

export interface OverageRow {
  ingredientName: string;
  category: StabilityCategory;
  /** Label claim = the per-serving amount the user has formulated (assumed target). */
  labelClaimMg: number;
  /** Predicted end-of-shelf-life amount at the current formulation. */
  predictedEOSLMg: number;
  /** Percent loss over the shelf-life period. */
  lossPct: number;
  /** Recommended amount to formulate at to keep the label claim true through EOSL. */
  requiredFormulateAtMg: number;
  /** How much more than the current label claim the formulator would need. */
  overagePct: number;
  /** Human-readable advice for this ingredient. */
  note: string;
}

export interface OverageSummary {
  /** Highest-loss ingredient — the bottleneck on shelf life. */
  bottleneck: OverageRow | null;
  /** Worst-case loss across all ingredients (%). */
  worstLossPct: number;
  /** Rows sorted descending by loss %. */
  rows: OverageRow[];
}

/**
 * Compute overages for every ingredient in the formulation.
 *
 * @param ingredients          All formulation ingredients.
 * @param perServingMgByName   Map of ingredient name → mg per serving.
 * @param conditions           Shelf life, storage, packaging modifiers.
 */
export function computeOverages(
  ingredients: Ingredient[],
  perServingMgByName: Map<string, number>,
  conditions: StabilityConditions
): OverageSummary {
  const years = Math.max(0.1, conditions.shelfLifeMonths / 12);
  const rows: OverageRow[] = [];

  for (const ing of ingredients) {
    const dbCat = ing.foodData?.type === 'industrial' ? ing.foodData.data?.category : undefined;
    const category = classifyStability(ing.name, dbCat);
    if (category === 'other' && dbCat === undefined) continue; // user-entered with no match — skip

    const profile = STABILITY_PROFILES[category];
    const labelClaimMg = perServingMgByName.get(ing.name) ?? 0;
    if (labelClaimMg <= 0) continue;
    if (dbCat && dbCat.toLowerCase().includes('excipient')) continue; // excipients don't need overage

    const modifier = conditionMultiplier(profile, conditions);
    const rawLossPct = Math.min(95, profile.baseAnnualLossPct * years * modifier);
    const predictedEOSLMg = labelClaimMg * (1 - rawLossPct / 100);
    const requiredFormulateAtMg = labelClaimMg / (1 - rawLossPct / 100);
    const overagePct = ((requiredFormulateAtMg - labelClaimMg) / labelClaimMg) * 100;

    rows.push({
      ingredientName: ing.name,
      category,
      labelClaimMg,
      predictedEOSLMg,
      lossPct: rawLossPct,
      requiredFormulateAtMg,
      overagePct,
      note: profile.note,
    });
  }

  rows.sort((a, b) => b.lossPct - a.lossPct);
  const bottleneck = rows[0] ?? null;
  const worstLossPct = bottleneck?.lossPct ?? 0;

  return { bottleneck, worstLossPct, rows };
}

// ============================================================
// DISPLAY HELPERS
// ============================================================

/**
 * Format an amount in mg, choosing a natural unit (mcg / mg / g) by magnitude.
 */
export function formatDose(mg: number): string {
  if (mg < 1) return `${(mg * 1000).toFixed(0)} mcg`;
  if (mg < 10) return `${mg.toFixed(1)} mg`;
  if (mg < 1000) return `${Math.round(mg)} mg`;
  return `${(mg / 1000).toFixed(1)} g`;
}

/**
 * Human-readable label for a stability category (UI tooltip / breakdown).
 */
export const CATEGORY_LABEL: Record<StabilityCategory, string> = {
  'vit-c':                  'Vitamin C',
  'vit-water-soluble':      'Water-soluble vitamin',
  'vit-folate':             'Folate',
  'vit-fat-soluble-stable': 'Fat-soluble vitamin (stable)',
  'vit-retinol':            'Preformed vitamin A',
  'vit-carotenoid':         'Carotenoid',
  'vit-tocopherol':         'Vitamin E',
  'mineral-stable':         'Mineral (inorganic)',
  'mineral-chelate':        'Mineral chelate',
  'mineral-organic':        'Mineral (organic salt)',
  'omega-fatty-acid':       'Omega fatty acid',
  'probiotic':              'Probiotic',
  'botanical':              'Botanical extract',
  'mushroom':               'Mushroom extract',
  'amino-acid':             'Amino acid / protein',
  'enzyme':                 'Enzyme',
  'coenzyme':               'Coenzyme',
  'fiber-prebiotic':        'Fiber / prebiotic',
  'other':                  'Other',
};
