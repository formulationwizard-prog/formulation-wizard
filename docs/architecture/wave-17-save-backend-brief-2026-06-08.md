# #17 Save Backend — Architecture-Session Brief (framed by CC, 2026-06-08)

**Status:** the last hard August launch-blocker (trial-user lost-formulas signal). Routed — backend topology + auth + version-state are architectural calls. This brief is the input so the session decides, not improvises.

---

## 1. State of the build — more is DONE than "parked" suggests
| Piece | State |
|---|---|
| **Schema** (`supabase/schema.sql`) | ✅ Designed. `formulations` (owner_id, JSONB `data`, denormalized filter cols, status CHECK), `profiles` (with **`subscription_tier` free/starter/pro/enterprise** — the floor/ceiling home), `supplier_qualifications`. **RLS enabled on all 3, owner_id = auth.uid() policies for select/insert/update/delete.** The trust floor is *designed in.* |
| **I/O layer** (`lib/cloudSync.ts`) | ✅ Pure mappers (toRow/fromRow, unit-tested) + `pushFormulation` (upsert), `pullFormulations` (RLS+owner_id), `deleteCloudFormulation`. Isolated, mockable. |
| **Clients** (`lib/supabase/*`) | ✅ browser / server / proxy-session (`updateSession`). |
| **Proxy** (`proxy.ts`) | ✅ Supabase session refresh + passcode org-gate (+ now the rate-limiter). |
| **Workspace wiring** (`page.tsx`) | ⚠️ PARTIAL — calls `pushFormulation`/`deleteCloudFormulation` on save/delete, but hydrate-on-mount + mirror-on-save are flagged "a separate step" in cloudSync's own docblock. |

So this is **not greenfield** — it's wiring + 2 architectural reconciliations + an ops step.

## 2. Diagnosis — why "saves reliably" can't be claimed yet
1. **🔴 THE LIKELY CORE BLOCKER — two auth systems, possibly unreconciled.** The app has (a) the **passcode org-gate** (`fw_access` HMAC cookie, the preview shield) and (b) **Supabase per-user auth** (`auth.uid()`, what RLS keys on). If a user clears the passcode but has **no Supabase session**, `auth.uid()` is null → every RLS-protected write is rejected → **save silently fails.** This is almost certainly the "save isn't working" symptom. *Needs verification in the session, but it's the first thing to check.*
2. **Migration not applied.** `schema.sql` is a "run this in the Supabase SQL editor" script. Per the WS-C note, the migration on the 3 owner_id tables is **pending** — if the tables aren't in the live instance, writes fail regardless of auth.
3. **Hydrate-on-mount not wired.** `pullFormulations` exists but the workspace may push-without-pull → saves persist but don't reload → *looks* lost even when stored.
4. **Version-state machinery parked (Phase 5).** `current_version` + the status state-machine (draft→in-pilot→launched→on-hold) + version history in `data` need semantics.

## 3. Decisions for the session (the architectural calls)
- **A. Auth topology (the central one):** how does org-level access (passcode / invite / **membership**) relate to per-user Supabase identity? Options: (i) passcode-clear *also* establishes a Supabase session; (ii) passcode is org-gate, Supabase login is a *separate required* step; (iii) introduce a `memberships`/`orgs` table so a formula is owned by a user *within* an org (needed if teams share formulas). **This decides the owner_id semantics + whether the schema needs an orgs/memberships table (it currently has neither).**
- **B. Version-state semantics:** snapshot-in-`data` (current) vs a `formulation_versions` table; the status state-machine transitions + who can move them (ties to the RA sign-off chain).
- **C. Floor/ceiling security integration:** RLS isolation = the **floor** (✅ in schema, universal). The **ceiling** (BYOK, audit-log visibility, SSO, attestations) maps to `subscription_tier` — decide which controls gate at which tier.
- **D. Catalog-tiering** (security audit §C.1) — stop client-bundling the full provenance catalog; server-fetch behind auth. Same backend session.
- **E. Data-handling commitments** → the position paper (floor language incl. **future-data-uses opt-in**, the flywheel scoping) becomes the requirements doc; ToS/Privacy rewrite → counsel.

## 4. Implementation sequence (post-decision — CC-driveable)
1. Apply the schema migration to the live instance (ops; verify RLS with the `pg_tables` check at schema.sql foot).
2. Reconcile auth per Decision A (the unblock — make `auth.uid()` reliably present for a saving user).
3. Wire hydrate-on-mount (`pullFormulations`) + mirror-on-save; localStorage stays the optimistic cache.
4. Version-state per Decision B.
5. **End-to-end test the round-trip** (signup → save → reload-from-cloud → delete) + a harness for the cloudSync mappers (toRow/fromRow already unit-tested; add the round-trip). Only then can "saves reliably" be claimed (cloudSync's own docblock bar).

## 5. Pre-work (operator's session prep)
- WS-C migration on the 3 owner_id tables — apply (or confirm applied).
- Version-state reactivation (un-park Phase 5).
- Decide team/org model up front (Decision A) — it's the schema-shaping call everything else hangs on.

**Bottom line:** the engine of #17 is built; the session's real work is **two reconciliations (auth topology + version-state) + one ops step (migration)**, not a from-scratch backend. The trust floor (RLS) is already in the schema — which means "your formulas stay yours" is *architecturally drafted*, pending the auth wiring that makes `auth.uid()` real.
