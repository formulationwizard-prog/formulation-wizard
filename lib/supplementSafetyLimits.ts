// ============================================================
// SUPPLEMENT DOSAGE SAFETY CHECKER
// ------------------------------------------------------------
// Tiered safety analysis for dietary supplement formulations.
// Mirrors the pattern used for regulatory compliance on cured
// meats / acidified foods (sodium nitrite, potassium sorbate,
// sodium benzoate, etc.) — but applied to per-serving dosage
// against Tolerable Upper Intake Levels (ULs) and banned/
// restricted ingredients.
//
// Tier logic (per limit):
//   pct = (per-serving amount) / UL × 100
//   <  80%  → ok         (green — within safe dose)
//   80-100% → caution    (amber — approaching UL)
//   100-150% → warning   (red — over UL, hazard window)
//   > 150%  → critical   (dark red — clear hazard)
//   special  → banned    (dark red — ingredient should not be used)
//
// Authoritative sources encoded below:
//   • IOM / National Academy of Medicine: Tolerable Upper Intake
//     Levels for vitamins and minerals.
//   • FDA: labeling caps (e.g., 99 mg/serving cap on potassium
//     in OTC supplements, Vitamin A retinol teratogenicity)
//     and botanical warning / import alert lists.
//   • WHO / EFSA where referenced alongside.
//   • Peer-reviewed clinical threshold data for niacin flush,
//     B6 neuropathy, selenosis, etc.
//
// Population modifier:
//   'pregnancy' and 'pediatric' tighten certain UL values
//   (retinol teratogenicity, iron pediatric toxicity, etc.).
// ============================================================
import type { Ingredient } from '../types';

// ============================================================
// UPPER INTAKE LIMITS (ULs)
// ============================================================

export interface SupplementSafetyLimit {
  /** Display name — shown on the safety card. */
  name: string;
  /** Lowercase substrings matched against ingredient / DV row names. */
  keywords: string[];
  /** Tolerable Upper Intake Level (UL) per day. */
  ul: number;
  /** Unit of UL: mg / mcg / IU / g. */
  unit: 'mg' | 'mcg' | 'IU' | 'g';
  /**
   * Fraction of ingredient mass that IS the canonical active for UL comparison.
   * For mineral salts the UL is stated in elemental mineral mass — calcium
   * carbonate is 40% elemental Ca, iron bisglycinate 20% elemental Fe, etc.
   * Without this, the safety card false-alarms for mineral chelates.
   * Defaults to 1.0 (ingredient mass IS the active form).
   */
  elementalFactor?: number;
  /** Regulatory authority establishing the limit. */
  authority: string;
  /** Short citation (e.g., "IOM 2011", "21 CFR 101.36"). */
  citation: string;
  /** Plain-English hazard text surfaced when UL is exceeded. */
  hazard: string;
  /** Practical mitigation advice. */
  mitigation: string;
  /**
   * Adjusted UL multiplier for pregnancy — 1.0 = same as adult UL,
   * 0.5 = half, etc. Omit to use default adult UL.
   */
  pregnancyFactor?: number;
  /** Note explaining the pregnancy-specific risk. */
  pregnancyNote?: string;
  /** Adjusted UL multiplier for pediatric (children < 9). */
  pediatricFactor?: number;
  /** Note explaining the pediatric-specific risk. */
  pediatricNote?: string;
  /**
   * Adjusted UL multiplier for athletic / NSF Certified for Sport context.
   * Used when the product is targeting NCAA collegiate compliance or
   * Informed Sport / NSF Certified for Sport certification pathways.
   */
  athleticFactor?: number;
  /** Note explaining the athletic-context risk. */
  athleticNote?: string;
  /**
   * Secondary caution threshold (as % of UL) below 100% — used
   * when chronic sub-UL intake has documented adverse effects
   * (e.g., B6 neuropathy onset at chronic 50 mg/day).
   */
  cautionPctOfUL?: number;
  /** Explanation for the secondary caution threshold. */
  cautionReason?: string;
}

/**
 * Master UL table. Order does not matter — each ingredient in the
 * formulation is scanned against all entries; best-matching limit
 * by longest keyword wins.
 */
