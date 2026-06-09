# #17 RLS Verification — Findings (2026-06-08)

**How:** RLS-first discipline. Stood up local Supabase (CLI 2.105 + Docker), authored an adversarial isolation harness, and **ran it against the live schema.** It immediately surfaced a wrong architectural assumption and then verified the real model. This is the "verify, don't infer" payoff — and the reason RLS goes first.

---

## 🔑 Finding 1 — the multi-user model is ALREADY BUILT, as a WORKSPACE model
The live schema (in the Supabase instance + the local Docker volume) is **well ahead of `supabase/schema.sql`** (which only has `owner_id`). It already has:
- **`workspaces`** + **`workspace_members`** (`workspace_id, user_id, role_kind, role, status, invited_by`) — roles + status + invite tracking, *richer than the "flat orgs" the architecture session assumed.*
- **`is_internal_member(workspace)`** — SECURITY DEFINER, pinned search_path, checks `role_kind='internal-team' AND status='active'`. Properly built.
- **`handle_new_user_workspace`** — auto-creates a workspace on signup.
- **`formulations.workspace_id`** is the team ownership key; policies are **owner-OR-internal-member**:
  - SELECT/UPDATE: `using (auth.uid() = owner_id OR is_internal_member(workspace_id))`
  - INSERT: `with check (auth.uid() = owner_id AND (workspace_id IS NULL OR is_internal_member(workspace_id)))`
  - DELETE: `using (auth.uid() = owner_id OR <workspace owner>)`

**"WS-C" = WorkSpace-Collaboration, already shipped.** Decision A's "build organizations + memberships" is **moot** — that recommendation was based on the stale `schema.sql`. The org/membership migration I drafted was redundant + *conflicting* (permissive policies OR together → my org policy let an unauthorized insert ride in). **Discarded.**

## ⚠️ Finding 2 — `supabase/schema.sql` is STALE (schema-source-of-truth gap)
The repo's `schema.sql` does NOT reflect the real schema (no workspaces). The canonical schema lives only in the live instance + the local volume — **it is not version-controlled.** No migration history for the workspace model. This is a real risk (can't reproduce the DB from the repo; can't CI the RLS). **#17 action: dump the live schema into a versioned migration** so it's source-controlled and the harness is CI-reproducible. (Routed — how to manage the canonical schema is an architecture/ops call, not a unilateral dump.)

## ✅ Finding 3 — the real workspace model's RLS is VERIFIED to isolate
`supabase/tests/rls_isolation_test.sql` (adversarial, run today against the live policies, ROLLBACK-clean):
- Member of workspace A: reads own, **cannot** read / author-into / update workspace B; cannot see workspace B's row. ✓
- Mirror for workspace B's member. ✓
- **Anon reads nothing** (formulations + workspaces). ✓

**The trust floor is proven, not just designed.** Cross-operator trade-secret leakage — the one catastrophe the "your formulas stay yours" promise exists to prevent — is verified absent on the actual policies.

*(The harness caught its OWN bug first: `reset role` between users didn't clear `request.jwt.claims`, so the "anon" check inherited the prior user's identity and produced a false leak. Fixed by clearing the claim. "Harness-pass ≠ verified" working on the harness itself.)*

---

## Routing for the architecture session (revised)
- **Decision A is largely settled by the existing code** — the workspace model is built + verified. The session's real auth work narrows to the original diagnosis: **the passcode-gate ⟷ Supabase-auth reconciliation.** The harness confirms the mechanism — *every* workspace policy needs `auth.uid()`; a passcode-cleared user with no Supabase session → `auth.uid()` null → all policies deny → **silent save failure** (the trial-#1 symptom). The fix: a saving user must have a Supabase session (gate save behind it; "sign in to save").
- **Real #17 work:** (1) auth reconciliation [the unblock]; (2) version-control the live schema → migration [Finding 2]; (3) wire hydrate-on-mount + mirror-on-save on `workspace_id`; (4) keep this RLS harness in CI (reproducible once Finding 2 lands).
- **Decision B (version-state)** unchanged — status-triggered freeze; August = snapshots + RA-packet version-stamp + freeze-hook.

**Bottom line:** the session didn't just frame #17 — it caught a wrong-model assumption before it shipped, discarded it, and *proved* the real model's isolation. The most dangerous code in the product (cross-tenant RLS) now has a passing adversarial net.
