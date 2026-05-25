// ============================================================
// SAVED FORMULATIONS — localStorage PERSISTENCE TESTS
// ------------------------------------------------------------
// Tests for lib/savedFormulationsPersistence.ts. Covers:
//   • Happy-path hydrate/persist round-trip
//   • Failure-mode resilience (malformed JSON / wrong shape /
//     wrong version / storage unavailable / write quota exceeded)
//   • Versioning discipline (in-shape `version` field)
//
// First half of launch-blocker #4. Second half (Supabase server-
// side) lands after Packet Q1 routing.
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  hydrateSavedFormulations,
  persistSavedFormulations,
  SAVED_FORMULATIONS_KEY,
  SAVED_FORMULATIONS_VERSION,
} from '../savedFormulationsPersistence';
import type { SavedFormulation } from '../../types';

// Minimal SavedFormulation fixture — only fields required to
// confirm round-trip; full schema doesn't need to validate at
// the persistence layer.
function makeFormulation(overrides: Partial<SavedFormulation> = {}): SavedFormulation {
  return {
    id: 'test-id-1',
    name: 'Test Formulation',
    ingredients: [],
    servingSize: 30,
    servingUnit: 'g',
    packageSize: 300,
    packageUnit: 'g',
    createdAt: '2026-05-25T12:00:00Z',
    catalogSnapshot: { kind: 'legacy-pre-schema-lock' },
    ...overrides,
  };
}

// In-memory Storage mock for tests. Matches browser localStorage
// interface so the same hydrate/persist functions used in the
// browser run identically here.
function makeMockStorage(initialData: Record<string, string> = {}): Storage {
  const store: Record<string, string> = { ...initialData };
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach(k => delete store[k]);
    }),
    key: vi.fn((i: number) => Object.keys(store)[i] ?? null),
    get length() {
      return Object.keys(store).length;
    },
  };
}

let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {
    // suppress warn output in tests; assertions verify the spy was called
  });
});

// ============================================================
// HAPPY PATH
// ============================================================
describe('savedFormulationsPersistence — happy path round-trip', () => {
  it('persist + hydrate round-trips an empty array', () => {
    const storage = makeMockStorage();
    persistSavedFormulations(storage, []);
    const result = hydrateSavedFormulations(storage);
    expect(result).toEqual([]);
  });

  it('persist + hydrate round-trips a single formulation', () => {
    const storage = makeMockStorage();
    const f = makeFormulation({ name: 'My Daily Multivitamin' });
    persistSavedFormulations(storage, [f]);
    const result = hydrateSavedFormulations(storage);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('My Daily Multivitamin');
  });

  it('persist + hydrate round-trips multiple formulations preserving order', () => {
    const storage = makeMockStorage();
    const formulations = [
      makeFormulation({ id: 'a', name: 'First' }),
      makeFormulation({ id: 'b', name: 'Second' }),
      makeFormulation({ id: 'c', name: 'Third' }),
    ];
    persistSavedFormulations(storage, formulations);
    const result = hydrateSavedFormulations(storage);
    expect(result.map(f => f.id)).toEqual(['a', 'b', 'c']);
  });

  it('persist writes to the canonical key', () => {
    const storage = makeMockStorage();
    persistSavedFormulations(storage, [makeFormulation()]);
    expect(storage.setItem).toHaveBeenCalledWith(
      SAVED_FORMULATIONS_KEY,
      expect.stringContaining(`"version":${SAVED_FORMULATIONS_VERSION}`),
    );
  });

  it('persist writes a versioned payload with formulations array', () => {
    const storage = makeMockStorage();
    persistSavedFormulations(storage, [makeFormulation()]);
    const stored = (storage.setItem as ReturnType<typeof vi.fn>).mock.calls[0][1] as string;
    const parsed = JSON.parse(stored);
    expect(parsed.version).toBe(SAVED_FORMULATIONS_VERSION);
    expect(Array.isArray(parsed.formulations)).toBe(true);
    expect(parsed.formulations).toHaveLength(1);
  });
});

// ============================================================
// EMPTY / MISSING DATA
// ============================================================
describe('savedFormulationsPersistence — empty / missing data', () => {
  it('hydrate returns empty array when storage is empty', () => {
    const storage = makeMockStorage();
    expect(hydrateSavedFormulations(storage)).toEqual([]);
  });

  it('hydrate returns empty array when key is unset (does NOT warn — empty is normal)', () => {
    const storage = makeMockStorage();
    hydrateSavedFormulations(storage);
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });
});

