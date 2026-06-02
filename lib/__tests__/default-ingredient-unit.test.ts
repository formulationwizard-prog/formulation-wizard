// ============================================================
// defaultIngredientUnit — launch-blocker #3 (unit dropdown)
// ------------------------------------------------------------
// Guards the per-ingredient default UNIT for the Build Base Sheet.
//
// Root-cause regression test for the "typed 100 meaning mg, got 100 g"
// 1000× error: Nutraceuticals must default each ingredient to milligrams
// even though grams is an ALLOWED supplement unit. The bug was that the
// workspace's stale-unit reconciliation only reset the unit when it was
// invalid for the mode — and 'g' is valid in supplements, so it never
// flipped to 'mg'. defaultIngredientUnit is the named, mode-aware default
// the transition guard now applies. See lib/modes.ts + app/workspace/page.tsx.
// ============================================================

import { describe, it, expect } from 'vitest';
import { defaultIngredientUnit, MODES, MODE_ORDER, type ModeId } from '../modes';

describe('defaultIngredientUnit', () => {
  it('supplements default to mg (actives are dosed in mg, not g)', () => {
    expect(defaultIngredientUnit('supplements')).toBe('mg');
  });

  it('the supplements default (mg) is a valid unit in the mode', () => {
    // A default that is not in the mode's allowed list would render a broken
    // dropdown selection — guard against that.
    expect(MODES.supplements.units).toContain('mg');
  });

  it("the trap condition still holds: 'g' IS a valid supplement unit", () => {
    // This is *why* the helper exists. Because grams is allowed, the
    // "is the current unit valid for this mode?" stale-check can never catch
    // a stuck 'g' default — only an explicit mode-aware default fixes it.
    expect(MODES.supplements.units).toContain('g');
  });

  it('food modes default to grams (their first allowed unit)', () => {
    expect(defaultIngredientUnit('fb')).toBe('g');
    expect(MODES.fb.units[0]).toBe('g');
  });

  it('every mode returns a unit that is actually allowed in that mode', () => {
    const allModes = Object.keys(MODES) as ModeId[];
    for (const mode of allModes) {
      expect(MODES[mode].units).toContain(defaultIngredientUnit(mode));
    }
  });

  it('every active (publicly switchable) mode has a sane ingredient default', () => {
    for (const mode of MODE_ORDER) {
      const unit = defaultIngredientUnit(mode);
      expect(typeof unit).toBe('string');
      expect(unit.length).toBeGreaterThan(0);
    }
  });
});
