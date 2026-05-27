# Packaging Data Sheet — Architecture Memo

**Date:** 2026-05-27
**Status:** Architecture-locked at operator + Claude session; implementation scoped at high-level (8 phases) in companion memo
**Companion:** [packaging-data-sheet-implementation-plan-2026-05-27.md](packaging-data-sheet-implementation-plan-2026-05-27.md)
**Related architecture:** [base-sheet-batch-sheet-architecture-2026-05-23.md](base-sheet-batch-sheet-architecture-2026-05-23.md)

---

## 1. Why this memo exists

The platform's Base Sheet currently conflates two distinct cGMP documents into one UI tab:

1. **Master Manufacturing Record (MMR)** — the recipe, in proportions, per 21 CFR 111.205
2. **Packaging Data Sheet (PDS)** — the delivery format specification, per 21 CFR 111.65 + 111.70(g) packaging-and-labeling controls

The Convention A vs B math question that surfaced during the 2026-05-26 / 27 Base Sheet polish session (whether ingredient row qty is per-serving label-claim dose vs recipe proportion) is a downstream symptom of this conflation. Once the documents are separated, the math question dissolves — Convention B emerges naturally because the Base Sheet has no per-cap weight context to confuse the math.

This memo locks the three-document architecture and scopes the Packaging Data Sheet as a peer tab.

## 2. The three-document model

| Document | Concern | Audience | 21 CFR § |
|---|---|---|---|
| **Build Base Sheet** (MMR) | Recipe in proportions + reference weight + ingredient identity + sub-ingredients + allergen profile + regulatory routing | Brand author / formulation chemist | 111.205 |
| **Packaging Data Sheet** (PDS) | Container + closure + per-unit fill + units per serving + label dimensions + secondary/tertiary packaging + machinery settings + finished-goods lot format + pallet config | Packaging engineer / line operator / brand packaging owner / QA reviewer | 111.65, 111.70(g), 111.80 |
| **Batch Sheet** (BPR) | Per-run capture — batch #, operator, raw-material lots, actual weights, times, deviations, signatures | Batcher / QA Manager | 111.255 |

Each document references the others. The BPR inherits from a locked MMR + PDS version pair. The PDS references the MMR for ingredient identity. The MMR references the PDS for derived per-serving doses (the SFP rendering surface).

## 3. PDS scope

The PDS scales from one-page (small-shop operations) to 16-page (CDMO with full audit traceability). Section-based architecture lets the operator expand to the depth their compliance program demands.

### 3.1 Identity layer
- Finished-goods lot number (distinct from raw-material lots on BPR)
- Lot code format convention
- Expiration / Best By date format
- UPC / GTIN
- Product SKU + revision number

### 3.2 Primary packaging
- Container — bottle / jar / sachet / blister / softgel-foil
  - Material (PET, HDPE, PP, glass, aluminum-foil composite)
  - Dimensions + weight
  - Supplier + part number
  - Color / opacity (relevant for light-sensitive contents — e.g., omega-3s require amber)
- Closure
  - Cap type + material
  - Liner spec
  - Tamper-evidence (heat-shrink band, induction seal, etc.)
  - Induction-seal type (if applicable)
- Per-unit fill
  - Target fill weight + tolerance (±%)
  - Headspace target
  - Units per container
- Desiccant / oxygen-absorber (if applicable)

### 3.3 Labeling
- Front label, back label, neck label
  - Dimensions
  - Material + adhesive
  - Printer specification
  - Color spec / Pantone references
- Approved artwork reference (file name + revision + date)
- Label content surfaces
  - Where the Supplement Facts Panel prints
  - Where the allergen "Contains:" statement prints
  - Where the ingredient statement prints
  - Where the DSHEA disclaimer prints
  - Where the manufacturer name + address prints
  - Where the lot code + Best By prints
  - Where the UPC / GTIN barcode prints

### 3.4 Secondary + tertiary packaging
- Carton / case
  - Units per case
  - Case dimensions + weight
  - Case material + branding
- Pallet configuration
  - Cases per layer
  - Layers per pallet
  - Total units per pallet
  - Pallet weight (gross)
  - Pallet dimensions
  - Tie + high
- Pallet tags
  - Content + format
  - Placement spec
- Stretch wrap + corner guards (if applicable)

### 3.5 BOM + quality
- Bill of materials for ALL packaging components with supplier + part number
- Approved drawings / artwork references
- Quality acceptance criteria
  - Visual defects (cosmetic acceptance)
  - Weight tolerance
  - Seal integrity tests (vacuum or pressure decay)
  - Label placement tolerance
  - Closure torque acceptance
- Revision history

