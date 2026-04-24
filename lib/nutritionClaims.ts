// ============================================================
// NUTRITION CLAIM VALIDATOR
// ------------------------------------------------------------
// Enforces FDA 21 CFR 101.54 (nutrient content claims:
// "high," "good source," "more," "less") and 21 CFR 101.56
// (light, low, free claims). Also handles 21 CFR 101.13
// (general principles) and 21 CFR 101.65 (implied claims).
//
// Usage pattern:
//   const result = validateClaim('Good Source of Protein', nutrition, servingSizeG);
//   // result: { allowed: boolean, threshold: string, actual: string, suggestion?: string }
// ============================================================

import type { Nutrition } from '../types';

/** Daily Values per FDA 21 CFR 101.9 (2016 rule, effective 2020/2021). */
export const DAILY_VALUES: Record<string, number> = {
  totalFat: 78,           // g
  saturatedFat: 20,       // g
  cholesterol: 300,       // mg
  sodium: 2300,           // mg
  totalCarbs: 275,        // g
  dietaryFiber: 28,       // g
  totalSugars: 50,        // g (added sugars DV, used as reference)
  addedSugars: 50,        // g
  protein: 50,            // g
  vitaminD: 20,           // mcg
  calcium: 1300,          // mg
  iron: 18,               // mg
  potassium: 4700,        // mg
  vitaminA: 900,          // mcg RAE
  vitaminC: 90,           // mg
  vitaminE: 15,           // mg
  vitaminK: 120,          // mcg
  thiamin: 1.2,           // mg
  riboflavin: 1.3,        // mg
  niacin: 16,             // mg NE
  vitaminB6: 1.7,         // mg
  folate: 400,            // mcg DFE
  vitaminB12: 2.4,        // mcg
  biotin: 30,             // mcg
  pantothenicAcid: 5,     // mg
  phosphorus: 1250,       // mg
  iodine: 150,            // mcg
  magnesium: 420,         // mg
  zinc: 11,               // mg
  selenium: 55,           // mcg
  copper: 0.9,            // mg
  manganese: 2.3,         // mg
  chromium: 35,           // mcg
  molybdenum: 45,         // mcg
  chloride: 2300,         // mg
  choline: 550,           // mg
};

/** Human-readable labels for each nutrient. */
export const NUTRIENT_LABELS: Record<string, string> = {
  calories: 'Calories',
  totalFat: 'Total Fat',
  saturatedFat: 'Saturated Fat',
  transFat: 'Trans Fat',
  cholesterol: 'Cholesterol',
  sodium: 'Sodium',
  totalCarbs: 'Total Carbohydrate',
  dietaryFiber: 'Dietary Fiber',
  totalSugars: 'Total Sugars',
  protein: 'Protein',
  vitaminD: 'Vitamin D',
  calcium: 'Calcium',
  iron: 'Iron',
  potassium: 'Potassium',
};

// ============================================================
// CLAIM THRESHOLDS (per 21 CFR 101.54 and 101.56)
// ============================================================

/** Nutrients eligible for "High / Excellent Source" claims (≥20% DV per RACC). */
const HIGH_CLAIM_ELIGIBLE = new Set([
  'protein', 'dietaryFiber', 'vitaminD', 'calcium', 'iron', 'potassium',
  'vitaminA', 'vitaminC', 'vitaminE', 'vitaminK', 'thiamin', 'riboflavin',
  'niacin', 'vitaminB6', 'folate', 'vitaminB12', 'biotin', 'pantothenicAcid',
  'phosphorus', 'iodine', 'magnesium', 'zinc', 'selenium', 'copper',
  'manganese', 'chromium', 'molybdenum', 'choline',
]);

/** Nutrients that CANNOT carry "free / low / reduced" claims (positive nutrients). */
const NEGATIVE_CLAIM_INELIGIBLE = new Set([
  'protein', 'dietaryFiber', 'calcium', 'iron', 'vitaminD', 'potassium',
]);

