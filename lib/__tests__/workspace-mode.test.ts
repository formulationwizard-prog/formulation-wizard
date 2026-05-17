// ============================================================
// Workspace mode + segmented TOS state-machine tests
// ------------------------------------------------------------
// Round 11 Phase 3 Workstream A (2026-05-17). Tests the pure
// helpers backing the per-mode TOS acceptance flow at
// lib/workspaceMode.ts. Covers:
//
//   • Hydration from storage (all four state permutations)
//   • Persistence of mode + per-mode TOS acceptance
//   • Revocation (Review Terms affordance)
//   • Entry screen decision (mode-selection / tos-modal / workspace)
//   • Mode-change pre-flight check
//   • Migration flow (existing fw-tos-v1 accepters from pre-Round-11)
//   • Test coverage for paths that won't execute in production during
//     the Nutraceuticals-only August launch window (F&B path), so the
//     state machine is verified forward-compat for Q4 F&B re-entry
//     before customer-zero exercises it
// ============================================================

import { describe, it, expect, beforeEach } from 'vitest';
import {
  type WorkspaceMode,
  type WorkspaceEntryState,
  WORKSPACE_MODE_KEY,
  TOS_KEY_BY_MODE,
  hydrateWorkspaceEntryState,
  persistMode,
  persistTosAcceptance,
  revokeTosAcceptance,
  determineEntryScreen,
  checkModeChange,
  type MinimalStorage,
} from '../workspaceMode';

// ─── In-memory MinimalStorage mock ───────────────────────────────

class MockStorage implements MinimalStorage {
  private store = new Map<string, string>();
  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }
  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  /** Test convenience: pre-seed the storage with raw key/value pairs. */
  seed(entries: Record<string, string>): void {
    for (const [k, v] of Object.entries(entries)) this.store.set(k, v);
  }
  /** Test convenience: assert a key's stored value. */
  read(key: string): string | null {
    return this.getItem(key);
  }
}

let storage: MockStorage;
beforeEach(() => {
  storage = new MockStorage();
});

// ============================================================
// Section A — Hydration from storage
// ============================================================
describe('hydrateWorkspaceEntryState', () => {
  it('empty storage → mode undefined, both TOS unaccepted', () => {
    const state = hydrateWorkspaceEntryState(storage);
    expect(state.mode).toBeUndefined();
    expect(state.tosAccepted).toEqual({ supplements: false, fb: false });
  });

  it("mode='supplements' + supplement TOS accepted → fully populated supplement state", () => {
    storage.seed({
      [WORKSPACE_MODE_KEY]: 'supplements',
      [TOS_KEY_BY_MODE.supplements]: 'accepted',
    });
    const state = hydrateWorkspaceEntryState(storage);
    expect(state.mode).toBe('supplements');
    expect(state.tosAccepted.supplements).toBe(true);
    expect(state.tosAccepted.fb).toBe(false);
  });

  it("mode='fb' + F&B TOS accepted → fully populated F&B state", () => {
    storage.seed({
      [WORKSPACE_MODE_KEY]: 'fb',
      [TOS_KEY_BY_MODE.fb]: 'accepted',
    });
    const state = hydrateWorkspaceEntryState(storage);
    expect(state.mode).toBe('fb');
    expect(state.tosAccepted.fb).toBe(true);
    expect(state.tosAccepted.supplements).toBe(false);
  });

  it('both TOS accepted (returning user across modes) → both flags true', () => {
    storage.seed({
      [WORKSPACE_MODE_KEY]: 'supplements',
      [TOS_KEY_BY_MODE.supplements]: 'accepted',
      [TOS_KEY_BY_MODE.fb]: 'accepted',
    });
    const state = hydrateWorkspaceEntryState(storage);
    expect(state.tosAccepted).toEqual({ supplements: true, fb: true });
  });

  it('malformed mode value in storage → mode undefined (routes to mode-selection)', () => {
    storage.seed({ [WORKSPACE_MODE_KEY]: 'not-a-real-mode' });
    const state = hydrateWorkspaceEntryState(storage);
    expect(state.mode).toBeUndefined();
  });

  it('TOS value other than literal "accepted" → unaccepted', () => {
    storage.seed({
      [TOS_KEY_BY_MODE.supplements]: 'true', // not the 'accepted' literal
    });
    const state = hydrateWorkspaceEntryState(storage);
    expect(state.tosAccepted.supplements).toBe(false);
  });
});

