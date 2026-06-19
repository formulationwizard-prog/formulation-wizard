// Catalog audit gate + artifact generator.
// - Imports the REAL catalog + provenance (no fragile text-parsing).
// - Asserts structural invariants + a severity RATCHET (counts may only
//   improve; a regression fails the build — this is the §I.6 "CI report
//   on every catalog PR" the Rulebook calls for).
// - On local runs, regenerates the §II.8 deliverable
//   docs/catalog/round-12-per-category-audit.md (+ a JSON snapshot).
//   Skipped under CI to keep the tree clean; the assertions are the gate.
import { describe, it, expect } from 'vitest';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { SUPPLEMENT_INGREDIENTS } from '../data/supplements';
import { PROVENANCE_BY_NAME } from '../data/supplementProvenance';
import { auditCatalog, renderAuditMarkdown } from '../catalogAudit';
import type { IndustrialIngredient } from '../../types';

const AUDIT_DATE = '2026-06-17';

// Severity ratchet — the audit may only get BETTER. Bumping a ceiling DOWN is
// the goal of the curation phase; a regression UP must fail CI. Re-baselined
// 2026-06-18: grade-claim precision split (§9a R1a) put S3 at 62, + 1 genuine
// §II.13 consistency finding (calcium pantothenate Tier-A 85000 vs Tier-B 90000,
// pure same-chemical pair) → S3 63. S1 hard-floored at 0 (carrier-loaded silent-
// zero is harm-critical). S4 (dup clusters + grade-claim recording-gaps) — not ratcheted.
const RATCHET = { S1: 0, S2: 4, S3: 63 };

describe('catalog audit (Phase 1 — coverage & conformance)', () => {
  const report = auditCatalog(SUPPLEMENT_INGREDIENTS, PROVENANCE_BY_NAME, AUDIT_DATE);

  it('audits a non-empty catalog and the matrix is internally consistent', () => {
    expect(report.totalEntries).toBeGreaterThan(0);
    const matrixTotal = report.categories.reduce((n, c) => n + c.entryCount, 0);
    expect(matrixTotal).toBe(report.totalEntries);
    const findingTotal =
      report.totalsBySeverity.S1 + report.totalsBySeverity.S2 +
      report.totalsBySeverity.S3 + report.totalsBySeverity.S4;
    expect(findingTotal).toBe(report.findings.length);
  });

  it('does not regress past the severity ratchet (counts may only improve)', () => {
    expect(report.totalsBySeverity.S1).toBeLessThanOrEqual(RATCHET.S1);
    expect(report.totalsBySeverity.S2).toBeLessThanOrEqual(RATCHET.S2);
    expect(report.totalsBySeverity.S3).toBeLessThanOrEqual(RATCHET.S3);
  });

  it('regenerates the audit artifact (local only)', () => {
    if (process.env.CI) return; // assertions above are the CI gate; don't dirty the tree
    const dir = join(process.cwd(), 'docs', 'catalog');
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'round-12-per-category-audit.md'), renderAuditMarkdown(report), 'utf8');
    writeFileSync(
      join(dir, `catalog-audit-${AUDIT_DATE}.json`),
      JSON.stringify(report, null, 2),
      'utf8',
    );
    expect(true).toBe(true);
  });
});

const mkIng = (over: Partial<IndustrialIngredient>): IndustrialIngredient => ({
  name: '', category: 'Vitamins', suppliers: [], subIngredients: [], allergens: [],
  costPerKg: 0, nutrition: {}, notes: '', ...over,
});

// Proves the §II.8a synonym-collision check actually fires in every mode — so
// the "0 collisions" result on the real catalog is a trustworthy clean signal,
// not a silently-broken check (recursive-honesty: don't trust a 0 on faith).
describe('synonym-collision check (§II.8a)', () => {
  const synFindings = (ings: IndustrialIngredient[]) =>
    auditCatalog(ings, {}, '2026-06-18').findings.filter((f) => f.dimension === 'synonym-collision');

  it('cross-entry collision with DIFFERING allergens → S1 (harm-critical)', () => {
    const f = synFindings([
      mkIng({ name: 'A (Soy)', allergens: ['Soybeans'], synonyms: ['shared name'] }),
      mkIng({ name: 'B (Sunflower)', allergens: [], synonyms: ['Shared Name'] }),
    ]);
    expect(f).toHaveLength(1);
    expect(f[0].severity).toBe('S1');
  });

  it('cross-entry collision with SAME allergens → S2', () => {
    const f = synFindings([
      mkIng({ name: 'A', synonyms: ['shared'] }),
      mkIng({ name: 'B', synonyms: ['shared'] }),
    ]);
    expect(f).toHaveLength(1);
    expect(f[0].severity).toBe('S2');
  });

  it('intra-entry duplicate synonym (case variant) → S3', () => {
    const f = synFindings([mkIng({ name: 'A', synonyms: ['folate', 'Folate'] })]);
    expect(f).toHaveLength(1);
    expect(f[0].severity).toBe('S3');
  });

  it('normalization reuse: "Vitamin B9" vs "vitamin-b9" collide (dash→space)', () => {
    const f = synFindings([
      mkIng({ name: 'A', synonyms: ['Vitamin B9'] }),
      mkIng({ name: 'B', synonyms: ['vitamin-b9'] }),
    ]);
    expect(f).toHaveLength(1);
  });

  it('unique synonyms → no collision finding', () => {
    const f = synFindings([
      mkIng({ name: 'A', synonyms: ['alpha'] }),
      mkIng({ name: 'B', synonyms: ['beta'] }),
    ]);
    expect(f).toHaveLength(0);
  });
});

describe('§II.13 same-compound consistency check', () => {
  const consFindings = (ings: IndustrialIngredient[]) =>
    auditCatalog(ings, {}, '2026-06-18').findings.filter((f) => f.dimension === 'consistency');

  it('flags two PURE same-chemical entries with conflicting nutrition → S3 (the real pantothenate bug)', () => {
    const f = consFindings([
      mkIng({ name: 'X (Tier-A)', subIngredients: ['Calcium Pantothenate'], nutrition: { calcium: 85000 } }),
      mkIng({ name: 'X (Tier-B)', subIngredients: ['Calcium Pantothenate'], nutrition: { calcium: 90000 } }),
    ]);
    expect(f).toHaveLength(1);
    expect(f[0].severity).toBe('S3');
  });

  it('does NOT flag a multi-component complex sharing a first sub-ingredient (CCM false-positive guard)', () => {
    const f = consFindings([
      mkIng({ name: 'Calcium Citrate', subIngredients: ['Calcium Citrate'], nutrition: { calcium: 210000 } }),
      mkIng({ name: 'Calcium Citrate Malate', subIngredients: ['Calcium Citrate', 'Calcium Malate'], nutrition: { calcium: 240000 } }),
    ]);
    expect(f).toHaveLength(0);
  });

  it('does NOT flag the same chemical with matching nutrition', () => {
    const f = consFindings([
      mkIng({ name: 'Y (A)', subIngredients: ['Calcium Citrate'], nutrition: { calcium: 210000 } }),
      mkIng({ name: 'Y (B)', subIngredients: ['Calcium Citrate'], nutrition: { calcium: 210000 } }),
    ]);
    expect(f).toHaveLength(0);
  });
});