/** Per-serving maximum values for "low" claims on negative nutrients. */
const LOW_CLAIM_THRESHOLDS: Record<string, { limit: number; unit: string }> = {
  totalFat: { limit: 3, unit: 'g' },             // 21 CFR 101.62(b)
  saturatedFat: { limit: 1, unit: 'g' },         // 21 CFR 101.62(c)(2) (+ 15% kcal from SF)
  cholesterol: { limit: 20, unit: 'mg' },        // 21 CFR 101.62(d)(2)(iii) (+ SF ≤2g)
  sodium: { limit: 140, unit: 'mg' },            // 21 CFR 101.61(b)(4)
  calories: { limit: 40, unit: 'kcal' },         // 21 CFR 101.60(b)(2)
};

/** Per-serving maximum values for "free" claims on negative nutrients. */
const FREE_CLAIM_THRESHOLDS: Record<string, { limit: number; unit: string }> = {
  totalFat: { limit: 0.5, unit: 'g' },           // 21 CFR 101.62(b)(1)
  saturatedFat: { limit: 0.5, unit: 'g' },       // 21 CFR 101.62(c)(1) (SF + trans)
  cholesterol: { limit: 2, unit: 'mg' },         // 21 CFR 101.62(d)(1)(ii) (+ SF ≤2g)
  sodium: { limit: 5, unit: 'mg' },              // 21 CFR 101.61(b)(1)
  totalSugars: { limit: 0.5, unit: 'g' },        // 21 CFR 101.60(c)(1)
  calories: { limit: 5, unit: 'kcal' },          // 21 CFR 101.60(b)(1)
};

// ============================================================
// CLAIM VALIDATION
// ============================================================

export type ClaimType = 'high' | 'good-source' | 'excellent-source' | 'more' | 'low' | 'free' | 'reduced' | 'light' | 'healthy' | 'lean' | 'extra-lean' | 'unknown';

export interface ClaimValidationResult {
  /** The parsed claim type. */
  claimType: ClaimType;
  /** The nutrient the claim is about (e.g., 'protein', 'sodium'). Undefined if not nutrient-specific (e.g., 'healthy'). */
  nutrient?: string;
  /** Whether the claim is supported by the formula. */
  allowed: boolean;
  /** Human-readable threshold required for this claim. */
  threshold: string;
  /** Actual value present in the formula. */
  actual: string;
  /** 21 CFR citation for the rule. */
  citation: string;
  /** Explanation + suggested alternative if claim not allowed. */
  suggestion?: string;
}

/** Parse a free-text claim string. Returns normalized type + target nutrient. */
function parseClaim(claimText: string): { type: ClaimType; nutrient?: string } {
  const t = claimText.toLowerCase().trim();

  // Determine nutrient name from text
  const nutrientMap: Record<string, string> = {
    'protein': 'protein',
    'fiber': 'dietaryFiber', 'dietary fiber': 'dietaryFiber',
    'calcium': 'calcium',
    'iron': 'iron',
    'vitamin d': 'vitaminD', 'vit d': 'vitaminD',
    'potassium': 'potassium',
    'vitamin a': 'vitaminA', 'vit a': 'vitaminA',
    'vitamin c': 'vitaminC', 'vit c': 'vitaminC',
    'vitamin e': 'vitaminE', 'vit e': 'vitaminE',
    'vitamin b12': 'vitaminB12', 'b12': 'vitaminB12',
    'vitamin b6': 'vitaminB6', 'b6': 'vitaminB6',
    'folate': 'folate', 'folic acid': 'folate',
    'thiamin': 'thiamin', 'vitamin b1': 'thiamin',
    'riboflavin': 'riboflavin', 'vitamin b2': 'riboflavin',
    'niacin': 'niacin',
    'zinc': 'zinc',
    'magnesium': 'magnesium',
    'selenium': 'selenium',
    'fat': 'totalFat', 'total fat': 'totalFat',
    'saturated fat': 'saturatedFat', 'sat fat': 'saturatedFat',
    'cholesterol': 'cholesterol',
    'sodium': 'sodium', 'salt': 'sodium',
    'sugar': 'totalSugars', 'sugars': 'totalSugars',
    'calories': 'calories', 'calorie': 'calories',
    'carbs': 'totalCarbs', 'carbohydrates': 'totalCarbs',
  };

  let nutrient: string | undefined;
  for (const [pattern, key] of Object.entries(nutrientMap)) {
    if (t.includes(pattern)) {
      nutrient = key;
      break;
    }
  }

  // Determine claim type
  if (/\bhigh(er)?\b|\b(excellent|rich) source\b|\bpacked with\b/.test(t)) {
    return { type: 'high', nutrient };
  }
  if (/\bgood source\b|\bcontains\b|\bprovides\b/.test(t) && nutrient) {
    return { type: 'good-source', nutrient };
  }
  if (/\bmore\b|\bincreased\b|\bplus\b/.test(t) && nutrient) {
    return { type: 'more', nutrient };
  }
  if (/\blow\b(?!.*free)|\breduced\b|\bless\b/.test(t) && nutrient) {
    if (/\breduced\b|\bless\b/.test(t)) return { type: 'reduced', nutrient };
    return { type: 'low', nutrient };
  }
  if (/\bfree\b|\bno\s|\bzero\b|\bwithout\b/.test(t) && nutrient) {
    return { type: 'free', nutrient };
  }
  if (/\blight\b|\blite\b/.test(t)) {
    return { type: 'light', nutrient };
  }
  if (/\bhealthy\b/.test(t)) {
    return { type: 'healthy' };
  }
  if (/\blean\b/.test(t)) {
    if (/\bextra lean\b|\bextra-lean\b/.test(t)) return { type: 'extra-lean' };
    return { type: 'lean' };
  }

  return { type: 'unknown', nutrient };
}

