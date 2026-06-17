# #17 Architecture Session — Inputs Packet (lifecycle reframe; revised 2026-06-16)

> **2026-06-16 reconciliation:** spine count **9 → 13**. **TargetSpec** (design/regulatory contract) split out from **MasterSpec** (verified-from-production); **BenchTopRun**, **PackagingSpec**, and **LotEvent** added; Material + Supplier promoted to first-class entities. **The 13th entity (LotEvent) was added to make the workflow→IMS flow *structural* rather than a retrofit** — event-sourced inventory truth. Every prior "Master Spec = the contract" framing rewritten to TargetSpec. See the [workflow architecture audit](workflow-architecture-audit-2026-06-16.md) §8 + the [inventory event model](inventory-event-model-2026-06-16.md).

**This packet supersedes the "save backend + version state" framing.** #17 is now scoped as **the lifecycle workspace schema** — the data spine that lets FW replace the operator's whole Excel portfolio (formulation → target spec → batch → COA → inventory → recall traceability), not just the save mechanics. The immediate *execution* unblock (auth reconciliation) is unchanged and sits inside this; the *schema design* is the bigger session.

**Why the reframe (the strategic anchor):** the operator doesn't switch from seven Excel sheets for a formulation tool — they switch for the end-to-end system. The **Excel portfolio is the real competitor, not CogniLens.** End-to-end coverage is the moat; the schema decision at #17 determines whether 2028 Inventory is a *feature delivery* or a *six-month migration*.

