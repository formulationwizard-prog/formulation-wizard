// ============================================================
// NEW DIETARY INGREDIENT (NDI) COMPLIANCE FLAG
// ------------------------------------------------------------
// Under DSHEA §8 (21 USC §350b), any dietary ingredient NOT
// marketed in the US before October 15, 1994 is a "New Dietary
// Ingredient" (NDI) and requires a 75-day pre-market notification
// to FDA — 21 CFR 190.6 — unless it is either:
//   • Present in the food supply as an article used for food
//     with no chemical alteration, OR
//   • Already the subject of a filed NDI that FDA did not object to.
//
// This is one of the most-violated rules in the supplement
// industry. An estimated majority of novel ingredients on the
// US market have not been properly NDI-notified, which makes
// the product technically misbranded/unlawful.
//
// Classification for each ingredient:
//   • 'grandfathered' → Old Dietary Ingredient (ODI), pre-1994
//   • 'notified'      → Post-1994 but has an accepted NDI on file
//   • 'gras-food'     → Conventional food ingredient, GRAS status
//   • 'required'      → Post-1994, NDI notification required (risk flag)
//   • 'unknown'       → Not in the platform's knowledge — user must verify
// ============================================================

export type NDIStatus =
  | 'grandfathered'  // pre-October 15, 1994 ODI
  | 'notified'       // NDI filed & no FDA objection
  | 'gras-food'      // conventional food ingredient
  | 'required'       // post-1994, no notification known — HIGH RISK
  | 'unknown';       // unclassified — user must verify

/**
 * Word-boundary mode for keyword matching. Wave 1.5d (2026-05-18).
 *
 * - `'whole-word'` (default) — JavaScript standard `\b...\b` boundary,
 *   which treats hyphens as boundaries. Right for most ingredient
 *   keywords: `'tocopherol'` correctly matches `'DL-Alpha-Tocopherol'`,
 *   `'iron'` correctly matches `'iron-fortified'`.
 *
 * - `'standalone-token'` — stricter boundary that treats hyphens as
 *   NON-boundaries (`(?<![a-zA-Z0-9-])k(?![a-zA-Z0-9-])`). Use ONLY for
 *   keywords that are structural moieties in compound chemical names
 *   where the compound has distinct regulatory status from the parent
 *   substance. Example: `'choline'` (parent: grandfathered) should match
 *   `'Choline Bitartrate'` but NOT `'CDP-Choline'` or
 *   `'Phosphatidylcholine'` — the compound forms have specific NDIs
 *   (Cognizin / Chemi Nutra Alpha-GPC) that don't inherit from the
 *   generic grandfathered choline classification.
 *
 * ─── Authoring decision rule for new NDI_TABLE entries ─────────────
 *
 * Default to `'whole-word'`. Opt into `'standalone-token'` only when
 * BOTH of these conditions hold:
 *
 *   (a) The keyword is a substring of a different, known compound
 *       chemical name (e.g., `'choline'` is a substring of
 *       `'phosphatidylcholine'`, `'glycerylphosphorylcholine'`,
 *       `'citicoline'`), AND
 *
 *   (b) The compound has distinct regulatory status from the parent
 *       substance whose keyword you're adding (e.g., Alpha-GPC's
 *       branded forms have notified NDIs while generic choline is
 *       grandfathered — distinct status, not inherited).
 *
 * If only (a) holds but the compound shares the parent's regulatory
 * status (e.g., `'iron'` substring of `'iron-fortified'` — both
 * grandfathered), `'whole-word'` is correct because the substring
 * match is semantically benign.
 *
 * If neither (a) nor (b) holds, `'whole-word'` (default) is correct.
 *
 * Failure modes the discipline prevents:
 *   • Picking `'standalone-token'` when not needed → keyword may
 *     undermatch legitimate compound names (false negatives, operator
 *     gets verbose unmatched advisory when classification existed)
 *   • Picking `'whole-word'` when `'standalone-token'` is needed →
 *     keyword overgeneralizes into compound names with distinct
 *     status (false positives, silent misclassification — the bug
 *     class that surfaced 'choline' overgeneralization in Wave 1.5d)
 *
 * When in doubt, write a test case: query the compound name against
 * NDI_TABLE and assert the classification matches the compound's true
 * regulatory status, not the parent moiety's. If the test surfaces a
 * misclassification, `'standalone-token'` is needed.
 *
 * ───────────────────────────────────────────────────────────────────
 */
export type NDIBoundaryMode = 'whole-word' | 'standalone-token';

