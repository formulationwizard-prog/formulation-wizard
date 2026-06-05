-- ============================================================
-- WS-C — Cross-Company Isolation Negative Tests (pgTAP)
-- ------------------------------------------------------------
-- THE LOAD-BEARING GATE. "Leaks end the company." These prove the
-- August confidentiality milestone: company A's formulations are
-- invisible to anyone outside A's workspace, visible to A's internal
-- members, and revoked members lose access.
--
-- Status: AUTHORED, NOT YET EXECUTED (RED until the local harness is up).
-- Run with:  supabase test db      (needs `supabase start` — see README).
-- Depends on migration: 20260604120000_ws_c_membership.sql
--
-- Scope = August. The external/per-run/redaction adversarial cases
-- (adjacent-run IDOR, RA-can't-read-cost, server-derives-role, token
-- expiry, etc.) live with the POST-LAUNCH layer — see
-- docs/architecture/ws-c-schema-rls-draft-2026-06-04.md §5.
-- ============================================================

begin;
select plan(6);

-- ── Fixtures: three identities ──
--   A = brand owner (company A)      C = A's internal member (R&D)
--   B = unrelated owner (company B)  — the "attacker" from another company
insert into auth.users (id, email) values
  ('a0000000-0000-0000-0000-000000000001', 'a@companyA.com'),
  ('b0000000-0000-0000-0000-000000000002', 'b@companyB.com'),
  ('c0000000-0000-0000-0000-000000000003', 'c@companyA.com')
  on conflict (id) do nothing;

-- A's workspace + internal membership for A and C
insert into public.workspaces (id, owner_id, name) values
  ('11111111-1111-1111-1111-111111111111',
   'a0000000-0000-0000-0000-000000000001', 'Company A');
insert into public.workspace_members (workspace_id, user_id, role_kind, role, status) values
  ('11111111-1111-1111-1111-111111111111','a0000000-0000-0000-0000-000000000001','internal-team','owner','active'),
  ('11111111-1111-1111-1111-111111111111','c0000000-0000-0000-0000-000000000003','internal-team','rd-manager','active');

-- B's own (empty) workspace
insert into public.workspaces (id, owner_id, name) values
  ('22222222-2222-2222-2222-222222222222',
   'b0000000-0000-0000-0000-000000000002', 'Company B');

-- A's secret formulation
insert into public.formulations (id, owner_id, workspace_id, name, mode, data) values
  ('ff000000-0000-0000-0000-0000000000aa',
   'a0000000-0000-0000-0000-000000000001',
   '11111111-1111-1111-1111-111111111111',
   'Company A Secret Sauce', 'supplements', '{}'::jsonb);

-- Helper: become a given authenticated user for the following statements.
create or replace function tests._act_as(uid uuid) returns void
language plpgsql as $$
begin
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', uid)::text, true);
end; $$;

-- ── TEST 1 — cross-company direct-UUID read is BLOCKED ──
select tests._act_as('b0000000-0000-0000-0000-000000000002');
select is(
  (select count(*) from public.formulations
   where id = 'ff000000-0000-0000-0000-0000000000aa')::int,
  0, 'B (company B) cannot read company A formulation by direct UUID');

-- ── TEST 2 — owner reads own formulation ──
select tests._act_as('a0000000-0000-0000-0000-000000000001');
select is(
  (select count(*) from public.formulations
   where id = 'ff000000-0000-0000-0000-0000000000aa')::int,
  1, 'A (owner) reads own formulation');

-- ── TEST 3 — internal member reads workspace formulation ──
select tests._act_as('c0000000-0000-0000-0000-000000000003');
select is(
  (select count(*) from public.formulations
   where id = 'ff000000-0000-0000-0000-0000000000aa')::int,
  1, 'C (internal member of A) reads the workspace formulation');

-- ── TEST 4 — unrelated user cannot enumerate ANY of A's rows ──
select tests._act_as('b0000000-0000-0000-0000-000000000002');
select is(
  (select count(*) from public.formulations)::int,
  0, 'B sees zero formulations via unfiltered select (no enumeration)');

-- ── TEST 5 — REVOKED member loses read (distinct from never-a-member) ──
reset role;
update public.workspace_members set status = 'revoked'
  where user_id = 'c0000000-0000-0000-0000-000000000003';
select tests._act_as('c0000000-0000-0000-0000-000000000003');
select is(
  (select count(*) from public.formulations
   where id = 'ff000000-0000-0000-0000-0000000000aa')::int,
  0, 'C after revocation can no longer read the formulation');

-- ── TEST 6 — write-path: outsider cannot UPDATE A's formulation ──
-- (Confirms isolation is enforced server-side on writes, not just reads.)
select tests._act_as('b0000000-0000-0000-0000-000000000002');
with attempt as (
  update public.formulations
    set name = 'HACKED'
    where id = 'ff000000-0000-0000-0000-0000000000aa'
    returning 1
)
select is((select count(*) from attempt)::int, 0,
  'B cannot UPDATE company A formulation (0 rows affected)');

select * from finish();
rollback;
