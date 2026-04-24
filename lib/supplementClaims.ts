// ============================================================
// SUPPLEMENT CLAIMS VALIDATOR
// ------------------------------------------------------------
// Supplement labels make three legally-distinct kinds of claims:
//
//  1. NUTRIENT CONTENT CLAIMS — 21 CFR 101.54 / 101.13
//     "High in", "Good source of", "Excellent source of"
//     Dose-triggered: tied to %DV per serving.
//
//  2. STRUCTURE/FUNCTION CLAIMS — 21 CFR 101.93 (DSHEA §6)
//     "Supports immune function", "Helps manage stress", etc.
//     Must not cross into disease-claim territory. Requires the
//     DSHEA disclaimer: "These statements have not been evaluated
//     by the Food and Drug Administration…"
//
//  3. HEALTH CLAIMS — 21 CFR 101.70 / 101.14
//     "Calcium may reduce risk of osteoporosis." Only a narrow
//     set of pre-authorized claims are permitted on supplements.
//
// This engine:
//   • Auto-surfaces available nutrient-content claims based on
//     the current formula's per-serving %DV values.
//   • Provides a curated structure/function claim library keyed
//     to ingredients, with citations.
//   • Flags disease-claim language in a user-drafted copy.
//   • Generates required disclaimers for the active claim set.
// ============================================================

// ============================================================
// NUTRIENT CONTENT CLAIM THRESHOLDS (21 CFR 101.54)
// ============================================================

export interface ContentClaim {
  nutrient: string;                    // Display name (e.g., "Vitamin C")
  minPercentDV: number;                // Threshold to qualify
  claimLabel: string;                  // "High", "Excellent source", "Good source", etc.
  templates: string[];                 // Suggested marketing phrasings
}

/** 21 CFR 101.54 thresholds for % Daily Value-based nutrient content claims. */
export const CONTENT_CLAIM_THRESHOLDS = [
  { threshold: 100, tier: 'Complete',           templates: ['{nutrient} — 100% Daily Value', 'Full daily value of {nutrient}'] },
  { threshold: 50,  tier: 'Concentrated',       templates: ['A concentrated source of {nutrient}'] },
  { threshold: 20,  tier: 'High / Excellent source', templates: ['High in {nutrient}', 'Excellent source of {nutrient}', 'Rich in {nutrient}'] },
  { threshold: 10,  tier: 'Good source',        templates: ['Good source of {nutrient}', 'Contains {nutrient}'] },
];

/**
 * Compute nutrient-content claims available for a formula based on per-serving %DV.
 */
export function detectNutrientContentClaims(
  nutrientPercentDV: Array<{ nutrient: string; percentDV: number }>
): ContentClaim[] {
  const claims: ContentClaim[] = [];
  for (const n of nutrientPercentDV) {
    if (n.percentDV < 10) continue;
    // Pick the highest-tier claim the nutrient qualifies for
    const tier = CONTENT_CLAIM_THRESHOLDS.find(t => n.percentDV >= t.threshold);
    if (!tier) continue;
    claims.push({
      nutrient: n.nutrient,
      minPercentDV: tier.threshold,
      claimLabel: tier.tier,
      templates: tier.templates.map(t => t.replace(/\{nutrient\}/g, n.nutrient)),
    });
  }
  return claims.sort((a, b) => b.minPercentDV - a.minPercentDV);
}

// ============================================================
// STRUCTURE / FUNCTION CLAIM LIBRARY
// ------------------------------------------------------------
// Each entry is a defensible structure/function claim for a
// specific ingredient with clinical support. Citation refers to
// the body of evidence (NIH ODS fact sheets, clinical reviews,
// Natural Medicines Comprehensive Database, etc.).
//
// These claims do NOT guarantee FDA non-objection. DSHEA requires
// the marketer to substantiate competent and reliable scientific
// evidence. The platform provides the starting point; the user
// should have legal counsel review any claim before use.
// ============================================================

export interface StructureFunctionClaim {
  keywords: string[];                  // Ingredient-name match
  ingredient: string;                  // Display name
  claims: string[];                    // Compliant claim templates
  minDose?: string;                    // Minimum efficacious dose per serving
  citation: string;                    // Source of evidence
  note?: string;                       // Additional guidance
}