// ============================================================
// Section B — Persistence
// ============================================================
describe('persistMode / persistTosAcceptance / revokeTosAcceptance', () => {
  it('persistMode writes the mode to WORKSPACE_MODE_KEY', () => {
    persistMode(storage, 'supplements');
    expect(storage.read(WORKSPACE_MODE_KEY)).toBe('supplements');
  });

  it('persistMode round-trips through hydrate', () => {
    persistMode(storage, 'fb');
    expect(hydrateWorkspaceEntryState(storage).mode).toBe('fb');
  });

  it('persistTosAcceptance writes "accepted" to the mode-specific key', () => {
    persistTosAcceptance(storage, 'supplements');
    expect(storage.read(TOS_KEY_BY_MODE.supplements)).toBe('accepted');
  });

  it('persistTosAcceptance is mode-independent (accepting supplements does not affect F&B)', () => {
    persistTosAcceptance(storage, 'supplements');
    expect(storage.read(TOS_KEY_BY_MODE.fb)).toBeNull();
  });

  it('revokeTosAcceptance removes the mode-specific TOS key', () => {
    persistTosAcceptance(storage, 'supplements');
    expect(storage.read(TOS_KEY_BY_MODE.supplements)).toBe('accepted');
    revokeTosAcceptance(storage, 'supplements');
    expect(storage.read(TOS_KEY_BY_MODE.supplements)).toBeNull();
  });

  it('revokeTosAcceptance is mode-independent', () => {
    persistTosAcceptance(storage, 'supplements');
    persistTosAcceptance(storage, 'fb');
    revokeTosAcceptance(storage, 'supplements');
    expect(storage.read(TOS_KEY_BY_MODE.supplements)).toBeNull();
    expect(storage.read(TOS_KEY_BY_MODE.fb)).toBe('accepted');
  });
});

// ============================================================
// Section C — Entry screen decision
// ============================================================
describe('determineEntryScreen', () => {
  function state(overrides: Partial<WorkspaceEntryState> = {}): WorkspaceEntryState {
    return {
      mode: undefined,
      tosAccepted: { supplements: false, fb: false },
      ...overrides,
    };
  }

  it('mode undefined → mode-selection (first visit)', () => {
    expect(determineEntryScreen(state())).toEqual({ screen: 'mode-selection' });
  });

  it('supplements mode + supplement TOS not accepted → tos-modal for supplements', () => {
    expect(
      determineEntryScreen(state({ mode: 'supplements' })),
    ).toEqual({ screen: 'tos-modal', mode: 'supplements' });
  });

  it('supplements mode + supplement TOS accepted → workspace', () => {
    expect(
      determineEntryScreen(state({
        mode: 'supplements',
        tosAccepted: { supplements: true, fb: false },
      })),
    ).toEqual({ screen: 'workspace', mode: 'supplements' });
  });

  it("F&B mode + F&B TOS accepted → workspace (F&B path; won't execute in production during launch)", () => {
    expect(
      determineEntryScreen(state({
        mode: 'fb',
        tosAccepted: { supplements: false, fb: true },
      })),
    ).toEqual({ screen: 'workspace', mode: 'fb' });
  });

  it('F&B mode + F&B TOS not accepted → tos-modal for F&B (forward-compat for Q4 re-entry)', () => {
    expect(
      determineEntryScreen(state({ mode: 'fb' })),
    ).toEqual({ screen: 'tos-modal', mode: 'fb' });
  });

  it('cross-mode TOS acceptance does not unlock other mode (each mode requires its own acceptance)', () => {
    // User has accepted F&B TOS but selected supplements as their
    // workspace mode. Supplement TOS is still required.
    expect(
      determineEntryScreen(state({
        mode: 'supplements',
        tosAccepted: { supplements: false, fb: true },
      })),
    ).toEqual({ screen: 'tos-modal', mode: 'supplements' });
  });
});

// ============================================================
// Section D — Mode-change pre-flight check
// ============================================================
describe('checkModeChange', () => {
  it('target mode TOS already accepted → proceed', () => {
    const state: WorkspaceEntryState = {
      mode: 'supplements',
      tosAccepted: { supplements: true, fb: true },
    };
    expect(checkModeChange(state, 'fb')).toEqual({ proceed: true });
  });

  it('target mode TOS not accepted → caller must fire that mode\'s modal', () => {
    const state: WorkspaceEntryState = {
      mode: 'fb',
      tosAccepted: { supplements: false, fb: true },
    };
    expect(checkModeChange(state, 'supplements')).toEqual({
      proceed: false,
      needsAcceptance: 'supplements',
    });
  });

  it('switching to current mode is a no-op decision but still proceed=true (caller decides whether to act)', () => {
    const state: WorkspaceEntryState = {
      mode: 'supplements',
      tosAccepted: { supplements: true, fb: false },
    };
    expect(checkModeChange(state, 'supplements')).toEqual({ proceed: true });
  });
});

