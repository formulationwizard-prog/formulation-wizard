# Supabase Setup — Formulation Wizard

## One-time setup (once you have your project)

1. **Run the schema.**
   Open your Supabase project → SQL Editor → New query → paste the contents of `schema.sql` → Run.
   This creates tables, RLS policies, and auto-profile-creation triggers.

2. **Enable Google OAuth (optional but recommended).**
   Supabase Dashboard → Authentication → Providers → Google → Enable.
   Follow the Google OAuth console instructions shown in the Supabase UI.
   Add `https://formulationwizard.com` (and `http://localhost:3000` for dev) to the redirect allow-list.

3. **Configure email auth.**
   Supabase Dashboard → Authentication → Email → enable "Confirm email" (safer).
   Under Email Templates, customize the confirmation email with Formulation Wizard branding.

4. **Set up the site URL.**
   Supabase Dashboard → Authentication → URL Configuration → Site URL → `https://formulationwizard.com`.
   Add `http://localhost:3000` to Additional Redirect URLs for local dev.

5. **Copy your two public credentials into `.env.local`:**
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://<your-ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<the long JWT string>
   ```

6. **Install the client library:**
   ```
   npm install @supabase/supabase-js
   ```

7. Restart the dev server. The app should now pick up the keys and show the auth UI.

## Schema overview

| Table | Purpose |
|---|---|
| `profiles` | Auto-created on signup. Holds email / name / subscription tier. |
| `formulations` | One row per saved formula. `data` JSONB holds the full payload. |
| `supplier_qualifications` | Per-user doc/expiration tracker. |

All three tables have row-level security — users can only read/write their own rows.

## Migration from localStorage

Existing users who signed up before cloud sync will have formulas in browser localStorage under keys like `fw-saved-formulations`. The app will detect those on first login and offer to migrate them to Supabase. See `lib/cloudSync.ts` (TODO — will be created once real client is wired).

## Local development

Install Supabase CLI for local development:
```
npm install -g supabase
supabase init
supabase start
```
This runs a full Postgres + auth stack locally. Optional — cloud project works for dev too.

## Local RLS test harness (WS-C) — the confidentiality gate

WS-C (multi-user) ships only after the cross-company isolation tests pass. Those
tests need a **real Postgres with our policies + multiple logged-in identities** —
something the normal `vitest` unit suite can't give. You run them against a local
Supabase stack. **No cloud keys needed — this is all local.**

**One-time setup (Wizard's gate — ~20 min, mostly downloads):**
1. **Install Docker Desktop** (Windows): https://www.docker.com/products/docker-desktop/ — install, launch it, leave it running. (This is the heavy part; it may want WSL2 + a reboot.)
2. **Install the Supabase CLI:** `npm install -g supabase` (or `scoop install supabase`).
3. From the repo root: `supabase init` (once), then `supabase start`. First run pulls Docker images (a few minutes).

**Run the gate:**
```
bash scripts/run-db-tests.sh
```
This runs every `tests/*.test.sql` (pgTAP) against the running local Postgres and parses
the TAP output, failing on any `not ok`. The WS-C gate is `tests/ws_c_isolation.test.sql`
— 14 cross-company isolation + membership assertions. **All must be GREEN before any
sharing goes live in prod.** A written policy is not a passing test.

> **Why not `supabase test db`?** That command shells out to the `supabase/pg_prove`
> image. On hosts where Docker can't pull it (the CloudFront/WSL2 `EOF` failures seen on
> the dev box), the gate couldn't run at all. pgTAP lives *inside* the postgres image, so
> `scripts/run-db-tests.sh` runs the tests through `psql` directly — same result, one
> fewer image to pull, identical locally and in CI.

> **Status:** GREEN — 14/14 (first executed 2026-06-04). Also enforced in CI on every
> push to `ws-c` via `.github/workflows/db-tests.yml` (GitHub runners don't have the
> local pull problem). `config.toml` disables `realtime` + `analytics` — unused for DB
> tests, and their images won't pull on the dev box.

**Two notes on the harness migrations:**
- `migrations/00000000000000_baseline.sql` is a **local-harness mirror** of the live tables (which otherwise live only in `schema.sql`, a manual-paste file). It exists so the WS-C migration has tables to build on. It is **not** a prod artifact — prod is still provisioned from `schema.sql` + the out-of-repo invite-whitelist trigger.
  - **⚠️ DRIFT DOCTRINE (until convergence):** any change to `schema.sql`'s tables must also land in `baseline.sql`, and vice versa — they mirror each other. They can silently diverge otherwise. *Post-launch hardening: a CI check that fails when one moves without the other. Flagged, not built (not August-blocking).*
- The prod `allowed_emails` whitelist trigger is **not in the repo**, so test 13 **simulates** it with a fixture trigger to prove the atomic-rollback behaviour (a rejected signup leaves no orphan workspace). It tests the *concern*, not the literal prod trigger.
