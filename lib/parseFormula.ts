// ============================================================
// Bulk-paste formula parser
// ------------------------------------------------------------
// Takes a chunk of pasted text and turns it into a list of
// ParsedRow records — each one is a candidate ingredient line
// with the best match (if any) against the industrial DB.
//
// Accepts these formats transparently:
//   • Markdown tables (our own doc style)
//   • TSV / Excel / Google Sheets paste
//   • Pipe-separated
//   • Comma-separated (name, qty, unit)
//   • Plain lines like "Soybean Oil 700 g" or "700g Soybean Oil"
// ============================================================
import type { IndustrialIngredient } from '../types';
import { UNITS } from './utils';

/**
 * Confidence tier for a bulk-paste match. Round 5 directive 2026-05-07:
 *   • Tier 1 — exact match (catalog name OR sub-ingredient single-item match)
 *   • Tier 2 — high-confidence partial (synonym / stripped grade-qualifier /
 *     whole-word prefix / head-token + tail-token overlap)
 *   • Tier 3 — medium-confidence partial (head-token mismatch or head-only
 *     ambiguity); REQUIRES user confirmation before import. The Celery Seed
 *     → Chia Seeds suffix-similarity bug surfaces here instead of silently
 *     substituting.
 *   • Tier 4 — no confident match; surface "no match found" with actions.
 *
 * Default `accepted` flag follows: Tier 1/2 = true, Tier 3/4 = false.
 */
export type MatchTier = 1 | 2 | 3 | 4;

export interface MatchResult {
  item: IndustrialIngredient | null;
  tier: MatchTier;
  /** Human-readable reason for Tier 2/3 matches — surfaces in the UI for
   *  Tier 3 confirmations ("matched on suffix similarity, head token differs"). */
  reason?: string;
}

export interface ParsedRow {
  /** Original pasted line (for display/debugging). */
  originalLine: string;
  /** Best-guess ingredient name extracted from the line. */
  parsedName: string;
  /** Quantity in the parsed unit (post volume→mass conversion if applicable). */
  parsedQty: number;
  /** Parsed unit (normalized to one of UNITS — defaults to 'g'). */
  parsedUnit: string;
  /** Best match from the industrial DB, or null if no confident match. */
  matchedItem: IndustrialIngredient | null;
  /** Confidence tier for the match (Round 5). 4 = no match. */
  matchTier: MatchTier;
  /** Human-readable reason for the match (Tier 2/3 only). */
  matchReason?: string;
  /** Whether the user wants to include this row. Tier 1/2 default true; Tier 3/4 default false. */
  accepted: boolean;
  /** If a volume unit was converted to mass using ingredient density, a human-readable note. */
  volumeNote?: string;
}

/**
 * Recognizes numbers followed by a supported unit. The units list mirrors
 * the UNITS constant from lib/utils, plus a few common aliases.
 */
const UNIT_ALIASES: Record<string, string> = {
  // Weight
  g: 'g', gram: 'g', grams: 'g',
  kg: 'kg', kilogram: 'kg', kilograms: 'kg',
  // Round 11 Phase 3 (2026-05-17): mg + mcg preserve to canonical unit
  // (previously mg coerced to g per F&B-era "will be small" heuristic;
  // breaks supplement formulator workflows where 500 mg ≠ 500 g —
  // 1000× error class). Phase 2 implementation-discovery finding #11.
  mg: 'mg', milligram: 'mg', milligrams: 'mg',
  mcg: 'mcg', microgram: 'mcg', micrograms: 'mcg', ug: 'mcg', μg: 'mcg',
  oz: 'oz', ounce: 'oz', ounces: 'oz',
  lb: 'lb', lbs: 'lb', pound: 'lb', pounds: 'lb',
  // Volume (metric)
  ml: 'ml', milliliter: 'ml', milliliters: 'ml', millilitre: 'ml', millilitres: 'ml',
  l: 'L', liter: 'L', liters: 'L', litre: 'L', litres: 'L',
  // Volume (US)
  'fl oz': 'fl oz', 'floz': 'fl oz', 'fluid ounce': 'fl oz', 'fluid ounces': 'fl oz',
  tsp: 'tsp', teaspoon: 'tsp', teaspoons: 'tsp',
  tbsp: 'tbsp', tablespoon: 'tbsp', tablespoons: 'tbsp', 'tbs': 'tbsp', 'tbl': 'tbsp',
  cup: 'cup', cups: 'cup', c: 'cup',
  pt: 'pt', pint: 'pt', pints: 'pt',
  qt: 'qt', quart: 'qt', quarts: 'qt',
  gal: 'gal', gallon: 'gal', gallons: 'gal',
};

