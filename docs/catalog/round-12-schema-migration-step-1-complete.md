# Round 12+ Schema Migration — Step 1 COMPLETE

**Status:** Step 1 (TypeScript schema additions to `IndustrialIngredient`) **LANDED 2026-06-18** (commit `efa54e1`).

This file is the **authoritative §II.8 "Step-1 detection" marker** — referenced by the §II.8 transition rider's Step-1 detection protocol and by the catalog-entry-validator's verdict logic. Its existence confirms the world-class universal-required schema fields now exist on `IndustrialIngredient`. (The validator also greps `types/index.ts`; marker + type-system now **agree** → determination is "Step 1 landed." A CI test asserts they stay in agreement.)

## Fields landed (all optional / additive — `types/index.ts`)
- `confidenceLevel` (§I.4), `tier` (§III.16), `citation: CatalogCitation[]` with `retrievedAt` (§I.2)
- `canonicalIdUnii` / `canonicalIdUspLatin` / `canonicalIdGtin` (§14a)
- `lastReviewedDate` / `reviewedBy` (§28 / Gap #4)
- `allergensInvestigated` / `allergensFound` (§I.5 / Gap #6)
- `heavyMetalsVectorOverride` (§I.5a)

## What this CHANGES — validator enforcement flips ON
- **NEW entries (Cat 2) authored from 2026-06-18 forward MUST carry the universal-required fields.** The §II.8 forward-looking requirement is now **active** — missing them is **PUSHBACK-ENTRY (blocking)**, not the prior PUSHBACK-STRUCTURAL deferral.
- The "same-category parity" fallback (which applied while Step 1 had **not** landed) no longer applies to new entries.
- **No new entry can enter below the world-class bar.**

## What this does NOT change
- The ~367 **pre-existing** entries remain **grandfathered** (un-backfilled — the audit shows ~0% populated) pending the **verified-curation phase** (migration steps 2–8). PUSHBACK-STRUCTURAL still applies to *Cat-1 backfill* of those entries, **not** to new entries.
- **Population is verified, never bulk** (§I.2 / §I.4 / §14a). Landing the *fields* is not landing the *values*.

## Verification
- `types/index.ts` carries the field shapes (Step-1 type-system check PASSES); `tsc` clean; full suite green.
- The audit (`lib/catalogAudit.ts`) measures coverage of these fields (currently ~0% populated — the curation backlog).
- References: `docs/architecture/catalog-schema-fields-directive-2026-06-17.md`, `project_catalog_phase1_audit_asset`.

## Still open (NOT closed by Step 1)
Migration steps 2–8 (verified backfill of `confidenceLevel` / `regulatoryStatus` object form / structured `citation[]` / `lastReviewed` / allergen-flag / per-category fields) remain the curation phase. The §II.8 rider is **not** retired until that wave lands; PUSHBACK-STRUCTURAL retires only then.
