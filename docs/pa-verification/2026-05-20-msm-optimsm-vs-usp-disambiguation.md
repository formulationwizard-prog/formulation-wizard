# MSM (OptiMSM vs USP) — Positioning Disambiguation Pending

**Queued:** 2026-05-20
**Round / Section:** Q-Audit-1 routing → Round 12 Phase 2 verification queue (B4.3.3 deferral)
**Status:** PENDING

## What's Needed from PA / Supplier-COA

Disambiguate whether two `MSM (Methylsulfonylmethane, ...)` catalog entries represent:

- **(a)** Two distinct products with different positioning despite shared Bergstrom Nutrition supplier on both, OR
- **(b)** Same product with catalog-authoring inconsistency on naming

The entries:

- Line 93 `MSM (Methylsulfonylmethane, OptiMSM)` Specialty Compounds @ $18/kg — Bergstrom Nutrition (OptiMSM) + Balchem
- Line 297 `MSM (Methylsulfonylmethane, USP)` Specialty @ $9.80/kg — Bergstrom Nutrition (OptiMSM) + Cardinal Nutrition

Per §II.9a Refinement 4 (pre-consolidation positioning-in-naming check), naming-encoded positioning differs between entries — line 93 names OptiMSM brand explicitly; line 297 uses USP-only framing. Consolidation would erase positioning encoded in line 93's name. Cannot resolve without supplier-COA evidence.

## Where This Lands Once Verified

`lib/data/supplements.ts` lines 93 + 297. Resolution paths:

- **(a) Two distinct products confirmed:** retain both as tier-pair after Specialty → Specialty Compounds migration (Q-Audit-3 0.5c.i); rename per §II.9a to explicit tier framing (e.g., `MSM (Methylsulfonylmethane, OptiMSM Branded)` vs `MSM (Methylsulfonylmethane, USP, Commodity Sourcing)`); Cardinal Nutrition migrates as `commonlyDistributedThrough` reference per manufacturer/vendor refactor
- **(b) Same product with naming inconsistency:** consolidate to survivor (likely line 93 with OptiMSM branding); supplier-set union add Cardinal Nutrition appropriately classified per manufacturer/vendor refactor; deprecate other entry

## Open Questions for PA / Supplier-COA

1. Does Bergstrom Nutrition sell TWO distinct MSM products — OptiMSM branded form + generic USP form — at different price points? Or only OptiMSM branded?
2. If only OptiMSM: is Cardinal Nutrition a Bergstrom distributor (Cardinal sells OptiMSM under different framing) OR an independent commodity USP supplier?
3. What's the actual cost-spec for OptiMSM branded form per Bergstrom direct? The $9.80 on line 297 may reflect a non-OptiMSM commodity USP that Cardinal carries.
4. Per Round 12 Step 1 manufacturer/vendor refactor: who is the actual manufacturer in each case? Bergstrom for both, or different upstream manufacturer for the commodity USP product?

## Context

Surfaced during Q-Audit-1 per-pair routing (B4.3.3 push-back accepted; see `docs/audits/q-audit-1-final-routing.md` Section 7). The discipline-refinement question this pair triggered: when consolidation would erase positioning encoded in naming, supplier-COA verification is required before routing per §II.9a Refinement 4. Same shape as K2 MK-7 — surface-level naming differences signal substantive product distinctions that supplier-COA evidence can resolve.

**Step 0.5 disposition:** Both entries retain with `PENDING SPEC VERIFICATION` suffix; line 297 still migrates Specialty → Specialty Compounds per Q-Audit-3 0.5c.i.
