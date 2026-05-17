// ============================================================
// WORKSPACE MODE + SEGMENTED TOS STATE MACHINERY
// ------------------------------------------------------------
// Round 11 Phase 3 Workstream A (2026-05-17). Pure helpers backing
// the segmented per-mode TOS acceptance flow. Replaces the prior
// single-boolean tosAccepted model with a mode-aware state machine.
//
// Architecture (per Phase 3 directive):
//
//   Mode preference stored at fw-workspace-mode-v1
//   Per-mode TOS acceptance stored at separate keys per mode:
//     • fw-tos-supp-v1 — supplement-mode TOS (lib/supplementTos.ts)
//     • fw-tos-v1      — F&B-mode TOS (inline F&B-shaped text in
//                        app/workspace/page.tsx, untouched for Round 11)
//
// Entry flow:
//   1. Hydrate workspace state from localStorage
//   2. determineEntryScreen decides what to show:
//        a. mode-selection (no mode preference set yet)
//        b. tos-modal      (mode set but mode's TOS not accepted)
//        c. workspace      (mode set AND mode's TOS accepted)
//   3. Mode change in-workspace: same logic — check target mode's
//      TOS acceptance, fire modal if needed
//
// Migration (existing fw-tos-v1 accepters from pre-Round-11):
//   No explicit migration code needed. The data model self-migrates:
//     • Pre-Round-11 user has fw-tos-v1='accepted' but no
//       fw-workspace-mode-v1 → hydrated state reads
//       tosAccepted.fb=true, tosAccepted.supplements=false,
//       mode=undefined
//     • determineEntryScreen returns 'mode-selection' on next visit
//     • If user picks F&B: persist mode, no re-prompt (F&B TOS
//       already accepted from fw-tos-v1)
//     • If user picks supplements: persist mode, fire fw-tos-supp-v1
//       modal (supplement TOS not yet accepted)
//
// Forward-compat note: at Q4 F&B re-entry, when the F&B TOS migrates
// from inline strings to a sibling module (lib/foodTos.ts proposed),
// the key fw-tos-v1 will rename to fw-tos-fnb-v1 with a substantive
// content rewrite. At that point, TOS_KEY_BY_MODE.fb updates here AND
// the migration handler picks up: existing fw-tos-v1 accepters will
// need to re-acknowledge the new F&B TOS. That migration is its own
// commit at Q4; the data model in this module supports it cleanly.
// ============================================================

import {
  SUPP_TOS_VERSION_KEY,
} from './supplementTos';

/**
 * Workspace mode discriminator. Matches lib/modes.ts ModeId — kept as
 * a local string union here to avoid coupling the TOS state machinery
 * to the broader modes registry (which carries UI / catalog / unit
 * configuration unrelated to TOS routing).
 */
export type WorkspaceMode = 'supplements' | 'fb';

/**
 * Stable localStorage key for the user's selected workspace mode.
 * Separate from TOS acceptance keys — a returning user who has
 * accepted both segments' TOS shouldn't re-prompt mode selection on
 * every workspace visit; they default to their last-selected mode.
 */
export const WORKSPACE_MODE_KEY = 'fw-workspace-mode-v1' as const;

/**
 * TOS version key per workspace mode. Mirrors the per-segment
 * disclaimer architecture decided in the Phase 3 scoping conversation.
 *
 * Note on naming inconsistency (fw-tos-supp-v1 / fw-tos-v1):
 * F&B retains the legacy fw-tos-v1 key for Round 11 (no content
 * change; the existing inline F&B-shaped text continues to apply).
 * At Q4 F&B re-entry, the F&B TOS migrates to a substantive rewrite
 * (proposed key: fw-tos-fnb-v1). The pair becomes
 * fw-tos-supp-v1 + fw-tos-fnb-v1 then.
 */
export const TOS_KEY_BY_MODE: Record<WorkspaceMode, string> = {
  supplements: SUPP_TOS_VERSION_KEY,
  fb: 'fw-tos-v1',
};

/**
 * Hydrated workspace entry state. Captures both the user's mode
 * preference and per-mode TOS acceptance status.
 */
export interface WorkspaceEntryState {
  /** Selected workspace mode. undefined when the user has not yet
   *  made a mode selection (first visit, or post-migration from
   *  pre-Round-11 fw-tos-v1-only state). */
  mode: WorkspaceMode | undefined;
  /** Per-mode TOS acceptance status. Independent across modes —
   *  accepting supplement TOS does not imply F&B acceptance. */
  tosAccepted: Record<WorkspaceMode, boolean>;
}

/**
 * Discriminated entry-screen decision. Caller renders the
 * corresponding screen.
 */
export type EntryScreen =
  /** No mode preference set; render mode-selection screen. */
  | { screen: 'mode-selection' }
  /** Mode set but mode's TOS not accepted; render TOS modal for the
   *  named mode. */
  | { screen: 'tos-modal'; mode: WorkspaceMode }
  /** Mode set and mode's TOS accepted; render workspace as normal. */
  | { screen: 'workspace'; mode: WorkspaceMode };

// ─── Storage adapters (Storage interface for testability) ───────

