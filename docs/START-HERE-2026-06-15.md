# START HERE — 2026-06-15 session landing

**Read this first.** Everything below is committed **and pushed** to `main` (`origin/main` @ `3b87bda`); working tree clean; 1423 tests green; nothing half-built.

## What shipped today

- **Auth / save backend — VERIFIED working in production. Launch-blocker CLOSED.**
  The long-feared *"passcode ≠ Supabase → silent save fail"* was a **stale hypothesis from an old memory note, not a live bug.** Confirmed at every layer: app code (traced end-to-end), prod DB + RLS (live round-trip probe — anon insert rejected, authed owner_id-only insert accepted via 0002's `workspace_id IS NULL` branch, fresh-client read-back, delete), signed-out + signed-in UI, Vercel env vars (present + Production-scoped, added Apr 27, baked into deploys since the Jun-3 auth ship), and a **live sign-in on www.formulationwizard.com**.

- **`/start` first-run path — BUILT (increments 1–6) + voice-locked.**
  Public label-builder. One-click example + paste → the **one shared byte-faithful `SupplementFactsPanel`** (extracted from the workspace; workspace + `/start` render through it) → **catch-as-save** safety review (real `checkSupplementSafety` findings with citations; all-clear vigilance state) → **save-as-conversion** (writes a valid `SavedFormulation` to the local cache; migrates up on sign-in via the existing path). Voice = operator-direct (see memory `feedback_operator_direct_voice`).

- **CFR Watch CI false-alarm — FIXED.** A transient eCFR/govinfo blip was hard-failing the weekly workflow + emailing an alarm. Added retry-with-backoff at the fetch dispatcher; persistent failures still surface.

## Current state

- `origin/main` @ `3b87bda` · working tree clean · 1423 tests green · tsc clean.
- **The live site still serves the OLD build** (`284c515` scaffold) until a redeploy — the new `/start` is on `main` but not yet deployed.

## Tomorrow's next-actions (your calls — nothing is blocking)

1. **Redeploy `main`** → puts the real `/start` (catch-as-save, save-as-conversion) on the live site, replacing the scaffold. Build cache **off** so env vars + new code re-inline.
2. **Open `/start` to the public** → one-line `proxy.ts` change (add `/start` to the public-paths check at line 95; it's passcode-gated today). **Deliberate launch decision** — exposes the label-builder to the open web.
3. **Clear the red CFR run** → re-run "CFR Watch" from the GitHub Actions UI (`workflow_dispatch`); the retry fix is now on `main`.
4. **Prod-auth config before August open-signup** → custom SMTP (default Supabase mailer is throttled → real signups can't confirm) + redirect-URL allowlist for `www.formulationwizard.com`. See memory `project_prod_auth_config_launch_items`.

## Open (logged, not blocking)

- `/start`'s example + paste assembly mirrors the workspace's `applyParsedRows` / `saveFormulation` inline. When the paste path grows, extract the shared row→Ingredient + SavedFormulation builders to `lib/` so they can't drift.
