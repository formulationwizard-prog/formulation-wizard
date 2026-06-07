# WS-C Schema — Multi-Tenant from Line One + Bounded Flywheel

**Status:** PROPOSED — pending Opus architecture pass + operator lock before any prod migration.
**Date:** 2026-06-07. **Supersedes:** the prior "minimal `workspaces` + `workspace_members` + owner-or-member RLS" sketch (Decision 1.X), which left role-type implicit.
**Authored:** CC, out of the 2026-06-07 strategy pass (CC↔Opus, operator-mediated).

---

## Why this memo exists

WS-C is the committed August deliverable (multi-user). The strategy pass established one — and only one — thing the forward vision changes about August: **the tenancy/roles schema must be multi-tenant-aware and admit external role-types from line one**, because that decision silently sets the architectural ceiling for the connecting-fabric theme *and* for white-label distribution (multi-tenant confidentiality × N). Get it right now → those become config later. Get it wrong (`owner | member` hardcoded) → both become migrations, and white-label becomes a re-architecture.

**This memo is scoped to the SCHEMA, not the features.** August does NOT build CM / QC-lab / retailer / consumer access. The schema merely *admits* them so we never re-architect. Same discipline for the flywheel (below): the tables exist and free-byproduct writes happen; nothing reads them in August.

---

## Tenancy model

Three concepts, explicit:

