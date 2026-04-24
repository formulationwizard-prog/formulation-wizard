// ============================================================
// SUSTAINABILITY INFERENCE ENGINE
// ------------------------------------------------------------
// Rather than duplicating every ingredient as conventional +
// non-GMO + organic rows (5,000+ SKUs), this module infers
// variant availability from ingredient name + category patterns.
//
// Each ingredient returns:
//   - gmoRisk: what's the inherent GMO exposure from source crops?
//   - organicAvailable: is a USDA Organic variant in commercial
//     production at industrial scale?
//   - organicPricePremium: typical multiplier vs conventional
//     (e.g. 1.45 = +45%)
//   - nonGmoAvailable: is a Non-GMO Project Verified variant
//     available?
//   - nonGmoPricePremium: typical multiplier vs conventional
// ============================================================

import type { IndustrialIngredient, GmoRisk, SustainabilityCert, Ingredient } from '../types';

export interface SustainabilityProfile {
  gmoRisk: GmoRisk;
  organicAvailable: boolean;
  organicPricePremium: number;   // 1.0 = same price, 1.45 = +45%
  nonGmoAvailable: boolean;
  nonGmoPricePremium: number;
  suggestedCerts: SustainabilityCert[];
  carbonKgCo2ePerKg: number;     // rough cradle-to-gate estimate
  waterLitersPerKg: number;      // rough blue+green water
  notes: string[];
}

/**
 * Patterns for the eight major GMO commodity crops + their derivatives.
 * A name/category matching any of these indicates HIGH inherent GMO risk
 * (conventional variant is >90% likely to be GMO-derived in US market).
 */
const HIGH_GMO_PATTERNS = [
  // Corn & its derivatives
  /\b(corn|maize|dent corn|yellow corn|white corn)\b/i,
  /\b(hfcs|high.fructose corn syrup|corn syrup|corn starch|cornstarch)\b/i,
  /\b(dextrose|maltodextrin|corn oil|corn gluten|corn germ|ddgs|distillers)\b/i,
  /\b(masa|hominy|cornmeal)\b/i,
  // Soy & its derivatives
  /\b(soy|soya|soybean)\b/i,
  /\b(lecithin)\b(?!.*sunflower)/i, // lecithin implies soy unless otherwise stated
  /\btvp\b/i, // textured vegetable protein
  // Canola/Rapeseed
  /\b(canola|rapeseed)\b/i,
  // Cotton
  /\b(cottonseed|cotton oil)\b/i,
  // Sugar beet (not cane)
  /\b(beet sugar|sugar beet|beet molasses|beet pulp)\b/i,
  // Papaya (Hawaiian GMO papaya)
  /\bpapaya\b/i,
  // Alfalfa
  /\balfalfa\b/i,
];

/**
 * Patterns for ingredients where source may be ambiguous — labeled generically
 * as "vegetable oil," "natural flavors," "dextrose" without a source, etc.
 * These get MEDIUM GMO risk — supplier can confirm source on request.
 */
const MEDIUM_GMO_PATTERNS = [
  /\bvegetable oil\b/i,
  /\bnatural flavors?\b/i,
  /\bnatural and artificial flavors?\b/i,
  /\bcitric acid\b/i,               // often from GMO corn fermentation
  /\bglucose(?!.*non.gmo)\b/i,
  /\bxanthan gum\b/i,               // fermentation substrate usually corn or soy
  /\bmodified.*starch\b/i,
  /\bmonosodium glutamate\b/i,      // fermentation substrate often GMO corn
];

/**
 * Patterns for inorganic / synthetic ingredients that cannot be GMO.
 * Flagged as 'none' risk — no non-GMO claim needed.
 */
const INORGANIC_PATTERNS = [
  /\bsalt\b/i,
  /\bbicarbonate\b/i,
  /\bcalcium (carbonate|chloride|phosphate|citrate|lactate|sulfate)/i,
  /\bsodium (phosphate|bicarbonate|chloride|hexametaphosphate|tripolyphosphate|erythorbate|diacetate)/i,
  /\bpotassium (chloride|sorbate|iodide|carbonate|phosphate)/i,
  /\bmagnesium (oxide|chloride|sulfate|stearate|carbonate)/i,
  /\biron (sulfate|fumarate|gluconate)/i,
  /\bzinc (oxide|sulfate|gluconate)/i,
  /\bcopper (sulfate|gluconate)/i,
  /\bcitric acid \(anhydrous\)/i,
  /\bascorbic acid\b/i,
  /\btocopherol/i,
  /\bedta\b/i,
  /\bnitrite\b/i,
  /\bnitrate\b/i,
  /\bphosphate\b/i,
  /\bsilicon dioxide|silica\b/i,
  /\btalc\b/i,
  /\btitanium dioxide\b/i,
];

/**
 * Category-level organic availability. Keys are ingredient category names.
 * Value is whether commercial-scale organic variants exist AND the typical
 * price premium multiplier.
 */
