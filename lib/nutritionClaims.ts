// ============================================================
// NUTRITION CLAIM VALIDATOR
// ------------------------------------------------------------
// Enforces FDA 21 CFR 101.54 (nutrient content claims:
// "high," "good source," "more," "less"), 21 CFR 101.56 (light,
// low, free claims), 21 CFR 101.60 (calorie/sugar), 21 CFR 101.61
// (sodium), 21 CFR 101.62 (fat/saturated fat/cholesterol), and
// 21 CFR 101.65 (implied claims).
//
// Round 3 audit (2026-05-07) — fixed:
//   • Input contract changed from per-100g to PER-SERVING. Caller is
//     responsible for converting batch-totals or per-100g to per-serving
//     before calling. The previous per-100g contract caused 10x+ false
//     positives when callers passed batch-totals (the workspace was
//     passing batch-total nutrition; for a 1000g pilot batch every
//     threshold check overestimated by 10x, asserting "High Protein"
//     and "Good Source of Protein" on formulations with <1g protein
//     per serving).
//   • Trans Fat Free threshold added (was missing entirely).
//   • Very Low Sodium tier added (was missing — only Free/Low existed).
//   • Saturated Fat Free now also checks <0.5g trans fat per RACC
//     (FDA companion rule, 21 CFR 101.62(c)(1)).
//   • Cholesterol Free / Low Cholesterol now also check ≤2g sat fat
//     per RACC (FDA companion rule, 21 CFR 101.62(d)).
//
// Usage:
//   const perServingNutrition = { protein: 5.2, sodium: 130, ... };
//   const result = validateClaim('Good Source of Protein',
//                                perServingNutrition, servingSizeG);
//   // result.allowed: boolean
//   // result.threshold + result.actual: shown to the user
//   // result.citation: 21 CFR section
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
// CLAIM THRESHOLDS (per 21 CFR 101.54, 101.56, 101.60–101.62)
// ============================================================

/** Nutrients eligible for "High / Excellent Source" (≥20% DV/RACC) and "Good Source"
 *  (≥10% DV/RACC) claims per 21 CFR 101.54(b),(c). Positive nutrients only. */
const HIGH_CLAIM_ELIGIBLE = new Set([
  'protein', 'dietaryFiber', 'vitaminD', 'calcium', 'iron', 'potassium',
  'vitaminA', 'vitaminC', 'vitaminE', 'vitaminK', 'thiamin', 'riboflavin',
  'niacin', 'vitaminB6', 'folate', 'vitaminB12', 'biotin', 'pantothenicAcid',
  'phosphorus', 'iodine', 'magnesium', 'zinc', 'selenium', 'copper',
  'manganese', 'chromium', 'molybdenum', 'choline',
]);

/** Nutrients that CANNOT carry "free / low / reduced" claims (positive nutrients
 *  per 21 CFR 101.13(i)). */
const NEGATIVE_CLAIM_INELIGIBLE = new Set([
  'protein', 'dietaryFiber', 'calcium', 'iron', 'vitaminD', 'potassium',
]);

/** Per-serving (per RACC) maximum values for "low" claims on negative nutrients. */
const LOW_CLAIM_THRESHOLDS: Record<string, { limit: number; unit: string; cfr: string }> = {
  totalFat:     { limit: 3,   unit: 'g',    cfr: '21 CFR 101.62(b)(2)' },
  saturatedFat: { limit: 1,   unit: 'g',    cfr: '21 CFR 101.62(c)(2)' }, // + ≤15% kcal from SF (not enforced here)
  cholesterol:  { limit: 20,  unit: 'mg',   cfr: '21 CFR 101.62(d)(2)' }, // + companion ≤2g sat fat
  sodium:       { limit: 140, unit: 'mg',   cfr: '21 CFR 101.61(b)(4)' },
  calories:     { limit: 40,  unit: 'kcal', cfr: '21 CFR 101.60(b)(2)' },
};

/** Per-serving (per RACC) maximum values for "free" claims on negative nutrients.
 *  Some claims have FDA-mandated companion checks (e.g., Sat Fat Free also requires
 *  trans fat <0.5g). Those are enforced inline in the validator below. */
