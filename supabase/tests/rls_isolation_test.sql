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
-- 0003 spine rows (one per workspace)
\set vA    'a0000001-0000-0000-0000-00000000000a'
\set vB    'b0000001-0000-0000-0000-00000000000b'
\set mA    'a0000003-0000-0000-0000-00000000000a'
\set mB    'b0000003-0000-0000-0000-00000000000b'
\set msA   'a0000004-0000-0000-0000-00000000000a'
\set msB   'b0000004-0000-0000-0000-00000000000b'
\set lotA  'a0000002-0000-0000-0000-00000000000a'
\set lotB  'b0000002-0000-0000-0000-00000000000b'
\set evA   'a0000005-0000-0000-0000-00000000000a'
\set evB   'b0000005-0000-0000-0000-00000000000b'
\set obsA  'a0000006-0000-0000-0000-00000000000a'
\set obsB  'b0000006-0000-0000-0000-00000000000b'
\set supA  'a0000007-0000-0000-0000-00000000000a'
\set supB  'b0000007-0000-0000-0000-00000000000b'
\set matA  'a0000008-0000-0000-0000-00000000000a'
\set matB  'b0000008-0000-0000-0000-00000000000b'
\set revA  'a0000009-0000-0000-0000-00000000000a'
\set revB  'b0000009-0000-0000-0000-00000000000b'

-- Seed as the privileged role (bypasses RLS).
insert into auth.users (id, email) values (:'alice','alice@test.dev'),(:'bob','bob@test.dev') on conflict (id) do nothing;
insert into public.workspaces (id, owner_id, name) values (:'wsA', :'alice', 'WS A'), (:'wsB', :'bob', 'WS B');
insert into public.workspace_members (workspace_id, user_id, role_kind, status) values
  (:'wsA', :'alice', 'internal-team', 'active'),
  (:'wsB', :'bob',   'internal-team', 'active');
insert into public.formulations (id, owner_id, workspace_id, name, mode, data) values
  (:'fA', :'alice', :'wsA', 'SECRET A', 'supplements', '{}'::jsonb),
  (:'fB', :'bob',   :'wsB', 'SECRET B', 'supplements', '{}'::jsonb);
-- 0003 spine rows — seeded privileged in both workspaces (FK chain: version→lot→event, spec→obs)
insert into public.formulation_versions (id, owner_id, workspace_id, sector, formulation_id, version, snapshot) values
  (:'vA', :'alice', :'wsA', 'supplements', :'fA', '1.0.0', '{}'::jsonb),
  (:'vB', :'bob',   :'wsB', 'supplements', :'fB', '1.0.0', '{}'::jsonb);
insert into public.spec_metrics (id, owner_id, workspace_id, sector, name) values
  (:'mA', :'alice', :'wsA', 'supplements', 'pH'),
  (:'mB', :'bob',   :'wsB', 'supplements', 'pH');
insert into public.master_specs (id, owner_id, workspace_id, sector, formulation_id, metric_id) values
  (:'msA', :'alice', :'wsA', 'supplements', :'fA', :'mA'),
  (:'msB', :'bob',   :'wsB', 'supplements', :'fB', :'mB');
insert into public.master_spec_revisions (id, owner_id, workspace_id, sector, master_spec_id, formulation_version_id, metric_invalidated_by_revision) values
  (:'revA', :'alice', :'wsA', 'supplements', :'msA', :'vA', false),
  (:'revB', :'bob',   :'wsB', 'supplements', :'msB', :'vB', false);
insert into public.suppliers (id, owner_id, workspace_id, sector, name) values
  (:'supA', :'alice', :'wsA', 'supplements', 'Supplier A'),
  (:'supB', :'bob',   :'wsB', 'supplements', 'Supplier B');
insert into public.materials (id, owner_id, workspace_id, sector, name, supplier_id) values
  (:'matA', :'alice', :'wsA', 'supplements', 'Mag Glycinate', :'supA'),
  (:'matB', :'bob',   :'wsB', 'supplements', 'Mag Glycinate', :'supB');
-- material lots now require material_id (discriminator CHECK)
insert into public.lots (id, owner_id, workspace_id, sector, lot_kind, material_id, lot_code) values
  (:'lotA', :'alice', :'wsA', 'supplements', 'material', :'matA', 'LOT-A'),
  (:'lotB', :'bob',   :'wsB', 'supplements', 'material', :'matB', 'LOT-B');
