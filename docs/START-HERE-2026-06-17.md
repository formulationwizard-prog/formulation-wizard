# START HERE — 2026-06-17 → prod-apply runbook

**Read first.** Everything is committed **and pushed** to `origin/main` (@ `f90a38a`); working tree clean.

## Where it stands
The **#17 lifecycle spine is laid as a verified migration.** `supabase/migrations/0003_lifecycle_spine.sql` (15 tables = the 13-entity spine; Customer-Lot folded into `lots`) is **local-green + Opus pattern-review SIGNED OFF**, hardened through two review rounds:
- **Restrictive append-only deny** on `lot_events` + `master_spec_observations` + `master_spec_revisions` (harness **proves** it beats a deliberately-added permissive UPDATE — locked, not incidental).
- **Supersession / strike-through** (QA never-erase) on `master_spec_revisions` (append-only) + `master_spec_observations` — `supersedes_id` + `correction_reason`, leaf-of-chain = current, `is_void`; void *and* supersede both require a reason.
- **`lots` discriminator CHECK** (no orphans); dual `owner_id`+`workspace_id` key + `sector` RLS matching `0002`; solo (null workspace) case uniform.

Memory: `project_lifecycle_spine_locked`. Directive: `docs/architecture/schema-laying-directive-2026-06-16.md` (**§4-bis** = the review amendments, named).

## THE NEXT ACTION — prod-apply `0003` (discrete, gated; do it fresh, not tired)
1. **Backup first.** Supabase dashboard → manual backup / confirm PITR. Prod has no auto-backups (same discipline as `0002`).
2. **Apply.** `supabase db push` (applies `0003` as the next migration) — or paste it in the SQL editor.
3. **Run the harness against prod.** `supabase/tests/rls_isolation_test.sql` — it's `begin … rollback` (no residue). Confirm **both** `✓ … PASSED` notices.
4. **Verify.** The 15 tables exist + RLS enabled.

## Watch for prod-vs-local anomalies (verify-don't-infer — where it earns its keep)
Local-green ≠ prod-applies (`feedback_verify_extends_to_deployment_state`). The `auth.uid()` GUC form differs local (dotted) vs prod (JSON) — the harness now sets **both**, so it's portable. On apply, watch for: harness flagging unexpected scope; unexpected migration time. (CHECK-violations-on-existing-data is unlikely — the 15 tables are all new, no existing rows.) If anything surfaces, diagnose with full bandwidth — don't push through.

## After prod-apply (future sessions)
#17 sequence continues on the laid spine: **C** migrate MasterSpec localStorage → TargetSpec · **D** persist Batch (LB#4 2nd half) · **E** PDS extraction Phase 1.
