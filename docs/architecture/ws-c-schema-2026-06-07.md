# WS-C Schema — Multi-Tenant from Line One + Bounded Flywheel

**Status:** ✅ **LOCKED 2026-06-07** (Opus architecture pass + CC ground-truth + operator-mediated convergence). Ready to build.
**Supersedes:** the prior "minimal `workspaces` + `workspace_members` + owner-or-member RLS" sketch (Decision 1.X).
**Lock criteria met (all 7):** F1 enum+CHECK+ALTER mechanism · F2 flywheel fields · F5 tests 8–12 · F7 INSERT-only + kind tagging + BPR-is-legal · F9 immutable-history + `formula_root_id` · F6 RLS harness scoped as prerequisite · migration expanded to all three `owner_id` tables.

---

## Why this memo exists

WS-C is the committed August deliverable (multi-user). The strategy pass established one thing the forward vision changes about August: **the tenancy/roles schema must be multi-tenant-aware and admit external role-types from line one** — sets the ceiling for the connecting-fabric theme *and* white-label (multi-tenant confidentiality × N). Right now → config later. Wrong (`owner | member` hardcoded) → migrations, and white-label becomes a re-architecture.

**Scoped to the SCHEMA, not the features.** August does NOT build CM/QC/RA/retailer/consumer access; the schema *admits* them. Same for the flywheel: tables exist, free-byproduct writes happen, nothing reads them in August.

---

## Migration scope — THREE existing tables, not one (CC ground-truth 2026-06-07)

Current `supabase/schema.sql` is single-user throughout: **`formulations`, `supplier_qualifications`, and `profiles`** are each `owner_id = auth.uid()` scoped with their own RLS. The `owner_id → org_id + membership` migration, the RLS rewrite, and the 12 negative tests apply to **every tenant-scoped table** — not just `formulations`. `profiles` is per-user identity (stays user-linked) but its *org membership* is the new join; `formulations` and `supplier_qualifications` become **tenant-owned**.

Migration at cutover: each existing row → an org is created for its `owner_id`; the owner gets an `owner` membership; the row's `org_id` is backfilled; `owner_id` retained as `created_by`. Formulations become **draft v1.x, `formula_root_id = self`, `previous_version_id = NULL`.**

---

## Tenancy model

```
organizations            -- the tenant (first-class owner of all data)
  id              uuid pk default gen_random_uuid()
  name            text
  created_at      timestamptz
  parent_org_id   uuid null references organizations(id)  -- white-label hook, reserved/unused in August

memberships              -- user <-> tenant, with role
  id              uuid pk
  org_id          uuid references organizations(id)
  user_id         uuid references auth.users(id)
  role            role_type not null
                  CHECK (role IN ('owner','member'))   -- F1: see mechanism below
  invited_by      uuid null
  status          membership_status        -- invited | active | revoked
  created_at      timestamptz
  unique(org_id, user_id)

formulations             -- TENANT-owned + immutable-history (F9)
  id                 uuid pk default gen_random_uuid()
  org_id             uuid references organizations(id)        -- tenancy anchor
  created_by         uuid references auth.users(id)
  formula_root_id    uuid not null                            -- F9: stable identity across versions
  previous_version_id uuid null references formulations(id)   -- F9: history chain
  version            text                                     -- label (e.g. 1.0.0)
  locked             bool default false                       -- F9: lock => immutable snapshot
  ... existing formulation payload columns ...

supplier_qualifications  -- ALSO tenant-scoped (was owner_id) — same org_id + RLS treatment
profiles                 -- per-user; org membership via `memberships`
```

### F1 — reserved roles: enum admits all, CHECK restricts, ALTER widens
The `role_type` **enum reserves every value** (schema admits the future); a **column-level `CHECK (role IN ('owner','member'))`** prevents any reserved-role row from existing in August; when an external role ships, a migration **`ALTER`s the CHECK** to add it — that ALTER is the explicit, code-reviewed third move. Immutable-correct (no flag-reading trigger).

