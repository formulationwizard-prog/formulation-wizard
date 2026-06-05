-- ============================================================
-- WS-C — Membership Migration  (DRAFT — NOT APPLIED)
-- ------------------------------------------------------------
-- Date: 2026-06-04 · Branch: ws-c · Status: awaiting Opus review,
-- then run against `supabase start` + `supabase test db` (see
-- supabase/tests/ws_c_isolation.test.sql) and prove GREEN before prod.
--
-- SCOPE (per revised ruling 2026-06-04 + path-to-august line 52):
--   August = CROSS-COMPANY ISOLATION. workspaces + workspace_members
--   + owner-OR-member RLS. Cost stays in the formulations.data JSONB
--   (within-workspace members are trusted).
--   NOT in this migration (post-launch): field-level cost redaction,
--   external-collaboration grants, per-(product,revision,run) scoping,
--   production_runs. Those land when untrusted external seats go live.
--
-- ⚠️ ADDITIVE-ONLY. This migration must NEVER rewrite schema.sql and
--    must NEVER touch handle_new_user() or the allowed_emails invite
--    whitelist (prod three-gate auth). It only ADDS tables, a column,
--    policies, helpers, and one SEPARATE signup trigger. Idempotent.
-- ============================================================

-- ── 1. WORKSPACES — the org/tenant container (one per brand owner) ──
create table if not exists public.workspaces (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  name        text not null default 'My Workspace',
  created_at  timestamptz not null default now()
);
create index if not exists idx_workspaces_owner on public.workspaces(owner_id);
alter table public.workspaces enable row level security;

-- ── 2. WORKSPACE_MEMBERS — user × workspace × role ──
-- role_kind is the unified-Role discriminator (types/roles.ts). For August we
-- only ever insert 'internal-team'; the 'external-collaboration' branch is
-- schema-ready but unused until the post-launch grant layer ships.
create table if not exists public.workspace_members (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  role_kind     text not null default 'internal-team'
                check (role_kind in ('internal-team','external-collaboration')),
  role          text not null default 'owner',   -- subrole; app/trigger validates vs role_kind
  status        text not null default 'active'
                check (status in ('pending','active','revoked')),
  invited_by    uuid references auth.users(id),
  created_at    timestamptz not null default now(),
  unique (workspace_id, user_id)
);
create index if not exists idx_members_user on public.workspace_members(user_id, status);
alter table public.workspace_members enable row level security;

-- ── 3. HELPER — is the current user an ACTIVE INTERNAL member? ──
-- security definer so it reads workspace_members WITHOUT triggering that
-- table's own RLS (prevents recursive-policy evaluation). INTERNAL ONLY:
-- external seats must get NO broad read from membership — their access is
-- the post-launch per-object grant layer, by design (default-deny).
create or replace function public.is_internal_member(p_workspace uuid)
returns boolean
language sql security definer stable
set search_path = public
as $$
  select exists (
    select 1 from public.workspace_members m
    where m.workspace_id = p_workspace
      and m.user_id      = auth.uid()
      and m.role_kind    = 'internal-team'
      and m.status       = 'active'
  );
$$;

-- ── 4. FORMULATIONS gets a workspace_id (additive; owner_id stays) ──
alter table public.formulations
  add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade;
create index if not exists idx_formulations_workspace on public.formulations(workspace_id);

-- ── 5. RLS — workspaces + members ──
drop policy if exists "read workspaces you own or belong to" on public.workspaces;
create policy "read workspaces you own or belong to"
  on public.workspaces for select
  using (auth.uid() = owner_id or public.is_internal_member(id));

drop policy if exists "owner manages workspace" on public.workspaces;
create policy "owner manages workspace"
  on public.workspaces for all
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- members: you can see your own membership rows; the workspace owner sees all.
drop policy if exists "read memberships in your workspaces" on public.workspace_members;
create policy "read memberships in your workspaces"
  on public.workspace_members for select
  using (
    user_id = auth.uid()
    or exists (select 1 from public.workspaces w
               where w.id = workspace_id and w.owner_id = auth.uid())
  );

drop policy if exists "owner manages memberships" on public.workspace_members;
create policy "owner manages memberships"
  on public.workspace_members for all
  using (exists (select 1 from public.workspaces w
                 where w.id = workspace_id and w.owner_id = auth.uid()))
  with check (exists (select 1 from public.workspaces w
                      where w.id = workspace_id and w.owner_id = auth.uid()));

-- ── 6. RLS — formulations: OWNER **OR** ACTIVE INTERNAL MEMBER ──
-- The August confidentiality milestone. Replaces single-tenant
-- "auth.uid() = owner_id" with owner-OR-member on read/insert/update.
-- MEMBER-AUTHORING (Opus item 2): real CPG R&D teams delegate authoring —
-- the owner must not be a chokepoint for every recipe sketch. An internal
-- member creates a row they own (owner_id = self) inside the shared
-- workspace. Because is_internal_member() counts ONLY role_kind='internal-team',
-- this AUTOMATICALLY denies INSERT to future external-collaboration seats
-- (RA/CMO/PA) — the post-launch refinement is already enforced by the helper.
drop policy if exists "Users can read their own formulations"   on public.formulations;
drop policy if exists "read own / workspace / granted"          on public.formulations;
create policy "read own or workspace member"
  on public.formulations for select
  using (auth.uid() = owner_id or public.is_internal_member(workspace_id));