export const STRUCTURE_FUNCTION_LIBRARY: StructureFunctionClaim[] = [
  // ─── Vitamins ────────────────────────────────────────────
  {
    keywords: ['vitamin c', 'ascorbic acid', 'sodium ascorbate'],
    ingredient: 'Vitamin C',
    claims: [
      'Supports immune function',
      'Provides antioxidant activity',
      'Helps maintain healthy connective tissue',
    ],
    minDose: '60 mg (67% DV)',
    citation: 'NIH ODS Vitamin C Fact Sheet',
  },
  {
    keywords: ['vitamin d', 'cholecalciferol', 'ergocalciferol'],
    ingredient: 'Vitamin D',
    claims: [
      'Supports bone health',
      'Helps the body absorb calcium',
      'Supports immune system function',
      'Supports muscle function',
    ],
    minDose: '10 mcg (50% DV)',
    citation: 'NIH ODS Vitamin D Fact Sheet',
  },
  {
    keywords: ['vitamin b12', 'cobalamin', 'methylcobalamin'],
    ingredient: 'Vitamin B12',
    claims: [
      'Supports energy metabolism',
      'Helps maintain normal nervous system function',
      'Supports red blood cell formation',
    ],
    minDose: '2.4 mcg (100% DV)',
    citation: 'NIH ODS Vitamin B12 Fact Sheet',
  },
  {
    keywords: ['folate', 'folic acid', 'methylfolate'],
    ingredient: 'Folate',
    claims: [
      'Supports healthy cell division',
      'Supports prenatal health',
    ],
    minDose: '400 mcg DFE (100% DV)',
    citation: 'NIH ODS Folate Fact Sheet',
    note: 'Prenatal products: avoid disease language about neural tube defects (this is an authorized health claim, not a structure/function claim).',
  },

  // ─── Minerals ────────────────────────────────────────────
  {
    keywords: ['calcium'],
    ingredient: 'Calcium',
    claims: [
      'Supports strong bones',
      'Helps maintain healthy teeth',
      'Supports muscle function',
    ],
    minDose: '130 mg (10% DV)',
    citation: 'NIH ODS Calcium Fact Sheet',
  },
  {
    keywords: ['magnesium'],
    ingredient: 'Magnesium',
    claims: [
      'Supports relaxation',
      'Supports energy metabolism',
      'Supports healthy muscle function',
      'Helps maintain normal nerve function',
    ],
    minDose: '42 mg (10% DV)',
    citation: 'NIH ODS Magnesium Fact Sheet',
  },
  {
    keywords: ['zinc'],
    ingredient: 'Zinc',
    claims: [
      'Supports immune health',
      'Supports wound healing',
    ],
    minDose: '1.1 mg (10% DV)',
    citation: 'NIH ODS Zinc Fact Sheet',
  },
  {
    keywords: ['iron', 'ferrous'],
    ingredient: 'Iron',
    claims: [
      'Supports red blood cell formation',
      'Helps carry oxygen throughout the body',
    ],
    minDose: '1.8 mg (10% DV)',
    citation: 'NIH ODS Iron Fact Sheet',
  },

  // ─── Amino acids / specialty ─────────────────────────────
  {
    keywords: ['creatine'],
    ingredient: 'Creatine Monohydrate',
    claims: [
      'Supports muscle performance during high-intensity exercise',
      'Supports strength and power output',
    ],
    minDose: '3-5 g/day',
    citation: 'International Society of Sports Nutrition position stand (Kreider 2017)',
  },
  {
    keywords: ['l-theanine', 'theanine'],
    ingredient: 'L-Theanine',
    claims: [
      'Supports a calm, focused mental state',
      'Promotes relaxation without drowsiness',
    ],
    minDose: '100-200 mg',
    citation: 'Nobre 2008; Hidese 2019',
  },
  {
    keywords: ['taurine'],
    ingredient: 'Taurine',
    claims: ['Supports cardiovascular function', 'Supports antioxidant activity'],
    minDose: '500-2,000 mg',
    citation: 'Natural Medicines Comprehensive Database',
  },

  // ─── Herbals ─────────────────────────────────────────────
  {
    keywords: ['ashwagandh'],
    ingredient: 'Ashwagandha',
    claims: [
      'Helps the body manage stress (adaptogen)',
      'Supports a healthy stress response',
      'Supports restful sleep',
    ],
    minDose: '300-600 mg standardized extract',
    citation: 'Chandrasekhar 2012; Salve 2019 (KSM-66)',
    note: 'Do not claim "reduces cortisol" — that borders on disease/biomarker claims.',
  },
  {
    keywords: ['turmeric', 'curcumin'],
    ingredient: 'Turmeric / Curcumin',
    claims: [
      'Supports a healthy inflammatory response',
      'Provides antioxidant support',
      'Supports joint comfort',
    ],
    minDose: '500-1,000 mg standardized curcuminoids (95%)',
    citation: 'Hewlings 2017; Daily 2016',
  },
  {
    keywords: ['rhodiola'],
    ingredient: 'Rhodiola Rosea',
    claims: [
      'Helps the body adapt to stress (adaptogen)',
      'Supports mental stamina and focus',
    ],
    minDose: '200-400 mg standardized (3% rosavins / 1% salidrosides)',
    citation: 'Ishaque 2012',
  },
  {
    keywords: ['ginkgo'],
    ingredient: 'Ginkgo Biloba',
    claims: [
      'Supports cognitive performance',
      'Supports healthy circulation',
    ],
    minDose: '120-240 mg standardized extract (24/6)',
    citation: 'Tan 2015',
  },
  {
    keywords: ['elderberry', 'sambucus'],
    ingredient: 'Elderberry',
    claims: [
      'Supports immune function',
      'Provides antioxidant support',
    ],
    minDose: '300-900 mg standardized extract',
    citation: 'Hawkins 2019',
  },
  {
    keywords: ['echinacea'],
    ingredient: 'Echinacea',
    claims: ['Supports immune function'],
    minDose: '400 mg standardized extract',
    citation: 'Karsch-Völk 2014',
  },
  {
    keywords: ['saw palmetto'],
    ingredient: 'Saw Palmetto',
    claims: ['Supports prostate health'],
    minDose: '320 mg CO₂ extract (85% fatty acids)',
    citation: 'Tacklind 2012',
    note: 'Prostate cancer claims are disease claims — forbidden.',
  },
  {
    keywords: ['milk thistle', 'silymarin'],
    ingredient: 'Milk Thistle',
    claims: ['Supports liver function'],
    minDose: '200-400 mg standardized silymarin (80%)',
    citation: 'Natural Medicines Comprehensive Database',
    note: 'Avoid "detox" language — not FDA-recognized.',
  },

  // ─── Mushrooms ───────────────────────────────────────────
  {
    keywords: ["lion's mane", 'lions mane', 'hericium'],
    ingredient: "Lion's Mane",
    claims: [
      'Supports cognitive function',
      'Supports nervous system health',
    ],
    minDose: '500-1,000 mg fruiting body extract',
    citation: 'Mori 2009',
    note: 'Do not use Alzheimer\'s, dementia, or neurodegenerative language.',
  },
  {
    keywords: ['reishi', 'ganoderma'],
    ingredient: 'Reishi',
    claims: ['Supports immune function', 'Supports stress management'],
    minDose: '500-1,000 mg fruiting body extract',
    citation: 'Jin 2016',
  },
  {
    keywords: ['cordyceps'],
    ingredient: 'Cordyceps',
    claims: ['Supports athletic performance', 'Supports energy metabolism'],
    minDose: '1-3 g extract',
    citation: 'Hirsch 2017',
  },

  // ─── Omega-3 / fats ──────────────────────────────────────
  {
    keywords: ['fish oil', 'omega-3', 'epa', 'dha', 'algae oil', 'krill oil'],
    ingredient: 'EPA + DHA (Omega-3)',
    claims: [
      'Supports heart health',
      'Supports brain function',
      'Supports healthy triglyceride levels already within normal range',
    ],
    minDose: '250 mg combined EPA + DHA',
    citation: 'AHA 2019; GOED 2023',
    note: 'Heart disease prevention language is forbidden — use "supports cardiovascular health" instead.',
  },

  // ─── Sleep / relaxation ──────────────────────────────────
  {
    keywords: ['melatonin'],
    ingredient: 'Melatonin',
    claims: [
      'Supports restful sleep',
      'Helps regulate sleep-wake cycles',
    ],
    minDose: '0.3-5 mg 30-60 min before bed',
    citation: 'AASM 2015',
    note: 'Cap adult OTC at 5 mg; avoid pediatric formulations.',
  },

  // ─── Probiotics ──────────────────────────────────────────
  {
    keywords: ['lactobacill', 'bifido', 'saccharo', 'probiotic'],
    ingredient: 'Probiotic (multi-strain)',
    claims: [
      'Supports digestive health',
      'Supports a healthy gut microbiome',
      'Supports immune function',
    ],
    minDose: '1-10 billion CFU at expiry',
    citation: 'Sanders 2019',
    note: 'Strain-specific claims require strain-specific evidence. CFU claim must be guaranteed through expiry.',
  },
];

