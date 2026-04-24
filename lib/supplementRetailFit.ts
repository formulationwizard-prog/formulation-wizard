// ============================================================
// RETAIL CHANNEL FIT ANALYZER
// ------------------------------------------------------------
// Every major retailer maintains an "unacceptable ingredients"
// list. A supplement brand has to clear each list before the
// product can land on shelf. This engine scans a formulation
// against each retailer's rules and returns a per-retailer
// readiness score with the specific disqualifying ingredients.
//
// Ingredient lists are approximations of the retailer's public
// standards and change periodically — verify current standards
// with the retailer before committing to a listing cycle.
// ============================================================

export interface RetailerRule {
  id: string;
  /** Display name for the retailer. */
  name: string;
  /** Who shops here / why the brand cares. */
  blurb: string;
  /** Substring (case-insensitive) match against ingredient names. */
  disallowedKeywords: string[];
  /** "Soft" flags — technically allowed but with conditions. */
  cautionKeywords?: string[];
  /** Known overall standard name (for citations). */
  standardName?: string;
  /** URL to the actual retailer standard when published. */
  standardUrl?: string;
}

export const RETAILER_RULES: RetailerRule[] = [
  {
    id: 'whole-foods',
    name: 'Whole Foods Market',
    blurb: 'Premium natural retailer. Quality Standards are the strictest in US natural food retail.',
    standardName: 'Whole Foods Quality Standards — Supplements (Body Care / Unacceptable Ingredients)',
    standardUrl: 'https://www.wholefoodsmarket.com/quality-standards',
    disallowedKeywords: [
      'polysorbate 80', 'polysorbate 20', 'polysorbate',
      'titanium dioxide',
      'carrageenan',
      'sodium benzoate', 'potassium sorbate',
      'bha', 'bht', 'butylated hydroxy',
      'sodium nitrite', 'sodium nitrate',
      'high fructose corn syrup', 'hfcs',
      'aspartame', 'acesulfame', 'sucralose', 'saccharin', 'neotame', 'advantame',
      'fd&c', 'd&c red', 'd&c yellow', 'd&c blue', 'artificial color',
      'propylene glycol',
      'hydrogenated oil', 'partially hydrogenated',
      'disodium edta',
    ],
    cautionKeywords: [
      'silicon dioxide', // permitted ≤ 2%
      'magnesium stearate', // permitted but scrutinized
      'natural flavor', // must specify source
    ],
  },
  {
    id: 'sprouts',
    name: 'Sprouts Farmers Market',
    blurb: 'Natural & organic grocer. Has an Unacceptable Ingredients List for vitamins/supplements.',
    standardName: 'Sprouts Supplement Quality Standards',
    disallowedKeywords: [
      'polysorbate',
      'titanium dioxide',
      'artificial color', 'fd&c',
      'high fructose corn syrup', 'hfcs',
      'aspartame', 'sucralose', 'acesulfame', 'saccharin',
      'bha', 'bht',
      'sodium benzoate',
      'hydrogenated',
      'partially hydrogenated',
    ],
  },
  {
    id: 'target-clean',
    name: 'Target "Clean"',
    blurb: 'Target\'s Clean badge for vitamins & supplements. Helps merchandising visibility.',
    standardName: 'Target Clean Standards',
    standardUrl: 'https://corporate.target.com/sustainability-governance/responsible-operations/target-clean',
    disallowedKeywords: [
      'parabens',
      'phthalates',
      'formaldehyde',
      'triclosan',
      'propylparaben', 'butylparaben',
      'bha', 'bht',
      'diethanolamine', 'dea',
      'retinyl palmitate', // limited
      'mineral oil',
    ],
  },
  {
    id: 'costco',
    name: 'Costco Wholesale',
    blurb: 'Club-channel. Clean/simple ingredient lists preferred, large pack sizes required.',
    disallowedKeywords: [
      'artificial color',
      'fd&c',
      'aspartame',
      'high fructose corn syrup', 'hfcs',
      'trans fat',
      'partially hydrogenated',
    ],
    cautionKeywords: [
      'proprietary blend', // Costco prefers full disclosure
    ],
  },
  {
    id: 'amazon-climate',
    name: 'Amazon Climate Pledge Friendly',
    blurb: 'Amazon merchandising badge for products with sustainability certifications.',
    standardName: 'Climate Pledge Friendly (requires at least one qualifying certification)',
    standardUrl: 'https://sustainability.aboutamazon.com/climate-pledge-friendly',
    disallowedKeywords: [],
    cautionKeywords: [
      // Not disallowed ingredients — this badge requires certifications
      // (USDA Organic, Non-GMO Project, EWG Verified, etc.) rather than forbidding ingredients.
    ],
  },
  {
    id: 'vitacost',
    name: 'Vitacost / Kroger Banner',
    blurb: 'Large online and brick-and-mortar natural channel.',
    disallowedKeywords: [
      'dmaa', 'dmha', 'ephedra', 'bmpea', 'phenibut', 'synephrine', 'higenamine',
      'hydrogenated', 'partially hydrogenated',
    ],
  },
  {
    id: 'gnc',
    name: 'GNC',
    blurb: 'Specialty supplement retailer. Strong enforcement on banned-substance list especially for sport.',
    disallowedKeywords: [
      'dmaa', 'dmha', 'ephedra', 'bmpea', 'phenibut', 'synephrine', 'higenamine', 'methylsynephrine',
      'sarms', 'ostarine', 'ibutamoren', 'mk-677',
      'comfrey',
    ],
    cautionKeywords: [
      'caffeine', // permitted but capped per serving in some categories
    ],
  },
  {
    id: 'ca-prop65',
    name: 'California Prop 65',
    blurb: 'Not a retailer but a de-facto US requirement — products sold in California with listed chemicals require a warning.',
    standardName: 'California Safe Drinking Water and Toxic Enforcement Act (Prop 65)',
    standardUrl: 'https://oehha.ca.gov/proposition-65',
    disallowedKeywords: [], // nothing is outright banned — just triggers a warning
    cautionKeywords: [
      'lead', 'arsenic', 'cadmium', 'mercury',
      'aristolochic acid',
      'comfrey',
      'ginkgo', // whole-leaf extract has been listed
      'aloe', // non-decolorized aloe vera
      'chromium hexavalent',
      'pulegone', 'pennyroyal',
      'dmaa',
      'bha', 'bht',
      'titanium dioxide', // listed in 2011 (airborne)
    ],
  },
];