const FREE_CLAIM_THRESHOLDS: Record<string, { limit: number; unit: string; cfr: string }> = {
  totalFat:     { limit: 0.5, unit: 'g',    cfr: '21 CFR 101.62(b)(1)' },
  saturatedFat: { limit: 0.5, unit: 'g',    cfr: '21 CFR 101.62(c)(1)' }, // companion: trans fat <0.5g
  transFat:     { limit: 0.5, unit: 'g',    cfr: '21 CFR 101.62(c)(2)' }, // companion: sat fat <0.5g (statement-of-identity rule)
  cholesterol:  { limit: 2,   unit: 'mg',   cfr: '21 CFR 101.62(d)(1)' }, // companion: sat fat ≤2g
  sodium:       { limit: 5,   unit: 'mg',   cfr: '21 CFR 101.61(b)(1)' },
  totalSugars:  { limit: 0.5, unit: 'g',    cfr: '21 CFR 101.60(c)(1)' },
  calories:     { limit: 5,   unit: 'kcal', cfr: '21 CFR 101.60(b)(1)' },
};

/** "Very Low Sodium" — additional sodium tier between Free (<5mg) and Low (≤140mg). */
const VERY_LOW_SODIUM_LIMIT = { limit: 35, unit: 'mg', cfr: '21 CFR 101.61(b)(3)' };

// ============================================================
// CLAIM VALIDATION
// ============================================================

