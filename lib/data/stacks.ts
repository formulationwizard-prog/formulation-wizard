// ============================================================
// SUPPLEMENT FORMULATION STACKS — first-class data entities
// ------------------------------------------------------------
// Governed by docs/architecture/catalog-authoring-rulebook.md §VII
// (Stacks as First-Class Data Entities).
//
// A Stack is a named formulation pattern — a clinically-coherent
// grouping of ingredients commonly used together to address one
// physiological domain (sleep, focus, joint, immune, etc.).
//
// Workspace consumes Stack data to:
//   1. RECOMMEND missing companions when an operator pastes a
//      partial formulation matching ≥ 70% of a stack's mustHave list.
//   2. SUGGEST stack-completion in the bulk-paste preview surface.
//   3. VALIDATE that newly-authored catalog entries belong to at
//      least one stack (rulebook §IX.40 pre-commit checklist).
//
// Stack membership tiers per ingredient:
//   • mustHave         — appears in ≥ 95% of category SKUs surveyed
//                        (per quarterly competitor reverse-engineering)
//   • commonCompanion  — appears in 50-95%
//   • optional         — appears in < 50% but operator-relevant
//
// Established: 2026-05-17 (Round 11 Phase 3 post-A.5 follow-up).
// Initial 20 stacks per rulebook §VII.34.
// ============================================================

import type { SupplementDeliveryForm } from '../servingModel';

// ============================================================
// TYPES
// ============================================================

export type StackCategory = 'foundational' | 'targeted' | 'specialty';
export type IntendedAudience = 'general' | 'pregnancy' | 'pediatric' | 'athletic' | 'menopausal' | 'senior';

export interface StackMember {
  /** Generic ingredient name. Bulk-paste resolver matches against catalog
   *  entry `name` field + `synonyms[]` (to be added per rulebook §II.8). */
  ingredientName: string;
  /** Typical-use dose range. Lower bound = clinically-effective floor;
   *  upper bound = customary upper safety dose. */
  typicalDoseRange: { min: number; max: number; unit: 'mg' | 'mcg' | 'g' | 'IU' | 'CFU' };
  /** Why this ingredient belongs in this stack at this tier.
   *  Single sentence; citation belongs on the catalog entry, not here. */
  rationale: string;
}

export interface DosageProfile {
  intendedAudience: IntendedAudience;
  /** Total per-serving mass range across all stack actives, in mg.
   *  Used by the workspace to flag unrealistic formulations (1g of actives
   *  in a #5 capsule, etc.). */
  totalServingMassMg: { min: number; max: number };
  /** Typical operator choice — capsules per serving, gummies per serving, etc. */
  unitsPerServingTypical: number;
  /** Acceptable delivery forms for this stack. Some stacks are form-locked
   *  (sleep stack works in liquid / gummy / capsule; pre-workout typically
   *  powder). */
  deliveryForm: SupplementDeliveryForm[];
}

export interface StackCitation {
  /** What the citation supports. */
  context: string;
  /** Authority — keep tight per rulebook §I.2 citation hierarchy. */
  authority: string;
  /** Short source. */
  source: string;
}

export interface Stack {
  /** Stable ID for cross-references. Format: STACK.<UPPER_SNAKE>. */
  id: string;
  /** Operator-facing name. */
  displayName: string;
  /** Foundational = "every supplement formulator needs to know this stack."
   *  Targeted = "addresses one domain." Specialty = "niche or emerging." */
  category: StackCategory;
  /** One paragraph of clinical context. Operator-readable; non-marketing. */
  description: string;
  mustHave: StackMember[];
  commonCompanion: StackMember[];
  optional: StackMember[];
  dosageProfile: DosageProfile;
  citations: StackCitation[];
  /** Last review date — quarterly cadence per rulebook §V.28. */
  lastReviewedDate: string; // ISO date
  /** Notes on stack evolution. */
  versionNotes?: string;
}

// ============================================================
// STACKS — initial 20 (rulebook §VII.34)
// ------------------------------------------------------------
// Authored 2026-05-17. Membership reflects current US retail data
// (Sprouts / Whole Foods / Amazon best-sellers per category).
// Doses are typical-use ranges from clinical literature, not maxima.
// ============================================================