export const SUPPLEMENT_SAFETY_LIMITS: SupplementSafetyLimit[] = [
  // ─── FAT-SOLUBLE VITAMINS (accumulate in tissue — higher risk) ─────────
  {
    name: 'Vitamin A (retinol)',
    keywords: ['vitamin a palmitate', 'retinyl', 'retinol', 'vitamin a'],
    ul: 3000, unit: 'mcg',
    authority: 'IOM (NAM)',
    citation: 'DRI 2001, Table 3-1',
    hazard: 'Chronic excess causes liver toxicity, bone fragility, skin disorders, and teratogenicity. Preformed retinol (palmitate / acetate) — NOT beta-carotene, which the body regulates.',
    mitigation: 'Reformulate under 3,000 mcg RAE / day (≈10,000 IU). Consider substituting beta-carotene for the bulk of vitamin A activity.',
    pregnancyFactor: 1.0,
    pregnancyNote: 'TERATOGENIC: retinol > 3,000 mcg/day in pregnancy is strongly associated with birth defects. This is a hard stop for any prenatal product.',
  },
  {
    name: 'Vitamin D',
    keywords: ['vitamin d3', 'vitamin d2', 'cholecalciferol', 'ergocalciferol', 'vitamin d'],
    ul: 100, unit: 'mcg',
    authority: 'IOM (NAM)',
    citation: 'DRI 2011',
    hazard: 'Chronic excess causes hypercalcemia → kidney stones, soft-tissue calcification, nausea, confusion. UL is 4,000 IU (100 mcg) per day for adults 9+.',
    mitigation: 'Reformulate under 100 mcg (4,000 IU)/day. High-dose D3 products above this need professional-channel positioning and explicit physician-guidance language.',
  },
  {
    name: 'Vitamin E',
    keywords: ['vitamin e', 'tocopher', 'tocotrien'],
    ul: 1000, unit: 'mg',
    authority: 'IOM (NAM)',
    citation: 'DRI 2000',
    hazard: 'Excess alpha-tocopherol increases hemorrhagic stroke risk and interferes with platelet aggregation. Dangerous with anticoagulants (warfarin, aspirin).',
    mitigation: 'Reformulate under 1,000 mg/day. Add a warfarin/anticoagulant warning if dose approaches UL.',
  },

  // ─── WATER-SOLUBLE VITAMINS (narrow windows on a few) ────────────────
  {
    name: 'Niacin (B3)',
    keywords: ['niacin', 'nicotinic acid'],
    ul: 35, unit: 'mg',
    authority: 'IOM (NAM)',
    citation: 'DRI 1998',
    hazard: 'Nicotinic acid causes flushing at ≥35 mg acute; sustained-release formulations cause liver damage at chronic >500 mg/day.',
    mitigation: 'Prefer niacinamide (nicotinamide) — no flush and no hepatotoxicity at supplementation levels. Reserve free-acid niacin for cholesterol formulas with professional guidance.',
  },
  {
    name: 'Vitamin B6 (pyridoxine)',
    keywords: ['vitamin b6', 'b-6', 'pyridox', 'p-5-p', 'p5p'],
    ul: 100, unit: 'mg',
    authority: 'IOM (NAM)',
    citation: 'DRI 1998',
    hazard: 'Chronic excess causes sensory peripheral neuropathy — often irreversible. Onset reported at 50 mg/day with long-term use, not just at UL.',
    mitigation: 'Keep B6 under 100 mg/day and warn users not to stack with other B-complex products. P-5-P (active form) has the same neuropathy risk.',
    cautionPctOfUL: 50,
    cautionReason: 'Peripheral neuropathy has been reported at chronic doses of 50 mg/day — well below the statutory UL. Plan lifetime exposure accordingly.',
  },
  {
    name: 'Folic Acid (synthetic)',
    keywords: ['folic acid', 'folate', 'methylfolate', '5-mthf'],
    ul: 1000, unit: 'mcg',
    authority: 'IOM (NAM)',
    citation: 'DRI 1998',
    hazard: 'Synthetic folic acid above 1,000 mcg/day can mask B12 deficiency and possibly accelerate some cancer progressions.',
    mitigation: 'Cap folic acid at 1,000 mcg. For prenatal products, co-dose with ≥ 25 mcg B12.',
  },
  {
    name: 'Vitamin C',
    keywords: ['vitamin c', 'ascorbic acid', 'sodium ascorbate', 'calcium ascorbate'],
    ul: 2000, unit: 'mg',
    authority: 'IOM (NAM)',
    citation: 'DRI 2000',
    hazard: 'Excess causes GI upset, osmotic diarrhea; rare risk of oxalate kidney stones in predisposed individuals.',
    mitigation: 'Split doses across the day for tolerance. Use buffered forms (sodium/calcium ascorbate) above 1,000 mg.',
  },
  {
    name: 'Choline',
    keywords: ['choline bitartrate', 'choline citrate', 'phosphatidylcholine', 'alpha-gpc', 'choline'],
    ul: 3500, unit: 'mg',
    authority: 'IOM (NAM)',
    citation: 'DRI 1998',
    hazard: 'Excess causes fishy body odor, hypotension, sweating, GI distress.',
    mitigation: 'Keep choline sources ≤ 3,500 mg/day combined.',
  },

  // ─── MINERALS (narrowest therapeutic windows) ────────────────────────
  // NOTE: elementalFactor converts ingredient mass → elemental mineral mass so
  // the %-of-UL math compares like-to-like (UL is stated in elemental mass).
  // Without it, the safety card over-reports by 2–7× for mineral salts/chelates.
  // Keyword order matters — longer/more specific matches win in the lookup.
  {
    name: 'Calcium',
    keywords: ['calcium carbonate', 'calcium citrate', 'calcium'],
    ul: 2500, unit: 'mg',
    elementalFactor: 0.30, // blended average of carbonate (40%) and citrate (21%)
    authority: 'IOM (NAM)',
    citation: 'DRI 2011',
    hazard: 'Chronic excess causes hypercalcemia, kidney stones, milk-alkali syndrome, and emerging cardiovascular calcification concerns.',
    mitigation: 'Keep supplemental Ca under 2,500 mg/day (2,000 mg for adults 51+). Pair with adequate Vitamin D and magnesium.',
  },
  {
    name: 'Iron',
    keywords: ['ferrous sulfate', 'ferrous bisglycinate', 'iron bisglycinate', 'ferrochel', 'iron', 'ferrous'],
    ul: 45, unit: 'mg',
    elementalFactor: 0.25, // blended across sulfate (30%), bisglycinate (20%)
    authority: 'IOM (NAM)',
    citation: 'DRI 2001',
    hazard: 'Iron overdose is the leading cause of pediatric supplement-poisoning deaths. In adults causes GI erosion, liver/cardiac injury, and accelerates hemochromatosis in genetic carriers.',
    mitigation: 'Adult supplementation max 45 mg elemental Fe/day. ALL iron-containing products MUST carry the FDA pediatric warning per 21 CFR 101.17(e) and use unit-dose / child-resistant packaging.',
    pediatricFactor: 0.22,
    pediatricNote: 'Pediatric iron overdose kills. Children under 6 should never receive > 10 mg elemental iron/day except under direct medical supervision.',
  },
  {
    name: 'Zinc',
    keywords: ['zinc picolinate', 'zinc gluconate', 'zinc'],
    ul: 40, unit: 'mg',
    elementalFactor: 0.20, // picolinate (20%), gluconate (14%)
    authority: 'IOM (NAM)',
    citation: 'DRI 2001',
    hazard: 'Chronic excess causes copper deficiency, anemia, immune suppression, and altered taste/smell.',
    mitigation: 'Keep zinc under 40 mg/day. If > 20 mg, add 1-2 mg copper to prevent depletion.',
  },
  {
    name: 'Selenium',
    keywords: ['selenomethionine', 'selenium'],
    ul: 400, unit: 'mcg',
    elementalFactor: 0.40, // L-selenomethionine
    authority: 'IOM (NAM)',
    citation: 'DRI 2000',
    hazard: 'Selenosis: hair and nail brittleness/loss, skin rashes, GI upset, peripheral neuropathy, garlic breath. Narrow therapeutic window.',
    mitigation: 'Cap selenium at 400 mcg/day. Be especially careful with multiple products stacking.',
  },
  {
    name: 'Iodine',
    keywords: ['iodine', 'potassium iodide', 'kelp'],
    ul: 1100, unit: 'mcg',
    elementalFactor: 0.76, // KI is 76% iodide by mass
    authority: 'IOM (NAM)',
    citation: 'DRI 2001',
    hazard: 'Excess triggers thyroid dysfunction — either hyperthyroidism or (paradoxically) hypothyroidism via Wolff-Chaikoff. Acute exposure from kelp can cause goiter.',
    mitigation: 'Keep iodine under 1,100 mcg/day. Kelp-based products vary widely in content — require COA.',
  },
  {
    name: 'Magnesium (supplemental)',
    keywords: ['magnesium glycinate', 'magnesium oxide', 'magnesium citrate', 'magnesium'],
    ul: 350, unit: 'mg',
    elementalFactor: 0.25, // blended: oxide (60%), glycinate (14%), citrate (16%)
    authority: 'IOM (NAM)',
    citation: 'DRI 1997',
    hazard: 'UL applies to supplemental Mg only (not food). Excess causes osmotic diarrhea; in kidney-impaired patients can cause dangerous hypermagnesemia.',
    mitigation: 'Keep supplemental Mg under 350 mg/day. Glycinate and citrate forms are gentler on GI than oxide.',
  },
  {
    name: 'Copper',
    keywords: ['copper gluconate', 'copper'],
    ul: 10, unit: 'mg',
    elementalFactor: 0.20,
    authority: 'IOM (NAM)',
    citation: 'DRI 2001',
    hazard: 'Excess causes GI distress, liver damage, and in Wilson disease carriers can be acutely toxic.',
    mitigation: 'Keep copper under 10 mg/day.',
  },
  {
    name: 'Manganese',
    keywords: ['manganese'],
    ul: 11, unit: 'mg',
    elementalFactor: 0.32,
    authority: 'IOM (NAM)',
    citation: 'DRI 2001',
    hazard: 'Excess is neurotoxic — Parkinsonism-like symptoms reported with chronic high intake.',
    mitigation: 'Keep manganese under 11 mg/day.',
  },
  {
    name: 'Molybdenum',
    keywords: ['molybdenum'],
    ul: 2000, unit: 'mcg',
    authority: 'IOM (NAM)',
    citation: 'DRI 2001',
    hazard: 'Excess can cause gout-like syndrome, copper deficiency.',
    mitigation: 'Keep molybdenum under 2,000 mcg/day.',
  },
  {
    name: 'Potassium (OTC supplemental)',
    keywords: ['potassium chloride', 'potassium citrate', 'potassium'],
    ul: 99, unit: 'mg',
    authority: 'FDA (historical convention)',
    citation: '21 CFR — OTC supplement practice',
    hazard: 'FDA has long required OTC potassium supplements stay ≤ 99 mg/serving. Higher amounts belong in prescription K+ and require cardiac/renal supervision — hyperkalemia can cause fatal arrhythmias.',
    mitigation: 'Cap potassium at 99 mg per tablet/capsule in OTC products. Higher supplemental doses require Rx-channel positioning.',
  },
  {
    name: 'Fluoride',
    keywords: ['fluoride', 'sodium fluoride'],
    ul: 10, unit: 'mg',
    authority: 'IOM (NAM)',
    citation: 'DRI 1997',
    hazard: 'Excess causes dental and skeletal fluorosis; acute overdose is toxic.',
    mitigation: 'Keep fluoride under 10 mg/day in adults; strictly limit pediatric fluoride supplementation.',
    pediatricFactor: 0.2,
    pediatricNote: 'Children under 8 must not exceed 2.2 mg/day fluoride — developing enamel is uniquely susceptible to fluorosis.',
  },
  {
    name: 'Boron',
    keywords: ['boron', 'boric acid'],
    ul: 20, unit: 'mg',
    authority: 'IOM (NAM)',
    citation: 'DRI 2001',
    hazard: 'Excess causes reproductive toxicity in animal studies.',
    mitigation: 'Keep boron under 20 mg/day.',
  },

  // ─── SPECIALTY / STIMULANTS ──────────────────────────────────────────
  {
    name: 'Caffeine',
    keywords: ['caffeine anhydrous', 'caffeine'],
    ul: 400, unit: 'mg',
    authority: 'FDA',
    citation: 'FDA safe daily guidance (adult)',
    hazard: 'Doses > 400 mg/day cause anxiety, insomnia, tachycardia. Acute toxicity at ≥ 1,200 mg. Deaths reported from concentrated caffeine powder.',
    mitigation: 'Keep caffeine per-serving ≤ 200 mg, total daily ≤ 400 mg. Never formulate with unbounded scoops of caffeine powder — FDA has taken enforcement action.',
    pregnancyFactor: 0.5,
    pregnancyNote: 'Pregnant women should not exceed 200 mg caffeine/day (ACOG guidance). Miscarriage risk rises above 200 mg.',
    pediatricFactor: 0.25,
    pediatricNote: 'AAP advises against caffeine for children < 12. Adolescents ≤ 100 mg/day.',
    athleticFactor: 0.5,
    athleticNote: 'NCAA restricts caffeine to ≤ 15 mcg/mL urine (roughly 400–500 mg within 2–3 hours of competition). Target ≤ 200 mg per serving for collegiate-safe products. NSF Certified for Sport and Informed Sport both audit caffeine claims.',
  },
  {
    name: 'Melatonin',
    keywords: ['melatonin'],
    ul: 10, unit: 'mg',
    authority: 'Industry consensus',
    citation: 'No FDA UL — AASM / AAP guidance',
    hazard: 'Doses > 10 mg/night provide no additional benefit and are associated with next-day grogginess, vivid dreams, and hormone disruption.',
    mitigation: 'Effective doses for sleep onset are 0.3-3 mg. Cap formulations at 5 mg for adult OTC; avoid pediatric.',
    pediatricFactor: 0.1,
    pediatricNote: 'Melatonin in children is a growing overdose concern (per CDC). Product should explicitly be "not for use in children under 4" unless pediatric-targeted with clinician guidance.',
  },

  // ─── SODIUM (not a UL but critical for retail context) ────────────────
  {
    name: 'Sodium',
    keywords: ['sodium chloride'],
    ul: 2300, unit: 'mg',
    authority: 'DGA 2020',
    citation: 'Dietary Guidelines for Americans',
    hazard: 'Daily intake > 2,300 mg contributes to hypertension. Most US adults already exceed from food.',
    mitigation: 'Keep supplemental sodium minimal — ideally < 140 mg/serving to allow a "low sodium" claim.',
  },
];

