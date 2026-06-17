# FW Workflow Architecture Audit — 2026-06-16

**Status:** Read-and-summarize audit (no code/doc modified during the audit). Reviewed + endorsed by operator + Opus 2026-06-16; resolutions recorded in §8.
**Method:** read against actual code, `types/`, `lib/`, the 2 committed migrations, the #17 packet, and the Master-Specs / PDS architecture docs. File paths cited. Strong-opinion register.
**Note on citations:** `app/workspace/page.tsx` line ranges are as-of the audit date and will drift — stable identifiers (type names, `activeTab` values, function names, migration line numbers) are authoritative.

## Executive summary (the four headlines)

1. **The lifecycle spine is not laid.** Postgres has exactly **6 tables** (`allowed_emails`, `formulations`, `profiles`, `supplier_qualifications`, `workspaces`, `workspace_members` — `0001_baseline.sql`, `0002_workspace_tenancy.sql`). **Zero** of the spine's downstream entity tables exist (Material, Lot, Batch, COA, Inventory, Customer Lot, Master Spec). #17 §9 step-3 ("lay the spine") **has not happened.** Everything is hung off one `SavedFormulation` blob (jsonb in `formulations.data` + localStorage).

2. **The workflow is one entity wearing four hats.** Build / Batch / PDS are **tabs over a single in-memory `SavedFormulation`** in `app/workspace/page.tsx`, not four persisted stages. The only genuinely separate persisted entity is **Master Specs** (and that's localStorage-only, feature-flagged, not in Postgres). Batch Sheet is **session-only** (won't survive reload).

3. **Bench Top does not exist** as a stage, entity, or surface. It's a *services request form* + a docstring. But — importantly — the **predicted-vs-measured machinery it needs already exists** inside Master Specs (the tier engine).

4. **The "spec" entity is conflated three ways.** The operator's corrected definition (Master Specs = verified-historical; design/target = separate) is **half-built**: the code's Master Specs *is* the production-learned/verified spec ✅, but the design/target contract is **not a distinct entity** — it's smuggled in as the `validated_value` seed field *inside* `MasterSpecEntry`, and the #17 packet still mislabels Master Spec as "the contract."

---

## §1 — Workflow-stage audit

