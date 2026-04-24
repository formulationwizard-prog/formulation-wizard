// ============================================================
// INGREDIENT COMPATIBILITY CHECKER
// ------------------------------------------------------------
// Detects formulation-science problems that wouldn't be caught by
// dosage or regulatory checks — the kind of mistakes that make
// a product fail in the bottle, on the shelf, or during QA:
//
//   • Incompatible pairs (oxidation, complexation, Maillard, etc.)
//   • Moisture/hygroscopy issues when packaging is wrong
//   • Capsule-shell + fill incompatibilities
//   • Mineral antagonisms (zinc depletes copper, etc.)
//   • Light/oxygen-sensitive pairings that need co-formulation
//
// Severity tiers mirror the existing safety cards:
//   critical → structural failure likely (product will fail spec)
//   warning  → stability or efficacy impact expected
//   caution  → consider mitigation / documentation
//   info     → design consideration
// ============================================================
import type { Ingredient } from '../types';

export type CompatibilityTier = 'critical' | 'warning' | 'caution' | 'info';

export interface CompatibilityFinding {
  tier: CompatibilityTier;
  title: string;
  /** Names of the offending ingredient(s). */
  ingredients: string[];
  /** Plain-English explanation. */
  issue: string;
  /** Remediation / design advice. */
  remedy: string;
  citation?: string;
}

// ============================================================
// PAIRWISE INCOMPATIBILITY RULES
// ------------------------------------------------------------
// Each rule tests whether both A and B are present. Keyword match
// is case-insensitive substring.
// ============================================================

interface PairRule {
  aKeywords: string[];
  bKeywords: string[];
  tier: CompatibilityTier;
  title: string;
  issue: string;
  remedy: string;
  citation?: string;
}