```
role_type enum (all reserved):
  owner, member,                                  -- August-live (CHECK-allowed)
  cm_producer, qc_lab, ra_reviewer,               -- reserved, CHECK-blocked
  retailer_viewer, consumer_viewer                -- reserved, CHECK-blocked
```

Three layers of defense for "schema admits, code doesn't": **(1)** CHECK prevents the row existing · **(2)** no RLS policy references reserved roles (a dormant row sees nothing) · **(3)** negative tests 4/5 are CI tripwires if a policy is added without acknowledgement.

---

## RLS — the load-bearing confidentiality (the company-ending surface)

Core rule on every tenant-scoped table:
```sql
USING (
  org_id IN (SELECT org_id FROM memberships
             WHERE user_id = auth.uid() AND status = 'active')
)
```
Baked in now: IDs are `gen_random_uuid()` (never enumerable); every tenant-scoped table carries `org_id` and is RLS-gated on membership (no join through an unprotected table); reserved roles get no RLS grant; `parent_org_id` grants no cross-org visibility until a deliberate, separately-tested white-label policy lands.

### Adversarial negative tests — all 12 must return zero rows / denied, on EACH tenant-scoped table:
1. User A (org X) reads `formulations` → only org X, never org Y.
2. User A revoked (`status='revoked'`) → zero access immediately.
3. Direct ID fetch of a known org-Y UUID → denied (not just list-filtered).
4. `cm_producer`/`ra_reviewer` membership before its policy exists → sees nothing.
5. `parent_org_id`→CM org → CM sees nothing of the child until white-label policy lands.
6. API-response leak audit: no cross-tenant `org_id`s / emails / metadata in any response.
7. ID-enumeration sweep: no sequential/guessable identifier on any tenant row.
8. **Insertion leak:** User A cannot INSERT a row with `org_id = Y` (INSERT policy verifies membership in target org).
9. **Update leak:** User A cannot UPDATE a row to change its `org_id` to Y — **`org_id` is non-updatable** (trigger/rule rejects org_id change entirely).
10. **Delete leak:** User A cannot DELETE a row in org Y.
11. **Aggregation/EXISTS attack:** User A cannot get a COUNT/EXISTS of org Y's rows.
12. **`fw_events` leak:** event payloads (e.g. `gate_hit` reasons naming ingredients) are tenant-gated identically.

**Gate:** no cross-company sharing in prod until 1–12 pass as automated tests.

