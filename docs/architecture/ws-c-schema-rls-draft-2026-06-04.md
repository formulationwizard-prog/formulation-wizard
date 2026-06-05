# WS-C — Schema + RLS + Negative-Test Draft

**Status:** CC DRAFT for Opus review. NOT applied. NOT prod.
**Date:** 2026-06-04 · **Branch:** `ws-c` (push held)
**Companion:** [ws-c-roles-visibility-matrix-2026-06-04.md](ws-c-roles-visibility-matrix-2026-06-04.md) (the locked doctrine this implements)

> **⛔ RED-UNTIL-PROVISIONED.** This is the load-bearing milestone ("leaks end the company"). Everything below is *authored*, not *proven*. The negative tests cannot pass-or-fail until they run against a real Postgres-with-our-RLS — either a local `supabase start` stack (Docker + Supabase CLI, **no operator cloud keys needed**) or the operator's cloud project. **A written policy is not a passing test.** Standing up that harness and getting the suite GREEN is the hard gate before any prod code.

---

## 0. Ground truth (what exists today)

From [supabase/schema.sql](../../supabase/schema.sql): the app is **single-tenant.**

- Three tables: `profiles`, `formulations`, `supplier_qualifications`.
- **Every** RLS policy is `auth.uid() = owner_id`. There is **no** workspace, membership, role, or sharing concept anywhere.
- The entire formulation payload lives in **one `data` JSONB column** on `formulations` (cost, supplier, margin, label, specs — all in the same blob).
- Auth plumbing: `@supabase/ssr` clients ([lib/supabase/client.ts](../../lib/supabase/client.ts), [server.ts](../../lib/supabase/server.ts), [middleware.ts](../../lib/supabase/middleware.ts)) — real path, degrades gracefully when unconfigured. (`lib/supabase.ts` is a separate stub singleton; minor duplication, not blocking.)
- Tests: plain `vitest` ([vitest.config.ts](../../vitest.config.ts)), `**/__tests__/**/*.test.ts`. **No DB/integration harness exists** — RLS tests are net-new infrastructure.

WS-C is greenfield on top of this. Nothing below changes the single-tenant owner path; it *adds* the sharing layer beside it.

> **⚠️ ADDITIVE-MIGRATION-ONLY.** The repo's `schema.sql` does **not** match prod — production carries an `allowed_emails` invite whitelist enforced inside a modified `handle_new_user()` ([[project_supabase_invite_only_three_gate_auth_2026_05_29]]). WS-C ships as an **additive migration** (`create table … if not exists`, new policies) and must **never** rewrite/re-run `schema.sql` or touch `handle_new_user` / `allowed_emails`, or it clobbers the live whitelist.

---

## 1. ⚠️ The finding that changes the design: RLS is ROW-level, the secret is a COLUMN

The matrix says "RA sees the formula, **not** the cost columns." The instinct is to enforce that with RLS. **RLS cannot do it.** Postgres RLS gates *rows*, never *columns* — and worse, **cost/supplier/margin live *inside* the shared `data` JSONB blob.** The moment an external grantee can `SELECT` the formulation row (which RA and CMO must, to do their jobs), RLS hands them the **entire** blob — cost included. **RLS-only silently leaks the commercial layer to every external collaborator.**

Field-level redaction needs a different mechanism. Three options, weakest→strongest:

| Option | Mechanism | Verdict |
|---|---|---|
| **(a) Server-side projection** | External roles never touch the table; they call an RPC `get_formulation_for_role(id)` that returns a redacted `data` (commercial nodes stripped server-side). Direct table `SELECT` denied for externals. | Near-term workable. Redaction logic in one function. Leak risk = a bug in one function. |
| **(b) Redacted views** | `formulations_external_view` exposes safe columns + a SQL-redacted jsonb; grants/RLS on the view. | Workable; redaction spread across view defs; jsonb redaction in SQL is fiddly. |
| **(c) Split the payload** ✅ | Move commercial fields (`cost`, `supplier`, `margin`, pricing, retail-fit) OUT of `data` into a sibling `formulation_commercial` table that **only owner + internal-team** can read. | **Airtight by construction** — you cannot leak a column that isn't in the row the grantee can read. Costs a data-model refactor + a `cloudSync` change. |

**Recommendation: (c) as the target, (a) as the bridge.** Ship the RPC projection to unblock August; schedule the payload split as the durable fix. Either way — **field redaction is NOT an RLS concern, and the matrix doc's "enforced server-side" line is load-bearing, not a nicety.** This is the single highest-value thing for Opus to rule on.

---

## 2. New tables (additive — single-tenant path untouched)

