-- ============================================================
-- WS-C — Cross-Company Isolation + Membership Negative Tests (pgTAP)
-- ------------------------------------------------------------
-- THE LOAD-BEARING GATE. "Leaks end the company." Proves the August
-- milestone: company A's formulations are invisible outside A's
-- workspace, visible to A's internal members, member-authoring works,
-- supplier quals are team-read/owner-write, revoked members lose
-- access, and a rejected signup rolls back its workspace cleanly.
--
-- Status: GREEN — 14/14 (first executed 2026-06-04; enforced in CI on push to ws-c).
-- Run with:  bash scripts/run-db-tests.sh   (needs `supabase start` — see README).
--   NOT `supabase test db`: that needs the pg_prove image, which won't pull on the dev
--   box; the runner executes pgTAP through psql instead. See README "Local RLS test
--   harness" for the rationale.
-- Applies migrations: 00000000000000_baseline.sql → 20260604120000_ws_c_membership.sql
--
-- NOTE: superuser BYPASSES RLS, so each check runs as the non-bypassing
-- `authenticated` role with a simulated JWT `sub`. The signup trigger
-- (on_auth_user_created_workspace) is LEFT ENABLED — it auto-creates an
-- empty default workspace per user; tests assert by row id/owner, so the
-- extra empty workspaces are harmless. pgTAP syntax validated at harness time.
--
-- Out of scope (post-launch external layer): adjacent-run IDOR, RA-can't-
-- read-cost redaction, server-derives-role, token expiry — see
-- docs/architecture/ws-c-schema-rls-draft-2026-06-04.md §5.
-- ============================================================

begin;
select plan(14);

-- Helper: act as a given authenticated user for following statements.
create or replace function tests._act_as(uid uuid) returns void
language plpgsql as $$
begin
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', uid)::text, true);
end; $$;

-- ── Fixtures (as superuser) ──
--   A = owner (company A)   C = A's internal member (R&D)   B = unrelated owner (company B)
reset role;
insert into auth.users (id, email) values
  ('a0000000-0000-0000-0000-000000000001', 'a@companyA.com'),
  ('b0000000-0000-0000-0000-000000000002', 'b@companyB.com'),
  ('c0000000-0000-0000-0000-000000000003', 'c@companyA.com')
  on conflict (id) do nothing;

insert into public.workspaces (id, owner_id, name) values
  ('11111111-1111-1111-1111-111111111111','a0000000-0000-0000-0000-000000000001','Company A'),
  ('22222222-2222-2222-2222-222222222222','b0000000-0000-0000-0000-000000000002','Company B');

insert into public.workspace_members (workspace_id, user_id, role_kind, role, status) values
  ('11111111-1111-1111-1111-111111111111','a0000000-0000-0000-0000-000000000001','internal-team','owner','active'),
  ('11111111-1111-1111-1111-111111111111','c0000000-0000-0000-0000-000000000003','internal-team','rd-manager','active');

insert into public.formulations (id, owner_id, workspace_id, name, mode, data) values
  ('ff000000-0000-0000-0000-0000000000aa','a0000000-0000-0000-0000-000000000001',
   '11111111-1111-1111-1111-111111111111','Company A Secret Sauce','supplements','{}'::jsonb);

insert into public.supplier_qualifications (id, owner_id, workspace_id, supplier_name, doc_type) values
  ('5c000000-0000-0000-0000-0000000000aa','a0000000-0000-0000-0000-000000000001',
   '11111111-1111-1111-1111-111111111111','Acme Botanicals','cGMP');

-- ── 1. cross-company direct-UUID read BLOCKED ──
select tests._act_as('b0000000-0000-0000-0000-000000000002');
select is((select count(*) from public.formulations
           where id='ff000000-0000-0000-0000-0000000000aa')::int, 0,
  'B (company B) cannot read company A formulation by direct UUID');

-- ── 2. owner reads own ──
select tests._act_as('a0000000-0000-0000-0000-000000000001');
select is((select count(*) from public.formulations
           where id='ff000000-0000-0000-0000-0000000000aa')::int, 1,
  'A (owner) reads own formulation');

-- ── 3. internal member reads workspace formulation ──
select tests._act_as('c0000000-0000-0000-0000-000000000003');
select is((select count(*) from public.formulations
           where id='ff000000-0000-0000-0000-0000000000aa')::int, 1,
  'C (internal member) reads the workspace formulation');

-- ── 4. unrelated user cannot enumerate ANY of A's rows ──
select tests._act_as('b0000000-0000-0000-0000-000000000002');
select is((select count(*) from public.formulations)::int, 0,
  'B sees zero formulations via unfiltered select (no enumeration)');

