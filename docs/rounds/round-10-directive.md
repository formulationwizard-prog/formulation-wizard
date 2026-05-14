# Round 10 — AF Harm-Critical Documentation Infrastructure

Drafted 2026-05-14. Pending Claude Code scoping refinement.

---

## Required Reading

Before scoping this round, read:

- `docs/audits/acidified-foods-spoke-verification-2026-05-12.md` (verification items and architectural concerns)
- `docs/brand/brand-book-part-1.md` (operator audience, brand vision)
- `docs/brand/brand-book-part-2.md` (voice and tone discipline)
- `docs/rounds/round-9-directive.md` (prior round, routing decisions)
- `docs/audits/catalog-inventory-2026-05-07.md`
- `docs/audits/catalog-gap-analysis-2026-05-07.md`
- `docs/audits/nutraceuticals-workspace-audit-2026-05-08.md`
- `docs/design/filing-readiness.md`

If any required document is missing, halt and report before proceeding.

---

## Goal

Close the five harm-critical AF UNKNOWN items routed from Round 9 by building the documentation infrastructure that captures them: PA-review state machinery (field-level authority architecture), Packaging Data Sheet, Pre-production checklist, and the supporting artifacts that flow into the PA-review packet.

The strategic frame: the workspace must produce PA-review-ready packets with field-level provenance, harm-critical enforcement, and version-locked snapshots before first paying customers can ship to production. This round delivers that infrastructure.

---

## Foundational Architecture

**Field-level authority within templated documents.**

Every regulated artifact in the workspace (Base Sheet, Batch Sheet, Pre-production checklist, Packaging Data Sheet, HACCP plan, Process Flow Diagram, Allergen statement, Nutrition Facts panel, Ingredient statement, Net quantity declaration) carries multiple field types within a single template. Each field is tagged with its authority:

- **User-editable**: operator authors and modifies freely
- **PA-establishes**: only the customer's Process Authority can set the value; once set, the field locks with PA identity and timestamp
- **System-derived**: workspace calculates from the Base Sheet automatically (scaled batch amounts, ingredient statement ordering, etc.)
- **System-enforces**: harm-critical fields per the verification audit's Bucket A architecture (allergens, disease-claim blocks, identity-test enforcement, disclaimer verbatim text, net quantity unit conversion). System hard-blocks on validation failure.

The PA-review state machinery operates at the field level, not the artifact level. A formulation ships when ALL its PA-established fields across ALL its artifacts are signed and ALL its harm-critical fields validate.

This architecture replaces the artifact-level approval-gate pattern. It's the foundation that makes the five harm-critical UNKNOWN items wire up coherently.

---

## Pre-flight Investigation

Three verification audit items require engine investigation before main scope is finalized. Each affects whether existing spoke claims can stand or need revision:

- **Audit Item 1**: IQF produce thaw-loss and chemistry-shift modeling — verify modeling actively occurs vs metadata only
- **Audit Item 3**: Adjacent framework classification — verify whether LACF/PCQI/FSIS/AAFCO surface any classification logic or only Surface 4 placeholders
- **Audit Item 6**: Catalog count claim — verify actual ingredient count and audit discipline definition

Run as a pre-flight pass and surface findings before main implementation begins.

---

## In Scope for Round 10

### 1. PA-review state machinery (foundation — implement first)

- Field-level authority tags (user / PA-establishes / system-derived / system-enforces)
- Per-field locking on PA-established fields once value set
- Per-field version history with PA identity and timestamp
- Hard-stop validation on harm-critical fields (Bucket A)
- Aggregate formulation-level readiness state across all artifacts

### 2. Packaging Data Sheet (net-new artifact)

**Default printed length: two pages. Expandable** for additional sections if user or PA wants more detail. Some industry PDS templates run sixteen pages; some run one. Two pages is the operator-readable middle ground; the workspace should support expansion without forcing it.

Field authority distribution:

- **User-editable**: Product Name, Flavor, Package, Closure, Fill Level, Configuration (e.g., 12 X 16oz), Case Size, Pallet Configuration
- **PA-establishes**: Fill Temp, Inversion Time, Hold Time (when applicable). Scheduled process parameters per 21 CFR 114.
- **System-derived**: Net quantity from package × fill level
- **System-enforces**: Net quantity unit conversion (Bucket A harm-critical)

