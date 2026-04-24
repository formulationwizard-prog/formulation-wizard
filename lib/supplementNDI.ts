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

export interface NDIEntry {
  keywords: string[];
  displayName: string;
  status: NDIStatus;
  note?: string;
  /** Optional FDA NDI report number when applicable. */
  ndiNumber?: string;
  /** Year the ingredient first appeared in the US market if relevant. */
  marketSinceYear?: number;
}

/**
 * Canonical classification table. Order matters: longer/more specific
 * keywords should appear before shorter generic ones.
 */
export const NDI_TABLE: NDIEntry[] = [
  // ─── Grandfathered (pre-1994) — the "Old Dietary Ingredient" (ODI) list ───
  { keywords: ['vitamin a', 'retinyl', 'retinol'], displayName: 'Vitamin A', status: 'grandfathered' },
  { keywords: ['beta-carotene', 'beta carotene'], displayName: 'Beta-Carotene', status: 'grandfathered' },
  { keywords: ['vitamin c', 'ascorbic acid', 'sodium ascorbate', 'calcium ascorbate'], displayName: 'Vitamin C', status: 'grandfathered' },
  { keywords: ['vitamin d', 'cholecalciferol', 'ergocalciferol'], displayName: 'Vitamin D', status: 'grandfathered' },
  { keywords: ['vitamin e', 'tocopherol'], displayName: 'Vitamin E', status: 'grandfathered' },
  { keywords: ['vitamin k', 'phytonadione', 'menaquinone', 'mk-4', 'mk-7'], displayName: 'Vitamin K', status: 'grandfathered', note: 'MK-7 specifically has a more recent NDI — GRAS notified.' },
  { keywords: ['thiamin', 'vitamin b1'], displayName: 'Thiamin (B1)', status: 'grandfathered' },
  { keywords: ['riboflavin', 'vitamin b2'], displayName: 'Riboflavin (B2)', status: 'grandfathered' },
  { keywords: ['niacin', 'niacinamide', 'nicotinamide'], displayName: 'Niacin (B3)', status: 'grandfathered' },
  { keywords: ['pantothen'], displayName: 'Pantothenic Acid (B5)', status: 'grandfathered' },
  { keywords: ['vitamin b6', 'pyridox', 'p-5-p', 'p5p'], displayName: 'Vitamin B6', status: 'grandfathered' },
  { keywords: ['folate', 'folic acid'], displayName: 'Folate', status: 'grandfathered' },
  { keywords: ['methylfolate', '5-mthf'], displayName: 'L-Methylfolate (5-MTHF)', status: 'notified', ndiNumber: 'NDI 612 / Quatrefolic', note: 'Specific branded forms have accepted NDIs; generic methylfolate may not.' },
  { keywords: ['vitamin b12', 'cobalamin', 'methylcobalamin'], displayName: 'Vitamin B12', status: 'grandfathered' },
  { keywords: ['biotin', 'vitamin b7'], displayName: 'Biotin (B7)', status: 'grandfathered' },
  { keywords: ['choline'], displayName: 'Choline', status: 'grandfathered' },

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
  { keywords: ['ashwagandh'], displayName: 'Ashwagandha', status: 'grandfathered', note: 'Branded KSM-66 and Sensoril have accepted NDIs for specific extract standardizations.' },
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
  { keywords: ['lactobacill', 'bifido', 'saccharo', 'bacillus', 'streptococcus'], displayName: 'Probiotic strains', status: 'notified', note: 'Strain-specific; common commercial strains (BC30, DE111, BB-12, HN019, NCFM, etc.) have accepted NDIs or GRAS status. Verify strain-by-strain.' },

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

export function classifyIngredientNDI(name: string): NDIFinding {
  const n = name.toLowerCase();
  // Score by longest keyword match
  let best: { entry: NDIEntry; keywordLength: number } | null = null;
  for (const entry of NDI_TABLE) {
    for (const k of entry.keywords) {
      if (n.includes(k) && (!best || k.length > best.keywordLength)) {
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
