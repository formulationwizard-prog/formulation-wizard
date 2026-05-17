// ============================================================
// §B1 — ALLERGEN SPECIES-NAMING + CONTAINS GENERATOR
// ------------------------------------------------------------
// Round 11 Phase 2 Step 4 (2026-05-17). Pre-flight verification suite
// for lib/supplementAllergen.ts. Tests:
//
//   • detectAllergensDetailed — species-aware detection with
//     AllergenMatch structured output (category + species +
//     requiresSpeciesNaming flag)
//   • generateContainsStatement — FDA-format Contains: line per
//     21 CFR 101.36(b)(1)(i)(B) / FALCPA
//   • evaluateAllergenGate — refuses export when species-required
//     category (Tree Nuts, Fish, Shellfish) is detected without
//     species naming
//
// Boundary discipline mirrors §B2: detector returns structured
// flags; gate composes pre-computed flags into HardStop | cleared.
// ============================================================

import { describe, it, expect } from 'vitest';
import {
  detectAllergensDetailed,
  generateContainsStatement,
  evaluateAllergenGate,
  B1_ALLERGEN_ITEM_ID,
  type AllergenMatch,
} from '../supplementAllergen';
import { isHardStop } from '../hardStop';

// ─── Test fixtures ──────────────────────────────────────────────

function makeMatch(overrides: Partial<AllergenMatch> = {}): AllergenMatch {
  return {
    category: 'Milk',
    matchedKeyword: 'milk',
    requiresSpeciesNaming: false,
    ...overrides,
  };
}