// ============================================================
// BANNED / RESTRICTED INGREDIENTS
// ------------------------------------------------------------
// These are hard-stops regardless of amount. The formulation is
// unlawful or creates unreasonable risk in the US market.
// ============================================================

export interface BannedIngredient {
  name: string;
  keywords: string[];
  scientificName?: string;
  authority: string;
  citation: string;
  reason: string;
  status: 'banned' | 'restricted' | 'import-alert';
}

export const BANNED_OR_RESTRICTED: BannedIngredient[] = [
  {
    name: 'Ephedra / Ma Huang',
    keywords: ['ephedra', 'ma huang', 'ephedrine alkaloid'],
    scientificName: 'Ephedra sinica',
    authority: 'FDA',
    citation: '21 CFR 119 (final rule 2004)',
    reason: 'Banned from dietary supplements — linked to heart attack, stroke, and death. Only permitted in traditional Asian medicinal products not marketed as supplements.',
    status: 'banned',
  },
  {
    name: 'Aristolochia / Aristolochic acid',
    keywords: ['aristolochia', 'aristolochic', 'snakeroot', 'birthwort'],
    scientificName: 'Aristolochia spp.',
    authority: 'FDA',
    citation: 'FDA Import Alert 54-10',
    reason: 'Known human carcinogen and nephrotoxin. Causes irreversible kidney failure and urothelial cancer. Import-banned.',
    status: 'banned',
  },
  {
    name: 'DMAA (1,3-Dimethylamylamine)',
    keywords: ['dmaa', 'dimethylamylamine', 'methylhexanamine', '1,3-dmaa', 'geranamine'],
    authority: 'FDA',
    citation: 'FDA enforcement actions 2013-2015',
    reason: 'Illegal in dietary supplements. Linked to heart attack, seizure, death. FDA has pursued enforcement against every product containing it.',
    status: 'banned',
  },
  {
    name: 'DMHA (Octodrine / 2-Aminoisoheptane)',
    keywords: ['dmha', 'octodrine', '2-aminoisoheptane', 'aconitine'],
    authority: 'FDA',
    citation: 'FDA warning letters 2019-',
    reason: 'Synthetic stimulant — not a legal dietary ingredient. FDA considers it an unapproved drug.',
    status: 'banned',
  },
  {
    name: 'BMPEA (β-Methylphenethylamine)',
    keywords: ['bmpea', 'β-methylphenethylamine', 'beta-methylphenethylamine'],
    authority: 'FDA',
    citation: 'FDA warning letters 2015',
    reason: 'Synthetic amphetamine analog. Not a legal dietary ingredient.',
    status: 'banned',
  },
  {
    name: 'Phenibut',
    keywords: ['phenibut', 'β-phenyl-GABA', 'beta-phenyl-gaba'],
    authority: 'FDA',
    citation: 'FDA warning letters 2019',
    reason: 'Unapproved GABA-B agonist drug — addictive, with severe withdrawal. Not a legal dietary ingredient.',
    status: 'banned',
  },
  {
    name: 'Higenamine',
    keywords: ['higenamine', 'norcoclaurine'],
    authority: 'FDA / WADA',
    citation: 'FDA warning 2019; WADA banned',
    reason: 'Beta-2 agonist cardiac stimulant. Not a legal dietary ingredient; WADA-banned for athletes.',
    status: 'banned',
  },
  {
    name: 'Methylsynephrine (Oxilofrine)',
    keywords: ['methylsynephrine', 'oxilofrine', 'hydroxyephedrine'],
    authority: 'FDA',
    citation: 'FDA warning letters 2016',
    reason: 'Synthetic cardiac stimulant. Not a legal dietary ingredient.',
    status: 'banned',
  },
  {
    name: 'Comfrey (internal use)',
    keywords: ['comfrey', 'symphytum'],
    scientificName: 'Symphytum officinale',
    authority: 'FDA',
    citation: 'FDA advisory July 2001',
    reason: 'Contains hepatotoxic pyrrolizidine alkaloids. Internal use linked to veno-occlusive disease. Acceptable for topical-only products on intact skin.',
    status: 'restricted',
  },
  {
    name: 'Germander',
    keywords: ['germander', 'teucrium'],
    scientificName: 'Teucrium chamaedrys',
    authority: 'FDA (advisory)',
    citation: 'FDA advisory',
    reason: 'Hepatotoxic — causes acute and chronic hepatitis. Withdrawn from EU markets.',
    status: 'restricted',
  },
  {
    name: 'Chaparral / Creosote Bush',
    keywords: ['chaparral', 'creosote bush', 'larrea tridentata', 'larrea'],
    scientificName: 'Larrea tridentata',
    authority: 'FDA (advisory)',
    citation: 'FDA advisory 1992',
    reason: 'Severe hepatotoxicity — irreversible liver failure reported at typical supplemental doses.',
    status: 'restricted',
  },
  {
    name: 'Pennyroyal Oil',
    keywords: ['pennyroyal oil', 'pennyroyal', 'pulegone'],
    scientificName: 'Mentha pulegium',
    authority: 'FDA (advisory)',
    citation: 'FDA advisory',
    reason: 'Neurotoxic and hepatotoxic. Pulegone causes seizures and liver failure. Known deaths from abortifacient use.',
    status: 'restricted',
  },
  {
    name: 'Kava Kava (caution)',
    keywords: ['kava kava', 'kava', 'piper methysticum'],
    scientificName: 'Piper methysticum',
    authority: 'FDA',
    citation: 'FDA consumer advisory March 2002',
    reason: 'Linked to severe liver injury. Permitted in the US but requires hepatotoxicity warning. Banned in Canada, Germany, UK (restrictions vary).',
    status: 'restricted',
  },
  {
    name: 'Yohimbe (unstandardized)',
    keywords: ['yohimbe', 'pausinystalia yohimbe', 'yohimbine hcl'],
    scientificName: 'Pausinystalia johimbe',
    authority: 'FDA / EU',
    citation: 'Various state + country restrictions',
    reason: 'Adrenergic stimulant — cardiac events, hypertension, anxiety. Adulterated products range 0.1-7% yohimbine. Banned in multiple countries; restricted in some US states.',
    status: 'restricted',
  },
];

