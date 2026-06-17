# START HERE — 2026-06-16 session landing

**Read first.** Everything below is committed **and pushed** to `origin/main` (@ `6c2b909`); working tree clean (only the usual untracked files). This session was the **#17 architecture lock** — no app code changed; it's all design docs + the schema spec.

## What this session produced

- **Workflow architecture audit** — `docs/architecture/workflow-architecture-audit-2026-06-16.md`. Honest as-is map: the lifecycle spine isn't laid (6 tables exist), the workflow is 4 tabs over one `SavedFormulation` blob, Bench Top is unmodeled, the design/target spec was fused into Master Specs.
- **Spine LOCKED at 13 entities** — memory `project_lifecycle_spine_locked`. **TargetSpec** (contract, version-level) split from **MasterSpec** (verified-from-production); **+BenchTopRun**, **+PackagingSpec** (production-and-packaging *workflow*, not an attribute bag), **+LotEvent** (event-sourced inventory; qty computed, recall = graph traversal); **Material + Supplier promoted** to entities; **Product collapsed into Formulation** (Packet-Q1 closed).
- **3 architecture docs reconciled** (committed): the #17 packet (9→13), `master-specs-data-model-2026-05-27.md` (TargetSpec/MasterSpec split + revision-boundary carry-forward), and new `inventory-event-model-2026-06-16.md`.
- **Schema-laying directive APPROVED + pushed** — `docs/architecture/schema-laying-directive-2026-06-16.md` (commit `6c2b909`). The spec `0003` is built to. Opus-reviewed; **3 criticals fixed** (`master_spec_revisions` side table for carry-forward granularity; observations strictly append-only; Customer-Lot collapses into `lots`); `sector` denormalized on every table.

## THE NEXT ACTION (one focused pass): write + verify `0003_lifecycle_spine.sql`

Per the approved directive + its §6 gate. **Build it to the directive — don't re-derive.**
1. Write `supabase/migrations/0003_lifecycle_spine.sql` (16 tables; `sector` everywhere; the `0002` owner-OR-`is_internal_member` RLS; **append-only** `lot_events` + `master_spec_observations` = INSERT+SELECT only; `master_spec_revisions`; Customer-Lot-as-`lot_kind='finished-good'` in `lots`; `spec_metrics` seed into `handle_new_user_workspace`; idempotent DDL like `0002`).
2. Extend `supabase/tests/rls_isolation_test.sql` — no cross-tenant leak on every node **+ prove UPDATE/DELETE denied** on the two append-only tables.
3. **Verify local-green** (Docker Postgres: apply `0001`+`0002`+`0003`, run the harness, fix until green). **DO NOT commit un-run schema/RLS** — harm-critical doctrine.
4. Commit the **verified** migration + harness. Then Opus pressure-tests the diff. **Prod-apply stays gated: backup + harness pass + operator go.**

## Doctrine reaffirmed this session

- **Verify-don't-infer extends to relay fidelity.** A directive labeled "Opus-reviewed" can be part operator-added / part implicit-decision-nobody-named — verify substance against code, surface implicit decisions *inline* (this caught the `product_id`→Formulation collapse riding in field names).
- **Harm-critical SQL:** write → run local → harness-green → *then* commit. Never commit un-run RLS.
- **Workflow:** CC drafts where code-context decides (schema), Opus reviews; keep both — the cross-check catches different error classes.