export interface NDIEntry {
  keywords: string[];
  displayName: string;
  status: NDIStatus;
  note?: string;
  /** Optional FDA NDI report number when applicable. */
  ndiNumber?: string;
  /** Year the ingredient first appeared in the US market if relevant. */
  marketSinceYear?: number;
  /** Word-boundary mode for matching keywords. Defaults to 'whole-word'.
   *  Use 'standalone-token' for structural-moiety keywords (Wave 1.5d). */
  boundaryMode?: NDIBoundaryMode;
}

/**
 * Canonical classification table. Order matters: longer/more specific
 * keywords should appear before shorter generic ones.
 *
 * Wave 1.5d (2026-05-18) — matching discipline refactored from substring
 * (`name.includes(k)`) to whole-word boundary (`\bk\b`) to fix a class of
 * silent-overgeneralization bugs surfaced in operator verification:
 * generic `'choline'` substring-matched into `phosphatidylcholine`,
 * `alpha-gpc` (L-Alpha-Glycerylphosphorylcholine), and `cdp-choline`,
 * classifying them grandfathered when their branded commercial forms have
 * specific NDIs (e.g. Chemi Nutra Alpha-GPC, Kyowa Hakko Cognizin).
 *
 * Conversion discipline: keywords that were intentionally partial-tokens
 * to catch family members via substring (`'pyridox'` → pyridoxine /
 * pyridoxal / pyridoxamine; `'pantothen'` → pantothenic acid /
 * pantothenate; `'cobalamin'` → all B12 forms; `'lactobacill'` →
 * Lactobacillus genus) were expanded inline to explicit whole-word
 * equivalents. Operator paste against any expanded keyword matches via
 * the whole-word boundary regex.
 *
 * Safe-default discipline: ingredients not in this table fall through to
 * the verbose unmatched advisory ("Not in the platform's NDI reference
 * table. Verify compliance status independently before marketing..."),
 * which is the correct UX for UNDOCUMENTED status. Per the two-state
 * NDI discipline: DOCUMENTED entries appear here with authoritative
 * basis; UNDOCUMENTED entries are deliberately omitted.
 */