| Stage | activeTab | In code today | Spec'd-not-coded | Unspecified |
|---|---|---|---|---|
| **Build Base Sheet** | `'build'` | Full surface; backed by `SavedFormulation` + live `ingredients[]`; `saveFormulation()` does semantic versioning → `FormulationVersion[]` snapshots → localStorage + `mirrorToCloud`. | PDS-extraction (it still **conflates MMR + PDS** — Serving/Package, Delivery Form, Capsules/Closures cards belong on PDS per `packaging-data-sheet-architecture-2026-05-27.md` §7) | — |
| **Bench Top** | *(none)* | **Nothing.** Only a Services "Bench-Top Samples" *request form* + a `batchSheetTemplate` docstring ("R&D bench work") | Roadmap mention only: `production-execution-roadmap-2026-06-04.md` ("Bench Test… captured as part of the BPR", Q4) | **The entity, the surface, the bench-vs-production scale model — all unspecified** |
| **Batch Sheet** | `'batch'` | UI exists but **session-only** — `batchNumber`/`operator`/actual weights/QA results live in component state, explicit amber "not yet persisted" banner. `BatchSheet` + `executionRecord` **types exist** (`types/index.ts`) but the UI never persists them. | Persistence (LB#4 second half) — the type is there, the wiring isn't | — |
| **PDS / Packaging** | `'packaging'` | Scaffold of mostly **read-only inherited fields + phase-deferred placeholders** (6-step Production Flow nearly all "Phase X — Coming"; F&B-only Process selector + PA filing). Not persisted. | Full PDS depth (identity/labeling/secondary-tertiary/BOM/machinery/QC) — architecture-locked in `packaging-data-sheet-architecture-2026-05-27.md`, ~unbuilt | — |
| **Master Specs** | `'masterSpecs'` | Real, separate, **feature-flagged** (`MASTER_SPECS_FEATURE_FLAG`), localStorage-only. Living-spec tier engine (`lib/masterSpecsStats.ts`, `types/masterSpecs.ts`, `components/MasterSpecsTab.tsx`). | Postgres migration (Phase 1.5, gated on save backend) | — |

**Stage-to-stage transitions — almost all CONCEPTUAL, not wired:**

| Transition | Wired? | Mechanism |
|---|---|---|
| Build → Batch | **Wired** | `loadFormulation()` hydrates the same `SavedFormulation` |
| Build ↔ PDS | Read-only view | PDS renders inherited `SavedFormulation` fields; edit links route *back* to Build |
| Batch → Master Specs | Read-only | `masterSpecOverride()` injects a Master Spec tier into the Batch target-spec table |
| **Batch captures → persistence** | **NOT wired** | session-only (LB#4) |
| **Bench Top → anything** | **N/A** | doesn't exist |

**Strong opinion:** there are no real *handoffs*. Nothing "moves" from one stage to the next as a new persisted record — they are four read/compute views over one mutable `SavedFormulation`. That's fine for a single-author authoring tool; it is **structurally incompatible** with the #17 spine (which needs a Batch that *references* a frozen Formulation version and *consumes* Lots).

---

## §2 — Entity inventory (the 11 as audited)

| # | Entity | DB schema (migration)? | App code (model+logic)? | UI? | Where it lives |
|---|---|---|---|---|---|
| 1 | **Master Spec** | ❌ (localStorage) | ✅ (10 types) | ✅ (flagged) | `types/masterSpecs.ts`, `lib/masterSpecsStats.ts`, `lib/masterSpecsStorage.ts`, `components/MasterSpecsTab.tsx` |
| 2 | **Formulation** | ✅ `formulations` | ✅ | ✅ | `0001_baseline.sql:95`, `types/index.ts` `SavedFormulation`, `app/workspace/page.tsx` |
| 3 | **Material** | ❌ (static catalog, not a table) | ◐ as `IndustrialIngredient` | ✅ (Ingredient DB tab) | `types/index.ts` `IndustrialIngredient`, `lib/data/supplements.ts` |
| 4 | **Supplier** | ◐ `supplier_qualifications` (docs only, not a Supplier entity) | ◐ `SupplierInfo` type; else a **string** on `Ingredient.supplier` | ✅ (Sourcing tab) | `0001_baseline.sql:132`, `types/index.ts` `SupplierInfo` |
| 5 | **Lot** | ❌ | ◐ `Record<string,string>` (`ingredientLots`) | ◐ (Lot# column on Batch table) | `types/index.ts` `BatchSheet.ingredientLots` |
| 6 | **Batch** | ❌ | ✅ type, **session-only** | ✅ (PREVIEW) | `types/index.ts` `BatchSheet`/`executionRecord`, `app/workspace/page.tsx` `'batch'` |
| 7 | **COA** | ❌ | ❌ (string ref only) | ❌ | `coaReference` string + `Provenance{kind:'coa'}` |
| 8 | **Inventory** | ❌ | ❌ | ❌ | — |
| 9 | **Customer Lot** | ❌ | ❌ | ❌ | — |
| 10 | **BenchTop** | ❌ | ❌ | ◐ (services *request* only) | `app/workspace/page.tsx` `'services'` |
| 11 | **PackagingSpec / PDS** | ❌ | ◐ `PackagingItem`; PDS is a derived view | ✅ (phase-deferred scaffold) | `types/index.ts` `PackagingItem`, `app/workspace/page.tsx` `'packaging'` |

Legend: ✅ yes · ◐ partial/indirect · ❌ no. **Only Formulation has the full trifecta** (schema + code + UI). Nine of eleven have no Postgres presence at all. (§8 resolves the count to a proposed **12** by naming TargetSpec.)

---

## §3 — Master Specs status

- **Modeled as:** a production-learned **living spec** — `MasterSpecEntry` accumulates an append-only `ObservationLogEntry[]`; `ComputedStats` recomputes mean/σ/range; `computeTier()` promotes **estimated → validated → verified → well-characterized** at n≥5/n≥30 (per-metric overrides for heavy-metals/microbial). 10 interfaces in `types/masterSpecs.ts`; math in `lib/masterSpecsStats.ts`; localStorage keys `fw_masterSpecs_*`; feature-flagged off for operators.
- **Does the corrected definition match?** **Yes, mostly.** The correction — "Master Specs = verified historical lab specs from production, NOT the design/target" — matches the *engine*: tiers verify *from observations*. ✅
- **The diff (where the implementation drifts from the corrected definition):**
  1. **The doc + #17 packet still call it "the contract."** `master-specs-data-model-2026-05-27.md` (purpose: "authoritative validated specs") and `#17 §3` ("Master Spec | the contract (brand↔CM, brand↔retailer)") frame it as the design contract — the **opposite** of the correction. The naming authority is stale.
  2. **It carries the design target inside itself.** `MasterSpecEntry.validated_value` / `validated_tolerance` / `authorized_signer` *are* the operator-set design target; the verified spec is the *computed* range. One entity holds both roles, switched by the tier conditional (`n < verified_at` → use design tolerance; `n ≥ verified_at` → use measured σ). So "Master Specs" is **simultaneously** the design seed and the verified output — exactly the conflation the correction splits.

---

## §4 — Design/target spec entity

**Verdict: NO distinct entity. The gap is real and correctly named.**

- The design/target contract exists only as **seed fields inside `MasterSpecEntry`** (`validated_value`, `validated_tolerance`, `target_at_label_claim_pct`, `authorized_*`) and as the supplement `SupplementCompositionSpec` written on save (`writeCompositionSpec()` → `lib/supplementCompositionStorage.ts`), plus the Base Sheet "target spec value + tolerance" referenced in `types/index.ts`.
- **Naming is inconsistent / absent:** there is no `DesignSpec`, `TargetSpec`, or `Contract` type. The distinction between *what we designed it to hit* and *what production proved it hits* is **algorithmic (tolerance vs σ), never named**. UI shows one range that silently changes character as n grows.
- **The single most important modeling gap** for the corrected mental model: the contract (design/target, set once, agreed to by a CM/retailer) and the living spec (verified-from-production) are different lifecycle objects with different authors, change-cadence, and audit semantics — and the code fuses them. (§8: resolved to split.)

---

## §5 — Bench Top entity

**Verdict: ABSENT as scaffolding — but the hard part is already built elsewhere.**

- No `BenchTrialRun` / `BenchBatch` type, no surface, no bench-vs-production scale model. Only the Services request form + roadmap mention (Q4).
- **The predicted-vs-measured loop it requires already exists** — `ObservationLogEntry` + `ComputedStats` + `computeTier()` in Master Specs. That machinery doesn't care whether a measurement came from a bench trial or a production batch.
- **Cleanest insertion point:** model **BenchTop as an observation *source*, not a parallel system.** Add a `scale: 'bench' | 'pilot' | 'production'` dimension to `ObservationLogEntry`, and a thin BenchTop **run** record linking `{ formulationVersionId, predicted snapshot, measured observations[] }`. The bench→production predicted-vs-measured view is then a *query* over the existing tier engine filtered by scale — **not** a new stats stack. (§8: endorsed.)

---

## §6 — PackagingSpec / PDS

- **Scaffolding (as-is):** the `'packaging'` tab renders inherited identity + a 6-step Production Flow that is **almost entirely "Phase X — Coming"** placeholders; F&B sees a Hot/Cold-fill selector + PA-filing block; supplements get mode-adaptive step text. **Not persisted** (no `PackagingSpec` entity; `PackagingItem` is the catalog row, not the sheet).
- **Supplements:** the PDS is **shown but skeletal**; the spec doc treats PDS as a full peer document. The "PDS hidden for supplements" first-run decision refers to hiding it from the *new-customer first-impression*, not removing the workspace tab.
- **Scope today: packaging-*display*, not production-flow coverage.** The architecture doc scopes it as the **backbone of compliant manufacturing** (identity/labeling/secondary-tertiary/BOM/machinery/QC, 1→16 page flex) — that depth is **architecture-locked but unbuilt.**
- **Conceptual home vs wiring:** one leg of the **three-document cGMP model** (MMR=Build / PDS / BPR=Batch), each referencing the others, with the **Convention A→B flip gated behind PDS extraction** (5 gates, none closed). Wired as: a read-only view tab with no entity and no transitions.
- **Purpose — crystallized (operator, 2026-06-16; see §8):** the PDS is **the production-floor packaging WORKFLOW** — the operator's "how to package this product" working document — **with user inputs paramount.** Not a static packaging-metadata spec sheet. The `PackagingSpec` entity owns the operator-authored production-and-packaging flow, not just container/closure attributes.

---

## §7 — Gaps, ambiguities, recommendations

**Gaps (honest):**
1. **The spine isn't in the database.** 9 of 11 entities have no table. The #17 decision ("commit the relationship graph now or 2028 Inventory is a migration") is **still pending** — and every day on the `SavedFormulation`-blob model deepens the eventual migration.
2. **No FK chain.** Material→Lot→Batch→Formulation→Customer Lot doesn't exist; Supplier is a string, Lot is a string-map, COA is a string, Inventory/Customer Lot are nothing.
3. **Batch Sheet is ephemeral.** The type exists; persistence doesn't. Recall traceability is impossible without it.
4. **Design/target spec is unnamed and fused into Master Specs** (§4).
5. **Bench Top is unmodeled** (§5).
6. **Build Base Sheet still conflates MMR + PDS** — the PDS-extraction (Phase 1) hasn't run, so Convention B can't flip.

**Ambiguities:**
- **Entity count drift: the #17 packet says 9; the operator's model says 11/12.** BenchTop and PackagingSpec are not in the packet's spine, and the packet still frames Master Spec as "the contract." **The authoritative document and the operator's current model disagree** — must reconcile before the spine is laid.
- **"Master Spec" overloaded** — design seed *and* verified output in one entity (§3).
- **Sector as a spine field** — #17 §6 flags it undecided (first-class field vs per-surface patch); still open.

**Recommendations (named):**
1. **Reconcile the spine doc first** — amend the #17 packet: split `TargetSpec` (design contract) from `MasterSpec` (verified-from-production), add BenchTopRun + PackagingSpec, rewrite the "Master Spec = the contract" framing. Naming is load-bearing; fix it before tables.
2. **Lay the relationship graph in Postgres** (IDs + FK + `workspace_id` + `sector`), internals deferred per the #17 migration-test gate.
3. **Promote Supplier and Material to entities** — they anchor the FK chain; strings/catalog rows can't.
4. **Model `TargetSpec` as its own entity** distinct from Master Specs (§4).
5. **Implement BenchTop as a scale-tagged observation source** reusing the Master Specs tier engine (§5).
6. **Persist Batch Sheet** (wire `executionRecord` to a `batches` table).
7. **Run the PDS extraction (Phase 1)** to de-conflate Build, then close the 5 Convention-B gates.

---

## §8 — Resolutions & forward decisions (operator + Opus, 2026-06-16)

The audit was reviewed; the headline diagnosis (§4 conflation + entity-count drift) was endorsed as the highest-leverage finding. **Resolve the modeling before any schema. Naming is load-bearing.**

**Endorsed (locked):**
- **Split TargetSpec from MasterSpec.**
  - **TargetSpec** — the design/regulatory contract. Set at Build Base Sheet, frozen with Formulation Version on status-advance, signed/approved by brand owner + RA. Referenced by CM agreements, label-claim defenses, retailer contracts. Cadence: per-version revision. **Version-level.**
  - **MasterSpec** — verified-from-production. Append-only `ObservationLogEntry` stream + tier-engine `ComputedStats`. Cadence: event-sourced.
  - **Convergence:** when MasterSpec's verified range earns formal sign-off, it can become the next-version TargetSpec.
  - **Why a split, not columns on one entity:** CM agreements anchor on the design contract; regulatory defenses anchor on either depending on the question; the two have different update semantics, versioning, and signing authority. Fusing them means every contract reference silently shifts as production data accumulates — a **regulatory liability**, not just a modeling smell.
- **BenchTop as scale-tagged observation source.** `BenchTopRun` is its own run record (`formulation_version`, date, operator, `batch_size`, notes); each measurement flows into MasterSpec's tier engine tagged `scale: 'bench' | 'production' | 'coa'`. One engine, no parallel stats stack; predicted-vs-measured emerges as a filtered query.

**Proposed — pending operator confirmation (two open confirmations):**
- **Entity count → 12.** Naming TargetSpec as a distinct entity is +1 over the locked-11 memory; this is the **resolution of the prior "design/target = separate but unnamed" open question**, not a deviation. *(CC concurs — strong: the regulatory-liability argument makes it an entity, not a column set.)*
- **Naming: `TargetSpec`.** Operator vocabulary already uses "target spec value + tolerance" (this audit confirmed it in the Base Sheet). Alternatives: DesignSpec / ContractSpec / ApprovedSpec. *(CC concurs — reuse operator language unless it carries baggage.)*

**Proposed 12-entity spine:**
1. Formulation
2. **TargetSpec** *(new — splits out from MasterSpec)*
3. **MasterSpec** *(renamed for clarity)*
4. **Material** *(promote: catalog row → entity)*
5. **Supplier** *(promote: string → entity)*
6. Lot
7. **BenchTopRun** *(new)*
8. Batch
9. COA
10. **PackagingSpec** *(new — PDS-extraction Phase 1)*
11. Inventory
12. Customer Lot

**PDS purpose — crystallized:** the Packaging Data Sheet is **the production-floor packaging WORKFLOW** — the operator's "how to package this product" working document — **with user inputs paramount** (the operator fills it to their facility's depth; the platform provides structure, not prescription). NOT a static packaging-metadata spec sheet. This sharpens the `PackagingSpec` entity: it owns the operator-authored production-and-packaging flow.

**Sequence:**
- **A. Reconcile the #17 packet** (doc-only; Opus drafts, CC executes) — entity list → 12, name the split, add BenchTopRun + PackagingSpec, rewrite §3's "Master Spec = the contract."
- **B. Lay the 12 UUID tables** (FK chain + `workspace_id` + `sector`; minimum-viable columns, internals deferred per #17 Decision D). Identity before depth — the brutal-to-retrofit part.
- **C. Migrate MasterSpec localStorage** → pull `validated_value` / `validated_tolerance` / `authorized_signer` into new TargetSpec records FK'd to the same Formulation Version.
- **D. Persist Batch** (LB#4 second half — closes recall-traceability).
- **E. PDS extraction Phase 1** (de-conflate Build/PDS, close the 5 Convention-B gates).
- **F. BenchTopRun surface** — Q4.
- **A–D August-critical; E before August if possible; F post-launch.**

**Gate:** schema-laying (B) waits for the packet-reconciliation directive (A) + the operator's two confirmations. **No schema code until the model is locked.**

**Parked for next turn (not blocking):** is **MasterSpec Formulation-level** (one continuous spec history, observations tagged by version) or **Version-level** (one per Version)? TargetSpec is clearly Version-level; MasterSpec's coupling needs an explicit call.