// ============================================================
// FAILURE MODES — READ
// ============================================================
describe('savedFormulationsPersistence — read failure modes', () => {
  it('hydrate handles malformed JSON gracefully (returns empty + warns)', () => {
    const storage = makeMockStorage({
      [SAVED_FORMULATIONS_KEY]: '{ not valid json',
    });
    const result = hydrateSavedFormulations(storage);
    expect(result).toEqual([]);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('JSON parse failed'),
      expect.anything(),
    );
  });

  it('hydrate handles missing version field gracefully', () => {
    const storage = makeMockStorage({
      [SAVED_FORMULATIONS_KEY]: JSON.stringify({ formulations: [] }),
    });
    expect(hydrateSavedFormulations(storage)).toEqual([]);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('shape mismatch'),
    );
  });

  it('hydrate handles missing formulations field gracefully', () => {
    const storage = makeMockStorage({
      [SAVED_FORMULATIONS_KEY]: JSON.stringify({ version: 1 }),
    });
    expect(hydrateSavedFormulations(storage)).toEqual([]);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('shape mismatch'),
    );
  });

  it('hydrate handles wrong version gracefully (preserves stored data; returns empty)', () => {
    const storage = makeMockStorage({
      [SAVED_FORMULATIONS_KEY]: JSON.stringify({
        version: 999,
        formulations: [makeFormulation()],
      }),
    });
    expect(hydrateSavedFormulations(storage)).toEqual([]);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('does not match expected'),
    );
  });

  it('hydrate handles formulations field that is not an array', () => {
    const storage = makeMockStorage({
      [SAVED_FORMULATIONS_KEY]: JSON.stringify({
        version: 1,
        formulations: { not: 'an array' },
      }),
    });
    expect(hydrateSavedFormulations(storage)).toEqual([]);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('not an array'),
    );
  });

  it('hydrate handles null parsed value (e.g., stored "null")', () => {
    const storage = makeMockStorage({
      [SAVED_FORMULATIONS_KEY]: 'null',
    });
    expect(hydrateSavedFormulations(storage)).toEqual([]);
  });

  it('hydrate handles storage.getItem throwing', () => {
    const storage = makeMockStorage();
    (storage.getItem as ReturnType<typeof vi.fn>).mockImplementationOnce(() => {
      throw new Error('quota exceeded');
    });
    expect(hydrateSavedFormulations(storage)).toEqual([]);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('localStorage read failed'),
      expect.anything(),
    );
  });
});

// ============================================================
// FAILURE MODES — WRITE
// ============================================================
describe('savedFormulationsPersistence — write failure modes', () => {
  it('persist swallows setItem errors silently (logs warn; does not throw)', () => {
    const storage = makeMockStorage();
    (storage.setItem as ReturnType<typeof vi.fn>).mockImplementationOnce(() => {
      throw new Error('quota exceeded');
    });
    expect(() => persistSavedFormulations(storage, [makeFormulation()])).not.toThrow();
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('localStorage write failed'),
      expect.anything(),
    );
  });
});

// ============================================================
// VERSIONING DISCIPLINE
// ============================================================
describe('savedFormulationsPersistence — versioning discipline', () => {
  it('SAVED_FORMULATIONS_KEY has the v1 suffix per codebase convention', () => {
    expect(SAVED_FORMULATIONS_KEY).toMatch(/-v1$/);
  });

  it('SAVED_FORMULATIONS_VERSION is the integer 1 (in-shape version)', () => {
    expect(SAVED_FORMULATIONS_VERSION).toBe(1);
  });

  it('persisted payload always carries the in-shape version field', () => {
    const storage = makeMockStorage();
    persistSavedFormulations(storage, []);
    const stored = (storage.setItem as ReturnType<typeof vi.fn>).mock.calls[0][1] as string;
    const parsed = JSON.parse(stored);
    expect(parsed.version).toBe(SAVED_FORMULATIONS_VERSION);
  });

  it('hydrate refuses to load data with mismatched version (forward-compat safety)', () => {
    // If a future code version writes v2 shape and the operator
    // downgrades, we don't want v2 data interpreted as v1 — better
    // to return empty + warn than to crash the render with shape
    // mismatch downstream.
    const storage = makeMockStorage({
      [SAVED_FORMULATIONS_KEY]: JSON.stringify({
        version: 2,
        formulations: [],
      }),
    });
    expect(hydrateSavedFormulations(storage)).toEqual([]);
  });
});