const PAIR_RULES: PairRule[] = [
  // Iron + Vitamin E — pro-oxidant iron destroys vitamin E activity
  {
    aKeywords: ['iron', 'ferrous'],
    bKeywords: ['vitamin e', 'tocopherol'],
    tier: 'warning',
    title: 'Iron + Vitamin E — pro-oxidant pairing',
    issue: 'Iron catalyzes oxidation of Vitamin E. Co-formulated in the same matrix, Vitamin E potency will drop faster than stability estimates suggest.',
    remedy: 'Separate into different layers / dosing windows, use chelated (bisglycinate) iron which is less pro-oxidant, or accept an elevated overage on Vit E.',
    citation: 'USP <1151>; CRN Handbook',
  },
  // Calcium + Iron — compete for absorption
  {
    aKeywords: ['calcium'],
    bKeywords: ['iron', 'ferrous'],
    tier: 'caution',
    title: 'Calcium + Iron — absorption competition',
    issue: 'Calcium significantly reduces iron absorption (up to 60% at co-ingestion). Critical for iron-deficient populations.',
    remedy: 'Split between AM (iron) and PM (calcium) products, or accept reduced iron bioavailability in the claim dose.',
    citation: 'Lonnerdal 2010',
  },
  // Calcium + Phosphate — insoluble Ca3(PO4)2
  {
    aKeywords: ['calcium'],
    bKeywords: ['phosphate', 'phosphorus'],
    tier: 'warning',
    title: 'Calcium + Phosphate — insoluble precipitate',
    issue: 'Calcium + phosphate form insoluble tricalcium phosphate. At the calcium doses typical in multivitamins, this visibly reduces phosphate availability and can cause tablet discoloration.',
    remedy: 'Use calcium citrate (more soluble) or split formats. Keep total phosphate minimal.',
  },
  // Zinc + Copper ratio
  {
    aKeywords: ['zinc'],
    bKeywords: ['copper'],
    tier: 'info',
    title: 'Zinc + Copper — maintain ratio',
    issue: 'Zinc above ~15 mg/day depletes copper over time. The canonical Zn:Cu ratio is 10:1 to 15:1.',
    remedy: 'If zinc > 15 mg/serving, include 1-2 mg copper to prevent long-term depletion.',
    citation: 'Gibson 2008',
  },
  // Vitamin C + Reducing sugars (Maillard browning in gummies / powders)
  {
    aKeywords: ['ascorbic acid', 'vitamin c', 'sodium ascorbate'],
    bKeywords: ['sucrose', 'glucose', 'fructose', 'honey', 'agave', 'maple'],
    tier: 'warning',
    title: 'Vitamin C + Reducing sugars — Maillard browning',
    issue: 'Ascorbic acid reacts with reducing sugars during heat processing and storage, causing brown discoloration and Vitamin C loss.',
    remedy: 'Use non-reducing sweeteners (erythritol, xylitol, stevia, allulose). If sugar is required, process at low temperature and hold chilled.',
    citation: 'Belitz Food Chemistry',
  },
  // Vitamin C + Copper (pro-oxidant)
  {
    aKeywords: ['ascorbic acid', 'vitamin c'],
    bKeywords: ['copper'],
    tier: 'caution',
    title: 'Vitamin C + Copper — pro-oxidant cycle',
    issue: 'Vitamin C reduces Cu(II) to Cu(I), which catalyzes oxidation of other sensitive actives (notably Vitamin A and E).',
    remedy: 'Chelated copper (glycinate) reduces the effect. Amber packaging + desiccant + nitrogen flush all mitigate.',
  },
  // Iodine + Vitamin C — destabilizes iodine
  {
    aKeywords: ['iodine', 'potassium iodide'],
    bKeywords: ['ascorbic acid', 'vitamin c'],
    tier: 'warning',
    title: 'Iodine + Vitamin C — iodine loss',
    issue: 'Ascorbic acid reduces iodine to iodide, which is then volatilized. Gummies and liquids are especially vulnerable.',
    remedy: 'Encapsulated / granulated iodine premixes exist. Otherwise, consider a different form of iodine (kelp) or separate products.',
  },
  // Magnesium stearate + Certain botanicals
  {
    aKeywords: ['magnesium stearate'],
    bKeywords: ['probiotic', 'lactobacill', 'bifido'],
    tier: 'caution',
    title: 'Magnesium stearate + Probiotics — hydrophobic film',
    issue: 'Magnesium stearate forms a hydrophobic coating that can delay probiotic hydration and disintegration in the GI tract.',
    remedy: 'Minimize Mg stearate (< 1%), switch to rice hull concentrate or silica as the flow aid, or use vegetable stearates.',
  },
  // Fish oil + Heat-sensitive actives
  {
    aKeywords: ['fish oil', 'krill oil', 'omega-3', 'algae oil'],
    bKeywords: ['probiotic', 'enzyme', 'bromelain', 'papain'],
    tier: 'warning',
    title: 'Fish oil + Heat-sensitive actives — co-processing risk',
    issue: 'Softgel encapsulation heat + oxidation from fish oil degrades probiotics and enzymes rapidly.',
    remedy: 'Keep fish oil softgels separate from heat-sensitive actives. Multi-component daily packs are the common solution.',
  },
  // Melatonin + 5-HTP
  {
    aKeywords: ['melatonin'],
    bKeywords: ['5-htp', '5-hydroxytryptophan', 'tryptophan'],
    tier: 'caution',
    title: 'Melatonin + 5-HTP — serotonergic stacking',
    issue: '5-HTP is a precursor to serotonin/melatonin; stacking both may be unnecessary and amplifies serotonin-syndrome risk with SSRI users.',
    remedy: 'Label with an SSRI/MAOI interaction warning. Consider whether the stacking is clinically justified for the claim.',
  },
  // Caffeine + L-Theanine (NOT a problem — noted for confirmation)
  {
    aKeywords: ['caffeine'],
    bKeywords: ['l-theanine', 'theanine'],
    tier: 'info',
    title: 'Caffeine + L-Theanine — classic synergy',
    issue: 'This is a well-established synergy (1:2 ratio caffeine:theanine for calm-focus).',
    remedy: 'Typical ratio: 100 mg caffeine + 200 mg L-theanine. Good combination.',
  },
];

// ============================================================
// INGREDIENT-ALONE RULES (format / packaging conflicts)
// ============================================================

interface SingleRule {
  keywords: string[];
  requires: (conditions: CompatibilityConditions) => boolean;
  tier: CompatibilityTier;
  title: string;
  issue: string;
  remedy: string;
  citation?: string;
}