### 3.6 Machinery settings
Operator-extensible layer. Equipment varies wildly by facility. Examples:
- **Capsule filler** — dosator/tamping pin diameter, fill weight check frequency, AQL for weight check
- **Capsule polisher** — speed, brush settings
- **Bottle filler** — fill speed, fill weight target, headspace, vacuum
- **Induction sealer** — power setting, dwell time, coolant
- **Label applicator** — speed, sensor settings, label placement tolerance
- **Cap torquer** — torque setting, validation frequency
- **Vision system** — label inspection, fill-height inspection settings
- **Metal detector** — sensitivity, validation frequency, reject mechanism
- **Date coder / lot marker** — print settings, font, placement spec
- **Pallet wrapper** — wrap count, tension setting

Some facilities document every settable parameter; others reference only the critical settings. The platform provides the STRUCTURE (sections + validation + version control); operators fill it to the depth their compliance program requires.

## 4. Quality bar — World-class Fortune 500

The PDS sits at the same quality bar as the BPR. Operator framing 2026-05-27: *"we need to think about this as another World Class Fortune 500 Document."* This is the [[joy-of-mastery-brand-philosophy]] register applied to a packaging-engineering artifact.

Design implications:
- **Section-based architecture** — operator expands depth where compliance demands; collapses where it doesn't
- **Template-driven scale** — small-shop one-pager vs CDMO 16-pager from the same base structure
- **Visually polished by default** — this is the document handed to packaging suppliers, line operators, FDA auditors. Beautiful is the brand moat, not post-launch polish.
- **Version-controlled with audit trail** — every revision logged with date + author + changes
- **Linkage to MMR + BPR** — explicit cross-references so an auditor following a thread can navigate

## 5. Convention A vs B — resolved-direction with explicit gates

### 5.1 Resolved-direction: Convention B

Once the PDS owns per-cap fill + units per serving + delivery format, Convention B is the natural reading of the math. The Base Sheet holds recipe in proportions; the PDS holds delivery; per-serving dose = ingredient_percentage × serving_mass (where serving_mass = per_cap_fill × units_per_serving from the PDS).

### 5.2 The Vit C bug reframe

The Round 11 Finding #25 production bug (Vit C 500mg → 1942mg display) was specifically fixed by locking in Convention A (scale = 1.0 for supplement mode). The "DO NOT WEAKEN THE MODE-GATE" doctrine in [lib/supplementMath.ts](../../lib/supplementMath.ts) is emphatic about not reverting.

Under the three-document model, the same bug case looks different:
- Ingredients: Vit C 500mg + Vit D3 25mcg + Zinc 15mg (total ~515mg)
- Serving size: "2 capsules" was interpreted as 2g by old F&B math
- The bug was arguably a **serving-size INPUT issue** (treating "2 capsules" as 2g instead of per-cap × 2)
- Under Convention B with correct PDS-derived serving mass (per-cap × 2 = ~515mg for this recipe), Vit C displays 500mg correctly
- Under Convention B with mismatched serving mass (per-cap × 2 = 200mg), Vit C displays 194mg — the SFP honestly reflects what's actually delivered, surfacing the recipe-vs-delivery mismatch to the operator

The Vit C bug root cause needs co-founder verification before the contract flips. If serving-size INPUT was the root cause, Convention B with correct PDS architecture is the upgrade. If math-scale was the root cause, Convention B may resurface the bug from a different angle.

### 5.3 Gates (must close before Convention B ships)

1. **Gate 1 — PDS Phases 1-7 land first.** Convention B is a consequence of PDS extraction; without the PDS surface, ingredient row qty has nowhere else to be interpreted FROM except per-serving doses. The Base Sheet's reference weight + percentages framing requires the PDS to own per-cap fill + units math.

2. **Gate 2 — Vit C bug root cause confirmed.** Was it serving-size INPUT or math-scale? Co-founder may remember the original incident better than this memo's reconstruction. Documented confirmation needed before flipping the contract.

3. **Gate 3 — Saved-formulation migration plan.** Existing saved formulations carry quantities semantically interpreted as per-serving doses under Convention A. Under Convention B those same numbers become recipe proportions — different SFP output. Migration strategy needed: in-place reinterpretation, version-stamped formulations, operator-flagged review-and-confirm, or per-formulation Convention selector.

4. **Gate 4 — Test suite rewrite plan.** 16+ tests in [lib/__tests__/supplementMath.test.ts](../../lib/__tests__/supplementMath.test.ts) lock Convention A (Section 1A-1D contract assertions). Downstream test suites for [SFP rendering](../../lib/__tests__/supplement-b12-dv-resolution.test.ts), [%DV computation](../../lib/supplementLabeling.ts), [safety gates](../../lib/__tests__/supplement-bucket-1-gate.test.ts), [cost rollup](../../lib/__tests__/supplement-net-quantity-gate.test.ts), [stability](../../lib/__tests__/supplement-stacks.test.ts), and others propagate the scale value and need verification they don't break in subtle ways.

