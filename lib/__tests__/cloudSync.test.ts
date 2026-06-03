// ============================================================
// cloudSync mapping tests — WS-A Stage 5 (launch-blocker #4)
// ------------------------------------------------------------
// Covers the pure SavedFormulation ↔ formulations-row mapping. The
// Supabase I/O (push/pull/delete) is integration-verified against a live
// auth round-trip before "saves reliably" is claimed; here we lock the
// column mapping + migration defaults that the round-trip depends on.
// ============================================================

import { describe, it, expect } from 'vitest';
import { toRow, fromRow } from '../cloudSync';
import type { SavedFormulation } from '../../types';

function baseSaved(overrides: Partial<SavedFormulation> = {}): SavedFormulation {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'Fire-Roasted Salsa',
    ingredients: [],
    servingSize: 30,
    servingUnit: 'g',
    packageSize: 454,
    packageUnit: 'g',
    createdAt: '2026-06-02T00:00:00.000Z',
    catalogSnapshot: { kind: 'legacy-pre-schema-lock' },
    ...overrides,
  };
}

describe('toRow', () => {
  it('maps core fields + stamps owner_id, and stores the full object in data', () => {
    const sf = baseSaved({ mode: 'fb', productType: 'Hot Sauce' });
    const row = toRow(sf, 'owner-abc');
    expect(row.id).toBe(sf.id);
    expect(row.owner_id).toBe('owner-abc');
    expect(row.name).toBe('Fire-Roasted Salsa');
    expect(row.mode).toBe('fb');
    expect(row.product_type).toBe('Hot Sauce');
    expect(row.data).toBe(sf); // full payload is the source of truth
  });

  it('denormalizes the filterable columns', () => {
    const sf = baseSaved({
      mode: 'supplements',
      partNumber: 'SUP-26-0001',
      currentVersion: '1.2.0',
      status: 'in-pilot',
      tags: ['Launched', 'Q3'],
      project: 'Immune Line',
    });
    const row = toRow(sf, 'owner-1');
    expect(row.part_number).toBe('SUP-26-0001');
    expect(row.current_version).toBe('1.2.0');
    expect(row.status).toBe('in-pilot');
    expect(row.tags).toEqual(['Launched', 'Q3']);
    expect(row.project).toBe('Immune Line');
  });

  it('applies migration-safe defaults for absent optional fields', () => {
    // A pre-schema-lock save with no mode/status/tags/etc.
    const row = toRow(baseSaved(), 'owner-1');
    expect(row.mode).toBe('fb'); // historical default mode (NOT-NULL column)
    expect(row.status).toBe('draft'); // CHECK-constraint-safe default
    expect(row.tags).toEqual([]); // never null (text[] default '{}')
    expect(row.product_type).toBeNull();
    expect(row.part_number).toBeNull();
    expect(row.current_version).toBeNull();
    expect(row.project).toBeNull();
  });
});

describe('fromRow', () => {
  it('returns the data payload as the SavedFormulation', () => {
    const sf = baseSaved({ mode: 'supplements', name: 'Daily Resilience' });
    const restored = fromRow({ id: sf.id, data: sf });
    expect(restored).toEqual(sf);
  });

  it('pins the canonical row id over a drifted data.id', () => {
    const sf = baseSaved({ id: 'stale-data-id' });
    const restored = fromRow({ id: 'canonical-row-id', data: sf });
    expect(restored.id).toBe('canonical-row-id');
    expect(restored.name).toBe(sf.name); // rest of payload intact
  });
});

describe('round-trip', () => {
  it('fromRow(toRow(sf)) reproduces the formulation (id preserved)', () => {
    const sf = baseSaved({ mode: 'fb', status: 'launched', tags: ['x'] });
    const row = toRow(sf, 'owner-1');
    const restored = fromRow({ id: row.id, data: row.data });
    expect(restored).toEqual(sf);
  });
});