// ============================================================
// HIGH-RISK INTERACTION HERBS
// ------------------------------------------------------------
// Not banned, but require explicit interaction warnings on label.
// ============================================================

export interface InteractionWarning {
  name: string;
  keywords: string[];
  interactions: string[];
  note: string;
}

export const INTERACTION_WARNINGS: InteractionWarning[] = [
  {
    name: "St. John's Wort",
    keywords: ["st. john's wort", "st johns wort", 'hypericum'],
    interactions: ['SSRIs (serotonin syndrome)', 'oral contraceptives (contraceptive failure)', 'warfarin', 'HIV protease inhibitors', 'cyclosporine (organ transplant)', 'digoxin'],
    note: 'Induces CYP3A4 and P-glycoprotein — reduces effectiveness of ~50% of Rx drugs. Explicit drug-interaction warning required on label.',
  },
  {
    name: 'Licorice Root (glycyrrhizin)',
    keywords: ['licorice root', 'glycyrrhiza', 'glycyrrhizin', 'licorice'],
    interactions: ['antihypertensive drugs', 'digoxin', 'corticosteroids', 'diuretics'],
    note: 'Chronic use causes hypertension and hypokalemia. Use deglycyrrhizinated licorice (DGL) when possible, or limit to ≤ 8 weeks.',
  },
  {
    name: 'Black Cohosh',
    keywords: ['black cohosh', 'cimicifuga', 'actaea racemosa'],
    interactions: ['hepatotoxic drugs', 'hormone therapy'],
    note: 'Post-marketing reports of liver injury. Require hepatotoxicity caveat on label.',
  },
  {
    name: 'Ginkgo Biloba',
    keywords: ['ginkgo biloba', 'ginkgo'],
    interactions: ['warfarin', 'aspirin', 'SSRIs', 'seizure-threshold drugs'],
    note: 'Anticoagulant/antiplatelet effects. Bleeding risk warning required.',
  },
  {
    name: 'Garlic (concentrated)',
    keywords: ['garlic extract', 'allium sativum', 'garlic'],
    interactions: ['warfarin', 'antiplatelet drugs', 'HIV drugs (saquinavir)'],
    note: 'Bleeding risk at supplemental concentrations.',
  },
  {
    name: 'Vitamin K',
    keywords: ['vitamin k', 'phytonadione', 'menaquinone', 'mk-7'],
    interactions: ['warfarin (dramatic reduction in anticoagulant effect)'],
    note: 'Warfarin users must keep Vitamin K intake stable — not necessarily low, but consistent. Label should flag this.',
  },
  {
    name: 'Fish Oil / EPA-DHA',
    keywords: ['fish oil', 'omega-3', 'epa', 'dha', 'krill oil'],
    interactions: ['warfarin', 'aspirin', 'antiplatelet drugs'],
    note: 'Mild antiplatelet effect at doses > 3 g/day combined EPA+DHA.',
  },
  {
    name: '5-HTP / L-Tryptophan',
    keywords: ['5-htp', '5-hydroxytryptophan', 'l-tryptophan', 'tryptophan'],
    interactions: ['SSRIs', 'SNRIs', 'MAOIs', 'triptans (migraine Rx)'],
    note: 'Risk of serotonin syndrome with any serotonergic Rx. Never stack with SSRIs without physician guidance.',
  },
];

