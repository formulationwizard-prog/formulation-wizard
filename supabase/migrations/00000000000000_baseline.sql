-- ============================================================
-- BASELINE — local-harness mirror of the existing tables (DRAFT)
-- ------------------------------------------------------------
-- WHY THIS EXISTS: `supabase test db` / `supabase start` apply only
-- files in supabase/migrations/. The live tables (profiles,
-- formulations, supplier_qualifications) live in supabase/schema.sql,
-- which is a MANUAL-PASTE file, not a migration — so without this,
-- the WS-C migration can't apply locally and the isolation gate
-- can't run. This recreates ONLY the table DDL + single-tenant RLS
-- the harness needs, so 20260604120000_ws_c_membership.sql has
-- something to build on.
--
-- ⚠️ DELIBERATELY OMITS handle_new_user() / on_auth_user_created.
--    The PROD whitelist version of that trigger (allowed_emails gate)
--    is launch-critical and is NOT in the repo. This baseline must
--    never be the thing that defines that trigger, so it can never
--    clobber prod. The local harness simulates whitelist behaviour
--    inside the test (see tests/ws_c_isolation.test.sql test 7).
--
-- ⚠️ NOT a prod artifact. Prod is provisioned from schema.sql + the
--    out-of-repo whitelist migration. Do NOT `db push` this at prod.
--
-- DRIFT DOCTRINE (until convergence): schema.sql tables and this baseline
--    mirror each other — change one, change both. Post-launch: a CI check
--    that fails on divergence (flagged, not built; not August-blocking).
--
-- Q4 CONVERGENCE MEMO (post-launch, when there's stability headroom):
--    Converting schema.sql → a migration sequence touches handle_new_user
--    directly — launch-critical for the invite gate — so it is the WRONG
--    refactor to attempt before launch. The post-launch move:
--      1. Freeze schema.sql.
--      2. Create 00000000000001_initial.sql from CURRENT PROD STATE
--         (includes the real allowed_emails whitelist handle_new_user).
--      3. Retire the manual-paste workflow.
--      4. Use `supabase db push` going forward (single source of truth).
--    Until then, this baseline stays a deliberate local-only mirror.
-- ============================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  company_name text,
  subscription_tier text not null default 'free'
    check (subscription_tier in ('free', 'starter', 'pro', 'enterprise')),
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
  on public.profiles for select using (auth.uid() = id);
drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id);

create table if not exists public.formulations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  mode text not null check (mode in ('fb', 'baking', 'catering', 'feeds', 'sausage', 'supplements')),
  product_type text,
  part_number text,
  current_version text,
  status text default 'draft' check (status in ('draft', 'in-pilot', 'launched', 'on-hold')),
  tags text[] default '{}',
  project text,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_formulations_owner on public.formulations(owner_id);
alter table public.formulations enable row level security;
-- Single-tenant policies — the WS-C migration DROPS + REPLACES these with
-- owner-OR-member. Present here so a fresh harness DB matches today's prod
-- starting point before WS-C runs.
drop policy if exists "Users can read their own formulations" on public.formulations;
create policy "Users can read their own formulations"
  on public.formulations for select using (auth.uid() = owner_id);
drop policy if exists "Users can insert their own formulations" on public.formulations;
create policy "Users can insert their own formulations"
  on public.formulations for insert with check (auth.uid() = owner_id);
drop policy if exists "Users can update their own formulations" on public.formulations;
create policy "Users can update their own formulations"
  on public.formulations for update using (auth.uid() = owner_id);
drop policy if exists "Users can delete their own formulations" on public.formulations;
create policy "Users can delete their own formulations"
  on public.formulations for delete using (auth.uid() = owner_id);

create table if not exists public.supplier_qualifications (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  supplier_name text not null,
  doc_type text not null,
  issued_date date,
  expiration_date date,
  certifier text,
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists idx_supplier_quals_owner on public.supplier_qualifications(owner_id);
alter table public.supplier_qualifications enable row level security;
drop policy if exists "Users can CRUD their own supplier qualifications" on public.supplier_qualifications;
create policy "Users can CRUD their own supplier qualifications"
  on public.supplier_qualifications for all
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- touch_updated_at — used by triggers below (and by the WS-C migration)
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
drop trigger if exists touch_profiles_updated_at on public.profiles;
create trigger touch_profiles_updated_at
  before update on public.profiles for each row execute function public.touch_updated_at();
drop trigger if exists touch_formulations_updated_at on public.formulations;
create trigger touch_formulations_updated_at
  before update on public.formulations for each row execute function public.touch_updated_at();
