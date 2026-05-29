// Supplement composition specs — localStorage persistence (Phase 1 dev scaffold).
//
// Sibling to lib/masterSpecsStorage.ts. Composition specs are wizard-generated
// (not observation-logged), so they live in their own store keyed by FG Part #.
// One spec per product; re-saving a formula overwrites it (the spec is a
// controlled-document snapshot of the most-recently-saved version).
//
// Phase 1.5 migration: same localStorage → Postgres swap path as Master Specs.

import type { SupplementCompositionSpec } from '@/types/masterSpecs';

const KEY = 'fw_masterSpecs_composition'; // Record<product_id, SupplementCompositionSpec>

export function loadCompositionSpecs(): Record<string, SupplementCompositionSpec> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Record<string, SupplementCompositionSpec>) : {};
  } catch {
    return {};
  }
}

export function loadCompositionSpec(productId: string): SupplementCompositionSpec | null {
  if (!productId) return null;
  return loadCompositionSpecs()[productId] ?? null;
}

export function saveCompositionSpec(spec: SupplementCompositionSpec): void {
  if (typeof window === 'undefined' || !spec.product_id) return;
  try {
    const all = loadCompositionSpecs();
    all[spec.product_id] = spec;
    window.localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* storage quota / disabled — silently no-op for Phase 1 dev */
  }
}
