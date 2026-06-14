# #17 Architecture Session — Inputs Packet (consolidated 2026-06-13)

**Purpose:** one entry-point for the #17 architecture session. Consolidates the two `wave-17-*` briefs + the opt-in/anonymization requirements surfaced in `docs/strategy/ai-reasoning-data-moat-analysis-2026-06-13.md`. **This is consolidation, not new decisions** — every architectural call stays open for the session. Where two source docs disagreed, the newer (RLS-verified) finding is marked as superseding so the session doesn't re-litigate a settled point.

**Source docs (read in full if a section needs depth):**
- `docs/architecture/wave-17-save-backend-brief-2026-06-08.md` — the original framing (build state, diagnosis, Decisions A–E).
- `docs/architecture/wave-17-rls-verification-findings-2026-06-08.md` — RLS-first verification; **supersedes the brief's Decision A** (workspace model already built + verified).
- `supabase/tests/rls_isolation_test.sql` — the adversarial isolation harness (passes against live policies).
- `docs/strategy/ai-reasoning-data-moat-analysis-2026-06-13.md` §3–§4 — the opt-in/anonymization foundation requirements.

---

## 1. State of the build (reconciled)
More is DONE than "parked" suggested. The engine of #17 is built; the session's work is **reconciliations + one ops step**, not a from-scratch backend.

| Piece | State |
|---|---|
| **Live schema (workspace model)** | ✅ **Already built + RLS-verified.** `workspaces` + `workspace_members` (role_kind, role, status, invited_by), `is_internal_member()` (SECURITY DEFINER, pinned search_path), `handle_new_user_workspace` (auto-creates workspace on signup). `formulations.workspace_id` is the team-ownership key; policies are owner-OR-internal-member. **This is "WS-C", already shipped** — the orgs/memberships migration the original brief floated is **moot/discarded.** |
| **Isolation proof** | ✅ `rls_isolation_test.sql` run against live policies: member of A cannot read/author-into/update/see B; anon reads nothing. **The trust floor is proven, not just designed.** |
| **I/O layer** (`lib/cloudSync.ts`) | ✅ Pure mappers (toRow/fromRow, unit-tested) + push/pull/delete. |
| **Clients + proxy** | ✅ browser/server/proxy-session; proxy does Supabase session refresh + passcode gate + rate-limiter. |
| **`profiles.subscription_tier`** | ✅ free/starter/pro/enterprise — the **floor/ceiling home** and the **opt-in/tier hook** (see §4). |
| **Workspace wiring** (`page.tsx`) | ⚠️ PARTIAL — push/delete are called, but **hydrate-on-mount + mirror-on-save are unwired** ("a separate step" per cloudSync docblock). |
| **`supabase/schema.sql`** | 🔴 **STALE** — has only `owner_id`, not the workspace model. The canonical schema lives only in the live instance + local Docker volume; **not version-controlled, no migration history.** |

---

## 2. Diagnosis — why "saves reliably" can't be claimed yet
1. **🔴 THE CORE BLOCKER — two auth systems, unreconciled.** Passcode org-gate (`fw_access` HMAC cookie) ≠ Supabase per-user auth (`auth.uid()`, what RLS keys on). A user past the passcode with **no Supabase session** → `auth.uid()` null → every RLS policy denies → **silent save failure.** This is the trial-#1 "save isn't working" symptom. The RLS harness *confirms the mechanism*: every workspace policy needs `auth.uid()`.
2. **Schema not version-controlled** (the workspace model exists in the instance but not in the repo) → can't reproduce the DB from the repo; can't CI the RLS harness.
3. **Hydrate-on-mount unwired** → push-without-pull → saves persist but don't reload → *looks* lost even when stored.
4. **Version-state semantics** (Decision B) need defining.

---