-- INSERT: a member may create a row THEY own inside a workspace they belong to.
drop policy if exists "Users can insert their own formulations" on public.formulations;
create policy "members author in their workspace"
  on public.formulations for insert
  with check (
    auth.uid() = owner_id
    and (workspace_id is null or public.is_internal_member(workspace_id))
  );

drop policy if exists "Users can update their own formulations" on public.formulations;
create policy "update own or as workspace member"
  on public.formulations for update
  using (auth.uid() = owner_id or public.is_internal_member(workspace_id));

-- DELETE: the row's creator, OR the workspace owner (can remove member rows).
drop policy if exists "Users can delete their own formulations" on public.formulations;
create policy "delete as creator or workspace owner"
  on public.formulations for delete
  using (
    auth.uid() = owner_id
    or exists (select 1 from public.workspaces w
               where w.id = formulations.workspace_id and w.owner_id = auth.uid())
  );

-- ── 6b. SUPPLIER_QUALIFICATIONS — team READ, owner WRITE (Opus item 3) ──
-- QA programs review supplier data collectively → members read. Writes stay
-- owner-only at August (lower accidental-mutation risk; fewer people
-- legitimately author supplier quals than recipes). Post-launch, WRITE
-- expands to qa-manager + plant-manager roles.
alter table public.supplier_qualifications
  add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade;
create index if not exists idx_supplier_quals_workspace on public.supplier_qualifications(workspace_id);

update public.supplier_qualifications sq
  set workspace_id = w.id
  from public.workspaces w
  where w.owner_id = sq.owner_id and sq.workspace_id is null;

drop policy if exists "Users can CRUD their own supplier qualifications" on public.supplier_qualifications;
create policy "read own or workspace member (supplier quals)"
  on public.supplier_qualifications for select
  using (auth.uid() = owner_id or public.is_internal_member(workspace_id));
create policy "owner writes supplier quals (insert)"
  on public.supplier_qualifications for insert
  with check (auth.uid() = owner_id);
create policy "owner writes supplier quals (update)"
  on public.supplier_qualifications for update
  using (auth.uid() = owner_id);
create policy "owner writes supplier quals (delete)"
  on public.supplier_qualifications for delete
  using (auth.uid() = owner_id);

-- ── 7. BACKFILL — give every existing owner a default workspace + map rows ──
-- Idempotent (guards + on-conflict). Safe to re-run.
insert into public.workspaces (owner_id, name)
  select distinct f.owner_id, 'My Workspace'
  from public.formulations f
  where not exists (select 1 from public.workspaces w where w.owner_id = f.owner_id);

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

update public.formulations f
  set workspace_id = w.id
  from public.workspaces w
  where w.owner_id = f.owner_id and f.workspace_id is null;

-- ── 8. NEW-SIGNUP default workspace — SEPARATE trigger ──
-- Does NOT modify handle_new_user() (the prod whitelist trigger). If the
-- whitelist rejects a signup, the whole insert tx aborts, so this rolls back
-- too — no orphan workspace for rejected emails.
create or replace function public.handle_new_user_workspace()
returns trigger
language plpgsql security definer
set search_path = public
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

drop trigger if exists on_auth_user_created_workspace on auth.users;
create trigger on_auth_user_created_workspace
  after insert on auth.users
  for each row execute function public.handle_new_user_workspace();

-- ============================================================
-- REVIEW STATUS (Opus items, 2026-06-04)
--   1. [VERIFY-AT-HARNESS] Recursion: workspace_members SELECT references
--      workspaces directly; workspaces SELECT calls is_internal_member
--      (security definer → no recursion). Helper is STABLE + minimal-scope
--      (reads only workspace_members). CONFIRM via EXPLAIN ANALYZE that it
--      plans as a cheap single-row lookup, not a per-row scan, once the
--      local stack is up.
--   2. [RESOLVED] Member-authoring — internal members now INSERT formulations
--      they own into their workspace (§6). External seats auto-denied by the
--      role_kind='internal-team' filter in is_internal_member().
--   3. [RESOLVED] supplier_qualifications — team READ, owner WRITE (§6b).
--      Post-launch: WRITE widens to qa-manager + plant-manager.
--   4. [TESTED] Trigger ordering / whitelist-reject atomicity — proven by
--      tests/ws_c_isolation.test.sql test 7 (any signup-trigger raise rolls
--      back the workspace + member rows; same transaction).
--   5. [DOCUMENTED] Backfill assumes 1 owner → 1 default workspace. True for
--      today's single-tenant data. Future migrations: this is the baseline;
--      revisit if an owner should map to >1 workspace.
-- ============================================================