/** Volume units (used for density-based mass conversion). */
export const VOLUME_TO_ML: Record<string, number> = {
  ml: 1, L: 1000,
  'fl oz': 29.5735, tsp: 4.92892, tbsp: 14.7868, cup: 236.588,
  pt: 473.176, qt: 946.353, gal: 3785.41,
};
export const VOLUME_UNITS = new Set(Object.keys(VOLUME_TO_ML));

// Round 11 Phase 3 (2026-05-17): mcg + microgram(s) + ug + μg added so
// supplement formulator inputs preserve canonical unit ("500 mcg Vitamin
// D3" no longer falls through to default 'g'). Order matters in regex
// alternation: mcg listed BEFORE mg (irrelevant for ambiguity given the
// literal-character matching, but consistency with the alias table order).
const QTY_UNIT_PATTERN = /(\d+(?:[.,]\d+)?)\s*(gallons?|gal|quarts?|qt|pints?|pt|kg|mcg|micrograms?|μg|ug|mg|milligrams?|g|oz|lbs?|ml|l\b|fl\s*oz|floz|fluid\s*ounces?|tsp|teaspoons?|tbsp|tbs|tbl|tablespoons?|cups?|\bc\b|grams?|kilograms?|ounces?|pounds?|milliliters?|millilitres?|liters?|litres?)\b/i;

/**
 * Normalize fraction notation to decimal floats.
 * Handles Unicode fractions (½, ¼, ⅓, ⅔, ⅛, ⅜, ⅝, ⅞),
 * mixed numbers (1 1/2 → 1.5), and simple fractions (1/2 → 0.5).
 */
export function normalizeFractions(s: string): string {
  // Unicode vulgar fractions
  const UNI: Record<string, string> = {
    '½': '.5', '¼': '.25', '¾': '.75',
    '⅓': '.333', '⅔': '.667',
    '⅛': '.125', '⅜': '.375', '⅝': '.625', '⅞': '.875',
    '⅕': '.2', '⅖': '.4', '⅗': '.6', '⅘': '.8',
    '⅙': '.167', '⅚': '.833',
  };
  // Separated (e.g. "1 ½") → "1.5"
  s = s.replace(/(\d+)\s+([½¼¾⅓⅔⅛⅜⅝⅞⅕⅖⅗⅘⅙⅚])/g, (_, w, f) => (parseFloat(w) + parseFloat('0' + UNI[f])).toString());
  // Standalone Unicode fractions → ".N"
  for (const [ch, rep] of Object.entries(UNI)) {
    s = s.replaceAll(ch, rep);
  }
  // Mixed ASCII fraction: "1 1/2" → "1.5" (MUST run before simple x/y)
  s = s.replace(/\b(\d+)\s+(\d+)\/(\d+)\b/g, (_, w, n, d) => {
    const v = parseFloat(w) + parseFloat(n) / parseFloat(d);
    return isFinite(v) ? v.toString() : _;
  });
  // Simple ASCII fraction: "1/2" → "0.5"
  s = s.replace(/\b(\d+)\/(\d+)\b/g, (_, n, d) => {
    const v = parseFloat(n) / parseFloat(d);
    return isFinite(v) ? v.toString() : _;
  });
  return s;
}