// ============================================================
// CHECKER
// ============================================================

export type SafetyTier = 'ok' | 'caution' | 'warning' | 'critical' | 'banned' | 'interaction';

export interface SafetyFinding {
  /** Tier that drives color + severity on the UI. */
  tier: SafetyTier;
  /** Ingredient / active name in the formulation. */
  ingredientName: string;
  /** Display name for the safety rule. */
  limitName: string;
  /** Authority + citation for credibility. */
  authority: string;
  citation: string;
  /** Amount per serving (in UL unit). Null for banned ingredients. */
  amountPerServing: number | null;
  /** Effective UL (may be reduced for pregnancy/pediatric). Null for banned. */
  effectiveUL: number | null;
  /** Unit of UL. Null for banned. */
  unit: string | null;
  /** Percent of effective UL consumed. Null for banned. */
  percentOfUL: number | null;
  /** Plain-English hazard text. */
  hazard: string;
  /** Mitigation / remediation advice. */
  mitigation: string;
  /** Population note if applicable. */
  populationNote?: string;
}

export type Audience = 'general' | 'pregnancy' | 'pediatric' | 'athletic';

/**
 * Compute the effective UL for the active audience.
 * Falls back to the base UL when no pregnancy/pediatric factor defined.
 */
function effectiveULForAudience(limit: SupplementSafetyLimit, audience: Audience): { ul: number; note?: string } {
  if (audience === 'pregnancy' && limit.pregnancyFactor !== undefined) {
    return { ul: limit.ul * limit.pregnancyFactor, note: limit.pregnancyNote };
  }
  if (audience === 'pediatric' && limit.pediatricFactor !== undefined) {
    return { ul: limit.ul * limit.pediatricFactor, note: limit.pediatricNote };
  }
  if (audience === 'athletic' && limit.athleticFactor !== undefined) {
    return { ul: limit.ul * limit.athleticFactor, note: limit.athleticNote };
  }
  return { ul: limit.ul };
}