const CATEGORY_ORGANIC_AVAILABILITY: Record<string, { available: boolean; premium: number }> = {
  'Sweeteners':             { available: true,  premium: 1.55 },
  'Fats & Oils':            { available: true,  premium: 1.75 },
  'Flours & Grains':        { available: true,  premium: 1.50 },
  'Dairy':                  { available: true,  premium: 1.70 },
  'Egg Products':           { available: true,  premium: 1.85 },
  'Nuts & Nut Products':    { available: true,  premium: 1.60 },
  'Seeds':                  { available: true,  premium: 1.55 },
  'Dried Fruit':            { available: true,  premium: 1.65 },
  'Fresh Produce':          { available: true,  premium: 1.50 },
  'Produce':                { available: true,  premium: 1.50 },
  'Fresh Herbs':            { available: true,  premium: 1.60 },
  'Spices':                 { available: true,  premium: 1.75 },
  'Seasonings':             { available: true,  premium: 1.70 },
  'Juices':                 { available: true,  premium: 1.55 },
  'Meat & Fat':             { available: true,  premium: 2.10 },
  'Variety Meats (Offal)':  { available: true,  premium: 2.25 },
  'Chocolate & Cocoa':      { available: true,  premium: 1.55 },
  'Plant Proteins':         { available: true,  premium: 1.45 },
  'Concentrates & Extracts':{ available: true,  premium: 1.50 },
  'Fatty Acids':            { available: true,  premium: 1.60 },
  'Vitamins':               { available: false, premium: 1.0  }, // synthetic vitamins can't be organic
  'Minerals':               { available: false, premium: 1.0  }, // inorganic, not organic-eligible
  'Amino Acids':            { available: false, premium: 1.0  }, // fermentation-derived, rarely organic
  'Excipients':             { available: false, premium: 1.0  }, // pharma / synthetic
  'Curing Agents':          { available: false, premium: 1.0  }, // sodium nitrite is synthetic
  'Binders & Fillers':      { available: false, premium: 1.0  }, // phosphates are synthetic
  'Preservatives':          { available: false, premium: 1.0  }, // mostly synthetic
  'Water & Ice':            { available: false, premium: 1.0  }, // water is water
  'Leavening':              { available: true,  premium: 1.40 }, // yeast, baking soda exceptions apply
  'Cultures & Enzymes':     { available: false, premium: 1.0  }, // fermentation-derived, rarely organic-labeled
  'Smoke & Flavoring':      { available: true,  premium: 1.30 },
  'Botanicals':             { available: true,  premium: 1.55 },
  'Probiotics':             { available: false, premium: 1.0  },
  'Antioxidants':           { available: false, premium: 1.0  },
  'Specialty':              { available: false, premium: 1.0  },
  'Seasoning Blends':       { available: true,  premium: 1.50 },
  'Casings':                { available: false, premium: 1.0  }, // natural casings rarely certified
  'Grains & Cereals':       { available: true,  premium: 1.50 }, // feeds mode category
  'Protein Meals':          { available: true,  premium: 1.80 },
  'Forages & Fiber':        { available: true,  premium: 1.45 },
  'Minerals & Vitamins':    { available: false, premium: 1.0  },
  'Medicated Additives':    { available: false, premium: 1.0  },
  'Condiment Ingredients':  { available: true,  premium: 1.60 },
  'Egg Products ':          { available: true,  premium: 1.85 }, // with trailing space
};

/**
 * Certifications that are sector-specific — apply when ingredient name matches.
 */
function inferSectorCerts(name: string, category: string): SustainabilityCert[] {
  const certs: SustainabilityCert[] = [];
  const n = name.toLowerCase();
  // Palm oil / palm kernel
  if (/\bpalm\b/.test(n) && /oil|stearin|olein|kernel|shortening/.test(n)) {
    certs.push('rspo-segregated', 'rspo-mass-balance');
  }
  // Wild-caught seafood
  if (/\b(salmon|cod|tuna|mackerel|herring|haddock|pollock|menhaden|anchovy)\b/.test(n)) {
    certs.push('msc');
  }
  // Farmed aquaculture
  if (/\b(tilapia|shrimp|prawn|farmed)\b/.test(n)) {
    certs.push('asc');
  }
  // Cocoa / chocolate / coffee / tea
  if (/\b(cocoa|chocolate|cacao|cocoa butter|couverture)\b/.test(n)) {
    certs.push('rainforest-alliance', 'fair-trade-international', 'utz');
  }
  if (/\b(coffee|espresso)\b/.test(n)) {
    certs.push('rainforest-alliance', 'fair-trade-usa');
  }
  if (/\b(tea|matcha)\b/.test(n)) {
    certs.push('rainforest-alliance');
  }
  // Cane sugar
  if (/\b(cane sugar|sugar cane|molasses)\b/.test(n) && !/beet/.test(n)) {
    certs.push('bonsucro', 'fair-trade-usa');
  }
  // Soy (ProTerra = non-GMO + sustainable soy)
  if (/\bsoy(bean)?\b/.test(n)) {
    certs.push('proterra');
  }
  // Bananas / tropical fruit
  if (/\b(banana|pineapple|mango)\b/.test(n)) {
    certs.push('rainforest-alliance', 'fair-trade-usa');
  }
  // Paper / carton packaging categories
  if (/paperboard|cardboard|carton/.test(category.toLowerCase())) {
    certs.push('fsc');
  }
  return certs;
}

/**
 * Approximate cradle-to-gate kg CO2e per kg of ingredient.
 * Sourced from published LCA literature (Poore & Nemecek 2018 database,
 * peer-reviewed food footprint studies). Directional estimates, not audit-grade.
 */