// ============================================================
// Section A — detectAllergensDetailed
// ============================================================
describe('detectAllergensDetailed — species-aware detection', () => {
  it('empty text → no matches', () => {
    expect(detectAllergensDetailed('')).toEqual([]);
  });

  it('whitespace-only text → no matches', () => {
    expect(detectAllergensDetailed('   ')).toEqual([]);
  });

  it('non-allergen text → no matches', () => {
    expect(detectAllergensDetailed('Vitamin C 500 mg')).toEqual([]);
  });

  it('"almond meal" → Tree Nuts with species Almonds', () => {
    const matches = detectAllergensDetailed('Almond meal');
    expect(matches).toHaveLength(1);
    expect(matches[0].category).toBe('Tree Nuts');
    expect(matches[0].species).toBe('Almonds');
    expect(matches[0].requiresSpeciesNaming).toBe(true);
  });

  it('"cashew butter" → Tree Nuts with species Cashews', () => {
    const matches = detectAllergensDetailed('Cashew butter');
    expect(matches[0].category).toBe('Tree Nuts');
    expect(matches[0].species).toBe('Cashews');
  });

  it('"salmon oil" → Fish with species Salmon', () => {
    const matches = detectAllergensDetailed('Salmon oil');
    expect(matches[0].category).toBe('Fish');
    expect(matches[0].species).toBe('Salmon');
    expect(matches[0].requiresSpeciesNaming).toBe(true);
  });

  it('"anchovy paste" → Fish with species Anchovies', () => {
    const matches = detectAllergensDetailed('Anchovy paste');
    expect(matches[0].category).toBe('Fish');
    expect(matches[0].species).toBe('Anchovies');
  });

  it('"shrimp powder" → Shellfish with species Shrimp', () => {
    const matches = detectAllergensDetailed('Shrimp powder');
    expect(matches[0].category).toBe('Shellfish');
    expect(matches[0].species).toBe('Shrimp');
    expect(matches[0].requiresSpeciesNaming).toBe(true);
  });

  it('"whey protein concentrate" → Milk without species (Milk does not require species)', () => {
    const matches = detectAllergensDetailed('Whey protein concentrate');
    expect(matches[0].category).toBe('Milk');
    expect(matches[0].species).toBeUndefined();
    expect(matches[0].requiresSpeciesNaming).toBe(false);
  });

  it('"wheat flour" → Wheat without species (Wheat does not require species)', () => {
    const matches = detectAllergensDetailed('Wheat flour');
    expect(matches[0].category).toBe('Wheat');
    expect(matches[0].requiresSpeciesNaming).toBe(false);
  });

  it('"soy lecithin" → Soybeans without species', () => {
    const matches = detectAllergensDetailed('Soy lecithin');
    expect(matches[0].category).toBe('Soybeans');
    expect(matches[0].requiresSpeciesNaming).toBe(false);
  });

  it('"sesame seeds" → Sesame without species', () => {
    const matches = detectAllergensDetailed('Sesame seeds');
    expect(matches[0].category).toBe('Sesame');
  });

  it('"peanut butter" → Peanuts without false-positive Milk match (butter dropped from Milk keywords)', () => {
    const matches = detectAllergensDetailed('Peanut butter');
    const categories = matches.map(m => m.category);
    expect(categories).toContain('Peanuts');
    expect(categories).not.toContain('Milk');
  });

  it('"almond butter" → Tree Nuts (Almonds) only, no false-positive Milk', () => {
    const matches = detectAllergensDetailed('Almond butter');
    const categories = matches.map(m => m.category);
    expect(categories).toContain('Tree Nuts');
    expect(categories).not.toContain('Milk');
    const treeNutMatch = matches.find(m => m.category === 'Tree Nuts');
    expect(treeNutMatch?.species).toBe('Almonds');
  });

  it('"almonds and walnuts" → two Tree Nuts species matches', () => {
    const matches = detectAllergensDetailed('Almonds and walnuts');
    const treeNutMatches = matches.filter(m => m.category === 'Tree Nuts');
    expect(treeNutMatches).toHaveLength(2);
    const speciesSet = new Set(treeNutMatches.map(m => m.species));
    expect(speciesSet.has('Almonds')).toBe(true);
    expect(speciesSet.has('Walnuts')).toBe(true);
  });

  it('"almond, whey, wheat" → three category matches with proper species handling', () => {
    const matches = detectAllergensDetailed('Almond, whey, wheat');
    const categories = matches.map(m => m.category);
    expect(categories).toContain('Tree Nuts');
    expect(categories).toContain('Milk');
    expect(categories).toContain('Wheat');
  });

  it('"tree nut blend" → Tree Nuts generic term, species undefined (species-naming violation)', () => {
    const matches = detectAllergensDetailed('Tree nut blend');
    const treeNutMatches = matches.filter(m => m.category === 'Tree Nuts');
    expect(treeNutMatches).toHaveLength(1);
    expect(treeNutMatches[0].species).toBeUndefined();
    expect(treeNutMatches[0].requiresSpeciesNaming).toBe(true);
  });

  it('"mixed nuts" → Tree Nuts generic term, species undefined', () => {
    const matches = detectAllergensDetailed('Mixed nuts');
    const treeNutMatches = matches.filter(m => m.category === 'Tree Nuts');
    expect(treeNutMatches).toHaveLength(1);
    expect(treeNutMatches[0].species).toBeUndefined();
  });

  it('"fish oil" → Fish generic term, species undefined (species-naming violation)', () => {
    const matches = detectAllergensDetailed('Fish oil');
    const fishMatches = matches.filter(m => m.category === 'Fish');
    expect(fishMatches).toHaveLength(1);
    expect(fishMatches[0].species).toBeUndefined();
    expect(fishMatches[0].requiresSpeciesNaming).toBe(true);
  });

  it('"crustacean shellfish" → Shellfish generic term, species undefined', () => {
    const matches = detectAllergensDetailed('Crustacean shellfish');
    const shellfishMatches = matches.filter(m => m.category === 'Shellfish');
    expect(shellfishMatches).toHaveLength(1);
    expect(shellfishMatches[0].species).toBeUndefined();
  });

  it('species match suppresses the generic-term match for the same category', () => {
    // "Almonds and tree nuts" — species 'almonds' present; generic 'tree nuts'
    // also present. The species match satisfies the naming requirement; the
    // generic-term match should NOT also fire.
    const matches = detectAllergensDetailed('Almonds and tree nuts');
    const treeNutMatches = matches.filter(m => m.category === 'Tree Nuts');
    expect(treeNutMatches.every(m => m.species !== undefined)).toBe(true);
  });
});

