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

const AUDIT_DATE = '2026-06-17';

// Severity ratchet — the audit may only get BETTER. Bumping a ceiling DOWN is
// the goal of the curation phase; a regression UP must fail CI. Re-baselined
// 2026-06-17 after the grade-claim precision split (§9a R1a: monograph-exists-
// but-not-recorded → S4, genuine no-monograph → S3): 367 entries, S1 0 · S2 4 ·
// S3 62 · S4 107. S1 hard-floored at 0 (carrier-loaded silent-zero is harm-
// critical). S4 (dup clusters + grade-claim recording-gaps) is informational —
// not ratcheted.
const RATCHET = { S1: 0, S2: 4, S3: 62 };

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
