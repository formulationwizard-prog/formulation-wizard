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
  | 'duplicate-sku';

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
  findingsBySeverity: Record<Severity, number>;
}

export interface Benchmark {
  /** §I.6 metric name. */
  metric: string;
  /** Rulebook target, verbatim. */
  target: string;
  /** Measured value (0–1 rate, or absolute), or null when unmeasurable. */
  value: number | null;
  /** When null, why it can't be measured against the current schema. */
  unmeasurableReason?: string;
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
): AuditReport {
  const findings: Finding[] = [];
  const byCategory = new Map<string, CategoryCoverage>();
  const baseGroups = new Map<string, string[]>();

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

    // duplicate clustering (§16 two-wave dup is intentional, but surface it)
    const base = normalizeBase(ing.name);
    const group = baseGroups.get(base) ?? [];
    group.push(ing.name);
    baseGroups.set(base, group);

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
      add({
        entryName: ing.name, category: ing.category, dimension: 'grade-claim', severity: 'S3',
        issue: `Pharmacopeial grade suffix (USP/NF/FCC/EP) with no pharmacopeialReference and no regulatory-authority provenance — unsubstantiated grade claim.`,
        ruleCitation: '§9a Refinement 1a',
        recommendation: `Cite a real monograph for the exact compound, or drop/re-grade the suffix (21 CFR truth-in-labeling).`,
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

  // ── §I.6 benchmarks (honest measurability) ──
  const total = ingredients.length;
  const withProvenance = ingredients.filter((i) => provenanceByName[i.name]).length;
  const benchmarks: Benchmark[] = [
    {
      metric: 'Tier-1–4 citation rate',
      target: '≥ 90% (§I.6)',
      value: null,
      unmeasurableReason: 'No structured `citation: { authority, source, tier }` field on IndustrialIngredient (§II.8 Gap #1). Cannot be measured until the field lands + is populated.',
    },
    {
      metric: 'Confidence-level coverage',
      target: 'every entry carries §I.4 confidenceLevel',
      value: 0,
      unmeasurableReason: 'No `confidenceLevel` field on IndustrialIngredient (§II.8 Gap #2). Structurally 0%.',
    },
    {
      metric: 'Tier (value/premium/specialty) coverage',
      target: 'every entry carries §III.16 tier',
      value: 0,
      unmeasurableReason: 'No `tier` field on IndustrialIngredient (§II.8). Wave markers currently leak into display names instead.',
    },
    {
      metric: 'Provenance coverage',
      target: 'every load-bearing value traceable (§I.2)',
      value: total === 0 ? null : withProvenance / total,
    },
    {
      metric: 'Canonical-ID coverage (UNII / USP-Latin / GTIN)',
      target: 'world-class trajectory (verified, never bulk-inferred)',
      value: 0,
      unmeasurableReason: 'No canonical-ID fields on IndustrialIngredient. This is the one genuine ADDITION beyond the Rulebook (trajectory layer); 0% by design until verified assignment begins.',
    },
  ];

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
  const sev = report.totalsBySeverity;
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
  L.push(`- Findings by severity: **S1 ${sev.S1}** · S2 ${sev.S2} · S3 ${sev.S3} · S4 ${sev.S4}.`);
  L.push(`- **The headline gap is execution, not specification.** The world-class bar is already written into the Rulebook (§I.4 confidence, §I.5 harm-critical floor, §I.6 benchmarks, §II.8 schema). The enforcing *fields* are absent from \`types/index.ts\`, so several benchmarks are **not yet measurable** — see below. Honesty-first: a missing field reports as \`null\` / structurally-0, never as fabricated coverage.`);
  L.push('');
  for (const n of report.taxonomyNotes) L.push(`- ⚠️ ${n}`);
  L.push('');
  L.push(`## §I.6 benchmarks`);
  L.push('');
  L.push(`| Benchmark | Target | Measured | Note |`);
  L.push(`|---|---|---|---|`);
  for (const b of report.benchmarks) {
    const v = b.value == null ? '— (unmeasurable)' : b.value <= 1 ? `${(b.value * 100).toFixed(0)}%` : `${b.value}`;
    L.push(`| ${b.metric} | ${b.target} | ${v} | ${b.unmeasurableReason ?? ''} |`);
  }
  L.push('');
  L.push(`## Coverage matrix (category × dimension)`);
  L.push('');
  L.push(`Coverage = count of entries with the field **documented**. Empty/absent harm-critical fields are UNDOCUMENTED per §I.5 — not "safe."`);
  L.push('');
  L.push(`| Category | On taxonomy | Entries | Allergens | Reg-status | Drug-interactions | Provenance | S1 | S2 | S3 | S4 |`);
  L.push(`|---|---|--:|--:|--:|--:|--:|--:|--:|--:|--:|`);
  for (const c of report.categories) {
    const pct = (n: number) => `${n}/${c.entryCount}`;
    L.push(
      `| ${c.category} | ${c.onCanonicalTaxonomy ? '✓' : '⚠️ off'} | ${c.entryCount} | ` +
      `${pct(c.allergensDocumented)} | ${pct(c.regulatoryStatusDocumented)} | ${pct(c.drugInteractionsDocumented)} | ${pct(c.provenanceDocumented)} | ` +
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
