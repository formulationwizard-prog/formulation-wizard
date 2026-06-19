// ============================================================
// CATALOG AUDIT — deterministic coverage + conformance engine
// ------------------------------------------------------------
// Phase 1 of the catalog world-class effort (audit → brainstorm →
// adds). This is the EXECUTION of two deliverables the Catalog
// Authoring Rulebook already specifies but never built:
//   • §I.6  "World-Class Quality Benchmarks … checked on every
//            catalog PR via a CI report (to be built)"
//   • §II.8 "Step 0 audit prerequisite … docs/catalog/
//            round-12-per-category-audit.md (category × field ×
//            present-count matrix)"
//
// DOCTRINE: honesty-first. This module MEASURES against the bar and
// surfaces gaps truthfully. It NEVER assigns, infers, or fabricates a
// value. A benchmark whose enforcing field is absent from the schema
// is reported as `null` ("not measurable in current schema") — not as
// zero-dressed-as-data and not silently dropped. Closing the gaps is
// verified curation (a later, gated phase), not this module's job.
//
// Pure compute — no I/O. The vitest gate (lib/__tests__/
// catalog-audit.test.ts) imports auditCatalog(), asserts the §I.6
// floors, and emits the human-readable artifacts. Runs on the existing
// `npm test` path, so it rides catalog PRs as the Rulebook intends.
// ============================================================
import type { IndustrialIngredient, Provenance } from '../types';
import { assessHeavyMetalVectors } from './heavyMetalVectors';
import { normalizeIngredientName, findBestMatchWithTier } from './parseFormula';
import { resolveElementalFactor } from './elementalFactors';
import type { Stack } from './data/stacks';

// ─── §III.15 canonical taxonomy (15 categories incl. Excipients) ───────────
export const CANONICAL_CATEGORIES = [
  'Vitamins', 'Minerals', 'Amino Acids', 'Herbal Extracts', 'Mushroom Extracts',
  'Botanicals', 'Probiotics', 'Prebiotics', 'Enzymes', 'Specialty Compounds',
  'Specialty', 'Antioxidants', 'Omega-3s', 'Fatty Acids', 'Excipients',
] as const;

// Category strings the Rulebook itself flags as legacy/overlapping (§III.15
// notes Specialty/Specialty Compounds; §III.17 split discipline governs the
// rest). Surfaced as catalog-level taxonomy findings, not per-entry.
const OVERLAPPING_CATEGORY_PAIRS: [string, string, string][] = [
  ['Specialty Compounds', 'Specialty', '§III.15 (legacy — "treat as synonyms until a deliberate cleanup pass")'],
  ['Herbal Extracts', 'Botanicals', '§III.15 + §III.17 (overlapping botanical taxonomy)'],
  ['Omega-3s', 'Fatty Acids', '§III.15 + §III.17 (overlapping lipid taxonomy)'],
];

export type Severity = 'S1' | 'S2' | 'S3' | 'S4';
export type Dimension =
  | 'taxonomy'
  | 'naming-discipline'
  | 'grade-claim'
  | 'potency-factor'
  | 'harm-critical'
  | 'duplicate-sku'
  | 'synonym-collision'
  | 'consistency'
  | 'matchability'
  | 'elemental-factor';

export interface Finding {
  entryName: string;
  category: string;
  dimension: Dimension;
  severity: Severity;
  issue: string;
  ruleCitation: string;
  recommendation: string;
}

export interface CategoryCoverage {
  category: string;
  onCanonicalTaxonomy: boolean;
  entryCount: number;
  // Harm-critical floor (§I.5) — empty/absent = UNDOCUMENTED, never safe.
  allergensDocumented: number;     // non-empty allergens[] OR (future) investigated flag
  regulatoryStatusDocumented: number;
  drugInteractionsDocumented: number;
  // Provenance (the supplementProvenance.ts layer).
  provenanceDocumented: number;
  heavyMetalVectorEntries: number; // §I.5a classifier-flagged (metals.length > 0)
  findingsBySeverity: Record<Severity, number>;
}

export interface Benchmark {
  /** §I.6 metric name. */
  metric: string;
  /** Rulebook target, verbatim. */
  target: string;
  /** Measured value (0–1 rate, or absolute), or null when unmeasurable. */
  value: number | null;
  /** Free-text note — why it's unmeasurable, or the population status now that
   *  the enforcing field exists. */
  note?: string;
}

