# Schema-Laying Directive — #17 13-Entity Spine

**Status:** ✅ Reviewed + approved (operator + Opus, 2026-06-16) — 3 critical catches + minors incorporated; Q2/Q3/Q4 resolved. This is the spec `supabase/migrations/0003_lifecycle_spine.sql` is built to match. **Prod-apply still gated** (§6: backup + RLS-harness pass + operator go).
**Source of truth:** [project_lifecycle_spine_locked] (memory) + [wave-17 packet](wave-17-session-inputs-packet-2026-06-13.md) + [master-specs-data-model](master-specs-data-model-2026-05-27.md) + [inventory-event-model](inventory-event-model-2026-06-16.md).
**Conventions verified against:** `0001_baseline.sql`, `0002_workspace_tenancy.sql` (verbatim patterns, not memory).
**Gate:** the migration-test gate (#17 Decision D) — **identity + FK + tenancy + sector now; internals deferred.** *"Does deferring it force a later identity/FK migration, or just an additive column/table?"* Identity/linkage → in. Quantity/lab-result/recall-report column shapes → additive later.

> **⚠️ §4 is the review heart.** It names every architectural decision this schema makes *via field names, FK directions, or RLS scopes* — the `product_id`-riding-in-syntax class. Read §4 before approving §3.

---

## §1 — Conventions (match `0001`/`0002` exactly)

Every spine table follows the **`formulations` shape**:

- **PK:** `id uuid default gen_random_uuid() not null`.
- **Dual tenancy key (load-bearing — see §4.1):** `owner_id uuid not null` (FK → `auth.users(id)` on delete cascade) **and** `workspace_id uuid` (FK → `public.workspaces(id)` on delete cascade). Both, on every node — because `0002`'s RLS is `auth.uid() = owner_id OR public.is_internal_member(workspace_id)`.
- **Sector (see §4.2):** `sector text not null` with a CHECK matching the `formulations.mode` enum (`'fb'|'baking'|'catering'|'feeds'|'sausage'|'supplements'`), indexed for query-scoping.
- **Timestamps:** `created_at`/`updated_at timestamptz default now() not null` + a `touch_updated_at()` BEFORE-UPDATE trigger (append-only tables get `created_at` only).
- **RLS (standard pattern, verbatim from `0002`):**
  - SELECT: `using (auth.uid() = owner_id or public.is_internal_member(workspace_id))`
  - INSERT: `with check (auth.uid() = owner_id and (workspace_id is null or public.is_internal_member(workspace_id)))`
  - UPDATE: `using (auth.uid() = owner_id or public.is_internal_member(workspace_id))`
  - DELETE: `using (auth.uid() = owner_id or exists(select 1 from workspaces w where w.id = <table>.workspace_id and w.owner_id = auth.uid()))`
- **Idempotency:** `create table if not exists`; constraints in `do $$ begin … exception when duplicate_object then null; end $$;`; `add column if not exists`. (A re-run / partial-failure retry is safe — same as `0002`.)
- **Indexes:** `idx_<table>_workspace` on `workspace_id`; FK columns indexed; `(workspace_id, sector)` where the table is sector-query-scoped.
- **Migration file:** `supabase/migrations/0003_lifecycle_spine.sql`, wrapped `begin; … commit;`.

---

## §2 — Creation order (parents before children)

Existing (`0001`/`0002`): `auth.users` · `workspaces` · `workspace_members` · `formulations` · `profiles` · `supplier_qualifications`.

New, in FK-dependency order:
1. **`formulation_versions`** *(substrate — see §4.3)*
2. **`spec_metrics`** *(substrate — metric catalog; see §4.4)*
3. **`suppliers`** *(Supplier entity)*
4. **`materials`** *(Material entity)*
5. **`target_specs`** *(TargetSpec)*
6. **`master_specs`** *(MasterSpec)*
7. **`master_spec_revisions`** *(substrate — per-version carry-forward decisions; see §4.11)*
8. **`master_spec_observations`** *(the observation log as a table — see §4.5)*
9. **`packaging_specs`** *(PackagingSpec)*
10. **`bench_top_runs`** *(BenchTopRun)*
11. **`lots`** *(Lot — material AND finished-goods lots; §4.10)*
12. **`batches`** *(Batch)*
13. **`coas`** *(COA)*
14. **`lot_events`** *(LotEvent — append-only)*
15. **`inventory`** *(Inventory — identity only)*

That's the **13 spine entities** (Formulation already exists; **Customer Lot collapses into `lots`** per §4.10 — no separate table) + **4 substrate tables** (`formulation_versions`, `spec_metrics`, `master_spec_revisions`, `master_spec_observations`) that the spine's Version-level + carry-forward + observation-stream requirements force into existence (§4.3, §4.4, §4.11, §4.5).

---

## §3 — Per-entity specs (minimum-viable columns + FK directions)

All carry the §1 standard columns (`id`, `owner_id`, `workspace_id`, `sector`, timestamps, standard RLS) unless noted. Listed here: the **identifying + linkage** columns only; deeper internals are §5.

| Entity | Key columns / links (min-viable) | FK directions |
|---|---|---|
| `formulation_versions` | `formulation_id`, `version text`, `status`, `snapshot jsonb`. **Ordering is by `created_at`, NOT by parsing `version`** (§4.12) | → `formulations(id)` |
| `spec_metrics` | `name`, `unit`, `data_type`, `distribution_type`, `bound_direction`, `source ('predefined'\|'custom')` | (per-workspace seeded, §4.4) |
| `suppliers` | `name`, `notes` | (workspace-scoped) |
| `materials` | `name`, `supplier_id?` (default supplier), `catalog_ref text?` — **plain text, NOT an FK** (legacy/manual materials may reference no seed SKU; §4.7) | → `suppliers(id)` |
| `target_specs` | `formulation_id`, `formulation_version_id` **NOT NULL**, `metric_id`, `target_value`, `tolerance`, `target_at_label_claim_pct`, `method`, `authorized_signer`, `authorized_at`, `effective_date`, `status ('draft'\|'authorized'\|'superseded')` | → `formulations`, `formulation_versions`, `spec_metrics` |
| `master_specs` | `formulation_id`, `metric_id`. **(flag relocated — see `master_spec_revisions`)** | → `formulations`, `spec_metrics` |
| `master_spec_revisions` | **(NEW — fixes critical #1)** `master_spec_id`, `formulation_version_id`, `metric_invalidated_by_revision bool` — one row per (master_spec × version) where a carry-forward decision was recorded. Makes "walk back to last invalidation" a JOIN | → `master_specs`, `formulation_versions` |
| `master_spec_observations` | `master_spec_id`, `value`, `scale ('bench'\|'pilot'\|'production'\|'coa')`, `revision_id` **(FK)**, `batch_id?`, `coa_id?`, `observed_at` — **strictly append-only; NO `superseded_by`** (voiding deferred, §5) | → `master_specs`, `formulation_versions` (revision_id), (`batches`, `coas` soft) |
| `packaging_specs` | `formulation_id`, `formulation_version_id` **NOT NULL** (Version-level), `workflow jsonb` (operator-authored production-and-packaging flow) | → `formulations`, `formulation_versions` |
| `bench_top_runs` | `formulation_version_id`, `run_date`, `operator`, `batch_size`, `notes` | → `formulation_versions` |
| `lots` | `lot_kind ('material'\|'finished-good')`, `material_id?`, `supplier_id?` (per-lot **actual** supplier — overrides the material default), `batch_of_origin_id?` (finished-goods lots), `lot_code`, `expiration_date`, `status ('available'\|'reserved'\|'consumed'\|'quarantined'\|'released'\|'expired'\|'recalled')`. **Customer Lots are `lot_kind='finished-good'` rows here** (§4.10) | → `materials`, `suppliers`, `batches` (batch_of_origin) |
| `batches` | `formulation_version_id`, `batch_code`, `production_date` | → `formulation_versions` |
| `coas` | `batch_id?`, `lot_id?` + **CHECK: exactly one of (`batch_id`,`lot_id`) is set** (§4.8) | → `batches`, `lots` |
| `lot_events` | `lot_id`, `event_type`, `quantity_delta`, `batch_id?`, `coa_id?`, `actor`, `reason_code?` — **strictly append-only** (`created_at` only; no UPDATE/DELETE policy). Covers material AND finished-goods lots (single table, §4.10) | → `lots`, (`batches`, `coas` soft) |
| `inventory` | `lot_id` — **identity only** (qty/location columns deferred, §5) | → `lots` |
| ~~`customer_lots`~~ | **collapsed into `lots`** (`lot_kind='finished-good'`) — see §4.10 | — |

---

## §4 — Flagged implicit decisions (the hidden-decision sweep — review these explicitly)

Per the `product_id`-incident fix: every architectural call this schema makes is named here, not left riding in syntax.

**§4.1 — Dual key (`owner_id` + `workspace_id`) on every node.** `0002`'s RLS reads *both* (`auth.uid() = owner_id OR is_internal_member(workspace_id)`). So new entities carry both: `owner_id` = creator/audit + the solo-user RLS path; `workspace_id` = tenancy/sharing. **Decision:** follow the `formulations` dual-key pattern verbatim. *Alternative rejected:* workspace_id-only would break the owner-path RLS that solo (non-shared) rows rely on.

**§4.2 — `sector` first-class on EVERY table** (resolves #17 §6; Q3 picked 2026-06-16). **Decision:** denormalize `sector` onto **every** spine table — *including* `lot_events` and `master_spec_observations`. **No inherit-via-parent, no mixed model** (a mixed denormalized/inherited scheme is strictly worse to reason about than either consistent choice). Indexed `(workspace_id, sector)` where query-scoped. *Why:* the cross-sector leak class is a query-scoping problem; first-class `sector` makes scoping always a `where` clause. *Cost:* `sector` is set on insert (derived from the parent Formulation); write-amplification on a sector change is negligible — sector ~never changes for a formulation.

**§4.3 — `formulation_versions` becomes a real table (the big one). CONFIRMED 2026-06-16 — #17 Decision B is REVERSED at schema-laying time.** Version becomes a real table; existing jsonb snapshots in `formulations.data` become history records to migrate forward (or read-only legacy). Snapshot-in-data was correct at #17 given what was known then; the entity model grown on top of it makes it **structurally untenable**: TargetSpec can't FK cleanly to a Version row; observation `revision_id` can't FK to a stable id; Batch/BenchTopRun could only soft-reference a version *label* string; recall-trace graph traversal degrades when a node is a path-into-jsonb; and the MasterSpec "include only Rev_N observations" filter becomes jsonb-path indexing instead of a relational JOIN. **Decision:** lay a minimal `formulation_versions` (id, formulation_id, version, status, snapshot jsonb) so everything Version-level FKs to a stable id; the workspace keeps writing snapshots, now as rows.

**§4.4 — `spec_metrics`: per-workspace table, seeded on workspace creation (recommended).** TargetSpec/MasterSpec FK to `metric_id`. **Decision (recommended):** ONE table, **workspace-scoped** (the standard §1 RLS — no special global-catalog RLS shape), with a `source ('predefined'|'custom')` column. The **30-metric predefined library is seeded into each workspace on creation** (extend `handle_new_user_workspace` to copy the seed); custom metrics are just rows with `source='custom'`. *What's seeded* (from master-specs-data-model): **regulatory-prescribed** (heavy metals Pb/As/Cd/Hg, USP <232>/<233>/<905>, FALCPA allergens), **industry-common** (pH, aw, moisture, Brix, viscosity, color L\*a\*b\*, microbial TPC/Y&M/coliforms/pathogens), **label-claim/potency** — each carrying its locked `distribution_type` / `bound_direction` / `safety_factor`. *Trade-off (named):* per-workspace copies duplicate the platform's curated definitions per workspace and make them operator-editable (re-seedable by migration if a definition is corrected). *Alternative:* a global read-only catalog + a workspace custom-overlay gives authoritative platform definitions but **two RLS shapes** — heavier for August. **Recommend per-workspace for the single RLS shape; your call.**

**§4.5 — Observation log as a table, not jsonb.** The data-model doc had `observation_log: ObservationLogEntry[]` (array on the entry). **Decision:** lay `master_spec_observations` as a child table (FK `master_spec_id`) so observations are queryable/indexable by `scale` + `revision_id` (required for the predicted-vs-measured scale-filtered query and the carry-forward stats). *Alternative rejected:* jsonb array can't be efficiently scale/revision-filtered. **Append-only (critical #2 fix):** strictly append-only — INSERT + SELECT RLS only, **no UPDATE/DELETE, no `superseded_by`** (that would be a post-insert mutation of immutable evidence). Voiding deferred (§5) — when it lands, a bad reading is excluded by an **append-only void-event** (a new row referencing the voided observation), never by mutating the original.

**§4.6 — Append-only at the RLS layer: `lot_events` AND `master_spec_observations`.** **Decision:** INSERT + SELECT policies only; **no UPDATE, no DELETE** policy (immutability enforced by RLS, not just convention). `created_at` only, no `updated_at`/touch trigger. Corrections are new rows (`lot_events` → an `adjustment` event; observations → a void-event, deferred §5).

**§4.7 — Material identity vs supplier-variant (#17 §2 deciding-work).** **Decision (min-viable):** `materials` is the workspace's instance of a raw material, optionally `supplier_id`-linked, with `catalog_ref` pointing at the global seed SKU (`lib/data`). The **global seed catalog stays global** (not per-workspace rows); `materials` are the operator's qualified instances. **Override semantics (named per review):** a workspace `materials` row is **override-capable** — it may store its own values (the operator's actual supplier-variant potencyFactor / spec, from a COA or spec sheet) that **supersede the seed when present**; `catalog_ref` is the **provenance/lineage link** to the seed it was instantiated from, **not a value lock.** (Per the COA-anchored doctrine — the operator's real material data is authoritative for *their* material, not the generic seed.) *Open:* multiple supplier-variants per Material (one row per variant vs a variant child table) — **deferred**, additive later; min-viable is one `materials` row per operator material with an optional single `supplier_id`.

**§4.8 — COA attaches to Batch OR Lot.** `coas.batch_id?` + `coas.lot_id?` (nullable both; exactly one set). Receipt COAs → material Lot; production COAs → Batch. **Decision:** soft (both nullable) for min-viable; a CHECK enforcing exactly-one is an additive hardening.

**§4.9 — Product is collapsed into Formulation** (Packet-Q1 CLOSED, locked 2026-06-16). **No `products` table.** TargetSpec → `formulation_version_id`; MasterSpec → `formulation_id`. A Product parent is a Q4+ additive FK if multi-formulation-per-product emerges.

**§4.10 — Customer Lot collapses into `lots` (critical #3 fix).** A finished-goods Customer Lot is a `lots` row with `lot_kind='finished-good'`, `batch_of_origin_id` set, `material_id` null; a raw-material lot is `lot_kind='material'`, `material_id` set, `batch_of_origin_id` null. **One `lots` table, one `lot_events` table, one recall traversal, one inventory query.** *Why not a separate `customer_lots` table:* `lot_events.lot_id` would have no clean home for customer-lot events (a polymorphic FK or a second event table — both worse). Customer Lot stays a conceptual spine entity (like Product→Formulation); it shares `lots`, discriminated by an **explicit `lot_kind`** (not implicit-by-which-FK-is-set).

**§4.11 — `master_spec_revisions` side table (critical #1 fix).** The locked carry-forward is per-(formulation × **revision** × metric): *true → only Rev_N observations; false → Rev_N + prior back to the last invalidation.* That walk-back needs a per-revision-boundary record — which a single bool on the Formulation-level `master_specs` row cannot hold (my reconciliation stripped the revision dimension when it moved MasterSpec to Formulation-level). **Decision:** the flag lives on `master_spec_revisions` (`master_spec_id`, `formulation_version_id`, `metric_invalidated_by_revision`) — one row per (master_spec × version) where the operator recorded a decision; `master_specs` drops the flag. Walk-back is a clean JOIN.

**§4.12 — `formulation_versions` ordering by `created_at`, not version-label parsing.** Version sequence is `created_at` (or an explicit `sequence int`), never parsing the free-form `version` text — semver-string parsing is fragile and operator labels vary.

---

## §4-bis — Review-pass amendments (2026-06-17, post-local-green + Opus review)

`0003` as built incorporates these catches (they **supersede the as-drafted §4.5/§4.6** where noted):

- **Restrictive append-only deny (supersedes §4.6's "absence of policy").** `lot_events`, `master_spec_observations`, **and** `master_spec_revisions` get **RESTRICTIVE `using(false)`** UPDATE+DELETE policies — AND'd with any future permissive policy, so append-only can never be re-enabled by an accidental permissive copy-paste. Absence-of-policy was verified-denying but not *future-locked*. **Harness proves it:** a deliberately-added permissive UPDATE policy is still denied.
- **`master_spec_revisions` is now append-only + supersession** (was a standard mutable table — the worst-of-both per the review). The carry-forward decision is "once per (formulation × version × metric)" = immutable. Corrections follow the QA **never-erase / strike-through** doctrine: a NEW row with `supersedes_id` (the strikethrough link) + `correction_reason` (the marginal note); `owner_id` = the initials, `created_at` = the date. Dropped `updated_at` + its touch trigger.
- **`master_spec_observations` gains the same supersession** (`supersedes_id` + `correction_reason`) + **`is_void`** (void-without-replacement: contaminated sample, no retest — original stays). Replaces the dropped `superseded_by` (which would have needed a mutating UPDATE).
- **`lot_events` corrections** = compensating events (`adjustment`), not supersession — inventory is compositional (sum the stream).
- **"Current value" = leaf-of-chain** (`WHERE NOT EXISTS (SELECT 1 FROM <t> s WHERE s.supersedes_id = <t>.id)`) — timestamp-independent + audit-grade, NOT latest-by-`created_at`. `supersedes_id` indexed on both tables.
- **`lots` discriminator integrity CHECK:** a `material` lot MUST have `material_id` + null `batch_of_origin_id`; a `finished-good` lot the reverse. No orphans (recall-trace depends on it). Rejected at INSERT.
- **DELETE policy = owner OR workspace-owner** (more restrictive than SELECT/UPDATE's owner-OR-member) — **intentional, matches `0002`'s formulations DELETE pattern** (members read/write; owner/workspace-owner deletes).
- **`workspace_id` nullable uniformly** on every spine table; the INSERT policy's `workspace_id is null` branch is **live, not dead** — the solo case (creating entities before/without a workspace), matching `0002`'s nullable `formulations.workspace_id`. Harness solo-case test verifies it holds uniformly.

**Verified LOCAL-GREEN 2026-06-17:** apply clean (EXIT 0) + full harness PASS — cross-tenant isolation on every spine table, restrictive-deny-beats-permissive, supersession leaf-of-chain, `lots` CHECK rejection, solo case. Prod-apply still gated (§6).

---

## §5 — Deferred (NOT in `0003`; additive later, no rebuild)

- `inventory` internals: on-hand qty, location, expiry roll-ups (identity `lot_id` only now).
- `coas` internals: lab-result fields, file storage, USP-232 reconciliation.
- `customer_lots` internals beyond `batch_of_origin_id` + `lot_code`.
- `lots` qty-on-hand: **computed from `lot_events`**, never stored (inventory-event-model doctrine).
- `packaging_specs.workflow` deep schema (the 1→16-page PDS section ontology) — `jsonb` placeholder now.
- **Location/Warehouse (#14 candidate):** Q4; `lots.location_id` FK added additively.
- Batch persistence of full `executionRecord` (LB#4 second half) beyond batch identity.
- Recall-trace UI, Receiving/Allocation/Consumption UIs — Q4 (data shape supports day one).
- **Observation voiding:** strictly append-only now (no `superseded_by`/`is_void`). When voiding lands it's an **append-only void-event** referencing the voided observation (+ reason) — designed then; observations stay immutable. (Master Specs is internal-dev/flagged-off for August, so no operator hits this in August.)

---

## §6 — Verification gate (before `0003` is considered done)

1. **Backup first** (same discipline as `0002` — prod has no automatic backups).
2. **Extend `supabase/tests/rls_isolation_test.sql`** to cover the new tables: no cross-tenant leak, anon blocked, owner-path + member-path both correct, **`lot_events` UPDATE/DELETE denied to everyone** (append-only proof).
3. Run the harness against the post-migration schema (local first, then prod) — must pass.
4. **Operator go** before prod apply. Tenancy + RLS is the most dangerous code in the product.

---

## Resolved (was: open questions) — all closed 2026-06-16 in review

1. **§4.3 `formulation_versions` table** — CONFIRMED (#17 Decision B reversed).
2. **§4.4 `spec_metrics`** — per-workspace seeded table, single RLS shape. CONCUR.
3. **§4.2 `sector`** — denormalized on EVERY table; no mixed model. PICKED.
4. **§4.7 Material** — override-capable + single `supplier_id` for August; supplier-variant child deferred. CONCUR.
5. **§3 FK / §1 RLS sweep** — 3 criticals (carry-forward granularity → `master_spec_revisions`; observation append-only → drop `superseded_by`; Customer-Lot→`lots` collapse) + minors (COA CHECK, NOT-NULL version FKs, `revision_id` FK, version ordering, per-lot supplier, `catalog_ref` non-FK, status enums) — all incorporated.

**Cleared to write `0003_lifecycle_spine.sql` + the RLS-harness extension. Prod-apply gated on §6 (backup + harness pass + operator go).**