-- ── 5. write-path: outsider cannot UPDATE A's formulation ──
select tests._act_as('b0000000-0000-0000-0000-000000000002');
with attempt as (
  update public.formulations set name='HACKED'
   where id='ff000000-0000-0000-0000-0000000000aa' returning 1)
select is((select count(*) from attempt)::int, 0,
  'B cannot UPDATE company A formulation (0 rows affected)');

-- ── 6. member-authoring (item 2): C creates a formulation it owns in the workspace ──
select tests._act_as('c0000000-0000-0000-0000-000000000003');
insert into public.formulations (id, owner_id, workspace_id, name, mode, data) values
  ('ff000000-0000-0000-0000-0000000000cc','c0000000-0000-0000-0000-000000000003',
   '11111111-1111-1111-1111-111111111111','C''s draft','supplements','{}'::jsonb);
select is((select count(*) from public.formulations
           where id='ff000000-0000-0000-0000-0000000000cc')::int, 1,
  'C (internal member) can author a formulation in the shared workspace');

-- ── 7. team visibility: owner A reads the member-authored formulation ──
select tests._act_as('a0000000-0000-0000-0000-000000000001');
select is((select count(*) from public.formulations
           where id='ff000000-0000-0000-0000-0000000000cc')::int, 1,
  'A (owner) reads the member-authored formulation');

-- ── 8. supplier quals: member READ allowed (item 3) ──
select tests._act_as('c0000000-0000-0000-0000-000000000003');
select is((select count(*) from public.supplier_qualifications
           where id='5c000000-0000-0000-0000-0000000000aa')::int, 1,
  'C (member) can READ the workspace supplier qualification');

-- ── 9. supplier quals: member cannot WRITE the owner''s row (item 3) ──
select tests._act_as('c0000000-0000-0000-0000-000000000003');
with attempt as (
  update public.supplier_qualifications set notes='tampered'
   where id='5c000000-0000-0000-0000-0000000000aa' returning 1)
select is((select count(*) from attempt)::int, 0,
  'C (member) cannot UPDATE the owner''s supplier qualification (owner-write only)');

-- ── 10. supplier quals: outsider B cannot read ──
select tests._act_as('b0000000-0000-0000-0000-000000000002');
select is((select count(*) from public.supplier_qualifications
           where id='5c000000-0000-0000-0000-0000000000aa')::int, 0,
  'B (company B) cannot read company A supplier qualification');

-- ── 11. REVOKED member loses read (distinct from never-a-member) ──
reset role;
update public.workspace_members set status='revoked'
  where user_id='c0000000-0000-0000-0000-000000000003'
    and workspace_id='11111111-1111-1111-1111-111111111111';
select tests._act_as('c0000000-0000-0000-0000-000000000003');
select is((select count(*) from public.formulations
           where id='ff000000-0000-0000-0000-0000000000aa')::int, 0,
  'C after revocation can no longer read the workspace formulation');

-- ── 12. signup trigger POSITIVE: a new user auto-gets a workspace + membership ──
reset role;
insert into auth.users (id, email) values
  ('d0000000-0000-0000-0000-000000000004','d@newco.com') on conflict (id) do nothing;
select is(
  (select count(*) from public.workspaces w
     join public.workspace_members m on m.workspace_id = w.id and m.user_id = w.owner_id
   where w.owner_id='d0000000-0000-0000-0000-000000000004'
     and m.role_kind='internal-team' and m.status='active')::int, 1,
  'new signup auto-creates a default workspace + owner membership');

-- ── 13. whitelist-reject ATOMICITY (item 4): a raising signup trigger rolls
--      back the workspace + member rows too (same transaction). Simulates the
--      prod allowed_emails gate (not in repo) with a fixture trigger that
--      sorts BEFORE on_auth_user_created_workspace and raises. ──
reset role;
create or replace function public._aaa_whitelist_sim() returns trigger
language plpgsql as $$
begin
  if new.email = 'blocked@nope.com' then
    raise exception 'email not on invite whitelist';
  end if;
  return new;
end; $$;
drop trigger if exists aaa_whitelist_sim on auth.users;
create trigger aaa_whitelist_sim after insert on auth.users
  for each row execute function public._aaa_whitelist_sim();

select throws_ok(
  $$ insert into auth.users (id, email)
       values ('e0000000-0000-0000-0000-000000000005','blocked@nope.com') $$,
  'email not on invite whitelist',
  'rejected signup raises (whitelist gate fires)');

select is(
  (select count(*) from public.workspaces
   where owner_id='e0000000-0000-0000-0000-000000000005')::int, 0,
  'rejected signup left NO orphan workspace (atomic rollback)');

select * from finish();
rollback;