// ============================================================
// Section B — generateContainsStatement
// ============================================================
describe('generateContainsStatement — FDA-format Contains: line', () => {
  it('empty matches → empty string (no statement needed)', () => {
    expect(generateContainsStatement([])).toBe('');
  });

  it('single Milk match → "Contains: Milk."', () => {
    const out = generateContainsStatement([makeMatch({ category: 'Milk' })]);
    expect(out).toBe('Contains: Milk.');
  });

  it('single Tree Nut species → "Contains: Almonds."', () => {
    const out = generateContainsStatement([
      makeMatch({ category: 'Tree Nuts', species: 'Almonds', requiresSpeciesNaming: true }),
    ]);
    expect(out).toBe('Contains: Almonds.');
  });

  it('two matches → "Contains: X and Y." (no Oxford comma for two)', () => {
    const out = generateContainsStatement([
      makeMatch({ category: 'Milk' }),
      makeMatch({ category: 'Wheat', matchedKeyword: 'wheat' }),
    ]);
    expect(out).toBe('Contains: Milk and Wheat.');
  });

  it('three matches → "Contains: X, Y, and Z." (Oxford comma)', () => {
    const out = generateContainsStatement([
      makeMatch({ category: 'Tree Nuts', species: 'Almonds', requiresSpeciesNaming: true }),
      makeMatch({ category: 'Milk' }),
      makeMatch({ category: 'Wheat', matchedKeyword: 'wheat' }),
    ]);
    expect(out).toBe('Contains: Almonds, Milk, and Wheat.');
  });

  it('four matches → "Contains: A, B, C, and D."', () => {
    const out = generateContainsStatement([
      makeMatch({ category: 'Tree Nuts', species: 'Almonds', requiresSpeciesNaming: true }),
      makeMatch({ category: 'Milk' }),
      makeMatch({ category: 'Wheat', matchedKeyword: 'wheat' }),
      makeMatch({ category: 'Soybeans', matchedKeyword: 'soy' }),
    ]);
    expect(out).toBe('Contains: Almonds, Milk, Wheat, and Soybeans.');
  });

  it('multiple tree nut species → each species listed separately', () => {
    const out = generateContainsStatement([
      makeMatch({ category: 'Tree Nuts', species: 'Almonds', requiresSpeciesNaming: true }),
      makeMatch({ category: 'Tree Nuts', species: 'Walnuts', requiresSpeciesNaming: true }),
    ]);
    expect(out).toBe('Contains: Almonds and Walnuts.');
  });

  it('Tree Nuts with species undefined → falls back to category name (gate catches the violation separately)', () => {
    const out = generateContainsStatement([
      makeMatch({ category: 'Tree Nuts', species: undefined, requiresSpeciesNaming: true }),
    ]);
    expect(out).toBe('Contains: Tree Nuts.');
  });

  it('dedupes identical entries (same category + species)', () => {
    const out = generateContainsStatement([
      makeMatch({ category: 'Tree Nuts', species: 'Almonds', requiresSpeciesNaming: true }),
      makeMatch({ category: 'Tree Nuts', species: 'Almonds', requiresSpeciesNaming: true }),
    ]);
    expect(out).toBe('Contains: Almonds.');
  });

  it('dedupes by category for non-species-required allergens', () => {
    const out = generateContainsStatement([
      makeMatch({ category: 'Milk', matchedKeyword: 'milk' }),
      makeMatch({ category: 'Milk', matchedKeyword: 'whey' }),
      makeMatch({ category: 'Milk', matchedKeyword: 'casein' }),
    ]);
    expect(out).toBe('Contains: Milk.');
  });
});

// ============================================================
// Section C — evaluateAllergenGate (cleared cases)
// ============================================================
describe('evaluateAllergenGate — cleared cases', () => {
  it('empty matches → cleared', () => {
    const result = evaluateAllergenGate({ allergenMatches: [] });
    expect(result.hardStop).toBe(false);
    expect(result.source).toBe('supplement-allergen');
  });

  it('Tree Nut with species named → cleared', () => {
    const result = evaluateAllergenGate({
      allergenMatches: [
        makeMatch({ category: 'Tree Nuts', species: 'Almonds', requiresSpeciesNaming: true }),
      ],
    });
    expect(result.hardStop).toBe(false);
  });

  it('Milk without species (Milk does not require species) → cleared', () => {
    const result = evaluateAllergenGate({
      allergenMatches: [makeMatch({ category: 'Milk' })],
    });
    expect(result.hardStop).toBe(false);
  });

  it('multiple matches, all properly named → cleared', () => {
    const result = evaluateAllergenGate({
      allergenMatches: [
        makeMatch({ category: 'Tree Nuts', species: 'Almonds', requiresSpeciesNaming: true }),
        makeMatch({ category: 'Fish', species: 'Salmon', requiresSpeciesNaming: true }),
        makeMatch({ category: 'Milk' }),
      ],
    });
    expect(result.hardStop).toBe(false);
  });
});