5. **Gate 5 — Safety-surface migration check.** Convention B's per-serving-dose computation lives downstream of PDS-owned per-cap fill. The "formula doses don't fit in chosen serving" warning that previously lived in the Capsule Utilization diagnostic needs to land elsewhere — likely at label-print stage (per CC's Option C from the original Problem B discussion). Where does this check live, and what fires it?

## 6. Downstream surfaces affected by Convention A → B flip

- **`lib/supplementMath.ts`** — `computePerServingScale` mode-gate flip (remove supplement-mode identity-1.0 branch; return F&B formula for both modes)
- **`lib/__tests__/supplementMath.test.ts`** — 16+ tests rewritten under proportional semantics
- **`lib/supplementLabeling.ts`** — `buildSupplementFacts` auto-updates via scale value
- **`lib/supplementSafetyLimits.ts`** — `checkSupplementSafety` UL inputs use derived per-serving doses
- **Stability + Overage table** — target weights derive from label-claim doses (now derived)
- **Cost-per-serving** — uses derived dose × cost
- **`app/workspace/page.tsx`** — multiple consumers via scale (SFP render, %DV display, cost rollup, stability bottleneck)
- **`docs/architecture/catalog-authoring-rulebook.md` §II.11** — doctrine amendment (label-claim vs ingredient-mass)
- **`.claude/agents/catalog-entry-validator.md`** — validator subagent enforces §II.11 as written; rulebook amendment cascades into validator update
- **`docs/agents/catalog-entry-validator-v1-rulebook-extraction.md`** — companion extraction doc tracking validator changes
- **Saved formulations in localStorage** — semantic shift; migration strategy required

## 7. Migration path for current platform UI

The Build Base Sheet currently contains PDS-shaped content. Phase 1 of implementation moves it out.

### Currently on Build Base Sheet (belongs on PDS)
- Serving & Package Size card (per-cap weight, units per serving, servings per container)
- Delivery Form & Dosage card (delivery form, units per serving, capsule size, intended audience)
- Capsules, Bottles & Closures card (container + closure selection)
- Capsule Capacity / Utilization diagnostic
- Producibility tile content (delivery-format-feasibility check)

### Currently on Build Base Sheet (stays on Build Base Sheet — recipe-level)
- Formulation Name + Product Type
- Product Class
- Specs to Track
- Add Ingredient + Bulk Paste
- Current Formulation card (ingredient list with proportions)
- TOTAL row
- Determination Engine card (DSHEA / 21 CFR 111 routing)
- NDI Compliance Check
- Supplement Facts Panel preview (label artifact — actually belongs on PDS conceptually but tightly bound to recipe; routing TBD)
- Stability & Overage table (ingredient-level; recipe-level)
- Ingredient Compatibility findings
- Suggested cGMP Program

### To be added (new PDS surface)
- Identity layer (finished-goods lot #, lot format, expiration format, UPC/GTIN)
- Labeling layer (artwork ref, label dimensions, materials, content placement)
- Secondary + tertiary packaging (cartons, pallets, pallet tags)
- BOM + supplier traceability per component
- Machinery settings (operator-extensible)
- Quality acceptance criteria

## 8. Sequencing — what's gated on what

```
PDS Phase 1: extract existing PDS-shaped content from Build Base Sheet
       ↓
PDS Phases 2-7: build out PDS depth (identity, labeling, secondary/tertiary, BOM, machinery, QC)
       ↓
       Gates 2-5 close in parallel (Vit C verification, migration plan, test rewrite plan, safety-surface plan)
       ↓
Convention A → B contract flip (Phase 8)
       ↓
SFP renders derived doses from PDS-owned serving math
```

The 8-phase implementation plan (companion memo) details phase ordering, parallelization opportunities, and MVP-vs-Q4 gating.

## 9. Operator key quotes (2026-05-27 session)

- *"the weight of the base sheet build matters and should be there for reference"*
- *"All of the specs estimated and supplement facts should not be coming off of the base sheet weight total. They should come from capsule weight. The dosage should come from the percentage of ingredients in the capsule weight."*
- *"if there are 6 units per serving that would be the percentage of one capsule x 6 and the supplement facts needs to pick that up accurately"*
- *"34.0% of each capsule has creatine in it x 6 or x 2 it needs to be accurate"*
- *"The Packaging Data Sheet is specific to packaging data, Its another tab like base sheet and batch sheet and its the backbone of compliant manufacturing"*
- *"sometimes they have machinery settings and all kinds of things on there so we need to think about this as another World Class Fortune 500 Document"*

## 10. Status

- **Architecture**: locked
- **Implementation plan**: high-level skeleton in companion memo
- **Convention A vs B**: resolved-direction (B) with 5 gates
- **Next session**: detailed phase scoping, MVP-vs-Q4 routing, parallelization