insert into public.lot_events (id, owner_id, workspace_id, sector, lot_id, event_type, quantity_delta) values
  (:'evA', :'alice', :'wsA', 'supplements', :'lotA', 'receipt', 10),
  (:'evB', :'bob',   :'wsB', 'supplements', :'lotB', 'receipt', 10);
insert into public.master_spec_observations (id, owner_id, workspace_id, sector, master_spec_id, revision_id, value, scale) values
  (:'obsA', :'alice', :'wsA', 'supplements', :'msA', :'vA', '4.2', 'production'),
  (:'obsB', :'bob',   :'wsB', 'supplements', :'msB', :'vB', '4.2', 'production');

-- ════ Alice — member of workspace A only ════
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';  -- dotted form too (portable across auth.uid() impls)
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
set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';  -- dotted form too
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
set local request.jwt.claim.sub = '';  -- clear dotted form too, else prior user's sub leaks
do $$
begin
  assert (select count(*) from public.formulations) = 0, 'LEAK: anon can read formulations';
  assert (select count(*) from public.workspaces) = 0, 'LEAK: anon can read workspaces';
end $$;
reset role;

-- ════ 0003 spine tables — cross-tenant isolation + append-only ════
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';  -- dotted form too (portable across auth.uid() impls)
do $$
begin
  assert (select count(*) from public.formulation_versions) = 1, 'LEAK: Alice sees versions beyond her workspace';
  assert (select count(*) from public.lots) = 1, 'LEAK: Alice sees lots beyond her workspace';
  assert (select count(*) from public.lot_events) = 1, 'LEAK: Alice sees lot_events beyond her workspace';
  assert (select count(*) from public.master_specs) = 1, 'LEAK: Alice sees master_specs beyond her workspace';
  assert (select count(*) from public.master_spec_observations) = 1, 'LEAK: Alice sees observations beyond her workspace';
  assert (select count(*) from public.master_spec_revisions) = 1, 'LEAK: Alice sees revisions beyond her workspace';
end $$;

-- Append-only proof (§4.6): INSERT into own workspace OK; UPDATE/DELETE denied (no policy → 0 rows)
do $$
declare n int;
begin
  insert into public.lot_events (owner_id, workspace_id, sector, lot_id, event_type, quantity_delta)
    values ('11111111-1111-1111-1111-111111111111','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','supplements','a0000002-0000-0000-0000-00000000000a','adjustment',1);
  update public.lot_events set quantity_delta = 999 where id = 'a0000005-0000-0000-0000-00000000000a';
  get diagnostics n = row_count;
  assert n = 0, 'APPEND-ONLY VIOLATION: Alice updated a lot_event';
  delete from public.lot_events where id = 'a0000005-0000-0000-0000-00000000000a';
  get diagnostics n = row_count;
  assert n = 0, 'APPEND-ONLY VIOLATION: Alice deleted a lot_event';
  update public.master_spec_observations set value = 'tampered' where id = 'a0000006-0000-0000-0000-00000000000a';
  get diagnostics n = row_count;
  assert n = 0, 'APPEND-ONLY VIOLATION: Alice updated an observation';
  delete from public.master_spec_observations where id = 'a0000006-0000-0000-0000-00000000000a';
  get diagnostics n = row_count;
  assert n = 0, 'APPEND-ONLY VIOLATION: Alice deleted an observation';
  update public.master_spec_revisions set metric_invalidated_by_revision = true where id = 'a0000009-0000-0000-0000-00000000000a';
  get diagnostics n = row_count;
  assert n = 0, 'APPEND-ONLY VIOLATION: Alice updated a revision';
  delete from public.master_spec_revisions where id = 'a0000009-0000-0000-0000-00000000000a';
  get diagnostics n = row_count;
  assert n = 0, 'APPEND-ONLY VIOLATION: Alice deleted a revision';
end $$;

-- Alice cannot author a lot into workspace B (with-check: owner AND member of B; she is neither)
do $$
begin
  begin
    insert into public.lots (owner_id, workspace_id, sector, lot_kind, material_id, lot_code)
      values ('11111111-1111-1111-1111-111111111111','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','supplements','material','a0000008-0000-0000-0000-00000000000a','evil-lot');
    assert false, 'LEAK: Alice authored a lot into workspace B';
  exception
    when others then
      if sqlstate = '42501' then null;
      elsif sqlstate = 'P0004' then raise;
      else null; end if;
  end;