export const NDI_TABLE: NDIEntry[] = [
  // ─── Grandfathered (pre-1994) — the "Old Dietary Ingredient" (ODI) list ───
  { keywords: ['vitamin a', 'retinyl', 'retinol'], displayName: 'Vitamin A', status: 'grandfathered' },
  { keywords: ['beta-carotene', 'beta carotene'], displayName: 'Beta-Carotene', status: 'grandfathered' },
  { keywords: ['vitamin c', 'ascorbic acid', 'sodium ascorbate', 'calcium ascorbate'], displayName: 'Vitamin C', status: 'grandfathered' },
  { keywords: ['vitamin d', 'cholecalciferol', 'ergocalciferol'], displayName: 'Vitamin D', status: 'grandfathered' },
  { keywords: ['vitamin e', 'tocopherol'], displayName: 'Vitamin E', status: 'grandfathered' },
  { keywords: ['vitamin k', 'phytonadione', 'menaquinone', 'mk-4', 'mk-7'], displayName: 'Vitamin K', status: 'grandfathered', note: 'MK-7 specifically has a more recent NDI — GRAS notified.' },
  { keywords: ['thiamin', 'thiamine', 'vitamin b1'], displayName: 'Thiamin (B1)', status: 'grandfathered' }, // Wave 1.5d: 'thiamin' partial-token expanded to ['thiamin', 'thiamine'] for whole-word matching
  { keywords: ['riboflavin', 'vitamin b2'], displayName: 'Riboflavin (B2)', status: 'grandfathered' },
  { keywords: ['niacin', 'niacinamide', 'nicotinamide'], displayName: 'Niacin (B3)', status: 'grandfathered' },
  { keywords: ['pantothenic acid', 'pantothenate'], displayName: 'Pantothenic Acid (B5)', status: 'grandfathered' }, // Wave 1.5d: 'pantothen' partial-token expanded to explicit whole-word forms
  { keywords: ['vitamin b6', 'pyridoxine', 'pyridoxal', 'pyridoxamine', 'p-5-p', 'p5p'], displayName: 'Vitamin B6', status: 'grandfathered' }, // Wave 1.5d: 'pyridox' partial-token expanded
  { keywords: ['folate', 'folic acid'], displayName: 'Folate', status: 'grandfathered' },
  { keywords: ['methylfolate', '5-mthf'], displayName: 'L-Methylfolate (5-MTHF)', status: 'notified', ndiNumber: 'NDI 612 / Quatrefolic', note: 'Specific branded forms have accepted NDIs; generic methylfolate may not.' },
  { keywords: ['vitamin b12', 'cobalamin', 'cyanocobalamin', 'methylcobalamin', 'hydroxocobalamin', 'adenosylcobalamin', 'dibencozide'], displayName: 'Vitamin B12', status: 'grandfathered' }, // Wave 1.5d: 'cobalamin' bare keyword no longer substring-matches B12 forms; all explicit whole-word forms added
  { keywords: ['biotin', 'vitamin b7'], displayName: 'Biotin (B7)', status: 'grandfathered' },
  { keywords: ['choline'], displayName: 'Choline', status: 'grandfathered', boundaryMode: 'standalone-token', note: 'Wave 1.5d: boundaryMode "standalone-token" means this keyword does NOT substring-match into compound chemical names. Bare "Choline" + "Choline Bitartrate" classify here (parent substance, grandfathered); phosphatidylcholine / alpha-gpc / cdp-choline surface UNMATCHED pending Round 12 PA-research ticket on branded-form NDI specificity (Cognizin / Chemi Nutra Alpha-GPC have specific NDIs distinct from generic-choline grandfathered status).' },
  { keywords: ['caffeine'], displayName: 'Caffeine', status: 'grandfathered', note: 'Wave 1.5d addition: pre-1994 dietary supplement use well-documented (caffeine pills, energy supplements). Authoritative basis: 21 CFR 182.1180 (caffeine GRAS for food) + extensive pre-DSHEA commercial supplement market presence.' },

  // Minerals — all grandfathered in common forms
  { keywords: ['calcium carbonate', 'calcium citrate', 'calcium'], displayName: 'Calcium', status: 'grandfathered' },
  { keywords: ['iron', 'ferrous'], displayName: 'Iron', status: 'grandfathered' },
  { keywords: ['magnesium'], displayName: 'Magnesium', status: 'grandfathered' },
  { keywords: ['zinc'], displayName: 'Zinc', status: 'grandfathered' },
  { keywords: ['selenium', 'selenomethionine'], displayName: 'Selenium', status: 'grandfathered' },
  { keywords: ['copper'], displayName: 'Copper', status: 'grandfathered' },
  { keywords: ['manganese'], displayName: 'Manganese', status: 'grandfathered' },
  { keywords: ['chromium'], displayName: 'Chromium', status: 'grandfathered' },
  { keywords: ['molybdenum'], displayName: 'Molybdenum', status: 'grandfathered' },
  { keywords: ['iodine', 'potassium iodide', 'kelp'], displayName: 'Iodine / Kelp', status: 'grandfathered' },
  { keywords: ['potassium'], displayName: 'Potassium', status: 'grandfathered' },
  { keywords: ['sodium chloride'], displayName: 'Sodium', status: 'gras-food' },
  { keywords: ['boron'], displayName: 'Boron', status: 'grandfathered' },

  // Amino acids — all grandfathered
  { keywords: ['l-lysine', 'lysine'], displayName: 'L-Lysine', status: 'grandfathered' },
  { keywords: ['l-arginine', 'arginine'], displayName: 'L-Arginine', status: 'grandfathered' },
  { keywords: ['l-glutamine', 'glutamine'], displayName: 'L-Glutamine', status: 'grandfathered' },
  { keywords: ['l-tyrosine', 'tyrosine'], displayName: 'L-Tyrosine', status: 'grandfathered' },
  { keywords: ['l-tryptophan', 'tryptophan'], displayName: 'L-Tryptophan', status: 'grandfathered' },
  { keywords: ['l-theanine', 'theanine'], displayName: 'L-Theanine', status: 'notified', ndiNumber: 'NDI 101 (Suntheanine)', note: 'Suntheanine (Taiyo) has an accepted NDI. Generic L-theanine preparations may not.' },
  { keywords: ['taurine'], displayName: 'Taurine', status: 'grandfathered' },
  { keywords: ['creatine'], displayName: 'Creatine Monohydrate', status: 'grandfathered' },
  { keywords: ['l-carnitine', 'carnitine'], displayName: 'L-Carnitine', status: 'grandfathered' },
  { keywords: ['nac', 'n-acetyl l-cysteine', 'n-acetyl cysteine'], displayName: 'N-Acetyl Cysteine', status: 'required', note: 'FDA considers NAC a drug (first approved as an Rx mucolytic in 1963). FDA has exercised enforcement discretion, but the formal DSHEA status is disputed. Monitor FDA policy.' },
  { keywords: ['5-htp', '5-hydroxytryptophan'], displayName: '5-HTP', status: 'grandfathered', note: 'Grandfathered but carries serotonin-syndrome drug-interaction risk.' },
  { keywords: ['beta-alanine'], displayName: 'Beta-Alanine', status: 'notified', note: 'Multiple NDI filings; branded CarnoSyn has accepted NDI.' },
  { keywords: ['citrulline'], displayName: 'L-Citrulline', status: 'notified', ndiNumber: 'NDI 203' },

  // Herbals — largely grandfathered as traditional food articles
  { keywords: ['turmeric', 'curcumin'], displayName: 'Turmeric / Curcumin', status: 'grandfathered' },
  { keywords: ['ginger'], displayName: 'Ginger', status: 'gras-food' },
  { keywords: ['garlic'], displayName: 'Garlic', status: 'gras-food' },
  { keywords: ['ginseng'], displayName: 'Ginseng', status: 'grandfathered' },
  { keywords: ['ashwagandha'], displayName: 'Ashwagandha', status: 'grandfathered', note: 'Branded KSM-66 and Sensoril have accepted NDIs for specific extract standardizations.' }, // Wave 1.5d: 'ashwagandh' partial-token expanded to whole-word 'ashwagandha'
  { keywords: ['rhodiola'], displayName: 'Rhodiola Rosea', status: 'grandfathered' },
  { keywords: ['ginkgo'], displayName: 'Ginkgo Biloba', status: 'grandfathered' },
  { keywords: ['milk thistle', 'silymarin'], displayName: 'Milk Thistle', status: 'grandfathered' },
  { keywords: ['saw palmetto'], displayName: 'Saw Palmetto', status: 'grandfathered' },
  { keywords: ['elderberry', 'sambucus'], displayName: 'Elderberry', status: 'gras-food' },
  { keywords: ['echinacea'], displayName: 'Echinacea', status: 'grandfathered' },
  { keywords: ['black cohosh'], displayName: 'Black Cohosh', status: 'grandfathered' },
  { keywords: ['maca'], displayName: 'Maca', status: 'gras-food' },
  { keywords: ['green tea'], displayName: 'Green Tea / EGCG', status: 'gras-food', note: 'Concentrated EGCG at supplemental doses may require NDI per form.' },
  { keywords: ['holy basil', 'tulsi'], displayName: 'Holy Basil (Tulsi)', status: 'grandfathered' },
  { keywords: ['ginger root'], displayName: 'Ginger Root', status: 'gras-food' },

  // Mushrooms
  { keywords: ["lion's mane", 'lions mane', 'hericium'], displayName: "Lion's Mane", status: 'gras-food' },
  { keywords: ['reishi', 'ganoderma'], displayName: 'Reishi', status: 'gras-food' },
  { keywords: ['cordyceps'], displayName: 'Cordyceps', status: 'gras-food' },
  { keywords: ['chaga'], displayName: 'Chaga', status: 'gras-food' },
  { keywords: ['turkey tail'], displayName: 'Turkey Tail', status: 'gras-food' },
  { keywords: ['shiitake'], displayName: 'Shiitake', status: 'gras-food' },
  { keywords: ['maitake'], displayName: 'Maitake', status: 'gras-food' },

  // Probiotics — strain-specific NDIs for most commercial strains
  { keywords: ['lactobacillus', 'bifidobacterium', 'saccharomyces', 'bacillus', 'streptococcus'], displayName: 'Probiotic strains', status: 'notified', note: 'Strain-specific; common commercial strains (BC30, DE111, BB-12, HN019, NCFM, etc.) have accepted NDIs or GRAS status. Verify strain-by-strain.' }, // Wave 1.5d: 'lactobacill' / 'bifido' / 'saccharo' partial-tokens expanded to full taxonomic genus names

  // Omega-3 / fats
  { keywords: ['fish oil'], displayName: 'Fish Oil', status: 'gras-food' },
  { keywords: ['krill oil'], displayName: 'Krill Oil', status: 'notified', ndiNumber: 'Neptune / Aker NDIs' },
  { keywords: ['algae oil'], displayName: 'Algae-derived DHA/EPA', status: 'notified', ndiNumber: 'DSM/Life\'sOMEGA NDIs' },
  { keywords: ['flaxseed oil', 'flax oil'], displayName: 'Flaxseed Oil', status: 'gras-food' },
  { keywords: ['mct', 'medium-chain'], displayName: 'MCT Oil', status: 'gras-food' },
  { keywords: ['coconut oil'], displayName: 'Coconut Oil', status: 'gras-food' },

  // Coenzymes & specialty
  { keywords: ['coenzyme q10', 'coq10', 'ubiquinone'], displayName: 'CoQ10 (Ubiquinone)', status: 'grandfathered' },
  { keywords: ['ubiquinol'], displayName: 'Ubiquinol', status: 'notified', ndiNumber: 'Kaneka QH NDI 290' },
  { keywords: ['pqq', 'pyrroloquinoline'], displayName: 'PQQ', status: 'notified', ndiNumber: 'Mitsubishi BioPQQ NDI' },
  { keywords: ['resveratrol'], displayName: 'Resveratrol', status: 'grandfathered' },
  { keywords: ['quercetin'], displayName: 'Quercetin', status: 'grandfathered' },
  { keywords: ['lutein'], displayName: 'Lutein', status: 'gras-food' },
  { keywords: ['astaxanthin'], displayName: 'Astaxanthin', status: 'notified' },

  // Sweeteners / excipients
  { keywords: ['stevia'], displayName: 'Stevia (Steviol Glycosides)', status: 'gras-food' },
  { keywords: ['monk fruit', 'luo han guo'], displayName: 'Monk Fruit', status: 'gras-food' },
  { keywords: ['erythritol'], displayName: 'Erythritol', status: 'gras-food' },
  { keywords: ['xylitol'], displayName: 'Xylitol', status: 'gras-food' },
  { keywords: ['sorbitol'], displayName: 'Sorbitol', status: 'gras-food' },
  { keywords: ['maltodextrin', 'microcrystalline cellulose', 'mcc', 'dicalcium phosphate', 'silica', 'magnesium stearate', 'stearic acid', 'hpmc', 'gelatin'], displayName: 'Standard excipient', status: 'gras-food' },
  { keywords: ['lecithin'], displayName: 'Lecithin', status: 'gras-food', note: 'Wave 1.5d addition: lecithin (soy or sunflower) has unambiguous pre-DSHEA commercial food + supplement use. 21 CFR 184.1400 (lecithin GRAS for food). Surfaced during Lecithin (Soy, Liquid, USP) entry upgrade as the catalog-data side of the Lecithin §38a grep-gap finding.' },

  // Fiber & prebiotics
  { keywords: ['inulin'], displayName: 'Inulin', status: 'gras-food' },
  { keywords: ['psyllium'], displayName: 'Psyllium', status: 'gras-food' },

  // Known problematic post-1994 ingredients that REQUIRE filings
  { keywords: ['sulbutiamine'], displayName: 'Sulbutiamine', status: 'required', note: 'Synthetic B1 analog. Not grandfathered; no widely accepted NDI. High regulatory risk.' },
  { keywords: ['piracetam', 'aniracetam', 'oxiracetam', 'noopept'], displayName: 'Racetam nootropics', status: 'required', note: 'Considered unapproved drugs by FDA. Should not be in dietary supplements.' },
  { keywords: ['nmn', 'nicotinamide mononucleotide'], displayName: 'NMN', status: 'required', note: 'FDA has stated NMN is excluded from the definition of "dietary supplement" under DSHEA §201(ff)(3)(B). Current market posture is contested.' },
  { keywords: ['nad+', 'nicotinamide adenine dinucleotide'], displayName: 'NAD+', status: 'required', note: 'Similar regulatory posture to NMN — active FDA scrutiny.' },
];

