# Packaging Data Sheet — Implementation Plan (High-Level)

**Date:** 2026-05-27
**Status:** High-level skeleton; detailed phase scoping + MVP-vs-Q4 routing + parallelization waits for next session
**Companion:** [packaging-data-sheet-architecture-2026-05-27.md](packaging-data-sheet-architecture-2026-05-27.md)

---

## Purpose

This is the build skeleton. Eight phases capture the scope at a level where the next session can route phase ordering + MVP-vs-Q4 gating + parallelization opportunities with operator input. The phase contents are the architectural targets, not detailed implementation specs.

## Phase 1 — Extract existing PDS-shaped content from Build Base Sheet

**Goal:** Move the cards that already belong on the PDS off the Build Base Sheet UI. Same data, different home.

**Scope:**
- Add a new tab to `app/workspace/page.tsx` activeTab union — `'packaging'` (label "Packaging Data Sheet")
- Move these cards from Build Base Sheet → Packaging Data Sheet (in **both modes** — bilingual from day one):
  - Serving & Package Size card ([page.tsx:4487](../../app/workspace/page.tsx#L4487))
  - Delivery Form & Dosage card ([page.tsx:4806](../../app/workspace/page.tsx#L4806)) — includes the Capsule Capacity / Utilization diagnostic embedded at the bottom (not a separate card)
  - Packaging & Closure card ([page.tsx:4928](../../app/workspace/page.tsx#L4928)) — title-adaptive via `mc.packagingSectionTitle` ("Capsules, Bottles & Closures" in supplements mode)
- Add the tab button to the workspace nav in **both supplements and F&B modes** — the 3 cards already render mode-gated content, so the relocation is symmetric work. Capsule Capacity diagnostic stays supplements-only (already mode-gated). The real F&B divergence is Phase 6 (machinery), not Phase 1.
- Preserve all existing state variables and persistence — no schema migration; pure UI relocation
- Verify the Build Base Sheet's TOTAL row + recipe-level cards continue to render cleanly without the Packaging cards present (both modes)
- Verify the Batch Sheet's Per-Capsule Weight column + Serving math continue to pull from the now-relocated state
- F&B regression audit at extraction time — Phase 1 will surface any latent mode-gating bugs in the existing cards (feature, not cost)

**Risk:** None to data layer. Pure UI move. Same pattern as the Execution Canvas relocation (Build Base Sheet → Batch Sheet) shipped earlier this session.

**Time estimate:** 2-3 hours.

## Phase 2 — Identity layer

**Goal:** Add fields the PDS needs to BE a compliant document.

**Scope:**
- Finished-goods lot number (operator-entered OR auto-generated with format)
- Lot code format convention (e.g., "YYYYMMDD-NN" or "ABC-{batch}-{date}")
- Expiration / Best By date format
- UPC / GTIN
- Product SKU + revision number (link to Build Base Sheet's Part Number + Version)

**Risk:** Low. New fields on a new surface; no existing-behavior breakage.

**Time estimate:** 2 hours.

## Phase 3 — Labeling layer

**Goal:** Capture label specifications + content placement.

**Scope:**
- Front / back / neck label dimensions
- Label material + adhesive
- Printer specification
- Color spec / Pantone references
- Approved artwork reference (file name + revision + date — pointer, not file storage)
- Label content placement spec (where SFP prints, where allergen statement prints, where ingredient statement prints, where DSHEA disclaimer prints, where manufacturer info prints, where lot code + Best By prints, where UPC barcode prints)

**Risk:** Low.

**Time estimate:** 3-4 hours. Section-based UI for content placement is the time consumer.

## Phase 4 — Secondary + tertiary packaging

**Goal:** Carton + pallet specifications.

**Scope:**
- Carton / case
  - Units per case
  - Case dimensions + weight
  - Case material + branding
- Pallet configuration
  - Cases per layer + layers per pallet (with derived total units)
  - Pallet weight (gross + tare)
  - Pallet dimensions + tie/high pattern
- Pallet tags (content + format + placement spec)
- Stretch wrap + corner guards

**Risk:** Low. Simple structured fields.

**Time estimate:** 2-3 hours.

## Phase 5 — BOM + supplier traceability

**Goal:** Bill-of-materials per packaging component with supplier + part number linkage.

**Scope:**
- Per-component supplier + part number table (rows for: bottle, closure, induction seal, front label, back label, neck label, desiccant, carton, pallet tag stock, stretch wrap)
- Each row: component description + supplier + part number + drawing reference (if applicable) + approval date
- Linkage to the existing supplier-qualification system (`lib/supplierQualifications.ts` if present)

**Risk:** Medium. Touches supplier-qualification linkage which may need extension to packaging-component scope.

**Time estimate:** 4-5 hours.

## Phase 6 — Machinery settings

**Goal:** Operator-extensible equipment configuration block. Each facility's equipment varies; the structure must flex.

**Scope:**
- Section-based architecture with predefined section types (filler, sealer, label applicator, vision system, metal detector, date coder, pallet wrapper, capsule polisher, etc.)
- Each section: equipment ID + manufacturer + model + key settings (operator-defined fields per section)
- "Add custom section" affordance for equipment the platform doesn't predefine
- Per-section validation rules (operator-defined; the platform provides the structure, not the validation)

**Risk:** Medium. Schema flexibility is the design challenge — too rigid loses operators with non-standard equipment, too flexible loses validation value.

**Time estimate:** 5-7 hours. The schema design is the time consumer.

## Phase 7 — Quality acceptance criteria

**Goal:** Per-component QC acceptance criteria — what the operator's QA verifies against during packaging line operation.

**Scope:**
- Visual defect criteria (cosmetic acceptance — chips, scratches, label misalignment)
- Weight tolerance (fill weight check frequency + AQL)
- Seal integrity test (vacuum decay or pressure decay; method + frequency)
- Label placement tolerance (millimeter spec)
- Closure torque acceptance (target ± range)
- Per-criteria pass/fail rule + sampling plan (AQL standard reference like ANSI Z1.4)

**Risk:** Low to medium. Standard cGMP content; the schema is well-bounded.

**Time estimate:** 3-4 hours.

## Phase 8 — World-class polish + Convention A → B contract flip + safety-surface migration

**Goal:** Joy-of-mastery quality bar reached + Convention B shipped + safety surfaces migrated.

**Scope:**

### 8a — Polish
- Visual hierarchy across the 7 PDS sections
- Section-collapse + expand affordances
- Print/Save for the PDS itself (matches Build Base Sheet + Batch Sheet print pattern)
- Version control + revision history surface (linkage to ReviewState machinery)
- Cross-references to MMR + BPR (clickable links between documents)

### 8b — Convention A → B contract flip
GATED on Gates 1-5 from architecture memo §5.3 closing:
- Modify `computePerServingScale` in `lib/supplementMath.ts` (remove supplement identity branch; use F&B formula for both modes)
- Rewrite 16+ tests in `lib/__tests__/supplementMath.test.ts`
- Verify SFP / %DV / safety gate / cost rollup / stability propagation
- Amend [docs/architecture/catalog-authoring-rulebook.md](catalog-authoring-rulebook.md) §II.11
- Update `.claude/agents/catalog-entry-validator.md` + rulebook-extraction docs
- Saved-formulation migration (per plan from Gate 3)

### 8c — Safety-surface migration
- Move "formula doses don't fit in chosen serving" check to label-print gate (CC's Option C from original Problem B discussion)
- Validator-style refusal-bearing gate fires before SFP export if recipe-vs-delivery is inconsistent
- Operator override with documentation trail

**Risk:** High. This is the big-flip phase. Multiple downstream consumers + test suites + rulebook amendment + saved-formulation semantics.

**Time estimate:** 12-20 hours. Depends heavily on how clean the test suite rewrite is and whether Vit C bug verification surfaces edge cases.

## Cross-phase concerns

### Catalog-entry-validator coordination
Any rulebook §II.11 amendment in Phase 8b cascades into the validator subagent. The validator update should ship in the same commit as the rulebook amendment, with the catalog-entry-validator-v1-rulebook-extraction docs updated to reflect the new doctrine.

### Saved-formulation migration
Phase 8b requires migration. Options to evaluate at next session:
1. **In-place reinterpretation** — silently reinterpret saved qty as proportions; risky for shipped labels
2. **Version-stamped Convention** — store a `convention: 'A' | 'B'` field on saved formulations; renderers check the field; old formulations stay Convention A
3. **Operator-flagged review-and-confirm** — on first reload after Convention B ships, prompt operator to confirm interpretation per formulation
4. **Per-formulation selector** — operator chooses Convention at formulation creation time

Recommended (CC's lean): Option 2 (version-stamped) with Option 3 (review-and-confirm) for ambiguous cases. Preserves existing behavior for old formulations while enabling new behavior for new ones.

### MVP vs Q4 gating
For August 2026 launch (Phases 1-5 + 7 are bilingual at the schema level; Phase 6 machinery is the genuine mode-divergence point):
- **MVP-required**: Phases 1-2 (extraction + identity layer) — closes the architectural conflation visibly without contract risk; bilingual from day one (supplements + F&B)
- **MVP-strong-want**: Phase 3 (labeling) + Phase 4 (secondary/tertiary) — bilingual; label content placement differs by mode (SFP vs NFP, DSHEA disclaimer vs none) but schema is shared
- **Post-launch / Q4 2026**: Phases 5-7 (BOM, machinery, QC) — depth that small-shop operators don't need at launch. **Phase 6 (machinery) is where mode-specific work concentrates** — F&B retort/hot-fill/pasteurizer/acidified-foods filler menus diverge from supplements capsule polisher/blister sealer/bottle filler menus
- **Post-launch with verification gate**: Phase 8 (Convention B + safety migration) — requires Gates 1-5 closed; safer to defer until post-launch operational learning informs the migration plan

### Parallelization opportunities
- Phases 2 + 3 + 4 can run in parallel (independent surfaces; same UI tab)
- Phase 5 (BOM) depends on Phase 4 (secondary/tertiary defines the components needing supplier-traceability)
- Phase 6 (machinery) is independent of 2-5; can run in parallel
- Phase 7 (QC) can run in parallel with 5 + 6
- Phase 8 sequential dependency on all prior phases + Gates 1-5

## Open questions for next session

1. **Phase 1 tab name** — "Packaging Data Sheet" full or "PDS" abbreviated for the tab button? (Affects mobile + small-screen rendering.)
2. ~~**F&B mode PDS shape** — does Phase 1 add the PDS tab in F&B mode too?~~ **RESOLVED 2026-05-27: bilingual from day one.** Phase 1 adds the PDS tab in both modes. F&B-specific divergence (acidified-foods Form 2541 references, F&B machinery menus) defers to Phase 6 and Q4 work — not Phase 1.
3. **Print artifact** — when the operator hits "Print/Save" on the PDS, does it generate a single PDF spanning all 7 sections, or one PDF per section? CDMOs typically use single document.
4. **Linkage to ReviewState machinery** — does the PDS go through the same draft → submitted → approved → version-locked lifecycle as the Base Sheet? If yes, ReviewState extends to track which PDS version a BPR inherits from.
5. **Schema migration for existing saved formulations** — do they need a PDS auto-attached at first load post-Phase-1, with default values seeded from the old Build Base Sheet state?
6. **Linkage to Batch Sheet's Part # column** — currently the Batch Sheet's ingredient table has a Part # column populated from the Build Base Sheet. The Packaging-component Part # (in PDS Phase 5 BOM) is a separate concept. Naming clarity?

## Time estimate summary

| Phase | Estimate |
|---|---|
| 1 — Extract existing | 2-3h |
| 2 — Identity | 2h |
| 3 — Labeling | 3-4h |
| 4 — Secondary/tertiary | 2-3h |
| 5 — BOM | 4-5h |
| 6 — Machinery | 5-7h |
| 7 — QC criteria | 3-4h |
| 8 — Polish + Convention B + safety migration | 12-20h |
| **Total** | **33-48h** |

For an MVP launch path (Phases 1-2 + 3 + 4): ~9-12h. Reasonable for a single CC session or two paired sessions.

## Status

- **Skeleton**: locked at high level
- **Next session**: detailed phase scoping, MVP-vs-Q4 routing decisions, parallelization, open-questions resolution