/**
 * Convert a per-serving amount in mg to the target UL unit.
 */
function convertMgToUnit(mg: number, unit: 'mg' | 'mcg' | 'IU' | 'g'): number {
  if (unit === 'mg') return mg;
  if (unit === 'mcg') return mg * 1000;
  if (unit === 'g') return mg / 1000;
  return mg; // IU — caller should supply IU-based amounts separately; we treat as mg-equivalent
}

/**
 * Match an ingredient name to the tightest applicable UL limit.
 * Scans keywords longest-first to prefer specific matches (e.g., "magnesium oxide"
 * matches the magnesium entry, not a shorter generic one).
 */
function matchLimit(ingredientName: string): SupplementSafetyLimit | null {
  const n = ingredientName.toLowerCase();
  // Sort by longest keyword length so specific matches win
  const allKeywords: Array<{ limit: SupplementSafetyLimit; keyword: string }> = [];
  for (const limit of SUPPLEMENT_SAFETY_LIMITS) {
    for (const k of limit.keywords) allKeywords.push({ limit, keyword: k });
  }
  allKeywords.sort((a, b) => b.keyword.length - a.keyword.length);
  for (const { limit, keyword } of allKeywords) {
    if (n.includes(keyword)) return limit;
  }
  return null;
}

/**
 * Check all ingredients against the banned list.
 */