// ============================================================
// CHECKER
// ============================================================

export interface NDIFinding {
  ingredientName: string;
  status: NDIStatus;
  match?: NDIEntry;
  /** The most severe messaging — shown on the card. */
  advisory: string;
}

/** Escape regex special characters in a literal keyword so that hyphens,
 *  parens, plus signs etc. are matched literally inside the `\b...\b`
 *  boundary regex. Added Wave 1.5d (2026-05-18) for the keyword-match
 *  discipline refactor. */
function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Cache compiled keyword regexes — `classifyIngredientNDI` is called
 *  per-ingredient inside `analyzeNDI`, so re-compiling on every call
 *  would burn cycles on large formulations. Cache key includes the
 *  boundary mode so the same keyword can compile to different regexes
 *  if it ever appeared with both modes (none currently does). */
const KEYWORD_REGEX_CACHE = new Map<string, RegExp>();
function keywordRegex(keyword: string, mode: NDIBoundaryMode = 'whole-word'): RegExp {
  const cacheKey = `${mode}::${keyword}`;
  const cached = KEYWORD_REGEX_CACHE.get(cacheKey);
  if (cached) return cached;
  const escaped = escapeRegex(keyword);
  // Case-insensitive match in either boundary mode:
  //   • 'whole-word' uses JavaScript's standard `\b` assertion (between
  //     \w and \W). For keywords with internal hyphens or spaces (e.g.
  //     'beta-carotene', 'sodium chloride'), \b fires only at outer
  //     boundaries because internal \W chars are matched literally
  //     between two \w runs.
  //   • 'standalone-token' uses lookbehind/lookahead asserting the
  //     keyword is NOT adjacent to letters, digits, or hyphens. Stricter
  //     than \b: treats hyphens as NON-boundaries so 'choline' does NOT
  //     match 'CDP-Choline' or 'Choline-Bitartrate'. Use ONLY for
  //     structural-moiety keywords (see NDIBoundaryMode docstring).
  const pattern = mode === 'standalone-token'
    ? `(?<![a-zA-Z0-9-])${escaped}(?![a-zA-Z0-9-])`
    : `\\b${escaped}\\b`;
  const re = new RegExp(pattern, 'i');
  KEYWORD_REGEX_CACHE.set(cacheKey, re);
  return re;
}