// ----- Density lookup (g / ml) ----------------------------------------------
// Used to convert volume units → mass. Industrial DB names take priority;
// keyword patterns are fallback for things typed loosely ("sugar", "flour").
const INGREDIENT_DENSITIES: Record<string, number> = {
  'Granulated Sugar (Sucrose)': 0.85,
  'Brown Sugar (Light)': 0.93,   // packed
  'Brown Sugar (Dark)': 0.93,
  'Powdered Sugar (10X Confectioners)': 0.56,
  'Turbinado Sugar (Raw)': 0.85,
  'Honey (Industrial Grade)': 1.42,
  'Pure Maple Syrup (Grade A)': 1.33,
  'Agave Syrup (Light)': 1.35,
  'Agave Syrup (Dark/Amber)': 1.35,
  'Molasses (Blackstrap)': 1.45,
  'Molasses (Fancy/Light)': 1.45,
  'Corn Syrup (Light)': 1.38,
  'Corn Syrup (Dark)': 1.38,
  'High Fructose Corn Syrup 55 (HFCS-55)': 1.37,
  'High Fructose Corn Syrup 42 (HFCS-42)': 1.35,
  'Dextrose Monohydrate': 0.80,
  'Maltodextrin (DE 10)': 0.70,
  // Oils — all close to 0.92
  'Soybean Oil (RBD)': 0.92,
  'Canola Oil (Industrial Grade)': 0.92,
  'Palm Oil (RBD)': 0.92,
  'High Oleic Sunflower Oil': 0.92,
  'Coconut Oil (RBD)': 0.92,
  'Extra Virgin Olive Oil': 0.91,
  'Pure/Light Olive Oil': 0.91,
  'Pomace Olive Oil': 0.91,
  'Avocado Oil (Refined)': 0.91,
  'Sesame Oil (Refined)': 0.92,
  // Vinegars — close to water
  'Distilled White Vinegar (50 Grain / 5%)': 1.01,
  'Distilled White Vinegar (100 Grain / 10%)': 1.02,
  'Distilled White Vinegar (200 Grain / 20%)': 1.03,
  'Apple Cider Vinegar (5%)': 1.01,
  'Red Wine Vinegar': 1.01,
  'Balsamic Vinegar (Industrial)': 1.11,
  // Sauces/condiments
  'Tomato Paste (28-30 Brix)': 1.07,
  'Tomato Puree (Aseptic)': 1.05,
  'Soy Sauce (Industrial Brewed)': 1.12,
  'Worcestershire Sauce (Industrial)': 1.10,
  'Dijon Mustard (Industrial)': 1.05,
  'Mayonnaise Base (Industrial)': 0.91,
  // Salts
  'Salt (Food Grade Fine)': 1.20,
  // Nut/seed butters
  'Peanut Butter (Industrial/Processed)': 1.10,
  'Almond Butter (Industrial)': 1.05,
  'Tahini (Hulled Sesame Paste)': 1.07,
  'Tahini (Unhulled/Whole Sesame Paste)': 1.07,
  // Juices
  'Lemon Juice (Concentrate)': 1.18,
  'Lime Juice (Concentrate)': 1.18,
  'Orange Juice (NFC, Fresh-Squeezed)': 1.04,
  'Apple Juice (NFC, 100%)': 1.05,
  // Water
  'Water': 1.0,
};

const DENSITY_BY_KEYWORD: Array<[RegExp, number]> = [
  // Most specific first
  [/\bpowdered\s+sugar|confectioners\s+sugar|10x/i, 0.56],
  [/\bbrown\s+sugar/i, 0.93],
  [/\bcoconut\s+sugar/i, 0.70],
  [/\bhoney\b/i, 1.42],
  [/\bmaple\s+syrup/i, 1.33],
  [/\bmolasses\b/i, 1.45],
  [/\bagave\b/i, 1.35],
  [/\bcorn\s+syrup/i, 1.38],
  [/\b(granulated\s+)?sugar\b/i, 0.85],
  [/\boil\b/i, 0.92],
  [/\bbutter\b/i, 0.96],
  [/\b(kosher|sea|table)?\s*salt\b/i, 1.20],
  [/\b(all[-\s]?purpose\s+|bread\s+|cake\s+|pastry\s+|whole[-\s]?wheat\s+)?flour\b/i, 0.53],
  [/\balmond\s+flour/i, 0.45],
  [/\bcoconut\s+flour/i, 0.55],
  [/\boat(meal|s|\s+flour)?\b/i, 0.41],
  [/\brice\b/i, 0.75],
  [/\bwater\b/i, 1.00],
  [/\bvinegar\b/i, 1.02],
  [/\b(whole|skim|1%|2%|low[-\s]?fat)\s+milk\b/i, 1.03],
  [/\bmilk\b/i, 1.03],
  [/\b(heavy|whipping|half[-\s]?and[-\s]?half)?\s*cream\b/i, 1.00],
  [/\byogurt\b/i, 1.03],
  [/\bjuice\b/i, 1.02],
  [/\btomato\s+(paste|puree|sauce)/i, 1.07],
  [/\btahini\b/i, 1.07],
  [/\b(peanut|almond|cashew|sunflower|sun)\s*butter\b/i, 1.08],
  [/\bmayonnaise\b|\bmayo\b/i, 0.91],
  [/\bketchup\b/i, 1.10],
  [/\bmustard\b/i, 1.05],
  [/\bsoy\s+sauce/i, 1.12],
  [/\bworcestershire/i, 1.10],
  [/\bbaking\s+(powder|soda)/i, 0.90],
  [/\bcornstarch|corn\s+starch/i, 0.63],
  [/\bcocoa\s+powder/i, 0.40],
];