function matchBanned(ingredientName: string): BannedIngredient | null {
  const n = ingredientName.toLowerCase();
  for (const b of BANNED_OR_RESTRICTED) {
    if (b.keywords.some(k => n.includes(k))) return b;
  }
  return null;
}

/**
 * Check all ingredients against the interaction-herb list.
 */
function matchInteraction(ingredientName: string): InteractionWarning | null {
  const n = ingredientName.toLowerCase();
  for (const w of INTERACTION_WARNINGS) {
    if (w.keywords.some(k => n.includes(k))) return w;
  }
  return null;
}

/**
 * Tier calculation from percent-of-UL.
 * Respects per-limit caution override (e.g., B6 at 50% is still a caution).
 */
function tierFromPercent(pct: number, limit: SupplementSafetyLimit): SafetyTier {
  if (pct > 150) return 'critical';
  if (pct > 100) return 'warning';
  if (pct >= 80) return 'caution';
  if (limit.cautionPctOfUL !== undefined && pct >= limit.cautionPctOfUL) return 'caution';
  return 'ok';
}

/**
 * The main checker — compute safety findings for a formulation.
 *
 * @param ingredients           Full formulation ingredient list.
 * @param perServingMgByName    Map of ingredient name → grams per serving of that ingredient.
 *                              (The caller scales by serving / total batch mass before passing in.)
 * @param audience              Population context — tightens thresholds where applicable.
 */
