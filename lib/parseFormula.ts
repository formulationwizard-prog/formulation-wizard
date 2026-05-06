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
  /** Whether the user wants to include this row (defaults true if matched). */
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
  mg: 'g',  // treat mg as g, will be small
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

const QTY_UNIT_PATTERN = /(\d+(?:[.,]\d+)?)\s*(gallons?|gal|quarts?|qt|pints?|pt|kg|mg|g|oz|lbs?|ml|l\b|fl\s*oz|floz|fluid\s*ounces?|tsp|teaspoons?|tbsp|tbs|tbl|tablespoons?|cups?|\bc\b|grams?|kilograms?|ounces?|pounds?|milliliters?|millilitres?|liters?|litres?)\b/i;

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
 * Find the best industrial-DB match for a given name string.
 * Returns null if no confident match can be made.
 */
export function findBestMatch(name: string, db: IndustrialIngredient[]): IndustrialIngredient | null {
  if (!name || name.length < 2) return null;
  const lower = name.toLowerCase().trim();

  // 1. Exact match
  const exact = db.find(i => i.name.toLowerCase() === lower);
  if (exact) return exact;

  // 2. DB name contains query — ranked (whole-word beats letter-prefix beats substring).
  //    This is what makes "water" match "Water (Potable...)" instead of "Watermelon Juice".
  const ranked = db
    .map(i => ({ item: i, s: rankIngredientMatch(i.name, lower) }))
    .filter(x => x.s < 99)
    .sort((a, b) => a.s - b.s || a.item.name.length - b.item.name.length);
  if (ranked.length > 0) return ranked[0].item;

  // 3. Reverse direction — query contains a DB name (e.g. pasted line containing a shorter DB name)
  const reverseContain = db.find(i => lower.includes(i.name.toLowerCase()));
  if (reverseContain) return reverseContain;

  // 4. Token overlap — best scoring match
  const skipWords = new Set(['the', 'and', 'with', 'for', 'industrial', 'food', 'grade', 'pure', 'organic', 'fresh', 'dried']);
  const tokens = lower
    .split(/[\s,/()]+/)
    .filter(t => t.length > 2 && !skipWords.has(t));
  if (tokens.length === 0) return null;

  let bestMatch: IndustrialIngredient | null = null;
  let bestScore = 0;
  for (const item of db) {
    const itemLower = item.name.toLowerCase();
    const itemTokens = itemLower.split(/[\s,/()]+/).filter(t => t.length > 2);
    let score = 0;
    for (const t of tokens) {
      if (itemTokens.some(it => it === t || it.startsWith(t) || t.startsWith(it))) {
        score++;
      }
    }
    // Prefer longer matches when scores tie (more specific is better)
    if (score > bestScore || (score === bestScore && bestMatch && item.name.length < bestMatch.name.length)) {
      bestScore = score;
      bestMatch = item;
    }
  }
  // Require at least 2 matching tokens (or 1 if the name is only 1-2 tokens)
  const threshold = tokens.length >= 3 ? 2 : 1;
  return bestScore >= threshold ? bestMatch : null;
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

    rows.push({
      originalLine: rawLine,
      parsedName: name,
      parsedQty: finalQty,
      parsedUnit: UNITS.includes(finalUnit) ? finalUnit : 'g',
      matchedItem: findBestMatch(name, db),
      accepted: false, // set true below if matched
      volumeNote,
    });
  }

  // Default-accept any row that found a DB match
  return rows.map(r => ({ ...r, accepted: !!r.matchedItem }));
}
