# WS-C Build Kickoff — 2026-06-07

**For the next CC: this is the multi-day WS-C build. Verify ground state first (git may have moved). The schema is LOCKED — build to it.**

## Locked decisions (don't re-litigate)
- **Schema:** `docs/architecture/ws-c-schema-2026-06-07.md` — LOCKED (commit `ccdd7b4`). Multi-tenant from line one.
- **Scope cut (operator-locked 2026-06-07):** **immutable-history DEFERRED to post-launch.** August version-lock = **freeze-in-place + edit-guard** (trigger/RLS rejecting UPDATE when `locked=true`), NOT snapshot-on-lock. Keep `formula_root_id` + `previous_version_id` as nullable schema fields (admit the future); don't build snapshot logic. This kept WS-C at ~13–19 ideal-days (within/near the zero-slack budget). Reassess at week 1: if still tight → minimal invite UI (Option 2); only if no other path → defer multi-member (Option 3). Multi-user is the committed deliverable; Option 3 is last resort.
- **Migration covers THREE tables** (CC ground-truth): `formulations`, `supplier_qualifications` (both → tenant-owned), `profiles` (stays user-linked; org join via `memberships`). All currently `owner_id = auth.uid()`.

## RLS harness (the prerequisite — build FIRST)
No RLS test harness exists; vitest can't test RLS. Env confirmed: `supabase` CLI 2.105 + Docker 29.5 present.
1. `supabase init` (creates `config.toml` + `migrations/`) — non-interactive flags if it prompts.
2. Port current `supabase/schema.sql` → a baseline migration (single-user state).
3. WS-C migration: `organizations`, `role_type` enum (all 7 values reserved) + `membership_status` enum, `memberships` (CHECK `role IN ('owner','member')`), add `org_id`/`created_by`/`formula_root_id`/`previous_version_id`/`locked` to `formulations`, add `org_id` to `supplier_qualifications`, `fw_events` (6 kinds, INSERT-only trigger), edit-guard trigger on locked formulations. Backfill: one org per existing `owner_id` + owner membership + `org_id` set.
4. RLS policies (org-membership-scoped) on every tenant table.
5. **pgTAP negative tests via `supabase test db`** — the 12 adversarial scenarios from the schema doc, on EACH tenant table. **`supabase start` pulls Docker images (slow first run).**

## Build order
RLS harness → tenant-owned persistence (3-table migration) → memberships + RLS → **⛔ negative tests 1–12 green (gate)** → roles/visibility (owner/member only) → invite UI → freeze-in-place version-lock + edit-guard. `fw_events` + free-byproduct writes land with persistence.

## ⛔ The company-ending surface
Cross-company confidentiality. RLS broadens from `owner_id=auth.uid()` to org-membership. **No cross-company sharing in prod until all 12 negative tests pass in CI.** RLS policies get Opus eyes before they're trusted (don't solo-ship the confidentiality layer — quality gate). `parent_org_id` and reserved roles grant NOTHING until a deliberate, separately-tested policy lands.

## Parallel streams (non-displacing)
- **Discovery sweep** (Workflow `wx1ctz6im`, 2026-06-07) — substring-keyword landmines across the engines; CC triages + fixes harm-critical findings. Broader-discovery sweep staggered next.
- **deep-research** on claims regulatory facts — queued (needs fresh Workflow auth).
- **Operator async:** Vercel env vars (activates WS-A auth/save live), lawyer + insurer outreach (insurer = the Platform/Infrastructure fork decide-by gate).

## Quality gates (enforce "everything works before clients see it")
catalog-entry-validator on catalog commits · RLS adversarial harness on every WS-C PR · `verify` end-to-end per shipped surface (prod-Playwright on save-dependent surfaces GATED during migration) · `code-review` pre-merge · production Playwright per push · operator architectural locks · full verification sweep before client share.

## Read-first
`docs/architecture/ws-c-schema-2026-06-07.md` (the spec) · `docs/strategy/platform-vs-infrastructure-fork-2026-06-07.md` · `path-to-august-scoped-launch-2026-06-01` · [[feedback_never_infer_green_light]] · [[reference_run_vitest_via_powershell]] · [[feedback_generation_safety_and_strategic_verification]].