export function checkSupplementSafety(
  ingredients: Ingredient[],
  perServingMgByName: Map<string, number>,
  audience: Audience = 'general'
): SafetyFinding[] {
  const findings: SafetyFinding[] = [];

  for (const ing of ingredients) {
    // 1. Banned-ingredient check (hard stop regardless of amount)
    const banned = matchBanned(ing.name);
    if (banned) {
      findings.push({
        tier: 'banned',
        ingredientName: ing.name,
        limitName: banned.name,
        authority: banned.authority,
        citation: banned.citation,
        amountPerServing: null,
        effectiveUL: null,
        unit: null,
        percentOfUL: null,
        hazard: banned.reason,
        mitigation: banned.status === 'banned'
          ? 'REMOVE this ingredient. It is not legal in US dietary supplements.'
          : 'Reformulate without this ingredient, or position only under professional supervision with required warnings.',
      });
      continue; // banned ingredients skip UL check
    }

    // 2. Interaction-herb flag (informational — not a block)
    const interaction = matchInteraction(ing.name);
    if (interaction) {
      findings.push({
        tier: 'interaction',
        ingredientName: ing.name,
        limitName: interaction.name,
        authority: 'Clinical literature',
        citation: 'NIH / Mayo / Natural Medicines',
        amountPerServing: null,
        effectiveUL: null,
        unit: null,
        percentOfUL: null,
        hazard: `Drug interactions: ${interaction.interactions.join('; ')}.`,
        mitigation: interaction.note,
      });
    }

    // 2b. Pregnancy-cautioned herb check — traditionally contraindicated during
    // pregnancy even when not UL-capped. Only fires when audience === 'pregnancy'.
    if (audience === 'pregnancy') {
      const n = ing.name.toLowerCase();
      const pregnancyHerbs: Array<{ match: string; name: string; reason: string }> = [
        { match: 'ashwagandh', name: 'Ashwagandha', reason: 'Traditionally contraindicated in pregnancy. Potential abortifacient + thyroid-modulating effects. Avoid in prenatal formulas.' },
        { match: 'saw palmetto', name: 'Saw Palmetto', reason: '5-alpha reductase inhibitor — potential androgen disruption in male fetuses. Avoid entirely in prenatal products.' },
        { match: 'black cohosh', name: 'Black Cohosh', reason: 'Emmenagogue — may induce uterine contractions. Contraindicated in pregnancy.' },
        { match: 'blue cohosh', name: 'Blue Cohosh', reason: 'Known teratogen. Absolute contraindication in pregnancy.' },
        { match: 'dong quai', name: 'Dong Quai', reason: 'Emmenagogue and anticoagulant. Avoid in pregnancy.' },
        { match: 'yarrow', name: 'Yarrow', reason: 'Emmenagogue. Avoid in pregnancy.' },
        { match: 'rue', name: 'Rue', reason: 'Known abortifacient. Absolute contraindication.' },
        { match: 'pennyroyal', name: 'Pennyroyal', reason: 'Hepatotoxic abortifacient. Absolute contraindication.' },
        { match: 'mugwort', name: 'Mugwort', reason: 'Traditionally used as emmenagogue. Avoid.' },
        { match: 'tansy', name: 'Tansy', reason: 'Contains toxic thujones. Contraindicated in pregnancy.' },
        { match: 'ginseng', name: 'Ginseng (Panax)', reason: 'Limited safety data in pregnancy; some studies show teratogenic effects in animal models. Use only under OB guidance.' },
        { match: 'licorice', name: 'Licorice Root', reason: 'Associated with preterm labor and increased cortisol exposure to fetus at chronic supplemental doses. Avoid.' },
      ];
      for (const herb of pregnancyHerbs) {
        if (n.includes(herb.match)) {
          findings.push({
            tier: 'critical',
            ingredientName: ing.name,
            limitName: `${herb.name} — pregnancy contraindication`,
            authority: 'Natural Medicines / ACOG',
            citation: 'Traditional and clinical pregnancy contraindication database',
            amountPerServing: null,
            effectiveUL: null,
            unit: null,
            percentOfUL: null,
            hazard: herb.reason,
            mitigation: 'Remove from prenatal / pregnancy-audience products. Substitute with ingredients on the ACOG / FDA pregnancy-safe list.',
          });
          break;
        }
      }
    }

    // 3. UL check
    const limit = matchLimit(ing.name);
    if (!limit) continue;

    const mgPerServing = perServingMgByName.get(ing.name) ?? 0;
    if (mgPerServing <= 0) continue;

    // Convert ingredient mass → canonical active form (elemental for minerals).
    // UL is stated in elemental / active mass, so apples-to-apples comparison
    // requires this step. Without it, mineral chelates false-alarm at 2-5x
    // their actual elemental contribution.
    const activeMgPerServing = mgPerServing * (limit.elementalFactor ?? 1);
    const amountInULUnit = convertMgToUnit(activeMgPerServing, limit.unit);
    const { ul: effectiveUL, note: populationNote } = effectiveULForAudience(limit, audience);
    const percentOfUL = effectiveUL > 0 ? (amountInULUnit / effectiveUL) * 100 : 0;
    const tier = tierFromPercent(percentOfUL, limit);

    findings.push({
      tier,
      ingredientName: ing.name,
      limitName: limit.name,
      authority: limit.authority,
      citation: limit.citation,
      amountPerServing: amountInULUnit,
      effectiveUL,
      unit: limit.unit,
      percentOfUL,
      hazard: limit.hazard,
      mitigation: tier === 'caution' && limit.cautionReason && percentOfUL < 80
        ? limit.cautionReason
        : limit.mitigation,
      populationNote,
    });
  }

  // Sort by severity for display: banned/critical first, then warning, caution, interaction, ok.
  const order: Record<SafetyTier, number> = {
    banned: 0, critical: 1, warning: 2, caution: 3, interaction: 4, ok: 5,
  };
  findings.sort((a, b) => order[a.tier] - order[b.tier]);
  return findings;
}

/**
 * Summary helper — total counts by tier for UI badges.
 */
export function summarizeFindings(findings: SafetyFinding[]): {
  banned: number; critical: number; warning: number; caution: number; interaction: number;
  hardStop: boolean; // true when any banned / critical / warning present
} {
  const b = findings.filter(f => f.tier === 'banned').length;
  const c = findings.filter(f => f.tier === 'critical').length;
  const w = findings.filter(f => f.tier === 'warning').length;
  const ca = findings.filter(f => f.tier === 'caution').length;
  const i = findings.filter(f => f.tier === 'interaction').length;
  return { banned: b, critical: c, warning: w, caution: ca, interaction: i, hardStop: b + c + w > 0 };
}