export const SUPPLEMENT_STACKS: Stack[] = [

  // ─── FOUNDATIONAL — every formulator needs these ─────────────────

  {
    id: 'STACK.MULTIVITAMIN_CORE',
    displayName: 'Daily Multivitamin Core',
    category: 'foundational',
    description: 'The complete daily-foundation formulation. Covers all 13 essential vitamins + major minerals at or near 100% Daily Value to fill dietary gaps. Designed for general-adult once-daily use; prenatal and pediatric variants exist as separate stacks.',
    mustHave: [
      { ingredientName: 'Vitamin A',                typicalDoseRange: { min: 700,  max: 900,  unit: 'mcg' }, rationale: 'Vision, immune, skin. RAE basis.' },
      { ingredientName: 'Vitamin C',                typicalDoseRange: { min: 75,   max: 250,  unit: 'mg'  }, rationale: 'Antioxidant + collagen synthesis. DV 90 mg.' },
      { ingredientName: 'Vitamin D3',               typicalDoseRange: { min: 15,   max: 50,   unit: 'mcg' }, rationale: 'Bone + immune. DV 20 mcg.' },
      { ingredientName: 'Vitamin E',                typicalDoseRange: { min: 15,   max: 30,   unit: 'mg'  }, rationale: 'Lipid antioxidant. DV 15 mg.' },
      { ingredientName: 'Vitamin K',                typicalDoseRange: { min: 90,   max: 180,  unit: 'mcg' }, rationale: 'Coagulation + bone. K2 preferred for bone.' },
      { ingredientName: 'Thiamine',                 typicalDoseRange: { min: 1.2,  max: 5,    unit: 'mg'  }, rationale: 'B1. Energy metabolism. DV 1.2 mg.' },
      { ingredientName: 'Riboflavin',               typicalDoseRange: { min: 1.3,  max: 5,    unit: 'mg'  }, rationale: 'B2. DV 1.3 mg.' },
      { ingredientName: 'Niacin',                   typicalDoseRange: { min: 16,   max: 35,   unit: 'mg'  }, rationale: 'B3 as niacinamide (no flush). DV 16 mg.' },
      { ingredientName: 'Vitamin B6',               typicalDoseRange: { min: 1.7,  max: 20,   unit: 'mg'  }, rationale: 'DV 1.7 mg. Cap below 50 mg/day chronic.' },
      { ingredientName: 'Folate',                   typicalDoseRange: { min: 400,  max: 800,  unit: 'mcg' }, rationale: 'B9. DFE basis. Methylfolate preferred for MTHFR-variant population.' },
      { ingredientName: 'Vitamin B12',              typicalDoseRange: { min: 2.4,  max: 100,  unit: 'mcg' }, rationale: 'DV 2.4 mcg. Methylcobalamin or cyanocobalamin both acceptable.' },
      { ingredientName: 'Biotin',                   typicalDoseRange: { min: 30,   max: 300,  unit: 'mcg' }, rationale: 'B7. DV 30 mcg.' },
      { ingredientName: 'Pantothenic Acid',         typicalDoseRange: { min: 5,    max: 15,   unit: 'mg'  }, rationale: 'B5. DV 5 mg.' },
      { ingredientName: 'Calcium',                  typicalDoseRange: { min: 200,  max: 500,  unit: 'mg'  }, rationale: 'DV 1300 mg total; supplement covers gap. Elemental.' },
      { ingredientName: 'Magnesium',                typicalDoseRange: { min: 100,  max: 300,  unit: 'mg'  }, rationale: 'Glycinate or citrate for tolerance. Supplemental UL 350 mg.' },
      { ingredientName: 'Zinc',                     typicalDoseRange: { min: 8,    max: 25,   unit: 'mg'  }, rationale: 'DV 11 mg. UL 40 mg. Pair with copper if > 20 mg.' },
      { ingredientName: 'Selenium',                 typicalDoseRange: { min: 55,   max: 200,  unit: 'mcg' }, rationale: 'DV 55 mcg. UL 400 mcg.' },
      { ingredientName: 'Copper',                   typicalDoseRange: { min: 0.9,  max: 2,    unit: 'mg'  }, rationale: 'DV 0.9 mg. Required if zinc > 20 mg/day.' },
      { ingredientName: 'Manganese',                typicalDoseRange: { min: 1.8,  max: 5,    unit: 'mg'  }, rationale: 'DV 2.3 mg. UL 11 mg.' },
      { ingredientName: 'Chromium',                 typicalDoseRange: { min: 35,   max: 200,  unit: 'mcg' }, rationale: 'DV 35 mcg. Glucose metabolism.' },
      { ingredientName: 'Molybdenum',               typicalDoseRange: { min: 45,   max: 150,  unit: 'mcg' }, rationale: 'DV 45 mcg.' },
      { ingredientName: 'Iodine',                   typicalDoseRange: { min: 150,  max: 220,  unit: 'mcg' }, rationale: 'DV 150 mcg. Thyroid hormone synthesis.' },
    ],
    commonCompanion: [
      { ingredientName: 'Iron',                     typicalDoseRange: { min: 8,    max: 18,   unit: 'mg'  }, rationale: 'Women of reproductive age; omit for men/postmenopause to avoid overload.' },
      { ingredientName: 'Boron',                    typicalDoseRange: { min: 1,    max: 3,    unit: 'mg'  }, rationale: 'Bone + hormone support.' },
      { ingredientName: 'Choline',                  typicalDoseRange: { min: 100,  max: 550,  unit: 'mg'  }, rationale: 'AI 550 mg men / 425 mg women. Most MVs under-dose; full DV requires separate stack.' },
      { ingredientName: 'Lutein',                   typicalDoseRange: { min: 6,    max: 20,   unit: 'mg'  }, rationale: 'Eye health adjunct.' },
    ],
    optional: [
      { ingredientName: 'Beta-Carotene',            typicalDoseRange: { min: 3,    max: 15,   unit: 'mg'  }, rationale: 'Pro-vitamin A precursor; safer than retinyl in high doses.' },
      { ingredientName: 'Lycopene',                 typicalDoseRange: { min: 5,    max: 30,   unit: 'mg'  }, rationale: 'Carotenoid antioxidant.' },
      { ingredientName: 'Zeaxanthin',               typicalDoseRange: { min: 1,    max: 4,    unit: 'mg'  }, rationale: 'Eye health companion to lutein.' },
    ],
    dosageProfile: {
      intendedAudience: 'general',
      totalServingMassMg: { min: 800, max: 2500 },
      unitsPerServingTypical: 2,
      deliveryForm: ['capsule', 'tablet', 'softgel', 'gummy'],
    },
    citations: [
      { context: 'Vitamin & mineral Daily Values', authority: 'FDA', source: '21 CFR 101.36 Table 1 (2016)' },
      { context: 'Tolerable Upper Intake Levels', authority: 'IOM (NAM)', source: 'DRI 1997-2011' },
    ],
    lastReviewedDate: '2026-05-17',
  },

  {
    id: 'STACK.PRENATAL_CORE',
    displayName: 'Prenatal Multi Core',
    category: 'foundational',
    description: 'Daily foundation for pregnancy + lactation. Higher folate (neural tube defect prevention), iron (anemia prevention), iodine (fetal thyroid development), choline (fetal brain development), and DHA (fetal neurodevelopment). Explicitly EXCLUDES preformed Vit A retinol > 3000 mcg (teratogenic) and pregnancy-contraindicated herbs.',
    mustHave: [
      { ingredientName: 'Folate',                   typicalDoseRange: { min: 600,  max: 1000, unit: 'mcg' }, rationale: 'DRI pregnancy 600 mcg DFE; 800 mcg standard. Methylfolate preferred.' },
      { ingredientName: 'Iron',                     typicalDoseRange: { min: 27,   max: 45,   unit: 'mg'  }, rationale: 'DRI pregnancy 27 mg. Bisglycinate for GI tolerance.' },
      { ingredientName: 'Iodine',                   typicalDoseRange: { min: 220,  max: 300,  unit: 'mcg' }, rationale: 'DRI pregnancy 220 mcg. Fetal thyroid critical.' },
      { ingredientName: 'Choline',                  typicalDoseRange: { min: 450,  max: 550,  unit: 'mg'  }, rationale: 'AI pregnancy 450 mg. Fetal brain development.' },
      { ingredientName: 'DHA',                      typicalDoseRange: { min: 200,  max: 600,  unit: 'mg'  }, rationale: 'Fetal neurodevelopment. Algae-sourced for vegan/vegetarian.' },
      { ingredientName: 'Vitamin D3',               typicalDoseRange: { min: 15,   max: 50,   unit: 'mcg' }, rationale: 'DRI pregnancy 15 mcg.' },
      { ingredientName: 'Calcium',                  typicalDoseRange: { min: 200,  max: 500,  unit: 'mg'  }, rationale: 'DRI pregnancy 1000 mg total; supplement covers gap.' },
      { ingredientName: 'Vitamin B6',               typicalDoseRange: { min: 1.9,  max: 25,   unit: 'mg'  }, rationale: 'DRI pregnancy 1.9 mg. Higher doses (10-25 mg) help with morning sickness.' },
      { ingredientName: 'Vitamin B12',              typicalDoseRange: { min: 2.6,  max: 100,  unit: 'mcg' }, rationale: 'DRI pregnancy 2.6 mcg.' },
    ],
    commonCompanion: [
      { ingredientName: 'Magnesium',                typicalDoseRange: { min: 100,  max: 350,  unit: 'mg'  }, rationale: 'Leg cramps, sleep, BP support.' },
      { ingredientName: 'Vitamin K2',               typicalDoseRange: { min: 45,   max: 180,  unit: 'mcg' }, rationale: 'Bone matrix; pairs with D3 + Ca.' },
      { ingredientName: 'Vitamin C',                typicalDoseRange: { min: 85,   max: 250,  unit: 'mg'  }, rationale: 'DRI pregnancy 85 mg.' },
      { ingredientName: 'Riboflavin',               typicalDoseRange: { min: 1.4,  max: 5,    unit: 'mg'  }, rationale: 'DRI pregnancy 1.4 mg.' },
      { ingredientName: 'Zinc',                     typicalDoseRange: { min: 11,   max: 25,   unit: 'mg'  }, rationale: 'DRI pregnancy 11 mg.' },
    ],
    optional: [
      { ingredientName: 'Ginger',                   typicalDoseRange: { min: 250,  max: 1000, unit: 'mg'  }, rationale: 'Morning sickness adjunct; ACOG-endorsed.' },
      { ingredientName: 'Beta-Carotene',            typicalDoseRange: { min: 3,    max: 9,    unit: 'mg'  }, rationale: 'Safer Vit A source than retinyl in pregnancy (no teratogen risk).' },
    ],
    dosageProfile: {
      intendedAudience: 'pregnancy',
      totalServingMassMg: { min: 1200, max: 3500 },
      unitsPerServingTypical: 2,
      deliveryForm: ['capsule', 'softgel', 'gummy'],
    },
    citations: [
      { context: 'Pregnancy DRI', authority: 'IOM (NAM)', source: 'DRI 1997-2011 pregnancy/lactation tables' },
      { context: 'Folate neural-tube defect prevention', authority: 'CDC', source: 'CDC folic acid pregnancy guidance' },
      { context: 'Vitamin A retinol teratogenicity', authority: 'FDA', source: '21 CFR 184.1932 + IOM DRI 2001' },
      { context: 'Ginger for nausea of pregnancy', authority: 'ACOG', source: 'ACOG Practice Bulletin 189 (2018)' },
    ],
    lastReviewedDate: '2026-05-17',
  },

  // ─── TARGETED — single-domain stacks ────────────────────────

  {
    id: 'STACK.SLEEP',
    displayName: 'Sleep Support',
    category: 'targeted',
    description: 'Pre-bedtime stack for sleep onset latency, total sleep time, and sleep quality. Centers on melatonin (circadian-rhythm signaling) + magnesium (NMDA receptor + GABA modulation) + L-theanine (alpha-wave / relaxation). Effective doses are LOW (especially melatonin); higher doses degrade sleep architecture.',
    mustHave: [
      { ingredientName: 'Melatonin',                typicalDoseRange: { min: 0.3,  max: 5,    unit: 'mg'  }, rationale: 'Sleep onset latency. 0.3-3 mg effective; > 5 mg associated with grogginess + vivid dreams.' },
      { ingredientName: 'Magnesium Glycinate',      typicalDoseRange: { min: 200,  max: 400,  unit: 'mg'  }, rationale: 'NMDA + GABA modulation. Glycinate form for GI tolerance + glycine cofactor.' },
      { ingredientName: 'L-Theanine',               typicalDoseRange: { min: 100,  max: 400,  unit: 'mg'  }, rationale: 'Alpha-wave promotion. Non-sedating; calms without grogginess.' },
    ],
    commonCompanion: [
      { ingredientName: 'GABA',                     typicalDoseRange: { min: 100,  max: 750,  unit: 'mg'  }, rationale: 'Inhibitory neurotransmitter. BBB permeability debated; PharmaGABA fermented form preferred.' },
      { ingredientName: 'Glycine',                  typicalDoseRange: { min: 1000, max: 3000, unit: 'mg'  }, rationale: 'Sleep quality at 3 g pre-bed. Sweet taste; can be added to drinks.' },
      { ingredientName: 'Apigenin',                 typicalDoseRange: { min: 25,   max: 50,   unit: 'mg'  }, rationale: 'Chamomile-derived flavonoid; benzodiazepine-receptor binding at low affinity.' },
      { ingredientName: 'Tart Cherry',              typicalDoseRange: { min: 480,  max: 1000, unit: 'mg'  }, rationale: 'Endogenous melatonin source; Montmorency strain best-studied.' },
    ],
    optional: [
      { ingredientName: 'Magnolia Bark',            typicalDoseRange: { min: 200,  max: 400,  unit: 'mg'  }, rationale: 'Honokiol/magnolol GABA-A modulation.' },
      { ingredientName: 'Passionflower',            typicalDoseRange: { min: 250,  max: 500,  unit: 'mg'  }, rationale: 'Traditional sedative herb; mild.' },
      { ingredientName: 'Lemon Balm',               typicalDoseRange: { min: 300,  max: 600,  unit: 'mg'  }, rationale: 'Rosmarinic acid; mild calming.' },
      { ingredientName: 'Valerian Root',            typicalDoseRange: { min: 300,  max: 600,  unit: 'mg'  }, rationale: 'Traditional sleep herb; objectively modest effect; strong smell.' },
    ],
    dosageProfile: {
      intendedAudience: 'general',
      totalServingMassMg: { min: 300, max: 2500 },
      unitsPerServingTypical: 2,
      deliveryForm: ['capsule', 'gummy', 'liquid'],
    },
    citations: [
      { context: 'Melatonin dose-response for sleep onset', authority: 'AASM', source: 'AASM clinical practice guideline (Insomnia 2008, updated 2021)' },
      { context: 'Magnesium glycinate sleep effects', authority: 'Peer-reviewed', source: 'Abbasi 2012; Wienecke 2016' },
      { context: 'L-theanine alpha-wave', authority: 'Peer-reviewed', source: 'Kimura 2007 (EEG)' },
    ],
    lastReviewedDate: '2026-05-17',
  },

  {
    id: 'STACK.FOCUS',
    displayName: 'Focus / Nootropic',
    category: 'targeted',
    description: 'Cognitive-performance stack for sustained attention, working memory, and processing speed. Caffeine + L-theanine is the foundational pairing (synergy: theanine smooths caffeine; both improve attention measures). Lion\'s Mane and Bacopa support longer-term neuroplasticity at 8-12 weeks.',
    mustHave: [
      { ingredientName: 'Caffeine',                 typicalDoseRange: { min: 50,   max: 200,  unit: 'mg'  }, rationale: 'Adenosine-receptor antagonism. 1-3 mg/kg bodyweight effective; tolerance develops in 2-3 weeks.' },
      { ingredientName: 'L-Theanine',               typicalDoseRange: { min: 100,  max: 200,  unit: 'mg'  }, rationale: 'Caffeine companion — smooths anxiety + improves attention measures. 2:1 theanine:caffeine ratio classic.' },
      { ingredientName: 'Lion\'s Mane',             typicalDoseRange: { min: 500,  max: 3000, unit: 'mg'  }, rationale: 'Nerve growth factor stimulation; cognitive effects at 8-12 weeks of use. Fruiting-body extract preferred.' },
    ],
    commonCompanion: [
      { ingredientName: 'Bacopa Monnieri',          typicalDoseRange: { min: 300,  max: 600,  unit: 'mg'  }, rationale: '50% bacosides standardized. Memory consolidation at 12+ weeks. Adaptogenic + cholinergic.' },
      { ingredientName: 'Rhodiola Rosea',           typicalDoseRange: { min: 200,  max: 400,  unit: 'mg'  }, rationale: '3% rosavins / 1% salidroside. Anti-fatigue + acute cognitive performance.' },
      { ingredientName: 'Citicoline',               typicalDoseRange: { min: 250,  max: 500,  unit: 'mg'  }, rationale: 'CDP-choline. Acetylcholine + phosphatidylcholine precursor. Cognizin (Kyowa Hakko) most-studied.' },
      { ingredientName: 'Vitamin B12',              typicalDoseRange: { min: 100,  max: 1000, unit: 'mcg' }, rationale: 'B-vitamin synergy with mental-energy stack.' },
      { ingredientName: 'Vitamin B6',               typicalDoseRange: { min: 1.7,  max: 25,   unit: 'mg'  }, rationale: 'Cofactor for neurotransmitter synthesis.' },
    ],
    optional: [
      { ingredientName: 'Tyrosine',                 typicalDoseRange: { min: 500,  max: 2000, unit: 'mg'  }, rationale: 'Dopamine precursor; acute stress-cognition protection.' },
      { ingredientName: 'Alpha-GPC',                typicalDoseRange: { min: 300,  max: 600,  unit: 'mg'  }, rationale: 'Cholinergic stimulation; faster-acting than citicoline.' },
      { ingredientName: 'Phosphatidylserine',       typicalDoseRange: { min: 100,  max: 300,  unit: 'mg'  }, rationale: 'Membrane phospholipid; cognitive support + cortisol-lowering.' },
      { ingredientName: 'Ginkgo Biloba',            typicalDoseRange: { min: 120,  max: 240,  unit: 'mg'  }, rationale: 'EGb 761; cerebral blood flow. Drug-interaction caution (warfarin, SSRIs).' },
    ],
    dosageProfile: {
      intendedAudience: 'general',
      totalServingMassMg: { min: 500, max: 5000 },
      unitsPerServingTypical: 2,
      deliveryForm: ['capsule', 'tablet', 'powder'],
    },
    citations: [
      { context: 'Caffeine + L-theanine combined effects', authority: 'Peer-reviewed', source: 'Owen 2008; Haskell 2008 (Nutritional Neuroscience)' },
      { context: 'Lion\'s Mane NGF stimulation', authority: 'Peer-reviewed', source: 'Mori 2009 (mild cognitive impairment)' },
      { context: 'Bacopa cognitive effects', authority: 'Peer-reviewed', source: 'Stough 2001-2008; Calabrese 2008' },
    ],
    lastReviewedDate: '2026-05-17',
  },

  {
    id: 'STACK.PRE_WORKOUT',
    displayName: 'Pre-Workout',
    category: 'targeted',
    description: 'Performance + ergogenic stack consumed 20-30 min before exercise. Caffeine (CNS stimulant), beta-alanine (muscle carnosine for power endurance), creatine (ATP regeneration), and citrulline (NO precursor for vasodilation). Powder format dominates; capsules require multiple servings.',
    mustHave: [
      { ingredientName: 'Caffeine',                 typicalDoseRange: { min: 100,  max: 300,  unit: 'mg'  }, rationale: '3-6 mg/kg bodyweight pre-training. NSF Certified for Sport thresholds apply.' },
      { ingredientName: 'Beta-Alanine',             typicalDoseRange: { min: 2000, max: 5000, unit: 'mg'  }, rationale: 'Muscle carnosine → buffers H+ during high-rep training. Tingles (paresthesia) at higher doses.' },
      { ingredientName: 'Creatine Monohydrate',     typicalDoseRange: { min: 3000, max: 5000, unit: 'mg'  }, rationale: 'ATP regeneration. Daily timing flexible; pre-workout convenient. Creapure preferred.' },
      { ingredientName: 'L-Citrulline Malate',      typicalDoseRange: { min: 6000, max: 8000, unit: 'mg'  }, rationale: 'NO precursor; more effective than arginine. 2:1 citrulline:malate clinical-grade.' },
    ],
    commonCompanion: [
      { ingredientName: 'L-Tyrosine',               typicalDoseRange: { min: 500,  max: 2000, unit: 'mg'  }, rationale: 'Dopamine precursor; CNS performance under stress.' },
      { ingredientName: 'Betaine Anhydrous',        typicalDoseRange: { min: 1250, max: 2500, unit: 'mg'  }, rationale: 'TMG. Power-output ergogenic + methyl donor.' },
      { ingredientName: 'Taurine',                  typicalDoseRange: { min: 500,  max: 2000, unit: 'mg'  }, rationale: 'Endurance + cardiac function.' },
      { ingredientName: 'Vitamin B6',               typicalDoseRange: { min: 1.7,  max: 10,   unit: 'mg'  }, rationale: 'Energy metabolism cofactor.' },
      { ingredientName: 'Vitamin B12',              typicalDoseRange: { min: 100,  max: 1000, unit: 'mcg' }, rationale: 'Energy metabolism + red blood cell.' },
    ],
    optional: [
      { ingredientName: 'Theobromine',              typicalDoseRange: { min: 100,  max: 300,  unit: 'mg'  }, rationale: 'Cocoa-derived; smoother stim than caffeine alone.' },
      { ingredientName: 'L-Theanine',               typicalDoseRange: { min: 100,  max: 200,  unit: 'mg'  }, rationale: 'Smooths caffeine if jitters are an issue.' },
      { ingredientName: 'Alpha-GPC',                typicalDoseRange: { min: 300,  max: 600,  unit: 'mg'  }, rationale: 'Power-output ergogenic (cholinergic).' },
      { ingredientName: 'Agmatine Sulfate',         typicalDoseRange: { min: 500,  max: 1500, unit: 'mg'  }, rationale: 'Pump enhancer (NO synthase modulator).' },
    ],
    dosageProfile: {
      intendedAudience: 'athletic',
      totalServingMassMg: { min: 8000, max: 25000 },
      unitsPerServingTypical: 1, // typically 1 scoop / 1 serving
      deliveryForm: ['powder'],
    },
    citations: [
      { context: 'Caffeine performance ergogenic', authority: 'IOC', source: 'IOC consensus statement (2018)' },
      { context: 'Beta-alanine muscle carnosine', authority: 'ISSN', source: 'ISSN position stand (Trexler 2015)' },
      { context: 'Creatine monohydrate efficacy', authority: 'ISSN', source: 'ISSN position stand (Kreider 2017)' },
    ],
    lastReviewedDate: '2026-05-17',
  },

  {
    id: 'STACK.RECOVERY_BCAA',
    displayName: 'Post-Workout / Recovery',
    category: 'targeted',
    description: 'Post-training recovery stack focusing on protein synthesis, electrolyte replenishment, and DOMS reduction. BCAAs only effective in low-protein states; full-spectrum EAAs preferred for most.',
    mustHave: [
      { ingredientName: 'BCAAs',                    typicalDoseRange: { min: 5000, max: 10000, unit: 'mg' }, rationale: '2:1:1 leucine:isoleucine:valine ratio. Leucine triggers mTOR.' },
      { ingredientName: 'L-Glutamine',              typicalDoseRange: { min: 5000, max: 15000, unit: 'mg' }, rationale: 'Gut-barrier + immune support post-training stress.' },
      { ingredientName: 'Electrolytes',             typicalDoseRange: { min: 500,  max: 2000,  unit: 'mg' }, rationale: 'Sodium + potassium + magnesium blend. Hydration replacement.' },
    ],
    commonCompanion: [
      { ingredientName: 'Tart Cherry',              typicalDoseRange: { min: 480,  max: 1000, unit: 'mg'  }, rationale: 'DOMS reduction; Montmorency strain best-studied.' },
      { ingredientName: 'HMB',                      typicalDoseRange: { min: 1500, max: 3000, unit: 'mg'  }, rationale: 'Leucine metabolite; muscle catabolism prevention.' },
      { ingredientName: 'Magnesium',                typicalDoseRange: { min: 200,  max: 400,  unit: 'mg'  }, rationale: 'Muscle relaxation + electrolyte. Glycinate or malate.' },
      { ingredientName: 'L-Citrulline',             typicalDoseRange: { min: 3000, max: 6000, unit: 'mg'  }, rationale: 'Recovery blood-flow.' },
    ],
    optional: [
      { ingredientName: 'Creatine Monohydrate',     typicalDoseRange: { min: 3000, max: 5000, unit: 'mg'  }, rationale: 'Daily timing flexible; post-workout works.' },
      { ingredientName: 'Whey Protein Isolate',     typicalDoseRange: { min: 20,   max: 40,   unit: 'g'   }, rationale: 'Complete protein; mTOR activation.' },
      { ingredientName: 'Collagen Peptides',        typicalDoseRange: { min: 10,   max: 20,   unit: 'g'   }, rationale: 'Connective-tissue support; pair with Vit C for synthesis.' },
    ],
    dosageProfile: {
      intendedAudience: 'athletic',
      totalServingMassMg: { min: 10000, max: 50000 },
      unitsPerServingTypical: 1,
      deliveryForm: ['powder'],
    },
    citations: [
      { context: 'BCAA protein synthesis', authority: 'ISSN', source: 'Wolfe 2017' },
      { context: 'Tart cherry DOMS reduction', authority: 'Peer-reviewed', source: 'Connolly 2006; Howatson 2010' },
      { context: 'HMB catabolism prevention', authority: 'Peer-reviewed', source: 'Wilson 2013 (ISSN position)' },
    ],
    lastReviewedDate: '2026-05-17',
  },

  {
    id: 'STACK.WOMENS_HORMONAL',
    displayName: 'Women\'s Hormonal Balance',
    category: 'targeted',
    description: 'Cycle-aware female hormonal support. Iron (reproductive-age anemia prevention), B-complex (PMS support), magnesium (PMS + sleep), and life-stage-specific herbs (Vitex / Black Cohosh / Maca). Pregnancy contraindications apply to several botanical members.',
    mustHave: [
      { ingredientName: 'Iron',                     typicalDoseRange: { min: 18,   max: 27,   unit: 'mg'  }, rationale: 'Reproductive-age women DRI 18 mg; menstrual loss compensation. Bisglycinate.' },
      { ingredientName: 'Folate',                   typicalDoseRange: { min: 400,  max: 800,  unit: 'mcg' }, rationale: 'Methylfolate for MTHFR-variant population. Pre-conception preparation.' },
      { ingredientName: 'Vitamin B6',               typicalDoseRange: { min: 10,   max: 50,   unit: 'mg'  }, rationale: 'PMS support (clinical 50-100 mg trials).' },
      { ingredientName: 'Vitamin B12',              typicalDoseRange: { min: 100,  max: 1000, unit: 'mcg' }, rationale: 'Methylcobalamin preferred.' },
      { ingredientName: 'Calcium',                  typicalDoseRange: { min: 200,  max: 600,  unit: 'mg'  }, rationale: 'Bone health pre-menopausal + PMS support at 600 mg.' },
      { ingredientName: 'Vitamin D3',               typicalDoseRange: { min: 25,   max: 75,   unit: 'mcg' }, rationale: 'Bone + immune + fertility.' },
      { ingredientName: 'Magnesium',                typicalDoseRange: { min: 200,  max: 400,  unit: 'mg'  }, rationale: 'PMS + sleep + bone.' },
    ],
    commonCompanion: [
      { ingredientName: 'Vitex',                    typicalDoseRange: { min: 200,  max: 400,  unit: 'mg'  }, rationale: 'Chasteberry. Cycle regulation + PMS. PREGNANCY CONTRAINDICATED.' },
      { ingredientName: 'DIM',                      typicalDoseRange: { min: 100,  max: 200,  unit: 'mg'  }, rationale: 'Diindolylmethane. Estrogen metabolism support.' },
      { ingredientName: 'Evening Primrose Oil',     typicalDoseRange: { min: 1000, max: 3000, unit: 'mg'  }, rationale: 'GLA source; PMS + skin.' },
      { ingredientName: 'Black Cohosh',             typicalDoseRange: { min: 40,   max: 200,  unit: 'mg'  }, rationale: 'Menopause specifically; PREGNANCY CONTRAINDICATED.' },
      { ingredientName: 'Maca',                     typicalDoseRange: { min: 1500, max: 3000, unit: 'mg'  }, rationale: 'Adaptogen; libido + mood + cycle support.' },
    ],
    optional: [
      { ingredientName: 'Cranberry Extract',        typicalDoseRange: { min: 250,  max: 500,  unit: 'mg'  }, rationale: 'UTI prevention; PAC-A standardization.' },
      { ingredientName: 'Lactobacillus rhamnosus',  typicalDoseRange: { min: 1e9,  max: 10e9, unit: 'CFU' }, rationale: 'Vaginal/urinary microbiome support.' },
    ],
    dosageProfile: {
      intendedAudience: 'general', // life-stage variants exist
      totalServingMassMg: { min: 1500, max: 5000 },
      unitsPerServingTypical: 2,
      deliveryForm: ['capsule', 'tablet', 'gummy'],
    },
    citations: [
      { context: 'Iron RDA reproductive women', authority: 'IOM (NAM)', source: 'DRI 2001' },
      { context: 'B6 for PMS', authority: 'Cochrane', source: 'Cochrane systematic review 2009' },
      { context: 'Vitex / chasteberry', authority: 'Peer-reviewed', source: 'Schellenberg 2001 (BMJ); meta-analysis 2013' },
    ],
    lastReviewedDate: '2026-05-17',
    versionNotes: '[[feedback_womens_health_transitional_bucket]] — splitting into life-stage-specific stacks (menopausal-support, fertility-support) is a Wave-3a refactor ticket.',
  },

  {
    id: 'STACK.MENS_PROSTATE',
    displayName: 'Men\'s Prostate Support',
    category: 'targeted',
    description: 'BPH / prostate health stack. Saw Palmetto is the most-studied member; zinc is required cofactor for 5-alpha-reductase regulation. Pygeum and Stinging Nettle are commonly added; lycopene supports oxidative-stress reduction.',
    mustHave: [
      { ingredientName: 'Saw Palmetto',             typicalDoseRange: { min: 320,  max: 640,  unit: 'mg'  }, rationale: '85% fatty acids standardized. Permixon / Indena best-studied. 320 mg/day clinical.' },
      { ingredientName: 'Zinc',                     typicalDoseRange: { min: 15,   max: 25,   unit: 'mg'  }, rationale: 'Highest concentration in prostate tissue; cofactor.' },
      { ingredientName: 'Lycopene',                 typicalDoseRange: { min: 10,   max: 30,   unit: 'mg'  }, rationale: 'Carotenoid antioxidant; epidemiologic prostate health association.' },
      { ingredientName: 'Selenium',                 typicalDoseRange: { min: 100,  max: 200,  unit: 'mcg' }, rationale: 'Cofactor for prostate antioxidant defense.' },
    ],
    commonCompanion: [
      { ingredientName: 'Pygeum',                   typicalDoseRange: { min: 100,  max: 200,  unit: 'mg'  }, rationale: '14% sterols. Companion to saw palmetto.' },
      { ingredientName: 'Stinging Nettle',          typicalDoseRange: { min: 250,  max: 500,  unit: 'mg'  }, rationale: 'Root extract for BPH; mild estrogen-modulation.' },
      { ingredientName: 'Pumpkin Seed Extract',     typicalDoseRange: { min: 500,  max: 1000, unit: 'mg'  }, rationale: 'Phytosterol-rich; bladder function.' },
      { ingredientName: 'Vitamin D3',               typicalDoseRange: { min: 50,   max: 100,  unit: 'mcg' }, rationale: 'Prostate-tissue VDR expression.' },
    ],
    optional: [
      { ingredientName: 'Beta-Sitosterol',          typicalDoseRange: { min: 60,   max: 130,  unit: 'mg'  }, rationale: 'Phytosterol; BPH-symptom improvement.' },
      { ingredientName: 'Boron',                    typicalDoseRange: { min: 3,    max: 10,   unit: 'mg'  }, rationale: 'Hormone-modulation; SHBG modulator.' },
    ],
    dosageProfile: {
      intendedAudience: 'senior',
      totalServingMassMg: { min: 600, max: 3000 },
      unitsPerServingTypical: 2,
      deliveryForm: ['capsule', 'softgel'],
    },
    citations: [
      { context: 'Saw palmetto BPH efficacy', authority: 'Cochrane', source: 'Cochrane Review 2012 (Tacklind)' },
      { context: 'Zinc prostate physiology', authority: 'Peer-reviewed', source: 'Kelleher 2009' },
    ],
    lastReviewedDate: '2026-05-17',
  },

  {
    id: 'STACK.JOINT',
    displayName: 'Joint Support',
    category: 'targeted',
    description: 'Connective-tissue maintenance + symptom reduction for osteoarthritis and athletic wear. Glucosamine + Chondroitin (cartilage substrates), Curcumin (anti-inflammatory), Type II Collagen (immune-tolerance for OA).',
    mustHave: [
      { ingredientName: 'Glucosamine Sulfate',      typicalDoseRange: { min: 1500, max: 1500, unit: 'mg'  }, rationale: 'GAIT trial dose. Shellfish-derived (allergen!) unless plant-fermented.' },
      { ingredientName: 'Chondroitin Sulfate',      typicalDoseRange: { min: 800,  max: 1200, unit: 'mg'  }, rationale: 'Bovine cartilage source. GAIT trial dose.' },
      { ingredientName: 'MSM',                      typicalDoseRange: { min: 1500, max: 3000, unit: 'mg'  }, rationale: 'Organic sulfur for connective-tissue + anti-inflammatory.' },
      { ingredientName: 'Curcumin',                 typicalDoseRange: { min: 500,  max: 1000, unit: 'mg'  }, rationale: 'Anti-inflammatory. Bioavailability-enhanced form (BCM-95, Meriva, Theracurmin).' },
    ],
    commonCompanion: [
      { ingredientName: 'Boswellia Serrata',        typicalDoseRange: { min: 250,  max: 500,  unit: 'mg'  }, rationale: '65% AKBA / 30% boswellic acids. 5-LOX inhibitor.' },
      { ingredientName: 'Type II Collagen',         typicalDoseRange: { min: 40,   max: 40,   unit: 'mg'  }, rationale: 'UC-II 40 mg/day clinical. Immune-tolerance mechanism.' },
      { ingredientName: 'Hyaluronic Acid',          typicalDoseRange: { min: 80,   max: 240,  unit: 'mg'  }, rationale: 'Synovial-fluid component; low-MW for oral absorption.' },
      { ingredientName: 'EPA/DHA',                  typicalDoseRange: { min: 1000, max: 3000, unit: 'mg'  }, rationale: 'Omega-3 anti-inflammatory pathway.' },
    ],
    optional: [
      { ingredientName: 'Vitamin D3',               typicalDoseRange: { min: 50,   max: 100,  unit: 'mcg' }, rationale: 'Cartilage health.' },
      { ingredientName: 'Vitamin K2',               typicalDoseRange: { min: 90,   max: 180,  unit: 'mcg' }, rationale: 'Cartilage / bone matrix.' },
      { ingredientName: 'Ginger Extract',           typicalDoseRange: { min: 250,  max: 1000, unit: 'mg'  }, rationale: 'COX-2 modulation; mild anti-inflammatory.' },
    ],
    dosageProfile: {
      intendedAudience: 'general',
      totalServingMassMg: { min: 2500, max: 8000 },
      unitsPerServingTypical: 4,
      deliveryForm: ['capsule', 'tablet'],
    },
    citations: [
      { context: 'GAIT trial glucosamine + chondroitin', authority: 'NIH', source: 'GAIT 2006 (NEJM)' },
      { context: 'Curcumin in OA', authority: 'Peer-reviewed', source: 'Kuptniratsaikul 2014 (Meriva equivalence to ibuprofen)' },
      { context: 'UC-II Type II collagen', authority: 'Peer-reviewed', source: 'Lugo 2015 (knee OA)' },
    ],
    lastReviewedDate: '2026-05-17',
  },

  {
    id: 'STACK.IMMUNE',
    displayName: 'Immune Support',
    category: 'targeted',
    description: 'Acute and maintenance immune-system support. Vitamin C + Zinc are the foundational dyad (URTI duration). Vitamin D3 corrects deficiency, which is the highest-leverage modifiable immune factor. Elderberry has acute (not preventive) effect in URTI.',
    mustHave: [
      { ingredientName: 'Vitamin C',                typicalDoseRange: { min: 200,  max: 1000, unit: 'mg'  }, rationale: 'URTI duration shortening; 1-2 g divided doses for acute.' },
      { ingredientName: 'Vitamin D3',               typicalDoseRange: { min: 50,   max: 100,  unit: 'mcg' }, rationale: 'Deficiency correction = highest-leverage immune factor.' },
      { ingredientName: 'Zinc',                     typicalDoseRange: { min: 15,   max: 50,   unit: 'mg'  }, rationale: 'Acute URTI duration; lozenge or fast-release for maximum effect.' },
      { ingredientName: 'Elderberry',               typicalDoseRange: { min: 300,  max: 1200, unit: 'mg'  }, rationale: 'Anthocyanin-rich. URTI duration (acute, not preventive).' },
    ],
    commonCompanion: [
      { ingredientName: 'Echinacea',                typicalDoseRange: { min: 300,  max: 900,  unit: 'mg'  }, rationale: 'E. purpurea standardized; URTI prophylaxis (preventive use).' },
      { ingredientName: 'Quercetin',                typicalDoseRange: { min: 250,  max: 1000, unit: 'mg'  }, rationale: 'Mast-cell stabilizer; respiratory inflammation modulation.' },
      { ingredientName: 'NAC',                      typicalDoseRange: { min: 600,  max: 1800, unit: 'mg'  }, rationale: 'Mucolytic + glutathione precursor; respiratory.' },
      { ingredientName: 'Selenium',                 typicalDoseRange: { min: 100,  max: 200,  unit: 'mcg' }, rationale: 'Antioxidant defense.' },
      { ingredientName: 'Beta-Glucan',              typicalDoseRange: { min: 250,  max: 500,  unit: 'mg'  }, rationale: 'Yeast or mushroom-derived; macrophage activation.' },
    ],
    optional: [
      { ingredientName: 'Andrographis',             typicalDoseRange: { min: 200,  max: 400,  unit: 'mg'  }, rationale: 'Andrographolide-standardized; URTI severity.' },
      { ingredientName: 'Olive Leaf Extract',       typicalDoseRange: { min: 250,  max: 500,  unit: 'mg'  }, rationale: 'Oleuropein-standardized; antiviral/antimicrobial.' },
      { ingredientName: 'Probiotic Multi-Strain',   typicalDoseRange: { min: 10e9, max: 50e9, unit: 'CFU' }, rationale: 'Gut-immune axis support.' },
    ],
    dosageProfile: {
      intendedAudience: 'general',
      totalServingMassMg: { min: 800, max: 5000 },
      unitsPerServingTypical: 2,
      deliveryForm: ['capsule', 'tablet', 'gummy', 'liquid'],
    },
    citations: [
      { context: 'Vitamin C URTI duration', authority: 'Cochrane', source: 'Hemilä 2013' },
      { context: 'Zinc acute URTI', authority: 'Cochrane', source: 'Singh 2013' },
      { context: 'Vitamin D and infection', authority: 'Peer-reviewed', source: 'Martineau 2017 (BMJ meta-analysis)' },
    ],
    lastReviewedDate: '2026-05-17',
  },

  {
    id: 'STACK.GUT',
    displayName: 'Gut / Digestive Health',
    category: 'targeted',
    description: 'Multi-strain probiotic + prebiotic fiber substrate + digestive enzymes. Gut barrier support via L-glutamine and DGL. Strain-specificity matters: clinical effects are strain-level, not species-level.',
    mustHave: [
      { ingredientName: 'Probiotic Multi-Strain',   typicalDoseRange: { min: 10e9, max: 50e9, unit: 'CFU' }, rationale: 'Multi-strain at 10-50 billion CFU through expiry. Strain-clinical efficacy required.' },
      { ingredientName: 'Inulin',                   typicalDoseRange: { min: 2000, max: 8000, unit: 'mg'  }, rationale: 'FOS-rich prebiotic substrate. Start low; GI tolerance.' },
      { ingredientName: 'Digestive Enzymes',        typicalDoseRange: { min: 100,  max: 500,  unit: 'mg'  }, rationale: 'Amylase + Protease + Lipase + Cellulase + Lactase. FCC-graded.' },
    ],
    commonCompanion: [
      { ingredientName: 'L-Glutamine',              typicalDoseRange: { min: 5000, max: 15000, unit: 'mg' }, rationale: 'Gut-barrier substrate (enterocyte fuel).' },
      { ingredientName: 'DGL Licorice',             typicalDoseRange: { min: 380,  max: 760,  unit: 'mg'  }, rationale: 'Deglycyrrhizinated; soothes mucosa. Avoid full licorice (HTN risk).' },
      { ingredientName: 'Slippery Elm',             typicalDoseRange: { min: 400,  max: 1200, unit: 'mg'  }, rationale: 'Demulcent; soothes mucosa.' },
      { ingredientName: 'Marshmallow Root',         typicalDoseRange: { min: 200,  max: 1000, unit: 'mg'  }, rationale: 'Demulcent; soothes esophageal/gastric mucosa.' },
      { ingredientName: 'Saccharomyces Boulardii',  typicalDoseRange: { min: 250,  max: 1000, unit: 'mg'  }, rationale: 'Yeast probiotic; resistant to abx; AAD prevention.' },
    ],
    optional: [
      { ingredientName: 'Bone Broth Protein',       typicalDoseRange: { min: 10,   max: 20,   unit: 'g'   }, rationale: 'Collagen + minerals; gut-lining support.' },
      { ingredientName: 'Bovine Colostrum',         typicalDoseRange: { min: 1000, max: 3000, unit: 'mg'  }, rationale: 'IgG + growth factors; gut-barrier support.' },
      { ingredientName: 'Zinc Carnosine',           typicalDoseRange: { min: 75,   max: 150,  unit: 'mg'  }, rationale: 'Gastric-mucosa-specific zinc form (Japan PMDA-approved).' },
    ],
    dosageProfile: {
      intendedAudience: 'general',
      totalServingMassMg: { min: 3000, max: 25000 },
      unitsPerServingTypical: 2,
      deliveryForm: ['capsule', 'powder'],
    },
    citations: [
      { context: 'Multi-strain probiotic IBS / general gut', authority: 'Peer-reviewed', source: 'Ford 2018 (AJG IBS meta)' },
      { context: 'L-glutamine gut barrier', authority: 'Peer-reviewed', source: 'Kim 2017' },
      { context: 'DGL gastric', authority: 'Peer-reviewed', source: 'Madisch 2004' },
    ],
    lastReviewedDate: '2026-05-17',
  },

  // ─── SPECIALTY — niche or emerging ─────────────────────────

  {
    id: 'STACK.LONGEVITY',
    displayName: 'Longevity / NAD+',
    category: 'specialty',
    description: 'Emerging longevity / healthspan stack centered on NAD+ precursors (NMN or NR) + sirtuin activators (resveratrol) + methylation support (TMG buffers SAM depletion from NMN methyl-consumption) + senolytic adjuncts (fisetin, quercetin).',
    mustHave: [
      { ingredientName: 'NMN',                      typicalDoseRange: { min: 250,  max: 1000, unit: 'mg'  }, rationale: 'Nicotinamide Mononucleotide. NAD+ precursor. Regulatory status volatile (FDA position changed 2022; reverify quarterly).' },
      { ingredientName: 'Resveratrol',              typicalDoseRange: { min: 100,  max: 500,  unit: 'mg'  }, rationale: 'Trans-resveratrol; sirtuin activator. Bioavailability-enhanced forms preferred.' },
      { ingredientName: 'TMG',                      typicalDoseRange: { min: 500,  max: 2000, unit: 'mg'  }, rationale: 'Trimethylglycine. Methylation buffer; NMN consumes methyl groups.' },
    ],
    commonCompanion: [
      { ingredientName: 'Quercetin',                typicalDoseRange: { min: 250,  max: 1000, unit: 'mg'  }, rationale: 'Senolytic when pulsed with fisetin (D+Q protocol).' },
      { ingredientName: 'Fisetin',                  typicalDoseRange: { min: 100,  max: 500,  unit: 'mg'  }, rationale: 'Senolytic flavonoid (Mayo Clinic preclinical).' },
      { ingredientName: 'Spermidine',               typicalDoseRange: { min: 1,    max: 6,    unit: 'mg'  }, rationale: 'Autophagy inducer.' },
      { ingredientName: 'CoQ10 / Ubiquinol',        typicalDoseRange: { min: 100,  max: 300,  unit: 'mg'  }, rationale: 'Mitochondrial support; declines with age.' },
      { ingredientName: 'PQQ',                      typicalDoseRange: { min: 10,   max: 40,   unit: 'mg'  }, rationale: 'Mitochondrial biogenesis (BioPQQ).' },
    ],
    optional: [
      { ingredientName: 'Nicotinamide Riboside',    typicalDoseRange: { min: 250,  max: 600,  unit: 'mg'  }, rationale: 'Alternative NAD+ precursor; Niagen (ChromaDex). Regulatory status volatile.' },
      { ingredientName: 'Pterostilbene',            typicalDoseRange: { min: 50,   max: 250,  unit: 'mg'  }, rationale: 'Resveratrol analog; longer half-life.' },
      { ingredientName: 'Berberine',                typicalDoseRange: { min: 500,  max: 1500, unit: 'mg'  }, rationale: 'AMPK activation; metabolic longevity overlap.' },
    ],
    dosageProfile: {
      intendedAudience: 'senior',
      totalServingMassMg: { min: 1000, max: 6000 },
      unitsPerServingTypical: 2,
      deliveryForm: ['capsule', 'softgel'],
    },
    citations: [
      { context: 'NMN human safety/pharmacokinetics', authority: 'Peer-reviewed', source: 'Yoshino 2021; Pencina 2023' },
      { context: 'Fisetin senolytic', authority: 'Peer-reviewed', source: 'Yousefzadeh 2018 (Mayo Clinic)' },
      { context: 'NMN regulatory status (US)', authority: 'FDA', source: 'FDA position letter 2022 — exclusionary clause; PA verification required before commercial use' },
    ],
    lastReviewedDate: '2026-05-17',
    versionNotes: 'NMN regulatory status is volatile in US. Verify FDA position quarterly. Consider NR as primary alternative until status clarifies.',
  },

  {
    id: 'STACK.METABOLIC',
    displayName: 'Metabolic / Blood Sugar',
    category: 'targeted',
    description: 'Insulin sensitivity + glucose disposal stack. Berberine (AMPK activation, comparable to metformin in some trials), Chromium (insulin-receptor cofactor), Alpha-Lipoic Acid (antioxidant + glucose disposal), Cinnamon (insulin mimetic). Drug-interaction caution with hypoglycemic Rx.',
    mustHave: [
      { ingredientName: 'Berberine',                typicalDoseRange: { min: 500,  max: 1500, unit: 'mg'  }, rationale: 'AMPK activator. 500 mg × 2-3/day. CYP3A4 + P-gp interaction caution.' },
      { ingredientName: 'Chromium',                 typicalDoseRange: { min: 200,  max: 1000, unit: 'mcg' }, rationale: 'Picolinate or polynicotinate. Insulin sensitivity.' },
      { ingredientName: 'Alpha-Lipoic Acid',        typicalDoseRange: { min: 300,  max: 1200, unit: 'mg'  }, rationale: 'R-ALA preferred; diabetic neuropathy + glucose disposal.' },
      { ingredientName: 'Cinnamon',                 typicalDoseRange: { min: 1000, max: 6000, unit: 'mg'  }, rationale: 'Ceylon cinnamon preferred (no coumarin hepatotoxicity); Cassia caution.' },
    ],
    commonCompanion: [
      { ingredientName: 'Gymnema Sylvestre',        typicalDoseRange: { min: 200,  max: 800,  unit: 'mg'  }, rationale: 'Gymnemic acid; sweet-taste suppression + insulin support.' },
      { ingredientName: 'Bitter Melon',             typicalDoseRange: { min: 100,  max: 600,  unit: 'mg'  }, rationale: 'Charantin-standardized; insulin-mimetic.' },
      { ingredientName: 'Magnesium',                typicalDoseRange: { min: 300,  max: 500,  unit: 'mg'  }, rationale: 'Insulin sensitivity + deficiency in diabetes.' },
      { ingredientName: 'B-Complex',                typicalDoseRange: { min: 50,   max: 100,  unit: 'mg'  }, rationale: 'Glucose metabolism cofactors.' },
    ],
    optional: [
      { ingredientName: 'Banaba Leaf',              typicalDoseRange: { min: 32,   max: 64,   unit: 'mg'  }, rationale: 'Corosolic acid; glucose uptake.' },
      { ingredientName: 'Vanadyl Sulfate',          typicalDoseRange: { min: 7.5,  max: 50,   unit: 'mg'  }, rationale: 'Insulin-mimetic; caution at higher doses.' },
    ],
    dosageProfile: {
      intendedAudience: 'general',
      totalServingMassMg: { min: 1500, max: 8000 },
      unitsPerServingTypical: 3,
      deliveryForm: ['capsule', 'tablet'],
    },
    citations: [
      { context: 'Berberine glucose control vs metformin', authority: 'Peer-reviewed', source: 'Yin 2008 (Metabolism)' },
      { context: 'Chromium picolinate diabetes', authority: 'Peer-reviewed', source: 'Anderson 1997; meta-analyses' },
      { context: 'ALA diabetic neuropathy', authority: 'Peer-reviewed', source: 'Mijnhout 2012' },
    ],
    lastReviewedDate: '2026-05-17',
  },

  {
    id: 'STACK.LIVER_DETOX',
    displayName: 'Liver Support',
    category: 'targeted',
    description: 'Phase I + II detoxification support. NAC and Glutathione (master antioxidant + Phase II conjugation), Milk Thistle (silibinin hepatocyte protection), Choline (lipotropic; SAM cofactor).',
    mustHave: [
      { ingredientName: 'NAC',                      typicalDoseRange: { min: 600,  max: 1800, unit: 'mg'  }, rationale: 'Glutathione precursor; FDA history (regulatory status fluid).' },
      { ingredientName: 'Milk Thistle',             typicalDoseRange: { min: 200,  max: 800,  unit: 'mg'  }, rationale: '80% silymarin; Siliphos (silybin-phospholipid) for bioavailability.' },
      { ingredientName: 'Glutathione',              typicalDoseRange: { min: 250,  max: 1000, unit: 'mg'  }, rationale: 'Setria (Kyowa Hakko) liposomal preferred for absorption.' },
      { ingredientName: 'B-Complex',                typicalDoseRange: { min: 50,   max: 100,  unit: 'mg'  }, rationale: 'Methylation + energy metabolism cofactors.' },
    ],
    commonCompanion: [
      { ingredientName: 'Choline',                  typicalDoseRange: { min: 250,  max: 550,  unit: 'mg'  }, rationale: 'Lipotropic; prevents fatty liver. SAM cofactor.' },
      { ingredientName: 'Artichoke Extract',        typicalDoseRange: { min: 320,  max: 640,  unit: 'mg'  }, rationale: 'Cynarin standardized; bile flow.' },
      { ingredientName: 'Dandelion Root',           typicalDoseRange: { min: 250,  max: 500,  unit: 'mg'  }, rationale: 'Bile flow + diuretic.' },
      { ingredientName: 'Selenium',                 typicalDoseRange: { min: 100,  max: 200,  unit: 'mcg' }, rationale: 'Cofactor for glutathione peroxidase.' },
    ],
    optional: [
      { ingredientName: 'TMG',                      typicalDoseRange: { min: 500,  max: 2000, unit: 'mg'  }, rationale: 'Methylation buffer; lipotropic.' },
      { ingredientName: 'Vitamin E Tocotrienols',   typicalDoseRange: { min: 100,  max: 300,  unit: 'mg'  }, rationale: 'NAFLD support (delta-tocotrienol).' },
      { ingredientName: 'Phosphatidylcholine',      typicalDoseRange: { min: 600,  max: 1800, unit: 'mg'  }, rationale: 'Hepatocyte membrane support.' },
    ],
    dosageProfile: {
      intendedAudience: 'general',
      totalServingMassMg: { min: 1500, max: 6000 },
      unitsPerServingTypical: 3,
      deliveryForm: ['capsule', 'tablet'],
    },
    citations: [
      { context: 'NAC glutathione precursor', authority: 'Peer-reviewed', source: 'Atkuri 2007' },
      { context: 'Silymarin liver protection', authority: 'Peer-reviewed', source: 'Polyak 2013' },
    ],
    lastReviewedDate: '2026-05-17',
  },

  {
    id: 'STACK.STRESS_ADAPTOGEN',
    displayName: 'Stress / Adaptogen',
    category: 'targeted',
    description: 'HPA-axis modulation + cortisol regulation + perceived-stress reduction. Ashwagandha (KSM-66 or Sensoril clinical), Rhodiola (fatigue + acute stress), Phosphatidylserine (cortisol-lowering). NOT a sedative stack; targets stress resilience.',
    mustHave: [
      { ingredientName: 'Ashwagandha',              typicalDoseRange: { min: 300,  max: 600,  unit: 'mg'  }, rationale: 'KSM-66 (Ixoreal) 600 mg/day clinical for cortisol/stress. Sensoril (Natreon) 250 mg alternative.' },
      { ingredientName: 'Rhodiola Rosea',           typicalDoseRange: { min: 200,  max: 600,  unit: 'mg'  }, rationale: '3% rosavins / 1% salidroside. Anti-fatigue + acute cognitive performance under stress.' },
      { ingredientName: 'Phosphatidylserine',       typicalDoseRange: { min: 100,  max: 600,  unit: 'mg'  }, rationale: 'Cortisol-lowering at 600 mg; cognitive support at 100-300 mg.' },
    ],
    commonCompanion: [
      { ingredientName: 'L-Theanine',               typicalDoseRange: { min: 100,  max: 400,  unit: 'mg'  }, rationale: 'Alpha-wave / acute calming.' },
      { ingredientName: 'Magnesium',                typicalDoseRange: { min: 200,  max: 400,  unit: 'mg'  }, rationale: 'Stress depletes Mg; sleep + cortisol modulation.' },
      { ingredientName: 'B-Complex',                typicalDoseRange: { min: 50,   max: 100,  unit: 'mg'  }, rationale: 'Stress depletes B-vitamins.' },
      { ingredientName: 'Holy Basil',               typicalDoseRange: { min: 300,  max: 600,  unit: 'mg'  }, rationale: 'Tulsi. Adaptogen; cortisol modulation.' },
    ],
    optional: [
      { ingredientName: 'Eleuthero',                typicalDoseRange: { min: 300,  max: 1200, unit: 'mg'  }, rationale: 'Siberian ginseng; adaptogenic.' },
      { ingredientName: 'Schisandra',               typicalDoseRange: { min: 250,  max: 1000, unit: 'mg'  }, rationale: 'Lignans; adaptogenic + hepatoprotective.' },
      { ingredientName: 'Cordyceps',                typicalDoseRange: { min: 500,  max: 3000, unit: 'mg'  }, rationale: 'Adaptogenic mushroom; energy + adrenal support.' },
    ],
    dosageProfile: {
      intendedAudience: 'general',
      totalServingMassMg: { min: 800, max: 4000 },
      unitsPerServingTypical: 2,
      deliveryForm: ['capsule'],
    },
    citations: [
      { context: 'Ashwagandha KSM-66 cortisol/stress', authority: 'Peer-reviewed', source: 'Lopresti 2019; Chandrasekhar 2012' },
      { context: 'Rhodiola fatigue/stress', authority: 'Peer-reviewed', source: 'Olsson 2009; Edwards 2012' },
      { context: 'Phosphatidylserine cortisol', authority: 'Peer-reviewed', source: 'Hellhammer 2004' },
    ],
    lastReviewedDate: '2026-05-17',
  },

  {
    id: 'STACK.HEART_CV',
    displayName: 'Cardiovascular',
    category: 'targeted',
    description: 'Lipid + endothelial + blood-pressure stack. Omega-3 (TG-lowering at therapeutic doses), CoQ10 (statin-induced depletion replacement; mitochondrial), Magnesium (BP modulation), Vitamin K2 (vascular calcium routing — partners with D3).',
    mustHave: [
      { ingredientName: 'EPA/DHA',                  typicalDoseRange: { min: 1000, max: 4000, unit: 'mg'  }, rationale: 'TG-lowering at 2-4 g/day combined EPA+DHA. Re-esterified TG form preferred.' },
      { ingredientName: 'CoQ10 / Ubiquinol',        typicalDoseRange: { min: 100,  max: 300,  unit: 'mg'  }, rationale: 'Statin-induced depletion replacement. Ubiquinol > ubiquinone for 40+ adults.' },
      { ingredientName: 'Magnesium',                typicalDoseRange: { min: 300,  max: 500,  unit: 'mg'  }, rationale: 'BP modulation; deficiency widespread.' },
      { ingredientName: 'Vitamin K2 MK-7',          typicalDoseRange: { min: 90,   max: 180,  unit: 'mcg' }, rationale: 'Vascular calcium routing (away from arteries, toward bone). MK-7 longer half-life.' },
    ],
    commonCompanion: [
      { ingredientName: 'Garlic Extract',           typicalDoseRange: { min: 300,  max: 1200, unit: 'mg'  }, rationale: 'Aged garlic or allicin-standardized; BP-lowering.' },
      { ingredientName: 'Hawthorn',                 typicalDoseRange: { min: 250,  max: 1000, unit: 'mg'  }, rationale: 'Crataegus standardized; heart-function support.' },
      { ingredientName: 'L-Carnitine',              typicalDoseRange: { min: 500,  max: 2000, unit: 'mg'  }, rationale: 'Fatty-acid transport; cardiac muscle support.' },
      { ingredientName: 'Niacin (low-dose)',        typicalDoseRange: { min: 50,   max: 500,  unit: 'mg'  }, rationale: 'HDL-raising at 500 mg (with physician guidance); flush form.' },
    ],
    optional: [
      { ingredientName: 'Beet Root Powder',         typicalDoseRange: { min: 500,  max: 6000, unit: 'mg'  }, rationale: 'Nitrate-rich; BP-lowering + endurance.' },
      { ingredientName: 'Bergamot Extract',         typicalDoseRange: { min: 500,  max: 1500, unit: 'mg'  }, rationale: 'BPF-standardized; lipid-modulating.' },
      { ingredientName: 'Olive Leaf Extract',       typicalDoseRange: { min: 250,  max: 1000, unit: 'mg'  }, rationale: 'Oleuropein; BP-lowering.' },
    ],
    dosageProfile: {
      intendedAudience: 'general',
      totalServingMassMg: { min: 2000, max: 10000 },
      unitsPerServingTypical: 3,
      deliveryForm: ['capsule', 'softgel'],
    },
    citations: [
      { context: 'Omega-3 TG-lowering', authority: 'AHA', source: 'AHA Scientific Statement (Skulas-Ray 2019)' },
      { context: 'CoQ10 in statin myalgia', authority: 'Peer-reviewed', source: 'Banach 2015 meta-analysis' },
      { context: 'K2 MK-7 vascular calcification', authority: 'Peer-reviewed', source: 'Knapen 2015 (Rotterdam)' },
    ],
    lastReviewedDate: '2026-05-17',
  },

  {
    id: 'STACK.BONE',
    displayName: 'Bone Health',
    category: 'targeted',
    description: 'Bone mineral density support. The Ca / D3 / K2 / Mg quartet is foundational. Strontium and boron are adjuncts; collagen peptides support matrix proteins.',
    mustHave: [
      { ingredientName: 'Calcium',                  typicalDoseRange: { min: 500,  max: 1200, unit: 'mg'  }, rationale: 'Citrate or carbonate; split doses (≤ 500 mg per dose for absorption).' },
      { ingredientName: 'Vitamin D3',               typicalDoseRange: { min: 50,   max: 100,  unit: 'mcg' }, rationale: 'Calcium absorption; deficiency near-universal in US.' },
      { ingredientName: 'Vitamin K2 MK-7',          typicalDoseRange: { min: 90,   max: 360,  unit: 'mcg' }, rationale: 'Osteocalcin carboxylation; calcium directs to bone matrix not arteries.' },
      { ingredientName: 'Magnesium',                typicalDoseRange: { min: 300,  max: 500,  unit: 'mg'  }, rationale: 'Bone-matrix mineral; modulates parathyroid.' },
    ],
    commonCompanion: [
      { ingredientName: 'Boron',                    typicalDoseRange: { min: 3,    max: 10,   unit: 'mg'  }, rationale: 'Bone-density support; estrogen/Vit D modulation.' },
      { ingredientName: 'Strontium',                typicalDoseRange: { min: 340,  max: 680,  unit: 'mg'  }, rationale: 'Strontium citrate; bone-density support (controversial dosing).' },
      { ingredientName: 'Silica',                   typicalDoseRange: { min: 5,    max: 30,   unit: 'mg'  }, rationale: 'Collagen + bone matrix.' },
      { ingredientName: 'Collagen Peptides',        typicalDoseRange: { min: 5,    max: 15,   unit: 'g'   }, rationale: 'Type I/III; bone-matrix protein.' },
    ],
    optional: [
      { ingredientName: 'Vitamin C',                typicalDoseRange: { min: 200,  max: 1000, unit: 'mg'  }, rationale: 'Collagen synthesis cofactor.' },
      { ingredientName: 'Manganese',                typicalDoseRange: { min: 2,    max: 5,    unit: 'mg'  }, rationale: 'Bone-matrix cofactor.' },
      { ingredientName: 'Zinc',                     typicalDoseRange: { min: 11,   max: 25,   unit: 'mg'  }, rationale: 'Bone-formation cofactor.' },
    ],
    dosageProfile: {
      intendedAudience: 'senior',
      totalServingMassMg: { min: 1500, max: 8000 },
      unitsPerServingTypical: 3,
      deliveryForm: ['capsule', 'tablet'],
    },
    citations: [
      { context: 'Calcium + D3 BMD', authority: 'IOM', source: 'DRI 2011' },
      { context: 'K2 MK-7 bone', authority: 'Peer-reviewed', source: 'Knapen 2013 (postmenopausal)' },
    ],
    lastReviewedDate: '2026-05-17',
  },

  {
    id: 'STACK.SKIN_HAIR_NAILS',
    displayName: 'Beauty (Skin / Hair / Nails)',
    category: 'targeted',
    description: 'Connective-tissue + keratin synthesis stack. Biotin (claims-anchor despite weak evidence at typical dose), Collagen peptides (low-MW for absorption), Vitamin C (collagen synthesis cofactor), HA (skin hydration).',
    mustHave: [
      { ingredientName: 'Biotin',                   typicalDoseRange: { min: 30,   max: 5000, unit: 'mcg' }, rationale: 'DV 30 mcg; megadose 5000 mcg common but evidence weak in non-deficient. Lab-test interference warning required.' },
      { ingredientName: 'Collagen Peptides',        typicalDoseRange: { min: 5,    max: 15,   unit: 'g'   }, rationale: 'Type I/III bovine or marine. Skin elasticity at 8-12 weeks (Verisol, Peptan, etc.).' },
      { ingredientName: 'Vitamin C',                typicalDoseRange: { min: 75,   max: 500,  unit: 'mg'  }, rationale: 'Collagen synthesis cofactor.' },
      { ingredientName: 'Hyaluronic Acid',          typicalDoseRange: { min: 80,   max: 240,  unit: 'mg'  }, rationale: 'Low-MW for oral absorption; skin hydration.' },
    ],
    commonCompanion: [
      { ingredientName: 'Silica',                   typicalDoseRange: { min: 5,    max: 30,   unit: 'mg'  }, rationale: 'Bamboo or horsetail. Collagen + connective tissue.' },
      { ingredientName: 'Zinc',                     typicalDoseRange: { min: 8,    max: 25,   unit: 'mg'  }, rationale: 'Skin healing + acne support.' },
      { ingredientName: 'Vitamin E',                typicalDoseRange: { min: 15,   max: 100,  unit: 'mg'  }, rationale: 'Skin antioxidant.' },
      { ingredientName: 'Astaxanthin',              typicalDoseRange: { min: 4,    max: 12,   unit: 'mg'  }, rationale: 'Carotenoid antioxidant; UV-skin protection.' },
    ],
    optional: [
      { ingredientName: 'Bamboo Extract',           typicalDoseRange: { min: 200,  max: 600,  unit: 'mg'  }, rationale: 'High silica content.' },
      { ingredientName: 'Saw Palmetto',             typicalDoseRange: { min: 200,  max: 400,  unit: 'mg'  }, rationale: 'Hair-loss (5α-reductase inhibition).' },
      { ingredientName: 'Marine Collagen',          typicalDoseRange: { min: 5,    max: 15,   unit: 'g'   }, rationale: 'Type I; higher bioavailability than bovine.' },
    ],
    dosageProfile: {
      intendedAudience: 'general',
      totalServingMassMg: { min: 5000, max: 20000 },
      unitsPerServingTypical: 4,
      deliveryForm: ['capsule', 'tablet', 'gummy', 'powder'],
    },
    citations: [
      { context: 'Collagen peptides skin elasticity', authority: 'Peer-reviewed', source: 'Proksch 2014; Choi 2019 (meta-analysis)' },
      { context: 'Biotin lab-test interference', authority: 'FDA', source: 'FDA Safety Communication Nov 2017 + Update 2019' },
    ],
    lastReviewedDate: '2026-05-17',
  },

  {
    id: 'STACK.EYE_HEALTH',
    displayName: 'Eye / Vision',
    category: 'targeted',
    description: 'Macular degeneration + age-related vision support. Lutein + Zeaxanthin (AREDS2 evidence), Bilberry (anthocyanins), Astaxanthin (oxidative-stress protection), Vitamin A.',
    mustHave: [
      { ingredientName: 'Lutein',                   typicalDoseRange: { min: 6,    max: 20,   unit: 'mg'  }, rationale: 'AREDS2 10 mg dose. FloraGlo (Kemin) most-studied.' },
      { ingredientName: 'Zeaxanthin',               typicalDoseRange: { min: 1,    max: 4,    unit: 'mg'  }, rationale: 'AREDS2 2 mg dose. 5:1 lutein:zeaxanthin ratio.' },
      { ingredientName: 'Bilberry Extract',         typicalDoseRange: { min: 100,  max: 300,  unit: 'mg'  }, rationale: '25% anthocyanins; night vision + capillary support.' },
      { ingredientName: 'Vitamin A',                typicalDoseRange: { min: 700,  max: 900,  unit: 'mcg' }, rationale: 'Retina function. Beta-carotene preferred over retinyl (no UL risk).' },
    ],
    commonCompanion: [
      { ingredientName: 'Astaxanthin',              typicalDoseRange: { min: 4,    max: 12,   unit: 'mg'  }, rationale: 'Carotenoid antioxidant; crosses blood-retina barrier.' },
      { ingredientName: 'EPA/DHA',                  typicalDoseRange: { min: 1000, max: 2000, unit: 'mg'  }, rationale: 'DHA concentrated in retina.' },
      { ingredientName: 'Zinc',                     typicalDoseRange: { min: 25,   max: 80,   unit: 'mg'  }, rationale: 'AREDS2 25 mg or AREDS1 80 mg. UL 40 mg — discuss with formulator.' },
      { ingredientName: 'Vitamin C',                typicalDoseRange: { min: 200,  max: 500,  unit: 'mg'  }, rationale: 'AREDS2 500 mg.' },
      { ingredientName: 'Vitamin E',                typicalDoseRange: { min: 100,  max: 400,  unit: 'mg'  }, rationale: 'AREDS2 400 IU.' },
    ],
    optional: [
      { ingredientName: 'Saffron Extract',          typicalDoseRange: { min: 20,   max: 30,   unit: 'mg'  }, rationale: 'Crocin/crocetin; macular function.' },
      { ingredientName: 'Black Currant Extract',    typicalDoseRange: { min: 100,  max: 300,  unit: 'mg'  }, rationale: 'Anthocyanins; computer-eye strain.' },
    ],
    dosageProfile: {
      intendedAudience: 'senior',
      totalServingMassMg: { min: 1500, max: 5000 },
      unitsPerServingTypical: 2,
      deliveryForm: ['softgel', 'capsule'],
    },
    citations: [
      { context: 'AREDS2 formulation', authority: 'NIH NEI', source: 'AREDS2 Research Group 2013 (JAMA)' },
      { context: 'Astaxanthin retina', authority: 'Peer-reviewed', source: 'Piermarocchi 2012' },
    ],
    lastReviewedDate: '2026-05-17',
  },

  {
    id: 'STACK.MOOD',
    displayName: 'Mood Support',
    category: 'targeted',
    description: 'Mood-symptom support. 5-HTP (serotonin precursor; SSRI interaction caution), B-complex (methylation + neurotransmitter cofactors), Omega-3 (depression meta-analysis), St. John\'s Wort (mild-moderate depression; major drug-interaction risk).',
    mustHave: [
      { ingredientName: '5-HTP',                    typicalDoseRange: { min: 50,   max: 300,  unit: 'mg'  }, rationale: 'Serotonin precursor. SSRI / SNRI / MAOI interaction — serotonin syndrome risk.' },
      { ingredientName: 'B-Complex',                typicalDoseRange: { min: 50,   max: 100,  unit: 'mg'  }, rationale: 'Methylation + neurotransmitter cofactors.' },
      { ingredientName: 'Magnesium',                typicalDoseRange: { min: 200,  max: 400,  unit: 'mg'  }, rationale: 'GABA + NMDA modulation; mild antidepressant effect at 400 mg.' },
      { ingredientName: 'EPA/DHA',                  typicalDoseRange: { min: 1000, max: 2000, unit: 'mg'  }, rationale: 'EPA-dominant (≥ 60% EPA) for depression; meta-analysis Mocking 2016.' },
    ],
    commonCompanion: [
      { ingredientName: 'St. John\'s Wort',         typicalDoseRange: { min: 300,  max: 900,  unit: 'mg'  }, rationale: '0.3% hypericin / 3% hyperforin. CYP3A4 INDUCER — extensive drug interactions.' },
      { ingredientName: 'SAMe',                     typicalDoseRange: { min: 400,  max: 1600, unit: 'mg'  }, rationale: 'Methyl donor; antidepressant evidence.' },
      { ingredientName: 'L-Tyrosine',               typicalDoseRange: { min: 500,  max: 2000, unit: 'mg'  }, rationale: 'Dopamine/norepinephrine precursor.' },
      { ingredientName: 'Saffron Extract',          typicalDoseRange: { min: 28,   max: 30,   unit: 'mg'  }, rationale: '30 mg/day clinical for mild-moderate depression.' },
    ],
    optional: [
      { ingredientName: 'L-Theanine',               typicalDoseRange: { min: 100,  max: 400,  unit: 'mg'  }, rationale: 'Acute anxiety calming.' },
      { ingredientName: 'Ashwagandha',              typicalDoseRange: { min: 300,  max: 600,  unit: 'mg'  }, rationale: 'Stress / anxiety overlap with mood.' },
      { ingredientName: 'Methylfolate',             typicalDoseRange: { min: 400,  max: 1000, unit: 'mcg' }, rationale: 'Methylation support for depression (MTHFR variants).' },
    ],
    dosageProfile: {
      intendedAudience: 'general',
      totalServingMassMg: { min: 1500, max: 5000 },
      unitsPerServingTypical: 3,
      deliveryForm: ['capsule', 'tablet'],
    },
    citations: [
      { context: '5-HTP serotonin syndrome warning', authority: 'NIH ODS', source: 'NIH ODS 5-HTP factsheet' },
      { context: 'Omega-3 depression', authority: 'Peer-reviewed', source: 'Mocking 2016 (Translational Psychiatry meta-analysis)' },
      { context: 'St. John\'s Wort efficacy + interactions', authority: 'Cochrane', source: 'Linde 2008; FDA Safety Information' },
    ],
    lastReviewedDate: '2026-05-17',
    versionNotes: 'Stack carries serotonin-syndrome risk via 5-HTP + St. John\'s Wort combined with serotonergic Rx. Required label-warnings: SSRIs/SNRIs/MAOIs interaction + drug-interaction database check.',
  },
];