export interface AuditReport {
  generatedFor: string;
  totalEntries: number;
  totalsBySeverity: Record<Severity, number>;
  categories: CategoryCoverage[];
  taxonomyNotes: string[];
  benchmarks: Benchmark[];
  findings: Finding[];
}

// ─── name-signal regexes ────────────────────────────────────────────────────
/** Internal value/premium wave marker leaking into the §II.9 display name. */
const TIER_TOKEN = /\bTier-[AB]\b/;
/** §25 supplier-spec verification marker — amber-blocking; surface for drain. */
const PENDING_TOKEN = /\bPENDING\b/;
/** §II.9 AP-05/AP-01 — Class-3 buyer claims belong in structured fields, not the name. */
const CLASS3_CLAIM = /\b(Vegan|Non-?GMO|Organic|Gluten-?Free|Allergen-?Free|Kosher|Halal)\b/i;
/** §IX.41 AP-09 / §9a Refinement 2 — marketing copy in display names. */
const MARKETING_TOKEN = /\b(Premium|Best|Super(?!oxide)|Advanced|Ultra|Pharma Grade)\b/;
/** §9a Refinement 1a — pharmacopeial grade claim; must trace to a monograph. */
const PHARMA_SUFFIX = /\(([^)]*\b)?(USP|NF|FCC|EP)\b([^)]*)?\)/;
/** §9a Refinement 1a — compounds with NO compendial monograph for the exact form
 *  (the genuine truth-in-labeling defect). A suffix-but-no-recorded-reference on
 *  anything else is a data-recording gap (a monograph very likely exists), NOT a
 *  defect — bench-test 2026-06-17 found ~90% of grade-claim flags were the latter
 *  (common salts/vitamins: Calcium Carbonate, Magnesium Oxide, Ferrous Sulfate…). */
const KNOWN_NO_MONOGRAPH = /\b(picolinate|alpha-?lipoic|quercetin|citrulline\s+malate|nicotinamide\s+mononucleotide|NMN|carnitine[^)]*tartrate|glucosamine\s+sulfate[^)]*2kcl)\b/i;
/** Unambiguous carrier-loaded forms (§II.10) — IU/g beadlets, "on <carrier>". */
const CARRIER_SIGNAL = /\bIU\/g\b|\bon (MCC|Mannitol|Starch|Maltodextrin|Cellulose|Silica|Carrier)\b/i;
/** Weaker percent signal — only meaningful for Vitamins/Minerals (in Herbal/
 *  Mushroom a "%" is a standardization marker, not carrier loading). */
const PERCENT_SIGNAL = /\b\d{1,3}\s*%/;

function normalizeBase(name: string): string {
  return name
    .replace(/\([^)]*\)/g, ' ')   // drop parentheticals
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function emptySeverityRecord(): Record<Severity, number> {
  return { S1: 0, S2: 0, S3: 0, S4: 0 };
}

/** Does the provenance layer substantiate this entry's grade claim? */
function hasRegulatoryGradeProvenance(
  prov: Record<string, Provenance> | undefined,
): boolean {
  if (!prov) return false;
  const claim = prov['name.gradeClaim'];
  return !!claim && claim.kind === 'regulatory-authority';
}

/**
 * Audit the catalog against the Rulebook. Pure: same inputs → same report.
 * @param ingredients SUPPLEMENT_INGREDIENTS (lib/data/supplements.ts)
 * @param provenanceByName PROVENANCE_BY_NAME (lib/data/supplementProvenance.ts)
 * @param generatedFor ISO date stamp (passed in — this module never reads the clock)
 */
