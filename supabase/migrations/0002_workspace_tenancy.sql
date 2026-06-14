-- 0002_workspace_tenancy.sql
-- =====================================================================
-- Brings the RLS-VERIFIED workspace tenancy model to prod (#17 Path B).
--
-- PROVENANCE: recovered verbatim from the 2026-06-08 local Supabase volume
-- (supabase_db_formulation-wizard-live) on 2026-06-14 — the model that was
-- adversarially RLS-tested in supabase/tests/rls_isolation_test.sql but was
-- NEVER deployed to prod. This migration is the forward delta from prod's
-- owner_id baseline (0001_baseline.sql) to that model.
--
-- It is a MERGE, not a lift: prod and the local model had diverged.
--   - Prod has: allowed_emails + whitelist-enforcing handle_new_user(). KEPT.
--   - Local had: workspace model + Stripe columns, but NO whitelist. ADDED.
-- So this keeps prod's whitelist trigger (on_auth_user_created) and ADDS the
-- workspace-creation trigger (on_auth_user_created_workspace) alongside it.
--
-- ⚠️ HARM-CRITICAL — DO NOT APPLY TO PROD UNTIL:
--   1. A prod backup exists (the dashboard shows "No backups"). Enable PITR /
--      take a manual backup first. This rewrites RLS + migrates data.
--   2. supabase/tests/rls_isolation_test.sql passes against the post-migration
--      schema (the adversarial cross-tenant isolation net).
--   3. Operator go. Tenancy + RLS is the most dangerous code in the product.
-- Idempotent where safe (IF NOT EXISTS / DROP ... IF EXISTS) so a re-run or a
-- partial-failure retry is safe.
-- =====================================================================

begin;

-- ── 1. Workspace tables ──────────────────────────────────────────────
create table if not exists public.workspaces (
    id uuid default gen_random_uuid() not null,
    owner_id uuid not null,
    name text default 'My Workspace'::text not null,
    created_at timestamp with time zone default now() not null
);
alter table public.workspaces owner to postgres;

create table if not exists public.workspace_members (
    id uuid default gen_random_uuid() not null,
    workspace_id uuid not null,
    user_id uuid not null,
    role_kind text default 'internal-team'::text not null,
    role text default 'owner'::text not null,
    status text default 'active'::text not null,
    invited_by uuid,
    created_at timestamp with time zone default now() not null,
    constraint workspace_members_role_kind_check check ((role_kind = any (array['internal-team'::text, 'external-collaboration'::text]))),
    constraint workspace_members_status_check check ((status = any (array['pending'::text, 'active'::text, 'revoked'::text])))
);
alter table public.workspace_members owner to postgres;

do $$ begin
  alter table only public.workspaces add constraint workspaces_pkey primary key (id);
exception when duplicate_table or invalid_table_definition then null; end $$;
do $$ begin
  alter table only public.workspace_members add constraint workspace_members_pkey primary key (id);
exception when duplicate_table or invalid_table_definition then null; end $$;
do $$ begin
  alter table only public.workspace_members add constraint workspace_members_workspace_id_user_id_key unique (workspace_id, user_id);
exception when duplicate_table then null; end $$;

-- FKs to auth.users / workspaces
do $$ begin
  alter table only public.workspaces add constraint workspaces_owner_id_fkey foreign key (owner_id) references auth.users(id) on delete cascade;
exception when duplicate_object then null; end $$;
do $$ begin
  alter table only public.workspace_members add constraint workspace_members_workspace_id_fkey foreign key (workspace_id) references public.workspaces(id) on delete cascade;
exception when duplicate_object then null; end $$;
do $$ begin
  alter table only public.workspace_members add constraint workspace_members_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade;
exception when duplicate_object then null; end $$;
do $$ begin
  alter table only public.workspace_members add constraint workspace_members_invited_by_fkey foreign key (invited_by) references auth.users(id);
exception when duplicate_object then null; end $$;

create index if not exists idx_workspaces_owner on public.workspaces using btree (owner_id);
create index if not exists idx_members_user on public.workspace_members using btree (user_id, status);

-- ── 2. Functions (verbatim from the RLS-verified local model) ─────────
create or replace function public.is_internal_member(p_workspace uuid) returns boolean
    language sql stable security definer
    set search_path to 'public'
    as $$
  select exists (
    select 1 from public.workspace_members m
    where m.workspace_id = p_workspace
      and m.user_id      = auth.uid()
      and m.role_kind    = 'internal-team'
      and m.status       = 'active'
  );
$$;
alter function public.is_internal_member(uuid) owner to postgres;

create or replace function public.handle_new_user_workspace() returns trigger
    language plpgsql security definer
    set search_path to 'public'
    as $$
declare ws_id uuid;
begin
  insert into public.workspaces (owner_id, name)
    values (new.id, 'My Workspace')
    returning id into ws_id;
  insert into public.workspace_members (workspace_id, user_id, role_kind, role, status)
    values (ws_id, new.id, 'internal-team', 'owner', 'active');
  return new;
end;
$$;
alter function public.handle_new_user_workspace() owner to postgres;

-- NOTE: prod's public.handle_new_user() (whitelist + profile) is intentionally
-- left UNCHANGED. We do NOT touch allowed_emails or the on_auth_user_created
-- trigger. Beta keeps the whitelist (Decision A); GA drops it separately.

-- ── 3. Tenancy columns on existing entities ──────────────────────────
alter table public.formulations            add column if not exists workspace_id uuid;
alter table public.supplier_qualifications add column if not exists workspace_id uuid;

do $$ begin
  alter table only public.formulations add constraint formulations_workspace_id_fkey foreign key (workspace_id) references public.workspaces(id) on delete cascade;
exception when duplicate_object then null; end $$;
do $$ begin
  alter table only public.supplier_qualifications add constraint supplier_qualifications_workspace_id_fkey foreign key (workspace_id) references public.workspaces(id) on delete cascade;
exception when duplicate_object then null; end $$;

create index if not exists idx_formulations_workspace   on public.formulations using btree (workspace_id);
create index if not exists idx_supplier_quals_workspace on public.supplier_qualifications using btree (workspace_id);

-- ── 4. Billing-foundation columns (additive; from the local model) ────
-- Supports Decision H tiering / Stripe later. No behavior now.
alter table public.profiles add column if not exists stripe_customer_id text;
alter table public.profiles add column if not exists stripe_subscription_id text;

-- ── 5. DATA MIGRATION — every existing user gets a solo workspace ─────
-- (handle_new_user_workspace does this for NEW signups; backfill the old.)
insert into public.workspaces (owner_id, name)
  select p.id, 'My Workspace'
  from public.profiles p
  where not exists (select 1 from public.workspaces w where w.owner_id = p.id);

insert into public.workspace_members (workspace_id, user_id, role_kind, role, status)
  select w.id, w.owner_id, 'internal-team', 'owner', 'active'
  from public.workspaces w
  where not exists (
    select 1 from public.workspace_members m
    where m.workspace_id = w.id and m.user_id = w.owner_id
  );

-- Attach existing rows to their owner's solo workspace.
update public.formulations f
  set workspace_id = w.id
  from public.workspaces w
  where w.owner_id = f.owner_id and f.workspace_id is null;

update public.supplier_qualifications s
  set workspace_id = w.id
  from public.workspaces w
  where w.owner_id = s.owner_id and s.workspace_id is null;

-- ── 6. RLS — swap owner-only policies for owner-OR-member ────────────
-- Drop prod's owner-only policies (names from 0001_baseline.sql).
drop policy if exists "Users can read their own formulations"            on public.formulations;
drop policy if exists "Users can insert their own formulations"          on public.formulations;
drop policy if exists "Users can update their own formulations"          on public.formulations;
drop policy if exists "Users can delete their own formulations"          on public.formulations;
drop policy if exists "Users can CRUD their own supplier qualifications" on public.supplier_qualifications;

-- Formulations: owner OR internal workspace member (verbatim from local model).
create policy "read own or workspace member" on public.formulations
  for select using (((auth.uid() = owner_id) or public.is_internal_member(workspace_id)));
create policy "members author in their workspace" on public.formulations
  for insert with check (((auth.uid() = owner_id) and ((workspace_id is null) or public.is_internal_member(workspace_id))));
create policy "update own or as workspace member" on public.formulations
  for update using (((auth.uid() = owner_id) or public.is_internal_member(workspace_id)));
create policy "delete as creator or workspace owner" on public.formulations
  for delete using (((auth.uid() = owner_id) or (exists (
    select 1 from public.workspaces w where ((w.id = formulations.workspace_id) and (w.owner_id = auth.uid()))))));

-- Supplier qualifications: read own-or-member; writes owner-only.
create policy "read own or workspace member (supplier quals)" on public.supplier_qualifications
  for select using (((auth.uid() = owner_id) or public.is_internal_member(workspace_id)));
create policy "owner writes supplier quals (insert)" on public.supplier_qualifications
  for insert with check ((auth.uid() = owner_id));
create policy "owner writes supplier quals (update)" on public.supplier_qualifications
  for update using ((auth.uid() = owner_id));
create policy "owner writes supplier quals (delete)" on public.supplier_qualifications
  for delete using ((auth.uid() = owner_id));

-- Workspaces + members RLS.
alter table public.workspaces        enable row level security;
alter table public.workspace_members enable row level security;

drop policy if exists "owner manages workspace" on public.workspaces;
create policy "owner manages workspace" on public.workspaces
  using ((auth.uid() = owner_id)) with check ((auth.uid() = owner_id));
drop policy if exists "read workspaces you own or belong to" on public.workspaces;
create policy "read workspaces you own or belong to" on public.workspaces
  for select using (((auth.uid() = owner_id) or public.is_internal_member(id)));

drop policy if exists "owner manages memberships" on public.workspace_members;
create policy "owner manages memberships" on public.workspace_members
  using ((exists (select 1 from public.workspaces w where ((w.id = workspace_members.workspace_id) and (w.owner_id = auth.uid())))))
  with check ((exists (select 1 from public.workspaces w where ((w.id = workspace_members.workspace_id) and (w.owner_id = auth.uid())))));
drop policy if exists "read memberships in your workspaces" on public.workspace_members;
create policy "read memberships in your workspaces" on public.workspace_members
  for select using (((user_id = auth.uid()) or (exists (
    select 1 from public.workspaces w where ((w.id = workspace_members.workspace_id) and (w.owner_id = auth.uid()))))));

grant all on table public.workspaces        to anon, authenticated, service_role;
grant all on table public.workspace_members to anon, authenticated, service_role;
grant all on function public.is_internal_member(uuid)        to anon, authenticated, service_role;
grant all on function public.handle_new_user_workspace()     to anon, authenticated, service_role;

-- ── 7. Signup trigger — workspace auto-creation ALONGSIDE the whitelist ─
-- Prod keeps on_auth_user_created (handle_new_user: whitelist + profile).
-- Add the workspace trigger; fires after profile creation (alpha order).
drop trigger if exists on_auth_user_created_workspace on auth.users;
create trigger on_auth_user_created_workspace
  after insert on auth.users
  for each row execute function public.handle_new_user_workspace();

commit;