export type ClaimType = 'high' | 'good-source' | 'excellent-source' | 'more' | 'low' | 'very-low' | 'free' | 'reduced' | 'light' | 'healthy' | 'lean' | 'extra-lean' | 'unknown';

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
    // Order matters: check more-specific matches first ("trans fat" / "saturated fat"
    // before "fat") so the generic fat regex doesn't swallow them.
    'trans fat': 'transFat',
    'saturated fat': 'saturatedFat', 'sat fat': 'saturatedFat',
    'fat': 'totalFat', 'total fat': 'totalFat',
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
  // "Very Low Sodium" specifically — must check before generic /low/
  if (/\bvery low\b/.test(t) && nutrient === 'sodium') {
    return { type: 'very-low', nutrient };
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

/** Look up a per-serving amount, treating undefined / null as 0. */
function get(perServingNutrition: Partial<Nutrition>, nutrient: string): number {
  const v = (perServingNutrition as Record<string, number | undefined>)[nutrient];
  return v ?? 0;
}

/** Compute %DV for a per-serving amount. */
function percentDV(amount: number, nutrient: string): number {
  const dv = DAILY_VALUES[nutrient];
  if (!dv) return 0;
  return (amount / dv) * 100;
}

/**
 * Validate a single nutrition claim against the formula's PER-SERVING nutrition.
 *
 * Round 3 contract change: caller MUST pass per-serving values, not per-100g
 * and not batch-totals. The previous per-100g contract caused 10x+ false
 * positives when callers passed batch-totals. Use a perServing helper at the
 * call site (e.g., `(val) => val * servingSize / batchGrams`) to convert.
 *
 * @param claimText            free-text claim (e.g., "Good Source of Protein")
 * @param perServingNutrition  per-serving amounts per nutrient (g/mg/kcal as appropriate)
 * @param servingSizeG         used only for display formatting in `actual` strings
 */
export function validateClaim(
  claimText: string,
  perServingNutrition: Partial<Nutrition>,
  servingSizeG: number,
): ClaimValidationResult {
  const parsed = parseClaim(claimText);
  const type = parsed.type;
  const nutrient = parsed.nutrient;

  // ─── HIGH / EXCELLENT SOURCE — ≥ 20% DV per RACC (21 CFR 101.54(b)) ───
  if (type === 'high' && nutrient && HIGH_CLAIM_ELIGIBLE.has(nutrient)) {
    const amount = get(perServingNutrition, nutrient);
    const dvPct = percentDV(amount, nutrient);
    const unit = nutrient === 'calories' ? 'kcal' : (DAILY_VALUES[nutrient] >= 100 ? 'mg' : 'g');
    return {
      claimType: type,
      nutrient,
      allowed: dvPct >= 20,
      threshold: `≥ 20% DV per serving (≥ ${(DAILY_VALUES[nutrient] * 0.20).toFixed(1)} ${unit})`,
      actual: `${amount.toFixed(2)} ${unit} per ${servingSizeG}g serving (${dvPct.toFixed(1)}% DV)`,
      citation: '21 CFR 101.54(b)',
      suggestion: dvPct >= 20
        ? undefined
        : dvPct >= 10
          ? `Claim as "Good Source of ${NUTRIENT_LABELS[nutrient] || nutrient}" instead (≥10% DV = "good source" threshold).`
          : `Increase ${NUTRIENT_LABELS[nutrient] || nutrient} to meet ≥20% DV per serving, or drop the claim.`,
    };
  }

  // ─── GOOD SOURCE — ≥ 10% DV per RACC (21 CFR 101.54(c)) ───
  if (type === 'good-source' && nutrient && HIGH_CLAIM_ELIGIBLE.has(nutrient)) {
    const amount = get(perServingNutrition, nutrient);
    const dvPct = percentDV(amount, nutrient);
    const unit = nutrient === 'calories' ? 'kcal' : (DAILY_VALUES[nutrient] >= 100 ? 'mg' : 'g');
    return {
      claimType: type,
      nutrient,
      allowed: dvPct >= 10,
      threshold: `≥ 10% DV per serving (≥ ${(DAILY_VALUES[nutrient] * 0.10).toFixed(1)} ${unit})`,
      actual: `${amount.toFixed(2)} ${unit} per ${servingSizeG}g serving (${dvPct.toFixed(1)}% DV)`,
      citation: '21 CFR 101.54(c)',
      suggestion: dvPct >= 10
        ? undefined
        : `Increase ${NUTRIENT_LABELS[nutrient] || nutrient} to reach 10% DV per serving, or drop the claim.`,
    };
  }

  // ─── VERY LOW SODIUM — ≤ 35mg per serving (21 CFR 101.61(b)(3)) ───
  if (type === 'very-low' && nutrient === 'sodium') {
    const amount = get(perServingNutrition, 'sodium');
    return {
      claimType: type,
      nutrient,
      allowed: amount <= VERY_LOW_SODIUM_LIMIT.limit,
      threshold: `≤ ${VERY_LOW_SODIUM_LIMIT.limit} ${VERY_LOW_SODIUM_LIMIT.unit} per serving`,
      actual: `${amount.toFixed(2)} ${VERY_LOW_SODIUM_LIMIT.unit} per ${servingSizeG}g serving`,
      citation: VERY_LOW_SODIUM_LIMIT.cfr,
      suggestion: amount <= VERY_LOW_SODIUM_LIMIT.limit
        ? undefined
        : amount <= LOW_CLAIM_THRESHOLDS.sodium.limit
          ? `Use "Low Sodium" (≤140mg) instead — current ${amount.toFixed(0)}mg exceeds the 35mg Very Low threshold.`
          : `Reformulate to reduce sodium below 35mg/serving for "Very Low Sodium," or use "Low Sodium" if ≤140mg.`,
    };
  }

  // ─── LOW [nutrient] — per-nutrient threshold (21 CFR 101.60–62) ───
  if (type === 'low' && nutrient && LOW_CLAIM_THRESHOLDS[nutrient]) {
    const cfg = LOW_CLAIM_THRESHOLDS[nutrient];
    const amount = get(perServingNutrition, nutrient);
    let allowed = amount <= cfg.limit;
    let companionFail: string | null = null;
    // Companion rule: "Low Cholesterol" requires ≤2g saturated fat per serving
    // (21 CFR 101.62(d)(2)(ii)). Otherwise the cholesterol claim implies a
    // healthier-fat profile that the sat fat number contradicts.
    if (allowed && nutrient === 'cholesterol') {
      const satFat = get(perServingNutrition, 'saturatedFat');
      if (satFat > 2) {
        allowed = false;
        companionFail = `companion rule: saturated fat ${satFat.toFixed(2)}g exceeds the ≤2g limit required for cholesterol claims`;
      }
    }
    return {
      claimType: type,
      nutrient,
      allowed,
      threshold: nutrient === 'cholesterol'
        ? `≤ ${cfg.limit} ${cfg.unit} cholesterol AND ≤ 2g saturated fat per serving`
        : `≤ ${cfg.limit} ${cfg.unit} per serving`,
      actual: `${amount.toFixed(2)} ${cfg.unit} per ${servingSizeG}g serving`,
      citation: cfg.cfr,
      suggestion: allowed
        ? undefined
        : companionFail
          ? `"Low Cholesterol" requires both ≤20mg cholesterol AND ≤2g saturated fat — ${companionFail}.`
          : `Reformulate to reduce ${NUTRIENT_LABELS[nutrient] || nutrient} to ≤ ${cfg.limit} ${cfg.unit}/serving. Options: reduce fatty ingredient load, sub high-sodium with low-sodium variant, lower portion size.`,
    };
  }

  // ─── FREE [nutrient] — per-nutrient threshold + FDA companion checks ───
  if (type === 'free' && nutrient && FREE_CLAIM_THRESHOLDS[nutrient]) {
    const cfg = FREE_CLAIM_THRESHOLDS[nutrient];
    const amount = get(perServingNutrition, nutrient);
    let allowed = amount < cfg.limit;
    let companionFail: string | null = null;

    // Companion rule: "Saturated Fat Free" requires <0.5g trans fat (21 CFR 101.62(c)(1))
    if (allowed && nutrient === 'saturatedFat') {
      const transFat = get(perServingNutrition, 'transFat');
      if (transFat >= 0.5) {
        allowed = false;
        companionFail = `companion rule: trans fat ${transFat.toFixed(2)}g exceeds the <0.5g limit required for "Saturated Fat Free"`;
      }
    }
    // Companion rule: "Trans Fat Free" requires <0.5g sat fat (statement-of-identity)
    if (allowed && nutrient === 'transFat') {
      const satFat = get(perServingNutrition, 'saturatedFat');
      if (satFat >= 0.5) {
        allowed = false;
        companionFail = `companion rule: saturated fat ${satFat.toFixed(2)}g exceeds the <0.5g limit required for "Trans Fat Free"`;
      }
    }
    // Companion rule: "Cholesterol Free" requires ≤2g sat fat (21 CFR 101.62(d)(1)(ii))
    if (allowed && nutrient === 'cholesterol') {
      const satFat = get(perServingNutrition, 'saturatedFat');
      if (satFat > 2) {
        allowed = false;
        companionFail = `companion rule: saturated fat ${satFat.toFixed(2)}g exceeds the ≤2g limit required for "Cholesterol Free"`;
      }
    }

    const baseThreshold = `< ${cfg.limit} ${cfg.unit} per serving`;
    const fullThreshold =
      nutrient === 'saturatedFat' ? `${baseThreshold} AND < 0.5g trans fat per serving` :
      nutrient === 'transFat'     ? `${baseThreshold} AND < 0.5g saturated fat per serving` :
      nutrient === 'cholesterol'  ? `${baseThreshold} AND ≤ 2g saturated fat per serving` :
      baseThreshold;

    return {
      claimType: type,
      nutrient,
      allowed,
      threshold: fullThreshold,
      actual: `${amount.toFixed(2)} ${cfg.unit} per ${servingSizeG}g serving`,
      citation: cfg.cfr,
      suggestion: allowed
        ? undefined
        : companionFail
          ? companionFail
          : `"Free" claims require truly de minimis amounts. Current ${NUTRIENT_LABELS[nutrient] || nutrient} (${amount.toFixed(2)} ${cfg.unit}) meets or exceeds the ${cfg.limit} ${cfg.unit} threshold. Consider "Low ${NUTRIENT_LABELS[nutrient] || nutrient}" if the Low threshold fits.`,
    };
  }

  // ─── REDUCED — ≥ 25% less than reference (21 CFR 101.13(j)) ───
  // Can't validate without reference product data; flag as unverifiable.
  if (type === 'reduced' && nutrient) {
    return {
      claimType: type,
      nutrient,
      allowed: false,
      threshold: '≥ 25% reduction vs. reference product',
      actual: 'Reference product data not provided — cannot validate automatically',
      citation: '21 CFR 101.13(j)',
      suggestion: `"Reduced ${NUTRIENT_LABELS[nutrient] || nutrient}" requires ≥ 25% less than an equivalent reference product. Document the comparison (Market Leader, Regular Variety, etc.) and keep records on file. Ensure reference exists in the same category.`,
    };
  }

  // ─── HEALTHY — FDA Sept 2024 rule, enforcement Feb 2028 (21 CFR 101.65(d)(2)) ───
  if (type === 'healthy') {
    const sodium = get(perServingNutrition, 'sodium');
    const satFat = get(perServingNutrition, 'saturatedFat');
    const sodiumOk = sodium <= 230;
    const satFatOk = satFat <= 2;
    const allowed = sodiumOk && satFatOk;
    return {
      claimType: type,
      allowed,
      threshold: '≤ 230mg sodium + ≤ 2g sat fat per serving + must contain food group serving',
      actual: `${sodium.toFixed(0)}mg sodium, ${satFat.toFixed(2)}g sat fat per ${servingSizeG}g`,
      citation: '21 CFR 101.65(d)(2) (2024 rule, enforcement Feb 2028)',
      suggestion: allowed
        ? `Also verify formula contains at least the minimum food-group serving (1/2c fruit, 1/2c veg, 3/4oz eq. whole grain, etc.) per § 101.65(d)(2)(i).`
        : `Not eligible for "Healthy" claim. ${sodiumOk ? '' : `Sodium (${sodium.toFixed(0)}mg) exceeds 230mg limit. `}${satFatOk ? '' : `Saturated fat (${satFat.toFixed(2)}g) exceeds 2g limit. `}`,
    };
  }

  // ─── LEAN / EXTRA LEAN — meat/poultry/seafood only (21 CFR 101.62(e)) ───
  if (type === 'lean' || type === 'extra-lean') {
    const totalFat = get(perServingNutrition, 'totalFat');
    const satFat = get(perServingNutrition, 'saturatedFat');
    const chol = get(perServingNutrition, 'cholesterol');
    if (type === 'lean') {
      const allowed = totalFat < 10 && satFat < 4.5 && chol < 95;
      return {
        claimType: type,
        allowed,
        threshold: '< 10g fat, < 4.5g sat fat, < 95mg cholesterol per 100g AND per RACC',
        actual: `${totalFat.toFixed(2)}g fat / ${satFat.toFixed(2)}g sat fat / ${chol.toFixed(0)}mg chol per ${servingSizeG}g`,
        citation: '21 CFR 101.62(e)(2) (meat/poultry/seafood/game meat only)',
        suggestion: allowed ? undefined : `"Lean" has strict limits. Currently exceeds one or more thresholds. Reformulate with leaner cuts or lower-fat proteins.`,
      };
    } else {
      const allowed = totalFat < 5 && satFat < 2 && chol < 95;
      return {
        claimType: type,
        allowed,
        threshold: '< 5g fat, < 2g sat fat, < 95mg cholesterol per 100g AND per RACC',
        actual: `${totalFat.toFixed(2)}g fat / ${satFat.toFixed(2)}g sat fat / ${chol.toFixed(0)}mg chol per ${servingSizeG}g`,
        citation: '21 CFR 101.62(e)(3)',
        suggestion: allowed ? undefined : `"Extra Lean" has strict limits. Reformulate to meet thresholds or use "Lean" instead.`,
      };
    }
  }

  // ─── LIGHT (21 CFR 101.56) ───
  if (type === 'light') {
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

  // ─── NEGATIVE CLAIM ON INELIGIBLE NUTRIENT (21 CFR 101.13(i)) ───
  if ((type === 'low' || type === 'free' || type === 'very-low') && nutrient && NEGATIVE_CLAIM_INELIGIBLE.has(nutrient)) {
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
 *
 * Round 3 contract change: caller MUST pass per-serving values, not per-100g
 * and not batch-totals. See validateClaim docstring for the migration note.
 */
export function suggestAvailableClaims(
  perServingNutrition: Partial<Nutrition>,
  // servingSizeG kept for API parity with validateClaim (currently unused here)
  _servingSizeG: number,
): { claim: string; citation: string; strength: 'high' | 'good' | 'low' | 'free' }[] {
  const suggestions: { claim: string; citation: string; strength: 'high' | 'good' | 'low' | 'free' }[] = [];

  // Positive-nutrient claims
  for (const nutrient of HIGH_CLAIM_ELIGIBLE) {
    const amount = get(perServingNutrition, nutrient);
    const dvPct = percentDV(amount, nutrient);
    const label = NUTRIENT_LABELS[nutrient] || nutrient;
    if (dvPct >= 20) {
      suggestions.push({ claim: `High ${label}`, citation: '21 CFR 101.54(b)', strength: 'high' });
    } else if (dvPct >= 10) {
      suggestions.push({ claim: `Good Source of ${label}`, citation: '21 CFR 101.54(c)', strength: 'good' });
    }
  }

  // Negative-nutrient "free" / "low" claims with companion-rule enforcement.
  // Order matters: check Free first (tighter), then Low. Skip Low if Free fires.
  for (const [nutrient, cfg] of Object.entries(LOW_CLAIM_THRESHOLDS)) {
    const amount = get(perServingNutrition, nutrient);
    const label = NUTRIENT_LABELS[nutrient] || nutrient;
    const freeCfg = FREE_CLAIM_THRESHOLDS[nutrient];

    // Free claim — apply companion rules
    if (freeCfg && amount < freeCfg.limit) {
      let companionOk = true;
      if (nutrient === 'saturatedFat') {
        // Sat Fat Free requires also trans fat < 0.5g
        companionOk = get(perServingNutrition, 'transFat') < 0.5;
      } else if (nutrient === 'cholesterol') {
        // Cholesterol Free requires also sat fat ≤ 2g
        companionOk = get(perServingNutrition, 'saturatedFat') <= 2;
      }
      if (companionOk) {
        const claimText = nutrient === 'calories' ? `Calorie Free` :
                          nutrient === 'sodium' ? `Sodium Free` :
                          nutrient === 'totalFat' ? `Fat Free` :
                          nutrient === 'saturatedFat' ? `Saturated Fat Free` :
                          nutrient === 'cholesterol' ? `Cholesterol Free` :
                          `${label} Free`;
        suggestions.push({ claim: claimText, citation: freeCfg.cfr, strength: 'free' });
        continue; // Skip Low — Free is stronger
      }
    }

    // Low claim — apply companion rules
    if (amount <= cfg.limit) {
      let companionOk = true;
      if (nutrient === 'cholesterol') {
        // Low Cholesterol also requires sat fat ≤ 2g
        companionOk = get(perServingNutrition, 'saturatedFat') <= 2;
      }
      if (companionOk) {
        const claimText = nutrient === 'calories' ? `Low Calorie` :
                          nutrient === 'sodium' ? `Low Sodium` :
                          nutrient === 'totalFat' ? `Low Fat` :
                          nutrient === 'saturatedFat' ? `Low Saturated Fat` :
                          nutrient === 'cholesterol' ? `Low Cholesterol` :
                          `Low ${label}`;
        suggestions.push({ claim: claimText, citation: cfg.cfr, strength: 'low' });
      }
    }
  }

  // Trans Fat Free — separate from the above loop because transFat isn't in
  // LOW_CLAIM_THRESHOLDS (no FDA "Low Trans Fat" tier exists). 21 CFR 101.62(c).
  const transFatFreeCfg = FREE_CLAIM_THRESHOLDS.transFat;
  if (transFatFreeCfg) {
    const transFat = get(perServingNutrition, 'transFat');
    const satFat = get(perServingNutrition, 'saturatedFat');
    // Companion: < 0.5g sat fat (statement-of-identity rule)
    if (transFat < transFatFreeCfg.limit && satFat < 0.5) {
      suggestions.push({ claim: 'Trans Fat Free', citation: transFatFreeCfg.cfr, strength: 'free' });
    }
  }

  // Very Low Sodium — between Sodium Free and Low Sodium (21 CFR 101.61(b)(3))
  const sodiumPerServing = get(perServingNutrition, 'sodium');
  const sodiumFreeCfg = FREE_CLAIM_THRESHOLDS.sodium;
  // Only suggest Very Low if it qualifies AND wasn't already captured by Sodium Free
  if (sodiumPerServing >= (sodiumFreeCfg?.limit ?? 5) && sodiumPerServing <= VERY_LOW_SODIUM_LIMIT.limit) {
    suggestions.push({ claim: 'Very Low Sodium', citation: VERY_LOW_SODIUM_LIMIT.cfr, strength: 'low' });
  }

  // Sugar Free (already covered in the loop above via totalSugars in FREE_CLAIM_THRESHOLDS;
  // kept here for explicit naming, though the loop already adds "Total Sugars Free").
  // Override the generic label with the canonical "Sugar Free" name.
  const sugarsPerServing = get(perServingNutrition, 'totalSugars');
  if (sugarsPerServing < 0.5) {
    // Remove the generic "Total Sugars Free" if the loop added one
    const idx = suggestions.findIndex(s => s.claim === 'Total Sugars Free');
    if (idx >= 0) suggestions.splice(idx, 1);
    suggestions.push({ claim: 'Sugar Free', citation: '21 CFR 101.60(c)(1)', strength: 'free' });
  }

  return suggestions;
}