export interface CompatibilityConditions {
  deliveryForm: 'capsule' | 'tablet' | 'softgel' | 'gummy' | 'powder' | 'liquid' | 'lozenge' | 'chewable';
  capsuleShell?: 'gelatin' | 'hpmc' | 'none';
  hasDesiccant: boolean;
  hasNitrogenFlush: boolean;
  hasAmberPackaging: boolean;
  storage: 'ambient' | 'refrigerated' | 'frozen';
}

const SINGLE_RULES: SingleRule[] = [
  // Hygroscopic B-vitamins without desiccant
  {
    keywords: ['thiamin', 'niacinamide', 'pantothen', 'calcium pantothenate'],
    requires: c => !c.hasDesiccant,
    tier: 'warning',
    title: 'Hygroscopic B-vitamin without desiccant',
    issue: 'Thiamine and other hygroscopic B-vitamins pick up moisture from the bottle headspace and cake / degrade rapidly.',
    remedy: 'Add silica gel desiccant (2 g pouch) to the bottle before closure.',
  },
  // Probiotics without desiccant + refrigeration
  {
    keywords: ['lactobacill', 'bifido', 'saccharo', 'bacillus', 'probiotic'],
    requires: c => !c.hasDesiccant || c.storage === 'ambient',
    tier: 'warning',
    title: 'Probiotic without desiccant / room-temp storage',
    issue: 'Probiotics are moisture-sensitive and their die-off accelerates at ambient temperature. Shelf-life stability data almost always shows faster CFU loss without these controls.',
    remedy: 'Always include desiccant. Bacillus-coagulans and spore-formers tolerate ambient; Lactobacillus / Bifidobacterium strongly benefit from refrigeration.',
  },
  // Fish oil without amber + nitrogen
  {
    keywords: ['fish oil', 'krill oil', 'algae oil', 'epa', 'dha'],
    requires: c => !c.hasAmberPackaging || !c.hasNitrogenFlush,
    tier: 'critical',
    title: 'Omega-3 oil without amber / nitrogen flush',
    issue: 'Fish, krill, and algae oils oxidize rapidly. Without amber bottles AND nitrogen-flush headspace, oxidation values (peroxide, p-anisidine, TOTOX) blow past GOED voluntary limits within months.',
    remedy: 'Amber bottle + nitrogen-flush headspace + tocopherol antioxidant in the oil phase are all effectively non-negotiable.',
    citation: 'GOED Voluntary Monograph',
  },
  // Retinol / Vit A without amber
  {
    keywords: ['vitamin a palmitate', 'retinyl', 'retinol'],
    requires: c => !c.hasAmberPackaging,
    tier: 'warning',
    title: 'Retinol without amber packaging',
    issue: 'Preformed vitamin A is extremely light-sensitive. Loss can exceed 30% in 12 months in clear packaging.',
    remedy: 'Amber HDPE or opaque foil-lined packaging. Add tocopherol antioxidant to the beadlet carrier.',
  },
  // Folate without amber
  {
    keywords: ['folate', 'folic acid', 'methylfolate'],
    requires: c => !c.hasAmberPackaging,
    tier: 'caution',
    title: 'Folate without amber packaging',
    issue: 'Folic acid and methylfolate are light- and oxidation-sensitive. Clear packaging + no desiccant commonly loses 20%+ in 24 months.',
    remedy: 'Amber packaging + desiccant.',
  },
  // B12 (riboflavin / B2) without amber
  {
    keywords: ['riboflavin', 'vitamin b2'],
    requires: c => !c.hasAmberPackaging,
    tier: 'caution',
    title: 'Riboflavin without amber packaging',
    issue: 'Riboflavin is extremely light-sensitive and photodegrades rapidly. Also colors urine bright yellow — expected but worth noting on label.',
    remedy: 'Amber packaging required.',
  },
  // Moisture-sensitive in HPMC
  {
    keywords: ['calcium ascorbate', 'sodium ascorbate', 'ferrous bisglycinate', 'magnesium glycinate'],
    requires: c => c.capsuleShell === 'hpmc',
    tier: 'info',
    title: 'Hygroscopic mineral in HPMC capsule — good choice',
    issue: 'HPMC capsules don\'t pick up moisture from moisture-releasing ingredients the way gelatin does.',
    remedy: 'Keep the HPMC choice for this formulation.',
  },
  // Gelatin + hygroscopic creates sticky capsules
  {
    keywords: ['glycerin', 'sorbitol', 'honey', 'molasses'],
    requires: c => c.capsuleShell === 'gelatin',
    tier: 'warning',
    title: 'Humectant inside gelatin capsule',
    issue: 'Glycerin / sorbitol / honey soften gelatin capsules over time — caps become sticky and distorted.',
    remedy: 'Use HPMC (vegetable) capsules, or reformulate to remove the humectant from the fill.',
  },
  // Coenzyme Q10 without oil-based delivery
  {
    keywords: ['coenzyme q10', 'coq10', 'ubiquinone', 'ubiquinol'],
    requires: c => c.deliveryForm === 'tablet' || c.deliveryForm === 'capsule' || c.deliveryForm === 'powder',
    tier: 'caution',
    title: 'CoQ10 in dry format — low bioavailability',
    issue: 'CoQ10 is fat-soluble; dry tablets/capsules/powders have 3-5x lower bioavailability than oil-based softgels.',
    remedy: 'Softgel with MCT or olive oil carrier, or a solubilized CoQ10 form (e.g., MicroActive, Qu-H₂).',
    citation: 'Miles 2007',
  },
];