// ============================================================
// Section D — evaluateAllergenGate (hard-stop cases)
// ============================================================
describe('evaluateAllergenGate — hard-stop cases', () => {
  it('Tree Nut with species undefined → hard-stop fires', () => {
    const result = evaluateAllergenGate({
      allergenMatches: [
        makeMatch({ category: 'Tree Nuts', species: undefined, requiresSpeciesNaming: true, matchedKeyword: 'tree nut' }),
      ],
    });
    expect(result.hardStop).toBe(true);
    expect(isHardStop(result)).toBe(true);
  });

  it('Fish with species undefined → hard-stop fires', () => {
    const result = evaluateAllergenGate({
      allergenMatches: [
        makeMatch({ category: 'Fish', species: undefined, requiresSpeciesNaming: true, matchedKeyword: 'fish' }),
      ],
    });
    expect(result.hardStop).toBe(true);
  });

  it('Shellfish with species undefined → hard-stop fires', () => {
    const result = evaluateAllergenGate({
      allergenMatches: [
        makeMatch({ category: 'Shellfish', species: undefined, requiresSpeciesNaming: true, matchedKeyword: 'shellfish' }),
      ],
    });
    expect(result.hardStop).toBe(true);
  });

  it('hard-stop carries source supplement-allergen', () => {
    const result = evaluateAllergenGate({
      allergenMatches: [
        makeMatch({ category: 'Tree Nuts', species: undefined, requiresSpeciesNaming: true, matchedKeyword: 'tree nuts' }),
      ],
    });
    if (!result.hardStop) throw new Error('expected hard-stop');
    expect(result.source).toBe('supplement-allergen');
  });

  it('hard-stop evidence detail names the offending category', () => {
    const result = evaluateAllergenGate({
      allergenMatches: [
        makeMatch({ category: 'Tree Nuts', species: undefined, requiresSpeciesNaming: true, matchedKeyword: 'tree nut' }),
      ],
    });
    if (!result.hardStop) throw new Error('expected hard-stop');
    expect(result.evidence[0].detail).toContain('Tree Nuts');
  });

  it('hard-stop evidence carries 21 CFR 101.36 citation', () => {
    const result = evaluateAllergenGate({
      allergenMatches: [
        makeMatch({ category: 'Fish', species: undefined, requiresSpeciesNaming: true, matchedKeyword: 'fish' }),
      ],
    });
    if (!result.hardStop) throw new Error('expected hard-stop');
    expect(result.evidence[0].citation).toContain('21 CFR 101.36');
  });

  it('mixed compliant + non-compliant → hard-stop with evidence only for non-compliant', () => {
    const result = evaluateAllergenGate({
      allergenMatches: [
        makeMatch({ category: 'Tree Nuts', species: 'Almonds', requiresSpeciesNaming: true }),
        makeMatch({ category: 'Fish', species: undefined, requiresSpeciesNaming: true, matchedKeyword: 'fish' }),
        makeMatch({ category: 'Milk' }),
      ],
    });
    expect(result.hardStop).toBe(true);
    if (!result.hardStop) return;
    expect(result.evidence).toHaveLength(1);
    expect(result.evidence[0].detail).toContain('Fish');
  });

  it('multiple species-naming violations → hard-stop with evidence per violation', () => {
    const result = evaluateAllergenGate({
      allergenMatches: [
        makeMatch({ category: 'Tree Nuts', species: undefined, requiresSpeciesNaming: true, matchedKeyword: 'tree nut' }),
        makeMatch({ category: 'Fish', species: undefined, requiresSpeciesNaming: true, matchedKeyword: 'fish' }),
      ],
    });
    if (!result.hardStop) throw new Error('expected hard-stop');
    expect(result.evidence).toHaveLength(2);
    expect(result.reason).toContain('2');
  });
});

// ============================================================
// Section E — End-to-end with detectAllergensDetailed
// ============================================================
describe('evaluateAllergenGate — end-to-end with detectAllergensDetailed', () => {
  it('"Almond meal, whey protein, wheat flour" → all properly identified → gate clears', () => {
    const matches = detectAllergensDetailed('Almond meal, whey protein, wheat flour');
    const result = evaluateAllergenGate({ allergenMatches: matches });
    expect(result.hardStop).toBe(false);
  });

  it('"Tree nut blend" → generic term, no species → gate hard-stops', () => {
    const matches = detectAllergensDetailed('Tree nut blend');
    const result = evaluateAllergenGate({ allergenMatches: matches });
    expect(result.hardStop).toBe(true);
  });

  it('"Fish oil concentrate" → generic Fish term → gate hard-stops', () => {
    const matches = detectAllergensDetailed('Fish oil concentrate');
    const result = evaluateAllergenGate({ allergenMatches: matches });
    expect(result.hardStop).toBe(true);
  });

  it('"Salmon oil concentrate" → species named → gate clears', () => {
    const matches = detectAllergensDetailed('Salmon oil concentrate');
    const result = evaluateAllergenGate({ allergenMatches: matches });
    expect(result.hardStop).toBe(false);
  });

  it('"Vitamin C ascorbic acid" → no allergens → gate clears', () => {
    const matches = detectAllergensDetailed('Vitamin C ascorbic acid');
    const result = evaluateAllergenGate({ allergenMatches: matches });
    expect(result.hardStop).toBe(false);
  });
});

// ============================================================
// Section F — Composition-registry identifier
// ============================================================
describe('§B1 composition-registry identifier', () => {
  it('exports a stable identifier consumed by the Bucket 1 gate', () => {
    expect(B1_ALLERGEN_ITEM_ID).toBe('b1-allergen-species-naming');
  });
});
