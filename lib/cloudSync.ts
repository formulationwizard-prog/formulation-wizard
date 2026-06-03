// ============================================================
// CLOUD SYNC — Supabase persistence for saved formulations
// ------------------------------------------------------------
// WS-A Stage 5 (launch-blocker #4, "saves reliably"). The pure
// mapping + Supabase I/O layer that turns the localStorage-only
// save model into a cloud-backed one. localStorage stays as the
// optimistic cache (see app/workspace/page.tsx persistSavedFormulations);
// this module is the server-of-record half.
//
// DELIBERATELY ISOLATED: no React, no workspace imports. The mapping
// functions (toRow / fromRow) are pure and unit-tested; push/pull/delete
// take a SupabaseClient so they're mockable. Wiring into the workspace
// (hydrate-on-mount + mirror-on-save) is a separate step, gated on a live
// auth round-trip before "saves reliably" can be claimed.
//
// Table shape — public.formulations (supabase/schema.sql):
//   id uuid PK · owner_id uuid · name · mode · product_type · part_number ·
//   current_version · status · tags text[] · project · data jsonb · timestamps
// The full SavedFormulation is stored in `data`; the top-level columns are
// denormalized copies for fast filtering. `data` is the source of truth.
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import type { SavedFormulation } from '@/types';

export const FORMULATIONS_TABLE = 'formulations';

type FormulationMode = NonNullable<SavedFormulation['mode']>;
type FormulationStatus = NonNullable<SavedFormulation['status']>;

/** The columns we write on insert/upsert (DB manages id-default + timestamps). */
export interface FormulationUpsert {
  id: string;
  owner_id: string;
  name: string;
  mode: FormulationMode;
  product_type: string | null;
  part_number: string | null;
  current_version: string | null;
  status: FormulationStatus;
  tags: string[];
  project: string | null;
  data: SavedFormulation;
}

/**
 * Map a SavedFormulation to a formulations-table row for the given owner.
 *
 * Defaults exist only for migration of pre-schema-lock saves where an optional
 * field is absent; in practice the workspace always sets mode + status. mode
 * falls back to 'fb' (the app's historical default mode) and status to 'draft'
 * — both are NOT-NULL-friendly values the table CHECK constraints accept.
 */
export function toRow(sf: SavedFormulation, ownerId: string): FormulationUpsert {
  return {
    id: sf.id,
    owner_id: ownerId,
    name: sf.name,
    mode: sf.mode ?? 'fb',
    product_type: sf.productType ?? null,
    part_number: sf.partNumber ?? null,
    current_version: sf.currentVersion ?? null,
    status: sf.status ?? 'draft',
    tags: sf.tags ?? [],
    project: sf.project ?? null,
    data: sf,
  };
}

/**
 * Reconstruct a SavedFormulation from a fetched row. The full object lives in
 * `data`; we trust it as the source of truth but pin the canonical row id (in
 * case a legacy `data.id` ever drifted from the table PK).
 */
export function fromRow(row: { id: string; data: SavedFormulation }): SavedFormulation {
  return { ...row.data, id: row.id };
}

export interface CloudResult<T> {
  data: T;
  error: string | null;
}

/**
 * Upsert one formulation to the cloud (insert-or-update on id). Idempotent —
 * safe to call on every save. Returns a friendly error string rather than
 * throwing so the caller can keep the localStorage cache authoritative when
 * the network/cloud is unavailable.
 */
export async function pushFormulation(
  supabase: SupabaseClient,
  sf: SavedFormulation,
  ownerId: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from(FORMULATIONS_TABLE)
    .upsert(toRow(sf, ownerId), { onConflict: 'id' });
  return { error: error?.message ?? null };
}

/**
 * Pull every formulation owned by the user, newest-modified first. RLS scopes
 * the result to the caller's own rows; we additionally filter on owner_id so
 * the intent is explicit and the query is index-backed.
 */
export async function pullFormulations(
  supabase: SupabaseClient,
  ownerId: string,
): Promise<CloudResult<SavedFormulation[]>> {
  const { data, error } = await supabase
    .from(FORMULATIONS_TABLE)
    .select('id, data')
    .eq('owner_id', ownerId)
    .order('updated_at', { ascending: false });

  if (error) return { data: [], error: error.message };
  const rows = (data ?? []) as Array<{ id: string; data: SavedFormulation }>;
  return { data: rows.map(fromRow), error: null };
}

/** Delete one formulation from the cloud by id (RLS enforces ownership). */
export async function deleteCloudFormulation(
  supabase: SupabaseClient,
  id: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase.from(FORMULATIONS_TABLE).delete().eq('id', id);
  return { error: error?.message ?? null };
}
