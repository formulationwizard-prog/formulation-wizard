-- ============================================================
-- FORMULATION WIZARD — Supabase Schema (v1)
-- ------------------------------------------------------------
-- Run this in the Supabase SQL editor (Dashboard → SQL → New query).
-- Idempotent — safe to run multiple times.
--
-- Design principles:
--   • Every row is scoped to a user via owner_id = auth.uid()
--   • Row-level security is ENABLED on every table
--   • Policies only allow reading/writing your own rows
--   • No server-side admin code is needed for basic CRUD
--   • JSON columns store the formulation payload (versioned
--     snapshot model) so schema evolution is cheap
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- PROFILES — auto-created on signup via trigger. Holds the
-- public-facing user info (name, company) + subscription tier.
-- ────────────────────────────────────────────────────────────
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
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create a profile row on user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ────────────────────────────────────────────────────────────
-- FORMULATIONS — one row per saved formula. The heavy payload
-- (ingredients, nutrition, packaging, version history) is in
-- the `data` JSONB column. Indexed fields sit as top-level
-- columns for fast filtering.
-- ────────────────────────────────────────────────────────────
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
  -- Full formulation payload (matches SavedFormulation type in types/index.ts)
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_formulations_owner on public.formulations(owner_id);
create index if not exists idx_formulations_mode on public.formulations(owner_id, mode);
create index if not exists idx_formulations_updated on public.formulations(owner_id, updated_at desc);
create unique index if not exists idx_formulations_part_number on public.formulations(owner_id, part_number)
  where part_number is not null;

alter table public.formulations enable row level security;

drop policy if exists "Users can read their own formulations" on public.formulations;
create policy "Users can read their own formulations"
  on public.formulations for select
  using (auth.uid() = owner_id);

drop policy if exists "Users can insert their own formulations" on public.formulations;
create policy "Users can insert their own formulations"
  on public.formulations for insert
  with check (auth.uid() = owner_id);

drop policy if exists "Users can update their own formulations" on public.formulations;
create policy "Users can update their own formulations"
  on public.formulations for update
  using (auth.uid() = owner_id);

drop policy if exists "Users can delete their own formulations" on public.formulations;
create policy "Users can delete their own formulations"
  on public.formulations for delete
  using (auth.uid() = owner_id);

-- Auto-touch updated_at
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_formulations_updated_at on public.formulations;
create trigger touch_formulations_updated_at
  before update on public.formulations
  for each row execute function public.touch_updated_at();

drop trigger if exists touch_profiles_updated_at on public.profiles;
create trigger touch_profiles_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ────────────────────────────────────────────────────────────
-- SUPPLIER QUALIFICATIONS — per-user supplier/doc tracker
-- (already exists in localStorage under fw-supplier-qualifications-v1;
-- mirrors that structure for cloud sync).
-- ────────────────────────────────────────────────────────────
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
create index if not exists idx_supplier_quals_expiration on public.supplier_qualifications(owner_id, expiration_date);

alter table public.supplier_qualifications enable row level security;

drop policy if exists "Users can CRUD their own supplier qualifications" on public.supplier_qualifications;
create policy "Users can CRUD their own supplier qualifications"
  on public.supplier_qualifications for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- ────────────────────────────────────────────────────────────
-- DONE — verify with:
--   select tablename, rowsecurity from pg_tables
--   where schemaname = 'public' order by tablename;
-- Every row should show rowsecurity = t (true).
-- ────────────────────────────────────────────────────────────