/**
 * Look up density (g/ml) by ingredient name. Exact match first, then keyword,
 * then water (1.0) as default.
 */
export function lookupDensity(name: string): number {
  if (INGREDIENT_DENSITIES[name]) return INGREDIENT_DENSITIES[name];
  for (const key of Object.keys(INGREDIENT_DENSITIES)) {
    if (key.toLowerCase() === name.toLowerCase()) return INGREDIENT_DENSITIES[key];
  }
  for (const [regex, d] of DENSITY_BY_KEYWORD) {
    if (regex.test(name)) return d;
  }
  return 1.0;
}

/**
 * Rank how well a candidate name matches a query. Lower = better. 99 = no match.
 *
 * Tiers (the "Water → Watermelon Juice" bug fix):
 *   0  exact match
 *   1  whole-word prefix — query "water" matches "Water (Potable...)"
 *   2  whole-word elsewhere in name
 *   3  letter-prefix — query "water" matches "Watermelon" (same letters, different word)
 *   4  substring anywhere
 */
export function rankIngredientMatch(name: string, query: string): number {
  const n = name.toLowerCase();
  const q = query.toLowerCase().trim();
  if (!q) return 99;
  if (n === q) return 0;
  const nextChar = n.charAt(q.length);
  if (n.startsWith(q) && (nextChar === '' || /\W/.test(nextChar))) return 1;
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (new RegExp(`(^|\\W)${escaped}(\\W|$)`).test(n)) return 2;
  if (n.startsWith(q)) return 3;
  if (n.includes(q)) return 4;
  return 99;
}

/**
 * Round 5 (2026-05-07) — synonym / common-name table for bulk-paste matching.
 * Maps lowercase common names to canonical catalog names. Lets a formulator
 * paste "white vinegar" or "sugar" and get the right catalog entry without
 * tripping the suffix-similarity matching path. Grow this table as customer
 * gaps surface.
 */
const SYNONYMS: Record<string, string> = {
  'white vinegar':       'Distilled White Vinegar (50 Grain / 5%)',
  'distilled vinegar':   'Distilled White Vinegar (50 Grain / 5%)',
  'sugar':               'Granulated Sugar (Sucrose)',
  'granulated sugar':    'Granulated Sugar (Sucrose)',
  'cane sugar':          'Granulated Sugar (Sucrose)',
  'salt':                'Salt (Food Grade Fine)',
  'water':               'Water (Potable / Treated)',
  'potable water':       'Water (Potable / Treated)',
  'honey':               'Honey (Industrial Grade)',
  'apple cider vinegar': 'Apple Cider Vinegar (5%)',
  'acv':                 'Apple Cider Vinegar (5%)',
};

/** Strip the trailing parens-qualifier from a catalog name. Same regex as
 *  lib/ingredientStatement.ts; kept inline here to avoid the cross-module
 *  import for a single regex. */
function stripCatalogTrailingParens(name: string): string {
  return name.replace(/\s*\([^)]*\)\s*$/, '').trim();
}

/** Tokens that appear across many ingredients and don't carry distinctive
 *  semantic content. Skipped during head-token comparisons so matching
 *  focuses on the meaningful head ("Celery" vs "Chia") rather than shared
 *  structural tail words ("Seeds (Whole)"). */
const STRUCTURAL_TOKENS = new Set([
  'the', 'and', 'with', 'for', 'industrial', 'food', 'grade', 'pure',
  'organic', 'fresh', 'dried', 'whole', 'ground', 'powder', 'powdered',
  'fine', 'coarse', 'extract', 'concentrate',
]);

/** Tokenize an ingredient name for head-priority matching. Drops short
 *  tokens (length ≤ 2) and structural words like "whole" / "industrial". */
function tokenizeForMatching(s: string): string[] {
  return s.toLowerCase()
    .split(/[\s,/()]+/)
    .filter(t => t.length > 2 && !STRUCTURAL_TOKENS.has(t));
}