## 3. The architectural calls for the session (open — to decide, not improvise)
- **A. Auth reconciliation [the unblock — narrowed].** Decision A is *largely settled by the existing verified workspace model* — the team/org model is built, so this is **no longer "what topology"** but the original narrow diagnosis: **make `auth.uid()` reliably present for a saving user.** Recommended framing from the findings: **a saving user must have a Supabase session ("sign in to save")** — gate save behind it. *(Confirm in-session; it's the unblock.)*
- **B. Version-state semantics.** Decision B settled this session: **status-triggered freeze; August = snapshots + RA-packet version-stamp + freeze-hook; full lock at the manufacturing transition.** Open: snapshot-in-`data` vs a `formulation_versions` table; who can move status transitions (ties to the RA sign-off chain).
- **C. Schema version-control [Finding 2 — ops/architecture].** Dump the live workspace schema → a versioned migration so it's source-controlled and the RLS harness runs in CI. *(Routed: how to manage the canonical schema is an architecture/ops call, not a unilateral dump.)*
- **D. Catalog-tiering.** Stop client-bundling the full provenance catalog (scrapeable today per the data-flow audit); server-fetch behind auth. Options: (a) authenticated search endpoint (client gets only what it queries); (b) tier the data (public skeleton names client-side; provenance/citations server-only); (c) names-public, protect provenance layer.
- **E. Floor/ceiling security integration.** RLS isolation = floor (✅ universal). Ceiling (BYOK, audit-log visibility, SSO, attestations, SOC2) maps to `subscription_tier` — decide which controls gate at which tier.
- **F. Opt-in contribution + anonymization foundation [NEW — from the 2026-06-13 analysis; FOUNDATION, not feature].** Decided posture: the schema *supports* this even though **no contribution stream is populated for August.** Session must cover:
  - schema for **granular** opt-in flags — *per-formula, per-data-type, per-aggregation-purpose*, **not blanket opt-in**;
  - **anonymization pipeline architecture** — where anonymization happens in the flow; what is stored vs derived; k-anonymity / aggregate-granularity thresholds so formula reconstruction is infeasible;
  - **trust commitment enforced architecturally, not just contractually** — floor ("your formula stays yours," universal) vs ceiling (opt-in to contribute anonymized patterns for discount / revenue-share / insights-back);
  - **harness coverage** for "opted-out data never leaves operator scope" — RLS-style isolation extended to the contribution stream;
  - **🛡️ defense-in-depth flag:** consider **physical** separation (separate schema or separate Postgres role) so an RLS bug in the main schema cannot leak into the aggregation stream — threat-model the two as distinct.
- **G. Data-handling position paper** → the floor/ceiling language (incl. the named opt-in contribution stream) becomes the requirements doc; ToS/Privacy rewrite → counsel.

---

## 4. Implementation sequence (post-decision — CC-driveable, no re-routing per step)
1. **Version-control the live schema** → migration (Decision C); verify RLS via the harness in CI.
2. **Reconcile auth** (Decision A) — make `auth.uid()` reliably present for a saving user ("sign in to save").
3. **Wire hydrate-on-mount** (`pullFormulations`) + **mirror-on-save** on `workspace_id`; localStorage stays the optimistic cache.
4. **Version-state** per Decision B (snapshots + RA-packet version-stamp + freeze-hook for August).
5. **Opt-in/anonymization schema scaffolding** per Decision F — *foundation only*, no stream populated.
6. **End-to-end test the round-trip** (signup → save → reload-from-cloud → delete) + extend the cloudSync harness beyond the unit-tested mappers. Only then is "saves reliably" claimable (cloudSync's own docblock bar).

---

## 5. Posture lock (from the 2026-06-13 routing)
**WORKFLOW FIRST.** August scope holds: **#17 save + #18 RA-packet + #16 sector-scoping + §8 sweep.** August AI = explanation-only (the *explanation ≠ suggestion* doctrine; reformulation is Phase 2). The data-flywheel architecture goes in as **foundation** (Decision F), not feature. The boundary-exhaust asset is documented as latent (sequences the Platform→Infrastructure play) but **not pursued for monetization until Platform has operators generating it** — fork-doc finalization remains Wizard's call.

**Bottom line:** the most dangerous code (cross-tenant RLS) already has a passing adversarial net. The session's real work is **auth reconciliation (the unblock) + schema version-control + hydrate/mirror wiring + the opt-in/anonymization foundation** — narrower than "build the save backend," and every harm-critical isolation claim is verified, not designed.