// ============================================================
// CAPSULE-SHELL COMPATIBILITY
// ============================================================

/** Derive capsule shell type from the capsule entry in the packaging or a default. */
function inferCapsuleShell(deliveryForm: CompatibilityConditions['deliveryForm']): CompatibilityConditions['capsuleShell'] {
  if (deliveryForm === 'capsule') return 'gelatin'; // conservative default
  if (deliveryForm === 'softgel') return 'gelatin';
  return 'none';
}

// ============================================================
// MAIN CHECKER
// ============================================================

export function checkCompatibility(
  ingredients: Ingredient[],
  conditions: CompatibilityConditions
): CompatibilityFinding[] {
  const findings: CompatibilityFinding[] = [];
  const names = ingredients.map(i => i.name.toLowerCase());

  // Pairwise rules
  for (const rule of PAIR_RULES) {
    const aMatch = ingredients.find(i => rule.aKeywords.some(k => i.name.toLowerCase().includes(k)));
    const bMatch = ingredients.find(i => rule.bKeywords.some(k => i.name.toLowerCase().includes(k)));
    if (aMatch && bMatch && aMatch.name !== bMatch.name) {
      findings.push({
        tier: rule.tier,
        title: rule.title,
        ingredients: [aMatch.name, bMatch.name],
        issue: rule.issue,
        remedy: rule.remedy,
        citation: rule.citation,
      });
    }
  }

  // Single-ingredient rules
  const effectiveShell = conditions.capsuleShell ?? inferCapsuleShell(conditions.deliveryForm);
  const effectiveConditions: CompatibilityConditions = { ...conditions, capsuleShell: effectiveShell };
  for (const rule of SINGLE_RULES) {
    const match = ingredients.find(i => rule.keywords.some(k => i.name.toLowerCase().includes(k)));
    if (match && rule.requires(effectiveConditions)) {
      findings.push({
        tier: rule.tier,
        title: rule.title,
        ingredients: [match.name],
        issue: rule.issue,
        remedy: rule.remedy,
        citation: rule.citation,
      });
    }
  }

  // Deduplicate by title + ingredients
  const seen = new Set<string>();
  const deduped = findings.filter(f => {
    const k = f.title + '|' + f.ingredients.sort().join(',');
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  // Sort by severity
  const order: Record<CompatibilityTier, number> = { critical: 0, warning: 1, caution: 2, info: 3 };
  deduped.sort((a, b) => order[a.tier] - order[b.tier]);

  // Suppress noise: ignore ingredient references to itself
  void names;

  return deduped;
}

export function summarizeCompatibility(findings: CompatibilityFinding[]): {
  critical: number; warning: number; caution: number; info: number; hasIssue: boolean;
} {
  const c = findings.filter(f => f.tier === 'critical').length;
  const w = findings.filter(f => f.tier === 'warning').length;
  const ca = findings.filter(f => f.tier === 'caution').length;
  const i = findings.filter(f => f.tier === 'info').length;
  return { critical: c, warning: w, caution: ca, info: i, hasIssue: c + w > 0 };
}