### F6 — RLS TEST HARNESS IS NET-NEW WS-C SCOPE (CC ground-truth)
There is **no** RLS/pgTAP/pg_prove harness today — all tests are vitest (app-level), which **cannot** exercise Postgres RLS. The confidentiality gate has **no test substrate**. Building one — **pgTAP, or an integration harness against a real Supabase branch** (whatever's portable + reproducible in CI) — is a **load-bearing prerequisite inside WS-C**, not reuse. The gate cannot turn green without it. This is scope, costed.

---

## Bounded flywheel — capture substrate ONLY

- **IN:** the table below + writes that are free byproducts of actions WS-C already performs.
- **OUT for August, no exceptions:** any capture pipeline, analytics, dashboards, aggregation, consumption. A code-level `fw_consumption_unlocked` guard makes accidental reads impossible (F4). Payloads get TS types + runtime validators per `kind` (F3) even though the table doesn't enforce them.

```
fw_events                -- append-only, tenant-scoped, WRITE-ONLY in August
  id              uuid pk
  org_id          uuid references organizations(id)   -- tenancy
  user_id         uuid references auth.users(id)      -- F2: WHO acted (was missing)
  formula_id      uuid null
  formula_version text null                            -- F2: formula version at event time
  engine_version  text null                            -- F2: deterministic-engine version
  kind            fw_event_kind
  payload         jsonb
  created_at      timestamptz
  -- F7: INSERT-only. A trigger BLOCKS UPDATE and DELETE on this table.
```

`fw_event_kind` (6 kinds), tagged audit-grade vs ML-only (F7/F8):
| kind | purpose | class |
|---|---|---|
| `estimate_pair` | rendered honest-estimate (predicted+confidence+range) | ML-only |
| `override` | operator changed a suggested/default value | ML-only |
| `provenance_fill` | operator/PA supplied a spec/COA value over an estimate | ML-only |
| `gate_hit` | harm-critical refusal/flag fired (UL/NDI/claim/allergen/blend-floor) — the **refusal-exhaust** | **audit-grade** |
| `attestation` | operator "I attest this is correct" before export (WS-B); payload: formula_version, attestation text/checksum, role acted under, target export | **audit-grade** |

### F7 — fw_events is NOT the legal audit trail
The cGMP (21 CFR 111) legal record is the **Batch Sheet / BPR** (existing feature) plus signed attestations — with retention, signature, and completeness requirements a JSONB event table does not meet. `fw_events` provides **supporting context**; the BPR is the legal audit trail. INSERT-only enforcement + the two audit-grade tags make the safety-relevant subset identifiable, but "we have `fw_events`" ≠ "cGMP audit satisfied." **Override audit-relevance** (a safety-critical override vs a routine one) is handled at the **BPR level**, not by sub-classifying `override` — keeps `fw_events` lean. If a regulator asks "did you override the UL calc?", the answer comes from the BPR + the immutable-locked formulation rows, not a `fw_events` query.

---

## F9 — version-lock mechanics: immutable-history-on-lock

Drafts stay mutable (one row, `locked=false`). **On lock, snapshot to an immutable row** (`locked=true`, `previous_version_id` → the prior locked version) — that row is the audit artifact, never mutated. All versions of a formula share a **`formula_root_id`** (set at creation, never changes; first version = self). "Current version of formula X" = the latest row within `formula_root_id` for `org_id = X` — stable identity, no chain-walking. The accumulating `locked=true` rows are the formulation-history audit trail (pairs with F7).

---

## August scope line

| In August | Not in August (schema admits, code doesn't) |
|---|---|
| `organizations`, `memberships` (CHECK owner/member), tenant-owned `formulations` + `supplier_qualifications` | external role visibility (CM/QC/RA/retailer/consumer) |
| `owner`/`member` RLS across all tenant tables | white-label cross-org (`parent_org_id` policies) |
| Confidentiality hardening + negative tests 1–12 + **RLS harness** | flywheel consumption / analytics (guarded by `fw_consumption_unlocked`) |
| Invite flow (owner invites member) | marketplace, transparency pages, copilot |
| Immutable-history-on-lock (`formula_root_id`, `previous_version_id`) | per-user private drafts (additive `visibility` enum later) |
| `fw_events` table (6 kinds) + free-byproduct writes, INSERT-only | any feature that *reads* `fw_events` |

## Build order
RLS harness scaffold → tenant-owned persistence (3 tables migrated) → auth identity (done, WS-A) → ⛔ confidentiality + negative tests 1–12 green → roles/visibility (owner/member only) → invite UI → immutable-history version-lock. `fw_events` + writes land alongside persistence (free).

## Resolved questions (Opus pass)
1. **`organizations` vs `workspaces`:** keep `organizations` in the DB (standard); "Workspace" in user copy for the solo case, "Organization" once a 2nd member joins. UX terminology only.
2. **Per-user private drafts:** all-org-visible for August; `created_by` is present, so a `visibility` enum is an additive migration later. Don't build now.
3. **Single `fw_events` table w/ discriminator:** yes — cheaper writes, flexible JSONB, no consumer yet.

Related: [[path-to-august-scoped-launch-2026-06-01]], [[platform-vs-infrastructure-fork-2026-06-07]], [[base-sheet-batch-sheet-architecture-2026-05-23]] (BPR = legal audit), [[honest-estimate-reframe]].