// ============================================================
// HELPERS
// ============================================================

/**
 * Find stacks where a given ingredient appears at any tier.
 * Used by recommendation engine to suggest stack-completion.
 */
export function findStacksContaining(ingredientName: string): Stack[] {
  const lower = ingredientName.toLowerCase();
  return SUPPLEMENT_STACKS.filter(stack => {
    const allMembers = [...stack.mustHave, ...stack.commonCompanion, ...stack.optional];
    return allMembers.some(m => m.ingredientName.toLowerCase() === lower
                              || lower.includes(m.ingredientName.toLowerCase())
                              || m.ingredientName.toLowerCase().includes(lower));
  });
}

/**
 * For a given formulation (list of ingredient names), find stacks where
 * ≥ thresholdPct of mustHave members are present. Returns each match with
 * coverage % + missing members.
 *
 * Default thresholdPct = 0.7 per rulebook §VII.35 (≥ 70% match triggers
 * stack-completion recommendation; below 30% suppress to avoid false positives).
 */
export function detectStacksFromFormulation(
  ingredientNames: string[],
  thresholdPct: number = 0.7
): Array<{ stack: Stack; coveragePct: number; missing: StackMember[] }> {
  const lowerNames = ingredientNames.map(n => n.toLowerCase());
  const matches: Array<{ stack: Stack; coveragePct: number; missing: StackMember[] }> = [];

  for (const stack of SUPPLEMENT_STACKS) {
    const present = stack.mustHave.filter(m =>
      lowerNames.some(n => n.includes(m.ingredientName.toLowerCase())
                        || m.ingredientName.toLowerCase().includes(n))
    );
    const missing = stack.mustHave.filter(m => !present.includes(m));
    const coveragePct = present.length / stack.mustHave.length;
    if (coveragePct >= thresholdPct) {
      matches.push({ stack, coveragePct, missing });
    }
  }

  return matches.sort((a, b) => b.coveragePct - a.coveragePct);
}