```sql
-- ── WORKSPACE — the org/tenant container (a brand owner's account) ──
create table public.workspaces (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  created_at  timestamptz not null default now()
);

-- ── MEMBERSHIP — user × workspace × role. The discriminated Role lives here. ──
create table public.workspace_members (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  role_kind     text not null check (role_kind in ('internal-team','external-collaboration')),
  role          text not null,            -- subrole; trigger validates against role_kind (see §3)
  status        text not null default 'active' check (status in ('pending','active','revoked')),
  invited_by    uuid references auth.users(id),
  created_at    timestamptz not null default now(),
  unique (workspace_id, user_id)
);
-- DOCTRINE: internal-team → broad workspace visibility via THIS row.
--           external-collaboration → membership grants NOTHING on its own;
--           visibility comes only from formulation_grants (§below). Default-deny.

-- ── GRANTS — per-(formulation, revision, run) scoped access. ──
-- ONE table serves BOTH direct grants AND access-requests (request = a pending grant).
create table public.formulation_grants (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid not null references public.workspaces(id) on delete cascade,
  formulation_id  uuid not null references public.formulations(id) on delete cascade,
  revision        text,                   -- null = any revision; set = scoped to this revision
  run_id          text,                   -- null = not run-scoped; set = THIS production run only (the #3 primitive)
  grantee_user_id uuid not null references auth.users(id) on delete cascade,
  role            text not null check (role in ('regulatory-pcqi','cmo','process-authority')),
  capabilities    text[] not null default '{}',  -- e.g. {'read:formula','read:label','write:attestation'}
  status          text not null default 'pending'
                  check (status in ('pending','active','revoked','expired')),
  expires_at      timestamptz,            -- null = no expiry (rare; PA always sets one)
  requested_by    uuid references auth.users(id),  -- set when born via access-request
  granted_by      uuid references auth.users(id),  -- set when owner approves
  created_at      timestamptz not null default now()
);
create index on public.formulation_grants (grantee_user_id, status);
create index on public.formulation_grants (formulation_id, status);
```

**`formulations` gets one new column:** `workspace_id uuid references public.workspaces(id)` (backfilled: each existing owner gets a default workspace; their formulations point to it). `owner_id` stays — owner path unchanged.

**Access-request = pending grant.** No separate table. A request is a `formulation_grants` row with `status='pending'`, `requested_by` set, `granted_by` null. Owner approval flips `status→'active'` + sets `granted_by`. Same shape as a direct invite and as the PA `ExportToken` link (Master Specs Entity 8). **One grant model, three entry points** — preserves the #3 per-run primitive everywhere.

---

## 3. Unified Role type (TS) — discriminator IS the security default

```ts
// types/roles.ts (new) — consumed by cloudSync, masterSpecs, and the RLS helper fns
export type Role =
  | { kind: 'internal-team';
      role: 'owner' | 'qa-manager' | 'lab-manager' | 'rd-manager'
          | 'lab-tech' | 'qa-tech' | 'plant-manager' | 'operator' | 'admin' }
  | { kind: 'external-collaboration';
      role: 'regulatory-pcqi' | 'cmo' | 'process-authority' };

export const isInternal = (r: Role): boolean => r.kind === 'internal-team';
```