/**
 * Find the best industrial-DB match for a given name string and assign a
 * confidence tier (1–4) per Round 5 directive 2026-05-07.
 *
 * Tier ladder:
 *   1 = exact match (catalog name OR single sub-ingredient match)
 *   2 = high-confidence partial (synonym / stripped name / whole-word prefix
 *       / head-token + ≥1 tail-token overlap)
 *   3 = medium-confidence partial (head-only match with multi-token name OR
 *       no head match but ≥2 tail-token overlap — surface for confirmation)
 *   4 = no confident match
 *
 * The Celery Seed → Chia Seeds suffix-similarity bug previously fired here:
 * the old token-overlap path counted shared structural tokens ('seed' +
 * 'whole') equally with distinctive head tokens ('celery' vs 'chia') and
 * silently returned Chia Seeds. The new path requires the head token to
 * match for a Tier 2 result; head-mismatch with tail-only overlap drops
 * to Tier 3 (user confirmation required).
 */
export function findBestMatchWithTier(name: string, db: IndustrialIngredient[]): MatchResult {
  if (!name || name.length < 2) return { item: null, tier: 4 };
  const lower = name.toLowerCase().trim();

  // ─── Tier 1: exact match on catalog name ──────────────────────────
  const exact = db.find(i => i.name.toLowerCase() === lower);
  if (exact) return { item: exact, tier: 1 };

  // ─── Tier 1: exact match on a single-item sub-ingredient statement ─
  // ("Honey (Industrial Grade)" with subIngredients=['Honey'] → match for input "Honey")
  for (const i of db) {
    const subs = i.subIngredients ?? [];
    if (subs.length === 1 && subs[0].toLowerCase() === lower) {
      return { item: i, tier: 1 };
    }
  }

  // ─── Tier 2: synonym table ────────────────────────────────────────
  const syn = SYNONYMS[lower];
  if (syn) {
    const item = db.find(i => i.name === syn);
    if (item) return { item, tier: 2, reason: 'common-name synonym' };
  }

  // ─── Tier 2: stripped-name match ──────────────────────────────────
  // Catalog "Salt (Food Grade Fine)" stripped to "Salt" matches input "Salt".
  for (const i of db) {
    if (stripCatalogTrailingParens(i.name).toLowerCase() === lower) {
      return { item: i, tier: 2, reason: 'catalog name minus grade qualifier' };
    }
  }

  // ─── Tier 2: whole-word prefix on the catalog side ────────────────
  // rankIngredientMatch tier 1 means "catalog name starts with query as a
  // whole word." Input "honey mustard" matches catalog "Honey Mustard
  // (Industrial)". Sort by name length so the most specific entry wins.
  const wholeWordPrefix = db
    .map(i => ({ item: i, s: rankIngredientMatch(i.name, lower) }))
    .filter(x => x.s === 1)
    .sort((a, b) => a.item.name.length - b.item.name.length);
  if (wholeWordPrefix.length > 0) {
    return { item: wholeWordPrefix[0].item, tier: 2, reason: 'whole-word prefix match' };
  }

  // ─── Token overlap with HEAD-TOKEN PRIORITY ───────────────────────
  // The Celery Seed → Chia Seeds bug fix lives here. Score by:
  //   • head-token match (10 points) — distinctive content ("celery")
  //   • each tail-token match (1 point) — supporting ("seed", "whole")
  // Then assign tier:
  //   • head + ≥1 tail tokens         → Tier 2 (high confidence)
  //   • head only on a 1-token name   → Tier 2 (no tail to disagree)
  //   • head only on multi-token name → Tier 3 (head matches but family differs)
  //   • no head + ≥2 tail tokens      → Tier 3 (real semantic neighborhood — confirm)
  //   • no head + 1 tail token        → Tier 4 (likely catalog gap, don't substitute)
  //   • no overlap                    → Tier 4
  const queryTokens = tokenizeForMatching(lower);
  if (queryTokens.length === 0) return { item: null, tier: 4 };
  const queryHead = queryTokens[0];

  type Cand = { item: IndustrialIngredient; tailScore: number; headMatch: boolean; itemTokenCount: number; };
  const candidates: Cand[] = [];
  for (const item of db) {
    const itemTokens = tokenizeForMatching(item.name);
    if (itemTokens.length === 0) continue;
    const itemHead = itemTokens[0];
    const headMatch = itemHead === queryHead || itemHead.startsWith(queryHead) || queryHead.startsWith(itemHead);
    let tailScore = 0;
    for (let qi = 1; qi < queryTokens.length; qi++) {
      const t = queryTokens[qi];
      if (itemTokens.some(it => it === t || it.startsWith(t) || t.startsWith(it))) {
        tailScore++;
      }
    }
    candidates.push({ item, tailScore, headMatch, itemTokenCount: itemTokens.length });
  }

  // Sort: head-match first (highest priority), then by tail score, then prefer shorter (more specific) names.
  candidates.sort((a, b) =>
    Number(b.headMatch) - Number(a.headMatch) ||
    b.tailScore - a.tailScore ||
    a.item.name.length - b.item.name.length
  );
  const best = candidates[0];
  if (!best || (!best.headMatch && best.tailScore === 0)) return { item: null, tier: 4 };

  if (best.headMatch && best.tailScore >= 1) {
    return { item: best.item, tier: 2, reason: 'head + tail-token overlap' };
  }
  if (best.headMatch && best.itemTokenCount === 1) {
    return { item: best.item, tier: 2, reason: 'head match (single-token catalog name)' };
  }
  if (best.headMatch) {
    return { item: best.item, tier: 3, reason: 'head matches but supporting tokens differ' };
  }
  if (best.tailScore >= 2) {
    return { item: best.item, tier: 3, reason: `tail-token similarity (${best.tailScore} shared) but head token differs` };
  }
  return { item: null, tier: 4 };
}