/**
 * Compute per-serving amount of a nutrient given the formula's per-100g
 * nutrition profile and the serving size in grams.
 */
function perServing(nutrition: Partial<Nutrition>, nutrient: string, servingSizeG: number): number {
  const per100g = (nutrition as Record<string, number | undefined>)[nutrient];
  if (per100g === undefined || per100g === null) return 0;
  return (per100g * servingSizeG) / 100;
}

/** Compute %DV per serving. */
function perServingPercentDV(nutrition: Partial<Nutrition>, nutrient: string, servingSizeG: number): number {
  const amount = perServing(nutrition, nutrient, servingSizeG);
  const dv = DAILY_VALUES[nutrient];
  if (!dv) return 0;
  return (amount / dv) * 100;
}

/**
 * Validate a single nutrition claim against the formula's nutrition profile.
 * Returns a structured result with allowed/not, threshold, actual, and citation.
 */
export function validateClaim(
  claimText: string,
  nutrition: Partial<Nutrition>,
  servingSizeG: number,
): ClaimValidationResult {
  const parsed = parseClaim(claimText);
  const type = parsed.type;
  const nutrient = parsed.nutrient;

  // ─── HIGH / EXCELLENT SOURCE (≥ 20% DV) ───
  if (type === 'high' && nutrient && HIGH_CLAIM_ELIGIBLE.has(nutrient)) {
    const dvPct = perServingPercentDV(nutrition, nutrient, servingSizeG);
    const amount = perServing(nutrition, nutrient, servingSizeG);
    const unit = nutrient === 'calories' ? 'kcal' : (DAILY_VALUES[nutrient] >= 100 ? 'mg' : 'g');
    return {
      claimType: type,
      nutrient,
      allowed: dvPct >= 20,
      threshold: `≥ 20% DV per RACC (${(DAILY_VALUES[nutrient] * 0.20).toFixed(1)} ${unit} per serving)`,
      actual: `${dvPct.toFixed(1)}% DV (${amount.toFixed(1)} ${unit} per ${servingSizeG}g serving)`,
      citation: '21 CFR 101.54(b)',
      suggestion: dvPct >= 20
        ? undefined
        : dvPct >= 10
          ? `Claim as "Good Source of ${NUTRIENT_LABELS[nutrient] || nutrient}" instead (≥10% DV = "good source" threshold).`
          : `Increase ${NUTRIENT_LABELS[nutrient] || nutrient} to meet ≥20% DV per serving, or drop the claim.`,
    };
  }

  // ─── GOOD SOURCE (≥ 10% DV) ───
  if (type === 'good-source' && nutrient && HIGH_CLAIM_ELIGIBLE.has(nutrient)) {
    const dvPct = perServingPercentDV(nutrition, nutrient, servingSizeG);
    const amount = perServing(nutrition, nutrient, servingSizeG);
    const unit = nutrient === 'calories' ? 'kcal' : (DAILY_VALUES[nutrient] >= 100 ? 'mg' : 'g');
    return {
      claimType: type,
      nutrient,
      allowed: dvPct >= 10,
      threshold: `≥ 10% DV per RACC (${(DAILY_VALUES[nutrient] * 0.10).toFixed(1)} ${unit} per serving)`,
      actual: `${dvPct.toFixed(1)}% DV (${amount.toFixed(1)} ${unit} per ${servingSizeG}g serving)`,
      citation: '21 CFR 101.54(c)',
      suggestion: dvPct >= 10
        ? undefined
        : `Increase ${NUTRIENT_LABELS[nutrient] || nutrient} to reach 10% DV per serving, or drop the claim.`,
    };
  }

  // ─── LOW [nutrient] (per nutrient threshold) ───
  if (type === 'low' && nutrient && LOW_CLAIM_THRESHOLDS[nutrient]) {
    const cfg = LOW_CLAIM_THRESHOLDS[nutrient];
    const amount = perServing(nutrition, nutrient, servingSizeG);
    return {
      claimType: type,
      nutrient,
      allowed: amount <= cfg.limit,
      threshold: `≤ ${cfg.limit} ${cfg.unit} per serving`,
      actual: `${amount.toFixed(2)} ${cfg.unit} per ${servingSizeG}g serving`,
      citation: `21 CFR 101.${nutrient === 'sodium' ? '61' : nutrient === 'calories' ? '60' : '62'}`,
      suggestion: amount <= cfg.limit
        ? undefined
        : `Reformulate to reduce ${NUTRIENT_LABELS[nutrient] || nutrient} to ≤ ${cfg.limit} ${cfg.unit}/serving. Options: reduce fatty ingredient load, sub high-sodium with low-sodium variant, lower portion size.`,
    };
  }

  // ─── FREE [nutrient] (per nutrient threshold) ───
  if (type === 'free' && nutrient && FREE_CLAIM_THRESHOLDS[nutrient]) {
    const cfg = FREE_CLAIM_THRESHOLDS[nutrient];
    const amount = perServing(nutrition, nutrient, servingSizeG);
    return {
      claimType: type,
      nutrient,
      allowed: amount < cfg.limit,
      threshold: `< ${cfg.limit} ${cfg.unit} per serving`,
      actual: `${amount.toFixed(2)} ${cfg.unit} per ${servingSizeG}g serving`,
      citation: `21 CFR 101.${nutrient === 'sodium' ? '61' : nutrient === 'calories' ? '60' : '62'}`,
      suggestion: amount < cfg.limit
        ? undefined
        : `"Free" claims require truly de minimis amounts. Current ${NUTRIENT_LABELS[nutrient] || nutrient} (${amount.toFixed(2)} ${cfg.unit}) exceeds the ${cfg.limit} ${cfg.unit} threshold. Consider "Low ${NUTRIENT_LABELS[nutrient] || nutrient}" if the Low threshold fits.`,
    };
  }

  // ─── REDUCED (≥ 25% less than reference product) ───
  // Can't fully validate without reference product data; flag as unverifiable.
  if (type === 'reduced' && nutrient) {
    return {
      claimType: type,
      nutrient,
      allowed: false,  // we can't confirm without a reference
      threshold: '≥ 25% reduction vs. reference product',
      actual: 'Reference product data not provided — cannot validate automatically',
      citation: '21 CFR 101.13(j)',
      suggestion: `"Reduced ${NUTRIENT_LABELS[nutrient] || nutrient}" requires ≥ 25% less than an equivalent reference product. Document the comparison (Market Leader, Regular Variety, etc.) and keep records on file. Ensure reference exists in the same category.`,
    };
  }

  // ─── HEALTHY (FDA Sept 2024 rule, effective Feb 2025) ───
  if (type === 'healthy') {
    // Simplified check: per § 101.65(d)(2): eligible food group required,
    // per-RACC sodium ≤ 230 mg, saturated fat ≤ 2g, added sugars ≤ 5% DV (per 2.5g).
    const sodium = perServing(nutrition, 'sodium', servingSizeG);
    const satFat = perServing(nutrition, 'saturatedFat', servingSizeG);
    const sodiumOk = sodium <= 230;
    const satFatOk = satFat <= 2;
    const allowed = sodiumOk && satFatOk;
    return {
      claimType: type,
      allowed,
      threshold: '≤ 230mg sodium + ≤ 2g sat fat per serving + must contain food group serving',
      actual: `${sodium.toFixed(0)}mg sodium, ${satFat.toFixed(1)}g sat fat per ${servingSizeG}g`,
      citation: '21 CFR 101.65(d)(2) (2024 rule, enforcement Feb 2028)',
      suggestion: allowed
        ? `Also verify formula contains at least the minimum food-group serving (1/2c fruit, 1/2c veg, 3/4oz eq. whole grain, etc.) per § 101.65(d)(2)(i).`
        : `Not eligible for "Healthy" claim. ${sodiumOk ? '' : `Sodium (${sodium.toFixed(0)}mg) exceeds 230mg limit. `}${satFatOk ? '' : `Saturated fat (${satFat.toFixed(1)}g) exceeds 2g limit. `}`,
    };
  }

  // ─── LEAN / EXTRA LEAN (meat/poultry/seafood only) ───
  if (type === 'lean' || type === 'extra-lean') {
    const totalFat = perServing(nutrition, 'totalFat', servingSizeG);
    const satFat = perServing(nutrition, 'saturatedFat', servingSizeG);
    const chol = perServing(nutrition, 'cholesterol', servingSizeG);
    if (type === 'lean') {
      const allowed = totalFat < 10 && satFat < 4.5 && chol < 95;
      return {
        claimType: type,
        allowed,
        threshold: '< 10g fat, < 4.5g sat fat, < 95mg cholesterol per 100g AND per RACC',
        actual: `${totalFat.toFixed(1)}g fat / ${satFat.toFixed(1)}g sat fat / ${chol.toFixed(0)}mg chol per ${servingSizeG}g`,
        citation: '21 CFR 101.62(e)(2) (meat/poultry/seafood/game meat only)',
        suggestion: allowed ? undefined : `"Lean" has strict limits. Currently exceeds one or more thresholds. Reformulate with leaner cuts or lower-fat proteins.`,
      };
    } else {
      const allowed = totalFat < 5 && satFat < 2 && chol < 95;
      return {
        claimType: type,
        allowed,
        threshold: '< 5g fat, < 2g sat fat, < 95mg cholesterol per 100g AND per RACC',
        actual: `${totalFat.toFixed(1)}g fat / ${satFat.toFixed(1)}g sat fat / ${chol.toFixed(0)}mg chol per ${servingSizeG}g`,
        citation: '21 CFR 101.62(e)(3)',
        suggestion: allowed ? undefined : `"Extra Lean" has strict limits. Reformulate to meet thresholds or use "Lean" instead.`,
      };
    }
  }

  // ─── "LIGHT" claim (21 CFR 101.56) ───
  if (type === 'light') {
    // Complex rule: requires reference product with ≥ 50% fat or ≥ 1/3 calories reduced.
    return {
      claimType: type,
      nutrient,
      allowed: false,
      threshold: 'Requires reference product with ≥ 50% fat reduction or ≥ 33% calorie reduction',
      actual: 'Reference product data not provided — cannot validate automatically',
      citation: '21 CFR 101.56(a)',
      suggestion: `"Light" requires comparison to reference product. If using "light" to describe texture/color rather than nutrition, must include qualifier (e.g., "Light in Color") to avoid misbranding.`,
    };
  }

  // ─── NEGATIVE CLAIM ON INELIGIBLE NUTRIENT ───
  if ((type === 'low' || type === 'free') && nutrient && NEGATIVE_CLAIM_INELIGIBLE.has(nutrient)) {
    return {
      claimType: type,
      nutrient,
      allowed: false,
      threshold: 'N/A — positive nutrient cannot carry negative claim',
      actual: 'Claim type not applicable',
      citation: '21 CFR 101.13(i)',
      suggestion: `${NUTRIENT_LABELS[nutrient] || nutrient} is a positive nutrient — "free of" or "low" claims don't apply. Did you mean "Good Source of ${NUTRIENT_LABELS[nutrient] || nutrient}"?`,
    };
  }

  // ─── UNKNOWN OR UNSUPPORTED CLAIM ───
  return {
    claimType: type,
    nutrient,
    allowed: false,
    threshold: 'Unknown',
    actual: 'Claim could not be parsed',
    citation: '21 CFR 101 (general)',
    suggestion: 'Could not parse the claim. Try formats like "Good Source of Protein," "High Fiber," "Low Sodium," "Sugar Free," "Reduced Fat," "Healthy."',
  };
}