/**
 * Surface defensible structure/function claims for every recognized ingredient in the formula.
 */
export function detectStructureFunctionClaims(
  ingredientNames: string[]
): StructureFunctionClaim[] {
  const matches: StructureFunctionClaim[] = [];
  const seen = new Set<string>();
  for (const name of ingredientNames) {
    const n = name.toLowerCase();
    for (const entry of STRUCTURE_FUNCTION_LIBRARY) {
      if (seen.has(entry.ingredient)) continue;
      if (entry.keywords.some(k => n.includes(k))) {
        matches.push(entry);
        seen.add(entry.ingredient);
      }
    }
  }
  return matches;
}

// ============================================================
// DISEASE-CLAIM DETECTOR
// ------------------------------------------------------------
// Language patterns that cross the line from structure/function
// into disease claim — the FDA's most-enforced DSHEA violation.
// ============================================================

export interface DiseaseClaimFlag {
  match: string;
  tier: 'disease' | 'caution' | 'drug-claim';
  explanation: string;
  suggestion?: string;
}

/** Regexes (case-insensitive) that flag disease / drug-claim language. */
const DISEASE_PATTERNS: Array<{ pattern: RegExp; tier: 'disease' | 'caution' | 'drug-claim'; explanation: string; suggestion?: string }> = [
  // Explicit disease names
  { pattern: /\b(cancer|carcinoma|tumor|oncology)\b/i, tier: 'disease', explanation: 'Cancer claims are drug claims. Remove entirely.' },
  { pattern: /\b(heart disease|heart attack|myocardial)\b/i, tier: 'disease', explanation: 'Cardiovascular disease claims are drug claims.', suggestion: 'Use "supports heart health" instead.' },
  { pattern: /\b(diabetes|diabetic|blood sugar control)\b/i, tier: 'disease', explanation: 'Diabetes and glycemic control claims are drug claims.', suggestion: 'Use "supports healthy blood sugar already within normal range".' },
  { pattern: /\b(hypertension|high blood pressure)\b/i, tier: 'disease', explanation: 'Blood pressure reduction is a drug claim.', suggestion: 'Use "supports healthy blood pressure already within normal range".' },
  { pattern: /\b(depression|anxiety disorder|bipolar|schizophren)\b/i, tier: 'disease', explanation: 'Mental health condition claims are drug claims.', suggestion: 'Use "supports a positive mood" or "helps manage stress".' },
  { pattern: /\b(alzheimer|dementia|parkinson|multiple sclerosis|als)\b/i, tier: 'disease', explanation: 'Neurodegenerative disease claims are drug claims.' },
  { pattern: /\b(arthritis|osteoporosis|osteopenia)\b/i, tier: 'disease', explanation: 'Named skeletal condition claims are drug claims (osteoporosis is an authorized health claim only for calcium/vitamin D with specific language).' },
  { pattern: /\b(ulcer|colitis|crohn|ibd|ibs|reflux)\b/i, tier: 'disease', explanation: 'GI disease claims are drug claims.' },
  { pattern: /\b(asthma|emphysema|copd)\b/i, tier: 'disease', explanation: 'Respiratory disease claims are drug claims.' },
  { pattern: /\b(insomnia|sleep disorder)\b/i, tier: 'disease', explanation: '"Insomnia" is a disease claim.', suggestion: 'Use "supports restful sleep" instead.' },
  { pattern: /\b(erectile dysfunction|impotence)\b/i, tier: 'disease', explanation: 'ED is a disease condition.' },
  { pattern: /\b(hiv|aids|herpes|influenza|covid|coronavirus)\b/i, tier: 'disease', explanation: 'Infectious disease treatment/prevention claims are drug claims.' },
  { pattern: /\b(stroke|thrombosis|embolism)\b/i, tier: 'disease', explanation: 'Cardiovascular event claims are drug claims.' },

  // Drug-claim verbs — the most common trap
  { pattern: /\b(treats?|treated|treating|treatment of)\b/i, tier: 'drug-claim', explanation: '"Treats" is a drug claim.', suggestion: 'Use "supports" instead.' },
  { pattern: /\b(cures?|curing|cure for)\b/i, tier: 'drug-claim', explanation: '"Cures" is a drug claim. Remove entirely.' },
  { pattern: /\b(prevents?|preventing|prevention of)\b/i, tier: 'drug-claim', explanation: '"Prevents" is almost always a drug claim.', suggestion: 'Use "supports" or "helps maintain".' },
  { pattern: /\b(diagnoses?|diagnosing|diagnosis of)\b/i, tier: 'drug-claim', explanation: 'Diagnostic claims are drug claims.' },
  { pattern: /\b(mitigates?|mitigating|mitigation of)\b/i, tier: 'drug-claim', explanation: '"Mitigates" is in the DSHEA statutory definition of a drug claim.' },
  { pattern: /\b(heals?|healing)\b/i, tier: 'drug-claim', explanation: '"Heals" implies disease treatment.', suggestion: 'Use "supports recovery" or similar.' },
  { pattern: /\b(reduces? pain|pain relief|pain reliever)\b/i, tier: 'drug-claim', explanation: 'Pain relief is a drug claim.', suggestion: 'Use "supports joint comfort" or similar.' },
  { pattern: /\b(lowers? cholesterol|reduces? cholesterol|lowers? blood pressure)\b/i, tier: 'drug-claim', explanation: 'Biomarker-lowering claims are drug claims.' },

  // Caution language — context-dependent
  { pattern: /\b(FDA approved|FDA-approved|clinically proven|doctor recommended)\b/i, tier: 'caution', explanation: 'Supplements are not FDA-approved. These phrases mislead consumers and trigger FTC action.' },
  { pattern: /\b(miracle|breakthrough|revolutionary|guaranteed)\b/i, tier: 'caution', explanation: 'Puffery like this invites FTC deceptive-marketing scrutiny.' },
  { pattern: /\b(natural|all natural)\b/i, tier: 'caution', explanation: '"Natural" has no FDA definition and invites class-action suits. Define it carefully if used.' },
  { pattern: /\bdetox/i, tier: 'caution', explanation: '"Detox" is not an FDA-recognized concept and courts have treated it as misleading.', suggestion: 'Use "supports healthy liver function" or similar.' },
  { pattern: /\bimmune booster|boost(s|ing)? (your )?immunity/i, tier: 'caution', explanation: '"Boosts immunity" implies disease prevention to consumers. FDA has issued warning letters.', suggestion: 'Use "supports immune function" instead.' },
  { pattern: /\bweight loss|lose weight|burn fat|fat burner/i, tier: 'caution', explanation: 'Weight-loss claims face intense FTC scrutiny and typically require human clinical trials to substantiate.', suggestion: 'Use "supports healthy weight management as part of a diet and exercise program".' },
];