/**
 * Backwards-compatible wrapper — returns the matched item or null without
 * tier information. Callers that need the tier should switch to
 * findBestMatchWithTier.
 */
export function findBestMatch(name: string, db: IndustrialIngredient[]): IndustrialIngredient | null {
  const result = findBestMatchWithTier(name, db);
  // Only Tier 1/2 are confident enough to return as a "match" under the
  // legacy contract; Tier 3 requires user confirmation, so callers without
  // tier-awareness should treat it as no-match.
  return result.tier <= 2 ? result.item : null;
}

/**
 * Strip Excel-style surrounding double quotes (including Unicode smart quotes)
 * that appear when a cell contains a comma.
 */
function stripQuotes(s: string): string {
  return s.replace(/^["\u201C\u201D]+|["\u201C\u201D]+$/g, '').trim();
}

/**
 * Strip leading bullet, dash, or list-marker characters (Word/Docs bulleted lists).
 */
function stripBullet(s: string): string {
  return s.replace(/^[\s•*·\u2013\u2014\-]+/, '').trim();
}

/** Number-only field (no unit) — used for Excel/Sheets 3-column paste. */
const NUM_ONLY_PATTERN = /^\d+(?:[.,]\d+)?$/;

/**
 * Parse pasted text into candidate ingredient rows.
 *
 * Handles:
 *   • Markdown tables (pipe-separated)
 *   • Excel / Google Sheets paste (tab-separated, with cells potentially quoted)
 *   • Word tables (tab-separated after plain-text conversion)
 *   • Word / Docs bulleted lists (strips leading • * - chars)
 *   • CSV (comma-separated)
 *   • Plain lines: "Soybean Oil 700 g", "700g Soybean Oil", or split cells "Soybean Oil | 700 | g"
 */
