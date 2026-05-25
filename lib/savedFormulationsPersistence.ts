// ============================================================
// SAVED FORMULATIONS — localStorage PERSISTENCE
// ------------------------------------------------------------
// First half of launch-blocker #4 (2026-05-25). Save-backend
// implementation has two halves:
//
//   1. localStorage hydrate/persist of `savedFormulations` state
//      (THIS MODULE) — survives page reload; doesn't require server
//      infrastructure; doesn't depend on Packet Q1 routing for
//      schema shape. Lands today.
//
//   2. Supabase server-side persistence — cross-device + per-user
//      auth scoped + RLS. Depends on Packet Q1 routing
//      (SavedFormulation extension vs OperatorProfile + Packet
//      two-tier schema) for the persisted shape on the server.
//      Schema (`supabase/schema.sql`) is fully landed with RLS;
//      what's pending is the wire-up to the in-app state.
//
// This module addresses the strongest external developer trial
// signal ("I lost my saves!" — Tridiv 2026-05-25) by giving
// operators next-session continuity immediately, without waiting
// on the strategic-session routing that gates the second half.
//
// Versioning strategy (belt + suspenders):
//   • Storage key carries version suffix: `fw-saved-formulations-v1`
//     (matches existing convention — fw-workspace-mode-v1 etc.)
//   • Stored shape ALSO carries an in-shape `version` field:
//     `{ version: 1, formulations: [...] }`
//   • Two-tier versioning lets future migrations choose:
//     - In-place schema bump (same key, new in-shape version) for
//       backward-compatible additions
//     - Full key bump (new key) for breaking schema changes
//
// Failure-mode discipline:
//   • localStorage unavailable (SSR / disabled) → silent empty fallback
//   • Stored JSON malformed → silent empty fallback + console.warn
//   • Stored shape wrong version OR missing fields → silent empty
//     fallback + console.warn (preserves user data by NOT overwriting
//     stored state until operator opts in to migration)
//   • Write failure (quota exceeded / disabled) → silent + console.warn
//
// Pattern follows lib/workspaceMode.ts hydrate/persist shape for
// consistency with existing fw-workspace-mode-v1 + fw-tos-v1
// hydration helpers.
// ============================================================

import type { SavedFormulation } from '../types';

/** localStorage key. Version suffix in the key for full-key-bump migrations. */
export const SAVED_FORMULATIONS_KEY = 'fw-saved-formulations-v1';

/** In-shape schema version. Bump for in-place migrations (same key, new version). */
export const SAVED_FORMULATIONS_VERSION = 1;

/** Persisted shape. In-shape `version` field guards against forward-compat surprises. */
interface PersistedSavedFormulations {
  readonly version: number;
  readonly formulations: SavedFormulation[];
}

/**
 * Hydrate the saved-formulations array from localStorage.
 *
 * Returns empty array on ANY failure mode:
 *   • localStorage unavailable
 *   • No stored data
 *   • Stored JSON malformed
 *   • Stored shape wrong version or missing fields
 *
 * Failures are logged via console.warn (operator can diagnose via
 * browser console; non-fatal — operator simply starts fresh).
 *
 * Pure function — no side effects beyond console.warn on failure.
 * Caller (page.tsx mount useEffect) is responsible for calling
 * setSavedFormulations with the returned array.
 *
 * @param storage  localStorage-like (use `window.localStorage` in
 *                 browser; mockable for tests via vi.fn()).
 * @returns        Array of SavedFormulation; empty array on any
 *                 failure mode.
 */
export function hydrateSavedFormulations(storage: Storage): SavedFormulation[] {
  let raw: string | null;
  try {
    raw = storage.getItem(SAVED_FORMULATIONS_KEY);
  } catch (err) {
    // Storage access denied (private mode / quota / browser policy)
    // eslint-disable-next-line no-console
    console.warn('[fw] savedFormulations: localStorage read failed', err);
    return [];
  }

  if (!raw) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    // Malformed JSON in storage — possibly corruption from a prior
    // browser session or manual editing. Start fresh.
    // eslint-disable-next-line no-console
    console.warn('[fw] savedFormulations: localStorage JSON parse failed', err);
    return [];
  }

  // Shape validation. Be defensive — anything not matching the
  // expected shape returns empty (preserves user data by NOT
  // overwriting until migration is intentional).
  if (
    !parsed ||
    typeof parsed !== 'object' ||
    !('version' in parsed) ||
    !('formulations' in parsed)
  ) {
    // eslint-disable-next-line no-console
    console.warn('[fw] savedFormulations: localStorage shape mismatch — missing version/formulations fields');
    return [];
  }

  const persisted = parsed as { version: unknown; formulations: unknown };

  if (persisted.version !== SAVED_FORMULATIONS_VERSION) {
    // eslint-disable-next-line no-console
    console.warn(
      `[fw] savedFormulations: stored version ${String(persisted.version)} does not match expected ${SAVED_FORMULATIONS_VERSION}; preserving stored data, returning empty for safety`,
    );
    return [];
  }

  if (!Array.isArray(persisted.formulations)) {
    // eslint-disable-next-line no-console
    console.warn('[fw] savedFormulations: formulations field is not an array');
    return [];
  }

  // We don't validate each individual SavedFormulation entry's
  // schema here — that's the caller's runtime concern. If a single
  // entry is malformed, the app's render layer will surface the
  // breakage rather than this helper silently filtering. Trust the
  // type system at the persistence boundary.
  return persisted.formulations as SavedFormulation[];
}

/**
 * Persist the saved-formulations array to localStorage.
 *
 * Silent failure on any error (console.warn logged). Failure
 * modes:
 *   • localStorage unavailable
 *   • Quota exceeded (rare unless operator has hundreds of
 *     formulations — each is small)
 *   • Storage access denied (private mode)
 *
 * Pure function — no side effects beyond localStorage write +
 * console.warn on failure.
 *
 * @param storage       localStorage-like.
 * @param formulations  Current array of saved formulations to persist.
 */
export function persistSavedFormulations(
  storage: Storage,
  formulations: SavedFormulation[],
): void {
  const payload: PersistedSavedFormulations = {
    version: SAVED_FORMULATIONS_VERSION,
    formulations,
  };

  try {
    storage.setItem(SAVED_FORMULATIONS_KEY, JSON.stringify(payload));
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[fw] savedFormulations: localStorage write failed', err);
  }
}