- **Tenant** — the org (brand owner's workspace). First-class. Owns formulations, not the individual user.
- **Membership** — a user's relationship to a tenant, carrying a **role-type**.
- **Role-type** — an enum, with August roles live and external roles *reserved but not wired*.

```
organizations            -- the tenant (first-class owner of all data)
  id              uuid pk default gen_random_uuid()
  name            text
  created_at      timestamptz
  -- white-label hook (reserved, unused in August): the CM/RA firm whose
  -- branded instance this org lives under. NULL = direct customer.
  parent_org_id   uuid null references organizations(id)

memberships              -- user <-> tenant, with role
  id              uuid pk
  org_id          uuid references organizations(id)
  user_id         uuid references auth.users(id)
  role            role_type not null         -- enum below
  invited_by      uuid null
  status          membership_status          -- invited | active | revoked
  created_at      timestamptz
  unique(org_id, user_id)

formulations             -- OWNED BY THE TENANT, not the user (the key change)
  id              uuid pk default gen_random_uuid()
  org_id          uuid references organizations(id)   -- tenancy anchor
  created_by      uuid references auth.users(id)
  ... existing formulation columns ...
  version         int
  locked          bool default false          -- version-lock (WS-C step 5)
```

**`role_type` enum — August-live vs reserved:**

```
role_type:
  owner        -- August: full control of the org
  member       -- August: edit formulations in the org
  -- ↓ RESERVED. Enum value exists so adding the seat later is config, not
  --   a migration. NO code path grants or honors these in August.
  cm_producer      -- contract manufacturer (read formula + log batch)
  qc_lab           -- logs test results
  ra_reviewer      -- regulatory reviewer (comment / sign-off)
  retailer_viewer  -- transparency page (read-only subset)
  consumer_viewer  -- QR provenance (read-only public subset)
```

Reserving the enum values is the cheap, high-option-value move. The *visibility rules* for each (what a `cm_producer` may see vs an `ra_reviewer`) are deliberately NOT designed here — that's the connecting-fabric workstream, post-MVP. We only commit that the schema can carry them.

---

## RLS — the load-bearing confidentiality (this is the company-ending surface)

Today airtight by accident of no sharing (`auth.uid() = owner_id`). WS-C broadens to "owner OR member of the tenant," and **that broadening is exactly where a cross-company leak is born.** Confidentiality must be designed into the schema, proven with negative tests, and gated before any two real companies share.

Core rule on every tenant-scoped table:

```sql
-- read/write gated by ACTIVE membership in the owning org
USING (
  org_id IN (
    SELECT org_id FROM memberships
    WHERE user_id = auth.uid() AND status = 'active'
  )
)
```

Non-negotiables baked in now:
- **IDs are `gen_random_uuid()`** — never enumerable/sequential.
- **Every tenant-scoped table carries `org_id`** and is RLS-gated on membership — no table relies on a join through an unprotected table.
- **Reserved external roles get NO RLS grant in August.** A `cm_producer` row could exist and still see nothing, because no policy references it yet. Adding the policy later is the controlled act that turns the seat on.
- **`parent_org_id` (white-label) gets NO cross-org visibility in August.** A parent CM org cannot see child orgs' data until a deliberate, separately-tested policy is written. White-label confidentiality is its own hardening milestone, not a free consequence of the column existing.

### Adversarial test scenarios (must pass before any sharing ships)
These are negative tests — each must return **zero rows / denied**:

1. User A (org X) queries `formulations` → sees only org X. Never org Y.
2. User A, removed from org X (`status='revoked'`), retains zero access immediately.
3. Direct ID fetch of a known org-Y formulation UUID by user A → denied (not just filtered from lists).
4. A `cm_producer`/`ra_reviewer` membership row, before its policy is written → sees nothing.
5. `parent_org_id` set to a CM org → that CM sees nothing of the child until the white-label policy lands.
6. API-response leak audit: no endpoint returns `org_id`s, member emails, or formulation metadata across tenant boundaries.
7. ID-enumeration sweep: no sequential/guessable identifier anywhere on a tenant-scoped row.

**Gate:** no cross-company sharing is enabled in prod until 1–7 pass as automated tests in CI. This is the milestone that ends the company if wrong (per [[path-to-august-scoped-launch-2026-06-01]]).

---

## Bounded flywheel — capture substrate ONLY

"Instrument now, generate later." If we don't capture now, the learning theme has nothing to learn from in two years. **Strictly bounded** so it cannot eat the WS-C critical path:

- **IN:** the tables below + writes that are *free byproducts of actions WS-C already performs.*
- **OUT for August, no exceptions:** any capture pipeline, analytics, dashboards, aggregation, or consumption. Nothing reads these tables in August.

```
fw_events                -- append-only, tenant-scoped, write-only in August
  id          uuid pk
  org_id      uuid references organizations(id)   -- tenancy carries here too
  formula_id  uuid null
  kind        fw_event_kind     -- estimate_pair | override | gate_hit | provenance_fill
  payload     jsonb             -- shape per kind (below)
  created_at  timestamptz
```

`fw_event_kind` payloads (all are byproducts of existing actions — ~zero added cost):
- **`estimate_pair`** — a rendered honest-estimate (predicted value + confidence + range) at the moment it's shown. The future predicted-vs-*measured* training stream (the measured half arrives later when operators log real results). Ties to the [[acidified-foods-ph-predictor-roadmap]] predicted/measured doctrine.
- **`override`** — operator changed a suggested/default value (sub-ingredient statement, fill weight, etc.). Where the engine's defaults disagree with reality.
- **`gate_hit`** — a harm-critical refusal or flag fired (UL exceedance, NDI unknown, claim blocked, allergen, blend-floor). **This is the refusal-exhaust** — the most defensible flywheel stream, free, and one no competitor has because no competitor refuses.
- **`provenance_fill`** — operator/PA supplied a spec-sheet/COA value where the catalog had an estimate.

RLS on `fw_events`: same tenant-membership gate (the org owns its own exhaust). Cross-tenant aggregation — the thing that makes refusal-exhaust an *industry map* — is a post-MVP consumption workstream with its own privacy/anonymization design. Not August.

---

## August scope line (explicit)

| In August | Not in August (schema admits, code doesn't) |
|---|---|
| `organizations`, `memberships`, tenant-owned `formulations` | external role visibility (CM/QC/RA/retailer/consumer) |
| `owner`/`member` roles + RLS | white-label cross-org (`parent_org_id` policies) |
| Confidentiality hardening + negative tests 1–7 | flywheel consumption / analytics / dashboards |
| Invite flow (owner invites member) | marketplace, transparency pages, copilot |
| Version-lock (`locked`) | any feature that *reads* `fw_events` |
| `fw_events` table + free-byproduct writes | — |

## Build order (dependency-aware, unchanged from path-to-August)
persistence (tenant-owned) → auth identity (done, WS-A) → **⛔ confidentiality + RLS negative tests** → roles/visibility (owner/member only) → invite UI → version-lock. `fw_events` table + writes land alongside persistence (free).

## Open for the Opus pass
1. `organizations` vs `workspaces` naming — does "org" over-imply company structure for a solo founder? (A solo founder is an org of one — fine, but confirm the UX framing.)
2. Should `formulations.created_by` retain any per-user visibility *within* an org (private drafts), or is all-org-visible the August model? (Leaning all-org-visible for simplicity; flag if roles need per-user privacy.)
3. Confirm `fw_events` as one append-only table with a `kind` discriminator vs four typed tables (leaning one table — cheaper to write, JSONB payloads, no consumer yet to need typed columns).

Related: [[path-to-august-scoped-launch-2026-06-01]], [[platform-vs-infrastructure-fork-2026-06-07]], [[honest-estimate-reframe]], [[supabase-invite-only-three-gate-auth-2026-05-29]].