export function parsePastedFormula(text: string, db: IndustrialIngredient[]): ParsedRow[] {
  const rawLines = text.split(/\r?\n/).map(l => l.trim());
  const rows: ParsedRow[] = [];

  for (const rawLine of rawLines) {
    if (!rawLine) continue;
    // Normalize fractions + strip leading bullets so the rest of the line is clean.
    const line = normalizeFractions(stripBullet(rawLine));
    // Skip markdown divider rows (pipes + dashes + colons only)
    if (/^[|\s:\-]+$/.test(line)) continue;
    // Skip markdown/plain headers that are just labels
    if (/^#{1,6}\s/.test(line)) continue;
    if (/^(ingredient|qty|quantity|unit|amount|%|percent|name|total)\b/i.test(line) && !QTY_UNIT_PATTERN.test(line)) continue;

    // Split on common separators (pipe, tab, comma). Each field is quote-stripped
    // because Excel wraps cells containing commas in double quotes.
    let fields: string[];
    if (line.includes('|')) {
      fields = line.split('|').map(f => stripQuotes(f)).filter(Boolean);
    } else if (line.includes('\t')) {
      fields = line.split('\t').map(f => stripQuotes(f)).filter(Boolean);
    } else if (line.includes(',')) {
      fields = line.split(',').map(f => stripQuotes(f)).filter(Boolean);
    } else {
      // Single field — the whole line needs to be both qty+name
      fields = [line];
    }

    // --- Pass 1: find a field that contains qty + unit combined (e.g. "700 g") ---
    let rawQty = 0;
    let rawUnit = 'g';
    let nameCandidates: string[] = [];

    for (let i = 0; i < fields.length; i++) {
      const f = fields[i];
      const m = f.match(QTY_UNIT_PATTERN);
      if (m && rawQty === 0) {
        rawQty = parseFloat(m[1].replace(',', '.'));
        const normalized = m[2].toLowerCase().replace(/\s+/g, ' ').trim();
        rawUnit = UNIT_ALIASES[normalized] || 'g';
        const rest = f.replace(m[0], '').trim();
        if (rest.length >= 2) nameCandidates.push(rest);
      } else {
        nameCandidates.push(f);
      }
    }

    // --- Pass 2: if no combined qty+unit found, try SEPARATE qty and unit fields ---
    // (Excel / Google Sheets 3-column tables paste as "Name\tQty\tUnit".)
    if (rawQty === 0) {
      let qtyIdx = -1;
      let unitIdx = -1;
      for (let i = 0; i < fields.length; i++) {
        const f = fields[i].trim();
        if (qtyIdx === -1 && NUM_ONLY_PATTERN.test(f)) {
          qtyIdx = i;
          rawQty = parseFloat(f.replace(',', '.'));
        } else if (unitIdx === -1 && UNIT_ALIASES[f.toLowerCase()]) {
          unitIdx = i;
          rawUnit = UNIT_ALIASES[f.toLowerCase()];
        }
      }
      // If we found a qty (with or without explicit unit), rebuild name candidates
      // to exclude the qty and unit fields.
      if (qtyIdx !== -1) {
        nameCandidates = fields.filter((_, i) => i !== qtyIdx && i !== unitIdx);
        if (unitIdx === -1) rawUnit = 'g'; // default to grams if no unit column given
      }
    }

    // If no qty found anywhere, skip the line
    if (rawQty <= 0) continue;

    // Clean name candidates: drop % values, pure numbers, short stubs, row numbers, bullet refs
    nameCandidates = nameCandidates
      .map(s => s.replace(/\d+(?:\.\d+)?\s*%/g, '').trim())
      .map(s => s.replace(/^\d+\s*[.):]\s*/, '').trim()) // "1. Name" / "1) Name" / "1: Name"
      .map(s => stripBullet(s))
      .filter(s => s.length >= 2)
      .filter(s => !/^\d+(?:\.\d+)?$/.test(s))
      .filter(s => s !== '#');

    // The best name candidate is the longest remaining string that isn't obviously just a qty
    const name = nameCandidates
      .sort((a, b) => b.length - a.length)[0] || '';

    if (!name) continue;

    // Volume → mass conversion using ingredient density (now that we have a name).
    let finalQty = rawQty;
    let finalUnit = rawUnit;
    let volumeNote: string | undefined;

    if (VOLUME_UNITS.has(rawUnit)) {
      const ml = rawQty * VOLUME_TO_ML[rawUnit];
      const density = lookupDensity(name);
      const grams = ml * density;
      finalQty = Math.round(grams * 100) / 100;
      finalUnit = 'g';
      const densitySource = INGREDIENT_DENSITIES[name] !== undefined
        ? 'known'
        : DENSITY_BY_KEYWORD.some(([r]) => r.test(name))
          ? 'estimated'
          : 'water default';
      volumeNote = `${rawQty} ${rawUnit} → ${finalQty} g (density ${density.toFixed(2)} g/ml · ${densitySource})`;
    }

    const match = findBestMatchWithTier(name, db);
    rows.push({
      originalLine: rawLine,
      parsedName: name,
      parsedQty: finalQty,
      parsedUnit: UNITS.includes(finalUnit) ? finalUnit : 'g',
      matchedItem: match.item,
      matchTier: match.tier,
      matchReason: match.reason,
      // Tier 1/2 default-accepted; Tier 3 requires user confirmation; Tier 4 = no match.
      accepted: match.tier <= 2 && match.item !== null,
      volumeNote,
    });
  }

  return rows;
}