// ============================================================
// CHECKER
// ============================================================

export interface RetailerReport {
  retailer: RetailerRule;
  disqualifyingIngredients: string[];
  cautionIngredients: string[];
  /** 0-100 score: 100 = fully ready, 0 = many disqualifiers. */
  score: number;
  status: 'ready' | 'caution' | 'blocked';
}

export function analyzeRetailFit(ingredientNames: string[]): RetailerReport[] {
  const reports: RetailerReport[] = [];
  for (const rule of RETAILER_RULES) {
    const disqualifying: string[] = [];
    const caution: string[] = [];
    const seen = new Set<string>();

    for (const ing of ingredientNames) {
      const n = ing.toLowerCase();
      const key = n.trim();
      if (seen.has(key)) continue;
      seen.add(key);

      if (rule.disallowedKeywords.some(k => n.includes(k))) {
        disqualifying.push(ing);
        continue; // skip caution check once disqualified
      }
      if (rule.cautionKeywords && rule.cautionKeywords.some(k => n.includes(k))) {
        caution.push(ing);
      }
    }

    // Score and status must agree or the UI contradicts itself. A single
    // disqualifying ingredient means the product can't be sold in that
    // channel regardless of how clean everything else is — Whole Foods
    // doesn't grade on a curve. So "blocked" always implies score = 0.
    const totalIngredients = Math.max(1, ingredientNames.length);
    const cautionPenalty = (caution.length / totalIngredients) * 30;
    let score: number;
    let status: RetailerReport['status'];
    if (disqualifying.length > 0) {
      status = 'blocked';
      score = 0;
    } else if (caution.length > 0) {
      status = 'caution';
      score = Math.max(40, Math.round(100 - cautionPenalty));
    } else {
      status = 'ready';
      score = 100;
    }

    reports.push({
      retailer: rule,
      disqualifyingIngredients: disqualifying,
      cautionIngredients: caution,
      score,
      status,
    });
  }
  // Sort: ready first, then caution, then blocked — but we actually want blocked
  // and caution visible to the user. Keep retailer order as defined.
  return reports;
}