// ============================================================
// Section E — Migration flow (pre-Round-11 fw-tos-v1 accepters)
// ============================================================
describe('migration flow — pre-Round-11 fw-tos-v1 accepters', () => {
  it('pre-Round-11 user (only fw-tos-v1 accepted) → mode-selection on next visit', () => {
    // Simulate pre-Round-11 storage state: only legacy fw-tos-v1
    storage.seed({ 'fw-tos-v1': 'accepted' });
    const state = hydrateWorkspaceEntryState(storage);
    // Data model auto-classifies the legacy acceptance as F&B
    expect(state.mode).toBeUndefined();
    expect(state.tosAccepted.fb).toBe(true);
    expect(state.tosAccepted.supplements).toBe(false);
    // Next-visit decision: mode-selection (no mode set)
    expect(determineEntryScreen(state)).toEqual({ screen: 'mode-selection' });
  });

  it('pre-Round-11 user picks F&B at mode-selection → workspace immediately (no re-prompt)', () => {
    storage.seed({ 'fw-tos-v1': 'accepted' });
    persistMode(storage, 'fb');
    const state = hydrateWorkspaceEntryState(storage);
    // F&B TOS already accepted from legacy; no modal needed
    expect(determineEntryScreen(state)).toEqual({ screen: 'workspace', mode: 'fb' });
  });

  it('pre-Round-11 user picks supplements at mode-selection → supplement TOS modal fires', () => {
    storage.seed({ 'fw-tos-v1': 'accepted' });
    persistMode(storage, 'supplements');
    const state = hydrateWorkspaceEntryState(storage);
    // Supplement TOS not yet accepted; modal needed
    expect(determineEntryScreen(state)).toEqual({
      screen: 'tos-modal',
      mode: 'supplements',
    });
  });

  it('pre-Round-11 user → supplements → accepts supplement TOS → workspace', () => {
    storage.seed({ 'fw-tos-v1': 'accepted' });
    persistMode(storage, 'supplements');
    persistTosAcceptance(storage, 'supplements');
    const state = hydrateWorkspaceEntryState(storage);
    expect(determineEntryScreen(state)).toEqual({
      screen: 'workspace',
      mode: 'supplements',
    });
    // Both TOS now accepted (legacy F&B + new supplement)
    expect(state.tosAccepted).toEqual({ supplements: true, fb: true });
  });

  it('pre-Round-11 user → supplements → later switches to F&B → no re-prompt (legacy F&B TOS still valid)', () => {
    storage.seed({ 'fw-tos-v1': 'accepted' });
    persistMode(storage, 'supplements');
    persistTosAcceptance(storage, 'supplements');
    const state = hydrateWorkspaceEntryState(storage);
    expect(checkModeChange(state, 'fb')).toEqual({ proceed: true });
  });
});

// ============================================================
// Section F — Returning-user flows
// ============================================================
describe('returning-user flows (post-Round-11)', () => {
  it('returning supplement user → workspace directly', () => {
    persistMode(storage, 'supplements');
    persistTosAcceptance(storage, 'supplements');
    expect(determineEntryScreen(hydrateWorkspaceEntryState(storage)))
      .toEqual({ screen: 'workspace', mode: 'supplements' });
  });

  it('returning supplement user switches to F&B (never accepted F&B TOS) → fires F&B modal', () => {
    persistMode(storage, 'supplements');
    persistTosAcceptance(storage, 'supplements');
    const state = hydrateWorkspaceEntryState(storage);
    const change = checkModeChange(state, 'fb');
    expect(change).toEqual({ proceed: false, needsAcceptance: 'fb' });
  });

  it('after revoking supplement TOS, returning user gets supplement modal again', () => {
    persistMode(storage, 'supplements');
    persistTosAcceptance(storage, 'supplements');
    revokeTosAcceptance(storage, 'supplements');
    expect(determineEntryScreen(hydrateWorkspaceEntryState(storage)))
      .toEqual({ screen: 'tos-modal', mode: 'supplements' });
  });

  it('revoking supplement TOS does NOT affect F&B acceptance', () => {
    persistMode(storage, 'supplements');
    persistTosAcceptance(storage, 'supplements');
    persistTosAcceptance(storage, 'fb');
    revokeTosAcceptance(storage, 'supplements');
    const state = hydrateWorkspaceEntryState(storage);
    expect(state.tosAccepted).toEqual({ supplements: false, fb: true });
  });
});

// ============================================================
// Section G — Key constants integrity
// ============================================================
describe('key constants', () => {
  it('WORKSPACE_MODE_KEY is stable identifier', () => {
    expect(WORKSPACE_MODE_KEY).toBe('fw-workspace-mode-v1');
  });

  it('TOS_KEY_BY_MODE.supplements routes to fw-tos-supp-v1', () => {
    expect(TOS_KEY_BY_MODE.supplements).toBe('fw-tos-supp-v1');
  });

  it('TOS_KEY_BY_MODE.fb retains legacy fw-tos-v1 key for Round 11', () => {
    // Note for Q4 F&B re-entry: this key migrates to 'fw-tos-fnb-v1'
    // alongside the F&B TOS substantive rewrite.
    expect(TOS_KEY_BY_MODE.fb).toBe('fw-tos-v1');
  });

  it('mode key and TOS keys are all distinct (no collisions)', () => {
    const all: string[] = [WORKSPACE_MODE_KEY, TOS_KEY_BY_MODE.supplements, TOS_KEY_BY_MODE.fb];
    expect(new Set(all).size).toBe(all.length);
  });
});

// Silence unused-import lint warning for type-only imports.
type _UnusedMode = WorkspaceMode;