/**
 * Minimal storage interface — matches the browser localStorage
 * contract. Accepting an interface (rather than reading
 * window.localStorage directly) keeps these helpers pure and
 * testable. Production callers pass window.localStorage; tests pass
 * an in-memory mock.
 */
export interface MinimalStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/**
 * Type guard for whether a string value is one of the two TOS-bearing
 * workspace modes. Used by hydrate to validate persisted storage
 * values AND by callers narrowing the broader lib/modes.ts ModeId
 * type (which includes verticals like 'baking', 'catering', 'feeds',
 * 'sausage' that are scaffolded in the type registry but not exposed
 * in the user-facing mode switcher and not in MODE_ORDER). Any other
 * value yields the narrow branch returning false; caller decides
 * whether to fall back, ignore, or error.
 */
export function isWorkspaceMode(s: string | null | undefined): s is WorkspaceMode {
  return s === 'supplements' || s === 'fb';
}

/**
 * Read workspace entry state from storage. Pure function — no side
 * effects on storage. Callers pass an in-memory mock for tests;
 * production callers pass window.localStorage.
 *
 *   • Reads WORKSPACE_MODE_KEY → mode (or undefined if absent /
 *     malformed)
 *   • Reads each TOS key in TOS_KEY_BY_MODE → boolean acceptance
 *     per mode
 *
 * The 'accepted' literal value matches both the legacy fw-tos-v1
 * stored value (pre-Round-11) AND the new fw-tos-supp-v1 stored
 * value (Round 11+). No migration shim required.
 */
export function hydrateWorkspaceEntryState(
  storage: MinimalStorage,
): WorkspaceEntryState {
  const rawMode = storage.getItem(WORKSPACE_MODE_KEY);
  return {
    mode: isWorkspaceMode(rawMode) ? rawMode : undefined,
    tosAccepted: {
      supplements: storage.getItem(TOS_KEY_BY_MODE.supplements) === 'accepted',
      fb: storage.getItem(TOS_KEY_BY_MODE.fb) === 'accepted',
    },
  };
}

/** Persist the user's selected workspace mode. */
export function persistMode(storage: MinimalStorage, mode: WorkspaceMode): void {
  storage.setItem(WORKSPACE_MODE_KEY, mode);
}

/** Persist TOS acceptance for the named mode. Stores the literal
 *  'accepted' value matching the existing acceptance-check convention. */
export function persistTosAcceptance(
  storage: MinimalStorage,
  mode: WorkspaceMode,
): void {
  storage.setItem(TOS_KEY_BY_MODE[mode], 'accepted');
}

/** Revoke TOS acceptance for the named mode (used by "Review Terms"
 *  command palette / footer affordance). Removes the key so the
 *  next hydrate reads acceptance as false. */
export function revokeTosAcceptance(
  storage: MinimalStorage,
  mode: WorkspaceMode,
): void {
  storage.removeItem(TOS_KEY_BY_MODE[mode]);
}

// ─── Entry screen decision ─────────────────────────────────────

/**
 * Determine what screen to show on workspace entry, given the
 * hydrated state. Pure function — no side effects.
 *
 *   • If no mode preference → mode-selection (first visit OR
 *     post-migration from pre-Round-11 fw-tos-v1-only state)
 *   • If mode set but mode's TOS not accepted → tos-modal for that
 *     mode (e.g., user picked supplements in selection screen, now
 *     needs to acknowledge fw-tos-supp-v1)
 *   • If mode set AND mode's TOS accepted → workspace (normal
 *     interaction allowed)
 *
 * Same decision logic applies to in-workspace mode switches: caller
 * persists the new mode, re-hydrates state, and re-evaluates this
 * function to determine whether to fire the target mode's TOS modal
 * before allowing mode switch to take effect.
 */
export function determineEntryScreen(
  state: WorkspaceEntryState,
): EntryScreen {
  if (state.mode === undefined) return { screen: 'mode-selection' };
  if (!state.tosAccepted[state.mode]) {
    return { screen: 'tos-modal', mode: state.mode };
  }
  return { screen: 'workspace', mode: state.mode };
}

// ─── Mode-change preflight helper ──────────────────────────────

/**
 * Discriminated result for a proposed mode change. Caller invokes
 * before actually changing mode; if the result is
 * 'needs-tos-acceptance', caller fires the target mode's TOS modal
 * and defers the mode switch until acceptance lands.
 */
export type ModeChangeResult =
  /** Target mode's TOS already accepted; proceed with mode switch. */
  | { proceed: true }
  /** Target mode's TOS not yet accepted; caller fires modal and
   *  defers the switch. */
  | { proceed: false; needsAcceptance: WorkspaceMode };

/**
 * Pre-flight check before changing workspace mode. Pure function.
 * Caller passes the current entry state and the target mode; result
 * indicates whether the switch can proceed immediately or requires
 * TOS acceptance for the target mode first.
 */
export function checkModeChange(
  state: WorkspaceEntryState,
  targetMode: WorkspaceMode,
): ModeChangeResult {
  if (state.tosAccepted[targetMode]) return { proceed: true };
  return { proceed: false, needsAcceptance: targetMode };
}