function inferCarbonFootprint(name: string, category: string): number {
  const n = name.toLowerCase();
  const c = category.toLowerCase();
  // Animal proteins — high footprint
  if (/beef|bovine/.test(n) || /\bbeef\b/.test(c)) return 60.0;
  if (/lamb|mutton/.test(n)) return 39.2;
  if (/pork|bacon|ham|sausage|pig/.test(n)) return 7.6;
  if (/chicken|poultry|turkey|duck|egg/.test(n)) return 4.1;
  if (/cheese|butter|cream/.test(n)) return 23.9;
  if (/\bmilk\b|dairy|whey|casein/.test(n)) return 3.2;
  if (/fish|salmon|tuna|cod|seafood/.test(n)) return 5.1;
  if (/shrimp|prawn|lobster|crab/.test(n)) return 12.0;
  // Plant proteins — low
  if (/\bsoy\b|\bpea protein\b|lentil|chickpea|bean/.test(n)) return 1.8;
  if (/wheat|rice|oat|barley|rye|grain/.test(n)) return 1.4;
  // Dairy alternatives
  if (/oat milk|almond milk|soy milk/.test(n)) return 0.9;
  // Nuts
  if (/almond|cashew|macadamia|hazelnut|walnut|pecan|pistachio/.test(n)) return 2.3;
  // Fruits & vegetables
  if (c.includes('fresh produce') || c.includes('produce')) return 0.7;
  if (c.includes('juice')) return 1.2;
  // Sweeteners
  if (/sugar|sweetener|molasses|honey|corn syrup/.test(n)) return 1.8;
  // Oils
  if (/\boil\b|\bfat\b|tallow|shortening/.test(n) || c.includes('fats')) return 3.2;
  // Chocolate
  if (/chocolate|cocoa|cacao/.test(n)) return 19.0;
  // Coffee
  if (/coffee|espresso/.test(n)) return 16.5;
  // Default — moderate
  return 1.5;
}

/**
 * Approximate blue+green water footprint (liters / kg).
 * Sourced from Mekonnen & Hoekstra water footprint dataset.
 */
function inferWaterFootprint(name: string, category: string): number {
  const n = name.toLowerCase();
  const c = category.toLowerCase();
  if (/beef|bovine/.test(n)) return 15415;
  if (/lamb|mutton/.test(n)) return 10412;
  if (/pork|bacon|ham|sausage|pig/.test(n)) return 5988;
  if (/chicken|poultry|turkey|duck/.test(n)) return 4325;
  if (/\begg/.test(n)) return 3265;
  if (/butter/.test(n)) return 5553;
  if (/cheese/.test(n)) return 3178;
  if (/\bmilk\b|dairy/.test(n)) return 1020;
  if (/almond/.test(n)) return 16095;
  if (/cashew|pistachio|walnut|pecan|macadamia|hazelnut/.test(n)) return 9063;
  if (/chocolate|cocoa/.test(n)) return 17196;
  if (/coffee/.test(n)) return 18900;
  if (/\bsoy\b/.test(n)) return 2145;
  if (/rice/.test(n)) return 2497;
  if (/wheat|flour/.test(n)) return 1827;
  if (/sugar/.test(n)) return 1782;
  if (/\boil\b/.test(n)) return 2364;
  if (c.includes('fresh produce')) return 322;
  return 1000;
}

/**
 * Compute the full sustainability profile for an ingredient.
 * Uses regex patterns + category lookups. Deterministic and cached-friendly.
 */
export function getSustainabilityProfile(ing: Pick<IndustrialIngredient, 'name' | 'category'>): SustainabilityProfile {
  const name = ing.name;
  const category = ing.category;

  // ─── GMO risk classification ───
  let gmoRisk: GmoRisk = 'low';
  if (INORGANIC_PATTERNS.some(p => p.test(name))) {
    gmoRisk = 'none';
  } else if (HIGH_GMO_PATTERNS.some(p => p.test(name))) {
    gmoRisk = 'high';
  } else if (MEDIUM_GMO_PATTERNS.some(p => p.test(name))) {
    gmoRisk = 'medium';
  }

  // ─── Organic availability ───
  const catRule = CATEGORY_ORGANIC_AVAILABILITY[category] || { available: false, premium: 1.0 };
  let organicAvailable = catRule.available;
  let organicPricePremium = catRule.premium;

  // Per-name overrides — some ingredients within "organic-available" categories
  // can't practically be organic (e.g. synthetic phosphate in sweeteners category).
  if (/\b(prague powder|sodium nitrite|sodium nitrate|tender quick|curing salt|phosphate|pyrophosphate|sslactylate|datem)\b/i.test(name)) {
    organicAvailable = false;
    organicPricePremium = 1.0;
  }
  // Liquid smoke, artificial flavors, colors — can be "natural" but not organic
  if (/\b(artificial|synthetic|modified|hydrolyzed)\b/i.test(name)) {
    organicAvailable = false;
    organicPricePremium = 1.0;
  }
  // Casings (natural hog/sheep casings) — rarely organic-certified
  if (category === 'Casings' || /\bcasing\b/i.test(name)) {
    organicAvailable = false;
    organicPricePremium = 1.0;
  }
  // Explicitly tagged organic variants — already organic, premium=1.0
  if (/\borganic\b/i.test(name)) {
    organicAvailable = true;
    organicPricePremium = 1.0;
  }

  // ─── Non-GMO availability ───
  // Available if inherently non-GMO (low/none risk — already non-GMO)
  // OR if GMO-risk ingredient has a commercially-verified non-GMO variant
  let nonGmoAvailable = true; // most ingredients are inherently non-GMO
  let nonGmoPricePremium = 1.0;
  if (gmoRisk === 'high' || gmoRisk === 'medium') {
    // Non-GMO variant costs more than conventional
    nonGmoAvailable = true;
    nonGmoPricePremium = gmoRisk === 'high' ? 1.25 : 1.15;
  }
  if (gmoRisk === 'none') {
    // Inorganic ingredients — GMO label doesn't apply, but they're "non-GMO compatible"
    nonGmoAvailable = true;
    nonGmoPricePremium = 1.0;
  }
  // Non-GMO already declared — no premium
  if (/\bnon.?gmo\b|\bnon gmo\b/i.test(name)) {
    nonGmoAvailable = true;
    nonGmoPricePremium = 1.0;
  }

  // ─── Sector-specific certs ───
  const suggestedCerts = inferSectorCerts(name, category);

  // ─── Carbon + water ───
  const carbonKgCo2ePerKg = inferCarbonFootprint(name, category);
  const waterLitersPerKg = inferWaterFootprint(name, category);

  // ─── Notes for UI explainability ───
  const notes: string[] = [];
  if (gmoRisk === 'high') {
    notes.push('GMO-risk crop — specify Non-GMO Project Verified or Organic variant on COA.');
  } else if (gmoRisk === 'medium') {
    notes.push('Source may be ambiguous — request supplier identity-preservation letter for non-GMO claim.');
  }
  if (organicAvailable && organicPricePremium > 1.0) {
    notes.push(`Organic variant available at ~${Math.round((organicPricePremium - 1) * 100)}% premium.`);
  }
  if (suggestedCerts.includes('rspo-segregated')) {
    notes.push('Palm-derived — use RSPO Segregated for deforestation-free claim.');
  }
  if (suggestedCerts.includes('msc')) {
    notes.push('Wild-caught seafood — MSC certification available for sustainable sourcing.');
  }
  if (suggestedCerts.includes('fair-trade-usa') || suggestedCerts.includes('fair-trade-international')) {
    notes.push('Fair Trade certification available for producer equity.');
  }
  if (carbonKgCo2ePerKg >= 20) {
    notes.push('High carbon footprint — consider plant-based alternative or local sourcing.');
  }

  return {
    gmoRisk,
    organicAvailable,
    organicPricePremium,
    nonGmoAvailable,
    nonGmoPricePremium,
    suggestedCerts,
    carbonKgCo2ePerKg,
    waterLitersPerKg,
    notes,
  };
}

