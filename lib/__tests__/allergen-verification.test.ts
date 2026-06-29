// Allergen verification status — the provenance-aware honesty layer (feeds the
// workspace chrome annotation + FVR flag; NEVER the byte-faithful "Contains:"
// statement). Locks the two doctrines: never drop a warning (status only,
// no declaration mutation) + never assert free without COA (isCoaVerifiedAllergens).
import { describe, it, expect } from 'vitest';
import {
  classifyAllergenProvenance,
  resolveAllergenVerification,
  isCoaVerifiedAllergens,
} from '../allergenVerification';
import { PROVENANCE_BY_NAME } from '../data/supplementProvenance';
import type { Provenance } from '../../types';

describe('classifyAllergenProvenance — all branches (dependency-injected)', () => {
  it('no provenance entry → no-provenance (uncovered; inline is the fallback)', () => {
    expect(classifyAllergenProvenance(undefined)).toEqual({ status: 'no-provenance' });
  });

  it("kind 'unknown' → unverified, carries the reason (catalog default pending COA)", () => {
    const r = classifyAllergenProvenance({ kind: 'unknown', reason: 'pending supplier spec / COA' });
    expect(r).toEqual({ status: 'unverified', reason: 'pending supplier spec / COA' });
  });

  it("kind 'unknown' with no reason → unverified with a default reason (never empty)", () => {
    const r = classifyAllergenProvenance({ kind: 'unknown' });
    expect(r.status).toBe('unverified');
    if (r.status === 'unverified') expect(r.reason.length).toBeGreaterThan(0);
  });

  it("kind 'coa' → verified, kind preserved (the gold standard)", () => {
    const coa: Provenance = { kind: 'coa', vendor: 'Acme', lotNumber: 'L123', capturedAt: '2026-07-01' };
    expect(classifyAllergenProvenance(coa)).toEqual({ status: 'verified', kind: 'coa', source: coa });
  });

  it("kind 'supplier-spec' → verified-with-source (verified, but NOT coa-grade)", () => {
    const spec = { kind: 'supplier-spec', vendor: 'Acme', capturedAt: '2026-07-01' } as Provenance;
    const r = classifyAllergenProvenance(spec);
    expect(r.status).toBe('verified');
    if (r.status === 'verified') expect(r.kind).toBe('supplier-spec');
  });
});

describe('resolveAllergenVerification — against the real provenance map', () => {
  it('a covered top-100 entry (currently all kind unknown) → unverified', () => {
    const r = resolveAllergenVerification('Vitamin C (Ascorbic Acid USP, Fine)');
    expect(r.status).toBe('unverified');
  });

  it('an unknown/uncovered name → no-provenance (inline fallback, honestly flagged)', () => {
    expect(resolveAllergenVerification('Totally Not A Catalog Entry 12345').status).toBe('no-provenance');
  });
});

describe('isCoaVerifiedAllergens — gates the affirmative free-of claim', () => {
  it('a real (kind unknown) entry is NOT coa-verified → free-of claim unreachable for it', () => {
    expect(isCoaVerifiedAllergens('Vitamin C (Ascorbic Acid USP, Fine)')).toBe(false);
  });

  it('an uncovered name is NOT coa-verified (absence of data is never free-of)', () => {
    expect(isCoaVerifiedAllergens('Totally Not A Catalog Entry 12345')).toBe(false);
  });

  it('DOCTRINE: the affirmative free-of claim is earned by COA — a kind-coa entry is the only path', () => {
    // Logic lock (data-independent): only kind 'coa' gates the claim. When the flywheel turns
    // (a COA lands), that entry becomes coa-verified; until then the claim stays unreachable.
    const sampleName = Object.keys(PROVENANCE_BY_NAME)[0];
    const prov = PROVENANCE_BY_NAME[sampleName]?.['allergens'];
    expect(isCoaVerifiedAllergens(sampleName)).toBe(prov?.kind === 'coa');
  });
});
