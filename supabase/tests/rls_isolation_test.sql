-- ============================================================
-- RLS ISOLATION HARNESS — the LOCKED workspace model (owner_id + workspace_id /
-- is_internal_member). The net under the catastrophic-bug surface.
-- ------------------------------------------------------------
-- Verifies the REAL shipped model (workspaces + workspace_members + is_internal_member),
-- NOT a new org model. Adversarial: a member of workspace A cannot read/write/author
-- workspace B's formulas; anon reads nothing. Run against the live local DB:
--   CID=$(docker ps --format '{{.Names}}' | grep supabase_db)
--   docker exec -i "$CID" psql -U postgres -d postgres -v ON_ERROR_STOP=1 < supabase/tests/rls_isolation_test.sql
-- Any leak raises → the run fails. Transaction + ROLLBACK ⇒ no residue, re-runnable.
-- ============================================================
begin;
\set alice '11111111-1111-1111-1111-111111111111'
\set bob   '22222222-2222-2222-2222-222222222222'
\set wsA   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
\set wsB   'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
\set fA    'f000000a-0000-0000-0000-00000000000a'
\set fB    'f000000b-0000-0000-0000-00000000000b'

-- Seed as the privileged role (bypasses RLS).
insert into auth.users (id, email) values (:'alice','alice@test.dev'),(:'bob','bob@test.dev') on conflict (id) do nothing;
insert into public.workspaces (id, owner_id, name) values (:'wsA', :'alice', 'WS A'), (:'wsB', :'bob', 'WS B');
insert into public.workspace_members (workspace_id, user_id, role_kind, status) values
  (:'wsA', :'alice', 'internal-team', 'active'),
  (:'wsB', :'bob',   'internal-team', 'active');
insert into public.formulations (id, owner_id, workspace_id, name, mode, data) values
  (:'fA', :'alice', :'wsA', 'SECRET A', 'supplements', '{}'::jsonb),
  (:'fB', :'bob',   :'wsB', 'SECRET B', 'supplements', '{}'::jsonb);

-- ════ Alice — member of workspace A only ════
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
do $$
begin
  assert (select count(*) from public.formulations where id = 'f000000a-0000-0000-0000-00000000000a') = 1,
    'FAIL: Alice cannot read her own workspace formula';
  assert (select count(*) from public.formulations where id = 'f000000b-0000-0000-0000-00000000000b') = 0,
    'LEAK: Alice can read workspace B formula (cross-operator data leak)';
  assert (select count(*) from public.formulations) = 1,
    'LEAK: Alice sees formulations beyond her workspace';
  assert (select count(*) from public.workspaces where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb') = 0,
    'LEAK: Alice can see workspace B row';
end $$;

-- Alice cannot AUTHOR into workspace B (with-check: owner AND is_internal_member(B); she is neither member)
do $$
begin
  begin
    insert into public.formulations (owner_id, workspace_id, name, mode, data)
    values ('11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'evil', 'supplements', '{}'::jsonb);
    assert false, 'LEAK: Alice authored a formulation into workspace B';
  exception
    when others then
      if sqlstate = '42501' then null;       -- expected: RLS with-check rejected
      elsif sqlstate = 'P0004' then raise;   -- our assert false (the leak) — propagate
      else null; end if;
  end;
end $$;

-- Alice cannot UPDATE workspace B's formula (0 rows under RLS)
do $$
declare n int;
begin
  update public.formulations set name = 'hijacked' where id = 'f000000b-0000-0000-0000-00000000000b';
  get diagnostics n = row_count;
  assert n = 0, 'LEAK: Alice updated workspace B formula';
end $$;
reset role;

-- ════ Bob — mirror ════
set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
do $$
begin
  assert (select count(*) from public.formulations where id = 'f000000b-0000-0000-0000-00000000000b') = 1, 'FAIL: Bob cannot read his own';
  assert (select count(*) from public.formulations) = 1, 'LEAK: Bob sees beyond his workspace';
end $$;
reset role;

-- ════ anon — reads NOTHING ════
-- MUST clear the JWT claim too — `reset role` alone leaves the prior user's
-- request.jwt.claims set, so auth.uid() would still resolve to them (this was a
-- harness bug that produced a false "anon leak" on the first run).
set local role anon;
set local request.jwt.claims = '';
do $$
begin
  assert (select count(*) from public.formulations) = 0, 'LEAK: anon can read formulations';
  assert (select count(*) from public.workspaces) = 0, 'LEAK: anon can read workspaces';
end $$;
reset role;

do $$ begin raise notice '✓ WORKSPACE RLS ISOLATION HARNESS PASSED — no cross-operator leakage'; end $$;
rollback;