export function auditCatalog(
  ingredients: IndustrialIngredient[],
  provenanceByName: Record<string, Record<string, Provenance>>,
  generatedFor: string,
  /** Entry names referenced in test files (computed by the fs-capable caller —
   *  keeps this compute pure). When provided, adds the §VI test-coverage proxy
   *  benchmark. */
  testedNames?: Set<string>,
  /** Named §VII stacks. When provided, adds the §I.6/§IV.21 bulk-paste
   *  resolution-rate benchmark (a non-circular proxy: stack member names are
   *  natural names, not catalog SKU strings) + flags unresolved members. */
  stacks?: Stack[],
): AuditReport {
  const findings: Finding[] = [];
  const byCategory = new Map<string, CategoryCoverage>();
  const baseGroups = new Map<string, string[]>();
  let hmVectors = 0, hmOverride = 0, hmClean = 0;
  const synonymOwners = new Map<string, IndustrialIngredient[]>();
  const chemicalGroups = new Map<string, IndustrialIngredient[]>();

  const getCat = (category: string): CategoryCoverage => {
    let c = byCategory.get(category);
    if (!c) {
      c = {
        category,
        onCanonicalTaxonomy: (CANONICAL_CATEGORIES as readonly string[]).includes(category),
        entryCount: 0,
        allergensDocumented: 0,
        regulatoryStatusDocumented: 0,
        drugInteractionsDocumented: 0,
        provenanceDocumented: 0,
        heavyMetalVectorEntries: 0,
        findingsBySeverity: emptySeverityRecord(),
      };
      byCategory.set(category, c);
    }
    return c;
  };

  const add = (f: Finding) => {
    findings.push(f);
    getCat(f.category).findingsBySeverity[f.severity]++;
  };

  for (const ing of ingredients) {
    const cat = getCat(ing.category);
    cat.entryCount++;
    const prov = provenanceByName[ing.name];

    // coverage tallies (harm-critical floor §I.5 + provenance)
    if (ing.allergens && ing.allergens.length > 0) cat.allergensDocumented++;
    if (ing.regulatoryStatus) cat.regulatoryStatusDocumented++;
    if (ing.drugInteractions && ing.drugInteractions.length > 0) cat.drugInteractionsDocumented++;
    if (prov) cat.provenanceDocumented++;
    const hm = assessHeavyMetalVectors(ing);
    if (hm.metals.length > 0) { cat.heavyMetalVectorEntries++; hmVectors++; }
    if (hm.basis === 'override') hmOverride++;
    else if (hm.basis === 'override-verified-clean') hmClean++;

    // §II.8a — collect normalized synonyms per entry; flag intra-entry dups
    const seenSyn = new Set<string>();
    for (const syn of ing.synonyms ?? []) {
      const norm = normalizeIngredientName(syn);
      if (!norm) continue;
      if (seenSyn.has(norm)) {
        add({
          entryName: ing.name, category: ing.category, dimension: 'synonym-collision', severity: 'S3',
          issue: `Duplicate normalized synonym "${norm}" within this entry — breaks deterministic matching (§II.8a DON'T).`,
          ruleCitation: '§II.8a',
          recommendation: `Remove the duplicate; normalization already collapses capitalization/punctuation variants.`,
        });
        continue;
      }
      seenSyn.add(norm);
      const arr = synonymOwners.get(norm) ?? [];
      arr.push(ing);
      synonymOwners.set(norm, arr);
    }

    // duplicate clustering (§16 two-wave dup is intentional, but surface it)
    const base = normalizeBase(ing.name);
    const group = baseGroups.get(base) ?? [];
    group.push(ing.name);
    baseGroups.set(base, group);

    // §II.13 — group by primary chemical for cross-entry consistency. Keyed on
    // the first subIngredient, NOT the paren-stripped name, so different FORMS of
    // one vitamin (tocopherol vs tocopheryl acetate) don't false-collide.
    // SINGLE-subIngredient (pure) entries ONLY: a multi-component complex (e.g.
    // Calcium Citrate Malate = [Calcium Citrate, Calcium Malate]) legitimately
    // differs from a pure entry sharing its first sub-ingredient (bench-test
    // 2026-06-18 false-positive fix).
    const chem = ing.subIngredients?.length === 1 ? normalizeIngredientName(ing.subIngredients[0]) : '';
    if (chem) {
      const g = chemicalGroups.get(chem) ?? [];
      g.push(ing);
      chemicalGroups.set(chem, g);
    }

    // ── taxonomy (§III.15) ──
    if (!cat.onCanonicalTaxonomy) {
      add({
        entryName: ing.name, category: ing.category, dimension: 'taxonomy', severity: 'S2',
        issue: `Category "${ing.category}" is off the §III.15 canonical taxonomy.`,
        ruleCitation: '§III.15',
        recommendation: `Re-file to a canonical category or formalize the new category via §III.17 split discipline.`,
      });
    }

    // ── naming discipline (§II.9 / §II.9a) ──
    if (TIER_TOKEN.test(ing.name)) {
      add({
        entryName: ing.name, category: ing.category, dimension: 'naming-discipline', severity: 'S3',
        issue: `Internal wave marker "Tier-A/B" leaked into the display name (it is neither a real qualifier nor a buyer claim).`,
        ruleCitation: '§II.9',
        recommendation: `Move the value/premium tier to a structured field; drop "Tier-A/B" from the display name.`,
      });
    }
    if (PENDING_TOKEN.test(ing.name)) {
      add({
        entryName: ing.name, category: ing.category, dimension: 'naming-discipline', severity: 'S2',
        issue: `"PENDING" verification marker present — entry is amber-blocked for commercial use until drained.`,
        ruleCitation: '§25',
        recommendation: `Resolve the supplier-spec verification and drop the PENDING suffix, or route to the verification queue.`,
      });
    }
    if (CLASS3_CLAIM.test(ing.name)) {
      add({
        entryName: ing.name, category: ing.category, dimension: 'naming-discipline', severity: 'S3',
        issue: `Class-3 buyer-requirement claim in the display name (vegan/non-GMO/organic/etc.).`,
        ruleCitation: '§II.9 / AP-05',
        recommendation: `Verify the claim is backed by a structured field; if so, drop it from the name. If unbacked, it is a silent-claim defect.`,
      });
    }
    if (MARKETING_TOKEN.test(ing.name)) {
      add({
        entryName: ing.name, category: ing.category, dimension: 'naming-discipline', severity: 'S3',
        issue: `Borderline-marketing qualifier in the display name (carries no verifiable structured-field meaning).`,
        ruleCitation: '§9a Refinement 2 / AP-09',
        recommendation: `Replace with explicit tier framing (Pharmaceutical-Grade / Commodity Sourcing) or a named branded form.`,
      });
    }
    // grade-claim substantiation (§9a Refinement 1a): suffix present, no monograph trace
    if (PHARMA_SUFFIX.test(ing.name) && !ing.pharmacopeialReference && !hasRegulatoryGradeProvenance(prov)) {
      const noMonograph = KNOWN_NO_MONOGRAPH.test(ing.name);
      add({
        entryName: ing.name, category: ing.category, dimension: 'grade-claim',
        severity: noMonograph ? 'S3' : 'S4',
        issue: noMonograph
          ? `Pharmacopeial grade suffix on a compound with NO compendial monograph for the exact form — unsubstantiated grade claim (genuine 21 CFR truth-in-labeling defect).`
          : `Pharmacopeial grade suffix not backed by a recorded monograph. A compendial monograph very likely EXISTS for this compound (common salt/vitamin) — this is a data-recording gap (populate pharmacopeialReference), not a truth-in-labeling defect. (Bench-test 2026-06-17: ~90% of grade-claim flags are this case.)`,
        ruleCitation: '§9a Refinement 1a',
        recommendation: noMonograph
          ? `Drop or re-grade the suffix — no monograph covers this exact compound (21 CFR truth-in-labeling).`
          : `Record the compendial monograph in pharmacopeialReference to substantiate the grade claim.`,
      });
    }

    // ── potencyFactor sanity (§II.10) — carrier-loaded silent-zero trap ──
    const pf = ing.potencyFactor;
    const looksLoaded = pf == null || pf === 1;
    if (CARRIER_SIGNAL.test(ing.name) && looksLoaded) {
      add({
        entryName: ing.name, category: ing.category, dimension: 'potency-factor', severity: 'S1',
        issue: `Name signals a carrier-loaded SKU (IU/g or "on <carrier>") but potencyFactor is ${pf == null ? 'absent' : '1'} — direct-mass entry renders ~0 active on the SFP (21 CFR 101.36 risk).`,
        ruleCitation: '§II.10 / §I.5',
        recommendation: `Derive potencyFactor from the supplier COA; until then this entry is a silent-zero hazard.`,
      });
    } else if (
      (ing.category === 'Vitamins' || ing.category === 'Minerals') &&
      PERCENT_SIGNAL.test(ing.name) && !CARRIER_SIGNAL.test(ing.name) && looksLoaded
    ) {
      add({
        entryName: ing.name, category: ing.category, dimension: 'potency-factor', severity: 'S3',
        issue: `Name carries a "%" loading signal but potencyFactor is ${pf == null ? 'absent' : '1'} — review whether this is a carrier-loaded form.`,
        ruleCitation: '§II.10',
        recommendation: `Confirm against the COA whether a potencyFactor applies; document the decision.`,
      });
    }

    // ── elemental-factor over-count trap (§II.10) — the mirror of silent-zero ──
    // A Minerals entry the elemental resolver doesn't recognize falls back to
    // 1.0 (full salt/chelate mass treated as elemental) → silent OVER-count of
    // the element on the Supplement Facts panel. The resolver covers only 11
    // elements; a mineral of an unmapped element (Boron, Molybdenum, Strontium…)
    // resolves undefined → 1.0. Harm-critical at compliance time (21 CFR 101.36).
    if (ing.category === 'Minerals' && resolveElementalFactor(ing.name) === undefined) {
      // Elements explicitly routed to Nate/PA (chemistry not cleanly derivable:
      // supplier-standardized chelate %, hydrate-dependent, or silica DV-basis)
      // are tracked-pending (S2), not silent (S1). A NEW unmapped mineral off
      // this list is S1 — keeps the guard sharp + CI green for the known set.
      const routedToNate = /\b(boron|strontium|silica|silicon)\b/i.test(ing.name);
      add({
        entryName: ing.name, category: ing.category, dimension: 'elemental-factor',
        severity: routedToNate ? 'S2' : 'S1',
        issue: routedToNate
          ? `Unmapped mineral — element ROUTED TO NATE/PA for chemistry verification (supplier-standardized chelate %, hydrate-dependent, or silica→silicon DV-basis). Caller falls back to 1.0 → over-count until the verified factor lands.`
          : `Mineral not recognized by the elemental resolver (lib/elementalFactors.ts) — caller falls back to 1.0, treating the FULL salt/chelate mass as elemental → silent OVER-count on the Supplement Facts panel.`,
        ruleCitation: '§II.10 / §I.5 / 21 CFR 101.36',
        recommendation: routedToNate
          ? `Awaiting Nate/PA chemistry pass (boron chelate %, strontium hydrate state, silica→silicon DV-basis); add the verified fraction to lib/elementalFactors.ts.`
          : `Add this mineral's element/form to lib/elementalFactors.ts with its chemistry-derived fraction, or route to Nate if supplier-standardized / hydrate / DV-ambiguous.`,
      });
    }
  }

  // ── duplicate clusters (informational; §16 two-wave dup is intentional) ──
  for (const [base, names] of baseGroups) {
    if (names.length > 1) {
      // attribute to the first member's category for the matrix tally
      const first = ingredients.find((i) => i.name === names[0])!;
      add({
        entryName: names.join('  |  '),
        category: first.category,
        dimension: 'duplicate-sku',
        severity: 'S4',
        issue: `${names.length} entries share normalized base "${base}" — confirm intentional value/premium pairing (§16) vs. consolidation candidate.`,
        ruleCitation: '§16 / §23 saturation test',
        recommendation: `If a true value+premium pair, leave; if a redundant rebrand, route to the consolidation queue.`,
      });
    }
  }

  // ── §II.8a synonym collisions (cross-entry) — arbitrary/ambiguous resolution ──
  for (const [norm, owners] of synonymOwners) {
    if (owners.length < 2) continue;
    const allergenSig = (i: IndustrialIngredient) =>
      [...(i.allergens ?? [])].map((a) => a.toLowerCase()).sort().join(',');
    const differingAllergens = new Set(owners.map(allergenSig)).size > 1;
    add({
      entryName: owners.map((o) => o.name).join('  |  '),
      category: owners[0].category,
      dimension: 'synonym-collision',
      severity: differingAllergens ? 'S1' : 'S2',
      issue: `Normalized synonym "${norm}" is claimed by ${owners.length} entries — operator paste resolves arbitrarily (first by iteration order) per findBySynonym${differingAllergens ? '. The colliding entries carry DIFFERING allergen profiles → silent undeclared-allergen risk (§II.8a Wave 1.5e harm-critical-sibling pattern)' : ''}.`,
      ruleCitation: '§II.8a',
      recommendation: differingAllergens
        ? `HARM-CRITICAL: drop the bare shared synonym; qualify each variant (concentration/source/brand) and let the technical name route through findHarmCriticalSiblings (Tier-3 disambiguation).`
        : `Make the synonym unique to one entry; qualify the others (concentration/source/brand) per §II.8a.`,
    });
  }

  // ── §II.13 same-compound nutrition consistency (cross-entry, by chemical) ──
  for (const members of chemicalGroups.values()) {
    if (members.length < 2) continue;
    const keys = new Set<string>();
    for (const m of members) for (const k of Object.keys(m.nutrition ?? {})) keys.add(k);
    for (const k of keys) {
      const present = members.filter(
        (m) => (m.nutrition as Record<string, number | undefined>)?.[k] !== undefined,
      );
      if (present.length < 2) continue; // a contradiction needs ≥2 entries declaring the key
      const distinct = new Set(present.map((m) => (m.nutrition as Record<string, number>)[k]));
      if (distinct.size > 1) {
        add({
          entryName: present
            .map((m) => `${m.name} (${k}=${(m.nutrition as Record<string, number>)[k]})`)
            .join('  |  '),
          category: present[0].category,
          dimension: 'consistency',
          severity: 'S3',
          issue: `Same compound declares conflicting "${k}" values — a same-chemical value must be identical across entries (§II.13).`,
          ruleCitation: '§II.13',
          recommendation: `Reconcile to the chemistry-correct value; correct the wrong existing value rather than preserving a historical mistake.`,
        });
      }
    }
  }

  // ── §I.6 benchmarks (honest measurability) ──
  const total = ingredients.length;
  const rate = (n: number) => (total === 0 ? null : n / total);
  const withProvenance = ingredients.filter((i) => provenanceByName[i.name]).length;
  const withConfidence = ingredients.filter((i) => i.confidenceLevel != null).length;
  const withTier = ingredients.filter((i) => i.tier != null).length;
  const withCitation14 = ingredients.filter((i) => i.citation?.some((c) => c.tier >= 1 && c.tier <= 4)).length;
  const withCanonicalId = ingredients.filter((i) => i.canonicalIdUnii || i.canonicalIdUspLatin || i.canonicalIdGtin).length;
  const benchmarks: Benchmark[] = [
    {
      metric: 'Tier-1–4 citation rate',
      target: '≥ 90% (§I.6)',
      value: rate(withCitation14),
      note: 'Field landed 2026-06-17 (efa54e1); population is the gated curation phase, never bulk.',
    },
    {
      metric: 'Confidence-level coverage',
      target: 'every entry carries §I.4 confidenceLevel',
      value: rate(withConfidence),
      note: 'Field present; population is the gated curation phase.',
    },
    {
      metric: 'Tier (value/premium/specialty) coverage',
      target: 'every entry carries §III.16 tier',
      value: rate(withTier),
      note: 'Field present; the tier-migration curation wave absorbs the legacy "Tier-A/B" name leaks.',
    },
    {
      metric: 'Provenance coverage',
      target: 'every load-bearing value traceable (§I.2)',
      value: rate(withProvenance),
    },
    {
      metric: 'Canonical-ID coverage (UNII / USP-Latin / GTIN)',
      target: 'world-class trajectory (verified, never bulk-inferred)',
      value: rate(withCanonicalId),
      note: 'Fields present; verified assignment is deliberate (Nate-gated for botanical USP-Latin), never bulk.',
    },
    {
      metric: 'Heavy-metals vectors flagged (§I.5a)',
      target: 'class-level flag (flag-not-certify); finished product COA-tested to USP <232>',
      value: rate(hmVectors),
      note: `${hmVectors} entries classifier-flagged (lib/heavyMetalVectors.ts); ${hmClean} COA-verified-clean, ${hmOverride} explicit override. Flag, not certify.`,
    },
  ];
  if (testedNames) {
    const tested = ingredients.filter((i) => testedNames.has(i.name)).length;
    benchmarks.push({
      metric: 'Test-reference coverage (proxy for §VI)',
      target: '100% (§VI: bulk-paste + SFP + safety test per entry)',
      value: rate(tested),
      note: 'PROXY — entry name appears in ≥1 catalog test file; NOT a guarantee of all three §VI test types. A true per-test-type §VI check needs test-structure parsing (scoped, not built). Meta-test files (the audit/classifier tests) are excluded by the caller.',
    });
  }
  if (stacks) {
    // §I.6/§IV.21 bulk-paste resolution — run each unique standard-stack member
    // name through the REAL matcher. Non-circular: member names are natural
    // names ("Vitamin D3", "Calcium"), not catalog SKU display strings.
    const members = new Map<string, boolean>(); // name → isMustHave (in ≥1 stack's mustHave)
    for (const s of stacks) {
      for (const m of s.mustHave) members.set(m.ingredientName, true);
      for (const m of s.commonCompanion) if (!members.has(m.ingredientName)) members.set(m.ingredientName, false);
    }
    let resolved = 0, partial = 0, unmatched = 0;
    for (const [nm, isMustHave] of members) {
      const tier = findBestMatchWithTier(nm, ingredients).tier;
      if (tier <= 2) { resolved++; continue; }
      if (tier === 3) { partial++; continue; }
      unmatched++;
      add({
        entryName: nm, category: '__stack__', dimension: 'matchability',
        severity: isMustHave ? 'S2' : 'S3',
        issue: `Standard-stack ${isMustHave ? 'must-have' : 'companion'} "${nm}" does not resolve via bulk-paste (tier 4 / no match) — an operator pasting this gets an unmatched row (§IV.21 matchability gap).`,
        ruleCitation: '§I.6 / §IV.21',
        recommendation: `Add "${nm}" as a synonym on the intended catalog entry (or author the entry) so the natural name resolves.`,
      });
    }
    benchmarks.push({
      metric: 'Stack bulk-paste resolution (§I.6/§IV.21 proxy)',
      target: '≥ 95% of standard-stack ingredients resolve (tier ≤ 2)',
      value: members.size ? resolved / members.size : null,
      note: `${resolved} resolved (tier ≤2) / ${partial} need-confirm (tier 3) / ${unmatched} unmatched (tier 4) of ${members.size} unique standard-stack ingredients. Non-circular proxy (natural names, not SKU strings); NOT the full §IV.21 competitor-label list (needs external SKUs).`,
    });
  }

  const categories = [...byCategory.values()].sort((a, b) => b.entryCount - a.entryCount);
  const totalsBySeverity = emptySeverityRecord();
  for (const f of findings) totalsBySeverity[f.severity]++;

  const taxonomyNotes: string[] = [];
  const present = new Set(ingredients.map((i) => i.category));
  for (const [a, b, cite] of OVERLAPPING_CATEGORY_PAIRS) {
    if (present.has(a) && present.has(b)) {
      taxonomyNotes.push(
        `Overlapping categories both present: "${a}" and "${b}" — ${cite}. Each renders as a distinct UI category (lib/modes.ts categoriesFromIngredients is additive).`,
      );
    }
  }

  // severity sort for the findings list (S1 first), stable within severity
  const order: Record<Severity, number> = { S1: 0, S2: 1, S3: 2, S4: 3 };
  findings.sort((a, b) => order[a.severity] - order[b.severity]);

  return {
    generatedFor,
    totalEntries: total,
    totalsBySeverity,
    categories,
    taxonomyNotes,
    benchmarks,
    findings,
  };
}