Locks on PA sign-off; version-locked snapshot with PA identity and timestamp.

### 3. Pre-production checklist (net-new artifact)

- Template authored per product (PA-influenced for harm-critical items)
- User-added: yes/no/initials per item, deviation notes
- PA-establishes: which items are harm-critical (block production if failed)
- System-enforces: hard-stop on harm-critical item failure

### 4. Five Round 9 UNKNOWN items, wired through the architecture

- **Scheduled Process establishment** → captured on Packaging Data Sheet (Fill Temp, Inversion Time, Hold Time fields, PA-establishes authority)
- **Container integrity testing** → captured on Packaging Data Sheet (Container/Closure fields plus testing program documentation)
- **FCE registration (Form 2541)** → derived from Packaging Data Sheet + Base Sheet, generated as PA-review packet artifact
- **SID submission (Form 2541e)** → derived from Packaging Data Sheet + scheduled process data, generated as PA-review packet artifact
- **PA sign-off docs** → aggregate of all PA-established fields across all artifacts, exportable as PA-review packet

### 5. Round 9 leftovers (verify, scope within Round 10 budget)

- Verified HACCP upload surface (currently only INFERRED via `lib/haccp.ts` template)
- Name the regulatory-classification panel (currently no user-visible header)
- Pathway-revert detection (suppress redundant escalation event on A→B→A transitions)
- Acid Food (21 CFR 114.3(b)(1)) reduced-requirement set decision
- Surface 1 discoverability variant

If budget tight, deprioritize Surface 1 discoverability and Acid Food reduced-requirement decision; flag for Round 11.

---

## Out of Scope (Round 11+)

- The eight supplementary AF surfaces (training records, sanitation logs, batch records, deviation handling, recall plan, supplier verification, equipment calibration, container specs)
- Base Sheet vs Batch Sheet differentiation (foundational data-model work, larger scope than Round 10 fits)
- Editable batch sheet units (g/oz/kg/lb) — folds into Batch Sheet work
- Phase 2 spec verification (Iron Bisglycinate, L. acidophilus NCFM, Calcium Carbonate Limestone sourcing)
- Licensing verification (L. paracasei F19 Probi standalone B2B)
- Spec system multi-product-class expansion (tablet/capsule/softgel metrics)
- Nutraceuticals workspace work (separate verification round)
- Spoke copy revisions (deferred until Round 10 ships and capability inventory runs)

---

## Verification Path

Path 2 (local dev visual review before commit). UI blast radius for new artifacts and field-level authority architecture is high.

Verification gates:

1. `npx tsc --noEmit` clean
2. `next build` clean
3. Local dev visual review of: PA-review state surfaces, Packaging Data Sheet (empty and PA-established states), Pre-production checklist, FCE/SID generated packet exports
4. Field-level authority enforced correctly: PA-established fields lock on sign-off; harm-critical fields hard-stop on validation failure; system-derived fields populate from Base Sheet
5. Audit trail: PA identity and timestamp captured on every PA-established field; version snapshots produced at sign-off

---

## Commit and Branching

Branch: `feat/round-10-harm-critical-infrastructure`. Do not push to main. Stay on the feature branch. Open a PR draft when ready; do not merge without operator review.

Audit-trail commit message format per Rounds 8 and 9.

---

## Findings to Surface

Each finding tagged with explicit routing:

1. The PA-review state machinery architecture (field-level authority) replaces any prior artifact-level approval-gate pattern. Migration of existing artifacts to the new architecture may be required → flag scope if so.

2. Packaging Data Sheet default printed length is two pages. If the field set requires more pages to fit comfortably, surface for operator decision rather than auto-truncating.

3. Round 9 leftovers may exceed Round 10 budget. Deprioritize Surface 1 discoverability or Acid Food reduced-requirement decision if needed; flag for Round 11.

4. Five harm-critical UNKNOWN items each connect to Packaging Data Sheet structure. If any item turns out to require fields beyond what PDS captures, surface as a finding rather than expanding PDS without operator review.

5. Spoke copy revisions are out of scope. If implementation work surfaces capabilities that go beyond what the locked spoke claims, log as a "spoke revision queue" finding for the next spoke revision pass.

---

## Begin

Read required documents first. Run the pre-flight investigation pass on Audit Items 1, 3, and 6, and surface findings before main scope finalizes. Use defer-permission discipline if architectural questions exceed Round 10 scope.
