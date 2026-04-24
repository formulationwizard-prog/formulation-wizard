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