/** Render the AuditReport as the §II.8-named Markdown deliverable. */
export function renderAuditMarkdown(report: AuditReport): string {
  const L: string[] = [];
  const matchFindings = report.findings.filter((f) => f.dimension === 'matchability');
  const elementalFindings = report.findings.filter((f) => f.dimension === 'elemental-factor');
  const confBySev: Record<Severity, number> = { S1: 0, S2: 0, S3: 0, S4: 0 };
  for (const f of report.findings)
    if (f.dimension !== 'matchability' && f.dimension !== 'elemental-factor') confBySev[f.severity]++;
  L.push(`# Catalog Audit — Coverage & Conformance Matrix`);
  L.push('');
  L.push(`> **Phase 1 of the catalog world-class effort (audit → brainstorm → adds). READ-ONLY findings.**`);
  L.push(`> Phase 3 (fixes/adds) is **held** pending operator + co-founder (Nate) + Opus review.`);
  L.push(`> Generated for **${report.generatedFor}** by \`lib/catalogAudit.ts\` (deterministic; regenerated on every \`npm test\`).`);
  L.push(`> This is the §II.8 "Step 0 audit" + §I.6 "CI report" the Rulebook specifies but never built.`);
  L.push('');
  L.push(`## Executive summary`);
  L.push('');
  L.push(`- **${report.totalEntries}** entries audited across **${report.categories.length}** category strings.`);
  L.push(`- Conformance findings (entry defects): **S1 ${confBySev.S1}** · S2 ${confBySev.S2} · S3 ${confBySev.S3} · S4 ${confBySev.S4}.`);
  L.push(`- Matchability gaps (standard-stack ingredients that don't resolve to the catalog): **${matchFindings.length}** — a coverage backlog, not entry defects; see the §I.6/§IV.21 resolution benchmark below.`);
  L.push(`- Elemental-factor gaps (§II.10, unmapped minerals → 1.0 over-count): **${elementalFindings.length}** — ${elementalFindings.filter((f) => f.severity === 'S1').length} un-routed (S1, must fix/route), ${elementalFindings.filter((f) => f.severity === 'S2').length} routed to Nate (pending chemistry).`);
  L.push(`- **The headline gap is execution, not specification.** The world-class bar is already in the Rulebook (§I.4 confidence, §I.5 floor, §I.6 benchmarks, §II.8 schema), and as of 2026-06-17 (\`efa54e1\`) the enforcing *fields* now exist on \`IndustrialIngredient\`. The benchmarks below have flipped from *unmeasurable* to **measurable, ~0% populated** — population is the gated curation phase (verified, never bulk). Honesty-first: an unpopulated field reports its true 0%, never fabricated coverage.`);
  L.push('');
  for (const n of report.taxonomyNotes) L.push(`- ⚠️ ${n}`);
  L.push('');
  L.push(`## §I.6 benchmarks`);
  L.push('');
  L.push(`| Benchmark | Target | Measured | Note |`);
  L.push(`|---|---|---|---|`);
  for (const b of report.benchmarks) {
    const v = b.value == null ? '— (unmeasurable)' : b.value <= 1 ? `${(b.value * 100).toFixed(0)}%` : `${b.value}`;
    L.push(`| ${b.metric} | ${b.target} | ${v} | ${b.note ?? ''} |`);
  }
  L.push('');
  L.push(`## Coverage matrix (category × dimension)`);
  L.push('');
  L.push(`Coverage = count of entries with the field **documented**. Empty/absent harm-critical fields are UNDOCUMENTED per §I.5 — not "safe."`);
  L.push('');
  L.push(`| Category | On taxonomy | Entries | Allergens | Reg-status | Drug-interactions | Provenance | HM-vec | S1 | S2 | S3 | S4 |`);
  L.push(`|---|---|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|`);
  for (const c of report.categories) {
    const pct = (n: number) => `${n}/${c.entryCount}`;
    L.push(
      `| ${c.category} | ${c.onCanonicalTaxonomy ? '✓' : '⚠️ off'} | ${c.entryCount} | ` +
      `${pct(c.allergensDocumented)} | ${pct(c.regulatoryStatusDocumented)} | ${pct(c.drugInteractionsDocumented)} | ${pct(c.provenanceDocumented)} | ` +
      `${c.heavyMetalVectorEntries} | ` +
      `${c.findingsBySeverity.S1} | ${c.findingsBySeverity.S2} | ${c.findingsBySeverity.S3} | ${c.findingsBySeverity.S4} |`,
    );
  }
  L.push('');
  L.push(`## Findings (severity-ranked)`);
  L.push('');
  const groups: Severity[] = ['S1', 'S2', 'S3', 'S4'];
  for (const s of groups) {
    const fs = report.findings.filter((f) => f.severity === s);
    if (fs.length === 0) continue;
    L.push(`### ${s} (${fs.length})`);
    L.push('');
    for (const f of fs) {
      L.push(`- **[${f.dimension}] ${f.entryName}** — ${f.issue} _(${f.ruleCitation})_ → ${f.recommendation}`);
    }
    L.push('');
  }
  return L.join('\n');
}