end $$;

-- Supersession (the strike-through): a correction is a NEW row pointing at the original; leaf-of-chain = current
do $$
begin
  insert into public.master_spec_revisions (owner_id, workspace_id, sector, master_spec_id, formulation_version_id, metric_invalidated_by_revision, supersedes_id, correction_reason)
    values ('11111111-1111-1111-1111-111111111111','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','supplements','a0000004-0000-0000-0000-00000000000a','a0000001-0000-0000-0000-00000000000a', true, 'a0000009-0000-0000-0000-00000000000a', 'reclassified after re-review');
  -- leaf-of-chain (canonical "current"): the row no other row supersedes
  assert (select count(*) from public.master_spec_revisions r
            where r.master_spec_id = 'a0000004-0000-0000-0000-00000000000a'
              and not exists (select 1 from public.master_spec_revisions s where s.supersedes_id = r.id)) = 1,
    'SUPERSESSION: leaf-of-chain should be exactly the 1 correction row';
  assert (select r.metric_invalidated_by_revision from public.master_spec_revisions r
            where r.master_spec_id = 'a0000004-0000-0000-0000-00000000000a'
              and not exists (select 1 from public.master_spec_revisions s where s.supersedes_id = r.id)) = true,
    'SUPERSESSION: leaf should be the correction (invalidated=true), not the original';
  assert (select count(*) from public.master_spec_revisions where master_spec_id = 'a0000004-0000-0000-0000-00000000000a') = 2,
    'SUPERSESSION: the original must still be queryable in history (never erased)';
end $$;

-- lots discriminator CHECK rejects an impossible row (material lot, no material) at INSERT
do $$
begin
  begin
    insert into public.lots (owner_id, workspace_id, sector, lot_kind, lot_code)
      values ('11111111-1111-1111-1111-111111111111','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','supplements','material','orphan-lot');
    assert false, 'CHECK MISSING: lots accepted a material lot with NULL material_id';
  exception
    when check_violation then null;       -- expected: discriminator CHECK rejected
    when others then if sqlstate = 'P0004' then raise; else null; end if;
  end;
end $$;

-- Solo case (workspace_id NULL): owner can create + read a spine row with no workspace (uniform across the spine)
do $$
declare n int;
begin
  insert into public.suppliers (owner_id, workspace_id, sector, name)
    values ('11111111-1111-1111-1111-111111111111', null, 'supplements', 'Solo Supplier');
  get diagnostics n = row_count;
  assert n = 1, 'SOLO: owner cannot insert a spine row with NULL workspace_id';
  assert (select count(*) from public.suppliers where name = 'Solo Supplier') = 1, 'SOLO: owner cannot read their own NULL-workspace row';
end $$;
reset role;

-- RESTRICTIVE deny actually beats a (future) permissive UPDATE policy — the whole point of the catch
create policy lot_events_evil_permit on public.lot_events for update using (true) with check (true);
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
do $$
declare n int;
begin
  update public.lot_events set quantity_delta = 777 where id = 'a0000005-0000-0000-0000-00000000000a';
  get diagnostics n = row_count;
  assert n = 0, 'RESTRICTIVE-DENY FAILED: a permissive UPDATE policy got through — append-only NOT locked';
end $$;
reset role;
drop policy lot_events_evil_permit on public.lot_events;

-- anon reads NOTHING from the spine tables
set local role anon;
set local request.jwt.claims = '';
set local request.jwt.claim.sub = '';  -- clear dotted form too, else prior user's sub leaks
do $$
begin
  assert (select count(*) from public.lots) = 0, 'LEAK: anon reads lots';
  assert (select count(*) from public.lot_events) = 0, 'LEAK: anon reads lot_events';
  assert (select count(*) from public.master_spec_observations) = 0, 'LEAK: anon reads observations';
  assert (select count(*) from public.formulation_versions) = 0, 'LEAK: anon reads versions';
  assert (select count(*) from public.master_spec_revisions) = 0, 'LEAK: anon reads revisions';
end $$;
reset role;

do $$ begin raise notice '✓ WORKSPACE RLS ISOLATION HARNESS PASSED — no cross-operator leakage'; end $$;
do $$ begin raise notice '✓ 0003 SPINE RLS + APPEND-ONLY HARNESS PASSED — no cross-tenant leak; lot_events/observations immutable'; end $$;
rollback;
