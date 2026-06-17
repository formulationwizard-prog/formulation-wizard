-- 0003_lifecycle_spine.sql
-- =====================================================================
-- Lays the #17 13-entity lifecycle spine: identity + FK + tenancy + sector.
-- Built to docs/architecture/schema-laying-directive-2026-06-16.md (APPROVED).
-- Conventions verbatim from 0001_baseline.sql + 0002_workspace_tenancy.sql:
--   - id uuid default gen_random_uuid()
--   - dual key: owner_id (FK auth.users) + workspace_id (FK workspaces)  [§4.1]
--   - sector text not null, mode-enum CHECK, indexed                      [§4.2]
--   - RLS: auth.uid()=owner_id OR is_internal_member(workspace_id)        [§1]
--   - touch_updated_at() trigger (append-only tables: created_at only)    [§4.6]
--   - idempotent: create table if not exists / do$$ exception / drop policy if exists
--
-- MIGRATION-TEST GATE (#17 Decision D): identity + linkage now; internals deferred (§5).
--
-- BUILD-TIME DEVIATION (flagged, not buried): the directive §4.4 calls for seeding
-- the 30-metric spec_metrics library into handle_new_user_workspace. The seed
-- *composition* is still co-founder-gated (master-specs open Q#4), and seeding is
-- data (additive), not identity/linkage (the gate). So this migration lays the
-- spec_metrics TABLE; the seed + the trigger extension are DEFERRED to a follow
-- migration once the library composition is locked. The FK chain is satisfied now.
--
-- ⚠️ HARM-CRITICAL — tenancy + RLS. DO NOT APPLY TO PROD UNTIL:
--   1. Backup exists (prod has no automatic backups).
--   2. supabase/tests/rls_isolation_test.sql (extended for these tables) passes
--      against the post-migration schema — incl. UPDATE/DELETE denied on the two
--      append-only tables (lot_events, master_spec_observations).
--   3. Operator go.
-- Idempotent (IF NOT EXISTS / do$$ exception / drop policy if exists) — safe to re-run.
-- =====================================================================

begin;

-- ── helper: sector CHECK matches formulations.mode enum (§4.2) ───────
-- (inlined per-table as <t>_sector_check; values: fb/baking/catering/feeds/sausage/supplements)

-- =====================================================================
-- 1. formulation_versions  (substrate — §4.3; Decision B reversed: Version is a real table)
-- =====================================================================
create table if not exists public.formulation_versions (
    id uuid default gen_random_uuid() not null,
    owner_id uuid not null,
    workspace_id uuid,
    sector text not null,
    formulation_id uuid not null,
    version text not null,
    status text default 'draft'::text not null,
    snapshot jsonb not null,
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null,
    constraint formulation_versions_sector_check check ((sector = any (array['fb'::text,'baking'::text,'catering'::text,'feeds'::text,'sausage'::text,'supplements'::text]))),
    constraint formulation_versions_status_check check ((status = any (array['draft'::text,'in-pilot'::text,'launched'::text,'on-hold'::text])))
);
alter table public.formulation_versions owner to postgres;
-- NOTE (§4.12): version SEQUENCE is created_at order, never by parsing `version` text.

-- =====================================================================
-- 2. spec_metrics  (substrate — §4.4; table now, 30-metric seed DEFERRED — see header)
-- =====================================================================
create table if not exists public.spec_metrics (
    id uuid default gen_random_uuid() not null,
    owner_id uuid not null,
    workspace_id uuid,
    sector text not null,
    name text not null,
    unit text,
    data_type text default 'numeric'::text not null,
    distribution_type text default 'normal'::text not null,
    bound_direction text default 'two-sided'::text not null,
    source text default 'custom'::text not null,
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null,
    constraint spec_metrics_sector_check check ((sector = any (array['fb'::text,'baking'::text,'catering'::text,'feeds'::text,'sausage'::text,'supplements'::text]))),
    constraint spec_metrics_data_type_check check ((data_type = any (array['numeric'::text,'categorical'::text,'boolean'::text]))),
    constraint spec_metrics_source_check check ((source = any (array['predefined'::text,'custom'::text])))
);
alter table public.spec_metrics owner to postgres;

-- =====================================================================
-- 3. suppliers
-- =====================================================================
create table if not exists public.suppliers (
    id uuid default gen_random_uuid() not null,
    owner_id uuid not null,
    workspace_id uuid,
    sector text not null,
    name text not null,
    notes text,
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null,
    constraint suppliers_sector_check check ((sector = any (array['fb'::text,'baking'::text,'catering'::text,'feeds'::text,'sausage'::text,'supplements'::text])))
);
alter table public.suppliers owner to postgres;

-- =====================================================================
-- 4. materials  (§4.7 — workspace instance; catalog_ref is plain text, NOT an FK; override-capable)
-- =====================================================================
create table if not exists public.materials (
    id uuid default gen_random_uuid() not null,
    owner_id uuid not null,
    workspace_id uuid,
    sector text not null,
    name text not null,
    supplier_id uuid,
    catalog_ref text,
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null,
    constraint materials_sector_check check ((sector = any (array['fb'::text,'baking'::text,'catering'::text,'feeds'::text,'sausage'::text,'supplements'::text])))
);
alter table public.materials owner to postgres;

-- =====================================================================
-- 5. target_specs  (the design/regulatory CONTRACT — Version-level)
-- =====================================================================
create table if not exists public.target_specs (
    id uuid default gen_random_uuid() not null,
    owner_id uuid not null,
    workspace_id uuid,
    sector text not null,
    formulation_id uuid not null,
    formulation_version_id uuid not null,
    metric_id uuid not null,
    target_value text,
    tolerance numeric,
    target_at_label_claim_pct numeric default 100,
    method text,
    authorized_signer text,
    authorized_at timestamp with time zone,
    effective_date date,
    status text default 'draft'::text not null,
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null,
    constraint target_specs_sector_check check ((sector = any (array['fb'::text,'baking'::text,'catering'::text,'feeds'::text,'sausage'::text,'supplements'::text]))),
    constraint target_specs_status_check check ((status = any (array['draft'::text,'authorized'::text,'superseded'::text])))
);
alter table public.target_specs owner to postgres;

-- =====================================================================
-- 6. master_specs  (verified-from-production — Formulation-level; flag relocated to revisions)
-- =====================================================================
create table if not exists public.master_specs (
    id uuid default gen_random_uuid() not null,
    owner_id uuid not null,
    workspace_id uuid,
    sector text not null,
    formulation_id uuid not null,
    metric_id uuid not null,
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null,
    constraint master_specs_sector_check check ((sector = any (array['fb'::text,'baking'::text,'catering'::text,'feeds'::text,'sausage'::text,'supplements'::text])))
);
alter table public.master_specs owner to postgres;

-- =====================================================================
-- 7. master_spec_revisions  (substrate — §4.11; per (master_spec × version) carry-forward decision)
-- =====================================================================
create table if not exists public.master_spec_revisions (
    id uuid default gen_random_uuid() not null,
    owner_id uuid not null,
    workspace_id uuid,
    sector text not null,
    master_spec_id uuid not null,
    formulation_version_id uuid not null,
    metric_invalidated_by_revision boolean default false not null,
    supersedes_id uuid,                -- strike-through link to the row this corrects (append-only; leaf-of-chain = current)
    correction_reason text,            -- the marginal note (required when supersedes_id is set)
    created_at timestamp with time zone default now() not null,
    -- NOTE: append-only (the QA "never erase" doctrine) — NO updated_at, NO touch trigger; corrections are new rows.
    constraint master_spec_revisions_sector_check check ((sector = any (array['fb'::text,'baking'::text,'catering'::text,'feeds'::text,'sausage'::text,'supplements'::text]))),
    constraint master_spec_revisions_correction_check check ((supersedes_id is null) or (correction_reason is not null))
);
alter table public.master_spec_revisions owner to postgres;

-- =====================================================================
-- 8. master_spec_observations  (the observation log — §4.5; STRICTLY APPEND-ONLY, §4.6)
--    created_at only; NO updated_at / NO superseded_by; RLS = SELECT+INSERT only.
-- =====================================================================
create table if not exists public.master_spec_observations (
    id uuid default gen_random_uuid() not null,
    owner_id uuid not null,
    workspace_id uuid,
    sector text not null,
    master_spec_id uuid not null,
    revision_id uuid not null,
    value text,
    scale text not null,
    batch_id uuid,
    coa_id uuid,
    observed_at timestamp with time zone default now() not null,
    supersedes_id uuid,                -- strike-through link (append-only; leaf-of-chain = current)
    correction_reason text,            -- marginal note (required when supersedes_id is set)
    is_void boolean default false not null,  -- void-without-replacement (contaminated sample, no retest); original stays
    created_at timestamp with time zone default now() not null,
    constraint master_spec_observations_sector_check check ((sector = any (array['fb'::text,'baking'::text,'catering'::text,'feeds'::text,'sausage'::text,'supplements'::text]))),
    constraint master_spec_observations_scale_check check ((scale = any (array['bench'::text,'pilot'::text,'production'::text,'coa'::text]))),
    -- Audit invariant (review catch): ANY deviation from a normal append — superseding OR voiding —
    -- requires a reason. Voiding is the regulator's strikethrough; the note is not optional on it.
    constraint master_spec_observations_correction_check check (
      (correction_reason is not null) or ((supersedes_id is null) and (is_void = false))
    )
);
alter table public.master_spec_observations owner to postgres;

-- =====================================================================
-- 9. packaging_specs  (operator-authored production-and-packaging WORKFLOW — Version-level)
-- =====================================================================
create table if not exists public.packaging_specs (
    id uuid default gen_random_uuid() not null,
    owner_id uuid not null,
    workspace_id uuid,
    sector text not null,
    formulation_id uuid not null,
    formulation_version_id uuid not null,
    workflow jsonb default '{}'::jsonb not null,
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null,
    constraint packaging_specs_sector_check check ((sector = any (array['fb'::text,'baking'::text,'catering'::text,'feeds'::text,'sausage'::text,'supplements'::text])))
);
alter table public.packaging_specs owner to postgres;

-- =====================================================================
-- 10. bench_top_runs  (lab-scale R&D run; feeds the tier engine scale='bench')
-- =====================================================================
create table if not exists public.bench_top_runs (
    id uuid default gen_random_uuid() not null,
    owner_id uuid not null,
    workspace_id uuid,
    sector text not null,
    formulation_version_id uuid not null,
    run_date date,
    operator text,
    batch_size numeric,
    notes text,
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null,
    constraint bench_top_runs_sector_check check ((sector = any (array['fb'::text,'baking'::text,'catering'::text,'feeds'::text,'sausage'::text,'supplements'::text])))
);
alter table public.bench_top_runs owner to postgres;

-- =====================================================================
-- 11. lots  (§4.10 — material AND finished-goods lots; lot_kind discriminator)
-- =====================================================================
create table if not exists public.lots (
    id uuid default gen_random_uuid() not null,
    owner_id uuid not null,
    workspace_id uuid,
    sector text not null,
    lot_kind text not null,
    material_id uuid,
    supplier_id uuid,
    batch_of_origin_id uuid,
    lot_code text,
    expiration_date date,
    status text default 'available'::text not null,
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null,
    constraint lots_sector_check check ((sector = any (array['fb'::text,'baking'::text,'catering'::text,'feeds'::text,'sausage'::text,'supplements'::text]))),
    constraint lots_lot_kind_check check ((lot_kind = any (array['material'::text,'finished-good'::text]))),
    constraint lots_status_check check ((status = any (array['available'::text,'reserved'::text,'consumed'::text,'quarantined'::text,'released'::text,'expired'::text,'recalled'::text]))),
    -- Discriminator INTEGRITY (review catch): a material lot MUST have a material + no batch-of-origin;
    -- a finished-good lot MUST have a batch-of-origin + no material. No orphans — recall-trace depends on it.
    constraint lots_discriminator_check check (
      ((lot_kind = 'material'::text)      and (material_id is not null) and (batch_of_origin_id is null)) or
      ((lot_kind = 'finished-good'::text) and (material_id is null)     and (batch_of_origin_id is not null))
    )
);
alter table public.lots owner to postgres;

-- =====================================================================
-- 12. batches  (one production run; references a frozen Formulation Version)
-- =====================================================================
create table if not exists public.batches (
    id uuid default gen_random_uuid() not null,
    owner_id uuid not null,
    workspace_id uuid,
    sector text not null,
    formulation_version_id uuid not null,
    batch_code text,
    production_date date,
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null,
    constraint batches_sector_check check ((sector = any (array['fb'::text,'baking'::text,'catering'::text,'feeds'::text,'sausage'::text,'supplements'::text])))
);
alter table public.batches owner to postgres;

-- =====================================================================
-- 13. coas  (§4.8 — attaches to a Batch OR a Lot; CHECK exactly one)
-- =====================================================================
create table if not exists public.coas (
    id uuid default gen_random_uuid() not null,
    owner_id uuid not null,
    workspace_id uuid,
    sector text not null,
    batch_id uuid,
    lot_id uuid,
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null,
    constraint coas_sector_check check ((sector = any (array['fb'::text,'baking'::text,'catering'::text,'feeds'::text,'sausage'::text,'supplements'::text]))),
    constraint coas_attach_check check ((num_nonnulls(batch_id, lot_id) = 1))
);
alter table public.coas owner to postgres;

-- =====================================================================
-- 14. lot_events  (LotEvent — STRICTLY APPEND-ONLY, §4.6; created_at only; RLS = SELECT+INSERT)
-- =====================================================================
create table if not exists public.lot_events (
    id uuid default gen_random_uuid() not null,
    owner_id uuid not null,
    workspace_id uuid,
    sector text not null,
    lot_id uuid not null,
    event_type text not null,
    quantity_delta numeric default 0 not null,
    batch_id uuid,
    coa_id uuid,
    actor text,
    reason_code text,
    note text,
    created_at timestamp with time zone default now() not null,
    constraint lot_events_sector_check check ((sector = any (array['fb'::text,'baking'::text,'catering'::text,'feeds'::text,'sausage'::text,'supplements'::text]))),
    constraint lot_events_event_type_check check ((event_type = any (array['receipt'::text,'reservation'::text,'consumption'::text,'release'::text,'adjustment'::text,'scrap'::text,'return'::text,'quarantine'::text,'release_from_quarantine'::text])))
);
alter table public.lot_events owner to postgres;

-- =====================================================================
-- 15. inventory  (identity only — §5; qty/location columns deferred)
-- =====================================================================
create table if not exists public.inventory (
    id uuid default gen_random_uuid() not null,
    owner_id uuid not null,
    workspace_id uuid,
    sector text not null,
    lot_id uuid not null,
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null,
    constraint inventory_sector_check check ((sector = any (array['fb'::text,'baking'::text,'catering'::text,'feeds'::text,'sausage'::text,'supplements'::text])))
);
alter table public.inventory owner to postgres;

-- ── Primary keys (idempotent) ────────────────────────────────────────
do $$ begin
  alter table only public.formulation_versions     add constraint formulation_versions_pkey     primary key (id);
  alter table only public.spec_metrics             add constraint spec_metrics_pkey             primary key (id);
  alter table only public.suppliers                add constraint suppliers_pkey                primary key (id);
  alter table only public.materials                add constraint materials_pkey                primary key (id);
  alter table only public.target_specs            add constraint target_specs_pkey            primary key (id);
  alter table only public.master_specs            add constraint master_specs_pkey            primary key (id);
  alter table only public.master_spec_revisions    add constraint master_spec_revisions_pkey    primary key (id);
  alter table only public.master_spec_observations add constraint master_spec_observations_pkey primary key (id);
  alter table only public.packaging_specs          add constraint packaging_specs_pkey          primary key (id);
  alter table only public.bench_top_runs           add constraint bench_top_runs_pkey           primary key (id);
  alter table only public.lots                     add constraint lots_pkey                     primary key (id);
  alter table only public.batches                  add constraint batches_pkey                  primary key (id);
  alter table only public.coas                     add constraint coas_pkey                     primary key (id);
  alter table only public.lot_events               add constraint lot_events_pkey               primary key (id);
  alter table only public.inventory                add constraint inventory_pkey                primary key (id);
exception when duplicate_table or invalid_table_definition then null; end $$;

-- ── Foreign keys (idempotent; each guarded so a re-run is safe) ──────
do $$ begin
  -- tenancy: owner_id → auth.users, workspace_id → workspaces (every table)
  alter table only public.formulation_versions     add constraint formulation_versions_owner_fkey     foreign key (owner_id)     references auth.users(id)        on delete cascade;
  alter table only public.formulation_versions     add constraint formulation_versions_ws_fkey        foreign key (workspace_id) references public.workspaces(id) on delete cascade;
  alter table only public.formulation_versions     add constraint formulation_versions_formulation_fkey foreign key (formulation_id) references public.formulations(id) on delete cascade;

  alter table only public.spec_metrics             add constraint spec_metrics_owner_fkey             foreign key (owner_id)     references auth.users(id)        on delete cascade;
  alter table only public.spec_metrics             add constraint spec_metrics_ws_fkey                foreign key (workspace_id) references public.workspaces(id) on delete cascade;

  alter table only public.suppliers                add constraint suppliers_owner_fkey                foreign key (owner_id)     references auth.users(id)        on delete cascade;
  alter table only public.suppliers                add constraint suppliers_ws_fkey                   foreign key (workspace_id) references public.workspaces(id) on delete cascade;

  alter table only public.materials                add constraint materials_owner_fkey                foreign key (owner_id)     references auth.users(id)        on delete cascade;
  alter table only public.materials                add constraint materials_ws_fkey                   foreign key (workspace_id) references public.workspaces(id) on delete cascade;
  alter table only public.materials                add constraint materials_supplier_fkey             foreign key (supplier_id)  references public.suppliers(id)  on delete set null;

  alter table only public.target_specs            add constraint target_specs_owner_fkey            foreign key (owner_id)     references auth.users(id)        on delete cascade;
  alter table only public.target_specs            add constraint target_specs_ws_fkey               foreign key (workspace_id) references public.workspaces(id) on delete cascade;
  alter table only public.target_specs            add constraint target_specs_formulation_fkey      foreign key (formulation_id) references public.formulations(id) on delete cascade;
  alter table only public.target_specs            add constraint target_specs_version_fkey          foreign key (formulation_version_id) references public.formulation_versions(id) on delete cascade;
  alter table only public.target_specs            add constraint target_specs_metric_fkey           foreign key (metric_id)    references public.spec_metrics(id) on delete restrict;

  alter table only public.master_specs            add constraint master_specs_owner_fkey            foreign key (owner_id)     references auth.users(id)        on delete cascade;
  alter table only public.master_specs            add constraint master_specs_ws_fkey               foreign key (workspace_id) references public.workspaces(id) on delete cascade;
  alter table only public.master_specs            add constraint master_specs_formulation_fkey      foreign key (formulation_id) references public.formulations(id) on delete cascade;
  alter table only public.master_specs            add constraint master_specs_metric_fkey           foreign key (metric_id)    references public.spec_metrics(id) on delete restrict;

  alter table only public.master_spec_revisions    add constraint master_spec_revisions_owner_fkey    foreign key (owner_id)     references auth.users(id)        on delete cascade;
  alter table only public.master_spec_revisions    add constraint master_spec_revisions_ws_fkey       foreign key (workspace_id) references public.workspaces(id) on delete cascade;
  alter table only public.master_spec_revisions    add constraint master_spec_revisions_ms_fkey       foreign key (master_spec_id) references public.master_specs(id) on delete cascade;
  alter table only public.master_spec_revisions    add constraint master_spec_revisions_version_fkey  foreign key (formulation_version_id) references public.formulation_versions(id) on delete cascade;

  alter table only public.master_spec_observations add constraint master_spec_observations_owner_fkey foreign key (owner_id)     references auth.users(id)        on delete cascade;
  alter table only public.master_spec_observations add constraint master_spec_observations_ws_fkey    foreign key (workspace_id) references public.workspaces(id) on delete cascade;
  alter table only public.master_spec_observations add constraint master_spec_observations_ms_fkey    foreign key (master_spec_id) references public.master_specs(id) on delete cascade;
  alter table only public.master_spec_observations add constraint master_spec_observations_rev_fkey   foreign key (revision_id)  references public.formulation_versions(id) on delete cascade;
  -- supersession self-references (the strike-through chain) — set null on cascade so deleting a parent never orphans
  alter table only public.master_spec_revisions    add constraint master_spec_revisions_supersedes_fkey    foreign key (supersedes_id) references public.master_spec_revisions(id)    on delete set null;
  alter table only public.master_spec_observations add constraint master_spec_observations_supersedes_fkey foreign key (supersedes_id) references public.master_spec_observations(id) on delete set null;

  alter table only public.packaging_specs          add constraint packaging_specs_owner_fkey          foreign key (owner_id)     references auth.users(id)        on delete cascade;
  alter table only public.packaging_specs          add constraint packaging_specs_ws_fkey             foreign key (workspace_id) references public.workspaces(id) on delete cascade;
  alter table only public.packaging_specs          add constraint packaging_specs_formulation_fkey    foreign key (formulation_id) references public.formulations(id) on delete cascade;
  alter table only public.packaging_specs          add constraint packaging_specs_version_fkey        foreign key (formulation_version_id) references public.formulation_versions(id) on delete cascade;

  alter table only public.bench_top_runs           add constraint bench_top_runs_owner_fkey           foreign key (owner_id)     references auth.users(id)        on delete cascade;
  alter table only public.bench_top_runs           add constraint bench_top_runs_ws_fkey              foreign key (workspace_id) references public.workspaces(id) on delete cascade;
  alter table only public.bench_top_runs           add constraint bench_top_runs_version_fkey         foreign key (formulation_version_id) references public.formulation_versions(id) on delete cascade;

  alter table only public.lots                     add constraint lots_owner_fkey                     foreign key (owner_id)     references auth.users(id)        on delete cascade;
  alter table only public.lots                     add constraint lots_ws_fkey                        foreign key (workspace_id) references public.workspaces(id) on delete cascade;
  alter table only public.lots                     add constraint lots_material_fkey                  foreign key (material_id)  references public.materials(id)  on delete set null;
  alter table only public.lots                     add constraint lots_supplier_fkey                  foreign key (supplier_id)  references public.suppliers(id)  on delete set null;
  alter table only public.lots                     add constraint lots_batch_origin_fkey              foreign key (batch_of_origin_id) references public.batches(id) on delete set null;

  alter table only public.batches                  add constraint batches_owner_fkey                  foreign key (owner_id)     references auth.users(id)        on delete cascade;
  alter table only public.batches                  add constraint batches_ws_fkey                     foreign key (workspace_id) references public.workspaces(id) on delete cascade;
  alter table only public.batches                  add constraint batches_version_fkey                foreign key (formulation_version_id) references public.formulation_versions(id) on delete cascade;

  alter table only public.coas                     add constraint coas_owner_fkey                     foreign key (owner_id)     references auth.users(id)        on delete cascade;
  alter table only public.coas                     add constraint coas_ws_fkey                        foreign key (workspace_id) references public.workspaces(id) on delete cascade;
  alter table only public.coas                     add constraint coas_batch_fkey                     foreign key (batch_id)     references public.batches(id)    on delete cascade;
  alter table only public.coas                     add constraint coas_lot_fkey                       foreign key (lot_id)       references public.lots(id)       on delete cascade;

  alter table only public.lot_events               add constraint lot_events_owner_fkey               foreign key (owner_id)     references auth.users(id)        on delete cascade;
  alter table only public.lot_events               add constraint lot_events_ws_fkey                  foreign key (workspace_id) references public.workspaces(id) on delete cascade;
  alter table only public.lot_events               add constraint lot_events_lot_fkey                 foreign key (lot_id)       references public.lots(id)       on delete cascade;
  alter table only public.lot_events               add constraint lot_events_batch_fkey               foreign key (batch_id)     references public.batches(id)    on delete set null;
  alter table only public.lot_events               add constraint lot_events_coa_fkey                 foreign key (coa_id)       references public.coas(id)       on delete set null;

  alter table only public.inventory                add constraint inventory_owner_fkey                foreign key (owner_id)     references auth.users(id)        on delete cascade;
  alter table only public.inventory                add constraint inventory_ws_fkey                   foreign key (workspace_id) references public.workspaces(id) on delete cascade;
  alter table only public.inventory                add constraint inventory_lot_fkey                  foreign key (lot_id)       references public.lots(id)       on delete cascade;
exception when duplicate_object then null; end $$;

-- ── Indexes (workspace + sector scoping + FK columns) ────────────────
create index if not exists idx_formulation_versions_ws        on public.formulation_versions     using btree (workspace_id);
create index if not exists idx_formulation_versions_formulation on public.formulation_versions    using btree (formulation_id, created_at);
create index if not exists idx_spec_metrics_ws_sector         on public.spec_metrics             using btree (workspace_id, sector);
create index if not exists idx_suppliers_ws_sector            on public.suppliers                using btree (workspace_id, sector);
create index if not exists idx_materials_ws_sector            on public.materials                using btree (workspace_id, sector);
create index if not exists idx_materials_supplier             on public.materials                using btree (supplier_id);
create index if not exists idx_target_specs_ws_sector         on public.target_specs            using btree (workspace_id, sector);
create index if not exists idx_target_specs_version           on public.target_specs            using btree (formulation_version_id, metric_id);
create index if not exists idx_master_specs_ws_sector         on public.master_specs            using btree (workspace_id, sector);
create index if not exists idx_master_specs_formulation       on public.master_specs            using btree (formulation_id, metric_id);
create index if not exists idx_msr_master_spec                on public.master_spec_revisions    using btree (master_spec_id, formulation_version_id);
create index if not exists idx_mso_master_spec                on public.master_spec_observations using btree (master_spec_id, scale, revision_id);
create index if not exists idx_msr_supersedes                 on public.master_spec_revisions    using btree (supersedes_id);  -- leaf-of-chain query
create index if not exists idx_mso_supersedes                 on public.master_spec_observations using btree (supersedes_id);  -- leaf-of-chain query
create index if not exists idx_packaging_specs_version        on public.packaging_specs          using btree (formulation_version_id);
create index if not exists idx_bench_top_runs_version         on public.bench_top_runs           using btree (formulation_version_id);
create index if not exists idx_lots_ws_sector                 on public.lots                     using btree (workspace_id, sector);
create index if not exists idx_lots_material                  on public.lots                     using btree (material_id);
create index if not exists idx_lots_batch_origin              on public.lots                     using btree (batch_of_origin_id);
create index if not exists idx_batches_version                on public.batches                  using btree (formulation_version_id);
create index if not exists idx_coas_batch                     on public.coas                     using btree (batch_id);
create index if not exists idx_coas_lot                       on public.coas                     using btree (lot_id);
create index if not exists idx_lot_events_lot                 on public.lot_events               using btree (lot_id, created_at);
create index if not exists idx_lot_events_ws_sector           on public.lot_events               using btree (workspace_id, sector);
create index if not exists idx_inventory_lot                  on public.inventory                using btree (lot_id);

-- ── touch_updated_at triggers (NON-append-only tables only) ──────────
create or replace trigger touch_formulation_versions_updated_at     before update on public.formulation_versions     for each row execute function public.touch_updated_at();
create or replace trigger touch_spec_metrics_updated_at             before update on public.spec_metrics             for each row execute function public.touch_updated_at();
create or replace trigger touch_suppliers_updated_at                before update on public.suppliers                for each row execute function public.touch_updated_at();
create or replace trigger touch_materials_updated_at                before update on public.materials                for each row execute function public.touch_updated_at();
create or replace trigger touch_target_specs_updated_at             before update on public.target_specs            for each row execute function public.touch_updated_at();
create or replace trigger touch_master_specs_updated_at             before update on public.master_specs            for each row execute function public.touch_updated_at();
-- master_spec_revisions: NO touch trigger — append-only (no updated_at; corrections via supersession).
create or replace trigger touch_packaging_specs_updated_at          before update on public.packaging_specs          for each row execute function public.touch_updated_at();
create or replace trigger touch_bench_top_runs_updated_at           before update on public.bench_top_runs           for each row execute function public.touch_updated_at();
create or replace trigger touch_lots_updated_at                     before update on public.lots                     for each row execute function public.touch_updated_at();
create or replace trigger touch_batches_updated_at                  before update on public.batches                  for each row execute function public.touch_updated_at();
create or replace trigger touch_coas_updated_at                     before update on public.coas                     for each row execute function public.touch_updated_at();
create or replace trigger touch_inventory_updated_at                before update on public.inventory                for each row execute function public.touch_updated_at();
-- (lot_events + master_spec_observations: NO touch trigger — append-only, created_at only)

-- ── Enable RLS on every new table ────────────────────────────────────
alter table public.formulation_versions     enable row level security;
alter table public.spec_metrics             enable row level security;
alter table public.suppliers                enable row level security;
alter table public.materials                enable row level security;
alter table public.target_specs            enable row level security;
alter table public.master_specs            enable row level security;
alter table public.master_spec_revisions    enable row level security;
alter table public.master_spec_observations enable row level security;
alter table public.packaging_specs          enable row level security;
alter table public.bench_top_runs           enable row level security;
alter table public.lots                     enable row level security;
alter table public.batches                  enable row level security;
alter table public.coas                     enable row level security;
alter table public.lot_events               enable row level security;
alter table public.inventory                enable row level security;

-- ── RLS policies ─────────────────────────────────────────────────────
-- Standard owner-OR-internal-member pattern (verbatim from 0002), applied to the
-- 13 standard tables via a loop. drop-then-create = idempotent re-run.
-- The 2 append-only tables (lot_events, master_spec_observations) are handled
-- separately below: SELECT + INSERT only, NO update/delete policy → RLS denies
-- UPDATE/DELETE to everyone (the append-only proof, §4.6).
do $$
declare t text;
  standard_tables text[] := array[
    'formulation_versions','spec_metrics','suppliers','materials','target_specs',
    'master_specs','packaging_specs','bench_top_runs',
    'lots','batches','coas','inventory'
  ];
begin
  foreach t in array standard_tables loop
    execute format('drop policy if exists %I on public.%I', t||'_sel', t);
    execute format('drop policy if exists %I on public.%I', t||'_ins', t);
    execute format('drop policy if exists %I on public.%I', t||'_upd', t);
    execute format('drop policy if exists %I on public.%I', t||'_del', t);
    execute format('create policy %I on public.%I for select using (auth.uid() = owner_id or public.is_internal_member(workspace_id))', t||'_sel', t);
    execute format('create policy %I on public.%I for insert with check (auth.uid() = owner_id and (workspace_id is null or public.is_internal_member(workspace_id)))', t||'_ins', t);
    execute format('create policy %I on public.%I for update using (auth.uid() = owner_id or public.is_internal_member(workspace_id))', t||'_upd', t);
    execute format('create policy %I on public.%I for delete using (auth.uid() = owner_id or exists (select 1 from public.workspaces w where w.id = %I.workspace_id and w.owner_id = auth.uid()))', t||'_del', t, t);
  end loop;
end $$;

-- Append-only tables: SELECT + INSERT only (no UPDATE/DELETE policy → denied to all)
do $$
declare t text;
  append_only_tables text[] := array['lot_events','master_spec_observations','master_spec_revisions'];
begin
  foreach t in array append_only_tables loop
    execute format('drop policy if exists %I on public.%I', t||'_sel', t);
    execute format('drop policy if exists %I on public.%I', t||'_ins', t);
    execute format('drop policy if exists %I on public.%I', t||'_no_update', t);
    execute format('drop policy if exists %I on public.%I', t||'_no_delete', t);
    execute format('create policy %I on public.%I for select using (auth.uid() = owner_id or public.is_internal_member(workspace_id))', t||'_sel', t);
    execute format('create policy %I on public.%I for insert with check (auth.uid() = owner_id and (workspace_id is null or public.is_internal_member(workspace_id)))', t||'_ins', t);
    -- RESTRICTIVE deny (review catch): AND-ed with any future permissive policy → UPDATE/DELETE can NEVER be
    -- re-enabled by an accidental permissive copy-paste. The doctrine-correct append-only lock ("never erase").
    execute format('create policy %I on public.%I as restrictive for update using (false)', t||'_no_update', t);
    execute format('create policy %I on public.%I as restrictive for delete using (false)', t||'_no_delete', t);
  end loop;
end $$;

commit;