export function classifyIngredientNDI(name: string): NDIFinding {
  const n = name.toLowerCase();
  // Score by longest keyword match.
  // Wave 1.5d (2026-05-18) — refactored from `n.includes(k)` substring
  // matching to whole-word boundary matching to fix the choline-family
  // overgeneralization bug surfaced in operator verification (generic
  // 'choline' substring-matched phosphatidylcholine / alpha-gpc /
  // cdp-choline, classifying them grandfathered when branded forms have
  // specific NDIs). See KEYWORD_REGEX_CACHE + NDI_TABLE docstring.
  let best: { entry: NDIEntry; keywordLength: number } | null = null;
  for (const entry of NDI_TABLE) {
    const mode = entry.boundaryMode ?? 'whole-word';
    for (const k of entry.keywords) {
      if (keywordRegex(k, mode).test(n) && (!best || k.length > best.keywordLength)) {
        best = { entry, keywordLength: k.length };
      }
    }
  }
  if (!best) {
    return {
      ingredientName: name,
      status: 'unknown',
      advisory: 'Not in the platform\'s NDI reference table. Verify compliance status independently before marketing — if post-October 15, 1994 and not already the subject of an accepted NDI, a 75-day pre-market notification to FDA is required.',
    };
  }
  const e = best.entry;
  let advisory = '';
  switch (e.status) {
    case 'grandfathered':
      advisory = `Pre-1994 ODI (grandfathered).${e.note ? ' ' + e.note : ''}`;
      break;
    case 'notified':
      advisory = `NDI notification on file${e.ndiNumber ? ` (${e.ndiNumber})` : ''}. ${e.note ?? 'Verify your specific supplier form is covered by the accepted NDI.'}`;
      break;
    case 'gras-food':
      advisory = `Conventional food article / GRAS.${e.note ? ' ' + e.note : ''} Typically exempt from NDI notification when used at food-like levels.`;
      break;
    case 'required':
      advisory = `POST-1994 with NO known accepted NDI notification. 21 USC §350b/21 CFR 190.6 requires a 75-day pre-market notification before marketing.${e.note ? ' ' + e.note : ''} This is the single biggest compliance risk in the supplement industry — consult legal counsel before including.`;
      break;
    default:
      advisory = 'Verify regulatory status.';
  }
  return { ingredientName: name, status: e.status, match: e, advisory };
}

export interface NDISummary {
  findings: NDIFinding[];
  grandfathered: number;
  notified: number;
  grasFood: number;
  required: number;
  unknown: number;
  hasRisk: boolean;
}

export function analyzeNDI(ingredientNames: string[]): NDISummary {
  const findings = ingredientNames.map(n => classifyIngredientNDI(n));
  const grandfathered = findings.filter(f => f.status === 'grandfathered').length;
  const notified = findings.filter(f => f.status === 'notified').length;
  const grasFood = findings.filter(f => f.status === 'gras-food').length;
  const required = findings.filter(f => f.status === 'required').length;
  const unknown = findings.filter(f => f.status === 'unknown').length;
  return {
    findings,
    grandfathered, notified, grasFood, required, unknown,
    hasRisk: required > 0,
  };
}