- `kind` is the boundary: `internal-team` → broad workspace read (preserves Master Specs' existing *"any authenticated user in workspace"* assumption — **for them only**); `external-collaboration` → default-deny, per-object grants.
- DB trigger validates `workspace_members.role` against `role_kind` (internal subroles vs external subroles) so the two can't cross.
- **Converges the four scattered Master Specs unions** (`authorized_role`/`signer_role`/`applied_role`/`actor_role` in [types/masterSpecs.ts](../../types/masterSpecs.ts)) onto `Role['role']`. Refactor-ticket discipline: patch-compatible now, converge when the data layer stabilizes — don't rewrite mid-wave.

---

## 4. RLS policies (row scoping) + helper fns

Helper functions are `security definer` + `stable` to avoid recursive-RLS and keep policies fast:

```sql
create or replace function public.is_internal_member(p_workspace uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.workspace_members m
    where m.workspace_id = p_workspace
      and m.user_id = auth.uid()
      and m.role_kind = 'internal-team'
      and m.status = 'active');
$$;

create or replace function public.has_active_grant(p_formulation uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.formulation_grants g
    where g.formulation_id = p_formulation
      and g.grantee_user_id = auth.uid()
      and g.status = 'active'                       -- pending/revoked/expired all fail closed
      and (g.expires_at is null or g.expires_at > now()));
$$;
```

```sql
-- formulations SELECT: owner OR internal member OR active grant-holder
drop policy if exists "Users can read their own formulations" on public.formulations;
create policy "read own / workspace / granted"
  on public.formulations for select using (
        auth.uid() = owner_id
     or public.is_internal_member(workspace_id)
     or public.has_active_grant(id));

-- WRITE stays tight: only owner + internal members may mutate the formulation row.
-- External grantees NEVER update formulations (read-only). Their writes (CMO attestations,
-- lot records) go to their own tables, gated by run-scoped grant — never to formulations.
create policy "write own / internal only"
  on public.formulations for update using (
        auth.uid() = owner_id
     or public.is_internal_member(workspace_id));
```

**Per-run scoping (#3) lives on the run records, not the formulation row.** A CMO needs to read the *formulation* row to render its batch sheet, but its **run-scoped** access is enforced on the future `production_runs` / batch-record / attestation tables (the logged-but-unbuilt production layer), whose RLS checks `g.run_id = <row>.run_id`:

```sql
-- sketch for the production_runs table (logged, not yet built) — shows the join key
create policy "cmo reads only its granted run"
  on public.production_runs for select using (
        auth.uid() = owner_id
     or exists (select 1 from public.formulation_grants g
                where g.grantee_user_id = auth.uid()
                  and g.formulation_id = production_runs.formulation_id
                  and g.status = 'active'
                  and (g.run_id is null or g.run_id = production_runs.run_id)  -- run5 ≠ run6
                  and (g.revision is null or g.revision = production_runs.revision)));
```

This is where IDOR tests #7/#8 bite. **`grant_id` is NEVER trusted from the client** — every check derives `auth.uid()` from the session JWT; the client cannot assert its own role, grant, or run (test #9).

---

## 5. Negative tests (13 — exceeds the ≥6 ask)

Each is *adversarial*: it tries to break in and asserts the breach **fails**. Grouped by the property it defends.

**Baseline tenancy**
1. **Cross-workspace direct-UUID read** — User B, knowing User A's `formulation.id`, `select … where id=<A's>` → **0 rows**.

**Portfolio non-enumeration (#3 doctrine)**
2. **CMO can't enumerate** — CMO with grant on Product X runs an unfiltered `select * from formulations` → returns **only X**, never siblings.
3. **Request from non-pointer-holder** — user with no grant/reference creates an access-request for a formulation they can't name → rejected (can't request what you can't reference; no browse-and-request).

**Field-level redaction (tests §1 — NOT RLS)**
4. **RA can't read cost** — RA with a valid active grant fetches the formulation → returned payload contains label/specs/masses but **no** `cost`/`supplier`/`margin` nodes. *(This is the test RLS-only would silently fail — it guards the §1 finding.)*

**Per-run / per-revision isolation (#3 primitive)**
5. **Two-CMO isolation** — CMO-A (run5) and CMO-B (run6) on the same product → neither sees the other's run records or identity.
6. **Adjacent-run IDOR** — CMO granted `run5` requests a `run6` record → denied.
7. **Adjacent-revision IDOR** — CMO granted `rev2` requests a `rev3` record → denied.

**Server-derived authority (never trust the client)**
8. **Role tampering** — external user crafts a request asserting `role_kind='internal-team'` → server ignores the client claim, derives role from `workspace_members` → no broad access.
9. **Write-path rejection** — read-only RA attempts an `update` on a formulation/field (not just a hidden edit button) → denied by the write policy.

**Grant lifecycle (fail closed)**
10. **Expired grant** — grant past `expires_at` → denied (covers PA `ExportToken` after expiry).
11. **Revoked ≠ expired** — grant `status='revoked'` but still before `expires_at` → denied (distinct path from expiry).
12. **Pending-as-active** — unapproved (`status='pending'`) grant used to read → denied; only `active` passes.
13. **Stale client cache** — client replays a session/token for a now-revoked grant → server re-checks live, denies (no trust in client-cached authorization).

**Harness recommendation.** Stand up a local **`supabase start`** stack (Postgres + GoTrue; Docker + Supabase CLI — *no operator cloud keys required*). Then:
- **pgTAP** for the SQL-level RLS policy assertions (tests 1–3, 5–13) — runs in-database, closest to the policy.
- A thin **vitest integration suite** (two real JWTs: owner + grantee) for the RPC redaction path (test 4), since that's application-layer.
- Wire as a separate `test:rls` script so it doesn't flake the existing unit suite (and per [[run-vitest-via-powershell]], drive locally from PowerShell).

Until that stack is stood up and **all 13 are GREEN**, WS-C stays pre-prod. That GREEN is the gate.

---

## 6. Open items for the Opus pass

1. **Field-redaction mechanism — (a) RPC bridge vs (c) payload split.** §1. The one ruling that shapes everything downstream. (CC rec: (c) target, (a) bridge.)
2. **Does the payload split (c) happen before or after August?** Bridge-then-split affects the `cloudSync`/`data`-shape timeline.
3. **`production_runs` table shape** — the run-scoped tables are logged-but-unbuilt; do we stub the minimal run-record table now so the #3 RLS has something to attach to, or gate per-run tests behind that build?
4. **PA: pure `ExportToken` vs grant+token pair.** Does PA get a `formulation_grants` row (role=process-authority) *plus* an ExportToken, or does ExportToken carry the authorization alone? (CC lean: grant row is the authorization, token is the credential — keeps one grant model.)
5. **Membership for externals** — do external collaborators get a `workspace_members` row at all (addressable identity, status only) or exist purely as `formulation_grants`? (CC lean: yes, a member row with `role_kind='external-collaboration'` + `status`, but zero visibility from it — grants do all the work. Cleaner for the access-request inbox + revocation UI.)

---

*Next after Opus red-lines: stand up the local Supabase RLS harness, implement §2–§4, get §5 GREEN. No prod code until then.*