export function analyzeDraftClaim(text: string): DiseaseClaimFlag[] {
  if (!text || !text.trim()) return [];
  const flags: DiseaseClaimFlag[] = [];
  for (const { pattern, tier, explanation, suggestion } of DISEASE_PATTERNS) {
    const m = text.match(pattern);
    if (m) {
      flags.push({ match: m[0], tier, explanation, suggestion });
    }
  }
  // Dedupe by match phrase (case-insensitive)
  const seen = new Set<string>();
  return flags.filter(f => {
    const k = f.match.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

// ============================================================
// REQUIRED DISCLAIMERS
// ============================================================

export interface DisclaimerSet {
  dsheaDisclaimer: string;
  additionalWarnings: string[];
}

/**
 * Build the required disclaimer block for a claim set.
 * The DSHEA "These statements have not been evaluated…" disclaimer
 * is required on every supplement that makes any structure/function claim.
 */
export function buildDisclaimers(
  hasStructureFunctionClaim: boolean,
  ingredientNames: string[]
): DisclaimerSet {
  const n = ingredientNames.map(s => s.toLowerCase()).join(' | ');
  const additional: string[] = [];
  // Iron warning (FDA-mandated for any iron supplement)
  if (/iron|ferrous/.test(n)) {
    additional.push('WARNING: Accidental overdose of iron-containing products is a leading cause of fatal poisoning in children under 6. Keep out of reach of children. In case of accidental overdose, call a doctor or poison control center immediately.');
  }
  // Pregnancy warnings
  if (/vitamin a palmitate|retinyl|retinol/.test(n) && !/beta-carotene/.test(n)) {
    additional.push('Pregnant or nursing women, consult your healthcare provider before use. Preformed Vitamin A at high levels may affect fetal development.');
  }
  // Anticoagulant interactions
  if (/vitamin e|ginkgo|garlic|vitamin k|menaquinone|fish oil|omega-3/.test(n)) {
    additional.push('If you are taking blood-thinning medication, consult your healthcare provider before use.');
  }
  // Kava warning
  if (/kava/.test(n)) {
    additional.push('Consult a healthcare provider before use. Use has been associated with rare cases of severe liver injury.');
  }
  // Caffeine
  if (/caffeine/.test(n)) {
    additional.push('Contains caffeine. Limit the use of caffeine-containing medications or foods while taking this product. Not for use by those under 18.');
  }
  return {
    dsheaDisclaimer: hasStructureFunctionClaim
      ? '* These statements have not been evaluated by the Food and Drug Administration. This product is not intended to diagnose, treat, cure, or prevent any disease.'
      : '',
    additionalWarnings: additional,
  };
}