// ============================================================
// ORGANIC CLAIM COMPLIANCE (NOP 21 CFR Part 205)
// ------------------------------------------------------------
// Tiers per § 205.301(a)–(c):
//   '100-percent-organic' : 100% certified organic (excluding water and salt)
//   'organic'             : ≥95% certified organic (excluding water and salt)
//   'made-with-organic'   : 70–94.9% certified organic (main panel: "Made with Organic ___")
//   'specific-organic'    : <70%; organic ingredients may only be listed in the
//                           ingredient statement, no main-panel claim allowed.
// Per § 205.301(c), water and salt are always EXCLUDED from the percent calculation.
// ============================================================

export type OrganicClaimTier =
  | '100-percent-organic'
  | 'organic'
  | 'made-with-organic'
  | 'specific-organic';

export interface OrganicComplianceResult {
  claimTier: OrganicClaimTier;
  claimLabel: string;
  percentOrganic: number;      // % of eligible mass that is organic (excluding water/salt)
  eligibleMassG: number;       // mass excluding water + salt
  excludedMassG: number;       // water + salt mass excluded from calc
  organicMassG: number;        // mass of ingredients that are organic (or organic-available if treated as such)
  nonOrganicIngredients: { name: string; massG: number; isOrganic: boolean; organicAvailable: boolean }[];
  thresholdGap: number;        // percentage points from next-higher tier (0 if at top tier)
  notes: string[];
}

