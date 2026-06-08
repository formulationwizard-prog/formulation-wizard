// ============================================================
// HARNESS — UL / safety surface: % of UL AND the advisory TIER at threshold boundaries
// ------------------------------------------------------------
// docs/spec/world-class-build-spec-2026-06-07.md §5 — "coverage = the gate verdict,
// not just the value." A correct % of UL that doesn't trip the right advisory tier is
// still a harm-critical miss. Asserts BOTH per ul-table-verification-2026-06-08.md.
//
// tierFromPercent: ok <80% · caution 80–100% (or per-limit cautionPctOfUL) ·
//                  warning >100% · critical >150%.
// Map value is MG per serving (the checkSupplementSafety contract).
// ============================================================
import { describe, it, expect } from 'vitest';
import { checkSupplementSafety } from '../supplementSafetyLimits';
import type { Ingredient } from '../../types';

const ing = (name: string): Ingredient =>
  ({ name, qty: 0, unit: 'mg', foodData: { type: 'industrial', data: {} } } as unknown as Ingredient);

function finding(name: string, mgPerServing: number) {
  return checkSupplementSafety([ing(name)], new Map([[name, mgPerServing]]), 'general')
    .find(f => f.ingredientName === name)!;
}

describe('HARNESS · UL/safety surface — % of UL AND advisory tier at boundaries', () => {
  // ── Niacin UL 35 mg, no per-limit override ──────────────────────────────
  it('Niacin 17 mg → 49% UL → tier ok', () => {
    const f = finding('Niacin', 17);
    expect(f.percentOfUL!).toBeCloseTo(48.6, 0); // 17/35
    expect(f.tier).toBe('ok');
  });
  it('Niacin 28 mg → 80% UL → tier caution (lower boundary)', () => {
    const f = finding('Niacin', 28);
    expect(f.percentOfUL!).toBeCloseTo(80, 0);
    expect(f.tier).toBe('caution');
  });
  it('Niacin 35 mg → 100% UL → caution (≤100, NOT warning — boundary is >100)', () => {
    const f = finding('Niacin', 35);
    expect(f.percentOfUL!).toBeCloseTo(100, 0);
    expect(f.tier).toBe('caution');
  });
  it('Niacin 36 mg → >100% UL → tier warning', () => {
    expect(finding('Niacin', 36).tier).toBe('warning');
  });
  it('Niacin 53 mg → >150% UL → tier critical', () => {
    expect(finding('Niacin', 53).tier).toBe('critical');
  });

  // ── Vitamin B6 UL 100 mg, cautionPctOfUL 50 (neuropathy below statutory UL) ──
  it('B6 40 mg → 40% UL → ok (below the per-limit caution override)', () => {
    expect(finding('Vitamin B6', 40).tier).toBe('ok');
  });
  it('B6 50 mg → 50% UL → caution via cautionPctOfUL override (NOT the 80% rule)', () => {
    const f = finding('Vitamin B6', 50);
    expect(f.percentOfUL!).toBeCloseTo(50, 0);
    expect(f.tier).toBe('caution');
  });
  it('B6 120 mg → >100% UL → warning', () => {
    expect(finding('Vitamin B6', 120).tier).toBe('warning');
  });

  // ── two-derivation: hand-derived % == programmatic == code (Niacin @ 28 mg) ──
  it('TWO-DERIVATION: Niacin 28 mg → 80.0% (hand == programmatic == code)', () => {
    const hand = 80.0;
    const programmatic = (28 / 35) * 100;
    expect(programmatic).toBeCloseTo(hand, 1);
    expect(finding('Niacin', 28).percentOfUL!).toBeCloseTo(programmatic, 1);
  });
});