**Source docs:** `wave-17-save-backend-brief-2026-06-08.md` (build state), `wave-17-rls-verification-findings-2026-06-08.md` (RLS-verified workspace model — supersedes the brief's Decision A), `ai-reasoning-data-moat-analysis-2026-06-13.md` §3-§4 (opt-in/anonymization), `master-specs-data-model-2026-05-27.md` (the spec data model + tier engine — ⚠️ this source doc still frames the entity as "the contract" / "authoritative validated specs"; it needs the same TargetSpec/MasterSpec reconciliation, flagged in the summary), `supabase/tests/rls_isolation_test.sql`.

---

## 0. The lifecycle spine (the reframe)
The data spine FW must hold: **TargetSpec** (the contract) → **Formulation** (recipe to hit the spec) → **Batch** (per-run execution, consuming material Lots) → **COA** (lab measurement of the actual batch) → **spec reconciliation** (did the batch hit the TargetSpec?) → **MasterSpec** (verified-from-production evidence accumulates; tier promotes) → **LotEvent stream** (every receipt / reservation / consumption / ship recorded append-only — inventory-on-hand is *computed* from it, never stored) → **Lot-out / Customer Lot** (finished goods shipped) → **recall traceability** (event-graph traversal over the LotEvent stream: lot fails QA → which formulations / CMs / customers).

**13 entities the schema must hold:**
| # | Entity | What it is |
|---|---|---|
| 1 | **Formulation** | the recipe, versioned, references its TargetSpec |
| 2 | **TargetSpec** | *(new — split from Master Spec)* the design/regulatory **contract** per Formulation Version — frozen on status-advance, authored by brand owner + RA; referenced by CM agreements, label-claim defenses, retailer contracts. Cadence: per-version revision |
| 3 | **MasterSpec** | *(renamed; role clarified)* **verified-from-production** — append-only ObservationLogEntry stream + tier-engine ComputedStats. Cadence: event-sourced. **An evidence record, NOT a contract** |
| 4 | **Material** | *(promote — was a catalog row; now first-class)* raw ingredient, supplier-specific |
| 5 | **Supplier** | *(promote — was a string; now first-class)* with attached documents (COA, allergen statement, certs) |
| 6 | **Lot** | a specific batch of a Material from a Supplier |
| 7 | **BenchTopRun** | *(new)* a lab-scale R&D run (formulation_version, date, operator, batch_size, notes); its measurements feed MasterSpec's tier engine tagged `scale='bench'` |
| 8 | **Batch** | one production run; references Formulation, consumes Lots; measurements tagged `scale='production'` |
| 9 | **COA** | lab measurement against the TargetSpec, per Batch; tagged `scale='coa'` |
| 10 | **PackagingSpec** | *(new — PDS-extraction Phase 1)* the operator-authored **production-and-packaging workflow** — the production-floor "how-to-package this product" sequence, user inputs paramount. **NOT a static attribute bag** (container/closure/material specs are inputs, not the entity) |
| 11 | **Inventory** | on-hand quantities by Lot, location, expiry |
| 12 | **Customer Lot** | finished goods shipped; references Batch |
| 13 | **LotEvent** | *(new — event-sourced inventory truth)* append-only stream of receipts, reservations, consumptions, adjustments, scraps, returns, quarantines, releases. Lot quantity-on-hand is **computed from this stream, not stored.** The IMS seam (internal or external) consumes this event log directly — see [inventory-event-model-2026-06-16.md](inventory-event-model-2026-06-16.md) |

**TargetSpec ⇄ MasterSpec convergence:** when MasterSpec's verified range earns formal sign-off, it can become the next-version TargetSpec.

**BenchTopRun / Batch / COA share one stats engine:** all three feed MasterSpec's tier engine, tagged by `scale` (`'bench'` / `'production'` / `'coa'`). No parallel stats stack; predicted-vs-measured emerges as a query filtered by scale.

UI ships across phases (Formulation + Batch surfaced 2026; TargetSpec/MasterSpec UI 2027 F&B; COA reconciliation 2027-28; Inventory 2028; recall traceability 2029). **The schema in #17 must hold the spine now.**

---

## 1. The decision rule — spine now, internals later
**Commit the spine, not the entities' internals.** What is brutal to retrofit is the *relationship graph* — stable IDs, the FK chain Material→Lot→Batch→Formulation→Customer Lot, `workspace_id` tenancy on every node, and versioning anchored on TargetSpec. That must be right in #17 or 2028 Inventory is a migration project. What you should *not* design now is the column shape of Inventory / COA reconciliation / expiry — a 2026 schema built against imagined 2028 requirements is *more* wrong than a clean additive table later. Over-specifying future entities is the mirror failure of under-designing the spine.

**Migration-test gate (the per-entity rule, so the session isn't a judgment call per entity):**
> *Does deferring it force a later identity/FK migration, or just an additive column/table?*
> Identity + linkage → **in #17 now.** On-hand quantities, lab-result fields, recall-report shapes → **additive later, no rebuild.**

A Lot must *exist and link* in #17; it does not need its inventory columns until 2028.

---

## 2. Existing-vs-greenfield asymmetry (session prep — what's deciding-work vs lift-in)
| Entity | State | Session work |
|---|---|---|
| **TargetSpec** | *(new split)* the design contract — currently **fused into Master Specs** as the `validated_value`/`validated_tolerance`/`authorized_*` seed + the Base Sheet "target spec value + tolerance" | **deciding-work**: extract as its own entity; migrate the seed fields out of MasterSpec (sequence step C) |
| **MasterSpec** | data model + localStorage impl + Phase-1.5 Postgres-migration plan **all exist** (`master-specs-data-model-2026-05-27`) — the tier engine | **lift-in** as the **verified-from-production evidence record**; not greenfield |
| **Formulation** | production (the live workspace) | **lift-in**; already carries `.mode` |
| **Material** | exists as the mode-aware Ingredient DB (`mc.ingredientDB`) | **deciding-work**: **promote to entity**; identity-vs-supplier-variant split |
| **Supplier** | exists only as **strings** (supplier names on ingredients) | **deciding-work**: **promote to an entity** with attached docs |
| **Batch** | surface exists (Batch Sheet); captures are session-only (component state) | **deciding-work**: persist (LB#4 second half); measurements tagged `scale='production'` |
| **BenchTopRun** | *(new)* **greenfield as entity** — but the tier engine it feeds already exists | identity + FK; reuse MasterSpec stats tagged `scale='bench'` |
| **PackagingSpec** | *(new)* PDS-tab scaffold exists (read-only views + phase-deferred placeholders) | **deciding-work**: model the operator-authored production-and-packaging workflow; PDS-extraction Phase 1 |
| **LotEvent** | *(new)* **greenfield** — the inventory event log | lay the append-only table in #17; Lot itself evolves (status states + computed qty-on-hand) |
| **Lot / COA / Inventory / Customer Lot** | **greenfield as entities** | identity + FK only in #17; internals deferred |

---

## 3. TargetSpec = the contract; MasterSpec = verified-from-production
**The split (locked 2026-06-16).** What everything version-references is the **TargetSpec** — the design/regulatory contract per Formulation Version (frozen on status-advance, signed by brand owner + RA; the anchor for CM agreements, label-claim defenses, retailer contracts). **MasterSpec** is the *separate* verified-from-production evidence record (append-only observations + tier-engine ComputedStats); **it is NOT a contract.**

**Why split, not columns on one entity:** CM agreements anchor on the design contract; fusing the contract with the production-verified range means every contract reference silently shifts as production σ accumulates — a regulatory liability, not just a modeling smell. Different authors, cadence, and signing authority → different entities.

**They converge at tier promotion:** when MasterSpec's verified range earns formal sign-off, it can become the next-version TargetSpec.

**Existing build:** MasterSpec already has a data model + localStorage impl + Phase-1.5 Postgres-migration plan (`master-specs-data-model-2026-05-27`) — but today it **holds the TargetSpec seed inside itself** (`validated_value` / `validated_tolerance` / `authorized_*`). #17 extracts TargetSpec out (sequence step C); MasterSpec keeps only the production-verified role.

**August UI:** flagged-off for Nutraceuticals scope is correct (DSHEA doesn't require a TargetSpec contract the way a retailer contract does); **launch-critical for the F&B path**, so both entities land in #17 even though the UI ships 2027.

**MasterSpec coupling (RESOLVED + locked 2026-06-16):** MasterSpec is **Formulation-level** — one continuous spec history, observations version-tagged, per-metric carry-forward at the **revision boundary** via the entry-level `metric_invalidated_by_revision` (NOT a per-observation flag — observations are immutable, and the carry decision belongs to the reformulation event, not to each historical reading). Stats for `(formulation, Rev_N, metric)`: `metric_invalidated_by_revision = true` → only `Rev_N` observations; `false` → `Rev_N` + all prior back to the most recent invalidation point. TargetSpec is Version-level. Formalized in `master-specs-data-model-2026-05-27.md` (Move B).

## 3b. LotEvent — the inventory event log (the IMS seam)
The 13th entity makes the workflow→IMS flow **structural, not a retrofit.** **Event types:** receipt · reservation · consumption · release · adjustment · scrap · return · quarantine · release_from_quarantine. **Fields:** `lot_id`, `event_type`, `quantity_delta`, `batch_id?`, `coa_id?`, `actor`, `timestamp`, `reason_code?`. **Why event-sourced:** concurrent-write safety, partial + multi-batch consumption, scrap accounting, recall traceability (forward + backward **graph traversal**, not table joins), and a complete audit trail. Lot quantity-on-hand is **computed** from the stream; Lot gains a status state machine (`available | reserved | consumed | quarantined | released | expired | recalled`). **Recall-trace UI is Q4; the data shape supports it day one.** Full design: [inventory-event-model-2026-06-16.md](inventory-event-model-2026-06-16.md).

**Parked Q4 — Location/Warehouse (#14 candidate):** multi-location operators (e.g., a brand using two co-packers) — Lot needs a `location_id` FK when it lands; the LotEvent stream already carries enough to add it additively. Intentional deferral, not an oversight.

---

## 4. Verified build status (ground truth, replaces "status uncertain")
RLS-first verification + this session's code sweep:
- **Workspace model + RLS** — ✅ built + adversarially verified (`workspaces` + `workspace_members` with `role`/`role_kind`; owner-OR-internal-member policies; isolation proven). The orgs/memberships migration the original brief floated is **moot**.
- **Save (formula)** — ✅ live (WS-A); cloudSync push/pull/hydrate/mirror wired, gated on `authUserId`; `owner_id` writes satisfy the live RLS policy. **Keyed on `owner_id`, not `workspace_id`** — the `workspace_id` (team-visibility) wiring is the remaining team-share step, not solo save.
- **Multi-user three-role packet chain** — **NOT greenfield.** `reviewState.ts` (role-aware state machine, "DO NOT WEAKEN"), `raReviewPacket.ts` (#18, **harnessed** — golden test + audit 2026-06-08), `supplementBucket1Gate.ts`, roles in RLS. `page.tsx` already consumes `evaluateReviewStateGate`/`getCurrentReviewState`. **Open remainder = the cross-role handoff flow in the UI** (Brand Owner→Formulation→RA), not the machinery.
- **Capsule excipients** — ✅ **42 entries already in `supplements.ts`** (the "not entered" memory is stale); remainder is seed-list completeness + co-founder use-levels.
- **Heavy-metals computed enforcement** — 🔴 **NOT built** (see §5).
- **fw-tos** — in-app per-mode supplement TOS exists (`supplementTos.ts`); the **legal ToS-document rewrite is a counsel item**, not in the repo.

**The one stale claim in `schema.sql`:** it has only `owner_id`, not the workspace model. #17 must version-control the live schema → migration so the RLS harness runs in CI.

---

## 5. Heavy-metals risk-flag layer (harm-critical contract for #17 to ratify)
**Verified:** `supplementSafetyLimits.ts` enforces ULs + banned ingredients only. Heavy metals appear **only as descriptive spec-test notes** in the catalog ("Heavy metals panel: Pb, As, Cd, Hg per USP <232> / Prop 65" — [supplements.ts:535](../../lib/data/supplements.ts#L535)). No limit table, no gate.

**Enforcement is two layers, and only one is August-shaped:**
1. **Formulation-time risk-flag** — surface "this ingredient is a known heavy-metal vector (kelp→As, rice protein→As, cocoa→Cd); finished product must be COA-tested to USP <232>." **Buildable for August; doctrine-preserving** — it surfaces the boundary honestly instead of silently passing (the harm-critical-default-undocumented contract).
2. **COA-vs-USP<232> reconciliation** — the measured enforcement; needs the **COA entity = 2027** lifecycle work.

**#17 ratifies:** (a) what the risk-flag surfaces at formulation time, and (b) what the harm-critical-default contract *says to the operator* when computed enforcement isn't there yet ("we flag the risk; we cannot certify metals without a finished-product COA"). This dissolves the §V land-or-pull binary: **land the flag layer (August), defer COA-reconciliation (2027).** Land/pull remains the operator's call.

---

## 6. Sector-scoping as a possible schema-level constraint (class-of-leaks audit result)
**Audit run 2026-06-14.** The Worcestershire/Saved bug is not isolated — it's a class: **saved-work lists not scoped to the current sector.**
- **Confirmed leaks:** Saved tab (`savedFormulations`, not mode-filtered), Sourcing **Qualification Tracker** (`supplierQuals`, rendered raw — supplier quals show in every mode), and the **command palette** (all-mode saved formulas in quick-nav).
- **Not leaks:** Build / Unit Economics / Batch / PDS / Ingredient DB / Sourcing-suppliers — current-formula or mode-aware-catalog scoped.
- **Different class (relevance, not leak):** Process Authorities (reference directory), Services (already fixed).

**Root cause + schema implication:** Formulations carry `.mode` (the leak is display-not-filtering); supplier qualifications likely carry **no sector tag at all** (a data-layer gap). So **#17 should decide whether sector is a first-class field on every spine entity, query-scoped (or RLS-scoped) by current sector** — not a per-surface display patch. This is deciding-work for the spine, surfaced *before* ratification so the constraint can be designed in, not retrofitted.

---

## 7. The architectural calls for the session
- **A. Auth reconciliation [immediate unblock].** Make `auth.uid()` reliably present for a saving user ("sign in to save"). Largely settled by the verified workspace model; this is the narrow unblock.
- **B. Version-state semantics.** *Recorded settled 2026-06-08* (status-triggered freeze; August = snapshots + RA-packet version-stamp + freeze-hook) — **confirm or reopen** (not Wizard-locked in-session; provenance is the START-HERE doc). Open: snapshot-in-`data` vs `formulation_versions` table; who moves transitions.
- **C. Schema version-control.** Dump the live workspace schema → versioned migration; RLS harness in CI.
- **D. The lifecycle spine (§0-§2)** — the 13 entities as IDs + FK + tenancy + TargetSpec version-anchor + **LotEvent as the event-sourced anchor for inventory truth**; internals deferred per the migration-test gate.
- **E. Sector as a per-entity schema constraint (§6).**
- **F. Opt-in contribution + anonymization foundation** — granular per-formula/per-data-type/per-purpose flags; anonymization pipeline; **physical separation** (separate schema/role) as defense-in-depth; harness for opted-out isolation. Schema *supports* it; no stream populated for August.
- **G. Heavy-metals harm-critical contract (§5).**
- **H. Floor/ceiling tiering + data-handling position paper** → `subscription_tier`; ToS/Privacy → counsel.

---

## 8. P1 ticket (not session work) — Worcestershire / Saved cross-mode
Mode-filter the saved-work lists (Saved tab, Qualification Tracker, command-palette results) to the current sector, **with a "Show all sectors" toggle.** Single patch. Independent of #17, but the **schema-level decision (§6/E) should land first** so the patch scopes by the right field rather than being redone.

---

## 9. Implementation sequence (post-decision — CC-driveable)
1. Version-control the live schema → migration (C); RLS harness in CI.
2. Reconcile auth (A) — `auth.uid()` reliably present ("sign in to save").
3. **Lay the lifecycle spine** (D) — the 13 entity tables + FK + `workspace_id` + sector field + TargetSpec version-anchor + the LotEvent append-only log. Internals deferred. *(MasterSpec coupling resolved 2026-06-16: Formulation-level, revision-boundary carry-forward.)*
4. Wire hydrate-on-mount + mirror-on-save on `workspace_id`; localStorage stays optimistic cache.
5. Version-state (B); opt-in/anonymization scaffolding (F, foundation only).
6. Heavy-metals risk-flag layer (G); sector-scope the saved-work lists (E/§8).
7. End-to-end round-trip test + extend the cloudSync harness.

**Posture (locked 2026-06-13):** WORKFLOW FIRST; August scope = #17 + #18 + #16 + §8 sweep; August AI = explanation-only (*explanation ≠ suggestion*); data-flywheel architecture goes in as **foundation**, not feature.

**Bottom line:** #17 is not "save backend." It is **lifecycle-workspace-schema-through-inventory** — commit the 13-entity spine (LotEvent included) + sector constraint now so 2028 Inventory is a feature, not a migration. Auth reconciliation is step 1; the spine is the bet.