const WATER_NAME_RE = /^water\b|\bwater\s*\(|\bice\b/i;
const SALT_NAME_RE = /\bsalt\b/i;

/**
 * True if an ingredient is considered ALREADY organic for NOP calculation.
 * Today we recognize ingredients by name containing "organic" — a more
 * sophisticated version would check a per-batch certification attestation.
 */
function isOrganicIngredient(name: string): boolean {
  return /\borganic\b/i.test(name);
}

/**
 * Compute the NOP organic claim tier for a formula. Treats ingredients whose
 * name contains "organic" as organic-certified. The water + salt exclusion
 * follows § 205.301(c).
 */
export function computeOrganicCompliance(
  rows: { name: string; category: string; massG: number }[],
): OrganicComplianceResult {
  let excludedMassG = 0;
  let eligibleMassG = 0;
  let organicMassG = 0;
  const nonOrganicIngredients: OrganicComplianceResult['nonOrganicIngredients'] = [];

  for (const r of rows) {
    const isWaterOrSalt = WATER_NAME_RE.test(r.name)
      || SALT_NAME_RE.test(r.name)
      || r.category === 'Water & Ice';
    if (isWaterOrSalt) {
      excludedMassG += r.massG;
      continue;
    }
    eligibleMassG += r.massG;
    const organic = isOrganicIngredient(r.name);
    if (organic) {
      organicMassG += r.massG;
    } else {
      const profile = getSustainabilityProfile(r);
      nonOrganicIngredients.push({
        name: r.name,
        massG: r.massG,
        isOrganic: false,
        organicAvailable: profile.organicAvailable,
      });
    }
  }

  const percentOrganic = eligibleMassG > 0 ? (organicMassG / eligibleMassG) * 100 : 0;

  let claimTier: OrganicClaimTier;
  let claimLabel: string;
  let thresholdGap = 0;

  if (percentOrganic >= 100) {
    claimTier = '100-percent-organic';
    claimLabel = '100% Organic';
    thresholdGap = 0;
  } else if (percentOrganic >= 95) {
    claimTier = 'organic';
    claimLabel = 'Organic';
    thresholdGap = 100 - percentOrganic;
  } else if (percentOrganic >= 70) {
    claimTier = 'made-with-organic';
    claimLabel = 'Made with Organic Ingredients';
    thresholdGap = 95 - percentOrganic;
  } else {
    claimTier = 'specific-organic';
    claimLabel = 'Cannot claim Organic on main panel';
    thresholdGap = 70 - percentOrganic;
  }

  const notes: string[] = [];
  notes.push(`NOP 21 CFR § 205.301(c): water and salt are excluded from the % organic calculation.`);
  if (excludedMassG > 0) {
    notes.push(`Excluded ${(excludedMassG / 1000).toFixed(3)} kg water/salt from calculation.`);
  }
  if (claimTier === '100-percent-organic') {
    notes.push('Eligible for "100% Organic" label: every eligible ingredient is organic certified.');
    notes.push('USDA Organic seal may be used. Include certifying agent\'s name on info panel.');
  } else if (claimTier === 'organic') {
    notes.push('Eligible for "Organic" label on main panel.');
    notes.push('USDA Organic seal may be used. Include certifying agent\'s name on info panel.');
    notes.push('Non-organic 5% allowance must come from the § 205.606 National List.');
  } else if (claimTier === 'made-with-organic') {
    notes.push('Main panel may say "Made with Organic [ingredient list]" — up to 3 ingredients or food groups.');
    notes.push('USDA Organic seal may NOT be displayed on products in this tier.');
    notes.push(`Gap to full Organic claim: +${thresholdGap.toFixed(1)} percentage points of eligible mass.`);
  } else {
    notes.push('No organic claim permitted on main panel.');
    notes.push('Organic ingredients may be identified in the ingredient statement (e.g., "organic sugar").');
    notes.push(`To reach "Made with Organic" tier: swap ingredients adding ${thresholdGap.toFixed(1)} percentage points of organic mass.`);
  }

  // Suggest specific swaps (top 3 by mass where organic is available)
  const swapCandidates = nonOrganicIngredients
    .filter(i => i.organicAvailable)
    .sort((a, b) => b.massG - a.massG)
    .slice(0, 3);
  if (swapCandidates.length > 0 && claimTier !== '100-percent-organic') {
    const totalSwapMassG = swapCandidates.reduce((s, c) => s + c.massG, 0);
    const potentialGain = eligibleMassG > 0 ? (totalSwapMassG / eligibleMassG) * 100 : 0;
    notes.push(`Swap suggestions (by mass): ${swapCandidates.map(c => c.name).join(' / ')} — potential +${potentialGain.toFixed(1)} pp organic coverage.`);
  }

  return {
    claimTier,
    claimLabel,
    percentOrganic,
    eligibleMassG,
    excludedMassG,
    organicMassG,
    nonOrganicIngredients,
    thresholdGap,
    notes,
  };
}

/**
 * Sustainability score for a full formulation (0–100).
 * Weighted by ingredient mass:
 *  - 30 points: % of mass from ingredients with organic variants available (capped at 30)
 *  - 25 points: % of mass that is inherently non-GMO or from non-GMO-verified ingredients
 *  - 15 points: palm / seafood / cocoa / coffee / sugar cane coverage by sustainable certs
 *  - 15 points: inverse of carbon footprint (lower = more points)
 *  - 15 points: supplier diversity / domestic sourcing bonus (computed in UI)
 */
export interface FormulationSustainabilityScore {
  score: number;
  organicCoveragePct: number;
  nonGmoCoveragePct: number;
  avgCarbonKgCo2ePerUnit: number;
  avgWaterLitersPerUnit: number;
  highGmoRiskIngredients: string[];
  palmOilPresent: boolean;
  seafoodPresent: boolean;
  cocoaPresent: boolean;
  recommendations: string[];
}

export function computeFormulationSustainability(
  rows: { name: string; category: string; massG: number }[],
): FormulationSustainabilityScore {
  const totalMass = rows.reduce((s, r) => s + r.massG, 0);
  if (totalMass === 0) {
    return {
      score: 0,
      organicCoveragePct: 0,
      nonGmoCoveragePct: 0,
      avgCarbonKgCo2ePerUnit: 0,
      avgWaterLitersPerUnit: 0,
      highGmoRiskIngredients: [],
      palmOilPresent: false,
      seafoodPresent: false,
      cocoaPresent: false,
      recommendations: [],
    };
  }

  let organicAvailableMass = 0;
  let nonGmoInherentMass = 0;
  let totalCarbon = 0;
  let totalWater = 0;
  const highGmoRiskIngredients: string[] = [];
  let palmOilPresent = false;
  let seafoodPresent = false;
  let cocoaPresent = false;

  for (const r of rows) {
    const profile = getSustainabilityProfile(r);
    const massKg = r.massG / 1000;
    if (profile.organicAvailable) organicAvailableMass += r.massG;
    if (profile.gmoRisk === 'low' || profile.gmoRisk === 'none') nonGmoInherentMass += r.massG;
    totalCarbon += profile.carbonKgCo2ePerKg * massKg;
    totalWater += profile.waterLitersPerKg * massKg;
    if (profile.gmoRisk === 'high') highGmoRiskIngredients.push(r.name);
    if (profile.suggestedCerts.includes('rspo-segregated')) palmOilPresent = true;
    if (profile.suggestedCerts.includes('msc') || profile.suggestedCerts.includes('asc')) seafoodPresent = true;
    if (profile.suggestedCerts.includes('rainforest-alliance') && /cocoa|chocolate|cacao/i.test(r.name)) cocoaPresent = true;
  }

  const organicCoveragePct = (organicAvailableMass / totalMass) * 100;
  const nonGmoCoveragePct = (nonGmoInherentMass / totalMass) * 100;

  // ─── Scoring ───
  // 30 points from organic coverage
  const organicScore = Math.min(30, organicCoveragePct * 0.3);
  // 25 points from non-GMO coverage
  const nonGmoScore = Math.min(25, nonGmoCoveragePct * 0.25);
  // 15 points carbon efficiency — formula: 15 × max(0, 1 - (carbon/total_mass_kg - 1) / 20)
  // A formula averaging 1 kg CO2e/kg = 15 pts; 21 kg CO2e/kg = 0 pts
  const avgCarbonPerKg = (totalCarbon / (totalMass / 1000));
  const carbonScore = Math.max(0, 15 * (1 - (avgCarbonPerKg - 1) / 20));
  // 15 points sustainable certs coverage (palm RSPO + seafood MSC + cocoa RA + coffee RA + cane Bonsucro)
  // Start with 15, subtract for each flagged-but-unmitigated sector
  // (In real app, user toggles whether they've secured these certs; we give benefit of availability)
  const sustainabilityScore = 15;
  // 15 points is reserved for supplier diversity — placeholder until Sourcing tab wired up
  const supplierScore = 15;

  const score = Math.round(organicScore + nonGmoScore + carbonScore + sustainabilityScore + supplierScore);

  const recommendations: string[] = [];
  if (organicCoveragePct < 50) {
    recommendations.push(`Upgrade ${Math.round(50 - organicCoveragePct)}% more of formula to organic variants to hit 50% coverage.`);
  }
  if (highGmoRiskIngredients.length > 0) {
    recommendations.push(`Switch ${highGmoRiskIngredients.length} GMO-risk ingredient${highGmoRiskIngredients.length > 1 ? 's' : ''} to Non-GMO Project Verified variants.`);
  }
  if (palmOilPresent) {
    recommendations.push('Palm oil detected — specify RSPO Segregated for deforestation-free claim.');
  }
  if (seafoodPresent) {
    recommendations.push('Seafood detected — specify MSC (wild) or ASC (farmed) for sustainable sourcing claim.');
  }
  if (cocoaPresent) {
    recommendations.push('Cocoa detected — specify Rainforest Alliance or Fair Trade for responsible-sourcing claim.');
  }
  if (avgCarbonPerKg > 10) {
    recommendations.push(`High carbon formula (${avgCarbonPerKg.toFixed(1)} kg CO2e/kg) — animal proteins dominate. Consider plant-based alternatives.`);
  }

  const totalMassKg = totalMass / 1000;
  return {
    score,
    organicCoveragePct,
    nonGmoCoveragePct,
    avgCarbonKgCo2ePerUnit: totalMassKg > 0 ? totalCarbon / totalMassKg : 0,
    avgWaterLitersPerUnit: totalMassKg > 0 ? totalWater / totalMassKg : 0,
    highGmoRiskIngredients,
    palmOilPresent,
    seafoodPresent,
    cocoaPresent,
    recommendations,
  };
}

// ============================================================
// INGREDIENT → ORGANIC CONVERSION
// ------------------------------------------------------------
// Two strategies, tried in order:
//   1. DB-match — look for an existing organic SKU whose base
//      name matches the current ingredient (e.g. "Canola Oil"
//      matches "Canola Oil (Organic, Expeller-Pressed)"). Uses
//      that SKU's actual cost, sub-ingredients, and allergens.
//   2. Synthesize — if no DB match, prefix "Organic " to the
//      name and multiply costPerKg by the category's organic
//      price premium.
// Returns null if no organic variant is commercially available
// (e.g. synthetic preservatives, phosphates, nitrite cures).
// ============================================================

/**
 * Strip trailing parenthetical modifiers so we can match variants.
 * "Canola Oil (Industrial Grade, Refined)" → "canola oil"
 */
function normalizeIngredientName(name: string): string {
  return name
    .replace(/\s*\([^)]*\)\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Find the best-matching organic SKU in the ingredient DB.
 * Uses normalized name + word-token overlap to match variants.
 */
function findOrganicMatchInDB(
  ingredientName: string,
  db: IndustrialIngredient[],
): IndustrialIngredient | null {
  if (/\borganic\b/i.test(ingredientName)) return null; // already organic
  const baseNorm = normalizeIngredientName(ingredientName);
  const baseTokens = baseNorm.split(/\s+/).filter(t => t.length > 2);
  if (baseTokens.length === 0) return null;

  // First pass — exact-base match with "organic" in the name
  for (const candidate of db) {
    if (!/\borganic\b/i.test(candidate.name)) continue;
    const candNorm = normalizeIngredientName(candidate.name).replace(/\borganic\b/g, '').trim();
    if (candNorm === baseNorm) return candidate;
  }

  // Second pass — strong token overlap (≥70% of base tokens appear in candidate)
  let bestMatch: IndustrialIngredient | null = null;
  let bestScore = 0;
  for (const candidate of db) {
    if (!/\borganic\b/i.test(candidate.name)) continue;
    const candTokens = normalizeIngredientName(candidate.name).split(/\s+/);
    const overlap = baseTokens.filter(t => candTokens.includes(t)).length;
    const score = overlap / baseTokens.length;
    if (score >= 0.7 && score > bestScore) {
      bestScore = score;
      bestMatch = candidate;
    }
  }
  return bestMatch;
}

export interface OrganicConversionResult {
  /** The converted ingredient — use to replace the original in state. */
  ingredient: Ingredient;
  /** Source of the conversion (DB-matched or synthesized). */
  source: 'db-match' | 'synthesized';
  /** Cost delta in $ / kg (organic − original). */
  costDeltaPerKg: number;
  /** Cost delta for the actual quantity used (organic − original). */
  costDeltaForQty: number;
  /** Original name (for UI display of what changed). */
  originalName: string;
  /** Why conversion succeeded / any UI messaging. */
  note: string;
}

/**
 * Convert a single formulation ingredient to its organic variant.
 * Returns null if no organic variant is commercially available.
 *
 * @param ingredient The formulation ingredient to convert.
 * @param db Current mode's industrial ingredient DB (for SKU lookup).
 * @param categoryFallback Pass the category if not embedded in foodData
 *   (used for sustainability profile lookup).
 */
export function convertIngredientToOrganic(
  ingredient: Ingredient,
  db: IndustrialIngredient[],
  categoryFallback: string = '',
): OrganicConversionResult | null {
  // Already organic — nothing to do
  if (/\borganic\b/i.test(ingredient.name)) return null;

  const category = ingredient.foodData?.type === 'industrial'
    ? (ingredient.foodData.data as IndustrialIngredient).category
    : categoryFallback;

  const profile = getSustainabilityProfile({ name: ingredient.name, category });
  if (!profile.organicAvailable) return null;

  // Strategy 1: try to match an existing organic SKU
  const match = findOrganicMatchInDB(ingredient.name, db);
  if (match) {
    const newCost = match.costPerKg;
    const costDeltaPerKg = newCost - ingredient.costPerKg;
    return {
      ingredient: {
        ...ingredient,
        name: match.name,
        costPerKg: newCost,
        subIngredients: match.subIngredients,
        allergens: match.allergens,
        supplier: (match.suppliers || [])[0] || ingredient.supplier,
        foodData: {
          type: 'industrial',
          data: match,
          subIngredients: match.subIngredients,
          allergens: match.allergens,
          costPerKg: match.costPerKg,
          supplier: (match.suppliers || [])[0] || ingredient.supplier,
          nutrition: match.nutrition,
        },
      },
      source: 'db-match',
      costDeltaPerKg,
      costDeltaForQty: costDeltaPerKg * (ingredient.qty / 1000),
      originalName: ingredient.name,
      note: `Matched to existing SKU: ${match.name}`,
    };
  }

  // Strategy 2: synthesize by applying the category premium
  const premium = profile.organicPricePremium;
  const newCost = ingredient.costPerKg * premium;
  const costDeltaPerKg = newCost - ingredient.costPerKg;
  return {
    ingredient: {
      ...ingredient,
      name: `Organic ${ingredient.name}`,
      costPerKg: newCost,
    },
    source: 'synthesized',
    costDeltaPerKg,
    costDeltaForQty: costDeltaPerKg * (ingredient.qty / 1000),
    originalName: ingredient.name,
    note: `Synthesized at +${Math.round((premium - 1) * 100)}% premium (category default).`,
  };
}

// ============================================================
// ORGANIC → CONVENTIONAL (reverse conversion)
// ------------------------------------------------------------
// Same two strategies, reversed:
//   1. DB-match — strip "Organic" modifier and look for the
//      base conventional SKU in the DB.
//   2. Synthesize — strip "Organic " prefix from name and divide
//      costPerKg by the category's organic premium.
// ============================================================

/**
 * Find the best-matching conventional SKU for a given organic ingredient.
 * Inverse of findOrganicMatchInDB — looks for a non-organic row with
 * matching base tokens.
 */
function findConventionalMatchInDB(
  organicName: string,
  db: IndustrialIngredient[],
): IndustrialIngredient | null {
  if (!/\borganic\b/i.test(organicName)) return null; // not actually organic

  // Strip "organic" from the normalized name for matching
  const baseNorm = normalizeIngredientName(organicName).replace(/\borganic\b/g, '').replace(/\s+/g, ' ').trim();
  const baseTokens = baseNorm.split(/\s+/).filter(t => t.length > 2);
  if (baseTokens.length === 0) return null;

  // First pass — exact-base match on a non-organic candidate
  for (const candidate of db) {
    if (/\borganic\b/i.test(candidate.name)) continue;
    const candNorm = normalizeIngredientName(candidate.name);
    if (candNorm === baseNorm) return candidate;
  }

  // Second pass — strong token overlap against non-organic candidates
  let bestMatch: IndustrialIngredient | null = null;
  let bestScore = 0;
  for (const candidate of db) {
    if (/\borganic\b/i.test(candidate.name)) continue;
    const candTokens = normalizeIngredientName(candidate.name).split(/\s+/);
    const overlap = baseTokens.filter(t => candTokens.includes(t)).length;
    const score = overlap / baseTokens.length;
    if (score >= 0.7 && score > bestScore) {
      bestScore = score;
      bestMatch = candidate;
    }
  }
  return bestMatch;
}

export interface ConventionalConversionResult {
  ingredient: Ingredient;
  source: 'db-match' | 'synthesized';
  costDeltaPerKg: number;       // conventional - organic (negative → cheaper)
  costDeltaForQty: number;
  originalName: string;
  note: string;
}

/**
 * Revert a single ingredient from organic to conventional.
 * Returns null if the ingredient is not currently organic.
 */
export function convertIngredientToConventional(
  ingredient: Ingredient,
  db: IndustrialIngredient[],
  categoryFallback: string = '',
): ConventionalConversionResult | null {
  if (!/\borganic\b/i.test(ingredient.name)) return null;

  // Strategy 1: look for a matching conventional SKU in the DB
  const match = findConventionalMatchInDB(ingredient.name, db);
  if (match) {
    const newCost = match.costPerKg;
    const costDeltaPerKg = newCost - ingredient.costPerKg;
    return {
      ingredient: {
        ...ingredient,
        name: match.name,
        costPerKg: newCost,
        subIngredients: match.subIngredients,
        allergens: match.allergens,
        supplier: (match.suppliers || [])[0] || ingredient.supplier,
        foodData: {
          type: 'industrial',
          data: match,
          subIngredients: match.subIngredients,
          allergens: match.allergens,
          costPerKg: match.costPerKg,
          supplier: (match.suppliers || [])[0] || ingredient.supplier,
          nutrition: match.nutrition,
        },
      },
      source: 'db-match',
      costDeltaPerKg,
      costDeltaForQty: costDeltaPerKg * (ingredient.qty / 1000),
      originalName: ingredient.name,
      note: `Matched conventional SKU in DB: ${match.name}`,
    };
  }

  // Strategy 2: synthesize by stripping "Organic" and dividing by premium
  const category = ingredient.foodData?.type === 'industrial'
    ? (ingredient.foodData.data as IndustrialIngredient).category
    : categoryFallback;
  // For the premium, look up based on a name-without-organic key
  const baseNameForProfile = ingredient.name.replace(/\borganic\b\s*/ig, '').replace(/\(\s*,?\s*/g, '(').replace(/\s+/g, ' ').trim();
  const profile = getSustainabilityProfile({ name: baseNameForProfile, category });
  const premium = profile.organicPricePremium || 1.5; // fallback premium if category unknown
  const newCost = ingredient.costPerKg / premium;
  // Clean up the name — strip leading "Organic " and inline "Organic," modifiers
  const cleanedName = ingredient.name
    .replace(/^Organic\s+/i, '')
    .replace(/\bOrganic,\s*/gi, '')
    .replace(/\bOrganic\b/gi, '')
    .replace(/\(\s*,/g, '(')
    .replace(/,\s*\)/g, ')')
    .replace(/\(\s*\)/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  const costDeltaPerKg = newCost - ingredient.costPerKg;
  return {
    ingredient: {
      ...ingredient,
      name: cleanedName,
      costPerKg: newCost,
    },
    source: 'synthesized',
    costDeltaPerKg,
    costDeltaForQty: costDeltaPerKg * (ingredient.qty / 1000),
    originalName: ingredient.name,
    note: `Synthesized conventional at −${Math.round((1 - 1 / premium) * 100)}% (inverse of +${Math.round((premium - 1) * 100)}% organic premium).`,
  };
}

/**
 * Revert all currently-organic ingredients in a formula back to conventional.
 * Useful for formulators who want to see baseline cost after exploring
 * organic options.
 */
export interface BulkConventionalRevertResult {
  revertedIngredients: Ingredient[];
  conversions: ConventionalConversionResult[];
  costDeltaTotal: number;
}

export function revertAllToConventional(
  ingredients: Ingredient[],
  db: IndustrialIngredient[],
): BulkConventionalRevertResult {
  const result: Ingredient[] = [...ingredients];
  const conversions: ConventionalConversionResult[] = [];
  for (let i = 0; i < result.length; i++) {
    const conversion = convertIngredientToConventional(result[i], db, '');
    if (conversion) {
      result[i] = conversion.ingredient;
      conversions.push(conversion);
    }
  }
  const costDeltaTotal = conversions.reduce((s, c) => s + c.costDeltaForQty, 0);
  return { revertedIngredients: result, conversions, costDeltaTotal };
}

/**
 * Upgrade a formulation to reach a target NOP organic claim tier.
 * Converts ingredients in descending order of mass (biggest impact first)
 * until either the target is reached OR no more ingredients can be converted.
 */
export interface BulkOrganicUpgradeResult {
  upgradedIngredients: Ingredient[];
  conversions: OrganicConversionResult[];
  costDeltaTotal: number;
  reachedTier: OrganicClaimTier;
  targetReached: boolean;
}

export function upgradeToOrganicTier(
  ingredients: Ingredient[],
  db: IndustrialIngredient[],
  targetTier: OrganicClaimTier,
): BulkOrganicUpgradeResult {
  const result: Ingredient[] = [...ingredients];
  const conversions: OrganicConversionResult[] = [];

  // Sort candidates by mass, largest first — converting big-mass items first
  // gets you to threshold with the fewest conversions (biggest bang per swap).
  const indexedCandidates = result
    .map((ing, idx) => ({ ing, idx }))
    .filter(({ ing }) => !/\borganic\b/i.test(ing.name))
    .sort((a, b) => b.ing.qty - a.ing.qty);

  // Helper to check if target tier is reached with current state
  const checkTier = (ings: Ingredient[]): OrganicClaimTier => {
    const rows = ings.map(i => {
      const cat = i.foodData?.type === 'industrial'
        ? (i.foodData.data as IndustrialIngredient).category
        : '';
      return { name: i.name, category: cat, massG: i.qty };
    });
    return computeOrganicCompliance(rows).claimTier;
  };

  const tierRank: Record<OrganicClaimTier, number> = {
    'specific-organic': 0,
    'made-with-organic': 1,
    'organic': 2,
    '100-percent-organic': 3,
  };

  for (const { idx } of indexedCandidates) {
    const currentIng = result[idx];
    // Re-check tier after each conversion — stop as soon as target hit
    if (tierRank[checkTier(result)] >= tierRank[targetTier]) break;

    const conversion = convertIngredientToOrganic(currentIng, db, '');
    if (!conversion) continue; // skip if not organic-available

    result[idx] = conversion.ingredient;
    conversions.push(conversion);
  }

  const finalTier = checkTier(result);
  const costDeltaTotal = conversions.reduce((s, c) => s + c.costDeltaForQty, 0);

  return {
    upgradedIngredients: result,
    conversions,
    costDeltaTotal,
    reachedTier: finalTier,
    targetReached: tierRank[finalTier] >= tierRank[targetTier],
  };
}