/**
 * Auto-suggest any claims that the current formulation qualifies for.
 * Useful as a "what can I claim?" feature on the label card.
 */
export function suggestAvailableClaims(
  nutrition: Partial<Nutrition>,
  servingSizeG: number,
): { claim: string; citation: string; strength: 'high' | 'good' | 'low' | 'free' }[] {
  const suggestions: { claim: string; citation: string; strength: 'high' | 'good' | 'low' | 'free' }[] = [];

  // Positive-nutrient claims
  for (const nutrient of HIGH_CLAIM_ELIGIBLE) {
    const dvPct = perServingPercentDV(nutrition, nutrient, servingSizeG);
    const label = NUTRIENT_LABELS[nutrient] || nutrient;
    if (dvPct >= 20) {
      suggestions.push({ claim: `High ${label}`, citation: '21 CFR 101.54(b)', strength: 'high' });
    } else if (dvPct >= 10) {
      suggestions.push({ claim: `Good Source of ${label}`, citation: '21 CFR 101.54(c)', strength: 'good' });
    }
  }

  // Negative-nutrient "low" / "free" claims
  for (const [nutrient, cfg] of Object.entries(LOW_CLAIM_THRESHOLDS)) {
    const amount = perServing(nutrition, nutrient, servingSizeG);
    const label = NUTRIENT_LABELS[nutrient] || nutrient;
    const freeCfg = FREE_CLAIM_THRESHOLDS[nutrient];
    if (freeCfg && amount < freeCfg.limit) {
      const claimText = nutrient === 'calories' ? `Calorie Free` :
                        nutrient === 'sodium' ? `Sodium Free` :
                        nutrient === 'totalFat' ? `Fat Free` :
                        nutrient === 'saturatedFat' ? `Saturated Fat Free` :
                        nutrient === 'cholesterol' ? `Cholesterol Free` :
                        `${label} Free`;
      suggestions.push({ claim: claimText, citation: `21 CFR 101.${nutrient === 'sodium' ? '61' : nutrient === 'calories' ? '60' : '62'}`, strength: 'free' });
    } else if (amount <= cfg.limit) {
      const claimText = nutrient === 'calories' ? `Low Calorie` :
                        nutrient === 'sodium' ? `Low Sodium` :
                        nutrient === 'totalFat' ? `Low Fat` :
                        nutrient === 'saturatedFat' ? `Low Saturated Fat` :
                        nutrient === 'cholesterol' ? `Low Cholesterol` :
                        `Low ${label}`;
      suggestions.push({ claim: claimText, citation: `21 CFR 101.${nutrient === 'sodium' ? '61' : nutrient === 'calories' ? '60' : '62'}`, strength: 'low' });
    }
  }

  // Sugar free specifically
  const sugars = perServing(nutrition, 'totalSugars', servingSizeG);
  if (sugars < 0.5) {
    suggestions.push({ claim: 'Sugar Free', citation: '21 CFR 101.60(c)(1)', strength: 'free' });
  }

  return suggestions;
}
